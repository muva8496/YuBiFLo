import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_KEY_WORKSPACES = "yubiflo_workspaces_v1";
export const STORAGE_KEY_ACTIVE_ID = "yubiflo_active_workspace_id";

// Optional: Connect to Supabase if environment variables are provided
const SUPABASE_URL = 
  (typeof process !== "undefined" && process.env?.REACT_APP_SUPABASE_URL) ||
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) || 
  "";

const SUPABASE_ANON_KEY = 
  (typeof process !== "undefined" && process.env?.REACT_APP_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  "";

export const supabase: SupabaseClient | null = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export interface WorkspaceRecord {
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
    [key: string]: any;
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

// Default Seed Workspace: Client Project #1 (Alacio Mini Shop)
export const DEFAULT_ALACIO_WORKSPACE: WorkspaceRecord = {
  id: "ws_alacio_001",
  slug: "alacio-mini-shop",
  business_name: "Alacio Mini Shop",
  blueprint_type: "RETAIL_FMCG",
  currency: "KSh",
  created_at: new Date().toISOString(),
  pipeline_settings: {
    restockTrigger: true,
    cashAuditAlerts: true,
    mpesaAutoSync: false
  },
  kpis: {
    total_active_shelf_retail_value: 35545,
    total_capital_invested: 29599.06,
    locked_in_potential_gross_profit: 5945.94,
    avg_markup_percentage: 20.1,
    total_active_items: 4
  },
  inventory: [
    { id: 1, name: "Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 50, unit_retail: 60, current_stock: 18, expected_margin: 10, total_shelf_value: 1080, velocity_badge: "High Velocity" },
    { id: 2, name: "Unga 2kg", category: "Flour", unit_type: "bales", unit_cost: 180, unit_retail: 210, current_stock: 4, expected_margin: 30, total_shelf_value: 840, velocity_badge: "Low Stock Alert" },
    { id: 3, name: "Cooking Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 280, unit_retail: 330, current_stock: 6, expected_margin: 50, total_shelf_value: 1980, velocity_badge: "Normal" },
    { id: 4, name: "Eggs Crate", category: "Poultry", unit_type: "crates", unit_cost: 380, unit_retail: 450, current_stock: 2, expected_margin: 70, total_shelf_value: 900, velocity_badge: "Low Stock Alert" }
  ]
};

// Safe Local Storage Retriever
export const loadSavedWorkspaces = (): WorkspaceRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKSPACES);
    if (!raw) return [DEFAULT_ALACIO_WORKSPACE];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_ALACIO_WORKSPACE];
  } catch (error) {
    console.warn("[YuBiFlo Storage] Corrupted workspaces cache detected. Resetting to defaults.", error);
    try {
      localStorage.removeItem(STORAGE_KEY_WORKSPACES);
    } catch {}
    return [DEFAULT_ALACIO_WORKSPACE];
  }
};

// Safe Active Workspace ID Retriever
export const loadActiveWorkspaceId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || DEFAULT_ALACIO_WORKSPACE.id;
  } catch (e) {
    return DEFAULT_ALACIO_WORKSPACE.id;
  }
};

// Unified Saver (Local + Supabase)
export const saveWorkspaces = async (workspaces: WorkspaceRecord[], activeId?: string): Promise<void> => {
  // 1. LocalStorage Persist (Synchronous & Offline-First)
  try {
    localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(workspaces));
    if (activeId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeId);
    }
  } catch (e) {
    console.error("[YuBiFlo Storage] Failed saving to localStorage:", e);
  }

  // 2. Cloud Mirroring to Supabase (if configured)
  if (supabase) {
    try {
      const payload = workspaces.map(w => ({
        id: w.id,
        slug: w.slug,
        business_name: w.business_name,
        blueprint_type: w.blueprint_type,
        currency: w.currency,
        pipeline_settings: w.pipeline_settings,
        kpis: w.kpis,
        inventory: w.inventory,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from("workspaces")
        .upsert(payload, { onConflict: "id" });

      if (error) console.error("[YuBiFlo Supabase] Sync error:", error.message);
    } catch (err) {
      console.error("[YuBiFlo Supabase] Cloud connection failed:", err);
    }
  }
};
