-- ===========================================
-- FUNCTION: Find similar materials using pg_trgm
-- ===========================================
CREATE OR REPLACE FUNCTION find_similar_material(
  p_org_id UUID,
  p_search_name TEXT,
  p_threshold REAL DEFAULT 0.3
)
RETURNS TABLE(id UUID, canonical_name TEXT, similarity REAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.canonical_name,
    similarity(m.canonical_name, p_search_name) AS similarity
  FROM materials m
  WHERE m.organization_id = p_org_id
    AND m.canonical_name % p_search_name
    AND similarity(m.canonical_name, p_search_name) > p_threshold
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================================
-- FUNCTION: Get material price history across suppliers
-- ===========================================
CREATE OR REPLACE FUNCTION get_material_price_history(
  p_material_id UUID,
  p_org_id UUID
)
RETURNS TABLE(
  supplier_name TEXT,
  quote_date DATE,
  quote_number TEXT,
  project_name TEXT,
  unit_price NUMERIC,
  unit TEXT,
  quantity NUMERIC,
  line_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.name AS supplier_name,
    q.quote_date,
    q.quote_number,
    q.project_name,
    li.unit_price,
    li.unit,
    li.quantity,
    li.line_total
  FROM line_items li
  JOIN quotes q ON li.quote_id = q.id
  JOIN suppliers s ON q.supplier_id = s.id
  WHERE li.material_id = p_material_id
    AND q.organization_id = p_org_id
  ORDER BY q.quote_date DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;
