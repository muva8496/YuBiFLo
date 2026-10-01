import React, { useState, useEffect, useRef } from "react";
import {
  InventoryItem,
  Merchant,
  MoneyOutExpense,
  SalesLedgerEntry,
  SupplyBatch,
  ReconciliationRecord,
  Supplier,
  Customer,
  DailyMorningFloatLog,
} from "../types";
import { AppStorage } from "../services/storage";
import { ExecutiveBloomDashboard } from "./dashboards/ExecutiveBloomDashboard";
import { RetailCommandDashboard } from "./dashboards/RetailCommandDashboard";
import { FinancialAuditDashboard } from "./dashboards/FinancialAuditDashboard";
import { CompactTraderDashboard } from "./dashboards/CompactTraderDashboard";
import YuBiFloDashboard from "./YuBiFloDashboard";

export type DashboardLayoutType = "velocity" | "executive" | "retail" | "audit" | "compact";

interface DashboardViewProps {
  merchant: Merchant;
  items: InventoryItem[];
  expenses: MoneyOutExpense[];
  batches: SupplyBatch[];
  sales: SalesLedgerEntry[];
  reconciliations: ReconciliationRecord[];
  morningLogs?: DailyMorningFloatLog[];
  suppliers?: Supplier[];
  customers?: Customer[];
  onOpenMoneyOut: () => void;
  onOpenRestock: (itemId?: string) => void;
  onOpenScanReceipts: () => void;
  onOpenReconcile: () => void;
  setActiveTab: (tab: string) => void;
  onOpenSettings?: () => void;
  isAdmin?: boolean;
  onOpenAdminAuth?: () => void;
  onOpenSubscriptionModal?: () => void;
  onSwitchTenant?: (merchantId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  merchant,
  items,
  expenses,
  batches,
  sales,
  reconciliations,
  morningLogs = AppStorage.getMorningLogs(),
  suppliers = AppStorage.getSuppliers(),
  customers = AppStorage.getCustomers(),
  onOpenMoneyOut,
  onOpenRestock,
  onOpenScanReceipts,
  onOpenReconcile,
  setActiveTab,
  onOpenSettings,
  isAdmin = false,
  onOpenAdminAuth,
  onOpenSubscriptionModal,
  onSwitchTenant,
}) => {
  // Dashboard Layout Persona state with persistence
  const [selectedLayout, setSelectedLayout] = useState<DashboardLayoutType>(() => {
    const saved = localStorage.getItem("yubiflo_dashboard_layout");
    return (saved as DashboardLayoutType) || "executive";
  });

  // Shop selector dropdown state
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const shopMenuRef = useRef<HTMLDivElement>(null);

  const handleSelectLayout = (layout: DashboardLayoutType) => {
    setSelectedLayout(layout);
    localStorage.setItem("yubiflo_dashboard_layout", layout);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shopMenuRef.current && !shopMenuRef.current.contains(e.target as Node)) {
        setIsShopMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Financial KPI calculations
  const totalRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.total_profit, 0);
  const totalMoneyOut = expenses.reduce((acc, e) => acc + e.total_cost, 0);
  const activeStockRetailValue = items.reduce(
    (acc, item) => acc + item.current_stock_qty * item.retail_price,
    0
  );
  const activeStockCostValue = items.reduce(
    (acc, item) => acc + item.current_stock_qty * item.unit_cost,
    0
  );
  const avgGrossMargin =
    totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const verifiedBatches = batches.filter((b) => b.status === "VERIFIED");

  // Botanical Growth Stage (Seedling 1 -> Budding 2 -> Blooming 3 -> Flourishing 4)
  const getStageData = () => {
    if (sales.length >= 10 && totalRevenue > 25000) {
      return { label: "Flourishing", number: 4, progress: 100 };
    }
    if (sales.length >= 4 || verifiedBatches.length >= 3) {
      return { label: "Blooming", number: 3, progress: 75 };
    }
    if (batches.length > 0 || items.length > 0) {
      return { label: "Budding", number: 2, progress: 50 };
    }
    return { label: "Seedling", number: 1, progress: 25 };
  };

  const stageData = getStageData();
  const allMerchants = AppStorage.getAllMerchants();

  return (
    <div id="dashboard-view" className="yubiflo-wrap text-[#F2F3F1] font-['Outfit',sans-serif]">
      {/* Topbar matching exact design specification */}
      <div className="yubiflo-topbar">
        <div className="yubiflo-brand">
          <div className="yubiflo-brand-mark">Y</div>
          <div>
            <div className="yubiflo-brand-name">YuBiFLo</div>
            <div className="yubiflo-brand-tag">Your business is a flower</div>
          </div>

          {/* Shop Pill with Multi-Store Quick Switcher */}
          <div className="relative" ref={shopMenuRef} style={{ marginLeft: "18px" }}>
            <div
              id="yubiflo-shop-pill"
              className="yubiflo-shop-pill"
              onClick={() => setIsShopMenuOpen(!isShopMenuOpen)}
              title="Click to switch shop or manage locations"
            >
              ▾ <b>{merchant.business_name || "Alacio Mini Shop"}</b> {merchant.shop_type || "Retail"}
            </div>

            {isShopMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-[var(--bg-card)] border border-[var(--border-strong)] shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="text-[10px] uppercase font-bold text-[var(--text-low)] px-3 py-1.5 border-b border-[var(--border)]">
                  Switch Active Shop
                </div>
                <div className="mt-1 max-h-56 overflow-y-auto space-y-1">
                  {allMerchants.map((m) => {
                    const isActive = m.id === merchant.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          onSwitchTenant?.(m.id);
                          setIsShopMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[var(--teal-dim)] text-[var(--teal)] font-medium border border-[var(--teal)]/30"
                            : "text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:bg-[var(--bg-card-2)]"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-sm">{m.business_name}</div>
                          <div className="text-[11px] text-[var(--text-low)]">{m.shop_type} • {m.location}</div>
                        </div>
                        {isActive && <span className="text-[var(--teal)] text-xs font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Actions: Badges and Action Controls */}
        <div className="yubiflo-top-actions">
          <div
            id="badge-tier"
            className="yubiflo-badge-quiet"
            onClick={onOpenSubscriptionModal}
            title="Subscription: Retail Pro"
          >
            {merchant.subscription?.tierName || "Retail Pro"}
          </div>

          <div
            id="badge-admin"
            className="yubiflo-badge-quiet"
            onClick={onOpenAdminAuth}
            title="Admin access controller"
          >
            {isAdmin ? "Admin active" : "Staff view"}
          </div>

          <button
            id="btn-restock-top"
            className="yubiflo-btn-primary"
            onClick={() => onOpenRestock()}
          >
            Restock batch
          </button>

          <button
            id="btn-money-out-top"
            className="yubiflo-btn-ghost"
            aria-label="Money out"
            title="Money Out / Expenses"
            onClick={onOpenMoneyOut}
          >
            ⇄
          </button>

          <button
            id="btn-audit-top"
            className="yubiflo-btn-ghost"
            aria-label="Audit"
            title="Financial Audit & Reconcile"
            onClick={onOpenReconcile}
          >
            ⚖
          </button>

          <button
            id="btn-settings-top"
            className="yubiflo-btn-ghost"
            aria-label="Settings"
            title="Business & Hardware Settings"
            onClick={onOpenSettings}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Tabs: Supply Velocity, Executive Bloom, Retail Command, Financial Audit, Compact Trader */}
      <div className="yubiflo-tabs">
        <div
          id="tab-supply-velocity"
          className={`yubiflo-tab ${selectedLayout === "velocity" ? "active" : ""}`}
          onClick={() => handleSelectLayout("velocity")}
        >
          {selectedLayout === "velocity" && <span className="dot" />}
          Active stock & velocity
        </div>
        <div
          id="tab-executive-bloom"
          className={`yubiflo-tab ${selectedLayout === "executive" ? "active" : ""}`}
          onClick={() => handleSelectLayout("executive")}
        >
          {selectedLayout === "executive" && <span className="dot" />}
          Executive bloom
        </div>
        <div
          id="tab-retail-command"
          className={`yubiflo-tab ${selectedLayout === "retail" ? "active" : ""}`}
          onClick={() => handleSelectLayout("retail")}
        >
          {selectedLayout === "retail" && <span className="dot" />}
          Retail command
        </div>
        <div
          id="tab-financial-audit"
          className={`yubiflo-tab ${selectedLayout === "audit" ? "active" : ""}`}
          onClick={() => handleSelectLayout("audit")}
        >
          {selectedLayout === "audit" && <span className="dot" />}
          Financial audit
        </div>
        <div
          id="tab-compact-trader"
          className={`yubiflo-tab ${selectedLayout === "compact" ? "active" : ""}`}
          onClick={() => handleSelectLayout("compact")}
        >
          {selectedLayout === "compact" && <span className="dot" />}
          Compact trader
        </div>
      </div>

      {/* Hero: Botanical Growth & Velocity Engine */}
      <div className="yubiflo-hero">
        <div className="yubiflo-hero-top">
          <span className="yubiflo-stage">
            {stageData.label} · stage {stageData.number} of 4
          </span>
          <span className="yubiflo-hero-meta">
            {merchant.shop_type || "Mini-mart"} · {merchant.business_name || "Alacio Mini Shop"} · updated 05:57
          </span>
        </div>

        <h1>Growth, restock velocity &amp; profit engine.</h1>
        <p>
          Restock arrivals verify inventory velocity, validate opening float, and protect your margin — automatically.
        </p>

        <div className="yubiflo-progress-row">
          <span className={stageData.number === 1 ? "now" : ""}>Seedling</span>
          <span className={stageData.number === 2 ? "now" : ""}>Budding</span>
          <span className={stageData.number === 3 ? "now" : ""}>Blooming</span>
          <span className={stageData.number === 4 ? "now" : ""}>Flourishing</span>
        </div>
        <div className="yubiflo-progress-track">
          <div
            className="yubiflo-progress-fill"
            style={{ width: `${stageData.progress}%` }}
          />
        </div>

        <div className="yubiflo-hero-actions">
          <button
            id="btn-hero-restock"
            className="yubiflo-btn-primary"
            onClick={() => onOpenRestock()}
          >
            Restock arrived batch
          </button>
          <button
            id="btn-hero-quick-dump"
            className="yubiflo-btn-ghost"
            onClick={() => setActiveTab("quick_dump")}
          >
            Quick raw dump
          </button>
          <button
            id="btn-hero-ocr"
            className="yubiflo-btn-ghost"
            onClick={onOpenScanReceipts}
          >
            Multi-bill OCR
          </button>
        </div>
      </div>

      {/* Metrics Row: 4 Essential KPIs */}
      <div className="yubiflo-metrics">
        <div className="yubiflo-metric hero-metric">
          <div className="yubiflo-metric-label">Gross margin profit</div>
          <div className="yubiflo-metric-value">
            {merchant.currency} {totalProfit.toLocaleString()}
          </div>
          <div className="yubiflo-metric-sub gold">
            Margin {avgGrossMargin}% · {batches.length === 0 ? "awaiting first batch" : `${verifiedBatches.length} verified batches`}
          </div>
        </div>

        <div className="yubiflo-metric">
          <div className="yubiflo-metric-label">Derived sales</div>
          <div className="yubiflo-metric-value">
            {merchant.currency} {totalRevenue.toLocaleString()}
          </div>
          <div className="yubiflo-metric-sub">
            {verifiedBatches.length} verified batches
          </div>
        </div>

        <div className="yubiflo-metric">
          <div className="yubiflo-metric-label">Money out</div>
          <div className="yubiflo-metric-value">
            {merchant.currency} {totalMoneyOut.toLocaleString()}
          </div>
          <div className="yubiflo-metric-sub">
            {expenses.length} expenses logged
          </div>
        </div>

        <div className="yubiflo-metric">
          <div className="yubiflo-metric-label">Active shelf value</div>
          <div className="yubiflo-metric-value">
            {merchant.currency} {activeStockRetailValue.toLocaleString()}
          </div>
          <div className="yubiflo-metric-sub">
            Cost {merchant.currency} {activeStockCostValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Design rhythm note matching spec */}
      <div className="yubiflo-footnote">
        Header, hero and KPI row only — the rest of the dashboard follows the same card and type rhythm.
      </div>

      {/* Render Selected Dashboard View (following the exact card and type rhythm) */}
      <div className="space-y-6">
        {selectedLayout === "velocity" && (
          <div className="rounded-xl overflow-hidden border border-slate-800 -mx-4 -mt-2">
            <YuBiFloDashboard
              merchantId={merchant.id === "merch-alacio-00" || merchant.id === "1" ? "1" : merchant.id}
              merchantName={merchant.business_name || "Alacio Mini Shop"}
              onNavigateTab={setActiveTab}
            />
          </div>
        )}

        {selectedLayout === "executive" && (
          <ExecutiveBloomDashboard
            merchant={merchant}
            items={items}
            expenses={expenses}
            batches={batches}
            sales={sales}
            reconciliations={reconciliations}
            morningLogs={morningLogs}
            suppliers={suppliers}
            customers={customers}
            onOpenMoneyOut={onOpenMoneyOut}
            onOpenRestock={onOpenRestock}
            onOpenScanReceipts={onOpenScanReceipts}
            onOpenReconcile={onOpenReconcile}
            setActiveTab={setActiveTab}
            hideHeaderAndKpi={true}
          />
        )}

        {selectedLayout === "retail" && (
          <RetailCommandDashboard
            merchant={merchant}
            items={items}
            expenses={expenses}
            batches={batches}
            sales={sales}
            reconciliations={reconciliations}
            morningLogs={morningLogs}
            suppliers={suppliers}
            customers={customers}
            onOpenMoneyOut={onOpenMoneyOut}
            onOpenRestock={onOpenRestock}
            onOpenScanReceipts={onOpenScanReceipts}
            onOpenReconcile={onOpenReconcile}
            setActiveTab={setActiveTab}
          />
        )}

        {selectedLayout === "audit" && (
          <FinancialAuditDashboard
            merchant={merchant}
            items={items}
            expenses={expenses}
            batches={batches}
            sales={sales}
            reconciliations={reconciliations}
            morningLogs={morningLogs}
            suppliers={suppliers}
            customers={customers}
            onOpenMoneyOut={onOpenMoneyOut}
            onOpenRestock={onOpenRestock}
            onOpenScanReceipts={onOpenScanReceipts}
            onOpenReconcile={onOpenReconcile}
            setActiveTab={setActiveTab}
          />
        )}

        {selectedLayout === "compact" && (
          <CompactTraderDashboard
            merchant={merchant}
            items={items}
            expenses={expenses}
            batches={batches}
            sales={sales}
            reconciliations={reconciliations}
            morningLogs={morningLogs}
            suppliers={suppliers}
            customers={customers}
            onOpenMoneyOut={onOpenMoneyOut}
            onOpenRestock={onOpenRestock}
            onOpenScanReceipts={onOpenScanReceipts}
            onOpenReconcile={onOpenReconcile}
            setActiveTab={setActiveTab}
          />
        )}
      </div>
    </div>
  );
};
