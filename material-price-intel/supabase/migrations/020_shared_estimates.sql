-- Shared estimates for Save & Share via URL
CREATE TABLE shared_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_params JSONB NOT NULL,
  estimate_low NUMERIC(14,2) NOT NULL,
  estimate_high NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shared_estimates ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared estimates (public links)
CREATE POLICY "Anyone can view" ON shared_estimates FOR SELECT USING (true);

-- Anyone can create shared estimates (no auth required)
CREATE POLICY "Anyone can create" ON shared_estimates FOR INSERT WITH CHECK (true);

-- Grant anon access for unauthenticated estimator users
GRANT SELECT, INSERT ON shared_estimates TO anon;
