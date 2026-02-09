-- ===========================================
-- MATERIAL ALIASES TABLE
-- Maps raw description variations to canonical materials
-- ===========================================
CREATE TABLE material_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,                    -- The raw description variation
  normalized_alias TEXT NOT NULL,         -- Lowercase trimmed for matching
  source_quote_id UUID REFERENCES quotes(id),  -- Which quote introduced this alias
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (material_id, normalized_alias)  -- Same alias can't map to same material twice
);

-- ===========================================
-- INDEXES on material_aliases
-- ===========================================
CREATE INDEX idx_material_aliases_material_id ON material_aliases(material_id);
CREATE INDEX idx_material_aliases_normalized_trgm ON material_aliases USING gin (normalized_alias gin_trgm_ops);

-- ===========================================
-- RLS POLICY for material_aliases
-- ===========================================
ALTER TABLE material_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY material_aliases_org_isolation ON material_aliases
  USING (
    material_id IN (
      SELECT id FROM materials WHERE organization_id = public.user_org_id()
    )
  );

-- ===========================================
-- ENHANCED find_similar_material: searches canonical names AND aliases
-- ===========================================
CREATE OR REPLACE FUNCTION find_similar_material(
  p_org_id UUID,
  p_search_name TEXT,
  p_threshold REAL DEFAULT 0.3
)
RETURNS TABLE(id UUID, canonical_name TEXT, similarity REAL) AS $$
BEGIN
  RETURN QUERY
  WITH canonical_matches AS (
    SELECT m.id, m.canonical_name,
           similarity(m.canonical_name, p_search_name) AS sim
    FROM materials m
    WHERE m.organization_id = p_org_id
      AND m.is_active = TRUE
      AND similarity(m.canonical_name, p_search_name) > p_threshold
  ),
  alias_matches AS (
    SELECT m.id, m.canonical_name,
           similarity(ma.normalized_alias, p_search_name) AS sim
    FROM material_aliases ma
    JOIN materials m ON ma.material_id = m.id
    WHERE m.organization_id = p_org_id
      AND m.is_active = TRUE
      AND similarity(ma.normalized_alias, p_search_name) > p_threshold
  ),
  all_matches AS (
    SELECT * FROM canonical_matches
    UNION ALL
    SELECT * FROM alias_matches
  )
  SELECT DISTINCT ON (am.id) am.id, am.canonical_name, am.sim AS similarity
  FROM all_matches am
  ORDER BY am.id, am.sim DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================================
-- MERGE MATERIALS: consolidate duplicates
-- ===========================================
CREATE OR REPLACE FUNCTION merge_materials(
  p_keep_id UUID,
  p_merge_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Verify caller owns both materials
  IF NOT EXISTS (
    SELECT 1 FROM materials WHERE id = p_keep_id AND organization_id = public.user_org_id()
  ) THEN
    RAISE EXCEPTION 'Keep material not found or access denied';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM materials WHERE id = p_merge_id AND organization_id = public.user_org_id()
  ) THEN
    RAISE EXCEPTION 'Merge material not found or access denied';
  END IF;

  -- Move all line_items from merge material to keep material
  UPDATE line_items SET material_id = p_keep_id WHERE material_id = p_merge_id;

  -- Move aliases from merge material to keep material (skip duplicates)
  INSERT INTO material_aliases (material_id, alias, normalized_alias, source_quote_id)
  SELECT p_keep_id, alias, normalized_alias, source_quote_id
  FROM material_aliases WHERE material_id = p_merge_id
  ON CONFLICT (material_id, normalized_alias) DO NOTHING;

  -- Add the merged material's canonical_name as an alias on the kept material
  INSERT INTO material_aliases (material_id, alias, normalized_alias)
  VALUES (p_keep_id, (SELECT canonical_name FROM materials WHERE id = p_merge_id),
          LOWER(TRIM((SELECT canonical_name FROM materials WHERE id = p_merge_id))))
  ON CONFLICT (material_id, normalized_alias) DO NOTHING;

  -- Delete aliases that pointed to merged material
  DELETE FROM material_aliases WHERE material_id = p_merge_id;

  -- Deactivate the merged material (soft delete to preserve history)
  UPDATE materials SET is_active = FALSE WHERE id = p_merge_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- ===========================================
-- TRIGGER: Fire normalization Edge Function on quote approval
-- Uses same pg_net pattern as 007_extraction_trigger.sql
-- ===========================================
CREATE OR REPLACE FUNCTION trigger_normalize_materials()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when is_verified changes to TRUE
  IF NEW.is_verified = TRUE AND (OLD.is_verified IS DISTINCT FROM TRUE) THEN
    PERFORM net.http_post(
      url := 'https://xgpjwpwhtfmbvoqtvete.supabase.co/functions/v1/normalize-materials',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncGp3cHdodGZtYnZvcXR2ZXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0Mjc2NywiZXhwIjoyMDg2MjE4NzY3fQ.iSxBuZ_sXiVB5frP8SOur3_U2_GSzHfTDTEQEStl8Fs"}'::jsonb,
      body := jsonb_build_object('quote_id', NEW.id::text)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_quote_approved_normalize
  AFTER UPDATE ON quotes
  FOR EACH ROW
  WHEN (NEW.is_verified = TRUE AND OLD.is_verified IS DISTINCT FROM TRUE)
  EXECUTE FUNCTION trigger_normalize_materials();
