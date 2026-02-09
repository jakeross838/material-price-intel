import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type ValidationWarning = {
  check: string;
  message: string;
  expected?: number;
  actual?: number;
};

type ValidationWarningsProps = {
  warnings: ValidationWarning[];
};

export function ValidationWarnings({ warnings }: ValidationWarningsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between text-left",
          "text-sm font-medium text-amber-800"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          {warnings.length} validation warning{warnings.length !== 1 ? "s" : ""}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        )}
      </button>

      {expanded && (
        <ul className="mt-3 space-y-2">
          {warnings.map((w, i) => (
            <li
              key={`${w.check}-${i}`}
              className="rounded-md bg-amber-100/60 px-3 py-2 text-sm text-amber-900"
            >
              <p className="font-medium">{w.check.replace(/_/g, " ")}</p>
              <p className="mt-0.5 text-amber-800">{w.message}</p>
              {w.expected != null && w.actual != null && (
                <p className="mt-0.5 text-xs text-amber-700">
                  Expected: {w.expected} | Actual: {w.actual}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
