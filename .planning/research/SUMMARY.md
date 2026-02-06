# Project Research Summary

**Project:** Material Price Intelligence System
**Domain:** Construction Material Pricing (AI Document Parsing → Analytics)
**Researched:** 2026-02-06
**Confidence:** HIGH (core patterns well-established; material normalization and text-to-SQL are MEDIUM)

## Executive Summary

This system is a document-parsing-to-analytics pipeline purpose-built for a small custom home builder. Research confirms the chosen stack (React + Supabase + Claude API) is well-suited: Claude's structured outputs guarantee valid JSON schemas from varied quote formats, Supabase Edge Functions handle the processing pipeline without a separate server, and PostgreSQL's pg_trgm extension enables the fuzzy material matching critical for cross-supplier comparison.

The recommended architecture processes documents asynchronously via a database-backed job queue (pg_cron → Edge Function), not inline on upload. Claude receives PDFs natively as document blocks (no pre-extraction needed for most quotes), extracts structured data with guaranteed schema compliance, and a two-tier normalization system (AI classification + pg_trgm matching) resolves the material identity problem that every competitor also faces.

**The biggest risk is not technical — it's trust.** Silent AI extraction errors (wrong prices entering the database undetected) and apples-to-oranges comparisons (different units, delivery terms) will destroy user trust faster than any feature can build it. The human review loop is not optional — it is the quality guarantee. Research shows fully automated extraction achieves 70-80% field-level accuracy; human-in-the-loop achieves 99.9%.

## Key Findings

### Recommended Stack

The stack is mandated (React + Supabase) with Claude API for parsing. Key additions from research:

- **Claude Haiku 4.5** for quote extraction ($0.005-0.015/quote, <3s) with **Sonnet 4.5** fallback for complex documents
- **Zod 4.x** for shared schemas — same definition validates Claude output, Edge Function logic, and frontend forms
- **unpdf** for text-based PDF extraction (cheaper than vision); Claude PDF vision for scanned/image documents
- **Postmark Inbound** for email ingestion ($1.50/1000 emails, cleanest webhook format with base64 attachments inline)
- **pg_trgm** extension for fuzzy material name matching in PostgreSQL
- **shadcn/ui + Tailwind CSS 4** for rapid UI development
- **@tanstack/react-query** for server state management

Estimated monthly Claude API cost: $2-8/month at normal usage (50 quotes + 100 queries).

### Expected Features

**Table stakes (MVP):**
- PDF upload + AI extraction with review UI
- Structured line item storage with supplier/date/project attribution
- Original document storage for verification
- Basic search and filter (material, supplier, date range, project)
- Delivery cost and FL 7% tax tracking as separate fields
- AI material normalization (partial D1 — consistent canonical names)

**Differentiators (v1.x after validation):**
- Price anomaly alerts (requires 3+ months historical data)
- Email forwarding ingestion (biggest adoption accelerator)
- Natural language price queries
- Multi-user access with team roles

**Defer (v2+):**
- Supplier comparison matrix (requires 6+ months data + canonical catalog)
- Price trend visualization
- Bulk material list pricing
- Platform integration with Ross Built Intelligence Platform

**Anti-features (deliberately NOT building):**
- Real-time market price feeds (no reliable API for construction SKUs)
- Purchase order generation (main platform's job)
- Automated outbound RFQs (future, after system proves value)
- Estimating/takeoff features (different product entirely)

### Architecture Approach

Three-layer pipeline: **Ingestion → Processing → Query**

1. **Ingestion Layer**: React upload or email webhook → file stored in Supabase Storage → document record created with `status: pending`
2. **Processing Layer**: pg_cron polls every 30s → Edge Function picks up pending jobs → sends PDF to Claude as native document block → structured output extraction → two-tier material normalization (AI + pg_trgm) → data stored in PostgreSQL
3. **Query Layer**: Structured search filters for standard lookups (<3s, no AI needed) + Claude-powered natural language for complex queries → results with full context

**Key architectural decisions:**
- Async processing via job queue (not inline on upload) — avoids Edge Function timeouts
- Claude native PDF document blocks (no separate text extraction for most PDFs)
- Separate Edge Functions per concern (process-document, parse-quote, normalize-material, query-prices)
- Supabase Realtime for processing status updates to UI
- Structured query templates over raw text-to-SQL (trust > flexibility)

### Critical Pitfalls

1. **Silent Price Hallucination** — LLMs can extract plausible but wrong prices (0.7-2.6% error rate). Prevent with: source-value verification, confidence scoring, reasonableness checks, mandatory human review for first 50-100 quotes.

2. **Material Identity Fragmentation** — "5/4x6x16 Ipe" vs "Ipe 5/4 x 6 x 16" vs "Ipe decking 1.25x6x16" must resolve to the same material. Prevent with: structured dimension extraction (species + thickness + width + length as separate fields), pg_trgm fuzzy matching, alias accumulation.

3. **Apples-to-Oranges Comparison** — Different units (per piece vs per LF vs per BF), delivery included vs separate, quantity breaks. Prevent with: unit normalization, delivery-included boolean, comparison validity indicators.

4. **Email Ingestion Fragility** — MIME complexity, duplicate detection, attachment handling. Prevent with: structured email service (Postmark), idempotent processing, dead letter queue.

5. **Text-to-SQL Trust Destruction** — 90% accuracy in NL-to-SQL is "100% useless" for business decisions. Prevent with: structured query templates (LLM fills parameters, not writes SQL), "show your work" pattern, pre-computed common comparisons.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation — Database Schema + Auth + Project Setup
**Rationale:** Everything depends on getting the schema right. The extensible material schema (universal fields + category-specific JSONB) must be designed before any data enters.
**Delivers:** Supabase project configured, all tables/indexes/RLS/extensions, auth setup, React app shell
**Addresses:** Pitfall #6 (Schema Rigidity) — design for lumber + future categories from day one
**Avoids:** Schema migration pain later; must handle lumber dimensions AND be extensible to windows/cabinets

### Phase 2: Core AI Parsing Pipeline
**Rationale:** This IS the product. Without reliable extraction, nothing else matters. Must address the hardest pitfalls first.
**Delivers:** PDF upload → Claude extraction → structured data in DB → review UI → original file linked
**Addresses:** Features T1, T2, T4, T5, T6 (table stakes)
**Avoids:** Pitfall #1 (Hallucination), #5 (No Review Loop), #7 (PDF Table Failure), #8 (Edge Function Limits), #12 (Prompt Brittleness)
**Uses:** Claude Haiku 4.5 + structured outputs, async job queue, format-specific prompts

### Phase 3: Material Normalization + Search
**Rationale:** Without material normalization, price comparison across suppliers is impossible — the core value proposition. Search must handle material name variations.
**Delivers:** Canonical material catalog, AI normalization at extraction time, pg_trgm fuzzy matching, search/filter UI
**Addresses:** Feature D1 (partial), T7
**Avoids:** Pitfall #2 (Material Fragmentation), #3 (Apples-to-Oranges)
**Uses:** pg_trgm extension, AI classification into structured dimensions, alias accumulation

### Phase 4: Price Query Interface
**Rationale:** Once data is in the DB and normalized, users need to query it fast. Structured templates over raw text-to-SQL for trust.
**Delivers:** Structured search (<3s), natural language query via templates, query results with full context, price history views
**Addresses:** Features T3, D4, D10
**Avoids:** Pitfall #9 (Text-to-SQL errors) — use structured templates, not raw SQL generation
**Uses:** Claude Sonnet for NL query interpretation, pre-computed price_history materialized view

### Phase 5: Email Ingestion
**Rationale:** Same processing pipeline as Phase 2, different entry point. Biggest adoption accelerator — reduces friction from "upload PDF" to "forward email."
**Delivers:** Inbound email address, webhook processing, attachment handling, deduplication
**Addresses:** Feature D3
**Avoids:** Pitfall #4 (Email Fragility), #10 (Quote Duplication)
**Uses:** Postmark Inbound webhooks → Edge Function

### Phase 6: Price Alerts + Dashboard
**Rationale:** Requires 3+ months of historical data accumulated from Phases 2-5. Alerts and dashboard prove system value.
**Delivers:** Price anomaly alerts (DB trigger), alert UI, quote summary dashboard, price trend charts
**Addresses:** Features D2, D6, D7
**Avoids:** Building alerts before enough data exists to make them meaningful

### Phase 7: Excel Parsing + Delivery Intelligence
**Rationale:** Extends ingestion to Excel format. Adds delivery cost intelligence for more accurate comparisons.
**Delivers:** Excel/CSV upload parsing, delivery term extraction and normalization, comparison validity indicators
**Addresses:** Features D9, T8 (enhanced)
**Avoids:** Pitfall #11 (Delivery Cost Pollution)

### Phase 8: Multi-User + Polish
**Rationale:** Once the system is proven (Greg uses it daily), add team access and UX refinements.
**Delivers:** Team roles (admin/editor/viewer), onboarding, bulk operations, data export
**Addresses:** Features T10, D5 (supplier comparison matrix), D8 (bulk material list pricing)

### Phase Ordering Rationale

- **Schema before data** (Phase 1 before 2): Extensible schema prevents costly migrations
- **Parsing before search** (Phase 2 before 3-4): Can't query what doesn't exist
- **Normalization before comparison** (Phase 3 before 4): Comparisons are meaningless without material identity resolution
- **Upload before email** (Phase 2 before 5): Same pipeline, upload is simpler to debug; email adds MIME complexity
- **Data accumulation before alerts** (Phases 2-5 before 6): Alerts need historical baseline
- **Core before team** (Phases 1-6 before 8): Prove value with Greg, then expand access

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (AI Parsing):** Need to collect and test with 15-20 real supplier quotes. Prompt engineering for varied formats is the highest-risk work.
- **Phase 5 (Email Ingestion):** Postmark webhook format and Edge Function integration need verification. MIME handling specifics.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented Supabase setup, standard schema patterns
- **Phase 4 (Query Interface):** Standard React + Supabase query patterns, text-to-SQL has documented approaches
- **Phase 6 (Alerts):** Standard DB trigger + Realtime subscription patterns
- **Phase 8 (Multi-User):** Standard Supabase Auth + RLS patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack mandated and verified; supporting libraries confirmed via official docs |
| Features | HIGH | Table stakes clear; competitor analysis validates feature priorities |
| Architecture | HIGH | Async pipeline pattern well-documented by Supabase; Claude PDF support is GA |
| Pitfalls | HIGH | Composite from 15+ sources; domain-specific construction material challenges well-researched |
| Material Normalization | MEDIUM | AI + pg_trgm approach is sound but untested for construction materials specifically |
| Text-to-SQL | MEDIUM | Structured templates mitigate risk; raw NL-to-SQL is unreliable for business decisions |
| Email Ingestion | MEDIUM | Postmark is mature; specific Supabase Edge Function integration is community-sourced |
| Cost Estimates | MEDIUM | Based on official token pricing; actual costs depend on document complexity |

**Overall confidence:** HIGH — the architecture is well-supported by official documentation and established patterns. The medium-confidence areas (material normalization, text-to-SQL) have clear mitigation strategies.

### Gaps to Address

- **Zod v4 + Anthropic SDK compatibility**: zodOutputFormat may need Zod v3 initially; verify during Phase 2
- **unpdf in Supabase Edge Runtime**: Test PDF text extraction in actual Edge Function environment early
- **SheetJS in Deno Edge Functions**: Excel parsing compatibility needs verification; may need client-side fallback
- **Real quote test corpus**: Must collect 15-20 actual supplier quotes before Phase 2 development begins
- **Material taxonomy beyond lumber**: Windows, cabinets, flooring need category-specific normalization rules (Phase 3+)

## Sources

### Primary (HIGH confidence)
- [Claude API Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — guaranteed JSON schemas
- [Claude API PDF Support](https://platform.claude.com/docs/en/build-with-claude/pdf-support) — native document blocks
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) — architecture, limits, Deno 2.1
- [Supabase Processing Large Jobs](https://supabase.com/blog/processing-large-jobs-with-edge-functions) — pg_cron queue pattern
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) — processing status subscriptions
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) — fuzzy matching
- [Postmark Inbound Webhook](https://postmarkapp.com/developer/webhooks/inbound-webhook) — email ingestion

### Secondary (MEDIUM confidence)
- [Field Materials AI](https://www.fieldmaterials.com/platform/building-material-prices) — closest competitor feature set
- [Anthropic Cookbook: SQL Queries](https://platform.claude.com/cookbook/misc-how-to-make-sql-queries) — text-to-SQL patterns
- [Human-in-the-Loop AI](https://parseur.com/blog/human-in-the-loop-ai) — 99.9% accuracy with HITL vs 70-80% automated
- [Text-to-SQL Accuracy Research](https://research.aimultiple.com/text-to-sql/) — LLM SQL generation limitations

### Tertiary (LOW confidence)
- [Community Supabase email patterns](https://github.com/orgs/supabase/discussions/40494) — inbound email to Edge Functions
- [SheetJS Deno compatibility](https://docs.sheetjs.com/docs/demos/cloud/deno/) — Excel parsing in Edge Runtime

---
*Research completed: 2026-02-06*
*Ready for roadmap: yes*
