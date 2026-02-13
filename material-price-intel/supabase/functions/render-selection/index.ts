// ===========================================
// Edge Function: render-selection
// ===========================================
// Uses DALL-E 3 to generate a room visualization
// showing the selected material in context.
// Cost: ~$0.04 per image (1024x1024).
// ===========================================

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
    const { selection_name, material_name, room_name, style_notes } =
      await req.json();

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const materialDesc = material_name || selection_name;
    const roomDesc = room_name || "a room";
    const styleDesc = style_notes
      ? ` Style notes: ${style_notes}.`
      : "";

    const prompt = `Photorealistic interior design rendering of ${roomDesc} in a luxury custom home in Bradenton, Florida. The ${selection_name} features ${materialDesc}. Professional architectural photography style, natural lighting, high-end residential design.${styleDesc} No text, logos, or watermarks.`;

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url",
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errBody}`);
    }

    const result = await response.json();
    const imageUrl = result.data?.[0]?.url;
    const revisedPrompt = result.data?.[0]?.revised_prompt ?? prompt;

    if (!imageUrl) {
      throw new Error("No image URL in OpenAI response");
    }

    return new Response(
      JSON.stringify({
        image_url: imageUrl,
        revised_prompt: revisedPrompt,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
