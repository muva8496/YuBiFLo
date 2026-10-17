import React, { useState } from "react";
import {
  Wallet, Plus, Trash2, Edit2, Check, X, Home, Car, Coffee,
  UserMinus, Zap, Users, FileCheck, Filter, Search, Calendar,
  DollarSign, CheckCircle2, ArrowUpRight, Sparkles
} from "lucide-react";
import { AlacioMasterState, PayoutOrDrawing } from "../../types/alacio";

interface OwnerExpensesTabProps {
  state: AlacioMasterState;
  onAddExpense: (expense: PayoutOrDrawing) => void;
  onEditExpense?: (id: string, updated: Partial<PayoutOrDrawing>) => void;
  onDeleteExpense?: (id: string) => void;
}

export interface ExpenseCategoryMeta {
  id: "RENT" | "MISC" | "TRAVEL" | "PERSONAL_WITHDRAWAL" | "UTILITIES" | "WAGES" | "SUPPLIES" | "OTHER_CUSTOM";
  label: string;
  shortLabel: string;
  type: "BUSINESS_EXPENSE" | "OWNER_DRAWING";
  badgeColor: string;
  examples: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryMeta[] = [
  {
    id: "RENT",
    label: "Shop Rent & Stall Lease",
    shortLabel: "Rent",
    type: "BUSINESS_EXPENSE",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    examples: "Monthly shop rent, stall fee, store lease"
  },
  {
    id: "MISC",
    label: "Miscellaneous & Shop Upkeep",
    shortLabel: "Misc",
    type: "BUSINESS_EXPENSE",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    examples: "Packaging bags, tea, airtime, watchman, cleaning"
  },
  {
    id: "TRAVEL",
    label: "Travel, Transport & Boda",
    shortLabel: "Travel",
    type: "BUSINESS_EXPENSE",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    examples: "Boda boda fare, matatu to wholesale market, fuel"
  },
  {
    id: "PERSONAL_WITHDRAWAL",
    label: "Personal Withdrawal (Owner Drawing)",
    shortLabel: "Personal Withdrawal",
    type: "OWNER_DRAWING",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    examples: "Owner cash drawing, home upkeep, school fees, lunch"
  },
  {
    id: "UTILITIES",
    label: "Utilities (KPLC Tokens, Water, WiFi)",
    shortLabel: "Utilities",
    type: "BUSINESS_EXPENSE",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    examples: "KPLC prepaid electricity tokens, water bill, internet"
  },
  {
    id: "WAGES",
    label: "Wages & Casual Labor",
    shortLabel: "Wages",
    type: "BUSINESS_EXPENSE",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    examples: "Shop attendant salary, offloading casuals, errands"
  },
  {
    id: "SUPPLIES",
    label: "County Permits & Licenses",
    shortLabel: "Permits",
    type: "BUSINESS_EXPENSE",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    examples: "County single business permit, health certificate"
  },
  {
    id: "OTHER_CUSTOM",
    label: "Other / Custom Expense",
    shortLabel: "Other / Custom",
    type: "BUSINESS_EXPENSE",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    examples: "Repairs, security, stationery, or custom note"
  }
];

export const QUICK_EXPENSE_PRESETS: Array<{
  label: string;
  category: ExpenseCategoryMeta["id"];
  defaultNote: string;
  defaultPayee: string;
}> = [
  {
    label: "Shop Rent",
    category: "RENT",
    defaultNote: "Monthly shop rent & stall lease payment",
    defaultPayee: "Landlord"
  },
  {
    label: "Misc (Bags / Tea / Cleaning)",
    category: "MISC",
    defaultNote: "Packaging paper bags, carrier bags & shop tea",
    defaultPayee: "Local Vendor"
  },
  {
    label: "Travel / Boda / Fare",
    category: "TRAVEL",
    defaultNote: "Travel & boda fare to wholesale market for stock",
    defaultPayee: "Boda / Matatu"
  },
  {
    label: "Personal Withdrawal (Owner Drawing)",
    category: "PERSONAL_WITHDRAWAL",
    defaultNote: "Owner personal cash withdrawal for home upkeep",
    defaultPayee: "Owner (Self)"
  },
  {
    label: "KPLC Electricity / Water",
    category: "UTILITIES",
    defaultNote: "KPLC prepaid electricity tokens & shop water",
    defaultPayee: "KPLC / Water"
  },
  {
    label: "Casual Offloading / Wages",
    category: "WAGES",
    defaultNote: "Casual labor for offloading wholesale bags",
    defaultPayee: "Shop Casual"
  }
];

export default function OwnerExpensesTab({
  state,
  onAddExpense,
  onEditExpense,
  onDeleteExpense
}: OwnerExpensesTabProps) {
  const { currency = "KSh", payouts = [] } = state;

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryMeta["id"]>("RENT");
  const [customCategoryLabel, setCustomCategoryLabel] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [paymentChannel, setPaymentChannel] = useState<"CASH_DRAWER" | "MPESA_TILL" | "BANK_TRANSFER">("CASH_DRAWER");
  const [payeeInput, setPayeeInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filter & Search state
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("MISC");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editChannel, setEditChannel] = useState<string>("CASH_DRAWER");

  // Helper to infer category for legacy payouts without explicit expense_category
  const resolveCategory = (p: PayoutOrDrawing): ExpenseCategoryMeta => {
    if (p.expense_category) {
      const found = EXPENSE_CATEGORIES.find((c) => c.id === p.expense_category);
      if (found) return found;
    }
    const lower = (p.notes || "").toLowerCase();
    if (lower.includes("rent") || lower.includes("lease") || lower.includes("stall")) {
      return EXPENSE_CATEGORIES[0];
    }
    if (lower.includes("travel") || lower.includes("boda") || lower.includes("fare") || lower.includes("transport") || lower.includes("fuel")) {
      return EXPENSE_CATEGORIES[2];
    }
    if (p.type === "OWNER_DRAWING" || lower.includes("personal") || lower.includes("withdrawal") || lower.includes("drawing") || lower.includes("home")) {
      return EXPENSE_CATEGORIES[3];
    }
    if (lower.includes("kplc") || lower.includes("token") || lower.includes("electric") || lower.includes("water") || lower.includes("wifi")) {
      return EXPENSE_CATEGORIES[4];
    }
    if (lower.includes("wage") || lower.includes("salary") || lower.includes("casual")) {
      return EXPENSE_CATEGORIES[5];
    }
    if (lower.includes("permit") || lower.includes("council") || lower.includes("license")) {
      return EXPENSE_CATEGORIES[6];
    }
    return EXPENSE_CATEGORIES[1]; // MISC
  };

  // All non-supplier payouts (Rent, Misc, Travel, Personal Withdrawal, Utilities, Wages, etc.)
  const ownerAndExpensePayouts = payouts.filter((p) => p.type !== "SUPPLIER_PAYOUT");

  const filteredExpenses = ownerAndExpensePayouts.filter((p) => {
    const cat = resolveCategory(p);
    if (categoryFilter !== "ALL" && cat.id !== categoryFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchNotes = (p.notes || "").toLowerCase().includes(q);
      const matchCat = cat.label.toLowerCase().includes(q) || cat.shortLabel.toLowerCase().includes(q);
      const matchPayee = (p.payee || "").toLowerCase().includes(q);
      return matchNotes || matchCat || matchPayee;
    }
    return true;
  });

  // Totals (supporting integer & floating-point decimals)
  const totalBusinessExpenses = Math.round(
    ownerAndExpensePayouts
      .filter((p) => resolveCategory(p).type === "BUSINESS_EXPENSE")
      .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0) * 100
  ) / 100;

  const totalPersonalWithdrawals = Math.round(
    ownerAndExpensePayouts
      .filter((p) => resolveCategory(p).type === "OWNER_DRAWING")
      .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0) * 100
  ) / 100;

  const totalRent = Math.round(
    ownerAndExpensePayouts
      .filter((p) => resolveCategory(p).id === "RENT")
      .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0) * 100
  ) / 100;

  const totalTravelAndMisc = Math.round(
    ownerAndExpensePayouts
      .filter((p) => ["TRAVEL", "MISC"].includes(resolveCategory(p).id))
      .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0) * 100
  ) / 100;

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amountInput);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setSuccessBanner("Please enter a valid amount (decimals like 150.50 are supported).");
      setTimeout(() => setSuccessBanner(null), 3500);
      return;
    }

    const catMeta = EXPENSE_CATEGORIES.find((c) => c.id === selectedCategory) || EXPENSE_CATEGORIES[1];
    const displayTag =
      selectedCategory === "OTHER_CUSTOM" && customCategoryLabel.trim()
        ? customCategoryLabel.trim()
        : catMeta.shortLabel;
    const cleanNotes = notesInput.trim() || `${displayTag} recorded by owner`;
    const fullNote = payeeInput.trim()
      ? `[${displayTag}] ${cleanNotes} — Paid to: ${payeeInput.trim()}`
      : `[${displayTag}] ${cleanNotes}`;

    const newRecord: PayoutOrDrawing = {
      id: `exp_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: expenseDate,
      amount: Math.round(numericAmount * 100) / 100,
      type: catMeta.type,
      expense_category: catMeta.id,
      payee: payeeInput.trim() || undefined,
      notes: fullNote,
      payment_channel: paymentChannel
    };

    onAddExpense(newRecord);
    setAmountInput("");
    setNotesInput("");
    setPayeeInput("");
    setCustomCategoryLabel("");
    setSuccessBanner(
      `✓ Recorded ${displayTag}: ${currency} ${newRecord.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} (${paymentChannel.replace("_", " ")})`
    );
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleStartEdit = (p: PayoutOrDrawing) => {
    const cat = resolveCategory(p);
    setEditingId(p.id);
    setEditAmount(String(p.amount));
    setEditCategory(cat.id);
    setEditNotes(p.notes || "");
    setEditDate(p.date || new Date().toISOString().slice(0, 10));
    setEditChannel(p.payment_channel || "CASH_DRAWER");
  };

  const handleSaveEdit = (id: string) => {
    const parsedAmt = parseFloat(editAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) return;
    const catMeta = EXPENSE_CATEGORIES.find((c) => c.id === editCategory) || EXPENSE_CATEGORIES[1];

    if (onEditExpense) {
      onEditExpense(id, {
        amount: Math.round(parsedAmt * 100) / 100,
        type: catMeta.type,
        expense_category: catMeta.id,
        notes: editNotes,
        date: editDate,
        payment_channel: editChannel
      });
    }
    setEditingId(null);
    setSuccessBanner(`✓ Updated ${catMeta.shortLabel} entry.`);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case "RENT":
        return <Home size={14} />;
      case "TRAVEL":
        return <Car size={14} />;
      case "PERSONAL_WITHDRAWAL":
        return <UserMinus size={14} />;
      case "UTILITIES":
        return <Zap size={14} />;
      case "WAGES":
        return <Users size={14} />;
      case "SUPPLIES":
        return <FileCheck size={14} />;
      default:
        return <Coffee size={14} />;
    }
  };

  const activeCategoryMeta = EXPENSE_CATEGORIES.find((c) => c.id === selectedCategory) || EXPENSE_CATEGORIES[0];

  // Quick inline notepad state (moved from Home Page into Expenses -> Owner Expenses module)
  const [quickExpCategory, setQuickExpCategory] = useState<"RENT" | "MISC" | "TRAVEL" | "PERSONAL_WITHDRAWAL">("RENT");
  const [quickExpAmount, setQuickExpAmount] = useState("");
  const [quickExpNote, setQuickExpNote] = useState("");
  const [quickExpChannel, setQuickExpChannel] = useState<"CASH_DRAWER" | "MPESA_TILL">("CASH_DRAWER");

  const handleQuickExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(quickExpAmount);
    if (isNaN(num) || num <= 0) return;
    const catLabels: Record<string, string> = {
      RENT: "Rent",
      MISC: "Misc",
      TRAVEL: "Travel",
      PERSONAL_WITHDRAWAL: "Personal Withdrawal"
    };
    const shortLabel = catLabels[quickExpCategory] || "Misc";
    const newRecord: PayoutOrDrawing = {
      id: `exp_quick_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString().slice(0, 10),
      amount: Math.round(num * 100) / 100,
      type: quickExpCategory === "PERSONAL_WITHDRAWAL" ? "OWNER_DRAWING" : "BUSINESS_EXPENSE",
      expense_category: quickExpCategory,
      notes: `[${shortLabel}] ${quickExpNote.trim() || `${shortLabel} noted by owner`}`,
      payment_channel: quickExpChannel
    };
    onAddExpense(newRecord);
    setQuickExpAmount("");
    setQuickExpNote("");
    setSuccessBanner(
      `✓ Noted ${shortLabel}: ${currency} ${newRecord.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    );
    setTimeout(() => setSuccessBanner(null), 4500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-900 pb-12">
      {/* HEADER: EXPENSES -> OWNER EXPENSES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Expenses /
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="text-blue-600 shrink-0" size={22} /> Owner Expenses &amp; Personal Withdrawals
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold uppercase">
              Rent &bull; Misc &bull; Travel &bull; Drawings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Under Expenses: Note shop rent, miscellaneous costs, travel/transport, utilities, and personal owner withdrawals with full decimal support.
          </p>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{successBanner}</span>
        </div>
      )}

      {/* QUICK OWNER EXPENSE & PERSONAL WITHDRAWAL NOTE PAD (MOVED FROM HOME PAGE TO EXPENSES MODULE) */}
      <div className="bg-white rounded-2xl border-2 border-indigo-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <Wallet size={15} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Quick Note: Owner Expense or Personal Withdrawal (Rent &bull; Misc &bull; Travel &bull; Personal Withdrawal)
              </h3>
              <p className="text-[11px] text-slate-500">
                Fast 1-line entry for shop rent, miscellaneous upkeep, travel/boda fare, or personal cash withdrawals.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleQuickExpenseSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "RENT", label: "Rent", icon: <Home size={12} /> },
              { id: "MISC", label: "Misc", icon: <Coffee size={12} /> },
              { id: "TRAVEL", label: "Travel", icon: <Car size={12} /> },
              { id: "PERSONAL_WITHDRAWAL", label: "Personal Withdrawal", icon: <UserMinus size={12} /> }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setQuickExpCategory(cat.id as any)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                  quickExpCategory === cat.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <input
              type="number"
              step="any"
              min="0"
              required
              value={quickExpAmount}
              onChange={(e) => setQuickExpAmount(e.target.value)}
              placeholder={`Amount (${currency}) e.g. 250 or 145.50`}
              className="w-full sm:w-44 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
            <input
              type="text"
              value={quickExpNote}
              onChange={(e) => setQuickExpNote(e.target.value)}
              placeholder="Note (e.g. Stall rent, boda fare, packaging bags, home drawing...)"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
            <select
              value={quickExpChannel}
              onChange={(e) => setQuickExpChannel(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="CASH_DRAWER">Cash</option>
              <option value="MPESA_TILL">M-Pesa</option>
            </select>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus size={14} />
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Operating Expenses</span>
          <div className="text-lg sm:text-xl font-serif font-bold text-slate-900 mt-0.5 font-mono">
            {currency} {totalBusinessExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Rent, travel, utilities &amp; misc</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">Personal Withdrawals</span>
          <div className="text-lg sm:text-xl font-serif font-bold text-rose-700 mt-0.5 font-mono">
            {currency} {totalPersonalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Owner drawings &amp; home use</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Rent &amp; Lease</span>
          <div className="text-lg sm:text-xl font-serif font-bold text-indigo-700 mt-0.5 font-mono">
            {currency} {totalRent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Storefront &amp; stall rent</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Travel &amp; Misc</span>
          <div className="text-lg sm:text-xl font-serif font-bold text-amber-700 mt-0.5 font-mono">
            {currency} {totalTravelAndMisc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Transport, boda, tea &amp; upkeep</span>
        </div>
      </div>

      {/* RECORD NEW EXPENSE / PERSONAL WITHDRAWAL CARD */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-serif font-bold text-slate-900">
              Detailed Owner Expense &amp; Withdrawal Entry
            </h2>
            <p className="text-xs text-slate-500">
              Tap a category or 1-tap preset below and enter the amount (whole numbers or decimals like 150.50).
            </p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border inline-flex items-center gap-1.5 self-start ${activeCategoryMeta.badgeColor}`}>
            {getCategoryIcon(activeCategoryMeta.id)}
            <span>{activeCategoryMeta.label}</span>
          </span>
        </div>

        {/* 1-TAP QUICK FILL PRESETS */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            1-Tap Quick Templates (Rent &bull; Misc &bull; Travel &bull; Personal Withdrawal):
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {QUICK_EXPENSE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setSelectedCategory(preset.category);
                  setNotesInput(preset.defaultNote);
                  setPayeeInput(preset.defaultPayee);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* QUICK CATEGORY SELECTOR BUTTONS */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {EXPENSE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleRecordExpense} className="space-y-4 pt-1">
          {selectedCategory === "OTHER_CUSTOM" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-teal-700 mb-1">
                Custom Expense Type (e.g. Repairs, Security, Packaging, Charity)
              </label>
              <input
                type="text"
                value={customCategoryLabel}
                onChange={(e) => setCustomCategoryLabel(e.target.value)}
                placeholder="Type custom expense category name..."
                className="w-full sm:w-80 bg-teal-50/40 border border-teal-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* AMOUNT (INTEGER OR FLOATING POINT DECIMAL) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Amount ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 2500 or 145.50"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* DATE */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* PAID FROM CHANNEL */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Paid From
              </label>
              <select
                value={paymentChannel}
                onChange={(e) => setPaymentChannel(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="CASH_DRAWER">Cash Drawer / Till</option>
                <option value="MPESA_TILL">M-Pesa Business Till</option>
                <option value="BANK_TRANSFER">Bank / Equitel</option>
              </select>
            </div>

            {/* OPTIONAL PAYEE / RECIPIENT */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Paid To / Recipient (Optional)
              </label>
              <input
                type="text"
                value={payeeInput}
                onChange={(e) => setPayeeInput(e.target.value)}
                placeholder="e.g. Landlord, Boda Rider, Self"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Expense / Withdrawal Note
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder={`e.g. ${activeCategoryMeta.examples}`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span>Save {selectedCategory === "OTHER_CUSTOM" && customCategoryLabel.trim() ? customCategoryLabel.trim() : activeCategoryMeta.shortLabel}</span>
            </button>
          </div>
        </form>
      </div>

      {/* EXPENSE & WITHDRAWAL HISTORY LEDGER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900">
              Owner Expenses &amp; Withdrawals Ledger ({filteredExpenses.length})
            </h3>
            <p className="text-xs text-slate-500">
              Filter by Rent, Misc, Travel, Personal Withdrawal, or edit any entry directly.
            </p>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rent, travel, misc..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              categoryFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            All ({ownerAndExpensePayouts.length})
          </button>
          {EXPENSE_CATEGORIES.map((cat) => {
            const count = ownerAndExpensePayouts.filter((p) => resolveCategory(p).id === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  categoryFilter === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <span>{cat.shortLabel}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* LIST OF EXPENSES */}
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No expenses or withdrawals recorded in this view yet. Use the form above to note Rent, Misc, Travel, or Personal Withdrawals.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredExpenses.map((exp) => {
              const cat = resolveCategory(exp);
              const isEditing = editingId === exp.id;

              if (isEditing) {
                return (
                  <div key={exp.id} className="p-3.5 rounded-2xl border-2 border-blue-400 bg-blue-50/30 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Category</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold"
                        >
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Amount ({currency})</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Channel</label>
                        <select
                          value={editChannel}
                          onChange={(e) => setEditChannel(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs"
                        >
                          <option value="CASH_DRAWER">Cash Drawer</option>
                          <option value="MPESA_TILL">M-Pesa Till</option>
                          <option value="BANK_TRANSFER">Bank / Equitel</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-lg p-1.5 text-xs"
                        placeholder="Expense note..."
                      />
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(exp.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={13} /> Save
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={exp.id}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`p-2 rounded-xl border shrink-0 ${cat.badgeColor}`}>
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cat.badgeColor}`}>
                          {cat.shortLabel}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {exp.date || "Today"} &bull; {exp.timestamp}
                        </span>
                        {exp.payment_channel && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {exp.payment_channel.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-900 mt-1">
                        {exp.notes}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                    <div className="text-right font-mono">
                      <span className={`text-sm font-bold ${cat.type === "OWNER_DRAWING" ? "text-rose-700" : "text-slate-900"}`}>
                        -{currency} {(parseFloat(String(exp.amount)) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(exp)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Edit expense"
                      >
                        <Edit2 size={14} />
                      </button>
                      {onDeleteExpense && (
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
