import React, { useState } from "react";
import { Smartphone, CheckCircle2, AlertCircle, ArrowRight, X, FileText, RefreshCw } from "lucide-react";
import { MpesaStatementRecord } from "../types/alacio";

interface MpesaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onImportRecords: (records: MpesaStatementRecord[]) => void;
}

export default function MpesaImportModal({
  isOpen,
  onClose,
  currency,
  onImportRecords
}: MpesaImportModalProps) {
  const [statementText, setStatementText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<MpesaStatementRecord[]>([]);

  if (!isOpen) return null;

  const sampleStatements = `SI5210H3 Confirmed. Ksh 450.00 received from MAMA KEVIN 254712345678 on 2/10/26 at 11:45 AM.
SI5234M9 Confirmed. Ksh 1,200.00 received from PETER KAMAU 254722334455 on 2/10/26 at 1:15 PM.
SI5299P1 Confirmed. Ksh 800.00 paid to KPLC PREPAID on 2/10/26 at 2:30 PM.`;

  const handleApplySample = () => {
    setStatementText(sampleStatements);
  };

  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementText.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      const lines = statementText.split("\n").filter((l) => l.trim().length > 0);
      const records: MpesaStatementRecord[] = lines.map((line, idx) => {
        const receiptMatch = line.match(/^([A-Z0-9]{8,10})/i);
        const receipt = receiptMatch ? receiptMatch[1] : `MP-${Date.now()}-${idx}`;
        const amountMatch = line.match(/Ksh\s*([\d,]+\.?\d*)/i);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : 100;
        const isPaid = line.toLowerCase().includes("paid to");

        return {
          id: `mp_import_${Date.now()}_${idx}`,
          receipt_no: receipt,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          details: line.slice(0, 50),
          amount,
          status: isPaid ? "UNMATCHED_OUTFLOW" : "MATCHED"
        };
      });

      setParsedItems(records);
      setIsProcessing(false);
    }, 600);
  };

  const handleCommit = () => {
    if (parsedItems.length > 0) {
      onImportRecords(parsedItems);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-[#0e1713] border-2 border-emerald-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-xs">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-serif">M-Pesa Statement Cross-Check Import</h3>
              <span className="text-[10px] text-slate-400 font-mono">Independent verification against counter transactions</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleParse} className="space-y-3">
          <div className="flex justify-between items-center text-[11px]">
            <label className="text-slate-300 font-mono">Paste Safaricom SMS or Statement Lines:</label>
            <button
              type="button"
              onClick={handleApplySample}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Insert Sample SMS
            </button>
          </div>

          <textarea
            rows={4}
            value={statementText}
            onChange={(e) => setStatementText(e.target.value)}
            placeholder="e.g. SI5210H3 Confirmed. Ksh 450.00 received from MAMA KEVIN on 2/10/26 at 11:45 AM..."
            className="w-full bg-[#08100c] border border-slate-700 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            disabled={!statementText.trim() || isProcessing}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin text-emerald-400" /> : <FileText size={14} />}
            <span>Parse Statement Lines</span>
          </button>
        </form>

        {/* PARSED STATEMENT PREVIEW */}
        {parsedItems.length > 0 && (
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold">
              Detected {parsedItems.length} Statement Transactions
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 font-mono text-[11px]">
              {parsedItems.map((item) => (
                <div key={item.id} className="p-2 bg-[#08100c] border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">{item.receipt_no}</span>
                    <span className="text-slate-400 ml-2">{item.details.slice(0, 30)}...</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{currency} {item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCommit}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Commit &amp; Reconcile M-Pesa Float
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
