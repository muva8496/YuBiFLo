import React, { useState } from "react";
import { 
  Building2, ArrowRight, ShieldCheck, Sparkles, Database, 
  BarChart3, BrainCircuit, Store, Check, Plus, Lock, 
  ChevronRight, ArrowUpDown, Filter, HelpCircle, BarChart2,
  Cpu, Zap, Layers, RefreshCw, Smartphone, TrendingUp,
  AlertTriangle, DollarSign, Users, Scale, Sun, Package,
  FileText, Activity, ShieldAlert, CheckCircle2, ChevronDown,
  Terminal, Globe
} from "lucide-react";
import { AlacioMasterState } from "../types/alacio";
import WaveAppsExecutiveDashboard from "./WaveAppsExecutiveDashboard";

interface YuBiFloEnterpriseCommandProps {
  alacioState: AlacioMasterState;
  onLaunchAlacioShop: () => void;
  onOpenDataLab: () => void;
  onOpenBlueprints: () => void;
}

export default function YuBiFloEnterpriseCommand({
  alacioState,
  onLaunchAlacioShop,
  onOpenDataLab,
  onOpenBlueprints
}: YuBiFloEnterpriseCommandProps) {
  const [pipelineStep, setPipelineStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"wave_dashboards" | "fleet" | "pipeline" | "macro_intel">("wave_dashboards");

  // Calculate live Alacio metrics
  const totalStockValue = alacioState.inventory.reduce((acc, i) => acc + (i.unit_retail * i.current_stock), 0);
  const totalDebtors = alacioState.customers.reduce((acc, c) => acc + c.debt_balance, 0);
  const totalSuppliersOwed = (alacioState.suppliers || []).reduce((acc, s) => acc + (s.total_orders_cost || 0), 0);
  const cashAtHand = alacioState.cash_register_balance || 8000;

  return (
    <div className="min-h-full pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 pt-6">
      
      {/* ========================================================= */}
      {/* 1. SOVEREIGN YUBIFLO PLATFORM MASTHEAD                    */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121214] via-[#0a0a0c] to-[#000000] border border-zinc-700 p-6 sm:p-8 shadow-2xl shadow-black/80">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-white animate-pulse shadow-md shadow-white/30" />
              <div className="px-3 py-1 rounded-full bg-zinc-800 text-white font-mono text-xs font-bold border border-zinc-700 tracking-wider">
                YUBIFLO &bull; SOVEREIGN ENTERPRISE OS
              </div>
              <span className="text-xs font-mono text-amber-300/90 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                0-Drift Micro-Enterprise Engine
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-serif tracking-tight leading-tight">
              YuBiFLo Sovereign Platform
            </h1>
            
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              <strong className="text-white font-serif italic">"Your Business Is A Flower"</strong> — Built to do the heavy mathematical and data engineering lifting for African MSMEs. We turn messy counters, unrecorded chalk debts, and chaotic milk supplies into bulletproof financial ledgers and predictive supply pipelines.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <Database size={13} className="text-cyan-400" />
                Raw-to-Ledger ETL Active
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <ShieldCheck size={13} className="text-white" />
                Double-Entry 3-Pillar Accounts
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <TrendingUp size={13} className="text-amber-400" />
                Supply-Driven Velocity Math
              </span>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={onLaunchAlacioShop}
              className="px-5 py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white border border-zinc-700 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/50 transition cursor-pointer group"
            >
              <span>Launch Alacio Flagship</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenDataLab}
              className="px-5 py-3 rounded-2xl bg-[#18181b] hover:bg-[#27272a] text-zinc-200 border border-zinc-700 text-xs font-bold font-mono flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Cpu size={15} className="text-white" />
              <span>Data Engineering Lab & Schemas</span>
            </button>
          </div>
        </div>

        {/* Global Network High-Level Telemetry */}
        <div className="mt-8 pt-6 border-t border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="bg-[#000000]/80 rounded-xl p-3 border border-zinc-800">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Ecosystem GMV</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
              KSh 1,482,500
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">Live across 4 nodes</div>
          </div>

          <div className="bg-[#000000]/80 rounded-xl p-3 border border-zinc-800">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Catalog SKUs Ingested</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-cyan-300 mt-0.5">
              {alacioState.inventory.length + 185} Items
            </div>
            <div className="text-[10px] text-cyan-500/80 mt-0.5 font-mono">Full FMCG & Hardware Index</div>
          </div>

          <div className="bg-[#000000]/80 rounded-xl p-3 border border-zinc-800">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Aggregate Khata (Deni)</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-purple-300 mt-0.5">
              KSh {(totalDebtors + 48200).toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-400/80 mt-0.5 font-mono">Personal Ledger Tracked</div>
          </div>

          <div className="bg-[#000000]/80 rounded-xl p-3 border border-zinc-800">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Ledger Precision & Drift</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-zinc-200 mt-0.5">
              0.00% Drift
            </div>
            <div className="text-[10px] text-white mt-0.5 font-mono">Mathematical Sovereignty</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. NAVIGATION TABS: WAVEAPPS DASHBOARD vs FLEET vs PIPELINE vs MACRO INTEL */}
      {/* ========================================================= */}
      <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("wave_dashboards")}
          className={`pb-3 px-4 text-sm font-semibold transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "wave_dashboards"
              ? "border-white text-zinc-200 bg-zinc-800/60 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 size={16} className="text-white" />
          <span className="font-bold">Executive Financial Dashboard (Customer Center)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-white font-mono">White Trust</span>
        </button>

        <button
          onClick={() => setActiveTab("fleet")}
          className={`pb-3 px-4 text-sm font-semibold transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "fleet"
              ? "border-white text-zinc-200"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building2 size={16} />
          <span>Sovereign MSME Fleet Grid (4 Nodes)</span>
        </button>

        <button
          onClick={() => setActiveTab("pipeline")}
          className={`pb-3 px-4 text-sm font-semibold transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "pipeline"
              ? "border-white text-zinc-200"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu size={16} />
          <span>YuBiFLo Heavy-Lifting Data Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab("macro_intel")}
          className={`pb-3 px-4 text-sm font-semibold transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "macro_intel"
              ? "border-white text-zinc-200"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart2 size={16} />
          <span>Macro Data Science &amp; Bloom Engine</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 0: WAVEAPPS SOVEREIGN DASHBOARD (CENTRE OF WHAT WE SELL) */}
      {/* ========================================================= */}
      {activeTab === "wave_dashboards" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-[#121214] border border-zinc-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center font-bold">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-serif">
                  The Product We Deliver: Executive Financial Command (White Trust Edition)
                </h3>
                <p className="text-xs text-slate-300">
                  Behind the scenes, YuBiFLo does all the chaotic data pipelining, voice transcribing, and OCR receipt ingestion. At the centre of what the customer enjoys is this pristine, trustworthy financial command center.
                </p>
              </div>
            </div>

            <button
              onClick={onLaunchAlacioShop}
              className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white border border-zinc-700 font-black text-xs transition flex items-center gap-2 cursor-pointer font-mono shrink-0 shadow-md"
            >
              <span>Operate Live Shop Counter</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <WaveAppsExecutiveDashboard
            state={alacioState}
            onNavigateTab={(tab) => {
              onLaunchAlacioShop();
            }}
            onSwitchToYuBiFlo={() => setActiveTab("fleet")}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB A: SOVEREIGN MSME FLEET GRID                          */}
      {/* ========================================================= */}
      {activeTab === "fleet" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">
                Multi-Enterprise Sovereign Fleet
              </h2>
              <p className="text-xs text-slate-400">
                Operating retail nodes powered by YuBiFLo data pipelines. Switch into any node to inspect real-time ledgers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenBlueprints}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                View Catalog Blueprints
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* NODE 001: ALACIO MINI SHOP (THE GAMMA & SIGMA FLAGSHIP) */}
            <div className="relative rounded-3xl bg-gradient-to-br from-[#121214] to-[#09090b] border border-zinc-700 p-6 shadow-xl flex flex-col justify-between group overflow-hidden">
              
              {/* Sigma / Gamma Emblem */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-white font-bold border border-zinc-700">
                  LIVE ACTIVE &bull; NODE 001
                </span>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white border border-zinc-700 font-black font-serif text-xl flex items-center justify-center shadow-lg">
                    A
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white font-serif flex items-center gap-2">
                      {alacioState.merchant_name || "Retail Pro Store"}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                        RETAIL PILOT &bull; NODE 001
                      </span>
                      <span className="text-xs text-slate-400">Kasarani / Hunters, Nairobi</span>
                    </div>
                  </div>
                </div>

                {/* Operational Archetype */}
                <div className="bg-[#050c08] border border-zinc-800 rounded-xl p-3 my-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                    <span>OPERATIONAL ARCHETYPE:</span>
                    <span className="text-amber-300 text-[11px]">Cold Mathematical Precision</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    <strong>Disciplined Execution:</strong> Solitary operator, silent execution, zero emotional cash drift. Credit (Deni) is tracked with relentless accountability via instant WhatsApp settlement.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    <strong>Retail Precision:</strong> 21-pack Mt. Kenya milk crates decomposed to individual velocity formulas, 05:57 AM dawn lock, and double-entry 3-pillar accounts with zero notebook reliance.
                  </p>
                </div>

                {/* Node Live Numbers */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-2">
                  <div className="bg-[#0c0c0e] p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-slate-400 block">Shelf SKUs</span>
                    <span className="text-sm font-bold text-zinc-200">{alacioState.inventory.length} FMCG</span>
                  </div>
                  <div className="bg-[#0c0c0e] p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-slate-400 block">Deni Owed</span>
                    <span className="text-sm font-bold text-purple-300">KSh {totalDebtors.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#0c0c0e] p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-slate-400 block">Cash Float</span>
                    <span className="text-sm font-bold text-amber-300">KSh {cashAtHand.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-mono text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Equity Paybill 1450180372031 Synced
                </span>
                <button
                  onClick={onLaunchAlacioShop}
                  className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white border border-zinc-700 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md font-mono"
                >
                  <span>Enter Store Node</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* NODE 002: WEMA WHOLESALE & COMMODITY DEPOT */}
            <div className="rounded-3xl bg-[#0a131b] border-2 border-cyan-500/30 hover:border-cyan-500/50 p-6 shadow-xl flex flex-col justify-between group transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 font-black font-serif text-xl flex items-center justify-center border border-cyan-500/30">
                      W
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white font-serif">
                        Wema Wholesale &amp; Grain Depots
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
                          BULK COMMODITY HUB
                        </span>
                        <span className="text-xs text-slate-400">Gikomba &bull; Kariobangi, Nairobi</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    STAGED NODE
                  </span>
                </div>

                <div className="bg-[#050b11] border border-cyan-950 rounded-xl p-3 my-4 space-y-1.5 text-xs text-slate-300">
                  <div className="font-mono text-cyan-300 font-bold text-[11px]">BULK SUPPLY ARCHITECTURE:</div>
                  <p>Handles 90-bag truck delivery manifests, 14-day distributor credit books, and automated grain shrinkage formulas.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-2">
                  <div className="bg-[#071018] p-2.5 rounded-lg border border-cyan-950">
                    <span className="text-[10px] text-slate-400 block">Depot Volume</span>
                    <span className="text-sm font-bold text-cyan-300">340 Bags</span>
                  </div>
                  <div className="bg-[#071018] p-2.5 rounded-lg border border-cyan-950">
                    <span className="text-[10px] text-slate-400 block">Credit Terms</span>
                    <span className="text-sm font-bold text-purple-300">14-Day Cycle</span>
                  </div>
                  <div className="bg-[#071018] p-2.5 rounded-lg border border-cyan-950">
                    <span className="text-[10px] text-slate-400 block">Turnover</span>
                    <span className="text-sm font-bold text-amber-300">KSh 342,000</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-cyan-950 flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400">
                  Bulk Supply Pipeline Configured
                </span>
                <button
                  onClick={onOpenBlueprints}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer font-mono"
                >
                  <span>Inspect Blueprint</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* NODE 003: KILIMANI FRESH AGROVET & DAIRY */}
            <div className="rounded-3xl bg-[#14121b] border-2 border-purple-500/30 hover:border-purple-500/50 p-6 shadow-xl flex flex-col justify-between group transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 font-black font-serif text-xl flex items-center justify-center border border-purple-500/30">
                      K
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white font-serif">
                        Kilimani Fresh Agrovet &amp; Dairy
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30">
                          PERISHABLE &amp; AGRO INPUTS
                        </span>
                        <span className="text-xs text-slate-400">Nairobi West &bull; Langata</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    STAGED NODE
                  </span>
                </div>

                <div className="bg-[#090710] border border-purple-950 rounded-xl p-3 my-4 space-y-1.5 text-xs text-slate-300">
                  <div className="font-mono text-purple-300 font-bold text-[11px]">COLD-CHAIN &amp; EXPIRY ENGINE:</div>
                  <p>Batch tracking for veterinary medicine, cold-chain dairy cooler intake meters, and farm gate milk payment vouchers.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-2">
                  <div className="bg-[#0e0c18] p-2.5 rounded-lg border border-purple-950">
                    <span className="text-[10px] text-slate-400 block">Agro SKUs</span>
                    <span className="text-sm font-bold text-purple-300">62 Lines</span>
                  </div>
                  <div className="bg-[#0e0c18] p-2.5 rounded-lg border border-purple-950">
                    <span className="text-[10px] text-slate-400 block">Expiry Watch</span>
                    <span className="text-sm font-bold text-rose-300">0 Bleed</span>
                  </div>
                  <div className="bg-[#0e0c18] p-2.5 rounded-lg border border-purple-950">
                    <span className="text-[10px] text-slate-400 block">Turnover</span>
                    <span className="text-sm font-bold text-amber-300">KSh 189,500</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-950 flex items-center justify-between">
                <span className="text-xs font-mono text-purple-400">
                  Agrovet Pipeline Calibrated
                </span>
                <button
                  onClick={onOpenBlueprints}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer font-mono"
                >
                  <span>Inspect Blueprint</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* NODE 004: BOMA HARDWARE & BUILDING SUPPLIES */}
            <div className="rounded-3xl bg-[#18130e] border-2 border-amber-500/30 hover:border-amber-500/50 p-6 shadow-xl flex flex-col justify-between group transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 font-black font-serif text-xl flex items-center justify-center border border-amber-500/30">
                      B
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white font-serif">
                        Boma Hardware &amp; Electrical
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                          CONTRACTOR CREDIT &amp; BULK
                        </span>
                        <span className="text-xs text-slate-400">Thika Superhighway &bull; Ruiru</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    STAGED NODE
                  </span>
                </div>

                <div className="bg-[#0d0905] border border-amber-950 rounded-xl p-3 my-4 space-y-1.5 text-xs text-slate-300">
                  <div className="font-mono text-amber-300 font-bold text-[11px]">BUILDING LEDGER ENGINE:</div>
                  <p>Dimension calculations (iron sheets, rebar, timber feet), contractor project credit escrow, and cement manifest audit.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-2">
                  <div className="bg-[#120e07] p-2.5 rounded-lg border border-amber-950">
                    <span className="text-[10px] text-slate-400 block">Catalog</span>
                    <span className="text-sm font-bold text-amber-300">120 Heavy SKUs</span>
                  </div>
                  <div className="bg-[#120e07] p-2.5 rounded-lg border border-amber-950">
                    <span className="text-[10px] text-slate-400 block">Site Credit</span>
                    <span className="text-sm font-bold text-purple-300">KSh 48,200</span>
                  </div>
                  <div className="bg-[#120e07] p-2.5 rounded-lg border border-amber-950">
                    <span className="text-[10px] text-slate-400 block">Turnover</span>
                    <span className="text-sm font-bold text-zinc-200">KSh 812,000</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-amber-950 flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400">
                  Hardware Pipeline Ready
                </span>
                <button
                  onClick={onOpenBlueprints}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer font-mono"
                >
                  <span>Inspect Blueprint</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB B: YUBIFLO HEAVY-LIFTING DATA PIPELINE                */}
      {/* ========================================================= */}
      {activeTab === "pipeline" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">
                YuBiFLo Autonomous Data Engineering Engine
              </h2>
              <p className="text-xs text-slate-400">
                How YuBiFLo performs the heavy lifting: raw multi-modal ingestion, automated ETL, canonical normalization, and 3-pillar ledger accounting.
              </p>
            </div>

            <button
              onClick={onOpenDataLab}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono transition flex items-center gap-1.5 self-start cursor-pointer"
            >
              <Cpu size={14} /> Open Architecture Schemas &amp; Fallbacks
            </button>
          </div>

          {/* Interactive 4-Stage Pipeline Walkthrough */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* STAGE 1 */}
            <div 
              onClick={() => setPipelineStep(1)}
              className={`rounded-2xl p-5 border-2 transition cursor-pointer ${
                pipelineStep === 1 
                  ? "bg-[#121214] border-white shadow-lg shadow-black/80" 
                  : "bg-zinc-950 border-zinc-800/60 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-white mb-2">
                <span>STAGE 01</span>
                <span className="w-2 h-2 rounded-full bg-white" />
              </div>
              <h3 className="text-base font-bold text-white font-serif">
                Multi-Modal Ingestion
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Raw audio transcripts, camera thermal receipts, Paybill webhook packets, and manual counter voice dumps.
              </p>
              <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] font-mono text-white font-semibold">
                Input: Audio/Image/JSON
              </div>
            </div>

            {/* STAGE 2 */}
            <div 
              onClick={() => setPipelineStep(2)}
              className={`rounded-2xl p-5 border-2 transition cursor-pointer ${
                pipelineStep === 2 
                  ? "bg-[#0b1b1d] border-cyan-400 shadow-lg shadow-cyan-950/60" 
                  : "bg-[#081114] border-cyan-950/60 hover:border-cyan-800"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 mb-2">
                <span>STAGE 02</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white font-serif">
                Supply Velocity &amp; ETL
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                21-pack crate normalization, reverse milk sales extraction, owner consumption filtering, and gap detection.
              </p>
              <div className="mt-4 pt-3 border-t border-cyan-950 text-[11px] font-mono text-cyan-400 font-semibold">
                Logic: Reverse Inventory
              </div>
            </div>

            {/* STAGE 3 */}
            <div 
              onClick={() => setPipelineStep(3)}
              className={`rounded-2xl p-5 border-2 transition cursor-pointer ${
                pipelineStep === 3 
                  ? "bg-[#181324] border-purple-400 shadow-lg shadow-purple-950/60" 
                  : "bg-[#0e0a17] border-purple-950/60 hover:border-purple-800"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-400 mb-2">
                <span>STAGE 03</span>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <h3 className="text-base font-bold text-white font-serif">
                3-Pillar Ledger Settlement
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Personal (Debtors/Creditors), Real (Cash/Stock/Float), and Nominal (Revenue/Expenses) double-entry balances.
              </p>
              <div className="mt-4 pt-3 border-t border-purple-950 text-[11px] font-mono text-purple-400 font-semibold">
                Truth: Strict Zero-Drift
              </div>
            </div>

            {/* STAGE 4 */}
            <div 
              onClick={() => setPipelineStep(4)}
              className={`rounded-2xl p-5 border-2 transition cursor-pointer ${
                pipelineStep === 4 
                  ? "bg-[#1b170c] border-amber-400 shadow-lg shadow-amber-950/60" 
                  : "bg-[#110e07] border-amber-950/60 hover:border-amber-800"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 mb-2">
                <span>STAGE 04</span>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white font-serif">
                Predictive Bloom Engine
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Stockout early-warning, debtor default probability scoring, dawn float baseline validation, and auto-orders.
              </p>
              <div className="mt-4 pt-3 border-t border-amber-950 text-[11px] font-mono text-amber-400 font-semibold">
                Output: Actionable Growth
              </div>
            </div>

          </div>

          {/* Deep Dive Panel Based on Selected Step */}
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
            {pipelineStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold">
                  <Terminal size={14} />
                  STAGE 01 DEEP DIVE: INGESTION PIPELINE (VOICE + OCR + WEBHOOKS)
                </div>
                <h3 className="text-xl font-bold text-white font-serif">
                  Zero Keystroke Data Capture
                </h3>
                <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Counter merchants cannot type during peak morning rushes. YuBiFLo accepts audio clips via the Voice Ledger ("Habari, Mama Njoroge kachukua packet mbili za maziwa na unga ya Jogoo kwa deni..."). The ingestion service transcribes Swahili and Sheng vernacular, parses named entities, and writes structured records with zero operator effort.
                </p>
                <div className="bg-[#050c08] rounded-xl p-4 border border-zinc-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  <div className="text-slate-500">// Ingestion Sample Schema</div>
                  <div>&#123; "event_id": "ingest_88492", "source": "voice_vcr", "raw_audio_duration_sec": 4.2, "confidence": 0.98, "detected_debtor": "Mama Njoroge", "matched_sku": "Mt Kenya 500ml", "qty": 2, "ledger_target": "personal_debtors" &#125;</div>
                </div>
              </div>
            )}

            {pipelineStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                  <Terminal size={14} />
                  STAGE 02 DEEP DIVE: REVERSE INVENTORY &amp; SUPPLY VELOCITY
                </div>
                <h3 className="text-xl font-bold text-white font-serif">
                  Supply As The Source Of Truth For Sales
                </h3>
                <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                  In fast-moving retail, counting every single piece sold is humanly impossible. But supply is absolute: When a supplier drops a 21-pack crate of Mt. Kenya milk at 06:15 AM and 16 packets leave the shelf by 02:00 PM (with 2 pieces consumed by the owner for chai), YuBiFLo uses the arrival of the NEXT box to mathematically deduce exact sales velocity, revenue, and COGS without requiring the merchant to scan 21 individual bar codes!
                </p>
                <div className="bg-[#050c08] rounded-xl p-4 border border-cyan-950/80 font-mono text-xs text-slate-300 overflow-x-auto">
                  <div className="text-cyan-400">// Reverse Velocity Formula in Production</div>
                  <div>SalesUnits = PreviousBatchStock (21) - ShelfRemnant (3) - OwnerConsumption (2) = 16 Sold</div>
                  <div>RevenueGenerated = 16 * RetailPrice (65) = KSh 1,040</div>
                  <div>WholesaleCost = 16 * UnitCost (55) = KSh 880 &bull; Net Profit = KSh 160</div>
                </div>
              </div>
            )}

            {pipelineStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold">
                  <Terminal size={14} />
                  STAGE 03 DEEP DIVE: 3-PILLAR DOUBLE-ENTRY LEDGER
                </div>
                <h3 className="text-xl font-bold text-white font-serif">
                  Personal, Real, and Nominal Ledger Settlement
                </h3>
                <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                  No co-mingling. YuBiFLo divides every coin into classical accounting pillars hardened for African micro-enterprises:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#06040c] p-3 rounded-xl border border-purple-900/40">
                    <strong className="text-purple-300 block mb-1">1. Personal Accounts</strong>
                    Debtors (Mama Njoroge, Kamau) and Creditors (Brookside, Unga Ltd). WhatsApp reminder automation.
                  </div>
                  <div className="bg-[#06040c] p-3 rounded-xl border border-purple-900/40">
                    <strong className="text-cyan-300 block mb-1">2. Real Accounts</strong>
                    Physical and tangible assets: Cash drawer till, Equity Paybill float, M-Pesa float, and bulk shelf stock.
                  </div>
                  <div className="bg-[#06040c] p-3 rounded-xl border border-purple-900/40">
                    <strong className="text-amber-300 block mb-1">3. Nominal Accounts</strong>
                    Revenue from counter trade, cost of goods sold, rent, power, and owner personal drawings (chai/lunch).
                  </div>
                </div>
              </div>
            )}

            {pipelineStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
                  <Terminal size={14} />
                  STAGE 04 DEEP DIVE: PREDICTIVE BLOOM &amp; WORKING CAPITAL
                </div>
                <h3 className="text-xl font-bold text-white font-serif">
                  Your Business Blooms Through Predictive Signal
                </h3>
                <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Instead of letting shelves run dry or tying up precious capital in slow-moving stock, the Bloom Engine calculates depletion curves, alerts the shopkeeper before stockouts occur, and recommends exact wholesale purchase quantities based on historical cash flow and debtor settlement rates.
                </p>
                <div className="bg-[#050c08] rounded-xl p-4 border border-amber-950/80 font-mono text-xs text-slate-300">
                  <div className="text-amber-300">// Active Intelligence Telemetry</div>
                  <div>&bull; Jogoo Unga 2kg: Depletion rate 8.4 packs/day &rarr; Recommended reorder: 1 bale tomorrow 07:00 AM</div>
                  <div>&bull; Mt Kenya 500ml: Velocity 21 packs/36 hours &rarr; Trigger automated restock order</div>
                  <div>&bull; Debtor Recovery Health: 87.2% collected within 7 days</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB C: MACRO DATA SCIENCE & BLOOM ENGINE                  */}
      {/* ========================================================= */}
      {activeTab === "macro_intel" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">
                Macro Data Science &amp; Business Blooming
              </h2>
              <p className="text-xs text-slate-400">
                Cross-enterprise patterns, seasonal retail demand, and micro-loan readiness intelligence.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0b1612] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-white">
                <span>RADAR 01</span>
                <Sparkles size={14} />
              </div>
              <h3 className="text-lg font-bold text-white font-serif">Capital Efficiency Score</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Retail FMCG Pilot maintains an impressive <strong>94/100</strong> capital health rating. Shelf stock turns over every 4.2 days with zero phantom shrinkage.
              </p>
              <div className="pt-2 text-[11px] font-mono text-white">
                Grade: A+ (Sovereign Certified)
              </div>
            </div>

            <div className="bg-[#0b1612] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                <span>RADAR 02</span>
                <Activity size={14} />
              </div>
              <h3 className="text-lg font-bold text-white font-serif">Dawn-to-Dusk Cash Fidelity</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                05:57 AM float locks prevent co-mingling of personal pocket cash with shop float. Evening reconciliation catches 100% of owner drawings for lunch and chai.
              </p>
              <div className="pt-2 text-[11px] font-mono text-cyan-400">
                Fidelity: 100% Drawer Match
              </div>
            </div>

            <div className="bg-[#0b1612] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-purple-400">
                <span>RADAR 03</span>
                <Users size={14} />
              </div>
              <h3 className="text-lg font-bold text-white font-serif">Debtor Risk Index</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Across {alacioState.customers.length} registered debtors, total credit exposure is strictly capped at KSh 1,930 (below the 5% monthly revenue risk threshold).
              </p>
              <div className="pt-2 text-[11px] font-mono text-purple-400">
                Risk Status: Safe &bull; Low Default
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 border border-zinc-700 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white font-serif">
                Ready to operate Retail Store Workspace?
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Enter the live retail counter workspace to record sales, collect WhatsApp deni, restock wholesale crates, or run dawn cash baselines.
              </p>
            </div>
            <button
              onClick={onLaunchAlacioShop}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white border border-zinc-700 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer font-mono shrink-0 shadow-lg"
            >
              <span>Enter Protected Workspace</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
