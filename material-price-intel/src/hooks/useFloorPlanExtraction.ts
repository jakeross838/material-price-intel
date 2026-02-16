import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FloorPlanExtractionResult } from "@/lib/floorPlanTypes";

type FilePayload = {
  data: string;
  media_type: string;
};

export function useFloorPlanExtraction() {
  return useMutation({
    mutationFn: async (
      files: FilePayload[]
    ): Promise<FloorPlanExtractionResult> => {
      const { data, error } = await supabase.functions.invoke(
        "extract-floor-plan",
        { body: { files } }
      );
      if (error) throw error;
      return data as FloorPlanExtractionResult;
    },
  });
}
