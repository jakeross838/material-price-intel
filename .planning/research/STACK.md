# Stack Research: Material Price Intelligence System

**Domain:** Construction Material Price Intelligence (Document Parsing + AI Extraction + Analytics)
**Researched:** 2026-02-06
**Confidence:** HIGH (core stack), HIGH (document parsing), MEDIUM (email ingestion)

## Executive Summary

The recommended stack centers on **React 19 + Supabase (PostgreSQL/Storage/Edge Functions) + Claude API** as specified by the project constraints. Research confirms this is a strong foundation for the use case: Supabase Edge Functions (Deno 2.1) can orchestrate Claude API calls for document parsing, PostgreSQL provides the relational query power needed for price comparison, and Claude's structured output feature (GA, no beta header) eliminates the JSON parsing fragility that would otherwise plague an AI extraction pipeline.

The key architectural insight is that **all AI processing should happen in Supabase Edge Functions, not on the client**. PDFs get uploaded to Supabase Storage, an Edge Function downloads the file, sends it to Claude API with a Zod-defined extraction schema, and writes structured results to PostgreSQL. The client never touches the Claude API directly. This keeps API keys server-side, enables background processing for email-ingested quotes, and allows the extraction pipeline to evolve independently of the frontend.

For email ingestion, **Postmark Inbound** is recommended over alternatives for its mature webhook-to-JSON parsing with attachment support, straightforward pricing ($1.50/1000 emails), and 35MB attachment limit that covers all realistic quote sizes.

**Primary recommendation:** Ship with Vite + React 19 + TypeScript + shadcn/ui for the frontend, Supabase (Auth, Storage, Edge Functions, PostgreSQL) for the backend, Claude Haiku 4.5 for quote extraction (with Sonnet 4.5 fallback for complex documents), Postmark for email ingestion, and Zod schemas shared between frontend validation and Claude structured output definitions.

---

## Recommended Stack

### Core Platform

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **React** | 19.2.x | Frontend UI framework | Current stable. Matches existing Ross Built platform. Server Components stable but not needed here (SPA is fine for internal tool). | HIGH |
| **TypeScript** | 5.7.x | Type safety | Non-negotiable for a project with complex data schemas (line items, materials, pricing). Catches extraction schema mismatches at compile time. | HIGH |
| **Vite** | 7.3.x | Build tool / dev server | Current stable. 5x faster builds than Webpack. Zero-config TypeScript support. React template built-in. Requires Node.js 20.19+ or 22.12+. | HIGH |
| **Supabase** (platform) | — | Backend-as-a-service | Mandated by project constraints. PostgreSQL + Auth + Storage + Edge Functions + Realtime in one platform. Matches existing Ross Built infrastructure. | HIGH |
| **@supabase/supabase-js** | 2.95.x | Supabase client SDK | Official JS client. Handles auth, database queries, storage uploads, Edge Function invocation, and realtime subscriptions. | HIGH |
| **Supabase CLI** | 2.75.x | Local development | Required for Edge Function development, database migrations, and local testing. Uses Docker containers for full local Supabase stack. | HIGH |

### AI / Document Processing (Edge Functions)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **@anthropic-ai/sdk** | 0.73.x | Claude API client | Official Anthropic SDK for TypeScript. Supports structured outputs with `zodOutputFormat()` helper. Works in Deno 2.x Edge Functions via npm compatibility. | HIGH |
| **Claude Haiku 4.5** | — | Primary extraction model | $1/$5 per million tokens (5x cheaper than Sonnet). Optimized for structured extraction, classification, content transformation. A typical 3-page quote costs ~$0.005-0.015 to process. Fast enough for interactive use (<3s). | HIGH |
| **Claude Sonnet 4.5** | — | Fallback / NL query model | $3/$15 per million tokens. Use for: (1) complex/ambiguous quotes where Haiku confidence is low, (2) natural language to SQL translation (requires stronger reasoning), (3) material identity resolution for edge cases. | HIGH |
| **Zod** | 4.3.x | Schema validation | Defines extraction schemas shared between Claude structured output, Edge Function validation, and frontend form validation. Claude API's `zodOutputFormat()` helper takes Zod schemas directly. v4 is 14x faster than v3. | HIGH |
| **unpdf** | 0.12.x+ | PDF text extraction | Serverless-first PDF.js redistribution. Works in Deno, Node, browser. Zero dependencies. Use for pre-extraction text when sending to Claude (cheaper than sending PDF as base64 image). Falls back to Claude PDF vision for scanned/image PDFs. | HIGH |

### Email Ingestion

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Postmark** (Inbound) | — | Email receiving service | Parses incoming emails to JSON webhook with base64-encoded attachments. 35MB total attachment limit. $1.50/1000 emails. Mature, well-documented inbound API. Webhooks POST directly to a Supabase Edge Function. | MEDIUM |
| **postal-mime** | 2.x | Email MIME parsing (backup) | Lightweight email parser for browser/serverless. Use if raw MIME needs further parsing in Edge Functions. Postmark's JSON output typically makes this unnecessary. | MEDIUM |

### File Parsing

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **xlsx** (SheetJS) | 0.20.x | Excel file parsing | Install from SheetJS CDN (not stale npm registry). Parses .xlsx/.xls/.csv to JSON arrays. Use in Edge Function to convert spreadsheet quotes to text before Claude extraction. | HIGH |

### Frontend Libraries

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **shadcn/ui** | 3.7.x | Component library | Not a dependency -- copies accessible, customizable components into your project. Built on Radix UI + Tailwind CSS. February 2026: unified `radix-ui` package (cleaner deps). Perfect for data tables, forms, dialogs needed in this app. | HIGH |
| **Tailwind CSS** | 4.1.x | Utility-first CSS | Current stable. 5x faster builds than v3. Zero-config with Vite. shadcn/ui requires it. Ideal for rapid UI development on internal tools. | HIGH |
| **@tanstack/react-query** | 5.90.x | Server state management | Handles caching, refetching, optimistic updates for Supabase queries. Eliminates manual loading/error state management. Essential for the search/filter UI and quote list views. | HIGH |
| **react-router** | 7.13.x | Client-side routing | Current stable. v7 simplifies imports (everything from `react-router`). Non-breaking upgrade from v6. Sufficient for SPA routing (dashboard, upload, search, quote detail views). | HIGH |
| **react-dropzone** | 14.x | File upload UX | Drag-and-drop file upload component. Not a file uploader itself -- provides the UI, you handle upload to Supabase Storage. Pairs with shadcn/ui dropzone component pattern. | HIGH |
| **recharts** | 3.7.x | Price trend charts | React-native charting built on D3. Best balance of ease-of-use and customization for React. Used for price trend visualization (D6 feature). v3 is current stable. | MEDIUM |
| **date-fns** | 4.1.x | Date manipulation | Functional API, tree-shakeable. Used for quote date formatting, "X days ago" displays, date range filtering. Lighter effective bundle than dayjs due to tree-shaking. | HIGH |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| **ESLint** | 9.x | Code linting | Flat config format in v9. Use with `@typescript-eslint/parser`. |
| **Prettier** | 3.x | Code formatting | Consistent formatting across team. Use `prettier-plugin-tailwindcss` for class sorting. |
| **Docker Desktop** | latest | Supabase local dev | Required by Supabase CLI for local PostgreSQL, Auth, Storage containers. |
| **@tanstack/react-query-devtools** | 5.91.x | Query debugging | Visual devtools for React Query cache inspection during development. |

---

## Installation

```bash
# Initialize project
npm create vite@latest material-price-intel -- --template react-ts
cd material-price-intel

# Core Supabase + AI
npm install @supabase/supabase-js @anthropic-ai/sdk zod

# Frontend UI
npm install @tanstack/react-query react-router react-dropzone recharts date-fns

# Tailwind CSS v4 (Vite integration)
npm install tailwindcss @tailwindcss/vite

# shadcn/ui (component scaffolding -- run after project setup)
npx shadcn@latest init

# Dev dependencies
npm install -D @types/react @types/react-dom typescript eslint prettier
npm install -D @tanstack/react-query-devtools
npm install -D prettier-plugin-tailwindcss

# Supabase CLI (global install for local dev)
npm install -g supabase

# Initialize Supabase project locally
supabase init
```

**Edge Function dependencies** (installed per-function in `supabase/functions/`):
```bash
# These are imported via Deno/npm specifiers in Edge Functions, not installed via npm
# In your Edge Function code:
# import Anthropic from "npm:@anthropic-ai/sdk"
# import { z } from "npm:zod"
# import { getDocumentProxy, extractText } from "npm:unpdf"

# For Excel parsing in Edge Functions:
# import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs"
```

---

## Architecture Patterns

### Document Processing Pipeline

```
User uploads PDF/Email/Excel
        |
        v
[React Frontend] -- upload to --> [Supabase Storage]
        |
        v
[Edge Function: process-quote]
  1. Download file from Storage
  2. Extract text:
     - PDF: unpdf (text extraction) OR Claude PDF vision (scanned docs)
     - Excel: SheetJS to JSON
     - Email: Postmark JSON payload (already parsed)
  3. Send text + extraction schema to Claude API
     - Use Haiku 4.5 (fast, cheap) with Zod structured output
     - Schema defines: supplier, items[], delivery, tax, totals
  4. Validate extraction against Zod schema
  5. Write structured data to PostgreSQL
  6. Return extraction for user review
        |
        v
[React Frontend] -- review/edit --> [Supabase PostgreSQL]
```

### Claude API Call Pattern (Edge Function)

```typescript
// In supabase/functions/process-quote/index.ts
import Anthropic from "npm:@anthropic-ai/sdk";
import { z } from "npm:zod";

// Shared schema -- same Zod schema validates both Claude output AND frontend forms
const LineItemSchema = z.object({
  material_description: z.string(),
  canonical_name: z.string(),     // AI-normalized name for matching
  dimensions: z.string().optional(),
  quantity: z.number(),
  unit_of_measure: z.string(),    // "each", "LF", "BF", "MBF"
  unit_price: z.number(),
  line_total: z.number(),
  notes: z.string().optional(),
});

const QuoteExtractionSchema = z.object({
  supplier_name: z.string(),
  supplier_contact: z.string().optional(),
  quote_number: z.string().optional(),
  quote_date: z.string(),          // ISO date
  expiration_date: z.string().optional(),
  project_name: z.string().optional(),
  line_items: z.array(LineItemSchema),
  delivery_cost: z.number().optional(),
  tax_amount: z.number().optional(),
  tax_rate: z.number().optional(), // e.g., 0.07 for FL 7%
  subtotal: z.number().optional(),
  grand_total: z.number().optional(),
  confidence_notes: z.string(),    // AI self-assessment of extraction quality
});

// Use zodOutputFormat for guaranteed schema compliance
import { zodOutputFormat } from "npm:@anthropic-ai/sdk/helpers/zod";

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const response = await client.messages.create({
  model: "claude-haiku-4-5-20250507",
  max_tokens: 4096,
  temperature: 0.2,  // Low creativity for factual extraction
  system: `You are a construction material quote parser for a Florida custom home builder.
Extract ALL line items with exact pricing. Normalize material names to canonical form
(e.g., "PT 2x10x16" and "Pressure Treated 2"x10"x16'" both become "PT 2x10x16 #2 SYP").
Track FL 7% sales tax separately. Note any uncertainty in confidence_notes.`,
  messages: [{ role: "user", content: extractedText }],
  output_config: { format: zodOutputFormat(QuoteExtractionSchema) },
});
```

### Natural Language Query Pattern

```typescript
// Edge Function: query-prices
// 1. User asks: "What's the best price I've gotten for 5/4x6 Ipe?"
// 2. Claude Sonnet translates to SQL (stronger reasoning needed)
// 3. Execute SQL against PostgreSQL
// 4. Format and return results

const querySchema = z.object({
  sql_query: z.string(),
  explanation: z.string(),
  parameters: z.array(z.string()),
});

// System prompt includes full database schema so Claude generates valid SQL
const response = await client.messages.create({
  model: "claude-sonnet-4-5-20241022",
  system: `You translate natural language questions about construction material pricing
into PostgreSQL queries. Here is the database schema: [... schema ...]
Always use parameterized queries. Never use DELETE, UPDATE, INSERT, or DROP.`,
  messages: [{ role: "user", content: userQuestion }],
  output_config: { format: zodOutputFormat(querySchema) },
});

// Execute the generated SELECT query via Supabase RPC
const { data, error } = await supabase.rpc('execute_price_query', {
  query_text: response.content[0].text.sql_query,
  params: response.content[0].text.parameters,
});
```

### Email Ingestion Flow

```
Supplier sends quote to quotes@rossbuilt.com
        |
        v
[Postmark MX] -- receives email, parses to JSON
        |
        v
[Postmark Webhook] -- POST JSON to --> [Edge Function: ingest-email]
  JSON payload includes:
  - From, Subject, TextBody, HtmlBody
  - Attachments[]: { Name, ContentType, Content (base64) }
        |
        v
[Edge Function: ingest-email]
  1. Verify Postmark webhook signature
  2. Store original email metadata in PostgreSQL
  3. For each attachment:
     a. Decode base64
     b. Upload to Supabase Storage
  4. If PDF attachment: trigger process-quote function
  5. If Excel attachment: trigger process-quote function
  6. If email body only (no attachment): send body text to Claude for extraction
  7. Mark as "pending review" in database
        |
        v
[React Frontend] -- notification --> User reviews extraction
```

### Supabase Database Schema Pattern

```sql
-- Core tables (simplified)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  quote_number TEXT,
  quote_date DATE NOT NULL,
  expiration_date DATE,
  project_name TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'email', 'manual')),
  storage_path TEXT,          -- Path in Supabase Storage to original file
  delivery_cost DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  tax_rate DECIMAL(4,4),      -- 0.0700 for FL 7%
  subtotal DECIMAL(10,2),
  grand_total DECIMAL(10,2),
  extraction_confidence TEXT,  -- AI confidence notes
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'confirmed', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  material_description TEXT NOT NULL,  -- Original text from quote
  canonical_name TEXT,                 -- AI-normalized name for matching
  material_category TEXT DEFAULT 'lumber',
  dimensions TEXT,
  quantity DECIMAL(10,3) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  unit_price DECIMAL(10,4) NOT NULL,
  line_total DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast price lookups (< 10s requirement)
CREATE INDEX idx_line_items_canonical ON line_items(canonical_name);
CREATE INDEX idx_line_items_category ON line_items(material_category);
CREATE INDEX idx_quotes_supplier ON quotes(supplier_id);
CREATE INDEX idx_quotes_date ON quotes(quote_date DESC);
CREATE INDEX idx_quotes_project ON quotes(project_name);

-- Full-text search on material descriptions
ALTER TABLE line_items ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', material_description || ' ' || COALESCE(canonical_name, ''))) STORED;
CREATE INDEX idx_line_items_fts ON line_items USING gin(fts);

-- RLS policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;

-- Simple policy: authenticated users can read/write all (small team)
CREATE POLICY "Authenticated users full access" ON suppliers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON quotes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON line_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Project Structure

```
material-price-intel/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── quotes/          # Quote upload, review, list
│   │   ├── search/          # Price search, filters, NL query
│   │   └── dashboard/       # Summary stats, charts
│   ├── hooks/
│   │   ├── useQuotes.ts     # React Query hooks for quotes
│   │   ├── useSearch.ts     # Price search hooks
│   │   └── useSupabase.ts   # Supabase client hook
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client init
│   │   ├── schemas.ts       # Shared Zod schemas (extraction + forms)
│   │   └── utils.ts         # Helpers
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Upload.tsx
│   │   ├── QuoteDetail.tsx
│   │   ├── Search.tsx
│   │   └── Settings.tsx
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── functions/
│   │   ├── process-quote/    # AI extraction pipeline
│   │   ├── ingest-email/     # Postmark webhook handler
│   │   ├── query-prices/     # NL query -> SQL -> results
│   │   └── _shared/          # Shared schemas, utils
│   ├── migrations/           # SQL migration files
│   └── config.toml           # Local dev config
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Claude Haiku 4.5** (extraction) | Claude Sonnet 4.5 | When Haiku extraction quality is insufficient on complex/ambiguous quotes. Sonnet is 3x the cost but stronger reasoning. Consider a "try Haiku, escalate to Sonnet" pattern. |
| **Postmark** (email ingestion) | **Resend** | If you need tighter Supabase integration for outbound emails AND inbound. Resend has native Supabase partnership. However, Resend's inbound is newer (2025), requires separate API call to fetch attachments (not included in webhook), and inbound counts against send quota. |
| **Postmark** (email ingestion) | **Mailgun** | If you need regex-based routing rules on inbound email (e.g., different parsing for different supplier domains). More powerful routing but $35/mo minimum after trial vs Postmark's pay-per-email model. Overkill for this volume. |
| **Postmark** (email ingestion) | **SendGrid Inbound Parse** | If you already have a SendGrid account. 30MB limit vs Postmark's 35MB. Owned by Twilio. Pricing is bundled with general SendGrid plan. Less developer-friendly than Postmark for inbound-specific use. |
| **unpdf** (PDF text extraction) | **Claude PDF vision (direct)** | When PDFs are scanned images with no selectable text. unpdf extracts text from digital PDFs (much cheaper -- no Claude tokens for the text extraction step). Claude vision handles image PDFs but costs more tokens (~1500-3000 tokens/page as image vs near-zero for pre-extracted text). **Use both:** try unpdf first, fall back to Claude vision if text extraction yields little content. |
| **unpdf** (PDF text extraction) | **pdf-parse** | Never for this project. pdf-parse is unmaintained, incompatible with Deno runtime. unpdf is the modern replacement built for serverless. |
| **Zod** (schema validation) | **TypeBox / AJV** | If you need JSON Schema directly without transformation. But Zod's `zodOutputFormat()` integration with Anthropic SDK is a decisive advantage -- your extraction schema, API validation, and frontend form validation all use the same Zod definition. |
| **Recharts** (charts) | **Tremor** | If you want pre-built dashboard components (cards, metrics, lists) along with charts. Tremor uses Recharts under the hood plus adds Tailwind-styled dashboard primitives. Consider for v2 dashboard phase. |
| **shadcn/ui** (components) | **Ant Design / MUI** | If you want a batteries-included component library vs copy-paste components. But shadcn/ui gives full control, smaller bundle, and matches the Tailwind CSS stack. Ant Design and MUI add heavy dependencies. |
| **React Query** (server state) | **SWR** | If you prefer a simpler API. But React Query has better devtools, mutation support, and optimistic update patterns needed for the quote review/edit workflow. |
| **date-fns** (dates) | **dayjs** | If your team is more familiar with Moment.js-style chained API. date-fns is more tree-shakeable but either works. |
| **PostgreSQL full-text search** | **pgvector + embeddings** | For natural language search if exact text matching proves insufficient. pgvector is available in Supabase and could enable semantic search over material descriptions. However, for v1, full-text search + Claude NL-to-SQL is simpler and sufficient. Consider embeddings for v2 if material matching accuracy needs improvement. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **pdf-parse** (npm) | Unmaintained (last real update years ago). Incompatible with Deno runtime. Node.js-only with fs dependencies that fail in Edge Functions. | **unpdf** -- built specifically for serverless/edge environments, works in Deno. |
| **LangChain** | Massive dependency, heavy abstraction over simple API calls. This project makes direct Claude API calls with structured output -- LangChain adds complexity without value for this use case. | Direct **@anthropic-ai/sdk** calls with Zod schemas. Simpler, lighter, more debuggable. |
| **OpenAI / GPT for extraction** | Claude's structured output is GA and guaranteed schema-compliant via constrained decoding. Claude handles varied document formats exceptionally well. Mixing LLM providers adds complexity. | **Claude Haiku 4.5 / Sonnet 4.5** via Anthropic SDK. |
| **Tesseract.js** (client-side OCR) | Heavy (~30MB WASM), slow in browser, poor quality on complex layouts. If OCR is needed, Claude's vision handles it better. | **Claude PDF vision** for scanned documents. Send PDF pages as images to Claude. |
| **Express / Next.js API routes** | Adds a separate server to manage. Supabase Edge Functions handle all server-side logic (document processing, email webhooks, NL queries). No need for a separate Node.js server. | **Supabase Edge Functions** for all server-side processing. |
| **Firebase** | Not PostgreSQL. No SQL query power. No Edge Functions with Deno. Doesn't match existing Ross Built platform. | **Supabase** -- mandated by project. |
| **Moment.js** | Deprecated. Massive bundle size. The maintainers themselves recommend alternatives. | **date-fns** -- tree-shakeable, functional API. |
| **xlsx** from npm registry (0.18.5) | Stale. The npm registry version is 4+ years old. SheetJS publishes current versions only to their own CDN. | Install from **SheetJS CDN**: `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` |
| **Prisma / Drizzle ORM** | Supabase client SDK handles queries directly. Adding an ORM on top of Supabase is redundant complexity. Edge Functions use the Supabase client, not direct DB connections. | **@supabase/supabase-js** for queries + raw SQL via Supabase RPC for complex queries. |
| **Redux / Zustand** (global state) | This app's state is almost entirely server state (quotes, prices, search results). React Query handles server state caching. Minimal client-only state (UI toggles) is handled by React's built-in useState. | **@tanstack/react-query** for server state. React useState for UI state. |
| **AWS Lambda / Cloudflare Workers** | Adds external infrastructure to manage alongside Supabase. Edge Functions run on Supabase's platform with native access to Storage, Auth, and PostgreSQL. | **Supabase Edge Functions** -- integrated, no additional cloud provider needed. |

---

## Stack Patterns by Variant

### Document Processing Variant: Text PDF vs Scanned PDF

```
Quote arrives (PDF)
  |
  [unpdf: extractText()] -- attempt text extraction
  |
  Is extracted text substantive? (> 50 characters of content)
  |
  YES --> Send text to Claude Haiku (cheap, fast)
  |         ~$0.002-0.005 per quote
  |
  NO  --> Send PDF pages as images to Claude Sonnet (vision)
            ~$0.02-0.05 per quote (more tokens, higher model)
            Claude reads the scanned content directly
```

### Model Selection Variant: Cost vs Quality

| Scenario | Model | Estimated Cost | Rationale |
|----------|-------|---------------|-----------|
| Standard text PDF quote (1-5 pages) | Haiku 4.5 | $0.002-0.01 | Fast extraction, structured output, sufficient quality |
| Complex/ambiguous quote | Sonnet 4.5 | $0.01-0.05 | Better reasoning for unclear formats, unusual layouts |
| Scanned/image PDF | Sonnet 4.5 (vision) | $0.02-0.10 | Vision capability needed, Haiku may struggle with image quality |
| Natural language price query | Sonnet 4.5 | $0.005-0.02 | NL-to-SQL requires stronger reasoning than extraction |
| Material identity resolution | Haiku 4.5 | $0.001-0.003 | Pattern matching task, Haiku handles well |

**Monthly cost estimate (50 quotes/month + 100 queries/month):** $2-8/month in Claude API costs.

### Email Ingestion Variant: Service Comparison

| Criterion | Postmark | Resend | Mailgun | SendGrid |
|-----------|----------|--------|---------|----------|
| **Inbound maturity** | Mature (years) | New (2025) | Mature | Mature |
| **Attachment handling** | Base64 in webhook JSON | Separate API call needed | Base64 in webhook JSON | URL-encoded or raw MIME |
| **Max attachment size** | 35MB total | Not documented | 25MB per message | 30MB total |
| **Pricing** | $1.50/1000 emails | Counts against send quota | $35/mo min (Foundation) | Bundled with plan |
| **Free tier** | 100 emails/mo | 100 emails/mo (shared with outbound) | 1 month trial | Free tier available |
| **Webhook format** | Clean JSON | Metadata only (fetch content separately) | Multipart form-data or JSON | Multipart form-data |
| **Supabase integration** | Webhook to Edge Function | Native partnership (outbound) | Webhook to Edge Function | Webhook to Edge Function |
| **Developer docs quality** | Excellent | Good | Good | Good |
| **RECOMMENDATION** | **USE THIS** | Good for outbound, inbound is immature | Overkill for low volume | Acceptable alternative |

**Decision: Postmark** -- Cleanest inbound webhook format (full JSON with base64 attachments in a single POST), pay-per-email pricing that matches low volume (maybe 50-100 inbound emails/month), and excellent developer documentation. The fact that attachments arrive directly in the webhook payload (not requiring a separate API call like Resend) simplifies the Edge Function significantly.

---

## Supabase-Specific Patterns

### Edge Functions: Key Constraints

| Constraint | Limit | Impact on Architecture |
|------------|-------|----------------------|
| **CPU time** | 2 seconds per request | Claude API calls are async I/O, not CPU. Text extraction with unpdf IS CPU. Large PDFs may need chunked processing. |
| **Wall clock time** | 400 seconds | Claude API calls can take 5-30s. Plenty of headroom for extraction pipeline. |
| **Request idle timeout** | 150 seconds | Must send response before 150s. For slow Claude calls, consider async pattern: return immediately, process in background, update DB. |
| **Function size** | 20MB bundled | unpdf adds ~390KB. SheetJS adds ~1MB. Anthropic SDK is lightweight. Well within limits. |
| **Runtime** | Deno 2.1.4 | npm packages work via `npm:` specifier. Use `Deno.env.get()` for secrets. File writes only to `/tmp`. |

### Storage: Bucket Configuration

```typescript
// Create a private bucket for original quote files
// Private = RLS enforced on all operations
const { data, error } = await supabase.storage.createBucket('quotes', {
  public: false,
  fileSizeLimit: 52428800, // 50MB max
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'message/rfc822',
  ],
});

// Upload pattern: Use UUID + original extension
const filePath = `${userId}/${quoteId}/${originalFilename}`;
const { data, error } = await supabase.storage
  .from('quotes')
  .upload(filePath, file, { upsert: false });
```

### RLS: Storage Policies

```sql
-- Authenticated users can upload to quotes bucket
CREATE POLICY "Users can upload quotes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'quotes');

-- Authenticated users can view all quotes (small team, no per-user isolation needed)
CREATE POLICY "Users can view quotes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'quotes');

-- Edge Functions use service role key (bypasses RLS) for processing
```

### Database Functions (RPC)

```sql
-- Safe NL-to-SQL execution: only allows SELECT, returns results as JSON
CREATE OR REPLACE FUNCTION execute_price_query(query_text TEXT, params TEXT[])
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Safety check: only allow SELECT statements
  IF NOT (LOWER(TRIM(query_text)) LIKE 'select%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Execute and return as JSON
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query_text)
  INTO result;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;
```

---

## Version Compatibility Matrix

| Component | Minimum Version | Recommended Version | Max Tested | Notes |
|-----------|----------------|---------------------|------------|-------|
| Node.js | 20.19 | 22.x LTS | — | Required by Vite 7.x. Use LTS for stability. |
| React | 19.0 | 19.2.x | — | v19 required for latest React Router and shadcn/ui |
| TypeScript | 5.5 | 5.7.x | — | Needed for Zod v4 type inference |
| Vite | 7.0 | 7.3.x | — | Current stable line |
| Supabase CLI | 2.70 | 2.75.x | — | Deno 2.1 Edge Function support |
| Deno (Edge Functions) | 2.1 | 2.1.4 (platform) | — | Managed by Supabase, not user-configurable |
| @supabase/supabase-js | 2.90 | 2.95.x | — | Current stable |
| @anthropic-ai/sdk | 0.70 | 0.73.x | — | Structured output support (GA) |
| Zod | 4.0 | 4.3.x | — | v4 required for `zodOutputFormat` compatibility with latest SDK |
| Tailwind CSS | 4.0 | 4.1.x | — | v4 required for shadcn/ui latest |
| shadcn/ui | 3.5 | 3.7.x | — | February 2026 unified Radix UI package |

---

## Claude API Cost Estimates

### Per-Document Costs

| Document Type | Model | Input Tokens | Output Tokens | Cost |
|---------------|-------|-------------|---------------|------|
| 1-page text PDF | Haiku 4.5 | ~2,000 | ~500 | ~$0.004 |
| 3-page text PDF | Haiku 4.5 | ~5,000 | ~1,000 | ~$0.010 |
| 5-page text PDF | Haiku 4.5 | ~8,000 | ~1,500 | ~$0.016 |
| 1-page scanned PDF (vision) | Sonnet 4.5 | ~3,000 | ~500 | ~$0.017 |
| Email body (no attachment) | Haiku 4.5 | ~1,000 | ~500 | ~$0.004 |
| NL price query | Sonnet 4.5 | ~2,000 (incl. schema) | ~300 | ~$0.011 |

### Monthly Budget Projections

| Usage Level | Quotes/Month | Queries/Month | Estimated Monthly Cost |
|-------------|-------------|---------------|----------------------|
| Light (getting started) | 20 | 50 | $0.80 - $2.00 |
| Normal (active use) | 50 | 100 | $2.00 - $5.00 |
| Heavy (full team) | 100 | 300 | $5.00 - $15.00 |

These costs are for Claude API only. Supabase free tier covers the database/storage/auth for this volume. Postmark adds $0.05-$0.15/month for email ingestion at these volumes.

---

## Open Questions

1. **Zod v4 + @anthropic-ai/sdk `zodOutputFormat` compatibility:** The SDK's `zodOutputFormat` helper was built for Zod v3. Zod v4 is a major version upgrade with API changes. Need to verify at implementation time that `zodOutputFormat` works with Zod v4, or if `zod@3.x` must be used instead. **Mitigation:** Pin to `zod@3.23.x` initially if v4 compatibility is unconfirmed, upgrade later.
   **Confidence:** LOW -- this specific compatibility has not been verified via official documentation.

2. **unpdf in Supabase Edge Functions (Deno 2.1):** unpdf claims Deno compatibility, but the specific Supabase Edge Runtime (v1.70) may have quirks. The WASM-based PDF.js bundle might hit the 2-second CPU limit on very large PDFs. **Mitigation:** Test with representative PDFs during implementation. For large PDFs, consider sending directly to Claude vision (skipping text extraction).
   **Confidence:** MEDIUM -- unpdf explicitly lists Deno support, but not tested specifically in Supabase Edge Runtime.

3. **SheetJS in Deno:** SheetJS (xlsx) ESM builds should work with Deno's module system via CDN import, but Edge Function bundling via ESZip may introduce issues. **Mitigation:** Test early. Alternative is to parse Excel client-side before uploading structured data.
   **Confidence:** MEDIUM -- SheetJS provides ESM builds and claims Deno support.

4. **Postmark webhook verification in Edge Functions:** Postmark signs webhooks but the verification pattern needs to work in Deno. Standard HMAC verification should work with Web Crypto API available in Deno. **Mitigation:** Verify during email ingestion implementation phase.
   **Confidence:** MEDIUM -- Web Crypto API is available in Deno, standard HMAC patterns should work.

---

## Sources

### Primary (HIGH confidence)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions) -- Architecture, limits, Deno 2.1 runtime
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) -- CPU time, wall clock, function size limits
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- RLS policies for buckets
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) -- RPC patterns
- [Claude API Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- Zod integration, `zodOutputFormat`, `output_config.format`
- [Claude API PDF Support](https://platform.claude.com/docs/en/build-with-claude/pdf-support) -- Base64 encoding, vision for scanned docs, 1500-3000 tokens/page
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing) -- Haiku $1/$5, Sonnet $3/$15, Opus $5/$25 per million tokens
- [unpdf GitHub](https://github.com/unjs/unpdf) -- Serverless PDF extraction, Deno/Node/browser support
- [Postmark Inbound Webhook Docs](https://postmarkapp.com/developer/webhooks/inbound-webhook) -- JSON format, base64 attachments, 35MB limit
- [Postmark Inbound Pricing](https://postmarkapp.com/pricing) -- $1.50/1000 emails, free tier 100/month
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2) -- Current stable, Server Components stable
- [Vite Releases](https://vite.dev/releases) -- v7.3 current stable, Node.js 20.19+ required
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog) -- v3.7, Feb 2026 unified Radix UI package
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) -- v4.1.x current stable
- [Zod v4 Release](https://zod.dev/v4) -- 14x faster parsing, v4.3.x current
- [@tanstack/react-query npm](https://www.npmjs.com/package/@tanstack/react-query) -- v5.90.x current
- [react-router npm](https://www.npmjs.com/package/react-router) -- v7.13.x current
- [@anthropic-ai/sdk npm](https://www.npmjs.com/package/@anthropic-ai/sdk) -- v0.73.x current
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) -- v2.95.x current

### Secondary (MEDIUM confidence)
- [Supabase Edge Functions + Deno 2.1 Blog](https://supabase.com/blog/supabase-edge-functions-deploy-dashboard-deno-2-1) -- Deno 2 npm compatibility in Edge Functions
- [Supabase Automatic Embeddings Guide](https://supabase.com/docs/guides/ai/automatic-embeddings) -- pgvector patterns for future semantic search
- [SheetJS CDN](https://cdn.sheetjs.com/) -- Current v0.20.3, ESM builds for Deno
- [postal-mime npm](https://www.npmjs.com/package/postal-mime) -- Email MIME parsing for serverless
- [Resend Inbound Emails](https://resend.com/blog/inbound-emails) -- Alternative email service comparison
- [Mailgun Inbound Routing](https://www.mailgun.com/features/inbound-email-routing/) -- Alternative email service comparison
- [SendGrid Inbound Parse](https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/inbound-email) -- Alternative email service comparison
- [Recharts npm](https://www.npmjs.com/package/recharts) -- v3.7.x current, React charting
- [CloudMailin + Supabase](https://www.cloudmailin.com/blog/receive-email-with-supabase) -- Alternative email-to-Edge Function pattern

### Tertiary (LOW confidence)
- [Anthropic Structured Output Guide (Towards Data Science)](https://towardsdatascience.com/hands-on-with-anthropics-new-structured-output-capabilities/) -- Community guide, not official
- [7 PDF Parsing Libraries for Node.js (Strapi blog)](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025) -- Library comparison, editorial
- [Best React Chart Libraries 2025 (LogRocket)](https://blog.logrocket.com/best-react-chart-libraries-2025/) -- Chart library comparison, editorial

---

## Metadata

**Confidence breakdown:**
- Core stack (React, Supabase, TypeScript, Vite): **HIGH** -- Mandated by project, versions verified via npm/official docs
- AI extraction pipeline (Claude API, Zod, structured output): **HIGH** -- Verified via official Anthropic documentation, GA feature
- PDF extraction (unpdf): **HIGH** for capability, **MEDIUM** for Supabase Edge Runtime compatibility specifically
- Email ingestion (Postmark): **MEDIUM** -- Service is mature, but webhook-to-Edge-Function pattern is not officially documented by Supabase
- Excel parsing (SheetJS in Deno): **MEDIUM** -- ESM builds exist, Deno support claimed, not tested in Edge Runtime specifically
- Cost estimates: **MEDIUM** -- Based on official token pricing and page-to-token estimates, actual costs depend on document complexity
- NL-to-SQL pattern: **MEDIUM** -- Claude Sonnet performs well on text-to-SQL benchmarks (>90% accuracy), but safety of executing generated SQL requires careful implementation

**Research date:** 2026-02-06
**Valid until:** 2026-04-06 (2 months -- Claude API and Supabase evolve quickly; re-verify versions before implementation)

---
*Stack research for: Construction Material Price Intelligence*
*Project: Ross Built Custom Homes Material Pricing System*
*Researched: 2026-02-06*
