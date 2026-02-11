import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MaterialPriceStats } from "@/lib/types";

// ===========================================
// useMaterialPriceStats
// Fetches price statistics for a single material
// via the get_material_price_stats RPC.
// Returns avg, min, max, latest price and quote count.
// ===========================================

export function useMaterialPriceStats(materialId: string | undefined) {
  return useQuery({
    queryKey: ["material_price_stats", materialId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_material_price_stats", {
        p_material_id: materialId!,
      });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as MaterialPriceStats;
    },
    enabled: !!materialId,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useBulkPriceStats
// Fetches price statistics for multiple materials
// in parallel. Used when loading an entire project's
// selections to show price intelligence for all.
// Returns a record keyed by materialId.
// ===========================================

export function useBulkPriceStats(materialIds: string[]) {
  return useQuery({
    queryKey: ["material_price_stats_bulk", ...materialIds.slice().sort()],
    queryFn: async () => {
      const results = await Promise.all(
        materialIds.map(async (id) => {
          const { data, error } = await supabase.rpc(
            "get_material_price_stats",
            { p_material_id: id }
          );
          if (error) return { id, stats: null };
          if (!data || data.length === 0) return { id, stats: null };
          return { id, stats: data[0] as MaterialPriceStats };
        })
      );

      const record: Record<string, MaterialPriceStats> = {};
      for (const r of results) {
        if (r.stats) {
          record[r.id] = r.stats;
        }
      }
      return record;
    },
    enabled: materialIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useAutoEstimate
// Mutation that auto-populates estimated_unit_price
// on a selection based on historical pricing data.
// Supports three strategies: average, latest, lowest.
// ===========================================

type AutoEstimateInput = {
  selectionId: string;
  roomId: string;
  materialId: string;
  quantity: number | null;
  priceStrategy: "average" | "latest" | "lowest";
};

export function useAutoEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectionId,
      materialId,
      quantity,
      priceStrategy,
    }: AutoEstimateInput) => {
      // Fetch price stats for the material
      const { data, error } = await supabase.rpc("get_material_price_stats", {
        p_material_id: materialId,
      });
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No pricing data available for this material");
      }

      const stats = data[0] as MaterialPriceStats;

      // Determine unit price based on strategy
      let estimated_unit_price: number | null = null;
      switch (priceStrategy) {
        case "average":
          estimated_unit_price = stats.avg_price;
          break;
        case "latest":
          estimated_unit_price = stats.latest_price;
          break;
        case "lowest":
          estimated_unit_price = stats.min_price;
          break;
      }

      if (estimated_unit_price == null) {
        throw new Error(
          `No ${priceStrategy} price available for this material`
        );
      }

      // Calculate estimated total
      const estimated_total =
        quantity != null
          ? quantity * estimated_unit_price
          : estimated_unit_price;

      // Update the selection
      const { error: updateError } = await supabase
        .from("project_selections")
        .update({ estimated_unit_price, estimated_total })
        .eq("id", selectionId);
      if (updateError) throw updateError;

      return { estimated_unit_price, estimated_total };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project_selections", variables.roomId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project_selections_all"],
      });
    },
  });
}
