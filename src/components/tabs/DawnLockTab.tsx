import React, { useState } from "react";
import { 
  Sun, Moon, Lock, Unlock, CheckCircle2, AlertTriangle, ShieldCheck, 
  Coins, Smartphone, Scale, ArrowRight, DollarSign, Coffee, RefreshCw, HelpCircle
} from "lucide-react";
import { AlacioMasterState, PayoutOrDrawing } from "../../types/alacio";

interface DawnLockTabProps {
  state: AlacioMasterState;
  onUpdateFloat?: (denominations: Record<string, number>) => void;
  onResolveGap?: (payout: PayoutOrDrawing) => void;
}

export default function DawnLockTab({
  state,
  onUpdateFloat,
  onResolveGap
}: DawnLockTabProps) {
  const { currency, floatDenominations, salesLedger = [], payouts = [] } = state;

  // Local state for denomination counts
  const defaultDenoms: Record<string, number> = {
    kes_1000: 5,
    kes_500: 8,
    kes_200: 12,
    kes_100: 18,
    kes_50: 20,
    kes_20: 30,
    kes_10: 25,
    kes_5: 20,
    kes_1: 10
  };

  const initialDenoms = React.useMemo(() => {
    if (Array.isArray(floatDenominations)) {
      const rec: Record<string, number> = {};
      floatDenominations.forEach((d) => {
        rec[`kes_${d.value}`] = d.count;
      });
      return rec;
    }
    return defaultDenoms;
  }, [floatDenominations]);

  const [denoms, setDenoms] = useState<Record<string, number>>(initialDenoms);

  const [mpesaFloatInput, setMpesaFloatInput] = useState<number>(28300);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [lockedTime, setLockedTime] = useState<string>("05:57 AM");
  const [lockFeedback, setLockFeedback] = useState<string | null>(null);

  // Compute drawer cash total
  const totalDrawerCash = Object.entries(denoms).reduce((sum, [denom, count]) => {
    const val = parseInt(denom.replace("kes_", ""), 10);
    const countNum = Number(count) || 0;
    return sum + (isNaN(val) ? 0 : val * countNum);
  }, 0);

  const totalStartingLiquidity = totalDrawerCash + mpesaFloatInput;

  // End of day close calculation
  const cashSalesToday = salesLedger
    .filter(s => s.payment_channel === "CASH" || s.payment_channel === "SPLIT" || s.payment_method === "CASH" || s.payment_method === "SPLIT")
    .reduce((sum, s) => sum + (s.payment_channel === "SPLIT" || s.payment_method === "SPLIT" ? (s.cash_received || s.cash_paid || 0) : s.total_amount), 0);

  const cashPayoutsToday = payouts
    .filter(p => p.payment_channel === "CASH" || !p.payment_channel)
    .reduce((sum, p) => sum + p.amount, 0);

  const expectedClosingCash = totalDrawerCash + cashSalesToday - cashPayoutsToday;
  const [actualClosingCash, setActualClosingCash] = useState<string>("");
  const [gapResolved, setGapResolved] = useState<boolean>(false);
  const [resolvedReason, setResolvedReason] = useState<string | null>(null);

  const parsedActualClosing = actualClosingCash !== "" ? parseFloat(actualClosingCash) : expectedClosingCash;
  const cashGap = parsedActualClosing - expectedClosingCash;

  const handleDenomChange = (denomKey: string, val: number) => {
    if (isLocked) return;
    setDenoms(prev => ({
      ...prev,
      [denomKey]: Math.max(0, val)
    }));
  };

  const handleConfirmAndLock = () => {
    setIsLocked(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLockedTime(nowTime);
    if (onUpdateFloat) onUpdateFloat(denoms);
    setLockFeedback(`Dawn Float verified and locked at ${nowTime}. Total Starting Liquidity: ${currency} ${totalStartingLiquidity.toLocaleString()}`);
    setTimeout(() => setLockFeedback(null), 5000);
  };

  const handleOneTapResolve = (reason: "OWNER_CHAI" | "PERSONAL_LUNCH" | "UNLOGGED_SALE" | "SUPPLIER_DROP") => {
    const absGap = Math.abs(cashGap);
    if (onResolveGap && absGap > 0) {
      const type = reason === "UNLOGGED_SALE" ? "BUSINESS_EXPENSE" : "OWNER_DRAWING";
      const notes = 
        reason === "OWNER_CHAI" ? "Owner Morning Chai / Milk Drawing" :
        reason === "PERSONAL_LUNCH" ? "Owner Personal Lunch & Family Drawing" :
        reason === "SUPPLIER_DROP" ? "Unlogged Bread / Milk Van Cash Payout" : "Cash Drawer Variance Adjustment";

      onResolveGap({
        id: `payout_gap_${Date.now()}`,
        amount: absGap,
        type,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
        notes
      });
    }

    setGapResolved(true);
    setResolvedReason(
      reason === "OWNER_CHAI" ? "Resolved as Owner Chai / Tea (Personal Drawing)" :
      reason === "PERSONAL_LUNCH" ? "Resolved as Owner Lunch / Family Drawing" :
      reason === "SUPPLIER_DROP" ? "Resolved as Supplier Delivery Outflow" : "Resolved as Unlogged Counter Sale"
    );
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans text-[#E2ECF3]">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182C40] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Sun className="text-amber-400" size={22} /> Dawn Lock &amp; Daily Close
            </h1>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
              isLocked 
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
            }`}>
              {isLocked ? `Locked at ${lockedTime}` : "Unlocked: Editing Counts"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Count drawer cash and M-Pesa float at dawn before trading. At close, compare actual cash with expected and resolve gaps in 1 tap.
          </p>
        </div>

        {isLocked ? (
          <button
            onClick={() => setIsLocked(false)}
            className="px-3.5 py-2 bg-[#182C40] hover:bg-[#203952] text-slate-200 font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 self-start cursor-pointer"
          >
            <Unlock size={14} /> Unlock Float Counts
          </button>
        ) : (
          <button
            onClick={handleConfirmAndLock}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs font-mono transition flex items-center gap-1.5 self-start cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <Lock size={14} /> Confirm &amp; Lock Float
          </button>
        )}
      </div>

      {lockFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{lockFeedback}</span>
        </div>
      )}

      {/* PART 1: MORNING OPENING FLOAT SECTION */}
      <div className="bg-[#0E1A29] border border-[#182C40] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#182C40] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Sun size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase">
                1. Morning Opening Cash Drawer &amp; M-Pesa Float
              </h2>
              <span className="text-[10px] text-slate-400">
                05:57 AM baseline float prevents pocket cash from co-mingling with shop earnings.
              </span>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block uppercase">Starting Liquidity:</span>
            <strong className="text-emerald-400 text-lg">
              {currency} {totalStartingLiquidity.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* SUMMARY TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-4 bg-[#09121D] rounded-2xl border border-[#182C40] flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Drawer Hard Cash (Notes &amp; Coins):</span>
              <strong className="text-white text-base">{currency} {totalDrawerCash.toLocaleString()}</strong>
            </div>
            <Coins className="text-amber-400" size={24} />
          </div>

          <div className="p-4 bg-[#09121D] rounded-2xl border border-[#182C40] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">M-Pesa Merchant Float:</span>
              {isLocked ? (
                <strong className="text-white text-base">{currency} {mpesaFloatInput.toLocaleString()}</strong>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">{currency}</span>
                  <input
                    type="number"
                    value={mpesaFloatInput}
                    onChange={(e) => setMpesaFloatInput(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-28 bg-[#080D15] border border-[#182C40] rounded-lg px-2 py-1 text-white font-mono"
                  />
                </div>
              )}
            </div>
            <Smartphone className="text-cyan-400" size={24} />
          </div>
        </div>

        {/* DENOMINATIONS BREAKDOWN */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
            Physical Currency Denominations:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs font-mono">
            {Object.entries(denoms).map(([denomKey, rawCount]) => {
              const count = Number(rawCount) || 0;
              const val = parseInt(denomKey.replace("kes_", ""), 10);
              const subtotal = val * count;

              return (
                <div key={denomKey} className="p-2.5 bg-[#09121D] border border-[#182C40] rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">KES {val}</span>
                    <span className="text-[10px] text-slate-400">{count} pcs</span>
                  </div>

                  {!isLocked && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDenomChange(denomKey, count - 1)}
                        className="w-6 h-6 bg-[#132337] hover:bg-[#1C324E] rounded text-white flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={count}
                        onChange={(e) => handleDenomChange(denomKey, parseInt(e.target.value, 10) || 0)}
                        className="w-full text-center bg-[#080D15] border border-[#182C40] rounded text-white py-0.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleDenomChange(denomKey, count + 1)}
                        className="w-6 h-6 bg-[#132337] hover:bg-[#1C324E] rounded text-white flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <div className="text-[10px] text-right text-emerald-400 font-bold">
                    KES {subtotal.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PART 2: END-OF-DAY CLOSE & UNEXPLAINED CASH RESOLUTION */}
      <div className="bg-[#0E1A29] border border-[#182C40] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-[#182C40] pb-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Moon size={17} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase">
              2. End-of-Day Close &amp; Unexplained Cash Resolution
            </h2>
            <span className="text-[10px] text-slate-400">
              Expected closing = Dawn Cash + Cash Sales - Logged Cash Payouts.
            </span>
          </div>
        </div>

        {/* MATH BREAKDOWN */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40]">
            <span className="text-slate-400 block text-[9px] uppercase">Opening Cash:</span>
            <span className="text-white font-bold">{currency} {totalDrawerCash.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40]">
            <span className="text-slate-400 block text-[9px] uppercase">+ Today's Cash Sales:</span>
            <span className="text-emerald-400 font-bold">+{currency} {cashSalesToday.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40]">
            <span className="text-slate-400 block text-[9px] uppercase">- Logged Payouts:</span>
            <span className="text-amber-400 font-bold">-{currency} {cashPayoutsToday.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-[#132337] rounded-xl border border-[#1E3A5F]">
            <span className="text-cyan-300 block text-[9px] uppercase font-bold">= Expected Till Cash:</span>
            <span className="text-white font-black text-sm">{currency} {expectedClosingCash.toLocaleString()}</span>
          </div>
        </div>

        {/* ACTUAL CASH TALLY INPUT */}
        <div className="p-4 bg-[#09121D] rounded-2xl border border-[#182C40] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold text-white font-mono block">
                Actual Cash Counted in Till at Close ({currency})
              </label>
              <span className="text-[10px] text-slate-400">
                Count notes and coins in the drawer right now at close of business.
              </span>
            </div>

            <input
              type="number"
              value={actualClosingCash}
              onChange={(e) => {
                setActualClosingCash(e.target.value);
                setGapResolved(false);
              }}
              placeholder={`e.g. ${expectedClosingCash}`}
              className="w-full sm:w-48 bg-[#080D15] border-2 border-cyan-500/50 rounded-xl p-2.5 text-white font-mono text-base font-bold focus:outline-none"
            />
          </div>

          {/* GAP DETECTION & ONE-TAP RESOLUTION QUESTIONS */}
          {actualClosingCash !== "" && (
            <div className="pt-3 border-t border-[#182C40] space-y-3">
              {cashGap === 0 || gapResolved ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>
                      {gapResolved 
                        ? (resolvedReason || "Gap resolved. Ledger perfectly balanced.") 
                        : "Zero Variance: Till exactly matches expected sales!"}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400">0 KES Leakage</span>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-300 font-bold font-mono text-xs">
                      <AlertTriangle size={16} className="text-amber-400" />
                      <span>
                        Unexplained Variance: {cashGap < 0 ? `-${currency} ${Math.abs(cashGap).toLocaleString()} missing from till` : `+${currency} ${cashGap.toLocaleString()} surplus in till`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                      1-Tap Question
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Did money leave the till for a personal lunch or unrecorded milk delivery? Tap the matching reason below to resolve the gap into your double-entry ledger:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => handleOneTapResolve("OWNER_CHAI")}
                      className="p-2.5 bg-[#0A121C] hover:bg-[#121F2D] border border-amber-500/40 rounded-xl text-left transition cursor-pointer"
                    >
                      <strong className="text-white block font-bold">1. Owner Chai / Milk</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Took cash for tea (Personal Drawing)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOneTapResolve("PERSONAL_LUNCH")}
                      className="p-2.5 bg-[#0A121C] hover:bg-[#121F2D] border border-amber-500/40 rounded-xl text-left transition cursor-pointer"
                    >
                      <strong className="text-white block font-bold">2. Personal Lunch / Family</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Family food expenses (Owner Drawing)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOneTapResolve("SUPPLIER_DROP")}
                      className="p-2.5 bg-[#0A121C] hover:bg-[#121F2D] border border-amber-500/40 rounded-xl text-left transition cursor-pointer"
                    >
                      <strong className="text-white block font-bold">3. Unlogged Delivery</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Paid bread/milk van directly from till</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
