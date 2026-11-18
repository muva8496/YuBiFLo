import { AlacioMasterState } from "../types/alacio";
import { INITIAL_ALACIO_STATE, calculateKpis } from "./alacioStorage";
import { getLocalTodayIso, addDaysToIso } from "../utils/debtScheduleHelper";

export type DemoPreset = "duka" | "eatery";

const DEMO_STORAGE_KEY_PREFIX = "yubiflo_demo_sandbox_v2_";
const DEMO_META_KEY_PREFIX = "yubiflo_demo_sandbox_meta_v2_";
const ACTIVE_DEMO_PRESET_KEY = "yubiflo_active_demo_preset";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function getActiveDemoPreset(): DemoPreset {
  try {
    const saved = localStorage.getItem(ACTIVE_DEMO_PRESET_KEY);
    return saved === "eatery" ? "eatery" : "duka";
  } catch {
    return "duka";
  }
}

export function setActiveDemoPreset(preset: DemoPreset): void {
  try {
    localStorage.setItem(ACTIVE_DEMO_PRESET_KEY, preset);
  } catch {
    // ignore
  }
}

/**
 * Creates a fresh, isolated sample dataset for either:
 * - "duka": Duka Space (Kenyan neighborhood FMCG retail duka)
 * - "eatery": Mtaani Eats & Roadside Kiosk (Cash + Pochi / Send Money eatery shell)
 */
export function createFreshDemoState(preset: DemoPreset = "duka"): AlacioMasterState {
  const cloned = JSON.parse(JSON.stringify(INITIAL_ALACIO_STATE)) as AlacioMasterState;
  const todayIso = new Date().toISOString().slice(0, 10);

  if (preset === "eatery") {
    const eateryInventory = [
      {
        id: "eat_1",
        name: "Beef Stew & 2 Chapati Plate",
        category: "Hot Meals",
        unit_type: "Plate",
        unit_cost: 95,
        unit_retail: 180,
        current_stock: 32,
        opening_stock: 48,
        expected_margin: 85,
        total_shelf_value: 32 * 180,
        velocity_badge: "High Velocity",
        supplier: "Mtaani Butchery & Millers"
      },
      {
        id: "eat_2",
        name: "Ugali, Beef & Sukuma",
        category: "Hot Meals",
        unit_type: "Plate",
        unit_cost: 80,
        unit_retail: 150,
        current_stock: 28,
        opening_stock: 45,
        expected_margin: 70,
        total_shelf_value: 28 * 150,
        velocity_badge: "High Velocity",
        supplier: "Mtaani Butchery & Millers"
      },
      {
        id: "eat_3",
        name: "Githeri Special (Parboiled)",
        category: "Hot Meals",
        unit_type: "Plate",
        unit_cost: 45,
        unit_retail: 100,
        current_stock: 24,
        opening_stock: 36,
        expected_margin: 55,
        total_shelf_value: 24 * 100,
        velocity_badge: "High Velocity",
        supplier: "Wakulima Fresh Produce"
      },
      {
        id: "eat_4",
        name: "Strong Milk Chai + 2 Mandazi",
        category: "Breakfast & Tea",
        unit_type: "Serving",
        unit_cost: 28,
        unit_retail: 60,
        current_stock: 40,
        opening_stock: 65,
        expected_margin: 32,
        total_shelf_value: 40 * 60,
        velocity_badge: "High Velocity",
        supplier: "Fresh Dairy Vendor"
      },
      {
        id: "eat_5",
        name: "Pilau & Kachumbari Bowl",
        category: "Hot Meals",
        unit_type: "Plate",
        unit_cost: 110,
        unit_retail: 200,
        current_stock: 15,
        opening_stock: 25,
        expected_margin: 90,
        total_shelf_value: 15 * 200,
        velocity_badge: "High Velocity",
        supplier: "Wakulima Fresh Produce"
      },
      {
        id: "eat_6",
        name: "Kibanda Cold Soda 300ml",
        category: "Beverages",
        unit_type: "Bottle",
        unit_cost: 35,
        unit_retail: 50,
        current_stock: 36,
        opening_stock: 48,
        expected_margin: 15,
        total_shelf_value: 36 * 50,
        velocity_badge: "Steady Mover",
        supplier: "Coca-Cola Route Van"
      }
    ];

    const eateryPayouts = [
      {
        id: "eat_pay_food_1",
        date: todayIso,
        timestamp: "06:35 AM",
        amount: 4200,
        type: "SUPPLIER_PAYOUT" as const,
        expense_category: "FOODSTUFF",
        payee: "Mtaani Butchery & Fresh Market",
        payment_channel: "POCHI_LA_BIASHARA",
        notes: "[Foodstuff] 6kg beef, unga, tomatoes, onions & sukuma morning stock"
      },
      {
        id: "eat_pay_viungo_1",
        date: todayIso,
        timestamp: "07:00 AM",
        amount: 680,
        type: "BUSINESS_EXPENSE" as const,
        expense_category: "VIUNGO_SPICES",
        payee: "Spice & Cooking Oil Stall",
        payment_channel: "CASH_DRAWER",
        notes: "[Viungo & Spices] Pilau masala, dhania, Royco, cooking oil & salt"
      },
      {
        id: "eat_pay_fuel_1",
        date: todayIso,
        timestamp: "07:15 AM",
        amount: 550,
        type: "BUSINESS_EXPENSE" as const,
        expense_category: "COOKING_FUEL",
        payee: "Charcoal & LPG Vendor",
        payment_channel: "CASH_DRAWER",
        notes: "[Cooking Fuel] 1/2 sack charcoal & kitchen gas refill contribution"
      },
      {
        id: "eat_pay_wages_1",
        date: todayIso,
        timestamp: "01:30 PM",
        amount: 1000,
        type: "BUSINESS_EXPENSE" as const,
        expense_category: "WAGES",
        payee: "2 Support Staff (Kitchen & Service)",
        payment_channel: "POCHI_LA_BIASHARA",
        notes: "[Support Staff Wages] Daily shift pay for 2 kitchen helpers"
      },
      {
        id: "eat_pay_rent_1",
        date: todayIso,
        timestamp: "08:00 AM",
        amount: 400,
        type: "BUSINESS_EXPENSE" as const,
        expense_category: "RENT",
        payee: "Roadside Structure Landlord",
        payment_channel: "CASH_DRAWER",
        notes: "[Stall Rent] Daily kiosk space & water fee allocation"
      }
    ];

    const eaterySales = [
      {
        id: "eat_sale_1",
        date: todayIso,
        timestamp: "08:25",
        customer_name: "Morning Boda Stage Crew",
        items_summary: "12x Strong Milk Chai + 2 Mandazi",
        total_amount: 720,
        cash_paid: 420,
        mpesa_paid: 300,
        debt_amount: 0,
        payment_method: "SPLIT" as const,
        payment_channel: "POCHI_LA_BIASHARA"
      },
      {
        id: "eat_sale_2",
        date: todayIso,
        timestamp: "12:40",
        customer_name: "Walk-in Lunch Rush",
        items_summary: "14x Beef Stew & 2 Chapati Plate, 8x Ugali, Beef & Sukuma",
        total_amount: 3720,
        cash_paid: 1800,
        mpesa_paid: 1920,
        debt_amount: 0,
        payment_method: "SPLIT" as const,
        payment_channel: "POCHI_LA_BIASHARA"
      },
      {
        id: "eat_sale_3",
        date: todayIso,
        timestamp: "13:15",
        customer_name: "Juma Boda (Regular)",
        items_summary: "2x Pilau & Kachumbari Bowl, 2x Soda",
        total_amount: 500,
        cash_paid: 200,
        mpesa_paid: 0,
        debt_amount: 300,
        payment_method: "CREDIT" as const,
        payment_channel: "CASH_DRAWER"
      }
    ];

    const eateryToday = getLocalTodayIso();
    const eateryCustomers = [
      {
        id: "eat_cust_1",
        name: "Benson Mwangi (Boda Stage)",
        phone: "0720 441 902",
        debt_balance: 360,
        credit_limit: 1000,
        last_transaction_date: addDaysToIso(eateryToday, -4),
        due_date: addDaysToIso(eateryToday, -1),
        items_taken: [
          { id: "edi_1", item_name: "Beef Stew & 2 Chapati Plate", qty: 2, unit_type: "Plates", unit_price: 180, line_total: 360, date_taken: addDaysToIso(eateryToday, -4) }
        ],
        total_repaid: 0,
        notes: "Lunch meals on tab"
      },
      {
        id: "eat_cust_2",
        name: "Wanjiku Hair Studio",
        phone: "0711 892 310",
        debt_balance: 450,
        credit_limit: 1500,
        last_transaction_date: eateryToday,
        due_date: addDaysToIso(eateryToday, 2),
        items_taken: [
          { id: "edi_2", item_name: "Ugali, Beef & Sukuma", qty: 2, unit_type: "Plates", unit_price: 150, line_total: 300, date_taken: eateryToday },
          { id: "edi_3", item_name: "Kibanda Cold Soda 300ml", qty: 3, unit_type: "Bottles", unit_price: 50, line_total: 150, date_taken: eateryToday }
        ],
        total_repaid: 0,
        notes: "Staff lunch orders — clears Friday"
      }
    ];

    const eaterySuppliers = [
      {
        id: "eat_sup_1",
        name: "Mtaani Butchery & Fresh Market",
        company: "Mtaani Fresh Supplies",
        phone: "0724 550 112",
        national_id: "29481023",
        category: "Foodstuff & Proteins",
        total_orders_cost: 4200,
        last_delivery_date: todayIso,
        payment_preference: "MPESA_TILL" as const,
        till_or_account: "Pochi / 0724 550 112",
        supplied_items: ["Beef, Unga, Tomatoes, Onions, Sukuma"]
      },
      {
        id: "eat_sup_2",
        name: "Wakulima Fresh Produce",
        company: "Wakulima Depot",
        phone: "0733 219 408",
        national_id: "31209445",
        category: "Grains & Viungo",
        total_orders_cost: 2850,
        last_delivery_date: todayIso,
        payment_preference: "CASH_DRAWER" as const,
        supplied_items: ["Pishori Rice, Beans, Pilau Masala, Cooking Oil"]
      }
    ];

    const kpis = calculateKpis(eateryInventory, []);

    return {
      ...cloned,
      merchant_name: "Mtaani Eats & Kiosk",
      proprietor_name: "Guest Preview",
      client_type: "Open Eatery & Roadside Kiosk (Live Sandbox)",
      tier: "FREE_STARTER",
      inventory: eateryInventory,
      warehouse: [],
      customers: eateryCustomers,
      suppliers: eaterySuppliers,
      salesLedger: eaterySales,
      payouts: eateryPayouts,
      restockCards: [],
      supplierBatchCards: [],
      paymentChannels: [
        {
          id: "ch_cash",
          label: "Cash Portfolio",
          shortCode: "CSH",
          category: "CASH",
          subType: "CASH_DRAWER",
          balance: 8450,
          enabled: true
        },
        {
          id: "ch_pochi",
          label: "Pochi la Biashara (Mobile Money)",
          shortCode: "PCH",
          category: "MOBILE_MONEY",
          subType: "POCHI_LA_BIASHARA",
          accountRef: "07XX XXX 421",
          balance: 14920,
          enabled: true
        },
        {
          id: "ch_send",
          label: "M-Pesa Send Money / Till",
          shortCode: "MP",
          category: "MOBILE_MONEY",
          subType: "SEND_MONEY",
          balance: 3200,
          enabled: true
        }
      ],
      cash_register_balance: 8450,
      mpesa_float_balance: 18120,
      equitel_account_balance: 0,
      vcr_daily_count: 19,
      vcr_customer_consent: true,
      clean_trading_days: 12,
      kpis,
      last_updated: new Date().toISOString()
    };
  }

  // Default "duka" preset
  return {
    ...cloned,
    merchant_name: "Duka Space",
    proprietor_name: "Guest Preview",
    client_type: "Retail FMCG & Neighborhood Duka (Live Sandbox)",
    tier: "FREE_STARTER",
    cash_register_balance: 14200,
    mpesa_float_balance: 28300,
    equitel_account_balance: 5000,
    vcr_daily_count: 14,
    vcr_customer_consent: true,
    clean_trading_days: 18,
    last_updated: new Date().toISOString()
  };
}

/**
 * Load isolated demo sandbox state for the given preset.
 * Resets automatically if sandbox is older than 24 hours.
 */
export function loadDemoSandboxState(preset: DemoPreset = getActiveDemoPreset()): AlacioMasterState {
  const storageKey = `${DEMO_STORAGE_KEY_PREFIX}${preset}`;
  const metaKey = `${DEMO_META_KEY_PREFIX}${preset}`;

  try {
    const metaRaw = localStorage.getItem(metaKey);
    const now = Date.now();

    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      if (meta.createdAt && now - meta.createdAt > TWENTY_FOUR_HOURS_MS) {
        return resetDemoSandbox(preset);
      }
    }

    const dataRaw = localStorage.getItem(storageKey);
    if (!dataRaw) {
      const fresh = createFreshDemoState(preset);
      saveDemoSandboxState(fresh, preset);
      return fresh;
    }

    const parsed = JSON.parse(dataRaw);
    const freshBase = createFreshDemoState(preset);
    return {
      ...freshBase,
      ...parsed,
      merchant_name: freshBase.merchant_name
    };
  } catch (err) {
    console.warn("Error loading demo sandbox state, resetting:", err);
    return resetDemoSandbox(preset);
  }
}

/**
 * Save state changes to the isolated demo sandbox.
 * Never touches real workspace data or production storage keys.
 */
export function saveDemoSandboxState(state: AlacioMasterState, preset: DemoPreset = getActiveDemoPreset()): void {
  const storageKey = `${DEMO_STORAGE_KEY_PREFIX}${preset}`;
  const metaKey = `${DEMO_META_KEY_PREFIX}${preset}`;

  try {
    const expectedName = preset === "eatery" ? "Mtaani Eats & Kiosk" : "Duka Space";
    const sanitized = {
      ...state,
      merchant_name: expectedName
    };
    localStorage.setItem(storageKey, JSON.stringify(sanitized));

    const metaRaw = localStorage.getItem(metaKey);
    if (!metaRaw) {
      localStorage.setItem(metaKey, JSON.stringify({ createdAt: Date.now() }));
    }
  } catch (err) {
    console.error("Failed to save demo sandbox state:", err);
  }
}

/**
 * Completely resets and wipes the demo sandbox back to fresh initial state.
 */
export function resetDemoSandbox(preset: DemoPreset = getActiveDemoPreset()): AlacioMasterState {
  const storageKey = `${DEMO_STORAGE_KEY_PREFIX}${preset}`;
  const metaKey = `${DEMO_META_KEY_PREFIX}${preset}`;

  try {
    localStorage.removeItem(storageKey);
    localStorage.setItem(metaKey, JSON.stringify({ createdAt: Date.now() }));
  } catch (err) {
    console.warn("Error resetting demo sandbox:", err);
  }
  return createFreshDemoState(preset);
}
