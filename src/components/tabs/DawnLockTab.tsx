import React, { useState } from "react";
import { 
  Sun, Lock, Unlock, CheckCircle2, ShieldCheck, 
  Coins, Smartphone, Building2, Calendar, CreditCard,
  Plus, RefreshCw, ArrowRight, Wallet
} from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";

interface DawnLockTabProps {
  state: AlacioMasterState;
  onUpdateFloat?: (data: {
    cashBalance: number;
    mpesaFloat: number;
    bankPaybillBalance: number;
    operatingDate: string;
    bankName?: string;
  }) => void;
  onNavigateTab?: (tabId: string) => void;
}

export default function DawnLockTab({
  state,
  onUpdateFloat,
  onNavigateTab
}: DawnLockTabProps) {
  const { currency = "KSh", cash_register_balance = 8450, mpesa_float_balance = 28300, equitel_account_balance = 14200, morning_bookends = [] } = state;

  // Operating date state with quick selectors
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgoStr = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);
  const [operatingDate, setOperatingDate] = useState<string>(todayStr);

  // 3 Core Liquidity Channels
  const [cashBalanceInput, setCashBalanceInput] = useState<number>(cash_register_balance || 8450);
  const [mpesaFloatInput, setMpesaFloatInput] = useState<number>(mpesa_float_balance || 28300);
  const [bankPaybillInput, setBankPaybillInput] = useState<number>(equitel_account_balance || 14200);
  const [selectedBankChannel, setSelectedBankChannel] = useState<string>("Equity Bank Paybill / Account");

  // Lock State
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [lockedTime, setLockedTime] = useState<string>("05:57 AM");
  const [lockFeedback, setLockFeedback] = useState<string | null>(null);

  // Total Starting Liquidity across all 3 channels
  const totalStartingLiquidity = (Number(cashBalanceInput) || 0) + 
                                (Number(mpesaFloatInput) || 0) + 
                                (Number(bankPaybillInput) || 0);

  const handleConfirmAndLock = () => {
    setIsLocked(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLockedTime(nowTime);

    if (onUpdateFloat) {
      onUpdateFloat({
        cashBalance: cashBalanceInput,
        mpesaFloat: mpesaFloatInput,
        bankPaybillBalance: bankPaybillInput,
        operatingDate,
        bankName: selectedBankChannel
      });
    }

    setLockFeedback(
      `✓ Dawn Float successfully locked for ${operatingDate} at ${nowTime}. Total Starting Liquidity across Cash, M-Pesa & Bank: ${currency} ${totalStartingLiquidity.toLocaleString()}`
    );
    setTimeout(() => setLockFeedback(null), 5000);
  };

  const handleQuickAdd = (channel: "cash" | "mpesa" | "bank", amount: number) => {
    if (isLocked) return;
    if (channel === "cash") setCashBalanceInput((prev) => Math.max(0, (Number(prev) || 0) + amount));
    if (channel === "mpesa") setMpesaFloatInput((prev) => Math.max(0, (Number(prev) || 0) + amount));
    if (channel === "bank") setBankPaybillInput((prev) => Math.max(0, (Number(prev) || 0) + amount));
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans text-slate-900 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER                                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Sun className="text-amber-500" size={24} /> Dawn Lock &bull; Morning Liquidity
            </h1>
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
              isLocked 
                ? "bg-emerald-50 text-emerald-800 border-emerald-300" 
                : "bg-amber-50 text-amber-800 border-amber-300"
            }`}>
              {isLocked ? `Locked at ${lockedTime}` : "Unlocked: Setting Baseline"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Different MSMEs have different payment channels where customer money goes. For an MSME doing shop trade and mobile money, there are 3 channels: <strong>M-Pesa Float</strong> (agent/merchant), <strong>Bank Paybill Account Balance</strong> (e.g. Equity Bank), and <strong>Cash Balance</strong>. Lock in these 3 baselines once at morning dawn. Fast total entry — no counting every denomination to the last coin, and <strong>no tedious evening checks</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isLocked ? (
            <button
              onClick={() => setIsLocked(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Unlock size={14} />
              <span>Unlock Float Channels</span>
            </button>
          ) : (
            <button
              onClick={handleConfirmAndLock}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Lock size={14} />
              <span>Confirm &amp; Lock Dawn Float</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {lockFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in shadow-2xs font-medium">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{lockFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OPERATING DATE SELECTOR BAR (BACKDATING SUPPORT)                       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-500" />
            <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
              Dawn Operating Date:
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              {operatingDate === todayStr ? "Today" : operatingDate === yesterdayStr ? "Yesterday" : "Backdated"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Lock opening baseline for today&apos;s trade or backdate past operating days.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setOperatingDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
              operatingDate === todayStr 
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-2xs" 
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setOperatingDate(yesterdayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
              operatingDate === yesterdayStr 
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-2xs" 
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setOperatingDate(twoDaysAgoStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
              operatingDate === twoDaysAgoStr 
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-2xs" 
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            2 Days Ago
          </button>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <input
              type="date"
              value={operatingDate}
              onChange={(e) => setOperatingDate(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-mono focus:outline-none cursor-pointer"
              title="Select custom date"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOTAL STARTING LIQUIDITY CALLOUT                                       */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-mono uppercase font-bold tracking-wider">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Total Morning Starting Liquidity</span>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-black text-white mt-1">
            {currency} {totalStartingLiquidity.toLocaleString()}
          </div>
          <p className="text-xs text-blue-200/80 mt-1">
            Opening cash, M-Pesa float, and bank paybill balances are locked at dawn. Once locked, turnover is tracked automatically throughout trade without needing evening checks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-right">
            <span className="text-[10px] text-blue-200 font-mono block uppercase">Status</span>
            <span className="text-xs font-bold text-emerald-300 font-mono">
              {isLocked ? "✓ LOCKED AT DAWN" : "EDITING BASELINES"}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. THE 3 CHANNELS OF MONEY (NO COIN-BY-COIN COUNTING)                     */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase font-mono tracking-wider">
            The 3 Inbound Payment Channels
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Fast entry &bull; No denomination counting to the last coin &bull; No evening checks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* CHANNEL 1: CASH DRAWER / HARD CASH */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4 hover:border-amber-400/60 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Coins size={22} />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                Channel 1: Cash
              </span>
            </div>

            <div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                Drawer Cash in Hand
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total opening hard cash in till. No counting every coin.
              </p>
            </div>

            <div className="pt-1">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                Cash Balance ({currency})
              </label>
              {isLocked ? (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xl font-mono font-bold text-slate-900">
                  {currency} {(Number(cashBalanceInput) || 0).toLocaleString()}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">{currency}</span>
                    <input
                      type="number"
                      min={0}
                      value={cashBalanceInput}
                      onChange={(e) => setCashBalanceInput(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-white border-2 border-amber-500/40 focus:border-amber-500 rounded-2xl pl-12 pr-3 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd("cash", 500)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      +500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd("cash", 1000)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      +1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd("cash", 5000)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      +5,000
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Counter Change &amp; Float</span>
              <span className="font-mono text-amber-700 font-semibold">Ready for Trade</span>
            </div>
          </div>

          {/* CHANNEL 2: M-PESA FLOAT */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4 hover:border-emerald-400/60 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Smartphone size={22} />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Channel 2: M-Pesa
              </span>
            </div>

            <div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                M-Pesa Merchant / Agent Float
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Deposit float on M-Pesa Agent SIM or Till Buy Goods balance.
              </p>
            </div>

            <div className="pt-1">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                M-Pesa Float Balance ({currency})
              </label>
              {isLocked ? (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xl font-mono font-bold text-slate-900">
                  {currency} {(Number(mpesaFloatInput) || 0).toLocaleString()}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">{currency}</span>
                    <input
                      type="number"
                      min={0}
                      value={mpesaFloatInput}
                      onChange={(e) => setMpesaFloatInput(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-white border-2 border-emerald-500/40 focus:border-emerald-500 rounded-2xl pl-12 pr-3 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd("mpesa", 1000)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      +1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd("mpesa", 5000)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      +5,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd("mpesa", 10000)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      +10,000
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Safaricom Line Balance</span>
              <span className="font-mono text-emerald-700 font-semibold">Verified SIM</span>
            </div>
          </div>

          {/* CHANNEL 3: BANK / PAYBILL ACCOUNT (EQUITY, KCB, CO-OP) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4 hover:border-blue-400/60 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Building2 size={22} />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                Channel 3: Bank / Paybill
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-slate-900 text-base">
                  Bank / Paybill Balance
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Equity Bank, KCB, or Bank Paybill settlement account.
              </p>
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Account Balance ({currency})
                </label>
                {!isLocked && (
                  <select
                    value={selectedBankChannel}
                    onChange={(e) => setSelectedBankChannel(e.target.value)}
                    className="text-[10px] font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
                  >
                    <option value="Equity Bank Paybill / Account">Equity Bank</option>
                    <option value="KCB Bank Paybill">KCB Bank</option>
                    <option value="Co-operative Bank">Co-op Bank</option>
                    <option value="Stanbic Bank Paybill">Stanbic Bank</option>
                    <option value="Other Bank Paybill">Other Bank Paybill</option>
                  </select>
                )}
              </div>

              {isLocked ? (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xl font-mono font-bold text-slate-900">
                  {currency} {(Number(bankPaybillInput) || 0).toLocaleString()}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">{currency}</span>
                    <input
                      type="number"
                      min={0}
                      value={bankPaybillInput}
                      onChange={(e) => setBankPaybillInput(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-white border-2 border-blue-500/40 focus:border-blue-500 rounded-2xl pl-12 pr-3 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd("bank", 1000)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      +1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd("bank", 5000)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      +5,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd("bank", 10000)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      +10,000
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="truncate max-w-[150px]">{selectedBankChannel}</span>
              <span className="font-mono text-blue-700 font-semibold shrink-0">Opening Balance</span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SUMMARY AUDIT TRAIL: RECENT MORNING DAWN LOCKS                         */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Dawn Float Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified opening float records across Cash, M-Pesa, and Bank accounts.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
            {morning_bookends.length > 0 ? `${morning_bookends.length} Days Logged` : "1 Day Active"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Cash Drawer</th>
                <th className="py-2 px-3">M-Pesa Float</th>
                <th className="py-2 px-3">Bank / Paybill</th>
                <th className="py-2 px-3 text-right">Total Dawn Liquidity</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-xs">
              <tr className="bg-emerald-50/40">
                <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                  {operatingDate} (Active Day)
                </td>
                <td className="py-2.5 px-3">
                  {currency} {cashBalanceInput.toLocaleString()}
                </td>
                <td className="py-2.5 px-3">
                  {currency} {mpesaFloatInput.toLocaleString()}
                </td>
                <td className="py-2.5 px-3">
                  {currency} {bankPaybillInput.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                  {currency} {totalStartingLiquidity.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-center font-sans">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {isLocked ? "LOCKED AT DAWN" : "PENDING LOCK"}
                  </span>
                </td>
              </tr>

              {morning_bookends.map((mb, idx) => (
                <tr key={mb.id || idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-sans text-slate-800">
                    {mb.date || mb.iso_date}
                  </td>
                  <td className="py-2.5 px-3">
                    {currency} {(mb.cash_float || 8450).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    {currency} {(mb.mpesa_float || 28300).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    {currency} {(mb.equitel_balance || 14200).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {currency} {(mb.total_liquidity || ((mb.cash_float || 8450) + (mb.mpesa_float || 28300) + (mb.equitel_balance || 14200))).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      VERIFIED
                    </span>
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
