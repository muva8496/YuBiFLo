import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Layers,
  Package,
  Sparkles,
  ArrowRight,
  Copy,
  TrendingUp,
  Tag,
  Boxes,
} from "lucide-react";
import { InventoryItem, Merchant, SupplyBatch } from "../types";
import { RestockEngine, RestockResult } from "../services/restockEngine";
import { AppStorage } from "../services/storage";
import { SearchableItemPicker } from "./SearchableItemPicker";
import { EvidentialDatePicker } from "./EvidentialDatePicker";

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant;
  items: InventoryItem[];
  batches: SupplyBatch[];
  onSuccess: (result: RestockResult, message: string) => void;
  preselectedItemId?: string;
}

export type UnitOfMeasure =
  | "units"
  | "crates"
  | "bales"
  | "packets"
  | "bottles"
  | "kg"
  | "sachets"
  | "tins"
  | "boxes";

export interface RestockItemRow {
  id: string;
  isCustom: boolean;
  itemId?: string;
  itemName: string;
  category: string;
  unitOfMeasure: UnitOfMeasure;
  qtyPurchased: number;
  totalCost: number;
  unitSellingPrice: number;
  remainingPreviousBatch: number;
  spoilagePreviousBatch: number;
  notes?: string;
}

const CATEGORIES = [
  "Dairy & Fresh",
  "Bakery & Snacks",
  "Beverages",
  "Grains & Cereals",
  "Cooking & Oils",
  "Household & Cleaning",
  "Personal Care",
  "General Goods",
  "Agrovet & Feeds",
  "Stationery & Airtime",
];

const UNITS_OF_MEASURE: UnitOfMeasure[] = [
  "units",
  "packets",
  "bottles",
  "crates",
  "bales",
  "kg",
  "sachets",
  "tins",
  "boxes",
];

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  merchant,
  items,
  batches,
  onSuccess,
  preselectedItemId,
}) => {
  const [mode, setMode] = useState<"SINGLE" | "MULTI">("SINGLE");
  const [receivedTimestamp, setReceivedTimestamp] = useState<string>(new Date().toISOString());
  const [supplierName, setSupplierName] = useState<string>("");
  const [receiptRef, setReceiptRef] = useState<string>("");

  // Single Item State
  const [singleIsCustom, setSingleIsCustom] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string>(preselectedItemId || "");
  const [singleCustomName, setSingleCustomName] = useState<string>("");
  const [singleCategory, setSingleCategory] = useState<string>("Dairy & Fresh");
  const [singleUnitOfMeasure, setSingleUnitOfMeasure] = useState<UnitOfMeasure>("packets");
  const [singleQty, setSingleQty] = useState<number>(0);
  const [singleTotalCost, setSingleTotalCost] = useState<number>(0);
  const [singleSellingPrice, setSingleSellingPrice] = useState<number>(0);
  const [singleRemainingOnShelf, setSingleRemainingOnShelf] = useState<number>(0);
  const [singleSpoilage, setSingleSpoilage] = useState<number>(0);
  const [singleNotes, setSingleNotes] = useState<string>("");

  // Multi-Item Rows State
  const [multiRows, setMultiRows] = useState<RestockItemRow[]>([]);

  const createDefaultRow = (item?: InventoryItem, isCustom: boolean = false): RestockItemRow => {
    if (isCustom) {
      return {
        id: `rrow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        isCustom: true,
        itemName: "",
        category: "General Goods",
        unitOfMeasure: "packets",
        qtyPurchased: 1,
        totalCost: 0,
        unitSellingPrice: 0,
        remainingPreviousBatch: 0,
        spoilagePreviousBatch: 0,
        notes: "",
      };
    }

    if (item) {
      return {
        id: `rrow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        isCustom: false,
        itemId: item.id,
        itemName: item.name,
        category: item.category || "General Goods",
        unitOfMeasure: (item.unit_of_measure as UnitOfMeasure) || "units",
        qtyPurchased: 1,
        totalCost: Number(item.unit_cost_price || 0),
        unitSellingPrice: Number(item.unit_selling_price || 0),
        remainingPreviousBatch: 0,
        spoilagePreviousBatch: 0,
        notes: "",
      };
    }

    return {
      id: `rrow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isCustom: false,
      itemId: item?.id || "",
      itemName: item?.name || "",
      category: item?.category || "General Goods",
      unitOfMeasure: (item?.unit_of_measure as UnitOfMeasure) || "units",
      qtyPurchased: 1,
      totalCost: Number(item?.unit_cost_price || 0),
      unitSellingPrice: Number(item?.unit_selling_price || 0),
      remainingPreviousBatch: 0,
      spoilagePreviousBatch: 0,
      notes: "",
    };
  };

  // Preselection & Initialization
  useEffect(() => {
    if (preselectedItemId) {
      setSelectedItemId(preselectedItemId);
      setSingleIsCustom(false);
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [preselectedItemId, items]);

  // Sync Single Item details when selected item changes
  const singleCurrentItem = !singleIsCustom ? items.find((i) => i.id === selectedItemId) : null;
  const singleActiveBatch =
    !singleIsCustom && selectedItemId
      ? batches.find((b) => b.item_id === selectedItemId && b.status === "ACTIVE")
      : undefined;

  useEffect(() => {
    if (!singleIsCustom && singleCurrentItem) {
      setSingleSellingPrice(singleCurrentItem.unit_selling_price ?? 0);
      setSingleCategory(singleCurrentItem.category || "General Goods");
      setSingleUnitOfMeasure((singleCurrentItem.unit_of_measure as UnitOfMeasure) || "units");
      const estCost = singleCurrentItem.unit_cost_price
        ? Number((singleCurrentItem.unit_cost_price * Math.max(1, singleQty)).toFixed(2))
        : 0;
      setSingleTotalCost(estCost);
    }
  }, [selectedItemId, singleIsCustom]);

  // Initialize multi-rows if empty
  useEffect(() => {
    if (multiRows.length === 0 && items.length > 0) {
      setMultiRows([
        createDefaultRow(items[0]),
        ...(items.length > 1 ? [createDefaultRow(items[1])] : []),
      ]);
    }
  }, [items]);

  if (!isOpen) return null;

  // Single Item Math
  const singleUnitCost = singleQty > 0 ? Number((singleTotalCost / singleQty).toFixed(2)) : 0;
  const singleUnitProfit = Number((singleSellingPrice - singleUnitCost).toFixed(2));
  const singleExpectedProfit = Number(((singleSellingPrice - singleUnitCost) * singleQty).toFixed(2));

  // Single Item Previous Batch Turnover Math
  const singlePrevInitial = singleActiveBatch ? singleActiveBatch.initial_qty : 0;
  const singleSafeRemaining = Math.max(0, Math.min(singlePrevInitial, Number(singleRemainingOnShelf) || 0));
  const singleSafeSpoilage = Math.max(0, Math.min(singlePrevInitial - singleSafeRemaining, Number(singleSpoilage) || 0));
  const singleDerivedSold = Math.max(0, singlePrevInitial - singleSafeRemaining - singleSafeSpoilage);
  const singleDerivedRevenue = singleActiveBatch
    ? Number((singleDerivedSold * singleActiveBatch.unit_selling_price).toFixed(2))
    : 0;
  const singleDerivedProfit = singleActiveBatch
    ? Number((singleDerivedSold * (singleActiveBatch.unit_selling_price - singleActiveBatch.unit_cost_price)).toFixed(2))
    : 0;

  // Multi-Rows Handlers
  const handleAddMultiRowExisting = () => {
    setMultiRows([...multiRows, createDefaultRow(undefined, false)]);
  };

  const handleAddMultiRowCustom = () => {
    setMultiRows([...multiRows, createDefaultRow(undefined, true)]);
  };

  const handleDuplicateRow = (row: RestockItemRow) => {
    const newRow: RestockItemRow = {
      ...row,
      id: `rrow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemName: row.isCustom ? `${row.itemName} (Copy)` : row.itemName,
    };
    setMultiRows([...multiRows, newRow]);
  };

  const handleRemoveMultiRow = (id: string) => {
    if (multiRows.length <= 1) {
      alert("At least one item is required in the restock batch.");
      return;
    }
    setMultiRows(multiRows.filter((r) => r.id !== id));
  };

  const handleUpdateMultiRow = (id: string, updates: Partial<RestockItemRow>) => {
    setMultiRows(
      multiRows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };

        // If item was changed via picker
        if (updates.itemId && updates.itemId !== r.itemId) {
          const selectedIt = items.find((i) => i.id === updates.itemId);
          if (selectedIt) {
            updated.itemName = selectedIt.name;
            updated.category = selectedIt.category || "General Goods";
            updated.unitOfMeasure = (selectedIt.unit_of_measure as UnitOfMeasure) || "units";
            updated.unitSellingPrice = selectedIt.unit_selling_price || 0;
            updated.totalCost = Number(
              ((selectedIt.unit_cost_price || 0) * (updated.qtyPurchased || 1)).toFixed(2)
            );
            updated.isCustom = false;
            updated.remainingPreviousBatch = 0;
            updated.spoilagePreviousBatch = 0;
          }
        }

        // If switching from custom to existing
        if (updates.isCustom === false && r.isCustom) {
          const firstIt = items[0];
          if (firstIt) {
            updated.itemId = firstIt.id;
            updated.itemName = firstIt.name;
            updated.category = firstIt.category || "General Goods";
            updated.unitOfMeasure = (firstIt.unit_of_measure as UnitOfMeasure) || "units";
            updated.unitSellingPrice = firstIt.unit_selling_price || 0;
            updated.totalCost = Number(
              ((firstIt.unit_cost_price || 0) * (updated.qtyPurchased || 1)).toFixed(2)
            );
          }
        }

        return updated;
      })
    );
  };

  // Multi-Rows Aggregations
  const multiTotalCost = multiRows.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);
  const multiTotalIncomingUnits = multiRows.reduce((sum, r) => sum + (Number(r.qtyPurchased) || 0), 0);
  const multiTotalExpectedRevenue = multiRows.reduce(
    (sum, r) => sum + (Number(r.qtyPurchased) || 0) * (Number(r.unitSellingPrice) || 0),
    0
  );
  const multiTotalExpectedProfit = multiTotalExpectedRevenue - multiTotalCost;

  // Multi-Rows Past Batch Realized Sales Calculations
  let multiTotalProvenSoldUnits = 0;
  let multiTotalRealizedRevenue = 0;
  let multiTotalRealizedProfit = 0;
  let multiClosedBatchesCount = 0;

  multiRows.forEach((row) => {
    if (!row.isCustom && row.itemId) {
      const b = batches.find((itemBatch) => itemBatch.item_id === row.itemId && itemBatch.status === "ACTIVE");
      if (b) {
        const prevInit = b.initial_qty;
        const safeRem = Math.max(0, Math.min(prevInit, Number(row.remainingPreviousBatch) || 0));
        const safeSp = Math.max(0, Math.min(prevInit - safeRem, Number(row.spoilagePreviousBatch) || 0));
        const sold = Math.max(0, prevInit - safeRem - safeSp);
        const rev = Number((sold * b.unit_selling_price).toFixed(2));
        const prof = Number((sold * (b.unit_selling_price - b.unit_cost_price)).toFixed(2));

        if (sold > 0) {
          multiTotalProvenSoldUnits += sold;
          multiTotalRealizedRevenue += rev;
          multiTotalRealizedProfit += prof;
          multiClosedBatchesCount++;
        }
      }
    }
  });

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "SINGLE") {
      const finalItemName = singleIsCustom
        ? singleCustomName.trim()
        : singleCurrentItem?.name || singleCustomName.trim();

      if (!finalItemName) {
        alert("Please specify an arriving item name.");
        return;
      }

      if (Number(singleQty) <= 0) {
        alert("Incoming quantity must be at least 1 unit.");
        return;
      }

      const result = RestockEngine.processRestock(
        {
          itemId: singleIsCustom ? undefined : selectedItemId,
          itemName: finalItemName,
          category: singleCategory,
          quantityPurchased: Number(singleQty),
          totalPurchaseCost: Number(singleTotalCost),
          unitSellingPrice: Number(singleSellingPrice),
          supplierName: supplierName || "Direct Wholesaler / Distributor",
          receiptReference: receiptRef || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
          unitOfMeasure: singleUnitOfMeasure,
          notes: singleNotes || "Restock turnover delivery",
          remainingPreviousBatch: singleSafeRemaining,
          spoilagePreviousBatch: singleSafeSpoilage,
          receivedDate: receivedTimestamp,
        },
        merchant
      );

      onSuccess(result, result.summaryMessage);
      onClose();
    } else {
      // Multi-Item Processing
      if (multiRows.length === 0) {
        alert("Please add at least one item to restock.");
        return;
      }

      for (let i = 0; i < multiRows.length; i++) {
        const row = multiRows[i];
        if (!row.itemName.trim()) {
          alert(`Item row #${i + 1} is missing a product name.`);
          return;
        }
        if (Number(row.qtyPurchased) <= 0) {
          alert(`Item "${row.itemName}" requires an incoming quantity of at least 1.`);
          return;
        }
      }

      let primaryResult: RestockResult | null = null;
      let closedCount = 0;
      let totalRevenueGenerated = 0;

      multiRows.forEach((row, idx) => {
        const res = RestockEngine.processRestock(
          {
            itemId: row.isCustom ? undefined : row.itemId,
            itemName: row.itemName.trim(),
            category: row.category,
            quantityPurchased: Number(row.qtyPurchased),
            totalPurchaseCost: Number(row.totalCost),
            unitSellingPrice: Number(row.unitSellingPrice),
            supplierName: supplierName || "Direct Wholesale Drop",
            receiptReference: receiptRef || `MULTI-${Date.now().toString().slice(-4)}`,
            unitOfMeasure: row.unitOfMeasure,
            notes: row.notes || `Multi-stock batch item #${idx + 1}`,
            remainingPreviousBatch: Number(row.remainingPreviousBatch) || 0,
            spoilagePreviousBatch: Number(row.spoilagePreviousBatch) || 0,
            receivedDate: receivedTimestamp,
          },
          merchant
        );

        if (!primaryResult) primaryResult = res;
        if (res.closedBatch) {
          closedCount++;
          if (res.generatedSale) {
            totalRevenueGenerated += res.generatedSale.total_revenue;
          }
        }
      });

      const summary = `Multi-Item Restock Saved! Restocked ${multiRows.length} products (${merchant.currency} ${multiTotalCost.toLocaleString()}). ${
        closedCount > 0
          ? `Closed ${closedCount} active batches & proved +${merchant.currency} ${totalRevenueGenerated.toLocaleString()} past sales revenue!`
          : "Activated fresh baseline supply batches."
      }`;

      if (primaryResult) {
        onSuccess(primaryResult, summary);
      }
      onClose();
    }
  };

  return (
    <div
      id="restock-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="restock-modal-card"
        className="relative w-full max-w-2xl bg-[#18181b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Restock-Triggered Turnover</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
                  Auto-Sales Proof
                </span>
              </div>
              <p className="text-xs text-slate-400">Supply arrival proves past sales automatically</p>
            </div>
          </div>
          <button
            id="close-restock-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Single Item vs Several Items) */}
        <div className="px-5 pt-3 pb-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              id="restock-single-mode-tab"
              onClick={() => setMode("SINGLE")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === "SINGLE"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Single Item</span>
            </button>
            <button
              type="button"
              id="restock-multi-mode-tab"
              onClick={() => setMode("MULTI")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === "MULTI"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Several Items (Multi-Stock)</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  mode === "MULTI" ? "bg-emerald-800 text-emerald-100" : "bg-slate-800 text-slate-400"
                }`}
              >
                {multiRows.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-item restock closes all previous batches simultaneously</span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Evidential Date Picker */}
          <EvidentialDatePicker
            id="restock-evidential-date-picker"
            label="Stock Arrival Date & Time"
            sublabel="Vital evidential timestamp for calculating turnover velocity and inventory batch aging"
            value={receivedTimestamp}
            onChange={setReceivedTimestamp}
            accentColor="emerald"
          />

          {/* Shared Supplier & Reference Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supplier / Wholesaler Name
              </label>
              <input
                id="restock-supplier-name-input"
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Brookside, Khetias Wholesale, Unga Limited, Farmer"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Receipt / Invoice Reference (Optional)
              </label>
              <input
                id="restock-receipt-ref-input"
                type="text"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                placeholder="e.g. INV-84920, CASH-DROP"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SINGLE ITEM MODE */}
          {/* ========================================================================= */}
          {mode === "SINGLE" && (
            <div className="space-y-4">
              {/* Toggle Existing vs New Custom Item */}
              <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Arriving Item Type</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSingleIsCustom(false)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      !singleIsCustom
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Existing Inventory Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setSingleIsCustom(true)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      singleIsCustom
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    + New Custom Product
                  </button>
                </div>
              </div>

              {/* Item Selection / Input */}
              {!singleIsCustom ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Arriving Item
                  </label>
                  <SearchableItemPicker
                    id="restock-item-select"
                    items={items}
                    selectedItemId={selectedItemId}
                    onSelect={(item) => setSelectedItemId(item.id)}
                    onClear={() => setSelectedItemId("")}
                    currency={merchant.currency}
                    showPrice="selling"
                    placeholder="Type arriving product (e.g. S, M, T)..."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-indigo-300 mb-1">
                      New Item Name *
                    </label>
                    <input
                      type="text"
                      value={singleCustomName}
                      onChange={(e) => setSingleCustomName(e.target.value)}
                      placeholder="e.g. Soko Maize Flour 2kg"
                      required
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-300 mb-1">Category</label>
                    <select
                      value={singleCategory}
                      onChange={(e) => setSingleCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-300 mb-1">
                      Unit of Measure
                    </label>
                    <select
                      value={singleUnitOfMeasure}
                      onChange={(e) => setSingleUnitOfMeasure(e.target.value as UnitOfMeasure)}
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none capitalize"
                    >
                      {UNITS_OF_MEASURE.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Active Batch Turnover Visualizer */}
              {!singleIsCustom && singleActiveBatch ? (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      Active Batch #{singleActiveBatch.batch_number} Turnover Engine
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Started: {new Date(singleActiveBatch.received_at).toLocaleDateString()} (
                      {singleActiveBatch.initial_qty} {singleCurrentItem?.unit_of_measure})
                    </span>
                  </div>

                  {/* Retailer Shelf Remainder Input */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="text-xs font-bold text-amber-300 block">
                          Unsold Units Remaining on Shelf from Batch #{singleActiveBatch.batch_number}?
                        </label>
                        <p className="text-[10px] text-slate-400">
                          e.g., if you took 4 loaves previously and 2 are still on shelf today, enter 2.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSingleRemainingOnShelf(0)}
                          className={`px-2.5 py-1 text-[10px] font-semibold rounded border transition-colors ${
                            singleRemainingOnShelf === 0
                              ? "bg-emerald-600 text-white border-emerald-500"
                              : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          All Sold Out (0)
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={singleActiveBatch.initial_qty}
                          value={singleRemainingOnShelf}
                          onChange={(e) =>
                            setSingleRemainingOnShelf(
                              Math.max(
                                0,
                                Math.min(singleActiveBatch.initial_qty, parseFloat(e.target.value) || 0)
                              )
                            )
                          }
                          className="w-16 bg-slate-900 border border-amber-500/40 rounded px-2 py-1 text-xs text-amber-300 font-bold font-mono text-center focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Derived Sales Calculation Matrix */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                      <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                          Proven Sold
                        </span>
                        <span className="text-xs font-bold text-white font-mono">
                          {singleDerivedSold} {singleCurrentItem?.unit_of_measure}
                        </span>
                      </div>
                      <div className="bg-emerald-950/30 p-1.5 rounded border border-emerald-500/20">
                        <span className="text-[9px] text-emerald-400 uppercase tracking-wider block">
                          Realized Revenue
                        </span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          +{merchant.currency} {singleDerivedRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-teal-950/30 p-1.5 rounded border border-teal-500/20">
                        <span className="text-[9px] text-teal-300 uppercase tracking-wider block">
                          Gross Profit
                        </span>
                        <span className="text-xs font-bold text-teal-300 font-mono">
                          +{merchant.currency} {singleDerivedProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Initial Baseline Stock (Batch #1)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This will record Batch #1 for{" "}
                    {singleIsCustom ? singleCustomName || "this new item" : singleCurrentItem?.name || "this item"}
                    . When the next restock arrives, the system will automatically derive daily sales and
                    revenue from the turnover gap!
                  </p>
                </div>
              )}

              {/* Restock Quantities & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    New Incoming Qty ({singleIsCustom ? singleUnitOfMeasure : singleCurrentItem?.unit_of_measure || "units"})
                  </label>
                  <input
                    id="restock-qty-input"
                    type="number"
                    min="1"
                    step="any"
                    value={singleQty}
                    onChange={(e) => setSingleQty(Math.max(1, parseFloat(e.target.value) || 1))}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Total Wholesale Cost ({merchant.currency})
                  </label>
                  <input
                    id="restock-total-cost-input"
                    type="number"
                    min="0"
                    step="any"
                    value={singleTotalCost}
                    onChange={(e) => setSingleTotalCost(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">
                    Unit Selling Price ({merchant.currency})
                  </label>
                  <input
                    id="restock-unit-selling-input"
                    type="number"
                    min="0"
                    step="any"
                    value={singleSellingPrice}
                    onChange={(e) => setSingleSellingPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Spoilage & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Spoilage / Breakage (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={singleSpoilage}
                    onChange={(e) => setSingleSpoilage(parseFloat(e.target.value) || 0)}
                    placeholder="0 if none"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Delivery Notes / Memo
                  </label>
                  <input
                    type="text"
                    value={singleNotes}
                    onChange={(e) => setSingleNotes(e.target.value)}
                    placeholder="e.g. Received intact, morning drop"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Summary Bar */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Unit Cost vs Selling</span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {merchant.currency} {singleUnitCost} → {merchant.currency} {singleSellingPrice}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Expected Margin</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    +{merchant.currency} {singleExpectedProfit.toLocaleString()} (
                    {singleQty > 0 && singleSellingPrice > 0
                      ? ((singleUnitProfit / singleSellingPrice) * 100).toFixed(1)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MULTI-ITEM MODE (SEVERAL ITEMS - NEW & EXISTING) */}
          {/* ========================================================================= */}
          {mode === "MULTI" && (
            <div className="space-y-4">
              {/* Multi-Stock Action Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Arriving Multi-Item Restock List ({multiRows.length} Items)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="add-existing-restock-row-btn"
                    onClick={handleAddMultiRowExisting}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Existing Item</span>
                  </button>
                  <button
                    type="button"
                    id="add-new-custom-restock-row-btn"
                    onClick={handleAddMultiRowCustom}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+ New Product</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {multiRows.map((row, index) => {
                  const matchingActiveBatch =
                    !row.isCustom && row.itemId
                      ? batches.find((b) => b.item_id === row.itemId && b.status === "ACTIVE")
                      : undefined;

                  const prevInit = matchingActiveBatch ? matchingActiveBatch.initial_qty : 0;
                  const safeRem = Math.max(
                    0,
                    Math.min(prevInit, Number(row.remainingPreviousBatch) || 0)
                  );
                  const safeSp = Math.max(
                    0,
                    Math.min(prevInit - safeRem, Number(row.spoilagePreviousBatch) || 0)
                  );
                  const derivedSoldUnits = Math.max(0, prevInit - safeRem - safeSp);
                  const derivedRev = matchingActiveBatch
                    ? Number((derivedSoldUnits * matchingActiveBatch.unit_selling_price).toFixed(2))
                    : 0;
                  const derivedProf = matchingActiveBatch
                    ? Number(
                        (
                          derivedSoldUnits *
                          (matchingActiveBatch.unit_selling_price - matchingActiveBatch.unit_cost_price)
                        ).toFixed(2)
                      )
                    : 0;

                  const rowUnitCost =
                    row.qtyPurchased > 0
                      ? Number((Number(row.totalCost) / Number(row.qtyPurchased)).toFixed(2))
                      : 0;
                  const rowUnitProfit = Number((Number(row.unitSellingPrice) - rowUnitCost).toFixed(2));
                  const rowMarginPct =
                    Number(row.unitSellingPrice) > 0
                      ? Number(((rowUnitProfit / Number(row.unitSellingPrice)) * 100).toFixed(1))
                      : 0;

                  return (
                    <div
                      key={row.id}
                      className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-3 hover:border-slate-700 transition-colors"
                    >
                      {/* Row Top Bar: Item Index, Type Switcher & Actions */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-[240px]">
                            {row.itemName || (row.isCustom ? "New Custom Item" : "Select Item...")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.isCustom
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {row.isCustom ? "New Product" : "Existing Stock"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Type toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateMultiRow(row.id, {
                                isCustom: !row.isCustom,
                                itemName: !row.isCustom ? "" : items[0]?.name || "",
                              })
                            }
                            className="px-2 py-1 rounded text-[10px] font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
                            title="Toggle between Existing Item or New Product"
                          >
                            {row.isCustom ? "Switch to Existing" : "Switch to New"}
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            title="Duplicate this item"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemoveMultiRow(row.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
                            title="Remove this item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row Item Identity Controls */}
                      {!row.isCustom ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Select Existing Inventory Item
                            </label>
                            <SearchableItemPicker
                              id={`multi-item-picker-${row.id}`}
                              items={items}
                              selectedItemId={row.itemId || ""}
                              onSelect={(selected) =>
                                handleUpdateMultiRow(row.id, { itemId: selected.id })
                              }
                              onClear={() =>
                                handleUpdateMultiRow(row.id, {
                                  itemId: "",
                                  itemName: "",
                                  totalCost: 0,
                                  unitSellingPrice: 0,
                                })
                              }
                              currency={merchant.currency}
                              showPrice="selling"
                              compact
                              placeholder="Type product name (e.g. S, M, T)..."
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">
                              Category / Unit
                            </label>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                              <span className="truncate">{row.category}</span>
                              <span className="text-[10px] text-slate-500 font-mono uppercase">
                                {row.unitOfMeasure}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20">
                          <div>
                            <label className="block text-[11px] font-semibold text-indigo-300 mb-1">
                              New Product Name *
                            </label>
                            <input
                              type="text"
                              value={row.itemName}
                              onChange={(e) =>
                                handleUpdateMultiRow(row.id, { itemName: e.target.value })
                              }
                              placeholder="e.g. Royco Cubes 40s"
                              required
                              className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-indigo-300 mb-1">
                              Category
                            </label>
                            <select
                              value={row.category}
                              onChange={(e) =>
                                handleUpdateMultiRow(row.id, { category: e.target.value })
                              }
                              className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-indigo-300 mb-1">
                              Unit of Measure
                            </label>
                            <select
                              value={row.unitOfMeasure}
                              onChange={(e) =>
                                handleUpdateMultiRow(row.id, {
                                  unitOfMeasure: e.target.value as UnitOfMeasure,
                                })
                              }
                              className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none capitalize"
                            >
                              {UNITS_OF_MEASURE.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Active Batch Turnover Engine Box for Existing Items */}
                      {!row.isCustom && matchingActiveBatch ? (
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/30 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                              <Zap className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Active Batch #{matchingActiveBatch.batch_number} Turnover</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                (Initial: {matchingActiveBatch.initial_qty} {row.unitOfMeasure})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-amber-300 font-medium">
                                Left on Shelf:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateMultiRow(row.id, { remainingPreviousBatch: 0 })
                                }
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                                  row.remainingPreviousBatch === 0
                                    ? "bg-emerald-600 text-white border-emerald-500"
                                    : "bg-slate-900 text-slate-400 border-slate-700"
                                }`}
                              >
                                All Sold (0)
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={matchingActiveBatch.initial_qty}
                                value={row.remainingPreviousBatch}
                                onChange={(e) =>
                                  handleUpdateMultiRow(row.id, {
                                    remainingPreviousBatch: Math.max(
                                      0,
                                      Math.min(
                                        matchingActiveBatch.initial_qty,
                                        parseFloat(e.target.value) || 0
                                      )
                                    ),
                                  })
                                }
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded px-1.5 py-0.5 text-xs text-amber-300 font-bold font-mono text-center focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Quick Sales Realized Preview */}
                          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px]">
                            <div className="bg-slate-900 p-1 rounded">
                              <span className="text-slate-400 block">Proven Sold</span>
                              <span className="font-bold text-white font-mono">
                                {derivedSoldUnits} {row.unitOfMeasure}
                              </span>
                            </div>
                            <div className="bg-emerald-950/40 p-1 rounded text-emerald-400 font-mono">
                              <span className="text-emerald-500/80 block">Realized Revenue</span>
                              <span className="font-bold">
                                +{merchant.currency} {derivedRev.toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-teal-950/40 p-1 rounded text-teal-300 font-mono">
                              <span className="text-teal-400/80 block">Gross Profit</span>
                              <span className="font-bold">
                                +{merchant.currency} {derivedProf.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                            <Tag className="w-3 h-3 text-amber-400" />
                            Batch #1 Initial Stock
                          </span>
                          <span>Turnover velocity will calculate automatically on next restock</span>
                        </div>
                      )}

                      {/* Row Restock Pricing & Qty Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-300 mb-1">
                            Incoming Qty ({row.unitOfMeasure})
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={row.qtyPurchased}
                            onChange={(e) =>
                              handleUpdateMultiRow(row.id, {
                                qtyPurchased: Math.max(1, parseFloat(e.target.value) || 1),
                              })
                            }
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-300 mb-1">
                            Total Wholesale Cost ({merchant.currency})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.totalCost}
                            onChange={(e) =>
                              handleUpdateMultiRow(row.id, {
                                totalCost: parseFloat(e.target.value) || 0,
                              })
                            }
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-emerald-400 mb-1">
                            Unit Selling Price ({merchant.currency})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.unitSellingPrice}
                            onChange={(e) =>
                              handleUpdateMultiRow(row.id, {
                                unitSellingPrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            required
                            className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-bold font-mono focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">
                            Unit Cost & Margin
                          </label>
                          <div className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                            <span className="text-slate-400">@{merchant.currency} {rowUnitCost}</span>
                            <span className="text-emerald-400 font-bold">+{rowMarginPct}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Multi-Stock Aggregate Financial Overview Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    Multi-Item Restock Summary
                  </span>
                  <span className="font-mono text-slate-300">
                    {multiRows.length} Items · {multiTotalIncomingUnits} Units
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Wholesale Cost</span>
                    <span className="font-bold text-white font-mono">
                      {merchant.currency} {multiTotalCost.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 block">Proven Sales Realized</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      +{merchant.currency} {multiTotalRealizedRevenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-teal-950/40 border border-teal-500/20">
                    <span className="text-[10px] text-teal-300 block">Proven Gross Profit</span>
                    <span className="font-bold text-teal-300 font-mono">
                      +{merchant.currency} {multiTotalRealizedProfit.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Expected Margin</span>
                    <span className="font-bold text-slate-200 font-mono">
                      +{merchant.currency} {multiTotalExpectedProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors border border-slate-800"
            >
              Cancel
            </button>
            <button
              id="confirm-restock-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {mode === "SINGLE"
                  ? "Confirm Restock & Close Previous Batch"
                  : `Confirm Multi-Item Restock (${multiRows.length} Items)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
