---
phase: 04-review-ui
plan: 02
subsystem: review-components
tags: [react, hooks, forms, shadcn, tanstack-query, review-ui]
dependency-graph:
  requires: [04-01]
  provides: [useApproveQuote, useUpdateQuoteReview, ConfidenceBadge, ValidationWarnings, ReviewForm, LineItemsEditor, EditableLineItem]
  affects: [04-03]
tech-stack:
  added: []
  patterns: [react-query-mutations, controlled-form-state, internal-component-composition]
key-files:
  created:
    - material-price-intel/src/hooks/useQuoteReview.ts
    - material-price-intel/src/components/review/ConfidenceBadge.tsx
    - material-price-intel/src/components/review/ValidationWarnings.tsx
    - material-price-intel/src/components/review/ReviewForm.tsx
    - material-price-intel/src/components/review/LineItemsEditor.tsx
  modified:
    - material-price-intel/src/lib/types.ts
decisions:
  - id: rpc-function-types
    choice: Added approve_quote and update_quote_review to Database.Functions type
    why: Supabase client rpc() method is typed from Database["public"]["Functions"], which was previously [_ in never] causing TS2345 compile errors
metrics:
  duration: ~8 minutes
  completed: 2026-02-09
---

# Phase 4 Plan 2: Review Form Components Summary

**One-liner:** React Query mutation hooks for approve/save RPCs plus four review UI components (ConfidenceBadge, ValidationWarnings, ReviewForm with internally-rendered LineItemsEditor)

## What Was Built

### 1. Quote Review Hooks (`useQuoteReview.ts`)

Two React Query `useMutation` hooks that interact with the Supabase RPCs created in 04-01:

- **`useApproveQuote`** -- Calls `approve_quote` RPC with a quote ID. On success, invalidates `["quote", id]` and `["documents", "recent"]` query keys so the UI re-fetches fresh data.
- **`useUpdateQuoteReview`** -- Calls `update_quote_review` RPC with all editable quote fields and a serialized line items array. On success, invalidates `["quote", id]` and `["line_items", id]`. No `supplier_name` parameter (removed per checker review in 04-01).

Exported `QuoteReviewUpdate` type provides the shape for save payloads.

### 2. ConfidenceBadge (`ConfidenceBadge.tsx`)

Reusable colored pill badge:
- Green (>=80%), Amber (60-79%), Red (<60%)
- Two sizes: `sm` (inline) and `md` (header)
- Returns null for null scores

### 3. ValidationWarnings (`ValidationWarnings.tsx`)

Collapsible alert box for extraction validation warnings:
- Amber/yellow styling with AlertTriangle icon
- Shows warning count in collapsed header
- Expands to list each warning with check name, message, and expected/actual values
- Returns null when no warnings

### 4. ReviewForm (`ReviewForm.tsx`)

Full review interface with four card sections:
1. **Quote Details** -- Editable inputs for quote_number, quote_date, project_name, payment_terms, valid_until, notes
2. **Supplier Info** -- Read-only display of supplier name, contact, phone, email, address
3. **Line Items** -- Renders LineItemsEditor internally (not as sibling)
4. **Totals** -- Editable number inputs for subtotal, delivery_cost, tax_amount, tax_rate, total_amount

Action buttons: "Save Changes" (outline) and "Approve Quote" (green primary). Both show loading spinners during async operations. Low-confidence quotes get amber left border on details and totals sections.

### 5. LineItemsEditor (`LineItemsEditor.tsx`)

Editable line items table:
- Columns: #, Description (wide), Qty, Unit, Unit Price, Line Total, Actions (delete)
- Add Line Item button creates new empty row with `crypto.randomUUID()` ID
- Delete button (Trash2 icon) removes row
- Low-confidence items (<0.7) get amber background tint
- Number inputs are right-aligned with tabular-nums

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added RPC function types to Database type**

- **Found during:** Task 1
- **Issue:** `Database["public"]["Functions"]` was typed as `[_ in never]: never`, causing TypeScript error TS2345 when calling `supabase.rpc("approve_quote")` or `supabase.rpc("update_quote_review")`
- **Fix:** Added `approve_quote` and `update_quote_review` function type declarations to the `Functions` section of the `Database` type in `types.ts`
- **Files modified:** `material-price-intel/src/lib/types.ts`
- **Commit:** 2dc78b6

## Decisions Made

| Decision | Context |
|----------|---------|
| Added RPC function types to Database.Functions | Supabase JS client rpc() is typed from Database schema; without function declarations, TypeScript rejects any rpc() call |

## Commit Log

| Hash | Message |
|------|---------|
| 2dc78b6 | feat(04-02): create quote review hooks (useApproveQuote, useUpdateQuoteReview) |
| 881b5ae | feat(04-02): create ConfidenceBadge and ValidationWarnings components |
| e64643f | feat(04-02): create ReviewForm and LineItemsEditor components |

## Next Phase Readiness

Plan 04-03 can now integrate these components into QuoteDetailPage:
- Import `ReviewForm` and pass it the quote, line items, and hook callbacks
- Import `ConfidenceBadge` and `ValidationWarnings` for the header area
- The `EditableLineItem` type is exported from LineItemsEditor for state management
- `QuoteReviewUpdate` type is exported from useQuoteReview for type-safe save payloads
