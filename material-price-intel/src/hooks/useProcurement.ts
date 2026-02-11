import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProcurementItem, ProcurementStatus } from "@/lib/types";

// ===========================================
// Joined procurement item type returned by queries
// ===========================================

const PROCUREMENT_SELECT = `
  *,
  project_selections(
    id, selection_name, room_id, material_id, category_id,
    quantity, unit, estimated_unit_price, estimated_total,
    actual_unit_price, actual_total, allowance_amount
  ),
  quotes(id, supplier_id, quote_number, quote_date, suppliers(id, name)),
  line_items(id, raw_description, unit_price, effective_unit_price, quantity, unit)
` as const;

export type ProcurementItemWithJoins = Awaited<
  ReturnType<typeof fetchProcurementItems>
>[number];

async function fetchProcurementItems(selectionIds: string[]) {
  const { data, error } = await supabase
    .from("procurement_items")
    .select(PROCUREMENT_SELECT)
    .in("selection_id", selectionIds);
  if (error) throw error;
  return data;
}

// ===========================================
// Status ordering for sorting
// ===========================================

const STATUS_ORDER: Record<ProcurementStatus, number> = {
  not_quoted: 0,
  rfq_sent: 1,
  quoted: 2,
  awarded: 3,
  ordered: 4,
  delivered: 5,
  installed: 6,
};

// ===========================================
// useProcurementItems
// Fetches all procurement items for a project.
// First resolves rooms -> selections, then queries
// procurement_items by those selection IDs.
// ===========================================

export function useProcurementItems(projectId: string | undefined) {
  return useQuery({
    queryKey: ["procurement_items", projectId],
    queryFn: async () => {
      // Get rooms for the project
      const { data: rooms, error: roomsError } = await supabase
        .from("project_rooms")
        .select("id")
        .eq("project_id", projectId!);
      if (roomsError) throw roomsError;
      if (!rooms || rooms.length === 0) return [];

      const roomIds = rooms.map((r) => r.id);

      // Get selections for those rooms
      const { data: selections, error: selError } = await supabase
        .from("project_selections")
        .select("id")
        .in("room_id", roomIds);
      if (selError) throw selError;
      if (!selections || selections.length === 0) return [];

      const selectionIds = selections.map((s) => s.id);

      // Fetch procurement items for those selections
      const items = await fetchProcurementItems(selectionIds);

      // Sort: by status order first, then by selection name
      return items.sort((a, b) => {
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;
        const nameA =
          (a.project_selections as { selection_name?: string } | null)
            ?.selection_name ?? "";
        const nameB =
          (b.project_selections as { selection_name?: string } | null)
            ?.selection_name ?? "";
        return nameA.localeCompare(nameB);
      });
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useSelectionProcurement
// Fetches the single procurement item for a
// specific selection (unique FK).
// ===========================================

export function useSelectionProcurement(selectionId: string | undefined) {
  return useQuery({
    queryKey: ["procurement_item", selectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procurement_items")
        .select(PROCUREMENT_SELECT)
        .eq("selection_id", selectionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectionId,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useCreateProcurement
// Creates a procurement record for a selection.
// Starts with status 'not_quoted'.
// ===========================================

type CreateProcurementInput = {
  selection_id: string;
  projectId: string;
};

export function useCreateProcurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ selection_id }: CreateProcurementInput) => {
      const { data, error } = await supabase
        .from("procurement_items")
        .insert({
          selection_id,
          status: "not_quoted" as ProcurementStatus,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["procurement_items", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["procurement_item", variables.selection_id],
      });
    },
  });
}

// ===========================================
// useUpdateProcurement
// Updates procurement status and fields.
// ===========================================

type UpdateProcurementInput = {
  id: string;
  projectId: string;
  selectionId: string;
  updates: Partial<ProcurementItem>;
};

export function useUpdateProcurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateProcurementInput) => {
      const { data, error } = await supabase
        .from("procurement_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["procurement_items", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["procurement_item", variables.selectionId],
      });
    },
  });
}

// ===========================================
// useAwardQuote
// Awards a quote line item to a selection.
// This is the key buyout action: sets quote_id,
// line_item_id, committed_price, updates the
// selection's actual pricing and supplier.
// ===========================================

type AwardQuoteInput = {
  procurementId: string;
  selectionId: string;
  roomId: string;
  projectId: string;
  quoteId: string;
  lineItemId: string;
  committedPrice: number;
  unitPrice: number;
  supplierId: string;
};

export function useAwardQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      procurementId,
      selectionId,
      quoteId,
      lineItemId,
      committedPrice,
      unitPrice,
      supplierId,
    }: AwardQuoteInput) => {
      // Step 1: Update procurement_items with quote link and status
      const { error: procError } = await supabase
        .from("procurement_items")
        .update({
          quote_id: quoteId,
          line_item_id: lineItemId,
          committed_price: committedPrice,
          status: "awarded" as ProcurementStatus,
        })
        .eq("id", procurementId);
      if (procError) throw procError;

      // Step 2: Update project_selections with actual pricing and supplier
      // First fetch the selection to get allowance_amount for upgrade calc
      const { data: selection, error: fetchError } = await supabase
        .from("project_selections")
        .select("allowance_amount")
        .eq("id", selectionId)
        .single();
      if (fetchError) throw fetchError;

      // Calculate upgrade_status
      const allowance = selection.allowance_amount;
      let upgrade_status: "pending" | "standard" | "upgrade" | "downgrade" =
        "pending";
      if (allowance != null && allowance > 0) {
        if (committedPrice > allowance * 1.01) {
          upgrade_status = "upgrade";
        } else if (committedPrice < allowance * 0.99) {
          upgrade_status = "downgrade";
        } else {
          upgrade_status = "standard";
        }
      }

      const { error: selError } = await supabase
        .from("project_selections")
        .update({
          actual_unit_price: unitPrice,
          actual_total: committedPrice,
          supplier_id: supplierId,
          upgrade_status,
        })
        .eq("id", selectionId);
      if (selError) throw selError;

      return { procurementId, selectionId };
    },
    onSuccess: (_data, variables) => {
      // Invalidate procurement caches
      queryClient.invalidateQueries({
        queryKey: ["procurement_items", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["procurement_item", variables.selectionId],
      });
      // Invalidate selection caches
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
// useSearchQuotesForSelection
// Searches existing quote line items that match
// a selection's material. Used in QuoteLinkModal
// to find relevant quotes for buyout.
// ===========================================

type QuoteSearchResult = {
  id: string;
  raw_description: string;
  unit_price: number | null;
  effective_unit_price: number | null;
  quantity: number | null;
  unit: string | null;
  quote_id: string;
  quotes: {
    id: string;
    quote_number: string | null;
    quote_date: string | null;
    supplier_id: string;
    suppliers: {
      id: string;
      name: string;
    } | null;
  } | null;
};

export function useSearchQuotesForSelection(
  materialId: string | undefined,
  _categoryId: string | undefined
) {
  return useQuery({
    queryKey: ["quotes_for_selection", materialId, _categoryId],
    queryFn: async () => {
      if (!materialId) return [];

      const { data, error } = await supabase
        .from("line_items")
        .select(
          `
          id, raw_description, unit_price, effective_unit_price, quantity, unit, quote_id,
          quotes(id, quote_number, quote_date, supplier_id, suppliers(id, name))
        `
        )
        .eq("material_id", materialId)
        .eq("line_type", "material")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as QuoteSearchResult[];
    },
    enabled: !!(materialId),
    staleTime: 5 * 60 * 1000,
  });
}
