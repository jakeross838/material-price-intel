import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuoteReviewUpdate = {
  quote_id: string;
  quote_number?: string | null;
  quote_date?: string | null;
  project_name?: string | null;
  payment_terms?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  subtotal?: number | null;
  delivery_cost?: number | null;
  tax_amount?: number | null;
  tax_rate?: number | null;
  total_amount?: number | null;
  line_items?: Array<{
    raw_description: string;
    quantity: number | null;
    unit: string | null;
    unit_price: number | null;
    extended_price: number | null;
    discount_pct: number | null;
    discount_amount: number | null;
    line_total: number | null;
    notes: string | null;
  }>;
};

// ---------------------------------------------------------------------------
// useApproveQuote
// ---------------------------------------------------------------------------

export function useApproveQuote() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase.rpc("approve_quote", {
        p_quote_id: quoteId,
      });
      if (error) throw new Error("Failed to approve quote: " + error.message);
    },
    onSuccess: (_data, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["documents", "recent"] });
      // Normalization runs async via Edge Function (~5-15 seconds after approval).
      // Re-fetch material data after a delay so normalization results appear.
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["materials"] });
        queryClient.invalidateQueries({
          queryKey: ["line_items_with_materials"],
        });
      }, 10_000);
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateQuoteReview
// ---------------------------------------------------------------------------

export function useUpdateQuoteReview() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, QuoteReviewUpdate>({
    mutationFn: async (data: QuoteReviewUpdate) => {
      const { error } = await supabase.rpc("update_quote_review", {
        p_quote_id: data.quote_id,
        p_quote_number: data.quote_number ?? null,
        p_quote_date: data.quote_date ?? null,
        p_valid_until: data.valid_until ?? null,
        p_project_name: data.project_name ?? null,
        p_subtotal: data.subtotal ?? null,
        p_delivery_cost: data.delivery_cost ?? null,
        p_tax_amount: data.tax_amount ?? null,
        p_tax_rate: data.tax_rate ?? null,
        p_total_amount: data.total_amount ?? null,
        p_payment_terms: data.payment_terms ?? null,
        p_notes: data.notes ?? null,
        p_line_items: JSON.stringify(data.line_items ?? []),
      });
      if (error)
        throw new Error("Failed to update quote review: " + error.message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["quote", variables.quote_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["line_items", variables.quote_id],
      });
    },
  });
}
