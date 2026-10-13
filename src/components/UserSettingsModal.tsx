import React, { useState } from "react";
import { 
  X, User, Building2, Smartphone, Shield, Download, Trash2, 
  CheckCircle2, AlertTriangle, KeyRound, ArrowRight, Save
} from "lucide-react";
import { UserProfile, updateUserProfile } from "../services/authSessionService";

interface UserSettingsModalProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onRequestSensitiveAction: (title: string, description: string, onExecute: () => void) => void;
  onExportData: () => void;
  onDeleteAccount: () => void;
}

export default function UserSettingsModal({
  isOpen,
  user,
  onClose,
  onUpdateUser,
  onRequestSensitiveAction,
  onExportData,
  onDeleteAccount
}: UserSettingsModalProps) {
  const [name, setName] = useState(user.name);
  const [businessName, setBusinessName] = useState(user.businessName);
  const [businessType, setBusinessType] = useState(user.businessType);
  const [newPhone, setNewPhone] = useState(user.phone);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateUserProfile({
      name,
      businessName,
      businessType
    });
    if (updated) {
      onUpdateUser(updated);
      setSavedNote("Profile details saved successfully.");
      setTimeout(() => setSavedNote(null), 3500);
    }
  };

  const handleChangePhoneRequest = () => {
    if (newPhone.trim() === user.phone) return;
    onRequestSensitiveAction(
      "Change Registered Phone Number",
      `Updating your verified login phone number from ${user.phone} to ${newPhone}. This is a sensitive action that secures your 90-day session.`,
      () => {
        const updated = updateUserProfile({ phone: newPhone.trim() });
        if (updated) onUpdateUser(updated);
        setSavedNote(`Phone number updated to ${newPhone}.`);
        setTimeout(() => setSavedNote(null), 3500);
      }
    );
  };

  const handleExportDataRequest = () => {
    onRequestSensitiveAction(
      "Export Complete Shop Ledger Data",
      "You are requesting an all-time export of your shop transactions, inventory, customer Khata, and supplier ledgers in structured JSON/CSV.",
      onExportData
    );
  };

  const handleDeleteAccountRequest = () => {
    onRequestSensitiveAction(
      "Delete Store Data & Terminate Session",
      "Permanent action: This will wipe all local store ledgers, customer credit records, and invalidate all sessions across all devices.",
      onDeleteAccount
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#0E1A29] border-2 border-[#182C40] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-[#E2ECF3] font-sans my-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#182C40] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A5F] text-[#38BDF8] flex items-center justify-center font-bold">
              <User size={18} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-base">Store &amp; Account Settings</h2>
              <p className="text-[10px] font-mono text-slate-400">Sliding ~90-Day Protected Session</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {savedNote && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in font-mono">
            <CheckCircle2 size={15} />
            <span>{savedNote}</span>
          </div>
        )}

        {/* GENERAL PROFILE */}
        <form onSubmit={handleSaveGeneral} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#080D15] border border-[#182C40] rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Business Name</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-[#080D15] border border-[#182C40] rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Business Type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full bg-[#080D15] border border-[#182C40] rounded-xl px-3 py-2 text-xs text-white cursor-pointer font-mono"
            >
              <option value="Retail / Duka">Retail / Duka</option>
              <option value="Hardware">Hardware Store</option>
              <option value="Wholesale">Wholesale Distributor</option>
              <option value="Agrovet">Agrovet &amp; Farm Inputs</option>
              <option value="Chemist / Pharmacy">Chemist / Pharmacy</option>
              <option value="M-Pesa Agent">M-Pesa Agent &amp; Banking</option>
              <option value="General MSME">General MSME</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#182C40] hover:bg-[#203952] text-white font-bold rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save size={13} /> Save General Details
          </button>
        </form>

        {/* SENSITIVE SECTION: PHONE NUMBER RE-VERIFICATION */}
        <div className="pt-3 border-t border-[#182C40] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              Registered Phone (Requires Re-Verification)
            </label>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
              Sensitive
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="flex-1 bg-[#080D15] border border-[#182C40] rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
            <button
              type="button"
              onClick={handleChangePhoneRequest}
              disabled={newPhone.trim() === user.phone}
              className="px-3 py-2 bg-[#2563EB] disabled:opacity-40 hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-xs font-mono transition cursor-pointer"
            >
              Verify &amp; Change
            </button>
          </div>
        </div>

        {/* SENSITIVE ACTIONS: EXPORT & DELETE */}
        <div className="pt-3 border-t border-[#182C40] space-y-2">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Data Sovereignty &amp; Account Actions
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleExportDataRequest}
              className="w-full sm:flex-1 py-2 px-3 bg-[#132337] hover:bg-[#1C324E] text-[#38BDF8] border border-[#1E3A5F] rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={13} /> Export All Data
            </button>

            <button
              type="button"
              onClick={handleDeleteAccountRequest}
              className="w-full sm:flex-1 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} /> Reset &amp; Delete
            </button>
          </div>
        </div>

        {/* LEGAL AGREEMENT AUDIT */}
        <div className="pt-3 border-t border-[#182C40] text-[10px] font-mono text-slate-500 flex justify-between items-center">
          <span>Terms Version: {user.agreedTermsVersion || "v1.2-2026"}</span>
          <span>Accepted: {user.agreedTermsTimestamp ? new Date(user.agreedTermsTimestamp).toLocaleDateString() : "Active"}</span>
        </div>

      </div>
    </div>
  );
}
