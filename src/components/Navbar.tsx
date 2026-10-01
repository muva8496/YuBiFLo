import React, { useState } from "react";
import {
  Store,
  PlusCircle,
  PackagePlus,
  FileScan,
  Scale,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Shield,
  Lock,
  Unlock,
  Sliders,
  Crown,
  Zap,
  Building2,
  Check,
  Plus,
  Flower2,
  Sprout,
  Sun,
  Moon,
  Palette,
} from "lucide-react";
import { Merchant } from "../types";
import { AppStorage } from "../services/storage";

interface NavbarProps {
  merchant: Merchant;
  onOpenMoneyOut: () => void;
  onOpenRestock: () => void;
  onOpenScanReceipts: () => void;
  onOpenReconcile: () => void;
  onOpenSettings: () => void;
  onOpenSchema: () => void;
  onOpenSubscriptionModal?: () => void;
  onSwitchTenant?: (merchantId: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin?: boolean;
  onOpenAdminAuth?: () => void;
  onOpenModuleCustomizer?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  onOpenLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  merchant,
  onOpenMoneyOut,
  onOpenRestock,
  onOpenScanReceipts,
  onOpenReconcile,
  onOpenSettings,
  onOpenSchema,
  onOpenSubscriptionModal,
  onSwitchTenant,
  activeTab,
  setActiveTab,
  isAdmin = false,
  onOpenAdminAuth,
  onOpenModuleCustomizer,
  theme = "dark",
  onToggleTheme,
  onOpenLanding,
}) => {
  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);
  const allMerchants = AppStorage.getAllMerchants();
  const sub = merchant?.subscription || AppStorage.getActiveSubscription();

  const handleSchemaClick = () => {
    if (isAdmin) {
      onOpenSchema();
    } else {
      if (onOpenAdminAuth) {
        onOpenAdminAuth();
      }
    }
  };

  const handleSelectStore = (storeId: string) => {
    setIsTenantMenuOpen(false);
    if (onSwitchTenant) {
      onSwitchTenant(storeId);
    }
  };

  return (
    <header id="yubiflo-navbar" className="sticky top-0 z-40 bg-[#0c1017]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Merchant Profile */}
        <div className="flex items-center gap-3">
          <div
            id="brand-logo-btn"
            onClick={() => setActiveTab("dashboard")}
            className="cursor-pointer flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md border border-emerald-400/30 group-hover:scale-105 transition-transform">
              <Flower2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight font-display">YuBiFLo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold uppercase tracking-wider">
                  Beyond POS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Your Business is a Flower • Growth & Velocity Engine
              </p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-800 mx-1" />

          {/* Active Tenant / Multi-Store Dropdown Switcher */}
          <div className="relative">
            <button
              id="merchant-profile-chip"
              onClick={() => setIsTenantMenuOpen(!isTenantMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors shadow-sm"
              title="Click to switch between client stores or manage tenants"
            >
              <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold max-w-[130px] truncate text-white">{merchant?.business_name || "My Store"}</span>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/30">
                {sub?.tierName ? sub.tierName.split(" ")[0] : "Starter"}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {/* Tenant Switcher Popover */}
            {isTenantMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 space-y-1">
                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Client Store
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    {allMerchants.length} Stores
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {allMerchants.map((m) => {
                    const isSelected = m.id === merchant?.id;
                    const mTier = m.subscription?.tierName || "Starter";
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSelectStore(m.id)}
                        className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-emerald-950/50 border border-emerald-500/40 text-white"
                            : "hover:bg-slate-800/80 text-slate-300"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-xs truncate">{m.business_name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {m.owner_name} • {mTier}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      setIsTenantMenuOpen(false);
                      setActiveTab("saas_admin");
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>SaaS Console</span>
                    </span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Tier Quick Badge */}
          {onOpenSubscriptionModal && (
            <button
              onClick={onOpenSubscriptionModal}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111827] hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm"
              title="Click to upgrade subscription tier or view pricing"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{sub.tierName}</span>
            </button>
          )}

          {/* Admin Mode Status Badge */}
          <button
            id="admin-status-chip"
            onClick={onOpenAdminAuth}
            className={`hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${
              isAdmin
                ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/30"
            }`}
            title={isAdmin ? "Admin Mode Active (Schema Unlocked)" : "Click to unlock Admin Mode (PIN: 2031)"}
          >
            {isAdmin ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-400" />
                <span>Admin Active</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Admin Lock</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Action CTAs for Busy Retailers */}
        <div className="flex items-center gap-2">
          {/* Platform Overview Landing CTA */}
          {onOpenLanding && (
            <button
              onClick={onOpenLanding}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
              title="View YuBiFlo Data Ecosystem Platform Landing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Platform Overview</span>
            </button>
          )}

          {/* Quick Restock CTA */}
          <button
            id="quick-restock-btn"
            onClick={onOpenRestock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            title="Fast 1-tap batch restock"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restock Batch</span>
            <span className="sm:hidden">Restock</span>
          </button>

          {/* Money Out CTA */}
          <button
            id="quick-moneyout-btn"
            onClick={onOpenMoneyOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-900/30 text-xs font-medium transition-colors"
            title="Record Inventory Purchase / Expense"
          >
            <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Money Out</span>
          </button>

          {/* Scan / Ingest Bills CTA */}
          <button
            id="quick-scan-btn"
            onClick={onOpenScanReceipts}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-900/30 text-xs font-medium transition-colors"
            title="Multi-Receipt Chronological Ingestion & OCR"
          >
            <FileScan className="w-3.5 h-3.5 text-amber-400" />
            <span>Scan Bills</span>
          </button>

          {/* Audit CTA */}
          <button
            id="quick-audit-btn"
            onClick={onOpenReconcile}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-900/30 text-xs font-medium transition-colors"
            title="End-of-day cash-to-stock reconciliation"
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit</span>
          </button>

          {/* Customize Modules CTA */}
          <button
            id="navbar-panga-modules-btn"
            onClick={onOpenModuleCustomizer}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Customize Sidebar Modules"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Schema & SQL (Protected by Admin) */}
          <button
            id="view-schema-btn"
            onClick={handleSchemaClick}
            className={`p-1.5 rounded-lg border transition-colors ${
              activeTab === "schema"
                ? "bg-rose-950/60 border-rose-500/50 text-rose-300"
                : isAdmin
                ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-emerald-400"
                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-500 hover:text-amber-300"
            }`}
            title={isAdmin ? "PostgreSQL / Supabase Schema (Admin)" : "Data Schema (Admin PIN Required)"}
          >
            {isAdmin ? (
              <Sparkles className="w-4 h-4 text-emerald-400" />
            ) : (
              <Shield className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Settings / Store Setup */}
          <button
            id="open-settings-btn"
            onClick={() => setActiveTab("store_settings")}
            className={`p-1.5 rounded-lg border transition-colors ${
              activeTab === "store_settings"
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Store & Staff Setup (Paybill, Cashiers, Branches)"
          >
            <Store className="w-4 h-4" />
          </button>

          {/* Theme Appearance Mode Toggle */}
          {onToggleTheme && (
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
              title={theme === "light" ? "Switch to Modern Executive Dark Mode" : "Switch to Crisp High-Contrast Day Mode"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

