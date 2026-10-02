import React from "react";
import { Scale, ArrowUpDown, TrendingUp, TrendingDown, BookOpen } from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";

interface TLedgersTabProps {
  state: AlacioMasterState;
}

export default function TLedgersTab({ state }: TLedgersTabProps) {
  const { currency, kpis, customers, cash_register_balance, inventory, salesLedger } = state;
  const totalDebt = customers.reduce((acc, c) => acc + c.debt_balance, 0);
  const totalSales = salesLedger.reduce((acc, s) => acc + s.total_amount, 0);

  // Sorted movers
  const topMovers = [...inventory].sort((a, b) => b.total_shelf_value - a.total_shelf_value).slice(0, 5);
  const slowMovers = [...inventory].sort((a, b) => a.current_stock - b.current_stock).slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Scale className="text-emerald-400" size={22} /> Visual T-Ledgers &amp; Double-Entry Audit
        </h2>
        <p className="text-xs text-slate-400">
          Formal double-entry accounting balances mapped across cash, inventory capital, receivables, and revenue.
        </p>
      </div>

      {/* 4 PRIMARY T-ACCOUNTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {/* T-ACCOUNT 1: CASH / TILL ACCOUNT */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-center font-bold text-sm text-white pb-3 border-b-2 border-emerald-500 flex items-center justify-center gap-2">
            <BookOpen size={16} className="text-emerald-400" /> CASH / TILL DRAWER ACCOUNT (ASSET)
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-800 mt-3 min-h-[140px]">
            <div className="pr-3 space-y-1.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block pb-1 border-b border-slate-800">DR (Debits / Cash In)</span>
              <div className="flex justify-between text-slate-300">
                <span>Opening Float</span>
                <span className="font-bold">{currency} 655</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Morning Cash Sales</span>
                <span className="font-bold">{currency} 280</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Deni Repayments</span>
                <span className="font-bold">{currency} 0</span>
              </div>
            </div>
            <div className="pl-3 space-y-1.5">
              <span className="text-[10px] text-red-400 uppercase font-bold block pb-1 border-b border-slate-800">CR (Credits / Cash Out)</span>
              <div className="flex justify-between text-slate-400">
                <span>Restock Payouts</span>
                <span>{currency} 0</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Owner Drawings</span>
                <span>{currency} 0</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-white text-xs">
            <span>Net Debit Balance:</span>
            <span className="text-emerald-400">{currency} {cash_register_balance.toLocaleString()}</span>
          </div>
        </div>

        {/* T-ACCOUNT 2: INVENTORY ASSET */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-center font-bold text-sm text-white pb-3 border-b-2 border-cyan-500 flex items-center justify-center gap-2">
            <BookOpen size={16} className="text-cyan-400" /> INVENTORY MERCHANDISE (ASSET)
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-800 mt-3 min-h-[140px]">
            <div className="pr-3 space-y-1.5">
              <span className="text-[10px] text-cyan-400 uppercase font-bold block pb-1 border-b border-slate-800">DR (Wholesale Stock In)</span>
              <div className="flex justify-between text-slate-300">
                <span>Initial 43 Batches</span>
                <span className="font-bold">{currency} {kpis.total_capital_invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="pl-3 space-y-1.5">
              <span className="text-[10px] text-red-400 uppercase font-bold block pb-1 border-b border-slate-800">CR (COGS / Stock Sold)</span>
              <div className="flex justify-between text-slate-400">
                <span>Cost of Depleted Stock</span>
                <span>{currency} 515.00</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-white text-xs">
            <span>Active Shelf Cost Valuation:</span>
            <span className="text-cyan-400">{currency} {kpis.total_capital_invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* T-ACCOUNT 3: ACCOUNTS RECEIVABLE (DENI) */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-center font-bold text-sm text-white pb-3 border-b-2 border-purple-500 flex items-center justify-center gap-2">
            <BookOpen size={16} className="text-purple-400" /> ACCOUNTS RECEIVABLE (DENI BOOK)
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-800 mt-3 min-h-[140px]">
            <div className="pr-3 space-y-1.5">
              <span className="text-[10px] text-purple-400 uppercase font-bold block pb-1 border-b border-slate-800">DR (New Credit Issued)</span>
              {customers.map((c) => (
                <div key={c.id} className="flex justify-between text-slate-300 text-[11px]">
                  <span>{c.name}</span>
                  <span>{currency} {c.debt_balance.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="pl-3 space-y-1.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block pb-1 border-b border-slate-800">CR (Deni Cleared)</span>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Logged Repayments</span>
                <span>{currency} 0</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-white text-xs">
            <span>Outstanding Debtor Balance:</span>
            <span className="text-purple-300">{currency} {totalDebt.toLocaleString()}</span>
          </div>
        </div>

        {/* T-ACCOUNT 4: SALES REVENUE */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-center font-bold text-sm text-white pb-3 border-b-2 border-amber-500 flex items-center justify-center gap-2">
            <BookOpen size={16} className="text-amber-400" /> SALES REVENUE &amp; MARGIN REALIZED
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-800 mt-3 min-h-[140px]">
            <div className="pr-3 space-y-1.5">
              <span className="text-[10px] text-red-400 uppercase font-bold block pb-1 border-b border-slate-800">DR (Returns / Discrepancies)</span>
              <div className="flex justify-between text-slate-400">
                <span>Returns / Wastage</span>
                <span>{currency} 0</span>
              </div>
            </div>
            <div className="pl-3 space-y-1.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block pb-1 border-b border-slate-800">CR (Gross Sales Recorded)</span>
              <div className="flex justify-between text-slate-300">
                <span>Completed Sales</span>
                <span className="font-bold">{currency} {totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Locked Gross Profit</span>
                <span>{currency} {kpis.locked_in_potential_gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-white text-xs">
            <span>Potential Catalog Margin:</span>
            <span className="text-emerald-400">{kpis.avg_markup_percentage}% Avg Markup</span>
          </div>
        </div>
      </div>

      {/* ITEM TURNOVER RANKING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} /> Top Capital Movers (Highest Shelf Value)
          </h3>
          <div className="space-y-2">
            {topMovers.map((item, idx) => (
              <div key={item.id} className="p-2.5 bg-[#0a0d12] rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">#{idx + 1} {item.name}</span>
                <span className="text-emerald-400 font-bold">{currency} {item.total_shelf_value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingDown size={16} /> Critical Stock Replenishment Needs
          </h3>
          <div className="space-y-2">
            {slowMovers.map((item, idx) => (
              <div key={item.id} className="p-2.5 bg-[#0a0d12] rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">#{idx + 1} {item.name}</span>
                <span className="text-amber-400 font-bold">{item.current_stock} {item.unit_type} remaining</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
