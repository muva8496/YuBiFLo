import React, { useState } from "react";
import { 
  Truck, ArrowRight, CheckCircle2, Package, Sparkles, 
  RefreshCw, DollarSign, Layers, Plus, Check, Mic, Calculator
} from "lucide-react";
import { AlacioMasterState, InventoryItem } from "../../types/alacio";
import { BulkConversionEngine } from "../../services/bulkConversionEngine";

export interface SupplyLogEntry {
  id: string;
  itemId: string | number;
  itemName: string;
  supplyUnitsReceived: number;
  supplyUnit: string;
  retailUnitsAdded: number;
  retailUnit: string;
  conversionRatio: number;
  totalCost: number;
  unitCostAtDelivery: number;
  retailPrice: number;
  supplierName: string;
  paymentMode: "CASH" | "MPESA" | "CREDIT";
  timestamp: string;
}

interface SupplierLogTabProps {
  state: AlacioMasterState;
  onLogSupplyDelivery: (entry: SupplyLogEntry) => void;
}

export default function SupplierLogTab({ state, onLogSupplyDelivery }: SupplierLogTabProps) {
  const { currency, inventory } = state;

  const [selectedItemName, setSelectedItemName] = useState(inventory[0]?.name || "Mumias Sugar");
  const [supplyQty, setSupplyQty] = useState("2");
  const [supplyUnit, setSupplyUnit] = useState("Crate (24pkts)");
  const [retailUnit, setRetailUnit] = useState("Packet (500ml)");
  const [conversionRatio, setConversionRatio] = useState("24");
  const [totalCost, setTotalCost] = useState("2640");
  const [retailPrice, setRetailPrice] = useState("65");
  const [supplierName, setSupplierName] = useState("Brookside Dairy Delivery");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "MPESA" | "CREDIT">("MPESA");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recent supply logs mock
  const [recentLogs, setRecentLogs] = useState<SupplyLogEntry[]>([
    {
      id: "sup_1",
      itemId: "item_sugar",
      itemName: "Mumias Sugar",
      supplyUnitsReceived: 1,
      supplyUnit: "Bag (50kg)",
      retailUnitsAdded: 200,
      retailUnit: "Quarter-Kg (250g)",
      conversionRatio: 200,
      totalCost: 6800,
      unitCostAtDelivery: 34,
      retailPrice: 40,
      supplierName: "Nairobi Mega Wholesalers",
      paymentMode: "CASH",
      timestamp: "Today, 08:30 AM"
    },
    {
      id: "sup_2",
      itemId: "item_milk",
      itemName: "Brookside Fresh Milk 500ml",
      supplyUnitsReceived: 2,
      supplyUnit: "Crate (24pkts)",
      retailUnitsAdded: 48,
      retailUnit: "Packet",
      conversionRatio: 24,
      totalCost: 2640,
      unitCostAtDelivery: 55,
      retailPrice: 65,
      supplierName: "Brookside Delivery Driver",
      paymentMode: "MPESA",
      timestamp: "Today, 09:15 AM"
    }
  ]);

  // Derived bulk-to-micro calculations
  const qtyNum = parseFloat(supplyQty) || 0;
  const ratioNum = parseFloat(conversionRatio) || 1;
  const costNum = parseFloat(totalCost) || 0;
  const retailNum = parseFloat(retailPrice) || 0;

  const totalRetailUnits = BulkConversionEngine.convertSupplyToRetailUnits(qtyNum, ratioNum);
  const microCost = BulkConversionEngine.calculateMicroUnitCost(costNum, totalRetailUnits);
  const profitPotential = BulkConversionEngine.calculateBatchProfitPotential(totalRetailUnits, retailNum, costNum);

  // Quick Presets
  const applyPreset = (preset: {
    item: string;
    supplyQty: string;
    supplyUnit: string;
    retailUnit: string;
    ratio: string;
    cost: string;
    retail: string;
    supplier: string;
  }) => {
    setSelectedItemName(preset.item);
    setSupplyQty(preset.supplyQty);
    setSupplyUnit(preset.supplyUnit);
    setRetailUnit(preset.retailUnit);
    setConversionRatio(preset.ratio);
    setTotalCost(preset.cost);
    setRetailPrice(preset.retail);
    setSupplierName(preset.supplier);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newLog: SupplyLogEntry = {
      id: `sup_${Date.now()}`,
      itemId: `item_${Date.now()}`,
      itemName: selectedItemName,
      supplyUnitsReceived: qtyNum,
      supplyUnit,
      retailUnitsAdded: totalRetailUnits,
      retailUnit,
      conversionRatio: ratioNum,
      totalCost: costNum,
      unitCostAtDelivery: microCost,
      retailPrice: retailNum,
      supplierName,
      paymentMode,
      timestamp: "Just now"
    };

    onLogSupplyDelivery(newLog);
    setRecentLogs([newLog, ...recentLogs]);
    setSuccessMsg(
      `Delivery logged in 5s! ${qtyNum} ${supplyUnit} auto-converted into ${totalRetailUnits} ${retailUnit}. Expected Batch Margin: +${currency} ${profitPotential.grossProfit.toLocaleString()} (${profitPotential.markupPercentage}%).`
    );
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Truck className="text-cyan-400" size={24} /> 5-Second Supplier Delivery Log
            </h2>
            <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
              Bulk-to-Micro Conversion Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logs incoming wholesale batches and automatically splits them into micro retail units (e.g. 50kg bag &rarr; 200 quarter-kgs). Eliminates manual counter tapping.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* QUICK PRESETS ROW */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-400" /> Rush-Hour 1-Tap Presets (Wholesale Batches)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => applyPreset({
              item: "Brookside Fresh Milk 500ml",
              supplyQty: "2",
              supplyUnit: "Crate (24pkts)",
              retailUnit: "Packet (500ml)",
              ratio: "24",
              cost: "2640",
              retail: "65",
              supplier: "Brookside Delivery Driver"
            })}
            className="p-3 bg-[#0a1610] hover:bg-[#0f241a] border border-cyan-500/30 rounded-xl text-left transition cursor-pointer text-xs"
          >
            <span className="font-bold text-white block">2 Crates Milk (48 Pkts)</span>
            <span className="text-[10px] text-slate-400">2x Crate &times; 24 = 48 Packets &bull; KSh 2,640</span>
          </button>

          <button
            onClick={() => applyPreset({
              item: "Mumias Sugar",
              supplyQty: "1",
              supplyUnit: "Bag (50kg)",
              retailUnit: "Quarter-Kg (250g)",
              ratio: "200",
              cost: "6800",
              retail: "40",
              supplier: "Wholesale Grain Depot"
            })}
            className="p-3 bg-[#0a1610] hover:bg-[#0f241a] border border-amber-500/30 rounded-xl text-left transition cursor-pointer text-xs"
          >
            <span className="font-bold text-white block">1 Bag Sugar (200 Quarters)</span>
            <span className="text-[10px] text-slate-400">1x 50kg Bag &times; 200 = 200 Quarter-Kgs &bull; KSh 6,800</span>
          </button>

          <button
            onClick={() => applyPreset({
              item: "Unga Jogoo 2kg",
              supplyQty: "5",
              supplyUnit: "Bale (12pkts)",
              retailUnit: "Packet (2kg)",
              ratio: "12",
              cost: "9000",
              retail: "170",
              supplier: "Unga Miller Distributor"
            })}
            className="p-3 bg-[#0a1610] hover:bg-[#0f241a] border border-purple-500/30 rounded-xl text-left transition cursor-pointer text-xs"
          >
            <span className="font-bold text-white block">5 Bales Unga (60 Pkts)</span>
            <span className="text-[10px] text-slate-400">5x Bale &times; 12 = 60 Packets &bull; KSh 9,000</span>
          </button>
        </div>
      </div>

      {/* DELIVERY INPUT FORM + LIVE CONVERSION PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLUMNS: FORM */}
        <div className="lg:col-span-2 bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider border-b border-slate-800 pb-2">
            Log Incoming Delivery Batch
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Item Received</label>
                <select
                  value={selectedItemName}
                  onChange={(e) => setSelectedItemName(e.target.value)}
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.name}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Supplier / Delivery Driver</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Brookside Driver / Wholesaler"
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            {/* BULK TO MICRO CONVERSION INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#060c09] rounded-2xl border border-slate-800">
              <div>
                <label className="text-slate-400 font-mono block mb-1">Bulk Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={supplyQty}
                  onChange={(e) => setSupplyQty(e.target.value)}
                  className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">e.g. 2 Crates / 1 Bag</span>
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Supply Unit Name</label>
                <input
                  type="text"
                  value={supplyUnit}
                  onChange={(e) => setSupplyUnit(e.target.value)}
                  className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2 text-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">e.g. Crate (24pkts)</span>
              </div>

              <div>
                <label className="text-emerald-400 font-mono font-bold block mb-1">Split Ratio (Micro Units)</label>
                <input
                  type="number"
                  min={1}
                  value={conversionRatio}
                  onChange={(e) => setConversionRatio(e.target.value)}
                  className="w-full bg-[#0a1510] border border-emerald-500/50 rounded-xl p-2 text-emerald-400 font-mono font-bold"
                />
                <span className="text-[10px] text-emerald-400/80 mt-1 block">Micro units per bulk pack</span>
              </div>
            </div>

            {/* FINANCIALS & SETTLEMENT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Total Wholesale Invoice Cost ({currency})</label>
                <input
                  type="number"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Retail Shelf Price ({currency} / Micro Unit)</label>
                <input
                  type="number"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Settlement Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="MPESA">M-Pesa Till / Paybill</option>
                  <option value="CASH">Cash from Register</option>
                  <option value="CREDIT">Supplier Credit (Pay Later)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Plus size={16} /> Log Incoming Delivery (5s)
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE CONVERSION & MARGIN PREVIEW */}
        <div className="bg-[#0e1713] border-2 border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-2">
              <Calculator size={15} /> Auto-Split Conversion Telemetry
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Added to Shelf Inventory</span>
                <div className="text-2xl font-black text-emerald-400">
                  +{totalRetailUnits} {retailUnit}
                </div>
                <span className="text-[11px] text-slate-500">
                  {qtyNum} {supplyUnit} &times; {ratioNum}
                </span>
              </div>

              <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Computed Micro-Unit Cost</span>
                <div className="text-xl font-black text-white">
                  {currency} {microCost} / unit
                </div>
                <span className="text-[11px] text-slate-500">
                  Wholesale {currency} {costNum} / {totalRetailUnits}
                </span>
              </div>

              <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Locked Batch Gross Margin</span>
                <div className="text-xl font-black text-amber-400">
                  +{currency} {profitPotential.grossProfit.toLocaleString()} ({profitPotential.markupPercentage}%)
                </div>
                <span className="text-[11px] text-slate-500">
                  Gross Yield: {currency} {profitPotential.expectedRetailYield.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-300">
            ✓ Ready: Micro-fractions will be tracked passively at end-of-day without counter screen-tapping.
          </div>
        </div>

      </div>

      {/* RECENT SUPPLY LOGS TABLE */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider border-b border-slate-800 pb-2">
          Recent Incoming Deliveries ({recentLogs.length} Batches)
        </h3>

        <div className="space-y-2">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-[#060c09] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
            >
              <div>
                <span className="font-bold text-white block">{log.itemName}</span>
                <span className="text-[11px] text-slate-400">
                  Received {log.supplyUnitsReceived} {log.supplyUnit} &bull; Converted to <strong>+{log.retailUnitsAdded} {log.retailUnit}</strong>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-bold text-emerald-400 block">{currency} {log.totalCost.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500">{log.paymentMode} &bull; {log.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
