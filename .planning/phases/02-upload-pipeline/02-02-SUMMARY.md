---
phase: 02-upload-pipeline
plan: 02
subsystem: upload
tags: [supabase-realtime, react-query, status-tracking, job-queue, sql-migration]

dependency-graph:
  requires: [02-01]
  provides: [document-status-realtime, recent-uploads-ui, job-queue-functions]
  affects: [03-ai-extraction, 04-review-ui]

tech-stack:
  added: []
  patterns: [supabase-realtime-subscription, react-query-invalidation-on-realtime, atomic-job-claim-with-skip-locked]

file-tracking:
  key-files:
    created:
      - material-price-intel/src/hooks/useDocumentStatus.ts
      - material-price-intel/src/components/documents/RecentUploads.tsx
      - material-price-intel/supabase/migrations/006_job_queue.sql
    modified:
      - material-price-intel/src/pages/UploadPage.tsx

decisions:
  - id: realtime-invalidation
    decision: "Realtime events invalidate React Query cache rather than manually patching state"
    context: "Simpler and more reliable than merging Realtime payloads into cached arrays; React Query refetches automatically"
  - id: rls-scoping
    decision: "No client-side organization filter on document queries"
    context: "RLS policies (004_rls_policies.sql) enforce organization scoping at the database level"
  - id: edge-function-trigger
    decision: "Job queue designed for Edge Function callers, not pg_cron"
    context: "Single-user v1 uses on-demand processing; claim_pending_document() still supports concurrent workers if needed later"

metrics:
  duration: "~5 minutes"
  completed: "2026-02-09"
---

# Phase 2 Plan 02: Processing Status + Realtime Summary

**One-liner:** Supabase Realtime document status hooks with color-coded recent uploads list and atomic job queue SQL functions (claim/complete/fail) for Phase 3's extraction pipeline.

## What Was Built

### Document Status Hooks (`src/hooks/useDocumentStatus.ts`)

Two hooks for live document tracking:

**`useDocumentStatus(documentId)`** -- Subscribes to Realtime changes for a single document. Fetches initial state on mount, then listens for UPDATE events via `supabase.channel().on('postgres_changes')`. Returns `{ document, loading }`. Cleans up Realtime channel on unmount or documentId change.

**`useRecentDocuments(limit)`** -- Fetches recent documents via React Query, subscribes to Realtime for all document INSERT/UPDATE events. On any Realtime event, invalidates the `['documents', 'recent']` query key so React Query refetches automatically. Returns `{ documents, isLoading }`. RLS policies enforce organization scoping -- no client-side filter needed.

### Recent Uploads Component (`src/components/documents/RecentUploads.tsx`)

Displays a list of recently uploaded documents with:
- File icon, name (truncated), size (formatted), and relative timestamp ("2 minutes ago")
- Color-coded status badges:
  - **Pending**: amber badge
  - **Processing**: blue badge with pulse animation
  - **Completed**: green badge
  - **Failed**: red badge (error message shown on hover via title attribute)
  - **Review Needed**: orange badge
- Loading state with spinner
- Empty state with "No documents uploaded yet" message
- Uses `formatDistanceToNow` from date-fns for relative timestamps

### Upload Page Integration (`src/pages/UploadPage.tsx`)

Added `<RecentUploads />` component below the drag-and-drop zone. New uploads appear in the list automatically via Realtime subscription without page refresh.

### Job Queue Migration (`supabase/migrations/006_job_queue.sql`)

Three SECURITY DEFINER functions for async document processing:

**`claim_pending_document()`** -- Atomically claims the oldest pending document using `FOR UPDATE SKIP LOCKED` to prevent double-claiming in concurrent scenarios. Sets status to 'processing' and records `started_at`. Returns the full document row.

**`complete_document(p_document_id, p_quote_id)`** -- Marks a document as completed, records `completed_at`, optionally links to a quote via `p_quote_id`.

**`fail_document(p_document_id, p_error_message)`** -- Marks a document as failed with error message and `completed_at` timestamp.

**Realtime enablement** -- `ALTER PUBLICATION supabase_realtime ADD TABLE documents` enables Supabase Realtime for the documents table, required for the frontend hooks to receive postgres_changes events.

## Deviations from Plan

None -- plan executed exactly as written.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Realtime hooks + RecentUploads component | 7f9a263 | useDocumentStatus.ts, RecentUploads.tsx, UploadPage.tsx |
| 2 | Job queue SQL migration | fe17780 | 006_job_queue.sql |

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` zero TypeScript errors | PASS |
| /upload page renders RecentUploads below drop zone | PASS |
| useDocumentStatus subscribes to Realtime channel | PASS (code verified) |
| useRecentDocuments uses React Query + Realtime invalidation | PASS (code verified) |
| RecentUploads shows color-coded status badges (5 states) | PASS (code verified) |
| 006_job_queue.sql defines claim_pending_document | PASS |
| 006_job_queue.sql defines complete_document | PASS |
| 006_job_queue.sql defines fail_document | PASS |
| Realtime enabled via ALTER PUBLICATION | PASS |
| Key link: useDocumentStatus.ts -> supabase.channel() + postgres_changes | PASS |
| Key link: RecentUploads.tsx -> useRecentDocuments | PASS |
| Key link: UploadPage.tsx -> RecentUploads component | PASS |

## Next Phase Readiness

Phase 2 (File Upload + Storage Pipeline) is complete. The upload page stores PDFs, creates pending document records, and shows live status updates. The job queue functions are ready for Phase 3's AI extraction pipeline to call `claim_pending_document()`, process documents, and call `complete_document()` or `fail_document()`.

**User action required:** Apply migration `006_job_queue.sql` to Supabase (via `supabase db push` or SQL editor) before Phase 3 execution.

---
*Phase: 02-upload-pipeline*
*Completed: 2026-02-09*
