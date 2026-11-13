import React, { useState } from "react";
import { 
  BookOpen, Users, Layers, TrendingUp, ShieldCheck, 
  ArrowRight, DollarSign, Building2, Truck, CheckCircle2, 
  Clock, Package, Plus, Wallet, ChevronRight, ChevronDown
} from "lucide-react";
import { AlacioMasterState, SupplierProfile, PayoutOrDrawing } from "../../types/alacio";

interface ThreeFoldLedgersTabProps {
  state: AlacioMasterState;
  onPaySupplier?: (payoutData: {
    supplierId: string;
    supplierName: string;
    supplierPhone: string;
    supplierNationalId: string;
    amount: number;
    paymentChannel: "NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER";
    tillOrAccount?: string;
    date: string;
    notes?: string;
  }) => void;
}

export default function ThreeFoldLedgersTab({ state, onPaySupplier }: ThreeFoldLedgersTabProps) {
  const { 
    currency = "KSh", 
    salesLedger = [], 
    customers = [], 
    inventory = [], 
    payouts = [], 
    suppliers = [],
    receiptsArchive = [] 
  } = state;

  const [activeTab, setActiveTab] = useState<"P" | "R" | "N">("P");
  
  const isCleanShell = Boolean(state.is_skeleton);

  // Selected Supplier for Individual Sub-Ledger (only use real suppliers on clean/eatery shells)
  const defaultSupplierName = suppliers.length > 0 
    ? suppliers[0].name 
    : (receiptsArchive.length > 0 ? receiptsArchive[0].supplierName : (isCleanShell ? "" : "Jeremiah_bread"));
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>(defaultSupplierName);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payChannel, setPayChannel] = useState<"CASH_DRAWER" | "MPESA_TILL" | "NATIONAL_ID_DEPOSIT">("CASH_DRAWER");
  const [paySuccessToast, setPaySuccessToast] = useState<string | null>(null);

  // Calculations for Personal Accounts (Debtors & Creditors)
  const totalDebtors = customers.reduce((sum, c) => sum + (c.debt_balance || 0), 0);

  // Supplier accounts calculation
  const allSupplierNames = Array.from(new Set([
    ...(!isCleanShell ? ["Jeremiah_bread"] : []),
    ...suppliers.map((s) => s.name),
    ...receiptsArchive.map((r) => r.supplierName)
  ])).filter(Boolean);

  // Selected supplier profile & ledger entries
  const currentSupplierProfile = suppliers.find(
    (s) => s.name.toLowerCase().trim() === selectedSupplierName.toLowerCase().trim()
  ) || {
    id: `supp_${selectedSupplierName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    name: selectedSupplierName || "No Supplier Selected",
    company: selectedSupplierName || "Unassigned",
    phone: isCleanShell ? "Pending KYC" : "0722 000 111",
    national_id: isCleanShell ? "Pending" : "ID-29481023",
    category: "Foodstuff & Bread Wholesale",
    total_orders_cost: 0,
    last_delivery_date: "Pending",
    payment_preference: "CASH_DRAWER" as const,
    supplied_items: []
  };

  // Supplies delivered by this supplier
  const supplierReceipts = receiptsArchive.filter(
    (r) => r.supplierName.toLowerCase().trim() === selectedSupplierName.toLowerCase().trim()
  );

  // If clean shell has no receipts yet, keep empty rather than injecting sample lines
  const deliveredBatches = supplierReceipts.length > 0 || isCleanShell ? supplierReceipts : [
    {
      id: "rcpt_jb_sample_1",
      receiptNumber: "JB-101",
      supplierName: "Jeremiah_bread",
      receiptDate: "2026-11-10",
      totalCost: 524,
      paymentMode: "CASH" as const,
      status: "approved" as const,
      items: [
        { itemName: "Supa Loaf 400gm White", supplyUnitsReceived: 4, lineCost: 240 },
        { itemName: "Supa Loaf 400gm Brown", supplyUnitsReceived: 2, lineCost: 124 },
        { itemName: "Scones 6-Pack", supplyUnitsReceived: 4, lineCost: 160 }
      ]
    },
    {
      id: "rcpt_jb_sample_2",
      receiptNumber: "JB-102",
      supplierName: "Jeremiah_bread",
      receiptDate: "2026-11-11",
      totalCost: 608,
      paymentMode: "CASH" as const,
      status: "approved" as const,
      items: [
        { itemName: "Supa Loaf 400gm White", supplyUnitsReceived: 6, lineCost: 360 },
        { itemName: "Supa Loaf 400gm Brown", supplyUnitsReceived: 4, lineCost: 248 }
      ]
    }
  ];

  // Payouts/settlements made to this supplier
  const supplierPayouts = payouts.filter((p) => 
    p.type === "SUPPLIER_PAYOUT" && 
    (p.notes?.toLowerCase().includes(selectedSupplierName.toLowerCase()) || 
     (p as any).supplierName?.toLowerCase().includes(selectedSupplierName.toLowerCase()))
  );

  const totalDeliveredValue = deliveredBatches.reduce((acc, b) => acc + (Number(b.totalCost) || 0), 0);
  const totalPaidValue = supplierPayouts.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const netSupplierBalanceOwed = Math.max(0, totalDeliveredValue - totalPaidValue);

  // Real Accounts (Physical & Liquid Assets)
  const totalShelfStockValue = inventory.reduce((sum, i) => sum + (Number(i.total_shelf_value) || 0), 0);
  const totalDrawerCash = Number(state.cash_register_balance) || 14200;
  const totalMpesaFloat = Number(state.mpesa_float_balance) || 28300;
  const totalRealAssets = totalShelfStockValue + totalDrawerCash + totalMpesaFloat;

  // Nominal Accounts (Revenues & Expenses)
  const totalSalesRevenue = salesLedger.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const totalCogs = salesLedger.reduce((sum, s) => sum + ((Number(s.total_amount) || 0) * 0.78), 0);
  const totalOwnerChai = payouts.filter(p => p.type === "OWNER_DRAWING").reduce((sum, p) => sum + p.amount, 0);
  const totalShopExpenses = payouts.filter(p => p.type === "BUSINESS_EXPENSE").reduce((sum, p) => sum + p.amount, 0);

  const handleSettleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0 || !onPaySupplier) return;

    onPaySupplier({
      supplierId: currentSupplierProfile.id,
      supplierName: currentSupplierProfile.name,
      supplierPhone: currentSupplierProfile.phone,
      supplierNationalId: currentSupplierProfile.national_id,
      amount: amt,
      paymentChannel: payChannel as any,
      date: new Date().toISOString().slice(0, 10),
      notes: `Settlement for wholesale supply account: ${currentSupplierProfile.name}`
    });

    setPayAmount("");
    setPaySuccessToast(`✓ Settlement of ${currency} ${amt.toLocaleString()} recorded for ${currentSupplierProfile.name}`);
    setTimeout(() => setPaySuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl font-sans text-[#E2ECF3]">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182C40] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <BookOpen className="text-purple-400" size={22} /> 3-Fold Ledgers Matrix
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E3A5F] text-[#38BDF8] border border-[#2D5577]">
              P / R / N Double-Entry Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Classical partitioned ledgers: Personal Accounts (Debtors &amp; Wholesaler Creditors), Real Accounts (Assets), and Nominal Accounts (P&amp;L).
          </p>
        </div>

        {/* 3 TABS LABELLED EXACTLY P, R, AND N */}
        <div className="bg-[#09121D] p-1 rounded-2xl border border-[#182C40] flex items-center gap-1.5 text-xs font-mono self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("P")}
            className={`px-4 py-2 rounded-xl transition font-black cursor-pointer text-sm ${
              activeTab === "P"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-950/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tab P &bull; Personal
          </button>
          <button
            onClick={() => setActiveTab("R")}
            className={`px-4 py-2 rounded-xl transition font-black cursor-pointer text-sm ${
              activeTab === "R"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tab R &bull; Real
          </button>
          <button
            onClick={() => setActiveTab("N")}
            className={`px-4 py-2 rounded-xl transition font-black cursor-pointer text-sm ${
              activeTab === "N"
                ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tab N &bull; Nominal
          </button>
        </div>
      </div>

      {paySuccessToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{paySuccessToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB P: PERSONAL ACCOUNTS (DEBTORS & WHOLESALER SUB-LEDGERS)              */}
      {/* ========================================================================= */}
      {activeTab === "P" && (
        <div className="space-y-6">
          <div className="bg-[#0E1A29] border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#182C40] pb-3 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold font-mono text-xs">P</span>
                  <h2 className="text-base font-bold text-white font-mono uppercase">
                    Tab P &bull; Personal Accounts
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Golden Rule: <em>Debit the Receiver (Customer Deni), Credit the Giver (Suppliers who drop goods).</em>
                </p>
              </div>
              <div className="text-xs font-mono flex items-center gap-4">
                <span className="text-purple-300">Debtors: {currency} {totalDebtors.toLocaleString()}</span>
                <span>&bull;</span>
                <span className="text-amber-300">Supplier Ledger Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* DEBIT SIDE (CUSTOMER DEBTORS) */}
              <div className="p-4 bg-[#09121D] rounded-2xl border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[#182C40] pb-2">
                  <span className="font-bold text-purple-300 uppercase">Debits: Customer Deni Book</span>
                  <span className="text-white font-bold">{currency} {totalDebtors.toLocaleString()}</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {customers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-[#0E1A29] border border-slate-800">
                      <div>
                        <span className="text-white font-bold block">{c.name}</span>
                        <span className="text-[10px] text-slate-400">{c.notes || "Store credit"}</span>
                      </div>
                      <span className="text-amber-400 font-bold">{currency} {c.debt_balance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CREDIT SIDE (TRADE CREDITORS SUMMARY) */}
              <div className="p-4 bg-[#09121D] rounded-2xl border border-[#182C40] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#182C40] pb-2">
                    <span className="font-bold text-slate-300 uppercase">Credits: Trade Creditors (Suppliers)</span>
                    <span className="text-emerald-400 font-bold">{currency} {netSupplierBalanceOwed.toLocaleString()}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed pt-2">
                    Individual wholesale ledgers are maintained below for each supplier (e.g. <strong>Jeremiah_bread</strong>). Deliveries credit their account; settlements debit their account.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Active Wholesalers:</span>
                    <strong className="text-white">{allSupplierNames.length} Accounts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Primary Account:</span>
                    <strong className="text-blue-300">{selectedSupplierName}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* DEDICATED INDIVIDUAL SUPPLIER SUB-LEDGER (e.g. Jeremiah_bread)         */}
          {/* ===================================================================== */}
          <div className="bg-[#0E1A29] border border-blue-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#182C40] pb-3 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono uppercase">
                      Supplier Sub-Ledger: {selectedSupplierName}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Continuous Inward Restock Supplies &amp; Payment Settlements Log
                    </p>
                  </div>
                </div>
              </div>

              {/* SUPPLIER ACCOUNT SELECTOR */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Account:</span>
                <select
                  value={selectedSupplierName}
                  onChange={(e) => setSelectedSupplierName(e.target.value)}
                  className="bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono cursor-pointer"
                >
                  {allSupplierNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SUPPLIER SUMMARY METRICS STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-[#09121D] rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Inward Supplies</span>
                <div className="text-base font-bold text-white">{currency} {totalDeliveredValue.toLocaleString()}</div>
                <span className="text-[10px] text-slate-500">{deliveredBatches.length} delivery notes logged</span>
              </div>

              <div className="p-3.5 bg-[#09121D] rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Settlements Paid</span>
                <div className="text-base font-bold text-emerald-400">{currency} {totalPaidValue.toLocaleString()}</div>
                <span className="text-[10px] text-slate-500">{supplierPayouts.length} disbursements made</span>
              </div>

              <div className="p-3.5 bg-[#09121D] rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Account Balance</span>
                <div className={`text-base font-bold ${netSupplierBalanceOwed > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {netSupplierBalanceOwed > 0 ? `${currency} ${netSupplierBalanceOwed.toLocaleString()} Owed` : "✓ Fully Settled"}
                </div>
                <span className="text-[10px] text-slate-500">National ID: {currentSupplierProfile.national_id}</span>
              </div>
            </div>

            {/* DELIVERIES & SUPPLIES LOG FOR THIS SUPPLIER */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} className="text-blue-400" />
                <span>Inward Deliveries Credited to {selectedSupplierName}:</span>
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {deliveredBatches.map((batch: any, bIdx) => (
                  <div key={batch.id || bIdx} className="p-3 rounded-2xl bg-[#09121D] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Chit #{batch.receiptNumber}</span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-slate-400">{batch.receiptDate}</span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-blue-400 text-[10px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Credit Entry</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Items: {(batch.items || []).map((it: any) => `${it.supplyUnitsReceived || 1}x ${it.itemName}`).join(", ")}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">Supply Cost</span>
                      <span className="font-bold text-white">{currency} {Number(batch.totalCost).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK SETTLEMENT FORM */}
            {onPaySupplier && (
              <form onSubmit={handleSettleSupplierSubmit} className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-xs font-mono">
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Pay / Settle {selectedSupplierName}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={1}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder={`Amount (e.g. ${netSupplierBalanceOwed || 500})`}
                      className="w-full bg-[#080d15] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Payment Channel
                    </label>
                    <select
                      value={payChannel}
                      onChange={(e) => setPayChannel(e.target.value as any)}
                      className="bg-[#080d15] text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono cursor-pointer"
                    >
                      <option value="CASH_DRAWER">Cash Drawer</option>
                      <option value="MPESA_TILL">M-Pesa Till</option>
                      <option value="NATIONAL_ID_DEPOSIT">Agent ID Deposit</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!payAmount || parseFloat(payAmount) <= 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-40 shadow-md shrink-0"
                >
                  Debit Payment
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB R: REAL ACCOUNTS (PHYSICAL ASSETS)                                     */}
      {/* ========================================================================= */}
      {activeTab === "R" && (
        <div className="bg-[#0E1A29] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#182C40] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold font-mono text-xs">R</span>
                <h2 className="text-base font-bold text-white font-mono uppercase">
                  Tab R &bull; Real Accounts (Physical &amp; Liquid Assets)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Golden Rule: <em>Debit what comes in (Asset accumulation), Credit what goes out.</em>
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">
              Total Assets: {currency} {totalRealAssets.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-[#09121D] rounded-2xl border border-cyan-500/20 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Cash Drawer (Notes &amp; Coins)</span>
              <div className="text-lg font-black text-white">{currency} {totalDrawerCash.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400">Physical liquidity verified via Dawn Lock register.</p>
            </div>

            <div className="p-4 bg-[#09121D] rounded-2xl border border-cyan-500/20 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">2. M-Pesa Merchant Float</span>
              <div className="text-lg font-black text-cyan-400">{currency} {totalMpesaFloat.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400">Digital float in Buy Goods / Till SIM line.</p>
            </div>

            <div className="p-4 bg-[#09121D] rounded-2xl border border-cyan-500/20 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">3. Shelf Stock &amp; Inventory</span>
              <div className="text-lg font-black text-white">{currency} {totalShelfStockValue.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400">{inventory.length} active retail SKUs valued at selling price.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB N: NOMINAL ACCOUNTS (REVENUES & EXPENSES)                              */}
      {/* ========================================================================= */}
      {activeTab === "N" && (
        <div className="bg-[#0E1A29] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#182C40] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold font-mono text-xs">N</span>
                <h2 className="text-base font-bold text-white font-mono uppercase">
                  Tab N &bull; Nominal Accounts (P&amp;L Matrix)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Golden Rule: <em>Debit all expenses &amp; losses, Credit all incomes &amp; gains.</em>
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300">
              Net Margin: {currency} {(totalSalesRevenue - totalCogs - totalShopExpenses).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* DEBITS (EXPENSES) */}
            <div className="p-4 bg-[#09121D] rounded-2xl border border-rose-500/20 space-y-3">
              <span className="font-bold text-rose-300 uppercase block border-b border-[#182C40] pb-2">
                Debits: Operating Outflows &amp; COGS
              </span>
              <div className="space-y-2">
                <div className="flex justify-between p-2 rounded-lg bg-[#0E1A29]">
                  <span className="text-slate-300">Cost of Goods Sold (COGS)</span>
                  <span className="text-rose-400 font-bold">{currency} {Math.round(totalCogs).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#0E1A29]">
                  <span className="text-slate-300">Proprietor Drawings (Chai)</span>
                  <span className="text-purple-300 font-bold">{currency} {totalOwnerChai.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#0E1A29]">
                  <span className="text-slate-300">Store Operating Expenses</span>
                  <span className="text-rose-400 font-bold">{currency} {totalShopExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* CREDITS (INCOMES) */}
            <div className="p-4 bg-[#09121D] rounded-2xl border border-emerald-500/20 space-y-3">
              <span className="font-bold text-emerald-300 uppercase block border-b border-[#182C40] pb-2">
                Credits: Gross Realized Sales Inflow
              </span>
              <div className="space-y-2">
                <div className="flex justify-between p-2 rounded-lg bg-[#0E1A29]">
                  <span className="text-slate-300">Counter Retail Sales</span>
                  <span className="text-emerald-400 font-bold">{currency} {totalSalesRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#0E1A29]">
                  <span className="text-slate-300">Recorded Sales Transactions</span>
                  <span className="text-white font-bold">{salesLedger.length} receipts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
