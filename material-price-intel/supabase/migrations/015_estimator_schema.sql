-- ===========================================
-- MIGRATION 015: Homeowner Estimator Schema
-- Public-facing cost estimator for custom home builds.
-- Two tables: estimator_config (pricing) + estimator_leads (contact submissions).
-- ===========================================

-- ===========================================
-- TABLE: estimator_config
-- Admin-configurable cost ranges per category per finish level.
-- Public SELECT so anonymous visitors can read pricing.
-- ===========================================
CREATE TABLE estimator_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  category TEXT NOT NULL,
  finish_level TEXT NOT NULL CHECK (finish_level IN ('builder', 'standard', 'premium', 'luxury')),
  cost_per_sqft_low NUMERIC(10,2) NOT NULL,
  cost_per_sqft_high NUMERIC(10,2) NOT NULL,
  display_name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, category, finish_level)
);

-- ===========================================
-- TABLE: estimator_leads
-- Stores contact info + estimate snapshot from public form.
-- ===========================================
CREATE TABLE estimator_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  contact_message TEXT,
  estimate_params JSONB NOT NULL,
  estimate_low NUMERIC(14,2) NOT NULL,
  estimate_high NUMERIC(14,2) NOT NULL,
  estimate_breakdown JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- RLS: estimator_config
-- ===========================================
ALTER TABLE estimator_config ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read pricing
CREATE POLICY "estimator_config_public_select" ON estimator_config
  FOR SELECT USING (true);

-- Only admins can write
CREATE POLICY "estimator_config_admin_insert" ON estimator_config
  FOR INSERT WITH CHECK (
    organization_id = public.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "estimator_config_admin_update" ON estimator_config
  FOR UPDATE USING (
    organization_id = public.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "estimator_config_admin_delete" ON estimator_config
  FOR DELETE USING (
    organization_id = public.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===========================================
-- RLS: estimator_leads
-- ===========================================
ALTER TABLE estimator_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a lead (public form)
CREATE POLICY "estimator_leads_public_insert" ON estimator_leads
  FOR INSERT WITH CHECK (true);

-- Org members can view their leads
CREATE POLICY "estimator_leads_org_select" ON estimator_leads
  FOR SELECT USING (organization_id = public.user_org_id());

-- Editors and admins can update leads
CREATE POLICY "estimator_leads_org_update" ON estimator_leads
  FOR UPDATE USING (
    organization_id = public.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Only admins can delete leads
CREATE POLICY "estimator_leads_admin_delete" ON estimator_leads
  FOR DELETE USING (
    organization_id = public.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX idx_estimator_config_org ON estimator_config(organization_id);
CREATE INDEX idx_estimator_config_lookup ON estimator_config(category, finish_level);
CREATE INDEX idx_estimator_leads_org ON estimator_leads(organization_id);
CREATE INDEX idx_estimator_leads_status ON estimator_leads(status);
CREATE INDEX idx_estimator_leads_created ON estimator_leads(created_at DESC);

-- ===========================================
-- SEED: estimator pricing data
-- 18 categories x 4 finish levels = 72 rows
-- Pricing derived from actual project data:
--   Builder: ~$165-190/sqft (Bradenton Ranch $425K/2400sqft)
--   Standard: ~$195-230/sqft (Siesta Key $680K/3200sqft)
--   Premium: ~$230-275/sqft (Lakewood Ranch $1.25M/5800sqft)
--   Luxury: ~$280-350/sqft
-- ===========================================
INSERT INTO estimator_config (organization_id, category, finish_level, cost_per_sqft_low, cost_per_sqft_high, display_name, sort_order)
SELECT org.id, v.category, v.finish_level, v.low, v.high, v.display_name, v.sort_order
FROM (SELECT id FROM organizations LIMIT 1) org
CROSS JOIN (VALUES
  ('site_work',    'builder',   6.00,   8.00, 'Site Work & Grading',       1),
  ('site_work',    'standard',  7.00,   9.00, 'Site Work & Grading',       1),
  ('site_work',    'premium',   8.00,  11.00, 'Site Work & Grading',       1),
  ('site_work',    'luxury',   10.00,  14.00, 'Site Work & Grading',       1),
  ('concrete',     'builder',  14.00,  17.00, 'Foundation & Concrete',     2),
  ('concrete',     'standard', 16.00,  19.00, 'Foundation & Concrete',     2),
  ('concrete',     'premium',  18.00,  22.00, 'Foundation & Concrete',     2),
  ('concrete',     'luxury',   22.00,  28.00, 'Foundation & Concrete',     2),
  ('lumber',       'builder',  12.00,  15.00, 'Lumber & Framing',          3),
  ('lumber',       'standard', 14.00,  17.00, 'Lumber & Framing',          3),
  ('lumber',       'premium',  16.00,  20.00, 'Lumber & Framing',          3),
  ('lumber',       'luxury',   20.00,  26.00, 'Lumber & Framing',          3),
  ('roofing',      'builder',   4.00,   5.50, 'Roofing',                   4),
  ('roofing',      'standard',  5.00,   7.00, 'Roofing',                   4),
  ('roofing',      'premium',   7.00,  10.00, 'Roofing',                   4),
  ('roofing',      'luxury',   10.00,  15.00, 'Roofing',                   4),
  ('windows',      'builder',   6.00,   8.00, 'Windows & Doors',           5),
  ('windows',      'standard',  8.00,  11.00, 'Windows & Doors',           5),
  ('windows',      'premium',  11.00,  15.00, 'Windows & Doors',           5),
  ('windows',      'luxury',   15.00,  22.00, 'Windows & Doors',           5),
  ('plumbing',     'builder',   8.00,  10.00, 'Plumbing',                  6),
  ('plumbing',     'standard', 10.00,  13.00, 'Plumbing',                  6),
  ('plumbing',     'premium',  13.00,  17.00, 'Plumbing',                  6),
  ('plumbing',     'luxury',   17.00,  24.00, 'Plumbing',                  6),
  ('electrical',   'builder',   7.00,   9.00, 'Electrical',                7),
  ('electrical',   'standard',  9.00,  11.00, 'Electrical',                7),
  ('electrical',   'premium',  11.00,  14.00, 'Electrical',                7),
  ('electrical',   'luxury',   14.00,  20.00, 'Electrical',                7),
  ('hvac',         'builder',   7.00,   9.00, 'HVAC',                      8),
  ('hvac',         'standard',  9.00,  11.00, 'HVAC',                      8),
  ('hvac',         'premium',  11.00,  14.00, 'HVAC',                      8),
  ('hvac',         'luxury',   14.00,  19.00, 'HVAC',                      8),
  ('insulation',   'builder',   3.00,   4.00, 'Insulation',                9),
  ('insulation',   'standard',  4.00,   5.50, 'Insulation',                9),
  ('insulation',   'premium',   5.50,   7.50, 'Insulation',                9),
  ('insulation',   'luxury',    7.50,  10.00, 'Insulation',                9),
  ('drywall',      'builder',   7.00,   9.00, 'Drywall & Paint',          10),
  ('drywall',      'standard',  9.00,  11.00, 'Drywall & Paint',          10),
  ('drywall',      'premium',  11.00,  14.00, 'Drywall & Paint',          10),
  ('drywall',      'luxury',   14.00,  18.00, 'Drywall & Paint',          10),
  ('flooring',     'builder',   4.00,   6.00, 'Flooring',                 11),
  ('flooring',     'standard',  6.00,   9.00, 'Flooring',                 11),
  ('flooring',     'premium',   9.00,  14.00, 'Flooring',                 11),
  ('flooring',     'luxury',   14.00,  22.00, 'Flooring',                 11),
  ('cabinets',     'builder',   8.00,  11.00, 'Cabinets & Countertops',   12),
  ('cabinets',     'standard', 11.00,  16.00, 'Cabinets & Countertops',   12),
  ('cabinets',     'premium',  16.00,  24.00, 'Cabinets & Countertops',   12),
  ('cabinets',     'luxury',   24.00,  38.00, 'Cabinets & Countertops',   12),
  ('appliances',   'builder',   3.00,   4.50, 'Appliances',               13),
  ('appliances',   'standard',  4.50,   7.00, 'Appliances',               13),
  ('appliances',   'premium',   7.00,  12.00, 'Appliances',               13),
  ('appliances',   'luxury',   12.00,  20.00, 'Appliances',               13),
  ('fixtures',     'builder',   4.00,   6.00, 'Fixtures & Hardware',      14),
  ('fixtures',     'standard',  6.00,   9.00, 'Fixtures & Hardware',      14),
  ('fixtures',     'premium',   9.00,  14.00, 'Fixtures & Hardware',      14),
  ('fixtures',     'luxury',   14.00,  22.00, 'Fixtures & Hardware',      14),
  ('exterior',     'builder',   8.00,  10.00, 'Exterior Finishes',        15),
  ('exterior',     'standard', 10.00,  13.00, 'Exterior Finishes',        15),
  ('exterior',     'premium',  13.00,  17.00, 'Exterior Finishes',        15),
  ('exterior',     'luxury',   17.00,  24.00, 'Exterior Finishes',        15),
  ('landscaping',  'builder',   3.00,   5.00, 'Landscaping',              16),
  ('landscaping',  'standard',  5.00,   7.00, 'Landscaping',              16),
  ('landscaping',  'premium',   7.00,  10.00, 'Landscaping',              16),
  ('landscaping',  'luxury',   10.00,  16.00, 'Landscaping',              16),
  ('permits',      'builder',   8.00,  10.00, 'Permits & Fees',           17),
  ('permits',      'standard',  9.00,  11.00, 'Permits & Fees',           17),
  ('permits',      'premium',  10.00,  12.00, 'Permits & Fees',           17),
  ('permits',      'luxury',   11.00,  14.00, 'Permits & Fees',           17),
  ('overhead',     'builder',  25.00,  30.00, 'Builder Overhead & Profit', 18),
  ('overhead',     'standard', 28.00,  34.00, 'Builder Overhead & Profit', 18),
  ('overhead',     'premium',  32.00,  40.00, 'Builder Overhead & Profit', 18),
  ('overhead',     'luxury',   38.00,  48.00, 'Builder Overhead & Profit', 18)
) AS v(category, finish_level, low, high, display_name, sort_order)
ON CONFLICT (organization_id, category, finish_level) DO NOTHING;
