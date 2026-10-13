import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Sparkles,
  Zap,
  Filter,
  ArrowUpRight,
  Package,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { SalesLedgerItem, InventoryItem } from "../../types/alacio";
import {
  aggregateSalesVelocity30Days,
  DailyVelocityDataPoint,
  SKUPerformance,
} from "../../utils/salesVelocityAggregator";

interface SalesVelocityTrendChartProps {
  salesLedger: SalesLedgerItem[];
  inventory: InventoryItem[];
  currency?: string;
}

export default function SalesVelocityTrendChart({
  salesLedger,
  inventory,
  currency = "KSh",
}: SalesVelocityTrendChartProps) {
  // Aggregate sales ledger over 30 days
  const {
    chartData,
    skuPerformances,
    highGrowthSKUs,
    total30dUnits,
    avgDailyUnitsOverall,
    growthPaceOverallPct,
  } = useMemo(
    () => aggregateSalesVelocity30Days(salesLedger, inventory),
    [salesLedger, inventory]
  );

  // Selected view mode: "AGGREGATE" (Total Daily Units + Rolling Trend), "TOP_SKUS" (Multivariate comparative lines), or "STACKED"
  const [viewMode, setViewMode] = useState<"AGGREGATE" | "TOP_SKUS" | "HIGH_GROWTH_FOCUS">("AGGREGATE");
  
  // High growth item selector for deep-dive inspection
  const [selectedSkuFilter, setSelectedSkuFilter] = useState<string>("ALL");

  // Filter high-growth SKUs to highlight
  const topHighGrowth = useMemo(() => {
    return highGrowthSKUs.slice(0, 5);
  }, [highGrowthSKUs]);

  // Active SKUs to render lines for when in SKU mode or when filtered
  const activeLineSkus = useMemo(() => {
    if (selectedSkuFilter !== "ALL") {
      return skuPerformances.filter((s) => s.skuName === selectedSkuFilter);
    }
    if (viewMode === "HIGH_GROWTH_FOCUS") {
      return topHighGrowth;
    }
    return skuPerformances.slice(0, 4);
  }, [selectedSkuFilter, viewMode, skuPerformances, topHighGrowth]);

  // Custom Recharts tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as DailyVelocityDataPoint;
      return (
        <div className="bg-[#0b1420]/95 backdrop-blur-md border border-[#1e3a5f] rounded-xl p-3 shadow-2xl font-mono text-xs z-50 min-w-[210px]">
          <div className="flex items-center justify-between border-b border-[#182c40] pb-1.5 mb-2">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              <Calendar size={12} /> {dataPoint.dayLabel} ({dataPoint.date})
            </span>
            <span className="text-[10px] text-slate-400">
              {dataPoint.transactionCount} txns
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-white font-bold">
              <span className="text-slate-300">Total Units Sold:</span>
              <span className="text-emerald-400 text-sm font-black">
                {dataPoint.totalUnits} units
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Daily Volume Est:</span>
              <span className="text-white">
                {currency} {dataPoint.totalRevenue?.toLocaleString()}
              </span>
            </div>

            {/* Top items contributing to this day */}
            <div className="pt-1.5 border-t border-[#182c40]/70 mt-1.5 space-y-1">
              <div className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">
                Key SKU Contributions:
              </div>
              {skuPerformances.slice(0, 4).map((sku) => {
                const units = dataPoint[sku.skuName];
                if (!units) return null;
                return (
                  <div key={sku.skuName} className="flex items-center justify-between text-[11px]">
                    <span className="truncate max-w-[130px] flex items-center gap-1" style={{ color: sku.color }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: sku.color }} />
                      {sku.skuName}
                    </span>
                    <span className="font-bold text-slate-200">{units} units</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0d1826] border border-[#182c40] rounded-2xl p-5 shadow-2xl space-y-5">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#182c40] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <TrendingUp size={18} />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide font-sans flex items-center gap-2">
              Sales Velocity Trend (30 Days)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Aggregated from Sales Ledger
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Tracks daily turnover units over the last 30 calendar days to detect fast-accelerating stock items and inform automated replenishment reorders.
          </p>
        </div>

        {/* CONTROLS: VIEW MODES */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#08101a] p-1 rounded-xl border border-[#182c40] text-xs font-mono">
            <button
              onClick={() => {
                setViewMode("AGGREGATE");
                setSelectedSkuFilter("ALL");
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "AGGREGATE" && selectedSkuFilter === "ALL"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={13} />
              Overall Daily Units
            </button>
            <button
              onClick={() => {
                setViewMode("HIGH_GROWTH_FOCUS");
                setSelectedSkuFilter("ALL");
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "HIGH_GROWTH_FOCUS"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap size={13} />
              High-Growth SKUs
            </button>
            <button
              onClick={() => {
                setViewMode("TOP_SKUS");
                setSelectedSkuFilter("ALL");
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "TOP_SKUS"
                  ? "bg-amber-400 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Package size={13} />
              Multi-SKU Velocity
            </button>
          </div>
        </div>
      </div>

      {/* KPI HIGHLIGHT CARDS (30D SUMMARY) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#09131f] border border-[#182c40] rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            30-Day Aggregated Units
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-0.5">
            {total30dUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
            Across 30 active trading dates
          </span>
        </div>

        <div className="bg-[#09131f] border border-[#182c40] rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Daily Run-Rate
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400 mt-0.5">
            {avgDailyUnitsOverall} <span className="text-xs font-normal text-slate-400">units/day</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
            Baseline inventory outflow
          </span>
        </div>

        <div className="bg-[#09131f] border border-[#182c40] rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            7-Day Velocity Pace
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 flex items-center gap-1 mt-0.5">
            <ArrowUpRight size={18} />
            +{growthPaceOverallPct}%
          </div>
          <span className="text-[10px] text-emerald-400 font-sans block mt-0.5">
            Accelerating vs prior week
          </span>
        </div>

        <div className="bg-[#09131f] border border-[#182c40] rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            High-Growth Identified
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-purple-400 mt-0.5">
            {highGrowthSKUs.length} <span className="text-xs font-normal text-slate-400">SKUs</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
            Exceeding +15% expansion
          </span>
        </div>
      </div>

      {/* FILTER CHIPS: SELECT INDIVIDUAL ITEM TO ISOLATE */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
        <span className="text-slate-400 text-[11px] flex items-center gap-1 shrink-0 font-sans">
          <Filter size={12} className="text-emerald-400" /> Focus SKU:
        </span>
        <button
          onClick={() => setSelectedSkuFilter("ALL")}
          className={`px-2.5 py-1 rounded-lg border text-[11px] transition shrink-0 cursor-pointer ${
            selectedSkuFilter === "ALL"
              ? "bg-[#1f3a5f] text-white border-cyan-400/80 font-bold"
              : "bg-[#09131f] text-slate-400 border-[#182c40] hover:text-white hover:border-slate-600"
          }`}
        >
          All Items ({skuPerformances.length})
        </button>
        {topHighGrowth.map((sku) => (
          <button
            key={sku.skuName}
            onClick={() => {
              setSelectedSkuFilter(sku.skuName);
              setViewMode("TOP_SKUS");
            }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedSkuFilter === sku.skuName
                ? "bg-[#1f3a5f] text-white border-cyan-400 font-bold"
                : "bg-[#09131f] text-slate-300 border-[#182c40] hover:text-white hover:border-slate-600"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: sku.color }}
            />
            <span className="truncate max-w-[130px]">{sku.skuName}</span>
            <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              +{sku.growthRatePct}%
            </span>
          </button>
        ))}
      </div>

      {/* RECHARTS VISUALIZATION CONTAINER */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="totalUnitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="cyanAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#182c40"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="dayLabel"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#182c40" }}
              interval="preserveStartEnd"
              tickFormatter={(val, idx) => (idx % 4 === 0 ? val : "")}
            />

            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#182c40" }}
              unit="u"
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{
                paddingTop: "12px",
                fontSize: "11px",
                fontFamily: "monospace",
              }}
            />

            {/* In AGGREGATE mode: show total daily units as bars + filled area trend */}
            {viewMode === "AGGREGATE" && selectedSkuFilter === "ALL" && (
              <>
                <Bar
                  dataKey="totalUnits"
                  name="Daily Unit Sales"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                  maxBarSize={28}
                />
                <Area
                  type="monotone"
                  dataKey="totalUnits"
                  name="Velocity Contour"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#totalUnitsGradient)"
                />
              </>
            )}

            {/* In MULTI-SKU or HIGH GROWTH mode, or when SKU isolated */}
            {(viewMode !== "AGGREGATE" || selectedSkuFilter !== "ALL") && (
              <>
                {/* Background soft aggregate bar for perspective */}
                <Bar
                  dataKey="totalUnits"
                  name="Total Basket Units"
                  fill="#1e293b"
                  radius={[3, 3, 0, 0]}
                  opacity={0.5}
                  maxBarSize={20}
                />
                {activeLineSkus.map((sku) => (
                  <Line
                    key={sku.skuName}
                    type="monotone"
                    dataKey={sku.skuName}
                    name={sku.skuName}
                    stroke={sku.color}
                    strokeWidth={selectedSkuFilter === sku.skuName ? 3 : 2}
                    dot={{ r: 2.5, fill: sku.color }}
                    activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 1.5 }}
                  />
                ))}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* HIGH-GROWTH INVENTORY ITEMS ROSTER (IDENTIFICATION TABLE) */}
      <div className="pt-2 border-t border-[#182c40] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              High-Growth Inventory Items (Actionable Restock Intelligence)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Sorted by 30D Velocity &amp; Growth Curve
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {skuPerformances.slice(0, 6).map((sku) => {
            const isHigh = sku.isHighGrowth || sku.growthRatePct >= 15;
            return (
              <div
                key={sku.skuName}
                onClick={() => {
                  setSelectedSkuFilter(
                    selectedSkuFilter === sku.skuName ? "ALL" : sku.skuName
                  );
                  setViewMode("TOP_SKUS");
                }}
                className={`p-3 rounded-xl border transition cursor-pointer space-y-2 select-none ${
                  selectedSkuFilter === sku.skuName
                    ? "bg-[#112236] border-cyan-400 shadow-md ring-1 ring-cyan-400/50"
                    : "bg-[#09131f] border-[#182c40] hover:border-slate-600 hover:bg-[#0c1827]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sku.color }}
                      />
                      <h5 className="text-xs font-bold text-white truncate max-w-[170px]">
                        {sku.skuName}
                      </h5>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Peak: {sku.peakDailyUnits} units/day &bull; Avg: {sku.avgDailyUnits}/day
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 border ${
                      isHigh
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    +{sku.growthRatePct}% Growth
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#182c40]/70 text-[11px] font-mono">
                  <span className="text-slate-400">
                    30D Volume:{" "}
                    <strong className="text-white font-bold">
                      {sku.totalUnits30d} units
                    </strong>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {currency} {sku.totalRevenue30d.toLocaleString()}
                  </span>
                </div>

                {isHigh && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                    <Zap size={11} className="shrink-0" />
                    <span>High velocity: Maintain safety buffer</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
