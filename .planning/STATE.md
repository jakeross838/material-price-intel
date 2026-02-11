# Project State: Material Price Intelligence System

**Milestone:** v3 — Estimating & Procurement
**Current Phase:** 10 (Estimating & Procurement)
**Status:** In progress
**Last Updated:** 2026-02-11

## Current Position

Phase: 10 of 10 (Estimating & Procurement)
Plan: 3 of 8
Status: In progress
Last activity: 2026-02-11 - Completed 10-03: Room Management & Selection Editing

Progress: [###.....] 3/8 plans in Phase 10

## Phase Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Project Foundation + Database Schema | Complete | 3/3 |
| 2 | File Upload + Storage Pipeline | Complete | 2/2 |
| 3 | AI Quote Extraction | Complete | 3/3 |
| 4 | Human Review UI | Complete | 3/3 |
| 5 | Material Normalization Engine | Complete | 4/4 |
| 6 | Price Search + Filtering | Complete | delivered inline |
| 7 | Quote Management + Navigation | Complete | delivered inline |
| 8 | Reports & Price Analytics Dashboard | Complete | 3/3 |
| 9 | Smart Accuracy | Complete | 6/6 |
| 10 | Estimating & Procurement | In progress | 3/8 |

## Decisions Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-02-06 | 8-phase roadmap covering 25 v1 requirements | Comprehensive depth, schema-first approach |
| 2026-02-06 | Phases 3 and 5 flagged for research | AI extraction and material normalization are highest-risk |
| 2026-02-06 | v2 features deferred: email, Excel, NL queries, alerts, analytics, team access | Focus v1 on PDF upload -> extraction -> review -> search pipeline |
| 2026-02-06 | Excluded price_alerts and query_log tables from v1 schema | v2 features per plan scope |
| 2026-02-06 | TIMESTAMPTZ for all timestamps, gen_random_uuid() for UUIDs | Timezone-aware, native PostgreSQL 13+ |
| 2026-02-06 | line_items RLS via JOIN to quotes (no direct org_id) | Inherits organization scope from parent quote |
| 2026-02-06 | category_attributes JSONB on materials for extensibility | Non-lumber categories (windows, cabinets) use JSONB for custom fields |
| 2026-02-06 | shadcn v3.8 uses shadcn/tailwind.css import pattern | Runtime dep required, newer than traditional cn()-only setup |
| 2026-02-06 | Path alias @/ for all imports | Configured in tsconfig + vite.config for clean imports |
| 2026-02-06 | React Query staleTime 5 minutes, retry 1 | Balance between freshness and network efficiency |
| 2026-02-06 | Connected to Ross Built Price Analyzer Supabase project | xgpjwpwhtfmbvoqtvete.supabase.co |
| 2026-02-06 | Edge Function trigger instead of pg_cron for v1 job processing | Simpler for single-user; claim_pending_document() still supports concurrent workers if needed later |
| 2026-02-06 | No react-dropzone -- native HTML5 drag events | Minimizes dependencies; drag-and-drop is simple enough without a library |
| 2026-02-09 | Converted Database row types from interface to type alias | TypeScript interfaces do not satisfy Record<string, unknown> required by Supabase client GenericSchema |
| 2026-02-09 | Storage paths use {org_id}/{uuid}_{filename} pattern | Organizational hygiene for future multi-tenant scoping |
| 2026-02-09 | Realtime events invalidate React Query cache rather than manual state patches | Simpler and more reliable; React Query refetches automatically |
| 2026-02-09 | No client-side org filter on document queries -- RLS enforces scoping | 004_rls_policies.sql handles organization filtering at database level |
| 2026-02-09 | Use claude-haiku-4-5-20250315 for extraction | Cost-efficient and capable enough for structured data extraction from PDFs |
| 2026-02-09 | Send PDF as native document content block, not text extraction | Claude's native PDF support preserves table layouts, fonts, and visual structure |
| 2026-02-09 | Chunked base64 encoding (8192 bytes) for PDF conversion | Avoids call stack overflow from spread operator on large Uint8Arrays |
| 2026-02-09 | Edge Function uses SUPABASE_SERVICE_ROLE_KEY, not anon key | Needs elevated access to bypass RLS for cross-table operations |
| 2026-02-09 | Fire-and-forget Edge Function invocation from upload hook | Upload returns immediately; extraction status tracked via Realtime subscriptions |
| 2026-02-09 | .catch() logs extraction trigger failure without surfacing to user | Document is already stored with 'pending' status; extraction can be retried |
| 2026-02-09 | Tolerance-based math validation (1%/$0.02 lines, $1.00 totals) | Exact equality would produce false-positive warnings from rounding differences |
| 2026-02-09 | Confidence reduced by 0.05 per warning, max -0.3, floor at 0.1 | Graduated degradation; single rounding issue doesn't tank confidence |
| 2026-02-09 | Validation warnings stored in raw_extraction JSONB | Phase 4 review UI can highlight specific math issues for human reviewers |
| 2026-02-09 | Direct UPDATE for review_needed status (no RPC) | complete_document RPC hardcodes status=completed |
| 2026-02-09 | Race condition handling on supplier creation via re-query | Concurrent requests creating same supplier handled gracefully |
| 2026-02-09 | Anon key must be JWT format, not sb_publishable_ format | Supabase JS client RLS requires JWT-format key |
| 2026-02-09 | Model ID updated to claude-haiku-4-5-20251001 | Previous model 20250315 not found |
| 2026-02-09 | Strip markdown fences from Claude JSON responses | Claude wraps JSON in ```json``` fences despite prompt instructions |
| 2026-02-09 | public.user_org_id() not auth.user_org_id() | Supabase blocks function creation in auth schema via migrations/API |
| 2026-02-09 | pg_net for auto-extraction trigger (Phase 4 plan) | Client-side supabase.functions.invoke() fails; pg_net database trigger is reliable |
| 2026-02-09 | pg_net database trigger replaces client-side Edge Function invoke | Service role key in SECURITY DEFINER function body (safe -- only postgres can view source) |
| 2026-02-09 | approve_quote atomically marks quote verified + document approved | Single RPC for atomic state transition with org ownership check |
| 2026-02-09 | update_quote_review uses COALESCE for partials, DELETE+INSERT for line items | Simpler than diffing; no dead p_supplier_name parameter |
| 2026-02-09 | Added RPC function types to Database.Functions in types.ts | Supabase JS client rpc() is typed from Database schema; without declarations, TypeScript rejects rpc() calls |
| 2026-02-09 | Hardcoded service_role_key in pg_net normalize trigger (same as 007) | SECURITY DEFINER functions are safe; only postgres role can view function source |
| 2026-02-09 | RLS on material_aliases via subquery to materials.organization_id | No direct org_id column; inherits org scope through material_id FK |
| 2026-02-09 | Two-tier threshold: 0.3 search, 0.5 auto-link | Prevents false-positive auto-matches while keeping broad candidate retrieval |
| 2026-02-09 | Single batch AI call for all descriptions per quote | Efficiency over per-item calls; classifyMaterials() sends one Claude request |
| 2026-02-09 | Per-item error isolation in normalization | One bad classification doesn't block the entire quote's normalization |
| 2026-02-09 | Record both raw_description and canonical_name as aliases | Maximizes future fuzzy matching from both original and normalized forms |
| 2026-02-09 | Delayed invalidation (10s setTimeout) for async normalization results | Edge Function takes ~5-15s after approval; immediate invalidation would show un-normalized items |
| 2026-02-09 | FK Relationships added to Database type for typed Supabase joins | PostgREST typed client requires Relationships definitions; without them, relational select queries fail |
| 2026-02-09 | Material badge in approved view only (not review mode) | Normalization only runs post-approval; review mode uses separate LineItemsEditor component |
| 2026-02-11 | Client-side filtering for search page | All line items loaded then filtered in-memory; simpler than server-side for v1 scale |
| 2026-02-11 | QuoteDetailPage back links go to /quotes not /upload | Quotes list page now exists as proper navigation target |
| 2026-02-11 | Phases 6+7 delivered as inline fixes | Quotes list + search/filter pages created outside formal plan process to fix user-reported 404s and missing features |
| 2026-02-11 | Recharts for charting library | Lightweight, composable, ships own types, works with React 19 |
| 2026-02-11 | Client-side is_verified filter in useReportsData | PostgREST cannot reliably filter on joined table columns |
| 2026-02-11 | Separate categoryChartData excludes materialFilter | Prevents misleading single-material category averages |
| 2026-02-11 | Recharts onClick requires type cast | MouseHandlerDataParam type doesn't include activePayload |
| 2026-02-11 | applies_to_line_item_id NULL in RPC INSERT (DELETE+INSERT pattern) | Discount attribution set during AI extraction; FK destroyed on review save cycle -- accepted limitation |
| 2026-02-11 | Backfill effective_unit_price = unit_price when no discount exists | Safe default ensuring all rows have comparable values |
| 2026-02-11 | LineItemType as 5-value union: material, discount, fee, subtotal_line, note | Covers all observed line types in real lumber quotes |
| 2026-02-11 | discount_applies_to uses 0-based line index, null for quote-wide | Simple unambiguous linking between discount and target material |
| 2026-02-11 | pricing_flag string for call_for_pricing, zero_price, negative_quantity | Three distinct edge cases need differentiation beyond a boolean |
| 2026-02-11 | Additive-only validation (sections 5+6) preserving existing 4 sections | Prevents regressions in existing math validation logic |
| 2026-02-11 | Conservative reclassification (high-confidence only) | Ambiguous items stay as 'material' for human review; false negatives preferable to false positives |
| 2026-02-11 | GREATEST(0,...) floor on effective_unit_price | Prevents negative effective prices from unusual discount configurations |
| 2026-02-11 | Section ordering: reclassify before compute effective price | Ensures effective_unit_price only computed for rows that remain line_type='material' |
| 2026-02-11 | Two-pass INSERT+UPDATE for self-referencing FK | applies_to_line_item_id references row IDs only available after INSERT |
| 2026-02-11 | Effective price rounded to 4 decimals, floored at 0 | Prevents floating point noise; negative prices are invalid |
| 2026-02-11 | Quote-wide discount applied multiplicatively last | Per-item discounts reduce base, then quote-wide applies to discounted price |
| 2026-02-11 | Server-side line_type filter on normalization query | .eq('line_type','material') more efficient than client-side filtering |
| 2026-02-11 | Native select element for line_type dropdown in review | Lightweight, no extra dependency; matches existing form patterns |
| 2026-02-11 | Effective price recomputation only on line_type change | Avoids recomputing on every field edit; explicit reclassification is the trigger |
| 2026-02-11 | Fallback to unit_price when effective_unit_price is null | Backward compatibility with pre-classification data |
| 2026-02-11 | Chart components updated alongside ReportsPage for effective prices | PriceTrendChart and CategoryAggregateChart also use effectiveUnitPrice for consistent rendering |
| 2026-02-11 | GENERATED ALWAYS AS STORED for variance_amount column | Auto-computes (actual_total or estimated_total) minus allowance_amount |
| 2026-02-11 | Multi-level RLS join chains for nested tables | project_rooms via projects, project_selections via rooms->projects, procurement_items via selections->rooms->projects |
| 2026-02-11 | SECURITY DEFINER on RPCs with manual org ownership checks | get_project_summary and get_material_price_stats verify caller org before returning data |
| 2026-02-11 | UNIQUE(selection_id) on procurement_items enforces 1:1 | Each selection has at most one procurement record tracking its buyout lifecycle |
| 2026-02-11 | Organization ID fetched from user_profiles in useCreateProject | Auth user ID mapped to org via user_profiles lookup before project insert |
| 2026-02-11 | useState per field for project create form (no form library) | Simple controlled inputs matching existing patterns |
| 2026-02-11 | Empty strings converted to null before Supabase insert | Database expects NULL for optional fields, not empty strings |
| 2026-02-11 | Edit/Add Room buttons as disabled placeholders | Plan 03 will implement room management; edit deferred to future plan |
| 2026-02-11 | RoomManager accepts selectedRoomId + onSelectRoom props for controlled selection | Parent page owns selected room state so it can coordinate between room list and selection editor |
| 2026-02-11 | SelectionWithJoins type derived from Awaited<ReturnType<>> pattern | Avoids manually re-declaring joined types; stays in sync with Supabase select query |
| 2026-02-11 | Summary cards adapt between metadata view and financial totals view | When no selections exist, cards show project metadata; when selections exist, cards show aggregated totals |
| 2026-02-11 | Upgrade status computed client-side on save with 1% tolerance threshold | actual > allowance * 1.01 = upgrade, actual < allowance * 0.99 = downgrade, else standard |

## Blockers

None.

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed 10-03-PLAN.md (Room Management & Selection Editing)
Resume file: None
Modified: useProjectRooms.ts, useProjectSelections.ts, RoomManager.tsx, SelectionEditor.tsx, ProjectDetailPage.tsx
Phase 10 progress: 3/8 plans complete

---
*Initialized: 2026-02-06*
*Phase 1 completed: 2026-02-06*
*Phase 2 completed: 2026-02-09*
*Phase 3 completed: 2026-02-09*
*Phase 4 completed: 2026-02-09*
*Phase 5 completed: 2026-02-09*
*Phase 6 completed: 2026-02-11*
*Phase 7 completed: 2026-02-11*
*Phase 8 completed: 2026-02-11*
*v1 Milestone complete: 2026-02-11*
*Phase 9 started: 2026-02-11*
*Phase 9 completed: 2026-02-11*
*Phase 10 started: 2026-02-11*
