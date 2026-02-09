---
phase: 03-ai-extraction
plan: 03
subsystem: extraction
tags: [edge-function-trigger, fire-and-forget, upload-hook, supabase-functions-invoke]

dependency-graph:
  requires: [02-01, 03-01, 03-02]
  provides: [automatic-extraction-trigger]
  affects: [04-review-ui]

tech-stack:
  added: []
  patterns: [fire-and-forget-edge-function-invocation]

file-tracking:
  key-files:
    created: []
    modified:
      - material-price-intel/src/hooks/useUploadDocument.ts

decisions:
  - id: fire-and-forget-invocation
    decision: "Edge Function invocation is not awaited -- upload returns immediately"
    context: "Extraction is async; status updates flow back via Realtime subscriptions (built in Phase 2)"
  - id: catch-without-throw
    decision: ".catch() logs error but does not throw or surface to user"
    context: "Document is already uploaded with 'pending' status; extraction failure is handled separately by the Edge Function's fail_document() RPC"

metrics:
  duration: "~3 minutes"
  completed: "2026-02-09"
---

# Phase 3 Plan 03: Wire Upload to Extraction Pipeline Summary

**One-liner:** Fire-and-forget `supabase.functions.invoke('process-document')` call added to the upload hook so that dropping a PDF automatically triggers the Claude extraction pipeline without blocking the upload response.

## What Was Built

### Upload Hook Edge Function Trigger (`src/hooks/useUploadDocument.ts`)

Added a fire-and-forget call to `supabase.functions.invoke('process-document', { body: { document_id: doc.id } })` immediately after the document record is created in the database. This closes the final gap in the upload-to-extraction pipeline:

1. User drops PDF
2. File uploaded to Supabase Storage
3. Document record created with status `pending`
4. **NEW:** Edge Function invoked to start extraction (fire-and-forget)
5. Upload returns immediately to user
6. Extraction runs asynchronously; status updates flow via Realtime

The invocation is intentionally NOT awaited. A `.catch()` handler logs any invocation failure to the console but does not throw -- the document is already safely stored and can be retried. The Supabase client automatically includes the user's auth token in the Edge Function request.

### ANTHROPIC_API_KEY Configuration (User Action)

The user configured the `ANTHROPIC_API_KEY` secret in the Supabase Edge Function secrets dashboard, enabling the process-document Edge Function to call Claude's API.

## Deviations from Plan

None -- plan executed exactly as written.

## Authentication Gates

During execution, the following user action was required:

1. Task 1: ANTHROPIC_API_KEY needed as Supabase Edge Function secret
   - Paused for user to configure via Supabase Dashboard
   - User confirmed configuration complete
   - Extraction pipeline can now call Claude API

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Configure ANTHROPIC_API_KEY in Supabase | -- | User configured via Supabase Dashboard |
| 2 | Add Edge Function trigger to upload hook | 9f90edf | useUploadDocument.ts |

## Verification Results

| Check | Result |
|-------|--------|
| `useUploadDocument.ts` contains `supabase.functions.invoke('process-document'` | PASS |
| Invocation is NOT awaited (fire-and-forget pattern) | PASS |
| Invocation has `.catch()` handler | PASS |
| Invocation passes `{ document_id: doc.id }` in body | PASS |
| Rest of upload flow unchanged (validate, upload, insert, return) | PASS |
| `npm run build` passes with zero errors | PASS |
| Key link: useUploadDocument.ts -> process-document Edge Function via functions.invoke | PASS |

## Next Phase Readiness

Phase 3 Plan 03 completes the wiring between the upload pipeline (Phase 2) and the AI extraction engine (Phase 3 Plans 01-02). The full end-to-end flow is now:

- User drops PDF -> Storage upload -> document record (pending) -> Edge Function invoked -> Claude extracts data -> quotes/line_items persisted -> status updated -> Realtime pushes to UI

Phase 3 has 3 plans total. With 03-01 (extraction engine), 03-02 (database persistence), and 03-03 (upload wiring) complete, Phase 3 is fully done. Phase 4 (Human Review UI) can proceed.

---
*Phase: 03-ai-extraction*
*Completed: 2026-02-09*
