import React from "react";
import {
  TrendingUp,
  ArrowUpRight,
  Boxes,
  Zap,
  RefreshCw,
  Scale,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Flame,
  Truck,
  CreditCard,
  Compass,
  Flower2,
  Sprout,
  ShieldCheck,
  CheckCircle2,
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

interface ExecutiveBloomDashboardProps {
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
  hideHeaderAndKpi?: boolean;
}

export const ExecutiveBloomDashboard: React.FC<ExecutiveBloomDashboardProps> = ({
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
  hideHeaderAndKpi = false,
}) => {
  const totalRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.total_profit, 0);
  const totalMoneyOut = expenses.reduce((acc, e) => acc + e.total_cost, 0);
  const activeStockRetailValue = items.reduce(
    (acc, i) => acc + i.current_stock_qty * i.unit_selling_price,
    0
  );
  const activeStockCostValue = items.reduce(
    (acc, i) => acc + i.current_stock_qty * i.unit_cost_price,
    0
  );
  const avgGrossMargin =
    totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0;

  const totalOwedToSuppliers = suppliers.reduce((acc, s) => acc + s.outstanding_balance_owed, 0);
  const totalDeniOwedByCustomers = customers.reduce((acc, c) => acc + c.outstanding_credit_deni, 0);

  const latestReconciliation = reconciliations[0];
  const hasLeakage = latestReconciliation?.status === "LEAKAGE_DETECTED";

  const sortedItems = [...items].sort((a, b) => b.lifetime_revenue - a.lifetime_revenue);
  const lowStockItems = items.filter((i) => i.current_stock_qty <= i.reorder_point);

  // Business Blooming calculation: 4 stages
  const bloomScore = Math.min(
    100,
    Math.round(
      (items.length > 0 ? 25 : 10) +
        (sales.length > 5 ? 25 : sales.length * 5) +
        (avgGrossMargin > 20 ? 25 : avgGrossMargin) +
        (hasLeakage ? 0 : 25)
    )
  );

  const getBloomStage = (score: number) => {
    if (score >= 80) return { title: "Full Bloom & Flourishing", label: "Flourishing", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", pct: "95%" };
    if (score >= 60) return { title: "Active Flowering", label: "Blooming", color: "text-teal-300", bg: "bg-teal-500/10 border-teal-500/30", pct: "75%" };
    if (score >= 40) return { title: "Healthy Budding", label: "Budding", color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/30", pct: "50%" };
    return { title: "Nurturing Seedling", label: "Seedling", color: "text-indigo-300", bg: "bg-indigo-500/10 border-indigo-500/30", pct: "25%" };
  };

  const bloomStage = getBloomStage(bloomScore);

  return (
    <div id="executive-bloom-dashboard" className="space-y-5 animate-fadeIn">
      {!hideHeaderAndKpi && (
        <>
          {/* Blooming Progress & Executive Banner */}
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-strong)] p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
                    <Flower2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Executive Bloom Architecture</span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${bloomStage.bg} ${bloomStage.color}`}>
                    <Sprout className="w-3 h-3" />
                    <span>Stage: {bloomStage.label} ({bloomScore}/100)</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {merchant.shop_type} • {merchant.business_name}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                  Growth, Restock Velocity & Botanical Profit Engine
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Your business thrives without manual cashier friction. Restock arrivals continuously verify inventory velocity, validate 05:57 AM opening float, and safeguard operating margin.
                </p>

                {/* Bloom Life Cycle Progress Meter */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Seedling</span>
                    <span>Budding</span>
                    <span className="font-semibold text-emerald-300">Blooming</span>
                    <span>Flourishing</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${bloomScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  id="exec-btn-quick-dump"
                  onClick={() => setActiveTab("quick_dump")}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-xs font-bold text-white shadow-md transition-all border border-slate-700 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>⚡ Quick Raw Dump</span>
                </button>
                <button
                  id="exec-btn-restock"
                  onClick={() => onOpenRestock()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restock Arrived Batch</span>
                </button>
                <button
                  id="exec-btn-scan"
                  onClick={onOpenScanReceipts}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-amber-300 border border-slate-800 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Multi-Bill OCR</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Core Financial KPI Bento */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-2 shadow-sm hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Derived Sales</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-mono font-bold text-emerald-400 tracking-tight">
                  {merchant.currency} {totalRevenue.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                  <span className="text-emerald-500">✓</span> Verified turnover ({sales.length} batches)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-2 shadow-sm hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gross Margin Profit</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-mono font-bold text-white tracking-tight">
                  {merchant.currency} {totalProfit.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Margin: <span className="text-emerald-400 font-bold">{avgGrossMargin}%</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-2 shadow-sm hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Money Out</span>
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-mono font-bold text-slate-100 tracking-tight">
                  {merchant.currency} {totalMoneyOut.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {expenses.length} expenses & distributor costs
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-2 shadow-sm hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Shelf Value</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Boxes className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-mono font-bold text-slate-200 tracking-tight">
                  {merchant.currency} {activeStockRetailValue.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Cost: {merchant.currency} {activeStockCostValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 05:57 AM Morning Float Banner */}
      <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">
                05:57 AM Opening Float Snapshot
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                0557 HRS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Equity Paybill <strong className="text-rose-300 font-mono">1450180372031</strong> • M-Pesa E-Float • Drawer Till
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <span className="text-slate-400">Equity 1450180372031:</span>
            <span className="font-mono font-bold text-rose-300">
              {merchant.currency} {(morningLogs[0]?.equity_paybill_balance || morningLogs[0]?.equity_paybill_opening || 0).toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => setActiveTab("morning_float")}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open Float</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dual Debt Wings: Suppliers We Owe & Customer Credit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:border-slate-700 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Money Owed to Suppliers
              </span>
              <div className="text-base font-bold font-mono text-white">
                {merchant.currency} {totalOwedToSuppliers.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400">
                {suppliers.length} distributors • Inbound drops
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("people")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 border border-amber-500/30 transition-colors cursor-pointer shrink-0"
          >
            <span>Manage Drops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:border-slate-700 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                Customer Credit (Receivables)
              </span>
              <div className="text-base font-bold font-mono text-white">
                {merchant.currency} {totalDeniOwedByCustomers.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400">
                {customers.length} customers • Paybill & Credit
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("people")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-colors cursor-pointer shrink-0"
          >
            <span>Track Credit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reverse Reconciliation & Leakage Status Bar */}
      <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                hasLeakage
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {hasLeakage ? <AlertTriangle className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">
                  Daily Reverse Cash Reconciliation
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    hasLeakage
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {hasLeakage ? "LEAKAGE DETECTED" : "CASH BALANCED"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasLeakage
                  ? `Discrepancy of ${merchant.currency} ${(latestReconciliation?.discrepancy || 0).toLocaleString()} between expected velocity & counted register.`
                  : "Actual cash intake strictly matches computed batch restock velocity. Zero unaccounted leakage."}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenReconcile}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Reverse Cash</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Fast Moving Inventory & Recent Supply-Driven Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-display">
                Active Stock & Velocity Ranks
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("stock")}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {sortedItems.slice(0, 5).map((item, idx) => {
              const isLow = item.current_stock_qty <= item.reorder_point;
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center text-xs font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-slate-200 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono mt-0.5">
                        <span>Price: {merchant.currency} {item.unit_selling_price}</span>
                        <span>•</span>
                        <span>Stock: {item.current_stock_qty} {item.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isLow ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Healthy
                      </span>
                    )}
                    <button
                      onClick={() => onOpenRestock(item.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Sales Ledger Feed */}
        <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-display">
                Supply-Triggered Ledger
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("sales")}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {sales.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 truncate">{entry.item_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {entry.quantity_sold} units • Batch #{entry.batch_id.slice(-4)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-emerald-400">
                    +{merchant.currency} {entry.total_revenue.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Profit: +{merchant.currency} {entry.total_profit.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
