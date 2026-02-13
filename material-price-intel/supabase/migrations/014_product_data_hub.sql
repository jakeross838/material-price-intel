-- ===========================================
-- MIGRATION 014: Product Data Hub
-- Adds product URL, manufacturer, model number,
-- and scraped product data to project_selections.
-- Extends selection_images for document attachments.
-- Adds new material categories.
-- ===========================================

-- ===========================================
-- ALTER: project_selections - add product data columns
-- ===========================================
ALTER TABLE project_selections
  ADD COLUMN product_url TEXT,
  ADD COLUMN manufacturer TEXT,
  ADD COLUMN model_number TEXT,
  ADD COLUMN product_data JSONB;

-- ===========================================
-- ALTER: selection_images - add 'document' image_type
-- ===========================================
ALTER TABLE selection_images
  DROP CONSTRAINT selection_images_image_type_check;

ALTER TABLE selection_images
  ADD CONSTRAINT selection_images_image_type_check
  CHECK (image_type IN ('product_url', 'upload', 'web_search', 'ai_render', 'document'));

-- ===========================================
-- New material categories
-- ===========================================
INSERT INTO material_categories (name, display_name, sort_order) VALUES
  ('appliances', 'Appliances', 7),
  ('fixtures', 'Light Fixtures', 8),
  ('plumbing', 'Plumbing Fixtures', 9),
  ('paint', 'Paint & Finishes', 10),
  ('tile', 'Tile & Stone', 11)
ON CONFLICT DO NOTHING;

-- ===========================================
-- INDEXES for new columns
-- ===========================================
CREATE INDEX idx_project_selections_manufacturer ON project_selections(manufacturer);
CREATE INDEX idx_project_selections_model ON project_selections(model_number);
