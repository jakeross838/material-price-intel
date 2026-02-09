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
  X,
  ArrowRightLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useMaterials, useMergeMaterials } from "@/hooks/useMaterials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MaterialCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LinkedLineItem = {
  id: string;
  raw_description: string;
  material_id: string | null;
  quotes: { id: string; quote_number: string | null; suppliers: { name: string } | null } | null;
};

// ---------------------------------------------------------------------------
// Helper: get org id from user profile (same pattern as useUploadDocument)
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
// Helper: fetch material categories
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
    staleTime: 30 * 60 * 1000, // categories rarely change
  });
}

// ---------------------------------------------------------------------------
// Helper: fetch linked line items for a material
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Sub-component: Expanded alias/line-item section for a material
// ---------------------------------------------------------------------------

function MaterialExpansion({
  materialId,
  aliases,
  allMaterials,
}: {
  materialId: string;
  aliases: Array<{
    id: string;
    alias: string;
    source_quote_id: string | null;
    created_at: string;
  }>;
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
      queryClient.invalidateQueries({ queryKey: ["line_items_with_materials"] });
    } finally {
      setReassigning(null);
    }
  }

  return (
    <div className="px-4 py-3 bg-muted/30 border-t space-y-4">
      {/* Aliases */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Aliases ({aliases.length})
        </h4>
        {aliases.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No aliases recorded yet.</p>
        ) : (
          <div className="space-y-1">
            {aliases.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  {a.alias}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked Line Items */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Linked Line Items {linkedItems ? `(${linkedItems.length})` : ""}
        </h4>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading...
          </div>
        ) : linkedItems && linkedItems.length > 0 ? (
          <div className="space-y-2">
            {linkedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 text-sm bg-background rounded-md px-3 py-2 border"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.raw_description}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quotes?.suppliers?.name ?? "Unknown supplier"}
                    {item.quotes?.quote_number ? ` -- #${item.quotes.quote_number}` : ""}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                  <select
                    className="text-xs border rounded px-2 py-1 bg-background max-w-[200px]"
                    value=""
                    disabled={reassigning === item.id}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleReassign(item.id, e.target.value);
                      }
                    }}
                  >
                    <option value="">Reassign to...</option>
                    {allMaterials
                      .filter((m) => m.id !== materialId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.canonical_name}
                        </option>
                      ))}
                  </select>
                  {reassigning === item.id && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No line items linked.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Create New Material Dialog
// ---------------------------------------------------------------------------

function CreateMaterialDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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

    const categoryId = fd.get("category_id") as string;

    try {
      const { error: insertError } = await supabase.from("materials").insert({
        organization_id: orgId,
        category_id: categoryId || (categories?.[0]?.id ?? ""),
        canonical_name: canonicalName,
        species: (fd.get("species") as string)?.trim() || null,
        dimensions: (fd.get("dimensions") as string)?.trim() || null,
        grade: (fd.get("grade") as string)?.trim() || null,
        treatment: (fd.get("treatment") as string)?.trim() || null,
        unit_of_measure: (fd.get("unit_of_measure") as string)?.trim() || "each",
        description: null,
        aliases: [],
        category_attributes: {},
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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card rounded-xl border shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Create New Material
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-xs">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="canonical_name">Canonical Name *</Label>
              <Input
                id="canonical_name"
                name="canonical_name"
                placeholder="e.g. 2x4x8 SPF #2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Input id="species" name="species" placeholder="e.g. SPF, SYP" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input id="dimensions" name="dimensions" placeholder="e.g. 2x4x8" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" name="grade" placeholder="e.g. #2, Select" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment">Treatment</Label>
                <Input id="treatment" name="treatment" placeholder="e.g. PT, KD, S4S" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <select
                  id="category_id"
                  name="category_id"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                <Input
                  id="unit_of_measure"
                  name="unit_of_measure"
                  placeholder="each"
                  defaultValue="each"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Material
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MaterialsPage() {
  const { data: materials, isLoading } = useMaterials();
  const mergeMaterials = useMergeMaterials();

  // Merge mode state
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [mergeConfirm, setMergeConfirm] = useState(false);

  // Expanded material (alias/line-item drill-down)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);

  // Flatten materials list for merge/reassign references
  const allMaterials = (materials ?? []).map((m) => ({
    id: m.id,
    canonical_name: m.canonical_name,
  }));

  // -----------------------------------------------------------------------
  // Merge handlers
  // -----------------------------------------------------------------------

  const toggleMergeSelect = useCallback(
    (id: string) => {
      setSelectedForMerge((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= 2) return prev; // max 2
        return [...prev, id];
      });
    },
    []
  );

  function exitMergeMode() {
    setMergeMode(false);
    setSelectedForMerge([]);
    setMergeConfirm(false);
  }

  function handleMergeConfirm() {
    if (selectedForMerge.length !== 2) return;
    const [keepId, mergeId] = selectedForMerge;
    mergeMaterials.mutate(
      { keepId, mergeId },
      {
        onSuccess: () => {
          exitMergeMode();
        },
      }
    );
  }

  const keepMaterial = materials?.find((m) => m.id === selectedForMerge[0]);
  const mergeMaterial = materials?.find((m) => m.id === selectedForMerge[1]);

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading materials...
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  if (!materials || materials.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Materials</h2>
            <p className="text-muted-foreground mt-2">
              Manage your canonical material catalog
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Material
          </Button>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No materials normalized yet. Approve a quote to start building your material catalog.
            </p>
          </CardContent>
        </Card>

        <CreateMaterialDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Materials</h2>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {materials.length}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            Manage your canonical material catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mergeMode ? (
            <>
              <Button variant="outline" onClick={exitMergeMode}>
                Cancel Merge
              </Button>
              {selectedForMerge.length === 2 && (
                <Button
                  variant="destructive"
                  onClick={() => setMergeConfirm(true)}
                  disabled={mergeMaterials.isPending}
                >
                  {mergeMaterials.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Merge Selected
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMergeMode(true)}>
                <Merge className="mr-2 h-4 w-4" />
                Merge
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Material
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Merge mode guidance */}
      {mergeMode && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="py-3 text-sm text-amber-800">
            <strong>Merge mode:</strong> Select two materials below. The first selected will be
            kept; the second will be merged into it (all aliases and line items transferred).
            {selectedForMerge.length === 1 && (
              <span className="ml-1">
                Selected <strong>{keepMaterial?.canonical_name}</strong> as the keep target. Now
                select the material to merge.
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {/* Merge confirmation */}
      {mergeConfirm && keepMaterial && mergeMaterial && (
        <Card className="border-red-300 bg-red-50/50">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-medium text-red-900">
              Confirm merge: Keep <strong>{keepMaterial.canonical_name}</strong> and merge{" "}
              <strong>{mergeMaterial.canonical_name}</strong> into it?
            </p>
            <p className="text-xs text-red-700">
              All line items and aliases from &quot;{mergeMaterial.canonical_name}&quot; will be
              moved to &quot;{keepMaterial.canonical_name}&quot;. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleMergeConfirm}
                disabled={mergeMaterials.isPending}
              >
                {mergeMaterials.isPending && (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                )}
                Yes, merge them
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Canonical Materials
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {mergeMode && (
                    <th className="w-10 px-4 py-2"></th>
                  )}
                  <th className="text-left px-4 py-2 font-medium">Canonical Name</th>
                  <th className="text-left px-4 py-2 font-medium">Species</th>
                  <th className="text-left px-4 py-2 font-medium">Dimensions</th>
                  <th className="text-left px-4 py-2 font-medium">Grade</th>
                  <th className="text-left px-4 py-2 font-medium">Treatment</th>
                  <th className="text-left px-4 py-2 font-medium">Unit</th>
                  <th className="text-center px-4 py-2 font-medium">Aliases</th>
                </tr>
              </thead>
                {materials.map((mat) => {
                  const aliasCount = mat.material_aliases?.length ?? 0;
                  const isExpanded = expandedId === mat.id;
                  const isSelected = selectedForMerge.includes(mat.id);
                  const selectionIndex = selectedForMerge.indexOf(mat.id);

                  return (
                    <tbody key={mat.id}>
                      <tr
                        className={`border-b last:border-0 hover:bg-muted/30 ${
                          isSelected ? "bg-amber-50" : ""
                        }`}
                      >
                        {mergeMode && (
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={
                                !isSelected && selectedForMerge.length >= 2
                              }
                              onChange={() => toggleMergeSelect(mat.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            {isSelected && (
                              <span className="ml-1 text-xs font-medium text-amber-700">
                                {selectionIndex === 0 ? "Keep" : "Merge"}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-2 font-medium">
                          {mat.canonical_name}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {mat.species ?? "\u2014"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {mat.dimensions ?? "\u2014"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {mat.grade ?? "\u2014"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {mat.treatment ?? "\u2014"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {mat.unit_of_measure}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : mat.id)
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            {aliasCount}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={mergeMode ? 8 : 7}
                            className="p-0"
                          >
                            <MaterialExpansion
                              materialId={mat.id}
                              aliases={mat.material_aliases ?? []}
                              allMaterials={allMaterials}
                            />
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
