import { Request, Response, NextFunction } from "express";
import { PoolClient } from "pg";
import { createPool } from "../db/index.ts";

export interface TenantInfo {
  id: string;
  slug: string;
  business_name: string;
  blueprint_type: string;
  currency: string;
  is_active: boolean;
}

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantSlug?: string;
  tenant?: TenantInfo;
}

const pool = createPool();

/**
 * Resolves the tenant from headers or host subdomain:
 * 1. Checks `X-Tenant-Slug` or `X-Tenant-Id` header
 * 2. Fallbacks to host subdomain: `alacio.yubiflo.com` -> `alacio`
 * 3. Fallbacks to query parameter `?tenant_slug=...`
 */
export function resolveTenantSlug(req: Request): string | null {
  // 1. Header resolution
  const headerSlug = req.headers["x-tenant-slug"] as string;
  if (headerSlug && headerSlug.trim()) {
    return headerSlug.trim().toLowerCase();
  }

  const headerId = req.headers["x-tenant-id"] as string;
  if (headerId && headerId.trim()) {
    return headerId.trim();
  }

  // 2. Query param resolution
  const querySlug = req.query.tenant_slug as string;
  if (querySlug && querySlug.trim()) {
    return querySlug.trim().toLowerCase();
  }

  // 3. Fallback to host parsing: alacio.yubiflo.com -> alacio
  const host = (req.headers["host"] || "").toLowerCase();
  if (host && host.includes(".")) {
    const subdomain = host.split(".")[0];
    if (subdomain && !["api", "www", "app", "localhost"].includes(subdomain)) {
      return subdomain;
    }
  }

  return null;
}

/**
 * Express middleware to resolve current tenant and validate against PostgreSQL registry.
 */
export async function requireTenant(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  const tenantSlug = resolveTenantSlug(req);

  if (!tenantSlug) {
    return res.status(400).json({
      error: "Missing X-Tenant-Slug header or invalid subdomain.",
    });
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const query = `
      SELECT id, slug, business_name, blueprint_type, currency, is_active
      FROM tenants
      WHERE (slug = $1 OR id::text = $1) AND is_active = true
      LIMIT 1;
    `;
    const result = await client.query(query, [tenantSlug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Tenant workspace not found.",
      });
    }

    const tenant = result.rows[0];
    req.tenantId = tenant.id;
    req.tenantSlug = tenant.slug;
    req.tenant = tenant;

    next();
  } catch (error: any) {
    console.error("Error in tenant middleware:", error);
    return res.status(500).json({
      error: "Database error resolving tenant workspace.",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Injects Tenant Context into PostgreSQL Session for Row-Level Security (RLS)
 * Sets `app.current_tenant_id` locally in the current transaction or session.
 */
export async function setTenantSessionContext(
  client: PoolClient,
  tenantId: string
): Promise<void> {
  await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
}

/**
 * Helper to run a callback inside an RLS-isolated PostgreSQL transaction
 */
export async function withTenantTransaction<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Inject tenant context for RLS policies
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
