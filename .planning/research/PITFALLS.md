# Pitfalls Research

**Domain:** Construction Material Price Intelligence (AI Document Parsing)
**Researched:** 2026-02-06
**Confidence:** HIGH (composite from multiple verified sources)

## Summary

AI-powered document parsing for construction pricing involves at least 15 domain-specific pitfalls that generic web development experience will not prepare you for. The three most dangerous categories are: (1) silent AI extraction errors where wrong prices enter the database undetected, (2) material normalization failures where the same product appears as multiple entries making price comparison impossible, and (3) invalid comparisons where the system confidently tells a user a price is "good" when it is comparing incompatible units, quantities, or delivery terms. Each of these erodes user trust, and once trust is lost the system will not be used regardless of its other capabilities.

---

## Critical Pitfalls

### Pitfall 1: Silent Price Hallucination

**What goes wrong:** The LLM extracts a plausible but incorrect price from a quote. For example, it reads "$1,650" as "$165" by dropping a digit, or it invents a unit price by dividing a line total by a guessed quantity. The number looks reasonable, enters the database, and silently corrupts all future comparisons for that material.

**Why it happens:** LLMs process text probabilistically, not mathematically. When a PDF has OCR artifacts, merged table cells, or ambiguous formatting (e.g., "165.00" near both a per-piece price column and a quantity column), the model picks the most "likely" interpretation rather than the correct one. Hallucination rates for top LLMs are 0.7-2.6% per extraction -- but applied across thousands of line items, that is dozens of wrong prices. Claude's structured output mode constrains the JSON shape but does not validate that the numbers within that shape are factually correct.

**How to avoid:**
- Implement **source-value verification**: after extraction, programmatically search the original document text for each extracted price value. If "$165.00" is not a substring of the source text, flag it for review.
- Add a **confidence score** to every extraction. When Claude is uncertain (ambiguous layout, unclear formatting), it should say so. Set a threshold (e.g., below 80% confidence = human review queue).
- Store the **original file always** alongside extracted data. Users must be able to click through to the source quote for any price.
- Run **reasonableness checks**: if a unit price is more than 3x or less than 0.3x the historical average for that material, flag it automatically.
- Never auto-approve the first quote from a new supplier or a new material category -- require human confirmation to establish baseline trust.

**Warning signs:**
- Historical price charts show sudden spikes or drops that don't correspond to market conditions
- Users say "that number doesn't look right" even once
- Extracted totals do not equal sum of extracted line items
- Same PDF produces different extractions on re-processing

**Phase to address:** Phase 1 (Core AI Parsing). This must be solved from day one. A wrong price is worse than no price.

---

### Pitfall 2: Material Identity Fragmentation

**What goes wrong:** The same physical product ends up as multiple distinct entries in the database because different suppliers describe it differently. "5/4x6x16 Ipe" vs "Ipe 5/4 x 6 x 16" vs "Ipe decking 1.25x6x16" vs "IPE 32x150x4880mm" are all the same board. Without normalization, the system cannot compare prices across suppliers, which defeats the entire purpose.

**Why it happens:** Construction lumber has notoriously inconsistent naming conventions:
- **Dimension notation varies**: "5/4" vs "1.25" vs "1-1/4" vs "32mm" (fractional, decimal, metric)
- **Order varies**: thickness-width-length vs species-thickness-width-length vs species-length-width-thickness
- **Nominal vs actual sizes**: "2x4" is actually 1.5x3.5 inches, and some suppliers quote actual while others quote nominal
- **Species abbreviations**: "PT" vs "Pressure Treated" vs "ACQ Treated" vs "Ground Contact"
- **Grade inclusions**: "#2" vs "No. 2" vs "Standard" vs "Stud grade" vs omitted entirely
- **Unit descriptions**: "pc" vs "piece" vs "ea" vs "each" vs "stick" vs "board"

The LLM sees these as different text strings. Without a deliberate normalization layer, each becomes a separate material.

**How to avoid:**
- Build a **canonical material schema** with structured fields: `{species, treatment, thickness_nominal, width_nominal, length, grade, unit}` rather than a single "description" string.
- Have the LLM extract into **structured dimensions** (species, thickness, width, length as separate fields) rather than a single material name string.
- Build a **material alias table** that maps known variations to canonical IDs. Seed it with common construction lumber conventions.
- Implement a **normalization function** that standardizes dimension notation: always convert to a canonical form (e.g., fractional inches for nominal, with length in feet).
- Create a **"possible match" detection** step: when a new material is extracted, fuzzy-match it against existing materials and present potential matches to the user before creating a new entry.
- Plan for the **5/4 problem specifically**: 5/4 lumber is extremely common in decking (Ipe is Greg's highest-value material) and is written inconsistently everywhere.

**Warning signs:**
- Material count grows faster than expected (100+ "distinct" materials after 20 quotes when reality is ~30 unique products)
- Price comparison queries return "no historical data" for materials that have definitely been quoted before
- Users manually searching find the material under a different name than the AI stored it

**Phase to address:** Phase 1 (Schema Design) and Phase 2 (Normalization Engine). The canonical schema must exist from the first database table. The normalization intelligence can improve over time but the data model must support it from day one.

---

### Pitfall 3: Apples-to-Oranges Price Comparison

**What goes wrong:** The system compares prices that are not comparable. Supplier A quotes Ipe at $165/piece for 5/4x6x16 with free delivery over $5K. Supplier B quotes Ipe at $14.50/linear foot for 5/4x6 (length unspecified) with $850 delivery. The system reports Supplier A as "cheaper" without accounting for the fact that $165/16ft = $10.31/LF, making Supplier B actually 40% more expensive -- or possibly cheaper depending on total order size and delivery.

**Why it happens:** Construction materials are quoted in wildly inconsistent units:
- **Per piece** (each board)
- **Per linear foot** (LF)
- **Per board foot** (BF = thickness" x width" x length' / 12)
- **Per square foot** (for sheet goods, decking coverage)
- **Per MBF** (thousand board feet, wholesale)
- **Per bundle** (multiple pieces)
- Price may be **before or after quantity discounts**
- **Delivery cost** may be included, separate, or "free over $X"
- **Tax** may be included or excluded
- **Minimum order quantities** affect real unit cost

A naive comparison of raw unit prices without normalizing units, delivery, and quantity context produces misleading results that erode trust.

**How to avoid:**
- Store the **raw unit and unit price as quoted** alongside a **normalized comparison price** (e.g., always calculate $/LF or $/piece for a standard dimension).
- Build **unit conversion logic** into the schema: if species+dimensions are known, the system can convert between per-piece, per-LF, and per-BF automatically.
- Track **delivery terms** as structured data: delivery cost, free-delivery threshold, delivery zone/distance.
- Track **quantity breaks** explicitly: "1-100 pc @ $165, 101-500 @ $155, 500+ @ $145."
- When displaying comparisons, always show: normalized unit price, quoted unit price + unit, delivery terms, quote date, and minimum order. Let the user see the full picture.
- Add a **"comparison validity" indicator**: if two prices cannot be reliably compared (different units, missing delivery info), say so explicitly rather than showing a misleading comparison.

**Warning signs:**
- Price comparisons show impossible-seeming differences (>50% spread for commodity lumber from reputable suppliers)
- Users say "that can't be right" about comparison results
- Delivery costs are missing from most stored quotes

**Phase to address:** Phase 1 (Schema Design with unit fields) and Phase 2 (Comparison Logic). The schema must capture units from extraction; the comparison engine must normalize them.

---

### Pitfall 4: Email Ingestion Fragility

**What goes wrong:** The email forwarding pipeline breaks silently. Emails arrive but attachments are lost. Forwarded-from-forwarded emails have mangled MIME structures. Inline images of quotes are ignored. HTML email formatting destroys the text layout that the LLM needs to parse correctly. An email with 3 PDF attachments only processes 1. The system "works" in testing with clean emails but fails on real-world messy email chains.

**Why it happens:**
- **MIME complexity**: Forwarded emails wrap the original in `message/rfc822` containers, creating nested MIME structures. A quote forwarded by Greg to the system may be 3 levels deep.
- **Attachment encoding**: Base64-encoded PDFs in webhook payloads can exceed size limits. Large Excel files with embedded images can be 10-20MB.
- **Email threading**: The quote text may be buried under "---------- Forwarded message ----------" headers, reply chains, email signatures, and legal disclaimers.
- **Inline vs attached**: Some suppliers paste pricing directly in the email body; others attach PDFs; some do both with slightly different numbers.
- **Webhook reliability**: Inbound parse webhooks (SendGrid, Mailgun, Resend) can fail, retry, or deliver duplicates. Without idempotency, the same quote enters the database twice.

**How to avoid:**
- Choose an **inbound email parse service** (Resend, Mailgun, or SendGrid) that handles MIME parsing and delivers structured JSON with separated body text and attachment URLs.
- Implement **idempotent processing**: hash each email (Message-ID header + attachment hashes) and reject duplicates.
- Process **all attachment types** independently: iterate through every attachment in the webhook payload, not just the first one.
- Strip email **boilerplate**: signatures, legal disclaimers, forwarding headers, reply chains. Extract only the "meat" of the quote content.
- Handle **inline text quotes** separately from attachments: the email body itself may contain pricing that needs parsing.
- Build a **dead letter queue**: any email that fails processing goes to a review queue rather than being silently dropped. Alert the user.
- Set up **webhook retry handling**: return 200 immediately, process asynchronously via background task. If processing fails, the email is still captured for retry.
- Test with **real forwarded emails** from day one, not sanitized test data.

**Warning signs:**
- Users forward quotes but nothing appears in the system
- Attachment count in stored data doesn't match what the user sent
- Same quote appears twice in the database
- Email body parsing produces garbled text with HTML tags mixed in

**Phase to address:** Phase 2 (Email Ingestion Pipeline). Must be robust before users are asked to rely on it.

---

### Pitfall 5: The Confidence Theater Problem (No Human Review Loop)

**What goes wrong:** The system auto-accepts every AI extraction without human verification. The team assumes "AI handled it" and stops checking. Over time, small errors accumulate: a wrong species here, a misread quantity there, a delivery cost stored as a unit price. By the time anyone notices, there are hundreds of corrupted records and no way to know which ones are wrong.

**Why it happens:** The whole point of the system is to reduce manual work. Building a human review step feels like defeating the purpose. So developers skip it, or build a review UI that nobody actually uses because the friction is too high. Research shows organizations using human-in-the-loop (HITL) workflows achieve up to 99.9% accuracy in document extraction, while fully automated systems plateau at 70-80% field-level accuracy.

**How to avoid:**
- Implement a **tiered confidence system**:
  - **HIGH confidence (>90%)**: Auto-accept, but mark as "AI-verified" not "human-verified"
  - **MEDIUM confidence (70-90%)**: Auto-accept with visual flag in UI, queue for batch review
  - **LOW confidence (<70%)**: Block from entering active database until human reviews
- Design the **review UI for speed**: show the extracted data side-by-side with the original document. One-click approve, inline edit for corrections. Target <30 seconds per quote review.
- Track **extraction accuracy over time**: what percentage of AI extractions needed human correction? This metric tells you if your prompts and system are improving.
- Make review a **daily 2-minute habit**, not a dreaded chore. Dashboard showing "3 quotes need quick review" is better than a backlog of 50.
- For the **first 50-100 quotes**, require human review of everything. This builds the confidence calibration data and catches systemic prompt issues early.

**Warning signs:**
- Nobody has looked at the review queue in over a week
- Accuracy metrics are not being tracked
- Users trust the system less over time, not more
- No one can answer "what percentage of extractions are correct?"

**Phase to address:** Phase 1 (Review UI as core feature, not afterthought). The review workflow is not optional -- it is the quality guarantee.

---

### Pitfall 6: Schema Rigidity -- Designing for Lumber Only

**What goes wrong:** The database schema is designed perfectly for lumber (species, dimensions, treatment, grade) but cannot accommodate windows (manufacturer, series, size, glass type, U-factor, grid pattern), cabinets (manufacturer, style, finish, box construction, door type), or flooring (material, thickness, width, finish, AC rating). When Phase 2 materials are added, the schema requires a painful migration or ugly workarounds like JSON blobs that cannot be queried efficiently.

**Why it happens:** Natural instinct is to model the first use case (lumber) perfectly and "worry about the rest later." But construction materials have fundamentally different attribute sets. A lumber dimension (2x4x8) has no equivalent in a window (36x48 double-hung Low-E). If the schema assumes all materials have thickness/width/length, it breaks for non-dimensional goods.

**How to avoid:**
- Design a **two-tier schema from day one**:
  - **Universal fields**: supplier, date, project, unit_price, unit_type, quantity, line_total, delivery_cost, tax, confidence_score, source_file_id
  - **Category-specific fields**: Use a `material_attributes` JSONB column with a `material_category` enum that determines the expected attribute shape. Or use a polymorphic table structure.
- Define the **material_category enum** upfront: LUMBER, WINDOWS, CABINETS, FLOORING, ROOFING, HARDWARE, OTHER.
- For lumber specifically, add **structured dimension fields** (thickness_nominal, width_nominal, length_ft, species, treatment, grade) as first-class columns since lumber is the primary use case and needs fast queries.
- Ensure the **natural language query system** can handle category-specific attributes ("What's the cheapest Low-E window for a 3068 opening?" vs "Best price on 2x10x16 PT?").
- Write **migration tests** early: can you add a new material category without changing existing tables?

**Warning signs:**
- Conversations about "we'll handle windows later" with no schema plan for how
- All material attributes stored in a single "description" text field
- Database has columns like "length" that don't apply to 40% of material categories

**Phase to address:** Phase 1 (Schema Design). The extensible schema must be designed before the first table is created. Lumber-specific optimizations can layer on top.

---

### Pitfall 7: PDF Table Extraction Failure

**What goes wrong:** The AI correctly parses simple text-based quotes but fails on formal PDF quotes with complex table layouts. It misaligns columns (puts Supplier A's quantity in the unit price field), skips rows that span across page breaks, merges two line items into one, or misreads a subtotal as a line item price. Formal PDF quotes from large suppliers (84 Lumber, US LBM distributors) are often the most complex layouts.

**Why it happens:** LLMs process text sequentially, not spatially. When a PDF is converted to text, table structure is lost. A table with columns "Item | Qty | Unit | Price | Total" becomes interleaved text where column alignment depends on whitespace that may not survive text extraction. Multi-page tables are especially problematic -- the header row appears on page 1 but not pages 2-5, so the LLM loses column context. Research confirms: "LLM approaches work well for linear text but fail with structured content like tables."

**How to avoid:**
- Use **vision-based extraction** for PDF quotes: send the PDF as an image to Claude's vision API rather than (or in addition to) text extraction. Claude can "see" table layouts when given the visual representation.
- For text-based extraction, **include explicit column mapping instructions** in the prompt: "The columns in order are: Item Description, Quantity, Unit, Unit Price, Extended Price."
- Implement **cross-validation**: extracted line item prices * quantities should equal line totals. Line totals should sum to subtotal. Subtotal + tax + delivery should equal grand total. Any mismatch flags the extraction for review.
- Handle **multi-page tables explicitly**: if a quote is multi-page, process each page with context from the first page's headers.
- **Test with real supplier PDFs** during development, not synthetic test data. Collect 10-15 actual quotes from Greg's email as the test corpus.

**Warning signs:**
- Extraction works perfectly on simple quotes but fails on formal supplier PDFs
- Quantities and prices are swapped in extracted data
- Multi-line item descriptions are split into separate line items
- Page break locations cause missing line items

**Phase to address:** Phase 1 (AI Parsing Engine). Vision-based PDF parsing should be the primary approach, with text extraction as fallback.

---

### Pitfall 8: Supabase Edge Function Limits Hit in Production

**What goes wrong:** The Edge Function that calls the Claude API times out, runs out of memory, or hits the CPU limit during quote processing. A 15-page PDF quote with 200 line items takes longer to parse than the 150-second wall clock limit. Large Excel files exhaust the 256MB memory limit. The 2-second CPU time limit is hit when doing local text processing on large documents.

**Why it happens:** Supabase Edge Functions have strict limits:
- **Wall clock time**: 150s (free) / 400s (paid) -- includes waiting for Claude API response
- **CPU time**: 2 seconds per request -- actual computation only, excludes I/O wait
- **Memory**: 256MB maximum
- **Payload size**: ~10-20MB for incoming webhook data (Deno Deploy limit)

A Claude API call for a complex multi-page quote can take 30-60 seconds. If you need multiple API calls (one per page, or retry on failure), you can easily exceed 150s. Local PDF-to-text conversion or Excel parsing within the Edge Function can exceed the 2s CPU limit. Large email attachments can exceed payload limits.

**How to avoid:**
- **Architecture for async processing**: Accept the upload/email immediately (return 200), store the file in Supabase Storage, create a "pending" job record, and process asynchronously.
- Use **background tasks** (`EdgeRuntime.waitUntil()`) for the actual AI processing. Background tasks get 150s (free) / 400s (paid) of wall clock time.
- For very large documents, implement a **queue-based approach** using pg_cron: a cron job triggers the Edge Function every minute to check for pending jobs and process one at a time.
- **Offload CPU-intensive work**: If PDF text extraction or Excel parsing exceeds the 2s CPU limit, consider doing the file conversion client-side or via a dedicated processing service. The Edge Function should primarily be an orchestrator that calls the Claude API (which is I/O wait, not CPU time).
- **Chunk large documents**: Instead of sending a 15-page PDF in one Claude API call, send it page-by-page or in 3-5 page chunks. This keeps individual API calls faster and allows progress tracking.
- Monitor Edge Function **execution metrics** from day one. Set up alerts for functions approaching timeout thresholds.

**Warning signs:**
- 504 Gateway Timeout errors in production
- "Wall clock time limit reached" in Edge Function logs
- Large quotes silently fail to process while small ones work fine
- Users report "it's been processing for 10 minutes" with no result

**Phase to address:** Phase 1 (Architecture Design). The async processing pattern must be the default architecture, not bolted on after timeouts are discovered.

---

### Pitfall 9: Text-to-SQL Query Errors Destroy Trust

**What goes wrong:** A user asks "What's the best price I've gotten for 5/4x6 Ipe?" and the system returns $85/piece from a 2-year-old quote where the supplier was quoting 5/4x6x**8** (8-foot boards), not the 16-foot boards the user is actually buying. Or the system generates SQL that averages prices incorrectly, or misses a WHERE clause and returns results for the wrong material. The user knows the answer is wrong, loses trust, and stops using the system.

**Why it happens:** Natural language to SQL is a fundamentally hard problem. Research shows even 90% accuracy is "100% useless" for business decisions because users cannot distinguish correct from incorrect results without expert verification. Common LLM SQL errors include:
- **Missing filters**: "best price for Ipe" returns all Ipe sizes, not the specific dimension asked about
- **Wrong aggregation**: AVG when the user meant MIN, or GROUP BY on the wrong column
- **Semantic logic errors**: query executes without error but returns misleading results
- **Join errors**: comparing prices across tables without proper supplier/date context

For construction pricing specifically, the domain knowledge required is substantial -- the system must understand that "5/4x6" and "5/4x6x16" are different products, that "PT" means "Pressure Treated," and that comparing a 2023 price to a 2025 price requires noting the time gap.

**How to avoid:**
- **Do not use raw text-to-SQL for price queries.** Instead, build a **structured query interface** that the LLM populates: material category, species, dimensions, date range, suppliers. The LLM translates natural language into structured filter parameters, and deterministic code generates the SQL.
- Implement a **"show your work" pattern**: always display what the system searched for. "Searching for: Ipe, 5/4 x 6 x 16, all suppliers, last 12 months" -- so the user can verify the interpretation before seeing results.
- Include **context with every result**: supplier name, quote date, project, exact material description from original quote, unit type. Never show a naked price number.
- Build **pre-defined query templates** for common questions: "Best price for [material]", "Price history for [material]", "Compare suppliers for [material]", "Price trend for [material]". The LLM selects and populates the template rather than generating arbitrary SQL.
- Add a **"Did this answer your question?"** feedback mechanism. Track satisfaction to identify query patterns that fail.

**Warning signs:**
- Users rephrase the same question multiple times trying to get a correct answer
- Query results include materials the user didn't ask about
- Users start manually searching instead of using natural language
- No one uses the query feature after the first week

**Phase to address:** Phase 3 (Query Interface). Design the structured query approach from the start; do not attempt free-form text-to-SQL.

---

### Pitfall 10: Quote Duplication and Version Confusion

**What goes wrong:** The same quote enters the database multiple times: once when Greg uploads the PDF, once when it arrives via email forwarding, once when the supplier sends a revision. Or a revised quote replaces the original but the old (invalid) prices remain in the database, making historical comparisons unreliable. Users cannot tell which version of a quote is current.

**Why it happens:**
- No **deduplication logic**: the system treats every upload as a new quote with no check for duplicates.
- **Quote revisions** from suppliers reuse the same quote number with updated prices, but the system treats them as separate quotes.
- **Multiple ingestion paths**: the same quote can arrive via upload and email simultaneously.
- Suppliers sometimes send **preliminary pricing** followed by a **firm quote** -- both get stored as equal-weight price data.

**How to avoid:**
- Implement **quote fingerprinting**: hash key fields (supplier + quote number + date) to detect exact duplicates. Alert user rather than silently rejecting.
- Build **quote versioning**: when a quote with the same supplier + quote number but different date/prices arrives, link it as a revision of the original. Mark the old version as superseded.
- Track **quote status**: PRELIMINARY, FIRM, EXPIRED, SUPERSEDED. Only FIRM quotes should be used in price comparisons by default.
- Show **duplicate detection results** to users: "This appears to be the same as Quote #1234 from Supplier X uploaded on [date]. Is this a revision or duplicate?"
- Implement a **quote expiration policy**: construction quotes typically expire in 30-60 days. Flag expired quotes so they are excluded from "current best price" queries (but retained for historical trends).

**Warning signs:**
- Same supplier+material combination appears multiple times with identical prices and dates
- Price history shows sudden jumps that are actually quote revisions, not real price changes
- Users complain about "duplicate entries"
- Database grows faster than the number of actual quotes received

**Phase to address:** Phase 2 (Data Management). Deduplication and versioning logic should be implemented as soon as multi-source ingestion is live.

---

### Pitfall 11: Delivery Cost Pollution of Unit Pricing

**What goes wrong:** A supplier quotes "Ipe 5/4x6x16 - $165/pc, Delivery $850." The AI extraction stores $165 as the unit price, which is correct. But another supplier quotes "Ipe 5/4x6x16 - $178/pc delivered." The AI stores $178 as the unit price, but this price includes delivery. The system reports a $13/piece difference when the real material cost difference might be $0 -- or the "cheaper" supplier is actually more expensive once you add their delivery charge to a full order.

**Why it happens:** Construction suppliers handle delivery pricing in wildly inconsistent ways:
- Separate line item for delivery
- Delivery included in per-unit price ("delivered price")
- Free delivery over a threshold ("Free delivery on orders over $5,000")
- Delivery priced per trip, per mile, or as a flat fee
- Multiple delivery charges for phased deliveries
- "Jobsite delivery" vs "yard pickup" pricing

The LLM may not recognize which format a particular quote uses, especially in casual email quotes where delivery terms are mentioned in passing.

**How to avoid:**
- Make **delivery_included boolean** a required field in the extraction schema. The AI must classify whether the quoted unit price includes delivery.
- Store **delivery cost as a separate structured field** with type: PER_ORDER, PER_UNIT, INCLUDED, FREE_OVER_THRESHOLD, NOT_QUOTED.
- In comparisons, always show **"material cost" and "delivered cost" separately**. If delivery terms are unknown, show "delivery: not quoted" rather than hiding the gap.
- Prompt the AI explicitly: "Does this quote include delivery in the unit price, quote delivery separately, or not mention delivery? Classify the delivery terms."
- Build delivery cost into the **comparison normalization**: for a given order size and delivery scenario, what is the total cost per unit including delivery?

**Warning signs:**
- Some suppliers always appear cheaper because their prices include delivery
- Users complain that the "best price" supplier actually costs more when delivery is added
- Most quotes have delivery_cost = null or 0

**Phase to address:** Phase 1 (Extraction Schema) and Phase 2 (Comparison Logic). The field must exist from day one; the intelligence to use it correctly grows over time.

---

### Pitfall 12: Prompt Brittleness Across Quote Formats

**What goes wrong:** The AI parsing prompt is tuned to work perfectly with formal PDF quotes (clear tables, labeled columns, totals). Then a casual email arrives: "Hey Greg, your Ipe pricing - 5/4x6x8 $85, 5/4x6x12 $125, 5/4x6x16 $165. Tax and delivery extra. Let me know - Mike." The prompt fails to extract structured data because it expects headers, columns, and explicit field labels that are not present in casual text.

**Why it happens:** Prompt engineering for extraction is a balancing act. Instructions specific enough to parse tables correctly are too rigid for free-text emails. Instructions general enough for emails produce hallucinations on structured PDFs (the LLM "fills in" fields that should be parsed from specific positions). Each modification to fix one format can break another.

**How to avoid:**
- Use **format detection as the first step**: classify the input as FORMAL_PDF, CASUAL_EMAIL, SPREADSHEET, or UNKNOWN before applying format-specific extraction prompts.
- Build **separate prompt templates per format**, not one universal prompt. The formal PDF prompt emphasizes table structure; the casual email prompt emphasizes pattern recognition of price patterns (material + price pairs).
- Include **few-shot examples** in each prompt template: show the LLM 2-3 examples of that specific format with correct extractions.
- Build a **prompt regression test suite**: maintain a set of 15-20 real quotes (mix of formats) with known-correct extractions. Run every prompt change against this suite before deploying.
- Use Claude's **structured output mode** to enforce the output schema regardless of input format. This ensures consistent JSON structure even when the extraction logic varies.

**Warning signs:**
- New quote format arrives and parsing completely fails
- Fixing extraction for one supplier breaks it for another
- Prompt is over 2000 tokens long and growing with special-case instructions
- Extraction accuracy varies wildly by supplier/format

**Phase to address:** Phase 1 (AI Parsing Engine). Format detection and per-format prompts should be the architecture from the start.

---

### Pitfall 13: Ignoring Quote Context and Metadata

**What goes wrong:** The system extracts line items and prices but misses critical context: the quote is valid for 30 days only, prices are FOB supplier yard (not delivered), the quote assumes a minimum order of $5,000, or the pricing is for a specific project and may not apply to others. This metadata is essential for valid comparisons but is typically buried in fine print, email footers, or PDF headers that the extraction prompt ignores.

**Why it happens:** The extraction focus is naturally on the "main content" -- line items and prices. Terms and conditions, validity periods, special notes, and disclaimers are treated as boilerplate. But in construction pricing, these contextual details determine whether a price is actually available to the buyer.

**How to avoid:**
- Include **metadata extraction fields** in the schema: quote_valid_until, minimum_order, payment_terms, FOB_terms, project_specific (boolean), special_conditions (text).
- Prompt the AI to specifically scan for: expiration dates, minimum order requirements, delivery terms (FOB, delivered, will-call), payment terms (net 30, COD), and project-specific restrictions.
- When comparing prices, **filter out expired quotes** by default and flag project-specific pricing.
- Display **quote age** prominently: a price from 18 months ago is historical interest, not a negotiating tool.

**Warning signs:**
- Users try to order at a quoted price and discover it expired 3 months ago
- Supplier says "that price was for a different project"
- No validity dates stored for any quotes

**Phase to address:** Phase 1 (Extraction Schema) and Phase 2 (Comparison Rules).

---

## Technical Debt Patterns

### TD-1: "Works on My Test Data" Syndrome
Building and testing exclusively with synthetic or sanitized quote data, then discovering in production that real quotes have inconsistencies the system cannot handle. **Prevention:** Collect 15-20 real quotes from Greg's email on day one. Use these as the development test corpus, not generated data.

### TD-2: Monolithic Parsing Function
A single Edge Function that receives a file, extracts text, calls Claude, validates output, stores data, and triggers notifications. When any step fails, the entire pipeline fails with no recovery. **Prevention:** Design as a multi-step pipeline with state tracking: receive -> store -> extract text -> AI parse -> validate -> store structured data -> notify. Each step is independently retryable.

### TD-3: Hardcoded Material Knowledge
Embedding lumber dimension conversion tables, species lists, and treatment codes directly in prompt text or application code. When new materials are added, code changes are required. **Prevention:** Store material reference data in database tables that the AI and application can query. Add new materials by inserting data, not deploying code.

### TD-4: No Extraction Audit Trail
Storing only the final extracted data without recording what the AI actually returned, what the prompt was, or what confidence scores were assigned. Makes debugging impossible. **Prevention:** Log every extraction: input file ID, prompt version, raw AI response, parsed structured data, confidence scores, any validation flags. Store in a separate audit table.

---

## Integration Gotchas

### IG-1: Inbound Email Service Webhook Format Surprises
Different email parsing services (SendGrid, Mailgun, Resend, Postmark) deliver webhook payloads in different formats. Attachments may be inline base64, as URLs to download, or as multipart form data. Switching services later means rewriting the ingestion parser. **Prevention:** Abstract the email parsing behind an adapter interface from day one. Parse the webhook into a canonical internal format immediately.

### IG-2: Claude API Response Variability
Even with structured output mode, Claude may return different field orderings, use null vs omitting a field, or handle edge cases differently between API versions. **Prevention:** Always validate the response against a strict schema (Zod on the frontend/Edge Function side). Never trust raw API output without validation.

### IG-3: Supabase Storage + Edge Function File Passing
Edge Functions cannot directly access files in Supabase Storage by file path. They must use the Storage API with proper authentication to download files. This adds latency and complexity to the parsing pipeline. **Prevention:** Design the pipeline to pass file URLs/IDs between steps, not file contents. Download once, cache in memory for the duration of processing.

### IG-4: Supabase RLS and Service Role Keys
Edge Functions using the service_role key bypass Row Level Security. If the parsing pipeline uses service_role (common for background processing), ensure that user-facing queries go through the anon key with proper RLS policies. Mixing these up either breaks functionality or creates security holes. **Prevention:** Explicitly document which Edge Functions use which keys and why. Keep parsing (service_role) and querying (anon + RLS) on separate paths.

---

## Performance Traps

### PT-1: Synchronous Parsing on Upload
Blocking the user while a PDF is sent to Claude and parsed (30-60 seconds). The user stares at a spinner, thinks it's broken, and uploads again (creating a duplicate). **Prevention:** Return immediately with "Quote received, processing..." and show a status indicator. Process asynchronously. Notify when complete.

### PT-2: N+1 Query Pattern on Price Comparisons
Fetching historical prices one material at a time when a quote has 50 line items. Each comparison query hits the database separately. **Prevention:** Batch comparison queries: for a full quote with N line items, fetch all relevant historical prices in one query using `WHERE material_id IN (...)`.

### PT-3: Unbounded Historical Queries
"Show me all prices for Ipe" returns every Ipe quote from the entire database history as the dataset grows. **Prevention:** Default to last 12 months with pagination. Allow explicit date range expansion.

### PT-4: Large PDF Vision API Costs
Sending every page of every PDF through Claude's vision API is expensive. A 15-page quote at ~$0.01-0.05 per page adds up across hundreds of quotes per month. **Prevention:** Use text extraction first (cheaper). Fall back to vision only when text extraction produces low-confidence results or when the document is image-heavy. Track API costs per quote.

---

## Security Mistakes

### SM-1: Storing Supplier Contact Information Without RLS
Supplier quotes contain contact information, pricing strategies, and potentially confidential terms. Without proper Row Level Security, any authenticated user can see all supplier data. In a small team this seems harmless, but as the platform grows and potentially integrates with subcontractors, it becomes a liability. **Prevention:** Implement RLS from day one. Define clear data access policies: who can see which suppliers, which quotes, which prices.

### SM-2: Email Webhook Endpoint Without Verification
The Edge Function that receives inbound email webhooks must verify that the request comes from the legitimate email parsing service, not an attacker injecting fake quotes. **Prevention:** Validate webhook signatures (SendGrid, Mailgun, and Resend all provide signature verification). Reject unsigned requests.

### SM-3: Service Role Key Exposure in Client-Side Code
The parsing pipeline needs the service_role key, but it must never appear in frontend code. **Prevention:** All AI parsing and database writes happen in Edge Functions (server-side). The frontend only reads data through the anon key with RLS.

---

## UX Pitfalls

### UX-1: No Feedback on Parse Quality
The user uploads a quote and sees "Success!" but has no way to verify that the extraction was correct without clicking into every line item. **Prevention:** Show a parse summary immediately: "Extracted 12 line items from ABC Lumber. Total: $8,432.50. Please review." Link to a side-by-side view of extracted data and original document.

### UX-2: Search That Requires Exact Material Names
User types "ipe decking" but the system only finds results stored as "Ipe 5/4x6x16." **Prevention:** Natural language search should work with partial matches, common names, and category-level queries. Implement full-text search with material aliases.

### UX-3: Price Alerts Without Context
System sends an alert: "New Ipe price is 15% above average." But average of what? Over what period? Compared to which suppliers? **Prevention:** Every alert includes: the specific price, the comparison baseline (average of N quotes over M months), the specific quotes included in the comparison, and a link to the full comparison view.

### UX-4: Making Users Wait for AI During Phone Calls
The core use case is checking prices during live supplier calls ("What did I pay last time?"). If the query takes 10+ seconds, the user is sitting in awkward silence on the phone. **Prevention:** Pre-compute common comparisons. Cache recent query results. Target <3 second response for standard price lookups (this is a database query, not an AI call). Reserve AI-powered natural language for complex queries; simple lookups should be instant.

---

## "Looks Done But Isn't" Checklist

These items are frequently declared "complete" but are actually incomplete in production:

| Feature | Looks Done When... | Actually Done When... |
|---------|-------------------|----------------------|
| PDF parsing | Simple test PDFs parse correctly | 15+ real supplier PDFs parse correctly, including multi-page, complex tables, and scanned documents |
| Email ingestion | Test emails with clean attachments work | Forwarded-from-forwarded emails with multiple attachments and inline text quotes all process correctly |
| Material matching | Exact string matches work | "5/4x6x16 Ipe" matches "Ipe 5/4 x 6 x 16" matches "Ipe decking 1.25x6x16 S4S" |
| Price comparison | Same-unit prices compare correctly | Different units (per piece vs per LF vs per BF), delivery terms, and quantity breaks are all normalized |
| Natural language query | Simple queries return results | Ambiguous queries are clarified, wrong results are caught, and users trust the answers |
| Quote upload | File uploads and data appears | Duplicates are detected, versions are tracked, expired quotes are flagged, confidence scores are shown |
| Async processing | Background task runs | Timeouts are handled, retries work, dead letter queue catches failures, users see progress status |
| Multi-supplier comparison | Two quotes side-by-side | Delivery terms, quantity breaks, expiration dates, and unit normalization are all factored in |

---

## Recovery Strategies

### When Wrong Prices Are Discovered in the Database
1. Identify the source quote and re-examine the original file
2. Correct the extracted data and mark the correction in the audit trail
3. Re-run any comparisons or alerts that used the incorrect data
4. Review other extractions from the same prompt version / same supplier format to find similar errors
5. Update the extraction prompt and add the problematic quote to the regression test suite

### When Material Normalization Is Broken
1. Export all materials and identify clusters that should be the same product
2. Merge duplicate materials under a single canonical ID
3. Update all price records to point to the canonical material
4. Add the merged variations to the alias table to prevent future fragmentation
5. Tighten the matching logic and re-process recent quotes

### When Users Lose Trust in the System
1. Acknowledge the issue honestly -- do not hide behind "the AI is learning"
2. Implement mandatory human review for all extractions until accuracy is verified
3. Show the original source document alongside every price in the UI
4. Add a "Report incorrect data" button that fast-tracks corrections
5. Publish accuracy metrics transparently: "Last 30 days: 97.2% extraction accuracy"

### When Edge Function Timeouts Cascade
1. Switch to queue-based processing immediately (pg_cron + job table)
2. Set maximum document size limits with clear user messaging
3. Chunk large documents into smaller processing units
4. Monitor and alert on processing queue depth
5. Consider offloading to an external service (Cloud Run, Lambda) for large documents

---

## Pitfall-to-Phase Mapping

| Phase | Critical Pitfalls | Must Address |
|-------|-------------------|-------------|
| **Phase 1: Schema + Core Parsing** | #1 (Silent Hallucination), #2 (Material Fragmentation), #5 (No Review Loop), #6 (Schema Rigidity), #7 (PDF Table Failure), #8 (Edge Function Limits), #12 (Prompt Brittleness) | Extraction validation, canonical material schema, confidence scoring, async architecture, format-specific prompts |
| **Phase 2: Email + Multi-Source** | #4 (Email Fragility), #10 (Quote Duplication), #11 (Delivery Pollution), #13 (Missing Context) | MIME handling, deduplication, delivery term extraction, quote metadata |
| **Phase 3: Query + Comparison** | #3 (Apples-to-Oranges), #9 (Text-to-SQL Errors) | Unit normalization, structured query templates, comparison validity indicators |
| **Ongoing** | #5 (Review Loop maintenance), TD-4 (Audit Trail), PT-4 (API Cost Tracking) | Accuracy metrics, prompt regression testing, cost monitoring |

---

## Sources

### Primary (HIGH confidence)
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) -- Verified limits: 256MB memory, 2s CPU, 150s/400s wall clock
- [Supabase Background Tasks](https://supabase.com/docs/guides/functions/background-tasks) -- EdgeRuntime.waitUntil() pattern
- [Supabase Processing Large Jobs](https://supabase.com/blog/processing-large-jobs-with-edge-functions) -- pg_cron queue pattern
- [Claude API Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- Schema-constrained JSON generation
- [Supabase Edge Function Troubleshooting](https://supabase.com/docs/guides/functions/troubleshooting) -- Shutdown reasons and debugging

### Secondary (MEDIUM confidence)
- [Challenges in Structured Document Data Extraction at Scale with LLMs](https://zilliz.com/blog/challenges-in-structured-document-data-extraction-at-scale-llms) -- Format variability, hallucination, layout issues
- [LLMs for Structured Data Extraction from PDFs](https://unstract.com/blog/comparing-approaches-for-using-llms-for-structured-data-extraction-from-pdfs/) -- Approach comparison, schema enforcement
- [Why 90% Accuracy in Text-to-SQL is 100% Useless](https://towardsdatascience.com/why-90-accuracy-in-text-to-sql-is-100-useless/) -- Trust destruction from incorrect queries
- [Text-to-SQL: Comparison of LLM Accuracy in 2026](https://research.aimultiple.com/text-to-sql/) -- Error types: faulty joins, aggregation mistakes, missing filters
- [Human-in-the-Loop AI for Document Processing](https://parseur.com/blog/human-in-the-loop-ai) -- HITL achieves 99.9% accuracy vs 70-80% fully automated
- [Hallucination Rates in 2025](https://medium.com/@markus_brinsa/hallucination-rates-in-2025-accuracy-refusal-and-liability-aa0032019ca1) -- 0.7-2.6% hallucination rate for top LLMs
- [Document Data Extraction: LLMs vs OCRs](https://www.vellum.ai/blog/document-data-extraction-llms-vs-ocrs) -- Vision models vs text-only approaches
- [Nominal vs Actual Lumber Sizes](https://www.lowes.com/n/how-to/nominal-actual-lumber-sizes) -- Construction dimension notation standards
- [SheetJS with Deno Deploy](https://docs.sheetjs.com/docs/demos/cloud/deno/) -- Excel parsing in Deno/Edge Functions

### Tertiary (LOW confidence)
- [Overcoming Accuracy and Hallucination Challenges in Generative AI](https://medium.com/@singhrajni/overcoming-accuracy-and-hallucination-challenges-in-generative-ai-for-document-interpretation-4c777d46164a) -- Single source, general guidance
- [Supabase Edge Functions CPU Timeout Discussion](https://github.com/orgs/supabase/discussions/33362) -- Community workarounds, not official guidance
- [Supabase Inbound Email Webhooks Discussion](https://github.com/orgs/supabase/discussions/40494) -- Community patterns for email ingestion

---

**Confidence Breakdown:**

| Area | Confidence | Reason |
|------|------------|--------|
| AI Extraction Pitfalls (#1, #5, #7, #12) | HIGH | Verified across multiple authoritative sources (Zilliz, Unstract, Vellum, official Claude docs) |
| Material Normalization (#2, #3, #11) | HIGH | Construction domain knowledge confirmed with lumber industry sources + data matching research |
| Edge Function Limits (#8) | HIGH | Verified directly from Supabase official documentation |
| Email Ingestion (#4) | MEDIUM | Multiple email service docs confirm patterns, but specific Supabase+inbound integration is community-sourced |
| Text-to-SQL Risks (#9) | HIGH | Multiple research papers and industry analysis confirm fundamental limitations |
| Quote Management (#10, #13) | MEDIUM | Based on general data quality research applied to construction domain; no construction-specific sources found |
| Schema Design (#6) | MEDIUM | Based on general database design principles applied to construction material taxonomy |

**Research date:** 2026-02-06
**Valid until:** 2026-04-06 (stable domain, AI parsing landscape evolving but core pitfalls enduring)

---
*Pitfalls research for: Construction Material Price Intelligence*
*Researched: 2026-02-06*
