import { useState } from "react";
import { Link } from "react-router";
import {
  Loader2,
  Plus,
  LinkIcon,
  ExternalLink,
  Package,
  Truck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useProcurementItems,
  useCreateProcurement,
  useUpdateProcurement,
} from "@/hooks/useProcurement";
import {
  useProjectSelections,
  type SelectionWithJoins,
} from "@/hooks/useProjectSelections";
import { QuoteLinkModal } from "@/components/projects/QuoteLinkModal";
import type { ProcurementStatus } from "@/lib/types";
import type { ProcurementItemWithJoins } from "@/hooks/useProcurement";

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ProcurementStatus,
  { label: string; color: string; bgBar: string }
> = {
  not_quoted: {
    label: "Not Quoted",
    color: "bg-gray-100 text-gray-700",
    bgBar: "bg-gray-400",
  },
  rfq_sent: {
    label: "RFQ Sent",
    color: "bg-blue-100 text-blue-700",
    bgBar: "bg-blue-500",
  },
  quoted: {
    label: "Quoted",
    color: "bg-amber-100 text-amber-700",
    bgBar: "bg-amber-500",
  },
  awarded: {
    label: "Awarded",
    color: "bg-purple-100 text-purple-700",
    bgBar: "bg-purple-500",
  },
  ordered: {
    label: "Ordered",
    color: "bg-indigo-100 text-indigo-700",
    bgBar: "bg-indigo-500",
  },
  delivered: {
    label: "Delivered",
    color: "bg-teal-100 text-teal-700",
    bgBar: "bg-teal-500",
  },
  installed: {
    label: "Installed",
    color: "bg-green-100 text-green-700",
    bgBar: "bg-green-500",
  },
};

const ALL_STATUSES: ProcurementStatus[] = [
  "not_quoted",
  "rfq_sent",
  "quoted",
  "awarded",
  "ordered",
  "delivered",
  "installed",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number | null | undefined) {
  if (val == null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

// ---------------------------------------------------------------------------
// ProcurementTracker
// Project-level procurement status board showing all selections and their
// buyout status. Provides the main interface for the procurement workflow.
// ---------------------------------------------------------------------------

type ProcurementTrackerProps = {
  projectId: string;
};

export function ProcurementTracker({ projectId }: ProcurementTrackerProps) {
  const { data: procItems, isLoading: procLoading } =
    useProcurementItems(projectId);
  const { data: allSelections, isLoading: selLoading } =
    useProjectSelections(projectId);
  const createProcurement = useCreateProcurement();
  const updateProcurement = useUpdateProcurement();

  const [statusFilter, setStatusFilter] = useState<ProcurementStatus | "all">(
    "all"
  );
  const [quoteLinkTarget, setQuoteLinkTarget] = useState<{
    selection: SelectionWithJoins;
    procurementId: string;
  } | null>(null);

  if (procLoading || selLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading procurement data...
      </div>
    );
  }

  const items = procItems ?? [];
  const selections = allSelections ?? [];

  // Build a set of selection IDs that already have procurement records
  const trackedSelectionIds = new Set(items.map((p) => p.selection_id));

  // Selections without procurement records
  const untrackedSelections = selections.filter(
    (s) => !trackedSelectionIds.has(s.id)
  );

  // Compute progress stats
  const totalTracked = items.length;
  const totalUntracked = untrackedSelections.length;
  const totalSelections = totalTracked + totalUntracked;

  const boughtOut = items.filter((p) =>
    ["awarded", "ordered", "delivered", "installed"].includes(p.status)
  ).length;
  const pctComplete =
    totalSelections > 0 ? Math.round((boughtOut / totalSelections) * 100) : 0;

  // Status counts for the progress bar
  const statusCounts: Record<ProcurementStatus, number> = {
    not_quoted: totalUntracked,
    rfq_sent: 0,
    quoted: 0,
    awarded: 0,
    ordered: 0,
    delivered: 0,
    installed: 0,
  };
  for (const item of items) {
    statusCounts[item.status] = (statusCounts[item.status] ?? 0) + 1;
  }

  // Filter items for the table
  const filteredItems =
    statusFilter === "all"
      ? items
      : items.filter((p) => p.status === statusFilter);

  const showUntracked =
    statusFilter === "all" || statusFilter === "not_quoted";

  // Helper to get the selection object for an untracked selection
  function getSelectionForItem(
    item: ProcurementItemWithJoins
  ): SelectionWithJoins | undefined {
    const sel = item.project_selections as {
      id?: string;
      selection_name?: string;
      room_id?: string;
      material_id?: string | null;
      category_id?: string | null;
      quantity?: number | null;
      unit?: string | null;
      estimated_unit_price?: number | null;
    } | null;
    if (!sel?.id) return undefined;
    return selections.find((s) => s.id === sel.id);
  }

  function handleStartTracking(selection: SelectionWithJoins) {
    createProcurement.mutate({
      selection_id: selection.id,
      projectId,
    });
  }

  function handleStatusChange(
    item: ProcurementItemWithJoins,
    newStatus: ProcurementStatus
  ) {
    const selId =
      (item.project_selections as { id?: string } | null)?.id ?? "";
    updateProcurement.mutate({
      id: item.id,
      projectId,
      selectionId: selId,
      updates: { status: newStatus },
    });
  }

  function handleAdvanceStatus(
    item: ProcurementItemWithJoins,
    toStatus: ProcurementStatus
  ) {
    handleStatusChange(item, toStatus);
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {boughtOut} of {totalSelections} items bought out
          </span>
          <span className="text-muted-foreground">{pctComplete}% complete</span>
        </div>

        {/* Stacked progress bar */}
        {totalSelections > 0 && (
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100">
            {ALL_STATUSES.map((status) => {
              const count = statusCounts[status];
              if (count === 0) return null;
              const widthPct = (count / totalSelections) * 100;
              return (
                <div
                  key={status}
                  className={`${STATUS_CONFIG[status].bgBar} transition-all`}
                  style={{ width: `${widthPct}%` }}
                  title={`${STATUS_CONFIG[status].label}: ${count}`}
                />
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {ALL_STATUSES.map((status) => {
            const count = statusCounts[status];
            if (count === 0) return null;
            return (
              <div key={status} className="flex items-center gap-1 text-xs">
                <div
                  className={`h-2 w-2 rounded-full ${STATUS_CONFIG[status].bgBar}`}
                />
                <span className="text-muted-foreground">
                  {STATUS_CONFIG[status].label}: {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Filter:</label>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ProcurementStatus | "all")
          }
          className="text-xs border rounded px-2 py-1 bg-background"
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s].label} ({statusCounts[s]})
            </option>
          ))}
        </select>
      </div>

      {/* Procurement table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 font-medium">Selection</th>
              <th className="pb-2 font-medium">Material</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Supplier</th>
              <th className="pb-2 font-medium text-right">Price</th>
              <th className="pb-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Tracked items */}
            {filteredItems.map((item) => {
              const sel = item.project_selections as {
                id?: string;
                selection_name?: string;
                material_id?: string | null;
                estimated_unit_price?: number | null;
                estimated_total?: number | null;
              } | null;
              const quote = item.quotes as {
                id?: string;
                supplier_id?: string;
                quote_number?: string | null;
                suppliers?: { name?: string } | null;
              } | null;
              const selObj = getSelectionForItem(item);

              const supplierName = quote?.suppliers?.name ?? "--";
              const price =
                item.committed_price ?? sel?.estimated_total ?? null;

              return (
                <tr
                  key={item.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="py-2.5 pr-2 font-medium">
                    {sel?.selection_name ?? "--"}
                  </td>
                  <td className="py-2.5 pr-2 text-muted-foreground truncate max-w-[140px]">
                    {selObj?.materials
                      ? (selObj.materials as { canonical_name?: string })
                          .canonical_name ?? "--"
                      : "--"}
                  </td>
                  <td className="py-2.5 pr-2">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(
                          item,
                          e.target.value as ProcurementStatus
                        )
                      }
                      className={`text-xs font-medium rounded-full px-2 py-0.5 border-0 cursor-pointer ${STATUS_CONFIG[item.status].color}`}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_CONFIG[s].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 pr-2 text-muted-foreground">
                    {supplierName}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums font-medium">
                    {formatCurrency(price)}
                    {item.committed_price != null && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        committed
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Link Quote button -- for pre-award statuses */}
                      {["not_quoted", "rfq_sent", "quoted"].includes(
                        item.status
                      ) &&
                        selObj && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() =>
                              setQuoteLinkTarget({
                                selection: selObj,
                                procurementId: item.id,
                              })
                            }
                          >
                            <LinkIcon className="h-3 w-3" />
                            Link Quote
                          </Button>
                        )}

                      {/* View Quote link -- when quote is linked */}
                      {quote?.id && (
                        <Button size="xs" variant="ghost" asChild>
                          <Link to={`/quotes/${quote.id}`}>
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Link>
                        </Button>
                      )}

                      {/* Status advance buttons */}
                      {item.status === "awarded" && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            handleAdvanceStatus(item, "ordered")
                          }
                        >
                          <Package className="h-3 w-3" />
                          Ordered
                        </Button>
                      )}
                      {item.status === "ordered" && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            handleAdvanceStatus(item, "delivered")
                          }
                        >
                          <Truck className="h-3 w-3" />
                          Delivered
                        </Button>
                      )}
                      {item.status === "delivered" && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            handleAdvanceStatus(item, "installed")
                          }
                        >
                          <Wrench className="h-3 w-3" />
                          Installed
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Untracked selections */}
            {showUntracked &&
              untrackedSelections.map((sel) => (
                <tr
                  key={sel.id}
                  className="border-b last:border-0 hover:bg-muted/30 text-muted-foreground"
                >
                  <td className="py-2.5 pr-2 font-medium text-foreground">
                    {sel.selection_name}
                  </td>
                  <td className="py-2.5 pr-2 truncate max-w-[140px]">
                    {sel.materials
                      ? (sel.materials as { canonical_name?: string })
                          .canonical_name ?? "--"
                      : "--"}
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="text-xs bg-gray-50 text-gray-500 rounded-full px-2 py-0.5">
                      Not Tracked
                    </span>
                  </td>
                  <td className="py-2.5 pr-2">--</td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">
                    {formatCurrency(sel.estimated_total)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleStartTracking(sel)}
                      disabled={createProcurement.isPending}
                    >
                      {createProcurement.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Start Tracking
                    </Button>
                  </td>
                </tr>
              ))}

            {/* Empty state */}
            {filteredItems.length === 0 &&
              (!showUntracked || untrackedSelections.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {statusFilter !== "all"
                      ? `No items with status "${STATUS_CONFIG[statusFilter as ProcurementStatus].label}".`
                      : "No selections yet. Add rooms and selections first."}
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* QuoteLinkModal */}
      {quoteLinkTarget && (
        <QuoteLinkModal
          selection={quoteLinkTarget.selection}
          procurementId={quoteLinkTarget.procurementId}
          projectId={projectId}
          onClose={() => setQuoteLinkTarget(null)}
          onAwarded={() => setQuoteLinkTarget(null)}
        />
      )}
    </div>
  );
}
