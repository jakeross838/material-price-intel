import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Loader2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DocumentStatus } from "@/lib/types";

type QuoteRow = {
  id: string;
  quote_number: string | null;
  quote_date: string | null;
  project_name: string | null;
  total_amount: number | null;
  is_verified: boolean;
  created_at: string;
  suppliers: { name: string } | null;
  documents: { id: string; status: DocumentStatus } | null;
};

type SortField = "supplier" | "date" | "project" | "total" | "status";
type SortDir = "asc" | "desc";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800" },
  review_needed: { label: "Needs Review", color: "bg-orange-100 text-orange-800" },
  completed: { label: "Extracted", color: "bg-slate-100 text-slate-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
};

function formatCurrency(val: number | null) {
  if (val == null) return "\u2014";
  return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getQuoteStatus(q: QuoteRow): string {
  if (q.is_verified) return "approved";
  return q.documents?.status ?? "pending";
}

export function QuotesListPage() {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["quotes_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("id, quote_number, quote_date, project_name, total_amount, is_verified, created_at, suppliers(name), documents(id, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as QuoteRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "total" ? "desc" : "asc");
    }
  }

  const sorted = [...(quotes ?? [])].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "supplier":
        return (a.suppliers?.name ?? "").localeCompare(b.suppliers?.name ?? "") * dir;
      case "date":
        return ((a.quote_date ?? a.created_at) > (b.quote_date ?? b.created_at) ? 1 : -1) * dir;
      case "project":
        return (a.project_name ?? "").localeCompare(b.project_name ?? "") * dir;
      case "total":
        return ((a.total_amount ?? 0) - (b.total_amount ?? 0)) * dir;
      case "status": {
        const sa = getQuoteStatus(a);
        const sb = getQuoteStatus(b);
        return sa.localeCompare(sb) * dir;
      }
      default:
        return 0;
    }
  });

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading quotes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {quotes?.length ?? 0}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            All supplier quotes extracted from uploaded documents
          </p>
        </div>
        <Button asChild>
          <Link to="/upload">Upload New Quote</Link>
        </Button>
      </div>

      {!quotes || quotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No quotes yet. Upload a PDF to get started.
            </p>
            <Button asChild className="mt-4">
              <Link to="/upload">Upload Quote</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Quotes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Quote #</th>
                    <th
                      className="text-left px-4 py-2 font-medium cursor-pointer select-none"
                      onClick={() => toggleSort("supplier")}
                    >
                      <span className="inline-flex items-center">
                        Supplier <SortIcon field="supplier" />
                      </span>
                    </th>
                    <th
                      className="text-left px-4 py-2 font-medium cursor-pointer select-none"
                      onClick={() => toggleSort("date")}
                    >
                      <span className="inline-flex items-center">
                        Date <SortIcon field="date" />
                      </span>
                    </th>
                    <th
                      className="text-left px-4 py-2 font-medium cursor-pointer select-none"
                      onClick={() => toggleSort("project")}
                    >
                      <span className="inline-flex items-center">
                        Project <SortIcon field="project" />
                      </span>
                    </th>
                    <th
                      className="text-right px-4 py-2 font-medium cursor-pointer select-none"
                      onClick={() => toggleSort("total")}
                    >
                      <span className="inline-flex items-center justify-end">
                        Total <SortIcon field="total" />
                      </span>
                    </th>
                    <th
                      className="text-center px-4 py-2 font-medium cursor-pointer select-none"
                      onClick={() => toggleSort("status")}
                    >
                      <span className="inline-flex items-center">
                        Status <SortIcon field="status" />
                      </span>
                    </th>
                    <th className="text-center px-4 py-2 font-medium">View</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((q) => {
                    const status = getQuoteStatus(q);
                    const cfg = statusConfig[status] ?? statusConfig.pending;
                    return (
                      <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          {q.quote_number ?? "\u2014"}
                        </td>
                        <td className="px-4 py-3">{q.suppliers?.name ?? "\u2014"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {q.quote_date ?? new Date(q.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {q.project_name ?? "\u2014"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {formatCurrency(q.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="icon-xs" asChild>
                            <Link to={`/quotes/${q.id}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
