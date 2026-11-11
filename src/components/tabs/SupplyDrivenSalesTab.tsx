import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Truck, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, 
  Package, DollarSign, Coffee, Sparkles, 
  TrendingUp, Clock, AlertTriangle, Layers, Building2,
  ChevronDown, ChevronUp, Zap, HelpCircle, BookOpen,
  ChevronLeft, ChevronRight, RotateCcw, CheckSquare
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
  const { currency = "KSh" } = state;
  const [filterMode, setFilterMode] = useState<"ALL" | "JEREMIAH" | "PENDING" | "AUTO_VALIDATED" | "RECONCILED">("ALL");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showFormulaExplanation, setShowFormulaExplanation] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"BOOK_SWIPE" | "LIST_SPREAD">("BOOK_SWIPE");
  
  // Book Page Navigation State
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const touchStartXRef = useRef<number | null>(null);

  // 1. Build and evaluate supplier batch cards with consecutive matching and 12-hour rule
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
    if (filterMode === "JEREMIAH") {
      return batchCards.filter((b) => b.supplierName.toLowerCase().includes("jeremiah"));
    }
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

  // Clamp current page index when filtered batches change
  useEffect(() => {
    if (currentPageIndex >= filteredBatches.length) {
      setCurrentPageIndex(Math.max(0, filteredBatches.length - 1));
    }
  }, [filteredBatches.length, currentPageIndex]);

  // Handle Swipe Gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (diffX > 50) {
      // Swiped right -> go to previous (older) batch page
      goToPrevPage();
    } else if (diffX < -50) {
      // Swiped left -> go to next (newer) batch page
      goToNextPage();
    }
  };

  const goToPrevPage = () => {
    setCurrentPageIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPageIndex((prev) => Math.min(filteredBatches.length - 1, prev + 1));
  };

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
          remainsOnShelf: item.remainingOnShelf || 0,
          newBatchQty: item.batchQty,
          paymentMethod: payload.paymentMethod,
          salesDate: payload.salesDate,
          notes: payload.notes
        });
      });
    }

    setSuccessToast(`✓ Batch authorized for ${payload.supplierName}! Inflow of ${currency} ${payload.totalRevenue.toLocaleString()} credited to ${payload.salesDate} (Yesterday's Sales).`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const currentBatch = filteredBatches[currentPageIndex];

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Truck size={16} /> Supplier Delivery Batches
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">
              Displacement Turnover Rule
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-400 font-medium">
              12h Auto-Validation
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 font-serif">
            Wholesale Restock &amp; Sales Turnover Ledger
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed max-w-4xl">
            When a supplier (e.g. <strong>Jeremiah_bread</strong>) delivers a new batch, products that reappear prove the former batch was sold out to make space on the shelf. You only deduct <strong>older pieces remaining on shelf</strong>, <strong>spoiled/expired items</strong>, and <strong>items consumed by the owner</strong>. The realized sales are credited to <strong>yesterday&apos;s sales date</strong>!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {/* VIEW SWITCHER: BOOK SWIPE VS SPREAD */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode("BOOK_SWIPE")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "BOOK_SWIPE"
                  ? "bg-slate-800 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen size={13} />
              <span>Swipe Book</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST_SPREAD")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "LIST_SPREAD"
                  ? "bg-slate-800 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={13} />
              <span>All Spreads</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFormulaExplanation(!showFormulaExplanation)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition cursor-pointer"
          >
            <HelpCircle size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">{showFormulaExplanation ? "Hide Rules" : "How It Works"}</span>
          </button>
        </div>
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
                  The Alacio Bread &amp; Wholesaler Batch Formula
                </h3>
                <p className="text-[11px] text-slate-400">
                  Implied Sold = Delivered Units &minus; Remaining on Shelf &minus; Destroyed &minus; Owner Used
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              Continuous Displaced Velocity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#09090b] rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-blue-400 uppercase block font-bold">1. Same Wholesaler Consecutive Drop</span>
              <div className="text-white font-bold text-xs sm:text-sm">Jeremiah_bread (Nov 10 &rarr; Nov 11)</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Yesterday brought Supa Loaf White. Today brought Supa Loaf White again. That proves yesterday&apos;s loaves were cleared!
              </p>
            </div>

            <div className="p-3 bg-[#09090b] rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-amber-400 uppercase block font-bold">2. Unlocked vs Still On Shelf</span>
              <div className="text-amber-300 font-bold text-xs sm:text-sm">Only Re-dropped Items Unlocked</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                If Scones did not arrive in today&apos;s drop, they remain marked as active stock on the shelf awaiting their own replenishment.
              </p>
            </div>

            <div className="p-3 bg-[#09090b] rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-purple-400 uppercase block font-bold">3. Remaining Pieces &amp; Deductions</span>
              <div className="text-purple-300 font-bold text-xs sm:text-sm">Remaining Pieces stay in Stock</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Any older unsold pieces entered under &quot;Remaining on Shelf&quot; are kept in active inventory. Owner tea is logged as personal drawings.
              </p>
            </div>

            <div className="p-3 bg-[#09090b] rounded-xl border border-emerald-500/40 space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase block font-bold">4. Sales Attributed to Yesterday</span>
              <div className="text-emerald-300 font-bold text-xs sm:text-sm">Yesterday&apos;s Sales Ledger</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Turnover is attributed to the date the batch cleared (Yesterday, Nov 10), keeping your daily revenue journals physically accurate.
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
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 flex-wrap">
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
            onClick={() => setFilterMode("JEREMIAH")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
              filterMode === "JEREMIAH"
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🥖 Jeremiah_bread Batches
          </button>

          <button
            type="button"
            onClick={() => setFilterMode("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
              filterMode === "PENDING"
                ? "bg-slate-800 text-blue-300 font-bold"
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

        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <BookOpen size={13} className="text-emerald-400" />
          <span>Batches sorted chronologically &bull; Swipe or click arrow to flip</span>
        </div>
      </div>

      {/* BOOK SWIPE VIEW MODE */}
      {viewMode === "BOOK_SWIPE" ? (
        <div 
          className="space-y-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {filteredBatches.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <Package size={32} className="text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No batches in this view</p>
              <p className="text-xs text-slate-500">Select &apos;All Batches&apos; to view deliveries.</p>
            </div>
          ) : (
            <>
              {/* BOOK CHAPTERS / TIMELINE TABS RIBBON */}
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  {filteredBatches.map((b, idx) => {
                    const isSelected = idx === currentPageIndex;
                    return (
                      <button
                        key={b.id || idx}
                        type="button"
                        onClick={() => setCurrentPageIndex(idx)}
                        className={`px-3 py-2 rounded-xl text-xs font-mono text-left transition cursor-pointer border ${
                          isSelected
                            ? "bg-slate-800 border-emerald-500/50 text-white font-bold shadow-md"
                            : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>Page {idx + 1}</span>
                          <span>&bull;</span>
                          <span>{b.deliveredDate}</span>
                        </div>
                        <div className="font-bold truncate max-w-[140px] text-slate-200 mt-0.5">
                          {b.supplierName} #{b.batchNumber}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* FLIP CONTROLS */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={goToPrevPage}
                    disabled={currentPageIndex === 0}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none border border-slate-700 cursor-pointer flex items-center gap-1 text-xs font-mono"
                    title="Swipe / flip to older batch"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Older Batch</span>
                  </button>

                  <div className="text-xs font-mono text-slate-400 px-2 text-center min-w-[70px]">
                    <span className="font-bold text-white">{currentPageIndex + 1}</span> of {filteredBatches.length}
                  </div>

                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={currentPageIndex === filteredBatches.length - 1}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none border border-slate-700 cursor-pointer flex items-center gap-1 text-xs font-mono"
                    title="Swipe / flip to newer batch"
                  >
                    <span className="hidden sm:inline">Newer Batch</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* ACTIVE BOOK PAGE (CARD) */}
              {currentBatch && (
                <div className="relative">
                  {/* BOOK BINDING DECORATION */}
                  <div className="absolute -left-1 top-6 bottom-6 w-1 bg-emerald-500/40 rounded-l shadow-lg pointer-events-none" />

                  <SupplierRestockBatchCardView
                    key={currentBatch.id}
                    batch={currentBatch}
                    currency={currency}
                    onAuthorizeBatch={handleAuthorizeBatch}
                    onDismissBatch={onDismissSupplierBatch}
                  />
                </div>
              )}

              {/* BOOK FOOTER NAVIGATION HELPER */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-2 pt-1">
                <span>&larr; Older deliveries stay bound in logbook history</span>
                <span>Tip: You can swipe left/right on touchscreens to flip pages &rarr;</span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ALL SPREADS VIEW MODE (LIST ALL BATCHES VERTICALLY) */
        <div className="space-y-5">
          {filteredBatches.map((batch) => (
            <SupplierRestockBatchCardView
              key={batch.id}
              batch={batch}
              currency={currency}
              onAuthorizeBatch={handleAuthorizeBatch}
              onDismissBatch={onDismissSupplierBatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
