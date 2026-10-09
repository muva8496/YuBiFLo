import React, { useState } from "react";
import { 
  Truck, ArrowRight, CheckCircle2, Package, Sparkles, 
  RefreshCw, DollarSign, Layers, Plus, Trash2, Check, 
  Calculator, ListPlus, FileText, ShoppingBag, AlertCircle,
  Building2, Copy, X, Phone, Users, ShieldCheck,
  Calendar, Edit3
} from "lucide-react";
import { AlacioMasterState, InventoryItem, SupplierProfile } from "../../types/alacio";
import { BulkConversionEngine } from "../../services/bulkConversionEngine";
import { INITIAL_SUPPLIERS } from "../../services/alacioStorage";
import { deduplicateSuppliers, isSameSupplier } from "../../utils/supplierHelper";

export interface MultiSupplyDeliveryItem {
  id: string;
  itemId: string | number;
  itemName: string;
  supplyUnitsReceived: number;
  supplyUnit: string;
  retailUnitsAdded: number;
  retailUnit: string;
  conversionRatio: number;
  lineCost: number;
  unitCostAtDelivery: number;
  retailPrice: number;
  expectedMargin: number;
}

export interface MultiSupplyDelivery {
  id: string;
  supplierName: string;
  supplierNationalId?: string; // Kenyan National ID for Agent & Bank OTC deposits
  supplierPhone?: string;
  deliveryNoteNumber: string;
  paymentMode: "CASH" | "MPESA" | "CREDIT" | "EQUITEL";
  date?: string; // YYYY-MM-DD editable date (for logging yesterday's receipts today)
  timestamp: string;
  totalCost: number;
  totalRetailValue: number;
  items: MultiSupplyDeliveryItem[];
}

// Kept for backward compatibility
export type SupplyLogEntry = MultiSupplyDeliveryItem & {
  supplierName: string;
  paymentMode: "CASH" | "MPESA" | "CREDIT";
  timestamp: string;
  totalCost: number;
};

interface SupplierLogTabProps {
  state: AlacioMasterState;
  onLogMultiDelivery: (delivery: MultiSupplyDelivery) => void;
  onAddSupplier?: (newSupplier: {
    name: string;
    company: string;
    driver_name?: string;
    phone: string;
    national_id: string;
    category: string;
    payment_preference: "NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER";
    till_or_account?: string;
    payment_terms?: string;
  }) => void;
  onEditSupplier?: (supplierId: string, updatedData: Partial<SupplierProfile>) => void;
  onDeleteSupplier?: (supplierId: string) => void;
}

export default function SupplierLogTab({ 
  state, 
  onLogMultiDelivery, 
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier
}: SupplierLogTabProps) {
  const { currency, inventory } = state;
  // Guaranteed deduplicated list: suppliers only recorded once
  const suppliersList = deduplicateSuppliers(state.suppliers && state.suppliers.length > 0 ? state.suppliers : INITIAL_SUPPLIERS);

  // Supplier & Shipment Header
  const [supplierName, setSupplierName] = useState("Brookside Dairy Delivery");
  const [supplierNationalId, setSupplierNationalId] = useState("22940184");
  const [supplierPhone, setSupplierPhone] = useState("0722 849 101");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("DN-8841");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "MPESA" | "CREDIT" | "EQUITEL">("MPESA");
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Add Supplier Modal state
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);
  const [newCompName, setNewCompName] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newNationalId, setNewNationalId] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] = useState("Dairy");
  const [newPreference, setNewPreference] = useState<"NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER">("NATIONAL_ID_DEPOSIT");
  const [newTill, setNewTill] = useState("");
  const [newTerms, setNewTerms] = useState("Cash on Delivery");
  const [copiedSupplierId, setCopiedSupplierId] = useState<string | null>(null);

  // Edit Supplier Modal state
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierProfile | null>(null);
  const [editCompName, setEditCompName] = useState("");
  const [editDriverName, setEditDriverName] = useState("");
  const [editNationalId, setEditNationalId] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCategory, setEditCategory] = useState("Dairy");
  const [editPreference, setEditPreference] = useState<"NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER">("NATIONAL_ID_DEPOSIT");
  const [editTill, setEditTill] = useState("");
  const [editTerms, setEditTerms] = useState("Cash on Delivery");

  // Delete Supplier Modal state
  const [isDeleteSupplierOpen, setIsDeleteSupplierOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierProfile | null>(null);

  const handleOpenEditSupplier = (sup: SupplierProfile) => {
    setEditingSupplier(sup);
    setEditCompName(sup.company || sup.name);
    setEditDriverName(sup.driver_name || "");
    setEditNationalId(sup.national_id);
    setEditPhone(sup.phone);
    setEditCategory(sup.category);
    setEditPreference(sup.payment_preference);
    setEditTill(sup.till_or_account || "");
    setEditTerms(sup.payment_terms || "Cash on Delivery");
    setIsEditSupplierOpen(true);
  };

  const handleExecuteEditSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editCompName.trim()) return;

    if (onEditSupplier) {
      onEditSupplier(editingSupplier.id, {
        name: editDriverName.trim() || editCompName.trim(),
        company: editCompName.trim(),
        driver_name: editDriverName.trim() || undefined,
        phone: editPhone.trim() || "07XX XXX XXX",
        national_id: editNationalId.trim(),
        category: editCategory,
        payment_preference: editPreference,
        till_or_account: editTill.trim() || undefined,
        payment_terms: editTerms
      });
    }

    setIsEditSupplierOpen(false);
    setSuccessMsg(`Supplier profile for "${editCompName}" updated successfully. National ID & Phone corrected.`);
    setTimeout(() => setSuccessMsg(null), 4500);
  };

  const handleOpenDeleteSupplier = (sup: SupplierProfile) => {
    setSupplierToDelete(sup);
    setIsDeleteSupplierOpen(true);
  };

  const handleExecuteDeleteSupplier = () => {
    if (!supplierToDelete) return;
    if (onDeleteSupplier) {
      onDeleteSupplier(supplierToDelete.id);
    }
    setIsDeleteSupplierOpen(false);
    setSuccessMsg(`Supplier "${supplierToDelete.company || supplierToDelete.name}" deleted. All other data preserved.`);
    setSupplierToDelete(null);
    setTimeout(() => setSuccessMsg(null), 4500);
  };

  // Multi-Item Delivery Items List
  const [deliveryItems, setDeliveryItems] = useState<MultiSupplyDeliveryItem[]>([
    {
      id: "item_row_1",
      itemId: inventory[0]?.id || 1,
      itemName: "Brookside Fresh Milk 500ml",
      supplyUnitsReceived: 2,
      supplyUnit: "Crate (24pkts)",
      retailUnitsAdded: 48,
      retailUnit: "Packet",
      conversionRatio: 24,
      lineCost: 2640,
      unitCostAtDelivery: 55,
      retailPrice: 65,
      expectedMargin: 10
    },
    {
      id: "item_row_2",
      itemId: inventory[1]?.id || 2,
      itemName: "Brookside Lala / Mala 500ml",
      supplyUnitsReceived: 1,
      supplyUnit: "Crate (24pkts)",
      retailUnitsAdded: 24,
      retailUnit: "Packet",
      conversionRatio: 24,
      lineCost: 1560,
      unitCostAtDelivery: 65,
      retailPrice: 80,
      expectedMargin: 15
    }
  ]);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Past multi-item shipments history
  const [recentDeliveries, setRecentDeliveries] = useState<MultiSupplyDelivery[]>([
    {
      id: "deliv_prev_1",
      supplierName: "Bidco Africa & Mega Wholesalers",
      deliveryNoteNumber: "DN-7719",
      paymentMode: "MPESA",
      timestamp: "Today, 08:30 AM",
      totalCost: 12800,
      totalRetailValue: 15400,
      items: [
        {
          id: "prev_i1",
          itemId: "sugar",
          itemName: "Mumias Sugar",
          supplyUnitsReceived: 1,
          supplyUnit: "Bag (50kg)",
          retailUnitsAdded: 200,
          retailUnit: "Quarter-Kg (250g)",
          conversionRatio: 200,
          lineCost: 6800,
          unitCostAtDelivery: 34,
          retailPrice: 40,
          expectedMargin: 6
        },
        {
          id: "prev_i2",
          itemId: "unga",
          itemName: "Unga Jogoo 2kg",
          supplyUnitsReceived: 4,
          supplyUnit: "Bale (12pkts)",
          retailUnitsAdded: 48,
          retailUnit: "Packet",
          conversionRatio: 12,
          lineCost: 6000,
          unitCostAtDelivery: 125,
          retailPrice: 145,
          expectedMargin: 20
        }
      ]
    }
  ]);

  // Aggregate totals across all items in current delivery (strictly numerical addition, no string concat)
  const totalDeliveryCost = deliveryItems.reduce(
    (acc, item) => acc + (Number(item.lineCost) || 0), 
    0
  );
  const totalRetailValue = deliveryItems.reduce(
    (acc, item) => acc + ((Number(item.retailUnitsAdded) || 0) * (Number(item.retailPrice) || 0)), 
    0
  );
  const totalExpectedProfit = Math.max(0, totalRetailValue - totalDeliveryCost);
  const overallMarkup = totalDeliveryCost > 0 ? ((totalExpectedProfit / totalDeliveryCost) * 100).toFixed(1) : "0.0";

  // Add a new blank item row to this supplier's delivery (starts clean at zero)
  const handleAddItemRow = () => {
    const newItem: MultiSupplyDeliveryItem = {
      id: `item_row_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      itemId: `custom_${Date.now()}`,
      itemName: "",
      supplyUnitsReceived: 1,
      supplyUnit: "Units",
      retailUnitsAdded: 1,
      retailUnit: "Units",
      conversionRatio: 1,
      lineCost: 0,
      unitCostAtDelivery: 0,
      retailPrice: 0,
      expectedMargin: 0
    };
    setDeliveryItems([...deliveryItems, newItem]);
  };

  // Clear / start blank delivery items
  const handleClearDeliveryItems = () => {
    setDeliveryItems([
      {
        id: `item_row_${Date.now()}_1`,
        itemId: `custom_${Date.now()}_1`,
        itemName: "",
        supplyUnitsReceived: 1,
        supplyUnit: "Units",
        retailUnitsAdded: 1,
        retailUnit: "Units",
        conversionRatio: 1,
        lineCost: 0,
        unitCostAtDelivery: 0,
        retailPrice: 0,
        expectedMargin: 0
      }
    ]);
  };

  // Auto-fill an item from store inventory catalog
  const handleSelectInventoryItem = (rowId: string, invItem: InventoryItem) => {
    setDeliveryItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const sQty = Number(item.supplyUnitsReceived) || 1;
        const ratio = 1;
        const microUnits = sQty * ratio;
        const uCost = Number(invItem.unit_cost) || 0;
        const rPrice = Number(invItem.unit_retail) || 0;
        const lCost = Math.round(microUnits * uCost * 100) / 100;
        return {
          ...item,
          itemId: invItem.id,
          itemName: invItem.name,
          supplyUnit: invItem.unit_type || "Units",
          retailUnit: invItem.unit_type || "Units",
          conversionRatio: 1,
          retailUnitsAdded: microUnits,
          unitCostAtDelivery: uCost,
          lineCost: lCost,
          retailPrice: rPrice,
          expectedMargin: Math.max(0, rPrice - uCost)
        };
      })
    );
  };

  // Update a specific field on a delivery line item with reactive bidirectional math
  const handleUpdateItem = (
    id: string, 
    field: keyof MultiSupplyDeliveryItem, 
    value: any
  ) => {
    setDeliveryItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let parsedVal = value;
        if (
          field === "lineCost" || 
          field === "retailPrice" || 
          field === "supplyUnitsReceived" || 
          field === "conversionRatio" ||
          field === "unitCostAtDelivery"
        ) {
          parsedVal = value === "" ? 0 : Number(value) || 0;
        }

        const updated = { ...item, [field]: parsedVal };

        // 1. Quantities & Ratios Changed
        if (field === "supplyUnitsReceived" || field === "conversionRatio") {
          const sQty = field === "supplyUnitsReceived" ? Number(parsedVal) || 0 : Number(item.supplyUnitsReceived) || 0;
          const ratio = field === "conversionRatio" ? Number(parsedVal) || 1 : Number(item.conversionRatio) || 1;
          const totalMicro = BulkConversionEngine.convertSupplyToRetailUnits(sQty, ratio);
          updated.retailUnitsAdded = totalMicro;

          // If unit cost is known, lineCost should scale with quantity!
          if (Number(item.unitCostAtDelivery) > 0) {
            updated.lineCost = Math.round(totalMicro * Number(item.unitCostAtDelivery) * 100) / 100;
          } else if (Number(updated.lineCost) > 0 && totalMicro > 0) {
            updated.unitCostAtDelivery = Math.round((Number(updated.lineCost) / totalMicro) * 100) / 100;
          }

          if (updated.retailPrice) {
            updated.expectedMargin = Math.max(0, Number(updated.retailPrice) - Number(updated.unitCostAtDelivery || 0));
          }
        }

        // 2. Line Cost (Total for line) Changed directly
        if (field === "lineCost") {
          const cost = Number(parsedVal) || 0;
          updated.lineCost = cost;
          const totalMicro = Number(updated.retailUnitsAdded) > 0 ? Number(updated.retailUnitsAdded) : 1;
          updated.unitCostAtDelivery = Math.round((cost / totalMicro) * 100) / 100;
          if (updated.retailPrice) {
            updated.expectedMargin = Math.max(0, Number(updated.retailPrice) - updated.unitCostAtDelivery);
          }
        }

        // 3. Unit Cost Changed directly -> Line Cost scales automatically
        if (field === "unitCostAtDelivery") {
          const uCost = Number(parsedVal) || 0;
          updated.unitCostAtDelivery = uCost;
          const totalMicro = Number(updated.retailUnitsAdded) > 0 ? Number(updated.retailUnitsAdded) : 1;
          updated.lineCost = Math.round(totalMicro * uCost * 100) / 100;
          if (updated.retailPrice) {
            updated.expectedMargin = Math.max(0, Number(updated.retailPrice) - uCost);
          }
        }

        // 4. Retail Price Changed
        if (field === "retailPrice") {
          const ret = Number(parsedVal) || 0;
          updated.retailPrice = ret;
          updated.expectedMargin = Math.max(0, ret - Number(updated.unitCostAtDelivery || 0));
        }

        return updated;
      })
    );
  };

  // Remove a line item
  const handleRemoveItem = (id: string) => {
    if (deliveryItems.length <= 1) return; // Keep at least one
    setDeliveryItems(deliveryItems.filter((i) => i.id !== id));
  };

  // Apply Common Multi-Item Supplier Presets
  const applyMultiPreset = (presetType: "BROOKSIDE" | "BROADWAY" | "MEGA_WHOLESALE") => {
    if (presetType === "BROOKSIDE") {
      setSupplierName("Brookside Dairy Kenya Ltd");
      setSupplierNationalId("22940184");
      setSupplierPhone("0722 849 101");
      setDeliveryNoteNumber(`BK-${Math.floor(1000 + Math.random() * 9000)}`);
      setPaymentMode("MPESA");
      setDeliveryItems([
        {
          id: `item_${Date.now()}_1`,
          itemId: 1,
          itemName: "Brookside Fresh Milk 500ml",
          supplyUnitsReceived: 2,
          supplyUnit: "Crate (24pkts)",
          retailUnitsAdded: 48,
          retailUnit: "Packets",
          conversionRatio: 24,
          lineCost: 2640,
          unitCostAtDelivery: 55,
          retailPrice: 65,
          expectedMargin: 10
        },
        {
          id: `item_${Date.now()}_2`,
          itemId: 2,
          itemName: "Brookside Lala / Mala 500ml",
          supplyUnitsReceived: 1,
          supplyUnit: "Crate (24pkts)",
          retailUnitsAdded: 24,
          retailUnit: "Packets",
          conversionRatio: 24,
          lineCost: 1560,
          unitCostAtDelivery: 65,
          retailPrice: 80,
          expectedMargin: 15
        },
        {
          id: `item_${Date.now()}_3`,
          itemId: 3,
          itemName: "Brookside Cup Yoghurt 250ml",
          supplyUnitsReceived: 1,
          supplyUnit: "Tray (12cups)",
          retailUnitsAdded: 12,
          retailUnit: "Cups",
          conversionRatio: 12,
          lineCost: 840,
          unitCostAtDelivery: 70,
          retailPrice: 85,
          expectedMargin: 15
        }
      ]);
    } else if (presetType === "BROADWAY") {
      setSupplierName("Broadway Bakeries Ltd");
      setSupplierNationalId("26884019");
      setSupplierPhone("0733 901 442");
      setDeliveryNoteNumber(`BW-${Math.floor(1000 + Math.random() * 9000)}`);
      setPaymentMode("CASH");
      setDeliveryItems([
        {
          id: `item_${Date.now()}_1`,
          itemId: 11,
          itemName: "Broadways White Bread 400g",
          supplyUnitsReceived: 25,
          supplyUnit: "Loaves",
          retailUnitsAdded: 25,
          retailUnit: "Loaves",
          conversionRatio: 1,
          lineCost: 1500,
          unitCostAtDelivery: 60,
          retailPrice: 70,
          expectedMargin: 10
        },
        {
          id: `item_${Date.now()}_2`,
          itemId: 12,
          itemName: "Broadways Brown Bread 400g",
          supplyUnitsReceived: 10,
          supplyUnit: "Loaves",
          retailUnitsAdded: 10,
          retailUnit: "Loaves",
          conversionRatio: 1,
          lineCost: 650,
          unitCostAtDelivery: 65,
          retailPrice: 75,
          expectedMargin: 10
        },
        {
          id: `item_${Date.now()}_3`,
          itemId: 13,
          itemName: "Sweet Buns & Scones (Pack 6)",
          supplyUnitsReceived: 15,
          supplyUnit: "Packs",
          retailUnitsAdded: 15,
          retailUnit: "Packs",
          conversionRatio: 1,
          lineCost: 600,
          unitCostAtDelivery: 40,
          retailPrice: 50,
          expectedMargin: 10
        }
      ]);
    } else if (presetType === "MEGA_WHOLESALE") {
      setSupplierName("Nairobi Mega Wholesalers & Distributors");
      setSupplierNationalId("28419203");
      setSupplierPhone("0711 445 890");
      setDeliveryNoteNumber(`NW-${Math.floor(1000 + Math.random() * 9000)}`);
      setPaymentMode("MPESA");
      setDeliveryItems([
        {
          id: `item_${Date.now()}_1`,
          itemId: 14,
          itemName: "Mumias Sugar",
          supplyUnitsReceived: 1,
          supplyUnit: "Bag (50kg)",
          retailUnitsAdded: 200,
          retailUnit: "Quarter-Kg (250g)",
          conversionRatio: 200,
          lineCost: 6800,
          unitCostAtDelivery: 34,
          retailPrice: 40,
          expectedMargin: 6
        },
        {
          id: `item_${Date.now()}_2`,
          itemId: 15,
          itemName: "Unga Jogoo 2kg",
          supplyUnitsReceived: 4,
          supplyUnit: "Bale (12pkts)",
          retailUnitsAdded: 48,
          retailUnit: "Packets",
          conversionRatio: 12,
          lineCost: 6000,
          unitCostAtDelivery: 125,
          retailPrice: 145,
          expectedMargin: 20
        },
        {
          id: `item_${Date.now()}_3`,
          itemId: 16,
          itemName: "Golden Fry Cooking Oil 1L",
          supplyUnitsReceived: 2,
          supplyUnit: "Carton (12btls)",
          retailUnitsAdded: 24,
          retailUnit: "Bottles",
          conversionRatio: 12,
          lineCost: 6000,
          unitCostAtDelivery: 250,
          retailPrice: 285,
          expectedMargin: 35
        }
      ]);
    } else if (presetType === "COMBO_420") {
      setSupplierName("Nairobi Mega Wholesalers & Distributors");
      setSupplierNationalId("28419203");
      setSupplierPhone("0711 445 890");
      setDeliveryNoteNumber(`DN-${Math.floor(1000 + Math.random() * 9000)}`);
      setPaymentMode("MPESA");
      setDeliveryItems([
        {
          id: `item_${Date.now()}_1`,
          itemId: 14,
          itemName: "Mumias Sugar 1kg",
          supplyUnitsReceived: 1,
          supplyUnit: "Packet",
          retailUnitsAdded: 1,
          retailUnit: "packets",
          conversionRatio: 1,
          lineCost: 140,
          unitCostAtDelivery: 140,
          retailPrice: 165,
          expectedMargin: 25
        },
        {
          id: `item_${Date.now()}_2`,
          itemId: 7,
          itemName: "Cooking Oil 1L",
          supplyUnitsReceived: 1,
          supplyUnit: "Bottle",
          retailUnitsAdded: 1,
          retailUnit: "bottles",
          conversionRatio: 1,
          lineCost: 280,
          unitCostAtDelivery: 280,
          retailPrice: 330,
          expectedMargin: 50
        }
      ]);
    }
  };

  // State for updating past delivery dates
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [editDeliveryDateVal, setEditDeliveryDateVal] = useState("");

  const handleSaveDeliveryDate = (deliveryId: string) => {
    if (!editDeliveryDateVal) return;
    setRecentDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              date: editDeliveryDateVal,
              timestamp: `${editDeliveryDateVal}, ${d.timestamp.includes(",") ? d.timestamp.split(",")[1].trim() : "12:00 PM"}`
            }
          : d
      )
    );
    setEditingDeliveryId(null);
    setSuccessMsg(`Delivery date updated to ${editDeliveryDateVal} successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Submit complete multi-item delivery to master state
  const handleSubmitMultiDelivery = (e: React.FormEvent) => {
    e.preventDefault();

    if (deliveryItems.length === 0) return;

    const dateLabel = deliveryDate === new Date().toISOString().slice(0, 10) ? "Today" : deliveryDate;
    const newDelivery: MultiSupplyDelivery = {
      id: `deliv_${Date.now()}`,
      supplierName,
      supplierNationalId: supplierNationalId.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
      deliveryNoteNumber,
      paymentMode,
      date: deliveryDate,
      timestamp: `${dateLabel}, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      totalCost: totalDeliveryCost,
      totalRetailValue,
      items: deliveryItems
    };

    onLogMultiDelivery(newDelivery);
    setRecentDeliveries([newDelivery, ...recentDeliveries]);

    const itemsSummary = deliveryItems
      .map((i) => `${i.supplyUnitsReceived} ${i.supplyUnit} ${i.itemName}`)
      .join(", ");

    setSuccessMsg(
      `Multi-item delivery logged on ${deliveryDate}! ${deliveryItems.length} products from ${supplierName} recorded (${itemsSummary}). Added ${currency} ${totalRetailValue.toLocaleString()} to active shelf value. Margin: +${currency} ${totalExpectedProfit.toLocaleString()} (${overallMarkup}%). Total Delivery Cost: ${currency} ${totalDeliveryCost.toLocaleString()}.`
    );
    setTimeout(() => setSuccessMsg(null), 8000);
  };

  // Add New Supplier Handler: Guaranteed to only record once no matter how many times Enter is pressed
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingSupplier) return;
    if (!newCompName.trim() || !newNationalId.trim()) return;

    setIsSubmittingSupplier(true);

    const isExisting = suppliersList.some(
      (s) => isSameSupplier(s, { company: newCompName.trim(), national_id: newNationalId.trim() })
    );

    if (onAddSupplier) {
      onAddSupplier({
        name: newDriverName.trim() || newCompName.trim(),
        company: newCompName.trim(),
        driver_name: newDriverName.trim() || undefined,
        phone: newPhone.trim() || "07XX XXX XXX",
        national_id: newNationalId.trim(),
        category: newCategory,
        payment_preference: newPreference,
        till_or_account: newTill.trim() || undefined,
        payment_terms: newTerms
      });
    }

    // Auto-populate current delivery form
    setSupplierName(newCompName.trim());
    setSupplierNationalId(newNationalId.trim());
    setSupplierPhone(newPhone.trim() || "07XX XXX XXX");

    setIsAddSupplierOpen(false);
    setNewCompName("");
    setNewDriverName("");
    setNewNationalId("");
    setNewPhone("");
    setNewTill("");
    setIsSubmittingSupplier(false);

    if (isExisting) {
      setSuccessMsg(`Supplier "${newCompName.trim()}" was already registered — updated details in-place without duplicates!`);
    } else {
      setSuccessMsg(`Registered new supplier "${newCompName.trim()}" with National ID ${newNationalId.trim()}! Recorded once without duplicates.`);
    }
    setTimeout(() => setSuccessMsg(null), 7000);
  };

  const handleSelectExistingSupplier = (suppId: string) => {
    const s = suppliersList.find((sup) => sup.id === suppId);
    if (!s) return;
    setSupplierName(s.company || s.name);
    setSupplierNationalId(s.national_id);
    setSupplierPhone(s.phone);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Truck className="text-cyan-400" size={24} /> Inbound Supply Matrix // Multi-SKU Intake
            </h2>
            <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
              Atomic Vector Intake
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Inbound cargo vectors. Atomic intake with verified <strong>Bulk-to-Micro Conversion</strong>. Zero drift.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* QUICK PRESETS ROW (MULTI-ITEM SHIPMENTS) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" /> Presets // Inbound Vectors:
          </div>
          <button
            type="button"
            onClick={handleClearDeliveryItems}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-mono cursor-pointer transition border border-slate-700 flex items-center gap-1"
          >
            <RefreshCw size={11} className="text-slate-400" />
            <span>Reset Intake</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => applyMultiPreset("COMBO_420" as any)}
            className="p-3 bg-[#0c141d] hover:bg-[#121f2d] border-2 border-cyan-500/50 rounded-xl text-left transition cursor-pointer text-xs shadow-md shadow-cyan-950/40"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white block">Sugar &amp; Oil Drop ({currency} 420)</span>
              <span className="text-[10px] text-cyan-300 font-mono font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/40">140 + 280</span>
            </div>
            <span className="text-[10px] text-cyan-200/80 block mt-1">
              Mumias Sugar ({currency} 140) + Cooking Oil ({currency} 280) &bull; Exact {currency} 420 Delivery
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyMultiPreset("BROOKSIDE")}
            className="p-3 bg-[#0a1610] hover:bg-[#0f241a] border border-cyan-500/30 rounded-xl text-left transition cursor-pointer text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white block">Brookside Dairy Van (3 Items)</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">3 Products</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              2 Crates Milk (48 pkts) + 1 Crate Mala (24 pkts) + 1 Tray Yoghurt
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyMultiPreset("BROADWAY")}
            className="p-3 bg-[#0a1610] hover:bg-[#0f241a] border border-amber-500/30 rounded-xl text-left transition cursor-pointer text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white block">Broadway Bakeries (3 Items)</span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">3 Products</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              25 White Loaves + 10 Brown Loaves + 15 Sweet Buns
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyMultiPreset("MEGA_WHOLESALE")}
            className="p-3 bg-[#0a1610] hover:bg-[#0f241a] border border-emerald-500/30 rounded-xl text-left transition cursor-pointer text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white block">Mega Wholesaler (3 Items)</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">3 Products</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              1 Bag Sugar (200 quarters) + 4 Bales Unga (48 pkts) + 2 Ctns Cooking Oil
            </span>
          </button>
        </div>
      </div>

      {/* MULTI-ITEM DELIVERY LOGGING FORM */}
      <form 
        onSubmit={handleSubmitMultiDelivery} 
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
            e.preventDefault();
          }
        }}
        className="bg-[#121214] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-5"
      >
        
        {/* REGISTERED SUPPLIERS SELECTOR & ADD SUPPLIER BAR */}
        <div className="p-3 bg-[#09090b] rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono text-slate-400 text-[11px] font-bold uppercase shrink-0">
              Quick Load Supplier:
            </span>
            <select
              onChange={(e) => {
                if (e.target.value === "ADD_NEW") {
                  setIsAddSupplierOpen(true);
                } else if (e.target.value) {
                  handleSelectExistingSupplier(e.target.value);
                }
              }}
              className="bg-[#0a1610] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs w-full max-w-md focus:border-cyan-500 cursor-pointer"
            >
              <option value="">-- Choose from Registered Suppliers ({suppliersList.length}) --</option>
              {suppliersList.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.company || sup.name} (National ID: {sup.national_id}) &bull; {sup.category}
                </option>
              ))}
              <option value="ADD_NEW">+ Add New Supplier / Distributor...</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsAddSupplierOpen(true)}
            className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={14} /> Add New Supplier
          </button>
        </div>

        {/* SHIPMENT & SUPPLIER HEADER FIELDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pb-4 border-b border-slate-800 text-xs">
          
          {/* EDITABLE DELIVERY / RECEIPT DATE */}
          <div className="bg-[#09090b] border-2 border-amber-500/50 rounded-xl p-2.5 space-y-1.5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-amber-300 font-mono uppercase text-[10px] font-bold flex items-center gap-1">
                <Calendar size={13} className="text-amber-400" />
                Delivery / Receipt Date *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDeliveryDate(new Date().toISOString().slice(0, 10))}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                    deliveryDate === new Date().toISOString().slice(0, 10)
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                    setDeliveryDate(y);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                    deliveryDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  title="Doing yesterday's receipts today"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full bg-[#0a1610] border border-amber-500/40 rounded-lg p-1.5 text-white font-mono text-xs focus:border-amber-400"
            />
            <span className="text-[10px] text-slate-400 font-mono block">
              Editable date for backdating yesterday's delivery receipts
            </span>
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Supplier / Distributor Name</label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Brookside Dairy, Bidco, Broadway"
              className="w-full bg-[#09090b] border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px] flex items-center justify-between">
              <span>National ID (Driver)</span>
              <span className="text-[9px] text-emerald-400">OTC Deposit</span>
            </label>
            <input
              type="text"
              value={supplierNationalId}
              onChange={(e) => setSupplierNationalId(e.target.value)}
              placeholder="e.g. 22940184"
              className="w-full bg-[#09090b] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Settlement Channel</label>
            <select
              value={paymentMode}
              onChange={(e: any) => setPaymentMode(e.target.value)}
              className="w-full bg-[#09090b] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500"
            >
              <option value="MPESA">M-Pesa Till / Send Money</option>
              <option value="CASH">Physical Drawer Cash</option>
              <option value="EQUITEL">Equitel Paybill Line</option>
              <option value="CREDIT">Supplier Credit (Pay Later)</option>
            </select>
          </div>
        </div>

        {/* LINE ITEMS TABLE (SEVERAL THINGS DELIVERED TOGETHER) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListPlus size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Delivered Items in this Shipment ({deliveryItems.length} Products)
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddItemRow}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={14} /> Add Another Item From This Supplier
            </button>
          </div>

          <div className="space-y-3">
            {deliveryItems.map((item, index) => (
              <div 
                key={item.id}
                className="p-4 bg-[#09090b] border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs">
                  <span className="font-bold text-slate-300 font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400">
                      {index + 1}
                    </span>
                    Line Item #{index + 1}
                  </span>

                  {deliveryItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                  {/* Product Name with Catalog Quick-Match */}
                  <div className="sm:col-span-2 lg:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase">Product Name</label>
                      <span className="text-[9px] text-cyan-400 font-mono">Catalog Match</span>
                    </div>
                    <input
                      type="text"
                      list={`inv-list-${item.id}`}
                      required
                      value={item.itemName}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateItem(item.id, "itemName", val);
                        const matched = inventory.find(
                          (inv) => inv.name.toLowerCase() === val.trim().toLowerCase()
                        );
                        if (matched) {
                          handleSelectInventoryItem(item.id, matched);
                        }
                      }}
                      placeholder="e.g. Mumias Sugar 1kg, Cooking Oil 1L..."
                      className="w-full bg-[#0c0c0e] border border-slate-700 rounded-xl p-2 text-white font-medium focus:border-cyan-500"
                    />
                    <datalist id={`inv-list-${item.id}`}>
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.name}>
                          {currency} {inv.unit_cost} cost &bull; {currency} {inv.unit_retail} retail
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Supply Quantity & Packaging */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Wholesale Qty</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={item.supplyUnitsReceived}
                        onChange={(e) => handleUpdateItem(item.id, "supplyUnitsReceived", e.target.value)}
                        className="w-16 bg-[#0c0c0e] border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
                      />
                      <input
                        type="text"
                        value={item.supplyUnit}
                        onChange={(e) => handleUpdateItem(item.id, "supplyUnit", e.target.value)}
                        placeholder="Pack / Unit"
                        className="w-full bg-[#0c0c0e] border border-slate-700 rounded-xl p-2 text-white text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Packaging Split Ratio & Retail Units */}
                  <div>
                    <label className="text-[10px] text-cyan-400 block mb-1 font-mono uppercase">
                      Split Ratio (&rarr; Retail)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={item.conversionRatio}
                        onChange={(e) => handleUpdateItem(item.id, "conversionRatio", e.target.value)}
                        className="w-16 bg-[#0c0c0e] border border-cyan-500/50 rounded-xl p-2 text-cyan-400 font-mono font-bold"
                      />
                      <span className="text-[11px] font-mono text-slate-300">
                        = {item.retailUnitsAdded} {item.retailUnit}
                      </span>
                    </div>
                  </div>

                  {/* Line Cost ({currency}) - Exact Line Total */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-amber-300 font-mono uppercase font-bold">
                        Line Cost ({currency}) *
                      </label>
                      <span className="text-[9px] text-slate-400 font-mono">
                        @{currency} {item.unitCostAtDelivery}/u
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={item.lineCost || ""}
                      onChange={(e) => handleUpdateItem(item.id, "lineCost", e.target.value)}
                      placeholder="e.g. 140 or 280"
                      className="w-full bg-[#0c0c0e] border-2 border-amber-500/60 rounded-xl p-2 text-amber-300 font-mono font-bold focus:border-amber-400 text-sm"
                    />
                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                      Subtotal: {currency} {Number(item.lineCost || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Retail Selling Price */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase">
                        Retail Price ({currency})
                      </label>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">
                        +{currency} {item.expectedMargin}/u
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={item.retailPrice || ""}
                      onChange={(e) => handleUpdateItem(item.id, "retailPrice", e.target.value)}
                      placeholder="e.g. 165 or 330"
                      className="w-full bg-[#0c0c0e] border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
                    />
                    <span className="text-[9px] text-emerald-400 font-mono block mt-0.5">
                      Shelf: {currency} {(Number(item.retailUnitsAdded || 0) * Number(item.retailPrice || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MULTI-ITEM DELIVERY SUMMARY CARD & SUBMISSION */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono w-full sm:w-auto">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Total Items</span>
              <strong className="text-white text-sm">{deliveryItems.length} Products</strong>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Total Delivery Cost</span>
              <strong className="text-amber-400 text-sm">
                {currency} {totalDeliveryCost.toLocaleString()}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Total Retail Shelf Value</span>
              <strong className="text-cyan-400 text-sm">
                {currency} {totalRetailValue.toLocaleString()}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Potential Batch Profit</span>
              <strong className="text-emerald-400 text-sm">
                +{currency} {totalExpectedProfit.toLocaleString()} ({overallMarkup}%)
              </strong>
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 font-mono shrink-0"
          >
            <Check size={16} />
            <span>Log Multi-Item Delivery ({deliveryItems.length} Items &rarr; {currency} {totalDeliveryCost.toLocaleString()})</span>
          </button>
        </div>
      </form>

      {/* RECENT SHIPMENTS AUDIT LOG (SHOWING MULTI-ITEM DELIVERIES) */}
      <div className="bg-[#121214] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Truck size={15} className="text-cyan-400" /> Recent Supplier Deliveries ({recentDeliveries.length} Shipments)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Real-time incoming stock audit</span>
        </div>

        <div className="space-y-3">
          {recentDeliveries.map((delivery) => (
            <div 
              key={delivery.id}
              className="p-4 bg-[#09090b] border border-slate-800 rounded-xl space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{delivery.supplierName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {delivery.deliveryNoteNumber}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {delivery.items.length} Products
                  </span>
                  {delivery.supplierNationalId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                      National ID: {delivery.supplierNationalId}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono">
                  {editingDeliveryId === delivery.id ? (
                    <div className="flex items-center gap-1.5 bg-[#0a1610] p-1 rounded-lg border border-amber-500/50">
                      <input
                        type="date"
                        value={editDeliveryDateVal}
                        onChange={(e) => setEditDeliveryDateVal(e.target.value)}
                        className="bg-[#09090b] text-white text-[11px] px-1.5 py-0.5 rounded border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveDeliveryDate(delivery.id)}
                        className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDeliveryId(null)}
                        className="text-slate-400 hover:text-white text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDeliveryId(delivery.id);
                        setEditDeliveryDateVal(delivery.date || (delivery.timestamp.match(/\d{4}-\d{2}-\d{2}/) ? delivery.timestamp.match(/\d{4}-\d{2}-\d{2}/)![0] : new Date().toISOString().slice(0, 10)));
                      }}
                      className="text-slate-300 hover:text-amber-300 text-[11px] flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded cursor-pointer transition border border-transparent hover:border-amber-500/30"
                      title="Click to edit date"
                    >
                      <Calendar size={11} className="text-amber-400" />
                      <span>{delivery.timestamp}</span>
                      <Edit3 size={10} className="text-slate-500 hover:text-amber-300 ml-0.5" />
                    </button>
                  )}
                  <span className="font-bold text-cyan-400">
                    Total: {currency} {delivery.totalCost.toLocaleString()} ({delivery.paymentMode})
                  </span>
                </div>
              </div>

              {/* Items Breakdown inside this shipment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {delivery.items.map((item) => (
                  <div key={item.id} className="p-2 bg-[#0c0c0e] rounded-lg border border-slate-800/80 text-[11px]">
                    <div className="font-semibold text-white truncate">{item.itemName}</div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-0.5">
                      <span>{item.supplyUnitsReceived} {item.supplyUnit} &rarr; +{item.retailUnitsAdded} {item.retailUnit}</span>
                      <span className="text-emerald-400 font-bold">{currency} {item.lineCost.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUPPLIERS & DISTRIBUTORS DIRECTORY (OTC & AGENCY DEPOSITS) */}
      {/* ======================================================== */}
      <div className="bg-[#121214] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="text-cyan-400" size={18} />
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Suppliers &amp; Distributors Directory ({suppliersList.length} Partners)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified distributors, delivery drivers, and National IDs used for cash deposits at Equity Agent, KCB Mtaani, and Co-op Kwa Jirani.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddSupplierOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow shrink-0"
          >
            <Plus size={15} /> Add New Supplier / Distributor
          </button>
        </div>

        {/* SUPPLIER CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliersList.map((sup) => (
            <div
              key={sup.id}
              className="p-4 bg-[#09090b] border border-slate-800 rounded-xl space-y-2.5 text-xs hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div>
                  <div className="font-bold text-white text-sm font-sans">{sup.company || sup.name}</div>
                  {sup.driver_name && (
                    <div className="text-[11px] text-slate-400">Rep / Driver: {sup.driver_name}</div>
                  )}
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 inline-block mt-0.5">
                    {sup.category}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono block">Pref. Payment</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    {sup.payment_preference.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* National ID & Phone */}
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">National ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {sup.national_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(sup.national_id);
                        setCopiedSupplierId(sup.id);
                        setTimeout(() => setCopiedSupplierId(null), 2000);
                      }}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 cursor-pointer"
                      title="Copy National ID"
                    >
                      {copiedSupplierId === sup.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Phone:</span>
                  <span className="text-white">{sup.phone}</span>
                </div>

                {sup.till_or_account && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Till / Acc:</span>
                    <span className="text-amber-400">{sup.till_or_account}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  Orders: {currency} {(sup.total_orders_cost || 0).toLocaleString()}
                </span>

                <div className="flex items-center gap-1.5 justify-end flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSupplier(sup)}
                    className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                    title="Edit Supplier Account (fix company name, phone, or National ID)"
                  >
                    <Edit3 size={11} /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDeleteSupplier(sup)}
                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                    title="Delete supplier entered wrong"
                  >
                    <Trash2 size={11} /> Delete
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectExistingSupplier(sup.id);
                      const el = document.getElementById("multi-delivery-form");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer"
                  >
                    Load &uarr;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADD NEW SUPPLIER / DISTRIBUTOR MODAL                     */}
      {/* ======================================================== */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Building2 size={18} className="text-emerald-400" /> Register New Supplier / Distributor
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAddSupplierOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Register suppliers with verified <strong>National ID numbers</strong> so your counter staff can deposit directly to delivery drivers over the counter or at agency banking points.
            </p>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Company / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unga Group Eldoret, Kapa Oil, Broadway Bakeries"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Driver / Contact Rep Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Peter Mwangi (Route Van 3)"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    National ID Number * <span className="text-[10px] text-emerald-400">(For OTC Deposit)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 28419203"
                    value={newNationalId}
                    onChange={(e) => setNewNationalId(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contact Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0722 849 101"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Supply Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Dairy">Dairy &amp; Chilled (Milk, Mala, Yoghurt)</option>
                    <option value="Bakery">Bakery (Bread, Scones, Cakes)</option>
                    <option value="Flour & Cereals">Flour &amp; Cereals (Maize, Wheat Unga)</option>
                    <option value="Cooking Oils">Cooking Oils &amp; Fats</option>
                    <option value="Sugar & Sweeteners">Sugar &amp; Sweeteners</option>
                    <option value="Household">Household &amp; Cleaning</option>
                    <option value="Beverages">Beverages &amp; Soft Drinks</option>
                    <option value="General Wholesale">General Wholesale Commodities</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Payment Channel Preference</label>
                  <select
                    value={newPreference}
                    onChange={(e: any) => setNewPreference(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="NATIONAL_ID_DEPOSIT">National ID Direct Deposit (Agency/OTC)</option>
                    <option value="MPESA_TILL">M-Pesa Buy Goods / Till Number</option>
                    <option value="CASH_DRAWER">Physical Cash from Drawer</option>
                    <option value="BANK_TRANSFER">Bank Account Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Till / Paybill / Account #</label>
                  <input
                    type="text"
                    placeholder="e.g. Till 884910"
                    value={newTill}
                    onChange={(e) => setNewTill(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Default Payment Terms</label>
                <select
                  value={newTerms}
                  onChange={(e) => setNewTerms(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="Cash on Delivery">Cash on Delivery (Pay upon delivery)</option>
                  <option value="Weekly Settlement">Weekly Friday Settlement</option>
                  <option value="Net 7 Days">Net 7 Days Credit</option>
                  <option value="Net 14 Days">Net 14 Days Credit</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupplier}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl cursor-pointer text-xs shadow-lg shadow-emerald-500/20"
                >
                  {isSubmittingSupplier ? "Registering..." : "Register Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT SUPPLIER PROFILE MODAL (FIX PHONE, NATIONAL ID, ETC) */}
      {/* ======================================================== */}
      {isEditSupplierOpen && editingSupplier && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121822] border-2 border-cyan-500/40 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl text-xs font-sans">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Edit3 size={18} className="text-cyan-400" /> Edit Supplier Account: {editingSupplier.company || editingSupplier.name}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsEditSupplierOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Correct supplier details entered wrong, including driver names, phone numbers, or Kenyan National ID digits for bank and agency deposits.
            </p>

            <form onSubmit={handleExecuteEditSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Company / Business Name *</label>
                <input
                  type="text"
                  required
                  value={editCompName}
                  onChange={(e) => setEditCompName(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Driver / Route Rep Name</label>
                  <input
                    type="text"
                    value={editDriverName}
                    onChange={(e) => setEditDriverName(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Supplier Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Flour & Cereals">Flour &amp; Cereals</option>
                    <option value="Cooking & Oils">Cooking &amp; Oils</option>
                    <option value="Sugar & Sweeteners">Sugar &amp; Sweeteners</option>
                    <option value="Bakery & Confectionery">Bakery &amp; Confectionery</option>
                    <option value="Beverages & Soda">Beverages &amp; Soda</option>
                    <option value="General Merchandise">General Merchandise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Kenyan National ID / Passport *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNationalId}
                    onChange={(e) => setEditNationalId(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-emerald-400 mt-0.5 block font-mono">Fix any mistyped digits</span>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Preferred Payment Channel</label>
                  <select
                    value={editPreference}
                    onChange={(e) => setEditPreference(e.target.value as any)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="NATIONAL_ID_DEPOSIT">Equity / KCB Agent National ID</option>
                    <option value="MPESA_TILL">M-Pesa Buy Goods Till</option>
                    <option value="CASH_DRAWER">Cash Drawer on Delivery</option>
                    <option value="BANK_TRANSFER">Bank Paybill / Account</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Till / Account Number</label>
                  <input
                    type="text"
                    value={editTill}
                    onChange={(e) => setEditTill(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={editTerms}
                  onChange={(e) => setEditTerms(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditSupplierOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                >
                  <Check size={14} /> Save Supplier Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRM DELETE SUPPLIER ACCOUNT MODAL                    */}
      {/* ======================================================== */}
      {isDeleteSupplierOpen && supplierToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#180f12] border-2 border-red-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-red-950 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Trash2 size={18} className="text-red-400" /> Delete Supplier Account
              </h3>
              <button 
                type="button"
                onClick={() => setIsDeleteSupplierOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-[#0f090b] rounded-xl border border-red-900/40 space-y-1 font-mono text-xs">
              <div className="text-white font-bold text-sm font-sans">{supplierToDelete.company || supplierToDelete.name}</div>
              {supplierToDelete.driver_name && (
                <div className="text-slate-400">Driver/Rep: {supplierToDelete.driver_name}</div>
              )}
              <div className="text-slate-400">Phone: {supplierToDelete.phone}</div>
              <div className="text-emerald-400">National ID: {supplierToDelete.national_id}</div>
              <div className="text-slate-500 text-[11px] pt-1">
                Total Orders Logged: {currency} {(supplierToDelete.total_orders_cost || 0).toLocaleString()}
              </div>
            </div>

            <p className="text-amber-200/90 text-[11px] leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <strong>Data Preservation Guarantee:</strong> Deleting this supplier removes only this supplier profile record. All existing stock batches in your warehouse and past financial ledgers remain completely preserved.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteSupplierOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteSupplier}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl cursor-pointer shadow flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Yes, Delete Supplier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
