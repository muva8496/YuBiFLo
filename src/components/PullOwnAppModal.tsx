import React, { useState } from "react";
import { Download, Smartphone, FileSpreadsheet, FileCode, CheckCircle2, X, ShieldAlert, Sparkles } from "lucide-react";
import { AlacioMasterState } from "../types/alacio";

interface PullOwnAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AlacioMasterState;
}

export default function PullOwnAppModal({ isOpen, onClose, state }: PullOwnAppModalProps) {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `yubiflo_alacio_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess("JSON Full System State Exported!");
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleExportCsv = () => {
    // Generate CSV of active inventory
    const headers = "ID,Name,Category,Unit,CostPrice,RetailPrice,Stock,ShelfValue,VelocityBadge\n";
    const rows = state.inventory.map((i) => 
      `"${i.id}","${i.name}","${i.category}","${i.unit_type}",${i.unit_cost},${i.unit_retail},${i.current_stock},${i.total_shelf_value},"${i.velocity_badge}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `yubiflo_inventory_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    setDownloadSuccess("CSV Inventory Ledger Exported!");
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleGeneratePwaManifest = () => {
    const manifest = {
      name: "Alacio Mini Shop - YuBiFLo Standalone",
      short_name: "Alacio POS",
      start_url: "/",
      display: "standalone",
      background_color: "#0a0d12",
      theme_color: "#1FB88E",
      description: "Standalone offline VCR voice capture and counter ledger for Alacio Mini Shop",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png"
        }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "manifest.webmanifest");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess("Standalone PWA Manifest Generated & Ready for Home Screen Install!");
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-[#0e1713] border-2 border-emerald-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-xs">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                Special Feature: "Pull Your Own App"
              </h3>
              <p className="text-[11px] text-slate-400">
                Own your software. Export a standalone installable single-business PWA with zero lock-in.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-slate-300 leading-relaxed text-xs">
            Export Alacio Mini Shop as a standalone counter unit containing your active blueprint, VCR voice ingestion, debt ledger, and local storage database.
          </p>

          {/* EXPORT OPTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={handleGeneratePwaManifest}
              className="p-3.5 bg-[#12221a] hover:bg-[#162d22] border border-emerald-500/30 rounded-2xl text-left transition flex flex-col justify-between cursor-pointer space-y-2"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Smartphone size={15} />
              </div>
              <div>
                <span className="font-bold text-white block">PWA Manifest</span>
                <span className="text-[10px] text-slate-400">Mobile Home Screen</span>
              </div>
            </button>

            <button
              onClick={handleExportCsv}
              className="p-3.5 bg-[#12221a] hover:bg-[#162d22] border border-emerald-500/30 rounded-2xl text-left transition flex flex-col justify-between cursor-pointer space-y-2"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet size={15} />
              </div>
              <div>
                <span className="font-bold text-white block">CSV Ledger</span>
                <span className="text-[10px] text-slate-400">Excel &amp; Auditing</span>
              </div>
            </button>

            <button
              onClick={handleExportJson}
              className="p-3.5 bg-[#12221a] hover:bg-[#162d22] border border-emerald-500/30 rounded-2xl text-left transition flex flex-col justify-between cursor-pointer space-y-2"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCode size={15} />
              </div>
              <div>
                <span className="font-bold text-white block">JSON State</span>
                <span className="text-[10px] text-slate-400">Full Cloud Restore</span>
              </div>
            </button>
          </div>
        </div>

        {/* PLATFORM BOUNDARY NOTICE */}
        <div className="bg-[#08100d] border border-slate-800 rounded-2xl p-4 text-[11px] text-slate-400 space-y-1">
          <div className="text-amber-300 font-bold flex items-center gap-1.5 font-mono">
            <Sparkles size={13} /> Platform Intelligence Guarantee
          </div>
          <p className="leading-relaxed">
            Your exported standalone app works 100% offline at the counter. Premium capabilities (cloud AI cross-validation, Tier 3 predictive stockout algorithms, and multi-branch rollups) remain securely hosted on the YuBiFLo cloud platform.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
