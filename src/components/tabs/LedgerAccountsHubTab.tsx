import React, { useState } from "react";
import { 
  BookOpen, Users, Building2, Coins, ArrowRight, 
  TrendingUp, TrendingDown, Scale, ShieldCheck, 
  DollarSign, Smartphone, Plus, CheckCircle2, ChevronRight,
  Sparkles, Layers
} from "lucide-react";
import { AlacioMasterState, CustomerDebtor, SupplierProfile, SalesLedgerItem, PayoutOrDrawing } from "../../types/alacio";

interface LedgerAccountsHubTabProps {
  state: AlacioMasterState;
  onNavigateTab?: (tabId: string) => void;
}

type LedgerCategory = "all" | "personal" | "real" | "nominal";

export default function LedgerAccountsHubTab({ state, onNavigateTab }: LedgerAccountsHubTabProps) {
  const { 
    currency, 
    customers, 
    suppliers = [], 
    cash_register_balance, 
    mpesa_float_balance, 
    equitel_account_balance,
    inventory,
    warehouse,
    salesLedger,
    payouts,
    kpis
  } = state;

  const [activeCategory, setActiveCategory] = useState<LedgerCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // 1. PERSONAL ACCOUNTS (DEBTORS & CREDITORS)
  // Rule: Debit the Receiver, Credit the Giver
  // ==========================================
  const totalDebtorsBalance = customers.reduce((acc, c) => acc + c.debt_balance, 0);
  
  // Suppliers creditors (purchases on credit / pending settlements)
  const totalSuppliersOrders = suppliers.reduce((acc, s) => acc + (s.total_orders_cost || 0), 0);
  const totalCreditorsBalance = suppliers.reduce((acc, s) => {
    // Estimating credit buffer if supplier payment is on credit
    return acc + (s.payment_preference === "NATIONAL_ID_DEPOSIT" ? 0 : 0);
  }, 0);

  // ==========================================
  // 2. REAL ACCOUNTS (ASSETS)
  // Rule: Debit What Comes In, Credit What Goes Out
  // ==========================================
  const cashAsset = cash_register_balance;
  const mpesaAsset = mpesa_float_balance || 0;
  const equitelAsset = equitel_account_balance || 0;
  const totalLiquidCash = cashAsset + mpesaAsset + equitelAsset;

  const shelfStockAsset = inventory.reduce((acc, i) => acc + (i.current_stock * i.unit_cost), 0);
  const warehouseStockAsset = warehouse.reduce((acc, b) => acc + (b.bulk_quantity * b.bulk_cost_per_unit), 0);
  const totalInventoryAsset = shelfStockAsset + warehouseStockAsset;

  // Fixed Asset estimates (Counter display, digital scale, cooler)
  const fixedAssetsTotal = 45000; // Counter fittings, electronic scale, deep freezer

  const totalRealAssets = totalLiquidCash + totalInventoryAsset + fixedAssetsTotal;

  // ==========================================
  // 3. NOMINAL ACCOUNTS (REVENUE & EXPENSES)
  // Rule: Debit All Expenses & Losses, Credit All Incomes & Gains
  // ==========================================
  const grossSalesRevenue = salesLedger.reduce((acc, s) => acc + s.total_amount, 0);
  const totalCogs = salesLedger.reduce((acc, s) => acc + (s.total_amount * 0.8), 0); // Estimated COGS
  
  // Expenses breakdown
  const supplierPayouts = payouts.filter((p) => p.type === "SUPPLIER_PAYOUT").reduce((acc, p) => acc + p.amount, 0);
  const ownerDrawings = payouts.filter((p) => p.type === "OWNER_DRAWING").reduce((acc, p) => acc + p.amount, 0);
  const businessExpenses = payouts.filter((p) => p.type === "BUSINESS_EXPENSE").reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = supplierPayouts + ownerDrawings + businessExpenses;

  const netOperatingProfit = grossSalesRevenue - totalCogs - businessExpenses;

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <BookOpen className="text-emerald-400" size={24} /> Classical Ledgers Matrix // Triple-Account Hub
            </h2>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
              Golden Rules Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Formal double-entry accounting: <strong>Personal Accounts</strong> (Debtors &amp; Creditors), <strong>Real Accounts</strong> (Liquid &amp; Inventory Assets), and <strong>Nominal Accounts</strong> (Revenues, COGS &amp; Owner Drawings).
          </p>
        </div>

        {/* TOP LEVEL NAVIGATION TOGGLES */}
        <div className="flex items-center gap-1.5 bg-[#0a130f] p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
              activeCategory === "all" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setActiveCategory("personal")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
              activeCategory === "personal" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            1. Personal
          </button>
          <button
            onClick={() => setActiveCategory("real")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
              activeCategory === "real" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            2. Real (Assets)
          </button>
          <button
            onClick={() => setActiveCategory("nominal")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
              activeCategory === "nominal" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            3. Nominal (P&amp;L)
          </button>
        </div>
      </div>

      {/* GOLDEN RULES OF ACCOUNTING TELEMETRY PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GOLDEN RULE 1 */}
        <div className="p-4 bg-[#111019] border-2 border-purple-500/40 rounded-2xl space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1">
              <Users size={13} /> Golden Rule #1: Personal
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
              Debtors &amp; Creditors
            </span>
          </div>
          <div className="text-sm font-bold text-white font-serif">
            "Debit the Receiver &bull; Credit the Giver"
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Customer takes credit (DR - Receiver). Customer pays back (CR - Giver). Total Debtors: <strong className="text-purple-300">{currency} {totalDebtorsBalance.toLocaleString()}</strong>.
          </p>
        </div>

        {/* GOLDEN RULE 2 */}
        <div className="p-4 bg-[#0a1716] border-2 border-cyan-500/40 rounded-2xl space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
              <Coins size={13} /> Golden Rule #2: Real
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
              Assets &amp; Cash
            </span>
          </div>
          <div className="text-sm font-bold text-white font-serif">
            "Debit What Comes In &bull; Credit What Goes Out"
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Cash, Till floats, and Bulk/Shelf inventory. Total Real Assets: <strong className="text-cyan-300">{currency} {totalRealAssets.toLocaleString()}</strong>.
          </p>
        </div>

        {/* GOLDEN RULE 3 */}
        <div className="p-4 bg-[#181308] border-2 border-amber-500/40 rounded-2xl space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1">
              <Scale size={13} /> Golden Rule #3: Nominal
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              Revenues &amp; Expenses
            </span>
          </div>
          <div className="text-sm font-bold text-white font-serif">
            "Debit All Expenses &bull; Credit All Gains"
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Sales, COGS, Owner drawings, and utility tokens. Net Margin Realized: <strong className="text-amber-300">{kpis.avg_markup_percentage}% Avg</strong>.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: PERSONAL ACCOUNTS (DEBTORS & CREDITORS)                   */}
      {/* ==================================================================== */}
      {(activeCategory === "all" || activeCategory === "personal") && (
        <div className="bg-[#0c1411] border-2 border-purple-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="text-purple-400" size={18} />
                <h3 className="text-base font-bold text-white font-mono uppercase">
                  1. Personal Accounts Ledger (Debtors &amp; Creditors)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Counterparty identities: Counter customers taking food on credit (Debtors) and Wholesale distributors supplying stock on terms (Creditors).
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Net Receivables</span>
              <strong className="text-purple-300 text-base">{currency} {totalDebtorsBalance.toLocaleString()}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SUB-LEDGER A: CUSTOMERS DEBTORS */}
            <div className="p-4 bg-[#060c09] border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-purple-300 uppercase">Debtors Ledger (Accounts Receivable)</span>
                <span className="text-[10px] text-slate-400">{customers.length} accounts</span>
              </div>
              <div className="space-y-2">
                {customers.map((c) => (
                  <div key={c.id} className="p-2.5 bg-[#0a100d] rounded-lg border border-slate-800/80 flex justify-between items-center">
                    <div>
                      <div className="text-white font-bold font-sans">{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {c.national_id || "Unregistered"} &bull; Phone: {c.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${c.debt_balance > 0 ? "text-purple-300" : "text-emerald-400"}`}>
                        {currency} {c.debt_balance.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500">Limit: {currency} {c.credit_limit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUB-LEDGER B: SUPPLIERS CREDITORS */}
            <div className="p-4 bg-[#060c09] border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-300 uppercase">Creditors Ledger (Accounts Payable)</span>
                <span className="text-[10px] text-slate-400">{suppliers.length} distributors</span>
              </div>
              <div className="space-y-2">
                {suppliers.slice(0, 4).map((s) => (
                  <div key={s.id} className="p-2.5 bg-[#0a100d] rounded-lg border border-slate-800/80 flex justify-between items-center">
                    <div>
                      <div className="text-white font-bold font-sans">{s.company || s.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Pref: {s.payment_preference.replace(/_/g, " ")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-cyan-400 font-bold">{currency} {(s.total_orders_cost || 0).toLocaleString()}</div>
                      <span className="text-[10px] text-emerald-400">Paid / Current</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: REAL ACCOUNTS (TANGIBLE ASSETS & INVENTORY MERCHANDISE)   */}
      {/* ==================================================================== */}
      {(activeCategory === "all" || activeCategory === "real") && (
        <div className="bg-[#0c1411] border-2 border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="text-cyan-400" size={18} />
                <h3 className="text-base font-bold text-white font-mono uppercase">
                  2. Real Accounts Ledger (Tangible Assets &amp; Stock Capital)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Assets owned by the business: Physical cash float, electronic tills, front shelf stock, and backroom warehouse bulk lots.
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Total Real Asset Value</span>
              <strong className="text-cyan-300 text-base">{currency} {totalRealAssets.toLocaleString()}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            {/* REAL ASSET 1: PHYSICAL CASH DRAWER */}
            <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Physical Cash Drawer</span>
              <div className="text-lg font-black text-white">{currency} {cashAsset.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-400 block">Verified Drawer Notes &amp; Coins</span>
            </div>

            {/* REAL ASSET 2: M-PESA & EQUITEL ELECTRONIC TILL */}
            <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Electronic Till Lines</span>
              <div className="text-lg font-black text-cyan-400">{currency} {(mpesaAsset + equitelAsset).toLocaleString()}</div>
              <span className="text-[10px] text-slate-400 block">M-Pesa 9382104 + Equitel 1450180372031</span>
            </div>

            {/* REAL ASSET 3: RETAIL DISPLAY SHELF STOCK */}
            <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Front Shelf Inventory</span>
              <div className="text-lg font-black text-emerald-400">{currency} {shelfStockAsset.toLocaleString()}</div>
              <span className="text-[10px] text-slate-400 block">{inventory.length} Stocked display SKUs</span>
            </div>

            {/* REAL ASSET 4: WAREHOUSE BULK RESERVES */}
            <div className="p-3 bg-[#060c09] rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Warehouse Bulk Reserve</span>
              <div className="text-lg font-black text-purple-300">{currency} {warehouseStockAsset.toLocaleString()}</div>
              <span className="text-[10px] text-slate-400 block">{warehouse.length} Bulk wholesale batches</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: NOMINAL ACCOUNTS (REVENUES, COGS & OWNER EXPENSES)        */}
      {/* ==================================================================== */}
      {(activeCategory === "all" || activeCategory === "nominal") && (
        <div className="bg-[#0c1411] border-2 border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="text-amber-400" size={18} />
                <h3 className="text-base font-bold text-white font-mono uppercase">
                  3. Nominal Accounts Ledger (Revenues &amp; Expenses P&amp;L)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Income and Expense flows: Sales revenues credited; restock costs, owner drawings, and daily overhead expenses debited.
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Operating Gross Margin</span>
              <strong className="text-amber-300 text-base">{currency} {(grossSalesRevenue - totalCogs).toLocaleString()}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* CREDITS (INCOMES & REVENUES) */}
            <div className="p-4 bg-[#060c09] border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-bold uppercase">CREDIT (Revenues &amp; Incomes)</span>
                <span className="text-[10px] text-slate-400">{salesLedger.length} transactions</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Supply-Driven &amp; OTC Sales</span>
                  <span className="text-emerald-400 font-bold">{currency} {grossSalesRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Customer Debt Repayments Collected</span>
                  <span className="text-white font-bold">{currency} 0</span>
                </div>
              </div>
            </div>

            {/* DEBITS (EXPENSES, COGS & DRAWINGS) */}
            <div className="p-4 bg-[#060c09] border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-red-400 font-bold uppercase">DEBIT (Expenses &amp; Drawings)</span>
                <span className="text-[10px] text-slate-400">{payouts.length} outflows</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Wholesale COGS (Merchandise Cost)</span>
                  <span className="text-slate-300 font-bold">{currency} {totalCogs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Owner Drawings (Personal &amp; Lunch)</span>
                  <span className="text-purple-300 font-bold">{currency} {ownerDrawings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Business Expenses &amp; Utility Tokens</span>
                  <span className="text-amber-300 font-bold">{currency} {businessExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
