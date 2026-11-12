import React, { useState, useEffect } from "react";
import { 
  Rocket, LayoutDashboard, TrendingUp, ShoppingBag, Layers, 
  Sun, Mic, Users, BookOpen, BarChart2, ChevronDown, HelpCircle, 
  LogOut, Settings, Building2, Menu, X, ArrowRight, Shield, 
  CheckCircle2, AlertCircle, Phone, Lock, Globe, Check, Sparkles,
  Plus, Play, FileText, Bookmark, Truck, ShieldCheck, Wallet, Camera
} from "lucide-react";
import { UserProfile, signOut, signOutAllDevices } from "../services/authSessionService";
import { UserAccount } from "../services/accountManagementService";
import { YuBiFloMark } from "./YuBiFloLogo";
import VideoFactorModal from "./VideoFactorModal";
import QuickCreateModal from "./QuickCreateModal";

export interface SaasNavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  badge?: string;
  children?: Array<{
    id: string;
    name: string;
  }>;
}

interface SaasAppShellProps {
  user?: UserProfile | null;
  accounts?: UserAccount[];
  activeAccountId?: string;
  onSwitchAccount?: (accountId: string) => void;
  onCreateAccount?: (businessName: string, businessType: string) => void;
  activeTab: string;
  onNavigateTab: (tabId: string) => void;
  onSignOut: () => void;
  onSignOutAllDevices: () => void;
  onOpenSettings: () => void;
  onSwitchWorkspace?: (target: "real" | "demo") => void;
  isDemo?: boolean;
  onStartRealWorkspace?: () => void;
  onExitDemo?: () => void;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
  onOpenQuickDeni?: () => void;
  onResetToSkeleton?: () => void;
  onOpenDataVault?: () => void;
  children: React.ReactNode;
}

export default function SaasAppShell({
  user,
  accounts = [],
  activeAccountId,
  onSwitchAccount,
  onCreateAccount,
  activeTab,
  onNavigateTab,
  onSignOut,
  onSignOutAllDevices,
  onOpenSettings,
  onSwitchWorkspace,
  isDemo = false,
  onStartRealWorkspace,
  onExitDemo,
  onOpenQuickSale,
  onOpenQuickPurchase,
  onOpenQuickDeni,
  onResetToSkeleton,
  onOpenDataVault,
  children
}: SaasAppShellProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState("");
  const [newBizType, setNewBizType] = useState("Retail / Duka");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoIsDocked, setVideoIsDocked] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Sync browser tab title
  useEffect(() => {
    if (isDemo) {
      document.title = "Demo · YuBiFlo Web Platform";
    } else {
      document.title = "YuBiFlo Web Platform · Retail Intelligence";
    }
  }, [isDemo]);

  // Exact MSME modules from the workspace including Suppliers & Expenses -> Owner Expenses, rendered with Wave-style clean iconography:
  const sidebarItems: SaasNavItem[] = [
    { id: "launchpad", name: "Launchpad", icon: <Rocket size={17} /> },
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { id: "supply_sales", name: "Sales & Payments", icon: <TrendingUp size={17} /> },
    {
      id: "purchases",
      name: "Purchases",
      icon: <ShoppingBag size={17} />,
      children: [
        { id: "purchases_cargo", name: "Inbound Cargo" },
        { id: "receipt_ocr", name: "Upload Receipts" },
        { id: "selling_prices", name: "Selling Prices & Margins" }
      ]
    },
    { id: "suppliers", name: "Suppliers", icon: <Truck size={17} /> },
    {
      id: "expenses",
      name: "Expenses",
      icon: <Wallet size={17} />,
      children: [
        { id: "owner_expenses", name: "Owner Expenses" }
      ]
    },
    { id: "stock_vault", name: "Stock Vault", icon: <Layers size={17} /> },
    { id: "dawn_lock", name: "Dawn Lock", icon: <Sun size={17} /> },
    { id: "voice_ledger", name: "Voice Ledger", icon: <Mic size={17} /> },
    { id: "customers", name: "Customers", icon: <Users size={17} /> },
    { id: "customer_deni", name: "Customer Deni", icon: <BookOpen size={17} /> },
    { id: "three_fold_ledgers", name: "3-Fold Ledgers", icon: <Bookmark size={17} /> },
    { id: "analytics", name: "Business Analytics", icon: <BarChart2 size={17} /> }
  ];

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const currentWorkspaceName = activeAccount?.businessName || user?.businessName || "Alacio Mini shop";
  const currentBusinessType = activeAccount?.businessType || user?.businessType || "Retail / Duka";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900 relative">
      
      {/* ========================================================================= */}
      {/* 1. TOP BAR (WHITE, SLATE BORDER, BUSINESS NAME AT TOP RIGHT CORNER)        */}
      {/* ========================================================================= */}
      <header className="h-14 bg-white border-b border-[#E5E9EE] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        
        {/* LEFT: LOGO & MOBILE HAMBURGER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-600 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            onClick={() => onNavigateTab("dashboard")}
            className="flex items-center gap-2.5 text-slate-900 font-bold tracking-tight cursor-pointer group"
          >
            {/* YUBIFLO FLORAL CASHFLOW MARK */}
            <div className="group-hover:scale-105 transition-transform">
              <YuBiFloMark size={32} />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif text-lg font-bold text-slate-900 tracking-tight leading-none">
                YuBiFLo
              </span>
              <span className="text-[9px] font-semibold text-amber-700 tracking-wider uppercase font-sans mt-0.5 hidden sm:inline">
                Your Business Is A Flower
              </span>
            </div>
          </button>
        </div>

        {/* RIGHT: DATA VAULT + DOCUMENT ICON + HELP (?) + BUSINESS SWITCHER PILL AT TOP RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* ZERO-DATA-LOSS DATA VAULT BUTTON */}
          {onOpenDataVault && (
            <button
              onClick={onOpenDataVault}
              className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 transition cursor-pointer text-xs font-bold shadow-2xs"
              title="Zero-Data-Loss Protection: Auto-Saved & Cloud Mirrored"
            >
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">Data Safe</span>
            </button>
          )}

          {/* DOCUMENT / LEDGER ICON BUTTON */}
          <button
            onClick={() => onNavigateTab("three_fold_ledgers")}
            className="w-8 h-8 rounded-lg bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            title="3-Fold Ledgers & Accounts"
          >
            <FileText size={16} />
          </button>

          {/* HELP ICON BUTTON */}
          <button
            onClick={() => setHelpModalOpen(true)}
            className="w-8 h-8 rounded-lg bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            title="Help & Documentation"
          >
            <HelpCircle size={16} />
          </button>

          {/* MULTI-ACCOUNT BUSINESS SWITCHER PILL AT FAR RIGHT TOP CORNER */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="bg-[#EBF3FC] hover:bg-[#E2EDFA] border border-[#CBD5E1] rounded-lg px-2.5 sm:px-3 py-1.5 flex items-center gap-2 cursor-pointer transition text-xs font-semibold text-slate-900 shadow-2xs"
              title="Switch between your business accounts opened with this Gmail"
            >
              <Building2 size={13} className="text-blue-600 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="max-w-[110px] sm:max-w-[170px] truncate font-bold text-slate-900 leading-tight">
                  {currentWorkspaceName}
                </span>
                <span className="text-[9px] text-blue-700 font-medium truncate hidden sm:inline">
                  {activeAccount?.role === "MANAGER" || currentWorkspaceName.toLowerCase().includes("alacio")
                    ? "Client (Rose) • Managed by Moses"
                    : `${currentBusinessType} • Owned by Moses`}
                </span>
              </div>

              <ChevronDown size={14} className={`text-slate-600 transition-transform shrink-0 ${userDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* DROPDOWN MENU */}
            {userDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 space-y-2 z-50 text-xs font-sans animate-in fade-in zoom-in-95"
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                {/* GMAIL ACCOUNT BADGE */}
                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Connected Gmail</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                    </span>
                  </div>
                  <strong className="text-slate-900 text-xs block truncate mt-0.5">
                    {user?.email || "mosesmukangai75@gmail.com"}
                  </strong>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                    {user?.name ? `${user.name} (Manager & Owner)` : "Manager & Owner"}
                  </span>
                </div>

                {/* MULTI-ACCOUNT SWITCHER: LIST OF ALL BUSINESSES OPENED UNDER THIS GMAIL */}
                {!isDemo && accounts && accounts.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        My Businesses ({accounts.length})
                      </span>
                      <span className="text-[10px] text-blue-600 font-medium">1-Click Switch</span>
                    </div>

                    <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
                      {accounts.map((acc) => {
                        const isActive = (activeAccountId ? acc.id === activeAccountId : acc.isPrimary) || (!activeAccountId && acc.id === "acc_alacio_mini");
                        const isClient = acc.role === "MANAGER" || acc.businessName.toLowerCase().includes("alacio");
                        return (
                          <button
                            key={acc.id}
                            onClick={() => {
                              setUserDropdownOpen(false);
                              if (onSwitchAccount) {
                                onSwitchAccount(acc.id);
                              }
                            }}
                            className={`w-full px-2.5 py-2 text-left rounded-xl flex items-center justify-between transition cursor-pointer border ${
                              isActive 
                                ? "bg-blue-50/80 border-blue-200 text-blue-950 font-bold shadow-2xs" 
                                : "hover:bg-slate-50 border-transparent text-slate-700 hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                              }`}>
                                <Building2 size={13} />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-xs font-semibold leading-tight">{acc.businessName}</div>
                                <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">
                                  {isClient 
                                    ? `Client (Owned by Rose) • Managed by Moses` 
                                    : `${acc.businessType} • Owned by Moses`}
                                </div>
                              </div>
                            </div>

                            {isActive && (
                              <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                                <Check size={12} />
                                <span className="text-[10px]">Active</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* ADD ANOTHER BUSINESS BUTTON */}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setIsAddAccountModalOpen(true);
                      }}
                      className="w-full mt-1 px-3 py-1.5 text-left rounded-xl hover:bg-blue-50 text-blue-700 flex items-center gap-2 transition cursor-pointer text-xs font-semibold border border-dashed border-blue-200 hover:border-blue-400"
                    >
                      <Plus size={14} className="text-blue-600 shrink-0" />
                      <span>+ Add Another Business / Shop</span>
                    </button>
                  </div>
                )}

                {/* WORKSPACE SWITCHER SECTION (Real vs Demo) */}
                <div className="border-t border-slate-100 pt-1.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-2 block">
                    Exploration:
                  </span>

                  {/* DUKA SPACE DEMO OPTION */}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onSwitchWorkspace) {
                        onSwitchWorkspace(isDemo ? "real" : "demo");
                      }
                    }}
                    className={`w-full px-2.5 py-2 text-left rounded-xl flex items-center justify-between transition cursor-pointer text-xs ${
                      isDemo ? "bg-amber-50 text-amber-800 font-bold border border-amber-200" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles size={13} className="text-amber-500 shrink-0" />
                      <span className="truncate">{isDemo ? "Return to My Real Accounts" : "Try Duka Space (Interactive Demo)"}</span>
                    </div>
                    {isDemo && <Check size={13} className="text-amber-600 shrink-0" />}
                  </button>
                </div>

                {/* ADDITIONAL ACTIONS */}
                <div className="border-t border-slate-100 pt-1 space-y-0.5">
                  {onOpenDataVault && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDataVault();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition cursor-pointer text-xs font-semibold"
                    >
                      <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      <span>Data Vault &amp; Backup</span>
                    </button>
                  )}

                  {!isDemo && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Settings size={14} className="text-slate-500" />
                      <span>Settings &amp; Profile</span>
                    </button>
                  )}

                  {isDemo ? (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onExitDemo) onExitDemo();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-amber-50 text-amber-700 flex items-center gap-2 transition cursor-pointer font-bold"
                    >
                      <LogOut size={14} className="text-amber-600" />
                      <span>Exit demo</span>
                    </button>
                  ) : (
                    <>
                      {onResetToSkeleton && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (window.confirm("Reset workspace to a clean skeleton ready for your own goods?")) {
                              onResetToSkeleton();
                            }
                          }}
                          className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition cursor-pointer text-xs"
                          title="Clear sample items and start with an empty skeleton for your goods"
                        >
                          <Layers size={14} className="text-blue-600" />
                          <span>Reset to Clean Skeleton</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut size={14} className="text-red-500" />
                        <span>Sign out</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSignOutAllDevices();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2 transition cursor-pointer text-[11px]"
                      >
                        <Shield size={14} className="text-red-500" />
                        <span>Sign out of all devices</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* SLIM BANNER UNDER TOP BAR ON EVERY PAGE WHEN IN DEMO                      */}
      {/* ========================================================================= */}

      {/* ========================================================================= */}
      {/* 2. BODY: LEFT SIDEBAR + MAIN CONTENT AREA                                 */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR (WHITE, WAVE-STYLE, EXACT SAME MSME MODULES) */}
        <aside className="w-60 bg-white border-r border-[#E5E9EE] p-3 sm:p-4 hidden md:flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-3">
            
            {/* "+ Create new" BLUE PILL BUTTON (EXACT SHAPE FROM SCREENSHOT) */}
            <button
              onClick={() => setQuickCreateOpen(true)}
              className="w-full bg-[#1A56DB] hover:bg-[#1545B3] text-white text-xs font-semibold px-4 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center font-bold">
                <Plus size={13} />
              </div>
              <span>Create new</span>
            </button>

            {/* MSME WORKSPACE MODULES NAVIGATION */}
            <div className="px-3 pt-1 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Modules
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                12 ACTIVE
              </span>
            </div>

            <nav className="space-y-0.5">
              {sidebarItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isChildActive = hasChildren && item.children!.some((c) => activeTab === c.id);
                const isActive = activeTab === item.id || isChildActive;

                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      onClick={() => onNavigateTab(item.id)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                        activeTab === item.id
                          ? "bg-[#EBF3FC] text-[#1A56DB] font-semibold"
                          : isChildActive
                            ? "bg-slate-50 text-[#1A56DB] font-semibold"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={isActive ? "text-[#1A56DB]" : "text-slate-500"}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.name}</span>
                      </div>
                      {hasChildren && (
                        <ChevronDown size={13} className="text-slate-400 shrink-0" />
                      )}
                    </button>

                    {hasChildren && (
                      <div className="pl-7 pr-1 space-y-0.5">
                        {item.children!.map((child) => {
                          const childSelected = activeTab === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => onNavigateTab(child.id)}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center gap-2 cursor-pointer border-l-2 ${
                                childSelected
                                  ? "bg-[#EBF3FC] text-[#1A56DB] font-bold border-[#1A56DB]"
                                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border-slate-200"
                              }`}
                            >
                              <span className="truncate">{child.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* BOTTOM-LEFT VIDEO FACTOR: CIRCULAR DARK PLAY BUTTON (AS IN SCREENSHOT) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVideoModalOpen(true)}
                className="w-10 h-10 rounded-full bg-[#374151] hover:bg-[#1F2937] text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer group"
                title="Watch workspace video walkthrough (Video Factor)"
                aria-label="Play workspace walkthrough video"
              >
                <Play size={14} className="fill-white ml-0.5 group-hover:scale-110 transition-transform" />
              </button>
              <div className="text-[11px] leading-tight">
                <span className="font-semibold text-slate-800 block">Guide Tour</span>
                <span className="text-[10px] text-slate-400">Video Walkthrough</span>
              </div>
            </div>

            {isDemo && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                DEMO
              </span>
            )}
          </div>
        </aside>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 md:hidden flex flex-col justify-end">
            <div className="bg-white border-t border-slate-200 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-serif font-bold text-slate-900 text-sm">
                  Workspace Modules
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-800 p-1">
                  <X size={18} />
                </button>
              </div>

              {/* MOBILE "+ Create new" BUTTON */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setQuickCreateOpen(true);
                }}
                className="w-full bg-[#1A56DB] text-white text-xs font-semibold py-2.5 rounded-full flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus size={14} />
                <span>Create new</span>
              </button>

              <div className="px-2 pt-1 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Modules
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  12 Active
                </span>
              </div>

              <nav className="grid grid-cols-1 gap-1">
                {sidebarItems.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => {
                        onNavigateTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 ${
                        activeTab === item.id ? "bg-[#EBF3FC] text-[#1A56DB] font-semibold" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className={activeTab === item.id ? "text-[#1A56DB]" : "text-slate-500"}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </button>
                    {item.children && item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          onNavigateTab(child.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full ml-6 p-2 rounded-lg text-left text-xs font-medium flex items-center gap-2 border-l-2 ${
                          activeTab === child.id
                            ? "bg-[#EBF3FC] text-[#1A56DB] font-bold border-[#1A56DB]"
                            : "text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <span>{child.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </nav>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setVideoModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-[#374151] text-white flex items-center justify-center">
                    <Play size={11} className="fill-white ml-0.5" />
                  </div>
                  <span>Watch Video Tour</span>
                </button>

                {isDemo && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onExitDemo) onExitDemo();
                    }}
                    className="text-xs text-amber-700 font-bold"
                  >
                    Exit demo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

      {/* QUICK CREATE MODAL */}
      <QuickCreateModal
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onNavigateTab={onNavigateTab}
        onOpenQuickSale={onOpenQuickSale}
        onOpenQuickPurchase={onOpenQuickPurchase}
        onOpenQuickDeni={onOpenQuickDeni}
      />

      {/* VIDEO FACTOR MODAL & DOCKED MINI PLAYER */}
      <VideoFactorModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        isDocked={videoIsDocked}
        onToggleDock={() => setVideoIsDocked(!videoIsDocked)}
      />

      {/* CREATE NEW BUSINESS ACCOUNT MODAL (UNDER SAME GMAIL) */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add New Business / Shop</h3>
                  <p className="text-[11px] text-slate-500">Connected to {user?.email || "your Gmail"}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newBizName.trim()) return;
                if (onCreateAccount) {
                  onCreateAccount(newBizName.trim(), newBizType);
                }
                setNewBizName("");
                setIsAddAccountModalOpen(false);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Business / Shop Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alacio Wholesale Depot, Branch 2 Supermarket"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Category / Business Model
                </label>
                <select
                  value={newBizType}
                  onChange={(e) => setNewBizType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs bg-white"
                >
                  <option value="Retail / Duka">Retail / Duka (General FMCG)</option>
                  <option value="Wholesale & Cargo Depot">Wholesale & Cargo Depot (Bulk Supplies)</option>
                  <option value="Hardware & Building Supplies">Hardware & Building Supplies</option>
                  <option value="Pharmacy & Chemist">Pharmacy & Chemist</option>
                  <option value="Agrovet & Farm Inputs">Agrovet & Farm Inputs</option>
                  <option value="Electronics & Phone Accessories">Electronics & Accessories</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-blue-600" />
                  Independent Workspace Isolation
                </div>
                <p className="text-slate-600">
                  This new business will have its own separate inventory, sales batches, 3-fold ledgers, and cash balances, completely isolated while remaining linked to your single Gmail login.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newBizName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Create Business Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
