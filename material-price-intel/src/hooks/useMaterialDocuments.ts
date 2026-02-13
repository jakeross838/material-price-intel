import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MaterialDocument, MaterialDocType } from "@/lib/types";

// ===========================================
// useMaterialDocuments
// Fetches all documents for a material, ordered
// by doc_type then title.
// ===========================================

export function useMaterialDocuments(materialId: string | undefined) {
  return useQuery({
    queryKey: ["material_documents", materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_documents")
        .select("*")
        .eq("material_id", materialId!)
        .order("doc_type")
        .order("title");
      if (error) throw error;
      return data as MaterialDocument[];
    },
    enabled: !!materialId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ===========================================
// useAddMaterialDocument
// Insert a material_documents record.
// ===========================================

type AddMaterialDocumentInput = {
  material_id: string;
  title: string;
  doc_url: string;
  doc_type?: MaterialDocType;
  storage_path?: string | null;
  metadata?: Record<string, unknown>;
};

export function useAddMaterialDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddMaterialDocumentInput) => {
      const { data, error } = await supabase
        .from("material_documents")
        .insert({
          material_id: input.material_id,
          title: input.title,
          doc_url: input.doc_url,
          doc_type: input.doc_type ?? "other",
          storage_path: input.storage_path ?? null,
          metadata: input.metadata ?? {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as MaterialDocument;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["material_documents", variables.material_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_material_detail", variables.material_id],
      });
    },
  });
}

// ===========================================
// useDeleteMaterialDocument
// Delete a document record (and storage file
// if storagePath is provided).
// ===========================================

export function useDeleteMaterialDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      docId: string;
      materialId: string;
      storagePath?: string | null;
    }) => {
      const { docId, storagePath } = input;

      // Delete from storage if it's an upload
      if (storagePath) {
        await supabase.storage.from("material-catalog").remove([storagePath]);
      }

      const { error } = await supabase
        .from("material_documents")
        .delete()
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["material_documents", variables.materialId],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_material_detail", variables.materialId],
      });
    },
  });
}
