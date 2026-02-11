---
phase: 10-estimating-procurement
plan: 03
subsystem: room-selection-ui
tags: [react, supabase, react-query, tailwind, rooms, selections, estimating]
dependency-graph:
  requires: [10-01, 10-02]
  provides: [room-hooks, selection-hooks, room-manager-component, selection-editor-component, project-detail-rooms-integration]
  affects: [10-04, 10-05, 10-06, 10-07, 10-08]
tech-stack:
  added: []
  patterns: [two-panel-layout, inline-table-editing, preset-quick-add, upgrade-status-auto-calc]
key-files:
  created:
    - material-price-intel/src/hooks/useProjectRooms.ts
    - material-price-intel/src/hooks/useProjectSelections.ts
    - material-price-intel/src/components/projects/RoomManager.tsx
    - material-price-intel/src/components/projects/SelectionEditor.tsx
  modified:
    - material-price-intel/src/pages/ProjectDetailPage.tsx
decisions:
  - id: 10-03-01
    decision: "RoomManager accepts selectedRoomId + onSelectRoom props for controlled selection"
    context: "Parent page owns selected room state so it can coordinate between room list and selection editor"
  - id: 10-03-02
    decision: "SelectionWithJoins type derived from Awaited<ReturnType<>> pattern"
    context: "Avoids manually re-declaring joined types; stays in sync with Supabase select query"
  - id: 10-03-03
    decision: "Summary cards adapt between budget/sqft/client view and financial totals view"
    context: "When no selections exist, cards show project metadata; when selections exist, cards show aggregated allowance/estimated/actual/variance"
  - id: 10-03-04
    decision: "Upgrade status computed client-side on save (1% tolerance threshold)"
    context: "actual > allowance * 1.01 = upgrade, actual < allowance * 0.99 = downgrade, else standard"
metrics:
  duration: "~5 minutes"
  completed: "2026-02-11"
---

# Phase 10 Plan 03: Room Management & Selection Editing Summary

**One-liner:** Two-panel room/selection UI with 9 React Query hooks, inline table editing, Florida home presets, and live financial aggregation on the project detail page.

## What Was Built

### useProjectRooms.ts - Room CRUD Hooks (4 hooks)

- **useProjectRooms(projectId)** - Fetches rooms ordered by sort_order then name, 5-min staleTime
- **useCreateRoom()** - Creates room with project_id, name, room_type; invalidates room cache
- **useUpdateRoom()** - Partial updates to name, type, sort_order, notes
- **useDeleteRoom()** - Deletes room (CASCADE removes selections); invalidates cache

### useProjectSelections.ts - Selection CRUD Hooks (5 hooks + type)

- **useRoomSelections(roomId)** - Fetches selections for a room with material/category/supplier joins
- **useProjectSelections(projectId)** - Fetches ALL selections across all rooms (2-query: rooms first, then selections via .in())
- **useCreateSelection()** - Creates selection with all fields; invalidates both room-level and project-level caches
- **useUpdateSelection()** - Partial updates; strips variance_amount (generated column); auto-computes upgrade_status
- **useDeleteSelection()** - Deletes selection; invalidates both cache levels
- **SelectionWithJoins** - Exported type for joined query results

### RoomManager.tsx (329 lines)

- Clickable room list with type badges (interior/exterior/utility/common) and delete buttons
- Inline add room form with name input and room_type select dropdown
- "Quick Add: Standard Rooms" collapsible preset panel with 13 Florida home presets:
  Kitchen, Master Bath, Master Bedroom, Guest Bath 1/2, Guest Bedroom 1/2, Great Room, Dining Room, Laundry, Garage, Exterior, Pool/Lanai
- Checkboxes with "exists" labels for rooms already added
- Selected room highlighted with primary border/background

### SelectionEditor.tsx (586 lines)

- Table view with 9 columns: Selection, Category, Material, Allowance, Qty, Est. Total, Actual, Variance, Status
- Inline editing: click pencil icon to enter edit mode with full field editing (inputs/selects for all fields)
- Add selection form with: name (required), category dropdown, material dropdown (filtered by category), allowance, quantity, unit select (sqft/lf/ea/pc/bf)
- Variance color coding: red for over budget, green for under budget, gray for pending
- Upgrade status auto-calculation on save: upgrade (amber) / downgrade (green) / standard (gray) / pending (blue)
- Edit/delete buttons appear on row hover (opacity transition)

### ProjectDetailPage.tsx (rewritten, 400 lines)

- Two-panel layout below details: rooms (w-1/3) and selections (w-2/3)
- Summary cards now show real aggregated data from useProjectSelections:
  - Card 1: Total Allowance (or Target Budget if no selections)
  - Card 2: Total Estimated (or Square Footage if no selections)
  - Card 3: Total Actual (or Client name if no actuals)
  - Card 4: Variance with red/green coloring (or Selection count if no actuals)
- Auto-selects first room on page load
- Project details card conditionally rendered only if details exist

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. `npx tsc --noEmit` passes with zero errors
2. ProjectDetailPage renders RoomManager on left and SelectionEditor on right
3. Room presets include 13 standard Florida home rooms with correct types
4. Add room form has name input and room_type select
5. Selection table has all 9 columns with inline editing support
6. Delete room/selection both supported with proper cache invalidation
7. Summary cards compute live totals from selection data
8. Variance shows red text for over budget, green for under budget
9. All must_have key_links patterns confirmed (RoomManager/SelectionEditor in page, from('project_rooms'), from('project_selections'))
10. File line counts exceed minimums: RoomManager 329 >= 60, SelectionEditor 586 >= 100

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 3b3542e | feat(10-03): create room and selection React Query hooks |
| 2 | 3c87e96 | feat(10-03): create RoomManager, SelectionEditor, and integrate into ProjectDetailPage |

## Next Phase Readiness

Plan 10-04 (Procurement Tracking) can build on:
- Room and selection CRUD hooks for linking procurement items to selections
- SelectionEditor component can be extended with procurement status column
- useProjectSelections provides project-wide data for procurement dashboards
- All financial aggregation patterns established for reuse
- No blockers identified
