import React, { useState } from "react";
import { Supplier, Customer, Merchant } from "../types";
import { AppStorage } from "../services/storage";
import {
  Users,
  Truck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  History,
  Coins,
} from "lucide-react";

interface MergeEntitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "SUPPLIER" | "CUSTOMER";
  merchant: Merchant;
  suppliers: Supplier[];
  customers: Customer[];
  initialPrimaryId?: string;
  initialDuplicateId?: string;
  onMergeComplete: (message: string) => void;
}

export const MergeEntitiesModal: React.FC<MergeEntitiesModalProps> = ({
  isOpen,
  onClose,
  entityType,
  merchant,
  suppliers,
  customers,
  initialPrimaryId,
  initialDuplicateId,
  onMergeComplete,
}) => {
  const [primaryId, setPrimaryId] = useState<string>(initialPrimaryId || (entityType === "SUPPLIER" ? suppliers[0]?.id || "" : customers[0]?.id || ""));
  const [duplicateId, setDuplicateId] = useState<string>(initialDuplicateId || (entityType === "SUPPLIER" ? suppliers[1]?.id || "" : customers[1]?.id || ""));
  const [customName, setCustomName] = useState<string>("");

  if (!isOpen) return null;

  const isSupplier = entityType === "SUPPLIER";
  const primarySupp = isSupplier ? suppliers.find((s) => s.id === primaryId) : null;
  const duplicateSupp = isSupplier ? suppliers.find((s) => s.id === duplicateId) : null;

  const primaryCust = !isSupplier ? customers.find((c) => c.id === primaryId) : null;
  const duplicateCust = !isSupplier ? customers.find((c) => c.id === duplicateId) : null;

  const handleExecuteMerge = () => {
    if (!primaryId || !duplicateId) {
      alert("Please select both a Master Profile and a Duplicate Profile.");
      return;
    }
    if (primaryId === duplicateId) {
      alert("Please select two DIFFERENT profiles to merge.");
      return;
    }

    if (isSupplier) {
      const res = AppStorage.mergeSuppliers(primaryId, duplicateId, customName || undefined);
      if (res.success) {
        onMergeComplete(res.message);
        onClose();
      } else {
        alert(res.message);
      }
    } else {
      const res = AppStorage.mergeCustomers(primaryId, duplicateId, customName || undefined);
      if (res.success) {
        onMergeComplete(res.message);
        onClose();
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#121214] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {isSupplier ? <Truck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase tracking-widest">
                  Rush-Hour Typo & Duplicate Solver
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Merge Duplicate {isSupplier ? "Supplier Profiles" : "Customer Accounts"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explain Context */}
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            During rush hours in fast-moving MSMEs, slight spelling variations or uppercase typos (e.g. <strong>"Joseph Musembi"</strong> vs <strong>"Joseph MUsembi"</strong>) often create two fragmented records. Merging unifies all <strong>inbound deliveries, receipts, supply batches, payments, and T-Account ledgers</strong> into one master account with 100% data integrity.
          </div>
        </div>

        {/* Profile Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Master Profile (Keep) */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Master Account (To Keep)
              </span>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Select Master Account</label>
              <select
                value={primaryId}
                onChange={(e) => {
                  setPrimaryId(e.target.value);
                  if (isSupplier) {
                    const found = suppliers.find((s) => s.id === e.target.value);
                    if (found) setCustomName(found.name);
                  } else {
                    const found = customers.find((c) => c.id === e.target.value);
                    if (found) setCustomName(found.name);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                {isSupplier
                  ? suppliers.map((s) => (
                      <option key={s.id} value={s.id} disabled={s.id === duplicateId}>
                        {s.name} ({s.category || "Supplier"} · Owed: {merchant.currency} {s.outstanding_balance_owed.toLocaleString()})
                      </option>
                    ))
                  : customers.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.id === duplicateId}>
                        {c.name} (Deni: {merchant.currency} {c.current_deni_balance.toLocaleString()})
                      </option>
                    ))}
              </select>
            </div>

            {/* Master Summary */}
            {isSupplier && primarySupp && (
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Supplied:</span>
                  <span className="font-mono font-bold text-white">{merchant.currency} {primarySupp.total_supplied_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Paid:</span>
                  <span className="font-mono font-bold text-emerald-400">{merchant.currency} {primarySupp.total_paid_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Debt Owed:</span>
                  <span className="font-mono font-bold text-amber-400">{merchant.currency} {primarySupp.outstanding_balance_owed.toLocaleString()}</span>
                </div>
              </div>
            )}

            {!isSupplier && primaryCust && (
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Credit Purchases:</span>
                  <span className="font-mono font-bold text-white">{merchant.currency} {primaryCust.total_debt_accrued.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deni Balance Owed:</span>
                  <span className="font-mono font-bold text-rose-400">{merchant.currency} {primaryCust.current_deni_balance.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Duplicate Profile (Merge & Remove) */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-rose-400" />
                Duplicate Account (To Absorb)
              </span>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Select Duplicate Account</label>
              <select
                value={duplicateId}
                onChange={(e) => setDuplicateId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-rose-500"
              >
                {isSupplier
                  ? suppliers.map((s) => (
                      <option key={s.id} value={s.id} disabled={s.id === primaryId}>
                        {s.name} ({s.category || "Supplier"} · Owed: {merchant.currency} {s.outstanding_balance_owed.toLocaleString()})
                      </option>
                    ))
                  : customers.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.id === primaryId}>
                        {c.name} (Deni: {merchant.currency} {c.current_deni_balance.toLocaleString()})
                      </option>
                    ))}
              </select>
            </div>

            {/* Duplicate Summary */}
            {isSupplier && duplicateSupp && (
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Supplied:</span>
                  <span className="font-mono font-bold text-white">{merchant.currency} {duplicateSupp.total_supplied_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Paid:</span>
                  <span className="font-mono font-bold text-emerald-400">{merchant.currency} {duplicateSupp.total_paid_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Debt Owed:</span>
                  <span className="font-mono font-bold text-amber-400">{merchant.currency} {duplicateSupp.outstanding_balance_owed.toLocaleString()}</span>
                </div>
              </div>
            )}

            {!isSupplier && duplicateCust && (
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Credit Purchases:</span>
                  <span className="font-mono font-bold text-white">{merchant.currency} {duplicateCust.total_debt_accrued.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deni Balance Owed:</span>
                  <span className="font-mono font-bold text-rose-400">{merchant.currency} {duplicateCust.current_deni_balance.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Master Name Confirmation */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Master Display Name for Unified Account:
          </label>
          <input
            type="text"
            placeholder={isSupplier ? (primarySupp?.name || "e.g. Joseph Musembi") : (primaryCust?.name || "e.g. Customer Name")}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Merge Impact Preview */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Consolidated Ledger Outcome:
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Unified Invoiced</span>
              <span className="font-bold font-mono text-white">
                {merchant.currency}{" "}
                {isSupplier
                  ? ((primarySupp?.total_supplied_value || 0) + (duplicateSupp?.total_supplied_value || 0)).toLocaleString()
                  : ((primaryCust?.total_debt_accrued || 0) + (duplicateCust?.total_debt_accrued || 0)).toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Unified Payments</span>
              <span className="font-bold font-mono text-emerald-400">
                {merchant.currency}{" "}
                {isSupplier
                  ? ((primarySupp?.total_paid_value || 0) + (duplicateSupp?.total_paid_value || 0)).toLocaleString()
                  : ((primaryCust?.total_debt_repaid || 0) + (duplicateCust?.total_debt_repaid || 0)).toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Unified Net Balance</span>
              <span className="font-bold font-mono text-amber-400">
                {merchant.currency}{" "}
                {isSupplier
                  ? ((primarySupp?.outstanding_balance_owed || 0) + (duplicateSupp?.outstanding_balance_owed || 0)).toLocaleString()
                  : ((primaryCust?.current_deni_balance || 0) + (duplicateCust?.current_deni_balance || 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteMerge}
            className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirm & Merge Profiles</span>
          </button>
        </div>
      </div>
    </div>
  );
};
