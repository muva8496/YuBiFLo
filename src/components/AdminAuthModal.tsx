import React, { useState } from "react";
import { Shield, KeyRound, Lock, Unlock, CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react";
import { AppStorage } from "../services/storage";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onAdminStatusChange: (status: boolean) => void;
  onSuccessNavigateToSchema?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onAdminStatusChange,
  onSuccessNavigateToSchema,
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (AppStorage.verifyAdminPin(pin)) {
      AppStorage.setIsAdmin(true);
      onAdminStatusChange(true);
      setError(null);
      setSuccessMsg("Admin Mode unlocked! PostgreSQL & Supabase Data Schema is now visible.");
      setTimeout(() => {
        setSuccessMsg(null);
        setPin("");
        onClose();
        if (onSuccessNavigateToSchema) {
          onSuccessNavigateToSchema();
        }
      }, 1000);
    } else {
      setError("Incorrect Admin PIN. (Default demo PIN is 2031)");
    }
  };

  const handleDeactivate = () => {
    AppStorage.setIsAdmin(false);
    onAdminStatusChange(false);
    setSuccessMsg("Admin Mode locked. Standard cashier / retailer mode active.");
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#121214] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Idhini ya Admin & Data Schema</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {isAdmin ? "UNLOCKED" : "LOCKED"}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Database architecture & PostgreSQL controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isAdmin
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                : "bg-slate-900/60 border-slate-800 text-slate-300"
            }`}
          >
            {isAdmin ? (
              <Unlock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-bold text-slate-200">
                {isAdmin ? "Admin Mode is Active" : "Standard Cashier Mode (Schema Locked)"}
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                {isAdmin
                  ? "You have full access to PostgreSQL DDL, Supabase Drizzle migrations, and raw tables."
                  : "The Data Schema module is strictly restricted to Admin users to safeguard shop architecture."}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span className="text-slate-400">Current Role:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Super Admin
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSuccessNavigateToSchema) onSuccessNavigateToSchema();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Fungua Data Schema</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-medium transition-colors"
                >
                  Lock Admin
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    Enter Admin PIN / Passcode
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Demo PIN: 2031</span>
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  maxLength={10}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-center tracking-widest text-slate-100 placeholder:text-slate-600 focus:outline-none"
                  placeholder="••••"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Schema</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
