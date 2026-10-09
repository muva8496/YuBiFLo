import React, { useState } from "react";
import { 
  Database, Network, Server, ArrowRight, ShieldAlert, CheckCircle2, 
  Terminal, Play, RefreshCw, Copy, Check, Download, Layers, 
  AlertTriangle, Cpu, HardDrive, Key, FileCode, Split, ArrowDown, Activity
} from "lucide-react";

export default function SystemArchitectureTab() {
  const [activeSubView, setActiveSubView] = useState<"diagrams" | "schemas" | "api_flows" | "fallback" | "pseudocode">("diagrams");
  const [selectedTable, setSelectedTable] = useState<string>("supply_delivery_items");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Interactive API Simulator State
  const [apiSimStep, setApiSimStep] = useState<number>(0);
  const [isSimulatingApi, setIsSimulatingApi] = useState<boolean>(false);
  const [simParams, setSimParams] = useState({
    skuCode: "MK-500ML",
    boxCapacity: 21,
    shelfBeforeDrop: 3,
    ownerDrank: 2,
    unitWholesale: 50,
    unitRetail: 65,
    newBoxes: 1
  });

  // Interactive Circuit Breaker Simulator State
  const [circuitState, setCircuitState] = useState<"CLOSED" | "OPEN" | "HALF_OPEN">("CLOSED");
  const [failureCount, setFailureCount] = useState<number>(0);
  const [lastFallbackLog, setLastFallbackLog] = useState<string>("System operating under nominal parameters. Outbox queue idle.");

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Run the API Step-by-Step Simulation
  const runApiSimulation = async () => {
    setIsSimulatingApi(true);
    setApiSimStep(1); // Gateway Ingestion
    await new Promise(r => setTimeout(r, 600));
    setApiSimStep(2); // Distributed Redis Lock
    await new Promise(r => setTimeout(r, 600));
    setApiSimStep(3); // Implied Sales Calculus
    await new Promise(r => setTimeout(r, 700));
    setApiSimStep(4); // Double-Entry Journal Validator
    await new Promise(r => setTimeout(r, 600));
    setApiSimStep(5); // PostgreSQL Serializable Commit
    await new Promise(r => setTimeout(r, 500));
    setApiSimStep(6); // Success Ack (201 Created)
    setIsSimulatingApi(false);
  };

  // Trigger simulated failures for the Circuit Breaker
  const triggerSimulatedFailure = (type: "LOCK_TIMEOUT" | "OFFLINE_DROP" | "SKEW_ERROR") => {
    const newCount = failureCount + 1;
    setFailureCount(newCount);

    if (type === "LOCK_TIMEOUT") {
      setLastFallbackLog(`[WARN 409] Redis Mutex Lock Timeout on SKU ${simParams.skuCode}. Triggered exponential backoff with full jitter: sleep = min(1000 * 2^${newCount} + rand(50), 30000)ms.`);
    } else if (type === "OFFLINE_DROP") {
      setLastFallbackLog(`[NETWORK 503] Edge carrier dropped. Mutation routed to local IndexedDB/SQLite outbox. Retry daemon standing by.`);
    } else if (type === "SKEW_ERROR") {
      setLastFallbackLog(`[CRITICAL 422] Ledger Invariant Violation: Sum(Debits) != Sum(Credits). Automatic transaction ROLLBACK executed. Zero phantom drift.`);
    }

    if (newCount >= 3) {
      setCircuitState("OPEN");
      setLastFallbackLog(prev => `${prev} -> CIRCUIT BREAKER TRIPPED TO [OPEN]. Inbound traffic fail-fast active.`);
    }
  };

  const resetCircuit = () => {
    setCircuitState("CLOSED");
    setFailureCount(0);
    setLastFallbackLog("Circuit reset to [CLOSED]. Health probe returned 200 OK. Standard serializable pipelines active.");
  };

  // Implied math for simulator
  const simImpliedSold = Math.max(0, simParams.boxCapacity - simParams.shelfBeforeDrop - simParams.ownerDrank);
  const simGrossRevenue = simImpliedSold * simParams.unitRetail;
  const simCogs = simImpliedSold * simParams.unitWholesale;
  const simGrossMargin = simGrossRevenue - simCogs;
  const simOwnerCost = simParams.ownerDrank * simParams.unitWholesale;
  const simNewShelfTotal = simParams.shelfBeforeDrop + (simParams.newBoxes * simParams.boxCapacity);

  const downloadFullSpec = () => {
    const fullText = `# YUBIFLO PRODUCTION ARCHITECTURAL SPECIFICATION
VERSION: 4.2.0-PROD
TARGET: INDUSTRIAL RETAIL & HIGH-VELOCITY SUPPLY CHAIN

## 1. CAPACITY & SUPPLY-DRIVEN IMPERIAL FORMULA
Implied Sold = Opening Box Capacity - Remaining Count - Owner Consumption - Spoilage
Gross Revenue = Implied Sold * Retail Unit Price
New Shelf Stock = Remaining Count + New Inbound Supply

## 2. DATABASE RELATIONAL SCHEMA (POSTGRESQL 16)
- counterparties (Customers & Suppliers)
- inventory_items (SKU Code, Box Capacity, Margins, Optimistic Version)
- supply_deliveries (Inbound Invoices & Receipt Hashes)
- supply_delivery_items (Crystallized Implied Sales Calculations)
- ledger_accounts (Chart of Accounts: Personal, Real, Nominal)
- journal_entries & journal_lines (Partitioned Double-Entry Invariant: Sum(Dr) == Sum(Cr))

## 3. ERROR FALLBACKS
- Redis Redlock distributed mutex
- Circuit Breaker (CLOSED -> OPEN -> HALF-OPEN)
- Exponential Backoff with Decorrelated Jitter
- Offline IndexedDB Durable Outbox Replay Queue
`;
    const blob = new Blob([fullText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `YuBiFLo_System_Architecture_Spec_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-950/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30">
              Aero-Tech & Enterprise Arch
            </span>
            <span className="text-slate-500 text-xs font-mono">&bull; Zero Phantom Drift Spec</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-serif flex items-center gap-2.5">
            <Cpu className="text-emerald-400" size={26} />
            System Architecture & DB Demonstration Lab
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
            Interactive blueprints, complete DDL schemas, live API flow simulation, circuit breaker fallback state machines, and production pseudocode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadFullSpec}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Download size={14} />
            Download Spec (.md)
          </button>
        </div>
      </div>

      {/* SUB-VIEW NAVIGATION PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/60 text-xs font-mono">
        {[
          { id: "diagrams", label: "1. Visual Diagrams & Topology", icon: <Network size={14} /> },
          { id: "schemas", label: "2. Database Schemas (DDL & NoSQL)", icon: <Database size={14} /> },
          { id: "api_flows", label: "3. Live API Flow Simulator", icon: <Server size={14} /> },
          { id: "fallback", label: "4. Error Fallback & Circuit Breaker", icon: <ShieldAlert size={14} /> },
          { id: "pseudocode", label: "5. Production System Pseudocode", icon: <FileCode size={14} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubView(tab.id as any)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition whitespace-nowrap cursor-pointer ${
              activeSubView === tab.id
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. VISUAL DIAGRAMS & TOPOLOGY */}
      {/* ========================================================================= */}
      {activeSubView === "diagrams" && (
        <div className="space-y-6">
          
          {/* HIGH LEVEL ARCHITECTURE DIAGRAM CARD */}
          <div className="bg-[#0b1511] border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Network className="text-emerald-400" size={16} />
                High-Level Distributed System Topology
              </h2>
              <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                Resilient Offline-to-Cloud Mesh
              </span>
            </div>

            <div className="bg-[#050b08] p-5 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto select-none">
              <pre>{`+----------------------------------------------------------------------------------------------------+
|                                         EDGE CLIENT TIER (OFFLINE-FIRST)                            |
|                                                                                                    |
|    +----------------------+       +-----------------------+       +---------------------------+     |
|    | Voice Ledger Audio   |  <->  | IndexedDB Outbox Q    |  <->  | Web Worker Resilient Sync |     |
|    | (Web Speech / Whisper|       | (FIFO Mutation Ring)  |       | (Circuit Breaker / Probe) |     |
|    +----------------------+       +-----------------------+       +-------------+-------------+     |
+---------------------------------------------------------------------------------|------------------+
                                                                                  | (HTTPS/Idempotent)
                                                                                  v
+----------------------------------------------------------------------------------------------------+
|                                     INGRESS & SECURITY GATEWAY (ENVOY / KONG)                      |
|       - TLS 1.3 Termination | HMAC-SHA256 Request Verification | Rate Limiting (Token Bucket)      |
+---------------------------------------------------------------------------------+------------------+
                                                                                  |
                                     +--------------------------------------------+
                                     |
                                     v
+----------------------------------------------------------------------------------------------------+
|                                         APPLICATION SERVICES (CONTAINER MESH)                      |
|                                                                                                    |
|   +-----------------------------+   +-----------------------------+   +------------------------+   |
|   | Supply Ingestion Pod        |   | Double-Entry Ledger Pod     |   | Async Telemetry Worker |   |
|   | - Implied Sales Calculator  |   | - Personal / Real / Nominal |   | - KPI Delta Aggregator |   |
|   | - Box Capacity Verifier     |   | - Balance Invariant Guard   |   | - M-Pesa Recon Matcher |   |
|   +--------------+--------------+   +--------------+--------------+   +-----------+------------+   |
+------------------|---------------------------------|------------------------------|----------------+
                   |                                 |                              |
                   v                                 v                              v
+----------------------------------------------------------------------------------------------------+
|                                           DATA & PERSISTENCE TIER                                  |
|                                                                                                    |
|   +------------------------------------+   +----------------------------------+   +------------+   |
|   | PostgreSQL 16 (Primary ACID Store) |   | Redis 7.2 (Distributed Locks)   |   | Document   |   |
|   | - Row-level locking (FOR UPDATE)   |   | - Redlock SKU Mutex             |   | Database   |   |
|   | - Serializable Isolation           |   | - 24-Hour Idempotency Cache      |   | (Cold Sync)|   |
|   | - Partitioned Journal Lines        |   | - Token Bucket Leaky Buffers     |   | Firestore  |   |
|   +------------------------------------+   +----------------------------------+   +------------+   |
+----------------------------------------------------------------------------------------------------+`}
              </pre>
            </div>
          </div>

          {/* ENTITY-RELATIONSHIP (ER) DIAGRAM CARD */}
          <div className="bg-[#0b1511] border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Database className="text-emerald-400" size={16} />
                Entity-Relationship (ER) Architecture
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                Triple-Entry Ledger & Capacity Binding
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Entity 1: Counterparties */}
              <div className="p-4 rounded-xl bg-[#09090b] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-xs text-emerald-300 font-mono">counterparties</span>
                  <span className="text-[10px] text-slate-400 font-mono">Table</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-amber-400 font-bold">&bull; id: UUID (PK)</div>
                  <div>&bull; tenant_id: UUID</div>
                  <div>&bull; account_type: ENUM(CUSTOMER, SUPPLIER)</div>
                  <div>&bull; legal_name: VARCHAR(255)</div>
                  <div>&bull; national_id: VARCHAR(32)</div>
                  <div>&bull; phone_e164: VARCHAR(20) (UQ)</div>
                  <div>&bull; credit_limit_cents: BIGINT</div>
                  <div>&bull; current_balance_cents: BIGINT</div>
                </div>
              </div>

              {/* Entity 2: Inventory Items */}
              <div className="p-4 rounded-xl bg-[#09090b] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-xs text-emerald-300 font-mono">inventory_items</span>
                  <span className="text-[10px] text-slate-400 font-mono">Table</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-amber-400 font-bold">&bull; id: UUID (PK)</div>
                  <div>&bull; sku_code: VARCHAR(64) (UQ)</div>
                  <div className="text-emerald-400 font-semibold">&bull; packaging_capacity: INT (e.g. 21)</div>
                  <div>&bull; wholesale_buy_price_cents: BIGINT</div>
                  <div>&bull; retail_unit_price_cents: BIGINT</div>
                  <div>&bull; current_shelf_stock: INT</div>
                  <div>&bull; current_reserve_stock: INT</div>
                  <div className="text-cyan-400">&bull; version: INT (Optimistic Lock)</div>
                </div>
              </div>

              {/* Entity 3: Supply Deliveries */}
              <div className="p-4 rounded-xl bg-[#09090b] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-xs text-emerald-300 font-mono">supply_deliveries</span>
                  <span className="text-[10px] text-slate-400 font-mono">Table</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-amber-400 font-bold">&bull; id: UUID (PK)</div>
                  <div className="text-purple-400 font-medium">&bull; supplier_id: UUID (FK &rarr; counterparties)</div>
                  <div>&bull; delivery_note_ref: VARCHAR(128)</div>
                  <div>&bull; payment_method: ENUM</div>
                  <div>&bull; total_cost_cents: BIGINT</div>
                  <div>&bull; paid_amount_cents: BIGINT</div>
                  <div>&bull; receipt_image_hash: VARCHAR(64)</div>
                </div>
              </div>

              {/* Entity 4: Supply Delivery Items */}
              <div className="p-4 rounded-xl bg-[#09090b] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-xs text-emerald-300 font-mono">supply_delivery_items</span>
                  <span className="text-[10px] text-slate-400 font-mono">Table</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-amber-400 font-bold">&bull; id: UUID (PK)</div>
                  <div className="text-purple-400">&bull; delivery_id: UUID (FK)</div>
                  <div className="text-purple-400">&bull; item_id: UUID (FK)</div>
                  <div>&bull; boxes_received: INT</div>
                  <div>&bull; pre_arrival_shelf_count: INT</div>
                  <div>&bull; owner_consumption_count: INT</div>
                  <div className="text-emerald-400 font-bold">&bull; crystallized_sales_units: INT</div>
                  <div>&bull; gross_implied_revenue_cents: BIGINT</div>
                  <div>&bull; cogs_cents: BIGINT</div>
                </div>
              </div>

              {/* Entity 5: Ledger Accounts */}
              <div className="p-4 rounded-xl bg-[#09090b] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-xs text-emerald-300 font-mono">ledger_accounts</span>
                  <span className="text-[10px] text-slate-400 font-mono">Table</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-amber-400 font-bold">&bull; id: UUID (PK)</div>
                  <div>&bull; account_code: VARCHAR(32) (UQ)</div>
                  <div>&bull; account_name: VARCHAR(128)</div>
                  <div className="text-blue-400 font-semibold">&bull; classification: (PERSONAL / REAL / NOMINAL)</div>
                  <div>&bull; sub_type: (DEBTOR/CREDITOR/ASSET/REV)</div>
                  <div>&bull; balance_cents: BIGINT</div>
                </div>
              </div>

              {/* Entity 6: Partitioned Journal Lines */}
              <div className="p-4 rounded-xl bg-[#09090b] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-xs text-emerald-300 font-mono">journal_lines</span>
                  <span className="text-[10px] text-slate-400 font-mono">Partitioned</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-amber-400 font-bold">&bull; id: UUID (PK)</div>
                  <div>&bull; journal_entry_id: UUID (FK)</div>
                  <div className="text-orange-400 font-semibold">&bull; posted_at: TIMESTAMPTZ (Partition Key)</div>
                  <div className="text-purple-400">&bull; account_id: UUID (FK &rarr; ledger_accounts)</div>
                  <div className="text-emerald-400 font-bold">&bull; debit_cents: BIGINT</div>
                  <div className="text-rose-400 font-bold">&bull; credit_cents: BIGINT</div>
                  <div className="text-[10px] text-slate-400">CHECK (debit &gt;= 0 AND credit &gt;= 0)</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DATABASE SCHEMAS (DDL & NOSQL) */}
      {/* ========================================================================= */}
      {activeSubView === "schemas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Table Selector Column */}
            <div className="lg:col-span-1 space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Select Schema Table</span>
              {[
                { id: "supply_delivery_items", label: "supply_delivery_items", type: "Core Calculus" },
                { id: "counterparties", label: "counterparties", type: "Debtor & Creditor" },
                { id: "inventory_items", label: "inventory_items", type: "Box Capacity" },
                { id: "ledger_accounts", label: "ledger_accounts", type: "P/R/N Chart" },
                { id: "journal_lines", label: "journal_lines", type: "Partitioned Log" },
                { id: "nosql_firestore", label: "NoSQL Firestore Model", type: "JSON Document" }
              ].map((tbl) => (
                <button
                  key={tbl.id}
                  onClick={() => setSelectedTable(tbl.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition flex flex-col gap-0.5 cursor-pointer ${
                    selectedTable === tbl.id
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                      : "bg-[#0b1511] border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="font-bold">{tbl.label}</span>
                  <span className="text-[10px] text-slate-400">{tbl.type}</span>
                </button>
              ))}
            </div>

            {/* Schema DDL Display Column */}
            <div className="lg:col-span-3 bg-[#0b1511] border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase">{selectedTable}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(getSchemaCode(selectedTable), selectedTable)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSection === selectedTable ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedSection === selectedTable ? "Copied" : "Copy SQL / JSON"}
                </button>
              </div>

              <div className="bg-[#050b08] p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto max-h-[500px]">
                <pre>{getSchemaCode(selectedTable)}</pre>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LIVE API FLOW SIMULATOR */}
      {/* ========================================================================= */}
      {activeSubView === "api_flows" && (
        <div className="space-y-6">
          
          {/* SIMULATOR CONFIG & TRIGGER */}
          <div className="bg-[#0b1511] border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Server className="text-emerald-400" size={16} />
                  Live API Ingestion & Implied Sales Calculus Simulator
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Endpoint: <span className="text-emerald-300 font-semibold">POST /api/v1/supply/crystallize</span>
                </p>
              </div>

              <button
                onClick={runApiSimulation}
                disabled={isSimulatingApi}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {isSimulatingApi ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                {isSimulatingApi ? "Simulating Execution..." : "Execute API Flow Simulation"}
              </button>
            </div>

            {/* Param Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#09090b] border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400">SKU Code</span>
                <input
                  type="text"
                  value={simParams.skuCode}
                  onChange={(e) => setSimParams({ ...simParams, skuCode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                />
              </div>

              <div className="p-3 bg-[#09090b] border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400">Box Capacity</span>
                <input
                  type="number"
                  value={simParams.boxCapacity}
                  onChange={(e) => setSimParams({ ...simParams, boxCapacity: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                />
              </div>

              <div className="p-3 bg-[#09090b] border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400">Remaining Shelf</span>
                <input
                  type="number"
                  value={simParams.shelfBeforeDrop}
                  onChange={(e) => setSimParams({ ...simParams, shelfBeforeDrop: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                />
              </div>

              <div className="p-3 bg-[#09090b] border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400">Owner Drank</span>
                <input
                  type="number"
                  value={simParams.ownerDrank}
                  onChange={(e) => setSimParams({ ...simParams, ownerDrank: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                />
              </div>

              <div className="p-3 bg-[#09090b] border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400">Cost (KES)</span>
                <input
                  type="number"
                  value={simParams.unitWholesale}
                  onChange={(e) => setSimParams({ ...simParams, unitWholesale: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                />
              </div>

              <div className="p-3 bg-[#09090b] border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400">Retail (KES)</span>
                <input
                  type="number"
                  value={simParams.unitRetail}
                  onChange={(e) => setSimParams({ ...simParams, unitRetail: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                />
              </div>

              <div className="p-3 bg-[#09090b] border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400">New Inbound Box</span>
                <input
                  type="number"
                  value={simParams.newBoxes}
                  onChange={(e) => setSimParams({ ...simParams, newBoxes: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                />
              </div>
            </div>

            {/* COMPUTED MATHEMATICAL SUMMARY BAR */}
            <div className="p-4 rounded-xl bg-[#000000] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div>
                <span className="text-slate-400">Crystallized Units Sold:</span>{" "}
                <span className="text-emerald-400 font-bold text-sm">
                  {simImpliedSold} pkts
                </span>
                <span className="text-slate-500 text-[10px] ml-1">
                  ({simParams.boxCapacity} - {simParams.shelfBeforeDrop} - {simParams.ownerDrank})
                </span>
              </div>

              <div>
                <span className="text-slate-400">Gross Implied Rev:</span>{" "}
                <span className="text-white font-bold text-sm">KES {simGrossRevenue.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-400">COGS:</span>{" "}
                <span className="text-slate-300 font-bold">KES {simCogs.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-400">Gross Margin:</span>{" "}
                <span className="text-emerald-400 font-bold">KES {simGrossMargin.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-400">New Shelf Stock:</span>{" "}
                <span className="text-cyan-400 font-bold">{simNewShelfTotal} pkts</span>
              </div>
            </div>

            {/* SEQUENCE PIPELINE STEPS */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Execution Pipeline Trace
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 font-mono text-xs">
                {[
                  { step: 1, title: "1. Gateway & Auth", desc: "Token Verify & HMAC" },
                  { step: 2, title: "2. Redis Redlock", desc: "Acquire Mutex on SKU" },
                  { step: 3, title: "3. Implied Calculus", desc: "Sold = Cap - Shelf - Drank" },
                  { step: 4, title: "4. Ledger Guard", desc: "Sum(Dr) == Sum(Cr)" },
                  { step: 5, title: "5. DB Commit", desc: "Serializable Isolation" },
                  { step: 6, title: "6. Client 201 Ack", desc: "Release Lock & Response" }
                ].map((s) => {
                  const isActive = apiSimStep === s.step;
                  const isCompleted = apiSimStep > s.step;
                  return (
                    <div
                      key={s.step}
                      className={`p-3 rounded-xl border transition flex flex-col gap-1 ${
                        isActive
                          ? "bg-amber-500/20 border-amber-500 text-amber-200 animate-pulse"
                          : isCompleted
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                          : "bg-slate-900/60 border-slate-800 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px]">{s.title}</span>
                        {isCompleted && <CheckCircle2 size={12} className="text-emerald-400" />}
                      </div>
                      <span className="text-[10px] leading-tight opacity-80">{s.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LIVE JSON PAYLOAD VIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-400">Request Body (Client &rarr; Inbound API)</span>
                <div className="bg-[#050b08] p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 max-h-48 overflow-y-auto">
                  <pre>{JSON.stringify({
                    tenant_id: "9a38f322-c2cb-4fa1-8f5b-b9c1d683a301",
                    supplier_id: "brookside-dairy-ke",
                    delivery_ref: "DN-9012",
                    payment_method: "MPESA",
                    sku_code: simParams.skuCode,
                    box_capacity: simParams.boxCapacity,
                    shelf_remaining_before_drop: simParams.shelfBeforeDrop,
                    owner_drawings: simParams.ownerDrank,
                    boxes_received: simParams.newBoxes
                  }, null, 2)}</pre>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-400">Atomic Response Body (API &rarr; Client 201)</span>
                <div className="bg-[#050b08] p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 max-h-48 overflow-y-auto">
                  <pre>{JSON.stringify({
                    status: apiSimStep >= 5 ? "SUCCESS" : "AWAITING_COMMIT",
                    crystallized_sales_units: simImpliedSold,
                    gross_revenue_kes: simGrossRevenue,
                    cogs_kes: simCogs,
                    gross_margin_kes: simGrossMargin,
                    owner_drawing_cost_kes: simOwnerCost,
                    new_shelf_stock: simNewShelfTotal,
                    ledger_invariants_met: true,
                    isolation_level: "SERIALIZABLE"
                  }, null, 2)}</pre>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ERROR FALLBACK & CIRCUIT BREAKER */}
      {/* ========================================================================= */}
      {activeSubView === "fallback" && (
        <div className="space-y-6">
          <div className="bg-[#0b1511] border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <ShieldAlert className="text-emerald-400" size={16} />
                  Circuit Breaker & Fallback State Machine
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Automated failover, exponential backoff with full jitter, and offline outbox queuing.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-2 ${
                  circuitState === "CLOSED"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : circuitState === "OPEN"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/50"
                }`}>
                  <Activity size={14} />
                  Circuit State: [{circuitState}]
                </div>

                <button
                  onClick={resetCircuit}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw size={12} />
                  Reset Circuit
                </button>
              </div>
            </div>

            {/* FAILURE SIMULATION BUTTONS */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Inject Production Anomaly / Fault
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => triggerSimulatedFailure("LOCK_TIMEOUT")}
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-mono text-xs text-left transition flex flex-col gap-1 cursor-pointer"
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Inject 409 Mutex Collision
                  </span>
                  <span className="text-[10px] text-slate-400">Triggers exponential backoff with jitter retry</span>
                </button>

                <button
                  onClick={() => triggerSimulatedFailure("OFFLINE_DROP")}
                  className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 font-mono text-xs text-left transition flex flex-col gap-1 cursor-pointer"
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <HardDrive size={14} /> Inject Offline Network Drop
                  </span>
                  <span className="text-[10px] text-slate-400">Routes payload to IndexedDB durable outbox</span>
                </button>

                <button
                  onClick={() => triggerSimulatedFailure("SKEW_ERROR")}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 font-mono text-xs text-left transition flex flex-col gap-1 cursor-pointer"
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Inject Skewed Debit/Credit
                  </span>
                  <span className="text-[10px] text-slate-400">Forces instant ACID rollback, prevents drift</span>
                </button>
              </div>
            </div>

            {/* LIVE LOG / TELEMETRY TERMINAL */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal size={12} className="text-emerald-400" />
                  Live Operational Telemetry & Fallback Log
                </span>
                <span className="text-[10px] font-mono text-slate-500">Failures: {failureCount} / 3</span>
              </div>
              <div className="bg-[#050b08] p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 leading-relaxed min-h-24">
                {lastFallbackLog}
              </div>
            </div>

            {/* EXPONENTIAL JITTER FORMULA CARD */}
            <div className="bg-[#09090b] p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <span className="text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                Full Jitter Backoff Formula (AWS Architecture Standard):
              </span>
              <p className="text-slate-400 text-[11px]">
                <code>sleep_ms = min(MAX_BACKOFF, BASE_BACKOFF * 2^attempt) + uniform_random(0, JITTER_CAP)</code>
              </p>
              <div className="text-[10px] text-slate-400">
                Prevents synchronized thundering herd spikes on the PostgreSQL connection pool when 1,000 POS terminals simultaneously reconnect after cell tower drops.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PRODUCTION SYSTEM PSEUDOCODE */}
      {/* ========================================================================= */}
      {activeSubView === "pseudocode" && (
        <div className="space-y-6">
          <div className="bg-[#0b1511] border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-emerald-400" />
                <span className="font-mono text-xs font-bold text-white uppercase">
                  Production Ingestion & Ledger Validation Pseudocode (Python / TypeScript Async)
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(PRODUCTION_PSEUDOCODE_TEXT, "pseudocode_core")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedSection === "pseudocode_core" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedSection === "pseudocode_core" ? "Copied" : "Copy Pseudocode"}
              </button>
            </div>

            <div className="bg-[#050b08] p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto max-h-[600px]">
              <pre>{PRODUCTION_PSEUDOCODE_TEXT}</pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// -----------------------------------------------------------------------------
// HELPER DDL & PSEUDOCODE STRINGS
// -----------------------------------------------------------------------------

function getSchemaCode(tableName: string): string {
  switch (tableName) {
    case "supply_delivery_items":
      return `-- 4. DELIVERY LINE ITEMS & CAPACITY CRYSTALLIZATION
CREATE TABLE supply_delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES supply_deliveries(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    boxes_received INT NOT NULL DEFAULT 0,
    units_per_box INT NOT NULL,
    loose_units_received INT NOT NULL DEFAULT 0,
    total_units_inbound INT GENERATED ALWAYS AS ((boxes_received * units_per_box) + loose_units_received) STORED,
    pre_arrival_shelf_count INT NOT NULL,     -- Counted right before new box placed
    owner_consumption_count INT NOT NULL DEFAULT 0,
    breakage_count INT NOT NULL DEFAULT 0,
    crystallized_sales_units INT NOT NULL,    -- Calculated: (previous_stock - pre_arrival_shelf_count)
    unit_cost_cents BIGINT NOT NULL,
    unit_sale_cents BIGINT NOT NULL,
    gross_implied_revenue_cents BIGINT NOT NULL,
    cogs_cents BIGINT NOT NULL,
    gross_profit_cents BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CLOCK_TIMESTAMP()
);

CREATE INDEX idx_delivery_items_delivery_id ON supply_delivery_items (delivery_id);
CREATE INDEX idx_delivery_items_item_id ON supply_delivery_items (item_id);`;

    case "counterparties":
      return `-- 1. COUNTERPARTY (SUPPLIERS & CUSTOMERS)
CREATE TABLE counterparties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CUSTOMER', 'SUPPLIER')),
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    national_id VARCHAR(32),
    phone_e164 VARCHAR(20) NOT NULL,
    till_or_paybill VARCHAR(32),
    credit_limit_cents BIGINT NOT NULL DEFAULT 0,
    current_balance_cents BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CLOCK_TIMESTAMP(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CLOCK_TIMESTAMP(),
    CONSTRAINT uq_tenant_counterparty_phone UNIQUE (tenant_id, phone_e164)
);

CREATE INDEX idx_counterparties_tenant_type ON counterparties (tenant_id, account_type);
CREATE INDEX idx_counterparties_national_id ON counterparties (national_id) WHERE national_id IS NOT NULL;`;

    case "inventory_items":
      return `-- 2. INVENTORY ITEMS & CAPACITY PROFILES
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sku_code VARCHAR(64) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    unit_category VARCHAR(64) NOT NULL,
    packaging_capacity INT NOT NULL DEFAULT 1,
    threshold_reorder INT NOT NULL DEFAULT 5,
    wholesale_buy_price_cents BIGINT NOT NULL,
    retail_unit_price_cents BIGINT NOT NULL,
    current_shelf_stock INT NOT NULL DEFAULT 0,
    current_reserve_stock INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 1, -- Optimistic concurrency lock
    created_at TIMESTAMPTZ NOT NULL DEFAULT CLOCK_TIMESTAMP(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CLOCK_TIMESTAMP(),
    CONSTRAINT uq_tenant_sku UNIQUE (tenant_id, sku_code),
    CONSTRAINT chk_positive_capacity CHECK (packaging_capacity > 0)
);

CREATE INDEX idx_inventory_tenant ON inventory_items (tenant_id);`;

    case "ledger_accounts":
      return `-- 5. LEDGER ACCOUNTS (CHART OF ACCOUNTS)
CREATE TYPE ledger_classification AS ENUM ('PERSONAL', 'REAL', 'NOMINAL');
CREATE TYPE account_sub_type AS ENUM ('DEBTOR', 'CREDITOR', 'ASSET', 'EQUITY', 'REVENUE', 'EXPENSE');

CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_code VARCHAR(32) NOT NULL,
    account_name VARCHAR(128) NOT NULL,
    classification ledger_classification NOT NULL,
    sub_type account_sub_type NOT NULL,
    balance_cents BIGINT NOT NULL DEFAULT 0,
    is_reconciled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CLOCK_TIMESTAMP(),
    CONSTRAINT uq_tenant_account_code UNIQUE (tenant_id, account_code)
);`;

    case "journal_lines":
      return `-- 7. PARTITIONED DOUBLE-ENTRY JOURNAL LINES
CREATE TABLE journal_lines (
    id UUID DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL,
    posted_at TIMESTAMPTZ NOT NULL,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    debit_cents BIGINT NOT NULL DEFAULT 0,
    credit_cents BIGINT NOT NULL DEFAULT 0,
    counterparty_id UUID REFERENCES counterparties(id),
    CONSTRAINT chk_positive_debit CHECK (debit_cents >= 0),
    CONSTRAINT chk_positive_credit CHECK (credit_cents >= 0),
    CONSTRAINT chk_one_sided CHECK (
        (debit_cents > 0 AND credit_cents = 0) OR 
        (credit_cents > 0 AND debit_cents = 0)
    ),
    PRIMARY KEY (id, posted_at)
) PARTITION BY RANGE (posted_at);

-- Monthly partition template:
CREATE TABLE journal_lines_2026_m10 PARTITION OF journal_lines
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');`;

    case "nosql_firestore":
      return `// FIRESTORE DOCUMENT STRUCTURE (FOR HYBRID CLIENT REPLICATION)
{
  "tenants": {
    "{tenantId}": {
      "metadata": { "shop_name": "Retail Store [Tenant Vault]", "currency": "KES" },
      "inventory": {
        "{skuCode}": {
          "item_name": "Mt Kenya Milk 500ml",
          "box_capacity": 21,
          "shelf_stock": 24,
          "reserve_stock": 42,
          "buy_cost": 50,
          "retail_price": 65,
          "updated_at": "2026-10-08T12:00:00Z"
        }
      },
      "deliveries": {
        "{deliveryId}": {
          "supplier": "Brookside",
          "implied_sales_crystallized": 16,
          "gross_revenue": 1040,
          "status": "COMMITTED"
        }
      }
    }
  }
}`;

    default:
      return "";
  }
}

const PRODUCTION_PSEUDOCODE_TEXT = `async function processInboundSupplyCycle(payload, dbPool, redisClient) {
  // 1. Idempotency Check
  const idempKey = \`idemp:\${payload.tenantId}:\${payload.idempotencyKey}\`;
  if (await redisClient.get(idempKey)) {
    return { status: "ALREADY_PROCESSED" };
  }

  // 2. Distributed Mutex on SKU set
  const lockKey = \`lock:sku:\${payload.tenantId}:\${payload.skuId}\`;
  const locked = await redisClient.set(lockKey, "1", "NX", "EX", 15);
  if (!locked) throw new ConcurrencyCollisionError("SKU write lock held");

  try {
    return await dbPool.transaction(async (tx) => {
      // 3. Row lock current inventory state
      const stock = await tx.query(
        "SELECT current_shelf_stock, version FROM inventory_items WHERE id = $1 FOR UPDATE",
        [payload.skuId]
      );

      // 4. Implied Sales Calculus
      // Sold = Previous Shelf - Count Before Drop - Owner Drank - Waste
      const soldUnits = Math.max(0, stock.current_shelf_stock - payload.shelfBeforeDrop - payload.ownerDrank);
      const grossRev = soldUnits * payload.unitRetailPrice;
      const cogs = soldUnits * payload.unitWholesaleCost;
      const ownerCost = payload.ownerDrank * payload.unitWholesaleCost;
      const newShelfStock = payload.shelfBeforeDrop + (payload.newBoxes * payload.boxCapacity);

      // 5. Update Inventory with Optimistic Version Token
      const res = await tx.query(
        "UPDATE inventory_items SET current_shelf_stock = $1, version = version + 1 WHERE id = $2 AND version = $3",
        [newShelfStock, payload.skuId, stock.version]
      );
      if (res.rowCount === 0) throw new ConcurrencyCollisionError("Optimistic version mismatch");

      // 6. Double-Entry Journal Lines Assembly
      const lines = [
        { account: "1010-CASH", dr: grossRev, cr: 0 },
        { account: "4010-SALES-REV", dr: 0, cr: grossRev },
        { account: "5010-COGS", dr: cogs, cr: 0 },
        { account: "1030-INVENTORY", dr: 0, cr: cogs }
      ];
      if (ownerCost > 0) {
        lines.push({ account: "3020-DRAWINGS", dr: ownerCost, cr: 0 });
        lines.push({ account: "1030-INVENTORY", dr: 0, cr: ownerCost });
      }

      // 7. Balance Invariant Check: Sum(Dr) === Sum(Cr)
      const sumDr = lines.reduce((acc, l) => acc + l.dr, 0);
      const sumCr = lines.reduce((acc, l) => acc + l.cr, 0);
      if (sumDr !== sumCr) throw new LedgerSkewError(\`Debit \${sumDr} != Credit \${sumCr}\`);

      // 8. Commit journal entries
      await tx.batchInsertJournalLines(lines);

      // 9. Store idempotency key
      await redisClient.set(idempKey, "COMMITTED", "EX", 86400);

      return {
        status: "COMMITTED",
        unitsSold: soldUnits,
        grossRevenue: grossRev,
        newShelfStock: newShelfStock
      };
    });
  } finally {
    await redisClient.del(lockKey);
  }
}`;
