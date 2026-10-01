import React, { useState, useMemo } from "react";
import {
  Users,
  User,
  Truck,
  UserCheck,
  Plus,
  Search,
  Filter,
  DollarSign,
  Landmark,
  Smartphone,
  Coins,
  CreditCard,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Phone,
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building,
  Package,
  Trash2,
  X,
  Sparkles,
  FileText,
  RefreshCw,
  Crown,
  Tag,
} from "lucide-react";
import {
  Merchant,
  Supplier,
  SupplierDelivery,
  SupplierPayment,
  Customer,
  CustomerSale,
  CustomerDebtRepayment,
  InventoryItem,
} from "../types";
import { SearchableItemPicker } from "./SearchableItemPicker";
import { SearchableCustomerPicker } from "./SearchableCustomerPicker";
import { SearchableSupplierPicker } from "./SearchableSupplierPicker";
import { EvidentialDatePicker } from "./EvidentialDatePicker";
import { AppStorage } from "../services/storage";
import { MergeEntitiesModal } from "./MergeEntitiesModal";
import { AccountingEngine } from "../services/accountingEngine";
import { EditRecordModal, EditableRecordType } from "./EditRecordModal";
import { Edit3, ShoppingBag } from "lucide-react";

interface PeopleLedgerViewProps {
  merchant: Merchant;
  suppliers: Supplier[];
  supplierDeliveries: SupplierDelivery[];
  supplierPayments: SupplierPayment[];
  customers: Customer[];
  customerSales: CustomerSale[];
  customerRepayments: CustomerDebtRepayment[];
  inventoryItems: InventoryItem[];
  onAddSupplier: (supplier: Supplier) => void;
  onAddSupplierDelivery: (delivery: SupplierDelivery) => void;
  onAddSupplierPayment: (payment: SupplierPayment) => void;
  onAddCustomer: (customer: Customer) => void;
  onAddCustomerSale: (sale: CustomerSale) => void;
  onAddCustomerRepayment: (repayment: CustomerDebtRepayment) => void;
  onRefreshData?: () => void;
}

export const PeopleLedgerView: React.FC<PeopleLedgerViewProps> = ({
  merchant,
  suppliers,
  supplierDeliveries,
  supplierPayments,
  customers,
  customerSales,
  customerRepayments,
  inventoryItems,
  onAddSupplier,
  onAddSupplierDelivery,
  onAddSupplierPayment,
  onAddCustomer,
  onAddCustomerSale,
  onAddCustomerRepayment,
  onRefreshData,
}) => {
  // Main view toggle: 'suppliers' or 'customers'
  const [activeSubTab, setActiveSubTab] = useState<"suppliers" | "customers">("suppliers");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  // Modals state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showMultiItemDeliveryModal, setShowMultiItemDeliveryModal] = useState(false);
  const [showPaySupplierModal, setShowPaySupplierModal] = useState(false);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null);
  const [selectedSupplierForStatement, setSelectedSupplierForStatement] = useState<Supplier | null>(null);

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showCustomerSaleModal, setShowCustomerSaleModal] = useState(false);
  const [showRepayDeniModal, setShowRepayDeniModal] = useState(false);
  const [selectedCustomerForRepay, setSelectedCustomerForRepay] = useState<Customer | null>(null);

  // Merge / Duplicate state
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [mergeEntityType, setMergeEntityType] = useState<"SUPPLIER" | "CUSTOMER">("SUPPLIER");
  const [mergePrimaryId, setMergePrimaryId] = useState<string>("");
  const [mergeDuplicateId, setMergeDuplicateId] = useState<string>("");
  const [mergeToastMessage, setMergeToastMessage] = useState<string | null>(null);

  // Edit Record Modal state for Supplier / Customer specifics (OID, Goods, Prices, Terms)
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<Supplier | Customer | null>(null);
  const [editingType, setEditingType] = useState<EditableRecordType>("SUPPLIER");

  const handleOpenEditSupplier = (supplier: Supplier) => {
    setEditingRecord(supplier);
    setEditingType("SUPPLIER");
    setShowEditModal(true);
  };

  const handleOpenEditCustomer = (customer: Customer) => {
    setEditingRecord(customer);
    setEditingType("CUSTOMER");
    setShowEditModal(true);
  };

  const handleSaveEditRecord = (updatedRecord: any, type: EditableRecordType) => {
    if (type === "SUPPLIER") {
      AppStorage.updateSupplier(updatedRecord as Supplier);
      setMergeToastMessage(`Updated specifics for supplier "${updatedRecord.name}".`);
    } else if (type === "CUSTOMER") {
      AppStorage.updateCustomer(updatedRecord as Customer);
      setMergeToastMessage(`Updated specifics for customer "${updatedRecord.name}".`);
    }
    if (onRefreshData) onRefreshData();
    setTimeout(() => setMergeToastMessage(null), 4000);
  };

  const handleDeleteEditRecord = (id: string, type: EditableRecordType) => {
    if (type === "SUPPLIER") {
      AppStorage.deleteSupplier(id);
      setMergeToastMessage(`Deleted supplier record.`);
    } else if (type === "CUSTOMER") {
      AppStorage.deleteCustomer(id);
      setMergeToastMessage(`Deleted customer record.`);
    }
    if (onRefreshData) onRefreshData();
    setTimeout(() => setMergeToastMessage(null), 4000);
  };

  // Automatically find duplicate profiles
  const duplicateSuppliers = React.useMemo(() => {
    return AppStorage.findDuplicateSuppliers();
  }, [suppliers]);

  const duplicateCustomers = React.useMemo(() => {
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
      setMergeToastMessage(`Auto-merged ${total} typo profiles (${res.mergedSuppliersCount} suppliers, ${res.mergedCustomersCount} customers) into master accounts!`);
    } else {
      setMergeToastMessage(`All profiles are clean and unified. No duplicate typos found.`);
    }
    setTimeout(() => setMergeToastMessage(null), 5000);
  };

  const handleResyncDrops = () => {
    const res = AppStorage.syncSuppliersFromAllSources();
    if (onRefreshData) onRefreshData();
    setMergeToastMessage(`Synchronized all supply sources: verified ${res.suppliersCount} suppliers and ${res.deliveriesCount} delivery consignments!`);
    setTimeout(() => setMergeToastMessage(null), 5000);
  };

  // Expanded card state for delivery details
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  // Aggregated KPIs
  const totalOwedToSuppliers = suppliers.reduce((acc, s) => acc + s.outstanding_balance_owed, 0);
  const totalDeniOwedByCustomers = customers.reduce((acc, c) => acc + c.outstanding_credit_deni, 0);
  const suppliersWithDebtCount = suppliers.filter((s) => s.outstanding_balance_owed > 0).length;
  const customersWithDeniCount = customers.filter((c) => c.outstanding_credit_deni > 0).length;

  // Filtered lists
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(searchQuery) ||
      (s.national_id && s.national_id.toLowerCase().includes(q)) ||
      s.category.toLowerCase().includes(q) ||
      (s.aliases && s.aliases.some((a) => a.toLowerCase().includes(q)));
    const matchesDebt = filterDebtOnly ? s.outstanding_balance_owed > 0 : true;
    return matchesSearch && matchesDebt;
  });

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(searchQuery) ||
      (c.national_id && c.national_id.toLowerCase().includes(q)) ||
      c.customer_type.toLowerCase().includes(q) ||
      (c.aliases && c.aliases.some((a) => a.toLowerCase().includes(q)));
    const matchesDebt = filterDebtOnly ? c.outstanding_credit_deni > 0 : true;
    return matchesSearch && matchesDebt;
  });

  // --- SUB-FORMS STATE: Multi-Item Delivery ---
  const [deliverySupplierId, setDeliverySupplierId] = useState("");
  const [deliveryInvoiceNote, setDeliveryInvoiceNote] = useState("");
  const [deliveryTimestamp, setDeliveryTimestamp] = useState(new Date().toISOString());

  const selectedDeliverySupplier =
    suppliers.find((s) => s.id === deliverySupplierId) || null;
  const [deliveryLines, setDeliveryLines] = useState<
    Array<{
      itemId: string;
      itemName: string;
      qty: number;
      unitCost: number;
      unitSelling: number;
      unitMeasure: string;
    }>
  >([
    {
      itemId: "",
      itemName: "",
      qty: 1,
      unitCost: 0,
      unitSelling: 0,
      unitMeasure: "units",
    },
  ]);
  const [deliveryPaymentMode, setDeliveryPaymentMode] = useState<
    "EQUITY_PAYBILL" | "MPESA_TILL" | "CASH" | "CREDIT_UNPAID" | "SPLIT"
  >("SPLIT");
  const [deliveryAmountPaid, setDeliveryAmountPaid] = useState<number>(0);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const deliveryTotal = deliveryLines.reduce((acc, l) => acc + l.qty * l.unitCost, 0);
  const deliveryBalanceRemaining = Math.max(0, deliveryTotal - (Number(deliveryAmountPaid) || 0));

  const handleAddDeliveryLine = () => {
    setDeliveryLines([
      ...deliveryLines,
      {
        itemId: "",
        itemName: "",
        qty: 1,
        unitCost: 0,
        unitSelling: 0,
        unitMeasure: "units",
      },
    ]);
  };

  const handleRemoveDeliveryLine = (index: number) => {
    if (deliveryLines.length <= 1) return;
    setDeliveryLines(deliveryLines.filter((_, idx) => idx !== index));
  };

  const handleDeliveryLineChange = (
    index: number,
    field: "itemId" | "itemName" | "qty" | "unitCost" | "unitSelling" | "unitMeasure",
    value: any
  ) => {
    const updated = [...deliveryLines];
    if (field === "itemId") {
      if (!value) {
        updated[index].itemId = "";
        updated[index].itemName = "";
        updated[index].unitCost = 0;
        updated[index].unitSelling = 0;
        updated[index].unitMeasure = "units";
      } else {
        const selected = inventoryItems.find((i) => i.id === value);
        if (selected) {
          updated[index].itemId = selected.id;
          updated[index].itemName = selected.name;
          updated[index].unitCost = selected.unit_cost_price;
          updated[index].unitSelling = selected.unit_selling_price;
          updated[index].unitMeasure = selected.unit_of_measure;
        }
      }
    } else {
      updated[index][field] = value;
    }
    setDeliveryLines(updated);
  };

  const handleSubmitMultiItemDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const supp = suppliers.find((s) => s.id === deliverySupplierId);
    if (!supp) return;

    const deliveryItems = deliveryLines.map((l) => ({
      item_id: l.itemId,
      item_name: l.itemName,
      qty: Number(l.qty),
      unit_of_measure: l.unitMeasure,
      unit_cost_price: Number(l.unitCost),
      unit_selling_price: Number(l.unitSelling),
      subtotal: Number(l.qty) * Number(l.unitCost),
    }));

    const paid = deliveryPaymentMode === "CREDIT_UNPAID" ? 0 : Number(deliveryAmountPaid);
    const balance = Math.max(0, deliveryTotal - paid);

    const newDelivery: SupplierDelivery = {
      id: `deliv-${Date.now()}`,
      merchant_id: merchant.id,
      supplier_id: supp.id,
      supplier_name: supp.name,
      delivery_date: deliveryTimestamp.split("T")[0],
      invoice_or_delivery_note: deliveryInvoiceNote || `DROP-${Date.now().toString().slice(-4)}`,
      items: deliveryItems,
      total_amount: deliveryTotal,
      amount_paid: paid,
      balance_remaining: balance,
      payment_channel: deliveryPaymentMode,
      status: balance === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID_CREDIT",
      notes: deliveryNotes,
      created_at: deliveryTimestamp,
    };

    onAddSupplierDelivery(newDelivery);
    setShowMultiItemDeliveryModal(false);
    setDeliverySupplierId("");
    // Reset form
    setDeliveryLines([
      {
        itemId: "",
        itemName: "",
        qty: 1,
        unitCost: 0,
        unitSelling: 0,
        unitMeasure: "units",
      },
    ]);
    setDeliveryNotes("");
    setDeliveryAmountPaid(0);
    setDeliveryTimestamp(new Date().toISOString());
  };

  // --- SUB-FORMS STATE: Pay Supplier Debt ---
  const [paySupplierAmount, setPaySupplierAmount] = useState<number>(0);
  const [paySupplierChannel, setPaySupplierChannel] = useState<
    "EQUITY_PAYBILL" | "MPESA_TILL" | "CASH" | "BANK_TRANSFER"
  >("EQUITY_PAYBILL");
  const [paySupplierRef, setPaySupplierRef] = useState("");
  const [paySupplierNotes, setPaySupplierNotes] = useState("");
  const [paySupplierTimestamp, setPaySupplierTimestamp] = useState(new Date().toISOString());

  const handleOpenPaySupplier = (supplier: Supplier) => {
    setSelectedSupplierForPay(supplier);
    setPaySupplierAmount(supplier.outstanding_balance_owed);
    setPaySupplierRef(`EQ-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaySupplierTimestamp(new Date().toISOString());
    setShowPaySupplierModal(true);
  };

  const handleSubmitPaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPay || paySupplierAmount <= 0) return;

    const payment: SupplierPayment = {
      id: `spay-${Date.now()}`,
      merchant_id: merchant.id,
      supplier_id: selectedSupplierForPay.id,
      supplier_name: selectedSupplierForPay.name,
      amount: Number(paySupplierAmount),
      payment_channel: paySupplierChannel,
      reference: paySupplierRef,
      date: paySupplierTimestamp.split("T")[0],
      notes: paySupplierNotes,
      created_at: paySupplierTimestamp,
    };

    onAddSupplierPayment(payment);
    setShowPaySupplierModal(false);
    setSelectedSupplierForPay(null);
    setPaySupplierTimestamp(new Date().toISOString());
  };

  // --- SUB-FORMS STATE: Customer Sale / Deni ---
  const [saleCustomerId, setSaleCustomerId] = useState("");
  const [saleTimestamp, setSaleTimestamp] = useState(new Date().toISOString());

  // Compute dynamic customer rankings mapping using AccountingEngine
  const customerRankingsMap = useMemo(() => {
    const rankings = AccountingEngine.rankCustomers(
      customers,
      customerSales,
      customerRepayments
    );
    return new Map(rankings.map((r) => [r.customer.id, r]));
  }, [customers, customerSales, customerRepayments]);

  const selectedSaleCustomer =
    customers.find((c) => c.id === saleCustomerId) || null;
  const [saleLines, setSaleLines] = useState<
    Array<{
      itemId: string;
      itemName: string;
      qty: number;
      unitPrice: number;
      isCustom?: boolean;
    }>
  >([
    {
      itemId: "",
      itemName: "",
      qty: 1,
      unitPrice: 0,
      isCustom: false,
    },
  ]);
  const [salePaymentMode, setSalePaymentMode] = useState<
    "CASH" | "EQUITY_PAYBILL" | "MPESA_TILL" | "CREDIT_DENI" | "SPLIT"
  >("CREDIT_DENI");
  const [saleAmountPaid, setSaleAmountPaid] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState("");

  const saleTotal = saleLines.reduce((acc, l) => acc + l.qty * l.unitPrice, 0);
  const saleDeniAdded =
    salePaymentMode === "CREDIT_DENI"
      ? saleTotal
      : salePaymentMode === "SPLIT"
      ? Math.max(0, saleTotal - (Number(saleAmountPaid) || 0))
      : 0;

  const handleAddSaleLine = () => {
    setSaleLines([
      ...saleLines,
      {
        itemId: "",
        itemName: "",
        qty: 1,
        unitPrice: 0,
        isCustom: false,
      },
    ]);
  };

  const handleRemoveSaleLine = (index: number) => {
    if (saleLines.length <= 1) return;
    setSaleLines(saleLines.filter((_, idx) => idx !== index));
  };

  const handleSaleLineChange = (
    index: number,
    field: "itemId" | "itemName" | "qty" | "unitPrice" | "isCustom",
    value: any
  ) => {
    const updated = [...saleLines];
    if (field === "itemId") {
      if (!value) {
        updated[index].itemId = "";
        updated[index].itemName = "";
        updated[index].unitPrice = 0;
      } else {
        const selected = inventoryItems.find((i) => i.id === value);
        if (selected) {
          updated[index].itemId = selected.id;
          updated[index].itemName = selected.name;
          updated[index].unitPrice = selected.unit_selling_price;
          updated[index].isCustom = false;
        }
      }
    } else if (field === "isCustom") {
      updated[index].isCustom = value;
      if (value) {
        updated[index].itemId = `unlisted-${Date.now()}-${index}`;
        if (!updated[index].itemName || updated[index].itemName === "Item") {
          updated[index].itemName = "Unlisted Stock Item";
        }
      } else {
        updated[index].itemId = "";
        updated[index].itemName = "";
        updated[index].unitPrice = 0;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setSaleLines(updated);
  };

  const handleSubmitCustomerSale = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === saleCustomerId);
    if (!cust) return;

    const items = saleLines.map((l) => ({
      item_id: l.itemId,
      item_name: l.itemName || "Item",
      qty: Number(l.qty) || 1,
      unit_selling_price: Number(l.unitPrice) || 0,
      subtotal: (Number(l.qty) || 1) * (Number(l.unitPrice) || 0),
    }));

    const paid =
      salePaymentMode === "CREDIT_DENI"
        ? 0
        : salePaymentMode === "SPLIT"
        ? Number(saleAmountPaid)
        : saleTotal;

    const deni =
      salePaymentMode === "CREDIT_DENI"
        ? saleTotal
        : salePaymentMode === "SPLIT"
        ? Math.max(0, saleTotal - paid)
        : 0;

    const newSale: CustomerSale = {
      id: `csale-${Date.now()}`,
      merchant_id: merchant.id,
      customer_id: cust.id,
      customer_name: cust.name,
      customer_phone: cust.phone,
      date: saleTimestamp.split("T")[0],
      items,
      total_amount: saleTotal,
      amount_paid: paid,
      payment_channel: salePaymentMode,
      deni_added: deni,
      status: deni === 0 ? "SETTLED" : paid > 0 ? "PARTIAL_DENI" : "FULL_DENI",
      notes: saleNotes,
      created_at: saleTimestamp,
    };

    onAddCustomerSale(newSale);
    setShowCustomerSaleModal(false);
    setSaleCustomerId("");
    setSaleLines([
      {
        itemId: "",
        itemName: "",
        qty: 1,
        unitPrice: 0,
        isCustom: false,
      },
    ]);
    setSaleNotes("");
    setSaleAmountPaid(0);
    setSaleTimestamp(new Date().toISOString());
  };

  // --- SUB-FORMS STATE: Repay Customer Deni ---
  const [repayDeniAmount, setRepayDeniAmount] = useState<number>(0);
  const [repayDeniChannel, setRepayDeniChannel] = useState<"CASH" | "EQUITY_PAYBILL" | "MPESA_TILL">(
    "MPESA_TILL"
  );
  const [repayDeniRef, setRepayDeniRef] = useState("");
  const [repayDeniNotes, setRepayDeniNotes] = useState("");
  const [repayDeniTimestamp, setRepayDeniTimestamp] = useState(new Date().toISOString());

  const handleOpenRepayDeni = (customer: Customer) => {
    setSelectedCustomerForRepay(customer);
    setRepayDeniAmount(customer.outstanding_credit_deni);
    setRepayDeniRef(`RCP-${Math.floor(1000 + Math.random() * 9000)}`);
    setRepayDeniTimestamp(new Date().toISOString());
    setShowRepayDeniModal(true);
  };

  const handleSubmitRepayDeni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForRepay || repayDeniAmount <= 0) return;

    const repayment: CustomerDebtRepayment = {
      id: `crepay-${Date.now()}`,
      merchant_id: merchant.id,
      customer_id: selectedCustomerForRepay.id,
      customer_name: selectedCustomerForRepay.name,
      amount_paid: Number(repayDeniAmount),
      payment_channel: repayDeniChannel,
      reference: repayDeniRef,
      date: repayDeniTimestamp.split("T")[0],
      notes: repayDeniNotes,
      created_at: repayDeniTimestamp,
    };

    onAddCustomerRepayment(repayment);
    setShowRepayDeniModal(false);
    setSelectedCustomerForRepay(null);
    setRepayDeniTimestamp(new Date().toISOString());
  };

  // --- NEW SUPPLIER MODAL STATE ---
  const [newSuppName, setNewSuppName] = useState("");
  const [newSuppPhone, setNewSuppPhone] = useState("+254 ");
  const [newSuppNationalId, setNewSuppNationalId] = useState("");
  const [newSuppContact, setNewSuppContact] = useState("");
  const [newSuppCategory, setNewSuppCategory] = useState("Dairy & Fresh");
  const [newSuppLocation, setNewSuppLocation] = useState("");
  const [newSuppPayDetails, setNewSuppPayDetails] = useState("Equity Paybill 247247");
  const [newSuppTerms, setNewSuppTerms] = useState<
    "CASH_ON_DELIVERY" | "CREDIT_7_DAYS" | "CREDIT_14_DAYS" | "CREDIT_30_DAYS"
  >("CREDIT_7_DAYS");

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppName) return;

    const supplier: Supplier = {
      id: `supp-${Date.now()}`,
      merchant_id: merchant.id,
      name: newSuppName,
      phone: newSuppPhone,
      national_id: newSuppNationalId.trim() || undefined,
      contact_person: newSuppContact,
      category: newSuppCategory,
      location: newSuppLocation,
      payment_terms: newSuppTerms,
      total_supplied_value: 0,
      total_paid_value: 0,
      outstanding_balance_owed: 0,
      bank_or_paybill_details: newSuppPayDetails,
      created_at: new Date().toISOString(),
    };

    onAddSupplier(supplier);
    setShowAddSupplierModal(false);
    setNewSuppName("");
    setNewSuppPhone("+254 ");
    setNewSuppNationalId("");
    setNewSuppContact("");
  };

  // --- NEW CUSTOMER MODAL STATE ---
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("+254 ");
  const [newCustNationalId, setNewCustNationalId] = useState("");
  const [newCustType, setNewCustType] = useState<
    | "RETAIL_REGULAR"
    | "MAMA_MBOGA"
    | "BODA_RIDER"
    | "LOCAL_EATERY"
    | "WHOLESALE_BUYER"
    | "NEIGHBORHOOD_RESIDENT"
  >("NEIGHBORHOOD_RESIDENT");
  const [newCustLocation, setNewCustLocation] = useState("");
  const [newCustLimit, setNewCustLimit] = useState<number>(2000);
  const [newCustPref, setNewCustPref] = useState<"CASH" | "EQUITY_PAYBILL" | "MPESA_TILL" | "CREDIT_DENI">(
    "CREDIT_DENI"
  );
  const [newCustHistoricalDeni, setNewCustHistoricalDeni] = useState<number>(0);
  const [newCustHistoricalDate, setNewCustHistoricalDate] = useState<string>("");
  const [newCustNotes, setNewCustNotes] = useState<string>("");

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    const openingDeni = Number(newCustHistoricalDeni) || 0;
    const defaultPastDate = new Date(Date.now() - 32 * 86400000).toISOString().split("T")[0];

    const customer: Customer = {
      id: `cust-${Date.now()}`,
      merchant_id: merchant.id,
      name: newCustName,
      phone: newCustPhone,
      national_id: newCustNationalId.trim() || undefined,
      customer_type: newCustType,
      location_or_estate: newCustLocation,
      credit_limit: Number(newCustLimit),
      outstanding_credit_deni: openingDeni,
      historical_opening_deni: openingDeni > 0 ? openingDeni : undefined,
      historical_deni_date: openingDeni > 0 ? (newCustHistoricalDate || defaultPastDate) : undefined,
      lifetime_purchases_value: openingDeni,
      lifetime_payments_value: 0,
      trust_status: openingDeni > 0 ? "GOOD_STANDING" : "TRUSTED",
      preferred_payment_method: newCustPref,
      notes: newCustNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    onAddCustomer(customer);
    setShowAddCustomerModal(false);
    setNewCustName("");
    setNewCustPhone("+254 ");
    setNewCustNationalId("");
    setNewCustLocation("");
    setNewCustHistoricalDeni(0);
    setNewCustHistoricalDate("");
    setNewCustNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span>People Ledger: Suppliers & Customers</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-item supplier deliveries, money owed to distributors, and customer sales across Cash, Paybill, M-Pesa & Credit tabs.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResyncDrops}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition-colors cursor-pointer"
            title="Scan past batches and receipts to guarantee all supplier consignments are linked"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Supply Drops</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenMerge(activeSubTab === "suppliers" ? "SUPPLIER" : "CUSTOMER")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-xs font-semibold text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            title="Merge duplicate supplier/customer accounts caused by typos during rush hours"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Merge Profiles</span>
          </button>

          {activeSubTab === "suppliers" ? (
            <>
              <button
                id="btn-open-multi-delivery-modal"
                onClick={() => setShowMultiItemDeliveryModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Receive Multi-Item Delivery</span>
              </button>
              <button
                id="btn-open-add-supplier-modal"
                onClick={() => setShowAddSupplierModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Supplier</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-open-customer-sale-modal"
                onClick={() => setShowCustomerSaleModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-950 transition-all cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Log Sale / Credit</span>
              </button>
              <button
                id="btn-open-add-customer-modal"
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Customer</span>
              </button>
            </>
          )}
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
                  ) can create separate records. Merge them now to combine all supply batches, receipts, and accounts payable into one unified balance.
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

      {/* Primary KPI Balance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Money We Owe Suppliers (Accounts Payable) */}
        <div className="p-4 rounded-xl bg-[#18181b] border border-amber-900/40 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Money Owed to Suppliers
            </span>
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {merchant.currency} {totalOwedToSuppliers.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across <strong>{suppliersWithDebtCount}</strong> distributor drops on credit terms
          </p>
        </div>

        {/* Customer Credit (Accounts Receivable) */}
        <div className="p-4 rounded-xl bg-[#18181b] border border-rose-900/40 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              Customer Credit (Owed)
            </span>
            <span className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {merchant.currency} {totalDeniOwedByCustomers.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Owed by <strong>{customersWithDeniCount}</strong> neighborhood customers & regulars
          </p>
        </div>

        {/* Total Registered Suppliers */}
        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Suppliers & Wholesalers
            </span>
            <span className="p-1.5 rounded-md bg-slate-800 text-slate-300">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {suppliers.length}
            </span>
            <span className="text-xs text-slate-500">active partners</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dairy, grain millers, edible oil & poultry depots
          </p>
        </div>

        {/* Total Registered Customers */}
        <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Customers & Regulars
            </span>
            <span className="p-1.5 rounded-md bg-slate-800 text-slate-300">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {customers.length}
            </span>
            <span className="text-xs text-slate-500">registered</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Retail, vendors, eateries & delivery riders
          </p>
        </div>
      </div>

      {/* Navigation Switch & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-[#18181b] border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            id="tab-btn-suppliers"
            onClick={() => {
              setActiveSubTab("suppliers");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeSubTab === "suppliers"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Suppliers ({suppliers.length})</span>
            {totalOwedToSuppliers > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                {merchant.currency} {totalOwedToSuppliers.toLocaleString()}
              </span>
            )}
          </button>

          <button
            id="tab-btn-customers"
            onClick={() => {
              setActiveSubTab("customers");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeSubTab === "customers"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Customers & Credit ({customers.length})</span>
            {totalDeniOwedByCustomers > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                {merchant.currency} {totalDeniOwedByCustomers.toLocaleString()}
              </span>
            )}
          </button>
        </div>

        {/* Search & Debt Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeSubTab === "suppliers" ? "Search suppliers or categories..." : "Search customers or phone..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-56 sm:w-64"
            />
          </div>

          <button
            onClick={() => setFilterDebtOnly(!filterDebtOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filterDebtOnly
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>{activeSubTab === "suppliers" ? "We Owe Money" : "Has Debt"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUPPLIERS VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === "suppliers" && (
        <div className="space-y-6">
          {/* Supplier Directory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className={`p-4 rounded-xl bg-[#18181b] border transition-all ${
                  supplier.outstanding_balance_owed > 0
                    ? "border-amber-900/50 shadow-amber-950/20 shadow-lg"
                    : "border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{supplier.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {supplier.category}
                      </span>
                      {supplier.aliases && supplier.aliases.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {supplier.aliases.map((alias, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60"
                              title={`Merged alias / nickname: ${alias}`}
                            >
                              AKA: {alias}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {supplier.contact_person && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Contact: {supplier.contact_person}
                      </p>
                    )}

                    {/* Goods / Commodities Supplied Specifics */}
                    {(supplier.goods_supplied || supplier.category) && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-300/90 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">
                        <Package className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-[11px] font-medium truncate">
                          Supplies: {supplier.goods_supplied || supplier.category}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {supplier.phone}
                      </span>
                      {(supplier.national_id || supplier.driver_national_id) && (
                        <span className="flex items-center gap-1 font-mono text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]" title="Owner National ID (OID) / Driver ID">
                          <CreditCard className="w-3 h-3 text-indigo-400" />
                          OID: {supplier.national_id || supplier.driver_national_id}
                        </span>
                      )}
                      {supplier.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {supplier.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Balance / Action Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Balance Owed
                    </span>
                    <span
                      className={`text-base font-bold font-mono ${
                        supplier.outstanding_balance_owed > 0
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {merchant.currency} {supplier.outstanding_balance_owed.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Terms and Paybill details */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-300">Terms:</span>{" "}
                    {supplier.payment_terms.replace(/_/g, " ")} •{" "}
                    <span className="font-semibold text-slate-300">Details:</span>{" "}
                    {supplier.bank_or_paybill_details || "N/A"}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      id={`btn-edit-supp-${supplier.id}`}
                      type="button"
                      onClick={() => handleOpenEditSupplier(supplier)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      title="Edit supplier specifics (OID, Goods Supplied, Payment terms, M-Pesa details)"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Specifics</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenMerge("SUPPLIER", supplier.id)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      title="Merge duplicate supplier account"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Merge Profile</span>
                    </button>

                    <button
                      id={`btn-statement-supp-${supplier.id}`}
                      type="button"
                      onClick={() => setSelectedSupplierForStatement(supplier)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>View Ledger Statement</span>
                    </button>

                    {/* Settle Debt Button */}
                    {supplier.outstanding_balance_owed > 0 && (
                      <button
                        id={`btn-pay-supp-${supplier.id}`}
                        onClick={() => handleOpenPaySupplier(supplier)}
                        className="flex items-center justify-center gap-1 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Landmark className="w-3 h-3" />
                        <span>Settle Debt ({merchant.currency} {supplier.outstanding_balance_owed.toLocaleString()})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Supplier Multi-Item Deliveries History */}
          <div className="p-5 rounded-xl bg-[#18181b] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Recent Multi-Item Supply Drops & Deliveries</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full itemized breakdown of products delivered per distributor consignment
                </p>
              </div>
              <button
                onClick={() => setShowMultiItemDeliveryModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New Multi-Item Drop</span>
              </button>
            </div>

            <div className="space-y-3">
              {supplierDeliveries.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
                  <Package className="w-10 h-10 text-slate-600 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">No Supplier Deliveries Recorded Yet</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Deliveries are automatically generated from ingested receipts, restock consignments, and wholesale bills.
                    </p>
                  </div>
                </div>
              ) : (
                supplierDeliveries.map((delivery) => {
                  const isExpanded = expandedDeliveryId === delivery.id;
                  return (
                    <div
                      key={delivery.id}
                      className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setExpandedDeliveryId(isExpanded ? null : delivery.id)}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {delivery.supplier_name}
                              </span>
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {delivery.invoice_or_delivery_note || "Delivery Note"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {delivery.delivery_date} • {delivery.items.length} item(s) delivered
                            </p>
                          </div>
                        </div>

                        {/* Financial status of this drop */}
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Total Cost</span>
                            <span className="text-white font-bold">
                              {merchant.currency} {delivery.total_amount.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Paid Now</span>
                            <span className="text-emerald-400 font-bold">
                              {merchant.currency} {delivery.amount_paid.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Debt Owed</span>
                            <span
                              className={`font-bold ${
                                delivery.balance_remaining > 0 ? "text-amber-400" : "text-slate-400"
                              }`}
                            >
                              {merchant.currency} {delivery.balance_remaining.toLocaleString()}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider border ${
                              delivery.status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : delivery.status === "PARTIALLY_PAID"
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                            }`}
                          >
                            {delivery.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      {/* Expandable item table */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-800">
                          <table className="w-full text-xs text-left text-slate-300">
                            <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950/60">
                              <tr>
                                <th className="p-2">Item Delivered</th>
                                <th className="p-2 text-right">Quantity</th>
                                <th className="p-2 text-right">Unit Cost</th>
                                <th className="p-2 text-right">Selling Price</th>
                                <th className="p-2 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                              {delivery.items.map((line, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30">
                                  <td className="p-2 font-sans font-medium text-white">
                                    {line.item_name}
                                  </td>
                                  <td className="p-2 text-right">
                                    {line.qty} {line.unit_of_measure}
                                  </td>
                                  <td className="p-2 text-right">
                                    {merchant.currency} {line.unit_cost_price.toFixed(2)}
                                  </td>
                                  <td className="p-2 text-right text-cyan-400">
                                    {merchant.currency} {line.unit_selling_price.toFixed(2)}
                                  </td>
                                  <td className="p-2 text-right text-emerald-400 font-bold">
                                    {merchant.currency} {line.subtotal.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {delivery.notes && (
                            <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-950/40 p-2 rounded">
                              Note: {delivery.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMERS VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === "customers" && (
        <div className="space-y-6">
          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => {
              const rankInfo = customerRankingsMap.get(customer.id);
              return (
              <div
                key={customer.id}
                className={`p-4 rounded-xl bg-[#18181b] border transition-all flex flex-col justify-between ${
                  customer.outstanding_credit_deni > 0
                    ? "border-rose-900/50 shadow-rose-950/20 shadow-lg"
                    : "border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{customer.name}</h3>
                        {customer.aliases && customer.aliases.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {customer.aliases.map((alias, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60"
                                title={`Merged alias / nickname: ${alias}`}
                              >
                                AKA: {alias}
                              </span>
                            ))}
                          </div>
                        )}
                        {rankInfo && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono flex items-center gap-0.5 ${
                              rankInfo.rank === 1
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                : rankInfo.rank === 2
                                ? "bg-slate-300/20 text-slate-200 border border-slate-400/30"
                                : rankInfo.rank === 3
                                ? "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {rankInfo.rank === 1 ? <Crown className="w-3 h-3 text-amber-400" /> : null}
                            Rank #{rankInfo.rank}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                        {customer.customer_type.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Trust / Debt Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      {rankInfo?.debt_status_badge === "DEBT_CLEARED_TOP_REPAYER" ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Cleared (Top)
                        </span>
                      ) : rankInfo?.debt_status_badge === "ACTIVE_LEAST_DENI" ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Low Debt
                        </span>
                      ) : rankInfo?.debt_status_badge === "LAST_MONTH_OVERDUE" ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Last Month Overdue
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            customer.trust_status === "TRUSTED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : customer.trust_status === "GOOD_STANDING"
                              ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                              : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          }`}
                        >
                          {customer.trust_status.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{customer.phone}</span>
                    </p>
                    {customer.location_or_estate && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{customer.location_or_estate}</span>
                      </p>
                    )}

                    {/* Historical Debt Badge if present */}
                    {customer.historical_opening_deni && customer.historical_opening_deni > 0 && (
                      <div className="flex items-center justify-between text-[10px] py-1 px-2 rounded-md bg-amber-950/40 border border-amber-500/30 text-amber-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Last Month Debt:</span>
                        </span>
                        <span className="font-mono font-bold">
                          {merchant.currency} {customer.historical_opening_deni.toLocaleString()}
                          {customer.historical_deni_date && ` (${customer.historical_deni_date})`}
                        </span>
                      </div>
                    )}

                    {/* Goods Bought / Preferred Items */}
                    {customer.goods_bought && (
                      <div className="flex items-center gap-1.5 text-xs text-cyan-300/90 bg-cyan-950/30 px-2 py-1 rounded-md border border-cyan-500/20">
                        <ShoppingBag className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="text-[11px] font-medium truncate">
                          Buys: {customer.goods_bought}
                        </span>
                      </div>
                    )}

                    {/* National ID section */}
                    <div className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-slate-900/90 border border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="text-[11px] text-slate-400">National ID (OID):</span>
                        <span className="font-mono font-semibold text-slate-200 text-[11px]">
                          {customer.national_id || "Not Provided"}
                        </span>
                      </div>
                      {customer.national_id ? (
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          ID Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400/80">Pending KYC</span>
                      )}
                    </div>
                  </div>

                  {/* Credit vs Limit Meter */}
                  <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Credit Balance:</span>
                      <span
                        className={`font-mono font-bold ${
                          customer.outstanding_credit_deni > 0
                            ? "text-rose-400 text-sm"
                            : "text-emerald-400"
                        }`}
                      >
                        {merchant.currency} {customer.outstanding_credit_deni.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Credit Limit:</span>
                      <span className="font-mono">
                        {merchant.currency} {customer.credit_limit.toLocaleString()}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            (customer.outstanding_credit_deni / (customer.credit_limit || 1)) * 100
                          )}%`,
                        }}
                        className={`h-full ${
                          customer.outstanding_credit_deni > customer.credit_limit
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Pref: <strong>{customer.preferred_payment_method.replace(/_/g, " ")}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-edit-cust-${customer.id}`}
                      type="button"
                      onClick={() => handleOpenEditCustomer(customer)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      title="Key in specifics (National ID OID, goods bought, credit limit, phone)"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenMerge("CUSTOMER", customer.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      title="Merge duplicate customer profile"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Merge</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSaleCustomerId(customer.id);
                        setShowCustomerSaleModal(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      title="Log Sale or Credit for this customer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Sale</span>
                    </button>

                    {customer.outstanding_credit_deni > 0 ? (
                      <button
                        id={`btn-repay-deni-${customer.id}`}
                        onClick={() => handleOpenRepayDeni(customer)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Coins className="w-3 h-3" />
                        <span>Settle Debt</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>No Debt</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {/* Customer Sales & Credit Ledger Log */}
          <div className="p-5 rounded-xl bg-[#18181b] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>Customer Sales & Credit Ledger</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transactions across Cash, Equity Paybill, M-Pesa Till & Credit tabs
                </p>
              </div>
              <button
                onClick={() => setShowCustomerSaleModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Log Sale / Credit</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800 font-mono text-xs">
              {customerSales.map((sale) => (
                <div key={sale.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans font-bold text-white">
                        {sale.customer_name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          sale.payment_channel === "CREDIT_DENI"
                            ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            : sale.payment_channel === "EQUITY_PAYBILL"
                            ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                            : sale.payment_channel === "MPESA_TILL"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {sale.payment_channel.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-400 mt-0.5">
                      {sale.date} • {sale.items.map((i) => `${i.qty}x ${i.item_name}`).join(", ")}
                    </p>
                    {sale.notes && (
                      <p className="text-[11px] font-sans text-slate-500 italic mt-0.5">
                        {sale.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Bill</span>
                      <span className="text-white font-bold">
                        {merchant.currency} {sale.total_amount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Paid</span>
                      <span className="text-emerald-400 font-bold">
                        {merchant.currency} {sale.amount_paid.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Added to Debt</span>
                      <span
                        className={`font-bold ${
                          sale.deni_added > 0 ? "text-rose-400" : "text-slate-500"
                        }`}
                      >
                        {merchant.currency} {sale.deni_added.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RECEIVE MULTI-ITEM SUPPLIER DELIVERY */}
      {/* ========================================================================= */}
      {showMultiItemDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#18181b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Receive Multi-Item Supplier Delivery</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Suppliers deliver one to many items per drop. Automatically updates stock & creates batches.
                </p>
              </div>
              <button
                onClick={() => setShowMultiItemDeliveryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMultiItemDelivery} className="p-5 space-y-4">
              {/* Searchable Supplier Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Search & Select Supplier *</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {suppliers.length} registered
                  </span>
                </div>

                <SearchableSupplierPicker
                  id="delivery-supplier-picker"
                  suppliers={suppliers}
                  selectedSupplierId={deliverySupplierId}
                  onSelect={(s) => {
                    setDeliverySupplierId(s.id);
                  }}
                  onClear={() => {
                    setDeliverySupplierId("");
                  }}
                  currency={merchant.currency}
                  placeholder="Type supplier name (e.g. B, N, U, driver ID, or phone)..."
                />
              </div>

                {/* Delivery Date & Evidential Timestamp Picker */}
                <EvidentialDatePicker
                  id="delivery-evidential-date-picker"
                  label="Incoming Delivery Date & Time"
                  sublabel="Accurate receipt date is required for batch turnover velocity and supplier invoice auditing"
                  value={deliveryTimestamp}
                  onChange={setDeliveryTimestamp}
                  accentColor="emerald"
                />

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Delivery Note / Invoice Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DN-BRK-9921 or INV-4401"
                    value={deliveryInvoiceNote}
                    onChange={(e) => setDeliveryInvoiceNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

              {/* Multi-Item Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Delivered Items Line Items ({deliveryLines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDeliveryLine}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Item</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  {deliveryLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-900/80 border border-slate-800"
                    >
                      <div className="col-span-5">
                        <SearchableItemPicker
                          compact
                          items={inventoryItems}
                          selectedItemId={line.itemId}
                          onSelect={(item) => handleDeliveryLineChange(idx, "itemId", item.id)}
                          onClear={() => handleDeliveryLineChange(idx, "itemId", "")}
                          currency={merchant.currency}
                          showPrice="cost"
                          placeholder="Type product name (e.g. S, M, T)..."
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={line.qty}
                          onChange={(e) =>
                            handleDeliveryLineChange(idx, "qty", Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white text-right"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Cost"
                          step="0.5"
                          value={line.unitCost}
                          onChange={(e) =>
                            handleDeliveryLineChange(idx, "unitCost", Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white text-right"
                          required
                        />
                      </div>

                      <div className="col-span-2 text-right font-mono text-xs text-emerald-400 font-bold">
                        {(line.qty * line.unitCost).toLocaleString()}
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliveryLine(idx)}
                          disabled={deliveryLines.length <= 1}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Total Summary & Payment Settlement */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Total Delivery Value:</span>
                  <span className="text-base font-bold font-mono text-white">
                    {merchant.currency} {deliveryTotal.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Payment Settlement Mode
                    </label>
                    <select
                      value={deliveryPaymentMode}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setDeliveryPaymentMode(val);
                        if (val === "CREDIT_UNPAID") setDeliveryAmountPaid(0);
                        if (val === "EQUITY_PAYBILL" || val === "MPESA_TILL" || val === "CASH") {
                          setDeliveryAmountPaid(deliveryTotal);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="CREDIT_UNPAID">On Credit (Pay Later - 100% Debt)</option>
                      <option value="SPLIT">Split (Pay Part Now, Balance as Debt)</option>
                      <option value="EQUITY_PAYBILL">Equity Paybill 247247 (Paid Full)</option>
                      <option value="MPESA_TILL">M-Pesa Till / Float (Paid Full)</option>
                      <option value="CASH">Cash in Drawer (Paid Full)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Amount Paid Now ({merchant.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={deliveryTotal}
                      value={deliveryAmountPaid}
                      onChange={(e) => setDeliveryAmountPaid(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-amber-400 font-semibold">
                  <span>Balance We Owe to Supplier (Debt Added):</span>
                  <span className="font-mono font-bold text-sm">
                    {merchant.currency} {deliveryBalanceRemaining.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Delivery Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning 6 AM crate drop, verified by storekeeper"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMultiItemDeliveryModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950"
                >
                  Confirm Delivery & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SETTLE SUPPLIER DEBT */}
      {/* ========================================================================= */}
      {showPaySupplierModal && selectedSupplierForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#18181b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-400" />
                  <span>Settle Supplier Debt</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paying <strong>{selectedSupplierForPay.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowPaySupplierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPaySupplier} className="p-5 space-y-4">
              {/* Payment Date & Time Picker */}
              <EvidentialDatePicker
                id="pay-supplier-evidential-date-picker"
                label="Payment Date & Time"
                sublabel="Evidential timestamp for bank & M-Pesa statement reconciliation"
                value={paySupplierTimestamp}
                onChange={setPaySupplierTimestamp}
                accentColor="amber"
              />

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                <span>Current Outstanding Debt:</span>
                <span className="font-mono font-bold text-sm">
                  {merchant.currency} {selectedSupplierForPay.outstanding_balance_owed.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Amount to Pay ({merchant.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedSupplierForPay.outstanding_balance_owed}
                  value={paySupplierAmount}
                  onChange={(e) => setPaySupplierAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-emerald-400 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Payment Channel *
                </label>
                <select
                  value={paySupplierChannel}
                  onChange={(e) => setPaySupplierChannel(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  <option value="EQUITY_PAYBILL">Equity Paybill 247247</option>
                  <option value="MPESA_TILL">M-Pesa Till / Float</option>
                  <option value="CASH">Physical Cash Drawer</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Transaction Reference / M-Pesa Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. QKH718420 or EQ-99120"
                  value={paySupplierRef}
                  onChange={(e) => setPaySupplierRef(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared milk invoice balance"
                  value={paySupplierNotes}
                  onChange={(e) => setPaySupplierNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaySupplierModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-950"
                >
                  Record Payment & Clear Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CUSTOMER SALE / LOG CREDIT */}
      {/* ========================================================================= */}
      {showCustomerSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-[#18181b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>Log Customer Sale / Credit</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record sales via Cash, Equity Paybill, M-Pesa Till or on credit terms.
                </p>
              </div>
              <button
                onClick={() => setShowCustomerSaleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomerSale} className="p-5 space-y-4">
              {/* Sale Date & Time Picker */}
              <EvidentialDatePicker
                id="customer-sale-evidential-date-picker"
                label="Customer Sale Date & Time"
                sublabel="Vital for evidential receipts, debt repayment schedules, and daily revenue metrics"
                value={saleTimestamp}
                onChange={setSaleTimestamp}
                accentColor="cyan"
              />

              {/* Searchable Customer Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Search & Select Customer *</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {customers.length} registered
                  </span>
                </div>

                <SearchableCustomerPicker
                  id="sale-customer-picker"
                  customers={customers}
                  selectedCustomerId={saleCustomerId}
                  onSelect={(c) => {
                    setSaleCustomerId(c.id);
                  }}
                  onClear={() => {
                    setSaleCustomerId("");
                  }}
                  currency={merchant.currency}
                  placeholder="Type customer name (e.g. M, L, J, phone, or ID)..."
                />
              </div>

              {/* Items in cart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Purchased Items ({saleLines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSaleLine}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  {saleLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-400 font-semibold">Item #{idx + 1}:</span>
                          <button
                            type="button"
                            onClick={() => handleSaleLineChange(idx, "isCustom", !line.isCustom)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                              line.isCustom
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            }`}
                          >
                            {line.isCustom ? "📝 Unlisted / Off-Database Item" : "📦 From Inventory Catalog"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSaleLine(idx)}
                          disabled={saleLines.length <= 1}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 sm:col-span-6">
                          {line.isCustom ? (
                            <input
                              type="text"
                              placeholder="Type item name (e.g. 2kg Maize Flour / Soko Item)"
                              value={line.itemName}
                              onChange={(e) =>
                                handleSaleLineChange(idx, "itemName", e.target.value)
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
                              required
                            />
                          ) : (
                            <SearchableItemPicker
                              compact
                              items={inventoryItems}
                              selectedItemId={line.itemId}
                              onSelect={(item) => handleSaleLineChange(idx, "itemId", item.id)}
                              onClear={() => handleSaleLineChange(idx, "itemId", "")}
                              currency={merchant.currency}
                              showPrice="selling"
                              placeholder="Type product name (e.g. S, M, T)..."
                            />
                          )}
                        </div>

                        <div className="col-span-5 sm:col-span-2">
                          <label className="text-[9px] text-slate-400 block sm:hidden">Price</label>
                          <input
                            type="number"
                            placeholder="Price"
                            min="0"
                            step="5"
                            value={line.unitPrice || ""}
                            onChange={(e) =>
                              handleSaleLineChange(idx, "unitPrice", Number(e.target.value))
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white text-right font-mono"
                            required
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-2">
                          <label className="text-[9px] text-slate-400 block sm:hidden">Qty</label>
                          <input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={line.qty}
                            onChange={(e) =>
                              handleSaleLineChange(idx, "qty", Number(e.target.value))
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white text-right font-mono"
                            required
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2 text-right font-mono text-xs text-cyan-400 font-bold">
                          {merchant.currency} {(line.qty * line.unitPrice).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Channel */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Total Bill:</span>
                  <span className="text-base font-bold font-mono text-white">
                    {merchant.currency} {saleTotal.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Payment Channel
                    </label>
                    <select
                      value={salePaymentMode}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setSalePaymentMode(val);
                        if (val === "CREDIT_DENI") setSaleAmountPaid(0);
                        if (val === "CASH" || val === "EQUITY_PAYBILL" || val === "MPESA_TILL") {
                          setSaleAmountPaid(saleTotal);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="CREDIT_DENI">Take on Credit (100% Debt)</option>
                      <option value="CASH">Cash (Paid in Full)</option>
                      <option value="EQUITY_PAYBILL">Equity Paybill 247247 (Paid Full)</option>
                      <option value="MPESA_TILL">M-Pesa Buy Goods Till (Paid Full)</option>
                      <option value="SPLIT">Split (Partial Payment, Rest on Credit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Amount Paid Now ({merchant.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={saleTotal}
                      value={saleAmountPaid}
                      onChange={(e) => setSaleAmountPaid(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-rose-400 font-semibold">
                  <span>Added to Customer Debt:</span>
                  <span className="font-mono font-bold text-sm">
                    {merchant.currency} {saleDeniAdded.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Notes / Promise Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. Promised to clear on Saturday evening"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustomerSaleModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-950"
                >
                  Record Sale & Update Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REPAY CUSTOMER CREDIT TAB */}
      {/* ========================================================================= */}
      {showRepayDeniModal && selectedCustomerForRepay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#18181b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Record Customer Repayment</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Collecting repayment from <strong>{selectedCustomerForRepay.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowRepayDeniModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRepayDeni} className="p-5 space-y-4">
              {/* Collection Date & Time Picker */}
              <EvidentialDatePicker
                id="customer-repay-evidential-date-picker"
                label="Collection Date & Time"
                sublabel="Evidential timestamp for clearing customer deni balance"
                value={repayDeniTimestamp}
                onChange={setRepayDeniTimestamp}
                accentColor="emerald"
              />

              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
                <span>Current Outstanding Debt:</span>
                <span className="font-mono font-bold text-sm">
                  {merchant.currency} {selectedCustomerForRepay.outstanding_credit_deni.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Amount Repaid ({merchant.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomerForRepay.outstanding_credit_deni}
                  value={repayDeniAmount}
                  onChange={(e) => setRepayDeniAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-emerald-400 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Collection Channel *
                </label>
                <select
                  value={repayDeniChannel}
                  onChange={(e) => setRepayDeniChannel(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  <option value="MPESA_TILL">M-Pesa Buy Goods Till</option>
                  <option value="EQUITY_PAYBILL">Equity Paybill 247247</option>
                  <option value="CASH">Physical Cash Drawer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Receipt / Transaction Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. QKH99201 or CASH-RCP-102"
                  value={repayDeniRef}
                  onChange={(e) => setRepayDeniRef(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared customer balance in full"
                  value={repayDeniNotes}
                  onChange={(e) => setRepayDeniNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRepayDeniModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950"
                >
                  Record Repayment & Clear Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD NEW SUPPLIER */}
      {/* ========================================================================= */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#18181b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-400" />
                <span>Add New Supplier</span>
              </h3>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Supplier / Company Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brookside Dairy East Africa"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={newSuppPhone}
                    onChange={(e) => setNewSuppPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={newSuppCategory}
                    onChange={(e) => setNewSuppCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="Dairy & Fresh">Dairy & Fresh</option>
                    <option value="Flour & Grain Wholesaler">Flour & Grain Wholesaler</option>
                    <option value="Edibles & Fats">Edibles & Fats</option>
                    <option value="Poultry & Dairy">Poultry & Dairy</option>
                    <option value="Beverages & Drinks">Beverages & Drinks</option>
                    <option value="Bakery & Confectionery">Bakery & Confectionery</option>
                    <option value="General FMCG">General FMCG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Contact Person / Van Driver
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Peter (Route Driver)"
                    value={newSuppContact}
                    onChange={(e) => setNewSuppContact(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Driver / Rep National ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24890123"
                    value={newSuppNationalId}
                    onChange={(e) => setNewSuppNationalId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Location / Distribution Hub
                </label>
                <input
                  type="text"
                  placeholder="e.g. Industrial Area or Nyamakima"
                  value={newSuppLocation}
                  onChange={(e) => setNewSuppLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={newSuppTerms}
                    onChange={(e) => setNewSuppTerms(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="CREDIT_7_DAYS">Credit 7 Days</option>
                    <option value="CREDIT_14_DAYS">Credit 14 Days</option>
                    <option value="CREDIT_30_DAYS">Credit 30 Days</option>
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Paybill / Bank Details
                  </label>
                  <input
                    type="text"
                    value={newSuppPayDetails}
                    onChange={(e) => setNewSuppPayDetails(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-950"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD NEW CUSTOMER */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#18181b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Add New Customer</span>
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mama Stacy or Hotel Sunrise"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                    <span>National ID</span>
                    <span className="text-[10px] text-cyan-400 font-normal">For Credit/KYC</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 28491024"
                    value={newCustNationalId}
                    onChange={(e) => setNewCustNationalId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Customer Type
                  </label>
                  <select
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="NEIGHBORHOOD_RESIDENT">Neighborhood Resident</option>
                    <option value="MAMA_MBOGA">Fresh Produce Vendor</option>
                    <option value="BODA_RIDER">Delivery Rider</option>
                    <option value="LOCAL_EATERY">Local Eatery / Hotel</option>
                    <option value="WHOLESALE_BUYER">Wholesale Buyer</option>
                    <option value="RETAIL_REGULAR">Retail Regular</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Location / Estate / Plot
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 4 Door B3"
                    value={newCustLocation}
                    onChange={(e) => setNewCustLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Credit Limit ({merchant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newCustLimit}
                    onChange={(e) => setNewCustLimit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Preferred Payment
                  </label>
                  <select
                    value={newCustPref}
                    onChange={(e) => setNewCustPref(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="CREDIT_DENI">Credit (Pay Later)</option>
                    <option value="MPESA_TILL">M-Pesa Buy Goods Till</option>
                    <option value="EQUITY_PAYBILL">Equity Paybill 247247</option>
                    <option value="CASH">Physical Cash</option>
                  </select>
                </div>
              </div>

              {/* Historical Debt / Deni ya Zamani (e.g. from Last Month or unlisted supplier stock) */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Historical Opening Debt (Deni ya Zamani / Last Month)</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Record debts from previous months or off-database supplier items. Customers with debt history will be ranked by lowest current balance.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Opening Debt ({merchant.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder="0"
                      value={newCustHistoricalDeni || ""}
                      onChange={(e) => setNewCustHistoricalDeni(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Incurred Date (e.g. Last Month)
                    </label>
                    <input
                      type="date"
                      value={newCustHistoricalDate}
                      onChange={(e) => setNewCustHistoricalDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Opening Debt Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unlisted items & supplies carried over from last month"
                    value={newCustNotes}
                    onChange={(e) => setNewCustNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-950"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 6: SUPPLIER FULL STATEMENT & T-LEDGER BREAKDOWN */}
      {/* ========================================================================= */}
      {selectedSupplierForStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#18181b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {selectedSupplierForStatement.name}
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                      {selectedSupplierForStatement.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Phone: {selectedSupplierForStatement.phone || "N/A"} • Terms: {selectedSupplierForStatement.payment_terms.replace(/_/g, " ")} • Bank/Paybill: {selectedSupplierForStatement.bank_or_paybill_details || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedSupplierForStatement.outstanding_balance_owed > 0 && (
                  <button
                    onClick={() => {
                      const supp = selectedSupplierForStatement;
                      setSelectedSupplierForStatement(null);
                      handleOpenPaySupplier(supp);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Settle Debt ({merchant.currency} {selectedSupplierForStatement.outstanding_balance_owed.toLocaleString()})</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedSupplierForStatement(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-200">
              {(() => {
                const normName = selectedSupplierForStatement.name.trim().toLowerCase();
                const suppDeliveries = supplierDeliveries.filter(
                  (d) => d.supplier_id === selectedSupplierForStatement.id || (d.supplier_name && d.supplier_name.trim().toLowerCase() === normName)
                );
                const suppPayments = supplierPayments.filter(
                  (p) => p.supplier_id === selectedSupplierForStatement.id || (p.supplier_name && p.supplier_name.trim().toLowerCase() === normName)
                );
                const totalInvoiced = suppDeliveries.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);
                const totalDropPaid = suppDeliveries.reduce((sum, d) => sum + (Number(d.amount_paid) || 0), 0);
                const totalSettlementPaid = suppPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const totalPaidToSupplier = totalDropPaid + totalSettlementPaid;
                const outstandingOwed = Math.max(0, totalInvoiced - totalPaidToSupplier);

                // Build T-Account rows
                const debits: Array<{ id: string; date: string; ref: string; desc: string; amount: number; channel?: string }> = [];
                const credits: Array<{ id: string; date: string; ref: string; desc: string; amount: number; channel?: string }> = [];

                // Debits (Payments settled)
                suppPayments.forEach((p) => {
                  debits.push({
                    id: p.id,
                    date: (p.date || p.created_at || "").split("T")[0],
                    ref: p.reference || `PMT-${p.id.slice(-4)}`,
                    desc: `Settlement Payment (${(p.payment_channel || "CASH").replace(/_/g, " ")})`,
                    amount: Number(p.amount) || 0,
                    channel: p.payment_channel,
                  });
                });
                suppDeliveries.filter((d) => d.amount_paid > 0).forEach((d) => {
                  debits.push({
                    id: `drop-${d.id}`,
                    date: (d.delivery_date || d.created_at || "").split("T")[0],
                    ref: d.invoice_or_delivery_note || `DROP-${d.id.slice(-4)}`,
                    desc: `Paid at Drop (${(d.payment_channel || "CASH").replace(/_/g, " ")})`,
                    amount: Number(d.amount_paid) || 0,
                    channel: d.payment_channel,
                  });
                });

                // Credits (Invoices / Deliveries received)
                suppDeliveries.forEach((d) => {
                  const itemsDesc = d.items?.map((it) => `${it.qty}x ${it.item_name}`).join(", ") || "Stock Inbound";
                  credits.push({
                    id: d.id,
                    date: (d.delivery_date || d.created_at || "").split("T")[0],
                    ref: d.invoice_or_delivery_note || `INV-${d.id.slice(-4)}`,
                    desc: itemsDesc,
                    amount: Number(d.total_amount) || 0,
                    channel: d.payment_channel,
                  });
                });

                return (
                  <>
                    {/* KPI Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Total Invoiced (Stock Value)
                        </span>
                        <div className="text-xl font-bold font-mono text-white mt-1">
                          {merchant.currency} {totalInvoiced.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {suppDeliveries.length} delivery consignment(s)
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Total Payments Disbursed
                        </span>
                        <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                          {merchant.currency} {totalPaidToSupplier.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {debits.length} recorded disbursement(s)
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Current Balance Owed (Debt)
                        </span>
                        <div
                          className={`text-xl font-bold font-mono mt-1 ${
                            outstandingOwed > 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {merchant.currency} {outstandingOwed.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {outstandingOwed > 0 ? "Payable creditor liability" : "Account in good standing (fully settled)"}
                        </span>
                      </div>
                    </div>

                    {/* Double-Entry T-Account View */}
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5" />
                            <span>Classical T-Account Ledger: {selectedSupplierForStatement.name}</span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Accounts Payable Creditors Ledger · Dr. Payments / Cr. Consignments
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          ACC-SUPP-{selectedSupplierForStatement.id.slice(-4).toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* DEBIT SIDE */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-emerald-950/40 p-2 rounded border border-emerald-900/40">
                            <span className="text-[11px] font-bold text-emerald-400 uppercase">
                              DEBIT (Dr) - Payments & Reductions
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-300">
                              {merchant.currency} {totalPaidToSupplier.toLocaleString()}
                            </span>
                          </div>
                          {debits.length === 0 ? (
                            <p className="text-xs text-slate-500 italic p-3 text-center">
                              No payment disbursements recorded yet.
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {debits.map((d, dIdx) => (
                                <div
                                  key={`${d.id || 'deb'}_${dIdx}`}
                                  className="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between font-mono"
                                >
                                  <div>
                                    <div className="font-semibold text-slate-200">{d.desc}</div>
                                    <div className="text-[10px] text-slate-500">
                                      {d.date} · Ref: {d.ref}
                                    </div>
                                  </div>
                                  <span className="font-bold text-emerald-400">
                                    {merchant.currency} {d.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* CREDIT SIDE */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-amber-950/40 p-2 rounded border border-amber-900/40">
                            <span className="text-[11px] font-bold text-amber-400 uppercase">
                              CREDIT (Cr) - Inbound Stock Deliveries
                            </span>
                            <span className="font-mono text-xs font-bold text-amber-300">
                              {merchant.currency} {totalInvoiced.toLocaleString()}
                            </span>
                          </div>
                          {credits.length === 0 ? (
                            <p className="text-xs text-slate-500 italic p-3 text-center">
                              No deliveries or drop invoices recorded.
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {credits.map((c, cIdx) => (
                                <div
                                  key={`${c.id || 'cred'}_${cIdx}`}
                                  className="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between font-mono"
                                >
                                  <div className="max-w-[70%]">
                                    <div className="font-semibold text-slate-200 truncate">{c.desc}</div>
                                    <div className="text-[10px] text-slate-500">
                                      {c.date} · Invoice: {c.ref}
                                    </div>
                                  </div>
                                  <span className="font-bold text-amber-400">
                                    {merchant.currency} {c.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ledger Balance Footer */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 font-semibold">Balance c/d (Net Creditor Debt):</span>
                        <span
                          className={`font-bold text-sm ${
                            outstandingOwed > 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {merchant.currency} {outstandingOwed.toLocaleString()} (CREDIT BALANCE)
                        </span>
                      </div>
                    </div>

                    {/* Itemized Deliveries Breakdown List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-emerald-400" />
                        <span>All Delivery Consignments & Receipts from this Supplier ({suppDeliveries.length})</span>
                      </h4>

                      {suppDeliveries.length === 0 ? (
                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                          No itemized drops recorded for {selectedSupplierForStatement.name}.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {suppDeliveries.map((deliv, delivIdx) => (
                            <div
                              key={`${deliv.id || 'deliv'}_${delivIdx}`}
                              className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/80 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-white">
                                    {deliv.invoice_or_delivery_note || "Delivery Note"}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {deliv.delivery_date}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                  <span>Total: <strong>{merchant.currency} {deliv.total_amount.toLocaleString()}</strong></span>
                                  <span className="text-emerald-400">Paid: {merchant.currency} {deliv.amount_paid.toLocaleString()}</span>
                                  <span className={deliv.balance_remaining > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>
                                    Balance: {merchant.currency} {deliv.balance_remaining.toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Items list */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                                {deliv.items.map((it, idx) => (
                                  <div key={idx} className="p-1.5 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                                    <span className="text-slate-200 font-sans">{it.qty}x {it.item_name}</span>
                                    <span className="text-emerald-400 font-bold">{merchant.currency} {it.subtotal.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedSupplierForStatement(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Entities Modal */}
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

      {/* Edit Record Modal for Supplier and Customer Specifics */}
      <EditRecordModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingRecord(null);
        }}
        merchant={merchant}
        type={editingType}
        record={editingRecord}
        onSave={handleSaveEditRecord}
        onDelete={handleDeleteEditRecord}
      />
    </div>
  );
};
