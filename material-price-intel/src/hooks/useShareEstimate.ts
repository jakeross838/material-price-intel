import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EstimatorV2Input } from '@/lib/estimatorV2/types';

type ShareParams = {
  input: EstimatorV2Input;
  estimateLow: number;
  estimateHigh: number;
};

export function useShareEstimate() {
  return useMutation({
    mutationFn: async ({ input, estimateLow, estimateHigh }: ShareParams) => {
      const { data, error } = await supabase
        .from('shared_estimates')
        .insert({
          estimate_params: input as unknown as Record<string, unknown>,
          estimate_low: estimateLow,
          estimate_high: estimateHigh,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    },
  });
}

export function useLoadSharedEstimate(id: string | undefined) {
  return useQuery({
    queryKey: ['shared-estimate', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID provided');
      const { data, error } = await supabase
        .from('shared_estimates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: Infinity,
  });
}
