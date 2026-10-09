import React, { useState } from "react";
import { 
  Building2, ArrowRight, ShieldCheck, Check, ChevronDown,
  Plus, Tag, ArrowUpRight, BarChart2, DollarSign, CreditCard,
  Receipt, FileText, CheckCircle2, Play, Users, Globe,
  ChevronRight, Sparkles, Smartphone, RefreshCw, X, Menu, Search,
  Lock, TrendingUp, AlertCircle, Mic, MicOff, Volume2, Radio,
  Layers, Clock, Store
} from "lucide-react";

interface YuBiFloLandingPageProps {
  onGetStarted: () => void;
  onLaunchRetailWorkspace: () => void;
  onOpenSovereignCommand: () => void;
  onOpenBlueprints?: () => void;
  // Backward compatibility alias
  onLaunchAlacioShop?: () => void;
}

export default function YuBiFloLandingPage({
  onGetStarted,
  onLaunchRetailWorkspace,
  onOpenSovereignCommand,
  onOpenBlueprints,
  onLaunchAlacioShop
}: YuBiFloLandingPageProps) {
  // Safe launch action that respects client privacy
  const handleLaunchWorkspace = onLaunchRetailWorkspace || onLaunchAlacioShop || onGetStarted;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [selectedTagDemo, setSelectedTagDemo] = useState<"voice" | "reno" | "promo">("voice");
  const [dashboardExpensePeriod, setDashboardExpensePeriod] = useState("Year to date");
  const [dashboardCashflowPeriod, setDashboardCashflowPeriod] = useState("Last 30 days");
  const [activeVoiceDemo, setActiveVoiceDemo] = useState<number | null>(0);
  const [isVoiceRecordingModalOpen, setIsVoiceRecordingModalOpen] = useState(false);

  // Voice Ledger sample queries for interactive demo
  const voiceDemoSamples = [
    {
      phrase: "Sold 2 Unga Jogoo and 3 Brookside Milk cash 620 Shillings",
      language: "English / Swahili Retail",
      parsed: {
        type: "Sale (Cash)",
        amount: 620,
        items: "2x Unga Jogoo (KSh 330) + 3x Fresh Milk (KSh 195) + Cash Register +KSh 620",
        ledger: "Dr. Cash Register / Cr. Sales Revenue"
      }
    },
    {
      phrase: "Mama Boi took 1 loaf white bread on credit 65 Shillings",
      language: "Customer Khata / Deni",
      parsed: {
        type: "Credit Sale (Customer Deni)",
        amount: 65,
        items: "1x Supa Loaf 400g -> Debtor Ledger: Mama Boi",
        ledger: "Dr. Accounts Receivable (Mama Boi) / Cr. Inventory"
      }
    },
    {
      phrase: "Paid Bread Supplier via M-Pesa Till 4,200 Shillings receipt 9X82Q",
      language: "Supplier Restock",
      parsed: {
        type: "Wholesale Delivery",
        amount: 4200,
        items: "Restock: 65x Loaves -> M-Pesa Till Outflow",
        ledger: "Dr. Inventory Stock / Cr. M-Pesa Float Account"
      }
    }
  ];

  // Chart data for YuBiFlo Cashflow
  const cashflowBars = [
    { label: "Apr 2", inflow: 75, outflow: 35, net: 40 },
    { label: "Apr 3", inflow: 85, outflow: 42, net: 43 },
    { label: "Apr 4", inflow: 65, outflow: 55, net: 10 },
    { label: "Apr 5", inflow: 92, outflow: 38, net: 54 },
    { label: "Apr 6", inflow: 88, outflow: 46, net: 42 },
    { label: "Apr 7", inflow: 78, outflow: 50, net: 28 },
    { label: "Apr 8", inflow: 84, outflow: 44, net: 40 },
    { label: "Apr 9", inflow: 96, outflow: 40, net: 56 },
    { label: "Apr 10", inflow: 82, outflow: 48, net: 34 },
    { label: "Apr 11", inflow: 90, outflow: 52, net: 38 },
    { label: "Apr 12", inflow: 95, outflow: 42, net: 53 }
  ];

  return (
    <div className="min-h-screen bg-white text-[#182238] font-sans antialiased selection:bg-[#0052FF] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. TOP GLOBAL NAVIGATION BAR (PURE YUBIFLO PLATFORM BRANDING)             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* LEFT: LOGO & PRIMARY NAV */}
          <div className="flex items-center gap-8 lg:gap-12">
            
            {/* YUBIFLO BRAND LOGO */}
            <button 
              onClick={onGetStarted}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0052FF] to-[#10B981] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                  <span className="font-serif font-black text-xl tracking-tight">Y</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tight text-[#182238] font-serif flex items-center gap-1.5">
                    YuBiFlo
                    <span className="text-[10px] font-mono font-bold text-[#0052FF] bg-[#EEF4FF] px-1.5 py-0.5 rounded border border-[#CCE0FF]">
                      FLOW
                    </span>
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 -mt-1 font-semibold">
                    Retail Intelligence Platform
                  </span>
                </div>
              </div>
            </button>

            {/* DESKTOP NAV LINKS: SOLUTIONS, PRICING, RESOURCES (NO ADVISORS, NO TAX READINESS) */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#182238]">
              
              {/* Solutions Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setSolutionsDropdownOpen(!solutionsDropdownOpen)}
                  onMouseEnter={() => setSolutionsDropdownOpen(true)}
                  className="flex items-center gap-1.5 hover:text-[#0052FF] transition py-2 cursor-pointer"
                >
                  <span>Solutions</span>
                  <ChevronDown size={14} className={`transition-transform ${solutionsDropdownOpen ? "rotate-180 text-[#0052FF]" : "text-slate-400"}`} />
                </button>

                {solutionsDropdownOpen && (
                  <div 
                    onMouseLeave={() => setSolutionsDropdownOpen(false)}
                    className="absolute top-full left-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 space-y-1 z-50 animate-in fade-in slide-in-from-top-1"
                  >
                    {/* Voice Ledger Feature - Major Competitive Factor */}
                    <button 
                      onClick={() => setIsVoiceRecordingModalOpen(true)}
                      className="w-full text-left p-2.5 hover:bg-blue-50/60 rounded-xl transition flex items-start gap-3 border border-blue-100/80 bg-blue-50/20"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#0052FF] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                        <Mic size={17} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#182238] flex items-center gap-1.5">
                          <span>Voice AI Instant Bookkeeping</span>
                          <span className="bg-blue-100 text-[#0052FF] text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">CORE EDGE</span>
                        </div>
                        <div className="text-[11px] text-slate-500">Record sales &amp; restocks hands-free by speaking in seconds</div>
                      </div>
                    </button>

                    <button 
                      onClick={handleLaunchWorkspace}
                      className="w-full text-left p-2.5 hover:bg-[#F4F7FC] rounded-xl transition flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Store size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#182238]">Retail Shop &amp; Duka Blueprint</div>
                        <div className="text-[11px] text-slate-500">Break-bulk inventory, 43 SKUs &amp; speed deck</div>
                      </div>
                    </button>

                    <button 
                      onClick={handleLaunchWorkspace}
                      className="w-full text-left p-2.5 hover:bg-[#F4F7FC] rounded-xl transition flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#182238]">Invoicing &amp; Customer Khata</div>
                        <div className="text-[11px] text-slate-500">Collect faster with WhatsApp &amp; M-Pesa links</div>
                      </div>
                    </button>

                    <button 
                      onClick={handleLaunchWorkspace}
                      className="w-full text-left p-2.5 hover:bg-[#F4F7FC] rounded-xl transition flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#182238]">Payments &amp; Float Banking</div>
                        <div className="text-[11px] text-slate-500">Dawn 05:57 AM float lock, cash drawer &amp; Till balance</div>
                      </div>
                    </button>

                    <button 
                      onClick={onOpenSovereignCommand}
                      className="w-full text-left p-2.5 hover:bg-[#F4F7FC] rounded-xl transition flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#182238]">Sovereign Multi-Store Hub</div>
                        <div className="text-[11px] text-slate-500">Isolated tenant nodes &amp; macro fleet analytics</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Pricing Button */}
              <button 
                onClick={() => {
                  const el = document.getElementById("pricing-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="hover:text-[#0052FF] transition cursor-pointer"
              >
                Pricing
              </button>

              {/* Resources Dropdown (NO ALACIO LEAK) */}
              <div className="relative">
                <button 
                  onClick={() => setResourcesDropdownOpen(!resourcesDropdownOpen)}
                  onMouseEnter={() => setResourcesDropdownOpen(true)}
                  className="flex items-center gap-1.5 hover:text-[#0052FF] transition py-2 cursor-pointer"
                >
                  <span>Resources</span>
                  <ChevronDown size={14} className={`transition-transform ${resourcesDropdownOpen ? "rotate-180 text-[#0052FF]" : "text-slate-400"}`} />
                </button>

                {resourcesDropdownOpen && (
                  <div 
                    onMouseLeave={() => setResourcesDropdownOpen(false)}
                    className="absolute top-full left-0 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 space-y-1 z-50 animate-in fade-in"
                  >
                    <button 
                      onClick={onOpenBlueprints}
                      className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 rounded-lg text-slate-700 hover:text-[#0052FF]"
                    >
                      Retail Store Blueprint Architecture
                    </button>
                    <button 
                      onClick={handleLaunchWorkspace}
                      className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 rounded-lg text-slate-700 hover:text-[#0052FF]"
                    >
                      Offline-First &bull; Zero Data Loss Security Spec
                    </button>
                    <button 
                      onClick={onOpenSovereignCommand}
                      className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 rounded-lg text-slate-700 hover:text-[#0052FF]"
                    >
                      Data Science &amp; Pipeline Engine
                    </button>
                    <div className="pt-1.5 border-t border-slate-100 px-3 py-1 text-[11px] font-mono text-emerald-600 flex items-center gap-1.5">
                      <ShieldCheck size={13} />
                      <span>Data Protection Act 2019 Certified</span>
                    </div>
                  </div>
                )}
              </div>

            </nav>
          </div>

          {/* RIGHT: CTA BUTTONS (LOG IN & GET STARTED NOW) */}
          <div className="hidden sm:flex items-center gap-3.5">
            <button
              onClick={handleLaunchWorkspace}
              className="px-5 py-2.5 rounded-full border border-slate-200 hover:border-[#0052FF] text-[#182238] hover:text-[#0052FF] font-bold text-sm transition cursor-pointer"
            >
              Client Log in
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 rounded-full bg-[#0052FF] hover:bg-[#0042D0] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              Get started now
            </button>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onGetStarted}
              className="px-3 py-1.5 rounded-full bg-[#0052FF] text-white font-bold text-xs"
            >
              Start
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-[#0052FF]"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>

        {/* MOBILE MENU ACCORDION */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 text-sm font-semibold animate-in slide-in-from-top-2">
            <button onClick={() => setIsVoiceRecordingModalOpen(true)} className="block w-full text-left py-2 text-blue-600 font-bold flex items-center gap-2">
              <Mic size={15} /> Voice AI Instant Bookkeeping
            </button>
            <button onClick={handleLaunchWorkspace} className="block w-full text-left py-2 text-slate-800">
              Solutions &bull; Retail Pro Blueprint
            </button>
            <button onClick={onOpenSovereignCommand} className="block w-full text-left py-2 text-slate-800">
              YuBiFlo Sovereign Platform
            </button>
            <button onClick={onOpenBlueprints} className="block w-full text-left py-2 text-slate-800">
              Blueprints &amp; Templates
            </button>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button onClick={handleLaunchWorkspace} className="w-full py-2.5 rounded-full border border-[#0052FF] text-[#0052FF] font-bold text-center">
                Client Log in
              </button>
              <button onClick={onGetStarted} className="w-full py-2.5 rounded-full bg-[#0052FF] text-white font-bold text-center">
                Get started now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. TOP NOTIFICATION BANNER: VOICE LEDGER COMPETITIVE ADVANTAGE           */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-[#D7E4FE] via-[#CCE0FE] to-[#DCE7FE] border-b border-[#BED4FC] py-5 sm:py-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* BANNER TEXT & VOICE PILL */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 max-w-3xl">
            <div className="flex items-center gap-1.5 self-start bg-[#0052FF] text-white font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0 shadow-sm">
              <Mic size={13} className="text-white animate-pulse" />
              <span>CORE ADVANTAGE</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-[#182238] tracking-tight">
                Record sales &amp; expenses at the speed of speech with Voice Ledger
              </h2>
              <p className="text-sm text-[#384860] mt-0.5">
                <strong className="text-[#0052FF]">Speak it, journal it</strong>. Zero keyboard typing. Built for fast-paced retail counters.
              </p>
            </div>
          </div>

          {/* INTERACTIVE VOICE SAMPLES */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button 
              onClick={() => {
                setSelectedTagDemo("voice");
                setIsVoiceRecordingModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition border bg-white text-[#0052FF] border-blue-300 ring-2 ring-blue-400/30 hover:bg-blue-50 cursor-pointer"
            >
              <Mic size={13} className="text-[#0052FF]" />
              <span>Try Voice Simulator</span>
              <span className="text-[10px] bg-blue-100 px-1 rounded text-blue-700 font-mono">LIVE</span>
            </button>

            <button 
              onClick={() => setSelectedTagDemo("reno")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition border ${
                selectedTagDemo === "reno" 
                  ? "bg-white text-[#182238] border-purple-300" 
                  : "bg-white/80 hover:bg-white text-slate-700 border-slate-200"
              }`}
            >
              <span>Project Tagging</span>
              <Tag size={11} className="text-purple-600 rotate-45" />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION (JOINED IMAGES: HERO COPY LEFT + SPECTACULAR WHITE DASHBOARD) */}
      {/* ========================================================================= */}
      <section className="pt-12 sm:pt-16 pb-20 bg-gradient-to-b from-white via-[#F9FBFC] to-[#F1F5F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* HERO LEFT COLUMN */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* REGULATORY TRUST BADGE (NO FAKE GOOGLE REVIEWS) */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <ShieldCheck size={14} className="text-[#0052FF]" />
                <span className="text-[#182238] font-bold">Kenya Data Protection Act 2019 Compliant</span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-500 font-mono text-[11px]">Tenant Isolated</span>
              </div>

              {/* KICKER */}
              <div className="text-xs uppercase font-extrabold tracking-widest text-[#0052FF]">
                YUBIFLO &bull; BUSINESS OPERATING PLATFORM
              </div>

              {/* HEADLINE */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-[#182238] tracking-tight leading-[1.08]">
                Clear books.<br />
                Voice speed.<br />
                Confident decisions.
              </h1>

              {/* SUBHEADLINE (HIGHLIGHTING VOICE EDGE & PRIVACY) */}
              <p className="text-base sm:text-lg text-[#384860] leading-relaxed max-w-xl">
                The single source of truth for your business finances. While traditional competitors force you to type every entry at a keyboard, YuBiFlo empowers shop owners with <strong>instant voice bookkeeping</strong>, real-time cashflow intelligence, and automated double-entry accounting.
              </p>

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 rounded-full bg-[#0052FF] hover:bg-[#0042D0] text-white font-extrabold text-base shadow-lg shadow-blue-600/25 transition cursor-pointer text-center"
                >
                  Get started free
                </button>

                <button
                  onClick={() => setIsVoiceRecordingModalOpen(true)}
                  className="px-6 py-4 rounded-full bg-white hover:bg-slate-50 border border-blue-200 text-[#0052FF] font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Mic size={16} className="text-[#0052FF]" />
                  <span>Try Voice Speed Demo</span>
                </button>
              </div>

              {/* TRUST FOOTER NOTE */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 size={14} className="text-emerald-600" /> Free retail bookkeeping starter
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck size={14} className="text-blue-600" /> 100% Client Data Confidentiality
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5 text-purple-700">
                  <Sparkles size={14} className="text-purple-600" /> Hands-free Voice AI
                </span>
              </div>

            </div>

            {/* HERO RIGHT COLUMN: SPECTACULAR WHITE DASHBOARD (INVITES MAXIMUM TRUST) */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-300/60 overflow-hidden text-xs">
                
                {/* APP WINDOW TOP TITLE BAR */}
                <div className="bg-[#F8FAFC] border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 ml-2">app.yubiflo.com/dashboard</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      LIVE SECURE SYSTEM
                    </span>
                  </div>
                </div>

                {/* APP MAIN CONTENT: SIDEBAR + PRISTINE WHITE DASHBOARD CANVAS */}
                <div className="grid grid-cols-12 min-h-[530px]">
                  
                  {/* APP MINI SIDEBAR (LEFT) */}
                  <div className="col-span-3 sm:col-span-3 bg-[#FAFCFF] border-r border-slate-100 p-3 flex flex-col justify-between">
                    <div className="space-y-4">
                      
                      {/* Logo in App */}
                      <div className="flex items-center gap-1.5 px-1">
                        <div className="w-5 h-5 rounded-md bg-[#0052FF] text-white flex items-center justify-center font-serif font-black text-xs">
                          Y
                        </div>
                        <span className="font-serif font-black text-sm text-[#182238]">YuBiFlo</span>
                      </div>

                      {/* + Create new button */}
                      <button 
                        onClick={handleLaunchWorkspace}
                        className="w-full bg-[#0052FF] hover:bg-[#0042D0] text-white font-bold py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Create new</span>
                      </button>

                      {/* App Nav Menu */}
                      <nav className="space-y-0.5 text-[11px] text-slate-600 font-medium">
                        <div className="px-2 py-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          Main Menu
                        </div>
                        <button 
                          className="w-full text-left px-2 py-1.5 rounded-md bg-[#EEF4FF] text-[#0052FF] font-bold flex items-center gap-1.5"
                        >
                          <BarChart2 size={12} />
                          <span>Dashboard</span>
                        </button>
                        <button 
                          onClick={() => setIsVoiceRecordingModalOpen(true)}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-blue-50 text-[#0052FF] font-bold flex items-center gap-1.5"
                        >
                          <Mic size={12} className="text-[#0052FF]" />
                          <span>Voice Ledger</span>
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                        </button>
                        <button 
                          onClick={handleLaunchWorkspace}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-600 flex items-center gap-1.5"
                        >
                          <Receipt size={12} />
                          <span>Sales &amp; Khata</span>
                        </button>
                        <button 
                          onClick={handleLaunchWorkspace}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-600 flex items-center gap-1.5"
                        >
                          <CreditCard size={12} />
                          <span>Purchases</span>
                        </button>
                        <button 
                          onClick={handleLaunchWorkspace}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-600 flex items-center gap-1.5"
                        >
                          <FileText size={12} />
                          <span>Accounting</span>
                        </button>
                        <button 
                          onClick={handleLaunchWorkspace}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-600 flex items-center gap-1.5"
                        >
                          <DollarSign size={12} />
                          <span>Float Banking</span>
                        </button>
                      </nav>
                    </div>

                    {/* Bottom Sidebar Badges */}
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <div className="text-[10px] text-slate-500 font-medium px-2 py-1 flex items-center justify-between">
                        <span>Offline Sync</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1 rounded font-bold">Active</span>
                      </div>
                    </div>

                  </div>

                  {/* APP DASHBOARD MAIN CANVAS (RIGHT: PURE WHITE PALETTE) */}
                  <div className="col-span-9 sm:col-span-9 p-4 sm:p-5 space-y-4 bg-white overflow-y-auto max-h-[580px]">
                    
                    {/* TOP GREETING & WORKSPACE BAR */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-serif font-bold text-[#182238]">
                          Good morning, David
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Retail Pro Workspace &bull; 43 SKUs live in memory
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleLaunchWorkspace}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-[10px] flex items-center gap-1 border border-slate-200"
                        >
                          <span>City Retail Pro</span>
                          <span className="bg-[#0052FF] text-white text-[9px] px-1 rounded">PRO</span>
                          <ChevronDown size={10} />
                        </button>
                      </div>
                    </div>

                    {/* QUICK ACTION BUTTONS (INCORPORATING OUR VOICE LEDGER ADVANTAGE) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button 
                        onClick={() => setIsVoiceRecordingModalOpen(true)}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052FF] font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer border border-blue-200 shadow-sm"
                      >
                        <Mic size={13} className="text-[#0052FF] animate-pulse" />
                        <span>Speak Sale (Voice)</span>
                      </button>

                      <button 
                        onClick={handleLaunchWorkspace}
                        className="p-2 rounded-xl bg-[#E6F7ED] hover:bg-[#D5F0E1] text-[#0D6832] font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer border border-[#C6ECD3]"
                      >
                        <Receipt size={12} />
                        <span>Create invoice</span>
                      </button>

                      <button 
                        onClick={handleLaunchWorkspace}
                        className="p-2 rounded-xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#6B21A8] font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer border border-[#E4CAFF]"
                      >
                        <Plus size={12} />
                        <span>Add transaction</span>
                      </button>

                      <button 
                        onClick={handleLaunchWorkspace}
                        className="p-2 rounded-xl bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer border border-[#FDE68A]"
                      >
                        <DollarSign size={12} />
                        <span>Count float</span>
                      </button>
                    </div>

                    {/* VOICE LEDGER INTERACTIVE PULSE CHIP */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-6 h-6 rounded-full bg-[#0052FF] text-white flex items-center justify-center shrink-0">
                          <Mic size={12} />
                        </div>
                        <span className="text-[11px] font-mono text-slate-700 truncate">
                          &ldquo;Sold 2 Unga Jogoo &amp; 3 Milk cash KES 620&rdquo; &rarr; Auto-booked
                        </span>
                      </div>
                      <button 
                        onClick={() => setIsVoiceRecordingModalOpen(true)}
                        className="text-[10px] text-[#0052FF] font-bold shrink-0 hover:underline"
                      >
                        Try Speaking &rarr;
                      </button>
                    </div>

                    {/* 2 MAIN CARDS: EXPENSES BREAKDOWN + CASHFLOW IN CRISP WHITE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      
                      {/* CARD 1: EXPENSES BREAKDOWN (DONUT CHART) */}
                      <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">Expenses breakdown</span>
                          <button 
                            onClick={handleLaunchWorkspace}
                            className="text-[10px] text-[#0052FF] font-semibold hover:underline"
                          >
                            View report
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <select 
                            value={dashboardExpensePeriod}
                            onChange={(e) => setDashboardExpensePeriod(e.target.value)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 font-medium"
                          >
                            <option>Year to date</option>
                            <option>This month</option>
                            <option>Last quarter</option>
                          </select>
                          <span className="text-[10px] font-mono text-slate-400">Total KES 74,450</span>
                        </div>

                        {/* DONUT VISUALIZATION + LEGEND */}
                        <div className="flex items-center gap-3 pt-1">
                          
                          {/* SVG Donut Chart */}
                          <div className="relative w-28 h-28 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="20" />
                              <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="20" 
                                strokeDasharray="64.5 174.5" strokeDashoffset="0" />
                              <circle cx="50" cy="50" r="38" fill="none" stroke="#EA580C" strokeWidth="20" 
                                strokeDasharray="55 184" strokeDashoffset="-64.5" />
                              <circle cx="50" cy="50" r="38" fill="none" stroke="#7C3AED" strokeWidth="20" 
                                strokeDasharray="38.2 200.8" strokeDashoffset="-119.5" />
                              <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="20" 
                                strokeDasharray="33.4 205.6" strokeDashoffset="-157.7" />
                              <circle cx="50" cy="50" r="38" fill="none" stroke="#06B6D4" strokeWidth="20" 
                                strokeDasharray="28.6 210.4" strokeDashoffset="-191.1" />
                            </svg>
                          </div>

                          {/* Donut Legend */}
                          <div className="space-y-1 text-[10px] text-slate-600 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                              <span>27% Wholesale Stock</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                              <span>23% Store Premises</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                              <span>16% Logistics &amp; Transport</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                              <span>14% Cash Drawer Float</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                              <span>12% Other Operating</span>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* CARD 2: CASHFLOW (BAR + NET CHANGE LINE) */}
                      <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">Cashflow</span>
                          <button 
                            onClick={handleLaunchWorkspace}
                            className="text-[10px] text-[#0052FF] font-semibold hover:underline"
                          >
                            View report
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <select 
                            value={dashboardCashflowPeriod}
                            onChange={(e) => setDashboardCashflowPeriod(e.target.value)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 font-medium"
                          >
                            <option>Last 30 days</option>
                            <option>Last 90 days</option>
                            <option>This year</option>
                          </select>

                          {/* Legend for Cashflow */}
                          <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#059669] rounded-sm" /> Inflow</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 border border-slate-300 rounded-sm" /> Outflow</span>
                          </div>
                        </div>

                        {/* BAR CHART GRAPH */}
                        <div className="pt-2">
                          <div className="flex items-end justify-between h-24 gap-1 border-b border-slate-200 pb-1">
                            {cashflowBars.map((bar, idx) => (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end group">
                                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                                  <div 
                                    style={{ height: `${bar.inflow}%` }} 
                                    className="w-1.5 sm:w-2 bg-[#059669] rounded-t-sm transition-all group-hover:bg-[#047857]"
                                    title={`Inflow: $${bar.inflow}k`}
                                  />
                                  <div 
                                    style={{ height: `${bar.outflow}%` }} 
                                    className="w-1.5 sm:w-2 bg-slate-200 border border-slate-300 rounded-t-sm transition-all"
                                    title={`Outflow: $${bar.outflow}k`}
                                  />
                                </div>
                                <span className="text-[8px] text-slate-400 font-mono scale-90">
                                  {bar.label.split(" ")[1]}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-400 font-mono pt-1">
                            <span>Apr 2</span>
                            <span>Live Net: +KES 38,050</span>
                            <span>Apr 12</span>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* LOWER ROW CARDS: CONNECTED ACCOUNTS & PROFIT & LOSS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      
                      {/* CONNECTED ACCOUNTS (2) */}
                      <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">Connected accounts (2)</span>
                          <button onClick={handleLaunchWorkspace} className="text-[10px] text-[#0052FF] font-semibold hover:underline">
                            View all
                          </button>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                                C
                              </div>
                              <div>
                                <div className="text-[11px] font-bold text-slate-800">Cash Register Float</div>
                                <div className="text-[9px] text-slate-400">Drawer safe baseline</div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-emerald-600 text-xs">KES 8,450.00</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-blue-100 text-[#0052FF] flex items-center justify-center font-bold text-[10px]">
                                M
                              </div>
                              <div>
                                <div className="text-[11px] font-bold text-slate-800">M-Pesa Till &bull; Equitel Line</div>
                                <div className="text-[9px] text-slate-400">Buy Goods Till</div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-blue-600 text-xs">KES 20,700.00</span>
                          </div>
                        </div>
                      </div>

                      {/* PROFIT & LOSS */}
                      <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">Profit &amp; Loss</span>
                          <button onClick={handleLaunchWorkspace} className="text-[10px] text-[#0052FF] font-semibold hover:underline">
                            View report
                          </button>
                        </div>

                        <div className="space-y-2 pt-1 text-[11px]">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Income (Verified Sales)</span>
                            <span className="font-mono font-bold text-slate-900">KES 112,500.00</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Operating Expenses</span>
                            <span className="font-mono font-bold text-slate-900">- KES 74,450.00</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center font-bold">
                            <span className="text-emerald-700">Net Profit (Live Period)</span>
                            <span className="font-mono text-emerald-600 text-xs">+ KES 38,050.00</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

                {/* BOTTOM PLAY DEMO VIDEO / VOICE TEST ICON */}
                <div className="absolute bottom-3 left-3 z-20">
                  <button 
                    onClick={() => setIsVoiceRecordingModalOpen(true)}
                    className="w-8 h-8 rounded-full bg-[#0052FF] hover:bg-[#0042D0] text-white flex items-center justify-center shadow-lg transition cursor-pointer"
                    title="Test Voice Speed Ledger"
                  >
                    <Mic size={14} className="fill-white" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. VALUE PROPOSITION: WHY RETAILERS CHOOSE YUBIFLO OVER COMPETITORS        */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#0052FF]">
              Our Competitive Factor
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#182238] tracking-tight">
              Why business owners choose YuBiFlo over traditional software
            </h2>
            <p className="text-base text-slate-600">
              Legacy competitors like Wave force shopkeepers to type everything manually at a keyboard. YuBiFlo is purpose-built for high-speed retail counters with voice intelligence and strict data sovereignty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* CARD 1: VOICE-FIRST LEDGER (OUR CORE COMPETITIVE ADVANTAGE) */}
            <div className="p-8 rounded-2xl bg-[#F0F5FF] border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition space-y-4 relative">
              <div className="absolute -top-3 right-6 bg-[#0052FF] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                #1 Advantage
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#0052FF] text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <Mic size={24} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#182238]">
                Voice-First AI Bookkeeping
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Counter owners don&apos;t have time to type every single transaction. Simply speak naturally in English, Swahili, or Sheng: sales, debts, and restocks are automatically journalized in under two seconds.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#0052FF]" /> Hands-free counter speed with zero typing
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#0052FF]" /> Automatically deducts inventory units
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#0052FF]" /> Updates customer credit and debtor books
                </li>
              </ul>
            </div>

            {/* CARD 2: DOUBLE-ENTRY MATHEMATICAL RIGOR */}
            <div className="p-8 rounded-2xl bg-[#FAFCFF] border border-slate-200/80 hover:border-emerald-300 hover:shadow-xl transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#182238]">
                Automatic Double-Entry Books
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every sale, inventory intake, and expense automatically writes balanced debit and credit entries. Zero math errors, zero missing transactions, zero emotional drift.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2 font-medium">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> Automatic cash drawer &amp; till reconciliation
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> Real-time Profit &amp; Loss and Balance Sheets
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> Dawn 05:57 AM float lock calibration
                </li>
              </ul>
            </div>

            {/* CARD 3: STRICT DATA PROTECTION ACT 2019 COMPLIANCE */}
            <div className="p-8 rounded-2xl bg-[#FAFCFF] border border-slate-200/80 hover:border-purple-300 hover:shadow-xl transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#182238]">
                Kenya Data Protection Act Compliant
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your store data is confidential client property. We enforce strict tenant isolation, encrypted local persistence, and zero public data leaks. Your margins and customer debts are yours alone.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2 font-medium">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-purple-600" /> Private tenant sandbox for each merchant
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-purple-600" /> 100% offline-first local storage reliability
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-purple-600" /> Standalone exportable PWA for your store
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PRIVACY & SECURITY SHOWCASE (KENYA DATA PROTECTION ACT 2019 BY DESIGN) */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-10">
            
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Data Protection Act 2019 &bull; Tenant Isolation
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#182238] tracking-tight">
                Enterprise Client Privacy: Your Store Data Stays Exclusively Yours
              </h3>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Under the Kenya Data Protection Act 2019, sharing client names, financial records, or debtor balances as marketing material is strictly prohibited. YuBiFlo is architected from day one with zero-leakage tenant cryptography. Every client operates in their own isolated, secured vault with bank-grade encryption.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700 font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Isolated Client Workspaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>No Public Financial Data Leaks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Encrypted Offline LocalStorage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Full Proprietor Data Ownership</span>
                </div>
              </div>
            </div>

            <div className="bg-[#FAFCFF] border border-slate-200 rounded-2xl p-6 space-y-4 shrink-0 w-full lg:w-80">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Security Standards</span>
                <Lock size={14} className="text-[#0052FF]" />
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Encryption Level</span>
                  <span className="font-bold text-emerald-600">AES-256 Bit</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Tenant Isolation</span>
                  <span className="font-bold text-slate-900">Cryptographic</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Audit Trail</span>
                  <span className="font-bold text-slate-900">Zero-Drift Log</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Offline Resilience</span>
                  <span className="font-bold text-[#0052FF]">100% Guaranteed</span>
                </div>
              </div>

              <button
                onClick={handleLaunchWorkspace}
                className="w-full py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0042D0] text-white font-bold text-xs transition cursor-pointer shadow"
              >
                Launch Private Client Workspace
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRANSPARENT PRICING SECTION                                           */}
      {/* ========================================================================= */}
      <section id="pricing-section" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#0052FF]">
              Transparent Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#182238] tracking-tight">
              Start free, upgrade as your business scales
            </h2>
            <p className="text-base text-slate-600">
              No hidden fees, no credit card required to start. 100% data preservation and voice speed included.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* TIER 1: FREE */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-6">
              <div>
                <h4 className="text-lg font-bold text-[#182238]">Starter Store</h4>
                <p className="text-xs text-slate-500 mt-1">For single-counter shops and side businesses.</p>
              </div>
              <div className="text-4xl font-black text-[#182238] font-mono">
                $0 <span className="text-xs text-slate-500 font-sans font-normal">/ month forever</span>
              </div>
              <button 
                onClick={onGetStarted}
                className="w-full py-3 rounded-full border border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-sm transition"
              >
                Get started free
              </button>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 font-medium">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Unlimited Invoicing &amp; Estimates</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Basic Voice Ledger Recording</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Double-Entry General Ledger</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> 1 Store Location</li>
              </ul>
            </div>

            {/* TIER 2: PRO BLUEPRINT (FEATURED) */}
            <div className="p-8 rounded-3xl bg-white border-2 border-[#0052FF] space-y-6 shadow-xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0052FF] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                Most Popular
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#182238]">Retail Pro Blueprint</h4>
                <p className="text-xs text-slate-500 mt-1">Complete autonomous operating system for MSMEs.</p>
              </div>
              <div className="text-4xl font-black text-[#0052FF] font-mono">
                KES 1,499 <span className="text-xs text-slate-500 font-sans font-normal">/ month</span>
              </div>
              <button 
                onClick={handleLaunchWorkspace}
                className="w-full py-3 rounded-full bg-[#0052FF] hover:bg-[#0042D0] text-white font-bold text-sm shadow transition"
              >
                Launch Pro Workspace
              </button>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Full Voice Ledger &amp; Sheng Parsing</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Break-Bulk Micro Unit Conversion</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Automated WhatsApp Khata Reminders</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Dawn 05:57 AM Float Reconciler</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Real-time Cloud Mirror</li>
              </ul>
            </div>

            {/* TIER 3: SOVEREIGN AGENCY */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-6">
              <div>
                <h4 className="text-lg font-bold text-[#182238]">Sovereign Fleet Hub</h4>
                <p className="text-xs text-slate-500 mt-1">Multi-branch chains &amp; accounting agencies.</p>
              </div>
              <div className="text-4xl font-black text-[#182238] font-mono">
                KES 9,999 <span className="text-xs text-slate-500 font-sans font-normal">/ month</span>
              </div>
              <button 
                onClick={onOpenSovereignCommand}
                className="w-full py-3 rounded-full border border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-sm transition"
              >
                Access Sovereign Console
              </button>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 font-medium">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Multi-Branch Fleet Management</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Isolated Client Workspace Cloner</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Macro Data Engineering &amp; APIs</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#0052FF]" /> Priority 24/7 Dedicated Support</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM CTA SECTION                                                    */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gradient-to-r from-[#0052FF] via-[#0047E0] to-[#0038B8] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight">
            Take control of your retail finances today
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Join business owners who save hours every week with YuBiFlo&apos;s voice-speed bookkeeping, clean white books, and confident decisions.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-9 py-4 rounded-full bg-white hover:bg-slate-100 text-[#0052FF] font-black text-base shadow-xl transition cursor-pointer"
            >
              Get started now &mdash; it&apos;s free
            </button>
            <button
              onClick={handleLaunchWorkspace}
              className="px-8 py-4 rounded-full bg-transparent hover:bg-white/10 border border-white text-white font-bold text-base transition cursor-pointer"
            >
              Launch Retail Workspace
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PROFESSIONAL FOOTER (PURE YUBIFLO PLATFORM BRANDING)                  */}
      {/* ========================================================================= */}
      <footer className="bg-[#0B111E] text-slate-400 text-xs py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80">
            
            {/* BRAND COL */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <div className="w-7 h-7 rounded-lg bg-[#0052FF] flex items-center justify-center font-bold font-serif text-white">
                  Y
                </div>
                <span className="font-serif font-black text-xl text-white">YuBiFlo</span>
                <span className="text-[10px] font-mono text-[#0052FF] bg-blue-950 px-1.5 py-0.5 rounded border border-blue-900">
                  PLATFORM
                </span>
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                Empowering retailers, supermarkets, and dukas with voice-speed bookkeeping, transparent accounting, and bank-grade data sovereignty.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                &copy; {new Date().getFullYear()} YuBiFlo Technologies Inc. All rights reserved.
              </div>
            </div>

            {/* SOLUTIONS */}
            <div className="space-y-2">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Features</div>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={() => setIsVoiceRecordingModalOpen(true)} className="hover:text-white transition text-blue-400 font-bold">Voice Ledger</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Invoicing &amp; Khata</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Double-Entry Ledger</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Float Reconciliation</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Inventory Break-Bulk</button></li>
              </ul>
            </div>

            {/* COMPANY */}
            <div className="space-y-2">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Platform</div>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={onOpenSovereignCommand} className="hover:text-white transition">Sovereign Fleet</button></li>
                <li><button onClick={onOpenBlueprints} className="hover:text-white transition">Store Blueprints</button></li>
                <li><button onClick={onOpenSovereignCommand} className="hover:text-white transition">Data Engine</button></li>
                <li><button onClick={onGetStarted} className="hover:text-white transition">Pricing Plans</button></li>
              </ul>
            </div>

            {/* LEGAL & SECURITY (COMPLIANCE WITH KENYA DATA PROTECTION ACT 2019) */}
            <div className="space-y-2">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Trust &amp; Privacy</div>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition text-emerald-400 font-medium">Data Protection Act 2019</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Tenant Isolation Spec</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Terms of Service</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Zero Data Loss Policy</button></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              Built for retail dukas, wholesale distributors, hardware stores, and fast-moving consumer goods counters.
            </div>
            <div className="flex gap-4">
              <button onClick={handleLaunchWorkspace} className="hover:text-white">Retail Workspace</button>
              <button onClick={onOpenSovereignCommand} className="hover:text-white">Enterprise Command</button>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. INTERACTIVE VOICE LEDGER SIMULATOR MODAL (CORE COMPETITIVE FACTOR)     */}
      {/* ========================================================================= */}
      {isVoiceRecordingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                  <Mic size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-[#182238]">
                    Voice AI Instant Bookkeeping
                  </h3>
                  <p className="text-xs text-slate-500">
                    YuBiFlo&apos;s #1 Competitive Factor vs. Traditional Software
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsVoiceRecordingModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Microphone Visualizer Demo */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-100 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#0052FF] text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Volume2 size={26} className="animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#0052FF] tracking-wider bg-white px-2.5 py-1 rounded-full border border-blue-200">
                  Select a Sample Retail Speech
                </span>
                <p className="text-xs text-slate-600 mt-2">
                  See how spoken retail speech is parsed instantly into verified double-entry journals:
                </p>
              </div>

              {/* Speech Selection Pills */}
              <div className="space-y-2 text-left">
                {voiceDemoSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveVoiceDemo(idx)}
                    className={`w-full p-3 rounded-xl border text-xs text-left transition cursor-pointer ${
                      activeVoiceDemo === idx
                        ? "bg-white border-[#0052FF] ring-2 ring-blue-500/20 shadow-sm"
                        : "bg-white/60 hover:bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#0052FF] mb-1">
                      <span className="flex items-center gap-1.5">
                        <Mic size={12} /> {sample.language}
                      </span>
                      <span className="font-mono text-slate-400">Click to parse</span>
                    </div>
                    <div className="font-medium text-slate-900">
                      &ldquo;{sample.phrase}&rdquo;
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parsed Result Box */}
            {activeVoiceDemo !== null && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-700">Parsed Journal Output:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Instant Booked
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Type:</span>
                  <span className="font-bold text-slate-900">{voiceDemoSamples[activeVoiceDemo].parsed.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-[#0052FF]">KES {voiceDemoSamples[activeVoiceDemo].parsed.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inventory / Detail:</span>
                  <span className="font-bold text-slate-800 text-right">{voiceDemoSamples[activeVoiceDemo].parsed.items}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-purple-700 flex items-center justify-between">
                  <span>Double-Entry Entry:</span>
                  <span className="font-bold">{voiceDemoSamples[activeVoiceDemo].parsed.ledger}</span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setIsVoiceRecordingModalOpen(false);
                  handleLaunchWorkspace();
                }}
                className="flex-1 py-3 rounded-full bg-[#0052FF] hover:bg-[#0042D0] text-white font-bold text-xs transition cursor-pointer shadow-md text-center"
              >
                Launch Live Voice Ledger in Store &rarr;
              </button>
              <button
                onClick={() => setIsVoiceRecordingModalOpen(false)}
                className="px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
