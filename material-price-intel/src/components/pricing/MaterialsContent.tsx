import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import {
  Layers,
  Plus,
  Merge,
  ChevronDown,
  ChevronRight,
  Package,
  Loader2,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useMaterials, useMergeMaterials } from "@/hooks/useMaterials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MaterialCategory } from "@/lib/types";

type LinkedLineItem = {
  id: string;
  raw_description: string;
  material_id: string | null;
  quotes: { id: string; quote_number: string | null; suppliers: { name: string } | null } | null;
};

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

function useLinkedLineItems(materialId: string | null) {
  return useQuery({
    queryKey: ["linked_line_items", materialId],
    queryFn: async () => {
      if (!materialId) return [];
      const { data, error } = await supabase
        .from("line_items")
        .select("id, raw_description, material_id, quotes(id, quote_number, suppliers(name))")
        .eq("material_id", materialId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LinkedLineItem[];
    },
    enabled: !!materialId,
    staleTime: 5 * 60 * 1000,
  });
}

function MaterialExpansion({
  materialId,
  aliases,
  allMaterials,
}: {
  materialId: string;
  aliases: Array<{ id: string; alias: string; source_quote_id: string | null; created_at: string }>;
  allMaterials: Array<{ id: string; canonical_name: string }>;
}) {
  const { data: linkedItems, isLoading } = useLinkedLineItems(materialId);
  const queryClient = useQueryClient();
  const [reassigning, setReassigning] = useState<string | null>(null);

  async function handleReassign(lineItemId: string, newMaterialId: string) {
    setReassigning(lineItemId);
    try {
      const { error } = await supabase
        .from("line_items")
        .update({ material_id: newMaterialId })
        .eq("id", lineItemId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["linked_line_items"] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    } finally {
      setReassigning(null);
    }
  }

  return (
    <div className="px-4 py-3 bg-muted/30 border-t space-y-4">
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Aliases ({aliases.length})
        </h4>
        {aliases.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No aliases recorded yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {aliases.map((a) => (
              <span key={a.id} className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                {a.alias}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Linked Line Items {linkedItems ? `(${linkedItems.length})` : ""}
        </h4>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : linkedItems && linkedItems.length > 0 ? (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {linkedItems.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs bg-background rounded px-2 py-1 border">
                <span className="flex-1 truncate">{item.raw_description}</span>
                <span className="text-muted-foreground shrink-0">
                  {item.quotes?.suppliers?.name}
                </span>
                <select
                  className="text-xs border rounded px-1 py-0.5 bg-background w-24"
                  value=""
                  disabled={reassigning === item.id}
                  onChange={(e) => e.target.value && handleReassign(item.id, e.target.value)}
                >
                  <option value="">Move to...</option>
                  {allMaterials.filter((m) => m.id !== materialId).slice(0, 20).map((m) => (
                    <option key={m.id} value={m.id}>{m.canonical_name}</option>
                  ))}
                </select>
              </div>
            ))}
            {linkedItems.length > 10 && (
              <p className="text-xs text-muted-foreground">+{linkedItems.length - 10} more</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No line items linked.</p>
        )}
      </div>
    </div>
  );
}

function CreateMaterialDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: orgId } = useOrgId();
  const { data: categories } = useMaterialCategories();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const canonicalName = (fd.get("canonical_name") as string).trim();
    if (!canonicalName) {
      setError("Canonical name is required.");
      setSubmitting(false);
      return;
    }

    const categoryId = (fd.get("category_id") as string) || categories?.[0]?.id;
    if (!categoryId) {
      setError("Category is required.");
      setSubmitting(false);
      return;
    }

    try {
      const { error: insertError } = await supabase.from("materials").insert({
        organization_id: orgId,
        category_id: categoryId,
        canonical_name: canonicalName,
        species: (fd.get("species") as string)?.trim() || null,
        dimensions: (fd.get("dimensions") as string)?.trim() || null,
        grade: (fd.get("grade") as string)?.trim() || null,
        treatment: (fd.get("treatment") as string)?.trim() || null,
        unit_of_measure: (fd.get("unit_of_measure") as string)?.trim() || "each",
        is_active: true,
      });
      if (insertError) throw new Error(insertError.message);
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      formRef.current?.reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create material");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card rounded-xl border shadow-lg p-5 space-y-4">
          <Dialog.Title className="text-lg font-semibold">Create Material</Dialog.Title>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="canonical_name">Name *</Label>
              <Input id="canonical_name" name="canonical_name" placeholder="e.g. 2x4x8 SPF #2" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="species">Species</Label>
                <Input id="species" name="species" placeholder="SPF, SYP" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input id="dimensions" name="dimensions" placeholder="2x4x8" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" name="grade" placeholder="#2" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="treatment">Treatment</Label>
                <Input id="treatment" name="treatment" placeholder="PT, KD" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category_id">Category</Label>
                <select id="category_id" name="category_id" className="h-9 w-full rounded-md border px-2 text-sm">
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.display_name}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Create
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MaterialsContent() {
  const { data: materials, isLoading } = useMaterials();
  const mergeMaterials = useMergeMaterials();
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const allMaterials = (materials ?? []).map((m) => ({ id: m.id, canonical_name: m.canonical_name }));

  const filtered = (materials ?? []).filter((m) =>
    !searchTerm || m.canonical_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleMergeSelect = useCallback((id: string) => {
    setSelectedForMerge((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }, []);

  function exitMergeMode() {
    setMergeMode(false);
    setSelectedForMerge([]);
  }

  function handleMerge() {
    if (selectedForMerge.length !== 2) return;
    const [keepId, mergeId] = selectedForMerge;
    mergeMaterials.mutate({ keepId, mergeId }, { onSuccess: exitMergeMode });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading materials...
      </div>
    );
  }

  if (!materials || materials.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No materials yet. Approve quotes to build your catalog.</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Material Manually
          </Button>
        </CardContent>
        <CreateMaterialDialog open={createOpen} onOpenChange={setCreateOpen} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {mergeMode ? (
            <>
              <Button variant="outline" size="sm" onClick={exitMergeMode}>Cancel</Button>
              {selectedForMerge.length === 2 && (
                <Button variant="destructive" size="sm" onClick={handleMerge} disabled={mergeMaterials.isPending}>
                  {mergeMaterials.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  Merge
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setMergeMode(true)}>
                <Merge className="mr-1 h-3 w-3" />
                Merge
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 h-3 w-3" />
                New
              </Button>
            </>
          )}
        </div>
      </div>

      {mergeMode && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Select two materials: first will be kept, second will merge into it.
        </div>
      )}

      {/* Materials Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Materials
            <span className="text-xs text-muted-foreground font-normal">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b bg-muted/50">
                  {mergeMode && <th className="w-10 px-3 py-2"></th>}
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-left px-4 py-2 font-medium">Species</th>
                  <th className="text-left px-4 py-2 font-medium">Dimensions</th>
                  <th className="text-left px-4 py-2 font-medium">Grade</th>
                  <th className="text-left px-4 py-2 font-medium">Unit</th>
                  <th className="text-center px-4 py-2 font-medium">Aliases</th>
                </tr>
              </thead>
              {filtered.map((mat) => {
                const aliasCount = mat.material_aliases?.length ?? 0;
                const isExpanded = expandedId === mat.id;
                const isSelected = selectedForMerge.includes(mat.id);

                return (
                  <tbody key={mat.id}>
                    <tr className={`border-b hover:bg-muted/30 ${isSelected ? "bg-amber-50" : ""}`}>
                      {mergeMode && (
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isSelected && selectedForMerge.length >= 2}
                            onChange={() => toggleMergeSelect(mat.id)}
                            className="h-4 w-4 rounded"
                          />
                        </td>
                      )}
                      <td className="px-4 py-2 font-medium">{mat.canonical_name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{mat.species ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{mat.dimensions ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{mat.grade ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{mat.unit_of_measure}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : mat.id)}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100"
                        >
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {aliasCount}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={mergeMode ? 7 : 6} className="p-0">
                          <MaterialExpansion materialId={mat.id} aliases={mat.material_aliases ?? []} allMaterials={allMaterials} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </table>
          </div>
        </CardContent>
      </Card>

      <CreateMaterialDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
