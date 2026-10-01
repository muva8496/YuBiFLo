import React, { useState, useMemo } from "react";
import {
  Boxes,
  Users,
  Truck,
  Zap,
  ClipboardPaste,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Search,
  Check,
  Tag,
  AlertCircle,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Merchant, InventoryItem, Supplier, Customer } from "../types";
import { AppStorage } from "../services/storage";

interface QuickDumpViewProps {
  merchant: Merchant;
  items: InventoryItem[];
  suppliers: Supplier[];
  customers: Customer[];
  onRefreshData: () => void;
  setActiveTab: (tab: string) => void;
  showToast?: (type: "success" | "alert" | "info", title: string, message: string) => void;
}

type DumpCategory = "all" | "products" | "suppliers" | "customers";

export const QuickDumpView: React.FC<QuickDumpViewProps> = ({
  merchant,
  items,
  suppliers,
  customers,
  onRefreshData,
  setActiveTab,
  showToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<DumpCategory>("all");

  // Raw text inputs for bulk dumping
  const [productsRawText, setProductsRawText] = useState("");
  const [suppliersRawText, setSuppliersRawText] = useState("");
  const [customersRawText, setCustomersRawText] = useState("");

  // Single-item stream entry state
  const [singleProductName, setSingleProductName] = useState("");
  const [singleSupplierName, setSingleSupplierName] = useState("");
  const [singleCustomerName, setSingleCustomerName] = useState("");

  // Optional category / tag helper for products & suppliers
  const [productDefaultCategory, setProductDefaultCategory] = useState("General Goods");
  const [supplierDefaultCategory, setSupplierDefaultCategory] = useState("Wholesale Supplier");

  // Filter for master review list
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState<"all" | "products" | "suppliers" | "customers">("all");

  // Parse lines helper
  const parseRawNames = (text: string): string[] => {
    return text
      .split(/[\n,;]+/)
      .map((s) => s.trim().replace(/^[\s\-*•\d.)]+\s*/, "")) // remove leading bullet points, numbers, dashes
      .filter((s) => s.length > 0);
  };

  const parsedProducts = useMemo(() => parseRawNames(productsRawText), [productsRawText]);
  const parsedSuppliers = useMemo(() => parseRawNames(suppliersRawText), [suppliersRawText]);
  const parsedCustomers = useMemo(() => parseRawNames(customersRawText), [customersRawText]);

  // Execute Dump for Products
  const handleDumpProducts = () => {
    if (parsedProducts.length === 0) return;
    const res = AppStorage.bulkDumpProducts(parsedProducts, productDefaultCategory);
    setProductsRawText("");
    onRefreshData();
    if (showToast) {
      showToast(
        "success",
        `Dumped ${res.addedCount} Products!`,
        res.existingCount > 0
          ? `Added ${res.addedCount} new items (${res.existingCount} already existed in catalog).`
          : `Successfully registered ${res.addedCount} product items in inventory.`
      );
    }
  };

  // Execute Dump for Suppliers
  const handleDumpSuppliers = () => {
    if (parsedSuppliers.length === 0) return;
    const res = AppStorage.bulkDumpSuppliers(parsedSuppliers, supplierDefaultCategory);
    setSuppliersRawText("");
    onRefreshData();
    if (showToast) {
      showToast(
        "success",
        `Dumped ${res.addedCount} Suppliers!`,
        res.existingCount > 0
          ? `Added ${res.addedCount} new wholesalers (${res.existingCount} matched existing records).`
          : `Successfully created ${res.addedCount} supplier accounts in ledger.`
      );
    }
  };

  // Execute Dump for Customers
  const handleDumpCustomers = () => {
    if (parsedCustomers.length === 0) return;
    const res = AppStorage.bulkDumpCustomers(parsedCustomers);
    setCustomersRawText("");
    onRefreshData();
    if (showToast) {
      showToast(
        "success",
        `Dumped ${res.addedCount} Customers!`,
        res.existingCount > 0
          ? `Added ${res.addedCount} new client profiles (${res.existingCount} already existed).`
          : `Successfully created ${res.addedCount} customer debt & credit profiles.`
      );
    }
  };

  // Dump All 3 Simultaneously
  const handleDumpAllSimultaneously = () => {
    let totalAdded = 0;
    if (parsedProducts.length > 0) {
      const pRes = AppStorage.bulkDumpProducts(parsedProducts, productDefaultCategory);
      totalAdded += pRes.addedCount;
      setProductsRawText("");
    }
    if (parsedSuppliers.length > 0) {
      const sRes = AppStorage.bulkDumpSuppliers(parsedSuppliers, supplierDefaultCategory);
      totalAdded += sRes.addedCount;
      setSuppliersRawText("");
    }
    if (parsedCustomers.length > 0) {
      const cRes = AppStorage.bulkDumpCustomers(parsedCustomers);
      totalAdded += cRes.addedCount;
      setCustomersRawText("");
    }
    onRefreshData();
    if (showToast) {
      showToast(
        "success",
        "Bulk Dump Complete!",
        `Successfully loaded ${totalAdded} new entries across Products, Suppliers, and Customers.`
      );
    }
  };

  // Quick 1-by-1 Stream Adders
  const handleAddSingleProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!singleProductName.trim()) return;
    AppStorage.bulkDumpProducts([singleProductName.trim()], productDefaultCategory);
    setSingleProductName("");
    onRefreshData();
  };

  const handleAddSingleSupplier = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!singleSupplierName.trim()) return;
    AppStorage.bulkDumpSuppliers([singleSupplierName.trim()], supplierDefaultCategory);
    setSingleSupplierName("");
    onRefreshData();
  };

  const handleAddSingleCustomer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!singleCustomerName.trim()) return;
    AppStorage.bulkDumpCustomers([singleCustomerName.trim()]);
    setSingleCustomerName("");
    onRefreshData();
  };

  // Load Kenyan Retail Sample Starters
  const handleLoadSampleProducts = () => {
    const samples = [
      "Maize Flour 2kg (Jogoo)",
      "Maize Flour 2kg (Pembe)",
      "Wheat Flour 2kg (Ajab)",
      "White Sugar 1kg (Kabras)",
      "Cooking Oil 1L (Salit)",
      "Cooking Oil 2L (Rina)",
      "Fresh Milk 500ml (Brookside)",
      "Fresh Milk 500ml (KCC)",
      "Eggs Crate (30 pcs)",
      "White Bread 400g (Supaloaf)",
      "White Bread 400g (Festive)",
      "Bar Soap 800g (White Star)",
      "Bar Soap 800g (Menengai)",
      "Washing Powder 500g (Ariel)",
      "Steel Wool (10 pcs pack)",
      "Matchboxes (10 pack)",
      "Black Tea Leaves 100g (Kericho Gold)",
      "Instant Coffee 50g (Nescafe)",
      "Mineral Water 500ml",
      "Soda 300ml Glass",
      "Salt 500g (Kensalt)",
      "Spaghetti 400g (Santa Lucia)",
      "Rice 1kg (Pishori Sindano)",
      "Tomato Paste 70g (Zesta)",
      "Baking Powder 100g",
    ];
    setProductsRawText(samples.join("\n"));
  };

  const handleLoadSampleSuppliers = () => {
    const samples = [
      "Brookside Dairy Wholesalers",
      "New KCC Distributor",
      "Capwell Industries Millers",
      "Kapa Oil Refineries",
      "Pwani Oil Wholesalers",
      "Bakers Corner (Supaloaf)",
      "Farmers Choice Depot",
      "Broadway Bakery Distributors",
      "Unga Farm Care Limited",
      "Wakulima Fresh Produce Market",
      "Kabras Sugar Distributors",
      "Bidco Africa Regional Depot",
    ];
    setSuppliersRawText(samples.join("\n"));
  };

  const handleLoadSampleCustomers = () => {
    const samples = [
      "Mama Brian (Estate neighbor)",
      "Dennis Mutua (Boda Boda rider)",
      "Joseph Baraka (Mechanic)",
      "Teacher Jane (Primary School)",
      "Peter Kamau (Salon next door)",
      "Mama Kevin (Grocer)",
      "Pastor David",
      "Eric Omondi (Electrician)",
      "Sarah Wanjiru",
      "Mama Chloe (Daycare)",
    ];
    setCustomersRawText(samples.join("\n"));
  };

  // Master Review Filtered Data
  const reviewItems = useMemo(() => {
    const query = reviewSearchQuery.toLowerCase().trim();
    const result: Array<{
      id: string;
      name: string;
      type: "product" | "supplier" | "customer";
      categoryOrType: string;
      createdAt: string;
      targetTab: string;
    }> = [];

    if (reviewCategoryFilter === "all" || reviewCategoryFilter === "products") {
      items.forEach((item) => {
        if (!query || item.name.toLowerCase().includes(query) || item.category?.toLowerCase().includes(query)) {
          result.push({
            id: item.id,
            name: item.name,
            type: "product",
            categoryOrType: item.category || "General Goods",
            createdAt: item.created_at || "",
            targetTab: "stock",
          });
        }
      });
    }

    if (reviewCategoryFilter === "all" || reviewCategoryFilter === "suppliers") {
      suppliers.forEach((s) => {
        if (!query || s.name.toLowerCase().includes(query) || s.category?.toLowerCase().includes(query)) {
          result.push({
            id: s.id,
            name: s.name,
            type: "supplier",
            categoryOrType: s.category || "Supplier",
            createdAt: s.created_at || "",
            targetTab: "people",
          });
        }
      });
    }

    if (reviewCategoryFilter === "all" || reviewCategoryFilter === "customers") {
      customers.forEach((c) => {
        if (!query || c.name.toLowerCase().includes(query) || c.customer_type?.toLowerCase().includes(query)) {
          result.push({
            id: c.id,
            name: c.name,
            type: "customer",
            categoryOrType: c.customer_type || "Customer",
            createdAt: c.created_at || "",
            targetTab: "people",
          });
        }
      });
    }

    // Sort newest first
    return result.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [items, suppliers, customers, reviewSearchQuery, reviewCategoryFilter]);

  const totalPendingInAll = parsedProducts.length + parsedSuppliers.length + parsedCustomers.length;

  return (
    <div id="quick-dump-view" className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner / Philosophy Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#111827] border border-indigo-500/20 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Zap className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 font-display">
                Zero-Friction Fast Drop Zone
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              Raw Data Dump & Rapid Re-Population
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              No numbers, no IDs, no barcodes, and no descriptions needed right now. Just dump raw names—line-by-line, comma-separated, or pasted from WhatsApp. YuBiFlo instantly registers the accounts and catalog items so you can start trading immediately, and fill in specific prices and details later.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
            {totalPendingInAll > 0 && (
              <button
                onClick={handleDumpAllSimultaneously}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Dump All ({totalPendingInAll} items)</span>
              </button>
            )}

            <button
              onClick={() => onRefreshData()}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              title="Refresh database state"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Refresh Count</span>
            </button>
          </div>
        </div>

        {/* Live Counters Pill Banner */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 pt-4 border-t border-slate-800/80 text-center">
          <div
            onClick={() => setActiveCategory("suppliers")}
            className="cursor-pointer bg-slate-900/80 hover:bg-slate-800/90 p-2.5 rounded-xl border border-amber-500/20 transition-all"
          >
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Truck className="w-3 h-3" />
              <span>Suppliers</span>
            </span>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {suppliers.length}{" "}
              <span className="text-[11px] font-normal text-slate-400">active</span>
            </div>
          </div>

          <div
            onClick={() => setActiveCategory("customers")}
            className="cursor-pointer bg-slate-900/80 hover:bg-slate-800/90 p-2.5 rounded-xl border border-indigo-500/20 transition-all"
          >
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              <span>Customers</span>
            </span>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {customers.length}{" "}
              <span className="text-[11px] font-normal text-slate-400">active</span>
            </div>
          </div>

          <div
            onClick={() => setActiveCategory("products")}
            className="cursor-pointer bg-slate-900/80 hover:bg-slate-800/90 p-2.5 rounded-xl border border-emerald-500/20 transition-all"
          >
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Boxes className="w-3 h-3" />
              <span>Products / Items</span>
            </span>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {items.length}{" "}
              <span className="text-[11px] font-normal text-slate-400">catalog items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeCategory === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All-in-One Studio (3 Columns)</span>
          </button>
          <button
            onClick={() => setActiveCategory("suppliers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeCategory === "suppliers"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Suppliers ({suppliers.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory("customers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeCategory === "customers"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory("products")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeCategory === "products"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Products ({items.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] text-slate-500">
            Paste whole lists or type 1-by-1
          </span>
        </div>
      </div>

      {/* Main Dump Section */}
      <div className={`grid gap-4 ${activeCategory === "all" ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}>
        {/* ========================================================================= */}
        {/* 1. SUPPLIERS DUMP BOX */}
        {/* ========================================================================= */}
        {(activeCategory === "all" || activeCategory === "suppliers") && (
          <div className="rounded-2xl bg-[#131316] border border-amber-500/30 p-4 sm:p-5 flex flex-col justify-between shadow-xl space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Suppliers Drop Box</h2>
                    <p className="text-[11px] text-slate-400">Wholesalers, distributors, milk/bread suppliers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleSuppliers}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
                  title="Load common Kenyan wholesaler names"
                >
                  Load Examples
                </button>
              </div>

              {/* Single Stream Add Bar */}
              <form onSubmit={handleAddSingleSupplier} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Type supplier name + Enter..."
                  value={singleSupplierName}
                  onChange={(e) => setSingleSupplierName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!singleSupplierName.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold transition-transform active:scale-95 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              {/* Multi-Line Bulk Paste Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="text-slate-400 font-medium flex items-center gap-1">
                    <ClipboardPaste className="w-3 h-3 text-amber-400" />
                    <span>Paste Bulk Suppliers (1 per line or commas):</span>
                  </label>
                  {parsedSuppliers.length > 0 && (
                    <span className="text-amber-400 font-bold font-mono">
                      {parsedSuppliers.length} detected
                    </span>
                  )}
                </div>
                <textarea
                  rows={activeCategory === "suppliers" ? 10 : 6}
                  placeholder={`Brookside Dairy\nNew KCC\nCapwell Unga Millers\nKapa Oil Refineries\nBakers Corner\nFarmers Choice...`}
                  value={suppliersRawText}
                  onChange={(e) => setSuppliersRawText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-y"
                />
              </div>

              {/* Parsed Preview Pills */}
              {parsedSuppliers.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/30 max-h-28 overflow-y-auto space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Will Create {parsedSuppliers.length} Suppliers:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {parsedSuppliers.map((name, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-amber-900/40 text-amber-200 border border-amber-700/40 text-[10px] font-mono"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions for Suppliers */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <button
                onClick={handleDumpSuppliers}
                disabled={parsedSuppliers.length === 0}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>
                  {parsedSuppliers.length > 0
                    ? `Dump ${parsedSuppliers.length} Suppliers Now`
                    : "Paste or Enter Suppliers Above"}
                </span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Currently in Ledger: <strong>{suppliers.length}</strong></span>
                <button
                  onClick={() => setActiveTab("people")}
                  className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Go to Suppliers Tab</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. CUSTOMERS DUMP BOX */}
        {/* ========================================================================= */}
        {(activeCategory === "all" || activeCategory === "customers") && (
          <div className="rounded-2xl bg-[#131316] border border-indigo-500/30 p-4 sm:p-5 flex flex-col justify-between shadow-xl space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Customers Drop Box</h2>
                    <p className="text-[11px] text-slate-400">Regulars, credit book names, walk-in clients</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleCustomers}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium"
                  title="Load sample customer names"
                >
                  Load Examples
                </button>
              </div>

              {/* Single Stream Add Bar */}
              <form onSubmit={handleAddSingleCustomer} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Type customer name + Enter..."
                  value={singleCustomerName}
                  onChange={(e) => setSingleCustomerName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!singleCustomerName.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-transform active:scale-95 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              {/* Multi-Line Bulk Paste Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="text-slate-400 font-medium flex items-center gap-1">
                    <ClipboardPaste className="w-3 h-3 text-indigo-400" />
                    <span>Paste Bulk Customers (1 per line or commas):</span>
                  </label>
                  {parsedCustomers.length > 0 && (
                    <span className="text-indigo-400 font-bold font-mono">
                      {parsedCustomers.length} detected
                    </span>
                  )}
                </div>
                <textarea
                  rows={activeCategory === "customers" ? 10 : 6}
                  placeholder={`Mama Brian\nDennis Mutua\nJoseph Baraka\nTeacher Jane\nPeter Kamau\nMama Kevin\nEric Omondi...`}
                  value={customersRawText}
                  onChange={(e) => setCustomersRawText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-indigo-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-y"
                />
              </div>

              {/* Parsed Preview Pills */}
              {parsedCustomers.length > 0 && (
                <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 max-h-28 overflow-y-auto space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                    Will Create {parsedCustomers.length} Customers:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {parsedCustomers.map((name, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-indigo-900/40 text-indigo-200 border border-indigo-700/40 text-[10px] font-mono"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions for Customers */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <button
                onClick={handleDumpCustomers}
                disabled={parsedCustomers.length === 0}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>
                  {parsedCustomers.length > 0
                    ? `Dump ${parsedCustomers.length} Customers Now`
                    : "Paste or Enter Customers Above"}
                </span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Registered Customers: <strong>{customers.length}</strong></span>
                <button
                  onClick={() => setActiveTab("people")}
                  className="text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Go to Customers & Credit</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. PRODUCTS DUMP BOX */}
        {/* ========================================================================= */}
        {(activeCategory === "all" || activeCategory === "products") && (
          <div className="rounded-2xl bg-[#131316] border border-emerald-500/30 p-4 sm:p-5 flex flex-col justify-between shadow-xl space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Products / Items Drop Box</h2>
                    <p className="text-[11px] text-slate-400">Food, drinks, household goods, commodities</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleProducts}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-medium"
                  title="Load 25 popular Kenyan supermarket items"
                >
                  Load Examples
                </button>
              </div>

              {/* Single Stream Add Bar */}
              <form onSubmit={handleAddSingleProduct} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Type product name + Enter..."
                  value={singleProductName}
                  onChange={(e) => setSingleProductName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!singleProductName.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-transform active:scale-95 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              {/* Multi-Line Bulk Paste Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="text-slate-400 font-medium flex items-center gap-1">
                    <ClipboardPaste className="w-3 h-3 text-emerald-400" />
                    <span>Paste Bulk Products (1 per line or commas):</span>
                  </label>
                  {parsedProducts.length > 0 && (
                    <span className="text-emerald-400 font-bold font-mono">
                      {parsedProducts.length} detected
                    </span>
                  )}
                </div>
                <textarea
                  rows={activeCategory === "products" ? 10 : 6}
                  placeholder={`Maize Flour 2kg (Jogoo)\nSugar 1kg (Kabras)\nFresh Milk 500ml\nCooking Oil 1L\nWhite Bread 400g\nBar Soap 800g\nEggs Crate 30s...`}
                  value={productsRawText}
                  onChange={(e) => setProductsRawText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-emerald-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-y"
                />
              </div>

              {/* Parsed Preview Pills */}
              {parsedProducts.length > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30 max-h-28 overflow-y-auto space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Will Create {parsedProducts.length} Inventory Items:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {parsedProducts.map((name, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-emerald-900/40 text-emerald-200 border border-emerald-700/40 text-[10px] font-mono"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions for Products */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <button
                onClick={handleDumpProducts}
                disabled={parsedProducts.length === 0}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Boxes className="w-4 h-4" />
                <span>
                  {parsedProducts.length > 0
                    ? `Dump ${parsedProducts.length} Products Now`
                    : "Paste or Enter Products Above"}
                </span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Items in Stock: <strong>{items.length}</strong></span>
                <button
                  onClick={() => setActiveTab("stock")}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Go to Inventory & Prices</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MASTER REVIEW & DETAIL JUMP TABLE */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#131316] border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Dumped Registry & Quick Detail Editor</span>
            </h2>
            <p className="text-xs text-slate-400">
              Review everything you've dumped. Click any item to jump straight into its dedicated management tab where you can add prices, stock counts, phone numbers, and descriptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search dumped names..."
                value={reviewSearchQuery}
                onChange={(e) => setReviewSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={reviewCategoryFilter}
              onChange={(e) => setReviewCategoryFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories ({items.length + suppliers.length + customers.length})</option>
              <option value="products">Products Only ({items.length})</option>
              <option value="suppliers">Suppliers Only ({suppliers.length})</option>
              <option value="customers">Customers Only ({customers.length})</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80">
            {reviewItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No records matching query.</p>
                <p className="text-[11px] text-slate-600">
                  Use the drop boxes above to paste or type names to begin.
                </p>
              </div>
            ) : (
              reviewItems.map((rec) => {
                const isProduct = rec.type === "product";
                const isSupplier = rec.type === "supplier";
                const isCustomer = rec.type === "customer";

                return (
                  <div
                    key={`${rec.type}-${rec.id}`}
                    className="p-3 sm:p-4 bg-slate-900/40 hover:bg-slate-900/80 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`p-2 rounded-lg shrink-0 ${
                          isProduct
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : isSupplier
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        }`}
                      >
                        {isProduct && <Boxes className="w-4 h-4" />}
                        {isSupplier && <Truck className="w-4 h-4" />}
                        {isCustomer && <Users className="w-4 h-4" />}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                            {rec.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold shrink-0 ${
                              isProduct
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                                : isSupplier
                                ? "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                                : "bg-indigo-950/60 text-indigo-300 border border-indigo-800/40"
                            }`}
                          >
                            {rec.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          Tag: {rec.categoryOrType} • Ready for detailed pricing & contact notes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveTab(rec.targetTab)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                        title={`Open ${rec.targetTab.toUpperCase()} tab to add descriptions and prices`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="hidden sm:inline">
                          Add Details in {isProduct ? "Inventory" : isSupplier ? "Suppliers" : "Customers"}
                        </span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
