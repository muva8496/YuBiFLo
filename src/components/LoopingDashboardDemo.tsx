import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, RotateCcw, Sparkles, ArrowRight, ShieldCheck, 
  CheckCircle2, FileText, Receipt, ArrowLeftRight, Truck,
  SlidersHorizontal, ChevronDown, AlertCircle, Info, ExternalLink,
  Rocket, LayoutDashboard, TrendingUp, ShoppingBag, Layers,
  Sun, Mic, Users, BookOpen, BarChart2, Plus, Bookmark, Building2
} from "lucide-react";

export interface LoopingDashboardDemoProps {
  onLaunchWorkspace?: () => void;
  userName?: string;
  businessName?: string;
}

export default function LoopingDashboardDemo({
  onLaunchWorkspace,
  userName = "Musa",
  businessName = "Musa General Retailers"
}: LoopingDashboardDemoProps) {
  // Timeline state
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0); // 0 to 18000ms
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Interactive state
  const [isRestockAuthorized, setIsRestockAuthorized] = useState(false);
  const [hoveredExpenseSegment, setHoveredExpenseSegment] = useState<number | null>(null);
  const [activeActionPill, setActiveActionPill] = useState<string | null>(null);
  const [activeDemoModule, setActiveDemoModule] = useState<string>("dashboard");
  const [toastNote, setToastNote] = useState<string | null>(null);

  // Dynamic greeting based on current local hour
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Check prefers-reduced-motion
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
      if (document.hidden) setIsPlaying(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Animation timeline loop via requestAnimationFrame
  const reqRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setElapsedTime(18000);
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
            setIsRestockAuthorized(false);
            return 0;
          }
          // Auto-trigger bread crate sales authorization around 7s in loop
          if (prev < 7000 && next >= 7000) {
            setIsRestockAuthorized(true);
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

  // Handle manual 1-tap authorize
  const handleAuthorizeRestock = () => {
    setIsRestockAuthorized(true);
    setToastNote("✓ 17 loaves of Broadways Bread (1 crate) crystallized as KSh 1,105 walk-in sale. 1 loaf logged as proprietor drawing.");
    setTimeout(() => setToastNote(null), 4500);
  };

  // Exact Donut Chart Segments matching demo dashboard
  const expenseSegments = [
    { id: 1, label: "Payroll & Labor", pct: 27, amount: "KSh 42,600", color: "#F59E0B", hasAlert: false },
    { id: 2, label: "Stock & Restock", pct: 23, amount: isRestockAuthorized ? "KSh 37,500" : "KSh 36,400", color: "#EA580C", hasAlert: false },
    { id: 3, label: "Shop Rent & Permits", pct: 16, amount: "KSh 25,200", color: "#8B5CF6", hasAlert: false },
    { id: 4, label: "Cash on hand", pct: 14, amount: isRestockAuthorized ? "KSh 23,200" : "KSh 22,100", color: "#38BDF8", hasAlert: false },
    { id: 5, label: "Supplier Payable", pct: 12, amount: "KSh 18,900", color: "#3B82F6", hasAlert: true },
    { id: 6, label: "Other / Packaging", pct: 8, amount: "KSh 12,600", color: "#94A3B8", isHatched: true, hasAlert: false }
  ];

  // SVG Donut Path calculations (flattened & compact for crisp fit)
  const size = 100;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  // Exact 11-day cashflow data matching screenshot (Apr 2 to Apr 12)
  const cashflowDays = [
    { day: "Apr 2", inflow: 36, outflow: 24, net: 26 },
    { day: "Apr 3", inflow: 29, outflow: 18, net: 27 },
    { day: "Apr 4", inflow: 51, outflow: 32, net: 34 },
    { day: "Apr 5", inflow: 43, outflow: 36, net: 17 },
    { day: "Apr 6", inflow: 39, outflow: 26, net: 25 },
    { day: "Apr 7", inflow: 48, outflow: 34, net: 27 },
    { day: "Apr 8", inflow: 36, outflow: 24, net: 27 },
    { day: "Apr 9", inflow: 28, outflow: 18, net: 26 },
    { day: "Apr 10", inflow: 50, outflow: 36, net: 34 },
    { day: "Apr 11", inflow: 43, outflow: 34, net: 17 },
    { day: "Apr 12", inflow: isRestockAuthorized ? 46 : 39, outflow: 27, net: isRestockAuthorized ? 29 : 25 }
  ];

  const demoModules = [
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={13} /> },
    { id: "supply_sales", name: "Sales & Till", icon: <TrendingUp size={13} /> },
    { id: "purchases", name: "Purchases", icon: <ShoppingBag size={13} />, badge: "OCR" },
    { id: "suppliers", name: "Suppliers", icon: <Truck size={13} /> },
    { id: "stock_vault", name: "Stock Vault", icon: <Layers size={13} /> },
    { id: "dawn_lock", name: "Dawn Lock", icon: <Sun size={13} /> },
    { id: "voice_ledger", name: "Voice Ledger", icon: <Mic size={13} />, badge: "VCR" },
    { id: "customer_deni", name: "Customer Deni", icon: <BookOpen size={13} /> },
    { id: "analytics", name: "Analytics", icon: <BarChart2 size={13} /> }
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden font-sans text-slate-900 relative">
      
      {/* 1. BROWSER WINDOW TOP BAR */}
      <div className="h-9 bg-[#F8FAFC] border-b border-slate-200 px-3 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 ml-1 hidden sm:inline">
            yubiflo.app/workspace
          </span>
        </div>

        {/* FAR END TOP RIGHT CORNER: CONTROLS & BUSINESS NAME */}
        <div className="flex items-center gap-2">
          {/* Subtle loop controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-md px-1.5 py-0.5 shadow-2xs">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-slate-600 hover:text-slate-900 transition cursor-pointer flex items-center gap-1 text-[9.5px] font-medium"
              title={isPlaying ? "Pause timeline preview" : "Resume timeline preview"}
            >
              {isPlaying ? (
                <>
                  <Pause size={10} className="text-amber-600" />
                  <span className="hidden md:inline text-[9px]">Live</span>
                </>
              ) : (
                <>
                  <Play size={10} className="text-slate-800" />
                  <span className="hidden md:inline text-[9px]">Play</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                setElapsedTime(0);
                setIsRestockAuthorized(false);
              }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Restart Timeline"
            >
              <RotateCcw size={9} />
            </button>
          </div>

          {/* BUSINESS NAME ON THE FAR RIGHT TOP CORNER */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-slate-800 text-[10.5px] font-semibold">
            <Building2 size={12} className="text-blue-600 shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-none">{businessName}</span>
            <ChevronDown size={11} className="text-slate-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* 2. TIMELINE PROGRESS BAR */}
      <div className="h-0.5 bg-slate-100 relative overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500 transition-all duration-100 ease-linear"
          style={{ width: `${(elapsedTime / 18000) * 100}%` }}
        />
      </div>

      {/* 3. MAIN WORKSPACE BODY: LEFT MODULES SIDEBAR + DASHBOARD CANVAS */}
      <div className="flex bg-[#F8FAFC]">

        {/* LEFT MODULES SIDEBAR */}
        <aside className="w-32 sm:w-36 bg-white border-r border-slate-200 p-1.5 flex flex-col justify-between shrink-0 select-none">
          <div className="space-y-1">
            
            {/* Header: MODULES */}
            <div className="px-1 py-0.5 flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Modules
              </span>
              <span className="text-[7.5px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                12 ACTIVE
              </span>
            </div>

            {/* "+ Create new" pill button */}
            <button
              type="button"
              onClick={onLaunchWorkspace}
              className="w-full bg-[#1A56DB] hover:bg-[#1545B3] text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
            >
              <Plus size={11} />
              <span>Create new</span>
            </button>

            {/* Modules list */}
            <nav className="space-y-0.5">
              {demoModules.map((item) => {
                const isActive = item.id === activeDemoModule;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveDemoModule(item.id);
                      if (item.id !== "dashboard") {
                        onLaunchWorkspace?.();
                      }
                    }}
                    className={`w-full px-1.5 py-0.8 rounded-md text-[9.5px] sm:text-[10px] font-medium transition flex items-center justify-between text-left cursor-pointer ${
                      isActive
                        ? "bg-[#EBF3FC] text-[#1A56DB] font-semibold"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={isActive ? "text-[#1A56DB]" : "text-slate-400"}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[7px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom user / shop identity */}
          <div className="pt-1 border-t border-slate-100 px-1 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-blue-600 text-white font-bold text-[8px] flex items-center justify-center font-mono shrink-0">
                {businessName.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-[9px] font-bold text-slate-800 truncate">{businessName}</div>
                <div className="text-[7px] text-emerald-600 font-mono truncate font-medium">Active Shop</div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT: MAIN DASHBOARD CANVAS */}
        <div className="flex-1 min-w-0 p-2 sm:p-2.5 space-y-1.5 sm:space-y-2 bg-white relative overflow-hidden">

        {/* TOAST FEEDBACK */}
        {toastNote && (
          <div className="relative z-10 p-2 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs flex items-center gap-2 animate-in fade-in shadow-xs">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span className="font-medium text-[11px]">{toastNote}</span>
          </div>
        )}

        {/* GREETING: "Good evening, Musa" + STORE NAME & STATUS */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-serif font-normal text-slate-900 tracking-tight">
              {timeGreeting}, {userName}
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-emerald-700 font-semibold hidden sm:inline">
              All Books Balanced
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
            <span className="text-slate-400">Store:</span>
            <span className="font-semibold text-slate-800">{businessName}</span>
          </div>
        </div>

        {/* RESTOCK IMPLIED SALES NOTIFICATION BANNER (FLATTENED) */}
        <div className={`relative z-10 rounded-xl p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 transition-all duration-500 border ${
          isRestockAuthorized
            ? "bg-emerald-50/70 border-emerald-300"
            : "bg-[#FFF9EE] border-[#F59E0B]/50 hover:border-[#F59E0B]"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 shadow-2xs font-bold ${
              isRestockAuthorized ? "bg-emerald-600 text-white" : "bg-[#F59E0B] text-slate-950"
            }`}>
              {isRestockAuthorized ? <CheckCircle2 size={13} /> : <Sparkles size={13} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold font-serif text-slate-900 truncate">
                  {isRestockAuthorized 
                    ? "Broadways Bread Sales Authorized & Reconciled" 
                    : "2 Restock Implied Sales Cards Ready"}
                </span>
                <span className={`text-[7.5px] font-mono px-1 py-0.2 rounded-full font-bold uppercase ${
                  isRestockAuthorized
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-[#FDE68A] text-[#92400E]"
                }`}>
                  {isRestockAuthorized ? "✓ Audited" : "RESTOCK VELOCITY"}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 truncate mt-0.2">
                {isRestockAuthorized
                  ? "17 loaves authorized as KSh 1,105 walk-in sales • 1 loaf recorded as proprietor drawing."
                  : "Restock arrived for Broadways White Bread 400g (Crate of 20). Authorize sales without counter typing."}
              </p>
            </div>
          </div>

          <button
            onClick={isRestockAuthorized ? onLaunchWorkspace : handleAuthorizeRestock}
            className={`px-2.5 py-1 text-[9.5px] font-bold rounded-md transition flex items-center gap-1 shrink-0 shadow-2xs font-mono cursor-pointer self-start sm:self-auto ${
              isRestockAuthorized
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-[#F59E0B] hover:bg-[#D97706] text-slate-950"
            }`}
          >
            <span>{isRestockAuthorized ? "Open Workspace" : "Authorize Sales"}</span>
            <ArrowRight size={10} />
          </button>
        </div>

        {/* ROW OF 4 PASTEL ROUNDED ACTION PILLS (FLATTENED) */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-1.5">
          
          {/* PILL 1: MINT GREEN (CREATE ESTIMATE / QUICK SALE) */}
          <button
            onClick={() => {
              setActiveActionPill("sale");
              setToastNote("Quick Sale Simulator: Walk-in counter cash or M-Pesa sale.");
              setTimeout(() => setToastNote(null), 3000);
            }}
            className="py-1 px-1.5 rounded-lg bg-[#E8F8F0] hover:bg-[#DDF4E8] border border-[#CBEEDB] text-[#1E3A2F] flex items-center justify-center gap-1 transition cursor-pointer group"
          >
            <FileText size={11} className="shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold tracking-tight truncate">
              Create estimate
            </span>
          </button>

          {/* PILL 2: SKY BLUE (PURCHASES • OCR) */}
          <button
            onClick={() => {
              setActiveActionPill("purchases");
              setToastNote("Purchases & Cargo: Upload supplier invoice photo to auto-extract items.");
              setTimeout(() => setToastNote(null), 3000);
            }}
            className="py-1 px-1.5 rounded-lg bg-[#EBF5FB] hover:bg-[#DFF0FA] border border-[#D0E6F6] text-[#1B3A57] flex items-center justify-center gap-1 transition cursor-pointer group"
          >
            <Receipt size={11} className="shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold tracking-tight truncate">
              Purchases • OCR
            </span>
          </button>

          {/* PILL 3: SOFT LILAC (CUSTOMER DENI) */}
          <button
            onClick={() => {
              setActiveActionPill("deni");
              setToastNote("Customer Deni Ledger: Track debtor balances and KYC phone numbers.");
              setTimeout(() => setToastNote(null), 3000);
            }}
            className="py-1 px-1.5 rounded-lg bg-[#F4EFFB] hover:bg-[#ECE3F8] border border-[#E1D3F5] text-[#341F54] flex items-center justify-center gap-1 transition cursor-pointer group"
          >
            <ArrowLeftRight size={11} className="shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold tracking-tight truncate">
              Customer Deni
            </span>
          </button>

          {/* PILL 4: WARM PEACH (SUPPLIERS & KYC) */}
          <button
            onClick={() => {
              setActiveActionPill("suppliers");
              setToastNote("Suppliers & KYC: Driver phone numbers & Kenyan National ID OTC rails.");
              setTimeout(() => setToastNote(null), 3000);
            }}
            className="py-1 px-1.5 rounded-lg bg-[#FDF4EB] hover:bg-[#FAECDF] border border-[#F6DFCB] text-[#4A2D16] flex items-center justify-center gap-1 transition cursor-pointer group"
          >
            <Truck size={11} className="shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold tracking-tight truncate">
              Suppliers &amp; KYC
            </span>
          </button>

        </div>

        {/* SECTION: "INSIGHTS FOR YOU" + "CUSTOMIZE" BUTTON (FLATTENED) */}
        <div className="relative z-10 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-serif font-semibold text-slate-900 tracking-tight">
            Insights for you
          </h3>

          <button
            onClick={() => {
              setToastNote("Customize: Reorder widgets, adjust reporting filters, and set target margin thresholds.");
              setTimeout(() => setToastNote(null), 3000);
            }}
            className="px-2 py-0.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-[9.5px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs transition cursor-pointer"
          >
            <SlidersHorizontal size={10} className="text-slate-600" />
            <span>Customize</span>
          </button>
        </div>

        {/* 2-COLUMN GRID: EXPENSES BREAKDOWN + CASHFLOW (FLATTENED) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-2">
          
          {/* ------------------------------------------------------------------- */}
          {/* CARD 1: EXPENSES BREAKDOWN                                          */}
          {/* ------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs flex flex-col justify-between space-y-1.5">
            
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">
                Expenses breakdown
              </h4>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={onLaunchWorkspace}
                  className="px-2 py-0.2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-[9.5px] font-semibold transition cursor-pointer"
                >
                  View report
                </button>
                <div className="flex items-center gap-0.5 text-[9.5px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.2 cursor-pointer">
                  <span>YTD</span>
                  <ChevronDown size={9} />
                </div>
              </div>
            </div>

            {/* Split layout: Legend on Left, Donut on Right */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              
              {/* Legend list */}
              <div className="sm:col-span-7 space-y-0.5">
                {expenseSegments.map((seg) => (
                  <div 
                    key={seg.id}
                    onMouseEnter={() => setHoveredExpenseSegment(seg.id)}
                    onMouseLeave={() => setHoveredExpenseSegment(null)}
                    className={`flex items-center justify-between text-[10px] py-0.2 px-1 rounded transition-colors cursor-pointer ${
                      hoveredExpenseSegment === seg.id ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span 
                        className="w-2 h-2 rounded-xs shrink-0" 
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="font-semibold text-slate-800 text-[10px]">{seg.pct}%</span>
                      <span className="text-slate-600 text-[9.5px] truncate">{seg.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pl-1">
                      <span className="font-mono text-slate-700 text-[9.5px]">{seg.amount}</span>
                      {seg.hasAlert && (
                        <AlertCircle size={10} className="text-amber-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Donut Chart SVG (Compact) */}
              <div className="sm:col-span-5 flex items-center justify-center">
                <div className="relative" style={{ width: size, height: size }}>
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                    <defs>
                      <pattern id="landingHatchPattern" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="4" stroke="#94A3B8" strokeWidth="1.5" />
                      </pattern>
                    </defs>

                    {expenseSegments.map((seg) => {
                      const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -cumulativeOffset;
                      cumulativeOffset += (seg.pct / 100) * circumference;
                      const isHovered = hoveredExpenseSegment === seg.id;

                      return (
                        <circle
                          key={seg.id}
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="transparent"
                          stroke={seg.isHatched ? "url(#landingHatchPattern)" : seg.color}
                          strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setHoveredExpenseSegment(seg.id)}
                          onMouseLeave={() => setHoveredExpenseSegment(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Inner text inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider leading-none">
                      Total
                    </span>
                    <span className="text-[11px] font-serif font-bold text-slate-900 mt-0.5 leading-none">
                      KSh 157.8K
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom summary text */}
            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-500">
              <span>Financial discipline</span>
              <span className="text-emerald-700 font-semibold">94% Audited</span>
            </div>

          </div>

          {/* ------------------------------------------------------------------- */}
          {/* CARD 2: CASHFLOW                                                    */}
          {/* ------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs flex flex-col justify-between space-y-1.5">
            
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900">
                Cashflow
              </h4>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={onLaunchWorkspace}
                  className="px-2 py-0.2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-[9.5px] font-semibold transition cursor-pointer"
                >
                  View report
                </button>
                <div className="flex items-center gap-0.5 text-[9.5px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.2 cursor-pointer">
                  <span>30 days</span>
                  <ChevronDown size={9} />
                </div>
              </div>
            </div>

            {/* Legend: Inflow / Outflow / Net change */}
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-[#10B981]" />
                <span className="text-slate-700 font-medium">Inflow</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs border border-slate-400 bg-slate-200" />
                <span className="text-slate-700 font-medium">Outflow</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-1 bg-[#EA580C] rounded-full inline-block" />
                <span className="w-1.5 h-1.5 rounded-full border border-[#EA580C] bg-white -ml-1.5" />
                <span className="text-slate-700 font-medium ml-0.5">Net</span>
              </div>
            </div>

            {/* SVG Bar & Line Chart (Flattened height) */}
            <div className="w-full h-24 relative flex flex-col justify-end">
              
              {/* Y-Axis Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] font-mono text-slate-400">
                <div className="border-b border-dashed border-slate-200 flex justify-between">
                  <span>$40K</span>
                </div>
                <div className="border-b border-dashed border-slate-200 flex justify-between">
                  <span>$20K</span>
                </div>
                <div className="border-b border-slate-200 flex justify-between">
                  <span>$0</span>
                </div>
              </div>

              {/* Chart Columns */}
              <div className="relative z-10 w-full h-20 flex items-end justify-between gap-0.5 pt-2">
                {cashflowDays.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      {/* Inflow bar */}
                      <div 
                        className="w-1 sm:w-1.5 bg-[#10B981] rounded-t-xs transition-all duration-500" 
                        style={{ height: `${(item.inflow / 60) * 100}%` }}
                        title={`${item.day} Inflow: KSh ${(item.inflow * 1000).toLocaleString()}`}
                      />
                      {/* Outflow bar */}
                      <div 
                        className="w-1 sm:w-1.5 bg-slate-300 rounded-t-xs transition-all duration-500" 
                        style={{ height: `${(item.outflow / 60) * 100}%` }}
                        title={`${item.day} Outflow: KSh ${(item.outflow * 1000).toLocaleString()}`}
                      />
                    </div>
                    {/* Day label */}
                    <span className="text-[7.5px] font-mono text-slate-400 mt-0.5 truncate">
                      {item.day.replace("Apr ", "")}
                    </span>
                  </div>
                ))}

                {/* Net change orange trendline */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#EA580C"
                    strokeWidth="1.5"
                    points={cashflowDays.map((d, i) => {
                      const x = (i / (cashflowDays.length - 1)) * 100;
                      const y = 100 - (d.net / 50) * 75;
                      return `${x}%,${y}%`;
                    }).join(" ")}
                  />
                  {cashflowDays.map((d, i) => {
                    const x = (i / (cashflowDays.length - 1)) * 100;
                    const y = 100 - (d.net / 50) * 75;
                    return (
                      <circle
                        key={i}
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="2.5"
                        fill="#FFFFFF"
                        stroke="#EA580C"
                        strokeWidth="1"
                      />
                    );
                  })}
                </svg>
              </div>

            </div>

            {/* Bottom summary text */}
            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-500">
              <span>Daily liquidity</span>
              <span className="text-blue-700 font-semibold">+23% Month</span>
            </div>

          </div>

        </div>

        {/* 5. FOOTER LINK IN DASHBOARD */}
        <div className="relative z-10 pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-500 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>Private enterprise ledger • 100% encrypted &amp; private</span>
          </div>

          <button
            onClick={onLaunchWorkspace}
            className="text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Launch real workspace</span>
            <ArrowRight size={11} />
          </button>
        </div>

      </div>

      </div>

    </div>
  );
}
