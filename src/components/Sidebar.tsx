import React, { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ArrowUpRight,
  Boxes,
  RefreshCw,
  Receipt,
  Scale,
  DollarSign,
  Database,
  Clock,
  Users,
  Compass,
  Sliders,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Store,
  Crown,
  Zap,
} from "lucide-react";
import { ALL_MODULE_DEFINITIONS } from "../services/storage";
import { Merchant } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  merchant?: Merchant;
  onOpenSubscriptionModal?: () => void;
  leakageAlertCount?: number;
  lowStockCount?: number;
  activeDeniCount?: number;
  visibleModuleIds?: string[];
  onOpenModuleCustomizer?: () => void;
  isAdmin?: boolean;
  onOpenAdminAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  merchant,
  onOpenSubscriptionModal,
  leakageAlertCount = 0,
  lowStockCount = 0,
  activeDeniCount = 0,
  visibleModuleIds = ["dashboard", "morning_float", "stock", "people", "reconcile", "analytics", "store_settings"],
  onOpenModuleCustomizer,
  isAdmin = false,
  onOpenAdminAuth,
}) => {
  const [showHiddenDrawer, setShowHiddenDrawer] = useState(false);

  const sub = merchant?.subscription;

  const rawNavItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      shortLabel: "Dashboard",
      shengLabel: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
      desc: "Overview & metrics",
      adminOnly: false,
    },
    {
      id: "quick_dump",
      label: "Quick Raw Dump",
      shortLabel: "Quick Dump",
      shengLabel: "Dump Zone",
      icon: Zap,
      badge: "Fast Drop",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      desc: "Suppliers, Customers & Products",
      adminOnly: false,
    },
    {
      id: "morning_float",
      label: "Opening Float",
      shortLabel: "Float",
      shengLabel: "Float",
      icon: Clock,
      badge: "0557",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      desc: "Opening Cash & E-Float",
      adminOnly: false,
    },
    {
      id: "stock",
      label: "Inventory",
      shortLabel: "Inventory",
      shengLabel: "Inventory",
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      desc: "Stock & batch margins",
      adminOnly: false,
    },
    {
      id: "people",
      label: "Customers & Credit",
      shortLabel: "Customers",
      shengLabel: "Customers",
      icon: Users,
      badge: activeDeniCount > 0 ? `${activeDeniCount} Debt` : null,
      badgeColor:
        activeDeniCount > 0
          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
          : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      desc: "Customers & suppliers",
      adminOnly: false,
    },
    {
      id: "t_ledgers",
      label: "T-Ledgers & Rankings",
      shortLabel: "T-Ledgers",
      shengLabel: "T-Ledgers",
      icon: Scale,
      badge: "6 Ledgers",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      desc: "6 Accounting T-Accounts & Leaderboards",
      adminOnly: false,
    },
    {
      id: "reconcile",
      label: "Reconciliation",
      shortLabel: "Reconcile",
      shengLabel: "Reconcile",
      icon: RefreshCw,
      badge: leakageAlertCount > 0 ? "Alert" : null,
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      desc: "Cash-to-stock audit",
      adminOnly: false,
    },
    {
      id: "analytics",
      label: "Analytics",
      shortLabel: "Analytics",
      shengLabel: "Analytics",
      icon: Compass,
      badge: "16 Charts",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      desc: "Charts & AI forecasts",
      adminOnly: false,
    },
    {
      id: "store_settings",
      label: "Store Setup",
      shortLabel: "Setup",
      shengLabel: "Setup",
      icon: Store,
      badge: "SaaS",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      desc: "Staff, Paybill & branches",
      adminOnly: false,
    },
    {
      id: "saas_admin",
      label: "SaaS Console",
      shortLabel: "SaaS Admin",
      shengLabel: "SaaS Admin",
      icon: Crown,
      badge: "Admin",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      desc: "Manage tiers & stores",
      adminOnly: false,
    },
    {
      id: "sales",
      label: "Sales Ledger",
      shortLabel: "Sales",
      shengLabel: "Sales",
      icon: TrendingUp,
      badge: "Auto",
      desc: "Velocity journal",
      adminOnly: false,
    },
    {
      id: "money_out",
      label: "Expenses",
      shortLabel: "Expenses",
      shengLabel: "Expenses",
      icon: ArrowUpRight,
      badge: null,
      desc: "Purchases & shop expenses",
      adminOnly: false,
    },
    {
      id: "restock",
      label: "Restock",
      shortLabel: "Restock",
      shengLabel: "Restock",
      icon: RefreshCw,
      badge: "Fast",
      desc: "Inbound inventory batches",
      adminOnly: false,
    },
    {
      id: "ingestion",
      label: "Scan Receipts",
      shortLabel: "Receipts",
      shengLabel: "Receipts",
      icon: Receipt,
      badge: "OCR",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      desc: "Multi-bill OCR ingestion",
      adminOnly: false,
    },
    {
      id: "cashflow",
      label: "Cashflow",
      shortLabel: "Cashflow",
      shengLabel: "Cashflow",
      icon: DollarSign,
      badge: null,
      desc: "P&L & payment channels",
      adminOnly: false,
    },
    {
      id: "schema",
      label: "Database",
      shortLabel: "SQL",
      shengLabel: "SQL",
      icon: Database,
      badge: "SQL",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      desc: "PostgreSQL & architecture",
      adminOnly: true,
    },
  ];

  // Visible items filtered according to user's customization and admin permissions
  const visibleNavItems = rawNavItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return visibleModuleIds.includes(item.id);
  });

  // Hidden modules that the user can quickly make appear
  const hiddenNavItems = rawNavItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return !visibleModuleIds.includes(item.id);
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="yubiflo-sidebar"
        className="hidden md:flex flex-col w-64 bg-[#0e131f] border-r border-slate-800/80 p-3 shrink-0 select-none"
      >
        {/* Header with quick customization CTA */}
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <span>Core Modules</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 font-mono">
              {visibleNavItems.length}
            </span>
          </div>

          <button
            id="customize-modules-btn"
            type="button"
            onClick={onOpenModuleCustomizer}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400 font-semibold px-2 py-0.5 rounded-md hover:bg-slate-800/80 transition-colors"
            title="Customize Sidebar Modules"
          >
            <Sliders className="w-3 h-3 text-emerald-400" />
            <span>Customize</span>
          </button>
        </div>

        {/* Active Visible Modules List */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-0.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                  isActive
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400"}`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-tight truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1 ${
                      item.badgeColor || "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Appear/Disappear Hidden Drawer Accordion */}
          {hiddenNavItems.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHiddenDrawer(!showHiddenDrawer)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 transition-colors border border-dashed border-slate-800"
              >
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{hiddenNavItems.length} more modules hidden</span>
                </span>
                {showHiddenDrawer ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {showHiddenDrawer && (
                <div className="mt-1 space-y-1 pl-1 py-1 border-l-2 border-slate-800">
                  {hiddenNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded-md bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left truncate"
                        >
                          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                        <button
                          type="button"
                          onClick={onOpenModuleCustomizer}
                          className="p-1 text-slate-500 hover:text-emerald-400"
                          title="Make visible in main sidebar"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Admin Protection & Role Status Banner */}
        <div className="mt-auto pt-2 space-y-2">
          {/* Subscription Tier Banner */}
          {sub && (
            <div
              onClick={onOpenSubscriptionModal}
              className="p-2.5 rounded-xl bg-[#111827] border border-slate-800 hover:border-emerald-500/30 cursor-pointer transition-all flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-[11px] text-white truncate flex items-center gap-1">
                    <span>{sub.tierName}</span>
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono">
                    {sub.billingCycle} • Active
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                Upgrade
              </span>
            </div>
          )}

          <div
            onClick={onOpenAdminAuth}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
              isAdmin
                ? "bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300"
                : "bg-[#111827] border-slate-800 hover:border-slate-750 text-slate-400"
            }`}
            title="Click to switch Admin status & unlock Data Schema"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`p-1 rounded-md ${
                  isAdmin ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                }`}
              >
                {isAdmin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </div>
              <div className="truncate">
                <div className="font-bold text-[11px] text-slate-200">
                  {isAdmin ? "Admin Mode Active" : "Retailer Mode"}
                </div>
                <div className="text-[9px] text-slate-500">
                  {isAdmin ? "Data Schema Unlocked" : "Schema Locked (PIN: 2031)"}
                </div>
              </div>
            </div>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isAdmin ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
              }`}
            >
              {isAdmin ? "ADMIN" : "UNLOCK"}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenModuleCustomizer}
            className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3 h-3 text-emerald-400" />
            <span>Customize Modules</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar - Shows top 5 customized visible modules */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e131f]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1 flex items-center justify-around"
      >
        {visibleNavItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                isActive ? "text-emerald-400" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 font-medium truncate max-w-[60px]">
                {item.shortLabel || item.label}
              </span>
            </button>
          );
        })}

        {/* Mobile Customize Button */}
        <button
          type="button"
          onClick={onOpenModuleCustomizer}
          className="flex flex-col items-center py-1 px-2 rounded-lg text-slate-400 hover:text-emerald-400"
          title="Customize Modules"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] mt-0.5 font-medium">Customize</span>
        </button>
      </nav>
    </>
  );
};

