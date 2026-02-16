import { useState, useRef } from "react";
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Home,
  Printer,
  DollarSign,
  Sparkles,
  FileText,
  Info,
  Lock,
} from "lucide-react";
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
  gated?: boolean; // when true, only show hero — blur the rest
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

// Out-the-door cost factors (Bradenton/Sarasota FL market)
const TAX_RATE = 0.07; // 7% FL sales tax on materials
const PERMIT_RATE = 0.015; // ~1.5% for building permits
const DELIVERY_RATE = 0.02; // ~2% delivery & logistics
const INSURANCE_RATE = 0.025; // ~2.5% builder's risk insurance
const OVERHEAD_RATE = 0.08; // ~8% general contractor overhead

/**
 * Look up the matching SelectionOption for a breakdown item.
 * Tries finishLevel first (most reliable), falls back to label match.
 */
function findSelectionOption(
  category: string,
  displayName: string,
  finishLevel?: string
): SelectionOption | undefined {
  const options = SELECTION_OPTIONS[category];
  if (!options) return undefined;
  if (finishLevel) {
    const byLevel = options.find((opt) => opt.finishLevel === finishLevel);
    if (byLevel) return byLevel;
  }
  return options.find((opt) => opt.label === displayName);
}

export function EstimateResults({
  low,
  high,
  sqft,
  roomBreakdowns,
  breakdown,
  gated = false,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const midpoint = Math.round((low + high) / 2);
  const perSqftLow = Math.round(low / sqft);
  const perSqftHigh = Math.round(high / sqft);

  // Out-the-door calculations
  const taxLow = Math.round(low * TAX_RATE);
  const taxHigh = Math.round(high * TAX_RATE);
  const permitLow = Math.round(low * PERMIT_RATE);
  const permitHigh = Math.round(high * PERMIT_RATE);
  const deliveryLow = Math.round(low * DELIVERY_RATE);
  const deliveryHigh = Math.round(high * DELIVERY_RATE);
  const insuranceLow = Math.round(low * INSURANCE_RATE);
  const insuranceHigh = Math.round(high * INSURANCE_RATE);
  const overheadLow = Math.round(low * OVERHEAD_RATE);
  const overheadHigh = Math.round(high * OVERHEAD_RATE);

  const totalLow = low + taxLow + permitLow + deliveryLow + insuranceLow + overheadLow;
  const totalHigh = high + taxHigh + permitHigh + deliveryHigh + insuranceHigh + overheadHigh;

  // Track which rooms are expanded
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (roomBreakdowns.length > 0) {
      initial.add(roomBreakdowns[0].roomId);
    }
    return initial;
  });

  // Track gallery card expansion for material details
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  function toggleRoom(roomId: string) {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      next.has(roomId) ? next.delete(roomId) : next.add(roomId);
      return next;
    });
  }

  function toggleCard(key: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handlePrint() {
    window.print();
  }

  const hasRoomData = roomBreakdowns.length > 0;

  // Build gallery items from room breakdowns
  const galleryItems: Array<{
    roomName: string;
    category: string;
    displayName: string;
    description: string;
    finishLabel: string;
    finishLevel: string;
    imageUrl: string;
    low: number;
    high: number;
  }> = [];

  if (hasRoomData) {
    for (const room of roomBreakdowns) {
      for (const item of room.items) {
        const option = findSelectionOption(item.category, item.display_name, item.finishLevel);
        if (option) {
          galleryItems.push({
            roomName: room.roomName,
            category: item.category,
            displayName: item.display_name,
            description: option.description,
            finishLabel: FINISH_LABELS[option.finishLevel] ?? option.finishLevel,
            finishLevel: option.finishLevel,
            imageUrl: option.imageUrl,
            low: item.low,
            high: item.high,
          });
        }
      }
    }
  }

  // Chart data
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
    <div ref={printRef} className="space-y-8">
      {/* Print stylesheet */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* ========== Action Bar (hidden when gated) ========== */}
      {!gated && (
        <div className="flex items-center justify-end gap-3 no-print">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-white border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
        </div>
      )}

      {/* ========== Section 1: Hero Estimate ========== */}
      <div className="print-area relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 text-white px-6 py-10 sm:py-12 shadow-xl">
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

      {/* ========== Gated sections (2-7) ========== */}
      {gated ? (
        <div className="relative">
          {/* Blurred preview of out-the-door pricing */}
          <div className="max-h-[280px] overflow-hidden pointer-events-none select-none" aria-hidden="true">
            <div className="blur-[6px] opacity-40">
              <div className="bg-white rounded-2xl border border-brand-200/50 overflow-hidden shadow-sm">
                <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-brand-600" />
                    <p className="text-sm font-semibold text-brand-800">Out-the-Door Pricing</p>
                  </div>
                </div>
                <div className="p-5">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-brand-100">
                        <td className="py-3 font-medium text-brand-800">Material &amp; Labor (Base)</td>
                        <td className="py-3 text-right text-brand-700 tabular-nums">{fmt(low)}</td>
                        <td className="py-3 text-right text-brand-700 tabular-nums">{fmt(high)}</td>
                      </tr>
                      <tr className="border-b border-brand-50">
                        <td className="py-2.5 text-brand-600 pl-4">FL Sales Tax (7%)</td>
                        <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(taxLow)}</td>
                        <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(taxHigh)}</td>
                      </tr>
                      <tr className="border-b border-brand-50">
                        <td className="py-2.5 text-brand-600 pl-4">Building Permits (~1.5%)</td>
                        <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(permitLow)}</td>
                        <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(permitHigh)}</td>
                      </tr>
                      <tr className="border-b border-brand-50">
                        <td className="py-2.5 text-brand-600 pl-4">Delivery &amp; Logistics (~2%)</td>
                        <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(deliveryLow)}</td>
                        <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(deliveryHigh)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          {/* Gradient fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white pointer-events-none" />
          {/* CTA */}
          <div className="relative -mt-6 text-center py-6">
            <div className="inline-flex items-center gap-2 text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm">
              <Lock className="h-4 w-4" />
              Enter your info below to unlock the full breakdown
            </div>
            <p className="text-xs text-brand-400 mt-2 max-w-sm mx-auto">
              Room-by-room costs, material selections gallery, charts, line-by-line detail &mdash; plus we'll email you a copy.
            </p>
          </div>
        </div>
      ) : (
      <>
      {/* ========== Section 2: Out-the-Door Pricing ========== */}
      <div className="print-area bg-white rounded-2xl border border-brand-200/50 overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-brand-800">
              Out-the-Door Pricing
            </p>
            <div className="relative group ml-auto">
              <Info className="h-3.5 w-3.5 text-brand-400 cursor-help" />
              <div className="absolute right-0 top-6 z-10 w-64 p-3 bg-brand-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                Includes estimated Florida sales tax, building permits, delivery logistics, builder&apos;s risk insurance, and general contractor overhead for a complete picture.
              </div>
            </div>
          </div>
        </div>
        <div className="p-5">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-brand-100">
                <td className="py-3 font-medium text-brand-800">Material &amp; Labor (Base)</td>
                <td className="py-3 text-right text-brand-700 tabular-nums">{fmt(low)}</td>
                <td className="py-3 text-right text-brand-700 tabular-nums">{fmt(high)}</td>
              </tr>
              <tr className="border-b border-brand-50">
                <td className="py-2.5 text-brand-600 pl-4">FL Sales Tax (7%)</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(taxLow)}</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(taxHigh)}</td>
              </tr>
              <tr className="border-b border-brand-50">
                <td className="py-2.5 text-brand-600 pl-4">Building Permits (~1.5%)</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(permitLow)}</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(permitHigh)}</td>
              </tr>
              <tr className="border-b border-brand-50">
                <td className="py-2.5 text-brand-600 pl-4">Delivery &amp; Logistics (~2%)</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(deliveryLow)}</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(deliveryHigh)}</td>
              </tr>
              <tr className="border-b border-brand-50">
                <td className="py-2.5 text-brand-600 pl-4">Builder&apos;s Risk Insurance (~2.5%)</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(insuranceLow)}</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(insuranceHigh)}</td>
              </tr>
              <tr className="border-b border-brand-100">
                <td className="py-2.5 text-brand-600 pl-4">GC Overhead (~8%)</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(overheadLow)}</td>
                <td className="py-2.5 text-right text-brand-500 tabular-nums">{fmt(overheadHigh)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-brand-800 text-white font-bold">
                <td className="px-4 py-3 rounded-bl-lg">Total Out-the-Door</td>
                <td className="py-3 text-right tabular-nums">{fmt(totalLow)}</td>
                <td className="py-3 text-right tabular-nums pr-1 rounded-br-lg">{fmt(totalHigh)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="text-[11px] text-brand-400 mt-3">
            Out-the-door per sqft: ${Math.round(totalLow / sqft)} &ndash; ${Math.round(totalHigh / sqft)} / sqft
          </p>
        </div>
      </div>

      {/* ========== Section 3: Your Selections Gallery with Material Details ========== */}
      {galleryItems.length > 0 && (
        <div className="print-area bg-white rounded-2xl border border-brand-200/50 overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-brand-600" />
              <p className="text-sm font-semibold text-brand-800">
                Your Material Selections
              </p>
              <span className="text-xs text-brand-400 ml-auto">
                {galleryItems.length} selections
              </span>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {galleryItems.map((item, idx) => {
                const cardKey = `${item.roomName}-${item.category}-${idx}`;
                const isExpanded = expandedCards.has(cardKey);

                return (
                  <div
                    key={cardKey}
                    className="group rounded-xl border border-brand-200/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-brand-100 relative">
                      <img
                        src={item.imageUrl}
                        alt={item.displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm ${
                          item.finishLevel === "luxury"
                            ? "bg-amber-100 text-amber-800"
                            : item.finishLevel === "premium"
                            ? "bg-brand-100 text-brand-800"
                            : item.finishLevel === "standard"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {item.finishLabel}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-medium text-brand-500 uppercase tracking-wider mb-0.5">
                        {item.roomName} &bull; {item.category}
                      </p>
                      <p className="text-sm font-semibold text-brand-900 leading-tight">
                        {item.displayName}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-brand-600 tabular-nums font-medium">
                          {fmt(item.low)} &ndash; {fmt(item.high)}
                        </span>
                        <button
                          onClick={() => toggleCard(cardKey)}
                          className="text-[10px] text-brand-500 hover:text-brand-700 underline no-print"
                        >
                          {isExpanded ? "Less" : "Details"}
                        </button>
                      </div>
                      {isExpanded && (
                        <p className="mt-2 text-xs text-brand-600 leading-relaxed border-t border-brand-100 pt-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========== Section 4: Room-by-Room Breakdown ========== */}
      {hasRoomData && (
        <div className="print-area space-y-3">
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

                {isExpanded && room.items.length > 0 && (
                  <div className="border-t border-brand-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-brand-50/40 text-xs text-brand-500">
                          <th className="px-5 py-2 text-left font-medium">Material</th>
                          <th className="px-5 py-2 text-left font-medium hidden sm:table-cell">Specification</th>
                          <th className="px-5 py-2 text-right font-medium">Low</th>
                          <th className="px-5 py-2 text-right font-medium">High</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.items.map((item, idx) => {
                          const option = findSelectionOption(item.category, item.display_name, item.finishLevel);
                          return (
                            <tr
                              key={`${room.roomId}-${item.category}-${idx}`}
                              className={`border-t border-brand-50 ${
                                idx % 2 === 0 ? "bg-white" : "bg-brand-50/15"
                              }`}
                            >
                              <td className="px-5 py-2.5">
                                <p className="font-medium text-brand-800">{item.display_name}</p>
                                {option && (
                                  <p className="text-[11px] text-brand-400 mt-0.5 hidden lg:block">
                                    {option.description.slice(0, 80)}...
                                  </p>
                                )}
                              </td>
                              <td className="px-5 py-2.5 text-xs text-brand-500 hidden sm:table-cell">
                                {option ? FINISH_LABELS[option.finishLevel] ?? option.finishLevel : "—"}
                              </td>
                              <td className="px-5 py-2.5 text-right text-brand-600 tabular-nums">
                                {fmt(item.low)}
                              </td>
                              <td className="px-5 py-2.5 text-right text-brand-600 tabular-nums">
                                {fmt(item.high)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========== Section 5: Bar Chart ========== */}
      <div className="print-area bg-white rounded-2xl border border-brand-200/50 p-5 sm:p-6 shadow-sm">
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

      {/* ========== Section 6: Detailed Breakdown Table ========== */}
      <div className="print-area bg-white rounded-2xl border border-brand-200/50 overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-brand-800">
              Line-by-Line Cost Detail
            </p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-brand-50/30 text-xs text-brand-600">
              <th className="px-5 py-3 text-left font-semibold">Category</th>
              <th className="px-5 py-3 text-left font-semibold hidden sm:table-cell">Grade</th>
              <th className="px-5 py-3 text-right font-semibold">Low</th>
              <th className="px-5 py-3 text-right font-semibold">High</th>
              <th className="px-5 py-3 text-right font-semibold hidden sm:table-cell">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody>
            {hasRoomData ? (
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
                    <td className="px-5 py-3 text-brand-500 hidden sm:table-cell">—</td>
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
              <td className="px-5 py-3">Subtotal (Material &amp; Labor)</td>
              <td className="px-5 py-3 hidden sm:table-cell" />
              <td className="px-5 py-3 text-right tabular-nums">{fmt(low)}</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmt(high)}</td>
              <td className="px-5 py-3 text-right hidden sm:table-cell">100%</td>
            </tr>
            <tr className="bg-brand-900 text-white font-bold">
              <td className="px-5 py-3">Out-the-Door Total</td>
              <td className="px-5 py-3 hidden sm:table-cell" />
              <td className="px-5 py-3 text-right tabular-nums">{fmt(totalLow)}</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmt(totalHigh)}</td>
              <td className="px-5 py-3 text-right hidden sm:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ========== Section 7: AI Visualization (Placeholder) ========== */}
      <div className="no-print bg-gradient-to-br from-brand-50 via-white to-brand-50/60 rounded-2xl border border-brand-200/50 overflow-hidden shadow-sm">
        <div className="px-6 py-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
            <Sparkles className="h-6 w-6 text-brand-600" />
          </div>
          <h3 className="text-lg font-bold text-brand-900 mb-2">
            AI Home Visualization
          </h3>
          <p className="text-sm text-brand-600 max-w-md mx-auto mb-4">
            See what your dream home could look like based on your selections.
            Our AI will generate custom renderings of your rooms with your chosen finishes.
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-800 text-white text-sm font-medium opacity-60 cursor-not-allowed">
            <Sparkles className="h-4 w-4" />
            Generate Room Renders
          </div>
          <p className="text-xs text-brand-400 mt-3">
            Coming soon &mdash; AI rendering will be available after you save your estimate
          </p>
        </div>
      </div>
      </>
      )}
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
      <tr className="bg-brand-100/60 border-b border-brand-200/40">
        <td className="px-5 py-2.5 font-semibold text-brand-900 text-xs uppercase tracking-wide">
          {room.roomName}
        </td>
        <td className="px-5 py-2.5 hidden sm:table-cell" />
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
      {room.items.map((item, idx) => {
        const option = findSelectionOption(item.category, item.display_name, item.finishLevel);
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
            <td className="px-5 py-2.5 text-xs text-brand-400 hidden sm:table-cell">
              {option ? FINISH_LABELS[option.finishLevel] ?? option.finishLevel : "—"}
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
