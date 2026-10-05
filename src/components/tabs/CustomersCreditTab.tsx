import React, { useState } from "react";
import { Users, Plus, CheckCircle2, DollarSign, Phone, ShieldAlert, ArrowDownLeft, X, CreditCard, Building2, Copy, Check } from "lucide-react";
import { CustomerDebtor } from "../../types/alacio";

interface CustomersCreditTabProps {
  currency: string;
  customers: CustomerDebtor[];
  onRepayDebt: (customerId: string, amount: number) => void;
  onAddDebtor: (newDebtor: { name: string; phone: string; national_id?: string; credit_limit: number; initial_debt: number; notes: string }) => void;
}

export default function CustomersCreditTab({ currency, customers, onRepayDebt, onAddDebtor }: CustomersCreditTabProps) {
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDepositRefOpen, setIsDepositRefOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<CustomerDebtor | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // New debtor form states
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNationalId, setNewNationalId] = useState("");
  const [newLimit, setNewLimit] = useState("1000");
  const [newDebt, setNewDebt] = useState("0");
  const [newNotes, setNewNotes] = useState("");

  const totalOutstanding = customers.reduce((acc, c) => acc + c.debt_balance, 0);
  const totalCreditLimit = customers.reduce((acc, c) => acc + c.credit_limit, 0);

  const handleOpenRepay = (cust: CustomerDebtor) => {
    setSelectedCust(cust);
    setRepayAmount(String(cust.debt_balance));
    setIsRepayOpen(true);
  };

  const handleOpenDepositRef = (cust: CustomerDebtor) => {
    setSelectedCust(cust);
    setIsDepositRefOpen(true);
    setCopiedId(false);
  };

  const handleExecuteRepay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || !repayAmount) return;
    const amount = parseFloat(repayAmount);
    if (amount <= 0) return;

    onRepayDebt(selectedCust.id, amount);
    setIsRepayOpen(false);
    setToastMsg(`Repayment of ${currency} ${amount.toLocaleString()} received from ${selectedCust.name}! Added to cash register.`);
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
      notes: newNotes.trim() || "Neighborhood customer"
    });

    setIsAddOpen(false);
    setNewName("");
    setNewPhone("");
    setNewNationalId("");
    setNewDebt("0");
    setNewNotes("");
    setToastMsg(`Debtor account created for ${newName} with National ID ${newNationalId || "not provided"}!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-purple-400" size={22} /> Customer Credit &amp; Deni Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Track trusted customer credit, National IDs for OTC/Agency banking cash deposits, and repayment ledgers.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20"
        >
          <Plus size={15} /> Add New Customer / Debtor
        </button>
      </div>

      {/* QUICK GUIDE ON HOW CUSTOMERS & NATIONAL ID DEPOSITS WORK */}
      <div className="bg-[#121822] border border-purple-500/30 rounded-2xl p-4 text-xs font-sans space-y-2">
        <div className="flex items-center gap-2 text-purple-300 font-bold font-mono text-[11px] uppercase">
          <Users size={14} /> How Adding Customers &amp; National ID Deposits Work:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
          <div className="p-2.5 bg-[#0a0d12] rounded-xl border border-slate-800">
            <span className="text-purple-400 font-bold block mb-0.5">1. Add Customer Account</span>
            Click <strong>+ Add New Customer</strong> to register their name, phone, and counter credit limit.
          </div>
          <div className="p-2.5 bg-[#0a0d12] rounded-xl border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-0.5">2. Register National ID</span>
            Attach their Kenyan National ID so you can deposit repayments directly at any banking agent.
          </div>
          <div className="p-2.5 bg-[#0a0d12] rounded-xl border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-0.5">3. 1-Click Agency Reference</span>
            Click <strong>Deposit Ref</strong> on any card to copy their National ID for Equity, KCB, or Co-op Agent slips.
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
    </div>
  );
}
