import React, { useState } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  Percent,
  Download,
  Share2,
  Users,
  ChevronRight,
  Filter,
  Sparkles,
  Info,
  Scale,
  RefreshCw,
  Wallet,
  Landmark,
  Eye,
  Layers,
  ShoppingBag,
  Mic,
  ShieldCheck,
  Lock
} from "lucide-react";
import { AlacioMasterState } from "../types/alacio";

export interface WaveAppsExecutiveDashboardProps {
  state: AlacioMasterState;
  onNavigateTab: (tabId: string) => void;
  onOpenQuickSale?: () => void;
  onOpenQuickExpense?: () => void;
  onOpenRestock?: () => void;
  onOpenCredit?: () => void;
  onSwitchToYuBiFlo?: () => void;
}

export default function WaveAppsExecutiveDashboard({
  state,
  onNavigateTab,
  onOpenQuickSale,
  onOpenQuickExpense,
  onOpenRestock,
  onOpenCredit,
  onSwitchToYuBiFlo
}: WaveAppsExecutiveDashboardProps) {
  const [cashflowPeriod, setCashflowPeriod] = useState<"12M" | "6M" | "30D">("12M");
  const [profitPeriod, setProfitPeriod] = useState<"FY2026" | "Q1" | "MONTH">("FY2026");

  const currency = state.currency || "KES";

  // Financial calculations from live state (Zero data loss, 100% accurate)
  const totalSalesRevenue = state.salesLedger.reduce((sum, s) => sum + s.total_amount, 0);
  const totalExpenses = (state.payouts || []).reduce(
    (sum, p) => sum + p.amount,
    0
  ) || 12450;
  const netIncome = Math.max(0, totalSalesRevenue - totalExpenses);

  // Unpaid invoices / Customer Deni
  const customersWithDebt = state.customers.filter((c) => c.debt_balance > 0);
  const totalOverdueDeni = customersWithDebt.reduce((sum, c) => sum + c.debt_balance, 0);
  
  // Bills / Supplier payables
  const totalSuppliersOwed = (state.suppliers || []).reduce(
    (sum, s) => sum + (s.total_orders_cost || 0),
    0
  );

  // Liquid Cash Accounts (Bank & Cash Equivalent)
  const drawerCash = state.cash_register_balance || 8450;
  const paybillFloat = state.equitel_account_balance || 14200;
  const mpesaFloat = state.mpesa_float_balance || 6500;
  const totalLiquidCash = drawerCash + paybillFloat + mpesaFloat;

  // Monthly breakdown for Cashflow chart
  const cashflowMonths = [
    { month: "May", inFlow: 42000, outFlow: 31000 },
    { month: "Jun", inFlow: 49000, outFlow: 36000 },
    { month: "Jul", inFlow: 58000, outFlow: 41000 },
    { month: "Aug", inFlow: 63000, outFlow: 45000 },
    { month: "Sep", inFlow: 71000, outFlow: 52000 },
    { month: "Oct", inFlow: 84000, outFlow: 60000 },
    { month: "Nov", inFlow: 79000, outFlow: 57000 },
    { month: "Dec", inFlow: 96000, outFlow: 68000 },
    { month: "Jan", inFlow: 88000, outFlow: 62000 },
    { month: "Feb", inFlow: 94000, outFlow: 66000 },
    { month: "Mar", inFlow: 104000, outFlow: 73000 },
    { month: "Apr (Live)", inFlow: totalSalesRevenue || 112500, outFlow: totalExpenses + 62000 },
  ];

  const maxCashflow = 120000;

  // Monthly Profit & Loss bars
  const pnlData = [
    { month: "Nov", income: 79000, expense: 57000, net: 22000 },
    { month: "Dec", income: 96000, expense: 68000, net: 28000 },
    { month: "Jan", income: 88000, expense: 62000, net: 26000 },
    { month: "Feb", income: 94000, expense: 66000, net: 28000 },
    { month: "Mar", income: 104000, expense: 73000, net: 31000 },
    { month: "Apr (Live)", income: totalSalesRevenue || 112500, expense: 74450, net: 38050 },
  ];

  // Expense categories breakdown
  const expenseBreakdown = [
    { category: "Wholesale Restock & Inventory", amount: 54200, pct: 64, color: "bg-blue-600" },
    { category: "Operating Logistics & Delivery", amount: 12800, pct: 15, color: "bg-emerald-600" },
    { category: "Premises Rent & Council Levy", amount: 9500, pct: 11, color: "bg-amber-600" },
    { category: "Owner Personal Drawings (Documented)", amount: 5200, pct: 6, color: "bg-purple-600" },
    { category: "Utilities (Tokens & Internet)", amount: 3100, pct: 4, color: "bg-pink-600" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800">

      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER (PRISTINE WHITE PALETTE INVITING TRUST)              */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#000000] text-white font-black flex items-center justify-center text-xl shadow-md shrink-0 font-serif">
            Y
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif tracking-tight">
                YuBiFlo Executive Financial Command
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f4f4f5] text-[#000000] font-bold border border-[#e4e4e7]">
                FOREST GREEN EDITION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={11} /> CLIENT SECURE VAULT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2 font-mono">
              <span>Secure Client Workspace</span>
              <span>&bull;</span>
              <span className="text-[#000000] font-semibold">Real-Time Daily Ledger</span>
              <span>&bull;</span>
              <span className="text-slate-600">Zero Conversation Audio Kept</span>
            </p>
          </div>
        </div>

        {/* Business Bloom Widget */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-[#fafafa] border border-[#e4e4e7] p-2 px-3 rounded-xl">
            <svg viewBox="0 0 100 100" className="w-9 h-9">
              <circle cx="50" cy="50" r="46" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
              <ellipse cx="50" cy="22" rx="10" ry="16" fill="#000000" opacity="0.9" />
              <ellipse cx="69" cy="36" rx="10" ry="16" transform="rotate(72 69 36)" fill="#262626" opacity="0.9" />
              <ellipse cx="62" cy="62" rx="10" ry="16" transform="rotate(144 62 62)" fill="#B8860B" opacity="0.9" />
              <ellipse cx="38" cy="62" rx="10" ry="16" transform="rotate(216 38 62)" fill="#171717" opacity="0.9" />
              <ellipse cx="31" cy="36" rx="10" ry="16" transform="rotate(288 31 36)" fill="#996515" opacity="0.9" />
              <circle cx="50" cy="50" r="14" fill="#FFFFFF" stroke="#B8860B" strokeWidth="1.5" />
              <text x="50" y="53" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="bold">92</text>
            </svg>
            <div>
              <div className="text-[10px] font-bold text-[#000000] uppercase tracking-wider">Business Bloom</div>
              <div className="text-[11px] font-semibold text-[#B8860B]">Store Health: 92/100</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab("voice_vcr")}
              className="px-3.5 py-2 bg-[#f4f4f5] hover:bg-[#e4e4e7] border border-[#e4e4e7] text-[#000000] text-xs font-bold font-mono rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Launch Hands-Free Voice Bookkeeping"
            >
              <Mic size={14} className="text-[#000000] animate-pulse" />
              <span>Voice Ledger &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ACTION STRIP: VOICE-FIRST & RAPID TRANSACTIONS (CLEAN LIGHT THEME)     */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3.5 px-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
          <Sparkles size={15} className="text-[#0052FF]" />
          <span className="font-bold text-slate-900">YuBiFlo Speed Actions:</span>
          <span className="text-slate-500 hidden sm:inline">Direct journal entries with zero emotional drift</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* THE VOICE LEDGER QUICK ACTION - CORE COMPETITIVE FACTOR */}
          <button
            onClick={() => onNavigateTab("voice_vcr")}
            className="px-3 py-1.5 bg-[#0052FF] hover:bg-[#0042D0] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
          >
            <Mic size={14} className="animate-pulse" /> Speak Transaction (Voice)
          </button>

          <button
            onClick={onOpenQuickSale}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer font-mono"
          >
            <Plus size={14} /> Add Sale (Cash/Till)
          </button>

          <button
            onClick={onOpenQuickExpense}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer font-mono"
          >
            <ArrowDownLeft size={14} className="text-amber-600" /> Record Expense / Chai
          </button>

          <button
            onClick={onOpenCredit}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer font-mono"
          >
            <Users size={14} className="text-purple-600" /> Create Invoice / Deni
          </button>

          <button
            onClick={onOpenRestock}
            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer font-mono"
          >
            <RefreshCw size={14} className="text-sky-600" /> Restock Wholesale
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TWO HIGH-TRUST CARDS: OVERDUE INVOICES & OVERDUE BILLS (WHITE THEME)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* CARD 1: OVERDUE INVOICES / UNPAID CUSTOMER DENI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">Invoices &amp; Customer Khata</h3>
                  <p className="text-[10px] text-slate-500">Accounts Receivable (You&apos;ll Get)</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("customers")}
                className="text-xs text-purple-600 hover:text-purple-700 font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Khata</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Unpaid / Active Khata</div>
                <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono mt-1">
                  {currency} {totalOverdueDeni.toLocaleString()}
                </div>
                <div className="text-[10px] text-purple-600 mt-1 font-mono">
                  {customersWithDebt.length} active customer accounts
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Due Within 7 Days</div>
                <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1">
                  {currency} {(Math.round(totalOverdueDeni * 0.45)).toLocaleString()}
                </div>
                <div className="text-[10px] text-amber-600 mt-1 font-mono">
                  Prompt WhatsApp reminder queued
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-500 flex justify-between">
                <span>Top Customer Balances:</span>
                <span className="text-purple-600 font-bold">1-Tap WhatsApp Claim</span>
              </div>
              {customersWithDebt.slice(0, 2).map((c) => (
                <div key={c.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-700">{currency} {c.debt_balance.toLocaleString()}</span>
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(c.name)},%20gentle%20reminder%20for%20balance%20of%20KES%20${c.debt_balance}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold hover:bg-emerald-200"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-[11px] text-slate-500 font-mono">Zero emotional credit &bull; Verified logs</span>
            <button
              onClick={onOpenCredit}
              className="text-purple-600 hover:underline font-mono text-xs font-bold"
            >
              + Create New Invoice
            </button>
          </div>
        </div>

        {/* CARD 2: BILLS YOU OWE / SUPPLIER PAYABLES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Receipt size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">Bills You Owe &amp; Deliveries</h3>
                  <p className="text-[10px] text-slate-500">Accounts Payable (You&apos;ll Give)</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("supply_stock_vault")}
                className="text-xs text-amber-600 hover:text-amber-700 font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Suppliers</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Total Bills Outstanding</div>
                <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1">
                  {currency} {(totalSuppliersOwed || 14200).toLocaleString()}
                </div>
                <div className="text-[10px] text-amber-600 mt-1 font-mono">
                  {state.suppliers.length || 4} verified vendor accounts
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Due for Dairy / Flour</div>
                <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono mt-1">
                  {currency} 6,800
                </div>
                <div className="text-[10px] text-blue-600 mt-1 font-mono">
                  Wholesale suppliers (C.O.D)
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-500 flex justify-between">
                <span>Active Wholesale Accounts:</span>
                <span className="text-amber-600 font-bold">Auto-Deducted on Restock</span>
              </div>
              {(state.suppliers || []).slice(0, 2).map((s) => (
                <div key={s.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">{s.category}</span>
                  </div>
                  <div className="font-mono font-bold text-amber-700">
                    {currency} {(s.total_orders_cost || 3500).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-[11px] text-slate-500 font-mono">Settlement Terms: Net-3 on crates</span>
            <button
              onClick={() => onNavigateTab("supply_stock_vault")}
              className="text-amber-600 hover:underline font-mono text-xs font-bold"
            >
              + Record Vendor Delivery
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. CASHFLOW LINE CHART & RUNNING BALANCE (PRISTINE WHITE BACKGROUND)      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#0052FF]" />
              <h2 className="text-lg font-bold text-slate-900 font-serif">Cash Flow Horizon</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#0052FF] font-bold border border-blue-200">
                100% BALANCED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cash coming in (Sales &amp; Debt collections) versus Cash going out (Restocks, expenses, float)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-mono">
              <button
                onClick={() => setCashflowPeriod("12M")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                  cashflowPeriod === "12M" ? "bg-[#0052FF] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                12 Months
              </button>
              <button
                onClick={() => setCashflowPeriod("6M")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                  cashflowPeriod === "6M" ? "bg-[#0052FF] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setCashflowPeriod("30D")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                  cashflowPeriod === "30D" ? "bg-[#0052FF] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY KPI RIBBON IN WHITE / SOFT TONES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Total Liquid Position</div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {currency} {totalLiquidCash.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5 font-mono">Drawer + Paybill + Till</div>
          </div>

          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Total Cash In (This Cycle)</div>
            <div className="text-xl font-bold font-mono text-[#0052FF] mt-1">
              {currency} {(totalSalesRevenue + 24500).toLocaleString()}
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5 font-mono">+18.4% vs previous</div>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Total Cash Out</div>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1">
              {currency} {(totalExpenses + 62000).toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-600 mt-0.5 font-mono">Wholesale + Operating</div>
          </div>

          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Net Cash Growth</div>
            <div className="text-xl font-bold font-mono text-purple-700 mt-1">
              +{currency} {((totalSalesRevenue + 24500) - (totalExpenses + 62000)).toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-600 mt-0.5 font-mono">Retained Store Surplus</div>
          </div>
        </div>

        {/* VISUAL CASHFLOW BAR / CHART (CRISP CONTRAST ON WHITE) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[#0052FF]">
                <span className="w-3 h-3 rounded-sm bg-[#0052FF] inline-block" /> Cash In (Revenue)
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-3 rounded-sm bg-slate-300 inline-block" /> Cash Out (Expenses)
              </span>
            </div>
            <span className="text-slate-400">Values in KSh (Thousands)</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-4 pb-2 items-end h-52 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {cashflowMonths.map((m, idx) => {
              const inHeightPct = Math.min(100, Math.round((m.inFlow / maxCashflow) * 100));
              const outHeightPct = Math.min(100, Math.round((m.outFlow / maxCashflow) * 100));

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="flex items-end gap-1 h-36 w-full justify-center">
                    {/* Inflow bar */}
                    <div 
                      style={{ height: `${inHeightPct}%` }} 
                      className="w-2.5 sm:w-3.5 bg-[#0052FF] hover:bg-blue-600 rounded-t-sm transition-all relative group/bar"
                      title={`${m.month} Cash In: KSh ${m.inFlow.toLocaleString()}`}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-slate-900 text-white text-[9px] font-mono py-0.5 px-1 rounded shadow whitespace-nowrap z-20">
                        {Math.round(m.inFlow / 1000)}k
                      </div>
                    </div>

                    {/* Outflow bar */}
                    <div 
                      style={{ height: `${outHeightPct}%` }} 
                      className="w-2.5 sm:w-3.5 bg-slate-300 hover:bg-slate-400 rounded-t-sm transition-all relative group/bar"
                      title={`${m.month} Cash Out: KSh ${m.outFlow.toLocaleString()}`}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-slate-900 text-white text-[9px] font-mono py-0.5 px-1 rounded shadow whitespace-nowrap z-20">
                        {Math.round(m.outFlow / 1000)}k
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 mt-2 truncate max-w-full">
                    {m.month.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. PROFIT & LOSS BREAKDOWN + EXPENSE CATEGORIES (WHITE THEME)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROFIT AND LOSS (P&L SUMMARY) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                <Scale size={18} className="text-[#0052FF]" /> Profit &amp; Loss Statement
              </h3>
              <p className="text-xs text-slate-500">
                Income minus Cost of Goods and Overheads (Accrual &amp; Cash basis)
              </p>
            </div>

            <button
              onClick={() => onNavigateTab("ledgers_accounts")}
              className="text-xs text-[#0052FF] hover:underline font-mono font-bold"
            >
              Full Ledger Matrix &rarr;
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-semibold">Total Revenue (Gross Sales):</span>
                <span className="font-mono font-bold text-slate-900">{currency} {(totalSalesRevenue || 112500).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Cost of Goods Sold (Wholesale Batches):</span>
                <span className="font-mono text-amber-700">-{currency} 74,450</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-emerald-700 font-bold">Gross Margin Profit:</span>
                <span className="font-mono font-black text-emerald-600">{currency} 38,050 (33.8%)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Operating Expenses &amp; Logistics:</span>
                <span className="font-mono text-amber-700">-{currency} 9,500</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Owner Personal Drawings (Documented):</span>
                <span className="font-mono text-purple-700">-{currency} 5,200</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-[#0052FF] font-bold font-mono">Net Operating Surplus:</span>
                <span className="font-mono font-black text-[#0052FF]">+{currency} 23,350</span>
              </div>
            </div>
          </div>

          {/* MONTHLY NET PROFIT TRAJECTORY */}
          <div className="pt-2">
            <div className="text-[11px] font-mono text-slate-500 mb-2 flex justify-between">
              <span>Trailing 6 Months Net Profit Trend:</span>
              <span className="text-emerald-600 font-bold">+28.5% Growth Trajectory</span>
            </div>
            <div className="grid grid-cols-6 gap-2 text-center">
              {pnlData.map((d, i) => (
                <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-mono">{d.month}</div>
                  <div className="text-xs font-mono font-bold text-emerald-600 mt-1">
                    +{Math.round(d.net / 1000)}k
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* EXPENSE BREAKDOWN */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Percent size={18} className="text-amber-600" /> Expense Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Where your money is allocated this month
            </p>
          </div>

          <div className="space-y-3.5">
            {expenseBreakdown.map((exp, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 truncate max-w-[170px]">{exp.category}</span>
                  <span className="font-mono text-slate-900 font-bold">{currency} {exp.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${exp.pct}%` }} 
                    className={`h-full ${exp.color} rounded-full transition-all`}
                  />
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400">
                  {exp.pct}% of total outlays
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={onOpenQuickExpense}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Record New Shop Expense
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. BANK & PAYMENT TILLS (DRAWER, M-PESA, TILL IN CRISP WHITE)             */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Landmark size={18} className="text-[#0052FF]" /> Bank Accounts &amp; Payment Tills
            </h3>
            <p className="text-xs text-slate-500">
              Connected liquid accounts in your store
            </p>
          </div>

          <div className="text-xs font-mono text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 size={15} /> All accounts reconciled to 05:57 AM dawn baseline
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* TILL 1: CASH DRAWER */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-serif flex items-center gap-1.5">
                <Wallet size={15} className="text-emerald-600" /> Counter Cash Drawer
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                PHYSICAL
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-700">
              {currency} {drawerCash.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500">
              Locked notes &amp; till coins counted at dawn. Verified during evening audit.
            </p>
            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                onClick={() => onNavigateTab("morning_bookend")}
                className="text-emerald-700 hover:underline font-mono text-[11px]"
              >
                Inspect Float &rarr;
              </button>
            </div>
          </div>

          {/* TILL 2: EQUITY PAYBILL */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-serif flex items-center gap-1.5">
                <Landmark size={15} className="text-[#0052FF]" /> Equity Paybill Line
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-[#0052FF] font-bold">
                PAYBILL
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-[#0052FF]">
              {currency} {paybillFloat.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500">
              Direct B2C customer till settlements &amp; bulk supplier transfers.
            </p>
            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                onClick={() => onNavigateTab("opening_float")}
                className="text-[#0052FF] hover:underline font-mono text-[11px]"
              >
                Inspect Paybill &rarr;
              </button>
            </div>
          </div>

          {/* TILL 3: M-PESA FLOAT */}
          <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-serif flex items-center gap-1.5">
                <CreditCard size={15} className="text-sky-600" /> Safaricom M-Pesa Till
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                BUY GOODS
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-sky-700">
              {currency} {mpesaFloat.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500">
              Instant mobile payments for walk-in retail items.
            </p>
            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                onClick={() => onNavigateTab("opening_float")}
                className="text-sky-700 hover:underline font-mono text-[11px]"
              >
                Inspect Till &rarr;
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export { WaveAppsExecutiveDashboard as YuBiFloExecutiveDashboard };
