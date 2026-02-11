import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/review/ReviewForm";
import { type EditableLineItem } from "@/components/review/LineItemsEditor";
import { ValidationWarnings } from "@/components/review/ValidationWarnings";
import { ConfidenceBadge } from "@/components/review/ConfidenceBadge";
import { useApproveQuote, useUpdateQuoteReview } from "@/hooks/useQuoteReview";
import { useLineItemMaterials } from "@/hooks/useMaterials";
import type { Quote, LineItem, Supplier } from "@/lib/types";

type QuoteWithSupplier = Quote & { suppliers: Pick<Supplier, "name" | "contact_name" | "contact_phone" | "contact_email" | "address"> };

function formatCurrency(val: number | null) {
  if (val == null) return "\u2014";
  return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function LineTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    material: { label: "Material", className: "bg-blue-50 text-blue-700" },
    discount: { label: "Discount", className: "bg-orange-50 text-orange-700" },
    fee: { label: "Fee", className: "bg-purple-50 text-purple-700" },
    subtotal_line: {
      label: "Subtotal",
      className: "bg-gray-100 text-gray-600",
    },
    note: {
      label: "Note",
      className: "bg-gray-100 text-gray-500 italic",
    },
  };
  const c = config[type] ?? config.material;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        c.className
      )}
    >
      {c.label}
    </span>
  );
}

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();

  // ---------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, suppliers(name, contact_name, contact_phone, contact_email, address)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as QuoteWithSupplier;
    },
    enabled: !!id,
  });

  const { data: lineItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["line_items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("line_items")
        .select("*")
        .eq("quote_id", id!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as LineItem[];
    },
    enabled: !!id,
  });

  const { data: lineItemMaterials } = useLineItemMaterials(id ?? "");

  const { data: docUrl } = useQuery({
    queryKey: ["quote_pdf_url", id],
    queryFn: async () => {
      const { data: doc } = await supabase
        .from("documents")
        .select("file_path")
        .eq("quote_id", id!)
        .single();
      if (!doc?.file_path) return null;
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_path, 3600);
      return data?.signedUrl ?? null;
    },
    enabled: !!id,
  });

  // ---------------------------------------------------------------
  // Review state & hooks
  // ---------------------------------------------------------------

  const [editableLineItems, setEditableLineItems] = useState<EditableLineItem[]>([]);

  const approveQuote = useApproveQuote();
  const updateQuoteReview = useUpdateQuoteReview();

  // Initialize editable line items from fetched data
  useEffect(() => {
    if (!lineItems || !quote) return;

    const rawExtraction = quote.raw_extraction as Record<string, unknown> | null;
    const extraction = rawExtraction?.extraction as Record<string, unknown> | undefined;
    const extractedLineItems = (extraction?.line_items ?? []) as Array<{ confidence?: number }>;

    setEditableLineItems(
      lineItems.map((item, index) => ({
        id: item.id,
        raw_description: item.raw_description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        line_total: item.line_total,
        notes: item.notes,
        confidence: extractedLineItems[index]?.confidence,
        line_type: item.line_type ?? "material",
        effective_unit_price: item.effective_unit_price,
        discount_pct: item.discount_pct,
        discount_amount: item.discount_amount,
      }))
    );
  }, [lineItems, quote]);

  // ---------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------

  function handleSave(data: Parameters<typeof updateQuoteReview.mutateAsync>[0]) {
    updateQuoteReview.mutate(data);
  }

  function handleApprove() {
    if (!quote) return;
    approveQuote.mutate(quote.id);
  }

  // ---------------------------------------------------------------
  // Loading / not found
  // ---------------------------------------------------------------

  if (quoteLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading quote...
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Quote not found</p>
        <Link to="/quotes" className="text-primary underline text-sm mt-2 inline-block">Back to quotes</Link>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Shared data
  // ---------------------------------------------------------------

  const supplier = quote.suppliers;

  const rawExtraction = quote.raw_extraction as Record<string, unknown> | null;
  const validationWarnings = (rawExtraction?.validation_warnings ?? []) as Array<{
    check: string;
    message: string;
    expected?: number;
    actual?: number;
  }>;

  // ---------------------------------------------------------------
  // Approved / read-only view
  // ---------------------------------------------------------------

  if (quote.is_verified) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link to="/quotes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to quotes
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">
              Quote {quote.quote_number ?? "\u2014"}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-muted-foreground">{supplier?.name}</span>
              <ConfidenceBadge score={quote.confidence_score} />
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-medium">
                <CheckCircle className="h-3 w-3" />
                Approved
              </span>
            </div>
          </div>
          {docUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={docUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                View PDF
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>

        {/* Quote Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{quote.quote_date ?? "\u2014"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{quote.project_name ?? "\u2014"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{quote.payment_terms ?? "\u2014"}</span></div>
              {quote.valid_until && <div className="flex justify-between"><span className="text-muted-foreground">Valid until</span><span>{quote.valid_until}</span></div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Supplier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{supplier?.name}</p>
              {supplier?.contact_name && <p>{supplier.contact_name}</p>}
              {supplier?.contact_phone && <p className="text-muted-foreground">{supplier.contact_phone}</p>}
              {supplier?.contact_email && <p className="text-muted-foreground">{supplier.contact_email}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatCurrency(quote.delivery_cost)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax ({quote.tax_rate ? `${(Number(quote.tax_rate) * 100).toFixed(0)}%` : "\u2014"})</span><span>{formatCurrency(quote.tax_amount)}</span></div>
              <div className="flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{formatCurrency(quote.total_amount)}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {quote.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Line Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line Items ({lineItems?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">#</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                    <th className="text-right px-4 py-2 font-medium">Qty</th>
                    <th className="text-left px-4 py-2 font-medium">Unit</th>
                    <th className="text-right px-4 py-2 font-medium">Unit Price</th>
                    <th className="text-right px-4 py-2 font-medium">Eff. Price</th>
                    <th className="text-right px-4 py-2 font-medium">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems?.map((item, i) => {
                    const matched = lineItemMaterials?.find((m) => m.id === item.id);
                    return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b last:border-0 hover:bg-muted/30",
                        item.line_type !== "material" && "opacity-60"
                      )}
                    >
                      <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2">
                        <LineTypeBadge type={item.line_type} />
                      </td>
                      <td className="px-4 py-2 max-w-md">
                        {item.raw_description}
                        {matched?.materials?.canonical_name && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            {matched.materials.canonical_name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{item.quantity ?? "\u2014"}</td>
                      <td className="px-4 py-2">{item.unit ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {item.effective_unit_price != null && item.effective_unit_price !== item.unit_price
                          ? formatCurrency(item.effective_unit_price)
                          : <span className="text-muted-foreground">{"\u2014"}</span>
                        }
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{formatCurrency(item.line_total)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Review mode: side-by-side PDF + review form
  // ---------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Link to="/quotes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to quotes
        </Link>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Review Quote {quote.quote_number ?? "\u2014"}
          </h2>
          <ConfidenceBadge score={quote.confidence_score} size="md" />
        </div>
        <p className="text-muted-foreground mt-1">{supplier?.name}</p>
      </div>

      {/* Side-by-side layout */}
      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 12rem)" }}>
        {/* PDF Viewer */}
        <div className="w-1/2 shrink-0">
          <div className="sticky top-4">
            {docUrl ? (
              <iframe
                src={docUrl}
                className="w-full rounded-lg border"
                style={{ height: "calc(100vh - 10rem)" }}
                title="Original Quote PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-64 rounded-lg border bg-muted">
                <p className="text-muted-foreground">PDF not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Review Form -- ReviewForm renders LineItemsEditor internally */}
        <div className="w-1/2 space-y-4">
          <ValidationWarnings warnings={validationWarnings} />
          <ReviewForm
            quote={quote}
            lineItems={editableLineItems}
            onLineItemsChange={setEditableLineItems}
            onSave={handleSave}
            onApprove={handleApprove}
            isSaving={updateQuoteReview.isPending}
            isApproving={approveQuote.isPending}
          />
        </div>
      </div>
    </div>
  );
}
