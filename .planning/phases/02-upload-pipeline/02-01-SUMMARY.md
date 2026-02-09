---
phase: 02-upload-pipeline
plan: 01
subsystem: upload
tags: [supabase-storage, drag-and-drop, file-upload, react-query-mutation, pdf-validation]

dependency-graph:
  requires: [01-01, 01-02, 01-03]
  provides: [upload-page, upload-hook, document-record-creation, storage-upload]
  affects: [02-02, 03-ai-extraction, 04-review-ui, 07-quote-management]

tech-stack:
  added: []
  patterns: [react-query-mutation, native-html5-drag-drop, supabase-storage-upload, org-scoped-file-paths]

file-tracking:
  key-files:
    created:
      - material-price-intel/src/hooks/useUploadDocument.ts
      - material-price-intel/src/pages/UploadPage.tsx
    modified:
      - material-price-intel/src/App.tsx
      - material-price-intel/src/lib/types.ts

decisions:
  - id: native-drag-drop
    decision: "Native HTML5 drag events instead of react-dropzone library"
    context: "Minimize dependencies; drag-and-drop is simple enough without a library"
  - id: type-alias-fix
    decision: "Converted Database row types from interface to type alias"
    context: "TypeScript interfaces do not satisfy Record<string, unknown> required by Supabase client GenericSchema; type aliases do"
  - id: org-scoped-paths
    decision: "Storage paths use {org_id}/{uuid}_{filename} pattern"
    context: "Organizational hygiene for future multi-tenant scoping"

metrics:
  duration: "~12 minutes"
  completed: "2026-02-09"
---

# Phase 2 Plan 01: File Upload + Storage Summary

**One-liner:** Drag-and-drop PDF upload page with Supabase Storage integration, document record creation, and full state machine UI (idle/dragover/uploading/success/error).

## What Was Built

### Upload Hook (`src/hooks/useUploadDocument.ts`)
Custom hook wrapping React Query's `useMutation` for the full upload flow:
1. Validates file type (PDF only) and size (50MB limit) client-side
2. Fetches and caches the user's `organization_id` from `user_profiles`
3. Generates unique storage path: `{org_id}/{uuid}_{sanitized_filename}`
4. Uploads file to Supabase Storage bucket `documents`
5. Inserts document record in `documents` table with status `pending`
6. Best-effort cleanup removes orphaned storage files if DB insert fails
7. Returns mutation state (`isPending`, `isSuccess`, `isError`, `error`, `data`, `reset`)

### Upload Page (`src/pages/UploadPage.tsx`)
Full drag-and-drop upload UI with five visual states:
- **Idle:** Upload cloud icon, "Drag and drop your PDF here" with "click to browse" link
- **Dragover:** Border highlights to primary color, "Drop to upload" text
- **Uploading:** Spinner animation with filename display
- **Success:** Green checkmark, "Uploaded successfully!" with pending status badge, auto-resets after 3 seconds
- **Error:** Red alert icon with error message and "Try again" button

Uses native HTML5 drag events (dragEnter/dragOver/dragLeave/drop) with a counter ref to handle nested element events correctly. Hidden file input triggered by click on drop zone. Keyboard accessible (Enter/Space to browse).

### Route Registration (`src/App.tsx`)
Added `/upload` route inside `ProtectedRoute > AppLayout`, accessible from sidebar navigation. Updated future routes comment to reflect remaining routes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Database type incompatibility with Supabase client generics**
- **Found during:** Task 2 (build verification)
- **Issue:** `interface` declarations in `types.ts` do not satisfy `Record<string, unknown>` in TypeScript's type system, causing the Supabase client's `GenericSchema` constraint to resolve to `never`. This made `.from('documents').insert()` and `.from('user_profiles').select()` reject all arguments.
- **Fix:** Converted all row types (`Organization`, `UserProfile`, `Supplier`, etc.) from `interface` to `type` alias, which are structurally compatible with `Record<string, unknown>`. Also added `Relationships: []` to each table definition and `Views`/`Functions` to the public schema, as required by the Supabase v2.95.3 `GenericSchema` type.
- **Files modified:** `material-price-intel/src/lib/types.ts`
- **Commit:** 62cd049

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create Supabase Storage bucket (checkpoint) | -- | User configured Supabase dashboard |
| 2 | Upload hook, upload page, /upload route | 62cd049 | useUploadDocument.ts, UploadPage.tsx, App.tsx, types.ts |

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` zero TypeScript errors | PASS |
| /upload route exists in App.tsx | PASS |
| Sidebar "Upload" link navigates to /upload (via AppLayout navItems) | PASS |
| UploadPage renders drag-and-drop zone | PASS |
| useUploadDocument uploads to Supabase Storage bucket 'documents' | PASS (code verified) |
| useUploadDocument inserts document record with status 'pending' | PASS (code verified) |
| Non-PDF files rejected client-side | PASS (type check in hook + page) |
| Files over 50MB rejected client-side | PASS (size check in hook + page) |
| Key link: UploadPage -> useUploadDocument | PASS |
| Key link: useUploadDocument -> supabase.storage.from('documents').upload() | PASS |
| Key link: useUploadDocument -> supabase.from('documents').insert() | PASS |
| Key link: App.tsx -> UploadPage via /upload route | PASS |

## Next Phase Readiness

Plan 02-01 (upload pipeline) is complete. The /upload page stores PDF files and creates pending document records. Plan 02-02 (processing status + realtime) can now build the Realtime subscription and job queue functions on top of the document records created here.

---
*Phase: 02-upload-pipeline*
*Completed: 2026-02-09*
