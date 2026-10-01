import React, { useState, useMemo } from "react";
import {
  Supplier,
  SupplierDelivery,
  SupplierPayment,
  Customer,
  CustomerSale,
  CustomerDebtRepayment,
  MoneyOutExpense,
  SalesLedgerEntry,
  SupplyBatch,
  InventoryItem,
  DailyMorningFloatLog,
  OwnerCapitalRecord,
  Merchant,
  TAccountLedger,
} from "../types";
import { AccountingEngine } from "../services/accountingEngine";
import { AppStorage } from "../services/storage";
import { MergeEntitiesModal } from "./MergeEntitiesModal";
import {
  Scale,
  TrendingDown,
  Users,
  Truck,
  DollarSign,
  Wallet,
  Package,
  Award,
  Crown,
  Star,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Check,
  FileSpreadsheet,
  Sparkles,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  Zap,
  RefreshCw,
  HelpCircle,
} from "lucide-react";

interface TLedgersViewProps {
  merchant: Merchant;
  suppliers: Supplier[];
  supplierDeliveries: SupplierDelivery[];
  supplierPayments: SupplierPayment[];
  customers: Customer[];
  customerSales: CustomerSale[];
  customerRepayments: CustomerDebtRepayment[];
  expenses: MoneyOutExpense[];
  sales: SalesLedgerEntry[];
  batches: SupplyBatch[];
  inventoryItems: InventoryItem[];
  morningLogs: DailyMorningFloatLog[];
  ownerCapital: OwnerCapitalRecord[];
  onAddOwnerCapital: (record: OwnerCapitalRecord) => void;
  onRefreshData?: () => void;
}

export const TLedgersView: React.FC<TLedgersViewProps> = ({
  merchant,
  suppliers,
  supplierDeliveries,
  supplierPayments,
  customers,
  customerSales,
  customerRepayments,
  expenses,
  sales,
  batches,
  inventoryItems,
  morningLogs,
  ownerCapital,
  onAddOwnerCapital,
  onRefreshData,
}) => {
  // Main view mode: Individual T-Ledgers (No Consolidation) vs Consolidated Master & Trial Balance
  const [viewMode, setViewMode] = useState<"INDIVIDUAL_ACCOUNTS" | "CONSOLIDATED_MASTER">("INDIVIDUAL_ACCOUNTS");

  // Individual Sub-tabs
  const [individualCategory, setIndividualCategory] = useState<
    | "SUPPLIERS"
    | "CUSTOMERS"
    | "EXPENSES"
    | "LIQUID_CHANNELS"
    | "STOCK_ITEMS"
    | "OWNER_CAPITAL"
    | "RANKINGS"
  >("SUPPLIERS");

  // Consolidated tab
  const [consolidatedTab, setConsolidatedTab] = useState<
    | "ALL_CONSOLIDATED"
    | "CREDITORS"
    | "DEBTORS"
    | "EXPENSES"
    | "CASH"
    | "STOCK"
    | "OWNER"
    | "TRIAL_BALANCE"
  >("ALL_CONSOLIDATED");

  // Search & Filter Query
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [balanceFilter, setBalanceFilter] = useState<"ALL" | "WITH_BALANCE" | "SETTLED">("ALL");

  // Rankings sub-view
  const [rankingEntityTab, setRankingEntityTab] = useState<"SUPPLIERS" | "CONSUMERS">("SUPPLIERS");

  // Owner Capital / Drawing Modal
  const [showCapitalModal, setShowCapitalModal] = useState<boolean>(false);
  const [capEntryType, setCapEntryType] = useState<
    "CAPITAL_INJECTION" | "PERSONAL_DRAWING" | "RETAINED_PROFIT_TRANSFER"
  >("PERSONAL_DRAWING");
  const [capAmount, setCapAmount] = useState<number>(1000);
  const [capPaymentChannel, setCapPaymentChannel] = useState<
    "CASH" | "MPESA_SIM" | "EQUITY_PAYBILL" | "BANK"
  >("CASH");
  const [capPurpose, setCapPurpose] = useState<string>("");
  const [capRecipient, setCapRecipient] = useState<string>(merchant.owner_name || "Owner");
  const [capDate, setCapDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [capNotes, setCapNotes] = useState<string>("");

  // Merge & Deduplication State
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [mergeEntityType, setMergeEntityType] = useState<"SUPPLIER" | "CUSTOMER">("SUPPLIER");
  const [mergePrimaryId, setMergePrimaryId] = useState<string>("");
  const [mergeDuplicateId, setMergeDuplicateId] = useState<string>("");
  const [mergeToastMessage, setMergeToastMessage] = useState<string | null>(null);

  // Automatically find duplicate profiles (e.g. "Joseph Musembi" vs "Joseph MUsembi")
  const duplicateSuppliers = useMemo(() => {
    return AppStorage.findDuplicateSuppliers();
  }, [suppliers]);

  const duplicateCustomers = useMemo(() => {
    return AppStorage.findDuplicateCustomers();
  }, [customers]);

  const handleOpenMerge = (type: "SUPPLIER" | "CUSTOMER", primId?: string, dupId?: string) => {
    setMergeEntityType(type);
    setMergePrimaryId(primId || "");
    setMergeDuplicateId(dupId || "");
    setShowMergeModal(true);
  };

  const handleMergeComplete = (msg: string) => {
    setMergeToastMessage(msg);
    if (onRefreshData) onRefreshData();
    setTimeout(() => setMergeToastMessage(null), 6000);
  };

  const handleAutoMergeTypos = () => {
    const res = AppStorage.autoMergeAllTypos();
    if (onRefreshData) onRefreshData();
    const total = res.mergedSuppliersCount + res.mergedCustomersCount;
    if (total > 0) {
      setMergeToastMessage(`Auto-merged ${total} typo profiles (${res.mergedSuppliersCount} suppliers, ${res.mergedCustomersCount} customers) into unified master ledgers!`);
    } else {
      setMergeToastMessage(`All ledger profiles are clean and unified.`);
    }
    setTimeout(() => setMergeToastMessage(null), 5000);
  };

  const handleRunRescan = () => {
    const res = AppStorage.syncSuppliersFromAllSources();
    if (onRefreshData) onRefreshData();
    setMergeToastMessage(`Synchronized all supply sources: verified ${res.suppliersCount} suppliers and ${res.deliveriesCount} delivery consignments!`);
    setTimeout(() => setMergeToastMessage(null), 5000);
  };

  // Compute all Ledgers (Both Individual and Consolidated) via Accounting Engine
  const ledgerSet = useMemo(() => {
    return AccountingEngine.generateTLedgers({
      suppliers,
      supplierDeliveries,
      supplierPayments,
      customers,
      customerSales,
      customerRepayments,
      expenses,
      sales,
      batches,
      items: inventoryItems,
      morningLogs,
      ownerCapital,
      merchant,
    });
  }, [
    suppliers,
    supplierDeliveries,
    supplierPayments,
    customers,
    customerSales,
    customerRepayments,
    expenses,
    sales,
    batches,
    inventoryItems,
    morningLogs,
    ownerCapital,
    merchant,
  ]);

  // Compute Supplier Rankings
  const supplierRankings = useMemo(() => {
    return AccountingEngine.rankSuppliers({
      suppliers,
      supplierDeliveries,
      supplierPayments,
    });
  }, [suppliers, supplierDeliveries, supplierPayments]);

  // Compute Customer (Consumer) Rankings
  const customerRankings = useMemo(() => {
    return AccountingEngine.rankCustomers({
      customers,
      customerSales,
      customerRepayments,
    });
  }, [customers, customerSales, customerRepayments]);

  // Filter individual ledgers based on active sub-tab and search/balance filter
  const currentIndividualLedgers = useMemo(() => {
    let list: TAccountLedger[] = [];
    if (individualCategory === "SUPPLIERS") list = ledgerSet.individualSuppliers;
    else if (individualCategory === "CUSTOMERS") list = ledgerSet.individualCustomers;
    else if (individualCategory === "EXPENSES") list = ledgerSet.individualExpenses;
    else if (individualCategory === "LIQUID_CHANNELS") list = ledgerSet.individualLiquidChannels;
    else if (individualCategory === "STOCK_ITEMS") list = ledgerSet.individualStockItems;
    else if (individualCategory === "OWNER_CAPITAL") list = [ledgerSet.ownerCapitalLedger];

    return list.filter((l) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.subtitle.toLowerCase().includes(q) ||
        l.account_code.toLowerCase().includes(q) ||
        l.debits.some((d) => d.reference.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)) ||
        l.credits.some((c) => c.reference.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Balance filter
      if (balanceFilter === "WITH_BALANCE") {
        return l.balance_c_d > 0;
      }
      if (balanceFilter === "SETTLED") {
        return l.balance_c_d === 0;
      }
      return true;
    });
  }, [ledgerSet, individualCategory, searchQuery, balanceFilter]);

  // Handle Capital / Drawing Submission
  const handleSaveCapitalRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capAmount || capAmount <= 0) return;

    const newRecord: OwnerCapitalRecord = {
      id: `cap-${Date.now()}`,
      merchant_id: merchant.id,
      entry_type: capEntryType,
      amount: Number(capAmount),
      payment_channel: capPaymentChannel,
      purpose_or_reason:
        capPurpose || (capEntryType === "PERSONAL_DRAWING" ? "Household drawing" : "Capital injection"),
      recipient_or_contributor: capRecipient || merchant.owner_name || "Owner",
      date: capDate,
      notes: capNotes,
      created_at: new Date().toISOString(),
    };

    onAddOwnerCapital(newRecord);
    setShowCapitalModal(false);
    setCapPurpose("");
    setCapNotes("");
    setCapAmount(1000);
  };

  // Helper to render an individual Classical T-Account Card
  const renderTAccountCard = (ledger: TAccountLedger, customBadge?: React.ReactNode) => {
    const isDrBalanced = ledger.balance_side === "DEBIT";
    const isCrBalanced = ledger.balance_side === "CREDIT";
    const isFullySettled = ledger.balance_c_d === 0;

    return (
      <div
        key={ledger.id}
        id={ledger.id}
        className="rounded-xl bg-[#18181b] border border-slate-800 shadow-xl overflow-hidden mb-6 transition-all hover:border-slate-700"
      >
        {/* Ledger Top Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono font-bold">
                {ledger.account_code}
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">{ledger.title}</h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                  ledger.nature.includes("ASSET")
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : ledger.nature.includes("LIABILITY")
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : ledger.nature.includes("EXPENSE")
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                }`}
              >
                {ledger.nature.replace(/_/g, " ")}
              </span>
              {customBadge}
            </div>
            <p className="text-xs text-slate-400 mt-1">{ledger.subtitle}</p>
          </div>

          {/* Net Balance Badge & Action */}
          <div className="flex items-center gap-2 flex-wrap">
            {ledger.type === "CREDITORS_PURCHASES" && (
              <button
                type="button"
                onClick={() => {
                  const sId = ledger.id.replace("supp-ledger-", "");
                  handleOpenMerge("SUPPLIER", sId);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                title="Merge duplicate supplier account"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Merge Account</span>
              </button>
            )}

            {ledger.type === "DEBTORS_SALES" && (
              <button
                type="button"
                onClick={() => {
                  const cId = ledger.id.replace("cust-ledger-", "");
                  handleOpenMerge("CUSTOMER", cId);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
                title="Merge duplicate customer account"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Merge Account</span>
              </button>
            )}

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                isFullySettled
                  ? "bg-slate-950/80 border-slate-800 text-slate-400"
                  : ledger.nature === "LIABILITY_CR" && isCrBalanced
                  ? "bg-amber-950/30 border-amber-500/30 text-amber-300"
                  : ledger.nature === "ASSET_DR" && isDrBalanced
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                  : "bg-slate-950/80 border-slate-800 text-white"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isFullySettled ? "Status:" : "Balance c/d:"}
              </span>
              <span className="text-sm font-bold font-mono">
                {isFullySettled
                  ? "CLEARED / ZERO"
                  : `${merchant.currency} ${ledger.balance_c_d.toLocaleString()}`}
              </span>
              {!isFullySettled && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                    isDrBalanced
                      ? "bg-emerald-500/20 text-emerald-300"
                      : isCrBalanced
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {ledger.balance_side}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zero-Transaction Recovery Helper */}
        {ledger.debits.length === 0 && ledger.credits.length === 0 && (
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>No transactions found under this exact spelling.</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunRescan}
                className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-Link Supply Batches</span>
              </button>
              {ledger.type === "CREDITORS_PURCHASES" && (
                <button
                  type="button"
                  onClick={() => {
                    const sId = ledger.id.replace("supp-ledger-", "");
                    handleOpenMerge("SUPPLIER", sId);
                  }}
                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Layers className="w-3 h-3" />
                  <span>Merge with Typo / Duplicate</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Classical "T" Double-Entry Table Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* DEBIT SIDE (Dr) - Left */}
          <div className="p-4 flex flex-col justify-between bg-slate-950/30">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
                <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Dr. (Debit Side)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {ledger.debits.length} {ledger.debits.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {ledger.debits.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 italic">
                  No debit entries recorded in this account
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {ledger.debits.map((entry, eIdx) => (
                    <div
                      key={`${entry.id || 'dr'}_${eIdx}`}
                      className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="space-y-0.5 max-w-[65%]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">{entry.date}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-300">
                            {entry.reference}
                          </span>
                        </div>
                        <p className="text-slate-200 truncate font-medium">{entry.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400">
                          {merchant.currency} {entry.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Debit Subtotal & Carried Down Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Total Debit Incurred:</span>
                <span className="font-bold text-white">
                  {merchant.currency} {ledger.total_debit.toLocaleString()}
                </span>
              </div>
              {isCrBalanced && ledger.balance_c_d > 0 && (
                <div className="flex items-center justify-between text-xs font-mono text-amber-400/90 italic">
                  <span>Balance c/d (To Balance):</span>
                  <span>+ {merchant.currency} {ledger.balance_c_d.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs font-mono font-bold pt-1.5 border-t border-double border-slate-700 text-emerald-300">
                <span>Balancing Sum:</span>
                <span>
                  {merchant.currency}{" "}
                  {Math.max(ledger.total_debit, ledger.total_credit).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* CREDIT SIDE (Cr) - Right */}
          <div className="p-4 flex flex-col justify-between bg-slate-950/30">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Cr. (Credit Side)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {ledger.credits.length} {ledger.credits.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {ledger.credits.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 italic">
                  No credit entries recorded in this account
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {ledger.credits.map((entry, eIdx) => (
                    <div
                      key={`${entry.id || 'cr'}_${eIdx}`}
                      className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="space-y-0.5 max-w-[65%]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">{entry.date}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-300">
                            {entry.reference}
                          </span>
                        </div>
                        <p className="text-slate-200 truncate font-medium">{entry.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400">
                          {merchant.currency} {entry.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Credit Subtotal & Carried Down Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Total Credit Incurred:</span>
                <span className="font-bold text-white">
                  {merchant.currency} {ledger.total_credit.toLocaleString()}
                </span>
              </div>
              {isDrBalanced && ledger.balance_c_d > 0 && (
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400/90 italic">
                  <span>Balance c/d (To Balance):</span>
                  <span>+ {merchant.currency} {ledger.balance_c_d.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs font-mono font-bold pt-1.5 border-t border-double border-slate-700 text-amber-300">
                <span>Balancing Sum:</span>
                <span>
                  {merchant.currency}{" "}
                  {Math.max(ledger.total_debit, ledger.total_credit).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <span>Automated T-Accounts & General Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time automated double-entry postings for every individual supplier, customer/debtor, expense line, liquid channel & stock item.
          </p>
        </div>

        {/* View Mode Switcher + Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              id="mode-btn-individual"
              type="button"
              onClick={() => setViewMode("INDIVIDUAL_ACCOUNTS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "INDIVIDUAL_ACCOUNTS"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👤 Individual Accounts (No Consolidation)</span>
            </button>
            <button
              id="mode-btn-consolidated"
              type="button"
              onClick={() => setViewMode("CONSOLIDATED_MASTER")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "CONSOLIDATED_MASTER"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📊 Consolidated Master & Trial Balance</span>
            </button>
          </div>

          <button
            id="btn-open-capital-modal"
            type="button"
            onClick={() => setShowCapitalModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-md shadow-purple-950 transition-all cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Owner Drawing / Capital</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {mergeToastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs font-semibold text-emerald-200 shadow-lg flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{mergeToastMessage}</span>
          </div>
          <button
            onClick={() => setMergeToastMessage(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Rush-Hour Duplicate Alert Banner */}
      {(duplicateSuppliers.length > 0 || duplicateCustomers.length > 0) && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Rush-Hour Typos / Duplicate Profiles Detected</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono">
                    {duplicateSuppliers.length + duplicateCustomers.length} Duplicates
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  During rush hours, slight typos or case differences (e.g.{" "}
                  {duplicateSuppliers.length > 0 && (
                    <strong className="text-amber-200">
                      "{duplicateSuppliers[0].primary.name}" vs "{duplicateSuppliers[0].duplicate.name}"
                    </strong>
                  )}
                  {duplicateSuppliers.length === 0 && duplicateCustomers.length > 0 && (
                    <strong className="text-amber-200">
                      "{duplicateCustomers[0].primary.name}" vs "{duplicateCustomers[0].duplicate.name}"
                    </strong>
                  )}
                  ) can create separate records. Merge them now to combine all supply batches, receipts, and T-Account ledgers into a single accurate balance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAutoMergeTypos}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Merge All Typos</span>
              </button>

              {duplicateSuppliers.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenMerge("SUPPLIER", duplicateSuppliers[0].primary.id, duplicateSuppliers[0].duplicate.id)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Review "{duplicateSuppliers[0].primary.name}"</span>
                </button>
              )}

              {duplicateCustomers.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenMerge("CUSTOMER", duplicateCustomers[0].primary.id, duplicateCustomers[0].duplicate.id)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Review "{duplicateCustomers[0].primary.name}"</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Automation Banner */}
      <div className="p-3 rounded-xl bg-[#111827] border border-emerald-500/20 flex items-center justify-between gap-3 flex-wrap shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>⚡ 100% Automated Double-Entry Active</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sales, deliveries, restocks, credit deni, expenses & payments are automatically posted into individual T-Accounts in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRunRescan}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
            title="Scan past batches and receipts to guarantee all supplier consignments are linked"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync Supply Drops</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenMerge("SUPPLIER")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Merge Profiles</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Suppliers Total Owed */}
        <div className="p-4 rounded-xl bg-[#18181b] border border-amber-900/40 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              1. Supplier Payables
            </span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {merchant.currency} {ledgerSet.creditorsPurchasesLedger.balance_c_d.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Payable balance across <strong>{suppliers.length}</strong> individual supplier accounts
          </p>
        </div>

        {/* 2. Debtors Customer Deni */}
        <div className="p-4 rounded-xl bg-[#18181b] border border-rose-900/40 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              2. Customer Deni (Receivables)
            </span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {merchant.currency} {ledgerSet.debtorsSalesLedger.balance_c_d.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Receivable assets to collect from <strong>{customers.length}</strong> individual debtors
          </p>
        </div>

        {/* 3. Liquid Cash & E-Float */}
        <div className="p-4 rounded-xl bg-[#18181b] border border-emerald-900/40 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              3. Cash Book & E-Float
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {merchant.currency} {ledgerSet.cashLiquidLedger.balance_c_d.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Drawer float, M-Pesa SIM & Equity Paybill 1450180372031
          </p>
        </div>

        {/* 4. Owner Equity */}
        <div className="p-4 rounded-xl bg-[#18181b] border border-purple-900/40 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
              4. Proprietor Equity
            </span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {merchant.currency} {ledgerSet.ownerCapitalLedger.balance_c_d.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Net capital after personal drawings and retained earnings
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INDIVIDUAL ACCOUNTS (NO CONSOLIDATION) VIEW                             */}
      {/* ========================================================================= */}
      {viewMode === "INDIVIDUAL_ACCOUNTS" && (
        <div className="space-y-5">
          {/* Sub-Category Selector Navigation */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#18181b] border border-slate-800 rounded-xl overflow-x-auto">
            <button
              id="ind-tab-suppliers"
              type="button"
              onClick={() => setIndividualCategory("SUPPLIERS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                individualCategory === "SUPPLIERS"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>1. Individual Suppliers ({ledgerSet.individualSuppliers.length})</span>
            </button>

            <button
              id="ind-tab-customers"
              type="button"
              onClick={() => setIndividualCategory("CUSTOMERS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                individualCategory === "CUSTOMERS"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Individual Debtors ({ledgerSet.individualCustomers.length})</span>
            </button>

            <button
              id="ind-tab-expenses"
              type="button"
              onClick={() => setIndividualCategory("EXPENSES")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                individualCategory === "EXPENSES"
                  ? "bg-slate-700 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>3. Expense Accounts ({ledgerSet.individualExpenses.length})</span>
            </button>

            <button
              id="ind-tab-liquid"
              type="button"
              onClick={() => setIndividualCategory("LIQUID_CHANNELS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                individualCategory === "LIQUID_CHANNELS"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>4. Liquid Channels ({ledgerSet.individualLiquidChannels.length})</span>
            </button>

            <button
              id="ind-tab-stock"
              type="button"
              onClick={() => setIndividualCategory("STOCK_ITEMS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                individualCategory === "STOCK_ITEMS"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>5. Product Stock Ledgers ({ledgerSet.individualStockItems.length})</span>
            </button>

            <button
              id="ind-tab-owner"
              type="button"
              onClick={() => setIndividualCategory("OWNER_CAPITAL")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                individualCategory === "OWNER_CAPITAL"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>6. Owner Equity & Drawings</span>
            </button>

            <button
              id="ind-tab-rankings"
              type="button"
              onClick={() => setIndividualCategory("RANKINGS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                individualCategory === "RANKINGS"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-950"
                  : "text-amber-400 hover:text-amber-300"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>⭐ Entity Rankings</span>
            </button>
          </div>

          {/* Search & Filter Bar (when not in rankings) */}
          {individualCategory !== "RANKINGS" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#18181b] border border-slate-800 rounded-xl">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search individual ${individualCategory.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setBalanceFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    balanceFilter === "ALL"
                      ? "bg-slate-700 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All ({currentIndividualLedgers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceFilter("WITH_BALANCE")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    balanceFilter === "WITH_BALANCE"
                      ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Active Balance
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceFilter("SETTLED")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    balanceFilter === "SETTLED"
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Settled / Cleared
                </button>
              </div>
            </div>
          )}

          {/* List of Individual T-Accounts */}
          {individualCategory !== "RANKINGS" && (
            <div className="space-y-4">
              {currentIndividualLedgers.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-[#18181b] border border-slate-800">
                  <p className="text-sm font-semibold text-slate-300">
                    No individual T-Accounts found matching your filters.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try adjusting your search terms or filter buttons above.
                  </p>
                </div>
              ) : (
                currentIndividualLedgers.map((ledger) => renderTAccountCard(ledger))
              )}
            </div>
          )}

          {/* Rankings sub-view */}
          {individualCategory === "RANKINGS" && (
            <div className="space-y-6">
              {/* Rankings Sub-Switch */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#18181b] border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <button
                    id="btn-rankings-suppliers-ind"
                    type="button"
                    onClick={() => setRankingEntityTab("SUPPLIERS")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      rankingEntityTab === "SUPPLIERS"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Supplier Rankings ({supplierRankings.length})</span>
                  </button>

                  <button
                    id="btn-rankings-consumers-ind"
                    type="button"
                    onClick={() => setRankingEntityTab("CONSUMERS")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      rankingEntityTab === "CONSUMERS"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Customer / Consumer Rankings ({customerRankings.length})</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400">
                  Ranked by transaction volume, fulfillment, repayment promptness & credit risk
                </div>
              </div>

              {/* SUPPLIER RANKINGS TABLE */}
              {rankingEntityTab === "SUPPLIERS" && (
                <div className="rounded-xl bg-[#18181b] border border-slate-800 shadow-xl overflow-hidden">
                  <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Top Supplier & Wholesaler Leaderboard</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tier-1 partners ranked by supplied volume, credit flexibility, and fulfillment
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Rank</th>
                          <th className="p-3.5">Supplier Name</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5 text-right">Supplied Volume</th>
                          <th className="p-3.5 text-right">Settled (Paid)</th>
                          <th className="p-3.5 text-right">Owed Debt</th>
                          <th className="p-3.5">Payment Terms</th>
                          <th className="p-3.5 text-center">Reliability</th>
                          <th className="p-3.5">Tier Badge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {supplierRankings.map((r) => (
                          <tr key={r.supplier.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3.5 font-bold font-mono">
                              {r.rank === 1 ? (
                                <span className="flex items-center gap-1 text-amber-400 font-bold">
                                  <Crown className="w-4 h-4 text-amber-400" /> #1
                                </span>
                              ) : r.rank === 2 ? (
                                <span className="text-slate-300 font-bold">🥈 #2</span>
                              ) : r.rank === 3 ? (
                                <span className="text-amber-600 font-bold">🥉 #3</span>
                              ) : (
                                <span className="text-slate-500">#{r.rank}</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-white">{r.supplier.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {r.supplier.phone} {r.supplier.location && `• ${r.supplier.location}`}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                                {r.supplier.category}
                              </span>
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-white">
                              {merchant.currency} {r.total_volume.toLocaleString()}
                            </td>
                            <td className="p-3.5 text-right font-mono text-emerald-400">
                              {merchant.currency} {r.total_paid.toLocaleString()}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold">
                              {r.outstanding_owed > 0 ? (
                                <span className="text-amber-400">
                                  {merchant.currency} {r.outstanding_owed.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-500 font-normal">Cleared</span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                              {r.supplier.payment_terms.replace(/_/g, " ")}
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1 text-amber-400">
                                {Array.from({ length: r.stars }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                                ))}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                {r.reliability_score}% score
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.tier === "TIER_1_STRATEGIC"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                    : r.tier === "TIER_2_CORE"
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {r.tier.replace(/_/g, " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CUSTOMER RANKINGS TABLE */}
              {rankingEntityTab === "CONSUMERS" && (
                <div className="rounded-xl bg-[#18181b] border border-slate-800 shadow-xl overflow-hidden space-y-0">
                  <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Crown className="w-4 h-4 text-cyan-400" />
                        <span>Top Customer & Consumer Leaderboard</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Active credit consumers ranked by least current debt, proven debt repayments, and loyalty history.
                      </p>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-[11px] text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>Criteria:</strong> Ever Had Debt → Lowest / Zero Debt on Top → Proven Repayments</span>
                    </div>
                  </div>

                  {/* Soko Business Logic Info Banner */}
                  <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[11px] text-slate-300">
                        Inactive / dormant accounts with no credit history are filtered below active debtors. Customers who took debt and cleared it to <strong>KSh 0</strong> hold the top ranks!
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Rank</th>
                          <th className="p-3.5">Customer Name</th>
                          <th className="p-3.5">Credit Status & History</th>
                          <th className="p-3.5 text-right">Current Deni</th>
                          <th className="p-3.5 text-right">Total Repaid</th>
                          <th className="p-3.5 text-right">Lifetime Spend</th>
                          <th className="p-3.5">Credit Utilization</th>
                          <th className="p-3.5 text-center">Trust Grade</th>
                          <th className="p-3.5">Tier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {customerRankings.map((r) => (
                          <tr key={r.customer.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3.5 font-bold font-mono">
                              {r.rank === 1 ? (
                                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                                  <Crown className="w-4 h-4 text-cyan-400" /> #1
                                </span>
                              ) : r.rank === 2 ? (
                                <span className="text-slate-200 font-bold">🥈 #2</span>
                              ) : r.rank === 3 ? (
                                <span className="text-amber-500 font-bold">🥉 #3</span>
                              ) : (
                                <span className="text-slate-500">#{r.rank}</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{r.customer.name}</span>
                                {r.customer.national_id && (
                                  <span className="text-[10px] px-1 rounded bg-slate-900 text-slate-400 font-mono">
                                    ID: {r.customer.national_id}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {r.customer.phone} {r.customer.location_or_estate && `• ${r.customer.location_or_estate}`}
                              </div>
                            </td>
                            <td className="p-3.5">
                              {r.debt_status_badge === "DEBT_CLEARED_TOP_REPAYER" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                                  <span>🌟 Deni Cleared (Top Repayer)</span>
                                </span>
                              ) : r.debt_status_badge === "ACTIVE_LEAST_DENI" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold">
                                  <span>🟢 Low Active Debt</span>
                                </span>
                              ) : r.debt_status_badge === "LAST_MONTH_OVERDUE" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                                  <span>🔴 Last Month Debt (Overdue)</span>
                                </span>
                              ) : r.debt_status_badge === "MODERATE_DENI" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                                  <span>🟡 Active Deni</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                                  <span>⚪ No Credit History (Dormant)</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold">
                              {r.outstanding_deni > 0 ? (
                                <span className={r.has_last_month_debt ? "text-rose-400 font-black" : "text-amber-400"}>
                                  {merchant.currency} {r.outstanding_deni.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                                  <Check className="w-3.5 h-3.5" /> KSh 0 (Cleared)
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-mono text-emerald-400">
                              {merchant.currency} {r.total_debt_repaid.toLocaleString()}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-white">
                              {merchant.currency} {r.lifetime_spend.toLocaleString()}
                            </td>
                            <td className="p-3.5">
                              <div className="w-24 space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                  <span>{r.credit_utilization_pct}%</span>
                                  <span>Lim {r.customer.credit_limit}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      r.credit_utilization_pct > 80
                                        ? "bg-rose-500"
                                        : r.credit_utilization_pct > 50
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${r.credit_utilization_pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                                  r.trust_grade === "A+"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : r.trust_grade === "A"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : r.trust_grade === "B"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : r.trust_grade === "C"
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                }`}
                              >
                                Grade {r.trust_grade}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.tier === "VIP_WHOLESALE"
                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                                    : r.tier === "KEY_REGULAR"
                                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                                    : r.tier === "CREDIT_RISK"
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {r.tier.replace(/_/g, " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONSOLIDATED MASTER & TRIAL BALANCE VIEW                                */}
      {/* ========================================================================= */}
      {viewMode === "CONSOLIDATED_MASTER" && (
        <div className="space-y-6">
          {/* Module Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#18181b] border border-slate-800 rounded-xl overflow-x-auto">
            <button
              id="tab-btn-all-ledgers"
              type="button"
              onClick={() => setConsolidatedTab("ALL_CONSOLIDATED")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                consolidatedTab === "ALL_CONSOLIDATED"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>All 6 Master Ledgers</span>
            </button>

            <button
              id="tab-btn-creditors"
              type="button"
              onClick={() => setConsolidatedTab("CREDITORS")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                consolidatedTab === "CREDITORS"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>1. Creditors</span>
            </button>

            <button
              id="tab-btn-debtors"
              type="button"
              onClick={() => setConsolidatedTab("DEBTORS")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                consolidatedTab === "DEBTORS"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Debtors</span>
            </button>

            <button
              id="tab-btn-expenses"
              type="button"
              onClick={() => setConsolidatedTab("EXPENSES")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                consolidatedTab === "EXPENSES"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>3. Expenses</span>
            </button>

            <button
              id="tab-btn-cash"
              type="button"
              onClick={() => setConsolidatedTab("CASH")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                consolidatedTab === "CASH"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>4. Cash Book Float</span>
            </button>

            <button
              id="tab-btn-stock"
              type="button"
              onClick={() => setConsolidatedTab("STOCK")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                consolidatedTab === "STOCK"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>5. Stock & COGS</span>
            </button>

            <button
              id="tab-btn-capital"
              type="button"
              onClick={() => setConsolidatedTab("OWNER")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                consolidatedTab === "OWNER"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>6. Owner Equity</span>
            </button>

            <button
              id="tab-btn-trial-balance"
              type="button"
              onClick={() => setConsolidatedTab("TRIAL_BALANCE")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                consolidatedTab === "TRIAL_BALANCE"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Trial Balance Verification</span>
            </button>
          </div>

          {/* Consolidated Ledgers Rendering */}
          {(consolidatedTab === "ALL_CONSOLIDATED" || consolidatedTab === "CREDITORS") &&
            renderTAccountCard(ledgerSet.creditorsPurchasesLedger)}

          {(consolidatedTab === "ALL_CONSOLIDATED" || consolidatedTab === "DEBTORS") &&
            renderTAccountCard(ledgerSet.debtorsSalesLedger)}

          {(consolidatedTab === "ALL_CONSOLIDATED" || consolidatedTab === "EXPENSES") &&
            renderTAccountCard(ledgerSet.nominalExpensesLedger)}

          {(consolidatedTab === "ALL_CONSOLIDATED" || consolidatedTab === "CASH") &&
            renderTAccountCard(ledgerSet.cashLiquidLedger)}

          {(consolidatedTab === "ALL_CONSOLIDATED" || consolidatedTab === "STOCK") &&
            renderTAccountCard(ledgerSet.stockInventoryLedger)}

          {(consolidatedTab === "ALL_CONSOLIDATED" || consolidatedTab === "OWNER") &&
            renderTAccountCard(ledgerSet.ownerCapitalLedger)}

          {/* Trial Balance Table */}
          {consolidatedTab === "TRIAL_BALANCE" && (
            <div className="rounded-xl bg-[#18181b] border border-slate-800 shadow-xl overflow-hidden">
              <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                    <span>General Ledger Trial Balance</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Double-entry mathematical verification across all 6 asset, liability, expense & equity accounts
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {ledgerSet.trialBalance.isBalanced ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PERFECTLY BALANCED</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        Variance: {merchant.currency} {ledgerSet.trialBalance.difference.toLocaleString()}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Account Code</th>
                      <th className="p-3.5">Account Ledger Name</th>
                      <th className="p-3.5">Nature</th>
                      <th className="p-3.5 text-right">Debit (Dr) Balance</th>
                      <th className="p-3.5 text-right">Credit (Cr) Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {ledgerSet.trialBalance.rows.map((row) => (
                      <tr key={row.accountCode} className="hover:bg-slate-900/40">
                        <td className="p-3.5 text-indigo-400 font-bold">{row.accountCode}</td>
                        <td className="p-3.5 text-white font-sans font-medium">{row.accountTitle}</td>
                        <td className="p-3.5 text-slate-400 font-sans text-[11px]">{row.nature}</td>
                        <td className="p-3.5 text-right text-emerald-400">
                          {row.debit > 0 ? `${merchant.currency} ${row.debit.toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3.5 text-right text-amber-400">
                          {row.credit > 0 ? `${merchant.currency} ${row.credit.toLocaleString()}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950/90 border-t-2 border-slate-700 font-mono font-bold text-xs text-white">
                    <tr>
                      <td colSpan={3} className="p-3.5 font-sans">
                        TRIAL BALANCE TOTAL SUM:
                      </td>
                      <td className="p-3.5 text-right text-emerald-300">
                        {merchant.currency} {ledgerSet.trialBalance.totalDebits.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right text-amber-300">
                        {merchant.currency} {ledgerSet.trialBalance.totalCredits.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OWNER CAPITAL & DRAWINGS MODAL */}
      {showCapitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#18181b] border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-400" />
                <span>Log Owner Drawing / Capital Entry</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCapitalModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCapitalRecord} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCapEntryType("PERSONAL_DRAWING")}
                    className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                      capEntryType === "PERSONAL_DRAWING"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Personal Drawing (Dr)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCapEntryType("CAPITAL_INJECTION")}
                    className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                      capEntryType === "CAPITAL_INJECTION"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Capital Injection (Cr)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Amount ({merchant.currency})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={capAmount}
                  onChange={(e) => setCapAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Payment Source / Channel</label>
                <select
                  value={capPaymentChannel}
                  onChange={(e) => setCapPaymentChannel(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="CASH">Unified Cash Drawer</option>
                  <option value="MPESA_SIM">M-Pesa SIM E-Float</option>
                  <option value="EQUITY_PAYBILL">Equity Paybill 1450180372031</option>
                  <option value="BANK">Bank Account</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Purpose / Description</label>
                <input
                  type="text"
                  required
                  placeholder={
                    capEntryType === "PERSONAL_DRAWING"
                      ? "e.g. Household groceries, school fees, personal transport"
                      : "e.g. Initial seed fund, emergency equity injection"
                  }
                  value={capPurpose}
                  onChange={(e) => setCapPurpose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={capDate}
                    onChange={(e) => setCapDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Recipient / Owner</label>
                  <input
                    type="text"
                    value={capRecipient}
                    onChange={(e) => setCapRecipient(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCapitalModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rush-Hour Duplicate / Typo Merge Modal */}
      <MergeEntitiesModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        entityType={mergeEntityType}
        merchant={merchant}
        suppliers={suppliers}
        customers={customers}
        initialPrimaryId={mergePrimaryId}
        initialDuplicateId={mergeDuplicateId}
        onMergeComplete={handleMergeComplete}
      />
    </div>
  );
};
