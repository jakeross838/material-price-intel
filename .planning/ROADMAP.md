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
**Status:** Complete (2026-02-09)

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
8. Extracted data written to quotes and line_items tables, document status updated to `completed` (high confidence) or `review_needed` (low confidence)

**Research needed:** YES — need real supplier quote samples to test prompt engineering. Format-specific prompt strategies for tables vs text layouts.
**Status:** Complete (2026-02-09)

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
**Status:** Complete (2026-02-09)

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

### Phase 8: Reports & Price Analytics Dashboard
**Goal:** Interactive reports page with live charts showing price fluctuations over time. Users can compare material prices across suppliers/distributors, drill into specific materials or categories (lumber, windows, etc.), and see multiple supplier lines on the same chart. This is where historical pricing data becomes visually actionable — the difference between knowing a price and *seeing* a price trend.

**Requirements:** ANALYTICS-01 (supplier comparison), ANALYTICS-02 (price trends), ANALYTICS-04 (dashboard stats)
**Success Criteria:**
1. Reports page with interactive line charts showing material unit prices over time (x-axis: quote date, y-axis: unit price)
2. Multiple supplier/distributor lines on the same chart — different colors per supplier for direct visual comparison
3. Filter by material category (Lumber, Windows, etc.), specific canonical material, supplier/company, and date range
4. Category-level aggregate view (e.g., "average lumber price over time" across all lumber materials)
5. Summary stat cards: average price, price trend direction (up/down/flat), best supplier, quote count
6. Clicking a data point on a chart links back to the original quote
7. Chart library renders smoothly with existing data volume (Recharts or similar lightweight React chart lib)

**Research needed:** No — standard React charting patterns (Recharts is well-documented)

---

### Phase 9: Smart Quote Accuracy Engine
**Goal:** Achieve near-100% extraction accuracy by teaching the AI to classify line item types (material vs discount vs surcharge vs fee), properly attribute discounts to the correct materials, handle edge cases like bundle pricing, volume tiers, minimum order charges, and ambiguous units. The system must produce clean, accurate per-unit prices suitable for reliable cross-supplier comparison — the foundation of the app's value.

**Requirements:** ACCURACY-01 (line item classification), ACCURACY-02 (discount attribution), ACCURACY-03 (edge case handling), ACCURACY-04 (unit price normalization)
**Success Criteria:**
1. AI classifies each line item with a `line_type` field: `material`, `discount`, `fee`, `subtotal_line`, `note` — only `material` items get normalized and priced
2. Discount lines are attributed to the correct material(s): per-item discounts reduce that item's effective unit price; quote-wide discounts are distributed proportionally or stored as quote-level adjustments
3. The system stores both raw (pre-discount) and effective (post-discount) unit prices, so users can see both what was quoted and what they actually paid
4. Edge cases handled: minimum order surcharges, fuel/delivery surcharges masquerading as line items, credit/return lines (negative amounts), "call for pricing" items (flagged, not guessed)
5. Validation catches impossible prices (e.g., $0.00 unit price on a material, negative quantities without credit context) and flags them for review
6. Review UI shows line item classifications and lets users reclassify if AI got it wrong
7. Existing data migration: re-classify already-imported line items with the new type system without losing any data

**Research needed:** YES — need real supplier quote samples with discounts, surcharges, bundle pricing to test classification rules. Advantage Lumber discount line is the first known case.
**Status:** Complete (2026-02-11)

---

### Phase 10: Project Estimating & Procurement
**Goal:** Transform the price intelligence system into a full estimating and procurement tool for custom home building. A builder can create a project, define rooms/areas, assign material selections (with client allowances and upgrades), generate estimates from historical pricing data, track buying out (actual POs against estimates), and see real-time budget vs actual variance across the entire home. Designed for large Florida custom homes with hundreds of selections across dozens of categories.

**Requirements:** EST-01 (project/room structure), EST-02 (selection management with allowances), EST-03 (estimate generation from price history), EST-04 (procurement/buyout tracking), EST-05 (budget vs actual variance), EST-06 (selection sheets for client review)
**Success Criteria:**
1. Projects page: create a project with name, address, sqft, client info, and target budget
2. Room/area structure: define rooms (Master Bath, Kitchen, Great Room, etc.) with material category assignments
3. Selection management: for each room+category, define allowance amount, selected material, selected supplier, actual cost, and upgrade/downgrade status
4. Estimate builder: pull historical average prices from the price database to auto-populate estimates — "based on your last 6 quotes, 2x4 SPF averages $4.35/pc from 84 Lumber"
5. Buyout tracking: link actual supplier quotes to project selections, marking items as "quoted", "ordered", "received" — turning quotes into purchase commitments
6. Budget vs actual dashboard: per-room and per-category variance (budgeted $45K for windows, actual $52K, +$7K variance), with project-wide rollup
7. Selection sheet export: generate a printable/PDF selection summary showing all rooms, selected materials, suppliers, and prices for client review meetings

**Research needed:** YES — need to understand the typical custom home selection workflow, allowance structures, how builders track buyouts in practice, and what the competitive tools (BuilderTrend, CoConstruct, Builderpad) do vs don't do well.
**Status:** Complete (2026-02-11)

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

## Milestone v4 — Dream Home Designer & Platform Intelligence

**Created:** 2026-02-13
**Depth:** Comprehensive (6 phases)
**Core Value:** Turn the simple cost estimator into a full Dream Home Designer — a 20-30 minute guided experience where customers walk room-by-room selecting materials, seeing AI-generated room renders, and getting real builder pricing. Internally, add intelligence metrics (install times, duration predictions) and two-way sync so public selections flow into the procurement pipeline.

### Phase 11: Material Catalog & Visual Library
**Goal:** Build a browseable material catalog with product images, spec sheets, and installation guides. This is the visual foundation everything else depends on — you can't pick materials in a room-by-room flow without seeing what they look like. Integrates with the existing product_data tables and extends them with room-category mappings.

**Requirements:** CATALOG-01, CATALOG-02, CATALOG-03, CATALOG-04
**Success Criteria:**
1. Materials have product images (uploaded or scraped) displayed as visual cards with name, price range, and key specs
2. Spec sheets and installation guides linked to materials, viewable inline or downloadable
3. Materials tagged with room-appropriate categories (e.g., "Kitchen: countertops, cabinets, backsplash, flooring, fixtures")
4. Category-to-room mapping table so the selection flow knows which categories to show per room type
5. Image gallery per material showing multiple angles/options
6. Integration with existing product_data hub (URL scraping, category-aware specs)
7. Public-facing catalog endpoint (no auth required) for the estimator to consume

**Research needed:** YES — need to understand image sourcing (supplier catalogs, manufacturer sites, manual upload), optimal image sizes for the selection UX, and how to map construction material categories to residential rooms.
**Status:** Not started

---

### Phase 12: Dream Home Designer — Room-by-Room Selection
**Goal:** Replace the simple 4-step estimator with a comprehensive room-by-room material selection experience. Customers define their rooms, then walk through each room selecting materials category-by-category with visual previews and real-time pricing. This is the core 20-30 minute guided experience — Linear-style UX where each choice is a focused decision.

**Requirements:** DREAM-01, DREAM-02, DREAM-03, DREAM-04, DREAM-05, DREAM-06, DREAM-07
**Success Criteria:**
1. Room definition step: user picks which rooms their home has (Master Bath, Kitchen, Great Room, etc.) with room templates
2. Per-room selection flow: for each room, walk through relevant categories (flooring → baseboards → trim → paint → fixtures → etc.)
3. Linear-style selection UX: one decision at a time, focused card interface, not an overwhelming grid
4. Material picker shows visual cards with images, price range, key specs from the catalog (Phase 11)
5. Running cost total in a persistent sidebar/header — updates in real-time as selections are made
6. Save/resume capability — users can leave and come back, progress is persisted
7. Progress indicator shows which rooms are complete and which categories remain
8. Responsive design works on tablet (common at showrooms) and desktop
9. Selections stored in a structure compatible with the internal project system for future sync

**Research needed:** YES — need UX research on Linear/Notion-style progressive disclosure patterns for construction material selection. Study how BuilderPad, Buildxact, and CoConstruct handle selection sheets.
**Status:** Not started

---

### Phase 13: AI Room Visualization
**Goal:** Generate AI images for each room based on the customer's material selections, giving them a visual preview of what their space will look like. This is the "wow factor" that differentiates the Dream Home Designer from a spreadsheet.

**Requirements:** RENDER-01, RENDER-02, RENDER-03, RENDER-04
**Success Criteria:**
1. After completing selections for a room, user can generate an AI render showing the room with their chosen materials
2. AI prompt constructed from: room type, selected materials (flooring, countertops, paint color, fixtures), and style preference
3. Style-aware generation: user picks a style (modern, coastal, farmhouse, transitional) that influences the render
4. Gallery view showing all room renders side-by-side for the complete home vision
5. Renders stored and linked to the selection set — regenerate if selections change
6. Image generation uses a reliable API (DALL-E, Stability AI, or similar) with appropriate quality/cost balance
7. Loading states and fallback for when generation takes time

**Research needed:** YES — need to evaluate AI image generation APIs (DALL-E 3, Stability AI SDXL, Midjourney API), cost per image, quality for interior design renders, and prompt engineering for material-specific room visualization.
**Status:** Not started

---

### Phase 14: Public Project Dashboard
**Goal:** Give customers the same rich project view that exists in the internal Material Price Intel app. After completing their Dream Home Designer selections, customers see a full project dashboard with selections by room, budget breakdown, AI renders gallery, spec sheets, and a printable selection summary. This duplicates the internal ProjectDetailPage experience for public access.

**Requirements:** PUBLIC-01, PUBLIC-02, PUBLIC-03, PUBLIC-04, PUBLIC-05
**Success Criteria:**
1. Public project view (no auth) accessible via unique link — shows all selections organized by room
2. Budget breakdown with per-room and per-category totals, matching internal project dashboard style
3. AI renders gallery showing all generated room visualizations
4. Per-selection detail: material name, image, price, spec sheet link, installation guide
5. Print-friendly selection sheet (reuses/adapts the internal selection sheet component)
6. Mobile-responsive — customers will share this link on phones
7. Optional: PDF export of the full project summary for email/offline review

**Research needed:** No — mirrors existing internal components (ProjectDetailPage, SelectionSheet). Main work is adapting for public access and unauthenticated data fetching.
**Status:** Not started

---

### Phase 15: Savings Advisor & Performance Metrics
**Goal:** Add a savings calculator showing customers how much builder pricing saves vs retail, display social proof ("Ross Built has saved customers $X"), and internally track installation time metrics from historical data to predict project timelines and durations per material category.

**Requirements:** SAVINGS-01, SAVINGS-02, METRICS-01, METRICS-02, METRICS-03
**Success Criteria:**
1. Savings calculator: for each selection, show builder price vs estimated retail price with dollar savings
2. Aggregate savings displayed prominently: "Your selections save $X,XXX vs retail pricing"
3. Social proof banner: "Ross Built has saved customers over $X in material costs" (aggregated from all leads/projects)
4. Internal metrics dashboard: installation time tracking per material category from project data logs
5. Duration estimates: "Hardwood flooring: 3-5 days for 2,500 sqft" based on historical install data
6. Project timeline prediction: estimated total build duration based on selected materials and scope
7. Metrics data entry: simple log for tracking actual install start/end times per category per project

**Research needed:** YES — need to understand how install time data is currently tracked (if at all), what historical data exists, and how to source retail vs builder pricing for the savings comparison.
**Status:** Not started

---

### Phase 16: Two-Way Sync & Smart Recommendations
**Goal:** Connect the public Dream Home Designer to the internal project and procurement system. When a lead converts, their selections automatically populate an internal project. The system recommends materials based on room type, style, budget, and what similar projects used. Finalized selections can kick off procurement workflows.

**Requirements:** SYNC-01, SYNC-02, SMART-01, SMART-02, SMART-03
**Success Criteria:**
1. Lead-to-project conversion: when a lead is approved, create an internal project with all selections pre-populated from their Dream Home Designer session
2. Bidirectional sync: changes to selections in the internal app reflect in the public view, and vice versa (with approval gates)
3. AI material recommendations: suggest materials based on room type, selected style, and budget tier
4. "Similar projects used" recommendations: based on historical project data, surface popular material choices
5. Procurement kickoff: finalized selections can trigger procurement items in the internal system
6. Notification when public customer updates their selections after lead submission

**Research needed:** YES — need to design the sync architecture (real-time vs batch, conflict resolution), understand the approval workflow for customer-initiated changes, and determine how much historical data exists for "similar projects" recommendations.
**Status:** Not started

---

## v4 Phase Ordering Rationale

```
Phase 11 (Catalog) ──→ Phase 12 (Room Selection) ──→ Phase 13 (AI Renders)
                                    │                          │
                                    ▼                          ▼
                            Phase 14 (Public Dashboard) ◄──────┘
                                    │
                                    ▼
                            Phase 15 (Savings + Metrics)
                                    │
                                    ▼
                            Phase 16 (Sync + Smart Recs)
```

- **Catalog before selection** (11→12): Can't pick materials visually without images/specs
- **Selection before renders** (12→13): Need material choices to generate room images
- **Selection before dashboard** (12→14): Dashboard displays the selections
- **Renders feed dashboard** (13→14): AI renders are a key dashboard feature
- **Dashboard before savings** (14→15): Savings calculator enhances the existing dashboard
- **Everything before sync** (→16): Sync connects what's already built to the internal system

## v4 Research Flags

| Phase | Research Needed | Reason |
|-------|----------------|--------|
| 11 | YES | Image sourcing strategy, room-category mappings, product data integration |
| 12 | YES | UX patterns for progressive material selection, competitor analysis |
| 13 | YES | AI image generation API evaluation, prompt engineering for interior renders |
| 14 | No | Mirrors existing internal components |
| 15 | YES | Install time data availability, retail pricing sources for savings comparison |
| 16 | YES | Sync architecture, conflict resolution, recommendation data requirements |

---
*Roadmap created: 2026-02-06*
*v4 milestone added: 2026-02-13*
