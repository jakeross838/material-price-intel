-- ===========================================
-- MIGRATION 017: Grant anon role access to estimator tables
-- The estimator is a public-facing tool (no auth required).
-- Supabase RLS policies exist but base table privileges are also needed.
-- ===========================================

-- Anonymous users can read pricing config
GRANT SELECT ON estimator_config TO anon;

-- Anonymous users can submit leads (RLS policy already allows all inserts)
GRANT INSERT ON estimator_leads TO anon;
