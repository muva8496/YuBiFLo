import React, { useState } from "react";
import { 
  Building2, ArrowRight, ShieldCheck, Sparkles, Database, 
  BarChart3, BrainCircuit, Store, Check, Plus, Lock, 
  ChevronRight, ArrowUpDown, Filter, HelpCircle, BarChart2
} from "lucide-react";
import { ProjectCaseStudy } from "../types/alacio";
import { 
  BusinessBlueprintConfig, 
  BusinessWaitlistRequest, 
  loadBlueprintsConfig, 
  saveBlueprintsConfig, 
  loadWaitlistRequests, 
  getBlueprintCardConfig 
} from "../services/alacioStorage";
import WaitlistRequestModal from "./WaitlistRequestModal";
import AdminDemandRadarModal from "./AdminDemandRadarModal";

interface HomeScreenDiamondsProps {
  projectCaseStudy: ProjectCaseStudy;
  onSelectBlueprint: (blueprintId: string) => void;
  onOpenProjectCaseStudy: () => void;
}

export default function HomeScreenDiamonds({
  projectCaseStudy,
  onSelectBlueprint,
  onOpenProjectCaseStudy
}: HomeScreenDiamondsProps) {
  // Configurable blueprints state (admin-editable without code changes)
  const [blueprints, setBlueprints] = useState<BusinessBlueprintConfig[]>(() => loadBlueprintsConfig());

  // Waitlist requests state
  const [waitlistRequests, setWaitlistRequests] = useState<BusinessWaitlistRequest[]>(() => loadWaitlistRequests());

  // Modals state
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("");
  const [isAdminRadarOpen, setIsAdminRadarOpen] = useState(false);

  // Handle click on blueprint card
  const handleCardClick = (bp: BusinessBlueprintConfig) => {
    if (bp.status === "live") {
      onSelectBlueprint("duka_fmcg");
    } else {
      setSelectedBusinessType(bp.name);
      setIsWaitlistModalOpen(true);
    }
  };

  // Open generic request form
  const handleOpenCustomRequest = () => {
    setSelectedBusinessType("");
    setIsWaitlistModalOpen(true);
  };

  // Handle new request saved
  const handleNewRequestSaved = (newReq: BusinessWaitlistRequest) => {
    setWaitlistRequests((prev) => [newReq, ...prev]);
  };

  // Handle blueprints update from admin view
  const handleUpdateBlueprints = (updated: BusinessBlueprintConfig[]) => {
    setBlueprints(updated);
  };

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
        {/* TWO DIAMOND ENTRY POINTS: BLUEPRINTS (LEFT) & PROJECTS (RIGHT) */}
        {/* ======================================================== */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
          
          {/* DIAMOND ENTRY 1: BLUEPRINTS (LEFT) */}
          <div 
            onClick={() => {
              const target = document.getElementById("choose-your-app-section");
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
                Built for your kind of business
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Operating systems tailored for Retail Dukas, Hardware, Agrovet, Wholesale, and specialized Kenyan shops.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold pt-4 border-t border-slate-800">
              <span>Explore {blueprints.length} Business Types</span>
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
              <span className="text-xs font-mono text-amber-400 font-bold block">Friction Point 1</span>
              <h3 className="text-lg font-bold text-white font-serif">Manual Entry Kills The Queue</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When customers are lining up for 20-shilling sugar, salt, and milk, typing items into a screen stops sales. Incomplete records mean missing money at end-of-day.
              </p>
            </div>

            <div className="bg-[#0f1814] border border-slate-800 rounded-2xl p-6 space-y-3">
              <span className="text-xs font-mono text-amber-400 font-bold block">Friction Point 2</span>
              <h3 className="text-lg font-bold text-white font-serif">Mixed Owner Pockets &amp; Floats</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Personal lunch, school pocket money, and emergency supplier cash come out of the same till or M-Pesa float. Without bookend baselines, profits leak invisibly.
              </p>
            </div>

            <div className="bg-[#0f1814] border border-slate-800 rounded-2xl p-6 space-y-3">
              <span className="text-xs font-mono text-amber-400 font-bold block">Friction Point 3</span>
              <h3 className="text-lg font-bold text-white font-serif">Unrecorded Stock Discrepancies</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Break-bulk items, spoilage, and shopkeeper debt books are rarely mapped to actual purchase receipts. YuBiFLo uses supply-based math to lock in true stock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OPERATIONAL TRUTH (CLIENT-FACING PILLARS - NO TIERS, SCORES, OR RANKINGS) */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            The CDO Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif">
            How YuBiFLo Operates
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mx-auto">
            Deterministic financial math for absolute truth; voice AI strictly for natural counter conversations without keyboard friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PILLAR 1: DATA INGESTION */}
          <div className="bg-[#0f1915] border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4">
                <Database size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-serif">Frictionless Data Ingestion</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                VCR (Voice Conversation Record) at the counter, morning opening float verification, supplier receipt photography, and M-Pesa statement audits.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] font-mono text-emerald-400">
              ✓ Zero manual counter typing
            </div>
          </div>

          {/* PILLAR 2: FINANCIAL AUDITING */}
          <div className="bg-[#0f1915] border border-teal-500/20 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-serif">Deterministic Daily Math</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Reverse-inventory calculations of live shelf retail value, wholesale capital invested, customer credit aging, and end-of-day discrepancy reconciliation.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] font-mono text-teal-400">
              ✓ Deterministic code (No AI hallucination)
            </div>
          </div>

          {/* PILLAR 3: CAPITAL STABILITY */}
          <div className="bg-[#0f1915] border border-amber-500/20 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-4">
                <BrainCircuit size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-serif">Capital &amp; Stock Intelligence</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Predictive stockout horizon calculations, break-bulk micro conversion, and bankable record keeping built to protect the owner's capital.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] font-mono text-amber-300">
              ✓ Audited bankable proof
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. CHOOSE YOUR APP / BUILT FOR YOUR KIND OF BUSINESS     */}
      {/* ========================================================= */}
      <section id="choose-your-app-section" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        
        {/* SECTION HEADER & PROMPT COPY */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif tracking-tight">
              Built for your kind of business.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans">
              Don't see yours? Tell us. We build where owners ask.
            </p>
          </div>

          {/* QUICK ACTIONS: REQUEST DIFFERENT & ADMIN RADAR */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenCustomRequest}
              className="px-3 py-1.5 bg-[#0f2117] hover:bg-[#142e20] text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition shadow"
            >
              <Plus size={13} /> Request Another Type
            </button>

            <button
              onClick={() => setIsAdminRadarOpen(true)}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
              title="Admin view: demand count & status editor"
            >
              <BarChart2 size={13} className="text-amber-400" />
              <span>Admin &amp; Demand Radar</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
            </button>
          </div>
        </div>

        {/* BLUEPRINTS CARDS GRID (13 BUSINESS TYPES) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blueprints.map((bp) => {
            const cardCfg = getBlueprintCardConfig(bp.status);

            return (
              <div 
                key={bp.id}
                className={`border rounded-2xl p-5 space-y-4 transition flex flex-col justify-between ${
                  cardCfg.isLive
                    ? "bg-[#0d1612] border-emerald-500/50 hover:border-emerald-400 shadow-xl shadow-emerald-950/40"
                    : "bg-[#0c1410] border-slate-800/90 hover:border-slate-700"
                }`}
              >
                <div>
                  {/* CARD BADGE */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${cardCfg.badgeClass} flex items-center gap-1.5`}>
                      {cardCfg.isLive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      {bp.status === "next" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                      {cardCfg.badgeText}
                    </span>
                  </div>

                  {/* BUSINESS NAME */}
                  <h3 className="text-lg font-bold text-white font-serif mt-3 leading-snug">
                    {bp.name}
                  </h3>

                  {/* DESCRIPTION / TAGLINE */}
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {bp.description || "Tailored inventory math and cash drawer auditing for this business."}
                  </p>
                </div>

                {/* CARD FOOTER & ACTION BUTTON */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    {bp.tagline || "Built for owners"}
                  </span>

                  <button
                    onClick={() => handleCardClick(bp)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${cardCfg.buttonClass}`}
                  >
                    <span>{cardCfg.buttonText}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
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
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0 font-mono"
            >
              <span>Enter Live Client System</span>
              <ArrowRight size={15} />
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
              <div className="text-emerald-300 font-bold">&bull; Bankable Proof: 100% CDO-Verified &amp; Ledger-Backed</div>
            </div>
          </div>
        </div>
      </section>

      {/* WAITLIST / REQUEST MODAL */}
      <WaitlistRequestModal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        initialBusinessType={selectedBusinessType}
        onSuccessSubmitted={handleNewRequestSaved}
      />

      {/* ADMIN DEMAND RADAR & BLUEPRINTS STATUS EDITOR */}
      <AdminDemandRadarModal
        isOpen={isAdminRadarOpen}
        onClose={() => setIsAdminRadarOpen(false)}
        blueprints={blueprints}
        requests={waitlistRequests}
        onUpdateBlueprints={handleUpdateBlueprints}
      />

    </div>
  );
}
