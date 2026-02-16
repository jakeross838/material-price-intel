import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type RoomSummary = {
  roomName: string;
  finishLevel: string;
  low: number;
  high: number;
};

type SendEstimateEmailInput = {
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
  room_summaries: RoomSummary[];
};

export function useSendEstimateEmail() {
  return useMutation({
    mutationFn: async (
      input: SendEstimateEmailInput
    ): Promise<{ sent: boolean; reason?: string }> => {
      const { data, error } = await supabase.functions.invoke(
        "send-estimate-email",
        { body: input }
      );
      if (error) throw error;
      return data as { sent: boolean; reason?: string };
    },
  });
}
