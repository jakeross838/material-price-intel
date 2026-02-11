import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MaterialCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportDataPoint = {
  lineItemId: string;
  rawDescription: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number;
  effectiveUnitPrice: number;
  lineTotal: number | null;
  quoteId: string;
  quoteDate: string | null;
  quoteNumber: string | null;
  projectName: string | null;
  supplierId: string;
  supplierName: string;
  materialId: string;
  canonicalName: string;
  categoryId: string | null;
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useReportsData() {
  return useQuery({
    queryKey: ["reports_data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("line_items")
        .select(
          "id, raw_description, quantity, unit, unit_price, effective_unit_price, line_total, line_type, material_id, quotes(id, quote_date, quote_number, project_name, supplier_id, is_verified, suppliers(id, name)), materials(id, canonical_name, category_id)"
        )
        .eq("line_type", "material")
        .not("material_id", "is", null)
        .not("unit_price", "is", null)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Flatten and filter to verified quotes only (client-side)
      const flattened = (data ?? [])
        .filter((item: Record<string, unknown>) => {
          const quotes = item.quotes as Record<string, unknown> | null;
          return quotes?.is_verified === true;
        })
        .map((item: Record<string, unknown>) => {
          const quotes = item.quotes as Record<string, unknown>;
          const suppliers = quotes.suppliers as Record<string, unknown> | null;
          const materials = item.materials as Record<string, unknown> | null;
          return {
            lineItemId: item.id as string,
            rawDescription: item.raw_description as string,
            quantity: item.quantity as number | null,
            unit: item.unit as string | null,
            unitPrice: item.unit_price as number,
            effectiveUnitPrice: (item.effective_unit_price as number) ?? (item.unit_price as number),
            lineTotal: item.line_total as number | null,
            quoteId: quotes.id as string,
            quoteDate: quotes.quote_date as string | null,
            quoteNumber: quotes.quote_number as string | null,
            projectName: quotes.project_name as string | null,
            supplierId: (quotes.supplier_id as string) ?? "",
            supplierName: (suppliers?.name as string) ?? "Unknown",
            materialId: item.material_id as string,
            canonicalName: (materials?.canonical_name as string) ?? "",
            categoryId: (materials?.category_id as string) ?? null,
          } satisfies ReportDataPoint;
        });

      return flattened;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useReportsCategories() {
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

export function useReportsSuppliers() {
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

export function useReportsMaterials() {
  return useQuery({
    queryKey: ["materials_for_filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, canonical_name, category_id")
        .eq("is_active", true)
        .order("canonical_name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
