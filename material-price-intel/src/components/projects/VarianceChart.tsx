import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { BarChart3 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VarianceDataPoint = {
  name: string;
  allowance: number;
  estimated: number;
  actual: number;
  variance: number;
};

type VarianceChartProps = {
  data: VarianceDataPoint[];
  groupBy: "room" | "category";
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDollarAxis = (value: number) => {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const formatDollarTooltip = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

type TooltipPayloadEntry = {
  name: string;
  value: number;
  color: string;
  dataKey: string;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-medium mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-4 py-0.5"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-medium tabular-nums">
            {formatDollarTooltip(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VarianceChart({ data, groupBy }: VarianceChartProps) {
  // Determine layout based on number of groups
  const isVertical = data.length > 12;

  // Filter out items where actual is 0 and build chart-ready data
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      // Keep actual as-is; we use conditional cell rendering
      _hasActual: d.actual > 0,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <BarChart3 className="h-10 w-10 mb-3" />
        <p>
          No {groupBy === "room" ? "room" : "category"} data to chart.
        </p>
      </div>
    );
  }

  const chartHeight = isVertical ? Math.max(350, data.length * 40) : 350;

  if (isVertical) {
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            type="number"
            tickFormatter={formatDollarAxis}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Bar dataKey="allowance" name="Allowance" fill="#94a3b8" barSize={12} />
          <Bar dataKey="estimated" name="Estimated" fill="#3b82f6" barSize={12} />
          <Bar dataKey="actual" name="Actual" barSize={12}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  !entry._hasActual
                    ? "transparent"
                    : entry.variance > 0
                      ? "#ef4444"
                      : "#22c55e"
                }
              />
            ))}
          </Bar>
          <Bar dataKey="variance" name="Variance" barSize={8}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.variance > 0 ? "#ef4444" : "#22c55e"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          interval={0}
          angle={data.length > 8 ? -25 : 0}
          textAnchor={data.length > 8 ? "end" : "middle"}
          height={data.length > 8 ? 80 : 30}
        />
        <YAxis
          tickFormatter={formatDollarAxis}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
        <Bar dataKey="allowance" name="Allowance" fill="#94a3b8" barSize={16} />
        <Bar dataKey="estimated" name="Estimated" fill="#3b82f6" barSize={16} />
        <Bar dataKey="actual" name="Actual" barSize={16}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={
                !entry._hasActual
                  ? "transparent"
                  : entry.variance > 0
                    ? "#ef4444"
                    : "#22c55e"
              }
            />
          ))}
        </Bar>
        <Bar dataKey="variance" name="Variance" barSize={10}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.variance > 0 ? "#ef4444" : "#22c55e"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
