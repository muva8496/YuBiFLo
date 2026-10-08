import React, { useState } from "react";
import { 
  Truck, ArrowRight, CheckCircle2, ShieldCheck, 
  Package, DollarSign, Coffee, RefreshCw, Sparkles, 
  TrendingUp, Calendar, AlertTriangle, Layers, Info
} from "lucide-react";
import { AlacioMasterState, InventoryItem, SalesLedgerItem, PayoutOrDrawing } from "../../types/alacio";

interface SupplyDrivenSalesTabProps {
  state: AlacioMasterState;
  onCommitSupplyDrivenSale: (payload: {
    skuId: string | number;
    skuName: string;
    boxCapacity: number;
    shelfRemainingBeforeDrop: number;
    ownerConsumedQty: number;
    unitsSold: number;
    newSupplyArrivedQty: number;
    unitRetailPrice: number;
    unitWholesaleCost: number;
    totalRevenue: number;
    cogs: number;
    grossMargin: number;
    ownerDrawingCost: number;
    paymentMode: "CASH" | "MPESA" | "SPLIT";
    supplyInvoiceCost: number;
    supplyPaymentMode: "CASH" | "MPESA" | "SUPPLIER_CREDIT";
    notes?: string;
  }) => void;
}

interface SkuCapacityRule {
  id: string | number;
  name: string;
  category: string;
  boxCapacity: number;
  reorderThreshold: number; // Order when remaining drops to or below this
  unitType: string;
  unitCost: number;
  unitRetail: number;
  typicalOwnerConsumption: number;
}

export default function SupplyDrivenSalesTab({ state, onCommitSupplyDrivenSale }: SupplyDrivenSalesTabProps) {
  const { currency, inventory, salesLedger, payouts, cash_register_balance, mpesa_float_balance } = state;

  // Preset fast-moving capacity-based SKUs
  const capacityPresets: SkuCapacityRule[] = [
    {
      id: "preset_mt_kenya",
      name: "Mt Kenya Fresh Milk 500ml",
      category: "Dairy",
      boxCapacity: 21, // 21 packets box capacity as requested by user
      reorderThreshold: 5, // Order when majority (16) sold, 5 remaining
      unitType: "packets",
      unitCost: 50,
      unitRetail: 65,
      typicalOwnerConsumption: 2 // Owner drank 2 pieces
    },
    {
      id: "preset_brookside",
      name: "Brookside Fresh Milk 500ml",
      category: "Dairy",
      boxCapacity: 24, // 24 packets crate
      reorderThreshold: 6,
      unitType: "packets",
      unitCost: 52,
      unitRetail: 65,
      typicalOwnerConsumption: 1
    },
    {
      id: "preset_unga_jogoo",
      name: "Unga Jogoo 2kg",
      category: "Flour",
      boxCapacity: 12, // 12 packets bale
      reorderThreshold: 3,
      unitType: "packets",
      unitCost: 175,
      unitRetail: 210,
      typicalOwnerConsumption: 1
    },
    {
      id: "preset_broadways",
      name: "Broadways White Bread 400g",
      category: "Bakery",
      boxCapacity: 20, // 20 loaves crate
      reorderThreshold: 4,
      unitType: "loaves",
      unitCost: 54,
      unitRetail: 65,
      typicalOwnerConsumption: 1
    },
    {
      id: "preset_rina_oil",
      name: "Rina Vegetable Oil 1L",
      category: "Cooking & Oils",
      boxCapacity: 12, // 12 bottles carton
      reorderThreshold: 3,
      unitType: "bottles",
      unitCost: 275,
      unitRetail: 330,
      typicalOwnerConsumption: 0
    },
    {
      id: "preset_mumias_sugar",
      name: "Mumias Sugar 1kg",
      category: "Sugar",
      boxCapacity: 20, // 20 packets bale
      reorderThreshold: 4,
      unitType: "packets",
      unitCost: 140,
      unitRetail: 165,
      typicalOwnerConsumption: 0
    }
  ];

  // Active form state for logging supply arrival sales crystallization
  const [selectedPresetId, setSelectedPresetId] = useState<string>("preset_mt_kenya");
  const selectedPreset = capacityPresets.find((p) => String(p.id) === selectedPresetId) || capacityPresets[0];

  // Match with live inventory if available
  const matchedInventoryItem = inventory.find(
    (i) => i.name.toLowerCase().includes(selectedPreset.name.toLowerCase()) || 
           selectedPreset.name.toLowerCase().includes(i.name.toLowerCase())
  );

  const [boxCapacity, setBoxCapacity] = useState<number>(selectedPreset.boxCapacity);
  const [shelfRemaining, setShelfRemaining] = useState<number>(4); // E.g. 4 or 8 left
  const [ownerConsumed, setOwnerConsumed] = useState<number>(selectedPreset.typicalOwnerConsumption); // E.g. 2 drank
  const [newSupplyArrived, setNewSupplyArrived] = useState<number>(selectedPreset.boxCapacity); // E.g. new 21 pack box
  const [unitCost, setUnitCost] = useState<number>(selectedPreset.unitCost);
  const [unitRetail, setUnitRetail] = useState<number>(selectedPreset.unitRetail);
  const [salesPaymentMode, setSalesPaymentMode] = useState<"CASH" | "MPESA" | "SPLIT">("CASH");
  const [supplyPaymentMode, setSupplyPaymentMode] = useState<"CASH" | "MPESA" | "SUPPLIER_CREDIT">("MPESA");
  const [notes, setNotes] = useState<string>("Supply restock confirmed; implied sales crystallized at box arrival.");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // When preset changes, update form defaults
  const handleSelectPreset = (preset: SkuCapacityRule) => {
    setSelectedPresetId(String(preset.id));
    setBoxCapacity(preset.boxCapacity);
    setShelfRemaining(Math.max(1, Math.round(preset.boxCapacity * 0.2))); // e.g., 4 or 5 left
    setOwnerConsumed(preset.typicalOwnerConsumption);
    setNewSupplyArrived(preset.boxCapacity);
    setUnitCost(preset.unitCost);
    setUnitRetail(preset.unitRetail);
  };

  // MATHEMATICAL CORE OF THE SUPPLY-DRIVEN SALES ENGINE:
  // Implied Units Sold = Box Capacity - Remaining on Shelf - Owner Personal Consumption
  const impliedUnitsSold = Math.max(0, boxCapacity - shelfRemaining - ownerConsumed);
  const grossRevenue = impliedUnitsSold * unitRetail;
  const cogs = impliedUnitsSold * unitCost;
  const grossMargin = grossRevenue - cogs;
  const ownerDrawingCost = ownerConsumed * unitCost;
  const supplyInvoiceCost = newSupplyArrived * unitCost;
  const postDeliveryStock = shelfRemaining + newSupplyArrived;

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();

    onCommitSupplyDrivenSale({
      skuId: matchedInventoryItem?.id ?? `sku_${Date.now()}`,
      skuName: selectedPreset.name,
      boxCapacity,
      shelfRemainingBeforeDrop: shelfRemaining,
      ownerConsumedQty: ownerConsumed,
      unitsSold: impliedUnitsSold,
      newSupplyArrivedQty: newSupplyArrived,
      unitRetailPrice: unitRetail,
      unitWholesaleCost: unitCost,
      totalRevenue: grossRevenue,
      cogs,
      grossMargin,
      ownerDrawingCost,
      paymentMode: salesPaymentMode,
      supplyInvoiceCost,
      supplyPaymentMode,
      notes
    });

    setSuccessToast(
      `✓ New supply box arrival processed! Implied sales of ${impliedUnitsSold} units (${currency} ${grossRevenue.toLocaleString()}) crystallized. Owner drawing (${ownerConsumed} units = ${currency} ${ownerDrawingCost}) separated. New shelf stock: ${postDeliveryStock} units.`
    );
    setTimeout(() => setSuccessToast(null), 8000);
  };

  // Filter supply-driven sales from sales ledger
  const supplyDrivenSales = salesLedger.filter((s) => s.items_summary.toLowerCase().includes("supply-driven") || s.items_summary.toLowerCase().includes("arrival"));

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Truck className="text-emerald-400" size={24} /> Supply-Driven Sales Engine // Triggered Velocity Model
            </h2>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
              Supply Implied Sales
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cold Kenyan retail reality: <em>"A new box arriving means sales happened!"</em> When a new 21-pack box arrives, implied sales are automatically calculated from remaining stock and owner consumption. Zero rush-hour typing.
          </p>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-200 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in font-mono shadow-xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* CORE INTELLECTUAL CONCEPT BANNER (GAMMA CALCULUS) */}
      <div className="bg-[#0b1612] border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-950/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                The Supply-Driven Sales Formula
              </h3>
              <p className="text-[11px] text-slate-400">
                Formula: Implied Sales = Box Capacity &minus; Remaining On Shelf &minus; Owner Drawings
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
            0-Friction Velocity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">1. Capacity Purchase</span>
            <div className="text-white font-bold text-sm">Full Box / Crate (e.g. 21 pkts)</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Purchased to shelf capacity ceiling.
            </p>
          </div>

          <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 uppercase block font-bold">2. Majority Drawdown</span>
            <div className="text-amber-300 font-bold text-sm">Sales deplete stock (16 sold)</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Reorder triggered when ~75% has moved.
            </p>
          </div>

          <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-purple-400 uppercase block font-bold">3. Owner Consumption</span>
            <div className="text-purple-300 font-bold text-sm">Owner drank 2 pieces</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Classified as Owner Drawing, not cash leakage!
            </p>
          </div>

          <div className="p-3 bg-[#060c09] rounded-xl border border-emerald-500/40 space-y-1">
            <span className="text-[10px] text-emerald-400 uppercase block font-bold">4. New Box Drop</span>
            <div className="text-emerald-300 font-bold text-sm">New 21 box arrives</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Crystallizes implied sales &amp; resets capacity.
            </p>
          </div>
        </div>
      </div>

      {/* QUICK PRESET SELECTOR CARDS */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-400" /> Select Fast-Moving Capacity SKU:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {capacityPresets.map((preset) => {
            const isSelected = selectedPresetId === String(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#102419] border-emerald-500 text-white shadow-lg shadow-emerald-950"
                    : "bg-[#0b1310] border-slate-800 text-slate-400 hover:bg-[#0f1c16] hover:text-slate-200"
                }`}
              >
                <div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                  }`}>
                    {preset.boxCapacity} {preset.unitType}/box
                  </span>
                  <div className={`text-xs font-bold mt-1.5 leading-snug ${isSelected ? "text-emerald-400" : "text-white"}`}>
                    {preset.name}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Sell: {currency} {preset.unitRetail} &bull; Cost: {currency} {preset.unitCost}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LIVE TRIGGER INTERACTIVE WIZARD (7 COLS) */}
        <form onSubmit={handleCommit} className="lg:col-span-7 bg-[#0c1411] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Truck size={16} className="text-emerald-400" /> Log Supply Arrival &amp; Crystallize Sales
              </h3>
              <p className="text-[11px] text-slate-400">
                Active SKU: <span className="text-emerald-400 font-bold">{selectedPreset.name}</span>
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Capacity: {boxCapacity} {selectedPreset.unitType}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-300 uppercase font-mono font-bold block mb-1">
                Prior Box Capacity
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={boxCapacity}
                  onChange={(e) => setBoxCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">units</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">e.g. 21 packets in full box</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 uppercase font-mono font-bold block mb-1">
                Remaining on Shelf Before Drop
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={shelfRemaining}
                  onChange={(e) => setShelfRemaining(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono text-sm focus:border-amber-400 focus:outline-none font-bold"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">units</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Counted right as delivery arrives (e.g. 4)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-purple-300 uppercase font-mono font-bold block mb-1">
                Owner Personal Consumption
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={ownerConsumed}
                  onChange={(e) => setOwnerConsumed(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#060c09] border border-purple-500/50 rounded-xl p-2.5 text-purple-300 font-mono text-sm focus:border-purple-400 focus:outline-none font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-purple-400 font-mono">pieces</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Owner/family drank or used (e.g. 2 pieces)</span>
            </div>

            <div>
              <label className="text-[11px] text-emerald-400 uppercase font-mono font-bold block mb-1">
                New Supply Drop Size
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={newSupplyArrived}
                  onChange={(e) => setNewSupplyArrived(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#060c09] border border-emerald-500/50 rounded-xl p-2.5 text-emerald-400 font-mono text-sm focus:border-emerald-400 focus:outline-none font-bold"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-emerald-500 font-mono">new box</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">e.g. 21 new packets arrived</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-[11px] text-slate-300 uppercase font-mono font-bold block mb-1">
                Unit Wholesale Cost ({currency})
              </label>
              <input
                type="number"
                step="0.5"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 uppercase font-mono font-bold block mb-1">
                Unit Retail Price ({currency})
              </label>
              <input
                type="number"
                step="0.5"
                value={unitRetail}
                onChange={(e) => setUnitRetail(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-300 uppercase font-mono font-bold block mb-1">
                Implied Sales Cashflow Rail
              </label>
              <select
                value={salesPaymentMode}
                onChange={(e) => setSalesPaymentMode(e.target.value as any)}
                className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="CASH">Physical Cash Drawer</option>
                <option value="MPESA">M-Pesa Till 9382104</option>
                <option value="SPLIT">Split (50% Cash / 50% M-Pesa)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 uppercase font-mono font-bold block mb-1">
                New Box Settlement Mode
              </label>
              <select
                value={supplyPaymentMode}
                onChange={(e) => setSupplyPaymentMode(e.target.value as any)}
                className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="MPESA">M-Pesa Till Outflow</option>
                <option value="CASH">Cash Drawer Outflow</option>
                <option value="SUPPLIER_CREDIT">Supplier Credit (Pay later)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-300 uppercase font-mono font-bold block mb-1">
              Audit Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 font-mono"
            >
              <CheckCircle2 size={18} /> Execute &bull; Crystallize {impliedUnitsSold} Sales ({currency} {grossRevenue.toLocaleString()})
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: REAL-TIME MATHEMATICAL CRYSTALLIZATION TELEMETRY (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#101b15] border-2 border-emerald-500/50 rounded-2xl p-5 shadow-2xl space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles size={14} /> Implied Velocity Output
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Live Math
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Box Capacity Purchased:</span>
                <span className="text-white font-bold">{boxCapacity} units</span>
              </div>

              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Remaining on Shelf:</span>
                <span className="text-amber-300 font-bold">&minus; {shelfRemaining} units</span>
              </div>

              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                <span className="text-purple-300">Owner Consumed (Drank):</span>
                <span className="text-purple-300 font-bold">&minus; {ownerConsumed} units</span>
              </div>

              <div className="p-3 bg-[#060c09] rounded-xl border border-emerald-500/40 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Implied Units Sold</span>
                  <span className="text-xs text-slate-400">{boxCapacity} &minus; {shelfRemaining} &minus; {ownerConsumed} =</span>
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {impliedUnitsSold} pkts
                </div>
              </div>

              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800 text-xs">
                <span className="text-slate-300">Gross Sales Inflow:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {currency} {grossRevenue.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Cost of Goods Sold (COGS):</span>
                <span className="text-slate-300 font-bold">
                  {currency} {cogs.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800 text-xs">
                <span className="text-cyan-300 font-bold">Realized Gross Margin:</span>
                <span className="text-cyan-300 font-bold text-sm">
                  +{currency} {grossMargin.toLocaleString()} ({Math.round((grossMargin / (grossRevenue || 1)) * 100)}%)
                </span>
              </div>

              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800 text-xs">
                <span className="text-purple-300">Owner Drawing (At Cost):</span>
                <span className="text-purple-300 font-bold">
                  {currency} {ownerDrawingCost.toLocaleString()} (Non-Cash)
                </span>
              </div>

              <div className="p-2.5 bg-[#0a140f] rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">New Shelf Stock Level:</span>
                <span className="text-white font-bold">{shelfRemaining} + {newSupplyArrived} = {postDeliveryStock} units</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Zero ambiguity: The owner drinking 2 pieces is booked as a legitimate <strong>Owner Drawing</strong> of {currency} {ownerDrawingCost}, preventing false alarm leakage in night audits!
            </p>
          </div>

          {/* CAPACITY REPLENISHMENT RADAR */}
          <div className="bg-[#0c1411] border border-slate-800 rounded-2xl p-4 space-y-2 text-xs font-mono">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Fast Replenishment Gauge</span>
            <div className="space-y-2">
              <div className="p-2 bg-[#060c09] rounded-lg border border-slate-800 flex justify-between items-center">
                <span>Mt Kenya 500ml: 21 box capacity</span>
                <span className="text-emerald-400 font-bold">Ready for drop</span>
              </div>
              <div className="p-2 bg-[#060c09] rounded-lg border border-slate-800 flex justify-between items-center">
                <span>Unga Jogoo 2kg: 12 bale capacity</span>
                <span className="text-amber-400 font-bold">60% sold</span>
              </div>
              <div className="p-2 bg-[#060c09] rounded-lg border border-slate-800 flex justify-between items-center">
                <span>Broadways 400g: 20 crate capacity</span>
                <span className="text-cyan-400 font-bold">75% sold</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* HISTORICAL SUPPLY-TRIGGERED SALES CYCLES */}
      <div className="bg-[#0b1410] border border-slate-800 rounded-2xl p-5 space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <TrendingUp size={14} className="text-emerald-400" /> Recent Supply-Triggered Sales Cycles ({supplyDrivenSales.length})
          </h3>
          <span className="text-[10px] text-slate-500">Auto-crystallized transactions</span>
        </div>

        {supplyDrivenSales.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No supply-triggered sales logged yet. Use the workbench above to execute your first box arrival cycle (e.g. Mt Kenya Milk 21 pkts).
          </div>
        ) : (
          <div className="space-y-2">
            {supplyDrivenSales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="p-3 bg-[#060c09] rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="text-white font-bold">{sale.items_summary}</div>
                  <div className="text-[10px] text-slate-500">{sale.timestamp} &bull; Paid via {sale.payment_method}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold text-sm">{currency} {sale.total_amount.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">Crystallized Inflow</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
