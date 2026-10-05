import React, { useState } from "react";
import { 
  BarChart2, TrendingUp, AlertTriangle, PieChart, ShieldAlert, 
  ArrowRight, ShieldCheck, DollarSign, Layers, Building2, 
  CheckCircle2, Clock, Calendar, Sparkles, Filter
} from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";

interface AnalyticsTabProps {
  state: AlacioMasterState;
}

export default function AnalyticsTab({ state }: AnalyticsTabProps) {
  const { currency, inventory, kpis } = state;

  const [activeTimeframe, setActiveTimeframe] = useState<"7D" | "30D" | "ALL">("7D");
  const [selectedChartFilter, setSelectedChartFilter] = useState<"REVENUE" | "CATEGORY" | "DISCREPANCY" | "CHANNELS">("REVENUE");

  // Category values calculation
  const categoryMap: { [cat: string]: { totalValue: number; totalCost: number; count: number } } = {};
  inventory.forEach((item) => {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { totalValue: 0, totalCost: 0, count: 0 };
    }
    categoryMap[item.category].totalValue += item.total_shelf_value;
    categoryMap[item.category].totalCost += item.current_stock * item.unit_cost;
    categoryMap[item.category].count += 1;
  });

  const categories = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    totalValue: categoryMap[cat].totalValue,
    totalCost: categoryMap[cat].totalCost,
    profit: categoryMap[cat].totalValue - categoryMap[cat].totalCost,
    count: categoryMap[cat].count
  })).sort((a, b) => b.totalValue - a.totalValue);

  // Velocity days calculation
  const stockoutWarnings = [
    { name: "Brookside Fresh Milk 500ml", daysLeft: 1.2, stock: 24, rate: "20 pkts/day", urgent: true },
    { name: "Broadways White Bread 400g", daysLeft: 0.8, stock: 16, rate: "18 loaves/day", urgent: true },
    { name: "Mumias Sugar 1kg", daysLeft: 2.1, stock: 15, rate: "7 pkts/day", urgent: false },
    { name: "Unga Jogoo 2kg", daysLeft: 1.5, stock: 8, rate: "5 bales/day", urgent: true },
    { name: "Rina Vegetable Oil 1L", daysLeft: 3.0, stock: 10, rate: "3 btls/day", urgent: false }
  ];

  // 7-Day Revenue & Settlement Breakdown Data
  const weeklyData = [
    { day: "Mon", cash: 4200, mpesa: 3800, deni: 600, total: 8600 },
    { day: "Tue", cash: 4900, mpesa: 4600, deni: 700, total: 10200 },
    { day: "Wed", cash: 5200, mpesa: 5100, deni: 800, total: 11100 },
    { day: "Thu", cash: 4700, mpesa: 4400, deni: 700, total: 9800 },
    { day: "Fri", cash: 6800, mpesa: 6900, deni: 800, total: 14500 },
    { day: "Sat", cash: 8900, mpesa: 8400, deni: 900, total: 18200 },
    { day: "Sun", cash: 7600, mpesa: 7500, deni: 900, total: 16000 }
  ];

  const maxDailyRevenue = 20000;

  // 14-Day Discrepancy Resolution Data (Evening bookends)
  const discrepancyHistory = [
    { day: "D-14", gap: -1450, balanced: false },
    { day: "D-13", gap: -1200, balanced: false },
    { day: "D-12", gap: -980, balanced: false },
    { day: "D-11", gap: -750, balanced: false },
    { day: "D-10", gap: -420, balanced: false },
    { day: "D-09", gap: -300, balanced: false },
    { day: "D-08", gap: -180, balanced: false },
    { day: "D-07", gap: -50, balanced: false },
    { day: "D-06", gap: 0, balanced: true },
    { day: "D-05", gap: 0, balanced: true },
    { day: "D-04", gap: -40, balanced: false },
    { day: "D-03", gap: 0, balanced: true },
    { day: "D-02", gap: 0, balanced: true },
    { day: "D-01", gap: 0, balanced: true }
  ];

  // Hourly Traffic Data (Customer counter rushes)
  const hourlyRush = [
    { hour: "06:00", count: 18, label: "Morning Bread" },
    { hour: "07:00", count: 34, label: "Peak Milk Rush" },
    { hour: "08:00", count: 28, label: "School Run" },
    { hour: "10:00", count: 14, label: "Midday Groceries" },
    { hour: "12:00", count: 22, label: "Lunch Sugar" },
    { hour: "14:00", count: 16, label: "Afternoon" },
    { hour: "16:00", count: 24, label: "Tea Leaves" },
    { hour: "18:00", count: 42, label: "Dinner Unga Peak" },
    { hour: "19:00", count: 38, label: "Evening Rush" },
    { hour: "20:00", count: 20, label: "Closing Float" }
  ];
  const maxHourly = 45;

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER & TIME CONTROLS */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
            <BarChart2 className="text-emerald-400" size={22} /> Analytics, Visual Telemetry &amp; Expansion Models
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Turnover telemetry, payment channel share, multi-day revenue curves, and branch expansion feasibility models.
          </p>
        </div>

        {/* TIME BUTTONS */}
        <div className="flex items-center gap-1.5 bg-[#060c09] p-1 rounded-2xl border border-slate-800 self-start sm:self-auto text-xs font-mono">
          <button
            onClick={() => setActiveTimeframe("7D")}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
              activeTimeframe === "7D" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            7-Day Cycle
          </button>
          <button
            onClick={() => setActiveTimeframe("30D")}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
              activeTimeframe === "30D" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            30-Day Month
          </button>
          <button
            onClick={() => setActiveTimeframe("ALL")}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
              activeTimeframe === "ALL" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            All-Time Telemetry
          </button>
        </div>
      </div>

      {/* TOP SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Average Shelf Markup
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {kpis.avg_markup_percentage}%
          </div>
          <span className="text-[10px] text-slate-500 block">
            Target healthy retail margin is 18-22%
          </span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Accumulated Working Capital
          </span>
          <div className="text-2xl font-black font-mono text-white">
            {currency} 84,200
          </div>
          <span className="text-[10px] text-emerald-400 block font-mono">
            56% toward Branch #2 target (KES 150k)
          </span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Audit Reconciliation Rate
          </span>
          <div className="text-2xl font-black font-mono text-cyan-400">
            99.4%
          </div>
          <span className="text-[10px] text-slate-500 block">
            Zero unexplained cash leakage across last 7 days
          </span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Critical Stockout Risk (&lt; 2 Days)
          </span>
          <div className="text-2xl font-black font-mono text-red-400">
            3 High-Velocity
          </div>
          <span className="text-[10px] text-slate-500 block">
            Milk, Bread &amp; Unga require evening reorder
          </span>
        </div>
      </div>

      {/* GRAPH ROW 1: 7-DAY STACKED REVENUE BAR CHART & SETTLEMENT SHARE DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAPH 1: 7-DAY STACKED REVENUE BAR CHART */}
        <div className="lg:col-span-2 bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <TrendingUp size={15} className="text-emerald-400" /> 7-Day Revenue &amp; Channel Settlement (KSh)
              </h3>
              <p className="text-[11px] text-slate-400">
                Daily sales broken down by physical Cash Drawer, M-Pesa Float, and Customer Deni.
              </p>
            </div>

            {/* LEGEND */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Cash
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block" /> M-Pesa
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Deni
              </span>
            </div>
          </div>

          {/* SVG STACKED BAR CHART */}
          <div className="h-60 w-full pt-2">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible font-mono">
              {/* Horizontal Grid lines */}
              <line x1="40" y1="30" x2="490" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="80" x2="490" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="130" x2="490" y2="130" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="490" y2="170" stroke="#334155" />

              {/* Y Axis Labels */}
              <text x="35" y="34" fill="#64748b" fontSize="9" textAnchor="end">20k</text>
              <text x="35" y="84" fill="#64748b" fontSize="9" textAnchor="end">14k</text>
              <text x="35" y="134" fill="#64748b" fontSize="9" textAnchor="end">7k</text>
              <text x="35" y="174" fill="#64748b" fontSize="9" textAnchor="end">0</text>

              {/* Stacked Bars */}
              {weeklyData.map((d, idx) => {
                const barWidth = 34;
                const xPos = 65 + idx * 62;

                const cashH = (d.cash / maxDailyRevenue) * 140;
                const mpesaH = (d.mpesa / maxDailyRevenue) * 140;
                const deniH = (d.deni / maxDailyRevenue) * 140;

                const cashY = 170 - cashH;
                const mpesaY = cashY - mpesaH;
                const deniY = mpesaY - deniH;

                return (
                  <g key={idx} className="transition-all hover:opacity-85 cursor-pointer">
                    {/* Cash Segment */}
                    <rect
                      x={xPos}
                      y={cashY}
                      width={barWidth}
                      height={cashH}
                      fill="#10b981"
                      rx="2"
                    />

                    {/* M-Pesa Segment */}
                    <rect
                      x={xPos}
                      y={mpesaY}
                      width={barWidth}
                      height={mpesaH}
                      fill="#06b6d4"
                      rx="2"
                    />

                    {/* Deni Segment */}
                    <rect
                      x={xPos}
                      y={deniY}
                      width={barWidth}
                      height={deniH}
                      fill="#f59e0b"
                      rx="3"
                    />

                    {/* Total label above bar */}
                    <text
                      x={xPos + barWidth / 2}
                      y={deniY - 5}
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {(d.total / 1000).toFixed(1)}k
                    </text>

                    {/* Day label on X Axis */}
                    <text
                      x={xPos + barWidth / 2}
                      y="186"
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* GRAPH 2: PAYMENT CHANNEL SETTLEMENT DONUT */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <PieChart size={15} className="text-cyan-400" /> Channel Settlement Share
            </h3>
            <p className="text-[11px] text-slate-400">
              Where counter turnover liquidates.
            </p>
          </div>

          {/* SVG DONUT */}
          <div className="flex items-center justify-center py-2 relative">
            <svg viewBox="0 0 160 160" className="w-36 h-36">
              {/* Donut Segments using stroke-dasharray */}
              {/* Circumference = 2 * PI * 60 = 377 */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#10b981"
                strokeWidth="20"
                strokeDasharray="181 377"
                strokeDashoffset="0"
              />
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="20"
                strokeDasharray="158 377"
                strokeDashoffset="-181"
              />
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="20"
                strokeDasharray="26 377"
                strokeDashoffset="-339"
              />
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#a855f7"
                strokeWidth="20"
                strokeDasharray="12 377"
                strokeDashoffset="-365"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Total</span>
              <strong className="text-sm font-bold text-white font-mono">100%</strong>
            </div>
          </div>

          {/* CHANNEL PERCENTAGES BREAKDOWN */}
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center p-1.5 bg-[#0a0d12] rounded-lg border border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cash Drawer
              </span>
              <strong className="text-emerald-400">48% (KES 42,900)</strong>
            </div>

            <div className="flex justify-between items-center p-1.5 bg-[#0a0d12] rounded-lg border border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> M-Pesa Buy Goods
              </span>
              <strong className="text-cyan-400">42% (KES 37,500)</strong>
            </div>

            <div className="flex justify-between items-center p-1.5 bg-[#0a0d12] rounded-lg border border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Customer Deni Book
              </span>
              <strong className="text-amber-400">7% (KES 6,250)</strong>
            </div>

            <div className="flex justify-between items-center p-1.5 bg-[#0a0d12] rounded-lg border border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> National ID / OTC Deposit
              </span>
              <strong className="text-purple-300">3% (KES 2,700)</strong>
            </div>
          </div>

        </div>

      </div>

      {/* GRAPH ROW 2: CATEGORY CAPITAL vs PROFIT MARGIN & 14-DAY DISCREPANCY ELIMINATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAPH 3: CAPITAL INVESTED vs GROSS MARGIN BY CATEGORY (DUAL BAR CHART) */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <DollarSign size={15} className="text-emerald-400" /> Capital Invested vs. Gross Profit Margin
              </h3>
              <p className="text-[11px] text-slate-400">
                Wholesale cost vs. locked profit contribution by department.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded bg-slate-600" /> Wholesale Cost
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded bg-emerald-500" /> Profit
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {categories.slice(0, 5).map((cat) => {
              const maxVal = 12000;
              const costPct = (cat.totalCost / maxVal) * 100;
              const profitPct = (cat.profit / maxVal) * 100;

              return (
                <div key={cat.name} className="space-y-1.5 bg-[#0a0d12] p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-white font-sans">{cat.name}</span>
                    <span className="text-[11px] text-slate-300">
                      Cost: <span className="text-slate-400">{currency} {cat.totalCost.toLocaleString()}</span> &bull; Profit: <span className="text-emerald-400 font-bold">+{currency} {cat.profit.toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Dual Bar Comparison */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-slate-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, costPct)}%` }} />
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, profitPct * 4)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAPH 4: 14-DAY DISCREPANCY RESOLUTION CURVE (EVENING BOOKEND AUDIT) */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <ShieldCheck size={16} className="text-cyan-400" /> 14-Day Discrepancy Elimination Curve
              </h3>
              <p className="text-[11px] text-slate-400">
                Reverse-inventory math shrinking unlogged daily counter cash leakage.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
              Balanced: 0 KSh Gap
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <svg viewBox="0 0 460 180" className="w-full h-full overflow-visible font-mono">
              <defs>
                <linearGradient id="discrepancyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Zero Gap Balanced Baseline */}
              <line x1="30" y1="40" x2="440" y2="40" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
              <text x="445" y="44" fill="#10b981" fontSize="9" fontWeight="bold">0 (Balanced)</text>

              {/* Leakage Levels */}
              <line x1="30" y1="80" x2="440" y2="80" stroke="#1e293b" strokeDasharray="2 2" />
              <text x="25" y="84" fill="#64748b" fontSize="8" textAnchor="end">-500</text>

              <line x1="30" y1="120" x2="440" y2="120" stroke="#1e293b" strokeDasharray="2 2" />
              <text x="25" y="124" fill="#64748b" fontSize="8" textAnchor="end">-1000</text>

              <line x1="30" y1="160" x2="440" y2="160" stroke="#1e293b" strokeDasharray="2 2" />
              <text x="25" y="164" fill="#64748b" fontSize="8" textAnchor="end">-1500</text>

              {/* Discrepancy Curve points */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="40,155 70,135 100,118 130,100 160,74 190,64 220,54 250,44 280,40 310,40 340,43 370,40 400,40 430,40"
              />

              {/* Dots */}
              {[
                { x: 40, y: 155, gap: "-1450" },
                { x: 130, y: 100, gap: "-750" },
                { x: 220, y: 54, gap: "-180" },
                { x: 280, y: 40, gap: "0" },
                { x: 370, y: 40, gap: "0" },
                { x: 430, y: 40, gap: "0" }
              ].map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#080e0c" stroke={pt.gap === "0" ? "#10b981" : "#06b6d4"} strokeWidth="2.5" />
                  <text x={pt.x} y={pt.y - 8} fill={pt.gap === "0" ? "#10b981" : "#94a3b8"} fontSize="8" textAnchor="middle">
                    {pt.gap}
                  </text>
                </g>
              ))}

              {/* Bottom label */}
              <text x="240" y="175" fill="#64748b" fontSize="9" textAnchor="middle">
                Past 14 Trading Days &rarr; Cash Gap Shrinkage to Zero
              </text>
            </svg>
          </div>
        </div>

      </div>

      {/* GRAPH ROW 3: HOURLY COUNTER RUSH TRAFFIC & EXPANSION READINESS RUNWAY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAPH 5: HOURLY COUNTER RUSH TRAFFIC (BAR CHART) */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Clock size={15} className="text-amber-400" /> Counter Rush Hours &amp; Customer Foot-Traffic
              </h3>
              <p className="text-[11px] text-slate-400">
                Number of counter sales transactions per hour across trading day.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400">
              Peak: 07:00 &amp; 18:00
            </span>
          </div>

          <div className="h-52 w-full pt-2">
            <svg viewBox="0 0 460 170" className="w-full h-full overflow-visible font-mono">
              <line x1="30" y1="140" x2="450" y2="140" stroke="#334155" />

              {hourlyRush.map((h, idx) => {
                const barWidth = 26;
                const xPos = 40 + idx * 41;
                const barH = (h.count / maxHourly) * 110;
                const yPos = 140 - barH;
                const isPeak = h.count >= 34;

                return (
                  <g key={idx} className="transition-all hover:opacity-80 cursor-pointer">
                    <rect
                      x={xPos}
                      y={yPos}
                      width={barWidth}
                      height={barH}
                      fill={isPeak ? "#f59e0b" : "#3b82f6"}
                      rx="3"
                    />
                    <text
                      x={xPos + barWidth / 2}
                      y={yPos - 4}
                      fill={isPeak ? "#fbbf24" : "#94a3b8"}
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {h.count}
                    </text>
                    <text
                      x={xPos + barWidth / 2}
                      y="154"
                      fill="#64748b"
                      fontSize="8"
                      textAnchor="middle"
                    >
                      {h.hour.slice(0, 2)}h
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="text-[11px] text-slate-400 font-mono text-center">
            Morning peak driven by fresh milk &amp; bread; evening peak driven by 2kg unga &amp; M-Pesa float.
          </div>
        </div>

        {/* GRAPH 6: BRANCH #2 EXPANSION READINESS RUNWAY */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Building2 size={16} className="text-emerald-400" /> Branch #2 Expansion Capital Runway
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30">
                Viability: 56%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Required working capital reserve to open second duka location without risking Branch #1.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-slate-400">Current Capital Accumulated:</span>
              <strong className="text-emerald-400 text-lg">{currency} 84,200</strong>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-[#0a0d12] h-4 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full rounded-full transition-all"
                  style={{ width: "56%" }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>KES 0 Baseline</span>
                <span className="text-amber-400 font-bold">KES 150,000 Target Reserve</span>
              </div>
            </div>

            {/* EXPANSION READINESS CHECKLIST */}
            <div className="p-3 bg-[#0a0d12] rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">CDO Expansion Prerequisites:</span>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>Verified 05:57 AM Morning Bookend float consistency</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>Zero-leakage evening reverse reconciliation (&lt;0.5% variance)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>Wholesale delivery notes mapped to bulk-to-micro packaging</span>
                </div>
                <div className="flex items-center gap-2 text-amber-300">
                  <Clock size={13} />
                  <span>Accumulate KES 65,800 additional buffer (est. 28 days)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Bankable Loan Readiness:</span>
            <span className="text-emerald-400 font-bold">Qualifies for SME Growth Facility</span>
          </div>
        </div>

      </div>

    </div>
  );
}
