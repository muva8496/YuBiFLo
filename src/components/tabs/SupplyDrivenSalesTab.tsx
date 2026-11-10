import React, { useState, useMemo } from "react";
import { 
  Truck, ArrowRight, CheckCircle2, ShieldCheck, 
  Package, DollarSign, Coffee, Sparkles, 
  TrendingUp, Clock, AlertTriangle, Layers, Building2,
  ChevronDown, ChevronUp, Zap, HelpCircle
} from "lucide-react";
import { 
  AlacioMasterState, 
  SupplierBatchCard, 
  BatchTurnoverItem 
} from "../../types/alacio";
import SupplierRestockBatchCardView from "../SupplierRestockBatchCardView";
import { buildAndEvaluateSupplierBatches } from "../../utils/supplierBatchSalesEngine";

interface SupplyDrivenSalesTabProps {
  state: AlacioMasterState;
  onCommitSupplyDrivenSale?: (payload: any) => void;
  onAuthorizeRestockSale?: (payload: any) => void;
  onDismissRestockCard?: (cardId: string) => void;
  onAuthorizeSupplierBatch?: (payload: {
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
  onDismissSupplierBatch?: (batchId: string) => void;
}

export default function SupplyDrivenSalesTab({ 
  state, 
  onCommitSupplyDrivenSale,
  onAuthorizeRestockSale,
  onDismissRestockCard,
  onAuthorizeSupplierBatch,
  onDismissSupplierBatch
}: SupplyDrivenSalesTabProps) {
  const { currency = "KSh", cash_register_balance, mpesa_float_balance } = state;
  const [filterMode, setFilterMode] = useState<"ALL" | "PENDING" | "AUTO_VALIDATED" | "RECONCILED">("ALL");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showFormulaExplanation, setShowFormulaExplanation] = useState<boolean>(false);

  // 1. Build and evaluate supplier batch cards with the 12-hour auto-validation rule
  const { batchCards, autoValidatedSales } = useMemo(() => {
    return buildAndEvaluateSupplierBatches(state);
  }, [state]);

  // Aggregate metrics
  const pendingCount = batchCards.filter((b) => b.status === "PENDING_AUTHORIZATION").length;
  const autoValidatedCount = batchCards.filter((b) => b.status === "AUTO_VALIDATED").length;
  const reconciledCount = batchCards.filter((b) => b.status === "AUTHORIZED_AND_RECONCILED").length;
  
  const totalTurnoverRevenue = batchCards.reduce((acc, b) => acc + (b.totalBatchRevenue || 0), 0);
  const totalTurnoverProfit = batchCards.reduce((acc, b) => acc + (b.totalBatchProfit || 0), 0);

  // Filtered list
  const filteredBatches = useMemo(() => {
    if (filterMode === "PENDING") {
      return batchCards.filter((b) => b.status === "PENDING_AUTHORIZATION");
    }
    if (filterMode === "AUTO_VALIDATED") {
      return batchCards.filter((b) => b.status === "AUTO_VALIDATED");
    }
    if (filterMode === "RECONCILED") {
      return batchCards.filter((b) => b.status === "AUTHORIZED_AND_RECONCILED");
    }
    return batchCards;
  }, [batchCards, filterMode]);

  const handleAuthorizeBatch = (payload: {
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
  }) => {
    if (onAuthorizeSupplierBatch) {
      onAuthorizeSupplierBatch(payload);
    } else if (onAuthorizeRestockSale) {
      // Fallback bridge for single items if supplier handler isn't passed
      payload.items.forEach((item) => {
        onAuthorizeRestockSale({
          cardId: `${payload.batchId}_${item.id}`,
          skuName: item.skuName,
          soldQty: item.calculatedSoldQty,
          revenue: item.calculatedRevenue,
          cogs: Math.round(item.calculatedSoldQty * item.unitCost * 100) / 100,
          ownerDrawingCost: Math.round(item.ownerUsedQty * item.unitCost * 100) / 100,
          spoilageLoss: Math.round(item.destroyedQty * item.unitCost * 100) / 100,
          ownerConsumedQty: item.ownerUsedQty,
          spoilageRejectsQty: item.destroyedQty,
          remainsOnShelf: 0,
          newBatchQty: item.batchQty,
          paymentMethod: payload.paymentMethod,
          salesDate: payload.salesDate,
          notes: payload.notes
        });
      });
    }

    setSuccessToast(`✓ Batch authorized for ${payload.supplierName}! Inflow of ${currency} ${payload.totalRevenue.toLocaleString()} posted to register.`);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 font-serif">
              <Truck className="text-emerald-400" size={26} /> 
              Sales &amp; Restock Batches
            </h2>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
              Automated Supplier Batches
            </span>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Clock size={10} /> 12-Hour Auto-Validation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Goods delivered under the same supplier appear together in one batch. You only answer two simple questions: 
            <strong className="text-slate-200"> did anything break/spoil?</strong> and <strong className="text-slate-200">did you or staff use any?</strong> The rest is automatically calculated as sold at retail price.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFormulaExplanation(!showFormulaExplanation)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <HelpCircle size={14} className="text-emerald-400" />
          <span>{showFormulaExplanation ? "Hide Rules" : "How Batches Work"}</span>
          {showFormulaExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* TOAST ALERT */}
      {successToast && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in font-mono shadow-xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* EXPLANATORY BANNER (COLLAPSIBLE) */}
      {showFormulaExplanation && (
        <div className="bg-[#0b1612] border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-emerald-950/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  The Alacio Automated Batch Formula
                </h3>
                <p className="text-[11px] text-slate-400">
                  Implied Sold = Batch Delivered Units &minus; (Destroyed + Owner Used)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              0-Typing Automation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#09090b] rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-blue-400 uppercase block font-bold">1. Grouped by Supplier</span>
              <div className="text-white font-bold text-xs sm:text-sm">LUX STORES, AGS, Broadway</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                All items on the delivery chit (e.g. 2 dzns BB 20g, 1 Fruta juice, 1 Top chips) stay together on one card instead of being scattered.
              </p>
            </div>

            <div className="p-3 bg-[#09090b] rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-amber-400 uppercase block font-bold">2. Two Simple Questions</span>
              <div className="text-amber-300 font-bold text-xs sm:text-sm">Destroyed? &amp; Owner Consumed?</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Click + or &minus; if any were spoiled or used for shop tea. The rest are automatically implied as counter customer sales.
              </p>
            </div>

            <div className="p-3 bg-[#09090b] rounded-xl border border-emerald-500/40 space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase block font-bold">3. 12-Hour Auto-Validation</span>
              <div className="text-emerald-300 font-bold text-xs sm:text-sm">Next drop = Auto-closed</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                If 12+ hours pass and the same supplier drops a new batch, the system automatically validates previous turnover without requiring counter typing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QUICK STATS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">Pending Batches</span>
            <span className="text-xl sm:text-2xl font-bold text-white font-mono mt-0.5 block">{pendingCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">Awaiting 1-click check</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Package size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold block">12h Auto-Validated</span>
            <span className="text-xl sm:text-2xl font-bold text-amber-300 font-mono mt-0.5 block">{autoValidatedCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">Closed by next delivery</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Zap size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">Batch Realized Sales</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">
              {currency} {totalTurnoverRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{batchCards.length} deliveries evaluated</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">Realized Profit</span>
            <span className="text-xl sm:text-2xl font-bold text-white font-mono mt-0.5 block">
              {currency} {totalTurnoverProfit.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Gross margin realized</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setFilterMode("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
              filterMode === "ALL"
                ? "bg-slate-800 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Batches ({batchCards.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
              filterMode === "PENDING"
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending Review ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("AUTO_VALIDATED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
              filterMode === "AUTO_VALIDATED"
                ? "bg-amber-600 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⚡ Auto-Validated ({autoValidatedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("RECONCILED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
              filterMode === "RECONCILED"
                ? "bg-emerald-600 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ✓ Reconciled ({reconciledCount})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
          <Clock size={13} className="text-amber-400" />
          <span>Rule: Batches &gt;12h with next drop auto-post sales</span>
        </div>
      </div>

      {/* BATCH CARDS LIST */}
      <div className="space-y-5">
        {filteredBatches.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <Package size={32} className="text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No batches match this filter</p>
            <p className="text-xs text-slate-500">
              When supplier invoices are uploaded or recorded in Purchases, they will appear here grouped by supplier.
            </p>
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <SupplierRestockBatchCardView
              key={batch.id}
              batch={batch}
              currency={currency}
              onAuthorizeBatch={handleAuthorizeBatch}
              onDismissBatch={onDismissSupplierBatch}
            />
          ))
        )}
      </div>
    </div>
  );
}
