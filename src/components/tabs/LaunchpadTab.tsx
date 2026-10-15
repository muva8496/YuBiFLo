import React, { useState } from "react";
import { 
  CheckCircle2, Circle, ArrowRight, Sun, Layers, Mic, Truck, 
  Users, MessageSquare, Scale, Sparkles, ExternalLink, ShieldCheck, Download
} from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";

export interface LaunchpadProgress {
  step1_dawnLock: boolean;
  step2_addStock: boolean;
  step3_firstSale: boolean;
  step4_addSuppliers: boolean;
  step5_customersDeni: boolean;
  step6_vcrNotice: boolean;
  step7_closeDay: boolean;
}

interface LaunchpadTabProps {
  state: AlacioMasterState;
  onNavigateTab: (tabId: string) => void;
  onQuickAction?: (action: string) => void;
  launchpadProgress: LaunchpadProgress;
  onToggleStep: (stepKey: keyof LaunchpadProgress) => void;
}

export default function LaunchpadTab({
  state,
  onNavigateTab,
  onQuickAction,
  launchpadProgress,
  onToggleStep
}: LaunchpadTabProps) {
  const { currency, inventory, customers, salesLedger = [], suppliers = [] } = state;

  // Compute completed count
  const stepsList: Array<{
    id: number;
    key: keyof LaunchpadProgress;
    title: string;
    description: string;
    unlocksCard: string;
    tabId: string;
    buttonLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 1,
      key: "step1_dawnLock",
      title: "Lock morning float (Dawn Lock)",
      description: "Lock your morning baseline across Cash, M-Pesa float, and Bank/Paybill before morning trade.",
      unlocksCard: "Unlocks: Cash and float now",
      tabId: "dawn_lock",
      buttonLabel: "Lock Dawn Float",
      icon: <Sun size={18} className="text-amber-400" />
    },
    {
      id: 2,
      key: "step2_addStock",
      title: "Add stock or bring your records",
      description: "Enter your starting shelf items or upload an existing Excel/CSV or supplier receipt.",
      unlocksCard: "Unlocks: Stock alerts",
      tabId: "stock_vault",
      buttonLabel: "Add Starting Stock",
      icon: <Layers size={18} className="text-cyan-400" />
    },
    {
      id: 3,
      key: "step3_firstSale",
      title: "Speak your first sale",
      description: "Let VCR listen to a counter conversation in Swahili, Sheng, or English and turn it into a sale.",
      unlocksCard: "Unlocks: Today's sales so far & Profit this week",
      tabId: "voice_ledger",
      buttonLabel: "Speak First Sale",
      icon: <Mic size={18} className="text-emerald-400" />
    },
    {
      id: 4,
      key: "step4_addSuppliers",
      title: "Add suppliers & wholesalers",
      description: "Add distributors like Jahdithma Wholesalers so new deliveries automatically update inventory and totals.",
      unlocksCard: "Unlocks: Supplier performance",
      tabId: "purchases",
      buttonLabel: "Add Supplier / Cargo",
      icon: <Truck size={18} className="text-purple-400" />
    },
    {
      id: 5,
      key: "step5_customersDeni",
      title: "Add customers and Deni",
      description: "Track trusted neighborhood credit and Khata without loose paper exercise books.",
      unlocksCard: "Unlocks: Owed to you (Deni)",
      tabId: "customer_deni",
      buttonLabel: "Log Customer Deni",
      icon: <Users size={18} className="text-amber-300" />
    },
    {
      id: 6,
      key: "step6_vcrNotice",
      title: "Put the VCR notice at your counter",
      description: "Print or display the customer notice: 'We respect your privacy. Counter audio is parsed to transactions then deleted.'",
      unlocksCard: "Unlocks: Sales vs purchases chart",
      tabId: "voice_ledger",
      buttonLabel: "Download VCR Notice",
      icon: <MessageSquare size={18} className="text-blue-400" />
    },
    {
      id: 7,
      key: "step7_closeDay",
      title: "View your 3-Fold master ledgers",
      description: "Review your unified 3-fold ledgers tracking your daily sales, purchases, and debtor collections.",
      unlocksCard: "Unlocks: Master reconciliation",
      tabId: "three_fold_ledgers",
      buttonLabel: "View 3-Fold Ledgers",
      icon: <Scale size={18} className="text-emerald-300" />
    }
  ];

  const completedCount = Object.values(launchpadProgress).filter(Boolean).length;
  const progressPct = Math.round((completedCount / 7) * 100);

  // SVG Progress Ring calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleAction = (step: typeof stepsList[0]) => {
    if (step.key === "step6_vcrNotice") {
      setDownloadSuccess(true);
      onToggleStep("step6_vcrNotice");
      setTimeout(() => setDownloadSuccess(false), 4000);
    } else {
      onNavigateTab(step.tabId);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans text-[#E2ECF3]">
      
      {/* HEADER CARD WITH PROGRESS RING */}
      <div className="bg-[#0E1A29] border border-[#182C40] rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold bg-[#1E3A5F] text-[#38BDF8] px-2.5 py-0.5 rounded-full border border-[#2D5577]">
                Onboarding Setup
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {completedCount} of 7 steps finished
              </span>
            </div>

            <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
              Launchpad: Setup Checklist
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Complete each operational milestone below to configure your store ecosystem. Completing each step automatically unlocks the matching live telemetry card on your executive dashboard.
            </p>
          </div>

          {/* CIRCULAR PROGRESS RING */}
          <div className="flex items-center gap-4 shrink-0 bg-[#09121D] p-4 rounded-2xl border border-[#182C40]">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="#182C40"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="#10B981"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                <span className="text-lg font-bold text-white">{progressPct}%</span>
                <span className="text-[9px] text-slate-400 uppercase">Ready</span>
              </div>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <span className="text-slate-400 block text-[11px]">System Status:</span>
              <strong className={completedCount === 7 ? "text-emerald-400" : "text-amber-400"}>
                {completedCount === 7 ? "Fully Operational" : "Setup In Progress"}
              </strong>
              <div className="text-[10px] text-slate-500">
                {7 - completedCount} unlock milestones left
              </div>
            </div>
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>VCR Counter Privacy Notice downloaded. Customer privacy notice is now active at your counter.</span>
        </div>
      )}

      {/* CHECKLIST ITEMS */}
      <div className="space-y-3">
        {stepsList.map((step) => {
          const isDone = launchpadProgress[step.key];

          return (
            <div
              key={step.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDone
                  ? "bg-[#0B1522]/80 border-emerald-500/30 text-slate-300"
                  : "bg-[#0E1A29] border-[#182C40] hover:border-[#2D5577] text-white"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* CHECKBOX TOGGLE */}
                <button
                  type="button"
                  onClick={() => onToggleStep(step.key)}
                  className="mt-0.5 text-slate-500 hover:text-emerald-400 transition cursor-pointer shrink-0"
                  title={isDone ? "Mark as incomplete" : "Mark as completed"}
                >
                  {isDone ? (
                    <CheckCircle2 size={22} className="text-emerald-400" />
                  ) : (
                    <Circle size={22} className="text-slate-600 hover:text-slate-400" />
                  )}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      Step {step.id}:
                    </span>
                    <h3 className={`text-sm font-bold ${isDone ? "line-through text-slate-400" : "text-white"}`}>
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    {step.description}
                  </p>

                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#132337] text-cyan-300 border border-[#1E3A5F]">
                      {step.unlocksCard}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="flex items-center gap-2 sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleAction(step)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow ${
                    isDone
                      ? "bg-[#182C40] hover:bg-[#203952] text-slate-200"
                      : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-blue-900/30"
                  }`}
                >
                  <span>{step.buttonLabel}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
