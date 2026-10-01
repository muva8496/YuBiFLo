import {
  pgTable,
  text,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

// 0. Tenants & Tenant Configurations (Multi-Client Blueprints)
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  businessName: text("business_name").notNull(),
  blueprintType: text("blueprint_type").notNull(),
  currency: text("currency").default("KSh"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenantConfigs = pgTable("tenant_configs", {
  tenantId: text("tenant_id").primaryKey().references(() => tenants.id),
  pipelineSettings: jsonb("pipeline_settings").default({
    enable_restock_trigger: true,
    auto_close_previous_batch: true,
    enable_ocr_ingestion: false,
    enable_voice_nlp: true,
  }).notNull(),
  reconciliationThreshold: doublePrecision("reconciliation_threshold").default(200.0),
  categories: text("categories").array().notNull(),
  unitTypes: text("unit_types").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 0b. Isolated Multi-Tenant Tables (with RLS support)
export const tenantInventory = pgTable("tenant_inventory", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unitType: text("unit_type").notNull(),
  unitCost: doublePrecision("unit_cost").default(0).notNull(),
  unitRetail: doublePrecision("unit_retail").default(0).notNull(),
  currentStock: doublePrecision("current_stock").default(0).notNull(),
  lowStockThreshold: doublePrecision("low_stock_threshold").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenantSupplyBatches = pgTable("tenant_supply_batches", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  itemId: text("item_id").references(() => tenantInventory.id).notNull(),
  batchQty: doublePrecision("batch_qty").notNull(),
  unitCost: doublePrecision("unit_cost").notNull(),
  unitRetail: doublePrecision("unit_retail").notNull(),
  status: text("status").default("ACTIVE"),
  receivedAt: timestamp("received_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const tenantSalesLedger = pgTable("tenant_sales_ledger", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  itemId: text("item_id").references(() => tenantInventory.id).notNull(),
  batchId: text("batch_id").references(() => tenantSupplyBatches.id),
  qtySold: doublePrecision("qty_sold").notNull(),
  totalRevenue: doublePrecision("total_revenue").notNull(),
  grossProfit: doublePrecision("gross_profit").notNull(),
  turnoverHours: doublePrecision("turnover_hours"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 1. Merchants / Store Profiles / Workspaces
export const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  name: text("name"),
  businessType: text("business_type").default("Retail / Mini-mart"),
  storeName: text("store_name").notNull(),
  ownerName: text("owner_name"),
  currency: text("currency").default("KSh").notNull(),
  location: text("location"),
  phone: text("phone"),
  taxPin: text("tax_pin"),
  bankDetails: text("bank_details"),
  defaultCashFloatTarget: doublePrecision("default_cash_float_target").default(0),
  defaultEFloatTarget: doublePrecision("default_e_float_target").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Master Inventory Items
export const inventoryItems = pgTable("inventory_items", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").references(() => merchants.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unitType: text("unit_type").default("packets"), // packets, bales, bottles, crates
  unitCost: doublePrecision("unit_cost").default(0),
  unitRetail: doublePrecision("unit_retail").default(0),
  currentStock: doublePrecision("current_stock").default(0).notNull(),
  lowStockThreshold: doublePrecision("low_stock_threshold").default(5),
  // Legacy & extended compatibility fields
  sku: text("sku"),
  unit: text("unit").default("pcs").notNull(),
  defaultUnitCost: doublePrecision("default_unit_cost").default(0).notNull(),
  defaultRetailPrice: doublePrecision("default_retail_price").default(0).notNull(),
  reorderLevel: doublePrecision("reorder_level").default(5).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Suppliers
export const suppliers = pgTable("suppliers", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").references(() => merchants.id).notNull(),
  name: text("name").notNull(),
  aliases: jsonb("aliases").$type<string[]>().default([]),
  phone: text("phone"),
  nationalId: text("national_id"),
  driverNationalId: text("driver_national_id"),
  contactPerson: text("contact_person"),
  category: text("category").default("General"),
  location: text("location"),
  paymentTerms: text("payment_terms").default("CASH_ON_DELIVERY"),
  totalSuppliedValue: doublePrecision("total_supplied_value").default(0).notNull(),
  totalPaidValue: doublePrecision("total_paid_value").default(0).notNull(),
  outstandingBalanceOwed: doublePrecision("outstanding_balance_owed").default(0).notNull(),
  bankOrPaybillDetails: text("bank_or_paybill_details"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Customers
export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").references(() => merchants.id).notNull(),
  name: text("name").notNull(),
  aliases: jsonb("aliases").$type<string[]>().default([]),
  phone: text("phone"),
  nationalId: text("national_id"),
  customerType: text("customer_type").default("WALK_IN"),
  creditLimit: doublePrecision("credit_limit").default(0),
  outstandingCreditDeni: doublePrecision("outstanding_credit_deni").default(0).notNull(),
  totalPurchasesValue: doublePrecision("total_purchases_value").default(0).notNull(),
  totalRepaidValue: doublePrecision("total_repaid_value").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Supply Delivery Batches (Restock Triggers)
export const supplyBatches = pgTable("supply_batches", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").references(() => merchants.id).notNull(),
  itemId: text("item_id").references(() => inventoryItems.id).notNull(),
  batchQty: doublePrecision("batch_qty").default(0),
  unitCost: doublePrecision("unit_cost").default(0),
  unitRetail: doublePrecision("unit_retail").default(0),
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, CLOSED_SOLD
  receivedAt: timestamp("received_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  // Legacy & extended compatibility fields
  supplierId: text("supplier_id").references(() => suppliers.id),
  batchNumber: text("batch_number").default("1"),
  quantityReceived: doublePrecision("quantity_received").default(0),
  quantityRemaining: doublePrecision("quantity_remaining").default(0),
  targetRetailPrice: doublePrecision("target_retail_price").default(0),
  deliveryDate: timestamp("delivery_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Implied Sales Ledger (Auto-generated on Restock)
export const salesLedger = pgTable("sales_ledger", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").references(() => merchants.id).notNull(),
  itemId: text("item_id").references(() => inventoryItems.id).notNull(),
  batchId: text("batch_id").references(() => supplyBatches.id),
  qtySold: doublePrecision("qty_sold").default(0),
  unitRetail: doublePrecision("unit_retail").default(0),
  totalRevenue: doublePrecision("total_revenue").default(0),
  grossProfit: doublePrecision("gross_profit").default(0),
  turnoverHours: doublePrecision("turnover_hours"),
  createdAt: timestamp("created_at").defaultNow(),
  // Legacy & extended compatibility fields
  customerId: text("customer_id").references(() => customers.id),
  quantitySold: doublePrecision("quantity_sold").default(0),
  unitPriceSold: doublePrecision("unit_price_sold").default(0),
  totalAmount: doublePrecision("total_amount").default(0),
  paymentMethod: text("payment_method").default("CASH"),
  costBasis: doublePrecision("cost_basis").default(0),
  soldAt: timestamp("sold_at").defaultNow(),
});

// 7. Money Out / Expenses
export const moneyOut = pgTable("money_out", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").references(() => merchants.id).notNull(),
  category: text("category").notNull(),
  amount: doublePrecision("amount").notNull(),
  recipient: text("recipient"),
  paymentMethod: text("payment_method").default("CASH").notNull(),
  expenseType: text("expense_type").default("OPERATIONAL").notNull(),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  incurredAt: timestamp("incurred_at").defaultNow().notNull(),
});

// 8. Daily Morning Logs (05:57 AM Snapshots)
export const dailyMorningLogs = pgTable("daily_morning_logs", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").references(() => merchants.id).notNull(),
  logDate: text("log_date").notNull(),
  cashFloat: doublePrecision("cash_float").default(0).notNull(),
  eFloatMpesa: doublePrecision("e_float_mpesa").default(0).notNull(),
  bankFloat: doublePrecision("bank_float").default(0).notNull(),
  totalOpeningFloat: doublePrecision("total_opening_float").default(0).notNull(),
  isLocked: boolean("is_locked").default(true).notNull(),
  lockedAt: timestamp("locked_at").defaultNow().notNull(),
});

// 9. Reconciliations & Cash Gap Audits
export const reconciliations = pgTable("reconciliations", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").references(() => merchants.id).notNull(),
  reconciliationDate: text("reconciliation_date").notNull(),
  expectedCash: doublePrecision("expected_cash").notNull(),
  actualCashCounted: doublePrecision("actual_cash_counted").notNull(),
  varianceGap: doublePrecision("variance_gap").notNull(),
  status: text("status").default("BALANCED").notNull(),
  notes: text("notes"),
  reconciledAt: timestamp("reconciled_at").defaultNow().notNull(),
});
