import React, { useState } from "react";
import { 
  FileText, Receipt, ArrowLeftRight, DollarSign, SlidersHorizontal, 
  ChevronDown, ExternalLink, ShieldCheck, AlertCircle, ArrowUpRight, 
  ArrowDownRight, Check, CheckCircle2, TrendingUp, Sun, Mic, ShoppingBag, 
  Users, BookOpen, Layers, Truck, Camera, Sparkles, ArrowRight, Wallet, Plus, Home, Car, Coffee, UserMinus
} from "lucide-react";
import { AlacioMasterState, PayoutOrDrawing } from "../../types/alacio";
import { LaunchpadProgress } from "./LaunchpadTab";

interface SaasDashboardTabProps {
  state: AlacioMasterState;
  userName?: string;
  onNavigateTab: (tabId: string) => void;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
  onOpenQuickDeni?: () => void;
  onAddExpense?: (expense: PayoutOrDrawing) => void;
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
  onAddExpense,
  launchpadProgress,
  isDemo = false
}: SaasDashboardTabProps) {
  const { currency, salesLedger = [], inventory = [], customers = [], payouts = [], suppliers = [] } = state;

  // Selected filters
  const [expenseRange, setExpenseRange] = useState<"Year to date" | "This month" | "Last 30 days">("Year to date");
  const [cashflowRange, setCashflowRange] = useState<"Last 30 days" | "This month" | "Last 7 days">("Last 30 days");
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [hoveredExpenseSegment, setHoveredExpenseSegment] = useState<number | null>(null);

  // Quick Owner Expense & Withdrawal state on Dashboard
  const [quickExpCategory, setQuickExpCategory] = useState<"RENT" | "MISC" | "TRAVEL" | "PERSONAL_WITHDRAWAL">("RENT");
  const [quickExpAmount, setQuickExpAmount] = useState("");
  const [quickExpNote, setQuickExpNote] = useState("");
  const [quickExpChannel, setQuickExpChannel] = useState<"CASH_DRAWER" | "MPESA_TILL">("CASH_DRAWER");
  const [quickExpFeedback, setQuickExpFeedback] = useState<string | null>(null);

  const handleQuickDashboardExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(quickExpAmount);
    if (isNaN(num) || num <= 0 || !onAddExpense) return;
    const catLabels: Record<string, string> = {
      RENT: "Rent",
      MISC: "Misc",
      TRAVEL: "Travel",
      PERSONAL_WITHDRAWAL: "Personal Withdrawal"
    };
    const shortLabel = catLabels[quickExpCategory] || "Misc";
    const newRecord: PayoutOrDrawing = {
      id: `exp_dash_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString().slice(0, 10),
      amount: Math.round(num * 100) / 100,
      type: quickExpCategory === "PERSONAL_WITHDRAWAL" ? "OWNER_DRAWING" : "BUSINESS_EXPENSE",
      expense_category: quickExpCategory,
      notes: `[${shortLabel}] ${quickExpNote.trim() || `${shortLabel} noted by owner`}`,
      payment_channel: quickExpChannel
    };
    onAddExpense(newRecord);
    setQuickExpAmount("");
    setQuickExpNote("");
    setQuickExpFeedback(`✓ Noted ${shortLabel}: ${currency} ${newRecord.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
    setTimeout(() => setQuickExpFeedback(null), 4500);
  };

  // Dynamic time greeting & real current date (e.g. Oct 17, 2026)
  const now = new Date();
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = isDemo
    ? "Musa"
    : (userName && userName !== "Trader" && userName !== "Alacio"
        ? userName.trim().split(" ")[0]
        : (state.merchant_name ? state.merchant_name.trim().split(" ")[0] : "Musa"));
  const merchantDisplayName = isDemo
    ? "Duka Space (Demo Sandbox)"
    : (state.merchant_name || "Musa General Retailers");

  const todayIso = now.toISOString().slice(0, 10); // YYYY-MM-DD (e.g. 2026-10-17)
  const currentMonthPrefix = todayIso.slice(0, 7); // YYYY-MM (e.g. 2026-10)
  const currentYearPrefix = todayIso.slice(0, 4);  // YYYY (e.g. 2026)
  const todayReadable = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const todayShortLabel = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
  const currentMonthName = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  // Real Ledger Calculations
  const todaySales = salesLedger.filter(s => (s.date || s.timestamp?.slice(0, 10) || "") === todayIso);
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);

  const totalDeniOwed = customers.reduce((acc, c) => acc + (Number(c.debt_balance) || 0), 0);
  const totalStockValue = inventory.reduce((acc, i) => acc + (Number(i.total_shelf_value) || (Number(i.current_stock) || 0) * (Number(i.unit_retail) || 0)), 0);
  const totalStockCost = inventory.reduce((acc, i) => acc + ((Number(i.current_stock) || 0) * (Number(i.unit_cost) || 0)), 0);
  const totalPotentialProfit = Math.max(0, totalStockValue - totalStockCost);
  const totalRevenue = salesLedger.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
  const totalPayouts = payouts.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const approvedReceipts = (state.receiptsArchive || []).filter(r => r.status === "approved");

  // Helper to check if a date string falls in selected expenseRange
  const isDateInExpenseRange = (dateStr?: string) => {
    const d = (dateStr || todayIso).slice(0, 10);
    if (expenseRange === "This month") {
      return d.startsWith(currentMonthPrefix);
    }
    if (expenseRange === "Last 30 days") {
      const diffMs = now.getTime() - new Date(d).getTime();
      return diffMs >= -86400000 && diffMs <= 30 * 86400000;
    }
    // "Year to date"
    return d.startsWith(currentYearPrefix);
  };

  // Real Expense & Outflow Breakdown Calculation
  const filteredPayouts = payouts.filter(p => isDateInExpenseRange(p.date || p.timestamp));
  const filteredReceipts = approvedReceipts.filter(r => isDateInExpenseRange(r.receiptDate || r.decidedAt));

  let rentAndUtilitiesAmt = 0;
  let personalWithdrawalsAmt = 0;
  let travelAndTransportAmt = 0;
  let wagesAndLaborAmt = 0;
  let miscAndPermitsAmt = 0;
  let supplierPayoutsAmt = 0;

  filteredPayouts.forEach(p => {
    const amt = Number(p.amount) || 0;
    const cat = p.expense_category;
    const notesLower = (p.notes || "").toLowerCase();

    if (p.type === "SUPPLIER_PAYOUT") {
      supplierPayoutsAmt += amt;
    } else if (p.type === "OWNER_DRAWING" || cat === "PERSONAL_WITHDRAWAL" || notesLower.includes("[personal withdrawal]")) {
      personalWithdrawalsAmt += amt;
    } else if (cat === "RENT" || cat === "UTILITIES" || notesLower.includes("[rent]") || notesLower.includes("[utilities]") || notesLower.includes("rent") || notesLower.includes("kplc")) {
      rentAndUtilitiesAmt += amt;
    } else if (cat === "TRAVEL" || notesLower.includes("[travel]") || notesLower.includes("boda") || notesLower.includes("fare") || notesLower.includes("transport")) {
      travelAndTransportAmt += amt;
    } else if (cat === "WAGES" || notesLower.includes("[wages]") || notesLower.includes("wage") || notesLower.includes("casual") || notesLower.includes("payroll")) {
      wagesAndLaborAmt += amt;
    } else {
      miscAndPermitsAmt += amt;
    }
  });

  // Include approved receipt purchases if not already duplicated in supplier payouts, or active stock cost if no supplier payouts yet
  const receiptsTotalCost = filteredReceipts.reduce((acc, r) => acc + (Number(r.totalCost) || 0), 0);
  const effectiveStockPurchasesAmt = Math.max(supplierPayoutsAmt, receiptsTotalCost, (!isDemo && supplierPayoutsAmt === 0 && receiptsTotalCost === 0 ? totalStockCost : 0));
  const ownerExpensesTotalAmt = rentAndUtilitiesAmt + personalWithdrawalsAmt + travelAndTransportAmt + miscAndPermitsAmt;

  const realRawSegments = [
    { id: 1, label: "Stock & Restock", rawAmount: effectiveStockPurchasesAmt, color: "#EA580C", hasAlert: false, isHatched: false },
    { id: 2, label: "Owner Expenses (Rent, Misc, Travel)", rawAmount: rentAndUtilitiesAmt + travelAndTransportAmt + miscAndPermitsAmt, color: "#6366F1", hasAlert: false, isHatched: false },
    { id: 3, label: "Personal Withdrawals", rawAmount: personalWithdrawalsAmt, color: "#F59E0B", hasAlert: personalWithdrawalsAmt > 5000, isHatched: false },
    { id: 4, label: "Shop Rent & Utilities", rawAmount: rentAndUtilitiesAmt, color: "#8B5CF6", hasAlert: false, isHatched: false },
    { id: 5, label: "Wages & Labor", rawAmount: wagesAndLaborAmt, color: "#3B82F6", hasAlert: false, isHatched: false },
    { id: 6, label: "Travel & Misc Upkeep", rawAmount: travelAndTransportAmt + miscAndPermitsAmt, color: "#94A3B8", hasAlert: false, isHatched: true }
  ];

  const totalRealExpensesBreakdown = effectiveStockPurchasesAmt + ownerExpensesTotalAmt + wagesAndLaborAmt;

  const expenseSegments = isDemo
    ? [
        { id: 1, label: "Payroll & Labor", pct: 25, rawAmount: 39450, amount: `${currency} 39,450`, color: "#F59E0B", hasAlert: false, isHatched: false },
        { id: 2, label: "Stock & Restock", pct: 23, rawAmount: 36400, amount: `${currency} 36,400`, color: "#EA580C", hasAlert: false, isHatched: false },
        { id: 3, label: "Owner Expenses (Rent, Misc, Travel)", pct: 18, rawAmount: 28350, amount: `${currency} 28,350`, color: "#6366F1", hasAlert: false, isHatched: false },
        { id: 4, label: "Personal Withdrawals", pct: 14, rawAmount: 22100, amount: `${currency} 22,100`, color: "#38BDF8", hasAlert: false, isHatched: false },
        { id: 5, label: "Supplier Payable", pct: 12, rawAmount: 18900, amount: `${currency} 18,900`, color: "#3B82F6", hasAlert: true, isHatched: false },
        { id: 6, label: "Other / Packaging", pct: 8, rawAmount: 12600, amount: `${currency} 12,600`, color: "#94A3B8", isHatched: true, hasAlert: false }
      ]
    : (() => {
        if (totalRealExpensesBreakdown <= 0) {
          return realRawSegments.map(seg => ({
            ...seg,
            pct: 0,
            amount: `${currency} 0`
          }));
        }
        const sumSegments = realRawSegments.reduce((a, b) => a + b.rawAmount, 0) || 1;
        let runningPct = 0;
        const nonZeroIndices = realRawSegments.map((s, idx) => (s.rawAmount > 0 ? idx : -1)).filter(i => i !== -1);
        const lastNonZeroIdx = nonZeroIndices.length > 0 ? nonZeroIndices[nonZeroIndices.length - 1] : -1;

        return realRawSegments.map((seg, idx) => {
          let pct = 0;
          if (seg.rawAmount > 0) {
            if (idx === lastNonZeroIdx) {
              pct = Math.max(1, 100 - runningPct);
            } else {
              pct = Math.max(1, Math.round((seg.rawAmount / sumSegments) * 100));
              runningPct += pct;
            }
          }
          return {
            ...seg,
            pct,
            amount: `${currency} ${seg.rawAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
          };
        });
      })();

  const displayedTotalExpenseBreakdown = isDemo ? 157800 : totalRealExpensesBreakdown;

  // SVG Donut Path calculations
  const size = 160;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Dynamic 11-day cashflow timeline ending TODAY (e.g. Oct 7 to Oct 17)
  const demoPattern = [
    { inflow: 36000, outflow: 24000, net: 12000 },
    { inflow: 29000, outflow: 18000, net: 11000 },
    { inflow: 51000, outflow: 32000, net: 19000 },
    { inflow: 43000, outflow: 36000, net: 7000 },
    { inflow: 39000, outflow: 26000, net: 13000 },
    { inflow: 48000, outflow: 34000, net: 14000 },
    { inflow: 36000, outflow: 24000, net: 12000 },
    { inflow: 28000, outflow: 18000, net: 10000 },
    { inflow: 50000, outflow: 36000, net: 14000 },
    { inflow: 43000, outflow: 34000, net: 9000 },
    { inflow: 39000, outflow: 27000, net: 12000 }
  ];

  const cashflowDays = Array.from({ length: 11 }, (_, idx) => {
    const daysAgo = 10 - idx;
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const isoDate = d.toISOString().slice(0, 10);
    const monthShort = d.toLocaleDateString("en-US", { month: "short" });
    const dayNum = d.getDate();
    const dayLabel = `${monthShort} ${dayNum}`;

    if (isDemo) {
      const pat = demoPattern[idx];
      return {
        isoDate,
        day: dayLabel,
        isToday: daysAgo === 0,
        inflow: pat.inflow,
        outflow: pat.outflow,
        net: pat.net
      };
    }

    // Real client daily inflow from salesLedger on isoDate
    const dayInflow = salesLedger
      .filter(s => (s.date || s.timestamp?.slice(0, 10) || "") === isoDate)
      .reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);

    // Real client daily outflow from payouts + non-duplicated approved receipts on isoDate
    const dayPayouts = payouts.filter(p => (p.date || p.timestamp?.slice(0, 10) || "") === isoDate);
    const dayPayoutsTotal = dayPayouts.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const hasSupplierPayoutOnDay = dayPayouts.some(p => p.type === "SUPPLIER_PAYOUT");
    const dayReceiptsTotal = hasSupplierPayoutOnDay
      ? 0
      : approvedReceipts
          .filter(r => (r.receiptDate || r.decidedAt?.slice(0, 10) || "") === isoDate)
          .reduce((acc, r) => acc + (Number(r.totalCost) || 0), 0);

    const dayOutflow = dayPayoutsTotal + dayReceiptsTotal;
    const dayNet = dayInflow - dayOutflow;

    return {
      isoDate,
      day: dayLabel,
      isToday: daysAgo === 0,
      inflow: Math.round(dayInflow * 100) / 100,
      outflow: Math.round(dayOutflow * 100) / 100,
      net: Math.round(dayNet * 100) / 100
    };
  });

  // Dynamic Y-Axis Scale for Cashflow Chart
  const rawMaxCashflow = Math.max(
    ...cashflowDays.map(d => Math.max(d.inflow, d.outflow, Math.abs(d.net))),
    1000
  );
  const cashflowAxisMax = isDemo
    ? 50000
    : rawMaxCashflow <= 2000
      ? 2000
      : rawMaxCashflow <= 5000
        ? 5000
        : rawMaxCashflow <= 10000
          ? 10000
          : rawMaxCashflow <= 20000
            ? 20000
            : Math.ceil(rawMaxCashflow / 10000) * 10000;

  const formatAxisKsh = (val: number) => {
    const abs = Math.abs(val);
    const prefix = val < 0 ? "-" : "";
    if (abs === 0) return `${currency} 0`;
    if (abs >= 1000) return `${prefix}${ (abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1) }K`;
    return `${prefix}${abs}`;
  };

  const total11DayInflow = cashflowDays.reduce((acc, d) => acc + d.inflow, 0);
  const total11DayOutflow = cashflowDays.reduce((acc, d) => acc + d.outflow, 0);
  const total11DayNet = total11DayInflow - total11DayOutflow;

  // Real Operating Expenses vs Personal Drawings vs Net Income for Profit & Loss Card
  const realOperatingExpenses = payouts
    .filter(p => p.type === "BUSINESS_EXPENSE")
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const realPersonalDrawings = payouts
    .filter(p => p.type === "OWNER_DRAWING")
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const realNetOperatingIncome = totalRevenue - realOperatingExpenses;
  const realGrossMarginPct = totalStockValue > 0
    ? Number((((totalStockValue - totalStockCost) / totalStockValue) * 100).toFixed(1))
    : (state.kpis?.avg_markup_percentage || 0);

  // Connected Account Live Balances
  const liveMpesaFloat = typeof state.mpesa_float_balance === "number" ? state.mpesa_float_balance : 0;
  const liveCashDrawer = typeof state.cash_register_balance === "number" ? state.cash_register_balance : 0;
  const liveBankEquitel = typeof state.equitel_account_balance === "number" ? state.equitel_account_balance : 0;
  const latestBookend = (state.morning_bookends && state.morning_bookends.length > 0) ? state.morning_bookends[0] : null;

  let cumulativeOffset = 0;

  return (
    <div className="space-y-5 max-w-6xl mx-auto font-sans text-slate-900 pb-8">
      
      {/* ========================================================================= */}
      {/* 1. ELEGANT SERIF GREETING & REAL CURRENT DATE BADGE                       */}
      {/* ========================================================================= */}
      <div className="pt-1 flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-slate-900 tracking-tight">
            {timeGreeting}, {firstName}
          </h1>
          <span className="text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-full font-semibold">
            {todayReadable}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ROW OF 4 PASTEL ROUNDED ACTION CARDS                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* CARD 1: MINT GREEN (CREATE ESTIMATE / QUICK SALE) */}
        <button
          onClick={() => {
            if (onOpenQuickSale) onOpenQuickSale();
            else onNavigateTab("voice_ledger");
          }}
          className="p-3 sm:p-3.5 rounded-xl bg-[#E8F8F0] hover:bg-[#DDF4E8] border border-[#CBEEDB] text-[#1E3A2F] flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center text-[#1E3A2F] group-hover:scale-110 transition-transform">
            <FileText size={16} />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Create estimate
          </span>
        </button>

        {/* CARD 2: SKY BLUE (PURCHASES & CARGO / RECEIPT OCR) */}
        <button
          onClick={() => {
            if (onOpenQuickPurchase) onOpenQuickPurchase();
            else onNavigateTab("purchases");
          }}
          className="p-3 sm:p-3.5 rounded-xl bg-[#EBF5FB] hover:bg-[#DFF0FA] border border-[#D0E6F6] text-[#1B3A57] flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center text-[#1B3A57] group-hover:scale-110 transition-transform">
            <Receipt size={16} />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Purchases &bull; OCR
          </span>
        </button>

        {/* CARD 3: LILAC / LAVENDER (ADD TRANSACTION / CUSTOMER DENI) */}
        <button
          onClick={() => {
            if (onOpenQuickDeni) onOpenQuickDeni();
            else onNavigateTab("customer_deni");
          }}
          className="p-3 sm:p-3.5 rounded-xl bg-[#F4EFFB] hover:bg-[#ECE3F8] border border-[#E1D3F5] text-[#341F54] flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center text-[#341F54] group-hover:scale-110 transition-transform">
            <ArrowLeftRight size={16} />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Customer Deni
          </span>
        </button>

        {/* CARD 4: WARM PEACH / SAND (SUPPLIERS & VENDORS / PHONE & NATIONAL ID) */}
        <button
          onClick={() => onNavigateTab("suppliers")}
          className="p-3 sm:p-3.5 rounded-xl bg-[#FDF4EB] hover:bg-[#FAECDF] border border-[#F6DFCB] text-[#4A2D16] flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center text-[#4A2D16] group-hover:scale-110 transition-transform">
            <Truck size={16} />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Suppliers &amp; KYC
          </span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: INSIGHTS FOR YOU                                              */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-slate-900 tracking-tight">
            Insights for you
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            &bull; {currentMonthName}
          </span>
        </div>

        {/* CUSTOMIZE PILL BUTTON */}
        <button
          onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
          className="px-3 py-1 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
        >
          <SlidersHorizontal size={13} className="text-slate-600" />
          <span>Customize</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. 2-COLUMN GRID: EXPENSES BREAKDOWN + CASHFLOW                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        
        {/* ----------------------------------------------------------------------- */}
        {/* CARD 1: EXPENSES BREAKDOWN                                              */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          
          {/* HEADER ROW */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Expenses breakdown
              </h3>
              <p className="text-[11px] text-slate-500">
                {isDemo ? "Sample duka cost distribution" : `Live client expenses & stock purchases (${currentMonthName})`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigateTab("owner_expenses")}
                className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <Wallet size={12} />
                <span>Owner Expenses</span>
              </button>

              <button 
                onClick={() => onNavigateTab("expenses")}
                className="px-3 py-1 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition cursor-pointer"
              >
                View report
              </button>

              <div className="relative">
                <button
                  onClick={() =>
                    setExpenseRange(
                      expenseRange === "Year to date"
                        ? "This month"
                        : expenseRange === "This month"
                          ? "Last 30 days"
                          : "Year to date"
                    )
                  }
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
            
            {/* LEFT: PERCENTAGE, CATEGORY & REAL AMOUNT LEGEND */}
            <div className="space-y-2.5 text-xs w-full sm:w-auto flex-1">
              {expenseSegments.map((seg, idx) => (
                <div 
                  key={seg.id}
                  onMouseEnter={() => setHoveredExpenseSegment(idx)}
                  onMouseLeave={() => setHoveredExpenseSegment(null)}
                  className={`flex items-center justify-between gap-3 cursor-pointer transition-opacity ${
                    hoveredExpenseSegment !== null && hoveredExpenseSegment !== idx ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
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

                    <span className="font-semibold text-slate-800 w-8 shrink-0">
                      {seg.pct}%
                    </span>
                    <span className="text-slate-600 truncate">
                      {seg.label}
                    </span>

                    {seg.hasAlert && (
                      <AlertCircle size={13} className="text-amber-500 shrink-0" />
                    )}
                  </div>

                  <span className="font-mono font-semibold text-slate-800 shrink-0">
                    {seg.amount}
                  </span>
                </div>
              ))}
            </div>

            {/* RIGHT: SVG DONUT CHART */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
                <defs>
                  {/* Pattern for Hatched Segment */}
                  <pattern id="hatchedGray" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="#94A3B8" strokeWidth="2.5" />
                  </pattern>
                </defs>

                {/* EMPTY BASE RING WHEN ZERO EXPENSES */}
                {displayedTotalExpenseBreakdown <= 0 && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#E2E8F0"
                    strokeWidth={strokeWidth}
                  />
                )}

                {/* SEGMENTS */}
                {displayedTotalExpenseBreakdown > 0 && expenseSegments.map((seg, idx) => {
                  if (seg.pct <= 0) return null;
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
                {hoveredExpenseSegment !== null ? (
                  <div className="text-center animate-in fade-in">
                    <span className="text-sm font-bold text-slate-900 block leading-tight font-mono">
                      {expenseSegments[hoveredExpenseSegment].amount}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block max-w-[90px] truncate mt-0.5">
                      {expenseSegments[hoveredExpenseSegment].label} ({expenseSegments[hoveredExpenseSegment].pct}%)
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Outflow</span>
                    <span className="text-xs font-bold text-slate-800 font-mono block">
                      {currency} {displayedTotalExpenseBreakdown.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isDemo
                ? "Aggregated across sample duka ledger entries"
                : `Computed from ${filteredPayouts.length} expense notes & ${filteredReceipts.length} purchase receipts`}
            </span>
            <span className="font-semibold text-slate-700">
              {todayShortLabel} Live Sync
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD 2: CASHFLOW (REAL CURRENT CALENDAR DATES ENDING TODAY)             */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          
          {/* HEADER ROW */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Cashflow
              </h3>
              <p className="text-[11px] text-slate-500">
                {cashflowDays[0]?.day} &ndash; {cashflowDays[cashflowDays.length - 1]?.day} ({now.getFullYear()})
              </p>
            </div>

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
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-700">
            <div className="flex items-center gap-4">
              {/* INFLOW SOLID GREEN */}
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-sm bg-[#10B981]" />
                <span className="font-medium text-slate-700">Inflow (Sales)</span>
              </div>

              {/* OUTFLOW HATCHED */}
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-3.5 h-3.5 rounded-sm border border-slate-400" 
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 2px, #ffffff 2px, #ffffff 4px)"
                  }}
                />
                <span className="font-medium text-slate-700">Outflow (Purchases &amp; Expenses)</span>
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

              {/* HORIZONTAL GRID LINES & DYNAMIC KSh Y-AXIS LABELS */}
              <text x="0" y="24" fontSize="9.5" fill="#94A3B8" fontFamily="monospace">{formatAxisKsh(cashflowAxisMax)}</text>
              <line x1="44" y1="20" x2="530" y2="20" stroke="#F1F5F9" strokeWidth="1" />

              <text x="0" y="69" fontSize="9.5" fill="#94A3B8" fontFamily="monospace">{formatAxisKsh(cashflowAxisMax / 2)}</text>
              <line x1="44" y1="65" x2="530" y2="65" stroke="#F1F5F9" strokeWidth="1" />

              {/* 0 BASELINE (HEAVIER LINE) */}
              <text x="6" y="114" fontSize="9.5" fill="#64748B" fontFamily="monospace" fontWeight="bold">0</text>
              <line x1="44" y1="110" x2="530" y2="110" stroke="#CBD5E1" strokeWidth="1.5" />

              <text x="0" y="159" fontSize="9.5" fill="#94A3B8" fontFamily="monospace">{formatAxisKsh(-cashflowAxisMax / 2)}</text>
              <line x1="44" y1="155" x2="530" y2="155" stroke="#F1F5F9" strokeWidth="1" />

              <text x="0" y="204" fontSize="9.5" fill="#94A3B8" fontFamily="monospace">{formatAxisKsh(-cashflowAxisMax)}</text>
              <line x1="44" y1="200" x2="530" y2="200" stroke="#F1F5F9" strokeWidth="1" />

              {/* RENDER BARS (INFLOW & OUTFLOW) */}
              {cashflowDays.map((d, i) => {
                const barWidth = 18;
                const x = 55 + i * 43;

                // Baseline is y=110. Max height = 85px
                const inflowHeight = Math.min(88, (d.inflow / cashflowAxisMax) * 85);
                const outflowHeight = Math.min(88, (d.outflow / cashflowAxisMax) * 85);

                return (
                  <g key={d.isoDate}>
                    {/* INFLOW BAR (RISING UPWARDS FROM 110) */}
                    {d.inflow > 0 && (
                      <rect
                        x={x}
                        y={110 - Math.max(3, inflowHeight)}
                        width={barWidth}
                        height={Math.max(3, inflowHeight)}
                        fill="#10B981"
                        rx="2"
                        className="hover:opacity-85 transition-opacity cursor-pointer"
                      >
                        <title>{`${d.day} (${d.isoDate}) Inflow: ${currency} ${d.inflow.toLocaleString()}`}</title>
                      </rect>
                    )}

                    {/* OUTFLOW BAR (DESCENDING DOWNWARDS FROM 110) */}
                    {d.outflow > 0 && (
                      <rect
                        x={x}
                        y={110}
                        width={barWidth}
                        height={Math.max(3, outflowHeight)}
                        fill="url(#outflowHatch)"
                        stroke="#94A3B8"
                        strokeWidth="1"
                        rx="2"
                        className="hover:opacity-85 transition-opacity cursor-pointer"
                      >
                        <title>{`${d.day} (${d.isoDate}) Outflow: ${currency} ${d.outflow.toLocaleString()}`}</title>
                      </rect>
                    )}
                  </g>
                );
              })}

              {/* CONNECTED LINE FOR NET CHANGE */}
              {(() => {
                const points = cashflowDays.map((d, i) => {
                  const x = 55 + i * 43 + 9;
                  const clampedNet = Math.max(-cashflowAxisMax, Math.min(cashflowAxisMax, d.net));
                  const y = 110 - (clampedNet / cashflowAxisMax) * 85;
                  return { x, y, net: d.net, day: d.day, isoDate: d.isoDate, isToday: d.isToday };
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
                        r={p.isToday ? "5" : "4"}
                        fill={p.isToday ? "#EA580C" : "#FFFFFF"}
                        stroke="#EA580C"
                        strokeWidth="2.5"
                        className="cursor-pointer hover:scale-125 transition-transform"
                      >
                        <title>{`${p.day} (${p.isoDate}) Net Cashflow: ${currency} ${p.net.toLocaleString()}`}</title>
                      </circle>
                    ))}
                  </g>
                );
              })()}
            </svg>

            {/* X-AXIS LABELS (DYNAMIC CURRENT MONTH DATES ENDING TODAY, e.g. Oct 7 .. Oct 17) */}
            <div className="flex justify-between pl-8 pr-2 pt-1 text-[10px] text-slate-500 font-mono">
              {cashflowDays.map((d) => (
                <div
                  key={d.isoDate}
                  className={`text-center w-8 rounded py-0.5 ${
                    d.isToday ? "bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold" : ""
                  }`}
                  title={d.isToday ? `Today: ${d.day} (${d.isoDate})` : `${d.day} (${d.isoDate})`}
                >
                  <span className={`block ${d.isToday ? "text-emerald-700 font-bold" : "text-slate-700"}`}>
                    {d.day.split(" ")[0]}
                  </span>
                  <span className="font-bold text-slate-900">{d.day.split(" ")[1]}</span>
                </div>
              ))}
            </div>

          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
            <span>
              Inflow: <strong className="text-emerald-700 font-mono">{currency} {total11DayInflow.toLocaleString()}</strong> &bull; Outflow: <strong className="text-slate-700 font-mono">{currency} {total11DayOutflow.toLocaleString()}</strong>
            </span>
            <span className={`font-semibold font-mono ${total11DayNet >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
              Net ({cashflowDays[0]?.day}&ndash;{cashflowDays[cashflowDays.length - 1]?.day}): {total11DayNet >= 0 ? "+" : ""}{currency} {total11DayNet.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 2: CONNECTED ACCOUNTS + PROFIT & LOSS                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 pt-1">
        
        {/* CARD 3: CONNECTED ACCOUNTS (LIVE CLIENT CHANNELS) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Connected accounts &amp; till channels (3)
              </h3>
              <p className="text-[11px] text-slate-500">
                Live liquidity balances from Dawn Lock &amp; counter transactions
              </p>
            </div>
            <button 
              onClick={() => onNavigateTab("dawn_lock")}
              className="px-3 py-1 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition cursor-pointer"
            >
              Adjust Float
            </button>
          </div>

          <div className="space-y-2.5">
            {/* ACCOUNT 1: PHYSICAL CASH DRAWER */}
            <div
              onClick={() => onNavigateTab("dawn_lock")}
              className="p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs font-mono">
                  CSH
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Physical Cash Drawer / Counter Till
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Counter Cash &bull; Updated with Cash Sales &amp; Cash Expenses
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-slate-900">
                  {currency} {liveCashDrawer.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block">
                  Live Drawer Cash
                </span>
              </div>
            </div>

            {/* ACCOUNT 2: M-PESA TILL */}
            <div
              onClick={() => onNavigateTab("dawn_lock")}
              className="p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs font-mono">
                  M
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Safaricom M-Pesa Till / Float
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Buy Goods &amp; Mobile Money &bull; Live Digital Float
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-slate-900">
                  {currency} {liveMpesaFloat.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  Active Float
                </span>
              </div>
            </div>

            {/* ACCOUNT 3: BANK PAYBILL / EQUITEL */}
            <div
              onClick={() => onNavigateTab("dawn_lock")}
              className="p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs font-mono">
                  BNK
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Equity Bank Paybill / Operating Account
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {latestBookend ? `Dawn Lock Date: ${latestBookend.date}` : "Operating Bank Reserve"}
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-slate-900">
                  {currency} {liveBankEquitel.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold block">
                  Dawn Locked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: PROFIT & LOSS (REAL CLIENT DATA) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Profit &amp; Loss ({currentMonthName})
              </h3>
              <p className="text-[11px] text-slate-500">
                Real operating performance from sales, stock margins &amp; expenses
              </p>
            </div>
            <button 
              onClick={() => onNavigateTab("three_fold_ledgers")}
              className="px-3 py-1 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition cursor-pointer"
            >
              View report
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-slate-500">
                {isDemo ? "Total Net Income" : "Net Operating Income (Sales - OpEx)"}
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {currency} {(isDemo ? 36450 : realNetOperatingIncome).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ArrowUpRight size={13} />
                {isDemo
                  ? "+18.4% vs last period"
                  : `Shelf Potential Profit: ${currency} ${totalPotentialProfit.toLocaleString()}`}
              </span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-slate-500">Gross Margin</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {isDemo ? "24.8%" : `${realGrossMarginPct}%`}
              </div>
              <span className="text-[11px] text-blue-600 font-semibold block">
                {isDemo
                  ? "Shelf capital defended"
                  : `${inventory.length} active SKUs • Markup: ${state.kpis?.avg_markup_percentage || 0}%`}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Sales: <strong className="text-slate-700 font-mono">{currency} {totalRevenue.toLocaleString()}</strong> &bull; OpEx: <strong className="text-slate-700 font-mono">{currency} {realOperatingExpenses.toLocaleString()}</strong>
            </span>
            <span className="font-semibold text-slate-700">Audit status: Live</span>
          </div>
        </div>

      </div>

    </div>
  );
}
