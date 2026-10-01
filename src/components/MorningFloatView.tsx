import React, { useState, useMemo } from "react";
import {
  Clock,
  Smartphone,
  Landmark,
  Coins,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  History,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  DollarSign,
  PieChart as PieIcon,
  Zap,
  RotateCcw,
  Edit3,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Merchant, DailyMorningFloatLog } from "../types";
import { EditRecordModal } from "./EditRecordModal";
import { AppStorage } from "../services/storage";

interface MorningFloatViewProps {
  merchant: Merchant;
  morningLogs: DailyMorningFloatLog[];
  onSaveMorningLog: (log: DailyMorningFloatLog) => void;
  onNavigateToReconciliation: () => void;
  onRefreshData?: () => void;
}

export const MorningFloatView: React.FC<MorningFloatViewProps> = ({
  merchant,
  morningLogs,
  onSaveMorningLog,
  onNavigateToReconciliation,
  onRefreshData,
}) => {
  const [editingLog, setEditingLog] = useState<DailyMorningFloatLog | null>(null);

  // Clean deduplication and strict chronological descending sort (Latest date on top)
  const sortedUniqueLogs = useMemo(() => {
    const normalizeDate = (d: string): string => {
      if (!d) return "";
      const trimmed = d.split("T")[0].trim();
      const dateObj = new Date(trimmed);
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
      return trimmed;
    };

    const logMap = new Map<string, DailyMorningFloatLog>();
    const seenIds = new Set<string>();

    morningLogs.forEach((l) => {
      const normDate = normalizeDate(l.date || "");
      if (!normDate) return;
      
      const existing = logMap.get(normDate);
      if (!existing || (l.created_at && (!existing.created_at || l.created_at >= existing.created_at))) {
        logMap.set(normDate, {
          ...l,
          date: normDate,
        });
      }
    });

    // Ensure every record in the view has an absolutely unique ID
    const uniqueLogs = Array.from(logMap.values()).map((log, idx) => {
      let uniqueId = log.id;
      if (!uniqueId || seenIds.has(uniqueId)) {
        uniqueId = `morn-${log.date}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
      }
      seenIds.add(uniqueId);
      return {
        ...log,
        id: uniqueId,
      };
    });

    // Chronological order: Latest date on top (descending)
    return uniqueLogs.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return (b.recorded_time || "").localeCompare(a.recorded_time || "");
    });
  }, [morningLogs]);

  const todayStr = new Date().toISOString().split("T")[0];
  const existingTodayLog = sortedUniqueLogs.find((l) => l.date === todayStr);
  const previousLog = sortedUniqueLogs.find((l) => l.date !== todayStr);

  const [date, setDate] = useState<string>(todayStr);
  const [recordedTime, setRecordedTime] = useState<string>("05:57 AM");

  // 1. M-Pesa Electronic Float (SIM Float - No M-Pesa Till)
  const [mpesaElectronicFloat, setMpesaElectronicFloat] = useState<number>(
    existingTodayLog
      ? existingTodayLog.mpesa_electronic_float ?? existingTodayLog.mpesa_opening_float ?? 0
      : 0
  );

  // 2. Equity Paybill Channel (Acc: 1450180372031 - For goods payments)
  const equityAccNumber = "1450180372031";
  const [equityPaybillBalance, setEquityPaybillBalance] = useState<number>(
    existingTodayLog
      ? existingTodayLog.equity_paybill_balance ?? existingTodayLog.equity_paybill_opening ?? 0
      : 0
  );

  // 3. Unified Physical Cash Drawer (Single Cash Till for BOTH Duka sales & M-Pesa cash)
  const [cashDrawerBalance, setCashDrawerBalance] = useState<number>(
    existingTodayLog
      ? existingTodayLog.cash_drawer_balance ?? existingTodayLog.cash_drawer_opening ?? 0
      : 0
  );

  const [notes, setNotes] = useState<string>(
    existingTodayLog
      ? existingTodayLog.notes || ""
      : "Recorded at 0557 hours. Unified cash drawer for Duka and M-Pesa. Customer goods payments via Equity Paybill."
  );

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Computed: Single 05:57 AM Total Liquid Capital (Ganji Yote ya Asubuhi)
  // Channels: M-Pesa SIM E-Float + Equity Paybill + Unified Physical Cash
  const totalMorningLiquid =
    mpesaElectronicFloat + equityPaybillBalance + cashDrawerBalance;

  // Comparison with previous 05:57 snapshot
  const previousTotalLiquid = previousLog
    ? (previousLog.total_morning_liquid ??
        ((previousLog.mpesa_electronic_float ?? previousLog.mpesa_opening_float ?? 0) +
          (previousLog.equity_paybill_balance ?? previousLog.equity_paybill_opening ?? 0) +
          (previousLog.cash_drawer_balance ?? previousLog.cash_drawer_opening ?? 0)))
    : 0;

  const liquidDelta =
    previousTotalLiquid > 0 ? totalMorningLiquid - previousTotalLiquid : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const targetDateLog = sortedUniqueLogs.find((l) => l.date === date);

    const log: DailyMorningFloatLog = {
      id: targetDateLog?.id || `morn-${date}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      merchant_id: merchant.id,
      date,
      recorded_time: recordedTime,
      mpesa_electronic_float: Number(mpesaElectronicFloat) || 0,
      mpesa_till_balance: 0, // No M-Pesa Till
      // Legacy compatibility
      mpesa_opening_float: Number(mpesaElectronicFloat) || 0,
      mpesa_closing_float: Number(mpesaElectronicFloat) || 0,
      mpesa_till_sales: 0,

      equity_paybill_acc_number: equityAccNumber,
      equity_paybill_balance: Number(equityPaybillBalance) || 0,
      equity_paybill_opening: Number(equityPaybillBalance) || 0,
      equity_paybill_closing: Number(equityPaybillBalance) || 0,
      equity_paybill_sales: Number(equityPaybillBalance) || 0,

      cash_drawer_balance: Number(cashDrawerBalance) || 0,
      cash_drawer_opening: Number(cashDrawerBalance) || 0,
      cash_drawer_closing: Number(cashDrawerBalance) || 0,
      cash_sales: Number(cashDrawerBalance) || 0,

      total_morning_liquid: Number(totalMorningLiquid) || 0,
      total_opening_liquid: Number(totalMorningLiquid) || 0,
      total_daily_sales: Number(totalMorningLiquid) || 0,
      notes,
      created_at: new Date().toISOString(),
    };

    onSaveMorningLog(log);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const addPreset = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    amount: number
  ) => {
    setter((prev) => Math.max(0, prev + amount));
  };

  return (
    <div id="morning-float-view" className="space-y-6">
      {/* 05:57 AM Header Banner */}
      <div className="rounded-xl bg-[#18181b] border border-slate-800 p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                0557 HOURS ROUTINE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Single Morning Balance Snapshot
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              05:57 AM Opening Float: Balance Audit
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Recording opening balances at <strong>05:57 AM</strong> captures previous closing totals and establishes baseline capital for the day without requiring duplicate entries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-right shadow-lg">
              <span className="text-[10px] uppercase text-emerald-400 font-bold block tracking-wider">
                Total Liquid Float
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-300">
                {merchant.currency} {totalMorningLiquid.toLocaleString()}
              </span>
            </div>

            {previousTotalLiquid > 0 && (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">
                  24h Liquid Growth
                </span>
                <span
                  className={`text-sm font-bold font-mono ${
                    liquidDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {liquidDelta >= 0 ? "+" : ""}
                  {merchant.currency} {liquidDelta.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Account Details Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Landmark className="w-3.5 h-3.5 text-rose-400" />
            <span>
              Equity Paybill Acc: <strong className="font-mono text-rose-300">1450180372031</strong> (Customer Goods Payments)
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              M-Pesa Electronic: <strong>SIM Line E-Float (Deposits & Withdrawals)</strong>
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Physical Cash Drawer: <strong className="text-amber-300">Unified Cash Drawer (Notes & Coins in Till)</strong>
            </span>
          </span>
        </div>
      </div>

      {/* Main 05:57 AM Entry Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Date & Time Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#18181b] border border-slate-800">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Audit Date:</label>
              <input
                id="morning-log-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Audit Time:</label>
              <input
                id="morning-log-time-input"
                type="text"
                value={recordedTime}
                onChange={(e) => setRecordedTime(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono font-bold w-24 text-center focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Single 05:57 AM audit before shop opening</span>
          </div>
        </div>

        {/* 3-Column Payment Channel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. M-PESA ELECTRONIC FLOAT (SIM E-FLOAT - NO MPESA TILL) */}
          <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    1. M-Pesa Electronic Float
                  </h3>
                  <p className="text-[10px] text-slate-500">SIM Line Float Balance</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold">
                SIM E-Float
              </span>
            </div>

            <div className="space-y-3">
              {/* Field 1A: M-Pesa E-Float (SIM Balance) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    M-Pesa SIM Float ({merchant.currency})
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">Live on Phone</span>
                </div>
                <input
                  id="mpesa-electronic-float-input"
                  type="number"
                  value={mpesaElectronicFloat}
                  onChange={(e) => setMpesaElectronicFloat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 45000"
                />
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                  <span>For customer deposits & withdrawals</span>
                  <div className="flex gap-1">
                    {[1000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => addPreset(setMpesaElectronicFloat, amt)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* No M-Pesa Till Notice */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>No M-Pesa Till Required</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Digital customer payments for goods go directly to <strong>Equity Paybill 1450180372031</strong> (Card 2).
                </p>
              </div>

              {/* Unified Cash callout */}
              <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[10px] text-slate-300 flex items-start gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Unified Cash:</strong> Physical cash for mobile money and store sales is managed together in the <strong>Cash Drawer</strong> (Card 3).
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-xs flex items-center justify-between">
              <span className="text-slate-400">Total SIM E-Float:</span>
              <span className="font-mono font-bold text-emerald-300">
                {merchant.currency} {mpesaElectronicFloat.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 2. EQUITY PAYBILL ACCOUNT: 1450180372031 */}
          <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    2. Equity Paybill Channel
                  </h3>
                  <p className="text-[10px] text-slate-500">Acc: 1450180372031</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono font-bold">
                1450180372031
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Bank Account:</span>
                  <span className="font-mono font-bold text-rose-300">1450180372031</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Paybill Business:</span>
                  <span className="font-mono text-slate-300">Equity 247247</span>
                </div>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-rose-500/20">
                  Account used by customers to pay when buying goods in the store.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    05:57 AM Equity Balance ({merchant.currency})
                  </label>
                  <span className="text-[10px] text-rose-400 font-mono font-semibold">Live In Bank</span>
                </div>
                <input
                  id="equity-paybill-balance-input"
                  type="number"
                  value={equityPaybillBalance}
                  onChange={(e) => setEquityPaybillBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-rose-500/40 rounded-lg px-3 py-2 text-xs text-rose-200 font-mono font-bold focus:outline-none focus:border-rose-400"
                  placeholder="e.g. 18500"
                />
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                  <span>Balance at 05:57 AM</span>
                  <div className="flex gap-1">
                    {[1000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => addPreset(setEquityPaybillBalance, amt)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-xs flex items-center justify-between">
              <span className="text-slate-400">Total Equity Paybill:</span>
              <span className="font-mono font-bold text-rose-300">
                {merchant.currency} {equityPaybillBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 3. UNIFIED PHYSICAL CASH DRAWER (SHOP & MPESA CASH) */}
          <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    3. Unified Cash Drawer
                  </h3>
                  <p className="text-[10px] text-amber-400 font-semibold">Store & Mobile Cash Drawer</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-bold">
                Notes & Coins
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Physical Cash in Till ({merchant.currency})
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-semibold">Till Drawer</span>
                </div>
                <input
                  id="cash-drawer-balance-input"
                  type="number"
                  value={cashDrawerBalance}
                  onChange={(e) => setCashDrawerBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  placeholder="e.g. 23400"
                />
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                  <span>Counted physical cash in shop drawer</span>
                  <div className="flex gap-1">
                    {[500, 1000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => addPreset(setCashDrawerBalance, amt)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Audit Notes / Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-slate-600"
                  placeholder="e.g. Opening float verified across all channels"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/20 text-xs flex items-center justify-between">
              <span className="text-slate-400">Total Physical Cash:</span>
              <span className="font-mono font-bold text-amber-300">
                {merchant.currency} {cashDrawerBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button & Confirmation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#18181b] border border-slate-800">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-slate-400">
              Saving locks this 05:57 snapshot as your baseline liquid float. It will automatically be compared against tomorrow's 05:57 snapshot.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>05:57 Float Saved!</span>
              </span>
            )}
            <button
              id="save-morning-float-btn"
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save 05:57 AM Balances</span>
            </button>
          </div>
        </div>
      </form>

      {/* Historical 05:57 AM Morning Float Logs Table */}
      <div className="rounded-xl bg-[#18181b] border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              05:57 AM Historical Float Logbook ({sortedUniqueLogs.length} records)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-sans font-medium">
              Latest on Top (Chronological)
            </span>
          </div>
          <button
            onClick={onNavigateToReconciliation}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Run Reverse Audit →</span>
          </button>
        </div>

        {sortedUniqueLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
            No morning float audits logged yet. Fill the 05:57 AM balances above to start your daily records!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-900/50">
                  <th className="p-2.5 font-bold">Date & Time</th>
                  <th className="p-2.5 font-bold">M-Pesa SIM E-Float</th>
                  <th className="p-2.5 font-bold">Equity (1450180372031)</th>
                  <th className="p-2.5 font-bold">Unified Cash Drawer</th>
                  <th className="p-2.5 font-bold">Total Liquid Float</th>
                  <th className="p-2.5 font-bold text-center">24h Variance</th>
                  <th className="p-2.5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedUniqueLogs.map((log, index) => {
                  const mpesaFloat = log.mpesa_electronic_float ?? log.mpesa_opening_float ?? 0;
                  const equityBal = log.equity_paybill_balance ?? log.equity_paybill_opening ?? 0;
                  const cashBal = log.cash_drawer_balance ?? log.cash_drawer_opening ?? 0;
                  const total =
                    log.total_morning_liquid ??
                    log.total_opening_liquid ??
                    mpesaFloat + equityBal + cashBal;

                  // Previous chronological day's record (since array is sorted newest first)
                  const priorDayLog = sortedUniqueLogs[index + 1];
                  const priorTotal = priorDayLog
                    ? (priorDayLog.total_morning_liquid ??
                        priorDayLog.total_opening_liquid ??
                        (priorDayLog.mpesa_electronic_float ?? priorDayLog.mpesa_opening_float ?? 0) +
                          (priorDayLog.equity_paybill_balance ?? priorDayLog.equity_paybill_opening ?? 0) +
                          (priorDayLog.cash_drawer_balance ?? priorDayLog.cash_drawer_opening ?? 0))
                    : null;

                  const delta = priorTotal !== null ? total - priorTotal : null;

                  return (
                    <tr key={`${log.id || 'morn'}_${log.date}_${index}`} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-2.5 text-slate-200">
                        <div className="font-sans font-bold">{log.date}</div>
                        <div className="text-[10px] text-amber-400 font-mono">{log.recorded_time || "05:57 AM"}</div>
                      </td>
                      <td className="p-2.5 text-emerald-400 font-bold">
                        {merchant.currency} {mpesaFloat.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-rose-300 font-bold">
                        {merchant.currency} {equityBal.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-amber-300 font-bold">
                        {merchant.currency} {cashBal.toLocaleString()}
                      </td>
                      <td className="p-2.5 font-bold text-emerald-300 text-sm">
                        {merchant.currency} {total.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center">
                        {delta === null ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-500 font-sans">
                            Baseline
                          </span>
                        ) : delta > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>+{merchant.currency} {delta.toLocaleString()}</span>
                          </span>
                        ) : delta < 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
                            <ArrowDownRight className="w-3 h-3" />
                            <span>-{merchant.currency} {Math.abs(delta).toLocaleString()}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">0.00</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => setEditingLog(log)}
                            className="px-2.5 py-1 text-xs rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Edit / Rectify 05:57 AM balances"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete 05:57 float log for ${log.date}?`)) {
                                AppStorage.deleteMorningLog(log.id || log.date);
                                if (onRefreshData) onRefreshData();
                              }
                            }}
                            className="p-1 rounded bg-slate-900 hover:bg-red-950/40 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-colors cursor-pointer"
                            title="Delete this float entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Float Modal */}
      {editingLog && (
        <EditRecordModal
          isOpen={!!editingLog}
          onClose={() => setEditingLog(null)}
          merchant={merchant}
          type="FLOAT"
          record={editingLog}
          onSave={(updatedLog) => {
            AppStorage.updateMorningLog(updatedLog);
            if (onRefreshData) onRefreshData();
            setEditingLog(null);
          }}
          onDelete={(id) => {
            AppStorage.deleteMorningLog(id);
            if (onRefreshData) onRefreshData();
            setEditingLog(null);
          }}
        />
      )}
    </div>
  );
};
