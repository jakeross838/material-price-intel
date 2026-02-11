import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Layers } from "lucide-react";
import type { ReportDataPoint } from "@/hooks/useReportsData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoryAggregateChartProps = {
  data: ReportDataPoint[];
  categories: Array<{ id: string; display_name: string }>;
  onPointClick?: (quoteId: string) => void;
};

type ChartPoint = {
  date: string;
  sortDate: string;
  [key: string]: number | string | Record<string, string> | undefined;
};

const CATEGORY_COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#c026d3", // fuchsia-600
  "#854d0e", // yellow-800
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateLabel(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function formatCurrencyAxis(val: number): string {
  return `$${val.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatCurrencyTooltip(val: number): string {
  return `$${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

type TooltipPayloadEntry = {
  name: string;
  value: number;
  color: string;
  payload: ChartPoint;
};

function CustomTooltip({
  active,
  payload,
  onPointClick,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  onPointClick?: (quoteId: string) => void;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  const quoteIds = point._quoteIds as Record<string, string> | undefined;

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-medium mb-1.5">{point.date}</p>
      {payload.map((entry) => {
        const quoteId = quoteIds?.[entry.name];
        return (
          <div
            key={entry.name}
            className={`flex items-center justify-between gap-4 py-0.5 ${
              quoteId && onPointClick
                ? "cursor-pointer hover:bg-accent rounded px-1 -mx-1"
                : ""
            }`}
            onClick={() => {
              if (quoteId && onPointClick) onPointClick(quoteId);
            }}
          >
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-medium tabular-nums">
              {formatCurrencyTooltip(entry.value)} avg
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryAggregateChart({
  data,
  categories,
  onPointClick,
}: CategoryAggregateChartProps) {
  const { chartData, categoryNames } = useMemo(() => {
    if (data.length === 0) return { chartData: [], categoryNames: [] };

    // Map category IDs to display names
    const catMap = new Map<string, string>();
    for (const c of categories) catMap.set(c.id, c.display_name);

    // Group by date + categoryId, average prices
    const grouped = new Map<
      string,
      Map<string, { total: number; count: number; quoteId: string }>
    >();

    for (const d of data) {
      if (!d.categoryId) continue;
      const dateKey = d.quoteDate ?? "unknown";
      if (!grouped.has(dateKey)) grouped.set(dateKey, new Map());
      const dateGroup = grouped.get(dateKey)!;
      const catName = catMap.get(d.categoryId) ?? d.categoryId;
      const entry = dateGroup.get(catName) ?? {
        total: 0,
        count: 0,
        quoteId: d.quoteId,
      };
      entry.total += d.effectiveUnitPrice;
      entry.count += 1;
      dateGroup.set(catName, entry);
    }

    // Unique category names present in data
    const catNameSet = new Set<string>();
    for (const [, catGroups] of grouped) {
      for (const name of catGroups.keys()) catNameSet.add(name);
    }
    const catNames = [...catNameSet].sort();

    // Build chart data
    const points: ChartPoint[] = [];
    for (const [dateKey, catGroups] of grouped) {
      const point: ChartPoint = {
        date: formatDateLabel(dateKey),
        sortDate: dateKey,
        _quoteIds: {} as Record<string, string>,
      };
      for (const [catName, entry] of catGroups) {
        point[catName] = entry.total / entry.count;
        (point._quoteIds as Record<string, string>)[catName] = entry.quoteId;
      }
      points.push(point);
    }

    points.sort((a, b) => a.sortDate.localeCompare(b.sortDate));

    return { chartData: points, categoryNames: catNames };
  }, [data, categories]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Layers className="h-10 w-10 mb-3" />
        <p>No category data available. Ensure materials are linked to categories.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        onClick={(e: unknown) => {
          const event = e as {
            activePayload?: Array<{ payload: ChartPoint }>;
          };
          if (
            event?.activePayload?.[0]?.payload?._quoteIds &&
            onPointClick
          ) {
            const quoteIds = event.activePayload[0].payload
              ._quoteIds as Record<string, string>;
            const firstQuoteId = Object.values(quoteIds)[0];
            if (firstQuoteId) onPointClick(firstQuoteId);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={formatCurrencyAxis}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          domain={["auto", "auto"]}
        />
        <Tooltip
          content={<CustomTooltip onPointClick={onPointClick} />}
        />
        <Legend />
        {categoryNames.map((catName, i) => (
          <Line
            key={catName}
            type="monotone"
            dataKey={catName}
            stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4, cursor: "pointer" }}
            activeDot={{ r: 6, cursor: "pointer" }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
