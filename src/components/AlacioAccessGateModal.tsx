import React, { useState } from "react";
import { Lock, Shield, ArrowRight, X, KeyRound, AlertCircle, Building2 } from "lucide-react";

interface AlacioAccessGateModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  targetDescription?: string;
}

export default function AlacioAccessGateModal({
  isOpen,
  onSuccess,
  onClose,
  targetDescription = "Alacio Retail Client Workspace"
}: AlacioAccessGateModalProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "8496") {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleDigitClick = (digit: string) => {
    if (passcode.length < 4) {
      const next = passcode + digit;
      setPasscode(next);
      setError(false);
      if (next === "8496") {
        setTimeout(() => onSuccess(), 150);
      } else if (next.length === 4) {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPasscode("");
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    setPasscode((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPasscode("");
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div 
        className={`bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-slate-800 space-y-6 relative ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          title="Cancel"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-lg shadow-slate-900/20">
            <Lock size={26} className="text-emerald-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono font-semibold mb-1">
              <KeyRound size={12} className="text-slate-600" />
              <span>Restricted Access</span>
            </div>
            <h3 className="text-xl font-serif font-black text-slate-900 tracking-tight">
              Protected Client Property
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Enter the 4-digit access code to enter {targetDescription}.
            </p>
          </div>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center items-center gap-3 py-1">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < passcode.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  error
                    ? "border-red-500 bg-red-500"
                    : isFilled
                    ? "border-emerald-600 bg-emerald-600 scale-110"
                    : "border-slate-300 bg-slate-100"
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-600 font-semibold bg-red-50 border border-red-200 py-1.5 px-3 rounded-xl animate-in fade-in">
            <AlertCircle size={14} />
            <span>Incorrect password. Access denied.</span>
          </div>
        )}

        {/* Manual form input (keyboard friendly) */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            maxLength={4}
            value={passcode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPasscode(val);
              setError(false);
              if (val === "8496") {
                onSuccess();
              }
            }}
            placeholder="Enter passcode"
            className="w-full text-center tracking-[0.5em] text-xl font-mono font-bold py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            autoFocus
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Verify &amp; Enter</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit)}
              className="py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-base font-bold font-mono transition active:scale-95 cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick("0")}
            className="py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-base font-bold font-mono transition active:scale-95 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold transition active:scale-95 cursor-pointer font-mono"
          >
            ⌫
          </button>
        </div>

        <div className="text-center pt-1 text-[11px] text-slate-400 font-mono">
          YuBiFlo Client Isolation Protocol
        </div>
      </div>
    </div>
  );
}
