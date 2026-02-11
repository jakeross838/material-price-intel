import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjectSelections, type SelectionWithJoins } from "@/hooks/useProjectSelections";
import { useProjectRooms } from "@/hooks/useProjectRooms";
import { VarianceChart } from "@/components/projects/VarianceChart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BudgetDashboardProps = {
  projectId: string;
  targetBudget: number | null;
};

type GroupBy = "room" | "category";

type SortField = "name" | "variance" | "variancePct";
type SortDir = "asc" | "desc";

type AggregatedRow = {
  id: string;
  name: string;
  allowance: number;
  estimated: number;
  actual: number;
  variance: number;
  variancePct: number | null;
  selections: SelectionWithJoins[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (val: number | null) => {
  if (val == null) return "\u2014";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

const formatCurrencyDetailed = (val: number | null) => {
  if (val == null) return "\u2014";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const formatPct = (val: number | null) => {
  if (val == null) return "\u2014";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
};

const varianceColor = (variance: number) => {
  if (variance > 0) return "text-red-600";
  if (variance < 0) return "text-green-600";
  return "";
};

const varianceBg = (variance: number) => {
  if (variance > 0) return "bg-red-50";
  if (variance < 0) return "bg-green-50";
  return "";
};

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

function aggregateByRoom(
  selections: SelectionWithJoins[],
  rooms: Array<{ id: string; name: string }>
): AggregatedRow[] {
  const roomMap = new Map<string, AggregatedRow>();

  for (const room of rooms) {
    roomMap.set(room.id, {
      id: room.id,
      name: room.name,
      allowance: 0,
      estimated: 0,
      actual: 0,
      variance: 0,
      variancePct: null,
      selections: [],
    });
  }

  for (const sel of selections) {
    let row = roomMap.get(sel.room_id);
    if (!row) {
      row = {
        id: sel.room_id,
        name: "Unknown Room",
        allowance: 0,
        estimated: 0,
        actual: 0,
        variance: 0,
        variancePct: null,
        selections: [],
      };
      roomMap.set(sel.room_id, row);
    }
    row.allowance += sel.allowance_amount ?? 0;
    row.estimated += sel.estimated_total ?? 0;
    row.actual += sel.actual_total ?? 0;
    row.selections.push(sel);
  }

  // Compute variance for each room
  for (const row of roomMap.values()) {
    const hasActuals = row.selections.some((s) => s.actual_total != null);
    const effective = hasActuals ? row.actual : row.estimated;
    row.variance = effective - row.allowance;
    row.variancePct =
      row.allowance > 0 ? ((effective - row.allowance) / row.allowance) * 100 : null;
  }

  // Filter out rooms with no selections
  return [...roomMap.values()].filter((r) => r.selections.length > 0);
}

function aggregateByCategory(selections: SelectionWithJoins[]): AggregatedRow[] {
  const catMap = new Map<string, AggregatedRow>();

  for (const sel of selections) {
    const catId = sel.category_id ?? "__uncategorized";
    const catName =
      sel.material_categories?.display_name ??
      sel.material_categories?.name ??
      "Uncategorized";

    let row = catMap.get(catId);
    if (!row) {
      row = {
        id: catId,
        name: catName,
        allowance: 0,
        estimated: 0,
        actual: 0,
        variance: 0,
        variancePct: null,
        selections: [],
      };
      catMap.set(catId, row);
    }
    row.allowance += sel.allowance_amount ?? 0;
    row.estimated += sel.estimated_total ?? 0;
    row.actual += sel.actual_total ?? 0;
    row.selections.push(sel);
  }

  // Compute variance for each category
  for (const row of catMap.values()) {
    const hasActuals = row.selections.some((s) => s.actual_total != null);
    const effective = hasActuals ? row.actual : row.estimated;
    row.variance = effective - row.allowance;
    row.variancePct =
      row.allowance > 0 ? ((effective - row.allowance) / row.allowance) * 100 : null;
  }

  return [...catMap.values()];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BudgetDashboard({ projectId, targetBudget }: BudgetDashboardProps) {
  const { data: allSelections, isLoading: selectionsLoading } =
    useProjectSelections(projectId);
  const { data: rooms, isLoading: roomsLoading } = useProjectRooms(projectId);

  const [groupBy, setGroupBy] = useState<GroupBy>("room");
  const [sortField, setSortField] = useState<SortField>("variancePct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // ---- Computed totals ----

  const {
    totalAllowance,
    totalEstimated,
    totalActual,
    totalVariance,
    hasActuals,
    itemsWithActuals,
    totalItems,
    unbudgetedSelections,
  } = useMemo(() => {
    const sels = allSelections ?? [];
    const tAllowance = sels.reduce((s, sel) => s + (sel.allowance_amount ?? 0), 0);
    const tEstimated = sels.reduce((s, sel) => s + (sel.estimated_total ?? 0), 0);
    const tActual = sels.reduce((s, sel) => s + (sel.actual_total ?? 0), 0);
    const hActuals = sels.some((sel) => sel.actual_total != null);
    const effective = hActuals ? tActual : tEstimated;
    const tVariance = effective - tAllowance;
    const iWithActuals = sels.filter((sel) => sel.actual_total != null).length;
    const unbudgeted = sels.filter((sel) => sel.allowance_amount == null || sel.allowance_amount === 0);

    return {
      totalAllowance: tAllowance,
      totalEstimated: tEstimated,
      totalActual: tActual,
      totalVariance: tVariance,
      hasActuals: hActuals,
      itemsWithActuals: iWithActuals,
      totalItems: sels.length,
      unbudgetedSelections: unbudgeted,
    };
  }, [allSelections]);

  // ---- Budget health ----

  const budgetHealthPct = useMemo(() => {
    if (!targetBudget || targetBudget <= 0) return null;
    const effective = hasActuals ? totalActual : totalEstimated;
    return (effective / targetBudget) * 100;
  }, [targetBudget, totalActual, totalEstimated, hasActuals]);

  // ---- Aggregated rows ----

  const aggregatedRows = useMemo(() => {
    const sels = allSelections ?? [];
    const rms = rooms ?? [];

    if (groupBy === "room") {
      return aggregateByRoom(sels, rms);
    }
    return aggregateByCategory(sels);
  }, [allSelections, rooms, groupBy]);

  // ---- Sorted rows ----

  const sortedRows = useMemo(() => {
    const rows = [...aggregatedRows];
    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "variance":
          cmp = a.variance - b.variance;
          break;
        case "variancePct":
          cmp = (a.variancePct ?? 0) - (b.variancePct ?? 0);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return rows;
  }, [aggregatedRows, sortField, sortDir]);

  // ---- Chart data ----

  const chartData = useMemo(() => {
    return aggregatedRows.map((r) => ({
      name: r.name,
      allowance: r.allowance,
      estimated: r.estimated,
      actual: r.actual,
      variance: r.variance,
    }));
  }, [aggregatedRows]);

  // ---- Interaction ----

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // ---- Loading state ----

  if (selectionsLoading || roomsLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading budget data...
      </div>
    );
  }

  if (!allSelections || allSelections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <DollarSign className="h-10 w-10 mb-3" />
        <p className="text-sm font-medium">No selections yet</p>
        <p className="text-xs mt-1">
          Add material selections to rooms to start tracking budget vs. actuals.
        </p>
      </div>
    );
  }

  const budgetHealthColor =
    budgetHealthPct == null
      ? "bg-slate-200"
      : budgetHealthPct > 100
        ? "bg-red-500"
        : budgetHealthPct >= 90
          ? "bg-amber-500"
          : "bg-green-500";

  // Footer totals for the table
  const footerTotals = aggregatedRows.reduce(
    (acc, r) => ({
      allowance: acc.allowance + r.allowance,
      estimated: acc.estimated + r.estimated,
      actual: acc.actual + r.actual,
      variance: acc.variance + r.variance,
    }),
    { allowance: 0, estimated: 0, actual: 0, variance: 0 }
  );
  const footerVariancePct =
    footerTotals.allowance > 0
      ? ((footerTotals.variance) / footerTotals.allowance) * 100
      : null;

  return (
    <div className="space-y-6">
      {/* ---- Summary Cards ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <DollarSign className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-xl font-bold tabular-nums">
                  {targetBudget ? formatCurrency(targetBudget) : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Allowances</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatCurrency(totalAllowance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Estimate</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatCurrency(totalEstimated)}
                </p>
                {hasActuals && (
                  <p className="text-[10px] text-muted-foreground">
                    Actual: {formatCurrency(totalActual)} ({itemsWithActuals}/{totalItems} items)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  totalVariance > 0 ? "bg-red-100" : totalVariance < 0 ? "bg-green-100" : "bg-slate-100"
                }`}
              >
                {totalVariance > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-600" />
                ) : totalVariance < 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                ) : (
                  <DollarSign className="h-5 w-5 text-slate-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected Variance</p>
                <p className={`text-xl font-bold tabular-nums ${varianceColor(totalVariance)}`}>
                  {totalVariance > 0 ? "+" : ""}
                  {formatCurrency(totalVariance)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {totalVariance > 0
                    ? "Over budget"
                    : totalVariance < 0
                      ? "Under budget"
                      : "On budget"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- Budget Health Bar ---- */}
      {budgetHealthPct != null && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Budget Health</p>
              <p className={`text-sm font-medium ${
                budgetHealthPct > 100 ? "text-red-600" : budgetHealthPct >= 90 ? "text-amber-600" : "text-green-600"
              }`}>
                {budgetHealthPct > 100
                  ? `${(budgetHealthPct - 100).toFixed(1)}% over budget`
                  : `${budgetHealthPct.toFixed(1)}% of budget used`}
              </p>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${budgetHealthColor}`}
                style={{ width: `${Math.min(budgetHealthPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">$0</p>
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(targetBudget)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Chart Toggle + Chart ---- */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Variance by {groupBy === "room" ? "Room" : "Category"}</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={groupBy === "room" ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupBy("room")}
              >
                By Room
              </Button>
              <Button
                variant={groupBy === "category" ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupBy("category")}
              >
                By Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VarianceChart data={chartData} groupBy={groupBy} />
        </CardContent>
      </Card>

      {/* ---- Detailed Variance Table ---- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Detailed Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium w-8" />
                  <th className="text-left py-2 px-2 font-medium">
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort("name")}
                    >
                      Name
                      {sortField === "name" && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="text-right py-2 px-2 font-medium">Allowance</th>
                  <th className="text-right py-2 px-2 font-medium">Estimated</th>
                  <th className="text-right py-2 px-2 font-medium">Actual</th>
                  <th className="text-right py-2 px-2 font-medium">
                    <button
                      className="flex items-center gap-1 ml-auto hover:text-foreground"
                      onClick={() => toggleSort("variance")}
                    >
                      Variance
                      {sortField === "variance" && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="text-right py-2 px-2 font-medium">
                    <button
                      className="flex items-center gap-1 ml-auto hover:text-foreground"
                      onClick={() => toggleSort("variancePct")}
                    >
                      Var %
                      {sortField === "variancePct" && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const isExpanded = expandedRows.has(row.id);
                  return (
                    <VarianceTableGroup
                      key={row.id}
                      row={row}
                      isExpanded={isExpanded}
                      onToggle={() => toggleExpand(row.id)}
                    />
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-2 px-2" />
                  <td className="py-2 px-2">Total</td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {formatCurrency(footerTotals.allowance)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {formatCurrency(footerTotals.estimated)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {formatCurrency(footerTotals.actual)}
                  </td>
                  <td className={`py-2 px-2 text-right tabular-nums ${varianceColor(footerTotals.variance)}`}>
                    {footerTotals.variance > 0 ? "+" : ""}
                    {formatCurrency(footerTotals.variance)}
                  </td>
                  <td className={`py-2 px-2 text-right tabular-nums ${varianceColor(footerTotals.variance)}`}>
                    {formatPct(footerVariancePct)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ---- Unbudgeted Items Warning ---- */}
      {unbudgetedSelections.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {unbudgetedSelections.length} selection{unbudgetedSelections.length !== 1 ? "s" : ""} have no allowance set
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Set allowances to track budget variance for these items:
                </p>
                <ul className="mt-1.5 text-xs text-amber-700 space-y-0.5">
                  {unbudgetedSelections.slice(0, 10).map((sel) => (
                    <li key={sel.id}>- {sel.selection_name}</li>
                  ))}
                  {unbudgetedSelections.length > 10 && (
                    <li>... and {unbudgetedSelections.length - 10} more</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VarianceTableGroup -- expandable row + children
// ---------------------------------------------------------------------------

function VarianceTableGroup({
  row,
  isExpanded,
  onToggle,
}: {
  row: AggregatedRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`border-b cursor-pointer hover:bg-accent/50 ${varianceBg(row.variance)}`}
        onClick={onToggle}
      >
        <td className="py-2 px-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </td>
        <td className="py-2 px-2 font-medium">
          {row.name}
          <span className="ml-1.5 text-xs text-muted-foreground">
            ({row.selections.length})
          </span>
        </td>
        <td className="py-2 px-2 text-right tabular-nums">
          {formatCurrency(row.allowance)}
        </td>
        <td className="py-2 px-2 text-right tabular-nums">
          {formatCurrency(row.estimated)}
        </td>
        <td className="py-2 px-2 text-right tabular-nums">
          {row.selections.some((s) => s.actual_total != null)
            ? formatCurrency(row.actual)
            : "\u2014"}
        </td>
        <td className={`py-2 px-2 text-right tabular-nums ${varianceColor(row.variance)}`}>
          {row.variance > 0 ? "+" : ""}
          {formatCurrency(row.variance)}
        </td>
        <td className={`py-2 px-2 text-right tabular-nums ${varianceColor(row.variance)}`}>
          {formatPct(row.variancePct)}
        </td>
      </tr>
      {isExpanded &&
        row.selections.map((sel) => {
          const selVariance = (sel.variance_amount ?? 0);
          const selAllowance = sel.allowance_amount ?? 0;
          const selVariancePct =
            selAllowance > 0
              ? (selVariance / selAllowance) * 100
              : null;
          return (
            <tr key={sel.id} className="border-b bg-muted/30">
              <td className="py-1.5 px-2" />
              <td className="py-1.5 px-2 pl-8 text-muted-foreground">
                {sel.selection_name}
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
                {formatCurrencyDetailed(sel.allowance_amount)}
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
                {formatCurrencyDetailed(sel.estimated_total)}
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
                {sel.actual_total != null
                  ? formatCurrencyDetailed(sel.actual_total)
                  : "\u2014"}
              </td>
              <td
                className={`py-1.5 px-2 text-right tabular-nums ${varianceColor(selVariance)}`}
              >
                {selVariance > 0 ? "+" : ""}
                {formatCurrencyDetailed(sel.variance_amount)}
              </td>
              <td
                className={`py-1.5 px-2 text-right tabular-nums ${varianceColor(selVariance)}`}
              >
                {formatPct(selVariancePct)}
              </td>
            </tr>
          );
        })}
    </>
  );
}
