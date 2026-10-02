import React, { useState, useMemo } from "react";
import { Package, RefreshCw, Search, Plus, Filter, AlertTriangle, ArrowUpDown } from "lucide-react";
import { InventoryItem } from "../../types/alacio";

interface InventoryTabProps {
  currency: string;
  inventory: InventoryItem[];
  onOpenRestock: (item?: InventoryItem) => void;
}

export default function InventoryTab({ currency, inventory, onOpenRestock }: InventoryTabProps) {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "All Categories",
    "Dairy",
    "Flour",
    "Cooking & Oils",
    "Poultry",
    "Bakery",
    "Sugar",
    "Spices",
    "Hygiene",
    "Beverages",
    "Grains",
    "Household",
    "Cosmetics",
    "Stationery"
  ];

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchCat = selectedCategory === "All Categories" || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER WITH SEARCH & RESTOCK BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="text-emerald-400" size={22} /> Active Stock &amp; Supply Velocity ({inventory.length} Items)
          </h2>
          <p className="text-xs text-slate-400">
            Real-time shelf inventory, unit margins, and automatic batch turnover status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="bg-[#121822] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>
          <button
            onClick={() => onOpenRestock()}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <RefreshCw size={14} /> Restock Batch
          </button>
        </div>
      </div>

      {/* CATEGORY FILTER PILLS */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer font-medium ${
              selectedCategory === cat
                ? "bg-slate-700 text-white border-slate-600 shadow"
                : "bg-[#121822] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#161d29] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-4 font-semibold">Product &amp; Category</th>
                <th className="py-3 px-4 font-semibold">Velocity Status</th>
                <th className="py-3 px-4 font-semibold text-center">Active Stock</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Retail</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Margin</th>
                <th className="py-3 px-4 font-semibold text-right">Total Shelf Value</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-200">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.category}</div>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.velocity_badge === "Low Stock Alert"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : item.velocity_badge === "High Velocity"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {item.velocity_badge}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-white">
                    {item.current_stock} <span className="text-slate-500 font-normal text-[10px]">{item.unit_type}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">
                    {currency} {item.unit_cost.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-200 font-bold">
                    {currency} {item.unit_retail.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                    +{currency} {item.expected_margin.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-white">
                    {currency} {item.total_shelf_value.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    <button
                      onClick={() => onOpenRestock(item)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 cursor-pointer"
                    >
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No inventory items found matching "{searchQuery}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
