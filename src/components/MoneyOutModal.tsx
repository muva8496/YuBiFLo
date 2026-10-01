import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Package,
  Store,
  DollarSign,
  Truck,
  Zap,
  Sparkles,
  Info,
  ShieldCheck,
  Plus,
  Trash2,
  Layers,
  ChevronDown,
  ArrowRight,
  ListPlus,
} from "lucide-react";
import { InventoryItem, Merchant, ExpenseCategory, SupplyBatch } from "../types";
import { RestockEngine, RestockResult } from "../services/restockEngine";
import { AppStorage } from "../services/storage";
import { SearchableItemPicker } from "./SearchableItemPicker";
import { EvidentialDatePicker } from "./EvidentialDatePicker";

interface MoneyOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant;
  items: InventoryItem[];
  onSuccess: (result: RestockResult | null, message: string) => void;
  initialItemId?: string;
}

interface MultiStockRow {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  unitOfMeasure: "units" | "crates" | "bales" | "packets" | "bottles" | "kg" | "sachets" | "tins" | "boxes";
  qtyPurchased: number;
  totalCost: number;
  unitSellingPrice: number;
  remainingPreviousBatch: number;
  spoilagePreviousBatch: number;
  isCustom: boolean;
}

export const MoneyOutModal: React.FC<MoneyOutModalProps> = ({
  isOpen,
  onClose,
  merchant,
  items,
  onSuccess,
  initialItemId,
}) => {
  const [expenseType, setExpenseType] = useState<"INVENTORY_PURCHASE" | "SHOP_EXPENSE">("INVENTORY_PURCHASE");
  const [stockMode, setStockMode] = useState<"SINGLE" | "MULTI">("SINGLE");
  const [expenseTimestamp, setExpenseTimestamp] = useState<string>(new Date().toISOString());

  // Single Item State
  const [itemSelectMode, setItemSelectMode] = useState<"DROPDOWN" | "SEARCH" | "CUSTOM">("DROPDOWN");
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId || "");
  const [isCustomItem, setIsCustomItem] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [category, setCategory] = useState("Dairy & Fresh");
  const [unitOfMeasure, setUnitOfMeasure] = useState<any>("packets");

  // Single Item Required Fields
  const [qtyPurchased, setQtyPurchased] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [unitSellingPrice, setUnitSellingPrice] = useState<number>(0);
  const [remainingOnShelf, setRemainingOnShelf] = useState<number>(0);
  const [spoilageQty, setSpoilageQty] = useState(0);

  // Multi-Stock List State
  const [multiRows, setMultiRows] = useState<MultiStockRow[]>([]);

  // Shared Fields
  const [supplierName, setSupplierName] = useState<string>("");
  const [receiptRef, setReceiptRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // General expense fields
  const [shopCategory, setShopCategory] = useState<ExpenseCategory>("ELECTRICITY_TOKENS");
  const [generalExpenseCost, setGeneralExpenseCost] = useState<number>(0);
  const [generalExpenseDesc, setGeneralExpenseDesc] = useState("");

  const batches = AppStorage.getBatches();

  // Initialize multi-stock rows when modal opens or items change
  const createDefaultMultiRow = (item?: InventoryItem, isNewCustom: boolean = false): MultiStockRow => {
    if (isNewCustom) {
      return {
        id: `mrow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: "",
        itemName: "",
        category: "General Goods",
        unitOfMeasure: "packets",
        qtyPurchased: 1,
        totalCost: 0,
        unitSellingPrice: 0,
        remainingPreviousBatch: 0,
        spoilagePreviousBatch: 0,
        isCustom: true,
      };
    }
    if (item) {
      return {
        id: `mrow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: item.id,
        itemName: item.name,
        category: item.category || "General Goods",
        unitOfMeasure: (item.unit_of_measure as any) || "units",
        qtyPurchased: 1,
        totalCost: Number(item.unit_cost_price || 0),
        unitSellingPrice: Number(item.unit_selling_price || 0),
        remainingPreviousBatch: 0,
        spoilagePreviousBatch: 0,
        isCustom: false,
      };
    }
    return {
      id: `mrow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: items[0]?.id || "",
      itemName: items[0]?.name || "",
      category: items[0]?.category || "General Goods",
      unitOfMeasure: (items[0]?.unit_of_measure as any) || "units",
      qtyPurchased: 1,
      totalCost: Number(items[0]?.unit_cost_price || 0),
      unitSellingPrice: Number(items[0]?.unit_selling_price || 0),
      remainingPreviousBatch: 0,
      spoilagePreviousBatch: 0,
      isCustom: false,
    };
  };

  // When initialItemId changes or items change
  useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
      setIsCustomItem(false);
      setItemSelectMode("DROPDOWN");
    } else if (items.length > 0 && !selectedItemId && !isCustomItem) {
      setSelectedItemId(items[0].id);
    }
  }, [initialItemId, items]);

  // When selected item changes in single mode, prefill selling price & cost
  useEffect(() => {
    if (!isCustomItem && selectedItemId) {
      const it = items.find((i) => i.id === selectedItemId);
      if (it) {
        setUnitSellingPrice(it.unit_selling_price ?? 0);
        setCategory(it.category || "General Goods");
        setUnitOfMeasure(it.unit_of_measure || "units");
        setTotalCost(it.unit_cost_price ? Number((it.unit_cost_price * Math.max(1, qtyPurchased)).toFixed(2)) : 0);
      }
    }
  }, [selectedItemId, isCustomItem]);

  // Initialize multi-rows if empty
  useEffect(() => {
    if (multiRows.length === 0 && items.length > 0) {
      setMultiRows([
        createDefaultMultiRow(items[0]),
        ...(items.length > 1 ? [createDefaultMultiRow(items[1])] : []),
      ]);
    }
  }, [items]);

  if (!isOpen) return null;

  // Active batch for selected single item
  const activeBatch = !isCustomItem
    ? batches.find((b) => b.item_id === selectedItemId && b.status === "ACTIVE")
    : undefined;

  // Single item auto-calculations
  const safeQty = Math.max(1, Number(qtyPurchased) || 1);
  const unitCostPrice = safeQty > 0 ? Number((Number(totalCost) / safeQty).toFixed(2)) : 0;
  const unitProfit = Number((Number(unitSellingPrice) - unitCostPrice).toFixed(2));
  const marginPercent =
    Number(unitSellingPrice) > 0 ? Number(((unitProfit / Number(unitSellingPrice)) * 100).toFixed(1)) : 0;
  const totalExpectedRevenue = Number((safeQty * Number(unitSellingPrice)).toFixed(2));
  const totalExpectedProfit = Number((totalExpectedRevenue - Number(totalCost)).toFixed(2));

  // Derived sales from previous batch (Single mode)
  const prevInitial = activeBatch ? activeBatch.initial_qty : 0;
  const safeRemaining = Math.max(0, Math.min(prevInitial, Number(remainingOnShelf) || 0));
  const safeSpoilage = Math.max(0, Math.min(prevInitial - safeRemaining, Number(spoilageQty) || 0));
  const derivedSold = Math.max(0, prevInitial - safeRemaining - safeSpoilage);
  const derivedRevenue = activeBatch ? Number((derivedSold * activeBatch.unit_selling_price).toFixed(2)) : 0;

  // Multi-Stock calculations
  const multiTotalCost = multiRows.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);
  const multiTotalExpectedRevenue = multiRows.reduce(
    (sum, r) => sum + (Number(r.qtyPurchased) || 0) * (Number(r.unitSellingPrice) || 0),
    0
  );
  const multiTotalProfit = multiTotalExpectedRevenue - multiTotalCost;
  const multiBlendedMargin =
    multiTotalExpectedRevenue > 0
      ? Number(((multiTotalProfit / multiTotalExpectedRevenue) * 100).toFixed(1))
      : 0;

  // Multi-Stock Row Handlers
  const handleAddMultiRow = () => {
    // Pick an item not already in rows if available
    const unusedItem = items.find((it) => !multiRows.some((r) => r.itemId === it.id)) || items[0];
    setMultiRows([...multiRows, createDefaultMultiRow(unusedItem, false)]);
  };

  const handleAddCustomMultiRow = () => {
    setMultiRows([...multiRows, createDefaultMultiRow(undefined, true)]);
  };

  const handleRemoveMultiRow = (id: string) => {
    if (multiRows.length <= 1) {
      alert("At least one stock item is required for multi-stock restock.");
      return;
    }
    setMultiRows(multiRows.filter((r) => r.id !== id));
  };

  const handleUpdateMultiRow = (id: string, updates: Partial<MultiStockRow>) => {
    setMultiRows(
      multiRows.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, ...updates };

        // If item was changed via dropdown
        if (updates.itemId && updates.itemId !== row.itemId) {
          const selectedIt = items.find((i) => i.id === updates.itemId);
          if (selectedIt) {
            updated.itemName = selectedIt.name;
            updated.category = selectedIt.category || "General Goods";
            updated.unitOfMeasure = (selectedIt.unit_of_measure as any) || "units";
            updated.unitSellingPrice = selectedIt.unit_selling_price || 0;
            updated.totalCost = Number(
              ((selectedIt.unit_cost_price || 0) * (updated.qtyPurchased || 1)).toFixed(2)
            );
            updated.isCustom = false;
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (expenseType === "INVENTORY_PURCHASE") {
      if (stockMode === "SINGLE") {
        // Single Item Restock Process
        const finalItemName =
          itemSelectMode === "CUSTOM" || isCustomItem
            ? customItemName.trim()
            : items.find((i) => i.id === selectedItemId)?.name || customItemName;

        if (!finalItemName) {
          alert("Please enter or select an item name.");
          return;
        }

        if (Number(totalCost) <= 0 || Number(qtyPurchased) <= 0) {
          alert("Please specify valid Quantity and Total Cost.");
          return;
        }

        const result = RestockEngine.processRestock(
          {
            itemId: itemSelectMode === "CUSTOM" || isCustomItem ? undefined : selectedItemId,
            itemName: finalItemName,
            category,
            quantityPurchased: Number(qtyPurchased),
            totalPurchaseCost: Number(totalCost),
            unitSellingPrice: Number(unitSellingPrice),
            supplierName: supplierName || "Direct Supplier",
            receiptReference: receiptRef,
            unitOfMeasure,
            notes,
            remainingPreviousBatch: safeRemaining,
            spoilagePreviousBatch: safeSpoilage,
            receivedDate: expenseTimestamp,
          },
          merchant
        );

        onSuccess(result, result.summaryMessage);
        onClose();
      } else {
        // Multi-Stock Restock Process
        if (multiRows.length === 0) {
          alert("Please add at least one stock item.");
          return;
        }

        for (let i = 0; i < multiRows.length; i++) {
          const row = multiRows[i];
          if (!row.itemName.trim()) {
            alert(`Stock item #${i + 1} is missing an item name.`);
            return;
          }
          if (Number(row.qtyPurchased) <= 0) {
            alert(`Stock item "${row.itemName}" requires a quantity greater than 0.`);
            return;
          }
          if (Number(row.totalCost) < 0) {
            alert(`Stock item "${row.itemName}" has an invalid total cost.`);
            return;
          }
        }

        let firstResult: RestockResult | null = null;
        let closedBatchesCount = 0;
        let totalRevenueInjected = 0;

        multiRows.forEach((row, index) => {
          const res = RestockEngine.processRestock(
            {
              itemId: row.isCustom ? undefined : row.itemId,
              itemName: row.itemName.trim(),
              category: row.category,
              quantityPurchased: Number(row.qtyPurchased),
              totalPurchaseCost: Number(row.totalCost),
              unitSellingPrice: Number(row.unitSellingPrice),
              supplierName: supplierName || "Wholesale Distributor Drop",
              receiptReference: receiptRef || `MULTI-${Date.now().toString().slice(-4)}`,
              unitOfMeasure: row.unitOfMeasure,
              notes: notes || `Multi-stock drop item #${index + 1}`,
              remainingPreviousBatch: Number(row.remainingPreviousBatch) || 0,
              spoilagePreviousBatch: Number(row.spoilagePreviousBatch) || 0,
              receivedDate: expenseTimestamp,
            },
            merchant
          );

          if (!firstResult) firstResult = res;
          if (res.closedBatch) {
            closedBatchesCount++;
            if (res.generatedSale) {
              totalRevenueInjected += res.generatedSale.total_revenue;
            }
          }
        });

        const summaryMsg = `Multi-Stock Restocked! Processed ${multiRows.length} items (${merchant.currency} ${multiTotalCost.toLocaleString()}). ${
          closedBatchesCount > 0
            ? `Closed ${closedBatchesCount} previous batch(es) and auto-injected ${merchant.currency} ${totalRevenueInjected.toLocaleString()} into sales ledger!`
            : "Activated new baseline batches."
        }`;

        onSuccess(firstResult, summaryMsg);
        onClose();
      }
    } else {
      // General shop expense logging
      const expenses = AppStorage.getExpenses();
      const expEntry = {
        id: `exp-${Date.now()}`,
        merchant_id: merchant.id,
        expense_type: "SHOP_EXPENSE" as const,
        category: shopCategory,
        total_cost: Number(generalExpenseCost),
        supplier_name: supplierName || "Utility / Service",
        receipt_reference: receiptRef,
        notes: generalExpenseDesc || `Shop expense: ${shopCategory}`,
        created_at: expenseTimestamp,
      };
      expenses.unshift(expEntry);
      AppStorage.saveExpenses(expenses);

      onSuccess(
        null,
        `Logged ${merchant.currency} ${Number(generalExpenseCost).toLocaleString()} under ${shopCategory.replace("_", " ")}.`
      );
      onClose();
    }
  };

  // Group items by category for the dropdown
  const categories = Array.from(new Set(items.map((i) => i.category || "General Goods"))).sort();

  return (
    <div
      id="money-out-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="money-out-modal-card"
        className={`relative w-full ${
          stockMode === "MULTI" && expenseType === "INVENTORY_PURCHASE" ? "max-w-4xl" : "max-w-xl"
        } bg-[#18181b] border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-6 transition-all duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Money Out</h2>
              <p className="text-xs text-slate-400">Supplier Stock Purchases & Operating Expenses</p>
            </div>
          </div>
          <button
            id="close-moneyout-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expense Type Selector Tabs */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setExpenseType("INVENTORY_PURCHASE")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              expenseType === "INVENTORY_PURCHASE"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stock Purchase (Auto-Sells Past Batch)</span>
          </button>
          <button
            type="button"
            onClick={() => setExpenseType("SHOP_EXPENSE")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              expenseType === "SHOP_EXPENSE"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Shop Expense (Tokens/Rent)</span>
          </button>
        </div>

        {/* Sub-Mode Selector: Single vs Multi-Stock (When Inventory Purchase is active) */}
        {expenseType === "INVENTORY_PURCHASE" && (
          <div className="px-5 pt-3 pb-0 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/30">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Purchase Format:</span>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  id="tab-single-stock"
                  onClick={() => setStockMode("SINGLE")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    stockMode === "SINGLE"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>Single Stock Item</span>
                </button>
                <button
                  type="button"
                  id="tab-multi-stock"
                  onClick={() => setStockMode("MULTI")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    stockMode === "MULTI"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ListPlus className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Multi-Stock Dropdown ({multiRows.length} items)</span>
                </button>
              </div>
            </div>

            {stockMode === "MULTI" && (
              <button
                type="button"
                id="add-multi-row-top-btn"
                onClick={handleAddMultiRow}
                className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1 mb-2 sm:mb-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Evidential Date Picker */}
          <EvidentialDatePicker
            id="money-out-evidential-date-picker"
            label={expenseType === "INVENTORY_PURCHASE" ? "Purchase & Stock Arrival Date" : "Expense Payment Date"}
            sublabel={
              expenseType === "INVENTORY_PURCHASE"
                ? "Accurate date enables automatic batch sales timing and cashflow growth calculation"
                : "Required evidential timestamp for accurate expense tracking and profit calculation"
            }
            value={expenseTimestamp}
            onChange={setExpenseTimestamp}
            accentColor={expenseType === "INVENTORY_PURCHASE" ? "emerald" : "indigo"}
          />

          {expenseType === "INVENTORY_PURCHASE" ? (
            <>
              {/* Mandatory UX Badge */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">✓ Updates Stock & Auto-Calculates Past Sales on Save</span>
                  <span className="text-[11px] text-emerald-400/80 leading-tight block mt-0.5">
                    Proves 100% turnover of the previous batch. Auto-injects revenue and profit into your sales ledger.
                  </span>
                </div>
              </div>

              {stockMode === "SINGLE" ? (
                /* SINGLE STOCK PURCHASE MODE */
                <>
                  {/* Item Selection with Dropdown, Search, or Custom toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Item Purchased <span className="text-red-400">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setItemSelectMode("DROPDOWN");
                            setIsCustomItem(false);
                          }}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            itemSelectMode === "DROPDOWN" && !isCustomItem
                              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Dropdown List
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemSelectMode("SEARCH");
                            setIsCustomItem(false);
                          }}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            itemSelectMode === "SEARCH" && !isCustomItem
                              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Search Picker
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemSelectMode("CUSTOM");
                            setIsCustomItem(true);
                          }}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            itemSelectMode === "CUSTOM" || isCustomItem
                              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                              : "text-emerald-400 hover:text-emerald-300"
                          }`}
                        >
                          + Custom Item
                        </button>
                      </div>
                    </div>

                    {itemSelectMode === "DROPDOWN" && !isCustomItem && (
                      <div className="relative">
                        <select
                          id="single-stock-item-dropdown"
                          value={selectedItemId}
                          onChange={(e) => {
                            if (e.target.value === "__NEW_CUSTOM_ITEM__") {
                              setIsCustomItem(true);
                              setItemSelectMode("CUSTOM");
                              setCustomItemName("");
                            } else {
                              setSelectedItemId(e.target.value);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-lg pl-3 pr-8 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 appearance-none font-medium"
                        >
                          <option value="__NEW_CUSTOM_ITEM__" className="bg-emerald-950 text-emerald-300 font-bold py-1">
                            ✨ + Add Brand New Item to Shop Catalog...
                          </option>
                          {categories.map((cat) => (
                            <optgroup key={cat} label={`📂 ${cat}`} className="bg-slate-950 text-slate-400 font-semibold">
                              {items
                                .filter((i) => (i.category || "General Goods") === cat)
                                .map((item) => (
                                  <option key={item.id} value={item.id} className="bg-slate-900 text-slate-100 py-1">
                                    {item.name} ({item.unit_of_measure}) — Stock: {item.current_stock_qty} | Sell: {merchant.currency} {item.unit_selling_price}
                                  </option>
                                ))}
                            </optgroup>
                          ))}
                          <option value="__NEW_CUSTOM_ITEM__" className="bg-emerald-950 text-emerald-300 font-bold py-1">
                            ✨ + Add Brand New Item to Shop Catalog...
                          </option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    )}

                    {itemSelectMode === "SEARCH" && !isCustomItem && (
                      <SearchableItemPicker
                        id="existing-item-select"
                        items={items}
                        selectedItemId={selectedItemId}
                        onSelect={(item) => setSelectedItemId(item.id)}
                        onClear={() => setSelectedItemId("")}
                        currency={merchant.currency}
                        showPrice="both"
                        placeholder="Type product name (e.g. S, M, T)..."
                      />
                    )}

                    {(itemSelectMode === "CUSTOM" || isCustomItem) && (
                      <div className="space-y-2 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Registering Brand New Catalog Item (Batch #1 Baseline)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomItem(false);
                              setItemSelectMode("DROPDOWN");
                            }}
                            className="text-[10px] text-slate-400 hover:text-emerald-300 underline"
                          >
                            ← Pick existing item
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-medium text-slate-400 mb-1">
                              New Item Name <span className="text-red-400">*</span>
                            </label>
                            <input
                              id="custom-item-name-input"
                              type="text"
                              placeholder="e.g. Royco Cubes 40s"
                              value={customItemName}
                              onChange={(e) => setCustomItemName(e.target.value)}
                              required
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1">
                              Category <span className="text-red-400">*</span>
                            </label>
                            <select
                              id="custom-item-category-select"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="Dairy & Fresh">Dairy & Fresh</option>
                              <option value="Grains & Flour">Grains & Flour</option>
                              <option value="Edibles & Fats">Edibles & Fats</option>
                              <option value="Bakery & Fresh">Bakery & Fresh</option>
                              <option value="Baking & Staples">Baking & Staples</option>
                              <option value="Poultry & Eggs">Poultry & Eggs</option>
                              <option value="Beverages & Soda">Beverages & Soda</option>
                              <option value="Home & Hygiene">Home & Hygiene</option>
                              <option value="Snacks & Confectionery">Snacks & Confectionery</option>
                              <option value="General Goods">General Goods</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1">
                              Unit of Measure
                            </label>
                            <select
                              value={unitOfMeasure}
                              onChange={(e) => setUnitOfMeasure(e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="packets">packets</option>
                              <option value="crates">crates</option>
                              <option value="bales">bales</option>
                              <option value="bottles">bottles</option>
                              <option value="boxes">boxes</option>
                              <option value="kg">kg</option>
                              <option value="sachets">sachets</option>
                              <option value="tins">tins</option>
                              <option value="units">units</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Core 3 Numbers: Quantity, Total Cost, Unit Selling Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Quantity Purchased <span className="text-red-400">*</span>
                      </label>
                      <div className="flex rounded-lg overflow-hidden border border-slate-800">
                        <input
                          id="moneyout-qty-input"
                          type="number"
                          min="1"
                          step="any"
                          value={qtyPurchased}
                          onChange={(e) => setQtyPurchased(Math.max(1, parseFloat(e.target.value) || 1))}
                          required
                          className="w-full bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                        />
                        <select
                          value={unitOfMeasure}
                          onChange={(e) => setUnitOfMeasure(e.target.value)}
                          className="bg-slate-950 px-2 text-[11px] text-slate-300 border-l border-slate-800 focus:outline-none"
                        >
                          <option value="packets">packets</option>
                          <option value="crates">crates</option>
                          <option value="bales">bales</option>
                          <option value="bottles">bottles</option>
                          <option value="boxes">boxes</option>
                          <option value="kg">kg</option>
                          <option value="units">units</option>
                        </select>
                      </div>
                    </div>

                    {/* Total Purchase Cost */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Total Purchase Cost ({merchant.currency}) <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="moneyout-total-cost-input"
                        type="number"
                        min="0"
                        step="any"
                        value={totalCost}
                        onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. 1200"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Total paid to supplier</span>
                    </div>

                    {/* Unit Selling Price */}
                    <div>
                      <label className="block text-xs font-semibold text-emerald-400 mb-1">
                        Unit Selling Price ({merchant.currency}) <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="moneyout-unit-selling-price-input"
                        type="number"
                        min="0"
                        step="any"
                        value={unitSellingPrice}
                        onChange={(e) => setUnitSellingPrice(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                        placeholder="e.g. 65"
                      />
                      <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Price charged to customer</span>
                    </div>
                  </div>

                  {/* Dynamic Calculations Panel */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-md bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Unit Cost Price</span>
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        {merchant.currency} {unitCostPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-md bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Profit Per Unit</span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          unitProfit >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {merchant.currency} {unitProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-md bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Expected Margin</span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          marginPercent >= 15 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {marginPercent}%
                      </span>
                    </div>
                    <div className="p-2 rounded-md bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total Batch Profit</span>
                      <span className="text-xs font-bold text-teal-300 font-mono">
                        {merchant.currency} {totalExpectedProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Shelf Turnover & Previous Batch Realization */}
                  {activeBatch ? (
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          Batch #{activeBatch.batch_number} Auto-Closing Turnover
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Started: {new Date(activeBatch.received_at).toLocaleDateString()} ({activeBatch.initial_qty}{" "}
                          {unitOfMeasure})
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-xs font-semibold text-amber-300 block">
                            Unsold Remaining on Shelf from Batch #{activeBatch.batch_number}?
                          </span>
                          <span className="text-[10px] text-slate-400">
                            e.g. If you took 4 loaves, and 2 are left today, enter 2. (2 sold = +{merchant.currency}{" "}
                            {derivedRevenue})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRemainingOnShelf(0)}
                            className={`px-2.5 py-1 text-[10px] font-semibold rounded border transition-colors ${
                              remainingOnShelf === 0
                                ? "bg-emerald-600 text-white border-emerald-500"
                                : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            All Sold (0)
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={activeBatch.initial_qty}
                            value={remainingOnShelf}
                            onChange={(e) =>
                              setRemainingOnShelf(
                                Math.max(0, Math.min(activeBatch.initial_qty, parseFloat(e.target.value) || 0))
                              )
                            }
                            className="w-16 bg-slate-950 border border-amber-500/40 rounded px-2 py-1 text-xs text-amber-300 font-bold font-mono text-center focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Derived Sales Calculation Matrix */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                            Realized Sales
                          </span>
                          <span className="text-xs font-bold text-white font-mono">
                            {derivedSold} {unitOfMeasure}
                          </span>
                        </div>
                        <div className="bg-emerald-950/30 p-1.5 rounded border border-emerald-500/20">
                          <span className="text-[9px] text-emerald-400 uppercase tracking-wider block">
                            Auto-Injected Revenue
                          </span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            +{merchant.currency} {derivedRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-teal-950/30 p-1.5 rounded border border-teal-500/20">
                          <span className="text-[9px] text-teal-300 uppercase tracking-wider block">
                            New Shelf Stock
                          </span>
                          <span className="text-xs font-bold text-teal-300 font-mono">
                            {safeQty + safeRemaining} {unitOfMeasure}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Establishing initial Batch #1 baseline. Turnover velocity begins with this receipt!</span>
                    </div>
                  )}
                </>
              ) : (
                /* MULTI-STOCK PURCHASE MODE */
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Multi-Stock Delivery Line Items</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Select existing stock or add brand new items directly from the dropdown.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="add-multi-row-btn"
                        onClick={handleAddMultiRow}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 shadow-sm transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>+ Existing Item</span>
                      </button>
                      <button
                        type="button"
                        id="add-custom-multi-row-btn"
                        onClick={handleAddCustomMultiRow}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                        <span>✨ + New Item</span>
                      </button>
                    </div>
                  </div>

                  {/* Multi-Stock Items Card List */}
                  <div className="space-y-3">
                    {multiRows.map((row, idx) => {
                      const rowBatch = batches.find((b) => b.item_id === row.itemId && b.status === "ACTIVE");
                      const rowQty = Math.max(1, Number(row.qtyPurchased) || 1);
                      const rowUnitCost = Number(((Number(row.totalCost) || 0) / rowQty).toFixed(2));
                      const rowProfitPerUnit = Number(((Number(row.unitSellingPrice) || 0) - rowUnitCost).toFixed(2));
                      const rowTotalProfit = Number(
                        ((Number(row.unitSellingPrice) || 0) * rowQty - (Number(row.totalCost) || 0)).toFixed(2)
                      );
                      const rowMargin =
                        Number(row.unitSellingPrice) > 0
                          ? Number(((rowProfitPerUnit / Number(row.unitSellingPrice)) * 100).toFixed(1))
                          : 0;

                      // Active Batch metrics for this row
                      const rowPrevInitial = rowBatch ? rowBatch.initial_qty : 0;
                      const rowRemaining = Math.max(0, Math.min(rowPrevInitial, Number(row.remainingPreviousBatch) || 0));
                      const rowDerivedSold = Math.max(0, rowPrevInitial - rowRemaining);
                      const rowDerivedRevenue = rowBatch ? rowDerivedSold * rowBatch.unit_selling_price : 0;

                      return (
                        <div
                          key={row.id}
                          id={`multi-row-${idx}`}
                          className={`p-3.5 rounded-xl border transition-colors space-y-3 ${
                            row.isCustom
                              ? "bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/50"
                              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {/* Row Header: Item Dropdown & Remove */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>

                              {row.isCustom ? (
                                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                      New Item
                                    </span>
                                    <input
                                      type="text"
                                      placeholder="Enter new item name (e.g. Royco Beef 40s)..."
                                      value={row.itemName}
                                      onChange={(e) =>
                                        handleUpdateMultiRow(row.id, { itemName: e.target.value })
                                      }
                                      required
                                      className="flex-1 bg-slate-950 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-medium"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={row.category}
                                      onChange={(e) => handleUpdateMultiRow(row.id, { category: e.target.value })}
                                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                                    >
                                      <option value="Dairy & Fresh">Dairy & Fresh</option>
                                      <option value="Grains & Flour">Grains & Flour</option>
                                      <option value="Edibles & Fats">Edibles & Fats</option>
                                      <option value="Bakery & Fresh">Bakery & Fresh</option>
                                      <option value="Baking & Staples">Baking & Staples</option>
                                      <option value="Poultry & Eggs">Poultry & Eggs</option>
                                      <option value="Beverages & Soda">Beverages & Soda</option>
                                      <option value="Home & Hygiene">Home & Hygiene</option>
                                      <option value="Snacks & Confectionery">Snacks & Confectionery</option>
                                      <option value="General Goods">General Goods</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateMultiRow(row.id, { isCustom: false, itemId: items[0]?.id, itemName: items[0]?.name })}
                                      className="text-[10px] text-slate-400 hover:text-emerald-300 underline whitespace-nowrap"
                                    >
                                      ← Existing list
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 relative">
                                  <select
                                    id={`multi-row-select-${idx}`}
                                    value={row.itemId}
                                    onChange={(e) => {
                                      if (e.target.value === "__NEW_CUSTOM__") {
                                        handleUpdateMultiRow(row.id, {
                                          isCustom: true,
                                          itemName: "",
                                          itemId: "",
                                          category: "General Goods",
                                          unitOfMeasure: "packets",
                                        });
                                      } else {
                                        handleUpdateMultiRow(row.id, { itemId: e.target.value });
                                      }
                                    }}
                                    className="w-full bg-slate-950 border border-slate-700 hover:border-emerald-500/60 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 appearance-none font-semibold cursor-pointer"
                                  >
                                    <option value="__NEW_CUSTOM__" className="bg-emerald-950 text-emerald-300 font-bold py-1">
                                      ✨ + Add Brand New Item to Catalog...
                                    </option>
                                    <option value="" disabled>
                                      -- Select Stock Item --
                                    </option>
                                    {categories.map((cat) => (
                                      <optgroup
                                        key={cat}
                                        label={`📂 ${cat}`}
                                        className="bg-slate-950 text-slate-400 font-semibold"
                                      >
                                        {items
                                          .filter((i) => (i.category || "General Goods") === cat)
                                          .map((item) => (
                                            <option key={item.id} value={item.id} className="bg-slate-900 text-white">
                                              {item.name} ({item.unit_of_measure}) — Stock: {item.current_stock_qty} | Sell: {merchant.currency} {item.unit_selling_price}
                                            </option>
                                          ))}
                                      </optgroup>
                                    ))}
                                    <option value="__NEW_CUSTOM__" className="bg-emerald-950 text-emerald-300 font-bold py-1">
                                      ✨ + Add Brand New Item to Catalog...
                                    </option>
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Profit Pill */}
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                  rowMargin >= 15
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                }`}
                              >
                                {rowMargin}% margin (+{merchant.currency} {rowTotalProfit.toLocaleString()})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMultiRow(row.id)}
                                title="Remove item"
                                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row Inputs: Quantity, Total Cost, Unit Selling Price */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Qty & UOM */}
                            <div>
                              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                Qty & Unit
                              </label>
                              <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
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
                                  className="w-full bg-transparent px-2.5 py-1 text-xs text-white focus:outline-none font-bold"
                                />
                                <select
                                  value={row.unitOfMeasure}
                                  onChange={(e) =>
                                    handleUpdateMultiRow(row.id, { unitOfMeasure: e.target.value as any })
                                  }
                                  className="bg-slate-900 px-2 text-[10px] text-slate-300 border-l border-slate-700 focus:outline-none"
                                >
                                  <option value="packets">packets</option>
                                  <option value="crates">crates</option>
                                  <option value="bales">bales</option>
                                  <option value="bottles">bottles</option>
                                  <option value="boxes">boxes</option>
                                  <option value="kg">kg</option>
                                  <option value="sachets">sachets</option>
                                  <option value="tins">tins</option>
                                  <option value="units">units</option>
                                </select>
                              </div>
                            </div>

                            {/* Total Cost */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[11px] font-medium text-slate-400">
                                  Total Cost ({merchant.currency})
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  @{merchant.currency} {rowUnitCost}
                                </span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.totalCost}
                                onChange={(e) =>
                                  handleUpdateMultiRow(row.id, {
                                    totalCost: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                required
                                placeholder="0"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                              />
                            </div>

                            {/* Unit Selling Price */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[11px] font-medium text-emerald-400">
                                  Selling Price / unit
                                </label>
                                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                  +{merchant.currency} {rowProfitPerUnit} profit
                                </span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.unitSellingPrice}
                                onChange={(e) =>
                                  handleUpdateMultiRow(row.id, {
                                    unitSellingPrice: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                required
                                placeholder="0"
                                className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                          </div>

                          {/* Previous Batch Turnover Drawer if active batch exists, or new item badge */}
                          {row.isCustom ? (
                            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-1.5 text-[11px] text-emerald-300">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Brand new product: Will be registered in your inventory list and tracked under Batch #1.</span>
                            </div>
                          ) : rowBatch ? (
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                                <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>
                                  Active Batch #{rowBatch.batch_number} ({rowBatch.initial_qty} {row.unitOfMeasure}):
                                </span>
                                <span className="text-emerald-400 font-bold font-mono">
                                  {rowDerivedSold} sold (+{merchant.currency} {rowDerivedRevenue.toLocaleString()})
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-amber-300">Left on shelf:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max={rowBatch.initial_qty}
                                  value={row.remainingPreviousBatch}
                                  onChange={(e) =>
                                    handleUpdateMultiRow(row.id, {
                                      remainingPreviousBatch: Math.max(
                                        0,
                                        Math.min(rowBatch.initial_qty, parseFloat(e.target.value) || 0)
                                      ),
                                    })
                                  }
                                  className="w-14 bg-slate-900 border border-amber-500/40 rounded px-1.5 py-0.5 text-amber-300 font-bold font-mono text-center text-xs focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateMultiRow(row.id, { remainingPreviousBatch: 0 })}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    row.remainingPreviousBatch === 0
                                      ? "bg-emerald-600 text-white border-emerald-500"
                                      : "bg-slate-900 text-slate-400 border-slate-700"
                                  }`}
                                >
                                  All Sold
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400">
                              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>Initial Batch #1 setup. Turnover velocity begins with this delivery.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Multi-Stock Aggregated Summary Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center shadow-lg">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total Items</span>
                      <span className="text-xs font-bold text-white font-mono">
                        {multiRows.length} Items
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Combined Total Cost</span>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {merchant.currency} {multiTotalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Projected Revenue</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {merchant.currency} {multiTotalExpectedRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Batch Profit ({multiBlendedMargin}%)</span>
                      <span className="text-xs font-bold text-teal-300 font-mono">
                        {merchant.currency} {multiTotalProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Supplier & Receipt Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Brookside Van, Khetias, Twiga"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Receipt / Invoice Ref #</label>
                  <input
                    type="text"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    placeholder="e.g. REC-9921 / INV-402"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Shop Operating Expense Form */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expense Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "ELECTRICITY_TOKENS", label: "KPLC Tokens", icon: Zap },
                    { id: "RENT", label: "Shop Rent", icon: Store },
                    { id: "TRANSPORT_BODA", label: "Boda / Transport", icon: Truck },
                    { id: "LICENSES_KANJO", label: "Kanjo Council", icon: ShieldCheck },
                    { id: "WAGES", label: "Staff Wages", icon: DollarSign },
                    { id: "OTHER", label: "Other Expense", icon: Info },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSel = shopCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setShopCategory(cat.id as ExpenseCategory)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                          isSel
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount Paid ({merchant.currency}) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={generalExpenseCost}
                  onChange={(e) => setGeneralExpenseCost(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. KPLC Prepaid, Landlord, Boda rider"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes / Token Meter #</label>
                <input
                  type="text"
                  value={generalExpenseDesc}
                  onChange={(e) => setGeneralExpenseDesc(e.target.value)}
                  placeholder="e.g. Meter # 37199201, 14.5 Units bought"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-slate-400 font-mono">
              {expenseType === "INVENTORY_PURCHASE" && (
                <span>
                  {stockMode === "SINGLE"
                    ? `Single Item: ${merchant.currency} ${(Number(totalCost) || 0).toLocaleString()}`
                    : `Multi-Stock (${multiRows.length} items): ${merchant.currency} ${multiTotalCost.toLocaleString()}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium transition-colors border border-slate-800"
              >
                Cancel
              </button>
              <button
                id="save-moneyout-submit-btn"
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {expenseType === "SHOP_EXPENSE"
                    ? "Save Operating Expense"
                    : stockMode === "MULTI"
                    ? `Save & Restock ${multiRows.length} Items`
                    : "Save & Trigger Sales Engine"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

