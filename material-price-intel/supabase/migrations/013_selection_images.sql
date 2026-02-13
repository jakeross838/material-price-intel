-- ===========================================
-- MIGRATION 013: Selection Images & AI Analysis
-- Adds selection_images table for visual material
-- selections, ai_analysis JSONB column to
-- project_selections, and selection-images storage bucket.
-- ===========================================

-- ===========================================
-- ALTER: project_selections - add ai_analysis
-- ===========================================
ALTER TABLE project_selections
  ADD COLUMN ai_analysis JSONB;

-- ===========================================
-- TABLE: selection_images
-- ===========================================
CREATE TABLE selection_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id UUID NOT NULL REFERENCES project_selections(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL DEFAULT 'product_url'
    CHECK (image_type IN ('product_url', 'upload', 'web_search', 'ai_render')),
  storage_path TEXT,
  external_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  source TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one primary image per selection
CREATE UNIQUE INDEX idx_selection_images_primary
  ON selection_images (selection_id)
  WHERE is_primary = TRUE;

CREATE INDEX idx_selection_images_selection ON selection_images(selection_id);
CREATE INDEX idx_selection_images_type ON selection_images(image_type);

-- ===========================================
-- ENABLE RLS
-- ===========================================
ALTER TABLE selection_images ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS: selection_images (via selection -> room -> project -> org chain)
-- ===========================================
CREATE POLICY "selection_images_select" ON selection_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_selections
    JOIN project_rooms ON project_rooms.id = project_selections.room_id
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_selections.id = selection_images.selection_id
      AND projects.organization_id = public.user_org_id()
  ));

CREATE POLICY "selection_images_insert" ON selection_images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM project_selections
    JOIN project_rooms ON project_rooms.id = project_selections.room_id
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_selections.id = selection_images.selection_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "selection_images_update" ON selection_images FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM project_selections
    JOIN project_rooms ON project_rooms.id = project_selections.room_id
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_selections.id = selection_images.selection_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "selection_images_delete" ON selection_images FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM project_selections
    JOIN project_rooms ON project_rooms.id = project_selections.room_id
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_selections.id = selection_images.selection_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

-- ===========================================
-- STORAGE: selection-images bucket
-- ===========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('selection-images', 'selection-images', false);

-- Storage RLS: org-scoped paths (path format: {org_id}/{selection_id}/{filename})
CREATE POLICY "selection_images_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'selection-images'
    AND (storage.foldername(name))[1] = public.user_org_id()::TEXT);

CREATE POLICY "selection_images_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'selection-images'
    AND (storage.foldername(name))[1] = public.user_org_id()::TEXT
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "selection_images_storage_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'selection-images'
    AND (storage.foldername(name))[1] = public.user_org_id()::TEXT
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));
