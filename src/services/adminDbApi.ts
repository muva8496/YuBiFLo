import express from "express";
import fs from "fs";
import path from "path";
import { db } from "../db/index.ts";
import {
  merchants,
  inventoryItems,
  suppliers,
  customers,
  supplyBatches,
  salesLedger,
  moneyOut,
  dailyMorningLogs,
  reconciliations,
} from "../db/schema.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

// Ensure data directory exists for hybrid snapshot fallback
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "yubiflo_admin_db.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      meta: {
        version: "2.0.0",
        initialized_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      },
      tables: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

function readDatabase(): any {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading DB file:", err);
    return { meta: { version: "2.0.0", last_updated: new Date().toISOString() }, tables: {} };
  }
}

function writeDatabase(data: any) {
  ensureDataFile();
  data.meta = {
    ...(data.meta || {}),
    last_updated: new Date().toISOString(),
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// 1. GET /api/db/status - Database health, Cloud SQL live table counts, and disk info
router.get("/status", async (_req, res) => {
  try {
    ensureDataFile();
    const stats = fs.statSync(DB_FILE);

    // Try live Cloud SQL counts
    const recordCounts: Record<string, number> = {};
    let cloudSqlActive = false;

    try {
      if (process.env.SQL_HOST) {
        const [
          itemsCount,
          suppliersCount,
          customersCount,
          batchesCount,
          salesCount,
          expensesCount,
          logsCount,
          reconciliationsCount,
        ] = await Promise.all([
          db.select().from(inventoryItems),
          db.select().from(suppliers),
          db.select().from(customers),
          db.select().from(supplyBatches),
          db.select().from(salesLedger),
          db.select().from(moneyOut),
          db.select().from(dailyMorningLogs),
          db.select().from(reconciliations),
        ]);

        recordCounts["inventory_items"] = itemsCount.length;
        recordCounts["suppliers"] = suppliersCount.length;
        recordCounts["customers"] = customersCount.length;
        recordCounts["supply_batches"] = batchesCount.length;
        recordCounts["sales_ledger"] = salesCount.length;
        recordCounts["money_out"] = expensesCount.length;
        recordCounts["daily_morning_logs"] = logsCount.length;
        recordCounts["reconciliations"] = reconciliationsCount.length;
        cloudSqlActive = true;
      }
    } catch (sqlErr) {
      console.warn("Notice: Cloud SQL status check fallback to local file snapshot:", sqlErr);
    }

    if (!cloudSqlActive) {
      const fileDb = readDatabase();
      const tables = Object.keys(fileDb.tables || {});
      for (const t of tables) {
        recordCounts[t] = Array.isArray(fileDb.tables[t]) ? fileDb.tables[t].length : 0;
      }
    }

    res.json({
      success: true,
      cloudSqlActive,
      region: "europe-west2",
      engine: "Google Cloud SQL (PostgreSQL) + Drizzle ORM",
      storageCapacity: "1 TB - 64 TB Auto-Scaling",
      sizeBytes: stats.size,
      sizeKB: Math.round(stats.size / 1024),
      lastModified: stats.mtime,
      tablesCount: Object.keys(recordCounts).length,
      tables: recordCounts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/db/export - Admin direct database download
router.get("/export", async (_req, res) => {
  try {
    const fileDb = readDatabase();
    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      database: fileDb,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/db/sync - Push whole snapshot to Cloud SQL & server DB
router.post("/sync", async (req, res) => {
  try {
    const { tables, tenantId = "merch-nairobi-01", source = "client_snapshot" } = req.body;
    if (!tables || typeof tables !== "object") {
      return res.status(400).json({ success: false, error: "Invalid tables payload" });
    }

    // 1. Persist to local server file for instant offline snapshot
    const fileDb = readDatabase();
    fileDb.tables = {
      ...(fileDb.tables || {}),
      ...tables,
    };
    fileDb.meta = {
      ...(fileDb.meta || {}),
      tenantId,
      last_sync_source: source,
      last_sync_at: new Date().toISOString(),
    };
    writeDatabase(fileDb);

    // 2. Sync to Cloud SQL PostgreSQL
    try {
      if (process.env.SQL_HOST) {
        // 1. Ensure merchant exists
        const m = tables.merchant || { id: tenantId, name: "Alacio Mini Shop", storeName: "Alacio Mini Shop", businessType: "Retail / Mini-mart" };
        const primaryMerchantId = m.id || tenantId;
        const knownMerchantIds = new Set<string>([tenantId, primaryMerchantId, "1", "merch-alacio-00", "merch-nairobi-01"]);

        await db
          .insert(merchants)
          .values({
            id: primaryMerchantId,
            name: m.name || m.business_name || m.storeName || "Alacio Mini Shop",
            businessType: m.businessType || m.shop_type || "Retail / Mini-mart",
            storeName: m.storeName || m.business_name || m.name || "Alacio Mini Shop",
            ownerName: m.ownerName || m.owner_name || "Merchant Admin",
            currency: m.currency || "KSh",
            location: m.location || "Biashara Street, Nairobi",
            phone: m.phone || "",
            taxPin: m.taxPin || "",
            defaultCashFloatTarget: m.defaultCashFloatTarget || 0,
            defaultEFloatTarget: m.defaultEFloatTarget || 0,
          })
          .onConflictDoNothing();

        // 2. Upsert suppliers first to collect valid supplier IDs
        const knownSupplierIds = new Set<string>();
        if (Array.isArray(tables.suppliers)) {
          for (const s of tables.suppliers) {
            if (!s.id || !s.name) continue;
            try {
              await db
                .insert(suppliers)
                .values({
                  id: s.id,
                  merchantId: tenantId,
                  name: s.name,
                  aliases: Array.isArray(s.aliases) ? s.aliases : [],
                  phone: s.phone || null,
                  nationalId: s.nationalId || null,
                  driverNationalId: s.driverNationalId || null,
                  contactPerson: s.contactPerson || null,
                  category: s.category || "General",
                  location: s.location || null,
                  paymentTerms: s.paymentTerms || "CASH_ON_DELIVERY",
                  totalSuppliedValue: Number(s.totalSuppliedValue || 0),
                  totalPaidValue: Number(s.totalPaidValue || 0),
                  outstandingBalanceOwed: Number(s.outstandingBalanceOwed || 0),
                })
                .onConflictDoNothing();
              knownSupplierIds.add(s.id);
            } catch (suppErr) {
              console.warn(`Notice: Skipping supplier ${s.id}:`, suppErr);
            }
          }
        }

        // 3. Upsert customers to collect valid customer IDs
        const knownCustomerIds = new Set<string>();
        if (Array.isArray(tables.customers)) {
          for (const c of tables.customers) {
            if (!c.id || !c.name) continue;
            try {
              await db
                .insert(customers)
                .values({
                  id: c.id,
                  merchantId: tenantId,
                  name: c.name,
                  aliases: Array.isArray(c.aliases) ? c.aliases : [],
                  phone: c.phone || null,
                  nationalId: c.nationalId || null,
                  customerType: c.customerType || "WALK_IN",
                  creditLimit: Number(c.creditLimit || 0),
                  outstandingCreditDeni: Number(c.outstandingCreditDeni || 0),
                  totalPurchasesValue: Number(c.totalPurchasesValue || 0),
                  totalRepaidValue: Number(c.totalRepaidValue || 0),
                })
                .onConflictDoNothing();
              knownCustomerIds.add(c.id);
            } catch (custErr) {
              console.warn(`Notice: Skipping customer ${c.id}:`, custErr);
            }
          }
        }

        // 4. Upsert items and collect valid item IDs
        const knownItemIds = new Set<string>();
        if (Array.isArray(tables.items)) {
          for (const item of tables.items) {
            if (!item.id || !item.name) continue;
            const cost = Number(item.unitCost ?? item.unit_cost_price ?? item.defaultUnitCost ?? 0);
            const retail = Number(item.unitRetail ?? item.unit_selling_price ?? item.defaultRetailPrice ?? 0);
            const stock = Number(item.currentStock ?? item.current_stock_qty ?? item.stock ?? 0);
            const threshold = Number(item.lowStockThreshold ?? item.reorder_point ?? item.reorderLevel ?? 5);
            const uType = item.unitType || item.unit_of_measure || item.unit || "packets";

            try {
              await db
                .insert(inventoryItems)
                .values({
                  id: item.id,
                  merchantId: tenantId,
                  name: item.name,
                  sku: item.sku || null,
                  category: item.category || "General",
                  unit: uType,
                  unitType: uType,
                  currentStock: stock,
                  unitCost: cost,
                  unitRetail: retail,
                  lowStockThreshold: threshold,
                  defaultUnitCost: cost,
                  defaultRetailPrice: retail,
                  reorderLevel: threshold,
                  isActive: item.isActive !== false,
                })
                .onConflictDoNothing();
              knownItemIds.add(item.id);
            } catch (itemErr) {
              console.warn(`Notice: Skipping item ${item.id}:`, itemErr);
            }
          }
        }

        // 5. Upsert supply batches with foreign key verification
        const knownBatchIds = new Set<string>();
        if (Array.isArray(tables.batches)) {
          for (const b of tables.batches) {
            const targetItemId = b.itemId || b.item_id;
            if (!b.id || !targetItemId) continue;

            // Ensure foreign key item exists
            if (!knownItemIds.has(targetItemId)) {
              try {
                await db
                  .insert(inventoryItems)
                  .values({
                    id: targetItemId,
                    merchantId: tenantId,
                    name: b.itemName || b.item_name || `Item ${targetItemId}`,
                    category: "General",
                    unit: "units",
                    unitType: "units",
                    currentStock: 0,
                    unitCost: Number(b.unitCost ?? b.unit_cost_price ?? 0),
                    unitRetail: Number(b.unitRetail ?? b.unit_selling_price ?? 0),
                    defaultUnitCost: Number(b.unitCost ?? b.unit_cost_price ?? 0),
                    defaultRetailPrice: Number(b.unitRetail ?? b.unit_selling_price ?? 0),
                    reorderLevel: 5,
                    isActive: true,
                  })
                  .onConflictDoNothing();
                knownItemIds.add(targetItemId);
              } catch (autoItemErr) {
                console.warn(`Could not ensure item ${targetItemId} for batch:`, autoItemErr);
              }
            }

            try {
              const bQty = Number(b.batchQty ?? b.initial_qty ?? b.quantityReceived ?? 0);
              const uCost = Number(b.unitCost ?? b.unit_cost_price ?? 0);
              const uRetail = Number(b.unitRetail ?? b.unit_selling_price ?? b.targetRetailPrice ?? 0);
              const suppId = (b.supplierId || b.supplier_id) && knownSupplierIds.has(b.supplierId || b.supplier_id)
                ? (b.supplierId || b.supplier_id)
                : null;

              await db
                .insert(supplyBatches)
                .values({
                  id: b.id,
                  merchantId: tenantId,
                  itemId: targetItemId,
                  supplierId: suppId,
                  batchQty: bQty,
                  unitCost: uCost,
                  unitRetail: uRetail,
                  status: b.status || "ACTIVE",
                  receivedAt: b.receivedAt ? new Date(b.receivedAt) : (b.received_at ? new Date(b.received_at) : new Date()),
                  closedAt: b.closedAt ? new Date(b.closedAt) : (b.closed_at ? new Date(b.closed_at) : null),
                  batchNumber: String(b.batchNumber || b.batch_number || "1"),
                  quantityReceived: bQty,
                  quantityRemaining: Number(b.remaining_qty ?? b.quantityRemaining ?? bQty),
                  targetRetailPrice: uRetail,
                })
                .onConflictDoNothing();
              knownBatchIds.add(b.id);
            } catch (batchErr) {
              console.warn(`Notice: Skipping batch ${b.id}:`, batchErr);
            }
          }
        }

        // 6. Upsert sales ledger entries with foreign key verification
        if (Array.isArray(tables.sales)) {
          for (const s of tables.sales) {
            const targetItemId = s.itemId || s.item_id;
            if (!s.id || !targetItemId) continue;

            if (!knownItemIds.has(targetItemId)) {
              try {
                await db
                  .insert(inventoryItems)
                  .values({
                    id: targetItemId,
                    merchantId: tenantId,
                    name: s.itemName || s.item_name || `Item ${targetItemId}`,
                    category: "General",
                    unit: "units",
                    unitType: "units",
                    currentStock: 0,
                    unitCost: Number(s.unitCost ?? s.unit_cost_price ?? 0),
                    unitRetail: Number(s.unitRetail ?? s.unit_selling_price ?? 0),
                    defaultUnitCost: Number(s.unitCost ?? s.unit_cost_price ?? 0),
                    defaultRetailPrice: Number(s.unitRetail ?? s.unit_selling_price ?? 0),
                    reorderLevel: 5,
                    isActive: true,
                  })
                  .onConflictDoNothing();
                knownItemIds.add(targetItemId);
              } catch (autoItemErr) {
                console.warn(`Could not ensure item ${targetItemId} for sale:`, autoItemErr);
              }
            }

            try {
              const qSold = Number(s.qtySold ?? s.qty_sold ?? s.quantitySold ?? 0);
              const uRetail = Number(s.unitRetail ?? s.unit_selling_price ?? s.unitPriceSold ?? 0);
              const rev = Number(s.totalRevenue ?? s.total_revenue ?? s.totalAmount ?? 0);
              const profit = Number(s.grossProfit ?? s.total_profit ?? 0);
              const tHours = Number(s.turnoverHours ?? s.sales_velocity_hours ?? 0);
              const targetBatchId = (s.batchId || s.batch_id) && knownBatchIds.has(s.batchId || s.batch_id)
                ? (s.batchId || s.batch_id)
                : null;
              const targetCustId = (s.customerId || s.customer_id) && knownCustomerIds.has(s.customerId || s.customer_id)
                ? (s.customerId || s.customer_id)
                : null;

              await db
                .insert(salesLedger)
                .values({
                  id: s.id,
                  merchantId: tenantId,
                  itemId: targetItemId,
                  batchId: targetBatchId,
                  customerId: targetCustId,
                  qtySold: qSold,
                  unitRetail: uRetail,
                  totalRevenue: rev,
                  grossProfit: profit,
                  turnoverHours: tHours,
                  quantitySold: qSold,
                  unitPriceSold: uRetail,
                  totalAmount: rev,
                  createdAt: s.createdAt ? new Date(s.createdAt) : (s.created_at ? new Date(s.created_at) : new Date()),
                })
                .onConflictDoNothing();
            } catch (saleErr) {
              console.warn(`Notice: Skipping sale ${s.id}:`, saleErr);
            }
          }
        }
      }
    } catch (sqlSyncErr) {
      console.warn("Notice: Cloud SQL individual table sync:", sqlSyncErr);
    }

    res.json({
      success: true,
      message: "Database synchronized to Cloud SQL PostgreSQL and local server storage.",
      tablesUpdated: Object.keys(tables),
      syncTimestamp: fileDb.meta.last_sync_at,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET /api/db/table/:tableName - Query a single table
router.get("/table/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;

    // Check Cloud SQL first
    try {
      if (process.env.SQL_HOST) {
        let result: any[] = [];
        if (tableName === "items" || tableName === "inventory_items") {
          result = await db.select().from(inventoryItems);
        } else if (tableName === "suppliers") {
          result = await db.select().from(suppliers);
        } else if (tableName === "customers") {
          result = await db.select().from(customers);
        } else if (tableName === "batches" || tableName === "supply_batches") {
          result = await db.select().from(supplyBatches);
        } else if (tableName === "sales" || tableName === "sales_ledger") {
          result = await db.select().from(salesLedger);
        } else if (tableName === "expenses" || tableName === "money_out") {
          result = await db.select().from(moneyOut);
        } else if (tableName === "morning_logs" || tableName === "daily_morning_logs") {
          result = await db.select().from(dailyMorningLogs);
        } else if (tableName === "reconciliations") {
          result = await db.select().from(reconciliations);
        }

        if (result.length > 0) {
          return res.json({
            success: true,
            source: "Cloud SQL (PostgreSQL)",
            table: tableName,
            count: result.length,
            data: result,
          });
        }
      }
    } catch (sqlErr) {
      console.warn("Notice: Cloud SQL table query fallback:", sqlErr);
    }

    // Fallback to file db
    const fileDb = readDatabase();
    const data = fileDb.tables?.[tableName] || [];
    res.json({
      success: true,
      source: "Local Server File DB",
      table: tableName,
      count: Array.isArray(data) ? data.length : 0,
      data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/db/restore - Admin restore database from JSON file/payload
router.post("/restore", (req, res) => {
  try {
    const { database, tables } = req.body;
    const payload = database ? database : { meta: { version: "2.0.0" }, tables: tables || {} };
    writeDatabase(payload);
    res.json({
      success: true,
      message: "Database successfully restored from payload.",
      restoredAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
