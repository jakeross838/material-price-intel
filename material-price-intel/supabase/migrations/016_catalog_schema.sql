-- ===========================================
-- MIGRATION 016: Material Catalog Schema
-- Adds material_images, material_documents,
-- room_category_mapping tables. Public RLS
-- policies for anonymous catalog browsing.
-- Storage bucket for catalog images.
-- ===========================================

-- ===========================================
-- TABLE: material_images
-- Material-level product images (reusable across projects)
-- Org scope inherited via material_id -> materials.organization_id
-- ===========================================
CREATE TABLE material_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  source TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one primary image per material
CREATE UNIQUE INDEX idx_material_images_primary
  ON material_images (material_id)
  WHERE is_primary = TRUE;

CREATE INDEX idx_material_images_material ON material_images(material_id);
CREATE INDEX idx_material_images_is_primary ON material_images(is_primary);

-- ===========================================
-- TABLE: material_documents
-- Spec sheets, install guides linked to materials
-- Org scope inherited via material_id -> materials.organization_id
-- ===========================================
CREATE TABLE material_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  doc_url TEXT NOT NULL,
  storage_path TEXT,
  doc_type TEXT NOT NULL DEFAULT 'spec_sheet'
    CHECK (doc_type IN ('spec_sheet', 'installation_guide', 'cut_sheet', 'warranty', 'care_guide', 'other')),
  file_size_bytes INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_material_documents_material ON material_documents(material_id);
CREATE INDEX idx_material_documents_type ON material_documents(doc_type);

-- ===========================================
-- TABLE: room_category_mapping
-- Which material categories apply to which room types
-- Global (not org-scoped) -- drives Phase 12 room selection flow
-- ===========================================
CREATE TABLE room_category_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES material_categories(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  UNIQUE (room_type, category_id)
);

CREATE INDEX idx_room_category_mapping_room ON room_category_mapping(room_type);

-- ===========================================
-- ENABLE RLS
-- ===========================================
ALTER TABLE material_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_category_mapping ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS: material_images
-- Public SELECT for catalog browsing (only active materials)
-- Org-scoped write via material_id -> materials.organization_id
-- ===========================================
CREATE POLICY "material_images_public_select" ON material_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM materials
    WHERE materials.id = material_images.material_id
      AND materials.is_active = TRUE
  ));

CREATE POLICY "material_images_insert" ON material_images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM materials
    WHERE materials.id = material_images.material_id
      AND materials.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "material_images_update" ON material_images FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM materials
    WHERE materials.id = material_images.material_id
      AND materials.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "material_images_delete" ON material_images FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM materials
    WHERE materials.id = material_images.material_id
      AND materials.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

-- ===========================================
-- RLS: material_documents
-- Same pattern as material_images
-- ===========================================
CREATE POLICY "material_documents_public_select" ON material_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM materials
    WHERE materials.id = material_documents.material_id
      AND materials.is_active = TRUE
  ));

CREATE POLICY "material_documents_insert" ON material_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM materials
    WHERE materials.id = material_documents.material_id
      AND materials.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "material_documents_update" ON material_documents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM materials
    WHERE materials.id = material_documents.material_id
      AND materials.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "material_documents_delete" ON material_documents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM materials
    WHERE materials.id = material_documents.material_id
      AND materials.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

-- ===========================================
-- RLS: room_category_mapping
-- Public SELECT (global reference data)
-- Admin-only write (no org scoping needed)
-- ===========================================
CREATE POLICY "room_category_mapping_public_select" ON room_category_mapping FOR SELECT
  USING (true);

CREATE POLICY "room_category_mapping_admin_insert" ON room_category_mapping FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "room_category_mapping_admin_update" ON room_category_mapping FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "room_category_mapping_admin_delete" ON room_category_mapping FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================================
-- PUBLIC SELECT on materials (active only)
-- New policy alongside existing org-scoped one from 004_rls_policies.sql
-- Allows anonymous catalog browsing for active materials
-- ===========================================
CREATE POLICY "materials_public_select" ON materials FOR SELECT
  USING (is_active = TRUE);

-- ===========================================
-- PUBLIC SELECT on material_categories
-- New policy alongside existing auth-required one from 004_rls_policies.sql
-- Allows anonymous catalog browsing of categories
-- ===========================================
CREATE POLICY "categories_public_select" ON material_categories FOR SELECT
  USING (true);

-- ===========================================
-- STORAGE: material-catalog bucket (public)
-- Catalog images should be publicly accessible
-- ===========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('material-catalog', 'material-catalog', true);

-- Public read for catalog images
CREATE POLICY "material_catalog_storage_public_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'material-catalog');

-- Org-scoped upload (path: {org_id}/{material_id}/{filename})
CREATE POLICY "material_catalog_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'material-catalog'
    AND (storage.foldername(name))[1] = public.user_org_id()::TEXT
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

-- Org-scoped delete
CREATE POLICY "material_catalog_storage_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'material-catalog'
    AND (storage.foldername(name))[1] = public.user_org_id()::TEXT
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

-- ===========================================
-- SEED: room_category_mapping
-- Default mappings for 10 standard room types
-- Uses CROSS JOIN with subquery to look up category_id by name
-- ===========================================
INSERT INTO room_category_mapping (room_type, category_id, sort_order)
SELECT v.room_type, mc.id, v.sort_order
FROM (VALUES
  ('kitchen',     'cabinets',    1),
  ('kitchen',     'flooring',    2),
  ('kitchen',     'tile',        3),
  ('kitchen',     'fixtures',    4),
  ('kitchen',     'plumbing',    5),
  ('kitchen',     'appliances',  6),
  ('kitchen',     'paint',       7),
  ('master_bath', 'tile',        1),
  ('master_bath', 'plumbing',    2),
  ('master_bath', 'fixtures',    3),
  ('master_bath', 'cabinets',    4),
  ('master_bath', 'paint',       5),
  ('bathroom',    'tile',        1),
  ('bathroom',    'plumbing',    2),
  ('bathroom',    'fixtures',    3),
  ('bathroom',    'cabinets',    4),
  ('bathroom',    'paint',       5),
  ('great_room',  'flooring',    1),
  ('great_room',  'fixtures',    2),
  ('great_room',  'paint',       3),
  ('great_room',  'windows',     4),
  ('bedroom',     'flooring',    1),
  ('bedroom',     'fixtures',    2),
  ('bedroom',     'paint',       3),
  ('bedroom',     'windows',     4),
  ('dining_room', 'flooring',    1),
  ('dining_room', 'fixtures',    2),
  ('dining_room', 'paint',       3),
  ('dining_room', 'windows',     4),
  ('office',      'flooring',    1),
  ('office',      'fixtures',    2),
  ('office',      'paint',       3),
  ('laundry',     'tile',        1),
  ('laundry',     'plumbing',    2),
  ('laundry',     'fixtures',    3),
  ('laundry',     'cabinets',    4),
  ('laundry',     'paint',       5),
  ('garage',      'flooring',    1),
  ('garage',      'paint',       2),
  ('exterior',    'roofing',     1),
  ('exterior',    'windows',     2),
  ('exterior',    'exterior',    3),
  ('exterior',    'landscaping', 4),
  ('exterior',    'paint',       5)
) AS v(room_type, category_name, sort_order)
JOIN material_categories mc ON mc.name = v.category_name
ON CONFLICT (room_type, category_id) DO NOTHING;
