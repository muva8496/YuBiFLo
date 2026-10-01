import React, { useState } from "react";
import {
  Boxes,
  PackagePlus,
  Flame,
  Zap,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { InventoryItem, Merchant, SupplyBatch } from "../types";
import { EditRecordModal } from "./EditRecordModal";
import { AppStorage } from "../services/storage";

interface StockViewProps {
  merchant: Merchant;
  items: InventoryItem[];
  batches: SupplyBatch[];
  onOpenRestock: (itemId?: string) => void;
  onOpenMoneyOut: () => void;
  onRefreshData?: () => void;
}

export const StockView: React.FC<StockViewProps> = ({
  merchant,
  items,
  batches,
  onOpenRestock,
  onOpenMoneyOut,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Calculations
  const categories = Array.from(new Set(items.map((i) => i.category)));

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalRetailValue = items.reduce(
    (acc, i) => acc + i.current_stock_qty * i.unit_selling_price,
    0
  );
  const totalCostValue = items.reduce(
    (acc, i) => acc + i.current_stock_qty * i.unit_cost_price,
    0
  );
  const potentialGrossProfit = totalRetailValue - totalCostValue;

  const handleSaveItem = (updatedItem: InventoryItem) => {
    AppStorage.updateItem(updatedItem);
    if (onRefreshData) onRefreshData();
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    AppStorage.deleteItem(itemId);
    if (onRefreshData) onRefreshData();
    setEditingItem(null);
  };

  const getVelocityBadge = (item: InventoryItem) => {
    if (item.current_stock_qty <= item.reorder_point) {
      return {
        label: "Low Stock Alert",
        badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        icon: AlertTriangle,
      };
    }
    if (item.lifetime_revenue > 6000 || item.total_batches_count >= 4) {
      return {
        label: "High Velocity 🔥",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        icon: Flame,
      };
    }
    if (item.total_batches_count >= 2) {
      return {
        label: "Fast Mover ⚡",
        badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        icon: Zap,
      };
    }
    return {
      label: "Steady Stock 📦",
      badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      icon: Boxes,
    };
  };

  return (
    <div id="stock-view" className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <span>Active Stock & Supply Velocity</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time shelf inventory, unit margins, and automatic batch turnover status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="stock-add-new-btn"
            onClick={onOpenMoneyOut}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-800 transition-colors"
          >
            <span>+ Add New Product</span>
          </button>
          <button
            id="stock-restock-btn"
            onClick={() => onOpenRestock()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Restock Batch</span>
          </button>
        </div>
      </div>

      {/* Stock Valuation Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Total Active Shelf Retail Value</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {merchant.currency} {totalRetailValue.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Across {items.length} active inventory items
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Total Capital Invested (Cost Price)</span>
          <span className="text-xl font-bold text-slate-200 font-mono">
            {merchant.currency} {totalCostValue.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Wholesale money out tied in current batches
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Locked-In Potential Gross Profit</span>
          <span className="text-xl font-bold text-white font-mono">
            {merchant.currency} {potentialGrossProfit.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
            Avg markup: {totalCostValue > 0 ? ((potentialGrossProfit / totalCostValue) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search items, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-slate-800/80 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              All Categories ({items.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-slate-800/80 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider font-medium">
              <tr>
                <th className="py-3 px-3.5">Product Name & Category</th>
                <th className="py-3 px-3.5 text-center">Velocity Badge</th>
                <th className="py-3 px-3.5 text-right">Active Shelf Stock</th>
                <th className="py-3 px-3.5 text-right">Unit Cost</th>
                <th className="py-3 px-3.5 text-right">Unit Retail</th>
                <th className="py-3 px-3.5 text-right">Expected Margin</th>
                <th className="py-3 px-3.5 text-right">Total Shelf Value</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const badge = getVelocityBadge(item);
                  const BadgeIcon = badge.icon;
                  const unitProfit = item.unit_selling_price - item.unit_cost_price;
                  const marginPct =
                    item.unit_selling_price > 0
                      ? ((unitProfit / item.unit_selling_price) * 100).toFixed(1)
                      : "0";
                  const shelfValue = item.current_stock_qty * item.unit_selling_price;
                  const activeBatch = batches.find(
                    (b) => b.item_id === item.id && b.status === "ACTIVE"
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-100">{item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">{item.category}</span>
                          {activeBatch && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              • Batch #{activeBatch.batch_number} Active
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badge.badgeClass}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono font-bold">
                        <span
                          className={
                            item.current_stock_qty <= item.reorder_point
                              ? "text-red-400"
                              : "text-slate-100"
                          }
                        >
                          {item.current_stock_qty} {item.unit_of_measure}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono text-slate-300">
                        {merchant.currency} {item.unit_cost_price}
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                        {merchant.currency} {item.unit_selling_price}
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono">
                        <span className="text-emerald-400 font-semibold">
                          +{merchant.currency} {unitProfit.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">({marginPct}%)</span>
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                        {merchant.currency} {shelfValue.toLocaleString()}
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="px-2.5 py-1 text-xs rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-semibold transition-colors flex items-center gap-1"
                            title="Edit / Rectify product details & stock"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => onOpenRestock(item.id)}
                            className="px-3 py-1 text-white text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-transform shadow-sm"
                          >
                            Restock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <EditRecordModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          merchant={merchant}
          type="ITEM"
          record={editingItem}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
};
