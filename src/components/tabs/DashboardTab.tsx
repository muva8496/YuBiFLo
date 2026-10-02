import React from "react";
import { 
  Package, TrendingUp, AlertTriangle, ArrowRight, 
  Zap, Clock, Scale, Users, CheckCircle2, ShieldCheck, RefreshCw, Mic,
  Building2
} from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";

interface DashboardTabProps {
  state: AlacioMasterState;
  onNavigateTab: (tabId: string) => void;
  onOpenRestock: () => void;
}

export default function DashboardTab({ state, onNavigateTab, onOpenRestock }: DashboardTabProps) {
  const { kpis, currency, inventory, customers, cash_register_balance, floatDenominations, warehouse } = state;
  const floatTotal = floatDenominations.reduce((acc, d) => acc + d.value * d.count, 0);
  const totalDebt = customers.reduce((acc, c) => acc + c.debt_balance, 0);
  const whBulkVal = warehouse?.reduce((acc, b) => acc + (b.bulk_quantity * b.bulk_cost_per_unit), 0) || 0;
  const lowStockItems = inventory.filter((item) => item.current_stock <= 5);
  const highVelocityItems = inventory.filter((item) => item.velocity_badge === "High Velocity");

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="text-emerald-400" size={22} /> Alacio Mini Shop Telemetry
          </h2>
          <p className="text-xs text-slate-400">
            Real-time shelf value, invested wholesale capital, velocity triggers, and daily retail cash control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab("voice_ledger")}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Mic size={14} /> Voice Ingest
          </button>
          <button
            onClick={onOpenRestock}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <RefreshCw size={14} /> Restock Batch
          </button>
        </div>
      </div>

      {/* 3 TOP KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Total Active Shelf Retail Value
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-400 font-mono tracking-tight">
            {currency} {kpis.total_active_shelf_retail_value.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" />
            Across {kpis.total_active_items} active stocked FMCG items
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Total Capital Invested (Cost Price)
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-white font-mono tracking-tight">
            {currency} {kpis.total_capital_invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Wholesale cash out tied in active shelf batches
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Locked-in Potential Gross Profit
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-teal-400 font-mono tracking-tight">
            {currency} {kpis.locked_in_potential_gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 font-medium">
            Avg markup: {kpis.avg_markup_percentage}% across catalog
          </p>
        </div>
      </div>

      {/* SECONDARY ROW: DRAWER CASH & DEBT BOOK & WAREHOUSE QUICK TELEMETRY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#121822] border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-700 transition" onClick={() => onNavigateTab("warehouse")}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5"><Building2 size={14} className="text-emerald-400" /> Backroom Warehouse</span>
            <ArrowRight size={13} />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1.5">{currency} {whBulkVal.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">{warehouse?.length || 0} bulk stock batches</span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-700 transition" onClick={() => onNavigateTab("opening_float")}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-400" /> Morning Opening Float</span>
            <ArrowRight size={13} />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1.5">{currency} {floatTotal.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">Denomination verified</span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-700 transition" onClick={() => onNavigateTab("reconciliation")}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5"><Scale size={14} className="text-emerald-400" /> Register Cash Count</span>
            <ArrowRight size={13} />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1.5">{currency} {cash_register_balance.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">Physical drawer estimated</span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-700 transition" onClick={() => onNavigateTab("customers")}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5"><Users size={14} className="text-purple-400" /> Outstanding Deni (Credit)</span>
            <ArrowRight size={13} />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300 mt-1.5">{currency} {totalDebt.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">{customers.length} registered debtors</span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-700 transition" onClick={() => onNavigateTab("quick_dump")}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5"><Zap size={14} className="text-cyan-400" /> Quick Counter Dump</span>
            <ArrowRight size={13} />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1.5">Fast Drop</div>
          <span className="text-[10px] text-slate-500">Instant rush-hour logging</span>
        </div>
      </div>

      {/* BATCH VELOCITY ALERTS & RECENT SALES TICKER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LOW STOCK & REORDER TRIGGERS */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" /> Batch Restock Triggers ({lowStockItems.length})
            </h3>
            <button onClick={() => onNavigateTab("inventory")} className="text-[11px] text-emerald-400 hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {lowStockItems.slice(0, 4).map((item) => (
              <div key={item.id} className="p-3 bg-[#0a0d12] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{item.name}</div>
                  <div className="text-[10px] text-slate-500">{item.category} &bull; Cost: {currency} {item.unit_cost}</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    {item.current_stock} {item.unit_type} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HIGH VELOCITY MOVERS */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-400" /> High Velocity Movers ({highVelocityItems.length})
            </h3>
            <button onClick={() => onNavigateTab("analytics")} className="text-[11px] text-emerald-400 hover:underline">
              Analytics
            </button>
          </div>
          <div className="space-y-2">
            {highVelocityItems.slice(0, 4).map((item) => (
              <div key={item.id} className="p-3 bg-[#0a0d12] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{item.name}</div>
                  <div className="text-[10px] text-emerald-400">+{currency} {item.expected_margin} margin/unit</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-white font-bold">{currency} {item.total_shelf_value.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">{item.current_stock} on shelf</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
