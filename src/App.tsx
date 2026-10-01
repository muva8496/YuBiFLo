import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, BarChart3, BrainCircuit, ArrowRight, CheckCircle2, 
  AlertTriangle, Eye, Layers, Store, Wrench, Pill, Sparkles, 
  LayoutDashboard, Zap, Clock, Package, Users, Scale, BarChart2, 
  RefreshCw, Plus, Search, ChevronDown, Building2, Globe, Copy, 
  X, Coins, SlidersHorizontal, Smartphone, TrendingUp, ShieldAlert,
  Mic
} from "lucide-react";
import VoiceLedger, { VoiceTransactionPayload } from "./components/VoiceLedger";

// ==========================================
// 1. PERSISTENCE ENGINE (SAFE LOCALSTORAGE)
// ==========================================
const STORAGE_KEY = "yubiflo_master_workspaces_v1";
const ACTIVE_ID_KEY = "yubiflo_master_active_id";

export interface WorkspaceInventoryItem {
  id: number | string;
  name: string;
  category: string;
  unit_type: string;
  unit_cost: number;
  unit_retail: number;
  current_stock: number;
  opening_stock: number;
  expected_margin: number;
  total_shelf_value: number;
  velocity_badge: string;
}

export interface WorkspaceKpis {
  total_active_shelf_retail_value: number;
  total_capital_invested: number;
  locked_in_potential_gross_profit: number;
  avg_markup_percentage: number;
  total_active_items: number;
}

export interface Workspace {
  id: string;
  slug: string;
  business_name: string;
  blueprint_type: string;
  currency: string;
  is_template: boolean;
  kpis: WorkspaceKpis;
  inventory: WorkspaceInventoryItem[];
}

const INITIAL_PROJECT_ALACIO: Workspace = {
  id: "ws_alacio_001",
  slug: "alacio-mini-shop",
  business_name: "Alacio Mini Shop",
  blueprint_type: "RETAIL_FMCG",
  currency: "KSh",
  is_template: false,
  kpis: {
    total_active_shelf_retail_value: 35545,
    total_capital_invested: 29599.06,
    locked_in_potential_gross_profit: 5945.94,
    avg_markup_percentage: 20.1,
    total_active_items: 43
  },
  inventory: [
    { id: 1, name: "Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 50, unit_retail: 60, current_stock: 18, opening_stock: 10, expected_margin: 10, total_shelf_value: 1080, velocity_badge: "High Velocity" },
    { id: 2, name: "Unga 2kg", category: "Flour", unit_type: "bales", unit_cost: 180, unit_retail: 210, current_stock: 4, opening_stock: 4, expected_margin: 30, total_shelf_value: 840, velocity_badge: "Low Stock Alert" },
    { id: 3, name: "Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 280, unit_retail: 330, current_stock: 6, opening_stock: 2, expected_margin: 50, total_shelf_value: 1980, velocity_badge: "Normal" },
    { id: 4, name: "Eggs Crate", category: "Poultry", unit_type: "crates", unit_cost: 380, unit_retail: 450, current_stock: 2, opening_stock: 1, expected_margin: 70, total_shelf_value: 900, velocity_badge: "Low Stock Alert" },
    { id: 5, name: "Festive Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 55, unit_retail: 65, current_stock: 12, opening_stock: 6, expected_margin: 10, total_shelf_value: 780, velocity_badge: "High Velocity" },
    { id: 6, name: "Royco Mchuzi 200g", category: "Spices", unit_type: "tins", unit_cost: 120, unit_retail: 150, current_stock: 8, opening_stock: 4, expected_margin: 30, total_shelf_value: 1200, velocity_badge: "Normal" }
  ]
};

const EMPTY_RETAIL_TEMPLATE: Workspace = {
  id: "tpl_fmcg_001",
  slug: "fmcg-duka-blueprint",
  business_name: "Retail FMCG Blueprint",
  blueprint_type: "RETAIL_FMCG",
  currency: "KSh",
  is_template: true,
  kpis: {
    total_active_shelf_retail_value: 0,
    total_capital_invested: 0,
    locked_in_potential_gross_profit: 0,
    avg_markup_percentage: 0,
    total_active_items: 0
  },
  inventory: []
};

const HARDWARE_TEMPLATE: Workspace = {
  id: "tpl_hardware_002",
  slug: "hardware-construction-blueprint",
  business_name: "Hardware & Construction Blueprint",
  blueprint_type: "HARDWARE_BULK",
  currency: "KSh",
  is_template: true,
  kpis: {
    total_active_shelf_retail_value: 0,
    total_capital_invested: 0,
    locked_in_potential_gross_profit: 0,
    avg_markup_percentage: 0,
    total_active_items: 0
  },
  inventory: [
    { id: "hw-1", name: "Bamburi Tembo Cement 50kg", category: "Cement & Aggregates", unit_type: "bags (50kg)", unit_cost: 680, unit_retail: 750, current_stock: 40, opening_stock: 15, expected_margin: 70, total_shelf_value: 30000, velocity_badge: "High Velocity" },
    { id: "hw-2", name: "Cypress Timber 2x2", category: "Timber & Boards", unit_type: "meters", unit_cost: 42, unit_retail: 58, current_stock: 120, opening_stock: 30, expected_margin: 16, total_shelf_value: 6960, velocity_badge: "Normal" },
    { id: "hw-3", name: "Corrugated Iron Sheets G28", category: "Steel & Roofing", unit_type: "sheets", unit_cost: 850, unit_retail: 1050, current_stock: 25, opening_stock: 5, expected_margin: 200, total_shelf_value: 26250, velocity_badge: "High Velocity" }
  ]
};

function getSafeWorkspaces(): Workspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [INITIAL_PROJECT_ALACIO, EMPTY_RETAIL_TEMPLATE, HARDWARE_TEMPLATE];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_PROJECT_ALACIO, EMPTY_RETAIL_TEMPLATE, HARDWARE_TEMPLATE];
  } catch (e) {
    return [INITIAL_PROJECT_ALACIO, EMPTY_RETAIL_TEMPLATE, HARDWARE_TEMPLATE];
  }
}

// ==========================================
// 2. MAIN CONSOLIDATED COMPONENT
// ==========================================
export default function App() {
  const [currentView, setCurrentView] = useState<"landing" | "workspace">("landing"); // "landing" | "workspace"
  const [activeModule, setActiveModule] = useState<string>("inventory"); // "inventory" | "reconciliation"
  const [workspaces, setWorkspaces] = useState<Workspace[]>(getSafeWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_ID_KEY) || INITIAL_PROJECT_ALACIO.id;
  });

  const [isClonerOpen, setIsClonerOpen] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkspaceInventoryItem | null>(null);
  const [batchQty, setBatchQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [unitRetail, setUnitRetail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories (43)");

  // Reconciliation local state
  const [mpesaCollected, setMpesaCollected] = useState("4500");
  const [cashCollected, setCashCollected] = useState("2800");

  // Safe sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
      localStorage.setItem(ACTIVE_ID_KEY, activeWorkspaceId);
    } catch (e) {
      console.warn("Storage sync failed", e);
    }
  }, [workspaces, activeWorkspaceId]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || INITIAL_PROJECT_ALACIO;

  // Restock calculation engine
  const handleExecuteRestock = () => {
    if (!batchQty || !unitCost || !unitRetail || !selectedItem) return;
    const qty = parseFloat(batchQty);
    const cost = parseFloat(unitCost);
    const retail = parseFloat(unitRetail);

    const updatedInventory = activeWorkspace.inventory.map((inv) => {
      if (inv.id === selectedItem.id) {
        return {
          ...inv,
          current_stock: qty,
          unit_cost: cost,
          unit_retail: retail,
          expected_margin: retail - cost,
          total_shelf_value: qty * retail,
          velocity_badge: qty <= 5 ? "Low Stock Alert" : "High Velocity"
        };
      }
      return inv;
    });

    const totalRetail = updatedInventory.reduce((acc, curr) => acc + curr.total_shelf_value, 0);
    const totalCost = updatedInventory.reduce((acc, curr) => acc + (curr.current_stock * curr.unit_cost), 0);
    const profit = totalRetail - totalCost;

    const updatedWorkspace: Workspace = {
      ...activeWorkspace,
      kpis: {
        ...activeWorkspace.kpis,
        total_active_shelf_retail_value: totalRetail,
        total_capital_invested: totalCost,
        locked_in_potential_gross_profit: profit,
        avg_markup_percentage: totalCost > 0 ? parseFloat(((profit / totalCost) * 100).toFixed(1)) : 0,
        total_active_items: updatedInventory.length
      },
      inventory: updatedInventory
    };

    setWorkspaces((prev) => prev.map((w) => (w.id === updatedWorkspace.id ? updatedWorkspace : w)));
    setShowRestockModal(false);
    setBatchQty("");
  };

  // Reconciliation computation
  const reconData = useMemo(() => {
    let totalExpected = 0;
    activeWorkspace.inventory.forEach((item) => {
      const expectedRevenue = (item.current_stock > 0 ? item.current_stock : 1) * item.unit_retail;
      totalExpected += expectedRevenue;
    });

    const mpesa = parseFloat(mpesaCollected) || 0;
    const cash = parseFloat(cashCollected) || 0;
    const totalCollected = mpesa + cash;
    const gap = totalCollected - totalExpected;

    return { totalExpected, totalCollected, gap };
  }, [activeWorkspace, mpesaCollected, cashCollected]);

  // Clone workspace from modal
  const handleWorkspaceCreated = (newWs: Workspace) => {
    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    setCurrentView("workspace");
    setActiveModule("inventory");
  };

  const [lastVoiceLog, setLastVoiceLog] = useState<string | null>(null);

  // Commit transaction from Voice Ledger (deduct stock, adjust revenue & KPIs)
  const handleVoiceTransaction = (payload: VoiceTransactionPayload) => {
    let updatedInventory = [...activeWorkspace.inventory];
    payload.items.forEach((voiceItem) => {
      const idx = updatedInventory.findIndex(
        (inv) => inv.name.toLowerCase().includes(voiceItem.name.toLowerCase()) || voiceItem.name.toLowerCase().includes(inv.name.toLowerCase())
      );
      if (idx !== -1) {
        const inv = updatedInventory[idx];
        const newStock = Math.max(0, inv.current_stock - voiceItem.qty);
        updatedInventory[idx] = {
          ...inv,
          current_stock: newStock,
          total_shelf_value: newStock * inv.unit_retail,
          velocity_badge: newStock <= 5 ? "Low Stock Alert" : "High Velocity",
        };
      }
    });

    const totalRetail = updatedInventory.reduce((acc, curr) => acc + curr.total_shelf_value, 0);
    const totalCost = updatedInventory.reduce((acc, curr) => acc + (curr.current_stock * curr.unit_cost), 0);
    const profit = totalRetail - totalCost;

    const updatedWorkspace: Workspace = {
      ...activeWorkspace,
      kpis: {
        ...activeWorkspace.kpis,
        total_active_shelf_retail_value: totalRetail,
        total_capital_invested: totalCost,
        locked_in_potential_gross_profit: profit,
        avg_markup_percentage: totalCost > 0 ? parseFloat(((profit / totalCost) * 100).toFixed(1)) : 0,
        total_active_items: updatedInventory.length,
      },
      inventory: updatedInventory,
    };

    setWorkspaces((prev) => prev.map((w) => (w.id === updatedWorkspace.id ? updatedWorkspace : w)));
    setLastVoiceLog(
      `Logged voice transaction for ${payload.customer}: ${activeWorkspace.currency} ${payload.total} (Cash: ${activeWorkspace.currency} ${payload.cashPaid}, Deni: ${activeWorkspace.currency} ${payload.debtAmount})`
    );
    setTimeout(() => setLastVoiceLog(null), 7000);
  };

  // Filtered inventory based on active category
  const filteredInventory = useMemo(() => {
    if (selectedCategory === "All Categories (43)" || selectedCategory === "All Categories") {
      return activeWorkspace.inventory;
    }
    return activeWorkspace.inventory.filter((item) => 
      item.category.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [activeWorkspace.inventory, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#0a0d12] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* GLOBAL HEADER / WORKSPACE SWITCHER */}
      <header className="h-14 bg-[#0e1218] border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between text-xs sticky top-0 z-40">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => setCurrentView("landing")}
            className="flex items-center gap-2 text-white font-black tracking-wide text-sm cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">Y</div>
            YuBiFLo
          </button>
          
          <span className="text-slate-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-emerald-400 shrink-0" />
            <span className="text-slate-400 hidden md:inline">Workspace:</span>
            <div className="relative">
              <select
                value={activeWorkspace.id}
                onChange={(e) => {
                  setActiveWorkspaceId(e.target.value);
                  setCurrentView("workspace");
                }}
                className="bg-[#0a0d12] border border-slate-700 rounded px-2.5 py-1 text-white font-bold appearance-none pr-6 cursor-pointer max-w-[140px] sm:max-w-[220px] truncate"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.business_name} {ws.is_template ? "(Blueprint)" : `(${ws.currency})`}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {currentView === "workspace" && (
            <button
              onClick={() => setCurrentView("landing")}
              className="text-slate-400 hover:text-white transition flex items-center gap-1 font-medium cursor-pointer text-xs"
            >
              <Globe size={14} /> <span className="hidden sm:inline">Agency Home</span>
            </button>
          )}
          <button
            onClick={() => setIsClonerOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition flex items-center gap-1.5 shadow cursor-pointer text-xs"
          >
            <Plus size={14} /> <span className="hidden sm:inline">Clone Blueprint for New Client</span><span className="sm:hidden">Clone</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* VIEW A: B2B AGENCY LANDING PAGE (HOOK, AGITATE, SOLUTION) */}
      {/* ========================================================= */}
      {currentView === "landing" && (
        <div>
          {/* 1. HOOK */}
          <section className="relative pt-24 pb-20 px-6 border-b border-slate-800/60 text-center">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-emerald-400">
                <Sparkles size={14} /> Custom MSME Data Ecosystems
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Stop Losing Money to Pen, Paper, &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Rush-Hour Guesswork.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
                YuBiFlo builds custom data engineering pipelines, automated financial dashboards, and predictive AI models tailored to how your business actually runs.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <a 
                  href="#case-study"
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  Explore Client Deployment (Project #1) <ArrowRight size={16} />
                </a>
                <button
                  onClick={() => {
                    setActiveWorkspaceId(EMPTY_RETAIL_TEMPLATE.id);
                    setCurrentView("workspace");
                    setActiveModule("inventory");
                  }}
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition border border-slate-700 cursor-pointer"
                >
                  Explore Blueprints
                </button>
              </div>
            </div>
          </section>

          {/* 2. AGITATION */}
          <section className="py-20 px-6 bg-[#0c1016] border-b border-slate-800/60">
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="text-center space-y-2">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">The Reality</span>
                <h2 className="text-3xl font-extrabold text-white">Why Standard POS Fails Fast-Paced Shops</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#121720] border border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"><AlertTriangle size={18} /></div>
                  <h3 className="font-bold text-white">Counter Friction</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">During rush hours, typing 20-shilling purchases into a phone slows lines. Unrecorded transactions slip away unlogged.</p>
                </div>
                <div className="bg-[#121720] border border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400"><Layers size={18} /></div>
                  <h3 className="font-bold text-white">The Cash Discrepancy Gap</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">M-Pesa statements and cash drawers never match what walked off the shelf. Did money leak into deni or lost change?</p>
                </div>
                <div className="bg-[#121720] border border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400"><Database size={18} /></div>
                  <h3 className="font-bold text-white">One Size Fits None</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">A grocery duka needs restock velocity; a hardware store needs broken-bulk kg mapping. Generic apps solve neither.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. SOLUTION MATRIX */}
          <section className="py-20 px-6 border-b border-slate-800/60">
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="text-center space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">The Architecture</span>
                <h2 className="text-3xl font-extrabold text-white">The YuBiFlo 3-Tier Data Stack</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111620] border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
                  <div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4"><Database size={22} /></div>
                    <h3 className="text-lg font-bold text-white mb-2">1. Data Engineering</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Frictionless ingestion via Restock-Trigger batch logic and invoice OCR. Zero counter-typing needed.</p>
                  </div>
                  <span className="mt-6 text-[10px] font-mono text-emerald-400 bg-emerald-950/30 p-2 rounded">✓ Eliminates manual counter inputs</span>
                </div>
                <div className="bg-[#111620] border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
                  <div>
                    <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4"><BarChart3 size={22} /></div>
                    <h3 className="text-lg font-bold text-white mb-2">2. Automated BI &amp; Auditing</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Real-time shelf value, locked gross profit, and automated end-of-day discrepancy reconciliation.</p>
                  </div>
                  <span className="mt-6 text-[10px] font-mono text-teal-400 bg-teal-950/30 p-2 rounded">✓ Audits drawer cash against shelf depletion</span>
                </div>
                <div className="bg-[#111620] border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
                  <div>
                    <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl w-fit mb-4"><BrainCircuit size={22} /></div>
                    <h3 className="text-lg font-bold text-white mb-2">3. Predictive Data Science</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Batch turnover forecasting alerting you exactly when to reorder high-velocity items before stockouts happen.</p>
                  </div>
                  <span className="mt-6 text-[10px] font-mono text-cyan-400 bg-cyan-950/30 p-2 rounded">✓ Stops stockouts of milk, unga, and bread</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. CLIENT CASE STUDY: PROJECT #1 */}
          <section id="case-study" className="py-24 px-6 bg-gradient-to-b from-[#0e131b] to-[#0a0d12]">
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="text-center space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Field Verification</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Project #1: Live Retail Deployment</h2>
                <p className="text-xs text-slate-400">Authorized live data view of our first operational client build.</p>
              </div>
              <div className="bg-[#121822] border border-slate-700/80 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="space-y-6 max-w-xl">
                  <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold rounded-full">
                    Production Case Study
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">Alacio Mini Shop Data Engine</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Deployed across 43 active inventory items. YuBiFlo replaced lost manual ledgering with reverse supply-driven velocity tracking.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Shelf Value</span>
                      <div className="text-base font-black text-emerald-400 font-mono mt-0.5">KSh 35,545</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Capital Invested</span>
                      <div className="text-base font-black text-white font-mono mt-0.5">KSh 29,599</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Locked Markup</span>
                      <div className="text-base font-black text-teal-400 font-mono mt-0.5">20.1%</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveWorkspaceId(INITIAL_PROJECT_ALACIO.id);
                      setCurrentView("workspace");
                      setActiveModule("inventory");
                    }}
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <Eye size={16} /> Open Client System &amp; Live Data
                  </button>
                </div>
                <div className="w-full lg:w-80 bg-[#090d12] border border-slate-800 rounded-2xl p-5 font-mono text-xs space-y-3">
                  <div className="flex justify-between pb-2 border-b border-slate-800 text-slate-400">
                    <span>Engine</span><span className="text-emerald-400 font-bold">Active</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Pipeline:</span><span>Restock-Trigger</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Audit Cycle:</span><span>Daily EOD</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                    "YuBiFlo completely solved inventory blindspots without needing any staff training."
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW B: CLIENT WORKSPACE / TEMPLATE RUNTIME               */}
      {/* ========================================================= */}
      {currentView === "workspace" && (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
          
          {/* SIDEBAR */}
          <aside className="w-64 bg-[#13181f] border-r border-slate-800 flex flex-col justify-between shrink-0">
            <div>
              <div className="p-4 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white block">{activeWorkspace.business_name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {activeWorkspace.is_template ? "Configurable Template Blueprint" : "Active Client Telemetry"}
                </span>
              </div>
              <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Navigation</div>
              <nav className="space-y-0.5 px-3">
                {[
                  { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={16} /> },
                  { id: "voice_ledger", name: "Voice Ledger (Sheng)", icon: <Mic size={16} />, badge: "AI Ingest" },
                  { id: "quick_dump", name: "Quick Raw Dump", icon: <Zap size={16} />, badge: "Fast Drop" },
                  { id: "opening_float", name: "Opening Float", icon: <Clock size={16} />, badge: "655/" },
                  { id: "inventory", name: "Inventory & Batches", icon: <Package size={16} />, badge: `${activeWorkspace.inventory.length}` },
                  { id: "customers", name: "Customers & Credit", icon: <Users size={16} />, badge: "12 debt" },
                  { id: "t_ledgers", name: "T-Ledgers & Ranking", icon: <Scale size={16} />, badge: "6 Ledgers" },
                  { id: "reconciliation", name: "Reconciliation Audit", icon: <RefreshCw size={16} /> },
                  { id: "analytics", name: "Analytics", icon: <BarChart2 size={16} />, badge: "16 Charts" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      activeModule === item.id 
                        ? "bg-[#182623] text-emerald-400 border border-emerald-500/20 font-semibold" 
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">{item.icon}<span>{item.name}</span></div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-4 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              Workspace ID: {activeWorkspace.id}
            </div>
          </aside>

          {/* MAIN WORKSPACE CONTENT */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            
            {/* SUB-MODULE 0: VOICE LEDGER */}
            {activeModule === "voice_ledger" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Mic className="text-emerald-400" size={20} /> Voice Ledger &amp; Sheng NLP Ingestion
                    </h2>
                    <p className="text-xs text-slate-400">Speak transactions in Sheng / Swahili during rapid-fire peak hours without tapping screens.</p>
                  </div>
                  <button
                    onClick={() => setActiveModule("inventory")}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition cursor-pointer font-medium"
                  >
                    View Active Inventory ({activeWorkspace.inventory.length})
                  </button>
                </div>

                {lastVoiceLog && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span className="font-mono">{lastVoiceLog}</span>
                  </div>
                )}

                <VoiceLedger 
                  currency={activeWorkspace.currency} 
                  onLogTransaction={handleVoiceTransaction} 
                />
              </div>
            )}

            {/* SUB-MODULE 1: INVENTORY & SUPPLY VELOCITY */}
            {(activeModule === "inventory" || activeModule === "dashboard" || activeModule === "quick_dump" || activeModule === "opening_float" || activeModule === "customers" || activeModule === "t_ledgers" || activeModule === "analytics") && activeModule !== "reconciliation" && activeModule !== "voice_ledger" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Package className="text-emerald-400" size={20} /> Active Stock &amp; Supply Velocity
                    </h2>
                    <p className="text-xs text-slate-400">Real-time shelf inventory, unit margins, and automatic batch turnover status.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setActiveModule("voice_ledger")}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition cursor-pointer"
                    >
                      <Mic size={14} /> Voice Ingest (Sheng)
                    </button>
                    <button 
                      onClick={() => {
                        if (activeWorkspace.inventory.length > 0) {
                          setSelectedItem(activeWorkspace.inventory[0]);
                          setUnitCost(String(activeWorkspace.inventory[0].unit_cost));
                          setUnitRetail(String(activeWorkspace.inventory[0].unit_retail));
                          setShowRestockModal(true);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 transition cursor-pointer"
                    >
                      <RefreshCw size={14} /> Restock Batch
                    </button>
                  </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#13181f] border border-slate-800 rounded-xl p-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Active Shelf Retail Value</span>
                    <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
                      {activeWorkspace.currency} {activeWorkspace.kpis.total_active_shelf_retail_value.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Across {activeWorkspace.inventory.length} active inventory items</p>
                  </div>
                  <div className="bg-[#13181f] border border-slate-800 rounded-xl p-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Capital Invested (Cost Price)</span>
                    <div className="mt-2 text-2xl font-black text-white font-mono">
                      {activeWorkspace.currency} {activeWorkspace.kpis.total_capital_invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Wholesale money out tied in current batches</p>
                  </div>
                  <div className="bg-[#13181f] border border-slate-800 rounded-xl p-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Locked-in Potential Gross Profit</span>
                    <div className="mt-2 text-2xl font-black text-white font-mono">
                      {activeWorkspace.currency} {activeWorkspace.kpis.locked_in_potential_gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-emerald-400 mt-1">Avg markup: {activeWorkspace.kpis.avg_markup_percentage}%</p>
                  </div>
                </div>

                {/* CATEGORY FILTER PILLS */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {["All Categories (43)", "Dairy", "Flour", "Cooking & Oils", "Poultry", "Bakery", "Spices", "Cement & Aggregates", "Steel & Roofing"].map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer ${
                        selectedCategory === cat 
                          ? "bg-slate-700 text-white border-slate-600" 
                          : "bg-[#13181f] text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* INVENTORY TABLE */}
                <div className="bg-[#13181f] border border-slate-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-[#18202a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Product Name &amp; Category</th>
                        <th className="py-3 px-4 font-semibold">Velocity Badge</th>
                        <th className="py-3 px-4 font-semibold">Active Shelf Stock</th>
                        <th className="py-3 px-4 font-semibold">Unit Cost</th>
                        <th className="py-3 px-4 font-semibold">Unit Retail</th>
                        <th className="py-3 px-4 font-semibold">Expected Margin</th>
                        <th className="py-3 px-4 font-semibold">Total Shelf Value</th>
                        <th className="py-3 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4 font-sans font-medium text-slate-200">
                            <div>{item.name}</div>
                            <div className="text-[10px] text-slate-500 font-sans">{item.category}</div>
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              item.velocity_badge === "Low Stock Alert" 
                                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}>
                              {item.velocity_badge}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-300">{item.current_stock} {item.unit_type}</td>
                          <td className="py-3.5 px-4 text-slate-400">{activeWorkspace.currency} {item.unit_cost}</td>
                          <td className="py-3.5 px-4 text-slate-200 font-semibold">{activeWorkspace.currency} {item.unit_retail}</td>
                          <td className="py-3.5 px-4 text-emerald-400 font-semibold">+{activeWorkspace.currency} {item.expected_margin}</td>
                          <td className="py-3.5 px-4 font-bold text-white">{activeWorkspace.currency} {item.total_shelf_value.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right font-sans">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setUnitCost(String(item.unit_cost));
                                setUnitRetail(String(item.unit_retail));
                                setShowRestockModal(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 cursor-pointer"
                            >
                              Restock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredInventory.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Empty Blueprint Template. Click "Clone Blueprint" or "Restock Batch" to populate data.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-MODULE 2: RECONCILIATION CASH AUDIT */}
            {activeModule === "reconciliation" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Scale className="text-emerald-400" size={20} /> Daily Reconciliation &amp; Cash Audit
                  </h2>
                  <p className="text-xs text-slate-400">Reconciling stock depletion against actual physical drawer cash and M-Pesa statements.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#13181f] border border-slate-800 rounded-xl p-5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Expected Revenue (Stock Sold)</span>
                    <div className="text-2xl font-black text-white font-mono mt-1">
                      {activeWorkspace.currency} {reconData.totalExpected.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#13181f] border border-slate-800 rounded-xl p-5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Actual Money Collected</span>
                    <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                      {activeWorkspace.currency} {reconData.totalCollected.toLocaleString()}
                    </div>
                  </div>
                  <div className={`border rounded-xl p-5 ${reconData.gap < 0 ? "bg-red-950/20 border-red-500/30" : "bg-[#13181f] border-slate-800"}`}>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Cash Discrepancy Gap</span>
                    <div className={`text-2xl font-black font-mono mt-1 ${reconData.gap < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {reconData.gap < 0 ? "-" : "+"}{activeWorkspace.currency} {Math.abs(reconData.gap).toLocaleString()}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {reconData.gap < 0 ? "⚠️ Leakage or unrecorded deni detected" : "✓ Balanced register"}
                    </p>
                  </div>
                </div>

                <div className="bg-[#13181f] border border-slate-800 rounded-xl p-6 max-w-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase text-slate-300 font-mono">Input Register Collections</h3>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">M-Pesa Statement Total ({activeWorkspace.currency})</label>
                    <input 
                      type="number"
                      value={mpesaCollected}
                      onChange={(e) => setMpesaCollected(e.target.value)}
                      className="w-full bg-[#0a0d12] border border-slate-700 rounded p-2.5 text-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Physical Cash Drawer Count ({activeWorkspace.currency})</label>
                    <input 
                      type="number"
                      value={cashCollected}
                      onChange={(e) => setCashCollected(e.target.value)}
                      className="w-full bg-[#0a0d12] border border-slate-700 rounded p-2.5 text-white font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODALS (RESTOCK & WORKSPACE CLONER)                     */}
      {/* ========================================================= */}
      {/* RESTOCK TRIGGER MODAL */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#13181f] border border-slate-700 w-full max-w-md rounded-xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Restock Batch: {selectedItem.name}</h3>
            <p className="text-slate-400">Logging this batch automatically calculates implied sales of preceding stock.</p>
            <div>
              <label className="text-slate-400 block mb-1">Batch Units Received ({selectedItem.unit_type})</label>
              <input 
                type="number"
                value={batchQty}
                onChange={(e) => setBatchQty(e.target.value)}
                placeholder="e.g. 18"
                className="w-full bg-[#0a0d12] border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Unit Cost ({activeWorkspace.currency})</label>
                <input 
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Unit Retail ({activeWorkspace.currency})</label>
                <input 
                  type="number"
                  value={unitRetail}
                  onChange={(e) => setUnitRetail(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded p-2 text-white font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowRestockModal(false)} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded cursor-pointer">Cancel</button>
              <button onClick={handleExecuteRestock} className="flex-1 py-2 bg-emerald-500 text-slate-950 font-bold rounded cursor-pointer">Confirm Restock</button>
            </div>
          </div>
        </div>
      )}

      {/* CLONER MODAL */}
      {isClonerOpen && (
        <ClonerModal 
          onClose={() => setIsClonerOpen(false)}
          onCreate={handleWorkspaceCreated}
        />
      )}

    </div>
  );
}

// INLINE CLONER MODAL SUBCOMPONENT
interface ClonerModalProps {
  onClose: () => void;
  onCreate: (newWs: Workspace) => void;
}

function ClonerModal({ onClose, onCreate }: ClonerModalProps) {
  const [name, setName] = useState("");
  const [curr, setCurr] = useState("KSh");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#121822] border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs font-sans">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Copy size={16} className="text-emerald-400" /> Clone Blueprint for New Client
          </h3>
          <button onClick={onClose} className="cursor-pointer"><X size={16} className="text-slate-400" /></button>
        </div>
        <div>
          <label className="text-slate-300 font-semibold block mb-1">Client Business Name</label>
          <input 
            type="text"
            required
            placeholder="e.g. Mama Boi Stores"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white"
            autoFocus
          />
        </div>
        <div>
          <label className="text-slate-300 font-semibold block mb-1">Currency</label>
          <input 
            type="text"
            value={curr}
            onChange={(e) => setCurr(e.target.value)}
            className="w-full bg-[#0a0d12] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg cursor-pointer">Cancel</button>
          <button 
            onClick={() => {
              if (!name.trim()) return;
              onCreate({
                id: `ws_${Date.now()}`,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                business_name: name.trim(),
                blueprint_type: "RETAIL_FMCG",
                currency: curr,
                is_template: false,
                kpis: {
                  total_active_shelf_retail_value: 0,
                  total_capital_invested: 0,
                  locked_in_potential_gross_profit: 0,
                  avg_markup_percentage: 0,
                  total_active_items: 4
                },
                inventory: [
                  { id: 1, name: "Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 50, unit_retail: 60, current_stock: 0, opening_stock: 0, expected_margin: 10, total_shelf_value: 0, velocity_badge: "Low Stock Alert" },
                  { id: 2, name: "Unga 2kg", category: "Flour", unit_type: "bales", unit_cost: 180, unit_retail: 210, current_stock: 0, opening_stock: 0, expected_margin: 30, total_shelf_value: 0, velocity_badge: "Low Stock Alert" },
                  { id: 3, name: "Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 280, unit_retail: 330, current_stock: 0, opening_stock: 0, expected_margin: 50, total_shelf_value: 0, velocity_badge: "Low Stock Alert" },
                  { id: 4, name: "Eggs Crate", category: "Poultry", unit_type: "crates", unit_cost: 380, unit_retail: 450, current_stock: 0, opening_stock: 0, expected_margin: 70, total_shelf_value: 0, velocity_badge: "Low Stock Alert" }
                ]
              });
              onClose();
            }}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg cursor-pointer"
          >
            Provision Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
