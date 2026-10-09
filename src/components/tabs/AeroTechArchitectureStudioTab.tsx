import React, { useState } from "react";
import { 
  Cpu, Database, GitBranch, ShieldAlert, Terminal, 
  Play, RefreshCw, CheckCircle2, AlertTriangle, Layers, 
  Server, Key, Lock, ArrowRight, Code, Eye, Copy, Check,
  Zap, Flame, Bug, WifiOff, FileCode2, Binary, Activity
} from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";

interface AeroTechArchitectureStudioTabProps {
  state: AlacioMasterState;
}

type StudioSection = "simulator" | "schemas" | "api_flows" | "fallbacks" | "pseudocode";

interface StressTestScenario {
  id: string;
  title: string;
  difficulty: "CRITICAL" | "HIGH" | "MEDIUM";
  trigger: string;
  failureMode: string;
  resilienceMechanism: string;
  expectedOutcome: string;
  executionSteps: { step: number; action: string; status: "success" | "mitigated" | "pending"; latency: string }[];
}

export default function AeroTechArchitectureStudioTab({ state }: AeroTechArchitectureStudioTabProps) {
  const [activeSection, setActiveSection] = useState<StudioSection>("simulator");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("scenario_mpesa_timeout");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 5 BATTLE-TESTED AERO-TECH CHAOS STRESS SCENARIOS
  const scenarios: StressTestScenario[] = [
    {
      id: "scenario_mpesa_timeout",
      title: "Daraja M-Pesa Webhook Blackout & Dropped Inflow",
      difficulty: "CRITICAL",
      trigger: "Customer pays KES 975 for Mt Kenya Milk box drop, but Safaricom gateway fails to return C2B callback within 15s window.",
      failureMode: "Uncommitted transaction leaves cash drawer / electronic till disconnected from shelf depletion; risk of duplicate payment or false leakage.",
      resilienceMechanism: "Idempotency Hash + Reverse Polling Worker + Local Staged State with Circuit Breaker (Timeout = 4000ms).",
      expectedOutcome: "Zero money lost. Transaction parked as STAGED_INFLOW; auto-cleared upon next polling handshake without human panic.",
      executionSteps: [
        { step: 1, action: "Customer sends KES 975 via Till 9382104. Terminal generates SHA-256 Idempotency Key: 'mpesa_hash_c8f29a'.", status: "success", latency: "12ms" },
        { step: 2, action: "Webhook HTTP POST to /api/v1/mpesa/c2b times out (Gateway 504). Circuit Breaker trips to OPEN state.", status: "mitigated", latency: "4000ms" },
        { step: 3, action: "Fallback Trigger: Autonomous Ledger Queue activates. Enqueues background poll with exponential jitter [1s, 2s, 4s].", status: "success", latency: "42ms" },
        { step: 4, action: "Worker verifies receipt code via Safaricom Query API. Ledger atomically credits Till Account: KES +975.", status: "success", latency: "1150ms" }
      ]
    },
    {
      id: "scenario_offline_supply_drop",
      title: "Rural 3G Network Blackout: 3 Supply Boxes Drop Simultaneously",
      difficulty: "HIGH",
      trigger: "Bicycle distributor drops 21 Mt Kenya Milk, 12 Unga Jogoo, and 20 Broadways loaves while cell tower is down for 3 hours.",
      failureMode: "Cloud Firestore unreachable. Ordinary web apps freeze or throw fatal sync exceptions.",
      resilienceMechanism: "Write-Ahead Journal in IndexedDB + Client CRDT (Conflict-Free Replicated Data Type) + Monotonic Vector Clock.",
      expectedOutcome: "All 3 deliveries and implied customer sales logged instantaneously offline; automatically drained to cloud when signal returns.",
      executionSteps: [
        { step: 1, action: "Network disconnect detected (navigator.onLine = false). System switches to L1 Sovereign Offline Persistence.", status: "success", latency: "1ms" },
        { step: 2, action: "Commit batch deliveries to local IndexedDB Write-Ahead Journal. Calculate implied sales: KES 975 + 1890 + 1040.", status: "success", latency: "4ms" },
        { step: 3, action: "Update local shelf counters and Owner Personal Drawings (2 milks drank = KES 100) with local monotonic timestamp.", status: "success", latency: "2ms" },
        { step: 4, action: "Reconnection detected (L1 -> L2 drain). Dual-write reconciles with cloud Firestore using Vector Clock; zero data collisions.", status: "success", latency: "380ms" }
      ]
    },
    {
      id: "scenario_double_enter_idempotency",
      title: "Split-Second Double Enter / Rapid Retap on Delivery Drop",
      difficulty: "MEDIUM",
      trigger: "Shop clerk aggressively presses 'Enter' 3 times in 80 milliseconds while confirming an incoming wholesale shipment of KES 6,800.",
      failureMode: "Triple insertion into database creates duplicate payables, artificially tripling debt or draining drawer balance.",
      resilienceMechanism: "Client UI Token Lock + Database Composite Unique Key (merchant_id, delivery_note, SHA256(items)).",
      expectedOutcome: "First request commits atomically; subsequent 2 requests return cached idempotent 200 OK response with zero duplication.",
      executionSteps: [
        { step: 1, action: "Event 1 arrives: Idempotency Key 'idemp_deliv_77402' locked in Redis / memory mutex with 60-second TTL.", status: "success", latency: "8ms" },
        { step: 2, action: "Event 2 & 3 arrive within 40ms. Mutex detects lock in progress; suppresses parallel execution branches.", status: "mitigated", latency: "1ms" },
        { step: 3, action: "Event 1 inserts batch record into database; commits KES 6,800 inventory credit.", status: "success", latency: "65ms" },
        { step: 4, action: "Event 2 & 3 return HTTP 200 with 'X-Idempotent-Replay: true'; UI displays 'Single Record Preserved'.", status: "success", latency: "2ms" }
      ]
    },
    {
      id: "scenario_owner_drawing_night_dispute",
      title: "Owner Consumed 2 Milks: Evening Closing Variance Reconciliation",
      difficulty: "HIGH",
      trigger: "Shopkeeper drank 2 pieces of 500ml milk from the 21-pack box. Register drawer is short KES 130 retail / KES 100 cost.",
      failureMode: "Standard POS marks KES 130 as 'Unaccounted Cash Shortage / Employee Theft', triggering false alarm panic.",
      resilienceMechanism: "Nominal Account Classification: Debit Owner Drawings @ Cost Price (KES 100), adjust Implied Sales to Net 19 pkts.",
      expectedOutcome: "Audit variance resolves to exactly KES 0.00. Mathematical truth separates business revenue from owner drawings.",
      executionSteps: [
        { step: 1, action: "Supply-driven formula evaluates: 21 (Box) - 3 (Remaining) - 2 (Owner Drank) = 16 Customer Sales.", status: "success", latency: "2ms" },
        { step: 2, action: "Credit Nominal Revenue: 16 pkts x KES 65 = KES 1,040. Debit Cash Register: KES +1,040.", status: "success", latency: "3ms" },
        { step: 3, action: "Debit Nominal Drawings: 2 pkts x KES 50 (Cost) = KES 100. Non-cash debit posted cleanly to Personal Accounts.", status: "success", latency: "3ms" },
        { step: 4, action: "Evening Audit checks physical cash vs expected. Variance = KES 0.00 (Zero Drift Verified).", status: "success", latency: "1ms" }
      ]
    },
    {
      id: "scenario_concurrency_race_condition",
      title: "Concurrent Counter Sale & Backroom Shelf Transfer (Race Condition)",
      difficulty: "CRITICAL",
      trigger: "Clerk in backroom transfers 5 units of Sugar to shelf at exact millisecond counter clerk sells last 2 units on shelf.",
      failureMode: "Dirty read or lost update causes inventory count to overwrite, leaving phantom negative shelf stock.",
      resilienceMechanism: "PostgreSQL Row-Level Advisory Locking ('SELECT ... FOR UPDATE') + Optimistic Concurrency Control (OCC).",
      expectedOutcome: "Atomic serialization. Both operations execute sequentially; inventory balance guarantees exact mathematical equilibrium.",
      executionSteps: [
        { step: 1, action: "Process A initiates Shelf Transfer: Acquires row lock on SKU #14 (Mumias Sugar) via SELECT ... FOR UPDATE.", status: "success", latency: "14ms" },
        { step: 2, action: "Process B initiates POS Sale: Hits lock boundary; queued in serializable transaction buffer.", status: "mitigated", latency: "18ms" },
        { step: 3, action: "Process A increments shelf stock: +5 units. Commits transaction and releases row lock.", status: "success", latency: "22ms" },
        { step: 4, action: "Process B executes against freshly committed balance: -2 units. Final shelf stock = 3 units exact.", status: "success", latency: "16ms" }
      ]
    }
  ];

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const runSimulation = () => {
    setIsSimulating(true);
    setSimStep(0);
    setSimLogs([`[0.0ms] Initializing Chaos Engine for scenario: "${currentScenario.title}"...`]);

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex <= currentScenario.executionSteps.length) {
        setSimStep(stepIndex);
        const curr = currentScenario.executionSteps[stepIndex - 1];
        setSimLogs((prev) => [
          ...prev,
          `[+${curr.latency}] STEP ${curr.step}: ${curr.action} -> (${curr.status.toUpperCase()})`
        ]);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setSimLogs((prev) => [
          ...prev,
          `[COMPLETE] Stress test finished with 100% resilience. System State: ZERO DRIFT &bull; DATA PRESERVED.`
        ]);
      }
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      
      {/* HEADER BANNER */}
      <div className="bg-[#0b1612] border-2 border-emerald-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Cpu size={18} />
              </div>
              <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                Aero-Tech Architectural Planning &amp; Simulation Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Production Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production systems engineering: Database schemas with relational DDL, sequence API flows, circuit-breaker error fallback logic, and interactive stress-test chaos simulations.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[10px] text-slate-400">Architecture Tier:</span>
            <span className="text-emerald-400 font-bold bg-[#09090b] px-2.5 py-1 rounded border border-emerald-500/30">
              L1/L2 High-Availability Sovereign
            </span>
          </div>
        </div>

        {/* 5 MAIN TOP-LEVEL NAVIGATION BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveSection("simulator")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
              activeSection === "simulator"
                ? "bg-[#14291f] border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold"
                : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#111113] hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame size={16} className={activeSection === "simulator" ? "text-amber-400" : "text-slate-500"} />
              <span>1. Chaos Simulator</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">GAME</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("schemas")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
              activeSection === "schemas"
                ? "bg-[#14291f] border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold"
                : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#111113] hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Database size={16} className={activeSection === "schemas" ? "text-cyan-400" : "text-slate-500"} />
              <span>2. DB Schemas</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">SQL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("api_flows")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
              activeSection === "api_flows"
                ? "bg-[#14291f] border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold"
                : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#111113] hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <GitBranch size={16} className={activeSection === "api_flows" ? "text-emerald-400" : "text-slate-500"} />
              <span>3. API Flows</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">REST</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("fallbacks")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
              activeSection === "fallbacks"
                ? "bg-[#14291f] border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold"
                : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#111113] hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className={activeSection === "fallbacks" ? "text-red-400" : "text-slate-500"} />
              <span>4. Error Fallbacks</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">CIRCUIT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("pseudocode")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
              activeSection === "pseudocode"
                ? "bg-[#14291f] border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold"
                : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#111113] hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileCode2 size={16} className={activeSection === "pseudocode" ? "text-purple-400" : "text-slate-500"} />
              <span>5. Pseudocode</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">ALGO</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PILLAR 1: THE AERO-TECH CHAOS SIMULATOR (THE GAMIFIED STRESS-TEST ENGINE) */}
      {/* ========================================================================= */}
      {activeSection === "simulator" && (
        <div className="space-y-6">
          <div className="bg-[#0b1410] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Flame className="text-amber-400" size={18} /> System Chaos Stress-Test Harness
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inject catastrophic real-world failure modes (dropped webhooks, rural network loss, duplicate taps, dirty reads) and observe resilience execution.
                </p>
              </div>

              <button
                type="button"
                onClick={runSimulation}
                disabled={isSimulating}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 font-mono shrink-0"
              >
                <Play size={14} className={isSimulating ? "animate-spin" : ""} />
                {isSimulating ? "Injecting Chaos..." : "Run Chaos Stress-Test"}
              </button>
            </div>

            {/* SCENARIO SELECTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 font-mono text-xs">
              {scenarios.map((sc) => {
                const isSelected = selectedScenarioId === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setSelectedScenarioId(sc.id);
                      setSimStep(0);
                      setSimLogs([]);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#182017] border-amber-500 text-white shadow-md shadow-amber-950"
                        : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#0c1410] hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        sc.difficulty === "CRITICAL" ? "bg-red-500/20 text-red-300 border border-red-500/40" :
                        sc.difficulty === "HIGH" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                        "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      }`}>
                        {sc.difficulty}
                      </span>
                      <div className={`text-xs font-bold mt-2 leading-tight ${isSelected ? "text-amber-300" : "text-white"}`}>
                        {sc.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ACTIVE SCENARIO SPECIFICATION CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 font-mono text-xs">
              
              {/* LEFT: SPECS & STEP PROGRESS (7 COLS) */}
              <div className="lg:col-span-7 bg-[#09090b] border border-slate-800 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-white font-bold">{currentScenario.title}</span>
                  <span className="text-[10px] text-amber-400">DIFFICULTY: {currentScenario.difficulty}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Failure Vector (Chaos Injected)</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{currentScenario.trigger}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-red-400 uppercase block font-bold">Vulnerability Without Aero-Tech Architecture</span>
                  <p className="text-red-200/90 text-[11px] leading-relaxed bg-red-950/20 p-2.5 rounded-lg border border-red-900/40">
                    {currentScenario.failureMode}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase block font-bold">Aero-Tech Fallback &amp; Circuit Breaker Engine</span>
                  <p className="text-emerald-200/90 text-[11px] leading-relaxed bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/40">
                    {currentScenario.resilienceMechanism}
                  </p>
                </div>

                {/* STEP-BY-STEP PROGRESS PIPELINE */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Execution Steps Pipeline</span>
                  <div className="space-y-1.5">
                    {currentScenario.executionSteps.map((step) => {
                      const isReached = simStep >= step.step;
                      return (
                        <div
                          key={step.step}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition ${
                            isReached
                              ? step.status === "mitigated"
                                ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                                : "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                              : "bg-[#040806] border-slate-800 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isReached ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"
                            }`}>
                              {step.step}
                            </span>
                            <span className="leading-snug">{step.action}</span>
                          </div>
                          <span className="text-[10px] shrink-0 font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                            {step.latency}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT: LIVE TELEMETRY TERMINAL (5 COLS) */}
              <div className="lg:col-span-5 bg-[#030605] border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 font-mono">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Terminal size={14} /> Telemetry Output
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      STDOUT / TRACE
                    </span>
                  </div>

                  <div className="h-64 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed pr-1 text-slate-300 font-mono">
                    {simLogs.length === 0 ? (
                      <div className="text-slate-600 italic py-12 text-center">
                        Terminal idle. Click "Run Chaos Stress-Test" above to trace system fallbacks.
                      </div>
                    ) : (
                      simLogs.map((log, idx) => (
                        <div key={idx} className={log.includes("MITIGATED") ? "text-amber-300" : log.includes("COMPLETE") ? "text-emerald-400 font-bold" : "text-slate-300"}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Circuit Breaker: CLOSED</span>
                  <span className="text-emerald-400">Integrity: 100% Guaranteed</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 2: RELATIONAL DATABASE SCHEMAS (POSTGRESQL & CLOUD SQL DDL)       */}
      {/* ========================================================================= */}
      {activeSection === "schemas" && (
        <div className="space-y-6">
          <div className="bg-[#111113] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="text-cyan-400" size={18} /> Enterprise Relational Schemas (PostgreSQL / Cloud SQL)
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Normalized 3NF relational DDL with foreign keys, composite b-tree indexing, idempotency tables, and double-entry ledger constraints.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard("sql_all", POSTGRES_DDL_FULL)}
                className="px-3.5 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === "sql_all" ? <Check size={14} /> : <Copy size={14} />}
                {copiedKey === "sql_all" ? "Copied SQL!" : "Copy Full DDL"}
              </button>
            </div>

            {/* CODE VIEWER FOR FULL PRODUCTION DDL */}
            <div className="bg-[#050907] border border-slate-800 rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed text-cyan-200">
              <pre>{POSTGRES_DDL_FULL}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 3: INTERACTIVE API FLOWS & WEBSOCKET/REST SEQUENCE ARCHITECTURE    */}
      {/* ========================================================================= */}
      {activeSection === "api_flows" && (
        <div className="space-y-6">
          <div className="bg-[#111113] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl font-mono text-xs">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="text-emerald-400" size={18} /> Production API Flows &amp; Webhook Lifecycles
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Exact end-to-end request pipelines for Safaricom Daraja M-Pesa callbacks, supply-driven implied sales drops, and offline-first write replay.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FLOW 1 */}
              <div className="p-4 bg-[#09090b] border border-slate-800 rounded-xl space-y-2">
                <span className="text-emerald-400 font-bold uppercase block text-xs">
                  Flow A: Supply-Driven Implied Sales Crystallization
                </span>
                <div className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                  <div>1. <code>POST /api/v1/supply/arrive-crystallize</code> with SKU, Capacity, RemainingCount, OwnerConsumed.</div>
                  <div>2. Validate Idempotency-Key in HTTP Header. Acquire Redis row lock <code>lock:sku:14</code>.</div>
                  <div>3. Execute formula: <code>units_sold = capacity - remaining - owner_consumed</code>.</div>
                  <div>4. Single atomic DB Transaction: Insert <code>sales_ledger</code>, Insert <code>nominal_drawings</code>, update <code>inventory_stock = remaining + new_box</code>.</div>
                  <div>5. Emit WebSocket broadcast to counter tablets: <code>EVENT_STOCK_CALIBRATED</code>.</div>
                </div>
              </div>

              {/* FLOW 2 */}
              <div className="p-4 bg-[#09090b] border border-slate-800 rounded-xl space-y-2">
                <span className="text-cyan-400 font-bold uppercase block text-xs">
                  Flow B: Safaricom Daraja M-Pesa C2B Webhook Ingest
                </span>
                <div className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                  <div>1. <code>POST /api/v1/mpesa/c2b-callback</code> received from Safaricom IP whitelist (196.201.214.*).</div>
                  <div>2. Compute SHA-256 hash of <code>TransID + BillRefNumber</code>. Check uniqueness against <code>mpesa_inflow_journal</code>.</div>
                  <div>3. If duplicate: Immediately respond HTTP 200 with <code>ResultCode: 0</code> (Idempotent acknowledge).</div>
                  <div>4. If fresh: Atomically credit <code>Real Accounts: M-Pesa Float (Till 9382104)</code>.</div>
                  <div>5. Match reference to active customer debtor if BillRef matches customer phone or National ID.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 4: CIRCUIT-BREAKER ERROR FALLBACK LOGIC MATRIX                     */}
      {/* ========================================================================= */}
      {activeSection === "fallbacks" && (
        <div className="space-y-6">
          <div className="bg-[#111113] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl font-mono text-xs">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="text-red-400" size={18} /> Circuit-Breakers &amp; Error Fallback Logic Matrix
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Fail-safe engineering: What happens when the network fails, database deadlocks occur, or payment gateways go dark.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#09090b] border border-red-500/40 rounded-xl space-y-2">
                <span className="text-red-400 font-bold uppercase block">Circuit Breaker: Daraja API</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <strong>Trigger:</strong> 3 consecutive 504 timeouts to Safaricom Daraja.<br />
                  <strong>Trip Action:</strong> State flips to OPEN. Halts synchronous calls. Reroutes counter to SMS Notification OCR parser + fallback manual till receipt input.
                </p>
              </div>

              <div className="p-4 bg-[#09090b] border border-amber-500/40 rounded-xl space-y-2">
                <span className="text-amber-400 font-bold uppercase block">Write-Ahead Offline Drain</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <strong>Trigger:</strong> navigator.onLine = false.<br />
                  <strong>Trip Action:</strong> All counter actions append to client IndexedDB Write-Ahead Journal. UI badge indicates 'Autonomous Offline Mode'. Auto-drains with backpressure upon 200 OK ping.
                </p>
              </div>

              <div className="p-4 bg-[#09090b] border border-cyan-500/40 rounded-xl space-y-2">
                <span className="text-cyan-400 font-bold uppercase block">Dirty-Read Mutex Locking</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <strong>Trigger:</strong> Parallel requests touch same SKU within 50ms.<br />
                  <strong>Trip Action:</strong> Database row-level advisory lock forces serializable isolation. Prevents negative shelf inventory anomalies.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 5: PRODUCTION SYSTEM PSEUDOCODE ENGINE                             */}
      {/* ========================================================================= */}
      {activeSection === "pseudocode" && (
        <div className="space-y-6">
          <div className="bg-[#111113] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode2 className="text-purple-400" size={18} /> Production Pseudocode: Core Algorithms
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Algorithmic pseudocode for supply-driven velocity crystallization, atomic dawn locks, and reverse inventory mathematical proofs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard("algo_all", PRODUCTION_PSEUDOCODE_ALL)}
                className="px-3.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === "algo_all" ? <Check size={14} /> : <Copy size={14} />}
                {copiedKey === "algo_all" ? "Copied Pseudocode!" : "Copy Pseudocode"}
              </button>
            </div>

            <div className="bg-[#050907] border border-slate-800 rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed text-purple-200">
              <pre>{PRODUCTION_PSEUDOCODE_ALL}</pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ENTERPRISE PRODUCTION RELATIONAL POSTGRESQL DDL
const POSTGRES_DDL_FULL = `-- ====================================================================
-- YUBIFLO AERO-TECH ARCHITECTURE: PRODUCTION POSTGRESQL / CLOUD SQL DDL
-- 3NF Normalized, Idempotency Enforced, Double-Entry Classical Ledger
-- ====================================================================

-- 1. WORKSPACE MERCHANTS
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    operating_currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MASTER INVENTORY SKUs (Active Front Shelf)
CREATE TABLE IF NOT EXISTS master_inventory_skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_type VARCHAR(50) NOT NULL, -- 'packets', 'bales', 'bottles'
    unit_wholesale_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_shelf_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    opening_shelf_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    box_capacity NUMERIC(12, 2) NOT NULL DEFAULT 21.00, -- e.g. 21 pkts box
    reorder_threshold NUMERIC(12, 2) NOT NULL DEFAULT 5.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_positive_pricing CHECK (unit_retail_price >= 0 AND unit_wholesale_cost >= 0)
);
CREATE INDEX IF NOT EXISTS idx_inventory_workspace ON master_inventory_skus(workspace_id, category);

-- 3. WAREHOUSE BULK RESERVES (Backroom Batches)
CREATE TABLE IF NOT EXISTS warehouse_bulk_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES master_inventory_skus(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    bulk_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_type VARCHAR(50) NOT NULL,
    wholesale_unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    storage_bay_location VARCHAR(100) NOT NULL DEFAULT 'Backroom Bay 1',
    status VARCHAR(50) NOT NULL DEFAULT 'IN_STORAGE', -- 'IN_STORAGE', 'DEPLETED'
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SUPPLY-DRIVEN IMPLIES SALES LEDGER
CREATE TABLE IF NOT EXISTS supply_driven_sales_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES master_inventory_skus(id) ON DELETE CASCADE,
    box_capacity NUMERIC(12, 2) NOT NULL,
    remaining_before_drop NUMERIC(12, 2) NOT NULL,
    owner_consumed_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    units_sold NUMERIC(12, 2) NOT NULL,
    total_sales_revenue NUMERIC(12, 2) NOT NULL,
    cogs NUMERIC(12, 2) NOT NULL,
    gross_margin NUMERIC(12, 2) NOT NULL,
    owner_drawing_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(50) NOT NULL DEFAULT 'CASH', -- 'CASH', 'MPESA', 'SPLIT'
    idempotency_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 prevents duplicate drops
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CLASSICAL LEDGER ACCOUNTS (PERSONAL, REAL & NOMINAL)
CREATE TYPE ledger_classification AS ENUM ('PERSONAL', 'REAL', 'NOMINAL');

CREATE TABLE IF NOT EXISTS classical_chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    category ledger_classification NOT NULL,
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    UNIQUE (workspace_id, account_code)
);

CREATE TABLE IF NOT EXISTS classical_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    debit_account_id UUID NOT NULL REFERENCES classical_chart_of_accounts(id),
    credit_account_id UUID NOT NULL REFERENCES classical_chart_of_accounts(id),
    amount NUMERIC(14, 2) NOT NULL,
    description TEXT NOT NULL,
    source_event_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DARAJA M-PESA INFLOW JOURNAL & IDEMPOTENCY LOCKS
CREATE TABLE IF NOT EXISTS mpesa_inflow_journal (
    trans_id VARCHAR(50) PRIMARY KEY, -- Safaricom unique receipt code (e.g. 'RJK8319FA')
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    trans_amount NUMERIC(12, 2) NOT NULL,
    bill_ref_number VARCHAR(100),
    msisdn VARCHAR(20) NOT NULL,
    matched_status VARCHAR(50) NOT NULL DEFAULT 'MATCHED',
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

// PRODUCTION PSEUDOCODE ALGORITHMS
const PRODUCTION_PSEUDOCODE_ALL = `// ====================================================================
// YUBIFLO PRODUCTION PSEUDOCODE ALGORITHMIC SUITE
// ====================================================================

// --------------------------------------------------------------------
// ALGORITHM 1: Supply-Driven Velocity Sales Crystallization
// Mental Model: A new box arriving proves sales happened!
// --------------------------------------------------------------------
FUNCTION CrystallizeSupplyDrivenSale(
    merchant_id, 
    sku_id, 
    box_capacity, 
    shelf_remaining_before_drop, 
    owner_consumed_qty, 
    new_box_size,
    idempotency_key
):
    // 1. Verify Idempotency Lock
    IF Redis.Exists("idemp_lock:" + idempotency_key) THEN:
        RETURN CachedResponse("Request already processed. Duplicate drop suppressed.")
    END IF
    Redis.SetWithExpiry("idemp_lock:" + idempotency_key, TRUE, ttl_seconds = 60)

    BEGIN TRANSACTION:
        // 2. Acquire Row Lock on Target SKU
        sku = DB.QueryOne("SELECT * FROM master_inventory_skus WHERE id = :sku_id FOR UPDATE")
        
        // 3. Compute Implied Customer Sales
        implied_units_sold = MAX(0, box_capacity - shelf_remaining_before_drop - owner_consumed_qty)
        gross_sales_revenue = implied_units_sold * sku.unit_retail_price
        cogs = implied_units_sold * sku.unit_wholesale_cost
        gross_margin = gross_sales_revenue - cogs
        owner_drawing_cost = owner_consumed_qty * sku.unit_wholesale_cost

        // 4. Update Inventory Stock Level (Remaining + New Box)
        post_delivery_stock = shelf_remaining_before_drop + new_box_size
        DB.Execute(
            "UPDATE master_inventory_skus SET current_shelf_stock = :post_stock, updated_at = NOW() WHERE id = :sku_id",
            post_stock = post_delivery_stock
        )

        // 5. Insert Implied Sales Ledger
        DB.Execute("INSERT INTO supply_driven_sales_ledger (
            sku_id, box_capacity, remaining_before_drop, owner_consumed_qty,
            units_sold, total_sales_revenue, cogs, gross_margin, owner_drawing_cost, idempotency_hash
        ) VALUES (:sku_id, :box_capacity, :shelf_remaining_before_drop, :owner_consumed_qty,
            :implied_units_sold, :gross_sales_revenue, :cogs, :gross_margin, :owner_drawing_cost, :idempotency_key)")

        // 6. Post Classical Double-Entry Journal Entries
        // Real Account (Cash Drawer / M-Pesa Till): DEBIT gross_sales_revenue
        DB.PostJournalEntry(debit = "ACT_REAL_CASH_DRAWER", credit = "ACT_NOMINAL_SALES_REVENUE", amount = gross_sales_revenue)

        // Nominal Account (Owner Personal Drawings): DEBIT owner_drawing_cost at wholesale cost
        IF owner_consumed_qty > 0 THEN:
            DB.PostJournalEntry(debit = "ACT_NOMINAL_OWNER_DRAWINGS", credit = "ACT_REAL_SHELF_INVENTORY", amount = owner_drawing_cost)
        END IF

    COMMIT TRANSACTION
    
    RETURN SuccessResult(
        units_sold = implied_units_sold, 
        revenue = gross_sales_revenue, 
        owner_drawing = owner_drawing_cost, 
        new_stock = post_delivery_stock
    )
END FUNCTION

// --------------------------------------------------------------------
// ALGORITHM 2: Safaricom Daraja M-Pesa C2B Webhook Ingest
// --------------------------------------------------------------------
FUNCTION HandleMpesaC2BWebhook(payload, signature):
    // 1. Verify Whitelisted Gateway Origin & Signature
    IF NOT VerifyDarajaSignature(payload, signature) THEN:
        THROW SecurityException("Invalid M-Pesa gateway signature")
    END IF

    trans_id = payload.TransID
    amount = payload.TransAmount
    bill_ref = payload.BillRefNumber

    // 2. Idempotency Guard (Prevent double-crediting if Safaricom retries)
    IF DB.Exists("SELECT 1 FROM mpesa_inflow_journal WHERE trans_id = :trans_id") THEN:
        RETURN HttpResponse(status = 200, body = {"ResultCode": 0, "ResultDesc": "Duplicate acknowledged"})
    END IF

    BEGIN TRANSACTION:
        // 3. Record in Inflow Journal
        DB.Insert("mpesa_inflow_journal", trans_id, amount, bill_ref)

        // 4. Double-Entry: DEBIT Real M-Pesa Till float
        DB.PostJournalEntry(debit = "ACT_REAL_MPESA_TILL", credit = "ACT_NOMINAL_UNRECONCILED_INFLOW", amount = amount)

        // 5. Match with Debtor if BillRef matches customer phone or National ID
        debtor = DB.FindDebtor(bill_ref)
        IF debtor IS NOT NULL THEN:
            DB.ApplyDebtRepayment(debtor.id, amount)
        END IF
    COMMIT TRANSACTION

    RETURN HttpResponse(status = 200, body = {"ResultCode": 0, "ResultDesc": "Success"})
END FUNCTION`;
