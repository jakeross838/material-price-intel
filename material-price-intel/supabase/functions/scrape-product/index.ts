// ===========================================
// Edge Function: scrape-product
// ===========================================
// Fetches a product page URL, sends the HTML to
// Claude Haiku 4.5 for structured data extraction.
// Returns product name, specs, images, document links.
// Cost: ~$0.002 per scrape.
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
    const { url, category_name } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing url parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Fetch the product page HTML
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!pageResponse.ok) {
      throw new Error(
        `Failed to fetch URL: ${pageResponse.status} ${pageResponse.statusText}`
      );
    }

    const html = await pageResponse.text();

    // 2. Truncate HTML to fit context window (~100k chars)
    const truncatedHtml = html.substring(0, 100_000);

    // 3. Category-aware prompt hint
    const categoryHint = category_name
      ? `\nThis product is in the "${category_name}" category. Prioritize category-relevant specs.`
      : "";

    // 4. Claude extracts structured product data
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Extract product data from this HTML page. Source URL: ${url}${categoryHint}

Respond with ONLY a valid JSON object (no markdown fences):
{
  "product_name": "Full product name",
  "manufacturer": "Brand/manufacturer or null",
  "model_number": "Model/SKU or null",
  "specs": { "key": "value" for ALL technical specifications },
  "description": "Product description or null",
  "price": numeric retail price or null,
  "images": ["url1", "url2"] (product image URLs, max 6, full absolute URLs),
  "documents": [
    { "title": "doc title", "url": "full pdf url", "doc_type": "spec_sheet|installation_guide|cut_sheet|warranty|other" }
  ]
}

For specs, extract EVERY technical specification. Examples by category:
- Appliances: voltage, wattage, BTU, dimensions (H×W×D), capacity, energy rating, finish
- Flooring: wear layer, thickness, width, length, install method, AC rating, species
- Fixtures: lumens, wattage, color temp, mounting type, dimensions, UL listing
- Plumbing: flow rate, dimensions, finish, rough-in size, certifications
- Cabinets: material, finish, dimensions, soft-close, construction type

For documents, look for links to PDFs labeled as spec sheets, installation guides, cut sheets, manuals, warranties, etc.

For images, extract the main product photo URLs (not icons/thumbnails). Use absolute URLs.

HTML content:
${truncatedHtml}`,
        },
      ],
    });

    // 5. Parse response
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const productData = JSON.parse(jsonStr);
    productData.source_url = url;
    productData.scraped_at = new Date().toISOString();

    return new Response(JSON.stringify(productData), {
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
