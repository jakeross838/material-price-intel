import { useState, useRef, useCallback } from "react";
import {
  Camera,
  Image as ImageIcon,
  Search,
  Sparkles,
  Paintbrush,
  Star,
  Trash2,
  Loader2,
  Link as LinkIcon,
  Upload,
  ExternalLink,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Leaf,
  Globe,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSelectionImages,
  useAddSelectionImage,
  useSetPrimaryImage,
  useDeleteSelectionImage,
  useUploadSelectionImage,
  getImageDisplayUrl,
} from "@/hooks/useSelectionImages";
import {
  useImageSearch,
  triggerUnsplashDownload,
} from "@/hooks/useImageSearch";
import type { UnsplashResult } from "@/hooks/useImageSearch";
import { useAiAnalysis, useAiRender } from "@/hooks/useAiAnalysis";
import type { RenderResult } from "@/hooks/useAiAnalysis";
import { useScrapeProduct, usePullSpecs } from "@/hooks/useProductData";
import type { SelectionWithJoins } from "@/hooks/useProjectSelections";
import type { AiAnalysis, ProductData, SelectionImage } from "@/lib/types";
import { getPrioritizedSpecs } from "@/lib/categorySpecTemplates";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// ===========================================
// Tabs
// ===========================================

type PanelTab = "photos" | "search" | "analysis" | "render" | "product";

const TABS: { key: PanelTab; label: string; icon: typeof Camera }[] = [
  { key: "product", label: "Product", icon: Globe },
  { key: "photos", label: "Photos", icon: ImageIcon },
  { key: "search", label: "Search", icon: Search },
  { key: "analysis", label: "AI Analysis", icon: Sparkles },
  { key: "render", label: "AI Render", icon: Paintbrush },
];

// ===========================================
// Props
// ===========================================

type Props = {
  selection: SelectionWithJoins;
  roomId: string;
  roomName?: string;
};

// ===========================================
// Main Component
// ===========================================

export function SelectionImagePanel({ selection, roomId, roomName }: Props) {
  const [activeTab, setActiveTab] = useState<PanelTab>("product");

  return (
    <div className="border rounded-lg bg-muted/20 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b bg-background">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-3">
        {activeTab === "product" && (
          <ProductTab selection={selection} roomName={roomName} />
        )}
        {activeTab === "photos" && (
          <PhotosTab selection={selection} />
        )}
        {activeTab === "search" && (
          <SearchTab selection={selection} />
        )}
        {activeTab === "analysis" && (
          <AnalysisTab selection={selection} roomId={roomId} />
        )}
        {activeTab === "render" && (
          <RenderTab selection={selection} roomName={roomName} />
        )}
      </div>
    </div>
  );
}

// ===========================================
// Photos Tab
// ===========================================

function PhotosTab({ selection }: { selection: SelectionWithJoins }) {
  const { data: images, isLoading } = useSelectionImages(selection.id);
  const addImage = useAddSelectionImage();
  const setPrimary = useSetPrimaryImage();
  const deleteImage = useDeleteSelectionImage();
  const uploadImage = useUploadSelectionImage();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const getOrgId = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    return data?.organization_id ?? null;
  }, [user]);

  async function handlePasteUrl() {
    const url = urlInput.trim();
    if (!url) return;
    const isFirst = !images || images.length === 0;
    addImage.mutate(
      {
        selection_id: selection.id,
        image_type: "product_url",
        external_url: url,
        thumbnail_url: url,
        is_primary: isFirst,
        source: new URL(url).hostname,
      },
      { onSuccess: () => setUrlInput("") }
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const orgId = await getOrgId();
      if (!orgId) throw new Error("Organization not found");
      const isFirst = !images || images.length === 0;
      await uploadImage.mutateAsync({
        selectionId: selection.id,
        orgId,
        file,
        isPrimary: isFirst,
      });
    } catch {
      // Mutation error handling is in React Query
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading images...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images && images.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img) => (
            <ImageCard
              key={img.id}
              image={img}
              onSetPrimary={() =>
                setPrimary.mutate({
                  imageId: img.id,
                  selectionId: selection.id,
                })
              }
              onDelete={() =>
                deleteImage.mutate({
                  imageId: img.id,
                  selectionId: selection.id,
                  storagePath: img.storage_path,
                })
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Camera className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No photos yet</p>
        </div>
      )}

      {/* Add photo controls */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-1">
          <Input
            placeholder="Paste image URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePasteUrl()}
            className="h-8 text-xs"
          />
          <Button
            size="xs"
            variant="outline"
            onClick={handlePasteUrl}
            disabled={!urlInput.trim() || addImage.isPending}
          >
            <LinkIcon className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          size="xs"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Upload className="h-3 w-3 mr-1" />
          )}
          Upload
        </Button>
      </div>
    </div>
  );
}

// ===========================================
// Image Card
// ===========================================

function ImageCard({
  image,
  onSetPrimary,
  onDelete,
}: {
  image: SelectionImage;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  const url = getImageDisplayUrl(image);

  return (
    <div className="relative group rounded-md overflow-hidden border bg-background aspect-square">
      {url ? (
        <img
          src={url}
          alt={image.caption ?? "Selection image"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      {/* Primary badge */}
      {image.is_primary && (
        <div className="absolute top-1 left-1 bg-amber-500 text-white rounded-full p-0.5">
          <Star className="h-2.5 w-2.5 fill-current" />
        </div>
      )}

      {/* Hover controls */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        {!image.is_primary && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onSetPrimary}
            className="text-white hover:bg-white/20"
            title="Set as primary"
          >
            <Star className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onDelete}
          className="text-white hover:bg-white/20"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-white hover:bg-white/20"
            title="Open full size"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Source label */}
      {image.source && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate">
          {image.source}
        </div>
      )}
    </div>
  );
}

// ===========================================
// Search Tab (Unsplash)
// ===========================================

function SearchTab({ selection }: { selection: SelectionWithJoins }) {
  const materialName =
    (selection.materials as { canonical_name: string } | null)?.canonical_name ??
    selection.selection_name;
  const [query, setQuery] = useState(materialName);
  const { results, isSearching, error, search } = useImageSearch();
  const addImage = useAddSelectionImage();
  const { data: existingImages } = useSelectionImages(selection.id);

  function handleSave(result: UnsplashResult) {
    const isFirst = !existingImages || existingImages.length === 0;
    triggerUnsplashDownload(result.links.download_location);
    addImage.mutate({
      selection_id: selection.id,
      image_type: "web_search",
      external_url: result.urls.regular,
      thumbnail_url: result.urls.small,
      caption: result.alt_description ?? undefined,
      source: `unsplash.com/@${result.user.name}`,
      is_primary: isFirst,
      metadata: {
        unsplash_id: result.id,
        photographer: result.user.name,
        photographer_url: result.user.links.html,
      },
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search(query)}
          placeholder="Search for images..."
          className="h-8 text-xs"
        />
        <Button
          size="xs"
          onClick={() => search(query)}
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Search className="h-3 w-3 mr-1" />
          )}
          Search
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}

      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSave(r)}
                className="relative rounded-md overflow-hidden border bg-background aspect-square hover:ring-2 hover:ring-primary transition-all"
              >
                <img
                  src={r.urls.small}
                  alt={r.alt_description ?? "Search result"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Photos from{" "}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Unsplash
            </a>
          </p>
        </>
      ) : (
        !isSearching &&
        !error && (
          <p className="text-center text-xs text-muted-foreground py-4">
            Search Unsplash for product and material photos
          </p>
        )
      )}
    </div>
  );
}

// ===========================================
// AI Analysis Tab
// ===========================================

function AnalysisTab({
  selection,
  roomId,
}: {
  selection: SelectionWithJoins;
  roomId: string;
}) {
  const aiAnalysis = useAiAnalysis();
  const cached = selection.ai_analysis as AiAnalysis | null;
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(cached);

  const materialName =
    (selection.materials as { canonical_name: string } | null)?.canonical_name;
  const categoryName =
    (selection.material_categories as { display_name: string } | null)
      ?.display_name;
  const materialData = selection.materials as {
    species?: string;
    dimensions?: string;
    unit_of_measure?: string;
  } | null;

  async function handleAnalyze() {
    const result = await aiAnalysis.mutateAsync({
      selectionId: selection.id,
      roomId,
      selectionName: selection.selection_name,
      materialName,
      categoryName,
      specs: {
        species: materialData?.species,
        dimensions: materialData?.dimensions,
        unit: materialData?.unit_of_measure,
      },
    });
    setAnalysis(result);
  }

  if (!analysis) {
    return (
      <div className="text-center py-6 space-y-3">
        <Sparkles className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
        <div>
          <p className="text-sm font-medium">AI Material Analysis</p>
          <p className="text-xs text-muted-foreground mt-1">
            Get detailed pros/cons, durability ratings, and Florida-specific
            notes for{" "}
            <span className="font-medium">
              {materialName || selection.selection_name}
            </span>
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleAnalyze}
          disabled={aiAnalysis.isPending}
        >
          {aiAnalysis.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Analyze Material
            </>
          )}
        </Button>
        {aiAnalysis.isError && (
          <p className="text-xs text-destructive">
            {aiAnalysis.error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <p className="text-sm">{analysis.summary}</p>

      {/* Specs table (category-aware ordering) */}
      {Object.keys(analysis.specs).length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {getPrioritizedSpecs(
                analysis.specs,
                (selection.material_categories as { name: string } | null)?.name ?? null
              ).map((spec) => (
                <tr key={spec.key} className="border-b last:border-0">
                  <td className={`px-2 py-1 font-medium w-1/3 ${spec.isHighlighted ? "bg-primary/5 text-primary" : "bg-muted/30 text-muted-foreground"}`}>
                    {spec.label}
                    {spec.isHighlighted && <span className="ml-1 text-[10px]">&#9733;</span>}
                  </td>
                  <td className="px-2 py-1">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pros / Cons */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-xs font-medium text-green-700 flex items-center gap-1 mb-1">
            <ThumbsUp className="h-3 w-3" /> Pros
          </h4>
          <ul className="space-y-0.5">
            {analysis.pros.map((p, i) => (
              <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                <span className="mt-0.5 shrink-0">+</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-medium text-red-700 flex items-center gap-1 mb-1">
            <ThumbsDown className="h-3 w-3" /> Cons
          </h4>
          <ul className="space-y-0.5">
            {analysis.cons.map((c, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                <span className="mt-0.5 shrink-0">-</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Durability + Best Uses */}
      <div className="flex items-center gap-4 text-xs">
        <span className="font-medium text-muted-foreground">Durability:</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-sm ${
                i < analysis.durability_rating
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-muted-foreground">
          {analysis.durability_rating}/10
        </span>
      </div>

      {analysis.best_uses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.best_uses.map((use, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
            >
              {use}
            </span>
          ))}
        </div>
      )}

      {/* Florida Notes */}
      {analysis.florida_notes && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 flex gap-2">
          <Leaf className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-800">
              Florida / Gulf Coast Notes
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {analysis.florida_notes}
            </p>
          </div>
        </div>
      )}

      {/* Re-analyze button */}
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          variant="outline"
          onClick={handleAnalyze}
          disabled={aiAnalysis.isPending}
        >
          {aiAnalysis.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          Re-analyze
        </Button>
        {analysis.analyzed_at && (
          <span className="text-[10px] text-muted-foreground">
            Analyzed:{" "}
            {new Date(analysis.analyzed_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// ===========================================
// Product Tab (URL scrape + specs + documents)
// ===========================================

function ProductTab({
  selection,
  roomName,
}: {
  selection: SelectionWithJoins;
  roomName?: string;
}) {
  const scrapeProduct = useScrapeProduct();
  const pullSpecs = usePullSpecs();
  const addImage = useAddSelectionImage();
  const { data: existingImages } = useSelectionImages(selection.id);

  const productData = selection.product_data as ProductData | null;
  const categoryName =
    (selection.material_categories as { name: string } | null)?.name ?? null;
  const [urlInput, setUrlInput] = useState(selection.product_url ?? "");

  async function handleScrape() {
    const url = urlInput.trim();
    if (!url) return;
    await scrapeProduct.mutateAsync({
      selectionId: selection.id,
      url,
      categoryName,
    });
  }

  async function handlePullSpecs() {
    const url = urlInput.trim();
    if (!url) return;
    await pullSpecs.mutateAsync({
      selectionId: selection.id,
      url,
      categoryName,
      selectionName: selection.selection_name,
      roomName,
    });
  }

  function handleSaveImage(imgUrl: string) {
    const isFirst = !existingImages || existingImages.length === 0;
    addImage.mutate({
      selection_id: selection.id,
      image_type: "product_url",
      external_url: imgUrl,
      thumbnail_url: imgUrl,
      is_primary: isFirst,
      source: productData?.source_url
        ? new URL(productData.source_url).hostname
        : "product",
    });
  }

  const isLoading = scrapeProduct.isPending || pullSpecs.isPending;

  // No product data yet — show URL input
  if (!productData) {
    return (
      <div className="space-y-3">
        <div className="text-center py-4">
          <Globe className="h-8 w-8 mx-auto text-muted-foreground opacity-40 mb-2" />
          <p className="text-sm font-medium">Product Data Hub</p>
          <p className="text-xs text-muted-foreground mt-1">
            Paste a product URL to auto-pull specs, images, and documents
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="https://www.homedepot.com/p/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePullSpecs()}
            className="h-8 text-xs"
          />
          <Button
            size="xs"
            onClick={handlePullSpecs}
            disabled={!urlInput.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Globe className="h-3 w-3 mr-1" />
            )}
            Pull Specs
          </Button>
        </div>

        {(scrapeProduct.isError || pullSpecs.isError) && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {(scrapeProduct.error ?? pullSpecs.error)?.message ?? "Scrape failed"}
          </p>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Supports Home Depot, Lowe's, Build.com, manufacturer sites, and more.
          ~$0.002 per scrape.
        </p>
      </div>
    );
  }

  // Have product data — show full view
  const specs = getPrioritizedSpecs(productData.specs ?? {}, categoryName);

  return (
    <div className="space-y-3">
      {/* URL bar + re-scrape */}
      <div className="flex gap-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="h-8 text-xs"
        />
        <Button
          size="xs"
          variant="outline"
          onClick={handleScrape}
          disabled={!urlInput.trim() || isLoading}
          title="Re-scrape"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Manufacturer / Model */}
      <div className="flex gap-4 text-xs">
        {productData.manufacturer && (
          <div>
            <span className="text-muted-foreground">Manufacturer: </span>
            <span className="font-medium">{productData.manufacturer}</span>
          </div>
        )}
        {productData.model_number && (
          <div>
            <span className="text-muted-foreground">Model: </span>
            <span className="font-medium">{productData.model_number}</span>
          </div>
        )}
        {productData.price != null && (
          <div>
            <span className="text-muted-foreground">Price: </span>
            <span className="font-medium">
              ${productData.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Specifications */}
      {specs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Specifications
          </p>
          <div className="border rounded-md overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.key} className="border-b last:border-0">
                    <td
                      className={`px-2 py-1 font-medium w-1/3 ${
                        spec.isHighlighted
                          ? "bg-primary/5 text-primary"
                          : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      {spec.label}
                      {spec.isHighlighted && (
                        <span className="ml-1 text-[10px]">&#9733;</span>
                      )}
                    </td>
                    <td className="px-2 py-1">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Documents */}
      {productData.documents?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Documents
          </p>
          <div className="space-y-1">
            {productData.documents.map((doc, i) => (
              <a
                key={i}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1.5 rounded border hover:bg-muted/50 transition-colors text-xs"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{doc.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 capitalize">
                  {doc.doc_type.replace(/_/g, " ")}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Product Images */}
      {productData.images?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Product Images
          </p>
          <div className="grid grid-cols-4 gap-2">
            {productData.images.slice(0, 6).map((imgUrl, i) => (
              <button
                key={i}
                onClick={() => handleSaveImage(imgUrl)}
                className="relative rounded-md overflow-hidden border bg-background aspect-square hover:ring-2 hover:ring-primary transition-all"
                title="Save to Photos"
              >
                <img
                  src={imgUrl}
                  alt={`Product image ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Click an image to save it to Photos
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          onClick={handlePullSpecs}
          disabled={!urlInput.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          Pull Specs + Analysis
        </Button>
        {productData.scraped_at && (
          <span className="text-[10px] text-muted-foreground">
            Scraped:{" "}
            {new Date(productData.scraped_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {(scrapeProduct.isError || pullSpecs.isError) && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {(scrapeProduct.error ?? pullSpecs.error)?.message ?? "Failed"}
        </p>
      )}
    </div>
  );
}

// ===========================================
// AI Render Tab
// ===========================================

function RenderTab({
  selection,
  roomName,
}: {
  selection: SelectionWithJoins;
  roomName?: string;
}) {
  const aiRender = useAiRender();
  const addImage = useAddSelectionImage();
  const [styleNotes, setStyleNotes] = useState("");
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);

  const materialName =
    (selection.materials as { canonical_name: string } | null)?.canonical_name;

  async function handleRender() {
    const result = await aiRender.mutateAsync({
      selectionId: selection.id,
      selectionName: selection.selection_name,
      materialName,
      roomName,
      styleNotes: styleNotes.trim() || undefined,
    });
    setRenderResult(result);
  }

  function handleSaveRender() {
    if (!renderResult) return;
    addImage.mutate({
      selection_id: selection.id,
      image_type: "ai_render",
      external_url: renderResult.image_url,
      thumbnail_url: renderResult.image_url,
      caption: `AI render: ${selection.selection_name}`,
      source: "DALL-E 3",
      metadata: { revised_prompt: renderResult.revised_prompt },
    });
  }

  return (
    <div className="space-y-3">
      {renderResult ? (
        <>
          <div className="rounded-md overflow-hidden border">
            <img
              src={renderResult.image_url}
              alt={`AI render of ${selection.selection_name}`}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="xs"
              onClick={handleSaveRender}
              disabled={addImage.isPending}
            >
              {addImage.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <ImageIcon className="h-3 w-3 mr-1" />
              )}
              Save to Photos
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setRenderResult(null)}
            >
              New Render
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            {renderResult.revised_prompt}
          </p>
        </>
      ) : (
        <div className="space-y-3">
          <div className="text-center py-4">
            <Paintbrush className="h-8 w-8 mx-auto text-muted-foreground opacity-40 mb-2" />
            <p className="text-sm font-medium">AI Room Visualization</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate a photorealistic room render featuring{" "}
              <span className="font-medium">
                {materialName || selection.selection_name}
              </span>
              {roomName && (
                <>
                  {" "}
                  in the <span className="font-medium">{roomName}</span>
                </>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Uses DALL-E 3 (~$0.04 per image)
            </p>
          </div>

          <Input
            placeholder="Optional style notes (e.g., 'modern farmhouse', 'coastal vibes')"
            value={styleNotes}
            onChange={(e) => setStyleNotes(e.target.value)}
            className="h-8 text-xs"
          />

          <Button
            size="sm"
            onClick={handleRender}
            disabled={aiRender.isPending}
            className="w-full"
          >
            {aiRender.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Generating render...
              </>
            ) : (
              <>
                <Paintbrush className="h-3.5 w-3.5 mr-1.5" />
                Generate Render
              </>
            )}
          </Button>

          {aiRender.isError && (
            <p className="text-xs text-destructive text-center">
              {aiRender.error.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
