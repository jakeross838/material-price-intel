import { useEffect, useCallback } from "react";
import { X, Loader2, Award, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSearchQuotesForSelection,
  useAwardQuote,
} from "@/hooks/useProcurement";
import type { SelectionWithJoins } from "@/hooks/useProjectSelections";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuoteLinkModalProps = {
  selection: SelectionWithJoins;
  procurementId: string;
  projectId: string;
  onClose: () => void;
  onAwarded: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(val: number | null | undefined) {
  if (val == null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatDate(val: string | null | undefined) {
  if (!val) return "--";
  return new Date(val).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// QuoteLinkModal
// Modal overlay to search existing quotes matching a selection's material
// and award one to complete the buyout.
// ---------------------------------------------------------------------------

export function QuoteLinkModal({
  selection,
  procurementId,
  projectId,
  onClose,
  onAwarded,
}: QuoteLinkModalProps) {
  const { data: results, isLoading } = useSearchQuotesForSelection(
    selection.material_id ?? undefined,
    selection.category_id ?? undefined
  );
  const awardQuote = useAwardQuote();

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleAward(lineItem: NonNullable<typeof results>[number]) {
    const effectivePrice =
      lineItem.effective_unit_price ?? lineItem.unit_price ?? 0;
    const committedPrice =
      selection.quantity != null
        ? effectivePrice * selection.quantity
        : effectivePrice;
    const supplierId = lineItem.quotes?.supplier_id;

    if (!supplierId) return;

    awardQuote.mutate(
      {
        procurementId,
        selectionId: selection.id,
        roomId: selection.room_id,
        projectId,
        quoteId: lineItem.quote_id,
        lineItemId: lineItem.id,
        committedPrice,
        unitPrice: effectivePrice,
        supplierId,
      },
      {
        onSuccess: () => {
          onAwarded();
          onClose();
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative z-10 mt-20 w-full max-w-2xl bg-white rounded-lg shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Link Quote</h3>
            <p className="text-sm text-muted-foreground">
              {selection.selection_name}
              {selection.materials &&
                ` - ${(selection.materials as { canonical_name?: string }).canonical_name}`}
            </p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Searching matching quotes...
            </div>
          ) : !results || results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileWarning className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No matching quotes found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a quote with this material first, then link it here.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Supplier</th>
                  <th className="pb-2 font-medium">Quote #</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Unit Price</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium w-20" />
                </tr>
              </thead>
              <tbody>
                {results.map((item) => {
                  const effectivePrice =
                    item.effective_unit_price ?? item.unit_price;
                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-2.5 pr-2 font-medium">
                        {item.quotes?.suppliers?.name ?? "--"}
                      </td>
                      <td className="py-2.5 pr-2 text-muted-foreground">
                        {item.quotes?.quote_number ?? "--"}
                      </td>
                      <td className="py-2.5 pr-2 text-muted-foreground">
                        {formatDate(item.quotes?.quote_date)}
                      </td>
                      <td className="py-2.5 pr-2 text-right tabular-nums font-medium">
                        {formatPrice(effectivePrice)}
                      </td>
                      <td className="py-2.5 pr-2 text-muted-foreground truncate max-w-[160px]">
                        {item.raw_description}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          size="xs"
                          onClick={() => handleAward(item)}
                          disabled={
                            awardQuote.isPending ||
                            !item.quotes?.supplier_id
                          }
                        >
                          {awardQuote.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Award className="h-3 w-3" />
                          )}
                          Award
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with quantity context */}
        {selection.quantity != null && (
          <div className="px-6 py-3 border-t bg-muted/30 rounded-b-lg">
            <p className="text-xs text-muted-foreground">
              Selection quantity: <span className="font-medium">{selection.quantity}</span>
              {selection.unit && ` ${selection.unit}`}
              {" -- "}committed price will be unit price x quantity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
