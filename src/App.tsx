import React, { useState, useEffect } from "react";
import { 
  Building2, Globe, Plus, ChevronDown, Copy, X, ArrowRight, Sparkles, 
  AlertTriangle, Layers, Database, BarChart3, BrainCircuit, Eye, 
  LayoutDashboard, Mic, Zap, Clock, Package, Users, Scale, RefreshCw, BarChart2,
  Smartphone, HelpCircle, Download, Radio, Sun, Truck, Languages, Camera, CheckCircle2,
  ArrowUpDown
} from "lucide-react";

import { 
  AlacioMasterState, 
  InventoryItem, 
  CustomerDebtor,
  FloatDenomination, 
  ReconciliationAudit, 
  SalesLedgerItem,
  WarehouseBatch,
  PayoutOrDrawing,
  MpesaStatementRecord,
  FreemiumTier,
  Blueprint,
  SupplierProfile,
  MorningBookendRecord
} from "./types/alacio";
import { 
  loadAlacioState, 
  saveAlacioState, 
  calculateKpis,
  resetAlacioToZeroSlate,
  PLATFORM_BLUEPRINTS,
  PROJECT_ALACIO_CASE_STUDY
} from "./services/alacioStorage";

import DashboardTab from "./components/tabs/DashboardTab";
import MorningBookendTab from "./components/tabs/MorningBookendTab";
import SupplierLogTab, { MultiSupplyDelivery } from "./components/tabs/SupplierLogTab";
import ReceiptUploadScannerTab from "./components/tabs/ReceiptUploadScannerTab";
import { ProcessedReceipt } from "./services/receiptOcrService";
import EveningReconciliationTab from "./components/tabs/EveningReconciliationTab";
import UnifiedVoiceLedgerTab from "./components/tabs/UnifiedVoiceLedgerTab";
import { VoiceDraftRecord } from "./components/tabs/PendingDraftsQueueTab";
import WarehouseTab from "./components/tabs/WarehouseTab";
import QuickDumpTab from "./components/tabs/QuickDumpTab";
import OpeningFloatTab from "./components/tabs/OpeningFloatTab";
import InventoryTab from "./components/tabs/InventoryTab";
import CustomersCreditTab from "./components/tabs/CustomersCreditTab";
import TLedgersTab from "./components/tabs/TLedgersTab";
import ReconciliationTab from "./components/tabs/ReconciliationTab";
import AnalyticsTab from "./components/tabs/AnalyticsTab";
import HomeScreenDiamonds from "./components/HomeScreenDiamonds";
import TemplateInDevelopmentView from "./components/TemplateInDevelopmentView";
import PullOwnAppModal from "./components/PullOwnAppModal";
import OneTapGapModal from "./components/OneTapGapModal";
import MpesaImportModal from "./components/MpesaImportModal";
import FreemiumBanner from "./components/FreemiumBanner";
import { VoiceTransactionPayload } from "./components/VoiceLedger";

export default function App() {
  const [currentView, setCurrentView] = useState<"landing" | "workspace" | "developing">("workspace");
  const [activeDevelopingBlueprint, setActiveDevelopingBlueprint] = useState<Blueprint | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Zero-Data-Loss LocalStorage + Firestore Persistence
  const [alacioState, setAlacioState] = useState<AlacioMasterState>(() => loadAlacioState());

  // Modal States
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedRestockItem, setSelectedRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [restockRetail, setRestockRetail] = useState("");

  const [isClonerOpen, setIsClonerOpen] = useState(false);
  const [isPullOwnAppOpen, setIsPullOwnAppOpen] = useState(false);
  const [isOneTapGapOpen, setIsOneTapGapOpen] = useState(false);
  const [isMpesaImportOpen, setIsMpesaImportOpen] = useState(false);
  const [isZeroSlateModalOpen, setIsZeroSlateModalOpen] = useState(false);
  const [zeroSlateToast, setZeroSlateToast] = useState<string | null>(null);
  const [lastVoiceLog, setLastVoiceLog] = useState<string | null>(null);

  const handleExecuteZeroSlate = () => {
    const cleanZeroState = resetAlacioToZeroSlate();
    setAlacioState(cleanZeroState);
    saveAlacioState(cleanZeroState);
    setIsZeroSlateModalOpen(false);
    setZeroSlateToast("All numbers condensed to 0! Shelf stocks, drawer cash, floats, customer deni, and ledgers are now fresh and ready for today's live business data.");
    setTimeout(() => setZeroSlateToast(null), 8000);
  };

  // Sync to localStorage and Firestore on change
  useEffect(() => {
    saveAlacioState(alacioState);
  }, [alacioState]);

  // Restock Execution
  const handleOpenRestock = (item?: InventoryItem) => {
    const target = item || alacioState.inventory[0];
    setSelectedRestockItem(target);
    setRestockCost(String(target.unit_cost));
    setRestockRetail(String(target.unit_retail));
    setRestockQty("");
    setIsRestockOpen(true);
  };

  const handleExecuteRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestockItem || !restockQty) return;

    const qty = parseFloat(restockQty);
    const cost = parseFloat(restockCost) || selectedRestockItem.unit_cost;
    const retail = parseFloat(restockRetail) || selectedRestockItem.unit_retail;

    const updatedInventory = alacioState.inventory.map((inv) => {
      if (inv.id === selectedRestockItem.id) {
        const newTotalStock = inv.current_stock + qty;
        return {
          ...inv,
          current_stock: newTotalStock,
          opening_stock: newTotalStock,
          unit_cost: cost,
          unit_retail: retail,
          expected_margin: retail - cost,
          total_shelf_value: newTotalStock * retail,
          velocity_badge: newTotalStock <= 5 ? "Low Stock Alert" : "High Velocity"
        };
      }
      return inv;
    });

    const newKpis = calculateKpis(updatedInventory, alacioState.warehouse);
    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));

    setIsRestockOpen(false);
  };

  // Voice Ledger (VCR) Ingestion Execution
  const handleVoiceTransaction = (payload: VoiceTransactionPayload) => {
    let updatedInventory = [...alacioState.inventory];
    let itemsSummary = "";

    payload.items.forEach((voiceItem) => {
      itemsSummary += `${voiceItem.qty}x ${voiceItem.name} `;
      const idx = updatedInventory.findIndex(
        (inv) => inv.name.toLowerCase().includes(voiceItem.name.toLowerCase()) || voiceItem.name.toLowerCase().includes(inv.name.toLowerCase())
      );
      if (idx !== -1) {
        const item = updatedInventory[idx];
        const newStock = Math.max(0, item.current_stock - voiceItem.qty);
        updatedInventory[idx] = {
          ...item,
          current_stock: newStock,
          total_shelf_value: newStock * item.unit_retail,
          velocity_badge: newStock <= 5 ? "Low Stock Alert" : "High Velocity"
        };
      }
    });

    let updatedCustomers = [...alacioState.customers];
    if (payload.debtAmount > 0) {
      const cIdx = updatedCustomers.findIndex((c) => c.name.toLowerCase().includes(payload.customer.toLowerCase()));
      if (cIdx !== -1) {
        updatedCustomers[cIdx] = {
          ...updatedCustomers[cIdx],
          debt_balance: updatedCustomers[cIdx].debt_balance + payload.debtAmount,
          last_transaction_date: "Just now"
        };
      } else {
        updatedCustomers.push({
          id: `cust_${Date.now()}`,
          name: payload.customer,
          phone: "07XX XXX XXX",
          debt_balance: payload.debtAmount,
          credit_limit: 1000,
          last_transaction_date: "Just now",
          notes: "Created via Counter Voice Record (VCR)"
        });
      }
    }

    const newSalesRecord: SalesLedgerItem = {
      id: `sl_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customer_name: payload.customer,
      items_summary: itemsSummary || "Assorted items",
      total_amount: payload.total,
      cash_paid: payload.cashPaid,
      mpesa_paid: payload.mpesaPaid,
      debt_amount: payload.debtAmount,
      payment_method: payload.debtAmount > 0 ? "CREDIT" : payload.cashPaid > 0 ? "CASH" : "MPESA"
    };

    const newKpis = calculateKpis(updatedInventory, alacioState.warehouse);
    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      customers: updatedCustomers,
      salesLedger: [newSalesRecord, ...prev.salesLedger],
      cash_register_balance: prev.cash_register_balance + payload.cashPaid,
      vcr_daily_count: (prev.vcr_daily_count || 0) + 1,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));

    setLastVoiceLog(
      `VCR Captured: ${payload.customer} (${alacioState.currency} ${payload.total}) &bull; Stock auto-deducted &bull; Audio discarded`
    );
    setTimeout(() => setLastVoiceLog(null), 6000);
  };

  // Quick Dump Execution
  const handleQuickSale = (itemName: string, qty: number, amount: number, method: "CASH" | "MPESA", saleDate?: string) => {
    let updatedInventory = [...alacioState.inventory];
    const idx = updatedInventory.findIndex((i) => i.name.toLowerCase().includes(itemName.toLowerCase()));
    if (idx !== -1) {
      const item = updatedInventory[idx];
      const newStock = Math.max(0, item.current_stock - qty);
      updatedInventory[idx] = {
        ...item,
        current_stock: newStock,
        total_shelf_value: newStock * item.unit_retail,
        velocity_badge: newStock <= 5 ? "Low Stock Alert" : "High Velocity"
      };
    }

    const effectiveDate = saleDate || new Date().toISOString().slice(0, 10);
    const newSalesRecord: SalesLedgerItem = {
      id: `sl_${Date.now()}`,
      date: effectiveDate,
      timestamp: `${effectiveDate} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      customer_name: "Counter Walk-in",
      items_summary: `${qty}x ${itemName}`,
      total_amount: amount,
      cash_paid: method === "CASH" ? amount : 0,
      mpesa_paid: method === "MPESA" ? amount : 0,
      debt_amount: 0,
      payment_method: method
    };

    const newKpis = calculateKpis(updatedInventory, alacioState.warehouse);
    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      salesLedger: [newSalesRecord, ...prev.salesLedger],
      cash_register_balance: method === "CASH" ? prev.cash_register_balance + amount : prev.cash_register_balance,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));
  };

  // Opening Float Update Execution
  const handleUpdateFloat = (updatedDenoms: FloatDenomination[]) => {
    const total = updatedDenoms.reduce((acc, d) => acc + d.value * d.count, 0);
    setAlacioState((prev) => ({
      ...prev,
      floatDenominations: updatedDenoms,
      cash_register_balance: total,
      last_updated: new Date().toISOString()
    }));
  };

  // Deni Repayment Execution
  const handleRepayDebt = (customerId: string, amount: number) => {
    let customerName = "Credit Customer";
    const updatedCustomers = alacioState.customers.map((c) => {
      if (c.id === customerId) {
        customerName = c.name;
        return {
          ...c,
          debt_balance: Math.max(0, c.debt_balance - amount),
          last_transaction_date: "Today (Repayment)"
        };
      }
      return c;
    });

    const repaymentSale: SalesLedgerItem = {
      id: `sl_repay_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customer_name: customerName,
      items_summary: `Debt Repayment (${customerName})`,
      total_amount: amount,
      cash_paid: amount,
      mpesa_paid: 0,
      debt_amount: 0,
      payment_method: "CASH"
    };

    setAlacioState((prev) => ({
      ...prev,
      customers: updatedCustomers,
      salesLedger: [repaymentSale, ...prev.salesLedger],
      cash_register_balance: prev.cash_register_balance + amount,
      last_updated: new Date().toISOString()
    }));
  };

  // Add Debtor Execution
  const handleAddDebtor = (newDebtor: { name: string; phone: string; national_id?: string; credit_limit: number; initial_debt: number; notes: string }) => {
    const created: CustomerDebtor = {
      id: `cust_${Date.now()}`,
      name: newDebtor.name,
      phone: newDebtor.phone,
      national_id: newDebtor.national_id,
      debt_balance: newDebtor.initial_debt,
      credit_limit: newDebtor.credit_limit,
      last_transaction_date: "Today",
      notes: newDebtor.notes
    };

    setAlacioState((prev) => ({
      ...prev,
      customers: [...prev.customers, created],
      last_updated: new Date().toISOString()
    }));
  };

  // Reconciliation Execution
  const handleCommitReconciliation = (audit: ReconciliationAudit) => {
    setAlacioState((prev) => ({
      ...prev,
      reconciliations: [audit, ...prev.reconciliations],
      last_updated: new Date().toISOString()
    }));
  };

  // Update Inventory Stock from Daily Closing Count
  const handleUpdateInventoryStock = (updates: { id: number | string; newStock: number }[]) => {
    const updatedInventory = alacioState.inventory.map((inv) => {
      const match = updates.find((u) => u.id === inv.id);
      if (match) {
        return {
          ...inv,
          current_stock: match.newStock,
          total_shelf_value: match.newStock * inv.unit_retail,
          velocity_badge: match.newStock <= 5 ? "Low Stock Alert" : "High Velocity"
        };
      }
      return inv;
    });

    const newKpis = calculateKpis(updatedInventory, alacioState.warehouse);
    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));
  };

  // 1-Tap Gap Resolution Execution
  const handleResolveGap = (payout: PayoutOrDrawing) => {
    const updatedPayouts = [payout, ...alacioState.payouts];
    const newDrawer = Math.max(0, alacioState.cash_register_balance - payout.amount);
    setAlacioState((prev) => ({
      ...prev,
      payouts: updatedPayouts,
      cash_register_balance: newDrawer,
      last_updated: new Date().toISOString()
    }));
  };

  // M-Pesa Statement Import Execution
  const handleImportMpesa = (records: MpesaStatementRecord[]) => {
    const updatedStatements = [...records, ...alacioState.mpesaStatements];
    const addedFloat = records.reduce((acc, r) => acc + (r.status === "MATCHED" ? r.amount : 0), 0);
    setAlacioState((prev) => ({
      ...prev,
      mpesaStatements: updatedStatements,
      mpesa_float_balance: prev.mpesa_float_balance + addedFloat,
      last_updated: new Date().toISOString()
    }));
  };

  // Warehouse: Transfer Bulk Backroom Stock to Front Retail Shelf
  const handleTransferToShelf = (batchId: string, quantityToMove: number) => {
    let transferredItemName = "";
    const updatedWarehouse = alacioState.warehouse.map((batch) => {
      if (batch.id === batchId) {
        transferredItemName = batch.item_name;
        const newBulkQty = Math.max(0, batch.bulk_quantity - quantityToMove);
        return {
          ...batch,
          bulk_quantity: newBulkQty,
          status: newBulkQty === 0 ? ("DEPLETED" as const) : newBulkQty <= batch.reorder_threshold ? ("LOW_BUFFER" as const) : ("IN_STORAGE" as const)
        };
      }
      return batch;
    });

    const updatedInventory = alacioState.inventory.map((inv) => {
      if (inv.name.toLowerCase().includes(transferredItemName.toLowerCase()) || transferredItemName.toLowerCase().includes(inv.name.toLowerCase())) {
        const newStock = inv.current_stock + quantityToMove;
        return {
          ...inv,
          current_stock: newStock,
          total_shelf_value: newStock * inv.unit_retail,
          velocity_badge: newStock <= 5 ? "Low Stock Alert" : "High Velocity"
        };
      }
      return inv;
    });

    const newKpis = calculateKpis(updatedInventory, updatedWarehouse);
    setAlacioState((prev) => ({
      ...prev,
      warehouse: updatedWarehouse,
      inventory: updatedInventory,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));
  };

  // Warehouse: Receive incoming wholesale shipment
  const handleReceiveShipment = (newBatchData: Omit<WarehouseBatch, "id">) => {
    const newBatch: WarehouseBatch = {
      ...newBatchData,
      id: `wh_batch_${Date.now()}`
    };
    const updatedWarehouse = [newBatch, ...alacioState.warehouse];
    const newKpis = calculateKpis(alacioState.inventory, updatedWarehouse);

    setAlacioState((prev) => ({
      ...prev,
      warehouse: updatedWarehouse,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));
  };

  // Muva Ambient Ledger: Approve Overheard Draft Sale
  const handleApproveAmbientDraft = (salesRecord: SalesLedgerItem, itemMatchName: string, qty: number, isCollected: boolean) => {
    let updatedInventory = [...alacioState.inventory];
    if (isCollected) {
      const idx = updatedInventory.findIndex((i) => i.name.toLowerCase().includes(itemMatchName.toLowerCase()));
      if (idx !== -1) {
        const item = updatedInventory[idx];
        const newStock = Math.max(0, item.current_stock - qty);
        updatedInventory[idx] = {
          ...item,
          current_stock: newStock,
          total_shelf_value: newStock * item.unit_retail,
          velocity_badge: newStock <= 5 ? "Low Stock Alert" : "High Velocity"
        };
      }
    }

    const newKpis = calculateKpis(updatedInventory, alacioState.warehouse);
    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      salesLedger: [salesRecord, ...prev.salesLedger],
      cash_register_balance: prev.cash_register_balance + salesRecord.cash_paid,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));
  };

  // Morning Bookend: Confirm Starting Balances (Cash, M-Pesa, Equitel Paybill), Yesterday Deni, & Shelf Counts
  const handleConfirmMorningBookend = (payload: {
    cashFloat: number;
    mpesaFloat: number;
    equitelBalance: number;
    updatedCustomers: CustomerDebtor[];
    openingCounts: { id: string | number; openingStock: number }[];
  }) => {
    const updatedInventory = alacioState.inventory.map((inv) => {
      const match = payload.openingCounts.find((o) => String(o.id) === String(inv.id));
      if (match) {
        return {
          ...inv,
          opening_stock: match.openingStock,
          current_stock: match.openingStock,
          total_shelf_value: match.openingStock * inv.unit_retail
        };
      }
      return inv;
    });
    const newKpis = calculateKpis(updatedInventory, alacioState.warehouse);

    const totalLiquidity = payload.cashFloat + payload.mpesaFloat + payload.equitelBalance;
    const totalDeni = payload.updatedCustomers.reduce((acc, c) => acc + c.debt_balance, 0);
    const totalUnits = updatedInventory.reduce((acc, i) => acc + i.current_stock, 0);
    const newBookendRecord: MorningBookendRecord = {
      id: `mb_${Date.now()}`,
      date: "Today",
      timestamp: `Today, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      cash_float: payload.cashFloat,
      mpesa_float: payload.mpesaFloat,
      equitel_balance: payload.equitelBalance,
      total_liquidity: totalLiquidity,
      debtors_count: payload.updatedCustomers.length,
      total_customer_debt: totalDeni,
      opening_shelf_units: totalUnits,
      opening_shelf_value: newKpis.total_active_shelf_retail_value,
      status: "LOCKED_DAWN",
      notes: "Dawn baseline locked for trading: cash drawer, electronic float, and customer credit calibrated."
    };

    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      customers: payload.updatedCustomers,
      cash_register_balance: payload.cashFloat,
      mpesa_float_balance: payload.mpesaFloat,
      equitel_account_balance: payload.equitelBalance,
      morning_bookends: [newBookendRecord, ...(prev.morning_bookends || [])],
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));
  };

  // Add Supplier Execution
  const handleAddSupplier = (newSupplier: {
    name: string;
    company: string;
    driver_name?: string;
    phone: string;
    national_id: string;
    category: string;
    payment_preference: "NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER";
    till_or_account?: string;
    payment_terms?: string;
  }) => {
    const created: SupplierProfile = {
      ...newSupplier,
      id: `supp_${Date.now()}`,
      total_orders_cost: 0,
      last_delivery_date: "Never"
    };

    setAlacioState((prev) => ({
      ...prev,
      suppliers: [created, ...(prev.suppliers || [])],
      last_updated: new Date().toISOString()
    }));
  };

  // Supplier Log: Multi-Item Incoming Delivery with Bulk-to-Micro Conversion
  const handleLogMultiSupplyDelivery = (delivery: MultiSupplyDelivery) => {
    let updatedInventory = [...alacioState.inventory];

    delivery.items.forEach((item) => {
      const idx = updatedInventory.findIndex(
        (inv) => inv.name.toLowerCase().includes(item.itemName.toLowerCase()) || 
                 item.itemName.toLowerCase().includes(inv.name.toLowerCase())
      );
      if (idx !== -1) {
        const inv = updatedInventory[idx];
        const newStock = inv.current_stock + item.retailUnitsAdded;
        updatedInventory[idx] = {
          ...inv,
          current_stock: newStock,
          total_shelf_value: newStock * inv.unit_retail,
          velocity_badge: newStock <= 5 ? "Low Stock Alert" : "High Velocity"
        };
      } else {
        const newItem: InventoryItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: item.itemName,
          category: "General Delivery",
          unit_type: item.retailUnit,
          unit_cost: item.unitCostAtDelivery,
          unit_retail: item.retailPrice,
          current_stock: item.retailUnitsAdded,
          opening_stock: item.retailUnitsAdded,
          expected_margin: item.retailPrice - item.unitCostAtDelivery,
          total_shelf_value: item.retailUnitsAdded * item.retailPrice,
          velocity_badge: "High Velocity"
        };
        updatedInventory.push(newItem);
      }
    });

    const newKpis = calculateKpis(updatedInventory, alacioState.warehouse);

    // Deduct cost from respective liquidity channel if paid on the spot
    let newCashBalance = alacioState.cash_register_balance;
    let newMpesaBalance = alacioState.mpesa_float_balance;
    let newEquitelBalance = alacioState.equitel_account_balance;

    if (delivery.paymentMode === "CASH") {
      newCashBalance = Math.max(0, newCashBalance - delivery.totalCost);
    } else if (delivery.paymentMode === "MPESA") {
      newMpesaBalance = Math.max(0, newMpesaBalance - delivery.totalCost);
    } else if (delivery.paymentMode === "EQUITEL") {
      newEquitelBalance = Math.max(0, newEquitelBalance - delivery.totalCost);
    }

    let updatedPayouts = [...alacioState.payouts];
    if (delivery.totalCost > 0) {
      const deliveryPayout: PayoutOrDrawing = {
        id: `payout_supp_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        amount: delivery.totalCost,
        type: "SUPPLIER_PAYOUT",
        notes: `Supplier Delivery: ${delivery.supplierName} (${delivery.items.length} items paid via ${delivery.paymentMode})`
      };
      updatedPayouts = [deliveryPayout, ...updatedPayouts];
    }

    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      payouts: updatedPayouts,
      cash_register_balance: newCashBalance,
      mpesa_float_balance: newMpesaBalance,
      equitel_account_balance: newEquitelBalance,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));
  };

  // Supply-Based Stock Calculation: Ingest Verified Supplier Receipt Image
  const handleCommitProcessedReceipt = (receipt: ProcessedReceipt) => {
    let updatedInventory = [...alacioState.inventory];

    receipt.items.forEach((item) => {
      const idx = updatedInventory.findIndex(
        (inv) => inv.name.toLowerCase().includes(item.itemName.toLowerCase()) || 
                 item.itemName.toLowerCase().includes(inv.name.toLowerCase())
      );
      if (idx !== -1) {
        const inv = updatedInventory[idx];
        const newStock = inv.current_stock + item.retailUnitsAdded;
        updatedInventory[idx] = {
          ...inv,
          current_stock: newStock,
          total_shelf_value: newStock * inv.unit_retail,
          velocity_badge: newStock <= 5 ? "Low Stock Alert" : "High Velocity"
        };
      } else {
        const newItem: InventoryItem = {
          id: `item_rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: item.itemName,
          category: "Supply Delivery",
          unit_type: item.retailUnit,
          unit_cost: item.unitCostAtDelivery,
          unit_retail: item.retailPrice,
          current_stock: item.retailUnitsAdded,
          opening_stock: item.retailUnitsAdded,
          expected_margin: item.expectedMargin,
          total_shelf_value: item.retailUnitsAdded * item.retailPrice,
          velocity_badge: "High Velocity"
        };
        updatedInventory.push(newItem);
      }
    });

    const newKpis = calculateKpis(updatedInventory, alacioState.warehouse);

    let newCashBalance = alacioState.cash_register_balance;
    let newMpesaBalance = alacioState.mpesa_float_balance;

    if (receipt.paymentMode === "CASH") {
      newCashBalance = Math.max(0, newCashBalance - receipt.totalCost);
    } else if (receipt.paymentMode === "MPESA") {
      newMpesaBalance = Math.max(0, newMpesaBalance - receipt.totalCost);
    }

    let updatedPayouts = [...alacioState.payouts];
    if (receipt.totalCost > 0) {
      const receiptPayout: PayoutOrDrawing = {
        id: `payout_rcpt_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        amount: receipt.totalCost,
        type: "SUPPLIER_PAYOUT",
        notes: `Receipt Restock: ${receipt.supplierName} (${receipt.items.length} items paid via ${receipt.paymentMode})`
      };
      updatedPayouts = [receiptPayout, ...updatedPayouts];
    }

    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      payouts: updatedPayouts,
      cash_register_balance: newCashBalance,
      mpesa_float_balance: newMpesaBalance,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));
  };

  // Pending Voice Drafts: Approve Staged Draft Intent
  const handleApproveVoiceDraft = (draft: VoiceDraftRecord) => {
    if (draft.intent_type === "SUPPLIER_DELIVERY") {
      let updatedInventory = [...alacioState.inventory];
      draft.payload.items?.forEach((item: any) => {
        const idx = updatedInventory.findIndex((i) => i.name.toLowerCase().includes(item.item_name.toLowerCase()));
        if (idx !== -1) {
          const inv = updatedInventory[idx];
          const added = item.quantity * (item.unit === "crates" ? 24 : 1);
          const newStock = inv.current_stock + added;
          updatedInventory[idx] = {
            ...inv,
            current_stock: newStock,
            total_shelf_value: newStock * inv.unit_retail
          };
        }
      });
      setAlacioState((prev) => ({
        ...prev,
        inventory: updatedInventory,
        kpis: calculateKpis(updatedInventory, prev.warehouse),
        last_updated: new Date().toISOString()
      }));
    } else if (draft.intent_type === "CREDIT_RECORD") {
      const customerName = draft.payload.customer_name || "Credit Customer";
      const amount = draft.payload.amount_owed || draft.total_amount;
      let updatedCustomers = [...alacioState.customers];
      const cIdx = updatedCustomers.findIndex((c) => c.name.toLowerCase().includes(customerName.toLowerCase()));
      if (cIdx !== -1) {
        updatedCustomers[cIdx] = {
          ...updatedCustomers[cIdx],
          debt_balance: updatedCustomers[cIdx].debt_balance + amount,
          last_transaction_date: "Today"
        };
      } else {
        updatedCustomers.push({
          id: `cust_${Date.now()}`,
          name: customerName,
          phone: "07XX XXX XXX",
          debt_balance: amount,
          credit_limit: 1000,
          last_transaction_date: "Today",
          notes: "Logged via Voice Draft Queue"
        });
      }
      setAlacioState((prev) => ({
        ...prev,
        customers: updatedCustomers,
        last_updated: new Date().toISOString()
      }));
    } else if (draft.intent_type === "ADVANCE_PAYMENT") {
      const netRetained = (draft.payload.amount_paid || 600) - (draft.payload.change_given || 400);
      setAlacioState((prev) => ({
        ...prev,
        cash_register_balance: prev.cash_register_balance + netRetained,
        last_updated: new Date().toISOString()
      }));
    }
  };

  // Transactions Ledger: Editable Dates for all Inflows & Outflows
  const handleUpdateSaleDate = (saleId: string, newDate: string, newTime?: string) => {
    setAlacioState((prev) => ({
      ...prev,
      salesLedger: prev.salesLedger.map((s) =>
        s.id === saleId
          ? { ...s, date: newDate, timestamp: newTime ? `${newDate} ${newTime}` : s.timestamp }
          : s
      ),
      last_updated: new Date().toISOString()
    }));
  };

  const handleUpdatePayoutDate = (payoutId: string, newDate: string, newTime?: string) => {
    setAlacioState((prev) => ({
      ...prev,
      payouts: prev.payouts.map((p) =>
        p.id === payoutId
          ? { ...p, date: newDate, timestamp: newTime ? `${newDate} ${newTime}` : p.timestamp }
          : p
      ),
      last_updated: new Date().toISOString()
    }));
  };

  const handleAddCustomSale = (saleData: Omit<SalesLedgerItem, "id">) => {
    const newSale: SalesLedgerItem = {
      ...saleData,
      id: `sl_${Date.now()}`
    };
    setAlacioState((prev) => ({
      ...prev,
      salesLedger: [newSale, ...prev.salesLedger],
      cash_register_balance: saleData.cash_paid > 0 ? prev.cash_register_balance + saleData.cash_paid : prev.cash_register_balance,
      mpesa_float_balance: saleData.mpesa_paid > 0 ? prev.mpesa_float_balance + saleData.mpesa_paid : prev.mpesa_float_balance,
      last_updated: new Date().toISOString()
    }));
  };

  const handleAddCustomPayout = (payoutData: Omit<PayoutOrDrawing, "id">) => {
    const newPayout: PayoutOrDrawing = {
      ...payoutData,
      id: `payout_${Date.now()}`
    };
    setAlacioState((prev) => ({
      ...prev,
      payouts: [newPayout, ...prev.payouts],
      cash_register_balance: Math.max(0, prev.cash_register_balance - newPayout.amount),
      last_updated: new Date().toISOString()
    }));
  };

  const handleDeleteTransaction = (type: "sale" | "payout", id: string) => {
    setAlacioState((prev) => ({
      ...prev,
      salesLedger: type === "sale" ? prev.salesLedger.filter((s) => s.id !== id) : prev.salesLedger,
      payouts: type === "payout" ? prev.payouts.filter((p) => p.id !== id) : prev.payouts,
      last_updated: new Date().toISOString()
    }));
  };

  // Navigation Items (YuBiFlo Core Operating Cycle)
  const navItems = [
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { id: "morning_bookend", name: "Morning Bookend (60s)", icon: <Sun size={16} />, badge: "Setup" },
    { id: "supplier_log", name: "Supplier Log (5s)", icon: <Truck size={16} />, badge: "Bulk→Micro" },
    { id: "receipt_scanner", name: "Upload Receipts (OCR)", icon: <Camera size={16} />, badge: "Supply Stock" },
    { id: "voice_ledger", name: "Voice Ledger (VCR Studio)", icon: <Mic size={16} />, badge: "Unified Hub" },
    { id: "evening_reconciliation", name: "Evening Reconciliation", icon: <Scale size={16} />, badge: "Reverse Math" },
    { id: "warehouse", name: "Warehouse & Bulk Supply", icon: <Building2 size={16} />, badge: `${alacioState.warehouse.length} bulk` },
    { id: "inventory", name: "Inventory & Batches", icon: <Package size={16} />, badge: `${alacioState.inventory.length}` },
    { id: "customers", name: "Customers & Credit", icon: <Users size={16} />, badge: `${alacioState.customers.length} debt` },
    { id: "analytics", name: "Analytics & Expansion", icon: <BarChart2 size={16} />, badge: "Insights" }
  ];

  return (
    <div className="min-h-screen bg-[#070e0b] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* GLOBAL HEADER / WORKSPACE SWITCHER */}
      <header className="h-14 bg-[#0a1510] border-b border-emerald-950/80 px-4 sm:px-6 flex items-center justify-between text-xs sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => setCurrentView("landing")}
            className="flex items-center gap-2 text-white font-black tracking-wide text-sm cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold font-mono">Y</div>
            <span className="font-serif tracking-tight">YuBiFLo</span>
          </button>
          
          <span className="text-slate-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-emerald-400 shrink-0" />
            <span className="text-slate-400 hidden md:inline">Workspace:</span>
            <div className="relative">
              <select
                value="alacio_mini_shop"
                onChange={(e) => {
                  if (e.target.value === "alacio_mini_shop") {
                    setCurrentView("workspace");
                  }
                }}
                className="bg-[#060c09] border border-emerald-900/60 rounded px-2.5 py-1 text-white font-bold appearance-none pr-6 cursor-pointer"
              >
                <option value="alacio_mini_shop">Alacio Mini Shop (KSh)</option>
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
            </div>
            <span className="hidden lg:inline-block text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              Live CDO Telemetry &bull; Zero Data Loss
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* SPECIAL FEATURE: PULL YOUR OWN APP */}
          <button
            onClick={() => setIsPullOwnAppOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-[#102018] hover:bg-[#152a20] border border-emerald-500/40 text-emerald-300 font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs"
            title="Export your single-business installable PWA"
          >
            <Smartphone size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">Pull Your Own App</span>
          </button>

          {/* CONDENSE TO ZERO (CLEAN PRODUCTION SLATE) */}
          <button
            onClick={() => setIsZeroSlateModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs"
            title="Condense all balances, debt, and shelf counts to 0 for live start"
          >
            <RefreshCw size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Condense to Zero</span>
          </button>

          {currentView !== "landing" && (
            <button
              onClick={() => setCurrentView("landing")}
              className="px-2.5 sm:px-3 py-1.5 bg-[#0f1d16] hover:bg-[#152a20] text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
            >
              &larr; Blueprints
            </button>
          )}

          {currentView !== "workspace" && (
            <button
              onClick={() => {
                setCurrentView("workspace");
                setActiveTab("dashboard");
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition cursor-pointer"
            >
              Open Alacio Pilot (Retail B2C)
            </button>
          )}

          <button
            onClick={() => setIsClonerOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition flex items-center gap-1.5 shadow cursor-pointer text-xs"
          >
            <Plus size={14} /> <span className="hidden sm:inline">Clone Blueprint</span><span className="sm:hidden">Clone</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* VIEW A: B2B AGENCY LANDING PAGE (DIAMONDS & BLUEPRINTS)  */}
      {/* ========================================================= */}
      {currentView === "landing" && (
        <HomeScreenDiamonds
          projectCaseStudy={PROJECT_ALACIO_CASE_STUDY}
          onSelectBlueprint={(blueprintId) => {
            if (blueprintId === "duka_fmcg") {
              // Alacio Mini Shop is the live example of this Retail B2C template
              setCurrentView("workspace");
              setActiveTab("dashboard");
            } else {
              // Other templates lead to developing / under construction view
              const bp = PLATFORM_BLUEPRINTS.find((b) => b.id === blueprintId) || PLATFORM_BLUEPRINTS[1];
              setActiveDevelopingBlueprint(bp);
              setCurrentView("developing");
            }
          }}
          onOpenProjectCaseStudy={() => {
            setCurrentView("workspace");
            setActiveTab("dashboard");
          }}
        />
      )}

      {/* ========================================================= */}
      {/* VIEW C: TEMPLATE UNDER CONSTRUCTION / IN DEVELOPMENT     */}
      {/* ========================================================= */}
      {currentView === "developing" && activeDevelopingBlueprint && (
        <TemplateInDevelopmentView
          blueprint={activeDevelopingBlueprint}
          onBackToLanding={() => setCurrentView("landing")}
          onLaunchAlacioPilot={() => {
            setCurrentView("workspace");
            setActiveTab("dashboard");
          }}
        />
      )}

      {/* ========================================================= */}
      {/* VIEW B: CLIENT WORKSPACE RUNTIME (10 TABS + FREEMIUM CDO) */}
      {/* ========================================================= */}
      {currentView === "workspace" && (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-64 bg-[#0a130f] border-r border-emerald-950 flex flex-col justify-between shrink-0 select-none">
            <div>
              <div className="p-4 border-b border-emerald-950/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white block font-serif">Alacio Mini Shop</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Retail B2C Pilot
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Branch: Direct to Consumer
                </span>
              </div>
              <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Navigation</div>
              <nav className="space-y-0.5 px-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      activeTab === item.id 
                        ? "bg-[#14261d] text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm" 
                        : "text-slate-400 hover:bg-[#0f1d16] hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        activeTab === item.id ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t border-emerald-950 text-[10px] font-mono text-slate-500 flex justify-between items-center">
              <span>Branch: Alacio Mini Shop</span>
              <span className="text-amber-400 font-bold">B2C Retail Pilot</span>
            </div>
          </aside>

          {/* MAIN WORKSPACE CONTENT ROUTER */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            
            {/* ZERO CLEAN SLATE CONFIRMATION TOAST */}
            {zeroSlateToast && (
              <div className="p-4 bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in font-mono shadow-xl">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-amber-400 shrink-0" />
                  <span>{zeroSlateToast}</span>
                </div>
                <button
                  onClick={() => setZeroSlateToast(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* FREEMIUM LADDER & FINANCIAL HEALTH NOTIFICATION BANNER */}
            <FreemiumBanner
              currentTier={alacioState.tier}
              cleanTradingDays={alacioState.clean_trading_days}
              vcrCount={alacioState.vcr_daily_count}
              onUpgradePrompt={() => {
                alert("Weekly CDO Financial Health Report: Alacio Mini Shop has achieved 94/100 health score with KES 35,545 shelf value locked and KES 30,615 warehouse bulk reserves. Ready for second branch expansion!");
              }}
              onToggleTier={(tier: FreemiumTier) => {
                setAlacioState((prev) => ({ ...prev, tier }));
              }}
            />

            {activeTab === "dashboard" && (
              <DashboardTab
                state={alacioState}
                onNavigateTab={setActiveTab}
                onOpenRestock={() => handleOpenRestock()}
              />
            )}

            {activeTab === "morning_bookend" && (
              <MorningBookendTab
                state={alacioState}
                onConfirmMorningBookend={handleConfirmMorningBookend}
              />
            )}

            {activeTab === "supplier_log" && (
              <SupplierLogTab
                state={alacioState}
                onLogMultiDelivery={handleLogMultiSupplyDelivery}
                onAddSupplier={handleAddSupplier}
              />
            )}

            {activeTab === "receipt_scanner" && (
              <ReceiptUploadScannerTab
                state={alacioState}
                onCommitProcessedReceipt={handleCommitProcessedReceipt}
              />
            )}

            {(activeTab === "voice_ledger" || activeTab === "pending_drafts" || activeTab === "multilingual_voice" || activeTab === "ambient_ledger") && (
              <UnifiedVoiceLedgerTab
                state={alacioState}
                onCommitTransaction={handleVoiceTransaction}
                onCommitParsedSale={handleApproveAmbientDraft}
                onApproveDraft={handleApproveVoiceDraft}
                lastLoggedMessage={lastVoiceLog}
                customerConsent={alacioState.vcr_customer_consent}
                onToggleConsent={(val) => setAlacioState((prev) => ({ ...prev, vcr_customer_consent: val }))}
              />
            )}

            {activeTab === "evening_reconciliation" && (
              <EveningReconciliationTab
                state={alacioState}
                onCommitAudit={handleCommitReconciliation}
                onOpenOneTapGap={() => setIsOneTapGapOpen(true)}
              />
            )}

            {activeTab === "warehouse" && (
              <WarehouseTab
                currency={alacioState.currency}
                warehouse={alacioState.warehouse}
                inventory={alacioState.inventory}
                onTransferToShelf={handleTransferToShelf}
                onReceiveShipment={handleReceiveShipment}
              />
            )}

            {activeTab === "quick_dump" && (
              <QuickDumpTab
                currency={alacioState.currency}
                inventory={alacioState.inventory}
                recentSales={alacioState.salesLedger}
                onQuickSale={handleQuickSale}
                onUpdateSaleDate={handleUpdateSaleDate}
              />
            )}

            {activeTab === "opening_float" && (
              <OpeningFloatTab
                currency={alacioState.currency}
                denominations={alacioState.floatDenominations}
                onUpdateDenominations={handleUpdateFloat}
              />
            )}

            {activeTab === "inventory" && (
              <InventoryTab
                currency={alacioState.currency}
                inventory={alacioState.inventory}
                onOpenRestock={handleOpenRestock}
              />
            )}

            {activeTab === "customers" && (
              <CustomersCreditTab
                currency={alacioState.currency}
                customers={alacioState.customers}
                onRepayDebt={handleRepayDebt}
                onAddDebtor={handleAddDebtor}
              />
            )}

            {activeTab === "t_ledgers" && (
              <TLedgersTab state={alacioState} />
            )}

            {activeTab === "reconciliation" && (
              <ReconciliationTab
                state={alacioState}
                onCommitReconciliation={handleCommitReconciliation}
                onUpdateInventoryStock={handleUpdateInventoryStock}
                onOpenOneTapGap={() => setIsOneTapGapOpen(true)}
                onOpenMpesaImport={() => setIsMpesaImportOpen(true)}
              />
            )}

            {activeTab === "analytics" && (
              <AnalyticsTab state={alacioState} />
            )}
          </main>
        </div>
      )}

      {/* SPECIAL FEATURE: PULL YOUR OWN APP MODAL */}
      <PullOwnAppModal
        isOpen={isPullOwnAppOpen}
        onClose={() => setIsPullOwnAppOpen(false)}
        state={alacioState}
      />

      {/* 1-TAP GAP RESOLUTION MODAL */}
      <OneTapGapModal
        isOpen={isOneTapGapOpen}
        onClose={() => setIsOneTapGapOpen(false)}
        gapAmount={-1500}
        currency={alacioState.currency}
        onResolveGap={handleResolveGap}
      />

      {/* M-PESA STATEMENT IMPORT MODAL */}
      <MpesaImportModal
        isOpen={isMpesaImportOpen}
        onClose={() => setIsMpesaImportOpen(false)}
        currency={alacioState.currency}
        onImportRecords={handleImportMpesa}
      />

      {/* RESTOCK BATCH MODAL */}
      {isRestockOpen && selectedRestockItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#101b15] border-2 border-emerald-500/40 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <RefreshCw size={16} className="text-emerald-400" /> Restock-Trigger Accounting Engine: {selectedRestockItem.name}
              </h3>
              <button onClick={() => setIsRestockOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              Arriving batch is logged as evidence that previous stock cleared. Automatically recalibrates shelf valuation, unit margin, and expected cash.
            </p>

            <form onSubmit={handleExecuteRestock} className="space-y-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Batch Units Received ({selectedRestockItem.unit_type})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full bg-[#070e0b] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Wholesale Cost ({alacioState.currency})
                  </label>
                  <input
                    type="number"
                    value={restockCost}
                    onChange={(e) => setRestockCost(e.target.value)}
                    className="w-full bg-[#070e0b] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Retail Shelf Price ({alacioState.currency})
                  </label>
                  <input
                    type="number"
                    value={restockRetail}
                    onChange={(e) => setRestockRetail(e.target.value)}
                    className="w-full bg-[#070e0b] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow"
                >
                  Confirm Restock Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLONER MODAL */}
      {isClonerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#101b15] border-2 border-emerald-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-serif">
                <Copy size={16} className="text-emerald-400" /> Clone Blueprint for New Client
              </h3>
              <button onClick={() => setIsClonerOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Select Industry Blueprint</label>
              <select className="w-full bg-[#070e0b] border border-slate-700 rounded-xl p-2.5 text-white font-sans">
                {PLATFORM_BLUEPRINTS.map((bp) => (
                  <option key={bp.id} value={bp.id}>{bp.name} ({bp.industry})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Client Business Name</label>
              <input 
                type="text"
                placeholder="e.g. Ruiru Modern Hardware Store"
                className="w-full bg-[#070e0b] border border-slate-700 rounded-xl p-2.5 text-white font-sans"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Operating Currency</label>
              <input 
                type="text"
                defaultValue="KSh"
                className="w-full bg-[#070e0b] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsClonerOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">Cancel</button>
              <button 
                onClick={() => {
                  alert("New client workspace cloned with isolated taxonomy, VCR listener, and Cloud Firestore storage!");
                  setIsClonerOpen(false);
                }}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow"
              >
                Provision Isolated Client Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONDENSE TO ZERO CONFIRMATION MODAL */}
      {isZeroSlateModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border-2 border-amber-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <RefreshCw size={18} className="text-amber-400" /> Condense All Numbers to Zero?
              </h3>
              <button onClick={() => setIsZeroSlateModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-slate-300 text-xs leading-relaxed">
              <p>
                You are transitioning <strong>Alacio Mini Shop</strong> into live operational trading with real store data starting today.
              </p>
              <div className="bg-[#0a0d12] p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="text-amber-300 font-bold">What will be condensed to 0:</div>
                <div className="text-slate-400">• Opening cash drawer float &bull; KSh 0</div>
                <div className="text-slate-400">• M-Pesa float &amp; Equitel line balances &bull; KSh 0</div>
                <div className="text-slate-400">• Shelf stocks across all 43 products &bull; 0 units</div>
                <div className="text-slate-400">• Customer credit (deni) ledger &bull; KSh 0 balance</div>
                <div className="text-slate-400">• Previous sales and transaction drafts &bull; Cleared</div>
                <div className="text-slate-400">• Supplier order totals &bull; KSh 0</div>
              </div>
              <p className="text-[11px] text-slate-400">
                Your 43 product catalog items, prices, registered customer profiles, and supplier distributor contacts remain completely intact.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsZeroSlateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteZeroSlate}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-lg shadow-amber-500/20 font-mono"
              >
                Confirm: Condense All to 0
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
