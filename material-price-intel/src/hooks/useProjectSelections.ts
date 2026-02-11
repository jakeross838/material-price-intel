import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ===========================================
// Joined selection type returned by queries
// ===========================================

const SELECTION_SELECT = `
  *,
  materials(id, canonical_name, species, dimensions, unit_of_measure),
  material_categories(id, name, display_name),
  suppliers(id, name)
` as const;

export type SelectionWithJoins = Awaited<
  ReturnType<typeof fetchRoomSelections>
>[number];

async function fetchRoomSelections(roomId: string) {
  const { data, error } = await supabase
    .from("project_selections")
    .select(SELECTION_SELECT)
    .eq("room_id", roomId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

// ===========================================
// useRoomSelections
// Fetches selections for a single room with
// joined material, category, and supplier data.
// ===========================================

export function useRoomSelections(roomId: string | undefined) {
  return useQuery({
    queryKey: ["project_selections", roomId],
    queryFn: () => fetchRoomSelections(roomId!),
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useProjectSelections
// Fetches ALL selections across all rooms for
// a project. Used for project-level summaries.
// ===========================================

export function useProjectSelections(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project_selections_all", projectId],
    queryFn: async () => {
      // First fetch rooms for the project
      const { data: rooms, error: roomsError } = await supabase
        .from("project_rooms")
        .select("id")
        .eq("project_id", projectId!);
      if (roomsError) throw roomsError;
      if (!rooms || rooms.length === 0) return [];

      const roomIds = rooms.map((r) => r.id);

      const { data, error } = await supabase
        .from("project_selections")
        .select(SELECTION_SELECT)
        .in("room_id", roomIds)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useCreateSelection
// Mutation to create a selection within a room.
// Invalidates both room-level and project-level
// selection caches.
// ===========================================

type CreateSelectionInput = {
  room_id: string;
  selection_name: string;
  category_id?: string | null;
  material_id?: string | null;
  description?: string | null;
  allowance_amount?: number | null;
  quantity?: number | null;
  unit?: string | null;
  estimated_unit_price?: number | null;
  estimated_total?: number | null;
  supplier_id?: string | null;
  notes?: string | null;
};

export function useCreateSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSelectionInput) => {
      const { data, error } = await supabase
        .from("project_selections")
        .insert({
          room_id: input.room_id,
          selection_name: input.selection_name,
          category_id: input.category_id ?? null,
          material_id: input.material_id ?? null,
          description: input.description ?? null,
          allowance_amount: input.allowance_amount ?? null,
          quantity: input.quantity ?? null,
          unit: input.unit ?? null,
          estimated_unit_price: input.estimated_unit_price ?? null,
          estimated_total: input.estimated_total ?? null,
          supplier_id: input.supplier_id ?? null,
          notes: input.notes ?? null,
          upgrade_status: "pending",
          sort_order: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project_selections", variables.room_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["project_selections_all"],
      });
    },
  });
}

// ===========================================
// useUpdateSelection
// Mutation to update a selection. Excludes
// variance_amount (it's a generated column).
// ===========================================

type UpdateSelectionInput = {
  id: string;
  room_id: string;
  updates: Record<string, unknown>;
};

export function useUpdateSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateSelectionInput) => {
      // Ensure variance_amount is never sent (generated column)
      const { variance_amount: _discard, ...safeUpdates } = updates as Record<
        string,
        unknown
      > & { variance_amount?: unknown };

      const { data, error } = await supabase
        .from("project_selections")
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project_selections", variables.room_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["project_selections_all"],
      });
    },
  });
}

// ===========================================
// useDeleteSelection
// Mutation to delete a selection.
// ===========================================

export function useDeleteSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; room_id: string }) => {
      const { error } = await supabase
        .from("project_selections")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project_selections", variables.room_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["project_selections_all"],
      });
    },
  });
}
