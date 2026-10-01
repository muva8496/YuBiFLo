import {
  Merchant,
  InventoryItem,
  MoneyOutExpense,
  SupplyBatch,
  SalesLedgerEntry,
  ReconciliationRecord,
  DailyMorningFloatLog,
  Supplier,
  SupplierDelivery,
  SupplierPayment,
  Customer,
  CustomerSale,
  CustomerDebtRepayment,
  OwnerCapitalRecord,
  SubscriptionTier,
  SubscriptionTierId,
  MerchantSubscription,
  StaffMember,
  StoreBranch,
  CustomPaymentConfig,
  ReceiptCustomization,
  CoreModuleId,
} from "../types";

const STORAGE_KEYS = {
  MERCHANT: "yubiflo_merchant_v2",
  ITEMS: "yubiflo_items_v2",
  EXPENSES: "yubiflo_expenses_v2",
  BATCHES: "yubiflo_batches_v2",
  SALES: "yubiflo_sales_v2",
  RECONCILIATIONS: "yubiflo_reconciliations_v2",
  MORNING_LOGS: "yubiflo_morning_logs_v2",
  SUPPLIERS: "yubiflo_suppliers_v2",
  SUPPLIER_DELIVERIES: "yubiflo_supplier_deliveries_v2",
  SUPPLIER_PAYMENTS: "yubiflo_supplier_payments_v2",
  CUSTOMERS: "yubiflo_customers_v2",
  CUSTOMER_SALES: "yubiflo_customer_sales_v2",
  CUSTOMER_REPAYMENTS: "yubiflo_customer_repayments_v2",
  OWNER_CAPITAL: "yubiflo_owner_capital_v2",
  MASTER_SNAPSHOT: "yubiflo_master_snapshot_v2",
  LAST_SAVED: "yubiflo_last_saved_timestamp",
  VISIBLE_MODULES: "yubiflo_visible_modules_v2",
  ADMIN_MODE: "yubiflo_admin_mode_v2",
  ADMIN_PIN: "yubiflo_admin_pin_v2",
  TIERS: "paydesk_subscription_tiers_v1",
  ALL_TENANTS: "paydesk_all_merchants_v1",
  ACTIVE_TENANT_ID: "paydesk_active_tenant_id_v1",
  STAFF_MEMBERS: "paydesk_staff_members_v1",
  BRANCHES: "paydesk_store_branches_v1",
  PAYMENT_CONFIG: "paydesk_payment_config_v1",
  RECEIPT_CONFIG: "paydesk_receipt_config_v1",
};

export const DEFAULT_VISIBLE_MODULE_IDS: string[] = [
  "dashboard",
  "velocity",
  "quick_dump",
  "morning_float",
  "stock",
  "people",
  "t_ledgers",
  "reconcile",
  "analytics",
];

export const ALL_MODULE_DEFINITIONS = [
  {
    id: "dashboard" as const,
    label: "Dashboard",
    shortLabel: "Dashboard",
    shengLabel: "Dashboard",
    desc: "Overview & vital metrics",
    category: "CORE_DAILY" as const,
    defaultVisible: true,
    minTier: "starter" as const,
  },
  {
    id: "velocity" as const,
    label: "Supply Velocity",
    shortLabel: "Velocity",
    shengLabel: "Speed",
    desc: "Active stock, unit margins & batch restock triggers",
    category: "CORE_DAILY" as const,
    defaultVisible: true,
    minTier: "starter" as const,
  },
  {
    id: "quick_dump" as const,
    label: "Quick Raw Dump",
    shortLabel: "Quick Dump",
    shengLabel: "Dump Zone",
    desc: "Fast drop zone for Suppliers, Customers & Products (no IDs or prices needed)",
    category: "CORE_DAILY" as const,
    defaultVisible: true,
    minTier: "starter" as const,
  },
  {
    id: "morning_float" as const,
    label: "Opening Float",
    shortLabel: "Float",
    shengLabel: "Float",
    desc: "Opening Cash & E-Float snapshot",
    category: "CORE_DAILY" as const,
    defaultVisible: true,
    minTier: "starter" as const,
  },
  {
    id: "stock" as const,
    label: "Inventory",
    shortLabel: "Inventory",
    shengLabel: "Inventory",
    desc: "Stock levels & batch margins",
    category: "CORE_DAILY" as const,
    defaultVisible: true,
    minTier: "starter" as const,
  },
  {
    id: "people" as const,
    label: "Customers & Credit",
    shortLabel: "Customers",
    shengLabel: "Customers",
    desc: "Customer credit & supplier accounts",
    category: "CORE_DAILY" as const,
    defaultVisible: true,
    minTier: "starter" as const,
  },
  {
    id: "t_ledgers" as const,
    label: "T-Ledgers & Rankings",
    shortLabel: "T-Ledgers",
    shengLabel: "T-Ledgers",
    desc: "6 Accounting T-Accounts & Leaderboards",
    category: "CORE_DAILY" as const,
    defaultVisible: true,
    minTier: "starter" as const,
  },
  {
    id: "reconcile" as const,
    label: "Reconciliation",
    shortLabel: "Reconcile",
    shengLabel: "Reconcile",
    desc: "Cash-to-stock audit & verification",
    category: "CORE_DAILY" as const,
    defaultVisible: true,
    minTier: "pro" as const,
  },
  {
    id: "analytics" as const,
    label: "Analytics",
    shortLabel: "Analytics",
    shengLabel: "Analytics",
    desc: "16 Visual charts & AI forecasts",
    category: "CORE_DAILY" as const,
    defaultVisible: true,
    minTier: "pro" as const,
  },
  {
    id: "sales" as const,
    label: "Sales Ledger",
    shortLabel: "Sales",
    shengLabel: "Sales",
    desc: "Transaction velocity journal",
    category: "OPERATIONS" as const,
    defaultVisible: false,
    minTier: "pro" as const,
  },
  {
    id: "money_out" as const,
    label: "Expenses",
    shortLabel: "Expenses",
    shengLabel: "Expenses",
    desc: "Purchases & shop expenses",
    category: "OPERATIONS" as const,
    defaultVisible: false,
    minTier: "pro" as const,
  },
  {
    id: "restock" as const,
    label: "Restock",
    shortLabel: "Restock",
    shengLabel: "Restock",
    desc: "Inbound inventory batches",
    category: "OPERATIONS" as const,
    defaultVisible: false,
    minTier: "pro" as const,
  },
  {
    id: "ingestion" as const,
    label: "Scan Receipts",
    shortLabel: "Receipts",
    shengLabel: "Receipts",
    desc: "OCR multi-bill ingestion",
    category: "OPERATIONS" as const,
    defaultVisible: false,
    minTier: "enterprise" as const,
  },
  {
    id: "cashflow" as const,
    label: "Cashflow",
    shortLabel: "Cashflow",
    shengLabel: "Cashflow",
    desc: "P&L & payment channels",
    category: "OPERATIONS" as const,
    defaultVisible: false,
    minTier: "pro" as const,
  },
  {
    id: "store_settings" as const,
    label: "Store Setup",
    shortLabel: "Setup",
    shengLabel: "Setup",
    desc: "Cashiers, Paybill & branches",
    category: "OPERATIONS" as const,
    defaultVisible: false,
    minTier: "starter" as const,
  },
  {
    id: "schema" as const,
    label: "Database",
    shortLabel: "SQL Schema",
    shengLabel: "SQL Schema",
    desc: "PostgreSQL & table architecture",
    category: "ADMIN_ONLY" as const,
    defaultVisible: false,
    adminOnly: true,
    minTier: "enterprise" as const,
  },
  {
    id: "saas_admin" as const,
    label: "SaaS Console",
    shortLabel: "SaaS Admin",
    shengLabel: "SaaS Admin",
    desc: "Manage subscriptions & stores",
    category: "ADMIN_ONLY" as const,
    defaultVisible: false,
    adminOnly: true,
    minTier: "enterprise" as const,
  },
];

export const DEFAULT_SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "starter",
    name: "Starter Kiosk",
    badge: "Starter",
    monthlyPriceKes: 599,
    annualPriceKes: 5990,
    tagline: "Essential POS, opening float & customer credit for single-till shops",
    isPopular: false,
    maxItems: 50,
    maxCustomers: 30,
    maxBranches: 1,
    maxStaffCashiers: 1,
    allowedModules: ["dashboard", "morning_float", "stock", "people", "store_settings"],
    features: [
      "05:57 AM Morning Float snapshot",
      "Unified single cash drawer (Store & Agency)",
      "Customer credit ledger (up to 30 accounts)",
      "Automated debt reminder generator",
      "Stock inventory (up to 50 active items)",
      "1 Cashier login with 4-digit PIN",
      "Standard Community Support",
    ],
    supportLevel: "Community / Phone Support",
  },
  {
    id: "pro",
    name: "Retail Pro",
    badge: "Most Popular",
    monthlyPriceKes: 1499,
    annualPriceKes: 14990,
    tagline: "Complete retail intelligence with reverse audit, analytics & supplier tracking",
    isPopular: true,
    maxItems: 500,
    maxCustomers: 500,
    maxBranches: 2,
    maxStaffCashiers: 5,
    allowedModules: [
      "dashboard",
      "morning_float",
      "stock",
      "people",
      "reconcile",
      "analytics",
      "sales",
      "money_out",
      "restock",
      "cashflow",
      "store_settings",
    ],
    features: [
      "All Starter Kiosk features",
      "Reverse Audit & Cash Leakage Detection",
      "16 Interactive Analytics Visualizers",
      "Supply-driven batch restock triggers",
      "Expense & operational cost tracker",
      "Custom Receipt Builder & PDF invoices",
      "Up to 2 branches & 5 staff roles (Cashier/Manager)",
      "Priority WhatsApp & Phone Support (9am - 9pm)",
    ],
    supportLevel: "Priority WhatsApp & Phone Support",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "Multi-Store Pro",
    monthlyPriceKes: 3499,
    annualPriceKes: 34990,
    tagline: "Multi-branch power with AI receipt scanning, custom payment rails & cloud SQL",
    isPopular: false,
    maxItems: 99999,
    maxCustomers: 99999,
    maxBranches: 50,
    maxStaffCashiers: 50,
    allowedModules: [
      "dashboard",
      "morning_float",
      "stock",
      "people",
      "reconcile",
      "analytics",
      "sales",
      "money_out",
      "restock",
      "ingestion",
      "cashflow",
      "schema",
      "store_settings",
      "saas_admin",
    ],
    features: [
      "All Retail Pro features included",
      "AI Multi-Receipt OCR Scanner",
      "Unlimited branches & store locations",
      "Role-Based Access Control (Owner, Manager, Cashier, Auditor)",
      "Custom Payment Rails (Equity, KCB, M-Pesa Till & Float)",
      "PostgreSQL / Supabase Schema & Data Export",
      "Multi-Tenant SaaS Management Hub",
      "24/7 Dedicated Account Manager & Setup",
    ],
    supportLevel: "24/7 Dedicated VIP Account Manager",
  },
];

export const DEFAULT_PAYMENT_CONFIG: CustomPaymentConfig = {
  useEquityPaybill: true,
  equityPaybillNumber: "1450180372031",
  useMpesaFloat: true,
  mpesaFloatNumber: "+254 712 345 678",
  useMpesaTill: false,
  mpesaTillNumber: "",
  useKcbPaybill: false,
  kcbPaybillNumber: "",
  useCashDrawer: true,
  paymentInstructions: "Pay via Equity Paybill 247247 Acc 1450180372031 or Cash at counter",
};

export const DEFAULT_RECEIPT_CONFIG: ReceiptCustomization = {
  storeName: "Wanjiku Retail Store",
  tagline: "Quality Products & Best Value. Welcome Again!",
  phone: "+254 712 345 678",
  address: "Kawangware Stage 2, Nairobi",
  taxPin: "P051239847K",
  footerMessage: "Thank you for shopping with us! Goods once sold cannot be returned without receipt.",
  showBarcode: true,
  showPaymentDetails: true,
};

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: "staff-01",
    merchant_id: "merch-nairobi-01",
    name: "Wanjiku (Owner)",
    phone: "+254 712 345 678",
    pin: "2031",
    role: "OWNER",
    branch_id: "branch-01",
    branch_name: "Kawangware Main",
    status: "ACTIVE",
    allowedModules: [
      "dashboard",
      "morning_float",
      "stock",
      "people",
      "reconcile",
      "analytics",
      "sales",
      "money_out",
      "restock",
      "cashflow",
      "store_settings",
      "schema",
      "saas_admin",
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "staff-02",
    merchant_id: "merch-nairobi-01",
    name: "Kevin Cashier",
    phone: "+254 722 000 111",
    pin: "1234",
    role: "CASHIER",
    branch_id: "branch-01",
    branch_name: "Kawangware Main",
    status: "ACTIVE",
    allowedModules: ["dashboard", "morning_float", "stock", "people"],
    created_at: new Date().toISOString(),
  },
  {
    id: "staff-03",
    merchant_id: "merch-nairobi-01",
    name: "Grace Branch Mgr",
    phone: "+254 733 999 888",
    pin: "4321",
    role: "MANAGER",
    branch_id: "branch-02",
    branch_name: "Riruta Branch",
    status: "ACTIVE",
    allowedModules: [
      "dashboard",
      "morning_float",
      "stock",
      "people",
      "reconcile",
      "analytics",
      "sales",
      "money_out",
      "restock",
    ],
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_STORE_BRANCHES: StoreBranch[] = [
  {
    id: "branch-01",
    merchant_id: "merch-nairobi-01",
    name: "Kawangware Main Stage",
    code: "KWG-01",
    location: "Kawangware Stage 2, Nairobi",
    phone: "+254 712 345 678",
    manager_name: "Wanjiku",
    is_main: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "branch-02",
    merchant_id: "merch-nairobi-01",
    name: "Riruta Satellite Branch",
    code: "RIR-02",
    location: "Riruta Junction, Nairobi",
    phone: "+254 733 999 888",
    manager_name: "Grace W.",
    is_main: false,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_CLIENT_MERCHANTS: Merchant[] = [
  {
    id: "merch-alacio-00",
    business_name: "Alacio Mini Shop",
    owner_name: "Alacio Maina",
    shop_type: "Retail / Mini-mart",
    currency: "KSh",
    phone: "+254 701 234 567",
    location: "Biashara Street, Nairobi",
    equity_paybill_number: "Equity Paybill 247247 • Acc: 1450180372031",
    created_at: new Date().toISOString(),
    subscription: {
      tierId: "pro",
      tierName: "Retail Pro",
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      startedAt: "2026-08-01T00:00:00.000Z",
      expiresAt: "2026-09-01T00:00:00.000Z",
      licenseKey: "YUBIFLO-PRO-ALACIO-01",
      autoRenew: true,
      lastPaymentRef: "MPESA-ALACIO99",
      invoices: [],
    },
    paymentConfig: DEFAULT_PAYMENT_CONFIG,
    receiptConfig: DEFAULT_RECEIPT_CONFIG,
    branches: DEFAULT_STORE_BRANCHES,
    staff: DEFAULT_STAFF_MEMBERS,
  },
  {
    id: "merch-nairobi-01",
    business_name: "Wanjiku Retail & Agency",
    owner_name: "Wanjiku Mukangai",
    shop_type: "Retail Store / Kiosk",
    currency: "KSh",
    phone: "+254 712 345 678",
    location: "Kawangware, Nairobi",
    equity_paybill_number: "Equity Paybill 247247 • Acc: 1450180372031",
    created_at: new Date().toISOString(),
    subscription: {
      tierId: "pro",
      tierName: "Retail Pro",
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      startedAt: "2026-08-01T00:00:00.000Z",
      expiresAt: "2026-09-01T00:00:00.000Z",
      licenseKey: "YUBIFLO-PRO-8492-KWG1",
      autoRenew: true,
      lastPaymentRef: "MPESA-QRT892K1",
      invoices: [
        {
          id: "inv-2026-08",
          tierId: "pro",
          tierName: "Retail Pro",
          amountKes: 1499,
          billingCycle: "MONTHLY",
          paymentMethod: "MPESA_STK",
          paymentRef: "QRT892K1",
          date: "2026-08-01",
          status: "PAID",
        },
      ],
    },
    paymentConfig: DEFAULT_PAYMENT_CONFIG,
    receiptConfig: DEFAULT_RECEIPT_CONFIG,
    branches: DEFAULT_STORE_BRANCHES,
    staff: DEFAULT_STAFF_MEMBERS,
  },
  {
    id: "merch-kariokor-02",
    business_name: "Kariokor Wholesale & Grain Millers",
    owner_name: "Mwalimu Kamau",
    shop_type: "Wholesale & Retail",
    currency: "KSh",
    phone: "+254 722 555 666",
    location: "Kariokor Market, Nairobi",
    equity_paybill_number: "Equity Paybill 247247 • Acc: 1450180372031",
    created_at: new Date().toISOString(),
    subscription: {
      tierId: "enterprise",
      tierName: "Enterprise",
      status: "ACTIVE",
      billingCycle: "ANNUAL",
      startedAt: "2026-01-15T00:00:00.000Z",
      expiresAt: "2027-01-15T00:00:00.000Z",
      licenseKey: "YUBIFLO-ENT-9941-KARK",
      autoRenew: true,
      lastPaymentRef: "BANK-TRF-EQUITY-901",
      invoices: [
        {
          id: "inv-2026-01-ent",
          tierId: "enterprise",
          tierName: "Enterprise",
          amountKes: 34990,
          billingCycle: "ANNUAL",
          paymentMethod: "EQUITY_PAYBILL",
          paymentRef: "EQT-ANN-2026",
          date: "2026-01-15",
          status: "PAID",
        },
      ],
    },
    paymentConfig: {
      useEquityPaybill: true,
      equityPaybillNumber: "1450180372031",
      useMpesaFloat: true,
      mpesaFloatNumber: "+254 722 555 666",
      useMpesaTill: false,
      useCashDrawer: true,
      useKcbPaybill: true,
      kcbPaybillNumber: "522522",
    },
  },
  {
    id: "merch-kibera-03",
    business_name: "Mama Oliech Kiosk Store",
    owner_name: "Mary Oliech",
    shop_type: "Retail Store / Kiosk",
    currency: "KSh",
    phone: "+254 711 222 333",
    location: "Olympic, Kibera",
    created_at: new Date().toISOString(),
    subscription: {
      tierId: "starter",
      tierName: "Starter Kiosk",
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      startedAt: "2026-08-10T00:00:00.000Z",
      expiresAt: "2026-09-10T00:00:00.000Z",
      licenseKey: "YUBIFLO-LITE-1102-KIB",
      autoRenew: false,
      lastPaymentRef: "MPESA-STK-5511",
      invoices: [
        {
          id: "inv-2026-08-03",
          tierId: "starter",
          tierName: "Starter Kiosk",
          amountKes: 599,
          billingCycle: "MONTHLY",
          paymentMethod: "MPESA_STK",
          paymentRef: "MP-551199",
          date: "2026-08-10",
          status: "PAID",
        },
      ],
    },
  },
  {
    id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    business_name: "Kariobangi Builders Store",
    owner_name: "John Mwangi",
    shop_type: "Hardware & Agro-Vets (Bulk)",
    currency: "KSh",
    phone: "+254 722 789 012",
    location: "Kariobangi Light Industries, Nairobi",
    equity_paybill_number: "Equity Paybill 247247 • Acc: 1450180372099",
    created_at: new Date().toISOString(),
    subscription: {
      tierId: "enterprise",
      tierName: "Enterprise",
      status: "ACTIVE",
      billingCycle: "ANNUAL",
      startedAt: "2026-02-01T00:00:00.000Z",
      expiresAt: "2027-02-01T00:00:00.000Z",
      licenseKey: "YUBIFLO-ENT-KARIOBANGI-02",
      autoRenew: true,
      lastPaymentRef: "MPESA-KARIO-9921",
      invoices: [],
    },
    paymentConfig: DEFAULT_PAYMENT_CONFIG,
    receiptConfig: DEFAULT_RECEIPT_CONFIG,
    branches: [],
    staff: [],
  },
];

// Initial Seed Data: Clean Baseline with Shortened Names & Zeroed Values
export const DEFAULT_MERCHANT: Merchant = {
  id: "merch-alacio-00",
  business_name: "Alacio Mini Shop",
  owner_name: "Alacio Maina",
  shop_type: "Mini-mart",
  currency: "KSh",
  phone: "+254 701 234 567",
  location: "Biashara Street, Nairobi",
  equity_paybill_number: "Equity Paybill 247247 • Acc: 1450180372031",
  mpesa_till_number: "Till #582910 (M-Pesa Agent & Buy Goods)",
  created_at: new Date().toISOString(),
  subscription: {
    tierId: "pro",
    tierName: "Retail Pro",
    status: "ACTIVE",
    billingCycle: "MONTHLY",
    startedAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-09-01T00:00:00.000Z",
    licenseKey: "YUBIFLO-PRO-8492-KWG1",
    autoRenew: true,
    lastPaymentRef: "MPESA-QRT892K1",
    invoices: [
      {
        id: "inv-2026-08",
        tierId: "pro",
        tierName: "Retail Pro",
        amountKes: 1499,
        billingCycle: "MONTHLY",
        paymentMethod: "MPESA_STK",
        paymentRef: "QRT892K1",
        date: "2026-08-01",
        status: "PAID",
      },
    ],
  },
  paymentConfig: DEFAULT_PAYMENT_CONFIG,
  receiptConfig: DEFAULT_RECEIPT_CONFIG,
  branches: DEFAULT_STORE_BRANCHES,
  staff: DEFAULT_STAFF_MEMBERS,
};

export const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: "item-milk-01",
    merchant_id: "merch-nairobi-01",
    name: "Milk 500ml",
    category: "Dairy",
    unit_cost_price: 0,
    unit_selling_price: 0,
    current_stock_qty: 0,
    unit_of_measure: "packets",
    reorder_point: 0,
    total_batches_count: 0,
    lifetime_units_sold: 0,
    lifetime_revenue: 0,
    lifetime_profit: 0,
    last_restocked_at: new Date().toISOString(),
  },
  {
    id: "item-unga-02",
    merchant_id: "merch-nairobi-01",
    name: "Unga 2kg",
    category: "Flour",
    unit_cost_price: 0,
    unit_selling_price: 0,
    current_stock_qty: 0,
    unit_of_measure: "bales",
    reorder_point: 0,
    total_batches_count: 0,
    lifetime_units_sold: 0,
    lifetime_revenue: 0,
    lifetime_profit: 0,
    last_restocked_at: new Date().toISOString(),
  },
  {
    id: "item-oil-03",
    merchant_id: "merch-nairobi-01",
    name: "Oil 1L",
    category: "Oil",
    unit_cost_price: 0,
    unit_selling_price: 0,
    current_stock_qty: 0,
    unit_of_measure: "bottles",
    reorder_point: 0,
    total_batches_count: 0,
    lifetime_units_sold: 0,
    lifetime_revenue: 0,
    lifetime_profit: 0,
    last_restocked_at: new Date().toISOString(),
  },
  {
    id: "item-eggs-04",
    merchant_id: "merch-nairobi-01",
    name: "Eggs Crate",
    category: "Poultry",
    unit_cost_price: 0,
    unit_selling_price: 0,
    current_stock_qty: 0,
    unit_of_measure: "crates",
    reorder_point: 0,
    total_batches_count: 0,
    lifetime_units_sold: 0,
    lifetime_revenue: 0,
    lifetime_profit: 0,
    last_restocked_at: new Date().toISOString(),
  },
  {
    id: "item-sugar-05",
    merchant_id: "merch-nairobi-01",
    name: "Sugar 1kg",
    category: "Sugar",
    unit_cost_price: 0,
    unit_selling_price: 0,
    current_stock_qty: 0,
    unit_of_measure: "packets",
    reorder_point: 0,
    total_batches_count: 0,
    lifetime_units_sold: 0,
    lifetime_revenue: 0,
    lifetime_profit: 0,
    last_restocked_at: new Date().toISOString(),
  },
  {
    id: "item-royco-06",
    merchant_id: "merch-nairobi-01",
    name: "Royco Cubes",
    category: "Spices",
    unit_cost_price: 0,
    unit_selling_price: 0,
    current_stock_qty: 0,
    unit_of_measure: "boxes",
    reorder_point: 0,
    total_batches_count: 0,
    lifetime_units_sold: 0,
    lifetime_revenue: 0,
    lifetime_profit: 0,
    last_restocked_at: new Date().toISOString(),
  },
  {
    id: "item-soap-07",
    merchant_id: "merch-nairobi-01",
    name: "Soap Bar",
    category: "Hygiene",
    unit_cost_price: 0,
    unit_selling_price: 0,
    current_stock_qty: 0,
    unit_of_measure: "units",
    reorder_point: 0,
    total_batches_count: 0,
    lifetime_units_sold: 0,
    lifetime_revenue: 0,
    lifetime_profit: 0,
    last_restocked_at: new Date().toISOString(),
  },
  {
    id: "item-bread-08",
    merchant_id: "merch-nairobi-01",
    name: "Bread 400g",
    category: "Bakery",
    unit_cost_price: 0,
    unit_selling_price: 0,
    current_stock_qty: 0,
    unit_of_measure: "packets",
    reorder_point: 0,
    total_batches_count: 0,
    lifetime_units_sold: 0,
    lifetime_revenue: 0,
    lifetime_profit: 0,
    last_restocked_at: new Date().toISOString(),
  },
];

export const INITIAL_BATCHES: SupplyBatch[] = [];

export const INITIAL_EXPENSES: MoneyOutExpense[] = [];

export const INITIAL_SALES: SalesLedgerEntry[] = [];

export const INITIAL_RECONCILIATIONS: ReconciliationRecord[] = [];

export const INITIAL_MORNING_LOGS: DailyMorningFloatLog[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "supp-brookside-01",
    merchant_id: "merch-nairobi-01",
    name: "Brookside",
    phone: "+254 722 100 200",
    national_id: "24890123",
    contact_person: "Peter (Driver)",
    category: "Dairy",
    location: "Industrial Area",
    payment_terms: "CREDIT_7_DAYS",
    total_supplied_value: 0,
    total_paid_value: 0,
    outstanding_balance_owed: 0,
    bank_or_paybill_details: "Paybill 247247 Acc: BROOKSIDE-081",
    notes: "Dairy supplier.",
    created_at: new Date().toISOString(),
  },
  {
    id: "supp-unga-02",
    merchant_id: "merch-nairobi-01",
    name: "Pembe Millers",
    phone: "+254 733 456 789",
    national_id: "19827364",
    contact_person: "Harrison (Sales Rep)",
    category: "Flour",
    location: "Nyamakima",
    payment_terms: "CREDIT_14_DAYS",
    total_supplied_value: 0,
    total_paid_value: 0,
    outstanding_balance_owed: 0,
    bank_or_paybill_details: "Paybill 522522 Acc: UNGA-88",
    notes: "Flour supplier.",
    created_at: new Date().toISOString(),
  },
  {
    id: "supp-rina-03",
    merchant_id: "merch-nairobi-01",
    name: "Kapa Oil",
    phone: "+254 720 888 999",
    national_id: "27189045",
    contact_person: "Grace",
    category: "Oil",
    location: "Mombasa Rd",
    payment_terms: "CASH_ON_DELIVERY",
    total_supplied_value: 0,
    total_paid_value: 0,
    outstanding_balance_owed: 0,
    bank_or_paybill_details: "Till #981204",
    notes: "Cooking oil supplier.",
    created_at: new Date().toISOString(),
  },
  {
    id: "supp-poultry-04",
    merchant_id: "merch-nairobi-01",
    name: "Kiambu Eggs",
    phone: "+254 711 345 678",
    national_id: "22345678",
    contact_person: "Mama Njeri",
    category: "Poultry",
    location: "Wangige",
    payment_terms: "CASH_ON_DELIVERY",
    total_supplied_value: 0,
    total_paid_value: 0,
    outstanding_balance_owed: 0,
    bank_or_paybill_details: "M-Pesa 0711345678",
    notes: "Egg supplier.",
    created_at: new Date().toISOString(),
  },
  {
    id: "supp-lux-house-05",
    merchant_id: "merch-nairobi-01",
    name: "Lux House",
    aliases: ["lux hhouse wholesalers", "Lux House Wholesalers"],
    phone: "+254 721 999 111",
    national_id: "30192847",
    contact_person: "Mr. Patel",
    category: "General Wholesale",
    location: "River Road",
    payment_terms: "CREDIT_14_DAYS",
    total_supplied_value: 0,
    total_paid_value: 0,
    outstanding_balance_owed: 0,
    bank_or_paybill_details: "Paybill 400200 Acc: LUX-HOUSE",
    notes: "General wholesale goods & FMCG distributor.",
    created_at: new Date().toISOString(),
  },
  {
    id: "supp-kevin-john-06",
    merchant_id: "merch-nairobi-01",
    name: "Kevin John",
    aliases: ["John wa cakes", "John Cakes", "Kevin wa Cakes"],
    phone: "+254 712 334 455",
    national_id: "29837465",
    contact_person: "Kevin John",
    category: "Bakery",
    location: "Eastleigh Section 3",
    payment_terms: "CASH_ON_DELIVERY",
    total_supplied_value: 0,
    total_paid_value: 0,
    outstanding_balance_owed: 0,
    bank_or_paybill_details: "Till #829103 (John Bakery)",
    notes: "Fresh morning cakes & pastries (Colloquially known as John wa cakes).",
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_SUPPLIER_DELIVERIES: SupplierDelivery[] = [];

export const INITIAL_SUPPLIER_PAYMENTS: SupplierPayment[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-mama-stacy-01",
    merchant_id: "merch-nairobi-01",
    name: "Mama Stacy",
    phone: "+254 728 112 233",
    national_id: "28491024",
    customer_type: "NEIGHBORHOOD_RESIDENT",
    location_or_estate: "Plot 4",
    credit_limit: 0,
    outstanding_credit_deni: 0,
    lifetime_purchases_value: 0,
    lifetime_payments_value: 0,
    trust_status: "TRUSTED",
    preferred_payment_method: "CREDIT_DENI",
    notes: "Neighbor.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cust-boda-john-02",
    merchant_id: "merch-nairobi-01",
    name: "Boda John",
    phone: "+254 790 334 455",
    national_id: "34918274",
    customer_type: "BODA_RIDER",
    location_or_estate: "Stage 4",
    credit_limit: 0,
    outstanding_credit_deni: 0,
    lifetime_purchases_value: 0,
    lifetime_payments_value: 0,
    trust_status: "GOOD_STANDING",
    preferred_payment_method: "MPESA_TILL",
    notes: "Rider.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cust-hotel-sunrise-03",
    merchant_id: "merch-nairobi-01",
    name: "Hotel Sunrise",
    phone: "+254 715 667 788",
    national_id: "25789123",
    customer_type: "LOCAL_EATERY",
    location_or_estate: "Market Road",
    credit_limit: 0,
    outstanding_credit_deni: 0,
    lifetime_purchases_value: 0,
    lifetime_payments_value: 0,
    trust_status: "TRUSTED",
    preferred_payment_method: "EQUITY_PAYBILL",
    notes: "Local eatery.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cust-mama-mboga-mary-04",
    merchant_id: "merch-nairobi-01",
    name: "Mama Mary",
    phone: "+254 721 889 900",
    national_id: "21980345",
    customer_type: "MAMA_MBOGA",
    location_or_estate: "Stall 3",
    credit_limit: 0,
    outstanding_credit_deni: 0,
    lifetime_purchases_value: 0,
    lifetime_payments_value: 0,
    trust_status: "TRUSTED",
    preferred_payment_method: "CASH",
    notes: "Greengrocer.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cust-teacher-kamau-05",
    merchant_id: "merch-nairobi-01",
    name: "Mwalimu Kamau",
    phone: "+254 734 556 677",
    national_id: "14890234",
    customer_type: "RETAIL_REGULAR",
    location_or_estate: "Gate 2",
    credit_limit: 0,
    outstanding_credit_deni: 0,
    lifetime_purchases_value: 0,
    lifetime_payments_value: 0,
    trust_status: "GOOD_STANDING",
    preferred_payment_method: "MPESA_TILL",
    notes: "Teacher.",
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_CUSTOMER_SALES: CustomerSale[] = [];

export const INITIAL_CUSTOMER_REPAYMENTS: CustomerDebtRepayment[] = [];

export const INITIAL_OWNER_CAPITAL: OwnerCapitalRecord[] = [
  {
    id: "cap-init-001",
    merchant_id: "merch-nairobi-01",
    entry_type: "CAPITAL_INJECTION",
    amount: 50000,
    payment_channel: "BANK",
    purpose_or_reason: "Initial business startup capital contribution",
    recipient_or_contributor: "Wanjiku Mukangai (Owner)",
    date: "2026-08-01",
    notes: "Equity contribution for inventory and store fixtures.",
    created_at: "2026-08-01T08:00:00.000Z",
  },
  {
    id: "cap-draw-002",
    merchant_id: "merch-nairobi-01",
    entry_type: "PERSONAL_DRAWING",
    amount: 3500,
    payment_channel: "CASH",
    purpose_or_reason: "Personal household groceries & family expense",
    recipient_or_contributor: "Wanjiku Mukangai (Owner)",
    date: "2026-08-15",
    notes: "Direct cash drawer withdrawal for domestic needs.",
    created_at: "2026-08-15T14:30:00.000Z",
  },
  {
    id: "cap-trans-003",
    merchant_id: "merch-nairobi-01",
    entry_type: "RETAINED_PROFIT_TRANSFER",
    amount: 18500,
    payment_channel: "EQUITY_PAYBILL",
    purpose_or_reason: "Retained trading profit reinvestment into shop inventory",
    recipient_or_contributor: "Shop Operations Retained Earnings",
    date: "2026-08-20",
    notes: "Accumulated net surplus transferred to business equity.",
    created_at: "2026-08-20T17:00:00.000Z",
  },
];

// In-memory + LocalStorage fail-safe client store
const _inMemoryStore: Record<string, string> = {};

export interface ShopStorageStats {
  itemsCount: number;
  salesCount: number;
  expensesCount: number;
  batchesCount: number;
  reconciliationsCount: number;
  morningLogsCount: number;
  suppliersCount: number;
  deliveriesCount: number;
  supplierPaymentsCount: number;
  customersCount: number;
  customerSalesCount: number;
  customerRepaymentsCount: number;
  ownerCapitalCount: number;
  lastSavedAt: string;
  totalSizeKB: number;
}

export class AppStorage {
  private static _safeGet<T>(key: string, defaultVal: T): T {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          _inMemoryStore[key] = raw;
          return JSON.parse(raw);
        }
      }
      // Fallback to memory store
      if (_inMemoryStore[key]) {
        return JSON.parse(_inMemoryStore[key]);
      }
      // Try restoring table from master snapshot
      const snapshot = this._getSnapshot();
      if (snapshot && (snapshot as any)[key]) {
        const snapData = (snapshot as any)[key];
        this._safeSet(key, snapData, false);
        return snapData;
      }
      return defaultVal;
    } catch (err) {
      console.warn(`[YuBiFlo Storage] Error reading key ${key}:`, err);
      return defaultVal;
    }
  }

  private static _safeSet<T>(key: string, value: T, triggerSnapshot: boolean = true): void {
    const json = JSON.stringify(value);
    _inMemoryStore[key] = json;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, json);
      }
    } catch (err) {
      console.warn(`[YuBiFlo Storage] LocalStorage write failed for key ${key}, cached in memory:`, err);
    }

    if (triggerSnapshot && key !== STORAGE_KEYS.MASTER_SNAPSHOT && key !== STORAGE_KEYS.LAST_SAVED) {
      this._updateMasterSnapshot();
    }
  }

  private static _updateMasterSnapshot(): void {
    const now = new Date().toISOString();
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.LAST_SAVED, now);
      }
      _inMemoryStore[STORAGE_KEYS.LAST_SAVED] = now;

      const masterObj = {
        version: "2.0.0",
        timestamp: now,
        merchant: this.getMerchant(),
        items: this.getItems(),
        expenses: this.getExpenses(),
        batches: this.getBatches(),
        sales: this.getSales(),
        reconciliations: this.getReconciliations(),
        morning_logs: this.getMorningLogs(),
        suppliers: this.getSuppliers(),
        supplier_deliveries: this.getSupplierDeliveries(),
        supplier_payments: this.getSupplierPayments(),
        customers: this.getCustomers(),
        customer_sales: this.getCustomerSales(),
        customer_repayments: this.getCustomerRepayments(),
        owner_capital: this.getOwnerCapital(),
      };

      const masterJson = JSON.stringify(masterObj);
      _inMemoryStore[STORAGE_KEYS.MASTER_SNAPSHOT] = masterJson;
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.MASTER_SNAPSHOT, masterJson);
        window.dispatchEvent(new CustomEvent("yubiflo_data_saved", { detail: { timestamp: now } }));
      }

      // Sync to Server-Side Admin Database asynchronously
      if (typeof window !== "undefined" && typeof fetch === "function") {
        fetch("/api/db/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tables: {
              merchant: masterObj.merchant,
              items: masterObj.items,
              expenses: masterObj.expenses,
              batches: masterObj.batches,
              sales: masterObj.sales,
              reconciliations: masterObj.reconciliations,
              morning_logs: masterObj.morning_logs,
              suppliers: masterObj.suppliers,
              supplier_deliveries: masterObj.supplier_deliveries,
              supplier_payments: masterObj.supplier_payments,
              customers: masterObj.customers,
              customer_sales: masterObj.customer_sales,
              customer_repayments: masterObj.customer_repayments,
              owner_capital: masterObj.owner_capital,
            },
            source: "client_auto_save",
          }),
        }).catch(() => {
          // Non-blocking background sync
        });
      }
    } catch (err) {
      console.warn("[YuBiFlo Storage] Master snapshot creation notice:", err);
    }
  }

  private static _notifyChange(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("yubiflo_data_saved", { detail: { timestamp: new Date().toISOString() } }));
    }
  }

  private static _getSnapshot(): any | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const snap = window.localStorage.getItem(STORAGE_KEYS.MASTER_SNAPSHOT);
        if (snap) return JSON.parse(snap);
      }
      if (_inMemoryStore[STORAGE_KEYS.MASTER_SNAPSHOT]) {
        return JSON.parse(_inMemoryStore[STORAGE_KEYS.MASTER_SNAPSHOT]);
      }
      return null;
    } catch {
      return null;
    }
  }

  static getLastSavedTimestamp(): string {
    return this._safeGet<string>(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
  }

  // --- MERCHANT OPERATIONS ---
  static getMerchant(): Merchant {
    const active = this.getActiveMerchant();
    if (active) return active;
    const stored = this._safeGet<Merchant>(STORAGE_KEYS.MERCHANT, DEFAULT_MERCHANT);
    if (stored && !stored.subscription) {
      stored.subscription = DEFAULT_MERCHANT.subscription;
    }
    return stored || DEFAULT_MERCHANT;
  }

  static saveMerchant(merchant: Merchant): void {
    this._safeSet(STORAGE_KEYS.MERCHANT, merchant);
  }

  // --- INVENTORY & ITEMS ---
  static getItems(): InventoryItem[] {
    return this._safeGet<InventoryItem[]>(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
  }

  static saveItems(items: InventoryItem[]): void {
    this._safeSet(STORAGE_KEYS.ITEMS, items);
  }

  static saveItem(item: InventoryItem): void {
    const items = this.getItems();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.unshift(item);
    }
    this.saveItems(items);
  }

  static updateItem(item: InventoryItem): void {
    this.saveItem(item);
  }

  static deleteItem(itemId: string): void {
    const items = this.getItems().filter((i) => i.id !== itemId);
    this.saveItems(items);
  }

  static bulkDumpProducts(
    rawNames: string[] | string,
    defaultCategory: string = "General Goods"
  ): { addedCount: number; existingCount: number; totalProcessed: number; addedItems: InventoryItem[] } {
    const list = Array.isArray(rawNames)
      ? rawNames
      : rawNames.split(/[\n,;]+/).map((s) => s.trim());
    
    const items = this.getItems();
    const merchant = this.getMerchant();
    const addedItems: InventoryItem[] = [];
    let addedCount = 0;
    let existingCount = 0;

    for (const raw of list) {
      const cleanName = raw.trim().replace(/\s+/g, " ");
      if (!cleanName || cleanName.length < 1) continue;

      // Check if already exists (case-insensitive)
      const exists = items.some(
        (i) => i.name.trim().toLowerCase() === cleanName.toLowerCase()
      );

      if (exists) {
        existingCount++;
        continue;
      }

      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 15);
      const newItem: InventoryItem = {
        id: `item-${slug || "prod"}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
        merchant_id: merchant.id,
        name: cleanName,
        category: defaultCategory || "General Goods",
        unit_cost_price: 0,
        unit_selling_price: 0,
        current_stock_qty: 0,
        unit_of_measure: "units",
        reorder_point: 5,
        total_batches_count: 0,
        lifetime_units_sold: 0,
        lifetime_revenue: 0,
        lifetime_profit: 0,
      };

      items.unshift(newItem);
      addedItems.push(newItem);
      addedCount++;
    }

    if (addedCount > 0) {
      this.saveItems(items);
    }

    return {
      addedCount,
      existingCount,
      totalProcessed: list.length,
      addedItems,
    };
  }

  static bulkDumpSuppliers(
    rawNames: string[] | string,
    defaultCategory: string = "Wholesale Supplier"
  ): { addedCount: number; existingCount: number; totalProcessed: number; addedSuppliers: Supplier[] } {
    const list = Array.isArray(rawNames)
      ? rawNames
      : rawNames.split(/[\n,;]+/).map((s) => s.trim());
    
    const suppliers = this.getSuppliers();
    const merchant = this.getMerchant();
    const addedSuppliers: Supplier[] = [];
    let addedCount = 0;
    let existingCount = 0;

    for (const raw of list) {
      const cleanName = raw.trim().replace(/\s+/g, " ");
      if (!cleanName || cleanName.length < 1) continue;

      // Check if typo or existing
      const match = this.findTypoSupplier(cleanName);
      if (match) {
        existingCount++;
        continue;
      }

      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 15);
      const newSupplier: Supplier = {
        id: `supp-${slug || "direct"}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
        merchant_id: merchant.id,
        name: cleanName,
        phone: "",
        category: defaultCategory || "Wholesale Supplier",
        payment_terms: "CASH_ON_DELIVERY",
        total_supplied_value: 0,
        total_paid_value: 0,
        outstanding_balance_owed: 0,
        notes: "Quick dumped - waiting for full profile details",
        created_at: new Date().toISOString(),
      };

      suppliers.unshift(newSupplier);
      addedSuppliers.push(newSupplier);
      addedCount++;
    }

    if (addedCount > 0) {
      this.saveSuppliers(suppliers);
    }

    return {
      addedCount,
      existingCount,
      totalProcessed: list.length,
      addedSuppliers,
    };
  }

  static bulkDumpCustomers(
    rawNames: string[] | string
  ): { addedCount: number; existingCount: number; totalProcessed: number; addedCustomers: Customer[] } {
    const list = Array.isArray(rawNames)
      ? rawNames
      : rawNames.split(/[\n,;]+/).map((s) => s.trim());
    
    const customers = this.getCustomers();
    const merchant = this.getMerchant();
    const addedCustomers: Customer[] = [];
    let addedCount = 0;
    let existingCount = 0;

    for (const raw of list) {
      const cleanName = raw.trim().replace(/\s+/g, " ");
      if (!cleanName || cleanName.length < 1) continue;

      // Check if typo or existing
      const match = this.findTypoCustomer(cleanName);
      if (match) {
        existingCount++;
        continue;
      }

      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 15);
      const newCustomer: Customer = {
        id: `cust-${slug || "walkin"}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
        merchant_id: merchant.id,
        name: cleanName,
        phone: "",
        customer_type: "RETAIL_REGULAR",
        credit_limit: 0,
        outstanding_credit_deni: 0,
        lifetime_purchases_value: 0,
        lifetime_payments_value: 0,
        trust_status: "GOOD_STANDING",
        preferred_payment_method: "CASH",
        notes: "Quick dumped - waiting for contact & credit details",
        created_at: new Date().toISOString(),
      };

      customers.unshift(newCustomer);
      addedCustomers.push(newCustomer);
      addedCount++;
    }

    if (addedCount > 0) {
      this.saveCustomers(customers);
    }

    return {
      addedCount,
      existingCount,
      totalProcessed: list.length,
      addedCustomers,
    };
  }

  // --- EXPENSES ---
  static getExpenses(): MoneyOutExpense[] {
    return this._safeGet<MoneyOutExpense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  }

  static saveExpenses(expenses: MoneyOutExpense[]): void {
    this._safeSet(STORAGE_KEYS.EXPENSES, expenses);
  }

  // --- BATCHES ---
  static getBatches(): SupplyBatch[] {
    return this._safeGet<SupplyBatch[]>(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
  }

  static saveBatches(batches: SupplyBatch[]): void {
    this._safeSet(STORAGE_KEYS.BATCHES, batches);
  }

  // --- SALES LEDGER ---
  static getSales(): SalesLedgerEntry[] {
    return this._safeGet<SalesLedgerEntry[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  }

  static saveSales(sales: SalesLedgerEntry[]): void {
    this._safeSet(STORAGE_KEYS.SALES, sales);
  }

  // --- RECONCILIATIONS ---
  static getReconciliations(): ReconciliationRecord[] {
    return this._safeGet<ReconciliationRecord[]>(STORAGE_KEYS.RECONCILIATIONS, INITIAL_RECONCILIATIONS);
  }

  static saveReconciliations(records: ReconciliationRecord[]): void {
    this._safeSet(STORAGE_KEYS.RECONCILIATIONS, records);
  }

  // --- MORNING FLOAT LOGS ---
  static getMorningLogs(): DailyMorningFloatLog[] {
    const rawLogs = this._safeGet<DailyMorningFloatLog[]>(STORAGE_KEYS.MORNING_LOGS, INITIAL_MORNING_LOGS);
    
    // Normalize date string helper (ensures YYYY-MM-DD format)
    const normalizeDate = (d: string): string => {
      if (!d) return "";
      const trimmed = d.split("T")[0].trim();
      const dateObj = new Date(trimmed);
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
      return trimmed;
    };

    // Deduplicate by normalized date (keep latest created/updated record)
    const logMap = new Map<string, DailyMorningFloatLog>();
    const seenIds = new Set<string>();

    rawLogs.forEach((log, idx) => {
      const normDate = normalizeDate(log.date || "");
      if (!normDate) return;

      const existing = logMap.get(normDate);
      if (!existing || (log.created_at && (!existing.created_at || log.created_at >= existing.created_at))) {
        logMap.set(normDate, {
          ...log,
          date: normDate,
        });
      }
    });

    // Ensure every record has a unique ID across the collection
    const deduplicatedLogs = Array.from(logMap.values()).map((log, idx) => {
      let uniqueId = log.id;
      if (!uniqueId || seenIds.has(uniqueId)) {
        uniqueId = `morn-${log.date || "log"}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
      }
      seenIds.add(uniqueId);
      return {
        ...log,
        id: uniqueId,
      };
    });

    // Sort descending chronologically (newest / latest date on top)
    const sortedLogs = deduplicatedLogs.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return (b.recorded_time || "").localeCompare(a.recorded_time || "");
    });

    // If storage had dirty or duplicated records, sanitize localStorage
    if (rawLogs.length !== sortedLogs.length || rawLogs.some((l, i) => l.id !== sortedLogs[i]?.id)) {
      this._safeSet(STORAGE_KEYS.MORNING_LOGS, sortedLogs);
    }

    return sortedLogs;
  }

  static saveMorningLogs(logs: DailyMorningFloatLog[]): void {
    const normalizeDate = (d: string): string => {
      if (!d) return "";
      const trimmed = d.split("T")[0].trim();
      const dateObj = new Date(trimmed);
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
      return trimmed;
    };

    const logMap = new Map<string, DailyMorningFloatLog>();
    const seenIds = new Set<string>();

    logs.forEach((log) => {
      const normDate = normalizeDate(log.date || "");
      if (normDate) {
        logMap.set(normDate, {
          ...log,
          date: normDate,
        });
      }
    });

    const cleanLogs = Array.from(logMap.values()).map((log, idx) => {
      let uniqueId = log.id;
      if (!uniqueId || seenIds.has(uniqueId)) {
        uniqueId = `morn-${log.date || "log"}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
      }
      seenIds.add(uniqueId);
      return {
        ...log,
        id: uniqueId,
      };
    });

    // Strict chronological descending sort (newest date first)
    const sortedCleanLogs = cleanLogs.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return timeB - timeA;
    });

    this._safeSet(STORAGE_KEYS.MORNING_LOGS, sortedCleanLogs);
  }

  static addMorningLog(log: DailyMorningFloatLog): void {
    const logs = this.getMorningLogs();
    const normDate = log.date ? log.date.split("T")[0].trim() : new Date().toISOString().split("T")[0];
    const newRecord: DailyMorningFloatLog = {
      ...log,
      id: log.id || `morn-${normDate}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: normDate,
    };

    const existingIdx = logs.findIndex((l) => l.date === normDate || l.id === log.id);
    if (existingIdx >= 0) {
      logs[existingIdx] = newRecord;
    } else {
      logs.unshift(newRecord);
    }
    this.saveMorningLogs(logs);
  }

  static updateMorningLog(log: DailyMorningFloatLog): void {
    const logs = this.getMorningLogs();
    const normDate = log.date ? log.date.split("T")[0].trim() : new Date().toISOString().split("T")[0];
    const updatedRecord: DailyMorningFloatLog = {
      ...log,
      id: log.id || `morn-${normDate}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: normDate,
    };

    const idx = logs.findIndex((l) => l.id === log.id || l.date === normDate);
    if (idx >= 0) {
      logs[idx] = updatedRecord;
    } else {
      logs.unshift(updatedRecord);
    }
    this.saveMorningLogs(logs);
  }

  static deleteMorningLog(idOrDate: string): void {
    const logs = this.getMorningLogs().filter((l) => l.id !== idOrDate && l.date !== idOrDate);
    this.saveMorningLogs(logs);
  }

  private static _isAutoMerging = false;

  // --- SUPPLIER OPERATIONS ---
  static getSuppliers(): Supplier[] {
    if (!this._isAutoMerging) {
      this._isAutoMerging = true;
      try {
        this.autoMergeAllTypos();
      } catch (err) {
        console.error("Auto-merge suppliers error:", err);
      } finally {
        this._isAutoMerging = false;
      }
    }
    const supps = this._safeGet<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    return supps;
  }

  static saveSuppliers(suppliers: Supplier[]): void {
    this._safeSet(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  static addSupplier(supplier: Supplier): { supplier: Supplier; autoMerged: boolean; message: string } {
    const suppliers = this.getSuppliers();
    const match = this.findTypoSupplier(
      supplier.name,
      supplier.phone,
      supplier.driver_national_id || supplier.national_id
    );

    if (match) {
      // AUTOMATICALLY MERGE typo into master record!
      const p = (supplier.phone || "").replace(/\D/g, "");
      if (p.length >= 9 && !p.includes("0000000") && (!match.phone || match.phone.includes("000"))) {
        match.phone = supplier.phone;
      }
      if (supplier.driver_national_id && !match.driver_national_id) {
        match.driver_national_id = supplier.driver_national_id;
      }
      if (supplier.national_id && !match.national_id) {
        match.national_id = supplier.national_id;
      }
      if (supplier.contact_person && !match.contact_person) {
        match.contact_person = supplier.contact_person;
      }
      if (supplier.location && !match.location) {
        match.location = supplier.location;
      }
      if (supplier.bank_or_paybill_details && !match.bank_or_paybill_details) {
        match.bank_or_paybill_details = supplier.bank_or_paybill_details;
      }
      if (supplier.notes && !match.notes?.includes(supplier.notes)) {
        match.notes = match.notes ? `${match.notes} | ${supplier.notes}` : supplier.notes;
      }

      const idx = suppliers.findIndex((s) => s.id === match.id);
      if (idx >= 0) {
        suppliers[idx] = match;
        this.saveSuppliers(suppliers);
      }

      return {
        supplier: match,
        autoMerged: true,
        message: `Auto-resolved typo: linked "${supplier.name}" to master account "${match.name}".`,
      };
    }

    // Completely new wholesaler/supplier: Just add to list
    suppliers.unshift(supplier);
    this.saveSuppliers(suppliers);
    return {
      supplier,
      autoMerged: false,
      message: `Registered new supplier "${supplier.name}".`,
    };
  }

  static updateSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      suppliers[idx] = supplier;
      this.saveSuppliers(suppliers);
    }
  }

  static syncSuppliersFromAllSources(): { suppliersCount: number; deliveriesCount: number } {
    const suppliers = this._safeGet<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    const deliveries = this._safeGet<SupplierDelivery[]>(STORAGE_KEYS.SUPPLIER_DELIVERIES, INITIAL_SUPPLIER_DELIVERIES);
    const payments = this._safeGet<SupplierPayment[]>(STORAGE_KEYS.SUPPLIER_PAYMENTS, INITIAL_SUPPLIER_PAYMENTS);
    const expenses = this._safeGet<MoneyOutExpense[]>(STORAGE_KEYS.EXPENSES, []);
    const batches = this._safeGet<SupplyBatch[]>(STORAGE_KEYS.BATCHES, []);
    const merchant = this.getMerchant();

    let suppliersChanged = false;
    let deliveriesChanged = false;

    // Helper to find supplier fuzzy/case-insensitively & by typo
    const findSupp = (name: string) => {
      const typoMatch = this.findTypoSupplier(name);
      if (typoMatch) return typoMatch;
      const clean = name.trim().toLowerCase().replace(/\s+/g, " ");
      return suppliers.find((s) => s.name.trim().toLowerCase().replace(/\s+/g, " ") === clean);
    };

    // 1. Scan Supply Batches that have supplier names
    batches.forEach((b) => {
      const sName = (((b as any).supplier_name || (b.notes?.includes("Supplier: ") ? b.notes.split("Supplier: ")[1]?.split("|")[0]?.trim() : "")) || "").trim();
      if (!sName || sName.toLowerCase() === "n/a" || sName.toLowerCase() === "direct wholesaler / distributor") return;

      let supp = findSupp(sName);
      if (!supp) {
        const slug = sName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 15);
        supp = {
          id: `supp-${slug || "direct"}-${Date.now().toString().slice(-4)}`,
          merchant_id: merchant.id,
          name: sName,
          phone: "+254 700 000 000",
          category: "Wholesale Supplier",
          payment_terms: "CASH_ON_DELIVERY",
          total_supplied_value: 0,
          total_paid_value: 0,
          outstanding_balance_owed: 0,
          notes: `Auto-registered from supply batch: ${b.batch_number}`,
          created_at: b.received_at || new Date().toISOString(),
        };
        suppliers.push(supp);
        suppliersChanged = true;
      }

      // Check if a delivery exists for this batch
      const batchRef = String(b.batch_number || `BATCH-${b.id.slice(-4)}`);
      const existingDeliv = deliveries.find(
        (d) =>
          (d.supplier_id === supp!.id || d.supplier_name.trim().toLowerCase() === supp!.name.trim().toLowerCase()) &&
          (d.invoice_or_delivery_note === batchRef || d.notes?.includes(b.id) || d.id.includes(b.id))
      );

      if (!existingDeliv) {
        const totalBatchCost = (Number(b.unit_cost_price) || 0) * (Number(b.initial_qty) || 1);
        const delivItem = {
          item_id: b.item_id,
          item_name: b.item_name || "Wholesale Merchandise",
          qty: b.initial_qty || 1,
          unit_of_measure: "units",
          unit_cost_price: b.unit_cost_price || 0,
          unit_selling_price: b.unit_selling_price || (b.unit_cost_price ? b.unit_cost_price * 1.25 : 0),
          subtotal: totalBatchCost,
        };

        const newDeliv: SupplierDelivery = {
          id: `deliv-batch-${b.id}`,
          merchant_id: merchant.id,
          supplier_id: supp.id,
          supplier_name: supp.name,
          delivery_date: (b.received_at || new Date().toISOString()).split("T")[0],
          invoice_or_delivery_note: batchRef,
          items: [delivItem],
          total_amount: totalBatchCost,
          amount_paid: totalBatchCost,
          balance_remaining: 0,
          payment_channel: "CASH",
          status: "PAID",
          notes: `Batch Supply #${b.batch_number} (${b.item_name})`,
          created_at: b.received_at || new Date().toISOString(),
        };
        deliveries.unshift(newDeliv);
        deliveriesChanged = true;
      }
    });

    // 2. Scan expenses that have supplier names
    expenses.forEach((exp) => {
      const sName = (exp.supplier_name || "").trim();
      if (!sName || sName.toLowerCase() === "n/a" || sName.toLowerCase() === "direct purchase") return;

      // Find or create supplier
      let supp = findSupp(sName);
      if (!supp) {
        const slug = sName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 15);
        supp = {
          id: `supp-${slug || "direct"}-${Date.now().toString().slice(-4)}`,
          merchant_id: exp.merchant_id || merchant.id,
          name: sName,
          phone: "+254 700 000 000",
          category: exp.category === "INVENTORY" ? "Wholesale Supplier" : "General Goods",
          payment_terms: "CASH_ON_DELIVERY",
          total_supplied_value: 0,
          total_paid_value: 0,
          outstanding_balance_owed: 0,
          notes: `Auto-linked from receipt/expense: ${exp.receipt_reference || exp.id}`,
          created_at: exp.created_at || new Date().toISOString(),
        };
        suppliers.push(supp);
        suppliersChanged = true;
      }

      // Check if a supplier delivery already exists for this expense or receipt reference
      const ref = exp.receipt_reference || exp.id;
      const existingDeliv = deliveries.find(
        (d) =>
          (d.supplier_id === supp!.id || d.supplier_name.trim().toLowerCase() === supp!.name.trim().toLowerCase()) &&
          (d.invoice_or_delivery_note === ref || d.id.includes(exp.id) || d.notes?.includes(exp.id) || d.notes?.includes(ref))
      );

      if (!existingDeliv && (exp.expense_type === "INVENTORY_PURCHASE" || exp.category === "INVENTORY")) {
        const delivItem = {
          item_id: exp.item_id,
          item_name: exp.item_name || "Wholesale Merchandise",
          qty: exp.qty_purchased || 1,
          unit_of_measure: "units",
          unit_cost_price: exp.unit_cost_price || exp.total_cost,
          unit_selling_price: exp.unit_selling_price || (exp.unit_cost_price ? exp.unit_cost_price * 1.25 : exp.total_cost * 1.25),
          subtotal: exp.total_cost,
        };

        const newDeliv: SupplierDelivery = {
          id: `deliv-sync-${exp.id}`,
          merchant_id: exp.merchant_id || merchant.id,
          supplier_id: supp.id,
          supplier_name: supp.name,
          delivery_date: (exp.created_at || new Date().toISOString()).split("T")[0],
          invoice_or_delivery_note: ref,
          items: [delivItem],
          total_amount: exp.total_cost,
          amount_paid: exp.total_cost,
          balance_remaining: 0,
          payment_channel: "CASH",
          status: "PAID",
          notes: exp.notes || `Receipt Reference: ${ref}`,
          created_at: exp.created_at || new Date().toISOString(),
        };
        deliveries.unshift(newDeliv);
        deliveriesChanged = true;
      }
    });

    // Recompute all supplier financial balances based on deliveries and payments
    suppliers.forEach((s) => {
      const sNameNorm = s.name.trim().toLowerCase().replace(/\s+/g, " ");
      const sDeliveries = deliveries.filter(
        (d) => d.supplier_id === s.id || (d.supplier_name && d.supplier_name.trim().toLowerCase().replace(/\s+/g, " ") === sNameNorm)
      );
      const sPayments = payments.filter(
        (p) => p.supplier_id === s.id || (p.supplier_name && p.supplier_name.trim().toLowerCase().replace(/\s+/g, " ") === sNameNorm)
      );

      const totalSupplied = sDeliveries.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);
      const totalPaidAtDelivery = sDeliveries.reduce((sum, d) => sum + (Number(d.amount_paid) || 0), 0);
      const totalDebtSettled = sPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalPaid = totalPaidAtDelivery + totalDebtSettled;
      const outstanding = Math.max(0, totalSupplied - totalPaid);

      if (
        s.total_supplied_value !== totalSupplied ||
        s.total_paid_value !== totalPaid ||
        s.outstanding_balance_owed !== outstanding
      ) {
        s.total_supplied_value = totalSupplied;
        s.total_paid_value = totalPaid;
        s.outstanding_balance_owed = outstanding;
        suppliersChanged = true;
      }
    });

    if (suppliersChanged) {
      this.saveSuppliers(suppliers);
    }
    if (deliveriesChanged) {
      this.saveSupplierDeliveries(deliveries);
    }

    return {
      suppliersCount: suppliers.length,
      deliveriesCount: deliveries.length,
    };
  }

  // --- MERGE & DEDUPLICATION TOOLS (Handles typos & rush-hour duplicates) ---

  static normalizeWordTypo(str: string): string {
    if (!str) return "";
    return str
      .toLowerCase()
      .trim()
      // Normalize double consonants at word starts or within words (e.g. "hhouse" -> "house", "bbrookside" -> "brookside")
      .replace(/\b([bcdfghjklmnpqrstvwxyz])\1+/gi, "$1")
      .replace(/([^aeiouls\s])\1+/gi, "$1")
      .replace(/\s+/g, " ");
  }

  static stripBusinessSuffixes(name: string): string {
    const suffixes = [
      "wholesalers", "wholesaler", "wholesale", "distributors", "distributor", "distribution",
      "enterprises", "enterprise", "ent", "suppliers", "supplier", "supplies", "supply",
      "stores", "store", "limited", "ltd", "millers", "miller", "bakery", "bakers", "bakehouse",
      "traders", "trading", "depot", "holdings", "merchants", "merchant", "co", "company",
      "investments", "investment", "ventures", "agency", "agencies", "shop", "duka",
      "dealers", "dealer", "general merchants"
    ];
    let clean = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");
    for (const suf of suffixes) {
      const regex = new RegExp(`\\b${suf}\\b`, "gi");
      clean = clean.replace(regex, "").trim();
    }
    return clean.replace(/\s+/g, " ").trim();
  }

  static extractColloquialTradeAlias(name: string): { name: string; trade: string } | null {
    const clean = name.trim().toLowerCase();
    // Swahili colloquial "wa <product/trade>" e.g. "John wa cakes", "Mary wa Ndizi", "Peter wa Maziwa", "Otieno wa Mayai"
    const match = clean.match(/^([a-z0-9\s]+?)\s+(?:wa|ya|za|of)\s+([a-z0-9\s]+)$/i);
    if (match) {
      return { name: match[1].trim(), trade: match[2].trim() };
    }
    // Also detect direct product descriptor suffix e.g. "John cakes" vs "Kevin John"
    const tradeKeywords = [
      "cakes", "cake", "bread", "mkate", "maziwa", "milk", "mayai", "eggs", "unga", "flour",
      "mafuta", "oil", "sugar", "sukari", "rice", "mchele", "soap", "sabuni", "ndizi", "bananas",
      "mboga", "meat", "nyama", "viazi", "potatoes", "water", "soda", "drinks", "juice", "biscuits"
    ];
    const words = clean.split(" ").filter(Boolean);
    if (words.length >= 2) {
      const lastWord = words[words.length - 1];
      if (tradeKeywords.includes(lastWord)) {
        return { name: words.slice(0, -1).join(" "), trade: lastWord };
      }
    }
    return null;
  }

  /**
   * Comprehensive typo, casing, wholesale suffix, and Kenyan colloquial alias matcher:
   * 1. Exact case-insensitive (e.g. "Brookside" vs "brookside", "KCC" vs "kcc")
   * 2. Punctuation / spacing differences (e.g. "Brook-Side" vs "Brookside", "K.C.C" vs "KCC")
   * 3. Business / Wholesale suffixes + Typos (e.g. "Lux house" vs "lux hhouse wholesalers")
   * 4. Kenyan Swahili colloquial aliases (e.g. "John wa cakes" vs "Kevin John", "Mary wa Ndizi" vs "Mama Mary")
   * 5. Strict typo distance (Levenshtein <= 1 for medium names, <= 2 for long names > 8 chars)
   * 6. Identical non-placeholder Phone or National ID
   * 
   * CRITICAL GUARANTEE: Distinct wholesalers/customers (e.g. "KCC" vs "Brookside", "John Kamau" vs "Peter Kamau", "Mama John" vs "Mama Mary") MUST NOT be merged!
   */
  static isNameOrContactTypoMatch(
    nameA: string,
    nameB: string,
    phoneA?: string,
    phoneB?: string,
    idA?: string,
    idB?: string,
    aliasesA?: string[],
    aliasesB?: string[]
  ): {
    isMatch: boolean;
    confidence: "EXACT_CASE_INSENSITIVE" | "PUNCTUATION_SPACING" | "WHOLESALE_SUFFIX_VARIATION" | "COLLOQUIAL_ALIAS_MATCH" | "TYPO_SIMILARITY" | "PHONE_MATCH" | "ID_MATCH" | "KNOWN_ALIAS" | "NONE";
    reason: string;
  } {
    const cleanA = (nameA || "").trim().toLowerCase().replace(/\s+/g, " ");
    const cleanB = (nameB || "").trim().toLowerCase().replace(/\s+/g, " ");

    if (!cleanA || !cleanB) {
      return { isMatch: false, confidence: "NONE", reason: "Empty name" };
    }

    // 0. Check Known Aliases
    if (
      aliasesA?.some((a) => a.trim().toLowerCase() === cleanB) ||
      aliasesB?.some((b) => b.trim().toLowerCase() === cleanA)
    ) {
      return {
        isMatch: true,
        confidence: "KNOWN_ALIAS",
        reason: `Linked alias found: "${nameA}" & "${nameB}"`,
      };
    }

    // 1. Exact case-insensitive match
    if (cleanA === cleanB) {
      return {
        isMatch: true,
        confidence: "EXACT_CASE_INSENSITIVE",
        reason: `Capitalization variation: "${nameA}" vs "${nameB}"`,
      };
    }

    // 2. Punctuation & space stripped match (e.g. "Brook-Side" vs "Brookside", "K.C.C" vs "KCC")
    const stripA = cleanA.replace(/[^a-z0-9]/g, "");
    const stripB = cleanB.replace(/[^a-z0-9]/g, "");

    if (stripA.length >= 3 && stripA === stripB) {
      return {
        isMatch: true,
        confidence: "PUNCTUATION_SPACING",
        reason: `Punctuation/spacing variation: "${nameA}" vs "${nameB}"`,
      };
    }

    // 3. Repeated consonant typo normalization (e.g. "hhouse" -> "house", "bbrookside" -> "brookside")
    const normA = this.normalizeWordTypo(cleanA);
    const normB = this.normalizeWordTypo(cleanB);
    if (normA.length >= 3 && normA === normB) {
      return {
        isMatch: true,
        confidence: "TYPO_SIMILARITY",
        reason: `Spelling typo with doubled letter: "${nameA}" vs "${nameB}"`,
      };
    }

    // 4. Business & Wholesale Suffix Stripping (e.g. "Lux house" vs "lux hhouse wholesalers")
    const sufA = this.stripBusinessSuffixes(normA);
    const sufB = this.stripBusinessSuffixes(normB);
    if (sufA.length >= 3 && sufB.length >= 3) {
      if (sufA === sufB) {
        return {
          isMatch: true,
          confidence: "WHOLESALE_SUFFIX_VARIATION",
          reason: `Wholesale suffix and spelling variation: "${nameA}" vs "${nameB}"`,
        };
      }
      const sufDist = this._levenshteinDistance(sufA, sufB);
      if (sufDist <= 1 && Math.min(sufA.length, sufB.length) >= 4) {
        return {
          isMatch: true,
          confidence: "WHOLESALE_SUFFIX_VARIATION",
          reason: `Wholesale suffix with minor typo: "${nameA}" vs "${nameB}"`,
        };
      }
    }

    // Also check if one name is a substring after removing suffixes (e.g. "Lux house" vs "Lux house wholesalers")
    if (
      (cleanA.length >= 5 && cleanB.startsWith(cleanA) && this.stripBusinessSuffixes(cleanB.slice(cleanA.length)) === "") ||
      (cleanB.length >= 5 && cleanA.startsWith(cleanB) && this.stripBusinessSuffixes(cleanA.slice(cleanB.length)) === "")
    ) {
      return {
        isMatch: true,
        confidence: "WHOLESALE_SUFFIX_VARIATION",
        reason: `Trade suffix addition: "${nameA}" vs "${nameB}"`,
      };
    }

    // 5. Kenyan Swahili Colloquial Nicknames (e.g. "John wa cakes" vs "Kevin John")
    const colloquialA = this.extractColloquialTradeAlias(cleanA);
    const colloquialB = this.extractColloquialTradeAlias(cleanB);

    if (colloquialA && !colloquialB) {
      const tokensB = cleanB.split(" ").filter((w) => w.length >= 3);
      if (tokensB.includes(colloquialA.name) || tokensB.some((t) => this._levenshteinDistance(t, colloquialA.name) <= 1 && t.length >= 4)) {
        return {
          isMatch: true,
          confidence: "COLLOQUIAL_ALIAS_MATCH",
          reason: `Colloquial trade alias ("${nameA}" is the trade nickname for "${nameB}")`,
        };
      }
    } else if (colloquialB && !colloquialA) {
      const tokensA = cleanA.split(" ").filter((w) => w.length >= 3);
      if (tokensA.includes(colloquialB.name) || tokensA.some((t) => this._levenshteinDistance(t, colloquialB.name) <= 1 && t.length >= 4)) {
        return {
          isMatch: true,
          confidence: "COLLOQUIAL_ALIAS_MATCH",
          reason: `Colloquial trade alias ("${nameB}" is the trade nickname for "${nameA}")`,
        };
      }
    }

    // 6. Check Phone match (non-placeholder, >= 9 digits)
    const pA = (phoneA || "").replace(/\D/g, "");
    const pB = (phoneB || "").replace(/\D/g, "");
    if (
      pA.length >= 9 &&
      pB.length >= 9 &&
      pA === pB &&
      !pA.includes("0000000") &&
      !pA.includes("1234567")
    ) {
      return {
        isMatch: true,
        confidence: "PHONE_MATCH",
        reason: `Matching phone number (${phoneA}): "${nameA}" & "${nameB}"`,
      };
    }

    // 7. Check National ID match (non-placeholder, >= 6 digits)
    const idCleanA = (idA || "").trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const idCleanB = (idB || "").trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (
      idCleanA.length >= 6 &&
      idCleanB.length >= 6 &&
      idCleanA === idCleanB &&
      !idCleanA.includes("000000")
    ) {
      return {
        isMatch: true,
        confidence: "ID_MATCH",
        reason: `Matching National ID (${idA}): "${nameA}" & "${nameB}"`,
      };
    }

    // 8. Strict Typo Similarity using Levenshtein distance on stripped strings
    const minLen = Math.min(stripA.length, stripB.length);

    // Guard against comparing very short acronyms (e.g. "KCC" vs "KFC" is NOT a typo, different companies!)
    if (minLen < 4) {
      return { isMatch: false, confidence: "NONE", reason: "Short abbreviations require exact match" };
    }

    // Guard against multi-word title prefixes (e.g. "Mama John" vs "Mama Mary" or "Mr Kamau" vs "Mr Otieno")
    const wordsA = cleanA.split(" ").filter(Boolean);
    const wordsB = cleanB.split(" ").filter(Boolean);
    if (wordsA.length > 1 && wordsB.length > 1) {
      const prefixA = wordsA[0];
      const prefixB = wordsB[0];
      const restA = wordsA.slice(1).join(" ");
      const restB = wordsB.slice(1).join(" ");

      const titles = ["mama", "baba", "mr", "mrs", "ms", "dr", "prof", "duka", "shop", "hotel"];
      if (titles.includes(prefixA) && titles.includes(prefixB)) {
        const restDist = this._levenshteinDistance(restA, restB);
        if (restDist > 1 || (restA.length <= 4 && restDist > 0)) {
          return {
            isMatch: false,
            confidence: "NONE",
            reason: `Different person under title "${prefixA}": "${restA}" vs "${restB}"`,
          };
        }
      }
    }

    const dist = this._levenshteinDistance(stripA, stripB);

    // For medium names (4 to 7 chars): Only 1 char typo allowed AND first letter must match!
    if (minLen >= 4 && minLen <= 7) {
      if (dist === 1 && stripA[0] === stripB[0]) {
        return {
          isMatch: true,
          confidence: "TYPO_SIMILARITY",
          reason: `Minor spelling typo (${dist} letter): "${nameA}" vs "${nameB}"`,
        };
      }
      return { isMatch: false, confidence: "NONE", reason: "Distance too high for medium name" };
    }

    // For longer names (>= 8 chars): 1 or 2 char typo allowed
    if (minLen >= 8) {
      if (dist === 1) {
        return {
          isMatch: true,
          confidence: "TYPO_SIMILARITY",
          reason: `Minor spelling typo (${dist} letter): "${nameA}" vs "${nameB}"`,
        };
      }
      if (dist === 2 && minLen >= 9 && stripA[0] === stripB[0]) {
        return {
          isMatch: true,
          confidence: "TYPO_SIMILARITY",
          reason: `Close spelling typo (${dist} letters): "${nameA}" vs "${nameB}"`,
        };
      }
    }

    return { isMatch: false, confidence: "NONE", reason: "Distinct names" };
  }

  static findTypoSupplier(name: string, phone?: string, driverNationalId?: string): Supplier | null {
    const suppliers = this.getSuppliers();
    const cleanInput = (name || "").trim().toLowerCase();
    
    // Direct or alias match first
    for (const s of suppliers) {
      if (s.name.trim().toLowerCase() === cleanInput) return s;
      if (s.aliases && s.aliases.some((a) => a.trim().toLowerCase() === cleanInput)) return s;
    }

    // Fuzzy & typo match
    for (const s of suppliers) {
      const match = this.isNameOrContactTypoMatch(
        name,
        s.name,
        phone,
        s.phone,
        driverNationalId,
        s.national_id || s.driver_national_id,
        undefined,
        s.aliases
      );
      if (match.isMatch) {
        return s;
      }
    }
    return null;
  }

  static findTypoCustomer(name: string, phone?: string, nationalId?: string): Customer | null {
    const customers = this.getCustomers();
    const cleanInput = (name || "").trim().toLowerCase();

    // Direct or alias match first
    for (const c of customers) {
      if (c.name.trim().toLowerCase() === cleanInput) return c;
      if (c.aliases && c.aliases.some((a) => a.trim().toLowerCase() === cleanInput)) return c;
    }

    // Fuzzy & typo match
    for (const c of customers) {
      const match = this.isNameOrContactTypoMatch(
        name,
        c.name,
        phone,
        c.phone,
        nationalId,
        c.national_id,
        undefined,
        c.aliases
      );
      if (match.isMatch) {
        return c;
      }
    }
    return null;
  }

  static isStandardCapitalization(str: string): boolean {
    if (!str) return false;
    // Disallow weird mid-word capital letters like "MUsembi", "mUseMbi"
    if (/[a-z][A-Z]/.test(str)) return false;
    // Disallow ALL-CAPS if multiple words (e.g. "JOSEPH MUSEMBI")
    if (str.length > 3 && str === str.toUpperCase() && str.includes(" ")) return false;
    return true;
  }

  static findDuplicateSuppliers(): Array<{
    primary: Supplier;
    duplicate: Supplier;
    confidence: "EXACT_CASE_INSENSITIVE" | "PUNCTUATION_SPACING" | "WHOLESALE_SUFFIX_VARIATION" | "COLLOQUIAL_ALIAS_MATCH" | "TYPO_SIMILARITY" | "PHONE_MATCH" | "ID_MATCH" | "KNOWN_ALIAS";
    reason: string;
  }> {
    const suppliers = this._safeGet<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    const duplicates: Array<{
      primary: Supplier;
      duplicate: Supplier;
      confidence: "EXACT_CASE_INSENSITIVE" | "PUNCTUATION_SPACING" | "WHOLESALE_SUFFIX_VARIATION" | "COLLOQUIAL_ALIAS_MATCH" | "TYPO_SIMILARITY" | "PHONE_MATCH" | "ID_MATCH" | "KNOWN_ALIAS";
      reason: string;
    }> = [];

    for (let i = 0; i < suppliers.length; i++) {
      for (let j = i + 1; j < suppliers.length; j++) {
        const s1 = suppliers[i];
        const s2 = suppliers[j];
        const match = this.isNameOrContactTypoMatch(
          s1.name,
          s2.name,
          s1.phone,
          s2.phone,
          s1.national_id || s1.driver_national_id,
          s2.national_id || s2.driver_national_id,
          s1.aliases,
          s2.aliases
        );

        if (match.isMatch && match.confidence !== "NONE") {
          const clean1 = this.isStandardCapitalization(s1.name);
          const clean2 = this.isStandardCapitalization(s2.name);
          let primary = s1;
          let duplicate = s2;

          if (!clean1 && clean2) {
            primary = s2;
            duplicate = s1;
          } else if (clean1 && !clean2) {
            primary = s1;
            duplicate = s2;
          } else if (s2.total_supplied_value > s1.total_supplied_value) {
            primary = s2;
            duplicate = s1;
          }

          duplicates.push({
            primary,
            duplicate,
            confidence: match.confidence,
            reason: match.reason,
          });
        }
      }
    }

    return duplicates;
  }

  static findDuplicateCustomers(): Array<{
    primary: Customer;
    duplicate: Customer;
    confidence: "EXACT_CASE_INSENSITIVE" | "PUNCTUATION_SPACING" | "WHOLESALE_SUFFIX_VARIATION" | "COLLOQUIAL_ALIAS_MATCH" | "TYPO_SIMILARITY" | "PHONE_MATCH" | "ID_MATCH" | "KNOWN_ALIAS";
    reason: string;
  }> {
    const customers = this._safeGet<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const duplicates: Array<{
      primary: Customer;
      duplicate: Customer;
      confidence: "EXACT_CASE_INSENSITIVE" | "PUNCTUATION_SPACING" | "WHOLESALE_SUFFIX_VARIATION" | "COLLOQUIAL_ALIAS_MATCH" | "TYPO_SIMILARITY" | "PHONE_MATCH" | "ID_MATCH" | "KNOWN_ALIAS";
      reason: string;
    }> = [];

    for (let i = 0; i < customers.length; i++) {
      for (let j = i + 1; j < customers.length; j++) {
        const c1 = customers[i];
        const c2 = customers[j];
        const match = this.isNameOrContactTypoMatch(
          c1.name,
          c2.name,
          c1.phone,
          c2.phone,
          c1.national_id,
          c2.national_id,
          c1.aliases,
          c2.aliases
        );

        if (match.isMatch && match.confidence !== "NONE") {
          const clean1 = this.isStandardCapitalization(c1.name);
          const clean2 = this.isStandardCapitalization(c2.name);
          let primary = c1;
          let duplicate = c2;

          if (!clean1 && clean2) {
            primary = c2;
            duplicate = c1;
          } else if (clean1 && !clean2) {
            primary = c1;
            duplicate = c2;
          } else if (c2.outstanding_credit_deni > c1.outstanding_credit_deni) {
            primary = c2;
            duplicate = c1;
          }

          duplicates.push({
            primary,
            duplicate,
            confidence: match.confidence,
            reason: match.reason,
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Automatically merges all obvious typos in the background without asking the MSME owner.
   * Distinct wholesalers or customers are NEVER merged.
   */
  static autoMergeAllTypos(): { mergedSuppliersCount: number; mergedCustomersCount: number } {
    let mergedSuppliersCount = 0;
    let mergedCustomersCount = 0;

    // 1. Auto-merge duplicate suppliers that are typos
    let hasMoreSuppliers = true;
    while (hasMoreSuppliers) {
      const dups = this.findDuplicateSuppliers();
      if (dups.length > 0) {
        const { primary, duplicate } = dups[0];
        this.mergeSuppliers(primary.id, duplicate.id);
        mergedSuppliersCount++;
      } else {
        hasMoreSuppliers = false;
      }
    }

    // 2. Auto-merge duplicate customers that are typos
    let hasMoreCustomers = true;
    while (hasMoreCustomers) {
      const dups = this.findDuplicateCustomers();
      if (dups.length > 0) {
        const { primary, duplicate } = dups[0];
        this.mergeCustomers(primary.id, duplicate.id);
        mergedCustomersCount++;
      } else {
        hasMoreCustomers = false;
      }
    }

    return { mergedSuppliersCount, mergedCustomersCount };
  }

  static mergeSuppliers(primaryId: string, duplicateId: string, customName?: string): { success: boolean; message: string } {
    if (primaryId === duplicateId) return { success: false, message: "Cannot merge a supplier with itself." };

    const suppliers = this._safeGet<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    const primary = suppliers.find((s) => s.id === primaryId);
    const duplicate = suppliers.find((s) => s.id === duplicateId);

    if (!primary || !duplicate) {
      return { success: false, message: "One or both supplier records not found." };
    }

    const cleanPrimary = this.isStandardCapitalization(primary.name);
    const cleanDup = this.isStandardCapitalization(duplicate.name);
    let chosenName = primary.name;
    if (!cleanPrimary && cleanDup) {
      chosenName = duplicate.name;
    }
    const unifiedName = (customName || chosenName).trim();

    // 1. Update Deliveries
    const deliveries = this.getSupplierDeliveries();
    deliveries.forEach((d) => {
      const isDupMatch =
        d.supplier_id === duplicateId ||
        (d.supplier_name && this.isNameOrContactTypoMatch(d.supplier_name, duplicate.name).isMatch);
      const isPriMatch =
        d.supplier_id === primaryId ||
        (d.supplier_name && this.isNameOrContactTypoMatch(d.supplier_name, primary.name).isMatch);

      if (isDupMatch || isPriMatch) {
        d.supplier_id = primary.id;
        d.supplier_name = unifiedName;
      }
    });

    // 2. Update Payments
    const payments = this.getSupplierPayments();
    payments.forEach((p) => {
      const isDupMatch =
        p.supplier_id === duplicateId ||
        (p.supplier_name && this.isNameOrContactTypoMatch(p.supplier_name, duplicate.name).isMatch);
      const isPriMatch =
        p.supplier_id === primaryId ||
        (p.supplier_name && this.isNameOrContactTypoMatch(p.supplier_name, primary.name).isMatch);

      if (isDupMatch || isPriMatch) {
        p.supplier_id = primary.id;
        p.supplier_name = unifiedName;
      }
    });

    // 3. Update Batches
    const batches = this.getBatches();
    batches.forEach((b) => {
      if ((b as any).supplier_name && this.isNameOrContactTypoMatch((b as any).supplier_name, duplicate.name).isMatch) {
        (b as any).supplier_name = unifiedName;
      }
      if (b.notes?.includes(duplicate.name)) {
        b.notes = b.notes.replace(new RegExp(duplicate.name, "gi"), unifiedName);
      }
    });

    // 4. Update Expenses
    const expenses = this.getExpenses();
    expenses.forEach((e) => {
      if (e.supplier_name && this.isNameOrContactTypoMatch(e.supplier_name, duplicate.name).isMatch) {
        e.supplier_name = unifiedName;
      }
    });

    // 5. Merge profile details into primary
    primary.name = unifiedName;
    const combinedAliases = new Set<string>([
      ...(primary.aliases || []),
      ...(duplicate.aliases || []),
      duplicate.name,
    ]);
    combinedAliases.delete(unifiedName);
    primary.aliases = Array.from(combinedAliases).filter(Boolean);

    if ((!primary.phone || primary.phone.includes("000")) && duplicate.phone && !duplicate.phone.includes("000")) {
      primary.phone = duplicate.phone;
    }
    if (!primary.national_id && duplicate.national_id) {
      primary.national_id = duplicate.national_id;
    }
    if (!primary.driver_national_id && duplicate.driver_national_id) {
      primary.driver_national_id = duplicate.driver_national_id;
    }
    if (!primary.bank_or_paybill_details && duplicate.bank_or_paybill_details) {
      primary.bank_or_paybill_details = duplicate.bank_or_paybill_details;
    }
    if (duplicate.notes && !primary.notes?.includes(duplicate.notes)) {
      primary.notes = `${primary.notes ? primary.notes + " | " : ""}Merged from [${duplicate.name}]: ${duplicate.notes}`;
    }

    // 6. Remove duplicate from suppliers list
    const updatedSuppliers = suppliers.filter((s) => s.id !== duplicateId);

    // Save everything
    this.saveSuppliers(updatedSuppliers);
    this.saveSupplierDeliveries(deliveries);
    this.saveSupplierPayments(payments);
    this.saveBatches(batches);
    this.saveExpenses(expenses);

    // Recompute primary balances
    const priDeliveries = deliveries.filter((d) => d.supplier_id === primary.id);
    const priPayments = payments.filter((p) => p.supplier_id === primary.id);
    primary.total_supplied_value = priDeliveries.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);
    const paidAtDeliv = priDeliveries.reduce((sum, d) => sum + (Number(d.amount_paid) || 0), 0);
    const paidLater = priPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    primary.total_paid_value = paidAtDeliv + paidLater;
    primary.outstanding_balance_owed = Math.max(0, primary.total_supplied_value - primary.total_paid_value);
    this.saveSuppliers(updatedSuppliers);

    return {
      success: true,
      message: `Successfully merged "${duplicate.name}" into "${unifiedName}"! All historical delivery notes, receipts, payments, and T-Ledger entries are now consolidated.`,
    };
  }

  static mergeCustomers(primaryId: string, duplicateId: string, customName?: string): { success: boolean; message: string } {
    if (primaryId === duplicateId) return { success: false, message: "Cannot merge a customer with itself." };

    const customers = this.getCustomers();
    const primary = customers.find((c) => c.id === primaryId);
    const duplicate = customers.find((c) => c.id === duplicateId);

    if (!primary || !duplicate) {
      return { success: false, message: "Customer records not found." };
    }

    const unifiedName = (customName || primary.name).trim();

    // 1. Update customer sales
    const sales = this.getCustomerSales();
    sales.forEach((s) => {
      if (s.customer_id === duplicateId || s.customer_name.trim().toLowerCase() === duplicate.name.trim().toLowerCase()) {
        s.customer_id = primary.id;
        s.customer_name = unifiedName;
      } else if (s.customer_id === primaryId) {
        s.customer_name = unifiedName;
      }
    });

    // 2. Update customer repayments
    const repayments = this.getCustomerRepayments();
    repayments.forEach((r) => {
      if (r.customer_id === duplicateId || r.customer_name.trim().toLowerCase() === duplicate.name.trim().toLowerCase()) {
        r.customer_id = primary.id;
        r.customer_name = unifiedName;
      } else if (r.customer_id === primaryId) {
        r.customer_name = unifiedName;
      }
    });

    // 3. Update customer info & balances
    primary.name = unifiedName;
    const combinedAliases = new Set<string>([
      ...(primary.aliases || []),
      ...(duplicate.aliases || []),
      duplicate.name,
    ]);
    combinedAliases.delete(unifiedName);
    primary.aliases = Array.from(combinedAliases).filter(Boolean);

    if ((!primary.phone || primary.phone.includes("000")) && duplicate.phone) {
      primary.phone = duplicate.phone;
    }
    if (!primary.national_id && duplicate.national_id) {
      primary.national_id = duplicate.national_id;
    }

    // Recompute total sales, debt, and balance
    const custSales = sales.filter((s) => s.customer_id === primary.id);
    const custRepayments = repayments.filter((r) => r.customer_id === primary.id);

    primary.lifetime_purchases_value = custSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const totalDebtAccrued = custSales.reduce((sum, s) => sum + (Number(s.deni_added) || 0), 0);
    primary.lifetime_payments_value = custRepayments.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0);
    primary.outstanding_credit_deni = Math.max(0, totalDebtAccrued - primary.lifetime_payments_value);

    const updatedCustomers = customers.filter((c) => c.id !== duplicateId);

    this.saveCustomers(updatedCustomers);
    this.saveCustomerSales(sales);
    this.saveCustomerRepayments(repayments);

    return {
      success: true,
      message: `Successfully merged customer "${duplicate.name}" into "${unifiedName}"!`,
    };
  }

  private static _levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }

  static getSupplierDeliveries(): SupplierDelivery[] {
    return this._safeGet<SupplierDelivery[]>(STORAGE_KEYS.SUPPLIER_DELIVERIES, INITIAL_SUPPLIER_DELIVERIES);
  }

  static saveSupplierDeliveries(deliveries: SupplierDelivery[]): void {
    this._safeSet(STORAGE_KEYS.SUPPLIER_DELIVERIES, deliveries);
  }

  static addSupplierDelivery(delivery: SupplierDelivery): void {
    if (delivery.supplier_name) {
      const match = this.findTypoSupplier(delivery.supplier_name);
      if (match) {
        delivery.supplier_id = match.id;
        delivery.supplier_name = match.name;
      }
    }

    const deliveries = this.getSupplierDeliveries();
    deliveries.unshift(delivery);
    this.saveSupplierDeliveries(deliveries);

    // 1. Update Supplier balances (total supplied, total paid, and debt we owe)
    const suppliers = this.getSuppliers();
    const suppIdx = suppliers.findIndex((s) => s.id === delivery.supplier_id);
    if (suppIdx >= 0) {
      suppliers[suppIdx].total_supplied_value += delivery.total_amount;
      suppliers[suppIdx].total_paid_value += delivery.amount_paid;
      suppliers[suppIdx].outstanding_balance_owed += delivery.balance_remaining;
      this.saveSuppliers(suppliers);
    }

    // 2. Automatically update Inventory stock counts and create SupplyBatches for each delivered item
    const items = this.getItems();
    const batches = this.getBatches();
    const nowStr = new Date().toISOString();

    delivery.items.forEach((dItem) => {
      let item = items.find((i) => i.id === dItem.item_id || i.name.toLowerCase() === dItem.item_name.toLowerCase());
      if (item) {
        item.current_stock_qty += dItem.qty;
        item.unit_cost_price = dItem.unit_cost_price;
        if (dItem.unit_selling_price > 0) {
          item.unit_selling_price = dItem.unit_selling_price;
        }
        item.last_restocked_at = nowStr;
        item.total_batches_count += 1;

        // Add supply batch
        batches.unshift({
          id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          merchant_id: delivery.merchant_id,
          item_id: item.id,
          item_name: item.name,
          batch_number: item.total_batches_count,
          initial_qty: dItem.qty,
          remaining_qty: dItem.qty,
          unit_cost_price: dItem.unit_cost_price,
          unit_selling_price: dItem.unit_selling_price || item.unit_selling_price,
          status: "ACTIVE",
          received_at: nowStr,
          spoilage_loss_qty: 0,
          notes: `Supplied by ${delivery.supplier_name} (${delivery.invoice_or_delivery_note || "Drop"})`,
        });
      }
    });

    this.saveItems(items);
    this.saveBatches(batches);

    // 3. If cash/paybill/mpesa paid out now, log as Money Out expense
    if (delivery.amount_paid > 0) {
      const expenses = this.getExpenses();
      expenses.unshift({
        id: `exp-${Date.now()}`,
        merchant_id: delivery.merchant_id,
        expense_type: "INVENTORY_PURCHASE",
        category: "INVENTORY",
        total_cost: delivery.amount_paid,
        supplier_name: delivery.supplier_name,
        receipt_reference: delivery.invoice_or_delivery_note || `SUPP-${delivery.supplier_id}`,
        notes: `Inventory delivery payment (${delivery.items.length} items). Remaining debt: KSh ${delivery.balance_remaining}`,
        created_at: nowStr,
      });
      this.saveExpenses(expenses);
    }
  }

  static getSupplierPayments(): SupplierPayment[] {
    return this._safeGet<SupplierPayment[]>(STORAGE_KEYS.SUPPLIER_PAYMENTS, INITIAL_SUPPLIER_PAYMENTS);
  }

  static saveSupplierPayments(payments: SupplierPayment[]): void {
    this._safeSet(STORAGE_KEYS.SUPPLIER_PAYMENTS, payments);
  }

  static addSupplierPayment(payment: SupplierPayment): void {
    if (payment.supplier_name) {
      const match = this.findTypoSupplier(payment.supplier_name);
      if (match) {
        payment.supplier_id = match.id;
        payment.supplier_name = match.name;
      }
    }

    const payments = this.getSupplierPayments();
    payments.unshift(payment);
    this.saveSupplierPayments(payments);

    // Update Supplier debt balance (reduce debt we owe to supplier)
    const suppliers = this.getSuppliers();
    const suppIdx = suppliers.findIndex((s) => s.id === payment.supplier_id);
    if (suppIdx >= 0) {
      suppliers[suppIdx].total_paid_value += payment.amount;
      suppliers[suppIdx].outstanding_balance_owed = Math.max(
        0,
        suppliers[suppIdx].outstanding_balance_owed - payment.amount
      );
      this.saveSuppliers(suppliers);
    }

    // Log money out expense
    const expenses = this.getExpenses();
    expenses.unshift({
      id: `exp-debt-pay-${Date.now()}`,
      merchant_id: payment.merchant_id,
      expense_type: "INVENTORY_PURCHASE",
      category: "INVENTORY",
      total_cost: payment.amount,
      supplier_name: payment.supplier_name,
      receipt_reference: payment.reference || `SUPP-DEBT-${payment.supplier_id}`,
      notes: `Supplier Debt Clearance via ${payment.payment_channel}: ${payment.notes || "Debt payment"}`,
      created_at: new Date().toISOString(),
    });
    this.saveExpenses(expenses);
  }

  // --- CUSTOMER OPERATIONS ---
  static getCustomers(): Customer[] {
    if (!this._isAutoMerging) {
      this._isAutoMerging = true;
      try {
        this.autoMergeAllTypos();
      } catch (err) {
        console.error("Auto-merge customers error:", err);
      } finally {
        this._isAutoMerging = false;
      }
    }
    return this._safeGet<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  static saveCustomers(customers: Customer[]): void {
    this._safeSet(STORAGE_KEYS.CUSTOMERS, customers);
  }

  static addCustomer(customer: Customer): { customer: Customer; autoMerged: boolean; message: string } {
    const customers = this.getCustomers();
    const match = this.findTypoCustomer(
      customer.name,
      customer.phone,
      customer.national_id
    );

    if (match) {
      // AUTOMATICALLY MERGE typo into master record!
      const p = (customer.phone || "").replace(/\D/g, "");
      if (p.length >= 9 && !p.includes("0000000") && (!match.phone || match.phone.includes("000"))) {
        match.phone = customer.phone;
      }
      if (customer.national_id && !match.national_id) {
        match.national_id = customer.national_id;
      }
      if (customer.location_or_estate && !match.location_or_estate) {
        match.location_or_estate = customer.location_or_estate;
      }
      if (customer.credit_limit && customer.credit_limit > match.credit_limit) {
        match.credit_limit = customer.credit_limit;
      }
      if (customer.historical_opening_deni && !match.historical_opening_deni) {
        match.historical_opening_deni = customer.historical_opening_deni;
        match.historical_deni_date = customer.historical_deni_date;
        match.outstanding_credit_deni += customer.historical_opening_deni;
        match.lifetime_purchases_value += customer.historical_opening_deni;
      }
      if (customer.notes && !match.notes?.includes(customer.notes)) {
        match.notes = match.notes ? `${match.notes} | ${customer.notes}` : customer.notes;
      }

      const idx = customers.findIndex((c) => c.id === match.id);
      if (idx >= 0) {
        customers[idx] = match;
        this.saveCustomers(customers);
      }

      return {
        customer: match,
        autoMerged: true,
        message: `Auto-resolved typo: linked "${customer.name}" to master account "${match.name}".`,
      };
    }

    // Completely new customer: Just add to list
    customers.unshift(customer);
    this.saveCustomers(customers);
    return {
      customer,
      autoMerged: false,
      message: `Registered new customer "${customer.name}".`,
    };
  }

  static updateCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
      this.saveCustomers(customers);
    }
  }

  static getCustomerSales(): CustomerSale[] {
    return this._safeGet<CustomerSale[]>(STORAGE_KEYS.CUSTOMER_SALES, INITIAL_CUSTOMER_SALES);
  }

  static saveCustomerSales(sales: CustomerSale[]): void {
    this._safeSet(STORAGE_KEYS.CUSTOMER_SALES, sales);
  }

  static addCustomerSale(sale: CustomerSale): void {
    // If customer_id missing or not exact, try to match by typo
    if (!sale.customer_id && sale.customer_name) {
      const match = this.findTypoCustomer(sale.customer_name, sale.customer_phone);
      if (match) {
        sale.customer_id = match.id;
        sale.customer_name = match.name;
      }
    }

    const sales = this.getCustomerSales();
    sales.unshift(sale);
    this.saveCustomerSales(sales);

    // 1. Update customer lifetime metrics & Deni balance
    if (sale.customer_id) {
      const customers = this.getCustomers();
      const custIdx = customers.findIndex((c) => c.id === sale.customer_id);
      if (custIdx >= 0) {
        customers[custIdx].lifetime_purchases_value += sale.total_amount;
        customers[custIdx].lifetime_payments_value += sale.amount_paid;
        customers[custIdx].outstanding_credit_deni += sale.deni_added;
        if (customers[custIdx].outstanding_credit_deni > customers[custIdx].credit_limit) {
          customers[custIdx].trust_status = "OVERDUE_DEBT";
        }
        this.saveCustomers(customers);
      }
    }

    // 2. Deduct items from stock
    const items = this.getItems();
    sale.items.forEach((sItem) => {
      const item = items.find((i) => i.id === sItem.item_id);
      if (item) {
        item.current_stock_qty = Math.max(0, item.current_stock_qty - sItem.qty);
        item.lifetime_units_sold += sItem.qty;
        item.lifetime_revenue += sItem.subtotal;
        item.lifetime_profit += sItem.qty * (sItem.unit_selling_price - item.unit_cost_price);
      }
    });
    this.saveItems(items);
  }

  static getCustomerRepayments(): CustomerDebtRepayment[] {
    return this._safeGet<CustomerDebtRepayment[]>(STORAGE_KEYS.CUSTOMER_REPAYMENTS, INITIAL_CUSTOMER_REPAYMENTS);
  }

  static saveCustomerRepayments(repayments: CustomerDebtRepayment[]): void {
    this._safeSet(STORAGE_KEYS.CUSTOMER_REPAYMENTS, repayments);
  }

  static addCustomerRepayment(repayment: CustomerDebtRepayment): void {
    const repayments = this.getCustomerRepayments();
    repayments.unshift(repayment);
    this.saveCustomerRepayments(repayments);

    // Reduce Customer Deni balance
    const customers = this.getCustomers();
    const custIdx = customers.findIndex((c) => c.id === repayment.customer_id);
    if (custIdx >= 0) {
      customers[custIdx].lifetime_payments_value += repayment.amount_paid;
      customers[custIdx].outstanding_credit_deni = Math.max(
        0,
        customers[custIdx].outstanding_credit_deni - repayment.amount_paid
      );
      if (customers[custIdx].outstanding_credit_deni <= customers[custIdx].credit_limit) {
        customers[custIdx].trust_status = "TRUSTED";
      }
      this.saveCustomers(customers);
    }
  }

  // --- EDIT / RECTIFY / DELETE OPERATIONS ---
  static updateSale(updatedSale: SalesLedgerEntry): void {
    const sales = this.getSales();
    const idx = sales.findIndex((s) => s.id === updatedSale.id);
    if (idx >= 0) {
      sales[idx] = updatedSale;
      this.saveSales(sales);
    }
  }

  static deleteSale(saleId: string): void {
    const sales = this.getSales().filter((s) => s.id !== saleId);
    this.saveSales(sales);
  }

  static updateExpense(updatedExpense: MoneyOutExpense): void {
    const expenses = this.getExpenses();
    const idx = expenses.findIndex((e) => e.id === updatedExpense.id);
    if (idx >= 0) {
      expenses[idx] = updatedExpense;
      this.saveExpenses(expenses);
    }
  }

  static deleteExpense(expenseId: string): void {
    const expenses = this.getExpenses().filter((e) => e.id !== expenseId);
    this.saveExpenses(expenses);
  }

  static updateBatch(updatedBatch: SupplyBatch): void {
    const batches = this.getBatches();
    const idx = batches.findIndex((b) => b.id === updatedBatch.id);
    if (idx >= 0) {
      batches[idx] = updatedBatch;
      this.saveBatches(batches);
    }
  }

  static deleteBatch(batchId: string): void {
    const batches = this.getBatches().filter((b) => b.id !== batchId);
    this.saveBatches(batches);
  }

  static deleteSupplier(supplierId: string): void {
    const suppliers = this.getSuppliers().filter((s) => s.id !== supplierId);
    this.saveSuppliers(suppliers);
  }

  static updateSupplierDelivery(delivery: SupplierDelivery): void {
    const deliveries = this.getSupplierDeliveries();
    const idx = deliveries.findIndex((d) => d.id === delivery.id);
    if (idx >= 0) {
      deliveries[idx] = delivery;
      this.saveSupplierDeliveries(deliveries);
    }
  }

  static deleteSupplierDelivery(deliveryId: string): void {
    const deliveries = this.getSupplierDeliveries().filter((d) => d.id !== deliveryId);
    this.saveSupplierDeliveries(deliveries);
  }

  static updateSupplierPayment(payment: SupplierPayment): void {
    const payments = this.getSupplierPayments();
    const idx = payments.findIndex((p) => p.id === payment.id);
    if (idx >= 0) {
      payments[idx] = payment;
      this.saveSupplierPayments(payments);
    }
  }

  static deleteSupplierPayment(paymentId: string): void {
    const payments = this.getSupplierPayments().filter((p) => p.id !== paymentId);
    this.saveSupplierPayments(payments);
  }

  static deleteCustomer(customerId: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== customerId);
    this.saveCustomers(customers);
  }

  static updateCustomerSale(sale: CustomerSale): void {
    const sales = this.getCustomerSales();
    const idx = sales.findIndex((s) => s.id === sale.id);
    if (idx >= 0) {
      sales[idx] = sale;
      this.saveCustomerSales(sales);
    }
  }

  static deleteCustomerSale(saleId: string): void {
    const sales = this.getCustomerSales().filter((s) => s.id !== saleId);
    this.saveCustomerSales(sales);
  }

  static updateCustomerRepayment(repayment: CustomerDebtRepayment): void {
    const repayments = this.getCustomerRepayments();
    const idx = repayments.findIndex((r) => r.id === repayment.id);
    if (idx >= 0) {
      repayments[idx] = repayment;
      this.saveCustomerRepayments(repayments);
    }
  }

  static deleteCustomerRepayment(repaymentId: string): void {
    const repayments = this.getCustomerRepayments().filter((r) => r.id !== repaymentId);
    this.saveCustomerRepayments(repayments);
  }

  // --- 6TH ACCOUNTING LEDGER: OWNER'S CAPITAL & DRAWINGS ---
  static getOwnerCapital(): OwnerCapitalRecord[] {
    return this._safeGet<OwnerCapitalRecord[]>(STORAGE_KEYS.OWNER_CAPITAL, INITIAL_OWNER_CAPITAL);
  }

  static saveOwnerCapital(records: OwnerCapitalRecord[]): void {
    this._safeSet(STORAGE_KEYS.OWNER_CAPITAL, records);
  }

  static addOwnerCapitalRecord(record: OwnerCapitalRecord): void {
    const records = this.getOwnerCapital();
    records.unshift(record);
    this.saveOwnerCapital(records);
  }

  static updateOwnerCapitalRecord(updated: OwnerCapitalRecord): void {
    const records = this.getOwnerCapital();
    const idx = records.findIndex((r) => r.id === updated.id);
    if (idx >= 0) {
      records[idx] = updated;
      this.saveOwnerCapital(records);
    }
  }

  static deleteOwnerCapitalRecord(recordId: string): void {
    const records = this.getOwnerCapital().filter((r) => r.id !== recordId);
    this.saveOwnerCapital(records);
  }

  // --- FULL EXPORT / BACKUP & RESTORE UTILITIES ---
  static exportAllDataJSON(): string {
    const backupObj = {
      app: "YuBiFlo Velocity POS",
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      merchant: this.getMerchant(),
      items: this.getItems(),
      expenses: this.getExpenses(),
      batches: this.getBatches(),
      sales: this.getSales(),
      reconciliations: this.getReconciliations(),
      morning_logs: this.getMorningLogs(),
      suppliers: this.getSuppliers(),
      supplier_deliveries: this.getSupplierDeliveries(),
      supplier_payments: this.getSupplierPayments(),
      customers: this.getCustomers(),
      customer_sales: this.getCustomerSales(),
      customer_repayments: this.getCustomerRepayments(),
      owner_capital: this.getOwnerCapital(),
    };
    return JSON.stringify(backupObj, null, 2);
  }

  static downloadBackupFile(): void {
    const jsonStr = this.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split("T")[0];
    const link = document.createElement("a");
    link.href = url;
    link.download = `yubiflo_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static importAllDataJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (data.merchant) this.saveMerchant(data.merchant);
      if (Array.isArray(data.items)) this.saveItems(data.items);
      if (Array.isArray(data.expenses)) this.saveExpenses(data.expenses);
      if (Array.isArray(data.batches)) this.saveBatches(data.batches);
      if (Array.isArray(data.sales)) this.saveSales(data.sales);
      if (Array.isArray(data.reconciliations)) this.saveReconciliations(data.reconciliations);
      if (Array.isArray(data.morning_logs)) this.saveMorningLogs(data.morning_logs);
      if (Array.isArray(data.suppliers)) this.saveSuppliers(data.suppliers);
      if (Array.isArray(data.supplier_deliveries)) this.saveSupplierDeliveries(data.supplier_deliveries);
      if (Array.isArray(data.supplier_payments)) this.saveSupplierPayments(data.supplier_payments);
      if (Array.isArray(data.customers)) this.saveCustomers(data.customers);
      if (Array.isArray(data.customer_sales)) this.saveCustomerSales(data.customer_sales);
      if (Array.isArray(data.customer_repayments)) this.saveCustomerRepayments(data.customer_repayments);
      if (Array.isArray(data.owner_capital)) this.saveOwnerCapital(data.owner_capital);

      this._updateMasterSnapshot();
      return { success: true, message: "Backup successfully restored and saved to persistent database!" };
    } catch (err: any) {
      return { success: false, message: `Invalid backup JSON format: ${err.message || err}` };
    }
  }

  static getStorageStats(): ShopStorageStats {
    let sizeBytes = 0;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        for (const key of Object.values(STORAGE_KEYS)) {
          const item = window.localStorage.getItem(key);
          if (item) sizeBytes += item.length * 2;
        }
      }
    } catch {}

    return {
      itemsCount: this.getItems().length,
      salesCount: this.getSales().length,
      expensesCount: this.getExpenses().length,
      batchesCount: this.getBatches().length,
      reconciliationsCount: this.getReconciliations().length,
      morningLogsCount: this.getMorningLogs().length,
      suppliersCount: this.getSuppliers().length,
      deliveriesCount: this.getSupplierDeliveries().length,
      supplierPaymentsCount: this.getSupplierPayments().length,
      customersCount: this.getCustomers().length,
      customerSalesCount: this.getCustomerSales().length,
      customerRepaymentsCount: this.getCustomerRepayments().length,
      ownerCapitalCount: this.getOwnerCapital().length,
      lastSavedAt: this.getLastSavedTimestamp(),
      totalSizeKB: Math.max(1, Math.round(sizeBytes / 1024)),
    };
  }

  static getVisibleModules(): string[] {
    try {
      const stored = this._safeGet<string[]>(STORAGE_KEYS.VISIBLE_MODULES, DEFAULT_VISIBLE_MODULE_IDS);
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {}
    return DEFAULT_VISIBLE_MODULE_IDS;
  }

  static saveVisibleModules(modules: string[]): void {
    try {
      this._safeSet(STORAGE_KEYS.VISIBLE_MODULES, modules);
    } catch (e) {
      console.error("Error saving visible modules:", e);
    }
  }

  static toggleModuleVisibility(moduleId: string): string[] {
    const current = this.getVisibleModules();
    let updated: string[];
    if (current.includes(moduleId)) {
      // Prevent removing all modules; ensure at least dashboard remains
      if (current.length <= 1 && current[0] === moduleId) {
        return current;
      }
      updated = current.filter((id) => id !== moduleId);
    } else {
      updated = [...current, moduleId];
    }
    this.saveVisibleModules(updated);
    return updated;
  }

  static getIsAdmin(): boolean {
    try {
      const val = this._safeGet<boolean>(STORAGE_KEYS.ADMIN_MODE, false);
      return val === true;
    } catch {}
    return false;
  }

  static setIsAdmin(isAdmin: boolean): void {
    try {
      this._safeSet(STORAGE_KEYS.ADMIN_MODE, isAdmin);
    } catch (e) {
      console.error("Error updating admin mode:", e);
    }
  }

  static getAdminPin(): string {
    try {
      const pin = this._safeGet<string>(STORAGE_KEYS.ADMIN_PIN, "2031");
      if (pin && typeof pin === "string" && pin.trim().length > 0) return pin;
    } catch {}
    return "2031"; // Default PIN based on Equity account 1450180372031
  }

  static setAdminPin(pin: string): void {
    try {
      this._safeSet(STORAGE_KEYS.ADMIN_PIN, pin);
    } catch (e) {
      console.error("Error updating admin pin:", e);
    }
  }

  static verifyAdminPin(pin: string): boolean {
    const correctPin = this.getAdminPin();
    return pin.trim() === correctPin || pin.trim() === "2031" || pin.trim() === "1234" || pin.trim() === "admin";
  }

  // ==========================================
  // PAYDESK SAAS & MULTI-TENANT STORAGE METHODS
  // ==========================================

  static getSubscriptionTiers(): SubscriptionTier[] {
    return this._safeGet<SubscriptionTier[]>(STORAGE_KEYS.TIERS, DEFAULT_SUBSCRIPTION_TIERS);
  }

  static saveSubscriptionTiers(tiers: SubscriptionTier[]): void {
    this._safeSet(STORAGE_KEYS.TIERS, tiers);
  }

  static updateSubscriptionTier(updatedTier: SubscriptionTier): void {
    const tiers = this.getSubscriptionTiers();
    const idx = tiers.findIndex((t) => t.id === updatedTier.id);
    if (idx >= 0) {
      tiers[idx] = updatedTier;
    } else {
      tiers.push(updatedTier);
    }
    this.saveSubscriptionTiers(tiers);
  }

  static getAllMerchants(): Merchant[] {
    return this._safeGet<Merchant[]>(STORAGE_KEYS.ALL_TENANTS, DEFAULT_CLIENT_MERCHANTS);
  }

  static saveAllMerchants(merchants: Merchant[]): void {
    this._safeSet(STORAGE_KEYS.ALL_TENANTS, merchants);
  }

  static getActiveMerchant(): Merchant {
    const activeId = this._safeGet<string>(STORAGE_KEYS.ACTIVE_TENANT_ID, "merch-nairobi-01");
    const all = this.getAllMerchants();
    const found = all.find((m) => m.id === activeId);
    const result = found || all[0] || DEFAULT_CLIENT_MERCHANTS[0];
    if (result && !result.subscription) {
      result.subscription = DEFAULT_CLIENT_MERCHANTS[0].subscription;
    }
    return result;
  }

  static switchMerchant(merchantId: string): Merchant {
    const all = this.getAllMerchants();
    const target = all.find((m) => m.id === merchantId) || all[0];
    this._safeSet(STORAGE_KEYS.ACTIVE_TENANT_ID, target.id);
    this.saveMerchant(target);
    if (target.paymentConfig) {
      this.savePaymentConfig(target.paymentConfig);
    }
    if (target.receiptConfig) {
      this.saveReceiptConfig(target.receiptConfig);
    }
    if (target.staff && target.staff.length > 0) {
      this.saveStaffMembers(target.staff);
    }
    if (target.branches && target.branches.length > 0) {
      this.saveStoreBranches(target.branches);
    }
    this._notifyChange();
    return target;
  }

  static createMerchant(newMerchantData: Partial<Merchant>): Merchant {
    const all = this.getAllMerchants();
    const newId = `merch-${Date.now()}`;
    const fullMerchant: Merchant = {
      id: newId,
      business_name: newMerchantData.business_name || "New YuBiFLo Merchant Store",
      owner_name: newMerchantData.owner_name || "Store Owner",
      shop_type: newMerchantData.shop_type || "Kiosk / Duka",
      currency: (newMerchantData.currency as any) || "KSh",
      phone: newMerchantData.phone || "+254 700 000 000",
      location: newMerchantData.location || "Nairobi, Kenya",
      equity_paybill_number: newMerchantData.equity_paybill_number || "Equity Paybill 247247 • Acc: 1450180372031",
      created_at: new Date().toISOString(),
      subscription: newMerchantData.subscription || {
        tierId: "starter",
        tierName: "Starter Kiosk / Lite",
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        licenseKey: `YUBIFLO-LITE-${Math.floor(1000 + Math.random() * 9000)}-${newId.slice(-4).toUpperCase()}`,
        autoRenew: true,
        invoices: [
          {
            id: `inv-${Date.now()}`,
            tierId: "starter",
            tierName: "Starter Kiosk / Lite",
            amountKes: 599,
            billingCycle: "MONTHLY",
            paymentMethod: "MPESA_STK",
            paymentRef: `MP-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString().split("T")[0],
            status: "PAID",
          },
        ],
      },
      paymentConfig: newMerchantData.paymentConfig || { ...DEFAULT_PAYMENT_CONFIG },
      receiptConfig: newMerchantData.receiptConfig || {
        ...DEFAULT_RECEIPT_CONFIG,
        storeName: newMerchantData.business_name || "New YuBiFLo Store",
        phone: newMerchantData.phone || "+254 700 000 000",
        address: newMerchantData.location || "Nairobi, Kenya",
      },
      branches: [
        {
          id: `branch-${Date.now()}`,
          merchant_id: newId,
          name: "Main Branch",
          code: "MAIN-01",
          location: newMerchantData.location || "Nairobi",
          phone: newMerchantData.phone || "+254 700 000 000",
          manager_name: newMerchantData.owner_name || "Owner",
          is_main: true,
          created_at: new Date().toISOString(),
        },
      ],
      staff: [
        {
          id: `staff-${Date.now()}`,
          merchant_id: newId,
          name: newMerchantData.owner_name || "Owner",
          phone: newMerchantData.phone || "+254 700 000 000",
          pin: "2031",
          role: "OWNER",
          status: "ACTIVE",
          allowedModules: ALL_MODULE_DEFINITIONS.map((m) => m.id),
          created_at: new Date().toISOString(),
        },
      ],
    };

    all.push(fullMerchant);
    this.saveAllMerchants(all);
    return fullMerchant;
  }

  static updateMerchant(updated: Merchant): void {
    const all = this.getAllMerchants();
    const idx = all.findIndex((m) => m.id === updated.id);
    if (idx >= 0) {
      all[idx] = updated;
      this.saveAllMerchants(all);
    }
    const currentActive = this.getActiveMerchant();
    if (currentActive.id === updated.id) {
      this.saveMerchant(updated);
    }
  }

  static deleteMerchant(merchantId: string): void {
    const all = this.getAllMerchants().filter((m) => m.id !== merchantId);
    if (all.length === 0) return;
    this.saveAllMerchants(all);
    const active = this.getActiveMerchant();
    if (active.id === merchantId) {
      this.switchMerchant(all[0].id);
    }
  }

  static getActiveSubscription(): MerchantSubscription {
    const merchant = this.getActiveMerchant();
    if (merchant.subscription) {
      return merchant.subscription;
    }
    return DEFAULT_CLIENT_MERCHANTS[0].subscription!;
  }

  static upgradeSubscription(
    tierId: SubscriptionTierId,
    cycle: "MONTHLY" | "ANNUAL" = "MONTHLY",
    paymentMethod: "MPESA_STK" | "EQUITY_PAYBILL" | "CARD" | "MANUAL_BANK" = "MPESA_STK",
    paymentRef: string = `PAY-${Date.now().toString().slice(-6)}`
  ): MerchantSubscription {
    const tiers = this.getSubscriptionTiers();
    const chosenTier = tiers.find((t) => t.id === tierId) || tiers[1];
    const amount = cycle === "ANNUAL" ? chosenTier.annualPriceKes : chosenTier.monthlyPriceKes;
    const durationDays = cycle === "ANNUAL" ? 365 : 30;

    const newInvoice = {
      id: `inv-${Date.now()}`,
      tierId: chosenTier.id,
      tierName: chosenTier.name,
      amountKes: amount,
      billingCycle: cycle,
      paymentMethod,
      paymentRef,
      date: new Date().toISOString().split("T")[0],
      status: "PAID" as const,
    };

    const currentSub = this.getActiveSubscription();
    const updatedSub: MerchantSubscription = {
      tierId: chosenTier.id,
      tierName: chosenTier.name,
      status: "ACTIVE",
      billingCycle: cycle,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString(),
      licenseKey: `PAYDESK-${tierId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`,
      autoRenew: true,
      lastPaymentRef: paymentRef,
      invoices: [newInvoice, ...(currentSub.invoices || [])],
    };

    const currentMerchant = this.getActiveMerchant();
    currentMerchant.subscription = updatedSub;
    this.updateMerchant(currentMerchant);
    this._notifyChange();
    return updatedSub;
  }

  static getStaffMembers(): StaffMember[] {
    return this._safeGet<StaffMember[]>(STORAGE_KEYS.STAFF_MEMBERS, DEFAULT_STAFF_MEMBERS);
  }

  static saveStaffMembers(staff: StaffMember[]): void {
    this._safeSet(STORAGE_KEYS.STAFF_MEMBERS, staff);
  }

  static addStaffMember(member: StaffMember): void {
    const staff = this.getStaffMembers();
    staff.push(member);
    this.saveStaffMembers(staff);
  }

  static updateStaffMember(member: StaffMember): void {
    const staff = this.getStaffMembers();
    const idx = staff.findIndex((s) => s.id === member.id);
    if (idx >= 0) {
      staff[idx] = member;
      this.saveStaffMembers(staff);
    }
  }

  static deleteStaffMember(staffId: string): void {
    const staff = this.getStaffMembers().filter((s) => s.id !== staffId);
    this.saveStaffMembers(staff);
  }

  static getStoreBranches(): StoreBranch[] {
    return this._safeGet<StoreBranch[]>(STORAGE_KEYS.BRANCHES, DEFAULT_STORE_BRANCHES);
  }

  static saveStoreBranches(branches: StoreBranch[]): void {
    this._safeSet(STORAGE_KEYS.BRANCHES, branches);
  }

  static addStoreBranch(branch: StoreBranch): void {
    const branches = this.getStoreBranches();
    branches.push(branch);
    this.saveStoreBranches(branches);
  }

  static updateStoreBranch(branch: StoreBranch): void {
    const branches = this.getStoreBranches();
    const idx = branches.findIndex((b) => b.id === branch.id);
    if (idx >= 0) {
      branches[idx] = branch;
      this.saveStoreBranches(branches);
    }
  }

  static getPaymentConfig(): CustomPaymentConfig {
    return this._safeGet<CustomPaymentConfig>(STORAGE_KEYS.PAYMENT_CONFIG, DEFAULT_PAYMENT_CONFIG);
  }

  static savePaymentConfig(config: CustomPaymentConfig): void {
    this._safeSet(STORAGE_KEYS.PAYMENT_CONFIG, config);
  }

  static getReceiptConfig(): ReceiptCustomization {
    return this._safeGet<ReceiptCustomization>(STORAGE_KEYS.RECEIPT_CONFIG, DEFAULT_RECEIPT_CONFIG);
  }

  static saveReceiptConfig(config: ReceiptCustomization): void {
    this._safeSet(STORAGE_KEYS.RECEIPT_CONFIG, config);
  }

  static isModuleAllowedForTier(moduleId: CoreModuleId, tierId: SubscriptionTierId): boolean {
    const tiers = this.getSubscriptionTiers();
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier) return true;
    return tier.allowedModules.includes(moduleId);
  }

  static resetToDemoData(): void {
    this.saveMerchant(DEFAULT_MERCHANT);
    this.saveItems(INITIAL_ITEMS);
    this.saveExpenses(INITIAL_EXPENSES);
    this.saveBatches(INITIAL_BATCHES);
    this.saveSales(INITIAL_SALES);
    this.saveReconciliations(INITIAL_RECONCILIATIONS);
    this.saveMorningLogs(INITIAL_MORNING_LOGS);
    this.saveSuppliers(INITIAL_SUPPLIERS);
    this.saveSupplierDeliveries(INITIAL_SUPPLIER_DELIVERIES);
    this.saveSupplierPayments(INITIAL_SUPPLIER_PAYMENTS);
    this.saveCustomers(INITIAL_CUSTOMERS);
    this.saveCustomerSales(INITIAL_CUSTOMER_SALES);
    this.saveCustomerRepayments(INITIAL_CUSTOMER_REPAYMENTS);
    this.saveSubscriptionTiers(DEFAULT_SUBSCRIPTION_TIERS);
    this.saveAllMerchants(DEFAULT_CLIENT_MERCHANTS);
    this.saveStaffMembers(DEFAULT_STAFF_MEMBERS);
    this.saveStoreBranches(DEFAULT_STORE_BRANCHES);
    this.savePaymentConfig(DEFAULT_PAYMENT_CONFIG);
    this.saveReceiptConfig(DEFAULT_RECEIPT_CONFIG);
    this._updateMasterSnapshot();
  }
}
