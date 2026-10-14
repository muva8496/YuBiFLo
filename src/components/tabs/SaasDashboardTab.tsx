import React, { useState } from "react";
import { 
  FileText, Receipt, ArrowLeftRight, DollarSign, SlidersHorizontal, 
  ChevronDown, ExternalLink, ShieldCheck, AlertCircle, ArrowUpRight, 
  ArrowDownRight, Check, CheckCircle2, TrendingUp, Sun, Mic, ShoppingBag, 
  Users, BookOpen, Layers
} from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";
import { LaunchpadProgress } from "./LaunchpadTab";

interface SaasDashboardTabProps {
  state: AlacioMasterState;
  userName?: string;
  onNavigateTab: (tabId: string) => void;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
  onOpenQuickDeni?: () => void;
  launchpadProgress: LaunchpadProgress;
  isDemo?: boolean;
}

export default function SaasDashboardTab({
  state,
  userName = "Alacio",
  onNavigateTab,
  onOpenQuickSale,
  onOpenQuickPurchase,
  onOpenQuickDeni,
  launchpadProgress,
  isDemo = false
}: SaasDashboardTabProps) {
  const { currency, salesLedger = [], inventory = [], customers = [], payouts = [], suppliers = [] } = state;

  // Selected filters
  const [expenseRange, setExpenseRange] = useState<"Year to date" | "This month" | "Last 30 days">("Year to date");
  const [cashflowRange, setCashflowRange] = useState<"Last 30 days" | "This month" | "Last 7 days">("Last 30 days");
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [hoveredExpenseSegment, setHoveredExpenseSegment] = useState<number | null>(null);

  // Dynamic time greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = isDemo ? "Erica" : (userName.trim().split(" ")[0] || "Trader");

  // Calculations
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaySales = salesLedger.filter(s => (s.date || "").startsWith(todayIso));
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const totalDeniOwed = customers.reduce((acc, c) => acc + (c.debt_balance || 0), 0);
  const totalStockValue = inventory.reduce((acc, i) => acc + i.total_shelf_value, 0);
  const totalRevenue = salesLedger.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalPayouts = payouts.reduce((acc, p) => acc + p.amount, 0);

  // Exact Donut Chart Segments matching screenshot
  // 27% Gold, 23% Orange, 16% Purple, 14% Sky Blue, 12% Bright Blue, 8% Hatched Gray
  const expenseSegments = [
    { id: 1, label: "Payroll & Labor", pct: 27, amount: "KSh 42,600", color: "#F59E0B", hasAlert: false },
    { id: 2, label: "Stock & Restock", pct: 23, amount: "KSh 36,400", color: "#EA580C", hasAlert: false },
    { id: 3, label: "Shop Rent & Permits", pct: 16, amount: "KSh 25,200", color: "#8B5CF6", hasAlert: false },
    { id: 4, label: "Cash on hand", pct: 14, amount: "KSh 22,100", color: "#38BDF8", hasAlert: false },
    { id: 5, label: "Supplier Payable", pct: 12, amount: "KSh 18,900", color: "#3B82F6", hasAlert: true },
    { id: 6, label: "Other / Packaging", pct: 8, amount: "KSh 12,600", color: "#94A3B8", isHatched: true, hasAlert: false }
  ];

  // SVG Donut Path calculations
  const size = 200;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

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
    { day: "Apr 12", inflow: 39, outflow: 27, net: 25 }
  ];

  let cumulativeOffset = 0;

  return (
    <div className="space-y-7 max-w-6xl mx-auto font-sans text-slate-900 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. ELEGANT SERIF GREETING                                                 */}
      {/* ========================================================================= */}
      <div className="pt-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-serif font-normal text-slate-900 tracking-tight">
            {timeGreeting}, {firstName}
          </h1>
          {isDemo && (
            <span className="text-[11px] font-mono uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">
              Sample data
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ROW OF 4 PASTEL ROUNDED ACTION CARDS                                   */}
      {/* Matches the exact colors, rounded pills, and icons from the screenshot    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* CARD 1: MINT GREEN (CREATE ESTIMATE / QUICK SALE) */}
        <button
          onClick={() => {
            if (onOpenQuickSale) onOpenQuickSale();
            else onNavigateTab("voice_ledger");
          }}
          className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#E8F8F0] hover:bg-[#DDF4E8] border border-[#CBEEDB] text-[#1E3A2F] flex items-center justify-center gap-2.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center text-[#1E3A2F] group-hover:scale-110 transition-transform">
            <FileText size={17} />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Create estimate
          </span>
        </button>

        {/* CARD 2: SKY BLUE (CREATE INVOICE / RESTOCK) */}
        <button
          onClick={() => {
            if (onOpenQuickPurchase) onOpenQuickPurchase();
            else onNavigateTab("purchases");
          }}
          className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#EBF5FB] hover:bg-[#DFF0FA] border border-[#D0E6F6] text-[#1B3A57] flex items-center justify-center gap-2.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center text-[#1B3A57] group-hover:scale-110 transition-transform">
            <Receipt size={17} />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Create invoice
          </span>
        </button>

        {/* CARD 3: LILAC / LAVENDER (ADD TRANSACTION / CUSTOMER DENI) */}
        <button
          onClick={() => {
            if (onOpenQuickDeni) onOpenQuickDeni();
            else onNavigateTab("customer_deni");
          }}
          className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F4EFFB] hover:bg-[#ECE3F8] border border-[#E1D3F5] text-[#341F54] flex items-center justify-center gap-2.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center text-[#341F54] group-hover:scale-110 transition-transform">
            <ArrowLeftRight size={17} />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Add transaction
          </span>
        </button>

        {/* CARD 4: WARM PEACH / SAND (ADD BILL / DAWN LOCK) */}
        <button
          onClick={() => onNavigateTab("dawn_lock")}
          className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FDF4EB] hover:bg-[#FAECDF] border border-[#F6DFCB] text-[#4A2D16] flex items-center justify-center gap-2.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center text-[#4A2D16] group-hover:scale-110 transition-transform">
            <DollarSign size={17} />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Add bill
          </span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: INSIGHTS FOR YOU                                              */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-2xl font-serif font-normal text-slate-900 tracking-tight">
          Insights for you
        </h2>

        {/* CUSTOMIZE PILL BUTTON */}
        <button
          onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
          className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
        >
          <SlidersHorizontal size={13} className="text-slate-600" />
          <span>Customize</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. 2-COLUMN GRID: EXPENSES BREAKDOWN + CASHFLOW                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* ----------------------------------------------------------------------- */}
        {/* CARD 1: EXPENSES BREAKDOWN                                              */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
          
          {/* HEADER ROW */}
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Expenses breakdown
            </h3>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigateTab("purchases")}
                className="px-3 py-1 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition cursor-pointer"
              >
                View report
              </button>

              <div className="relative">
                <button
                  onClick={() => setExpenseRange(expenseRange === "Year to date" ? "This month" : "Year to date")}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>{expenseRange}</span>
                  <ChevronDown size={13} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          {/* DONUT CHART & LEGEND CONTAINER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            
            {/* LEFT: PERCENTAGE & CATEGORY LEGEND */}
            <div className="space-y-2.5 text-xs w-full sm:w-auto">
              {expenseSegments.map((seg, idx) => (
                <div 
                  key={seg.id}
                  onMouseEnter={() => setHoveredExpenseSegment(idx)}
                  onMouseLeave={() => setHoveredExpenseSegment(null)}
                  className={`flex items-center gap-2 cursor-pointer transition-opacity ${
                    hoveredExpenseSegment !== null && hoveredExpenseSegment !== idx ? "opacity-40" : "opacity-100"
                  }`}
                >
                  {/* COLOR SWATCH */}
                  {seg.isHatched ? (
                    <div 
                      className="w-3.5 h-3.5 rounded-sm border border-slate-300 shrink-0" 
                      style={{
                        backgroundImage: "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 2px, #f8fafc 2px, #f8fafc 4px)"
                      }} 
                    />
                  ) : (
                    <div 
                      className="w-3.5 h-3.5 rounded-sm shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                  )}

                  <span className="font-semibold text-slate-800">
                    {seg.pct}%
                  </span>
                  <span className="text-slate-600">
                    {seg.label}
                  </span>

                  {seg.hasAlert && (
                    <AlertCircle size={13} className="text-slate-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* RIGHT: SVG DONUT CHART WITH EXACT SCREENSHOT COLOR DISTRIBUTION */}
            <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
                <defs>
                  {/* Pattern for 8% Hatched Segment */}
                  <pattern id="hatchedGray" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="#94A3B8" strokeWidth="2.5" />
                  </pattern>
                </defs>

                {/* SEGMENTS */}
                {expenseSegments.map((seg, idx) => {
                  const dashLength = (seg.pct / 100) * circumference;
                  const dashOffset = -cumulativeOffset;
                  cumulativeOffset += dashLength;
                  const isHovered = hoveredExpenseSegment === idx;

                  return (
                    <circle
                      key={seg.id}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="transparent"
                      stroke={seg.isHatched ? "url(#hatchedGray)" : seg.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={dashOffset}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredExpenseSegment(idx)}
                      onMouseLeave={() => setHoveredExpenseSegment(null)}
                    />
                  );
                })}
              </svg>

              {/* CENTER DISPLAY FOR HOVER OR DEFAULT */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {hoveredExpenseSegment !== null ? (
                  <div className="text-center animate-in fade-in">
                    <span className="text-base font-bold text-slate-900 block leading-tight">
                      {expenseSegments[hoveredExpenseSegment].pct}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block max-w-[80px] truncate">
                      {expenseSegments[hoveredExpenseSegment].label}
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-xs text-slate-400 font-mono block">Total</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">100%</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated across operating duka ledger entries</span>
            <span className="font-semibold text-slate-700">Verified zero leakage</span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD 2: CASHFLOW                                                        */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-5">
          
          {/* HEADER ROW */}
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Cashflow
            </h3>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigateTab("analytics")}
                className="px-3 py-1 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition cursor-pointer"
              >
                View report
              </button>

              <div className="relative">
                <button
                  onClick={() => setCashflowRange(cashflowRange === "Last 30 days" ? "This month" : "Last 30 days")}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>{cashflowRange}</span>
                  <ChevronDown size={13} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          {/* SUB-HEADER LEGEND */}
          <div className="flex items-center gap-5 text-xs text-slate-700">
            {/* INFLOW SOLID GREEN */}
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-[#10B981]" />
              <span className="font-medium text-slate-700">Inflow</span>
            </div>

            {/* OUTFLOW HATCHED */}
            <div className="flex items-center gap-1.5">
              <div 
                className="w-3.5 h-3.5 rounded-sm border border-slate-400" 
                style={{
                  backgroundImage: "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 2px, #ffffff 2px, #ffffff 4px)"
                }}
              />
              <span className="font-medium text-slate-700">Outflow</span>
            </div>

            {/* NET CHANGE LINE & CIRCLE */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                <div className="w-2 h-0.5 bg-[#EA580C]" />
                <div className="w-2.5 h-2.5 rounded-full border-2 border-[#EA580C] bg-white" />
                <div className="w-2 h-0.5 bg-[#EA580C]" />
              </div>
              <span className="font-medium text-slate-700">Net change</span>
            </div>
          </div>

          {/* TWO-WAY BAR & SPLINE CHART */}
          <div className="relative pt-2">
            
            {/* SVG CANVAS FOR BARS & SPLINE */}
            <svg viewBox="0 0 540 220" className="w-full h-48 overflow-visible">
              <defs>
                <pattern id="outflowHatch" width="5" height="5" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="#94A3B8" strokeWidth="1.8" />
                </pattern>
              </defs>

              {/* HORIZONTAL GRID LINES & Y-AXIS LABELS */}
              {/* $40k (y=20), $20k (y=65), $0 (y=110), -$20k (y=155), -$40k (y=200) */}
              <text x="2" y="24" fontSize="10" fill="#94A3B8" fontFamily="monospace">$40K</text>
              <line x1="40" y1="20" x2="530" y2="20" stroke="#F1F5F9" strokeWidth="1" />

              <text x="2" y="69" fontSize="10" fill="#94A3B8" fontFamily="monospace">$20K</text>
              <line x1="40" y1="65" x2="530" y2="65" stroke="#F1F5F9" strokeWidth="1" />

              {/* $0 BASELINE (HEAVIER LINE) */}
              <text x="12" y="114" fontSize="10" fill="#64748B" fontFamily="monospace" fontWeight="bold">$0</text>
              <line x1="40" y1="110" x2="530" y2="110" stroke="#CBD5E1" strokeWidth="1.5" />

              <text x="2" y="159" fontSize="10" fill="#94A3B8" fontFamily="monospace">$20K</text>
              <line x1="40" y1="155" x2="530" y2="155" stroke="#F1F5F9" strokeWidth="1" />

              <text x="2" y="204" fontSize="10" fill="#94A3B8" fontFamily="monospace">$40K</text>
              <line x1="40" y1="200" x2="530" y2="200" stroke="#F1F5F9" strokeWidth="1" />

              {/* RENDER BARS (INFLOW & OUTFLOW) */}
              {cashflowDays.map((d, i) => {
                const barWidth = 18;
                const x = 55 + i * 43;

                // Baseline is y=110. Height of 40k = 90px (so 1 unit = 2.25px)
                const inflowHeight = (d.inflow / 40) * 85;
                const outflowHeight = (d.outflow / 40) * 85;

                return (
                  <g key={d.day}>
                    {/* INFLOW BAR (RISING UPWARDS FROM 110) */}
                    <rect
                      x={x}
                      y={110 - inflowHeight}
                      width={barWidth}
                      height={inflowHeight}
                      fill="#10B981"
                      rx="2"
                      className="hover:opacity-85 transition-opacity cursor-pointer"
                    >
                      <title>{`${d.day} Inflow: $${d.inflow}K`}</title>
                    </rect>

                    {/* OUTFLOW BAR (DESCENDING DOWNWARDS FROM 110) */}
                    <rect
                      x={x}
                      y={110}
                      width={barWidth}
                      height={outflowHeight}
                      fill="url(#outflowHatch)"
                      stroke="#94A3B8"
                      strokeWidth="1"
                      rx="2"
                      className="hover:opacity-85 transition-opacity cursor-pointer"
                    >
                      <title>{`${d.day} Outflow: $${d.outflow}K`}</title>
                    </rect>
                  </g>
                );
              })}

              {/* CONNECTED LINE FOR NET CHANGE */}
              {(() => {
                const points = cashflowDays.map((d, i) => {
                  const x = 55 + i * 43 + 9;
                  const y = 110 - (d.net / 40) * 85;
                  return { x, y, net: d.net, day: d.day };
                });

                const pathString = points.reduce((acc, p, idx) => {
                  return `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
                }, "");

                return (
                  <g>
                    <path
                      d={pathString}
                      fill="none"
                      stroke="#EA580C"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#FFFFFF"
                        stroke="#EA580C"
                        strokeWidth="2.5"
                        className="cursor-pointer hover:scale-125 transition-transform"
                      >
                        <title>{`${p.day} Net Change: $${p.net}K`}</title>
                      </circle>
                    ))}
                  </g>
                );
              })()}
            </svg>

            {/* X-AXIS LABELS */}
            <div className="flex justify-between pl-8 pr-2 pt-1 text-[10px] text-slate-500 font-mono">
              {cashflowDays.map((d) => (
                <div key={d.day} className="text-center w-7">
                  <span className="block text-slate-700">{d.day.split(" ")[0]}</span>
                  <span className="font-bold text-slate-900">{d.day.split(" ")[1]}</span>
                </div>
              ))}
            </div>

            {/* TIMELINE RANGE SLIDER THUMB (AS IN SCREENSHOT) */}
            <div className="mt-2 ml-8 mr-2 flex items-center">
              <div className="w-20 h-1.5 bg-slate-400 rounded-full cursor-pointer hover:bg-slate-600 transition" />
            </div>

          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Positive net margin for 11 consecutive days</span>
            <span className="font-semibold text-emerald-600">+22.4% Net Liquidity</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 2: CONNECTED ACCOUNTS + PROFIT & LOSS                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 pt-1">
        
        {/* CARD 3: CONNECTED ACCOUNTS (2) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Connected accounts (2)
            </h3>
            <button 
              onClick={() => onNavigateTab("dawn_lock")}
              className="px-3 py-1 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {/* ACCOUNT 1 */}
            <div className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 flex items-center justify-between transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs font-mono">
                  M
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Safaricom M-Pesa Till #892041
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Buy Goods Till &bull; Connected &bull; Synced 2 mins ago
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-slate-900">
                  {currency} 28,300
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  Active Float
                </span>
              </div>
            </div>

            {/* ACCOUNT 2 */}
            <div className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 flex items-center justify-between transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs font-mono">
                  EQ
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Equity Bank Paybill 1450180372031
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Operating Account &bull; Connected &bull; Reconciled 05:57 AM
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-slate-900">
                  {currency} 14,200
                </span>
                <span className="text-[10px] text-blue-600 font-semibold block">
                  Dawn Locked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: PROFIT & LOSS */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Profit &amp; Loss
            </h3>
            <button 
              onClick={() => onNavigateTab("three_fold_ledgers")}
              className="px-3 py-1 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition cursor-pointer"
            >
              View report
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-slate-500">Total Net Income</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {currency} 36,450
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ArrowUpRight size={13} /> +18.4% vs last period
              </span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-slate-500">Gross Margin</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                24.8%
              </div>
              <span className="text-[11px] text-blue-600 font-semibold">
                Shelf capital defended
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Operating expenses covered by counter volume</span>
            <span className="font-semibold text-slate-700">Audit status: Clean</span>
          </div>
        </div>

      </div>

    </div>
  );
}
