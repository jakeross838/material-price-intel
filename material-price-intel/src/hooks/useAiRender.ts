import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type RenderRequest = {
  selection_name: string;
  material_name: string;
  room_name: string;
  style_notes?: string;
};

type RenderResult = {
  image_url: string;
  revised_prompt: string;
};

export function useAiRender() {
  return useMutation({
    mutationFn: async (request: RenderRequest): Promise<RenderResult> => {
      const { data, error } = await supabase.functions.invoke(
        "render-selection",
        { body: request }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as RenderResult;
    },
  });
}
