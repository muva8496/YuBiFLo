import React, { useState, useEffect } from "react";
import { 
  Building2, ArrowRight, Check, ChevronDown, Plus, 
  DollarSign, Receipt, Users, Smartphone, RefreshCw, 
  X, Menu, AlertCircle, Mic, MicOff, Volume2, Store,
  Pause, Play, Shield, HelpCircle, Sparkles, ChevronRight,
  TrendingUp, Clock, Package, Truck, Layers, Wrench, CheckCircle2,
  FileText
} from "lucide-react";
import PrdViewerModal from "./PrdViewerModal";
import LoopingDashboardDemo from "./LoopingDashboardDemo";
import ProofBand from "./ProofBand";
import EngineeringLabModal from "./EngineeringLabModal";
import {
  SolutionsMegaMenu,
  BusinessTypesMegaMenu,
  ResourcesDropdown,
  MobileNavAccordions,
  BlueprintStatusBadge,
  recordBlueprintRequest
} from "./MegaMenus";
import { AlacioMasterState } from "../types/alacio";

interface YuBiFloLandingPageProps {
  onGetStarted: () => void;
  onLaunchRetailWorkspace: () => void;
  onOpenSovereignCommand: () => void;
  onOpenBlueprints?: () => void;
  onLaunchAlacioShop?: () => void;
  state?: AlacioMasterState;
}

// -------------------------------------------------------------
// BUSINESS BLOOM MOTIF: 5 Petals corresponding to health metrics
// 1. Profit  2. Cash & Float  3. Debts (Credit)  4. Stock  5. Suppliers
// -------------------------------------------------------------
function BusinessBloomGraphic({ 
  size = 140, 
  scores = { profit: 88, cash: 94, debts: 82, stock: 90, suppliers: 78 },
  showLegend = false
}: { 
  size?: number; 
  scores?: { profit: number; cash: number; debts: number; stock: number; suppliers: number };
  showLegend?: boolean;
}) {
  const petals = [
    { label: "Profit", score: scores.profit, angle: 0, color: "#000000" },      // Forest Green
    { label: "Cash", score: scores.cash, angle: 72, color: "#262626" },        // Emerald Forest
    { label: "Debts", score: scores.debts, angle: 144, color: "#B8860B" },      // Dark Gold
    { label: "Stock", score: scores.stock, angle: 216, color: "#171717" },      // Deep Forest
    { label: "Suppliers", score: scores.suppliers, angle: 288, color: "#996515" } // Burnished Gold
  ];

  const overallScore = Math.round(
    (scores.profit + scores.cash + scores.debts + scores.stock + scores.suppliers) / 5
  );

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full transition-transform duration-700 ease-out hover:rotate-12"
        >
          {/* Outer glow aura */}
          <circle cx="100" cy="100" r="92" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1.5" />

          {/* 5 Blooming Petals */}
          {petals.map((petal, i) => {
            const rad = ((petal.angle - 90) * Math.PI) / 180;
            const distance = 42;
            const cx = 100 + Math.cos(rad) * distance;
            const cy = 100 + Math.sin(rad) * distance;
            const rx = 24 + (petal.score / 100) * 10;
            const ry = 42 + (petal.score / 100) * 12;

            return (
              <ellipse
                key={i}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                transform={`rotate(${petal.angle} ${cx} ${cy})`}
                fill={petal.color}
                opacity="0.88"
                className="transition-all duration-500 hover:opacity-100 cursor-pointer"
              >
                <title>{`${petal.label}: ${petal.score}% health`}</title>
              </ellipse>
            );
          })}

          {/* Central Flower Core */}
          <circle cx="100" cy="100" r="30" fill="#FFFFFF" stroke="#B8860B" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="22" fill="#FAF6EE" />
          <text 
            x="100" 
            y="98" 
            textAnchor="middle" 
            fill="#000000" 
            fontSize="18" 
            fontWeight="bold" 
            fontFamily="serif"
          >
            {overallScore}
          </text>
          <text 
            x="100" 
            y="112" 
            textAnchor="middle" 
            fill="#B8860B" 
            fontSize="8" 
            letterSpacing="1"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            BLOOM
          </text>
        </svg>
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2 text-[10px] font-sans">
          <span className="flex items-center gap-1 text-[#222222]">
            <span className="w-2 h-2 rounded-full bg-[#000000]" /> Profit ({scores.profit}%)
          </span>
          <span className="flex items-center gap-1 text-[#222222]">
            <span className="w-2 h-2 rounded-full bg-[#262626]" /> Cash ({scores.cash}%)
          </span>
          <span className="flex items-center gap-1 text-[#222222]">
            <span className="w-2 h-2 rounded-full bg-[#B8860B]" /> Debts ({scores.debts}%)
          </span>
          <span className="flex items-center gap-1 text-[#222222]">
            <span className="w-2 h-2 rounded-full bg-[#171717]" /> Stock ({scores.stock}%)
          </span>
          <span className="flex items-center gap-1 text-[#222222]">
            <span className="w-2 h-2 rounded-full bg-[#996515]" /> Suppliers ({scores.suppliers}%)
          </span>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MAIN YUBIFLO HOMEPAGE COMPONENT
// -------------------------------------------------------------
export default function YuBiFloLandingPage({
  onGetStarted,
  onLaunchRetailWorkspace,
  onOpenSovereignCommand,
  onOpenBlueprints,
  onLaunchAlacioShop,
  state
}: YuBiFloLandingPageProps) {
  const handleLaunchWorkspace = onLaunchRetailWorkspace || onLaunchAlacioShop || onGetStarted;

  // Navigation states & mega-menus
  const [solutionsMenuOpen, setSolutionsMenuOpen] = useState(false);
  const [businessTypesMenuOpen, setBusinessTypesMenuOpen] = useState(false);
  const [resourcesMenuOpen, setResourcesMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "sw">("en");

  // Modals & Simulator
  const [isVoiceRecordingModalOpen, setIsVoiceRecordingModalOpen] = useState(false);
  const [isPrdModalOpen, setIsPrdModalOpen] = useState(false);
  const [isEngineeringLabOpen, setIsEngineeringLabOpen] = useState(false);
  const [activeVoiceDemo, setActiveVoiceDemo] = useState<number | null>(0);
  const [waitlistModalApp, setWaitlistModalApp] = useState<string | null>(null);
  
  // Comprehensive waitlist form fields
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistTown, setWaitlistTown] = useState("");
  const [waitlistConsent, setWaitlistConsent] = useState(true);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Business Type Tabs: "See your kind of business"
  const [selectedBusinessType, setSelectedBusinessType] = useState<"duka" | "hardware" | "wholesale">("duka");

  // VCR Live Feed State (Counting up and heard sale stream)
  const [vcrIsPaused, setVcrIsPaused] = useState(false);
  const [todaySalesCount, setTodaySalesCount] = useState(24);
  const [todaySalesTotal, setTodaySalesTotal] = useState(14820);
  const [vcrFeedItems, setVcrFeedItems] = useState([
    {
      id: 1,
      heard: "Sold 2 packets Jogoo and 1 litre Rina cooking oil cash 540",
      parsed: "2x Unga Jogoo (KSh 330) + 1x Rina Oil (KSh 210)",
      amount: 540,
      payment: "Till Cash",
      time: "Just now"
    },
    {
      id: 2,
      heard: "Mama Brayo took 1 loaf broadways white bread on credit 65 bob",
      parsed: "1x Broadways 400g -> Added to Mama Brayo Debt",
      amount: 65,
      payment: "Credit / Deni",
      time: "2 mins ago"
    },
    {
      id: 3,
      heard: "Customer bought 3 Brookside milk packets paid M-Pesa 195",
      parsed: "3x Brookside 500ml -> M-Pesa Till 418293",
      amount: 195,
      payment: "M-Pesa Float",
      time: "5 mins ago"
    }
  ]);

  // Simulate VCR live ticker when not paused
  useEffect(() => {
    if (vcrIsPaused) return;

    const interval = setInterval(() => {
      const candidates = [
        { heard: "Sold 1 bar white star soap cash 120", parsed: "1x White Star 800g -> Till Cash", amount: 120, payment: "Till Cash" },
        { heard: "Baba Junior 2 packets milk on credit 130", parsed: "2x Milk 500ml -> Debtor Baba Junior", amount: 130, payment: "Credit / Deni" },
        { heard: "Paid Bread van restock 2,600 M-Pesa", parsed: "Restock: 40x Loaves -> Till Outflow", amount: 2600, payment: "M-Pesa Restock" },
        { heard: "Customer bought 2 kg sugar paid cash 290", parsed: "2kg Kabras Sugar -> Till Cash", amount: 290, payment: "Till Cash" }
      ];
      const randomItem = candidates[Math.floor(Math.random() * candidates.length)];
      
      setVcrFeedItems((prev) => [
        {
          id: Date.now(),
          heard: randomItem.heard,
          parsed: randomItem.parsed,
          amount: randomItem.amount,
          payment: randomItem.payment,
          time: "Just now"
        },
        ...prev.slice(0, 3)
      ]);

      setTodaySalesCount((c) => c + 1);
      setTodaySalesTotal((t) => t + randomItem.amount);
    }, 7000);

    return () => clearInterval(interval);
  }, [vcrIsPaused]);

  // Voice Ledger sample queries for the interactive simulator modal
  const voiceDemoSamples = [
    {
      phrase: "Sold 2 Unga Jogoo and 3 Brookside Milk cash 620 Shillings",
      language: "Swahili / English Retail Counter",
      parsed: {
        type: "Cash Sale",
        amount: 620,
        items: "2x Unga Jogoo + 3x Fresh Milk",
        ledger: "Cash Register +KSh 620, Inventory Stock Deducted"
      }
    },
    {
      phrase: "Mama Boi took 1 loaf white bread on credit 65 Shillings",
      language: "Customer Credit / Deni",
      parsed: {
        type: "Deni Entry",
        amount: 65,
        items: "1x Bread 400g -> Added to Mama Boi Owed Balance",
        ledger: "Debtors (Mama Boi) +KSh 65, Inventory Stock -1 loaf"
      }
    },
    {
      phrase: "Paid Bread Supplier via M-Pesa Till 4,200 Shillings receipt 9X82Q",
      language: "Supplier Delivery",
      parsed: {
        type: "Wholesale Restock",
        amount: 4200,
        items: "Restock: 65x Loaves -> Verified Supplier Manifest",
        ledger: "Stock Reserve +KSh 4,200, M-Pesa Float Outflow"
      }
    }
  ];

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistPhone) return;
    if (waitlistModalApp) {
      recordBlueprintRequest(waitlistModalApp);
    }
    setWaitlistSuccess(true);
    setTimeout(() => {
      setWaitlistSuccess(false);
      setWaitlistModalApp(null);
      setWaitlistName("");
      setWaitlistPhone("");
      setWaitlistTown("");
      setWaitlistConsent(true);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans antialiased selection:bg-[#000000] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. NAVIGATION BAR                                                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Signature */}
          <div className="flex items-center gap-8 lg:gap-10">
            <button 
              onClick={handleLaunchWorkspace}
              className="flex items-center gap-3 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#000000] text-white flex items-center justify-center shadow-md shadow-[#000000]/20">
                {/* Minimalist 5-Petal Flower Symbol */}
                <svg viewBox="0 0 40 40" className="w-6 h-6 fill-none stroke-current stroke-2">
                  <circle cx="20" cy="20" r="3.5" fill="#FAF6EE" stroke="#B8860B" />
                  <ellipse cx="20" cy="11" rx="3.5" ry="5.5" fill="#262626" stroke="#FAF6EE" strokeWidth="1" />
                  <ellipse cx="28" cy="16" rx="3.5" ry="5.5" transform="rotate(72 28 16)" fill="#B8860B" stroke="#FAF6EE" strokeWidth="1" />
                  <ellipse cx="25" cy="27" rx="3.5" ry="5.5" transform="rotate(144 25 27)" fill="#171717" stroke="#FAF6EE" strokeWidth="1" />
                  <ellipse cx="15" cy="27" rx="3.5" ry="5.5" transform="rotate(216 15 27)" fill="#996515" stroke="#FAF6EE" strokeWidth="1" />
                  <ellipse cx="12" cy="16" rx="3.5" ry="5.5" transform="rotate(288 12 16)" fill="#262626" stroke="#FAF6EE" strokeWidth="1" />
                </svg>
              </div>

              <div className="flex flex-col">
                <span className="text-2xl font-black font-serif tracking-tight text-[#000000] flex items-center gap-1.5">
                  YuBiFLo
                </span>
                <span className="text-[10px] font-sans text-[#B8860B] font-semibold tracking-wide -mt-0.5">
                  Your Business Is A Flower
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#222222]">
              
              {/* 1. Solutions Mega-Menu */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setSolutionsMenuOpen(!solutionsMenuOpen);
                    setBusinessTypesMenuOpen(false);
                    setResourcesMenuOpen(false);
                  }}
                  onMouseEnter={() => {
                    setSolutionsMenuOpen(true);
                    setBusinessTypesMenuOpen(false);
                    setResourcesMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 hover:text-[#000000] transition py-2 cursor-pointer font-medium"
                >
                  <span>Solutions</span>
                  <ChevronDown size={14} className={`transition-transform text-[#666666] ${solutionsMenuOpen ? "rotate-180 text-[#000000]" : ""}`} />
                </button>
              </div>

              {/* 2. Business Types Mega-Menu */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setBusinessTypesMenuOpen(!businessTypesMenuOpen);
                    setSolutionsMenuOpen(false);
                    setResourcesMenuOpen(false);
                  }}
                  onMouseEnter={() => {
                    setBusinessTypesMenuOpen(true);
                    setSolutionsMenuOpen(false);
                    setResourcesMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 hover:text-[#000000] transition py-2 cursor-pointer font-medium"
                >
                  <span>Business types</span>
                  <ChevronDown size={14} className={`transition-transform text-[#666666] ${businessTypesMenuOpen ? "rotate-180 text-[#000000]" : ""}`} />
                </button>
              </div>

              {/* 3. Projects */}
              <button 
                onClick={() => {
                  setSolutionsMenuOpen(false);
                  setBusinessTypesMenuOpen(false);
                  setResourcesMenuOpen(false);
                  const el = document.getElementById("projects-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="hover:text-[#000000] transition cursor-pointer"
              >
                Projects
              </button>

              {/* 4. Pricing */}
              <button 
                onClick={() => {
                  setSolutionsMenuOpen(false);
                  setBusinessTypesMenuOpen(false);
                  setResourcesMenuOpen(false);
                  const el = document.getElementById("pricing-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="hover:text-[#000000] transition cursor-pointer"
              >
                Pricing
              </button>

              {/* 5. Resources Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setResourcesMenuOpen(!resourcesMenuOpen);
                    setSolutionsMenuOpen(false);
                    setBusinessTypesMenuOpen(false);
                  }}
                  onMouseEnter={() => {
                    setResourcesMenuOpen(true);
                    setSolutionsMenuOpen(false);
                    setBusinessTypesMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 hover:text-[#000000] transition py-2 cursor-pointer font-medium"
                >
                  <span>Resources</span>
                  <ChevronDown size={14} className={`transition-transform text-[#666666] ${resourcesMenuOpen ? "rotate-180 text-[#000000]" : ""}`} />
                </button>
              </div>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3.5">
            <button
              onClick={handleLaunchWorkspace}
              className="px-4 py-2 rounded-full border border-[#e4e4e7] hover:border-[#000000] text-[#222222] hover:text-[#000000] font-semibold text-xs transition cursor-pointer"
              title="Client Log in (Passcode 8496)"
            >
              Client Log in
            </button>

            <button
              onClick={handleLaunchWorkspace}
              className="px-5 py-2.5 rounded-full bg-[#000000] hover:bg-[#171717] text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Start free with VCR</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleLaunchWorkspace}
              className="px-3 py-1.5 rounded-full bg-[#000000] text-white text-xs font-semibold"
            >
              Start
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#222222]"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>

        {/* MEGA-MENUS DROPDOWNS */}
        <SolutionsMegaMenu
          isOpen={solutionsMenuOpen}
          onClose={() => setSolutionsMenuOpen(false)}
          onSelectSolution={(solId) => {
            if (solId === "vcr_voice") setIsVoiceRecordingModalOpen(true);
            else handleLaunchWorkspace();
          }}
          onLaunchWorkspace={handleLaunchWorkspace}
          onRequestSetup={() => setWaitlistModalApp("Done-For-You Setup Service")}
        />

        <BusinessTypesMegaMenu
          isOpen={businessTypesMenuOpen}
          onClose={() => setBusinessTypesMenuOpen(false)}
          onSelectAvailableType={() => handleLaunchWorkspace()}
          onOpenWaitlist={(name) => setWaitlistModalApp(name)}
        />

        <ResourcesDropdown
          isOpen={resourcesMenuOpen}
          onClose={() => setResourcesMenuOpen(false)}
          onOpenPRD={() => setIsPrdModalOpen(true)}
          onOpenEngineeringLab={() => setIsEngineeringLabOpen(true)}
          onOpenHowItWorks={() => {
            const el = document.getElementById("how-it-works-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          onOpenProjects={() => {
            const el = document.getElementById("projects-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          onToggleLanguage={() => setLanguage(language === "en" ? "sw" : "en")}
          language={language}
        />

        {/* Mobile Nav Accordions */}
        <MobileNavAccordions
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onLaunchWorkspace={handleLaunchWorkspace}
          onOpenPRD={() => setIsPrdModalOpen(true)}
          onOpenEngineeringLab={() => setIsEngineeringLabOpen(true)}
          onOpenWaitlist={(name) => setWaitlistModalApp(name)}
          onToggleLanguage={() => setLanguage(language === "en" ? "sw" : "en")}
          language={language}
        />
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="pt-12 sm:pt-16 pb-20 bg-gradient-to-b from-white via-[#fafafa] to-[#f4f4f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* HERO LEFT: COPY */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4f4f5] text-xs text-[#000000] font-medium border border-[#e4e4e7]">
                <Shield size={14} className="text-[#000000]" />
                <span>Built with Kenya&apos;s Data Protection Act in mind</span>
              </div>

              {/* Hero Headline (Three lines requested by user) */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-[#000000] tracking-tight leading-[1.12]">
                No notebooks.<br />
                No typing.<br />
                Just know your numbers.
              </h1>

              {/* Sub-line */}
              <p className="text-base sm:text-lg text-[#444444] leading-relaxed max-w-xl">
                Tell us your starting cash each morning. YuBiFlo listens at the counter and shows you your real profit.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <button
                  onClick={handleLaunchWorkspace}
                  className="px-7 py-3.5 rounded-full bg-[#000000] hover:bg-[#171717] text-white font-bold text-sm shadow-md shadow-[#000000]/20 transition cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <span>Start free with VCR</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => setIsVoiceRecordingModalOpen(true)}
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-[#f4f4f5] border border-[#B8860B] text-[#996515] font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Volume2 size={16} className="text-[#B8860B]" />
                  <span>Try the Voice Simulator</span>
                </button>
              </div>

              {/* Trust line */}
              <div className="pt-2 flex items-center gap-2 text-xs text-[#555555]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B]" />
                <span className="font-medium italic">&ldquo;We keep the numbers, not the conversations.&rdquo;</span>
              </div>

            </div>

            {/* HERO RIGHT: OWNER'S DAILY DASHBOARD (LOOPING ANIMATED DEMO) */}
            <div className="lg:col-span-7">
              <LoopingDashboardDemo onLaunchWorkspace={handleLaunchWorkspace} />
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROBLEM SECTION                                                        */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-t border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#000000] tracking-tight">
              Busy all day. Still no clear numbers.
            </h2>
            <p className="text-base text-[#555555]">
              You sell from dawn to dusk, but at the end of the day the truth slips away.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Problem 1 */}
            <div className="p-8 rounded-3xl bg-[#fafafa] border border-[#e4e4e7] space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#f4f4f5] text-[#000000] flex items-center justify-center font-bold">
                <AlertCircle size={22} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#000000]">
                Profit is a guess.
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                Money in the drawer looks like earnings until the milk supplier or landlord arrives. Without real item margins, you never know what is yours to keep.
              </p>
            </div>

            {/* Problem 2 */}
            <div className="p-8 rounded-3xl bg-[#fafafa] border border-[#e4e4e7] space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] text-[#996515] flex items-center justify-center font-bold">
                <Users size={22} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#000000]">
                Debts get forgotten.
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                Scraps of paper tear and notebooks get misplaced. Trusted regular customers take bread on credit, and by Saturday nobody remembers the exact amount.
              </p>
            </div>

            {/* Problem 3 */}
            <div className="p-8 rounded-3xl bg-[#fafafa] border border-[#e4e4e7] space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#f4f4f5] text-[#000000] flex items-center justify-center font-bold">
                <DollarSign size={22} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#000000]">
                Cash leaks.
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                Fifty shillings for chai, two hundred for transport, coins handed to the family. Small unrecorded outflows quietly drain the shop&apos;s working float.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SOLUTION SECTION (1, 2, 3 STEPS)                                       */}
      {/* ========================================================================= */}
      <section id="how-it-works-section" className="py-20 bg-[#fafafa] border-t border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#B8860B]">
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#000000] tracking-tight">
              We do the counting. You do the selling.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-white border border-[#e4e4e7] space-y-4 shadow-sm hover:border-[#000000] transition">
              <div className="w-12 h-12 rounded-2xl bg-[#000000] text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm">
                1
              </div>
              <h3 className="text-xl font-serif font-bold text-[#000000]">
                Start your day
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                Confirm your morning till cash and M-Pesa float in seconds. Lock your opening baseline so every single shilling earned belongs strictly to today.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-white border border-[#e4e4e7] space-y-4 shadow-sm hover:border-[#000000] transition">
              <div className="w-12 h-12 rounded-2xl bg-[#000000] text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm">
                2
              </div>
              <h3 className="text-xl font-serif font-bold text-[#000000]">
                Run your shop
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                VCR records each sale as it happens hands-free. Speak naturally across the counter: items, quantities, and customer debts are logged without touching a screen.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-white border border-[#e4e4e7] space-y-4 shadow-sm hover:border-[#000000] transition">
              <div className="w-12 h-12 rounded-2xl bg-[#000000] text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm">
                3
              </div>
              <h3 className="text-xl font-serif font-bold text-[#000000]">
                Know your numbers
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                See your evening summary: real profit, debts owed, and unexplained cash. Close your shop knowing exactly what you made and what to reorder.
              </p>
            </div>

          </div>

          {/* Trust line reminder */}
          <div className="mt-12 text-center">
            <span className="inline-flex items-center gap-2 text-sm text-[#000000] font-medium bg-[#f4f4f5] px-4 py-2 rounded-full border border-[#e4e4e7]">
              <Shield size={16} />
              <span>We keep the numbers, not the conversations.</span>
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. VCR LIVE FEED TICKER (TURNS HEARD SALE INTO TRANSACTIONS)               */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-t border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-[#fafafa] rounded-3xl border border-[#e4e4e7] p-6 sm:p-10 shadow-lg space-y-6">
            
            {/* Header with live ticker & pause button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#000000] animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#000000]">
                    VCR Live Feed &bull; Sample data
                  </span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#000000] mt-1">
                  Turns heard sales into clear transactions instantly
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-white border border-[#e4e4e7] text-xs font-semibold text-[#222222]">
                  Today&apos;s sales counted: <strong className="text-[#000000] font-serif">{todaySalesCount}</strong> (KSh {todaySalesTotal.toLocaleString()})
                </div>

                <button
                  onClick={() => setVcrIsPaused(!vcrIsPaused)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#e4e4e7] bg-white hover:bg-[#f4f4f5] text-xs font-semibold text-[#222222] flex items-center gap-1.5 transition cursor-pointer"
                >
                  {vcrIsPaused ? (
                    <>
                      <Play size={13} className="text-[#000000]" />
                      <span>Resume feed</span>
                    </>
                  ) : (
                    <>
                      <Pause size={13} className="text-[#996515]" />
                      <span>Pause feed</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Ticker Items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vcrFeedItems.slice(0, 3).map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-2 animate-in fade-in"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#666666]">
                    <span className="font-mono flex items-center gap-1 text-[#000000]">
                      <Mic size={12} /> Heard audio:
                    </span>
                    <span className="text-[10px]">{item.time}</span>
                  </div>

                  <p className="text-xs font-medium text-[#222222] italic">
                    &ldquo;{item.heard}&rdquo;
                  </p>

                  <div className="pt-2 border-t border-[#F0F5F2] flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-[#666666]">{item.parsed}</div>
                      <span className="text-[10px] font-semibold text-[#000000]">{item.payment}</span>
                    </div>
                    <div className="text-sm font-bold font-serif text-[#000000]">
                      +KSh {item.amount}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulator CTA */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#666666]">
              <span>Audio is discarded immediately after numbers are extracted.</span>
              <button
                onClick={() => setIsVoiceRecordingModalOpen(true)}
                className="text-[#000000] font-bold hover:underline flex items-center gap-1"
              >
                <span>Try the Voice Simulator with custom spoken sentences &rarr;</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5B. PROOF BAND (DARK FOREST + GOLD)                                       */}
      {/* ========================================================================= */}
      <ProofBand
        state={state || ({
          salesLedger: [
            { id: "1", total_amount: 14820 },
            { id: "2", total_amount: 28400 },
            { id: "3", total_amount: 32600 }
          ],
          inventory: new Array(43).fill(null),
          customers: [
            { id: "c1", debt_balance: 1850 },
            { id: "c2", debt_balance: 920 },
            { id: "c3", debt_balance: 1550 }
          ],
          clean_trading_days: 14
        } as any)}
        onOpenProject1={() => {
          const el = document.getElementById("projects-section");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenEngineeringLab={() => setIsEngineeringLabOpen(true)}
      />

      {/* ========================================================================= */}
      {/* 6. APPS & "SEE YOUR KIND OF BUSINESS" TABS (DUKA / HARDWARE / WHOLESALE)  */}
      {/* ========================================================================= */}
      <section id="apps-section" className="py-20 bg-[#fafafa] border-t border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-[#B8860B]">
              Tailored Blueprints
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#000000] tracking-tight">
              See your kind of business
            </h2>
            <p className="text-base text-[#555555]">
              Every trade has its own flow. YuBiFlo adapts to your inventory, payments, and customers.
            </p>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 bg-white border border-[#e4e4e7] rounded-2xl shadow-xs gap-1.5">
              
              <button
                onClick={() => setSelectedBusinessType("duka")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedBusinessType === "duka"
                    ? "bg-[#000000] text-white shadow-sm"
                    : "text-[#555555] hover:text-[#000000]"
                }`}
              >
                <Store size={15} />
                <span>Duka</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedBusinessType === "duka" ? "bg-white/20 text-white" : "bg-[#f4f4f5] text-[#000000]"
                }`}>
                  Available now
                </span>
              </button>

              <button
                onClick={() => setSelectedBusinessType("hardware")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedBusinessType === "hardware"
                    ? "bg-[#000000] text-white shadow-sm"
                    : "text-[#555555] hover:text-[#000000]"
                }`}
              >
                <Wrench size={15} />
                <span>Hardware</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedBusinessType === "hardware" ? "bg-white/20 text-white" : "bg-[#FAF6EE] text-[#996515]"
                }`}>
                  Coming next
                </span>
              </button>

              <button
                onClick={() => setSelectedBusinessType("wholesale")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedBusinessType === "wholesale"
                    ? "bg-[#000000] text-white shadow-sm"
                    : "text-[#555555] hover:text-[#000000]"
                }`}
              >
                <Truck size={15} />
                <span>Wholesale</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedBusinessType === "wholesale" ? "bg-white/20 text-white" : "bg-slate-100 text-[#666666]"
                }`}>
                  Coming soon
                </span>
              </button>

            </div>
          </div>

          {/* TAB 1: DUKA DASHBOARD */}
          {selectedBusinessType === "duka" && (
            <div className="bg-white rounded-3xl border border-[#e4e4e7] p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#000000]">
                    Duka Dashboard &bull; Sample data
                  </h3>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Break-bulk packaging, daily bread/milk count, and customer deni.
                  </p>
                </div>
                <button
                  onClick={handleLaunchWorkspace}
                  className="px-5 py-2 rounded-full bg-[#000000] hover:bg-[#171717] text-white font-bold text-xs shadow-xs"
                >
                  Launch Duka Workspace
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] text-[#666666]">Counter sales today</div>
                  <div className="text-2xl font-serif font-bold text-[#000000] mt-1">KSh 18,450</div>
                  <div className="text-[10px] text-[#000000]">24 cash &amp; till entries</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] text-[#666666]">Bread &amp; milk margin</div>
                  <div className="text-2xl font-serif font-bold text-[#000000] mt-1">KSh 3,240</div>
                  <div className="text-[10px] text-[#262626]">Turnover speed: 1.2 days</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EADBBD]">
                  <div className="text-[11px] text-[#996515]">Neighbor credit (Deni)</div>
                  <div className="text-2xl font-serif font-bold text-[#996515] mt-1">KSh 4,320</div>
                  <div className="text-[10px] text-[#996515]">Mama Boi, Baba Junior</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] text-[#666666]">Dawn drawer check</div>
                  <div className="text-2xl font-serif font-bold text-[#000000] mt-1">KSh 6,500</div>
                  <div className="text-[10px] text-[#000000]">05:57 AM baseline locked</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE DASHBOARD */}
          {selectedBusinessType === "hardware" && (
            <div className="bg-white rounded-3xl border border-[#e4e4e7] p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#000000]">
                    Hardware Dashboard &bull; Sample data
                  </h3>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Bags of cement, running feet of timber, contractor milestone accounts.
                  </p>
                </div>
                <button
                  onClick={() => setWaitlistModalApp("Hardware & Construction")}
                  className="px-5 py-2 rounded-full bg-[#FAF6EE] border border-[#EADBBD] text-[#996515] font-bold text-xs"
                >
                  Join Hardware Waitlist
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EADBBD]">
                  <div className="text-[11px] text-[#996515]">Credit owed by contractors</div>
                  <div className="text-2xl font-serif font-bold text-[#996515] mt-1">KSh 142,500</div>
                  <div className="text-[10px] text-[#996515]">3 active building sites</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] text-[#666666]">Slow-moving stock value</div>
                  <div className="text-2xl font-serif font-bold text-[#000000] mt-1">KSh 38,200</div>
                  <div className="text-[10px] text-[#666666]">Special paint &amp; brass fittings</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] text-[#666666]">Cement stock today</div>
                  <div className="text-2xl font-serif font-bold text-[#000000] mt-1">68 Bags</div>
                  <div className="text-[10px] text-[#000000]">Bamburi Power Plus</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] text-[#666666]">Weekly gross profit</div>
                  <div className="text-2xl font-serif font-bold text-[#000000] mt-1">KSh 46,800</div>
                  <div className="text-[10px] text-[#262626]">Timber &amp; roofing nails margin</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WHOLESALE DASHBOARD */}
          {selectedBusinessType === "wholesale" && (
            <div className="bg-white rounded-3xl border border-[#e4e4e7] p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#000000]">
                    Wholesale Dashboard &bull; Sample data
                  </h3>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Truck manifests, grain shrinkage formula, distributor credit ledgers.
                  </p>
                </div>
                <button
                  onClick={() => setWaitlistModalApp("Wholesale & Distribution")}
                  className="px-5 py-2 rounded-full bg-slate-100 border border-slate-200 text-[#555555] font-bold text-xs"
                >
                  Join Wholesale Waitlist
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] text-[#666666]">Truck crates received</div>
                  <div className="text-2xl font-serif font-bold text-[#000000] mt-1">140 Crates</div>
                  <div className="text-[10px] text-[#000000]">Delivered 07:15 AM</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EADBBD]">
                  <div className="text-[11px] text-[#996515]">Retail duka credit ledger</div>
                  <div className="text-2xl font-serif font-bold text-[#996515] mt-1">KSh 84,600</div>
                  <div className="text-[10px] text-[#996515]">7 route shops due Friday</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] text-[#666666]">Bulk warehouse reserve</div>
                  <div className="text-2xl font-serif font-bold text-[#000000] mt-1">KSh 320,000</div>
                  <div className="text-[10px] text-[#000000]">Sugar, Rice &amp; Maize sacks</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] text-[#666666]">Route volume today</div>
                  <div className="text-2xl font-serif font-bold text-[#000000] mt-1">KSh 112,000</div>
                  <div className="text-[10px] text-[#262626]">92% bank settled</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PROJECTS SECTION                                                       */}
      {/* ========================================================================= */}
      <section id="projects-section" className="py-20 bg-white border-t border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="text-xs font-bold uppercase tracking-widest text-[#B8860B]">
              Field Evidence
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#000000] tracking-tight">
              See it working in real shops
            </h2>
            <p className="text-base text-[#555555]">
              Real Kenyan counters replacing lost notebooks with effortless voice intelligence.
            </p>
          </div>

          {/* Project #1 Card */}
          <div className="max-w-4xl mx-auto bg-[#fafafa] rounded-3xl border border-[#e4e4e7] p-7 sm:p-10 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-[#FAF6EE] text-[#996515] border border-[#EADBBD]">
                  Project #1
                </span>
                <h3 className="text-2xl font-serif font-black text-[#000000] mt-2">
                  Neighborhood FMCG &amp; Duka Counter
                </h3>
                <p className="text-xs text-[#666666]">
                  Kasarani / Hunters, Nairobi &bull; 60-Day Field Audit
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#666666] block">Results</span>
                <span className="text-sm font-bold text-[#000000] font-mono">
                  Results to be added
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] space-y-1">
                <div className="text-xs text-[#666666]">Starting condition</div>
                <p className="text-xs text-[#222222] font-medium leading-relaxed">
                  Lost notebooks, missing chai coins, and guessing weekend profits by looking at the drawer.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] space-y-1">
                <div className="text-xs text-[#666666]">Deployed YuBiFlo solution</div>
                <p className="text-xs text-[#222222] font-medium leading-relaxed">
                  Morning float lock at dawn, counter VCR listening for cash and deni, and evening reconciliation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] space-y-1">
                <div className="text-xs text-[#666666]">Audit outcome</div>
                <p className="text-xs text-[#222222] font-medium leading-relaxed">
                  Results to be added &bull; Verified zero emotional leakage and preserved capital.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#e5e7eb]">
              <span className="text-xs text-[#666666]">Client data isolated and protected.</span>
              <button
                onClick={handleLaunchWorkspace}
                className="text-xs font-bold text-[#000000] hover:underline flex items-center gap-1"
              >
                <span>Launch live template in workspace</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PRICING SECTION                                                        */}
      {/* ========================================================================= */}
      <section id="pricing-section" className="py-20 bg-[#fafafa] border-t border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="text-xs font-bold uppercase tracking-widest text-[#B8860B]">
              Transparent Plans
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#000000] tracking-tight">
              Simple pricing for working shops
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
            
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl bg-white border border-[#e4e4e7] space-y-6 shadow-sm">
              <div>
                <span className="text-xs font-bold text-[#000000] uppercase tracking-wider font-mono">Starter</span>
                <h3 className="text-3xl font-serif font-black text-[#000000] mt-1">Free</h3>
                <p className="text-xs text-[#666666] mt-1">Everything you need to stop losing cash</p>
              </div>

              <ul className="space-y-3 text-xs text-[#333333]">
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-[#000000]" /> Morning till cash &amp; M-Pesa float lock
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-[#000000]" /> Daily sales &amp; customer credit (Deni) ledger
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-[#000000]" /> 100% offline device storage (never loses data)
                </li>
              </ul>

              <button
                onClick={handleLaunchWorkspace}
                className="w-full py-3 rounded-full bg-[#f4f4f5] hover:bg-[#D9E8DD] text-[#000000] font-bold text-xs transition"
              >
                Start free with VCR
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl bg-white border-2 border-[#000000] space-y-6 shadow-lg relative">
              <div className="absolute -top-3 right-8 bg-[#000000] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow">
                Popular
              </div>

              <div>
                <span className="text-xs font-bold text-[#B8860B] uppercase tracking-wider font-mono">Pro Shop</span>
                <h3 className="text-3xl font-serif font-black text-[#000000] mt-1">
                  KSh 1,200 <span className="text-xs font-sans text-[#666666] font-normal">/ month</span>
                </h3>
                <p className="text-xs text-[#666666] mt-1">For shops ready to expand and secure working float</p>
              </div>

              <ul className="space-y-3 text-xs text-[#333333]">
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-[#000000]" /> Everything in Free Starter
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-[#000000]" /> Real-time Voice Ledger (VCR hands-free listening)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-[#000000]" /> Automated supplier restock &amp; delivery audits
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-[#000000]" /> WhatsApp debt reminders sent directly to customers
                </li>
              </ul>

              <button
                onClick={handleLaunchWorkspace}
                className="w-full py-3 rounded-full bg-[#000000] hover:bg-[#171717] text-white font-bold text-xs transition shadow-sm"
              >
                Start free trial with VCR
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQ SECTION (ANSWERS: WHAT VCR RECORDS, WHAT IS DELETED, WHO CAN SEE)  */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-t border-[#e5e7eb]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif font-black text-[#000000] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#666666]">
              Clear answers about privacy, your recordings, and your numbers.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* FAQ 1: What VCR records */}
            <div className="p-6 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] space-y-2">
              <h3 className="text-base font-serif font-bold text-[#000000] flex items-center gap-2">
                <HelpCircle size={17} className="text-[#000000]" />
                What does VCR record?
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
                VCR only extracts the financial numbers of the sale: the item name (like Milk or Broadways Bread), the quantity, the price paid, and whether it was paid in cash, M-Pesa, or taken on credit (Deni). It converts speech into numbers for your ledger.
              </p>
            </div>

            {/* FAQ 2: What is deleted */}
            <div className="p-6 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] space-y-2">
              <h3 className="text-base font-serif font-bold text-[#000000] flex items-center gap-2">
                <HelpCircle size={17} className="text-[#000000]" />
                What is deleted?
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
                All voice audio is immediately deleted once the transaction numbers are written to your ledger. We keep the numbers, not the conversations. Your counter talks, personal chats, and neighborhood gossip are never saved, stored, or sent to any server.
              </p>
            </div>

            {/* FAQ 3: Who can see my data */}
            <div className="p-6 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] space-y-2">
              <h3 className="text-base font-serif font-bold text-[#000000] flex items-center gap-2">
                <HelpCircle size={17} className="text-[#000000]" />
                Who can see my data?
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
                Only you. Each store operates inside its own isolated, password-gated vault protected by your passcode. Your customer debts, margins, and sales numbers are your private property and are never shared or made public.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="bg-[#09090b] text-slate-300 py-16 border-t border-[#000000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Logo and signature */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#262626] text-white flex items-center justify-center font-serif font-bold">
                  Y
                </div>
                <span className="text-xl font-serif font-bold text-white tracking-tight">YuBiFLo</span>
              </div>
              <p className="text-xs text-[#B8860B] font-serif italic">
                Your Business Is A Flower
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                No notebooks. No typing. Just know your numbers.
              </p>
            </div>

            {/* Business Apps */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Business Apps</div>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Duka &amp; Retail (Available now)</button></li>
                <li><button onClick={() => setWaitlistModalApp("Hardware & Construction")} className="hover:text-white transition">Hardware (Coming next)</button></li>
                <li><button onClick={() => setWaitlistModalApp("Wholesale & Distribution")} className="hover:text-white transition">Wholesale (Coming soon)</button></li>
              </ul>
            </div>

            {/* Product Features */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Features</div>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={() => setIsVoiceRecordingModalOpen(true)} className="hover:text-white transition">Voice Simulator</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Dawn Till Float Lock</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Customer Credit &amp; Deni</button></li>
                <li><button onClick={handleLaunchWorkspace} className="hover:text-white transition">Evening Profit Audit</button></li>
              </ul>
            </div>

            {/* Privacy & Trust */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Privacy &amp; Trust</div>
              <ul className="space-y-1.5 text-slate-400">
                <li><span className="text-white font-semibold">Built with Kenya&apos;s Data Protection Act in mind</span></li>
                <li><span>Audio discarded immediately</span></li>
                <li><span>Zero client data sharing</span></li>
                <li><span>Isolated tenant password vaults</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} YuBiFLo. All rights reserved.
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <button 
                onClick={() => setIsPrdModalOpen(true)} 
                className="text-[#B8860B] hover:text-[#FAF6EE] font-medium flex items-center gap-1 cursor-pointer"
                title="View Comprehensive Product Requirements Document & Client Journey"
              >
                <FileText size={13} />
                <span>View PRD Document</span>
              </button>
              <button 
                onClick={() => setIsEngineeringLabOpen(true)} 
                className="text-slate-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
                title="Technical specs and schemas for partners and investors"
              >
                <span>Engineering Lab (for partners)</span>
              </button>
              <button onClick={handleLaunchWorkspace} className="hover:text-white cursor-pointer">Client Log in</button>
              <button onClick={handleLaunchWorkspace} className="hover:text-white cursor-pointer">Workspace Portal</button>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 10B. COMPREHENSIVE PRD VIEWER MODAL                                       */}
      {/* ========================================================================= */}
      <PrdViewerModal
        isOpen={isPrdModalOpen}
        onClose={() => setIsPrdModalOpen(false)}
        onLaunchWorkspace={handleLaunchWorkspace}
      />

      {/* ========================================================================= */}
      {/* 11. WAITLIST MODAL FOR NON-LIVE BUSINESS APPS                             */}
      {/* ========================================================================= */}
      {waitlistModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#e4e4e7] space-y-5 text-[#222222]">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#B8860B] uppercase">Waitlist &amp; Early Request</span>
                <h3 className="text-xl font-serif font-bold text-[#000000]">
                  {waitlistModalApp}
                </h3>
              </div>
              <button 
                onClick={() => setWaitlistModalApp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#555555] leading-relaxed">
              We are tailoring this blueprint with specialized shelf taxonomy, inventory units and counter terms. Leave your details to get early access when this app launches.
            </p>

            {waitlistSuccess ? (
              <div className="p-4 rounded-2xl bg-[#f4f4f5] text-[#000000] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} />
                <div>
                  <div className="font-bold">You&apos;re on the priority waitlist!</div>
                  <div className="text-[11px] text-[#262626] font-normal mt-0.5">We have registered your shop request for {waitlistModalApp}.</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#444444] block mb-1">
                    Your Name / Shopkeeper Name
                  </label>
                  <input
                    type="text"
                    required
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    placeholder="e.g. Mama Boi / Bwana Njoroge"
                    className="w-full py-2.5 px-3.5 bg-[#fafafa] border border-[#e4e4e7] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#444444] block mb-1">
                    Phone Number (Safaricom / M-Pesa)
                  </label>
                  <input
                    type="tel"
                    required
                    value={waitlistPhone}
                    onChange={(e) => setWaitlistPhone(e.target.value)}
                    placeholder="e.g. 0712 345 678"
                    className="w-full py-2.5 px-3.5 bg-[#fafafa] border border-[#e4e4e7] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#444444] block mb-1">
                    Town / Neighborhood
                  </label>
                  <input
                    type="text"
                    required
                    value={waitlistTown}
                    onChange={(e) => setWaitlistTown(e.target.value)}
                    placeholder="e.g. Ruiru, Kasarani, Nakuru, Kisumu"
                    className="w-full py-2.5 px-3.5 bg-[#fafafa] border border-[#e4e4e7] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>

                {/* Consent Checkbox */}
                <div className="pt-1 flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="waitlist-consent"
                    required
                    checked={waitlistConsent}
                    onChange={(e) => setWaitlistConsent(e.target.checked)}
                    className="mt-0.5 rounded text-[#000000] focus:ring-[#000000]"
                  />
                  <label htmlFor="waitlist-consent" className="text-[11px] text-[#666666] leading-tight cursor-pointer">
                    I consent to be notified by WhatsApp or SMS when the <strong>{waitlistModalApp}</strong> blueprint is ready.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#000000] hover:bg-[#171717] text-white font-bold text-xs shadow-sm transition cursor-pointer mt-2"
                >
                  Join Priority Waitlist
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. VOICE SIMULATOR MODAL (PRESERVED WORKING FEATURE)                      */}
      {/* ========================================================================= */}
      {isVoiceRecordingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#e4e4e7] space-y-5 text-[#222222]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f4f4f5] text-[#000000] flex items-center justify-center shadow-xs">
                  <Mic size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-[#000000]">
                    Try the Voice Simulator
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Hear how counter speech turns into numbers without typing
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
            <div className="p-5 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#000000] text-white mx-auto flex items-center justify-center shadow-md shadow-[#000000]/20">
                <Volume2 size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#996515] tracking-wider bg-[#FAF6EE] px-2.5 py-1 rounded-full border border-[#EADBBD]">
                  Sample Spoken Sentences &bull; Sample data
                </span>
                <p className="text-xs text-[#555555] mt-2">
                  Select a counter scenario to see real-time extraction:
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
                        ? "bg-white border-[#000000] ring-2 ring-[#000000]/20 shadow-xs"
                        : "bg-white/80 hover:bg-white border-[#e4e4e7] text-[#333333]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#000000] mb-1">
                      <span className="flex items-center gap-1.5">
                        <Mic size={12} /> {sample.language}
                      </span>
                      <span className="font-mono text-[#B8860B]">Click to test</span>
                    </div>
                    <div className="font-medium text-[#222222]">
                      &ldquo;{sample.phrase}&rdquo;
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parsed Result Box */}
            {activeVoiceDemo !== null && (
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-[11px] text-[#666666] border-b border-[#e5e7eb] pb-2">
                  <span className="font-bold text-[#222222]">Extracted Transaction:</span>
                  <span className="text-[#000000] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Counted in Ledger
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Action:</span>
                  <span className="font-bold text-[#222222]">{voiceDemoSamples[activeVoiceDemo].parsed.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Amount:</span>
                  <span className="font-bold text-[#000000]">KSh {voiceDemoSamples[activeVoiceDemo].parsed.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Details:</span>
                  <span className="font-bold text-[#222222] text-right">{voiceDemoSamples[activeVoiceDemo].parsed.items}</span>
                </div>
                <div className="pt-2 border-t border-[#e5e7eb] text-[11px] text-[#996515] flex items-center justify-between">
                  <span>Ledger balance:</span>
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
                className="flex-1 py-3 rounded-full bg-[#000000] hover:bg-[#171717] text-white font-bold text-xs transition cursor-pointer shadow-sm text-center"
              >
                Start free with VCR in Store &rarr;
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

      {/* ========================================================================= */}
      {/* 13. ENGINEERING LAB MODAL (TECHNICAL SPEC FOR PARTNERS & INVESTORS)       */}
      {/* ========================================================================= */}
      <EngineeringLabModal
        isOpen={isEngineeringLabOpen}
        onClose={() => setIsEngineeringLabOpen(false)}
        onLaunchWorkspace={handleLaunchWorkspace}
      />

    </div>
  );
}
