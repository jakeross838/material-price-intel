---
phase: 03-ai-extraction
plan: 02
subsystem: extraction
tags: [validation, persistence, supplier-matching, quotes, line-items, confidence-scoring, cross-validation]

dependency-graph:
  requires: [03-01]
  provides: [extraction-validation, extraction-persistence, supplier-find-or-create, end-to-end-extraction-pipeline]
  affects: [03-03, 04-review-ui]

tech-stack:
  added: []
  patterns: [tolerance-based-validation, find-or-create-with-race-handling, confidence-adjusted-status-routing]

file-tracking:
  key-files:
    created:
      - material-price-intel/supabase/functions/process-document/validation.ts
    modified:
      - material-price-intel/supabase/functions/process-document/index.ts

decisions:
  - id: tolerance-based-math-validation
    decision: "Use 1% or $0.02 tolerance for line-item math, $1.00 for totals"
    context: "Quotes often have rounding differences; exact equality would produce false-positive warnings"
  - id: confidence-reduction-per-warning
    decision: "Reduce confidence by 0.05 per validation warning, max -0.3, floor at 0.1"
    context: "Graduated degradation prevents single rounding issue from tanking confidence while accumulating errors push toward review"
  - id: raw-extraction-includes-validation
    decision: "Store validation_warnings alongside extraction in raw_extraction JSONB"
    context: "Phase 4 review UI can parse raw_extraction to highlight specific math issues for human reviewers"
  - id: review-needed-direct-update
    decision: "Use direct UPDATE for review_needed status (no RPC exists for it)"
    context: "complete_document RPC hardcodes status=completed; review_needed requires direct table update"
  - id: race-condition-handling
    decision: "Handle supplier unique constraint violation by re-querying on conflict"
    context: "If concurrent requests create the same supplier, the second INSERT fails with 23505; we re-query to get the existing id"

metrics:
  duration: "~3 minutes"
  completed: "2026-02-09"
---

# Phase 3 Plan 02: Validation + Persistence Summary

**One-liner:** Cross-validation module checks line-item math, subtotal aggregation, and grand total composition; persistence layer finds-or-creates suppliers by normalized_name, inserts quotes and line items, and routes documents to completed (confidence >= 0.7) or review_needed (confidence < 0.7) status.

## What Was Built

### Cross-Validation Module (`supabase/functions/process-document/validation.ts`)

Exports `validateExtraction(extraction: ExtractionResult): ValidationResult` and supporting types.

**Validation checks performed:**

1. **Line item math** -- For each line item with quantity, unit_price, and line_total: verifies `qty * unit_price - discount = line_total` within tolerance (1% or $0.02, whichever is greater). Also checks extended_price consistency.

2. **Subtotal aggregation** -- When subtotal is present and at least 2 line items have line_total: verifies sum of line_totals matches stated subtotal within $1.00 tolerance.

3. **Grand total composition** -- When total_amount is present: verifies `(subtotal or sum_of_lines) + tax_amount + delivery_cost = total_amount` within $1.00 tolerance.

4. **Tax rate consistency** -- When both tax_amount and subtotal are present: verifies `tax_amount / subtotal` matches stated tax_rate within 0.005 tolerance.

**Confidence adjustment:** Starts with `extraction.overall_confidence`, reduces by 0.05 per warning (max 0.3 reduction), floors at 0.1.

**Null safety:** All checks gracefully skip when operand values are null/undefined via the `isClose()` helper.

### Persistence Logic (`supabase/functions/process-document/index.ts`)

Two new functions added before the main handler:

**`findOrCreateSupplier(supabase, organizationId, supplierData)`**
- Normalizes supplier name: `trim().toLowerCase()`
- Queries `suppliers` table by `(organization_id, normalized_name)`
- If found: returns existing `id`
- If not found: inserts new supplier with all contact fields
- Handles unique constraint violation (code 23505) by re-querying -- protects against race conditions when concurrent requests create the same supplier

**`persistExtraction(supabase, documentId, organizationId, extraction, validation, rawResponse)`**
- Calls `findOrCreateSupplier` to get `supplier_id`
- Inserts quote row with all schema fields: supplier_id, quote_number, quote_date, valid_until, project_name, subtotal, delivery_cost, tax_amount, tax_rate, total_amount, payment_terms, notes, confidence_score, raw_extraction, is_verified=false
- Batch inserts line items with `sort_order` preserving original quote order, `material_id: null` (Phase 5)
- Routes document status: `complete_document` RPC for confidence >= 0.7, direct UPDATE for review_needed when confidence < 0.7
- Returns `quoteId`

**Handler updates:**
- After Claude response parsing (step 7), added step 8 (validateExtraction) and step 9 (persistExtraction)
- Response now includes `quote_id`, `confidence`, `warnings`, and `status`
- Error handler updated: calls `fail_document` RPC with "Persistence error:" prefix

### Data Flow (End-to-End)

```
document_id (pending)
  -> status: processing
  -> download PDF from Storage
  -> Claude Haiku 4.5 extracts ExtractionResult
  -> validateExtraction checks math consistency
  -> findOrCreateSupplier by normalized_name
  -> INSERT quote (with raw_extraction JSONB)
  -> INSERT line_items (batch, with sort_order)
  -> confidence >= 0.7? complete_document RPC (status: completed)
  -> confidence < 0.7? direct UPDATE (status: review_needed)
  -> Response: { quote_id, confidence, warnings, status }
```

On any error: `fail_document` RPC sets status to 'failed' with error message.

## Deviations from Plan

None -- plan executed exactly as written.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create cross-validation module | 1e141a4 | validation.ts |
| 2 | Add persistence logic and wire validation into Edge Function | ef01d60 | index.ts |

## Verification Results

| Check | Result |
|-------|--------|
| validation.ts exports validateExtraction and ValidationResult | PASS |
| Line item math check (qty * unit_price vs line_total) | PASS |
| Subtotal vs sum of line totals check | PASS |
| Grand total vs subtotal + tax + delivery check | PASS |
| Tolerance-based comparison (not exact equality) | PASS |
| Null values handled gracefully (checks skipped) | PASS |
| Adjusted confidence score returned | PASS |
| index.ts imports validateExtraction from ./validation.ts | PASS |
| findOrCreateSupplier uses normalized_name matching | PASS |
| findOrCreateSupplier handles unique constraint race condition | PASS |
| persistExtraction inserts quote with all schema fields | PASS |
| persistExtraction batch-inserts line items with sort_order | PASS |
| complete_document RPC called for high-confidence results | PASS |
| Document updated to review_needed for low-confidence results | PASS |
| raw_extraction JSONB includes extraction + validation_warnings | PASS |
| Error handling calls fail_document RPC | PASS |
| Response includes quote_id, confidence, and warnings | PASS |
| TypeScript compilation passes (tsc --noEmit) | PASS |

## Next Phase Readiness

Plan 03-02 completes the extraction pipeline end-to-end. Combined with Plan 03-01 (Claude API extraction) and Plan 03-03 (upload trigger wiring), Phase 3 is now fully complete:

- Upload a PDF -> document created (pending)
- Edge Function triggered -> extraction + validation + persistence
- High confidence -> document completed, quote + line items in database
- Low confidence -> document review_needed, quote still persisted for human review
- Errors -> document failed with descriptive message

**Phase 4 (Human Review UI)** can now:
- Query quotes and line_items tables for review_needed documents
- Parse `raw_extraction.validation_warnings` to highlight specific math issues
- Parse `raw_extraction.extraction` for per-line-item confidence scores
- Mark quotes as `is_verified = true` after human review

---
*Phase: 03-ai-extraction*
*Completed: 2026-02-09*
