import React, { useState, useRef } from "react";
import { 
  Camera, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, 
  ArrowRight, Check, RefreshCw, Eye, Trash2, Plus, 
  Layers, Package, DollarSign, Scan, ShieldCheck, Image as ImageIcon,
  Calendar, Edit3, CheckSquare, Square, XCircle, X
} from "lucide-react";
import { 
  AlacioMasterState, 
  InventoryItem, 
  SavedReceiptRecord, 
  SavedReceiptItem 
} from "../../types/alacio";
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
  onCommitProcessedReceipt?: (receipt: ProcessedReceipt) => void;
  onSaveReceiptToDatabase?: (receipt: SavedReceiptRecord) => void;
}

export default function ReceiptUploadScannerTab({ 
  state, 
  onCommitProcessedReceipt,
  onSaveReceiptToDatabase
}: ReceiptUploadScannerTabProps) {
  const { currency, inventory = [], receiptsArchive = [] } = state;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active receipt in scanner (starts with THE PHIMAR TRADING CENTER receipt)
  const defaultSample = SAMPLE_SUPPLIER_RECEIPTS[0].mockData;
  const [activeReceipt, setActiveReceipt] = useState<ProcessedReceipt | null>(() => ({
    ...defaultSample,
    items: defaultSample.items.map((i) => ({ ...i, approved: true }))
  }));
  const [activeReceiptImage, setActiveReceiptImage] = useState<string>(
    SAMPLE_SUPPLIER_RECEIPTS[0].previewUrl
  );
  const [isScanning, setIsScanning] = useState(false);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Database archive state
  const [archiveFilter, setArchiveFilter] = useState<"all" | "approved" | "rejected">("all");
  const [inspectingReceipt, setInspectingReceipt] = useState<SavedReceiptRecord | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("Incorrect pricing / unverified delivery chit");

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
        const receiptWithApprovals: ProcessedReceipt = {
          ...processed,
          items: processed.items.map((i) => ({ ...i, approved: true }))
        };
        setActiveReceipt(receiptWithApprovals);
        setSuccessNote(`Receipt image scanned successfully! Detected ${processed.items.length} supply items from ${processed.supplierName}. Client can approve each item below.`);
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
        processedAt: "Just now",
        items: sample.mockData.items.map((i) => ({ ...i, approved: true }))
      });
      setIsScanning(false);
      setSuccessNote(`Loaded receipt: ${sample.label}`);
      setTimeout(() => setSuccessNote(null), 4000);
    }, 350);
  };

  // Toggle approval on an individual item
  const handleToggleItemApproval = (itemId: string) => {
    if (!activeReceipt) return;

    const updatedItems = activeReceipt.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, approved: item.approved === false ? true : false };
      }
      return item;
    });

    // Recalculate totals strictly for approved items (strict numeric math: e.g. 140 + 280 = 420)
    const approved = updatedItems.filter((i) => i.approved !== false);
    const newTotalCost = approved.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
    const newTotalRetail = approved.reduce(
      (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
      0
    );
    const newProfit = Math.max(0, newTotalRetail - newTotalCost);
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

  const handleApproveAllItems = () => {
    if (!activeReceipt) return;
    const updatedItems = activeReceipt.items.map((i) => ({ ...i, approved: true }));
    const newTotalCost = updatedItems.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
    const newTotalRetail = updatedItems.reduce(
      (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
      0
    );
    const newProfit = Math.max(0, newTotalRetail - newTotalCost);
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

  const handleRejectAllItems = () => {
    if (!activeReceipt) return;
    const updatedItems = activeReceipt.items.map((i) => ({ ...i, approved: false }));
    setActiveReceipt({
      ...activeReceipt,
      items: updatedItems,
      totalCost: 0,
      totalRetailShelfValue: 0,
      totalPotentialProfit: 0,
      markupPercentage: 0
    });
  };

  // Modify any line item in the extracted receipt (STRICT NUMERICAL CONVERSION: no string concat)
  const handleUpdateItem = (
    itemId: string, 
    field: keyof ProcessedReceiptItem, 
    value: any
  ) => {
    if (!activeReceipt) return;

    const updatedItems = activeReceipt.items.map((item) => {
      if (item.id !== itemId) return item;

      const updated = { ...item };

      if (field === "itemName") {
        updated.itemName = String(value);
      } else if (field === "supplyUnitsReceived") {
        const sQty = Number(value) || 0;
        updated.supplyUnitsReceived = sQty;
        const ratio = Number(updated.conversionRatio) || 1;
        const micro = BulkConversionEngine.convertSupplyToRetailUnits(sQty, ratio);
        updated.retailUnitsAdded = micro;
        if (micro > 0 && (Number(updated.lineCost) || 0) > 0) {
          updated.unitCostAtDelivery = Math.round(((Number(updated.lineCost) || 0) / micro) * 100) / 100;
        }
      } else if (field === "conversionRatio") {
        const ratio = Number(value) || 1;
        updated.conversionRatio = ratio;
        const micro = BulkConversionEngine.convertSupplyToRetailUnits(Number(updated.supplyUnitsReceived) || 1, ratio);
        updated.retailUnitsAdded = micro;
        if (micro > 0 && (Number(updated.lineCost) || 0) > 0) {
          updated.unitCostAtDelivery = Math.round(((Number(updated.lineCost) || 0) / micro) * 100) / 100;
        }
      } else if (field === "lineCost") {
        // Enforce strictly numeric value: 140 + 280 = 420
        const cost = Number(value) || 0;
        updated.lineCost = cost;
        const retailUnits = Number(updated.retailUnitsAdded) || 1;
        if (retailUnits > 0) {
          updated.unitCostAtDelivery = Math.round((cost / retailUnits) * 100) / 100;
        }
      } else if (field === "retailPrice") {
        const ret = Number(value) || 0;
        updated.retailPrice = ret;
        updated.expectedMargin = Math.max(0, ret - (Number(updated.unitCostAtDelivery) || 0));
      } else {
        (updated as any)[field] = value;
      }

      return updated;
    });

    // Strictly numerical addition: 140 + 280 = 420
    const approved = updatedItems.filter((i) => i.approved !== false);
    const newTotalCost = approved.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
    const newTotalRetail = approved.reduce(
      (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
      0
    );
    const newProfit = Math.max(0, newTotalRetail - newTotalCost);
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
    const approved = remaining.filter((i) => i.approved !== false);
    const newTotalCost = approved.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
    const newTotalRetail = approved.reduce(
      (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
      0
    );
    const newProfit = Math.max(0, newTotalRetail - newTotalCost);
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

  // Update receipt date (for doing yesterday's receipts today)
  const handleUpdateReceiptDate = (newDate: string) => {
    if (!activeReceipt) return;
    setActiveReceipt({
      ...activeReceipt,
      receiptDate: newDate,
      processedAt: `${newDate} (Verified Receipt)`
    });
  };

  // Approve & Commit receipt: saves to database and active inventory, then CLEARS scanner to give space for new uploads
  const handleCommitReceipt = () => {
    if (!activeReceipt) return;

    const approvedItems = activeReceipt.items.filter((i) => i.approved !== false);
    if (approvedItems.length === 0) {
      setSuccessNote("Please approve at least one good before committing.");
      setTimeout(() => setSuccessNote(null), 3000);
      return;
    }

    const approvedTotalCost = approvedItems.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
    const approvedTotalRetail = approvedItems.reduce(
      (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
      0
    );
    const profit = Math.max(0, approvedTotalRetail - approvedTotalCost);
    const markup = approvedTotalCost > 0 ? Math.round((profit / approvedTotalCost) * 1000) / 10 : 0;

    // 1. Commit to active inventory
    if (onCommitProcessedReceipt) {
      onCommitProcessedReceipt({
        ...activeReceipt,
        items: approvedItems,
        totalCost: approvedTotalCost,
        totalRetailShelfValue: approvedTotalRetail,
        totalPotentialProfit: profit,
        markupPercentage: markup,
        imageUrl: activeReceiptImage
      });
    }

    // 2. Save worked-on receipt into persistent database archive
    const savedRecord: SavedReceiptRecord = {
      id: activeReceipt.id || `rcpt_arch_${Date.now()}`,
      receiptNumber: activeReceipt.receiptNumber || `DN-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: activeReceipt.supplierName,
      receiptDate: activeReceipt.receiptDate,
      paymentMode: activeReceipt.paymentMode,
      status: "approved",
      totalCost: approvedTotalCost,
      totalRetailShelfValue: approvedTotalRetail,
      totalPotentialProfit: profit,
      markupPercentage: markup,
      itemsCount: approvedItems.length,
      items: activeReceipt.items.map((i) => ({
        id: i.id,
        itemName: i.itemName,
        supplyUnitsReceived: Number(i.supplyUnitsReceived) || 1,
        supplyUnit: i.supplyUnit,
        conversionRatio: i.conversionRatio,
        retailUnitsAdded: Number(i.retailUnitsAdded) || 1,
        retailUnit: i.retailUnit,
        unitCostAtDelivery: Number(i.unitCostAtDelivery) || 0,
        lineCost: Number(i.lineCost) || 0,
        retailPrice: Number(i.retailPrice) || 0,
        expectedMargin: Number(i.expectedMargin) || 0,
        approved: i.approved !== false
      })),
      imageUrl: activeReceiptImage || undefined,
      processedAt: activeReceipt.processedAt || "Just now",
      decidedAt: new Date().toISOString(),
      notes: `Worked-on & approved receipt. ${approvedItems.length} items verified.`
    };

    if (onSaveReceiptToDatabase) {
      onSaveReceiptToDatabase(savedRecord);
    }

    // 3. Clear active scanner to give space for new uploads
    const clearedNumber = activeReceipt.receiptNumber;
    const clearedSupplier = activeReceipt.supplierName;
    setActiveReceipt(null);
    setActiveReceiptImage("");

    setSuccessNote(
      `✓ Worked-on receipt ${clearedNumber} (${clearedSupplier}) approved! Saved to database and inventory calibrated. Scanner cleared for next upload.`
    );
    setTimeout(() => setSuccessNote(null), 7000);
  };

  // Reject receipt: save to database with rejection reason and clear scanner to give space for new uploads
  const handleRejectReceipt = (reason: string = "Incorrect pricing / unverified delivery chit") => {
    if (!activeReceipt) return;

    const savedRecord: SavedReceiptRecord = {
      id: activeReceipt.id || `rcpt_arch_${Date.now()}`,
      receiptNumber: activeReceipt.receiptNumber || `DN-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: activeReceipt.supplierName,
      receiptDate: activeReceipt.receiptDate,
      paymentMode: activeReceipt.paymentMode,
      status: "rejected",
      rejectionReason: reason,
      totalCost: Number(activeReceipt.totalCost) || 0,
      totalRetailShelfValue: Number(activeReceipt.totalRetailShelfValue) || 0,
      totalPotentialProfit: Number(activeReceipt.totalPotentialProfit) || 0,
      markupPercentage: Number(activeReceipt.markupPercentage) || 0,
      itemsCount: activeReceipt.items.length,
      items: activeReceipt.items.map((i) => ({
        id: i.id,
        itemName: i.itemName,
        supplyUnitsReceived: Number(i.supplyUnitsReceived) || 1,
        supplyUnit: i.supplyUnit,
        conversionRatio: i.conversionRatio,
        retailUnitsAdded: Number(i.retailUnitsAdded) || 1,
        retailUnit: i.retailUnit,
        unitCostAtDelivery: Number(i.unitCostAtDelivery) || 0,
        lineCost: Number(i.lineCost) || 0,
        retailPrice: Number(i.retailPrice) || 0,
        expectedMargin: Number(i.expectedMargin) || 0,
        approved: false
      })),
      imageUrl: activeReceiptImage || undefined,
      processedAt: activeReceipt.processedAt || "Just now",
      decidedAt: new Date().toISOString(),
      notes: `Rejected receipt: ${reason}`
    };

    if (onSaveReceiptToDatabase) {
      onSaveReceiptToDatabase(savedRecord);
    }

    const clearedNumber = activeReceipt.receiptNumber;
    setActiveReceipt(null);
    setActiveReceiptImage("");
    setIsRejectModalOpen(false);

    setSuccessNote(
      `Receipt ${clearedNumber} marked as REJECTED and saved to database. Scanner cleared for new uploads.`
    );
    setTimeout(() => setSuccessNote(null), 6000);
  };

  // Reload an archived receipt back into the active scanner for review or re-editing
  const handleReloadArchivedReceipt = (arch: SavedReceiptRecord) => {
    setActiveReceipt({
      id: arch.id,
      receiptNumber: arch.receiptNumber,
      supplierName: arch.supplierName,
      receiptDate: arch.receiptDate,
      paymentMode: arch.paymentMode === "MPESA" ? "MPESA" : "CASH",
      totalCost: arch.totalCost,
      totalRetailShelfValue: arch.totalRetailShelfValue,
      totalPotentialProfit: arch.totalPotentialProfit,
      markupPercentage: arch.markupPercentage,
      confidenceScore: 0.99,
      processedAt: arch.processedAt,
      rawTextNotes: arch.notes,
      imageUrl: arch.imageUrl,
      items: arch.items.map((i) => ({
        id: i.id,
        itemName: i.itemName,
        supplyUnitsReceived: i.supplyUnitsReceived,
        supplyUnit: i.supplyUnit,
        conversionRatio: i.conversionRatio || 1,
        retailUnitsAdded: i.retailUnitsAdded,
        retailUnit: i.retailUnit || "pieces",
        unitCostAtDelivery: i.unitCostAtDelivery,
        lineCost: i.lineCost,
        retailPrice: i.retailPrice,
        expectedMargin: i.expectedMargin || 0,
        approved: i.approved !== false
      }))
    });
    if (arch.imageUrl) {
      setActiveReceiptImage(arch.imageUrl);
    }
    setInspectingReceipt(null);
    setSuccessNote(`Loaded receipt ${arch.receiptNumber} back into review scanner!`);
    setTimeout(() => setSuccessNote(null), 4000);
  };

  // Calculate approved items and exact numeric metrics
  const approvedItems = activeReceipt ? activeReceipt.items.filter((i) => i.approved !== false) : [];
  const approvedTotalCost = approvedItems.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
  const approvedTotalRetail = approvedItems.reduce(
    (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
    0
  );
  const potentialProfit = Math.max(0, approvedTotalRetail - approvedTotalCost);
  const overallMarkup = approvedTotalCost > 0 ? ((potentialProfit / approvedTotalCost) * 100).toFixed(1) : "0.0";

  // Filtered receipts archive
  const filteredArchive = receiptsArchive.filter((r) => {
    if (archiveFilter === "approved") return r.status === "approved";
    if (archiveFilter === "rejected") return r.status === "rejected";
    return true;
  });

  return (
    <div className="space-y-5 max-w-6xl">
      
      {/* HEADER: SUPPLY-BASED STOCK PARADIGM */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Camera className="text-emerald-400" size={22} /> Supplier Receipt Scanner &amp; Ingestion
            </h2>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              Item-by-Item Approval
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Client approves each item for accurate details. Approved &amp; rejected receipts save to the database, clearing the scanner for new uploads.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 font-mono transition"
          >
            <Camera size={14} /> Take Photo / Upload Receipt Pic
          </button>
        </div>
      </div>

      {successNote && (
        <div className="p-3 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-md">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* SAMPLE TEST CHITS (INCLUDES 140 SUGAR + 280 OIL = 420 TOTAL) */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-400" /> Fast-Test Delivery Chits:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {SAMPLE_SUPPLIER_RECEIPTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="p-2.5 bg-[#0c0c0e] hover:bg-[#0f241a] border border-emerald-500/30 hover:border-emerald-400 rounded-xl text-left transition cursor-pointer text-xs group"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-white group-hover:text-emerald-300 transition truncate block text-[11px]">
                  {sample.label}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0">
                  {currency} {sample.mockData.totalCost.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                {sample.supplier}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE RECEIPT UNDER REVIEW (ITEM-BY-ITEM APPROVAL)                      */}
      {/* ========================================================================= */}
      {activeReceipt ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: RECEIPT PHOTO PREVIEW */}
          <div className="lg:col-span-5 bg-[#121214] border-2 border-emerald-950 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <ImageIcon size={14} className="text-cyan-400" /> Physical Receipt Photo
              </span>
              {isScanning && (
                <span className="text-[10px] font-mono text-amber-400 animate-pulse flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin" /> Scanning OCR...
                </span>
              )}
            </div>

            {/* Receipt Image Display */}
            <div className="relative bg-[#09090b] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center min-h-[320px] p-2">
              {activeReceiptImage ? (
                <img
                  src={activeReceiptImage}
                  alt="Uploaded Supplier Receipt"
                  className="max-h-[420px] w-auto object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 space-y-2">
                  <Camera size={32} className="mx-auto text-slate-600" />
                  <p className="text-xs">No receipt photo uploaded yet</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    Upload Receipt
                  </button>
                </div>
              )}

              {isScanning && (
                <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                  <Scan size={32} className="text-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    Multimodal Receipt Scanner Running...
                  </span>
                  <span className="text-[10px] text-slate-300">
                    Extracting goods, lots, and prices
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>OCR Accuracy: {((activeReceipt?.confidenceScore || 0.99) * 100).toFixed(0)}%</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer text-xs"
              >
                Upload Different Pic
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: STRUCTURED EXTRACTED INVENTORY MANIFEST */}
          <div className="lg:col-span-7 bg-[#121214] border-2 border-emerald-950 rounded-2xl p-4 shadow-xl space-y-4 flex flex-col justify-between">
            
            <div className="space-y-3.5">
              {/* INVOICE HEADER DETAILS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                    Supplier Delivery Manifest &bull; Client Approval
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                    {activeReceipt?.supplierName || "Supplier Delivery"}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {activeReceipt?.receiptNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                    {activeReceipt?.paymentMode}
                  </span>
                </div>
              </div>

              {/* EDITABLE RECEIPT / EXPENSE DATE SPACE */}
              <div className="p-2.5 bg-[#09090b] border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-amber-300">
                    Receipt Date:
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleUpdateReceiptDate(new Date().toISOString().slice(0, 10))}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                      handleUpdateReceiptDate(y);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 font-black cursor-pointer shadow-xs"
                    title="Doing yesterday's receipts today"
                  >
                    Yesterday
                  </button>
                  <input
                    type="date"
                    value={activeReceipt?.receiptDate && /^\d{4}-\d{2}-\d{2}$/.test(activeReceipt.receiptDate) ? activeReceipt.receiptDate : new Date().toISOString().slice(0, 10)}
                    onChange={(e) => handleUpdateReceiptDate(e.target.value)}
                    className="bg-[#0a1610] border border-amber-500/40 rounded-lg px-2 py-0.5 text-white font-mono text-xs focus:border-amber-400"
                  />
                </div>
              </div>

              {/* ITEM-BY-ITEM APPROVAL CONTROLS */}
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-[11px] uppercase">
                    Verify Line Items ({approvedItems.length} of {activeReceipt.items.length} Approved)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApproveAllItems}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare size={12} /> Approve All
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectAllItems}
                    className="text-[10px] text-slate-400 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Square size={12} /> Exclude All
                  </button>
                </div>
              </div>

              {/* EXTRACTED LINE ITEMS TABLE WITH STRICT NUMERICAL MATH */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {activeReceipt.items.map((item, idx) => {
                  const isApproved = item.approved !== false;
                  return (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                        isApproved
                          ? "bg-[#09090b] border-emerald-500/40"
                          : "bg-[#181112] border-slate-800 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 gap-2">
                        {/* APPROVAL CHECKBOX */}
                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => handleToggleItemApproval(item.id)}
                            className="cursor-pointer text-emerald-400 hover:text-emerald-300 shrink-0"
                            title={isApproved ? "Click to exclude item" : "Click to approve item"}
                          >
                            {isApproved ? (
                              <CheckSquare size={16} className="text-emerald-400" />
                            ) : (
                              <Square size={16} className="text-slate-500" />
                            )}
                          </button>
                          
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleUpdateItem(item.id, "itemName", e.target.value)}
                            className={`font-bold bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none w-full text-xs ${
                              isApproved ? "text-white" : "text-slate-400 line-through"
                            }`}
                          />
                        </div>

                        {activeReceipt.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-400 hover:text-red-300 text-[10px] cursor-pointer shrink-0 p-1"
                            title="Remove good"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1.5">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Wholesale Qty</span>
                          <div className="flex items-center gap-1 font-bold text-white mt-0.5">
                            <input
                              type="number"
                              step="any"
                              min={0}
                              value={item.supplyUnitsReceived}
                              onChange={(e) => handleUpdateItem(item.id, "supplyUnitsReceived", e.target.value)}
                              className="w-14 bg-[#111113] border border-slate-700 rounded px-1 text-center"
                            />
                            <span className="text-[10px] text-slate-400">{item.supplyUnit}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-cyan-400 block text-[9px] uppercase">Micro Retail Added</span>
                          <span className="font-bold text-cyan-300 block mt-0.5">
                            +{item.retailUnitsAdded} {item.retailUnit || "units"}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Line Cost (Strict Math)</span>
                          <div className="flex items-center gap-1 font-bold text-amber-400 mt-0.5">
                            <span>{currency}</span>
                            <input
                              type="number"
                              step="any"
                              min={0}
                              value={item.lineCost}
                              onChange={(e) => handleUpdateItem(item.id, "lineCost", e.target.value)}
                              className="w-16 bg-[#111113] border border-slate-700 rounded px-1 font-bold text-amber-400"
                            />
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Retail Price</span>
                          <div className="flex items-center gap-1 font-bold text-emerald-400 mt-0.5">
                            <span>{currency}</span>
                            <input
                              type="number"
                              step="any"
                              min={0}
                              value={item.retailPrice}
                              onChange={(e) => handleUpdateItem(item.id, "retailPrice", e.target.value)}
                              className="w-14 bg-[#111113] border border-slate-700 rounded px-1 font-bold text-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SUPPLY-BASED FINANCIAL IMPACT BANNER (STRICT NUMERICAL ADDITION: 140 + 280 = 420) */}
              <div className="p-3 bg-[#0e1612] border border-emerald-500/40 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Approved Items</span>
                  <strong className="text-white text-xs">
                    {approvedItems.length} Products
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Approved Total Cost</span>
                  <strong className="text-amber-400 text-sm">
                    {currency} {approvedTotalCost.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Shelf Value</span>
                  <strong className="text-cyan-400 text-xs">
                    +{currency} {approvedTotalRetail.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Markup %</span>
                  <strong className="text-emerald-400 text-xs">
                    +{currency} {potentialProfit.toLocaleString()} ({overallMarkup}%)
                  </strong>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: REJECT OR INGEST TO DATABASE */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <XCircle size={15} className="text-rose-400" />
                <span>Reject &amp; Save to Database</span>
              </button>

              <button
                type="button"
                onClick={handleCommitReceipt}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 font-mono transition"
              >
                <Check size={16} />
                <span>Approve &amp; Ingest to Database ({currency} {approvedTotalCost.toLocaleString()})</span>
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* SCANNER READY STATE (EMPTY SCANNER GIVING SPACE FOR NEW UPLOADS) */
        <div className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/60 bg-[#0c1410] rounded-2xl p-6 sm:p-8 text-center space-y-3 transition">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
            <Camera size={24} />
          </div>
          
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-white font-serif">
              Scanner is Ready for Next Delivery Receipt Photo
            </h3>
            <p className="text-xs text-slate-400">
              Worked-on and rejected receipts have been safely archived to the database below to give space for new uploads. Take a photo or upload your next delivery chit.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer font-mono"
            >
              <Upload size={14} />
              <span>Take Photo / Upload Pic</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSISTENT DATABASE ARCHIVE (WORKED-ON & REJECTED RECEIPTS)               */}
      {/* ========================================================================= */}
      <div className="bg-[#121214] border-2 border-emerald-950 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <FileText size={15} className="text-emerald-400" /> Persistent Receipts Database Archive
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                {receiptsArchive.length} Receipts
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All worked-on and rejected receipts stay safely in the database, freeing up active scanner space.
            </p>
          </div>

          {/* FILTER TABS */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setArchiveFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                archiveFilter === "all" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              All ({receiptsArchive.length})
            </button>
            <button
              type="button"
              onClick={() => setArchiveFilter("approved")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                archiveFilter === "approved" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Worked-On ({receiptsArchive.filter((r) => r.status === "approved").length})
            </button>
            <button
              type="button"
              onClick={() => setArchiveFilter("rejected")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                archiveFilter === "rejected" ? "bg-rose-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Rejected ({receiptsArchive.filter((r) => r.status === "rejected").length})
            </button>
          </div>
        </div>

        {filteredArchive.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs font-mono">
            No receipts matching filter &quot;{archiveFilter}&quot;.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredArchive.map((rcpt) => (
              <div 
                key={rcpt.id}
                className="p-3 bg-[#09090b] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{rcpt.supplierName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {rcpt.receiptNumber}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        rcpt.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {rcpt.status === "approved" ? "✓ WORKED-ON & APPROVED" : "✕ REJECTED"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {rcpt.receiptDate}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    {rcpt.status === "rejected" && rcpt.rejectionReason && (
                      <span className="text-rose-400 font-medium block">
                        Reason: {rcpt.rejectionReason}
                      </span>
                    )}
                    {(rcpt.items || []).map((i) => `${i.itemName} (${i.supplyUnitsReceived} ${i.supplyUnit})`).join(" • ") || "Logged delivery chit"}
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs shrink-0 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="font-bold text-amber-400">
                      {currency} {rcpt.totalCost.toLocaleString()} ({rcpt.paymentMode})
                    </div>
                    {rcpt.status === "approved" && (
                      <div className="text-[10px] text-emerald-400">
                        +{currency} {rcpt.totalPotentialProfit.toLocaleString()} margin
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInspectingReceipt(rcpt)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer"
                    >
                      Inspect
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReloadArchivedReceipt(rcpt)}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs rounded-lg cursor-pointer"
                      title="Load this receipt back into review scanner"
                    >
                      Re-open &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REJECT RECEIPT MODAL */}
      {isRejectModalOpen && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121214] border-2 border-rose-900 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle size={18} />
                <h3 className="font-bold text-white text-sm">
                  Reject &amp; Archive Receipt to Database
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300">
              This receipt ({activeReceipt.receiptNumber} from {activeReceipt.supplierName}) will be permanently marked as <strong>REJECTED</strong> and archived in your database. The active scanner will be cleared to give space for new uploads.
            </p>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-[11px]">
                Select or Type Reason for Rejection:
              </label>
              <div className="space-y-1.5">
                {[
                  "Incorrect pricing / mismatch with wholesale order",
                  "Damaged, missing, or spoiled goods at delivery",
                  "Duplicate delivery chit already entered",
                  "Blurry / unreadable handwritten chit"
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionReasonInput(reason)}
                    className={`w-full text-left p-2 rounded-xl border text-[11px] transition cursor-pointer ${
                      rejectionReasonInput === reason
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 font-semibold"
                        : "bg-[#09090b] border-slate-800 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    &bull; {reason}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Custom rejection reason..."
                className="w-full bg-[#09090b] border border-slate-700 rounded-xl p-2 text-xs text-white mt-2 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRejectReceipt(rejectionReasonInput)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Confirm Rejection &amp; Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT ARCHIVED RECEIPT MODAL */}
      {inspectingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121214] border-2 border-emerald-950 rounded-3xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 text-xs font-mono max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                      inspectingReceipt.status === "approved"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {inspectingReceipt.status === "approved" ? "Worked-On & Approved" : "Rejected"}
                  </span>
                  <span className="font-mono text-slate-400 text-xs">
                    {inspectingReceipt.receiptNumber}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {inspectingReceipt.supplierName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingReceipt(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* RECEIPT IMAGE IF AVAILABLE */}
            {inspectingReceipt.imageUrl && (
              <div className="p-2 bg-[#09090b] rounded-2xl flex items-center justify-center max-h-56 overflow-hidden border border-slate-800">
                <img
                  src={inspectingReceipt.imageUrl}
                  alt="Receipt full image"
                  className="max-h-52 w-auto object-contain rounded-lg"
                />
              </div>
            )}

            {inspectingReceipt.status === "rejected" && inspectingReceipt.rejectionReason && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300">
                <strong>Rejection Reason:</strong> {inspectingReceipt.rejectionReason}
              </div>
            )}

            {/* ITEMS BREAKDOWN */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Goods Manifest Breakdown ({inspectingReceipt.items?.length || 0} items)
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(inspectingReceipt.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-[#09090b] border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{item.itemName}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.supplyUnitsReceived} {item.supplyUnit} &bull; +{item.retailUnitsAdded} retail units
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-400">
                        {currency} {(Number(item.lineCost) || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        Retail: {currency} {item.retailPrice} / unit
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUMMARY NUMBERS */}
            <div className="p-3 bg-[#09090b] rounded-xl border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Total Cost</span>
                <strong className="text-amber-400">
                  {currency} {inspectingReceipt.totalCost.toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Shelf Value</span>
                <strong className="text-cyan-400">
                  {currency} {inspectingReceipt.totalRetailShelfValue.toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Potential Profit</span>
                <strong className="text-emerald-400">
                  +{currency} {inspectingReceipt.totalPotentialProfit.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleReloadArchivedReceipt(inspectingReceipt)}
                className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Re-load into Active Review &rarr;
              </button>
              <button
                type="button"
                onClick={() => setInspectingReceipt(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-200 font-semibold rounded-xl transition cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
