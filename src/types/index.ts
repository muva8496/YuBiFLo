export type CoreModuleId =
  | "dashboard"
  | "velocity"
  | "quick_dump"
  | "morning_float"
  | "stock"
  | "people"
  | "t_ledgers"
  | "reconcile"
  | "analytics"
  | "sales"
  | "money_out"
  | "restock"
  | "ingestion"
  | "cashflow"
  | "schema"
  | "store_settings"
  | "saas_admin";

export interface ModuleDefinition {
  id: CoreModuleId;
  label: string;
  shortLabel?: string;
  shengLabel?: string;
  desc: string;
  category: "CORE_DAILY" | "OPERATIONS" | "ADMIN_ONLY";
  defaultVisible: boolean;
  adminOnly?: boolean;
  minTier?: "starter" | "pro" | "enterprise";
}

export type CurrencyCode = "KSh" | "NGN" | "GHS" | "UGX" | "TZS" | "ZAR" | "USD";

export type SubscriptionTierId = "starter" | "pro" | "enterprise" | "custom";
export type SubscriptionBillingCycle = "MONTHLY" | "ANNUAL";
export type SubscriptionStatus = "ACTIVE" | "TRIAL" | "EXPIRED" | "PAST_DUE";

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  badge: string;
  monthlyPriceKes: number;
  annualPriceKes: number;
  tagline: string;
  isPopular?: boolean;
  maxItems: number; // e.g. 50, 500, 99999
  maxCustomers: number; // e.g. 20, 200, 99999
  maxBranches: number; // e.g. 1, 3, 50
  maxStaffCashiers: number; // e.g. 1, 5, 50
  allowedModules: CoreModuleId[];
  features: string[];
  supportLevel: string;
}

export interface SubscriptionInvoice {
  id: string;
  tierId: SubscriptionTierId;
  tierName: string;
  amountKes: number;
  billingCycle: SubscriptionBillingCycle;
  paymentMethod: "MPESA_STK" | "EQUITY_PAYBILL" | "CARD" | "MANUAL_BANK";
  paymentRef: string;
  date: string;
  status: "PAID" | "PENDING";
  downloadUrl?: string;
}

export interface MerchantSubscription {
  tierId: SubscriptionTierId;
  tierName: string;
  status: SubscriptionStatus;
  billingCycle: SubscriptionBillingCycle;
  startedAt: string;
  expiresAt: string;
  licenseKey: string;
  autoRenew: boolean;
  lastPaymentRef?: string;
  invoices: SubscriptionInvoice[];
}

export type StaffRole = "OWNER" | "MANAGER" | "CASHIER" | "AUDITOR";

export interface StaffMember {
  id: string;
  merchant_id: string;
  name: string;
  phone: string;
  pin: string;
  role: StaffRole;
  branch_id?: string;
  branch_name?: string;
  status: "ACTIVE" | "INACTIVE";
  allowedModules: CoreModuleId[];
  created_at: string;
}

export interface StoreBranch {
  id: string;
  merchant_id: string;
  name: string;
  code: string;
  location: string;
  phone: string;
  manager_name?: string;
  is_main: boolean;
  created_at: string;
}

export interface CustomPaymentConfig {
  useEquityPaybill: boolean;
  equityPaybillNumber: string; // e.g. "1450180372031"
  useMpesaFloat: boolean;
  mpesaFloatNumber?: string;
  useMpesaTill: boolean;
  mpesaTillNumber?: string;
  useKcbPaybill?: boolean;
  kcbPaybillNumber?: string;
  useCashDrawer: boolean;
  paymentInstructions?: string;
}

export interface ReceiptCustomization {
  storeName: string;
  tagline: string;
  phone: string;
  address: string;
  taxPin?: string;
  footerMessage: string;
  showBarcode: boolean;
  showPaymentDetails: boolean;
}

export interface Merchant {
  id: string;
  business_name: string;
  owner_name: string;
  shop_type: "Retail Store / Kiosk" | "Kiosk / Duka" | "Mini-Mart" | "Agrovet" | "Bar & Liquor Store" | "Wholesale & Retail" | "Bakery & Eatery" | string;
  currency: CurrencyCode;
  phone: string;
  location: string;
  equity_paybill_number?: string;
  mpesa_till_number?: string;
  created_at: string;
  // SaaS Extended properties
  subscription?: MerchantSubscription;
  branches?: StoreBranch[];
  staff?: StaffMember[];
  paymentConfig?: CustomPaymentConfig;
  receiptConfig?: ReceiptCustomization;
  customLogoUrl?: string;
  isDemoTenant?: boolean;
}

export interface InventoryItem {
  id: string;
  merchant_id: string;
  name: string;
  category: string;
  unit_cost_price: number;
  unit_selling_price: number;
  current_stock_qty: number;
  unit_of_measure: "units" | "crates" | "bales" | "packets" | "bottles" | "kg" | "sachets" | "tins" | "boxes";
  reorder_point: number;
  last_restocked_at?: string;
  total_batches_count: number;
  lifetime_units_sold: number;
  lifetime_revenue: number;
  lifetime_profit: number;
}

export type ExpenseCategory =
  | "INVENTORY"
  | "RENT"
  | "ELECTRICITY_TOKENS"
  | "TRANSPORT_BODA"
  | "WAGES"
  | "LICENSES_KANJO"
  | "AIRTIME_DATA"
  | "SECURITY"
  | "OTHER";

export interface MoneyOutExpense {
  id: string;
  merchant_id: string;
  item_id?: string;
  item_name?: string;
  expense_type: "INVENTORY_PURCHASE" | "SHOP_EXPENSE";
  category: ExpenseCategory;
  total_cost: number;
  qty_purchased?: number;
  unit_cost_price?: number;
  unit_selling_price?: number;
  supplier_name: string;
  receipt_reference?: string;
  notes?: string;
  created_at: string;
}

export type BatchStatus = "ACTIVE" | "CONSUMED_SOLD" | "SPOILED_WRITTEN_OFF";

export interface SupplyBatch {
  id: string;
  merchant_id: string;
  item_id: string;
  item_name: string;
  batch_number: number;
  initial_qty: number;
  remaining_qty: number;
  unit_cost_price: number;
  unit_selling_price: number;
  status: BatchStatus;
  received_at: string;
  closed_at?: string;
  spoilage_loss_qty: number;
  notes?: string;
}

export type TriggerReason =
  | "RESTOCK_ARRIVAL"
  | "REVERSE_AUDIT"
  | "MANUAL_COUNT"
  | "HISTORICAL_INGESTION"
  | "DAILY_CLOSING";

export interface SalesLedgerEntry {
  id: string;
  merchant_id: string;
  item_id: string;
  item_name: string;
  batch_id: string;
  batch_number: number;
  qty_sold: number;
  unit_cost_price: number;
  unit_selling_price: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  gross_margin_percent: number;
  sales_velocity_hours: number;
  sales_velocity_days: number;
  units_per_day: number;
  batch_start_date: string;
  batch_end_date: string;
  trigger_reason: TriggerReason;
  notes?: string;
  created_at: string;
}

export type ReconciliationStatus = "PERFECT_MATCH" | "LEAKAGE_DETECTED" | "SURPLUS_DETECTED";

export interface ItemAuditLine {
  item_id: string;
  item_name: string;
  opening_stock: number;
  incoming_supply: number;
  ending_counted_stock: number;
  implied_sales_volume: number;
  unit_selling_price: number;
  unit_cost_price: number;
  expected_revenue: number;
  expected_profit: number;
}

export interface ReconciliationRecord {
  id: string;
  merchant_id: string;
  date: string;
  opening_stock_value: number;
  incoming_supply_value: number;
  ending_stock_value: number;
  implied_sales_volume: number;
  total_expected_revenue: number;
  total_expected_cogs: number;
  actual_equity_paybill?: number;
  actual_mpesa: number;
  actual_cash: number;
  actual_credit_deni: number;
  total_actual_collected: number;
  discrepancy_gap: number;
  status: ReconciliationStatus;
  item_audits: ItemAuditLine[];
  leakage_breakdown?: {
    probable_reason?: string;
    deni_risk?: number;
    cashier_shortage?: number;
    spoilage_unrecorded?: number;
  };
  notes?: string;
  ai_diagnosis?: string;
  created_at: string;
}

export interface DailyMorningFloatLog {
  id: string;
  merchant_id: string;
  date: string; // YYYY-MM-DD
  recorded_time: string; // "05:57 AM" / "0557 HRS"
  // 1. M-Pesa Electronic Float (SIM line balance for deposits, withdrawals & agent transfers - No M-Pesa Till)
  mpesa_electronic_float: number; // M-Pesa SIM E-Float balance
  mpesa_till_balance?: number; // Optional legacy field (No M-Pesa Till in use)
  mpesa_agency_cash_drawer?: number; // Optional legacy field (cash is unified in cash_drawer_balance)
  
  // Legacy alias compatibility
  mpesa_opening_float?: number;
  mpesa_closing_float?: number;
  mpesa_till_sales?: number;

  // 2. Equity Paybill (Acc: 1450180372031 - For customer goods payments)
  equity_paybill_acc_number?: string; // Default: "1450180372031"
  equity_paybill_balance: number; // Current 05:57 balance in Paybill acc
  equity_paybill_opening?: number;
  equity_paybill_closing?: number;
  equity_paybill_sales?: number;

  // 3. Unified Physical Cash Drawer (Same cash drawer for both Duka sales and M-Pesa cash-in/cash-out)
  cash_drawer_balance: number; // Single physical till holding all hard notes & coins in the shop
  cash_drawer_opening?: number;
  cash_drawer_closing?: number;
  cash_sales?: number;

  // Computed Aggregations (Single 0557 Morning Snapshot)
  total_morning_liquid: number; // Total combined liquid capital = M-Pesa E-Float + Equity Paybill + Cash Drawer
  total_opening_liquid?: number;
  total_daily_sales?: number;
  notes?: string;
  created_at: string;
}

export interface RawReceiptItem {
  itemName: string;
  category?: string;
  qtyPurchased: number;
  unitOfMeasure?: string;
  totalCost: number;
  unitCostPrice: number;
  suggestedUnitSellingPrice: number;
}

export interface ExtractedReceipt {
  receiptId: string;
  supplierName: string;
  receiptDate: string;
  items: RawReceiptItem[];
  notes?: string;
  rawText?: string;
}

// ----------------------------------------------------
// PEOPLE LEDGER: SUPPLIERS & CUSTOMERS
// ----------------------------------------------------

export type SupplierPaymentTerms =
  | "CASH_ON_DELIVERY"
  | "CREDIT_7_DAYS"
  | "CREDIT_14_DAYS"
  | "CREDIT_30_DAYS"
  | "CONSIGNMENT";

export interface Supplier {
  id: string;
  merchant_id: string;
  name: string;
  aliases?: string[]; // Colloquial nicknames, trade names, or merged variations (e.g. "John wa cakes", "lux hhouse wholesalers")
  phone: string;
  national_id?: string; // Contact Person / Driver / Owner National ID (OID)
  driver_national_id?: string;
  contact_person?: string;
  goods_supplied?: string; // Goods or product commodities he/she supplies (e.g. "Maize Flour, Sugar, Cooking Oil")
  category: string; // e.g. "Dairy & Fresh", "Flour Millers & Grain", "Edibles & Fats", "Beverages"
  location?: string;
  payment_terms: SupplierPaymentTerms;
  total_supplied_value: number;
  total_paid_value: number;
  outstanding_balance_owed: number; // Positive = We owe money to supplier
  bank_or_paybill_details?: string;
  notes?: string;
  created_at: string;
}

export interface SupplierDeliveryItem {
  item_id?: string;
  item_name: string;
  qty: number;
  unit_of_measure: string;
  unit_cost_price: number;
  unit_selling_price: number;
  subtotal: number;
}

export interface SupplierDelivery {
  id: string;
  merchant_id: string;
  supplier_id: string;
  supplier_name: string;
  delivery_date: string;
  invoice_or_delivery_note?: string;
  items: SupplierDeliveryItem[];
  total_amount: number;
  amount_paid: number;
  balance_remaining: number; // Debt owed by our business on this supply drop
  payment_channel: "EQUITY_PAYBILL" | "MPESA_TILL" | "CASH" | "CREDIT_UNPAID" | "SPLIT";
  status: "PAID" | "PARTIALLY_PAID" | "UNPAID_CREDIT";
  notes?: string;
  created_at: string;
}

export interface SupplierPayment {
  id: string;
  merchant_id: string;
  supplier_id: string;
  supplier_name: string;
  amount: number;
  payment_channel: "EQUITY_PAYBILL" | "MPESA_TILL" | "CASH" | "BANK_TRANSFER";
  reference?: string;
  date: string;
  notes?: string;
  created_at: string;
}

export type CustomerType =
  | "RETAIL_REGULAR"
  | "MAMA_MBOGA"
  | "BODA_RIDER"
  | "LOCAL_EATERY"
  | "WHOLESALE_BUYER"
  | "NEIGHBORHOOD_RESIDENT";

export type CustomerPaymentPreference = "CASH" | "EQUITY_PAYBILL" | "MPESA_TILL" | "CREDIT_DENI";

export type CustomerTrustStatus = "TRUSTED" | "GOOD_STANDING" | "OVERDUE_DEBT" | "BLOCKED_CREDIT";

export interface Customer {
  id: string;
  merchant_id: string;
  name: string;
  aliases?: string[]; // Colloquial nicknames, estate names, or merged variations (e.g. "Mama Mary wa Ndizi")
  phone: string;
  national_id?: string; // Kenyan National ID (critical for KYC, deni & debt tracking)
  goods_bought?: string; // Goods or commodity items he/she regularly buys (e.g. "Bread, Milk, Soap, Unga")
  customer_type: CustomerType;
  location_or_estate?: string;
  credit_limit: number;
  outstanding_credit_deni: number; // Deni owed by customer to our shop
  historical_opening_deni?: number; // Debt carried forward from last month or unlisted stock
  historical_deni_date?: string; // Date of historical debt accrual (e.g. last month)
  lifetime_purchases_value: number;
  lifetime_payments_value: number;
  trust_status: CustomerTrustStatus;
  preferred_payment_method: CustomerPaymentPreference;
  notes?: string;
  created_at: string;
}

export interface CustomerSaleItem {
  item_id: string;
  item_name: string;
  qty: number;
  unit_selling_price: number;
  subtotal: number;
}

export interface CustomerSale {
  id: string;
  merchant_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  date: string;
  items: CustomerSaleItem[];
  total_amount: number;
  amount_paid: number;
  payment_channel: "CASH" | "EQUITY_PAYBILL" | "MPESA_TILL" | "CREDIT_DENI" | "SPLIT";
  deni_added: number;
  status: "SETTLED" | "PARTIAL_DENI" | "FULL_DENI";
  notes?: string;
  created_at: string;
}

export interface CustomerDebtRepayment {
  id: string;
  merchant_id: string;
  customer_id: string;
  customer_name: string;
  amount_paid: number;
  payment_channel: "CASH" | "EQUITY_PAYBILL" | "MPESA_TILL";
  reference?: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface IngestionBatchResult {
  processedReceiptsCount: number;
  totalExpensesLogged: number;
  generatedSalesEntries: SalesLedgerEntry[];
  derivedTotalRevenue: number;
  derivedTotalProfit: number;
  itemsUpdated: string[];
}

// ----------------------------------------------------
// 6 CLASSICAL ACCOUNTING T-LEDGERS & PROPRIETOR CAPITAL
// ----------------------------------------------------

export type TLedgerType =
  | "CREDITORS_PURCHASES" // 1. Suppliers / Accounts Payable
  | "DEBTORS_SALES" // 2. Customers / Accounts Receivable / Deni
  | "NOMINAL_EXPENSES" // 3. Operating Overheads & Costs
  | "CASH_LIQUID" // 4. Cash Book / Liquid Assets (M-Pesa, Paybill, Drawer)
  | "STOCK_INVENTORY" // 5. Merchandise Asset & COGS
  | "OWNER_CAPITAL_DRAWINGS"; // 6. Proprietor Capital, Equity & Personal Drawings

export interface OwnerCapitalRecord {
  id: string;
  merchant_id: string;
  entry_type: "CAPITAL_INJECTION" | "PERSONAL_DRAWING" | "RETAINED_PROFIT_TRANSFER";
  amount: number;
  payment_channel: "CASH" | "MPESA_SIM" | "EQUITY_PAYBILL" | "BANK";
  purpose_or_reason: string; // e.g. "Initial business seed capital", "School fees withdrawal", "Emergency personal drawing"
  recipient_or_contributor: string; // e.g. "Wanjiku Mukangai (Owner)"
  date: string;
  notes?: string;
  created_at: string;
}

export interface TAccountEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  entity_name?: string;
  amount: number;
  payment_channel?: string;
  category?: string;
}

export interface TAccountLedger {
  id: string;
  title: string;
  subtitle: string;
  type: TLedgerType;
  account_code: string;
  nature: "ASSET_DR" | "LIABILITY_CR" | "EXPENSE_DR" | "EQUITY_CR" | "REVENUE_CR";
  debits: TAccountEntry[]; // Dr Side (Left)
  credits: TAccountEntry[]; // Cr Side (Right)
  total_debit: number;
  total_credit: number;
  balance_c_d: number; // Balance carried down
  balance_side: "DEBIT" | "CREDIT" | "BALANCED";
}

// ----------------------------------------------------
// ENTITY RANKING & TIERING MODELS
// ----------------------------------------------------

export type SupplierTier = "TIER_1_STRATEGIC" | "TIER_2_CORE" | "TIER_3_REGULAR" | "AD_HOC";

export interface SupplierRanking {
  supplier: Supplier;
  rank: number;
  tier: SupplierTier;
  total_volume: number;
  total_paid: number;
  outstanding_owed: number;
  deliveries_count: number;
  fulfillment_rate: number; // e.g. 98%
  settlement_speed_days: number;
  reliability_score: number; // 0 - 100
  stars: number; // 1 to 5
}

export type CustomerTier =
  | "VIP_WHOLESALE"
  | "KEY_REGULAR"
  | "LOYAL_NEIGHBORHOOD"
  | "CASUAL_RETAIL"
  | "CREDIT_RISK";

export type CustomerTrustGrade = "A+" | "A" | "B" | "C" | "D";

export type CustomerDebtStatusBadge =
  | "DEBT_CLEARED_TOP_REPAYER"
  | "ACTIVE_LEAST_DENI"
  | "MODERATE_DENI"
  | "LAST_MONTH_OVERDUE"
  | "NO_CREDIT_HISTORY";

export interface CustomerRanking {
  customer: Customer;
  rank: number;
  tier: CustomerTier;
  lifetime_spend: number;
  sales_count: number;
  avg_basket_value: number;
  outstanding_deni: number;
  credit_utilization_pct: number;
  repayment_promptness_score: number; // 0 - 100
  trust_grade: CustomerTrustGrade;
  had_debt_before: boolean;
  total_debt_accrued: number;
  total_debt_repaid: number;
  debt_status_badge: CustomerDebtStatusBadge;
  has_last_month_debt?: boolean;
}
