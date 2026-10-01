import React from "react";
import {
  Zap,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Boxes,
  Truck,
  CreditCard,
  Plus,
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

interface CompactTraderDashboardProps {
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

export const CompactTraderDashboard: React.FC<CompactTraderDashboardProps> = ({
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
  const totalProfit = sales.reduce((acc, s) => acc + s.total_profit, 0);
  const totalMoneyOut = expenses.reduce((acc, e) => acc + e.total_cost, 0);
  const activeStockRetail = items.reduce((acc, i) => acc + i.current_stock_qty * i.unit_selling_price, 0);
  const totalSupplierOwed = suppliers.reduce((acc, s) => acc + s.outstanding_balance_owed, 0);
  const totalCustomerDeni = customers.reduce((acc, c) => acc + c.outstanding_credit_deni, 0);

  const sortedItems = [...items].sort((a, b) => a.current_stock_qty - b.current_stock_qty);

  return (
    <div id="compact-trader-dashboard" className="space-y-4 animate-fadeIn">
      {/* Dense 6-Metric Status Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3 rounded-xl bg-[#111827] border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Sales</div>
          <div className="text-base font-bold font-mono text-emerald-400 mt-0.5 truncate">
            {merchant.currency} {totalRevenue.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#111827] border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400">Gross Profit</div>
          <div className="text-base font-bold font-mono text-white mt-0.5 truncate">
            {merchant.currency} {totalProfit.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#111827] border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400">Money Out</div>
          <div className="text-base font-bold font-mono text-rose-400 mt-0.5 truncate">
            {merchant.currency} {totalMoneyOut.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#111827] border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400">Stock Retail</div>
          <div className="text-base font-bold font-mono text-slate-200 mt-0.5 truncate">
            {merchant.currency} {activeStockRetail.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#111827] border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400">Supplier Debt</div>
          <div className="text-base font-bold font-mono text-amber-300 mt-0.5 truncate">
            {merchant.currency} {totalSupplierOwed.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#111827] border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400">Customer Deni</div>
          <div className="text-base font-bold font-mono text-rose-300 mt-0.5 truncate">
            {merchant.currency} {totalCustomerDeni.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Lean Action & Float Bar */}
      <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold text-slate-300 font-display">Compact Duka Command:</span>
          <span className="font-mono text-slate-400">
            Equity 1450180372031: <strong className="text-rose-300 font-bold">{merchant.currency} {(morningLogs[0]?.equity_paybill_balance || morningLogs[0]?.equity_paybill_opening || 0).toLocaleString()}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("quick_dump")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Raw Dump</span>
          </button>
          <button
            onClick={() => onOpenRestock()}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restock</span>
          </button>
          <button
            onClick={onOpenMoneyOut}
            className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs border border-rose-800/40 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Money Out</span>
          </button>
        </div>
      </div>

      {/* High-Density Stock Replenishment Table */}
      <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">
              Fast Inventory Matrix ({items.length} SKUs)
            </h2>
          </div>
          <button
            onClick={() => setActiveTab("stock")}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-semibold">SKU / Item</th>
                <th className="pb-2 font-semibold">Stock Qty</th>
                <th className="pb-2 font-semibold">Reorder Pt</th>
                <th className="pb-2 font-semibold">Cost</th>
                <th className="pb-2 font-semibold">Sell Price</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedItems.slice(0, 7).map((item) => {
                const isLow = item.current_stock_qty <= item.reorder_point;
                return (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 font-sans font-medium text-slate-200">{item.name}</td>
                    <td className="py-2.5 font-bold text-white">
                      {item.current_stock_qty} {item.unit}
                    </td>
                    <td className="py-2.5 text-slate-400">{item.reorder_point}</td>
                    <td className="py-2.5 text-slate-400">
                      {merchant.currency} {item.unit_cost_price}
                    </td>
                    <td className="py-2.5 text-emerald-400 font-bold">
                      {merchant.currency} {item.unit_selling_price}
                    </td>
                    <td className="py-2.5">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Low
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onOpenRestock(item.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-sans font-semibold text-slate-200 border border-slate-700 cursor-pointer"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display">
            Recent Batch Sales
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            {sales.slice(0, 4).map((sale) => (
              <div key={sale.id} className="p-2 rounded bg-slate-900/80 flex justify-between items-center">
                <span className="text-slate-200 font-sans truncate">{sale.item_name}</span>
                <span className="text-emerald-400 font-bold shrink-0">
                  +{merchant.currency} {sale.total_revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display">
            Recent Money Out
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            {expenses.slice(0, 4).map((exp) => (
              <div key={exp.id} className="p-2 rounded bg-slate-900/80 flex justify-between items-center">
                <span className="text-slate-200 font-sans truncate">{exp.reason || exp.category}</span>
                <span className="text-rose-400 font-bold shrink-0">
                  -{merchant.currency} {exp.total_cost.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
