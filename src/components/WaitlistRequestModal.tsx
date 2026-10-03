import React, { useState } from "react";
import { X, CheckCircle2, Send, Building2, Phone, MapPin, User, CheckSquare, Sparkles } from "lucide-react";
import { BusinessWaitlistRequest, saveWaitlistRequest } from "../services/alacioStorage";

interface WaitlistRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBusinessType?: string;
  onSuccessSubmitted?: (req: BusinessWaitlistRequest) => void;
}

export default function WaitlistRequestModal({
  isOpen,
  onClose,
  initialBusinessType = "",
  onSuccessSubmitted
}: WaitlistRequestModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState(initialBusinessType || "");
  const [location, setLocation] = useState("");
  const [consent, setConsent] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync if initialBusinessType changes
  React.useEffect(() => {
    if (initialBusinessType) {
      setBusinessType(initialBusinessType);
    }
  }, [initialBusinessType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please enter your phone or WhatsApp number.");
      return;
    }
    if (!location.trim()) {
      setErrorMsg("Please enter your town or estate.");
      return;
    }
    if (!consent) {
      setErrorMsg("Please check the consent box so we can notify you.");
      return;
    }

    const saved = saveWaitlistRequest({
      name: name.trim(),
      phone: phone.trim(),
      businessType: businessType.trim() || "General Business",
      location: location.trim(),
      consent
    });

    setIsSubmitted(true);
    if (onSuccessSubmitted) {
      onSuccessSubmitted(saved);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setErrorMsg(null);
    setName("");
    setPhone("");
    setLocation("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-[#0b1611] border-2 border-emerald-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-5 text-xs font-sans shadow-2xl relative">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition p-1 cursor-pointer"
        >
          <X size={18} />
        </button>

        {isSubmitted ? (
          <div className="text-center py-6 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white font-serif">
                Request Recorded!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-emerald-300">{name}</strong>. We've logged your request for <strong className="text-amber-300">{businessType}</strong> in <strong className="text-slate-100">{location}</strong>.
              </p>
            </div>

            <div className="p-4 bg-[#060c09] border border-emerald-950 rounded-2xl text-[11px] font-mono text-slate-400 max-w-md mx-auto text-left space-y-1">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles size={13} /> We build where owners ask.
              </div>
              <p>
                Our engineering team reviews request counts daily to schedule upcoming industry deployments. You will receive an SMS/WhatsApp update on <span className="text-white font-bold">{phone}</span> when your early-access sandbox is ready.
              </p>
            </div>

            <button
              onClick={handleResetAndClose}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-mono cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Back to YuBiFLo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider block">
                YuBiFLo Blueprint Request
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white font-serif mt-1">
                Tell us about your business.
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                We build where business owners ask. Let us know what you need so we can tailor the system to your daily counter flow.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3.5">
              {/* BUSINESS TYPE (PRE-FILLED) */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1 font-mono uppercase text-[10px] flex items-center gap-1">
                  <Building2 size={12} className="text-emerald-400" /> Business Type
                </label>
                <input
                  type="text"
                  required
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="e.g. Hardware, Butchery, Gas Dealer, Salon"
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* OWNER NAME */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1 font-mono uppercase text-[10px] flex items-center gap-1">
                  <User size={12} className="text-emerald-400" /> Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Mwangi / Peter Ochieng"
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* PHONE / WHATSAPP */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1 font-mono uppercase text-[10px] flex items-center gap-1">
                  <Phone size={12} className="text-emerald-400" /> Phone Number (M-Pesa or WhatsApp)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* LOCATION (TOWN OR ESTATE) */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1 font-mono uppercase text-[10px] flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-400" /> Location (Town or Estate)
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nairobi, Kasarani &bull; Eldoret, Pioneer &bull; Nakuru, Free Area"
                  className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* CONSENT CHECKBOX */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    I consent to be contacted when this system is ready for testing.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20 font-mono flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
