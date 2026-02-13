import { cn } from "@/lib/utils";

// ===========================================
// CategoryFilter - Horizontal category pills
// ===========================================
// Presentational component for browsing
// materials by category. Receives categories
// via props -- no hooks.
// ===========================================

type CategoryFilterProps = {
  categories: Array<{ id: string; name: string; display_name: string }>;
  activeId: string | null; // null = "All" selected
  onSelect: (categoryId: string | null) => void;
};

export function CategoryFilter({
  categories,
  activeId,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* "All" pill */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          activeId === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
      >
        All
      </button>

      {/* Category pills */}
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            activeId === cat.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          {cat.display_name}
        </button>
      ))}
    </div>
  );
}
