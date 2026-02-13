import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProductData } from "@/lib/types";

// ===========================================
// useScrapeProduct
// Calls the scrape-product Edge Function to
// fetch and extract structured product data
// from a URL.
// ===========================================

export function useScrapeProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectionId,
      url,
      categoryName,
    }: {
      selectionId: string;
      url: string;
      categoryName?: string | null;
    }) => {
      // 1. Call Edge Function
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "scrape-product",
        { body: { url, category_name: categoryName ?? null } }
      );
      if (fnError) throw fnError;

      const productData = fnData as ProductData;

      // 2. Persist to project_selections
      const { error: updateError } = await supabase
        .from("project_selections")
        .update({
          product_url: url,
          manufacturer: productData.manufacturer ?? null,
          model_number: productData.model_number ?? null,
          product_data: productData,
        })
        .eq("id", selectionId);
      if (updateError) throw updateError;

      // 3. Save scraped images to selection_images
      if (productData.images?.length) {
        const imageInserts = productData.images.slice(0, 6).map((imgUrl, i) => ({
          selection_id: selectionId,
          image_type: "product_url" as const,
          external_url: imgUrl,
          source: new URL(url).hostname,
          is_primary: i === 0,
          sort_order: i,
        }));

        // Unset existing primary if we're setting one
        await supabase
          .from("selection_images")
          .update({ is_primary: false })
          .eq("selection_id", selectionId)
          .eq("is_primary", true);

        await supabase.from("selection_images").insert(imageInserts);
      }

      // 4. Save documents as 'document' type images
      if (productData.documents?.length) {
        const docInserts = productData.documents.map((doc, i) => ({
          selection_id: selectionId,
          image_type: "document" as const,
          external_url: doc.url,
          caption: doc.title,
          source: new URL(url).hostname,
          metadata: { doc_type: doc.doc_type } as Record<string, unknown>,
          sort_order: 100 + i,
        }));

        await supabase.from("selection_images").insert(docInserts);
      }

      return productData;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["selection_images", variables.selectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project_selections"],
      });
    },
  });
}

// ===========================================
// usePullSpecs
// One-click: scrape product URL + run AI
// analysis together. Returns both results.
// ===========================================

export function usePullSpecs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectionId,
      url,
      categoryName,
      selectionName,
      roomName,
    }: {
      selectionId: string;
      url: string;
      categoryName?: string | null;
      selectionName: string;
      roomName?: string;
    }) => {
      // 1. Scrape product data
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "scrape-product",
        { body: { url, category_name: categoryName ?? null } }
      );
      if (fnError) throw fnError;

      const productData = fnData as ProductData;

      // 2. Persist product data
      const { error: updateError } = await supabase
        .from("project_selections")
        .update({
          product_url: url,
          manufacturer: productData.manufacturer ?? null,
          model_number: productData.model_number ?? null,
          product_data: productData,
        })
        .eq("id", selectionId);
      if (updateError) throw updateError;

      // 3. Save scraped images
      if (productData.images?.length) {
        const imageInserts = productData.images.slice(0, 6).map((imgUrl, i) => ({
          selection_id: selectionId,
          image_type: "product_url" as const,
          external_url: imgUrl,
          source: new URL(url).hostname,
          is_primary: i === 0,
          sort_order: i,
        }));

        await supabase
          .from("selection_images")
          .update({ is_primary: false })
          .eq("selection_id", selectionId)
          .eq("is_primary", true);

        await supabase.from("selection_images").insert(imageInserts);
      }

      // 4. Save documents
      if (productData.documents?.length) {
        const docInserts = productData.documents.map((doc, i) => ({
          selection_id: selectionId,
          image_type: "document" as const,
          external_url: doc.url,
          caption: doc.title,
          source: new URL(url).hostname,
          metadata: { doc_type: doc.doc_type } as Record<string, unknown>,
          sort_order: 100 + i,
        }));

        await supabase.from("selection_images").insert(docInserts);
      }

      // 5. Run AI analysis with scraped context
      const { error: analysisError } = await supabase.functions.invoke(
        "analyze-selection",
        {
          body: {
            selection_id: selectionId,
            selection_name: productData.product_name || selectionName,
            room_name: roomName,
            category_name: categoryName,
            product_context: {
              manufacturer: productData.manufacturer,
              model_number: productData.model_number,
              specs: productData.specs,
              description: productData.description,
            },
          },
        }
      );
      // Analysis is best-effort — don't fail the whole operation
      if (analysisError) {
        console.warn("AI analysis failed (non-blocking):", analysisError);
      }

      return productData;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["selection_images", variables.selectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project_selections"],
      });
    },
  });
}
