---
phase: 10
plan: 07
subsystem: estimating-procurement
tags: [selection-sheet, print, client-facing, project-detail]
depends_on:
  requires: ["10-01", "10-03"]
  provides: ["Printable client-facing selection sheet"]
  affects: ["10-08"]
tech-stack:
  added: []
  patterns: ["@media print CSS", "no-print class for print exclusion"]
key-files:
  created:
    - material-price-intel/src/components/projects/SelectionSheet.tsx
  modified:
    - material-price-intel/src/pages/ProjectDetailPage.tsx
    - material-price-intel/src/components/layout/AppLayout.tsx
    - material-price-intel/src/index.css
decisions:
  - id: "10-07-01"
    description: "no-print CSS class pattern for hiding app chrome during print"
  - id: "10-07-02"
    description: "Selection Sheet as 4th tab rather than separate route"
  - id: "10-07-03"
    description: "Pricing toggle defaults to true (shown); checkbox in toolbar"
metrics:
  duration: "~4 minutes"
  completed: "2026-02-11"
---

# Phase 10 Plan 07: Client-Facing Selection Sheet Summary

Print-ready material selection sheet rendered as a 4th tab on ProjectDetailPage, with @media print CSS to strip app chrome and produce clean client-facing documents.

## What Was Built

### SelectionSheet Component (276 lines)
- Professional document layout: company header, project info (name, client, address, date, sqft)
- Room-by-room selection tables sorted by sort_order
- Columns: Item, Material, Supplier, Qty, Unit, Unit Price, Total, Status
- Upgrade/downgrade status with signed dollar amounts (e.g., "Upgrade (+$2,500)")
- Room subtotals per table
- Summary section: total allowances, total selections cost, net upgrade/savings
- Disclaimer text for estimate volatility
- Signature lines for client and builder approval
- Pricing toggle hides dollar columns and status amounts for early-stage reviews
- Loading state with spinner while data fetches

### ProjectDetailPage Integration
- Added "Selection Sheet" as 4th tab with Printer icon
- Toolbar above sheet: Print button (window.print()), Show Pricing checkbox, date label
- Toolbar hidden in print mode via no-print class
- Sheet rendered inside white card container

### Print CSS (index.css)
- `.no-print { display: none !important; }` in @media print
- White background, black text, exact color reproduction
- `main { padding: 0 }` for full-width print
- 11px body font, 16px/13px header fonts for selection sheet
- `break-inside: avoid` on room sections to prevent page splits
- Table border collapse with 1px solid borders
- 0.75in page margins

### AppLayout Update
- Added `no-print` class to sidebar `<aside>` element
- Sidebar completely hidden during print for clean output

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 10-07-01 | no-print CSS class pattern | Simple, reusable approach -- any element marked no-print disappears in print preview |
| 10-07-02 | Selection Sheet as 4th tab (not separate route) | Keeps all project context together; toolbar with print/toggle is convenient inline |
| 10-07-03 | Pricing toggle defaults to shown | Most common use case is sharing selections with prices; early-stage can toggle off |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- [x] `npx tsc --noEmit` passes
- [x] SelectionSheet renders all rooms with selections in table format
- [x] Pricing toggle hides/shows dollar columns
- [x] Print mode hides sidebar, header, tabs, toolbar via no-print class
- [x] Room sections use break-inside: avoid for clean page breaks
- [x] Upgrade/downgrade status shows with dollar amounts
- [x] Selection Sheet tab visible on ProjectDetailPage
- [x] Signature lines at bottom for client approval
- [x] Existing tabs unaffected

## Commits

| Hash | Type | Description |
|------|------|-------------|
| aae4073 | feat | Create SelectionSheet component with print-ready layout |
| c5cd7c9 | feat | Integrate SelectionSheet tab with print support |
