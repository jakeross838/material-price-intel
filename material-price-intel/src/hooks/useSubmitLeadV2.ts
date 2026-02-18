import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EstimatorV2Input, V2EstimateResult } from '@/lib/estimatorV2/types';

type SubmitLeadV2Input = {
  organization_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_message?: string;
  estimate_input: EstimatorV2Input;
  estimate_low: number;
  estimate_high: number;
};

/**
 * Saves a V2 estimator lead to the estimator_leads table.
 * Stores the V2 input shape in estimate_params with a _version marker
 * so the admin page can distinguish V2 from legacy leads.
 */
export function useSubmitLeadV2() {
  return useMutation({
    mutationFn: async (input: SubmitLeadV2Input) => {
      const { error } = await supabase
        .from('estimator_leads')
        .insert({
          organization_id: input.organization_id,
          contact_name: input.contact_name,
          contact_email: input.contact_email,
          contact_phone: input.contact_phone ?? null,
          contact_message: input.contact_message ?? null,
          estimate_params: {
            _version: 'v2',
            ...input.estimate_input,
          } as unknown as Record<string, unknown>,
          estimate_low: input.estimate_low,
          estimate_high: input.estimate_high,
          estimate_breakdown: [] as unknown as Record<string, unknown>,
          status: 'new',
        });
      if (error) throw error;
    },
  });
}

type SendV2EmailInput = {
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_message?: string;
  estimate_low: number;
  estimate_high: number;
  sqft: number;
  stories: number;
  style: string;
  bedrooms: number;
  bathrooms: number;
  room_summaries: { roomName: string; finishLevel: string; low: number; high: number }[];
};

/**
 * Sends the V2 estimate email via the existing edge function.
 * Maps V2 data into the legacy email format.
 */
export function useSendV2EstimateEmail() {
  return useMutation({
    mutationFn: async (input: SendV2EmailInput): Promise<{ sent: boolean; reason?: string }> => {
      const { data, error } = await supabase.functions.invoke(
        'send-estimate-email',
        { body: input },
      );
      if (error) throw error;
      return data as { sent: boolean; reason?: string };
    },
  });
}
