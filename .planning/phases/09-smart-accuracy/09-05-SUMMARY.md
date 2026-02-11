# Phase 9 Plan 5: Review UI Line Classification Summary

Line type dropdown and effective price display in review and approved views with client-side reclassification recomputation

## What Was Done

### Task 1: Add line_type dropdown, effective price recomputation, and wire through ReviewForm
- Extended `EditableLineItem` type with `line_type`, `effective_unit_price`, `discount_pct`, `discount_amount` fields
- Added "Type" column to LineItemsEditor table with a `<select>` dropdown offering 5 options: Material, Discount, Fee, Subtotal, Note
- Color-coded dropdown and row backgrounds based on line_type (orange for discount, purple for fee, gray for subtotal/note)
- Updated `handleFieldChange` to recompute `effective_unit_price` when reclassifying: computes from unit_price/discount fields when changing TO material, nulls when changing AWAY from material
- Updated `handleAddRow` to default new items to `line_type: 'material'`
- Updated ReviewForm `gatherFormData()` to include `line_type` and `effective_unit_price` in the line items payload
- Updated `QuoteReviewUpdate` type in useQuoteReview.ts to accept `line_type: string` and `effective_unit_price: number | null`

### Task 2: Update QuoteDetailPage approved view with line type badges and effective price column
- Added `LineTypeBadge` component with 5 color-coded badge configurations (blue/material, orange/discount, purple/fee, gray/subtotal, gray-italic/note)
- Added "Type" and "Eff. Price" columns to the approved view line items table
- Non-material rows dimmed with `opacity-60` for visual distinction
- Effective price column shows formatted currency when different from unit_price, em-dash otherwise
- Updated editable line items initialization to map `line_type`, `effective_unit_price`, `discount_pct`, `discount_amount` from database

## Deviations from Plan

None -- plan executed exactly as written.

Note: Task 2's QuoteDetailPage.tsx changes were committed together with parallel plan 09-06's changes in commit `acb8fa1` due to concurrent execution. The changes are correct and present.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Native `<select>` element for line_type dropdown | Lightweight, no extra dependency; matches existing form patterns in the review UI |
| Effective price recomputation only on line_type change | Avoids recomputing on every field edit; explicit reclassification is the trigger |

## Files Modified

| File | Changes |
|------|---------|
| `material-price-intel/src/components/review/LineItemsEditor.tsx` | Extended EditableLineItem type, added Type column with dropdown, color-coded rows, recomputation logic |
| `material-price-intel/src/components/review/ReviewForm.tsx` | Added line_type and effective_unit_price to gatherFormData payload |
| `material-price-intel/src/hooks/useQuoteReview.ts` | Extended QuoteReviewUpdate line_items type with line_type and effective_unit_price |
| `material-price-intel/src/pages/QuoteDetailPage.tsx` | Added LineTypeBadge, Type/Eff. Price columns, non-material dimming, editable items initialization |

## Duration

~5 minutes (2026-02-11T14:27:20Z to 2026-02-11T14:32:24Z)
