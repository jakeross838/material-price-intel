---
phase: 10-estimating-procurement
plan: 05
subsystem: procurement-buyout
tags: [react, supabase, react-query, procurement, buyout, quote-linking, tabs]
dependency-graph:
  requires: [10-01, 10-03, 10-04]
  provides: [procurement-hooks, procurement-tracker, quote-link-modal, tab-navigation]
  affects: [10-06, 10-07, 10-08]
tech-stack:
  added: []
  patterns: [modal-overlay-pattern, stacked-progress-bar, status-dropdown-select, tab-navigation-local-state, multi-table-mutation]
key-files:
  created:
    - material-price-intel/src/hooks/useProcurement.ts
    - material-price-intel/src/components/projects/ProcurementTracker.tsx
    - material-price-intel/src/components/projects/QuoteLinkModal.tsx
  modified:
    - material-price-intel/src/pages/ProjectDetailPage.tsx
decisions:
  - id: 10-05-01
    decision: "Flat table with status filter dropdown instead of grouped/collapsible sections"
    context: "Simpler and more scannable for 200+ items; status dropdown filters provide the grouping benefit without layout complexity"
  - id: 10-05-02
    decision: "Native select element for status change dropdown in procurement table"
    context: "Consistent with existing pattern (line_type dropdown in review); lightweight, no extra dependency"
  - id: 10-05-03
    decision: "Tab navigation uses local state not routing"
    context: "Simple button-based tabs avoid URL complexity; default tab based on project status (in_progress defaults to Procurement)"
  - id: 10-05-04
    decision: "Untracked selections shown inline in procurement table with Start Tracking button"
    context: "Single unified view of all selections rather than separate untracked list; creates procurement record on demand"
  - id: 10-05-05
    decision: "supplierId passed through AwardQuoteInput rather than fetched inside mutation"
    context: "QuoteLinkModal already has supplier data from search results; avoids extra fetch inside mutation"
metrics:
  duration: "~6 minutes"
  completed: "2026-02-11"
---

# Phase 10 Plan 05: Procurement Tracking & Buyout Workflow Summary

**One-liner:** Full procurement lifecycle from not_quoted through installed with 6 React Query hooks, quote-linking modal searching by material, stacked progress bar, and 3-tab ProjectDetailPage navigation.

## What Was Built

### useProcurement.ts - Procurement React Query Hooks (6 hooks + 2 types)

- **useProcurementItems(projectId)** - Fetches all procurement items for a project via rooms->selections->procurement_items chain. Joins project_selections, quotes (with suppliers), and line_items. Sorts by status order (not_quoted first) then by selection name.
- **useSelectionProcurement(selectionId)** - Single procurement item fetch for a specific selection. Uses `.maybeSingle()` since procurement record may not exist yet.
- **useCreateProcurement()** - Creates a procurement record with `not_quoted` status. Invalidates project-level and selection-level caches.
- **useUpdateProcurement()** - Updates procurement status and fields. Takes `{ id, projectId, selectionId, updates }`.
- **useAwardQuote()** - The key buyout action. Updates procurement_items (quote_id, line_item_id, committed_price, status=awarded) AND project_selections (actual_unit_price, actual_total, supplier_id, upgrade_status). Auto-calculates upgrade_status with 1% tolerance threshold. Invalidates procurement + selection caches across both room-level and project-level query keys.
- **useSearchQuotesForSelection(materialId, categoryId)** - Searches line_items by material_id with line_type='material', joining quotes and suppliers. Returns up to 20 results ordered by creation date. Used by QuoteLinkModal to find matching quotes.

Exported types: `ProcurementItemWithJoins`, `QuoteSearchResult` (internal).

### QuoteLinkModal.tsx (223 lines)

- **Modal overlay** with fixed backdrop (bg-black/50 z-50), centered content panel (max-w-2xl), Escape key to close, click-outside to close.
- **Header** shows "Link Quote" with selection name and material canonical name.
- **Results table** with columns: Supplier, Quote #, Date, Unit Price, Description, Award button.
- **Award action** calculates committed_price as `effectiveUnitPrice * selection.quantity`, calls useAwardQuote mutation, then fires `onAwarded()` callback and closes.
- **Empty state** when no matching quotes: "No matching quotes found. Upload a quote with this material first, then link it here."
- **Footer** shows quantity context when selection has a quantity.

### ProcurementTracker.tsx (516 lines)

- **Progress summary bar** at top:
  - "X of Y items bought out" with percentage
  - Stacked horizontal bar with colored segments per status (gray/blue/amber/purple/indigo/teal/green)
  - Color legend showing counts per status

- **Status filter** dropdown to show only specific statuses.

- **Procurement table** with columns: Selection Name | Material | Status | Supplier | Price | Actions
  - Status shown as colored dropdown `<select>` that user can change directly
  - Supplier name from linked quote
  - Price shows committed_price (with "committed" label) or estimated_total as fallback
  - **Action buttons per status:**
    - Pre-award (not_quoted/rfq_sent/quoted): "Link Quote" button opens QuoteLinkModal
    - When quote linked: "View" link navigates to /quotes/:id
    - Awarded: "Ordered" advance button
    - Ordered: "Delivered" advance button
    - Delivered: "Installed" advance button
  - **Untracked selections** shown at bottom with "Not Tracked" badge and "Start Tracking" button

### ProjectDetailPage.tsx (modified)

- **3-tab navigation** below summary cards:
  - "Rooms & Selections" (LayoutList icon) - existing RoomManager + SelectionEditor
  - "Procurement" (ShoppingCart icon) - ProcurementTracker component
  - "Budget" (BarChart3 icon) - placeholder for Plan 06
- **Active tab styling:** border-b-2 primary color for active, muted for inactive with hover states
- **Default tab logic:** "Rooms & Selections" normally, "Procurement" when project status is `in_progress`
- Tab state uses `tabInitialized` flag to set default only once on first load

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `npx tsc --noEmit` passes with zero errors
2. ProcurementTracker shows all selections (tracked + untracked) with buyout status
3. "Link Quote" button opens QuoteLinkModal with matching quotes from line_items table
4. Awarding a quote updates both procurement_items (quote_id, line_item_id, committed_price, status) and project_selections (actual_unit_price, actual_total, supplier_id, upgrade_status)
5. Status can be changed via dropdown or advanced via shortcut buttons (Ordered/Delivered/Installed)
6. Tab navigation switches between Rooms & Selections, Procurement, and Budget views
7. Progress bar shows accurate buyout completion percentage with stacked colored segments
8. QuoteLinkModal.tsx: 223 lines (minimum 80)
9. ProcurementTracker.tsx: 516 lines (minimum 100)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 1556d36 | feat(10-05): create procurement React Query hooks |
| 2 | 0c4edb5 | feat(10-05): create ProcurementTracker, QuoteLinkModal, and add tab navigation |

## Next Phase Readiness

Plan 10-06 can build on:
- Procurement hooks for budget calculations (committed_price represents actual spend)
- Tab navigation pattern for adding Budget tab content
- useProjectSelections already provides all data needed for budget aggregation
- ProcurementTracker progress bar pattern for budget visualization
- No blockers identified
