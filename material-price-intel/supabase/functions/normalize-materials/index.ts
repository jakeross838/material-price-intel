// ===========================================
// Edge Function: normalize-materials
// ===========================================
// Receives a quote_id, loads its unnormalized line items, uses
// Claude Haiku to classify each raw_description into structured
// material fields, fuzzy-matches against existing canonical materials,
// and either links to an existing material or creates a new one.
// Each raw_description is recorded as an alias in material_aliases.
//
// Triggered automatically by pg_net trigger on quote approval
// (is_verified = TRUE transition, see 009_material_aliases.sql).
// ===========================================

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { classifyMaterials, type MaterialClassification } from "./classifier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ===========================================
// Auto-link threshold: only automatically link a line item to an
// existing material when the fuzzy similarity score is >= 0.5.
// The RPC search uses 0.3 (broad net), but we require 0.5+ to
// auto-link, preventing false-positive matches.
// ===========================================
const AUTO_LINK_THRESHOLD = 0.5;
const SEARCH_THRESHOLD = 0.3;

// ===========================================
// Category Lookup Cache
// ===========================================
// Loads material_categories once per invocation and caches the
// name->id mapping for fast lookups during normalization.
// ===========================================

type CategoryMap = Record<string, string>;

async function loadCategoryMap(supabase: SupabaseClient): Promise<CategoryMap> {
  const { data: categories, error } = await supabase
    .from("material_categories")
    .select("id, name");

  if (error || !categories) {
    console.error("Failed to load material_categories:", error?.message);
    return {};
  }

  const map: CategoryMap = {};
  for (const cat of categories) {
    map[cat.name] = cat.id;
  }
  return map;
}

// ===========================================
// Find or Create Material
// ===========================================
// Attempts fuzzy match against existing materials, then either
// links to existing or creates a new canonical material.
// Returns the material_id to assign to the line item.
// ===========================================

async function findOrCreateMaterial(
  supabase: SupabaseClient,
  organizationId: string,
  quoteId: string,
  lineItemId: string,
  rawDescription: string,
  classification: MaterialClassification,
  categoryMap: CategoryMap,
): Promise<{
  materialId: string;
  isNew: boolean;
}> {
  // -----------------------------------------------
  // 1. Fuzzy match against existing materials
  // -----------------------------------------------
  const { data: matches, error: matchError } = await supabase.rpc(
    "find_similar_material",
    {
      p_org_id: organizationId,
      p_search_name: classification.canonical_name,
      p_threshold: SEARCH_THRESHOLD,
    },
  );

  if (matchError) {
    console.error(
      `Fuzzy match error for "${classification.canonical_name}":`,
      matchError.message,
    );
    // Fall through to create new material
  }

  // -----------------------------------------------
  // 2. Check if best match exceeds auto-link threshold
  // -----------------------------------------------
  if (matches && matches.length > 0) {
    // Sort by similarity descending to get best match
    const sorted = [...matches].sort(
      (a: { similarity: number }, b: { similarity: number }) =>
        b.similarity - a.similarity,
    );
    const bestMatch = sorted[0];

    if (bestMatch.similarity >= AUTO_LINK_THRESHOLD) {
      // Auto-link to existing material
      const materialId = bestMatch.id;

      // Add raw_description as alias (if not already present)
      await supabase.from("material_aliases").upsert(
        {
          material_id: materialId,
          alias: rawDescription,
          normalized_alias: rawDescription.trim().toLowerCase(),
          source_quote_id: quoteId,
        },
        { onConflict: "material_id,normalized_alias" },
      );

      // Also add the AI's canonical_name as alias (the normalized form)
      const canonicalNormalized = classification.canonical_name
        .trim()
        .toLowerCase();
      if (canonicalNormalized !== rawDescription.trim().toLowerCase()) {
        await supabase.from("material_aliases").upsert(
          {
            material_id: materialId,
            alias: classification.canonical_name,
            normalized_alias: canonicalNormalized,
            source_quote_id: quoteId,
          },
          { onConflict: "material_id,normalized_alias" },
        );
      }

      return { materialId, isNew: false };
    }
  }

  // -----------------------------------------------
  // 3. No sufficient match -- create new material
  // -----------------------------------------------

  // Look up category_id from classification.category
  let categoryId = categoryMap[classification.category];
  if (!categoryId) {
    // Default to "other" if category not found
    categoryId = categoryMap["other"];
    if (!categoryId) {
      // Last resort: query directly
      const { data: otherCat } = await supabase
        .from("material_categories")
        .select("id")
        .eq("name", "other")
        .maybeSingle();
      categoryId = otherCat?.id;
    }
  }

  if (!categoryId) {
    throw new Error(
      `No category found for "${classification.category}" and no "other" fallback`,
    );
  }

  // Insert new canonical material
  const { data: newMaterial, error: insertError } = await supabase
    .from("materials")
    .insert({
      organization_id: organizationId,
      category_id: categoryId,
      canonical_name: classification.canonical_name,
      species: classification.species,
      dimensions: classification.dimensions,
      grade: classification.grade,
      treatment: classification.treatment,
      unit_of_measure: classification.unit_of_measure,
      aliases: [rawDescription],
    })
    .select("id")
    .single();

  if (insertError) {
    // Handle unique constraint violation on (organization_id, canonical_name)
    // This happens if another concurrent request created the same material,
    // or if the AI generated the same canonical_name for different items.
    if (
      insertError.code === "23505" ||
      insertError.message?.includes("duplicate key") ||
      insertError.message?.includes("unique constraint")
    ) {
      // Re-query to get the existing material
      const { data: existing, error: retryError } = await supabase
        .from("materials")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("canonical_name", classification.canonical_name)
        .single();

      if (retryError || !existing) {
        throw new Error(
          `Failed to find material after race condition: ${retryError?.message ?? "Not found"}`,
        );
      }

      // Add alias to the existing material
      await supabase.from("material_aliases").upsert(
        {
          material_id: existing.id,
          alias: rawDescription,
          normalized_alias: rawDescription.trim().toLowerCase(),
          source_quote_id: quoteId,
        },
        { onConflict: "material_id,normalized_alias" },
      );

      return { materialId: existing.id, isNew: false };
    }

    throw new Error(
      `Failed to create material "${classification.canonical_name}": ${insertError.message}`,
    );
  }

  if (!newMaterial) {
    throw new Error("Material insert returned no data");
  }

  const materialId = newMaterial.id;

  // Add raw_description as alias in material_aliases table
  await supabase.from("material_aliases").upsert(
    {
      material_id: materialId,
      alias: rawDescription,
      normalized_alias: rawDescription.trim().toLowerCase(),
      source_quote_id: quoteId,
    },
    { onConflict: "material_id,normalized_alias" },
  );

  // Also add canonical_name as alias (for future matching)
  const canonicalNormalized = classification.canonical_name
    .trim()
    .toLowerCase();
  if (canonicalNormalized !== rawDescription.trim().toLowerCase()) {
    await supabase.from("material_aliases").upsert(
      {
        material_id: materialId,
        alias: classification.canonical_name,
        normalized_alias: canonicalNormalized,
        source_quote_id: quoteId,
      },
      { onConflict: "material_id,normalized_alias" },
    );
  }

  return { materialId, isNew: true };
}

// ===========================================
// Main Handler
// ===========================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // -----------------------------------------------
    // 1. Parse request
    // -----------------------------------------------
    const body = await req.json();
    const quoteId = body.quote_id;

    if (!quoteId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing quote_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------
    // 2. Create Supabase client (service role for elevated access)
    // -----------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // -----------------------------------------------
    // 3. Fetch and validate quote
    // -----------------------------------------------
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("id, organization_id, is_verified")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({
          success: false,
          error: quoteError?.message ?? "Quote not found",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!quote.is_verified) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Quote is not verified. Normalization only runs on approved quotes.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------
    // 4. Fetch unnormalized line items (material_id IS NULL)
    // -----------------------------------------------
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("line_items")
      .select("id, raw_description, line_type")
      .eq("quote_id", quoteId)
      .eq("line_type", "material")
      .is("material_id", null);

    if (lineItemsError) {
      throw new Error(
        `Failed to fetch line items: ${lineItemsError.message}`,
      );
    }

    if (!lineItems || lineItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No items to normalize",
          normalized: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `Normalizing ${lineItems.length} material line items for quote ${quoteId} (non-material items skipped)`,
    );

    // -----------------------------------------------
    // 5. Classify all descriptions via AI (single batch call)
    // -----------------------------------------------
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const descriptions = lineItems.map((li) => li.raw_description);
    const classifications = await classifyMaterials(
      descriptions,
      anthropicApiKey,
    );

    // -----------------------------------------------
    // 6. Load category map for material creation
    // -----------------------------------------------
    const categoryMap = await loadCategoryMap(supabase);

    // -----------------------------------------------
    // 7. Process each line item: match or create material
    // -----------------------------------------------
    let newMaterials = 0;
    let matchedExisting = 0;
    const errors: Array<{ lineItemId: string; description: string; error: string }> = [];

    for (let i = 0; i < lineItems.length; i++) {
      const lineItem = lineItems[i];
      const classification = classifications[i];

      try {
        // Find or create material
        const { materialId, isNew } = await findOrCreateMaterial(
          supabase,
          quote.organization_id,
          quoteId,
          lineItem.id,
          lineItem.raw_description,
          classification,
          categoryMap,
        );

        if (isNew) {
          newMaterials++;
        } else {
          matchedExisting++;
        }

        // Update line_item with the material_id
        const { error: updateError } = await supabase
          .from("line_items")
          .update({ material_id: materialId })
          .eq("id", lineItem.id);

        if (updateError) {
          console.error(
            `Failed to update line_item ${lineItem.id}: ${updateError.message}`,
          );
          errors.push({
            lineItemId: lineItem.id,
            description: lineItem.raw_description,
            error: `Failed to update material_id: ${updateError.message}`,
          });
        }
      } catch (itemError) {
        // Log error but continue processing remaining items
        const errorMessage =
          itemError instanceof Error ? itemError.message : "Unknown error";
        console.error(
          `Error normalizing line item ${lineItem.id} ("${lineItem.raw_description}"): ${errorMessage}`,
        );
        errors.push({
          lineItemId: lineItem.id,
          description: lineItem.raw_description,
          error: errorMessage,
        });
      }
    }

    // -----------------------------------------------
    // 8. Return results
    // -----------------------------------------------
    const normalized = newMaterials + matchedExisting;

    return new Response(
      JSON.stringify({
        success: true,
        quote_id: quoteId,
        normalized,
        new_materials: newMaterials,
        matched_existing: matchedExisting,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    // -----------------------------------------------
    // Global error handler
    // -----------------------------------------------
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("normalize-materials error:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
