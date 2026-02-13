import type { EstimateBreakdownItem } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Props = {
  low: number;
  high: number;
  sqft: number;
  breakdown: EstimateBreakdownItem[];
};

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

const CHART_COLORS = [
  "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8",
  "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8",
  "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8",
  "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8",
  "#1e293b", "#334155", "#475569",
];

export function EstimateResults({ low, high, sqft, breakdown }: Props) {
  const midpoint = Math.round((low + high) / 2);
  const perSqftLow = Math.round(low / sqft);
  const perSqftHigh = Math.round(high / sqft);

  // Chart data: top 10 categories by midpoint, sorted descending
  const chartData = [...breakdown]
    .map((b) => ({
      name: b.display_name.length > 18
        ? b.display_name.substring(0, 16) + "..."
        : b.display_name,
      value: Math.round((b.low + b.high) / 2),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Hero estimate */}
      <div className="text-center py-8 bg-slate-50 rounded-2xl border">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          Your Estimated Build Cost
        </p>
        <p className="text-4xl sm:text-5xl font-bold text-slate-900 mt-3">
          {fmt(low)} &mdash; {fmt(high)}
        </p>
        <p className="text-lg text-slate-500 mt-2">
          ${perSqftLow} &ndash; ${perSqftHigh} per sqft
        </p>
        <p className="text-sm text-slate-400 mt-1">
          Midpoint: {fmt(midpoint)}
        </p>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-sm font-medium text-slate-700 mb-4">
          Cost Breakdown (Top 10 Categories)
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => fmt(Number(v))}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed breakdown table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b">
          <p className="text-sm font-medium text-slate-700">
            Detailed Breakdown
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-slate-500">
              <th className="px-4 py-2 text-left font-medium">Category</th>
              <th className="px-4 py-2 text-right font-medium">Low</th>
              <th className="px-4 py-2 text-right font-medium">High</th>
              <th className="px-4 py-2 text-right font-medium hidden sm:table-cell">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item) => {
              const pct = midpoint > 0
                ? (((item.low + item.high) / 2 / midpoint) * 100).toFixed(1)
                : "0";
              return (
                <tr
                  key={item.category}
                  className="border-b last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {item.display_name}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600 tabular-nums">
                    {fmt(item.low)}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600 tabular-nums">
                    {fmt(item.high)}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-400 tabular-nums hidden sm:table-cell">
                    {pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-2 text-slate-900">Total</td>
              <td className="px-4 py-2 text-right text-slate-900 tabular-nums">
                {fmt(low)}
              </td>
              <td className="px-4 py-2 text-right text-slate-900 tabular-nums">
                {fmt(high)}
              </td>
              <td className="px-4 py-2 text-right text-slate-400 hidden sm:table-cell">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
