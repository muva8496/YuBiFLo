import React from "react";
import { 
  Building2, ArrowRight, ShieldCheck, Sparkles, AlertTriangle, 
  Layers, Database, BarChart3, BrainCircuit, CheckCircle2, 
  Store, Wrench, Truck, Pill, Eye, ChevronRight, Lock
} from "lucide-react";
import { Blueprint, ProjectCaseStudy } from "../types/alacio";

interface HomeScreenDiamondsProps {
  blueprints: Blueprint[];
  projectCaseStudy: ProjectCaseStudy;
  onSelectBlueprint: (blueprintId: string) => void;
  onOpenProjectCaseStudy: () => void;
}

export default function HomeScreenDiamonds({
  blueprints,
  projectCaseStudy,
  onSelectBlueprint,
  onOpenProjectCaseStudy
}: HomeScreenDiamondsProps) {
  return (
    <div className="space-y-20 pb-16">
      
      {/* 1. HERO WITH YUBIFLO IN ROUNDED BOX & TWO DIAMOND ENTRY POINTS */}
      <section className="relative pt-12 sm:pt-16 pb-12 px-4 sm:px-6 text-center max-w-5xl mx-auto">
        
        {/* YUBIFLO NAME IN ROUNDED BOX AT THE TOP */}
        <div className="inline-flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl bg-[#0d1e17] border-2 border-[#1FB88E]/40 shadow-xl shadow-emerald-950/40 mb-6 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-2xl sm:text-3xl font-black text-white tracking-widest font-mono">
              YuBiFLo
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              KENYA MSME CDO
            </span>
          </div>
          <span className="text-xs font-serif italic text-amber-300/90 tracking-wide">
            "Your Business Is A Flower" &bull; Protecting the Owner's Financial Health
          </span>
        </div>

        {/* HERO TITLE & VALUE PROPOSITION */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] font-serif max-w-4xl mx-auto">
          No notebooks.<br />
          No typing.<br />
          Just <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">know your numbers</span>.
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
          Standard POS and accounting apps fail because shop owners cannot type hundreds of small sales during rush hour. YuBiFLo uses voice conversation recording, daily float audits, and restock triggers to protect your cash and capital automatically.
        </p>

        {/* ======================================================== */}
        {/* TWO DIAMOND ENTRY POINTS: TEMPLATES (LEFT) & PROJECTS (RIGHT) */}
        {/* ======================================================== */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
          
          {/* DIAMOND ENTRY 1: TEMPLATES (LEFT) */}
          <div 
            onClick={() => {
              const target = document.getElementById("templates-section");
              target?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative bg-[#0f1d18] border-2 border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-7 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/60 cursor-pointer overflow-hidden flex flex-col justify-between"
          >
            {/* Diamond Badge */}
            <div className="absolute top-4 right-4 w-9 h-9 rotate-45 bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center group-hover:bg-emerald-400 group-hover:text-slate-950 transition-colors">
              <span className="-rotate-45 font-mono text-[11px] font-black text-emerald-400 group-hover:text-slate-950">
                ◆
              </span>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                <Store size={14} /> Entry Point 1 &bull; Blueprints
              </div>
              <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors font-serif">
                Templates &amp; Industry Blueprints
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Pre-engineered data schemas for Retail Dukas, Hardware stores, Wholesale distributors, and Pharmacies. Ready to clone in seconds.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold pt-4 border-t border-slate-800">
              <span>Explore 4 Blueprints</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* DIAMOND ENTRY 2: PROJECTS (RIGHT) */}
          <div 
            onClick={onOpenProjectCaseStudy}
            className="group relative bg-[#131b26] border-2 border-amber-500/30 hover:border-amber-400 rounded-3xl p-7 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-950/50 cursor-pointer overflow-hidden flex flex-col justify-between"
          >
            {/* Diamond Badge */}
            <div className="absolute top-4 right-4 w-9 h-9 rotate-45 bg-amber-500/10 border border-amber-400/40 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              <span className="-rotate-45 font-mono text-[11px] font-black text-amber-400 group-hover:text-slate-950">
                ◆
              </span>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                <ShieldCheck size={14} /> Entry Point 2 &bull; Consented Evidence
              </div>
              <h3 className="text-2xl font-bold text-white group-hover:text-amber-300 transition-colors font-serif">
                Projects &amp; Case Studies
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Project #1: Alacio Mini Shop. Real audited before-and-after evidence of eliminated cash leakage, locked shelf profits, and verified owner float.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-mono text-amber-400 font-semibold pt-4 border-t border-slate-800">
              <span>View Alacio Case Study</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* 2. HOOK-AGITATE-SOLUTION SECTION */}
      <section className="py-16 px-4 sm:px-6 bg-[#08100d] border-y border-emerald-950/60">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              The MSME Cash Trap
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif">
              Why Odoo, Zoho Books &amp; Excel Fail Fast-Paced Kenyan Shops
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0f1814] border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle size={18} />
              </div>
              <h3 className="font-bold text-white font-serif text-lg">Counter Friction</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                During 7:00 AM rush hour, typing a KES 20 matchbox or KES 65 milk on a phone keypad stops queues. Unrecorded transactions slip away unlogged.
              </p>
            </div>

            <div className="bg-[#0f1814] border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Layers size={18} />
              </div>
              <h3 className="font-bold text-white font-serif text-lg">Mixed Money &amp; Drawings</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Owners reach into the drawer for personal lunch or school fees without a receipt. By evening, KES 3,000 is gone, creating an unresolved cash deficit.
              </p>
            </div>

            <div className="bg-[#0f1814] border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Database size={18} />
              </div>
              <h3 className="font-bold text-white font-serif text-lg">Blind Restock &amp; Stockouts</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Without batch velocity metrics, shops tie capital in slow-moving items while high-demand unga and milk stock out 3 times every week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE YUBIFLO 3-TIER VALUE MATRIX */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            The CDO Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif">
            The YuBiFLo 3-Tier Value System
          </h2>
          <p className="text-xs text-slate-400">
            Deterministic financial math for truth; AI strictly for messy human translation and plain-language answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TIER 1 */}
          <div className="bg-[#0f1915] border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4">
                <Database size={22} />
              </div>
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Tier 1 &bull; Available Day 1</div>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 font-serif">Data Engineering</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Frictionless ingestion that never stops sales: VCR (Voice Conversion Record) at the counter, morning opening float verification, restock batch triggers, and M-Pesa statements.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] font-mono text-emerald-400">
              ✓ Zero manual counter typing
            </div>
          </div>

          {/* TIER 2 */}
          <div className="bg-[#0f1915] border border-teal-500/20 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
                <BarChart3 size={22} />
              </div>
              <div className="text-[10px] font-mono uppercase text-teal-400 font-bold">Tier 2 &bull; Available Day 1</div>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 font-serif">Analysis &amp; CDO Reports</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deterministic calculations of live shelf retail value, wholesale capital invested, locked-in potential gross profit, customer credit aging, and end-of-day discrepancy resolution.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] font-mono text-teal-400">
              ✓ Deterministic code (No AI hallucination)
            </div>
          </div>

          {/* TIER 3 */}
          <div className="bg-[#0f1915] border border-amber-500/20 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-4">
                <BrainCircuit size={22} />
              </div>
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">Tier 3 &bull; Unlocked at 30 Days</div>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 font-serif">Data Science &amp; Forecasting</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Predictive stockout horizon calculations and branch-expansion readiness models. Unlocks only after sufficient clean trading days have accumulated.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] font-mono text-amber-300">
              ⏳ Building picture (18 / 30 clean days logged)
            </div>
          </div>
        </div>
      </section>

      {/* 4. BLUEPRINTS / TEMPLATES SECTION */}
      <section id="templates-section" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              Industry Blueprints
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
              Cloneable MSME Operating Systems
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Each blueprint includes VCR voice capture, opening float, customer credit ledgers, and backroom warehouse depots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blueprints.map((bp) => (
            <div 
              key={bp.id}
              className={`border rounded-2xl p-6 space-y-4 transition flex flex-col justify-between ${
                bp.id === "duka_fmcg"
                  ? "bg-[#0d1612] border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-950/40"
                  : "bg-[#0c1410] border-slate-800 hover:border-amber-500/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    bp.id === "duka_fmcg" 
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                      : "bg-amber-500/10 text-amber-300 border-amber-500/30 flex items-center gap-1"
                  }`}>
                    {bp.id !== "duka_fmcg" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                    {bp.badge}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {bp.items_seed_count} seed items
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white font-serif mt-2.5">
                  {bp.name}
                </h3>
                <div className="text-xs font-mono text-emerald-400">{bp.industry}</div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {bp.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 italic">
                  {bp.tagline}
                </span>
                
                {bp.id === "duka_fmcg" ? (
                  <button
                    onClick={() => onSelectBlueprint(bp.id)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0 font-mono"
                  >
                    <span>Launch Retail Pilot (Alacio)</span>
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectBlueprint(bp.id)}
                    className="px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow shrink-0 font-mono"
                  >
                    <span>In Development &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PROJECT #1 CONSENTED CASE STUDY BANNER */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-[#0c1813] to-[#12231b] border-2 border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold rounded-full mb-2">
                Consented Project Case Study #001
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white font-serif">
                Alacio Mini Shop &bull; 60-Day Financial Health Audit
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {projectCaseStudy.location} &bull; {projectCaseStudy.consented_by}
              </p>
            </div>

            <button
              onClick={onOpenProjectCaseStudy}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Eye size={16} /> Enter Live Client System
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#070e0b] border border-red-500/30 rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                Before YuBiFLo (Pen &amp; Paper Guesswork)
              </span>
              <div className="text-slate-300">&bull; {projectCaseStudy.before_metrics.cash_leakage_monthly}</div>
              <div className="text-slate-300">&bull; {projectCaseStudy.before_metrics.inventory_tracking}</div>
              <div className="text-slate-300">&bull; {projectCaseStudy.before_metrics.owner_drawings}</div>
              <div className="text-slate-300">&bull; {projectCaseStudy.before_metrics.stockout_frequency}</div>
            </div>

            <div className="bg-[#070e0b] border border-emerald-500/40 rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                After YuBiFLo (External CDO Platform)
              </span>
              <div className="text-emerald-300">&bull; {projectCaseStudy.after_metrics.cash_gap_reconciliation}</div>
              <div className="text-emerald-300">&bull; {projectCaseStudy.after_metrics.shelf_value_locked}</div>
              <div className="text-emerald-300">&bull; {projectCaseStudy.after_metrics.payout_categorization}</div>
              <div className="text-emerald-300 font-bold">&bull; Financial Health Score: {projectCaseStudy.after_metrics.financial_health_score}</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
