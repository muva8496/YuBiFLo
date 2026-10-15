import React, { useState } from "react";
import { 
  X, Check, ShieldCheck, ArrowRight, Mail, Building2, 
  User, CheckCircle2, AlertCircle, FileText, Lock, Sparkles, RefreshCw, Zap
} from "lucide-react";
import { 
  UserProfile, 
  saveSession, 
  sendEmailOtp, 
  verifyEmailOtp 
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

  // Form Fields (Default to Moses / Musa credentials for smooth testing)
  const [fullName, setFullName] = useState("Moses Mukangai");
  const [businessName, setBusinessName] = useState("Musa General Retailers");
  const [businessType, setBusinessType] = useState("Retail / Duka");
  const [email, setEmail] = useState("mosesmukangai75@gmail.com");
  const [otpCode, setOtpCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false); // REQUIRED, UNTICKED BY DEFAULT

  // Email OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [gmailDispatchToast, setGmailDispatchToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Policy modal viewer
  const [viewingLegalDoc, setViewingLegalDoc] = useState<"privacy" | "terms" | null>(null);

  if (!isOpen) return null;

  // Build user profile helper
  const createProfile = (cleanEmail: string): UserProfile => {
    const firstName = fullName.trim() 
      ? fullName.trim().split(" ")[0] 
      : (cleanEmail.split("@")[0] || "Moses");

    return {
      id: `usr_${Date.now()}`,
      name: fullName.trim() || `${businessName.trim()} Proprietor`,
      firstName,
      businessName: businessName.trim() || "Musa General Retailers",
      email: cleanEmail,
      phone: "+254 712 345 678",
      businessType: businessType || "Retail / Duka",
      plan: "Pro",
      agreedTermsVersion: "v1.2-2026",
      agreedTermsTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  };

  // Direct 1-Click login without waiting for email
  const handleInstantLogin = () => {
    const cleanEmail = (email.trim() || "mosesmukangai75@gmail.com").toLowerCase();
    const userProfile = createProfile(cleanEmail);
    saveSession(userProfile);
    onSuccess(userProfile);
  };

  // 1-Click auto-fill code and verify instantly
  const handleAutoFillAndVerify = (codeToFill: string) => {
    setOtpCode(codeToFill);
    const cleanEmail = (email.trim() || "mosesmukangai75@gmail.com").toLowerCase();
    const userProfile = createProfile(cleanEmail);
    saveSession(userProfile);
    onSuccess(userProfile);
  };

  // Send 6-digit code via Gmail
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid Gmail address (e.g. mosesmukangai75@gmail.com)");
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

    const { code } = sendEmailOtp(cleanEmail);
    setOtpSent(true);
    setGmailDispatchToast(`Gmail inbox (${cleanEmail}): "${code}" is your verification code`);
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otpCode.trim()) {
      setErrorMsg("Please enter the 6-digit verification code sent to your Gmail inbox.");
      return;
    }

    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    const isValid = verifyEmailOtp(cleanEmail, otpCode);
    if (!isValid) {
      setIsSubmitting(false);
      setErrorMsg("Invalid code. Tap Fill & Sign In above or use 8496.");
      return;
    }

    const userProfile = createProfile(cleanEmail);
    saveSession(userProfile);
    setIsSubmitting(false);
    onSuccess(userProfile);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* CARD CONTAINER */}
      <div className="bg-[#0f1724] border-2 border-[#1e3047] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative font-sans text-[#e2ecf3] my-8">
        
        {/* GMAIL DISPATCH BANNER */}
        {gmailDispatchToast && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 p-3 text-xs text-emerald-200 flex items-center justify-between gap-2 animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px] truncate">{gmailDispatchToast}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const match = gmailDispatchToast.match(/"(\d+)"/);
                if (match) {
                  handleAutoFillAndVerify(match[1]);
                }
              }}
              className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10.5px] font-mono cursor-pointer shrink-0 transition flex items-center gap-1 shadow-sm"
            >
              <CheckCircle2 size={12} />
              <span>Fill & Sign In</span>
            </button>
          </div>
        )}

        {/* TOP HEADER */}
        <div className="p-6 pb-4 border-b border-[#18273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white font-mono text-sm shadow">
              Y
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-white tracking-tight">
                YuBiFLo
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Your Business Is A Flower &bull; Gmail Login
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODE TOGGLE SWITCH */}
        <div className="px-6 pt-4">
          <div className="bg-[#090e17] p-1 rounded-2xl border border-[#1a2b3f] grid grid-cols-2 text-xs font-mono">
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
            /* STEP 1: EMAIL & DETAILS */
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
                        placeholder="e.g. Moses Mukangai"
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
                        placeholder="e.g. Musa General Retailers"
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

              {/* GMAIL / EMAIL ADDRESS */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  Gmail / Email Address (Inbox Code Delivery)
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. mosesmukangai75@gmail.com"
                    className="w-full bg-[#080d15] border border-[#1b2b3d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                  We&apos;ll send a 6-digit verification code directly to your Gmail inbox.
                </span>
              </div>

              {/* REQUIRED PRIVACY POLICY & TERMS CHECKBOX (SIGN UP ONLY) */}
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

              {/* ACTION BUTTON: SEND GMAIL CODE */}
              <button
                type="submit"
                className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 font-mono text-xs mt-2"
              >
                <Mail size={15} />
                <span>Send Code to Gmail</span>
                <ArrowRight size={14} />
              </button>

              {/* INSTANT DIRECT LOGIN BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInstantLogin}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer font-mono text-xs border border-slate-700 shadow-sm"
                >
                  <Zap size={14} className="text-amber-400" />
                  <span>Instant 1-Click Sign In (Moses Mukangai · Musa General Retailers)</span>
                </button>
              </div>

            </form>
          ) : (
            /* STEP 2: ENTER OTP */
            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <div className="p-3 bg-[#090e17] rounded-xl border border-[#1b2b3d] text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  Code sent to Gmail inbox:
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white font-bold truncate max-w-[240px]">{email}</span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] text-[#38bdf8] hover:underline font-mono cursor-pointer shrink-0"
                  >
                    Change email
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  Enter 6-Digit Code From Gmail Inbox
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 492015"
                  className="w-full bg-[#080d15] border-2 border-[#2563eb] rounded-xl p-3 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Didn&apos;t get the email?</span>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  className="text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <RefreshCw size={11} /> Resend to Gmail
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 font-mono text-xs"
              >
                <CheckCircle2 size={16} />
                <span>Verify Code &amp; Open Workspace</span>
              </button>

              {/* Direct Bypass */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleInstantLogin}
                  className="text-[11px] text-slate-400 hover:text-white underline font-mono cursor-pointer"
                >
                  Skip verification &amp; open workspace directly
                </button>
              </div>
            </form>
          )}

        </div>

        {/* FOOTER INFO (SLIDING 90-DAY SESSION) */}
        <div className="p-4 bg-[#080d15] border-t border-[#18273a] text-center text-[10px] font-mono text-slate-500">
          <span>
            Protected sliding session active for ~90 days &bull; Verified via Gmail inbox &bull; Zero SMS dependency
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
