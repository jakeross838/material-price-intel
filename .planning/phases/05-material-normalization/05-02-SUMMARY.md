---
phase: 05-material-normalization
plan: 02
subsystem: material-normalization-engine
tags: [edge-function, claude-haiku, fuzzy-matching, material-classification, deno, supabase]
dependency-graph:
  requires:
    - phase: 05-01
      provides: material_aliases table, find_similar_material RPC, pg_net trigger on quote approval
    - phase: 03-01
      provides: process-document Edge Function patterns (CORS, Deno.serve, service role client)
  provides:
    - normalize-materials Edge Function (classifies and links line items to canonical materials)
    - AI material classifier with lumber dimension normalization
    - Automatic alias recording for cross-supplier matching
  affects: [05-03, 05-04, 06-01]
tech-stack:
  added: []
  patterns: [batch-ai-classification, two-tier-fuzzy-threshold, per-item-error-isolation, race-condition-handling-on-insert]
key-files:
  created:
    - material-price-intel/supabase/functions/normalize-materials/index.ts
    - material-price-intel/supabase/functions/normalize-materials/classifier.ts
  modified: []
key-decisions:
  - "Two-tier threshold: RPC search at 0.3, auto-link at 0.5 to prevent false positives"
  - "Single batch AI call for all descriptions in a quote (efficiency over per-item calls)"
  - "Per-item try/catch so one classification failure doesn't block the entire quote"
  - "Both raw_description and AI canonical_name recorded as aliases for future matching"
patterns-established:
  - "Batch AI classification: send all items in one Claude call, parse array response"
  - "Two-tier fuzzy matching: broad search threshold + stricter auto-link threshold"
  - "Race condition handling on material creation via re-query on unique constraint violation"
metrics:
  duration: ~4min
  completed: 2026-02-09
---

# Phase 5 Plan 2: Normalization Edge Function Summary

**normalize-materials Edge Function with batch AI classification via Claude Haiku, two-tier fuzzy matching (0.3 search / 0.5 auto-link), and automatic alias recording for cross-supplier material resolution**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-09T18:15:24Z
- **Completed:** 2026-02-09T18:19:33Z
- **Tasks:** 2/2
- **Files created:** 2

## Accomplishments

### 1. AI Material Classifier (classifier.ts)

Created batch classification function that sends all descriptions in a single Claude Haiku API call:

- **MaterialClassification type**: species, dimensions, grade, treatment, unit_of_measure, category, canonical_name, confidence
- **Lumber dimension normalization rules** in system prompt:
  - Decimal to nominal fractions: 1.25" = 5/4, 1.5" = 2x, 0.75" = 1x
  - Standard dimension format: "{thickness}x{width}x{length}" (e.g., "5/4x6x16")
  - S4S goes in treatment, not dimensions
  - Pressure Treated / Kiln Dried go in treatment field
- **Species abbreviation handling**: PT Pine, SPF, SYP, Doug Fir
- **Category classification**: lumber, hardware, roofing, windows, flooring, cabinets, other
- **Fallback padding**: If Claude returns fewer results than descriptions, pads with safe defaults
- **Markdown fence stripping**: Same pattern as process-document

### 2. normalize-materials Edge Function (index.ts)

Created and deployed the main normalization Edge Function:

- **Request flow**: Validates quote_id, checks is_verified=TRUE, fetches unnormalized line items
- **Batch classification**: Single AI call via classifyMaterials() for all descriptions
- **Two-tier fuzzy matching**:
  - Search threshold 0.3 via find_similar_material() RPC (broad candidate retrieval)
  - Auto-link threshold 0.5 (only link when confident)
  - Prevents false-positive matches while keeping good candidate retrieval
- **Material creation**: New canonical material with species/dimensions/grade/treatment when no match found
- **Alias recording**: Both raw_description and canonical_name recorded as aliases for every material
- **Race condition handling**: Unique constraint violations on (organization_id, canonical_name) handled by re-querying
- **Per-item error isolation**: try/catch around each line item; failures logged but don't block batch
- **Response**: Returns normalized count, new_materials count, matched_existing count, and any per-item errors

## Task Commits

| Hash | Message |
|------|---------|
| e7fae94 | feat(05-02): create AI material classifier for lumber normalization |
| db79bc5 | feat(05-02): create and deploy normalize-materials Edge Function |

## Files Created

- **material-price-intel/supabase/functions/normalize-materials/classifier.ts** (228 lines) -- AI material classification with lumber dimension normalization
- **material-price-intel/supabase/functions/normalize-materials/index.ts** (480 lines) -- Edge Function entry point with fuzzy matching, material creation, and alias recording

## Decisions Made

| Decision | Context |
|----------|---------|
| Two-tier threshold (0.3 search, 0.5 auto-link) | Prevents false-positive auto-matches while keeping broad candidate retrieval for future manual review |
| Single batch AI call per quote | Sending all descriptions in one Claude call is more efficient and cheaper than per-item calls |
| Per-item try/catch error isolation | One bad description shouldn't prevent normalization of the other 20 items in a quote |
| Record both raw_description and canonical_name as aliases | Maximizes future fuzzy matching hit rate from both original supplier text and AI-normalized form |
| Category map loaded once per invocation | Avoids repeated queries to material_categories table during per-item processing |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The Edge Function uses existing ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY secrets already configured in the Supabase project.

## Next Phase Readiness

Plan 05-03 (Material Search UI) can now:
- Materials are created/linked automatically when quotes are approved
- Aliases are recorded for fuzzy matching of future descriptions
- The normalization pipeline is fully operational end-to-end:
  1. User approves quote (is_verified = TRUE)
  2. pg_net trigger fires normalize-materials Edge Function
  3. AI classifies descriptions, fuzzy matches or creates materials
  4. line_items.material_id is set, aliases recorded

Plan 05-04 (Material Management UI) can build on:
- Materials table populated with AI-classified canonical materials
- material_aliases table populated with description variations
- merge_materials() RPC available for combining duplicates

---
*Phase: 05-material-normalization*
*Completed: 2026-02-09*
