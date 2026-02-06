-- Seed initial material categories
-- These provide the base taxonomy for organizing materials.
-- Additional categories can be added via the admin interface.
INSERT INTO material_categories (name, display_name, sort_order) VALUES
  ('lumber', 'Lumber & Framing', 1),
  ('windows', 'Windows & Doors', 2),
  ('cabinets', 'Cabinets & Countertops', 3),
  ('flooring', 'Flooring', 4),
  ('roofing', 'Roofing', 5),
  ('hardware', 'Hardware & Fasteners', 6),
  ('other', 'Other Materials', 99)
ON CONFLICT (name) DO NOTHING;
