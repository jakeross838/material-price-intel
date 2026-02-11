import { useState, useEffect } from "react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LineItemsEditor } from "@/components/review/LineItemsEditor";
import type { EditableLineItem } from "@/components/review/LineItemsEditor";
import type { Quote, Supplier } from "@/lib/types";
import type { QuoteReviewUpdate } from "@/hooks/useQuoteReview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuoteWithSupplier = Quote & {
  suppliers: Pick<
    Supplier,
    "name" | "contact_name" | "contact_phone" | "contact_email" | "address"
  >;
};

type ReviewFormProps = {
  quote: QuoteWithSupplier;
  onSave: (data: QuoteReviewUpdate) => void;
  onApprove: () => void;
  isSaving: boolean;
  isApproving: boolean;
  lineItems: EditableLineItem[];
  onLineItemsChange: (items: EditableLineItem[]) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether a top-level field has low confidence based on raw_extraction */
function isLowConfidenceField(
  quote: Quote,
  _field: string
): boolean {
  const extraction = quote.raw_extraction as
    | Record<string, unknown>
    | null
    | undefined;
  if (!extraction) return false;

  const overall =
    typeof extraction.overall_confidence === "number"
      ? extraction.overall_confidence
      : null;
  return overall != null && overall < 0.7;
}

const lowConfidenceClasses = "border-l-4 border-l-amber-400 pl-3";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewForm({
  quote,
  onSave,
  onApprove,
  isSaving,
  isApproving,
  lineItems,
  onLineItemsChange,
}: ReviewFormProps) {
  // --- Local form state (initialized from props) ---
  const [quoteNumber, setQuoteNumber] = useState(quote.quote_number ?? "");
  const [quoteDate, setQuoteDate] = useState(quote.quote_date ?? "");
  const [projectName, setProjectName] = useState(quote.project_name ?? "");
  const [paymentTerms, setPaymentTerms] = useState(quote.payment_terms ?? "");
  const [validUntil, setValidUntil] = useState(quote.valid_until ?? "");
  const [notes, setNotes] = useState(quote.notes ?? "");
  const [subtotal, setSubtotal] = useState<string>(
    quote.subtotal != null ? String(quote.subtotal) : ""
  );
  const [deliveryCost, setDeliveryCost] = useState<string>(
    quote.delivery_cost != null ? String(quote.delivery_cost) : ""
  );
  const [taxAmount, setTaxAmount] = useState<string>(
    quote.tax_amount != null ? String(quote.tax_amount) : ""
  );
  const [taxRate, setTaxRate] = useState<string>(
    quote.tax_rate != null ? String(quote.tax_rate) : ""
  );
  const [totalAmount, setTotalAmount] = useState<string>(
    quote.total_amount != null ? String(quote.total_amount) : ""
  );

  // Re-sync local state if quote prop changes (e.g. after save)
  useEffect(() => {
    setQuoteNumber(quote.quote_number ?? "");
    setQuoteDate(quote.quote_date ?? "");
    setProjectName(quote.project_name ?? "");
    setPaymentTerms(quote.payment_terms ?? "");
    setValidUntil(quote.valid_until ?? "");
    setNotes(quote.notes ?? "");
    setSubtotal(quote.subtotal != null ? String(quote.subtotal) : "");
    setDeliveryCost(
      quote.delivery_cost != null ? String(quote.delivery_cost) : ""
    );
    setTaxAmount(quote.tax_amount != null ? String(quote.tax_amount) : "");
    setTaxRate(quote.tax_rate != null ? String(quote.tax_rate) : "");
    setTotalAmount(
      quote.total_amount != null ? String(quote.total_amount) : ""
    );
  }, [quote]);

  // --- Gather form data for save ---
  function gatherFormData(): QuoteReviewUpdate {
    return {
      quote_id: quote.id,
      quote_number: quoteNumber || null,
      quote_date: quoteDate || null,
      project_name: projectName || null,
      payment_terms: paymentTerms || null,
      valid_until: validUntil || null,
      notes: notes || null,
      subtotal: subtotal ? Number(subtotal) : null,
      delivery_cost: deliveryCost ? Number(deliveryCost) : null,
      tax_amount: taxAmount ? Number(taxAmount) : null,
      tax_rate: taxRate ? Number(taxRate) : null,
      total_amount: totalAmount ? Number(totalAmount) : null,
      line_items: lineItems.map((item) => ({
        raw_description: item.raw_description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        extended_price: null,
        discount_pct: null,
        discount_amount: null,
        line_total: item.line_total,
        notes: item.notes,
        line_type: item.line_type,
        effective_unit_price: item.effective_unit_price,
      })),
    };
  }

  function handleSave() {
    onSave(gatherFormData());
  }

  const lowConf = isLowConfidenceField(quote, "overall");
  const supplier = quote.suppliers;

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------------------- */}
      {/* Section 1: Quote Details                                         */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Quote Details
          </CardTitle>
        </CardHeader>
        <CardContent
          className={cn("space-y-3", lowConf && lowConfidenceClasses)}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="quote-number">Quote Number</Label>
              <Input
                id="quote-number"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                placeholder="e.g. Q-2024-001"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quote-date">Quote Date</Label>
              <Input
                id="quote-date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="payment-terms">Payment Terms</Label>
              <Input
                id="payment-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Net 30"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valid-until">Valid Until</Label>
              <Input
                id="valid-until"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              className={cn(
                "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
                "placeholder:text-muted-foreground",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "outline-none resize-y"
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Section 2: Supplier Info (read-only)                             */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Supplier Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">{supplier?.name ?? "Unknown"}</p>
          {supplier?.contact_name && (
            <p className="text-muted-foreground">{supplier.contact_name}</p>
          )}
          {supplier?.contact_phone && (
            <p className="text-muted-foreground">{supplier.contact_phone}</p>
          )}
          {supplier?.contact_email && (
            <p className="text-muted-foreground">{supplier.contact_email}</p>
          )}
          {supplier?.address && (
            <p className="text-muted-foreground">{supplier.address}</p>
          )}
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Section 3: Line Items (rendered internally via LineItemsEditor)   */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Line Items ({lineItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemsEditor items={lineItems} onChange={onLineItemsChange} />
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Section 4: Totals                                                */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Totals
          </CardTitle>
        </CardHeader>
        <CardContent
          className={cn("space-y-3", lowConf && lowConfidenceClasses)}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                className="text-right tabular-nums"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="delivery-cost">Delivery Cost</Label>
              <Input
                id="delivery-cost"
                type="number"
                step="0.01"
                value={deliveryCost}
                onChange={(e) => setDeliveryCost(e.target.value)}
                className="text-right tabular-nums"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tax-amount">Tax Amount</Label>
              <Input
                id="tax-amount"
                type="number"
                step="0.01"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                className="text-right tabular-nums"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tax-rate">Tax Rate</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.001"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="text-right tabular-nums"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="total-amount">Total Amount</Label>
            <Input
              id="total-amount"
              type="number"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="text-right tabular-nums font-semibold"
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Action Buttons                                                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isSaving || isApproving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          onClick={onApprove}
          disabled={isSaving || isApproving}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {isApproving ? "Approving..." : "Approve Quote"}
        </Button>
      </div>
    </div>
  );
}
