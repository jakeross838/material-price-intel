import { Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ===========================================
// MaterialCard - Presentational catalog card
// ===========================================
// Displays a material in a catalog grid.
// Receives all data via props -- no hooks.
// Reusable in authenticated admin, public catalog,
// and Dream Home Designer contexts.
// ===========================================

type MaterialCardProps = {
  material: {
    id: string;
    canonical_name: string;
    species: string | null;
    dimensions: string | null;
    grade: string | null;
    category_attributes: Record<string, unknown>;
  };
  category?: { name: string; display_name: string } | null;
  primaryImage?: { image_url: string; thumbnail_url: string | null } | null;
  priceRange?: { min: number | null; max: number | null } | null;
  onClick?: () => void;
};

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPriceDisplay(priceRange: MaterialCardProps["priceRange"]): string {
  if (!priceRange) return "Price TBD";
  const { min, max } = priceRange;
  if (min == null && max == null) return "Price TBD";
  if (min != null && max != null) {
    if (min === max) return `${formatPrice(min)} /pc`;
    return `${formatPrice(min)} - ${formatPrice(max)} /pc`;
  }
  if (min != null) return `From ${formatPrice(min)} /pc`;
  return `Up to ${formatPrice(max!)} /pc`;
}

export function MaterialCard({
  material,
  category,
  primaryImage,
  priceRange,
  onClick,
}: MaterialCardProps) {
  const specs: string[] = [];
  if (material.species) specs.push(material.species);
  if (material.dimensions) specs.push(material.dimensions);
  if (material.grade && specs.length < 2) specs.push(material.grade);

  return (
    <Card
      className={cn(
        "group overflow-hidden p-0 gap-0 transition-all duration-200",
        onClick &&
          "cursor-pointer hover:shadow-md hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Image area -- 60% of card height */}
      <div className="relative aspect-[3/2] bg-muted overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.thumbnail_url ?? primaryImage.image_url}
            alt={material.canonical_name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-3 space-y-1.5">
        {/* Name */}
        <h3 className="text-sm font-medium leading-tight truncate" title={material.canonical_name}>
          {material.canonical_name}
        </h3>

        {/* Key specs */}
        {specs.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {specs.join(" | ")}
          </p>
        )}

        {/* Category badge + price */}
        <div className="flex items-center justify-between gap-2">
          {category && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
              {category.display_name}
            </span>
          )}
          <span
            className={cn(
              "text-xs font-medium ml-auto",
              priceRange && (priceRange.min != null || priceRange.max != null)
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {getPriceDisplay(priceRange)}
          </span>
        </div>
      </div>
    </Card>
  );
}
