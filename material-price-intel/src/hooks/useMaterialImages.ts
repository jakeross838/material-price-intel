import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MaterialImage } from "@/lib/types";

// ===========================================
// useMaterialImages
// Fetches all images for a material, ordered by
// is_primary DESC, sort_order ASC.
// ===========================================

export function useMaterialImages(materialId: string | undefined) {
  return useQuery({
    queryKey: ["material_images", materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_images")
        .select("*")
        .eq("material_id", materialId!)
        .order("is_primary", { ascending: false })
        .order("sort_order");
      if (error) throw error;
      return data as MaterialImage[];
    },
    enabled: !!materialId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ===========================================
// useAddMaterialImage
// Insert a material_images record. If is_primary,
// unset existing primary first.
// ===========================================

type AddMaterialImageInput = {
  material_id: string;
  image_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  source?: string | null;
  is_primary?: boolean;
  metadata?: Record<string, unknown>;
};

export function useAddMaterialImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddMaterialImageInput) => {
      // If setting as primary, unset existing primary first
      if (input.is_primary) {
        await supabase
          .from("material_images")
          .update({ is_primary: false })
          .eq("material_id", input.material_id)
          .eq("is_primary", true);
      }

      const { data, error } = await supabase
        .from("material_images")
        .insert({
          material_id: input.material_id,
          image_url: input.image_url,
          thumbnail_url: input.thumbnail_url ?? null,
          caption: input.caption ?? null,
          source: input.source ?? null,
          is_primary: input.is_primary ?? false,
          metadata: input.metadata ?? {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as MaterialImage;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["material_images", variables.material_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_material_detail", variables.material_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_materials"],
      });
    },
  });
}

// ===========================================
// useUploadMaterialImage
// Uploads a file to 'material-catalog' storage
// bucket then creates the DB record.
// ===========================================

export function useUploadMaterialImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      materialId,
      orgId,
      file,
      isPrimary,
    }: {
      materialId: string;
      orgId: string;
      file: File;
      isPrimary?: boolean;
    }) => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const storagePath = `${orgId}/${materialId}/${crypto.randomUUID()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("material-catalog")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("material-catalog")
        .getPublicUrl(storagePath);

      // If setting primary, unset existing
      if (isPrimary) {
        await supabase
          .from("material_images")
          .update({ is_primary: false })
          .eq("material_id", materialId)
          .eq("is_primary", true);
      }

      // Create DB record
      const { data, error } = await supabase
        .from("material_images")
        .insert({
          material_id: materialId,
          image_url: urlData.publicUrl,
          storage_path: storagePath,
          thumbnail_url: urlData.publicUrl,
          is_primary: isPrimary ?? false,
          source: "upload",
        })
        .select()
        .single();
      if (error) throw error;
      return data as MaterialImage;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["material_images", variables.materialId],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_material_detail", variables.materialId],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_materials"],
      });
    },
  });
}

// ===========================================
// useSetPrimaryMaterialImage
// Unset all primary for material, then set new primary.
// ===========================================

export function useSetPrimaryMaterialImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      materialId,
    }: {
      imageId: string;
      materialId: string;
    }) => {
      // Unset all primary for this material
      await supabase
        .from("material_images")
        .update({ is_primary: false })
        .eq("material_id", materialId)
        .eq("is_primary", true);

      // Set the new primary
      const { error } = await supabase
        .from("material_images")
        .update({ is_primary: true })
        .eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["material_images", variables.materialId],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_material_detail", variables.materialId],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_materials"],
      });
    },
  });
}

// ===========================================
// useDeleteMaterialImage
// Delete from storage if storagePath exists,
// then delete DB record.
// ===========================================

export function useDeleteMaterialImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      imageId: string;
      materialId: string;
      storagePath?: string | null;
    }) => {
      const { imageId, storagePath } = input;

      // Delete from storage if it's an upload
      if (storagePath) {
        await supabase.storage.from("material-catalog").remove([storagePath]);
      }

      const { error } = await supabase
        .from("material_images")
        .delete()
        .eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["material_images", variables.materialId],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_material_detail", variables.materialId],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog_materials"],
      });
    },
  });
}

// ===========================================
// Helper: get display URL for a material image
// Checks image_url first (always present), then
// thumbnail_url, then storage_path.
// ===========================================

export function getMaterialImageDisplayUrl(image: MaterialImage): string | null {
  if (image.image_url) return image.image_url;
  if (image.thumbnail_url) return image.thumbnail_url;
  if (image.storage_path) {
    const { data } = supabase.storage
      .from("material-catalog")
      .getPublicUrl(image.storage_path);
    return data.publicUrl;
  }
  return null;
}
