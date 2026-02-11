import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { RoomType } from "@/lib/types";

// ===========================================
// useProjectRooms
// Fetches all rooms for a project, ordered by
// sort_order then name. RLS enforces org scoping.
// ===========================================

export function useProjectRooms(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project_rooms", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_rooms")
        .select("*")
        .eq("project_id", projectId!)
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useCreateRoom
// Mutation to create a room within a project.
// Invalidates the project_rooms cache on success.
// ===========================================

type CreateRoomInput = {
  project_id: string;
  name: string;
  room_type?: RoomType;
  notes?: string;
};

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoomInput) => {
      const { data, error } = await supabase
        .from("project_rooms")
        .insert({
          project_id: input.project_id,
          name: input.name,
          room_type: input.room_type ?? "interior",
          sort_order: 0,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project_rooms", variables.project_id],
      });
    },
  });
}

// ===========================================
// useUpdateRoom
// Mutation to update a room's name, type,
// sort_order, or notes.
// ===========================================

type UpdateRoomInput = {
  id: string;
  project_id: string;
  updates: {
    name?: string;
    room_type?: RoomType;
    sort_order?: number;
    notes?: string;
  };
};

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateRoomInput) => {
      const { data, error } = await supabase
        .from("project_rooms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project_rooms", variables.project_id],
      });
    },
  });
}

// ===========================================
// useDeleteRoom
// Mutation to delete a room. CASCADE will
// remove its selections automatically.
// ===========================================

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from("project_rooms")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project_rooms", variables.project_id],
      });
    },
  });
}
