import React, { useState } from "react";
import { 
  Sparkles, CheckCircle2, AlertCircle, ShoppingBag, 
  Coffee, Trash2, ArrowRight, DollarSign, Calendar, 
  Check, Info, ChevronDown, ChevronUp, Layers, Flame, RefreshCw
} from "lucide-react";
import { RestockReconciliationCard } from "../types/alacio";

interface RestockSalesReconciliationCardProps {
  key?: React.Key;
  card: RestockReconciliationCard;
  currency?: string;
  onAuthorize: (payload: {
    cardId: string;
    skuName: string;
    soldQty: number;
    revenue: number;
    cogs: number;
    ownerDrawingCost: number;
    spoilageLoss: number;
    ownerConsumedQty: number;
    spoilageRejectsQty: number;
    remainsOnShelf: number;
    newBatchQty: number;
    paymentMethod: "CASH" | "MPESA" | "SPLIT";
    salesDate: string;
    notes?: string;
  }) => void;
  onDismiss?: (cardId: string) => void;
}

export default function RestockSalesReconciliationCardView({
  card,
  currency = "KSh",
  onAuthorize,
  onDismiss
}: RestockSalesReconciliationCardProps) {
  // Input fields for reconciliation with business terms
  const [remains, setRemains] = useState<number>(card.remainsOnShelf ?? 1);
  const [ownerConsumed, setOwnerConsumed] = useState<number>(card.ownerConsumedQty ?? 1);
  const [spoilage, setSpoilage] = useState<number>(card.spoilageRejectsQty ?? 0);
  const [giveaways, setGiveaways] = useState<number>(card.giveawaysQty ?? 0);
  const [retailPrice, setRetailPrice] = useState<number>(card.unitRetailPrice || 60);
  const [costPrice, setCostPrice] = useState<number>(card.unitCost || 50);
  
  // Date selection with backdating support
  const todayIso = new Date().toISOString().slice(0, 10);
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgoIso = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(yesterdayIso);
  const [customDate, setCustomDate] = useState<string>(yesterdayIso);
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MPESA" | "SPLIT">(card.paymentMethod || "CASH");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [authorizing, setAuthorizing] = useState<boolean>(false);

  // Mathematical core
  const previousBatch = card.previousBatchQty;
  const nonSaleOutflows = remains + ownerConsumed + spoilage + giveaways;
  const calculatedSold = Math.max(0, previousBatch - nonSaleOutflows);
  
  const revenue = calculatedSold * retailPrice;
  const cogs = calculatedSold * costPrice;
  const grossProfit = revenue - cogs;
  const ownerDrawingCost = ownerConsumed * costPrice;
  const spoilageLoss = spoilage * costPrice;

  const isReconciled = card.status === "AUTHORIZED_AND_RECONCILED";

  const handleDatePreset = (dateVal: string) => {
    setSelectedDate(dateVal);
    setIsCustomDate(false);
  };

  const handleCustomDateChange = (val: string) => {
    setCustomDate(val);
    setSelectedDate(val);
  };

  const handleAuthorizeClick = () => {
    setAuthorizing(true);
    onAuthorize({
      cardId: card.id,
      skuName: card.skuName,
      soldQty: calculatedSold,
      revenue,
      cogs,
      ownerDrawingCost,
      spoilageLoss,
      ownerConsumedQty: ownerConsumed,
      spoilageRejectsQty: spoilage,
      remainsOnShelf: remains,
      newBatchQty: card.newBatchQty,
      paymentMethod,
      salesDate: selectedDate,
      notes: `Restock turnover authorized. Previous batch (${previousBatch} ${card.unitType}): ${calculatedSold} sold, ${remains} remaining, ${ownerConsumed} owner chai/drawing, ${spoilage} rejects.`
    });
    setTimeout(() => setAuthorizing(false), 600);
  };

  return (
    <div className={`rounded-2xl border transition shadow-lg overflow-hidden ${
      isReconciled 
        ? "bg-[#091512] border-emerald-500/40" 
        : "bg-[#0e1622] border-amber-500/50 hover:border-amber-400"
    }`}>
      {/* CARD HEADER */}
      <div className="p-4 sm:p-5 border-b border-[#1b2b3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isReconciled 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
          }`}>
            {isReconciled ? <CheckCircle2 size={22} /> : <Flame size={22} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                isReconciled 
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" 
                  : "bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse"
              }`}>
                {isReconciled ? "✓ Authorized & Reconciled" : "⚡ Restock Implied Sales Card"}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {card.category}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
              {card.skuName}
              {card.piecesPerPack && card.piecesPerPack > 1 && (
                <span className="text-xs font-mono text-amber-300/90 font-normal">
                  ({card.piecesPerPack} pcs per {card.unitType.replace(/s$/, "")})
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Restock arrived today &bull; <strong className="text-slate-200">Bringing this in today means yesterday&apos;s batch has moved!</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isReconciled && (
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
              +{currency} {card.calculatedRevenue.toLocaleString()} Authorized
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-[#142334] hover:bg-[#1a2f45] text-slate-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
            title="Toggle details"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="text-[11px]">{isExpanded ? "Collapse" : "Open Card"}</span>
          </button>
        </div>
      </div>

      {/* BATCH COMPARISON STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#0a1018] border-b border-[#1b2b3d] text-xs font-mono">
        <div className="p-2.5 bg-[#121c28] rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-bold uppercase">Previous Delivery</span>
          <div className="text-white font-bold text-sm mt-0.5">
            {previousBatch} {card.unitType}
            {card.piecesPerPack ? ` (${previousBatch * card.piecesPerPack} pcs)` : ""}
          </div>
          <span className="text-[10px] text-amber-400/80 block mt-0.5 truncate">{card.previousBatchDate}</span>
        </div>

        <div className="p-2.5 bg-[#121c28] rounded-xl border border-slate-800">
          <span className="text-[10px] text-emerald-400 block font-bold uppercase">New Batch Today</span>
          <div className="text-white font-bold text-sm mt-0.5">
            +{card.newBatchQty} {card.unitType}
            {card.piecesPerPack ? ` (${card.newBatchQty * card.piecesPerPack} pcs)` : ""}
          </div>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5 truncate">{card.supplierName}</span>
        </div>

        <div className="p-2.5 bg-[#121c28] rounded-xl border border-slate-800">
          <span className="text-[10px] text-cyan-400 block font-bold uppercase">Calculated Sold</span>
          <div className="text-cyan-300 font-bold text-sm mt-0.5">
            {calculatedSold} {card.unitType}
            {card.piecesPerPack ? ` (${calculatedSold * card.piecesPerPack} pcs)` : ""}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Implied turnover</span>
        </div>

        <div className="p-2.5 bg-[#121c28] rounded-xl border border-slate-800">
          <span className="text-[10px] text-amber-300 block font-bold uppercase">Crystallized Revenue</span>
          <div className="text-amber-300 font-bold text-sm mt-0.5">
            {currency} {revenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Profit: +{currency} {grossProfit.toLocaleString()}</span>
        </div>
      </div>

      {/* CARD BODY: RECONCILIATION QUESTIONS (BUSINESS TERMS) */}
      {isExpanded && !isReconciled && (
        <div className="p-4 sm:p-5 space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
            <Info size={16} className="shrink-0 text-amber-400" />
            <span>
              <strong>Reconciliation Rule:</strong> Enter what happened to yesterday&apos;s <strong>{previousBatch} {card.unitType}</strong> before this morning&apos;s delivery. The system automatically deduces sales, protects owner drawings from cash gap leaks, and updates shelf inventory.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* INPUT 1: CLOSING STOCK / REMAINS */}
            <div className="bg-[#121e2c] border border-slate-700/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-cyan-400" />
                  1. Unsold Shelf Remains
                </label>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                  Closing Stock
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Unsold packets still sitting on the shelf when the new supply van arrived:
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRemains(Math.max(0, remains - 1))}
                  className="w-8 h-8 rounded-lg bg-[#182738] hover:bg-[#20344a] text-white font-bold border border-slate-700 flex items-center justify-center cursor-pointer text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={previousBatch}
                  value={remains}
                  onChange={(e) => setRemains(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-center bg-[#091018] border border-slate-700 text-white font-bold font-mono py-1 rounded-lg focus:outline-none focus:border-cyan-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setRemains(Math.min(previousBatch, remains + 1))}
                  className="w-8 h-8 rounded-lg bg-[#182738] hover:bg-[#20344a] text-white font-bold border border-slate-700 flex items-center justify-center cursor-pointer text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block text-center">
                {card.piecesPerPack ? `${remains * card.piecesPerPack} pcs carried forward` : `${remains} ${card.unitType}`}
              </span>
            </div>

            {/* INPUT 2: OWNER / STAFF DRAWINGS */}
            <div className="bg-[#121e2c] border border-slate-700/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Coffee size={14} className="text-amber-400" />
                  2. Proprietor &amp; Staff Eaten
                </label>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                  Owner Drawing
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                What the owner ate, breakfast chai, or staff food (logged as drawing, not cash loss):
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOwnerConsumed(Math.max(0, ownerConsumed - 1))}
                  className="w-8 h-8 rounded-lg bg-[#182738] hover:bg-[#20344a] text-white font-bold border border-slate-700 flex items-center justify-center cursor-pointer text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={previousBatch}
                  value={ownerConsumed}
                  onChange={(e) => setOwnerConsumed(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-center bg-[#091018] border border-slate-700 text-amber-300 font-bold font-mono py-1 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setOwnerConsumed(Math.min(previousBatch, ownerConsumed + 1))}
                  className="w-8 h-8 rounded-lg bg-[#182738] hover:bg-[#20344a] text-white font-bold border border-slate-700 flex items-center justify-center cursor-pointer text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block text-center">
                Cost: {currency} {ownerDrawingCost.toLocaleString()} (Drawings)
              </span>
            </div>

            {/* INPUT 3: SPOILAGE & REJECTS */}
            <div className="bg-[#121e2c] border border-slate-700/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Trash2 size={14} className="text-rose-400" />
                  3. Spoilage &amp; Rejects
                </label>
                <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
                  Shrinkage Write-off
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Stale, broken, punctured or rejected units discarded:
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSpoilage(Math.max(0, spoilage - 1))}
                  className="w-8 h-8 rounded-lg bg-[#182738] hover:bg-[#20344a] text-white font-bold border border-slate-700 flex items-center justify-center cursor-pointer text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={previousBatch}
                  value={spoilage}
                  onChange={(e) => setSpoilage(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-center bg-[#091018] border border-slate-700 text-rose-300 font-bold font-mono py-1 rounded-lg focus:outline-none focus:border-rose-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSpoilage(Math.min(previousBatch, spoilage + 1))}
                  className="w-8 h-8 rounded-lg bg-[#182738] hover:bg-[#20344a] text-white font-bold border border-slate-700 flex items-center justify-center cursor-pointer text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block text-center">
                Loss: {currency} {spoilageLoss.toLocaleString()} (Expense)
              </span>
            </div>

            {/* INPUT 4: GIVEAWAYS & SAMPLES */}
            <div className="bg-[#121e2c] border border-slate-700/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-400" />
                  4. Free Samples / Goodwill
                </label>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800">
                  Promotional
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Customer tasting or goodwill gifts given over the counter:
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGiveaways(Math.max(0, giveaways - 1))}
                  className="w-8 h-8 rounded-lg bg-[#182738] hover:bg-[#20344a] text-white font-bold border border-slate-700 flex items-center justify-center cursor-pointer text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={previousBatch}
                  value={giveaways}
                  onChange={(e) => setGiveaways(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-center bg-[#091018] border border-slate-700 text-purple-300 font-bold font-mono py-1 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setGiveaways(Math.min(previousBatch, giveaways + 1))}
                  className="w-8 h-8 rounded-lg bg-[#182738] hover:bg-[#20344a] text-white font-bold border border-slate-700 flex items-center justify-center cursor-pointer text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block text-center">
                {giveaways} {card.unitType} gifted
              </span>
            </div>
          </div>

          {/* PRICING & PAYMENT & DATE CONTROLS */}
          <div className="p-4 bg-[#09121a] rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PRICING */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign size={14} className="text-amber-400" />
                Selling Price per {card.unitType.replace(/s$/, "")}:
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">{currency}</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#121d2a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <span className="text-[10px] text-slate-400">
                Wholesale cost was {currency} {costPrice} (Margin: {currency} {(retailPrice - costPrice).toFixed(1)})
              </span>
            </div>

            {/* PAYMENT REVENUE CHANNEL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                Channel of Sales Collection:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold font-mono border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMethod === "CASH" 
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow" 
                      : "bg-[#121d2a] text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  💵 Cash Drawer
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("MPESA")}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold font-mono border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMethod === "MPESA" 
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow" 
                      : "bg-[#121d2a] text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  📱 M-Pesa Till
                </button>
              </div>
              <span className="text-[10px] text-slate-400">
                Where the {currency} {revenue.toLocaleString()} from sales was kept
              </span>
            </div>

            {/* DATE OF SALES (BACKDATING / YESTERDAY / LAST WEEK) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-400" />
                Date of Realized Sales:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDatePreset(yesterdayIso)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold border cursor-pointer ${
                    selectedDate === yesterdayIso && !isCustomDate
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-[#121d2a] text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset(todayIso)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold border cursor-pointer ${
                    selectedDate === todayIso && !isCustomDate
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-[#121d2a] text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset(twoDaysAgoIso)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold border cursor-pointer ${
                    selectedDate === twoDaysAgoIso && !isCustomDate
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-[#121d2a] text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  2 Days Ago
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomDate(true)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold border cursor-pointer ${
                    isCustomDate
                      ? "bg-cyan-500 text-slate-950 border-cyan-400"
                      : "bg-[#121d2a] text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  Custom Date
                </button>
              </div>

              {isCustomDate ? (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="w-full mt-1 bg-[#121d2a] border border-cyan-500 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none"
                />
              ) : (
                <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                  Operating Date: {selectedDate}
                </span>
              )}
            </div>
          </div>

          {/* DEDUCTION SUMMARY & AUTHORIZATION BAR */}
          <div className="bg-[#0b1724] border-2 border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                  Reconciliation Equation:
                </span>
                <span className="text-xs font-mono text-white font-bold bg-[#14263a] px-2 py-0.5 rounded border border-slate-700">
                  {previousBatch} (delivered) &minus; {nonSaleOutflows} (remains/eaten/rejects) = {calculatedSold} {card.unitType} Sold
                </span>
              </div>
              <div className="text-[11px] text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                <span>Revenue: <strong className="text-white font-mono">{currency} {revenue.toLocaleString()}</strong></span>
                <span>COGS: <strong className="text-slate-400 font-mono">{currency} {cogs.toLocaleString()}</strong></span>
                <span>Profit: <strong className="text-emerald-400 font-mono">+{currency} {grossProfit.toLocaleString()}</strong></span>
                {ownerConsumed > 0 && (
                  <span>Owner Drawing: <strong className="text-amber-300 font-mono">{currency} {ownerDrawingCost.toLocaleString()}</strong></span>
                )}
                <span>New Shelf Stock: <strong className="text-cyan-300 font-mono">{remains + card.newBatchQty} {card.unitType}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onDismiss && (
                <button
                  type="button"
                  onClick={() => onDismiss(card.id)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-[#142334] border border-slate-700 hover:border-slate-600 cursor-pointer"
                >
                  Dismiss
                </button>
              )}
              <button
                type="button"
                disabled={authorizing || calculatedSold < 0}
                onClick={handleAuthorizeClick}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm font-mono shadow-xl flex items-center gap-2 cursor-pointer transition transform active:scale-95 disabled:opacity-50"
              >
                {authorizing ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>
                  Authorize &amp; Record {calculatedSold} {card.unitType} Sold ({currency} {revenue.toLocaleString()})
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECONCILED AUDIT SUMMARY */}
      {isReconciled && (
        <div className="p-4 sm:p-5 bg-[#091512] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>
                Sales authorized on {card.authorizedDate || "recorded date"} &bull; Transferred to ledger as verified walk-in turnover.
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Audited at {card.authorizedAt || "Today"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-[#0e201b] rounded-xl border border-emerald-900/60">
              <span className="text-[10px] text-emerald-400 block font-bold uppercase">Units Sold &amp; Paid</span>
              <div className="text-white font-bold text-sm mt-0.5">{card.calculatedSoldQty} {card.unitType}</div>
              <span className="text-[10px] text-slate-400">Via {card.paymentMethod || "CASH"}</span>
            </div>
            <div className="p-2.5 bg-[#0e201b] rounded-xl border border-emerald-900/60">
              <span className="text-[10px] text-emerald-400 block font-bold uppercase">Revenue Deposited</span>
              <div className="text-emerald-300 font-bold text-sm mt-0.5">{currency} {card.calculatedRevenue.toLocaleString()}</div>
              <span className="text-[10px] text-slate-400">Profit: +{currency} {card.calculatedGrossProfit.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-[#0e201b] rounded-xl border border-emerald-900/60">
              <span className="text-[10px] text-amber-300 block font-bold uppercase">Owner Drawing Protected</span>
              <div className="text-amber-300 font-bold text-sm mt-0.5">{currency} {card.calculatedOwnerDrawing.toLocaleString()}</div>
              <span className="text-[10px] text-slate-400">{card.ownerConsumedQty} {card.unitType} chai/food</span>
            </div>
            <div className="p-2.5 bg-[#0e201b] rounded-xl border border-emerald-900/60">
              <span className="text-[10px] text-cyan-300 block font-bold uppercase">Live Shelf Balance</span>
              <div className="text-cyan-300 font-bold text-sm mt-0.5">{card.remainsOnShelf + card.newBatchQty} {card.unitType}</div>
              <span className="text-[10px] text-slate-400">{card.remainsOnShelf} old + {card.newBatchQty} restocked</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
