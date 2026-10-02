import React, { useState, useMemo } from "react";
import { 
  Scale, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, 
  Calendar, Smartphone, HelpCircle, ArrowRight, Play, Check, 
  Layers, Package, Database, Info, FileSpreadsheet
} from "lucide-react";
import { AlacioMasterState, ReconciliationAudit, InventoryItem } from "../../types/alacio";

interface ItemAuditState {
  item_id: number | string;
  item_name: string;
  category: string;
  unit_type: string;
  unit_retail_price: number;
  opening_qty: number;
  supply_added_qty: number;
  closing_counted_qty: number;
}

interface ReconciliationTabProps {
  state: AlacioMasterState;
  onCommitReconciliation: (audit: ReconciliationAudit) => void;
  onUpdateInventoryStock?: (updates: { id: number | string; newStock: number }[]) => void;
  onOpenOneTapGap?: () => void;
  onOpenMpesaImport?: () => void;
}

export default function ReconciliationTab({ 
  state, 
  onCommitReconciliation,
  onUpdateInventoryStock,
  onOpenOneTapGap,
  onOpenMpesaImport
}: ReconciliationTabProps) {
  const { currency, inventory, cash_register_balance, mpesa_float_balance, reconciliations } = state;

  // 1. Initialize Item Audits from Inventory
  const [itemAudits, setItemAudits] = useState<ItemAuditState[]>(() => {
    return inventory.slice(0, 12).map((item) => ({
      item_id: item.id,
      item_name: item.name,
      category: item.category,
      unit_type: item.unit_type,
      unit_retail_price: item.unit_retail,
      opening_qty: item.opening_stock || item.current_stock,
      supply_added_qty: 0,
      closing_counted_qty: item.current_stock
    }));
  });

  const [actualMpesa, setActualMpesa] = useState<string>(String(mpesa_float_balance || 7200));
  const [actualCash, setActualCash] = useState<string>(String(cash_register_balance || 4500));
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);
  const [lastExecutedResult, setLastExecutedResult] = useState<any | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Handle audit input changes
  const handleItemCountChange = (
    itemId: number | string, 
    field: "opening_qty" | "supply_added_qty" | "closing_counted_qty", 
    value: string
  ) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setItemAudits((prev) =>
      prev.map((item) => (item.item_id === itemId ? { ...item, [field]: num } : item))
    );
  };

  // 2. YuBiFlo Reverse Inventory Engine Calculation
  const engineResults = useMemo(() => {
    let total_expected_revenue = 0.0;
    const audited_items = itemAudits.map((item) => {
      const available_stock = item.opening_qty + item.supply_added_qty;
      // If closing count > available, implied sold is 0
      const implied_sold_qty = item.closing_counted_qty > available_stock 
        ? 0.0 
        : available_stock - item.closing_counted_qty;
      const expected_revenue = implied_sold_qty * item.unit_retail_price;
      total_expected_revenue += expected_revenue;

      return {
        ...item,
        available_stock,
        implied_sold_qty,
        expected_revenue
      };
    });

    const mpesaNum = parseFloat(actualMpesa) || 0.0;
    const cashNum = parseFloat(actualCash) || 0.0;
    const total_actual_collected = mpesaNum + cashNum;
    const discrepancy_gap = total_actual_collected - total_expected_revenue;

    // Status & Insight Rules (Exact algorithm from YuBiFloReconciliationEngine)
    let status: "MATCHED" | "LEAKAGE_DETECTED" | "SURPLUS_DETECTED" = "MATCHED";
    let actionable_insight = "";

    if (Math.abs(discrepancy_gap) <= 5.0) {
      status = "MATCHED";
      actionable_insight = "All stock accounts match cash and M-Pesa collected perfectly!";
    } else if (discrepancy_gap < 0.0) {
      status = "LEAKAGE_DETECTED";
      actionable_insight = `Unaccounted Gap of ${currency} ${Math.abs(discrepancy_gap).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Items walked out the door, but cash/M-Pesa is missing. Check unlogged credit (deni) or till shortage.`;
    } else {
      status = "SURPLUS_DETECTED";
      actionable_insight = `Cash Surplus of ${currency} ${discrepancy_gap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. You received more cash than recorded inventory drops. Check if a delivery was unlogged.`;
    }

    return {
      audited_items,
      total_expected_revenue,
      actual_mpesa_collected: mpesaNum,
      actual_cash_collected: cashNum,
      total_actual_collected,
      discrepancy_gap,
      status,
      actionable_insight
    };
  }, [itemAudits, actualMpesa, actualCash, currency]);

  // 3. Execute Daily Closing
  const handleExecuteClosing = (e: React.FormEvent) => {
    e.preventDefault();

    const newAudit: ReconciliationAudit = {
      id: `recon_${Date.now()}`,
      date: new Date().toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" }),
      expected_stock_sales: engineResults.total_expected_revenue,
      physical_cash: engineResults.actual_cash_collected,
      mpesa_statement: engineResults.actual_mpesa_collected,
      unlogged_credit: 0,
      discrepancy_gap: engineResults.discrepancy_gap,
      status: engineResults.status === "MATCHED" ? "BALANCED" : engineResults.status === "LEAKAGE_DETECTED" ? "LEAKAGE" : "SURPLUS",
      sealed_at: new Date().toISOString()
    };

    onCommitReconciliation(newAudit);

    // Update master stock levels to closing counted qty
    if (onUpdateInventoryStock) {
      const updates = itemAudits.map((a) => ({
        id: a.item_id,
        newStock: a.closing_counted_qty
      }));
      onUpdateInventoryStock(updates);
    }

    setLastExecutedResult(engineResults);
    setAuditSuccess(
      `Daily closing sealed! Status: ${engineResults.status} (Gap: ${engineResults.discrepancy_gap >= 0 ? "+" : ""}${currency} ${engineResults.discrepancy_gap.toLocaleString()}). Master shelf stocks recalibrated.`
    );
    setTimeout(() => setAuditSuccess(null), 6000);
  };

  const categories = ["All", ...Array.from(new Set(itemAudits.map((i) => i.category)))];
  const displayedItems = itemAudits.filter((item) => filterCategory === "All" || item.category === filterCategory);

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Scale className="text-emerald-400" size={22} /> YuBiFlo Daily Reverse Stock Depletion Engine
            </h2>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
              app/services/reconciliation_service.py
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            <strong>Formula: Implied Sold = (Opening Stock + Supplies In) &minus; Closing Stock</strong>. Compares theoretical revenue from shelf inventory depletion against actual M-Pesa till and drawer cash.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMpesaImport && (
            <button
              onClick={onOpenMpesaImport}
              className="px-3 py-1.5 bg-[#0a1610] hover:bg-[#10231a] text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone size={14} /> M-Pesa Statement Cross-Check
            </button>
          )}
        </div>
      </div>

      {auditSuccess && (
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{auditSuccess}</span>
        </div>
      )}

      {/* TOP 3 ENGINE SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. THEORETICAL EXPECTED REVENUE */}
        <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            1. Total Expected Revenue (Stock Depleted)
          </span>
          <div className="text-3xl font-black font-mono text-white mt-1">
            {currency} {engineResults.total_expected_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Sum of Implied Sales &times; Retail Selling Price
          </span>
        </div>

        {/* 2. ACTUAL COLLECTED */}
        <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            2. Total Actual Collected (M-Pesa + Cash)
          </span>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
            {currency} {engineResults.total_actual_collected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Till: {currency} {engineResults.actual_mpesa_collected.toLocaleString()} &bull; Cash: {currency} {engineResults.actual_cash_collected.toLocaleString()}
          </span>
        </div>

        {/* 3. DISCREPANCY GAP & STATUS */}
        <div
          className={`border-2 rounded-2xl p-5 shadow-lg ${
            engineResults.status === "LEAKAGE_DETECTED"
              ? "bg-red-950/20 border-red-500/50"
              : engineResults.status === "MATCHED"
              ? "bg-emerald-950/20 border-emerald-500/50"
              : "bg-amber-950/20 border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              3. Discrepancy Gap
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              engineResults.status === "MATCHED"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : engineResults.status === "LEAKAGE_DETECTED"
                ? "bg-red-500/20 text-red-300 border-red-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}>
              {engineResults.status}
            </span>
          </div>

          <div
            className={`text-3xl font-black font-mono mt-1 ${
              engineResults.status === "LEAKAGE_DETECTED"
                ? "text-red-400"
                : engineResults.status === "MATCHED"
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            {engineResults.discrepancy_gap >= 0 ? "+" : ""}
            {currency} {engineResults.discrepancy_gap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <span className="text-[11px] text-slate-300 mt-1 block">
            {engineResults.status === "MATCHED" && "Tolerance &le; KSh 5.00"}
            {engineResults.status === "LEAKAGE_DETECTED" && "Till cash deficit detected"}
            {engineResults.status === "SURPLUS_DETECTED" && "Surplus / unlogged delivery"}
          </span>
        </div>
      </div>

      {/* ACTIONABLE INSIGHT BANNER */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
        engineResults.status === "LEAKAGE_DETECTED"
          ? "bg-red-950/20 border-red-500/40 text-red-200"
          : engineResults.status === "MATCHED"
          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
          : "bg-amber-950/20 border-amber-500/40 text-amber-200"
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-black/40 shrink-0 mt-0.5">
            {engineResults.status === "LEAKAGE_DETECTED" && <AlertTriangle size={18} className="text-red-400" />}
            {engineResults.status === "MATCHED" && <CheckCircle2 size={18} className="text-emerald-400" />}
            {engineResults.status === "SURPLUS_DETECTED" && <Info size={18} className="text-amber-400" />}
          </div>
          <div>
            <span className="font-bold font-serif text-sm block text-white">Actionable Engine Insight</span>
            <p className="text-xs leading-relaxed mt-0.5 text-slate-200">
              {engineResults.actionable_insight}
            </p>
          </div>
        </div>

        {engineResults.status === "LEAKAGE_DETECTED" && onOpenOneTapGap && (
          <button
            onClick={onOpenOneTapGap}
            className="px-4 py-2 bg-red-500 hover:bg-red-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow shrink-0 text-xs"
          >
            <span>Resolve Unaccounted Gap (1-Tap)</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* CASH & MPESA ACTUAL INPUT ROW */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
          <Database size={14} className="text-emerald-400" /> Daily Cash &amp; Till Totals (Actual Collected)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Actual M-Pesa Collected (Till / Paybill Total) ({currency})
            </label>
            <input
              type="number"
              value={actualMpesa}
              onChange={(e) => setActualMpesa(e.target.value)}
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">From Safaricom Buy Goods statement</span>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Actual Cash Collected (Physical Drawer Total) ({currency})
            </label>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Physical notes and coins verified</span>
          </div>
        </div>
      </div>

      {/* REVERSE INVENTORY ITEM AUDIT TABLE */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-400" /> Reverse Inventory Shelf Counts ({itemAudits.length} Items)
            </h3>
            <span className="text-[11px] text-slate-400">
              Input Opening Shelf, Logged Supplies, and Evening Closing Shelf counts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#060c09] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#070e0b] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Merchandise Item</th>
                <th className="py-2.5 px-3 font-semibold text-center">Opening Qty</th>
                <th className="py-2.5 px-3 font-semibold text-center">+ Supply In</th>
                <th className="py-2.5 px-3 font-semibold text-center">Closing Count</th>
                <th className="py-2.5 px-3 font-semibold text-center text-emerald-400">Implied Sold</th>
                <th className="py-2.5 px-3 font-semibold text-right">Retail Price</th>
                <th className="py-2.5 px-3 font-semibold text-right">Expected Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {displayedItems.map((item) => {
                const available = item.opening_qty + item.supply_added_qty;
                const implied = item.closing_counted_qty > available ? 0 : available - item.closing_counted_qty;
                const revenue = implied * item.unit_retail_price;

                return (
                  <tr key={item.item_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-semibold text-white">{item.item_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.category} &bull; {item.unit_type}</div>
                    </td>

                    {/* OPENING QTY INPUT */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        value={item.opening_qty}
                        onChange={(e) => handleItemCountChange(item.item_id, "opening_qty", e.target.value)}
                        className="w-16 bg-[#060c09] border border-slate-700 rounded px-1.5 py-1 text-center text-slate-200 text-xs font-mono focus:border-emerald-500"
                      />
                    </td>

                    {/* SUPPLY ADDED QTY INPUT */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        value={item.supply_added_qty}
                        onChange={(e) => handleItemCountChange(item.item_id, "supply_added_qty", e.target.value)}
                        className="w-16 bg-[#060c09] border border-slate-700 rounded px-1.5 py-1 text-center text-cyan-300 text-xs font-mono focus:border-emerald-500"
                      />
                    </td>

                    {/* CLOSING COUNTED QTY INPUT */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        value={item.closing_counted_qty}
                        onChange={(e) => handleItemCountChange(item.item_id, "closing_counted_qty", e.target.value)}
                        className="w-16 bg-[#060c09] border border-emerald-500/50 rounded px-1.5 py-1 text-center text-white font-bold text-xs font-mono focus:border-emerald-500"
                      />
                    </td>

                    {/* IMPLIED SOLD (FORMULA) */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {implied} {item.unit_type}
                      </span>
                    </td>

                    {/* RETAIL PRICE */}
                    <td className="py-3 px-3 text-right text-slate-400">
                      {currency} {item.unit_retail_price.toLocaleString()}
                    </td>

                    {/* EXPECTED REVENUE */}
                    <td className="py-3 px-3 text-right font-black text-white">
                      {currency} {revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM EXECUTE BUTTON */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 font-mono">
            <span>Formula: </span>
            <code className="text-emerald-400 bg-black/40 px-2 py-0.5 rounded">
              Implied Sold = ({displayedItems.reduce((a, i) => a + i.opening_qty, 0)} Opening + {displayedItems.reduce((a, i) => a + i.supply_added_qty, 0)} Supply) &minus; {displayedItems.reduce((a, i) => a + i.closing_counted_qty, 0)} Closing
            </code>
          </div>

          <button
            onClick={handleExecuteClosing}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Play size={15} /> Execute Daily Closing &amp; Commit Audit
          </button>
        </div>
      </div>

      {/* RECONCILIATION AUDIT HISTORY TABLE */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2 border-b border-slate-800 pb-2">
          <Calendar size={16} className="text-emerald-400" /> Historical Sealed Audits (Immutable Registry)
        </h3>

        <div className="space-y-2">
          {reconciliations.map((audit) => (
            <div
              key={audit.id}
              className="p-3.5 bg-[#060c09] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
            >
              <div>
                <span className="font-bold text-white block">{audit.date}</span>
                <span className="text-[11px] text-slate-400">
                  Expected: {currency} {audit.expected_stock_sales.toLocaleString()} &bull; Actual Collected: {currency} {(audit.physical_cash + audit.mpesa_statement).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${
                  audit.discrepancy_gap === 0 ? "text-emerald-400" : audit.discrepancy_gap < 0 ? "text-red-400" : "text-amber-400"
                }`}>
                  Gap: {audit.discrepancy_gap >= 0 ? "+" : ""}{currency} {audit.discrepancy_gap.toLocaleString()}
                </span>

                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  audit.status === "BALANCED"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}>
                  {audit.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
