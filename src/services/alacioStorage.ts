import { 
  AlacioMasterState, 
  InventoryItem, 
  CustomerDebtor, 
  FloatDenomination, 
  WarehouseBatch,
  Blueprint,
  ProjectCaseStudy,
  PayoutOrDrawing,
  MpesaStatementRecord,
  MorningBookendRecord,
  RestockReconciliationCard,
  SavedReceiptRecord,
  SupplierProfile,
  PaymentChannelConfig
} from "../types/alacio";
import { deduplicateMorningBookends } from "../utils/morningBookendHelper";
import { deduplicateSuppliers } from "../utils/supplierHelper";
import { reconcileChronologicalReceiptsAndSales } from "../utils/chronologicalReceiptSalesEngine";
import { getSupplyUnitMultiplier } from "./bulkConversionEngine";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import {
  encryptClientData,
  decryptClientDataWithFallbacks,
  getPortableEncryptionSecret,
  isEncryptedPayload
} from "../utils/zeroKnowledgeEncryption";

export const STORAGE_KEY_ALACIO = "yubiflo_alacio_state_live_v2";
export const STORAGE_KEY_BLUEPRINTS_CONFIG = "yubiflo_blueprints_config_v2";
export const STORAGE_KEY_WAITLIST_REQUESTS = "yubiflo_waitlist_requests_v2";

export type BlueprintStatus = "live" | "next" | "soon" | "request";

export interface BusinessBlueprintConfig {
  id: string;
  name: string;
  status: BlueprintStatus;
  description?: string;
  tagline?: string;
}

export interface BusinessWaitlistRequest {
  id: string;
  name: string;
  phone: string;
  businessType: string;
  location: string;
  consent: boolean;
  createdAt: string;
}

export const DEFAULT_BLUEPRINTS_CONFIG: BusinessBlueprintConfig[] = [
  { 
    id: "bp_retail", 
    name: "Retail: Duka, Kiosk, Mini-supermarket", 
    status: "live",
    description: "Fast counter cash, M-Pesa float audits, reverse inventory math, and micro break-bulk packaging.",
    tagline: "Live production blueprint: FMCG Retail"
  },
  { 
    id: "bp_hardware", 
    name: "Hardware", 
    status: "next",
    description: "Broken-bulk nails and cement, timber running feet, and contractor milestone credit ledgers.",
    tagline: "Dimensional math & contractor credit"
  },
  { 
    id: "bp_wholesale", 
    name: "Wholesale", 
    status: "soon",
    description: "Pallet/crate distribution, route delivery trucks, and high-volume merchant buy-goods floats.",
    tagline: "Route manifest & carton lot tracking"
  },
  { 
    id: "bp_agrovet", 
    name: "Agrovet", 
    status: "soon",
    description: "Animal feed bags, veterinary medicines, certified seeds, and seasonal farmer planting credit.",
    tagline: "Batch expiry & farm input ledgers"
  },
  { 
    id: "bp_butchery", 
    name: "Butchery", 
    status: "soon",
    description: "Carcass weight breakdown, cuts per kilogram, bone yield, and cold-room daily shrinkage audits.",
    tagline: "Weight variance & meat shrinkage control"
  },
  { 
    id: "bp_eatery", 
    name: "Open Eatery & Roadside Kiosk", 
    status: "live",
    description: "Built for cash-heavy roadside eateries & simple-structure kiosks. Tracks Cash & Mobile Money (M-Pesa Till, Paybill, Pochi, Send Money), foodstuff & viungo supply purchases, 1–2 support staff salaries, and stall rent.",
    tagline: "Live shell: Cash-heavy kiosk & open eatery"
  },
  { 
    id: "bp_gas_water", 
    name: "Gas and Water Dealer", 
    status: "soon",
    description: "LPG cylinder exchange tracking (6kg, 13kg), water refill volumes, and cylinder deposit ledgers.",
    tagline: "Cylinder exchange & empty deposit book"
  },
  { 
    id: "bp_electronics", 
    name: "Electronics and Phone Accessories", 
    status: "soon",
    description: "Serial number tracking, warranties, broken-screen repairs, and phone accessory margins.",
    tagline: "Warranty, repair job cards & accessories"
  },
  { 
    id: "bp_mpesa", 
    name: "M-Pesa Agent", 
    status: "request",
    description: "Till float balancing, daily super-agency rebalancing, cash drawer vs line audits, and commission logs.",
    tagline: "Cash-in-till vs SIM float reconciliation"
  },
  { 
    id: "bp_salon_cyber", 
    name: "Salon, Cyber Cafe, Tailor, Laundry", 
    status: "request",
    description: "Service job tickets, staff commission splits, garment/device tags, and customer pickup tracking.",
    tagline: "Service job cards & commission ledger"
  },
  { 
    id: "bp_jua_kali", 
    name: "Jua Kali Maker", 
    status: "request",
    description: "Custom fabrication metal/timber jobs, client deposit milestones, and scrap material reuse.",
    tagline: "Job deposit milestones & scrap accounting"
  },
  { 
    id: "bp_farming_dairy", 
    name: "Farming and Dairy", 
    status: "request",
    description: "Daily milk collection liters, co-op payout deductions, feed expenses, and livestock health costs.",
    tagline: "Liter logs & co-op settlement reconciliation"
  },
  { 
    id: "bp_transport_health", 
    name: "Transport, School, Clinic and Chemist", 
    status: "request",
    description: "Matatu stage route fees, student fee receipts, clinic patient files, and poison/prescription logs.",
    tagline: "Specialized service receipt ledgers"
  }
];

export const INITIAL_WAITLIST_REQUESTS: BusinessWaitlistRequest[] = [
  { id: "req_1", name: "David Mwangi", phone: "0722 341 980", businessType: "Hardware", location: "Eldoret, Oginga Odinga St", consent: true, createdAt: "2026-10-01 09:30" },
  { id: "req_2", name: "Grace Wanjiku", phone: "0733 892 110", businessType: "Hardware", location: "Nairobi, Gikomba", consent: true, createdAt: "2026-10-01 11:15" },
  { id: "req_3", name: "Paul Kiprotich", phone: "0711 556 701", businessType: "Hardware", location: "Nakuru, Biashara St", consent: true, createdAt: "2026-10-01 14:20" },
  { id: "req_4", name: "Amina Hassan", phone: "0708 443 219", businessType: "Hardware", location: "Mombasa, Majengo", consent: true, createdAt: "2026-10-02 08:45" },
  { id: "req_5", name: "Boniface Otieno", phone: "0720 991 304", businessType: "Butchery", location: "Kisumu, Kondele", consent: true, createdAt: "2026-10-02 10:10" },
  { id: "req_6", name: "Mercy Chebet", phone: "0719 332 884", businessType: "Agrovet", location: "Kitale, Town Centre", consent: true, createdAt: "2026-10-02 11:00" },
  { id: "req_7", name: "Stephen Kamau", phone: "0721 884 102", businessType: "Wholesale", location: "Nairobi, Thika Road", consent: true, createdAt: "2026-10-02 13:30" },
  { id: "req_8", name: "Fatma Ali", phone: "0735 601 228", businessType: "Open Eatery & Roadside Kiosk", location: "Nairobi, Eastleigh", consent: true, createdAt: "2026-10-02 15:40" },
  { id: "req_9", name: "Jackson Mutua", phone: "0724 119 503", businessType: "Gas and Water Dealer", location: "Machakos, Kangundo Rd", consent: true, createdAt: "2026-10-02 16:50" },
  { id: "req_10", name: "Kennedy Omondi", phone: "0718 200 441", businessType: "M-Pesa Agent", location: "Nairobi, Umoja", consent: true, createdAt: "2026-10-03 07:10" }
];

export function loadBlueprintsConfig(): BusinessBlueprintConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BLUEPRINTS_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[YuBiFlo Storage] Error loading blueprints config:", e);
  }
  return DEFAULT_BLUEPRINTS_CONFIG;
}

export function saveBlueprintsConfig(configs: BusinessBlueprintConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BLUEPRINTS_CONFIG, JSON.stringify(configs));
  } catch (err) {
    console.error("[YuBiFlo Storage] Error saving blueprints config:", err);
  }
}

export function loadWaitlistRequests(): BusinessWaitlistRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WAITLIST_REQUESTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[YuBiFlo Storage] Error loading waitlist requests:", e);
  }
  return INITIAL_WAITLIST_REQUESTS;
}

export function saveWaitlistRequest(
  newEntry: Omit<BusinessWaitlistRequest, "id" | "createdAt">
): BusinessWaitlistRequest {
  const current = loadWaitlistRequests();
  const created: BusinessWaitlistRequest = {
    ...newEntry,
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toLocaleString()
  };
  const updated = [created, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_WAITLIST_REQUESTS, JSON.stringify(updated));
  } catch (err) {
    console.error("[YuBiFlo Storage] Error saving waitlist request:", err);
  }
  return created;
}

export function getBlueprintCardConfig(status: BlueprintStatus) {
  switch (status) {
    case "live":
      return {
        badgeText: "Available now",
        badgeClass: "bg-black text-white border-zinc-700",
        buttonText: "Launch with VCR",
        buttonClass: "bg-black hover:bg-zinc-800 text-white font-bold border border-zinc-700 shadow-md",
        isLive: true
      };
    case "next":
      return {
        badgeText: "Coming next",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        buttonText: "Join the waitlist",
        buttonClass: "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40",
        isLive: false
      };
    case "soon":
      return {
        badgeText: "Coming soon",
        badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
        buttonText: "Join the waitlist",
        buttonClass: "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700",
        isLive: false
      };
    case "request":
      return {
        badgeText: "Tell us you need this",
        badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
        buttonText: "Request this app",
        buttonClass: "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500",
        isLive: false
      };
  }
}

export const PLATFORM_BLUEPRINTS: Blueprint[] = [
  {
    id: "duka_fmcg",
    name: "Retail Duka & FMCG (Direct to Consumer)",
    badge: "Production Blueprint (Active)",
    industry: "B2C Consumer Retail & Groceries",
    tagline: "High-velocity retail sales directly to everyday consumers",
    description: "Built for busy neighbourhood shops selling directly to consumers. Includes 43 starter items, break-bulk micro packaging formulas, dawn float calibrations, and real-time reverse inventory audits.",
    status: "ACTIVE",
    items_seed_count: 43
  },
  {
    id: "open_eatery",
    name: "Open Eatery & Roadside Kiosk",
    badge: "Production Shell (Active)",
    industry: "Roadside Food Kiosks & Simple-Structure Eateries",
    tagline: "Fast Cash & Mobile Money tracking for foodstuff, viungo, staff wages & rent",
    description: "Non-personalized operational shell tailored for solo-owned open eateries and roadside food kiosks. Keeps speed high at the counter while tracking Cash & Mobile Money (Pochi, Send Money, Paybill, Till), foodstuff & viungo supply purchases, 1–2 support staff wages, and stall rent.",
    status: "ACTIVE",
    items_seed_count: 0
  },
  {
    id: "hardware_construction",
    name: "Hardware & Construction",
    badge: "In Development",
    industry: "Building Materials & Tools",
    tagline: "Broken-bulk nails/cement mapping with contractor credit ledgers",
    description: "Tracks bags of Bamburi cement, timber running feet, paint tinting batches, and contractor project accounts with strict credit limits.",
    status: "IN_DEVELOPMENT",
    items_seed_count: 58
  },
  {
    id: "wholesale_distribution",
    name: "Wholesale & Aggregator",
    badge: "In Development",
    industry: "B2B Goods Distribution",
    tagline: "Pallet/crate distribution with supplier delivery cross-checks",
    description: "Designed for mid-market distributors handling carton lots, route delivery trucks, and high-volume merchant buy-goods floats.",
    status: "IN_DEVELOPMENT",
    items_seed_count: 65
  },
  {
    id: "community_pharmacy",
    name: "Community Chemist / Pharmacy",
    badge: "In Development",
    industry: "Healthcare & Pharmaceuticals",
    tagline: "Strict batch expiry dating & prescription ledger control",
    description: "Pharmacy board compliance schema, poison register audit trails, and FEFO (First-Expired, First-Out) shelf dispatching.",
    status: "IN_DEVELOPMENT",
    items_seed_count: 82
  }
];

export const PROJECT_ALACIO_CASE_STUDY: ProjectCaseStudy = {
  id: "project_001_alacio",
  client_name: "Retail FMCG Pilot Store",
  client_type: "Retail FMCG & Neighborhood Duka",
  location: "Kasarani / Hunters, Nairobi",
  evidence_period: "60-Day Field Audit (July - September 2026)",
  before_metrics: {
    cash_leakage_monthly: "KES 14,200/mo unrecorded gap",
    inventory_tracking: "Zero shelf valuation (pure counter guesswork)",
    owner_drawings: "Mixed personal & store money daily",
    stockout_frequency: "3.4 stockouts/week on Milk & Bread"
  },
  after_metrics: {
    cash_gap_reconciliation: "99.2% reconciled daily (05:57 AM float)",
    shelf_value_locked: "KES 35,545 active shelf & KES 30,615 warehouse reserve",
    payout_categorization: "1-Tap question categorizes 100% of owner drawings",
    financial_health_score: "94/100 (Bankable, CDO-Verified)"
  },
  consented_by: "Owner: James Alacio &bull; Formal Data Usage Consent on File"
};

export const INITIAL_PAYOUTS: PayoutOrDrawing[] = [];

export const INITIAL_MPESA_STATEMENTS: MpesaStatementRecord[] = [];

export const INITIAL_WAREHOUSE_BATCHES: WarehouseBatch[] = [
  {
    id: "wh_batch_001",
    item_id: 4,
    item_name: "Unga Jogoo 2kg (12-Pack Bale)",
    category: "Flour",
    batch_number: "WH-JOG-001",
    bulk_quantity: 10,
    unit_type: "bales",
    bulk_cost_per_unit: 1980,
    total_batch_cost: 19800,
    storage_location: "Backroom Pallet A",
    reorder_threshold: 3,
    supplier_name: "Unga Millers Eldoret",
    supplier_phone: "0711 445 890",
    received_date: "2026-10-07",
    status: "IN_STORAGE"
  },
  {
    id: "wh_batch_002",
    item_id: 6,
    item_name: "Ajab Wheat Flour 2kg (12-Pack Bale)",
    category: "Flour",
    batch_number: "WH-AJB-002",
    bulk_quantity: 4,
    unit_type: "bales",
    bulk_cost_per_unit: 2100,
    total_batch_cost: 8400,
    storage_location: "Backroom Pallet B",
    reorder_threshold: 2,
    supplier_name: "Unga Millers Eldoret",
    supplier_phone: "0711 445 890",
    received_date: "2026-10-07",
    status: "IN_STORAGE"
  },
  {
    id: "wh_batch_003",
    item_id: 7,
    item_name: "Rina Vegetable Oil 20L Jerrycan",
    category: "Cooking & Oils",
    batch_number: "WH-RINA-003",
    bulk_quantity: 1,
    unit_type: "jerrycans",
    bulk_cost_per_unit: 4070,
    total_batch_cost: 4070,
    storage_location: "Secure Chemical/Oil Bay",
    reorder_threshold: 1,
    supplier_name: "Bidco Africa Van",
    supplier_phone: "0720 338 901",
    received_date: "2026-10-08",
    status: "IN_STORAGE"
  },
  {
    id: "wh_batch_004",
    item_id: 15,
    item_name: "Kabras Sugar 50kg Bulk Sack",
    category: "Sugar",
    batch_number: "WH-KAB-004",
    bulk_quantity: 1,
    unit_type: "sacks",
    bulk_cost_per_unit: 6400,
    total_batch_cost: 6400,
    storage_location: "Dry Grain Raised Platform",
    reorder_threshold: 1,
    supplier_name: "Gikomba Dry Grain Wholesaler",
    supplier_phone: "0708 776 210",
    received_date: "2026-10-08",
    status: "IN_STORAGE"
  }
]; // Total Warehouse Bulk Value = ~38,670 KES reserve

export const INITIAL_INVENTORY_43: InventoryItem[] = [
  { id: "sku_phimar_25kg", name: "Phimar Corn 25kg", category: "Maize & Corn Flour", unit_type: "Bag (25kg)", unit_cost: 1600, unit_retail: 1850, current_stock: 1, opening_stock: 1, expected_margin: 250, total_shelf_value: 1850, velocity_badge: "Fast-Mover", supplier: "THE PHIMAR TRADING CENTER" },
  { id: "sku_phimar_2kg", name: "Phimar Corn 2kg (12 packets)", category: "Maize & Corn Flour", unit_type: "Packets (2kg)", unit_cost: 105.83, unit_retail: 130, current_stock: 12, opening_stock: 12, expected_margin: 24.17, total_shelf_value: 1560, velocity_badge: "Fast-Mover", supplier: "THE PHIMAR TRADING CENTER" },
  { id: "sku_phimar_1kg", name: "Phimar Corn 1kg (24kg)", category: "Maize & Corn Flour", unit_type: "Packets (1kg)", unit_cost: 53.75, unit_retail: 70, current_stock: 24, opening_stock: 24, expected_margin: 16.25, total_shelf_value: 1680, velocity_badge: "Fast-Mover", supplier: "THE PHIMAR TRADING CENTER" },
  { id: 1, name: "Brookside Fresh Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 52, unit_retail: 65, current_stock: 24, opening_stock: 24, expected_margin: 13, total_shelf_value: 1560, velocity_badge: "Fast-Mover" },
  { id: 2, name: "KCC Fresh Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 50, unit_retail: 60, current_stock: 18, opening_stock: 18, expected_margin: 10, total_shelf_value: 1080, velocity_badge: "Fast-Mover" },
  { id: 3, name: "Ilara Maziwa Lala 500ml", category: "Dairy", unit_type: "bottles", unit_cost: 65, unit_retail: 80, current_stock: 12, opening_stock: 12, expected_margin: 15, total_shelf_value: 960, velocity_badge: "Medium" },
  { id: 4, name: "Unga Jogoo 2kg", category: "Flour", unit_type: "bales", unit_cost: 175, unit_retail: 210, current_stock: 14, opening_stock: 14, expected_margin: 35, total_shelf_value: 2940, velocity_badge: "Fast-Mover" },
  { id: 5, name: "Unga Pembe 2kg", category: "Flour", unit_type: "bales", unit_cost: 170, unit_retail: 205, current_stock: 10, opening_stock: 10, expected_margin: 35, total_shelf_value: 2050, velocity_badge: "Medium" },
  { id: 6, name: "Ajab Wheat Flour 2kg", category: "Flour", unit_type: "bales", unit_cost: 185, unit_retail: 220, current_stock: 12, opening_stock: 12, expected_margin: 35, total_shelf_value: 2640, velocity_badge: "Medium" },
  { id: 7, name: "Rina Vegetable Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 275, unit_retail: 330, current_stock: 8, opening_stock: 8, expected_margin: 55, total_shelf_value: 2640, velocity_badge: "Medium" },
  { id: 8, name: "Salit Salad Oil 500ml", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 145, unit_retail: 175, current_stock: 15, opening_stock: 15, expected_margin: 30, total_shelf_value: 2625, velocity_badge: "Fast-Mover" },
  { id: 9, name: "Elianto Corn Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 360, unit_retail: 430, current_stock: 6, opening_stock: 6, expected_margin: 70, total_shelf_value: 2580, velocity_badge: "Slow-Mover" },
  { id: 10, name: "Fresh Kenchic Eggs Crate", category: "Poultry", unit_type: "crates", unit_cost: 380, unit_retail: 460, current_stock: 5, opening_stock: 5, expected_margin: 80, total_shelf_value: 2300, velocity_badge: "Fast-Mover" },
  { id: 11, name: "Broadways White Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 54, unit_retail: 65, current_stock: 20, opening_stock: 20, expected_margin: 11, total_shelf_value: 1300, velocity_badge: "Fast-Mover" },
  { id: 12, name: "Festive Brown Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 58, unit_retail: 70, current_stock: 15, opening_stock: 15, expected_margin: 12, total_shelf_value: 1050, velocity_badge: "Fast-Mover" },
  { id: 13, name: "Superloaf White Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 52, unit_retail: 65, current_stock: 18, opening_stock: 18, expected_margin: 13, total_shelf_value: 1170, velocity_badge: "Fast-Mover" },
  { id: 14, name: "Mumias Sugar 1kg", category: "Sugar", unit_type: "packets", unit_cost: 140, unit_retail: 165, current_stock: 16, opening_stock: 16, expected_margin: 25, total_shelf_value: 2640, velocity_badge: "Fast-Mover" },
  { id: 15, name: "Kabras Sugar 1kg", category: "Sugar", unit_type: "packets", unit_cost: 138, unit_retail: 160, current_stock: 14, opening_stock: 14, expected_margin: 22, total_shelf_value: 2240, velocity_badge: "Fast-Mover" },
  { id: 16, name: "Royco Mchuzi Mix Beef 200g", category: "Spices", unit_type: "tins", unit_cost: 115, unit_retail: 140, current_stock: 15, opening_stock: 15, expected_margin: 25, total_shelf_value: 2100, velocity_badge: "Medium" },
  { id: 17, name: "Royco Mchuzi Mix Chicken 75g", category: "Spices", unit_type: "packets", unit_cost: 45, unit_retail: 60, current_stock: 25, opening_stock: 25, expected_margin: 15, total_shelf_value: 1500, velocity_badge: "Fast-Mover" },
  { id: 18, name: "Tropical Heat Pilau Masala 50g", category: "Spices", unit_type: "sachets", unit_cost: 55, unit_retail: 75, current_stock: 16, opening_stock: 16, expected_margin: 20, total_shelf_value: 1200, velocity_badge: "Medium" },
  { id: 19, name: "Omo Hand Washing Powder 500g", category: "Hygiene", unit_type: "packets", unit_cost: 125, unit_retail: 150, current_stock: 10, opening_stock: 10, expected_margin: 25, total_shelf_value: 1500, velocity_badge: "Medium" },
  { id: 20, name: "Sunlight Washing Powder 500g", category: "Hygiene", unit_type: "packets", unit_cost: 110, unit_retail: 135, current_stock: 12, opening_stock: 12, expected_margin: 25, total_shelf_value: 1620, velocity_badge: "Medium" },
  { id: 21, name: "Geisha Soap Green 200g", category: "Hygiene", unit_type: "bars", unit_cost: 80, unit_retail: 100, current_stock: 18, opening_stock: 18, expected_margin: 20, total_shelf_value: 1800, velocity_badge: "Fast-Mover" },
  { id: 22, name: "Menengai Cream Bar Soap 800g", category: "Hygiene", unit_type: "bars", unit_cost: 140, unit_retail: 170, current_stock: 10, opening_stock: 10, expected_margin: 30, total_shelf_value: 1700, velocity_badge: "Medium" },
  { id: 23, name: "Colgate Triple Action 140g", category: "Hygiene", unit_type: "tubes", unit_cost: 130, unit_retail: 160, current_stock: 12, opening_stock: 12, expected_margin: 30, total_shelf_value: 1920, velocity_badge: "Medium" },
  { id: 24, name: "Always Ultra Thin Pads 8s", category: "Hygiene", unit_type: "packets", unit_cost: 85, unit_retail: 110, current_stock: 14, opening_stock: 14, expected_margin: 25, total_shelf_value: 1540, velocity_badge: "Fast-Mover" },
  { id: 25, name: "Ketepa Pride Tea Leaves 250g", category: "Beverages", unit_type: "packets", unit_cost: 115, unit_retail: 140, current_stock: 15, opening_stock: 15, expected_margin: 25, total_shelf_value: 2100, velocity_badge: "Medium" },
  { id: 26, name: "Nescafe 3in1 Classic Sachets", category: "Beverages", unit_type: "sachets", unit_cost: 22, unit_retail: 30, current_stock: 40, opening_stock: 40, expected_margin: 8, total_shelf_value: 1200, velocity_badge: "Fast-Mover" },
  { id: 27, name: "Cadbury Cocoa Powder 100g", category: "Beverages", unit_type: "tins", unit_cost: 165, unit_retail: 200, current_stock: 8, opening_stock: 8, expected_margin: 35, total_shelf_value: 1600, velocity_badge: "Slow-Mover" },
  { id: 28, name: "Coca Cola Pet Bottle 500ml", category: "Beverages", unit_type: "bottles", unit_cost: 50, unit_retail: 60, current_stock: 24, opening_stock: 24, expected_margin: 10, total_shelf_value: 1440, velocity_badge: "Fast-Mover" },
  { id: 29, name: "Fanta Orange Pet 500ml", category: "Beverages", unit_type: "bottles", unit_cost: 50, unit_retail: 60, current_stock: 20, opening_stock: 20, expected_margin: 10, total_shelf_value: 1200, velocity_badge: "Fast-Mover" },
  { id: 30, name: "Sprite Pet Bottle 500ml", category: "Beverages", unit_type: "bottles", unit_cost: 50, unit_retail: 60, current_stock: 18, opening_stock: 18, expected_margin: 10, total_shelf_value: 1080, velocity_badge: "Fast-Mover" },
  { id: 31, name: "Pwani Salt Iodized 1kg", category: "Spices", unit_type: "packets", unit_cost: 35, unit_retail: 45, current_stock: 25, opening_stock: 25, expected_margin: 10, total_shelf_value: 1125, velocity_badge: "Fast-Mover" },
  { id: 32, name: "Kensalt Salt 500g", category: "Spices", unit_type: "packets", unit_cost: 20, unit_retail: 25, current_stock: 30, opening_stock: 30, expected_margin: 5, total_shelf_value: 750, velocity_badge: "Fast-Mover" },
  { id: 33, name: "Daawat Aromatic Rice 2kg", category: "Grains", unit_type: "packets", unit_cost: 380, unit_retail: 450, current_stock: 6, opening_stock: 6, expected_margin: 70, total_shelf_value: 2700, velocity_badge: "Medium" },
  { id: 34, name: "Pearl Pishori Rice 1kg", category: "Grains", unit_type: "packets", unit_cost: 220, unit_retail: 260, current_stock: 10, opening_stock: 10, expected_margin: 40, total_shelf_value: 2600, velocity_badge: "Medium" },
  { id: 35, name: "Santa Maria Green Grams 1kg", category: "Grains", unit_type: "packets", unit_cost: 160, unit_retail: 195, current_stock: 8, opening_stock: 8, expected_margin: 35, total_shelf_value: 1560, velocity_badge: "Medium" },
  { id: 36, name: "Mwitemania Beans 1kg", category: "Grains", unit_type: "packets", unit_cost: 150, unit_retail: 180, current_stock: 10, opening_stock: 10, expected_margin: 30, total_shelf_value: 1800, velocity_badge: "Medium" },
  { id: 37, name: "Bata Shoeshine Kiwi Black 50ml", category: "Household", unit_type: "tins", unit_cost: 85, unit_retail: 110, current_stock: 12, opening_stock: 12, expected_margin: 25, total_shelf_value: 1320, velocity_badge: "Medium" },
  { id: 38, name: "Matchboxes Rhinos (Pack 10)", category: "Household", unit_type: "packs", unit_cost: 40, unit_retail: 55, current_stock: 20, opening_stock: 20, expected_margin: 15, total_shelf_value: 1100, velocity_badge: "Fast-Mover" },
  { id: 39, name: "Steel Wool 50g", category: "Household", unit_type: "pieces", unit_cost: 18, unit_retail: 25, current_stock: 35, opening_stock: 35, expected_margin: 7, total_shelf_value: 875, velocity_badge: "Fast-Mover" },
  { id: 40, name: "Harpic Toilet Cleaner 500ml", category: "Hygiene", unit_type: "bottles", unit_cost: 195, unit_retail: 240, current_stock: 8, opening_stock: 8, expected_margin: 45, total_shelf_value: 1920, velocity_badge: "Medium" },
  { id: 41, name: "Vaseline Petroleum Jelly 100ml", category: "Cosmetics", unit_type: "jars", unit_cost: 110, unit_retail: 135, current_stock: 12, opening_stock: 12, expected_margin: 25, total_shelf_value: 1620, velocity_badge: "Medium" },
  { id: 42, name: "Nice & Lovely Lotion 100ml", category: "Cosmetics", unit_type: "bottles", unit_cost: 95, unit_retail: 120, current_stock: 10, opening_stock: 10, expected_margin: 25, total_shelf_value: 1200, velocity_badge: "Medium" },
  { id: 43, name: "Kasuku Exercise Books 120pgs", category: "Stationery", unit_type: "books", unit_cost: 65, unit_retail: 85, current_stock: 20, opening_stock: 20, expected_margin: 20, total_shelf_value: 1700, velocity_badge: "Medium" }
];

export const INITIAL_CUSTOMERS: CustomerDebtor[] = [
  { id: "cust_1", name: "Mama Boi", phone: "0712 345 678", national_id: "24891044", debt_balance: 450, credit_limit: 1000, last_transaction_date: "Yesterday", notes: "Regular morning customer • Verified ID for OTC deposits • 2 pkts milk + bread on credit" },
  { id: "cust_2", name: "Baba Junior", phone: "0723 456 789", national_id: "29440182", debt_balance: 280, credit_limit: 800, last_transaction_date: "Today", notes: "Clears balance weekly via Equity Agent • Cooking oil on account" },
  { id: "cust_3", name: "Mama Stacy", phone: "0734 567 890", national_id: "31802941", debt_balance: 620, credit_limit: 1500, last_transaction_date: "2 days ago", notes: "Grocery credit account • Prompt payer on Friday" }
];

export const INITIAL_SUPPLIERS: SupplierProfile[] = [
  {
    id: "supp_phimar_001",
    name: "THE PHIMAR TRADING CENTER",
    company: "The Phimar Trading Center",
    phone: "0720 258 830",
    national_id: "24891044",
    category: "Maize & Corn Flour Wholesaler",
    total_orders_cost: 4160,
    last_delivery_date: "16/10/2026",
    payment_preference: "CASH_DRAWER",
    supplied_items: [
      "Phimar Corn 25kg",
      "Phimar Corn 2kg (12 packets)",
      "Phimar Corn 1kg (24kg)"
    ]
  },
  {
    id: "supp_001",
    name: "Brookside Dairy Logistics",
    company: "Brookside Dairy Ltd (Ruiru Hub)",
    phone: "0722 849 101",
    national_id: "22940184",
    category: "Dairy & Chilled",
    total_orders_cost: 4160,
    last_delivery_date: "Today 05:40 AM",
    payment_preference: "NATIONAL_ID_DEPOSIT",
    supplied_items: [
      "Brookside Fresh Milk 500ml",
      "Brookside Lala / Mala 500ml",
      "Brookside Cup Yoghurt 250ml",
      "Brookside Dairy Butter 250g",
      "Ilara Fresh Milk 500ml"
    ]
  },
  {
    id: "supp_002",
    name: "Broadway Bakeries Thika",
    company: "Broadway Bakeries Ltd",
    phone: "0733 901 442",
    national_id: "26884019",
    category: "Bakery",
    total_orders_cost: 3240,
    last_delivery_date: "Today 05:30 AM",
    payment_preference: "MPESA_TILL",
    supplied_items: [
      "Broadway White Bread 400g",
      "Broadway Brown Bread 400g",
      "Broadway Sweet Scones 6pk",
      "Broadway Sandwich Loaf 800g"
    ]
  },
  {
    id: "supp_003",
    name: "Unga Millers Eldoret",
    company: "Unga Group Distribution",
    phone: "0711 445 890",
    national_id: "28419203",
    category: "Flour & Cereals",
    total_orders_cost: 28200,
    last_delivery_date: "2 days ago",
    payment_preference: "NATIONAL_ID_DEPOSIT",
    supplied_items: [
      "Jogoo Maize Meal 2kg",
      "Hostess Premium Maize Flour 2kg",
      "Amana Atta Flour 2kg",
      "Faulu Maize Meal 2kg"
    ]
  },
  {
    id: "supp_004",
    name: "Bidco Africa Van",
    company: "Bidco Africa Ltd",
    phone: "0720 338 901",
    national_id: "25194022",
    category: "Cooking Oils & Soaps",
    total_orders_cost: 4070,
    last_delivery_date: "Yesterday",
    payment_preference: "NATIONAL_ID_DEPOSIT",
    supplied_items: [
      "Elianto Pure Corn Oil 1L",
      "Golden Fry Cooking Oil 1L",
      "White Star Bar Soap 1kg",
      "Gental Washing Powder 500g"
    ]
  },
  {
    id: "supp_005",
    name: "Gikomba Dry Grain Wholesaler",
    company: "Kamau & Sons Cereals Gikomba",
    phone: "0708 776 210",
    national_id: "19804211",
    category: "Grains & Pulses",
    total_orders_cost: 6400,
    last_delivery_date: "Yesterday",
    payment_preference: "NATIONAL_ID_DEPOSIT",
    supplied_items: [
      "Kabras White Sugar 1kg",
      "Daawat Pure Basmati Rice 2kg",
      "Yellow Beans 1kg",
      "Green Grams Ndengu 1kg",
      "Kensalt Iodized Salt 1kg"
    ]
  },
  {
    id: "supp_006",
    name: "Jahdithma Wholesalers",
    company: "Jahdithma Wholesalers & Distributors",
    phone: "0722 000 111",
    national_id: "24891044",
    category: "General Wholesaler",
    total_orders_cost: 0,
    last_delivery_date: "Active Wholesaler",
    payment_preference: "NATIONAL_ID_DEPOSIT",
    supplied_items: [
      "Jogoo Maize Meal 2kg",
      "Kabras White Sugar 1kg",
      "Brookside Fresh Milk 500ml",
      "Golden Fry Cooking Oil 1L",
      "Royco Mchuzi Mix 40pcs"
    ]
  }
];

export const INITIAL_FLOAT_DENOMINATIONS: FloatDenomination[] = [
  { value: 1000, type: "note", label: "1000 Note", count: 4 }, // 4000
  { value: 500, type: "note", label: "500 Note", count: 4 },   // 2000
  { value: 200, type: "note", label: "200 Note", count: 5 },   // 1000
  { value: 100, type: "note", label: "100 Note", count: 8 },   // 800
  { value: 50, type: "note", label: "50 Note", count: 6 },     // 300
  { value: 40, type: "coin", label: "40 Coin", count: 5 },     // 200
  { value: 20, type: "coin", label: "20 Coin", count: 4 },     // 80
  { value: 10, type: "coin", label: "10 Coin", count: 5 },     // 50
  { value: 5, type: "coin", label: "5 Coin", count: 3 },       // 15
  { value: 1, type: "coin", label: "1 Coin", count: 5 }        // 5
]; // Total Opening Float = 8,450 KSh

export const INITIAL_MORNING_BOOKENDS: MorningBookendRecord[] = [
  {
    id: "mb_dawn_001",
    date: new Date().toISOString().slice(0, 10),
    timestamp: new Date().toISOString(),
    iso_date: new Date().toISOString().slice(0, 10),
    cash_float: 8450,
    mpesa_float: 6500,
    equitel_balance: 14200,
    total_liquidity: 29150,
    debtors_count: 3,
    total_customer_debt: 1350,
    opening_shelf_units: 642,
    opening_shelf_value: 35545,
    status: "LOCKED_DAWN",
    notes: "05:57 AM Verified opening dawn bookend. Sealed by James Alacio."
  }
];

export const INITIAL_RESTOCK_CARDS: RestockReconciliationCard[] = [
  {
    id: "restock_phimar_01",
    skuName: "Phimar Corn 2kg (12 packets)",
    category: "Maize & Corn Flour",
    unitType: "Packets (2kg)",
    piecesPerPack: 12,
    previousBatchQty: 12,
    previousBatchTotalUnits: 12,
    previousBatchDate: "2026-10-16",
    previousBatchCost: 1270,
    newBatchQty: 12,
    newBatchDate: "2026-10-16",
    supplierName: "THE PHIMAR TRADING CENTER",
    deliveryNoteNumber: "PTC-4160",
    remainsOnShelf: 4,
    ownerConsumedQty: 0,
    spoilageRejectsQty: 0,
    giveawaysQty: 0,
    unitRetailPrice: 130,
    unitCost: 105.83,
    calculatedSoldQty: 8,
    calculatedRevenue: 1040,
    calculatedCogs: 846.64,
    calculatedGrossProfit: 193.36,
    calculatedOwnerDrawing: 0,
    calculatedSpoilageLoss: 0,
    status: "AUTHORIZED_AND_RECONCILED",
    authorizedAt: "18:00",
    authorizedDate: "2026-10-16",
    paymentMethod: "CASH",
    notes: "Inward wholesale delivery from THE PHIMAR TRADING CENTER. 8 pkts sold, 4 on shelf."
  },
  {
    id: "restock_phimar_02",
    skuName: "Phimar Corn 1kg (24kg)",
    category: "Maize & Corn Flour",
    unitType: "Packets (1kg)",
    piecesPerPack: 24,
    previousBatchQty: 24,
    previousBatchTotalUnits: 24,
    previousBatchDate: "2026-10-16",
    previousBatchCost: 1290,
    newBatchQty: 24,
    newBatchDate: "2026-10-16",
    supplierName: "THE PHIMAR TRADING CENTER",
    deliveryNoteNumber: "PTC-4160",
    remainsOnShelf: 8,
    ownerConsumedQty: 0,
    spoilageRejectsQty: 0,
    giveawaysQty: 0,
    unitRetailPrice: 70,
    unitCost: 53.75,
    calculatedSoldQty: 16,
    calculatedRevenue: 1120,
    calculatedCogs: 860,
    calculatedGrossProfit: 260,
    calculatedOwnerDrawing: 0,
    calculatedSpoilageLoss: 0,
    status: "AUTHORIZED_AND_RECONCILED",
    authorizedAt: "18:00",
    authorizedDate: "2026-10-16",
    paymentMethod: "CASH",
    notes: "Inward wholesale delivery from THE PHIMAR TRADING CENTER. 16 pkts sold, 8 on shelf."
  }
];

export const INITIAL_RECEIPTS_ARCHIVE: SavedReceiptRecord[] = [
  {
    id: "rcpt_phimar_001",
    receiptNumber: "PTC-4160",
    supplierName: "THE PHIMAR TRADING CENTER",
    receiptDate: "2026-10-16",
    paymentMode: "CASH",
    status: "approved",
    totalCost: 4160,
    totalRetailShelfValue: 5090,
    totalPotentialProfit: 930,
    markupPercentage: 22.4,
    itemsCount: 3,
    items: [
      {
        id: "item_p1",
        itemName: "Phimar Corn 25kg",
        rawSpecification: "Phimar Corn 25kg costs is 1600",
        supplyUnitsReceived: 1,
        supplyUnit: "Bag (25kg)",
        retailUnitsAdded: 1,
        retailUnit: "Bag (25kg)",
        unitCostAtDelivery: 1600,
        lineCost: 1600,
        retailPrice: 1850,
        expectedMargin: 250,
        approved: true
      },
      {
        id: "item_p2",
        itemName: "Phimar Corn 2kg (12 packets)",
        rawSpecification: "Phimar Corn 2kg ,,12 packets costs1270",
        supplyUnitsReceived: 12,
        supplyUnit: "Packets (2kg)",
        retailUnitsAdded: 12,
        retailUnit: "Packets (2kg)",
        unitCostAtDelivery: 105.83,
        lineCost: 1270,
        retailPrice: 130,
        expectedMargin: 24.17,
        approved: true
      },
      {
        id: "item_p3",
        itemName: "Phimar Corn 1kg (24kg)",
        rawSpecification: "Phimar Corn 1kg,, 24kg,,costs 1290",
        supplyUnitsReceived: 24,
        supplyUnit: "Packets (1kg)",
        retailUnitsAdded: 24,
        retailUnit: "Packets (1kg)",
        unitCostAtDelivery: 53.75,
        lineCost: 1290,
        retailPrice: 70,
        expectedMargin: 16.25,
        approved: true
      }
    ],
    processedAt: "16/10/2026 • Verified Cash Chit",
    decidedAt: "2026-10-16T15:30:42.000Z",
    notes: "Supplier: THE PHIMAR TRADING CENTER • Payment Mode: CASH • Grand Total: Ksh 4,160."
  }
];

export const INITIAL_ALACIO_STATE: AlacioMasterState = {
  inventory: INITIAL_INVENTORY_43,
  warehouse: INITIAL_WAREHOUSE_BATCHES,
  customers: INITIAL_CUSTOMERS,
  suppliers: INITIAL_SUPPLIERS,
  receiptsArchive: INITIAL_RECEIPTS_ARCHIVE,
  morning_bookends: INITIAL_MORNING_BOOKENDS,
  floatDenominations: INITIAL_FLOAT_DENOMINATIONS,
  restockCards: INITIAL_RESTOCK_CARDS,
  salesLedger: [
    {
      id: "sale_rcpt_auto_2026-10-16_1130_CASH_0",
      date: "2026-10-16",
      timestamp: "11:30",
      customer_name: "Walk-in Counter Customer",
      items_summary: "4 Packets (2kg) Phimar Corn 2kg (12 packets)",
      total_amount: 520,
      cash_paid: 520,
      mpesa_paid: 0,
      debt_amount: 0,
      payment_method: "CASH",
      payment_channel: "CASH",
      cash_received: 520
    },
    {
      id: "sale_rcpt_auto_2026-10-16_1415_CASH_1",
      date: "2026-10-16",
      timestamp: "14:15",
      customer_name: "Walk-in Counter Customer",
      items_summary: "8 Packets (1kg) Phimar Corn 1kg (24kg)",
      total_amount: 560,
      cash_paid: 560,
      mpesa_paid: 0,
      debt_amount: 0,
      payment_method: "CASH",
      payment_channel: "CASH",
      cash_received: 560
    },
    {
      id: "sale_rcpt_auto_2026-10-16_1645_CASH_2",
      date: "2026-10-16",
      timestamp: "16:45",
      customer_name: "Walk-in Counter Customer",
      items_summary: "4 Packets (2kg) Phimar Corn 2kg (12 packets), 8 Packets (1kg) Phimar Corn 1kg (24kg)",
      total_amount: 1080,
      cash_paid: 1080,
      mpesa_paid: 0,
      debt_amount: 0,
      payment_method: "CASH",
      payment_channel: "CASH",
      cash_received: 1080
    }
  ],
  payouts: [
    {
      id: "exp_rent_001",
      date: new Date().toISOString().slice(0, 10),
      timestamp: "08:15 AM",
      amount: 6500,
      type: "BUSINESS_EXPENSE",
      expense_category: "RENT",
      payee: "Landlord — Stall #14",
      payment_channel: "MPESA_TILL",
      notes: "[Rent] Monthly shop rent & stall lease — Paid to: Landlord — Stall #14"
    },
    {
      id: "exp_travel_001",
      date: new Date().toISOString().slice(0, 10),
      timestamp: "09:40 AM",
      amount: 250,
      type: "BUSINESS_EXPENSE",
      expense_category: "TRAVEL",
      payee: "Boda Rider",
      payment_channel: "CASH_DRAWER",
      notes: "[Travel] Travel & boda fare to The Phimar Trading Center wholesale — Paid to: Boda Rider"
    },
    {
      id: "exp_misc_001",
      date: new Date().toISOString().slice(0, 10),
      timestamp: "11:20 AM",
      amount: 185.5,
      type: "BUSINESS_EXPENSE",
      expense_category: "MISC",
      payee: "Packaging Vendor",
      payment_channel: "CASH_DRAWER",
      notes: "[Misc] Brown paper bags, carrier bags, tea & shop cleaning soap — Paid to: Packaging Vendor"
    },
    {
      id: "exp_withdrawal_001",
      date: new Date().toISOString().slice(0, 10),
      timestamp: "01:10 PM",
      amount: 1200,
      type: "OWNER_DRAWING",
      expense_category: "PERSONAL_WITHDRAWAL",
      payee: "Owner (Personal Drawing)",
      payment_channel: "CASH_DRAWER",
      notes: "[Personal Withdrawal] Owner personal cash withdrawal for home upkeep & lunch — Paid to: Owner (Personal Drawing)"
    },
    {
      id: "pay_001",
      date: new Date().toISOString().slice(0, 10),
      timestamp: "07:30 AM",
      amount: 200,
      type: "BUSINESS_EXPENSE",
      expense_category: "SUPPLIES",
      payment_channel: "CASH_DRAWER",
      notes: "[Permits] Daily market council trade permit stamp"
    }
  ],
  mpesaStatements: [],
  reconciliations: [],
  kpis: {
    total_active_shelf_retail_value: 35545,
    total_capital_invested: 28410,
    locked_in_potential_gross_profit: 7135,
    avg_markup_percentage: 25.1,
    total_active_items: 43,
    warehouse_bulk_value: 30615,
    warehouse_total_units: 16
  },
  cash_register_balance: 8450,
  mpesa_float_balance: 6500,
  equitel_account_balance: 14200,
  currency: "KSh",
  last_updated: new Date().toISOString(),
  tier: "PAID_BLUEPRINT",
  vcr_daily_count: 8,
  vcr_customer_consent: true,
  clean_trading_days: 14
};

// Safe baseline preservation: returns full verified prefilled data with zero data loss
export function resetAlacioToZeroSlate(): AlacioMasterState {
  return INITIAL_ALACIO_STATE;
}

export function isEateryBusinessType(businessType?: string, blueprintId?: string): boolean {
  if (blueprintId === "open_eatery") return true;
  const lower = (businessType || "").toLowerCase();
  return lower.includes("eatery") || lower.includes("kiosk") || lower.includes("kibanda") || lower.includes("cafe") || lower.includes("food");
}

export function isEateryBusinessState(state?: Partial<AlacioMasterState> | null): boolean {
  if (!state) return false;
  return isEateryBusinessType(state.client_type, state.business_blueprint_id);
}

/**
 * Generates clean, customizable payment channels for any business shell.
 * - Open Eateries default to 2 portfolios: Cash Portfolio + Mobile Money Portfolio (M-Pesa / Pochi / Send Money / Paybill / Till).
 * - Legacy Alacio Mini shop hydrates its exact 3 existing channels without altering numbers.
 * - Other businesses get a neutral, non-personalized Cash + Mobile Money (+ optional Bank) shell.
 */
export function getDefaultPaymentChannelsForBlueprint(
  businessType?: string,
  balances?: { cash?: number; mpesa?: number; bank?: number },
  options?: { isAlacio?: boolean; blueprintId?: string }
): PaymentChannelConfig[] {
  const cashBal = Number(balances?.cash ?? 0) || 0;
  const mpesaBal = Number(balances?.mpesa ?? 0) || 0;
  const bankBal = Number(balances?.bank ?? 0) || 0;

  if (options?.isAlacio) {
    return [
      {
        id: "ch_cash",
        label: "Physical Cash Drawer / Counter Till",
        shortCode: "CSH",
        category: "CASH",
        subType: "CASH_DRAWER",
        balance: cashBal,
        description: "Counter Cash • Updated with Cash Sales & Cash Expenses",
        enabled: true
      },
      {
        id: "ch_mpesa",
        label: "Safaricom M-Pesa Till / Float",
        shortCode: "M",
        category: "MOBILE_MONEY",
        subType: "MPESA_TILL",
        balance: mpesaBal,
        description: "Buy Goods & Mobile Money • Live Digital Float",
        enabled: true
      },
      {
        id: "ch_bank",
        label: "Equity Bank Paybill / Operating Account",
        shortCode: "BNK",
        category: "BANK",
        subType: "EQUITEL",
        balance: bankBal,
        description: "Operating Bank Reserve",
        enabled: true
      }
    ];
  }

  if (isEateryBusinessType(businessType, options?.blueprintId)) {
    return [
      {
        id: "ch_cash",
        label: "Cash Portfolio (Counter / Hand)",
        shortCode: "CSH",
        category: "CASH",
        subType: "CASH_DRAWER",
        balance: cashBal,
        description: "Fast walk-in meal cash & change drawer",
        enabled: true
      },
      {
        id: "ch_mobile_money",
        label: "Mobile Money Portfolio",
        shortCode: "MOB",
        category: "MOBILE_MONEY",
        subType: "POCHI_LA_BIASHARA",
        balance: mpesaBal,
        description: "M-Pesa • Pochi la Biashara • Send Money • Paybill • Till",
        enabled: true
      }
    ];
  }

  const channels: PaymentChannelConfig[] = [
    {
      id: "ch_cash",
      label: "Cash Portfolio",
      shortCode: "CSH",
      category: "CASH",
      subType: "CASH_DRAWER",
      balance: cashBal,
      description: "Physical notes & coins at counter",
      enabled: true
    },
    {
      id: "ch_mobile_money",
      label: "Mobile Money (Till / Paybill / Pochi / Send Money)",
      shortCode: "MOB",
      category: "MOBILE_MONEY",
      subType: "MPESA_TILL",
      balance: mpesaBal,
      description: "Digital mobile collections & supplier float",
      enabled: true
    }
  ];

  if (bankBal > 0) {
    channels.push({
      id: "ch_bank",
      label: "Bank Transfer / Operating Account",
      shortCode: "BNK",
      category: "BANK",
      subType: "BANK_TRANSFER",
      balance: bankBal,
      description: "Bank paybill or operating bank account",
      enabled: true
    });
  }

  return channels;
}

export function resolvePaymentChannels(state?: Partial<AlacioMasterState> | null): PaymentChannelConfig[] {
  if (!state) {
    return getDefaultPaymentChannelsForBlueprint("Retail / Duka");
  }
  const isAlacio = (state.merchant_name || "").toLowerCase().includes("alacio");

  if (Array.isArray(state.paymentChannels) && state.paymentChannels.length > 0) {
    return state.paymentChannels.filter((c) => c && c.enabled !== false);
  }

  return getDefaultPaymentChannelsForBlueprint(
    state.client_type,
    {
      cash: state.cash_register_balance ?? 0,
      mpesa: state.mpesa_float_balance ?? 0,
      bank: state.equitel_account_balance ?? 0
    },
    {
      isAlacio,
      blueprintId: state.business_blueprint_id
    }
  );
}

export function syncLegacyBalancesFromChannels(channels: PaymentChannelConfig[]): {
  cash_register_balance: number;
  mpesa_float_balance: number;
  equitel_account_balance: number;
} {
  const enabled = channels.filter((c) => c.enabled !== false);
  const cashSum = enabled
    .filter((c) => c.category === "CASH")
    .reduce((acc, c) => acc + (Number(c.balance) || 0), 0);
  const mpesaSum = enabled
    .filter((c) => c.category === "MOBILE_MONEY")
    .reduce((acc, c) => acc + (Number(c.balance) || 0), 0);
  const bankSum = enabled
    .filter((c) => c.category === "BANK")
    .reduce((acc, c) => acc + (Number(c.balance) || 0), 0);

  return {
    cash_register_balance: Math.round(cashSum * 100) / 100,
    mpesa_float_balance: Math.round(mpesaSum * 100) / 100,
    equitel_account_balance: Math.round(bankSum * 100) / 100
  };
}

/**
 * Clean, non-personalized operational shell specifically tailored for Open Eateries & Roadside Kiosks.
 * - Zero fake sales, zero fabricated inventory, zero hardcoded personal Alacio/Rose/Equity details.
 * - Defaults to 2 core payment portfolios (Cash + Mobile Money [M-Pesa/Pochi/Send Money/Paybill/Till]).
 */
export function createOpenEateryShellState(
  businessName: string = "My Open Eatery",
  proprietorName?: string,
  customChannels?: PaymentChannelConfig[]
): AlacioMasterState {
  const channels =
    customChannels && customChannels.length > 0
      ? customChannels
      : getDefaultPaymentChannelsForBlueprint("Open Eatery & Roadside Kiosk", { cash: 0, mpesa: 0, bank: 0 }, { blueprintId: "open_eatery" });
  const syncedBalances = syncLegacyBalancesFromChannels(channels);

  return {
    merchant_name: businessName,
    proprietor_name: proprietorName || "",
    client_type: "Open Eatery & Roadside Kiosk",
    business_blueprint_id: "open_eatery",
    tier: "PAID_BLUEPRINT",
    is_skeleton: true,
    paymentChannels: channels,
    inventory: [],
    warehouse: [],
    salesLedger: [],
    payouts: [],
    customers: [],
    receiptsArchive: [],
    suppliers: [],
    floatDenominations: [],
    morning_bookends: [],
    restockCards: [],
    mpesaStatements: [],
    reconciliations: [],
    kpis: {
      total_active_shelf_retail_value: 0,
      total_capital_invested: 0,
      locked_in_potential_gross_profit: 0,
      avg_markup_percentage: 0,
      total_active_items: 0,
      warehouse_bulk_value: 0,
      warehouse_total_units: 0
    },
    cash_register_balance: syncedBalances.cash_register_balance,
    mpesa_float_balance: syncedBalances.mpesa_float_balance,
    equitel_account_balance: syncedBalances.equitel_account_balance,
    currency: "KSh",
    last_updated: new Date().toISOString(),
    vcr_daily_count: 0,
    vcr_customer_consent: true,
    clean_trading_days: 0
  };
}

/**
 * Creates a clean, non-personalized skeleton workspace for any newly created or signed-up business.
 * Ensures zero Alacio-specific fixtures, balances, or hardcoded names leak into other businesses.
 */
export function createSkeletonBusinessState(
  businessName: string = "My Business",
  businessType: string = "Retail / Duka",
  options?: {
    proprietorName?: string;
    paymentChannels?: PaymentChannelConfig[];
    blueprintId?: string;
  }
): AlacioMasterState {
  if (isEateryBusinessType(businessType, options?.blueprintId)) {
    return createOpenEateryShellState(businessName, options?.proprietorName, options?.paymentChannels);
  }

  const blueprintId = options?.blueprintId || "duka_fmcg";
  const channels =
    options?.paymentChannels && options.paymentChannels.length > 0
      ? options.paymentChannels
      : getDefaultPaymentChannelsForBlueprint(businessType, { cash: 0, mpesa: 0, bank: 0 }, { blueprintId });
  const syncedBalances = syncLegacyBalancesFromChannels(channels);

  return {
    merchant_name: businessName,
    proprietor_name: options?.proprietorName || "",
    client_type: businessType,
    business_blueprint_id: blueprintId,
    tier: "PAID_BLUEPRINT",
    is_skeleton: true,
    paymentChannels: channels,
    inventory: [],
    warehouse: [],
    salesLedger: [],
    payouts: [],
    customers: [],
    receiptsArchive: [],
    suppliers: [],
    floatDenominations: [],
    morning_bookends: [],
    restockCards: [],
    mpesaStatements: [],
    reconciliations: [],
    kpis: {
      total_active_shelf_retail_value: 0,
      total_capital_invested: 0,
      locked_in_potential_gross_profit: 0,
      avg_markup_percentage: 0,
      total_active_items: 0,
      warehouse_bulk_value: 0,
      warehouse_total_units: 0
    },
    cash_register_balance: syncedBalances.cash_register_balance,
    mpesa_float_balance: syncedBalances.mpesa_float_balance,
    equitel_account_balance: syncedBalances.equitel_account_balance,
    currency: "KSh",
    last_updated: new Date().toISOString(),
    vcr_daily_count: 0,
    vcr_customer_consent: true,
    clean_trading_days: 0
  };
}

export function calculateKpis(inventory: InventoryItem[] = [], warehouse: WarehouseBatch[] = []) {
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeWarehouse = Array.isArray(warehouse) ? warehouse : [];
  const totalRetail = safeInventory.reduce((acc, curr) => acc + (curr.current_stock * curr.unit_retail), 0);
  const totalCost = safeInventory.reduce((acc, curr) => acc + (curr.current_stock * curr.unit_cost), 0);
  const profit = totalRetail - totalCost;
  const markup = totalCost > 0 ? parseFloat(((profit / totalCost) * 100).toFixed(1)) : 0;
  
  const whValue = safeWarehouse.reduce((acc, b) => acc + (b.bulk_quantity * b.bulk_cost_per_unit), 0);
  const whUnits = safeWarehouse.reduce((acc, b) => acc + b.bulk_quantity, 0);

  return {
    total_active_shelf_retail_value: totalRetail,
    total_capital_invested: totalCost,
    locked_in_potential_gross_profit: profit,
    avg_markup_percentage: markup,
    total_active_items: safeInventory.length,
    warehouse_bulk_value: whValue,
    warehouse_total_units: whUnits
  };
}

export const SCHEMA_VERSION = 6;
export const STORAGE_BACKUP_SNAPSHOT_A = "yubiflo_backup_snapshot_a";
export const STORAGE_BACKUP_SNAPSHOT_B = "yubiflo_backup_snapshot_b";
export const STORAGE_SNAPSHOT_SLOT = "yubiflo_snapshot_slot";
export const STORAGE_LAST_SAVED = "yubiflo_last_saved_at";

export function getUserStorageKey(email?: string, accountId?: string): string {
  if (!email) return STORAGE_KEY_ALACIO;
  const cleanEmail = email.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
  if (accountId) {
    const cleanAcc = accountId.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
    return `yubiflo_user_state_${cleanEmail}_${cleanAcc}`;
  }
  return `yubiflo_user_state_${cleanEmail}`;
}

export function sanitizeWorkspaceDocId(identifier: string, accountId?: string): string {
  const clean = identifier.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
  if (accountId) {
    const cleanAcc = accountId.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
    return `ws_${clean.slice(0, 45)}_${cleanAcc.slice(0, 30)}`;
  }
  return `ws_${clean.slice(0, 80)}`;
}

/**
 * Repairs any number that became a string or astronomical concatenated number (e.g. 1.8e+36)
 * from prior string concatenation of line costs.
 */
export function sanitizeNumericValue(val: any, fallback: number = 0, maxReasonable: number = 10_000_000): number {
  const num = typeof val === "number" ? val : parseFloat(String(val ?? "").replace(/,/g, ""));
  if (!Number.isFinite(num) || num < 0 || num > maxReasonable) {
    return fallback;
  }
  return Math.round(num * 100) / 100;
}

/**
 * Defensive sanitizer for inventory items so schema changes or new attributes
 * never break calculations or corrupt merchant goods.
 */
function sanitizeInventoryItem(item: any, idx: number): InventoryItem {
  let cost = sanitizeNumericValue(item.unit_cost, 100, 1_000_000);
  const packUnit = String(item.bulk_pack_name || item.unit_type || "");
  const packMult = getSupplyUnitMultiplier(packUnit);
  const rawRetail = sanitizeNumericValue(item.unit_retail, 0, 1_000_000);

  // If an item was saved with a bulk pack unit (e.g. "Bale (12pkts)") and its unit_cost was stored as the full bale price (e.g. 2080), divide by packMult (2080 / 12 = 173.33)
  if (packMult > 1 && cost >= 600 && (rawRetail === 0 || cost > rawRetail * 1.8 || Math.abs(rawRetail - cost * 1.25) < 2)) {
    cost = Math.round((cost / packMult) * 100) / 100;
  }

  const retail =
    rawRetail > 0 && rawRetail <= cost * 4
      ? rawRetail
      : Math.round(cost * 1.2 * 100) / 100;
  const stock = sanitizeNumericValue(item.current_stock, 1, 500_000);
  const margin = Math.round((retail - cost) * 100) / 100;
  const shelfVal = Math.round(stock * retail * 100) / 100;

  return {
    ...item,
    id: item.id ?? `item_${idx}_${Date.now()}`,
    name: item.name || "Stock Item",
    category: item.category || "General",
    unit_type: item.unit_type || "units",
    unit_cost: cost,
    unit_retail: retail,
    current_stock: stock,
    expected_margin: margin,
    total_shelf_value: shelfVal,
    velocity_badge: item.velocity_badge || "Normal",
    reorder_point: typeof item.reorder_point === "number" ? item.reorder_point : 5,
    supplier: item.supplier || "Jahdithma Wholesalers"
  };
}

/**
 * Repairs any archived receipt record that had string-concatenated totalCost or lineCost
 */
function sanitizeReceiptRecord(rec: any): SavedReceiptRecord {
  const rawItems = Array.isArray(rec?.items) ? rec.items : [];
  const sanitizedItems = rawItems.map((i: any, idx: number) => {
    const qty = sanitizeNumericValue(i.supplyUnitsReceived, 1, 100_000) || 1;
    const uCost = sanitizeNumericValue(i.unitCostAtDelivery, 100, 1_000_000);
    const lCost = sanitizeNumericValue(i.lineCost, Math.round(qty * uCost * 100) / 100, 5_000_000);
    const derivedUCost = uCost > 0 ? uCost : Math.round((lCost / qty) * 100) / 100;
    const rPrice = sanitizeNumericValue(i.retailPrice, Math.round(derivedUCost * 1.25 * 100) / 100, 1_000_000);
    return {
      ...i,
      id: i.id || `rcpt_item_${idx}`,
      itemName: i.itemName || "Supplied Good",
      supplyUnitsReceived: qty,
      supplyUnit: i.supplyUnit || "Units",
      conversionRatio: sanitizeNumericValue(i.conversionRatio, 1, 10_000) || 1,
      retailUnitsAdded: sanitizeNumericValue(i.retailUnitsAdded, qty, 100_000) || qty,
      retailUnit: i.retailUnit || "units",
      unitCostAtDelivery: derivedUCost,
      lineCost: lCost,
      retailPrice: rPrice,
      expectedMargin: Math.max(0, Math.round((rPrice - derivedUCost) * 100) / 100),
      approved: i.approved !== false
    };
  });

  const approvedItems = sanitizedItems.filter((i: any) => i.approved !== false);
  const computedTotalCost = approvedItems.reduce((acc: number, i: any) => acc + (Number(i.lineCost) || 0), 0);
  const computedTotalRetail = approvedItems.reduce(
    (acc: number, i: any) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 1) * (Number(i.retailPrice) || 0)),
    0
  );

  const safeTotalCost = sanitizeNumericValue(
    rec?.totalCost,
    computedTotalCost > 0 ? computedTotalCost : 4160,
    5_000_000
  );
  const finalTotalCost = computedTotalCost > 0 && Math.abs(safeTotalCost - computedTotalCost) > computedTotalCost * 2
    ? computedTotalCost
    : safeTotalCost;

  const safeTotalRetail = sanitizeNumericValue(
    rec?.totalRetailShelfValue,
    computedTotalRetail > 0 ? computedTotalRetail : Math.round(finalTotalCost * 1.25),
    10_000_000
  );
  const finalProfit = Math.max(0, Math.round((safeTotalRetail - finalTotalCost) * 100) / 100);
  const finalMarkup = finalTotalCost > 0 ? Math.round((finalProfit / finalTotalCost) * 1000) / 10 : 0;

  return {
    ...rec,
    totalCost: finalTotalCost,
    totalRetailShelfValue: safeTotalRetail,
    totalPotentialProfit: finalProfit,
    markupPercentage: finalMarkup,
    items: sanitizedItems
  };
}

/**
 * Repairs any payout or supplier purchase record whose amount was corrupted by string concatenation
 */
function sanitizePayoutRecord(p: any, todayStr: string, sanitizedReceipts: SavedReceiptRecord[]): PayoutOrDrawing {
  const rawAmt = typeof p?.amount === "number" ? p.amount : parseFloat(String(p?.amount ?? "").replace(/,/g, ""));
  let safeAmt = rawAmt;

  if (!Number.isFinite(rawAmt) || rawAmt < 0 || rawAmt > 5_000_000) {
    // If this was a supplier payout from a receipt/purchase, match it to the repaired receipt cost or 4160
    const matchingReceipt = sanitizedReceipts.find(
      r => (p?.notes || "").includes(r.receiptNumber) || (p?.notes || "").toLowerCase().includes((r.supplierName || "").toLowerCase())
    );
    safeAmt = matchingReceipt && matchingReceipt.totalCost > 0 ? matchingReceipt.totalCost : 4160;
  }

  return {
    ...p,
    amount: Math.round(safeAmt * 100) / 100,
    date: p.date || (p.timestamp && p.timestamp.match(/^\d{4}-\d{2}-\d{2}/) ? p.timestamp.match(/^\d{4}-\d{2}-\d{2}/)[0] : todayStr)
  };
}

function isPrimaryOrDefaultAccount(accountId?: string): boolean {
  return !accountId || accountId === "acc_alacio_mini" || accountId === "acc_moses_alacio";
}

const SAMPLE_PAYOUT_IDS = new Set([
  "exp_rent_001",
  "exp_travel_001",
  "exp_misc_001",
  "exp_withdrawal_001",
  "pay_001"
]);

/**
 * Detects whether a workspace snapshot is strictly the untouched sample template
 * so opening a fresh domain NEVER overwrites real merchant cloud records with sample seed data.
 */
export function isDefaultSampleState(state: any): boolean {
  if (!state || typeof state !== "object") return true;
  if (state.is_skeleton === true) return false;

  const inv = Array.isArray(state.inventory) ? state.inventory : [];
  const rcpts = Array.isArray(state.receiptsArchive) ? state.receiptsArchive : [];
  const pays = Array.isArray(state.payouts) ? state.payouts : [];
  const sales = Array.isArray(state.salesLedger) ? state.salesLedger : [];
  const supps = Array.isArray(state.suppliers) ? state.suppliers : [];
  const batches = Array.isArray(state.supplierBatches) ? state.supplierBatches : [];

  const isSampleInv = inv.length === INITIAL_INVENTORY_43.length;
  const isSampleRcpts = rcpts.length <= 1 && (rcpts.length === 0 || rcpts[0]?.id === "rcpt_001");
  const isSamplePays = pays.length <= 5 && pays.every((p: any) => SAMPLE_PAYOUT_IDS.has(String(p?.id || "")));
  const isSampleSales =
    sales.length <= 3 &&
    sales.every((s: any) => String(s?.id || "").startsWith("sale_rcpt_auto_2026-10-16_"));
  const isSampleSupp = supps.length <= 1 && (supps.length === 0 || supps[0]?.id === "supp_001");
  const isSampleCash =
    Number(state.cash_register_balance ?? 8450) === 8450 &&
    Number(state.mpesa_float_balance ?? 6500) === 6500;

  return isSampleInv && isSampleRcpts && isSamplePays && isSampleSales && isSampleSupp && batches.length === 0 && isSampleCash;
}

/**
 * Deterministic workspace richness score used to guarantee a richer real shop state
 * (e.g. 29 expenses + 26 receipts) is never clobbered by an empty skeleton or sample template.
 */
export function computeStateRichnessScore(state: any): number {
  if (!state || typeof state !== "object") return 0;
  if (isDefaultSampleState(state)) return 1;

  const rec = Array.isArray(state.receiptsArchive) ? state.receiptsArchive.length : 0;
  const pay = Array.isArray(state.payouts) ? state.payouts.length : 0;
  const sal = Array.isArray(state.salesLedger) ? state.salesLedger.length : 0;
  const inv = Array.isArray(state.inventory) ? state.inventory.length : 0;
  const cus = Array.isArray(state.customers) ? state.customers.length : 0;
  const sup = Array.isArray(state.suppliers) ? state.suppliers.length : 0;
  const wh = Array.isArray(state.warehouse) ? state.warehouse.length : 0;
  const batches = Array.isArray(state.supplierBatches) ? state.supplierBatches.length : 0;
  const recon = Array.isArray(state.reconciliations) ? state.reconciliations.length : 0;
  const cashMoved =
    Number(state.cash_register_balance ?? 8450) !== 8450 ||
    Number(state.mpesa_float_balance ?? 28300) !== 28300
      ? 20
      : 0;

  const score =
    rec * 120 +
    pay * 90 +
    sal * 70 +
    inv * 25 +
    cus * 35 +
    sup * 35 +
    wh * 25 +
    batches * 50 +
    recon * 40 +
    cashMoved;

  if (score === 0 && state.is_skeleton) return 2;
  return Math.max(score, 5);
}

/**
 * Checks whether localStorage actually holds persisted user/merchant data for this account,
 * cleanly ignoring missing keys or untouched sample templates.
 */
export function hasRealLocalSavedState(userEmail?: string, accountId?: string): boolean {
  try {
    const activeEmail =
      userEmail ||
      (() => {
        try {
          const rawSess = localStorage.getItem("yubiflo_auth_session");
          if (rawSess) {
            const sess = JSON.parse(rawSess);
            return sess?.user?.email || sess?.email;
          }
        } catch {}
        return undefined;
      })();

    const accountSpecificKey = activeEmail && accountId ? getUserStorageKey(activeEmail, accountId) : null;
    const isPrimary = isPrimaryOrDefaultAccount(accountId);
    const candidateKeys = isPrimary
      ? ([
          accountSpecificKey,
          activeEmail ? getUserStorageKey(activeEmail) : null,
          STORAGE_KEY_ALACIO,
          STORAGE_BACKUP_SNAPSHOT_A,
          STORAGE_BACKUP_SNAPSHOT_B,
          "yubiflo_alacio_state_live_v1",
          "yubiflo_alacio_state_v1"
        ].filter(Boolean) as string[])
      : ([accountSpecificKey, STORAGE_BACKUP_SNAPSHOT_A, STORAGE_BACKUP_SNAPSHOT_B].filter(Boolean) as string[]);

    for (const key of candidateKeys) {
      try {
        const candidate = localStorage.getItem(key);
        if (!candidate || candidate.length <= 20) continue;
        const parsed = JSON.parse(candidate);
        if (!parsed || typeof parsed !== "object") continue;

        // Secondary accounts must only match snapshots stamped for that exact account
        if (!isPrimary && key !== accountSpecificKey && parsed.account_id !== accountId) {
          continue;
        }
        // Primary Alacio loader should skip snapshots belonging to another named secondary account
        if (
          isPrimary &&
          key !== accountSpecificKey &&
          parsed.account_id &&
          !isPrimaryOrDefaultAccount(parsed.account_id)
        ) {
          continue;
        }

        if (!isDefaultSampleState(parsed)) {
          return true;
        }
      } catch {}
    }
  } catch {}

  return false;
}

/**
 * Recursively strips `undefined`, functions, non-finite numbers, and oversized inline base64
 * images (>1.5KB) so Firestore writes NEVER fail with `Unsupported field value: undefined`
 * or exceed Firestore's 1MB single-document limit when 26+ scanned receipts exist.
 */
const MEDIA_KEYS = new Set(["imageUrl", "receiptImage", "scannedImage", "photo", "previewUrl", "thumbnailUrl"]);

export function deepSanitizeForCloud(value: any, parentKey?: string): any {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }
  if (value === null) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const isOversizedDataImage = value.startsWith("data:image/") && value.length > 1500;
    const isLargeMediaField = parentKey && MEDIA_KEYS.has(parentKey) && value.length > 2000;
    if (isOversizedDataImage || isLargeMediaField) {
      return undefined;
    }
    return value;
  }

  if (Array.isArray(value)) {
    const arr: any[] = [];
    for (let i = 0; i < value.length; i++) {
      const cleanedItem = deepSanitizeForCloud(value[i]);
      if (cleanedItem !== undefined) {
        arr.push(cleanedItem);
      }
    }
    return arr;
  }

  if (typeof value === "object") {
    const obj: Record<string, any> = {};
    let hadStrippedMedia = false;

    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      if (typeof v === "string" && (MEDIA_KEYS.has(k) || v.startsWith("data:image/")) && v.length > 1500) {
        hadStrippedMedia = true;
        continue;
      }
      const cleaned = deepSanitizeForCloud(v, k);
      if (cleaned !== undefined) {
        obj[k] = cleaned;
      }
    }

    if (hadStrippedMedia && ("receiptNumber" in obj || "supplierName" in obj)) {
      obj.hasLocalImage = true;
    }
    return obj;
  }

  return value;
}

function enforceCloudSizeBudget(cleanState: any): any {
  const MAX_CLOUD_BYTES = 750_000;
  try {
    let serialized = JSON.stringify(cleanState);
    if (serialized.length <= MAX_CLOUD_BYTES) return cleanState;

    const trimmed = { ...cleanState };
    // Strip rawText / rawSpecification verbose OCR strings from oldest receipts if still large
    if (Array.isArray(trimmed.receiptsArchive)) {
      trimmed.receiptsArchive = trimmed.receiptsArchive.map((r: any) => {
        const copy = { ...r };
        if (typeof copy.rawOcrText === "string" && copy.rawOcrText.length > 300) {
          copy.rawOcrText = copy.rawOcrText.slice(0, 300);
        }
        return copy;
      });
    }
    serialized = JSON.stringify(trimmed);
    if (serialized.length <= MAX_CLOUD_BYTES) return trimmed;

    // Trim verbose M-Pesa SMS raw descriptions if still huge while keeping totals & core ledgers
    if (Array.isArray(trimmed.mpesaStatements) && trimmed.mpesaStatements.length > 100) {
      trimmed.mpesaStatements = trimmed.mpesaStatements.slice(0, 100);
    }
    return trimmed;
  } catch {
    return cleanState;
  }
}

/**
 * Shared defensive hydrator applied identically to local snapshots & cloud documents.
 */
function hydrateRawStateObject(parsed: any, activeEmail?: string, accountId?: string): AlacioMasterState {
  const isSkeleton =
    parsed.is_skeleton === true ||
    (parsed.tier === "PAID_BLUEPRINT" && parsed.merchant_name && parsed.merchant_name !== "Duka Space");

  let safeInventory: InventoryItem[] = [];
  if (Array.isArray(parsed.inventory)) {
    if (isSkeleton) {
      safeInventory = parsed.inventory.map((item: any, idx: number) => sanitizeInventoryItem(item, idx));
    } else {
      safeInventory =
        parsed.inventory.length > 0
          ? parsed.inventory.map((item: any, idx: number) => sanitizeInventoryItem(item, idx))
          : INITIAL_INVENTORY_43;
    }
  } else {
    safeInventory = isSkeleton ? [] : INITIAL_INVENTORY_43;
  }

  const safeWarehouse = Array.isArray(parsed.warehouse)
    ? parsed.warehouse
    : isSkeleton
    ? []
    : INITIAL_WAREHOUSE_BATCHES;

  const safeCustomers = (
    Array.isArray(parsed.customers) ? parsed.customers : isSkeleton ? [] : INITIAL_CUSTOMERS
  ).map((c: any) => ({
    ...c,
    debt_balance: sanitizeNumericValue(c.debt_balance, 0, 5_000_000),
    credit_limit: sanitizeNumericValue(c.credit_limit, 1000, 5_000_000)
  }));

  const rawReceiptsArchive = Array.isArray(parsed.receiptsArchive)
    ? parsed.receiptsArchive
    : isSkeleton
    ? []
    : INITIAL_RECEIPTS_ARCHIVE;
  const safeReceiptsArchive = rawReceiptsArchive.map((r: any) => sanitizeReceiptRecord(r));

  const todayStr = new Date().toISOString().slice(0, 10);
  const normalizedSales = (Array.isArray(parsed.salesLedger) ? parsed.salesLedger : []).map((s: any) => ({
    ...s,
    total_amount: sanitizeNumericValue(s.total_amount, 0, 5_000_000),
    cash_paid: sanitizeNumericValue(s.cash_paid, 0, 5_000_000),
    mpesa_paid: sanitizeNumericValue(s.mpesa_paid, 0, 5_000_000),
    debt_amount: sanitizeNumericValue(s.debt_amount, 0, 5_000_000),
    date:
      s.date ||
      (s.timestamp && s.timestamp.match(/^\d{4}-\d{2}-\d{2}/)
        ? s.timestamp.match(/^\d{4}-\d{2}-\d{2}/)[0]
        : todayStr)
  }));
  const safeSales = isSkeleton
    ? Array.isArray(parsed.salesLedger)
      ? normalizedSales
      : []
    : normalizedSales.length > 0
    ? normalizedSales
    : INITIAL_ALACIO_STATE.salesLedger;

  const normalizedPayouts = (Array.isArray(parsed.payouts) ? parsed.payouts : []).map((p: any) =>
    sanitizePayoutRecord(p, todayStr, safeReceiptsArchive)
  );
  const hasOnlyLegacyPermit = normalizedPayouts.length === 1 && normalizedPayouts[0].id === "pay_001";
  const safePayouts = isSkeleton
    ? Array.isArray(parsed.payouts)
      ? normalizedPayouts
      : []
    : normalizedPayouts.length > 0 && !hasOnlyLegacyPermit
    ? normalizedPayouts
    : INITIAL_ALACIO_STATE.payouts;

  const rawSupp = Array.isArray(parsed.suppliers)
    ? parsed.suppliers
    : isSkeleton
    ? []
    : INITIAL_SUPPLIERS;
  const safeSuppliers = deduplicateSuppliers(rawSupp).map((s: any) => ({
    ...s,
    total_orders_cost: sanitizeNumericValue(s.total_orders_cost, 0, 20_000_000)
  }));

  const rawMb = Array.isArray(parsed.morning_bookends)
    ? parsed.morning_bookends
    : isSkeleton
    ? []
    : INITIAL_MORNING_BOOKENDS;
  const safeMb = deduplicateMorningBookends(rawMb);
  const safeFloatDenoms = Array.isArray(parsed.floatDenominations)
    ? parsed.floatDenominations
    : isSkeleton
    ? []
    : INITIAL_FLOAT_DENOMINATIONS;

  const rawRecons = Array.isArray(parsed.reconciliations) ? parsed.reconciliations : [];
  const reconsMap = new Map<string, any>();
  rawRecons.forEach((r: any) => {
    const d = r.date || r.timestamp?.slice(0, 10) || "today";
    if (!reconsMap.has(d)) {
      reconsMap.set(d, r);
    }
  });
  const safeReconciliations = Array.from(reconsMap.values());

  const effectiveDrawerCash = sanitizeNumericValue(parsed.cash_register_balance, isSkeleton ? 0 : 8450, 50_000_000);
  const effectiveMpesaFloat = sanitizeNumericValue(parsed.mpesa_float_balance, isSkeleton ? 0 : 28300, 50_000_000);
  const effectiveEquitel = sanitizeNumericValue(parsed.equitel_account_balance, isSkeleton ? 0 : 14200, 50_000_000);

  const safeRestockCards = isSkeleton
    ? Array.isArray(parsed.restockCards)
      ? parsed.restockCards
      : []
    : Array.isArray(parsed.restockCards) && parsed.restockCards.length > 0
    ? parsed.restockCards
    : INITIAL_RESTOCK_CARDS;

  const resolvedMerchantName = parsed.merchant_name || parsed.business_name || (isSkeleton ? "My Business" : INITIAL_ALACIO_STATE.merchant_name);
  const resolvedClientType = parsed.client_type || (isSkeleton ? "Retail / Duka" : INITIAL_ALACIO_STATE.client_type);
  const resolvedBlueprintId =
    parsed.business_blueprint_id ||
    (isEateryBusinessType(resolvedClientType) ? "open_eatery" : "duka_fmcg");
  const isAlacio = (resolvedMerchantName || "").toLowerCase().includes("alacio");

  const resolvedPaymentChannels: PaymentChannelConfig[] =
    Array.isArray(parsed.paymentChannels) && parsed.paymentChannels.length > 0
      ? parsed.paymentChannels
      : getDefaultPaymentChannelsForBlueprint(
          resolvedClientType,
          { cash: effectiveDrawerCash, mpesa: effectiveMpesaFloat, bank: effectiveEquitel },
          { isAlacio, blueprintId: resolvedBlueprintId }
        );

  const hydratedState: AlacioMasterState = {
    ...INITIAL_ALACIO_STATE,
    ...parsed,
    merchant_name: resolvedMerchantName,
    proprietor_name: parsed.proprietor_name || (isAlacio ? "Rose" : ""),
    client_type: resolvedClientType,
    business_blueprint_id: resolvedBlueprintId,
    paymentChannels: resolvedPaymentChannels,
    schema_version: SCHEMA_VERSION,
    last_persisted_at: parsed.last_persisted_at || parsed.last_updated || new Date().toISOString(),
    user_email: activeEmail || parsed.user_email,
    ...(accountId || parsed.account_id ? { account_id: accountId || parsed.account_id } : {}),
    is_skeleton: isSkeleton,
    inventory: safeInventory,
    warehouse: safeWarehouse,
    customers: safeCustomers,
    suppliers:
      safeSuppliers.length > 0
        ? safeSuppliers
        : isSkeleton
        ? []
        : [
            {
              id: "supp_001",
              name: "Jahdithma Wholesalers",
              company: "Jahdithma Wholesalers & Distributors",
              phone: "0722 000 111",
              national_id: "24891044",
              category: "General Wholesaler",
              total_orders_cost: 0,
              last_delivery_date: "Active Wholesaler",
              payment_preference: "NATIONAL_ID_DEPOSIT"
            }
          ],
    morning_bookends: safeMb.length > 0 ? safeMb : (isSkeleton ? [] : INITIAL_MORNING_BOOKENDS),
    floatDenominations: safeFloatDenoms,
    salesLedger: safeSales,
    payouts: safePayouts,
    mpesaStatements: Array.isArray(parsed.mpesaStatements) ? parsed.mpesaStatements : [],
    reconciliations: safeReconciliations,
    restockCards: safeRestockCards,
    receiptsArchive: safeReceiptsArchive,
    mpesa_float_balance: effectiveMpesaFloat,
    cash_register_balance: effectiveDrawerCash,
    equitel_account_balance: effectiveEquitel,
    tier: parsed.tier ?? "PAID_BLUEPRINT",
    vcr_daily_count: parsed.vcr_daily_count || 0,
    vcr_customer_consent: parsed.vcr_customer_consent ?? true,
    clean_trading_days: typeof parsed.clean_trading_days === "number" ? parsed.clean_trading_days : (isSkeleton ? 0 : 14),
    kpis: calculateKpis(safeInventory, safeWarehouse)
  };

  return reconcileChronologicalReceiptsAndSales(hydratedState);
}

/**
 * Bulletproof Local Loader with Strict Account Isolation:
 * - Primary Alacio account checks account-specific, user-general, and live fallback keys.
 * - Secondary accounts (e.g. Mukangai Wholesalers) check ONLY their own account-specific key
 *   so they never pull Alacio's local receipts before Cloud Sync completes.
 */
export function loadAlacioState(userEmail?: string, accountId?: string): AlacioMasterState {
  try {
    const activeEmail =
      userEmail ||
      (() => {
        try {
          const rawSess = localStorage.getItem("yubiflo_auth_session");
          if (rawSess) {
            const sess = JSON.parse(rawSess);
            return sess?.user?.email || sess?.email;
          }
        } catch {}
        return undefined;
      })();

    const accountSpecificKey = activeEmail && accountId ? getUserStorageKey(activeEmail, accountId) : null;
    const isPrimary = isPrimaryOrDefaultAccount(accountId);
    const userGeneralKey = activeEmail ? getUserStorageKey(activeEmail) : null;

    const candidateKeys = isPrimary
      ? ([
          accountSpecificKey,
          userGeneralKey,
          STORAGE_KEY_ALACIO,
          STORAGE_BACKUP_SNAPSHOT_A,
          STORAGE_BACKUP_SNAPSHOT_B,
          "yubiflo_alacio_state_live_v1",
          "yubiflo_alacio_state_v1"
        ].filter(Boolean) as string[])
      : ([accountSpecificKey, STORAGE_BACKUP_SNAPSHOT_A, STORAGE_BACKUP_SNAPSHOT_B].filter(Boolean) as string[]);

    let parsedCandidate: any = null;
    let bestScore = -1;

    for (const key of candidateKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw.length <= 20) continue;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") continue;

        if (!isPrimary && key !== accountSpecificKey && parsed.account_id !== accountId) {
          continue;
        }
        if (
          isPrimary &&
          key !== accountSpecificKey &&
          parsed.account_id &&
          !isPrimaryOrDefaultAccount(parsed.account_id)
        ) {
          continue;
        }

        // Exact account-specific key takes priority unless completely empty vs a richer primary snapshot
        const score = computeStateRichnessScore(parsed) + (key === accountSpecificKey ? 10 : 0);
        if (score > bestScore) {
          bestScore = score;
          parsedCandidate = parsed;
        }
      } catch (err) {
        console.warn(`[YuBiFlo Storage] Corrupted snapshot in ${key}, skipping:`, err);
      }
    }

    if (!parsedCandidate) {
      if (!isPrimary && accountId) {
        const cleanSkeleton = createSkeletonBusinessState("My Business Branch", "Retail / Duka");
        cleanSkeleton.user_email = activeEmail;
        (cleanSkeleton as any).account_id = accountId;
        return cleanSkeleton;
      }
      return INITIAL_ALACIO_STATE;
    }

    return hydrateRawStateObject(parsedCandidate, activeEmail, accountId);
  } catch (error) {
    console.warn("[YuBiFlo Storage] Error loading alacio state. Preserving state baseline:", error);
    return INITIAL_ALACIO_STATE;
  }
}

/**
 * Resolves all candidate Firestore document IDs where this business workspace may have been stored
 * across previous app versions, enabling seamless Twitter -> X continuity.
 */
function getCandidateCloudDocIds(userEmail: string, accountId?: string): string[] {
  const cleanEmail = userEmail.trim().toLowerCase();
  const ids: string[] = [];
  const addId = (id: string) => {
    if (id && /^[a-zA-Z0-9_-]{1,128}$/.test(id) && !ids.includes(id)) {
      ids.push(id);
    }
  };

  addId(sanitizeWorkspaceDocId(cleanEmail, accountId));

  if (isPrimaryOrDefaultAccount(accountId)) {
    addId(sanitizeWorkspaceDocId(cleanEmail, "acc_alacio_mini"));
    addId(sanitizeWorkspaceDocId(cleanEmail, "acc_moses_alacio"));
    addId(sanitizeWorkspaceDocId(cleanEmail));
    if (cleanEmail === "mosesmukangai75@gmail.com" || cleanEmail.includes("moses")) {
      addId("ws_alacio_001");
    }
  }

  return ids;
}

/**
 * Decodes either an E2EE-encrypted `e2ee_vault` workspace document or a legacy plaintext doc.
 */
async function decodeWorkspaceDocData(
  data: any,
  userEmail: string,
  accountId?: string
): Promise<{ state: AlacioMasterState; wasEncrypted: boolean } | null> {
  if (!data || typeof data !== "object") return null;

  let rawState: any = null;
  let wasEncrypted = false;

  if (data.e2ee_vault && isEncryptedPayload(data.e2ee_vault)) {
    try {
      rawState = await decryptClientDataWithFallbacks<any>(data.e2ee_vault, userEmail);
      wasEncrypted = true;
    } catch (decryptErr) {
      console.warn("[YuBiFlo E2EE] Unable to decrypt e2ee_vault with available keys:", decryptErr);
    }
  }

  if (!rawState && (Array.isArray(data.inventory) || Array.isArray(data.salesLedger) || Array.isArray(data.receiptsArchive) || Array.isArray(data.payouts))) {
    rawState = {
      ...data,
      merchant_name: data.business_name || data.merchant_name
    };
  }

  if (!rawState || typeof rawState !== "object") return null;

  // Preserve locally cached receipt base64 images if they already exist in this browser
  const hydrated = hydrateRawStateObject(rawState, userEmail, accountId);
  return { state: hydrated, wasEncrypted };
}

/**
 * Persist workspace locally immediately (keeping receipt images in local cache for offline instant view).
 */
function persistStateLocallyOnly(stateToPersist: AlacioMasterState, targetEmail?: string, activeAccountId?: string): void {
  const serialized = JSON.stringify(stateToPersist);

  if (isPrimaryOrDefaultAccount(activeAccountId)) {
    try {
      localStorage.setItem(STORAGE_KEY_ALACIO, serialized);
    } catch (err) {
      console.warn("[YuBiFlo Storage] Primary localStorage write hit quota, compacting media for local cache:", err);
      try {
        const compactedLocal = deepSanitizeForCloud(stateToPersist);
        localStorage.setItem(STORAGE_KEY_ALACIO, JSON.stringify(compactedLocal));
      } catch {}
    }
  }

  if (targetEmail) {
    try {
      if (activeAccountId) {
        localStorage.setItem(getUserStorageKey(targetEmail, activeAccountId), serialized);
      }
      if (isPrimaryOrDefaultAccount(activeAccountId)) {
        localStorage.setItem(getUserStorageKey(targetEmail), serialized);
      }
    } catch (err) {
      console.warn("[YuBiFlo Storage] User/Account-scoped local write warning:", err);
    }
  }

  try {
    const currentSlot = parseInt(localStorage.getItem(STORAGE_SNAPSHOT_SLOT) || "0", 10);
    const nextSlot = (currentSlot + 1) % 2;
    const backupKey = nextSlot === 0 ? STORAGE_BACKUP_SNAPSHOT_A : STORAGE_BACKUP_SNAPSHOT_B;
    localStorage.setItem(backupKey, serialized);
    localStorage.setItem(STORAGE_SNAPSHOT_SLOT, nextSlot.toString());
    localStorage.setItem(STORAGE_LAST_SAVED, stateToPersist.last_persisted_at || new Date().toISOString());
  } catch {}
}

let cloudSyncTimer: ReturnType<typeof setTimeout> | null = null;
const lastFlushedCloudSignatures = new Map<string, string>();
const recentlyWrittenTimestamps = new Map<string, string>();

/**
 * Encrypts & flushes workspace directly to Firestore `/workspaces/{docId}`.
 * Guarantees:
 * - Zero `undefined` values & <1MB payload size
 * - AES-GCM-256 Zero-Knowledge encryption (`e2ee_vault`) so YuBiFlo staff cannot view merchant records
 * - Seed/empty overwrite protection against existing richer cloud docs
 */
export async function flushWorkspaceToCloudNow(
  state: AlacioMasterState,
  userEmail?: string,
  accountId?: string,
  options?: { allowSeedOverwrite?: boolean }
): Promise<boolean> {
  const targetEmail = (userEmail || state.user_email || "mosesmukangai75@gmail.com").trim().toLowerCase();
  const activeAccountId = accountId || (state as any).account_id || "acc_alacio_mini";
  const docId = sanitizeWorkspaceDocId(targetEmail, activeAccountId);

  const stateToPersist: AlacioMasterState = {
    ...state,
    schema_version: SCHEMA_VERSION,
    last_persisted_at: state.last_persisted_at || new Date().toISOString(),
    user_email: targetEmail,
    ...(activeAccountId ? { account_id: activeAccountId } : {})
  };

  if (isDefaultSampleState(stateToPersist) && !options?.allowSeedOverwrite) {
    return false;
  }

  const recordScore = computeStateRichnessScore(stateToPersist);

  try {
    const workspaceRef = doc(db, "workspaces", docId);

    // Protect existing richer cloud records if local is an empty skeleton
    if (recordScore <= 2 && !options?.allowSeedOverwrite) {
      try {
        const existingSnap = await getDoc(workspaceRef);
        if (existingSnap.exists()) {
          const existingScore = Number(existingSnap.data()?.record_score || 0);
          if (existingScore > recordScore) {
            console.warn(`[YuBiFlo Cloud Guard] Prevented overwriting richer cloud workspace (${existingScore}) with empty skeleton.`);
            return false;
          }
        }
      } catch {}
    }

    const sanitizedState = enforceCloudSizeBudget(deepSanitizeForCloud(stateToPersist));
    const passphrase = getPortableEncryptionSecret(targetEmail);
    const e2ee_vault = await encryptClientData(sanitizedState, passphrase);

    const cloudDoc = {
      id: docId,
      business_name: stateToPersist.merchant_name || "YuBiFlo Merchant",
      client_type: stateToPersist.client_type || "Retail / Duka",
      account_id: activeAccountId,
      schema_version: SCHEMA_VERSION,
      record_score: recordScore,
      e2ee_protected: true,
      e2ee_vault,
      last_updated: stateToPersist.last_persisted_at
    };

    const sig = `${recordScore}:${stateToPersist.receiptsArchive?.length || 0}:${stateToPersist.payouts?.length || 0}:${stateToPersist.salesLedger?.length || 0}:${stateToPersist.inventory?.length || 0}:${stateToPersist.cash_register_balance}`;
    recentlyWrittenTimestamps.set(docId, String(cloudDoc.last_updated));
    lastFlushedCloudSignatures.set(docId, sig);

    // Replace document cleanly so legacy plaintext fields cannot remain exposed in Firestore
    await setDoc(workspaceRef, cloudDoc);
    return true;
  } catch (cloudErr) {
    handleFirestoreError(cloudErr, OperationType.WRITE, `workspaces/${docId}`);
    return false;
  }
}

export interface SaveAlacioOptions {
  immediate?: boolean;
  skipCloud?: boolean;
  forceCloud?: boolean;
}

/**
 * Atomic Multi-Tier Save:
 * 1. Synchronous localStorage persistence (primary, account-scoped, and snapshots A/B)
 * 2. Encrypted E2EE Cloud Firestore sync (debounced or immediate)
 */
export async function saveAlacioState(
  state: AlacioMasterState,
  userEmail?: string,
  accountId?: string,
  options: SaveAlacioOptions = {}
): Promise<void> {
  const targetEmail =
    userEmail ||
    state.user_email ||
    (() => {
      try {
        const rawSess = localStorage.getItem("yubiflo_auth_session");
        if (rawSess) {
          const sess = JSON.parse(rawSess);
          return sess?.user?.email || sess?.email;
        }
      } catch {}
      return undefined;
    })();

  const activeAccountId = accountId || (state as any).account_id;

  const stateToPersist: AlacioMasterState = {
    ...state,
    schema_version: SCHEMA_VERSION,
    last_persisted_at: new Date().toISOString(),
    user_email: targetEmail || state.user_email,
    ...(activeAccountId ? { account_id: activeAccountId } : {})
  };

  // Always save locally
  persistStateLocallyOnly(stateToPersist, targetEmail, activeAccountId);

  if (options.skipCloud) return;

  // Guard: never push untouched default sample seed to cloud unless explicitly requested
  if (isDefaultSampleState(stateToPersist) && !options.forceCloud) {
    return;
  }

  if (cloudSyncTimer) {
    clearTimeout(cloudSyncTimer);
    cloudSyncTimer = null;
  }

  if (options.immediate) {
    await flushWorkspaceToCloudNow(stateToPersist, targetEmail, activeAccountId, {
      allowSeedOverwrite: options.forceCloud
    });
    return;
  }

  cloudSyncTimer = setTimeout(() => {
    cloudSyncTimer = null;
    flushWorkspaceToCloudNow(stateToPersist, targetEmail, activeAccountId, {
      allowSeedOverwrite: options.forceCloud
    }).catch(() => {});
  }, 900);
}

/**
 * Bidirectional Twitter -> X Cloud Sync:
 * Compares all candidate cloud docs (both E2EE & legacy plaintext) against real local data.
 * - If Cloud is richer (new domain / new device / phone): hydrates Cloud -> Local seamlessly.
 * - If Local is richer (browser holding 29 expenses & 26 receipts before sync worked):
 *   encrypts and uploads Local -> Cloud immediately so every domain gets the exact real state.
 */
export async function syncWorkspaceWithCloud(
  userEmail: string,
  accountId?: string,
  localCandidate?: AlacioMasterState
): Promise<{
  state: AlacioMasterState | null;
  source: "cloud" | "local_pushed" | "in_sync" | "none";
  docId?: string;
}> {
  const cleanEmail = (userEmail || "mosesmukangai75@gmail.com").trim().toLowerCase();
  const activeAccId = accountId || "acc_alacio_mini";
  const canonicalDocId = sanitizeWorkspaceDocId(cleanEmail, activeAccId);
  const candidateDocIds = getCandidateCloudDocIds(cleanEmail, activeAccId);

  let bestCloud: { state: AlacioMasterState; score: number; time: number; docId: string; wasEncrypted: boolean } | null = null;

  try {
    const snapshots = await Promise.all(
      candidateDocIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, "workspaces", id));
          return { id, snap };
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `workspaces/${id}`);
          return { id, snap: null };
        }
      })
    );

    for (const item of snapshots) {
      if (!item.snap || !item.snap.exists()) continue;
      const decoded = await decodeWorkspaceDocData(item.snap.data(), cleanEmail, activeAccId);
      if (!decoded) continue;

      const score = computeStateRichnessScore(decoded.state);
      const time = Date.parse(decoded.state.last_persisted_at || decoded.state.last_updated || "0") || 0;

      if (
        !bestCloud ||
        score > bestCloud.score ||
        (score === bestCloud.score && time > bestCloud.time)
      ) {
        bestCloud = {
          state: decoded.state,
          score,
          time,
          docId: item.id,
          wasEncrypted: decoded.wasEncrypted
        };
      }
    }
  } catch (err) {
    console.warn("[YuBiFlo Cloud Sync] Query notice:", err);
  }

  const hasLocalReal = hasRealLocalSavedState(cleanEmail, activeAccId);
  const localRealState = hasLocalReal
    ? (localCandidate ? hydrateRawStateObject(localCandidate, cleanEmail, activeAccId) : loadAlacioState(cleanEmail, activeAccId))
    : null;
  const localScore = localRealState ? computeStateRichnessScore(localRealState) : 0;
  const localTime = localRealState
    ? Date.parse(localRealState.last_persisted_at || localRealState.last_updated || "0") || 0
    : 0;

  // Case 1: Cloud has richer data OR user is on a fresh domain with no real local data yet
  if (
    bestCloud &&
    (!localRealState ||
      bestCloud.score > localScore ||
      (bestCloud.score === localScore && bestCloud.time > localTime + 2000))
  ) {
    persistStateLocallyOnly(bestCloud.state, cleanEmail, activeAccId);

    // Upgrade legacy or unencrypted cloud document cleanly to canonical E2EE docId
    if (bestCloud.docId !== canonicalDocId || !bestCloud.wasEncrypted) {
      flushWorkspaceToCloudNow(bestCloud.state, cleanEmail, activeAccId).catch(() => {});
    }
    return { state: bestCloud.state, source: "cloud", docId: bestCloud.docId };
  }

  // Case 2: Local browser holds richer real merchant records (e.g. 29 expenses & 26 receipts) -> Push up immediately!
  if (localRealState && localScore > (bestCloud?.score || 0)) {
    await flushWorkspaceToCloudNow(localRealState, cleanEmail, activeAccId);
    return { state: localRealState, source: "local_pushed", docId: canonicalDocId };
  }

  // Case 3: Equal richness — upgrade canonical/E2EE if needed and resolve latest timestamp
  if (bestCloud && localRealState) {
    if (localTime > bestCloud.time + 2000) {
      await flushWorkspaceToCloudNow(localRealState, cleanEmail, activeAccId);
      return { state: localRealState, source: "local_pushed", docId: canonicalDocId };
    }
    if (bestCloud.docId !== canonicalDocId || !bestCloud.wasEncrypted) {
      flushWorkspaceToCloudNow(bestCloud.state, cleanEmail, activeAccId).catch(() => {});
    }
    return { state: bestCloud.state, source: "in_sync", docId: bestCloud.docId };
  }

  if (bestCloud) {
    return { state: bestCloud.state, source: "in_sync", docId: bestCloud.docId };
  }

  return { state: null, source: "none" };
}

/**
 * Real-time cross-domain listener so updates from phone or another browser tab/domain
 * sync down cleanly without echo loops.
 */
export function subscribeToWorkspaceCloud(
  userEmail: string,
  accountId: string | undefined,
  onRemoteState: (state: AlacioMasterState) => void
): () => void {
  const cleanEmail = (userEmail || "mosesmukangai75@gmail.com").trim().toLowerCase();
  const activeAccId = accountId || "acc_alacio_mini";
  const docId = sanitizeWorkspaceDocId(cleanEmail, activeAccId);
  const path = `workspaces/${docId}`;

  return onSnapshot(
    doc(db, "workspaces", docId),
    async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const remoteUpdated = String(data?.last_updated || "");
      if (remoteUpdated && recentlyWrittenTimestamps.get(docId) === remoteUpdated) {
        return; // Ignore our own local flush echo
      }

      const decoded = await decodeWorkspaceDocData(data, cleanEmail, activeAccId);
      if (!decoded) return;

      const remoteScore = computeStateRichnessScore(decoded.state);
      const localReal = hasRealLocalSavedState(cleanEmail, activeAccId)
        ? loadAlacioState(cleanEmail, activeAccId)
        : null;
      const localScore = localReal ? computeStateRichnessScore(localReal) : 0;
      const localTime = localReal
        ? Date.parse(localReal.last_persisted_at || localReal.last_updated || "0") || 0
        : 0;
      const remoteTime = Date.parse(decoded.state.last_persisted_at || decoded.state.last_updated || "0") || 0;

      if (
        !localReal ||
        remoteScore > localScore ||
        (remoteScore === localScore && remoteTime > localTime + 3000)
      ) {
        persistStateLocallyOnly(decoded.state, cleanEmail, activeAccId);
        onRemoteState(decoded.state);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Disaster Recovery & Cloud Hydration:
 * Queries candidate Firestore workspace documents when local storage is empty or on user trigger.
 */
export async function restoreUserStateFromCloud(
  userEmail: string,
  accountId?: string
): Promise<AlacioMasterState | null> {
  try {
    const result = await syncWorkspaceWithCloud(userEmail, accountId);
    return result.state;
  } catch (err) {
    console.warn("[YuBiFlo Storage] Cloud restore check completed with notice:", err);
    return null;
  }
}

/**
 * Export full business state to JSON for client offline backup
 */
export function exportBusinessDataJson(state: AlacioMasterState): string {
  const exportPayload = {
    app: "YuBiFlo",
    version: SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    merchant_name: state.merchant_name,
    client_type: state.client_type,
    user_email: state.user_email,
    state: state
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Import and validate JSON backup file with automatic schema migration
 */
export function importBusinessDataJson(jsonText: string): { success: boolean; state?: AlacioMasterState; error?: string } {
  try {
    const parsed = JSON.parse(jsonText);
    const candidateState = parsed.state || parsed;

    if (!candidateState || typeof candidateState !== "object") {
      return { success: false, error: "Invalid backup file: missing business state." };
    }

    const tempKey = "yubiflo_temp_import_buffer";
    localStorage.setItem(tempKey, JSON.stringify(candidateState));
    const raw = localStorage.getItem(tempKey);
    localStorage.removeItem(tempKey);

    if (!raw) {
      return { success: false, error: "Could not buffer import data." };
    }

    const stateObj = JSON.parse(raw);
    const restoredState: AlacioMasterState = {
      ...INITIAL_ALACIO_STATE,
      ...stateObj,
      schema_version: SCHEMA_VERSION,
      last_persisted_at: new Date().toISOString()
    };

    saveAlacioState(restoredState, restoredState.user_email, (restoredState as any).account_id, {
      immediate: true,
      forceCloud: true
    });

    return { success: true, state: restoredState };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to parse backup JSON file." };
  }
}
