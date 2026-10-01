import React from "react";
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  PieChart,
  Smartphone,
  Coins,
  ShieldAlert,
  Zap,
  Building,
  Truck,
  Percent,
  Landmark,
} from "lucide-react";
import {
  Merchant,
  MoneyOutExpense,
  SalesLedgerEntry,
  ReconciliationRecord,
} from "../types";

interface CashflowViewProps {
  merchant: Merchant;
  sales: SalesLedgerEntry[];
  expenses: MoneyOutExpense[];
  reconciliations: ReconciliationRecord[];
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  merchant,
  sales,
  expenses,
  reconciliations,
}) => {
  const totalRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalCOGS = sales.reduce((acc, s) => acc + s.qty_sold * s.unit_cost_price, 0);
  const grossProfit = totalRevenue - totalCOGS;

  const totalInventoryExpenses = expenses
    .filter((e) => e.expense_type === "INVENTORY_PURCHASE")
    .reduce((acc, e) => acc + e.total_cost, 0);

  const totalOpExpenses = expenses
    .filter((e) => e.expense_type === "SHOP_EXPENSE")
    .reduce((acc, e) => acc + e.total_cost, 0);

  const netOperatingProfit = grossProfit - totalOpExpenses;

  // 3-Way Channel Calculation from reconciliations (Equity Paybill, M-Pesa, Cash)
  const totalEquity = reconciliations.reduce((acc, r) => acc + (r.actual_equity_paybill || 0), 0);
  const totalMpesa = reconciliations.reduce((acc, r) => acc + r.actual_mpesa, 0);
  const totalCash = reconciliations.reduce((acc, r) => acc + r.actual_cash, 0);
  const totalCollected = totalEquity + totalMpesa + totalCash;

  const equityPercentage =
    totalCollected > 0 ? ((totalEquity / totalCollected) * 100).toFixed(0) : "45";
  const mpesaPercentage =
    totalCollected > 0 ? ((totalMpesa / totalCollected) * 100).toFixed(0) : "35";
  const cashPercentage =
    totalCollected > 0 ? (100 - Number(equityPercentage) - Number(mpesaPercentage)).toString() : "20";

  // Leakage total
  const totalLeakage = reconciliations
    .filter((r) => r.status === "LEAKAGE_DETECTED")
    .reduce((acc, r) => acc + Math.abs(r.discrepancy_gap), 0);

  return (
    <div id="cashflow-view" className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span>Cashflow & Profit & Loss Statement (P&L)</span>
        </h1>
        <p className="text-xs text-slate-400">
          Holistic financial pulse connecting restock velocity, Equity Paybill + M-Pesa collections, and operating costs.
        </p>
      </div>

      {/* P&L Statement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* P&L Breakdown Card (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#18181b] border border-slate-800 space-y-4 shadow-xl">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center justify-between">
            <span>Executive Profit & Loss Statement</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {merchant.currency} Financials
            </span>
          </h2>

          <div className="space-y-2 font-mono text-xs">
            {/* Revenue */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5 font-sans">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Total Supply-Derived Revenue
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                +{merchant.currency} {totalRevenue.toLocaleString()}
              </span>
            </div>

            {/* Cost of Goods Sold */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                <ArrowUpRight className="w-4 h-4 text-red-400" />
                Less: Cost of Goods Sold (Wholesale Stock Cost)
              </span>
              <span className="font-bold text-red-400 text-sm">
                -{merchant.currency} {totalCOGS.toLocaleString()}
              </span>
            </div>

            {/* Gross Profit Line */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
              <span className="font-bold text-white font-sans">
                Gross Trading Margin ({totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}%)
              </span>
              <span className="font-bold text-white text-sm">
                ={merchant.currency} {grossProfit.toLocaleString()}
              </span>
            </div>

            {/* Operating Overheads */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                <Building className="w-4 h-4 text-indigo-400" />
                Less: Operating Overheads (KPLC Tokens, Rent, Kanjo, Wages)
              </span>
              <span className="font-bold text-indigo-300 text-sm">
                -{merchant.currency} {totalOpExpenses.toLocaleString()}
              </span>
            </div>

            {/* Net Operating Profit */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#18181b] border-2 border-emerald-500/40">
              <div>
                <span className="font-bold text-white text-sm block font-sans">
                  Net Operating Take-Home Profit
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  Real cash generated for the merchant
                </span>
              </div>
              <span className="font-bold text-emerald-400 text-lg sm:text-xl">
                {merchant.currency} {netOperatingProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Digital vs Cash Payment Ratio & Leakage Audit */}
        <div className="p-5 rounded-xl bg-[#18181b] border border-slate-800 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <span>3-Way Inflow Mix</span>
            </h2>

            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <Landmark className="w-3.5 h-3.5" />
                  Equity Paybill ({merchant.equity_paybill_number || "247247"})
                </span>
                <span className="font-bold font-mono text-rose-300">{equityPercentage}%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Smartphone className="w-3.5 h-3.5" />
                  M-Pesa (SIM E-Float)
                </span>
                <span className="font-bold font-mono text-emerald-400">{mpesaPercentage}%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  Physical Cash in Till
                </span>
                <span className="font-bold font-mono text-white">{cashPercentage}%</span>
              </div>

              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${equityPercentage}%` }}
                  className="bg-rose-500 h-full"
                />
                <div
                  style={{ width: `${mpesaPercentage}%` }}
                  className="bg-emerald-500 h-full"
                />
                <div
                  style={{ width: `${cashPercentage}%` }}
                  className="bg-amber-500 h-full"
                />
              </div>
            </div>

            {/* Leakage impact */}
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>Cumulative Audit Leakage Detected</span>
              </div>
              <div className="text-base font-bold text-red-300 font-mono">
                {merchant.currency} {totalLeakage.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400">
                Discrepancy caught by Reverse Gap Audits before it compounded.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            💡 <strong>05:57 AM Routine:</strong> Reconciling Equity Paybill and M-Pesa float daily at 05:57 AM eliminates end-of-month accounting discrepancies.
          </div>
        </div>
      </div>
    </div>
  );
};

