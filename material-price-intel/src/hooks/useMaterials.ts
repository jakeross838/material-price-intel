import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ===========================================
// useMaterials
// Fetches all active materials for the current org,
// including their aliases. RLS enforces org scoping.
// ===========================================

export function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*, material_aliases(*)")
        .eq("is_active", true)
        .order("canonical_name");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes, matching project convention
  });
}

// ===========================================
// useMaterialAliases
// Fetches aliases for a specific material.
// Disabled when materialId is null.
// ===========================================

export function useMaterialAliases(materialId: string | null) {
  return useQuery({
    queryKey: ["material_aliases", materialId],
    queryFn: async () => {
      if (!materialId) return [];
      const { data, error } = await supabase
        .from("material_aliases")
        .select("*")
        .eq("material_id", materialId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!materialId,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useMergeMaterials
// Mutation to merge two materials via the merge_materials RPC.
// Invalidates material and alias caches on success.
// ===========================================

export function useMergeMaterials() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { keepId: string; mergeId: string }>({
    mutationFn: async ({ keepId, mergeId }) => {
      const { error } = await supabase.rpc("merge_materials", {
        p_keep_id: keepId,
        p_merge_id: mergeId,
      });
      if (error)
        throw new Error("Failed to merge materials: " + error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["material_aliases"] });
    },
  });
}

// ===========================================
// useLineItemMaterials
// Fetches line items for a quote with their joined material data.
// Used by QuoteDetailPage to show material badges on line items.
// ===========================================

export function useLineItemMaterials(quoteId: string) {
  return useQuery({
    queryKey: ["line_items_with_materials", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("line_items")
        .select(
          "id, raw_description, material_id, materials(id, canonical_name, species, dimensions)"
        )
        .eq("quote_id", quoteId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!quoteId,
    staleTime: 5 * 60 * 1000,
  });
}
