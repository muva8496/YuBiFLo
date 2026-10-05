import React, { useState } from "react";
import { 
  Sun, CheckCircle2, Clock, Package, ArrowRight, ShieldCheck, 
  Coins, Sparkles, Check, RefreshCw, Smartphone, CreditCard, 
  Users, Edit3, Plus, AlertTriangle, Layers, DollarSign, HelpCircle,
  Calendar, CheckSquare
} from "lucide-react";
import { AlacioMasterState, CustomerDebtor, InventoryItem } from "../../types/alacio";

export interface MorningBookendPayload {
  cashFloat: number;
  mpesaFloat: number;
  equitelBalance: number;
  updatedCustomers: CustomerDebtor[];
  openingCounts: { id: string | number; openingStock: number }[];
}

interface MorningBookendTabProps {
  state: AlacioMasterState;
  onConfirmMorningBookend: (payload: MorningBookendPayload) => void;
}

// Date helpers
const getOffsetDateIso = (offsetDays: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
};

export default function MorningBookendTab({ state, onConfirmMorningBookend }: MorningBookendTabProps) {
  const { 
    currency, 
    inventory, 
    customers, 
    cash_register_balance, 
    mpesa_float_balance, 
    equitel_account_balance = 0,
    floatDenominations 
  } = state;

  // 1. Morning Balances State
  const [cashFloat, setCashFloat] = useState<string>(String(cash_register_balance ?? 0));
  const [mpesaFloat, setMpesaFloat] = useState<string>(String(mpesa_float_balance ?? 0));
  const [equitelBalance, setEquitelBalance] = useState<string>(String(equitel_account_balance ?? 0));

  // 2. Debt Editor State with Flexible Date Selection
  const [debtorsList, setDebtorsList] = useState<CustomerDebtor[]>(() => JSON.parse(JSON.stringify(customers)));
  const [newDebtorName, setNewDebtorName] = useState("");
  const [newDebtorAmount, setNewDebtorAmount] = useState("");
  const [newDebtorItem, setNewDebtorItem] = useState("");
  
  // Custom Date Picker & Presets for Forgotten Deni
  const [debtDate, setDebtDate] = useState<string>(getOffsetDateIso(1)); // Default: Yesterday
  const [debtTimeShift, setDebtTimeShift] = useState<string>("Evening Rush");

  // Inline Date Editor for existing debtors
  const [editingDateDebtorId, setEditingDateDebtorId] = useState<string | null>(null);
  const [tempEditedDate, setTempEditedDate] = useState<string>("");

  const [debtSuccessNote, setDebtSuccessNote] = useState<string | null>(null);

  // 3. Opening Shelf Stock Counts State
  const [openingCounts, setOpeningCounts] = useState<{ [id: string]: number }>(() => {
    const map: { [id: string]: number } = {};
    inventory.forEach((i) => {
      map[i.id] = i.current_stock;
    });
    return map;
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate Starting Total Liquidity
  const cashNum = parseFloat(cashFloat) || 0;
  const mpesaNum = parseFloat(mpesaFloat) || 0;
  const equitelNum = parseFloat(equitelBalance) || 0;
  const totalStartingLiquidity = cashNum + mpesaNum + equitelNum;

  // Fast count adjuster for shelf items
  const handleAdjustCount = (id: string, delta: number) => {
    setOpeningCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  // Format date display label
  const formatDateLabel = (dateStr: string, shift: string) => {
    const today = getOffsetDateIso(0);
    const yesterday = getOffsetDateIso(1);
    const twoDaysAgo = getOffsetDateIso(2);

    let prefix = dateStr;
    if (dateStr === today) prefix = "Today";
    else if (dateStr === yesterday) prefix = "Yesterday";
    else if (dateStr === twoDaysAgo) prefix = "2 Days Ago";

    return `${prefix} (${shift || "Catch-up"})`;
  };

  // Debt Editor: Add unlogged debt with customizable date
  const handleAddForgottenDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtorName.trim() || !newDebtorAmount) return;

    const amount = parseFloat(newDebtorAmount) || 0;
    const existingIndex = debtorsList.findIndex(
      (c) => c.name.toLowerCase() === newDebtorName.trim().toLowerCase()
    );

    const formattedDate = formatDateLabel(debtDate, debtTimeShift);

    let updated: CustomerDebtor[];
    if (existingIndex !== -1) {
      updated = [...debtorsList];
      updated[existingIndex] = {
        ...updated[existingIndex],
        debt_balance: updated[existingIndex].debt_balance + amount,
        last_transaction_date: formattedDate,
        notes: newDebtorItem ? `${updated[existingIndex].notes || ""} | +KSh ${amount} (${newDebtorItem} on ${debtDate})` : updated[existingIndex].notes
      };
    } else {
      const newCustomer: CustomerDebtor = {
        id: `cust_${Date.now()}`,
        name: newDebtorName.trim(),
        phone: "07XX XXX XXX",
        debt_balance: amount,
        credit_limit: 1000,
        last_transaction_date: formattedDate,
        notes: newDebtorItem ? `Taken on ${debtDate}: ${newDebtorItem}` : `Credit from ${debtDate}`
      };
      updated = [newCustomer, ...debtorsList];
    }

    setDebtorsList(updated);
    setDebtSuccessNote(`Recorded unlogged deni for ${debtDate}: +${currency} ${amount} for ${newDebtorName.trim()} (${newDebtorItem || "Groceries"}).`);
    setNewDebtorName("");
    setNewDebtorAmount("");
    setNewDebtorItem("");
    setTimeout(() => setDebtSuccessNote(null), 5000);
  };

  // Debt Editor: Quick inline adjustment (+50, +100, etc.)
  const handleQuickAdjustDebt = (id: string, delta: number) => {
    setDebtorsList((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, debt_balance: Math.max(0, c.debt_balance + delta) } : c
      )
    );
  };

  // Debt Editor: Save edited date for an existing debtor
  const handleSaveDebtorDate = (id: string) => {
    if (!tempEditedDate) {
      setEditingDateDebtorId(null);
      return;
    }

    setDebtorsList((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, last_transaction_date: formatDateLabel(tempEditedDate, "Adjusted") } : c
      )
    );
    setEditingDateDebtorId(null);
    setDebtSuccessNote("Debtor transaction date updated successfully!");
    setTimeout(() => setDebtSuccessNote(null), 4000);
  };

  // Lock Morning Baseline & Open Shop
  const handleConfirmAll = () => {
    const payloadOpeningCounts = Object.keys(openingCounts).map((id) => ({
      id,
      openingStock: openingCounts[id]
    }));

    onConfirmMorningBookend({
      cashFloat: cashNum,
      mpesaFloat: mpesaNum,
      equitelBalance: equitelNum,
      updatedCustomers: debtorsList,
      openingCounts: payloadOpeningCounts
    });

    setSuccessMsg(
      `Morning bookend sealed! Cash (${currency} ${cashNum.toLocaleString()}), M-Pesa (${currency} ${mpesaNum.toLocaleString()}), Equitel Paybill (${currency} ${equitelNum.toLocaleString()}) and ${debtorsList.length} customer debts calibrated for today.`
    );
    setTimeout(() => setSuccessMsg(null), 7000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Sun className="text-amber-400" size={24} /> Morning Bookend Screen (Pre-Opening Setup)
            </h2>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              Before Opening Daily
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Fill in starting cash float, M-Pesa till float, and Equitel Paybill account balances. Use the <strong>Debt &amp; Date Editor</strong> to backdate or adjust any unlogged customer credit before opening.
          </p>
        </div>

        <button
          onClick={handleConfirmAll}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Check size={16} /> Lock Balances &amp; Open Shop
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MORNING BOOKEND SUMMARY TRACKING PANEL (CLIENT AUDIT HUB) */}
      {/* ======================================================== */}
      <div className="bg-[#0b1611] border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sun size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                Morning Bookend Baseline Tracker (05:57 AM Dawn Lock)
              </h3>
              <p className="text-[11px] text-slate-400">
                Sealed opening baseline for cash drawer, M-Pesa till, carried-over deni, and shelf stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Dawn Baseline Sealed &bull; Active
            </span>
          </div>
        </div>

        {/* 4 SUMMARY TRACKING CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* 1. STARTING TOTAL LIQUIDITY */}
          <div className="p-3.5 bg-[#060c09] rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block flex items-center gap-1">
              <Coins size={12} className="text-amber-400" /> Starting Total Liquidity
            </span>
            <div className="text-xl font-black font-mono text-emerald-400">
              {currency} {totalStartingLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 font-mono space-y-0.5 pt-1 border-t border-slate-800/80">
              <div className="flex justify-between">
                <span>Drawer Cash:</span>
                <span className="text-slate-300 font-bold">{currency} {cashNum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>M-Pesa SIM Float:</span>
                <span className="text-slate-300 font-bold">{currency} {mpesaNum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Equitel Paybill Line:</span>
                <span className="text-slate-300 font-bold">{currency} {equitelNum.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 2. CARRIED-OVER CUSTOMER DENI */}
          <div className="p-3.5 bg-[#060c09] rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block flex items-center gap-1">
              <Users size={12} className="text-purple-400" /> Carried-Over Customer Deni
            </span>
            <div className="text-xl font-black font-mono text-purple-300">
              {currency} {debtorsList.reduce((acc, c) => acc + c.debt_balance, 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/80 space-y-0.5">
              <div className="flex justify-between">
                <span>Active Debtor Accounts:</span>
                <span className="text-slate-300 font-bold">{debtorsList.length} Families</span>
              </div>
              <div className="flex justify-between">
                <span>With Verified National ID:</span>
                <span className="text-emerald-400 font-bold">{debtorsList.filter(c => c.national_id).length} Verified</span>
              </div>
            </div>
          </div>

          {/* 3. OPENING SHELF STOCK BASELINE */}
          <div className="p-3.5 bg-[#060c09] rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block flex items-center gap-1">
              <Package size={12} className="text-cyan-400" /> Opening Shelf Inventory
            </span>
            <div className="text-xl font-black font-mono text-white">
              {Object.values(openingCounts).reduce((a: number, b: number) => a + b, 0)} Units
            </div>
            <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/80 space-y-0.5">
              <div className="flex justify-between">
                <span>Opening Retail Value:</span>
                <span className="text-slate-300 font-bold">
                  {currency} {inventory.reduce((a, i) => a + (openingCounts[i.id] || i.current_stock) * i.unit_retail, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active FMCG Products:</span>
                <span className="text-slate-300 font-bold">{inventory.length} SKUs</span>
              </div>
            </div>
          </div>

          {/* 4. RECONCILIATION AUDIT LOCK */}
          <div className="p-3.5 bg-[#060c09] rounded-xl border border-slate-800 space-y-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" /> Audit Anchor Status
              </span>
              <div className="text-xs font-bold text-slate-200 mt-1 font-sans">
                Evening Bookend Baseline
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Evening reconciliation will reverse-calculate against these exact numbers to detect leakage down to the shilling.
              </p>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById("step1-liquidity");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold underline cursor-pointer text-left pt-1"
            >
              Re-calibrate Today's Balances &darr;
            </button>
          </div>

        </div>
      </div>

      {/* SECTION 1: STARTING LIQUIDITY & FLOAT BALANCES (CASH, MPESA, EQUITEL PAYBILL) */}
      <div id="step1-liquidity" className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Coins size={16} className="text-emerald-400" /> Step 1: Starting Liquidity &amp; Channel Balances
            </h3>
            <span className="text-[11px] text-slate-400">
              Verify starting balances across Cash Drawer, M-Pesa SIM Float, and Equitel Paybill Account
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Total Morning Liquidity</span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {currency} {totalStartingLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. PHYSICAL DRAWER CASH FLOAT */}
          <div className="p-4 bg-[#060c09] rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <Coins size={15} className="text-amber-400" /> 1. Cash Float (Drawer)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                Notes &amp; Coins
              </span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Starting Cash in Drawer ({currency})</label>
              <input
                type="number"
                value={cashFloat}
                onChange={(e) => setCashFloat(e.target.value)}
                className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-base font-bold focus:border-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Physical starting coins and small notes for customer change.
            </p>
          </div>

          {/* 2. M-PESA FLOAT (SIM / TILL) */}
          <div className="p-4 bg-[#060c09] rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <Smartphone size={15} className="text-emerald-400" /> 2. M-Pesa Float
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                Safaricom SIM
              </span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Active Float Balance ({currency})</label>
              <input
                type="number"
                value={mpesaFloat}
                onChange={(e) => setMpesaFloat(e.target.value)}
                className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono text-base font-bold focus:border-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Held on Safaricom phone for cash-ins, float swaps, and direct customer sends.
            </p>
          </div>

          {/* 3. EQUITEL LINE ACCOUNT (PAYBILL SETTLEMENT) */}
          <div className="p-4 bg-[#060c09] rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <CreditCard size={15} className="text-cyan-400" /> 3. Equitel Paybill Line
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                Equity Bank Line
              </span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Equitel Line Balance ({currency})</label>
              <input
                type="number"
                value={equitelBalance}
                onChange={(e) => setEquitelBalance(e.target.value)}
                className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2.5 text-cyan-400 font-mono text-base font-bold focus:border-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Money collected from M-Pesa Paybill sweeps directly into this Equitel line account.
            </p>
          </div>

        </div>
      </div>

      {/* SECTION 2: DEBT & DATE EDITOR (ANY CUSTOM DATE CATCH-UP) */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Users size={16} className="text-amber-400" /> Step 2: Unrecorded Debt &amp; Date Editor (Catch-Up Deni Logger)
              </h3>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                Editable Any Date
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Did a customer take goods on credit yesterday, 2 days ago, or earlier and you forgot to log it? Pick or edit any exact date and time shift below to keep your ledger accurate.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-amber-300 shrink-0">
            Total Outstanding Credit: {currency} {debtorsList.reduce((a, c) => a + c.debt_balance, 0).toLocaleString()}
          </span>
        </div>

        {debtSuccessNote && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in font-mono">
            <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
            <span>{debtSuccessNote}</span>
          </div>
        )}

        {/* QUICK ADD UNLOGGED DEBT FORM WITH CUSTOM DATE PICKER */}
        <form onSubmit={handleAddForgottenDebt} className="p-4 bg-[#060c09] rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
              <Plus size={14} className="text-emerald-400" /> Add Unrecorded Credit (Choose Any Date)
            </span>

            {/* QUICK DATE PRESET BUTTONS */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
              <span className="text-slate-500 mr-1">Quick Dates:</span>
              <button
                type="button"
                onClick={() => setDebtDate(getOffsetDateIso(0))}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${debtDate === getOffsetDateIso(0) ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDebtDate(getOffsetDateIso(1))}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${debtDate === getOffsetDateIso(1) ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setDebtDate(getOffsetDateIso(2))}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${debtDate === getOffsetDateIso(2) ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                2 Days Ago
              </button>
              <button
                type="button"
                onClick={() => setDebtDate(getOffsetDateIso(3))}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${debtDate === getOffsetDateIso(3) ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                3 Days Ago
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            {/* 1. DATE PICKER INPUT */}
            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-amber-400" /> Transaction Date
              </label>
              <input
                type="date"
                required
                value={debtDate}
                onChange={(e) => setDebtDate(e.target.value)}
                className="w-full bg-[#0a1510] border border-amber-500/50 rounded-xl p-2.5 text-white font-mono"
              />
            </div>

            {/* 2. CUSTOMER NAME */}
            <div>
              <label className="text-slate-400 block mb-1">Customer / Debtor</label>
              <input
                type="text"
                required
                value={newDebtorName}
                onChange={(e) => setNewDebtorName(e.target.value)}
                placeholder="e.g. Mama Boi, Pastor John"
                className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            {/* 3. AMOUNT OWED */}
            <div>
              <label className="text-slate-400 block mb-1">Amount Owed ({currency})</label>
              <input
                type="number"
                required
                min={1}
                value={newDebtorAmount}
                onChange={(e) => setNewDebtorAmount(e.target.value)}
                placeholder="e.g. 150"
                className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>

            {/* 4. ITEM TAKEN & SHIFT */}
            <div>
              <label className="text-slate-400 block mb-1">Item Taken</label>
              <input
                type="text"
                value={newDebtorItem}
                onChange={(e) => setNewDebtorItem(e.target.value)}
                placeholder="e.g. Milk 500ml x2, Sugar"
                className="w-full bg-[#0a1510] border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            {/* 5. SUBMIT BUTTON */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow font-mono text-xs"
              >
                <Plus size={14} /> Record Deni ({debtDate})
              </button>
            </div>
          </div>
        </form>

        {/* ACTIVE DEBTORS LIST WITH INLINE DATE EDITORS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
              Active Debtors &amp; Recorded Dates ({debtorsList.length} Customers)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Click the date or pencil to change any debtor's transaction date
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {debtorsList.map((debtor) => (
              <div
                key={debtor.id}
                className="p-3 bg-[#060c09] border border-slate-800 rounded-xl flex flex-col justify-between space-y-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white block">{debtor.name}</span>
                    <span className="font-mono font-bold text-amber-400 shrink-0">
                      {currency} {debtor.debt_balance.toLocaleString()}
                    </span>
                  </div>

                  {/* EDITABLE DATE SECTION */}
                  <div className="flex items-center gap-1.5">
                    {editingDateDebtorId === debtor.id ? (
                      <div className="flex items-center gap-1 w-full bg-[#0a1510] p-1 rounded border border-amber-500/40">
                        <input
                          type="date"
                          value={tempEditedDate}
                          onChange={(e) => setTempEditedDate(e.target.value)}
                          className="bg-transparent text-white font-mono text-[10px] w-full focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveDebtorDate(debtor.id)}
                          className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 rounded text-[9px] font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDateDebtorId(null)}
                          className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDateDebtorId(debtor.id);
                          setTempEditedDate(getOffsetDateIso(1));
                        }}
                        className="flex items-center gap-1 text-[10px] text-slate-400 font-mono hover:text-amber-300 bg-slate-800/40 hover:bg-slate-800 px-1.5 py-0.5 rounded transition cursor-pointer"
                        title="Click to edit date"
                      >
                        <Calendar size={11} className="text-amber-400" />
                        <span>{debtor.last_transaction_date}</span>
                        <Edit3 size={10} className="text-slate-500 ml-0.5" />
                      </button>
                    )}
                  </div>

                  {debtor.notes && (
                    <span className="text-[10px] text-slate-400 italic block truncate max-w-[200px]">
                      {debtor.notes}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-mono">Quick Adjust:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickAdjustDebt(debtor.id, 50)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono cursor-pointer"
                    >
                      +50
                    </button>
                    <button
                      onClick={() => handleQuickAdjustDebt(debtor.id, 100)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono cursor-pointer"
                    >
                      +100
                    </button>
                    <button
                      onClick={() => handleQuickAdjustDebt(debtor.id, -50)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-red-300 rounded text-[10px] font-mono cursor-pointer"
                    >
                      -50
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 3: OPENING SHELF STOCK CONFIRMATION */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Package size={15} className="text-emerald-400" /> Step 3: Confirm Opening Shelf Stock ({inventory.length} Items)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Fast tap +/- to adjust if items moved overnight
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {inventory.map((item) => {
            const count = openingCounts[item.id] !== undefined ? openingCounts[item.id] : item.current_stock;
            return (
              <div 
                key={item.id}
                className="p-3 bg-[#060c09] border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {currency} {item.unit_retail} / {item.unit_type}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <button
                    onClick={() => handleAdjustCount(String(item.id), -1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-white text-sm">
                    {count}
                  </span>
                  <button
                    onClick={() => handleAdjustCount(String(item.id), 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM SUMMARY & SEAL BAR */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono">
            <span>Starting Shelf Capital: </span>
            <strong className="text-white">
              {currency} {inventory.reduce((a, i) => a + (openingCounts[i.id] || i.current_stock) * i.unit_retail, 0).toLocaleString()}
            </strong>
            <span className="mx-2">&bull;</span>
            <span>Total Starting Liquidity: </span>
            <strong className="text-emerald-400">{currency} {totalStartingLiquidity.toLocaleString()}</strong>
          </div>

          <button
            onClick={handleConfirmAll}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <span>Lock Morning Baseline &amp; Open Shop</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* HISTORICAL MORNING BASELINES & AUDIT TRAIL LOG           */}
      {/* ======================================================== */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Morning Bookends History &amp; Dawn Baseline Audit Trail
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {state.morning_bookends?.length || 2} Recorded Morning Baselines
          </span>
        </div>

        <div className="space-y-3">
          {(state.morning_bookends && state.morning_bookends.length > 0 ? state.morning_bookends : [
            {
              id: "mb_today",
              date: "Today",
              timestamp: "05:57 AM (Dawn Lock)",
              cash_float: 655,
              mpesa_float: 3850,
              equitel_balance: 14250,
              total_liquidity: 18755,
              debtors_count: 3,
              total_customer_debt: 1040,
              opening_shelf_units: 324,
              opening_shelf_value: 35545,
              status: "LOCKED_DAWN" as const,
              notes: "Dawn baseline sealed: Cash drawer verified across 10 denominations, M-Pesa till active, yesterday deni calibrated."
            },
            {
              id: "mb_yesterday",
              date: "Yesterday",
              timestamp: "05:58 AM (Dawn Lock)",
              cash_float: 720,
              mpesa_float: 4100,
              equitel_balance: 13500,
              total_liquidity: 18320,
              debtors_count: 3,
              total_customer_debt: 990,
              opening_shelf_units: 338,
              opening_shelf_value: 36800,
              status: "LOCKED_DAWN" as const,
              notes: "Prior day baseline sealed cleanly."
            }
          ]).map((record) => (
            <div
              key={record.id}
              className="p-4 bg-[#060c09] border border-slate-800 rounded-xl space-y-2 text-xs font-mono"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-sans text-sm">{record.date}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {record.timestamp}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {record.status === "LOCKED_DAWN" ? "✓ Baseline Sealed" : "In Progress"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 text-[11px]">Total Starting Liquidity: </span>
                  <strong className="text-emerald-400 text-sm">{currency} {record.total_liquidity.toLocaleString()}</strong>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Cash Drawer</span>
                  <span className="text-white font-bold">{currency} {record.cash_float.toLocaleString()}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">M-Pesa Till / Float</span>
                  <span className="text-cyan-400 font-bold">{currency} {record.mpesa_float.toLocaleString()}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Equitel Paybill Line</span>
                  <span className="text-slate-200 font-bold">{currency} {record.equitel_balance.toLocaleString()}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Carried-Over Deni</span>
                  <span className="text-purple-300 font-bold">{currency} {record.total_customer_debt.toLocaleString()} ({record.debtors_count} debts)</span>
                </div>
              </div>

              {record.notes && (
                <div className="text-[10px] text-slate-400 bg-[#0a1510] p-2 rounded border border-slate-800/80">
                  {record.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
