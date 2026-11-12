import React, { useState, useEffect, Suspense, lazy } from "react";
import { 
  Building2, Globe, Plus, ChevronDown, Copy, X, ArrowRight, Sparkles, 
  AlertTriangle, Layers, Database, BarChart3, BrainCircuit, Eye, 
  LayoutDashboard, Mic, Zap, Clock, Package, Users, Scale, RefreshCw, BarChart2,
  Smartphone, HelpCircle, Download, Radio, Sun, Truck, Languages, Camera, CheckCircle2,
  ArrowUpDown, BookOpen, TrendingUp, Cpu, ShieldCheck, ShoppingBag
} from "lucide-react";

import { 
  AlacioMasterState, 
  InventoryItem, 
  CustomerDebtor,
  FloatDenomination, 
  SalesLedgerItem,
  WarehouseBatch,
  PayoutOrDrawing,
  MpesaStatementRecord,
  FreemiumTier,
  Blueprint,
  SupplierProfile,
  RestockReconciliationCard,
  SavedReceiptRecord,
  SupplierBatchCard,
  BatchTurnoverItem
} from "./types/alacio";
import { 
  loadAlacioState, 
  saveAlacioState, 
  calculateKpis,
  createSkeletonBusinessState,
  restoreUserStateFromCloud,
  PLATFORM_BLUEPRINTS,
  PROJECT_ALACIO_CASE_STUDY
} from "./services/alacioStorage";
import {
  getSupplyUnitMultiplier,
  deriveUnitWholesaleCost
} from "./services/bulkConversionEngine";
import { 
  loadDemoSandboxState, 
  saveDemoSandboxState, 
  resetDemoSandbox 
} from "./services/dukaDemoSandbox";
import { 
  UserProfile, 
  getValidSession, 
  signOut, 
  signOutAllDevices 
} from "./services/authSessionService";

import type { LaunchpadProgress } from "./components/tabs/LaunchpadTab";
import type { PurchaseItemLine } from "./components/tabs/PurchasesTab";
import type { VoiceDraftRecord } from "./components/tabs/PendingDraftsQueueTab";
import {
  reconcileChronologicalReceiptsAndSales,
  normalizeIsoDate,
  doProductsMatch
} from "./utils/chronologicalReceiptSalesEngine";
import type { VoiceTransactionPayload } from "./components/VoiceLedger";
import { reconcileOrRegisterSupplier, reconcileOrRegisterCustomer } from "./utils/partyNameFuzzyMatcher";

// Immediate Critical Path Modules (Header, Dashboard & Auth)
import SaasAppShell from "./components/SaasAppShell";
import SaasDashboardTab from "./components/tabs/SaasDashboardTab";
import YuBiFloLandingPage from "./components/YuBiFloLandingPage";
import UnifiedAuthModal from "./components/UnifiedAuthModal";

// Lazy-Loaded Tabs & Heavy Modals for Instant Bundle Execution (<300ms)
const LaunchpadTab = lazy(() => import("./components/tabs/LaunchpadTab"));
const SupplyDrivenSalesTab = lazy(() => import("./components/tabs/SupplyDrivenSalesTab"));
const PurchasesTab = lazy(() => import("./components/tabs/PurchasesTab"));
const SuppliersTab = lazy(() => import("./components/tabs/SuppliersTab"));
const StockVaultSuppliersTab = lazy(() => import("./components/tabs/StockVaultSuppliersTab"));
const DawnLockTab = lazy(() => import("./components/tabs/DawnLockTab"));
const UnifiedVoiceLedgerTab = lazy(() => import("./components/tabs/UnifiedVoiceLedgerTab"));
const CustomersCreditTab = lazy(() => import("./components/tabs/CustomersCreditTab"));
const ThreeFoldLedgersTab = lazy(() => import("./components/tabs/ThreeFoldLedgersTab"));
const AnalyticsTab = lazy(() => import("./components/tabs/AnalyticsTab"));
const OwnerExpensesTab = lazy(() => import("./components/tabs/OwnerExpensesTab"));
const TemplateInDevelopmentView = lazy(() => import("./components/TemplateInDevelopmentView"));
const OneTapGapModal = lazy(() => import("./components/OneTapGapModal"));
const MpesaImportModal = lazy(() => import("./components/MpesaImportModal"));
const PullYourOwnAppModal = lazy(() => import("./components/PullYourOwnAppModal"));
const DataVaultModal = lazy(() => import("./components/DataVaultModal"));
const YuBiFloEnterpriseCommand = lazy(() => import("./components/YuBiFloEnterpriseCommand"));
import {
  UserAccount,
  getUserAccounts,
  getActiveAccountId,
  setActiveAccountId,
  createAccountForUser
} from "./services/accountManagementService";

function TabLoadingSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl animate-pulse">
      <div className="h-7 bg-slate-200/80 rounded-xl w-44"></div>
      <div className="h-3.5 bg-slate-200/60 rounded-lg w-64"></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
        <div className="h-24 bg-white border border-slate-200 rounded-2xl shadow-2xs"></div>
        <div className="h-24 bg-white border border-slate-200 rounded-2xl shadow-2xs"></div>
        <div className="h-24 bg-white border border-slate-200 rounded-2xl shadow-2xs"></div>
      </div>
      <div className="h-56 bg-white border border-slate-200 rounded-2xl shadow-2xs mt-4"></div>
    </div>
  );
}

export default function App() {
  // Session State (90-day sliding session)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const session = getValidSession();
    return session ? session.user : null;
  });

  // Main View Router: returning user with session opens straight to workspace
  const [currentView, setCurrentView] = useState<"landing" | "workspace" | "developing" | "yubiflo_command">(() => {
    const session = getValidSession();
    return session ? "workspace" : "landing";
  });

  const [activeDevelopingBlueprint, setActiveDevelopingBlueprint] = useState<Blueprint | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [preselectedSupplier, setPreselectedSupplier] = useState<string | undefined>(undefined);

  // MULTI-ACCOUNT MANAGEMENT UNDER SAME GMAIL
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const session = getValidSession();
    const email = session?.user?.email || "mosesmukangai75@gmail.com";
    return getUserAccounts(email);
  });
  const [activeAccountId, setActiveAccountIdState] = useState<string>(() => {
    const session = getValidSession();
    const email = session?.user?.email || "mosesmukangai75@gmail.com";
    return getActiveAccountId(email);
  });

  // DUKA SPACE DEMO SANDBOX ISOLATION
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoOriginView, setDemoOriginView] = useState<"landing" | "workspace">("landing");
  const [demoState, setDemoState] = useState<AlacioMasterState>(() => loadDemoSandboxState());

  // REAL WORKSPACE STATE (Account-scoped with zero-data-loss fallback)
  const [alacioState, setAlacioState] = useState<AlacioMasterState>(() => {
    const session = getValidSession();
    const email = session?.user?.email || "mosesmukangai75@gmail.com";
    const initialAccId = getActiveAccountId(email);
    return loadAlacioState(email, initialAccId);
  });

  // REAL WORKSPACE LAUNCHPAD PROGRESS
  const [realLaunchpadProgress, setRealLaunchpadProgress] = useState<LaunchpadProgress>(() => {
    const raw = localStorage.getItem("yubiflo_real_launchpad_progress");
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return {
      step1_dawnLock: false,
      step2_addStock: false,
      step3_firstSale: false,
      step4_addSuppliers: false,
      step5_customersDeni: false,
      step6_vcrNotice: false,
      step7_closeDay: false
    };
  });

  // DEMO LAUNCHPAD PROGRESS (Sample state for exploration)
  const demoLaunchpadProgress: LaunchpadProgress = {
    step1_dawnLock: true,
    step2_addStock: true,
    step3_firstSale: true,
    step4_addSuppliers: true,
    step5_customersDeni: true,
    step6_vcrNotice: true,
    step7_closeDay: false
  };

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signup");

  // Other modal states
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedRestockItem, setSelectedRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [restockRetail, setRestockRetail] = useState("");
  const [isOneTapGapOpen, setIsOneTapGapOpen] = useState(false);
  const [isMpesaImportOpen, setIsMpesaImportOpen] = useState(false);
  const [isPullYourOwnAppOpen, setIsPullYourOwnAppOpen] = useState(false);
  const [isDataVaultOpen, setIsDataVaultOpen] = useState(false);
  const [lastVoiceLog, setLastVoiceLog] = useState<string | null>(null);

  // Active state pointer: demoState when in demo, alacioState when in real workspace
  const currentMasterState = isDemoMode ? demoState : alacioState;

  // Persist real state to multi-tier storage with account-isolation and zero-data-loss snapshots
  useEffect(() => {
    saveAlacioState(alacioState, currentUser?.email, activeAccountId);
  }, [alacioState, currentUser?.email, activeAccountId]);

  // Persist demo state strictly to isolated sandbox storage
  useEffect(() => {
    if (isDemoMode) {
      saveDemoSandboxState(demoState);
    }
  }, [demoState, isDemoMode]);

  // Persist real launchpad progress
  useEffect(() => {
    localStorage.setItem("yubiflo_real_launchpad_progress", JSON.stringify(realLaunchpadProgress));
  }, [realLaunchpadProgress]);

  // Sync browser document title based on workspace mode
  useEffect(() => {
    if (isDemoMode) {
      document.title = "Demo · YuBiFLo";
    } else {
      document.title = "YuBiFLo — Your Business Is A Flower";
    }
  }, [isDemoMode]);

  // -------------------------------------------------------------
  // DUKA SPACE DEMO: ENTRY & EXIT HANDLERS
  // -------------------------------------------------------------
  const handleEnterDukaSpace = (origin: "landing" | "workspace" = currentView === "landing" ? "landing" : "workspace") => {
    setDemoOriginView(origin);
    setIsDemoMode(true);
    setCurrentView("workspace");
    setActiveTab("dashboard");
  };

  const handleExitDukaSpace = () => {
    setIsDemoMode(false);
    resetDemoSandbox();
    if (demoOriginView === "landing" && !currentUser) {
      setCurrentView("landing");
    } else {
      setCurrentView("workspace");
      setActiveTab("dashboard");
    }
  };

  const handleStartRealFromDemo = () => {
    if (currentUser) {
      setIsDemoMode(false);
      setCurrentView("workspace");
      setActiveTab("dashboard");
    } else {
      setAuthModalMode("signup");
      setIsAuthModalOpen(true);
    }
  };

  const handleSwitchAccount = (accountId: string) => {
    const email = currentUser?.email || "mosesmukangai75@gmail.com";
    // 1. Persist current state before switching
    saveAlacioState(alacioState, email, activeAccountId);
    // 2. Set active account ID in storage and state
    setActiveAccountId(email, accountId);
    setActiveAccountIdState(accountId);
    // 3. Load target account state with zero-data-loss isolation
    const targetState = loadAlacioState(email, accountId);
    (targetState as any).account_id = accountId;
    const targetAcc = accounts.find((a) => a.id === accountId);
    if (targetAcc && (!targetState.merchant_name || targetState.merchant_name === "YuBiFlo Merchant")) {
      targetState.merchant_name = targetAcc.businessName;
    }
    setAlacioState(targetState);
  };

  const handleCreateAccount = (businessName: string, businessType: string) => {
    const email = currentUser?.email || "mosesmukangai75@gmail.com";
    // 1. Persist current state
    saveAlacioState(alacioState, email, activeAccountId);
    // 2. Create new business account under the Gmail
    const newAcc = createAccountForUser(email, businessName, businessType);
    const updatedAccounts = getUserAccounts(email);
    setAccounts(updatedAccounts);
    setActiveAccountIdState(newAcc.id);
    // 3. Initialize fresh isolated skeleton state for this new shop
    const freshState = createSkeletonBusinessState(businessName, businessType);
    freshState.user_email = email;
    (freshState as any).account_id = newAcc.id;
    freshState.merchant_name = businessName;
    freshState.client_type = businessType;
    setAlacioState(freshState);
    saveAlacioState(freshState, email, newAcc.id);
  };

  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setIsDemoMode(false);
    resetDemoSandbox();

    // Refresh user accounts under this Gmail
    const userAccs = getUserAccounts(user.email);
    setAccounts(userAccs);
    const userAccId = getActiveAccountId(user.email);
    setActiveAccountIdState(userAccId);

    // Zero Data Loss: Check if this user already has saved state in local cache or backups
    const existingUserState = loadAlacioState(user.email, userAccId);
    const hasExistingData = 
      (existingUserState.inventory && existingUserState.inventory.length > 0) ||
      (existingUserState.salesLedger && existingUserState.salesLedger.length > 0) ||
      (existingUserState.payouts && existingUserState.payouts.length > 0) ||
      (existingUserState.suppliers && existingUserState.suppliers.length > 1) ||
      (existingUserState.merchant_name === user.businessName && existingUserState.is_skeleton === true);

    if (hasExistingData) {
      // Existing client logging in or returning: DO NOT OVERWRITE! Restore their goods and ledger!
      existingUserState.user_email = user.email;
      (existingUserState as any).account_id = userAccId;
      setAlacioState(existingUserState);
      saveAlacioState(existingUserState, user.email, userAccId);
    } else {
      // Check Firestore cloud mirror in case they are on a new device or cleared cache
      try {
        const cloudState = await restoreUserStateFromCloud(user.email, userAccId);
        if (cloudState && ((cloudState.inventory && cloudState.inventory.length > 0) || (cloudState.salesLedger && cloudState.salesLedger.length > 0))) {
          setAlacioState(cloudState);
          setCurrentView("workspace");
          setActiveTab("dashboard");
          return;
        }
      } catch (e) {
        console.warn("[YuBiFlo Storage] Cloud state check notice:", e);
      }

      // First-time signup with no prior data: initialize clean skeleton ready for their goods
      const skeletonState = createSkeletonBusinessState(user.businessName, user.businessType);
      skeletonState.user_email = user.email;
      (skeletonState as any).account_id = userAccId;
      setAlacioState(skeletonState);
      saveAlacioState(skeletonState, user.email, userAccId);

      const freshLaunchpad: LaunchpadProgress = {
        step1_dawnLock: false,
        step2_addStock: false,
        step3_firstSale: false,
        step4_addSuppliers: false,
        step5_customersDeni: false,
        step6_vcrNotice: false,
        step7_closeDay: false
      };
      setRealLaunchpadProgress(freshLaunchpad);
      localStorage.setItem("yubiflo_real_launchpad_progress", JSON.stringify(freshLaunchpad));
    }

    setCurrentView("workspace");
    setActiveTab("dashboard");
  };

  // State updater router (mutates demoState in sandbox, or alacioState in real)
  const setMasterState = (updater: (prev: AlacioMasterState) => AlacioMasterState) => {
    if (isDemoMode) {
      setDemoState(updater);
    } else {
      setAlacioState(updater);
    }
  };

  // -------------------------------------------------------------
  // OPERATIONAL ACTION HANDLERS
  // -------------------------------------------------------------
  const handleOpenRestock = (item?: InventoryItem) => {
    const target = item || currentMasterState.inventory[0];
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

    setMasterState((prev) => {
      const updatedInventory = prev.inventory.map((inv) => {
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

      const newKpis = calculateKpis(updatedInventory, prev.warehouse);
      return {
        ...prev,
        inventory: updatedInventory,
        kpis: newKpis,
        last_updated: new Date().toISOString()
      };
    });

    setIsRestockOpen(false);
  };

  const handleVoiceTransaction = (payload: VoiceTransactionPayload) => {
    setMasterState((prev) => {
      let updatedInventory = [...prev.inventory];
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

      let updatedCustomers = [...prev.customers];
      let canonicalCustomer = payload.customer;
      if (payload.debtAmount > 0) {
        const reconciled = reconcileOrRegisterCustomer(
          payload.customer,
          updatedCustomers,
          {
            debtDelta: payload.debtAmount,
            phone: "07XX XXX XXX",
            date: "Just now",
            notes: "Recorded via Voice Simulator / VCR"
          }
        );
        updatedCustomers = reconciled.updatedCustomers;
        canonicalCustomer = reconciled.canonicalName;
      }

      const derivedPaymentMethod: "CASH" | "MPESA" | "SPLIT" | "CREDIT" = 
        payload.debtAmount > 0 && (payload.cashPaid + payload.mpesaPaid) === 0 ? "CREDIT" :
        (payload.cashPaid > 0 && payload.mpesaPaid > 0 ? "SPLIT" : 
        (payload.mpesaPaid > 0 ? "MPESA" : "CASH"));

      const newSalesRecord: SalesLedgerItem = {
        id: `sl_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        customer_name: canonicalCustomer,
        items_summary: itemsSummary || "Assorted items",
        total_amount: payload.total,
        cash_paid: payload.cashPaid,
        mpesa_paid: payload.mpesaPaid,
        debt_amount: payload.debtAmount,
        payment_method: derivedPaymentMethod
      };

      const newSalesLedger = [newSalesRecord, ...(prev.salesLedger || [])];
      const newCash = prev.cash_register_balance + payload.cashPaid;
      const newMpesa = prev.mpesa_float_balance + payload.mpesaPaid;
      const newKpis = calculateKpis(updatedInventory, prev.warehouse);

      setLastVoiceLog(`Processed VCR sale: ${payload.total} (${payload.customer})`);

      return {
        ...prev,
        inventory: updatedInventory,
        customers: updatedCustomers,
        salesLedger: newSalesLedger,
        cash_register_balance: newCash,
        mpesa_float_balance: newMpesa,
        kpis: newKpis,
        vcr_daily_count: (prev.vcr_daily_count || 0) + 1,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleCommitSupplyDrivenSale = (payload: any) => {
    setMasterState((prev) => {
      const recordDate = payload.salesDate || new Date().toISOString().slice(0, 10);
      const newSaleRecord: SalesLedgerItem = {
        id: `sl_supply_${Date.now()}`,
        date: recordDate,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        customer_name: "Counter Customers (Batch Clear)",
        items_summary: `${payload.unitsSold}x ${payload.skuName}`,
        total_amount: payload.totalRevenue,
        cash_paid: payload.paymentMode === "CASH" ? payload.totalRevenue : (payload.paymentMode === "SPLIT" ? Math.round(payload.totalRevenue / 2) : 0),
        mpesa_paid: payload.paymentMode === "MPESA" ? payload.totalRevenue : (payload.paymentMode === "SPLIT" ? Math.round(payload.totalRevenue / 2) : 0),
        debt_amount: 0,
        payment_method: payload.paymentMode === "SPLIT" ? "SPLIT" : (payload.paymentMode === "MPESA" ? "MPESA" : "CASH")
      };

      const newSales = [newSaleRecord, ...(prev.salesLedger || [])];
      let newPayouts = [...(prev.payouts || [])];

      if (payload.ownerDrawingCost > 0) {
        newPayouts.push({
          id: `payout_owner_${Date.now()}`,
          date: recordDate,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          amount: payload.ownerDrawingCost,
          type: "OWNER_DRAWING",
          notes: `Owner consumed ${payload.ownerConsumedQty} units ${payload.skuName}`
        });
      }

      if (payload.supplyInvoiceCost > 0) {
        newPayouts.push({
          id: `payout_sup_${Date.now()}`,
          date: recordDate,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          amount: payload.supplyInvoiceCost,
          type: "SUPPLIER_PAYOUT",
          notes: `Restock delivery: ${payload.newSupplyArrivedQty}x ${payload.skuName}`
        });
      }

      return {
        ...prev,
        salesLedger: newSales,
        payouts: newPayouts,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleApproveAmbientDraft = (record: SalesLedgerItem, itemName: string, qty: number, isCollected: boolean) => {
    setMasterState((prev) => {
      let updatedInv = [...prev.inventory];
      const idx = updatedInv.findIndex((i) => i.name.toLowerCase().includes(itemName.toLowerCase()));
      if (idx !== -1) {
        const item = updatedInv[idx];
        const newStock = Math.max(0, item.current_stock - qty);
        updatedInv[idx] = {
          ...item,
          current_stock: newStock,
          total_shelf_value: newStock * item.unit_retail
        };
      }

      const newSales = [record, ...(prev.salesLedger || [])];
      const newCash = record.payment_method === "CASH" ? prev.cash_register_balance + record.total_amount : prev.cash_register_balance;
      const newMpesa = record.payment_method === "MPESA" ? prev.mpesa_float_balance + record.total_amount : prev.mpesa_float_balance;

      return {
        ...prev,
        inventory: updatedInv,
        salesLedger: newSales,
        cash_register_balance: newCash,
        mpesa_float_balance: newMpesa,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleApproveVoiceDraft = (draft: VoiceDraftRecord) => {
    setMasterState((prev) => {
      if (draft.intent_type === "SUPPLIER_DELIVERY") {
        const newPayout: PayoutOrDrawing = {
          id: `payout_${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          amount: draft.payload.delivery_cost || 0,
          type: "SUPPLIER_PAYOUT",
          notes: `Delivery by ${draft.payload.supplier_name}: ${draft.payload.sku_name || "Bulk Cargo"}`
        };
        return {
          ...prev,
          payouts: [newPayout, ...(prev.payouts || [])],
          last_updated: new Date().toISOString()
        };
      }
      return prev;
    });
  };

  const handleRepayDebt = (customerId: string, amount: number, date?: string) => {
    setMasterState((prev) => {
      const updatedCustomers = prev.customers.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            debt_balance: Math.max(0, c.debt_balance - amount),
            last_transaction_date: date || "Today"
          };
        }
        return c;
      });

      return {
        ...prev,
        customers: updatedCustomers,
        cash_register_balance: prev.cash_register_balance + amount,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleAddDebtor = (newDebtor: {
    name: string;
    phone: string;
    national_id?: string;
    credit_limit: number;
    initial_debt: number;
    notes: string;
    date?: string;
  }) => {
    setMasterState((prev) => {
      const reconciled = reconcileOrRegisterCustomer(
        newDebtor.name,
        prev.customers,
        {
          debtDelta: newDebtor.initial_debt,
          phone: newDebtor.phone,
          date: newDebtor.date || "Today",
          notes: newDebtor.notes
        }
      );

      return {
        ...prev,
        customers: reconciled.updatedCustomers,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleEditCustomer = (customerId: string, updatedData: Partial<CustomerDebtor>) => {
    setMasterState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === customerId ? { ...c, ...updatedData } : c)),
      last_updated: new Date().toISOString()
    }));
  };

  const handleDeleteCustomer = (customerId: string) => {
    setMasterState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== customerId),
      last_updated: new Date().toISOString()
    }));
  };

  const handleUpdateFloat = (payload: any) => {
    setMasterState((prev) => {
      if (payload && typeof payload === "object" && "cashBalance" in payload) {
        const cash = Number(payload.cashBalance) || 0;
        const mpesa = Number(payload.mpesaFloat) || 0;
        const bank = Number(payload.bankPaybillBalance) || 0;
        const total = cash + mpesa + bank;

        const newBookend = {
          id: `mb_dawn_${Date.now()}`,
          date: payload.operatingDate || new Date().toISOString().slice(0, 10),
          timestamp: new Date().toISOString(),
          iso_date: payload.operatingDate || new Date().toISOString().slice(0, 10),
          cash_float: cash,
          mpesa_float: mpesa,
          equitel_balance: bank,
          total_liquidity: total,
          debtors_count: (prev.customers || []).length,
          total_customer_debt: (prev.customers || []).reduce((acc, c) => acc + (c.debt_balance || 0), 0),
          opening_shelf_units: (prev.inventory || []).reduce((acc, i) => acc + (i.current_stock || 0), 0),
          opening_shelf_value: (prev.inventory || []).reduce((acc, i) => acc + (i.total_shelf_value || 0), 0),
          status: "LOCKED_DAWN" as const
        };

        return {
          ...prev,
          cash_register_balance: cash,
          mpesa_float_balance: mpesa,
          equitel_account_balance: bank,
          morning_bookends: [newBookend, ...(prev.morning_bookends || [])],
          last_updated: new Date().toISOString()
        };
      }

      // Fallback for legacy denomination mapping
      const updatedDenoms = (prev.floatDenominations || []).map((d) => {
        const key = `kes_${d.value}`;
        return {
          ...d,
          count: payload[key] !== undefined ? payload[key] : d.count
        };
      });
      const totalCashDrawer = updatedDenoms.reduce((acc, d) => acc + d.value * d.count, 0);

      return {
        ...prev,
        floatDenominations: updatedDenoms,
        cash_register_balance: totalCashDrawer,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleResolveGap = (payout: PayoutOrDrawing) => {
    setMasterState((prev) => ({
      ...prev,
      payouts: [payout, ...(prev.payouts || [])],
      last_updated: new Date().toISOString()
    }));
  };

  const handleAddExpense = (expense: PayoutOrDrawing) => {
    setMasterState((prev) => {
      const amt = parseFloat(String(expense.amount)) || 0;
      const isMpesa = (expense.payment_channel || "").includes("MPESA");
      const isCash = !isMpesa && !(expense.payment_channel || "").includes("BANK");
      return {
        ...prev,
        payouts: [expense, ...(prev.payouts || [])],
        cash_register_balance: isCash ? Math.max(0, Math.round(((prev.cash_register_balance || 0) - amt) * 100) / 100) : prev.cash_register_balance,
        mpesa_float_balance: isMpesa ? Math.max(0, Math.round(((prev.mpesa_float_balance || 0) - amt) * 100) / 100) : prev.mpesa_float_balance,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleEditExpense = (id: string, updated: Partial<PayoutOrDrawing>) => {
    setMasterState((prev) => ({
      ...prev,
      payouts: (prev.payouts || []).map((p) => (p.id === id ? { ...p, ...updated } : p)),
      last_updated: new Date().toISOString()
    }));
  };

  const handleDeleteExpense = (id: string) => {
    setMasterState((prev) => ({
      ...prev,
      payouts: (prev.payouts || []).filter((p) => p.id !== id),
      last_updated: new Date().toISOString()
    }));
  };

  const handleImportMpesa = (records: MpesaStatementRecord[]) => {
    setMasterState((prev) => ({
      ...prev,
      mpesaStatements: [...records, ...(prev.mpesaStatements || [])],
      last_updated: new Date().toISOString()
    }));
  };

  const handleAddSupplier = (supplier: SupplierProfile) => {
    setMasterState((prev) => ({
      ...prev,
      suppliers: [supplier, ...(prev.suppliers || [])],
      last_updated: new Date().toISOString()
    }));
  };

  const handleEditSupplier = (supplierId: string, updatedData: Partial<SupplierProfile>) => {
    setMasterState((prev) => ({
      ...prev,
      suppliers: (prev.suppliers || []).map((s) => (s.id === supplierId ? { ...s, ...updatedData } : s)),
      last_updated: new Date().toISOString()
    }));
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setMasterState((prev) => ({
      ...prev,
      suppliers: (prev.suppliers || []).filter((s) => s.id !== supplierId),
      last_updated: new Date().toISOString()
    }));
  };

  const handlePaySupplier = (payoutData: {
    supplierId: string;
    supplierName: string;
    supplierPhone: string;
    supplierNationalId: string;
    amount: number;
    paymentChannel: "NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER";
    tillOrAccount?: string;
    date: string;
    notes?: string;
  }) => {
    const cleanAmt = Number(payoutData.amount) || 0;
    const newPayout: PayoutOrDrawing = {
      id: `payout_supp_${Date.now()}`,
      date: payoutData.date,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      amount: cleanAmt,
      type: "SUPPLIER_PAYOUT",
      payment_channel: payoutData.paymentChannel,
      notes: `${payoutData.supplierName} (National ID: ${payoutData.supplierNationalId}, Phone: ${payoutData.supplierPhone}): ${payoutData.notes || "Supplier settlement"} [${payoutData.paymentChannel}]`
    };

    setMasterState((prev) => ({
      ...prev,
      payouts: [newPayout, ...(prev.payouts || [])],
      suppliers: (prev.suppliers || []).map((s) => 
        s.id === payoutData.supplierId || s.name === payoutData.supplierName
          ? { ...s, total_orders_cost: (Number(s.total_orders_cost) || 0) + cleanAmt, last_delivery_date: payoutData.date }
          : s
      ),
      last_updated: new Date().toISOString()
    }));
  };

  const handleUpdateInventoryItem = (itemId: string | number, updates: Partial<InventoryItem>) => {
    setMasterState((prev) => {
      const updatedInventory = (prev.inventory || []).map((item) => {
        if (String(item.id) === String(itemId)) {
          const merged = { ...item, ...updates };
          const cost = Number(merged.unit_cost) || 0;
          const retail = Number(merged.unit_retail) || 0;
          const stock = Number(merged.current_stock) || 0;
          merged.expected_margin = Math.round((retail - cost) * 100) / 100;
          merged.total_shelf_value = Math.round(stock * retail * 100) / 100;
          return merged;
        }
        return item;
      });
      return {
        ...prev,
        inventory: updatedInventory,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleLogMultiItemPurchase = (purchase: {
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
  }) => {
    const cleanPurchaseAmt = Number(purchase.amount) || 0;
    const normalizedDate = normalizeIsoDate(purchase.date);
    const effectiveReceiptId = purchase.receiptId || `rcpt_lot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    setMasterState((prev) => {
      let updatedInventory = [...prev.inventory];
      const newlyGeneratedRestockCards: RestockReconciliationCard[] = [];

      const purchasedGoodNames = (purchase.itemLines || []).map((l: any) => l.itemName.trim()).filter(Boolean);
      const { canonicalName: canonicalSupplier, updatedSuppliers } = reconcileOrRegisterSupplier(
        purchase.supplier,
        prev.suppliers || [],
        {
          phone: purchase.supplierPhone,
          national_id: purchase.supplierNationalId,
          orderCost: cleanPurchaseAmt,
          deliveryDate: normalizedDate,
          suppliedItems: purchasedGoodNames
        }
      );

      const newPayout: PayoutOrDrawing = {
        id: `payout_cargo_${effectiveReceiptId}`,
        date: normalizedDate,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        amount: cleanPurchaseAmt,
        type: "SUPPLIER_PAYOUT",
        payment_channel: purchase.payment_channel,
        notes: `${canonicalSupplier} [ID: ${purchase.supplierNationalId || "N/A"}, Phone: ${purchase.supplierPhone || "N/A"}]: ${purchase.items} [${purchase.payment_channel}]`
      };

      if (purchase.itemLines && purchase.itemLines.length > 0) {
        purchase.itemLines.forEach((line) => {
          const lineQty = Number(line.quantity) || 0;
          const packMultiplier = getSupplyUnitMultiplier(line.unit);
          const totalRetailUnitsReceived = Math.max(1, Math.round(lineQty * packMultiplier * 100) / 100);
          const lineTotalCost = Number(line.totalCost) || 0;
          const lineUnitCost =
            lineTotalCost > 0
              ? deriveUnitWholesaleCost(lineTotalCost, lineQty || 1, line.unit)
              : Number(line.unitCost) || 0;
          const lineRetailPrice = Number(line.retailPrice) || 0;

          const existingIdx = updatedInventory.findIndex((inv) =>
            doProductsMatch(inv.name, line.itemName)
          );

          const prevBatchUnits = existingIdx >= 0 && Number(updatedInventory[existingIdx].current_stock) > 0
            ? Number(updatedInventory[existingIdx].current_stock)
            : totalRetailUnitsReceived;

          const unitWholesale = lineUnitCost > 0 ? lineUnitCost : (existingIdx >= 0 ? Number(updatedInventory[existingIdx].unit_cost) || 50 : 50);
          const unitRetail = lineRetailPrice > 0 ? lineRetailPrice : (existingIdx >= 0 ? Number(updatedInventory[existingIdx].unit_retail) || Math.round(unitWholesale * 1.2 * 100) / 100 : Math.round(unitWholesale * 1.2 * 100) / 100);
          const defaultRemains = Math.max(0, Math.min(2, Math.round(prevBatchUnits * 0.15)));
          const defaultEaten = 0;
          const defaultSold = Math.max(0, prevBatchUnits - defaultRemains - defaultEaten);

          const autoCard: RestockReconciliationCard = {
            id: `restock_${Date.now()}_${Math.floor(Math.random() * 1000)}_${line.itemName.slice(0, 4).toLowerCase()}`,
            skuName: line.itemName,
            category: line.category || (existingIdx >= 0 ? updatedInventory[existingIdx].category : "Wholesale Supply"),
            unitType: line.unit || "Packets",
            piecesPerPack: packMultiplier,
            previousBatchQty: prevBatchUnits,
            previousBatchTotalUnits: prevBatchUnits,
            previousBatchDate: "Previous Batch Recorded (Yesterday)",
            previousBatchCost: prevBatchUnits * unitWholesale,
            newBatchQty: totalRetailUnitsReceived,
            newBatchDate: normalizedDate,
            supplierName: canonicalSupplier,
            deliveryNoteNumber: purchase.notes || "Inward Restock Delivery",
            remainsOnShelf: defaultRemains,
            ownerConsumedQty: defaultEaten,
            spoilageRejectsQty: 0,
            giveawaysQty: 0,
            unitRetailPrice: unitRetail,
            unitCost: unitWholesale,
            calculatedSoldQty: defaultSold,
            calculatedRevenue: defaultSold * unitRetail,
            calculatedCogs: defaultSold * unitWholesale,
            calculatedGrossProfit: defaultSold * (unitRetail - unitWholesale),
            calculatedOwnerDrawing: defaultEaten * unitWholesale,
            calculatedSpoilageLoss: 0,
            status: "PENDING_AUTHORIZATION",
            paymentMethod: purchase.payment_channel === "MPESA" ? "MPESA" : "CASH",
            notes: `Auto-generated when ${lineQty} ${line.unit} (${totalRetailUnitsReceived} retail units) of ${line.itemName} arrived from ${canonicalSupplier}. Authorize yesterday's sales without typing.`
          };
          newlyGeneratedRestockCards.push(autoCard);

          if (existingIdx >= 0) {
            const existing = updatedInventory[existingIdx];
            const addedStock = totalRetailUnitsReceived;
            const updatedStock = (Number(existing.current_stock) || 0) + addedStock;
            const updatedCost = lineUnitCost > 0 ? lineUnitCost : (Number(existing.unit_cost) || 0);
            const updatedRetail = lineRetailPrice > 0 ? lineRetailPrice : (Number(existing.unit_retail) || 0);
            
            updatedInventory[existingIdx] = {
              ...existing,
              current_stock: updatedStock,
              unit_cost: updatedCost,
              unit_retail: updatedRetail,
              total_shelf_value: Math.round(updatedStock * updatedRetail * 100) / 100,
              expected_margin: Math.round((updatedRetail - updatedCost) * 100) / 100,
              supplier: canonicalSupplier,
              bulk_pack_size: packMultiplier,
              bulk_pack_name: line.unit
            };
          } else {
            const effectiveRetail = lineRetailPrice || Math.round(lineUnitCost * 1.25 * 100) / 100;
            const newSku: InventoryItem = {
              id: `sku_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              name: line.itemName.trim(),
              category: line.category || "General Wholesaler",
              unit_type: packMultiplier > 1 ? "Packets" : (line.unit || "pcs"),
              unit_cost: lineUnitCost,
              unit_retail: effectiveRetail,
              current_stock: totalRetailUnitsReceived,
              opening_stock: totalRetailUnitsReceived,
              expected_margin: Math.round((effectiveRetail - lineUnitCost) * 100) / 100,
              total_shelf_value: Math.round(totalRetailUnitsReceived * effectiveRetail * 100) / 100,
              velocity_badge: "NORMAL",
              reorder_point: 5,
              supplier: canonicalSupplier,
              bulk_pack_size: packMultiplier,
              bulk_pack_name: line.unit,
              is_bulk_decanted: packMultiplier > 1
            };
            updatedInventory = [newSku, ...updatedInventory];
          }
        });
      }

      // Ensure every purchase with itemLines also has a matching receipt record in receiptsArchive
      // so the chronological receipt sales engine can arrange dates and generate minute sales
      let updatedArchive = [...(prev.receiptsArchive || [])];
      if (purchase.itemLines && purchase.itemLines.length > 0) {
        const totalRetailVal = purchase.itemLines.reduce((acc, l) => {
          const qty = Number(l.quantity) || 1;
          const uCost = Number(l.unitCost) || 0;
          const rPrice = Number(l.retailPrice) || Math.round(uCost * 1.2 * 100) / 100;
          return acc + qty * rPrice;
        }, 0);
        const profitVal = Math.max(0, totalRetailVal - cleanPurchaseAmt);
        const markupVal = cleanPurchaseAmt > 0 ? Math.round((profitVal / cleanPurchaseAmt) * 1000) / 10 : 0;

        const autoReceiptRecord: SavedReceiptRecord = {
          id: effectiveReceiptId,
          receiptNumber: purchase.receiptNumber || `DN-${Math.floor(1000 + Math.random() * 9000)}`,
          supplierName: canonicalSupplier,
          receiptDate: normalizedDate,
          paymentMode: purchase.payment_channel === "MPESA" ? "MPESA" : "CASH",
          status: "approved",
          totalCost: cleanPurchaseAmt,
          totalRetailShelfValue: Math.round(totalRetailVal * 100) / 100,
          totalPotentialProfit: Math.round(profitVal * 100) / 100,
          markupPercentage: markupVal,
          itemsCount: purchase.itemLines.length,
          items: purchase.itemLines.map((l, idx) => {
            const qty = Number(l.quantity) || 1;
            const uCost = Number(l.unitCost) || 0;
            const rPrice = Number(l.retailPrice) || Math.round(uCost * 1.2 * 100) / 100;
            return {
              id: l.id || `line_rcpt_${Date.now()}_${idx}`,
              itemName: l.itemName,
              supplyUnitsReceived: qty,
              supplyUnit: l.unit || "Packets",
              conversionRatio: 1,
              retailUnitsAdded: qty,
              retailUnit: l.unit || "Packets",
              unitCostAtDelivery: uCost,
              lineCost: Number(l.totalCost) || Math.round(qty * uCost * 100) / 100,
              retailPrice: rPrice,
              expectedMargin: Math.max(0, Math.round((rPrice - uCost) * 100) / 100),
              approved: true
            };
          }),
          imageUrl: purchase.receiptImageUrl,
          processedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          decidedAt: new Date().toISOString(),
          notes: purchase.notes
        };

        updatedArchive = [
          autoReceiptRecord,
          ...updatedArchive.filter((r) => r.id !== effectiveReceiptId)
        ];
      }

      const existingPayouts = (prev.payouts || []).filter((p) => p.id !== newPayout.id);

      // Close any previous pending restock cards for the newly restocked items (Restock-Trigger closes previous batch!)
      const closedPreviousCards = (prev.restockCards || []).map((card) => {
        const isRestockedItem = (purchase.itemLines || []).some((l) => doProductsMatch(card.skuName, l.itemName));
        if (isRestockedItem && card.status === "PENDING_AUTHORIZATION") {
          return {
            ...card,
            status: "AUTHORIZED_AND_RECONCILED" as const,
            authorizedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            authorizedDate: normalizedDate,
            notes: `${card.notes || ""} • Closed automatically by Restock-Trigger on ${normalizedDate}.`
          };
        }
        return card;
      });

      const isCashOutflow = purchase.payment_channel === "CASH";
      const isMpesaOutflow = purchase.payment_channel === "MPESA";

      const nextState: AlacioMasterState = {
        ...prev,
        inventory: updatedInventory,
        payouts: [newPayout, ...existingPayouts],
        cash_register_balance: isCashOutflow
          ? Math.max(0, Math.round(((Number(prev.cash_register_balance) || 0) - cleanPurchaseAmt) * 100) / 100)
          : prev.cash_register_balance,
        mpesa_float_balance: isMpesaOutflow
          ? Math.max(0, Math.round(((Number(prev.mpesa_float_balance) || 0) - cleanPurchaseAmt) * 100) / 100)
          : prev.mpesa_float_balance,
        suppliers: updatedSuppliers,
        receiptsArchive: updatedArchive,
        restockCards: [...newlyGeneratedRestockCards, ...closedPreviousCards],
        kpis: calculateKpis(updatedInventory, prev.warehouse),
        last_updated: new Date().toISOString()
      };

      return reconcileChronologicalReceiptsAndSales(nextState);
    });
  };

  // ARCHIVE WORKED-ON OR REJECTED RECEIPT IN DATABASE (GIVES SPACE FOR NEW UPLOADS)
  const handleSaveReceiptToDatabase = (receipt: SavedReceiptRecord) => {
    setMasterState((prev) => {
      const normalizedReceipt: SavedReceiptRecord = {
        ...receipt,
        receiptDate: normalizeIsoDate(receipt.receiptDate)
      };
      const existingArchive = prev.receiptsArchive || [];
      const updatedArchive = [
        normalizedReceipt,
        ...existingArchive.filter((r) => r.id !== normalizedReceipt.id)
      ];
      const nextState: AlacioMasterState = {
        ...prev,
        receiptsArchive: updatedArchive,
        last_updated: new Date().toISOString()
      };
      return reconcileChronologicalReceiptsAndSales(nextState);
    });
  };

  // AUTHORIZE RESTOCK TURNOVER AS RECONCILED SALE
  const handleAuthorizeRestockSale = (payload: {
    cardId: string;
    skuName: string;
    soldQty: number;
    revenue: number;
    cogs: number;
    ownerDrawingCost: number;
    spoilageLoss: number;
    ownerConsumedQty: number;
    spoilageRejectsQty: number;
    remainsOnShelf: number;
    newBatchQty: number;
    paymentMethod: "CASH" | "MPESA" | "SPLIT";
    salesDate: string;
    notes?: string;
  }) => {
    const updater = isDemoMode ? setDemoState : setAlacioState;
    updater((prev) => {
      // 1. Post to Sales Ledger
      const newSale: SalesLedgerItem = {
        id: `sale_restock_${Date.now()}`,
        date: payload.salesDate,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        customer_name: "Walk-in Counter (Restock Authorized)",
        items_summary: `Restock Turnover: ${payload.soldQty}x ${payload.skuName}`,
        total_amount: payload.revenue,
        cash_paid: payload.paymentMethod === "CASH" ? payload.revenue : (payload.paymentMethod === "SPLIT" ? payload.revenue / 2 : 0),
        mpesa_paid: payload.paymentMethod === "MPESA" ? payload.revenue : (payload.paymentMethod === "SPLIT" ? payload.revenue / 2 : 0),
        debt_amount: 0,
        payment_method: payload.paymentMethod,
        payment_channel: payload.paymentMethod,
        cash_received: payload.paymentMethod === "CASH" ? payload.revenue : 0
      };

      // 2. Post Owner Drawing Payout if proprietor ate/drank items (protects cash drawer!)
      const newPayouts: PayoutOrDrawing[] = [...(prev.payouts || [])];
      if (payload.ownerConsumedQty > 0 && payload.ownerDrawingCost > 0) {
        newPayouts.unshift({
          id: `payout_owner_${Date.now()}`,
          date: payload.salesDate,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          amount: payload.ownerDrawingCost,
          type: "OWNER_DRAWING",
          payment_channel: "CASH",
          notes: `Proprietor consumption: ${payload.ownerConsumedQty}x ${payload.skuName} (Internal tea/family drawing) [Protected from cash gap]`
        });
      }

      // 3. Post Spoilage / Damage Expense if rejects exist
      if (payload.spoilageRejectsQty > 0 && payload.spoilageLoss > 0) {
        newPayouts.unshift({
          id: `payout_spoil_${Date.now()}`,
          date: payload.salesDate,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          amount: payload.spoilageLoss,
          type: "BUSINESS_EXPENSE",
          payment_channel: "CASH",
          notes: `Inventory shrinkage: ${payload.spoilageRejectsQty}x ${payload.skuName} stale/broken rejects write-off`
        });
      }

      // 4. Update shelf stock: remainsOnShelf + newBatchQty
      const updatedInventory = prev.inventory.map((inv) => {
        if (inv.name.toLowerCase().includes(payload.skuName.toLowerCase()) || payload.skuName.toLowerCase().includes(inv.name.toLowerCase())) {
          const targetStock = payload.remainsOnShelf + payload.newBatchQty;
          return {
            ...inv,
            current_stock: targetStock,
            total_shelf_value: targetStock * inv.unit_retail
          };
        }
        return inv;
      });

      // 5. Update Restock Card state to AUTHORIZED_AND_RECONCILED
      const updatedRestockCards = (prev.restockCards || []).map((c) => {
        if (c.id === payload.cardId) {
          return {
            ...c,
            status: "AUTHORIZED_AND_RECONCILED" as const,
            authorizedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            authorizedDate: payload.salesDate,
            remainsOnShelf: payload.remainsOnShelf,
            ownerConsumedQty: payload.ownerConsumedQty,
            spoilageRejectsQty: payload.spoilageRejectsQty,
            calculatedSoldQty: payload.soldQty,
            calculatedRevenue: payload.revenue,
            calculatedCogs: payload.cogs,
            calculatedGrossProfit: payload.revenue - payload.cogs,
            calculatedOwnerDrawing: payload.ownerDrawingCost,
            calculatedSpoilageLoss: payload.spoilageLoss,
            paymentMethod: payload.paymentMethod
          };
        }
        return c;
      });

      const cashDelta = payload.paymentMethod === "CASH" ? payload.revenue : (payload.paymentMethod === "SPLIT" ? payload.revenue / 2 : 0);
      const mpesaDelta = payload.paymentMethod === "MPESA" ? payload.revenue : (payload.paymentMethod === "SPLIT" ? payload.revenue / 2 : 0);

      return {
        ...prev,
        inventory: updatedInventory,
        salesLedger: [newSale, ...(prev.salesLedger || [])],
        payouts: newPayouts,
        restockCards: updatedRestockCards,
        cash_register_balance: prev.cash_register_balance + cashDelta,
        mpesa_float_balance: prev.mpesa_float_balance + mpesaDelta,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleDismissRestockCard = (cardId: string) => {
    const updater = isDemoMode ? setDemoState : setAlacioState;
    updater((prev) => ({
      ...prev,
      restockCards: (prev.restockCards || []).filter((c) => c.id !== cardId)
    }));
  };

  const handleAuthorizeSupplierBatch = (payload: {
    batchId: string;
    supplierName: string;
    batchNumber: string;
    deliveredDate: string;
    items: BatchTurnoverItem[];
    totalRevenue: number;
    totalProfit: number;
    paymentMethod: "CASH" | "MPESA" | "SPLIT";
    salesDate: string;
    notes?: string;
  }) => {
    const updater = isDemoMode ? setDemoState : setAlacioState;
    updater((prev) => {
      const recordDate = payload.salesDate || new Date().toISOString().slice(0, 10);
      const { canonicalName: canonicalSupplier, updatedSuppliers } = reconcileOrRegisterSupplier(
        payload.supplierName,
        prev.suppliers || [],
        {
          deliveryDate: payload.deliveredDate || recordDate,
          suppliedItems: payload.items.map((i) => i.skuName)
        }
      );

      const itemsSummary = payload.items
        .filter((i) => i.calculatedSoldQty > 0)
        .map((i) => `${i.calculatedSoldQty} ${i.unitType} ${i.skuName}`)
        .join(", ");

      const cashDelta = payload.paymentMethod === "CASH" 
        ? payload.totalRevenue 
        : payload.paymentMethod === "SPLIT" 
        ? Math.round(payload.totalRevenue / 2) 
        : 0;
      const mpesaDelta = payload.paymentMethod === "MPESA" 
        ? payload.totalRevenue 
        : payload.paymentMethod === "SPLIT" 
        ? Math.round(payload.totalRevenue / 2) 
        : 0;

      const newSale: SalesLedgerItem = {
        id: `sale_batch_${Date.now()}`,
        date: recordDate,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        customer_name: `Walk-in Counter (${canonicalSupplier} Batch)`,
        items_summary: itemsSummary || `Batch Turnover: ${canonicalSupplier} #${payload.batchNumber}`,
        total_amount: payload.totalRevenue,
        cash_paid: cashDelta,
        mpesa_paid: mpesaDelta,
        debt_amount: 0,
        payment_method: payload.paymentMethod,
        payment_channel: payload.paymentMethod,
        cash_received: cashDelta
      };

      const newPayouts: PayoutOrDrawing[] = [...(prev.payouts || [])];
      
      // Owner consumption (e.g., Kadogo chai / staff use) - protects cash drawer from phantom shortage
      const totalOwnerUsedCost = payload.items.reduce((sum, i) => sum + (i.ownerUsedQty * i.unitCost), 0);
      const totalOwnerUsedUnits = payload.items.reduce((sum, i) => sum + i.ownerUsedQty, 0);
      if (totalOwnerUsedUnits > 0 && totalOwnerUsedCost > 0) {
        newPayouts.unshift({
          id: `payout_owner_${Date.now()}`,
          date: recordDate,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          amount: Math.round(totalOwnerUsedCost * 100) / 100,
          type: "OWNER_DRAWING",
          payment_channel: "CASH",
          notes: `Proprietor consumption: ${totalOwnerUsedUnits} units from ${payload.supplierName} (Batch #${payload.batchNumber}) [Protected from cash gap]`
        });
      }

      // Spoilage / Damage / Expired loss write-off
      const totalDestroyedCost = payload.items.reduce((sum, i) => sum + (i.destroyedQty * i.unitCost), 0);
      const totalDestroyedUnits = payload.items.reduce((sum, i) => sum + i.destroyedQty, 0);
      if (totalDestroyedUnits > 0 && totalDestroyedCost > 0) {
        newPayouts.unshift({
          id: `payout_spoil_${Date.now()}`,
          date: recordDate,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          amount: Math.round(totalDestroyedCost * 100) / 100,
          type: "BUSINESS_EXPENSE",
          payment_channel: "CASH",
          notes: `Inventory shrinkage: ${totalDestroyedUnits} units damaged/expired from ${payload.supplierName} (Batch #${payload.batchNumber})`
        });
      }

      // Update inventory so older remaining pieces stay on shelf and add into inventory
      let updatedInventory = [...(prev.inventory || [])];
      payload.items.forEach((item) => {
        const remaining = Number(item.remainingOnShelf) || 0;
        const existingIdx = updatedInventory.findIndex((inv) => 
          doProductsMatch(inv.name, item.skuName) || 
          inv.name.toLowerCase().includes(item.skuName.toLowerCase()) || 
          item.skuName.toLowerCase().includes(inv.name.toLowerCase())
        );

        if (existingIdx >= 0) {
          const inv = updatedInventory[existingIdx];
          // Preserve remaining older pieces in current_stock
          const newStock = Math.max(remaining, Number(inv.current_stock) || 0);
          updatedInventory[existingIdx] = {
            ...inv,
            current_stock: newStock,
            unit_cost: item.unitCost > 0 ? item.unitCost : inv.unit_cost,
            unit_retail: item.unitRetail > 0 ? item.unitRetail : inv.unit_retail,
            total_shelf_value: Math.round(newStock * (item.unitRetail || inv.unit_retail) * 100) / 100,
            expected_margin: Math.round(((item.unitRetail || inv.unit_retail) - (item.unitCost || inv.unit_cost)) * 100) / 100
          };
        } else if (remaining > 0 || item.batchQty > 0) {
          // If not in inventory yet, add it as a new inventory item
          const newSku: InventoryItem = {
            id: `sku_batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: item.skuName.trim(),
            category: "Wholesale Delivery",
            unit_type: item.unitType || "pcs",
            unit_cost: item.unitCost,
            unit_retail: item.unitRetail,
            current_stock: remaining > 0 ? remaining : item.batchQty,
            opening_stock: remaining > 0 ? remaining : item.batchQty,
            expected_margin: Math.round((item.unitRetail - item.unitCost) * 100) / 100,
            total_shelf_value: Math.round((remaining > 0 ? remaining : item.batchQty) * item.unitRetail * 100) / 100,
            velocity_badge: "FAST",
            reorder_point: 2,
            supplier: payload.supplierName
          };
          updatedInventory.push(newSku);
        }
      });

      const newKpis = calculateKpis(updatedInventory, prev.warehouse);

      // Mark batch card as authorized
      const existingBatchCards = prev.supplierBatchCards || [];
      const updatedBatchCards = existingBatchCards.map((b) => {
        if (b.id === payload.batchId) {
          return {
            ...b,
            items: payload.items,
            totalBatchRevenue: payload.totalRevenue,
            totalBatchProfit: payload.totalProfit,
            status: "AUTHORIZED_AND_RECONCILED" as const,
            paymentMethod: payload.paymentMethod,
            authorizedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            authorizedDate: recordDate,
            notes: payload.notes
          };
        }
        return b;
      });

      return {
        ...prev,
        inventory: updatedInventory,
        salesLedger: [newSale, ...(prev.salesLedger || [])],
        payouts: newPayouts,
        suppliers: updatedSuppliers,
        supplierBatchCards: updatedBatchCards,
        cash_register_balance: (Number(prev.cash_register_balance) || 0) + cashDelta,
        mpesa_float_balance: (Number(prev.mpesa_float_balance) || 0) + mpesaDelta,
        kpis: newKpis,
        last_updated: new Date().toISOString()
      };
    });
  };

  const handleDismissSupplierBatch = (batchId: string) => {
    const updater = isDemoMode ? setDemoState : setAlacioState;
    updater((prev) => ({
      ...prev,
      supplierBatchCards: (prev.supplierBatchCards || []).filter((b) => b.id !== batchId)
    }));
  };

  // -------------------------------------------------------------
  // VIEW 1: PUBLIC LANDING PAGE
  // -------------------------------------------------------------
  if (currentView === "landing") {
    return (
      <>
        <YuBiFloLandingPage
          state={alacioState}
          isLoggedIn={!!currentUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onLaunchDukaDemo={() => {
            handleEnterDukaSpace("landing");
          }}
          onGetStarted={() => {
            if (currentUser) {
              setCurrentView("workspace");
              setActiveTab("dashboard");
            } else {
              handleEnterDukaSpace("landing");
            }
          }}
          onLaunchRetailWorkspace={() => {
            if (currentUser) {
              setCurrentView("workspace");
              setActiveTab("dashboard");
            } else {
              setAuthModalMode("signin");
              setIsAuthModalOpen(true);
            }
          }}
          onOpenSovereignCommand={() => {
            setCurrentView("yubiflo_command");
          }}
          onOpenBlueprints={() => {
            const bp = PLATFORM_BLUEPRINTS[1];
            setActiveDevelopingBlueprint(bp);
            setCurrentView("developing");
          }}
          onCompleteOnboarding={(customState) => {
            setAlacioState((prev) => ({
              ...prev,
              ...customState,
              last_updated: new Date().toISOString()
            }));
          }}
        />

        <UnifiedAuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: SOVEREIGN PLATFORM COMMAND (PLATFORM DECK)
  // -------------------------------------------------------------
  if (currentView === "yubiflo_command") {
    return (
      <Suspense fallback={<TabLoadingSkeleton />}>
        <YuBiFloEnterpriseCommand
          alacioState={currentMasterState}
          onLaunchAlacioShop={() => {
            setCurrentView("workspace");
            setActiveTab("dashboard");
          }}
          onOpenBlueprints={() => setCurrentView("landing")}
        />
      </Suspense>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: TEMPLATE BLUEPRINT IN DEVELOPMENT
  // -------------------------------------------------------------
  if (currentView === "developing" && activeDevelopingBlueprint) {
    return (
      <Suspense fallback={<TabLoadingSkeleton />}>
        <TemplateInDevelopmentView
          blueprint={activeDevelopingBlueprint}
          onBackToLanding={() => setCurrentView("landing")}
          onLaunchAlacioPilot={() => {
            setCurrentView("workspace");
            setActiveTab("dashboard");
          }}
        />
      </Suspense>
    );
  }

  const handleResetToSkeleton = () => {
    const bizName = currentUser?.businessName || "Musa General Retailers";
    const bizType = currentUser?.businessType || "Retail / Duka";
    const skeleton = createSkeletonBusinessState(bizName, bizType);
    setAlacioState(skeleton);
    saveAlacioState(skeleton);
    setActiveTab("launchpad");
  };

  // -------------------------------------------------------------
  // VIEW 4: UNIFIED SAAS WORKSPACE SHELL (DUKA SPACE DEMO & REAL)
  // Both share the exact same top bar, sidebar, typography, theme, and spacing.
  // -------------------------------------------------------------
  return (
    <>
      <SaasAppShell
        user={currentUser}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSwitchAccount={handleSwitchAccount}
        onCreateAccount={handleCreateAccount}
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        isDemo={isDemoMode}
        onSwitchWorkspace={(target) => {
          if (target === "demo") {
            handleEnterDukaSpace("workspace");
          } else {
            if (!currentUser) {
              handleStartRealFromDemo();
            } else {
              handleExitDukaSpace();
            }
          }
        }}
        onStartRealWorkspace={handleStartRealFromDemo}
        onExitDemo={handleExitDukaSpace}
        onOpenQuickSale={() => setActiveTab("voice_ledger")}
        onOpenQuickPurchase={() => setActiveTab("purchases")}
        onOpenQuickDeni={() => setActiveTab("customer_deni")}
        onResetToSkeleton={handleResetToSkeleton}
        onOpenDataVault={() => setIsDataVaultOpen(true)}
        onOpenSettings={() => {}}
        onSignOut={() => {
          signOut();
          setCurrentUser(null);
          setCurrentView("landing");
        }}
        onSignOutAllDevices={() => {
          signOutAllDevices();
          setCurrentUser(null);
          setCurrentView("landing");
        }}
      >
        <Suspense fallback={<TabLoadingSkeleton />}>
          {/* TAB 1: LAUNCHPAD */}
          {activeTab === "launchpad" && (
          <LaunchpadTab
            state={currentMasterState}
            onNavigateTab={setActiveTab}
            launchpadProgress={isDemoMode ? demoLaunchpadProgress : realLaunchpadProgress}
            onToggleStep={(key) => {
              if (!isDemoMode) {
                setRealLaunchpadProgress((prev) => ({ ...prev, [key]: !prev[key] }));
              }
            }}
          />
        )}

        {/* TAB 2: DASHBOARD */}
        {activeTab === "dashboard" && (() => {
          const currentActiveAccount = accounts.find((a) => a.id === activeAccountId);
          const activeBusinessName = currentActiveAccount?.businessName || currentMasterState.merchant_name || "Alacio Mini shop";
          const isAlacio = activeBusinessName.toLowerCase().includes("alacio");
          const activeProprietor = currentActiveAccount?.proprietorName || (isAlacio ? "Rose" : (currentUser?.name?.split(" ")[0] || "Moses"));
          const activeManager = currentActiveAccount?.managerName || (isAlacio ? "Moses Mukangai" : undefined);

          return (
            <SaasDashboardTab
              state={currentMasterState}
              userName={activeProprietor}
              proprietorName={activeProprietor}
              managerName={activeManager}
              businessName={activeBusinessName}
              accountRole={currentActiveAccount?.role || (isAlacio ? "MANAGER" : "OWNER")}
              onNavigateTab={setActiveTab}
              onOpenQuickSale={() => setActiveTab("voice_ledger")}
              onOpenQuickPurchase={() => setActiveTab("purchases")}
              onOpenQuickDeni={() => setActiveTab("customer_deni")}
              onAddExpense={handleAddExpense}
              launchpadProgress={isDemoMode ? demoLaunchpadProgress : realLaunchpadProgress}
              isDemo={isDemoMode}
            />
          );
        })()}

        {/* TAB 3: SUPPLY-DRIVEN SALES */}
        {(activeTab === "supply_sales" || activeTab === "sales_supply") && (
          <SupplyDrivenSalesTab
            state={currentMasterState}
            onCommitSupplyDrivenSale={handleCommitSupplyDrivenSale}
            onAuthorizeRestockSale={handleAuthorizeRestockSale}
            onDismissRestockCard={handleDismissRestockCard}
            onAuthorizeSupplierBatch={handleAuthorizeSupplierBatch}
            onDismissSupplierBatch={handleDismissSupplierBatch}
          />
        )}

        {/* TAB 4: PURCHASES (MULTI-GOODS RESTOCK, RECEIPT OCR & SELLING PRICES) */}
        {(activeTab === "purchases" || activeTab === "purchases_cargo" || activeTab === "receipt_ocr" || activeTab === "selling_prices") && (
          <PurchasesTab
            state={currentMasterState}
            initialSupplier={preselectedSupplier}
            initialView={
              activeTab === "receipt_ocr"
                ? "upload"
                : activeTab === "purchases_cargo"
                ? "cargo"
                : activeTab === "selling_prices"
                ? "selling_prices"
                : "all"
            }
            onNavigateTab={setActiveTab}
            onLogPurchase={handleLogMultiItemPurchase}
            onAuthorizeRestockSale={handleAuthorizeRestockSale}
            onDismissRestockCard={handleDismissRestockCard}
            onSaveReceiptToDatabase={handleSaveReceiptToDatabase}
            onAddExpense={handleAddExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            onUpdateInventoryItem={handleUpdateInventoryItem}
          />
        )}

        {/* TAB 4B: SUPPLIERS & DISTRIBUTORS (NATIONAL ID & PHONE COUNTERPARTY REGISTRY) */}
        {activeTab === "suppliers" && (
          <SuppliersTab
            state={currentMasterState}
            onNavigateTab={setActiveTab}
            onAddSupplier={handleAddSupplier}
            onEditSupplier={handleEditSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onPaySupplier={handlePaySupplier}
            onSelectSupplierForPurchase={(supplierName) => {
              setPreselectedSupplier(supplierName);
              setActiveTab("purchases");
            }}
          />
        )}

        {/* TAB 4C: OWNER EXPENSES & PERSONAL WITHDRAWALS (RENT, MISC, TRAVEL, PERSONAL WITHDRAWAL) */}
        {(activeTab === "owner_expenses" || activeTab === "expenses") && (
          <OwnerExpensesTab
            state={currentMasterState}
            onAddExpense={handleAddExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {/* TAB 5: STOCK VAULT & SUPPLIERS */}
        {activeTab === "stock_vault" && (
          <StockVaultSuppliersTab
            state={currentMasterState}
            onAddStockItem={(item) => {
              const updater = isDemoMode ? setDemoState : setAlacioState;
              updater((prev) => ({
                ...prev,
                inventory: [item, ...prev.inventory],
                last_updated: new Date().toISOString()
              }));
            }}
            onAddSupplier={(supplier) => {
              const updater = isDemoMode ? setDemoState : setAlacioState;
              updater((prev) => ({
                ...prev,
                suppliers: [supplier, ...(prev.suppliers || [])],
                last_updated: new Date().toISOString()
              }));
            }}
          />
        )}

        {/* TAB 6: DAWN LOCK */}
        {activeTab === "dawn_lock" && (
          <DawnLockTab
            state={currentMasterState}
            onUpdateFloat={(floatData) => handleUpdateFloat(floatData)}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* TAB 7: THE VOICE LEDGER (VOICE SIMULATOR IN DEMO) */}
        {activeTab === "voice_ledger" && (
          <UnifiedVoiceLedgerTab
            state={currentMasterState}
            onCommitTransaction={handleVoiceTransaction}
            onCommitParsedSale={handleApproveAmbientDraft}
            onApproveDraft={handleApproveVoiceDraft}
            lastLoggedMessage={lastVoiceLog}
            customerConsent={currentMasterState.vcr_customer_consent}
            onToggleConsent={(val) => {
              const updater = isDemoMode ? setDemoState : setAlacioState;
              updater((prev) => ({ ...prev, vcr_customer_consent: val }));
            }}
            isDemo={isDemoMode}
          />
        )}

        {/* TAB 8: CUSTOMERS */}
        {activeTab === "customers" && (
          <CustomersCreditTab
            currency={currentMasterState.currency}
            customers={currentMasterState.customers}
            onRepayDebt={handleRepayDebt}
            onAddDebtor={handleAddDebtor}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {/* TAB 9: CUSTOMER DENI */}
        {activeTab === "customer_deni" && (
          <CustomersCreditTab
            currency={currentMasterState.currency}
            customers={currentMasterState.customers}
            onRepayDebt={handleRepayDebt}
            onAddDebtor={handleAddDebtor}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            initialFilter="has_debt"
          />
        )}

        {/* TAB 10: 3-FOLD LEDGERS (P / R / N) */}
        {activeTab === "three_fold_ledgers" && (
          <ThreeFoldLedgersTab
            state={currentMasterState}
            onPaySupplier={handlePaySupplier}
          />
        )}

        {/* TAB 11: BUSINESS ANALYTICS (36 TOOLS) */}
        {activeTab === "analytics" && (
          <AnalyticsTab
            state={currentMasterState}
          />
        )}
        </Suspense>
      </SaasAppShell>

      {/* COMBINED INSTAGRAM-STYLE SIGN IN / SIGN UP MODAL */}
      <UnifiedAuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* RESTOCK MODAL */}
      {isRestockOpen && selectedRestockItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121214] border-2 border-zinc-700 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <RefreshCw size={16} className="text-white" /> Restock-Trigger Accounting: {selectedRestockItem.name}
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
                  step="any"
                  required
                  min={0}
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 24 or 1.5"
                  className="w-full bg-[#09090b] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:outline-none focus:border-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Wholesale Cost ({currentMasterState.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={restockCost}
                    onChange={(e) => setRestockCost(e.target.value)}
                    className="w-full bg-[#09090b] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Retail Shelf Price ({currentMasterState.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
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

      {/* LAZY LOADED MODALS */}
      <Suspense fallback={null}>
        {/* 1-TAP GAP RESOLUTION MODAL */}
        {isOneTapGapOpen && (
          <OneTapGapModal
            isOpen={isOneTapGapOpen}
            onClose={() => setIsOneTapGapOpen(false)}
            gapAmount={-1500}
            currency={currentMasterState.currency}
            onResolveGap={handleResolveGap}
          />
        )}

        {/* M-PESA STATEMENT IMPORT MODAL */}
        {isMpesaImportOpen && (
          <MpesaImportModal
            isOpen={isMpesaImportOpen}
            onClose={() => setIsMpesaImportOpen(false)}
            currency={currentMasterState.currency}
            onImportRecords={handleImportMpesa}
          />
        )}

        {/* PULL YOUR OWN APP (STANDALONE SINGLE-BUSINESS PWA & DATA EXPORT) */}
        {isPullYourOwnAppOpen && (
          <PullYourOwnAppModal
            isOpen={isPullYourOwnAppOpen}
            onClose={() => setIsPullYourOwnAppOpen(false)}
            state={currentMasterState}
          />
        )}

        {/* ZERO DATA LOSS & DATA PROTECTION VAULT MODAL */}
        {isDataVaultOpen && (
          <DataVaultModal
            isOpen={isDataVaultOpen}
            onClose={() => setIsDataVaultOpen(false)}
            masterState={currentMasterState}
            onStateRestored={(newState) => {
              if (isDemoMode) {
                setDemoState(newState);
              } else {
                setAlacioState(newState);
                saveAlacioState(newState, currentUser?.email, activeAccountId);
              }
            }}
          />
        )}
      </Suspense>
    </>
  );
}
