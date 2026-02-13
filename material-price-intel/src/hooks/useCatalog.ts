import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ROOM_TYPES, ROOM_TYPE_CONFIG } from "@/lib/roomCategoryDefaults";
import type { CatalogRoomType } from "@/lib/roomCategoryDefaults";
import type {
  Material,
  MaterialCategory,
  MaterialImage,
  MaterialDocument,
} from "@/lib/types";

// ===========================================
// Derived types for catalog queries
// ===========================================

export type RoomCategoryMappingWithCategory = {
  id: string;
  room_type: string;
  sort_order: number;
  material_categories: MaterialCategory;
};

export type CatalogMaterial = Material & {
  material_images: Pick<MaterialImage, "id" | "image_url" | "thumbnail_url" | "is_primary">[];
  material_categories: MaterialCategory | null;
};

export type CatalogMaterialDetail = Material & {
  material_images: MaterialImage[];
  material_documents: MaterialDocument[];
  material_categories: MaterialCategory | null;
};

// ===========================================
// useRoomCategoryMappings
// Fetches room_category_mapping rows with joined
// material_categories data. Filters by roomType if
// provided. 30-min staleTime (mappings rarely change).
// ===========================================

export function useRoomCategoryMappings(roomType?: CatalogRoomType) {
  return useQuery({
    queryKey: ["room_category_mappings", roomType ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("room_category_mapping")
        .select("id, room_type, sort_order, material_categories(id, name, display_name, sort_order)")
        .order("sort_order");

      if (roomType) {
        query = query.eq("room_type", roomType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RoomCategoryMappingWithCategory[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes -- mappings rarely change
  });
}

// ===========================================
// useCatalogMaterials
// Fetches active materials with primary images and
// category info. Filters by categoryId if provided.
// Works for both authenticated and anonymous users
// (public SELECT RLS policies).
// ===========================================

export function useCatalogMaterials(categoryId?: string) {
  return useQuery({
    queryKey: ["catalog_materials", categoryId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("materials")
        .select(
          "*, material_images(id, image_url, thumbnail_url, is_primary), material_categories(id, name, display_name, sort_order)"
        )
        .eq("is_active", true)
        .order("canonical_name");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as CatalogMaterial[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ===========================================
// useRoomTypes
// Returns the static ROOM_TYPES array and config.
// Not a query -- just wraps the constants for
// convenient use alongside the other hooks.
// ===========================================

export function useRoomTypes() {
  return {
    roomTypes: ROOM_TYPES,
    config: ROOM_TYPE_CONFIG,
  };
}

// ===========================================
// useCatalogMaterialDetail
// Fetches a single material with ALL images,
// ALL documents, and category data. For the
// detail/gallery view.
// ===========================================

export function useCatalogMaterialDetail(materialId: string | undefined) {
  return useQuery({
    queryKey: ["catalog_material_detail", materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select(
          "*, material_images(*), material_documents(*), material_categories(id, name, display_name, sort_order)"
        )
        .eq("id", materialId!)
        .single();
      if (error) throw error;
      return data as unknown as CatalogMaterialDetail;
    },
    enabled: !!materialId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
