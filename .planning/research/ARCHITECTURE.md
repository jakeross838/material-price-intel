# Architecture Research

**Domain:** Construction Material Price Intelligence (Document Parsing to Analytics)
**Researched:** 2026-02-06
**Confidence:** HIGH (core patterns verified with official docs; material normalization strategy is MEDIUM)

## Summary

This system is a document-parsing-to-analytics pipeline: heterogeneous documents (PDF, email, Excel) enter the system, an AI extraction layer (Claude API) converts them to structured data, PostgreSQL stores and indexes the data, and a natural language query interface lets users search pricing history. The architecture follows a job-queue pattern with Supabase Edge Functions orchestrating each stage.

The standard approach for this type of system is a **three-layer pipeline**: (1) ingestion layer that normalizes all input formats into extractable text/content, (2) AI processing layer that converts unstructured content into structured records with guaranteed JSON schemas, and (3) query layer that translates natural language into SQL against a well-indexed PostgreSQL schema.

**Primary recommendation:** Use Supabase Edge Functions as the processing backbone with a database-backed job queue (not direct webhook-to-processing), Claude API with structured outputs for guaranteed-schema extraction, and a two-tier material normalization strategy (AI extraction + PostgreSQL trigram matching for deduplication).

---

## System Overview

```
                        INGESTION LAYER
   +------------------+------------------+------------------+
   |   React Upload   |  Email Webhook   |  React Upload    |
   |   (PDF/Excel)    |  (Resend/etc)    |  (Drag & Drop)   |
   +--------+---------+--------+---------+--------+---------+
            |                  |                  |
            v                  v                  v
   +--------------------------------------------------------+
   |              Supabase Storage (Bucket)                  |
   |         Original files stored permanently               |
   +----------------------------+---------------------------+
                                |
                     DB insert: documents table
                     status = 'pending'
                                |
                                v
                      PROCESSING LAYER
   +--------------------------------------------------------+
   |          Job Queue (pg_cron polling pattern)            |
   |   pg_cron -> Edge Function every 30s-1min              |
   +----------------------------+---------------------------+
                                |
               +----------------+----------------+
               |                                 |
               v                                 v
   +-----------------------+      +--------------------------+
   | Text Extraction EF    |      | Excel Parsing EF         |
   | (PDF: send to Claude  |      | (SheetJS -> JSON rows)   |
   |  as document block)   |      |                          |
   | (Email: parse body)   |      |                          |
   +-----------+-----------+      +------------+-------------+
               |                               |
               +---------------+---------------+
                               |
                               v
   +--------------------------------------------------------+
   |          Claude API Edge Function                       |
   |   - Receives extracted text/content                     |
   |   - Structured output (guaranteed JSON schema)          |
   |   - Returns: supplier, line items, pricing, metadata    |
   +----------------------------+---------------------------+
                                |
                                v
   +--------------------------------------------------------+
   |          Normalization Edge Function                     |
   |   - Matches materials to canonical names                |
   |   - pg_trgm similarity for fuzzy matching               |
   |   - Creates new canonical entries if no match           |
   +----------------------------+---------------------------+
                                |
                                v
                        DATA LAYER
   +--------------------------------------------------------+
   |              Supabase PostgreSQL                        |
   |   quotes / line_items / materials / suppliers           |
   |   pg_trgm indexes for fuzzy search                     |
   |   RLS policies per organization                        |
   +----------------------------+---------------------------+
                                |
                                v
                        QUERY LAYER
   +--------------------------------------------------------+
   |          React Frontend                                 |
   |   Natural language input -> Edge Function               |
   |   Edge Function -> Claude text-to-SQL -> execute        |
   |   Results displayed with historical context             |
   +--------------------------------------------------------+
   |          Price Alert System                             |
   |   DB trigger on line_item insert                        |
   |   Compare new price vs historical avg for material      |
   |   Flag outliers (> 15% above average)                   |
   +--------------------------------------------------------+
```

---

## Component Responsibilities

| Component | Responsibility | Implementation | Runs Where |
|-----------|----------------|----------------|------------|
| **File Upload UI** | Accept PDF/Excel, show progress, display results | React + Supabase Storage JS SDK | Client (browser) |
| **Email Ingestion** | Receive forwarded emails, extract body + attachments | Inbound email service (Resend/CloudMailin) webhook to Edge Function | Edge Function |
| **Document Store** | Persist original files for audit/re-processing | Supabase Storage bucket with signed URLs | Supabase infra |
| **Job Queue** | Track document processing status through pipeline stages | PostgreSQL table (`documents`) with status column + pg_cron | Supabase DB |
| **Text Extractor** | Extract readable content from PDF/email/Excel | Edge Function: Claude PDF support (native), SheetJS for Excel, raw text for email | Edge Function |
| **AI Parser** | Convert unstructured text to structured quote data | Edge Function calling Claude API with structured outputs (JSON schema) | Edge Function |
| **Material Normalizer** | Match extracted material names to canonical entries | Edge Function: Claude for initial classification + pg_trgm for dedup lookup | Edge Function + DB |
| **Price Alert Engine** | Detect price anomalies against historical data | PostgreSQL function triggered on line_item insert | DB trigger |
| **NL Query Interface** | Translate natural language to SQL, execute, return | Edge Function calling Claude API for text-to-SQL generation | Edge Function |
| **Query Results UI** | Display pricing results with context | React components with charts/tables | Client (browser) |
| **Auth & RLS** | Multi-user access control per organization | Supabase Auth + Row Level Security policies | Supabase infra |

---

## Recommended Project Structure

```
material-price-intel/
├── src/                          # React frontend
│   ├── components/
│   │   ├── upload/               # File upload components
│   │   │   ├── DropZone.tsx      # Drag-and-drop file upload
│   │   │   ├── UploadProgress.tsx
│   │   │   └── ParseResults.tsx  # Show extracted data for review
│   │   ├── query/                # Price query components
│   │   │   ├── NaturalLanguageInput.tsx
│   │   │   ├── QueryResults.tsx
│   │   │   └── PriceChart.tsx
│   │   ├── quotes/               # Quote management
│   │   │   ├── QuoteList.tsx
│   │   │   ├── QuoteDetail.tsx
│   │   │   └── LineItemTable.tsx
│   │   ├── alerts/               # Price alert display
│   │   │   └── PriceAlertBanner.tsx
│   │   └── common/               # Shared UI
│   ├── hooks/
│   │   ├── useQuoteUpload.ts     # Upload + processing status
│   │   ├── usePriceQuery.ts      # NL query submission
│   │   ├── useRealtimeStatus.ts  # Subscribe to processing updates
│   │   └── useAlerts.ts          # Price alert subscriptions
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── storage.ts            # File upload helpers
│   │   └── types.ts              # Shared TypeScript types
│   └── pages/
│       ├── Dashboard.tsx          # Overview + alerts
│       ├── Upload.tsx             # Upload interface
│       ├── Query.tsx              # Price query interface
│       └── Quotes.tsx             # Quote history browser
│
├── supabase/
│   ├── functions/                # Edge Functions
│   │   ├── process-document/     # Main job processor
│   │   │   └── index.ts
│   │   ├── parse-quote/          # Claude API extraction
│   │   │   └── index.ts
│   │   ├── normalize-material/   # Material name normalization
│   │   │   └── index.ts
│   │   ├── ingest-email/         # Email webhook handler
│   │   │   └── index.ts
│   │   ├── query-prices/         # NL-to-SQL query handler
│   │   │   └── index.ts
│   │   └── _shared/              # Shared utilities
│   │       ├── claude.ts         # Claude API client wrapper
│   │       ├── schemas.ts        # Zod schemas for structured output
│   │       ├── supabase.ts       # Admin Supabase client
│   │       └── types.ts          # Shared types
│   ├── migrations/               # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_enable_extensions.sql
│   │   ├── 003_rls_policies.sql
│   │   ├── 004_functions_and_triggers.sql
│   │   └── 005_cron_jobs.sql
│   ├── seed.sql                  # Seed data (material categories, etc.)
│   └── config.toml               # Supabase local config
│
├── shared/                       # Types shared between frontend and functions
│   └── types.ts
└── package.json
```

---

## Architectural Patterns

### Pattern 1: Database-Backed Job Queue (Critical)

**What:** Instead of processing documents inline when uploaded, insert a record into a `documents` table with `status = 'pending'` and let a pg_cron-triggered Edge Function process one job at a time.

**Why this over webhook-to-processing:** If 10 quotes are uploaded simultaneously, direct webhook processing would spawn 10 parallel Edge Functions hitting the Claude API at once, risking rate limits and timeouts. The queue pattern processes one at a time, predictably.

**Source:** [Supabase blog: Processing large jobs with Edge Functions](https://supabase.com/blog/processing-large-jobs-with-edge-functions) (HIGH confidence)

```typescript
// pg_cron calls this Edge Function every 30 seconds
Deno.serve(async (req) => {
  const supabase = createClient(/* admin credentials */);

  // Pick one pending document (FIFO)
  const { data: doc } = await supabase
    .from('documents')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!doc) {
    return new Response(JSON.stringify({ message: 'No pending jobs' }));
  }

  try {
    // Mark as processing
    await supabase
      .from('documents')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', doc.id);

    // Process (extract, parse, normalize, store)
    await processDocument(doc);

    // Mark complete
    await supabase
      .from('documents')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', doc.id);

  } catch (error) {
    // Mark failed (allows retry or manual review)
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', doc.id);
  }

  return new Response(JSON.stringify({ processed: doc.id }));
});
```

**pg_cron setup:**
```sql
-- Process pending documents every 30 seconds
SELECT cron.schedule(
  'process-documents',
  '30 seconds',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/process-document',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### Pattern 2: Claude PDF Native Extraction (No Pre-Processing Needed)

**What:** Claude API accepts PDF documents directly as base64-encoded `document` content blocks. No need for a separate PDF text extraction library. Send the PDF directly to Claude.

**Why:** Claude converts each page to both text and image, analyzing both. This handles tables, handwritten notes, and visual layouts that pure text extraction would miss. Construction quotes often have table-heavy layouts that benefit from vision analysis.

**Source:** [Claude API PDF Support docs](https://platform.claude.com/docs/en/build-with-claude/pdf-support) (HIGH confidence)

**Limits:** 32MB max request size, 100 pages max. Construction quotes are typically 1-5 pages, well within limits.

**Token cost:** 1,500-3,000 tokens per page (text + image). A 3-page quote costs roughly 5,000-9,000 input tokens.

```typescript
// In the parse-quote Edge Function
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250514', // Cost-effective for extraction
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: pdfBase64
        }
      },
      {
        type: 'text',
        text: QUOTE_EXTRACTION_PROMPT
      }
    ]
  }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: quoteExtractionSchema  // Guaranteed valid JSON
    }
  }
});
```

### Pattern 3: Structured Outputs for Guaranteed Schema

**What:** Claude's structured outputs feature compiles a JSON schema into a grammar that constrains token generation. The response is guaranteed to match your schema -- no `JSON.parse()` errors, no missing fields, no type mismatches.

**Why:** Quote parsing produces data that goes directly into database inserts. Schema violations would cause insert failures. Structured outputs eliminate this entire error class.

**Source:** [Claude Structured Outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) (HIGH confidence)

**Key detail:** The `output_config.format` parameter (replacing deprecated `output_format`) uses `type: "json_schema"`. First request with a new schema has extra latency for grammar compilation; subsequent requests use 24-hour cache.

### Pattern 4: Supabase Realtime for Processing Status

**What:** The React frontend subscribes to Supabase Realtime channel on the `documents` table to show live processing status updates without polling.

**Why:** After upload, the user needs to know when processing is complete. Realtime subscriptions push status changes (pending -> processing -> completed/failed) to the UI instantly.

**Source:** [Supabase Realtime docs](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) (HIGH confidence)

```typescript
// React hook for processing status
const channel = supabase
  .channel('document-status')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'documents',
      filter: `id=eq.${documentId}`
    },
    (payload) => {
      setStatus(payload.new.status);
      if (payload.new.status === 'completed') {
        // Fetch extracted data and display
        fetchQuoteData(payload.new.quote_id);
      }
    }
  )
  .subscribe();
```

### Pattern 5: Text-to-SQL with Schema Context

**What:** For natural language price queries, send the user's question along with the database schema to Claude, which generates a read-only SQL query. Execute the query against PostgreSQL and return results.

**Why:** Construction pricing queries are domain-specific ("What's the best price for 5/4x6 Ipe?"). A pre-built query interface can't anticipate every question. Text-to-SQL lets users ask anything.

**Safety:** Only SELECT queries allowed. Run generated SQL through a whitelist check (no DROP, ALTER, DELETE, UPDATE, INSERT). Execute with a read-only database role.

**Source:** [Anthropic cookbook: How to make SQL queries](https://platform.claude.com/cookbook/misc-how-to-make-sql-queries), [AWS text-to-SQL patterns](https://aws.amazon.com/blogs/machine-learning/enterprise-grade-natural-language-to-sql-generation-using-llms-balancing-accuracy-latency-and-scale/) (MEDIUM confidence)

```typescript
const SCHEMA_CONTEXT = `
You are a SQL query generator for a construction material pricing database.
Database: PostgreSQL on Supabase.

Tables:
- suppliers (id, name, contact_name, contact_email, contact_phone)
- quotes (id, supplier_id, quote_number, quote_date, project_name, ...)
- line_items (id, quote_id, material_id, description, quantity, unit, unit_price, ...)
- materials (id, canonical_name, category, subcategory, dimensions, species, ...)
- price_history (materialized view: material, supplier, avg_price, min_price, ...)

Rules:
- ONLY generate SELECT statements
- Always include supplier name and quote date in results
- Use pg_trgm similarity for fuzzy material name matching
- Return results ordered by date DESC unless asked otherwise
`;

// In query-prices Edge Function
const sqlResponse = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250514',
  max_tokens: 1024,
  system: SCHEMA_CONTEXT,
  messages: [{ role: 'user', content: userQuery }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          sql: { type: 'string' },
          explanation: { type: 'string' }
        },
        required: ['sql', 'explanation'],
        additionalProperties: false
      }
    }
  }
});
```

---

## Data Flow

### Quote Ingestion Flow (PDF Upload)

```
1. User drags PDF into DropZone component
2. React uploads file to Supabase Storage bucket "quotes"
   -> supabase.storage.from('quotes').upload(path, file)
   -> Returns storage path
3. React inserts record into `documents` table:
   { file_path, file_type: 'pdf', source: 'upload', status: 'pending',
     uploaded_by: auth.uid() }
4. UI subscribes to Realtime on this document's status
5. pg_cron triggers process-document Edge Function (runs every 30s)
6. Edge Function picks up pending document:
   a. Downloads file from Storage
   b. Base64 encodes PDF
   c. Sends to Claude API with extraction prompt + structured output schema
   d. Receives guaranteed-valid JSON: { supplier, quote_date, line_items[], ... }
   e. For each line item, runs material normalization:
      - Calls Claude to classify: species, dimensions, category
      - Queries materials table using pg_trgm similarity
      - If match found (similarity > 0.7): link to existing material
      - If no match: create new canonical material entry
   f. Inserts: quote record, line_item records (linked to materials)
   g. Updates document status to 'completed' with quote_id
7. Realtime pushes status update to React UI
8. UI displays extracted data for user review
```

### Quote Ingestion Flow (Email Forward)

```
1. User forwards quote email to quotes@rossbuilt.com
2. Email service (Resend/CloudMailin) sends webhook to
   ingest-email Edge Function with:
   - from, subject, body (text + HTML)
   - attachments (base64 encoded)
3. Edge Function:
   a. Verifies webhook signature
   b. For each attachment (PDF/Excel):
      - Uploads to Supabase Storage bucket "quotes"
      - Inserts document record { file_path, source: 'email',
        email_from, email_subject, status: 'pending' }
   c. If no attachments but body has pricing text:
      - Stores email body as document { content: emailBody,
        file_type: 'email_text', source: 'email', status: 'pending' }
4. Job queue picks up and processes same as upload flow (step 5+)
```

### Quote Ingestion Flow (Excel Upload)

```
1. User uploads .xlsx file via DropZone
2. File stored in Supabase Storage, document record created
3. Job queue picks up document
4. Edge Function:
   a. Downloads Excel from Storage
   b. Parses with SheetJS (xlsx library): XLSX.read(buffer)
   c. Converts sheet data to JSON rows
   d. Sends JSON representation to Claude for structured extraction
      (Claude handles mapping messy spreadsheet layouts to schema)
   e. Same normalization and storage as PDF flow
```

### Price Query Flow

```
1. User types natural language query in NaturalLanguageInput:
   "What's the cheapest price I've paid for 5/4x6 Ipe in the last year?"
2. React calls query-prices Edge Function with query text
3. Edge Function:
   a. Sends query + database schema context to Claude API
   b. Claude generates SQL:
      SELECT s.name, q.quote_date, li.unit_price, li.unit,
             m.canonical_name
      FROM line_items li
      JOIN quotes q ON li.quote_id = q.id
      JOIN suppliers s ON q.supplier_id = s.id
      JOIN materials m ON li.material_id = m.id
      WHERE m.canonical_name % '5/4x6 Ipe'  -- trigram similarity
        AND m.category = 'lumber'
        AND q.quote_date > NOW() - INTERVAL '1 year'
      ORDER BY li.unit_price ASC;
   c. Validates SQL is SELECT-only (whitelist check)
   d. Executes against PostgreSQL with read-only role
   e. Sends results back to Claude for natural language summary
   f. Returns { sql, results, summary, explanation }
4. React displays results table + summary text + optional chart
```

### Price Alert Flow

```
1. New line_item inserted (from quote processing)
2. PostgreSQL trigger fires: check_price_alert()
3. Trigger function:
   a. Queries historical avg price for this material
   b. If new_price > historical_avg * 1.15 (15% threshold):
      - Inserts alert record: { material_id, line_item_id,
        current_price, avg_price, pct_above_avg, severity }
4. If React has Realtime subscription on alerts table:
   - Banner appears: "Alert: Ipe 5/4x6x16 quoted at $185/pc
     is 23% above your average of $150/pc"
```

---

## Database Schema

### Tables

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- Fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_cron;     -- Job scheduling
CREATE EXTENSION IF NOT EXISTS pg_net;      -- HTTP from PostgreSQL

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

-- ===========================================
-- MATERIALS (Canonical Registry)
-- ===========================================
CREATE TABLE material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- 'lumber', 'windows', 'cabinets', 'flooring'
  display_name TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  category_id UUID NOT NULL REFERENCES material_categories(id),
  canonical_name TEXT NOT NULL,       -- "Ipe 5/4x6x16" (the One True Name)
  species TEXT,                       -- "Ipe", "PT Pine", "Cedar" (for lumber)
  dimensions TEXT,                    -- "5/4x6x16" (normalized format)
  grade TEXT,                         -- "#1", "Select", "Premium"
  treatment TEXT,                     -- "Pressure Treated", "Kiln Dried"
  unit_of_measure TEXT NOT NULL       -- 'piece', 'board_foot', 'linear_foot', 'sqft'
    DEFAULT 'piece',
  description TEXT,                   -- Additional searchable description
  aliases TEXT[] DEFAULT '{}',        -- Known alternative names
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, canonical_name)
);

-- ===========================================
-- DOCUMENTS (Job Queue)
-- ===========================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  file_path TEXT,                     -- Supabase Storage path
  file_type TEXT NOT NULL             -- 'pdf', 'xlsx', 'email_text'
    CHECK (file_type IN ('pdf', 'xlsx', 'csv', 'email_text')),
  file_name TEXT,                     -- Original filename
  file_size_bytes INT,
  source TEXT NOT NULL DEFAULT 'upload' -- 'upload', 'email'
    CHECK (source IN ('upload', 'email')),
  email_from TEXT,                    -- If source = 'email'
  email_subject TEXT,
  email_body TEXT,                    -- Raw email text (for email_text type)
  content_text TEXT,                  -- Extracted text content
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed',
                      'failed', 'review_needed')),
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

-- ===========================================
-- PRICE ALERTS
-- ===========================================
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  material_id UUID NOT NULL REFERENCES materials(id),
  line_item_id UUID NOT NULL REFERENCES line_items(id),
  quote_id UUID NOT NULL REFERENCES quotes(id),
  current_price NUMERIC(12,4) NOT NULL,
  historical_avg_price NUMERIC(12,4) NOT NULL,
  historical_min_price NUMERIC(12,4),
  historical_max_price NUMERIC(12,4),
  pct_above_avg NUMERIC(5,2) NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_by UUID REFERENCES auth.users(id),
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- QUERY LOG (for audit and improvement)
-- ===========================================
CREATE TABLE query_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  natural_language_query TEXT NOT NULL,
  generated_sql TEXT,
  result_count INT,
  execution_time_ms INT,
  was_helpful BOOLEAN,                -- User feedback
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Relationships

```
organizations 1--* user_profiles
organizations 1--* suppliers
organizations 1--* materials
organizations 1--* documents
organizations 1--* quotes

documents 1--0..1 quotes           (a processed document may produce one quote)
suppliers 1--* quotes
quotes 1--* line_items
materials 1--* line_items          (many line items reference same canonical material)
quotes 1--* price_alerts
materials 1--* price_alerts
line_items 1--0..1 price_alerts
```

### Indexes

```sql
-- Job queue: find pending documents fast
CREATE INDEX idx_documents_status_created
  ON documents(status, created_at)
  WHERE status IN ('pending', 'processing');

-- Material lookup: trigram similarity search
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

-- Supplier dedup
CREATE INDEX idx_suppliers_normalized_name_trgm
  ON suppliers USING gin (normalized_name gin_trgm_ops);

-- Alerts: unread alerts per org
CREATE INDEX idx_price_alerts_org_active
  ON price_alerts(organization_id, created_at DESC)
  WHERE is_dismissed = FALSE;
```

### Materialized View for Price History

```sql
CREATE MATERIALIZED VIEW price_history AS
SELECT
  m.id AS material_id,
  m.canonical_name,
  m.category_id,
  m.species,
  m.dimensions,
  s.id AS supplier_id,
  s.name AS supplier_name,
  COUNT(li.id) AS quote_count,
  AVG(li.unit_price) AS avg_price,
  MIN(li.unit_price) AS min_price,
  MAX(li.unit_price) AS max_price,
  STDDEV(li.unit_price) AS price_stddev,
  MIN(q.quote_date) AS first_quoted,
  MAX(q.quote_date) AS last_quoted,
  -- Most recent price
  (ARRAY_AGG(li.unit_price ORDER BY q.quote_date DESC))[1] AS latest_price
FROM line_items li
JOIN quotes q ON li.quote_id = q.id
JOIN suppliers s ON q.supplier_id = s.id
JOIN materials m ON li.material_id = m.id
GROUP BY m.id, m.canonical_name, m.category_id, m.species,
         m.dimensions, s.id, s.name;

-- Refresh after each quote insertion
CREATE INDEX idx_price_history_material ON price_history(material_id);
CREATE INDEX idx_price_history_name_trgm
  ON price_history USING gin (canonical_name gin_trgm_ops);
```

### RLS Policies

```sql
-- All tables follow the same pattern:
-- Users can only see data belonging to their organization.

-- Helper function: get current user's organization
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Example: quotes table RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own org quotes"
  ON quotes FOR SELECT
  USING (organization_id = auth.user_org_id());

CREATE POLICY "Editors can insert quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    organization_id = auth.user_org_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors can update quotes"
  ON quotes FOR UPDATE
  USING (
    organization_id = auth.user_org_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Repeat pattern for: suppliers, materials, documents,
-- line_items, price_alerts, query_log
-- line_items uses quote's organization_id via join

-- Storage bucket policy: users access their org's folder
-- Bucket structure: quotes/{organization_id}/{filename}
```

---

## Material Normalization Strategy

This is the most architecturally critical challenge. The same material appears differently across suppliers:
- "5/4x6x16 Ipe" vs "Ipe 5/4 x 6 x 16" vs "Ipe decking 1.25x6x16"
- "PT 2x10x16" vs "Pressure Treated 2x10x16 #2" vs "#2 PT Pine 2x10x16'"

### Two-Tier Normalization Approach

**Tier 1: AI-Powered Classification (at extraction time)**

When Claude extracts line items from a quote, include material classification in the structured output schema:

```typescript
// Part of the extraction schema sent to Claude
const lineItemSchema = {
  type: 'object',
  properties: {
    raw_description: { type: 'string' },        // Exactly as on quote
    parsed_species: { type: 'string' },          // "Ipe", "PT Pine", "Cedar"
    parsed_dimensions: { type: 'string' },       // "5/4x6x16" (normalized format)
    parsed_grade: { type: 'string' },            // "#1", "Select", "Premium"
    parsed_treatment: { type: 'string' },        // "Pressure Treated", "Kiln Dried"
    parsed_category: {
      type: 'string',
      enum: ['lumber', 'windows', 'cabinets', 'flooring', 'hardware', 'other']
    },
    parsed_unit: {
      type: 'string',
      enum: ['piece', 'linear_foot', 'board_foot', 'sqft', 'each']
    },
    quantity: { type: 'number' },
    unit_price: { type: 'number' },
    // ... other fields
  },
  required: ['raw_description', 'parsed_species', 'parsed_dimensions',
             'parsed_category', 'quantity', 'unit_price'],
  additionalProperties: false
};
```

**Extraction prompt includes normalization rules:**
```
When parsing material descriptions, normalize as follows:
- Dimensions: Always use NominalxNominalxLength format (e.g., "2x10x16", "5/4x6x16")
- Species: Use standard names: "Ipe", "PT Pine", "Cedar", "Douglas Fir", "Mahogany"
- Treatment: "Pressure Treated" (not "PT" alone), "Kiln Dried" (not "KD")
- For composite descriptions like "5/4x6x16 Ipe S4S", separate into dimensions ("5/4x6x16"), species ("Ipe"), and grade ("S4S")
```

**Tier 2: Database Fuzzy Matching (post-extraction)**

After Claude classifies the material, look up the canonical materials table:

```typescript
// In normalize-material Edge Function
async function findOrCreateMaterial(
  parsed: ParsedMaterial,
  orgId: string
): Promise<string> {
  // Step 1: Exact match on species + dimensions
  const { data: exact } = await supabase
    .from('materials')
    .select('id')
    .eq('organization_id', orgId)
    .eq('species', parsed.species)
    .eq('dimensions', parsed.dimensions)
    .limit(1)
    .single();

  if (exact) return exact.id;

  // Step 2: Trigram similarity match
  const candidateName = `${parsed.species} ${parsed.dimensions}`;
  const { data: fuzzy } = await supabase
    .rpc('find_similar_material', {
      p_org_id: orgId,
      p_search_name: candidateName,
      p_threshold: 0.5
    });

  if (fuzzy && fuzzy.length > 0 && fuzzy[0].similarity > 0.7) {
    // High confidence match — add alias and link
    await supabase
      .from('materials')
      .update({
        aliases: supabase.sql`array_append(aliases, ${parsed.raw_description})`
      })
      .eq('id', fuzzy[0].id);
    return fuzzy[0].id;
  }

  // Step 3: No match — create new canonical entry
  const { data: newMaterial } = await supabase
    .from('materials')
    .insert({
      organization_id: orgId,
      category_id: parsed.category_id,
      canonical_name: candidateName,
      species: parsed.species,
      dimensions: parsed.dimensions,
      grade: parsed.grade,
      treatment: parsed.treatment,
      unit_of_measure: parsed.unit,
      aliases: [parsed.raw_description]
    })
    .select('id')
    .single();

  return newMaterial.id;
}
```

**PostgreSQL function for trigram search:**
```sql
CREATE OR REPLACE FUNCTION find_similar_material(
  p_org_id UUID,
  p_search_name TEXT,
  p_threshold REAL DEFAULT 0.3
)
RETURNS TABLE(id UUID, canonical_name TEXT, similarity REAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.canonical_name,
    similarity(m.canonical_name, p_search_name) AS similarity
  FROM materials m
  WHERE m.organization_id = p_org_id
    AND m.canonical_name % p_search_name
    AND similarity(m.canonical_name, p_search_name) > p_threshold
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Why This Works for Construction Materials

- **Species + Dimensions as composite key:** In lumber, the material identity IS the species + dimensions combination. "Ipe 5/4x6x16" is a specific thing regardless of how a supplier writes it.
- **Claude handles the hard part:** The AI is excellent at recognizing that "1.25x6x16 Ipe Decking S4S" means species="Ipe", dimensions="5/4x6x16" (converting 1.25" to 5/4 nominal).
- **pg_trgm catches drift:** Over time, if a new variation appears that Claude classifies slightly differently, the trigram index finds the closest existing canonical name.
- **Aliases accumulate knowledge:** Each new variation encountered gets added to the aliases array, building a lookup table of known representations.
- **Human review for low-confidence:** If trigram similarity is between 0.5 and 0.7, flag for human review rather than auto-matching.

### Confidence Levels for This Strategy

| Aspect | Confidence | Rationale |
|--------|------------|-----------|
| Claude structured extraction | HIGH | Official docs confirm guaranteed JSON schemas |
| pg_trgm fuzzy matching | HIGH | PostgreSQL official extension, well-documented |
| Species+dimensions as key | MEDIUM | Domain-specific design; works for lumber, needs validation for windows/cabinets |
| Alias accumulation | MEDIUM | Pattern works well in product catalogs; untested for construction materials specifically |

---

## Integration Points

### 1. Email Service to Edge Function

**Recommended:** Resend or CloudMailin for inbound email processing.

Setup: Configure `quotes@rossbuilt.com` to forward to email service, which sends webhook POST to Supabase Edge Function `ingest-email`.

**Webhook payload includes:** sender, subject, body (text + HTML), attachments (base64 or URL).

**Edge Function verifies:** webhook signature (HMAC) before processing.

**Source:** [CloudMailin Supabase guide](https://www.cloudmailin.com/blog/receive-email-with-supabase), [Supabase GitHub discussion on inbound email](https://github.com/orgs/supabase/discussions/40494) (MEDIUM confidence)

### 2. Supabase Storage

**Bucket:** `quotes` (private, RLS-protected)
**Path pattern:** `{organization_id}/{year}/{month}/{filename}`
**Access:** Signed URLs for viewing originals (1-hour expiry)

### 3. Claude API

**Models:**
- Quote extraction: `claude-sonnet-4-5-20250514` (cost-effective, fast for extraction)
- Natural language queries: `claude-sonnet-4-5-20250514` (same model, text-to-SQL is straightforward)
- Complex query interpretation: `claude-opus-4-6` (reserve for ambiguous queries)

**API patterns:**
- PDF: Send as `document` content block (base64)
- Excel: Send parsed JSON representation as text
- Email: Send raw email body as text
- All: Use `output_config.format` with JSON schema for guaranteed structure

### 4. React to Supabase

**Auth:** Supabase Auth with email/password (team members)
**Data:** Supabase JS client with auto-RLS (uses JWT from auth)
**Storage:** Direct upload from client to Storage bucket
**Realtime:** Channel subscriptions for processing status
**Edge Functions:** `supabase.functions.invoke('function-name', { body })` for processing and queries

---

## Suggested Build Order

The build order follows dependency chains. Each phase produces a working, testable increment.

### Phase 1: Foundation (Database + Auth + Storage)

**Build:**
- Supabase project setup
- Database schema (all tables, indexes, extensions)
- RLS policies
- Storage bucket configuration
- Auth setup (email/password)
- Basic React app shell with auth

**Why first:** Everything depends on the database schema and auth. Cannot build processing, upload, or query without these.

**Testable outcome:** Can log in, see empty dashboard.

### Phase 2: Manual Upload + AI Extraction Pipeline

**Build:**
- File upload UI (DropZone component)
- Upload to Supabase Storage
- Document record creation
- `parse-quote` Edge Function (Claude API + structured outputs)
- `normalize-material` Edge Function
- Job queue with pg_cron
- `process-document` orchestrator Edge Function
- Processing status display (Realtime subscription)
- Extracted data review UI

**Why second:** This is the core value proposition -- upload a quote, get structured data. Everything else builds on having data in the database.

**Testable outcome:** Upload a PDF quote, see extracted supplier + line items + pricing in the UI.

### Phase 3: Price Query Interface

**Build:**
- NaturalLanguageInput component
- `query-prices` Edge Function (text-to-SQL with Claude)
- QueryResults display (table + basic charts)
- Query log for improvement
- Price history materialized view

**Why third:** Requires data in the database (from Phase 2) to query against. The query interface is the second core value proposition.

**Testable outcome:** Type "What's the best price for Ipe 5/4x6?" and get results.

### Phase 4: Email Ingestion

**Build:**
- Email service setup (Resend or CloudMailin)
- `ingest-email` Edge Function
- Email-specific parsing (body text extraction, attachment handling)
- Webhook signature verification

**Why fourth:** Same processing pipeline as Phase 2, just a different entry point. The pipeline must exist first. Email is a convenience feature that adds adoption but isn't required for core functionality.

**Testable outcome:** Forward an email with a PDF quote attachment, see it processed automatically.

### Phase 5: Alerts + Polish

**Build:**
- Price alert trigger function
- Alert display components
- Dashboard with summary statistics
- Quote verification workflow (human review of AI extractions)
- Excel-specific parsing refinements

**Why last:** Alerts require historical data (accumulated over Phases 2-4). Dashboard requires enough data to be meaningful. Verification workflow is a refinement.

**Testable outcome:** Upload a quote with a high price, see an alert. View dashboard with pricing trends.

### Dependency Graph

```
Phase 1 (Foundation)
  |
  v
Phase 2 (Upload + AI Pipeline) -- core, most effort
  |
  +---> Phase 3 (Query Interface) -- second core feature
  |
  +---> Phase 4 (Email Ingestion) -- alternative input
  |
  v
Phase 5 (Alerts + Polish) -- requires accumulated data
```

---

## Scaling Considerations

| Concern | Threshold | Strategy |
|---------|-----------|----------|
| Quote volume | < 100/month for years | pg_cron every 30s is fine; no need for dedicated queue service |
| Claude API cost | ~$0.05-0.15 per quote (Sonnet) | Well within budget for 100 quotes/month (~$15/month) |
| Database size | Years of quotes = thousands of rows | PostgreSQL handles millions; no concern |
| Concurrent users | 2-5 team members | Supabase free/pro tier handles easily |
| Materialized view refresh | After each quote insert | Fine at low volume; at high volume, switch to periodic refresh |
| Text-to-SQL latency | < 10 second requirement | Claude Sonnet generates SQL in 1-3 seconds; total roundtrip ~5s |

**When to revisit architecture:**
- If quote volume exceeds 1,000/month: Consider dedicated queue (pgmq or Trigger.dev)
- If material catalog exceeds 10,000 entries: Consider vector embeddings for semantic search
- If multi-company SaaS: Consider schema-per-tenant isolation

---

## Anti-Patterns to Avoid

### 1. Client-Side PDF Parsing
**What goes wrong:** Using pdf.js or similar in the browser to extract text, then sending text to Claude.
**Why it's bad:** Loses table structure, images, and formatting that Claude's native PDF support preserves. Also moves compute to the user's device.
**Do instead:** Send the PDF directly to Claude as a document block. Claude handles text extraction internally with vision.

### 2. Inline Processing on Upload
**What goes wrong:** Uploading a file triggers an Edge Function that immediately processes it (download -> parse -> Claude API -> normalize -> insert).
**Why it's bad:** Edge Functions have timeout limits (default ~10s for request handler). Claude API call alone can take 5-10s for a multi-page PDF. Chaining operations risks timeout.
**Do instead:** Insert a `pending` document record and return immediately. Let the pg_cron job queue handle processing asynchronously.

### 3. Single Monolithic Edge Function
**What goes wrong:** One Edge Function does everything: download file, parse, call Claude, normalize materials, insert records, check alerts.
**Why it's bad:** Hard to debug, test, or retry individual steps. If normalization fails, you lose the extraction work.
**Do instead:** Separate functions for each concern. The orchestrator calls them in sequence but each can be tested and retried independently.

### 4. Storing Prices Without Units
**What goes wrong:** Storing `unit_price: 165` without recording that it's per piece, per linear foot, or per board foot.
**Why it's bad:** Comparing $165/piece to $8.50/board_foot is meaningless. Many construction materials are quoted in different units by different suppliers.
**Do instead:** Always store unit alongside price. Include unit normalization in the extraction schema.

### 5. Free-Text Material Names Without Canonicalization
**What goes wrong:** Storing the raw material description from each quote as-is without mapping to a canonical entry.
**Why it's bad:** "5/4x6x16 Ipe", "Ipe 5/4 x 6 x 16", and "Ipe decking 1.25x6x16" become three different materials, making price comparison impossible.
**Do instead:** Always map to a canonical `materials` entry using the two-tier normalization strategy.

### 6. Executing LLM-Generated SQL Without Validation
**What goes wrong:** Directly executing whatever SQL Claude generates against the database.
**Why it's bad:** Even with good prompting, an LLM could generate UPDATE, DELETE, or destructive statements. SQL injection via natural language prompt is a real risk.
**Do instead:** Whitelist only SELECT statements. Execute with a read-only PostgreSQL role. Log all generated queries.

### 7. Using Claude Opus for Everything
**What goes wrong:** Using the most powerful (and expensive) model for all API calls.
**Why it's bad:** Quote extraction and text-to-SQL are well-defined tasks where Sonnet performs comparably to Opus at 1/5 the cost.
**Do instead:** Use Sonnet for extraction and standard queries. Reserve Opus for ambiguous or complex cases where Sonnet produces poor results.

---

## State of the Art (2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf.js client-side extraction | Claude native PDF document blocks | 2024-2025 | No separate extraction step needed |
| Prompt-based JSON (hope for valid JSON) | Structured outputs with grammar constraints | Late 2025 | Guaranteed valid JSON, no retries |
| `output_format` parameter | `output_config.format` parameter | Late 2025 | API parameter migration (old still works) |
| Manual pg_cron + pg_net wiring | Supabase Queues + Background Tasks | 2025 | Simpler queue management |
| Regex-based material matching | LLM classification + pg_trgm hybrid | 2024-2025 | Handles natural language variation |

**New capabilities to leverage:**
- **Claude Files API:** Upload PDFs once, reference by file_id in multiple requests (useful if re-processing)
- **Prompt caching:** Cache the extraction prompt + schema for repeated quote processing (reduces latency and cost)
- **Supabase Background Tasks:** `EdgeRuntime.waitUntil()` for async processing within Edge Functions (up to 400s on paid plan)

---

## Open Questions

1. **Dimension normalization depth**
   - What we know: Lumber uses NominalxNominalxLength (2x4x8, 5/4x6x16)
   - What's unclear: How to normalize window sizes, cabinet dimensions, flooring quantities
   - Recommendation: Start with lumber-only normalization rules; add category-specific rules as those categories are onboarded

2. **Email service selection**
   - What we know: Resend, CloudMailin, and Mailgun all support inbound email webhooks to Edge Functions
   - What's unclear: Which has the best attachment handling and pricing for low volume
   - Recommendation: Evaluate Resend first (simplest setup, good Supabase ecosystem support), CloudMailin as backup

3. **Material unit conversion**
   - What we know: Same lumber can be quoted per piece, per linear foot, or per board foot
   - What's unclear: Whether to auto-convert units or store as-quoted and let queries handle conversion
   - Recommendation: Store as-quoted with original unit. Add a board_foot_equivalent column for standardized comparison on lumber. Let the query layer handle conversion context.

4. **Quote re-processing**
   - What we know: AI extraction will sometimes get things wrong; users need to correct
   - What's unclear: Should corrections re-trigger the full pipeline or just update the database?
   - Recommendation: Build a "review and edit" UI for extracted data. Edits update records directly. Store `is_verified` flag. Allow "re-process" button that re-sends original document to Claude.

---

## Sources

### Primary (HIGH confidence)
- [Claude API PDF Support](https://platform.claude.com/docs/en/build-with-claude/pdf-support) -- native PDF document blocks, token costs, limits
- [Claude Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- `output_config.format`, guaranteed JSON schema, Zod support
- [Supabase Background Tasks](https://supabase.com/docs/guides/functions/background-tasks) -- EdgeRuntime.waitUntil, time limits
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks) -- pg_net triggers, webhook-to-Edge Function
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS policy patterns
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) -- trigram similarity, GIN indexes
- [Supabase Realtime](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) -- postgres_changes subscriptions

### Secondary (MEDIUM confidence)
- [Supabase blog: Processing large jobs with Edge Functions](https://supabase.com/blog/processing-large-jobs-with-edge-functions) -- pg_cron + queue pattern
- [Supabase blog: Background Tasks, Ephemeral Storage, WebSockets](https://supabase.com/blog/edge-functions-background-tasks-websockets) -- Edge Function capabilities
- [Anthropic Cookbook: How to make SQL queries](https://platform.claude.com/cookbook/misc-how-to-make-sql-queries) -- text-to-SQL prompting patterns
- [CloudMailin Supabase guide](https://www.cloudmailin.com/blog/receive-email-with-supabase) -- email-to-webhook pattern
- [AWS blog: Enterprise NL-to-SQL](https://aws.amazon.com/blogs/machine-learning/enterprise-grade-natural-language-to-sql-generation-using-llms-balancing-accuracy-latency-and-scale/) -- text-to-SQL architecture
- [LLM-based extraction and normalization of product attributes](https://arxiv.org/html/2403.02130v4) -- AI normalization patterns

### Tertiary (LOW confidence)
- [SheetJS documentation](https://docs.sheetjs.com/) -- Excel parsing in Deno/Edge Functions (compatibility with Supabase Edge Runtime not verified)
- [Supabase GitHub discussion: Inbound email webhooks](https://github.com/orgs/supabase/discussions/40494) -- community patterns for email ingestion

---

## Metadata

**Confidence breakdown:**
- Database schema: HIGH -- standard PostgreSQL patterns, Supabase RLS is well-documented
- AI extraction pipeline: HIGH -- Claude PDF support and structured outputs are official, GA features
- Job queue pattern: HIGH -- pg_cron + Edge Functions is documented by Supabase with examples
- Material normalization: MEDIUM -- hybrid AI + pg_trgm is sound but untested for construction materials specifically
- Text-to-SQL query: MEDIUM -- well-established LLM pattern, but accuracy on construction domain queries needs validation
- Email ingestion: MEDIUM -- webhook pattern is standard, specific email service selection needs evaluation
- Excel parsing in Edge Functions: LOW -- SheetJS compatibility with Deno/Supabase Edge Runtime unverified

**Research date:** 2026-02-06
**Valid until:** 2026-03-08 (30 days -- Claude API and Supabase are stable; re-check if Supabase announces new queue primitives)

---
*Architecture research for: Construction Material Price Intelligence*
*Stack: React + Supabase (PostgreSQL, Storage, Edge Functions, Auth, Realtime) + Claude API*
*Researched: 2026-02-06*
