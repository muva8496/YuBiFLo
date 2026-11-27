import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Building2,
  ShieldCheck,
  Lock,
  RefreshCw,
  ArrowLeft,
  Search,
  Clock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Monitor,
  Tablet,
  HardDrive,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import {
  fetchPlatformTelemetryForOwner,
  PlatformTelemetryRecord,
  PlatformTelemetrySummary,
  PLATFORM_OWNER_EMAIL
} from "../services/platformTelemetryService";
import { YuBiFloLogo } from "./YuBiFloLogo";

interface AdminTelemetryConsoleProps {
  ownerEmail: string;
  onBackToHomepage: () => void;
  onOpenBusinessChooser: () => void;
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return "—";
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "—";
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays <= 30) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function formatShortDate(iso?: string): string {
  if (!iso) return "—";
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function DeviceIcon({ formFactor }: { formFactor: PlatformTelemetryRecord["device_form_factor"] }) {
  if (formFactor === "MOBILE") return <Smartphone size={13} className="text-slate-500" />;
  if (formFactor === "TABLET") return <Tablet size={13} className="text-slate-500" />;
  return <Monitor size={13} className="text-slate-500" />;
}

export default function AdminTelemetryConsole({
  ownerEmail,
  onBackToHomepage,
  onOpenBusinessChooser
}: AdminTelemetryConsoleProps) {
  const [summary, setSummary] = useState<PlatformTelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "HEALTHY" | "DEGRADED" | "IDLE">("ALL");

  const loadTelemetry = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchPlatformTelemetryForOwner(ownerEmail);
      setSummary(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "Unable to fetch platform telemetry from Firestore.");
    } finally {
      setLoading(false);
    }
  }, [ownerEmail]);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  const filteredRecords = useMemo(() => {
    if (!summary) return [];
    const q = searchQuery.trim().toLowerCase();
    return summary.records.filter((r) => {
      if (statusFilter !== "ALL" && r.health_status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.business_name.toLowerCase().includes(q) ||
        r.business_type.toLowerCase().includes(q) ||
        r.blueprint_id.toLowerCase().includes(q) ||
        r.owner_handle.toLowerCase().includes(q)
      );
    });
  }, [summary, searchQuery, statusFilter]);

  const healthCounts = useMemo(() => {
    const counts = { HEALTHY: 0, DEGRADED: 0, IDLE: 0 };
    if (!summary) return counts;
    for (const r of summary.records) {
      counts[r.health_status] = (counts[r.health_status] || 0) + 1;
    }
    return counts;
  }, [summary]);

  return (
    <div className="min-h-screen yubiflo-blue-gold-canvas text-[#0B1B32] font-sans antialiased">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#F3F8FD]/95 backdrop-blur-md border-b border-[#C8D9EA] border-t-2 border-t-[#D4AF37]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={onBackToHomepage}
              className="flex items-center gap-2 text-left cursor-pointer group shrink-0"
              title="Return to YuBiFLo public homepage"
            >
              <YuBiFloLogo size="sm" variant="dark" />
            </button>
            <div className="hidden sm:block h-5 w-px bg-[#C8D9EA]" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-black text-base text-[#0B1B32] truncate">
                  Platform Admin Backend
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#996515] bg-[#FDF5E2] border border-[#E6CF8B] px-2 py-0.5 rounded-full">
                  <Lock size={10} />
                  Zero-Access Telemetry
                </span>
              </div>
              <p className="text-[11px] text-[#475569] truncate font-mono">
                Owner: {PLATFORM_OWNER_EMAIL}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadTelemetry}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#C8D9EA] text-xs font-semibold text-[#0B1B32] flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={onOpenBusinessChooser}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EBF3FC] border border-[#C8D9EA] text-xs font-semibold text-[#1A56DB] flex items-center gap-1.5 cursor-pointer transition"
            >
              <Building2 size={14} />
              <span className="hidden md:inline">Managed Businesses</span>
              <span className="md:hidden">Businesses</span>
            </button>

            <button
              type="button"
              onClick={onBackToHomepage}
              className="px-3.5 py-2 rounded-xl bg-[#0B1B32] hover:bg-[#13294B] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
            >
              <ArrowLeft size={14} />
              <span>Homepage</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Strict Privacy Boundary Banner */}
        <section className="rounded-2xl bg-white border border-[#C8D9EA] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-[#0B1B32]">
                Strict Tenant Data Isolation Active
              </div>
              <p className="text-xs text-[#475569] leading-relaxed max-w-3xl">
                This console monitors only registered signups, module usage frequency, Firestore sync latency, and encrypted vault payload footprint. Merchant sales figures, M-Pesa/cash balances, stock inventories, and customer credit books remain E2EE sealed and inaccessible.
              </p>
            </div>
          </div>
          {summary && (
            <div className="text-[11px] font-mono text-[#64748B] shrink-0 text-right">
              Last synced: {formatRelativeTime(summary.fetchedAt)}
            </div>
          )}
        </section>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 4 Summary KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#C8D9EA] p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
              <span>Signed-Up Businesses</span>
              <Building2 size={15} className="text-[#1A56DB]" />
            </div>
            <div className="text-3xl font-serif font-black text-[#0B1B32] tabular-nums">
              {loading && !summary ? "—" : summary?.totalBusinesses ?? 0}
            </div>
            <div className="text-[11px] font-mono text-[#64748B]">
              {summary?.e2eeProtectedCount ?? 0} encrypted E2EE tenants
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#C8D9EA] p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
              <span>Active Usage Window</span>
              <Activity size={15} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-serif font-black text-[#0B1B32] tabular-nums">
              {loading && !summary ? "—" : summary?.activeLast7d ?? 0}
              <span className="text-sm font-sans font-semibold text-[#64748B] ml-1.5">
                (7d)
              </span>
            </div>
            <div className="text-[11px] font-mono text-emerald-700">
              {summary?.activeLast24h ?? 0} active in last 24h
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#C8D9EA] p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
              <span>Cloud Sync Performance</span>
              <Cpu size={15} className="text-[#C8962E]" />
            </div>
            <div className="text-3xl font-serif font-black text-[#0B1B32] tabular-nums">
              {loading && !summary
                ? "—"
                : summary && summary.meanSyncLatencyMs > 0
                ? `${summary.meanSyncLatencyMs} ms`
                : "Ready"}
            </div>
            <div className="text-[11px] font-mono text-[#64748B]">
              Sync reliability: <strong className="text-[#0B1B32]">{summary?.syncSuccessRatePct ?? 100}%</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#C8D9EA] p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
              <span>Encrypted Storage Footprint</span>
              <HardDrive size={15} className="text-[#1A56DB]" />
            </div>
            <div className="text-3xl font-serif font-black text-[#0B1B32] tabular-nums">
              {loading && !summary ? "—" : `${(summary?.totalVaultKb ?? 0).toFixed(1)} KB`}
            </div>
            <div className="text-[11px] font-mono text-[#64748B]">
              Ciphertext size only (zero readable ledger)
            </div>
          </div>
        </section>

        {/* Charts Row: Module Adoption + Sync Health */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#C8D9EA] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#0B1B32] flex items-center gap-2">
                  <Layers size={15} className="text-[#1A56DB]" />
                  <span>Site Feature &amp; Module Usage</span>
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  Number of signed-up businesses actively navigating each YuBiFLo module
                </p>
              </div>
            </div>

            {summary && summary.moduleAdoption.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.moduleAdoption}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fontSize: 11, fill: "#0B1B32", fontWeight: 600 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1B32",
                        border: "none",
                        borderRadius: "10px",
                        color: "#FFFFFF",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="count" name="Businesses" fill="#1A56DB" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-[#64748B]">
                {loading ? "Loading module telemetry..." : "No module usage events recorded yet."}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#C8D9EA] p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#0B1B32] flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Platform Health Distribution</span>
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Tenant sync reliability &amp; activity status across Firestore
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                <div>
                  <div className="text-xs font-bold text-emerald-950">Healthy &amp; Active</div>
                  <div className="text-[11px] text-emerald-700">Synced within 7d, low latency</div>
                </div>
                <span className="text-lg font-serif font-black text-emerald-800 tabular-nums">
                  {healthCounts.HEALTHY}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
                <div>
                  <div className="text-xs font-bold text-amber-950">Degraded / High Latency</div>
                  <div className="text-[11px] text-amber-800">Elevated sync errors or &gt;3.5s</div>
                </div>
                <span className="text-lg font-serif font-black text-amber-800 tabular-nums">
                  {healthCounts.DEGRADED}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">Idle (&gt;7 Days)</div>
                  <div className="text-[11px] text-slate-600">Signed up, awaiting return visit</div>
                </div>
                <span className="text-lg font-serif font-black text-slate-700 tabular-nums">
                  {healthCounts.IDLE}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Signed-Up Businesses Performance Table */}
        <section className="bg-white rounded-2xl border border-[#C8D9EA] shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#E2ECF5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-serif font-black text-[#0B1B32]">
                Signed-Up Businesses — Site Usage &amp; Performance
              </h2>
              <p className="text-xs text-[#64748B]">
                Live tenant directory showing signup timestamps, operational telemetry, and sync health only.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter business or type..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-[#C8D9EA] text-xs focus:outline-none focus:border-[#1A56DB] bg-[#F8FBFF]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-[#C8D9EA] text-xs font-semibold bg-white text-[#0B1B32] focus:outline-none focus:border-[#1A56DB]"
              >
                <option value="ALL">All Statuses</option>
                <option value="HEALTHY">Healthy</option>
                <option value="DEGRADED">Degraded</option>
                <option value="IDLE">Idle</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F8FD] border-b border-[#DCE7F3] text-[11px] font-mono uppercase text-[#475569]">
                  <th className="py-3 px-4">Business &amp; Tier</th>
                  <th className="py-3 px-4">Signed Up / Last Active</th>
                  <th className="py-3 px-4">Site Engagement</th>
                  <th className="py-3 px-4">Sync Latency &amp; Reliability</th>
                  <th className="py-3 px-4">Vault &amp; Schema</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2F8]">
                {filteredRecords.map((rec) => {
                  const totalSyncs = rec.sync_success_count + rec.sync_failure_count;
                  const syncRate =
                    totalSyncs > 0
                      ? Math.round((rec.sync_success_count / totalSyncs) * 100)
                      : 100;

                  return (
                    <tr key={rec.workspace_id} className="hover:bg-[#F8FBFF] transition">
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-[#0B1B32] text-sm leading-tight">
                          {rec.business_name}
                        </div>
                        <div className="text-[11px] text-[#475569] mt-0.5">
                          {rec.business_type} &middot;{" "}
                          <span className="font-mono text-[#64748B]">{rec.owner_handle}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#996515] font-semibold mt-0.5">
                          {rec.plan_tier} &middot; {rec.role_type}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top font-mono">
                        <div className="text-[#0B1B32] font-semibold">
                          Joined {formatShortDate(rec.signed_up_at)}
                        </div>
                        <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          <span>Active {formatRelativeTime(rec.last_active_at)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-semibold text-[#0B1B32] tabular-nums">
                          {rec.sessions_count} sessions &middot; {rec.actions_count} actions
                        </div>
                        <div className="text-[11px] text-[#475569] mt-0.5 flex items-center gap-1.5">
                          <DeviceIcon formFactor={rec.device_form_factor} />
                          <span>
                            {rec.active_modules.length} module{rec.active_modules.length === 1 ? "" : "s"} used
                          </span>
                          <span className="text-[#94A3B8]">&middot;</span>
                          <span className="font-mono text-[10px] text-[#1A56DB]">
                            {rec.last_active_tab}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top font-mono tabular-nums">
                        {rec.telemetry_source === "LIVE_TELEMETRY" ? (
                          <>
                            <div className="font-semibold text-[#0B1B32]">
                              {rec.avg_sync_latency_ms > 0 ? `${rec.avg_sync_latency_ms} ms avg` : "Cached"}{" "}
                              <span className="text-[#64748B] font-normal">
                                ({syncRate}% ok)
                              </span>
                            </div>
                            <div className="text-[11px] text-[#64748B] mt-0.5">
                              {rec.sync_success_count} syncs &middot; {rec.app_boot_ms} ms boot
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] text-[#64748B]">
                            Awaiting live heartbeat
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top font-mono tabular-nums">
                        <div className="font-semibold text-[#0B1B32] flex items-center gap-1">
                          <Lock size={11} className="text-emerald-600" />
                          <span>{rec.payload_kb.toFixed(1)} KB sealed</span>
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          Schema v{rec.schema_version} &middot; Activity idx {rec.record_score}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            rec.health_status === "HEALTHY"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : rec.health_status === "DEGRADED"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {rec.health_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-[#64748B]">
                      No businesses match the current search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
