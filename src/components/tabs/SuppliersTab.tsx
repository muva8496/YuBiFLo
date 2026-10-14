import React, { useState } from "react";
import { 
  Truck, Plus, Phone, Search, Copy, Check, DollarSign, 
  Building2, ShieldCheck, CheckCircle2, ArrowRight, CreditCard,
  Edit3, Trash2, ExternalLink, AlertCircle, ShoppingBag, Calendar,
  FileText, Clock, UserCheck, Smartphone
} from "lucide-react";
import { AlacioMasterState, SupplierProfile, PayoutOrDrawing } from "../../types/alacio";

interface SuppliersTabProps {
  state: AlacioMasterState;
  onNavigateTab: (tabId: string) => void;
  onAddSupplier?: (supplier: SupplierProfile) => void;
  onEditSupplier?: (supplierId: string, updatedData: Partial<SupplierProfile>) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onPaySupplier?: (payout: {
    supplierId: string;
    supplierName: string;
    supplierPhone: string;
    supplierNationalId: string;
    amount: number;
    paymentChannel: "NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER";
    tillOrAccount?: string;
    date: string;
    notes?: string;
  }) => void;
  onSelectSupplierForPurchase?: (supplierName: string) => void;
}

export default function SuppliersTab({
  state,
  onNavigateTab,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onPaySupplier,
  onSelectSupplierForPurchase
}: SuppliersTabProps) {
  const { currency, suppliers = [], payouts = [] } = state;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Add Supplier Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNationalId, setNewNationalId] = useState("");
  const [newCategory, setNewCategory] = useState("Dairy & Chilled");
  const [newPaymentPref, setNewPaymentPref] = useState<"NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER">("NATIONAL_ID_DEPOSIT");
  const [newTill, setNewTill] = useState("");
  const [newTerms, setNewTerms] = useState("Cash on Delivery (COD)");
  const [newLocation, setNewLocation] = useState("Nairobi / Industrial Area");

  // Edit Supplier Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierProfile | null>(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editDriverName, setEditDriverName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNationalId, setEditNationalId] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPaymentPref, setEditPaymentPref] = useState<"NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER">("NATIONAL_ID_DEPOSIT");
  const [editTill, setEditTill] = useState("");
  const [editTerms, setEditTerms] = useState("");

  // Pay Supplier Modal
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<SupplierProfile | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payChannel, setPayChannel] = useState<"NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER">("NATIONAL_ID_DEPOSIT");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState("");

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierProfile | null>(null);

  // Copy helper
  const handleCopy = (text: string, type: "id" | "phone", key: string) => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 3000);
      setToastMsg(`Copied Kenyan National ID: "${text}" for Agency Bank OTC deposit.`);
    } else {
      setCopiedPhone(key);
      setTimeout(() => setCopiedPhone(null), 3000);
      setToastMsg(`Copied phone number: "${text}" for M-Pesa transfer.`);
    }
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Categories list
  const categories = [
    "ALL",
    "Dairy & Chilled",
    "Bakery",
    "Flour & Cereals",
    "Cooking Oils & Soaps",
    "Beverages",
    "General Wholesaler"
  ];

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter((sup) => {
    const matchesSearch = 
      sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sup.driver_name && sup.driver_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      sup.phone.includes(searchQuery) ||
      sup.national_id.includes(searchQuery);

    const matchesCategory = selectedCategory === "ALL" || sup.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals
  const totalWholesaleSpend = suppliers.reduce((acc, s) => acc + (s.total_orders_cost || 0), 0);
  const totalNationalIdDeposits = suppliers.filter(s => s.payment_preference === "NATIONAL_ID_DEPOSIT").length;

  // Add Supplier submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newPhone.trim() || !newNationalId.trim()) {
      setToastMsg("Please fill in Company Name, Phone Number, and National ID Number.");
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    const newSupplier: SupplierProfile = {
      id: `supp_${Date.now()}`,
      name: newCompanyName.trim(),
      company: newCompanyName.trim(),
      driver_name: newDriverName.trim() || undefined,
      phone: newPhone.trim(),
      national_id: newNationalId.trim(),
      category: newCategory,
      total_orders_cost: 0,
      last_delivery_date: "Today",
      payment_preference: newPaymentPref,
      till_or_account: newTill.trim() || undefined,
      payment_terms: newTerms,
      location: newLocation
    };

    if (onAddSupplier) {
      onAddSupplier(newSupplier);
    }

    setIsAddOpen(false);
    setNewCompanyName("");
    setNewDriverName("");
    setNewPhone("");
    setNewNationalId("");
    setNewTill("");
    setToastMsg(`Registered supplier "${newSupplier.name}" with National ID ${newSupplier.national_id} & Phone ${newSupplier.phone}!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Edit Supplier submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editCompanyName.trim()) return;

    if (onEditSupplier) {
      onEditSupplier(editingSupplier.id, {
        name: editCompanyName.trim(),
        company: editCompanyName.trim(),
        driver_name: editDriverName.trim() || undefined,
        phone: editPhone.trim(),
        national_id: editNationalId.trim(),
        category: editCategory,
        payment_preference: editPaymentPref,
        till_or_account: editTill.trim() || undefined,
        payment_terms: editTerms
      });
    }

    setIsEditOpen(false);
    setEditingSupplier(null);
    setToastMsg(`Updated supplier "${editCompanyName}" records successfully.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Open Edit
  const handleOpenEdit = (sup: SupplierProfile) => {
    setEditingSupplier(sup);
    setEditCompanyName(sup.company || sup.name);
    setEditDriverName(sup.driver_name || "");
    setEditPhone(sup.phone);
    setEditNationalId(sup.national_id);
    setEditCategory(sup.category);
    setEditPaymentPref(sup.payment_preference);
    setEditTill(sup.till_or_account || "");
    setEditTerms(sup.payment_terms || "Cash on Delivery");
    setIsEditOpen(true);
  };

  // Open Pay Modal
  const handleOpenPay = (sup: SupplierProfile) => {
    setPayingSupplier(sup);
    setPayChannel(sup.payment_preference);
    setPayAmount("");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNotes(`Restock settlement for ${sup.name}`);
    setIsPayOpen(true);
  };

  // Submit Pay
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier || !payAmount) return;
    const amount = parseFloat(payAmount);
    if (amount <= 0) return;

    if (onPaySupplier) {
      onPaySupplier({
        supplierId: payingSupplier.id,
        supplierName: payingSupplier.name,
        supplierPhone: payingSupplier.phone,
        supplierNationalId: payingSupplier.national_id,
        amount,
        paymentChannel: payChannel,
        tillOrAccount: payingSupplier.till_or_account,
        date: payDate,
        notes: payNotes
      });
    }

    setIsPayOpen(false);
    setToastMsg(`Recorded ${currency} ${amount.toLocaleString()} payout to ${payingSupplier.name} via ${payChannel.replace(/_/g, " ")}.`);
    setPayingSupplier(null);
    setPayAmount("");
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-900 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. HEADER & ACTIONS                                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Truck className="text-blue-600" size={24} /> Suppliers &amp; Vendors
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold uppercase">
              Counterparty KYC &amp; Settlement
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain verified <strong>Kenyan National IDs</strong> and <strong>Phone Numbers</strong> for all suppliers and delivery drivers. Required for Bank OTC Agency cash deposits (Equity Agent, KCB Mtaani, Co-op) and M-Pesa settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => onNavigateTab("purchases")}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag size={14} className="text-slate-600" />
            <span>Go to Purchases</span>
          </button>
          
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-[#1A56DB] hover:bg-[#1545B3] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* TOAST FEEDBACK */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STATS & REGULATORY COUNTERPARTY NOTICE                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Active Suppliers</span>
          <div className="text-2xl font-serif font-bold text-slate-900 mt-1">
            {suppliers.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Across {categories.length - 1} categories</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Wholesale Ordered</span>
          <div className="text-2xl font-serif font-bold text-blue-700 mt-1">
            {currency} {totalWholesaleSpend.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Historical cargo restocks</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">National ID OTC Rails</span>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {totalNationalIdDeposits}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Equity / KCB Agent deposits</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">ID &amp; Phone Compliance</span>
          <div className="text-2xl font-serif font-bold text-purple-700 mt-1">
            100%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Phone &amp; National ID linked</span>
        </div>
      </div>

      {/* COMPLIANCE GUIDE CALLOUT BANNER */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-blue-900 font-bold">
          <ShieldCheck size={16} className="text-blue-600" />
          <span>Why We Take Phone Numbers &amp; National IDs of Suppliers &amp; Drivers:</span>
        </div>
        <p className="text-blue-800 text-[11px] leading-relaxed">
          In Kenyan retail and wholesale operations, counterparty identification is essential: 
          <strong> (1) Bank OTC Agency Cash Deposits</strong>: When depositing money at an Equity Agent, KCB Mtaani, or Co-op Kwa Jirani booth for a wholesale delivery, the teller requires the driver's or company representative's <strong>Kenyan National ID number</strong>. 
          <strong> (2) M-Pesa Payouts</strong>: Direct transfers or Buy Goods payments require a confirmed phone number to receive instant SMS confirmation. 
          <strong> (3) Inbound Delivery Verification</strong>: Recording the National ID protects the shop owner against counterfeit delivery claims.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & CATEGORY FILTER BAR                                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by Name, Company, Phone, or National ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#1A56DB] text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SUPPLIERS DIRECTORY GRID                                               */}
      {/* ========================================================================= */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Truck size={36} className="text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No suppliers match your search</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search query or add a new supplier with their phone number and National ID.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-[#1A56DB] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            + Register New Supplier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((supplier) => {
            const isNationalIdCopy = copiedId === supplier.id;
            const isPhoneCopy = copiedPhone === supplier.id;

            return (
              <div 
                key={supplier.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-4 flex flex-col justify-between"
              >
                {/* TOP ROW: NAME & CATEGORY */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-serif font-bold text-slate-900 leading-tight">
                        {supplier.name}
                      </h3>
                      <span className="text-xs text-slate-500 block">
                        {supplier.company} {supplier.driver_name ? `• Driver: ${supplier.driver_name}` : ""}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 shrink-0">
                      {supplier.category}
                    </span>
                  </div>

                  {supplier.location && (
                    <span className="text-[11px] text-slate-400 block">
                      📍 {supplier.location}
                    </span>
                  )}
                </div>

                {/* KEY SECTION: KENYAN NATIONAL ID & PHONE (HIGHLIGHTED FOR DEPOSITS) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  
                  {/* NATIONAL ID ROW */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-700">National ID:</span>
                      <span className="font-mono font-bold text-slate-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-xs">
                        {supplier.national_id}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(supplier.national_id, "id", supplier.id)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100/60 hover:bg-emerald-100 px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Copy National ID for Agency Bank Cash Deposit (Equity/KCB/Co-op)"
                    >
                      {isNationalIdCopy ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isNationalIdCopy ? "Copied ID!" : "Copy for OTC Deposit"}</span>
                    </button>
                  </div>

                  {/* PHONE NUMBER ROW */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Phone size={14} className="text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-700">Phone / Till:</span>
                      <span className="font-mono text-slate-900 font-medium">
                        {supplier.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${supplier.phone.replace(/[^0-9+]/g, "")}`}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition cursor-pointer"
                      >
                        Call
                      </a>
                      <button
                        onClick={() => handleCopy(supplier.phone, "phone", supplier.id)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-200/70 hover:bg-slate-200 px-2 py-1 rounded-lg transition cursor-pointer"
                        title="Copy phone number for M-Pesa transfer"
                      >
                        {isPhoneCopy ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* PAYMENT PREFERENCE & TERMS */}
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Payment Mode:
                    </span>
                    <span className="font-medium text-slate-800">
                      {supplier.payment_preference === "NATIONAL_ID_DEPOSIT" && "🏦 Agency Bank OTC via National ID"}
                      {supplier.payment_preference === "MPESA_TILL" && `📱 M-Pesa Till ${supplier.till_or_account ? `(${supplier.till_or_account})` : ""}`}
                      {supplier.payment_preference === "CASH_DRAWER" && "💵 Cash Drawer on Delivery"}
                      {supplier.payment_preference === "BANK_TRANSFER" && "🏛️ Direct Bank Transfer"}
                    </span>
                  </div>
                </div>

                {/* BOTTOM ROW: STATS & ACTIONS */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Spend</span>
                    <strong className="text-slate-900 font-mono font-bold">
                      {currency} {(supplier.total_orders_cost || 0).toLocaleString()}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* PAY / DEPOSIT BUTTON */}
                    <button
                      onClick={() => handleOpenPay(supplier)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Make an OTC Cash Deposit or M-Pesa payout to this supplier"
                    >
                      <DollarSign size={13} />
                      <span>Deposit / Pay</span>
                    </button>

                    {/* LOG CARGO / PURCHASES */}
                    <button
                      onClick={() => {
                        if (onSelectSupplierForPurchase) {
                          onSelectSupplierForPurchase(supplier.name);
                        }
                        onNavigateTab("purchases");
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                      title="Log a lot of goods / restock delivery from this supplier"
                    >
                      <ShoppingBag size={13} />
                      <span>Delivery</span>
                    </button>

                    {/* EDIT */}
                    <button
                      onClick={() => handleOpenEdit(supplier)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                      title="Edit Supplier info, Phone number or National ID"
                    >
                      <Edit3 size={14} />
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => {
                        setSupplierToDelete(supplier);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                      title="Delete Supplier"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD SUPPLIER MODAL                                                     */}
      {/* ========================================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Truck className="text-blue-600" size={18} />
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Register New Supplier / Distributor
                </h3>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Agency Banking Compliance:</strong> Please ensure you enter the supplier or delivery driver's valid <strong>Kenyan National ID Number</strong> and <strong>Phone Number</strong>. These are used to execute and verify OTC cash deposits at bank agency booths (Equity, KCB, Co-op).
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                
                {/* COMPANY NAME */}
                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Company / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Brookside Dairy Ltd, Unga Group, Broadway Bakeries"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* DRIVER / CONTACT PERSON */}
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Driver / Sales Rep Name</label>
                  <input
                    type="text"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    placeholder="e.g. Peter Njoroge (Van Driver)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                {/* CATEGORY */}
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Product Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    {categories.filter(c => c !== "ALL").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* KENYAN NATIONAL ID (PROMINENT) */}
                <div>
                  <label className="text-slate-800 font-bold block mb-1 flex items-center gap-1.5 text-emerald-800">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Kenyan National ID Number *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newNationalId}
                    onChange={(e) => setNewNationalId(e.target.value)}
                    placeholder="e.g. 22940184 (For Agent OTC Deposit)"
                    className="w-full bg-emerald-50/50 border-2 border-emerald-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-emerald-700 block mt-0.5">Used for Equity / KCB Agent cash deposits</span>
                </div>

                {/* PHONE NUMBER */}
                <div>
                  <label className="text-slate-800 font-bold block mb-1 flex items-center gap-1.5 text-blue-800">
                    <Phone size={14} className="text-blue-600" />
                    <span>Phone Number (M-Pesa / SMS) *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 0722 849 101"
                    className="w-full bg-blue-50/50 border-2 border-blue-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <span className="text-[10px] text-blue-700 block mt-0.5">Used for M-Pesa transfer confirmation</span>
                </div>

                {/* PAYMENT PREFERENCE */}
                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Preferred Settlement Channel</label>
                  <select
                    value={newPaymentPref}
                    onChange={(e) => setNewPaymentPref(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="NATIONAL_ID_DEPOSIT">🏦 Agency Bank OTC Cash Deposit via National ID (Equity/KCB/Co-op)</option>
                    <option value="MPESA_TILL">📱 M-Pesa Buy Goods / Till Number</option>
                    <option value="CASH_DRAWER">💵 Physical Cash Drawer Outflow on Delivery</option>
                    <option value="BANK_TRANSFER">🏛️ Direct Bank Wire / Account Transfer</option>
                  </select>
                </div>

                {/* TILL OR ACCOUNT */}
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Till No. / Account (Optional)</label>
                  <input
                    type="text"
                    value={newTill}
                    onChange={(e) => setNewTill(e.target.value)}
                    placeholder="e.g. Till 982310 or A/C 0110..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>

                {/* PAYMENT TERMS */}
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Credit / Payment Terms</label>
                  <select
                    value={newTerms}
                    onChange={(e) => setNewTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                    <option value="7 Days Net Credit">7 Days Net Credit</option>
                    <option value="14 Days Net Credit">14 Days Net Credit</option>
                    <option value="Monthly Settlement">Monthly Settlement</option>
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A56DB] hover:bg-[#1545B3] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Save Supplier Profile</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PAY / DEPOSIT TO SUPPLIER MODAL                                        */}
      {/* ========================================================================= */}
      {isPayOpen && payingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-2">
                <DollarSign className="text-emerald-600" size={18} />
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Execute Supplier Settlement / Deposit
                </h3>
              </div>
              <button onClick={() => setIsPayOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
              
              {/* COUNTERPARTY VERIFICATION BOX */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Counterparty Verification Data:
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {payingSupplier.name} ({payingSupplier.company})
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 block">National ID (For OTC):</span>
                    <strong className="text-emerald-700 text-xs block">{payingSupplier.national_id}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(payingSupplier.national_id, "id", payingSupplier.id)}
                      className="text-[10px] text-emerald-600 underline hover:text-emerald-800 mt-0.5 block"
                    >
                      Copy National ID
                    </button>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 block">Phone (M-Pesa):</span>
                    <strong className="text-blue-700 text-xs block">{payingSupplier.phone}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(payingSupplier.phone, "phone", payingSupplier.id)}
                      className="text-[10px] text-blue-600 underline hover:text-blue-800 mt-0.5 block"
                    >
                      Copy Phone
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Settlement Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="e.g. 5040"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Payment Method</label>
                  <select
                    value={payChannel}
                    onChange={(e) => setPayChannel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="NATIONAL_ID_DEPOSIT">🏦 Agency Bank OTC Cash Deposit (Equity/KCB/Co-op via National ID)</option>
                    <option value="MPESA_TILL">📱 M-Pesa Buy Goods / Till Payout</option>
                    <option value="CASH_DRAWER">💵 Cash Drawer Outflow at Counter</option>
                    <option value="BANK_TRANSFER">🏛️ Direct Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Notes / Receipt Code</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Cleared delivery note BK-8841 via Equity Agent"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Confirm Payout</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. EDIT SUPPLIER MODAL                                                    */}
      {/* ========================================================================= */}
      {isEditOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="text-blue-600" size={16} /> Edit Supplier Profile
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                
                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Company / Business Name</label>
                  <input
                    type="text"
                    required
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Driver / Rep Name</label>
                  <input
                    type="text"
                    value={editDriverName}
                    onChange={(e) => setEditDriverName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-emerald-800 font-bold block mb-1 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>National ID Number</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNationalId}
                    onChange={(e) => setEditNationalId(e.target.value)}
                    className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-blue-800 font-bold block mb-1 flex items-center gap-1">
                    <Phone size={13} className="text-blue-600" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-blue-50/50 border border-blue-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Payment Preference</label>
                  <select
                    value={editPaymentPref}
                    onChange={(e) => setEditPaymentPref(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="NATIONAL_ID_DEPOSIT">🏦 Agency Bank OTC Cash Deposit (Equity/KCB/Co-op via National ID)</option>
                    <option value="MPESA_TILL">📱 M-Pesa Buy Goods / Till Number</option>
                    <option value="CASH_DRAWER">💵 Physical Cash Drawer Outflow on Delivery</option>
                    <option value="BANK_TRANSFER">🏛️ Direct Bank Wire / Account Transfer</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Till / Account Number</label>
                  <input
                    type="text"
                    value={editTill}
                    onChange={(e) => setEditTill(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A56DB] hover:bg-[#1545B3] text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {isDeleteOpen && supplierToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-slate-900">
                Delete Supplier?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{supplierToDelete.name}</strong>? Past purchase and payout records will remain in the accounting ledger.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteSupplier) {
                    onDeleteSupplier(supplierToDelete.id);
                  }
                  setIsDeleteOpen(false);
                  setSupplierToDelete(null);
                  setToastMsg("Supplier removed successfully.");
                  setTimeout(() => setToastMsg(null), 3500);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
