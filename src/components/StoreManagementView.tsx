import React, { useState } from "react";
import {
  Merchant,
  StaffMember,
  StoreBranch,
  CustomPaymentConfig,
  ReceiptCustomization,
  StaffRole,
  CoreModuleId,
} from "../types";
import {
  AppStorage,
  ALL_MODULE_DEFINITIONS,
  DEFAULT_PAYMENT_CONFIG,
  DEFAULT_RECEIPT_CONFIG,
} from "../services/storage";
import {
  Store,
  Users,
  Building2,
  Landmark,
  Receipt,
  Shield,
  CreditCard,
  Smartphone,
  Plus,
  Trash2,
  Edit2,
  Check,
  Crown,
  KeyRound,
  FileText,
  AlertCircle,
  ExternalLink,
  Printer,
  Sparkles,
  Zap,
} from "lucide-react";

interface StoreManagementViewProps {
  merchant?: Merchant;
  onMerchantUpdated?: (updated: Merchant) => void;
  onUpdateMerchant?: (updated: Merchant) => void;
  onOpenSubscriptionModal?: () => void;
  onOpenUpgradeModal?: () => void;
}

export const StoreManagementView: React.FC<StoreManagementViewProps> = ({
  merchant: propMerchant,
  onMerchantUpdated,
  onUpdateMerchant,
  onOpenSubscriptionModal,
  onOpenUpgradeModal,
}) => {
  const merchant = propMerchant || AppStorage.getActiveMerchant();
  const triggerMerchantUpdate = (updated: Merchant) => {
    if (onMerchantUpdated) onMerchantUpdated(updated);
    if (onUpdateMerchant) onUpdateMerchant(updated);
  };
  const triggerOpenUpgrade = () => {
    if (onOpenSubscriptionModal) onOpenSubscriptionModal();
    if (onOpenUpgradeModal) onOpenUpgradeModal();
  };

  const [activeTab, setActiveTab] = useState<
    "PROFILE" | "PAYMENTS" | "STAFF" | "BRANCHES" | "RECEIPTS" | "SUBSCRIPTION"
  >("PROFILE");

  // Profile Form State
  const [businessName, setBusinessName] = useState(merchant?.business_name || "");
  const [ownerName, setOwnerName] = useState(merchant?.owner_name || "");
  const [phone, setPhone] = useState(merchant?.phone || "");
  const [location, setLocation] = useState(merchant?.location || "");
  const [shopType, setShopType] = useState(merchant?.shop_type || "Kiosk / Duka");

  // Payments Config State
  const [paymentConfig, setPaymentConfig] = useState<CustomPaymentConfig>(
    merchant?.paymentConfig || AppStorage.getPaymentConfig()
  );

  // Staff State
  const [staffList, setStaffList] = useState<StaffMember[]>(
    AppStorage.getStaffMembers()
  );
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPin, setNewStaffPin] = useState("1234");
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>("CASHIER");

  // Branches State
  const [branchList, setBranchList] = useState<StoreBranch[]>(
    AppStorage.getStoreBranches()
  );
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCode, setNewBranchCode] = useState("");
  const [newBranchLocation, setNewBranchLocation] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");

  // Receipt Config State
  const [receiptConfig, setReceiptConfig] = useState<ReceiptCustomization>(
    merchant?.receiptConfig || AppStorage.getReceiptConfig()
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const sub = merchant?.subscription || AppStorage.getActiveSubscription();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Merchant = {
      ...merchant,
      business_name: businessName,
      owner_name: ownerName,
      phone,
      location,
      shop_type: shopType as any,
    };
    AppStorage.updateMerchant(updated);
    triggerMerchantUpdate(updated);
    showSuccessToast();
  };

  const handleSavePayments = (e: React.FormEvent) => {
    e.preventDefault();
    AppStorage.savePaymentConfig(paymentConfig);
    const updated: Merchant = {
      ...merchant,
      paymentConfig,
    };
    AppStorage.updateMerchant(updated);
    triggerMerchantUpdate(updated);
    showSuccessToast();
  };

  const handleSaveReceiptConfig = (e: React.FormEvent) => {
    e.preventDefault();
    AppStorage.saveReceiptConfig(receiptConfig);
    const updated: Merchant = {
      ...merchant,
      receiptConfig,
    };
    AppStorage.updateMerchant(updated);
    onMerchantUpdated(updated);
    showSuccessToast();
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      merchant_id: merchant.id,
      name: newStaffName.trim(),
      phone: newStaffPhone.trim() || "+254 700 000 000",
      pin: newStaffPin.trim() || "1234",
      role: newStaffRole,
      status: "ACTIVE",
      allowedModules:
        newStaffRole === "OWNER"
          ? ALL_MODULE_DEFINITIONS.map((m) => m.id)
          : newStaffRole === "MANAGER"
          ? ["dashboard", "morning_float", "stock", "people", "reconcile", "analytics", "sales", "money_out", "restock"]
          : ["dashboard", "morning_float", "stock", "people"],
      created_at: new Date().toISOString(),
    };

    AppStorage.addStaffMember(newStaff);
    const updated = AppStorage.getStaffMembers();
    setStaffList(updated);
    setIsAddingStaff(false);
    setNewStaffName("");
    setNewStaffPhone("");
    setNewStaffPin("1234");
    showSuccessToast();
  };

  const handleDeleteStaff = (staffId: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      AppStorage.deleteStaffMember(staffId);
      setStaffList(AppStorage.getStaffMembers());
      showSuccessToast();
    }
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const newBranch: StoreBranch = {
      id: `branch-${Date.now()}`,
      merchant_id: merchant.id,
      name: newBranchName.trim(),
      code: newBranchCode.trim() || `BR-${Math.floor(10 + Math.random() * 90)}`,
      location: newBranchLocation.trim() || "Nairobi",
      phone: newBranchPhone.trim() || merchant.phone,
      is_main: branchList.length === 0,
      created_at: new Date().toISOString(),
    };

    AppStorage.addStoreBranch(newBranch);
    setBranchList(AppStorage.getStoreBranches());
    setIsAddingBranch(false);
    setNewBranchName("");
    setNewBranchCode("");
    setNewBranchLocation("");
    setNewBranchPhone("");
    showSuccessToast();
  };

  const showSuccessToast = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold font-display text-white">{merchant.business_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>{sub.tierName}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              YuBiFLo Store Management • Nurturing Growth with Customized Payment Rails, Cashier PINs & Branch Architecture
            </p>
          </div>
        </div>

        {/* Subscription Quick Button */}
        <button
          type="button"
          onClick={triggerOpenUpgrade}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start md:self-auto"
        >
          <Zap className="w-4 h-4" />
          <span>Manage / Upgrade Subscription</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Settings successfully saved and synced across all terminals.</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
        {[
          { id: "PROFILE", label: "Business Profile", icon: Store },
          { id: "PAYMENTS", label: "Payment Rails & Paybill", icon: Landmark },
          { id: "STAFF", label: "Staff & Cashiers PINs", icon: Users },
          { id: "BRANCHES", label: "Multi-Store Branches", icon: Building2 },
          { id: "RECEIPTS", label: "Thermal Receipt Designer", icon: Receipt },
          { id: "SUBSCRIPTION", label: "Subscription & License", icon: Crown },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? "bg-slate-800 text-white border border-slate-700 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BUSINESS PROFILE */}
      {activeTab === "PROFILE" && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Store Identity & Location</h3>
            <p className="text-xs text-slate-400">Configure how your business is displayed to customers and receipts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Business / Duka Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                placeholder="e.g. Wanjiku Duka & Agency"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Owner / Merchant Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Wanjiku Mukangai"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Official Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="e.g. +254 712 345 678"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Location / Town</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Kawangware Stage 2, Nairobi"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Shop Category</label>
              <select
                value={shopType}
                onChange={(e) => setShopType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Kiosk / Duka">Kiosk / Duka</option>
                <option value="Mini-Mart">Mini-Mart</option>
                <option value="Agrovet">Agrovet</option>
                <option value="Wholesale & Retail">Wholesale & Retail</option>
                <option value="Bar & Liquor Store">Bar & Liquor Store</option>
                <option value="Bakery & Eatery">Bakery & Eatery</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: PAYMENT RAILS & CHANNELS */}
      {activeTab === "PAYMENTS" && (
        <form onSubmit={handleSavePayments} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Customizable Payment Channels</h3>
            <p className="text-xs text-slate-400">
              Customize which digital and cash collection rails your cashiers accept during checkout and morning float.
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. Equity Paybill */}
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/30 flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-rose-400" />
                  <h4 className="text-xs font-bold text-white">Equity Paybill (Acc: 1450180372031)</h4>
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-bold">Recommended</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Customer digital payments for shop goods go directly to this Equity Bank Paybill account.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-400 block mb-1">Equity Account Number</label>
                    <input
                      type="text"
                      value={paymentConfig.equityPaybillNumber}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, equityPaybillNumber: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-rose-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={paymentConfig.useEquityPaybill}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, useEquityPaybill: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* 2. M-Pesa SIM E-Float */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/30 flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">M-Pesa Electronic Float (SIM Line)</h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Dedicated SIM card float for customer cash withdrawals, deposits & agent transactions.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-400 block mb-1">Float Phone / Agent Number</label>
                    <input
                      type="text"
                      value={paymentConfig.mpesaFloatNumber || ""}
                      onChange={(e) =>
                        setPaymentConfig({ ...paymentConfig, mpesaFloatNumber: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono font-bold"
                      placeholder="e.g. +254 712 345 678"
                    />
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={paymentConfig.useMpesaFloat}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, useMpesaFloat: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* 3. Physical Cash Drawer */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/30 flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">Unified Cash Drawer (Cash ni Moja)</h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Single cash box holding bank notes and coins for both retail sales and M-Pesa agency cash.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={paymentConfig.useCashDrawer}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, useCashDrawer: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              Save Payment Channel Rails
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: STAFF & CASHIER PINs */}
      {activeTab === "STAFF" && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Staff Logins & Role Permissions</h3>
              <p className="text-xs text-slate-400">
                Grant 4-digit PINs to cashiers and restrict access to sensitive business schemas or margins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingStaff(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Cashier / Staff</span>
            </button>
          </div>

          {isAddingStaff && (
            <form onSubmit={handleCreateStaff} className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-4">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">New Staff Member</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="e.g. Brian Otieno"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    placeholder="0712345678"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="CASHIER">Cashier (POS & Float only)</option>
                    <option value="MANAGER">Branch Manager</option>
                    <option value="AUDITOR">Auditor (Read-Only)</option>
                    <option value="OWNER">Store Owner (Full Access)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">4-Digit Access PIN</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold text-center"
                    placeholder="1234"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingStaff(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffList.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{member.name}</h4>
                      <p className="text-[10px] text-slate-400">{member.phone}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      member.role === "OWNER"
                        ? "bg-amber-950 text-amber-300 border border-amber-800/40"
                        : member.role === "MANAGER"
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-800/40"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    <span>Login PIN:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300">•••• ({member.pin})</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-[10px] text-slate-400">
                  <span>Modules: {member.allowedModules.length} enabled</span>
                  {member.role !== "OWNER" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(member.id)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-STORE BRANCHES */}
      {activeTab === "BRANCHES" && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Multi-Store Branch Architecture</h3>
              <p className="text-xs text-slate-400">
                Manage inventory and morning float balances across multiple shop branches.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingBranch(true)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Branch</span>
            </button>
          </div>

          {isAddingBranch && (
            <form onSubmit={handleCreateBranch} className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-4">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">New Store Branch</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="e.g. Westlands Branch"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Branch Code</label>
                  <input
                    type="text"
                    value={newBranchCode}
                    onChange={(e) => setNewBranchCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    placeholder="WST-02"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Location</label>
                  <input
                    type="text"
                    value={newBranchLocation}
                    onChange={(e) => setNewBranchLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="e.g. Westlands Mall"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={newBranchPhone}
                    onChange={(e) => setNewBranchPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    placeholder="0700000000"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBranch(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                >
                  Save Store Branch
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branchList.map((branch) => (
              <div
                key={branch.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{branch.name}</h4>
                      <p className="text-[11px] text-slate-400">{branch.location}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                    {branch.code}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-850">
                  <span>Manager: {branch.manager_name || "Assigned by HQ"}</span>
                  <span className="font-mono text-slate-300">{branch.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: RECEIPT DESIGNER */}
      {activeTab === "RECEIPTS" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSaveReceiptConfig} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Thermal Receipt Customizer</h3>
              <p className="text-xs text-slate-400">Design customer printed receipts and WhatsApp payment slips.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Receipt Header Title</label>
              <input
                type="text"
                value={receiptConfig.storeName}
                onChange={(e) => setReceiptConfig({ ...receiptConfig, storeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={receiptConfig.tagline}
                onChange={(e) => setReceiptConfig({ ...receiptConfig, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">KRA PIN (Optional)</label>
              <input
                type="text"
                value={receiptConfig.taxPin || ""}
                onChange={(e) => setReceiptConfig({ ...receiptConfig, taxPin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-mono"
                placeholder="P051239847K"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Footer Message</label>
              <textarea
                rows={2}
                value={receiptConfig.footerMessage}
                onChange={(e) => setReceiptConfig({ ...receiptConfig, footerMessage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-300"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              Save Receipt Layout
            </button>
          </form>

          {/* Live Receipt Preview */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center">
            <div className="w-full max-w-sm bg-white text-slate-950 p-6 rounded-xl shadow-2xl font-mono text-[11px] space-y-3">
              <div className="text-center border-b border-dashed border-slate-400 pb-3">
                <h4 className="font-black text-sm uppercase tracking-wider">{receiptConfig.storeName}</h4>
                <p className="text-[10px] text-slate-600 italic">{receiptConfig.tagline}</p>
                <p className="text-[10px] text-slate-600">{merchant.location}</p>
                <p className="text-[10px] text-slate-600">TEL: {receiptConfig.phone}</p>
                {receiptConfig.taxPin && <p className="text-[10px] font-bold">PIN: {receiptConfig.taxPin}</p>}
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>RECEIPT #:</span>
                  <span className="font-bold">RCP-98421</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date().toLocaleDateString()} 14:32</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>Kevin (Main Stage)</span>
                </div>
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between font-bold">
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>
                <div className="flex justify-between">
                  <span>2x Milk 500ml @ 65</span>
                  <span>130.00</span>
                </div>
                <div className="flex justify-between">
                  <span>1x Unga 2kg @ 170</span>
                  <span>170.00</span>
                </div>
                <div className="flex justify-between">
                  <span>1x Sugar 1kg @ 150</span>
                  <span>150.00</span>
                </div>
              </div>

              <div className="space-y-1 font-bold">
                <div className="flex justify-between text-xs">
                  <span>TOTAL KES:</span>
                  <span>450.00</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>PAYMENT METHOD:</span>
                  <span>Equity Paybill (1450180372031)</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-400 text-[9px] text-slate-600">
                <p>{receiptConfig.footerMessage}</p>
                <p className="font-bold text-[8px] mt-1">POWERED BY PAYDESK KENYA</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SUBSCRIPTION & LICENSE */}
      {activeTab === "SUBSCRIPTION" && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">License Key & Active Tier</h3>
              <p className="text-xs text-slate-400">View your active SaaS subscription and payment invoice history.</p>
            </div>
            <button
              type="button"
              onClick={triggerOpenUpgrade}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Change Subscription Tier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Tier</span>
              <p className="text-base font-black text-amber-400">{sub.tierName}</p>
              <p className="text-[11px] text-slate-400">Billing: {sub.billingCycle}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">License Key</span>
              <p className="text-base font-black text-emerald-400 font-mono">{sub.licenseKey}</p>
              <p className="text-[11px] text-slate-400">Hardware ID: HWD-{merchant.id.slice(-4).toUpperCase()}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Valid Through</span>
              <p className="text-base font-black text-white font-mono">
                {new Date(sub.expiresAt).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-emerald-400">Auto-Renew: {sub.autoRenew ? "Enabled" : "Manual"}</p>
            </div>
          </div>

          {/* Invoice History */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Billing & Tax Invoices</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px]">
                  {(sub.invoices || []).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-mono font-bold text-slate-200">{inv.id}</td>
                      <td className="p-3 text-slate-400">{inv.date}</td>
                      <td className="p-3 text-slate-200">{inv.tierName}</td>
                      <td className="p-3 text-slate-400">{inv.paymentMethod}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        KES {inv.amountKes.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px]">
                          PAID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
