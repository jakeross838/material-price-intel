-- Enable required PostgreSQL extensions
-- pg_trgm: Fuzzy text matching using trigram similarity
-- Used for material name matching and supplier deduplication
CREATE EXTENSION IF NOT EXISTS pg_trgm;
