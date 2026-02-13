import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AiAnalysis } from "@/lib/types";

// ===========================================
// useAiAnalysis
// Triggers the analyze-selection Edge Function
// and caches the result in project_selections.ai_analysis.
// ===========================================

type AnalyzeInput = {
  selectionId: string;
  roomId: string;
  selectionName: string;
  materialName?: string | null;
  categoryName?: string | null;
  specs?: {
    species?: string | null;
    dimensions?: string | null;
    unit?: string | null;
  };
};

export function useAiAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AnalyzeInput): Promise<AiAnalysis> => {
      const { data, error } = await supabase.functions.invoke(
        "analyze-selection",
        {
          body: {
            selection_name: input.selectionName,
            material_name: input.materialName,
            category_name: input.categoryName,
            species: input.specs?.species,
            dimensions: input.specs?.dimensions,
            unit: input.specs?.unit,
          },
        }
      );
      if (error) throw error;

      const analysis = data as AiAnalysis;

      // Persist to project_selections.ai_analysis
      const { error: updateError } = await supabase
        .from("project_selections")
        .update({ ai_analysis: analysis })
        .eq("id", input.selectionId);
      if (updateError) throw updateError;

      return analysis;
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

// ===========================================
// useAiRender
// Triggers the render-selection Edge Function
// to generate a DALL-E 3 room visualization.
// ===========================================

type RenderInput = {
  selectionId: string;
  selectionName: string;
  materialName?: string | null;
  roomName?: string | null;
  styleNotes?: string;
};

export type RenderResult = {
  image_url: string;
  revised_prompt: string;
};

export function useAiRender() {
  return useMutation({
    mutationFn: async (input: RenderInput): Promise<RenderResult> => {
      const { data, error } = await supabase.functions.invoke(
        "render-selection",
        {
          body: {
            selection_name: input.selectionName,
            material_name: input.materialName,
            room_name: input.roomName,
            style_notes: input.styleNotes,
          },
        }
      );
      if (error) throw error;
      return data as RenderResult;
    },
  });
}
