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

function formatCurrency(val: number | null) {
  if (val == null) return "\u2014";
  return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ReportsContent() {
  const navigate = useNavigate();
  const { data: reportData, isLoading } = useReportsData();
  const { data: categories } = useReportsCategories();
  const { data: suppliers } = useReportsSuppliers();
  const { data: materials } = useReportsMaterials();

  const handlePointClick = (quoteId: string) => navigate(`/quotes/${quoteId}`);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [chartView, setChartView] = useState<"supplier" | "category">("supplier");

  const filteredMaterialOptions = useMemo(() => {
    if (!materials) return [];
    if (categoryFilter === "all") return materials;
    return materials.filter((m) => m.category_id === categoryFilter);
  }, [materials, categoryFilter]);

  const filteredData = useMemo(() => {
    if (!reportData) return [];
    return reportData.filter((item) => {
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false;
      if (materialFilter !== "all" && item.materialId !== materialFilter) return false;
      if (supplierFilter !== "all" && item.supplierName !== supplierFilter) return false;
      if (dateFrom && item.quoteDate && item.quoteDate < dateFrom) return false;
      if (dateTo && item.quoteDate && item.quoteDate > dateTo) return false;
      return true;
    });
  }, [reportData, categoryFilter, materialFilter, supplierFilter, dateFrom, dateTo]);

  const categoryChartData = useMemo(() => {
    if (!reportData) return [];
    return reportData.filter((item) => {
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false;
      if (supplierFilter !== "all" && item.supplierName !== supplierFilter) return false;
      if (dateFrom && item.quoteDate && item.quoteDate < dateFrom) return false;
      if (dateTo && item.quoteDate && item.quoteDate > dateTo) return false;
      return true;
    });
  }, [reportData, categoryFilter, supplierFilter, dateFrom, dateTo]);

  const hasFilters = categoryFilter !== "all" || materialFilter !== "all" || supplierFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setCategoryFilter("all");
    setMaterialFilter("all");
    setSupplierFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    const prices = filteredData.map((d) => d.effectiveUnitPrice);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;

    const sorted = [...filteredData].sort((a, b) => (a.quoteDate ?? "").localeCompare(b.quoteDate ?? ""));
    const mid = Math.floor(sorted.length / 2);
    const olderAvg = mid > 0 ? sorted.slice(0, mid).reduce((s, d) => s + d.effectiveUnitPrice, 0) / mid : avg;
    const recentAvg = sorted.length - mid > 0 ? sorted.slice(mid).reduce((s, d) => s + d.effectiveUnitPrice, 0) / (sorted.length - mid) : avg;
    const pctChange = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    const trend = pctChange > 5 ? "rising" : pctChange < -5 ? "falling" : "stable";

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

    return { avg, trend, pctChange, bestSupplier, uniqueQuotes: new Set(filteredData.map((d) => d.quoteId)).size };
  }, [filteredData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading analytics...
      </div>
    );
  }

  if (!reportData || reportData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No verified price data yet. Upload and approve quotes to see analytics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-xs">Category</Label>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setMaterialFilter("all"); }}
                className="h-8 w-full rounded-md border px-2 text-sm"
              >
                <option value="all">All</option>
                {categories?.map((cat) => <option key={cat.id} value={cat.id}>{cat.display_name}</option>)}
              </select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-xs">Material</Label>
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="h-8 w-full rounded-md border px-2 text-sm"
              >
                <option value="all">All</option>
                {filteredMaterialOptions.map((m) => <option key={m.id} value={m.id}>{m.canonical_name}</option>)}
              </select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-xs">Supplier</Label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="h-8 w-full rounded-md border px-2 text-sm"
              >
                <option value="all">All</option>
                {suppliers?.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 rounded-md border px-2 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 rounded-md border px-2 text-sm" />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="py-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-bold tabular-nums">{formatCurrency(stats.avg)}</p>
                <p className="text-xs text-muted-foreground">Avg Price</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-2">
              {stats.trend === "rising" ? <TrendingUp className="h-4 w-4 text-red-600" /> :
               stats.trend === "falling" ? <TrendingDown className="h-4 w-4 text-green-600" /> :
               <Minus className="h-4 w-4 text-slate-600" />}
              <div>
                <p className="text-sm font-bold">{stats.trend === "rising" ? "Rising" : stats.trend === "falling" ? "Falling" : "Stable"}</p>
                <p className="text-xs text-muted-foreground">{Math.abs(stats.pctChange).toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-bold truncate max-w-[100px]">{stats.bestSupplier}</p>
                <p className="text-xs text-muted-foreground">Best Price</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />
              <div>
                <p className="text-sm font-bold tabular-nums">{stats.uniqueQuotes}</p>
                <p className="text-xs text-muted-foreground">Quotes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Price Trends
            </CardTitle>
            <div className="flex gap-1">
              <Button variant={chartView === "supplier" ? "default" : "outline"} size="sm" onClick={() => setChartView("supplier")}>
                By Supplier
              </Button>
              <Button variant={chartView === "category" ? "default" : "outline"} size="sm" onClick={() => setChartView("category")}>
                By Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartView === "supplier" ? (
            <PriceTrendChart data={filteredData} onPointClick={handlePointClick} />
          ) : (
            <CategoryAggregateChart
              data={categoryChartData}
              categories={(categories ?? []).map((c) => ({ id: c.id, display_name: c.display_name }))}
              onPointClick={handlePointClick}
            />
          )}
        </CardContent>
      </Card>

      {filteredData.length === 0 && hasFilters && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No data matches your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
