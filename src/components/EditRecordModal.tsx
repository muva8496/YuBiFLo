import React, { useState, useEffect } from "react";
import {
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Save,
  Calendar,
  DollarSign,
  Package,
  Smartphone,
  Landmark,
  Coins,
  CreditCard,
  Building,
  User,
  Phone,
  MapPin,
  Sparkles,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  Merchant,
  SalesLedgerEntry,
  MoneyOutExpense,
  InventoryItem,
  SupplyBatch,
  DailyMorningFloatLog,
  Supplier,
  Customer,
  SupplierPaymentTerms,
  CustomerType,
  CustomerPaymentPreference,
  CustomerTrustStatus,
} from "../types";
import { EvidentialDatePicker } from "./EvidentialDatePicker";

export type EditableRecordType =
  | "SALE"
  | "EXPENSE"
  | "ITEM"
  | "BATCH"
  | "FLOAT"
  | "SUPPLIER"
  | "CUSTOMER";

export interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant;
  type: EditableRecordType;
  record:
    | SalesLedgerEntry
    | MoneyOutExpense
    | InventoryItem
    | SupplyBatch
    | DailyMorningFloatLog
    | Supplier
    | Customer
    | null;
  onSave: (updatedRecord: any, type: EditableRecordType) => void;
  onDelete: (id: string, type: EditableRecordType) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  merchant,
  type,
  record,
  onSave,
  onDelete,
}) => {
  // Sales State
  const [saleQty, setSaleQty] = useState<number>(0);
  const [saleUnitCost, setSaleUnitCost] = useState<number>(0);
  const [saleUnitSelling, setSaleUnitSelling] = useState<number>(0);
  const [saleDate, setSaleDate] = useState<string>("");
  const [saleNotes, setSaleNotes] = useState<string>("");

  // Expense State
  const [expenseTotalCost, setExpenseTotalCost] = useState<number>(0);
  const [expenseQty, setExpenseQty] = useState<number>(0);
  const [expenseUnitSelling, setExpenseUnitSelling] = useState<number>(0);
  const [expenseSupplier, setExpenseSupplier] = useState<string>("");
  const [expenseCategory, setExpenseCategory] = useState<string>("");
  const [expenseRef, setExpenseRef] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>("");
  const [expenseNotes, setExpenseNotes] = useState<string>("");

  // Item State (Product)
  const [itemName, setItemName] = useState<string>("");
  const [itemCategory, setItemCategory] = useState<string>("");
  const [itemUnitCost, setItemUnitCost] = useState<number>(0); // Buying Price
  const [itemUnitSelling, setItemUnitSelling] = useState<number>(0); // Selling Price
  const [itemStockQty, setItemStockQty] = useState<number>(0);
  const [itemReorderPoint, setItemReorderPoint] = useState<number>(2);
  const [itemUnitOfMeasure, setItemUnitOfMeasure] = useState<string>("units");

  // Supplier State
  const [suppName, setSuppName] = useState<string>("");
  const [suppNationalId, setSuppNationalId] = useState<string>("");
  const [suppGoodsSupplied, setSuppGoodsSupplied] = useState<string>("");
  const [suppCategory, setSuppCategory] = useState<string>("");
  const [suppPhone, setSuppPhone] = useState<string>("");
  const [suppContactPerson, setSuppContactPerson] = useState<string>("");
  const [suppPaymentTerms, setSuppPaymentTerms] = useState<SupplierPaymentTerms>("CREDIT_7_DAYS");
  const [suppBankOrPaybill, setSuppBankOrPaybill] = useState<string>("");
  const [suppBalanceOwed, setSuppBalanceOwed] = useState<number>(0);
  const [suppLocation, setSuppLocation] = useState<string>("");
  const [suppNotes, setSuppNotes] = useState<string>("");

  // Customer State
  const [custName, setCustName] = useState<string>("");
  const [custNationalId, setCustNationalId] = useState<string>("");
  const [custGoodsBought, setCustGoodsBought] = useState<string>("");
  const [custType, setCustType] = useState<CustomerType>("RETAIL_REGULAR");
  const [custPhone, setCustPhone] = useState<string>("");
  const [custCreditLimit, setCustCreditLimit] = useState<number>(1000);
  const [custOutstandingDeni, setCustOutstandingDeni] = useState<number>(0);
  const [custLocation, setCustLocation] = useState<string>("");
  const [custPrefPayment, setCustPrefPayment] = useState<CustomerPaymentPreference>("CREDIT_DENI");
  const [custTrustStatus, setCustTrustStatus] = useState<CustomerTrustStatus>("GOOD_STANDING");
  const [custNotes, setCustNotes] = useState<string>("");

  // Batch State
  const [batchInitialQty, setBatchInitialQty] = useState<number>(0);
  const [batchRemainingQty, setBatchRemainingQty] = useState<number>(0);
  const [batchUnitCost, setBatchUnitCost] = useState<number>(0);
  const [batchUnitSelling, setBatchUnitSelling] = useState<number>(0);
  const [batchDate, setBatchDate] = useState<string>("");
  const [batchNotes, setBatchNotes] = useState<string>("");

  // Float Log State
  const [floatDate, setFloatDate] = useState<string>("");
  const [floatTime, setFloatTime] = useState<string>("05:57 AM");
  const [floatMpesa, setFloatMpesa] = useState<number>(0);
  const [floatEquity, setFloatEquity] = useState<number>(0);
  const [floatCash, setFloatCash] = useState<number>(0);
  const [floatNotes, setFloatNotes] = useState<string>("");

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!record) return;
    setConfirmDelete(false);

    if (type === "SALE") {
      const s = record as SalesLedgerEntry;
      setSaleQty(s.qty_sold || 0);
      setSaleUnitCost(s.unit_cost_price || 0);
      setSaleUnitSelling(s.unit_selling_price || 0);
      setSaleDate(s.created_at || s.batch_end_date || new Date().toISOString());
      setSaleNotes(s.notes || "");
    } else if (type === "EXPENSE") {
      const e = record as MoneyOutExpense;
      setExpenseTotalCost(e.total_cost || 0);
      setExpenseQty(e.qty_purchased || 0);
      setExpenseUnitSelling(e.unit_selling_price || 0);
      setExpenseSupplier(e.supplier_name || "");
      setExpenseCategory(e.category || "INVENTORY");
      setExpenseRef(e.receipt_reference || "");
      setExpenseDate(e.created_at || new Date().toISOString());
      setExpenseNotes(e.notes || "");
    } else if (type === "ITEM") {
      const i = record as InventoryItem;
      setItemName(i.name || "");
      setItemCategory(i.category || "General Goods");
      setItemUnitCost(i.unit_cost_price || 0);
      setItemUnitSelling(i.unit_selling_price || 0);
      setItemStockQty(i.current_stock_qty || 0);
      setItemReorderPoint(i.reorder_point || 2);
      setItemUnitOfMeasure(i.unit_of_measure || "units");
    } else if (type === "SUPPLIER") {
      const sup = record as Supplier;
      setSuppName(sup.name || "");
      setSuppNationalId(sup.national_id || sup.driver_national_id || "");
      setSuppGoodsSupplied(sup.goods_supplied || sup.category || "");
      setSuppCategory(sup.category || "Wholesale Distributor");
      setSuppPhone(sup.phone || "");
      setSuppContactPerson(sup.contact_person || "");
      setSuppPaymentTerms(sup.payment_terms || "CREDIT_7_DAYS");
      setSuppBankOrPaybill(sup.bank_or_paybill_details || "");
      setSuppBalanceOwed(sup.outstanding_balance_owed || 0);
      setSuppLocation(sup.location || "");
      setSuppNotes(sup.notes || "");
    } else if (type === "CUSTOMER") {
      const c = record as Customer;
      setCustName(c.name || "");
      setCustNationalId(c.national_id || "");
      setCustGoodsBought(c.goods_bought || "");
      setCustType(c.customer_type || "RETAIL_REGULAR");
      setCustPhone(c.phone || "");
      setCustCreditLimit(c.credit_limit || 1000);
      setCustOutstandingDeni(c.outstanding_credit_deni || 0);
      setCustLocation(c.location_or_estate || "");
      setCustPrefPayment(c.preferred_payment_method || "CREDIT_DENI");
      setCustTrustStatus(c.trust_status || "GOOD_STANDING");
      setCustNotes(c.notes || "");
    } else if (type === "BATCH") {
      const b = record as SupplyBatch;
      setBatchInitialQty(b.initial_qty || 0);
      setBatchRemainingQty(b.remaining_qty || 0);
      setBatchUnitCost(b.unit_cost_price || 0);
      setBatchUnitSelling(b.unit_selling_price || 0);
      setBatchDate(b.received_at || new Date().toISOString());
      setBatchNotes(b.notes || "");
    } else if (type === "FLOAT") {
      const f = record as DailyMorningFloatLog;
      setFloatDate(f.date || new Date().toISOString().split("T")[0]);
      setFloatTime(f.recorded_time || "05:57 AM");
      setFloatMpesa(f.mpesa_electronic_float ?? f.mpesa_opening_float ?? 0);
      setFloatEquity(f.equity_paybill_balance ?? f.equity_paybill_opening ?? 0);
      setFloatCash(f.cash_drawer_balance ?? f.cash_drawer_opening ?? 0);
      setFloatNotes(f.notes || "");
    }
  }, [record, type, isOpen]);

  if (!isOpen || !record) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "SALE") {
      const s = record as SalesLedgerEntry;
      const revenue = Number((saleQty * saleUnitSelling).toFixed(2));
      const cost = Number((saleQty * saleUnitCost).toFixed(2));
      const profit = Number((revenue - cost).toFixed(2));
      const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0;

      const updatedSale: SalesLedgerEntry = {
        ...s,
        qty_sold: Number(saleQty),
        unit_cost_price: Number(saleUnitCost),
        unit_selling_price: Number(saleUnitSelling),
        total_revenue: revenue,
        total_cost: cost,
        total_profit: profit,
        gross_margin_percent: margin,
        notes: saleNotes,
        created_at: saleDate,
        batch_end_date: saleDate,
      };
      onSave(updatedSale, "SALE");
    } else if (type === "EXPENSE") {
      const ex = record as MoneyOutExpense;
      const unitCost = expenseQty > 0 ? Number((expenseTotalCost / expenseQty).toFixed(2)) : ex.unit_cost_price;

      const updatedExpense: MoneyOutExpense = {
        ...ex,
        total_cost: Number(expenseTotalCost),
        qty_purchased: Number(expenseQty),
        unit_cost_price: unitCost,
        unit_selling_price: Number(expenseUnitSelling),
        supplier_name: expenseSupplier,
        category: expenseCategory as any,
        receipt_reference: expenseRef,
        notes: expenseNotes,
        created_at: expenseDate,
      };
      onSave(updatedExpense, "EXPENSE");
    } else if (type === "ITEM") {
      const it = record as InventoryItem;
      const updatedItem: InventoryItem = {
        ...it,
        name: itemName.trim(),
        category: itemCategory.trim() || "General Goods",
        unit_cost_price: Number(itemUnitCost) || 0,
        unit_selling_price: Number(itemUnitSelling) || 0,
        current_stock_qty: Number(itemStockQty) || 0,
        reorder_point: Number(itemReorderPoint) || 2,
        unit_of_measure: (itemUnitOfMeasure || "units") as any,
      };
      onSave(updatedItem, "ITEM");
    } else if (type === "SUPPLIER") {
      const sup = record as Supplier;
      const updatedSupplier: Supplier = {
        ...sup,
        name: suppName.trim(),
        national_id: suppNationalId.trim(),
        driver_national_id: suppNationalId.trim(),
        goods_supplied: suppGoodsSupplied.trim(),
        category: suppCategory.trim() || "Wholesale Distributor",
        phone: suppPhone.trim(),
        contact_person: suppContactPerson.trim(),
        payment_terms: suppPaymentTerms,
        bank_or_paybill_details: suppBankOrPaybill.trim(),
        outstanding_balance_owed: Number(suppBalanceOwed) || 0,
        location: suppLocation.trim(),
        notes: suppNotes.trim(),
      };
      onSave(updatedSupplier, "SUPPLIER");
    } else if (type === "CUSTOMER") {
      const cust = record as Customer;
      const updatedCust: Customer = {
        ...cust,
        name: custName.trim(),
        national_id: custNationalId.trim(),
        goods_bought: custGoodsBought.trim(),
        customer_type: custType,
        phone: custPhone.trim(),
        credit_limit: Number(custCreditLimit) || 0,
        outstanding_credit_deni: Number(custOutstandingDeni) || 0,
        location_or_estate: custLocation.trim(),
        preferred_payment_method: custPrefPayment,
        trust_status: custTrustStatus,
        notes: custNotes.trim(),
      };
      onSave(updatedCust, "CUSTOMER");
    } else if (type === "BATCH") {
      const bt = record as SupplyBatch;
      const updatedBatch: SupplyBatch = {
        ...bt,
        initial_qty: Number(batchInitialQty),
        remaining_qty: Number(batchRemainingQty),
        unit_cost_price: Number(batchUnitCost),
        unit_selling_price: Number(batchUnitSelling),
        received_at: batchDate,
        notes: batchNotes,
      };
      onSave(updatedBatch, "BATCH");
    } else if (type === "FLOAT") {
      const fl = record as DailyMorningFloatLog;
      const totalLiquid = Number(floatMpesa) + Number(floatEquity) + Number(floatCash);
      const updatedFloat: DailyMorningFloatLog = {
        ...fl,
        date: floatDate,
        recorded_time: floatTime,
        mpesa_electronic_float: Number(floatMpesa),
        mpesa_opening_float: Number(floatMpesa),
        equity_paybill_balance: Number(floatEquity),
        equity_paybill_opening: Number(floatEquity),
        cash_drawer_balance: Number(floatCash),
        cash_drawer_opening: Number(floatCash),
        total_morning_liquid: totalLiquid,
        total_opening_liquid: totalLiquid,
        notes: floatNotes,
      };
      onSave(updatedFloat, "FLOAT");
    }

    onClose();
  };

  const handleDelete = () => {
    if (!record) return;
    onDelete((record as any).id, type);
    onClose();
  };

  // Calculations for Item form
  const itemProfitPerUnit = Number(itemUnitSelling) - Number(itemUnitCost);
  const itemMarginPct =
    Number(itemUnitSelling) > 0
      ? ((itemProfitPerUnit / Number(itemUnitSelling)) * 100).toFixed(1)
      : "0";
  const itemTotalShelfVal = Number(itemStockQty) * Number(itemUnitSelling);

  return (
    <div
      id="edit-record-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm"
    >
      <div
        id="edit-record-modal-card"
        className="relative w-full max-w-xl bg-[#18181b] border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              {type === "SUPPLIER" ? (
                <Truck className="w-5 h-5 text-amber-400" />
              ) : type === "CUSTOMER" ? (
                <User className="w-5 h-5 text-cyan-400" />
              ) : type === "ITEM" ? (
                <Package className="w-5 h-5 text-emerald-400" />
              ) : (
                <Edit3 className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {type === "SALE" && "Edit Sales Ledger Entry"}
                {type === "EXPENSE" && "Edit Expense / Purchase Record"}
                {type === "ITEM" && "Key in Product Specifics (Buying & Selling Prices)"}
                {type === "SUPPLIER" && "Key in Supplier Specifics (National ID, Goods Supplied, Terms)"}
                {type === "CUSTOMER" && "Key in Customer Specifics (National ID, Goods Bought, Deni Limit)"}
                {type === "BATCH" && "Edit Supply Batch Details"}
                {type === "FLOAT" && "Edit 05:57 AM Morning Float Record"}
              </h2>
              <p className="text-xs text-slate-400">
                Update prices, national ID (OID), goods supplied/bought, and record specifics safely
              </p>
            </div>
          </div>
          <button
            id="close-edit-record-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* SALE FORM */}
          {type === "SALE" && (
            <>
              <EvidentialDatePicker
                id="edit-sale-evidential-date-picker"
                label="Sales Date & Evidential Time"
                sublabel="Exact timestamp when this sales batch concluded"
                value={saleDate}
                onChange={setSaleDate}
                accentColor="emerald"
              />

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <span className="text-slate-400 block text-[10px]">Item Being Edited:</span>
                <span className="text-sm font-bold text-white font-mono">
                  {(record as SalesLedgerEntry).item_name}
                </span>
                <span className="text-slate-500 text-[10px] block mt-0.5">
                  Batch #{(record as SalesLedgerEntry).batch_number}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Qty Sold</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={saleQty}
                    onChange={(e) => setSaleQty(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Buying Cost ({merchant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={saleUnitCost}
                    onChange={(e) => setSaleUnitCost(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">
                    Selling Price ({merchant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={saleUnitSelling}
                    onChange={(e) => setSaleUnitSelling(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-emerald-300 font-bold font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Revenue</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    +{merchant.currency} {(saleQty * saleUnitSelling).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Cost</span>
                  <span className="font-semibold text-slate-300 font-mono">
                    {merchant.currency} {(saleQty * saleUnitCost).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gross Profit</span>
                  <span className="font-bold text-teal-300 font-mono">
                    +{merchant.currency} {(saleQty * (saleUnitSelling - saleUnitCost)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correction Notes / Reason
                </label>
                <input
                  type="text"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="e.g. Corrected quantity sold count"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </>
          )}

          {/* EXPENSE FORM */}
          {type === "EXPENSE" && (
            <>
              <EvidentialDatePicker
                id="edit-expense-evidential-date-picker"
                label="Expense Date & Evidential Time"
                sublabel="Exact timestamp when this expense was paid"
                value={expenseDate}
                onChange={setExpenseDate}
                accentColor="emerald"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Paid ({merchant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={expenseTotalCost}
                    onChange={(e) => setExpenseTotalCost(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quantity (If inventory restock)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={expenseQty}
                    onChange={(e) => setExpenseQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supplier / Vendor
                  </label>
                  <input
                    type="text"
                    value={expenseSupplier}
                    onChange={(e) => setExpenseSupplier(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Receipt / M-Pesa Ref
                  </label>
                  <input
                    type="text"
                    value={expenseRef}
                    onChange={(e) => setExpenseRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Description
                </label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </>
          )}

          {/* ITEM FORM (PRODUCT SPECIFICS & BUYING/SELLING PRICES) */}
          {type === "ITEM" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Product / Commodity Name *
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Unga Hostess 2kg"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    placeholder="e.g. Flour & Grains, Dairy, Edibles"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Price specifics: Buying Price vs Selling Price */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pricing Specifics & Margins</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Unit Profit Meter</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1">
                      🛒 Buying Price / Wholesale Cost ({merchant.currency}) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={itemUnitCost}
                        onChange={(e) => setItemUnitCost(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Cost per unit paid to supplier/distributor
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-1">
                      🏷️ Selling Price / Retail Counter ({merchant.currency}) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={itemUnitSelling}
                        onChange={(e) => setItemUnitSelling(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-emerald-300 font-bold font-mono focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Price customer pays at the retail till
                    </span>
                  </div>
                </div>

                {/* Profit & Margin Calculation */}
                <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Unit Profit</span>
                    <span
                      className={`font-mono font-bold ${
                        itemProfitPerUnit >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {itemProfitPerUnit >= 0 ? "+" : ""}
                      {merchant.currency} {itemProfitPerUnit.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Gross Margin</span>
                    <span
                      className={`font-mono font-bold ${
                        Number(itemMarginPct) >= 15
                          ? "text-emerald-400"
                          : Number(itemMarginPct) > 0
                          ? "text-amber-300"
                          : "text-rose-400"
                      }`}
                    >
                      {itemMarginPct}%
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Shelf Value</span>
                    <span className="font-mono font-bold text-slate-200">
                      {merchant.currency} {itemTotalShelfVal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock count and packaging specifics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Shelf Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itemStockQty}
                    onChange={(e) => setItemStockQty(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={itemUnitOfMeasure}
                    onChange={(e) => setItemUnitOfMeasure(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="units">units (single items)</option>
                    <option value="packets">packets / pkts</option>
                    <option value="crates">crates</option>
                    <option value="bales">bales</option>
                    <option value="kg">kg (kilograms)</option>
                    <option value="bottles">bottles</option>
                    <option value="sachets">sachets</option>
                    <option value="boxes">boxes / cartons</option>
                    <option value="tins">tins</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={itemReorderPoint}
                    onChange={(e) => setItemReorderPoint(parseInt(e.target.value) || 2)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* SUPPLIER FORM (SPECIFICS: NATIONAL ID, GOODS SUPPLIED, TERMS) */}
          {type === "SUPPLIER" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supplier / Wholesaler Name *
                  </label>
                  <input
                    type="text"
                    value={suppName}
                    onChange={(e) => setSuppName(e.target.value)}
                    placeholder="e.g. Brookside Dairy, Unga Group, Lux House"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-indigo-300 mb-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>National ID / Owner ID (OID) / Driver ID</span>
                  </label>
                  <input
                    type="text"
                    value={suppNationalId}
                    onChange={(e) => setSuppNationalId(e.target.value)}
                    placeholder="e.g. 29481023 (Driver/Contact ID)"
                    className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-indigo-200 font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Goods Supplied Specifics */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Goods & Commodities Supplied *</span>
                </label>
                <input
                  type="text"
                  value={suppGoodsSupplied}
                  onChange={(e) => setSuppGoodsSupplied(e.target.value)}
                  placeholder="e.g. Fresh Milk 500ml, Yoghurt, Butter, Dairy products"
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Key in the products or wholesale lines delivered by this supplier
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category / Supply Domain
                  </label>
                  <input
                    type="text"
                    value={suppCategory}
                    onChange={(e) => setSuppCategory(e.target.value)}
                    placeholder="e.g. Dairy & Fresh, Flour Millers, Beverages"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone / M-Pesa Contact
                  </label>
                  <input
                    type="text"
                    value={suppPhone}
                    onChange={(e) => setSuppPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Terms & Grace Period
                  </label>
                  <select
                    value={suppPaymentTerms}
                    onChange={(e) => setSuppPaymentTerms(e.target.value as SupplierPaymentTerms)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="CASH_ON_DELIVERY">Cash On Delivery (COD)</option>
                    <option value="CREDIT_7_DAYS">7 Days Credit</option>
                    <option value="CREDIT_14_DAYS">14 Days Credit</option>
                    <option value="CREDIT_30_DAYS">30 Days Credit (Monthly)</option>
                    <option value="CONSIGNMENT">Consignment (Pay After Sale)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    M-Pesa Till / Paybill / Account No.
                  </label>
                  <input
                    type="text"
                    value={suppBankOrPaybill}
                    onChange={(e) => setSuppBankOrPaybill(e.target.value)}
                    placeholder="e.g. Till: 582910 or Paybill: 247247 Acc: 0100..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Person / Sales Rep
                  </label>
                  <input
                    type="text"
                    value={suppContactPerson}
                    onChange={(e) => setSuppContactPerson(e.target.value)}
                    placeholder="e.g. John Mwangi (Driver/Rep)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">
                    Outstanding Debt Balance ({merchant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={suppBalanceOwed}
                    onChange={(e) => setSuppBalanceOwed(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Delivery Notes / Depot Address
                </label>
                <input
                  type="text"
                  value={suppNotes}
                  onChange={(e) => setSuppNotes(e.target.value)}
                  placeholder="e.g. Delivers every Tuesday & Friday morning"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </>
          )}

          {/* CUSTOMER FORM (SPECIFICS: NATIONAL ID, GOODS BOUGHT, CREDIT LIMIT) */}
          {type === "CUSTOMER" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Mama Mary, James Boda, Hotel Safari"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-cyan-300 mb-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>National ID / KYC ID (OID) *</span>
                  </label>
                  <input
                    type="text"
                    value={custNationalId}
                    onChange={(e) => setCustNationalId(e.target.value)}
                    placeholder="e.g. 34819022 (Official ID)"
                    className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-3 py-2 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Crucial for credit ledger KYC and recovery
                  </span>
                </div>
              </div>

              {/* Goods Bought Specifics */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 mb-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Goods Regularly Purchased / Preferred Items *</span>
                </label>
                <input
                  type="text"
                  value={custGoodsBought}
                  onChange={(e) => setCustGoodsBought(e.target.value)}
                  placeholder="e.g. Bread, Milk 500ml, Sugar 1kg, Cooking Oil, Tea Leaves"
                  className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Key in the products he or she usually buys from your shop
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Customer Profile Type
                  </label>
                  <select
                    value={custType}
                    onChange={(e) => setCustType(e.target.value as CustomerType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="RETAIL_REGULAR">Retail Regular Resident</option>
                    <option value="MAMA_MBOGA">Mama Mboga / Vegetable Trader</option>
                    <option value="BODA_RIDER">Boda Boda Rider</option>
                    <option value="LOCAL_EATERY">Local Eatery / Hotel / Kibanda</option>
                    <option value="WHOLESALE_BUYER">Wholesale / Bulk Buyer</option>
                    <option value="NEIGHBORHOOD_RESIDENT">Neighborhood Resident</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone / M-Pesa Number
                  </label>
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. 0722001122"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Credit Limit / Max Deni ({merchant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={custCreditLimit}
                    onChange={(e) => setCustCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">
                    Current Outstanding Deni ({merchant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={custOutstandingDeni}
                    onChange={(e) => setCustOutstandingDeni(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-rose-500/30 rounded-lg px-3 py-2 text-xs text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Location / Estate
                  </label>
                  <input
                    type="text"
                    value={custLocation}
                    onChange={(e) => setCustLocation(e.target.value)}
                    placeholder="e.g. Plot 4, Green Estate"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preferred Payment
                  </label>
                  <select
                    value={custPrefPayment}
                    onChange={(e) =>
                      setCustPrefPayment(e.target.value as CustomerPaymentPreference)
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="CREDIT_DENI">Credit / Deni Tab</option>
                    <option value="CASH">Cash Drawer</option>
                    <option value="MPESA_TILL">M-Pesa Till</option>
                    <option value="EQUITY_PAYBILL">Equity Paybill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Trust Standing
                  </label>
                  <select
                    value={custTrustStatus}
                    onChange={(e) => setCustTrustStatus(e.target.value as CustomerTrustStatus)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="TRUSTED">Trusted (Punctual)</option>
                    <option value="GOOD_STANDING">Good Standing</option>
                    <option value="OVERDUE_DEBT">Overdue Debt</option>
                    <option value="BLOCKED_CREDIT">Blocked / Cut Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Notes & Aliases
                </label>
                <input
                  type="text"
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="e.g. Settles deni on end month"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </>
          )}

          {/* BATCH FORM */}
          {type === "BATCH" && (
            <>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <span className="text-slate-400 block text-[10px]">Batch Being Edited:</span>
                <span className="text-sm font-bold text-white font-mono">
                  {(record as SupplyBatch).item_name}
                </span>
                <span className="text-slate-500 text-[10px] block mt-0.5">
                  Batch #{(record as SupplyBatch).batch_number}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={batchInitialQty}
                    onChange={(e) => setBatchInitialQty(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Remaining Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={batchRemainingQty}
                    onChange={(e) => setBatchRemainingQty(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Batch Buying Unit Cost ({merchant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={batchUnitCost}
                    onChange={(e) => setBatchUnitCost(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">
                    Batch Selling Price ({merchant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={batchUnitSelling}
                    onChange={(e) => setBatchUnitSelling(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-emerald-300 font-bold font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Batch Remarks
                </label>
                <input
                  type="text"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </>
          )}

          {/* FLOAT FORM */}
          {type === "FLOAT" && (
            <>
              <EvidentialDatePicker
                id="edit-float-evidential-date-picker"
                label="Float Audit Date & Evidential Time"
                sublabel="Exact timestamp when this opening liquid count was taken"
                value={floatDate}
                onChange={setFloatDate}
                accentColor="emerald"
              />

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  3 Liquid Account Balances
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>M-Pesa Till: 994270 ({merchant.currency})</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={floatMpesa}
                      onChange={(e) => setFloatMpesa(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-1">
                      <Landmark className="w-3.5 h-3.5" />
                      <span>Equity Paybill ({merchant.currency})</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={floatEquity}
                      onChange={(e) => setFloatEquity(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full bg-slate-900 border border-rose-500/30 rounded-lg px-3 py-2 text-xs text-rose-200 font-mono font-bold focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>Cash Drawer ({merchant.currency})</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={floatCash}
                      onChange={(e) => setFloatCash(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full bg-slate-900 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">
                    Total Morning Liquid Float:
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-300">
                    {merchant.currency}{" "}
                    {(
                      Number(floatMpesa) +
                      Number(floatEquity) +
                      Number(floatCash)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Audit Notes / Remarks
                </label>
                <input
                  type="text"
                  value={floatNotes}
                  onChange={(e) => setFloatNotes(e.target.value)}
                  placeholder="e.g. Verified opening counts"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Delete confirmation section */}
          {confirmDelete ? (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg space-y-2 text-xs">
              <div className="flex items-center gap-2 text-red-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Confirm Permanent Deletion?</span>
              </div>
              <p className="text-[11px] text-slate-400">
                This will delete this record from your shop database.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors cursor-pointer"
                >
                  Yes, Delete Record
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 transition-colors border border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-edited-record-btn"
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
