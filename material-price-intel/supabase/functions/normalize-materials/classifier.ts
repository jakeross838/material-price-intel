// ===========================================
// AI Material Classifier
// ===========================================
// Takes raw material descriptions from supplier quotes and classifies
// them into structured fields (species, dimensions, grade, treatment,
// category, canonical_name) using Claude Haiku in a single batch call.
// ===========================================

import Anthropic from "npm:@anthropic-ai/sdk@latest";

// ===========================================
// Types
// ===========================================

export type MaterialClassification = {
  raw_description: string;
  species: string | null;
  dimensions: string | null;
  grade: string | null;
  treatment: string | null;
  unit_of_measure: string;
  category: string;
  canonical_name: string;
  confidence: number;
};

// ===========================================
// Classification Prompt
// ===========================================

const SYSTEM_PROMPT = `You are a construction material classification engine. You receive an array of raw material descriptions from supplier quotes and classify each one into structured fields.

## Output Format

Return a JSON array with one object per input description, in the same order. Each object has:

{
  "raw_description": "string (the original input, unchanged)",
  "species": "string or null",
  "dimensions": "string or null",
  "grade": "string or null",
  "treatment": "string or null",
  "unit_of_measure": "string",
  "category": "string",
  "canonical_name": "string",
  "confidence": "number 0.0-1.0"
}

## Lumber Dimension Normalization Rules

Convert decimal/actual dimensions to nominal lumber dimensions:
- 1.25" or 1-1/4" thickness = 5/4 (five-quarter)
- 1.5" thickness = 2x (nominal two-by)
- 0.75" or 3/4" thickness = 1x (nominal one-by)
- 3.5" thickness = 4x (nominal four-by)

Standard nominal thicknesses: 1x, 5/4, 6/4, 8/4, 2x, 4x
Standard nominal widths (inches): 2, 3, 4, 6, 8, 10, 12
Standard lengths (feet): 8, 10, 12, 14, 16, 18, 20

Dimension format: "{thickness}x{width}x{length}" e.g. "5/4x6x16", "2x4x8"
- For decking/boards where only thickness and width are given: "5/4x6"
- For items with length: "2x4x8"

## Field Classification Rules

**species**: The wood species. Common abbreviations:
- "PT Pine" = species "Pine" (treatment goes in treatment field)
- "SPF" = "Spruce-Pine-Fir"
- "SYP" = "Southern Yellow Pine"
- "Doug Fir" / "DF" = "Douglas Fir"
- null for non-wood items

**dimensions**: Normalized nominal dimensions as described above. null for non-dimensional items.

**grade**: Lumber grade. Common values:
- "#1", "#2", "#3" (structural grades)
- "Select", "Premium", "Clear", "Appearance"
- "Utility", "Standard", "Stud"
- null if not specified or not applicable

**treatment**: Surface or chemical treatment. Values:
- "Pressure Treated" (from PT, ACQ, CCA, UC4A, etc.)
- "Kiln Dried" (from KD, KDAT, HT)
- "S4S" (Surfaced 4 Sides)
- "S1S2E" (Surfaced 1 Side 2 Edges)
- "Rough Sawn"
- Can combine: "Pressure Treated, Kiln Dried"
- null if not specified or not applicable

**unit_of_measure**: Normalized unit code:
- "pc" (piece, each for lumber)
- "lf" (linear foot)
- "bf" (board foot)
- "sqft" (square foot)
- "ea" (each, for hardware/fasteners)
- "bundle", "sheet", "bag", "roll", "gal", "box"
- Default to "pc" for lumber items if not specified

**category**: Material category:
- "lumber" - dimensional lumber, boards, decking, framing, timber
- "hardware" - screws, nails, fasteners, bolts, anchors, connectors
- "roofing" - shingles, underlayment, flashing, ridge vent
- "windows" - windows, doors, frames
- "flooring" - flooring materials
- "cabinets" - cabinets, countertops
- "other" - anything that doesn't fit above

**canonical_name**: The standardized name for this material:
- For lumber: "{Species} {Dimensions}" with optional grade/treatment if distinctive
  - "Ipe 5/4x6x16"
  - "PT Pine 2x4x8 #2"
  - "Cedar 1x6x8 S4S"
  - "Douglas Fir 2x12x16 #1"
- For non-lumber: A cleaned, standardized version of the description
  - "GRK RSS 5/16x3-1/8 Screws"
  - "Titanium PSL-100 Ledger Connector"

**confidence**: How confident you are in the classification (0.0-1.0):
- 1.0: Completely unambiguous
- 0.7-0.9: Clear with minor inference (e.g., unit assumed from context)
- 0.3-0.6: Ambiguous description requiring interpretation
- Below 0.3: Guessing

## Important Rules

1. Return ONLY the JSON array. No markdown fences. No explanation. Just [ ... ].
2. Every input description MUST have a corresponding output object.
3. Preserve the raw_description exactly as received.
4. For ambiguous items, prefer the most common interpretation in construction.
5. S4S is a treatment/surface finish, NOT a dimension component.`;

// ===========================================
// Batch Classification Function
// ===========================================

/**
 * Classifies an array of raw material descriptions into structured
 * material fields using Claude Haiku in a single batch API call.
 *
 * @param descriptions - Array of raw material descriptions from quotes
 * @param anthropicApiKey - Anthropic API key
 * @returns Array of MaterialClassification objects in same order as input
 */
export async function classifyMaterials(
  descriptions: string[],
  anthropicApiKey: string,
): Promise<MaterialClassification[]> {
  if (descriptions.length === 0) {
    return [];
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Classify these ${descriptions.length} material descriptions:\n\n${JSON.stringify(descriptions, null, 2)}`,
      },
    ],
  });

  // Extract text response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content in classification response");
  }

  // Strip markdown code fences if present (Claude often wraps JSON in ```json ... ```)
  let responseText = textBlock.text.trim();
  if (responseText.startsWith("```")) {
    responseText = responseText
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }

  // Parse JSON array
  let classifications: MaterialClassification[];
  try {
    classifications = JSON.parse(responseText) as MaterialClassification[];
  } catch (parseError) {
    console.error(
      "Failed to parse classification response:",
      responseText.substring(0, 500),
    );
    throw new Error(
      `Classification JSON parse error: ${(parseError as Error).message}`,
    );
  }

  // Validate array length -- pad with fallbacks if Claude returned fewer results
  if (!Array.isArray(classifications)) {
    console.error("Classification response is not an array, creating fallbacks");
    classifications = [];
  }

  if (classifications.length < descriptions.length) {
    console.warn(
      `Classification returned ${classifications.length} results for ${descriptions.length} descriptions. Padding with fallbacks.`,
    );
    for (let i = classifications.length; i < descriptions.length; i++) {
      classifications.push({
        raw_description: descriptions[i],
        species: null,
        dimensions: null,
        grade: null,
        treatment: null,
        unit_of_measure: "ea",
        category: "other",
        canonical_name: descriptions[i],
        confidence: 0.1,
      });
    }
  }

  // Ensure raw_description is preserved exactly (Claude might alter it)
  for (let i = 0; i < descriptions.length; i++) {
    if (classifications[i]) {
      classifications[i].raw_description = descriptions[i];
    }
  }

  return classifications;
}
