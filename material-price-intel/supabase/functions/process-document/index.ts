// ===========================================
// Edge Function: process-document
// ===========================================
// Receives a document_id, retrieves the PDF from Supabase Storage,
// sends it to Claude Haiku 4.5 as a native document block,
// validates the extracted data for mathematical consistency,
// persists the quote and line items to the database, and
// updates the document status to completed or review_needed.
// ===========================================

import Anthropic from "npm:@anthropic-ai/sdk@latest";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { ExtractionResult, ExtractedSupplier } from "./types.ts";
import { buildExtractionMessages } from "./prompt.ts";
import { validateExtraction, type ValidationResult } from "./validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ===========================================
// Supplier Find-or-Create
// ===========================================
// Looks up a supplier by normalized_name within the organization.
// If not found, creates a new supplier record.
// Handles unique constraint race conditions gracefully.
// ===========================================

async function findOrCreateSupplier(
  supabase: SupabaseClient,
  organizationId: string,
  supplierData: ExtractedSupplier,
): Promise<string> {
  const normalizedName = supplierData.name.trim().toLowerCase();

  // Try to find existing supplier
  const { data: existing, error: findError } = await supabase
    .from("suppliers")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to query suppliers: ${findError.message}`);
  }

  if (existing) {
    return existing.id;
  }

  // Supplier not found -- create a new one
  const { data: newSupplier, error: insertError } = await supabase
    .from("suppliers")
    .insert({
      organization_id: organizationId,
      name: supplierData.name.trim(),
      normalized_name: normalizedName,
      contact_name: supplierData.contact_name,
      contact_email: supplierData.contact_email,
      contact_phone: supplierData.contact_phone,
      address: supplierData.address,
    })
    .select("id")
    .single();

  if (insertError) {
    // Handle unique constraint violation (race condition: another request
    // created the supplier between our SELECT and INSERT)
    if (
      insertError.code === "23505" ||
      insertError.message?.includes("duplicate key") ||
      insertError.message?.includes("unique constraint")
    ) {
      // Re-query to get the id created by the other request
      const { data: raceWinner, error: retryError } = await supabase
        .from("suppliers")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("normalized_name", normalizedName)
        .single();

      if (retryError || !raceWinner) {
        throw new Error(
          `Failed to find supplier after race condition: ${retryError?.message ?? "Not found"}`,
        );
      }

      return raceWinner.id;
    }

    throw new Error(`Failed to create supplier: ${insertError.message}`);
  }

  if (!newSupplier) {
    throw new Error("Supplier insert returned no data");
  }

  return newSupplier.id;
}

// ===========================================
// Extraction Persistence
// ===========================================
// Persists the validated extraction to the database:
// 1. Find or create supplier
// 2. Insert quote with all fields
// 3. Batch insert line items with sort_order
// 4. Update document status (completed or review_needed)
// ===========================================

async function persistExtraction(
  supabase: SupabaseClient,
  documentId: string,
  organizationId: string,
  extraction: ExtractionResult,
  validation: ValidationResult,
  rawResponse: string,
): Promise<string> {
  // 1. Find or create supplier
  const supplierId = await findOrCreateSupplier(
    supabase,
    organizationId,
    extraction.supplier,
  );

  // 2. Insert quote (including quote-level discount fields)
  const finalConfidence = validation.adjusted_confidence;

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      organization_id: organizationId,
      document_id: documentId,
      supplier_id: supplierId,
      quote_number: extraction.quote_number,
      quote_date: extraction.quote_date,
      valid_until: extraction.valid_until,
      project_name: extraction.project_name,
      subtotal: extraction.totals.subtotal,
      delivery_cost: extraction.totals.delivery_cost,
      tax_amount: extraction.totals.tax_amount,
      tax_rate: extraction.totals.tax_rate,
      total_amount: extraction.totals.total_amount,
      payment_terms: extraction.payment_terms,
      notes: extraction.notes,
      quote_discount_pct: extraction.quote_discount_pct,
      quote_discount_amount: extraction.quote_discount_amount,
      confidence_score: finalConfidence,
      raw_extraction: {
        extraction,
        validation_warnings: validation.warnings,
        raw_claude_response: rawResponse.substring(0, 50000), // Cap for JSONB storage
      },
      is_verified: false,
    })
    .select("id")
    .single();

  if (quoteError || !quote) {
    throw new Error(
      `Failed to insert quote: ${quoteError?.message ?? "No data returned"}`,
    );
  }

  const quoteId: string = quote.id;

  // 3. Insert line items with classification and effective pricing
  if (extraction.line_items.length > 0) {
    // --- Pass 1: Build line item rows with computed effective prices ---
    const lineItemRows = extraction.line_items.map((item, index) => ({
      quote_id: quoteId,
      raw_description: item.raw_description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      extended_price: item.extended_price,
      discount_pct: item.discount_pct,
      discount_amount: item.discount_amount,
      line_total: item.line_total,
      notes: item.notes,
      sort_order: index,
      material_id: null, // Set during Phase 5 normalization
      line_type: item.line_type ?? 'material',
      effective_unit_price: null as number | null, // computed below
      applies_to_line_item_id: null as string | null, // set in pass 2
    }));

    // --- Compute effective_unit_price for material items ---
    // For each material line, check if any discount line targets it
    for (let i = 0; i < extraction.line_items.length; i++) {
      const item = extraction.line_items[i];
      if (item.line_type !== 'material' || item.unit_price == null) continue;

      let effectivePrice = item.unit_price;

      // Check for per-item discounts on this material
      if (item.discount_pct != null) {
        effectivePrice = item.unit_price * (1 - item.discount_pct / 100);
      } else if (item.discount_amount != null && item.quantity != null && item.quantity > 0) {
        effectivePrice = item.unit_price - (item.discount_amount / item.quantity);
      }

      // Check for discount lines that target this material
      for (const discountItem of extraction.line_items) {
        if (discountItem.line_type !== 'discount') continue;
        if (discountItem.discount_applies_to !== i) continue;

        // This discount line targets material at index i
        if (discountItem.discount_pct != null) {
          effectivePrice = effectivePrice * (1 - discountItem.discount_pct / 100);
        } else if (discountItem.discount_amount != null && item.quantity != null && item.quantity > 0) {
          // Discount amount spread over the material's quantity
          effectivePrice = effectivePrice - (Math.abs(discountItem.discount_amount) / item.quantity);
        } else if (discountItem.line_total != null && discountItem.line_total < 0 && item.quantity != null && item.quantity > 0) {
          // Use negative line_total as discount amount
          effectivePrice = effectivePrice - (Math.abs(discountItem.line_total) / item.quantity);
        }
      }

      // Apply quote-wide discount if present (proportionally)
      if (extraction.quote_discount_pct != null) {
        effectivePrice = effectivePrice * (1 - extraction.quote_discount_pct / 100);
      }

      // Floor at 0 -- negative effective prices are invalid
      lineItemRows[i].effective_unit_price = Math.max(0, Math.round(effectivePrice * 10000) / 10000);
    }

    // --- Insert line items ---
    const { data: insertedLineItems, error: lineItemsError } = await supabase
      .from("line_items")
      .insert(lineItemRows)
      .select("id, sort_order");

    if (lineItemsError) {
      throw new Error(
        `Failed to insert line items: ${lineItemsError.message}`,
      );
    }

    // --- Pass 2: Set applies_to_line_item_id for discount lines ---
    if (insertedLineItems && insertedLineItems.length > 0) {
      // Build sort_order -> id mapping
      const sortOrderToId = new Map<number, string>();
      for (const row of insertedLineItems) {
        sortOrderToId.set(row.sort_order, row.id);
      }

      for (let i = 0; i < extraction.line_items.length; i++) {
        const item = extraction.line_items[i];
        if (item.line_type !== 'discount' || item.discount_applies_to == null) continue;

        const targetId = sortOrderToId.get(item.discount_applies_to);
        const discountId = sortOrderToId.get(i);
        if (targetId && discountId) {
          await supabase
            .from("line_items")
            .update({ applies_to_line_item_id: targetId })
            .eq("id", discountId);
        }
      }
    }
  }

  // 4. Update document status based on confidence
  if (finalConfidence >= 0.7) {
    // High confidence -- mark as completed via RPC
    const { error: completeError } = await supabase.rpc("complete_document", {
      p_document_id: documentId,
      p_quote_id: quoteId,
    });

    if (completeError) {
      throw new Error(
        `Failed to complete document: ${completeError.message}`,
      );
    }
  } else {
    // Low confidence -- mark as review_needed (no RPC for this status)
    const { error: reviewError } = await supabase
      .from("documents")
      .update({
        status: "review_needed",
        quote_id: quoteId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (reviewError) {
      throw new Error(
        `Failed to set document to review_needed: ${reviewError.message}`,
      );
    }
  }

  return quoteId;
}

// ===========================================
// Main Handler
// ===========================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let documentId: string | undefined;
  let supabase: SupabaseClient | undefined;

  try {
    // -----------------------------------------------
    // 1. Parse request
    // -----------------------------------------------
    const body = await req.json();
    documentId = body.document_id;

    if (!documentId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing document_id" }),
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
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // -----------------------------------------------
    // 3. Fetch the document record
    // -----------------------------------------------
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return new Response(
        JSON.stringify({
          success: false,
          error: fetchError?.message ?? "Document not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (document.status !== "pending" && document.status !== "processing") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Document is not in a processable state",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------
    // 4. Update status to processing (if still pending)
    // -----------------------------------------------
    if (document.status === "pending") {
      await supabase
        .from("documents")
        .update({
          status: "processing",
          started_at: new Date().toISOString(),
        })
        .eq("id", documentId);
    }

    // -----------------------------------------------
    // 5. Download PDF from Storage
    // -----------------------------------------------
    if (!document.file_path) {
      throw new Error("Document has no file_path -- cannot download PDF");
    }

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.file_path);

    if (downloadError || !fileBlob) {
      throw new Error(
        `Failed to download PDF: ${downloadError?.message ?? "No data returned"}`,
      );
    }

    // Convert Blob to base64 using chunked approach to avoid stack overflow
    const uint8Array = new Uint8Array(await fileBlob.arrayBuffer());
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64Data = btoa(binary);

    // -----------------------------------------------
    // 6. Call Claude API
    // -----------------------------------------------
    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    const { system, messages } = buildExtractionMessages(base64Data);

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16384,
      system,
      messages,
    });

    // -----------------------------------------------
    // 7. Parse Claude's response
    // -----------------------------------------------
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error(
        "Claude returned no text content in response",
      );
    }

    // Strip markdown code fences if present (e.g. ```json ... ```)
    let responseText = textBlock.text.trim();
    if (responseText.startsWith("```")) {
      responseText = responseText
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }

    let parsedResult: ExtractionResult;
    try {
      parsedResult = JSON.parse(responseText) as ExtractionResult;
    } catch (parseError) {
      // JSON parse failed -- mark document as failed with details
      await supabase.rpc("fail_document", {
        p_document_id: documentId,
        p_error_message: `JSON parse error: ${(parseError as Error).message}. Raw response: ${responseText.substring(0, 500)}`,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse Claude's extraction response as JSON",
          raw_response: responseText.substring(0, 1000),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------
    // 8. Validate extraction
    // -----------------------------------------------
    const validation = validateExtraction(parsedResult);

    // -----------------------------------------------
    // 9. Persist to database
    // -----------------------------------------------
    const quoteId = await persistExtraction(
      supabase,
      documentId,
      document.organization_id,
      parsedResult,
      validation,
      responseText,
    );

    // -----------------------------------------------
    // 10. Return success with validation info
    // -----------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        document_id: documentId,
        quote_id: quoteId,
        confidence: validation.adjusted_confidence,
        warnings: validation.warnings,
        status: validation.adjusted_confidence >= 0.7 ? "completed" : "review_needed",
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

    // Attempt to mark document as failed if we have the context
    if (documentId && supabase) {
      try {
        await supabase.rpc("fail_document", {
          p_document_id: documentId,
          p_error_message: `Persistence error: ${errorMessage}`,
        });
      } catch {
        // Best-effort -- don't mask the original error
      }
    }

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
