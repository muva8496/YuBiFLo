import React, { useState } from "react";
import { 
  Database, Cpu, ArrowLeft, ShieldCheck, CheckCircle2, 
  Layers, Lock, HardDrive, RefreshCw, FileText, ArrowRight,
  Server, Key, Terminal, Network
} from "lucide-react";

interface EngineeringLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWorkspace: () => void;
}

export default function EngineeringLabModal({
  isOpen,
  onClose,
  onLaunchWorkspace
}: EngineeringLabModalProps) {
  const [activeTab, setActiveTab] = useState<"pipeline" | "schemas" | "reconciliation" | "accounts" | "privacy">("pipeline");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-[#0A1510] border border-[#000000] rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden font-sans animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#27272a] flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#000000] text-[#FFD54F] flex items-center justify-center border border-[#3f3f46]">
              <Cpu size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FFD54F] bg-[#000000] px-2 py-0.5 rounded">
                  FOR PARTNERS &amp; INVESTORS
                </span>
                <span className="text-xs text-slate-400 font-mono">Technical Architecture Spec</span>
              </div>
              <h2 className="text-xl font-serif font-black text-white">
                YuBiFLo Engineering Lab
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full bg-[#142A1E] hover:bg-[#1E3E2D] border border-[#234A35] text-xs font-semibold text-slate-300 transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft size={13} />
            <span>Back to Homepage</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#27272a] px-6 bg-[#0c0c0e] overflow-x-auto text-xs font-mono font-semibold">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "pipeline"
                ? "border-[#FFD54F] text-[#FFD54F]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Data Pipeline Overview
          </button>
          
          <button
            onClick={() => setActiveTab("reconciliation")}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "reconciliation"
                ? "border-[#FFD54F] text-[#FFD54F]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            2. Daily Reconciliation Method
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "accounts"
                ? "border-[#FFD54F] text-[#FFD54F]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            3. Account Groups &amp; Ledgers
          </button>

          <button
            onClick={() => setActiveTab("schemas")}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "schemas"
                ? "border-[#FFD54F] text-[#FFD54F]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            4. Relational &amp; Document Schemas
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "privacy"
                ? "border-[#FFD54F] text-[#FFD54F]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            5. Privacy &amp; Cryptographic Isolation
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          
          {/* TAB 1: PIPELINE */}
          {activeTab === "pipeline" && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Server size={18} className="text-[#FFD54F]" />
                Zero-Data-Entry Ingestion Pipeline
              </h3>
              <p>
                Traditional retail systems expect users to enter hundreds of line items into a keyboard. YuBiFLo inverts this architecture with a 3-way reconciliation pipeline:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#0F2218] border border-[#000000] space-y-2">
                  <div className="text-xs font-mono text-[#FFD54F] font-bold">STREAM A: VCR Voice Ingestion</div>
                  <p className="text-xs text-slate-400">
                    Captures counter buyer-seller speech in memory. Audio is parsed for item SKUs, quantities, and payment tenders, then dropped immediately.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F2218] border border-[#000000] space-y-2">
                  <div className="text-xs font-mono text-[#e4e4e7] font-bold">STREAM B: Restock Velocity Engine</div>
                  <p className="text-xs text-slate-400">
                    Delivery of a new 21-pack crate triggers automatic clearance confirmation of previous batch remnants, calculating implied sales.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F2218] border border-[#000000] space-y-2">
                  <div className="text-xs font-mono text-[#FFD54F] font-bold">STREAM C: M-Pesa Statement Cross-Check</div>
                  <p className="text-xs text-slate-400">
                    M-Pesa Till &amp; Paybill transaction extracts provide an unalterable external cross-check against recorded float balances.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECONCILIATION */}
          {activeTab === "reconciliation" && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <RefreshCw size={18} className="text-[#e4e4e7]" />
                Mathematical Closing Reconciliation Formula
              </h3>
              <p>
                All financial figures are computed by deterministic code. AI maps messy inputs and plain-language questions but never computes numbers.
              </p>
              
              <div className="p-4 rounded-2xl bg-[#060D09] border border-[#000000] font-mono text-xs text-[#e4e4e7] space-y-2">
                <div>EXPECTED_CLOSING_CASH = OPENING_FLOAT (05:57 AM) + CAPTURED_SALES_CASH - RECORDED_PAYOUTS;</div>
                <div>VARIANCE = PHYSICAL_DRAWER_COUNT - EXPECTED_CLOSING_CASH;</div>
                <div className="text-slate-400 pt-2 border-t border-[#000000]">
                  // If VARIANCE != 0: Trigger One-Tap Question: &quot;KES 450 left till: Business or Personal?&quot;
                </div>
              </div>

              <p className="text-xs text-slate-400">
                This daily bookend loop eliminates the &quot;phantom cash shrinkage&quot; that causes 80% of East African dukas to unknowingly lose working capital.
              </p>
            </div>
          )}

          {/* TAB 3: ACCOUNTS */}
          {activeTab === "accounts" && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-[#FFD54F]" />
                Three-Fold Account Structure
              </h3>
              <p>
                Under the hood, every transaction is journalized into balanced debit and credit entries across three fundamental account groups:
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#0F2218] border border-[#000000] flex justify-between items-center">
                  <div>
                    <strong className="text-white block">Group 1: Liquid Float Accounts</strong>
                    <span className="text-xs text-slate-400">Physical Till Drawer, M-Pesa Buy Goods Till (e.g. 418293), Bank Paybill Float</span>
                  </div>
                  <span className="text-xs font-mono text-[#FFD54F]">Assets (Dr)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0F2218] border border-[#000000] flex justify-between items-center">
                  <div>
                    <strong className="text-white block">Group 2: Operating Stock &amp; Debtors (Deni)</strong>
                    <span className="text-xs text-slate-400">Active Shelf Inventory, Bulk Reserve Batches, Customer Debtors Ledger</span>
                  </div>
                  <span className="text-xs font-mono text-[#e4e4e7]">Inventory / Receivables</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0F2218] border border-[#000000] flex justify-between items-center">
                  <div>
                    <strong className="text-white block">Group 3: Proprietor Equity &amp; Revenue</strong>
                    <span className="text-xs text-slate-400">Sales Margin Revenue, Supplier Trade Payables, Personal Drawings</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">Equity / Revenue (Cr)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SCHEMAS */}
          {activeTab === "schemas" && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Database size={18} className="text-[#e4e4e7]" />
                Relational &amp; Document Schemas
              </h3>
              <p>
                The storage engine employs a hybrid local-first document model synced to Cloud Firestore and PostgreSQL data warehouse replicas:
              </p>

              <div className="p-4 rounded-2xl bg-[#060D09] border border-[#000000] font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
                <pre>{`// Table: tenant_inventory_items
id: UUID PK
tenant_id: VARCHAR(64) [Indexed]
sku_code: VARCHAR(32) [e.g. "UNG-2KG-JOG"]
item_name: VARCHAR(128)
current_shelf_stock: INTEGER
unit_cost_kes: NUMERIC(10,2)
unit_retail_kes: NUMERIC(10,2)
reorder_threshold: INTEGER
velocity_score: NUMERIC(5,2)

// Table: daily_morning_bookends
id: UUID PK
tenant_id: VARCHAR(64)
date_iso: DATE [Indexed]
dawn_cash_drawer: NUMERIC(12,2)
mpesa_float_balance: NUMERIC(12,2)
status: ENUM('LOCKED_DAWN', 'AUDITED_EVENING')
created_at: TIMESTAMP WITH TIME ZONE`}</pre>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#FFD54F]" />
                Cryptographic Tenant Isolation &amp; Privacy Design
              </h3>
              <p>
                Built in alignment with Kenya&apos;s Data Protection Act, YuBiFLo guarantees absolute separation between client business data and public platform analytics:
              </p>

              <ul className="space-y-2.5 list-disc list-inside text-xs sm:text-sm text-slate-300">
                <li><strong className="text-white">Ephemeral Voice Streams:</strong> VCR parses spoken numbers in ephemeral memory; audio waveforms are never saved to disk or network storage.</li>
                <li><strong className="text-white">Tenant Sandbox Passcode:</strong> Every client workspace is isolated behind passcode <strong>8496</strong>.</li>
                <li><strong className="text-white">Offline Self-Reliance:</strong> Merchants can export a standalone single-business PWA with their complete offline database.</li>
              </ul>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#27272a] bg-[#09090b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 font-mono">
            YuBiFLo Sovereign Architecture &bull; Kenya Retail Engine
          </div>

          <button
            onClick={() => {
              onClose();
              onLaunchWorkspace();
            }}
            className="px-5 py-2.5 rounded-full bg-[#FFD54F] hover:bg-[#FFE082] text-[#0A1510] font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Launch Active Store Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
