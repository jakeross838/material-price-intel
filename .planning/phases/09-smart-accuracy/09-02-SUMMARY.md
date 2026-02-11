---
phase: 09-smart-accuracy
plan: 02
title: "Line Item Classification and Discount Attribution"
status: complete
duration: "~3 minutes"
completed: 2026-02-11

subsystem: ai-extraction
tags: [line-type, discount-attribution, validation, prompt-engineering, edge-functions]

dependency_graph:
  requires: [phase-03-ai-extraction]
  provides: [line-item-classification, discount-attribution, impossible-price-detection, pricing-flags]
  affects: [09-03-persistence-layer, 09-04-review-ui-upgrade, 09-05-search-filtering]

tech_stack:
  added: []
  patterns:
    - "LineItemType union for 5-way line classification"
    - "Discount attribution via 0-based index referencing"
    - "Supplementary validation sections (additive, non-destructive)"
    - "Adjusted subtotal recalculation excluding non-material items"

key_files:
  created: []
  modified:
    - material-price-intel/supabase/functions/process-document/types.ts
    - material-price-intel/supabase/functions/process-document/prompt.ts
    - material-price-intel/supabase/functions/process-document/validation.ts

decisions:
  - "LineItemType is a 5-value union: material, discount, fee, subtotal_line, note"
  - "discount_applies_to uses 0-based line index for per-item attribution, null for quote-wide"
  - "pricing_flag captures call-for-pricing, zero-price, and negative-quantity edge cases"
  - "is_credit boolean distinguishes legitimate returns from suspicious negative amounts"
  - "Validation sections 5 and 6 are purely additive -- existing 4 sections unchanged"

metrics:
  tasks_completed: 3
  tasks_total: 3
  commits: 3
---

# Phase 9 Plan 02: Line Item Classification and Discount Attribution Summary

**One-liner:** Extraction types, prompt, and validation updated to classify line items into 5 types (material/discount/fee/subtotal/note), attribute discounts to specific materials, and catch impossible prices.

## What Was Done

### Task 1: Updated Extraction Types
Added `LineItemType` union type and four new fields to `ExtractedLineItem`:
- `line_type`: Classifies each line as material, discount, fee, subtotal_line, or note
- `discount_applies_to`: 0-based index linking a discount to its target material
- `is_credit`: Boolean flag for return/credit lines with negative amounts
- `pricing_flag`: Captures call-for-pricing, zero-price, and negative-quantity edge cases

Added two new fields to `ExtractionResult`:
- `quote_discount_pct`: Quote-wide discount percentage
- `quote_discount_amount`: Quote-wide discount dollar amount

### Task 2: Updated Extraction Prompt
Added three new instructional sections to the system prompt:

**Line Item Classification Rules** -- Defines all 5 line types with real-world examples (Ipe lumber, screws for material; volume discounts, loyalty credits for discount; fuel surcharges for fee; section totals for subtotal_line; validity notes for note).

**Discount Attribution Rules** -- Four scenarios: per-item discount (linked by index), multi-item discount (null with note), quote-wide discount (captured in top-level fields), ambiguous discount (null with reduced confidence).

**Edge Case Handling** -- Seven cases: call-for-pricing items, $0.00 unit price materials, negative quantities without credit context, credit/return lines, minimum order charges, bundle pricing, volume tier pricing.

Updated Rule 7 to keep discount lines as separate items (not merged). Added Rule 11 (mandatory line_type) and Rule 12 (credit/return handling).

### Task 3: Enhanced Validation
Added two new validation sections (purely additive, existing 4 sections unchanged):

**Section 5 -- Line type consistency checks:**
- 5a: Material items must have unit_price (unless call-for-pricing)
- 5b: $0.00 unit_price on material must be flagged as zero_price
- 5c: Discount lines must have discount_pct, discount_amount, or negative line_total
- 5d: Negative quantities on non-credit lines flagged for review

**Section 6 -- Adjusted subtotal check:**
- Recalculates subtotal excluding subtotal_line and note items
- Removes false-positive section-2 subtotal warnings caused by including subtotal lines in the sum

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `83f6a14` | feat(09-02): add line item classification and discount attribution types |
| 2 | `4b65528` | feat(09-02): teach extraction prompt line item classification and discount attribution |
| 3 | `d7503d6` | feat(09-02): add line type consistency and impossible price validation checks |

## Decisions Made

1. **LineItemType as 5-value union** -- material, discount, fee, subtotal_line, note. Covers all observed line types in real lumber quotes.
2. **0-based index for discount_applies_to** -- Simple, unambiguous linking. Null means quote-wide or unattributed.
3. **pricing_flag string instead of boolean** -- Three distinct edge cases (call_for_pricing, zero_price, negative_quantity) need differentiation beyond a boolean.
4. **is_credit separate from pricing_flag** -- Credits are legitimate business operations, not data quality issues.
5. **Additive validation only** -- Sections 5 and 6 do not modify existing validation logic, preventing regressions.

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

Plan 09-03 (persistence layer) can now proceed. The updated types define the schema that the persistence layer must handle when storing line items with their new classification and attribution fields.
