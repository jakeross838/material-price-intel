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

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automated outbound RFQs | Future phase — requires supplier email management, template system, response tracking |
| Purchase order generation | Handled by the Ross Built Intelligence Platform, not this pricing module |
| Supplier CRM / relationship management | Different product; main platform handles supplier relationships |
| Real-time market price feeds | No reliable API exists for construction materials at the SKU level |
| Estimating / takeoff from blueprints | Completely different product (STACK, PlanSwift territory) |
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
| INGEST-01 | 3 | Pending |
| INGEST-02 | 2, 7 | Pending |
| INGEST-03 | 4 | Pending |
| INGEST-04 | 3, 4 | Pending |
| INGEST-05 | 3 | Pending |
| EXTRACT-01 | 3 | Pending |
| EXTRACT-02 | 3 | Pending |
| EXTRACT-03 | 3 | Pending |
| EXTRACT-04 | 3 | Pending |
| MAT-01 | 5 | Pending |
| MAT-02 | 1 | Pending |
| MAT-03 | 1 | Pending |
| MAT-04 | 5 | Pending |
| MAT-05 | 5 | Pending |
| SEARCH-01 | 6 | Pending |
| SEARCH-02 | 6 | Pending |
| SEARCH-03 | 6 | Pending |
| SEARCH-04 | 6 | Pending |
| PRICE-01 | 1 | Pending |
| PRICE-02 | 1 | Pending |
| PRICE-03 | 6 | Pending |
| PLAT-01 | 1 | Pending |
| PLAT-02 | 1, 7, 8 | Pending |
| PLAT-03 | 2, 8 | Pending |
| PLAT-04 | 1 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25 ✅
- Unmapped: 0

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-06 after create-roadmap*
