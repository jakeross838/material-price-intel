import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Phone, Package, LayoutGrid, Home } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCatalogMaterials, useRoomCategoryMappings, useRoomTypes } from "@/hooks/useCatalog";
import { MaterialCard } from "@/components/catalog/MaterialCard";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import type { MaterialCategory } from "@/lib/types";
import type { CatalogRoomType } from "@/lib/roomCategoryDefaults";

// ===========================================
// CatalogPage - Public browseable catalog
// ===========================================
// Accessible at /catalog without authentication.
// Uses anonymous Supabase client with public
// SELECT RLS policies. Supports category-based
// and room-based browse modes.
// ===========================================

type BrowseMode = "category" | "room";

function useMaterialCategories() {
  return useQuery({
    queryKey: ["material_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as MaterialCategory[];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function CatalogPage() {
  const navigate = useNavigate();
  const [browseMode, setBrowseMode] = useState<BrowseMode>("category");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeRoomType, setActiveRoomType] = useState<CatalogRoomType | null>(null);
  const [roomCategoryId, setRoomCategoryId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Material Catalog | Ross Built Custom Homes";
    return () => { document.title = "Material Price Intel"; };
  }, []);

  const { data: categories, isLoading: categoriesLoading } = useMaterialCategories();
  const { roomTypes, config: roomConfig } = useRoomTypes();

  // Determine which categoryId to use for material fetch
  const effectiveCategoryId = browseMode === "category" ? activeCategoryId : roomCategoryId;
  const { data: materials, isLoading: materialsLoading } = useCatalogMaterials(effectiveCategoryId ?? undefined);

  // Room-category mappings for the selected room
  const { data: roomMappings } = useRoomCategoryMappings(activeRoomType ?? undefined);

  // Reset state when switching browse modes
  function handleBrowseModeChange(mode: BrowseMode) {
    setBrowseMode(mode);
    setActiveCategoryId(null);
    setActiveRoomType(null);
    setRoomCategoryId(null);
  }

  function handleRoomSelect(roomType: CatalogRoomType) {
    setActiveRoomType(roomType);
    setRoomCategoryId(null);
  }

  function handleRoomCategorySelect(categoryId: string | null) {
    setRoomCategoryId(categoryId);
  }

  const isLoading = categoriesLoading || materialsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50/60 via-white to-brand-50/40">
      {/* Header - matching EstimatorLayout branding */}
      <header className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white py-5 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
              <Building2 className="h-5 w-5 text-brand-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Ross Built Custom Homes
              </h1>
              <p className="text-brand-300/70 text-xs tracking-wide">
                Bradenton &amp; Sarasota, FL
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <a
              href="tel:+19417787600"
              className="flex items-center gap-1.5 text-xs text-brand-300/80 hover:text-white transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              (941) 778-7600
            </a>
            <a
              href="/estimate"
              className="text-xs font-semibold text-brand-100 bg-brand-500/30 px-3 py-1 rounded-full border border-brand-400/30 hover:bg-brand-500/50 transition-colors"
            >
              Free Estimate
            </a>
          </div>
        </div>
      </header>

      {/* Page title area */}
      <div className="bg-gradient-to-b from-brand-800/5 to-transparent py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900">
            Material Catalog
          </h2>
          <p className="text-brand-600/80 mt-2">
            Browse our curated selection of materials for your custom home
          </p>

          {/* Browse mode toggle */}
          <div className="flex items-center gap-1 mt-5 bg-muted rounded-lg p-1 w-fit">
            <button
              onClick={() => handleBrowseModeChange("category")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                browseMode === "category"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Browse by Category
            </button>
            <button
              onClick={() => handleBrowseModeChange("room")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                browseMode === "room"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              Browse by Room
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-10">
        {/* Category mode: flat category filter + material grid */}
        {browseMode === "category" && (
          <div className="space-y-6">
            {categories && categories.length > 0 && (
              <CategoryFilter
                categories={categories}
                activeId={activeCategoryId}
                onSelect={setActiveCategoryId}
              />
            )}

            {isLoading ? (
              <SkeletonGrid />
            ) : materials && materials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {materials.map((mat) => {
                  const primaryImage = mat.material_images?.find((img) => img.is_primary)
                    ?? mat.material_images?.[0]
                    ?? null;
                  return (
                    <MaterialCard
                      key={mat.id}
                      material={mat}
                      category={mat.material_categories}
                      primaryImage={primaryImage}
                      priceRange={null}
                      onClick={() => navigate(`/catalog/${mat.id}`)}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No materials in this category yet" />
            )}
          </div>
        )}

        {/* Room mode: room selection -> room categories -> materials */}
        {browseMode === "room" && (
          <div className="space-y-6">
            {/* Room type selection grid */}
            {!activeRoomType && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {roomTypes.map((rt) => {
                  const cfg = roomConfig[rt];
                  return (
                    <button
                      key={rt}
                      onClick={() => handleRoomSelect(rt)}
                      className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 hover:shadow-md hover:scale-[1.02] transition-all text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                        <Home className="h-5 w-5 text-brand-700" />
                      </div>
                      <span className="text-sm font-medium">{cfg.displayName}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {cfg.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Categories within a room */}
            {activeRoomType && (
              <div className="space-y-4">
                <button
                  onClick={() => { setActiveRoomType(null); setRoomCategoryId(null); }}
                  className="text-sm text-brand-600 hover:text-brand-800 font-medium"
                >
                  &larr; All Rooms
                </button>
                <h3 className="text-xl font-semibold">
                  {roomConfig[activeRoomType].displayName}
                </h3>

                {/* Room category pills */}
                {roomMappings && roomMappings.length > 0 && (
                  <CategoryFilter
                    categories={roomMappings.map((m) => m.material_categories)}
                    activeId={roomCategoryId}
                    onSelect={handleRoomCategorySelect}
                  />
                )}

                {/* Material grid */}
                {isLoading ? (
                  <SkeletonGrid />
                ) : materials && materials.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {materials.map((mat) => {
                      const primaryImage = mat.material_images?.find((img) => img.is_primary)
                        ?? mat.material_images?.[0]
                        ?? null;
                      return (
                        <MaterialCard
                          key={mat.id}
                          material={mat}
                          category={mat.material_categories}
                          primaryImage={primaryImage}
                          priceRange={null}
                          onClick={() => navigate(`/catalog/${mat.id}`)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    message={
                      roomCategoryId
                        ? "No materials in this category yet"
                        : "Select a category above to browse materials"
                    }
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer - matching EstimatorLayout */}
      <footer className="bg-brand-950 text-brand-300/60 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-2">
          <p className="text-xs">
            Browse our materials to plan your dream home. Contact us for pricing and availability.
          </p>
          <div className="flex items-center justify-center gap-2 pt-3">
            <Building2 className="h-3.5 w-3.5 text-brand-500/50" />
            <p className="text-xs text-brand-400/40">
              &copy; {new Date().getFullYear()} Ross Built Custom Homes &mdash;
              Licensed &amp; Insured &mdash; EST. 2006
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===========================================
// Skeleton grid for loading state
// ===========================================

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
          <div className="aspect-[3/2] bg-muted" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="flex justify-between">
              <div className="h-3 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================
// Empty state
// ===========================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Package className="h-12 w-12 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
