---
phase: 01-foundation
plan: 02
subsystem: database
tags: [postgresql, supabase, migrations, rls, pg_trgm, typescript]

dependency-graph:
  requires: []
  provides: [database-schema, rls-policies, typescript-types, seed-data, db-functions]
  affects: [01-03, 02-upload-pipeline, 03-ai-extraction, 05-normalization, 06-search]

tech-stack:
  added: [pg_trgm]
  patterns: [organization-based-rls, updated_at-triggers, trigram-fuzzy-search, database-backed-job-queue]

file-tracking:
  key-files:
    created:
      - material-price-intel/supabase/config.toml
      - material-price-intel/supabase/migrations/001_extensions.sql
      - material-price-intel/supabase/migrations/002_schema.sql
      - material-price-intel/supabase/migrations/003_indexes.sql
      - material-price-intel/supabase/migrations/004_rls_policies.sql
      - material-price-intel/supabase/migrations/005_functions.sql
      - material-price-intel/supabase/seed.sql
      - material-price-intel/src/lib/types.ts
    modified: []

decisions:
  - id: schema-v1-scope
    decision: "Excluded price_alerts and query_log tables (v2 features)"
    context: "Plan explicitly scopes v1 to 8 core tables"
  - id: timestamptz-standard
    decision: "All timestamp columns use TIMESTAMPTZ (not TIMESTAMP)"
    context: "Timezone-aware timestamps for correctness across clients"
  - id: gen-random-uuid
    decision: "Use gen_random_uuid() for UUID defaults (built into PostgreSQL 13+)"
    context: "No extension needed, native to Supabase PostgreSQL"
  - id: rls-line-items-join
    decision: "line_items RLS uses JOIN to quotes for organization check (no direct org_id column)"
    context: "line_items inherit organization scope from parent quote"

metrics:
  duration: "~6 minutes"
  completed: "2026-02-06"
---

# Phase 1 Plan 2: Database Schema & Migrations Summary

**One-liner:** Complete Supabase PostgreSQL schema with 8 tables, pg_trgm fuzzy search indexes, organization-based RLS policies, and typed TypeScript interfaces.

## What Was Built

### Migration Files (5 ordered SQL files)

**001_extensions.sql** -- Enables pg_trgm extension for trigram similarity matching on material names and supplier names.

**002_schema.sql** -- Defines all 8 tables in FK-dependency order:
- `organizations` -- Multi-tenant root entity
- `user_profiles` -- Links auth.users to organizations with role (admin/editor/viewer)
- `suppliers` -- Organization-scoped with normalized_name for dedup
- `material_categories` -- Global taxonomy (lumber, windows, cabinets, etc.)
- `materials` -- Canonical material registry with structured fields (species, dimensions, grade, treatment, unit_of_measure) plus extensible category_attributes JSONB and aliases TEXT array
- `documents` -- Job queue for processing pipeline (pending/processing/completed/failed/review_needed)
- `quotes` -- Extracted quote data with separate delivery_cost, tax_amount, tax_rate columns
- `line_items` -- Individual quote line items with ON DELETE CASCADE to quotes

Also includes `update_updated_at_column()` trigger function applied to suppliers, materials, and quotes.

**003_indexes.sql** -- 11 performance indexes including:
- 3 GIN trigram indexes (materials.canonical_name, materials.species, suppliers.normalized_name)
- Partial index on documents for job queue (status IN pending/processing)
- Composite indexes for price queries (supplier+date, org+date)
- Foreign key lookup indexes (line_items.material_id, line_items.quote_id, documents.quote_id)

**004_rls_policies.sql** -- Row Level Security on all 8 tables:
- `auth.user_org_id()` helper function (SECURITY DEFINER) for consistent org lookup
- Organization-scoped tables: SELECT for org members, INSERT/UPDATE for editors+admins, DELETE for admins only
- `material_categories`: Global SELECT for all authenticated users, admin-only write
- `line_items`: Organization access checked via JOIN to parent quote
- `user_profiles`: Users see org profiles, update own profile, admins manage all

**005_functions.sql** -- Two database functions:
- `find_similar_material(p_org_id, p_search_name, p_threshold)` -- pg_trgm similarity search, returns top 5 matches
- `get_material_price_history(p_material_id, p_org_id)` -- Price history across suppliers, ordered by date DESC, limit 50

### Seed Data
**seed.sql** -- 7 material categories with ON CONFLICT DO NOTHING for idempotency: lumber, windows, cabinets, flooring, roofing, hardware, other.

### TypeScript Types
**src/lib/types.ts** -- Interfaces for all 8 tables plus:
- Union types for DocumentFileType, DocumentSource, DocumentStatus
- Database helper type enabling `createClient<Database>(url, key)` for fully typed Supabase client
- Verified with `tsc --strict` -- zero compilation errors

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Excluded price_alerts and query_log tables | v2 features per plan scope |
| TIMESTAMPTZ for all timestamps | Timezone-aware for correctness |
| gen_random_uuid() for UUID defaults | Native to PostgreSQL 13+, no extension needed |
| line_items RLS via JOIN to quotes | No direct organization_id column; inherits from parent quote |
| category_attributes JSONB on materials | Extensibility for non-lumber categories (windows: frame_material, glass_type) |
| Separate delivery_cost and tax_amount on quotes | Per requirements -- not embedded in line items |

## Deviations from Plan

None -- plan executed exactly as written.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Initialize Supabase and write migration SQL files | 0558887 | 001-005 migrations, seed.sql, config.toml |
| 2 | Create TypeScript type definitions | 5776972 | src/lib/types.ts |

## Verification Results

| Check | Result |
|-------|--------|
| 5 migration files exist | PASS |
| seed.sql with 7 categories | PASS |
| types.ts compiles (tsc --strict) | PASS |
| 8 tables match architecture | PASS |
| Material structured fields present | PASS |
| Separate delivery_cost/tax_amount | PASS |
| 3 GIN trigram indexes | PASS |
| RLS on all 8 tables | PASS |

## Next Phase Readiness

This plan provides the complete database schema for all subsequent phases. Plan 01-03 (React app shell + Supabase client) depends on the TypeScript types created here. Phase 2 (upload pipeline) depends on the documents table and job queue indexes. Phase 3 (AI extraction) depends on quotes and line_items tables. Phase 5 (normalization) depends on materials table and find_similar_material function.

No blockers for downstream work.
