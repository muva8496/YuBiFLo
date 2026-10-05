import React, { useState } from "react";
import { 
  Truck, ArrowRight, CheckCircle2, Package, Sparkles, 
  RefreshCw, DollarSign, Layers, Plus, Trash2, Check, 
  Calculator, ListPlus, FileText, ShoppingBag, AlertCircle
} from "lucide-react";
import { AlacioMasterState, InventoryItem } from "../../types/alacio";
import { BulkConversionEngine } from "../../services/bulkConversionEngine";

export interface MultiSupplyDeliveryItem {
  id: string;
  itemId: string | number;
  itemName: string;
  supplyUnitsReceived: number;
  supplyUnit: string;
  retailUnitsAdded: number;
  retailUnit: string;
  conversionRatio: number;
  lineCost: number;
  unitCostAtDelivery: number;
  retailPrice: number;
  expectedMargin: number;
}

export interface MultiSupplyDelivery {
  id: string;
  supplierName: string;
  supplierNationalId?: string; // Kenyan National ID for Agent & Bank OTC deposits
  supplierPhone?: string;
  deliveryNoteNumber: string;
  paymentMode: "CASH" | "MPESA" | "CREDIT" | "EQUITEL";
  timestamp: string;
  totalCost: number;
  totalRetailValue: number;
  items: MultiSupplyDeliveryItem[];
}

// Kept for backward compatibility
export type SupplyLogEntry = MultiSupplyDeliveryItem & {
  supplierName: string;
  paymentMode: "CASH" | "MPESA" | "CREDIT";
  timestamp: string;
  totalCost: number;
};

interface SupplierLogTabProps {
  state: AlacioMasterState;
  onLogMultiDelivery: (delivery: MultiSupplyDelivery) => void;
}

export default function SupplierLogTab({ state, onLogMultiDelivery }: SupplierLogTabProps) {
  const { currency, inventory } = state;

  // Supplier & Shipment Header
  const [supplierName, setSupplierName] = useState("Brookside Dairy Delivery");
  const [supplierNationalId, setSupplierNationalId] = useState("22940184");
  const [supplierPhone, setSupplierPhone] = useState("0722 849 101");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("DN-8841");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "MPESA" | "CREDIT" | "EQUITEL">("MPESA");
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Multi-Item Delivery Items List
  const [deliveryItems, setDeliveryItems] = useState<MultiSupplyDeliveryItem[]>([
    {
      id: "item_row_1",
      itemId: inventory[0]?.id || 1,
      itemName: "Brookside Fresh Milk 500ml",
      supplyUnitsReceived: 2,
      supplyUnit: "Crate (24pkts)",
      retailUnitsAdded: 48,
      retailUnit: "Packet",
      conversionRatio: 24,
      lineCost: 2640,
      unitCostAtDelivery: 55,
      retailPrice: 65,
      expectedMargin: 10
    },
    {
      id: "item_row_2",
      itemId: inventory[1]?.id || 2,
      itemName: "Brookside Lala / Mala 500ml",
      supplyUnitsReceived: 1,
      supplyUnit: "Crate (24pkts)",
      retailUnitsAdded: 24,
      retailUnit: "Packet",
      conversionRatio: 24,
      lineCost: 1560,
      unitCostAtDelivery: 65,
      retailPrice: 80,
      expectedMargin: 15
    }
  ]);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Past multi-item shipments history
  const [recentDeliveries, setRecentDeliveries] = useState<MultiSupplyDelivery[]>([
    {
      id: "deliv_prev_1",
      supplierName: "Bidco Africa & Mega Wholesalers",
      deliveryNoteNumber: "DN-7719",
      paymentMode: "MPESA",
      timestamp: "Today, 08:30 AM",
      totalCost: 12800,
      totalRetailValue: 15400,
      items: [
        {
          id: "prev_i1",
          itemId: "sugar",
          itemName: "Mumias Sugar",
          supplyUnitsReceived: 1,
          supplyUnit: "Bag (50kg)",
          retailUnitsAdded: 200,
          retailUnit: "Quarter-Kg (250g)",
          conversionRatio: 200,
          lineCost: 6800,
          unitCostAtDelivery: 34,
          retailPrice: 40,
          expectedMargin: 6
        },
        {
          id: "prev_i2",
          itemId: "unga",
          itemName: "Unga Jogoo 2kg",
          supplyUnitsReceived: 4,
          supplyUnit: "Bale (12pkts)",
          retailUnitsAdded: 48,
          retailUnit: "Packet",
          conversionRatio: 12,
          lineCost: 6000,
          unitCostAtDelivery: 125,
          retailPrice: 145,
          expectedMargin: 20
        }
      ]
    }
  ]);

  // Aggregate totals across all items in current delivery
  const totalDeliveryCost = deliveryItems.reduce((acc, item) => acc + (item.lineCost || 0), 0);
  const totalRetailValue = deliveryItems.reduce(
    (acc, item) => acc + (item.retailUnitsAdded * item.retailPrice || 0), 
    0
  );
  const totalExpectedProfit = totalRetailValue - totalDeliveryCost;
  const overallMarkup = totalDeliveryCost > 0 ? ((totalExpectedProfit / totalDeliveryCost) * 100).toFixed(1) : "0.0";

  // Add a new blank item row to this supplier's delivery
  const handleAddItemRow = () => {
    const newItem: MultiSupplyDeliveryItem = {
      id: `item_row_${Date.now()}`,
      itemId: `custom_${Date.now()}`,
      itemName: "Broadways White Bread 400g",
      supplyUnitsReceived: 1,
      supplyUnit: "Crate / Bale",
      retailUnitsAdded: 20,
      retailUnit: "Pieces",
      conversionRatio: 20,
      lineCost: 1300,
      unitCostAtDelivery: 65,
      retailPrice: 75,
      expectedMargin: 10
    };
    setDeliveryItems([...deliveryItems, newItem]);
  };

  // Update a specific field on a delivery line item
  const handleUpdateItem = (
    id: string, 
    field: keyof MultiSupplyDeliveryItem, 
    value: any
  ) => {
    setDeliveryItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Recalculate derived units & costs if quantities change
        if (field === "supplyUnitsReceived" || field === "conversionRatio") {
          const sQty = field === "supplyUnitsReceived" ? parseFloat(value) || 0 : item.supplyUnitsReceived;
          const ratio = field === "conversionRatio" ? parseFloat(value) || 1 : item.conversionRatio;
          const totalMicro = BulkConversionEngine.convertSupplyToRetailUnits(sQty, ratio);
          updated.retailUnitsAdded = totalMicro;
          if (totalMicro > 0 && updated.lineCost > 0) {
            updated.unitCostAtDelivery = Math.round((updated.lineCost / totalMicro) * 100) / 100;
          }
        }

        if (field === "lineCost") {
          const cost = parseFloat(value) || 0;
          if (updated.retailUnitsAdded > 0) {
            updated.unitCostAtDelivery = Math.round((cost / updated.retailUnitsAdded) * 100) / 100;
          }
        }

        if (field === "retailPrice") {
          const ret = parseFloat(value) || 0;
          updated.expectedMargin = Math.max(0, ret - updated.unitCostAtDelivery);
        }

        return updated;
      })
    );
  };

  // Remove a line item
  const handleRemoveItem = (id: string) => {
    if (deliveryItems.length <= 1) return; // Keep at least one
    setDeliveryItems(deliveryItems.filter((i) => i.id !== id));
  };

  // Apply Common Multi-Item Supplier Presets
  const applyMultiPreset = (presetType: "BROOKSIDE" | "BROADWAY" | "MEGA_WHOLESALE") => {
    if (presetType === "BROOKSIDE") {
      setSupplierName("Brookside Dairy Kenya Ltd");
      setSupplierNationalId("22940184");
      setSupplierPhone("0722 849 101");
      setDeliveryNoteNumber(`BK-${Math.floor(1000 + Math.random() * 9000)}`);
      setPaymentMode("MPESA");
      setDeliveryItems([
        {
          id: `item_${Date.now()}_1`,
          itemId: 1,
          itemName: "Brookside Fresh Milk 500ml",
          supplyUnitsReceived: 2,
          supplyUnit: "Crate (24pkts)",
          retailUnitsAdded: 48,
          retailUnit: "Packets",
          conversionRatio: 24,
          lineCost: 2640,
          unitCostAtDelivery: 55,
          retailPrice: 65,
          expectedMargin: 10
        },
        {
          id: `item_${Date.now()}_2`,
          itemId: 2,
          itemName: "Brookside Lala / Mala 500ml",
          supplyUnitsReceived: 1,
          supplyUnit: "Crate (24pkts)",
          retailUnitsAdded: 24,
          retailUnit: "Packets",
          conversionRatio: 24,
          lineCost: 1560,
          unitCostAtDelivery: 65,
          retailPrice: 80,
          expectedMargin: 15
        },
        {
          id: `item_${Date.now()}_3`,
          itemId: 3,
          itemName: "Brookside Cup Yoghurt 250ml",
          supplyUnitsReceived: 1,
          supplyUnit: "Tray (12cups)",
          retailUnitsAdded: 12,
          retailUnit: "Cups",
          conversionRatio: 12,
          lineCost: 840,
          unitCostAtDelivery: 70,
          retailPrice: 85,
          expectedMargin: 15
        }
      ]);
    } else if (presetType === "BROADWAY") {
      setSupplierName("Broadway Bakeries Ltd");
      setSupplierNationalId("26884019");
      setSupplierPhone("0733 901 442");
      setDeliveryNoteNumber(`BW-${Math.floor(1000 + Math.random() * 9000)}`);
      setPaymentMode("CASH");
      setDeliveryItems([
        {
          id: `item_${Date.now()}_1`,
          itemId: 11,
          itemName: "Broadways White Bread 400g",
          supplyUnitsReceived: 25,
          supplyUnit: "Loaves",
          retailUnitsAdded: 25,
          retailUnit: "Loaves",
          conversionRatio: 1,
          lineCost: 1500,
          unitCostAtDelivery: 60,
          retailPrice: 70,
          expectedMargin: 10
        },
        {
          id: `item_${Date.now()}_2`,
          itemId: 12,
          itemName: "Broadways Brown Bread 400g",
          supplyUnitsReceived: 10,
          supplyUnit: "Loaves",
          retailUnitsAdded: 10,
          retailUnit: "Loaves",
          conversionRatio: 1,
          lineCost: 650,
          unitCostAtDelivery: 65,
          retailPrice: 75,
          expectedMargin: 10
        },
        {
          id: `item_${Date.now()}_3`,
          itemId: 13,
          itemName: "Sweet Buns & Scones (Pack 6)",
          supplyUnitsReceived: 15,
          supplyUnit: "Packs",
          retailUnitsAdded: 15,
          retailUnit: "Packs",
          conversionRatio: 1,
          lineCost: 600,
          unitCostAtDelivery: 40,
          retailPrice: 50,
          expectedMargin: 10
        }
      ]);
    } else if (presetType === "MEGA_WHOLESALE") {
      setSupplierName("Nairobi Mega Wholesalers & Distributors");
      setSupplierNationalId("28419203");
      setSupplierPhone("0711 445 890");
      setDeliveryNoteNumber(`NW-${Math.floor(1000 + Math.random() * 9000)}`);
      setPaymentMode("MPESA");
      setDeliveryItems([
        {
          id: `item_${Date.now()}_1`,
          itemId: 14,
          itemName: "Mumias Sugar",
          supplyUnitsReceived: 1,
          supplyUnit: "Bag (50kg)",
          retailUnitsAdded: 200,
          retailUnit: "Quarter-Kg (250g)",
          conversionRatio: 200,
          lineCost: 6800,
          unitCostAtDelivery: 34,
          retailPrice: 40,
          expectedMargin: 6
        },
        {
          id: `item_${Date.now()}_2`,
          itemId: 15,
          itemName: "Unga Jogoo 2kg",
          supplyUnitsReceived: 4,
          supplyUnit: "Bale (12pkts)",
          retailUnitsAdded: 48,
          retailUnit: "Packets",
          conversionRatio: 12,
          lineCost: 6000,
          unitCostAtDelivery: 125,
          retailPrice: 145,
          expectedMargin: 20
        },
        {
          id: `item_${Date.now()}_3`,
          itemId: 16,
          itemName: "Golden Fry Cooking Oil 1L",
          supplyUnitsReceived: 2,
          supplyUnit: "Carton (12btls)",
          retailUnitsAdded: 24,
          retailUnit: "Bottles",
          conversionRatio: 12,
          lineCost: 6000,
          unitCostAtDelivery: 250,
          retailPrice: 285,
          expectedMargin: 35
        }
      ]);
    }
  };

  // Submit complete multi-item delivery to master state
  const handleSubmitMultiDelivery = (e: React.FormEvent) => {
    e.preventDefault();

    if (deliveryItems.length === 0) return;

    const newDelivery: MultiSupplyDelivery = {
      id: `deliv_${Date.now()}`,
      supplierName,
      supplierNationalId: supplierNationalId.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
      deliveryNoteNumber,
      paymentMode,
      timestamp: `Today, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      totalCost: totalDeliveryCost,
      totalRetailValue,
      items: deliveryItems
    };

    onLogMultiDelivery(newDelivery);
    setRecentDeliveries([newDelivery, ...recentDeliveries]);

    const itemsSummary = deliveryItems
      .map((i) => `${i.supplyUnitsReceived} ${i.supplyUnit} ${i.itemName}`)
      .join(", ");

    setSuccessMsg(
      `Multi-item delivery logged! ${deliveryItems.length} products from ${supplierName} recorded (${itemsSummary}). Added ${currency} ${totalRetailValue.toLocaleString()} to active shelf value. Margin: +${currency} ${totalExpectedProfit.toLocaleString()} (${overallMarkup}%).`
    );
    setTimeout(() => setSuccessMsg(null), 8000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Truck className="text-cyan-400" size={24} /> Supplier Delivery Log (Multi-Item Support)
            </h2>
            <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
              Multi-Product Delivery
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            When a supplier delivers multiple items at once (e.g. Milk + Lala + Butter or Sugar + Unga + Oil), log them all together on a single delivery note with automated <strong>Bulk-to-Micro Conversion</strong>.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* QUICK PRESETS ROW (MULTI-ITEM SHIPMENTS) */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-400" /> 1-Tap Load Common Multi-Item Shipments:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => applyMultiPreset("BROOKSIDE")}
            className="p-3 bg-[#0a1610] hover:bg-[#0f241a] border border-cyan-500/30 rounded-xl text-left transition cursor-pointer text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white block">Brookside Dairy Van (3 Items)</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">3 Products</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              2 Crates Milk (48 pkts) + 1 Crate Mala (24 pkts) + 1 Tray Yoghurt
            </span>
          </button>

          <button
            onClick={() => applyMultiPreset("BROADWAY")}
            className="p-3 bg-[#0a1610] hover:bg-[#0f241a] border border-amber-500/30 rounded-xl text-left transition cursor-pointer text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white block">Broadway Bakeries (3 Items)</span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">3 Products</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              25 White Loaves + 10 Brown Loaves + 15 Sweet Buns
            </span>
          </button>

          <button
            onClick={() => applyMultiPreset("MEGA_WHOLESALE")}
            className="p-3 bg-[#0a1610] hover:bg-[#0f241a] border border-emerald-500/30 rounded-xl text-left transition cursor-pointer text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white block">Mega Wholesaler (3 Commodities)</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">3 Products</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              1 Bag Sugar (200 quarters) + 4 Bales Unga (48 pkts) + 2 Ctns Cooking Oil
            </span>
          </button>
        </div>
      </div>

      {/* MULTI-ITEM DELIVERY LOGGING FORM */}
      <form onSubmit={handleSubmitMultiDelivery} className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-5">
        
        {/* SHIPMENT & SUPPLIER HEADER FIELDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 pb-4 border-b border-slate-800 text-xs">
          <div className="sm:col-span-2">
            <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Supplier / Distributor Name</label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Brookside Dairy, Bidco, Broadway"
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px] flex items-center justify-between">
              <span>National ID (Rep/Driver)</span>
              <span className="text-[9px] text-emerald-400">For OTC Deposit</span>
            </label>
            <input
              type="text"
              value={supplierNationalId}
              onChange={(e) => setSupplierNationalId(e.target.value)}
              placeholder="e.g. 22940184"
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Supplier Phone</label>
            <input
              type="text"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              placeholder="e.g. 0722 849 101"
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Delivery Note #</label>
            <input
              type="text"
              value={deliveryNoteNumber}
              onChange={(e) => setDeliveryNoteNumber(e.target.value)}
              placeholder="e.g. DN-8841"
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Settlement Channel</label>
            <select
              value={paymentMode}
              onChange={(e: any) => setPaymentMode(e.target.value)}
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500"
            >
              <option value="MPESA">M-Pesa Till / Send Money</option>
              <option value="CASH">Physical Drawer Cash</option>
              <option value="EQUITEL">Equitel Paybill Line</option>
              <option value="CREDIT">Supplier Credit (Pay Later)</option>
            </select>
          </div>
        </div>

        {/* LINE ITEMS TABLE (SEVERAL THINGS DELIVERED TOGETHER) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListPlus size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Delivered Items in this Shipment ({deliveryItems.length} Products)
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddItemRow}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={14} /> Add Another Item From This Supplier
            </button>
          </div>

          <div className="space-y-3">
            {deliveryItems.map((item, index) => (
              <div 
                key={item.id}
                className="p-4 bg-[#060c09] border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs">
                  <span className="font-bold text-slate-300 font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400">
                      {index + 1}
                    </span>
                    Line Item #{index + 1}
                  </span>

                  {deliveryItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
                  {/* Product Name */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Product Name</label>
                    <input
                      type="text"
                      required
                      value={item.itemName}
                      onChange={(e) => handleUpdateItem(item.id, "itemName", e.target.value)}
                      placeholder="e.g. Brookside Fresh Milk"
                      className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2 text-white font-medium"
                    />
                  </div>

                  {/* Supply Quantity & Packaging */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Wholesale Qty</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={item.supplyUnitsReceived}
                        onChange={(e) => handleUpdateItem(item.id, "supplyUnitsReceived", e.target.value)}
                        className="w-16 bg-[#0a1510] border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
                      />
                      <input
                        type="text"
                        value={item.supplyUnit}
                        onChange={(e) => handleUpdateItem(item.id, "supplyUnit", e.target.value)}
                        placeholder="Crate / Bale"
                        className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2 text-white text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Packaging Split Ratio & Retail Units */}
                  <div>
                    <label className="text-[10px] text-cyan-400 block mb-1 font-mono uppercase">
                      Split Ratio (&rarr; Retail)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={item.conversionRatio}
                        onChange={(e) => handleUpdateItem(item.id, "conversionRatio", e.target.value)}
                        className="w-16 bg-[#0a1510] border border-cyan-500/50 rounded-xl p-2 text-cyan-400 font-mono font-bold"
                      />
                      <span className="text-[11px] font-mono text-slate-300">
                        = {item.retailUnitsAdded} {item.retailUnit}
                      </span>
                    </div>
                  </div>

                  {/* Total Cost for this line */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">
                      Line Cost ({currency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.lineCost}
                      onChange={(e) => handleUpdateItem(item.id, "lineCost", e.target.value)}
                      className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                      Cost: {currency} {item.unitCostAtDelivery} / unit
                    </span>
                  </div>

                  {/* Retail Selling Price */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">
                      Retail Price ({currency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.retailPrice}
                      onChange={(e) => handleUpdateItem(item.id, "retailPrice", e.target.value)}
                      className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
                    />
                    <span className="text-[9px] text-emerald-400 font-mono block mt-0.5">
                      Profit: +{currency} {item.expectedMargin} / unit
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MULTI-ITEM DELIVERY SUMMARY CARD & SUBMISSION */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono w-full sm:w-auto">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Total Items</span>
              <strong className="text-white text-sm">{deliveryItems.length} Products</strong>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Total Delivery Cost</span>
              <strong className="text-amber-400 text-sm">
                {currency} {totalDeliveryCost.toLocaleString()}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Total Retail Shelf Value</span>
              <strong className="text-cyan-400 text-sm">
                {currency} {totalRetailValue.toLocaleString()}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Potential Batch Profit</span>
              <strong className="text-emerald-400 text-sm">
                +{currency} {totalExpectedProfit.toLocaleString()} ({overallMarkup}%)
              </strong>
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 font-mono shrink-0"
          >
            <Check size={16} />
            <span>Log Multi-Item Delivery ({deliveryItems.length} Items &rarr; {currency} {totalDeliveryCost.toLocaleString()})</span>
          </button>
        </div>
      </form>

      {/* RECENT SHIPMENTS AUDIT LOG (SHOWING MULTI-ITEM DELIVERIES) */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Truck size={15} className="text-cyan-400" /> Recent Supplier Deliveries ({recentDeliveries.length} Shipments)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Real-time incoming stock audit</span>
        </div>

        <div className="space-y-3">
          {recentDeliveries.map((delivery) => (
            <div 
              key={delivery.id}
              className="p-4 bg-[#060c09] border border-slate-800 rounded-xl space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{delivery.supplierName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {delivery.deliveryNoteNumber}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {delivery.items.length} Products
                  </span>
                  {delivery.supplierNationalId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                      National ID: {delivery.supplierNationalId}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400 text-[11px]">{delivery.timestamp}</span>
                  <span className="font-bold text-cyan-400">
                    Total: {currency} {delivery.totalCost.toLocaleString()} ({delivery.paymentMode})
                  </span>
                </div>
              </div>

              {/* Items Breakdown inside this shipment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {delivery.items.map((item) => (
                  <div key={item.id} className="p-2 bg-[#0a1510] rounded-lg border border-slate-800/80 text-[11px]">
                    <div className="font-semibold text-white truncate">{item.itemName}</div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-0.5">
                      <span>{item.supplyUnitsReceived} {item.supplyUnit} &rarr; +{item.retailUnitsAdded} {item.retailUnit}</span>
                      <span className="text-emerald-400 font-bold">{currency} {item.lineCost.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
