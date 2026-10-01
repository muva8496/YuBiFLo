import React from "react";
import {
  Scale,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  PieChart,
  Truck,
  CreditCard,
  Building2,
  FileCheck,
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

interface FinancialAuditDashboardProps {
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

export const FinancialAuditDashboard: React.FC<FinancialAuditDashboardProps> = ({
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
  const totalGrossProfit = sales.reduce((acc, s) => acc + s.total_profit, 0);
  const totalMoneyOut = expenses.reduce((acc, e) => acc + e.total_cost, 0);
  const netOperatingProfit = totalGrossProfit - totalMoneyOut;
  const netMarginPct = totalRevenue > 0 ? ((netOperatingProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const activeStockCostValue = items.reduce(
    (acc, i) => acc + i.current_stock_qty * i.unit_cost_price,
    0
  );
  const activeStockRetailValue = items.reduce(
    (acc, i) => acc + i.current_stock_qty * i.unit_selling_price,
    0
  );

  const totalOwedToSuppliers = suppliers.reduce((acc, s) => acc + s.outstanding_balance_owed, 0);
  const totalCustomerCredit = customers.reduce((acc, c) => acc + c.outstanding_credit_deni, 0);

  const activeFloat = morningLogs[0];
  const cashTotal = (activeFloat?.cash_drawer_opening || 0) + (activeFloat?.equity_paybill_balance || activeFloat?.equity_paybill_opening || 0);

  const totalCurrentAssets = cashTotal + activeStockCostValue + totalCustomerCredit;
  const totalCurrentLiabilities = totalOwedToSuppliers;
  const netWorkingCapital = totalCurrentAssets - totalCurrentLiabilities;

  const latestReconciliation = reconciliations[0];
  const hasLeakage = latestReconciliation?.status === "LEAKAGE_DETECTED";

  return (
    <div id="financial-audit-dashboard" className="space-y-5 animate-fadeIn">
      {/* Banner: Financial Audit & Double-Entry Intelligence */}
      <div className="rounded-2xl bg-[#111827] border border-emerald-500/20 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Financial Audit & T-Ledger Lens</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {merchant.currency} P&L • Reverse Reconciliation
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              Balance Sheet, Working Capital & Leakage Auditor
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Audit gross margins, operating expenses, supplier payables versus customer credit, and ensure zero cash leakage at closing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenReconcile}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Run Reverse Reconciliation</span>
            </button>
            <button
              onClick={() => setActiveTab("t_ledgers")}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Open T-Ledgers</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Financial Audit Pillars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Operating Profit</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-lg sm:text-2xl font-mono font-bold ${netOperatingProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {merchant.currency} {netOperatingProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Net Margin: <strong className="text-white">{netMarginPct}%</strong> (Post-Expenses)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Working Capital</span>
            <Building2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-lg sm:text-2xl font-mono font-bold text-teal-300">
            {merchant.currency} {netWorkingCapital.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Current Assets minus Payables
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supplier Debt (Payables)</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-2xl font-mono font-bold text-amber-300">
            {merchant.currency} {totalOwedToSuppliers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Liabilities across {suppliers.length} vendors
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receivables (Customer Deni)</span>
            <CreditCard className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg sm:text-2xl font-mono font-bold text-rose-300">
            {merchant.currency} {totalCustomerCredit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Uncollected credit from {customers.length} clients
          </div>
        </div>
      </div>

      {/* Reverse Reconciliation Deep Audit Card */}
      <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                hasLeakage
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {hasLeakage ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-display">
                  Reverse Cash Flow Formula Audit
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    hasLeakage
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {hasLeakage ? "FLAGGED FOR REVIEW" : "STRICT MATCH CONFIRMED"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Formula: Expected Cash = (Beginning Stock - Current Stock) * Unit Selling Price - Approved Deni
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-400">Reconciliation Records</div>
            <div className="text-sm font-bold font-mono text-white">
              {reconciliations.length} Audited Logs
            </div>
          </div>
        </div>

        {/* Working Capital Balance Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Working Capital Breakdown
            </div>
            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Cash & Liquid Float:</span>
                <span>{merchant.currency} {cashTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inventory at Cost:</span>
                <span>{merchant.currency} {activeStockCostValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Receivables:</span>
                <span className="text-emerald-400">+{merchant.currency} {totalCustomerCredit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 text-rose-400">
                <span>Supplier Payables (Debt):</span>
                <span>-{merchant.currency} {totalOwedToSuppliers.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Operating Efficiency & Markup
            </div>
            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Shelf Retail Value:</span>
                <span>{merchant.currency} {activeStockRetailValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shelf Cost Value:</span>
                <span>{merchant.currency} {activeStockCostValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Potential Unrealized Profit:</span>
                <span className="text-emerald-400 font-bold">
                  +{merchant.currency} {(activeStockRetailValue - activeStockCostValue).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">Avg Markup Percentage:</span>
                <span className="text-teal-300 font-bold">
                  {activeStockCostValue > 0
                    ? `${(((activeStockRetailValue - activeStockCostValue) / activeStockCostValue) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
