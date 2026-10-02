import React, { useState, useMemo } from "react";
import { 
  Scale, AlertTriangle, CheckCircle2, ShieldCheck, 
  Smartphone, Coins, Calendar, ArrowRight, Check, Play, Info
} from "lucide-react";
import { AlacioMasterState, ReconciliationAudit } from "../../types/alacio";
import { ReverseInventoryEngine, ItemAuditRow } from "../../services/reverseInventoryEngine";

interface EveningReconciliationTabProps {
  state: AlacioMasterState;
  onCommitAudit: (audit: ReconciliationAudit) => void;
  onOpenOneTapGap?: () => void;
}

export default function EveningReconciliationTab({
  state,
  onCommitAudit,
  onOpenOneTapGap
}: EveningReconciliationTabProps) {
  const { currency, inventory, cash_register_balance, mpesa_float_balance } = state;

  // Active closing count state
  const [closingCounts, setClosingCounts] = useState<{ [id: string]: number }>({
    "1": 14, // Brookside Milk: 24 opening + 10 supply - 14 closing = 20 sold @ 65 = 1300
    "2": 6,  // Unga Jogoo: 16 opening + 0 supply - 6 closing = 10 sold @ 170 = 1700
    "3": 12, // Mumias Sugar: 15 opening + 0 supply - 12 closing = 3 sold @ 175 = 525
    "4": 12, // Broadways Bread: 16 opening + 0 supply - 12 closing = 4 sold @ 65 = 260
    "5": 8   // Rina Oil: 10 opening + 0 supply - 8 closing = 2 sold @ 185 = 370
  });

  // Default scenario pre-set to trigger the exact prompt requirement:
  // "⚠️ KSh 300 missing or tied in unlogged deni"
  // Total expected revenue = 1300 + 1700 + 525 + 260 + 370 = 4,155 KSh
  // Actual collected: M-Pesa 2,500 + Cash 1,355 = 3,855 KSh -> Gap = -300 KSh!
  const [actualMpesa, setActualMpesa] = useState<string>("2500");
  const [actualCash, setActualCash] = useState<string>("1355");
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);

  // Items to audit
  const auditItems: ItemAuditRow[] = useMemo(() => {
    return inventory.slice(0, 5).map((item, idx) => {
      const incomingSupply = idx === 0 ? 10 : 0; // Milk received 10 pkts
      const endingStock = closingCounts[item.id] !== undefined ? closingCounts[item.id] : item.current_stock;
      return {
        itemId: item.id,
        itemName: item.name,
        unitType: item.unit_type,
        openingStock: item.opening_stock || item.current_stock,
        incomingSupply,
        endingStockCount: endingStock,
        retailUnitPrice: item.unit_retail
      };
    });
  }, [inventory, closingCounts]);

  const report = useMemo(() => {
    return ReverseInventoryEngine.executeDailyClosing({
      merchantId: "alacio_mini_shop",
      currency,
      items: auditItems,
      actualMpesaCollected: parseFloat(actualMpesa) || 0,
      actualCashCollected: parseFloat(actualCash) || 0
    });
  }, [auditItems, actualMpesa, actualCash, currency]);

  const handleUpdateClosingCount = (id: string | number, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setClosingCounts((prev) => ({
      ...prev,
      [id]: num
    }));
  };

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();

    const audit: ReconciliationAudit = {
      id: `recon_${Date.now()}`,
      date: new Date().toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" }),
      expected_stock_sales: report.totalExpectedRevenue,
      physical_cash: report.actualCashCollected,
      mpesa_statement: report.actualMpesaCollected,
      unlogged_credit: 0,
      discrepancy_gap: report.reconciliationGap,
      status: report.status === "MATCHED" ? "BALANCED" : report.status === "LEAKAGE_DETECTED" ? "LEAKAGE" : "SURPLUS",
      sealed_at: new Date().toISOString()
    };

    onCommitAudit(audit);
    setAuditSuccess(`Evening closing sealed! ${report.actionableAlert}`);
    setTimeout(() => setAuditSuccess(null), 6000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Scale className="text-amber-400" size={24} /> Evening Reconciliation Dashboard
            </h2>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              Reverse Inventory Math
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            <strong>Implied Sales Volume = (Opening Stock + Incoming Supply) &minus; Ending Stock</strong>. Compares expected revenue against real M-Pesa statements and drawer cash.
          </p>
        </div>

        <button
          onClick={handleCommit}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Check size={16} /> Seal Daily Audit
        </button>
      </div>

      {auditSuccess && (
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{auditSuccess}</span>
        </div>
      )}

      {/* TOP 3 SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        {/* EXPECTED REVENUE */}
        <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            1. Total Implied Revenue
          </span>
          <div className="text-3xl font-black text-white mt-1">
            {currency} {report.totalExpectedRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-1 block">
            Based on stock depletion volume &times; retail price
          </span>
        </div>

        {/* ACTUAL COLLECTED */}
        <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            2. M-Pesa + Cash Match
          </span>
          <div className="text-3xl font-black text-emerald-400 mt-1">
            {currency} {report.totalActualCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-1 block">
            Till: {currency} {report.actualMpesaCollected.toLocaleString()} &bull; Cash: {currency} {report.actualCashCollected.toLocaleString()}
          </span>
        </div>

        {/* RECONCILIATION GAP */}
        <div className={`border-2 rounded-2xl p-5 shadow-lg ${
          report.status === "LEAKAGE_DETECTED"
            ? "bg-red-950/20 border-red-500/50"
            : report.status === "MATCHED"
            ? "bg-emerald-950/20 border-emerald-500/50"
            : "bg-amber-950/20 border-amber-500/50"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              3. Reconciliation Gap
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              report.status === "MATCHED"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-red-500/20 text-red-300 border-red-500/30"
            }`}>
              {report.status}
            </span>
          </div>

          <div className={`text-3xl font-black mt-1 ${
            report.status === "LEAKAGE_DETECTED" ? "text-red-400" : "text-emerald-400"
          }`}>
            {report.reconciliationGap >= 0 ? "+" : ""}{currency} {report.reconciliationGap.toLocaleString()}
          </div>

          <span className="text-[11px] text-slate-400 font-sans mt-1 block">
            {report.status === "LEAKAGE_DETECTED" ? "Cash shortage detected" : "Registers balanced"}
          </span>
        </div>
      </div>

      {/* DISCREPANCY ALERT BANNER (CRITICAL REQUIREMENT) */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
        report.status === "LEAKAGE_DETECTED"
          ? "bg-red-950/25 border-red-500/50 text-red-200"
          : "bg-emerald-950/25 border-emerald-500/50 text-emerald-200"
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-black/40 shrink-0 mt-0.5">
            {report.status === "LEAKAGE_DETECTED" ? (
              <AlertTriangle size={20} className="text-red-400" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-400" />
            )}
          </div>
          <div>
            <span className="font-bold font-serif text-sm block text-white">
              Financial Health Discrepancy Alert
            </span>
            {/* EXACT FORMAT FROM USER SPEC: ⚠️ KSh 300 missing or tied in unlogged deni */}
            <p className="text-xs leading-relaxed mt-0.5 font-mono text-red-300 font-bold">
              {report.actionableAlert}
            </p>
          </div>
        </div>

        {report.status === "LEAKAGE_DETECTED" && onOpenOneTapGap && (
          <button
            onClick={onOpenOneTapGap}
            className="px-4 py-2 bg-red-500 hover:bg-red-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow shrink-0 text-xs font-sans"
          >
            <span>Resolve Gap (1-Tap)</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* FINANCIAL INPUTS: MPESA & CASH */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider border-b border-slate-800 pb-2">
          Realized Collections (Till &amp; Cash Count)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 font-semibold block mb-1 text-xs">
              M-Pesa Statement Till Total ({currency})
            </label>
            <input
              type="number"
              value={actualMpesa}
              onChange={(e) => setActualMpesa(e.target.value)}
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">From Safaricom daily settlement SMS</span>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1 text-xs">
              Physical Cash Drawer Count ({currency})
            </label>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Counted notes &amp; coins in drawer</span>
          </div>
        </div>
      </div>

      {/* REVERSE INVENTORY AUDIT TABLE */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-serif">
              Reverse Inventory Implied Sales Calculations
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Implied Sales = (Opening + Supply) &minus; Ending Count
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px] font-mono">
            <thead className="bg-[#070e0b] text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold font-sans">Item Name</th>
                <th className="py-2.5 px-3 text-center">Opening</th>
                <th className="py-2.5 px-3 text-center">+ Supply</th>
                <th className="py-2.5 px-3 text-center">Ending Count</th>
                <th className="py-2.5 px-3 text-center text-emerald-400 font-bold">Implied Sold</th>
                <th className="py-2.5 px-3 text-right">Retail Price</th>
                <th className="py-2.5 px-3 text-right">Expected Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {report.auditedItems.map((item) => (
                <tr key={item.itemId} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-sans font-semibold text-white">
                    {item.itemName}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400">
                    {item.openingStock}
                  </td>
                  <td className="py-3 px-3 text-center text-cyan-300">
                    +{item.incomingSupply}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={item.endingStockCount}
                      onChange={(e) => handleUpdateClosingCount(item.itemId, e.target.value)}
                      className="w-16 bg-[#060c09] border border-emerald-500/40 rounded px-1.5 py-1 text-center text-white font-bold text-xs"
                    />
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-400">
                    {item.impliedSalesVolume} {item.unitType}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    {currency} {item.retailUnitPrice}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-white">
                    {currency} {item.expectedSalesRevenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
