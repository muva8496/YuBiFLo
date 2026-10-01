import React, { useState } from "react";
import {
  SubscriptionTier,
  SubscriptionTierId,
  SubscriptionBillingCycle,
  MerchantSubscription,
  Merchant,
} from "../types";
import { AppStorage, DEFAULT_SUBSCRIPTION_TIERS } from "../services/storage";
import {
  ShieldCheck,
  CheckCircle2,
  Zap,
  Sparkles,
  Building2,
  Store,
  Crown,
  Smartphone,
  Landmark,
  FileText,
  Lock,
  ArrowRight,
  X,
  CreditCard,
  Check,
  Download,
  Flame,
  Flower2,
} from "lucide-react";

interface SubscriptionTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant?: Merchant;
  currentTierId?: string;
  onUpgradeSuccess?: (tierId: string, billingCycle: string) => void;
  onSubscriptionUpdated?: (newSub: MerchantSubscription) => void;
}

export const SubscriptionTierModal: React.FC<SubscriptionTierModalProps> = ({
  isOpen,
  onClose,
  merchant,
  currentTierId: propTierId,
  onUpgradeSuccess,
  onSubscriptionUpdated,
}) => {
  const activeMerchant = merchant || AppStorage.getActiveMerchant();
  const [tiers] = useState<SubscriptionTier[]>(AppStorage.getSubscriptionTiers());
  const [billingCycle, setBillingCycle] = useState<SubscriptionBillingCycle>("MONTHLY");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTierId>(
    (propTierId as SubscriptionTierId) || activeMerchant?.subscription?.tierId || "pro"
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [phoneForMpesa, setPhoneForMpesa] = useState<string>(activeMerchant?.phone || "+254 712 345 678");
  const [paymentMethod, setPaymentMethod] = useState<"MPESA_STK" | "EQUITY_PAYBILL">("MPESA_STK");
  const [step, setStep] = useState<"SELECT" | "CHECKOUT" | "SUCCESS">("SELECT");
  const [activeSub, setActiveSub] = useState<MerchantSubscription>(
    activeMerchant?.subscription || AppStorage.getActiveSubscription()
  );

  if (!isOpen) return null;

  const currentTierId = propTierId || activeSub?.tierId || activeMerchant?.subscription?.tierId || "starter";
  const chosenTierObj = tiers.find((t) => t.id === selectedTier) || tiers[1];
  const priceToPay =
    billingCycle === "ANNUAL" ? chosenTierObj.annualPriceKes : chosenTierObj.monthlyPriceKes;

  const handleStartUpgrade = (tierId: SubscriptionTierId) => {
    setSelectedTier(tierId);
    setStep("CHECKOUT");
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const paymentRef =
        paymentMethod === "MPESA_STK"
          ? `MP-${Math.floor(100000 + Math.random() * 900000)}`
          : `EQT-${Math.floor(100000 + Math.random() * 900000)}`;

      const newSub = AppStorage.upgradeSubscription(
        selectedTier,
        billingCycle,
        paymentMethod,
        paymentRef
      );
      setActiveSub(newSub);
      setIsProcessing(false);
      setStep("SUCCESS");
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(newSub);
      }
      if (onUpgradeSuccess) {
        onUpgradeSuccess(selectedTier, billingCycle);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        id="paydesk-subscription-modal"
        className="w-full max-w-5xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-[#111827] px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Flower2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display text-white tracking-wide">
                  YuBiFLo Growth Plans & Tiers
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Your Business is a Flower • Beyond POS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scale and nurture your retail business with float audits, credit management, velocity replenishment, and multi-store intelligence.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {step === "SELECT" && (
            <>
              {/* Billing Cycle Toggle */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Active Merchant: <span className="text-emerald-400">{merchant.business_name}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Current Tier: <strong className="text-amber-300">{activeSub.tierName}</strong> (License: {activeSub.licenseKey})
                    </p>
                  </div>
                </div>

                {/* Monthly vs Annual */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("MONTHLY")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      billingCycle === "MONTHLY"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("ANNUAL")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      billingCycle === "ANNUAL"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>Annual Billing</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* 3 Tier Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {tiers.map((tier) => {
                  const isCurrent = currentTierId === tier.id;
                  const isPop = tier.isPopular;
                  const price =
                    billingCycle === "ANNUAL" ? tier.annualPriceKes : tier.monthlyPriceKes;

                  return (
                    <div
                      key={tier.id}
                      className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all ${
                        isPop
                          ? "bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-950/40"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      } ${isCurrent ? "ring-2 ring-emerald-500/80" : ""}`}
                    >
                      {/* Popular / Current badge */}
                      {isPop && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                          <Flame className="w-3 h-3 fill-slate-950" />
                          <span>{tier.badge}</span>
                        </div>
                      )}

                      {isCurrent && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          Active Plan
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {tier.id === "starter" && <Store className="w-5 h-5 text-emerald-400" />}
                          {tier.id === "pro" && <Zap className="w-5 h-5 text-indigo-400" />}
                          {tier.id === "enterprise" && <Building2 className="w-5 h-5 text-amber-400" />}
                          <h3 className="text-base font-bold text-white">{tier.name}</h3>
                        </div>
                        <p className="text-xs text-slate-400 min-h-[32px]">{tier.tagline}</p>

                        {/* Price */}
                        <div className="mt-4 mb-4 pb-4 border-b border-slate-800">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-semibold text-slate-400">KES</span>
                            <span className="text-3xl font-black text-white font-mono">
                              {price.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400">
                              /{billingCycle === "ANNUAL" ? "yr" : "mo"}
                            </span>
                          </div>
                          {billingCycle === "ANNUAL" && (
                            <p className="text-[10px] text-emerald-400 mt-0.5">
                              Equates to KES {Math.round(price / 12).toLocaleString()}/month
                            </p>
                          )}
                        </div>

                        {/* Limits overview */}
                        <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400">Inventory Items:</span>
                            <p className="font-bold text-slate-200">
                              {tier.maxItems > 10000 ? "Unlimited" : `Up to ${tier.maxItems}`}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">Staff / Cashiers:</span>
                            <p className="font-bold text-slate-200">
                              {tier.maxStaffCashiers > 20 ? "Unlimited" : `${tier.maxStaffCashiers} Logins`}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">Store Branches:</span>
                            <p className="font-bold text-slate-200">
                              {tier.maxBranches > 20 ? "Unlimited" : `${tier.maxBranches} Branch`}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">Support:</span>
                            <p className="font-bold text-slate-200 truncate">
                              {tier.supportLevel.split(" ")[0]}
                            </p>
                          </div>
                        </div>

                        {/* Feature checklist */}
                        <div className="space-y-2 mb-6 text-xs">
                          {tier.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {isCurrent ? (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs cursor-default flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Currently Active</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartUpgrade(tier.id)}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md ${
                              isPop
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : "bg-slate-800 hover:bg-slate-700 text-white"
                            }`}
                          >
                            <span>Choose {tier.name.split(" ")[0]}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Module access matrix footnote */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>YuBiFLo Kenya Platform Guarantee:</strong> Your business is a flower — every plan includes 05:57 AM float tracking, velocity stock reconciliation, offline fallback, encrypted cashier PINs, and automated daily P&L.
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-mono">
                  Equity Paybill: 1450180372031
                </span>
              </div>
            </>
          )}

          {step === "CHECKOUT" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">Upgrade to {chosenTierObj.name}</h3>
                    <p className="text-xs text-slate-400">
                      {billingCycle === "ANNUAL" ? "12 Months Subscription (Save 20%)" : "1 Month Subscription"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Due</span>
                    <p className="text-2xl font-black text-emerald-400 font-mono">
                      KES {priceToPay.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Payment Channel Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Choose Payment Rail</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("MPESA_STK")}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                        paymentMethod === "MPESA_STK"
                          ? "bg-emerald-950/40 border-emerald-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Smartphone className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-200">M-Pesa STK Push</p>
                        <p className="text-[10px] text-slate-400">Instant Phone Prompt</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("EQUITY_PAYBILL")}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                        paymentMethod === "EQUITY_PAYBILL"
                          ? "bg-rose-950/40 border-rose-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Landmark className="w-6 h-6 text-rose-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-200">Equity Paybill</p>
                        <p className="text-[10px] text-slate-400">Acc: 1450180372031</p>
                      </div>
                    </button>
                  </div>
                </div>

                {paymentMethod === "MPESA_STK" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">M-Pesa Phone Number</label>
                    <input
                      type="text"
                      value={phoneForMpesa}
                      onChange={(e) => setPhoneForMpesa(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. 0712345678"
                    />
                    <p className="text-[11px] text-slate-500">
                      An STK Push prompt for KES {priceToPay.toLocaleString()} will be sent to your phone.
                    </p>
                  </div>
                )}

                {paymentMethod === "EQUITY_PAYBILL" && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/40 space-y-2 text-xs">
                    <p className="font-semibold text-rose-300 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4" />
                      <span>Equity Bank Paybill Instructions</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                      <li>Go to M-Pesa / Equity Mobile &gt; Paybill &gt; Business # <strong>247247</strong></li>
                      <li>Account Number: <strong className="font-mono text-rose-300">1450180372031</strong></li>
                      <li>Amount: <strong className="font-mono text-white">KES {priceToPay.toLocaleString()}</strong></li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("SELECT")}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Back to Tiers
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmPayment}
                  className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  {isProcessing ? (
                    <span>Processing STK Push...</span>
                  ) : (
                    <>
                      <span>Confirm & Activate Subscription</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "SUCCESS" && (
            <div className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Subscription Activated!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your store <strong>{merchant.business_name}</strong> is now upgraded to{" "}
                  <strong className="text-emerald-400">{activeSub.tierName}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">License Key:</span>
                  <span className="font-mono font-bold text-amber-300">{activeSub.licenseKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valid Until:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(activeSub.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    ACTIVE
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Done & Return to Duka
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
