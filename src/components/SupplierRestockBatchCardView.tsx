import React, { useState } from "react";
import { 
  Building2, CheckCircle2, AlertCircle, Sparkles, 
  Trash2, Coffee, ShieldCheck, ChevronDown, ChevronUp,
  DollarSign, ArrowRight, Check, Clock, Package, AlertTriangle,
  RotateCcw, Calendar, CheckSquare
} from "lucide-react";
import { SupplierBatchCard, BatchTurnoverItem } from "../types/alacio";

interface SupplierRestockBatchCardViewProps {
  key?: React.Key;
  batch: SupplierBatchCard;
  currency?: string;
  onAuthorizeBatch: (payload: {
    batchId: string;
    supplierName: string;
    batchNumber: string;
    deliveredDate: string;
    items: BatchTurnoverItem[];
    totalRevenue: number;
    totalProfit: number;
    paymentMethod: "CASH" | "MPESA" | "SPLIT";
    salesDate: string;
    notes?: string;
  }) => void;
  onDismissBatch?: (batchId: string) => void;
}

export default function SupplierRestockBatchCardView({
  batch,
  currency = "KSh",
  onAuthorizeBatch,
  onDismissBatch
}: SupplierRestockBatchCardViewProps) {
  // Local editable items state (older remaining on shelf, destroyed, used by user)
  const [items, setItems] = useState<BatchTurnoverItem[]>(batch.items);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MPESA" | "SPLIT">(batch.paymentMethod || "CASH");
  // The sales date defaults to the batch's delivered date (e.g. yesterday)
  const [salesDate, setSalesDate] = useState<string>(batch.deliveredDate);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);

  // Update item counts (remainingOnShelf, destroyedQty, ownerUsedQty)
  const handleItemCountChange = (
    itemId: string, 
    field: "remainingOnShelf" | "destroyedQty" | "ownerUsedQty", 
    deltaOrValue: number, 
    isAbsolute = false
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        let nextVal = isAbsolute ? deltaOrValue : (item[field] || 0) + deltaOrValue;
        if (nextVal < 0) nextVal = 0;
        if (nextVal > item.batchQty) nextVal = item.batchQty;

        const updated = { ...item, [field]: nextVal };
        const nonSold = (updated.remainingOnShelf || 0) + (updated.destroyedQty || 0) + (updated.ownerUsedQty || 0);
        
        // Ensure nonSold does not exceed batch quantity
        if (nonSold > item.batchQty) {
          updated[field] = Math.max(0, item.batchQty - (nonSold - nextVal));
        }

        const effectiveNonSold = (updated.remainingOnShelf || 0) + (updated.destroyedQty || 0) + (updated.ownerUsedQty || 0);
        updated.calculatedSoldQty = Math.max(0, item.batchQty - effectiveNonSold);
        updated.calculatedRevenue = Math.round(updated.calculatedSoldQty * item.unitRetail * 100) / 100;
        updated.calculatedProfit = Math.round((updated.calculatedRevenue - (updated.calculatedSoldQty * item.unitCost)) * 100) / 100;

        return updated;
      })
    );
  };

  const totalBatchUnits = items.reduce((sum, i) => sum + i.batchQty, 0);
  const totalBatchCost = Math.round(items.reduce((sum, i) => sum + (i.batchQty * i.unitCost), 0) * 100) / 100;
  
  // Calculate realized revenue from items that actually reappeared in the later delivery
  const unlockedItems = items.filter((i) => i.reappearedInLaterBatch);
  const pendingShelfItems = items.filter((i) => !i.reappearedInLaterBatch);

  const totalBatchRevenue = Math.round(unlockedItems.reduce((sum, i) => sum + i.calculatedRevenue, 0) * 100) / 100;
  const totalBatchProfit = Math.round(unlockedItems.reduce((sum, i) => sum + i.calculatedProfit, 0) * 100) / 100;
  const totalRemainingUnits = items.reduce((sum, i) => sum + (i.remainingOnShelf || 0), 0);
  const totalSoldUnits = unlockedItems.reduce((sum, i) => sum + i.calculatedSoldQty, 0);
  const batchMarkup = totalBatchCost > 0 ? Math.round((totalBatchProfit / totalBatchCost) * 1000) / 10 : 0;

  const isPending = batch.status === "PENDING_AUTHORIZATION";
  const isAutoValidated = batch.status === "AUTO_VALIDATED";
  const isReconciled = batch.status === "AUTHORIZED_AND_RECONCILED";

  const handleAuthorizeClick = () => {
    setIsAuthorizing(true);
    onAuthorizeBatch({
      batchId: batch.id,
      supplierName: batch.supplierName,
      batchNumber: batch.batchNumber,
      deliveredDate: batch.deliveredDate,
      items,
      totalRevenue: totalBatchRevenue,
      totalProfit: totalBatchProfit,
      paymentMethod,
      salesDate: salesDate || batch.deliveredDate,
      notes: `Batch turnover for ${batch.supplierName} (Note #${batch.batchNumber}, delivered ${batch.deliveredDate}). ${totalSoldUnits} units sold, ${totalRemainingUnits} carried in inventory.`
    });
    setTimeout(() => setIsAuthorizing(false), 500);
  };

  return (
    <div className={`rounded-2xl border transition-all shadow-md overflow-hidden ${
      isAutoValidated
        ? "bg-slate-900 border-amber-500/50"
        : isReconciled
        ? "bg-slate-900 border-emerald-500/40 opacity-95"
        : "bg-slate-900 border-slate-700/80 hover:border-slate-600"
    }`}>
      {/* BATCH HEADER */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
            isAutoValidated
              ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
              : isReconciled
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
              : "bg-slate-800 text-slate-300 border-slate-700"
          }`}>
            <Building2 size={22} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="font-bold text-white uppercase tracking-wider">
                {batch.supplierName}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                Chit #{batch.batchNumber}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-medium">
                Delivered: {batch.deliveredDate}
              </span>

              {batch.hasLaterBatchFromSameSupplier && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="text-blue-400 font-bold">
                    Followed by Drop #{batch.laterBatchNumber} ({batch.laterBatchDate})
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`text-[11px] font-mono font-medium ${
                isAutoValidated
                  ? "text-amber-400 font-bold"
                  : isReconciled
                  ? "text-emerald-400 font-bold"
                  : "text-blue-400"
              }`}>
                {isAutoValidated 
                  ? "⚡ Auto-Validated (Displaced by Next Drop)" 
                  : isReconciled 
                  ? "✓ Authorized & Reconciled" 
                  : batch.hasLaterBatchFromSameSupplier
                  ? "⚡ Replenishment Arrived · Ready for Turnover Validation"
                  : "Current Active Shelf Batch"}
              </span>

              {batch.hoursElapsed > 0 && (
                <span className="text-[11px] font-mono text-slate-500">
                  ({batch.hoursElapsed}h elapsed)
                </span>
              )}
            </div>

            {isAutoValidated && batch.autoValidatedReason && (
              <p className="text-xs text-amber-300 font-mono mt-1 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <span>{batch.autoValidatedReason}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Realized Sales Inflow
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              {currency} {totalBatchRevenue.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="text-[11px] hidden sm:inline">{isExpanded ? "Collapse" : "Open"}</span>
          </button>
        </div>
      </div>

      {/* EXPANDED CONTENT: GOODS IN THIS SUPPLIER BATCH */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="text-xs text-slate-300 font-medium flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
            <div>
              <span>Delivery batch from <strong>{batch.supplierName}</strong> on <strong>{batch.deliveredDate}</strong></span>
              <span className="text-slate-500 mx-1.5">·</span>
              <span className="text-emerald-400 font-mono font-semibold">
                Sales credited to: {batch.deliveredDate} (Yesterday&apos;s Sales)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Remaining pieces add back to active stock
            </div>
          </div>

          {/* GOODS LIST */}
          <div className="space-y-3">
            {/* 1. UNLOCKED GOODS THAT REAPPEARED IN THE LATER BATCH */}
            {unlockedItems.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                  <CheckSquare size={13} />
                  <span>
                    Replenished Goods ({unlockedItems.length} Products arrived again in later drop — Confirm Turnover):
                  </span>
                </div>

                {unlockedItems.map((item, idx) => {
                  return (
                    <div 
                      key={item.id || idx}
                      className="p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
                    >
                      {/* GOOD DETAILS */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="font-bold text-white text-sm truncate">
                            {item.skuName}
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Displaced &amp; Replenished
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono mt-1.5 pl-7">
                          <span>Batch Received: <strong className="text-slate-200">{item.batchQty} {item.unitType}</strong></span>
                          <span>·</span>
                          <span>Cost: <strong className="text-blue-300">{currency} {item.unitCost}</strong></span>
                          <span>·</span>
                          <span>Retail: <strong className="text-emerald-300">{currency} {item.unitRetail}</strong></span>
                        </div>
                      </div>

                      {/* 3 USER INPUT CONTROLS: REMAINING, SPOILT, USED */}
                      <div className="flex items-center gap-3 shrink-0 flex-wrap pl-7 lg:pl-0">
                        {/* CONTROL 1: OLDER PIECES LEFT ON SHELF */}
                        <div className="bg-slate-900 p-2 rounded-xl border border-blue-900/40 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-blue-300 block flex items-center gap-1">
                            <RotateCcw size={11} /> Remaining On Shelf
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleItemCountChange(item.id, "remainingOnShelf", -1)}
                              disabled={isReconciled || (item.remainingOnShelf || 0) <= 0}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={item.batchQty}
                              value={item.remainingOnShelf || 0}
                              readOnly={isReconciled}
                              onChange={(e) => handleItemCountChange(item.id, "remainingOnShelf", parseInt(e.target.value, 10) || 0, true)}
                              className="w-11 text-center py-0.5 bg-slate-800 text-blue-300 font-mono font-bold rounded text-xs border border-blue-800/40"
                            />
                            <button
                              type="button"
                              onClick={() => handleItemCountChange(item.id, "remainingOnShelf", 1)}
                              disabled={isReconciled || (item.remainingOnShelf || 0) >= item.batchQty}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* CONTROL 2: SPOILT / DAMAGED / EXPIRED */}
                        <div className="bg-slate-900 p-2 rounded-xl border border-rose-900/40 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-rose-300 block flex items-center gap-1">
                            <Trash2 size={11} /> Spoilt / Destroyed
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleItemCountChange(item.id, "destroyedQty", -1)}
                              disabled={isReconciled || item.destroyedQty <= 0}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={item.batchQty}
                              value={item.destroyedQty}
                              readOnly={isReconciled}
                              onChange={(e) => handleItemCountChange(item.id, "destroyedQty", parseInt(e.target.value, 10) || 0, true)}
                              className="w-11 text-center py-0.5 bg-slate-800 text-rose-300 font-mono font-bold rounded text-xs border border-rose-800/40"
                            />
                            <button
                              type="button"
                              onClick={() => handleItemCountChange(item.id, "destroyedQty", 1)}
                              disabled={isReconciled || item.destroyedQty >= item.batchQty}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* CONTROL 3: USED BY USER / PROPRIETOR TEA */}
                        <div className="bg-slate-900 p-2 rounded-xl border border-purple-900/40 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-purple-300 block flex items-center gap-1">
                            <Coffee size={11} /> Used / Chai
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleItemCountChange(item.id, "ownerUsedQty", -1)}
                              disabled={isReconciled || item.ownerUsedQty <= 0}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={item.batchQty}
                              value={item.ownerUsedQty}
                              readOnly={isReconciled}
                              onChange={(e) => handleItemCountChange(item.id, "ownerUsedQty", parseInt(e.target.value, 10) || 0, true)}
                              className="w-11 text-center py-0.5 bg-slate-800 text-purple-300 font-mono font-bold rounded text-xs border border-purple-800/40"
                            />
                            <button
                              type="button"
                              onClick={() => handleItemCountChange(item.id, "ownerUsedQty", 1)}
                              disabled={isReconciled || item.ownerUsedQty >= item.batchQty}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* REALIZED RESULT */}
                        <div className="text-right font-mono min-w-[110px] pl-2 border-l border-slate-700">
                          <span className="text-[11px] text-slate-400 block">
                            Sold: <strong className="text-white">{item.calculatedSoldQty} {item.unitType}</strong>
                          </span>
                          <span className="text-xs font-bold text-emerald-400 block">
                            +{currency} {item.calculatedRevenue.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Profit: +{currency} {item.calculatedProfit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. GOODS NOT YET REPLENISHED IN LATER BATCH */}
            {pendingShelfItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                  <Package size={13} className="text-slate-500" />
                  <span>
                    Goods Still Active on Shelf ({pendingShelfItems.length} Products — not yet replenished in subsequent delivery):
                  </span>
                </div>

                {pendingShelfItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center shrink-0">
                        •
                      </span>
                      <div>
                        <span className="font-semibold text-slate-300">{item.skuName}</span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Delivered: {item.batchQty} {item.unitType} @ {currency} {item.unitCost} cost
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
                      Still on shelf &bull; Pending next drop note from {batch.supplierName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BATCH FOOTER: PAYMENT RAIL, REALIZED SALES DATE, 1-CLICK AUTHORIZE */}
          <div className="pt-3 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Payment Rail</span>
                <select
                  value={paymentMethod}
                  disabled={isReconciled}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono cursor-pointer"
                >
                  <option value="CASH">💵 Cash Drawer</option>
                  <option value="MPESA">📱 Lipa na M-Pesa</option>
                  <option value="SPLIT">⚖️ 50/50 Split</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Realized Sales Date</span>
                <input
                  type="date"
                  value={salesDate}
                  disabled={isReconciled}
                  onChange={(e) => setSalesDate(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono cursor-pointer"
                />
              </div>

              <div className="border-l border-slate-800 pl-4">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Reconciliation Totals</span>
                <div className="text-xs font-mono text-slate-200">
                  Sold: <strong className="text-white">{totalSoldUnits} units</strong>
                  <span className="text-slate-500 mx-1">·</span>
                  Kept in stock: <strong className="text-blue-300">{totalRemainingUnits} units</strong>
                  <span className="text-slate-500 mx-1">·</span>
                  Gross Margin: <strong className="text-emerald-400">+{currency} {totalBatchProfit.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div>
              {isPending && (
                <button
                  type="button"
                  disabled={isAuthorizing || totalBatchRevenue === 0}
                  onClick={handleAuthorizeClick}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-40"
                >
                  <Check size={16} />
                  <span>Authorize Batch Sales ({currency} {totalBatchRevenue.toLocaleString()})</span>
                </button>
              )}

              {isAutoValidated && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300 font-mono font-bold bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30">
                    ⚡ Auto-Validated · Sales Posted to {batch.deliveredDate}
                  </span>
                  <button
                    type="button"
                    onClick={handleAuthorizeClick}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono cursor-pointer border border-slate-700"
                    title="Review or adjust counts"
                  >
                    Adjust Counts
                  </button>
                </div>
              )}

              {isReconciled && (
                <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>Inflow of {currency} {totalBatchRevenue.toLocaleString()} Recorded in {salesDate}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
