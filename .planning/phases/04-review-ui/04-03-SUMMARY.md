---
phase: 04-review-ui
plan: 03
subsystem: review-integration
tags: [react, pages, pdf-viewer, review-workflow, dashboard, status-overview, supabase-realtime]
dependency-graph:
  requires: [04-01, 04-02]
  provides: [side-by-side-review-page, dashboard-status-overview, complete-review-workflow]
  affects: [05-material-normalization, 07-quote-management]
tech-stack:
  added: []
  patterns: [side-by-side-pdf-review, sticky-pdf-container, conditional-layout-by-status, status-count-queries, needs-attention-section]
key-files:
  created: []
  modified:
    - material-price-intel/src/pages/QuoteDetailPage.tsx
    - material-price-intel/src/pages/DashboardPage.tsx
decisions:
  - id: recentuploads-already-updated
    choice: RecentUploads approved status badge was already added in 04-01
    why: Plan 04-01 auto-fixed RecentUploads statusConfig as a blocking deviation when the approved type was added to DocumentStatus
metrics:
  duration: ~5 minutes
  completed: 2026-02-09
---

# Phase 4 Plan 3: Page Integration + Review Workflow Summary

**One-liner:** Side-by-side PDF + ReviewForm on QuoteDetailPage for unverified quotes, Dashboard status overview with document counts and needs-attention section

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-02-09
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

### 1. QuoteDetailPage: Side-by-Side Review Mode (Task 1)

Extended the existing QuoteDetailPage with a conditional layout based on `quote.is_verified`:

**Review mode (unverified quotes):**
- Two-column layout: PDF iframe on left (50% width, sticky) + review form on right (50% width)
- PDF container uses `position: sticky; top: 1rem` so the original document stays visible while scrolling the form
- ValidationWarnings rendered above ReviewForm showing extraction warnings from `raw_extraction`
- ReviewForm renders LineItemsEditor internally (no direct LineItemsEditor import for rendering)
- "Save Changes" wired to `useUpdateQuoteReview` mutation
- "Approve Quote" wired to `useApproveQuote` mutation
- ConfidenceBadge component replaces the old inline confidence display
- Editable line items initialized from fetched data with confidence scores from `raw_extraction`

**Approved mode (verified quotes):**
- Existing read-only layout preserved entirely
- Green "Approved" badge added in header area
- "View PDF" button retained for approved quotes

### 2. DashboardPage: Status Overview (Task 2)

Replaced the placeholder dashboard with a functional status overview:

- **Status count cards** in a responsive 3-column grid (3 desktop, 2 tablet, 1 mobile)
  - Six cards: Pending, Processing, Needs Review, Completed, Approved, Failed
  - Each shows count (large, bold) with colored icon matching RecentUploads palette
  - "Needs Review" card gets amber border highlight when count > 0
- **Needs Attention section** listing up to 5 documents with `review_needed` status
  - Each row shows document name, date, and a "Review" button linking to `/quotes/{quote_id}`
  - Shows "All caught up!" message when no documents need review
- **Upload Quote button** now uses react-router `Link` to navigate to `/upload`
- Status counts fetched via React Query with `exact` count queries per status

### 3. Human Verification Checkpoint (Task 3)

Full end-to-end review workflow verified and approved by user:
- Upload PDF -> auto-extraction via pg_net trigger -> status tracking -> side-by-side review -> edit fields -> approve -> read-only approved view
- Dashboard status counts reflect document lifecycle
- RecentUploads shows approved badge with emerald styling

## Task Commits

| Hash | Message |
|------|---------|
| 001e544 | feat(04-03): extend QuoteDetailPage with side-by-side PDF + review form |
| 38921e4 | feat(04-03): enhance Dashboard with status overview and needs-attention section |

## Files Modified

- **material-price-intel/src/pages/QuoteDetailPage.tsx** (335 lines) -- Side-by-side review layout, save/approve actions, conditional rendering by verification status
- **material-price-intel/src/pages/DashboardPage.tsx** (230 lines) -- Status count cards grid, needs-attention document list, upload navigation link

## Deviations from Plan

### Minor Scope Adjustment

**1. RecentUploads already updated in 04-01**

- **Plan expected:** Task 2 to add `approved` status badge and navigation to RecentUploads.tsx
- **Reality:** Plan 04-01 already added the approved status badge (`bg-emerald-100 text-emerald-800`) and `approved` to the hasQuote navigation condition as a blocking auto-fix (Rule 3) when it added the approved type to DocumentStatus
- **Impact:** No work needed on RecentUploads.tsx in this plan. Task 2 commit note documents this.
- **Files affected:** None (already correct)

## Decisions Made

| Decision | Context |
|----------|---------|
| RecentUploads already updated in 04-01 | Plan 04-01 auto-fixed the statusConfig map and hasQuote condition when adding 'approved' to DocumentStatus type |

## Phase 4 Complete

With all three plans executed, Phase 4 (Human Review UI) is fully complete:

| Plan | Name | Status |
|------|------|--------|
| 04-01 | Database Trigger + Review Infrastructure | Complete |
| 04-02 | Review Form Components | Complete |
| 04-03 | Page Integration + Review Workflow | Complete |

**Phase 4 delivers the full human review workflow:**
1. pg_net database trigger auto-fires extraction on document upload (04-01)
2. approve_quote and update_quote_review RPCs with org ownership checks (04-01)
3. ConfidenceBadge, ValidationWarnings, ReviewForm, LineItemsEditor components (04-02)
4. Side-by-side PDF + review form on QuoteDetailPage (04-03)
5. Dashboard status overview with document counts and needs-attention section (04-03)

**Requirements covered:** INGEST-03 (human review before commit), INGEST-04 UI portion (confidence flagging in review UI)

## Next Phase Readiness

Phase 5 (Material Normalization Engine) can now build on approved quotes:
- The `approved` status reliably indicates human-verified data
- Line items in approved quotes have corrected descriptions, quantities, and prices
- The normalization engine should trigger when quotes are approved (hook into the approve_quote flow)
- Dashboard can be extended with material normalization status in future phases

---
*Phase: 04-review-ui*
*Completed: 2026-02-09*
