---
phase: 10-estimating-procurement
plan: 04
subsystem: estimate-builder
tags: [react, supabase, react-query, rpc, price-intelligence, estimating]
dependency-graph:
  requires: [10-01, 10-03]
  provides: [price-stats-hooks, estimate-builder-component, auto-estimate-all, project-status-transition]
  affects: [10-05, 10-06, 10-07, 10-08]
tech-stack:
  added: []
  patterns: [expandable-detail-row, bulk-sequential-mutation, strategy-pattern-pricing, status-machine-transition]
key-files:
  created:
    - material-price-intel/src/hooks/useEstimateBuilder.ts
    - material-price-intel/src/components/projects/EstimateBuilder.tsx
  modified:
    - material-price-intel/src/components/projects/SelectionEditor.tsx
    - material-price-intel/src/pages/ProjectDetailPage.tsx
decisions:
  - id: 10-04-01
    decision: "useAutoEstimate mutation handles both RPC fetch and selection update in one mutation"
    context: "More efficient than separate useMaterialPriceStats + useUpdateSelection calls; single mutateAsync call for auto-estimate-all"
  - id: 10-04-02
    decision: "Expandable detail row pattern for EstimateBuilder in table"
    context: "colSpan=9 row appears below selection row when expanded; one selection expanded at a time"
  - id: 10-04-03
    decision: "Sequential (not parallel) auto-estimate-all with progress counter"
    context: "Prevents overwhelming Supabase with parallel RPC calls; shows clear progress 'Estimating 3 of 12...'"
  - id: 10-04-04
    decision: "Project status auto-transitions from planning to estimating on first estimate"
    context: "useUpdateProject called after successful bulk estimate when project is still in planning status"
metrics:
  duration: "~4 minutes"
  completed: "2026-02-11"
---

# Phase 10 Plan 04: Estimate Builder & Price Intelligence Summary

**One-liner:** Price intelligence system with 3 React Query hooks (single/bulk/auto-estimate), expandable EstimateBuilder per selection showing avg/min/max/latest from historical quotes, and project-level Auto-Estimate All button.

## What Was Built

### useEstimateBuilder.ts - Price Stats and Auto-Estimate Hooks (3 hooks)

- **useMaterialPriceStats(materialId)** - Calls `get_material_price_stats` RPC, returns MaterialPriceStats or null. queryKey: `["material_price_stats", materialId]`, 5-min staleTime.
- **useBulkPriceStats(materialIds)** - Fetches price stats for multiple materials in parallel via Promise.all. Returns `Record<string, MaterialPriceStats>`. queryKey includes sorted materialIds for stable caching.
- **useAutoEstimate()** - Mutation that: (1) fetches price stats via RPC, (2) selects price based on strategy (average/latest/lowest), (3) calculates estimated_total = quantity * unit_price, (4) updates project_selection row. Invalidates both room-level and project-level caches.

### EstimateBuilder.tsx (300 lines)

- **Price Intelligence Card** - Shows when selection has a material_id:
  - Average price, lowest (green), highest (red) in 3-column grid
  - Latest price with supplier name and date
  - "Based on N quotes" attribution line
  - Shows "No historical pricing data available" when no stats exist

- **Strategy Buttons** - Three pricing strategy buttons:
  - "Use Average ($X.XX)" / "Use Latest ($X.XX)" / "Use Lowest ($X.XX)"
  - Each disabled when that price is null
  - 2-second success flash: button text changes to "Applied" with green check
  - Loading spinner during mutation

- **Current Estimate Display** - Shows when estimated_unit_price exists:
  - "Estimated: $X.XX/unit x [qty] [unit] = $X,XXX total"
  - Allowance variance: "+$500 over" (red) or "$200 under" (green) or "On budget"

- **EstimateToggle** - Exported helper component (unused in final integration; inline button used instead)

### SelectionEditor.tsx (modified)

- Added `expandedSelectionId` state tracking which selection has EstimateBuilder open
- Each selection row with material_id shows a blue "Estimate" toggle button next to its name
- Clicking toggle expands/collapses the EstimateBuilder in a full-width row below (colSpan=9)
- Only one selection can be expanded at a time (clicking another collapses the first)
- Imported EstimateBuilder component

### ProjectDetailPage.tsx (modified)

- Added "Auto-Estimate All" button in project header:
  - Shows count of selections needing estimates: "Auto-Estimate All (5)"
  - Disabled when no selections need estimates or estimation in progress
  - Progress indicator: "Estimating 3 of 12..."
  - Success message fades after 4 seconds: "12 items estimated" or "8 items estimated, 4 had no pricing data"
- Project status auto-transitions from 'planning' to 'estimating' after first successful bulk estimate
- Imported useAutoEstimate and useUpdateProject hooks

## Deviations from Plan

### Minor Pattern Difference

**1. [Note] useAutoEstimate used instead of useUpdateSelection in EstimateBuilder**

- **Plan specified:** EstimateBuilder should use useUpdateSelection to update estimated_unit_price
- **Actual:** useAutoEstimate mutation handles the full RPC-fetch-then-update flow internally via direct Supabase update
- **Reason:** More efficient -- single mutation encapsulates the entire estimate workflow. Using useUpdateSelection would require two separate async operations per estimate.
- **Impact:** None -- same cache invalidation, same database update, same user experience.

## Verification Results

1. `npx tsc --noEmit` passes with zero errors
2. Selection with material_id shows blue "Estimate" toggle button
3. Expanding shows price intelligence panel with avg/min/max/latest from get_material_price_stats RPC
4. Strategy buttons call useAutoEstimate which populates estimated_unit_price and estimated_total
5. "Auto-Estimate All" processes selections sequentially with progress counter
6. Summary cards update with new estimated totals (via cache invalidation)
7. All 3 hooks exported from useEstimateBuilder.ts: useMaterialPriceStats, useBulkPriceStats, useAutoEstimate
8. EstimateBuilder.tsx: 300 lines (minimum 80 required)
9. RPC pattern confirmed: `supabase.rpc("get_material_price_stats", { p_material_id: ... })` matches function signature

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 0753bdc | feat(10-04): create useEstimateBuilder hooks for price intelligence |
| 2 | f30c8af | feat(10-04): create EstimateBuilder component and integrate into ProjectDetailPage |

## Next Phase Readiness

Plan 10-05 can build on:
- EstimateBuilder pattern for showing price data inline on selections
- useAutoEstimate hook for programmatic estimate population
- useBulkPriceStats for project-wide price data loading
- Project status transition pattern (planning -> estimating) established
- No blockers identified
