import React, { useState } from "react";
import { 
  Copy, 
  Store, 
  Sparkles, 
  Check, 
  X, 
  ArrowRight, 
  Coins, 
  Layers, 
  SlidersHorizontal 
} from "lucide-react";

export interface StarterItem {
  name: string;
  category: string;
  unit_type: string;
  unit_cost: number;
  unit_retail: number;
  current_stock: number;
}

// Default template blueprint starter items
const FMCG_STARTER_ITEMS: StarterItem[] = [
  { name: "Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 50, unit_retail: 60, current_stock: 0 },
  { name: "Unga 2kg", category: "Flour", unit_type: "bales", unit_cost: 180, unit_retail: 210, current_stock: 0 },
  { name: "Festive Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 55, unit_retail: 65, current_stock: 0 },
  { name: "Cooking Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 280, unit_retail: 330, current_stock: 0 },
];

const HARDWARE_STARTER_ITEMS: StarterItem[] = [
  { name: "Bamburi Tembo Cement 50kg", category: "Cement & Aggregates", unit_type: "bags (50kg)", unit_cost: 680, unit_retail: 750, current_stock: 0 },
  { name: "Cypress Timber 2x2", category: "Timber & Boards", unit_type: "meters", unit_cost: 42, unit_retail: 58, current_stock: 0 },
  { name: "Corrugated Iron Sheets G28", category: "Steel & Iron", unit_type: "sheets", unit_cost: 850, unit_retail: 1050, current_stock: 0 },
];

const PHARMACY_STARTER_ITEMS: StarterItem[] = [
  { name: "Amoxicillin 500mg (10x10)", category: "Antibiotics", unit_type: "boxes", unit_cost: 320, unit_retail: 450, current_stock: 0 },
  { name: "Panadol Extra 100s", category: "Pain Relief", unit_type: "boxes", unit_cost: 420, unit_retail: 550, current_stock: 0 },
  { name: "Cetirizine Syrup 60ml", category: "Pediatrics", unit_type: "bottles", unit_cost: 110, unit_retail: 160, current_stock: 0 },
];

export interface ClonedWorkspace {
  id: string;
  slug: string;
  business_name: string;
  blueprint_type: string;
  currency: string;
  created_at: string;
  pipeline_settings: {
    restockTrigger: boolean;
    cashAuditAlerts: boolean;
    mpesaAutoSync: boolean;
  };
  kpis: {
    total_active_shelf_retail_value: number;
    total_capital_invested: number;
    locked_in_potential_gross_profit: number;
    avg_markup_percentage: number;
    total_active_items: number;
  };
  inventory: Array<{
    id: number | string;
    name: string;
    category: string;
    unit_type: string;
    unit_cost: number;
    unit_retail: number;
    current_stock: number;
    expected_margin: number;
    total_shelf_value: number;
    velocity_badge: string;
  }>;
}

interface WorkspaceClonerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated: (workspace: ClonedWorkspace) => void;
  defaultBlueprintType?: string;
}

export default function WorkspaceClonerModal({ 
  isOpen, 
  onClose, 
  onWorkspaceCreated,
  defaultBlueprintType = "RETAIL_FMCG"
}: WorkspaceClonerModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [blueprintType, setBlueprintType] = useState(defaultBlueprintType);
  const [currency, setCurrency] = useState("KSh");
  const [includeStarterItems, setIncludeStarterItems] = useState(true);
  const [pipelineOptions, setPipelineOptions] = useState({
    restockTrigger: true,
    cashAuditAlerts: true,
    mpesaAutoSync: false
  });

  if (!isOpen) return null;

  const handleCloneBlueprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    // Generate unique slug and ID
    const slug = businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const starterPool = 
      blueprintType === "HARDWARE_BULK"
        ? HARDWARE_STARTER_ITEMS
        : blueprintType === "PHARMACY"
        ? PHARMACY_STARTER_ITEMS
        : FMCG_STARTER_ITEMS;
    
    const newWorkspace: ClonedWorkspace = {
      id: `ws_${Date.now()}`,
      slug,
      business_name: businessName.trim(),
      blueprint_type: blueprintType,
      currency,
      created_at: new Date().toISOString(),
      pipeline_settings: pipelineOptions,
      kpis: {
        total_active_shelf_retail_value: 0,
        total_capital_invested: 0,
        locked_in_potential_gross_profit: 0,
        avg_markup_percentage: 0,
        total_active_items: includeStarterItems ? starterPool.length : 0
      },
      inventory: includeStarterItems
        ? starterPool.map((item, idx) => ({
            id: idx + 1,
            ...item,
            expected_margin: item.unit_retail - item.unit_cost,
            total_shelf_value: item.current_stock * item.unit_retail,
            velocity_badge: "Low Stock Alert"
          }))
        : []
    };

    onWorkspaceCreated(newWorkspace);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#121822] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans text-slate-200">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-[#151c27]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Copy size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Clone Blueprint for New Client
              </h3>
              <p className="text-[11px] text-slate-400">
                Deploy an isolated data ecosystem in seconds
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CLONER FORM */}
        <form onSubmit={handleCloneBlueprint} className="p-6 space-y-5 text-xs">
          
          {/* BUSINESS NAME */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Client Business Name *
            </label>
            <div className="relative">
              <Store size={15} className="absolute left-3 top-3 text-slate-500" />
              <input 
                type="text"
                required
                placeholder="e.g. Mama Boi Stores, Apex Hardware, QuickRx"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* BLUEPRINT SELECTION & CURRENCY */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Target Architecture
              </label>
              <div className="relative">
                <select
                  value={blueprintType}
                  onChange={(e) => setBlueprintType(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                >
                  <option value="RETAIL_FMCG">FMCG Retail Duka</option>
                  <option value="HARDWARE_BULK">Hardware & Construction</option>
                  <option value="PHARMACY">Community Pharmacy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Operating Currency
              </label>
              <div className="relative">
                <Coins size={15} className="absolute left-3 top-3 text-slate-500" />
                <input 
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="KSh, USD, TZS"
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* STARTER CATALOG TOGGLE */}
          <div className="p-3.5 bg-[#0a0d12] border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-400" /> Pre-load Standard Item Taxonomy
              </span>
              <p className="text-[11px] text-slate-500">
                Seeds standard high-velocity vertical items ({blueprintType === "HARDWARE_BULK" ? "Cement, Timber, Iron Sheets" : blueprintType === "PHARMACY" ? "Amoxicillin, Panadol, Cetirizine" : "Milk, Unga, Bread, Oil"})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIncludeStarterItems(!includeStarterItems)}
              className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                includeStarterItems ? "bg-emerald-500" : "bg-slate-800 border border-slate-700"
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                includeStarterItems ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* PIPELINE CAPABILITIES */}
          <div className="space-y-2">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <SlidersHorizontal size={12} /> Pipeline Modules to Activate
            </span>
            <div className="space-y-1.5">
              {[
                { key: "restockTrigger" as const, label: "Restock-Triggered Auto Sales Engine" },
                { key: "cashAuditAlerts" as const, label: "End-of-Day Cash & M-Pesa Discrepancy Auditing" },
                { key: "mpesaAutoSync" as const, label: "Direct M-Pesa Statement Webhook Sync" }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={pipelineOptions[key]}
                    onChange={(e) => setPipelineOptions({ ...pipelineOptions, [key]: e.target.checked })}
                    className="accent-emerald-500 rounded bg-[#0a0d12] border-slate-700"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              <Sparkles size={14} /> Provision Workspace
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
