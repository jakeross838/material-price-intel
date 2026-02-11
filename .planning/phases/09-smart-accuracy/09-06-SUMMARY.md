---
phase: 09-smart-accuracy
plan: 06
title: "Search and Reports Effective Price Integration"
status: complete
duration: "~4 minutes"
completed: 2026-02-11

subsystem: frontend
tags: [effective-unit-price, material-filtering, search, reports, charts, line-type]

dependency_graph:
  requires: [09-01, 09-03]
  provides: [effective-price-search, effective-price-reports, material-only-filtering]
  affects: []

tech_stack:
  added: []
  patterns:
    - "Fallback pattern: effective_unit_price ?? unit_price for backward compatibility"
    - "Server-side line_type filtering via .eq('line_type', 'material') on all consumer queries"
    - "Struck-through raw price display when effective price differs"

key_files:
  created: []
  modified:
    - material-price-intel/src/pages/SearchPage.tsx
    - material-price-intel/src/hooks/useReportsData.ts
    - material-price-intel/src/pages/ReportsPage.tsx
    - material-price-intel/src/components/reports/PriceTrendChart.tsx
    - material-price-intel/src/components/reports/CategoryAggregateChart.tsx

decisions:
  - "Fallback to unit_price when effective_unit_price is null for backward compatibility with pre-classification data"
  - "Chart components updated alongside ReportsPage to ensure consistent effective price usage"

metrics:
  tasks_completed: 2
  tasks_total: 2
  commits: 2
---

# Phase 9 Plan 06: Search and Reports Effective Price Integration Summary

**One-liner:** Search and Reports pages now filter to material-only items and use effective_unit_price for all price stats, sorting, charts, and comparisons, with struck-through raw price display when discounts apply.

## What Was Done

### Task 1: Updated SearchPage to filter by material type and show effective prices

Modified `SearchPage.tsx` with five changes:

**PriceResult type:** Added `effective_unit_price: number | null` and `line_type: string` fields to the type definition.

**Query filtering:** Added `.eq("line_type", "material")` to the Supabase query, ensuring discounts, fees, subtotals, and notes are excluded from search results. Also added `effective_unit_price` and `line_type` to the select clause.

**Price stats:** Updated the `priceStats` useMemo to compute min/max/avg from `effective_unit_price ?? unit_price` instead of raw `unit_price`. This ensures stat cards reflect what users actually paid after discounts.

**Sorting:** Updated `price_asc` and `price_desc` sort cases to use `effective_unit_price ?? unit_price ?? 0` for consistent ordering by post-discount price.

**Table display:** The Unit Price column now shows `effective_unit_price` as the primary value. When `effective_unit_price` differs from `unit_price` (indicating a discount was applied), the raw price is shown below in a smaller struck-through style, making the discount visually clear.

### Task 2: Updated Reports hooks, page, and charts to use effective prices

**useReportsData.ts:** Added `effectiveUnitPrice: number` to `ReportDataPoint` type. Updated the query to select `effective_unit_price` and `line_type`, and added `.eq("line_type", "material")` filter. The mapping uses `(item.effective_unit_price as number) ?? (item.unit_price as number)` for the fallback.

**ReportsPage.tsx:** Updated all 4 computation references in the `stats` useMemo:
- `filteredData.map((d) => d.effectiveUnitPrice)` for average price calculation
- `sorted.slice(0, mid).map((d) => d.effectiveUnitPrice)` for older half trend
- `sorted.slice(mid).map((d) => d.effectiveUnitPrice)` for recent half trend
- `entry.total += d.effectiveUnitPrice` for best supplier calculation

**PriceTrendChart.tsx:** Updated supplier price grouping from `d.unitPrice` to `d.effectiveUnitPrice` so chart lines reflect post-discount prices.

**CategoryAggregateChart.tsx:** Updated category price grouping from `d.unitPrice` to `d.effectiveUnitPrice` so category trend averages reflect post-discount prices.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `41a19d0` | feat(09-06): update SearchPage to filter by material type and show effective prices |
| 2 | `acb8fa1` | feat(09-06): update Reports hooks, page, and charts to use effective prices |

## Verification

- SearchPage PriceResult includes effective_unit_price and line_type
- SearchPage query filters by line_type = 'material'
- SearchPage query selects effective_unit_price
- Price stats use effective_unit_price with fallback to unit_price
- Sorting uses effective_unit_price with fallback
- Table shows effective price primary, raw price struck-through when different
- useReportsData ReportDataPoint includes effectiveUnitPrice
- Reports query filters by line_type = 'material'
- All 4 stat computation references in ReportsPage use effectiveUnitPrice
- PriceTrendChart uses effectiveUnitPrice for supplier grouping
- CategoryAggregateChart uses effectiveUnitPrice for category grouping
- No remaining .unitPrice in any computation code (only in type definition and mapping)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated chart components to use effectiveUnitPrice**

- **Found during:** Task 2
- **Issue:** PriceTrendChart.tsx (line 154) and CategoryAggregateChart.tsx (line 162) both used `d.unitPrice` for their internal price grouping computations. The plan only specified updating ReportsPage.tsx, but the chart components also needed updating to render effective prices in the actual chart visualizations.
- **Fix:** Changed `entry.total += d.unitPrice` to `entry.total += d.effectiveUnitPrice` in both chart components.
- **Files modified:** PriceTrendChart.tsx, CategoryAggregateChart.tsx
- **Commit:** `acb8fa1` (included in Task 2 commit)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Fallback to unit_price when effective_unit_price is null | Backward compatibility: pre-classification data may not have effective_unit_price populated yet |
| Chart components updated alongside ReportsPage | Charts consume the same ReportDataPoint data and would have rendered raw prices if left unchanged |

## Next Phase Readiness

Phase 9 Plan 06 is the final plan in Phase 9 (Smart Accuracy). All 6 plans are now complete:
- Plan 01: Schema + types for line_type and effective_unit_price
- Plan 02: AI prompt updates for line classification
- Plan 03: Extraction persistence and normalization filtering
- Plan 04: Backfill migration for existing data
- Plan 05: Review UI updates
- Plan 06: Search and Reports effective price integration (this plan)

The system now classifies line items, computes effective prices with discount attribution, and uses those effective prices throughout the entire UI (review, search, reports, charts).
