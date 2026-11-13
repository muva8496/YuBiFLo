import React, { useState, useEffect } from "react";
import {
  Sun,
  Lock,
  Unlock,
  CheckCircle2,
  ShieldCheck,
  Coins,
  Smartphone,
  Building2,
  Calendar,
  Plus,
  Trash2,
  Wallet
} from "lucide-react";
import {
  AlacioMasterState,
  PaymentChannelCategory,
  PaymentChannelConfig,
  PaymentChannelSubType
} from "../../types/alacio";
import {
  isEateryBusinessState,
  resolvePaymentChannels,
  syncLegacyBalancesFromChannels
} from "../../services/alacioStorage";

interface DawnLockTabProps {
  state: AlacioMasterState;
  onUpdateFloat?: (data: {
    channels: PaymentChannelConfig[];
    cashBalance: number;
    mpesaFloat: number;
    bankPaybillBalance: number;
    operatingDate: string;
    bankName?: string;
  }) => void;
  onNavigateTab?: (tabId: string) => void;
}

const SUBTYPE_META: Record<
  PaymentChannelSubType,
  { label: string; category: PaymentChannelCategory; badge: string; helper: string }
> = {
  CASH_DRAWER: {
    label: "Cash at Counter / Till",
    category: "CASH",
    badge: "CSH",
    helper: "Physical notes & coins on hand for fast counter change."
  },
  MPESA_TILL: {
    label: "M-Pesa Buy Goods Till",
    category: "MOBILE_MONEY",
    badge: "M-TL",
    helper: "Safaricom Buy Goods Till balance."
  },
  PAYBILL: {
    label: "M-Pesa Paybill",
    category: "MOBILE_MONEY",
    badge: "M-PB",
    helper: "Mobile money Paybill collection account."
  },
  POCHI_LA_BIASHARA: {
    label: "Pochi la Biashara",
    category: "MOBILE_MONEY",
    badge: "PCHI",
    helper: "Pochi la Biashara wallet separate from personal M-Pesa."
  },
  SEND_MONEY: {
    label: "M-Pesa Send Money",
    category: "MOBILE_MONEY",
    badge: "SEND",
    helper: "Direct mobile phone Send Money channel."
  },
  EQUITEL: {
    label: "Equity / Equitel Paybill",
    category: "BANK",
    badge: "EQB",
    helper: "Bank Paybill or Equitel settlement line."
  },
  BANK_TRANSFER: {
    label: "Bank Account / Transfer",
    category: "BANK",
    badge: "BNK",
    helper: "Operating bank settlement account (KCB, Equity, Co-op, etc.)."
  }
};

export default function DawnLockTab({
  state,
  onUpdateFloat
}: DawnLockTabProps) {
  const { currency = "KSh", morning_bookends = [] } = state;
  const isEatery = isEateryBusinessState(state);

  // Operating date state with quick selectors
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgoStr = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);
  const [operatingDate, setOperatingDate] = useState<string>(todayStr);

  // Configurable channels (defaults to 2 channels for Open Eatery, 3 for Alacio/Duka, etc.)
  const [channels, setChannels] = useState<PaymentChannelConfig[]>(() =>
    resolvePaymentChannels(state)
  );

  // Keep synced when switching workspaces or accounts
  useEffect(() => {
    setChannels(resolvePaymentChannels(state));
  }, [
    state.merchant_name,
    (state as any).account_id,
    state.cash_register_balance,
    state.mpesa_float_balance,
    state.equitel_account_balance,
    state.paymentChannels?.length
  ]);

  // Lock State
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [lockedTime, setLockedTime] = useState<string>(
    morning_bookends.length > 0 ? "05:57 AM" : "Ready"
  );
  const [lockFeedback, setLockFeedback] = useState<string | null>(null);

  const totalStartingLiquidity = channels.reduce(
    (sum, ch) => sum + (Number(ch.balance) || 0),
    0
  );

  const handleConfirmAndLock = () => {
    setIsLocked(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLockedTime(nowTime);

    const cleanChannels: PaymentChannelConfig[] = channels.map((ch) => ({
      ...ch,
      balance: Math.max(0, Number(ch.balance) || 0),
      label: ch.label.trim() || SUBTYPE_META[ch.subType]?.label || "Payment Channel"
    }));
    const synced = syncLegacyBalancesFromChannels(cleanChannels);
    const firstBank = cleanChannels.find((c) => c.category === "BANK");

    if (onUpdateFloat) {
      onUpdateFloat({
        channels: cleanChannels,
        cashBalance: synced.cash_register_balance,
        mpesaFloat: synced.mpesa_float_balance,
        bankPaybillBalance: synced.equitel_account_balance,
        operatingDate,
        bankName: firstBank?.label
      });
    }

    setLockFeedback(
      `✓ Dawn Float locked for ${operatingDate} at ${nowTime}. Starting Liquidity across ${cleanChannels.length} channel${cleanChannels.length === 1 ? "" : "s"}: ${currency} ${totalStartingLiquidity.toLocaleString()}`
    );
    setTimeout(() => setLockFeedback(null), 5000);
  };

  const handleChannelBalanceChange = (id: string, val: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, balance: Math.max(0, val) } : ch))
    );
  };

  const handleQuickAdd = (id: string, amount: number) => {
    if (isLocked) return;
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === id ? { ...ch, balance: Math.max(0, (Number(ch.balance) || 0) + amount) } : ch
      )
    );
  };

  const handleChannelMetaChange = (
    id: string,
    updates: Partial<PaymentChannelConfig>
  ) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch))
    );
  };

  const handleAddChannel = (preset: "MOBILE_MONEY" | "BANK" | "CASH") => {
    const newId = `ch_${preset.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const newChannel: PaymentChannelConfig =
      preset === "CASH"
        ? {
            id: newId,
            label: "Secondary Cash Float",
            shortCode: "CSH",
            category: "CASH",
            subType: "CASH_DRAWER",
            balance: 0,
            enabled: true
          }
        : preset === "BANK"
        ? {
            id: newId,
            label: "Bank Transfer / Paybill",
            shortCode: "BNK",
            category: "BANK",
            subType: "BANK_TRANSFER",
            balance: 0,
            enabled: true
          }
        : {
            id: newId,
            label: "M-Pesa / Pochi / Send Money",
            shortCode: "PCH",
            category: "MOBILE_MONEY",
            subType: "POCHI_LA_BIASHARA",
            balance: 0,
            enabled: true
          };
    setChannels((prev) => [...prev, newChannel]);
  };

  const handleRemoveChannel = (id: string) => {
    if (channels.length <= 1) return;
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };

  const getChannelVisual = (cat: PaymentChannelCategory) => {
    if (cat === "CASH") {
      return {
        icon: <Coins size={22} />,
        iconBg: "bg-amber-500/10 text-amber-600",
        pillBg: "bg-amber-100 text-amber-800",
        borderHover: "hover:border-amber-400/60",
        inputBorder: "border-amber-500/40 focus:border-amber-500",
        accentText: "text-amber-700",
        categoryTitle: "Cash Portfolio"
      };
    }
    if (cat === "BANK") {
      return {
        icon: <Building2 size={22} />,
        iconBg: "bg-blue-500/10 text-blue-600",
        pillBg: "bg-blue-100 text-blue-800",
        borderHover: "hover:border-blue-400/60",
        inputBorder: "border-blue-500/40 focus:border-blue-500",
        accentText: "text-blue-700",
        categoryTitle: "Bank / Settlement"
      };
    }
    return {
      icon: <Smartphone size={22} />,
      iconBg: "bg-emerald-500/10 text-emerald-600",
      pillBg: "bg-emerald-100 text-emerald-800",
      borderHover: "hover:border-emerald-400/60",
      inputBorder: "border-emerald-500/40 focus:border-emerald-500",
      accentText: "text-emerald-700",
      categoryTitle: "Mobile Money"
    };
  };

  const gridColsClass =
    channels.length === 1
      ? "grid-cols-1 max-w-md"
      : channels.length === 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 md:grid-cols-3";

  return (
    <div className="space-y-6 max-w-5xl font-sans text-slate-900 pb-12">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Sun className="text-amber-500" size={24} /> Dawn Lock &bull; Morning Liquidity
            </h1>
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                isLocked
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {isLocked ? `Locked (${lockedTime})` : "Unlocked: Configure Channels & Baseline"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isEatery ? (
              <>
                Built for fast cash-heavy eateries &amp; roadside kiosks: track your{" "}
                <strong>Cash Portfolio</strong> and <strong>Mobile Money Portfolio</strong>{" "}
                (M-Pesa Till, Paybill, Pochi la Biashara, or Send Money) without slowing down
                counter service. Unlock anytime to customize channels or add Bank Transfer.
              </>
            ) : (
              <>
                Every business uses different payment channels where customer money settles — Cash,
                Mobile Money (M-Pesa Till, Paybill, Pochi la Biashara, Send Money), or Bank
                Transfer / Paybill. Configure your business&apos;s channels below and lock opening
                balances once at dawn.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {isLocked ? (
            <button
              onClick={() => setIsLocked(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Unlock size={14} />
              <span>Unlock &amp; Configure Channels</span>
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

      {/* 2. OPERATING DATE SELECTOR BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-500" />
            <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
              Dawn Operating Date:
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              {operatingDate === todayStr
                ? "Today"
                : operatingDate === yesterdayStr
                ? "Yesterday"
                : "Backdated"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Lock opening liquidity for today&apos;s trade or backdate past operating days.
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

      {/* 3. TOTAL STARTING LIQUIDITY CALLOUT */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-mono uppercase font-bold tracking-wider">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Total Morning Starting Liquidity ({channels.length} Channels)</span>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-black text-white mt-1">
            {currency} {totalStartingLiquidity.toLocaleString()}
          </div>
          <p className="text-xs text-blue-200/80 mt-1">
            Opening channel balances anchor sales, foodstuff/stock purchases, and expenses without
            counting every coin or halting service.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-right">
            <span className="text-[10px] text-blue-200 font-mono block uppercase">Status</span>
            <span className="text-xs font-bold text-emerald-300 font-mono">
              {isLocked ? "✓ LOCKED AT DAWN" : "EDITING CHANNELS"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. CONFIGURABLE PAYMENT CHANNELS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase font-mono tracking-wider">
            Configured Payment Channels ({channels.length})
          </h2>

          {!isLocked ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddChannel("MOBILE_MONEY")}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add Mobile Money (Till / Pochi / Send Money)
              </button>
              <button
                type="button"
                onClick={() => handleAddChannel("BANK")}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add Bank / Paybill
              </button>
              <button
                type="button"
                onClick={() => handleAddChannel("CASH")}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add Cash Portfolio
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-mono">
              Unlock above to switch Till / Pochi / Send Money / Paybill / Bank Transfer
            </span>
          )}
        </div>

        <div className={`grid ${gridColsClass} gap-4`}>
          {channels.map((ch, idx) => {
            const vis = getChannelVisual(ch.category);
            const meta = SUBTYPE_META[ch.subType] || SUBTYPE_META.MPESA_TILL;

            return (
              <div
                key={ch.id}
                className={`bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4 ${vis.borderHover} transition flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`w-10 h-10 rounded-2xl ${vis.iconBg} flex items-center justify-center shrink-0`}>
                      {vis.icon}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${vis.pillBg} font-bold`}>
                        Ch {idx + 1}: {vis.categoryTitle}
                      </span>
                      {!isLocked && channels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChannel(ch.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                          title="Remove this channel"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isLocked ? (
                    <div>
                      <h3 className="font-serif font-bold text-slate-900 text-base">
                        {ch.label}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {meta.label}
                        {ch.accountRef ? ` • Ref: ${ch.accountRef}` : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-0.5">
                          Channel Label
                        </label>
                        <input
                          type="text"
                          value={ch.label}
                          onChange={(e) =>
                            handleChannelMetaChange(ch.id, { label: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-0.5">
                            Channel Mode
                          </label>
                          <select
                            value={ch.subType}
                            onChange={(e) => {
                              const nextSub = e.target.value as PaymentChannelSubType;
                              const nextCat = SUBTYPE_META[nextSub]?.category || ch.category;
                              handleChannelMetaChange(ch.id, {
                                subType: nextSub,
                                category: nextCat
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-slate-800"
                          >
                            <option value="CASH_DRAWER">Cash Counter / Hand</option>
                            <option value="MPESA_TILL">M-Pesa Buy Goods Till</option>
                            <option value="POCHI_LA_BIASHARA">Pochi la Biashara</option>
                            <option value="SEND_MONEY">M-Pesa Send Money</option>
                            <option value="PAYBILL">M-Pesa Paybill</option>
                            <option value="EQUITEL">Equity / Equitel Paybill</option>
                            <option value="BANK_TRANSFER">Bank Transfer / Account</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-0.5">
                            Till / Phone / Acc (Opt.)
                          </label>
                          <input
                            type="text"
                            value={ch.accountRef || ""}
                            onChange={(e) =>
                              handleChannelMetaChange(ch.id, { accountRef: e.target.value })
                            }
                            placeholder="e.g. 0712... / Till #"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                      Opening Balance ({currency})
                    </label>
                    {isLocked ? (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xl font-mono font-bold text-slate-900">
                        {currency} {(Number(ch.balance) || 0).toLocaleString()}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">
                            {currency}
                          </span>
                          <input
                            type="number"
                            step="any"
                            min={0}
                            value={ch.balance}
                            onChange={(e) =>
                              handleChannelBalanceChange(ch.id, parseFloat(e.target.value) || 0)
                            }
                            className={`w-full bg-white border-2 ${vis.inputBorder} rounded-2xl pl-12 pr-3 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none`}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(ch.id, 500)}
                            className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                          >
                            +500
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(ch.id, 1000)}
                            className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                          >
                            +1,000
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(ch.id, 5000)}
                            className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                          >
                            +5,000
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                  <span className="truncate">{meta.label}</span>
                  <span className={`font-mono ${vis.accentText} font-semibold shrink-0`}>
                    {meta.badge} Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. SUMMARY AUDIT TRAIL */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet size={16} className="text-emerald-600" />
              <span>Dawn Float Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified opening liquidity records across your configured Cash, Mobile Money &amp; Bank channels.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
            {morning_bookends.length > 0 ? `${morning_bookends.length} Days Logged` : "Clean Shell Baseline"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Cash Portfolio</th>
                <th className="py-2 px-3">Mobile Money</th>
                <th className="py-2 px-3">Bank / Paybill</th>
                <th className="py-2 px-3 text-right">Total Dawn Liquidity</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-xs">
              {(() => {
                const syncedNow = syncLegacyBalancesFromChannels(channels);
                return (
                  <tr className="bg-emerald-50/40">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                      {operatingDate} (Active Day)
                    </td>
                    <td className="py-2.5 px-3">
                      {currency} {syncedNow.cash_register_balance.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {currency} {syncedNow.mpesa_float_balance.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {currency} {syncedNow.equitel_account_balance.toLocaleString()}
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
                );
              })()}

              {morning_bookends.map((mb, idx) => {
                const cFloat = Number(mb.cash_float) || 0;
                const mFloat = Number(mb.mpesa_float) || 0;
                const bFloat = Number(mb.equitel_balance) || 0;
                const tot =
                  typeof mb.total_liquidity === "number"
                    ? mb.total_liquidity
                    : cFloat + mFloat + bFloat;
                return (
                  <tr key={mb.id || idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans text-slate-800">
                      {mb.date || mb.iso_date}
                    </td>
                    <td className="py-2.5 px-3">
                      {currency} {cFloat.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {currency} {mFloat.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {currency} {bFloat.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {currency} {tot.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
