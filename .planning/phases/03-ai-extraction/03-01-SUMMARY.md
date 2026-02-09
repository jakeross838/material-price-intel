---
phase: 03-ai-extraction
plan: 01
subsystem: extraction
tags: [edge-function, claude-api, pdf-extraction, deno, anthropic-sdk, structured-output]

dependency-graph:
  requires: [02-01, 02-02]
  provides: [process-document-edge-function, extraction-types, extraction-prompt]
  affects: [03-02, 04-review-ui]

tech-stack:
  added: [anthropic-sdk-npm, supabase-edge-functions]
  patterns: [deno-serve-handler, native-pdf-document-block, chunked-base64-encoding, service-role-supabase-client]

file-tracking:
  key-files:
    created:
      - material-price-intel/supabase/functions/process-document/index.ts
      - material-price-intel/supabase/functions/process-document/types.ts
      - material-price-intel/supabase/functions/process-document/prompt.ts
    modified: []

decisions:
  - id: haiku-4-5-model
    decision: "Use claude-haiku-4-5-20250315 for extraction"
    context: "Cost-efficient and capable enough for structured data extraction from PDFs"
  - id: native-document-block
    decision: "Send PDF as native document content block, not text extraction"
    context: "Claude's native PDF support preserves table layouts, fonts, and visual structure for better extraction accuracy"
  - id: chunked-base64
    decision: "Use chunked approach (8192 bytes) for base64 encoding"
    context: "Avoids call stack overflow from spread operator on large Uint8Arrays"
  - id: service-role-key
    decision: "Edge Function uses SUPABASE_SERVICE_ROLE_KEY, not anon key"
    context: "Needs elevated access to bypass RLS for cross-table operations (documents, fail_document RPC)"

metrics:
  duration: "~5 minutes"
  completed: "2026-02-09"
---

# Phase 3 Plan 01: Core Extraction Edge Function Summary

**One-liner:** Deno Edge Function that claims a document, downloads its PDF from Storage, sends it to Claude Haiku 4.5 as a native document block with a detailed extraction prompt, and returns strongly-typed ExtractionResult JSON with supplier info, line items, totals, and per-field confidence scores.

## What Was Built

### Extraction Types (`supabase/functions/process-document/types.ts`)

Four exported type aliases defining the extraction schema:

**`ExtractedSupplier`** -- Supplier name, contact name, email, phone, address. All fields nullable except name.

**`ExtractedLineItem`** -- Raw description, quantity, unit (normalized short code), unit_price, extended_price, discount_pct, discount_amount, line_total, notes, and a confidence score (0.0-1.0). Designed to map directly to the `line_items` database table.

**`ExtractedTotals`** -- Subtotal, delivery_cost, tax_amount, tax_rate (decimal), total_amount. All nullable for quotes that omit totals.

**`ExtractionResult`** -- Top-level shape combining supplier, quote metadata (number, date, valid_until, project, payment_terms, notes), line_items array, totals, overall_confidence, and extraction_notes for Claude to flag issues.

### Extraction Prompt (`supabase/functions/process-document/prompt.ts`)

Exports `buildExtractionMessages(base64Data, mediaType)` that returns `{ system, messages }` compatible with Anthropic SDK's `messages.create()`.

The system prompt covers:
- Exact JSON schema matching ExtractionResult type
- Confidence scoring rubric (1.0 = unambiguous, 0.7-0.9 = some interpretation, 0.3-0.6 = partially visible, <0.3 = guessed)
- Both formal PDF table and casual text quote handling
- Unit normalization to short codes (pc, lf, bf, sqft, ea, bundle, sheet, bag, roll, gal, box)
- YYYY-MM-DD date format requirement
- Plain number monetary values (no $ or commas)
- Null for genuinely missing fields (not 0 or empty string)
- Extract ALL line items, not samples
- Delivery/tax go in totals, not line items
- JSON-only output (no markdown fencing, no explanation text)

The user message includes the PDF as a native document content block (`type: "document"`) plus a text instruction block.

### Edge Function Handler (`supabase/functions/process-document/index.ts`)

`Deno.serve()` handler implementing the full extraction flow:

1. **Request parsing** -- Extracts `document_id` from JSON body, returns 400 if missing
2. **Supabase client** -- Service role client via `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
3. **Document fetch** -- Queries documents table, validates status is pending/processing
4. **Status update** -- Sets status to 'processing' with started_at if still pending (allows retry for already-processing)
5. **PDF download** -- Downloads from Storage bucket 'documents' using document.file_path
6. **Base64 encoding** -- Chunked conversion (8192 bytes per chunk) to avoid stack overflow
7. **Claude API call** -- Anthropic SDK with `claude-haiku-4-5-20250315`, 16384 max_tokens
8. **Response parsing** -- Extracts text content, parses JSON into ExtractionResult with specific error handling for parse failures
9. **Error handling** -- Global try/catch calls `fail_document()` RPC on any error, returns 500

CORS headers included for client-side invocation. OPTIONS preflight handled.

**Note:** This function returns the extraction result but does NOT persist to the database. Plan 02 will add database persistence logic.

## Deviations from Plan

None -- plan executed exactly as written.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Extraction types and prompt module | 33aa6eb | types.ts, prompt.ts |
| 2 | Edge Function handler with PDF retrieval and Claude API call | 13f5708 | index.ts |

## Verification Results

| Check | Result |
|-------|--------|
| All three files exist in process-document/ | PASS |
| types.ts exports ExtractionResult, ExtractedSupplier, ExtractedLineItem, ExtractedTotals | PASS |
| prompt.ts exports buildExtractionMessages function | PASS |
| System prompt includes JSON schema matching types | PASS |
| User message includes document content block | PASS |
| No Node.js-specific imports (no require(), no bare imports) | PASS |
| Uses Deno.serve() (not std library serve) | PASS |
| Imports via npm: specifiers (Anthropic SDK, Supabase) | PASS |
| Supabase client uses SUPABASE_SERVICE_ROLE_KEY | PASS |
| Downloads PDF from Storage bucket 'documents' | PASS |
| Chunked base64 encoding (not single spread) | PASS |
| Model is claude-haiku-4-5-20250315 | PASS |
| CORS headers and OPTIONS handler present | PASS |
| Error handling calls fail_document RPC | PASS |
| npm run build in React app still passes | PASS |

## Next Phase Readiness

Plan 01 delivers the core extraction engine. The Edge Function can receive a document_id, download the PDF, send it to Claude, and return a structured ExtractionResult. Plan 02 will add database persistence -- writing the extraction result to the quotes and line_items tables, updating document status to completed, and handling supplier matching/creation.

**Deployment prerequisite:** The `ANTHROPIC_API_KEY` environment variable must be set in Supabase Edge Function secrets before deploying:
```
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---
*Phase: 03-ai-extraction*
*Completed: 2026-02-09*
