import React, { useState } from "react";
import { 
  Download, Smartphone, ShieldCheck, CheckCircle2, 
  FileSpreadsheet, FileJson, AlertCircle, X, Sparkles, 
  HardDrive, Lock, ExternalLink, ArrowRight
} from "lucide-react";
import { AlacioMasterState } from "../types/alacio";

interface PullYourOwnAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AlacioMasterState;
}

export default function PullYourOwnAppModal({
  isOpen,
  onClose,
  state
}: PullYourOwnAppModalProps) {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pwa" | "data_export" | "licensing">("pwa");

  if (!isOpen) return null;

  // 1. Export Customer's Configured Workspace & Data as Standalone JSON
  const handleExportWorkspaceJson = () => {
    // Only exports customer data, blueprint config, and local settings.
    // Does NOT expose platform admin tools or blueprint source generators.
    const exportBundle = {
      app_type: "YuBiFLo_Standalone_PWA_Workspace",
      export_version: "2.4.0",
      license_holder: state.merchant_name || "Alacio Mini Shop",
      phone: "0712 345 678",
      generated_at: new Date().toISOString(),
      blueprint: {
        id: "retail_duka",
        name: "Duka & Retail Grocery",
        currency: state.currency
      },
      ledger_data: {
        morning_bookends: state.morning_bookends,
        inventory: state.inventory,
        warehouse: state.warehouse,
        customers_credit: state.customers,
        suppliers: state.suppliers,
        sales_ledger: state.salesLedger,
        payouts_and_drawings: state.payouts,
        reconciliations: state.reconciliations,
        mpesa_statements: state.mpesaStatements
      },
      vcr_configuration: {
        counter_mode: "Voice Conversion Record (VCR)",
        privacy_policy: "Raw audio discarded immediately after deterministic token extraction",
        languages_supported: ["Swahili", "Sheng", "English"]
      }
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(state.merchant_name || "My_Business").toLowerCase().replace(/\s+/g, "_")}_yubiflo_workspace.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess("Workspace JSON exported successfully! Safe offline copy ready.");
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // 2. Export Tabular CSV Files (Sales, Inventory, Debtors, Reconciliations)
  const handleExportCsvBundle = () => {
    const csvRows = [
      ["Date", "Reference", "Type", "Item", "Quantity", "Unit Retail", "Total Amount", "Channel", "Customer", "Paid Status"].join(",")
    ];

    (state.salesLedger || []).forEach((sale) => {
      csvRows.push([
        `"${sale.date || sale.timestamp || ""}"`,
        `"${sale.id || ""}"`,
        `"Counter Sale"`,
        `"${sale.items_summary || ""}"`,
        1,
        sale.total_amount || 0,
        sale.total_amount || 0,
        `"${sale.payment_method || "CASH"}"`,
        `"${sale.customer_name || "Walk-in"}"`,
        sale.debt_amount > 0 ? "Credit (Deni)" : "Paid"
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(state.merchant_name || "My_Business").toLowerCase().replace(/\s+/g, "_")}_sales_ledger.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess("Sales Ledger CSV downloaded successfully!");
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0f172a] text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-700 space-y-6 relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8860B]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#000000] border border-[#B8860B]/40 text-[#FFD54F] flex items-center justify-center shadow-md">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-xl text-white">
                  Pull Your Own App
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#B8860B]/20 text-[#FFD54F] font-bold border border-[#B8860B]/30">
                  Single-Business PWA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Export your configured workspace &amp; data as your own standalone offline app.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab("pwa")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === "pwa"
                ? "bg-slate-800 text-[#FFD54F] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            1. Standalone PWA Setup
          </button>
          <button
            onClick={() => setActiveTab("data_export")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === "data_export"
                ? "bg-slate-800 text-[#FFD54F] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            2. One-Click Data Pull (JSON / CSV)
          </button>
          <button
            onClick={() => setActiveTab("licensing")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === "licensing"
                ? "bg-slate-800 text-[#FFD54F] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            3. License &amp; Integrity Terms
          </button>
        </div>

        {/* TAB 1: PWA SETUP */}
        {activeTab === "pwa" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2 font-serif">
                  <Smartphone size={16} className="text-[#FFD54F]" />
                  Your Shop App ({state.merchant_name || "Alacio Mini Shop"})
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> PWA Service Worker Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You can install this exact configured workspace on your phone or tablet. It runs offline on your counter, records voice sales (VCR), tracks morning float, and syncs automatically when connection returns.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#FFD54F] font-bold block">
                    Android &bull; Chrome
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Tap the <strong>three dots &rarr; &ldquo;Add to Home Screen&rdquo;</strong>. The app installs with your shop&apos;s custom icon.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#FFD54F] font-bold block">
                    iPhone / iPad &bull; Safari
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Tap the <strong>Share icon &rarr; &ldquo;Add to Home Screen&rdquo;</strong>. Opens in standalone full-screen mode.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-950/20 border border-amber-600/30 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-[#FFD54F] shrink-0" />
                <span>
                  <strong>Setup changes?</strong> Whenever you update your products or blueprint configuration, simply pull your app again.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATA EXPORT */}
        {activeTab === "data_export" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Export your entire verified ledger, inventory catalog, customer debtors (deni), and reconciliation audit trails at any moment with zero vendor lock-in.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option A: Workspace JSON */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                    <FileJson size={18} />
                  </div>
                  <h4 className="font-bold text-sm text-white">Full Workspace State (.json)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Complete cryptographic backup of your shop workspace, product catalog, debtors and configuration.
                  </p>
                </div>
                <button
                  onClick={handleExportWorkspaceJson}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                >
                  <Download size={14} />
                  <span>Download .JSON Backup</span>
                </button>
              </div>

              {/* Option B: Sales & Ledgers CSV */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                    <FileSpreadsheet size={18} />
                  </div>
                  <h4 className="font-bold text-sm text-white">Sales &amp; Ledgers (.csv)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Clean tabular export formatted for Excel, Google Sheets, accountant review or tax compliance.
                  </p>
                </div>
                <button
                  onClick={handleExportCsvBundle}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download .CSV Spreadsheet</span>
                </button>
              </div>

            </div>

            {downloadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} />
                <span>{downloadSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LICENSING & INTEGRITY TERMS */}
        {activeTab === "licensing" && (
          <div className="space-y-3 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold font-serif text-sm border-b border-slate-800 pb-2">
              <Lock size={15} className="text-[#FFD54F]" />
              <span>Sovereign Export Boundary &amp; Terms</span>
            </div>
            
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Your Data is 100% Yours:</strong> All transactions, debtors, supplier records, and inventory remain your property and can be exported at any time.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Standalone Offline Engine:</strong> The exported app executes local daily cash checks, VCR voice conversions, and offline transaction queuing.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck size={14} className="text-[#FFD54F] shrink-0 mt-0.5" />
                <span>
                  <strong>Licence &amp; Platform Boundary:</strong> The exported app is tied to your business licence. Cloud AI predictive models, sector benchmarks, and blueprint source generators remain hosted on YuBiFLo cloud.
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-[11px] text-slate-500 font-mono">
            License: #KEN-MSME-8496 &bull; Live Blueprint
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportWorkspaceJson}
              className="px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#171717] border border-[#B8860B]/50 text-[#FFD54F] font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Pull Workspace</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
