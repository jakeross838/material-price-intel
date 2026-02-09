---
phase: 05-material-normalization
plan: 03
subsystem: ui
tags: [react-query, hooks, material-linkage, quote-detail, cache-invalidation, supabase-relationships]
dependency-graph:
  requires:
    - phase: 05-01
      provides: material_aliases table, merge_materials RPC, find_similar_material RPC, FK relationships
    - phase: 05-02
      provides: normalize-materials Edge Function (creates materials and sets line_items.material_id)
    - phase: 04-03
      provides: QuoteDetailPage with approved/review views, useApproveQuote hook
  provides:
    - useMaterials hook (all active materials with aliases)
    - useMaterialAliases hook (aliases for one material)
    - useMergeMaterials mutation (merge two materials)
    - useLineItemMaterials hook (line items with joined material data)
    - Material linkage badges on approved quote line items
    - Delayed cache invalidation for async normalization results
  affects: [05-04, 06-01, 07-01]
tech-stack:
  added: []
  patterns: [delayed-invalidation-for-async-processing, supabase-fk-relationships-in-types, material-badge-display]
key-files:
  created:
    - material-price-intel/src/hooks/useMaterials.ts
  modified:
    - material-price-intel/src/hooks/useQuoteReview.ts
    - material-price-intel/src/pages/QuoteDetailPage.tsx
    - material-price-intel/src/lib/types.ts
key-decisions:
  - "Delayed invalidation (10s setTimeout) for async normalization results"
  - "FK Relationships added to Database type for typed Supabase relational queries"
  - "Material badge shown only in approved/read-only view, not review mode"
patterns-established:
  - "Supabase FK Relationships in Database type enable typed relational queries (e.g., line_items -> materials join)"
  - "Delayed cache invalidation pattern for async background processing results"
metrics:
  duration: ~4min
  completed: 2026-02-09
---

# Phase 5 Plan 3: Material Hooks + Quote Linkage UI Summary

**React Query hooks for materials/aliases/merge plus canonical material name badges on approved quote line items with delayed cache invalidation for async normalization results**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-09T18:22:32Z
- **Completed:** 2026-02-09T18:26:50Z
- **Tasks:** 2/2
- **Files created:** 1
- **Files modified:** 3

## Accomplishments

### 1. Material React Query Hooks (Task 1)

Created `material-price-intel/src/hooks/useMaterials.ts` with four hooks:

- **useMaterials():** Fetches all active materials with their aliases via `materials(*, material_aliases(*))` join. 5-minute staleTime. Used by future materials management page.
- **useMaterialAliases(materialId):** Fetches aliases for a specific material, ordered by creation date descending. Disabled when materialId is null.
- **useMergeMaterials():** Mutation wrapper for `merge_materials` RPC. Invalidates both `["materials"]` and `["material_aliases"]` query keys on success.
- **useLineItemMaterials(quoteId):** Fetches line items for a quote with joined material data (`id, canonical_name, species, dimensions`). Used by QuoteDetailPage to display material badges.

### 2. Material Linkage Display + Approve Invalidation (Task 2)

**QuoteDetailPage changes:**
- Imported `useLineItemMaterials` hook and called it with the current quote ID
- In the approved/read-only line items table, added material name lookup: finds the matching `lineItemMaterials` entry for each line item
- Displays a blue badge (`bg-blue-50 text-blue-700`) with the canonical material name when `material_id` is set
- Badge appears inline after `raw_description` text

**useApproveQuote changes:**
- Added delayed cache invalidation (10-second `setTimeout`) after quote approval
- Invalidates `["materials"]` and `["line_items_with_materials"]` query keys
- Handles the async nature of normalization: Edge Function takes ~5-15 seconds after approval

**types.ts changes:**
- Added `Relationships` array to `line_items` table definition with FK to `materials`
- Added `Relationships` array to `material_aliases` table definition with FK to `materials`
- Enables typed Supabase relational queries (PostgREST join syntax)

## Task Commits

| Hash | Message |
|------|---------|
| 509145d | feat(05-03): create useMaterials React Query hooks |
| bcefdc9 | feat(05-03): show material linkage badges on approved quote line items |

## Files Created/Modified

- **material-price-intel/src/hooks/useMaterials.ts** (102 lines) -- Four React Query hooks for materials, aliases, merge, and line item material data
- **material-price-intel/src/hooks/useQuoteReview.ts** (modified) -- Added delayed material cache invalidation in useApproveQuote onSuccess
- **material-price-intel/src/pages/QuoteDetailPage.tsx** (modified) -- Added useLineItemMaterials hook call and material badge display in approved view
- **material-price-intel/src/lib/types.ts** (modified) -- Added FK Relationships for line_items->materials and material_aliases->materials

## Decisions Made

| Decision | Context |
|----------|---------|
| Delayed invalidation (10s setTimeout) for async normalization | Edge Function takes ~5-15s after approval; immediate invalidation would show un-normalized items |
| FK Relationships added to Database type | Supabase PostgREST typed client requires Relationships definitions for relational queries; without them, TypeScript reports "could not find the relation" |
| Material badge in approved view only | Review mode uses ReviewForm/LineItemsEditor components; material linkage is only relevant after normalization (post-approval) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added FK Relationships to Database type for typed Supabase joins**

- **Found during:** Task 2 (build verification)
- **Issue:** `npm run build` (tsc -b) failed with `TS2339: Property 'canonical_name' does not exist on type 'SelectQueryError<"could not find the relation between line_items and materials">'`. The Supabase PostgREST typed client requires explicit Relationships definitions in the Database type to resolve FK joins in select queries.
- **Fix:** Added Relationships arrays to `line_items` (FK to materials) and `material_aliases` (FK to materials) in `types.ts`
- **Files modified:** material-price-intel/src/lib/types.ts
- **Verification:** `tsc -b` and `npm run build` both pass cleanly
- **Committed in:** bcefdc9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for TypeScript compilation. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 05-04 (Material Management UI) can now:
- Use `useMaterials()` to display all canonical materials with aliases
- Use `useMaterialAliases(materialId)` for detailed alias views
- Use `useMergeMaterials()` for the merge duplicates workflow
- FK Relationships in types.ts enable any future Supabase relational queries between line_items/materials/material_aliases

Phase 06 (Price Search) can use:
- `useLineItemMaterials()` pattern for price comparison views
- Material data hooks for filtering/search interfaces

---
*Phase: 05-material-normalization*
*Completed: 2026-02-09*
