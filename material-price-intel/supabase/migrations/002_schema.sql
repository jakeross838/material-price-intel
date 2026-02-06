-- ===========================================
-- AUTO-UPDATE TRIGGER FUNCTION
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- ORGANIZATIONS & AUTH
-- ===========================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SUPPLIERS
-- ===========================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,  -- Lowercase, trimmed for matching
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, normalized_name)
);

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- MATERIAL CATEGORIES
-- ===========================================
CREATE TABLE material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- 'lumber', 'windows', 'cabinets', 'flooring'
  display_name TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- ===========================================
-- MATERIALS (Canonical Registry)
-- ===========================================
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  category_id UUID NOT NULL REFERENCES material_categories(id),
  canonical_name TEXT NOT NULL,       -- "Ipe 5/4x6x16" (the One True Name)
  species TEXT,                       -- "Ipe", "PT Pine", "Cedar" (for lumber)
  dimensions TEXT,                    -- "5/4x6x16" (normalized format)
  grade TEXT,                         -- "#1", "Select", "Premium"
  treatment TEXT,                     -- "Pressure Treated", "Kiln Dried"
  unit_of_measure TEXT NOT NULL DEFAULT 'piece',  -- 'piece', 'board_foot', 'linear_foot', 'sqft'
  description TEXT,                   -- Additional searchable description
  aliases TEXT[] DEFAULT '{}',        -- Known alternative names
  category_attributes JSONB DEFAULT '{}',  -- Category-specific fields (e.g., windows: frame_material, glass_type)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, canonical_name)
);

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- DOCUMENTS (Job Queue)
-- ===========================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  file_path TEXT,                     -- Supabase Storage path
  file_type TEXT NOT NULL             -- 'pdf', 'xlsx', 'csv', 'email_text'
    CHECK (file_type IN ('pdf', 'xlsx', 'csv', 'email_text')),
  file_name TEXT,                     -- Original filename
  file_size_bytes INT,
  source TEXT NOT NULL DEFAULT 'upload'  -- 'upload', 'email'
    CHECK (source IN ('upload', 'email')),
  email_from TEXT,                    -- If source = 'email'
  email_subject TEXT,
  email_body TEXT,                    -- Raw email text (for email_text type)
  content_text TEXT,                  -- Extracted text content
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'review_needed')),
  error_message TEXT,
  quote_id UUID,                      -- Set when processing creates a quote
  uploaded_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- QUOTES
-- ===========================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  document_id UUID REFERENCES documents(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  quote_number TEXT,                  -- Supplier's quote/invoice number
  quote_date DATE,
  valid_until DATE,
  project_name TEXT,                  -- Which job this quote is for
  subtotal NUMERIC(12,2),
  delivery_cost NUMERIC(12,2),        -- Tracked separately per requirements
  tax_amount NUMERIC(12,2),
  tax_rate NUMERIC(5,4) DEFAULT 0.07, -- Florida 7%
  total_amount NUMERIC(12,2),
  payment_terms TEXT,                 -- "Net 30", "COD", etc.
  notes TEXT,                         -- Any additional notes from quote
  confidence_score NUMERIC(3,2),      -- AI extraction confidence (0-1)
  raw_extraction JSONB,               -- Full Claude extraction for debugging
  is_verified BOOLEAN DEFAULT FALSE,  -- Has human reviewed the extraction?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- LINE ITEMS
-- ===========================================
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id),  -- Null if normalization pending
  raw_description TEXT NOT NULL,       -- Exactly as it appeared on the quote
  quantity NUMERIC(12,4),
  unit TEXT,                           -- 'pc', 'lf', 'bf', 'sqft', 'ea'
  unit_price NUMERIC(12,4),            -- Price per unit
  extended_price NUMERIC(12,2),        -- quantity * unit_price
  discount_pct NUMERIC(5,2),
  discount_amount NUMERIC(12,2),
  line_total NUMERIC(12,2),
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
