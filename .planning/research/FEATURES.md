# Feature Research: Construction Material Price Intelligence

**Domain:** Construction Material Price Intelligence for Custom Home Builders
**Researched:** 2026-02-06
**Confidence:** HIGH (core features), MEDIUM (differentiators), MEDIUM (anti-features)

## Executive Summary

The construction material pricing intelligence space is served by a fragmented ecosystem: enterprise procurement platforms (Kojo, Field Materials AI, SubBase), all-in-one builder platforms (Buildertrend, CoConstruct/Buildertrend, Buildern), estimating-focused tools (STACK, PlanSwift, Buildxact), and specialized AI quote leveling tools (BidLevel, Consight). None of these tools are purpose-built for a small custom home builder ($3-5M homes, 5/year) who simply wants to know "what did I pay for this material before, and is this quote fair?"

**The gap this project fills:** Existing tools are either (a) enterprise procurement platforms requiring $1K+/month and organizational change, (b) estimating tools that track planned costs but not actual supplier quotes over time, or (c) all-in-one platforms that bury pricing intelligence inside 50 other features. Greg needs a focused tool that does one thing exceptionally: turn messy supplier quotes into a searchable pricing database that gives him instant negotiation leverage.

**Primary insight from research:** The hardest technical problem is not storing or querying prices -- it is **material identity resolution**. "PT 2x10x16", "Pressure Treated 2"x10"x16'", "2x10-16 PT #2", and "?"x10x16 PT SYP" are all the same product from different suppliers. Every competitor that handles multiple suppliers must solve this. Field Materials AI uses AI normalization; Kojo uses a Sourcing Grid; most tools punt and require manual categorization. This is the make-or-break feature for automated quote comparison.

---

## Feature Landscape

### Table Stakes (Must Have or Tool Won't Get Used)

These are the minimum features required for Greg to adopt this over his current approach (memory + spreadsheets + asking suppliers). If any of these are missing, the tool provides less value than the current workflow.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|-------------|------------|-------|
| T1 | **PDF Quote Upload + AI Extraction** | Core value prop. Quotes arrive as PDFs. If upload takes >30s or extraction fails frequently, tool is dead. | HIGH | Must handle varied supplier formats. Claude API is strong here. Target: drag-drop, review, confirm in <30s of human time. |
| T2 | **Structured Line Item Storage** | Without structured data (material, qty, unit, unit price, supplier, date, project), no queries are possible. | MEDIUM | Schema: supplier, date, project, material_description, dimensions, quantity, unit_of_measure, unit_price, line_total, delivery, tax. |
| T3 | **Historical Price Lookup** | "What did I pay for X?" is the #1 query. Must return results with supplier, date, project, and price in <10s. | MEDIUM | Natural language interface preferred but structured search is the MVP path. Must handle material name variations. |
| T4 | **Supplier + Date + Project Attribution** | Every price point is meaningless without context: who quoted it, when, for which project. This is metadata, not a feature, but it is table stakes. | LOW | Extracted from quote during AI parsing. |
| T5 | **Original Document Storage** | Users must be able to view the original quote PDF/email alongside extracted data. Trust requires verification. | LOW | Supabase Storage. Link extracted data back to source document. |
| T6 | **Manual Correction of AI Extraction** | AI will get things wrong. Users need to fix extraction errors easily before data is committed. | MEDIUM | Review/edit screen after AI extraction. Critical for data quality trust. |
| T7 | **Basic Search and Filter** | Filter by material category, supplier, date range, project. Without this, the database is just a pile of data. | MEDIUM | PostgreSQL full-text search + filters. |
| T8 | **Delivery Cost Tracking (Separate)** | Delivery costs vary wildly ($0 for pickup to $500+ per load) and distort unit pricing if lumped together. Per PROJECT.md this is explicitly required. | LOW | Separate field on quote, not per line item. Track as quote-level cost. |
| T9 | **Sales Tax Tracking** | FL 7% sales tax must be tracked separately. Required for accurate cost comparison (pre-tax unit prices). | LOW | Quote-level field. Compare unit prices pre-tax. |
| T10 | **Multi-User Access** | Greg first, then purchasing team. Basic auth with role distinction. | LOW | Supabase Auth. Simple roles: admin, user. |

### Differentiators (Competitive Advantage Over Spreadsheets)

These features transform the tool from "a database" into "intelligence." They justify the investment of building custom software vs. using Excel.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| D1 | **Material Identity Resolution (Fuzzy Matching)** | Different suppliers describe the same material differently. AI must recognize "PT 2x10x16" and "2x10-16 PT #2" as the same product. Without this, price comparison across suppliers is manual. | HIGH | **The hardest problem in the system.** Approaches: (1) AI-powered normalization at extraction time, (2) canonical material catalog with AI mapping, (3) user-assisted matching with learning. Recommend: AI normalizes to canonical form, user confirms/corrects, system learns. |
| D2 | **Price Anomaly Alerts** | "This quote is 35% above your historical average for this material." Instant red flag during a supplier call. Industry standard: investigate at +/-10%, act at +/-15%. | MEDIUM | Compare new quote line items against historical average. Flag items exceeding configurable threshold (default: 15%). |
| D3 | **Email Forwarding Ingestion** | Forward a quote email to prices@rossbuilt.com and it auto-parses. Eliminates the "save PDF, open app, upload" friction. | MEDIUM | Requires email receiving infrastructure (e.g., Supabase Edge Function + email service like SendGrid Inbound Parse or Postmark). Parse email body + attachments. |
| D4 | **Natural Language Price Queries** | "What's the best price I've gotten for 5/4x6 Ipe?" in plain English vs. clicking through filters. This is the "wow" feature for live supplier calls. | MEDIUM | Claude API for query interpretation -> SQL generation -> results formatting. Builds on T3 (structured search) but with natural language front-end. |
| D5 | **Supplier Price Comparison Matrix** | Side-by-side view: "For this material list, here's what each supplier would charge based on their last quoted prices." | MEDIUM | Requires D1 (material identity resolution) to work. Aggregates best-known price per material per supplier. |
| D6 | **Price Trend Visualization** | Chart showing price of a specific material over time, by supplier. Visual evidence for negotiations: "Your price went up 20% in 6 months." | LOW-MEDIUM | Time-series chart per material. Requires enough historical data (6+ months). |
| D7 | **Quote-Level Summary Dashboard** | At-a-glance: total quotes processed, avg savings identified, top suppliers, most volatile materials. Proves system value. | LOW-MEDIUM | Aggregate queries on existing data. Dashboard component. |
| D8 | **Bulk Material List Pricing** | Paste or upload a material list, system returns best historical price per item across all suppliers. Pre-negotiation preparation. | MEDIUM | Depends on D1. Input: material list. Output: best price, supplier, date for each item. |
| D9 | **Excel/Spreadsheet Quote Parsing** | Some suppliers send Excel pricing. Parse structured tabular data from .xlsx/.csv files. | MEDIUM | Complementary to T1 (PDF parsing). Different extraction pipeline. |
| D10 | **Project Cost Aggregation** | "What's my total lumber cost for the Smith house across all quotes?" Roll up all quotes tagged to a project. | LOW | Simple aggregation query on project tag. |

### Anti-Features (Deliberately NOT Building)

These are features that seem logical but would either (a) explode scope, (b) add complexity that kills adoption, (c) duplicate what other tools already do, or (d) require data/integrations that don't exist for this use case.

| # | Feature | Why Requested | Why Problematic | Alternative |
|---|---------|---------------|-----------------|-------------|
| A1 | **Real-Time Market Price Feeds** | "Know the market rate for lumber today." | No reliable API exists for construction materials at the SKU level. RSMeans is annual/aggregate. Commodity futures (lumber) don't map to retail pricing. This is a data source problem, not a software problem. | Build your own historical database from actual quotes. After 6 months, YOUR data is more relevant than any market feed because it reflects YOUR suppliers, YOUR volume, YOUR location. |
| A2 | **Purchase Order Generation** | "After comparing prices, generate a PO." | PO generation is a procurement workflow feature, not a price intelligence feature. Adds approval workflows, supplier communication, order tracking -- a completely different product. Already handled by the larger Ross Built platform. | Focus on price intelligence. PO workflow lives in the main platform. Link to it later via API. |
| A3 | **Automated RFQ Outbound** | "Auto-send quote requests to 5 suppliers." | Requires supplier email/contact management, template management, response tracking, follow-up logic. This is CRM + procurement, not price intelligence. Also: suppliers in custom home building operate on relationships, not automated emails. | Keep a supplier directory (name, contact) but send RFQs manually. The system's value is analyzing responses, not sending requests. |
| A4 | **Full Estimating / Takeoff** | "Measure from blueprints and estimate costs." | Estimating is a separate, complex domain (STACK, PlanSwift are $2K-5K/year dedicated tools). Takeoff requires plan parsing, quantity calculation, assembly modeling. Completely different product. | Integrate with estimating tools later if needed. This tool answers "is this price good?" not "how much material do I need?" |
| A5 | **Inventory / Warehouse Management** | "Track materials on-site, what's been delivered, what's remaining." | Physical inventory tracking requires mobile scanning, delivery receipt workflows, waste tracking. Different user, different workflow, different product. | Track what was QUOTED and what was PAID. Physical inventory is out of scope. |
| A6 | **Supplier CRM / Relationship Management** | "Track supplier contacts, rep history, notes, rating." | CRM is a different product. Adding it here fragments the UX and competes with the main platform's supplier management. | Store supplier name + contact info as metadata on quotes. That's it. No relationship tracking, no scoring, no notes system. |
| A7 | **Change Order Tracking** | "Track price changes during a project." | Change orders are project management features. They involve scope changes, approval workflows, client communication. Different domain entirely. | Track the original quote and any re-quotes as separate entries. The system shows price movement naturally. |
| A8 | **Accounting / QuickBooks Integration** | "Sync costs to our accounting system." | Accounting integration adds mapping complexity (cost codes, GL accounts), sync error handling, reconciliation workflows. High effort, low value for price intelligence. | Export data as CSV/Excel for manual import if needed. |
| A9 | **Client-Facing Cost Transparency** | "Show our clients what materials cost." | Sharing raw supplier pricing with clients creates negotiation problems, margin visibility issues, and requires a totally different UI/permission model. | Price intelligence is internal-only. Client communication happens through the main platform. |
| A10 | **Mobile-First / Native App** | "I need this on my phone on the job site." | Mobile app development doubles engineering effort. The primary use case (reviewing quotes, querying prices) happens at a desk or during calls -- not in the field. | Responsive web app. Works on mobile browser for quick lookups. No native app. |
| A11 | **Multi-Region / Multi-Currency** | "Support different tax rates, international suppliers." | Ross Built operates in Bradenton, FL. One tax jurisdiction. All suppliers are domestic. Building multi-region support adds complexity for zero users. | Hardcode FL 7% sales tax. Single currency (USD). Revisit only if the business changes. |
| A12 | **Approval Workflows** | "Require manager approval before accepting a quote." | Approval workflows add state machines, notification systems, role hierarchies. For a 5-person team where Greg IS the approver, this is overhead. | Greg reviews quotes in the system. No formal approval workflow needed. |

---

## Feature Dependencies

Understanding what requires what prevents building features out of order.

```
T1 (PDF Upload + AI Extraction)
  |
  v
T2 (Structured Line Item Storage) <-- Foundation for everything
  |
  +---> T3 (Historical Price Lookup)
  |       |
  |       +---> D4 (Natural Language Queries) -- builds on T3
  |       +---> D2 (Price Anomaly Alerts) -- compares new vs historical
  |
  +---> T4 (Supplier/Date/Project Attribution) -- metadata on T2
  |
  +---> T5 (Original Document Storage) -- linked to T2 records
  |
  +---> T6 (Manual Correction UI) -- edits T2 data
  |
  +---> T7 (Search and Filter) -- queries T2 data
  |
  +---> T8/T9 (Delivery/Tax Tracking) -- fields in T2 schema

D1 (Material Identity Resolution)
  |
  +---> D5 (Supplier Price Comparison Matrix) -- requires matching
  +---> D8 (Bulk Material List Pricing) -- requires matching
  +---> D2 (Price Anomaly Alerts) -- more accurate with matching

D3 (Email Ingestion) --> T1 (triggers same extraction pipeline)

D6 (Price Trend Visualization) --> T2 + D1 (needs data + matching)
D7 (Dashboard) --> T2 (aggregates stored data)
D9 (Excel Parsing) --> T2 (different input, same storage)
D10 (Project Aggregation) --> T2 + T4 (queries by project tag)
```

**Critical path:** T1 -> T2 -> T7 -> T3. Everything else branches from structured data in T2.

**The D1 decision:** Material Identity Resolution (D1) is technically a differentiator but practically required for cross-supplier comparison. It should be approached incrementally: start with AI normalization at extraction time (built into T1), improve with user corrections (T6), and formalize into a canonical catalog over time.

---

## MVP Definition

### Launch With (v1) -- "Can Greg use this today?"

The absolute minimum to deliver the core value proposition: upload a quote, see extracted data, search historical prices.

| Feature | Rationale | Target |
|---------|-----------|--------|
| **T1: PDF Quote Upload + AI Extraction** | Without this, there's no data. This IS the product. | Drag-drop PDF, Claude extracts, user reviews. |
| **T2: Structured Line Item Storage** | Data must be structured and queryable. | Supabase PostgreSQL with well-designed schema. |
| **T4: Supplier/Date/Project Attribution** | Every quote needs context. | Extracted by AI, editable by user. |
| **T5: Original Document Storage** | Users need to verify AI extraction against source. | Supabase Storage, linked to extracted records. |
| **T6: Manual Correction UI** | AI will make errors. User must be able to fix before committing. | Edit form for extracted line items. |
| **T7: Basic Search and Filter** | Must be able to find prices. Structured search is fine for v1. | Filter by material (text search), supplier, date range, project. |
| **T8: Delivery Cost Tracking** | Explicitly required. Separate field, quote-level. | Single delivery cost field per quote. |
| **T9: Sales Tax Tracking** | FL 7% required. Simple field. | Tax amount field per quote. |
| **D1 (partial): AI Material Normalization** | Even v1 needs SOME material matching. If the AI extracts "PT 2x10x16" from one quote and "Pressure Treated 2x10x16" from another, the user needs to find both. | AI attempts to normalize material descriptions during extraction. No formal catalog yet -- just consistent AI-generated canonical names. |

**What v1 explicitly does NOT have:**
- No email ingestion (manual upload only)
- No natural language queries (use search filters)
- No price alerts (user compares manually)
- No multi-user (Greg only)
- No Excel parsing (PDF only)
- No dashboards or visualizations

**v1 success criteria:** Greg uploads 20+ quotes over 2-4 weeks. He can search and find historical prices during a supplier call. He says "this is faster than what I was doing before."

### Add After Validation (v1.x) -- "Greg uses it daily, team wants in"

After v1 proves value and Greg is actively using it, add features that multiply the value.

| Feature | Trigger to Add | Rationale |
|---------|----------------|-----------|
| **D2: Price Anomaly Alerts** | Greg has 3+ months of data | Need historical baseline to compare against. Alert on upload: "This Ipe price is 25% above your 90-day average." |
| **D3: Email Forwarding Ingestion** | Greg says "I keep forgetting to upload" | Reduce friction. Forward email -> auto-parsed. Biggest adoption accelerator after v1. |
| **D4: Natural Language Queries** | Greg uses search 5+ times/week | "What's the best price for 5/4x6 Ipe?" is faster than clicking filters. Builds on proven search patterns. |
| **T10: Multi-User Access** | Purchasing team wants access | Add Supabase Auth roles. Simple: admin (Greg) + user (team). |
| **D9: Excel/Spreadsheet Parsing** | Supplier sends Excel that Greg can't upload | Second ingestion format. Same extraction pipeline, different parser. |
| **D1 (formal): Canonical Material Catalog** | 50+ unique materials in system | Formalize the AI normalization into a managed catalog. User confirms AI-suggested matches. System learns over time. |
| **D10: Project Cost Aggregation** | 5+ projects with multiple quotes each | "Total lumber cost for Smith house" becomes a useful query. |

### Future Consideration (v2+) -- "The system is indispensable"

Features that require significant data history or represent major new capabilities.

| Feature | Prerequisites | Rationale |
|---------|---------------|-----------|
| **D5: Supplier Comparison Matrix** | D1 (canonical catalog), 6+ months data, 3+ suppliers | Side-by-side: "For this material list, Supplier A = $X, Supplier B = $Y." Requires robust material matching. |
| **D6: Price Trend Visualization** | 6+ months data per material | Charts showing price movement over time. Powerful for negotiation but needs data density. |
| **D7: Quote Summary Dashboard** | 50+ quotes in system | Aggregate stats: total quotes, savings identified, top suppliers, price volatility leaders. |
| **D8: Bulk Material List Pricing** | D1 (canonical catalog), comprehensive price history | "Here's my material list for the next house -- what should I expect to pay?" Pre-negotiation intelligence. |
| **Platform Integration** | Main Ross Built platform exists | API endpoints for the larger platform to query price intelligence. Bi-directional: platform sends PO data back for actuals tracking. |

---

## Feature Prioritization Matrix

Impact vs. Effort for all features, to guide sequencing decisions.

```
                        HIGH IMPACT
                            |
     D4 Natural Language    |    T1 PDF Extraction *****
     D2 Price Alerts        |    D1 Material Matching ****
     D3 Email Ingestion     |    T7 Search/Filter ***
                            |    T2 Structured Storage ***
                            |
  LOW EFFORT ---------------+--------------- HIGH EFFORT
                            |
     T8 Delivery Tracking   |    D9 Excel Parsing
     T9 Tax Tracking        |    D5 Supplier Comparison
     T10 Multi-User         |    D8 Bulk Pricing
     D10 Project Aggregation|    D6 Price Trends
     T5 Doc Storage         |    D7 Dashboard
     T4 Attribution         |
                            |
                       LOW IMPACT
```

**The sweet spot (high impact, reasonable effort):** T1, T2, T7, D1, D2, D3, D4
**Quick wins (low effort, useful):** T4, T5, T8, T9, T10, D10
**Big bets (high effort, high payoff when data exists):** D5, D8
**Nice to have (low urgency):** D6, D7, D9

---

## Competitor Feature Analysis

### How Existing Tools Compare to This Project's Needs

| Feature Need | Buildertrend | Buildern | Field Materials AI | Kojo | BidLevel | **This Project** |
|---|---|---|---|---|---|---|
| **AI Quote Parsing (PDF)** | No -- manual entry | No -- manual entry | Yes -- AI from POs/invoices | No -- manual PO entry | Yes -- AI quote leveling | **Yes -- core feature** |
| **Email Ingestion** | No | No | Partial | No | No | **Yes -- v1.x** |
| **Historical Price Database** | Within estimates only | Cost catalog (manual) | Yes -- across all jobs | Yes -- Sourcing Grid | No -- comparison only | **Yes -- core feature** |
| **Material Identity Resolution** | Manual cost codes | Manual catalog | AI normalization | Sourcing Grid matching | AI mapping | **AI + user-assisted** |
| **Price Anomaly Alerts** | No | No | Yes -- volatility flags | No | No | **Yes -- v1.x** |
| **Natural Language Query** | No | No | No | No | No | **Yes -- v1.x** |
| **Supplier Comparison** | No | No | Yes -- by material | Yes -- Sourcing Grid | Yes -- side-by-side | **Yes -- v2** |
| **Delivery Cost Tracking** | In PO totals | No | In PO line items | In PO | No | **Yes -- separate field** |
| **Price Trend Charts** | No | No | Yes | No | No | **Yes -- v2** |
| **Designed for Custom Home Builders** | "Mile wide, inch deep" -- built for production builders | Better fit for custom | Built for MEP/commercial contractors | Built for MEP contractors | Built for GC preconstruction | **Purpose-built for small custom builder** |
| **Price Range** | $399-1,099/mo | $199-499/mo | Custom (enterprise) | Custom (enterprise) | Custom | **Internal tool -- dev cost only** |
| **Complexity** | Very high (50+ features) | High (all-in-one) | High (full procurement) | High (full procurement) | Focused but commercial-scale | **Minimal -- one job, done well** |

### Key Competitive Insights

**Buildertrend** is the incumbent but is widely criticized by custom home builders as being "designed for production builders" with "awful user experience" and excessive complexity. Its procurement module handles POs but has no AI parsing and no cross-project price intelligence. At $399-1,099/month, it's expensive for features a small builder doesn't use. Notably, Ross Built is already building a Buildertrend replacement, so this pricing module fills a gap the main platform won't address.

**Field Materials AI** is the closest competitor to what this project aims to build. Their Pricing Intelligence module (launched December 2025) does AI extraction from POs/invoices, historical price tracking, volatility analysis, and supplier comparison. However, it's designed for commercial MEP contractors doing high-volume procurement, not custom home builders doing 5 houses/year. The pricing and onboarding would be overkill.

**Kojo** has the best supplier comparison feature (Sourcing Grid) but is enterprise-focused MEP contractor software. Not a fit for the use case.

**BidLevel** is the most interesting comparison -- it does AI quote leveling (comparing vendor quotes side-by-side) which is exactly one of this project's use cases. But it's focused on commercial preconstruction, not ongoing price intelligence for a small builder.

**The competitive moat for this project:** None of these tools offer natural language querying of YOUR historical pricing data. None let you forward an email and get it parsed in under a minute. None are designed for a team of 1-5 people building luxury custom homes. The niche is real and underserved.

---

## Construction-Industry-Specific Features

Features that matter because this is construction, not generic procurement.

### Unit of Measure Complexity

Lumber is sold in multiple units: pieces (each), board feet, linear feet, thousand board feet (MBF). The same material from different suppliers may be quoted in different units. The system must either:
- Normalize to a canonical unit per material category (recommended: unit price per piece for dimensional lumber, per linear foot for trim/decking)
- Store the quoted unit and provide conversion tools
- AI should attempt unit normalization during extraction

**This is a sub-problem of D1 (Material Identity Resolution) and is critical for accurate price comparison.**

### Material Description Variability

Construction materials have no universal SKU system. The same 2x10x16 pressure treated board might be described as:
- "PT 2x10x16 #2 SYP"
- "2x10-16' Pressure Treated"
- "2"x10"x16' PT Southern Yellow Pine"
- "#2 Grade PT 2x10x16"

The AI extraction must normalize these to comparable forms. This is harder than it looks because:
- Dimensions can be in different formats (2x10 vs 2"x10")
- Lengths can be in feet or inches
- Species may or may not be specified
- Grade may or may not be included
- Pressure treatment status is expressed many ways

### Delivery as a First-Class Cost

In custom home building, delivery charges are a major cost variable:
- Same supplier, same materials: delivery to a Bradenton site vs. a Sarasota site can differ by $200+
- Some quotes include delivery, some don't
- "Free delivery over $5,000" is common but conditional
- Delivery frequency matters (one large delivery vs. multiple smaller ones)

The system must track delivery cost SEPARATELY from material unit pricing to enable fair comparison.

### Quote Validity and Timing

Construction material prices are volatile. Quotes typically have 30-day validity. Features should:
- Store quote date and expiration date (if stated)
- De-weight old pricing in comparisons (a 6-month-old quote is directional, not actionable)
- Show data freshness in query results

### Sales Tax Handling

Florida 7% sales tax is straightforward but:
- Some quotes include tax, some don't
- Tax-exempt purchases exist (for some material categories or buyers)
- Comparison must be on pre-tax unit prices
- The system should normalize to pre-tax for comparison, display with tax for total cost

---

## Open Questions

1. **Material taxonomy depth:** How granular should material categories be? "Lumber" is too broad. "Dimensional Lumber > Pressure Treated > 2x10 > 16ft > #2 Grade > SYP" is very granular. The right answer is probably: AI extracts what it can, users refine over time, and the canonical catalog grows organically.

2. **Quote vs. Invoice pricing:** Should the system also ingest invoices (what was actually paid) or only quotes (what was offered)? Quotes inform negotiation; invoices confirm actual cost. Both are valuable, but invoices add complexity (partial shipments, backorders, price adjustments). **Recommendation: Start with quotes only (v1), add invoice tracking later if needed.**

3. **Multi-quote comparison UX:** When Greg has 3 quotes for the same material list, what's the ideal comparison view? Side-by-side? Merged with best-price highlighting? This needs UX research/prototyping.

4. **Confidence scoring for AI extraction:** Should the system show a confidence score per extracted field? (e.g., "I'm 95% sure this is PT 2x10x16 but only 60% sure the price is per piece vs per linear foot"). This could help users prioritize what to verify.

---

## Sources

### Primary (HIGH confidence)
- [Field Materials AI - Pricing Intelligence](https://www.fieldmaterials.com/blog/pricing-intelligence-radar-construction-material-prices) -- Most directly comparable product; features validated via WebFetch
- [Field Materials AI - Building Material Prices Platform](https://www.fieldmaterials.com/platform/building-material-prices) -- Detailed feature list validated via WebFetch
- [Buildertrend Procurement & Pricing](https://buildertrend.com/pricing/) -- Competitor pricing and feature scope
- [CoConstruct Estimating Features](https://www.coconstruct.com/features/construction-estimating-software) -- Cost catalog approach
- [Buildern Cost Catalog](https://buildern.com/features/construction-cost-catalog) -- Centralized pricing database patterns
- [STACK Construction Software](https://www.stackct.com/) -- Estimating feature scope
- [PlanSwift 2026 Features](https://www.softwareadvice.com/construction/planswift-takeoff-estimating-profile/) -- Material pricing database

### Secondary (MEDIUM confidence)
- [Kojo Procurement Software](https://www.usekojo.com/) -- Sourcing Grid and material matching patterns
- [BidLevel AI Quote Leveling](https://bidlevel.ai/) -- AI quote comparison approach
- [CrewCost - Historical Data in Construction](https://crewcost.com/blog/leveraging-historical-datathe-basics-of-construction-cost-databases) -- Industry best practices for historical pricing
- [Buildertrend Reviews on Capterra](https://www.capterra.com/p/70092/Buildertrend/reviews/) -- User complaints about complexity, custom builder fit
- [Connecteam Buildertrend Review](https://connecteam.com/reviews/buildertrend/) -- "Not designed for custom home builders"
- [QuoteToMe Procurement](https://quotetome.com/) -- Quote management feature patterns
- [SubBase Procurement](https://www.subbase.io/) -- Real-time pricing and delivery tracking patterns
- [BuiltGrid Procurement for Custom Builders](https://builtgrid.com/blog/5-steps-to-efficient-construction-procurement-for-custom-home-builders/) -- Small builder procurement challenges

### Tertiary (LOW confidence -- industry context)
- [McKinsey - Strategic Era of Procurement](https://www.mckinsey.com/industries/engineering-construction-and-building-materials/our-insights/the-strategic-era-of-procurement-in-construction) -- Industry trends
- [CBUSA - Biggest Issues for Home Builders](https://cbusa.us/blog/biggest-issues-home-builders-2022/) -- Purchasing power challenges for small builders
- [Lumber Capital - Lumber Prices 2025-2026](https://www.lumbercapital.com/post/lumber-prices-2025-2026-what-s-driving-costs-right-now) -- Market context
- [Material Price Variance Thresholds](https://www.linkedin.com/advice/1/how-do-you-set-realistic-achievable-2e) -- Industry standard variance thresholds (+/-5% healthy, investigate at +/-10%, act at +/-15%)

---

## Metadata

**Confidence breakdown:**
- Table stakes features: HIGH -- well-established patterns across all competitors; clearly aligned with PROJECT.md requirements
- Differentiators: MEDIUM -- features exist in enterprise tools but not validated for this specific use case (small custom builder)
- Anti-features: MEDIUM -- based on competitor analysis and PROJECT.md scope; some could be reconsidered if use case changes
- MVP definition: HIGH -- directly derived from core value proposition and validated constraints
- Competitor analysis: MEDIUM -- based on public feature lists and reviews, not hands-on testing

**Research date:** 2026-02-06
**Valid until:** 2026-05-06 (3 months -- feature landscape is stable; AI capabilities may evolve faster)

---
*Feature research for: Construction Material Price Intelligence*
*Project: Ross Built Custom Homes Material Pricing System*
*Researched: 2026-02-06*
