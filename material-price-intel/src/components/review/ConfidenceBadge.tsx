import { cn } from "@/lib/utils";

type ConfidenceBadgeProps = {
  score: number | null;
  size?: "sm" | "md";
};

export function ConfidenceBadge({ score, size = "sm" }: ConfidenceBadgeProps) {
  if (score == null) return null;

  const pct = Math.round(score * 100);
  const color =
    pct >= 80
      ? "bg-green-100 text-green-800"
      : pct >= 60
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {pct}% confidence
    </span>
  );
}
