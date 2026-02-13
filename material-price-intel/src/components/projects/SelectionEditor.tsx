import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, Pencil, Check, Loader2, BarChart3, Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useMaterials } from "@/hooks/useMaterials";
import {
  useRoomSelections,
  useCreateSelection,
  useUpdateSelection,
  useDeleteSelection,
} from "@/hooks/useProjectSelections";
import type { SelectionWithJoins } from "@/hooks/useProjectSelections";
import type { MaterialCategory, UpgradeStatus } from "@/lib/types";
import { EstimateBuilder } from "@/components/projects/EstimateBuilder";
import { SelectionImagePanel } from "@/components/projects/SelectionImagePanel";
import { usePrimaryImage, getImageDisplayUrl } from "@/hooks/useSelectionImages";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UNIT_OPTIONS = ["sqft", "lf", "ea", "pc", "bf"] as const;

const UPGRADE_BADGE: Record<UpgradeStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-blue-100 text-blue-700" },
  standard: { label: "Standard", color: "bg-slate-100 text-slate-700" },
  upgrade: { label: "Upgrade", color: "bg-amber-100 text-amber-700" },
  downgrade: { label: "Under Budget", color: "bg-green-100 text-green-700" },
};

function formatCurrency(val: number | null | undefined) {
  if (val == null) return "\u2014";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function computeUpgradeStatus(
  actualTotal: number | null | undefined,
  allowance: number | null | undefined
): UpgradeStatus {
  if (actualTotal == null || allowance == null || allowance === 0)
    return "pending";
  if (actualTotal > allowance * 1.01) return "upgrade";
  if (actualTotal < allowance * 0.99) return "downgrade";
  return "standard";
}

// ---------------------------------------------------------------------------
// Hook: material_categories query (reuses same cache key as reports)
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

// ---------------------------------------------------------------------------
// Add Selection form (inline)
// ---------------------------------------------------------------------------

type AddFormProps = {
  roomId: string;
  categories: MaterialCategory[];
  materials: ReturnType<typeof useMaterials>["data"];
};

function AddSelectionForm({ roomId, categories, materials }: AddFormProps) {
  const createSelection = useCreateSelection();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [allowance, setAllowance] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("ea");

  const filteredMaterials = categoryId
    ? (materials ?? []).filter((m) => m.category_id === categoryId)
    : (materials ?? []);

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createSelection.mutate(
      {
        room_id: roomId,
        selection_name: trimmed,
        category_id: categoryId || null,
        material_id: materialId || null,
        allowance_amount: allowance ? parseFloat(allowance) : null,
        quantity: quantity ? parseFloat(quantity) : null,
        unit: unit || null,
      },
      {
        onSuccess: () => {
          setName("");
          setCategoryId("");
          setMaterialId("");
          setAllowance("");
          setQuantity("");
          setUnit("ea");
        },
      }
    );
  }

  return (
    <div className="border-t pt-3 mt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Add Selection
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Selection name (required)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-8 text-sm col-span-2"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setMaterialId("");
          }}
          className="h-8 rounded-md border px-2 text-xs bg-background"
        >
          <option value="">-- Category --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_name}
            </option>
          ))}
        </select>
        <select
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          className="h-8 rounded-md border px-2 text-xs bg-background"
        >
          <option value="">-- Material --</option>
          {filteredMaterials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.canonical_name}
            </option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Allowance ($)"
          value={allowance}
          onChange={(e) => setAllowance(e.target.value)}
          className="h-8 text-sm"
        />
        <div className="flex gap-1">
          <Input
            type="number"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-8 text-sm flex-1"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="h-8 rounded-md border px-2 text-xs bg-background w-16"
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button
        size="xs"
        onClick={handleAdd}
        disabled={!name.trim() || createSelection.isPending}
        className="w-full"
      >
        {createSelection.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Plus className="h-3 w-3" />
        )}
        Add Selection
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thumbnail (shows primary image or placeholder)
// ---------------------------------------------------------------------------

function SelectionThumbnail({
  selectionId,
  onClick,
}: {
  selectionId: string;
  onClick: () => void;
}) {
  const { data: primaryImage } = usePrimaryImage(selectionId);
  const url = primaryImage ? getImageDisplayUrl(primaryImage) : null;

  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded border bg-muted/30 overflow-hidden flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
      title="Toggle image panel"
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <Camera className="h-4 w-4 text-muted-foreground/50" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Selection row (view + inline edit)
// ---------------------------------------------------------------------------

type SelectionRowProps = {
  sel: SelectionWithJoins;
  roomId: string;
  roomName?: string;
  categories: MaterialCategory[];
  materials: ReturnType<typeof useMaterials>["data"];
  isExpanded: boolean;
  onToggleExpand: () => void;
  isImagePanelOpen: boolean;
  onToggleImagePanel: () => void;
};

function SelectionRow({ sel, roomId, roomName, categories, materials, isExpanded, onToggleExpand, isImagePanelOpen, onToggleImagePanel }: SelectionRowProps) {
  const updateSelection = useUpdateSelection();
  const deleteSelection = useDeleteSelection();
  const [editing, setEditing] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState(sel.selection_name);
  const [editManufacturer, setEditManufacturer] = useState(sel.manufacturer ?? "");
  const [editModelNumber, setEditModelNumber] = useState(sel.model_number ?? "");
  const [editCategoryId, setEditCategoryId] = useState(sel.category_id ?? "");
  const [editMaterialId, setEditMaterialId] = useState(sel.material_id ?? "");
  const [editAllowance, setEditAllowance] = useState(
    sel.allowance_amount?.toString() ?? ""
  );
  const [editQuantity, setEditQuantity] = useState(
    sel.quantity?.toString() ?? ""
  );
  const [editUnit, setEditUnit] = useState(sel.unit ?? "ea");
  const [editEstPrice, setEditEstPrice] = useState(
    sel.estimated_unit_price?.toString() ?? ""
  );
  const [editActualPrice, setEditActualPrice] = useState(
    sel.actual_unit_price?.toString() ?? ""
  );
  const [editActualQty, setEditActualQty] = useState(
    sel.actual_total?.toString() ?? ""
  );

  const filteredMaterials = editCategoryId
    ? (materials ?? []).filter((m) => m.category_id === editCategoryId)
    : (materials ?? []);

  function startEdit() {
    setEditName(sel.selection_name);
    setEditManufacturer(sel.manufacturer ?? "");
    setEditModelNumber(sel.model_number ?? "");
    setEditCategoryId(sel.category_id ?? "");
    setEditMaterialId(sel.material_id ?? "");
    setEditAllowance(sel.allowance_amount?.toString() ?? "");
    setEditQuantity(sel.quantity?.toString() ?? "");
    setEditUnit(sel.unit ?? "ea");
    setEditEstPrice(sel.estimated_unit_price?.toString() ?? "");
    setEditActualPrice(sel.actual_unit_price?.toString() ?? "");
    setEditActualQty(sel.actual_total?.toString() ?? "");
    setEditing(true);
  }

  function handleSave() {
    const estPrice = editEstPrice ? parseFloat(editEstPrice) : null;
    const qty = editQuantity ? parseFloat(editQuantity) : null;
    const estTotal =
      estPrice != null && qty != null ? estPrice * qty : sel.estimated_total;
    const actualPrice = editActualPrice ? parseFloat(editActualPrice) : null;
    const actualTotal = editActualQty
      ? parseFloat(editActualQty)
      : actualPrice != null && qty != null
        ? actualPrice * qty
        : sel.actual_total;
    const allowance = editAllowance ? parseFloat(editAllowance) : null;
    const upgradeStatus = computeUpgradeStatus(actualTotal, allowance);

    updateSelection.mutate(
      {
        id: sel.id,
        room_id: roomId,
        updates: {
          selection_name: editName.trim() || sel.selection_name,
          manufacturer: editManufacturer.trim() || null,
          model_number: editModelNumber.trim() || null,
          category_id: editCategoryId || null,
          material_id: editMaterialId || null,
          allowance_amount: allowance,
          quantity: qty,
          unit: editUnit || null,
          estimated_unit_price: estPrice,
          estimated_total: estTotal,
          actual_unit_price: actualPrice,
          actual_total: actualTotal,
          upgrade_status: upgradeStatus,
        },
      },
      { onSuccess: () => setEditing(false) }
    );
  }

  function handleDelete() {
    deleteSelection.mutate({ id: sel.id, room_id: roomId });
  }

  // Compute display values
  const categoryName =
    (sel.material_categories as MaterialCategory | null)?.display_name ?? "\u2014";
  const materialName =
    (sel.materials as { canonical_name: string } | null)?.canonical_name ??
    "Not selected";
  const supplierName =
    (sel.suppliers as { name: string } | null)?.name ?? null;
  const estTotal = sel.estimated_total;
  const actTotal = sel.actual_total;
  const variance = sel.variance_amount;
  const badge = UPGRADE_BADGE[sel.upgrade_status];

  if (editing) {
    return (
      <tr className="bg-muted/30">
        <td className="px-1 py-1">
          <SelectionThumbnail
            selectionId={sel.id}
            onClick={onToggleImagePanel}
          />
        </td>
        <td className="px-2 py-1.5">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-7 text-xs"
          />
          <div className="flex gap-1 mt-1">
            <Input
              value={editManufacturer}
              onChange={(e) => setEditManufacturer(e.target.value)}
              placeholder="Manufacturer"
              className="h-6 text-[10px]"
            />
            <Input
              value={editModelNumber}
              onChange={(e) => setEditModelNumber(e.target.value)}
              placeholder="Model #"
              className="h-6 text-[10px]"
            />
          </div>
        </td>
        <td className="px-2 py-1.5">
          <select
            value={editCategoryId}
            onChange={(e) => {
              setEditCategoryId(e.target.value);
              setEditMaterialId("");
            }}
            className="h-7 w-full rounded border px-1 text-xs bg-background"
          >
            <option value="">--</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-1.5">
          <select
            value={editMaterialId}
            onChange={(e) => setEditMaterialId(e.target.value)}
            className="h-7 w-full rounded border px-1 text-xs bg-background"
          >
            <option value="">--</option>
            {filteredMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.canonical_name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-1.5">
          <Input
            type="number"
            value={editAllowance}
            onChange={(e) => setEditAllowance(e.target.value)}
            className="h-7 text-xs w-20"
            placeholder="$"
          />
        </td>
        <td className="px-2 py-1.5">
          <div className="flex gap-1">
            <Input
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              className="h-7 text-xs w-14"
            />
            <select
              value={editUnit}
              onChange={(e) => setEditUnit(e.target.value)}
              className="h-7 rounded border px-1 text-xs bg-background w-14"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </td>
        <td className="px-2 py-1.5">
          <Input
            type="number"
            value={editEstPrice}
            onChange={(e) => setEditEstPrice(e.target.value)}
            className="h-7 text-xs w-20"
            placeholder="$/unit"
          />
        </td>
        <td className="px-2 py-1.5">
          <Input
            type="number"
            value={editActualQty}
            onChange={(e) => setEditActualQty(e.target.value)}
            className="h-7 text-xs w-20"
            placeholder="$"
          />
        </td>
        <td className="px-2 py-1.5" colSpan={2}>
          <div className="flex gap-1 justify-end">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleSave}
              disabled={updateSelection.isPending}
              className="text-green-600"
            >
              {updateSelection.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors group">
        <td className="px-1 py-1">
          <SelectionThumbnail
            selectionId={sel.id}
            onClick={onToggleImagePanel}
          />
        </td>
        <td className="px-2 py-1.5 text-sm font-medium">
          <div className="flex items-center gap-1">
            {sel.selection_name}
            {sel.material_id && (
              <Button
                size="xs"
                variant="ghost"
                onClick={onToggleExpand}
                className="text-[10px] h-5 px-1.5 text-blue-600 hover:text-blue-800 shrink-0"
              >
                <BarChart3 className="h-3 w-3 mr-0.5" />
                {isExpanded ? "Hide" : "Estimate"}
              </Button>
            )}
          </div>
          {(sel.manufacturer || sel.model_number) && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {[sel.manufacturer, sel.model_number].filter(Boolean).join(" / ")}
            </div>
          )}
        </td>
        <td className="px-2 py-1.5 text-xs text-muted-foreground">
          {categoryName}
        </td>
        <td className="px-2 py-1.5 text-xs">
          <span
            className={
              sel.material_id ? "text-foreground" : "text-muted-foreground italic"
            }
          >
            {materialName}
          </span>
          {supplierName && (
            <span className="text-[10px] text-muted-foreground ml-1">
              ({supplierName})
            </span>
          )}
        </td>
        <td className="px-2 py-1.5 text-xs tabular-nums text-right">
          {formatCurrency(sel.allowance_amount)}
        </td>
        <td className="px-2 py-1.5 text-xs tabular-nums">
          {sel.quantity != null
            ? `${sel.quantity} ${sel.unit ?? ""}`
            : "\u2014"}
        </td>
        <td className="px-2 py-1.5 text-xs tabular-nums text-right">
          {formatCurrency(estTotal)}
        </td>
        <td className="px-2 py-1.5 text-xs tabular-nums text-right">
          {formatCurrency(actTotal)}
        </td>
        <td className="px-2 py-1.5 text-xs tabular-nums text-right">
          <span
            className={
              variance == null
                ? "text-muted-foreground"
                : variance > 0
                  ? "text-red-600 font-medium"
                  : variance < 0
                    ? "text-green-600 font-medium"
                    : "text-muted-foreground"
            }
          >
            {formatCurrency(variance)}
          </span>
        </td>
        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1 justify-end">
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge.color}`}
            >
              {badge.label}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={startEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </td>
      </tr>
      {isExpanded && sel.material_id && (
        <tr>
          <td colSpan={10} className="px-2 py-2">
            <EstimateBuilder selection={sel} roomId={roomId} />
          </td>
        </tr>
      )}
      {isImagePanelOpen && (
        <tr>
          <td colSpan={10} className="px-2 py-2">
            <SelectionImagePanel
              selection={sel}
              roomId={roomId}
              roomName={roomName}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main SelectionEditor
// ---------------------------------------------------------------------------

type SelectionEditorProps = {
  roomId: string;
  projectId: string;
  roomName?: string;
};

export function SelectionEditor({ roomId, projectId, roomName }: SelectionEditorProps) {
  const { data: selections, isLoading } = useRoomSelections(roomId);
  const { data: categories } = useMaterialCategories();
  const { data: materials } = useMaterials();
  const [expandedSelectionId, setExpandedSelectionId] = useState<string | null>(null);
  const [imagePanelSelectionId, setImagePanelSelectionId] = useState<string | null>(null);

  // Suppress unused variable warning -- projectId reserved for future use
  void projectId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading selections...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(selections ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No selections yet. Add material selections below.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-1 py-1.5 w-12">
                  <ImageIcon className="h-3.5 w-3.5 mx-auto text-muted-foreground/50" />
                </th>
                <th className="px-2 py-1.5 font-medium">Selection</th>
                <th className="px-2 py-1.5 font-medium">Category</th>
                <th className="px-2 py-1.5 font-medium">Material</th>
                <th className="px-2 py-1.5 font-medium text-right">
                  Allowance
                </th>
                <th className="px-2 py-1.5 font-medium">Qty</th>
                <th className="px-2 py-1.5 font-medium text-right">
                  Est. Total
                </th>
                <th className="px-2 py-1.5 font-medium text-right">
                  Actual
                </th>
                <th className="px-2 py-1.5 font-medium text-right">
                  Variance
                </th>
                <th className="px-2 py-1.5 font-medium text-right w-28">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {(selections ?? []).map((sel) => (
                <SelectionRow
                  key={sel.id}
                  sel={sel}
                  roomId={roomId}
                  roomName={roomName}
                  categories={categories ?? []}
                  materials={materials}
                  isExpanded={expandedSelectionId === sel.id}
                  onToggleExpand={() =>
                    setExpandedSelectionId(
                      expandedSelectionId === sel.id ? null : sel.id
                    )
                  }
                  isImagePanelOpen={imagePanelSelectionId === sel.id}
                  onToggleImagePanel={() =>
                    setImagePanelSelectionId(
                      imagePanelSelectionId === sel.id ? null : sel.id
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddSelectionForm
        roomId={roomId}
        categories={categories ?? []}
        materials={materials}
      />
    </div>
  );
}
