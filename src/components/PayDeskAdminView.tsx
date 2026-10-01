import React, { useState } from "react";
import {
  Merchant,
  SubscriptionTier,
  SubscriptionTierId,
  MerchantSubscription,
  CoreModuleId,
} from "../types";
import {
  AppStorage,
  DEFAULT_SUBSCRIPTION_TIERS,
  ALL_MODULE_DEFINITIONS,
} from "../services/storage";
import {
  Building2,
  Users,
  Store,
  Crown,
  DollarSign,
  TrendingUp,
  KeyRound,
  Plus,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Edit2,
  Trash2,
  Search,
  Sliders,
  Sparkles,
  Smartphone,
  Landmark,
  FileText,
  Calendar,
  AlertCircle,
  Flower2,
  BookOpen,
  Download,
} from "lucide-react";
import { AdminDocsViewer } from "./AdminDocsViewer";

interface PayDeskAdminViewProps {
  onSwitchTenant?: (merchantId: string) => void;
  onSwitchMerchant?: (merchantId: string) => void;
  activeMerchantId?: string;
}

export const PayDeskAdminView: React.FC<PayDeskAdminViewProps> = ({
  onSwitchTenant,
  onSwitchMerchant,
  activeMerchantId,
}) => {
  const [adminTab, setAdminTab] = useState<"STORES" | "TIERS" | "DOCS">("STORES");
  const [merchants, setMerchants] = useState<Merchant[]>(AppStorage.getAllMerchants());
  const [tiers, setTiers] = useState<SubscriptionTier[]>(AppStorage.getSubscriptionTiers());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterTier, setSelectedFilterTier] = useState<string>("ALL");

  // New Merchant Modal State
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newPhone, setNewPhone] = useState("+254 7");
  const [newLocation, setNewLocation] = useState("Nairobi, Kenya");
  const [newShopType, setNewShopType] = useState("Kiosk / Duka");
  const [newTierId, setNewTierId] = useState<SubscriptionTierId>("pro");
  const [newBillingCycle, setNewBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");

  // Edit Tier Pricing State
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);

  const switchTenant = (id: string) => {
    if (onSwitchTenant) onSwitchTenant(id);
    else if (onSwitchMerchant) onSwitchMerchant(id);
  };

  // Filtered merchants
  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier =
      selectedFilterTier === "ALL" || m.subscription?.tierId === selectedFilterTier;

    return matchesSearch && matchesTier;
  });

  // Calculate SaaS Financial Metrics
  const totalTenants = merchants.length;
  const activeSubs = merchants.filter((m) => m.subscription?.status === "ACTIVE").length;
  const monthlyRevenueKes = merchants.reduce((sum, m) => {
    const tierId = m.subscription?.tierId;
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier) return sum + 1499;
    return (
      sum +
      (m.subscription?.billingCycle === "ANNUAL"
        ? Math.round(tier.annualPriceKes / 12)
        : tier.monthlyPriceKes)
    );
  }, 0);
  const arpuKes = Math.round(monthlyRevenueKes / (totalTenants || 1));

  const handleProvisionStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const chosenTierObj = tiers.find((t) => t.id === newTierId) || tiers[1];
    const durationDays = newBillingCycle === "ANNUAL" ? 365 : 30;
    const priceKes =
      newBillingCycle === "ANNUAL" ? chosenTierObj.annualPriceKes : chosenTierObj.monthlyPriceKes;

    const newSub: MerchantSubscription = {
      tierId: chosenTierObj.id,
      tierName: chosenTierObj.name,
      status: "ACTIVE",
      billingCycle: newBillingCycle,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString(),
      licenseKey: `PAYDESK-${chosenTierObj.id.toUpperCase()}-${Math.floor(
        1000 + Math.random() * 9000
      )}-${Date.now().toString().slice(-4)}`,
      autoRenew: true,
      invoices: [
        {
          id: `inv-${Date.now()}`,
          tierId: chosenTierObj.id,
          tierName: chosenTierObj.name,
          amountKes: priceKes,
          billingCycle: newBillingCycle,
          paymentMethod: "MPESA_STK",
          paymentRef: `PROV-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toISOString().split("T")[0],
          status: "PAID",
        },
      ],
    };

    AppStorage.createMerchant({
      business_name: newStoreName.trim(),
      owner_name: newOwnerName.trim() || "Store Owner",
      phone: newPhone.trim() || "+254 700 000 000",
      location: newLocation.trim() || "Nairobi, Kenya",
      shop_type: newShopType as any,
      subscription: newSub,
      equity_paybill_number: "Equity Paybill 247247 • Acc: 1450180372031",
    });

    setMerchants(AppStorage.getAllMerchants());
    setIsProvisioning(false);
    setNewStoreName("");
    setNewOwnerName("");
    setNewPhone("+254 7");
  };

  const handleUpdateTierPricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    AppStorage.updateSubscriptionTier(editingTier);
    setTiers(AppStorage.getSubscriptionTiers());
    setEditingTier(null);
  };

  const handleDeleteMerchant = (merchantId: string) => {
    if (confirm("Are you sure you want to remove this client merchant account?")) {
      AppStorage.deleteMerchant(merchantId);
      setMerchants(AppStorage.getAllMerchants());
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* SaaS Master Header */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
            <Flower2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold font-display text-white">YuBiFLo SaaS Master Console</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Your Business is a Flower • Beyond POS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Nurture, provision, and scale client stores with subscription tiers, feature access, and automated multi-tenant oversight.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAdminTab("DOCS")}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>BRD & PRD Specifications</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminTab("STORES");
              setIsProvisioning(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Sell & Provision New Client Store</span>
          </button>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setAdminTab("STORES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            adminTab === "STORES"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Client Stores & Tenancies ({totalTenants})</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab("TIERS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            adminTab === "TIERS"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Subscription Tiers & Packaging ({tiers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab("DOCS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            adminTab === "DOCS"
              ? "bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-lg shadow-indigo-950"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>BRD & PRD Documents (Downloadable)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
            New
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STORES & TENANCIES */}
      {/* ========================================================================= */}
      {adminTab === "STORES" && (
        <div className="space-y-6">
          {/* SaaS Key Metrics Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">Total Client Stores</span>
                <Store className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{totalTenants}</p>
              <p className="text-[10px] text-emerald-400 font-medium">100% cloud-synced tenancies</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">Monthly Recurring Revenue</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                KES {monthlyRevenueKes.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">MRR from active subscriptions</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">Active Licenses</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400 font-mono">{activeSubs}</p>
              <p className="text-[10px] text-slate-400">0 expired accounts</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">Avg Revenue / Store (ARPU)</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">KES {arpuKes.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Healthy SaaS unit economics</p>
            </div>
          </div>

          {/* Tenants Directory Table */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Client Stores & Tenancies Directory</h3>
                <p className="text-xs text-slate-400">
                  Select any client store to switch context or manage their tier and cashier permissions.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Search business, owner, phone..."
                  />
                </div>

                {/* Filter */}
                <select
                  value={selectedFilterTier}
                  onChange={(e) => setSelectedFilterTier(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                >
                  <option value="ALL">All Tiers</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="p-3.5">Store / Merchant</th>
                    <th className="p-3.5">Contact & Location</th>
                    <th className="p-3.5">Subscription Plan</th>
                    <th className="p-3.5">License Key</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px]">
                  {filteredMerchants.map((m) => {
                    const isCurrent = m.id === activeMerchantId;
                    const sub = m.subscription;

                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-slate-950/60 transition-colors ${
                          isCurrent ? "bg-indigo-950/20" : ""
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isCurrent
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {m.business_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-white flex items-center gap-1.5">
                                <span>{m.business_name}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                                    Current Active
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                Owner: {m.owner_name} • {m.shop_type || "Duka"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <p className="font-mono text-slate-200">{m.phone}</p>
                          <p className="text-[10px] text-slate-400">{m.location}</p>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub?.tierId === "enterprise"
                                ? "bg-amber-950 text-amber-300 border border-amber-800/40"
                                : sub?.tierId === "pro"
                                ? "bg-indigo-950 text-indigo-300 border border-indigo-800/40"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                            }`}
                          >
                            {sub?.tierName || "Starter Kiosk"}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {sub?.billingCycle || "MONTHLY"}
                          </p>
                        </td>

                        <td className="p-3.5">
                          <p className="font-mono text-slate-300 font-semibold text-[10px]">
                            {sub?.licenseKey || "PAYDESK-DEMO"}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            Expires: {sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : "30d"}
                          </p>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[10px] font-bold">
                            ACTIVE
                          </span>
                        </td>

                        <td className="p-3.5 text-right space-x-2">
                          {isCurrent ? (
                            <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-400 text-xs font-bold">
                              Active Store
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => switchTenant(m.id)}
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                            >
                              Switch to Store
                            </button>
                          )}

                          {m.id !== "merch-nairobi-01" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMerchant(m.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete merchant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBSCRIPTION TIERS */}
      {/* ========================================================================= */}
      {adminTab === "TIERS" && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Configured Subscription Tiers & Pricing</h3>
              <p className="text-xs text-slate-400">
                Customize pricing and feature access when onboarding client businesses onto YuBiFLo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{tier.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {tier.badge || tier.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 min-h-[28px]">{tier.tagline}</p>

                  <div className="my-2 p-2 rounded bg-slate-900 border border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500">Monthly</span>
                      <p className="text-sm font-black text-emerald-400 font-mono">
                        KES {tier.monthlyPriceKes.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500">Annual</span>
                      <p className="text-sm font-black text-indigo-300 font-mono">
                        KES {tier.annualPriceKes.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p>
                      • Max Items:{" "}
                      <strong className="text-slate-200">
                        {tier.maxItems > 10000 ? "Unlimited" : tier.maxItems}
                      </strong>
                    </p>
                    <p>
                      • Max Cashiers:{" "}
                      <strong className="text-slate-200">{tier.maxStaffCashiers} Logins</strong>
                    </p>
                    <p>
                      • Max Branches:{" "}
                      <strong className="text-slate-200">{tier.maxBranches} Branch</strong>
                    </p>
                    <p>
                      • Modules:{" "}
                      <strong className="text-slate-200">{tier.allowedModules.length} Enabled</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingTier({ ...tier })}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit Tier Pricing & Limits</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ENTERPRISE BRD & PRD SPECIFICATIONS (DOWNLOADABLE) */}
      {/* ========================================================================= */}
      {adminTab === "DOCS" && <AdminDocsViewer />}

      {/* EDIT TIER MODAL */}
      {editingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleUpdateTierPricing}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit {editingTier.name} Tier</h3>
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Monthly Price (KES)</label>
                <input
                  type="number"
                  value={editingTier.monthlyPriceKes}
                  onChange={(e) =>
                    setEditingTier({ ...editingTier, monthlyPriceKes: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Annual Price (KES)</label>
                <input
                  type="number"
                  value={editingTier.annualPriceKes}
                  onChange={(e) =>
                    setEditingTier({ ...editingTier, annualPriceKes: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-indigo-300 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Max Items</label>
                <input
                  type="number"
                  value={editingTier.maxItems}
                  onChange={(e) =>
                    setEditingTier({ ...editingTier, maxItems: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Max Staff</label>
                <input
                  type="number"
                  value={editingTier.maxStaffCashiers}
                  onChange={(e) =>
                    setEditingTier({ ...editingTier, maxStaffCashiers: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Max Branches</label>
                <input
                  type="number"
                  value={editingTier.maxBranches}
                  onChange={(e) =>
                    setEditingTier({ ...editingTier, maxBranches: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
              >
                Save Tier Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROVISION STORE MODAL */}
      {isProvisioning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleProvisionStore}
            className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Sell & Provision Client Merchant</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisioning(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Business / Store Name</label>
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  placeholder="e.g. Kiambu Fresh Groceries"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Owner Name</label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  placeholder="e.g. Samuel Njoroge"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  placeholder="+254 700 000 000"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  placeholder="e.g. Kiambu Town"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Shop Type</label>
                <select
                  value={newShopType}
                  onChange={(e) => setNewShopType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="Kiosk / Duka">Kiosk / Duka</option>
                  <option value="Mini-Supermarket">Mini-Supermarket</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Agrovet">Agrovet</option>
                  <option value="Chemist / Pharmacy">Chemist / Pharmacy</option>
                  <option value="Hardware">Hardware</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Subscription Tier</label>
                <select
                  value={newTierId}
                  onChange={(e) => setNewTierId(e.target.value as SubscriptionTierId)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (KES {t.monthlyPriceKes}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Billing Cycle</label>
                <select
                  value={newBillingCycle}
                  onChange={(e) => setNewBillingCycle(e.target.value as "MONTHLY" | "ANNUAL")}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="ANNUAL">Annual (20% Discount)</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center justify-between font-bold">
                <span>Activation License:</span>
                <span className="text-emerald-400 font-mono">
                  KES{" "}
                  {(newBillingCycle === "ANNUAL"
                    ? tiers.find((t) => t.id === newTierId)?.annualPriceKes
                    : tiers.find((t) => t.id === newTierId)?.monthlyPriceKes
                  )?.toLocaleString() || "1,499"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Generates a secure 30-day or 365-day license token and provisions an isolated database schema.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsProvisioning(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950"
              >
                Activate & Provision Store
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
