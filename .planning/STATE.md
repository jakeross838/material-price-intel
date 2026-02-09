# Project State: Material Price Intelligence System

**Milestone:** v1 — Core Price Intelligence
**Current Phase:** 4 (Human Review UI) -- IN PROGRESS
**Status:** Phase 4 In Progress (1/3 plans complete)
**Last Updated:** 2026-02-09

## Current Position

Phase: 4 of 8 (Human Review UI)
Plan: 1/3 executed (04-01 complete, 04-02 pending, 04-03 pending)
Status: In progress
Last activity: 2026-02-09 - Completed 04-01-PLAN.md

Progress: [█████████████████-] Phase 1 complete (3/3), Phase 2 complete (2/2), Phase 3 complete (3/3), Phase 4 in progress (1/3)

## Phase Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Project Foundation + Database Schema | Complete | 3/3 |
| 2 | File Upload + Storage Pipeline | Complete | 2/2 |
| 3 | AI Quote Extraction | Complete | 3/3 |
| 4 | Human Review UI | In Progress | 1/3 |
| 5 | Material Normalization Engine | Not Started | -- |
| 6 | Price Search + Filtering | Not Started | -- |
| 7 | Quote Management + Navigation | Not Started | -- |
| 8 | Polish + Integration Readiness | Not Started | -- |

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

## Blockers

All resolved. Database fully set up (all 8 migrations + seed + org + user_profile applied via Management API).

## Session Continuity

Last session: 2026-02-09
Stopped at: Completed 04-01-PLAN.md (database trigger + review infrastructure)
Resume file: None -- continue with 04-02

---
*Initialized: 2026-02-06*
*Phase 1 completed: 2026-02-06*
*Phase 2 completed: 2026-02-09*
*Phase 3 completed: 2026-02-09*
