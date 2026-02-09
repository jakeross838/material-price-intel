---
phase: 05-material-normalization
plan: 01
subsystem: material-normalization-schema
tags: [postgresql, material-aliases, trigram, fuzzy-search, pg_net, merge-materials, rls]
dependency-graph:
  requires: [04-01, 04-03]
  provides: [material-aliases-table, enhanced-find-similar-material, merge-materials-rpc, normalize-trigger]
  affects: [05-02, 05-03, 05-04]
tech-stack:
  added: []
  patterns: [alias-normalization, dual-source-fuzzy-search, soft-delete-merge, pg_net-trigger-on-approve]
key-files:
  created:
    - material-price-intel/supabase/migrations/009_material_aliases.sql
  modified:
    - material-price-intel/src/lib/types.ts
decisions:
  - id: pg_net-hardcoded-pattern
    choice: Hardcoded service_role_key in trigger function body (same pattern as 007)
    why: Supabase pg_net triggers with SECURITY DEFINER safely embed the key; only postgres role can view function source
  - id: rls-on-aliases
    choice: Added RLS policy on material_aliases via subquery to materials.organization_id
    why: material_aliases has no direct org_id column; inherits org scope through material_id FK join
metrics:
  duration: ~5 minutes
  completed: 2026-02-09
---

# Phase 5 Plan 1: Material Aliases Schema + Normalization Trigger Summary

**One-liner:** material_aliases table with trigram GIN index, enhanced find_similar_material searching canonical names AND aliases, merge_materials RPC, and pg_net trigger to fire normalization on quote approval

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-02-09
- **Tasks:** 2/2
- **Files created:** 1
- **Files modified:** 1

## Accomplishments

### 1. Material Aliases Table + Database Functions (Task 1)

Created migration `009_material_aliases.sql` with:

**material_aliases table:**
- `id` UUID primary key
- `material_id` UUID FK to materials (CASCADE delete)
- `alias` TEXT -- the raw description variation as-is
- `normalized_alias` TEXT -- lowercase trimmed for matching
- `source_quote_id` UUID FK to quotes -- tracks which quote introduced the alias
- `created_at` TIMESTAMPTZ
- UNIQUE constraint on `(material_id, normalized_alias)` to prevent duplicate mappings

**Indexes:**
- `idx_material_aliases_material_id` -- B-tree on material_id for FK lookups
- `idx_material_aliases_normalized_trgm` -- GIN trigram index on normalized_alias for fuzzy search

**RLS:**
- `material_aliases_org_isolation` policy using subquery to materials.organization_id via public.user_org_id()

**Enhanced find_similar_material():**
- Uses CTEs: `canonical_matches` (searches materials.canonical_name) and `alias_matches` (searches material_aliases.normalized_alias)
- UNION ALL combines both result sets
- DISTINCT ON ensures each material appears once with its highest similarity score
- Returns up to 5 best matches above threshold (default 0.3)

**merge_materials(p_keep_id, p_merge_id):**
- SECURITY DEFINER with org ownership checks on both materials
- Moves all line_items from merge to keep material
- Transfers aliases (ON CONFLICT DO NOTHING for duplicates)
- Adds merged material's canonical_name as alias on kept material
- Soft-deletes merged material (is_active = FALSE)

**Normalization trigger:**
- `trigger_normalize_materials()` fires on quotes AFTER UPDATE
- WHEN clause: `NEW.is_verified = TRUE AND OLD.is_verified IS DISTINCT FROM TRUE`
- Calls `normalize-materials` Edge Function via pg_net with service_role_key auth
- Same hardcoded-key pattern as 007_extraction_trigger.sql

### 2. TypeScript Types (Task 2)

- `MaterialAlias` type mirroring the database table schema
- `material_aliases` table entry in `Database.Tables` with Row/Insert/Update types
- `merge_materials` RPC type in `Database.Functions` (Args: p_keep_id, p_merge_id; Returns: undefined)
- `find_similar_material` RPC type with optional p_threshold parameter, returning Array of {id, canonical_name, similarity}
- TypeScript compilation passes cleanly

## Task Commits

| Hash | Message |
|------|---------|
| aa9e106 | feat(05-01): create material_aliases table and enhanced normalization functions |
| 25e6cde | feat(05-01): add MaterialAlias type and normalization RPC types |

## Files

- **material-price-intel/supabase/migrations/009_material_aliases.sql** (140 lines) -- material_aliases table, indexes, RLS, enhanced find_similar_material, merge_materials, normalize trigger
- **material-price-intel/src/lib/types.ts** (31 lines added) -- MaterialAlias type, Database.Tables entry, RPC function types

## Deviations from Plan

### Auto-added Critical Functionality

**1. [Rule 2 - Missing Critical] Added RLS policy on material_aliases**

- **Found during:** Task 1
- **Issue:** Plan did not specify RLS for the new material_aliases table, but all other tables have RLS policies for org isolation
- **Fix:** Added `material_aliases_org_isolation` policy using subquery: `material_id IN (SELECT id FROM materials WHERE organization_id = public.user_org_id())`
- **Files modified:** material-price-intel/supabase/migrations/009_material_aliases.sql
- **Commit:** aa9e106

## Decisions Made

| Decision | Context |
|----------|---------|
| Hardcoded service_role_key in pg_net trigger (same as 007 pattern) | SECURITY DEFINER functions are safe; only postgres role can view function source |
| RLS on material_aliases via subquery to materials table | No direct org_id column; inherits organization scope through material_id FK |

## Next Phase Readiness

Plan 05-02 (Normalization Edge Function) can now:
- Insert into material_aliases when matching descriptions to materials
- Use find_similar_material() to find both canonical and alias matches
- The pg_net trigger on quote approval will invoke the Edge Function automatically
- merge_materials() is available for the UI in 05-04

---
*Phase: 05-material-normalization*
*Completed: 2026-02-09*
