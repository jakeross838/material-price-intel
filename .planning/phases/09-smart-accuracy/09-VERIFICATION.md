---
phase: 09-smart-accuracy
verified: 2026-02-11T16:00:00Z
status: passed
score: 16/16 must-haves verified
---

# Phase 9: Smart Quote Accuracy Engine Verification Report

**Phase Goal:** Achieve near-100% extraction accuracy by teaching the AI to classify line item types (material vs discount vs surcharge vs fee), properly attribute discounts to the correct materials, handle edge cases like bundle pricing, volume tiers, minimum order charges, and ambiguous units. The system must produce clean, accurate per-unit prices suitable for reliable cross-supplier comparison.

**Verified:** 2026-02-11T16:00:00Z
**Status:** PASSED
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | line_type column with CHECK constraint for 5 values | VERIFIED | Migration 010 line 7-8: CHECK for material, discount, fee, subtotal_line, note |
| 2 | effective_unit_price column alongside raw unit_price | VERIFIED | Migration 010 line 11: NUMERIC(12,4). LineItem type line 142 |
| 3 | applies_to_line_item_id self-referencing FK | VERIFIED | Migration 010 line 14: UUID REFERENCES line_items(id) ON DELETE SET NULL |
| 4 | quote_discount_pct and quote_discount_amount on quotes | VERIFIED | Migration 010 lines 17-18. Quote type lines 118-119. RPC params lines 49-50 |
| 5 | AI prompt classification rules for all 5 line types | VERIFIED | prompt.ts lines 82-103: Full rules with real-world examples |
| 6 | AI prompt discount attribution rules | VERIFIED | prompt.ts lines 104-114: 4 scenarios |
| 7 | Validation line type consistency and adjusted subtotal | VERIFIED | validation.ts lines 179-253: Section 5 (5a-5e) and Section 6 |
| 8 | Persistence saves line_type, effective_unit_price, applies_to | VERIFIED | process-document/index.ts lines 173-265: All fields + Pass 2 |
| 9 | Persistence computes 3-stage discount cascade | VERIFIED | index.ts lines 191-230: per-item, targeted, quote-wide. Floored at 0 |
| 10 | Normalization filters to material only | VERIFIED | normalize-materials/index.ts line 341: .eq(line_type, material) |
| 11 | Backfill migration reclassifies existing data | VERIFIED | Migration 011 (122 lines): 6 sections with conservative pattern matching |
| 12 | Review UI has line_type dropdown | VERIFIED | LineItemsEditor.tsx lines 167-189: select with 5 options, color-coded rows |
| 13 | ReviewForm sends line_type and effective_unit_price | VERIFIED | ReviewForm.tsx lines 128-141: gatherFormData includes both fields |
| 14 | QuoteDetailPage shows line type badges and effective prices | VERIFIED | LineTypeBadge component, Type/Eff. Price columns, opacity-60 dimming |
| 15 | SearchPage filters material type, uses effective_unit_price | VERIFIED | SearchPage.tsx line 87: .eq filter. Stats/sorting/display use effective price |
| 16 | ReportsPage/hooks use effective_unit_price | VERIFIED | useReportsData line 41: .eq filter. ReportsPage + charts use effectiveUnitPrice |

**Score:** 16/16 truths verified

### Required Artifacts

| Artifact | Lines | Status | Details |
|----------|-------|--------|---------|
| supabase/migrations/010_line_type_and_effective_price.sql | 116 | VERIFIED | Columns, constraints, index, backfill, RPC update |
| supabase/migrations/011_backfill_line_types.sql | 122 | VERIFIED | 6 sections: reclassify, effective price, unlinking |
| supabase/functions/process-document/types.ts | 60 | VERIFIED | LineItemType, discount_applies_to, is_credit, pricing_flag |
| supabase/functions/process-document/prompt.ts | 178 | VERIFIED | Classification, attribution, edge cases, Rules 11-12 |
| supabase/functions/process-document/validation.ts | 271 | VERIFIED | Sections 5a-5e and section 6 added |
| supabase/functions/process-document/index.ts | 535 | VERIFIED | 3-stage cascade, two-pass INSERT+UPDATE |
| supabase/functions/normalize-materials/index.ts | 481 | VERIFIED | .eq(line_type, material) server-side filter |
| src/lib/types.ts | 273 | VERIFIED | LineItemType, LineItem/Quote/Database types updated |
| src/components/review/LineItemsEditor.tsx | 276 | VERIFIED | Dropdown, color rows, effective price recomputation |
| src/components/review/ReviewForm.tsx | 388 | VERIFIED | gatherFormData with line_type and effective_unit_price |
| src/hooks/useQuoteReview.ts | 101 | VERIFIED | QuoteReviewUpdate type with both fields |
| src/pages/QuoteDetailPage.tsx | 397 | VERIFIED | LineTypeBadge, Type/Eff. Price columns, dimming |
| src/pages/SearchPage.tsx | 492 | VERIFIED | Material-only filter, effective price everywhere |
| src/hooks/useReportsData.ts | 127 | VERIFIED | Material-only filter, effectiveUnitPrice with fallback |
| src/pages/ReportsPage.tsx | 463 | VERIFIED | All 4 stat computations use effectiveUnitPrice |
| src/components/reports/PriceTrendChart.tsx | -- | VERIFIED | d.effectiveUnitPrice at line 154 |
| src/components/reports/CategoryAggregateChart.tsx | -- | VERIFIED | d.effectiveUnitPrice at line 162 |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| AI Prompt (prompt.ts) | Extraction Types (types.ts) | LineItemType, discount_applies_to | WIRED |
| Extraction Types | Persistence (index.ts) | ExtractionResult import | WIRED |
| Persistence (index.ts) | Database (migration 010) | columns in INSERT | WIRED |
| Validation (validation.ts) | Extraction Types | Sections 5-6 check line_type | WIRED |
| LineItemsEditor.tsx | types.ts | LineItemType import | WIRED |
| ReviewForm.tsx | useQuoteReview.ts | QuoteReviewUpdate type | WIRED |
| useQuoteReview.ts | Database RPC | update_quote_review with p_line_items | WIRED |
| SearchPage.tsx | Database | .eq(line_type, material) filter | WIRED |
| useReportsData.ts | Database | .eq(line_type, material) filter | WIRED |
| ReportsPage + Charts | useReportsData.ts | effectiveUnitPrice field | WIRED |
| Normalization | Database | .eq(line_type, material) filter | WIRED |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| ACCURACY-01 (line item classification) | SATISFIED | 5-value line_type across entire stack |
| ACCURACY-02 (discount attribution) | SATISFIED | applies_to FK, attribution rules, two-pass persistence, 3-stage cascade |
| ACCURACY-03 (edge case handling) | SATISFIED | 7 edge cases in prompt |
| ACCURACY-04 (unit price normalization) | SATISFIED | effective_unit_price alongside raw, backfill, all UI uses effective price |

### Anti-Patterns Found

No anti-patterns detected. TypeScript compiles with zero errors (npx tsc --noEmit). No TODO/FIXME/PLACEHOLDER comments in any Phase 9 files.

### Human Verification Required

#### 1. AI Classification Accuracy on Real Quotes

**Test:** Upload a real supplier quote PDF containing discounts, fees, subtotals, and notes.
**Expected:** Each line type correctly classified with proper discount_applies_to indexing.
**Why human:** AI extraction quality depends on real-world PDF content.

#### 2. Effective Price Cascade Accuracy

**Test:** Upload a quote with per-item discounts, targeted discount lines, and a quote-wide discount.
**Expected:** effective_unit_price reflects all three cascade stages in correct order.
**Why human:** Requires real multi-level discount data.

#### 3. Review UI Reclassification Flow

**Test:** Change a material line to discount and back in the review UI.
**Expected:** Dropdown colors change, row backgrounds change, effective_unit_price recalculates.
**Why human:** Visual and interactive behavior requires browser testing.

#### 4. Backfill Migration on Existing Data

**Test:** Run migration 011 against a database with existing line items.
**Expected:** Conservative reclassification, ambiguous items stay as material, effective prices computed.
**Why human:** Depends on actual data patterns in the database.

### Gaps Summary

No gaps found. All 16 must-haves verified as fully implemented, substantive, and correctly wired:

1. **Schema layer:** Migrations 010 and 011 add all columns with proper constraints and backfill existing data.
2. **AI extraction layer:** Prompt includes classification, attribution, and edge case rules. Validation adds sections 5-6.
3. **Persistence layer:** 3-stage discount cascade, two-pass INSERT+UPDATE, quote-level discounts.
4. **Normalization layer:** Filters to material-only items server-side.
5. **Frontend layer:** Review UI dropdown, QuoteDetailPage badges, SearchPage and ReportsPage use effective prices.
6. **Type safety:** TypeScript compiles clean across all updated types.

---

_Verified: 2026-02-11T16:00:00Z_
_Verifier: Claude (gsd-verifier)_
