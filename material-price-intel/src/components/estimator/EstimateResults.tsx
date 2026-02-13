import { TrendingUp } from "lucide-react";
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
  "#2d3f47", "#354b54", "#3d5762", "#4a6b78", "#5b8291",
  "#6b9aab", "#8ab3c2", "#b4cdd8", "#78716c", "#92400e",
];

export function EstimateResults({ low, high, sqft, breakdown }: Props) {
  const midpoint = Math.round((low + high) / 2);
  const perSqftLow = Math.round(low / sqft);
  const perSqftHigh = Math.round(high / sqft);

  // Chart data: top 10 categories by midpoint, sorted descending
  const chartData = [...breakdown]
    .map((b) => ({
      name: b.display_name,
      value: Math.round((b.low + b.high) / 2),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Hero estimate */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 text-white px-6 py-10 sm:py-12 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(91,130,145,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(139,179,194,0.1),transparent_50%)]" />
        <div className="relative text-center">
          <div className="inline-flex items-center gap-1.5 text-brand-300 text-xs font-semibold tracking-widest uppercase mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            Your Estimated Build Cost
          </div>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            {fmt(low)} <span className="text-brand-500">&mdash;</span> {fmt(high)}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-base sm:text-lg text-brand-200">
              ${perSqftLow} &ndash; ${perSqftHigh} per sqft
            </span>
            <span className="w-px h-5 bg-brand-600" />
            <span className="text-sm text-brand-400">
              Midpoint: {fmt(midpoint)}
            </span>
          </div>
          <p className="text-xs text-brand-500/60 mt-3">
            Based on {sqft.toLocaleString()} sqft &bull; Bradenton/Sarasota market rates
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-brand-200/50 p-5 sm:p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand-800 mb-5">
          Cost Breakdown &mdash; Top 10 Categories
        </p>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                fontSize={11}
                stroke="#8ab3c2"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                stroke="#4a6b78"
              />
              <Tooltip
                formatter={(v) => [fmt(Number(v)), "Average Cost"]}
                labelStyle={{ fontWeight: 600, color: "#2d3f47" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #d9e6eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed breakdown table */}
      <div className="bg-white rounded-2xl border border-brand-200/50 overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
          <p className="text-sm font-semibold text-brand-800">
            Detailed Breakdown
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-brand-50/30 text-xs text-brand-600">
              <th className="px-5 py-3 text-left font-semibold">Category</th>
              <th className="px-5 py-3 text-right font-semibold">Low</th>
              <th className="px-5 py-3 text-right font-semibold">High</th>
              <th className="px-5 py-3 text-right font-semibold hidden sm:table-cell">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item, idx) => {
              const pct = midpoint > 0
                ? (((item.low + item.high) / 2 / midpoint) * 100).toFixed(1)
                : "0";
              return (
                <tr
                  key={item.category}
                  className={`border-b last:border-0 hover:bg-brand-50/50 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-brand-50/20"
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-brand-900">
                    {item.display_name}
                  </td>
                  <td className="px-5 py-3 text-right text-brand-700 tabular-nums">
                    {fmt(item.low)}
                  </td>
                  <td className="px-5 py-3 text-right text-brand-700 tabular-nums">
                    {fmt(item.high)}
                  </td>
                  <td className="px-5 py-3 text-right text-brand-400 tabular-nums hidden sm:table-cell">
                    {pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-brand-800 text-white font-semibold">
              <td className="px-5 py-3">Total</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmt(low)}</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmt(high)}</td>
              <td className="px-5 py-3 text-right hidden sm:table-cell">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
