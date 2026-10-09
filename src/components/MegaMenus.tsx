import React, { useState, useEffect, useRef } from "react";
import { 
  Check, ChevronDown, ArrowRight, Mic, Scale, TrendingUp, 
  Layers, Users, Truck, Sparkles, Smartphone, Download, 
  Store, Wrench, Shield, ShoppingBag, FileSpreadsheet,
  Camera, BarChart3, HelpCircle, ChevronRight, Phone
} from "lucide-react";

export type BlueprintStatus = "available" | "next" | "soon" | "request";

export interface SolutionItem {
  id: string;
  title: string;
  description: string;
  status: BlueprintStatus;
  statusLabel?: string;
  icon: any;
  action?: () => void;
}

export interface SolutionGroup {
  name: string;
  items: SolutionItem[];
}

export interface BusinessTypeItem {
  name: string;
  status: BlueprintStatus;
  category: "shops" | "food" | "making" | "other";
  categoryLabel: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// BADGE STYLING: EXACT SPECIFICATIONS
// Available now: solid green
// Coming next: gold outline
// Coming soon: soft grey
// Request it: plain text link style
// ---------------------------------------------------------------------------
export function BlueprintStatusBadge({ 
  status, 
  customLabel 
}: { 
  status: BlueprintStatus; 
  customLabel?: string;
}) {
  if (status === "available") {
    return (
      <span className="bg-[#000000] text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0">
        {customLabel || "Available now"}
      </span>
    );
  }

  if (status === "next") {
    return (
      <span className="border border-[#B8860B] text-[#996515] bg-[#FAF6EE] px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0">
        {customLabel || "Coming next"}
      </span>
    );
  }

  if (status === "soon") {
    return (
      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide shrink-0">
        {customLabel || "Coming soon"}
      </span>
    );
  }

  // Request it: plain text link style
  return (
    <span className="text-[#000000] text-[11px] font-medium hover:underline inline-flex items-center gap-0.5 shrink-0">
      {customLabel || "Request it"} &rarr;
    </span>
  );
}

// ---------------------------------------------------------------------------
// MASTER CONFIG: SOLUTIONS & CAPABILITIES
// ---------------------------------------------------------------------------
export const SOLUTIONS_CONFIG: SolutionGroup[] = [
  {
    name: "Know your numbers",
    items: [
      {
        id: "daily_cash",
        title: "Daily cash check",
        description: "Opening till & M-Pesa float locked at dawn, closing cash checked, gaps explained.",
        status: "available",
        icon: Scale
      },
      {
        id: "profit_summary",
        title: "Profit and loss summary",
        description: "Plain-language weekly summary of real gross margins after true product COGS.",
        status: "available",
        icon: TrendingUp
      },
      {
        id: "bloom_dashboard",
        title: "Business Bloom dashboard",
        description: "5 vital signs of financial health (profit, cash, debts, stock, suppliers).",
        status: "available",
        icon: Sparkles
      }
    ]
  },
  {
    name: "Capture without typing",
    items: [
      {
        id: "vcr_voice",
        title: "VCR voice capture",
        description: "Listens at the counter and turns Swahili/English speech into structured sales.",
        status: "available",
        statusLabel: "Available now, free",
        icon: Mic
      },
      {
        id: "mpesa_import",
        title: "M-Pesa statement import",
        description: "Independent cross-check and day-one backfill that gives instant history.",
        status: "available",
        icon: Smartphone
      },
      {
        id: "supplier_photo",
        title: "Supplier invoice photo",
        description: "Automatic manifest reading when milk, bread and soda crates arrive.",
        status: "soon",
        icon: Camera
      }
    ]
  },
  {
    name: "Stay in control",
    items: [
      {
        id: "credit_deni",
        title: "Credit and Deni tracker",
        description: "Track customer neighbor debts and trigger 1-tap polite WhatsApp payment reminders.",
        status: "available",
        icon: Users
      },
      {
        id: "restock_engine",
        title: "Stock and restock engine",
        description: "Restock-triggered accounting: batch arrivals prove previous batch cleared.",
        status: "available",
        icon: Layers
      },
      {
        id: "supplier_ranking",
        title: "Supplier & customer ranking",
        description: "Identify most reliable wholesale distributors and highest-margin buyers.",
        status: "available",
        icon: Truck
      }
    ]
  },
  {
    name: "Coming later",
    items: [
      {
        id: "forecasts",
        title: "Forecasts",
        description: "Gated forecasting unlocked after 14 days of clean verified trading data.",
        status: "soon",
        icon: BarChart3
      },
      {
        id: "benchmarks",
        title: "Benchmarks against similar shops",
        description: "Consented, anonymized performance metrics compared to nearby retailers.",
        status: "soon",
        icon: HelpCircle
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// MASTER CONFIG: BUSINESS TYPES
// ---------------------------------------------------------------------------
export const BUSINESS_TYPES_CONFIG: BusinessTypeItem[] = [
  // Shops and trade
  { name: "Duka and kiosk", status: "available", category: "shops", categoryLabel: "Shops and trade", description: "Counter till, M-Pesa float, FMCG pack breaks" },
  { name: "Mini-supermarket", status: "available", category: "shops", categoryLabel: "Shops and trade", description: "Multi-aisle fast checkout, barcodes and dairy crates" },
  { name: "Hardware", status: "next", category: "shops", categoryLabel: "Shops and trade", description: "Cement bags, contractor debt ledgers, timber feet" },
  { name: "Wholesale", status: "soon", category: "shops", categoryLabel: "Shops and trade", description: "Truck manifests, 90kg grain bags, depot shrinkage" },
  { name: "Agrovet", status: "soon", category: "shops", categoryLabel: "Shops and trade", description: "Seeds, animal feeds, seasonal fertilizer credit" },
  { name: "Butchery", status: "soon", category: "shops", categoryLabel: "Shops and trade", description: "Carcass weight breakdown, cold storage loss" },
  { name: "Gas and water dealer", status: "soon", category: "shops", categoryLabel: "Shops and trade", description: "Cylinder deposit tracking, refill route logs" },
  { name: "Electronics and phone accessories", status: "soon", category: "shops", categoryLabel: "Shops and trade", description: "Warranty serials, high-ticket repairs" },

  // Food and services
  { name: "Eatery and bakery", status: "soon", category: "food", categoryLabel: "Food and services", description: "Flour batch yields, daily perishable sales" },
  { name: "M-Pesa agent", status: "request", category: "food", categoryLabel: "Food and services", description: "Float balancing, commissions, bank float sweeps" },
  { name: "Salon & Barber", status: "request", category: "food", categoryLabel: "Food and services", description: "Chair commission splits, product usage" },
  { name: "Cyber cafe", status: "request", category: "food", categoryLabel: "Food and services", description: "Printing reams, time tracking, stationery" },
  { name: "Tailor", status: "request", category: "food", categoryLabel: "Food and services", description: "Fabric deposits, bespoke customer fittings" },
  { name: "Laundry & Dry Cleaner", status: "request", category: "food", categoryLabel: "Food and services", description: "Drop-off tags, garment claims, detergent stock" },

  // Making and farming
  { name: "Jua kali maker", status: "request", category: "making", categoryLabel: "Making and farming", description: "Scrap metal raw materials, fabrication deposits" },
  { name: "Farming and dairy", status: "request", category: "making", categoryLabel: "Making and farming", description: "Morning milk collection, feed expenses, coop payouts" },

  // Other
  { name: "Transport (Matatu / Boda)", status: "request", category: "other", categoryLabel: "Other", description: "Daily driver stage targets, fuel receipts, police levy" },
  { name: "Private school", status: "request", category: "other", categoryLabel: "Other", description: "Term fee installment plans, lunch fees, teacher payroll" },
  { name: "Clinic and chemist", status: "request", category: "other", categoryLabel: "Other", description: "Medication batch expiries, patient prescriptions" }
];

// Helper to get total request counts stored in localStorage
export function getSavedRequestCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem("yubiflo_blueprint_requests");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return {
    "Hardware": 14,
    "Wholesale": 22,
    "Agrovet": 18,
    "M-Pesa agent": 31,
    "Eatery and bakery": 12,
    "Transport": 9
  };
}

export function recordBlueprintRequest(businessName: string) {
  try {
    const counts = getSavedRequestCounts();
    counts[businessName] = (counts[businessName] || 0) + 1;
    localStorage.setItem("yubiflo_blueprint_requests", JSON.stringify(counts));
  } catch (e) {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// 1. SOLUTIONS MEGA-MENU DROPDOWN (DESKTOP)
// ---------------------------------------------------------------------------
export function SolutionsMegaMenu({
  isOpen,
  onClose,
  onSelectSolution,
  onLaunchWorkspace,
  onRequestSetup
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectSolution: (solutionId: string) => void;
  onLaunchWorkspace: () => void;
  onRequestSetup: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute top-full left-0 right-0 mt-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-[#e4e4e7] p-6 lg:p-8 text-[#222222] grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Solutions Grid (9 cols) */}
        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SOLUTIONS_CONFIG.map((group) => (
            <div key={group.name} className="space-y-4">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B8860B] border-b border-[#e5e7eb] pb-2">
                {group.name}
              </div>

              <div className="space-y-3">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSolution(item.id);
                        onClose();
                      }}
                      className="w-full text-left p-2.5 rounded-2xl hover:bg-[#f4f4f5] transition group flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#f4f4f5] text-[#000000] group-hover:bg-[#000000] group-hover:text-white transition flex items-center justify-center shrink-0">
                            <Icon size={13} />
                          </div>
                          <span className="text-xs font-bold text-[#000000] group-hover:text-[#171717] leading-tight">
                            {item.title}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#666666] leading-relaxed line-clamp-2 pl-8">
                        {item.description}
                      </p>

                      <div className="pl-8 pt-0.5">
                        <BlueprintStatusBadge 
                          status={item.status} 
                          customLabel={item.statusLabel}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right-Hand Promo Card (3 cols) */}
        <div className="lg:col-span-3 bg-gradient-to-br from-[#fafafa] to-[#F2F7F4] border border-[#e4e4e7] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f4f5] text-[#000000] text-[10px] font-bold">
              <Sparkles size={11} className="text-[#B8860B]" />
              <span>Free Starter Tool</span>
            </div>

            <h4 className="font-serif font-black text-lg text-[#000000] leading-snug">
              Start free with VCR
            </h4>

            <p className="text-xs text-[#555555] leading-relaxed">
              No typing needed. Just tell YuBiFlo what was sold across the counter.
            </p>

            {/* Mini visual mockup of looping dashboard */}
            <div className="p-3 bg-white rounded-xl border border-[#e4e4e7] shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#666666]">
                <span>Today&apos;s Sales</span>
                <span className="text-[#000000] font-bold">KSh 14,820</span>
              </div>
              <div className="h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                <div className="h-full bg-[#000000] w-3/4 rounded-full" />
              </div>
              <div className="text-[10px] text-[#996515] flex items-center justify-between">
                <span>Owed to you (Deni)</span>
                <span className="font-bold">KSh 4,320</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#e4e4e7]">
            <button
              onClick={() => {
                onClose();
                onLaunchWorkspace();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#000000] hover:bg-[#171717] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Start free with VCR</span>
              <ArrowRight size={13} />
            </button>

            <button
              onClick={() => {
                onClose();
                onRequestSetup();
              }}
              className="w-full text-center text-xs text-[#996515] hover:text-[#7A5210] font-semibold hover:underline block pt-1 cursor-pointer"
            >
              Want it set up for you? &rarr;
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. BUSINESS TYPES MEGA-MENU DROPDOWN (DESKTOP)
// ---------------------------------------------------------------------------
export function BusinessTypesMegaMenu({
  isOpen,
  onClose,
  onSelectAvailableType,
  onOpenWaitlist
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectAvailableType: (name: string) => void;
  onOpenWaitlist: (name: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | "available" | "soon" | "request">("all");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items
  const filteredItems = BUSINESS_TYPES_CONFIG.filter((item) => {
    if (filter === "all") return true;
    if (filter === "available") return item.status === "available";
    if (filter === "soon") return item.status === "next" || item.status === "soon";
    if (filter === "request") return item.status === "request";
    return true;
  });

  const categories: { key: "shops" | "food" | "making" | "other"; title: string }[] = [
    { key: "shops", title: "Shops and trade" },
    { key: "food", title: "Food and services" },
    { key: "making", title: "Making and farming" },
    { key: "other", title: "Other" }
  ];

  return (
    <div 
      ref={menuRef}
      className="absolute top-full left-0 right-0 mt-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-[#e4e4e7] p-6 lg:p-8 text-[#222222] space-y-6">
        
        {/* Header & Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B8860B]">
              Industry Blueprints
            </div>
            <h3 className="text-xl font-serif font-black text-[#000000]">
              Business types
            </h3>
          </div>

          {/* Filter chips: All, Available now, Coming soon, Request it */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#666666] mr-1 hidden sm:inline">Show:</span>
            {[
              { id: "all", label: "All" },
              { id: "available", label: "Available now" },
              { id: "soon", label: "Coming soon / next" },
              { id: "request", label: "Request it" }
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  filter === chip.id
                    ? "bg-[#000000] text-white shadow-xs"
                    : "bg-[#f4f4f5] text-[#444444] hover:bg-[#f4f4f5]"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Columns for Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const catItems = filteredItems.filter((i) => i.category === cat.key);
            if (catItems.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-3">
                <div className="text-xs font-bold font-serif text-[#000000] border-b border-[#e5e7eb] pb-1.5">
                  {cat.title}
                </div>

                <div className="space-y-2">
                  {catItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        onClose();
                        if (item.status === "available") {
                          onSelectAvailableType(item.name);
                        } else {
                          onOpenWaitlist(item.name);
                        }
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-[#f4f4f5] transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-[#222222] group-hover:text-[#000000] truncate">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-[10px] text-[#777777] truncate">
                            {item.description}
                          </div>
                        )}
                      </div>

                      <BlueprintStatusBadge status={item.status} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom row link */}
        <div className="pt-4 border-t border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#666666]">
          <span>Every blueprint deploys with custom currency, shelf taxonomy, and hands-free VCR listening.</span>
          <button
            onClick={() => {
              onClose();
              onOpenWaitlist("Custom / Other Business Type");
            }}
            className="text-xs font-bold text-[#000000] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Don&apos;t see your business? Tell us</span>
            <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. RESOURCES DROPDOWN (DESKTOP)
// ---------------------------------------------------------------------------
export function ResourcesDropdown({
  isOpen,
  onClose,
  onOpenPRD,
  onOpenEngineeringLab,
  onOpenHowItWorks,
  onOpenProjects,
  onToggleLanguage,
  language = "en"
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenPRD: () => void;
  onOpenEngineeringLab: () => void;
  onOpenHowItWorks: () => void;
  onOpenProjects: () => void;
  onToggleLanguage: () => void;
  language?: "en" | "sw";
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-80 bg-white rounded-2xl shadow-xl border border-[#e4e4e7] p-3 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-xs text-[#222222]"
    >
      <button
        onClick={() => {
          onClose();
          onOpenPRD();
        }}
        className="w-full text-left p-2.5 rounded-xl hover:bg-[#f4f4f5] transition flex items-center justify-between cursor-pointer"
      >
        <div>
          <div className="font-bold text-[#000000]">PRD Document &amp; Flow</div>
          <div className="text-[11px] text-[#666666]">Official specifications &amp; user journey</div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f4f4f5] text-[#000000] font-bold">
          v2.4
        </span>
      </button>

      <button
        onClick={() => {
          onClose();
          onOpenEngineeringLab();
        }}
        className="w-full text-left p-2.5 rounded-xl hover:bg-[#f4f4f5] transition flex items-center justify-between cursor-pointer"
      >
        <div>
          <div className="font-bold text-[#222222]">Engineering Lab</div>
          <div className="text-[11px] text-[#666666]">Schemas, reconciliation &amp; double-entry accounts</div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF6EE] text-[#996515] font-bold">
          Partners
        </span>
      </button>

      <button
        onClick={() => {
          onClose();
          onOpenHowItWorks();
        }}
        className="w-full text-left p-2.5 rounded-xl hover:bg-[#f4f4f5] transition flex items-center justify-between cursor-pointer"
      >
        <div>
          <div className="font-bold text-[#222222]">How It Works Guide</div>
          <div className="text-[11px] text-[#666666]">1 Dawn float, 2 Midday VCR, 3 Evening audit</div>
        </div>
      </button>

      <button
        onClick={() => {
          onClose();
          onOpenProjects();
        }}
        className="w-full text-left p-2.5 rounded-xl hover:bg-[#f4f4f5] transition flex items-center justify-between cursor-pointer"
      >
        <div>
          <div className="font-bold text-[#222222]">Project #1 Case Study</div>
          <div className="text-[11px] text-[#666666]">Field evidence from live Kenyan shop</div>
        </div>
      </button>

      <div className="pt-2 border-t border-[#e5e7eb] flex items-center justify-between px-2">
        <span className="text-[11px] text-[#666666]">Language Toggle:</span>
        <button
          onClick={() => {
            onToggleLanguage();
          }}
          className="px-2.5 py-1 rounded-lg bg-[#fafafa] border border-[#e4e4e7] hover:border-[#000000] font-mono font-bold text-[11px] text-[#000000] transition cursor-pointer"
        >
          {language === "en" ? "🇰🇪 Swahili / Sheng" : "🇬🇧 English"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. MOBILE ACCORDIONS FOR NAVIGATION
// ---------------------------------------------------------------------------
export function MobileNavAccordions({
  isOpen,
  onClose,
  onLaunchWorkspace,
  onOpenPRD,
  onOpenEngineeringLab,
  onOpenWaitlist,
  onToggleLanguage,
  language = "en"
}: {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWorkspace: () => void;
  onOpenPRD: () => void;
  onOpenEngineeringLab: () => void;
  onOpenWaitlist: (name: string) => void;
  onToggleLanguage: () => void;
  language?: "en" | "sw";
}) {
  const [solutionsExpanded, setSolutionsExpanded] = useState(false);
  const [businessExpanded, setBusinessExpanded] = useState(false);
  const [resourcesExpanded, setResourcesExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white border-b border-[#e5e7eb] px-5 py-4 space-y-4 text-xs font-medium animate-in slide-in-from-top-2">
      
      {/* Solutions Accordion */}
      <div className="border border-[#e4e4e7] rounded-2xl overflow-hidden">
        <button
          onClick={() => setSolutionsExpanded(!solutionsExpanded)}
          className="w-full p-3.5 bg-[#fafafa] flex items-center justify-between text-left font-bold text-[#000000]"
        >
          <span>Solutions</span>
          <ChevronDown size={16} className={`transition-transform ${solutionsExpanded ? "rotate-180" : ""}`} />
        </button>

        {solutionsExpanded && (
          <div className="p-3 bg-white space-y-3 divide-y divide-[#F0F5F2]">
            {SOLUTIONS_CONFIG.map((group) => (
              <div key={group.name} className="pt-2 first:pt-0 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-[#B8860B] font-bold">
                  {group.name}
                </div>
                {group.items.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      onClose();
                      onLaunchWorkspace();
                    }}
                    className="py-1 flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[#222222] font-semibold">{item.title}</span>
                    <BlueprintStatusBadge status={item.status} customLabel={item.statusLabel} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Business Types Accordion */}
      <div className="border border-[#e4e4e7] rounded-2xl overflow-hidden">
        <button
          onClick={() => setBusinessExpanded(!businessExpanded)}
          className="w-full p-3.5 bg-[#fafafa] flex items-center justify-between text-left font-bold text-[#000000]"
        >
          <span>Business types</span>
          <ChevronDown size={16} className={`transition-transform ${businessExpanded ? "rotate-180" : ""}`} />
        </button>

        {businessExpanded && (
          <div className="p-3 bg-white space-y-2 max-h-64 overflow-y-auto">
            {BUSINESS_TYPES_CONFIG.map((b) => (
              <div
                key={b.name}
                onClick={() => {
                  onClose();
                  if (b.status === "available") onLaunchWorkspace();
                  else onOpenWaitlist(b.name);
                }}
                className="py-1.5 flex items-center justify-between border-b border-[#f4f4f5] last:border-none cursor-pointer"
              >
                <span className="text-[#333333] font-medium">{b.name}</span>
                <BlueprintStatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resources Accordion */}
      <div className="border border-[#e4e4e7] rounded-2xl overflow-hidden">
        <button
          onClick={() => setResourcesExpanded(!resourcesExpanded)}
          className="w-full p-3.5 bg-[#fafafa] flex items-center justify-between text-left font-bold text-[#000000]"
        >
          <span>Resources &amp; Specs</span>
          <ChevronDown size={16} className={`transition-transform ${resourcesExpanded ? "rotate-180" : ""}`} />
        </button>

        {resourcesExpanded && (
          <div className="p-3 bg-white space-y-2">
            <button
              onClick={() => {
                onClose();
                onOpenPRD();
              }}
              className="w-full text-left py-1 text-[#000000] font-bold"
            >
              PRD Document &amp; Client Journey &rarr;
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenEngineeringLab();
              }}
              className="w-full text-left py-1 text-[#222222] font-semibold"
            >
              Engineering Lab (for partners) &rarr;
            </button>
            <button
              onClick={() => {
                onToggleLanguage();
              }}
              className="w-full text-left py-1 text-[#996515] font-semibold"
            >
              Switch Language ({language === "en" ? "Kiswahili" : "English"})
            </button>
          </div>
        )}
      </div>

      {/* Main Bottom Buttons */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          onClick={() => {
            onClose();
            onLaunchWorkspace();
          }}
          className="w-full py-2.5 rounded-full border border-[#000000] text-[#000000] font-bold text-center"
        >
          Client Log in (Passcode 8496)
        </button>
        <button
          onClick={() => {
            onClose();
            onLaunchWorkspace();
          }}
          className="w-full py-3 rounded-full bg-[#000000] text-white font-bold text-center shadow-sm"
        >
          Start free with VCR
        </button>
      </div>

    </div>
  );
}
