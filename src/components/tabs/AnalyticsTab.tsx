import React from "react";
import { BarChart2, TrendingUp, AlertTriangle, PieChart, ShieldAlert } from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";

interface AnalyticsTabProps {
  state: AlacioMasterState;
}

export default function AnalyticsTab({ state }: AnalyticsTabProps) {
  const { currency, inventory, kpis } = state;

  // Category values calculation
  const categoryMap: { [cat: string]: { totalValue: number; count: number } } = {};
  inventory.forEach((item) => {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { totalValue: 0, count: 0 };
    }
    categoryMap[item.category].totalValue += item.total_shelf_value;
    categoryMap[item.category].count += 1;
  });

  const categories = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    totalValue: categoryMap[cat].totalValue,
    count: categoryMap[cat].count
  })).sort((a, b) => b.totalValue - a.totalValue);

  // Velocity days calculation mock
  const stockoutWarnings = [
    { name: "Brookside Fresh Milk 500ml", daysLeft: 1.2, stock: 24, rate: "20 pkts/day", urgent: true },
    { name: "Broadways White Bread 400g", daysLeft: 0.8, stock: 16, rate: "18 loaves/day", urgent: true },
    { name: "Mumias Sugar 1kg", daysLeft: 2.1, stock: 15, rate: "7 pkts/day", urgent: false },
    { name: "Unga Jogoo 2kg", daysLeft: 1.5, stock: 8, rate: "5 bales/day", urgent: true },
    { name: "Rina Vegetable Oil 1L", daysLeft: 3.0, stock: 10, rate: "3 btls/day", urgent: false }
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="text-emerald-400" size={22} /> Tier 3 Data Science: Velocity Curves &amp; Expansion Models
        </h2>
        <p className="text-xs text-slate-400">
          Turnover telemetry, category capital concentration, and predictive AI stockout horizon calculations.
        </p>
      </div>

      {/* TIER 3 DATA SCIENCE PROGRESS STATE: BUILDING YOUR PICTURE */}
      <div className="bg-[#0b1611] border-2 border-amber-500/40 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-300 font-serif flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Tier 3 Data Science Engine: "Building Your Picture" Progress State
            </span>
            <p className="text-xs text-slate-300">
              Predictive models require 30 clean trading days to eliminate statistical noise. 
              Alacio Mini Shop currently has logged <strong>{state.clean_trading_days || 18} of 30 clean trading days</strong>.
            </p>
          </div>
          <span className="text-sm font-mono font-bold text-amber-400 shrink-0">
            {state.clean_trading_days || 18}/30 Days (60%)
          </span>
        </div>

        <div className="w-full bg-[#060c09] h-3 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, ((state.clean_trading_days || 18) / 30) * 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
          <div className="p-2.5 bg-[#060c09] rounded-xl border border-slate-800 text-slate-300">
            <span className="text-emerald-400 font-bold block">✓ Predictive Stockout Horizon</span>
            Active preview based on current FMCG run-rate (Milk, Bread, Unga).
          </div>
          <div className="p-2.5 bg-[#060c09] rounded-xl border border-slate-800 text-slate-300">
            <span className="text-amber-300 font-bold block">⏳ Branch Expansion Readiness Model</span>
            Unlocks automatically at Day 30 to score second-duka capital viability.
          </div>
        </div>
      </div>

      {/* TOP SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Average Shelf Markup
          </span>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
            {kpis.avg_markup_percentage}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Healthy MSME retail margin target is 18-22%
          </span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Catalog Inventory Breadth
          </span>
          <div className="text-3xl font-black font-mono text-white mt-1">
            {inventory.length} Stocked Items
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {categories.length} distinct product categories
          </span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Critical Stockout Risk (&lt; 2 Days)
          </span>
          <div className="text-3xl font-black font-mono text-red-400 mt-1">
            3 High-Velocity Items
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Milk, Bread &amp; Unga require reorder before dusk
          </span>
        </div>
      </div>

      {/* CHART 1: WEEKLY SALES VELOCITY (SVG) & STOCKOUT WARNINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG VELOCITY CURVE */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" /> Weekly Retail Sales Velocity (KSh)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Peak: Friday &amp; Saturday</span>
          </div>

          <div className="h-52 w-full pt-4">
            <svg viewBox="0 0 450 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="velocityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="20" x2="430" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="30" y1="70" x2="430" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="30" y1="120" x2="430" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="30" y1="160" x2="430" y2="160" stroke="#334155" />

              {/* Area */}
              <polygon
                fill="url(#velocityGrad)"
                points="40,140 100,120 160,110 220,130 280,80 340,40 400,60 400,160 40,160"
              />

              {/* Line */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="40,140 100,120 160,110 220,130 280,80 340,40 400,60"
              />

              {/* Data Dots */}
              {[
                { x: 40, y: 140, label: "Mon", val: "8.5k" },
                { x: 100, y: 120, label: "Tue", val: "10.2k" },
                { x: 160, y: 110, label: "Wed", val: "11.1k" },
                { x: 220, y: 130, label: "Thu", val: "9.8k" },
                { x: 280, y: 80, label: "Fri", val: "14.5k" },
                { x: 340, y: 40, label: "Sat", val: "18.2k" },
                { x: 400, y: 60, label: "Sun", val: "16.0k" }
              ].map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#0a0d12" stroke="#10b981" strokeWidth="2.5" />
                  <text x={pt.x} y="175" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {pt.label}
                  </text>
                  <text x={pt.x} y={pt.y - 8} fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {pt.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* PREDICTIVE STOCKOUT WARNING DAYS */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" /> Predictive Stockout Horizon (Days Left)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Run-rate estimate</span>
          </div>

          <div className="space-y-2.5">
            {stockoutWarnings.map((w, idx) => (
              <div key={idx} className="p-3 bg-[#0a0d12] rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="font-semibold text-slate-200 font-sans">{w.name}</div>
                  <div className="text-[10px] text-slate-500">Run rate: {w.rate} &bull; Shelf: {w.stock} left</div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      w.urgent ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {w.daysLeft} Days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY VALUE BREAKDOWN */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
          Capital Concentration by Category
        </h3>
        <div className="space-y-3">
          {categories.map((c) => {
            const pct = kpis.total_active_shelf_retail_value > 0 ? (c.totalValue / kpis.total_active_shelf_retail_value) * 100 : 0;
            return (
              <div key={c.name} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-sans">{c.name} ({c.count} items)</span>
                  <span className="text-white font-bold">{currency} {c.totalValue.toLocaleString()} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-[#0a0d12] h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
