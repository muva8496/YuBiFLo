import React, { useState, useEffect } from "react";
import { 
  Compass, LayoutDashboard, TrendingUp, ShoppingBag, Layers, 
  Sun, Mic, Users, BookOpen, BarChart2, ChevronDown, HelpCircle, 
  LogOut, Settings, Building2, Menu, X, ArrowRight, Shield, 
  CheckCircle2, AlertCircle, Phone, Lock, Globe, Check, Sparkles
} from "lucide-react";
import { UserProfile, signOut, signOutAllDevices } from "../services/authSessionService";

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
  children
}: SaasAppShellProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Sync browser tab title
  useEffect(() => {
    if (isDemo) {
      document.title = "Demo · YuBiFLo";
    } else {
      document.title = "YuBiFLo — Your Business Is A Flower";
    }
  }, [isDemo]);

  // Exact 11 sidebar items in the exact order requested by user:
  // 1 Launchpad, 2 Dashboard, 3 Supply-Driven Sales, 4 Purchases, 5 Stock Vault & Suppliers,
  // 6 Dawn Lock, 7 The Voice Ledger, 8 Customers, 9 Customer Deni, 10 3-Fold Ledgers, 11 Business Analytics
  const sidebarItems: SaasNavItem[] = [
    { id: "launchpad", name: "Launchpad", icon: <Compass size={17} />, badge: "Setup" },
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { id: "supply_sales", name: "Supply-Driven Sales", icon: <TrendingUp size={17} />, badge: "Engine" },
    { id: "purchases", name: "Purchases", icon: <ShoppingBag size={17} /> },
    { id: "stock_vault", name: "Stock Vault & Suppliers", icon: <Layers size={17} /> },
    { id: "dawn_lock", name: "Dawn Lock", icon: <Sun size={17} />, badge: "05:57 AM" },
    { id: "voice_ledger", name: "The Voice Ledger", icon: <Mic size={17} />, badge: "VCR" },
    { id: "customers", name: "Customers", icon: <Users size={17} /> },
    { id: "customer_deni", name: "Customer Deni", icon: <BookOpen size={17} />, badge: "Khata" },
    { id: "three_fold_ledgers", name: "3-Fold Ledgers", icon: <BookOpen size={17} />, badge: "P / R / N" },
    { id: "analytics", name: "Business Analytics", icon: <BarChart2 size={17} />, badge: "36 Tools" }
  ];

  const currentWorkspaceName = isDemo ? "Duka Space" : (user?.businessName || "My Business");

  return (
    <div className="min-h-screen bg-[#0B1420] text-[#E2ECF3] font-sans flex flex-col selection:bg-[#2D5577] selection:text-white relative">
      
      {/* FAINT REPEATING "SAMPLE" WATERMARK ON PRINT & EXPORT */}
      {isDemo && (
        <div 
          className="demo-sample-watermark pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-[0.035] select-none flex flex-wrap gap-24 items-center justify-center p-8 print:opacity-[0.14] print:flex"
          aria-hidden="true"
        >
          {Array.from({ length: 36 }).map((_, idx) => (
            <span key={idx} className="text-6xl font-black text-amber-400 -rotate-45 font-mono tracking-widest">
              SAMPLE
            </span>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP BAR                                                                */}
      {/* ========================================================================= */}
      <header className="h-14 bg-[#0E1A29]/95 border-b border-[#182C40] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        
        {/* LEFT: YUBIFLO LOGO & MOBILE HAMBURGER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            onClick={() => onNavigateTab("dashboard")}
            className="flex items-center gap-2.5 text-white font-black tracking-wide cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-black border border-zinc-700 flex items-center justify-center font-bold font-mono text-sm shadow-md group-hover:scale-105 transition-transform">
              Y
            </div>
            <div className="text-left">
              <span className="font-serif tracking-tight text-base font-bold text-white block leading-none">
                YuBiFLo
              </span>
              <span className="text-[9px] font-mono text-slate-400 block leading-tight">
                Kenyan MSME Ecosystem
              </span>
            </div>
          </button>
        </div>

        {/* RIGHT: BUSINESS NAME + PLAN BADGE / AMBER DEMO BADGE AS DROPDOWN + HELP ICON */}
        <div className="flex items-center gap-3 relative">
          
          {/* HELP ICON */}
          <button
            onClick={() => setHelpModalOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#132337] transition cursor-pointer"
            title="YuBiFLo Guide & Support"
          >
            <HelpCircle size={18} />
          </button>

          {/* BUSINESS / WORKSPACE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="px-3 py-1.5 rounded-xl border border-[#182C40] bg-[#09121D] hover:bg-[#132337] flex items-center gap-2 cursor-pointer transition text-xs font-mono shadow-xs text-white"
            >
              <Building2 size={14} className="text-cyan-400 shrink-0" />
              <span className="font-bold text-white max-w-[130px] sm:max-w-[180px] truncate">
                {currentWorkspaceName}
              </span>
              
              {/* PLAN BADGE OR AMBER DEMO BADGE */}
              {isDemo ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEMO
                </span>
              ) : (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                  user?.plan === "Pro" 
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}>
                  {user?.plan || "Free"}
                </span>
              )}

              <ChevronDown size={13} className={`text-slate-400 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* DROPDOWN MENU */}
            {userDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-64 bg-[#0E1A29] border border-[#182C40] rounded-2xl shadow-2xl p-2 space-y-1.5 z-50 text-xs font-mono animate-in fade-in zoom-in-95"
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                {/* STATUS HEADER */}
                <div className="px-3 py-2 border-b border-[#182C40]/80">
                  {isDemo ? (
                    <div>
                      <span className="text-[10px] text-amber-400 uppercase font-bold block">Active Workspace:</span>
                      <strong className="text-white text-xs block truncate">Duka Space (Demo)</strong>
                      <span className="text-[10px] text-slate-400 block">Sample data only &bull; 24h reset</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Signed In As:</span>
                      <strong className="text-white text-xs block truncate">{user?.name || "Business Owner"}</strong>
                      <span className="text-[10px] text-cyan-400 block truncate">{user?.phone || "Private Workspace"}</span>
                    </div>
                  )}
                </div>

                {/* WORKSPACE SWITCHER SECTION (My business / Duka Space, demo) */}
                <div className="py-1 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase px-3 block">
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
                      !isDemo ? "bg-[#132337] text-white font-bold" : "text-slate-300 hover:bg-[#132337] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={13} className="text-cyan-400 shrink-0" />
                      <span className="truncate">{user?.businessName ? `${user.businessName} (My business)` : "My business"}</span>
                    </div>
                    {!isDemo && <Check size={13} className="text-emerald-400 shrink-0" />}
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
                      isDemo ? "bg-amber-500/15 text-amber-200 font-bold border border-amber-500/25" : "text-slate-300 hover:bg-[#132337] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles size={13} className="text-amber-400 shrink-0" />
                      <span className="truncate">Duka Space (demo)</span>
                    </div>
                    {isDemo && <Check size={13} className="text-amber-400 shrink-0" />}
                  </button>
                </div>

                {/* ADDITIONAL ACTIONS */}
                <div className="border-t border-[#182C40]/80 pt-1 space-y-0.5">
                  {!isDemo && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#132337] text-slate-300 hover:text-white flex items-center gap-2 transition cursor-pointer"
                    >
                      <Settings size={14} className="text-slate-400" />
                      <span>Settings &amp; Profile</span>
                    </button>
                  )}

                  {isDemo ? (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onExitDemo) onExitDemo();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-amber-500/10 text-amber-300 flex items-center gap-2 transition cursor-pointer font-bold"
                    >
                      <LogOut size={14} className="text-amber-400" />
                      <span>Exit demo</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-amber-500/10 text-amber-300 flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut size={14} className="text-amber-400" />
                        <span>Sign out</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSignOutAllDevices();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-red-500/10 text-red-300 flex items-center gap-2 transition cursor-pointer text-[11px]"
                      >
                        <Shield size={14} className="text-red-400" />
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
      {isDemo && (
        <div className="bg-[#0D1926] border-b border-amber-500/40 px-4 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 z-30 shadow-inner">
          <div className="flex items-center gap-2 text-amber-200 text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="font-medium">
              You're exploring a demo duka. All numbers are sample data, not real. Start your own to see your real numbers.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (onStartRealWorkspace) onStartRealWorkspace();
              }}
              className="px-3.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg transition shadow-xs cursor-pointer font-mono"
            >
              {user ? "Open my dashboard" : "Start my real workspace"}
            </button>
            <button
              onClick={() => {
                if (onExitDemo) onExitDemo();
              }}
              className="text-xs text-amber-300 hover:text-white underline cursor-pointer font-mono"
            >
              Exit demo
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BODY: LEFT SIDEBAR + MAIN CONTENT AREA                                 */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR (DESKTOP) */}
        <aside className="w-64 bg-[#0E1A29]/80 border-r border-[#182C40] p-4 hidden md:flex flex-col justify-between shrink-0 overflow-y-auto">
          <nav className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-3 block mb-2">
              MSME Workspace
            </span>

            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigateTab(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl font-medium text-xs transition flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? "bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/30"
                      : "text-slate-300 hover:text-white hover:bg-[#132337]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-cyan-400"}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-[#182C40] text-slate-400"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* SIDEBAR FOOTER CARD */}
          <div className="p-3 bg-[#09121D] rounded-2xl border border-[#182C40] text-[11px] font-mono space-y-1 mt-4">
            {isDemo ? (
              <>
                <span className="text-amber-400 block text-[10px] uppercase font-bold">Demo Sandbox:</span>
                <div className="text-amber-300 flex items-center gap-1 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Isolated 24h Session
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Resets on exit &bull; Zero data mix
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sliding Session:</span>
                <div className="text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active (~90 days)
                </div>
                <span className="text-[10px] text-slate-500 block truncate">
                  {user?.businessType || "Retail"} &bull; {user?.phone}
                </span>
              </>
            )}
          </div>
        </aside>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden flex flex-col justify-end">
            <div className="bg-[#0E1A29] border-t-2 border-[#182C40] rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between pb-2 border-b border-[#182C40]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">Y</div>
                  <span className="font-serif font-bold text-white text-sm">
                    Workspace Modules
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              <nav className="grid grid-cols-1 gap-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigateTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-3 rounded-xl text-left text-xs font-mono font-medium flex items-center justify-between ${
                      activeTab === item.id ? "bg-[#2563EB] text-white font-bold" : "text-slate-300 hover:bg-[#132337]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#182C40] text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="pt-2 border-t border-[#182C40] flex items-center justify-between text-xs font-mono">
                {isDemo ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onExitDemo) onExitDemo();
                    }}
                    className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <LogOut size={13} /> Exit demo
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignOut();
                    }}
                    className="text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                )}
                <span className="text-slate-500 text-[10px]">
                  {isDemo ? "Sample data" : "~90-day session"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

      {/* ========================================================================= */}
      {/* 3. HELP & SUPPORT MODAL                                                   */}
      {/* ========================================================================= */}
      {helpModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-[#0E1A29] border-2 border-[#1E3A5F] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-[#182C40] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-cyan-400" />
                <h3 className="font-serif font-bold text-white text-base">YuBiFLo Help &amp; Architecture</h3>
              </div>
              <button onClick={() => setHelpModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-slate-300 leading-relaxed text-[11px]">
              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-1">
                <strong className="text-white block font-mono uppercase text-[10px]">1. Almost Zero Data Entry:</strong>
                <p>You only give two numbers at the start of each day: till cash and M-Pesa float. Counter VCR and delivery notes do the rest.</p>
              </div>

              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-1">
                <strong className="text-white block font-mono uppercase text-[10px]">2. Deterministic AI Rules:</strong>
                <p>AI models only parse messy input and explain what happened. All ledgers and financial figures are calculated by strict deterministic code.</p>
              </div>

              <div className="p-3 bg-[#09121D] rounded-xl border border-[#182C40] space-y-1">
                <strong className="text-white block font-mono uppercase text-[10px]">3. Isolated Duka Space Demo:</strong>
                <p>Duka Space is a risk-free sample sandbox. Sales, purchases, and Deni logged here stay in the sandbox and reset after 24 hours.</p>
              </div>
            </div>

            <button
              onClick={() => setHelpModalOpen(false)}
              className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs font-mono cursor-pointer"
            >
              Back to Workspace
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
