import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Store,
  ShieldCheck,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  FileCode,
  Sparkles,
} from "lucide-react";
import { Merchant } from "../types";
import { AppStorage, ShopStorageStats } from "../services/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant;
  onUpdateMerchant: (updated: Merchant) => void;
  onDataRestored: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  merchant,
  onUpdateMerchant,
  onDataRestored,
  onResetData,
}) => {
  const [formData, setFormData] = useState<Merchant>(merchant);
  const [stats, setStats] = useState<ShopStorageStats>(AppStorage.getStorageStats());
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(merchant);
      setStats(AppStorage.getStorageStats());
      setImportStatus({ type: "idle", message: "" });
    }
  }, [isOpen, merchant]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    AppStorage.saveMerchant(formData);
    onUpdateMerchant(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDownloadBackup = () => {
    AppStorage.downloadBackupFile();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processImport(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processImport = (jsonString: string) => {
    const res = AppStorage.importAllDataJSON(jsonString);
    if (res.success) {
      setImportStatus({ type: "success", message: res.message });
      setStats(AppStorage.getStorageStats());
      onDataRestored();
    } else {
      setImportStatus({ type: "error", message: res.message });
    }
  };

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-2xl bg-[#121215] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#18181c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Shop Settings & Persistent Storage
              </h2>
              <p className="text-xs text-slate-400">
                Data persistence, real-time safety snapshots, and shop profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-6 overflow-y-auto">
          {/* Real-time Storage Health Card */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  Data Persistence & Auto-Save Active
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">
                Last Saved: {new Date(stats.lastSavedAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every sale, restock, expense, morning float, supplier delivery, and customer debt is
              immediately saved to your device and mirrored to the fail-safe Master Snapshot.
            </p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Items</span>
                <span className="font-bold text-slate-200">{stats.itemsCount}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Sales Batches</span>
                <span className="font-bold text-emerald-400">{stats.salesCount}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Suppliers / Cust</span>
                <span className="font-bold text-slate-200">
                  {stats.suppliersCount} / {stats.customersCount}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Database Size</span>
                <span className="font-bold text-cyan-400">~{stats.totalSizeKB} KB</span>
              </div>
            </div>
          </div>

          {/* Shop Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Merchant & Till Details
              </h3>
              {isSaved && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Owner / Manager Name
                </label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Shop Type
                </label>
                <select
                  value={formData.shop_type}
                  onChange={(e) => setFormData({ ...formData, shop_type: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Kiosk / Duka">Kiosk / Duka</option>
                  <option value="Mini-Mart">Mini-Mart</option>
                  <option value="Agrovet">Agrovet</option>
                  <option value="Bar & Liquor Store">Bar & Liquor Store</option>
                  <option value="Wholesale & Retail">Wholesale & Retail</option>
                  <option value="Bakery & Eatery">Bakery & Eatery</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Equity Paybill / Bank Account
                </label>
                <input
                  type="text"
                  value={formData.equity_paybill_number || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, equity_paybill_number: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  M-Pesa Till / Agent Number
                </label>
                <input
                  type="text"
                  value={formData.mpesa_till_number || ""}
                  onChange={(e) => setFormData({ ...formData, mpesa_till_number: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                Save Shop Profile
              </button>
            </div>
          </form>

          {/* Admin Mode & PIN Management */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin & Security Settings</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">PIN: 2031 (Default)</span>
            </div>
            <p className="text-xs text-slate-400">
              Admin mode restricts access to PostgreSQL schema, raw table modifications, and deep database structures.
            </p>
          </div>

          {/* Backup & Export / Restore Section */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Offline Data Backup & Restore
            </h3>
            <p className="text-xs text-slate-400">
              Download your complete database as a single JSON file to keep an offline backup or
              transfer to another device.
            </p>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Backup (.json)</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="backup-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload & Restore Backup</span>
              </button>
            </div>

            {importStatus.type !== "idle" && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  importStatus.type === "success"
                    ? "bg-emerald-950/40 border border-emerald-800/40 text-emerald-300"
                    : "bg-rose-950/40 border border-rose-800/40 text-rose-300"
                }`}
              >
                {importStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          {/* Reset Baseline Demo Data */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs font-bold text-slate-300 block">Reset Baseline</span>
              <span className="text-[11px] text-slate-500">
                Clear all custom records and reset to baseline zeroed models.
              </span>
            </div>
            <button
              type="button"
              onClick={onResetData}
              className="px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 text-xs font-semibold transition-colors"
            >
              Reset to Baseline
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#18181c] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
