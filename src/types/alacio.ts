export interface InventoryItem {
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

export interface CustomerDebtor {
  id: string;
  name: string;
  phone: string;
  debt_balance: number;
  credit_limit: number;
  last_transaction_date: string;
  notes?: string;
}

export interface FloatDenomination {
  value: number;
  type: "note" | "coin";
  label: string;
  count: number;
}

export interface SalesLedgerItem {
  id: string;
  timestamp: string;
  customer_name: string;
  items_summary: string;
  total_amount: number;
  cash_paid: number;
  mpesa_paid: number;
  debt_amount: number;
  payment_method: "CASH" | "MPESA" | "SPLIT" | "CREDIT";
}

export interface PayoutOrDrawing {
  id: string;
  timestamp: string;
  amount: number;
  type: "BUSINESS_EXPENSE" | "OWNER_DRAWING" | "SUPPLIER_PAYOUT";
  notes: string;
  resolved_gap_id?: string;
}

export interface MpesaStatementRecord {
  id: string;
  receipt_no: string;
  time: string;
  details: string;
  amount: number;
  status: "MATCHED" | "UNMATCHED_INFLOW" | "UNMATCHED_OUTFLOW";
}

export interface ReconciliationAudit {
  id: string;
  date: string;
  expected_stock_sales: number;
  physical_cash: number;
  mpesa_statement: number;
  unlogged_credit: number;
  discrepancy_gap: number;
  status: "BALANCED" | "LEAKAGE" | "SURPLUS";
  sealed_at: string;
  resolved_drawings_sum?: number;
}

export interface WarehouseBatch {
  id: string;
  item_id: number | string;
  item_name: string;
  category: string;
  batch_number: string;
  supplier_name: string;
  bulk_quantity: number;
  unit_type: string;
  bulk_cost_per_unit: number;
  total_batch_cost: number;
  storage_location: string;
  reorder_threshold: number;
  received_date: string;
  expiry_date?: string;
  status: "IN_STORAGE" | "LOW_BUFFER" | "DEPLETED";
}

export interface AlacioKpis {
  total_active_shelf_retail_value: number;
  total_capital_invested: number;
  locked_in_potential_gross_profit: number;
  avg_markup_percentage: number;
  total_active_items: number;
  warehouse_bulk_value?: number;
  warehouse_total_units?: number;
}

export type FreemiumTier = "FREE_STARTER" | "PAID_BLUEPRINT" | "PREMIUM_AGENCY";

export interface Blueprint {
  id: string;
  name: string;
  badge: string;
  industry: string;
  tagline: string;
  description: string;
  status: "ACTIVE" | "UPCOMING" | "REGULATED_SANDBOX";
  items_seed_count: number;
}

export interface ProjectCaseStudy {
  id: string;
  client_name: string;
  client_type: string;
  location: string;
  evidence_period: string;
  before_metrics: {
    cash_leakage_monthly: string;
    inventory_tracking: string;
    owner_drawings: string;
    stockout_frequency: string;
  };
  after_metrics: {
    cash_gap_reconciliation: string;
    shelf_value_locked: string;
    payout_categorization: string;
    financial_health_score: string;
  };
  consented_by: string;
}

export interface AlacioMasterState {
  inventory: InventoryItem[];
  warehouse: WarehouseBatch[];
  customers: CustomerDebtor[];
  floatDenominations: FloatDenomination[];
  salesLedger: SalesLedgerItem[];
  payouts: PayoutOrDrawing[];
  mpesaStatements: MpesaStatementRecord[];
  reconciliations: ReconciliationAudit[];
  kpis: AlacioKpis;
  cash_register_balance: number;
  mpesa_float_balance: number;
  equitel_account_balance: number;
  currency: string;
  last_updated: string;
  tier: FreemiumTier;
  vcr_daily_count: number;
  vcr_customer_consent: boolean;
  clean_trading_days: number; // e.g. 18 of 30 clean trading days logged before Tier 3 AI
}
