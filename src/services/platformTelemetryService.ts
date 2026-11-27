/**
 * YuBiFlo Privacy-Preserving Platform Telemetry Service
 *
 * Strictly records aggregate technical performance & site usage metrics
 * (active modules, sync latency ms, sync health, vault payload KB, sessions, actions)
 * with ZERO access to merchants' encrypted business ledgers, sales, cash balances,
 * customer credit books, or inventory items.
 */

export const PLATFORM_OWNER_EMAIL = "mosesmukangai75@gmail.com";

export type PlatformPlanTier = "FREE_TRIAL" | "PAID_BLUEPRINT" | "PRO" | "PLATINUM" | "ENTERPRISE";
export type TelemetryDeviceFormFactor = "MOBILE" | "DESKTOP" | "TABLET";
export type TelemetryHealthStatus = "HEALTHY" | "DEGRADED" | "IDLE";

export interface PlatformTelemetryRecord {
  id: string;
  workspace_id: string;
  owner_handle: string;
  business_name: string;
  business_type: string;
  blueprint_id: string;
  plan_tier: PlatformPlanTier;
  role_type: "OWNER" | "MANAGER" | "ADMIN";
  signed_up_at: string;
  last_active_at: string;
  last_active_tab: string;
  active_modules: string[];
  sessions_count: number;
  actions_count: number;
  sync_success_count: number;
  sync_failure_count: number;
  avg_sync_latency_ms: number;
  last_sync_latency_ms: number;
  payload_kb: number;
  app_boot_ms: number;
  record_score: number;
  schema_version: number;
  e2ee_enabled: boolean;
  device_form_factor: TelemetryDeviceFormFactor;
  health_status: TelemetryHealthStatus;
  telemetry_source: "LIVE_TELEMETRY" | "WORKSPACE_HEADER";
}

export interface TelemetryEventInput {
  workspaceId: string;
  userEmail?: string;
  businessName: string;
  businessType: string;
  blueprintId?: string;
  planTier?: string;
  roleType?: "OWNER" | "MANAGER" | "ADMIN";
  activeTab?: string;
  eventKind: "signup" | "session_start" | "module_view" | "sync_success" | "sync_error" | "account_create";
  syncLatencyMs?: number;
  payloadKb?: number;
  recordScore?: number;
  schemaVersion?: number;
  signedUpAt?: string;
  forceFlush?: boolean;
}

const TELEMETRY_LOCAL_PREFIX = "yubiflo_telemetry_cache_";
const SESSION_MARKER_PREFIX = "yubiflo_tel_session_";

let firestoreModulesPromise: Promise<
  [typeof import("./firebase"), typeof import("firebase/firestore")]
> | null = null;

function loadFirestoreModules() {
  if (!firestoreModulesPromise) {
    firestoreModulesPromise = Promise.all([
      import("./firebase"),
      import("firebase/firestore")
    ]);
  }
  return firestoreModulesPromise;
}

export function isPlatformOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PLATFORM_OWNER_EMAIL;
}

export function maskEmailForTelemetry(email?: string): string {
  const clean = (email || "").trim().toLowerCase();
  if (!clean || !clean.includes("@")) return "tenant_merchant";
  const [local, domain] = clean.split("@");
  const prefix = local.slice(0, Math.min(3, local.length));
  return `${prefix}***@${domain}`.slice(0, 80);
}

export function deriveTelemetryId(workspaceId: string): string {
  const sanitized = String(workspaceId || "default")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/^ws_/, "");
  return `tel_${sanitized}`.slice(0, 128);
}

function detectDeviceFormFactor(): TelemetryDeviceFormFactor {
  if (typeof window === "undefined") return "DESKTOP";
  const w = window.innerWidth || 1024;
  if (w < 768) return "MOBILE";
  if (w < 1024) return "TABLET";
  return "DESKTOP";
}

function normalizePlanTier(tier?: string): PlatformPlanTier {
  const upper = String(tier || "PAID_BLUEPRINT").toUpperCase();
  if (upper.includes("ENTERPRISE")) return "ENTERPRISE";
  if (upper.includes("PLATINUM")) return "PLATINUM";
  if (upper.includes("PRO")) return "PRO";
  if (upper.includes("FREE")) return "FREE_TRIAL";
  return "PAID_BLUEPRINT";
}

function normalizeRoleType(role?: string): "OWNER" | "MANAGER" | "ADMIN" {
  const upper = String(role || "OWNER").toUpperCase();
  if (upper === "MANAGER") return "MANAGER";
  if (upper === "ADMIN") return "ADMIN";
  return "OWNER";
}

function getAppBootMs(): number {
  try {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return Math.min(600_000, Math.max(10, Math.round(performance.now())));
    }
  } catch {}
  return 180;
}

interface LocalTelemetryCache {
  signed_up_at: string;
  sessions_count: number;
  actions_count: number;
  active_modules: string[];
  sync_success_count: number;
  sync_failure_count: number;
  avg_sync_latency_ms: number;
  last_sync_latency_ms: number;
  payload_kb: number;
  record_score: number;
  last_active_tab: string;
  remote_checked?: boolean;
}

const inMemoryCache = new Map<string, LocalTelemetryCache>();
const lastFlushTimestamp = new Map<string, number>();

function readLocalTelemetryCache(telemetryId: string): LocalTelemetryCache {
  const cached = inMemoryCache.get(telemetryId);
  if (cached) return cached;

  try {
    const raw = localStorage.getItem(`${TELEMETRY_LOCAL_PREFIX}${telemetryId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const normalized: LocalTelemetryCache = {
          signed_up_at: typeof parsed.signed_up_at === "string" ? parsed.signed_up_at : new Date().toISOString(),
          sessions_count: Math.max(0, Number(parsed.sessions_count) || 0),
          actions_count: Math.max(0, Number(parsed.actions_count) || 0),
          active_modules: Array.isArray(parsed.active_modules) ? parsed.active_modules.slice(0, 15) : ["dashboard"],
          sync_success_count: Math.max(0, Number(parsed.sync_success_count) || 0),
          sync_failure_count: Math.max(0, Number(parsed.sync_failure_count) || 0),
          avg_sync_latency_ms: Math.max(0, Number(parsed.avg_sync_latency_ms) || 0),
          last_sync_latency_ms: Math.max(0, Number(parsed.last_sync_latency_ms) || 0),
          payload_kb: Math.max(0, Number(parsed.payload_kb) || 0),
          record_score: Math.max(0, Number(parsed.record_score) || 0),
          last_active_tab: typeof parsed.last_active_tab === "string" ? parsed.last_active_tab : "dashboard",
          remote_checked: Boolean(parsed.remote_checked)
        };
        inMemoryCache.set(telemetryId, normalized);
        return normalized;
      }
    }
  } catch {}

  const fresh: LocalTelemetryCache = {
    signed_up_at: new Date().toISOString(),
    sessions_count: 1,
    actions_count: 1,
    active_modules: ["dashboard"],
    sync_success_count: 0,
    sync_failure_count: 0,
    avg_sync_latency_ms: 0,
    last_sync_latency_ms: 0,
    payload_kb: 0,
    record_score: 0,
    last_active_tab: "dashboard",
    remote_checked: false
  };
  inMemoryCache.set(telemetryId, fresh);
  return fresh;
}

function saveLocalTelemetryCache(telemetryId: string, cache: LocalTelemetryCache): void {
  inMemoryCache.set(telemetryId, cache);
  try {
    localStorage.setItem(`${TELEMETRY_LOCAL_PREFIX}${telemetryId}`, JSON.stringify(cache));
  } catch {}
}

/**
 * Records privacy-preserving site usage & performance telemetry for a workspace.
 * Never logs financial amounts, inventory items, or customer PII.
 */
export async function recordTelemetryHeartbeat(input: TelemetryEventInput): Promise<void> {
  if (!input.workspaceId || !/^[a-zA-Z0-9_-]{1,128}$/.test(input.workspaceId)) {
    return;
  }

  const telemetryId = deriveTelemetryId(input.workspaceId);
  const cache = readLocalTelemetryCache(telemetryId);
  const nowIso = new Date().toISOString();

  // First-time seed from account metadata if provided
  if (input.signedUpAt && input.signedUpAt.length >= 10 && !cache.remote_checked) {
    cache.signed_up_at = input.signedUpAt.slice(0, 40);
  }

  // Track unique session increments once per browser session per workspace
  try {
    const sessKey = `${SESSION_MARKER_PREFIX}${telemetryId}`;
    if ((input.eventKind === "session_start" || input.eventKind === "signup") && !sessionStorage.getItem(sessKey)) {
      sessionStorage.setItem(sessKey, nowIso);
      cache.sessions_count += 1;
    }
  } catch {}

  if (input.eventKind === "module_view" || input.eventKind === "signup" || input.eventKind === "account_create") {
    cache.actions_count += 1;
  }

  if (input.activeTab) {
    const cleanTab = String(input.activeTab).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    if (cleanTab) {
      cache.last_active_tab = cleanTab;
      if (!cache.active_modules.includes(cleanTab)) {
        cache.active_modules = [...cache.active_modules, cleanTab].slice(0, 15);
      }
    }
  }

  if (input.eventKind === "sync_success") {
    const lat = Math.max(0, Math.min(600_000, Math.round(Number(input.syncLatencyMs) || 0)));
    const prevTotal = cache.sync_success_count;
    cache.sync_success_count += 1;
    cache.last_sync_latency_ms = lat;
    cache.avg_sync_latency_ms =
      prevTotal === 0
        ? lat
        : Math.round(((cache.avg_sync_latency_ms * prevTotal + lat) / cache.sync_success_count) * 10) / 10;
  } else if (input.eventKind === "sync_error") {
    cache.sync_failure_count += 1;
    if (typeof input.syncLatencyMs === "number") {
      cache.last_sync_latency_ms = Math.max(0, Math.min(600_000, Math.round(input.syncLatencyMs)));
    }
  }

  if (typeof input.payloadKb === "number" && Number.isFinite(input.payloadKb)) {
    cache.payload_kb = Math.max(0, Math.min(50_000, Math.round(input.payloadKb * 10) / 10));
  }

  if (typeof input.recordScore === "number" && Number.isFinite(input.recordScore)) {
    cache.record_score = Math.max(0, Math.round(input.recordScore));
  }

  saveLocalTelemetryCache(telemetryId, cache);

  // Throttle passive updates to at most once every 12 seconds unless critical lifecycle event
  const lastFlushed = lastFlushTimestamp.get(telemetryId) || 0;
  const elapsed = Date.now() - lastFlushed;
  const isImmediateEvent =
    input.forceFlush ||
    input.eventKind === "signup" ||
    input.eventKind === "account_create" ||
    input.eventKind === "sync_error";

  if (!isImmediateEvent && elapsed < 12_000) {
    return;
  }

  lastFlushTimestamp.set(telemetryId, Date.now());

  try {
    const [{ db, handleFirestoreError, OperationType }, { doc, getDoc, setDoc, serverTimestamp }] =
      await loadFirestoreModules();

    const ref = doc(db, "platform_telemetry", telemetryId);

    // Sync with existing Firestore telemetry doc once per session so signed_up_at & counters stay exact across devices
    if (!cache.remote_checked) {
      try {
        const snap = await getDoc(ref);
        cache.remote_checked = true;
        if (snap.exists()) {
          const existing = snap.data();
          if (typeof existing.signed_up_at === "string" && existing.signed_up_at.length >= 10) {
            cache.signed_up_at = existing.signed_up_at.slice(0, 40);
          }
          cache.sessions_count = Math.max(cache.sessions_count, Number(existing.sessions_count) || 0);
          cache.actions_count = Math.max(cache.actions_count, Number(existing.actions_count) || 0);
          cache.sync_success_count = Math.max(cache.sync_success_count, Number(existing.sync_success_count) || 0);
          cache.sync_failure_count = Math.max(cache.sync_failure_count, Number(existing.sync_failure_count) || 0);
          if (Array.isArray(existing.active_modules)) {
            const mergedMods = Array.from(new Set([...existing.active_modules, ...cache.active_modules]))
              .map((m) => String(m).slice(0, 50))
              .slice(0, 15);
            cache.active_modules = mergedMods;
          }
          if (!cache.payload_kb && Number(existing.payload_kb) > 0) {
            cache.payload_kb = Number(existing.payload_kb);
          }
          if (!cache.avg_sync_latency_ms && Number(existing.avg_sync_latency_ms) > 0) {
            cache.avg_sync_latency_ms = Number(existing.avg_sync_latency_ms);
          }
        }
        saveLocalTelemetryCache(telemetryId, cache);
      } catch {
        cache.remote_checked = true;
      }
    }

    const totalSyncs = cache.sync_success_count + cache.sync_failure_count;
    const failureRatio = totalSyncs > 0 ? cache.sync_failure_count / totalSyncs : 0;
    const healthStatus: TelemetryHealthStatus =
      failureRatio > 0.15 || cache.last_sync_latency_ms > 3500 ? "DEGRADED" : "HEALTHY";

    const payload = {
      id: telemetryId,
      workspace_id: input.workspaceId.slice(0, 128),
      owner_handle: maskEmailForTelemetry(input.userEmail),
      business_name: (input.businessName || "YuBiFlo Merchant").trim().slice(0, 120) || "YuBiFlo Merchant",
      business_type: (input.businessType || "Retail / Duka").trim().slice(0, 80) || "Retail / Duka",
      blueprint_id: (input.blueprintId || "duka_fmcg").trim().slice(0, 60) || "duka_fmcg",
      plan_tier: normalizePlanTier(input.planTier),
      role_type: normalizeRoleType(input.roleType),
      signed_up_at: cache.signed_up_at.slice(0, 40),
      last_active_at: nowIso.slice(0, 40),
      last_active_tab: cache.last_active_tab.slice(0, 50),
      active_modules: (cache.active_modules.length > 0 ? cache.active_modules : ["dashboard"]).slice(0, 15),
      sessions_count: cache.sessions_count,
      actions_count: cache.actions_count,
      sync_success_count: cache.sync_success_count,
      sync_failure_count: cache.sync_failure_count,
      avg_sync_latency_ms: Math.round(cache.avg_sync_latency_ms),
      last_sync_latency_ms: Math.round(cache.last_sync_latency_ms),
      payload_kb: Math.round(cache.payload_kb * 10) / 10,
      app_boot_ms: getAppBootMs(),
      record_score: cache.record_score,
      schema_version: Math.max(1, Number(input.schemaVersion) || 6),
      e2ee_enabled: true,
      device_form_factor: detectDeviceFormFactor(),
      health_status: healthStatus,
      server_updated_at: serverTimestamp()
    };

    try {
      await setDoc(ref, payload);
    } catch (writeErr) {
      handleFirestoreError(writeErr, OperationType.WRITE, `platform_telemetry/${telemetryId}`);
    }
  } catch {
    // Non-blocking telemetry: never interrupt merchant operations
  }
}

export interface PlatformTelemetrySummary {
  records: PlatformTelemetryRecord[];
  totalBusinesses: number;
  activeLast24h: number;
  activeLast7d: number;
  meanSyncLatencyMs: number;
  syncSuccessRatePct: number;
  totalVaultKb: number;
  e2eeProtectedCount: number;
  moduleAdoption: Array<{ module: string; label: string; count: number }>;
  fetchedAt: string;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  launchpad: "Launchpad",
  supply_sales: "Sales & Payments",
  purchases: "Purchases",
  purchases_cargo: "Inbound Cargo",
  receipt_ocr: "Upload Receipts",
  selling_prices: "Selling Prices",
  suppliers: "Suppliers",
  owner_expenses: "Owner Expenses",
  expenses: "Expenses",
  stock_vault: "Stock Vault",
  dawn_lock: "Dawn Lock",
  voice_ledger: "Voice Ledger",
  customer_deni: "Customer Deni",
  three_fold_ledgers: "3-Fold Ledgers",
  analytics: "Analytics"
};

/**
 * Queries strictly non-financial site usage & performance telemetry for the platform owner.
 * Any legacy workspace documents discovered are projected strictly to non-private metadata headers
 * (`e2ee_vault` and business records are never decoded, stored, or rendered).
 */
export async function fetchPlatformTelemetryForOwner(
  ownerEmail?: string | null
): Promise<PlatformTelemetrySummary> {
  if (!isPlatformOwnerEmail(ownerEmail)) {
    throw new Error("Unauthorized: Platform Telemetry Backend is restricted to the site owner.");
  }

  const recordMap = new Map<string, PlatformTelemetryRecord>();
  const [{ db, handleFirestoreError, OperationType }, { collection, getDocs, query, where }] =
    await loadFirestoreModules();

  // 1. Primary Query: Dedicated privacy-preserving /platform_telemetry collection
  try {
    const q = query(collection(db, "platform_telemetry"), where("schema_version", ">=", 1));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (!d || !d.workspace_id) return;
      const lastActiveTs = Date.parse(String(d.last_active_at || "")) || 0;
      const daysIdle = lastActiveTs > 0 ? (Date.now() - lastActiveTs) / (1000 * 60 * 60 * 24) : 99;
      const computedHealth: TelemetryHealthStatus =
        d.health_status === "DEGRADED"
          ? "DEGRADED"
          : daysIdle > 7
          ? "IDLE"
          : "HEALTHY";

      recordMap.set(String(d.workspace_id), {
        id: String(d.id || docSnap.id),
        workspace_id: String(d.workspace_id),
        owner_handle: String(d.owner_handle || "tenant"),
        business_name: String(d.business_name || "Registered Business"),
        business_type: String(d.business_type || "Retail / Duka"),
        blueprint_id: String(d.blueprint_id || "duka_fmcg"),
        plan_tier: normalizePlanTier(d.plan_tier),
        role_type: normalizeRoleType(d.role_type),
        signed_up_at: String(d.signed_up_at || d.last_active_at || ""),
        last_active_at: String(d.last_active_at || ""),
        last_active_tab: String(d.last_active_tab || "dashboard"),
        active_modules: Array.isArray(d.active_modules) ? d.active_modules.map(String) : ["dashboard"],
        sessions_count: Number(d.sessions_count) || 0,
        actions_count: Number(d.actions_count) || 0,
        sync_success_count: Number(d.sync_success_count) || 0,
        sync_failure_count: Number(d.sync_failure_count) || 0,
        avg_sync_latency_ms: Number(d.avg_sync_latency_ms) || 0,
        last_sync_latency_ms: Number(d.last_sync_latency_ms) || 0,
        payload_kb: Number(d.payload_kb) || 0,
        app_boot_ms: Number(d.app_boot_ms) || 0,
        record_score: Number(d.record_score) || 0,
        schema_version: Number(d.schema_version) || 1,
        e2ee_enabled: d.e2ee_enabled !== false,
        device_form_factor: (d.device_form_factor as TelemetryDeviceFormFactor) || "DESKTOP",
        health_status: computedHealth,
        telemetry_source: "LIVE_TELEMETRY"
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "platform_telemetry");
  }

  // 2. Discovery Metadata Pass: Project ONLY safe workspace headers (NEVER decode or retain e2ee_vault or financial data)
  try {
    const wsSnap = await getDocs(collection(db, "workspaces"));
    wsSnap.forEach((docSnap) => {
      const wsId = docSnap.id;
      const d = docSnap.data();
      if (!d || d.record_type === "user_account_directory") return;
      if (recordMap.has(wsId)) return;

      // Measure approximate ciphertext footprint only without inspecting or storing vault content
      const approxKb = d.e2ee_vault
        ? Math.round((JSON.stringify(d.e2ee_vault).length / 1024) * 10) / 10
        : 0;
      const lastUpdated = String(d.last_updated || "");
      const lastTs = Date.parse(lastUpdated) || 0;
      const daysIdle = lastTs > 0 ? (Date.now() - lastTs) / (1000 * 60 * 60 * 24) : 99;

      recordMap.set(wsId, {
        id: deriveTelemetryId(wsId),
        workspace_id: wsId,
        owner_handle: "e2ee_sealed",
        business_name: String(d.business_name || "Registered Business"),
        business_type: String(d.client_type || "Retail / Duka"),
        blueprint_id: String(d.client_type || "").toLowerCase().includes("eatery")
          ? "open_eatery"
          : "duka_fmcg",
        plan_tier: "PAID_BLUEPRINT",
        role_type: "OWNER",
        signed_up_at: lastUpdated || new Date().toISOString(),
        last_active_at: lastUpdated || new Date().toISOString(),
        last_active_tab: "dashboard",
        active_modules: ["dashboard"],
        sessions_count: 1,
        actions_count: 0,
        sync_success_count: 1,
        sync_failure_count: 0,
        avg_sync_latency_ms: 0,
        last_sync_latency_ms: 0,
        payload_kb: approxKb,
        app_boot_ms: 0,
        record_score: Number(d.record_score) || 0,
        schema_version: Number(d.schema_version) || 1,
        e2ee_enabled: Boolean(d.e2ee_protected),
        device_form_factor: "DESKTOP",
        health_status: daysIdle > 7 ? "IDLE" : "HEALTHY",
        telemetry_source: "WORKSPACE_HEADER"
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "workspaces");
  }

  const records = Array.from(recordMap.values()).sort((a, b) =>
    String(b.last_active_at || "").localeCompare(String(a.last_active_at || ""))
  );

  const now = Date.now();
  const ms24h = 24 * 60 * 60 * 1000;
  const ms7d = 7 * ms24h;

  let activeLast24h = 0;
  let activeLast7d = 0;
  let totalLatency = 0;
  let latencyCount = 0;
  let totalSuccess = 0;
  let totalSyncAttempts = 0;
  let totalVaultKb = 0;
  let e2eeProtectedCount = 0;
  const moduleCounts = new Map<string, number>();

  for (const r of records) {
    const ts = Date.parse(r.last_active_at || "0") || 0;
    if (now - ts <= ms24h) activeLast24h += 1;
    if (now - ts <= ms7d) activeLast7d += 1;
    if (r.avg_sync_latency_ms > 0) {
      totalLatency += r.avg_sync_latency_ms;
      latencyCount += 1;
    }
    totalSuccess += r.sync_success_count;
    totalSyncAttempts += r.sync_success_count + r.sync_failure_count;
    totalVaultKb += r.payload_kb;
    if (r.e2ee_enabled) e2eeProtectedCount += 1;

    for (const mod of r.active_modules) {
      moduleCounts.set(mod, (moduleCounts.get(mod) || 0) + 1);
    }
  }

  const moduleAdoption = Array.from(moduleCounts.entries())
    .map(([mod, count]) => ({
      module: mod,
      label: MODULE_LABELS[mod] || mod,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    records,
    totalBusinesses: records.length,
    activeLast24h,
    activeLast7d,
    meanSyncLatencyMs: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
    syncSuccessRatePct:
      totalSyncAttempts > 0 ? Math.round((totalSuccess / totalSyncAttempts) * 1000) / 10 : 100,
    totalVaultKb: Math.round(totalVaultKb * 10) / 10,
    e2eeProtectedCount,
    moduleAdoption,
    fetchedAt: new Date().toISOString()
  };
}
