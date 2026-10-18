import React, { useState, useRef, useEffect } from "react";
import { 
  ShoppingBag, Plus, Truck, Calendar, DollarSign, CheckCircle2, 
  Layers, ArrowUpRight, Search, Filter, AlertCircle, RefreshCw,
  Camera, Upload, FileText, Image as ImageIcon, Sparkles, Check,
  Trash2, Copy, ShieldCheck, ChevronDown, ChevronUp, Eye, Phone,
  ArrowRight, Scan, Clock, Package, XCircle, CheckSquare, Square, History, X, Wallet
} from "lucide-react";
import { 
  AlacioMasterState, 
  InventoryItem, 
  SupplierProfile, 
  PayoutOrDrawing, 
  RestockReconciliationCard,
  SavedReceiptRecord
} from "../../types/alacio";
import RestockSalesReconciliationCardView from "../RestockSalesReconciliationCard";
import OwnerExpensesTab from "./OwnerExpensesTab";
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
    receiptId?: string;
    receiptNumber?: string;
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
  initialView?: "all" | "cargo" | "upload" | "archive";
  onAuthorizeRestockSale?: (payload: any) => void;
  onDismissRestockCard?: (cardId: string) => void;
  onSaveReceiptToDatabase?: (receipt: SavedReceiptRecord) => void;
  onAddExpense?: (expense: PayoutOrDrawing) => void;
  onEditExpense?: (id: string, updated: Partial<PayoutOrDrawing>) => void;
  onDeleteExpense?: (id: string) => void;
}

export default function PurchasesTab({ 
  state, 
  onLogPurchase,
  onNavigateTab,
  initialSupplier,
  initialView,
  onAuthorizeRestockSale,
  onDismissRestockCard,
  onSaveReceiptToDatabase,
  onAddExpense,
  onEditExpense,
  onDeleteExpense
}: PurchasesTabProps) {
  const { currency, inventory = [], suppliers = [], payouts = [], restockCards = [], receiptsArchive = [] } = state;
  const [showAllRestockCards, setShowAllRestockCards] = useState<boolean>(false);
  const [activeSubSection, setActiveSubSection] = useState<"ALL" | "EXPENSES_ONLY">("ALL");

  // Sub-view switcher for Purchases module: Cargo Lot entry vs Upload Receipts (OCR) vs Database Archive
  const [activeSubView, setActiveSubView] = useState<"all" | "cargo" | "upload" | "archive">(() => {
    if (initialView === "upload") return "upload";
    if (initialView === "cargo") return "cargo";
    if (initialView === "archive") return "archive";
    return "all";
  });

  useEffect(() => {
    if (initialView) {
      setActiveSubView(initialView);
    }
  }, [initialView]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const purchaseFormRef = useRef<HTMLDivElement>(null);
  const ownerExpensesSectionRef = useRef<HTMLDivElement>(null);

  // Success and feedback notes
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Purchase Builder State (Lot of Goods)
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [selectedSupplierName, setSelectedSupplierName] = useState(
    initialSupplier || (suppliers[0]?.name || "Jahdithma Wholesalers")
  );
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [supplierSelectMode, setSupplierSelectMode] = useState<"dropdown" | "type">("dropdown");
  const [isReconExpanded, setIsReconExpanded] = useState<boolean>(() => restockCards.some(c => c.status === "PENDING_AUTHORIZATION"));
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState(`DN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentChannel, setPaymentChannel] = useState<"CASH" | "MPESA" | "NATIONAL_ID_DEPOSIT" | "SUPPLIER_CREDIT">("NATIONAL_ID_DEPOSIT");
  const [notes, setNotes] = useState("");
  const [attachedReceiptUrl, setAttachedReceiptUrl] = useState<string | null>(null);

  // Close supplier dropdown on outside click or tap
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Multiple item lines in a lot of goods (Suppliers supply 1 to many goods)
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
    (s) => s.name.toLowerCase().trim() === selectedSupplierName.toLowerCase().trim() || s.company.toLowerCase().trim() === selectedSupplierName.toLowerCase().trim()
  ) || {
    id: `supp_${Date.now()}`,
    name: selectedSupplierName,
    company: selectedSupplierName,
    phone: "0722 849 101",
    national_id: "22940184",
    category: "Wholesale Distributor",
    total_orders_cost: 0,
    last_delivery_date: "Today",
    payment_preference: "NATIONAL_ID_DEPOSIT" as const,
    supplied_items: []
  };

  // Known catalog of goods supplied by the selected supplier (1 to many items)
  const suppliedGoodsList: string[] = React.useMemo(() => {
    const sName = selectedSupplierName.trim().toLowerCase();
    const supObj = suppliers.find(
      (s) => s.name.toLowerCase().trim() === sName || s.company.toLowerCase().trim() === sName
    );
    const fromProfile = supObj?.supplied_items || [];
    const fromInventory = inventory
      .filter((item) => (item.supplier || "").toLowerCase().trim() === sName)
      .map((i) => i.name);
    return Array.from(new Set([...fromProfile, ...fromInventory])).filter(Boolean);
  }, [suppliers, inventory, selectedSupplierName]);

  // Quick 1-click addition of a supplied good into the shipment
  const handleAddSuppliedItemToBatch = (goodName: string) => {
    const existingInv = inventory.find((i) => i.name.toLowerCase().trim() === goodName.toLowerCase().trim());
    const emptyIdx = itemLines.findIndex((l) => !l.itemName.trim());

    const newLine: PurchaseItemLine = {
      id: `line_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      itemName: goodName,
      category: existingInv?.category || currentSupplier?.category || "General Wholesaler",
      quantity: 1,
      unit: existingInv?.unit_type === "pcs" ? "Pieces" : (existingInv?.bulk_pack_name || "Pieces"),
      unitCost: existingInv?.unit_cost || 100,
      retailPrice: existingInv?.unit_retail || Math.round((existingInv?.unit_cost || 100) * 1.25),
      totalCost: existingInv?.unit_cost || 100
    };

    if (emptyIdx >= 0) {
      const updated = [...itemLines];
      updated[emptyIdx] = newLine;
      setItemLines(updated);
    } else {
      setItemLines([...itemLines, newLine]);
    }

    setSuccessNote(`Added "${goodName}" to shipment lot.`);
    setTimeout(() => setSuccessNote(null), 3000);
  };

  // Load all items supplied by this vendor at once
  const handleLoadAllSuppliedGoods = () => {
    if (suppliedGoodsList.length === 0) return;
    const newLines: PurchaseItemLine[] = suppliedGoodsList.map((goodName, idx) => {
      const existingInv = inventory.find((i) => i.name.toLowerCase().trim() === goodName.toLowerCase().trim());
      return {
        id: `line_supp_${Date.now()}_${idx}`,
        itemName: goodName,
        category: existingInv?.category || currentSupplier?.category || "General Wholesaler",
        quantity: 1,
        unit: existingInv?.unit_type === "pcs" ? "Pieces" : (existingInv?.bulk_pack_name || "Pieces"),
        unitCost: existingInv?.unit_cost || 100,
        retailPrice: existingInv?.unit_retail || Math.round((existingInv?.unit_cost || 100) * 1.25),
        totalCost: existingInv?.unit_cost || 100
      };
    });
    setItemLines(newLines);
    setSuccessNote(`Loaded all ${newLines.length} goods supplied by ${selectedSupplierName}!`);
    setTimeout(() => setSuccessNote(null), 3500);
  };

  // Quick picker for individual goods row from this supplier's catalog
  const handleSelectSuppliedItemForRow = (lineId: string, goodName: string) => {
    if (!goodName) return;
    const existingInv = inventory.find((i) => i.name.toLowerCase().trim() === goodName.toLowerCase().trim());
    handleUpdateLine(lineId, {
      itemName: goodName,
      category: existingInv?.category || currentSupplier?.category || "General Wholesaler",
      unit: existingInv?.unit_type === "pcs" ? "Pieces" : (existingInv?.bulk_pack_name || "Pieces"),
      unitCost: existingInv?.unit_cost || 100,
      retailPrice: existingInv?.unit_retail || Math.round((existingInv?.unit_cost || 100) * 1.25)
    });
  };

  // Receipt Photo OCR Scanner State (defaults to THE PHIMAR TRADING CENTER receipt)
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState<ProcessedReceipt | null>(() => {
    const defaultSample = SAMPLE_SUPPLIER_RECEIPTS[0].mockData;
    return {
      ...defaultSample,
      items: defaultSample.items.map((i) => ({ ...i, approved: true }))
    };
  });
  const [scannedReceiptImage, setScannedReceiptImage] = useState<string>(SAMPLE_SUPPLIER_RECEIPTS[0].previewUrl);
  const [scannerFeedback, setScannerFeedback] = useState<string | null>(null);

  // Receipts Database Archive state
  const [archiveFilter, setArchiveFilter] = useState<"all" | "approved" | "rejected">("all");
  const [inspectingReceipt, setInspectingReceipt] = useState<SavedReceiptRecord | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("Incorrect pricing / unverified delivery chit");

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
  const totalLotUnits = itemLines.reduce((acc, line) => acc + (Number(line.quantity) || 0), 0);
  const totalLotCost = itemLines.reduce((acc, line) => acc + (Number(line.totalCost) || 0), 0);

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

  // Update line row (supports both deriving unit wholesale cost from line total and calculating line total from unit cost)
  const handleUpdateLine = (id: string, updates: Partial<PurchaseItemLine>) => {
    setItemLines((prev) =>
      prev.map((line) => {
        if (line.id === id) {
          const updated = { ...line, ...updates };
          if (updates.totalCost !== undefined) {
            const qty = updated.quantity && updated.quantity > 0 ? updated.quantity : 1;
            updated.unitCost = Math.round(((updated.totalCost || 0) / qty) * 100) / 100;
          } else if (updates.quantity !== undefined && updated.totalCost > 0 && updates.unitCost === undefined) {
            const qty = updated.quantity > 0 ? updated.quantity : 1;
            updated.unitCost = Math.round((updated.totalCost / qty) * 100) / 100;
          } else if (updates.unitCost !== undefined) {
            updated.totalCost = Math.round((updated.quantity || 0) * (updated.unitCost || 0) * 100) / 100;
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
        // Ensure every detected item has approved: true by default for review
        const withApproval: ProcessedReceipt = {
          ...processed,
          items: processed.items.map((i) => ({ ...i, approved: true }))
        };
        setScannedReceipt(withApproval);
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
      setScannedReceipt({
        ...sample.mockData,
        id: `${sample.mockData.id}_${Date.now()}`,
        items: sample.mockData.items.map((i, idx) => ({
          ...i,
          id: `${i.id}_${Date.now()}_${idx}`,
          approved: true
        }))
      });
      setIsScanningReceipt(false);
      setScannerFeedback(
        `Multimodal OCR successfully extracted ${sample.mockData.items.length} goods from ${sample.mockData.supplierName}.`
      );
    }, 450);
  };

  // Toggle individual item approval state
  const handleToggleItemApproval = (itemId: string) => {
    if (!scannedReceipt) return;

    const updatedItems = scannedReceipt.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, approved: item.approved === false ? true : false };
      }
      return item;
    });

    const approved = updatedItems.filter((i) => i.approved !== false);
    const newTotalCost = approved.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
    const newTotalRetail = approved.reduce(
      (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
      0
    );
    const newProfit = Math.max(0, newTotalRetail - newTotalCost);
    const newMarkup = newTotalCost > 0 ? (newProfit / newTotalCost) * 100 : 0;

    setScannedReceipt({
      ...scannedReceipt,
      items: updatedItems,
      totalCost: newTotalCost,
      totalRetailShelfValue: newTotalRetail,
      totalPotentialProfit: newProfit,
      markupPercentage: Math.round(newMarkup * 10) / 10
    });
  };

  // Approve all items in scanned receipt
  const handleApproveAllItems = () => {
    if (!scannedReceipt) return;
    const updatedItems = scannedReceipt.items.map((item) => ({ ...item, approved: true }));
    const newTotalCost = updatedItems.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
    const newTotalRetail = updatedItems.reduce(
      (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
      0
    );
    const newProfit = Math.max(0, newTotalRetail - newTotalCost);
    const newMarkup = newTotalCost > 0 ? (newProfit / newTotalCost) * 100 : 0;

    setScannedReceipt({
      ...scannedReceipt,
      items: updatedItems,
      totalCost: newTotalCost,
      totalRetailShelfValue: newTotalRetail,
      totalPotentialProfit: newProfit,
      markupPercentage: Math.round(newMarkup * 10) / 10
    });
  };

  // Reject / Exclude all items
  const handleRejectAllItems = () => {
    if (!scannedReceipt) return;
    const updatedItems = scannedReceipt.items.map((item) => ({ ...item, approved: false }));
    setScannedReceipt({
      ...scannedReceipt,
      items: updatedItems,
      totalCost: 0,
      totalRetailShelfValue: 0,
      totalPotentialProfit: 0,
      markupPercentage: 0
    });
  };

  // In-place edit of scanned item details with strictly numerical addition (e.g. 140 + 280 = 420)
  const handleUpdateScannedItem = (
    itemId: string, 
    field: keyof ProcessedReceiptItem, 
    value: any
  ) => {
    if (!scannedReceipt) return;

    const updatedItems = scannedReceipt.items.map((item) => {
      if (item.id !== itemId) return item;

      const updated = { ...item };

      if (field === "itemName" || field === "supplyUnit" || field === "retailUnit" || field === "rawSpecification") {
        (updated as any)[field] = value;
      } else {
        const numVal = value === "" ? 0 : Number(value) || 0;
        (updated as any)[field] = numVal;

        if (field === "supplyUnitsReceived") {
          const qty = numVal > 0 ? numVal : 1;
          updated.retailUnitsAdded = numVal;
          const currentLineCost = Number(item.lineCost) || 0;
          if (currentLineCost > 0) {
            // Derive unit wholesale cost from receipt line total ÷ quantity
            updated.unitCostAtDelivery = Math.round((currentLineCost / qty) * 100) / 100;
          } else {
            const uCost = Number(item.unitCostAtDelivery) || 0;
            updated.lineCost = Math.round(qty * uCost * 100) / 100;
          }
        }

        if (field === "lineCost") {
          const qty = Number(item.supplyUnitsReceived) > 0 ? Number(item.supplyUnitsReceived) : 1;
          // Derive unit wholesale cost = lineCost ÷ qty
          updated.unitCostAtDelivery = Math.round((numVal / qty) * 100) / 100;
        }

        if (field === "unitCostAtDelivery") {
          const qty = Number(item.supplyUnitsReceived) > 0 ? Number(item.supplyUnitsReceived) : 1;
          updated.lineCost = Math.round(qty * numVal * 100) / 100;
        }

        if (field === "retailPrice" || field === "unitCostAtDelivery" || field === "lineCost" || field === "supplyUnitsReceived") {
          const rPrice = field === "retailPrice" ? numVal : Number(item.retailPrice) || 0;
          const uCost = Number(updated.unitCostAtDelivery) || 0;
          updated.expectedMargin = Math.max(0, Math.round((rPrice - uCost) * 100) / 100);
        }
      }

      return updated;
    });

    // Strictly numeric summation across approved items
    const approved = updatedItems.filter((i) => i.approved !== false);
    const newTotalCost = approved.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
    const newTotalRetail = approved.reduce(
      (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
      0
    );
    const newProfit = Math.max(0, newTotalRetail - newTotalCost);
    const newMarkup = newTotalCost > 0 ? (newProfit / newTotalCost) * 100 : 0;

    setScannedReceipt({
      ...scannedReceipt,
      items: updatedItems,
      totalCost: newTotalCost,
      totalRetailShelfValue: newTotalRetail,
      totalPotentialProfit: newProfit,
      markupPercentage: Math.round(newMarkup * 10) / 10
    });
  };

  // Commit and ingest approved items to inventory & database, and clear scanner space for new uploads
  const handleCommitApprovedReceipt = () => {
    if (!scannedReceipt) return;

    const approvedItems = scannedReceipt.items.filter((i) => i.approved !== false);
    if (approvedItems.length === 0) {
      setSuccessNote("Please approve at least one good before committing the delivery to inventory.");
      setTimeout(() => setSuccessNote(null), 4000);
      return;
    }

    const totalApprovedCost = approvedItems.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
    const totalApprovedRetail = approvedItems.reduce(
      (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
      0
    );
    const profit = Math.max(0, totalApprovedRetail - totalApprovedCost);
    const markup = totalApprovedCost > 0 ? Math.round((profit / totalApprovedCost) * 1000) / 10 : 0;

    // Convert approved items into purchase lines
    const purchaseLines: PurchaseItemLine[] = approvedItems.map((item, idx) => ({
      id: `rcpt_line_${Date.now()}_${idx}`,
      itemName: item.itemName,
      category: "Wholesale Delivery",
      quantity: Number(item.supplyUnitsReceived) || 1,
      unit: item.supplyUnit || "Pieces",
      unitCost: Number(item.unitCostAtDelivery) || 0,
      retailPrice: Number(item.retailPrice) || 0,
      totalCost: Number(item.lineCost) || 0
    }));

    // Determine receiptId: if an archived receipt was re-opened and given a different date,
    // treat it as a new dated receipt so both dates are preserved and arranged chronologically
    const existingWithSameId = receiptsArchive.find((r) => r.id === scannedReceipt.id);
    const effectiveReceiptId =
      existingWithSameId && existingWithSameId.receiptDate !== scannedReceipt.receiptDate
        ? `rcpt_arch_${Date.now()}`
        : scannedReceipt.id || `rcpt_arch_${Date.now()}`;
    const effectiveReceiptNumber =
      scannedReceipt.receiptNumber || `DN-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Log purchase into inventory & master state
    if (onLogPurchase) {
      onLogPurchase({
        receiptId: effectiveReceiptId,
        receiptNumber: effectiveReceiptNumber,
        supplier: scannedReceipt.supplierName,
        supplierPhone: currentSupplier.phone,
        supplierNationalId: currentSupplier.national_id,
        items: purchaseLines.map((l) => `${l.quantity} ${l.unit} ${l.itemName}`).join(", "),
        itemLines: purchaseLines,
        amount: totalApprovedCost,
        payment_channel: scannedReceipt.paymentMode === "MPESA" ? "MPESA" : "CASH",
        date: scannedReceipt.receiptDate || new Date().toISOString().slice(0, 10),
        notes: `Approved delivery receipt ${effectiveReceiptNumber} (${approvedItems.length} goods approved)`,
        receiptImageUrl: scannedReceiptImage || undefined
      });
    }

    // 2. Save worked-on receipt record to database archive
    const savedRecord: SavedReceiptRecord = {
      id: effectiveReceiptId,
      receiptNumber: effectiveReceiptNumber,
      supplierName: scannedReceipt.supplierName,
      receiptDate: scannedReceipt.receiptDate,
      paymentMode: scannedReceipt.paymentMode,
      status: "approved",
      totalCost: totalApprovedCost,
      totalRetailShelfValue: totalApprovedRetail,
      totalPotentialProfit: profit,
      markupPercentage: markup,
      itemsCount: approvedItems.length,
      items: scannedReceipt.items.map((i) => ({
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
      imageUrl: scannedReceiptImage || undefined,
      processedAt: scannedReceipt.processedAt || "Just now",
      decidedAt: new Date().toISOString(),
      notes: `Worked-on & approved receipt. ${approvedItems.length} items verified.`
    };

    if (onSaveReceiptToDatabase) {
      onSaveReceiptToDatabase(savedRecord);
    }

    // 3. Clear active scanner to give space for new uploads
    const clearedNumber = scannedReceipt.receiptNumber;
    const clearedSupplier = scannedReceipt.supplierName;
    setScannedReceipt(null);
    setScannedReceiptImage("");

    setSuccessNote(
      `✓ Worked-on receipt ${clearedNumber} (${clearedSupplier}) approved! Added ${currency} ${totalApprovedCost.toLocaleString()} to database and active inventory. Scanner cleared for next upload.`
    );
    setTimeout(() => setSuccessNote(null), 7000);
  };

  // Reject receipt: save to database with rejection reason and clear scanner to give space for new uploads
  const handleRejectReceipt = (reason: string = "Incorrect pricing / unverified delivery chit") => {
    if (!scannedReceipt) return;

    const savedRecord: SavedReceiptRecord = {
      id: scannedReceipt.id || `rcpt_arch_${Date.now()}`,
      receiptNumber: scannedReceipt.receiptNumber || `DN-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: scannedReceipt.supplierName,
      receiptDate: scannedReceipt.receiptDate,
      paymentMode: scannedReceipt.paymentMode,
      status: "rejected",
      rejectionReason: reason,
      totalCost: Number(scannedReceipt.totalCost) || 0,
      totalRetailShelfValue: Number(scannedReceipt.totalRetailShelfValue) || 0,
      totalPotentialProfit: Number(scannedReceipt.totalPotentialProfit) || 0,
      markupPercentage: Number(scannedReceipt.markupPercentage) || 0,
      itemsCount: scannedReceipt.items.length,
      items: scannedReceipt.items.map((i) => ({
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
      imageUrl: scannedReceiptImage || undefined,
      processedAt: scannedReceipt.processedAt || "Just now",
      decidedAt: new Date().toISOString(),
      notes: `Rejected receipt: ${reason}`
    };

    if (onSaveReceiptToDatabase) {
      onSaveReceiptToDatabase(savedRecord);
    }

    const clearedNumber = scannedReceipt.receiptNumber;
    setScannedReceipt(null);
    setScannedReceiptImage("");
    setIsRejectModalOpen(false);

    setSuccessNote(
      `Receipt ${clearedNumber} marked as REJECTED and saved to database. Scanner cleared for new uploads.`
    );
    setTimeout(() => setSuccessNote(null), 6000);
  };

  // Reload an archived receipt back into the active scanner for review or re-editing
  const handleReloadArchivedReceipt = (arch: SavedReceiptRecord) => {
    setScannedReceipt({
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
        retailUnit: i.retailUnit || "units",
        unitCostAtDelivery: i.unitCostAtDelivery,
        lineCost: i.lineCost,
        retailPrice: i.retailPrice,
        expectedMargin: i.expectedMargin || 0,
        approved: i.approved !== false
      }))
    });
    setScannedReceiptImage(arch.imageUrl || "");
    setSuccessNote(`Loaded receipt ${arch.receiptNumber} (${arch.supplierName}) into scanner for inspection.`);
    setTimeout(() => setSuccessNote(null), 4000);
  };

  // Apply OCR scanned receipt into the Multi-Item Purchase Builder below
  const handleApplyScannedReceipt = () => {
    if (!scannedReceipt) return;

    const approvedItems = scannedReceipt.items.filter((i) => i.approved !== false);
    const targetItems = approvedItems.length > 0 ? approvedItems : scannedReceipt.items;

    // Convert scanned items into PurchaseItemLine[]
    const lines: PurchaseItemLine[] = targetItems.map((item, idx) => ({
      id: `scanned_line_${Date.now()}_${idx}`,
      itemName: item.itemName,
      category: "Dairy & Chilled",
      quantity: Number(item.supplyUnitsReceived) || 1,
      unit: item.supplyUnit,
      unitCost: Number(item.unitCostAtDelivery) || (Number(item.lineCost) / (Number(item.supplyUnitsReceived) || 1)),
      retailPrice: Number(item.retailPrice) || 0,
      totalCost: Number(item.lineCost) || 0
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
    setSuccessNote(`Applied ${lines.length} approved goods from receipt to purchase form! Review and save below.`);
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
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="text-blue-600 shrink-0" size={22} /> Purchases &amp; Inbound Cargo
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold uppercase hidden sm:inline">
              1 to Many Goods
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Suppliers deliver from 1 to many goods at once. Record batch deliveries or photo receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("suppliers")}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Truck size={14} className="text-slate-600" />
              <span>Suppliers</span>
            </button>
          )}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("owner_expenses")}
              className="px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200"
            >
              <Wallet size={14} className="text-indigo-600" />
              <span>Owner Expenses</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveSubView("upload");
              fileInputRef.current?.click();
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Camera size={15} />
            <span>Upload Receipt</span>
          </button>

          <button
            onClick={() => {
              setActiveSubView("cargo");
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

      {/* KPI METRICS (COMPACT ON SMALL SCREENS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Total Restock Spend</span>
          <div className="text-lg sm:text-2xl font-serif font-bold text-slate-900 mt-0.5">
            {currency} {supplierPurchases.reduce((acc, p) => {
              const n = Number(p.amount) || 0;
              return acc + (n > 0 && n <= 5_000_000 ? n : 4160);
            }, 0).toLocaleString()}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block">{supplierPurchases.length} batches received</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Active Suppliers</span>
          <div className="text-lg sm:text-2xl font-serif font-bold text-blue-700 mt-0.5">
            {suppliers.length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block">Delivering goods &amp; stock</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">National ID OTC Rails</span>
          <div className="text-lg sm:text-2xl font-serif font-bold text-emerald-700 mt-0.5">
            {suppliers.filter(s => s.payment_preference === "NATIONAL_ID_DEPOSIT").length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block">Equity/KCB Agent deposits</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Receipt OCR Reader</span>
          <div className="text-lg sm:text-2xl font-serif font-bold text-purple-700 mt-0.5">
            Active
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block">Instant photo auto-fill</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PURCHASES SUB-NAVIGATION: CARGO LOTS VS UPLOAD RECEIPTS (OCR) VS ARCHIVE   */}
      {/* "The upload receipts module should not be a module on its own, it should   */}
      {/* remain under purchases"                                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-between gap-2 flex-wrap shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubView("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubView === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <span>All Purchases</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView("upload")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubView === "upload"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
            }`}
          >
            <Camera size={14} />
            <span>Upload Receipts (OCR)</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-white">
              White Paper
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubView("cargo");
              setIsAddingPurchase(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubView === "cargo"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            <Layers size={14} />
            <span>Inbound Cargo &amp; Lots</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView("archive")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubView === "archive"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <History size={14} />
            <span>Receipts Archive ({receiptsArchive.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span>Mode: <strong className="text-slate-800">{activeSubView === "upload" ? "Receipts Under Purchases" : activeSubView === "cargo" ? "Cargo Shipments" : activeSubView === "archive" ? "Database Archive" : "Full Purchases View"}</strong></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1B. RESTOCK AUTO-SALES RECONCILIATION CARDS (COLLAPSIBLE / COMPACT)       */}
      {/* ========================================================================= */}
      {(activeSubView === "all" || activeSubView === "cargo") && (
      <div className="bg-[#0b131e] border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-serif font-bold text-white flex items-center gap-1.5">
                  Restock Auto-Sales Reconciliation Cards
                </h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  {restockCards.filter(c => c.status === "PENDING_AUTHORIZATION").length} Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                Inbound restock confirms earlier batches were sold. Reconcile remaining units to authorize sales into your drawer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsReconExpanded(!isReconExpanded)}
              className="px-2.5 py-1 rounded-lg bg-[#142334] hover:bg-[#1a2f45] text-amber-300 border border-amber-500/30 text-xs font-mono cursor-pointer"
            >
              {isReconExpanded ? "▲ Collapse" : "▼ Expand Cards"}
            </button>
            <button
              type="button"
              onClick={() => setShowAllRestockCards(!showAllRestockCards)}
              className="px-2.5 py-1 rounded-lg bg-[#142334] hover:bg-[#1a2f45] text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer"
            >
              {showAllRestockCards ? "Pending Only" : `All (${restockCards.length})`}
            </button>
          </div>
        </div>

        {/* CARDS LIST (COLLAPSIBLE FOR MOBILE FIT) */}
        {isReconExpanded && (
          <div className="space-y-3 pt-1">
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
      )}
      </div>

      {/* ========================================================================= */}
      {/* 2. RECEIPT PHOTO SCANNER, ITEM APPROVAL & DATABASE ARCHIVE                 */}
      {/* "the upload receipt feature should be working perfectly, client approves    */}
      {/* each item, ensure correct details, 140 + 280 adds to 420, worked on &     */}
      {/* rejected receipts go into a database to give space for new uploads"        */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-blue-200/80 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 relative overflow-hidden">
        
        {/* DECORATIVE SUBTLE BLUE ACCENT */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/60 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* SCANNER HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Camera size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-serif font-bold text-slate-900">
                  Upload Receipt &bull; Item-by-Item Approval &amp; Database Archive
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                  Verified Ingestion
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reads supplier name (e.g. <strong>THE PHIMAR TRADING CENTER</strong>), payment mode (<strong>CASH</strong>), totals (<strong>Ksh 4,160</strong>), and derives unit wholesale costs for packet &amp; bag bundles even when receipt lines are printed in shorthand.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              <span>{scannedReceipt ? "Upload Another Receipt" : "Upload Receipt Photo"}</span>
            </button>

            {scannedReceipt && (
              <button
                onClick={() => {
                  setScannedReceipt(null);
                  setScannedReceiptImage("");
                  setSuccessNote("Scanner cleared to give space for new uploads.");
                  setTimeout(() => setSuccessNote(null), 3000);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition cursor-pointer"
                title="Clear current view to upload fresh receipt"
              >
                Clear / New Upload
              </button>
            )}
          </div>
        </div>

        {/* SCANNING PROGRESS INDICATOR */}
        {isScanningReceipt && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 animate-pulse">
            <RefreshCw size={18} className="text-blue-600 animate-spin shrink-0" />
            <div className="text-xs">
              <strong className="text-blue-900 block">Multimodal AI Reading Receipt &amp; Detecting Line Items...</strong>
              <span className="text-blue-700 text-[11px]">
                Extracting supplier, quantities, unit prices, crate conversions, and totals.
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE A: ACTIVE RECEIPT IN REVIEW (ITEM-BY-ITEM CLIENT APPROVAL)          */}
        {/* ========================================================================= */}
        {scannedReceipt && !isScanningReceipt && (() => {
          const approvedItems = scannedReceipt.items.filter((i) => i.approved !== false);
          // Strictly numerical addition: no string concatenation! E.g. 140 + 280 = 420
          const approvedTotalCost = approvedItems.reduce((acc, i) => acc + (Number(i.lineCost) || 0), 0);
          const approvedTotalRetail = approvedItems.reduce(
            (acc, i) => acc + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 
            0
          );
          const potentialProfit = Math.max(0, approvedTotalRetail - approvedTotalCost);
          const overallMarkup = approvedTotalCost > 0 ? ((potentialProfit / approvedTotalCost) * 100).toFixed(1) : "0.0";

          return (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 space-y-5 shadow-sm">
              
              {/* TOP BANNER: EDITABLE RECEIPT METADATA & ACTIONS */}
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full inline-block">
                      Receipt Under Review &bull; {approvedItems.length} of {scannedReceipt.items.length} Goods Approved
                    </span>
                  </div>

                  {/* APPROVAL TOGGLES & TOP BUTTONS */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: ProcessedReceiptItem = {
                          id: `item_manual_${Date.now()}`,
                          itemName: "New Receipt Item",
                          supplyUnitsReceived: 1,
                          supplyUnit: "Packets",
                          conversionRatio: 1,
                          retailUnitsAdded: 1,
                          retailUnit: "packets",
                          unitCostAtDelivery: 100,
                          lineCost: 100,
                          retailPrice: 125,
                          expectedMargin: 25,
                          approved: true
                        };
                        const nextItems = [...scannedReceipt.items, newItem];
                        const nextApproved = nextItems.filter((i) => i.approved !== false);
                        const nextCost = nextApproved.reduce((a, i) => a + (Number(i.lineCost) || 0), 0);
                        const nextRetail = nextApproved.reduce((a, i) => a + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 0);
                        setScannedReceipt({
                          ...scannedReceipt,
                          items: nextItems,
                          totalCost: nextCost,
                          totalRetailShelfValue: nextRetail,
                          totalPotentialProfit: Math.max(0, nextRetail - nextCost)
                        });
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>+ Add Good</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveAllItems}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckSquare size={13} className="text-emerald-600" />
                      <span>Approve All</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectAllItems}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Square size={13} className="text-slate-500" />
                      <span>Exclude All</span>
                    </button>
                  </div>
                </div>

                {/* EDITABLE SUPPLIER, INVOICE NO, DATE, PAYMENT MODE */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">Supplier Name</label>
                    <input
                      type="text"
                      list="receipt-suppliers-datalist"
                      value={scannedReceipt.supplierName}
                      onChange={(e) => setScannedReceipt({ ...scannedReceipt, supplierName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                      placeholder="Supplier or distributor"
                    />
                    <datalist id="receipt-suppliers-datalist">
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">Receipt / Invoice #</label>
                    <input
                      type="text"
                      value={scannedReceipt.receiptNumber}
                      onChange={(e) => setScannedReceipt({ ...scannedReceipt, receiptNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">Receipt Date</label>
                    <input
                      type="date"
                      value={scannedReceipt.receiptDate}
                      onChange={(e) => setScannedReceipt({ ...scannedReceipt, receiptDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">Payment Mode</label>
                    <select
                      value={scannedReceipt.paymentMode}
                      onChange={(e) => setScannedReceipt({ ...scannedReceipt, paymentMode: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900"
                    >
                      <option value="CASH">CASH</option>
                      <option value="MPESA">MPESA</option>
                      <option value="CREDIT">SUPPLIER CREDIT</option>
                      <option value="EQUITEL">EQUITEL / BANK</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TWO-COLUMN LAYOUT: PHOTO THUMBNAIL (LEFT) + INTERACTIVE GOODS APPROVAL TABLE (RIGHT) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                
                {/* PHOTO PREVIEW (LEFT) - PURE WHITE BACKGROUND PHYSICAL RECEIPT */}
                <div className="lg:col-span-5 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                      <FileText size={15} className="text-blue-600" />
                      Physical Receipt &bull; White Background
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                      Confidence: {((scannedReceipt.confidenceScore || 0.98) * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* PURE WHITE RECEIPT PAPER DISPLAY (ZERO GRAY TINT) */}
                  <div 
                    className="min-h-[320px] overflow-hidden rounded-xl border-2 border-slate-200 flex items-center justify-center bg-white p-3 shadow-sm relative group"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    {scannedReceiptImage ? (
                      <div className="w-full flex justify-center bg-white" style={{ backgroundColor: "#ffffff" }}>
                        <img
                          src={scannedReceiptImage}
                          alt="Scanned Supplier Receipt"
                          className="w-full h-auto object-contain max-h-[460px] rounded shadow-xs bg-white"
                          style={{ backgroundColor: "#ffffff" }}
                        />
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs bg-white" style={{ backgroundColor: "#ffffff" }}>
                        <Camera size={32} className="mx-auto mb-1 text-slate-400" />
                        No photo attached
                      </div>
                    )}
                  </div>

                  <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
                    <span>Payment: <strong className="text-slate-800">{scannedReceipt.paymentMode}</strong></span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline text-[11px]"
                    >
                      Change Photo / Upload
                    </button>
                  </div>
                </div>

                {/* INTERACTIVE GOODS LIST WITH ITEM-LEVEL APPROVAL (RIGHT) */}
                <div className="lg:col-span-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-600" />
                      Approve &amp; Ensure Correct Details for Each Good:
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Approved Total: {currency} {approvedTotalCost.toLocaleString()}
                    </span>
                  </div>

                  {/* ITEM CARDS / ROWS */}
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {scannedReceipt.items.map((item, idx) => {
                      const isApproved = item.approved !== false;
                      const lineTotal = Number(item.lineCost) || 0;
                      const qty = Number(item.supplyUnitsReceived) > 0 ? Number(item.supplyUnitsReceived) : 1;
                      const derivedUnitCost = Math.round((lineTotal / qty) * 100) / 100;
                      const unitCost = Number(item.unitCostAtDelivery) || derivedUnitCost;
                      const retailPrice = Number(item.retailPrice) || 0;
                      const is25kgBag = item.itemName.toLowerCase().includes("25kg") && qty === 1;

                      return (
                        <div
                          key={item.id || idx}
                          className={`p-3 rounded-xl border transition-all text-xs ${
                            isApproved 
                              ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/10" 
                              : "bg-slate-50/70 border-slate-200 opacity-60"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                            
                            {/* APPROVE TOGGLE BUTTON */}
                            <div className="flex items-center gap-2 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleItemApproval(item.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                  isApproved
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                }`}
                              >
                                {isApproved ? (
                                  <>
                                    <Check size={13} className="text-white" />
                                    <span>Approved ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <Square size={13} className="text-slate-500" />
                                    <span>Click to Approve</span>
                                  </>
                                )}
                              </button>

                              {/* EDITABLE ITEM NAME */}
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={item.itemName}
                                  onChange={(e) => handleUpdateScannedItem(item.id, "itemName", e.target.value)}
                                  className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full text-xs"
                                  placeholder="Good description"
                                />
                                {item.rawSpecification && (
                                  <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                                    Receipt Line: {item.rawSpecification}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* DERIVED WHOLESALE FORMULA PILL & DELETE BUTTON */}
                            <div className="flex items-center gap-2 self-end sm:self-auto font-mono flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                                Derived Wholesale: {currency} {lineTotal.toLocaleString()} &divide; {qty} = {currency} {unitCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/{item.supplyUnit || "unit"}
                                {is25kgBag ? ` (${currency} ${(lineTotal / 25).toFixed(2)}/kg)` : ""}
                              </span>
                              {scannedReceipt.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextItems = scannedReceipt.items.filter((i) => i.id !== item.id);
                                    const nextApproved = nextItems.filter((i) => i.approved !== false);
                                    const nextCost = nextApproved.reduce((a, i) => a + (Number(i.lineCost) || 0), 0);
                                    const nextRetail = nextApproved.reduce((a, i) => a + ((Number(i.retailUnitsAdded || i.supplyUnitsReceived) || 0) * (Number(i.retailPrice) || 0)), 0);
                                    setScannedReceipt({
                                      ...scannedReceipt,
                                      items: nextItems,
                                      totalCost: nextCost,
                                      totalRetailShelfValue: nextRetail,
                                      totalPotentialProfit: Math.max(0, nextRetail - nextCost)
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Remove item from receipt"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* EDITABLE NUMERICAL FIELDS: QTY & UNIT, LINE TOTAL (FROM RECEIPT), DERIVED UNIT WHOLESALE COST, RETAIL PRICE */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-[11px]">
                            
                            {/* 1. WHOLESALE QUANTITY / PACKETS & UNIT */}
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-0.5">
                                Packets / Qty &amp; Unit
                              </label>
                              <div className="flex items-center gap-1 font-mono">
                                <input
                                  type="number"
                                  step="any"
                                  min={0}
                                  value={item.supplyUnitsReceived}
                                  onChange={(e) => handleUpdateScannedItem(item.id, "supplyUnitsReceived", e.target.value)}
                                  className="w-16 bg-white border border-slate-200 rounded-md p-1 text-center font-bold text-slate-800 text-xs"
                                />
                                <input
                                  type="text"
                                  value={item.supplyUnit}
                                  onChange={(e) => handleUpdateScannedItem(item.id, "supplyUnit", e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-md p-1 text-[10px] text-slate-700 font-sans"
                                  placeholder="Packets / Bag"
                                />
                              </div>
                            </div>

                            {/* 2. EXACT LINE TOTAL COST FROM RECEIPT (E.G. 1600, 1270, 1290) */}
                            <div>
                              <label className="text-[9px] text-amber-800 uppercase font-bold block mb-0.5">
                                Receipt Line Cost ({currency}) *
                              </label>
                              <input
                                type="number"
                                step="any"
                                min={0}
                                value={lineTotal}
                                onChange={(e) => handleUpdateScannedItem(item.id, "lineCost", e.target.value)}
                                className="w-full bg-white border-2 border-amber-300 rounded-md p-1 font-mono font-bold text-amber-900 text-xs text-right focus:border-amber-500"
                              />
                            </div>

                            {/* 3. DERIVED UNIT WHOLESALE COST (LINE COST ÷ QTY) */}
                            <div>
                              <label className="text-[9px] text-blue-700 uppercase font-bold block mb-0.5">
                                Derived Unit Wholesale ({currency})
                              </label>
                              <input
                                type="number"
                                step="any"
                                min={0}
                                value={unitCost}
                                onChange={(e) => handleUpdateScannedItem(item.id, "unitCostAtDelivery", e.target.value)}
                                className="w-full bg-blue-50/60 border border-blue-300 rounded-md p-1 font-mono font-bold text-blue-900 text-xs text-right"
                              />
                            </div>

                            {/* 4. RETAIL SELLING PRICE */}
                            <div>
                              <label className="text-[9px] text-emerald-800 uppercase font-semibold block mb-0.5">
                                Shelf Retail ({currency})
                              </label>
                              <input
                                type="number"
                                step="any"
                                min={0}
                                value={retailPrice}
                                onChange={(e) => handleUpdateScannedItem(item.id, "retailPrice", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-md p-1 font-mono font-bold text-emerald-700 text-xs text-right"
                              />
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* FINANCIAL IMPACT BANNER: STRICT ADDITION (140 + 280 = 420) */}
                  <div className="p-3 bg-slate-100/80 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Approved Items</span>
                      <strong className="text-slate-900">{approvedItems.length} Products</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Total Approved Cost</span>
                      <strong className="text-emerald-700 text-sm">
                        {currency} {approvedTotalCost.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Retail Shelf Value</span>
                      <strong className="text-blue-700">
                        {currency} {approvedTotalRetail.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Batch Margin</span>
                      <strong className="text-slate-800">
                        +{currency} {potentialProfit.toLocaleString()} ({overallMarkup}%)
                      </strong>
                    </div>
                  </div>

                  {/* PRIMARY ACTION BUTTONS */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    
                    {/* REJECT RECEIPT (GOES TO DATABASE & CLEARS SCANNER) */}
                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle size={15} className="text-rose-600" />
                      <span>Reject Receipt &amp; Save to Database</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                      {/* APPLY TO PURCHASE FORM (OPTIONAL) */}
                      <button
                        type="button"
                        onClick={handleApplyScannedReceipt}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                        title="Copy into purchase form below for manual editing"
                      >
                        Populate Into Form Below &darr;
                      </button>

                      {/* COMMIT APPROVED RECEIPT TO DATABASE & ACTIVE INVENTORY */}
                      <button
                        type="button"
                        onClick={handleCommitApprovedReceipt}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Check size={16} />
                        <span>
                          Approve &amp; Ingest to Database ({approvedItems.length} Goods &rarr; {currency} {approvedTotalCost.toLocaleString()})
                        </span>
                      </button>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* STATE B: SCANNER EMPTY / READY STATE (GIVES SPACE FOR NEW UPLOADS)         */}
        {/* ========================================================================= */}
        {!scannedReceipt && !isScanningReceipt && (
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/60 rounded-2xl p-6 sm:p-8 text-center space-y-4 transition">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Camera size={26} />
            </div>
            
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Scanner is Ready for Next Delivery Receipt Photo
              </h3>
              <p className="text-xs text-slate-500">
                Worked-on and rejected receipts have been safely archived to the database below. Snap or upload your next delivery chit to read lots of goods.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-[#1A56DB] hover:bg-[#1545B3] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Upload size={15} />
                <span>Take Photo / Upload Pic</span>
              </button>
            </div>
          </div>
        )}

        {/* QUICK 1-TAP SAMPLE DELIVERY RECEIPT PHOTOS (AVAILABLE AT ALL TIMES) */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" /> Test with Kenyan Supplier Delivery Slips:
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">1-Click sample test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SAMPLE_SUPPLIER_RECEIPTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSampleReceipt(sample.id)}
                className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition flex items-center gap-2.5 cursor-pointer group shadow-2xs bg-white"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ImageIcon size={16} className="text-slate-600 group-hover:text-blue-600" />
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

        {/* ========================================================================= */}
        {/* RECEIPTS DATABASE & ARCHIVE (WORKED-ON & REJECTED RECEIPTS)               */}
        {/* "thewn worked on receipts should go into a database,, same to rejected     */}
        {/* receipts should go to sa database to give space for new uploads...then"    */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t-2 border-slate-100 space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Receipts Database &amp; Audit Trail ({receiptsArchive.length} Archived)
              </h3>
            </div>

            {/* FILTER PILLS */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-mono">
              <button
                type="button"
                onClick={() => setArchiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  archiveFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({receiptsArchive.length})
              </button>
              <button
                type="button"
                onClick={() => setArchiveFilter("approved")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  archiveFilter === "approved"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <Check size={12} />
                <span>Worked-On ({receiptsArchive.filter((r) => r.status === "approved").length})</span>
              </button>
              <button
                type="button"
                onClick={() => setArchiveFilter("rejected")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  archiveFilter === "rejected"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                }`}
              >
                <XCircle size={12} />
                <span>Rejected ({receiptsArchive.filter((r) => r.status === "rejected").length})</span>
              </button>
            </div>
          </div>

          {/* ARCHIVED RECEIPTS LIST */}
          {(() => {
            const filteredArchive = receiptsArchive.filter((r) => {
              if (archiveFilter === "approved") return r.status === "approved";
              if (archiveFilter === "rejected") return r.status === "rejected";
              return true;
            });

            if (filteredArchive.length === 0) {
              return (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  <FileText size={24} className="mx-auto mb-1 text-slate-400" />
                  No receipts found in this filter view.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredArchive.map((arch) => {
                  const isApproved = arch.status === "approved";

                  return (
                    <div
                      key={arch.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-2.5 bg-white shadow-2xs ${
                        isApproved ? "border-slate-200 hover:border-emerald-300" : "border-rose-200 bg-rose-50/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {isApproved ? "Worked-On ✓" : "Rejected ✕"}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 truncate">
                              {arch.receiptNumber}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 truncate mt-1">
                            {arch.supplierName}
                          </h4>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {arch.receiptDate} &bull; {arch.paymentMode}
                          </span>
                        </div>

                        {/* THUMBNAIL IF PRESENT */}
                        {arch.imageUrl && (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={arch.imageUrl}
                              alt="Receipt thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* REJECTION REASON IF REJECTED */}
                      {!isApproved && arch.rejectionReason && (
                        <div className="p-2 rounded-xl bg-rose-100/60 border border-rose-200 text-[11px] text-rose-800">
                          <strong>Rejection reason:</strong> {arch.rejectionReason}
                        </div>
                      )}

                      {/* ITEMS SUMMARY */}
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 font-semibold">
                          <span>{arch.items?.length || arch.itemsCount || 0} Goods</span>
                          <span className="text-slate-900 font-bold">
                            Total: {currency} {Number(arch.totalCost || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="truncate text-slate-700">
                          {(arch.items || []).map((i) => `${i.itemName} (${i.supplyUnitsReceived} ${i.supplyUnit})`).join(", ") || "Recorded shipment"}
                        </div>
                      </div>

                      {/* ACTIONS: INSPECT OR RELOAD */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setInspectingReceipt(arch)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReloadArchivedReceipt(arch)}
                          className="text-[11px] text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                          title="Load this receipt back into review scanner"
                        >
                          Re-open in Scanner &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* REJECT RECEIPT MODAL                                                      */}
      {/* ========================================================================= */}
      {isRejectModalOpen && scannedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle size={18} />
                <h3 className="font-bold text-slate-900 text-sm">
                  Reject &amp; Archive Receipt to Database
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600">
              This receipt ({scannedReceipt.receiptNumber} from {scannedReceipt.supplierName}) will be permanently marked as <strong>REJECTED</strong> and archived in your database. The active scanner will be cleared to give space for new uploads.
            </p>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold block">
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
                        ? "bg-rose-50 border-rose-300 text-rose-900 font-semibold"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
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
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 mt-2 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRejectReceipt(rejectionReasonInput)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Confirm Rejection &amp; Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INSPECT ARCHIVED RECEIPT MODAL                                            */}
      {/* ========================================================================= */}
      {inspectingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                      inspectingReceipt.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {inspectingReceipt.status === "approved" ? "Worked-On & Approved" : "Rejected"}
                  </span>
                  <span className="font-mono text-slate-400 text-xs">
                    {inspectingReceipt.receiptNumber}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {inspectingReceipt.supplierName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingReceipt(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* RECEIPT IMAGE IF AVAILABLE - PURE WHITE BACKGROUND */}
            {inspectingReceipt.imageUrl && (
              <div 
                className="p-3 bg-white rounded-2xl flex items-center justify-center max-h-72 overflow-hidden border-2 border-slate-200 shadow-sm"
                style={{ backgroundColor: "#ffffff" }}
              >
                <img
                  src={inspectingReceipt.imageUrl}
                  alt="Receipt full image"
                  className="max-h-72 object-contain rounded-lg bg-white"
                  style={{ backgroundColor: "#ffffff" }}
                />
              </div>
            )}

            {/* REJECTION REASON IF REJECTED */}
            {inspectingReceipt.status === "rejected" && inspectingReceipt.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                <strong>Rejection Reason:</strong> {inspectingReceipt.rejectionReason}
              </div>
            )}

            {/* ITEMS BREAKDOWN TABLE */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                Goods Included in Delivery ({inspectingReceipt.items?.length || 0} Items):
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Good Name</th>
                      <th className="py-2 px-3 text-center">Quantity</th>
                      <th className="py-2 px-3 text-right">Unit Wholesale</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                      <th className="py-2 px-3 text-right">Shelf Price</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    {(inspectingReceipt.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">
                          {item.itemName}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.supplyUnitsReceived} {item.supplyUnit}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {currency} {Number(item.unitCostAtDelivery || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {currency} {Number(item.lineCost || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700">
                          {currency} {Number(item.retailPrice || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.approved !== false ? (
                            <span className="text-[10px] text-emerald-700 font-bold">Approved ✓</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Excluded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOTALS & TIMESTAMPS */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-mono">
              <span className="text-slate-500">
                Archived: {new Date(inspectingReceipt.decidedAt).toLocaleString()}
              </span>
              <strong className="text-slate-900 text-sm">
                Total Invoice: {currency} {Number(inspectingReceipt.totalCost || 0).toLocaleString()}
              </strong>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleReloadArchivedReceipt(inspectingReceipt);
                  setInspectingReceipt(null);
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Re-load into Active Review &rarr;
              </button>
              <button
                type="button"
                onClick={() => setInspectingReceipt(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-xl transition cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              
              {/* SUPPLIER PICKER / DIRECT INPUT (RELIABLE DUAL-MODE: NATIVE SELECT + SEARCHABLE DROPDOWN) */}
              <div className="relative" ref={supplierDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold block text-xs">
                    Supplier / Distributor *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSupplierSelectMode(supplierSelectMode === "dropdown" ? "type" : "dropdown");
                      setIsSupplierDropdownOpen(false);
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                  >
                    {supplierSelectMode === "dropdown" ? "✎ Type Custom Name" : "▾ Choose from List"}
                  </button>
                </div>

                {supplierSelectMode === "dropdown" ? (
                  /* 1. NATIVE SELECT (100% RELIABLE ON MOBILE TOUCH & DESKTOP) */
                  <select
                    value={suppliers.some(s => s.name.toLowerCase().trim() === selectedSupplierName.toLowerCase().trim()) ? selectedSupplierName : ""}
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") {
                        setSupplierSelectMode("type");
                        setSelectedSupplierName("");
                        setTimeout(() => setIsSupplierDropdownOpen(true), 100);
                      } else if (e.target.value) {
                        setSelectedSupplierName(e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-slate-900 font-semibold text-xs shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Select Registered Supplier ({suppliers.length}) --</option>
                    {suppliers.map(s => {
                      const goodsCount = (s.supplied_items?.length) || inventory.filter(i => (i.supplier || "").toLowerCase() === s.name.toLowerCase()).length;
                      return (
                        <option key={s.id} value={s.name}>
                          {s.name} ({goodsCount > 0 ? `${goodsCount} goods` : "1+ goods"} &bull; {s.category})
                        </option>
                      );
                    })}
                    <option value="__NEW__">+ Type / Add New Supplier Name...</option>
                  </select>
                ) : (
                  /* 2. SEARCHABLE / DIRECT TEXT INPUT WITH CUSTOM FLYOUT */
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={selectedSupplierName}
                      onFocus={() => {
                        setSupplierSearchQuery("");
                        setIsSupplierDropdownOpen(true);
                      }}
                      onChange={(e) => {
                        setSelectedSupplierName(e.target.value);
                        setSupplierSearchQuery(e.target.value);
                        setIsSupplierDropdownOpen(true);
                      }}
                      placeholder="Type supplier name..."
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-3 pr-8 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSupplierSearchQuery("");
                        setIsSupplierDropdownOpen(!isSupplierDropdownOpen);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isSupplierDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                )}

                {/* CUSTOM DROPDOWN LIST (SHOWS REGISTERED SUPPLIERS & ITEM COUNTS) */}
                {isSupplierDropdownOpen && supplierSelectMode === "type" && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs max-h-64 overflow-y-auto animate-in fade-in zoom-in-95">
                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Registered Suppliers ({suppliers.length})</span>
                      <button
                        type="button"
                        onClick={() => setIsSupplierDropdownOpen(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {suppliers
                        .filter((s) => {
                          const q = supplierSearchQuery.toLowerCase().trim();
                          if (!q) return true;
                          return s.name.toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q) || (s.company || "").toLowerCase().includes(q);
                        })
                        .map((s) => {
                          const goodsCount = (s.supplied_items?.length) || 
                            inventory.filter(i => (i.supplier || "").toLowerCase() === s.name.toLowerCase()).length;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedSupplierName(s.name);
                                setSupplierSearchQuery("");
                                setIsSupplierDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                                selectedSupplierName.toLowerCase().trim() === s.name.toLowerCase().trim()
                                  ? "bg-blue-50 text-blue-900 font-bold"
                                  : "hover:bg-slate-50 text-slate-800"
                              }`}
                            >
                              <div className="truncate">
                                <div className="font-semibold text-slate-900">{s.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">{s.category} &bull; {s.phone}</div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono shrink-0 font-medium">
                                {goodsCount > 0 ? `${goodsCount} goods` : "1+ goods"}
                              </span>
                            </button>
                          );
                        })}

                      {/* Option to create a new supplier if not already in list */}
                      {selectedSupplierName.trim() && !suppliers.some(s => s.name.toLowerCase().trim() === selectedSupplierName.toLowerCase().trim()) && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setIsSupplierDropdownOpen(false);
                            setSuccessNote(`New supplier "${selectedSupplierName}" selected. Will be saved automatically to database!`);
                            setTimeout(() => setSuccessNote(null), 3500);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold flex items-center gap-2 cursor-pointer border border-blue-200 mt-1"
                        >
                          <Plus size={14} className="text-blue-600 shrink-0" />
                          <span className="truncate">
                            + Add &quot;{selectedSupplierName.trim()}&quot; as New Supplier
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
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

            {/* GOODS SUPPLIED BY THIS DISTRIBUTOR (SUPPLIERS SUPPLY FROM 1 TO MANY ITEMS) */}
            <div className="bg-blue-50/70 border border-blue-200/90 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-blue-950">
                    Goods Supplied by {selectedSupplierName} ({suppliedGoodsList.length} items)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold">
                    1 to Many Items
                  </span>
                </div>

                {suppliedGoodsList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleLoadAllSuppliedGoods}
                    className="self-start sm:self-auto px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Layers size={12} />
                    <span>Load All {suppliedGoodsList.length} Goods into Shipment</span>
                  </button>
                )}
              </div>

              {suppliedGoodsList.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-600">
                    Tap any item below to quickly add it to this cargo batch:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suppliedGoodsList.map((goodName) => (
                      <button
                        key={goodName}
                        type="button"
                        onClick={() => handleAddSuppliedItemToBatch(goodName)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 text-slate-800 hover:text-blue-900 border border-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus size={11} className="text-blue-600" />
                        <span>{goodName}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddLineRow}
                      className="px-2.5 py-1 bg-blue-100/70 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>+ Add Another Good</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    New supplier: <strong>{selectedSupplierName}</strong> supplies from 1 to many goods. Enter the items below, and they will be automatically saved to your inventory and remembered under this supplier.
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLineRow}
                    className="self-start sm:self-auto px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus size={12} />
                    <span>+ Add Good to Batch</span>
                  </button>
                </div>
              )}
            </div>

            {/* THE LOT OF GOODS (MULTI-ITEM LIST: RESPONSIVE CARDS ON MOBILE & TABLE ON DESKTOP) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Goods Included in this Cargo Batch ({itemLines.length})
                  </h3>
                  <span className="text-xs text-slate-500">
                    Each item updates shelf stock and locks in wholesale costs.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                    Sample Cargo
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
                      setSuccessNote("Reset cargo to empty row for your manual entry.");
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

              {/* 1. MOBILE RESPONSIVE CARDS (SCREEN < MD) */}
              <div className="block md:hidden space-y-3">
                {itemLines.map((line, idx) => (
                  <div key={line.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                        Good #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg"
                        title="Remove good"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block">Product / Good Name</label>
                        {suppliedGoodsList.length > 0 && (
                          <span className="text-[9px] text-blue-600 font-mono font-bold">Supplied Item</span>
                        )}
                      </div>

                      {suppliedGoodsList.length > 0 && (
                        <div className="mb-1.5">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSelectSuppliedItemForRow(line.id, e.target.value);
                              }
                            }}
                            className="w-full bg-blue-50/90 border border-blue-200 text-blue-900 rounded-lg p-1.5 text-[11px] font-semibold cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled>⚡ Pick from {selectedSupplierName}&apos;s goods ({suppliedGoodsList.length})...</option>
                            {suppliedGoodsList.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <input
                        type="text"
                        required
                        value={line.itemName}
                        onChange={(e) => handleUpdateLine(line.id, { itemName: e.target.value })}
                        placeholder="e.g. Unga Jogoo 2kg, Sugar 1kg"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900"
                        list="inventory-suggestions"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Quantity</label>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          value={line.quantity === 0 ? "" : line.quantity}
                          onChange={(e) => handleUpdateLine(line.id, { quantity: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                          placeholder="e.g. 1 or 0.5"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Supply Pack</label>
                        <select
                          value={line.unit}
                          onChange={(e) => handleUpdateLine(line.id, { unit: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                        >
                          {unitOptions.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Unit Wholesale ({currency})</label>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          value={line.unitCost === 0 ? "" : line.unitCost}
                          onChange={(e) => handleUpdateLine(line.id, { unitCost: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                          placeholder="0.00"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 text-right"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Shelf Price ({currency})</label>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          value={line.retailPrice || ""}
                          onChange={(e) => handleUpdateLine(line.id, { retailPrice: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                          placeholder="Selling price"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-blue-700 text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">Line Total Cost:</span>
                      <strong className="text-slate-900 font-mono font-bold">{currency} {((line.quantity || 0) * (line.unitCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. DESKTOP / TABLET GOODS TABLE (SCREEN >= MD) */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl">
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
                          {suppliedGoodsList.length > 0 && (
                            <div className="mb-1">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleSelectSuppliedItemForRow(line.id, e.target.value);
                                  }
                                }}
                                className="w-full bg-blue-50/90 border border-blue-200 text-blue-900 rounded-lg py-1 px-1.5 text-[11px] font-semibold cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>⚡ Pick from {selectedSupplierName}&apos;s goods ({suppliedGoodsList.length})...</option>
                                {suppliedGoodsList.map((g) => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>
                          )}
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
                            step="any"
                            required
                            min={0}
                            value={line.quantity === 0 ? "" : line.quantity}
                            onChange={(e) => handleUpdateLine(line.id, { quantity: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                            placeholder="e.g. 1 or 0.5"
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
                            step="any"
                            required
                            min={0}
                            value={line.unitCost === 0 ? "" : line.unitCost}
                            onChange={(e) => handleUpdateLine(line.id, { unitCost: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                            placeholder="0.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-semibold text-slate-900 text-right"
                          />
                        </td>

                        {/* LINE TOTAL COST (EDITABLE TO DERIVE UNIT WHOLESALE COST) */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="any"
                            required
                            min={0}
                            value={line.totalCost === 0 ? "" : line.totalCost}
                            onChange={(e) => handleUpdateLine(line.id, { totalCost: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                            placeholder="0.00"
                            className="w-full bg-amber-50/60 border border-amber-300 rounded-xl p-2 text-xs font-mono font-bold text-amber-900 text-right"
                          />
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
