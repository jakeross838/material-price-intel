# Requirements: Material Price Intelligence System

**Defined:** 2026-02-06
**Core Value:** Never overpay for materials because you didn't know what you paid last time. Every quote logged makes the next negotiation stronger.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Quote Ingestion

- [ ] **INGEST-01**: User can drag-and-drop a PDF quote and have AI extract all fields automatically
- [ ] **INGEST-02**: Original quote file stored in Supabase Storage, linked to extracted data
- [ ] **INGEST-03**: User can review and correct AI extraction before data is committed to the database
- [ ] **INGEST-04**: AI extraction includes confidence scoring — low-confidence items flagged for review
- [ ] **INGEST-05**: Cross-validation check verifies line items × qty = totals and totals sum to grand total

### Data Extraction

- [ ] **EXTRACT-01**: AI extracts supplier name, rep contact info, quote number, quote date, and project name
- [ ] **EXTRACT-02**: AI extracts line items with material description, dimensions, quantity, unit of measure, unit price, discounts, and line total
- [ ] **EXTRACT-03**: AI extracts delivery cost, tax amount, tax rate, subtotal, and grand total
- [ ] **EXTRACT-04**: AI handles varied quote formats — formal PDF tables and casual text layouts

### Material Management

- [ ] **MAT-01**: AI normalizes material descriptions to canonical names during extraction (e.g., "Ipe decking 1.25x6x16" → "Ipe 5/4x6x16")
- [ ] **MAT-02**: Materials stored with structured fields: species, dimensions, grade, treatment, unit of measure
- [ ] **MAT-03**: Material category schema extensible beyond lumber (designed for windows, cabinets, flooring)
- [ ] **MAT-04**: Fuzzy matching (pg_trgm) finds existing canonical materials before creating new entries
- [ ] **MAT-05**: New description variations automatically link as aliases to existing canonical materials

### Price Search

- [ ] **SEARCH-01**: User can search for materials by name with fuzzy text matching
- [ ] **SEARCH-02**: User can filter results by supplier, date range, project, and material category
- [ ] **SEARCH-03**: Search results show supplier name, quote date, project, unit price, unit of measure, and link to original quote
- [ ] **SEARCH-04**: Search results return in under 3 seconds

### Pricing Data

- [ ] **PRICE-01**: Delivery cost tracked as a separate quote-level field (not mixed into unit prices)
- [ ] **PRICE-02**: Florida 7% sales tax tracked as separate fields (tax amount and tax rate)
- [ ] **PRICE-03**: All price comparisons use pre-tax unit prices

### Platform

- [ ] **PLAT-01**: User authentication via Supabase Auth (email/password)
- [ ] **PLAT-02**: React frontend with Supabase backend matching Ross Built Intelligence Platform patterns
- [ ] **PLAT-03**: Async document processing — upload returns immediately, processing status shown via Supabase Realtime
- [ ] **PLAT-04**: Database schema includes RLS policies prepared for future multi-user expansion

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Email Ingestion

- **EMAIL-01**: User can forward a quote email to a system address and have it auto-parsed
- **EMAIL-02**: System handles email body text, PDF attachments, and Excel attachments
- **EMAIL-03**: Idempotent processing prevents duplicate entries from re-forwarded emails

### Excel Parsing

- **EXCEL-01**: User can upload Excel/CSV spreadsheet quotes for AI extraction
- **EXCEL-02**: System handles varied spreadsheet layouts from different suppliers

### Natural Language Queries

- **NLQ-01**: User can ask natural language questions like "What's the best price for 5/4x6 Ipe?"
- **NLQ-02**: System translates natural language to structured queries with "show your work" transparency
- **NLQ-03**: Query results include full context (supplier, date, project, unit, original quote)

### Price Alerts

- **ALERT-01**: System alerts when a new quote price exceeds historical average by configurable threshold (default 15%)
- **ALERT-02**: Alert shows current price, historical average, comparison period, and affected quotes
- **ALERT-03**: User can dismiss alerts with optional note

### Team Access

- **TEAM-01**: Multi-user access with roles: admin, editor, viewer
- **TEAM-02**: Admin can manage team members and roles
- **TEAM-03**: All data scoped to organization via RLS

### Analytics

- **ANALYTICS-01**: Supplier comparison matrix — side-by-side pricing for same materials across suppliers
- **ANALYTICS-02**: Price trend visualization — charts showing material prices over time by supplier
- **ANALYTICS-03**: Project cost aggregation — total material costs per project across all quotes
- **ANALYTICS-04**: Dashboard with summary stats: total quotes, materials tracked, active suppliers
- **ANALYTICS-05**: Data export to CSV/Excel

### Data Quality

- **DQUAL-01**: Quote versioning — revised quotes linked to originals, old versions marked superseded
- **DQUAL-02**: Quote deduplication — detect same quote uploaded via multiple paths
- **DQUAL-03**: Quote metadata extraction — validity period, payment terms, FOB terms, minimum order
- **DQUAL-04**: Unit of measure conversion for comparison (per piece ↔ per LF ↔ per BF)
- **DQUAL-05**: Bulk material list pricing — "what should I expect to pay for this material list?"

## v4 Requirements — Dream Home Designer & Platform Intelligence

Requirements for transforming the public estimator into a full Dream Home Designer experience and adding intelligence/metrics to the internal platform.

### Material Catalog & Visuals

- [ ] **CATALOG-01**: Materials have product images (photos/renderings) browseable in a visual catalog
- [ ] **CATALOG-02**: Spec sheets and installation guides linked to materials and viewable inline
- [ ] **CATALOG-03**: Visual material cards showing image, name, price range, and key specs
- [ ] **CATALOG-04**: Materials organized by room-appropriate categories (e.g., Kitchen → countertops, cabinets, backsplash, flooring)

### Room-by-Room Selection (Dream Home Designer)

- [ ] **DREAM-01**: Linear room-by-room flow — user walks through each room selecting materials per category
- [ ] **DREAM-02**: Per-room categories appropriate to room type (bathroom gets tile/vanity/fixtures, kitchen gets counters/cabinets/appliances)
- [ ] **DREAM-03**: Material picker shows visual previews with images, price ranges, and key specs
- [ ] **DREAM-04**: 20-30 minute guided experience with save/resume capability
- [ ] **DREAM-05**: Progress tracking shows completion across all rooms
- [ ] **DREAM-06**: Linear-style item selection UX for granular choices (baseboards, trim profiles, paint colors)
- [ ] **DREAM-07**: Running cost total updates in real-time as selections are made

### AI Room Visualization

- [ ] **RENDER-01**: AI generates room images based on selected materials, finishes, and style
- [ ] **RENDER-02**: Per-room renders showing what the space will look like with chosen selections
- [ ] **RENDER-03**: Gallery view of all room renders for the complete home vision
- [ ] **RENDER-04**: Style-aware generation (modern, coastal, farmhouse, transitional, etc.)

### Public Project Dashboard

- [ ] **PUBLIC-01**: Public project view mirrors internal project detail (selections, budget, AI renders)
- [ ] **PUBLIC-02**: Selection sheet viewable by homeowner showing all rooms, materials, suppliers, prices
- [ ] **PUBLIC-03**: AI analysis and product photos visible per selection
- [ ] **PUBLIC-04**: Spec sheets and installation guides accessible per material
- [ ] **PUBLIC-05**: Print-friendly project summary for offline review

### Savings Advisor & Metrics

- [ ] **SAVINGS-01**: Savings calculator shows how much builder pricing saves vs retail
- [ ] **SAVINGS-02**: Social proof: "Ross Built has saved customers $X" with real aggregated data
- [ ] **METRICS-01**: Installation time tracking from historical project data logs
- [ ] **METRICS-02**: Duration estimates per material/category (e.g., "hardwood flooring: 3-5 days for 2,500 sqft")
- [ ] **METRICS-03**: Project timeline predictions based on selections and historical install data

### Two-Way Sync & Smart Recommendations

- [ ] **SYNC-01**: Public estimator selections sync bidirectionally with internal project system
- [ ] **SYNC-02**: Lead-to-project conversion — approved leads become internal projects with selections pre-populated
- [ ] **SMART-01**: AI-powered material recommendations based on room type, style, and budget
- [ ] **SMART-02**: Smart material suggestions based on what other similar projects used
- [ ] **SMART-03**: Automated procurement kickoff from finalized public selections

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automated outbound RFQs | Future phase — requires supplier email management, template system, response tracking |
| Purchase order generation | Handled by the Ross Built Intelligence Platform, not this pricing module |
| Supplier CRM / relationship management | Different product; main platform handles supplier relationships |
| Real-time market price feeds | No reliable API exists for construction materials at the SKU level |
| Estimating / takeoff from blueprints | Different product (STACK, PlanSwift territory) — our estimator uses selection-based pricing, not blueprint takeoffs |
| Inventory / warehouse management | Physical inventory is a different workflow with different users |
| Accounting / QuickBooks integration | High complexity, low value for price intelligence; export CSV instead |
| Client-facing cost transparency | Internal tool only; sharing pricing with clients creates negotiation problems |
| Native mobile app | Web-first, responsive design sufficient; primary use is at desk or on calls |
| Multi-region / multi-currency | Ross Built operates in Bradenton, FL only. Single tax jurisdiction, USD only |
| Approval workflows | Small team where Greg is the approver; formal workflows add overhead for no value |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGEST-01 | 3 | Complete |
| INGEST-02 | 2, 7 | Pending |
| INGEST-03 | 4 | Complete |
| INGEST-04 | 3, 4 | Complete |
| INGEST-05 | 3 | Complete |
| EXTRACT-01 | 3 | Complete |
| EXTRACT-02 | 3 | Complete |
| EXTRACT-03 | 3 | Complete |
| EXTRACT-04 | 3 | Complete |
| MAT-01 | 5 | Pending |
| MAT-02 | 1 | Complete |
| MAT-03 | 1 | Complete |
| MAT-04 | 5 | Pending |
| MAT-05 | 5 | Pending |
| SEARCH-01 | 6 | Pending |
| SEARCH-02 | 6 | Pending |
| SEARCH-03 | 6 | Pending |
| SEARCH-04 | 6 | Pending |
| PRICE-01 | 1 | Complete |
| PRICE-02 | 1 | Complete |
| PRICE-03 | 6 | Pending |
| PLAT-01 | 1 | Complete |
| PLAT-02 | 1, 7, 8 | Pending |
| PLAT-03 | 2, 8 | Pending |
| PLAT-04 | 1 | Complete |

**v1 Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25 ✅
- Unmapped: 0

## v4 Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CATALOG-01 | 11 | Not started |
| CATALOG-02 | 11 | Not started |
| CATALOG-03 | 11 | Not started |
| CATALOG-04 | 11 | Not started |
| DREAM-01 | 12 | Not started |
| DREAM-02 | 12 | Not started |
| DREAM-03 | 12 | Not started |
| DREAM-04 | 12 | Not started |
| DREAM-05 | 12 | Not started |
| DREAM-06 | 12 | Not started |
| DREAM-07 | 12 | Not started |
| RENDER-01 | 13 | Not started |
| RENDER-02 | 13 | Not started |
| RENDER-03 | 13 | Not started |
| RENDER-04 | 13 | Not started |
| PUBLIC-01 | 14 | Not started |
| PUBLIC-02 | 14 | Not started |
| PUBLIC-03 | 14 | Not started |
| PUBLIC-04 | 14 | Not started |
| PUBLIC-05 | 14 | Not started |
| SAVINGS-01 | 15 | Not started |
| SAVINGS-02 | 15 | Not started |
| METRICS-01 | 15 | Not started |
| METRICS-02 | 15 | Not started |
| METRICS-03 | 15 | Not started |
| SYNC-01 | 16 | Not started |
| SYNC-02 | 16 | Not started |
| SMART-01 | 16 | Not started |
| SMART-02 | 16 | Not started |
| SMART-03 | 16 | Not started |

**v4 Coverage:**
- v4 requirements: 30 total
- Mapped to phases: 30 ✅
- Unmapped: 0

---
*Requirements defined: 2026-02-06*
*v4 requirements added: 2026-02-13*
