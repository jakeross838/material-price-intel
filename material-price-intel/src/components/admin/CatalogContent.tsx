import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Image as ImageIcon, FileText, Star, Trash2, Plus, X, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialImages, useAddMaterialImage, useUploadMaterialImage, useSetPrimaryMaterialImage, useDeleteMaterialImage } from "@/hooks/useMaterialImages";
import { useMaterialDocuments, useAddMaterialDocument, useDeleteMaterialDocument } from "@/hooks/useMaterialDocuments";
import { useRoomCategoryMappings, useRoomTypes } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MaterialCategory, MaterialDocType } from "@/lib/types";
import type { CatalogRoomType } from "@/lib/roomCategoryDefaults";

type SubTab = "materials" | "room-mappings";

const DOC_TYPES: { value: MaterialDocType; label: string }[] = [
  { value: "spec_sheet", label: "Spec Sheet" },
  { value: "installation_guide", label: "Install Guide" },
  { value: "warranty", label: "Warranty" },
  { value: "other", label: "Other" },
];

function useOrgId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_org_id", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single();
      if (error || !data) throw new Error("Failed to load org id");
      return data.organization_id;
    },
    enabled: !!user,
    staleTime: Infinity,
  });
}

function useMaterialCategories() {
  return useQuery({
    queryKey: ["material_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("material_categories").select("*").order("sort_order");
      if (error) throw error;
      return data as MaterialCategory[];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function CatalogContent() {
  const [subTab, setSubTab] = useState<SubTab>("materials");

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setSubTab("materials")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            subTab === "materials" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Materials
        </button>
        <button
          onClick={() => setSubTab("room-mappings")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            subTab === "room-mappings" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Room Mappings
        </button>
      </div>

      {subTab === "materials" && <MaterialsSubTab />}
      {subTab === "room-mappings" && <RoomMappingsSubTab />}
    </div>
  );
}

function MaterialsSubTab() {
  const { data: materials, isLoading } = useMaterials();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Material</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="h-9 w-full max-w-md rounded-md border px-3 text-sm"
          >
            <option value="">-- Select --</option>
            {materials?.map((m) => (
              <option key={m.id} value={m.id}>{m.canonical_name}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedId && (
        <div className="grid gap-4 md:grid-cols-2">
          <ImageManager materialId={selectedId} />
          <DocumentManager materialId={selectedId} />
        </div>
      )}
    </div>
  );
}

function ImageManager({ materialId }: { materialId: string }) {
  const { data: orgId } = useOrgId();
  const { data: images, isLoading } = useMaterialImages(materialId);
  const addImage = useAddMaterialImage();
  const uploadImage = useUploadMaterialImage();
  const setPrimary = useSetPrimaryMaterialImage();
  const deleteImage = useDeleteMaterialImage();
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Images ({images?.length ?? 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : images && images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded overflow-hidden border aspect-square">
                <img src={img.thumbnail_url ?? img.image_url} alt="" className="w-full h-full object-cover" />
                {img.is_primary && <span className="absolute top-0.5 left-0.5 bg-amber-500 text-white text-[8px] px-1 rounded">Primary</span>}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1">
                  {!img.is_primary && (
                    <button onClick={() => setPrimary.mutate({ imageId: img.id, materialId })} className="p-1 rounded-full bg-white/90 text-amber-600"><Star className="h-3 w-3" /></button>
                  )}
                  <button onClick={() => deleteImage.mutate({ imageId: img.id, materialId, storagePath: img.storage_path })} className="p-1 rounded-full bg-white/90 text-red-600"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground">No images</p>}

        <div className="flex gap-2 pt-2 border-t">
          <Input placeholder="Paste URL..." value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 h-8 text-xs" />
          <Button size="sm" className="h-8" onClick={async () => { if (!url.trim()) return; await addImage.mutateAsync({ material_id: materialId, image_url: url.trim(), is_primary: !images?.length }); setUrl(""); }} disabled={!url.trim() || addImage.isPending}>
            {addImage.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f || !orgId) return; await uploadImage.mutateAsync({ materialId, orgId, file: f, isPrimary: !images?.length }); if (fileRef.current) fileRef.current.value = ""; }} />
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileRef.current?.click()} disabled={uploadImage.isPending || !orgId}>
            {uploadImage.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Upload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentManager({ materialId }: { materialId: string }) {
  const { data: docs, isLoading } = useMaterialDocuments(materialId);
  const addDoc = useAddMaterialDocument();
  const deleteDoc = useDeleteMaterialDocument();
  const [title, setTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docType, setDocType] = useState<MaterialDocType>("spec_sheet");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents ({docs?.length ?? 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : docs && docs.length > 0 ? (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                <span className="flex-1 truncate">{d.title}</span>
                <a href={d.doc_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open</a>
                <button onClick={() => deleteDoc.mutate({ docId: d.id, materialId, storagePath: d.storage_path })} className="text-red-500"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground">No documents</p>}

        <div className="pt-2 border-t space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-7 text-xs" />
            <Input placeholder="URL" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} className="h-7 text-xs" />
          </div>
          <div className="flex gap-2">
            <select value={docType} onChange={(e) => setDocType(e.target.value as MaterialDocType)} className="h-7 rounded-md border px-2 text-xs flex-1">
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Button size="sm" className="h-7" onClick={async () => { if (!title.trim() || !docUrl.trim()) return; await addDoc.mutateAsync({ material_id: materialId, title: title.trim(), doc_url: docUrl.trim(), doc_type: docType }); setTitle(""); setDocUrl(""); }} disabled={!title.trim() || !docUrl.trim() || addDoc.isPending}>
              {addDoc.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoomMappingsSubTab() {
  const { roomTypes, config } = useRoomTypes();
  const { data: mappings, isLoading } = useRoomCategoryMappings();
  const { data: categories } = useMaterialCategories();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function addMapping(room: CatalogRoomType, catId: string) {
    if (!catId) return;
    setAdding(`${room}-${catId}`);
    try {
      const maxSort = mappings?.filter((m) => m.room_type === room).reduce((max, m) => Math.max(max, m.sort_order), 0) ?? 0;
      await supabase.from("room_category_mapping").insert({ room_type: room, category_id: catId, sort_order: maxSort + 1 });
      queryClient.invalidateQueries({ queryKey: ["room_category_mappings"] });
    } finally { setAdding(null); }
  }

  async function removeMapping(id: string) {
    setDeleting(id);
    try {
      await supabase.from("room_category_mapping").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["room_category_mappings"] });
    } finally { setDeleting(null); }
  }

  if (isLoading) return <div className="flex items-center py-12"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {roomTypes.map((rt) => {
        const roomCats = mappings?.filter((m) => m.room_type === rt) ?? [];
        const usedIds = new Set(roomCats.map((m) => m.material_categories.id));
        const available = categories?.filter((c) => !usedIds.has(c.id)) ?? [];

        return (
          <Card key={rt} className="p-3">
            <h4 className="text-sm font-semibold mb-2">{config[rt].displayName}</h4>
            <div className="flex flex-wrap gap-1 mb-2">
              {roomCats.map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {m.material_categories.display_name}
                  <button onClick={() => removeMapping(m.id)} disabled={deleting === m.id} className="hover:text-destructive">
                    {deleting === m.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <X className="h-2.5 w-2.5" />}
                  </button>
                </span>
              ))}
            </div>
            {available.length > 0 && (
              <select
                className="h-7 w-full rounded border px-2 text-xs"
                defaultValue=""
                onChange={(e) => { if (e.target.value) { addMapping(rt, e.target.value); e.target.value = ""; } }}
                disabled={!!adding}
              >
                <option value="">+ Add category</option>
                {available.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
              </select>
            )}
          </Card>
        );
      })}
    </div>
  );
}
