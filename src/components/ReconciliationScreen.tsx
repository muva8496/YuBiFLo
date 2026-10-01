import React, { useState, useMemo } from "react";
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Smartphone, 
  Coins, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Plus
} from "lucide-react";
import { AppStorage } from "../services/storage";
import { ReconciliationRecord } from "../types";

export interface AuditedItemRow {
  id: number | string;
  name: string;
  unit: string;
  opening: number;
  restock: number;
  closing: number;
  retailPrice: number;
}

interface ReconciliationScreenProps {
  onAuditComplete?: (record: any) => void;
  currency?: string;
}

export default function ReconciliationScreen({
  onAuditComplete,
  currency = "KSh",
}: ReconciliationScreenProps) {
  // 1. Audit items: opening + restock - closing = implied sold
  const [auditedItems, setAuditedItems] = useState<AuditedItemRow[]>([
    { id: 1, name: "Milk 500ml", unit: "packets", opening: 10, restock: 30, closing: 5, retailPrice: 60 },
    { id: 2, name: "Unga 2kg", unit: "bales", opening: 4, restock: 12, closing: 2, retailPrice: 210 },
    { id: 3, name: "Festive Bread 400g", unit: "loaves", opening: 5, restock: 25, closing: 6, retailPrice: 65 },
    { id: 4, name: "Cooking Oil 1L", unit: "bottles", opening: 2, restock: 10, closing: 3, retailPrice: 330 },
  ]);

  // 2. Physical & Digital Collections
  const [mpesaCollected, setMpesaCollected] = useState("4500");
  const [cashCollected, setCashCollected] = useState("2800");
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Handle closing count changes
  const handleClosingChange = (id: number | string, val: string) => {
    const parsedVal = Math.max(0, parseFloat(val) || 0);
    setAuditedItems(prev => prev.map(item => 
      item.id === id ? { ...item, closing: parsedVal } : item
    ));
  };

  // 3. Computed Calculations
  const reconciliationSummary = useMemo(() => {
    let totalExpected = 0;

    const itemsWithMetrics = auditedItems.map(item => {
      const available = item.opening + item.restock;
      // Implied Sold = Available - Closing Counted
      const impliedSold = Math.max(0, available - item.closing);
      const expectedRevenue = impliedSold * item.retailPrice;
      totalExpected += expectedRevenue;

      return {
        ...item,
        impliedSold,
        expectedRevenue
      };
    });

    const parsedMpesa = parseFloat(mpesaCollected) || 0;
    const parsedCash = parseFloat(cashCollected) || 0;
    const totalCollected = parsedMpesa + parsedCash;
    const discrepancyGap = totalCollected - totalExpected; // Negative = Leakage, Positive = Surplus

    let status: "MATCHED" | "LEAKAGE_DETECTED" | "SURPLUS_DETECTED" = "MATCHED";
    if (discrepancyGap < -5) status = "LEAKAGE_DETECTED";
    if (discrepancyGap > 5) status = "SURPLUS_DETECTED";

    return {
      itemsWithMetrics,
      totalExpected,
      totalCollected,
      discrepancyGap,
      status
    };
  }, [auditedItems, mpesaCollected, cashCollected]);

  const handleFinalize = () => {
    const today = new Date().toISOString().split("T")[0];
    const recId = `rec-audit-${Date.now()}`;
    const statusMap = {
      MATCHED: "PERFECT_MATCH" as const,
      LEAKAGE_DETECTED: "LEAKAGE_DETECTED" as const,
      SURPLUS_DETECTED: "SURPLUS_DETECTED" as const,
    };

    const newRecord: ReconciliationRecord = {
      id: recId,
      merchant_id: "merch-alacio-00",
      date: today,
      opening_stock_value: reconciliationSummary.itemsWithMetrics.reduce((acc, i) => acc + (i.opening * i.retailPrice), 0),
      incoming_supply_value: reconciliationSummary.itemsWithMetrics.reduce((acc, i) => acc + (i.restock * i.retailPrice), 0),
      ending_stock_value: reconciliationSummary.itemsWithMetrics.reduce((acc, i) => acc + (i.closing * i.retailPrice), 0),
      implied_sales_volume: reconciliationSummary.itemsWithMetrics.reduce((acc, i) => acc + i.impliedSold, 0),
      total_expected_revenue: reconciliationSummary.totalExpected,
      total_expected_cogs: reconciliationSummary.itemsWithMetrics.reduce((acc, i) => acc + (i.impliedSold * (i.retailPrice * 0.8)), 0),
      actual_equity_paybill: 0,
      actual_mpesa: parseFloat(mpesaCollected) || 0,
      actual_cash: parseFloat(cashCollected) || 0,
      actual_credit_deni: 0,
      total_actual_collected: reconciliationSummary.totalCollected,
      discrepancy_gap: reconciliationSummary.discrepancyGap,
      status: statusMap[reconciliationSummary.status],
      item_audits: reconciliationSummary.itemsWithMetrics.map(item => ({
        item_id: String(item.id),
        item_name: item.name,
        opening_stock: item.opening,
        incoming_supply: item.restock,
        ending_counted_stock: item.closing,
        implied_sales_volume: item.impliedSold,
        unit_selling_price: item.retailPrice,
        unit_cost_price: item.retailPrice * 0.8,
        expected_revenue: item.expectedRevenue,
        expected_profit: item.expectedRevenue * 0.2,
      })),
      notes: `End-of-day 60-Second Physical Count: Gap is ${reconciliationSummary.discrepancyGap >= 0 ? "+" : ""}${reconciliationSummary.discrepancyGap} ${currency}`,
      created_at: new Date().toISOString(),
    };

    const existingRecs = AppStorage.getReconciliations();
    AppStorage.saveReconciliations([newRecord, ...existingRecs]);
    if (onAuditComplete) {
      onAuditComplete(newRecord);
    }

    setSavedSuccessMsg(`Reconciliation finalized and locked in master ledger! Status: ${reconciliationSummary.status.replace("_", " ")}`);
    setTimeout(() => {
      setSavedSuccessMsg(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[#0e1217] text-slate-200 font-sans p-6 md:p-8 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Scale className="text-emerald-400" size={24} /> End-of-Day Reconciliation & Cash Audit
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Matching implied stock depletion against actual physical cash and M-Pesa statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Audit Status:</span>
          {reconciliationSummary.status === "MATCHED" && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
              <CheckCircle2 size={14} /> Perfect Match
            </span>
          )}
          {reconciliationSummary.status === "LEAKAGE_DETECTED" && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-semibold">
              <AlertTriangle size={14} /> Leakage / Deni Detected
            </span>
          )}
          {reconciliationSummary.status === "SURPLUS_DETECTED" && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
              <TrendingUp size={14} /> Cash Surplus
            </span>
          )}
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* KPI TOP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#13181f] border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Expected Revenue (From Stock Sold)
          </span>
          <div className="mt-2 text-3xl font-black text-white font-mono">
            {currency} {reconciliationSummary.totalExpected.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Value of goods that walked off the shelf today
          </p>
        </div>

        <div className="bg-[#13181f] border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Actual Collections
          </span>
          <div className="mt-2 text-3xl font-black text-emerald-400 font-mono">
            {currency} {reconciliationSummary.totalCollected.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Combined drawer cash and M-Pesa receipts
          </p>
        </div>

        <div className={`border rounded-xl p-5 shadow-sm transition ${
          reconciliationSummary.status === "LEAKAGE_DETECTED" 
            ? "bg-red-950/20 border-red-500/30" 
            : reconciliationSummary.status === "SURPLUS_DETECTED"
            ? "bg-amber-950/20 border-amber-500/30"
            : "bg-[#13181f] border-slate-800"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Discrepancy Gap
            </span>
            {reconciliationSummary.discrepancyGap < 0 && <ShieldAlert size={16} className="text-red-400" />}
          </div>
          <div className={`mt-2 text-3xl font-black font-mono ${
            reconciliationSummary.discrepancyGap < 0 
              ? "text-red-400" 
              : reconciliationSummary.discrepancyGap > 0 
              ? "text-amber-400" 
              : "text-emerald-400"
          }`}>
            {reconciliationSummary.discrepancyGap < 0 ? "-" : "+"}
            {currency} {Math.abs(reconciliationSummary.discrepancyGap).toLocaleString()}
          </div>
          <p className="text-[11px] mt-1 text-slate-400">
            {reconciliationSummary.discrepancyGap < 0 
              ? "Unaccounted shortage: check unlogged deni or till error"
              : reconciliationSummary.discrepancyGap > 0 
              ? "Unregistered income: check for unlogged supply batch"
              : "All collections match inventory drops perfectly"}
          </p>
        </div>
      </div>

      {/* DUAL COLUMN: REVERSE STOCK AUDIT & ACTUAL INFLOW ENTRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* REVERSE INVENTORY AUDIT TABLE (2 COLS) */}
        <div className="lg:col-span-2 bg-[#13181f] border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-800 bg-[#18202a] flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. 60-Second Physical Closing Count
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Implied Sold = (Open + In) - Close</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800/80 bg-[#13181f]">
                <tr>
                  <th className="py-3 px-4 font-semibold font-sans">Item</th>
                  <th className="py-3 px-3 text-center">Open</th>
                  <th className="py-3 px-3 text-center">Supply In</th>
                  <th className="py-3 px-4 text-center">Closing Count</th>
                  <th className="py-3 px-3 text-center">Implied Sold</th>
                  <th className="py-3 px-4 text-right">Expected Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reconciliationSummary.itemsWithMetrics.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4 font-sans text-slate-200">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{currency} {item.retailPrice}/{item.unit}</div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">{item.opening}</td>
                    <td className="py-3 px-3 text-center text-emerald-400 font-semibold">+{item.restock}</td>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="number" 
                        value={item.closing}
                        onChange={(e) => handleClosingChange(item.id, e.target.value)}
                        className="w-16 bg-[#0e1217] border border-slate-700 focus:border-emerald-500 text-center rounded py-1 text-white font-bold font-mono focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-white">
                      {item.impliedSold} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {currency} {item.expectedRevenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTUAL CASH / M-PESA ENTRY (1 COL) */}
        <div className="bg-[#13181f] border border-slate-800 rounded-xl p-5 space-y-6 shadow-md flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Actual Money Collected
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Enter physical drawer cash and Till totals.</p>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="text-slate-400 flex items-center gap-2 mb-1.5 font-medium">
                  <Smartphone size={15} className="text-emerald-400" /> M-Pesa Till / Paybill Statement ({currency})
                </label>
                <input 
                  type="number"
                  value={mpesaCollected}
                  onChange={(e) => setMpesaCollected(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full bg-[#0e1217] border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 flex items-center gap-2 mb-1.5 font-medium">
                  <Coins size={15} className="text-amber-400" /> Physical Cash Drawer Count ({currency})
                </label>
                <input 
                  type="number"
                  value={cashCollected}
                  onChange={(e) => setCashCollected(e.target.value)}
                  placeholder="e.g. 2800"
                  className="w-full bg-[#0e1217] border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Total Money Counted:</span>
              <span className="font-bold text-white font-mono">
                {currency} {reconciliationSummary.totalCollected.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Expected From Stock:</span>
              <span className="font-bold text-slate-300 font-mono">
                {currency} {reconciliationSummary.totalExpected.toLocaleString()}
              </span>
            </div>
            
            <button 
              onClick={handleFinalize}
              className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-98"
            >
              Finalize Daily Reconciliation <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
export { ReconciliationScreen };
