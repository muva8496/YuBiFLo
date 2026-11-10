import React, { useState } from "react";
import { 
  Building2, CheckCircle2, AlertCircle, Sparkles, 
  Trash2, Coffee, ShieldCheck, ChevronDown, ChevronUp,
  DollarSign, ArrowRight, Check, Clock, Package, AlertTriangle
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
  // Local editable items state (only asking for destroyed and used by user)
  const [items, setItems] = useState<BatchTurnoverItem[]>(batch.items);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MPESA" | "SPLIT">(batch.paymentMethod || "CASH");
  const [salesDate, setSalesDate] = useState<string>(batch.deliveredDate || new Date().toISOString().slice(0, 10));
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);

  // Update item question counts (destroyed or owner used)
  const handleItemCountChange = (itemId: string, field: "destroyedQty" | "ownerUsedQty", deltaOrValue: number, isAbsolute = false) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        let nextVal = isAbsolute ? deltaOrValue : item[field] + deltaOrValue;
        if (nextVal < 0) nextVal = 0;
        if (nextVal > item.batchQty) nextVal = item.batchQty;

        const updated = { ...item, [field]: nextVal };
        const otherField = field === "destroyedQty" ? "ownerUsedQty" : "destroyedQty";
        const totalNonSold = updated[field] + updated[otherField];
        
        updated.calculatedSoldQty = Math.max(0, item.batchQty - totalNonSold);
        updated.calculatedRevenue = Math.round(updated.calculatedSoldQty * item.unitRetail * 100) / 100;
        updated.calculatedProfit = Math.round((updated.calculatedRevenue - (updated.calculatedSoldQty * item.unitCost)) * 100) / 100;

        return updated;
      })
    );
  };

  const totalBatchUnits = items.reduce((sum, i) => sum + i.batchQty, 0);
  const totalBatchCost = Math.round(items.reduce((sum, i) => sum + (i.batchQty * i.unitCost), 0) * 100) / 100;
  const totalBatchRevenue = Math.round(items.reduce((sum, i) => sum + i.calculatedRevenue, 0) * 100) / 100;
  const totalBatchProfit = Math.round(items.reduce((sum, i) => sum + i.calculatedProfit, 0) * 100) / 100;
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
      salesDate,
      notes: `Batch turnover authorized for ${batch.supplierName} (Batch #${batch.batchNumber}). ${items.length} goods reconciled.`
    });
    setTimeout(() => setIsAuthorizing(false), 500);
  };

  return (
    <div className={`rounded-2xl border transition-all shadow-md overflow-hidden ${
      isAutoValidated
        ? "bg-slate-900 border-amber-500/50"
        : isReconciled
        ? "bg-slate-900 border-emerald-500/40 opacity-95"
        : "bg-slate-900 border-blue-500/40 hover:border-blue-400"
    }`}>
      {/* BATCH HEADER */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
            isAutoValidated
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : isReconciled
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "bg-blue-500/20 text-blue-300 border-blue-500/40"
          }`}>
            <Building2 size={22} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                isAutoValidated
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                  : isReconciled
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-blue-500/20 text-blue-300 border-blue-500/40"
              }`}>
                {isAutoValidated 
                  ? "⚡ Auto-Validated (12h Rule)" 
                  : isReconciled 
                  ? "✓ Authorized & Reconciled" 
                  : "⚡ Pending Batch Validation"}
              </span>

              <span className="text-xs font-mono text-slate-400">
                Delivery Note #{batch.batchNumber}
              </span>

              {batch.hoursElapsed > 0 && (
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock size={11} className="text-slate-500" />
                  {batch.hoursElapsed}h since drop
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
              <span>{batch.supplierName}</span>
              <span className="text-xs font-normal text-slate-400 font-mono">
                ({items.length} goods arrived together in this batch)
              </span>
            </h3>

            {isAutoValidated && batch.autoValidatedReason && (
              <p className="text-xs text-amber-300/90 font-mono mt-1 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <span>{batch.autoValidatedReason}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Batch Sales Inflow</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {currency} {totalBatchRevenue.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="text-[11px]">{isExpanded ? "Collapse" : "Open Batch"}</span>
          </button>
        </div>
      </div>

      {/* EXPANDED CONTENT: GOODS APPEARING TOGETHER UNDER THIS SUPPLIER */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="text-xs text-slate-300 font-medium flex items-center justify-between border-b border-slate-800 pb-2">
            <span>
              All goods delivered under <strong>{batch.supplierName}</strong> on {batch.deliveredDate}:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Only enter destroyed goods or owner Kadogo tea &bull; Sales calculate automatically
            </span>
          </div>

          {/* TABLE / CARDS OF GOODS IN THIS SUPPLIER BATCH */}
          <div className="space-y-3">
            {items.map((item, idx) => {
              return (
                <div 
                  key={item.id || idx}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* GOOD INFO */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-white text-sm truncate">
                        {item.skuName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1 pl-7">
                      <span>Batch Delivered: <strong className="text-slate-200">{item.batchQty} {item.unitType}</strong></span>
                      <span>Wholesale: <strong className="text-blue-300">{currency} {item.unitCost}</strong></span>
                      <span>Shelf Retail: <strong className="text-emerald-300">{currency} {item.unitRetail}</strong></span>
                    </div>
                  </div>

                  {/* SIMPLE QUESTIONS: (1) DESTROYED? (2) USED BY USER? */}
                  <div className="flex items-center gap-4 shrink-0 flex-wrap pl-7 md:pl-0">
                    {/* QUESTION 1: DESTROYED / DAMAGED */}
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-rose-900/40 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-rose-300 block flex items-center gap-1">
                        <Trash2 size={11} /> Destroyed / Expired
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
                          className="w-12 text-center py-0.5 bg-slate-800 text-rose-300 font-mono font-bold rounded text-xs border border-rose-800/40"
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

                    {/* QUESTION 2: USED BY USER / PROPRIETOR TEA */}
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-purple-900/40 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-purple-300 block flex items-center gap-1">
                        <Coffee size={11} /> Used by User / Chai
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
                          className="w-12 text-center py-0.5 bg-slate-800 text-purple-300 font-mono font-bold rounded text-xs border border-purple-800/40"
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

                    {/* AUTOMATED CALCULATION CALLOUT */}
                    <div className="text-right font-mono min-w-[120px]">
                      <span className="text-[10px] text-slate-400 block">Sold: <strong className="text-white">{item.calculatedSoldQty} {item.unitType}</strong></span>
                      <span className="text-xs font-bold text-emerald-400 block">
                        {currency} {item.calculatedRevenue.toLocaleString()}
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

          {/* BATCH FOOTER: TOTAL INFLOW, PROFIT, AND 1-CLICK AUTHORIZATION */}
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
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Batch Summary</span>
                <div className="text-xs font-mono text-slate-200">
                  Total Sold: <strong className="text-white">{items.reduce((s, i) => s + i.calculatedSoldQty, 0)} units</strong> &bull; Margin: <strong className="text-emerald-400">+{currency} {totalBatchProfit.toLocaleString()} ({batchMarkup}%)</strong>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div>
              {isPending && (
                <button
                  type="button"
                  disabled={isAuthorizing}
                  onClick={handleAuthorizeClick}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  <Check size={16} />
                  <span>Authorize Batch Sales ({currency} {totalBatchRevenue.toLocaleString()})</span>
                </button>
              )}

              {isAutoValidated && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300 font-mono font-bold bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30">
                    ⚡ Auto-Validated &bull; Sales Inflow Added
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
                  <span>Sales Inflow of {currency} {totalBatchRevenue.toLocaleString()} Recorded</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
