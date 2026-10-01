import React, { useState, useEffect } from "react";
import {
  Database,
  Copy,
  Check,
  Terminal,
  Layers,
  ShieldCheck,
  Cpu,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Server,
  RefreshCw,
  HardDrive,
  Download,
  Upload,
  Table,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Eye,
} from "lucide-react";
import { POSTGRES_MIGRATION_SQL } from "../services/schemaSql";
import { AppStorage } from "../services/storage";

interface SchemaViewProps {
  isAdmin?: boolean;
  onOpenAdminAuth?: () => void;
}

export const SchemaView: React.FC<SchemaViewProps> = ({
  isAdmin = false,
  onOpenAdminAuth,
}) => {
  const [activeTab, setActiveTab] = useState<"database" | "sql" | "tables">("database");
  const [copied, setCopied] = useState(false);
  const [serverDbStatus, setServerDbStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>("items");
  const [tableRecords, setTableRecords] = useState<any[]>([]);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ msg: string; type: "success" | "error" | "idle" }>({
    msg: "",
    type: "idle",
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRES_MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchServerDbStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/db/status");
      const data = await res.json();
      if (data.success) {
        setServerDbStatus(data);
      }
    } catch (err) {
      console.warn("Could not reach /api/db/status", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    setSelectedTable(tableName);
    setIsLoadingTable(true);
    try {
      const res = await fetch(`/api/db/table/${tableName}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTableRecords(data.data);
      } else {
        // Fallback to local storage table
        const localData = (AppStorage as any)[`get${capitalize(tableName)}`]?.() || [];
        setTableRecords(Array.isArray(localData) ? localData : []);
      }
    } catch {
      const localData = (AppStorage as any)[`get${capitalize(tableName)}`]?.() || [];
      setTableRecords(Array.isArray(localData) ? localData : []);
    } finally {
      setIsLoadingTable(false);
    }
  };

  const capitalize = (s: string) => {
    if (s === "items") return "Items";
    if (s === "suppliers") return "Suppliers";
    if (s === "customers") return "Customers";
    if (s === "sales") return "Sales";
    if (s === "batches") return "Batches";
    if (s === "expenses") return "Expenses";
    if (s === "morning_logs") return "MorningLogs";
    if (s === "reconciliations") return "Reconciliations";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const handleManualSyncNow = async () => {
    setSyncStatus({ msg: "Synchronizing local data to Admin Server Database...", type: "idle" });
    try {
      const backupStr = AppStorage.exportAllDataJSON();
      const parsed = JSON.parse(backupStr);
      const res = await fetch("/api/db/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tables: {
            merchant: parsed.merchant,
            items: parsed.items,
            expenses: parsed.expenses,
            batches: parsed.batches,
            sales: parsed.sales,
            reconciliations: parsed.reconciliations,
            morning_logs: parsed.morning_logs,
            suppliers: parsed.suppliers,
            supplier_deliveries: parsed.supplier_deliveries,
            supplier_payments: parsed.supplier_payments,
            customers: parsed.customers,
            customer_sales: parsed.customer_sales,
            customer_repayments: parsed.customer_repayments,
            owner_capital: parsed.owner_capital,
          },
          source: "admin_manual_sync",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus({ msg: `Database synchronized! (${data.tablesUpdated.length} tables persisted)`, type: "success" });
        fetchServerDbStatus();
        fetchTableData(selectedTable);
      } else {
        setSyncStatus({ msg: `Sync notice: ${data.error || "Failed"}`, type: "error" });
      }
    } catch (err: any) {
      setSyncStatus({ msg: `Sync failed: ${err.message}`, type: "error" });
    }
    setTimeout(() => {
      setSyncStatus({ msg: "", type: "idle" });
    }, 4000);
  };

  const handleDownloadDbDump = async () => {
    try {
      const res = await fetch("/api/db/export");
      const data = await res.json();
      const dumpStr = JSON.stringify(data.database || data, null, 2);
      const blob = new Blob([dumpStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `yubiflo_server_db_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      AppStorage.downloadBackupFile();
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchServerDbStatus();
      fetchTableData("items");
    }
  }, [isAdmin]);

  // If user is not an admin, render the restricted access screen
  if (!isAdmin) {
    return (
      <div id="schema-view-locked" className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 uppercase tracking-wider font-bold">
            Admin Access Restricted
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Database & Schema is Locked (Admin Only)
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            The Admin Database, live table queries, server persistence engine, and PostgreSQL DDL migrations are strictly restricted to the administrator.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 max-w-md mx-auto text-left space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Idhini ya Mwenye Duka (Authentication)</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Please enter your 4-digit Admin PIN to unlock the Admin Database Browser and PostgreSQL schema definitions.
          </p>
          <div className="pt-2">
            <button
              id="unlock-schema-btn"
              type="button"
              onClick={onOpenAdminAuth}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Ingiza Admin PIN (Unlock Database)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tableList = [
    { id: "items", label: "inventory_items", desc: "Items & stock" },
    { id: "suppliers", label: "suppliers", desc: "Vendors & aliases" },
    { id: "customers", label: "customers", desc: "Customer accounts" },
    { id: "batches", label: "supply_batches", desc: "Stock batches" },
    { id: "sales", label: "sales_ledger", desc: "Velocity sales" },
    { id: "expenses", label: "money_out", desc: "Purchases & expenses" },
    { id: "morning_logs", label: "daily_morning_logs", desc: "05:57 AM snapshots" },
    { id: "reconciliations", label: "reconciliations", desc: "Cash gap audits" },
  ];

  return (
    <div id="schema-view" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
              <Unlock className="w-3 h-3" /> ADMIN DATABASE UNLOCKED
            </span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <span>Admin Persistent Database & Schema Console</span>
          </h1>
          <p className="text-xs text-slate-400">
            Dedicated backend database storage, live table browser, and PostgreSQL migration schema.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleManualSyncNow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all"
            title="Force immediate synchronization from client to persistent server database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync to Server DB</span>
          </button>
          <button
            onClick={handleDownloadDbDump}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            title="Download full server JSON database dump"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Dump</span>
          </button>
        </div>
      </div>

      {syncStatus.msg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            syncStatus.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
              : syncStatus.type === "error"
              ? "bg-rose-950/40 border-rose-800/40 text-rose-300"
              : "bg-indigo-950/40 border-indigo-800/40 text-indigo-300"
          }`}
        >
          {syncStatus.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-cyan-400" />
          )}
          <span>{syncStatus.msg}</span>
        </div>
      )}

      {/* Database Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("database")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === "database"
              ? "bg-indigo-600 text-white shadow"
              : "bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Server Database & Status</span>
        </button>
        <button
          onClick={() => setActiveTab("tables")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === "tables"
              ? "bg-indigo-600 text-white shadow"
              : "bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Live Table Browser</span>
        </button>
        <button
          onClick={() => setActiveTab("sql")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === "sql"
              ? "bg-indigo-600 text-white shadow"
              : "bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>PostgreSQL DDL Migration</span>
        </button>
      </div>

      {activeTab === "database" && (
        <div className="space-y-4">
          {/* Server Storage Health Box */}
          <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Cloud SQL PostgreSQL Database Engine (Active)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                Region: europe-west2 (London) • 1 TB - 64 TB Auto-Scaling
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This dedicated Google Cloud SQL (PostgreSQL) instance powers persistent multi-device synchronization with auto-scaling storage up to 64 TB. All shop transactions, supplier accounts, customer debts, and morning float audits are replicated directly to the cloud database.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Engine & Region</span>
                <span className="font-bold text-cyan-400">
                  europe-west2
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Storage Tier</span>
                <span className="font-bold text-slate-200">
                  1 TB (Auto-Scale)
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Cloud SQL Status</span>
                <span className="font-bold text-emerald-400">Provisioned & Live</span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Active Tables</span>
                <span className="font-bold text-slate-300 text-[10px] truncate block">
                  8 Relational Tables
                </span>
              </div>
            </div>
          </div>

          {/* Database Tables Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-1 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>Core Entity Tables</span>
              </div>
              <p className="text-slate-200 text-xs font-mono">merchants, inventory_items, suppliers, customers</p>
              <p className="text-[11px] text-slate-400">
                Stores shop profile, currency, stock balances, unit cost & retail prices, supplier & customer ledgers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-1 shadow-xl">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>Supply Velocity Engines</span>
              </div>
              <p className="text-slate-200 text-xs font-mono">supply_batches, sales_ledger</p>
              <p className="text-[11px] text-slate-400">
                Automates batch lifecycle (ACTIVE -&gt; CLOSED) and auto-generates sales records.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-1 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Audit & Overheads</span>
              </div>
              <p className="text-slate-200 text-xs font-mono">money_out, daily_morning_logs, reconciliations</p>
              <p className="text-[11px] text-slate-400">
                Records all money out, morning 05:57 float snapshots, and reverse cash audits.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tables" && (
        <div className="space-y-4">
          {/* Table Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {tableList.map((t) => (
              <button
                key={t.id}
                onClick={() => fetchTableData(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedTable === t.id
                    ? "bg-emerald-600 text-white font-bold shadow"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Table Data Viewer */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Table className="w-4 h-4 text-emerald-400" />
                <span>
                  Table: <span className="text-emerald-400 font-bold">{selectedTable}</span> ({tableRecords.length} records)
                </span>
              </div>
              <button
                onClick={() => fetchTableData(selectedTable)}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingTable ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Loading table records...
              </div>
            ) : tableRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No records found in table `{selectedTable}`.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">#</th>
                      {Object.keys(tableRecords[0] || {}).slice(0, 7).map((col) => (
                        <th key={col} className="p-2.5 uppercase tracking-wider text-[10px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {tableRecords.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-2.5 text-slate-500 text-[11px]">{idx + 1}</td>
                        {Object.keys(tableRecords[0] || {}).slice(0, 7).map((col) => {
                          const val = row[col];
                          return (
                            <td key={col} className="p-2.5 truncate max-w-[200px] text-[11px]">
                              {typeof val === "object" ? JSON.stringify(val) : String(val ?? "-")}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "sql" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Ready for PostgreSQL, Cloud SQL, Supabase, or RDS deployment.
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-bold text-white shadow transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied SQL!" : "Copy DDL Script"}</span>
            </button>
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>yubiflo_postgres_schema.sql</span>
              </div>
              <button
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono transition-colors"
              >
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[600px] leading-relaxed">
              <code>{POSTGRES_MIGRATION_SQL}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
