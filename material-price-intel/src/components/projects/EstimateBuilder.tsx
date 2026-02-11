import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMaterialPriceStats, useAutoEstimate } from "@/hooks/useEstimateBuilder";
import type { SelectionWithJoins } from "@/hooks/useProjectSelections";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EstimateBuilderProps = {
  selection: SelectionWithJoins;
  roomId: string;
};

type PriceStrategy = "average" | "latest" | "lowest";

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

function formatCurrencyWhole(val: number | null | undefined) {
  if (val == null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(val: string | null | undefined) {
  if (!val) return null;
  return new Date(val).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// EstimateBuilder component
// Shows price intelligence for a selection and lets the user populate estimates.
// ---------------------------------------------------------------------------

export function EstimateBuilder({ selection, roomId }: EstimateBuilderProps) {
  const materialId = selection.material_id ?? undefined;
  const { data: stats, isLoading } = useMaterialPriceStats(materialId);
  const autoEstimate = useAutoEstimate();
  const [successStrategy, setSuccessStrategy] = useState<PriceStrategy | null>(null);

  function handleApplyPrice(strategy: PriceStrategy) {
    if (!selection.material_id) return;

    autoEstimate.mutate(
      {
        selectionId: selection.id,
        roomId,
        materialId: selection.material_id,
        quantity: selection.quantity,
        priceStrategy: strategy,
      },
      {
        onSuccess: () => {
          setSuccessStrategy(strategy);
          setTimeout(() => setSuccessStrategy(null), 2000);
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading price data...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-2 px-3 text-xs text-muted-foreground italic">
        No historical pricing data available for this material.
      </div>
    );
  }

  const hasQuotes = stats.quote_count > 0;

  return (
    <div className="border rounded-md bg-muted/20 p-3 space-y-3">
      {/* Price Intelligence Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <span className="text-xs font-semibold text-blue-700">
          Price Intelligence
        </span>
        <span className="text-[10px] text-muted-foreground">
          Based on {stats.quote_count} quote{stats.quote_count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Price Stats Grid */}
      {hasQuotes && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-background rounded px-2 py-1.5 border">
            <p className="text-muted-foreground text-[10px]">Average</p>
            <p className="font-semibold tabular-nums">{formatPrice(stats.avg_price)}</p>
          </div>
          <div className="bg-background rounded px-2 py-1.5 border">
            <p className="text-muted-foreground text-[10px]">
              <TrendingDown className="h-3 w-3 inline mr-0.5 text-green-600" />
              Lowest
            </p>
            <p className="font-semibold tabular-nums text-green-700">{formatPrice(stats.min_price)}</p>
          </div>
          <div className="bg-background rounded px-2 py-1.5 border">
            <p className="text-muted-foreground text-[10px]">
              <TrendingUp className="h-3 w-3 inline mr-0.5 text-red-600" />
              Highest
            </p>
            <p className="font-semibold tabular-nums text-red-700">{formatPrice(stats.max_price)}</p>
          </div>
        </div>
      )}

      {/* Latest Quote Info */}
      {stats.latest_price != null && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Latest: <span className="font-medium text-foreground">{formatPrice(stats.latest_price)}</span>
            {stats.latest_supplier && (
              <span> from <span className="font-medium">{stats.latest_supplier}</span></span>
            )}
          </span>
        </div>
      )}

      {/* Strategy Buttons */}
      {hasQuotes && (
        <div className="flex gap-1.5">
          <StrategyButton
            label="Use Average"
            price={stats.avg_price}
            strategy="average"
            isSuccess={successStrategy === "average"}
            isPending={autoEstimate.isPending}
            onClick={() => handleApplyPrice("average")}
          />
          <StrategyButton
            label="Use Latest"
            price={stats.latest_price}
            strategy="latest"
            isSuccess={successStrategy === "latest"}
            isPending={autoEstimate.isPending}
            onClick={() => handleApplyPrice("latest")}
          />
          <StrategyButton
            label="Use Lowest"
            price={stats.min_price}
            strategy="lowest"
            isSuccess={successStrategy === "lowest"}
            isPending={autoEstimate.isPending}
            onClick={() => handleApplyPrice("lowest")}
          />
        </div>
      )}

      {/* Current Estimate Display */}
      {selection.estimated_unit_price != null && (
        <div className="text-xs border-t pt-2 space-y-0.5">
          <p className="text-muted-foreground">
            Estimated:{" "}
            <span className="font-medium text-foreground">
              {formatPrice(selection.estimated_unit_price)}/unit
            </span>
            {selection.quantity != null && (
              <>
                {" x "}
                {selection.quantity} {selection.unit ?? ""}
                {" = "}
                <span className="font-semibold text-foreground">
                  {formatCurrencyWhole(selection.estimated_total)}
                </span>
              </>
            )}
          </p>
          {selection.allowance_amount != null && selection.estimated_total != null && (
            <p className="text-[10px]">
              vs allowance of {formatCurrencyWhole(selection.allowance_amount)}
              {" "}
              {selection.estimated_total > selection.allowance_amount ? (
                <span className="text-red-600 font-medium">
                  (+{formatCurrencyWhole(selection.estimated_total - selection.allowance_amount)} over)
                </span>
              ) : selection.estimated_total < selection.allowance_amount ? (
                <span className="text-green-600 font-medium">
                  ({formatCurrencyWhole(selection.allowance_amount - selection.estimated_total)} under)
                </span>
              ) : (
                <span className="text-muted-foreground">On budget</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Strategy Button sub-component
// ---------------------------------------------------------------------------

type StrategyButtonProps = {
  label: string;
  price: number | null;
  strategy: PriceStrategy;
  isSuccess: boolean;
  isPending: boolean;
  onClick: () => void;
};

function StrategyButton({
  label,
  price,
  isSuccess,
  isPending,
  onClick,
}: StrategyButtonProps) {
  const disabled = price == null || isPending;

  return (
    <Button
      size="xs"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="flex-1 text-[10px] h-7"
    >
      {isSuccess ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : null}
      {isSuccess ? "Applied" : `${label} (${formatPrice(price)})`}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// EstimateToggle - inline button to expand/collapse EstimateBuilder
// ---------------------------------------------------------------------------

type EstimateToggleProps = {
  isExpanded: boolean;
  onToggle: () => void;
  hasMaterial: boolean;
};

export function EstimateToggle({ isExpanded, onToggle, hasMaterial }: EstimateToggleProps) {
  if (!hasMaterial) return null;

  return (
    <Button
      size="xs"
      variant="ghost"
      onClick={onToggle}
      className="text-[10px] h-5 px-1.5 text-blue-600 hover:text-blue-800"
    >
      {isExpanded ? (
        <ChevronDown className="h-3 w-3 mr-0.5" />
      ) : (
        <ChevronRight className="h-3 w-3 mr-0.5" />
      )}
      {isExpanded ? "Hide" : "Estimate"}
    </Button>
  );
}
