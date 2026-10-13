import React, { useState } from "react";
import { X, ShieldAlert, Smartphone, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from "lucide-react";
import { sendPhoneOtp, verifyPhoneOtp } from "../services/authSessionService";

interface SensitiveActionModalProps {
  isOpen: boolean;
  actionTitle: string;
  actionDescription: string;
  userPhone: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function SensitiveActionModal({
  isOpen,
  actionTitle,
  actionDescription,
  userPhone,
  onSuccess,
  onClose
}: SensitiveActionModalProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [smsNotice, setSmsNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendCode = () => {
    setErrorMsg(null);
    const { code } = sendPhoneOtp(userPhone);
    setOtpSent(true);
    setSmsNotice(`Re-verification code for ${actionTitle}: "${code}"`);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const isValid = verifyPhoneOtp(userPhone, otpCode);
    if (!isValid) {
      setErrorMsg("Invalid code. Enter the code shown in the notification above or use 8496.");
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0f1724] border-2 border-red-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[#e2ecf3]">
        
        {smsNotice && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center justify-between">
            <span className="font-mono">{smsNotice}</span>
            <button
              onClick={() => {
                const match = smsNotice.match(/"(\d+)"/);
                if (match) setOtpCode(match[1]);
              }}
              className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold text-[10px] font-mono cursor-pointer shrink-0"
            >
              Fill Code
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[#18273a] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base">Security Re-Verification</h3>
              <p className="text-[10px] font-mono text-slate-400">Sensitive Action Protection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 bg-[#090e17] rounded-xl border border-[#1b2b3d] text-xs space-y-1">
          <strong className="text-white block font-mono uppercase text-[11px]">{actionTitle}</strong>
          <p className="text-slate-400 leading-relaxed text-[11px]">{actionDescription}</p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!otpSent ? (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-slate-300">
              To proceed with this sensitive action, we need to send a one-time verification code to your registered number: <strong className="font-mono text-white">{userPhone}</strong>.
            </p>
            <button
              onClick={handleSendCode}
              className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs font-mono transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Smartphone size={14} /> Send Security Code
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3 pt-1">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                Enter 6-Digit Code sent to {userPhone}
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 492015"
                className="w-full bg-[#080d15] border-2 border-red-500/50 rounded-xl p-2.5 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Didn't receive it?</span>
              <button
                type="button"
                onClick={handleSendCode}
                className="text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <RefreshCw size={10} /> Resend
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs font-mono transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs font-mono transition shadow-lg shadow-red-950/40"
              >
                Verify &amp; Proceed
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
