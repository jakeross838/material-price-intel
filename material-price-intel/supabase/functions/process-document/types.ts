// ===========================================
// Extraction Result Types
// ===========================================
// Defines the structured output shape returned by Claude's extraction.
// Confidence is tracked at the line-item level (per ExtractedLineItem.confidence)
// and overall extraction level (ExtractionResult.overall_confidence).
// Per INGEST-04, "low-confidence items flagged" means line items with confidence < 0.7
// are highlighted in the Phase 4 review UI.
// ===========================================

export type ExtractedSupplier = {
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
};

export type ExtractedLineItem = {
  raw_description: string;
  quantity: number | null;
  unit: string | null; // 'pc', 'lf', 'bf', 'sqft', 'ea', 'bundle', 'sheet', 'bag', 'roll', 'gal', 'box'
  unit_price: number | null;
  extended_price: number | null; // qty * unit_price before discount
  discount_pct: number | null;
  discount_amount: number | null;
  line_total: number | null; // final amount for this line
  notes: string | null;
  confidence: number; // 0.0-1.0, overall confidence for this line
};

export type ExtractedTotals = {
  subtotal: number | null;
  delivery_cost: number | null;
  tax_amount: number | null;
  tax_rate: number | null; // as decimal, e.g. 0.07 for 7%
  total_amount: number | null;
};

export type ExtractionResult = {
  supplier: ExtractedSupplier;
  quote_number: string | null;
  quote_date: string | null; // ISO date string YYYY-MM-DD
  valid_until: string | null; // ISO date string YYYY-MM-DD
  project_name: string | null;
  payment_terms: string | null;
  notes: string | null;
  line_items: ExtractedLineItem[];
  totals: ExtractedTotals;
  overall_confidence: number; // 0.0-1.0, average across all fields
  extraction_notes: string | null; // any issues Claude noticed
};
