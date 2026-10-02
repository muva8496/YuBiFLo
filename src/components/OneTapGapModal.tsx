import React, { useState } from "react";
import { AlertCircle, HelpCircle, Check, X, ShieldAlert, ArrowRight } from "lucide-react";
import { PayoutOrDrawing } from "../types/alacio";

interface OneTapGapModalProps {
  isOpen: boolean;
  onClose: () => void;
  gapAmount: number;
  currency: string;
  onResolveGap: (payout: PayoutOrDrawing) => void;
}

export default function OneTapGapModal({
  isOpen,
  onClose,
  gapAmount,
  currency,
  onResolveGap
}: OneTapGapModalProps) {
  const [selectedType, setSelectedType] = useState<"BUSINESS_EXPENSE" | "OWNER_DRAWING" | "SUPPLIER_PAYOUT">("OWNER_DRAWING");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const displayGap = Math.abs(gapAmount) || 1500;

  const handleConfirm = (type: "BUSINESS_EXPENSE" | "OWNER_DRAWING" | "SUPPLIER_PAYOUT", defaultNote: string) => {
    onResolveGap({
      id: `po_gap_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      amount: displayGap,
      type,
      notes: notes.trim() || defaultNote,
      resolved_gap_id: `gap_${Date.now()}`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-[#101b15] border-2 border-amber-500/40 w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-xs">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-serif">1-Tap Cash Gap Resolution</h3>
              <span className="text-[10px] text-slate-400 font-mono">Catching Owner Drawings &amp; Missed Sales</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
        </div>

        {/* QUESTION BANNER */}
        <div className="bg-[#0b130f] border border-amber-500/30 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[11px] text-slate-400 font-mono uppercase">Unaccounted Drawer Deficit</span>
          <div className="text-2xl font-black font-mono text-amber-400">
            {currency} {displayGap.toLocaleString()} left the till today
          </div>
          <p className="text-[11px] text-slate-300 italic pt-1">
            "Was this money taken for business expenses or personal owner drawings?"
          </p>
        </div>

        {/* ONE-TAP CHOICES */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleConfirm("OWNER_DRAWING", "Personal owner drawing (Household / Lunch)")}
            className="w-full p-3.5 bg-[#14231b] hover:bg-[#1a3025] border border-emerald-500/30 hover:border-emerald-400 rounded-xl text-left transition flex items-center justify-between cursor-pointer group"
          >
            <div>
              <span className="font-bold text-white block text-xs group-hover:text-emerald-300">
                1. Personal Owner Drawing
              </span>
              <span className="text-[10px] text-slate-400">
                Personal lunch, school fees, or household money taken unrecorded.
              </span>
            </div>
            <ArrowRight size={15} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => handleConfirm("BUSINESS_EXPENSE", "Store operational expense (Transport / Casual wage)")}
            className="w-full p-3.5 bg-[#14231b] hover:bg-[#1a3025] border border-teal-500/30 hover:border-teal-400 rounded-xl text-left transition flex items-center justify-between cursor-pointer group"
          >
            <div>
              <span className="font-bold text-white block text-xs group-hover:text-teal-300">
                2. Store Business Expense
              </span>
              <span className="text-[10px] text-slate-400">
                Casual porter offloading wage, cleaning supplies, or transport.
              </span>
            </div>
            <ArrowRight size={15} className="text-teal-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => handleConfirm("SUPPLIER_PAYOUT", "Direct counter payout to supplier")}
            className="w-full p-3.5 bg-[#14231b] hover:bg-[#1a3025] border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-left transition flex items-center justify-between cursor-pointer group"
          >
            <div>
              <span className="font-bold text-white block text-xs group-hover:text-cyan-300">
                3. Direct Supplier Delivery Cash Payout
              </span>
              <span className="text-[10px] text-slate-400">
                Paid wholesale delivery driver directly from drawer cash.
              </span>
            </div>
            <ArrowRight size={15} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* CUSTOM NOTES */}
        <div>
          <label className="text-slate-400 text-[10px] font-mono block mb-1">Optional Specific Memo:</label>
          <input
            type="text"
            placeholder="e.g. Paid KES 1,500 to milk distributor driver"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#08100c] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:text-white transition cursor-pointer text-xs"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}
