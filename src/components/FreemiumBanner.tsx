import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Lock, BrainCircuit } from "lucide-react";
import { FreemiumTier } from "../types/alacio";

interface FreemiumBannerProps {
  currentTier: FreemiumTier;
  cleanTradingDays: number;
  vcrCount: number;
  onUpgradePrompt: () => void;
  onToggleTier: (tier: FreemiumTier) => void;
}

export default function FreemiumBanner({
  currentTier,
  cleanTradingDays,
  vcrCount,
  onUpgradePrompt,
  onToggleTier
}: FreemiumBannerProps) {
  const maxFreeVcr = 20;

  return (
    <div className="bg-[#0c1813] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
      
      {/* LEFT: WEEKLY FINANCIAL REPORT READY PROMPT */}
      <div className="space-y-1.5 max-w-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-bold text-amber-300 font-serif text-sm flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" /> Quantitative Financial Health Report
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
            {currentTier === "FREE_STARTER" ? "Free Vector" : currentTier === "PAID_BLUEPRINT" ? "Sovereign Tier" : "CDO Node"}
          </span>
        </div>

        <p className="text-slate-300 text-[11px] leading-relaxed">
          {currentTier === "FREE_STARTER" ? (
            <>
              <strong>{vcrCount}/{maxFreeVcr}</strong> audio vectors ingested today. Upgrade for full P&amp;L telemetry and warehouse tracking.
            </>
          ) : (
            <>
              <strong>{cleanTradingDays}/30 clean trading cycles verified</strong>. Zero leakage. Multi-store expansion models compiling.
            </>
          )}
        </p>

        {/* PROGRESS BAR TOWARDS TIER 3 DATA SCIENCE */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-48 bg-[#070f0c] h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (cleanTradingDays / 30) * 100)}%` }} 
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {cleanTradingDays}/30 Days to Tier 3 Data Science
          </span>
        </div>
      </div>

      {/* RIGHT: TIER SELECTOR & UPGRADE ACTION */}
      <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-[#070e0b] p-1 rounded-xl border border-slate-800 font-mono text-[10px]">
          <button
            onClick={() => onToggleTier("FREE_STARTER")}
            className={`px-2 py-1 rounded-lg transition cursor-pointer ${
              currentTier === "FREE_STARTER" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Free VCR
          </button>
          <button
            onClick={() => onToggleTier("PAID_BLUEPRINT")}
            className={`px-2 py-1 rounded-lg transition cursor-pointer ${
              currentTier === "PAID_BLUEPRINT" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Paid Blueprint
          </button>
          <button
            onClick={() => onToggleTier("PREMIUM_AGENCY")}
            className={`px-2 py-1 rounded-lg transition cursor-pointer ${
              currentTier === "PREMIUM_AGENCY" ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Agency CDO
          </button>
        </div>

        <button
          onClick={onUpgradePrompt}
          className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
        >
          <span>View CDO Health Summary</span>
          <ArrowRight size={13} />
        </button>
      </div>

    </div>
  );
}
