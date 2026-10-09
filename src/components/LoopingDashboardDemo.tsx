import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, RotateCcw, Volume2, Mic, CheckCircle2, 
  ArrowRight, Shield, Sparkles, DollarSign, Users, Store,
  Package, ChevronRight
} from "lucide-react";

// Storyboard timing in milliseconds
// Total cycle is ~18 seconds (18000ms), then loops seamlessly
// Step 1 (0s - 3.5s): Morning: Enter till cash & M-Pesa float -> Dashboard greeting appears
// Step 2 (3.5s - 7.5s): VCR hears a sale -> Transaction row added -> Today's sales counts up
// Step 3 (7.5s - 11.5s): Credit sale appears -> Owed to you (Deni) tile updates
// Step 4 (11.5s - 14.5s): Evening: Unexplained cash chip appears -> 1-tap answered (Personal / Business)
// Step 5 (14.5s - 18.0s): Business Bloom petals fill up -> Profit chart and store health update

export interface DemoConfig {
  merchantName: string;
  initialCash: number;
  initialMpesa: number;
  sale1: { heard: string; item: string; amount: number; payment: string };
  sale2Credit: { heard: string; customer: string; amount: number };
  unexplainedCash: number;
}

const DEFAULT_DEMO_CONFIG: DemoConfig = {
  merchantName: "Mama Wanjiku",
  initialCash: 6500,
  initialMpesa: 4200,
  sale1: {
    heard: "2 kg Unga Jogoo, KES 380, M-Pesa",
    item: "2x Unga Jogoo 2kg",
    amount: 380,
    payment: "M-Pesa Till"
  },
  sale2Credit: {
    heard: "Mama Brayo 1 loaf broadways white bread deni 65",
    customer: "Mama Brayo",
    amount: 65
  },
  unexplainedCash: 450
};

export default function LoopingDashboardDemo({
  onLaunchWorkspace,
  config = DEFAULT_DEMO_CONFIG
}: {
  onLaunchWorkspace?: () => void;
  config?: DemoConfig;
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0); // in ms (0 to 18000)
  const [resolvedUnexplained, setResolvedUnexplained] = useState<"Personal" | "Business" | null>(null);

  // prefers-reduced-motion check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Pause automatically when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Animation timeline state machine via requestAnimationFrame
  const reqRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setElapsedTime(18000); // static complete state
      return;
    }

    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = time - lastTimeRef.current;
        setElapsedTime((prev) => {
          const next = prev + delta;
          if (next >= 18000) {
            // Loop restarts
            setResolvedUnexplained(null);
            return 0;
          }
          return next;
        });
      }
      lastTimeRef.current = time;
      reqRef.current = requestAnimationFrame(animate);
    };

    reqRef.current = requestAnimationFrame(animate);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, prefersReducedMotion]);

  // Derived timeline stages
  // Step 1: 0 - 3500ms
  // Step 2: 3500 - 7500ms
  // Step 3: 7500 - 11500ms
  // Step 4: 11500 - 14500ms
  // Step 5: 14500 - 18000ms
  const isStep1 = elapsedTime < 3500;
  const isStep2 = elapsedTime >= 3500;
  const isStep3 = elapsedTime >= 7500;
  const isStep4 = elapsedTime >= 11500;
  const isStep5 = elapsedTime >= 14500;

  // Dynamic calculations based on timeline
  const baseSales = 12400;
  const currentSales = isStep2 ? baseSales + config.sale1.amount : baseSales;
  const baseOwed = 4255;
  const currentOwed = isStep3 ? baseOwed + config.sale2Credit.amount : baseOwed;
  const currentCashFloat = config.initialCash + config.initialMpesa + (isStep2 ? config.sale1.amount : 0);
  const currentProfit = isStep5 ? 18650 : 16200;

  // Bloom petal values (fills up in Step 5)
  const bloomScores = isStep5 
    ? { profit: 92, cash: 95, debts: 88, stock: 94, suppliers: 86, total: 91 }
    : isStep3
    ? { profit: 78, cash: 82, debts: 74, stock: 80, suppliers: 72, total: 77 }
    : { profit: 65, cash: 70, debts: 60, stock: 75, suppliers: 68, total: 68 };

  const currentStepLabel = isStep1
    ? "Step 1: Dawn Float Locked (05:57 AM)"
    : isStep2
    ? "Step 2: VCR Heard Sale Ingested"
    : isStep3
    ? "Step 3: Credit (Deni) Logged"
    : isStep4
    ? "Step 4: Evening Cash Gap Resolved"
    : "Step 5: Business Bloom Flourishing";

  return (
    <div className="w-full bg-white rounded-3xl border border-[#e4e4e7] shadow-2xl shadow-[#000000]/10 overflow-hidden font-sans">
      
      {/* 1. Browser-style Window Header with Controls */}
      <div className="h-11 bg-[#f4f4f5] border-b border-[#e4e4e7] px-4 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          {/* Mac-style traffic lights */}
          <div className="w-3 h-3 rounded-full bg-[#E57373]" />
          <div className="w-3 h-3 rounded-full bg-[#FFD54F]" />
          <div className="w-3 h-3 rounded-full bg-[#e4e4e7]" />
          <span className="text-[11px] font-mono text-[#666666] ml-2 hidden sm:inline">
            yubiflo.app/demo-duka
          </span>
        </div>

        {/* Center Pill: Sample Data Label */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF6EE] text-[#996515] border border-[#EADBBD]">
            Sample data from a demo duka
          </span>
        </div>

        {/* Play/Pause & Reset Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg hover:bg-white text-[#000000] transition cursor-pointer flex items-center gap-1 text-[11px] font-medium"
            title={isPlaying ? "Pause Timeline Demo" : "Resume Timeline Demo"}
          >
            {isPlaying ? (
              <>
                <Pause size={13} className="text-[#996515]" />
                <span className="hidden md:inline">Pause</span>
              </>
            ) : (
              <>
                <Play size={13} className="text-[#000000]" />
                <span className="hidden md:inline">Play</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              setElapsedTime(0);
              setResolvedUnexplained(null);
            }}
            className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Restart Timeline Demo"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Timeline Progress Bar */}
      <div className="h-1 bg-[#e5e7eb] relative overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#000000] via-[#262626] to-[#B8860B] transition-all duration-100 ease-linear"
          style={{ width: `${(elapsedTime / 18000) * 100}%` }}
        />
      </div>

      {/* 3. Main Dashboard Window */}
      <div className="p-4 sm:p-6 space-y-5 bg-white">
        
        {/* Top Greeting & Active Timeline Step Notification */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5e7eb] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-serif font-black text-[#000000]">
                Good morning, {config.merchantName}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f4f4f5] text-[#000000]">
                Duka Counter
              </span>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Opening till cash (KSh {config.initialCash.toLocaleString()}) &amp; M-Pesa float (KSh {config.initialMpesa.toLocaleString()}) locked
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-mono text-[#996515] bg-[#FAF6EE] px-2.5 py-1 rounded-xl border border-[#EADBBD] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B8860B] animate-pulse" />
              <span>{currentStepLabel}</span>
            </span>
          </div>
        </div>

        {/* VCR Live Audio Capture Banner (Simulated Animation Trigger) */}
        <div className={`p-3 rounded-2xl border transition-all duration-500 ${
          isStep2 && !isStep3 
            ? "bg-[#FAF6EE] border-[#B8860B] shadow-sm"
            : "bg-[#f9fafb] border-[#e4e4e7]"
        }`}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isStep2 && !isStep3 ? "bg-[#B8860B] text-white animate-pulse" : "bg-[#000000] text-white"
              }`}>
                <Mic size={14} />
              </div>
              <div className="truncate">
                <span className="font-mono text-[11px] text-[#666666]">
                  {isStep2 ? "VCR Heard Buyer-Seller Audio:" : "VCR Counter Microphone Active:"}
                </span>
                <p className="font-medium text-[#222222] truncate text-xs">
                  {isStep2 
                    ? `"${config.sale1.heard}" → Auto-logged`
                    : "Listening for counter speech (English, Swahili, Sheng)..."}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-[#000000] border border-[#e4e4e7]">
                {isStep2 ? "+KSh 380" : "Standby"}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Big Tiles + Business Bloom Motif */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          
          {/* Left: 4 Stat Tiles */}
          <div className="sm:col-span-8 grid grid-cols-2 gap-3">
            
            {/* Tile 1: Today's sales */}
            <div className={`p-3.5 rounded-2xl border transition-all duration-500 ${
              isStep2 ? "bg-[#f9fafb] border-[#000000] shadow-xs" : "bg-[#fafafa] border-[#e4e4e7]"
            }`}>
              <div className="text-[11px] text-[#666666] font-medium">Today&apos;s sales</div>
              <div className="text-xl font-bold font-serif text-[#000000] mt-0.5">
                KSh {currentSales.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#000000] font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#000000]" />
                <span>{isStep2 ? "25 sales counted" : "24 sales counted"}</span>
              </div>
            </div>

            {/* Tile 2: Cash & float now */}
            <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-[#e4e4e7]">
              <div className="text-[11px] text-[#666666] font-medium">Cash &amp; float now</div>
              <div className="text-xl font-bold font-serif text-[#000000] mt-0.5">
                KSh {currentCashFloat.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#666666] mt-0.5">
                Till Drawer + M-Pesa
              </div>
            </div>

            {/* Tile 3: Profit this week */}
            <div className={`p-3.5 rounded-2xl border transition-all duration-500 ${
              isStep5 ? "bg-[#f9fafb] border-[#262626] shadow-xs" : "bg-[#fafafa] border-[#e4e4e7]"
            }`}>
              <div className="text-[11px] text-[#666666] font-medium">Profit this week</div>
              <div className="text-xl font-bold font-serif text-[#000000] mt-0.5">
                KSh {currentProfit.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#262626] font-medium mt-0.5">
                Real margins (24.8%)
              </div>
            </div>

            {/* Tile 4: Owed to you (Deni) */}
            <div className={`p-3.5 rounded-2xl border transition-all duration-500 ${
              isStep3 ? "bg-[#FAF6EE] border-[#B8860B] shadow-xs" : "bg-[#fafafa] border-[#EADBBD]"
            }`}>
              <div className="text-[11px] text-[#996515] font-medium">Owed to you (Deni)</div>
              <div className="text-xl font-bold font-serif text-[#996515] mt-0.5">
                KSh {currentOwed.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#996515] mt-0.5">
                {isStep3 ? "4 neighbours recorded" : "3 neighbours recorded"}
              </div>
            </div>

          </div>

          {/* Right: Business Bloom Signature Graphic */}
          <div className="sm:col-span-4 p-4 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] flex flex-col items-center justify-center text-center">
            <div className="text-[10px] font-bold text-[#000000] uppercase tracking-wider mb-1">
              Business Bloom
            </div>
            
            {/* SVG Flower Graphic */}
            <div className="relative w-24 h-24 my-1">
              <svg viewBox="0 0 100 100" className="w-full h-full transition-transform duration-700">
                <circle cx="50" cy="50" r="46" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
                
                {/* 5 Petals corresponding to: Profit, Cash, Debts, Stock, Suppliers */}
                <ellipse cx="50" cy="22" rx="10" ry="16" fill="#000000" opacity={bloomScores.profit / 100} />
                <ellipse cx="69" cy="36" rx="10" ry="16" transform="rotate(72 69 36)" fill="#262626" opacity={bloomScores.cash / 100} />
                <ellipse cx="62" cy="62" rx="10" ry="16" transform="rotate(144 62 62)" fill="#B8860B" opacity={bloomScores.debts / 100} />
                <ellipse cx="38" cy="62" rx="10" ry="16" transform="rotate(216 38 62)" fill="#171717" opacity={bloomScores.stock / 100} />
                <ellipse cx="31" cy="36" rx="10" ry="16" transform="rotate(288 31 36)" fill="#996515" opacity={bloomScores.suppliers / 100} />
                
                {/* Core */}
                <circle cx="50" cy="50" r="14" fill="#FFFFFF" stroke="#B8860B" strokeWidth="1.5" />
                <text x="50" y="53" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="bold">
                  {bloomScores.total}
                </text>
              </svg>
            </div>

            <span className="text-[10px] text-[#666666] font-medium">
              Store Health: <strong className="text-[#000000]">{bloomScores.total}/100</strong>
            </span>
          </div>

        </div>

        {/* Tile 5: Evening Unexplained Cash & One-Tap Resolution Chip */}
        <div className={`p-4 rounded-2xl border transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isStep4 ? "bg-[#FAF6EE] border-[#B8860B]" : "bg-white border-[#e4e4e7]"
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#222222]">Unexplained cash at close:</span>
              <span className="text-base font-bold text-[#996515] font-serif">
                KSh {config.unexplainedCash}
              </span>
            </div>
            <p className="text-[11px] text-[#666666] mt-0.5">
              {resolvedUnexplained 
                ? `Resolved as ${resolvedUnexplained} drawing. Drawer balanced with zero missing money.`
                : "Did you take coins for chai, lunch, or supplier fare? 1-tap resolves it:"}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setResolvedUnexplained("Personal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                resolvedUnexplained === "Personal" || isStep4
                  ? "bg-[#FAF6EE] text-[#996515] border-[#EADBBD] ring-2 ring-[#B8860B]/20"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Personal (Lunch / Chai)
            </button>
            <button
              onClick={() => setResolvedUnexplained("Business")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                resolvedUnexplained === "Business"
                  ? "bg-[#f4f4f5] text-[#000000] border-[#e4e4e7] ring-2 ring-[#000000]/20"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Business (Expense)
            </button>
          </div>
        </div>

        {/* Footer in Dashboard */}
        <div className="pt-2 flex items-center justify-between text-xs text-[#666666] border-t border-[#e5e7eb]">
          <span className="flex items-center gap-1.5">
            <Shield size={13} className="text-[#000000]" />
            <span>Encrypted local storage &bull; Zero audio saved</span>
          </span>
          <button
            onClick={onLaunchWorkspace}
            className="text-[#000000] font-bold hover:underline flex items-center gap-1"
          >
            <span>Open working workspace &rarr;</span>
          </button>
        </div>

      </div>

    </div>
  );
}
