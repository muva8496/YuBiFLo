import React, { useState } from "react";
import {
  FileScan,
  Sparkles,
  Upload,
  Camera,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Boxes,
  FileText,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { ExtractedReceipt, Merchant, IngestionBatchResult } from "../types";
import { HistoricalIngestionEngine } from "../services/historicalIngestionEngine";
import { GeminiApiService } from "../services/api";

interface ReceiptIngestionViewProps {
  merchant: Merchant;
  onIngestionComplete: (result: IngestionBatchResult) => void;
}

export const ReceiptIngestionView: React.FC<ReceiptIngestionViewProps> = ({
  merchant,
  onIngestionComplete,
}) => {
  const [activeMode, setActiveMode] = useState<"SAMPLE" | "PASTE" | "UPLOAD">("SAMPLE");
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptsList, setReceiptsList] = useState<ExtractedReceipt[]>(
    HistoricalIngestionEngine.getSampleUnsortedReceipts()
  );
  const [ingestionResult, setIngestionResult] = useState<IngestionBatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load sample chaotic receipts
  const handleLoadSample = () => {
    const samples = HistoricalIngestionEngine.getSampleUnsortedReceipts();
    setReceiptsList(samples);
    setIngestionResult(null);
    setErrorMsg(null);
  };

  // AI Gemini Ingestion
  const handleParseWithGemini = async () => {
    if (!rawText.trim()) {
      setErrorMsg("Please paste invoice text or notes to extract.");
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);

    const response = await GeminiApiService.parseReceipts({
      textContent: rawText,
    });

    setIsProcessing(false);

    if (response.success && response.data?.extractedReceipts) {
      setReceiptsList(response.data.extractedReceipts);
    } else {
      setErrorMsg(response.error || "Gemini parser was unable to extract receipts. Try pasting clearer receipt details.");
    }
  };

  // Image Upload handler for Receipt OCR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setIsProcessing(true);
      setErrorMsg(null);

      const response = await GeminiApiService.parseReceipts({
        imageBase64: base64,
        mimeType: file.type,
      });

      setIsProcessing(false);
      if (response.success && response.data?.extractedReceipts) {
        setReceiptsList(response.data.extractedReceipts);
      } else {
        setErrorMsg(response.error || "AI OCR could not process this image. You can also load our sample chaotic bills.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Run the 4-Step Chronological Restock-Trigger Engine Replay
  const handleRunReplay = () => {
    if (receiptsList.length === 0) {
      setErrorMsg("No receipts available to process. Please add or load receipts first.");
      return;
    }

    const result = HistoricalIngestionEngine.processUnsortedReceipts(receiptsList, merchant);
    setIngestionResult(result);
    onIngestionComplete(result);
  };

  return (
    <div id="receipt-ingestion-view" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileScan className="w-5 h-5 text-amber-400" />
            <span>Unsorted & Historical Receipt Ingestion Engine</span>
          </h1>
          <p className="text-xs text-slate-400">
            Ingest messy, out-of-order supplier bills. Our engine sorts chronologically and simulates batch turnovers to reconstruct full historical sales & profit.
          </p>
        </div>

        <button
          id="run-chronological-replay-btn"
          onClick={handleRunReplay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all self-start sm:self-auto"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Execute 4-Step Chronological Replay</span>
        </button>
      </div>

      {/* Input Mode Selector */}
      <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveMode("SAMPLE");
                handleLoadSample();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === "SAMPLE"
                  ? "bg-slate-800/80 text-amber-300 border border-amber-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              ⭐ Preset: Chaotic July Wholesale Bills (6 Receipts)
            </button>
            <button
              onClick={() => setActiveMode("UPLOAD")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMode === "UPLOAD"
                  ? "bg-slate-800/80 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              📸 Upload Bill Photos / OCR
            </button>
            <button
              onClick={() => setActiveMode("PASTE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMode === "PASTE"
                  ? "bg-slate-800/80 text-indigo-300 border border-indigo-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              ✍️ Paste Messy Text Notes
            </button>
          </div>

          <span className="text-xs text-slate-400">
            Currently loaded: <strong className="text-slate-200">{receiptsList.length} receipt bills</strong>
          </span>
        </div>

        {/* Mode Specific Inputs */}
        {activeMode === "PASTE" && (
          <div className="space-y-3">
            <textarea
              rows={4}
              placeholder="Paste raw WhatsApp supplier notes or typed receipts, e.g.:
- 22nd July: Bought 24 bales Jogoo maize from Khetias for 3240 KSh, sell at 165.
- 4th July: Brookside delivered 36 pkts milk at 52 cost, selling at 65 KSh.
- 16th July: Another 36 pkts milk from Brookside..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleParseWithGemini}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-slate-900 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? "Gemini Parsing Receipts..." : "Extract Receipts with Gemini AI"}</span>
            </button>
          </div>
        )}

        {activeMode === "UPLOAD" && (
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center space-y-3 bg-slate-900/60">
            <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Upload supplier invoice photo or handwritten shop chit
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gemini AI will extract Date, Quantities, Wholesale Cost, and suggest Retail Selling Prices.
              </p>
            </div>
            <label className="inline-block px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-transform active:scale-95">
              <span>{isProcessing ? "Analyzing Image with Gemini..." : "Select Receipt Image"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* The 4-Step Visual Algorithm Tracker */}
      <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-3 shadow-xl">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          How the Multi-Receipt Algorithm Works:
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 block font-bold">STEP 1</span>
            <span className="font-semibold text-slate-200 block">Extract Line Items</span>
            <span className="text-[11px] text-slate-400">
              Extract item name, quantity, total cost, unit cost & retail price.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 block font-bold">STEP 2</span>
            <span className="font-semibold text-slate-200 block">Sort Chronologically</span>
            <span className="text-[11px] text-slate-400">
              Reorders out-of-sequence bills strictly by Date (Ascending).
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 block font-bold">STEP 3</span>
            <span className="font-semibold text-slate-200 block">Group by Item</span>
            <span className="text-[11px] text-slate-400">
              Isolates timeline for Milk, Flour, Oil, Eggs independently.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-emerald-500/30 space-y-1 bg-emerald-950/20">
            <span className="text-[10px] font-mono text-emerald-400 block font-bold">STEP 4</span>
            <span className="font-semibold text-emerald-300 block">Batch Replay & Sales</span>
            <span className="text-[11px] text-slate-400">
              Arrival of Batch N+1 auto-calculates and logs sales for Batch N!
            </span>
          </div>
        </div>
      </div>

      {/* Raw Ingested Receipts List */}
      <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Ingested Receipts Waiting For Replay ({receiptsList.length})
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-mono">
            Notice: Dates may be unsorted before execution
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {receiptsList.map((rec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-100">{rec.supplierName}</span>
                <span className="font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30 font-semibold">
                  {rec.receiptDate}
                </span>
              </div>

              {rec.notes && <p className="text-[11px] text-slate-400 italic">"{rec.notes}"</p>}

              <div className="space-y-1 pt-1 border-t border-slate-800">
                {rec.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="text-xs flex items-center justify-between">
                    <span className="text-slate-300 font-medium truncate max-w-[150px]">
                      {item.itemName}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {item.qtyPurchased} {item.unitOfMeasure || "units"} @ {merchant.currency}{" "}
                      {item.totalCost}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Replay Result Box */}
      {ingestionResult && (
        <div className="p-5 rounded-xl bg-[#18181b] border-2 border-emerald-500/40 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-emerald-300">
                  Historical Timeline Replay Successful!
                </h3>
                <span className="text-xs text-slate-400">
                  {ingestionResult.processedReceiptsCount} bills processed • {ingestionResult.generatedSalesEntries.length} past sales transactions auto-synthesized.
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Derived Revenue</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                +{merchant.currency} {ingestionResult.derivedTotalRevenue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block">Total Historical Invoices</span>
              <span className="text-base font-bold text-rose-400 font-mono">
                {merchant.currency} {ingestionResult.totalExpensesLogged.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block">Synthesized Gross Profit</span>
              <span className="text-base font-bold text-white font-mono">
                +{merchant.currency} {ingestionResult.derivedTotalProfit.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block">Updated Stock Items</span>
              <span className="text-base font-bold text-slate-200">
                {ingestionResult.itemsUpdated.length} products re-indexed
              </span>
            </div>
          </div>

          {/* Generated Sales Timeline Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Auto-Generated Sales Ledger from Historical Supply Batches:
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Batch Timeline</th>
                    <th className="py-2.5 px-3 text-right">Units Sold</th>
                    <th className="py-2.5 px-3 text-right">Velocity</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {ingestionResult.generatedSalesEntries.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-100">
                        {sale.item_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {sale.batch_start_date.split("T")[0]} → {sale.batch_end_date.split("T")[0]}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {sale.qty_sold}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        {sale.sales_velocity_days} days
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        +{merchant.currency} {sale.total_revenue.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        +{merchant.currency} {sale.total_profit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
