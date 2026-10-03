import React, { useState, useRef } from "react";
import { 
  Camera, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, 
  ArrowRight, Check, RefreshCw, Eye, Trash2, Plus, 
  Layers, Package, DollarSign, Scan, ShieldCheck, Image as ImageIcon
} from "lucide-react";
import { AlacioMasterState, InventoryItem } from "../../types/alacio";
import { 
  ProcessedReceipt, 
  ProcessedReceiptItem, 
  ReceiptOcrService, 
  SAMPLE_SUPPLIER_RECEIPTS,
  SampleReceiptPhoto 
} from "../../services/receiptOcrService";
import { BulkConversionEngine } from "../../services/bulkConversionEngine";

interface ReceiptUploadScannerTabProps {
  state: AlacioMasterState;
  onCommitProcessedReceipt: (receipt: ProcessedReceipt) => void;
}

export default function ReceiptUploadScannerTab({ 
  state, 
  onCommitProcessedReceipt 
}: ReceiptUploadScannerTabProps) {
  const { currency, inventory } = state;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeReceipt, setActiveReceipt] = useState<ProcessedReceipt | null>(SAMPLE_SUPPLIER_RECEIPTS[0].mockData);
  const [activeReceiptImage, setActiveReceiptImage] = useState<string>(SAMPLE_SUPPLIER_RECEIPTS[0].previewUrl);
  const [isScanning, setIsScanning] = useState(false);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Past processed receipts log
  const [processedArchive, setProcessedArchive] = useState<ProcessedReceipt[]>([
    {
      id: "archive_01",
      receiptNumber: "NW-7702",
      supplierName: "Nairobi Grain Wholesalers",
      receiptDate: "Yesterday",
      paymentMode: "MPESA",
      totalCost: 12800,
      totalRetailShelfValue: 15400,
      totalPotentialProfit: 2600,
      markupPercentage: 20.3,
      confidenceScore: 0.99,
      processedAt: "Yesterday 05:20 PM",
      items: [
        {
          id: "arch_i1",
          itemName: "Mumias Sugar",
          supplyUnitsReceived: 1,
          supplyUnit: "Bag (50kg)",
          conversionRatio: 200,
          retailUnitsAdded: 200,
          retailUnit: "Quarter-Kg (250g)",
          unitCostAtDelivery: 34,
          lineCost: 6800,
          retailPrice: 40,
          expectedMargin: 6
        },
        {
          id: "arch_i2",
          itemName: "Unga Jogoo 2kg",
          supplyUnitsReceived: 4,
          supplyUnit: "Bale (12pkts)",
          conversionRatio: 12,
          retailUnitsAdded: 48,
          retailUnit: "Packets",
          unitCostAtDelivery: 125,
          lineCost: 6000,
          retailPrice: 145,
          expectedMargin: 20
        }
      ]
    }
  ]);

  // Handle file selection / camera capture
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setActiveReceiptImage(dataUrl);

      // Process image using receipt OCR service
      try {
        const processed = await ReceiptOcrService.processReceiptImage(dataUrl, file.name);
        setActiveReceipt(processed);
        setSuccessNote(`Receipt image scanned successfully! Detected ${processed.items.length} supply items from ${processed.supplierName}.`);
        setTimeout(() => setSuccessNote(null), 5000);
      } catch (err) {
        console.error("Receipt parsing error:", err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load one of the sample receipt photos
  const handleSelectSample = async (sample: SampleReceiptPhoto) => {
    setIsScanning(true);
    setActiveReceiptImage(sample.previewUrl);

    setTimeout(() => {
      setActiveReceipt({
        ...sample.mockData,
        processedAt: "Just now"
      });
      setIsScanning(false);
      setSuccessNote(`Loaded sample receipt: ${sample.label}`);
      setTimeout(() => setSuccessNote(null), 4000);
    }, 450);
  };

  // Modify any line item in the extracted receipt
  const handleUpdateItem = (
    itemId: string, 
    field: keyof ProcessedReceiptItem, 
    value: any
  ) => {
    if (!activeReceipt) return;

    const updatedItems = activeReceipt.items.map((item) => {
      if (item.id !== itemId) return item;

      const updated = { ...item, [field]: value };

      if (field === "supplyUnitsReceived" || field === "conversionRatio") {
        const sQty = field === "supplyUnitsReceived" ? parseFloat(value) || 0 : item.supplyUnitsReceived;
        const ratio = field === "conversionRatio" ? parseFloat(value) || 1 : item.conversionRatio;
        const micro = BulkConversionEngine.convertSupplyToRetailUnits(sQty, ratio);
        updated.retailUnitsAdded = micro;
        if (micro > 0 && updated.lineCost > 0) {
          updated.unitCostAtDelivery = Math.round((updated.lineCost / micro) * 100) / 100;
        }
      }

      if (field === "lineCost") {
        const cost = parseFloat(value) || 0;
        if (updated.retailUnitsAdded > 0) {
          updated.unitCostAtDelivery = Math.round((cost / updated.retailUnitsAdded) * 100) / 100;
        }
      }

      if (field === "retailPrice") {
        const ret = parseFloat(value) || 0;
        updated.expectedMargin = Math.max(0, ret - updated.unitCostAtDelivery);
      }

      return updated;
    });

    const newTotalCost = updatedItems.reduce((acc, i) => acc + (i.lineCost || 0), 0);
    const newTotalRetail = updatedItems.reduce((acc, i) => acc + (i.retailUnitsAdded * i.retailPrice || 0), 0);
    const newProfit = newTotalRetail - newTotalCost;
    const newMarkup = newTotalCost > 0 ? (newProfit / newTotalCost) * 100 : 0;

    setActiveReceipt({
      ...activeReceipt,
      items: updatedItems,
      totalCost: newTotalCost,
      totalRetailShelfValue: newTotalRetail,
      totalPotentialProfit: newProfit,
      markupPercentage: Math.round(newMarkup * 10) / 10
    });
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    if (!activeReceipt || activeReceipt.items.length <= 1) return;
    const remaining = activeReceipt.items.filter((i) => i.id !== itemId);
    const newTotalCost = remaining.reduce((acc, i) => acc + (i.lineCost || 0), 0);
    const newTotalRetail = remaining.reduce((acc, i) => acc + (i.retailUnitsAdded * i.retailPrice || 0), 0);
    const newProfit = newTotalRetail - newTotalCost;
    const newMarkup = newTotalCost > 0 ? (newProfit / newTotalCost) * 100 : 0;

    setActiveReceipt({
      ...activeReceipt,
      items: remaining,
      totalCost: newTotalCost,
      totalRetailShelfValue: newTotalRetail,
      totalPotentialProfit: newProfit,
      markupPercentage: Math.round(newMarkup * 10) / 10
    });
  };

  // Commit and ingest receipt into inventory
  const handleCommitReceipt = () => {
    if (!activeReceipt) return;

    onCommitProcessedReceipt({
      ...activeReceipt,
      imageUrl: activeReceiptImage
    });

    setProcessedArchive([
      {
        ...activeReceipt,
        imageUrl: activeReceiptImage,
        processedAt: "Just now"
      },
      ...processedArchive
    ]);

    setSuccessNote(
      `Receipt ${activeReceipt.receiptNumber} from ${activeReceipt.supplierName} ingested! Added ${currency} ${activeReceipt.totalRetailShelfValue.toLocaleString()} to active shelf inventory. Supply-based stock updated!`
    );
    setTimeout(() => setSuccessNote(null), 7000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER: SUPPLY-BASED STOCK PARADIGM */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Camera className="text-emerald-400" size={24} /> Supplier Receipt Scanner &amp; Ingestion
            </h2>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              Supply-Based Controllable Stock
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload or photograph incoming supplier delivery notes &amp; paper receipts. Automatically extracts wholesale batches, applies <strong>Bulk-to-Micro Conversion</strong>, and recalibrates inventory without manual counter typing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 font-mono"
          >
            <Camera size={15} /> Take Photo / Upload Receipt Pic
          </button>
        </div>
      </div>

      {successNote && (
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* 1-TAP SAMPLE RECEIPTS FOR IMMEDIATE TESTING */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-400" /> Or 1-Tap Test Common Kenyan Supplier Delivery Slips:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_SUPPLIER_RECEIPTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="p-3 bg-[#0a1510] hover:bg-[#0f241a] border border-emerald-500/30 hover:border-emerald-400 rounded-xl text-left transition cursor-pointer text-xs group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white group-hover:text-emerald-300 transition truncate block">
                  {sample.label}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0">
                  {currency} {sample.mockData.totalCost.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {sample.supplier} &bull; {sample.mockData.items.length} Products
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TWO-COLUMN DISPLAY: RECEIPT PHOTO (LEFT) & EXTRACTED MANIFEST (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: RECEIPT PHOTO PREVIEW */}
        <div className="lg:col-span-5 bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <ImageIcon size={15} className="text-cyan-400" /> Uploaded Physical Receipt Photo
            </span>
            {isScanning && (
              <span className="text-[10px] font-mono text-amber-400 animate-pulse flex items-center gap-1">
                <RefreshCw size={11} className="animate-spin" /> Scanning OCR...
              </span>
            )}
          </div>

          {/* Receipt Image Display */}
          <div className="relative bg-[#060c09] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center min-h-[380px] p-2">
            {activeReceiptImage ? (
              <img
                src={activeReceiptImage}
                alt="Uploaded Supplier Receipt"
                className="max-h-[460px] w-auto object-contain rounded-lg shadow-md"
              />
            ) : (
              <div className="text-center p-8 text-slate-500 space-y-2">
                <Camera size={36} className="mx-auto text-slate-600" />
                <p className="text-xs">No receipt photo uploaded yet</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-mono"
                >
                  Upload Receipt
                </button>
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                <Scan size={36} className="text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-300">
                  Multimodal Receipt Scanner Running...
                </span>
                <span className="text-[10px] text-slate-300">
                  Extracting suppliers, wholesale quantities, and bulk-to-micro splits
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>OCR Confidence: {((activeReceipt?.confidenceScore || 0.98) * 100).toFixed(0)}%</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Upload Different Receipt
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: STRUCTURED EXTRACTED INVENTORY MANIFEST */}
        <div className="lg:col-span-7 bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* INVOICE HEADER DETAILS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                  Supplier Delivery Manifest
                </span>
                <h3 className="text-lg font-bold text-white font-serif">
                  {activeReceipt?.supplierName || "Supplier Delivery"}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {activeReceipt?.receiptNumber}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                  {activeReceipt?.paymentMode}
                </span>
              </div>
            </div>

            {/* EXTRACTED LINE ITEMS TABLE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="font-bold text-white uppercase text-[11px]">
                  Extracted Supply Items ({activeReceipt?.items.length || 0})
                </span>
                <span className="text-[10px] text-cyan-400">
                  Bulk &rarr; Micro Split Auto-Applied
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {activeReceipt?.items.map((item, idx) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-[#060c09] border border-slate-800 rounded-xl space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleUpdateItem(item.id, "itemName", e.target.value)}
                        className="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none w-2/3"
                      />

                      {activeReceipt.items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-400 hover:text-red-300 text-[10px] cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Wholesale Qty</span>
                        <div className="flex items-center gap-1 font-bold text-white mt-0.5">
                          <input
                            type="number"
                            value={item.supplyUnitsReceived}
                            onChange={(e) => handleUpdateItem(item.id, "supplyUnitsReceived", e.target.value)}
                            className="w-12 bg-[#0c1813] border border-slate-700 rounded px-1 text-center"
                          />
                          <span className="text-[10px] text-slate-400">{item.supplyUnit}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-cyan-400 block text-[9px] uppercase">Micro Retail Added</span>
                        <span className="font-bold text-cyan-300 block mt-0.5">
                          +{item.retailUnitsAdded} {item.retailUnit}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Line Cost</span>
                        <div className="flex items-center gap-1 font-bold text-amber-400 mt-0.5">
                          <span>{currency}</span>
                          <input
                            type="number"
                            value={item.lineCost}
                            onChange={(e) => handleUpdateItem(item.id, "lineCost", e.target.value)}
                            className="w-16 bg-[#0c1813] border border-slate-700 rounded px-1"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Retail Price</span>
                        <div className="flex items-center gap-1 font-bold text-emerald-400 mt-0.5">
                          <span>{currency}</span>
                          <input
                            type="number"
                            value={item.retailPrice}
                            onChange={(e) => handleUpdateItem(item.id, "retailPrice", e.target.value)}
                            className="w-14 bg-[#0c1813] border border-slate-700 rounded px-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUPPLY-BASED FINANCIAL IMPACT BANNER */}
            <div className="p-3.5 bg-[#070e0a] border border-emerald-500/40 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Invoice Cost</span>
                <strong className="text-amber-400 text-sm">
                  {currency} {activeReceipt?.totalCost.toLocaleString()}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Added Shelf Value</span>
                <strong className="text-cyan-400 text-sm">
                  +{currency} {activeReceipt?.totalRetailShelfValue.toLocaleString()}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Batch Margin</span>
                <strong className="text-emerald-400 text-sm">
                  +{currency} {activeReceipt?.totalPotentialProfit.toLocaleString()}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Markup %</span>
                <strong className="text-white text-sm">
                  {activeReceipt?.markupPercentage}%
                </strong>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON TO INGEST */}
          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleCommitReceipt}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 font-mono"
            >
              <Check size={16} />
              <span>Ingest Receipt &amp; Calibrate Controllable Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* RECENTLY INGESTED RECEIPTS ARCHIVE */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <FileText size={15} className="text-emerald-400" /> Processed Receipt Archive ({processedArchive.length} Receipts)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Verified supply-based paper audit trail</span>
        </div>

        <div className="space-y-3">
          {processedArchive.map((rcpt) => (
            <div 
              key={rcpt.id}
              className="p-3.5 bg-[#060c09] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{rcpt.supplierName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {rcpt.receiptNumber}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {rcpt.items.length} Products
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {rcpt.items.map((i) => `${i.supplyUnitsReceived} ${i.supplyUnit} ${i.itemName}`).join(" • ")}
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-xs shrink-0">
                <div className="text-right">
                  <div className="font-bold text-amber-400">
                    {currency} {rcpt.totalCost.toLocaleString()} ({rcpt.paymentMode})
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    +{currency} {rcpt.totalPotentialProfit.toLocaleString()} margin
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">{rcpt.processedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
