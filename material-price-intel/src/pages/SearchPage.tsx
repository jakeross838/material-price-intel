import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  Filter,
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
import { Label } from "@/components/ui/label";
import type { MaterialCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PriceResult = {
  line_item_id: string;
  raw_description: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  effective_unit_price: number | null;
  line_total: number | null;
  line_type: string;
  quote_id: string;
  quote_number: string | null;
  quote_date: string | null;
  project_name: string | null;
  supplier_name: string;
  material_id: string | null;
  canonical_name: string | null;
  category_id: string | null;
};

// ---------------------------------------------------------------------------
// Hooks
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

function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name");
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
        .select(
          "id, raw_description, quantity, unit, unit_price, effective_unit_price, line_total, line_type, material_id, quotes(id, quote_number, quote_date, project_name, is_verified, suppliers(name)), materials(canonical_name, category_id)"
        )
        .eq("line_type", "material")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Flatten the joined data
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
          line_type: (item.line_type as string) ?? "material",
          quote_id: (quotes?.id as string) ?? "",
          quote_number: quotes?.quote_number as string | null,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number | null) {
  if (val == null) return "\u2014";
  return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchPage() {
  const { data: categories } = useMaterialCategories();
  const { data: suppliers } = useSuppliers();
  const { data: priceData, isLoading } = usePriceData();

  // Filters
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "price_asc" | "price_desc">("date");

  // Derive unique materials from data for the material filter dropdown
  const uniqueMaterials = useMemo(() => {
    if (!priceData) return [];
    const map = new Map<string, { id: string; name: string; categoryId: string | null }>();
    for (const item of priceData) {
      if (item.material_id && item.canonical_name) {
        map.set(item.material_id, {
          id: item.material_id,
          name: item.canonical_name,
          categoryId: item.category_id,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [priceData]);

  // Filter materials dropdown by selected category
  const filteredMaterialOptions = useMemo(() => {
    if (categoryFilter === "all") return uniqueMaterials;
    return uniqueMaterials.filter((m) => m.categoryId === categoryFilter);
  }, [uniqueMaterials, categoryFilter]);

  // Apply all filters
  const filtered = useMemo(() => {
    if (!priceData) return [];
    const lowerSearch = searchText.toLowerCase();
    return priceData.filter((item) => {
      // Text search
      if (searchText) {
        const matchText =
          item.raw_description.toLowerCase().includes(lowerSearch) ||
          (item.canonical_name?.toLowerCase().includes(lowerSearch) ?? false) ||
          item.supplier_name.toLowerCase().includes(lowerSearch) ||
          (item.project_name?.toLowerCase().includes(lowerSearch) ?? false);
        if (!matchText) return false;
      }
      // Category filter
      if (categoryFilter !== "all" && item.category_id !== categoryFilter) return false;
      // Supplier filter
      if (supplierFilter !== "all" && item.supplier_name !== supplierFilter) return false;
      // Material filter
      if (materialFilter !== "all" && item.material_id !== materialFilter) return false;
      return true;
    });
  }, [priceData, searchText, categoryFilter, supplierFilter, materialFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "date":
        return arr.sort((a, b) => (b.quote_date ?? "").localeCompare(a.quote_date ?? ""));
      case "price_asc":
        return arr.sort((a, b) =>
          (a.effective_unit_price ?? a.unit_price ?? 0) - (b.effective_unit_price ?? b.unit_price ?? 0)
        );
      case "price_desc":
        return arr.sort((a, b) =>
          (b.effective_unit_price ?? b.unit_price ?? 0) - (a.effective_unit_price ?? a.unit_price ?? 0)
        );
      default:
        return arr;
    }
  }, [filtered, sortBy]);

  // Price stats for current filtered results
  const priceStats = useMemo(() => {
    const prices = filtered
      .filter((i) => (i.effective_unit_price ?? i.unit_price) != null)
      .map((i) => (i.effective_unit_price ?? i.unit_price)!);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    return { min, max, avg, count: prices.length };
  }, [filtered]);

  const hasFilters = searchText || categoryFilter !== "all" || supplierFilter !== "all" || materialFilter !== "all";

  function clearFilters() {
    setSearchText("");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setMaterialFilter("all");
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Price Search</h2>
        <p className="text-muted-foreground mt-2">
          Search and compare material prices across all quotes and suppliers
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials, suppliers, projects..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasFilters && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
              !
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category filter */}
              <div className="space-y-2">
                <Label>Material Category</Label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setMaterialFilter("all"); // reset material when category changes
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

              {/* Specific material filter */}
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
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier filter */}
              <div className="space-y-2">
                <Label>Supplier / Company</Label>
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

              {/* Sort */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="date">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price summary stats */}
      {priceStats && hasFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <TrendingDown className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(priceStats.min)}</p>
                <p className="text-xs text-muted-foreground">Lowest Price</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(priceStats.max)}</p>
                <p className="text-xs text-muted-foreground">Highest Price</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Minus className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(priceStats.avg)}</p>
                <p className="text-xs text-muted-foreground">Average Price</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Search className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{priceStats.count}</p>
                <p className="text-xs text-muted-foreground">Results</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            {hasFilters ? `Results (${sorted.length})` : `All Line Items (${sorted.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {hasFilters
                  ? "No results match your filters. Try broadening your search."
                  : "No price data yet. Upload and approve quotes to build your price database."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                    <th className="text-left px-4 py-2 font-medium">Material</th>
                    <th className="text-left px-4 py-2 font-medium">Supplier</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-left px-4 py-2 font-medium">Project</th>
                    <th className="text-right px-4 py-2 font-medium">Qty</th>
                    <th className="text-left px-4 py-2 font-medium">Unit</th>
                    <th className="text-right px-4 py-2 font-medium">Unit Price</th>
                    <th className="text-right px-4 py-2 font-medium">Total</th>
                    <th className="text-center px-4 py-2 font-medium">Quote</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item) => (
                    <tr key={item.line_item_id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 max-w-[200px] truncate" title={item.raw_description}>
                        {item.raw_description}
                      </td>
                      <td className="px-4 py-2">
                        {item.canonical_name ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            {item.canonical_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">\u2014</span>
                        )}
                      </td>
                      <td className="px-4 py-2">{item.supplier_name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{item.quote_date ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{item.project_name ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{item.quantity ?? "\u2014"}</td>
                      <td className="px-4 py-2">{item.unit ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">
                        {formatCurrency(item.effective_unit_price ?? item.unit_price)}
                        {item.effective_unit_price != null && item.unit_price != null && item.effective_unit_price !== item.unit_price && (
                          <div className="text-xs text-muted-foreground line-through">
                            {formatCurrency(item.unit_price)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatCurrency(item.line_total)}
                      </td>
                      <td className="px-4 py-2 text-center">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
