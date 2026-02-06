-- ===========================================
-- PERFORMANCE INDEXES
-- ===========================================

-- Job queue: find pending documents fast
CREATE INDEX idx_documents_status_created
  ON documents(status, created_at)
  WHERE status IN ('pending', 'processing');

-- Material lookup: trigram similarity search (requires pg_trgm from 001)
CREATE INDEX idx_materials_canonical_name_trgm
  ON materials USING gin (canonical_name gin_trgm_ops);

CREATE INDEX idx_materials_species_trgm
  ON materials USING gin (species gin_trgm_ops);

CREATE INDEX idx_materials_dimensions
  ON materials(dimensions);

-- Price queries: material + date lookups
CREATE INDEX idx_line_items_material_id
  ON line_items(material_id);

CREATE INDEX idx_quotes_supplier_date
  ON quotes(supplier_id, quote_date DESC);

CREATE INDEX idx_quotes_organization_date
  ON quotes(organization_id, quote_date DESC);

CREATE INDEX idx_quotes_project_name
  ON quotes(project_name);

-- Supplier dedup: trigram similarity on normalized name
CREATE INDEX idx_suppliers_normalized_name_trgm
  ON suppliers USING gin (normalized_name gin_trgm_ops);

-- Document lookup by quote
CREATE INDEX idx_documents_quote_id
  ON documents(quote_id)
  WHERE quote_id IS NOT NULL;

-- Line items by quote (for loading all line items in a quote)
CREATE INDEX idx_line_items_quote_id
  ON line_items(quote_id);
