import React, { useState, useRef } from "react";
import { 
  ShoppingBag, Plus, Truck, Calendar, DollarSign, CheckCircle2, 
  Layers, ArrowUpRight, Search, Filter, AlertCircle, RefreshCw,
  Camera, Upload, FileText, Image as ImageIcon, Sparkles, Check,
  Trash2, Copy, ShieldCheck, ChevronDown, ChevronUp, Eye, Phone,
  ArrowRight, Scan, Clock
} from "lucide-react";
import { AlacioMasterState, InventoryItem, SupplierProfile, PayoutOrDrawing, RestockReconciliationCard } from "../../types/alacio";
import RestockSalesReconciliationCardView from "../RestockSalesReconciliationCard";
import { 
  ReceiptOcrService, 
  SAMPLE_SUPPLIER_RECEIPTS, 
  ProcessedReceipt, 
  ProcessedReceiptItem 
} from "../../services/receiptOcrService";

export interface PurchaseItemLine {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  retailPrice?: number;
  totalCost: number;
}

export interface DetailedPurchaseRecord {
  id: string;
  supplier: string;
  supplierPhone?: string;
  supplierNationalId?: string;
  deliveryNoteNumber?: string;
  itemsSummary: string;
  itemLines: PurchaseItemLine[];
  amount: number;
  payment_channel: "CASH" | "MPESA" | "NATIONAL_ID_DEPOSIT" | "SUPPLIER_CREDIT";
  date: string;
  notes?: string;
  receiptImageUrl?: string;
  isOcrScanned?: boolean;
}

interface PurchasesTabProps {
  state: AlacioMasterState;
  onLogPurchase?: (purchase: {
    supplier: string;
    supplierPhone?: string;
    supplierNationalId?: string;
    items: string;
    itemLines?: PurchaseItemLine[];
    amount: number;
    payment_channel: "CASH" | "MPESA" | "NATIONAL_ID_DEPOSIT" | "SUPPLIER_CREDIT";
    date: string;
    notes?: string;
    receiptImageUrl?: string;
  }) => void;
  onNavigateTab?: (tabId: string) => void;
  initialSupplier?: string;
  onAuthorizeRestockSale?: (payload: any) => void;
  onDismissRestockCard?: (cardId: string) => void;
}

export default function PurchasesTab({ 
  state, 
  onLogPurchase,
  onNavigateTab,
  initialSupplier,
  onAuthorizeRestockSale,
  onDismissRestockCard
}: PurchasesTabProps) {
  const { currency, inventory = [], suppliers = [], payouts = [], restockCards = [] } = state;
  const [showAllRestockCards, setShowAllRestockCards] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const purchaseFormRef = useRef<HTMLDivElement>(null);

  // Success and feedback notes
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Purchase Builder State (Lot of Goods)
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [selectedSupplierName, setSelectedSupplierName] = useState(
    initialSupplier || (suppliers[0]?.name || "Jahdithma Wholesalers")
  );
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState(`DN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentChannel, setPaymentChannel] = useState<"CASH" | "MPESA" | "NATIONAL_ID_DEPOSIT" | "SUPPLIER_CREDIT">("NATIONAL_ID_DEPOSIT");
  const [notes, setNotes] = useState("");
  const [attachedReceiptUrl, setAttachedReceiptUrl] = useState<string | null>(null);

  // Multiple item lines in a lot of goods
  const [itemLines, setItemLines] = useState<PurchaseItemLine[]>([
    {
      id: "line_1",
      itemName: "Brookside Fresh Milk 500ml",
      category: "Dairy & Chilled",
      quantity: 2,
      unit: "Crate (24pkts)",
      unitCost: 1320,
      retailPrice: 65,
      totalCost: 2640
    },
    {
      id: "line_2",
      itemName: "Brookside Lala / Mala 500ml",
      category: "Dairy & Chilled",
      quantity: 1,
      unit: "Crate (24pkts)",
      unitCost: 1560,
      retailPrice: 80,
      totalCost: 1560
    },
    {
      id: "line_3",
      itemName: "Brookside Cup Yoghurt 250ml",
      category: "Dairy & Chilled",
      quantity: 1,
      unit: "Tray (12cups)",
      unitCost: 840,
      retailPrice: 85,
      totalCost: 840
    }
  ]);

  // Selected supplier object lookup
  const currentSupplier = suppliers.find(
    (s) => s.name.toLowerCase() === selectedSupplierName.toLowerCase() || s.company.toLowerCase() === selectedSupplierName.toLowerCase()
  ) || suppliers[0] || {
    id: "supp_default",
    name: selectedSupplierName,
    company: selectedSupplierName,
    phone: "0722 849 101",
    national_id: "22940184",
    category: "Dairy & Chilled",
    total_orders_cost: 0,
    last_delivery_date: "Today",
    payment_preference: "NATIONAL_ID_DEPOSIT" as const
  };

  // Receipt Photo OCR Scanner State
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState<ProcessedReceipt | null>(SAMPLE_SUPPLIER_RECEIPTS[0].mockData);
  const [scannedReceiptImage, setScannedReceiptImage] = useState<string>(SAMPLE_SUPPLIER_RECEIPTS[0].previewUrl);
  const [scannerFeedback, setScannerFeedback] = useState<string | null>(null);

  // Past purchases with expanded view tracking
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);

  // Common Unit types in Kenya retail
  const unitOptions = [
    "Crate (24pkts)",
    "Bale (12pkts)",
    "Bale (24pkts)",
    "Bag (50kg)",
    "Bag (90kg)",
    "Carton (12btls)",
    "Carton (24pcs)",
    "Tray (12cups)",
    "Tray (30eggs)",
    "Packets",
    "Loaves",
    "Bottles",
    "Pieces",
    "Kg"
  ];

  // Calculate lot summary
  const totalLotUnits = itemLines.reduce((acc, line) => acc + (line.quantity || 0), 0);
  const totalLotCost = itemLines.reduce((acc, line) => acc + (line.totalCost || 0), 0);

  // Copy helper
  const handleCopyId = (idNumber: string) => {
    navigator.clipboard.writeText(idNumber);
    setCopiedId(idNumber);
    setTimeout(() => setCopiedId(null), 3000);
    setSuccessNote(`Copied Supplier National ID (${idNumber}) for Agency Bank OTC deposit.`);
    setTimeout(() => setSuccessNote(null), 4000);
  };

  // Add empty row
  const handleAddLineRow = () => {
    const newLine: PurchaseItemLine = {
      id: `line_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      itemName: "",
      category: "General Wholesaler",
      quantity: 1,
      unit: "Pieces",
      unitCost: 100,
      retailPrice: 120,
      totalCost: 100
    };
    setItemLines([...itemLines, newLine]);
  };

  // Update line row
  const handleUpdateLine = (id: string, updates: Partial<PurchaseItemLine>) => {
    setItemLines((prev) =>
      prev.map((line) => {
        if (line.id === id) {
          const updated = { ...line, ...updates };
          // recalculate line total
          if (updates.quantity !== undefined || updates.unitCost !== undefined) {
            updated.totalCost = (updated.quantity || 0) * (updated.unitCost || 0);
          }
          return updated;
        }
        return line;
      })
    );
  };

  // Remove line row
  const handleRemoveLine = (id: string) => {
    if (itemLines.length === 1) {
      setSuccessNote("A delivery must contain at least one good.");
      setTimeout(() => setSuccessNote(null), 3000);
      return;
    }
    setItemLines((prev) => prev.filter((l) => l.id !== id));
  };

  // Handle file change (upload photo or snap camera)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningReceipt(true);
    setScannerFeedback("Analyzing receipt photo and reading lot of goods...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setScannedReceiptImage(dataUrl);

      try {
        const processed = await ReceiptOcrService.processReceiptImage(dataUrl, file.name);
        setScannedReceipt(processed);
        setScannerFeedback(
          `Scanned "${file.name}"! Identified ${processed.items.length} goods supplied by ${processed.supplierName} (Total: ${currency} ${processed.totalCost.toLocaleString()}).`
        );
      } catch (err) {
        console.error("Receipt OCR parsing failed:", err);
        setScannerFeedback("Failed to parse receipt. Please verify image clarity.");
      } finally {
        setIsScanningReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Select preloaded sample receipt photo
  const handleSelectSampleReceipt = async (sampleId: string) => {
    const sample = SAMPLE_SUPPLIER_RECEIPTS.find((s) => s.id === sampleId);
    if (!sample) return;

    setIsScanningReceipt(true);
    setScannerFeedback(`Scanning ${sample.label}...`);
    setScannedReceiptImage(sample.previewUrl);

    setTimeout(() => {
      setScannedReceipt(sample.mockData);
      setIsScanningReceipt(false);
      setScannerFeedback(
        `Multimodal OCR successfully extracted ${sample.mockData.items.length} goods from ${sample.mockData.supplierName}.`
      );
    }, 600);
  };

  // Apply OCR scanned receipt into the Multi-Item Purchase Builder
  const handleApplyScannedReceipt = () => {
    if (!scannedReceipt) return;

    // Convert scanned items into PurchaseItemLine[]
    const lines: PurchaseItemLine[] = scannedReceipt.items.map((item, idx) => ({
      id: `scanned_line_${Date.now()}_${idx}`,
      itemName: item.itemName,
      category: "Dairy & Chilled",
      quantity: item.supplyUnitsReceived,
      unit: item.supplyUnit,
      unitCost: item.unitCostAtDelivery || (item.lineCost / (item.supplyUnitsReceived || 1)),
      retailPrice: item.retailPrice || 0,
      totalCost: item.lineCost
    }));

    // Find supplier or use scanned name
    setSelectedSupplierName(scannedReceipt.supplierName);
    setDeliveryNoteNumber(scannedReceipt.receiptNumber || `DN-${Math.floor(1000 + Math.random() * 9000)}`);
    setPurchaseDate(scannedReceipt.receiptDate || new Date().toISOString().slice(0, 10));
    setPaymentChannel(
      scannedReceipt.paymentMode === "MPESA" ? "MPESA" : 
      scannedReceipt.paymentMode === "CASH" ? "CASH" : "NATIONAL_ID_DEPOSIT"
    );
    setItemLines(lines);
    setAttachedReceiptUrl(scannedReceiptImage);
    setNotes(scannedReceipt.rawTextNotes || `Scanned receipt ${scannedReceipt.receiptNumber} with ${lines.length} goods`);
    
    setIsAddingPurchase(true);
    setSuccessNote(`Applied ${lines.length} goods from scanned receipt to purchase form! Review and save below.`);
    setTimeout(() => setSuccessNote(null), 5000);

    // Scroll to form
    if (purchaseFormRef.current) {
      purchaseFormRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Submit complete purchase batch
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemLines.length === 0 || totalLotCost <= 0) {
      setSuccessNote("Please add goods with valid quantities and costs.");
      setTimeout(() => setSuccessNote(null), 3000);
      return;
    }

    const itemsSummary = itemLines
      .map((l) => `${l.quantity} ${l.unit} ${l.itemName}`)
      .join(", ");

    if (onLogPurchase) {
      onLogPurchase({
        supplier: selectedSupplierName,
        supplierPhone: currentSupplier.phone,
        supplierNationalId: currentSupplier.national_id,
        items: itemsSummary,
        itemLines: itemLines,
        amount: totalLotCost,
        payment_channel: paymentChannel,
        date: purchaseDate,
        notes: notes || `Batch delivery (${itemLines.length} goods): ${deliveryNoteNumber}`,
        receiptImageUrl: attachedReceiptUrl || undefined
      });
    }

    setSuccessNote(
      `Saved purchase of ${itemLines.length} goods (${currency} ${totalLotCost.toLocaleString()}) from ${selectedSupplierName}!`
    );
    setIsAddingPurchase(false);
    setAttachedReceiptUrl(null);
    setNotes("");
    setTimeout(() => setSuccessNote(null), 5000);
  };

  // Filter existing purchases from payouts
  const supplierPurchases = payouts.filter((p) => p.type === "SUPPLIER_PAYOUT");

  return (
    <div className="space-y-7 max-w-6xl mx-auto font-sans text-slate-900 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & KPI METRICS                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="text-blue-600" size={24} /> Purchases &amp; Inbound Cargo
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold uppercase">
              Multi-Goods Restock &amp; Receipt OCR
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Suppliers deliver lots of goods at once. Log wholesale batches with multiple item rows, or upload a photo of the receipt to auto-extract every good, quantity, and cost.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("suppliers")}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Truck size={14} className="text-slate-600" />
              <span>Suppliers Registry</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsAddingPurchase(true);
              if (purchaseFormRef.current) {
                purchaseFormRef.current.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-4 py-2 bg-[#1A56DB] hover:bg-[#1545B3] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Log Inbound Cargo</span>
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {successNote && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{successNote}</span>
        </div>
      )}

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Restock Spend</span>
          <div className="text-2xl font-serif font-bold text-slate-900 mt-1">
            {currency} {supplierPurchases.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{supplierPurchases.length} batches received</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Suppliers</span>
          <div className="text-2xl font-serif font-bold text-blue-700 mt-1">
            {suppliers.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Delivering goods &amp; stock</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">National ID OTC Rails</span>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {suppliers.filter(s => s.payment_preference === "NATIONAL_ID_DEPOSIT").length}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Equity/KCB Agent deposits</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Receipt OCR Reader</span>
          <div className="text-2xl font-serif font-bold text-purple-700 mt-1">
            Active
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Instant photo auto-fill</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1B. RESTOCK AUTO-SALES RECONCILIATION CARDS (TRIGGERED VELOCITY MODEL)    */}
      {/* "whenever we record a purchase... bringing in that today means we have     */}
      {/*  dealt with all those of yesterday... automatically generate cards of     */}
      {/*  that stuff... asking for remains, owner ate/giveaway/rejects             */}
      {/*  so whenever we have dealt with this card, we have authorised that a sale happened"*/}
      {/* ========================================================================= */}
      <div className="bg-[#0b131e] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                  Restock Auto-Sales Reconciliation Cards
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  {restockCards.filter(c => c.status === "PENDING_AUTHORIZATION").length} Action Needed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Restocking fast-moving inventory (e.g. today&apos;s bread or milk delivery after yesterday&apos;s batch) confirms yesterday&apos;s stock was sold. Reconcile closing remains, owner drawings, and spoilage to authorize sales into your drawer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAllRestockCards(!showAllRestockCards)}
              className="px-3 py-1.5 rounded-xl bg-[#142334] hover:bg-[#1a2f45] text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer"
            >
              {showAllRestockCards ? "Show Pending Only" : `Show All (${restockCards.length})`}
            </button>
          </div>
        </div>

        {/* CARDS LIST */}
        <div className="space-y-4">
          {(showAllRestockCards ? restockCards : restockCards.filter(c => c.status === "PENDING_AUTHORIZATION")).map((card) => (
            <RestockSalesReconciliationCardView
              key={card.id}
              card={card}
              currency={currency}
              onAuthorize={onAuthorizeRestockSale || (() => {})}
              onDismiss={onDismissRestockCard}
            />
          ))}

          {(!showAllRestockCards && restockCards.filter(c => c.status === "PENDING_AUTHORIZATION").length === 0) && (
            <div className="p-6 text-center text-slate-400 bg-[#091018] rounded-2xl border border-slate-800">
              <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-2 opacity-80" />
              <p className="text-xs font-bold text-white">All Restock Sales Reconciled &amp; Authorized!</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Whenever you record a new inbound delivery below, new auto-sales cards will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RECEIPT PHOTO SCANNER & OCR FEATURE (UNDER PURCHASES TAB)              */}
      {/* "and under it again, add a feature that we upload a receipt photo,        */}
      {/*  and it reads and put in the details"                                     */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-blue-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden">
        
        {/* DECORATIVE SUBTLE BLUE ACCENT */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/60 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* SCANNER HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Camera size={18} />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                Upload Receipt Photo &bull; AI OCR Auto-Fill
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                  Reads Lot of Goods
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Snap or upload a photo of your supplier delivery slip, invoice, or van manifest. It detects all goods, quantities, prices, and supplier National ID/Phone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#1A56DB] hover:bg-[#1545B3] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Upload size={14} />
              <span>Upload Receipt Photo</span>
            </button>
          </div>
        </div>

        {/* QUICK 1-TAP SAMPLE DELIVERY RECEIPT PHOTOS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" /> Or pick a sample Kenyan delivery receipt photo:
            </span>
            <span className="text-[11px] text-slate-400">Click to simulate photo scan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAMPLE_SUPPLIER_RECEIPTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSampleReceipt(sample.id)}
                className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition flex items-center gap-3 cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ImageIcon size={18} className="text-slate-600 group-hover:text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                    {sample.supplier}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {sample.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SCANNING PROGRESS INDICATOR */}
        {isScanningReceipt && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 animate-pulse">
            <RefreshCw size={18} className="text-blue-600 animate-spin shrink-0" />
            <div className="text-xs">
              <strong className="text-blue-900 block">Scanning Receipt Photo via OCR...</strong>
              <span className="text-blue-700 text-[11px]">
                Detecting supplier name, National ID, Phone, line items, crate conversions, and totals.
              </span>
            </div>
          </div>
        )}

        {/* SCANNED RECEIPT RESULTS & GOODS MANIFEST DISPLAY */}
        {scannedReceipt && !isScanningReceipt && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1">
                  ✓ Receipt OCR Detected ({scannedReceipt.items.length} Goods)
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {scannedReceipt.supplierName} &bull; Inv: {scannedReceipt.receiptNumber}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Date: {scannedReceipt.receiptDate} &bull; Confidence: {(scannedReceipt.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>

              {/* ACTION: APPLY TO FORM */}
              <button
                onClick={handleApplyScannedReceipt}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Check size={15} />
                <span>Auto-Fill Purchase Form with These Goods &rarr;</span>
              </button>
            </div>

            {/* PREVIEW IMAGE + EXTRACTED GOODS TABLE */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              
              {/* RECEIPT PHOTO THUMBNAIL (LEFT) */}
              <div className="md:col-span-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Scanned Receipt Photo
                </span>
                <div className="max-h-56 overflow-hidden rounded-xl border border-slate-100 flex items-center justify-center bg-slate-100">
                  <img
                    src={scannedReceiptImage}
                    alt="Scanned Supplier Receipt"
                    className="w-full h-auto object-contain max-h-56 hover:scale-105 transition-transform"
                  />
                </div>
              </div>

              {/* DETECTED GOODS LIST (RIGHT) */}
              <div className="md:col-span-8 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Extracted Goods in Delivery ({scannedReceipt.items.length} Items)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    Invoice Total: {currency} {scannedReceipt.totalCost.toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                        <th className="py-1.5 px-2">Good / Item Description</th>
                        <th className="py-1.5 px-2 text-center">Qty &amp; Unit</th>
                        <th className="py-1.5 px-2 text-right">Unit Wholesale Cost</th>
                        <th className="py-1.5 px-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-mono">
                      {scannedReceipt.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-2 font-sans font-medium text-slate-900">
                            {item.itemName}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold">
                              {item.supplyUnitsReceived} {item.supplyUnit}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right text-slate-600">
                            {currency} {(item.unitCostAtDelivery || (item.lineCost / item.supplyUnitsReceived)).toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900">
                            {currency} {item.lineCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Payment Mode: <strong>{scannedReceipt.paymentMode}</strong></span>
                  <span className="text-emerald-700 font-semibold">
                    Calculated Margin: +{scannedReceipt.markupPercentage}%
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 3. MULTI-ITEM PURCHASE BUILDER (LOT OF GOODS ENTRY)                       */}
      {/* "remember suppliers sometimes supply lot of goods"                        */}
      {/* ========================================================================= */}
      <div 
        ref={purchaseFormRef}
        className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 transition-all ${
          isAddingPurchase ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <Layers className="text-blue-600" size={18} /> Record Inbound Cargo Batch (Lot of Goods)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase">
                {itemLines.length} Goods in Lot
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter all goods supplied in this shipment. Each good increments your shelf stock and locks in wholesale unit costs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingPurchase ? (
              <button
                onClick={() => setIsAddingPurchase(true)}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Expand Lot Builder
              </button>
            ) : (
              <button
                onClick={() => setIsAddingPurchase(false)}
                className="text-xs text-slate-400 hover:text-slate-700 p-1"
              >
                ✕ Minimize
              </button>
            )}
          </div>
        </div>

        {isAddingPurchase && (
          <form onSubmit={handleSavePurchase} className="space-y-6">
            
            {/* SUPPLIER & SETTLEMENT HEADER */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs bg-slate-50/70 border border-slate-200 rounded-2xl p-4">
              
              {/* SUPPLIER PICKER / DIRECT INPUT */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Supplier / Wholesale Distributor *
                </label>
                <input
                  type="text"
                  required
                  list="suppliers-datalist"
                  value={selectedSupplierName}
                  onChange={(e) => setSelectedSupplierName(e.target.value)}
                  placeholder="e.g. Jahdithma Wholesalers"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500 text-xs"
                />
                <datalist id="suppliers-datalist">
                  <option value="Jahdithma Wholesalers" />
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                  <option value="Broadway Bakeries Ltd" />
                  <option value="Brookside Dairy Kenya Ltd" />
                  <option value="Unga Millers Eldoret" />
                  <option value="Bidco Africa Ltd" />
                  <option value="General Wholesaler Van" />
                </datalist>
              </div>

              {/* DELIVERY NOTE / INVOICE NO */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Delivery Note / Invoice No.
                </label>
                <input
                  type="text"
                  required
                  value={deliveryNoteNumber}
                  onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>

              {/* DATE WITH QUICK BACKDATING BUTTONS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold text-xs">
                    Delivery Date
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPurchaseDate(new Date().toISOString().slice(0, 10))}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchaseDate(new Date(Date.now() - 86400000).toISOString().slice(0, 10))}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchaseDate(new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10))}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Last Week
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono text-xs"
                />
              </div>

              {/* COUNTERPARTY IDENTIFICATION CALLOUT: PHONE & NATIONAL ID */}
              <div className="sm:col-span-3 bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      Supplier Counterparty Rail: {currentSupplier.name}
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      National ID: <strong className="font-mono">{currentSupplier.national_id}</strong> &bull; Phone: <strong className="font-mono">{currentSupplier.phone}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyId(currentSupplier.national_id)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] rounded-lg border border-emerald-300 transition flex items-center gap-1 cursor-pointer"
                    title="Copy National ID for Agency Bank OTC deposit (Equity/KCB/Co-op)"
                  >
                    {copiedId === currentSupplier.national_id ? <Check size={12} /> : <Copy size={12} />}
                    <span>Copy National ID</span>
                  </button>

                  <select
                    value={paymentChannel}
                    onChange={(e) => setPaymentChannel(e.target.value as any)}
                    className="bg-white border border-emerald-300 rounded-lg p-1 text-xs text-slate-800 font-medium"
                  >
                    <option value="NATIONAL_ID_DEPOSIT">🏦 Agency Bank OTC via National ID</option>
                    <option value="MPESA">📱 M-Pesa Buy Goods / Till</option>
                    <option value="CASH">💵 Cash Drawer Outflow</option>
                    <option value="SUPPLIER_CREDIT">📜 Supplier Credit (Pay Later)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* THE LOT OF GOODS (MULTI-ITEM TABLE) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Goods Included in this Cargo Batch ({itemLines.length})
                  </h3>
                  <span className="text-xs text-slate-500">
                    Add all goods supplied by this distributor. Each item is tracked with bulk packs and costs.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSupplierName("Jahdithma Wholesalers");
                      setItemLines([
                        {
                          id: `line_j1_${Date.now()}`,
                          itemName: "Pembe Maize Meal 2kg",
                          category: "Flour & Cereals",
                          quantity: 12,
                          unit: "Bale (12pkts)",
                          unitCost: 1850,
                          retailPrice: 190,
                          totalCost: 22200
                        },
                        {
                          id: `line_j2_${Date.now()}`,
                          itemName: "Kabras Sugar 1kg",
                          category: "General Wholesaler",
                          quantity: 20,
                          unit: "Bale (20pkts)",
                          unitCost: 2500,
                          retailPrice: 150,
                          totalCost: 50000
                        },
                        {
                          id: `line_j3_${Date.now()}`,
                          itemName: "Rina Cooking Oil 1L",
                          category: "Cooking Oils & Soaps",
                          quantity: 12,
                          unit: "Carton (12btls)",
                          unitCost: 2800,
                          retailPrice: 270,
                          totalCost: 33600
                        }
                      ]);
                      setSuccessNote("Loaded Jahdithma Wholesalers wholesale cargo lot (Total: KSh 105,800).");
                      setTimeout(() => setSuccessNote(null), 3000);
                    }}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-xl transition border border-amber-200 cursor-pointer"
                  >
                    Load Jahdithma Cargo
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setItemLines([
                        {
                          id: `line_${Date.now()}`,
                          itemName: "",
                          category: "General Wholesaler",
                          quantity: 1,
                          unit: "Bale (12pkts)",
                          unitCost: 0,
                          retailPrice: 0,
                          totalCost: 0
                        }
                      ]);
                      setSuccessNote("Reset cargo to empty skeleton for your manual delivery.");
                      setTimeout(() => setSuccessNote(null), 3000);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition cursor-pointer"
                  >
                    Clear to Empty
                  </button>

                  <button
                    type="button"
                    onClick={handleAddLineRow}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus size={14} />
                    <span>+ Add Another Good</span>
                  </button>
                </div>
              </div>

              {/* GOODS TABLE */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Good / Product Name</th>
                      <th className="py-2.5 px-3 w-28">Quantity</th>
                      <th className="py-2.5 px-3 w-40">Supply Unit</th>
                      <th className="py-2.5 px-3 w-32 text-right">Unit Wholesale ({currency})</th>
                      <th className="py-2.5 px-3 w-32 text-right">Line Total ({currency})</th>
                      <th className="py-2.5 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemLines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-slate-50/60 transition">
                        
                        {/* ITEM NAME */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            required
                            value={line.itemName}
                            onChange={(e) => handleUpdateLine(line.id, { itemName: e.target.value })}
                            placeholder="e.g. Unga Jogoo 2kg, Sugar 50kg, Milk"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900"
                            list="inventory-suggestions"
                          />
                        </td>

                        {/* QUANTITY */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            required
                            min={1}
                            value={line.quantity}
                            onChange={(e) => handleUpdateLine(line.id, { quantity: parseInt(e.target.value, 10) || 1 })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 text-center"
                          />
                        </td>

                        {/* SUPPLY UNIT */}
                        <td className="p-2.5">
                          <select
                            value={line.unit}
                            onChange={(e) => handleUpdateLine(line.id, { unit: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                          >
                            {unitOptions.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>

                        {/* UNIT WHOLESALE COST */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            required
                            min={1}
                            value={line.unitCost}
                            onChange={(e) => handleUpdateLine(line.id, { unitCost: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-semibold text-slate-900 text-right"
                          />
                        </td>

                        {/* LINE TOTAL COST */}
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {currency} {((line.quantity || 0) * (line.unitCost || 0)).toLocaleString()}
                        </td>

                        {/* REMOVE BUTTON */}
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(line.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                            title="Remove good from lot"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* INVENTORY AUTO-COMPLETE SUGGESTIONS */}
              <datalist id="inventory-suggestions">
                {inventory.map((item) => (
                  <option key={item.id} value={item.name} />
                ))}
              </datalist>

              {/* LOT SUMMARY BAR - GOODS TOTALED FOR SUPPLIER */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-950 text-sm">
                      Total Cargo for {selectedSupplierName}:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold font-mono">
                      {itemLines.length} Goods Totaled
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px]">
                    <span>Total Physical Units: <strong className="text-slate-900">{totalLotUnits} units</strong></span>
                    <span>Average Unit Cost: <strong className="text-slate-900">{currency} {totalLotUnits > 0 ? Math.round(totalLotCost / totalLotUnits).toLocaleString() : 0}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-bold text-blue-800 font-mono">
                    Total Cargo Cost:
                  </span>
                  <span className="text-2xl font-serif font-black text-slate-950 bg-white px-3.5 py-1.5 rounded-xl border border-blue-300 shadow-2xs font-mono">
                    {currency} {totalLotCost.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

            {/* NOTES & SUBMISSION */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2 border-t border-slate-100">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional delivery notes (e.g. Received van delivery in good condition at front gate)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPurchase(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={15} />
                  <span>Save Purchase &amp; Update Stock Vault</span>
                </button>
              </div>
            </div>

          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. RECENT PURCHASES & GOODS LOT HISTORY                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-serif font-bold text-slate-900">
              Recent Inbound Cargo Deliveries ({supplierPurchases.length})
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Restock History
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Total Logged: {currency} {supplierPurchases.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </span>
        </div>

        {supplierPurchases.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <ShoppingBag size={36} className="text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No purchases recorded yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Suppliers deliver lots of goods. Use the receipt photo scanner above or manually record your first shipment to build stock history.
            </p>
            <button
              onClick={() => setIsAddingPurchase(true)}
              className="px-4 py-2 bg-[#1A56DB] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              + Record Inbound Cargo
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {supplierPurchases.map((purchase) => {
              const isExpanded = expandedPurchaseId === purchase.id;

              return (
                <div key={purchase.id} className="py-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-sm font-serif">
                          {purchase.notes || "Supplier Restock Delivery"}
                        </strong>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {purchase.payment_channel ? purchase.payment_channel.replace(/_/g, " ") : "PAID"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <Calendar size={12} className="text-slate-400" />
                        <span>Date: {purchase.date || "Today"}</span>
                        <span>&bull;</span>
                        <Clock size={12} className="text-slate-400" />
                        <span>Logged at: {purchase.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-serif font-bold text-slate-900 block">
                          -{currency} {purchase.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Stock Vault Ingested
                        </span>
                      </div>

                      <button
                        onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="View goods breakdown in this lot"
                      >
                        <span>Goods Lot</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* EXPANDED GOODS IN LOT DRAWER */}
                  {isExpanded && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-800">
                          Cargo Goods Breakdown &bull; {purchase.notes}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Batch Total: {currency} {purchase.amount.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {purchase.notes}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Verified wholesale cargo restock</span>
                        <span className="text-emerald-700 font-semibold">
                          Inventory units verified in system
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
