# Roadmap: Material Price Intelligence System

**Created:** 2026-02-06
**Milestone:** v1 — Core Price Intelligence
**Depth:** Comprehensive (8 phases)
**Core Value:** Never overpay for materials because you didn't know what you paid last time.

## Phases

### Phase 1: Project Foundation + Database Schema
**Goal:** Supabase project configured with all tables, indexes, extensions, RLS policies, and auth. React app shell running with routing, auth flow, and Supabase client. Nothing visible to end users yet — this is pure infrastructure.

**Requirements:** PLAT-01, PLAT-02, PLAT-04, MAT-02, MAT-03, PRICE-01, PRICE-02
**Success Criteria:**
1. Supabase project has all tables created (organizations, user_profiles, suppliers, material_categories, materials, documents, quotes, line_items) with proper indexes and foreign keys
2. pg_trgm extension enabled and GIN indexes created on material name fields
3. RLS policies enforce row-level security on all tables, prepared for multi-user
4. React app boots with Vite, routes to login/dashboard, authenticates via Supabase Auth
5. Material schema supports structured fields (species, dimensions, grade, treatment, UOM) with category_attributes JSONB column for category-specific extensions (e.g., windows: frame_material, glass_type)
6. Delivery cost and tax fields exist as separate quote-level columns (not embedded in line items)

**Research needed:** No — standard Supabase setup patterns, well-documented
**Status:** Complete (2026-02-06)

---

### Phase 2: File Upload + Storage Pipeline
**Goal:** User can drag-and-drop a PDF into the app and have it stored in Supabase Storage with a pending document record created in the database. No AI extraction yet — just the upload pipeline and async job queue infrastructure.

**Requirements:** INGEST-02, PLAT-03
**Success Criteria:**
1. Drag-and-drop file upload component accepts PDF files
2. Uploaded file stored in Supabase Storage bucket with unique path
3. Document record created in database with status `pending` and storage reference
4. Upload returns immediately to user (async — no blocking)
5. Processing status visible in UI via Supabase Realtime subscription
6. Job queue infrastructure with atomic claim/complete/fail functions for pending documents

**Research needed:** No — standard Supabase Storage + Realtime patterns

---

### Phase 3: AI Quote Extraction
**Goal:** The async processing pipeline picks up pending documents, sends PDFs to Claude for structured extraction, and stores the parsed data. This is the core AI engine — the hardest and highest-risk phase.

**Requirements:** INGEST-01, INGEST-04, INGEST-05, EXTRACT-01, EXTRACT-02, EXTRACT-03, EXTRACT-04
**Success Criteria:**
1. Edge Function receives pending document, retrieves PDF from Storage, sends to Claude as native document block
2. Claude extracts supplier info (name, rep, quote number, date, project) into structured output
3. Claude extracts line items (material description, dimensions, qty, UOM, unit price, discounts, line total) into structured output
4. Claude extracts delivery cost, tax amount, tax rate, subtotal, and grand total
5. Confidence scores assigned per field — low-confidence fields flagged
6. Cross-validation checks: line item × qty = line total, line totals sum to subtotal, subtotal + tax + delivery ≈ grand total
7. Extraction handles both formal PDF table layouts and casual text-style quotes
8. Extracted data written to quotes and quote_line_items tables, document status updated to `extracted`

**Research needed:** YES — need real supplier quote samples to test prompt engineering. Format-specific prompt strategies for tables vs text layouts.

---

### Phase 4: Human Review UI
**Goal:** User sees extracted data in a review interface, can correct any errors, and commits approved data to the database. This is the trust layer — the human-in-the-loop that takes accuracy from 80% to 99.9%.

**Requirements:** INGEST-03, INGEST-04 (UI portion)
**Success Criteria:**
1. Review screen shows all extracted fields in editable form: supplier info, line items, totals
2. Low-confidence fields visually highlighted (yellow/orange) for attention
3. Cross-validation warnings displayed (e.g., "Line totals don't sum to subtotal")
4. User can edit any field, add/remove line items, correct supplier info
5. "Approve" action commits reviewed data as final — status changes to `approved`
6. Side-by-side view: original PDF on left, extracted data on right
7. Dashboard shows documents by status: pending → extracted → approved

**Research needed:** No — standard React form patterns, PDF viewer integration

---

### Phase 5: Material Normalization Engine
**Goal:** When quotes are approved, materials are normalized to canonical entries. "Ipe decking 1.25x6x16" and "Ipe 5/4x6x16 S4S" resolve to the same canonical material. This enables cross-supplier price comparison — the core value proposition.

**Requirements:** MAT-01, MAT-04, MAT-05
**Success Criteria:**
1. AI classifies material descriptions into structured fields: species, nominal dimensions (thickness × width × length), grade, treatment
2. pg_trgm fuzzy matching searches existing canonical materials (similarity threshold ≥ 0.3)
3. When a match is found above threshold, the description is linked as an alias to the existing canonical material
4. When no match is found, a new canonical material is created from the structured fields
5. Material alias table accumulates all description variations seen across quotes
6. Normalization runs automatically when a quote is approved
7. User can manually merge or split canonical materials if the AI got it wrong

**Research needed:** YES — material taxonomy for lumber dimensions, construction material naming conventions, pg_trgm threshold tuning

---

### Phase 6: Price Search + Filtering
**Goal:** User can search for materials and see historical pricing across all quotes and suppliers. Fast, filterable, with links back to original quotes. This is where the system starts delivering daily value.

**Requirements:** SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04, PRICE-03
**Success Criteria:**
1. Search bar with fuzzy text matching finds materials by name (powered by pg_trgm)
2. Filter panel: supplier dropdown, date range picker, project selector, material category
3. Results table shows: material name, supplier, quote date, project, unit price (pre-tax), UOM, link to original quote PDF
4. Results sorted by date (newest first) with option to sort by price
5. Search returns results in under 3 seconds
6. Clicking a result navigates to the full quote detail view
7. Price comparison: when viewing a material, see all historical prices from all suppliers

**Research needed:** No — standard React table + Supabase query patterns

---

### Phase 7: Quote Management + Navigation
**Goal:** Full quote lifecycle management — list all quotes, view details, navigate between quotes and their line items. The operational backbone that makes the system usable day-to-day.

**Requirements:** INGEST-02 (viewing), PLAT-02 (UI completeness)
**Success Criteria:**
1. Quotes list page with sortable columns: supplier, date, project, status, total amount
2. Quote detail page shows all extracted data: supplier info, line items table, totals, delivery, tax
3. Link to view/download original PDF from quote detail
4. Status badges: pending, extracted, approved, rejected
5. Navigation between related entities: quote → line items → material → other quotes for same material
6. Supplier list page showing all suppliers with quote counts

**Research needed:** No — standard CRUD UI patterns

---

### Phase 8: Polish + Integration Readiness
**Goal:** Final quality pass — responsive design, error handling, loading states, empty states, and architectural preparation for the Ross Built Intelligence Platform integration. System is production-ready for Greg's daily use.

**Requirements:** PLAT-02 (polish), PLAT-03 (edge cases)
**Success Criteria:**
1. All pages responsive on desktop and tablet (primary use at desk)
2. Loading skeletons on all data-fetching views
3. Empty states with helpful messaging ("No quotes yet — upload your first PDF")
4. Error boundaries with user-friendly error messages and retry options
5. Toast notifications for async operations (upload complete, extraction done, approval confirmed)
6. Environment configuration ready for integration into larger Supabase project
7. README with setup instructions, architecture overview, and deployment guide

**Research needed:** No — standard React polish patterns

---

## Requirement Coverage

| Requirement | Phase | Description |
|-------------|-------|-------------|
| PLAT-01 | 1 | Auth via Supabase Auth |
| PLAT-02 | 1, 7, 8 | React + Supabase platform patterns |
| PLAT-04 | 1 | RLS policies for multi-user |
| MAT-02 | 1 | Structured material fields in schema |
| MAT-03 | 1 | Extensible category schema (JSONB) |
| PRICE-01 | 1 | Delivery cost as separate field |
| PRICE-02 | 1 | Tax amount and rate as separate fields |
| INGEST-02 | 2, 7 | Original file stored, linked, viewable |
| PLAT-03 | 2, 8 | Async processing + Realtime status |
| INGEST-01 | 3 | Drag-drop PDF → AI extraction |
| INGEST-04 | 3, 4 | Confidence scoring + UI flagging |
| INGEST-05 | 3 | Cross-validation of totals |
| EXTRACT-01 | 3 | Supplier info extraction |
| EXTRACT-02 | 3 | Line item extraction |
| EXTRACT-03 | 3 | Delivery, tax, totals extraction |
| EXTRACT-04 | 3 | Varied format handling |
| INGEST-03 | 4 | Human review before commit |
| MAT-01 | 5 | AI material normalization |
| MAT-04 | 5 | pg_trgm fuzzy matching |
| MAT-05 | 5 | Alias linking |
| SEARCH-01 | 6 | Fuzzy text search |
| SEARCH-02 | 6 | Multi-filter search |
| SEARCH-03 | 6 | Rich result display |
| SEARCH-04 | 6 | Sub-3-second results |
| PRICE-03 | 6 | Pre-tax price comparisons |

**Coverage: 25/25 v1 requirements mapped (100%)**

## Phase Ordering Rationale

```
Phase 1 (Schema) ──→ Phase 2 (Upload) ──→ Phase 3 (AI Extraction) ──→ Phase 4 (Review UI)
                                                                            │
                                                                            ▼
Phase 8 (Polish) ◄── Phase 7 (Quote Mgmt) ◄── Phase 6 (Search) ◄── Phase 5 (Normalization)
```

- **Schema before upload** (1→2): Tables must exist before data can be stored
- **Upload before extraction** (2→3): Files must be in Storage before Claude can process them
- **Extraction before review** (3→4): Can't review what hasn't been extracted
- **Review before normalization** (4→5): Normalize from approved (corrected) data, not raw extraction
- **Normalization before search** (5→6): Cross-supplier comparison requires canonical material identity
- **Search before quote management** (6→7): Search delivers core value; quote management is navigation convenience
- **Everything before polish** (→8): Polish what exists, don't polish what might change

## Research Flags

| Phase | Research Needed | Reason |
|-------|----------------|--------|
| 3 | YES | Real supplier quote samples needed. Prompt engineering for varied formats is highest-risk work. |
| 5 | YES | Material taxonomy for lumber, pg_trgm threshold tuning, construction naming conventions |
| 1, 2, 4, 6, 7, 8 | No | Standard, well-documented patterns |

---
*Roadmap created: 2026-02-06*
*Last updated: 2026-02-06*
