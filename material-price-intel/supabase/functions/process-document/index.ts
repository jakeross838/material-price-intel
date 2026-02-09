// ===========================================
// Edge Function: process-document
// ===========================================
// Receives a document_id, retrieves the PDF from Supabase Storage,
// sends it to Claude Haiku 4.5 as a native document block, and
// returns the structured extraction result.
//
// This function does NOT persist results to the database -- that
// is handled by Plan 02 (03-02-PLAN.md).
// ===========================================

import Anthropic from "npm:@anthropic-ai/sdk@latest";
import { createClient } from "npm:@supabase/supabase-js@2";
import type { ExtractionResult } from "./types.ts";
import { buildExtractionMessages } from "./prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let documentId: string | undefined;
  let supabase: ReturnType<typeof createClient> | undefined;

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
      model: "claude-haiku-4-5-20250315",
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

    let parsedResult: ExtractionResult;
    try {
      parsedResult = JSON.parse(textBlock.text) as ExtractionResult;
    } catch (parseError) {
      // JSON parse failed -- mark document as failed with details
      await supabase.rpc("fail_document", {
        p_document_id: documentId,
        p_error_message: `JSON parse error: ${(parseError as Error).message}. Raw response: ${textBlock.text.substring(0, 500)}`,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse Claude's extraction response as JSON",
          raw_response: textBlock.text.substring(0, 1000),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------
    // 8. Return the extraction result
    // -----------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        document_id: documentId,
        extraction: parsedResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    // -----------------------------------------------
    // 9. Global error handler
    // -----------------------------------------------
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Attempt to mark document as failed if we have the context
    if (documentId && supabase) {
      try {
        await supabase.rpc("fail_document", {
          p_document_id: documentId,
          p_error_message: errorMessage,
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
