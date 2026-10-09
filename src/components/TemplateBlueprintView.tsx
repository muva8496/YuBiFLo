import React, { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Plus,
  Settings,
  Sparkles,
  Store,
  Wrench,
  Pill,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  ArrowRight,
  X,
  RefreshCw,
  Coins,
  ShieldCheck,
  Zap,
} from "lucide-react";

export type BlueprintId = "retail_fmcg" | "hardware_bulk" | "pharmacy";

interface TemplateBlueprintViewProps {
  initialBlueprint?: BlueprintId;
  onBackToAgency: () => void;
  onLaunchClientProject: () => void;
}

interface BlueprintConfig {
  id: BlueprintId;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  currency: string;
  categories: string[];
  unitTypes: string[];
  pipelineRules: {
    restockTriggerAutoClose: boolean;
    voiceNlp: boolean;
    ocrBills: boolean;
    reconciliationThresholdKes: number;
    defaultMarkupPct: number;
  };
  sampleStarterItems: Array<{
    name: string;
    category: string;
    unit_type: string;
    unit_cost: number;
    unit_retail: number;
  }>;
}

const BLUEPRINTS: Record<BlueprintId, BlueprintConfig> = {
  retail_fmcg: {
    id: "retail_fmcg",
    name: "FMCG Retail Duka",
    tagline: "High-velocity estate kiosks, general shops & mini-marts",
    icon: <Store className="w-5 h-5 text-emerald-400" />,
    currency: "KSh",
    categories: ["Dairy", "Flour", "Cooking Oils", "Bakery", "Poultry", "Sugar", "Spices", "Hygiene", "Beverages"],
    unitTypes: ["packets", "bales", "bottles", "crates", "loaves", "kg", "pieces"],
    pipelineRules: {
      restockTriggerAutoClose: true,
      voiceNlp: true,
      ocrBills: false,
      reconciliationThresholdKes: 200,
      defaultMarkupPct: 20.1,
    },
    sampleStarterItems: [
      { name: "Brookside Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 55, unit_retail: 65 },
      { name: "Unga Jogoo 2kg Bale", category: "Flour", unit_type: "bales", unit_cost: 1850, unit_retail: 2100 },
      { name: "Rina Cooking Oil 1L", category: "Cooking Oils", unit_type: "bottles", unit_cost: 280, unit_retail: 330 },
    ],
  },
  hardware_bulk: {
    id: "hardware_bulk",
    name: "Construction Hardware",
    tagline: "Bulk building materials, timber, steel & agro-vets",
    icon: <Wrench className="w-5 h-5 text-amber-400" />,
    currency: "KSh",
    categories: ["Cement & Aggregates", "Timber & Boards", "Steel & Iron", "Plumbing", "Paints", "Tools & Fasteners"],
    unitTypes: ["bags (50kg)", "meters", "sheets", "tins (4L)", "pieces", "kg", "rolls"],
    pipelineRules: {
      restockTriggerAutoClose: true,
      voiceNlp: false,
      ocrBills: true,
      reconciliationThresholdKes: 1500,
      defaultMarkupPct: 15.5,
    },
    sampleStarterItems: [
      { name: "Bamburi Tembo Cement 50kg", category: "Cement & Aggregates", unit_type: "bags (50kg)", unit_cost: 680, unit_retail: 750 },
      { name: "Cypress Timber 2x2", category: "Timber & Boards", unit_type: "meters", unit_cost: 42, unit_retail: 58 },
      { name: "Corrugated Iron Sheets G28", category: "Steel & Iron", unit_type: "sheets", unit_cost: 850, unit_retail: 1050 },
    ],
  },
  pharmacy: {
    id: "pharmacy",
    name: "Community Pharmacy",
    tagline: "Retail chemists, prescription dispensaries & health supplies",
    icon: <Pill className="w-5 h-5 text-cyan-400" />,
    currency: "KSh",
    categories: ["Antibiotics", "Pain Relief", "Pediatrics", "First Aid", "Supplements", "Chronic Care"],
    unitTypes: ["strips", "bottles", "boxes", "ampoules", "tubes", "pieces"],
    pipelineRules: {
      restockTriggerAutoClose: true,
      voiceNlp: true,
      ocrBills: true,
      reconciliationThresholdKes: 100,
      defaultMarkupPct: 35.0,
    },
    sampleStarterItems: [
      { name: "Amoxicillin 500mg (10x10)", category: "Antibiotics", unit_type: "boxes", unit_cost: 320, unit_retail: 450 },
      { name: "Panadol Extra 100s", category: "Pain Relief", unit_type: "boxes", unit_cost: 420, unit_retail: 550 },
      { name: "Cetirizine Syrup 60ml", category: "Pediatrics", unit_type: "bottles", unit_cost: 110, unit_retail: 160 },
    ],
  },
};

export default function TemplateBlueprintView({
  initialBlueprint = "retail_fmcg",
  onBackToAgency,
  onLaunchClientProject,
}: TemplateBlueprintViewProps) {
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintId>(initialBlueprint);
  const [currency, setCurrency] = useState("KSh");

  // Empty template inventory state
  const [templateItems, setTemplateItems] = useState<Array<{
    id: string;
    name: string;
    category: string;
    unit_type: string;
    unit_cost: number;
    unit_retail: number;
    current_stock: number;
  }>>([]);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // New item form
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState(BLUEPRINTS[selectedBlueprint].categories[0]);
  const [prodUnit, setProdUnit] = useState(BLUEPRINTS[selectedBlueprint].unitTypes[0]);
  const [prodCost, setProdCost] = useState("");
  const [prodRetail, setProdRetail] = useState("");
  const [prodStock, setProdStock] = useState("");

  const currentConfig = BLUEPRINTS[selectedBlueprint];

  // Recalculate KPIs
  const totalRetail = templateItems.reduce((acc, it) => acc + it.current_stock * it.unit_retail, 0);
  const totalCost = templateItems.reduce((acc, it) => acc + it.current_stock * it.unit_cost, 0);
  const lockedProfit = totalRetail - totalCost;
  const markupPct = totalCost > 0 ? ((lockedProfit / totalCost) * 100).toFixed(1) : "0.0";

  const handleAddStarterSample = () => {
    const samples = currentConfig.sampleStarterItems.map((s, idx) => ({
      id: `sample-${Date.now()}-${idx}`,
      name: s.name,
      category: s.category,
      unit_type: s.unit_type,
      unit_cost: s.unit_cost,
      unit_retail: s.unit_retail,
      current_stock: 0,
    }));
    setTemplateItems(samples);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const newItem = {
      id: `prod-${Date.now()}`,
      name: prodName.trim(),
      category: prodCategory,
      unit_type: prodUnit,
      unit_cost: parseFloat(prodCost) || 0,
      unit_retail: parseFloat(prodRetail) || 0,
      current_stock: parseFloat(prodStock) || 0,
    };

    setTemplateItems((prev) => [...prev, newItem]);
    setIsAddProductOpen(false);
    setProdName("");
    setProdCost("");
    setProdRetail("");
    setProdStock("");
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
      {/* 1. TOP SYSTEM LEVEL 2 BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-500/30 px-6 py-3 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-amber-300 font-bold uppercase tracking-wider">
              Level 2: Industry Blueprint
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-white font-medium">
              Viewing Template: <strong className="text-emerald-300">{currentConfig.name}</strong> (No Client Data Loaded)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToAgency}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={13} /> Back to Agency
            </button>
          </div>
        </div>
      </div>

      {/* 2. BLUEPRINT SWITCHER TABS & HEADER */}
      <div className="border-b border-slate-800 bg-[#0e1218]/90 px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 mb-2">
                <Sparkles size={12} /> Empty-State Engine Ready for Onboarding
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {currentConfig.name} Architecture
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                {currentConfig.tagline}. This foundational schema isolates tenant inventory, configures automated restock batch triggers, and standardizes multi-unit conversions.
              </p>
            </div>

            {/* Template Selector Pills */}
            <div className="flex bg-[#131822] p-1.5 rounded-xl border border-slate-800 shrink-0 self-start md:self-auto">
              {(Object.keys(BLUEPRINTS) as BlueprintId[]).map((key) => {
                const bp = BLUEPRINTS[key];
                const isSelected = selectedBlueprint === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedBlueprint(key);
                      setProdCategory(BLUEPRINTS[key].categories[0]);
                      setProdUnit(BLUEPRINTS[key].unitTypes[0]);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {bp.icon}
                    <span>{bp.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-mono">Currency:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-[#121822] border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono focus:border-emerald-500 focus:outline-none"
              >
                <option value="KSh">KSh (Kenyan Shilling)</option>
                <option value="USD">USD ($)</option>
                <option value="UGX">UGX (Ugandan Shilling)</option>
                <option value="TZS">TZS (Tanzanian Shilling)</option>
                <option value="NGN">NGN (Nigerian Naira)</option>
              </select>

              <button
                onClick={() => setIsConfigOpen(true)}
                className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 transition"
              >
                <Settings size={13} />
                <span>Configure Restock Triggers</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {templateItems.length === 0 && (
                <button
                  onClick={handleAddStarterSample}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap size={13} /> Load 3 Starter Sample Items
                </button>
              )}
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
              >
                <Plus size={14} /> Add Initial Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EMPTY-STATE ENGINE DASHBOARD */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full space-y-8">
        {/* KPI CARDS (Empty Baseline) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#121822] border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Active Shelf Retail Value
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {currency} {totalRetail.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              {templateItems.length} active inventory rows
            </p>
          </div>

          <div className="bg-[#121822] border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Total Capital Invested
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {currency} {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">Wholesale cost baseline</p>
          </div>

          <div className="bg-[#121822] border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Locked-in Gross Profit
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {currency} {lockedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-500/80 mt-1 font-mono">
              Avg markup: {markupPct}%
            </p>
          </div>

          <div className="bg-[#121822] border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Engine Pipeline Status
            </span>
            <div className="text-base font-bold text-amber-400 flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Primed (Empty State)
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Ready for client ingestion
            </p>
          </div>
        </div>

        {/* BLUEPRINT SCHEMA INSPECTOR (Categories & Unit Types) */}
        <div className="bg-[#10151f] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Blueprint Schema Configuration
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              tenant_configs table
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Standardized Categories */}
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold block">Configured Vertical Categories:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentConfig.categories.map((cat, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-[#161e2b] text-slate-300 border border-slate-700/80 font-mono text-[11px]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Standardized Unit Types */}
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold block">Vertical Unit Types:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentConfig.unitTypes.map((unit, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-[#161e2b] text-emerald-400 border border-emerald-500/20 font-mono text-[11px]"
                  >
                    {unit}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Triggers Spec */}
          <div className="border-t border-slate-800/60 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">AUTO-CLOSE PREV BATCH</span>
              <span className="text-emerald-400 font-bold">
                {currentConfig.pipelineRules.restockTriggerAutoClose ? "ENABLED (True)" : "DISABLED"}
              </span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">VOICE SHENG NLP</span>
              <span className={currentConfig.pipelineRules.voiceNlp ? "text-emerald-400 font-bold" : "text-slate-400"}>
                {currentConfig.pipelineRules.voiceNlp ? "ACTIVE" : "STANDBY"}
              </span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">OCR BILL EXTRACTOR</span>
              <span className={currentConfig.pipelineRules.ocrBills ? "text-emerald-400 font-bold" : "text-slate-400"}>
                {currentConfig.pipelineRules.ocrBills ? "ACTIVE" : "OPTIONAL"}
              </span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">RECONCILIATION TOLERANCE</span>
              <span className="text-white font-bold">
                {currency} {currentConfig.pipelineRules.reconciliationThresholdKes}
              </span>
            </div>
          </div>
        </div>

        {/* INVENTORY TABLE OR EMPTY STATE */}
        <div className="bg-[#121822] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 bg-[#151c27] border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Live Blueprint Product Registry</h3>
              <p className="text-[11px] text-slate-400">
                Shows products seeded into this template prior to client deployment.
              </p>
            </div>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} /> Add Product
            </button>
          </div>

          {templateItems.length === 0 ? (
            /* Pristine Clean Empty State */
            <div className="py-16 px-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                <Store size={28} />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-base font-bold text-white">0 Products in Blueprint</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This blueprint is in clean template mode with zero loaded operational client records. You can add sample test products or explore this exact schema directly.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleAddStarterSample}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition cursor-pointer"
                >
                  Load 3 Starter Sample Items
                </button>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Add Custom Product
                </button>
              </div>
            </div>
          ) : (
            /* Table of Template Items */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18202a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Product Name</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Unit Type</th>
                    <th className="py-3.5 px-4 font-semibold">Unit Cost</th>
                    <th className="py-3.5 px-4 font-semibold">Unit Retail</th>
                    <th className="py-3.5 px-4 font-semibold">Initial Stock</th>
                    <th className="py-3.5 px-4 font-semibold">Expected Margin</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {templateItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-sans font-medium text-white">{item.name}</td>
                      <td className="py-3.5 px-4 text-slate-400">{item.category}</td>
                      <td className="py-3.5 px-4 text-emerald-400">{item.unit_type}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {currency} {item.unit_cost.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-semibold">
                        {currency} {item.unit_retail.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.current_stock} {item.unit_type}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                        +{currency} {(item.unit_retail - item.unit_cost).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setTemplateItems((prev) => prev.filter((it) => it.id !== item.id))}
                          className="text-red-400 hover:text-red-300 text-xs cursor-pointer font-sans"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CLIENT ONBOARDING CTA BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-[#131b26] to-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Ready to Deploy?
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Instant Onboarding for Any {currentConfig.name} Store
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              YuBiFlo instantiates a dedicated PostgreSQL schema with Row-Level Security, seeds these categories, and connects automated restock accounting in under 2 minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={onLaunchClientProject}
              className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              View Live Client #001
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD INITIAL PRODUCT */}
      {isAddProductOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#131822] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add Blueprint Product</h3>
              <button onClick={() => setIsAddProductOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Supa Loaf 400g"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {currentConfig.categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Type</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {currentConfig.unitTypes.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Unit Cost ({currency})</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Retail ({currency})</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={prodRetail}
                    onChange={(e) => setProdRetail(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition cursor-pointer"
                >
                  Save to Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURE RESTOCK TRIGGERS */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#131822] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Configure Restock Triggers</h3>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Set automated accounting automation rules for the {currentConfig.name} blueprint.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Auto-Close Preceding Batch</div>
                  <div className="text-[11px] text-slate-400">Implies full sale of previous stock on new restock</div>
                </div>
                <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4" />
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Sheng & Swahili Voice Ingestion</div>
                  <div className="text-[11px] text-slate-400">Enable Gemini audio transcription for micro-sales</div>
                </div>
                <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4" />
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <label className="text-slate-300 font-semibold block">
                  Reconciliation Discrepancy Tolerance ({currency})
                </label>
                <input
                  type="number"
                  defaultValue={currentConfig.pipelineRules.reconciliationThresholdKes}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
                <span className="text-[10px] text-slate-500">
                  Flags red alerts when cash discrepancy gap exceeds this threshold.
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsConfigOpen(false)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition text-xs cursor-pointer"
            >
              Apply Blueprint Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
