import React, { useState, useEffect, Suspense, lazy } from "react";
import { 
  Building2, ArrowRight, Check, ChevronDown, Plus, 
  DollarSign, Receipt, Users, Smartphone, RefreshCw, 
  X, Menu, AlertCircle, Mic, MicOff, Volume2, Store,
  Pause, Play, Shield, HelpCircle, Sparkles, ChevronRight,
  TrendingUp, Clock, Package, Truck, Layers, Wrench, CheckCircle2,
  FileText, Utensils
} from "lucide-react";
import LoopingDashboardDemo from "./LoopingDashboardDemo";
import ProofBand from "./ProofBand";

const PrdViewerModal = lazy(() => import("./PrdViewerModal"));
const EngineeringLabModal = lazy(() => import("./EngineeringLabModal"));
const OnboardingModal = lazy(() => import("./OnboardingModal"));
import {
  SolutionsMegaMenu,
  BusinessTypesMegaMenu,
  ResourcesDropdown,
  MobileNavAccordions,
  BlueprintStatusBadge,
  recordBlueprintRequest
} from "./MegaMenus";
import { YuBiFloMark, YuBiFloLogo } from "./YuBiFloLogo";
import { AlacioMasterState } from "../types/alacio";

interface YuBiFloLandingPageProps {
  onGetStarted: () => void;
  onLaunchRetailWorkspace: () => void;
  onOpenSovereignCommand: () => void;
  onOpenBlueprints?: () => void;
  onLaunchAlacioShop?: () => void;
  state?: AlacioMasterState;
  onCompleteOnboarding?: (customState: Partial<AlacioMasterState>) => void;
  onOpenAuth?: (mode: "signin" | "signup") => void;
  isLoggedIn?: boolean;
  onLaunchDukaDemo?: () => void;
  onLaunchDemoTab?: (tabId?: string, preset?: "duka" | "eatery") => void;
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
  state,
  onCompleteOnboarding,
  onOpenAuth,
  isLoggedIn = false,
  onLaunchDukaDemo,
  onLaunchDemoTab
}: YuBiFloLandingPageProps) {
  const handleLaunchWorkspace = onLaunchRetailWorkspace || onLaunchAlacioShop || onGetStarted;

  const launchSolutionDemo = (solutionId: string, preset: "duka" | "eatery" = "duka") => {
    const tabMap: Record<string, string> = {
      daily_cash: "dawn_lock",
      profit_summary: "analytics",
      bloom_dashboard: "dashboard",
      vcr_voice: "voice_ledger",
      mpesa_import: "supply_sales",
      supplier_photo: "receipt_ocr",
      credit_deni: "customer_deni",
      restock_engine: "purchases",
      supplier_ranking: "suppliers",
      forecasts: "analytics",
      benchmarks: "analytics",
      three_fold: "three_fold_ledgers"
    };
    const targetTab = tabMap[solutionId] || "dashboard";
    if (onLaunchDemoTab) {
      onLaunchDemoTab(targetTab, preset);
    } else if (onLaunchDukaDemo) {
      onLaunchDukaDemo();
    } else {
      handleLaunchWorkspace();
    }
  };

  // Onboarding Modal state (Path A: Start Fresh, Path B: Bring your records)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingInitialPath, setOnboardingInitialPath] = useState<"A" | "B">("A");

  const handleStartOnboarding = (path: "A" | "B" = "A") => {
    setOnboardingInitialPath(path);
    setIsOnboardingOpen(true);
  };

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
  const [selectedBusinessType, setSelectedBusinessType] = useState<"duka" | "eatery" | "hardware" | "wholesale">("duka");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

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
    <div className="min-h-screen yubiflo-blue-gold-canvas text-[#0F1A24] font-sans antialiased selection:bg-[#1A56DB] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. NAVIGATION BAR                                                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#EDF4FB]/90 backdrop-blur-md border-b border-[#C8D9EA] border-t-2 border-t-[#D4AF37]/60">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Signature */}
          <div className="flex items-center gap-8 lg:gap-10">
            <button 
              onClick={handleLaunchWorkspace}
              className="flex items-center gap-3 text-left group cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <YuBiFloLogo size="md" variant="dark" />
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
                className="hover:text-[#0B1B32] transition cursor-pointer whitespace-nowrap shrink-0"
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
                className="hover:text-[#0B1B32] transition cursor-pointer whitespace-nowrap shrink-0"
              >
                Pricing
              </button>

              {/* 4. Resources Dropdown */}
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
            {isLoggedIn ? (
              <button
                onClick={handleLaunchWorkspace}
                className="px-5 py-2.5 rounded-full bg-[#000000] hover:bg-[#171717] text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open dashboard</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth ? onOpenAuth("signin") : handleLaunchWorkspace()}
                  className="px-3.5 py-2 rounded-full text-[#222222] hover:text-[#000000] hover:bg-zinc-200/60 font-semibold text-xs transition cursor-pointer"
                  title="Sign in with your Gmail address"
                >
                  Log in
                </button>

                <button
                  onClick={() => onLaunchDukaDemo ? onLaunchDukaDemo() : handleLaunchWorkspace()}
                  className="px-4 py-2 rounded-full border border-zinc-300 hover:border-black text-[#222222] hover:text-[#000000] font-semibold text-xs transition cursor-pointer"
                  title="Explore live workspace"
                >
                  Explore Live
                </button>

                <button
                  onClick={() => onOpenAuth ? onOpenAuth("signup") : handleLaunchWorkspace()}
                  className="px-5 py-2.5 rounded-full neuro-cta-gold text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Sign up and start using the app directly"
                >
                  <span>Meet Your Biz</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn ? (
              <button
                onClick={handleLaunchWorkspace}
                className="px-3.5 py-1.5 rounded-full bg-[#000000] text-white text-xs font-semibold"
              >
                Open dashboard
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth ? onOpenAuth("signin") : handleLaunchWorkspace()}
                  className="px-2 py-1.5 rounded-full text-zinc-800 text-[11px] font-semibold hover:bg-zinc-100"
                >
                  Log in
                </button>
                <button
                  onClick={() => onLaunchDukaDemo ? onLaunchDukaDemo() : handleLaunchWorkspace()}
                  className="px-2.5 py-1.5 rounded-full border border-zinc-300 text-zinc-800 text-[11px] font-semibold"
                >
                  Live
                </button>
                <button
                  onClick={() => onOpenAuth ? onOpenAuth("signup") : handleLaunchWorkspace()}
                  className="px-3 py-1.5 rounded-full bg-[#000000] text-white text-[11px] font-semibold"
                >
                  Meet Your Biz
                </button>
              </div>
            )}
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
          onSelectSolution={(solId) => launchSolutionDemo(solId)}
          onLaunchWorkspace={() => launchSolutionDemo("bloom_dashboard")}
          onRequestSetup={() => setWaitlistModalApp("Done-For-You Setup Service")}
        />

        <BusinessTypesMegaMenu
          isOpen={businessTypesMenuOpen}
          onClose={() => setBusinessTypesMenuOpen(false)}
          onSelectAvailableType={(name) => {
            const preset = name.toLowerCase().includes("eatery") ? "eatery" : "duka";
            launchSolutionDemo("bloom_dashboard", preset);
          }}
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
          onLaunchWorkspace={() => launchSolutionDemo("bloom_dashboard")}
          onSelectSolution={(solId) => launchSolutionDemo(solId)}
          onSelectBusinessType={(name) => {
            const preset = name.toLowerCase().includes("eatery") ? "eatery" : "duka";
            launchSolutionDemo("bloom_dashboard", preset);
          }}
          onOpenAuth={onOpenAuth}
          onOpenPRD={() => setIsPrdModalOpen(true)}
          onOpenEngineeringLab={() => setIsEngineeringLabOpen(true)}
          onOpenWaitlist={(name) => setWaitlistModalApp(name)}
          onToggleLanguage={() => setLanguage(language === "en" ? "sw" : "en")}
          language={language}
        />
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (ALWAYS SIDE-BY-SIDE: WORDING LEFT + DASHBOARD RIGHT)    */}
      {/* ========================================================================= */}
      <section className="pt-5 sm:pt-14 lg:pt-16 pb-10 sm:pb-20 lg:pb-24 yubiflo-hero-aura border-b border-[#C8D9EA]">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 lg:px-10">
          <div className="grid grid-cols-12 gap-2.5 sm:gap-6 md:gap-8 lg:gap-14 items-center">
            
            {/* HERO LEFT: COPY */}
            <div className="col-span-5 space-y-2.5 sm:space-y-5 lg:space-y-6 min-w-0">

              {/* Hero Headline */}
              <h1 className="text-[17px] min-[390px]:text-[19px] sm:text-3xl lg:text-[2.75rem] xl:text-5xl font-serif font-black text-[#0B1B32] tracking-tight leading-[1.12] [text-wrap:balance]">
                Your business,{" "}
                <span className="italic bg-gradient-to-r from-[#1A56DB] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent neuro-gold-underline">
                  finally in numbers
                </span>
                .
              </h1>

              {/* Body Text: Whole-SME Problem -> Agitate -> Solution */}
              <p className="text-[10.5px] min-[390px]:text-[11px] sm:text-sm lg:text-base text-[#334155] leading-[1.38] sm:leading-relaxed max-w-[54ch]">
                Across eateries, retail shops, hardware stores, salons, wholesale depots, and service businesses&mdash;cash, mobile money, supplier bills, staff pay, and rent all move fast through one blur. Stopping to write books slows down customers, yet guessing leaves real money leaking unseen. <strong className="text-[#0B1B32] font-semibold">YuBiFLo gives SMEs instant clarity</strong> across every shilling, channel, and cost&mdash;without holding up work.
              </p>

              {/* Action Buttons */}
              <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-3.5">
                <button
                  onClick={() => onOpenAuth ? onOpenAuth("signup") : handleStartOnboarding("A")}
                  className="px-3 sm:px-6 py-2 sm:py-3 rounded-full neuro-cta-gold text-white font-bold text-[11px] sm:text-sm cursor-pointer text-center flex items-center justify-center gap-1.5 sm:gap-2 group whitespace-nowrap min-h-[36px] sm:min-h-[44px]"
                  title="Sign up and start using the app for your business"
                >
                  <span>Meet Your Biz</span>
                  <ArrowRight size={14} className="text-[#F5D061] group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                <button
                  onClick={() => launchSolutionDemo("bloom_dashboard", "duka")}
                  className="px-3 sm:px-6 py-2 sm:py-3 rounded-full bg-white/95 hover:bg-white border border-[#9BB6D3] hover:border-[#D4AF37] text-[#0B1B32] font-bold text-[11px] sm:text-sm transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs whitespace-nowrap min-h-[36px] sm:min-h-[44px]"
                  title="Experience every solution live without signing in"
                >
                  <Sparkles size={14} className="text-[#C8962E] shrink-0" />
                  <span className="sm:hidden">Try Live</span>
                  <span className="hidden sm:inline">Try Live — No Sign-Up</span>
                </button>
              </div>

              {/* Subtle Neuro-Ease Trust Cue & Mission Claim */}
              <div className="pt-0.5 sm:pt-1 space-y-1">
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-[9.5px] sm:text-xs text-[#475569]">
                  <Shield size={12} className="text-[#C8962E] shrink-0" />
                  <span className="font-medium">&ldquo;We keep the numbers, not the conversations.&rdquo;</span>
                  <span aria-hidden="true" className="hidden sm:inline text-[#94A3B8]">&middot;</span>
                  <span className="hidden sm:inline text-[#1E3A5F] font-semibold">Experience everything before signing up</span>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-[#996515]">
                  Our aim: using clear numbers to aid MSMEs achieve scale and growth.
                </p>
              </div>

            </div>

            {/* HERO RIGHT: LIVE WORKSPACE DASHBOARD (ALWAYS SIDE-BY-SIDE ON MOBILE & LAPTOP) */}
            <div className="col-span-7 min-w-0 space-y-1.5">
              <LoopingDashboardDemo 
                userName="Musa"
                businessName="Horizon SME Enterprises"
                onLaunchWorkspace={() => launchSolutionDemo("bloom_dashboard", "duka")} 
              />
              <button
                type="button"
                onClick={() => launchSolutionDemo("bloom_dashboard", "duka")}
                className="md:hidden w-full text-center text-[10px] font-semibold text-[#1E3A5F] hover:text-[#0B1B32] flex items-center justify-center gap-1 pt-0.5 cursor-pointer"
              >
                <span>Tap to expand full live dashboard</span>
                <ArrowRight size={11} className="text-[#C8962E]" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 PROBLEM -> AGITATE -> SOLUTION SECTION                                */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[#F0F5FB] border-b border-[#C8D9EA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 space-y-14 sm:space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-[#B8860B]">
              Built For Growing SMEs
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#000000] tracking-tight">
              Hard work across your business shouldn&apos;t end in guesswork.
            </h2>
            <p className="text-base sm:text-lg text-[#555555]">
              Whether your SME sells goods, meals, hardware, or daily services—delayed visibility costs real working capital.
            </p>
          </div>

          {/* Three PAS Cards: Problem, Agitate, Solution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* 1. PROBLEM */}
            <div className="p-7 sm:p-8 rounded-3xl neuro-surface-card space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-rose-700 font-bold block">
                  01 &bull; The Problem
                </span>
                <h3 className="text-2xl font-serif font-black text-[#0B1B32]">
                  Everything moves through one blur
                </h3>
                <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
                  Cash on hand, mobile money (Till, Paybill, Pochi, or Send Money), supplier bills, staff wages, rent, and client credit all mix in the same fast-moving business day.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-rose-700">
                High revenue &ne; clear profit.
              </div>
            </div>

            {/* 2. AGITATE */}
            <div className="p-7 sm:p-8 rounded-3xl bg-[#FDF9EE] border border-[#E6CF8B] space-y-4 flex flex-col justify-between shadow-xs hover:-translate-y-0.5 transition-transform duration-200">
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#996515] font-bold block">
                  02 &bull; Why It Hurts
                </span>
                <h3 className="text-2xl font-serif font-black text-[#0B1B32]">
                  Stopping to write slows the whole business
                </h3>
                <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
                  Busy SMEs cannot pause clients to type spreadsheets or chase notebooks. Uncounted expenses drain working capital, receivables get forgotten, and full weeks of effort still leave profit unclear.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-[#996515]">
                Every uncounted leak shrinks tomorrow&apos;s growth.
              </div>
            </div>

            {/* 3. SOLUTION */}
            <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0B1B32] via-[#102848] to-[#081324] text-white border border-[#D4AF37]/50 space-y-5 flex flex-col justify-between shadow-lg hover:-translate-y-0.5 transition-transform duration-200">
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#F5D061] font-bold block">
                  03 &bull; The Solution
                </span>
                <h3 className="text-2xl font-serif font-black text-white">
                  Instant financial clarity for any SME
                </h3>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  YuBiFLo adapts to your payment channels and workflow&mdash;tracking inflows, supplies, wages, rent, and credit automatically so owners see real earnings at a glance.
                </p>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => launchSolutionDemo("bloom_dashboard", "duka")}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#F5D061] to-[#E5B842] hover:from-[#FFE082] hover:to-[#F5D061] text-[#0B1B32] font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Experience Live — No Sign-Up</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => onOpenAuth ? onOpenAuth("signup") : handleStartOnboarding("A")}
                  className="text-xs font-semibold text-slate-300 hover:text-[#F5D061] underline underline-offset-4 cursor-pointer"
                >
                  Create Free Account
                </button>
              </div>
            </div>

          </div>

          {/* Outcome Guarantee Strip */}
          <div className="p-6 sm:p-8 rounded-3xl neuro-surface-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 text-[#0B1B32]">
            <div className="space-y-1.5">
              <div className="text-xs font-mono uppercase tracking-wider text-[#996515] font-bold">Zero Service Delay</div>
              <p className="text-xs sm:text-sm text-[#334155]">Keep serving clients fast&mdash;capture cash, mobile money, and voice effortlessly.</p>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-mono uppercase tracking-wider text-[#996515] font-bold">Protected Privacy</div>
              <p className="text-xs sm:text-sm text-[#334155]">Raw audio is discarded immediately; your SME numbers stay encrypted.</p>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-mono uppercase tracking-wider text-[#996515] font-bold">Real Margin Truth</div>
              <p className="text-xs sm:text-sm text-[#334155]">Separate supplies, inventory, staff wages, and rent from true net profit.</p>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-mono uppercase tracking-wider text-[#996515] font-bold">Confident Growth</div>
              <p className="text-xs sm:text-sm text-[#334155]">Know what to restock, who owes you, and what capital is safe to reinvest.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROBLEM SECTION                                                        */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-transparent">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#000000] tracking-tight">
              Busy all day. Still no clear numbers.
            </h2>
            <p className="text-base text-[#555555]">
              SMEs operate from dawn to dusk, yet by closing time the real financial picture slips away.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Problem 1 */}
            <div className="p-8 rounded-3xl neuro-surface-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E1ECF7] text-[#0B1B32] flex items-center justify-center font-bold border border-[#C8D9EA]">
                <AlertCircle size={22} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0B1B32]">
                Profit is a guess.
              </h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Cash on hand looks like earnings until suppliers, staff, or the landlord arrive. Without true cost and margin visibility, owners never know what is safely theirs to keep.
              </p>
            </div>

            {/* Problem 2 */}
            <div className="p-8 rounded-3xl neuro-surface-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF5E2] text-[#996515] flex items-center justify-center font-bold border border-[#E6CF8B]">
                <Users size={22} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0B1B32]">
                Debts get forgotten.
              </h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Scraps of paper tear and notebooks get misplaced. Regular clients take goods or services on credit, and by week&apos;s end nobody agrees on the exact balance.
              </p>
            </div>

            {/* Problem 3 */}
            <div className="p-8 rounded-3xl neuro-surface-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E1ECF7] text-[#0B1B32] flex items-center justify-center font-bold border border-[#C8D9EA]">
                <DollarSign size={22} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0B1B32]">
                Cash leaks.
              </h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Small transport fares, fuel top-ups, casual payouts, and personal withdrawals quietly drain an SME&apos;s working capital when every channel isn&apos;t tracked together.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SOLUTION SECTION (1, 2, 3 STEPS)                                       */}
      {/* ========================================================================= */}
      <section id="how-it-works-section" className="py-20 sm:py-28 bg-[#EDF4FB] border-t border-[#C8D9EA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#996515]">
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#0B1B32] tracking-tight">
              We do the counting. You grow the business.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="p-8 rounded-3xl neuro-surface-card space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0B1B32] text-[#F5D061] ring-2 ring-[#D4AF37]/40 flex items-center justify-center font-serif text-xl font-bold shadow-sm">
                1
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0B1B32]">
                Start your day
              </h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Lock your Cash, Mobile Money (Till, Paybill, Pochi, or Send Money), and optional Bank starting balances in seconds so every shilling earned today is clear.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl neuro-surface-card space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0B1B32] text-[#F5D061] ring-2 ring-[#D4AF37]/40 flex items-center justify-center font-serif text-xl font-bold shadow-sm">
                2
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0B1B32]">
                Run your business
              </h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Capture sales, supplier drops, operating costs, and customer credit hands-free across any channel&mdash;without pausing your team or slowing down service.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl neuro-surface-card space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0B1B32] text-[#F5D061] ring-2 ring-[#D4AF37]/40 flex items-center justify-center font-serif text-xl font-bold shadow-sm">
                3
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0B1B32]">
                Know your numbers
              </h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Review your live summary: true operating profit, receivables owed, supplier balances, and cash flow across every business branch or account.
              </p>
            </div>

          </div>

          {/* Trust line reminder */}
          <div className="mt-12 text-center">
            <span className="inline-flex items-center gap-2 text-sm text-[#0B1B32] font-medium bg-white/90 px-4 py-2 rounded-full border border-[#C8D9EA] shadow-2xs">
              <Shield size={16} className="text-[#C8962E]" />
              <span>We keep the numbers, not the conversations.</span>
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. VCR LIVE FEED TICKER (TURNS HEARD SALE INTO TRANSACTIONS)               */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-transparent border-t border-[#C8D9EA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          
          <div className="bg-white/95 rounded-3xl border border-[#C8D7E3] p-6 sm:p-10 shadow-lg space-y-6">
            
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
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsVoiceRecordingModalOpen(true)}
                  className="text-[#000000] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Try Voice Simulator here &rarr;</span>
                </button>
                <button
                  onClick={() => launchSolutionDemo("vcr_voice", "duka")}
                  className="px-3.5 py-1.5 rounded-full bg-[#0B1B32] text-[#F5D061] font-bold hover:bg-[#102848] transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Experience Live Voice Ledger (No Sign-Up) &rarr;</span>
                </button>
              </div>
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
      <section id="apps-section" className="py-20 sm:py-28 bg-[#EDF4FB] border-t border-[#C8D9EA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          
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
            <div className="inline-flex flex-wrap justify-center p-1.5 bg-white border border-[#e4e4e7] rounded-2xl shadow-xs gap-1.5">
              
              <button
                onClick={() => setSelectedBusinessType("duka")}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
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
                onClick={() => setSelectedBusinessType("eatery")}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedBusinessType === "eatery"
                    ? "bg-[#000000] text-white shadow-sm"
                    : "text-[#555555] hover:text-[#000000]"
                }`}
              >
                <Utensils size={15} />
                <span>Open Eatery &amp; Kiosk</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedBusinessType === "eatery" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}>
                  Available now
                </span>
              </button>

              <button
                onClick={() => setSelectedBusinessType("hardware")}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
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
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-serif font-bold text-[#000000]">
                      Good morning, Musa
                    </h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                      SAMPLE DATA
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Duka Space demo &bull; Break-bulk packaging, fast-moving restock velocity, and customer deni.
                  </p>
                </div>
                <button
                  onClick={() => launchSolutionDemo("bloom_dashboard", "duka")}
                  className="px-5 py-2 rounded-full bg-[#000000] hover:bg-[#171717] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Experience Duka Live (No Sign-Up)
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

          {/* TAB 1B: OPEN EATERY & ROADSIDE KIOSK LIVE SHELL */}
          {selectedBusinessType === "eatery" && (
            <div className="bg-white rounded-3xl border border-[#e4e4e7] p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-serif font-bold text-[#000000]">
                      Open Eatery &amp; Roadside Kiosk Shell
                    </h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-500/15 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      TRY LIVE WITHOUT SIGN-UP
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Built for roadside kiosks &amp; simple-structure eateries operating fast on cash &amp; mobile money turnover — zero counter delay.
                  </p>
                </div>
                <button
                  onClick={() => launchSolutionDemo("bloom_dashboard", "eatery")}
                  className="px-5 py-2 rounded-full bg-[#0B1B32] hover:bg-[#102848] text-[#F5D061] border border-[#D4AF37]/60 font-bold text-xs shadow-xs cursor-pointer shrink-0"
                >
                  Experience Open Eatery Live (No Sign-Up)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] font-bold text-[#666666]">1. Cash Portfolio</div>
                  <div className="text-base font-serif font-bold text-[#000000] mt-1">Fast Counter Cash</div>
                  <div className="text-[10px] text-[#555555] mt-1">Dawn cash lock &amp; instant change flow with zero queue delay</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] font-bold text-[#666666]">2. Mobile Money Channel</div>
                  <div className="text-base font-serif font-bold text-[#000000] mt-1">Pochi / Send Money / Till</div>
                  <div className="text-[10px] text-[#555555] mt-1">Configure Till, Paybill, Pochi la Biashara or Send Money</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EADBBD]">
                  <div className="text-[11px] font-bold text-[#996515]">3. Supply Side</div>
                  <div className="text-base font-serif font-bold text-[#996515] mt-1">Foodstuff, Viungo &amp; Fuel</div>
                  <div className="text-[10px] text-[#996515] mt-1">Meat, unga, tomatoes, spices, cooking oil &amp; charcoal/LPG</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e4e4e7]">
                  <div className="text-[11px] font-bold text-[#666666]">4. Kitchen Support</div>
                  <div className="text-base font-serif font-bold text-[#000000] mt-1">1&ndash;2 Staff &amp; Stall Rent</div>
                  <div className="text-[10px] text-[#555555] mt-1">Helper daily wages &amp; structure rent tracked in one clean ledger</div>
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
      <section id="projects-section" className="py-20 sm:py-28 bg-transparent border-t border-[#C8D9EA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="text-xs font-bold uppercase tracking-widest text-[#B8860B]">
              Field Evidence
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#000000] tracking-tight">
              See it working in real SMEs
            </h2>
            <p className="text-base text-[#555555]">
              Real Kenyan businesses&mdash;from roadside eateries and mini shops to growing counters&mdash;replacing notebooks and guesswork with effortless clarity.
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
                onClick={() => launchSolutionDemo("bloom_dashboard", "duka")}
                className="text-xs font-bold text-[#000000] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Experience live template in workspace (No Sign-Up)</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PRICING SECTION (6 MONTHS FREE + BASIC, PREMIUM, PLATINUM, ENTERPRISE) */}
      {/* ========================================================================= */}
      <section id="pricing-section" className="py-20 sm:py-28 bg-[#E4EEF8] border-t border-[#C8D9EA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 space-y-12">
          
          {/* Section Header + 6-Month Free Habit-Lock Anchor */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#996515]">
              Transparent SME Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#0B1B32] tracking-tight [text-wrap:balance]">
              Start free for 6 full months. Upgrade only when your numbers prove it.
            </h2>
            <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
              Every plan keeps <strong className="text-[#0B1B32] font-semibold">Cashflow &amp; Mobile Money channels 100% unlocked</strong> (Cash, M-Pesa Till, Paybill, Pochi, Send Money &amp; Bank)&mdash;because cashflow is the lifeblood of your business.
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className="pt-2 flex flex-col items-center gap-2">
              <div className="inline-flex items-center p-1 bg-white/90 border border-[#C8D9EA] rounded-full shadow-2xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    billingCycle === "monthly"
                      ? "bg-[#0B1B32] text-white shadow-xs"
                      : "text-[#475569] hover:text-[#0B1B32]"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    billingCycle === "annual"
                      ? "bg-[#0B1B32] text-[#F5D061] shadow-xs"
                      : "text-[#475569] hover:text-[#0B1B32]"
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FDF5E2] text-[#996515] border border-[#E6CF8B]">
                    2 Months Free (~17% Off)
                  </span>
                </button>
              </div>
              <span className="text-[11px] text-[#475569]">
                First <strong className="text-[#0B1B32]">180 days cost KSh 0</strong> &middot; Historical data stays yours forever even after trial
              </span>
            </div>
          </div>

          {/* 4-Column Pricing Tiers: Basic, Premium, Platinum, Enterprise */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* TIER 1: BASIC */}
            <div className="p-7 rounded-3xl neuro-surface-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-serif font-black text-[#0B1B32]">Basic</h3>
                  <span className="text-[10px] font-mono font-bold text-[#1E3A5F] bg-[#E8F1FA] px-2.5 py-0.5 rounded-full border border-[#C8D9EA]">
                    Solo Owner
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-[#475569]">KSh</span>
                    <span className="text-3xl font-serif font-black text-[#0B1B32] tabular-nums">
                      {billingCycle === "annual" ? "1,056" : "1,267"}
                    </span>
                    <span className="text-xs text-[#475569]">/month</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#996515] font-semibold mt-1 tabular-nums">
                    {billingCycle === "annual"
                      ? "Billed KSh 12,670/yr · Save KSh 2,534"
                      : "After 6 free months · ~KSh 42/day"}
                  </div>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">
                  Built for one kiosk, eatery, retail duka, or solo shop keeping daily inflows and stock clean.
                </p>

                <ul className="space-y-2.5 text-xs text-[#334155] pt-2 border-t border-[#E2ECF5]">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span><strong className="text-[#0B1B32]">Full Cash + Mobile Money + Bank</strong> channels unlocked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>1 Business workspace (Eatery, Duka, or SME shell)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>Dawn Lock float check &amp; Customer Deni ledger</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>Purchases, Supplier auto-merge &amp; profit insights</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth ? onOpenAuth("signup") : handleStartOnboarding("A")}
                className="w-full py-3 rounded-full bg-white hover:bg-[#F5F9FD] border-2 border-[#0B1B32] text-[#0B1B32] font-bold text-xs transition cursor-pointer"
              >
                Start 6 Months Free
              </button>
            </div>

            {/* TIER 2: PREMIUM (MOST POPULAR / VISUAL ANCHOR) */}
            <div className="p-7 rounded-3xl bg-gradient-to-br from-[#0B1B32] via-[#102848] to-[#081324] text-white border-2 border-[#D4AF37] shadow-[0_20px_50px_-14px_rgba(11,27,50,0.38)] flex flex-col justify-between space-y-6 relative hover:-translate-y-1 transition-transform duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-serif font-black text-white">Premium</h3>
                  <span className="text-[10px] font-mono font-bold text-[#0B1B32] bg-gradient-to-r from-[#F5D061] to-[#E5B842] px-2.5 py-0.5 rounded-full">
                    Most Popular
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-slate-300">KSh</span>
                    <span className="text-3xl font-serif font-black text-[#F5D061] tabular-nums">
                      {billingCycle === "annual" ? "2,723" : "3,267"}
                    </span>
                    <span className="text-xs text-slate-300">/month</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#F5D061]/90 font-semibold mt-1 tabular-nums">
                    {billingCycle === "annual"
                      ? "Billed KSh 32,670/yr · Save KSh 6,534"
                      : "After 6 free months · ~KSh 109/day"}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  For growing SMEs running fast counters, supplier deliveries, and up to 3 business branches.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-100 pt-2 border-t border-white/15">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#F5D061] shrink-0 mt-0.5" />
                    <span>Everything in Basic + <strong className="text-white">Full Payment Channels</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#F5D061] shrink-0 mt-0.5" />
                    <span>Unlimited Receipt OCR &amp; VCR Voice capture</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#F5D061] shrink-0 mt-0.5" />
                    <span>Full 3-Fold Double-Entry Supplier &amp; Customer Ledgers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#F5D061] shrink-0 mt-0.5" />
                    <span>Up to 3 businesses under one Gmail + staff seats</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth ? onOpenAuth("signup") : handleStartOnboarding("A")}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#F5D061] to-[#E5B842] hover:from-[#FFE082] hover:to-[#F5D061] text-[#0B1B32] font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Start 6 Months Free</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* TIER 3: PLATINUM */}
            <div className="p-7 rounded-3xl neuro-surface-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-serif font-black text-[#0B1B32]">Platinum</h3>
                  <span className="text-[10px] font-mono font-bold text-[#996515] bg-[#FDF5E2] px-2.5 py-0.5 rounded-full border border-[#E6CF8B]">
                    Multi-Branch
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-[#475569]">KSh</span>
                    <span className="text-3xl font-serif font-black text-[#0B1B32] tabular-nums">
                      {billingCycle === "annual" ? "6,473" : "7,767"}
                    </span>
                    <span className="text-xs text-[#475569]">/month</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#996515] font-semibold mt-1 tabular-nums">
                    {billingCycle === "annual"
                      ? "Billed KSh 77,670/yr · Save KSh 15,534"
                      : "After 6 free months · Unlimited Accounts"}
                  </div>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">
                  Built for multi-shop operators, retail managers, and client-account bookkeepers.
                </p>

                <ul className="space-y-2.5 text-xs text-[#334155] pt-2 border-t border-[#E2ECF5]">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>Everything in Premium + <strong className="text-[#0B1B32]">Full Payment Channels</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>Unlimited businesses &amp; client workspaces under 1 Gmail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>Proprietor-vs-Manager isolation &amp; encrypted vaults</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>Cross-branch analytics &amp; priority WhatsApp support</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth ? onOpenAuth("signup") : handleStartOnboarding("A")}
                className="w-full py-3 rounded-full neuro-cta-gold text-white font-bold text-xs cursor-pointer"
              >
                Start 6 Months Free
              </button>
            </div>

            {/* TIER 4: ENTERPRISE */}
            <div className="p-7 rounded-3xl neuro-surface-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-serif font-black text-[#0B1B32]">Enterprise</h3>
                  <span className="text-[10px] font-mono font-bold text-[#1E3A5F] bg-[#E8F1FA] px-2.5 py-0.5 rounded-full border border-[#C8D9EA]">
                    Chains &amp; Fleet
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-serif font-black text-[#0B1B32]">
                      Custom
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#475569] font-semibold mt-1">
                    Tailored rollout &amp; volume terms
                  </div>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">
                  For wholesale chains, distributors, hardware networks, and cooperative SME groups.
                </p>

                <ul className="space-y-2.5 text-xs text-[#334155] pt-2 border-t border-[#E2ECF5]">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>Unrestricted Cash, Mobile Money &amp; Bank rails</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>Custom industry workflows &amp; branch templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>Dedicated onboarding &amp; domain/cloud migration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
                    <span>SLA uptime guarantee &amp; executive reporting</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setWaitlistModalApp("Enterprise Custom Rollout")}
                className="w-full py-3 rounded-full bg-[#EEF4FB] hover:bg-[#E1ECF7] border border-[#9BB6D3] hover:border-[#D4AF37] text-[#0B1B32] font-bold text-xs transition cursor-pointer"
              >
                Request Custom Plan
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQ SECTION (ANSWERS: WHAT VCR CAPTURES, WHAT IS DELETED, WHO CAN SEE) */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[#EDF4FB] border-t border-[#C8D9EA]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 space-y-10">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif font-black text-[#000000] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              Clear answers about privacy, voice capture, and your numbers.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* FAQ 1: What VCR captures */}
            <div className="p-6 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] space-y-2">
              <h3 className="text-base font-serif font-bold text-[#000000] flex items-center gap-2">
                <HelpCircle size={17} className="text-[#000000]" />
                What does VCR capture?
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
                VCR only extracts the financial numbers of the transaction: the item or service name, the quantity, the amount paid, and whether it was settled in cash, mobile money, or customer credit (Deni). It turns everyday business speech into clear numbers.
              </p>
            </div>

            {/* FAQ 2: What is deleted */}
            <div className="p-6 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] space-y-2">
              <h3 className="text-base font-serif font-bold text-[#000000] flex items-center gap-2">
                <HelpCircle size={17} className="text-[#000000]" />
                What is deleted?
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
                All voice audio is immediately deleted once the transaction numbers are written to your ledger. We keep the numbers, not the conversations. Your counter talks, personal chats, and customer conversations are never saved, stored, or sent to any server.
              </p>
            </div>

            {/* FAQ 3: Who can see my data */}
            <div className="p-6 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] space-y-2">
              <h3 className="text-base font-serif font-bold text-[#000000] flex items-center gap-2">
                <HelpCircle size={17} className="text-[#000000]" />
                Who can see my data?
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
                Only you. Each business operates inside its own isolated, password-gated vault protected by your passcode. Your customer credit, margins, and sales numbers are your private property and are never shared or made public.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. BOLD MISSION CLAIM (USING NUMBERS TO AID MSME SCALE & GROWTH)         */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#E4EEF8] border-t border-[#C8D9EA]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="rounded-3xl bg-gradient-to-br from-[#081426] via-[#0E223D] to-[#0B1B32] text-white border-2 border-[#D4AF37]/65 shadow-[0_28px_65px_-16px_rgba(11,27,50,0.45)] p-8 sm:p-12 lg:p-16 text-center space-y-6 relative overflow-hidden">
            <div className="text-xs font-bold uppercase tracking-widest text-[#F5D061]">
              Our Bold Commitment
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-black text-white tracking-tight leading-[1.14] [text-wrap:balance] max-w-4xl mx-auto">
              Our aim is to use numbers to aid{" "}
              <span className="italic text-[#F5D061]">MSMEs achieve scale and growth</span>.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Every shilling captured across cash, mobile money, supplies, wages, and credit becomes working capital protected, sharper margins, and verifiable financial proof so neighborhood businesses grow into lasting enterprises.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => onOpenAuth ? onOpenAuth("signup") : handleStartOnboarding("A")}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#F5D061] to-[#E5B842] hover:from-[#FFE082] hover:to-[#F5D061] text-[#0B1B32] font-bold text-xs sm:text-sm shadow-lg transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Start 6 Months Free</span>
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => launchSolutionDemo("bloom_dashboard", "duka")}
                className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/25 hover:border-[#F5D061] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Sparkles size={15} className="text-[#F5D061]" />
                <span>Experience Live — No Sign-Up</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="bg-[#09090b] text-slate-300 py-16 border-t border-[#000000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Logo and signature */}
            <div className="space-y-3">
              <YuBiFloLogo size="md" variant="light" />
              <p className="text-xs text-slate-300 font-medium leading-relaxed mt-2">
                Our aim is to use numbers to aid MSMEs achieve scale and growth.
              </p>
              <p className="text-[11px] text-slate-500">
                No notebooks. No typing. Just know your numbers.
              </p>
            </div>

            {/* Business Apps */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Business Apps</div>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={() => launchSolutionDemo("bloom_dashboard", "duka")} className="hover:text-white transition cursor-pointer">Duka &amp; Retail (Try Live)</button></li>
                <li><button onClick={() => launchSolutionDemo("bloom_dashboard", "eatery")} className="hover:text-white transition cursor-pointer">Open Eatery &amp; Roadside Kiosk (Try Live)</button></li>
                <li><button onClick={() => setWaitlistModalApp("Hardware & Construction")} className="hover:text-white transition cursor-pointer">Hardware (Coming next)</button></li>
                <li><button onClick={() => setWaitlistModalApp("Wholesale & Distribution")} className="hover:text-white transition cursor-pointer">Wholesale (Coming soon)</button></li>
              </ul>
            </div>

            {/* Product Features */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Features</div>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={() => setIsVoiceRecordingModalOpen(true)} className="hover:text-white transition cursor-pointer">Voice Simulator</button></li>
                <li><button onClick={() => launchSolutionDemo("daily_cash", "duka")} className="hover:text-white transition cursor-pointer">Dawn Till Float Lock</button></li>
                <li><button onClick={() => launchSolutionDemo("credit_deni", "duka")} className="hover:text-white transition cursor-pointer">Customer Credit &amp; Deni</button></li>
                <li><button onClick={() => document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-[#F5D061] transition cursor-pointer">6-Month Free &amp; Pricing</button></li>
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
              <button onClick={() => onOpenAuth ? onOpenAuth("signin") : handleLaunchWorkspace()} className="hover:text-white cursor-pointer">Sign in</button>
              <button onClick={() => onOpenAuth ? onOpenAuth("signup") : handleLaunchWorkspace()} className="hover:text-white cursor-pointer">Sign up</button>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 10B. COMPREHENSIVE PRD VIEWER MODAL                                       */}
      {/* ========================================================================= */}
      {isPrdModalOpen && (
        <Suspense fallback={null}>
          <PrdViewerModal
            isOpen={isPrdModalOpen}
            onClose={() => setIsPrdModalOpen(false)}
            onLaunchWorkspace={handleLaunchWorkspace}
          />
        </Suspense>
      )}

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
                  <div className="text-[11px] text-[#262626] font-normal mt-0.5">We have registered your business request for {waitlistModalApp}.</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#444444] block mb-1">
                    Your Name / Business Owner Name
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
                Launch VCR in Workspace &rarr;
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
      {isEngineeringLabOpen && (
        <Suspense fallback={null}>
          <EngineeringLabModal
            isOpen={isEngineeringLabOpen}
            onClose={() => setIsEngineeringLabOpen(false)}
            onLaunchWorkspace={handleLaunchWorkspace}
          />
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* 14. ONBOARDING MODAL (TWO PATHS, ONE DASHBOARD)                           */}
      {/* ========================================================================= */}
      {isOnboardingOpen && (
        <Suspense fallback={null}>
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={() => setIsOnboardingOpen(false)}
            initialPath={onboardingInitialPath}
            onCompleteOnboarding={(customState) => {
              if (onCompleteOnboarding) {
                onCompleteOnboarding(customState);
              }
              handleLaunchWorkspace();
            }}
          />
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* 15. STICKY BOTTOM BAR ON MOBILE (AS MANDATED)                             */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#000000]/95 backdrop-blur-md border-t border-[#27272a] px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-xs font-black font-serif text-white tracking-tight">YuBiFLo VCR</span>
          <span className="text-[10px] text-[#FFD54F] font-mono">Zero data entry</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => launchSolutionDemo("bloom_dashboard", "duka")}
            className="px-3 py-2 rounded-full border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Try Live
          </button>
          <button
            onClick={() => onOpenAuth ? onOpenAuth("signup") : handleStartOnboarding("A")}
            className="px-4 py-2 rounded-full bg-[#FFD54F] hover:bg-[#FFE082] text-[#000000] font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>Meet Your Biz</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

    </div>
  );
}
