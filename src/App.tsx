import React, { useState, useEffect } from "react";
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
  SupplierProfile
} from "./types/alacio";
import { 
  loadAlacioState, 
  saveAlacioState, 
  calculateKpis,
  PLATFORM_BLUEPRINTS,
  PROJECT_ALACIO_CASE_STUDY
} from "./services/alacioStorage";
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

import SaasAppShell from "./components/SaasAppShell";
import SaasDashboardTab from "./components/tabs/SaasDashboardTab";
import LaunchpadTab, { LaunchpadProgress } from "./components/tabs/LaunchpadTab";
import SupplyDrivenSalesTab from "./components/tabs/SupplyDrivenSalesTab";
import PurchasesTab from "./components/tabs/PurchasesTab";
import StockVaultSuppliersTab from "./components/tabs/StockVaultSuppliersTab";
import DawnLockTab from "./components/tabs/DawnLockTab";
import UnifiedVoiceLedgerTab from "./components/tabs/UnifiedVoiceLedgerTab";
import CustomersCreditTab from "./components/tabs/CustomersCreditTab";
import ThreeFoldLedgersTab from "./components/tabs/ThreeFoldLedgersTab";
import AnalyticsTab from "./components/tabs/AnalyticsTab";
import { VoiceDraftRecord } from "./components/tabs/PendingDraftsQueueTab";
import TemplateInDevelopmentView from "./components/TemplateInDevelopmentView";
import OneTapGapModal from "./components/OneTapGapModal";
import MpesaImportModal from "./components/MpesaImportModal";
import PullYourOwnAppModal from "./components/PullYourOwnAppModal";
import { VoiceTransactionPayload } from "./components/VoiceLedger";
import YuBiFloEnterpriseCommand from "./components/YuBiFloEnterpriseCommand";
import YuBiFloLandingPage from "./components/YuBiFloLandingPage";
import UnifiedAuthModal from "./components/UnifiedAuthModal";

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

  // DUKA SPACE DEMO SANDBOX ISOLATION
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoOriginView, setDemoOriginView] = useState<"landing" | "workspace">("landing");
  const [demoState, setDemoState] = useState<AlacioMasterState>(() => loadDemoSandboxState());

  // REAL WORKSPACE STATE
  const [alacioState, setAlacioState] = useState<AlacioMasterState>(() => loadAlacioState());

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
  const [lastVoiceLog, setLastVoiceLog] = useState<string | null>(null);

  // Active state pointer: demoState when in demo, alacioState when in real workspace
  const currentMasterState = isDemoMode ? demoState : alacioState;

  // Persist real state to storage
  useEffect(() => {
    saveAlacioState(alacioState);
  }, [alacioState]);

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

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);

    if (isDemoMode) {
      // Signing up from inside demo creates a new, empty real workspace and opens its Launchpad
      setIsDemoMode(false);
      resetDemoSandbox();

      const newEmptyState: AlacioMasterState = {
        ...loadAlacioState(),
        merchant_name: user.businessName,
        client_type: user.businessType,
        tier: user.plan === "Pro" ? "PAID_BLUEPRINT" : "FREE_STARTER",
        salesLedger: [],
        payouts: [],
        customers: [],
        cash_register_balance: 0,
        mpesa_float_balance: 0,
        clean_trading_days: 0,
        vcr_daily_count: 0
      };
      setAlacioState(newEmptyState);
      saveAlacioState(newEmptyState);

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

      setCurrentView("workspace");
      setActiveTab("launchpad");
    } else {
      setCurrentView("workspace");
      setActiveTab("dashboard");
    }
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
            notes: "Created via Voice Simulator / VCR"
          });
        }
      }

      const derivedPaymentMethod: "CASH" | "MPESA" | "SPLIT" | "CREDIT" = 
        payload.debtAmount > 0 && (payload.cashPaid + payload.mpesaPaid) === 0 ? "CREDIT" :
        (payload.cashPaid > 0 && payload.mpesaPaid > 0 ? "SPLIT" : 
        (payload.mpesaPaid > 0 ? "MPESA" : "CASH"));

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
      const newSaleRecord: SalesLedgerItem = {
        id: `sl_supply_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
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
          date: new Date().toISOString().slice(0, 10),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          amount: payload.ownerDrawingCost,
          type: "OWNER_DRAWING",
          notes: `Owner consumed ${payload.ownerConsumedQty} units ${payload.skuName}`
        });
      }

      if (payload.supplyInvoiceCost > 0) {
        newPayouts.push({
          id: `payout_sup_${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
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
      const debtorRecord: CustomerDebtor = {
        id: `cust_${Date.now()}`,
        name: newDebtor.name,
        phone: newDebtor.phone,
        national_id: newDebtor.national_id,
        credit_limit: newDebtor.credit_limit,
        debt_balance: newDebtor.initial_debt,
        last_transaction_date: newDebtor.date || "Today",
        notes: newDebtor.notes
      };

      return {
        ...prev,
        customers: [debtorRecord, ...prev.customers],
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

  const handleUpdateFloat = (denoms: Record<string, number>) => {
    setMasterState((prev) => {
      const updatedDenoms = prev.floatDenominations.map((d) => {
        const key = `kes_${d.value}`;
        return {
          ...d,
          count: denoms[key] !== undefined ? denoms[key] : d.count
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

  const handleImportMpesa = (records: MpesaStatementRecord[]) => {
    setMasterState((prev) => ({
      ...prev,
      mpesaStatements: [...records, ...(prev.mpesaStatements || [])],
      last_updated: new Date().toISOString()
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
      <YuBiFloEnterpriseCommand
        alacioState={currentMasterState}
        onLaunchAlacioShop={() => {
          setCurrentView("workspace");
          setActiveTab("dashboard");
        }}
        onOpenBlueprints={() => setCurrentView("landing")}
      />
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: TEMPLATE BLUEPRINT IN DEVELOPMENT
  // -------------------------------------------------------------
  if (currentView === "developing" && activeDevelopingBlueprint) {
    return (
      <TemplateInDevelopmentView
        blueprint={activeDevelopingBlueprint}
        onBackToLanding={() => setCurrentView("landing")}
        onLaunchAlacioPilot={() => {
          setCurrentView("workspace");
          setActiveTab("dashboard");
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // VIEW 4: UNIFIED SAAS WORKSPACE SHELL (DUKA SPACE DEMO & REAL)
  // Both share the exact same top bar, sidebar, typography, theme, and spacing.
  // -------------------------------------------------------------
  return (
    <>
      <SaasAppShell
        user={currentUser}
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
        {activeTab === "dashboard" && (
          <SaasDashboardTab
            state={currentMasterState}
            userName={currentUser?.name || "Trader"}
            onNavigateTab={setActiveTab}
            onOpenQuickSale={() => setActiveTab("voice_ledger")}
            onOpenQuickPurchase={() => setActiveTab("purchases")}
            onOpenQuickDeni={() => setActiveTab("customer_deni")}
            launchpadProgress={isDemoMode ? demoLaunchpadProgress : realLaunchpadProgress}
            isDemo={isDemoMode}
          />
        )}

        {/* TAB 3: SUPPLY-DRIVEN SALES */}
        {activeTab === "supply_sales" && (
          <SupplyDrivenSalesTab
            state={currentMasterState}
            onCommitSupplyDrivenSale={handleCommitSupplyDrivenSale}
          />
        )}

        {/* TAB 4: PURCHASES */}
        {activeTab === "purchases" && (
          <PurchasesTab
            state={currentMasterState}
            onLogPurchase={(purchase) => {
              const updater = isDemoMode ? setDemoState : setAlacioState;
              updater((prev) => {
                const newPayout: PayoutOrDrawing = {
                  id: `payout_${Date.now()}`,
                  date: purchase.date,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  amount: purchase.amount,
                  type: "SUPPLIER_PAYOUT",
                  notes: `${purchase.supplier}: ${purchase.items} [${purchase.payment_channel}]`
                };
                return {
                  ...prev,
                  payouts: [newPayout, ...(prev.payouts || [])],
                  last_updated: new Date().toISOString()
                };
              });
            }}
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
            onUpdateFloat={(denoms) => handleUpdateFloat(denoms)}
            onResolveGap={(payout) => {
              const updater = isDemoMode ? setDemoState : setAlacioState;
              updater((prev) => ({
                ...prev,
                payouts: [payout, ...(prev.payouts || [])],
                last_updated: new Date().toISOString()
              }));
            }}
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
          />
        )}

        {/* TAB 11: BUSINESS ANALYTICS (36 TOOLS) */}
        {activeTab === "analytics" && (
          <AnalyticsTab
            state={currentMasterState}
          />
        )}
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
                    Wholesale Cost ({currentMasterState.currency})
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
                    Retail Shelf Price ({currentMasterState.currency})
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

      {/* 1-TAP GAP RESOLUTION MODAL */}
      <OneTapGapModal
        isOpen={isOneTapGapOpen}
        onClose={() => setIsOneTapGapOpen(false)}
        gapAmount={-1500}
        currency={currentMasterState.currency}
        onResolveGap={handleResolveGap}
      />

      {/* M-PESA STATEMENT IMPORT MODAL */}
      <MpesaImportModal
        isOpen={isMpesaImportOpen}
        onClose={() => setIsMpesaImportOpen(false)}
        currency={currentMasterState.currency}
        onImportRecords={handleImportMpesa}
      />

      {/* PULL YOUR OWN APP (STANDALONE SINGLE-BUSINESS PWA & DATA EXPORT) */}
      <PullYourOwnAppModal
        isOpen={isPullYourOwnAppOpen}
        onClose={() => setIsPullYourOwnAppOpen(false)}
        state={currentMasterState}
      />
    </>
  );
}
