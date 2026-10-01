import React, { useState } from "react";
import {
  TrendingUp,
  Zap,
  Clock,
  DollarSign,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Edit3,
} from "lucide-react";
import { Merchant, SalesLedgerEntry } from "../types";
import { EditRecordModal } from "./EditRecordModal";
import { AppStorage } from "../services/storage";

interface SalesLedgerViewProps {
  merchant: Merchant;
  sales: SalesLedgerEntry[];
  onOpenRestock: () => void;
  onRefreshData?: () => void;
}

export const SalesLedgerView: React.FC<SalesLedgerViewProps> = ({
  merchant,
  sales,
  onOpenRestock,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("ALL");
  const [editingSale, setEditingSale] = useState<SalesLedgerEntry | null>(null);

  const filteredSales = sales.filter((s) => {
    const matchesTrigger = triggerFilter === "ALL" || s.trigger_reason === triggerFilter;
    const matchesSearch =
      !searchQuery ||
      s.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTrigger && matchesSearch;
  });

  const totalRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.total_profit, 0);
  const totalUnitsSold = sales.reduce((acc, s) => acc + s.qty_sold, 0);
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  const handleSaveSale = (updatedSale: SalesLedgerEntry) => {
    AppStorage.updateSale(updatedSale);
    if (onRefreshData) onRefreshData();
    setEditingSale(null);
  };

  const handleDeleteSale = (saleId: string) => {
    AppStorage.deleteSale(saleId);
    if (onRefreshData) onRefreshData();
    setEditingSale(null);
  };

  return (
    <div id="sales-ledger-view" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Supply-Driven Sales Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated batch turnover sales injected by restock arrivals. Click &quot;Edit&quot; on any record to rectify mistakes.
          </p>
        </div>

        <button
          onClick={onOpenRestock}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all self-start sm:self-auto"
        >
          <Zap className="w-4 h-4" />
          <span>Restock Batch</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Total Generated Sales</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {merchant.currency} {totalRevenue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Auto-derived from inventory flow
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Cumulative Gross Profit</span>
          <span className="text-xl font-bold text-white font-mono">
            {merchant.currency} {totalProfit.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
            Margin: <strong className="text-emerald-400">{avgMargin}%</strong>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Total Volume Sold</span>
          <span className="text-xl font-bold text-slate-100 font-mono">
            {totalUnitsSold.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Units / Items turned over</span>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Closed Batches</span>
          <span className="text-xl font-bold text-indigo-300 font-mono">{sales.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Supply-closed batches</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search sales by item name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: "ALL", label: "All Sales" },
              { id: "RESTOCK_ARRIVAL", label: "Restock-Triggered" },
              { id: "HISTORICAL_INGESTION", label: "Historical OCR Ingestion" },
              { id: "REVERSE_AUDIT", label: "Reverse Audits" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTriggerFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  triggerFilter === tab.id
                    ? "bg-slate-800/80 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider font-medium">
              <tr>
                <th className="py-3 px-3.5">Batch / Item</th>
                <th className="py-3 px-3.5">Turnover Velocity</th>
                <th className="py-3 px-3.5 text-right">Qty Sold</th>
                <th className="py-3 px-3.5 text-right">Unit Cost</th>
                <th className="py-3 px-3.5 text-right">Unit Retail</th>
                <th className="py-3 px-3.5 text-right">Total Revenue</th>
                <th className="py-3 px-3.5 text-right">Gross Profit</th>
                <th className="py-3 px-3.5 text-right">Margin %</th>
                <th className="py-3 px-3.5 text-center">Trigger Source</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No sales records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-100">{sale.item_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Batch #{sale.batch_number} • Closed:{" "}
                        {new Date(sale.batch_end_date).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 font-mono">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <Clock className="w-3 h-3" />
                        {sale.sales_velocity_hours < 24
                          ? `${sale.sales_velocity_hours} hours`
                          : `${sale.sales_velocity_days} days`}
                      </span>
                      {sale.units_per_day > 0 && (
                        <span className="text-[10px] text-slate-500 block">
                          ~{sale.units_per_day} units/day
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-100">
                      {sale.qty_sold}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono text-slate-300">
                      {merchant.currency} {sale.unit_cost_price}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-emerald-400">
                      {merchant.currency} {sale.unit_selling_price}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                      +{merchant.currency} {sale.total_revenue.toLocaleString()}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                      +{merchant.currency} {sale.total_profit.toLocaleString()}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-200">
                      {sale.gross_margin_percent}%
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          sale.trigger_reason === "RESTOCK_ARRIVAL"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : sale.trigger_reason === "HISTORICAL_INGESTION"
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        }`}
                      >
                        {sale.trigger_reason.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <button
                        onClick={() => setEditingSale(sale)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-semibold transition-colors"
                        title="Rectify / Edit sale"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingSale && (
        <EditRecordModal
          isOpen={!!editingSale}
          onClose={() => setEditingSale(null)}
          merchant={merchant}
          type="SALE"
          record={editingSale}
          onSave={handleSaveSale}
          onDelete={handleDeleteSale}
        />
      )}
    </div>
  );
};

