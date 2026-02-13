import { useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp, LayoutGrid, Home } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SELECTION_OPTIONS } from "@/lib/roomEstimatorData";
import type { SelectionOption } from "@/lib/roomEstimatorData";
import type { RoomBreakdown } from "@/lib/estimateCalculator";
import type { EstimateBreakdownItem } from "@/lib/types";

type Props = {
  low: number;
  high: number;
  sqft: number;
  roomBreakdowns: RoomBreakdown[];
  breakdown: EstimateBreakdownItem[]; // flat list for chart
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

const FINISH_LABELS: Record<string, string> = {
  builder: "Builder Grade",
  standard: "Standard",
  premium: "Premium",
  luxury: "Luxury",
};

/**
 * Look up the matching SelectionOption for a breakdown item by matching
 * display_name against the label in SELECTION_OPTIONS for the given category.
 * Returns undefined if no match (e.g. special features or missing category).
 */
function findSelectionOption(
  category: string,
  displayName: string
): SelectionOption | undefined {
  const options = SELECTION_OPTIONS[category];
  if (!options) return undefined;
  return options.find((opt) => opt.label === displayName);
}

export function EstimateResults({
  low,
  high,
  sqft,
  roomBreakdowns,
  breakdown,
}: Props) {
  const midpoint = Math.round((low + high) / 2);
  const perSqftLow = Math.round(low / sqft);
  const perSqftHigh = Math.round(high / sqft);

  // Track which rooms are expanded -- first room open by default
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (roomBreakdowns.length > 0) {
      initial.add(roomBreakdowns[0].roomId);
    }
    return initial;
  });

  function toggleRoom(roomId: string) {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  }

  const hasRoomData = roomBreakdowns.length > 0;

  // Build gallery items from room breakdowns -- each selection with an image
  const galleryItems: Array<{
    roomName: string;
    category: string;
    displayName: string;
    finishLabel: string;
    imageUrl: string;
    low: number;
    high: number;
  }> = [];

  if (hasRoomData) {
    for (const room of roomBreakdowns) {
      for (const item of room.items) {
        const option = findSelectionOption(item.category, item.display_name);
        if (option) {
          galleryItems.push({
            roomName: room.roomName,
            category: item.category,
            displayName: item.display_name,
            finishLabel: FINISH_LABELS[option.finishLevel] ?? option.finishLevel,
            imageUrl: option.imageUrl,
            low: item.low,
            high: item.high,
          });
        }
      }
    }
  }

  // Chart data: room totals sorted by midpoint descending (or flat breakdown fallback)
  const chartData = hasRoomData
    ? [...roomBreakdowns]
        .map((r) => ({
          name: r.roomName,
          value: Math.round((r.roomLow + r.roomHigh) / 2),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [...breakdown]
        .map((b) => ({
          name: b.display_name,
          value: Math.round((b.low + b.high) / 2),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* ========== Section 1: Hero Estimate ========== */}
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

      {/* ========== Section 2: Your Selections Gallery ========== */}
      {galleryItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-200/50 overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-brand-600" />
              <p className="text-sm font-semibold text-brand-800">
                Your Selections
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {galleryItems.map((item, idx) => (
                <div
                  key={`${item.roomName}-${item.category}-${idx}`}
                  className="group rounded-xl border border-brand-200/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-brand-100">
                    <img
                      src={item.imageUrl}
                      alt={item.displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-medium text-brand-500 uppercase tracking-wider mb-0.5">
                      {item.roomName}
                    </p>
                    <p className="text-sm font-semibold text-brand-900 leading-tight">
                      {item.displayName}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-100 text-brand-700">
                        {item.finishLabel}
                      </span>
                      <span className="text-xs text-brand-500 tabular-nums">
                        {fmt(item.low)} &ndash; {fmt(item.high)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== Section 3: Room-by-Room Breakdown ========== */}
      {hasRoomData && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Home className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-brand-800">
              Room-by-Room Breakdown
            </p>
          </div>
          {roomBreakdowns.map((room) => {
            const isExpanded = expandedRooms.has(room.roomId);
            const roomMid = Math.round((room.roomLow + room.roomHigh) / 2);
            const roomPct =
              midpoint > 0 ? ((roomMid / midpoint) * 100).toFixed(1) : "0";

            return (
              <div
                key={room.roomId}
                className="bg-white rounded-xl border border-brand-200/50 overflow-hidden shadow-sm"
              >
                {/* Room header -- clickable */}
                <button
                  type="button"
                  onClick={() => toggleRoom(room.roomId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-50/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-brand-900 truncate">
                      {room.roomName}
                    </span>
                    <span className="hidden sm:inline-flex text-xs text-brand-400 tabular-nums">
                      {roomPct}% of total
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-brand-700 tabular-nums">
                      {fmt(room.roomLow)} &ndash; {fmt(room.roomHigh)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-brand-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-brand-400" />
                    )}
                  </div>
                </button>

                {/* Expanded category table */}
                {isExpanded && room.items.length > 0 && (
                  <div className="border-t border-brand-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-brand-50/40 text-xs text-brand-500">
                          <th className="px-5 py-2 text-left font-medium">
                            Category
                          </th>
                          <th className="px-5 py-2 text-right font-medium">
                            Low
                          </th>
                          <th className="px-5 py-2 text-right font-medium">
                            High
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.items.map((item, idx) => (
                          <tr
                            key={`${room.roomId}-${item.category}-${idx}`}
                            className={`border-t border-brand-50 ${
                              idx % 2 === 0 ? "bg-white" : "bg-brand-50/15"
                            }`}
                          >
                            <td className="px-5 py-2.5 font-medium text-brand-800">
                              {item.display_name}
                            </td>
                            <td className="px-5 py-2.5 text-right text-brand-600 tabular-nums">
                              {fmt(item.low)}
                            </td>
                            <td className="px-5 py-2.5 text-right text-brand-600 tabular-nums">
                              {fmt(item.high)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========== Section 4: Bar Chart ========== */}
      <div className="bg-white rounded-2xl border border-brand-200/50 p-5 sm:p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand-800 mb-5">
          Cost Breakdown &mdash;{" "}
          {hasRoomData ? "By Room" : "Top 10 Categories"}
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

      {/* ========== Section 5: Detailed Breakdown Table ========== */}
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
            {hasRoomData ? (
              // Grouped by room with room header rows
              roomBreakdowns.map((room) => {
                const roomMid = Math.round(
                  (room.roomLow + room.roomHigh) / 2
                );
                const roomPct =
                  midpoint > 0
                    ? ((roomMid / midpoint) * 100).toFixed(1)
                    : "0";

                return (
                  <RoomTableGroup
                    key={room.roomId}
                    room={room}
                    roomPct={roomPct}
                    midpoint={midpoint}
                  />
                );
              })
            ) : (
              // Flat breakdown fallback (no room data)
              breakdown.map((item, idx) => {
                const pct =
                  midpoint > 0
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
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-brand-800 text-white font-semibold">
              <td className="px-5 py-3">Total</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmt(low)}</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmt(high)}</td>
              <td className="px-5 py-3 text-right hidden sm:table-cell">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-component: renders a room header row + category rows in the table
// ------------------------------------------------------------------

function RoomTableGroup({
  room,
  roomPct,
  midpoint,
}: {
  room: RoomBreakdown;
  roomPct: string;
  midpoint: number;
}) {
  return (
    <>
      {/* Room header row */}
      <tr className="bg-brand-100/60 border-b border-brand-200/40">
        <td className="px-5 py-2.5 font-semibold text-brand-900 text-xs uppercase tracking-wide">
          {room.roomName}
        </td>
        <td className="px-5 py-2.5 text-right font-semibold text-brand-800 tabular-nums text-xs">
          {fmt(room.roomLow)}
        </td>
        <td className="px-5 py-2.5 text-right font-semibold text-brand-800 tabular-nums text-xs">
          {fmt(room.roomHigh)}
        </td>
        <td className="px-5 py-2.5 text-right font-semibold text-brand-600 tabular-nums text-xs hidden sm:table-cell">
          {roomPct}%
        </td>
      </tr>
      {/* Category rows within this room */}
      {room.items.map((item, idx) => {
        const pct =
          midpoint > 0
            ? (((item.low + item.high) / 2 / midpoint) * 100).toFixed(1)
            : "0";
        return (
          <tr
            key={`${room.roomId}-${item.category}-${idx}`}
            className={`border-b last:border-0 hover:bg-brand-50/50 transition-colors ${
              idx % 2 === 0 ? "bg-white" : "bg-brand-50/20"
            }`}
          >
            <td className="px-5 py-2.5 pl-8 font-medium text-brand-700 text-sm">
              {item.display_name}
            </td>
            <td className="px-5 py-2.5 text-right text-brand-600 tabular-nums">
              {fmt(item.low)}
            </td>
            <td className="px-5 py-2.5 text-right text-brand-600 tabular-nums">
              {fmt(item.high)}
            </td>
            <td className="px-5 py-2.5 text-right text-brand-400 tabular-nums hidden sm:table-cell">
              {pct}%
            </td>
          </tr>
        );
      })}
    </>
  );
}
