import React, { useState } from "react";
import { 
  Database, 
  BarChart3, 
  BrainCircuit, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Layers, 
  Store, 
  Wrench, 
  Pill, 
  Sparkles,
  X,
  Phone,
  Mail,
  Send,
  Lock,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sliders,
  DollarSign
} from "lucide-react";
import { BlueprintId } from "./TemplateBlueprintView";

interface YuBiFloLandingPageProps {
  onLaunchClientProject: () => void;
  onSelectTemplate: (blueprintId: BlueprintId) => void;
}

export default function YuBiFloLandingPage({ 
  onLaunchClientProject,
  onSelectTemplate 
}: YuBiFloLandingPageProps) {
  const [activeTab, setActiveTab] = useState<BlueprintId>("retail_fmcg");
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditSubmitted, setAuditSubmitted] = useState(false);
  const [auditName, setAuditName] = useState("");
  const [auditPhone, setAuditPhone] = useState("");
  const [auditBusiness, setAuditBusiness] = useState("");
  const [auditSector, setAuditSector] = useState("Retail / Mini-mart");

  const templates: Array<{
    id: BlueprintId;
    title: string;
    icon: React.ReactNode;
    tag: string;
    description: string;
    pipeline: string;
    dashboard: string;
    prediction: string;
  }> = [
    {
      id: "retail_fmcg",
      title: "FMCG Retail Duka",
      icon: <Store className="w-5 h-5 text-emerald-400" />,
      tag: "Empty Blueprint Available",
      description: "Supply-driven reverse accounting engine for high-velocity convenience retail.",
      pipeline: "Restock-triggered auto sales + WhatsApp credit logging",
      dashboard: "Shelf retail value vs. capital invested + cash leakage audit",
      prediction: "Stockout forecasting for fast-depleting perishables (milk, bread, flour)"
    },
    {
      id: "hardware_bulk",
      title: "Construction Hardware",
      icon: <Wrench className="w-5 h-5 text-amber-400" />,
      tag: "Empty Blueprint Available",
      description: "Batch unit conversions and supplier delivery reconciliation for bulk construction goods.",
      pipeline: "OCR supplier bill extraction + multi-unit break bulk tracking (bags to kg)",
      dashboard: "Dead capital identification + high-margin contractor credit aging",
      prediction: "Seasonal construction demand & bulk discount reorder timing"
    },
    {
      id: "pharmacy",
      title: "Community Pharmacy",
      icon: <Pill className="w-5 h-5 text-cyan-400" />,
      tag: "Empty Blueprint Available",
      description: "Batch expiry tracking and prescription-to-cash reconciliation.",
      pipeline: "Barcode batch ingestion + automated distributor invoice matching",
      dashboard: "Expiry risk alerts + daily margin protection report",
      prediction: "Epidemic & weather-driven medicine demand surges"
    }
  ];

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuditSubmitted(true);
    setTimeout(() => {
      setIsAuditModalOpen(false);
      setAuditSubmitted(false);
      setAuditName("");
      setAuditPhone("");
      setAuditBusiness("");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. NAVIGATION BAR */}
      <header className="border-b border-slate-800/80 bg-[#0e1218]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              Y
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wide text-white">YuBiFlo</span>
              <span className="inline-block text-[10px] tracking-widest text-emerald-400/90 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                Data Ecosystems
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#challenge" className="hover:text-white transition">The Challenge</a>
            <a href="#engine" className="hover:text-white transition">3-Tier Engine</a>
            <a href="#templates" className="hover:text-white transition">Industry Templates</a>
            <a href="#portfolio" className="hover:text-white transition">Client Case Studies</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTemplate("retail_fmcg")}
              className="hidden sm:flex px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition items-center gap-1.5 cursor-pointer"
            >
              <Store size={13} className="text-emerald-400" />
              <span>Blueprints</span>
            </button>
            <button 
              onClick={() => setIsAuditModalOpen(true)}
              className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition shadow-md shadow-emerald-500/25 cursor-pointer"
            >
              Book Systems Audit
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (HOOK) */}
      <section className="relative pt-24 pb-20 px-6 border-b border-slate-800/60 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Sparkles size={14} className="text-emerald-400" />
            B2B Data & AI Engineering for African MSMEs
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Stop Losing Money to Pen, Paper, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Rush-Hour Guesswork.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            We build frictionless data ingestion pipelines, automated daily reconciliation dashboards, and predictive inventory AI models tailored to how MSMEs actually transact.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button 
              onClick={() => onSelectTemplate("retail_fmcg")}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95"
            >
              Explore Blueprints <ArrowRight size={16} />
            </button>
            <button 
              onClick={onLaunchClientProject}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm rounded-xl transition text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <Eye size={16} className="text-emerald-400" />
              View Live Client Deployments
            </button>
          </div>

          {/* Micro Telemetry Bar */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> PostgreSQL Row-Level Security
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400" /> Restock-Trigger Auto Sales
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Zero Counter Friction
            </div>
          </div>
        </div>
      </section>

      {/* 3. AGITATION SECTION ("THE OPERATIONAL REALITY") */}
      <section id="challenge" className="py-20 px-6 bg-[#0c1016] border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest font-mono">The Operational Reality</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Why Off-the-Shelf Apps Get Abandoned</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Standard POS tools assume quiet counters and barcode scanners. MSME reality is fast, noisy, and cash-intensive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CARD 1: Counter Friction */}
            <div className="bg-[#121822] border border-slate-800/90 rounded-2xl p-7 space-y-4 shadow-sm hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Counter Friction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When customers are crowding the counter for milk, bread, and sugar at 7:00 PM, nobody has time to search dropdowns and tap "Save Sale." Unrecorded transactions slip away silently.
              </p>
              <div className="text-[11px] font-mono text-red-400/90 pt-2 border-t border-slate-800/80">
                → Result: Paper ledgers pile up or sales get completely forgotten.
              </div>
            </div>

            {/* CARD 2: The Cash Discrepancy Gap */}
            <div className="bg-[#121822] border border-slate-800/90 rounded-2xl p-7 space-y-4 shadow-sm hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Layers size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">The Cash Discrepancy Gap</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Physical drawer cash plus M-Pesa receipts rarely matches shelf stock depletion. Shop owners cannot pinpoint whether missing funds stem from unlogged customer credit, supplier shortfalls, or till theft.
              </p>
              <div className="text-[11px] font-mono text-amber-400/90 pt-2 border-t border-slate-800/80">
                → Result: Hidden capital leakage drains 8% to 15% of net profit.
              </div>
            </div>

            {/* CARD 3: Rigid Software Traps */}
            <div className="bg-[#121822] border border-slate-800/90 rounded-2xl p-7 space-y-4 shadow-sm hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Database size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Rigid Software Traps</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard POS software forces a neighborhood retail duka to act like a corporate supermarket. Hardware stores need broken-bulk unit conversions; pharmacies need batch expiry dates; dukas need rapid restock batching.
              </p>
              <div className="text-[11px] font-mono text-purple-400/90 pt-2 border-t border-slate-800/80">
                → Result: Cashiers stop using the system within two weeks.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SOLUTION SECTION ("THE 3-TIER DATA STACK") */}
      <section id="engine" className="py-20 px-6 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">The 3-Tier Data Stack</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Custom Engineering Designed for How You Operate</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              YuBiFlo replaces fragmented bookkeeping with a seamless, resilient 3-layer architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* TIER 1: DATA ENGINEERING */}
            <div className="bg-[#121822] border border-slate-800 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between shadow-lg hover:border-emerald-500/40 transition">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">TIER 01</span>
                <div className="my-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit text-emerald-400">
                  <Database size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Data Engineering</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Frictionless ingestion pipelines: <strong>Restock-Triggered Auto-Sales</strong>, messy supplier receipt OCR, and ambient Sheng/Swahili voice-to-text logging.
                </p>
              </div>
              <div className="text-[11px] font-mono text-emerald-400/90 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3">
                ✓ Auto-infers sales on restock with zero counter delays
              </div>
            </div>

            {/* TIER 2: DATA ANALYSIS & BI */}
            <div className="bg-[#121822] border border-slate-800 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between shadow-lg hover:border-teal-500/40 transition">
              <div>
                <span className="text-xs font-mono font-bold text-teal-400">TIER 02</span>
                <div className="my-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl w-fit text-teal-400">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Data Analysis &amp; BI</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Real-time active shelf value tracking, gross profit margin locking, and automated end-of-day cash drawer vs. stock depletion reconciliation audits.
                </p>
              </div>
              <div className="text-[11px] font-mono text-teal-400/90 bg-teal-950/20 border border-teal-500/20 rounded-lg p-3">
                ✓ Pinpoints unrecorded credit &amp; till discrepancy
              </div>
            </div>

            {/* TIER 3: DATA SCIENCE & ML */}
            <div className="bg-[#121822] border border-slate-800 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between shadow-lg hover:border-cyan-500/40 transition">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">TIER 03</span>
                <div className="my-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl w-fit text-cyan-400">
                  <BrainCircuit size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Data Science &amp; ML</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Turnover velocity algorithms, predictive reorder deadline forecasting, and multi-branch capital expansion readiness scores.
                </p>
              </div>
              <div className="text-[11px] font-mono text-cyan-400/90 bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-3">
                ✓ Prevents costly stockouts of high-velocity goods
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TEMPLATES SHOWCASE SECTION */}
      <section id="templates" className="py-20 px-6 bg-[#0c1016] border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Level 2 Architecture</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">Empty Industry Blueprints</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              Each blueprint provides a clean, schema-configured engine with 0 products, ready to be previewed or cloned for a new client.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <div 
                key={tpl.id}
                className="bg-[#121822] border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">{tpl.icon}</div>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      {tpl.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{tpl.title}</h3>
                  <p className="text-xs text-slate-400 mb-6">{tpl.description}</p>

                  <div className="space-y-2 text-[11px] font-mono border-t border-slate-800 pt-4 text-slate-300">
                    <div><strong className="text-slate-500 font-sans">Pipeline:</strong> {tpl.pipeline}</div>
                    <div><strong className="text-slate-500 font-sans">BI Dashboard:</strong> {tpl.dashboard}</div>
                    <div><strong className="text-slate-500 font-sans">Data Science:</strong> {tpl.prediction}</div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTemplate(tpl.id)}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-slate-700/80 cursor-pointer shadow-sm"
                >
                  <Eye size={14} /> Preview Template (Empty Blueprint)
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CLIENT PORTFOLIO SECTION (PROJECT LEVEL 3) */}
      <section id="portfolio" className="py-24 px-6 bg-gradient-to-b from-[#0e131b] to-[#0a0d12]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Level 3: Live Client Deployments</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Proven Deployments in the Field</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Real operational systems populated with client operational data. Explore the telemetry, stock valuation, and live reconciliation.
            </p>
          </div>

          {/* PROJECT #1 CARD: ALACIO MINI SHOP */}
          <div className="bg-[#121822] border border-slate-700/80 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
              
              <div className="space-y-6 lg:max-w-xl">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold rounded-full">
                    Project #1: Live Deployment
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Retail / Mini-mart</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Alacio Mini Shop: High-Velocity Retail &amp; Reconciliation Engine
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Deployed for an active estate retail business handling high-frequency micro-purchases across 43 inventory items. YuBiFlo replaced lost manual ledgering with our <strong>Restock-Triggered Sales Engine</strong>.
                </p>

                {/* REAL IMPACT METRIC BADGES */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Active Shelf Value</span>
                    <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">KSh 35,545</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Capital Invested</span>
                    <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">KSh 29,599</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Locked Profit</span>
                    <div className="text-base sm:text-lg font-black text-teal-400 font-mono mt-0.5">KSh 5,945</div>
                    <span className="text-[10px] text-emerald-400 font-mono">20.1% Markup</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={onLaunchClientProject}
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                  >
                    <Eye size={16} /> Launch Live Project Deployment (Real Client Data)
                  </button>
                  <button
                    onClick={() => onSelectTemplate("retail_fmcg")}
                    className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition border border-slate-700 text-center cursor-pointer"
                  >
                    Compare with Empty Template
                  </button>
                </div>
              </div>

              {/* LIVE TELEMETRY MOCKUP CARD */}
              <div className="w-full lg:w-96 bg-[#090d12] border border-slate-800 rounded-2xl p-5 font-mono text-xs space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400 text-[11px]">System Status</span>
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
                    <CheckCircle2 size={12} /> Active Telemetry
                  </span>
                </div>
                <div className="space-y-2.5 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Tenant ID:</span>
                    <span className="font-mono text-slate-400">a0eebc99...0a11</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Pipeline Ingest:</span>
                    <span className="text-emerald-400">Restock Auto-Trigger</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Active Markup:</span>
                    <span>20.1% Average</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Daily Audit:</span>
                    <span className="text-amber-400">±0.00 Discrepancy</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                  PostgreSQL Row-Level Security: <span className="text-emerald-400 font-semibold">ENFORCED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#090d12] py-12 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">YuBiFlo Data Ecosystems</span>
            <span>—</span>
            <span>Engineered for African MSMEs</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => onSelectTemplate("retail_fmcg")} className="hover:text-slate-300 transition">
              Retail Blueprints
            </button>
            <button onClick={() => onSelectTemplate("hardware_bulk")} className="hover:text-slate-300 transition">
              Hardware Blueprints
            </button>
            <button onClick={() => onSelectTemplate("pharmacy")} className="hover:text-slate-300 transition">
              Pharmacy Blueprints
            </button>
            <button onClick={onLaunchClientProject} className="hover:text-emerald-400 transition font-semibold">
              Live Deployment #001
            </button>
          </div>
        </div>
      </footer>

      {/* SYSTEMS AUDIT MODAL */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Book a Systems Architecture Audit</h3>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {auditSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-base font-bold text-white">Audit Request Received!</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  A YuBiFlo systems engineer will inspect your transaction flow and reach out within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAuditSubmit} className="space-y-4 text-xs">
                <p className="text-xs text-slate-400 leading-relaxed">
                  We review your counter bottlenecks, stock depletion patterns, and cash discrepancy gap to blueprint your custom data pipeline.
                </p>
                <div>
                  <label className="text-slate-400 block mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alacio Maina"
                    value={auditName}
                    onChange={(e) => setAuditName(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">WhatsApp or Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +254 712 345 678"
                    value={auditPhone}
                    onChange={(e) => setAuditPhone(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Business Name &amp; Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Alacio Mini Shop, Biashara St"
                    value={auditBusiness}
                    onChange={(e) => setAuditBusiness(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Business Sector</label>
                  <select
                    value={auditSector}
                    onChange={(e) => setAuditSector(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Retail / Mini-mart">Retail Duka / Mini-mart</option>
                    <option value="Hardware / Construction">Construction & Hardware</option>
                    <option value="Pharmacy / Chemist">Community Pharmacy / Chemist</option>
                    <option value="Wholesale & Grain Millers">Wholesale & Grain Millers</option>
                    <option value="Other">Other MSME Sector</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAuditModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    Schedule Free Systems Audit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
