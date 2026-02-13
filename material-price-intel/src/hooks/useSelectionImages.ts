import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SelectionImage } from "@/lib/types";

// ===========================================
// useSelectionImages
// Fetches all images for a given selection.
// ===========================================

export function useSelectionImages(selectionId: string | undefined) {
  return useQuery({
    queryKey: ["selection_images", selectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selection_images")
        .select("*")
        .eq("selection_id", selectionId!)
        .order("is_primary", { ascending: false })
        .order("sort_order");
      if (error) throw error;
      return data as SelectionImage[];
    },
    enabled: !!selectionId,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// usePrimaryImage
// Returns just the primary image for a selection
// (used for thumbnail column).
// ===========================================

export function usePrimaryImage(selectionId: string) {
  return useQuery({
    queryKey: ["selection_images", selectionId, "primary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selection_images")
        .select("*")
        .eq("selection_id", selectionId)
        .eq("is_primary", true)
        .maybeSingle();
      if (error) throw error;
      return data as SelectionImage | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useAddSelectionImage
// Add an image record (URL or after upload).
// ===========================================

type AddImageInput = {
  selection_id: string;
  image_type: SelectionImage["image_type"];
  external_url?: string | null;
  storage_path?: string | null;
  thumbnail_url?: string | null;
  caption?: string | null;
  source?: string | null;
  is_primary?: boolean;
  metadata?: Record<string, unknown>;
};

export function useAddSelectionImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddImageInput) => {
      // If setting as primary, unset existing primary first
      if (input.is_primary) {
        await supabase
          .from("selection_images")
          .update({ is_primary: false })
          .eq("selection_id", input.selection_id)
          .eq("is_primary", true);
      }

      const { data, error } = await supabase
        .from("selection_images")
        .insert({
          selection_id: input.selection_id,
          image_type: input.image_type,
          external_url: input.external_url ?? null,
          storage_path: input.storage_path ?? null,
          thumbnail_url: input.thumbnail_url ?? null,
          caption: input.caption ?? null,
          source: input.source ?? null,
          is_primary: input.is_primary ?? false,
          metadata: input.metadata ?? {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as SelectionImage;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["selection_images", variables.selection_id],
      });
    },
  });
}

// ===========================================
// useSetPrimaryImage
// ===========================================

export function useSetPrimaryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      selectionId,
    }: {
      imageId: string;
      selectionId: string;
    }) => {
      // Unset all primary for this selection
      await supabase
        .from("selection_images")
        .update({ is_primary: false })
        .eq("selection_id", selectionId)
        .eq("is_primary", true);

      // Set the new primary
      const { error } = await supabase
        .from("selection_images")
        .update({ is_primary: true })
        .eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["selection_images", variables.selectionId],
      });
    },
  });
}

// ===========================================
// useDeleteSelectionImage
// ===========================================

export function useDeleteSelectionImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      imageId: string;
      selectionId: string;
      storagePath?: string | null;
    }) => {
      const { imageId, storagePath } = input;
      // Delete from storage if it's an upload
      if (storagePath) {
        await supabase.storage.from("selection-images").remove([storagePath]);
      }

      const { error } = await supabase
        .from("selection_images")
        .delete()
        .eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["selection_images", variables.selectionId],
      });
    },
  });
}

// ===========================================
// useUploadSelectionImage
// Uploads a file to storage then creates the DB record.
// ===========================================

export function useUploadSelectionImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectionId,
      orgId,
      file,
      isPrimary,
    }: {
      selectionId: string;
      orgId: string;
      file: File;
      isPrimary?: boolean;
    }) => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const storagePath = `${orgId}/${selectionId}/${crypto.randomUUID()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("selection-images")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      // Get public URL for thumbnail
      const { data: urlData } = supabase.storage
        .from("selection-images")
        .getPublicUrl(storagePath);

      // If setting primary, unset existing
      if (isPrimary) {
        await supabase
          .from("selection_images")
          .update({ is_primary: false })
          .eq("selection_id", selectionId)
          .eq("is_primary", true);
      }

      // Create DB record
      const { data, error } = await supabase
        .from("selection_images")
        .insert({
          selection_id: selectionId,
          image_type: "upload" as const,
          storage_path: storagePath,
          thumbnail_url: urlData.publicUrl,
          is_primary: isPrimary ?? false,
          source: "upload",
        })
        .select()
        .single();
      if (error) throw error;
      return data as SelectionImage;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["selection_images", variables.selectionId],
      });
    },
  });
}

// ===========================================
// Helper: get display URL for a selection image
// ===========================================

export function getImageDisplayUrl(image: SelectionImage): string | null {
  if (image.external_url) return image.external_url;
  if (image.thumbnail_url) return image.thumbnail_url;
  if (image.storage_path) {
    const { data } = supabase.storage
      .from("selection-images")
      .getPublicUrl(image.storage_path);
    return data.publicUrl;
  }
  return null;
}
