import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EstimatorLead, EstimatorLeadStatus } from "@/lib/types";

export function useEstimatorLeads() {
  return useQuery({
    queryKey: ["estimator_leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimator_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EstimatorLead[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status?: EstimatorLeadStatus;
      admin_notes?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (input.status !== undefined) updates.status = input.status;
      if (input.admin_notes !== undefined) updates.admin_notes = input.admin_notes;

      const { error } = await supabase
        .from("estimator_leads")
        .update(updates)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimator_leads"] });
    },
  });
}
