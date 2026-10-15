import React, { useState } from "react";
import { 
  Layers, Truck, Plus, Package, DollarSign, Search, Phone, 
  MapPin, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Edit3
} from "lucide-react";
import { AlacioMasterState, InventoryItem, Supplier } from "../../types/alacio";

interface StockVaultSuppliersTabProps {
  state: AlacioMasterState;
  initialTab?: "stock" | "suppliers";
  onAddStockItem?: (item: any) => void;
  onAddSupplier?: (supplier: any) => void;
}

export default function StockVaultSuppliersTab({
  state,
  initialTab = "stock",
  onAddStockItem,
  onAddSupplier
}: StockVaultSuppliersTabProps) {
  const { currency, inventory = [], suppliers = [] } = state;
  const [activeSubTab, setActiveSubTab] = useState<"stock" | "suppliers">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // New stock item form state
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Dairy");
  const [newItemCost, setNewItemCost] = useState("");
  const [newItemRetail, setNewItemRetail] = useState("");
  const [newItemStock, setNewItemStock] = useState("");

  // New supplier form state
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupCategory, setNewSupCategory] = useState("Bakery");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupTerms, setNewSupTerms] = useState("Cash on Delivery");

  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(sup =>
    sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sup.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const cost = parseFloat(newItemCost) || 0;
    const retail = parseFloat(newItemRetail) || 0;
    const stock = parseInt(newItemStock, 10) || 0;

    const newItem: InventoryItem = {
      id: `sku_${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      unit_type: "pcs",
      unit_cost: cost,
      unit_retail: retail,
      current_stock: stock,
      opening_stock: stock,
      expected_margin: retail - cost,
      total_shelf_value: stock * retail,
      velocity_badge: "NORMAL",
      reorder_point: 5,
      bulk_pack_size: 1,
      bulk_pack_name: "Pieces",
      is_bulk_decanted: false
    };

    if (onAddStockItem) onAddStockItem(newItem);
    setFeedback(`Added ${newItem.name} to shelf stock inventory.`);
    setIsAddingStock(false);
    setNewItemName("");
    setNewItemCost("");
    setNewItemRetail("");
    setNewItemStock("");
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    const newSup: Supplier = {
      id: `sup_${Date.now()}`,
      name: newSupName.trim(),
      company: newSupName.trim(),
      national_id: "ID-PENDING",
      total_orders_cost: 0,
      last_delivery_date: new Date().toISOString().slice(0, 10),
      payment_preference: "CASH_DRAWER",
      category: newSupCategory,
      phone: newSupPhone.trim() || "+254 700 000 000",
      location: "Nairobi Depot",
      lead_time_days: 1,
      payment_terms: newSupTerms
    };

    if (onAddSupplier) onAddSupplier(newSup);
    setFeedback(`Added supplier ${newSup.name} to suppliers registry.`);
    setIsAddingSupplier(false);
    setNewSupName("");
    setNewSupPhone("");
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans text-[#E2ECF3]">
      
      {/* HEADER & SUB-TAB SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182C40] pb-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <Layers className="text-emerald-400" size={22} /> Stock Vault &amp; Suppliers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your shelf catalog, quantities, retail pricing, and supplier distributor contacts.
          </p>
        </div>

        {/* TABS: STOCK & SUPPLIERS */}
        <div className="bg-[#09121D] p-1 rounded-2xl border border-[#182C40] flex items-center gap-1 text-xs font-mono">
          <button
            onClick={() => setActiveSubTab("stock")}
            className={`px-4 py-1.5 rounded-xl transition font-bold cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "stock"
                ? "bg-[#2563EB] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Package size={14} /> Stock ({inventory.length})
          </button>
          <button
            onClick={() => setActiveSubTab("suppliers")}
            className={`px-4 py-1.5 rounded-xl transition font-bold cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "suppliers"
                ? "bg-[#2563EB] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Truck size={14} /> Suppliers ({suppliers.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* SEARCH & ADD ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeSubTab === "stock" ? "Search stock items..." : "Search suppliers..."}
            className="w-full bg-[#0E1A29] border border-[#182C40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
          />
        </div>

        {activeSubTab === "stock" ? (
          <button
            onClick={() => setIsAddingStock(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Plus size={14} /> Add Stock Item
          </button>
        ) : (
          <button
            onClick={() => setIsAddingSupplier(true)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Plus size={14} /> Add Supplier
          </button>
        )}
      </div>

      {/* ADD STOCK MODAL */}
      {isAddingStock && (
        <div className="bg-[#0E1A29] border-2 border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#182C40] pb-2">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Package size={16} className="text-emerald-400" /> Add New Stock Item
            </h3>
            <button onClick={() => setIsAddingStock(false)} className="text-slate-400 hover:text-white text-xs font-mono">
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSaveStock} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Broadways Bread 400g"
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white font-mono"
                >
                  <option value="Dairy">Dairy (Milk, Mala, Butter)</option>
                  <option value="Bakery">Bakery (Bread, Buns)</option>
                  <option value="Milling">Milling (Unga, Maize flour)</option>
                  <option value="Sugar & Dry Goods">Sugar &amp; Dry Goods</option>
                  <option value="Household">Household (Soap, Matches)</option>
                  <option value="Sundries">Sundries &amp; Confectionery</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Wholesale Cost ({currency})</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  placeholder="e.g. 55"
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Retail Selling Price ({currency})</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newItemRetail}
                  onChange={(e) => setNewItemRetail(e.target.value)}
                  placeholder="e.g. 65"
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Current Stock Count</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newItemStock}
                  onChange={(e) => setNewItemStock(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#182C40]">
              <button
                type="button"
                onClick={() => setIsAddingStock(false)}
                className="px-3.5 py-2 bg-[#132337] text-slate-300 rounded-xl text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono"
              >
                Save Stock Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {isAddingSupplier && (
        <div className="bg-[#0E1A29] border-2 border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#182C40] pb-2">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Truck size={16} className="text-purple-400" /> Add New Supplier
            </h3>
            <button onClick={() => setIsAddingSupplier(false)} className="text-slate-400 hover:text-white text-xs font-mono">
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSaveSupplier} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Company / Distributor Name</label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder="e.g. Unga Group Kenya"
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Category</label>
                <input
                  type="text"
                  value={newSupCategory}
                  onChange={(e) => setNewSupCategory(e.target.value)}
                  placeholder="e.g. Flour Milling / Grain"
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                  placeholder="e.g. 0722 000 000"
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Payment Terms</label>
                <select
                  value={newSupTerms}
                  onChange={(e) => setNewSupTerms(e.target.value)}
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white font-mono"
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="M-Pesa on Delivery">M-Pesa on Delivery</option>
                  <option value="7-Day Credit Note">7-Day Credit Note</option>
                  <option value="14-Day Settlement">14-Day Settlement</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#182C40]">
              <button
                type="button"
                onClick={() => setIsAddingSupplier(false)}
                className="px-3.5 py-2 bg-[#132337] text-slate-300 rounded-xl text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs font-mono"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 1: STOCK VIEW */}
      {activeSubTab === "stock" && (
        <div className="bg-[#0E1A29] border border-[#182C40] rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs font-mono border-b border-[#182C40] pb-2">
            <span className="text-white font-bold uppercase">
              Shelf Inventory Catalog ({filteredInventory.length})
            </span>
            <span className="text-emerald-400 font-bold">
              Total Shelf Value: {currency} {filteredInventory.reduce((acc, i) => acc + i.total_shelf_value, 0).toLocaleString()}
            </span>
          </div>

          {filteredInventory.length === 0 ? (
            <div className="text-center py-10 space-y-3 bg-[#09121D]/60 rounded-2xl border border-dashed border-[#182C40]">
              <Package size={32} className="text-slate-500 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-white">Your Stock Shelf is Ready</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Clean skeleton initialized for your retail shop. Your goods come in directly when you log inbound deliveries from wholesalers (like Jahdithma Wholesalers).
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingStock(true)}
                  className="px-3.5 py-1.5 bg-[#38BDF8] hover:bg-[#0284c7] text-slate-950 font-bold rounded-xl text-xs font-mono transition cursor-pointer"
                >
                  + Add Direct Good
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredInventory.map((item) => {
                const isLow = item.current_stock <= (item.reorder_point || 5);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#09121D] border border-[#182C40] rounded-2xl flex flex-col justify-between space-y-2 text-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-white leading-tight">{item.name}</span>
                        {isLow && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold shrink-0 border border-red-500/30">
                            Low
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {item.category}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#182C40]/70 flex items-center justify-between font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Stock:</span>
                        <strong className={isLow ? "text-amber-400" : "text-white"}>
                          {item.current_stock} {item.unit_type}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[9px] uppercase">Retail:</span>
                        <strong className="text-emerald-400 font-bold">
                          {currency} {item.unit_retail}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SUPPLIERS VIEW */}
      {activeSubTab === "suppliers" && (
        <div className="bg-[#0E1A29] border border-[#182C40] rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs font-mono border-b border-[#182C40] pb-2">
            <span className="text-white font-bold uppercase">
              Authorized Distributors &amp; Vans ({filteredSuppliers.length})
            </span>
            <span className="text-purple-400 font-bold">
              Direct Route Deliveries
            </span>
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Truck size={28} className="text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No suppliers added yet.</p>
              <button
                onClick={() => setIsAddingSupplier(true)}
                className="text-xs text-[#38BDF8] hover:underline font-mono"
              >
                Add your first supplier distributor &rarr;
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSuppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="p-4 bg-[#09121D] border border-[#182C40] rounded-2xl flex flex-col justify-between space-y-2.5 text-xs font-mono"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{sup.name}</h4>
                      <span className="text-[10px] text-cyan-300 block">{sup.category}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#132337] text-slate-300 border border-[#1E3A5F]">
                      {sup.payment_terms || "Cash on Delivery"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#182C40]/70 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-emerald-400" /> {sup.phone}
                    </span>
                    <span className="text-[10px]">
                      Lead Time: {sup.lead_time_days || 1} Day
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
