import React, { useState } from "react";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  History,
  Info,
  Smartphone,
  Coins,
  CreditCard,
  UserCheck,
  Landmark,
  Clock,
} from "lucide-react";
import {
  InventoryItem,
  Merchant,
  ReconciliationRecord,
  SupplyBatch,
} from "../types";
import { ReverseAuditEngine, ItemAuditInput } from "../services/reverseAuditEngine";
import { GeminiApiService, AILeakageResponse } from "../services/api";
import ReconciliationScreen from "./ReconciliationScreen";

interface ReconciliationViewProps {
  merchant: Merchant;
  items: InventoryItem[];
  batches: SupplyBatch[];
  reconciliations: ReconciliationRecord[];
  onAuditComplete: (record: ReconciliationRecord) => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  merchant,
  items,
  batches,
  reconciliations,
  onAuditComplete,
}) => {
  const [auditDate, setAuditDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Form states for items: Opening, Incoming, Counted Ending
  const [itemAuditStates, setItemAuditStates] = useState<{
    [itemId: string]: { opening: number; incoming: number; ending: number };
  }>(() => {
    const map: { [itemId: string]: { opening: number; incoming: number; ending: number } } = {};
    items.forEach((item) => {
      // Find incoming supply today or in active batches
      const activeB = batches.filter(
        (b) => b.item_id === item.id && b.status === "ACTIVE"
      );
      const incoming = activeB.reduce((acc, b) => acc + b.initial_qty, 0);
      const opening = Math.max(0, item.current_stock_qty);
      // default ending assumption for fast entry
      map[item.id] = {
        opening: opening || 24,
        incoming: incoming || 0,
        ending: Math.max(0, Math.floor((opening + incoming) * 0.3)), // simulated ending count
      };
    });
    return map;
  });

  // Collections across Equity Paybill, M-Pesa, Cash, Deni
  const [actualEquityPaybill, setActualEquityPaybill] = useState<number>(2450);
  const [actualMpesa, setActualMpesa] = useState<number>(1900);
  const [actualCash, setActualCash] = useState<number>(1020);
  const [actualDeni, setActualDeni] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Audit results & AI
  const [activeRecord, setActiveRecord] = useState<ReconciliationRecord | null>(
    reconciliations[0] || null
  );
  const [aiAnalysis, setAiAnalysis] = useState<AILeakageResponse["data"] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [auditMode, setAuditMode] = useState<"screen" | "detailed">("screen");

  // Update item field in audit
  const handleItemCountChange = (
    itemId: string,
    field: "opening" | "incoming" | "ending",
    val: number
  ) => {
    setItemAuditStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: Math.max(0, val),
      },
    }));
  };

  // Run the Reverse Audit
  const handleRunAudit = (e: React.FormEvent) => {
    e.preventDefault();

    const auditInputs: ItemAuditInput[] = items.map((item) => {
      const state = itemAuditStates[item.id] || {
        opening: item.current_stock_qty,
        incoming: 0,
        ending: item.current_stock_qty,
      };
      return {
        itemId: item.id,
        itemName: item.name,
        openingStock: state.opening,
        incomingSupply: state.incoming,
        endingCountedStock: state.ending,
        unitSellingPrice: item.unit_selling_price,
        unitCostPrice: item.unit_cost_price,
      };
    });

    const record = ReverseAuditEngine.runAudit(
      {
        date: auditDate,
        itemAudits: auditInputs,
        actualEquityPaybill: Number(actualEquityPaybill) || 0,
        actualMpesa: Number(actualMpesa) || 0,
        actualCash: Number(actualCash) || 0,
        actualCreditDeni: Number(actualDeni) || 0,
        notes,
      },
      merchant
    );

    setActiveRecord(record);
    onAuditComplete(record);

    // If leakage detected, trigger AI Detective
    if (record.status === "LEAKAGE_DETECTED") {
      runAiLeakageAnalysis(record);
    } else {
      setAiAnalysis(null);
    }
  };

  // Trigger Gemini AI Detective
  const runAiLeakageAnalysis = async (recordToAnalyze?: ReconciliationRecord) => {
    const target = recordToAnalyze || activeRecord;
    if (!target) return;

    setIsAiLoading(true);
    const res = await GeminiApiService.analyzeLeakage({
      reconciliationData: target,
      itemsData: items.map((i) => ({
        name: i.name,
        selling: i.unit_selling_price,
        stock: i.current_stock_qty,
      })),
    });
    setIsAiLoading(false);

    if (res.success && res.data) {
      setAiAnalysis(res.data);
    }
  };

  return (
    <div id="reconciliation-view" className="space-y-5">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAuditMode("screen")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              auditMode === "screen"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            60-Second Physical Count Audit
          </button>
          <button
            onClick={() => setAuditMode("detailed")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              auditMode === "detailed"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Detailed Multi-Channel Audit & AI Diagnostics
          </button>
        </div>
      </div>

      {auditMode === "screen" ? (
        <div className="-mx-4 -mt-2 rounded-xl overflow-hidden border border-slate-800">
          <ReconciliationScreen
            currency={merchant.currency}
            onAuditComplete={(record) => {
              onAuditComplete(record);
              setActiveRecord(record);
            }}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <span>Reverse Inventory & Cash Reconciliation Gap Audit</span>
              </h1>
              <p className="text-xs text-slate-400">
                Verify every shilling. Compare Implied Stock Velocity Sales against Actual M-Pesa + Cash in Till.
              </p>
            </div>

            {activeRecord?.status === "LEAKAGE_DETECTED" && (
              <button
                onClick={() => runAiLeakageAnalysis()}
                disabled={isAiLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-slate-950 shadow-md transition-all self-start sm:self-auto disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAiLoading ? "Analyzing..." : "Diagnose Leakage with AI"}</span>
              </button>
            )}
          </div>

      {/* Core Verification Formula Card */}
      <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Info className="w-4 h-4" />
          <span>The Reverse Reconciliation Logic:</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <div>
            1. <strong className="text-emerald-400">Implied Sales Volume</strong> = (Opening Stock + Incoming Supply) - Ending Counted Stock
          </div>
          <div>
            2. <strong className="text-emerald-400">Total Expected Revenue</strong> = Implied Sales Volume × Unit Selling Price
          </div>
          <div>
            3. <strong className="text-cyan-300">Discrepancy Gap</strong> = (Actual M-Pesa + Cash In Till + Customer Deni) - Expected Revenue
          </div>
        </div>
      </div>

      {/* Current Audit Result High-Visibility Alert Card */}
      {activeRecord && (
        <div
          id="reconciliation-status-card"
          className={`p-5 rounded-xl border space-y-4 shadow-2xl transition-all ${
            activeRecord.status === "PERFECT_MATCH"
              ? "bg-[#18181b] border-emerald-500/40"
              : activeRecord.status === "LEAKAGE_DETECTED"
              ? "bg-[#18181b] border-red-500/40"
              : "bg-[#18181b] border-indigo-500/40"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeRecord.status === "PERFECT_MATCH"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : activeRecord.status === "LEAKAGE_DETECTED"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-indigo-500/20 text-indigo-300"
                }`}
              >
                {activeRecord.status === "PERFECT_MATCH" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight text-slate-100">
                    {activeRecord.status === "PERFECT_MATCH"
                      ? "PERFECT CASH-TO-STOCK MATCH 🎯"
                      : activeRecord.status === "LEAKAGE_DETECTED"
                      ? "LEAKAGE DETECTED 🚨"
                      : "CASH SURPLUS DETECTED 📈"}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">Date: {activeRecord.date}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeRecord.status === "PERFECT_MATCH"
                    ? "All stock sold matches the exact cash and M-Pesa collected. Zero leakage."
                    : activeRecord.status === "LEAKAGE_DETECTED"
                    ? `Discrepancy of ${merchant.currency} ${Math.abs(
                        activeRecord.discrepancy_gap
                      ).toLocaleString()} missing from the cash drawer or unrecorded credit ('deni').`
                    : `Surplus of +${merchant.currency} ${activeRecord.discrepancy_gap.toLocaleString()} extra in drawer.`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Discrepancy Gap</span>
              <span
                className={`text-xl font-bold font-mono ${
                  activeRecord.status === "PERFECT_MATCH"
                    ? "text-emerald-400"
                    : activeRecord.status === "LEAKAGE_DETECTED"
                    ? "text-red-400"
                    : "text-indigo-300"
                }`}
              >
                {activeRecord.discrepancy_gap > 0 ? "+" : ""}
                {merchant.currency} {activeRecord.discrepancy_gap.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Breakdown stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Expected Sales</span>
              <span className="text-sm font-bold text-slate-100 font-mono">
                {merchant.currency} {activeRecord.total_expected_revenue.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-rose-400 text-[10px] uppercase font-bold tracking-wider block">Equity Paybill</span>
              <span className="text-sm font-bold text-rose-300 font-mono">
                {merchant.currency} {(activeRecord.actual_equity_paybill || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider block">M-Pesa Received</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {merchant.currency} {activeRecord.actual_mpesa.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Cash in Till</span>
              <span className="text-sm font-bold text-white font-mono">
                {merchant.currency} {activeRecord.actual_cash.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-amber-400 text-[10px] uppercase font-bold tracking-wider block">Logged Deni</span>
              <span className="text-sm font-bold text-amber-300 font-mono">
                {merchant.currency} {activeRecord.actual_credit_deni.toLocaleString()}
              </span>
            </div>
          </div>

          {/* AI Leakage Detective Box if triggered */}
          {aiAnalysis && (
            <div className="p-4 rounded-lg bg-slate-900 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>AI Leakage Detective Diagnosis:</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {aiAnalysis.diagnosis}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div>
                  <span className="font-semibold text-slate-300 block mb-1">
                    Probable Culprits:
                  </span>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                    {aiAnalysis.probableCauses.map((cause, i) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-emerald-400 block mb-1">
                    Tactical MSME Actions:
                  </span>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                    {aiAnalysis.actionSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Perform New Reconciliation Wizard */}
      <form onSubmit={handleRunAudit} className="p-5 rounded-xl bg-[#18181b] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            End-of-Day Stock & Cash Counting Wizard
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Audit Date:</label>
            <input
              type="date"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Step 1: Counted Physical Ending Stock for Key Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              1. Count Physical Shelf Stock (Ending Count)
            </span>
            <span className="text-[11px] text-slate-400">
              Implied Sold = (Opening + Incoming) - Ending
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-right">Opening Stock</th>
                  <th className="py-2.5 px-3 text-right">Incoming Supply</th>
                  <th className="py-2.5 px-3 text-right text-cyan-300">Ending Counted</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">Implied Sold</th>
                  <th className="py-2.5 px-3 text-right">Unit Retail</th>
                  <th className="py-2.5 px-3 text-right">Expected Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {items.map((item) => {
                  const state = itemAuditStates[item.id] || {
                    opening: item.current_stock_qty,
                    incoming: 0,
                    ending: item.current_stock_qty,
                  };
                  const impliedSold = Math.max(
                    0,
                    state.opening + state.incoming - state.ending
                  );
                  const expectedRev = impliedSold * item.unit_selling_price;

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-100">{item.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        <input
                          type="number"
                          min="0"
                          value={state.opening}
                          onChange={(e) =>
                            handleItemCountChange(
                              item.id,
                              "opening",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        <input
                          type="number"
                          min="0"
                          value={state.incoming}
                          onChange={(e) =>
                            handleItemCountChange(
                              item.id,
                              "incoming",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <input
                          type="number"
                          min="0"
                          value={state.ending}
                          onChange={(e) =>
                            handleItemCountChange(
                              item.id,
                              "ending",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 bg-slate-900 border border-cyan-500/50 rounded px-1.5 py-0.5 text-right font-mono text-cyan-300 text-xs font-bold focus:outline-none focus:border-cyan-400"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {impliedSold} {item.unit_of_measure}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {merchant.currency} {item.unit_selling_price}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                        {merchant.currency} {expectedRev.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 2: Actual Cash & M-Pesa Tally */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 block">
              2. Enter Verified Collections Across All Payment Channels
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Equity Paybill + M-Pesa + Cash Drawer
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-rose-400 mb-1 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" />
                <span>Equity Paybill Sales ({merchant.currency})</span>
              </label>
              <input
                id="recon-actual-equity-input"
                type="number"
                min="0"
                step="any"
                value={actualEquityPaybill}
                onChange={(e) => setActualEquityPaybill(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-900 border border-rose-500/40 rounded-lg px-3 py-2 text-sm font-mono text-rose-300 font-bold focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>M-Pesa (SIM Float / Phone) ({merchant.currency})</span>
              </label>
              <input
                id="recon-actual-mpesa-input"
                type="number"
                min="0"
                step="any"
                value={actualMpesa}
                onChange={(e) => setActualMpesa(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-sm font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>Cash in Drawer ({merchant.currency})</span>
              </label>
              <input
                id="recon-actual-cash-input"
                type="number"
                min="0"
                step="any"
                value={actualCash}
                onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-300 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Customer Deni ({merchant.currency})</span>
              </label>
              <input
                id="recon-actual-deni-input"
                type="number"
                min="0"
                step="any"
                value={actualDeni}
                onChange={(e) => setActualDeni(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-sm font-mono text-amber-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Submit Audit Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            id="recon-execute-audit-btn"
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all flex items-center gap-2"
          >
            <Scale className="w-4 h-4" />
            <span>Verify Cash-to-Stock Balance</span>
          </button>
        </div>
      </form>

      {/* Historical Reconciliations History */}
      <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Past Daily Reconciliation Audits</h2>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider font-medium">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Expected Rev</th>
                <th className="py-2.5 px-3 text-right">M-Pesa</th>
                <th className="py-2.5 px-3 text-right">Cash</th>
                <th className="py-2.5 px-3 text-right">Total Collected</th>
                <th className="py-2.5 px-3 text-right">Gap</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {reconciliations.map((rec) => (
                <tr
                  key={rec.id}
                  onClick={() => setActiveRecord(rec)}
                  className="hover:bg-slate-900/40 cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300 font-semibold">
                    {rec.date}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {merchant.currency} {rec.total_expected_revenue.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                    {merchant.currency} {rec.actual_mpesa.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-white">
                    {merchant.currency} {rec.actual_cash.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                    {merchant.currency} {rec.total_actual_collected.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span
                      className={
                        rec.discrepancy_gap === 0
                          ? "text-emerald-400"
                          : rec.discrepancy_gap < 0
                          ? "text-red-400"
                          : "text-indigo-300"
                      }
                    >
                      {rec.discrepancy_gap > 0 ? "+" : ""}
                      {merchant.currency} {rec.discrepancy_gap.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        rec.status === "PERFECT_MATCH"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : rec.status === "LEAKAGE_DETECTED"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      }`}
                    >
                      {rec.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
