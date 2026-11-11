import React, { useState } from "react";
import { 
  X, Globe, ArrowRight, Download, Upload, Copy, 
  Check, CheckCircle2, ShieldCheck, Lock, RefreshCw, AlertCircle, Database
} from "lucide-react";
import { AlacioMasterState } from "../types/alacio";
import { encryptClientData, decryptClientData, EncryptedPayload } from "../utils/zeroKnowledgeEncryption";

interface DomainMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AlacioMasterState;
  onRestoreState: (newState: AlacioMasterState) => void;
  userEmail?: string;
}

export default function DomainMigrationModal({
  isOpen,
  onClose,
  currentState,
  onRestoreState,
  userEmail
}: DomainMigrationModalProps) {
  const [activeTab, setActiveTab] = useState<"EXPORT" | "IMPORT" | "CLOUD">("EXPORT");
  const [migrationToken, setMigrationToken] = useState<string>("");
  const [importToken, setImportToken] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentDomain = typeof window !== "undefined" ? window.location.hostname : "localhost";

  // Generate an encrypted migration snapshot token
  const handleGenerateToken = async () => {
    setIsProcessing(true);
    try {
      const encrypted = await encryptClientData(currentState);
      const token = btoa(JSON.stringify(encrypted));
      setMigrationToken(token);
      setStatusMsg({
        type: "success",
        text: `✓ Encrypted migration snapshot generated! Copy and paste this on yubiflo.com.`
      });
    } catch (e: any) {
      setStatusMsg({ type: "error", text: `Error generating token: ${e.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToken = () => {
    if (!migrationToken) return;
    navigator.clipboard.writeText(migrationToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Download complete JSON backup file
  const handleDownloadFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentState, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `yubiflo_client_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import snapshot token
  const handleImportTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importToken.trim()) return;
    setIsProcessing(true);
    setStatusMsg(null);

    try {
      let parsedPayload: EncryptedPayload;
      try {
        const decodedStr = atob(importToken.trim());
        parsedPayload = JSON.parse(decodedStr);
      } catch (err) {
        // Fallback if plain JSON was pasted
        const plain = JSON.parse(importToken.trim());
        if (plain && plain.inventory) {
          onRestoreState(plain);
          setStatusMsg({ type: "success", text: "✓ Shopkeeper records successfully restored without loss!" });
          setIsProcessing(false);
          return;
        }
        throw new Error("Invalid token format.");
      }

      if (parsedPayload.alg === "AES-GCM-256") {
        const decrypted = await decryptClientData<AlacioMasterState>(parsedPayload);
        onRestoreState(decrypted);
        setStatusMsg({ type: "success", text: "✓ Encrypted shop records successfully decrypted & restored without loss!" });
      } else {
        throw new Error("Unrecognized encryption algorithm.");
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: `Failed to restore: ${e.message || "Invalid migration data"}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && (json.inventory || json.salesLedger)) {
          onRestoreState(json);
          setStatusMsg({ type: "success", text: `✓ Backup file loaded! Restored ${json.inventory?.length || 0} goods and records.` });
        } else {
          setStatusMsg({ type: "error", text: "File is not a valid YubiFlo backup format." });
        }
      } catch (err: any) {
        setStatusMsg({ type: "error", text: `Failed to parse file: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0f1724] border-2 border-[#1e3047] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative font-sans text-[#e2ecf3] my-8">
        
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-[#18273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-white">
                Domain Migration Bridge
              </h2>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span>Current: <strong>{currentDomain}</strong></span>
                <span>&bull;</span>
                <span className="text-emerald-400">Zero Data Loss Protocol</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS */}
        <div className="px-6 pt-4">
          <div className="bg-[#090e17] p-1 rounded-2xl border border-[#1a2b3f] grid grid-cols-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => { setActiveTab("EXPORT"); setStatusMsg(null); }}
              className={`py-2 rounded-xl transition font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "EXPORT"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Download size={14} />
              <span>Export From Current</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("IMPORT"); setStatusMsg(null); }}
              className={`py-2 rounded-xl transition font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "IMPORT"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Upload size={14} />
              <span>Restore on yubiflo.com</span>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4 text-xs font-mono">
          {statusMsg && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMsg.type === "success" 
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                : "bg-rose-500/15 border-rose-500/40 text-rose-200"
            }`}>
              {statusMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {activeTab === "EXPORT" ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                Upgrading from <strong className="text-white">yubiflo.vercel.app</strong> to <strong className="text-emerald-400">yubiflo.com</strong>? 
                Generate an encrypted snapshot token or download a backup file below.
              </div>

              {!migrationToken ? (
                <button
                  type="button"
                  onClick={handleGenerateToken}
                  disabled={isProcessing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Lock size={15} />
                  <span>Generate Encrypted Migration Token</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Encrypted Migration Token:</span>
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? "Copied!" : "Copy Token"}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={migrationToken}
                    className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[10px] text-emerald-400 font-mono resize-none focus:outline-none"
                  />
                </div>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[10px]">OR DOWNLOAD FILE</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleDownloadFile}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                <span>Download Master Backup JSON</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleImportTokenSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                Paste the migration token generated from <strong className="text-white">yubiflo.vercel.app</strong> below to instantly populate your workspace on <strong className="text-emerald-400">yubiflo.com</strong> without data loss.
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Paste Migration Token:
                </label>
                <textarea
                  required
                  value={importToken}
                  onChange={(e) => setImportToken(e.target.value)}
                  placeholder="Paste encrypted snapshot string here..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] text-white font-mono resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !importToken.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"
              >
                <Upload size={15} />
                <span>Restore Records Into Current Domain</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[10px]">OR UPLOAD FILE</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <label className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer block text-center">
                <Upload size={14} className="inline mr-1" />
                <span>Upload yubiflo_client_backup.json</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </form>
          )}

          {/* E2EE SECURITY BADGE */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Zero-Knowledge E2EE:</strong> Client records are encrypted with AES-GCM 256-bit. YubiFlo staff cannot view your financial records.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
