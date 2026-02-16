import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  EstimatorConfig,
  EstimatorLead,
  FinishLevel,
  EstimateParams,
  EstimateBreakdownItem,
} from "@/lib/types";

// ===========================================
// useEstimatorConfig
// Fetches pricing config for a finish level.
// Public RLS — no auth required.
// ===========================================

export function useEstimatorConfig(finishLevel: FinishLevel | null) {
  return useQuery({
    queryKey: ["estimator_config", finishLevel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimator_config")
        .select("*")
        .eq("finish_level", finishLevel!)
        .order("sort_order");
      if (error) throw error;
      return data as EstimatorConfig[];
    },
    enabled: !!finishLevel,
    staleTime: 30 * 60 * 1000, // 30 min — config rarely changes
  });
}

// ===========================================
// useEstimatorOrgId
// Fetches the org ID from estimator_config
// (since anonymous users can't call user_org_id)
// ===========================================

export function useEstimatorOrgId() {
  return useQuery({
    queryKey: ["estimator_org_id"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimator_config")
        .select("organization_id")
        .limit(1)
        .single();
      if (error) throw error;
      return data.organization_id;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// ===========================================
// useSubmitLead
// Inserts a lead from the public form.
// ===========================================

// ===========================================
// useAllEstimatorConfig
// Fetches ALL estimator_config rows (all finish levels).
// Used by the room-by-room estimator that needs
// every category x finish_level combination.
// Public RLS — no auth required.
// ===========================================

export function useAllEstimatorConfig() {
  return useQuery({
    queryKey: ["estimator_config_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimator_config")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as EstimatorConfig[];
    },
    staleTime: 30 * 60 * 1000, // 30 min — config rarely changes
  });
}

// ===========================================
// useSubmitLead
// Inserts a lead from the public form.
// ===========================================

export function useSubmitLead() {
  return useMutation({
    mutationFn: async (input: {
      organization_id: string;
      contact_name: string;
      contact_email: string;
      contact_phone?: string;
      contact_message?: string;
      estimate_params: EstimateParams;
      estimate_low: number;
      estimate_high: number;
      estimate_breakdown: EstimateBreakdownItem[];
    }) => {
      const { data, error } = await supabase
        .from("estimator_leads")
        .insert({
          organization_id: input.organization_id,
          contact_name: input.contact_name,
          contact_email: input.contact_email,
          contact_phone: input.contact_phone ?? null,
          contact_message: input.contact_message ?? null,
          estimate_params: input.estimate_params as unknown as Record<string, unknown>,
          estimate_low: input.estimate_low,
          estimate_high: input.estimate_high,
          estimate_breakdown: input.estimate_breakdown as unknown as Record<string, unknown>,
          status: "new",
        });
      if (error) throw error;
    },
  });
}
