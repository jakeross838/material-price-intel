# Plan 09-01 Summary: Line Type Classification and Effective Pricing Schema

**Status:** Complete
**Completed:** 2026-02-11
**Duration:** ~3 minutes

## One-liner

Database migration adding line_type classification (material/discount/fee/subtotal_line/note), effective_unit_price for post-discount comparisons, and quote-level discount columns with updated RPC and TypeScript types.

## What Was Built

### Migration 010: line_type_and_effective_price.sql
- **line_type** column on line_items: TEXT NOT NULL DEFAULT 'material' with CHECK constraint for 5 values (material, discount, fee, subtotal_line, note)
- **effective_unit_price** column on line_items: NUMERIC(12,4) for post-discount unit pricing
- **applies_to_line_item_id** column on line_items: self-referencing UUID FK (ON DELETE SET NULL) for discount-to-material attribution
- **quote_discount_pct** on quotes: NUMERIC(5,2) for quote-wide percentage discounts
- **quote_discount_amount** on quotes: NUMERIC(12,2) for quote-wide fixed discounts
- **idx_line_items_line_type** index for filtering queries
- **Backfill** of effective_unit_price from existing discount_amount/discount_pct data
- **Updated update_quote_review RPC**: new p_quote_discount_pct and p_quote_discount_amount parameters, INSERT includes line_type/effective_unit_price/applies_to_line_item_id

### TypeScript Type Updates (types.ts)
- New `LineItemType` union type: 'material' | 'discount' | 'fee' | 'subtotal_line' | 'note'
- LineItem type: added line_type, effective_unit_price, applies_to_line_item_id
- Quote type: added quote_discount_pct, quote_discount_amount
- Database.Functions.update_quote_review Args: added p_quote_discount_pct, p_quote_discount_amount

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 4a9a524 | feat | Database migration with all schema changes and RPC update |
| f290d56 | feat | TypeScript types: LineItemType union, new fields on LineItem and Quote |

## Key Files

| File | Action | Purpose |
|------|--------|---------|
| supabase/migrations/010_line_type_and_effective_price.sql | Created | Schema migration + RPC update |
| src/lib/types.ts | Modified | TypeScript types matching new schema |

## Verification

- TypeScript compiles cleanly (npx tsc --noEmit passes with zero errors)
- All new columns have appropriate types and constraints
- SQL migration is syntactically valid with proper ALTER TABLE, CREATE INDEX, and CREATE OR REPLACE FUNCTION
- No existing fields removed or renamed -- purely additive
- Default values and nullable columns ensure backward compatibility

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| applies_to_line_item_id set to NULL in RPC INSERT | DELETE+INSERT pattern destroys row IDs; discount attribution set during AI extraction is source of truth |
| Backfill sets effective_unit_price = unit_price when no discount | Safe default; all existing rows get a value for comparison queries |

## Next Phase Readiness

This migration provides the schema foundation for all subsequent Phase 9 plans:
- Plan 02 (Enhanced AI Prompt): Can use line_type in extraction output
- Plan 03 (Effective Price Calculator): Can write to effective_unit_price
- Plan 04 (Backfill Migration): Can reclassify existing line_type values
- Plan 05 (Review UI): Can display line_type badges and effective pricing
- Plan 06 (Search/Reports): Can filter by line_type for accurate analytics
