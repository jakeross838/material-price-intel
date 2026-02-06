# Material Price Intelligence System

## What This Is

An AI-powered material pricing database for Ross Built Custom Homes (Bradenton, FL). The system automatically extracts structured data from supplier quotes — PDFs, emails, Excel files — and stores it in a queryable database so Greg and his team can instantly compare pricing, track historical costs, and negotiate confidently across 8-10 active custom home projects ($3-5M each).

## Core Value

Never overpay for materials because you didn't know what you paid last time. Every quote logged makes the next negotiation stronger.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Upload a quote PDF and have AI extract supplier, line items, pricing, delivery, tax into structured data
- [ ] Forward a quote email to the system and have it parsed automatically (email text, PDF attachments, or Excel)
- [ ] Store extracted data in Supabase with original file stored for reference
- [ ] Extract: supplier name, rep contact, quote number, date, project name, line items (material, size/dimensions, quantity, unit, unit price, discounts, totals), delivery cost, tax, grand total
- [ ] Natural language price queries: "What's the best price I've gotten for 5/4x6 Ipe?" or "What did I pay for PT 2x10x16 last year?"
- [ ] Historical pricing results include supplier, date, project, and unit price
- [ ] Alert when a new quote is significantly higher than historical average for that material
- [ ] Material categorization extensible beyond lumber (Windows, Cabinets, Flooring next)
- [ ] Multi-user access with team roles (Greg + purchasing team)
- [ ] Track delivery costs separately from material costs (big variable in total cost)
- [ ] Handle Florida sales tax (7%) as a tracked field
- [ ] Architecture designed to integrate into the Ross Built Intelligence Platform (React + Supabase)

### Out of Scope

- Automated outbound RFQs (Phase 3 — future, after price database proves value)
- Supplier relationship management / CRM features — the Buildertrend replacement handles that
- Purchase order generation — handled by the larger platform
- Real-time market price feeds — no reliable API exists for construction materials
- Mobile app — web-first, responsive is fine

## Context

**The Company:** Ross Built Custom Homes builds ~5 custom homes per year in the Bradenton, FL area at $3-5M each, with 8-10 jobs active at any time in various stages.

**The Problem:** Supplier quotes come in varied formats (formal PDFs, casual email text, Excel spreadsheets) from multiple suppliers for the same materials. There's no systematic way to track historical pricing or compare across suppliers. Real example: $21K quote from one lumber supplier vs $12K from another for identical material — a $9K miss due to zero pricing visibility.

**The Ecosystem:** This is a standalone module that will eventually integrate into the Ross Built Intelligence Platform — a Buildertrend replacement being built on React + Supabase. That platform handles POs, invoices, draws, customer portal, daily logs, and a checkpoint system. This pricing module should be architecturally compatible (same Supabase project, same React patterns).

**Material Categories (by priority):**
1. Lumber — highest price variance, starting here
2. Windows — high cost, fewer suppliers
3. Cabinets — high cost, project-specific
4. Flooring — varied materials and pricing

**Quote Format Reality:**
- Formal PDF quotes (structured, with line items and totals)
- Casual email text ("Hey Greg, here's your pricing: Ipe 5/4x6x16 $165/pc...")
- Excel spreadsheets with pricing tables
- No two suppliers format quotes the same way
- The AI parser must handle all of these robustly

## Constraints

- **Tech Stack**: React frontend, Supabase backend (PostgreSQL + Storage + Edge Functions) — must match existing platform
- **No Supplier APIs**: Everything is email/PDF/Excel based — there are no electronic integrations with suppliers
- **Minimal Manual Entry**: The entire value proposition is automation. If uploading a quote takes more than 30 seconds of human time, it won't get used
- **Query Speed**: Price lookups must return in under 10 seconds — this gets used during live supplier calls
- **AI Parsing**: Claude API for document extraction — must handle varied, inconsistent quote formats without breaking
- **Florida Tax**: 7% sales tax must be tracked as a separate field
- **Delivery Tracking**: Delivery costs vary wildly and must be separated from material unit pricing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for backend | Matches existing platform, PostgreSQL gives strong query capabilities | — Pending |
| Claude API for quote parsing | Best at handling unstructured/varied document formats | — Pending |
| Lumber first, then expand | Highest price variance = highest ROI for pricing intelligence | — Pending |
| Standalone module architecture | Can ship value immediately while larger platform is built | — Pending |
| Both upload and email ingestion | Team uses both workflows equally, need both from early on | — Pending |

---
*Last updated: 2026-02-06 after initialization*
