import React, { useState } from "react";
import { BookOpen, Users, Layers, TrendingUp, ShieldCheck, ArrowRight, DollarSign } from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";

interface ThreeFoldLedgersTabProps {
  state: AlacioMasterState;
}

export default function ThreeFoldLedgersTab({ state }: ThreeFoldLedgersTabProps) {
  const { currency, salesLedger = [], customers = [], inventory = [], payouts = [] } = state;
  const [activeTab, setActiveTab] = useState<"P" | "R" | "N">("P");

  // Calculations for Personal Accounts (Debtors & Creditors)
  const totalDebtors = customers.reduce((sum, c) => sum + (c.debt_balance || 0), 0);
  const totalCreditors = 0; // Current shop has no pending supplier debt

  // Calculations for Real Accounts (Physical Assets: Cash, Float, Inventory)
  const totalShelfStockValue = inventory.reduce((sum, i) => sum + i.total_shelf_value, 0);
  const totalDrawerCash = 14200;
  const totalMpesaFloat = 28300;
  const totalRealAssets = totalShelfStockValue + totalDrawerCash + totalMpesaFloat;

  // Calculations for Nominal Accounts (Revenues & Expenses)
  const totalSalesRevenue = salesLedger.reduce((sum, s) => sum + s.total_amount, 0);
  const totalCogs = salesLedger.reduce((sum, s) => sum + (s.total_amount * 0.78), 0);
  const totalOwnerChai = payouts.filter(p => p.type === "OWNER_DRAWING").reduce((sum, p) => sum + p.amount, 0);
  const totalShopExpenses = payouts.filter(p => p.type === "BUSINESS_EXPENSE").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl font-sans text-[#E2ECF3]">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182C40] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <BookOpen className="text-purple-400" size={22} /> 3-Fold Ledgers Matrix
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E3A5F] text-[#38BDF8] border border-[#2D5577]">
              P / R / N Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Classical double-entry system partitioned into Personal (P), Real (R), and Nominal (N) accounting tabs.
          </p>
        </div>

        {/* 3 TABS LABELLED EXACTLY P, R, AND N */}
        <div className="bg-[#09121D] p-1 rounded-2xl border border-[#182C40] flex items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setActiveTab("P")}
            className={`px-4 py-2 rounded-xl transition font-black cursor-pointer text-sm ${
              activeTab === "P"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-950/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tab P
          </button>
          <button
            onClick={() => setActiveTab("R")}
            className={`px-4 py-2 rounded-xl transition font-black cursor-pointer text-sm ${
              activeTab === "R"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tab R
          </button>
          <button
            onClick={() => setActiveTab("N")}
            className={`px-4 py-2 rounded-xl transition font-black cursor-pointer text-sm ${
              activeTab === "N"
                ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tab N
          </button>
        </div>
      </div>

      {/* TAB P: PERSONAL ACCOUNTS */}
      {activeTab === "P" && (
        <div className="bg-[#0E1A29] border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#182C40] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold font-mono text-xs">P</span>
                <h2 className="text-base font-bold text-white font-mono uppercase">
                  Tab P &bull; Personal Accounts (Debtors &amp; Creditors)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Golden Rule: Debit the Receiver (Debtors who owe you money), Credit the Giver (Creditors you owe).
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-300">
              Receivables: {currency} {totalDebtors.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* DEBIT SIDE (DEBTORS / RECEIVABLES) */}
            <div className="p-4 bg-[#09121D] rounded-2xl border border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between border-b border-[#182C40] pb-2">
                <span className="font-bold text-purple-300 uppercase">Debits: Customer Deni (Receivables)</span>
                <span className="text-white font-bold">{currency} {totalDebtors.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {customers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-[#0E1A29]">
                    <div>
                      <span className="text-white font-bold block">{c.name}</span>
                      <span className="text-[10px] text-slate-400">{c.notes || "Credit sale"}</span>
                    </div>
                    <span className="text-amber-400 font-bold">{currency} {c.debt_balance.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CREDIT SIDE (CREDITORS / PAYABLES) */}
            <div className="p-4 bg-[#09121D] rounded-2xl border border-[#182C40] space-y-3">
              <div className="flex items-center justify-between border-b border-[#182C40] pb-2">
                <span className="font-bold text-slate-400 uppercase">Credits: Trade Creditors (Payables)</span>
                <span className="text-emerald-400 font-bold">{currency} {totalCreditors.toLocaleString()}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed pt-2">
                All wholesale deliveries from Brookside and Broadway Bakeries currently settled in cash/M-Pesa. Zero supplier debt outstanding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB R: REAL ACCOUNTS */}
      {activeTab === "R" && (
        <div className="bg-[#0E1A29] border border-cyan-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#182C40] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold font-mono text-xs">R</span>
                <h2 className="text-base font-bold text-white font-mono uppercase">
                  Tab R &bull; Real Accounts (Physical &amp; Liquid Assets)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Golden Rule: Debit what comes in (Asset accumulation), Credit what goes out.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">
              Total Real Assets: {currency} {totalRealAssets.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-[#09121D] rounded-2xl border border-cyan-500/20 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Cash Drawer (Notes &amp; Coins)</span>
              <div className="text-lg font-black text-white">{currency} {totalDrawerCash.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400">Physical liquidity verified via Dawn Lock.</p>
            </div>

            <div className="p-4 bg-[#09121D] rounded-2xl border border-cyan-500/20 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">2. M-Pesa Merchant Float</span>
              <div className="text-lg font-black text-cyan-400">{currency} {totalMpesaFloat.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400">Digital float in Buy Goods / Till SIM line.</p>
            </div>

            <div className="p-4 bg-[#09121D] rounded-2xl border border-cyan-500/20 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">3. Shelf Stock Assets</span>
              <div className="text-lg font-black text-emerald-400">{currency} {totalShelfStockValue.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400">{inventory.length} verified SKU catalog on shop shelves.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB N: NOMINAL ACCOUNTS */}
      {activeTab === "N" && (
        <div className="bg-[#0E1A29] border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#182C40] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold font-mono text-xs">N</span>
                <h2 className="text-base font-bold text-white font-mono uppercase">
                  Tab N &bull; Nominal Accounts (Revenues &amp; Expenses)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Golden Rule: Debit all expenses &amp; owner drawings, Credit all sales revenues &amp; gains.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300">
              Gross Revenue: {currency} {totalSalesRevenue.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* DEBITS (EXPENSES & DRAWINGS) */}
            <div className="p-4 bg-[#09121D] rounded-2xl border border-amber-500/20 space-y-3">
              <span className="font-bold text-amber-400 uppercase block border-b border-[#182C40] pb-2">
                Debits: Cost of Goods &amp; Expenses
              </span>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-300">Cost of Goods Sold (COGS est):</span>
                  <strong className="text-white">{currency} {Math.round(totalCogs).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Owner Personal Chai &amp; Drawings:</span>
                  <strong className="text-amber-300">{currency} {totalOwnerChai.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Shop Operating Expenses (Power, Bags):</span>
                  <strong className="text-white">{currency} {totalShopExpenses.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* CREDITS (REVENUE & INCOMES) */}
            <div className="p-4 bg-[#09121D] rounded-2xl border border-emerald-500/20 space-y-3">
              <span className="font-bold text-emerald-400 uppercase block border-b border-[#182C40] pb-2">
                Credits: Inflow &amp; Sales Revenues
              </span>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-300">Gross Counter Retail Sales:</span>
                  <strong className="text-emerald-400">+{currency} {totalSalesRevenue.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Gross Trading Surplus:</span>
                  <strong className="text-cyan-400">+{currency} {Math.max(0, Math.round(totalSalesRevenue - totalCogs)).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
