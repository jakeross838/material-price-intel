---
phase: 10
plan: 06
subsystem: budget-dashboard
tags: [recharts, variance, budget, dashboard, aggregation]
depends_on:
  requires: ["10-01", "10-03", "10-05"]
  provides: ["budget-variance-dashboard", "variance-chart", "budget-health-indicator"]
  affects: ["10-07", "10-08"]
tech-stack:
  added: []
  patterns: ["client-side aggregation", "expandable table rows", "conditional cell coloring"]
key-files:
  created:
    - material-price-intel/src/components/projects/VarianceChart.tsx
    - material-price-intel/src/components/projects/BudgetDashboard.tsx
  modified:
    - material-price-intel/src/pages/ProjectDetailPage.tsx
decisions:
  - id: "client-side-aggregation-budget"
    summary: "Room and category aggregation computed client-side from selections array"
    context: "Simpler than server-side RPCs; data already loaded by useProjectSelections"
  - id: "variance-four-bar-series"
    summary: "Four bar series (allowance, estimated, actual, variance) in grouped chart"
    context: "Variance bar gives quick visual indicator; actual bars hidden when zero"
  - id: "conditional-cell-fill-for-actuals"
    summary: "Actual bars use Cell component with conditional fill (transparent when no actual)"
    context: "Recharts Bar does not support per-bar conditional rendering natively"
metrics:
  duration: "3m 26s"
  completed: "2026-02-11"
---

# Phase 10 Plan 06: Budget vs. Actual Variance Dashboard Summary

**Budget variance dashboard with room/category drill-down using Recharts grouped bar chart, expandable table, and budget health indicator**

## What Was Built

### VarianceChart (231 lines)
Recharts-based grouped bar chart for visualizing budget variance:
- Four bar series: Allowance (gray), Estimated (blue), Actual (green/red), Variance (green/red)
- Conditional cell coloring via Recharts `Cell` component -- actual bars transparent when no actual cost
- Automatic vertical layout switch when >12 groups to maintain readability
- Abbreviated dollar axis formatting ($1K, $5K, $10K)
- Custom tooltip with full USD formatting
- X-axis label rotation when >8 groups to prevent overlap
- ReferenceLine at zero for variance orientation

### BudgetDashboard (717 lines)
Multi-level variance analysis component:
- **Summary cards (4)**: Total Budget, Total Allowances, Current Estimate, Projected Variance
- **Budget health bar**: Progress indicator with green (<90%), amber (90-100%), red (>100%) thresholds
- **Chart with toggle**: Room vs. Category view switcher, renders VarianceChart with aggregated data
- **Detailed variance table**: Sortable by name, variance amount, or variance %. Expandable rows drill down to individual selections within each room/category. Footer row shows project totals
- **Unbudgeted items warning**: Amber card listing selections without allowance amounts (capped at 10 displayed)
- Client-side aggregation from useProjectSelections and useProjectRooms data
- Handles edge cases: no selections, no actuals, no target budget, no allowances

### ProjectDetailPage Integration
- Budget tab placeholder replaced with `<BudgetDashboard>` component
- Passes `projectId` and `project.target_budget` as props
- Added import for BudgetDashboard

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Client-side room/category aggregation | Data already loaded by useProjectSelections; avoids extra RPCs for v1 scale |
| Four bar series in chart | Variance bar provides instant visual indicator alongside the three cost comparisons |
| Recharts Cell for conditional actual bars | Only way to do per-bar conditional fill in Recharts BarChart |
| Expandable table rows (not separate detail page) | Keeps all variance info on one screen; matches ProcurementTracker UX pattern |
| Sort default: variance % descending | Shows biggest overages first, which is the most actionable view |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- [x] `npx tsc --noEmit` passes
- [x] BudgetDashboard.tsx exceeds 120 line minimum (717 lines)
- [x] VarianceChart.tsx exceeds 50 line minimum (231 lines)
- [x] key_links patterns verified: useProjectSelections in BudgetDashboard, BarChart/Bar in VarianceChart, BudgetDashboard in ProjectDetailPage
- [x] Budget tab renders BudgetDashboard instead of placeholder
- [x] Green/red color coding for under/over budget
- [x] Chart toggle between room and category views
- [x] Sortable and expandable variance table
- [x] Budget health progress bar
- [x] Unbudgeted items warning

## Commits

| Hash | Message |
|------|---------|
| 57002ee | feat(10-06): create VarianceChart component |
| a6073c3 | feat(10-06): create BudgetDashboard and integrate into Budget tab |

## Next Phase Readiness

Plan 06 completes the budget analysis capability. The Budget tab is now fully functional with:
- Project-level financial summary
- Room and category drill-down
- Visual chart and detailed table

Plans 07-08 (remaining in phase 10) can build on this foundation for reporting exports or additional analytics.
