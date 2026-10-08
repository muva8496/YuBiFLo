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
  SupplierProfile,
  MorningBookendRecord
} from "../types/alacio";
import { deduplicateMorningBookends } from "../utils/morningBookendHelper";
import { deduplicateSuppliers } from "../utils/supplierHelper";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

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
    tagline: "Live production pilot: Alacio Mini Shop"
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
    id: "bp_bakery", 
    name: "Bakery and Eatery", 
    status: "soon",
    description: "Flour batch production yield, daily bread deliveries, and fast takeaway meal tracking.",
    tagline: "Daily bake production vs sales audit"
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
  { id: "req_8", name: "Fatma Ali", phone: "0735 601 228", businessType: "Bakery and Eatery", location: "Nairobi, Eastleigh", consent: true, createdAt: "2026-10-02 15:40" },
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
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        buttonText: "Start free with VCR",
        buttonClass: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20",
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
        badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/40",
        buttonText: "Join the waitlist",
        buttonClass: "bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40",
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
    badge: "Live Pilot (Alacio Mini Shop)",
    industry: "B2C Consumer Retail & Groceries",
    tagline: "High-velocity retail sales directly to everyday consumers",
    description: "Built for busy neighbourhood shops selling directly to consumers. Alacio Mini Shop is our live operational branch demonstrating this template with 43 starter items, break-bulk micro packaging, and reverse inventory audits.",
    status: "ACTIVE",
    items_seed_count: 43
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
  client_name: "Alacio Mini Shop",
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

export const INITIAL_WAREHOUSE_BATCHES: WarehouseBatch[] = [];

export const INITIAL_INVENTORY_43: InventoryItem[] = [
  { id: 1, name: "Brookside Fresh Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 52, unit_retail: 65, current_stock: 0, opening_stock: 0, expected_margin: 13, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 2, name: "KCC Fresh Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 50, unit_retail: 60, current_stock: 0, opening_stock: 0, expected_margin: 10, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 3, name: "Ilara Maziwa Lala 500ml", category: "Dairy", unit_type: "bottles", unit_cost: 65, unit_retail: 80, current_stock: 0, opening_stock: 0, expected_margin: 15, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 4, name: "Unga Jogoo 2kg", category: "Flour", unit_type: "bales", unit_cost: 175, unit_retail: 210, current_stock: 0, opening_stock: 0, expected_margin: 35, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 5, name: "Unga Pembe 2kg", category: "Flour", unit_type: "bales", unit_cost: 170, unit_retail: 205, current_stock: 0, opening_stock: 0, expected_margin: 35, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 6, name: "Ajab Wheat Flour 2kg", category: "Flour", unit_type: "bales", unit_cost: 185, unit_retail: 220, current_stock: 0, opening_stock: 0, expected_margin: 35, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 7, name: "Rina Vegetable Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 275, unit_retail: 330, current_stock: 0, opening_stock: 0, expected_margin: 55, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 8, name: "Salit Salad Oil 500ml", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 145, unit_retail: 175, current_stock: 0, opening_stock: 0, expected_margin: 30, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 9, name: "Elianto Corn Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 360, unit_retail: 430, current_stock: 0, opening_stock: 0, expected_margin: 70, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 10, name: "Fresh Kenchic Eggs Crate", category: "Poultry", unit_type: "crates", unit_cost: 380, unit_retail: 460, current_stock: 0, opening_stock: 0, expected_margin: 80, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 11, name: "Broadways White Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 54, unit_retail: 65, current_stock: 0, opening_stock: 0, expected_margin: 11, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 12, name: "Festive Brown Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 58, unit_retail: 70, current_stock: 0, opening_stock: 0, expected_margin: 12, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 13, name: "Superloaf White Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 52, unit_retail: 65, current_stock: 0, opening_stock: 0, expected_margin: 13, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 14, name: "Mumias Sugar 1kg", category: "Sugar", unit_type: "packets", unit_cost: 140, unit_retail: 165, current_stock: 0, opening_stock: 0, expected_margin: 25, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 15, name: "Kabras Sugar 1kg", category: "Sugar", unit_type: "packets", unit_cost: 138, unit_retail: 160, current_stock: 0, opening_stock: 0, expected_margin: 22, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 16, name: "Royco Mchuzi Mix Beef 200g", category: "Spices", unit_type: "tins", unit_cost: 115, unit_retail: 140, current_stock: 0, opening_stock: 0, expected_margin: 25, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 17, name: "Royco Mchuzi Mix Chicken 75g", category: "Spices", unit_type: "packets", unit_cost: 45, unit_retail: 60, current_stock: 0, opening_stock: 0, expected_margin: 15, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 18, name: "Tropical Heat Pilau Masala 50g", category: "Spices", unit_type: "sachets", unit_cost: 55, unit_retail: 75, current_stock: 0, opening_stock: 0, expected_margin: 20, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 19, name: "Omo Hand Washing Powder 500g", category: "Hygiene", unit_type: "packets", unit_cost: 125, unit_retail: 150, current_stock: 0, opening_stock: 0, expected_margin: 25, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 20, name: "Sunlight Washing Powder 500g", category: "Hygiene", unit_type: "packets", unit_cost: 110, unit_retail: 135, current_stock: 0, opening_stock: 0, expected_margin: 25, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 21, name: "Geisha Soap Green 200g", category: "Hygiene", unit_type: "bars", unit_cost: 80, unit_retail: 100, current_stock: 0, opening_stock: 0, expected_margin: 20, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 22, name: "Menengai Cream Bar Soap 800g", category: "Hygiene", unit_type: "bars", unit_cost: 140, unit_retail: 170, current_stock: 0, opening_stock: 0, expected_margin: 30, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 23, name: "Colgate Triple Action 140g", category: "Hygiene", unit_type: "tubes", unit_cost: 130, unit_retail: 160, current_stock: 0, opening_stock: 0, expected_margin: 30, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 24, name: "Always Ultra Thin Pads 8s", category: "Hygiene", unit_type: "packets", unit_cost: 85, unit_retail: 110, current_stock: 0, opening_stock: 0, expected_margin: 25, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 25, name: "Ketepa Pride Tea Leaves 250g", category: "Beverages", unit_type: "packets", unit_cost: 115, unit_retail: 140, current_stock: 0, opening_stock: 0, expected_margin: 25, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 26, name: "Nescafe 3in1 Classic Sachets", category: "Beverages", unit_type: "sachets", unit_cost: 22, unit_retail: 30, current_stock: 0, opening_stock: 0, expected_margin: 8, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 27, name: "Cadbury Cocoa Powder 100g", category: "Beverages", unit_type: "tins", unit_cost: 165, unit_retail: 200, current_stock: 0, opening_stock: 0, expected_margin: 35, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 28, name: "Coca Cola Pet Bottle 500ml", category: "Beverages", unit_type: "bottles", unit_cost: 50, unit_retail: 60, current_stock: 0, opening_stock: 0, expected_margin: 10, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 29, name: "Fanta Orange Pet 500ml", category: "Beverages", unit_type: "bottles", unit_cost: 50, unit_retail: 60, current_stock: 0, opening_stock: 0, expected_margin: 10, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 30, name: "Sprite Pet Bottle 500ml", category: "Beverages", unit_type: "bottles", unit_cost: 50, unit_retail: 60, current_stock: 0, opening_stock: 0, expected_margin: 10, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 31, name: "Pwani Salt Iodized 1kg", category: "Spices", unit_type: "packets", unit_cost: 35, unit_retail: 45, current_stock: 0, opening_stock: 0, expected_margin: 10, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 32, name: "Kensalt Salt 500g", category: "Spices", unit_type: "packets", unit_cost: 20, unit_retail: 25, current_stock: 0, opening_stock: 0, expected_margin: 5, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 33, name: "Daawat Aromatic Rice 2kg", category: "Grains", unit_type: "packets", unit_cost: 380, unit_retail: 450, current_stock: 0, opening_stock: 0, expected_margin: 70, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 34, name: "Pearl Pishori Rice 1kg", category: "Grains", unit_type: "packets", unit_cost: 220, unit_retail: 260, current_stock: 0, opening_stock: 0, expected_margin: 40, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 35, name: "Santa Maria Green Grams 1kg", category: "Grains", unit_type: "packets", unit_cost: 160, unit_retail: 195, current_stock: 0, opening_stock: 0, expected_margin: 35, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 36, name: "Mwitemania Beans 1kg", category: "Grains", unit_type: "packets", unit_cost: 150, unit_retail: 180, current_stock: 0, opening_stock: 0, expected_margin: 30, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 37, name: "Bata Shoeshine Kiwi Black 50ml", category: "Household", unit_type: "tins", unit_cost: 85, unit_retail: 110, current_stock: 0, opening_stock: 0, expected_margin: 25, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 38, name: "Matchboxes Rhinos (Pack 10)", category: "Household", unit_type: "packs", unit_cost: 40, unit_retail: 55, current_stock: 0, opening_stock: 0, expected_margin: 15, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 39, name: "Steel Wool 50g", category: "Household", unit_type: "pieces", unit_cost: 18, unit_retail: 25, current_stock: 0, opening_stock: 0, expected_margin: 7, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 40, name: "Harpic Toilet Cleaner 500ml", category: "Hygiene", unit_type: "bottles", unit_cost: 195, unit_retail: 240, current_stock: 0, opening_stock: 0, expected_margin: 45, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 41, name: "Vaseline Petroleum Jelly 100ml", category: "Cosmetics", unit_type: "jars", unit_cost: 110, unit_retail: 135, current_stock: 0, opening_stock: 0, expected_margin: 25, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 42, name: "Nice & Lovely Lotion 100ml", category: "Cosmetics", unit_type: "bottles", unit_cost: 95, unit_retail: 120, current_stock: 0, opening_stock: 0, expected_margin: 25, total_shelf_value: 0, velocity_badge: "Pending Stock" },
  { id: 43, name: "Kasuku Exercise Books 120pgs", category: "Stationery", unit_type: "books", unit_cost: 65, unit_retail: 85, current_stock: 0, opening_stock: 0, expected_margin: 20, total_shelf_value: 0, velocity_badge: "Pending Stock" }
];

export const INITIAL_CUSTOMERS: CustomerDebtor[] = [
  { id: "cust_1", name: "Mama Boi", phone: "0712 345 678", national_id: "24891044", debt_balance: 0, credit_limit: 1000, last_transaction_date: "Today", notes: "Regular morning customer &bull; Verified ID for OTC deposits" },
  { id: "cust_2", name: "Baba Junior", phone: "0723 456 789", national_id: "29440182", debt_balance: 0, credit_limit: 800, last_transaction_date: "Today", notes: "Clears balance weekly via Equity Agent" },
  { id: "cust_3", name: "Mama Stacy", phone: "0734 567 890", national_id: "31802941", debt_balance: 0, credit_limit: 1500, last_transaction_date: "Today", notes: "Grocery credit account &bull; Prompt payer" }
];

export const INITIAL_SUPPLIERS: SupplierProfile[] = [
  {
    id: "supp_001",
    name: "Brookside Dairy Logistics",
    company: "Brookside Dairy Ltd (Ruiru Hub)",
    phone: "0722 849 101",
    national_id: "22940184",
    category: "Dairy & Chilled",
    total_orders_cost: 0,
    last_delivery_date: "Pending",
    payment_preference: "NATIONAL_ID_DEPOSIT"
  },
  {
    id: "supp_002",
    name: "Broadway Bakeries Thika",
    company: "Broadway Bakeries Ltd",
    phone: "0733 901 442",
    national_id: "26884019",
    category: "Bakery",
    total_orders_cost: 0,
    last_delivery_date: "Pending",
    payment_preference: "MPESA_TILL"
  },
  {
    id: "supp_003",
    name: "Unga Millers Eldoret",
    company: "Unga Group Distribution",
    phone: "0711 445 890",
    national_id: "28419203",
    category: "Flour & Cereals",
    total_orders_cost: 0,
    last_delivery_date: "Pending",
    payment_preference: "NATIONAL_ID_DEPOSIT"
  },
  {
    id: "supp_004",
    name: "Bidco Africa Van",
    company: "Bidco Africa Ltd",
    phone: "0720 338 901",
    national_id: "25194022",
    category: "Cooking Oils & Soaps",
    total_orders_cost: 0,
    last_delivery_date: "Pending",
    payment_preference: "NATIONAL_ID_DEPOSIT"
  },
  {
    id: "supp_005",
    name: "Gikomba Dry Grain Wholesaler",
    company: "Kamau & Sons Cereals Gikomba",
    phone: "0708 776 210",
    national_id: "19804211",
    category: "Grains & Pulses",
    total_orders_cost: 0,
    last_delivery_date: "Pending",
    payment_preference: "NATIONAL_ID_DEPOSIT"
  }
];

export const INITIAL_FLOAT_DENOMINATIONS: FloatDenomination[] = [
  { value: 1000, type: "note", label: "1000 Note", count: 0 },
  { value: 500, type: "note", label: "500 Note", count: 0 },
  { value: 200, type: "note", label: "200 Note", count: 0 },
  { value: 100, type: "note", label: "100 Note", count: 0 },
  { value: 50, type: "note", label: "50 Note", count: 0 },
  { value: 40, type: "coin", label: "40 Coin", count: 0 },
  { value: 20, type: "coin", label: "20 Coin", count: 0 },
  { value: 10, type: "coin", label: "10 Coin", count: 0 },
  { value: 5, type: "coin", label: "5 Coin", count: 0 },
  { value: 1, type: "coin", label: "1 Coin", count: 0 }
]; // Total = 0 KSh

export const INITIAL_MORNING_BOOKENDS: MorningBookendRecord[] = [];

export const INITIAL_ALACIO_STATE: AlacioMasterState = {
  inventory: INITIAL_INVENTORY_43,
  warehouse: INITIAL_WAREHOUSE_BATCHES,
  customers: INITIAL_CUSTOMERS,
  suppliers: INITIAL_SUPPLIERS,
  morning_bookends: INITIAL_MORNING_BOOKENDS,
  floatDenominations: INITIAL_FLOAT_DENOMINATIONS,
  salesLedger: [],
  payouts: [],
  mpesaStatements: [],
  reconciliations: [],
  kpis: {
    total_active_shelf_retail_value: 0,
    total_capital_invested: 0,
    locked_in_potential_gross_profit: 0,
    avg_markup_percentage: 0,
    total_active_items: 43,
    warehouse_bulk_value: 0,
    warehouse_total_units: 0
  },
  cash_register_balance: 0,
  mpesa_float_balance: 0,
  equitel_account_balance: 0,
  currency: "KSh",
  last_updated: new Date().toISOString(),
  tier: "PAID_BLUEPRINT",
  vcr_daily_count: 0,
  vcr_customer_consent: true,
  clean_trading_days: 0
};

export function resetAlacioToZeroSlate(): AlacioMasterState {
  try {
    localStorage.removeItem("yubiflo_alacio_state_v1");
    localStorage.setItem(STORAGE_KEY_ALACIO, JSON.stringify(INITIAL_ALACIO_STATE));
  } catch (err) {
    console.warn("Storage reset warning:", err);
  }
  return INITIAL_ALACIO_STATE;
}

export function calculateKpis(inventory: InventoryItem[], warehouse: WarehouseBatch[] = []) {
  const totalRetail = inventory.reduce((acc, curr) => acc + (curr.current_stock * curr.unit_retail), 0);
  const totalCost = inventory.reduce((acc, curr) => acc + (curr.current_stock * curr.unit_cost), 0);
  const profit = totalRetail - totalCost;
  const markup = totalCost > 0 ? parseFloat(((profit / totalCost) * 100).toFixed(1)) : 0;
  
  const whValue = warehouse.reduce((acc, b) => acc + (b.bulk_quantity * b.bulk_cost_per_unit), 0);
  const whUnits = warehouse.reduce((acc, b) => acc + b.bulk_quantity, 0);

  return {
    total_active_shelf_retail_value: totalRetail,
    total_capital_invested: totalCost,
    locked_in_potential_gross_profit: profit,
    avg_markup_percentage: markup,
    total_active_items: inventory.length,
    warehouse_bulk_value: whValue,
    warehouse_total_units: whUnits
  };
}

export function loadAlacioState(): AlacioMasterState {
  try {
    // Safely check storage keys so the user's existing data is never lost
    const raw = localStorage.getItem(STORAGE_KEY_ALACIO) || 
                localStorage.getItem("yubiflo_alacio_state_live_v1") || 
                localStorage.getItem("yubiflo_alacio_state_v1");
    if (!raw) return INITIAL_ALACIO_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const inv = Array.isArray(parsed.inventory) && parsed.inventory.length > 0 
        ? parsed.inventory 
        : INITIAL_INVENTORY_43;
      const wh = Array.isArray(parsed.warehouse) ? parsed.warehouse : INITIAL_WAREHOUSE_BATCHES;
      const cust = Array.isArray(parsed.customers) ? parsed.customers : INITIAL_CUSTOMERS;
      const rawSupp = Array.isArray(parsed.suppliers) ? parsed.suppliers : INITIAL_SUPPLIERS;
      const supp = deduplicateSuppliers(rawSupp);
      const rawMb = Array.isArray(parsed.morning_bookends) ? parsed.morning_bookends : INITIAL_MORNING_BOOKENDS;
      const mb = deduplicateMorningBookends(rawMb);
      const fd = Array.isArray(parsed.floatDenominations) ? parsed.floatDenominations : INITIAL_FLOAT_DENOMINATIONS;

      const todayStr = new Date().toISOString().slice(0, 10);
      const normalizedSales = (Array.isArray(parsed.salesLedger) ? parsed.salesLedger : []).map((s: any) => ({
        ...s,
        date: s.date || (s.timestamp && s.timestamp.match(/^\d{4}-\d{2}-\d{2}/) ? s.timestamp.match(/^\d{4}-\d{2}-\d{2}/)[0] : todayStr)
      }));
      const normalizedPayouts = (Array.isArray(parsed.payouts) ? parsed.payouts : []).map((p: any) => ({
        ...p,
        date: p.date || (p.timestamp && p.timestamp.match(/^\d{4}-\d{2}-\d{2}/) ? p.timestamp.match(/^\d{4}-\d{2}-\d{2}/)[0] : todayStr)
      }));

      // Evening Reconciliations: If entered twice for the same date, later overwrites former
      const rawRecons = Array.isArray(parsed.reconciliations) ? parsed.reconciliations : [];
      const reconsMap = new Map<string, any>();
      rawRecons.forEach((r: any) => {
        const d = r.date || r.timestamp?.slice(0, 10) || "today";
        if (!reconsMap.has(d)) {
          reconsMap.set(d, r);
        }
      });
      const normalizedReconciliations = Array.from(reconsMap.values());

      return {
        ...INITIAL_ALACIO_STATE,
        ...parsed,
        inventory: inv,
        warehouse: wh,
        customers: cust,
        suppliers: supp,
        morning_bookends: mb,
        floatDenominations: fd,
        salesLedger: normalizedSales,
        payouts: normalizedPayouts,
        mpesaStatements: Array.isArray(parsed.mpesaStatements) ? parsed.mpesaStatements : [],
        reconciliations: normalizedReconciliations,
        mpesa_float_balance: parsed.mpesa_float_balance ?? 0,
        cash_register_balance: parsed.cash_register_balance ?? 0,
        equitel_account_balance: parsed.equitel_account_balance ?? 0,
        tier: parsed.tier ?? "PAID_BLUEPRINT",
        vcr_daily_count: parsed.vcr_daily_count ?? 0,
        vcr_customer_consent: parsed.vcr_customer_consent ?? true,
        clean_trading_days: parsed.clean_trading_days ?? 0,
        kpis: calculateKpis(inv, wh)
      };
    }
    return INITIAL_ALACIO_STATE;
  } catch (error) {
    console.warn("[YuBiFlo Storage] Error loading alacio state. Preserving state:", error);
    return INITIAL_ALACIO_STATE;
  }
}

export async function saveAlacioState(state: AlacioMasterState): Promise<void> {
  // 1. Offline-First Synchronous Persistence
  try {
    localStorage.setItem(STORAGE_KEY_ALACIO, JSON.stringify(state));
  } catch (err) {
    console.error("[YuBiFlo Storage] Failed to persist Alacio state to localStorage:", err);
  }

  // 2. Cloud Mirroring to Firestore
  try {
    const workspaceRef = doc(db, "workspaces", "ws_alacio_001");
    await setDoc(workspaceRef, {
      id: "ws_alacio_001",
      business_name: "Alacio Mini Shop",
      blueprint_type: "RETAIL_FMCG",
      currency: state.currency,
      kpis: state.kpis,
      cash_register_balance: state.cash_register_balance,
      total_items_count: state.inventory.length,
      warehouse_batches_count: state.warehouse.length,
      last_updated: new Date().toISOString()
    }, { merge: true });
  } catch (cloudErr) {
    handleFirestoreError(cloudErr, OperationType.WRITE, "workspaces/ws_alacio_001");
  }
}
