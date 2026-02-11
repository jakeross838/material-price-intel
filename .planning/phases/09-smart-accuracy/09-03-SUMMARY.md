---
phase: 09-smart-accuracy
plan: 03
title: "Extraction Persistence and Normalization Filtering"
status: complete
duration: "~2 minutes"
completed: 2026-02-11

subsystem: edge-functions
tags: [persistence, effective-price, discount-attribution, line-type, normalization, edge-functions]

dependency_graph:
  requires: [09-01, 09-02]
  provides: [line-type-persistence, effective-unit-price-computation, discount-line-linking, material-only-normalization]
  affects: [09-04-backfill-migration, 09-05-review-ui, 09-06-search-reports]

tech_stack:
  added: []
  patterns:
    - "Two-pass INSERT+UPDATE for self-referencing FK (applies_to_line_item_id)"
    - "sort_order-to-id mapping for post-insert reference resolution"
    - "Cascading discount computation: per-item -> targeted discount lines -> quote-wide"

key_files:
  created: []
  modified:
    - material-price-intel/supabase/functions/process-document/index.ts
    - material-price-intel/supabase/functions/normalize-materials/index.ts

decisions:
  - "Two-pass approach needed because applies_to_line_item_id references DB row IDs that only exist after INSERT"
  - "Effective price rounded to 4 decimal places and floored at 0"
  - "Quote-wide discount applied multiplicatively after per-item and targeted discounts"
  - "Normalization uses .eq('line_type', 'material') server-side filter"

metrics:
  tasks_completed: 2
  tasks_total: 2
  commits: 2
---

# Phase 9 Plan 03: Extraction Persistence and Normalization Filtering Summary

**One-liner:** Two-pass persistence saving line_type and computing effective_unit_price with cascading discount attribution, plus normalization filtered to material-only items.

## What Was Done

### Task 1: Updated process-document persistence

Modified `persistExtraction` in `process-document/index.ts` with three changes:

**Quote-level discounts:** Added `quote_discount_pct` and `quote_discount_amount` to the quotes INSERT, persisting quote-wide discounts from the AI extraction.

**Line item classification fields:** Each line item now includes `line_type` (defaulting to 'material'), `effective_unit_price` (computed below), and `applies_to_line_item_id` (set in pass 2).

**Effective price computation:** For each material-type line item with a unit_price, the effective price is calculated through a three-stage cascade:
1. Per-item discounts from the material's own `discount_pct` or `discount_amount`
2. Targeted discount lines where `discount_applies_to` points to this material's index
3. Quote-wide discount percentage applied multiplicatively last

The result is rounded to 4 decimal places and floored at 0.

**Two-pass INSERT+UPDATE:** Line items are inserted first (with `.select("id, sort_order")`), then a sort_order-to-id mapping is built. Discount lines with `discount_applies_to` are updated with the actual `applies_to_line_item_id` UUID of their target material row.

### Task 2: Updated normalize-materials filtering

Added `.eq("line_type", "material")` to the line items query in `normalize-materials/index.ts`. This ensures discount, fee, subtotal_line, and note items are never sent to the AI classifier or linked to canonical materials. Updated the log message to indicate non-material items are skipped.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `2e1e3f4` | feat(09-03): persist line_type, compute effective_unit_price, and link discount attribution |
| 2 | `3c42688` | feat(09-03): filter normalization to material-type line items only |

## Verification

- Quote INSERT includes quote_discount_pct and quote_discount_amount
- Line item INSERT includes line_type, effective_unit_price, applies_to_line_item_id
- Effective price computation handles per-item discounts, targeted discount lines, and quote-wide discounts
- Pass 2 correctly resolves sort_order indices to DB row IDs for applies_to_line_item_id
- Normalization query filters on line_type = 'material', skipping non-material items
- No changes to findOrCreateSupplier, main handler, or validation flow

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Two-pass INSERT+UPDATE for self-referencing FK | applies_to_line_item_id references row IDs that only exist after INSERT; sort_order-to-id map resolves the reference |
| Effective price rounded to 4 decimal places, floored at 0 | Prevents floating point noise; negative prices are invalid |
| Quote-wide discount applied last (multiplicative) | Business logic: per-item discounts reduce base, then quote-wide applies to the already-discounted price |
| Server-side line_type filter on normalization query | More efficient than client-side filtering; Supabase handles the WHERE clause |

## Next Phase Readiness

Plans 09-04 through 09-06 can now proceed:
- Plan 04 (Backfill): Can reclassify existing line items using the same line_type values
- Plan 05 (Review UI): Can display line_type badges and effective_unit_price
- Plan 06 (Search/Reports): Can filter by line_type for accurate analytics using effective_unit_price
