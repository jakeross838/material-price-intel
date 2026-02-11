---
phase: 10-estimating-procurement
plan: 02
subsystem: project-crud-ui
tags: [react, supabase, react-query, tailwind, projects, crud]
dependency-graph:
  requires: [10-01]
  provides: [project-hooks, project-list-page, project-create-page, project-detail-page, project-navigation]
  affects: [10-03, 10-04, 10-05, 10-06, 10-07, 10-08]
tech-stack:
  added: []
  patterns: [org-id-from-user-profiles, controlled-form-state, status-badge-config-map]
key-files:
  created:
    - material-price-intel/src/hooks/useProjects.ts
    - material-price-intel/src/pages/ProjectsListPage.tsx
    - material-price-intel/src/pages/ProjectCreatePage.tsx
    - material-price-intel/src/pages/ProjectDetailPage.tsx
  modified:
    - material-price-intel/src/App.tsx
    - material-price-intel/src/components/layout/AppLayout.tsx
decisions:
  - id: 10-02-01
    decision: "Organization ID fetched from user_profiles table in useCreateProject"
    context: "Auth user ID mapped to org via user_profiles.organization_id lookup before project insert"
  - id: 10-02-02
    decision: "useState per field for project create form (no form library)"
    context: "Simple controlled inputs matching existing patterns; no react-hook-form dependency needed"
  - id: 10-02-03
    decision: "Empty strings converted to null before Supabase insert"
    context: "Database expects NULL for optional fields, not empty strings"
  - id: 10-02-04
    decision: "Edit button and Add Room button rendered as disabled placeholders"
    context: "Plan 03 will implement room management; edit functionality deferred to future plan"
metrics:
  duration: "~4 minutes"
  completed: "2026-02-11"
---

# Phase 10 Plan 02: Project CRUD UI Summary

**One-liner:** 5 React Query hooks (list/detail/create/update/delete) with 3 pages (list grid, create form, detail view) and sidebar navigation for project management.

## What Was Built

### useProjects.ts - React Query Hooks

5 hooks following the useMaterials.ts pattern:
- **useProjects()** - Fetches all projects ordered by updated_at desc, 5-min staleTime
- **useProject(id)** - Single project by ID, enabled only when ID provided
- **useCreateProject()** - Creates project with org_id from user_profiles lookup, invalidates list cache
- **useUpdateProject()** - Partial updates, invalidates both list and detail caches
- **useDeleteProject()** - Deletes project (CASCADE handles children), invalidates list cache

### ProjectsListPage.tsx (158 lines)

- Page header with project count badge and "New Project" button
- Empty state with FolderKanban icon and CTA
- Responsive card grid (1 col mobile, 2 cols lg)
- Each card: project name (linked), client name, address, status badge, budget (USD), sqft
- Status badges: planning(blue), estimating(amber), in_progress(green), completed(slate), on_hold(red)

### ProjectCreatePage.tsx (247 lines)

- Back link to /projects
- Organized form sections: project name (required), client info (3 fields), address (4 fields), details (sqft, budget, dates), notes textarea
- City defaults to "Bradenton", state defaults to "FL"
- Number fields parsed via parseFloat, empty strings converted to null
- Loading spinner during submission, error message display
- On success: navigates to /projects/:id

### ProjectDetailPage.tsx (287 lines)

- Back link, project name with status badge, disabled Edit button placeholder
- 4 summary cards: Target Budget (green), Square Footage (blue), Client (purple), Status (amber)
- Project details card with address, timeline, client contact, notes
- Rooms & Areas section with disabled "Add Room" button and placeholder text
- Loading and not-found states

### Routing & Navigation

- App.tsx: 3 new routes (/projects, /projects/new, /projects/:id) inside ProtectedRoute + AppLayout
- AppLayout.tsx: "Projects" nav item with FolderKanban icon after Reports

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. Sidebar shows "Projects" navigation link with FolderKanban icon
2. /projects route renders list page with card grid
3. /projects/new route renders creation form with all fields
4. /projects/:id shows project detail with summary cards and rooms placeholder
5. `npx tsc --noEmit` passes with zero errors
6. All 5 hooks exported from useProjects.ts
7. React Query uses 5-min staleTime convention
8. Status badges render with color-coded backgrounds
9. Budget formatted as USD via Intl.NumberFormat
10. Square footage formatted with commas and "sqft" suffix

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | e70f038 | feat(10-02): create useProjects hooks and wire routing/navigation |
| 2 | 85e8dc9 | feat(10-02): create ProjectsListPage, ProjectCreatePage, and ProjectDetailPage |

## Next Phase Readiness

Plan 10-03 (Room Management) can build on:
- useProject(id) hook for fetching project data on detail page
- ProjectDetailPage.tsx rooms section ready for real room list and Add Room functionality
- useUpdateProject() hook available for project status changes
- All routing in place for nested project views
- No blockers identified
