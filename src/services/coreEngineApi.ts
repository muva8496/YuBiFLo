import express from "express";
import { createPool } from "../db/index.ts";
import { requireTenant, TenantRequest, withTenantTransaction, setTenantSessionContext } from "../middleware/tenant.ts";

const router = express.Router();
const pool = createPool();

// 1. GET /api/v1/dashboard/:merchant_id
router.get("/dashboard/:merchant_id", async (req, res) => {
  const client = await pool.connect();
  try {
    const merchantId = String(req.params.merchant_id);

    // Fetch inventory items with margin and shelf value
    const itemsRes = await client.query(
      `
      SELECT id, name, category, unit_type, 
             unit_cost::float AS unit_cost, 
             unit_retail::float AS unit_retail, 
             current_stock::float AS current_stock,
             (unit_retail - unit_cost)::float AS expected_margin,
             (current_stock * unit_retail)::float AS total_shelf_value,
             (CASE WHEN current_stock <= low_stock_threshold THEN 'Low Stock Alert' ELSE 'Normal' END) AS velocity_badge
      FROM inventory_items
      WHERE merchant_id = $1
      ORDER BY id ASC;
      `,
      [merchantId]
    );

    // Compute KPI Aggregations
    const kpiRes = await client.query(
      `
      SELECT 
          COALESCE(SUM(current_stock * unit_retail), 0.00)::float AS total_active_shelf_retail_value,
          COALESCE(SUM(current_stock * unit_cost), 0.00)::float AS total_capital_invested,
          COALESCE(SUM(current_stock * (unit_retail - unit_cost)), 0.00)::float AS locked_in_potential_gross_profit
      FROM inventory_items
      WHERE merchant_id = $1;
      `,
      [merchantId]
    );

    const kpis = kpiRes.rows[0] || {
      total_active_shelf_retail_value: 0,
      total_capital_invested: 0,
      locked_in_potential_gross_profit: 0,
    };

    let avgMarkup = 0.0;
    if (kpis.total_capital_invested > 0) {
      avgMarkup = Math.round(
        (kpis.locked_in_potential_gross_profit / kpis.total_capital_invested) * 100 * 10
      ) / 10;
    }

    res.json({
      kpis: {
        total_active_shelf_retail_value: parseFloat(kpis.total_active_shelf_retail_value || 0),
        total_capital_invested: parseFloat(kpis.total_capital_invested || 0),
        locked_in_potential_gross_profit: parseFloat(kpis.locked_in_potential_gross_profit || 0),
        avg_markup_percentage: avgMarkup,
        total_active_items: itemsRes.rows.length,
      },
      inventory: itemsRes.rows,
    });
  } catch (err: any) {
    console.error("Error in get_dashboard:", err);
    res.status(500).json({ error: err.message || "Failed to fetch dashboard metrics" });
  } finally {
    client.release();
  }
});

// 2. POST /api/v1/restock - Restock-Trigger Engine Endpoint
router.post("/restock", async (req, res) => {
  const client = await pool.connect();
  try {
    const { merchant_id, item_id, quantity, unit_cost, unit_retail } = req.body;

    if (!merchant_id || !item_id || quantity === undefined || unit_cost === undefined || unit_retail === undefined) {
      return res.status(400).json({ error: "Missing required restock fields" });
    }

    const merchantIdStr = String(merchant_id);
    const itemIdStr = String(item_id);
    const qtyNum = parseFloat(quantity);
    const costNum = parseFloat(unit_cost);
    const retailNum = parseFloat(unit_retail);

    await client.query("BEGIN");

    // A. Find active batch for this item to close out and calculate implied sales
    const batchRes = await client.query(
      `
      SELECT id, batch_qty::float AS batch_qty, unit_retail::float AS unit_retail, 
             unit_cost::float AS unit_cost, received_at 
      FROM supply_batches 
      WHERE item_id = $1 AND status = 'ACTIVE' 
      ORDER BY id DESC LIMIT 1;
      `,
      [itemIdStr]
    );

    const activeBatch = batchRes.rows[0];

    if (activeBatch) {
      // Implied Sales Trigger: Previous batch was completely consumed
      const qtySold = parseFloat(activeBatch.batch_qty);
      const revenue = qtySold * parseFloat(activeBatch.unit_retail);
      const profit = revenue - qtySold * parseFloat(activeBatch.unit_cost);

      const receivedTime = new Date(activeBatch.received_at).getTime();
      const elapsedHours = Math.max(0, (Date.now() - receivedTime) / 3600000.0);

      // Log implied sales into ledger
      await client.query(
        `
        INSERT INTO sales_ledger (merchant_id, item_id, batch_id, qty_sold, unit_retail, total_revenue, gross_profit, turnover_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `,
        [
          merchantIdStr,
          itemIdStr,
          activeBatch.id,
          qtySold,
          activeBatch.unit_retail,
          revenue,
          profit,
          elapsedHours,
        ]
      );

      // Mark batch as closed
      await client.query(
        `
        UPDATE supply_batches 
        SET status = 'CLOSED_SOLD', closed_at = NOW() 
        WHERE id = $1;
        `,
        [activeBatch.id]
      );
    }

    // B. Create the new active batch
    await client.query(
      `
      INSERT INTO supply_batches (merchant_id, item_id, batch_qty, unit_cost, unit_retail, status)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE');
      `,
      [merchantIdStr, itemIdStr, qtyNum, costNum, retailNum]
    );

    // C. Update item master table
    await client.query(
      `
      UPDATE inventory_items 
      SET current_stock = $1, unit_cost = $2, unit_retail = $3 
      WHERE id = $4;
      `,
      [qtyNum, costNum, retailNum, itemIdStr]
    );

    await client.query("COMMIT");

    res.json({
      status: "SUCCESS",
      message: "Restock recorded, past batch auto-logged to sales.",
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error in restock_item:", err);
    res.status(500).json({ error: err.message || "Failed to process restock" });
  } finally {
    client.release();
  }
});

// 3. POST /api/v1/products - Create New Product
router.post("/products", async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      merchant_id,
      name,
      category,
      unit_type,
      unit_cost,
      unit_retail,
      initial_stock,
    } = req.body;

    if (!merchant_id || !name || !category || !unit_type) {
      return res.status(400).json({ error: "Missing required product fields" });
    }

    const merchantIdStr = String(merchant_id);
    const costNum = parseFloat(unit_cost || 0);
    const retailNum = parseFloat(unit_retail || 0);
    const stockNum = parseFloat(initial_stock || 0);

    await client.query("BEGIN");

    const itemRes = await client.query(
      `
      INSERT INTO inventory_items (merchant_id, name, category, unit_type, unit_cost, unit_retail, current_stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id;
      `,
      [merchantIdStr, name, category, unit_type, costNum, retailNum, stockNum]
    );

    const newId = itemRes.rows[0].id;

    if (stockNum > 0) {
      await client.query(
        `
        INSERT INTO supply_batches (merchant_id, item_id, batch_qty, unit_cost, unit_retail, status)
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE');
        `,
        [merchantIdStr, newId, stockNum, costNum, retailNum]
      );
    }

    await client.query("COMMIT");

    res.json({ status: "SUCCESS", item_id: newId });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error in create_product:", err);
    res.status(500).json({ error: err.message || "Failed to create product" });
  } finally {
    client.release();
  }
});

// 4. GET /api/v1/sales-ledger/:merchant_id - Retrieve Implied Sales
router.get("/sales-ledger/:merchant_id", async (req, res) => {
  const client = await pool.connect();
  try {
    const merchantId = String(req.params.merchant_id);
    const result = await client.query(
      `
      SELECT sl.id, sl.merchant_id, sl.item_id, sl.batch_id, 
             sl.qty_sold::float AS qty_sold, 
             sl.unit_retail::float AS unit_retail, 
             sl.total_revenue::float AS total_revenue, 
             sl.gross_profit::float AS gross_profit, 
             sl.turnover_hours::float AS turnover_hours, 
             sl.created_at,
             ii.name AS item_name, ii.category, ii.unit_type
      FROM sales_ledger sl
      LEFT JOIN inventory_items ii ON sl.item_id = ii.id
      WHERE sl.merchant_id = $1
      ORDER BY sl.created_at DESC;
      `,
      [merchantId]
    );

    res.json({ status: "SUCCESS", sales: result.rows });
  } catch (err: any) {
    console.error("Error in get_sales_ledger:", err);
    res.status(500).json({ error: err.message || "Failed to fetch sales ledger" });
  } finally {
    client.release();
  }
});

// 5. GET /api/v1/batches/:merchant_id - Retrieve Supply Batches
router.get("/batches/:merchant_id", async (req, res) => {
  const client = await pool.connect();
  try {
    const merchantId = String(req.params.merchant_id);
    const result = await client.query(
      `
      SELECT sb.id, sb.merchant_id, sb.item_id, 
             sb.batch_qty::float AS batch_qty, 
             sb.unit_cost::float AS unit_cost, 
             sb.unit_retail::float AS unit_retail, 
             sb.status, sb.received_at, sb.closed_at,
             ii.name AS item_name, ii.category, ii.unit_type
      FROM supply_batches sb
      LEFT JOIN inventory_items ii ON sb.item_id = ii.id
      WHERE sb.merchant_id = $1
      ORDER BY sb.id DESC;
      `,
      [merchantId]
    );

    res.json({ status: "SUCCESS", batches: result.rows });
  } catch (err: any) {
    console.error("Error in get_batches:", err);
    res.status(500).json({ error: err.message || "Failed to fetch batches" });
  } finally {
    client.release();
  }
});

// 6. GET /api/v1/tenants - Retrieve All Tenants & Configurations
router.get("/tenants", async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT t.id, t.slug, t.business_name, t.blueprint_type, t.created_at,
             tc.categories, tc.unit_types
      FROM tenants t
      LEFT JOIN tenant_configs tc ON tc.tenant_id = t.id
      ORDER BY t.created_at ASC;
    `);

    res.json({ status: "SUCCESS", tenants: result.rows });
  } catch (err: any) {
    console.error("Error in get_tenants:", err);
    res.status(500).json({ error: err.message || "Failed to fetch tenants" });
  } finally {
    client.release();
  }
});

// 7. GET /api/v1/tenants/:slug_or_id - Retrieve Single Tenant Blueprint
router.get("/tenants/:slug_or_id", async (req, res) => {
  const client = await pool.connect();
  try {
    const param = String(req.params.slug_or_id);
    const result = await client.query(
      `
      SELECT t.id, t.slug, t.business_name, t.blueprint_type, t.created_at,
             tc.categories, tc.unit_types
      FROM tenants t
      LEFT JOIN tenant_configs tc ON tc.tenant_id = t.id
      WHERE t.id = $1 OR t.slug = $1
      LIMIT 1;
      `,
      [param]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    res.json({ status: "SUCCESS", tenant: result.rows[0] });
  } catch (err: any) {
    console.error("Error in get_tenant_by_id:", err);
    res.status(500).json({ error: err.message || "Failed to fetch tenant" });
  } finally {
    client.release();
  }
});

// 8. GET /api/v1/tenant/context - Resolve tenant and current session
router.get("/tenant/context", requireTenant, async (req: TenantRequest, res) => {
  const client = await pool.connect();
  try {
    const configRes = await client.query(
      `
      SELECT categories, unit_types, pipeline_settings, reconciliation_threshold
      FROM tenant_configs
      WHERE tenant_id = $1
      LIMIT 1;
      `,
      [req.tenantId]
    );

    res.json({
      status: "SUCCESS",
      tenant: req.tenant,
      config: configRes.rows[0] || null,
      session_rls: {
        current_tenant_id: req.tenantId,
        enforced: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch tenant context" });
  } finally {
    client.release();
  }
});

// 9. GET /api/v1/tenant/inventory - RLS-isolated inventory query
router.get("/tenant/inventory", requireTenant, async (req: TenantRequest, res) => {
  try {
    const items = await withTenantTransaction(req.tenantId!, async (client) => {
      const result = await client.query(
        `
        SELECT id, tenant_id, name, category, unit_type, 
               unit_cost::float AS unit_cost, 
               unit_retail::float AS unit_retail, 
               current_stock::float AS current_stock,
               low_stock_threshold::float AS low_stock_threshold,
               created_at
        FROM tenant_inventory
        ORDER BY created_at ASC;
        `
      );
      return result.rows;
    });

    res.json({
      status: "SUCCESS",
      tenant_slug: req.tenantSlug,
      tenant_id: req.tenantId,
      inventory: items,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch tenant inventory" });
  }
});

// 10. GET /api/v1/workspace/inventory - FastAPI parity endpoint (RLS isolated by session)
router.get("/workspace/inventory", requireTenant, async (req: TenantRequest, res) => {
  try {
    const items = await withTenantTransaction(req.tenantId!, async (client) => {
      const query = `
        SELECT id, name, category, unit_type, 
               unit_cost::float AS unit_cost, 
               unit_retail::float AS unit_retail, 
               current_stock::float AS current_stock,
               (current_stock * unit_retail)::float AS total_shelf_value,
               (CASE WHEN current_stock <= low_stock_threshold THEN 'Low Stock Alert' ELSE 'Normal' END) AS velocity_badge
        FROM tenant_inventory
        ORDER BY name ASC;
      `;
      const result = await client.query(query);
      return result.rows;
    });

    res.json({
      tenant_id: req.tenantId,
      items: items,
    });
  } catch (err: any) {
    console.error("Error in list_workspace_inventory:", err);
    res.status(500).json({ error: err.message || "Failed to fetch workspace inventory" });
  }
});

export default router;
