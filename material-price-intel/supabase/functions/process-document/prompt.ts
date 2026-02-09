// ===========================================
// Extraction Prompt Construction
// ===========================================
// Builds the system prompt and user message array for Claude's
// messages.create() call. The system prompt defines the JSON schema,
// confidence scoring rules, unit normalization, and output format.
// The user message includes the PDF as a native document content block.
// ===========================================

import type { MessageParam } from "npm:@anthropic-ai/sdk@latest";

const SYSTEM_PROMPT = `You are a construction material supplier quote extraction engine. Your job is to extract structured data from supplier quotes (PDFs) and return it as a single JSON object.

## Output Schema

Return EXACTLY this JSON structure:

{
  "supplier": {
    "name": "string",
    "contact_name": "string or null",
    "contact_email": "string or null",
    "contact_phone": "string or null",
    "address": "string or null"
  },
  "quote_number": "string or null",
  "quote_date": "YYYY-MM-DD or null",
  "valid_until": "YYYY-MM-DD or null",
  "project_name": "string or null",
  "payment_terms": "string or null",
  "notes": "string or null",
  "line_items": [
    {
      "raw_description": "string (exactly as it appears on the quote)",
      "quantity": "number or null",
      "unit": "string or null (normalized short code)",
      "unit_price": "number or null",
      "extended_price": "number or null (qty * unit_price before discount)",
      "discount_pct": "number or null",
      "discount_amount": "number or null",
      "line_total": "number or null (final amount for this line)",
      "notes": "string or null",
      "confidence": "number 0.0-1.0"
    }
  ],
  "totals": {
    "subtotal": "number or null",
    "delivery_cost": "number or null",
    "tax_amount": "number or null",
    "tax_rate": "number or null (as decimal, e.g. 0.07 for 7%)",
    "total_amount": "number or null"
  },
  "overall_confidence": "number 0.0-1.0",
  "extraction_notes": "string or null"
}

## Confidence Scoring

Assign a confidence score (0.0 to 1.0) to each line item and an overall score:

- **1.0**: Clearly visible and unambiguous. The value is printed plainly with no interpretation needed.
- **0.7-0.9**: Readable but some interpretation needed. E.g., unit inferred from context, slight formatting ambiguity.
- **0.3-0.6**: Partially visible or inferred. E.g., smudged text, value calculated from other fields, column alignment unclear.
- **Below 0.3**: Guessed or not found. The value is a best-effort estimate from surrounding context.

The overall_confidence should be the average of all line item confidences, weighted down if key header fields (supplier name, quote date, totals) are uncertain.

## Quote Format Handling

You must handle BOTH types of supplier quotes:

**Formal PDF Tables**: Structured with column headers (Item, Description, Qty, Unit, Price, Amount). Extract each row as a line item. Map columns to the correct fields.

**Casual Text Quotes**: Informal emails or letters like "Hey Greg, here's pricing on the Ipe..." that list materials and prices in conversational text. Extract each material mention as a line item. Use context clues to identify quantities, units, and prices.

## Extraction Rules

1. Extract ALL line items from the quote, not just a sample. Every priced item must appear.
2. Normalize units to these short codes: pc, lf, bf, sqft, ea, bundle, sheet, bag, roll, gal, box. Map common variations (e.g., "piece" -> "pc", "linear foot" -> "lf", "board foot" -> "bf", "square foot" -> "sqft", "each" -> "ea").
3. Dates must be in YYYY-MM-DD format. Convert from any format (e.g., "Jan 15, 2024" -> "2024-01-15", "1/15/24" -> "2024-01-15").
4. All monetary values must be plain numbers with no currency symbols or commas (e.g., 1234.56 not "$1,234.56").
5. Set null for fields that are genuinely not present in the document. Do NOT use 0 or empty string as substitutes for missing data.
6. The raw_description for each line item must preserve the original text exactly as it appears on the quote.
7. If a discount is applied to a line, capture both the percentage and dollar amount if available.
8. Delivery/freight charges should go in totals.delivery_cost, not as a line item.
9. Tax information goes in totals (tax_amount, tax_rate), not as a line item.
10. If the quote references a project or job name, capture it in project_name.

## Output Format

Return ONLY the JSON object. No markdown code fences. No explanation text. No preamble. Just the raw JSON starting with { and ending with }.`;

/**
 * Builds the system prompt and user message array for Claude extraction.
 *
 * @param base64Data - The PDF file content encoded as a base64 string
 * @param mediaType - The MIME type of the document (default: "application/pdf")
 * @returns Object with `system` string and `messages` array compatible with Anthropic SDK
 */
export function buildExtractionMessages(
  base64Data: string,
  mediaType: string = "application/pdf",
): { system: string; messages: MessageParam[] } {
  return {
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user" as const,
        content: [
          {
            type: "document" as const,
            source: {
              type: "base64" as const,
              media_type: mediaType,
              data: base64Data,
            },
          },
          {
            type: "text" as const,
            text: "Extract all data from this supplier quote. Return the JSON extraction result.",
          },
        ],
      },
    ],
  };
}
