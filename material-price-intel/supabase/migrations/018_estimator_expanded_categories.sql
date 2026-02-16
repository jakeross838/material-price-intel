-- ===========================================
-- MIGRATION 018: Expanded Estimator Categories
-- Adds missing categories that exist in the UI but lacked DB pricing,
-- plus 12 new categories for more granular material selection.
-- ===========================================

-- Insert missing + new categories into estimator_config.
-- Uses ON CONFLICT to skip any that already exist.
INSERT INTO estimator_config (organization_id, category, finish_level, cost_per_sqft_low, cost_per_sqft_high, display_name, sort_order)
SELECT org.id, v.category, v.finish_level, v.low, v.high, v.display_name, v.sort_order
FROM (SELECT id FROM organizations LIMIT 1) org
CROSS JOIN (VALUES
  -- =============================================
  -- MISSING CATEGORIES (existed in UI, no DB pricing)
  -- =============================================

  -- Countertops (separate from cabinets for granular selection)
  ('countertops',  'builder',   5.00,   8.00, 'Countertops',               19),
  ('countertops',  'standard',  8.00,  12.00, 'Countertops',               19),
  ('countertops',  'premium',  12.00,  18.00, 'Countertops',               19),
  ('countertops',  'luxury',   18.00,  28.00, 'Countertops',               19),

  -- Lighting (dedicated category for light fixtures)
  ('lighting',     'builder',   2.00,   3.50, 'Lighting',                  20),
  ('lighting',     'standard',  3.50,   5.50, 'Lighting',                  20),
  ('lighting',     'premium',   5.50,   9.00, 'Lighting',                  20),
  ('lighting',     'luxury',    9.00,  15.00, 'Lighting',                  20),

  -- Paint & wall finishes
  ('paint',        'builder',   2.00,   3.00, 'Paint & Wall Finishes',     21),
  ('paint',        'standard',  3.00,   5.00, 'Paint & Wall Finishes',     21),
  ('paint',        'premium',   5.00,   8.00, 'Paint & Wall Finishes',     21),
  ('paint',        'luxury',    8.00,  14.00, 'Paint & Wall Finishes',     21),

  -- Exterior siding
  ('siding',       'builder',   6.00,   8.00, 'Exterior Siding',           22),
  ('siding',       'standard',  8.00,  12.00, 'Exterior Siding',           22),
  ('siding',       'premium',  12.00,  17.00, 'Exterior Siding',           22),
  ('siding',       'luxury',   17.00,  25.00, 'Exterior Siding',           22),

  -- =============================================
  -- NEW CATEGORIES (more granular material choices)
  -- =============================================

  -- Backsplash (kitchen-specific tile/stone work)
  ('backsplash',   'builder',   2.00,   3.50, 'Backsplash',                23),
  ('backsplash',   'standard',  3.50,   6.00, 'Backsplash',                23),
  ('backsplash',   'premium',   6.00,  10.00, 'Backsplash',                23),
  ('backsplash',   'luxury',   10.00,  16.00, 'Backsplash',                23),

  -- Hardware (cabinet pulls, knobs, hinges)
  ('hardware',     'builder',   0.50,   1.00, 'Cabinet & Door Hardware',   24),
  ('hardware',     'standard',  1.00,   2.00, 'Cabinet & Door Hardware',   24),
  ('hardware',     'premium',   2.00,   3.50, 'Cabinet & Door Hardware',   24),
  ('hardware',     'luxury',    3.50,   6.00, 'Cabinet & Door Hardware',   24),

  -- Tile (bathroom shower/floor tile)
  ('tile',         'builder',   4.00,   6.00, 'Tile Work',                 25),
  ('tile',         'standard',  6.00,  10.00, 'Tile Work',                 25),
  ('tile',         'premium',  10.00,  16.00, 'Tile Work',                 25),
  ('tile',         'luxury',   16.00,  26.00, 'Tile Work',                 25),

  -- Interior trim & molding
  ('trim',         'builder',   2.00,   3.00, 'Trim & Molding',            26),
  ('trim',         'standard',  3.00,   5.00, 'Trim & Molding',            26),
  ('trim',         'premium',   5.00,   8.00, 'Trim & Molding',            26),
  ('trim',         'luxury',    8.00,  14.00, 'Trim & Molding',            26),

  -- Interior doors
  ('doors',        'builder',   2.00,   3.50, 'Interior Doors',            27),
  ('doors',        'standard',  3.50,   5.50, 'Interior Doors',            27),
  ('doors',        'premium',   5.50,   9.00, 'Interior Doors',            27),
  ('doors',        'luxury',    9.00,  15.00, 'Interior Doors',            27),

  -- Closet organization systems
  ('closets',      'builder',   2.00,   3.50, 'Closet Systems',            28),
  ('closets',      'standard',  3.50,   6.00, 'Closet Systems',            28),
  ('closets',      'premium',   6.00,  10.00, 'Closet Systems',            28),
  ('closets',      'luxury',   10.00,  18.00, 'Closet Systems',            28),

  -- Fireplace
  ('fireplace',    'builder',   4.00,   7.00, 'Fireplace',                 29),
  ('fireplace',    'standard',  7.00,  12.00, 'Fireplace',                 29),
  ('fireplace',    'premium',  12.00,  20.00, 'Fireplace',                 29),
  ('fireplace',    'luxury',   20.00,  35.00, 'Fireplace',                 29),

  -- Garage door
  ('garage_door',  'builder',   3.00,   5.00, 'Garage Door',               30),
  ('garage_door',  'standard',  5.00,   8.00, 'Garage Door',               30),
  ('garage_door',  'premium',   8.00,  13.00, 'Garage Door',               30),
  ('garage_door',  'luxury',   13.00,  20.00, 'Garage Door',               30),

  -- Driveway
  ('driveway',     'builder',   3.00,   5.00, 'Driveway',                  31),
  ('driveway',     'standard',  5.00,   8.00, 'Driveway',                  31),
  ('driveway',     'premium',   8.00,  13.00, 'Driveway',                  31),
  ('driveway',     'luxury',   13.00,  20.00, 'Driveway',                  31),

  -- Entry/front door
  ('front_door',   'builder',   2.00,   4.00, 'Entry Door',                32),
  ('front_door',   'standard',  4.00,   7.00, 'Entry Door',                32),
  ('front_door',   'premium',   7.00,  12.00, 'Entry Door',                32),
  ('front_door',   'luxury',   12.00,  20.00, 'Entry Door',                32),

  -- Ceiling treatments
  ('ceiling',      'builder',   1.00,   2.00, 'Ceiling Treatments',        33),
  ('ceiling',      'standard',  2.00,   4.00, 'Ceiling Treatments',        33),
  ('ceiling',      'premium',   4.00,   7.00, 'Ceiling Treatments',        33),
  ('ceiling',      'luxury',    7.00,  12.00, 'Ceiling Treatments',        33),

  -- Smart home technology
  ('smart_home',   'builder',   1.50,   2.50, 'Smart Home Technology',     34),
  ('smart_home',   'standard',  2.50,   4.50, 'Smart Home Technology',     34),
  ('smart_home',   'premium',   4.50,   8.00, 'Smart Home Technology',     34),
  ('smart_home',   'luxury',    8.00,  14.00, 'Smart Home Technology',     34)
) AS v(category, finish_level, low, high, display_name, sort_order)
ON CONFLICT (organization_id, category, finish_level) DO NOTHING;
