// ===========================================
// Edge Function: analyze-selection
// ===========================================
// Uses Claude Haiku 4.5 to analyze a building material
// and return structured pros/cons/specs/FL-specific notes.
// ===========================================

import Anthropic from "npm:@anthropic-ai/sdk@latest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      selection_name,
      material_name,
      category_name,
      species,
      dimensions,
      unit,
    } = await req.json();

    const materialDesc = [
      material_name || selection_name,
      species && `Species: ${species}`,
      dimensions && `Dimensions: ${dimensions}`,
      category_name && `Category: ${category_name}`,
      unit && `Sold by: ${unit}`,
    ]
      .filter(Boolean)
      .join(". ");

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this building material for a custom home builder in Bradenton, Florida:

${materialDesc}

Respond with ONLY a valid JSON object (no markdown fences) with this exact structure:
{
  "summary": "2-3 sentence overview of this material",
  "specs": { "key": "value" pairs for important technical specifications },
  "pros": ["advantage 1", "advantage 2", ...],
  "cons": ["disadvantage 1", "disadvantage 2", ...],
  "durability_rating": 1-10 integer,
  "best_uses": ["use 1", "use 2", ...],
  "florida_notes": "Florida/Gulf Coast specific considerations (humidity, hurricanes, salt air, UV, etc.) or null if not applicable"
}`,
        },
      ],
    });

    // Extract text content
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Strip markdown fences if Claude wraps the JSON
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const analysis = JSON.parse(jsonStr);
    analysis.analyzed_at = new Date().toISOString();

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
