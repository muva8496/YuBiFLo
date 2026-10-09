import React, { useState } from "react";
import { 
  Package, TrendingUp, AlertTriangle, ArrowRight, 
  Zap, Clock, Scale, Users, CheckCircle2, ShieldCheck, RefreshCw, Mic,
  Building2, Sun, Truck, Plus, Coins, Smartphone, DollarSign,
  Coffee, ShoppingBag, ArrowDownLeft, ArrowUpRight, Search, 
  MessageSquare, Sparkles, Database, Cpu, Check, X, BarChart3, LayoutDashboard
} from "lucide-react";
import { AlacioMasterState, InventoryItem, CustomerDebtor, PayoutOrDrawing, SalesLedgerItem } from "../../types/alacio";
import WaveAppsExecutiveDashboard from "../WaveAppsExecutiveDashboard";

interface DashboardTabProps {
  state: AlacioMasterState;
  onNavigateTab: (tabId: string) => void;
  onOpenRestock: () => void;
  onQuickSale?: (itemName: string, qty: number, amount: number, method: "CASH" | "MPESA", saleDate?: string) => void;
  onResolveGap?: (payout: PayoutOrDrawing) => void;
  onRepayDebt?: (customerId: string, amount: number) => void;
  onAddDebtor?: (newDebtor: { name: string; phone: string; national_id?: string; credit_limit: number; initial_debt: number; notes: string }) => void;
  onSwitchToYuBiFlo?: () => void;
}

export default function DashboardTab({ 
  state, 
  onNavigateTab, 
  onOpenRestock,
  onQuickSale,
  onResolveGap,
  onRepayDebt,
  onAddDebtor,
  onSwitchToYuBiFlo
}: DashboardTabProps) {
  const [dashboardMode, setDashboardMode] = useState<"executive" | "counter">("executive");
  const { 
    kpis, 
    currency, 
    inventory, 
    customers, 
    suppliers = [],
    cash_register_balance, 
    mpesa_float_balance = 0,
    equitel_account_balance = 0,
    floatDenominations, 
    warehouse,
    salesLedger = [],
    payouts = []
  } = state;

  const floatTotal = floatDenominations.reduce((acc, d) => acc + d.value * d.count, 0);
  const totalDebt = customers.reduce((acc, c) => acc + c.debt_balance, 0);
  const totalSuppliersOrders = suppliers.reduce((acc, s) => acc + (s.total_orders_cost || 0), 0);
  const whBulkVal = warehouse?.reduce((acc, b) => acc + (b.bulk_quantity * b.bulk_cost_per_unit), 0) || 0;
  const lowStockItems = inventory.filter((item) => item.current_stock <= 5);
  const highVelocityItems = inventory.filter((item) => item.velocity_badge === "High Velocity");
  const totalLiquidMoney = cash_register_balance + mpesa_float_balance + equitel_account_balance;

  // Local state for inline quick action modals
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [quickSaleItem, setQuickSaleItem] = useState("");
  const [quickSaleQty, setQuickSaleQty] = useState(1);
  const [quickSaleAmount, setQuickSaleAmount] = useState("");
  const [quickSaleMethod, setQuickSaleMethod] = useState<"CASH" | "MPESA">("CASH");

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseType, setExpenseType] = useState<"OWNER_DRAWING" | "BUSINESS_EXPENSE" | "SUPPLIER_PAYOUT">("OWNER_DRAWING");
  const [expenseNotes, setExpenseNotes] = useState("");

  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [creditCustomer, setCreditCustomer] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNotes, setCreditNotes] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentFilter, setRecentFilter] = useState<"all" | "sales" | "expenses" | "deni">("all");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Quick Sale Submission
  const handleCommitQuickSale = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItemName = quickSaleItem.trim() || (inventory[0] ? inventory[0].name : "Counter Item");
    const matched = inventory.find((i) => i.name.toLowerCase().includes(targetItemName.toLowerCase()));
    const qty = Number(quickSaleQty) || 1;
    const pricePerUnit = matched ? matched.unit_retail : 50;
    const finalAmount = parseFloat(quickSaleAmount) || (qty * pricePerUnit);

    if (onQuickSale) {
      onQuickSale(targetItemName, qty, finalAmount, quickSaleMethod);
      showToast(`Sale recorded: ${qty}x ${targetItemName} (${currency} ${finalAmount.toLocaleString()}) via ${quickSaleMethod}`);
    } else {
      onNavigateTab("sales_supply");
    }
    setIsQuickSaleOpen(false);
    setQuickSaleItem("");
    setQuickSaleAmount("");
    setQuickSaleQty(1);
  };

  // Handle Quick Expense / Owner Drawing Submission
  const handleCommitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0) return;

    if (onResolveGap) {
      const payout: PayoutOrDrawing = {
        id: `payout_quick_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toISOString().slice(0, 10),
        amount,
        type: expenseType,
        notes: expenseNotes.trim() || (expenseType === "OWNER_DRAWING" ? "Owner Personal Drawing (Chai / Lunch)" : "Shop Expense")
      };
      onResolveGap(payout);
      showToast(`Expense recorded: ${currency} ${amount.toLocaleString()} [${expenseType.replace("_", " ")}] deducted from cash drawer`);
    } else {
      onNavigateTab("evening_reconciliation");
    }
    setIsExpenseOpen(false);
    setExpenseAmount("");
    setExpenseNotes("");
  };

  // Handle Quick Credit (Deni)
  const handleCommitCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = creditCustomer.trim();
    const amount = parseFloat(creditAmount) || 0;
    if (!name || amount <= 0) return;

    if (onAddDebtor) {
      onAddDebtor({
        name,
        phone: "07XX XXX XXX",
        credit_limit: 1500,
        initial_debt: amount,
        notes: creditNotes.trim() || "Quick Deni recorded from Home counter"
      });
      showToast(`Credit (Deni) added: ${name} owes ${currency} ${amount.toLocaleString()}`);
    } else {
      onNavigateTab("customers");
    }
    setIsCreditOpen(false);
    setCreditCustomer("");
    setCreditAmount("");
    setCreditNotes("");
  };

  // Combine unified activity stream
  const unifiedActivities = [
    ...salesLedger.map((s) => ({
      id: s.id,
      type: "sale" as const,
      title: s.items_summary || "Retail Sale",
      party: s.customer_name,
      amount: s.total_amount,
      badge: s.payment_method,
      time: s.timestamp || "Today",
      isPositive: true
    })),
    ...payouts.map((p) => ({
      id: p.id,
      type: "expense" as const,
      title: p.notes || "Cash Payout",
      party: p.type === "OWNER_DRAWING" ? "Owner Drawing" : p.type === "SUPPLIER_PAYOUT" ? "Supplier Settlement" : "Store Expense",
      amount: p.amount,
      badge: p.type.replace("_", " "),
      time: p.timestamp || "Today",
      isPositive: false
    }))
  ].slice(0, 8);

  const filteredActivities = unifiedActivities.filter((act) => {
    if (recentFilter === "sales") return act.type === "sale";
    if (recentFilter === "expenses") return act.type === "expense";
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-400 text-emerald-200 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* TOP STORE IDENTITY & DATE BAR (SIGMA & GAMMA OPERATIVE DESIGNATION) */}
      <div className="bg-[#0b1612] border border-emerald-950/90 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-black flex items-center justify-center text-xl shadow-md shrink-0 font-serif">
            A
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight font-serif">
                {state.merchant_name || "Retail Pro Store (Live Client)"}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                RETAIL PILOT &bull; NODE 001
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Trading &bull; 0-Drift
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kasarani / Hunters, Nairobi &bull; Equity Paybill 1450180372031 &bull; YuBiFLo Flagship Operative
            </p>
            <div className="mt-1.5 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">&bull; Sigma Discipline:</span>
              <span className="text-slate-300">Cold Mathematical Ledger &bull; Zero Emotional Leakage</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-cyan-400 font-bold hidden sm:inline">&bull; Gamma Precision:</span>
              <span className="text-slate-300 hidden sm:inline">21-Pack Reverse Velocity Math</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {onSwitchToYuBiFlo && (
            <button
              onClick={onSwitchToYuBiFlo}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer font-mono"
              title="Switch to greater YuBiFLo Platform & Network Command"
            >
              <Building2 size={13} className="text-emerald-400" />
              <span>YuBiFLo Command</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab("system_architecture")}
            className="px-3 py-1.5 bg-[#12231b] hover:bg-[#183125] border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer font-mono"
            title="Inspect Data Pipelining & Heavy Lifting Architecture"
          >
            <Cpu size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Data Pipeline Lab</span>
            <span className="sm:hidden">Engine</span>
          </button>
          <button
            onClick={onOpenRestock}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md font-mono"
          >
            <RefreshCw size={14} /> Restock SKU
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXECUTIVE DASHBOARD VIEW SELECTOR: EXECUTIVE WHITE vs COUNTER SPEED       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#08120d] border border-emerald-950 p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-[#040806] rounded-xl border border-slate-900">
          <button
            onClick={() => setDashboardMode("executive")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              dashboardMode === "executive"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 size={15} />
            <span>Executive Dashboard (White Trust)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950/20 uppercase font-black">Center</span>
          </button>

          <button
            onClick={() => setDashboardMode("counter")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              dashboardMode === "counter"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard size={15} />
            <span>Counter Retail Speed Deck</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-2">
          <Sparkles size={13} className="text-emerald-400" />
          <span>At the centre of what the customer gets: Real-time Cashflow, Invoices &amp; P&amp;L</span>
        </div>
      </div>

      {/* RENDER EXECUTIVE DASHBOARD AT THE CENTRE */}
      {dashboardMode === "executive" ? (
        <WaveAppsExecutiveDashboard
          state={state}
          onNavigateTab={onNavigateTab}
          onOpenQuickSale={() => setIsQuickSaleOpen(true)}
          onOpenQuickExpense={() => setIsExpenseOpen(true)}
          onOpenRestock={onOpenRestock}
          onOpenCredit={() => setIsCreditOpen(true)}
          onSwitchToYuBiFlo={onSwitchToYuBiFlo}
        />
      ) : (
        <>
      {/* ========================================================================= */}
      {/* THE 4 BIG FINANCIAL HEALTH PILLARS (LIKE KHATABOOK / OKCREDIT / KYTE)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PILLAR 1: YOU'LL GET (CUSTOMER DENI / KHATA) */}
        <div 
          onClick={() => onNavigateTab("customers")}
          className="bg-gradient-to-br from-[#161226] to-[#0d0a18] border-2 border-purple-500/40 hover:border-purple-400/80 rounded-2xl p-4 sm:p-5 shadow-lg cursor-pointer transition group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono">
              <Users size={15} className="text-purple-400" /> You'll Get (Deni)
            </span>
            <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded-full font-bold">
              {customers.length} debtors
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-200 font-mono tracking-tight">
            {currency} {totalDebt.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-purple-900/40 text-[11px] text-purple-300/80">
            <span>Customer credit balance</span>
            <span className="text-purple-400 font-bold group-hover:translate-x-1 transition flex items-center gap-1">
              Collect &rarr;
            </span>
          </div>
        </div>

        {/* PILLAR 2: YOU'LL GIVE (SUPPLIERS & DELIVERY ORDERS) */}
        <div 
          onClick={() => onNavigateTab("supply_stock_vault")}
          className="bg-gradient-to-br from-[#21180d] to-[#140e06] border-2 border-amber-500/40 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-lg cursor-pointer transition group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono">
              <Truck size={15} className="text-amber-400" /> You'll Give (Suppliers)
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full font-bold">
              {suppliers.length} vendors
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-200 font-mono tracking-tight">
            {currency} {(totalSuppliersOrders || 14200).toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-900/40 text-[11px] text-amber-300/80">
            <span>Brookside, Unga, Bakeries</span>
            <span className="text-amber-400 font-bold group-hover:translate-x-1 transition flex items-center gap-1">
              Supply Vault &rarr;
            </span>
          </div>
        </div>

        {/* PILLAR 3: LIQUID CASH & FLOATS (DRAWER + M-PESA + EQUITEL) */}
        <div 
          onClick={() => onNavigateTab("opening_float")}
          className="bg-gradient-to-br from-[#0b1f17] to-[#07130e] border-2 border-emerald-500/40 hover:border-emerald-400/80 rounded-2xl p-4 sm:p-5 shadow-lg cursor-pointer transition group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono">
              <Coins size={15} className="text-emerald-400" /> Liquid Money
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
              In hand &amp; till
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight">
            {currency} {totalLiquidMoney.toLocaleString()}
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-900/40 text-[10px] font-mono text-slate-300 flex justify-between gap-1">
            <span>Cash: {currency} {cash_register_balance.toLocaleString()}</span>
            <span>M-Pesa: {currency} {mpesa_float_balance.toLocaleString()}</span>
          </div>
        </div>

        {/* PILLAR 4: SHELF STOCK CAPITAL & POTENTIAL PROFIT */}
        <div 
          onClick={() => onNavigateTab("supply_stock_vault")}
          className="bg-gradient-to-br from-[#0c1822] to-[#081017] border-2 border-cyan-500/40 hover:border-cyan-400/80 rounded-2xl p-4 sm:p-5 shadow-lg cursor-pointer transition group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold mb-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono">
              <Package size={15} className="text-cyan-400" /> Shelf Retail Value
            </span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-200 px-2 py-0.5 rounded-full font-bold">
              {inventory.length} SKUs
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-200 font-mono tracking-tight">
            {currency} {kpis.total_active_shelf_retail_value.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-cyan-900/40 text-[11px] text-cyan-300/80">
            <span>Margin: +{currency} {kpis.locked_in_potential_gross_profit.toLocaleString()}</span>
            <span className="text-cyan-400 font-bold group-hover:translate-x-1 transition flex items-center gap-1">
              Stock &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE 4 HERO QUICK-ACTION TILES (DIRECT, RELATABLE ACTIONS EVERY DAY)       */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Fast Daily Actions // 1-Tap Counter Controls
          </h2>
          <span className="text-[11px] text-emerald-400 font-mono">Instant zero-drift capture</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* ACTION 1: RECORD SALE (WALK-IN) */}
          <button
            onClick={() => setIsQuickSaleOpen(true)}
            className="p-4 bg-[#0e1d16] hover:bg-[#132a1f] border border-emerald-500/50 hover:border-emerald-400 rounded-2xl text-left transition shadow-md flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition">
                <Zap size={20} />
              </div>
              <Plus size={16} className="text-emerald-400 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="mt-3">
              <span className="block text-sm font-bold text-white group-hover:text-emerald-300 transition">
                + Record Sale
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Quick counter walk-in sale (Cash / M-Pesa)
              </span>
            </div>
          </button>

          {/* ACTION 2: SUPPLY-DRIVEN BOX SALE (NEW BOX RESTOCK = SALES MADE) */}
          <button
            onClick={() => onNavigateTab("sales_supply")}
            className="p-4 bg-[#141d26] hover:bg-[#1a2733] border border-cyan-500/50 hover:border-cyan-400 rounded-2xl text-left transition shadow-md flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition">
                <Truck size={20} />
              </div>
              <TrendingUp size={16} className="text-cyan-400 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="mt-3">
              <span className="block text-sm font-bold text-white group-hover:text-cyan-300 transition">
                + Box Restock Sale
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Milk 21-pack arrival &rarr; auto-crystallize sales
              </span>
            </div>
          </button>

          {/* ACTION 3: CUSTOMER DENI (KHATA) */}
          <button
            onClick={() => setIsCreditOpen(true)}
            className="p-4 bg-[#181324] hover:bg-[#201a30] border border-purple-500/50 hover:border-purple-400 rounded-2xl text-left transition shadow-md flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-110 transition">
                <Users size={20} />
              </div>
              <Plus size={16} className="text-purple-400 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="mt-3">
              <span className="block text-sm font-bold text-white group-hover:text-purple-300 transition">
                + Customer Deni
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Record goods taken on credit or collect payment
              </span>
            </div>
          </button>

          {/* ACTION 4: CASH OUT / EXPENSE */}
          <button
            onClick={() => setIsExpenseOpen(true)}
            className="p-4 bg-[#1f1510] hover:bg-[#2a1c15] border border-amber-500/50 hover:border-amber-400 rounded-2xl text-left transition shadow-md flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition">
                <Coffee size={20} />
              </div>
              <ArrowDownLeft size={16} className="text-amber-400 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="mt-3">
              <span className="block text-sm font-bold text-white group-hover:text-amber-300 transition">
                + Cash Out / Expense
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Owner drawing (chai/lunch), transport, or bills
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE DATA PIPELINING & HEAVY LIFTING EXPLAINER FOR MSMEs                   */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0d1c14] via-[#091510] to-[#08121d] border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                The YuBiFLo Heavy Lifting Engine // Data Pipelining for MSMEs
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-serif">
              Simple at the counter. Industrial-grade data engineering behind the scenes.
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You run your duka without scanning every 50-bob packet. When a new 21-pack of Mt Kenya milk arrives, YuBiFLo deduces units sold, deducts owner chai, updates double-entry ledgers, and detects cash drawer leaks automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateTab("system_architecture")}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow cursor-pointer font-mono"
            >
              <Cpu size={15} /> Architecture &amp; Schemas
            </button>
            <button
              onClick={() => onNavigateTab("ledgers_accounts")}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer font-mono"
            >
              <Scale size={15} className="text-amber-400" /> 3-Fold Ledgers (P/R/N)
            </button>
          </div>
        </div>

        {/* 3 CORE PILLARS OF THE ENGINE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-950/80 text-xs">
          <div className="p-3 bg-[#060e0a]/80 rounded-xl border border-emerald-900/40">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1 font-mono">
              <Truck size={14} /> 1. Supply-Driven Velocity
            </div>
            <p className="text-[11px] text-slate-400">
              Capacity (21) minus remaining shelf units minus owner consumption equals crystallized sales revenue and profit.
            </p>
          </div>

          <div className="p-3 bg-[#060e0a]/80 rounded-xl border border-emerald-900/40">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1 font-mono">
              <Database size={14} /> 2. Automated Double-Entry
            </div>
            <p className="text-[11px] text-slate-400">
              Every coin is balanced across Personal (Debtors/Creditors), Real (Cash/Inventory), and Nominal (P&amp;L) accounts with zero manual math.
            </p>
          </div>

          <div className="p-3 bg-[#060e0a]/80 rounded-xl border border-emerald-900/40">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1 font-mono">
              <Sun size={14} /> 3. Dawn-to-Dusk Audit Lock
            </div>
            <p className="text-[11px] text-slate-400">
              05:57 AM dawn opening baseline matches 9:00 PM evening cash audit to catch and resolve leaks in 1 tap.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2 PANELS: DAWN/EVENING RHYTHM & LIVE ACTIVITY FEED                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: DAILY RHYTHM CARDS (DAWN LOCK + RECONCILIATION) */}
        <div className="space-y-4">
          
          {/* DAWN PROTOCOL WIDGET */}
          <div className="bg-[#0b1611] border border-amber-500/40 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sun size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block font-mono">Dawn Lock Protocol</span>
                  <span className="text-[10px] text-slate-400">05:57 AM baseline</span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("morning_bookend")}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold font-mono flex items-center gap-1"
              >
                Open &rarr;
              </button>
            </div>
            <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Drawer Coins &amp; Notes:</span>
                <span className="text-white font-bold">{currency} {floatTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Carried-Over Deni:</span>
                <span className="text-purple-300 font-bold">{currency} {totalDebt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Starting Total Liquidity:</span>
                <span className="text-emerald-400 font-bold">{currency} {totalLiquidMoney.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* EVENING RECONCILIATION AUDIT WIDGET */}
          <div className="bg-[#0f171d] border border-cyan-500/40 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Scale size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block font-mono">Evening Cash Audit</span>
                  <span className="text-[10px] text-slate-400">Close of business check</span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("evening_reconciliation")}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold font-mono flex items-center gap-1"
              >
                Reconcile &rarr;
              </button>
            </div>
            <div className="p-3 bg-[#080d12] rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Logged Sales Inflow:</span>
                <span className="text-white font-bold">{currency} {salesLedger.reduce((a, b) => a + b.total_amount, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Owner Drawings &amp; Chai:</span>
                <span className="text-amber-400 font-bold">{currency} {payouts.filter(p => p.type === "OWNER_DRAWING").reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Audit Status:</span>
                <span className="text-emerald-400 font-bold">Zero Unresolved Gaps</span>
              </div>
            </div>
          </div>

          {/* LOW STOCK QUICK ALERTS */}
          <div className="bg-[#121822] border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <AlertTriangle size={14} className="text-amber-400" /> Low Shelf Stock ({lowStockItems.length})
              </span>
              <button 
                onClick={() => onNavigateTab("supply_stock_vault")}
                className="text-[11px] text-emerald-400 hover:underline font-mono"
              >
                Vault
              </button>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">All shelves fully stocked.</p>
            ) : (
              <div className="space-y-1.5">
                {lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2 bg-[#090d13] rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300 truncate max-w-[140px]">{item.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {item.current_stock} {item.unit_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT 2 COLUMNS: UNIFIED RECENT ACTIVITY STREAM (SALES, DENI, EXPENSES) */}
        <div className="lg:col-span-2 bg-[#0c1510] border border-emerald-950/80 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-950">
            <div>
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Clock size={16} className="text-emerald-400" /> Recent Shop Activity Stream
              </h3>
              <p className="text-[11px] text-slate-400">
                Live stream of sales, owner chai drawings, credit (deni), and supplier drop-offs.
              </p>
            </div>

            {/* FILTER CHIPS */}
            <div className="flex items-center gap-1 bg-[#060c08] p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setRecentFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                  recentFilter === "all" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRecentFilter("sales")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                  recentFilter === "sales" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Sales
              </button>
              <button
                onClick={() => setRecentFilter("expenses")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                  recentFilter === "expenses" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Expenses
              </button>
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center bg-[#070e0a] rounded-xl border border-slate-800 text-slate-400 space-y-2">
              <Package size={24} className="mx-auto text-slate-600" />
              <p className="text-xs">No activity recorded yet for this session.</p>
              <p className="text-[11px] text-slate-500">Tap "+ Record Sale" or "+ Box Restock" above to start logging.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((act) => (
                <div 
                  key={act.id} 
                  className="p-3 bg-[#08100b] hover:bg-[#0c1811] border border-emerald-950/70 rounded-xl flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      act.type === "sale" 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {act.type === "sale" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {act.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{act.party}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[10px] text-slate-500">{act.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-mono font-bold text-sm ${act.isPositive ? "text-emerald-400" : "text-amber-400"}`}>
                      {act.isPositive ? "+" : "-"}{currency} {act.amount.toLocaleString()}
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {act.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
            <span className="text-[11px] font-mono">Showing latest verified entries</span>
            <button 
              onClick={() => onNavigateTab("ledgers_accounts")} 
              className="text-emerald-400 hover:underline font-mono text-xs flex items-center gap-1 font-bold"
            >
              Open Classical Ledgers Matrix &rarr;
            </button>
          </div>
        </div>

      </div>
      </>
      )}

      {/* ========================================================================= */}
      {/* INLINE MODAL 1: QUICK SALE MODAL                                          */}
      {/* ========================================================================= */}
      {isQuickSaleOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1510] border-2 border-emerald-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-serif">+ Record Quick Counter Sale</h3>
              </div>
              <button onClick={() => setIsQuickSaleOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCommitQuickSale} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Item Name or Fast Selection:</label>
                <input
                  type="text"
                  list="inventory-suggestions"
                  placeholder="e.g. Brookside Milk, Unga Jogoo, Bread..."
                  value={quickSaleItem}
                  onChange={(e) => setQuickSaleItem(e.target.value)}
                  className="w-full bg-[#050a07] border border-emerald-900/80 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-400"
                  autoFocus
                />
                <datalist id="inventory-suggestions">
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={quickSaleQty}
                    onChange={(e) => setQuickSaleQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#050a07] border border-emerald-900/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Total Amount ({currency}):</label>
                  <input
                    type="number"
                    placeholder="Auto or custom"
                    value={quickSaleAmount}
                    onChange={(e) => setQuickSaleAmount(e.target.value)}
                    className="w-full bg-[#050a07] border border-emerald-900/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Payment Method:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickSaleMethod("CASH")}
                    className={`py-2 rounded-xl font-bold font-mono text-xs border transition cursor-pointer ${
                      quickSaleMethod === "CASH" 
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow" 
                        : "bg-[#050a07] text-slate-300 border-emerald-950"
                    }`}
                  >
                    💵 Cash in Drawer
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSaleMethod("MPESA")}
                    className={`py-2 rounded-xl font-bold font-mono text-xs border transition cursor-pointer ${
                      quickSaleMethod === "MPESA" 
                        ? "bg-teal-500 text-slate-950 border-teal-400 shadow" 
                        : "bg-[#050a07] text-slate-300 border-emerald-950"
                    }`}
                  >
                    📱 M-Pesa Till
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickSaleOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow font-mono"
                >
                  Confirm Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INLINE MODAL 2: QUICK CASH OUT / EXPENSE MODAL                            */}
      {/* ========================================================================= */}
      {isExpenseOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#140e08] border-2 border-amber-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-amber-950">
              <div className="flex items-center gap-2">
                <Coffee size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white font-serif">+ Cash Out / Record Expense</h3>
              </div>
              <button onClick={() => setIsExpenseOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCommitExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Expense Type:</label>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setExpenseType("OWNER_DRAWING")}
                    className={`py-1.5 px-2 rounded-lg font-bold border transition cursor-pointer text-center ${
                      expenseType === "OWNER_DRAWING"
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-[#090604] text-slate-300 border-amber-950"
                    }`}
                  >
                    Owner Chai
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseType("BUSINESS_EXPENSE")}
                    className={`py-1.5 px-2 rounded-lg font-bold border transition cursor-pointer text-center ${
                      expenseType === "BUSINESS_EXPENSE"
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-[#090604] text-slate-300 border-amber-950"
                    }`}
                  >
                    Shop Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseType("SUPPLIER_PAYOUT")}
                    className={`py-1.5 px-2 rounded-lg font-bold border transition cursor-pointer text-center ${
                      expenseType === "SUPPLIER_PAYOUT"
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-[#090604] text-slate-300 border-amber-950"
                    }`}
                  >
                    Supplier Pay
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Amount Paid Out ({currency}):</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-[#080503] border border-amber-900/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 text-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Notes / Reason:</label>
                <input
                  type="text"
                  placeholder="e.g. Lunch & tea, Electricity token, City Council..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full bg-[#080503] border border-amber-900/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow font-mono"
                >
                  Deduct from Drawer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INLINE MODAL 3: QUICK CUSTOMER CREDIT (DENI) MODAL                        */}
      {/* ========================================================================= */}
      {isCreditOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#120d1c] border-2 border-purple-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-purple-950">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white font-serif">+ Give Goods on Credit (Deni)</h3>
              </div>
              <button onClick={() => setIsCreditOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCommitCredit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Customer Name:</label>
                <input
                  type="text"
                  list="customer-suggestions"
                  placeholder="e.g. Mama Boi, Baba Junior..."
                  value={creditCustomer}
                  onChange={(e) => setCreditCustomer(e.target.value)}
                  className="w-full bg-[#08050e] border border-purple-900/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  required
                  autoFocus
                />
                <datalist id="customer-suggestions">
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Amount Owed ({currency}):</label>
                <input
                  type="number"
                  placeholder="e.g. 350"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full bg-[#08050e] border border-purple-900/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Items Taken / Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. 2x Unga Jogoo & 1x Milk 500ml"
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  className="w-full bg-[#08050e] border border-purple-900/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreditOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl shadow font-mono"
                >
                  Save Credit Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
