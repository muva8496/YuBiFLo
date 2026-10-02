import React, { useState } from "react";
import { Users, Plus, CheckCircle2, DollarSign, Phone, ShieldAlert, ArrowDownLeft, X } from "lucide-react";
import { CustomerDebtor } from "../../types/alacio";

interface CustomersCreditTabProps {
  currency: string;
  customers: CustomerDebtor[];
  onRepayDebt: (customerId: string, amount: number) => void;
  onAddDebtor: (newDebtor: { name: string; phone: string; credit_limit: number; initial_debt: number; notes: string }) => void;
}

export default function CustomersCreditTab({ currency, customers, onRepayDebt, onAddDebtor }: CustomersCreditTabProps) {
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<CustomerDebtor | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New debtor form states
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
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
      credit_limit: parseFloat(newLimit) || 1000,
      initial_debt: parseFloat(newDebt) || 0,
      notes: newNotes.trim() || "Neighborhood customer"
    });

    setIsAddOpen(false);
    setNewName("");
    setNewPhone("");
    setNewDebt("0");
    setNewNotes("");
    setToastMsg(`Debtor account created for ${newName}!`);
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
            Track trusted customer credit, repayment history, and prevent counter debt overextension.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
        >
          <Plus size={14} /> Add New Debtor
        </button>
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
          <span className="text-[11px] text-slate-500 mt-1 block">Tied up in trusted neighborhood accounts</span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Authorized Credit Limit</span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {currency} {totalCreditLimit.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Max combined exposure allowed</span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Active Debtors</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {customers.length} Accounts
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Audited weekly</span>
        </div>
      </div>

      {/* DEBTORS TABLE */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-[#161d29] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Debtor Name</th>
                <th className="py-3.5 px-4 font-semibold">Phone Contact</th>
                <th className="py-3.5 px-4 font-semibold text-right">Current Balance</th>
                <th className="py-3.5 px-4 font-semibold text-right">Credit Limit</th>
                <th className="py-3.5 px-4 font-semibold text-center">Exposure Gauge</th>
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
                    <td className="py-3.5 px-4 text-slate-400 flex items-center gap-1.5 pt-4">
                      <Phone size={12} className="text-slate-500" />
                      {cust.phone}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-purple-300 text-sm">
                      {currency} {cust.debt_balance.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {currency} {cust.credit_limit.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-28 mx-auto space-y-1">
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ratio > 80 ? "bg-red-500" : ratio > 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={{ width: `${Math.min(100, ratio)}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-slate-500 text-center font-mono">
                          {ratio.toFixed(0)}% limit utilized
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <button
                        onClick={() => handleOpenRepay(cust)}
                        className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        Record Repayment
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPAYMENT MODAL */}
      {isRepayOpen && selectedCust && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Record Deni Repayment: {selectedCust.name}</h3>
              <button onClick={() => setIsRepayOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            <div className="text-xs text-slate-400">
              Current total balance owed: <strong className="text-purple-300 font-mono">{currency} {selectedCust.debt_balance.toLocaleString()}</strong>
            </div>

            <form onSubmit={handleExecuteRepay} className="space-y-4">
              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">Repayment Cash Amount ({currency})</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedCust.debt_balance}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRepayOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Confirm &amp; Add to Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DEBTOR MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add New Customer Account</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateDebtor} className="space-y-3 text-xs">
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
