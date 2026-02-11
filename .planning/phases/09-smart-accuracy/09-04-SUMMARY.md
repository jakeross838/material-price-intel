# Plan 09-04 Summary: Backfill Migration for Line Type Reclassification

**Status:** Complete
**Completed:** 2026-02-11
**Duration:** ~2 minutes

## One-liner

SQL migration 011 pattern-matches existing line items to reclassify discount/fee/subtotal/note rows, computes effective_unit_price with GREATEST(0,...) floor, and unlinks non-material items from canonical materials.

## What Was Built

### Migration 011: backfill_line_types.sql

Six-section data migration that upgrades existing line items from the blanket `line_type='material'` default (set by migration 010) to accurate classifications:

1. **Discount reclassification** -- Matches descriptions containing "discount", "credit", "adjustment", "rebate", "allowance" plus structural patterns (null qty/unit/price with discount_pct or discount_amount set) and negative line_total with discount keywords
2. **Fee reclassification** -- Matches "surcharge", "handling fee", "minimum charge", "setup fee", etc. with safety guard excluding items that have material-like units (pc, lf, bf, sqft, ea, bundle, sheet)
3. **Subtotal reclassification** -- Matches "subtotal", "section total", "grand total" etc. with safety guard requiring null quantity and unit
4. **Note reclassification** -- Matches informational text ("prices valid", "terms:", "conditions:", etc.) or descriptions over 100 chars, all requiring null pricing columns
5. **Effective price computation** -- Calculates effective_unit_price for all material items: applies discount_amount per-unit or discount_pct percentage, with GREATEST(0,...) floor to prevent negative prices
6. **Non-material unlinking** -- Sets material_id=NULL on any reclassified items to prevent discount/fee/subtotal/note rows from appearing in material price history

### Design Principles

- **Conservative**: Only high-confidence matches are reclassified; ambiguous items stay as 'material' for human review in the Review UI (Plan 05)
- **Safe**: No data deleted, only line_type, effective_unit_price, and material_id columns modified
- **Ordered**: Reclassifications run before effective_unit_price computation, ensuring section 5 only processes true materials

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 171204a | feat | Backfill migration with 6 sections: reclassify + effective price + unlink |

## Key Files

| File | Action | Purpose |
|------|--------|---------|
| supabase/migrations/011_backfill_line_types.sql | Created | Data migration reclassifying existing line items |

## Verification

- 6 sections present: discount, fee, subtotal_line, note reclassification + effective_unit_price computation + unlink non-materials
- Each reclassification has safety guards (unit exclusions, null checks, pattern specificity)
- effective_unit_price handles both discount_amount and discount_pct with GREATEST(0,...) floor
- Non-material items get material_id set to NULL
- No DELETE statements -- purely UPDATE-based, all original data preserved

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Conservative reclassification (high-confidence only) | Ambiguous items stay as 'material' for human review; false negatives are preferable to false positives |
| GREATEST(0,...) floor on effective_unit_price | Prevents negative effective prices from unusual discount configurations |
| Section ordering: reclassify before compute | Ensures effective_unit_price section 5 only processes rows that remain line_type='material' |

## Next Phase Readiness

Migration 011 prepares the data layer for:
- **Plan 05 (Review UI)**: Line type badges will show accurate classifications for existing data
- **Plan 06 (Search/Reports)**: Filtering by line_type='material' will exclude discount/fee/subtotal/note rows from price comparisons and trend charts
