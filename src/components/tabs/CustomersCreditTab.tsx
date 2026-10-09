import React, { useState } from "react";
import { 
  Users, Plus, CheckCircle2, DollarSign, Phone, ShieldAlert, 
  ArrowDownLeft, X, CreditCard, Building2, Copy, Check,
  Calendar, Edit3, Trash2, MessageSquare
} from "lucide-react";
import { CustomerDebtor } from "../../types/alacio";

interface CustomersCreditTabProps {
  currency: string;
  customers: CustomerDebtor[];
  onRepayDebt: (customerId: string, amount: number, date?: string) => void;
  onAddDebtor: (newDebtor: { 
    name: string; 
    phone: string; 
    national_id?: string; 
    credit_limit: number; 
    initial_debt: number; 
    notes: string;
    date?: string;
  }) => void;
  onEditCustomer?: (customerId: string, updatedData: Partial<CustomerDebtor>) => void;
  onDeleteCustomer?: (customerId: string) => void;
}

export default function CustomersCreditTab({ 
  currency, 
  customers, 
  onRepayDebt, 
  onAddDebtor,
  onEditCustomer,
  onDeleteCustomer
}: CustomersCreditTabProps) {
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDepositRefOpen, setIsDepositRefOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<CustomerDebtor | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayDate, setRepayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Edit debtor states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDebtor | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNationalId, setEditNationalId] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const [editDebt, setEditDebt] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Delete debtor states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerDebtor | null>(null);

  // New debtor form states
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNationalId, setNewNationalId] = useState("");
  const [newLimit, setNewLimit] = useState("1000");
  const [newDebt, setNewDebt] = useState("0");
  const [newDebtDate, setNewDebtDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newNotes, setNewNotes] = useState("");

  const totalOutstanding = customers.reduce((acc, c) => acc + c.debt_balance, 0);
  const totalCreditLimit = customers.reduce((acc, c) => acc + c.credit_limit, 0);

  const handleOpenRepay = (cust: CustomerDebtor) => {
    setSelectedCust(cust);
    setRepayAmount(String(cust.debt_balance));
    setRepayDate(new Date().toISOString().slice(0, 10));
    setIsRepayOpen(true);
  };

  const handleOpenDepositRef = (cust: CustomerDebtor) => {
    setSelectedCust(cust);
    setIsDepositRefOpen(true);
    setCopiedId(false);
  };

  const handleOpenEdit = (cust: CustomerDebtor) => {
    setEditingCustomer(cust);
    setEditName(cust.name);
    setEditPhone(cust.phone);
    setEditNationalId(cust.national_id || "");
    setEditLimit(String(cust.credit_limit));
    setEditDebt(String(cust.debt_balance));
    setEditNotes(cust.notes || "");
    setIsEditOpen(true);
  };

  const handleExecuteEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editName.trim()) return;

    if (onEditCustomer) {
      onEditCustomer(editingCustomer.id, {
        name: editName.trim(),
        phone: editPhone.trim() || "07XX XXX XXX",
        national_id: editNationalId.trim() || undefined,
        credit_limit: parseFloat(editLimit) || 0,
        debt_balance: parseFloat(editDebt) || 0,
        notes: editNotes.trim()
      });
    }

    setIsEditOpen(false);
    setToastMsg(`Customer account for "${editName}" updated successfully. Phone & National ID corrected.`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleOpenDelete = (cust: CustomerDebtor) => {
    setCustomerToDelete(cust);
    setIsDeleteOpen(true);
  };

  const handleExecuteDelete = () => {
    if (!customerToDelete) return;
    if (onDeleteCustomer) {
      onDeleteCustomer(customerToDelete.id);
    }
    setIsDeleteOpen(false);
    setToastMsg(`Customer account "${customerToDelete.name}" deleted. All remaining records preserved.`);
    setCustomerToDelete(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleExecuteRepay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || !repayAmount) return;
    const amount = parseFloat(repayAmount);
    if (amount <= 0) return;

    onRepayDebt(selectedCust.id, amount, repayDate);
    setIsRepayOpen(false);
    setToastMsg(`Repayment of ${currency} ${amount.toLocaleString()} received on ${repayDate} from ${selectedCust.name}! Added to cash register.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCreateDebtor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddDebtor({
      name: newName.trim(),
      phone: newPhone.trim() || "07XX XXX XXX",
      national_id: newNationalId.trim() || undefined,
      credit_limit: parseFloat(newLimit) || 1000,
      initial_debt: parseFloat(newDebt) || 0,
      notes: newNotes.trim() || "Neighborhood customer",
      date: newDebtDate
    });

    setIsAddOpen(false);
    setNewName("");
    setNewPhone("");
    setNewNationalId("");
    setNewDebt("0");
    setNewNotes("");
    setToastMsg(`Debtor account created for ${newName} on ${newDebtDate}!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
            <Users className="text-purple-400" size={22} /> Counter Credit Matrix // Deni Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Cold precision. Trusted debtor limits, National ID agency rails, and zero-drift debt settlements.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20 font-mono"
        >
          <Plus size={15} /> + Add Debtor Account
        </button>
      </div>

      {/* QUICK GUIDE ON HOW CUSTOMERS & NATIONAL ID DEPOSITS WORK */}
      <div className="bg-[#121822] border border-purple-500/30 rounded-2xl p-4 text-xs font-sans space-y-2">
        <div className="flex items-center gap-2 text-purple-300 font-bold font-mono text-[11px] uppercase">
          <Users size={14} /> Agency Rail Protocol:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
          <div className="p-2.5 bg-[#0a0d12] rounded-xl border border-slate-800">
            <span className="text-purple-400 font-bold block mb-0.5">1. Debtor Profile</span>
            Bind name, mobile, and strict credit ceiling.
          </div>
          <div className="p-2.5 bg-[#0a0d12] rounded-xl border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-0.5">2. National ID Key</span>
            Attach Kenyan ID for OTC agent deposits.
          </div>
          <div className="p-2.5 bg-[#0a0d12] rounded-xl border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-0.5">3. Fast Agency Slip</span>
            1-Click copy to settle via Equity, KCB, or Co-op agents.
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Outstanding Deni</span>
          <div className="text-2xl font-black font-mono text-purple-300 mt-1">
            {currency} {totalOutstanding.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across {customers.length} registered credit customers</span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">National ID Registered Rate</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {Math.round((customers.filter(c => c.national_id).length / Math.max(1, customers.length)) * 100)}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {customers.filter(c => c.national_id).length} of {customers.length} have verified ID for agent deposits
          </span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Credit Authorization</span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {currency} {totalCreditLimit.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Max shop counter credit risk capacity</span>
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0d12] border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Customer / Debtor</th>
                <th className="py-3.5 px-4 font-semibold">National ID</th>
                <th className="py-3.5 px-4 font-semibold">Phone / WhatsApp</th>
                <th className="py-3.5 px-4 font-semibold text-right">Current Balance</th>
                <th className="py-3.5 px-4 font-semibold text-right">Credit Limit</th>
                <th className="py-3.5 px-4 font-semibold text-center">Exposure</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {customers.map((cust) => {
                const ratio = cust.credit_limit > 0 ? (cust.debt_balance / cust.credit_limit) * 100 : 0;
                return (
                  <tr key={cust.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-white text-sm">{cust.name}</div>
                      <div className="text-[10px] text-slate-500">{cust.notes}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {cust.national_id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold text-[11px]">
                            {cust.national_id}
                          </span>
                          <button
                            onClick={() => handleOpenDepositRef(cust)}
                            className="text-[10px] text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                            title="View Agency Banking deposit reference"
                          >
                            Deposit Ref
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[11px] italic">Not on file</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-500" />
                        {cust.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-purple-300 text-sm">
                      {currency} {cust.debt_balance.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {currency} {cust.credit_limit.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-24 mx-auto space-y-1">
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ratio > 80 ? "bg-red-500" : ratio > 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={{ width: `${Math.min(100, ratio)}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-slate-500 text-center font-mono">
                          {ratio.toFixed(0)}%
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {cust.debt_balance > 0 && (
                          <a
                            href={`https://wa.me/254${cust.phone.replace(/[^0-9]/g, "").slice(-9)}?text=${encodeURIComponent(
                              `Habari ${cust.name}, this is Alacio Mini Shop. Your current outstanding balance is ${currency} ${cust.debt_balance.toLocaleString()}. You can pay via M-Pesa or Cash at the counter. Asante!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                            title="Send WhatsApp payment reminder"
                          >
                            <MessageSquare size={12} className="text-emerald-400" /> Remind
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                          title="Edit Customer Account details, Phone number or National ID"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleOpenDelete(cust)}
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                          title="Delete customer entered wrong"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                        <button
                          onClick={() => handleOpenRepay(cust)}
                          className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          Repay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AGENCY BANKING & OTC DEPOSIT REFERENCE MODAL */}
      {isDepositRefOpen && selectedCust && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Agency / OTC Cash Deposit Reference</h3>
              </div>
              <button onClick={() => setIsDepositRefOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When depositing cash directly to <strong>{selectedCust.name}</strong> over the counter or at an Equity Agent / KCB Mtaani / Co-op Kwa Jirani agent:
            </p>

            <div className="p-4 bg-[#0a0d12] border border-slate-800 rounded-xl space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Customer Name:</span>
                <strong className="text-white">{selectedCust.name}</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">National ID No:</span>
                <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {selectedCust.national_id || "None Registered"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Phone / Account:</span>
                <span className="text-white">{selectedCust.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Current Deni Balance:</span>
                <strong className="text-purple-300">{currency} {selectedCust.debt_balance.toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  if (selectedCust.national_id) {
                    navigator.clipboard.writeText(selectedCust.national_id);
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
                onClick={() => setIsDepositRefOpen(false)}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPAYMENT MODAL */}
      {isRepayOpen && selectedCust && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Record Deni Repayment: {selectedCust.name}</h3>
              <button onClick={() => setIsRepayOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            
            <div className="p-3 bg-[#0a0d12] border border-slate-800 rounded-xl text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Balance Owed:</span>
                <strong className="text-purple-300">{currency} {selectedCust.debt_balance.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registered National ID:</span>
                <span className="text-emerald-400 font-bold">{selectedCust.national_id || "Unregistered"}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteRepay} className="space-y-4">
              {/* EDITABLE REPAYMENT DATE */}
              <div className="bg-[#0a0d12] border border-amber-500/40 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-amber-300 text-xs font-semibold flex items-center gap-1 font-mono">
                    <Calendar size={12} className="text-amber-400" /> Payment Date * (Editable)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRepayDate(new Date().toISOString().slice(0, 10))}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition ${
                        repayDate === new Date().toISOString().slice(0, 10)
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                        setRepayDate(y);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition ${
                        repayDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-800 text-slate-300"
                      }`}
                      title="Customer paid yesterday"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={repayDate}
                  onChange={(e) => setRepayDate(e.target.value)}
                  className="w-full bg-[#070e0b] border border-amber-500/30 rounded-lg p-2 text-white font-mono text-xs focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-400 font-mono block">
                  Backdate here if recording yesterday's cash repayment
                </span>
              </div>

              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">Repayment Cash Amount ({currency})</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedCust.debt_balance}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-lg font-bold"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsRepayOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer text-xs shadow-lg shadow-emerald-500/20"
                >
                  Confirm Repayment ({currency} {repayAmount || 0})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW DEBTOR MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-purple-400" /> Open Debtor Account
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateDebtor} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Customer / Party Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mama Kevin"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">National ID / Huduma No. (for OTC &amp; Agency Deposits)</label>
                <input
                  type="text"
                  placeholder="e.g. 24891044"
                  value={newNationalId}
                  onChange={(e) => setNewNationalId(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">Used when depositing cash directly to their ID at bank/M-Pesa agent</span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 0712 345 678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Credit Limit ({currency})</label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Opening Debt ({currency})</label>
                  <input
                    type="number"
                    value={newDebt}
                    onChange={(e) => setNewDebt(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1 font-mono uppercase text-[10px]">
                  Opening / Credit Date (Editable)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={newDebtDate}
                    onChange={(e) => setNewDebtDate(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewDebtDate(new Date(Date.now() - 86400000).toISOString().slice(0, 10))}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-mono shrink-0 cursor-pointer"
                  >
                    Yesterday
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Clears balance every Friday"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Create Debtor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER ACCOUNT MODAL (FIX PHONE, NATIONAL ID, LIMITS) */}
      {isEditOpen && editingCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121822] border-2 border-cyan-500/40 w-full max-w-lg rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-white font-serif">
                  Edit Customer Account: {editingCustomer.name}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Correct customer details entered wrong, such as fixing mis-typed phone numbers or Kenyan National ID digits for OTC/Agency banking deposits.
            </p>

            <form onSubmit={handleExecuteEdit} className="space-y-3.5">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Customer / Debtor Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0722 123 456"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Fix any mistyped digits</span>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Kenyan National ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 29384710"
                    value={editNationalId}
                    onChange={(e) => setEditNationalId(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-emerald-400/80 mt-0.5 block font-mono">For Agency cash deposit slips</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Current Outstanding Deni ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editDebt}
                    onChange={(e) => setEditDebt(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Credit Limit ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Notes / Relationship Details</label>
                <input
                  type="text"
                  placeholder="e.g. Neighbor, Clears on end of month"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
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
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Check size={14} /> Save Customer Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CUSTOMER ACCOUNT MODAL */}
      {isDeleteOpen && customerToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#180f12] border-2 border-red-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-red-950 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Trash2 size={18} className="text-red-400" /> Delete Customer Account
              </h3>
              <button 
                onClick={() => setIsDeleteOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-[#0f090b] rounded-xl border border-red-900/40 space-y-1 font-mono text-xs">
              <div className="text-white font-bold text-sm font-sans">{customerToDelete.name}</div>
              <div className="text-slate-400">Phone: {customerToDelete.phone}</div>
              {customerToDelete.national_id && (
                <div className="text-emerald-400">National ID: {customerToDelete.national_id}</div>
              )}
              <div className="text-purple-300 font-bold pt-1">
                Outstanding Balance: {currency} {customerToDelete.debt_balance.toLocaleString()}
              </div>
            </div>

            <p className="text-amber-200/90 text-[11px] leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <strong>Data Preservation Guarantee:</strong> Deleting this customer account removes only this wrong or duplicate record. All other customer accounts and shop ledger data remain completely preserved.
            </p>

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
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl cursor-pointer shadow flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Yes, Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
