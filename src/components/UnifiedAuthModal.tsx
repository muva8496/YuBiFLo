import React, { useState } from "react";
import { 
  X, Check, ShieldCheck, ArrowRight, Smartphone, Building2, 
  User, CheckCircle2, AlertCircle, FileText, Lock, Sparkles, RefreshCw
} from "lucide-react";
import { 
  UserProfile, 
  saveSession, 
  sendPhoneOtp, 
  verifyPhoneOtp 
} from "../services/authSessionService";

interface UnifiedAuthModalProps {
  isOpen: boolean;
  initialMode?: "signin" | "signup";
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export default function UnifiedAuthModal({
  isOpen,
  initialMode = "signup",
  onClose,
  onSuccess
}: UnifiedAuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Retail / Duka");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false); // REQUIRED, UNTICKED BY DEFAULT

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedSmsToast, setSimulatedSmsToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Policy modal viewer
  const [viewingLegalDoc, setViewingLegalDoc] = useState<"privacy" | "terms" | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg("Please enter a valid Kenyan phone number (e.g. 0712 345 678 or +254 7XX XXX XXX)");
      return;
    }

    if (mode === "signup") {
      if (!fullName.trim()) {
        setErrorMsg("Please enter your name.");
        return;
      }
      if (!businessName.trim()) {
        setErrorMsg("Please enter your business name.");
        return;
      }
      if (!agreedToTerms) {
        setErrorMsg("You must agree to the Privacy Policy and Terms to create an account.");
        return;
      }
    }

    const { code, message } = sendPhoneOtp(cleanPhone);
    setOtpSent(true);
    setSimulatedSmsToast(`SMS to ${cleanPhone}: "${code}" is your one-time code`);
    // Pre-fill for frictionless testing if wanted, or leave for user
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otpCode.trim()) {
      setErrorMsg("Please enter the 6-digit verification code sent to your phone.");
      return;
    }

    setIsSubmitting(true);

    const isValid = verifyPhoneOtp(phone, otpCode);
    if (!isValid) {
      setIsSubmitting(false);
      setErrorMsg("Invalid or expired verification code. Use the code from the notification above, or tap Resend.");
      return;
    }

    const firstName = fullName.trim() 
      ? fullName.trim().split(" ")[0] 
      : (businessName.trim().split(" ")[0] || "Business Owner");

    const userProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      name: fullName.trim() || `${businessName.trim()} Proprietor`,
      firstName,
      businessName: businessName.trim() || "My MSME Store",
      phone: phone.trim(),
      businessType: businessType || "Retail / Duka",
      plan: "Free",
      agreedTermsVersion: "v1.2-2026",
      agreedTermsTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    saveSession(userProfile);
    setIsSubmitting(false);
    onSuccess(userProfile);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* CARD CONTAINER (INSTAGRAM-STYLE COMPACT, CLEAN, SLEEK) */}
      <div className="bg-[#0f1724] border-2 border-[#1e3047] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative font-sans text-[#e2ecf3] my-8">
        
        {/* SIMULATED SMS BANNER */}
        {simulatedSmsToast && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 p-3 text-xs text-emerald-200 flex items-center justify-between gap-2 animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px]">{simulatedSmsToast}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const match = simulatedSmsToast.match(/"(\d+)"/);
                if (match) setOtpCode(match[1]);
              }}
              className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] font-mono cursor-pointer shrink-0"
            >
              Fill Code
            </button>
          </div>
        )}

        {/* TOP HEADER */}
        <div className="p-6 pb-4 border-b border-[#18273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black border border-zinc-700 flex items-center justify-center font-bold text-white font-mono text-sm shadow">
              Y
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-white tracking-tight">
                YuBiFLo
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Your Business Is A Flower &bull; Kenya MSME Health
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODE TOGGLE SWITCH (INSTAGRAM / MODERN SAAS SINGLE-SCREEN TOGGLE) */}
        <div className="px-6 pt-4">
          <div className="bg-[#090e17] p-1 rounded-2xl border border-[#1a2b3f] grid grid-cols-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
                setOtpSent(false);
              }}
              className={`py-2 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "signup"
                  ? "bg-[#2563eb] text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Sign up</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMsg(null);
                setOtpSent(false);
              }}
              className={`py-2 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "signin"
                  ? "bg-[#2563eb] text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Sign in</span>
            </button>
          </div>
        </div>

        {/* ERROR NOTICE */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MAIN FORM */}
        <div className="p-6 pt-4 space-y-4">
          
          {!otpSent ? (
            /* STEP 1: PHONE & DETAILS */
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              
              {mode === "signup" && (
                <>
                  {/* FULL NAME */}
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                      Your Name
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alacio Mukangai"
                        className="w-full bg-[#080d15] border border-[#1b2b3d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>
                  </div>

                  {/* BUSINESS NAME */}
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                      Business Name
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Alacio Mini Shop"
                        className="w-full bg-[#080d15] border border-[#1b2b3d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>
                  </div>

                  {/* BUSINESS TYPE */}
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                      Business Type
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full bg-[#080d15] border border-[#1b2b3d] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#2563eb] cursor-pointer"
                    >
                      <option value="Retail / Duka">Duka / Retail Shop (Available Live)</option>
                      <option value="Hardware">Hardware Store</option>
                      <option value="Wholesale">Wholesale Distributor</option>
                      <option value="Agrovet">Agrovet &amp; Farm Inputs</option>
                      <option value="Chemist / Pharmacy">Pharmacy / Chemist</option>
                      <option value="M-Pesa Agent">M-Pesa Agency &amp; Banking Agent</option>
                      <option value="General MSME">General Kenyan Trader</option>
                    </select>
                  </div>
                </>
              )}

              {/* PHONE NUMBER (FOR BOTH MODES) */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  Phone Number (Verified with SMS code)
                </label>
                <div className="relative">
                  <Smartphone size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0712 345 678 or +254 712 345 678"
                    className="w-full bg-[#080d15] border border-[#1b2b3d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  We'll send a 6-digit one-time code to verify your phone.
                </span>
              </div>

              {/* REQUIRED, UNTICKED PRIVACY POLICY & TERMS CHECKBOX (SIGN UP ONLY) */}
              {mode === "signup" && (
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs group select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-700 text-[#2563eb] focus:ring-0 focus:ring-offset-0 bg-[#080d15] cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] text-slate-400 leading-tight">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingLegalDoc("privacy");
                        }}
                        className="text-[#38bdf8] underline hover:text-white"
                      >
                        Privacy Policy
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingLegalDoc("terms");
                        }}
                        className="text-[#38bdf8] underline hover:text-white"
                      >
                        Terms of Service
                      </button>
                      . (Version v1.2-2026)
                    </span>
                  </label>
                </div>
              )}

              {/* ACTION BUTTON */}
              <button
                type="submit"
                className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 font-mono text-xs mt-2"
              >
                <span>Send One-Time Code</span>
                <ArrowRight size={14} />
              </button>

            </form>
          ) : (
            /* STEP 2: ENTER OTP */
            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <div className="p-3 bg-[#090e17] rounded-xl border border-[#1b2b3d] text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  Code sent to:
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white font-bold">{phone}</span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] text-[#38bdf8] hover:underline font-mono cursor-pointer"
                  >
                    Change phone
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  Enter 6-Digit One-Time Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 492015 (or 8496)"
                  className="w-full bg-[#080d15] border-2 border-[#2563eb] rounded-xl p-3 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Didn't get the code?</span>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  className="text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <RefreshCw size={11} /> Resend SMS
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 font-mono text-xs"
              >
                <CheckCircle2 size={16} />
                <span>Verify &amp; Open Dashboard</span>
              </button>
            </form>
          )}

        </div>

        {/* FOOTER INFO (SLIDING 90-DAY SESSION) */}
        <div className="p-4 bg-[#080d15] border-t border-[#18273a] text-center text-[10px] font-mono text-slate-500">
          <span>
            Protected sliding session active for ~90 days &bull; No passwords to forget
          </span>
        </div>

      </div>

      {/* LEGAL DOCUMENT PREVIEW MODAL */}
      {viewingLegalDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-[#0f1724] border border-[#1e3047] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs font-sans text-slate-300">
            <div className="flex items-center justify-between border-b border-[#1b2b3d] pb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#38bdf8]" />
                <h3 className="font-bold text-white text-sm">
                  {viewingLegalDoc === "privacy" ? "YuBiFLo Privacy Policy" : "YuBiFLo Terms of Service"} (v1.2-2026)
                </h3>
              </div>
              <button onClick={() => setViewingLegalDoc(null)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 text-[11px] leading-relaxed text-slate-400">
              <p>
                <strong>1. Data Sovereignty &amp; Voice Conversion Record (VCR):</strong> Audio recorded at your shop counter is converted to text and financial values immediately. Raw audio is promptly discarded; only structured transaction records are retained.
              </p>
              <p>
                <strong>2. Deterministic Financial Computation:</strong> All ledgers, stock reconciliations, and cash balances are computed by deterministic code. AI models are used only for input classification and explanation.
              </p>
              <p>
                <strong>3. Tenant Isolation &amp; Zero Resale:</strong> Your customer data, supplier pricing, and transaction history are completely isolated to your workspace and will never be sold to third parties or competitor businesses.
              </p>
              <p>
                <strong>4. Session Longevity:</strong> YuBiFLo uses secure 90-day sliding sessions refreshed upon active operational use. Re-verification is strictly required for destructive actions like data export or deletion.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAgreedToTerms(true);
                setViewingLegalDoc(null);
              }}
              className="w-full py-2.5 bg-[#2563eb] text-white font-bold rounded-xl text-xs font-mono"
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
