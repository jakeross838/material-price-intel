import { useMemo } from "react";
import { useProjectRooms } from "@/hooks/useProjectRooms";
import { useProjectSelections } from "@/hooks/useProjectSelections";
import type { SelectionWithJoins } from "@/hooks/useProjectSelections";
import type { Project, ProjectRoom } from "@/lib/types";
import { Loader2, Camera } from "lucide-react";
import { usePrimaryImage, getImageDisplayUrl } from "@/hooks/useSelectionImages";

// ===========================================
// Props
// ===========================================

type SelectionSheetProps = {
  projectId: string;
  project: Project;
  showPricing: boolean;
  showImages?: boolean;
};

// ===========================================
// Helpers
// ===========================================

function fmtCurrency(val: number | null | undefined): string {
  if (val == null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function fmtCurrencySigned(val: number): string {
  const prefix = val > 0 ? "+" : "";
  return prefix + fmtCurrency(val);
}

function fmtQty(val: number | null | undefined): string {
  if (val == null) return "--";
  return val % 1 === 0 ? String(val) : val.toFixed(2);
}

function fmtDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusText(
  sel: SelectionWithJoins,
  showDollar: boolean
): { text: string; className: string } {
  const status = sel.upgrade_status;
  if (status === "pending") {
    return { text: "Pending", className: "text-amber-600" };
  }
  if (status === "standard") {
    return { text: "Standard", className: "text-slate-600" };
  }
  const total = sel.actual_total ?? sel.estimated_total ?? 0;
  const allowance = sel.allowance_amount ?? 0;
  const diff = total - allowance;
  if (status === "upgrade") {
    return {
      text: showDollar ? `Upgrade (${fmtCurrencySigned(diff)})` : "Upgrade",
      className: "text-red-600 font-medium",
    };
  }
  if (status === "downgrade") {
    return {
      text: showDollar ? `Downgrade (${fmtCurrencySigned(diff)})` : "Downgrade",
      className: "text-green-600 font-medium",
    };
  }
  return { text: "--", className: "" };
}

function bestPrice(sel: SelectionWithJoins): number | null {
  return sel.actual_unit_price ?? sel.estimated_unit_price ?? null;
}

function bestTotal(sel: SelectionWithJoins): number | null {
  return sel.actual_total ?? sel.estimated_total ?? null;
}

// ===========================================
// Room Table
// ===========================================

function SelectionImageCell({ selectionId }: { selectionId: string }) {
  const { data: primaryImage } = usePrimaryImage(selectionId);
  const url = primaryImage ? getImageDisplayUrl(primaryImage) : null;

  return (
    <td className="px-2 py-1.5 border border-slate-200 w-16">
      {url ? (
        <img
          src={url}
          alt=""
          className="w-12 h-12 object-cover rounded"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">
          <Camera className="h-4 w-4 text-slate-300" />
        </div>
      )}
    </td>
  );
}

function RoomSection({
  room,
  selections,
  showPricing,
  showImages,
}: {
  room: ProjectRoom;
  selections: SelectionWithJoins[];
  showPricing: boolean;
  showImages: boolean;
}) {
  const roomTotal = selections.reduce((sum, s) => sum + (bestTotal(s) ?? 0), 0);

  return (
    <div className="selection-sheet-room">
      <h3 className="text-base font-semibold border-b border-slate-300 pb-1 mb-2">
        {room.name}
      </h3>

      <table className="selection-sheet-table w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50">
            {showImages && (
              <th className="text-center px-2 py-1.5 border border-slate-200 font-medium w-16">
                Image
              </th>
            )}
            <th className="text-left px-2 py-1.5 border border-slate-200 font-medium">
              Item
            </th>
            <th className="text-left px-2 py-1.5 border border-slate-200 font-medium">
              Material
            </th>
            <th className="text-left px-2 py-1.5 border border-slate-200 font-medium">
              Supplier
            </th>
            <th className="text-right px-2 py-1.5 border border-slate-200 font-medium">
              Qty
            </th>
            <th className="text-left px-2 py-1.5 border border-slate-200 font-medium">
              Unit
            </th>
            {showPricing && (
              <>
                <th className="text-right px-2 py-1.5 border border-slate-200 font-medium">
                  Unit Price
                </th>
                <th className="text-right px-2 py-1.5 border border-slate-200 font-medium">
                  Total
                </th>
              </>
            )}
            <th className="text-left px-2 py-1.5 border border-slate-200 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {selections.length === 0 ? (
            <tr>
              <td
                colSpan={(showPricing ? 8 : 6) + (showImages ? 1 : 0)}
                className="text-center text-slate-400 py-3 border border-slate-200"
              >
                No selections for this room
              </td>
            </tr>
          ) : (
            selections.map((sel) => {
              const materialName =
                sel.materials?.canonical_name ?? sel.description ?? "TBD";
              const supplierName = sel.suppliers?.name ?? "--";
              const status = getStatusText(sel, showPricing);

              return (
                <tr key={sel.id}>
                  {showImages && <SelectionImageCell selectionId={sel.id} />}
                  <td className="px-2 py-1.5 border border-slate-200">
                    {sel.selection_name}
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    {materialName}
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    {supplierName}
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200 text-right tabular-nums">
                    {fmtQty(sel.quantity)}
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    {sel.unit ?? "--"}
                  </td>
                  {showPricing && (
                    <>
                      <td className="px-2 py-1.5 border border-slate-200 text-right tabular-nums">
                        {fmtCurrency(bestPrice(sel))}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-200 text-right tabular-nums">
                        {fmtCurrency(bestTotal(sel))}
                      </td>
                    </>
                  )}
                  <td className={`px-2 py-1.5 border border-slate-200 ${status.className}`}>
                    {status.text}
                  </td>
                </tr>
              );
            })
          )}
          {showPricing && selections.length > 0 && (
            <tr className="bg-slate-50 font-medium">
              <td
                colSpan={6 + (showImages ? 1 : 0)}
                className="px-2 py-1.5 border border-slate-200 text-right"
              >
                Room Subtotal
              </td>
              <td className="px-2 py-1.5 border border-slate-200 text-right tabular-nums">
                {fmtCurrency(roomTotal)}
              </td>
              <td className="px-2 py-1.5 border border-slate-200" />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ===========================================
// Main Component
// ===========================================

export function SelectionSheet({
  projectId,
  project,
  showPricing,
  showImages = false,
}: SelectionSheetProps) {
  const { data: rooms, isLoading: roomsLoading } = useProjectRooms(projectId);
  const { data: allSelections, isLoading: selectionsLoading } =
    useProjectSelections(projectId);

  // Group selections by room_id
  const selectionsByRoom = useMemo(() => {
    const map = new Map<string, SelectionWithJoins[]>();
    for (const sel of allSelections ?? []) {
      const arr = map.get(sel.room_id) ?? [];
      arr.push(sel);
      map.set(sel.room_id, arr);
    }
    return map;
  }, [allSelections]);

  // Sort rooms by sort_order
  const sortedRooms = useMemo(
    () => [...(rooms ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [rooms]
  );

  // Aggregate totals
  const totals = useMemo(() => {
    const sels = allSelections ?? [];
    const totalAllowance = sels.reduce(
      (sum, s) => sum + (s.allowance_amount ?? 0),
      0
    );
    const totalSelections = sels.reduce(
      (sum, s) => sum + (bestTotal(s) ?? 0),
      0
    );
    const netDiff = totalSelections - totalAllowance;
    return { totalAllowance, totalSelections, netDiff };
  }, [allSelections]);

  const isLoading = roomsLoading || selectionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading selection sheet...
      </div>
    );
  }

  const addressParts = [project.address, project.city, project.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="selection-sheet bg-white text-black max-w-[900px] mx-auto">
      {/* ========= Header ========= */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">
          Ross Built Custom Homes
        </p>
        <h1 className="text-2xl font-bold mb-1">Material Selection Sheet</h1>
        <div className="border-t border-b border-slate-300 py-3 mt-3 space-y-0.5">
          <p className="text-lg font-semibold">{project.name}</p>
          {project.client_name && (
            <p className="text-sm text-slate-600">
              Client: {project.client_name}
            </p>
          )}
          {addressParts && (
            <p className="text-sm text-slate-600">{addressParts}</p>
          )}
          <div className="flex justify-center gap-6 text-xs text-slate-500 mt-1">
            <span>Date: {fmtDate()}</span>
            {project.square_footage && (
              <span>{project.square_footage.toLocaleString()} sqft</span>
            )}
          </div>
        </div>
      </div>

      {/* ========= Room Sections ========= */}
      <div className="space-y-6">
        {sortedRooms.map((room) => (
          <RoomSection
            key={room.id}
            room={room}
            selections={selectionsByRoom.get(room.id) ?? []}
            showPricing={showPricing}
            showImages={showImages}
          />
        ))}
      </div>

      {/* ========= Summary ========= */}
      {showPricing && (
        <div className="mt-8 border-t-2 border-slate-400 pt-4">
          <h3 className="text-base font-semibold mb-3">Summary</h3>
          <table className="w-auto text-sm">
            <tbody>
              <tr>
                <td className="pr-8 py-1 text-slate-600">Total Allowances</td>
                <td className="text-right tabular-nums font-medium py-1">
                  {fmtCurrency(totals.totalAllowance)}
                </td>
              </tr>
              <tr>
                <td className="pr-8 py-1 text-slate-600">
                  Total Selections Cost
                </td>
                <td className="text-right tabular-nums font-medium py-1">
                  {fmtCurrency(totals.totalSelections)}
                </td>
              </tr>
              <tr className="border-t border-slate-300">
                <td className="pr-8 py-1 font-semibold">
                  Net {totals.netDiff >= 0 ? "Upgrade" : "Savings"}
                </td>
                <td
                  className={`text-right tabular-nums font-bold py-1 ${
                    totals.netDiff > 0
                      ? "text-red-600"
                      : totals.netDiff < 0
                        ? "text-green-600"
                        : ""
                  }`}
                >
                  {fmtCurrencySigned(totals.netDiff)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-400 mt-3 italic">
            Amounts shown are estimates and subject to change.
          </p>
        </div>
      )}

      {/* ========= Signature Lines ========= */}
      <div className="mt-12 space-y-8">
        <div className="flex items-end gap-4">
          <span className="text-sm font-medium whitespace-nowrap">
            Approved by:
          </span>
          <span className="flex-1 border-b border-slate-400" />
          <span className="text-sm font-medium whitespace-nowrap">Date:</span>
          <span className="w-40 border-b border-slate-400" />
        </div>
        <div className="flex items-end gap-4">
          <span className="text-sm font-medium whitespace-nowrap">
            Builder:
          </span>
          <span className="flex-1 border-b border-slate-400" />
          <span className="text-sm font-medium whitespace-nowrap">Date:</span>
          <span className="w-40 border-b border-slate-400" />
        </div>
      </div>
    </div>
  );
}
