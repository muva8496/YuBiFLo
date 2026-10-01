import React from "react";
import {
  Zap,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Truck,
  Plus,
  Coins,
  CheckCircle2,
  PackageCheck,
  Flame,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import {
  InventoryItem,
  Merchant,
  MoneyOutExpense,
  SalesLedgerEntry,
  SupplyBatch,
  ReconciliationRecord,
  Supplier,
  Customer,
  DailyMorningFloatLog,
} from "../../types";

interface RetailCommandDashboardProps {
  merchant: Merchant;
  items: InventoryItem[];
  expenses: MoneyOutExpense[];
  batches: SupplyBatch[];
  sales: SalesLedgerEntry[];
  reconciliations: ReconciliationRecord[];
  morningLogs: DailyMorningFloatLog[];
  suppliers: Supplier[];
  customers: Customer[];
  onOpenMoneyOut: () => void;
  onOpenRestock: (itemId?: string) => void;
  onOpenScanReceipts: () => void;
  onOpenReconcile: () => void;
  setActiveTab: (tab: string) => void;
}

export const RetailCommandDashboard: React.FC<RetailCommandDashboardProps> = ({
  merchant,
  items,
  expenses,
  batches,
  sales,
  reconciliations,
  morningLogs,
  suppliers,
  customers,
  onOpenMoneyOut,
  onOpenRestock,
  onOpenScanReceipts,
  onOpenReconcile,
  setActiveTab,
}) => {
  const totalRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalMoneyOut = expenses.reduce((acc, e) => acc + e.total_cost, 0);
  const lowStockItems = items.filter((i) => i.current_stock_qty <= i.reorder_point);
  const customersWithCredit = customers.filter((c) => c.outstanding_credit_deni > 0);
  const totalCustomerDeni = customersWithCredit.reduce((acc, c) => acc + c.outstanding_credit_deni, 0);
  const suppliersOwed = suppliers.filter((s) => s.outstanding_balance_owed > 0);
  const totalSupplierOwed = suppliersOwed.reduce((acc, s) => acc + s.outstanding_balance_owed, 0);

  const activeFloat = morningLogs[0];
  const cashDrawer = activeFloat?.cash_drawer_opening || 0;
  const equityPaybill = activeFloat?.equity_paybill_balance || activeFloat?.equity_paybill_opening || 0;
  const mpesaFloat = activeFloat?.mpesa_float_opening || 0;
  const totalReadyLiquid = cashDrawer + equityPaybill + mpesaFloat;

  return (
    <div id="retail-command-dashboard" className="space-y-5 animate-fadeIn">
      {/* Top Banner: Retail Speed Command Deck */}
      <div className="rounded-2xl bg-[#111827] border border-amber-500/20 p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Retail Counter Command Deck</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {merchant.shop_type} • Shop Floor Speed Mode
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              Fast Shop Floor Operations & One-Touch Execution
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Instant action controls optimized for fast retail shifts, peak-hour rush, drawer audit, and rapid batch restock triggers.
            </p>
          </div>

          {/* Quick Status Pill */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Shift Status</div>
              <div className="text-xs font-bold text-emerald-300 font-mono">COUNTER ACTIVE • VELOCITY ON</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Command Tiles Grid (Large, Touch-Friendly, Instant) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab("quick_dump")}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-amber-500/30 hover:border-amber-400/60 transition-all text-left flex flex-col justify-between gap-3 group shadow-md cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 font-display">
              ⚡ Quick Raw Dump
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Rapid text/paste intake</div>
          </div>
        </button>

        <button
          onClick={() => onOpenRestock()}
          className="p-4 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/30 hover:border-emerald-400/60 transition-all text-left flex flex-col justify-between gap-3 group shadow-md cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300 font-display">
              + Restock Batch
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Auto-proves sales velocity</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("morning_float")}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-left flex flex-col justify-between gap-3 group shadow-md cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-rose-300 font-display">
              05:57 AM Float
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Paybill 1450180372031</div>
          </div>
        </button>

        <button
          onClick={onOpenMoneyOut}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-left flex flex-col justify-between gap-3 group shadow-md cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-rose-300 font-display">
              Money Out (Expense)
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Record drops / supplier cash</div>
          </div>
        </button>

        <button
          onClick={onOpenScanReceipts}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-left flex flex-col justify-between gap-3 group shadow-md cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 font-display">
              Multi-Bill OCR
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Camera / slip ingestion</div>
          </div>
        </button>
      </div>

      {/* Shift Till & Operational Liquid Capital Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Liquid Float</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {merchant.currency} {totalReadyLiquid.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
            <div>Cash Drawer: {merchant.currency} {cashDrawer.toLocaleString()}</div>
            <div>Equity Paybill: {merchant.currency} {equityPaybill.toLocaleString()}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Derived Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {merchant.currency} {totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {sales.length} batches cleared • Velocity confirmed
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Deni (Receivables)</span>
            <CreditCard className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-300">
            {merchant.currency} {totalCustomerDeni.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            {customersWithCredit.length} debtors • Tap below to collect
          </div>
        </div>
      </div>

      {/* Two Critical Shop-Floor Panels: Low Stock Radar & Urgent Customer Deni */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Critical Low Stock Radar */}
        <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">
                Restock Radar: Urgent Items ({lowStockItems.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("stock")}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {lowStockItems.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>All stock is healthy! No products below reorder threshold.</span>
              </div>
            ) : (
              lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{item.name}</div>
                    <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                      Left: {item.current_stock_qty} {item.unit} (Alert at {item.reorder_point})
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenRestock(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                  >
                    + Restock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Urgent Customer Credit Collections */}
        <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">
                Customer Credit (Deni Tracker)
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("people")}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View People</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {customersWithCredit.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero outstanding customer credit. Excellent collection rate!</span>
              </div>
            ) : (
              customersWithCredit.slice(0, 5).map((cust) => (
                <div
                  key={cust.id}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{cust.full_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Phone: {cust.phone || "N/A"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-rose-300">
                      {merchant.currency} {cust.outstanding_credit_deni.toLocaleString()}
                    </span>
                    <button
                      onClick={() => setActiveTab("people")}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
