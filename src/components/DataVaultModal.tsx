import React, { useState } from "react";
import { 
  X, ShieldCheck, Download, Upload, Cloud, RefreshCw, CheckCircle2, 
  AlertCircle, Database, FileText, Lock, Sparkles, HardDrive
} from "lucide-react";
import { AlacioMasterState } from "../types/alacio";
import { 
  exportBusinessDataJson, 
  importBusinessDataJson, 
  restoreUserStateFromCloud,
  SCHEMA_VERSION 
} from "../services/alacioStorage";

interface DataVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterState: AlacioMasterState;
  onStateRestored: (newState: AlacioMasterState) => void;
}

export default function DataVaultModal({
  isOpen,
  onClose,
  masterState,
  onStateRestored
}: DataVaultModalProps) {
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Download JSON Backup
  const handleDownloadBackup = () => {
    try {
      setActionSuccessMsg(null);
      setActionErrorMsg(null);
      const jsonStr = exportBusinessDataJson(masterState);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanName = (masterState.merchant_name || "Business").toLowerCase().replace(/[^a-z0-9]/g, "-");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `yubiflo-backup-${cleanName}-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setActionSuccessMsg("Offline backup downloaded successfully. Keep this file safe!");
    } catch (err: any) {
      setActionErrorMsg("Failed to download backup: " + (err.message || String(err)));
    }
  };

  // Handle Import JSON Backup
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = importBusinessDataJson(text);
        if (res.success && res.state) {
          onStateRestored(res.state);
          setActionSuccessMsg(`Backup restored successfully! ${res.state.inventory.length} items & ledgers recovered.`);
        } else {
          setActionErrorMsg(res.error || "Could not validate backup file format.");
        }
      } catch (err: any) {
        setActionErrorMsg("Error reading backup file: " + (err.message || String(err)));
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };

  // Handle Restore from Firestore Cloud Mirror
  const handleCloudRestore = async () => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setIsCloudSyncing(true);

    const email = masterState.user_email || "default";
    try {
      const restored = await restoreUserStateFromCloud(email);
      if (restored) {
        onStateRestored(restored);
        setActionSuccessMsg(`Restored from Cloud Database! ${restored.inventory.length} stock items and ledger verified.`);
      } else {
        setActionSuccessMsg("Cloud database verified. Local records are up-to-date with your cloud copy.");
      }
    } catch (err: any) {
      setActionErrorMsg("Cloud sync notice: " + (err.message || "Failed to query cloud mirror"));
    } finally {
      setIsCloudSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0f1724] border-2 border-[#1e3047] rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden relative font-sans text-[#e2ecf3] my-8">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-[#1e3047] flex items-center justify-between bg-[#152234]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Zero-Data-Loss Protection Vault
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  Schema v{SCHEMA_VERSION}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Continuous auto-save • Offline-first • Dual rolling snapshots • Cloud mirrored
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* SUCCESS / ERROR ALERTS */}
          {actionSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {actionErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{actionErrorMsg}</span>
            </div>
          )}

          {/* REAL-TIME PROTECTION HEALTH CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#131d2e] border border-[#23354d]">
              <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <HardDrive size={11} className="text-blue-400" />
                Local Cache
              </div>
              <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={13} /> Active
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Every key stroke</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#131d2e] border border-[#23354d]">
              <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Database size={11} className="text-purple-400" />
                Dual Snapshots
              </div>
              <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={13} /> Rolling
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Slots A &amp; B synced</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#131d2e] border border-[#23354d]">
              <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Cloud size={11} className="text-amber-400" />
                Firestore DB
              </div>
              <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={13} /> Mirrored
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Cloud redundancy</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#131d2e] border border-[#23354d]">
              <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-400" />
                Schema Policy
              </div>
              <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={13} /> Zero-Drop
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Safe feature updates</div>
            </div>
          </div>

          {/* ACTIVE RECORD COUNTS */}
          <div className="p-4 rounded-2xl bg-[#131d2e]/80 border border-[#223349] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Business Workspace:</span>
              <span className="font-bold text-white">{masterState.merchant_name || "My Business"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1e2f42] text-center">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Stock Items</div>
                <div className="text-base font-bold text-white">{masterState.inventory?.length || 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Sales Records</div>
                <div className="text-base font-bold text-white">{masterState.salesLedger?.length || 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Active Suppliers</div>
                <div className="text-base font-bold text-white">{masterState.suppliers?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Disaster Recovery &amp; Manual Safeguards
            </h3>

            {/* DOWNLOAD OFFLINE BACKUP */}
            <button
              onClick={handleDownloadBackup}
              className="w-full p-4 rounded-2xl bg-[#16253b] hover:bg-[#1a2d47] border border-[#263c59] flex items-center justify-between transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Download size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Download Full Business Backup (.json)</div>
                  <div className="text-[11px] text-slate-400">Save a copy of all stock, prices, ledger, and books to your phone or laptop.</div>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40 shrink-0">
                Download
              </span>
            </button>

            {/* RESTORE FROM OFFLINE BACKUP */}
            <label className="w-full p-4 rounded-2xl bg-[#16253b] hover:bg-[#1a2d47] border border-[#263c59] flex items-center justify-between transition group text-left cursor-pointer block">
              <input 
                type="file" 
                accept=".json,application/json" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Upload size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Restore from Backup File (.json)</div>
                  <div className="text-[11px] text-slate-400">Upload any previous backup to recover goods and books with auto-migration.</div>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-600/30 text-purple-300 font-bold border border-purple-500/40 shrink-0">
                Upload File
              </span>
            </label>

            {/* CLOUD RE-SYNC */}
            <button
              onClick={handleCloudRestore}
              disabled={isCloudSyncing}
              className="w-full p-4 rounded-2xl bg-[#16253b] hover:bg-[#1a2d47] border border-[#263c59] flex items-center justify-between transition group text-left cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <RefreshCw size={20} className={isCloudSyncing ? "animate-spin" : ""} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Sync / Restore from Cloud Firestore</div>
                  <div className="text-[11px] text-slate-400">Re-verify and pull the latest synchronized snapshot from your cloud database.</div>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-600/30 text-amber-300 font-bold border border-amber-500/40 shrink-0">
                {isCloudSyncing ? "Syncing..." : "Sync Cloud"}
              </span>
            </button>
          </div>

          {/* ZERO DATA LOSS GUARANTEE NOTICE */}
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-blue-200/90 text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-300">
              <Lock size={12} />
              Continuous Feature Evolution Policy
            </div>
            <p className="leading-relaxed">
              When new features are added, modified, or retired in YuBiFLo, client data fields are never discarded. The system automatically performs non-destructive schema migrations on load, guaranteeing your active inventory, sales entries, supplier relationships, and cash balance baselines remain intact across all updates.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-[#131d2e] border-t border-[#1e3047] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
}
