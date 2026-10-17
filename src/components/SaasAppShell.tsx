import React, { useState, useEffect } from "react";
import { 
  Rocket, LayoutDashboard, TrendingUp, ShoppingBag, Layers, 
  Sun, Mic, Users, BookOpen, BarChart2, ChevronDown, HelpCircle, 
  LogOut, Settings, Building2, Menu, X, ArrowRight, Shield, 
  CheckCircle2, AlertCircle, Phone, Lock, Globe, Check, Sparkles,
  Plus, Play, FileText, Bookmark, Truck, ShieldCheck, Wallet
} from "lucide-react";
import { UserProfile, signOut, signOutAllDevices } from "../services/authSessionService";
import VideoFactorModal from "./VideoFactorModal";
import QuickCreateModal from "./QuickCreateModal";

export interface SaasNavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SaasAppShellProps {
  user?: UserProfile | null;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoIsDocked, setVideoIsDocked] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Sync browser tab title
  useEffect(() => {
    if (isDemo) {
      document.title = "Demo · YuBiFLo";
    } else {
      document.title = "YuBiFLo — Your Business Is A Flower";
    }
  }, [isDemo]);

  // Exact MSME modules from the workspace including Suppliers & Owner Expenses, rendered with Wave-style clean iconography:
  const sidebarItems: SaasNavItem[] = [
    { id: "launchpad", name: "Launchpad", icon: <Rocket size={17} /> },
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { id: "supply_sales", name: "Sales & Payments", icon: <TrendingUp size={17} /> },
    { id: "purchases", name: "Purchases", icon: <ShoppingBag size={17} /> },
    { id: "suppliers", name: "Suppliers", icon: <Truck size={17} /> },
    { id: "owner_expenses", name: "Owner Expenses", icon: <Wallet size={17} /> },
    { id: "stock_vault", name: "Stock Vault", icon: <Layers size={17} /> },
    { id: "dawn_lock", name: "Dawn Lock", icon: <Sun size={17} /> },
    { id: "voice_ledger", name: "Voice Ledger", icon: <Mic size={17} /> },
    { id: "customers", name: "Customers", icon: <Users size={17} /> },
    { id: "customer_deni", name: "Customer Deni", icon: <BookOpen size={17} /> },
    { id: "three_fold_ledgers", name: "3-Fold Ledgers", icon: <Bookmark size={17} /> },
    { id: "analytics", name: "Business Analytics", icon: <BarChart2 size={17} /> }
  ];

  const currentWorkspaceName = user?.businessName || "Musa General Retailers";

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
            {/* WAVE-STYLE ICON MARK */}
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 14C5.5 9 8.5 9 10 14C11.5 19 14.5 19 16 14C17.5 9 20.5 9 22 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-serif text-lg font-bold text-slate-900 tracking-tight">
              YuBiFLo
            </span>
          </button>
        </div>

        {/* RIGHT: DATA VAULT + DOCUMENT ICON + HELP (?) + BUSINESS NAME IN PILL AT TOP RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* ZERO-DATA-LOSS DATA VAULT BUTTON */}
          {onOpenDataVault && (
            <button
              onClick={onOpenDataVault}
              className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 transition cursor-pointer text-xs font-bold shadow-2xs"
              title="Zero-Data-Loss Protection: Auto-Saved &amp; Cloud Mirrored"
            >
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">Data Safe</span>
            </button>
          )}

          {/* DOCUMENT / LEDGER ICON BUTTON */}
          <button
            onClick={() => onNavigateTab("three_fold_ledgers")}
            className="w-8 h-8 rounded-lg bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            title="3-Fold Ledgers &amp; Accounts"
          >
            <FileText size={16} />
          </button>

          {/* HELP ICON BUTTON */}
          <button
            onClick={() => setHelpModalOpen(true)}
            className="w-8 h-8 rounded-lg bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            title="Help &amp; Documentation"
          >
            <HelpCircle size={16} />
          </button>

          {/* BUSINESS NAME PILL DROPDOWN AT FAR RIGHT TOP CORNER */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="bg-[#EBF3FC] hover:bg-[#E2EDFA] border border-[#CBD5E1] rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition text-xs font-semibold text-slate-900 shadow-2xs"
            >
              <Building2 size={13} className="text-blue-600 shrink-0" />
              <span className="max-w-[130px] sm:max-w-[180px] truncate font-bold text-slate-900">
                {currentWorkspaceName}
              </span>

              <ChevronDown size={14} className={`text-slate-600 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* DROPDOWN MENU */}
            {userDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95"
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                {/* STATUS HEADER */}
                <div className="px-3 py-2 border-b border-slate-100">
                  {isDemo ? (
                    <div>
                      <span className="text-[10px] text-amber-600 uppercase font-bold block">Active Workspace:</span>
                      <strong className="text-slate-900 text-xs block truncate">Duka Space (Demo)</strong>
                      <span className="text-[10px] text-slate-500 block">Sample data only &bull; 24h reset</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Signed In As:</span>
                      <strong className="text-slate-900 text-xs block truncate">{user?.name || "Business Owner"}</strong>
                      <span className="text-[10px] text-blue-600 block truncate">{user?.phone || "Private Workspace"}</span>
                    </div>
                  )}
                </div>

                {/* WORKSPACE SWITCHER SECTION (My business / Duka Space, demo) */}
                <div className="py-1 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-3 block">
                    Switch Workspace:
                  </span>

                  {/* OPTION 1: REAL WORKSPACE */}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onSwitchWorkspace) {
                        onSwitchWorkspace("real");
                      }
                    }}
                    className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between transition cursor-pointer text-xs ${
                      !isDemo ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={13} className="text-blue-600 shrink-0" />
                      <span className="truncate">{user?.businessName ? `${user.businessName} (My business)` : "My business"}</span>
                    </div>
                    {!isDemo && <Check size={13} className="text-blue-600 shrink-0" />}
                  </button>

                  {/* OPTION 2: DUKA SPACE DEMO */}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onSwitchWorkspace) {
                        onSwitchWorkspace("demo");
                      }
                    }}
                    className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between transition cursor-pointer text-xs ${
                      isDemo ? "bg-amber-50 text-amber-800 font-bold" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles size={13} className="text-amber-500 shrink-0" />
                      <span className="truncate">Duka Space (demo)</span>
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
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigateTab(item.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? "bg-[#EBF3FC] text-[#1A56DB] font-semibold"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <span className={isActive ? "text-[#1A56DB]" : "text-slate-500"}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </button>
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
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigateTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 ${
                      activeTab === item.id ? "bg-[#EBF3FC] text-[#1A56DB] font-semibold" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className={activeTab === item.id ? "text-[#1A56DB]" : "text-slate-500"}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </button>
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

    </div>
  );
}
