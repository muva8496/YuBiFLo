import React, { useState } from "react";
import {
  PlusCircle,
  ArrowUpRight,
  Package,
  Zap,
  Store,
  Truck,
  DollarSign,
  Search,
  Filter,
  Receipt,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import { Merchant, MoneyOutExpense } from "../types";
import { EditRecordModal } from "./EditRecordModal";
import { AppStorage } from "../services/storage";

interface MoneyOutViewProps {
  merchant: Merchant;
  expenses: MoneyOutExpense[];
  onOpenMoneyOut: () => void;
  onRefreshData?: () => void;
}

export const MoneyOutView: React.FC<MoneyOutViewProps> = ({
  merchant,
  expenses,
  onOpenMoneyOut,
  onRefreshData,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingExpense, setEditingExpense] = useState<MoneyOutExpense | null>(null);

  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory =
      filterCategory === "ALL" ||
      (filterCategory === "INVENTORY" && e.expense_type === "INVENTORY_PURCHASE") ||
      (filterCategory === "OPERATIONAL" && e.expense_type === "SHOP_EXPENSE") ||
      e.category === filterCategory;

    const matchesSearch =
      !searchQuery ||
      (e.item_name && e.item_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.receipt_reference && e.receipt_reference.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const totalInventoryExpenses = expenses
    .filter((e) => e.expense_type === "INVENTORY_PURCHASE")
    .reduce((acc, e) => acc + e.total_cost, 0);

  const totalOpExpenses = expenses
    .filter((e) => e.expense_type === "SHOP_EXPENSE")
    .reduce((acc, e) => acc + e.total_cost, 0);

  const totalAllExpenses = expenses.reduce((acc, e) => acc + e.total_cost, 0);

  const handleSaveExpense = (updatedExpense: MoneyOutExpense) => {
    AppStorage.updateExpense(updatedExpense);
    if (onRefreshData) onRefreshData();
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    AppStorage.deleteExpense(expenseId);
    if (onRefreshData) onRefreshData();
    setEditingExpense(null);
  };

  return (
    <div id="money-out-view" className="space-y-5">
      {/* Top Header & Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-rose-400" />
            <span>Money Out & Supplier Expenses</span>
          </h1>
          <p className="text-xs text-slate-400">
            Every inventory expense logs cost price, sets retail price, and auto-calculates past sales. Click &quot;Edit&quot; to rectify errors.
          </p>
        </div>

        <button
          id="moneyout-add-expense-btn"
          onClick={onOpenMoneyOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Record Money Out</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Total Money Out Paid</span>
          <span className="text-xl font-bold text-rose-400 font-mono">
            {merchant.currency} {totalAllExpenses.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Across {expenses.length} logged records
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Inventory Stock Purchases</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {merchant.currency} {totalInventoryExpenses.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {expenses.filter((e) => e.expense_type === "INVENTORY_PURCHASE").length} wholesale restocks
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Operating Overheads (Tokens/Rent)</span>
          <span className="text-xl font-bold text-white font-mono">
            {merchant.currency} {totalOpExpenses.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {expenses.filter((e) => e.expense_type === "SHOP_EXPENSE").length} operational bills
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search item, supplier, or invoice #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: "ALL", label: "All Expenses" },
              { id: "INVENTORY", label: "Inventory Purchases" },
              { id: "OPERATIONAL", label: "Shop Overheads" },
              { id: "ELECTRICITY_TOKENS", label: "KPLC Tokens" },
              { id: "RENT", label: "Rent" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterCategory === tab.id
                    ? "bg-slate-800/80 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider font-medium">
              <tr>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Expense Item / Details</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Supplier / Vendor</th>
                <th className="py-3 px-3.5 text-right">Qty</th>
                <th className="py-3 px-3.5 text-right">Unit Cost</th>
                <th className="py-3 px-3.5 text-right">Unit Retail</th>
                <th className="py-3 px-3.5 text-right">Total Cost</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No expense records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isInv = exp.expense_type === "INVENTORY_PURCHASE";
                  return (
                    <tr key={exp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-100">
                          {exp.item_name || exp.notes || exp.category}
                        </div>
                        {exp.receipt_reference && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Ref: {exp.receipt_reference}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            isInv
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          }`}
                        >
                          {exp.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-300">{exp.supplier_name}</td>
                      <td className="py-3 px-3.5 text-right font-mono">
                        {exp.qty_purchased ? exp.qty_purchased : "—"}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-300">
                        {exp.unit_cost_price
                          ? `${merchant.currency} ${exp.unit_cost_price}`
                          : "—"}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-emerald-400 font-semibold">
                        {exp.unit_selling_price
                          ? `${merchant.currency} ${exp.unit_selling_price}`
                          : "—"}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                        {merchant.currency} {exp.total_cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-semibold transition-colors"
                          title="Rectify / Edit expense"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditRecordModal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          merchant={merchant}
          type="EXPENSE"
          record={editingExpense}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
        />
      )}
    </div>
  );
};

