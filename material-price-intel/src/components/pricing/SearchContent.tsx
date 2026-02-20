import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  X,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MaterialCategory } from "@/lib/types";

type PriceResult = {
  line_item_id: string;
  raw_description: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  effective_unit_price: number | null;
  line_total: number | null;
  quote_id: string;
  quote_date: string | null;
  project_name: string | null;
  supplier_name: string;
  material_id: string | null;
  canonical_name: string | null;
  category_id: string | null;
};

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

function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

function usePriceData() {
  return useQuery({
    queryKey: ["price_search_data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("line_items")
        .select("id, raw_description, quantity, unit, unit_price, effective_unit_price, line_total, material_id, quotes(id, quote_number, quote_date, project_name, suppliers(name)), materials(canonical_name, category_id)")
        .eq("line_type", "material")
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((item: Record<string, unknown>) => {
        const quotes = item.quotes as Record<string, unknown> | null;
        const suppliers = quotes?.suppliers as Record<string, unknown> | null;
        const materials = item.materials as Record<string, unknown> | null;
        return {
          line_item_id: item.id as string,
          raw_description: item.raw_description as string,
          quantity: item.quantity as number | null,
          unit: item.unit as string | null,
          unit_price: item.unit_price as number | null,
          effective_unit_price: item.effective_unit_price as number | null,
          line_total: item.line_total as number | null,
          quote_id: (quotes?.id as string) ?? "",
          quote_date: quotes?.quote_date as string | null,
          project_name: quotes?.project_name as string | null,
          supplier_name: (suppliers?.name as string) ?? "Unknown",
          material_id: item.material_id as string | null,
          canonical_name: materials?.canonical_name as string | null,
          category_id: materials?.category_id as string | null,
        } satisfies PriceResult;
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

function formatCurrency(val: number | null) {
  if (val == null) return "\u2014";
  return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SearchContent() {
  const { data: categories } = useMaterialCategories();
  const { data: suppliers } = useSuppliers();
  const { data: priceData, isLoading } = usePriceData();

  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "price_asc" | "price_desc">("date");

  const filtered = useMemo(() => {
    if (!priceData) return [];
    const lowerSearch = searchText.toLowerCase();
    return priceData.filter((item) => {
      if (searchText) {
        const matchText =
          item.raw_description.toLowerCase().includes(lowerSearch) ||
          (item.canonical_name?.toLowerCase().includes(lowerSearch) ?? false) ||
          item.supplier_name.toLowerCase().includes(lowerSearch);
        if (!matchText) return false;
      }
      if (categoryFilter !== "all" && item.category_id !== categoryFilter) return false;
      if (supplierFilter !== "all" && item.supplier_name !== supplierFilter) return false;
      return true;
    });
  }, [priceData, searchText, categoryFilter, supplierFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "date":
        return arr.sort((a, b) => (b.quote_date ?? "").localeCompare(a.quote_date ?? ""));
      case "price_asc":
        return arr.sort((a, b) => (a.effective_unit_price ?? a.unit_price ?? 0) - (b.effective_unit_price ?? b.unit_price ?? 0));
      case "price_desc":
        return arr.sort((a, b) => (b.effective_unit_price ?? b.unit_price ?? 0) - (a.effective_unit_price ?? a.unit_price ?? 0));
      default:
        return arr;
    }
  }, [filtered, sortBy]);

  const priceStats = useMemo(() => {
    const prices = filtered.filter((i) => (i.effective_unit_price ?? i.unit_price) != null).map((i) => (i.effective_unit_price ?? i.unit_price)!);
    if (prices.length === 0) return null;
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((s, p) => s + p, 0) / prices.length,
      count: prices.length,
    };
  }, [filtered]);

  const hasFilters = searchText || categoryFilter !== "all" || supplierFilter !== "all";

  function clearFilters() {
    setSearchText("");
    setCategoryFilter("all");
    setSupplierFilter("all");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading price data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials, suppliers..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm min-w-[140px]"
        >
          <option value="all">All Categories</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.display_name}</option>
          ))}
        </select>
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm min-w-[140px]"
        >
          <option value="all">All Suppliers</option>
          {suppliers?.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="date">Newest</option>
          <option value="price_asc">Price: Low→High</option>
          <option value="price_desc">Price: High→Low</option>
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Price Stats */}
      {priceStats && hasFilters && (
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="py-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-bold tabular-nums">{formatCurrency(priceStats.min)}</p>
                <p className="text-xs text-muted-foreground">Low</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-bold tabular-nums">{formatCurrency(priceStats.max)}</p>
                <p className="text-xs text-muted-foreground">High</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-2">
              <Minus className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-bold tabular-nums">{formatCurrency(priceStats.avg)}</p>
                <p className="text-xs text-muted-foreground">Avg</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-600" />
              <div>
                <p className="text-sm font-bold tabular-nums">{priceStats.count}</p>
                <p className="text-xs text-muted-foreground">Results</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            {hasFilters ? `Results (${sorted.length})` : `All Prices (${sorted.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {hasFilters ? "No results. Try broadening your search." : "No price data yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                    <th className="text-left px-4 py-2 font-medium">Material</th>
                    <th className="text-left px-4 py-2 font-medium">Supplier</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-right px-4 py-2 font-medium">Qty</th>
                    <th className="text-right px-4 py-2 font-medium">Unit $</th>
                    <th className="text-right px-4 py-2 font-medium">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 100).map((item) => (
                    <tr key={item.line_item_id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 max-w-[180px] truncate" title={item.raw_description}>
                        {item.raw_description}
                      </td>
                      <td className="px-4 py-2">
                        {item.canonical_name ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            {item.canonical_name}
                          </span>
                        ) : "\u2014"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{item.supplier_name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{item.quote_date ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{item.quantity ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">
                        {formatCurrency(item.effective_unit_price ?? item.unit_price)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(item.line_total)}</td>
                      <td className="px-4 py-2">
                        <Button variant="ghost" size="icon-xs" asChild>
                          <Link to={`/quotes/${item.quote_id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length > 100 && (
                <p className="text-center text-sm text-muted-foreground py-3">
                  Showing 100 of {sorted.length} results
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
