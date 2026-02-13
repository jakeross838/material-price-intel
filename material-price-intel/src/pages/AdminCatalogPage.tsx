import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Image as ImageIcon,
  FileText,
  Star,
  Trash2,
  Plus,
  Download,
  X,
  MapPin,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useMaterials } from "@/hooks/useMaterials";
import {
  useMaterialImages,
  useAddMaterialImage,
  useUploadMaterialImage,
  useSetPrimaryMaterialImage,
  useDeleteMaterialImage,
} from "@/hooks/useMaterialImages";
import {
  useMaterialDocuments,
  useAddMaterialDocument,
  useDeleteMaterialDocument,
} from "@/hooks/useMaterialDocuments";
import { useRoomCategoryMappings, useRoomTypes } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MaterialCategory, MaterialDocType } from "@/lib/types";
import type { CatalogRoomType } from "@/lib/roomCategoryDefaults";

// ===========================================
// AdminCatalogPage - Catalog management (auth)
// ===========================================
// Admin page for managing catalog images,
// documents, and room-category mappings.
// Requires authentication. Inside AppLayout.
// ===========================================

type Tab = "materials" | "room-mappings";

const DOC_TYPES: { value: MaterialDocType; label: string }[] = [
  { value: "spec_sheet", label: "Spec Sheet" },
  { value: "installation_guide", label: "Installation Guide" },
  { value: "cut_sheet", label: "Cut Sheet" },
  { value: "warranty", label: "Warranty" },
  { value: "care_guide", label: "Care Guide" },
  { value: "other", label: "Other" },
];

// ---------------------------------------------------------------------------
// Hook: get org id from user profile
// ---------------------------------------------------------------------------

function useOrgId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_org_id", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      if (error || !data) throw new Error("Failed to load org id");
      return data.organization_id;
    },
    enabled: !!user,
    staleTime: Infinity,
  });
}

// ---------------------------------------------------------------------------
// Hook: material categories
// ---------------------------------------------------------------------------

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

// ===========================================================================
// Main component
// ===========================================================================

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<Tab>("materials");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Catalog Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage material images, documents, and room-category mappings
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("materials")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "materials"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Materials
        </button>
        <button
          onClick={() => setActiveTab("room-mappings")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "room-mappings"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Room Mappings
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "materials" && <MaterialsTab />}
      {activeTab === "room-mappings" && <RoomMappingsTab />}
    </div>
  );
}

// ===========================================================================
// Materials Tab
// ===========================================================================

function MaterialsTab() {
  const { data: materials, isLoading } = useMaterials();
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading materials...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Material selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Material</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedMaterialId ?? ""}
            onChange={(e) => setSelectedMaterialId(e.target.value || null)}
            className="h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            <option value="">-- Select a material --</option>
            {materials?.map((mat) => (
              <option key={mat.id} value={mat.id}>
                {mat.canonical_name}
                {mat.species ? ` (${mat.species})` : ""}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Material management sections */}
      {selectedMaterialId && (
        <>
          <ImageManagement materialId={selectedMaterialId} />
          <DocumentManagement materialId={selectedMaterialId} />
          <ProductUrlImport materialId={selectedMaterialId} />
        </>
      )}
    </div>
  );
}

// ===========================================================================
// Image Management
// ===========================================================================

function ImageManagement({ materialId }: { materialId: string }) {
  const { data: orgId } = useOrgId();
  const { data: images, isLoading } = useMaterialImages(materialId);
  const addImage = useAddMaterialImage();
  const uploadImage = useUploadMaterialImage();
  const setPrimary = useSetPrimaryMaterialImage();
  const deleteImage = useDeleteMaterialImage();

  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAddUrl() {
    if (!imageUrl.trim()) return;
    try {
      await addImage.mutateAsync({
        material_id: materialId,
        image_url: imageUrl.trim(),
        is_primary: !images || images.length === 0,
      });
      setImageUrl("");
    } catch {
      // Mutation error is handled by React Query
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    try {
      await uploadImage.mutateAsync({
        materialId,
        orgId,
        file,
        isPrimary: !images || images.length === 0,
      });
    } catch {
      // Mutation error is handled by React Query
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images
          {images && <span className="text-sm text-muted-foreground font-normal">({images.length})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image grid */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading images...
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border">
                <img
                  src={img.thumbnail_url ?? img.image_url}
                  alt="Material"
                  className="w-full aspect-square object-cover"
                />
                {img.is_primary && (
                  <span className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    Primary
                  </span>
                )}
                {/* Hover controls */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button
                      onClick={() => setPrimary.mutate({ imageId: img.id, materialId })}
                      className="p-1.5 rounded-full bg-white/90 hover:bg-white text-amber-600"
                      title="Set as primary"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      deleteImage.mutate({
                        imageId: img.id,
                        materialId,
                        storagePath: img.storage_path,
                      })
                    }
                    className="p-1.5 rounded-full bg-white/90 hover:bg-white text-red-600"
                    title="Delete image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No images yet</p>
        )}

        {/* Add image controls */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium">Add Image</h4>
          {/* URL paste */}
          <div className="flex gap-2">
            <Input
              placeholder="Paste image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAddUrl}
              disabled={!imageUrl.trim() || addImage.isPending}
              size="sm"
            >
              {addImage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add URL
            </Button>
          </div>
          {/* File upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImage.isPending || !orgId}
            >
              {uploadImage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Upload File
            </Button>
            <span className="text-xs text-muted-foreground">JPG, PNG, WebP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Document Management
// ===========================================================================

function DocumentManagement({ materialId }: { materialId: string }) {
  const { data: docs, isLoading } = useMaterialDocuments(materialId);
  const addDoc = useAddMaterialDocument();
  const deleteDoc = useDeleteMaterialDocument();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [docType, setDocType] = useState<MaterialDocType>("spec_sheet");

  async function handleAdd() {
    if (!title.trim() || !url.trim()) return;
    try {
      await addDoc.mutateAsync({
        material_id: materialId,
        title: title.trim(),
        doc_url: url.trim(),
        doc_type: docType,
      });
      setTitle("");
      setUrl("");
      setDocType("spec_sheet");
    } catch {
      // Mutation error is handled by React Query
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
          {docs && <span className="text-sm text-muted-foreground font-normal">({docs.length})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document list */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading documents...
          </div>
        ) : docs && docs.length > 0 ? (
          <div className="space-y-1">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md border"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm truncate">{doc.title}</span>
                <span className="shrink-0 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {doc.doc_type.replace(/_/g, " ")}
                </span>
                <a
                  href={doc.doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline shrink-0"
                >
                  Open
                </a>
                <button
                  onClick={() =>
                    deleteDoc.mutate({
                      docId: doc.id,
                      materialId,
                      storagePath: doc.storage_path,
                    })
                  }
                  className="p-1 text-red-500 hover:text-red-700 shrink-0"
                  title="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No documents yet</p>
        )}

        {/* Add document form */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium">Add Document</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="doc-title" className="text-xs">Title</Label>
              <Input
                id="doc-title"
                placeholder="Document title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-url" className="text-xs">URL</Label>
              <Input
                id="doc-url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="doc-type" className="text-xs">Type</Label>
              <select
                id="doc-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value as MaterialDocType)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleAdd}
              disabled={!title.trim() || !url.trim() || addDoc.isPending}
              size="sm"
            >
              {addDoc.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Product URL Import
// ===========================================================================

function ProductUrlImport({ materialId }: { materialId: string }) {
  const addImage = useAddMaterialImage();
  const addDoc = useAddMaterialDocument();
  const { data: images } = useMaterialImages(materialId);

  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ images: number; documents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("scrape-product", {
        body: { url: importUrl.trim(), category_name: "general" },
      });

      if (fnError) throw new Error(fnError.message ?? "Scrape failed");

      const productData = data as {
        images?: Array<{ url: string; alt?: string }>;
        documents?: Array<{ title: string; url: string; type?: string }>;
      };

      let importedImages = 0;
      let importedDocs = 0;

      // Import images
      if (productData.images) {
        const hasExistingImages = (images?.length ?? 0) > 0;
        for (let i = 0; i < productData.images.length; i++) {
          const img = productData.images[i];
          try {
            await addImage.mutateAsync({
              material_id: materialId,
              image_url: img.url,
              caption: img.alt ?? null,
              source: importUrl.trim(),
              is_primary: !hasExistingImages && i === 0,
            });
            importedImages++;
          } catch {
            // Skip individual failures
          }
        }
      }

      // Import documents
      if (productData.documents) {
        for (const doc of productData.documents) {
          try {
            await addDoc.mutateAsync({
              material_id: materialId,
              title: doc.title,
              doc_url: doc.url,
              doc_type: (doc.type as MaterialDocType) ?? "other",
            });
            importedDocs++;
          } catch {
            // Skip individual failures
          }
        }
      }

      setResult({ images: importedImages, documents: importedDocs });
      setImportUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5" />
          Import from Product URL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Paste a product page URL to automatically import images and documents.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://www.homedepot.com/p/..."
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleImport}
            disabled={!importUrl.trim() || importing}
            size="sm"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Import
          </Button>
        </div>
        {result && (
          <p className="text-sm text-green-600">
            Imported {result.images} image{result.images !== 1 ? "s" : ""} and{" "}
            {result.documents} document{result.documents !== 1 ? "s" : ""}
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Room Mappings Tab
// ===========================================================================

function RoomMappingsTab() {
  const { roomTypes, config: roomConfig } = useRoomTypes();
  const { data: allMappings, isLoading } = useRoomCategoryMappings();
  const { data: categories } = useMaterialCategories();
  const queryClient = useQueryClient();

  const [adding, setAdding] = useState<{ room: CatalogRoomType; catId: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleAddMapping(roomType: CatalogRoomType, categoryId: string) {
    if (!categoryId) return;
    setAdding({ room: roomType, catId: categoryId });
    try {
      const maxSort = allMappings
        ?.filter((m) => m.room_type === roomType)
        .reduce((max, m) => Math.max(max, m.sort_order), 0) ?? 0;

      const { error } = await supabase.from("room_category_mapping").insert({
        room_type: roomType,
        category_id: categoryId,
        sort_order: maxSort + 1,
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["room_category_mappings"] });
    } catch {
      // Handled via React Query
    } finally {
      setAdding(null);
    }
  }

  async function handleRemoveMapping(mappingId: string) {
    setDeleting(mappingId);
    try {
      const { error } = await supabase
        .from("room_category_mapping")
        .delete()
        .eq("id", mappingId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["room_category_mappings"] });
    } catch {
      // Handled via React Query
    } finally {
      setDeleting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading mappings...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {roomTypes.map((rt) => {
        const cfg = roomConfig[rt];
        const roomCats = allMappings?.filter((m) => m.room_type === rt) ?? [];
        const usedCatIds = new Set(roomCats.map((m) => m.material_categories.id));
        const availableCats = categories?.filter((c) => !usedCatIds.has(c.id)) ?? [];

        return (
          <Card key={rt}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{cfg.displayName}</CardTitle>
              <p className="text-xs text-muted-foreground">{cfg.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Current category pills */}
              <div className="flex flex-wrap gap-1.5">
                {roomCats.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">
                    No categories mapped
                  </span>
                )}
                {roomCats.map((mapping) => (
                  <span
                    key={mapping.id}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-800"
                  >
                    {mapping.material_categories.display_name}
                    <button
                      onClick={() => handleRemoveMapping(mapping.id)}
                      disabled={deleting === mapping.id}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-brand-200 transition-colors"
                      title="Remove"
                    >
                      {deleting === mapping.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  </span>
                ))}
              </div>

              {/* Add category dropdown */}
              {availableCats.length > 0 && (
                <div className="flex gap-2">
                  <select
                    id={`add-cat-${rt}`}
                    className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddMapping(rt, e.target.value);
                        e.target.value = "";
                      }
                    }}
                    disabled={adding?.room === rt}
                  >
                    <option value="">Add category...</option>
                    {availableCats.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.display_name}
                      </option>
                    ))}
                  </select>
                  {adding?.room === rt && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
