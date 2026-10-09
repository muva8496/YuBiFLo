import React, { useState, useEffect } from "react";
import { 
  Building2, Globe, Plus, ChevronDown, Copy, X, ArrowRight, Sparkles, 
  AlertTriangle, Layers, Database, BarChart3, BrainCircuit, Eye, 
  LayoutDashboard, Mic, Zap, Clock, Package, Users, Scale, RefreshCw, BarChart2,
  Smartphone, HelpCircle, Download, Radio, Sun, Truck, Languages, Camera, CheckCircle2,
  ArrowUpDown, BookOpen, TrendingUp, Cpu, ShieldCheck
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
  PLATFORM_BLUEPRINTS,
  PROJECT_ALACIO_CASE_STUDY
} from "./services/alacioStorage";
import { 
  upsertMorningBookend, 
  deduplicateMorningBookends, 
  resolveRecordIsoDate, 
  formatRecordDisplayLabel 
} from "./utils/morningBookendHelper";
import { 
  upsertSupplier, 
  deduplicateSuppliers 
} from "./utils/supplierHelper";

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
import ProprietorDataWarehouseTab from "./components/tabs/ProprietorDataWarehouseTab";
import SupplyDrivenSalesTab from "./components/tabs/SupplyDrivenSalesTab";
import LedgerAccountsHubTab from "./components/tabs/LedgerAccountsHubTab";
import SupplyStockVaultTab from "./components/tabs/SupplyStockVaultTab";
import SystemArchitectureTab from "./components/tabs/SystemArchitectureTab";
import HomeScreenDiamonds from "./components/HomeScreenDiamonds";
import TemplateInDevelopmentView from "./components/TemplateInDevelopmentView";
import OneTapGapModal from "./components/OneTapGapModal";
import MpesaImportModal from "./components/MpesaImportModal";
import FreemiumBanner from "./components/FreemiumBanner";
import { VoiceTransactionPayload } from "./components/VoiceLedger";
import YuBiFloEnterpriseCommand from "./components/YuBiFloEnterpriseCommand";
import YuBiFloLandingPage from "./components/YuBiFloLandingPage";
import AlacioAccessGateModal from "./components/AlacioAccessGateModal";

export default function App() {
  const [currentView, setCurrentView] = useState<"landing" | "workspace" | "developing" | "yubiflo_command">("landing");
  const [activeDevelopingBlueprint, setActiveDevelopingBlueprint] = useState<Blueprint | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Client Workspace Access Security: Must enter password "8496"
  const [isAlacioUnlocked, setIsAlacioUnlocked] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingActionAfterPassword, setPendingActionAfterPassword] = useState<(() => void) | null>(null);

  // Zero-Data-Loss LocalStorage + Firestore Persistence
  const [alacioState, setAlacioState] = useState<AlacioMasterState>(() => loadAlacioState());

  // Modal States
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedRestockItem, setSelectedRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [restockRetail, setRestockRetail] = useState("");

  const [isOneTapGapOpen, setIsOneTapGapOpen] = useState(false);
  const [isMpesaImportOpen, setIsMpesaImportOpen] = useState(false);
  const [lastVoiceLog, setLastVoiceLog] = useState<string | null>(null);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  // Sync to localStorage and Firestore on change
  useEffect(() => {
    saveAlacioState(alacioState);
  }, [alacioState]);

  // Gatekeeper: Protected client property requiring password "8496"
  const handleGuardedEnterWorkspace = (targetTab: string = "dashboard") => {
    if (isAlacioUnlocked) {
      setCurrentView("workspace");
      setActiveTab(targetTab);
    } else {
      setPendingActionAfterPassword(() => () => {
        setIsAlacioUnlocked(true);
        setCurrentView("workspace");
        setActiveTab(targetTab);
      });
      setIsPasswordModalOpen(true);
    }
  };

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

  // Edit Customer Account: Correct mis-typed phone number, Kenyan National ID, or credit details
  const handleEditCustomer = (customerId: string, updatedData: Partial<CustomerDebtor>) => {
    setAlacioState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === customerId ? { ...c, ...updatedData } : c)),
      last_updated: new Date().toISOString()
    }));
  };

  // Delete Customer Account: Safe removal of customer entered wrong (all other data preserved)
  const handleDeleteCustomer = (customerId: string) => {
    setAlacioState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== customerId),
      last_updated: new Date().toISOString()
    }));
  };

  // Reconciliation Execution: Later overwrites former if entered twice for same date
  const handleCommitReconciliation = (audit: ReconciliationAudit) => {
    setAlacioState((prev) => {
      const filtered = (prev.reconciliations || []).filter((r) => r.date !== audit.date);
      return {
        ...prev,
        reconciliations: [audit, ...filtered],
        last_updated: new Date().toISOString()
      };
    });
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
  // RULE: If values were entered twice for the same date, always consider later information to overwrite former (no losing data)
  const handleConfirmMorningBookend = (payload: {
    cashFloat: number;
    mpesaFloat: number;
    equitelBalance: number;
    updatedCustomers: CustomerDebtor[];
    openingCounts: { id: string | number; openingStock: number }[];
    baselineDate?: string;
    baselineTime?: string;
    notes?: string;
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

    const todayIso = new Date().toISOString().slice(0, 10);
    const targetIsoDate = payload.baselineDate || todayIso;
    const recordDateLabel = formatRecordDisplayLabel(targetIsoDate);

    const timestampLabel = payload.baselineTime
      ? `${recordDateLabel}, ${payload.baselineTime}`
      : `${recordDateLabel}, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    const newBookendRecord: MorningBookendRecord = {
      id: `mb_${Date.now()}`,
      iso_date: targetIsoDate,
      date: recordDateLabel,
      timestamp: timestampLabel,
      cash_float: payload.cashFloat,
      mpesa_float: payload.mpesaFloat,
      equitel_balance: payload.equitelBalance,
      total_liquidity: totalLiquidity,
      debtors_count: payload.updatedCustomers.length,
      total_customer_debt: totalDeni,
      opening_shelf_units: totalUnits,
      opening_shelf_value: newKpis.total_active_shelf_retail_value,
      status: "LOCKED_DAWN",
      notes: payload.notes || `Dawn baseline locked for trading (${recordDateLabel}): cash drawer, electronic float, and customer credit calibrated.`,
      updated_at: new Date().toISOString()
    };

    setAlacioState((prev) => {
      // Later information overwrites former if date entered twice; all other dates preserved!
      const { records: updatedMorningBookends } = upsertMorningBookend(prev.morning_bookends || [], newBookendRecord);

      return {
        ...prev,
        inventory: updatedInventory,
        customers: payload.updatedCustomers,
        cash_register_balance: payload.cashFloat,
        mpesa_float_balance: payload.mpesaFloat,
        equitel_account_balance: payload.equitelBalance,
        morning_bookends: updatedMorningBookends,
        kpis: newKpis,
        last_updated: new Date().toISOString()
      };
    });
  };

  // Morning Bookend: Retrospective / Inline Date Correction for Historical Audit Entries
  // If date is updated to match another record, later information overwrites former without data loss
  const handleUpdateMorningBookendDate = (recordId: string, newDate: string, newTimestamp?: string, newNotes?: string, newIsoDate?: string) => {
    setAlacioState((prev) => {
      const existingRecords = prev.morning_bookends || [];
      const targetRecord = existingRecords.find((mb) => mb.id === recordId);
      if (!targetRecord) return prev;

      const targetIso = newIsoDate || (newDate.match(/^\d{4}-\d{2}-\d{2}$/) ? newDate : resolveRecordIsoDate({ ...targetRecord, date: newDate }));
      const displayLabel = formatRecordDisplayLabel(targetIso);

      const updatedRecord: MorningBookendRecord = {
        ...targetRecord,
        iso_date: targetIso,
        date: displayLabel,
        timestamp: newTimestamp ?? (targetRecord.timestamp.includes(",") ? `${displayLabel}, ${targetRecord.timestamp.split(",").slice(1).join(",").trim()}` : displayLabel),
        notes: newNotes !== undefined ? newNotes : targetRecord.notes,
        updated_at: new Date().toISOString(),
        was_overwritten: true
      };

      // Filter out this record and any former record that shared targetIso (later overwrites former)
      const others = existingRecords.filter((mb) => mb.id !== recordId && resolveRecordIsoDate(mb) !== targetIso);
      const updatedList = [updatedRecord, ...others];

      return {
        ...prev,
        morning_bookends: deduplicateMorningBookends(updatedList),
        last_updated: new Date().toISOString()
      };
    });
  };

  // Add Supplier Execution: Guarantees no matter how many times Enter is pressed, suppliers only recorded once (no data lost)
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
    setAlacioState((prev) => {
      const { updatedList } = upsertSupplier(prev.suppliers || [], newSupplier);
      return {
        ...prev,
        suppliers: updatedList,
        last_updated: new Date().toISOString()
      };
    });
  };

  // Edit Supplier Account: Correct mis-typed company name, phone, or Kenyan National ID digits
  const handleEditSupplier = (supplierId: string, updatedData: Partial<SupplierProfile>) => {
    setAlacioState((prev) => ({
      ...prev,
      suppliers: (prev.suppliers || []).map((s) => (s.id === supplierId ? { ...s, ...updatedData } : s)),
      last_updated: new Date().toISOString()
    }));
  };

  // Delete Supplier Account: Safe removal of wrongly entered supplier profile
  const handleDeleteSupplier = (supplierId: string) => {
    setAlacioState((prev) => ({
      ...prev,
      suppliers: (prev.suppliers || []).filter((s) => s.id !== supplierId),
      last_updated: new Date().toISOString()
    }));
  };

  // Edit Warehouse Batch: Correct wholesale cost, bulk quantity, location, or batch code
  const handleEditWarehouseBatch = (batchId: string, updatedData: Partial<WarehouseBatch>) => {
    setAlacioState((prev) => {
      const updatedWh = prev.warehouse.map((b) => (b.id === batchId ? { ...b, ...updatedData } : b));
      return {
        ...prev,
        warehouse: updatedWh,
        kpis: calculateKpis(prev.inventory, updatedWh),
        last_updated: new Date().toISOString()
      };
    });
  };

  // Delete Warehouse Batch: Safe removal of wrongly entered batch
  const handleDeleteWarehouseBatch = (batchId: string) => {
    setAlacioState((prev) => {
      const updatedWh = prev.warehouse.filter((b) => b.id !== batchId);
      return {
        ...prev,
        warehouse: updatedWh,
        kpis: calculateKpis(prev.inventory, updatedWh),
        last_updated: new Date().toISOString()
      };
    });
  };

  // Delete Morning Baseline: Safe removal of wrongly entered morning bookend
  const handleDeleteMorningBookend = (recordId: string) => {
    setAlacioState((prev) => ({
      ...prev,
      morning_bookends: (prev.morning_bookends || []).filter((b) => b.id !== recordId),
      last_updated: new Date().toISOString()
    }));
  };

  // Proprietor Direct Data Warehouse & Database Root Access Handlers
  const handleDirectUpdateRecord = (collectionKey: string, recordId: string | number, updatedRecord: any) => {
    setAlacioState((prev) => {
      const list = (prev as any)[collectionKey];
      if (!Array.isArray(list)) return prev;
      const updatedList = list.map((item: any) => {
        const itemId = item.id ?? item.item_id;
        return (itemId === recordId || item.id === recordId) ? { ...item, ...updatedRecord } : item;
      });
      const newState: AlacioMasterState = {
        ...prev,
        [collectionKey]: updatedList,
        last_updated: new Date().toISOString()
      };
      if (collectionKey === "inventory" || collectionKey === "warehouse") {
        newState.kpis = calculateKpis(newState.inventory, newState.warehouse);
      }
      return newState;
    });
  };

  const handleDirectDeleteRecord = (collectionKey: string, recordId: string | number) => {
    setAlacioState((prev) => {
      const list = (prev as any)[collectionKey];
      if (!Array.isArray(list)) return prev;
      const filteredList = list.filter((item: any) => {
        const itemId = item.id ?? item.item_id;
        return itemId !== recordId && item.id !== recordId;
      });
      const newState: AlacioMasterState = {
        ...prev,
        [collectionKey]: filteredList,
        last_updated: new Date().toISOString()
      };
      if (collectionKey === "inventory" || collectionKey === "warehouse") {
        newState.kpis = calculateKpis(newState.inventory, newState.warehouse);
      }
      return newState;
    });
  };

  const handleDirectInsertRecord = (collectionKey: string, newRecord: any) => {
    setAlacioState((prev) => {
      const list = (prev as any)[collectionKey];
      const currentList = Array.isArray(list) ? list : [];
      const updatedList = [newRecord, ...currentList];
      const newState: AlacioMasterState = {
        ...prev,
        [collectionKey]: updatedList,
        last_updated: new Date().toISOString()
      };
      if (collectionKey === "inventory" || collectionKey === "warehouse") {
        newState.kpis = calculateKpis(newState.inventory, newState.warehouse);
      }
      return newState;
    });
  };

  const handleDirectRestoreFullState = (newState: AlacioMasterState) => {
    setAlacioState(newState);
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

    // Update supplier historical orders total & last delivery date
    let updatedSuppliers = deduplicateSuppliers([...(alacioState.suppliers || [])]);
    const suppIdx = updatedSuppliers.findIndex(
      (s) => (delivery.supplierNationalId && s.national_id === delivery.supplierNationalId) ||
             (s.company && delivery.supplierName && s.company.toLowerCase().includes(delivery.supplierName.toLowerCase())) ||
             (s.name && delivery.supplierName && s.name.toLowerCase().includes(delivery.supplierName.toLowerCase()))
    );
    const dateLabel = delivery.date || new Date().toISOString().slice(0, 10);
    if (suppIdx !== -1) {
      updatedSuppliers[suppIdx] = {
        ...updatedSuppliers[suppIdx],
        total_orders_cost: (Number(updatedSuppliers[suppIdx].total_orders_cost) || 0) + delivery.totalCost,
        last_delivery_date: dateLabel
      };
    }

    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      suppliers: updatedSuppliers,
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

  // Quick Sales & Inflow Date Updates
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

  // Supply-Driven Sales Engine Execution: Crystallizes implied sales when new supply box arrives
  // Mental Model: A new box arriving means sales happened! (Capacity - Remaining - Owner Consumed = Sales)
  const handleCommitSupplyDrivenSale = (payload: {
    skuId: string | number;
    skuName: string;
    boxCapacity: number;
    shelfRemainingBeforeDrop: number;
    ownerConsumedQty: number;
    unitsSold: number;
    newSupplyArrivedQty: number;
    unitRetailPrice: number;
    unitWholesaleCost: number;
    totalRevenue: number;
    cogs: number;
    grossMargin: number;
    ownerDrawingCost: number;
    paymentMode: "CASH" | "MPESA" | "SPLIT";
    supplyInvoiceCost: number;
    supplyPaymentMode: "CASH" | "MPESA" | "SUPPLIER_CREDIT";
    notes?: string;
  }) => {
    // 1. Create crystallized sales record
    const newSaleRecord: SalesLedgerItem = {
      id: `sale_sup_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString().slice(0, 10),
      customer_name: "Counter Retail (Supply-Triggered Restock)",
      items_summary: `${payload.unitsSold}x ${payload.skuName} (Supply-Driven Velocity)`,
      total_amount: payload.totalRevenue,
      cash_paid: payload.paymentMode === "CASH" ? payload.totalRevenue : payload.paymentMode === "SPLIT" ? payload.totalRevenue / 2 : 0,
      mpesa_paid: payload.paymentMode === "MPESA" ? payload.totalRevenue : payload.paymentMode === "SPLIT" ? payload.totalRevenue / 2 : 0,
      debt_amount: 0,
      payment_method: payload.paymentMode
    };

    // 2. Create owner drawing record if owner consumed items (e.g. drank 2 pieces of milk)
    let newPayouts = [...alacioState.payouts];
    if (payload.ownerConsumedQty > 0) {
      const drawingRecord: PayoutOrDrawing = {
        id: `drawing_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toISOString().slice(0, 10),
        amount: payload.ownerDrawingCost,
        type: "OWNER_DRAWING",
        notes: `Owner Consumption: ${payload.ownerConsumedQty}x ${payload.skuName} consumed personal (Cost: ${payload.ownerDrawingCost})`
      };
      newPayouts = [drawingRecord, ...newPayouts];
    }

    // 3. Create supplier payout record if new supply box was paid immediately
    if (payload.supplyInvoiceCost > 0 && payload.supplyPaymentMode !== "SUPPLIER_CREDIT") {
      const supplyPayoutRecord: PayoutOrDrawing = {
        id: `payout_box_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toISOString().slice(0, 10),
        amount: payload.supplyInvoiceCost,
        type: "SUPPLIER_PAYOUT",
        notes: `New Box Delivery: ${payload.newSupplyArrivedQty}x ${payload.skuName} paid via ${payload.supplyPaymentMode}`
      };
      newPayouts = [supplyPayoutRecord, ...newPayouts];
    }

    // 4. Update Inventory SKU (new stock = remaining + new supply arrived)
    let updatedInventory = [...alacioState.inventory];
    const itemIdx = updatedInventory.findIndex((i) => 
      String(i.id) === String(payload.skuId) || 
      i.name.toLowerCase().includes(payload.skuName.toLowerCase()) ||
      payload.skuName.toLowerCase().includes(i.name.toLowerCase())
    );

    const postStock = payload.shelfRemainingBeforeDrop + payload.newSupplyArrivedQty;

    if (itemIdx !== -1) {
      const curr = updatedInventory[itemIdx];
      updatedInventory[itemIdx] = {
        ...curr,
        current_stock: postStock,
        unit_cost: payload.unitWholesaleCost,
        unit_retail: payload.unitRetailPrice,
        expected_margin: payload.unitRetailPrice - payload.unitWholesaleCost,
        total_shelf_value: postStock * payload.unitRetailPrice,
        velocity_badge: "High Velocity"
      };
    } else {
      updatedInventory.push({
        id: payload.skuId,
        name: payload.skuName,
        category: "Dairy & Fast Retail",
        unit_type: "packets",
        unit_cost: payload.unitWholesaleCost,
        unit_retail: payload.unitRetailPrice,
        current_stock: postStock,
        opening_stock: payload.boxCapacity,
        expected_margin: payload.unitRetailPrice - payload.unitWholesaleCost,
        total_shelf_value: postStock * payload.unitRetailPrice,
        velocity_badge: "High Velocity"
      });
    }

    // 5. Update cash & M-Pesa balances
    let cashChange = 0;
    let mpesaChange = 0;

    if (payload.paymentMode === "CASH") cashChange += payload.totalRevenue;
    else if (payload.paymentMode === "MPESA") mpesaChange += payload.totalRevenue;
    else if (payload.paymentMode === "SPLIT") {
      cashChange += payload.totalRevenue / 2;
      mpesaChange += payload.totalRevenue / 2;
    }

    if (payload.supplyPaymentMode === "CASH") cashChange -= payload.supplyInvoiceCost;
    else if (payload.supplyPaymentMode === "MPESA") mpesaChange -= payload.supplyInvoiceCost;

    const newCash = Math.max(0, alacioState.cash_register_balance + cashChange);
    const newMpesa = Math.max(0, alacioState.mpesa_float_balance + mpesaChange);

    const newKpis = calculateKpis(updatedInventory, alacioState.warehouse);

    setAlacioState((prev) => ({
      ...prev,
      inventory: updatedInventory,
      salesLedger: [newSaleRecord, ...prev.salesLedger],
      payouts: newPayouts,
      cash_register_balance: newCash,
      mpesa_float_balance: newMpesa,
      kpis: newKpis,
      last_updated: new Date().toISOString()
    }));
  };

  // Navigation Items (Relatable, Direct MSME Operations)
  // Consolidated Supply & Warehouse + Introduced Sales Module & Ledgers Accounts
  const navItems = [
    { id: "dashboard", name: "Executive Dashboard", icon: <LayoutDashboard size={16} />, badge: "WaveApps" },
    { id: "sales_supply", name: "Supply-Driven Sales", icon: <TrendingUp size={16} />, badge: "Velocity" },
    { id: "ledgers_accounts", name: "3-Fold Ledgers (P/R/N)", icon: <BookOpen size={16} />, badge: "3-Fold" },
    { id: "customers", name: "Customer Deni (Khata)", icon: <Users size={16} />, badge: `${alacioState.customers.length} deni` },
    { id: "supply_stock_vault", name: "Stock, Vault & Suppliers", icon: <Layers size={16} />, badge: `${alacioState.warehouse.length} wh` },
    { id: "morning_bookend", name: "Dawn Lock (05:57 AM)", icon: <Sun size={16} />, badge: "Dawn" },
    { id: "evening_reconciliation", name: "Evening Cash Audit", icon: <Scale size={16} />, badge: "Audit" },
    { id: "voice_ledger", name: "Voice Ledger (Audio)", icon: <Mic size={16} />, badge: "VCR" },
    { id: "system_architecture", name: "Data Engineering Lab", icon: <Cpu size={16} />, badge: "Spec & Live" },
    { id: "data_warehouse", name: "DB Root Console", icon: <Database size={16} />, badge: "Root" },
    { id: "analytics", name: "Business Analytics", icon: <BarChart2 size={16} />, badge: "KPIs" }
  ];

  // PURE PUBLIC YUBIFLO PLATFORM LANDING PAGE
  if (currentView === "landing") {
    return (
      <>
        <YuBiFloLandingPage
          state={alacioState}
          onGetStarted={() => {
            handleGuardedEnterWorkspace("dashboard");
          }}
          onLaunchRetailWorkspace={() => {
            handleGuardedEnterWorkspace("dashboard");
          }}
          onOpenSovereignCommand={() => {
            setCurrentView("yubiflo_command");
          }}
          onOpenBlueprints={() => {
            const bp = PLATFORM_BLUEPRINTS[1];
            setActiveDevelopingBlueprint(bp);
            setCurrentView("developing");
          }}
        />

        {/* PASSWORD GATE MODAL ("8496") */}
        <AlacioAccessGateModal
          isOpen={isPasswordModalOpen}
          targetDescription="Retail Client Workspace"
          onSuccess={() => {
            setIsPasswordModalOpen(false);
            if (pendingActionAfterPassword) {
              pendingActionAfterPassword();
              setPendingActionAfterPassword(null);
            } else {
              setIsAlacioUnlocked(true);
              setCurrentView("workspace");
              setActiveTab("dashboard");
            }
          }}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPendingActionAfterPassword(null);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 font-sans selection:bg-black selection:text-white">
      
      {/* GLOBAL HEADER / WORKSPACE SWITCHER */}
      <header className="h-14 bg-[#0c0c0e] border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between text-xs sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => setCurrentView("yubiflo_command")}
            className="flex items-center gap-2 text-white font-black tracking-wide text-sm cursor-pointer"
            title="YuBiFLo Sovereign Platform Command"
          >
            <div className="w-7 h-7 rounded-lg bg-black text-white border border-zinc-700 flex items-center justify-center font-bold font-mono">Y</div>
            <span className="font-serif tracking-tight">YuBiFLo</span>
          </button>
          
          <span className="text-slate-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-white shrink-0" />
            <span className="text-slate-400 hidden md:inline">Workspace:</span>
            <div className="relative">
              <select
                value={currentView === "yubiflo_command" ? "yubiflo_command" : "workspace"}
                onChange={(e) => {
                  if (e.target.value === "yubiflo_command") {
                    setCurrentView("yubiflo_command");
                  } else if (e.target.value === "workspace") {
                    handleGuardedEnterWorkspace("dashboard");
                  }
                }}
                className="bg-[#09090b] border border-zinc-700 rounded px-2.5 py-1 text-white font-bold appearance-none pr-6 cursor-pointer"
              >
                <option value="workspace">Retail Pro Store [Protected Client Node]</option>
                <option value="yubiflo_command">YuBiFLo Sovereign Command (Platform)</option>
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-2 text-slate-400 pointer-events-none" />
            </div>
            <span className="hidden lg:inline-block text-[10px] font-mono bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded border border-zinc-700">
              {currentView === "yubiflo_command" ? "Sovereign Platform • Data Engine" : "Private Tenant Node • Secured"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* RETURN TO PUBLIC YUBIFLO LANDING PAGE */}
          <button
            onClick={() => setCurrentView("landing")}
            className="px-2.5 sm:px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-zinc-700 text-zinc-200 font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs font-mono"
            title="Return to Public YuBiFLo Platform Home"
          >
            <Globe size={13} className="text-white" />
            <span className="hidden sm:inline">YuBiFLo Home</span>
            <span className="sm:hidden">Home</span>
          </button>

          {/* SWITCH BETWEEN YUBIFLO AND RETAIL NODE */}
          {currentView !== "yubiflo_command" ? (
            <button
              onClick={() => setCurrentView("yubiflo_command")}
              className="px-2.5 sm:px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-zinc-700 text-zinc-200 font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs font-mono"
              title="Return to Greater YuBiFLo Platform"
            >
              <Building2 size={13} className="text-white" />
              <span className="hidden sm:inline">Platform Command</span>
              <span className="sm:hidden">Command</span>
            </button>
          ) : (
            <button
              onClick={() => {
                handleGuardedEnterWorkspace("dashboard");
              }}
              className="px-2.5 sm:px-3 py-1.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-lg border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer text-xs font-mono shadow"
              title="Enter Retail Store Workspace"
            >
              <span>Enter Store Node</span>
            </button>
          )}

          {/* PROPRIETOR DIRECT DATABASE & WAREHOUSE CONSOLE */}
          <button
            onClick={() => {
              handleGuardedEnterWorkspace("data_warehouse");
            }}
            className={`px-2.5 sm:px-3 py-1.5 border rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs font-mono font-bold ${
              activeTab === "data_warehouse" && currentView === "workspace"
                ? "bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow"
                : "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
            }`}
            title="Direct Root Access to Database & Data Warehouse"
          >
            <Database size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">DB Root Console</span>
            <span className="sm:hidden">DB</span>
          </button>


          {/* ZERO DATA LOSS VERIFIED BADGE */}
          <div
            className="hidden sm:flex px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-white font-semibold rounded-lg items-center gap-1.5 text-xs font-mono"
            title="Active store data preserved & protected"
          >
            <ShieldCheck size={13} className="text-white" />
            <span>Data Preserved</span>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* VIEW S: YUBIFLO SOVEREIGN ENTERPRISE COMMAND & FLEET      */}
      {/* ========================================================= */}
      {currentView === "yubiflo_command" && (
        <YuBiFloEnterpriseCommand
          alacioState={alacioState}
          onLaunchAlacioShop={() => {
            handleGuardedEnterWorkspace("dashboard");
          }}
          onOpenDataLab={() => {
            handleGuardedEnterWorkspace("system_architecture");
          }}
          onOpenBlueprints={() => setCurrentView("landing")}
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
            handleGuardedEnterWorkspace("dashboard");
          }}
        />
      )}

      {/* ========================================================= */}
      {/* VIEW B: CLIENT WORKSPACE RUNTIME (10 TABS + FREEMIUM CDO) */}
      {/* ========================================================= */}
      {currentView === "workspace" && (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
          
          {/* SIDEBAR NAVIGATION (DESKTOP) */}
          <aside className="hidden md:flex w-64 bg-[#0a0a0c] border-r border-zinc-800 flex-col justify-between shrink-0 select-none">
            <div>
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white block font-serif">
                    {alacioState.merchant_name || "Retail Pro Store"}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-white font-bold border border-zinc-700">
                    Private Client
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Data Protected &bull; 0-Drift
                  </span>
                  <button 
                    onClick={() => setCurrentView("landing")}
                    className="text-[9px] font-mono text-zinc-300 hover:text-white cursor-pointer underline"
                  >
                    Home &rarr;
                  </button>
                </div>
              </div>
              <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Operations &amp; Ledgers</div>
              <nav className="space-y-0.5 px-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      activeTab === item.id 
                        ? "bg-[#1f1f23] text-white border border-zinc-700 font-semibold shadow-sm" 
                        : "text-slate-400 hover:bg-zinc-800 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        activeTab === item.id ? "bg-zinc-800 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t border-zinc-800 text-[10px] font-mono text-slate-500 flex justify-between items-center">
              <span>{alacioState.merchant_name || "Retail Pro Store"}</span>
              <span className="text-amber-400 font-bold">Client Pilot Node</span>
            </div>
          </aside>

          {/* MAIN WORKSPACE CONTENT ROUTER */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8 space-y-6">
            

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
                onQuickSale={handleQuickSale}
                onResolveGap={handleResolveGap}
                onRepayDebt={handleRepayDebt}
                onAddDebtor={handleAddDebtor}
                onSwitchToYuBiFlo={() => setCurrentView("yubiflo_command")}
              />
            )}

            {activeTab === "morning_bookend" && (
              <MorningBookendTab
                state={alacioState}
                onConfirmMorningBookend={handleConfirmMorningBookend}
                onUpdateMorningBookendDate={handleUpdateMorningBookendDate}
                onDeleteMorningBookend={handleDeleteMorningBookend}
              />
            )}

            {activeTab === "sales_supply" && (
              <SupplyDrivenSalesTab
                state={alacioState}
                onCommitSupplyDrivenSale={handleCommitSupplyDrivenSale}
              />
            )}

            {(activeTab === "ledgers_accounts" || activeTab === "t_ledgers") && (
              <LedgerAccountsHubTab
                state={alacioState}
                onNavigateTab={setActiveTab}
              />
            )}

            {(activeTab === "supply_stock_vault" || activeTab === "warehouse" || activeTab === "inventory" || activeTab === "supplier_log" || activeTab === "receipt_scanner") && (
              <SupplyStockVaultTab
                state={alacioState}
                onLogMultiDelivery={handleLogMultiSupplyDelivery}
                onAddSupplier={handleAddSupplier}
                onEditSupplier={handleEditSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                onTransferToShelf={handleTransferToShelf}
                onReceiveShipment={handleReceiveShipment}
                onEditBatch={handleEditWarehouseBatch}
                onDeleteBatch={handleDeleteWarehouseBatch}
                onOpenRestock={handleOpenRestock}
                onCommitProcessedReceipt={handleCommitProcessedReceipt}
                initialSubTab={
                  activeTab === "warehouse" 
                    ? "warehouse" 
                    : activeTab === "inventory" 
                    ? "inventory" 
                    : activeTab === "receipt_scanner" 
                    ? "receipts" 
                    : "suppliers"
                }
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

            {activeTab === "customers" && (
              <CustomersCreditTab
                currency={alacioState.currency}
                customers={alacioState.customers}
                onRepayDebt={handleRepayDebt}
                onAddDebtor={handleAddDebtor}
                onEditCustomer={handleEditCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            )}

            {activeTab === "system_architecture" && (
              <SystemArchitectureTab />
            )}

            {activeTab === "data_warehouse" && (
              <ProprietorDataWarehouseTab
                state={alacioState}
                onUpdateRecord={handleDirectUpdateRecord}
                onDeleteRecord={handleDirectDeleteRecord}
                onInsertRecord={handleDirectInsertRecord}
                onRestoreFullState={handleDirectRestoreFullState}
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

          {/* MOBILE BOTTOM NAVIGATION BAR (FIXED FOR DIRECT SHOP ACCESS) */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b] border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
                activeTab === "dashboard" ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutDashboard size={18} />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => setActiveTab("sales_supply")}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
                activeTab === "sales_supply" ? "text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp size={18} />
              <span className="text-[10px]">Sales</span>
            </button>

            <button
              onClick={() => setActiveTab("ledgers_accounts")}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
                activeTab === "ledgers_accounts" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen size={18} />
              <span className="text-[10px]">Ledgers</span>
            </button>

            <button
              onClick={() => setActiveTab("customers")}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
                activeTab === "customers" ? "text-purple-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users size={18} />
              <span className="text-[10px]">Deni</span>
            </button>

            <button
              onClick={() => setActiveTab("supply_stock_vault")}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
                activeTab === "supply_stock_vault" ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers size={18} />
              <span className="text-[10px]">Stock</span>
            </button>

            <button
              onClick={() => setIsMobileMoreOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200 transition"
            >
              <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-bold">
                •••
              </div>
              <span className="text-[10px]">More</span>
            </button>
          </nav>

          {/* MOBILE MORE MODULES DRAWER */}
          {isMobileMoreOpen && (
            <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
              <div className="bg-[#0c0c0e] border-t-2 border-zinc-700 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-zinc-800 text-white flex items-center justify-center font-bold text-xs">
                      Y
                    </div>
                    <span className="font-bold text-white text-sm font-serif">All Operations &amp; Modules</span>
                  </div>
                  <button onClick={() => setIsMobileMoreOpen(false)} className="text-slate-400 hover:text-white p-1">
                    <X size={18} />
                  </button>
                </div>

                {/* Direct Shortcut to Greater YuBiFLo */}
                <button
                  onClick={() => {
                    setCurrentView("yubiflo_command");
                    setIsMobileMoreOpen(false);
                  }}
                  className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs flex items-center justify-between"
                >
                  <span className="flex items-center gap-2 font-mono">
                    <Building2 size={15} /> Switch to Greater YuBiFLo Platform
                  </span>
                  <ArrowRight size={14} />
                </button>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMoreOpen(false);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        activeTab === item.id
                          ? "bg-zinc-800 text-white border-zinc-700 font-bold"
                          : "bg-[#09090b] text-slate-300 border-zinc-800 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="shrink-0">{item.icon}</div>
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}


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
          <div className="bg-[#121214] border-2 border-zinc-700 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <RefreshCw size={16} className="text-white" /> Restock-Trigger Accounting Engine: {selectedRestockItem.name}
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
                  className="w-full bg-[#09090b] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:outline-none focus:border-white"
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
                    className="w-full bg-[#09090b] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
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
                    className="w-full bg-[#09090b] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
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
                  className="px-5 py-2 bg-black hover:bg-zinc-800 text-white border border-zinc-700 font-bold rounded-xl cursor-pointer shadow"
                >
                  Confirm Restock Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}





      {/* PASSWORD GATE MODAL ("8496") FOR ALL WORKSPACE ACCESS */}
      <AlacioAccessGateModal
        isOpen={isPasswordModalOpen}
        targetDescription="Retail Client Workspace"
        onSuccess={() => {
          setIsPasswordModalOpen(false);
          if (pendingActionAfterPassword) {
            pendingActionAfterPassword();
            setPendingActionAfterPassword(null);
          } else {
            setIsAlacioUnlocked(true);
            setCurrentView("workspace");
            setActiveTab("dashboard");
          }
        }}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingActionAfterPassword(null);
        }}
      />

    </div>
  );
}
