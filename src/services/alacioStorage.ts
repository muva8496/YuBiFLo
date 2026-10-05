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
  SupplierProfile
} from "../types/alacio";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export const STORAGE_KEY_ALACIO = "yubiflo_alacio_state_v1";
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

export const INITIAL_PAYOUTS: PayoutOrDrawing[] = [
  {
    id: "po_1",
    timestamp: "10:15 AM",
    amount: 500,
    type: "BUSINESS_EXPENSE",
    notes: "Bread crate transport delivery fee"
  },
  {
    id: "po_2",
    timestamp: "02:00 PM",
    amount: 1500,
    type: "OWNER_DRAWING",
    notes: "Personal lunch and family household shopping"
  }
];

export const INITIAL_MPESA_STATEMENTS: MpesaStatementRecord[] = [
  { id: "mp_1", receipt_no: "SI4892K1", time: "08:15 AM", details: "Customer M-Pesa Buy Goods", amount: 130, status: "MATCHED" },
  { id: "mp_2", receipt_no: "SI4898B4", time: "09:10 AM", details: "Pastor John Sugar Purchase", amount: 305, status: "MATCHED" },
  { id: "mp_3", receipt_no: "SI5012Z8", time: "11:45 AM", details: "Mama Kevin M-Pesa Deposit", amount: 450, status: "UNMATCHED_INFLOW" },
  { id: "mp_4", receipt_no: "SI5120X9", time: "01:15 PM", details: "KPLC Electricity Token Paybill", amount: 800, status: "UNMATCHED_OUTFLOW" }
];

export const INITIAL_WAREHOUSE_BATCHES: WarehouseBatch[] = [
  {
    id: "wh_batch_001",
    item_id: 4,
    item_name: "Unga Jogoo 2kg",
    category: "Flour",
    batch_number: "UJ-2026-B94",
    supplier_name: "Unga Millers Eldoret Hub",
    bulk_quantity: 40,
    unit_type: "bales",
    bulk_cost_per_unit: 175,
    total_batch_cost: 7000,
    storage_location: "Backroom Bay 2 (Pallet A)",
    reorder_threshold: 10,
    received_date: "2026-09-28",
    expiry_date: "2027-03-30",
    status: "IN_STORAGE"
  },
  {
    id: "wh_batch_002",
    item_id: 1,
    item_name: "Brookside Fresh Milk 500ml",
    category: "Dairy",
    batch_number: "BRK-M920",
    supplier_name: "Brookside Ruiru Depot",
    bulk_quantity: 60,
    unit_type: "packets",
    bulk_cost_per_unit: 52,
    total_batch_cost: 3120,
    storage_location: "Walk-in Cold Chiller 1",
    reorder_threshold: 15,
    received_date: "2026-10-01",
    expiry_date: "2026-10-08",
    status: "IN_STORAGE"
  },
  {
    id: "wh_batch_003",
    item_id: 7,
    item_name: "Rina Vegetable Oil 1L",
    category: "Cooking & Oils",
    batch_number: "RN-8840",
    supplier_name: "Kapa Oil Refineries",
    bulk_quantity: 25,
    unit_type: "bottles",
    bulk_cost_per_unit: 275,
    total_batch_cost: 6875,
    storage_location: "Stack Rack C-3",
    reorder_threshold: 8,
    received_date: "2026-09-25",
    expiry_date: "2027-09-25",
    status: "IN_STORAGE"
  },
  {
    id: "wh_batch_004",
    item_id: 10,
    item_name: "Fresh Kenchic Eggs Crate",
    category: "Poultry",
    batch_number: "KC-EG-124",
    supplier_name: "Kenchic Tigoni Farms",
    bulk_quantity: 15,
    unit_type: "crates",
    bulk_cost_per_unit: 380,
    total_batch_cost: 5700,
    storage_location: "Poultry Rack Section 1",
    reorder_threshold: 4,
    received_date: "2026-09-29",
    expiry_date: "2026-10-20",
    status: "IN_STORAGE"
  },
  {
    id: "wh_batch_005",
    item_id: 14,
    item_name: "Mumias Sugar 1kg",
    category: "Sugar",
    batch_number: "MS-5510",
    supplier_name: "Mumias Sugar Distributors",
    bulk_quantity: 45,
    unit_type: "packets",
    bulk_cost_per_unit: 140,
    total_batch_cost: 6300,
    storage_location: "Dry Storage Bay 1",
    reorder_threshold: 12,
    received_date: "2026-09-26",
    expiry_date: "2028-09-26",
    status: "IN_STORAGE"
  },
  {
    id: "wh_batch_006",
    item_id: 11,
    item_name: "Broadways White Bread 400g",
    category: "Bakery",
    batch_number: "BW-BR-011",
    supplier_name: "Broadway Bakeries Thika",
    bulk_quantity: 30,
    unit_type: "loaves",
    bulk_cost_per_unit: 54,
    total_batch_cost: 1620,
    storage_location: "Bread Dispatch Crate",
    reorder_threshold: 10,
    received_date: "2026-10-02",
    expiry_date: "2026-10-06",
    status: "IN_STORAGE"
  }
];

export const INITIAL_INVENTORY_43: InventoryItem[] = [
  { id: 1, name: "Brookside Fresh Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 52, unit_retail: 65, current_stock: 24, opening_stock: 24, expected_margin: 13, total_shelf_value: 1560, velocity_badge: "High Velocity" },
  { id: 2, name: "KCC Fresh Milk 500ml", category: "Dairy", unit_type: "packets", unit_cost: 50, unit_retail: 60, current_stock: 18, opening_stock: 18, expected_margin: 10, total_shelf_value: 1080, velocity_badge: "High Velocity" },
  { id: 3, name: "Ilara Maziwa Lala 500ml", category: "Dairy", unit_type: "bottles", unit_cost: 65, unit_retail: 80, current_stock: 12, opening_stock: 12, expected_margin: 15, total_shelf_value: 960, velocity_badge: "Normal" },
  { id: 4, name: "Unga Jogoo 2kg", category: "Flour", unit_type: "bales", unit_cost: 175, unit_retail: 210, current_stock: 8, opening_stock: 8, expected_margin: 35, total_shelf_value: 1680, velocity_badge: "High Velocity" },
  { id: 5, name: "Unga Pembe 2kg", category: "Flour", unit_type: "bales", unit_cost: 170, unit_retail: 205, current_stock: 6, opening_stock: 6, expected_margin: 35, total_shelf_value: 1230, velocity_badge: "Normal" },
  { id: 6, name: "Ajab Wheat Flour 2kg", category: "Flour", unit_type: "bales", unit_cost: 185, unit_retail: 220, current_stock: 5, opening_stock: 5, expected_margin: 35, total_shelf_value: 1100, velocity_badge: "Normal" },
  { id: 7, name: "Rina Vegetable Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 275, unit_retail: 330, current_stock: 10, opening_stock: 10, expected_margin: 55, total_shelf_value: 3300, velocity_badge: "High Velocity" },
  { id: 8, name: "Salit Salad Oil 500ml", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 145, unit_retail: 175, current_stock: 14, opening_stock: 14, expected_margin: 30, total_shelf_value: 2450, velocity_badge: "High Velocity" },
  { id: 9, name: "Elianto Corn Oil 1L", category: "Cooking & Oils", unit_type: "bottles", unit_cost: 360, unit_retail: 430, current_stock: 4, opening_stock: 4, expected_margin: 70, total_shelf_value: 1720, velocity_badge: "Normal" },
  { id: 10, name: "Fresh Kenchic Eggs Crate", category: "Poultry", unit_type: "crates", unit_cost: 380, unit_retail: 460, current_stock: 6, opening_stock: 6, expected_margin: 80, total_shelf_value: 2760, velocity_badge: "High Velocity" },
  { id: 11, name: "Broadways White Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 54, unit_retail: 65, current_stock: 16, opening_stock: 16, expected_margin: 11, total_shelf_value: 1040, velocity_badge: "High Velocity" },
  { id: 12, name: "Festive Brown Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 58, unit_retail: 70, current_stock: 10, opening_stock: 10, expected_margin: 12, total_shelf_value: 700, velocity_badge: "High Velocity" },
  { id: 13, name: "Superloaf White Bread 400g", category: "Bakery", unit_type: "loaves", unit_cost: 52, unit_retail: 65, current_stock: 12, opening_stock: 12, expected_margin: 13, total_shelf_value: 780, velocity_badge: "Normal" },
  { id: 14, name: "Mumias Sugar 1kg", category: "Sugar", unit_type: "packets", unit_cost: 140, unit_retail: 165, current_stock: 15, opening_stock: 15, expected_margin: 25, total_shelf_value: 2475, velocity_badge: "High Velocity" },
  { id: 15, name: "Kabras Sugar 1kg", category: "Sugar", unit_type: "packets", unit_cost: 138, unit_retail: 160, current_stock: 18, opening_stock: 18, expected_margin: 22, total_shelf_value: 2880, velocity_badge: "High Velocity" },
  { id: 16, name: "Royco Mchuzi Mix Beef 200g", category: "Spices", unit_type: "tins", unit_cost: 115, unit_retail: 140, current_stock: 8, opening_stock: 8, expected_margin: 25, total_shelf_value: 1120, velocity_badge: "Normal" },
  { id: 17, name: "Royco Mchuzi Mix Chicken 75g", category: "Spices", unit_type: "packets", unit_cost: 45, unit_retail: 60, current_stock: 20, opening_stock: 20, expected_margin: 15, total_shelf_value: 1200, velocity_badge: "High Velocity" },
  { id: 18, name: "Tropical Heat Pilau Masala 50g", category: "Spices", unit_type: "sachets", unit_cost: 55, unit_retail: 75, current_stock: 12, opening_stock: 12, expected_margin: 20, total_shelf_value: 900, velocity_badge: "Normal" },
  { id: 19, name: "Omo Hand Washing Powder 500g", category: "Hygiene", unit_type: "packets", unit_cost: 125, unit_retail: 150, current_stock: 7, opening_stock: 7, expected_margin: 25, total_shelf_value: 1050, velocity_badge: "Normal" },
  { id: 20, name: "Sunlight Washing Powder 500g", category: "Hygiene", unit_type: "packets", unit_cost: 110, unit_retail: 135, current_stock: 9, opening_stock: 9, expected_margin: 25, total_shelf_value: 1215, velocity_badge: "Normal" },
  { id: 21, name: "Geisha Soap Green 200g", category: "Hygiene", unit_type: "bars", unit_cost: 80, unit_retail: 100, current_stock: 14, opening_stock: 14, expected_margin: 20, total_shelf_value: 1400, velocity_badge: "Normal" },
  { id: 22, name: "Menengai Cream Bar Soap 800g", category: "Hygiene", unit_type: "bars", unit_cost: 140, unit_retail: 170, current_stock: 8, opening_stock: 8, expected_margin: 30, total_shelf_value: 1360, velocity_badge: "Normal" },
  { id: 23, name: "Colgate Triple Action 140g", category: "Hygiene", unit_type: "tubes", unit_cost: 130, unit_retail: 160, current_stock: 6, opening_stock: 6, expected_margin: 30, total_shelf_value: 960, velocity_badge: "Normal" },
  { id: 24, name: "Always Ultra Thin Pads 8s", category: "Hygiene", unit_type: "packets", unit_cost: 85, unit_retail: 110, current_stock: 15, opening_stock: 15, expected_margin: 25, total_shelf_value: 1650, velocity_badge: "High Velocity" },
  { id: 25, name: "Ketepa Pride Tea Leaves 250g", category: "Beverages", unit_type: "packets", unit_cost: 115, unit_retail: 140, current_stock: 8, opening_stock: 8, expected_margin: 25, total_shelf_value: 1120, velocity_badge: "Normal" },
  { id: 26, name: "Nescafe 3in1 Classic Sachets", category: "Beverages", unit_type: "sachets", unit_cost: 22, unit_retail: 30, current_stock: 40, opening_stock: 40, expected_margin: 8, total_shelf_value: 1200, velocity_badge: "High Velocity" },
  { id: 27, name: "Cadbury Cocoa Powder 100g", category: "Beverages", unit_type: "tins", unit_cost: 165, unit_retail: 200, current_stock: 5, opening_stock: 5, expected_margin: 35, total_shelf_value: 1000, velocity_badge: "Low Stock Alert" },
  { id: 28, name: "Coca Cola Pet Bottle 500ml", category: "Beverages", unit_type: "bottles", unit_cost: 50, unit_retail: 60, current_stock: 18, opening_stock: 18, expected_margin: 10, total_shelf_value: 1080, velocity_badge: "High Velocity" },
  { id: 29, name: "Fanta Orange Pet 500ml", category: "Beverages", unit_type: "bottles", unit_cost: 50, unit_retail: 60, current_stock: 12, opening_stock: 12, expected_margin: 10, total_shelf_value: 720, velocity_badge: "Normal" },
  { id: 30, name: "Sprite Pet Bottle 500ml", category: "Beverages", unit_type: "bottles", unit_cost: 50, unit_retail: 60, current_stock: 10, opening_stock: 10, expected_margin: 10, total_shelf_value: 600, velocity_badge: "Normal" },
  { id: 31, name: "Pwani Salt Iodized 1kg", category: "Spices", unit_type: "packets", unit_cost: 35, unit_retail: 45, current_stock: 25, opening_stock: 25, expected_margin: 10, total_shelf_value: 1125, velocity_badge: "High Velocity" },
  { id: 32, name: "Kensalt Salt 500g", category: "Spices", unit_type: "packets", unit_cost: 20, unit_retail: 25, current_stock: 30, opening_stock: 30, expected_margin: 5, total_shelf_value: 750, velocity_badge: "Normal" },
  { id: 33, name: "Daawat Aromatic Rice 2kg", category: "Grains", unit_type: "packets", unit_cost: 380, unit_retail: 450, current_stock: 4, opening_stock: 4, expected_margin: 70, total_shelf_value: 1800, velocity_badge: "Normal" },
  { id: 34, name: "Pearl Pishori Rice 1kg", category: "Grains", unit_type: "packets", unit_cost: 220, unit_retail: 260, current_stock: 6, opening_stock: 6, expected_margin: 40, total_shelf_value: 1560, velocity_badge: "Normal" },
  { id: 35, name: "Santa Maria Green Grams 1kg", category: "Grains", unit_type: "packets", unit_cost: 160, unit_retail: 195, current_stock: 5, opening_stock: 5, expected_margin: 35, total_shelf_value: 975, velocity_badge: "Normal" },
  { id: 36, name: "Mwitemania Beans 1kg", category: "Grains", unit_type: "packets", unit_cost: 150, unit_retail: 180, current_stock: 6, opening_stock: 6, expected_margin: 30, total_shelf_value: 1080, velocity_badge: "Normal" },
  { id: 37, name: "Bata Shoeshine Kiwi Black 50ml", category: "Household", unit_type: "tins", unit_cost: 85, unit_retail: 110, current_stock: 8, opening_stock: 8, expected_margin: 25, total_shelf_value: 880, velocity_badge: "Normal" },
  { id: 38, name: "Matchboxes Rhinos (Pack 10)", category: "Household", unit_type: "packs", unit_cost: 40, unit_retail: 55, current_stock: 12, opening_stock: 12, expected_margin: 15, total_shelf_value: 660, velocity_badge: "Normal" },
  { id: 39, name: "Steel Wool 50g", category: "Household", unit_type: "pieces", unit_cost: 18, unit_retail: 25, current_stock: 25, opening_stock: 25, expected_margin: 7, total_shelf_value: 625, velocity_badge: "High Velocity" },
  { id: 40, name: "Harpic Toilet Cleaner 500ml", category: "Hygiene", unit_type: "bottles", unit_cost: 195, unit_retail: 240, current_stock: 3, opening_stock: 3, expected_margin: 45, total_shelf_value: 720, velocity_badge: "Low Stock Alert" },
  { id: 41, name: "Vaseline Petroleum Jelly 100ml", category: "Cosmetics", unit_type: "jars", unit_cost: 110, unit_retail: 135, current_stock: 7, opening_stock: 7, expected_margin: 25, total_shelf_value: 945, velocity_badge: "Normal" },
  { id: 42, name: "Nice & Lovely Lotion 100ml", category: "Cosmetics", unit_type: "bottles", unit_cost: 95, unit_retail: 120, current_stock: 8, opening_stock: 8, expected_margin: 25, total_shelf_value: 960, velocity_badge: "Normal" },
  { id: 43, name: "Kasuku Exercise Books 120pgs", category: "Stationery", unit_type: "books", unit_cost: 65, unit_retail: 85, current_stock: 15, opening_stock: 15, expected_margin: 20, total_shelf_value: 1275, velocity_badge: "Normal" }
];

export const INITIAL_CUSTOMERS: CustomerDebtor[] = [
  { id: "cust_1", name: "Mama Boi", phone: "0712 345 678", national_id: "24891044", debt_balance: 340, credit_limit: 1000, last_transaction_date: "Today, 08:30 AM", notes: "Regular morning milk & bread credit &bull; Verified ID for OTC deposits" },
  { id: "cust_2", name: "Baba Junior", phone: "0723 456 789", national_id: "29440182", debt_balance: 180, credit_limit: 800, last_transaction_date: "Yesterday", notes: "Clears balance every Friday via Equity Agent" },
  { id: "cust_3", name: "Mama Stacy", phone: "0734 567 890", national_id: "31802941", debt_balance: 520, credit_limit: 1500, last_transaction_date: "2 days ago", notes: "Grocery credit, prompt payer" }
];

export const INITIAL_SUPPLIERS: SupplierProfile[] = [
  {
    id: "supp_001",
    name: "Brookside Dairy Logistics",
    company: "Brookside Dairy Ltd (Ruiru Hub)",
    phone: "0722 849 101",
    national_id: "22940184",
    category: "Dairy & Chilled",
    total_orders_cost: 38450,
    last_delivery_date: "2026-10-03",
    payment_preference: "NATIONAL_ID_DEPOSIT"
  },
  {
    id: "supp_002",
    name: "Broadway Bakeries Thika",
    company: "Broadway Bakeries Ltd",
    phone: "0733 901 442",
    national_id: "26884019",
    category: "Bakery",
    total_orders_cost: 21300,
    last_delivery_date: "2026-10-04",
    payment_preference: "MPESA_TILL"
  },
  {
    id: "supp_003",
    name: "Unga Millers Eldoret",
    company: "Unga Group Distribution",
    phone: "0711 445 890",
    national_id: "28419203",
    category: "Flour & Cereals",
    total_orders_cost: 45000,
    last_delivery_date: "2026-09-28",
    payment_preference: "NATIONAL_ID_DEPOSIT"
  },
  {
    id: "supp_004",
    name: "Bidco Africa Van",
    company: "Bidco Africa Ltd",
    phone: "0720 338 901",
    national_id: "25194022",
    category: "Cooking Oils & Soaps",
    total_orders_cost: 28900,
    last_delivery_date: "2026-09-30",
    payment_preference: "NATIONAL_ID_DEPOSIT"
  },
  {
    id: "supp_005",
    name: "Gikomba Dry Grain Wholesaler",
    company: "Kamau & Sons Cereals Gikomba",
    phone: "0708 776 210",
    national_id: "19804211",
    category: "Grains & Pulses",
    total_orders_cost: 18500,
    last_delivery_date: "2026-10-01",
    payment_preference: "NATIONAL_ID_DEPOSIT"
  }
];

export const INITIAL_FLOAT_DENOMINATIONS: FloatDenomination[] = [
  { value: 1000, type: "note", label: "1000 Note", count: 0 },
  { value: 500, type: "note", label: "500 Note", count: 0 },
  { value: 200, type: "note", label: "200 Note", count: 2 },
  { value: 100, type: "note", label: "100 Note", count: 1 },
  { value: 50, type: "note", label: "50 Note", count: 2 },
  { value: 40, type: "coin", label: "40 Coin", count: 0 },
  { value: 20, type: "coin", label: "20 Coin", count: 2 },
  { value: 10, type: "coin", label: "10 Coin", count: 1 },
  { value: 5, type: "coin", label: "5 Coin", count: 1 },
  { value: 1, type: "coin", label: "1 Coin", count: 0 }
]; // 2*200(400) + 1*100(100) + 2*50(100) + 2*20(40) + 1*10(10) + 1*5(5) = 655 KSh

export const INITIAL_ALACIO_STATE: AlacioMasterState = {
  inventory: INITIAL_INVENTORY_43,
  warehouse: INITIAL_WAREHOUSE_BATCHES,
  customers: INITIAL_CUSTOMERS,
  floatDenominations: INITIAL_FLOAT_DENOMINATIONS,
  salesLedger: [
    { id: "sl_1", timestamp: "08:15 AM", customer_name: "Walk-in", items_summary: "Brookside Milk 500ml x2", total_amount: 130, cash_paid: 130, mpesa_paid: 0, debt_amount: 0, payment_method: "CASH" },
    { id: "sl_2", timestamp: "08:30 AM", customer_name: "Mama Boi", items_summary: "Milk 500ml x2, Bread x1", total_amount: 185, cash_paid: 150, mpesa_paid: 0, debt_amount: 35, payment_method: "SPLIT" },
    { id: "sl_3", timestamp: "09:10 AM", customer_name: "Pastor John", items_summary: "Mumias Sugar 1kg, Tea Leaves", total_amount: 305, cash_paid: 0, mpesa_paid: 305, debt_amount: 0, payment_method: "MPESA" }
  ],
  payouts: INITIAL_PAYOUTS,
  mpesaStatements: INITIAL_MPESA_STATEMENTS,
  reconciliations: [
    {
      id: "recon_prev",
      date: "Yesterday",
      expected_stock_sales: 12450,
      physical_cash: 5200,
      mpesa_statement: 7200,
      unlogged_credit: 50,
      discrepancy_gap: 0,
      status: "BALANCED",
      sealed_at: "2026-09-30 20:45"
    }
  ],
  kpis: {
    total_active_shelf_retail_value: 35545,
    total_capital_invested: 29599.06,
    locked_in_potential_gross_profit: 5945.94,
    avg_markup_percentage: 20.1,
    total_active_items: 43,
    warehouse_bulk_value: 30615,
    warehouse_total_units: 215
  },
  cash_register_balance: 655 + 280, // initial float + morning sales
  mpesa_float_balance: 3850,
  equitel_account_balance: 14250, // M-Pesa Paybill settlement into Equitel line account
  currency: "KSh",
  last_updated: new Date().toISOString(),
  tier: "PAID_BLUEPRINT",
  vcr_daily_count: 6,
  vcr_customer_consent: true,
  clean_trading_days: 18 // 18 of 30 days towards Tier 3 predictive models
};

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
    const raw = localStorage.getItem(STORAGE_KEY_ALACIO);
    if (!raw) return INITIAL_ALACIO_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.inventory) && parsed.inventory.length > 0) {
      const wh = Array.isArray(parsed.warehouse) && parsed.warehouse.length > 0 ? parsed.warehouse : INITIAL_WAREHOUSE_BATCHES;
      return {
        ...INITIAL_ALACIO_STATE,
        ...parsed,
        warehouse: wh,
        payouts: Array.isArray(parsed.payouts) ? parsed.payouts : INITIAL_PAYOUTS,
        mpesaStatements: Array.isArray(parsed.mpesaStatements) ? parsed.mpesaStatements : INITIAL_MPESA_STATEMENTS,
        mpesa_float_balance: parsed.mpesa_float_balance ?? 3850,
        tier: parsed.tier ?? "PAID_BLUEPRINT",
        vcr_daily_count: parsed.vcr_daily_count ?? 6,
        vcr_customer_consent: parsed.vcr_customer_consent ?? true,
        clean_trading_days: parsed.clean_trading_days ?? 18,
        kpis: calculateKpis(parsed.inventory, wh)
      };
    }
    return INITIAL_ALACIO_STATE;
  } catch (error) {
    console.warn("[YuBiFlo Storage] Corrupted alacio state detected. Resetting to defaults:", error);
    try {
      localStorage.removeItem(STORAGE_KEY_ALACIO);
    } catch {}
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
