import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Loader2,
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  FileText,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useReportsData,
  useReportsCategories,
  useReportsSuppliers,
  useReportsMaterials,
} from "@/hooks/useReportsData";
import { PriceTrendChart } from "@/components/reports/PriceTrendChart";
import { CategoryAggregateChart } from "@/components/reports/CategoryAggregateChart";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number | null) {
  if (val == null) return "\u2014";
  return `$${Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportsPage() {
  const navigate = useNavigate();
  const { data: reportData, isLoading } = useReportsData();
  const { data: categories } = useReportsCategories();
  const { data: suppliers } = useReportsSuppliers();
  const { data: materials } = useReportsMaterials();

  const handlePointClick = (quoteId: string) => {
    navigate(`/quotes/${quoteId}`);
  };

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [chartView, setChartView] = useState<"supplier" | "category">("supplier");

  const selectedMaterialName =
    materials?.find((m) => m.id === materialFilter)?.canonical_name ?? null;

  // Filter materials dropdown by category
  const filteredMaterialOptions = useMemo(() => {
    if (!materials) return [];
    if (categoryFilter === "all") return materials;
    return materials.filter((m) => m.category_id === categoryFilter);
  }, [materials, categoryFilter]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!reportData) return [];
    return reportData.filter((item) => {
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter)
        return false;
      if (materialFilter !== "all" && item.materialId !== materialFilter)
        return false;
      if (supplierFilter !== "all" && item.supplierName !== supplierFilter)
        return false;
      if (dateFrom && item.quoteDate && item.quoteDate < dateFrom) return false;
      if (dateTo && item.quoteDate && item.quoteDate > dateTo) return false;
      return true;
    });
  }, [reportData, categoryFilter, materialFilter, supplierFilter, dateFrom, dateTo]);

  // Category chart data: all filters EXCEPT materialFilter
  const categoryChartData = useMemo(() => {
    if (!reportData) return [];
    return reportData.filter((item) => {
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter)
        return false;
      if (supplierFilter !== "all" && item.supplierName !== supplierFilter)
        return false;
      if (dateFrom && item.quoteDate && item.quoteDate < dateFrom) return false;
      if (dateTo && item.quoteDate && item.quoteDate > dateTo) return false;
      // NOTE: materialFilter intentionally NOT applied here
      return true;
    });
  }, [reportData, categoryFilter, supplierFilter, dateFrom, dateTo]);

  const hasFilters =
    categoryFilter !== "all" ||
    materialFilter !== "all" ||
    supplierFilter !== "all" ||
    dateFrom ||
    dateTo;

  const clearFilters = () => {
    setCategoryFilter("all");
    setMaterialFilter("all");
    setSupplierFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  // Stat cards
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    const prices = filteredData.map((d) => d.effectiveUnitPrice);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;

    // Price trend: compare recent half vs older half
    const sorted = [...filteredData].sort((a, b) =>
      (a.quoteDate ?? "").localeCompare(b.quoteDate ?? "")
    );
    const mid = Math.floor(sorted.length / 2);
    const olderPrices = sorted.slice(0, mid).map((d) => d.effectiveUnitPrice);
    const recentPrices = sorted.slice(mid).map((d) => d.effectiveUnitPrice);
    const olderAvg =
      olderPrices.length > 0
        ? olderPrices.reduce((s, p) => s + p, 0) / olderPrices.length
        : avg;
    const recentAvg =
      recentPrices.length > 0
        ? recentPrices.reduce((s, p) => s + p, 0) / recentPrices.length
        : avg;
    const pctChange =
      olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    let trend: "rising" | "falling" | "stable" = "stable";
    if (pctChange > 5) trend = "rising";
    else if (pctChange < -5) trend = "falling";

    // Best supplier (lowest avg price)
    const supplierAvgs = new Map<string, { total: number; count: number }>();
    for (const d of filteredData) {
      const entry = supplierAvgs.get(d.supplierName) ?? { total: 0, count: 0 };
      entry.total += d.effectiveUnitPrice;
      entry.count += 1;
      supplierAvgs.set(d.supplierName, entry);
    }
    let bestSupplier = "--";
    let bestAvg = Infinity;
    for (const [name, entry] of supplierAvgs) {
      const sAvg = entry.total / entry.count;
      if (sAvg < bestAvg) {
        bestAvg = sAvg;
        bestSupplier = name;
      }
    }

    // Unique quote count
    const uniqueQuotes = new Set(filteredData.map((d) => d.quoteId)).size;

    return { avg, trend, pctChange, bestSupplier, uniqueQuotes };
  }, [filteredData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading analytics data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground mt-2">
          Price trends and supplier comparison analytics
        </p>
      </div>

      {/* Filter Panel */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Material Category</Label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setMaterialFilter("all");
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="all">All Categories</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Material */}
            <div className="space-y-2">
              <Label>Specific Material</Label>
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="all">All Materials</option>
                {filteredMaterialOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.canonical_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier */}
            <div className="space-y-2">
              <Label>Supplier</Label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="all">All Suppliers</option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>Date From</Label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>Date To</Label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              />
            </div>
          </div>

          {hasFilters && (
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average Price */}
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">
                  {formatCurrency(stats.avg)}
                </p>
                <p className="text-xs text-muted-foreground">Average Price</p>
              </div>
            </CardContent>
          </Card>

          {/* Price Trend */}
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  stats.trend === "rising"
                    ? "bg-red-100"
                    : stats.trend === "falling"
                      ? "bg-green-100"
                      : "bg-slate-100"
                }`}
              >
                {stats.trend === "rising" ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : stats.trend === "falling" ? (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                ) : (
                  <Minus className="h-4 w-4 text-slate-600" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">
                  {stats.trend === "rising"
                    ? "Rising"
                    : stats.trend === "falling"
                      ? "Falling"
                      : "Stable"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.abs(stats.pctChange).toFixed(1)}% change
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Best Supplier */}
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <Award className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold truncate max-w-[160px]">
                  {stats.bestSupplier}
                </p>
                <p className="text-xs text-muted-foreground">Best Supplier</p>
              </div>
            </CardContent>
          </Card>

          {/* Quote Count */}
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <FileText className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">
                  {stats.uniqueQuotes}
                </p>
                <p className="text-xs text-muted-foreground">Quote Count</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart View Toggle + Chart */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant={chartView === "supplier" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartView("supplier")}
          >
            Supplier Comparison
          </Button>
          <Button
            variant={chartView === "category" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartView("category")}
          >
            Category Trends
          </Button>
        </div>

        {chartView === "category" && materialFilter !== "all" && (
          <p className="text-xs text-muted-foreground italic">
            Showing all materials in category — material filter applies to Supplier Comparison view only
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {chartView === "supplier"
                ? "Price Trends — Supplier Comparison"
                : "Price Trends — Category Averages"}
              {chartView === "supplier" &&
                materialFilter !== "all" &&
                selectedMaterialName && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    — {selectedMaterialName}
                  </span>
                )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartView === "supplier" ? (
              <>
                <PriceTrendChart
                  data={filteredData}
                  onPointClick={handlePointClick}
                />
                {materialFilter === "all" && filteredData.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Tip: Select a specific material above for the clearest
                    supplier comparison
                  </p>
                )}
              </>
            ) : (
              <CategoryAggregateChart
                data={categoryChartData}
                categories={(categories ?? []).map((c) => ({
                  id: c.id,
                  display_name: c.display_name,
                }))}
                onPointClick={handlePointClick}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {(!reportData || reportData.length === 0) && !isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No verified price data yet. Upload and approve quotes to see
                analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredData.length === 0 && reportData && reportData.length > 0 && hasFilters && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No price data matches your filters. Try broadening your
                selection.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
