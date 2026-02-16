// ===========================================
// Edge Function: extract-floor-plan
// ===========================================
// Uses Claude Haiku 4.5 vision/PDF to analyze uploaded
// floor plans and extract structured home data (sqft,
// rooms, bedrooms, bathrooms, stories, style).
// ===========================================

import Anthropic from "npm:@anthropic-ai/sdk@latest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPT = `You are a residential floor plan analyzer for a custom home builder in Bradenton/Sarasota, Florida. Analyze the provided floor plan(s) and extract structured home data.

## Your Task

Examine the floor plan image(s) or PDF and identify:
1. Total approximate square footage (living area, exclude garage)
2. Number of stories/levels
3. Number of bedrooms (including master)
4. Number of bathrooms (including master bath and half baths)
5. All identifiable rooms with approximate square footage
6. Home architectural style if apparent
7. Any visible material specifications (flooring type, countertop material, etc.)

## Room Type Mapping

Map each detected room to one of these EXACT room_type values:
- "kitchen" - Kitchen or cooking area
- "great_room" - Great room, living room, family room, or main gathering space
- "master_suite" - Master bedroom (include master bath as part of this)
- "guest_bedrooms" - Any bedroom that is NOT the master (use count for multiples)
- "guest_bathrooms" - Any bathroom that is NOT the master bath (use count for multiples)
- "dining_room" - Formal or casual dining room
- "office" - Home office, study, den, or library
- "laundry" - Laundry room or utility room
- "garage" - Attached or detached garage
- "outdoor_living" - Covered lanai, patio, screened porch, or outdoor living

IMPORTANT: For the master bedroom AND its en-suite bath, create ONE room entry with room_type "master_suite" and combine their square footage. Do NOT create separate entries for master bedroom and master bath.

For multiple guest bedrooms, create ONE entry with room_type "guest_bedrooms" and note the count in the name (e.g., "3 Guest Bedrooms"). Same for guest bathrooms.

## Output Format

Respond with ONLY a valid JSON object (no markdown fences, no extra text):

{
  "total_sqft": 2800,
  "stories": 1,
  "bedrooms": 4,
  "bathrooms": 3,
  "style": "Coastal",
  "rooms": [
    {
      "name": "Kitchen",
      "room_type": "kitchen",
      "estimated_sqft": 280,
      "notes": "L-shaped layout with island"
    },
    {
      "name": "Master Suite",
      "room_type": "master_suite",
      "estimated_sqft": 480,
      "notes": "Includes walk-in closet and en-suite bath with dual vanity"
    },
    {
      "name": "3 Guest Bedrooms",
      "room_type": "guest_bedrooms",
      "estimated_sqft": 660,
      "notes": null
    }
  ],
  "material_notes": [
    "Tile flooring indicated in bathrooms",
    "Hardwood specified for living areas"
  ],
  "confidence": 0.85,
  "extraction_notes": "Clear architectural floor plan with room labels and dimensions."
}

## Style Detection

If the architectural style is apparent, map to one of: "Ranch", "Colonial", "Mediterranean", "Contemporary", "Craftsman", "Coastal". If unclear, set to null.

## Important Notes

- If the image is not a floor plan, still try your best but set confidence below 0.3 and add an extraction_note explaining.
- Square footage estimates should be rough but reasonable. If dimensions are labeled, use them. If not, estimate from proportions.
- Count half baths as full bathrooms for the bathroom count.
- If you cannot determine a value, use reasonable defaults for the Bradenton/Sarasota FL market: 2500 sqft, 1 story, 3 bedrooms, 2 bathrooms, "Coastal" style.
- The total_sqft should be LIVING AREA only (exclude garage, but include covered outdoor living if it's under air).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { files } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (files.length > 5) {
      return new Response(
        JSON.stringify({ error: "Maximum 5 files allowed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anthropic = new Anthropic();

    // Build content blocks: one document/image block per file, then the text prompt
    // deno-lint-ignore no-explicit-any
    const contentBlocks: any[] = [];

    for (const file of files) {
      if (file.media_type === "application/pdf") {
        contentBlocks.push({
          type: "document",
          source: {
            type: "base64",
            media_type: file.media_type,
            data: file.data,
          },
        });
      } else {
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: file.media_type,
            data: file.data,
          },
        });
      }
    }

    contentBlocks.push({
      type: "text",
      text: EXTRACTION_PROMPT,
    });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: contentBlocks }],
    });

    // Extract text content
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Strip markdown fences if Claude wraps the JSON
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), {
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
