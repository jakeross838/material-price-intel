---
phase: 10-estimating-procurement
plan: 01
subsystem: database-schema
tags: [postgresql, rls, migration, typescript, estimating, procurement]
dependency-graph:
  requires: [phase-1-schema, phase-5-materials, phase-9-smart-accuracy]
  provides: [estimating-tables, procurement-tables, project-summary-rpc, material-price-stats-rpc]
  affects: [10-02, 10-03, 10-04, 10-05, 10-06, 10-07, 10-08]
tech-stack:
  added: []
  patterns: [generated-columns, multi-level-rls-join-chains, security-definer-rpcs]
key-files:
  created:
    - material-price-intel/supabase/migrations/012_estimating_schema.sql
  modified:
    - material-price-intel/src/lib/types.ts
decisions:
  - id: 10-01-01
    decision: "GENERATED ALWAYS AS STORED for variance_amount column"
    context: "Auto-computes (actual_total or estimated_total) minus allowance_amount"
  - id: 10-01-02
    decision: "Multi-level RLS join chains for nested tables"
    context: "project_rooms via projects, project_selections via rooms->projects, procurement_items via selections->rooms->projects"
  - id: 10-01-03
    decision: "SECURITY DEFINER on RPC functions with manual org ownership checks"
    context: "get_project_summary and get_material_price_stats verify caller org before returning data"
  - id: 10-01-04
    decision: "UNIQUE(selection_id) on procurement_items enforces 1:1 with selections"
    context: "Each selection has at most one procurement record tracking its buyout lifecycle"
metrics:
  duration: "~3 minutes"
  completed: "2026-02-11"
---

# Phase 10 Plan 01: Estimating & Procurement Schema Summary

**One-liner:** 4 new tables (projects, rooms, selections, procurement) with generated variance column, multi-level RLS join chains, and 2 aggregation RPCs applied to remote DB.

## What Was Built

### Migration 012: Estimating Schema

Created `012_estimating_schema.sql` with the complete data model for project estimating and material procurement tracking:

**Tables:**
- **projects** - Custom home projects with org scoping, client info, target budgets, and 5 status states
- **project_rooms** - Rooms/areas within a project (interior, exterior, utility, common) with cascading deletes
- **project_selections** - Material selections per room with allowance tracking, estimated vs actual pricing, and a GENERATED variance column
- **procurement_items** - Buyout lifecycle tracking with 7-stage status workflow (not_quoted through installed)

**RLS Policies (16 total):**
- projects: Direct org_id match (same pattern as suppliers)
- project_rooms: Join to projects for org verification
- project_selections: 2-level join (rooms -> projects) for org verification
- procurement_items: 3-level join (selections -> rooms -> projects) for org verification
- All tables: SELECT for any org member, INSERT/UPDATE for admin+editor, DELETE for admin only

**Indexes (9 total):**
- Organization and status lookups on projects
- Foreign key indexes on all child tables for join performance
- Status index on procurement_items for workflow queries

**RPC Functions:**
- `get_project_summary(p_project_id)` - Returns aggregated totals (allowances, estimates, actuals, variances, selection count, items bought out)
- `get_material_price_stats(p_material_id)` - Returns pricing statistics from approved quotes (avg/min/max/count/latest price and supplier)

### TypeScript Types

Added to `types.ts`:
- 4 row types: Project, ProjectRoom, ProjectSelection, ProcurementItem
- 4 status union types: ProjectStatus, RoomType, UpgradeStatus, ProcurementStatus
- 2 RPC return types: ProjectSummary, MaterialPriceStats
- Database.public.Tables updated with all 4 tables (Row/Insert/Update/Relationships)
- Database.public.Functions updated with both new RPCs
- variance_amount excluded from Insert and Update types (generated column)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. Migration file contains all 4 tables, 16 RLS policies, 9 indexes, 3 triggers, 2 RPCs
2. Migration applied successfully to remote Supabase database
3. `npx tsc --noEmit` passes with zero errors
4. All existing types and code remain unbroken
5. Generated column (variance_amount) correctly excluded from Insert type

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | d7953c1 | feat(10-01): create estimating and procurement database schema |
| 2 | 0a1572d | feat(10-01): add TypeScript types for estimating and procurement tables |

## Next Phase Readiness

All subsequent Phase 10 plans can now build on:
- 4 database tables with proper RLS enforcement
- Typed Supabase client access for all new tables
- RPC functions for project summaries and material price statistics
- No blockers identified
