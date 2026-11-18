import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Phone,
  AlertTriangle,
  X,
  Building2,
  Copy,
  Check,
  Calendar,
  Edit3,
  Trash2,
  MessageSquare,
  Package,
  Clock
} from "lucide-react";
import { CustomerDebtor, DebtLineItem, InventoryItem } from "../../types/alacio";
import {
  getLocalTodayIso,
  addDaysToIso,
  getDaysPastDue,
  isDebtorOverdue,
  getOverdueDebtors,
  formatDebtItemsSummary
} from "../../utils/debtScheduleHelper";

interface CustomersCreditTabProps {
  currency: string;
  customers: CustomerDebtor[];
  inventory?: InventoryItem[];
  onRepayDebt: (customerId: string, amount: number, date?: string) => void;
  onAddDebtor: (newDebtor: {
    name: string;
    phone: string;
    national_id?: string;
    credit_limit: number;
    initial_debt: number;
    due_date?: string;
    items_taken?: DebtLineItem[];
    notes: string;
    date?: string;
  }) => void;
  onEditCustomer?: (customerId: string, updatedData: Partial<CustomerDebtor>) => void;
  onDeleteCustomer?: (customerId: string) => void;
  initialFilter?: "all" | "has_debt" | "overdue";
}

interface DraftDebtLine {
  key: string;
  item_name: string;
  qty: string;
  unit_type: string;
  unit_price: string;
}

function createEmptyDraftLine(): DraftDebtLine {
  return {
    key: `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    item_name: "",
    qty: "1",
    unit_type: "pcs",
    unit_price: ""
  };
}

export default function CustomersCreditTab({
  currency,
  customers,
  inventory = [],
  onRepayDebt,
  onAddDebtor,
  onEditCustomer,
  onDeleteCustomer,
  initialFilter = "all"
}: CustomersCreditTabProps) {
  const todayIso = getLocalTodayIso();

  const [filterMode, setFilterMode] = useState<"all" | "overdue" | "upcoming" | "settled">(
    initialFilter === "overdue" ? "overdue" : "all"
  );
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDepositRefOpen, setIsDepositRefOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<CustomerDebtor | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayDate, setRepayDate] = useState(() => getLocalTodayIso());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Edit debtor states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<CustomerDebtor | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNationalId, setEditNationalId] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const [editDebt, setEditDebt] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Delete debtor states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [debtorToDelete, setDebtorToDelete] = useState<CustomerDebtor | null>(null);

  // Add Debtor Account / Add Real Items form states
  const [addingToExisting, setAddingToExisting] = useState<CustomerDebtor | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNationalId, setNewNationalId] = useState("");
  const [newLimit, setNewLimit] = useState("2000");
  const [newDebtDate, setNewDebtDate] = useState(() => getLocalTodayIso());
  const [newDueDate, setNewDueDate] = useState(() => addDaysToIso(getLocalTodayIso(), 3));
  const [draftLines, setDraftLines] = useState<DraftDebtLine[]>(() => [createEmptyDraftLine()]);
  const [newNotes, setNewNotes] = useState("");

  const overdueDebtors = useMemo(() => getOverdueDebtors(customers, todayIso), [customers, todayIso]);
  const totalOverdueAmount = useMemo(
    () => overdueDebtors.reduce((acc, c) => acc + (Number(c.debt_balance) || 0), 0),
    [overdueDebtors]
  );
  const totalOutstanding = useMemo(
    () => customers.reduce((acc, c) => acc + (Number(c.debt_balance) || 0), 0),
    [customers]
  );
  const upcomingDebtAmount = Math.max(0, totalOutstanding - totalOverdueAmount);

  const parsedDraftItems: DebtLineItem[] = useMemo(() => {
    return draftLines
      .map((line) => {
        const qty = parseFloat(line.qty) || 0;
        const unitPrice = parseFloat(line.unit_price) || 0;
        const cleanName = line.item_name.trim();
        const lineTotal = Math.round(qty * unitPrice * 100) / 100;
        return {
          id: line.key,
          item_name: cleanName,
          qty,
          unit_type: line.unit_type.trim() || "pcs",
          unit_price: unitPrice,
          line_total: lineTotal,
          date_taken: newDebtDate
        };
      })
      .filter((it) => it.item_name.length > 0 && it.qty > 0 && it.unit_price > 0);
  }, [draftLines, newDebtDate]);

  const computedTotalFromItems = useMemo(
    () => Math.round(parsedDraftItems.reduce((sum, it) => sum + it.line_total, 0) * 100) / 100,
    [parsedDraftItems]
  );

  const sortedAndFilteredDebtors = useMemo(() => {
    const filtered = customers.filter((d) => {
      const bal = Number(d.debt_balance) || 0;
      const overdue = isDebtorOverdue(d, todayIso);
      if (filterMode === "overdue") return overdue;
      if (filterMode === "upcoming") return bal > 0 && !overdue;
      if (filterMode === "settled") return bal <= 0;
      return true;
    });

    // Overdue accounts always surface first, followed by active unpaid debt, then settled
    return [...filtered].sort((a, b) => {
      const aOverdue = isDebtorOverdue(a, todayIso) ? 1 : 0;
      const bOverdue = isDebtorOverdue(b, todayIso) ? 1 : 0;
      if (bOverdue !== aOverdue) return bOverdue - aOverdue;

      if (aOverdue && bOverdue) {
        const aDays = getDaysPastDue(a.due_date, todayIso) || 0;
        const bDays = getDaysPastDue(b.due_date, todayIso) || 0;
        if (bDays !== aDays) return bDays - aDays;
      }

      return (Number(b.debt_balance) || 0) - (Number(a.debt_balance) || 0);
    });
  }, [customers, filterMode, todayIso]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const resetAddForm = (existing?: CustomerDebtor | null) => {
    if (existing) {
      setAddingToExisting(existing);
      setNewName(existing.name);
      setNewPhone(existing.phone || "");
      setNewNationalId(existing.national_id || "");
      setNewLimit(String(existing.credit_limit || 2000));
      setNewDueDate(existing.due_date || addDaysToIso(todayIso, 3));
      setNewNotes("");
    } else {
      setAddingToExisting(null);
      setNewName("");
      setNewPhone("");
      setNewNationalId("");
      setNewLimit("2000");
      setNewDueDate(addDaysToIso(todayIso, 3));
      setNewNotes("");
    }
    setNewDebtDate(todayIso);
    setDraftLines([createEmptyDraftLine()]);
    setIsAddOpen(true);
  };

  const handleSelectInventoryItem = (lineKey: string, invName: string) => {
    const matched = inventory.find((inv) => inv.name === invName);
    setDraftLines((prev) =>
      prev.map((l) => {
        if (l.key !== lineKey) return l;
        if (matched) {
          return {
            ...l,
            item_name: matched.name,
            unit_type: matched.unit_type || "pcs",
            unit_price: String(matched.unit_retail || 0)
          };
        }
        return { ...l, item_name: invName };
      })
    );
  };

  const handleOpenRepay = (debtor: CustomerDebtor) => {
    setSelectedDebtor(debtor);
    setRepayAmount(String(debtor.debt_balance));
    setRepayDate(getLocalTodayIso());
    setIsRepayOpen(true);
  };

  const handleOpenDepositRef = (debtor: CustomerDebtor) => {
    setSelectedDebtor(debtor);
    setIsDepositRefOpen(true);
    setCopiedId(false);
  };

  const handleOpenEdit = (debtor: CustomerDebtor) => {
    setEditingDebtor(debtor);
    setEditName(debtor.name);
    setEditPhone(debtor.phone);
    setEditNationalId(debtor.national_id || "");
    setEditLimit(String(debtor.credit_limit));
    setEditDebt(String(debtor.debt_balance));
    setEditDueDate(debtor.due_date || "");
    setEditNotes(debtor.notes || "");
    setIsEditOpen(true);
  };

  const handleExecuteEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebtor || !editName.trim()) return;

    if (onEditCustomer) {
      onEditCustomer(editingDebtor.id, {
        name: editName.trim(),
        phone: editPhone.trim() || "07XX XXX XXX",
        national_id: editNationalId.trim() || undefined,
        credit_limit: parseFloat(editLimit) || 0,
        debt_balance: parseFloat(editDebt) || 0,
        due_date: editDueDate || undefined,
        notes: editNotes.trim()
      });
    }

    setIsEditOpen(false);
    showToast(`Debtor account "${editName.trim()}" updated.`);
  };

  const handleOpenDelete = (debtor: CustomerDebtor) => {
    setDebtorToDelete(debtor);
    setIsDeleteOpen(true);
  };

  const handleExecuteDelete = () => {
    if (!debtorToDelete) return;
    if (onDeleteCustomer) {
      onDeleteCustomer(debtorToDelete.id);
    }
    setIsDeleteOpen(false);
    showToast(`Debtor account "${debtorToDelete.name}" deleted.`);
    setDebtorToDelete(null);
  };

  const handleExecuteRepay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor || !repayAmount) return;
    const amount = parseFloat(repayAmount);
    if (amount <= 0) return;

    onRepayDebt(selectedDebtor.id, amount, repayDate);
    setIsRepayOpen(false);
    showToast(
      `Payment of ${currency} ${amount.toLocaleString()} recorded for ${selectedDebtor.name} (${repayDate}). Added to Cash Drawer.`
    );
  };

  const handleCreateDebtor = (e: React.FormEvent) => {
    e.preventDefault();
    const targetName = (addingToExisting?.name || newName).trim();
    if (!targetName || parsedDraftItems.length === 0 || computedTotalFromItems <= 0 || !newDueDate) {
      return;
    }

    onAddDebtor({
      name: targetName,
      phone: (addingToExisting?.phone || newPhone).trim() || "07XX XXX XXX",
      national_id: (addingToExisting?.national_id || newNationalId).trim() || undefined,
      credit_limit: Math.max(parseFloat(newLimit) || 0, computedTotalFromItems),
      initial_debt: computedTotalFromItems,
      due_date: newDueDate,
      items_taken: parsedDraftItems,
      notes: newNotes.trim(),
      date: newDebtDate
    });

    setIsAddOpen(false);
    const dueDiff = getDaysPastDue(newDueDate, todayIso);
    if (dueDiff !== null && dueDiff > 0) {
      showToast(
        `Debtor "${targetName}" logged (${currency} ${computedTotalFromItems.toLocaleString()}). Pay-by date ${newDueDate} has passed — reflecting across screens.`
      );
    } else {
      showToast(
        `Debtor "${targetName}" saved (${currency} ${computedTotalFromItems.toLocaleString()} for ${parsedDraftItems.length} item${parsedDraftItems.length > 1 ? "s" : ""}) · Pay by ${newDueDate}.`
      );
    }
  };

  // End-of-month helper date
  const endOfMonthIso = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const y = lastDay.getFullYear();
    const m = String(lastDay.getMonth() + 1).padStart(2, "0");
    const d = String(lastDay.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  return (
    <div className="space-y-5 max-w-6xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
            <BookOpen className="text-amber-400" size={22} /> Debtor Accounts &amp; Real Deni Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track real debts, real items taken, exact KSh numbers, and a hard pay-by date. Once a pay-by date passes unpaid, it automatically reflects across all workspace screens.
          </p>
        </div>

        <button
          onClick={() => resetAddForm(null)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Plus size={15} /> Add Debtor Account
        </button>
      </div>

      {/* PAST-DUE ALERT BANNER (REFLECTS AUTOMATICALLY ONCE DUE DATE PASSES) */}
      {overdueDebtors.length > 0 && (
        <div className="bg-red-950/75 border-2 border-red-500/60 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {overdueDebtors.length} Debtor Account{overdueDebtors.length > 1 ? "s" : ""} Past Pay-By Date
                </h3>
                <p className="text-[11px] text-red-200">
                  Total overdue debt: <strong className="font-mono text-white">{currency} {totalOverdueAmount.toLocaleString()}</strong> &mdash; date limit passed and now reflecting across screens.
                </p>
              </div>
            </div>

            {filterMode !== "overdue" && (
              <button
                type="button"
                onClick={() => setFilterMode("overdue")}
                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold cursor-pointer self-start sm:self-auto"
              >
                Show Only Past Due ({overdueDebtors.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {overdueDebtors.map((od) => {
              const itemsText = formatDebtItemsSummary(od.items_taken);
              return (
                <div
                  key={od.id}
                  className="bg-[#0d1118] border border-red-500/35 rounded-xl p-3 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs">{od.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-400/40 text-red-300 font-mono text-[10px] font-bold">
                        {od.daysPastDue}d past due ({od.due_date})
                      </span>
                    </div>
                    {itemsText ? (
                      <p className="text-[11px] text-slate-300 truncate" title={itemsText}>
                        Items: {itemsText}
                      </p>
                    ) : (
                      od.notes && <p className="text-[11px] text-slate-400 truncate">{od.notes}</p>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono">{od.phone}</div>
                  </div>
                  <div className="text-right shrink-0 space-y-1.5">
                    <div className="text-sm font-black font-mono text-red-300">
                      {currency} {od.debt_balance.toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenRepay(od)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                    >
                      Collect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Real Debt Owed</span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {currency} {totalOutstanding.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {customers.filter((c) => c.debt_balance > 0).length} active debtor account{customers.filter((c) => c.debt_balance > 0).length === 1 ? "" : "s"}
          </span>
        </div>

        <div
          className={`rounded-2xl p-5 shadow-lg border ${
            overdueDebtors.length > 0
              ? "bg-red-950/50 border-red-500/50"
              : "bg-[#121822] border-slate-800"
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-slate-300 font-bold block">
            Past Pay-By Date (Reflecting)
          </span>
          <div className={`text-2xl font-black font-mono mt-1 ${overdueDebtors.length > 0 ? "text-red-300" : "text-emerald-400"}`}>
            {currency} {totalOverdueAmount.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {overdueDebtors.length > 0
              ? `${overdueDebtors.length} debtor${overdueDebtors.length > 1 ? "s" : ""} past agreed date`
              : "No overdue debts reflecting right now"}
          </span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Within Pay-By Date</span>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">
            {currency} {upcomingDebtAmount.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Tracked quietly until deadline passes
          </span>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: `All Debtors (${customers.length})` },
          { id: "overdue", label: `Past Due · Reflecting (${overdueDebtors.length})`, danger: overdueDebtors.length > 0 },
          {
            id: "upcoming",
            label: `Before Due Date (${customers.filter((c) => c.debt_balance > 0 && !isDebtorOverdue(c, todayIso)).length})`
          },
          { id: "settled", label: `Settled (${customers.filter((c) => c.debt_balance <= 0).length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterMode(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border ${
              filterMode === tab.id
                ? tab.danger
                  ? "bg-red-500 text-white border-red-400"
                  : "bg-amber-500 text-slate-950 border-amber-400"
                : tab.danger
                ? "bg-red-950/50 text-red-300 border-red-500/40 hover:bg-red-900/50"
                : "bg-[#121822] text-slate-300 border-slate-700 hover:border-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DEBTOR ACCOUNTS TABLE */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {sortedAndFilteredDebtors.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <BookOpen size={28} className="text-slate-500 mx-auto" />
            <div className="text-sm font-bold text-white">
              {customers.length === 0 ? "No debtor accounts recorded yet" : "No debtor accounts in this filter"}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add a debtor account with the real items taken, exact KSh numbers, and a hard pay-by date.
            </p>
            <button
              type="button"
              onClick={() => resetAddForm(null)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Debtor Account
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a0d12] border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Debtor Account</th>
                  <th className="py-3.5 px-4 font-semibold">Real Items / Stuff Taken</th>
                  <th className="py-3.5 px-4 font-semibold">Pay-By Date (Hard Limit)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Real Debt Owed</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedAndFilteredDebtors.map((debtor) => {
                  const overdue = isDebtorOverdue(debtor, todayIso);
                  const daysPast = getDaysPastDue(debtor.due_date, todayIso);
                  const items = debtor.items_taken || [];

                  return (
                    <tr
                      key={debtor.id}
                      className={`transition ${
                        overdue
                          ? "bg-red-950/35 hover:bg-red-950/50"
                          : "hover:bg-slate-800/30"
                      }`}
                    >
                      {/* DEBTOR ACCOUNT */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                          <span>{debtor.name}</span>
                          {overdue && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold">
                              PAST DUE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Phone size={11} className="text-slate-500" />
                            {debtor.phone}
                          </span>
                          {debtor.national_id && (
                            <button
                              type="button"
                              onClick={() => handleOpenDepositRef(debtor)}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 cursor-pointer"
                              title="View National ID deposit reference"
                            >
                              ID: {debtor.national_id}
                            </button>
                          )}
                        </div>
                        {debtor.notes && (
                          <div className="text-[11px] text-slate-400 mt-1">{debtor.notes}</div>
                        )}
                      </td>

                      {/* REAL ITEMS / STUFF TAKEN */}
                      <td className="py-3.5 px-4 align-top">
                        {items.length > 0 ? (
                          <div className="space-y-1 max-w-xs">
                            {items.map((it, idx) => (
                              <div
                                key={it.id || idx}
                                className="flex items-center justify-between gap-2 text-[11px] bg-[#0a0d12] border border-slate-800 rounded-lg px-2.5 py-1"
                              >
                                <span className="text-slate-200 font-medium truncate">
                                  {it.qty} {it.unit_type || "pcs"} &times; {it.item_name}
                                </span>
                                <span className="font-mono text-amber-300 font-semibold shrink-0">
                                  {currency} {Number(it.line_total || it.qty * it.unit_price).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            No itemized products attached yet — click &ldquo;+ Items&rdquo; to log real items
                          </span>
                        )}
                      </td>

                      {/* PAY-BY DATE (HARD DEADLINE) */}
                      <td className="py-3.5 px-4 align-top font-mono">
                        {debtor.due_date ? (
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Calendar size={12} className={overdue ? "text-red-400" : "text-amber-400"} />
                              <span>{debtor.due_date}</span>
                            </div>
                            {debtor.debt_balance <= 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                Settled
                              </span>
                            ) : overdue ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">
                                {daysPast} day{daysPast === 1 ? "" : "s"} overdue · Reflecting
                              </span>
                            ) : daysPast === 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                Due today
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                {Math.abs(daysPast || 0)} day{Math.abs(daysPast || 0) === 1 ? "" : "s"} left
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-400/90 flex items-center gap-1">
                            <Clock size={12} /> Set due date in Edit
                          </span>
                        )}
                      </td>

                      {/* REAL DEBT OWED */}
                      <td className="py-3.5 px-4 align-top text-right font-mono">
                        <div className={`text-sm font-black ${overdue ? "text-red-300" : debtor.debt_balance > 0 ? "text-white" : "text-emerald-400"}`}>
                          {currency} {debtor.debt_balance.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Taken: {debtor.last_transaction_date}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => resetAddForm(debtor)}
                            className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                            title="Add more real items on credit to this debtor account"
                          >
                            <Plus size={12} /> Items
                          </button>

                          {debtor.debt_balance > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenRepay(debtor)}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition cursor-pointer"
                              >
                                Repay
                              </button>
                              <a
                                href={`https://wa.me/254${debtor.phone.replace(/[^0-9]/g, "").slice(-9)}?text=${encodeURIComponent(
                                  `Habari ${debtor.name}, reminder on your shop debt balance of ${currency} ${debtor.debt_balance.toLocaleString()}${
                                    items.length > 0 ? ` (${formatDebtItemsSummary(items)})` : ""
                                  }${debtor.due_date ? ` due by ${debtor.due_date}` : ""}. Asante.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="Send WhatsApp payment reminder"
                              >
                                <MessageSquare size={12} /> Remind
                              </a>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(debtor)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                            title="Edit debtor account or due date"
                          >
                            <Edit3 size={12} /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(debtor)}
                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                            title="Delete debtor account"
                          >
                            <Trash2 size={12} />
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

      {/* AGENCY BANKING & OTC DEPOSIT REFERENCE MODAL */}
      {isDepositRefOpen && selectedDebtor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">National ID / OTC Reference</h3>
              </div>
              <button onClick={() => setIsDepositRefOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-[#0a0d12] border border-slate-800 rounded-xl space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Debtor Name:</span>
                <strong className="text-white">{selectedDebtor.name}</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">National ID No:</span>
                <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {selectedDebtor.national_id || "None"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Phone:</span>
                <span className="text-white">{selectedDebtor.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Debt Balance:</span>
                <strong className="text-amber-300">{currency} {selectedDebtor.debt_balance.toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedDebtor.national_id) {
                    navigator.clipboard.writeText(selectedDebtor.national_id);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedId ? "ID Copied!" : "Copy National ID"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDepositRefOpen(false)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPAYMENT MODAL */}
      {isRepayOpen && selectedDebtor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Record Debt Payment: {selectedDebtor.name}</h3>
              <button onClick={() => setIsRepayOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-[#0a0d12] border border-slate-800 rounded-xl text-xs space-y-1.5 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Real Debt Owed:</span>
                <strong className="text-amber-300">{currency} {selectedDebtor.debt_balance.toLocaleString()}</strong>
              </div>
              {selectedDebtor.due_date && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pay-By Date:</span>
                  <span className={isDebtorOverdue(selectedDebtor, todayIso) ? "text-red-300 font-bold" : "text-slate-200"}>
                    {selectedDebtor.due_date}
                  </span>
                </div>
              )}
              {selectedDebtor.items_taken && selectedDebtor.items_taken.length > 0 && (
                <div className="pt-1 border-t border-slate-800 text-[11px] text-slate-300 font-sans">
                  Items: {formatDebtItemsSummary(selectedDebtor.items_taken)}
                </div>
              )}
            </div>

            <form onSubmit={handleExecuteRepay} className="space-y-4">
              <div className="bg-[#0a0d12] border border-amber-500/40 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-amber-300 text-xs font-semibold flex items-center gap-1 font-mono">
                    <Calendar size={12} className="text-amber-400" /> Payment Date
                  </label>
                  <button
                    type="button"
                    onClick={() => setRepayDate(getLocalTodayIso())}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500 text-slate-950 font-bold cursor-pointer"
                  >
                    Today
                  </button>
                </div>
                <input
                  type="date"
                  required
                  value={repayDate}
                  onChange={(e) => setRepayDate(e.target.value)}
                  className="w-full bg-[#09090b] border border-amber-500/30 rounded-lg p-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">
                  Amount Paid ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  max={selectedDebtor.debt_balance}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-lg font-bold"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRepayOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer text-xs shadow-lg"
                >
                  Confirm Payment ({currency} {repayAmount || 0})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DEBTOR ACCOUNT / LOG REAL ITEMS & HARD PAY-BY DATE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-2xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Plus size={18} className="text-amber-400" />
                {addingToExisting
                  ? `Add Real Items / Debt to ${addingToExisting.name}`
                  : "Add Debtor Account"}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDebtor} className="space-y-4 text-xs">
              {!addingToExisting && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Debtor Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samuel Kamau"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0712 345 678"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">National ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 24891044"
                      value={newNationalId}
                      onChange={(e) => setNewNationalId(e.target.value)}
                      className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* REAL ITEMS / STUFF TAKEN */}
              <div className="bg-[#0a0d12] border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Package size={14} /> Real Items / Stuff Taken on Debt *
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftLines((prev) => [...prev, createEmptyDraftLine()])}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Another Item
                  </button>
                </div>

                {inventory.length > 0 && (
                  <datalist id="debtor-inventory-list">
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.name}>
                        {inv.name} ({currency} {inv.unit_retail}/{inv.unit_type})
                      </option>
                    ))}
                  </datalist>
                )}

                <div className="space-y-2">
                  {draftLines.map((line, index) => {
                    const lineTotal = (parseFloat(line.qty) || 0) * (parseFloat(line.unit_price) || 0);
                    return (
                      <div key={line.key} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 sm:col-span-5">
                          <input
                            type="text"
                            required={index === 0}
                            list={inventory.length > 0 ? "debtor-inventory-list" : undefined}
                            placeholder="Item / product name (pick or type)"
                            value={line.item_name}
                            onChange={(e) => handleSelectInventoryItem(line.key, e.target.value)}
                            className="w-full bg-[#121822] border border-slate-700 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            required={index === 0}
                            placeholder="Qty"
                            value={line.qty}
                            onChange={(e) =>
                              setDraftLines((prev) =>
                                prev.map((l) => (l.key === line.key ? { ...l, qty: e.target.value } : l))
                              )
                            }
                            className="w-full bg-[#121822] border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                          />
                        </div>
                        <div className="col-span-5 sm:col-span-3">
                          <input
                            type="number"
                            step="any"
                            min="1"
                            required={index === 0}
                            placeholder={`Price (${currency})`}
                            value={line.unit_price}
                            onChange={(e) =>
                              setDraftLines((prev) =>
                                prev.map((l) => (l.key === line.key ? { ...l, unit_price: e.target.value } : l))
                              )
                            }
                            className="w-full bg-[#121822] border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1 font-mono text-amber-300 font-bold">
                          <span>{lineTotal > 0 ? lineTotal.toLocaleString() : "0"}</span>
                          {draftLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setDraftLines((prev) => prev.filter((l) => l.key !== line.key))}
                              className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Computed Real Debt Total:</span>
                  <span className="text-base font-black font-mono text-amber-300">
                    {currency} {computedTotalFromItems.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* HARD PAY-BY DATE (DATE DEBT SHOULD NOT GO PAST) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Date Taken
                  </label>
                  <input
                    type="date"
                    required
                    value={newDebtDate}
                    onChange={(e) => setNewDebtDate(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div className="bg-amber-950/25 border border-amber-500/40 rounded-xl p-2.5 space-y-1.5">
                  <label className="text-amber-300 font-bold block text-[11px] flex items-center gap-1">
                    <Calendar size={12} /> Pay-By Date (Must Not Go Past) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#09090b] border border-amber-500/40 rounded-lg p-2 text-white font-mono text-xs"
                  />
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {[
                      { label: "Tomorrow", date: addDaysToIso(todayIso, 1) },
                      { label: "+3 Days", date: addDaysToIso(todayIso, 3) },
                      { label: "+7 Days", date: addDaysToIso(todayIso, 7) },
                      { label: "End of Month", date: endOfMonthIso }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setNewDueDate(preset.date)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                          newDueDate === preset.date
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Max Debt Ceiling ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Clears via M-Pesa after harvest"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={computedTotalFromItems <= 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  {addingToExisting
                    ? `Add ${currency} ${computedTotalFromItems.toLocaleString()} Debt`
                    : `Save Debtor Account (${currency} ${computedTotalFromItems.toLocaleString()})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEBTOR ACCOUNT MODAL */}
      {isEditOpen && editingDebtor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121822] border-2 border-cyan-500/40 w-full max-w-lg rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-white font-serif">
                  Edit Debtor Account: {editingDebtor.name}
                </h3>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExecuteEdit} className="space-y-3.5">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Debtor Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">National ID</label>
                  <input
                    type="text"
                    value={editNationalId}
                    onChange={(e) => setEditNationalId(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Real Debt ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    value={editDebt}
                    onChange={(e) => setEditDebt(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Pay-By Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-amber-500/40 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Limit ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Notes</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DEBTOR MODAL */}
      {isDeleteOpen && debtorToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#180f12] border-2 border-red-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-red-950 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Trash2 size={18} className="text-red-400" /> Delete Debtor Account
              </h3>
              <button onClick={() => setIsDeleteOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-[#0f090b] rounded-xl border border-red-900/40 space-y-1 font-mono text-xs">
              <div className="text-white font-bold text-sm font-sans">{debtorToDelete.name}</div>
              <div className="text-slate-400">Phone: {debtorToDelete.phone}</div>
              <div className="text-amber-300 font-bold pt-1">
                Outstanding Debt: {currency} {debtorToDelete.debt_balance.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete Debtor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
