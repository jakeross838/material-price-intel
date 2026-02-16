-- ===========================================
-- MIGRATION 019: Estimator Room Redesign Categories
-- Adds new categories for expanded room-by-room material selection:
-- toilets, baseboard, structural_framing, foundation, exterior_paint,
-- shower_enclosure, vanity, outdoor_lighting, pool, outdoor_kitchen_equip
-- ===========================================

INSERT INTO estimator_config (organization_id, category, finish_level, cost_per_sqft_low, cost_per_sqft_high, display_name, sort_order)
SELECT org.id, v.category, v.finish_level, v.low, v.high, v.display_name, v.sort_order
FROM (SELECT id FROM organizations LIMIT 1) org
CROSS JOIN (VALUES
  -- Toilets
  ('toilets',             'builder',   1.50,   2.50, 'Toilets',               35),
  ('toilets',             'standard',  2.50,   4.00, 'Toilets',               35),
  ('toilets',             'premium',   4.00,   7.00, 'Toilets',               35),
  ('toilets',             'luxury',    7.00,  12.00, 'Toilets',               35),

  -- Baseboards
  ('baseboard',           'builder',   1.50,   2.50, 'Baseboards',            36),
  ('baseboard',           'standard',  2.50,   4.00, 'Baseboards',            36),
  ('baseboard',           'premium',   4.00,   6.50, 'Baseboards',            36),
  ('baseboard',           'luxury',    6.50,  10.00, 'Baseboards',            36),

  -- Structural Framing (CMU, steel, wood, ICF)
  ('structural_framing',  'builder',  10.00,  14.00, 'Structural Framing',    37),
  ('structural_framing',  'standard', 14.00,  18.00, 'Structural Framing',    37),
  ('structural_framing',  'premium',  18.00,  24.00, 'Structural Framing',    37),
  ('structural_framing',  'luxury',   24.00,  32.00, 'Structural Framing',    37),

  -- Foundation
  ('foundation',          'builder',  12.00,  16.00, 'Foundation',            38),
  ('foundation',          'standard', 16.00,  20.00, 'Foundation',            38),
  ('foundation',          'premium',  20.00,  26.00, 'Foundation',            38),
  ('foundation',          'luxury',   26.00,  34.00, 'Foundation',            38),

  -- Exterior Paint
  ('exterior_paint',      'builder',   2.00,   3.50, 'Exterior Paint',        39),
  ('exterior_paint',      'standard',  3.50,   5.50, 'Exterior Paint',        39),
  ('exterior_paint',      'premium',   5.50,   8.00, 'Exterior Paint',        39),
  ('exterior_paint',      'luxury',    8.00,  13.00, 'Exterior Paint',        39),

  -- Shower Enclosure
  ('shower_enclosure',    'builder',   3.00,   5.00, 'Shower Enclosure',      40),
  ('shower_enclosure',    'standard',  5.00,   8.00, 'Shower Enclosure',      40),
  ('shower_enclosure',    'premium',   8.00,  13.00, 'Shower Enclosure',      40),
  ('shower_enclosure',    'luxury',   13.00,  20.00, 'Shower Enclosure',      40),

  -- Vanities
  ('vanity',              'builder',   3.00,   5.00, 'Vanities',              41),
  ('vanity',              'standard',  5.00,   8.00, 'Vanities',              41),
  ('vanity',              'premium',   8.00,  13.00, 'Vanities',              41),
  ('vanity',              'luxury',   13.00,  22.00, 'Vanities',              41),

  -- Outdoor Lighting
  ('outdoor_lighting',    'builder',   1.50,   2.50, 'Outdoor Lighting',      42),
  ('outdoor_lighting',    'standard',  2.50,   4.50, 'Outdoor Lighting',      42),
  ('outdoor_lighting',    'premium',   4.50,   7.50, 'Outdoor Lighting',      42),
  ('outdoor_lighting',    'luxury',    7.50,  12.00, 'Outdoor Lighting',      42),

  -- Swimming Pool (per-sqft, replaces fixed-cost special feature)
  ('pool',                'builder',   8.00,  12.00, 'Swimming Pool',         43),
  ('pool',                'standard', 12.00,  18.00, 'Swimming Pool',         43),
  ('pool',                'premium',  18.00,  28.00, 'Swimming Pool',         43),
  ('pool',                'luxury',   28.00,  45.00, 'Swimming Pool',         43),

  -- Outdoor Kitchen Equipment
  ('outdoor_kitchen_equip','builder',  10.00,  15.00, 'Outdoor Kitchen',      44),
  ('outdoor_kitchen_equip','standard', 15.00,  22.00, 'Outdoor Kitchen',      44),
  ('outdoor_kitchen_equip','premium',  22.00,  32.00, 'Outdoor Kitchen',      44),
  ('outdoor_kitchen_equip','luxury',   32.00,  48.00, 'Outdoor Kitchen',      44)
) AS v(category, finish_level, low, high, display_name, sort_order)
ON CONFLICT (organization_id, category, finish_level) DO NOTHING;
