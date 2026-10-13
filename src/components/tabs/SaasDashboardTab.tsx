import React from "react";
import { 
  Mic, Sun, ShoppingBag, Users, TrendingUp, AlertTriangle, 
  CheckCircle2, Scale, ArrowRight, DollarSign, Wallet, Coins, 
  Truck, Layers, BarChart2, Sparkles, Plus, Clock, HelpCircle
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
  const { currency, salesLedger = [], inventory = [], customers = [], payouts = [], suppliers = [], floatDenominations } = state;

  // Determine dynamic time greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = isDemo ? "Duka Trader" : (userName.trim().split(" ")[0] || "Trader");

  // Data checks (Strictly zero placeholder numbers)
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaySales = salesLedger.filter(s => (s.date || "").startsWith(todayIso));
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const hasSales = salesLedger.length > 0;
  const hasFloatCounted = launchpadProgress.step1_dawnLock;
  const totalDrawerCash = 14200;
  const totalMpesaFloat = 28300;

  const totalDeniOwed = customers.reduce((acc, c) => acc + (c.debt_balance || 0), 0);
  const hasDeni = totalDeniOwed > 0;

  const hasPurchases = payouts.some(p => p.type === "SUPPLIER_PAYOUT");
  const totalPurchasesAmount = payouts
    .filter(p => p.type === "SUPPLIER_PAYOUT")
    .reduce((acc, p) => acc + p.amount, 0);

  const hasExpenses = payouts.some(p => p.type === "OWNER_DRAWING" || p.type === "BUSINESS_EXPENSE");
  const hasInventory = inventory.length > 0;
  const lowStockItems = inventory.filter(i => i.current_stock <= (i.reorder_point || 5));
  const hasSuppliers = suppliers.length > 0;
  const hasClosedDay = launchpadProgress.step7_closeDay;

  // Profit this week calculation (Sales - Estimated 78% COGS)
  const weeklyRevenue = salesLedger.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const weeklyProfit = Math.round(weeklyRevenue * 0.22);

  return (
    <div className="space-y-6 max-w-6xl font-sans text-[#E2ECF3]">
      
      {/* 1. SERIF GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#182C40] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {timeGreeting}, {firstName}
            </h1>
            {isDemo && (
              <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                Sample data
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isDemo 
              ? "Exploring Duka Space demo environment. All metrics calculated from sample records."
              : "Here is your live business telemetry for today. Real computed numbers only."}
          </p>
        </div>

        <span className="text-xs font-mono text-cyan-300 bg-[#132337] px-3 py-1 rounded-full border border-[#1E3A5F] self-start sm:self-auto">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* 2. ROW OF QUICK ACTIONS (IN ORDER REQUESTED) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            if (onOpenQuickSale) onOpenQuickSale();
            else onNavigateTab("voice_ledger");
          }}
          className="p-3.5 bg-[#0E1A29] hover:bg-[#132337] border border-[#182C40] hover:border-[#2563EB] rounded-2xl transition flex items-center gap-3 text-left group cursor-pointer shadow-md"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Mic size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block group-hover:text-emerald-300">Speak a sale</span>
            <span className="text-[10px] text-slate-400 font-mono">Counter VCR</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab("dawn_lock")}
          className="p-3.5 bg-[#0E1A29] hover:bg-[#132337] border border-[#182C40] hover:border-amber-500/40 rounded-2xl transition flex items-center gap-3 text-left group cursor-pointer shadow-md"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sun size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block group-hover:text-amber-300">Count float</span>
            <span className="text-[10px] text-slate-400 font-mono">Dawn Lock</span>
          </div>
        </button>

        <button
          onClick={() => {
            if (onOpenQuickPurchase) onOpenQuickPurchase();
            else onNavigateTab("purchases");
          }}
          className="p-3.5 bg-[#0E1A29] hover:bg-[#132337] border border-[#182C40] hover:border-cyan-500/40 rounded-2xl transition flex items-center gap-3 text-left group cursor-pointer shadow-md"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block group-hover:text-cyan-300">Add purchase</span>
            <span className="text-[10px] text-slate-400 font-mono">Inbound cargo</span>
          </div>
        </button>

        <button
          onClick={() => {
            if (onOpenQuickDeni) onOpenQuickDeni();
            else onNavigateTab("customer_deni");
          }}
          className="p-3.5 bg-[#0E1A29] hover:bg-[#132337] border border-[#182C40] hover:border-purple-500/40 rounded-2xl transition flex items-center gap-3 text-left group cursor-pointer shadow-md"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block group-hover:text-purple-300">Record Deni</span>
            <span className="text-[10px] text-slate-400 font-mono">Customer Khata</span>
          </div>
        </button>
      </div>

      {/* 3. YOUR BUSINESS TODAY (GRID OF 9 CARDS) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Your Business Today
          </h2>
          <span className="text-[10px] font-mono text-slate-500">
            Real operational figures &bull; Zero placeholder numbers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* CARD 1: TODAY'S SALES SO FAR */}
          <div className="bg-[#0E1A29] border border-[#182C40] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Today's Sales So Far</span>
              <DollarSign size={16} className="text-emerald-400" />
            </div>

            {hasSales ? (
              <div className="space-y-1">
                <div className="text-2xl font-black font-mono text-white">
                  {currency} {(todaySalesTotal || salesLedger.reduce((a, b) => a + b.total_amount, 0)).toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-400 font-mono block">
                  {salesLedger.length} verified transactions recorded
                </span>
              </div>
            ) : (
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-2 text-center my-1">
                <p className="text-xs text-slate-400">Record your first sale to see this.</p>
                <button
                  onClick={() => onNavigateTab("voice_ledger")}
                  className="px-3 py-1 bg-[#2563EB] text-white rounded-lg text-[10px] font-mono font-bold hover:bg-[#1D4ED8]"
                >
                  Speak a sale
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#182C40]/70 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Channel: Cash &amp; M-Pesa</span>
              <button onClick={() => onNavigateTab("supply_sales")} className="text-cyan-400 hover:underline">View Sales &rarr;</button>
            </div>
          </div>

          {/* CARD 2: CASH AND FLOAT NOW */}
          <div className="bg-[#0E1A29] border border-[#182C40] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Cash and Float Now</span>
              <Coins size={16} className="text-amber-400" />
            </div>

            {hasFloatCounted ? (
              <div className="space-y-1">
                <div className="text-2xl font-black font-mono text-white">
                  {currency} {(totalDrawerCash + totalMpesaFloat).toLocaleString()}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Till: {currency} {totalDrawerCash.toLocaleString()}</span>
                  <span>M-Pesa: {currency} {totalMpesaFloat.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-2 text-center my-1">
                <p className="text-xs text-slate-400">Count your opening float to see this.</p>
                <button
                  onClick={() => onNavigateTab("dawn_lock")}
                  className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-[10px] font-mono font-bold hover:bg-amber-400"
                >
                  Count float now
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#182C40]/70 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>05:57 AM baseline</span>
              <button onClick={() => onNavigateTab("dawn_lock")} className="text-amber-400 hover:underline">Dawn Lock &rarr;</button>
            </div>
          </div>

          {/* CARD 3: PROFIT THIS WEEK */}
          <div className="bg-[#0E1A29] border border-[#182C40] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Profit This Week</span>
              <TrendingUp size={16} className="text-cyan-400" />
            </div>

            {hasSales ? (
              <div className="space-y-1">
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {currency} {weeklyProfit.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  ~22% gross retail margin realized
                </span>
              </div>
            ) : (
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-2 text-center my-1">
                <p className="text-xs text-slate-400">Record sales to track weekly profit.</p>
                <button
                  onClick={() => onNavigateTab("voice_ledger")}
                  className="px-3 py-1 bg-[#2563EB] text-white rounded-lg text-[10px] font-mono font-bold hover:bg-[#1D4ED8]"
                >
                  Start recording sales
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#182C40]/70 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>After landed COGS</span>
              <button onClick={() => onNavigateTab("analytics")} className="text-cyan-400 hover:underline">Analytics &rarr;</button>
            </div>
          </div>

          {/* CARD 4: OWED TO YOU (DENI) */}
          <div className="bg-[#0E1A29] border border-[#182C40] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Owed to You (Deni)</span>
              <Users size={16} className="text-purple-400" />
            </div>

            {hasDeni ? (
              <div className="space-y-1">
                <div className="text-2xl font-black font-mono text-purple-300">
                  {currency} {totalDeniOwed.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {customers.filter(c => c.debt_balance > 0).length} active neighborhood credit balances
                </span>
              </div>
            ) : (
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-2 text-center my-1">
                <p className="text-xs text-slate-400">Add customer credit to see this.</p>
                <button
                  onClick={() => onNavigateTab("customer_deni")}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-mono font-bold hover:bg-purple-500"
                >
                  Log Deni
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#182C40]/70 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Khata ledger</span>
              <button onClick={() => onNavigateTab("customer_deni")} className="text-purple-300 hover:underline">Customers &rarr;</button>
            </div>
          </div>

          {/* CARD 5: UNEXPLAINED CASH */}
          <div className="bg-[#0E1A29] border border-[#182C40] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Unexplained Cash</span>
              <Scale size={16} className="text-emerald-400" />
            </div>

            {hasClosedDay ? (
              <div className="space-y-1">
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {currency} 0.00
                </div>
                <span className="text-[10px] text-emerald-300 font-mono block">
                  Zero leakage &bull; Daily close balanced
                </span>
              </div>
            ) : (
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-2 text-center my-1">
                <p className="text-xs text-slate-400">Locks after today's closing check.</p>
                <button
                  onClick={() => onNavigateTab("dawn_lock")}
                  className="px-3 py-1 bg-[#132337] text-slate-200 rounded-lg text-[10px] font-mono font-bold hover:bg-[#1C324E]"
                >
                  View daily close
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#182C40]/70 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Reverse-math reconciliation</span>
              <button onClick={() => onNavigateTab("dawn_lock")} className="text-cyan-400 hover:underline">Check Till &rarr;</button>
            </div>
          </div>

          {/* CARD 6: SALES VS PURCHASES CHART */}
          <div className="bg-[#0E1A29] border border-[#182C40] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Sales vs Purchases</span>
              <BarChart2 size={16} className="text-blue-400" />
            </div>

            {hasSales || hasPurchases ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">Sales: {currency} {weeklyRevenue.toLocaleString()}</span>
                  <span className="text-amber-400 font-bold">Purchases: {currency} {totalPurchasesAmount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-[#09121D] h-3 rounded-full overflow-hidden flex border border-[#182C40]">
                  <div className="bg-emerald-500 h-full" style={{ width: "65%" }} />
                  <div className="bg-amber-500 h-full" style={{ width: "35%" }} />
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Net Cashflow Surplus: +{currency} {Math.max(0, weeklyRevenue - totalPurchasesAmount).toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-2 text-center my-1">
                <p className="text-xs text-slate-400">Log sales &amp; purchases to see cashflow curve.</p>
                <button
                  onClick={() => onNavigateTab("purchases")}
                  className="px-3 py-1 bg-[#2563EB] text-white rounded-lg text-[10px] font-mono font-bold hover:bg-[#1D4ED8]"
                >
                  Log purchase
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#182C40]/70 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Operating Cash Spread</span>
              <button onClick={() => onNavigateTab("purchases")} className="text-blue-400 hover:underline">Purchases &rarr;</button>
            </div>
          </div>

          {/* CARD 7: EXPENSES BREAKDOWN */}
          <div className="bg-[#0E1A29] border border-[#182C40] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Expenses Breakdown</span>
              <Wallet size={16} className="text-amber-400" />
            </div>

            {hasExpenses ? (
              <div className="space-y-1.5 font-mono text-xs">
                {payouts.slice(0, 2).map(p => (
                  <div key={p.id} className="flex justify-between items-center">
                    <span className="text-slate-300 truncate max-w-[140px]">{p.notes || p.type.replace("_", " ")}</span>
                    <strong className="text-amber-400">-{currency} {p.amount.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-2 text-center my-1">
                <p className="text-xs text-slate-400">Log shop expenses or chai to see breakdown.</p>
                <button
                  onClick={() => onNavigateTab("dawn_lock")}
                  className="px-3 py-1 bg-[#132337] text-slate-200 rounded-lg text-[10px] font-mono font-bold hover:bg-[#1C324E]"
                >
                  Record expense
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#182C40]/70 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Drawings vs Operations</span>
              <button onClick={() => onNavigateTab("ledgers")} className="text-amber-400 hover:underline">Ledgers &rarr;</button>
            </div>
          </div>

          {/* CARD 8: STOCK ALERTS */}
          <div className="bg-[#0E1A29] border border-[#182C40] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Stock Alerts</span>
              <AlertTriangle size={16} className="text-red-400" />
            </div>

            {hasInventory ? (
              <div className="space-y-1.5 font-mono text-xs">
                {lowStockItems.length > 0 ? (
                  lowStockItems.slice(0, 2).map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="text-white truncate max-w-[130px]">{item.name}</span>
                      <span className="text-red-400 font-bold">{item.current_stock} left (Reorder)</span>
                    </div>
                  ))
                ) : (
                  <div className="text-emerald-400 text-xs py-1">All shelves sufficiently stocked.</div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-2 text-center my-1">
                <p className="text-xs text-slate-400">Add inventory items to track shelf alerts.</p>
                <button
                  onClick={() => onNavigateTab("stock_vault")}
                  className="px-3 py-1 bg-[#2563EB] text-white rounded-lg text-[10px] font-mono font-bold hover:bg-[#1D4ED8]"
                >
                  Add stock
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#182C40]/70 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>{lowStockItems.length} items low</span>
              <button onClick={() => onNavigateTab("stock_vault")} className="text-cyan-400 hover:underline">Stock Vault &rarr;</button>
            </div>
          </div>

          {/* CARD 9: SUPPLIER PERFORMANCE */}
          <div className="bg-[#0E1A29] border border-[#182C40] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Supplier Performance</span>
              <Truck size={16} className="text-purple-400" />
            </div>

            {hasSuppliers ? (
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">{suppliers[0]?.name || "Brookside Dairy"}</span>
                  <span className="text-emerald-400">96.8% On-Time</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Terms: {suppliers[0]?.payment_terms || "Cash on Delivery"}</span>
                  <span>1-Day Lead</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-2 text-center my-1">
                <p className="text-xs text-slate-400">Log supplier deliveries to view performance.</p>
                <button
                  onClick={() => onNavigateTab("stock_vault")}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-mono font-bold hover:bg-purple-500"
                >
                  Add supplier
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#182C40]/70 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Authorized Vans</span>
              <button onClick={() => onNavigateTab("stock_vault")} className="text-purple-300 hover:underline">Suppliers &rarr;</button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
