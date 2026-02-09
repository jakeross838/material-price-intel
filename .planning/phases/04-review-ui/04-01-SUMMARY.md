---
phase: 04-review-ui
plan: 01
subsystem: database
tags: [pg_net, triggers, rpc, supabase, sql-migrations, security-definer]

# Dependency graph
requires:
  - phase: 03-ai-extraction
    provides: Edge Function process-document, documents/quotes/line_items tables
provides:
  - pg_net database trigger for automatic extraction on document INSERT
  - approved document status with CHECK constraint
  - approve_quote RPC with organization ownership check
  - update_quote_review RPC with organization ownership check
  - TypeScript DocumentStatus type including approved
affects: [04-02 review page, 04-03 review workflow, 06-price-search]

# Tech tracking
tech-stack:
  added: [pg_net extension]
  patterns: [database-trigger-driven extraction, SECURITY DEFINER RPCs with org ownership checks, dynamic CHECK constraint replacement]

key-files:
  created:
    - material-price-intel/supabase/migrations/007_extraction_trigger.sql
    - material-price-intel/supabase/migrations/008_approved_status_and_rpc.sql
  modified:
    - material-price-intel/src/hooks/useUploadDocument.ts
    - material-price-intel/src/lib/types.ts
    - material-price-intel/src/components/documents/RecentUploads.tsx

key-decisions:
  - "pg_net database trigger replaces broken client-side supabase.functions.invoke()"
  - "Service role key hardcoded in SECURITY DEFINER function (safe -- only postgres role can view source)"
  - "approve_quote atomically marks quote verified and document approved"
  - "update_quote_review uses COALESCE for partial updates, full replacement for line items"
  - "No p_supplier_name parameter in update_quote_review (dead parameter removed per checker)"

patterns-established:
  - "SECURITY DEFINER RPCs with public.user_org_id() ownership guard: all mutations verify org membership before acting"
  - "Dynamic CHECK constraint replacement: drop auto-named constraint by querying pg_constraint, re-add with explicit name"
  - "pg_net async HTTP trigger pattern: AFTER INSERT trigger fires net.http_post for background processing"

# Metrics
duration: 6min
completed: 2026-02-09
---

# Phase 4 Plan 1: Database Trigger + Review Infrastructure Summary

**pg_net extraction trigger replacing broken client-side invoke, plus approve_quote and update_quote_review RPCs with org ownership checks**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-09T16:50:52Z
- **Completed:** 2026-02-09T16:56:49Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Replaced broken client-side `supabase.functions.invoke()` with reliable pg_net database trigger that auto-fires extraction on document INSERT
- Added 'approved' document status via dynamic CHECK constraint replacement
- Created `approve_quote` RPC that atomically marks quote as verified and document as approved, with organization ownership validation
- Created `update_quote_review` RPC that saves edits to quote scalar fields and replaces line items, with organization ownership validation
- Updated TypeScript types and UI status badge map to support approved status

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pg_net database trigger for auto-extraction + remove broken client-side invoke** - `b59311e` (feat)
2. **Task 2: Add approved status and review RPCs with organization ownership checks** - `7da3a36` (feat)

## Files Created/Modified
- `material-price-intel/supabase/migrations/007_extraction_trigger.sql` - pg_net extension + trigger function + trigger on documents INSERT
- `material-price-intel/supabase/migrations/008_approved_status_and_rpc.sql` - Approved status CHECK, approve_quote RPC, update_quote_review RPC
- `material-price-intel/src/hooks/useUploadDocument.ts` - Removed broken supabase.functions.invoke() call
- `material-price-intel/src/lib/types.ts` - Added 'approved' to DocumentStatus union type
- `material-price-intel/src/components/documents/RecentUploads.tsx` - Added approved status badge and clickable row support

## Decisions Made
- pg_net database trigger replaces client-side Edge Function invocation -- client-side call failed silently because it used the anon key, not the service role key
- Service role key hardcoded in SECURITY DEFINER function body is safe because only the postgres role can inspect function source code
- approve_quote updates both quotes.is_verified and documents.status in one transaction for atomicity
- update_quote_review uses COALESCE pattern for partial quote field updates but full DELETE+INSERT replacement for line items (simpler than diffing)
- No p_supplier_name parameter on update_quote_review -- supplier editing is out of scope for review, and the checker flagged it as a dead parameter

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added 'approved' status to RecentUploads statusConfig map**
- **Found during:** Task 2 (build verification)
- **Issue:** RecentUploads.tsx uses `Record<DocumentStatus, ...>` for its status config. Adding 'approved' to the DocumentStatus type without updating the config map caused a TypeScript build error (TS2741: Property 'approved' is missing).
- **Fix:** Added `approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800" }` to the statusConfig object and updated the hasQuote condition to include approved documents.
- **Files modified:** material-price-intel/src/components/documents/RecentUploads.tsx
- **Verification:** `npm run build` passes cleanly
- **Committed in:** 7da3a36 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for build correctness. No scope creep -- the statusConfig map must be exhaustive per TypeScript's Record type.

## Issues Encountered
None -- both migrations applied successfully to the remote Supabase database via the Management API.

## User Setup Required
None - no external service configuration required. Both migrations (007, 008) have been applied to the remote database.

## Next Phase Readiness
- Database infrastructure is ready for the review UI (04-02): approved status, approve_quote RPC, update_quote_review RPC all exist
- The pg_net extraction trigger is live -- new document uploads will automatically trigger extraction
- TypeScript types are updated for the approved status
- Ready for 04-02 (Review Page Components) to build the UI that calls these RPCs

---
*Phase: 04-review-ui*
*Completed: 2026-02-09*
