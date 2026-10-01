import {
  InventoryItem,
  MoneyOutExpense,
  SupplyBatch,
  SalesLedgerEntry,
  Merchant,
  Supplier,
  SupplierDelivery,
} from "../types";
import { AppStorage } from "./storage";

export interface RestockParams {
  itemId?: string;
  itemName: string;
  category?: string;
  quantityPurchased: number;
  totalPurchaseCost: number;
  unitSellingPrice: number;
  supplierName: string;
  receiptReference?: string;
  notes?: string;
  unitOfMeasure?: "units" | "crates" | "bales" | "packets" | "bottles" | "kg" | "sachets" | "tins" | "boxes";
  remainingPreviousBatch?: number; // Unsold units left on shelf from previous batch (e.g. 2 loaves remaining from 4)
  spoilagePreviousBatch?: number; // Broken/damaged/expired units
  receivedDate?: string;
  customCreatedAt?: string;
}

export interface RestockResult {
  moneyOutEntry: MoneyOutExpense;
  newBatch: SupplyBatch;
  closedBatch?: SupplyBatch;
  generatedSale?: SalesLedgerEntry;
  updatedItem: InventoryItem;
  summaryMessage: string;
  turnaroundVelocityText?: string;
}

export class RestockEngine {
  /**
   * Core supply-driven velocity processor:
   * 1. Logs expense in money_out
   * 2. Finds existing active batch (Batch N) and derives sales:
   *    Sold = (Batch N Initial Qty) - (Remaining Unsold on Shelf) - (Spoilage)
   * 3. Calculates velocity (elapsed time between batches)
   * 4. Injects sales ledger record
   * 5. Activates Batch N+1 and sets active stock = (Incoming Qty) + (Remaining Unsold)
   */
  static processRestock(params: RestockParams, merchant?: Merchant): RestockResult {
    const activeMerchant = merchant || AppStorage.getMerchant();
    const items = AppStorage.getItems();
    const batches = AppStorage.getBatches();
    const expenses = AppStorage.getExpenses();
    const sales = AppStorage.getSales();

    const timestamp = params.receivedDate || params.customCreatedAt || new Date().toISOString();
    const nowTime = new Date(timestamp).getTime();

    // 1. Calculate Unit Cost & Selling Prices
    const qty = Math.max(1, Number(params.quantityPurchased) || 1);
    const totalCost = Number(params.totalPurchaseCost) || 0;
    const unitCost = Number((totalCost / qty).toFixed(2));
    const unitSelling = Number(Number(params.unitSellingPrice).toFixed(2));

    // 2. Find or create item
    let item = items.find(
      (i) =>
        (params.itemId && i.id === params.itemId) ||
        i.name.trim().toLowerCase() === params.itemName.trim().toLowerCase()
    );

    const isNewItem = !item;
    if (!item) {
      item = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        merchant_id: activeMerchant.id,
        name: params.itemName.trim(),
        category: params.category || "General Goods",
        unit_cost_price: unitCost,
        unit_selling_price: unitSelling,
        current_stock_qty: 0,
        unit_of_measure: params.unitOfMeasure || "units",
        reorder_point: Math.max(2, Math.round(qty * 0.25)),
        total_batches_count: 0,
        lifetime_units_sold: 0,
        lifetime_revenue: 0,
        lifetime_profit: 0,
      };
    } else {
      item.unit_cost_price = unitCost;
      item.unit_selling_price = unitSelling;
      if (params.category) item.category = params.category;
      if (params.unitOfMeasure) item.unit_of_measure = params.unitOfMeasure;
    }

    // 3. Find active batch for this item (Batch N)
    const activeBatchIndex = batches.findIndex(
      (b) => b.item_id === item!.id && b.status === "ACTIVE"
    );

    let closedBatch: SupplyBatch | undefined;
    let generatedSale: SalesLedgerEntry | undefined;
    let velocityHours = 0;
    let velocityDays = 0;
    let unitsPerDay = 0;
    let velocityText = "";
    let carriedForwardQty = 0;

    if (activeBatchIndex !== -1) {
      const prevBatch = batches[activeBatchIndex];
      const batchStartTime = new Date(prevBatch.received_at).getTime();
      const elapsedMs = Math.max(1000 * 60 * 30, nowTime - batchStartTime); // min 30 mins
      velocityHours = Number((elapsedMs / (1000 * 3600)).toFixed(1));
      velocityDays = Number((elapsedMs / (1000 * 3600 * 24)).toFixed(2));

      // Realize sales: Initial Qty - Remaining Unsold on Shelf - Spoilage
      const remainingUnsold = Math.max(0, Math.min(prevBatch.initial_qty, Number(params.remainingPreviousBatch) || 0));
      carriedForwardQty = remainingUnsold;
      const spoilage = Math.max(0, Math.min(prevBatch.initial_qty - remainingUnsold, Number(params.spoilagePreviousBatch) || 0));
      
      const qtySold = Math.max(0, prevBatch.initial_qty - remainingUnsold - spoilage);
      const revenue = Number((qtySold * prevBatch.unit_selling_price).toFixed(2));
      const costOfGoods = Number((qtySold * prevBatch.unit_cost_price).toFixed(2));
      const profit = Number((revenue - costOfGoods).toFixed(2));
      const marginPct = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0;

      unitsPerDay = velocityDays > 0 ? Number((qtySold / velocityDays).toFixed(1)) : qtySold;

      // Close Batch N
      prevBatch.status = "CONSUMED_SOLD";
      prevBatch.closed_at = timestamp;
      prevBatch.remaining_qty = 0; // Rolled into active shelf stock
      prevBatch.spoilage_loss_qty = spoilage;
      prevBatch.notes = `Batch #${prevBatch.batch_number} closed upon Batch #${prevBatch.batch_number + 1} receipt. ${qtySold} sold, ${remainingUnsold} carried forward, ${spoilage} spoilage.`;
      closedBatch = { ...prevBatch };

      // Inject into Sales Ledger if any units were sold
      if (qtySold > 0) {
        generatedSale = {
          id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          merchant_id: activeMerchant.id,
          item_id: item.id,
          item_name: item.name,
          batch_id: prevBatch.id,
          batch_number: prevBatch.batch_number,
          qty_sold: qtySold,
          unit_cost_price: prevBatch.unit_cost_price,
          unit_selling_price: prevBatch.unit_selling_price,
          total_revenue: revenue,
          total_cost: costOfGoods,
          total_profit: profit,
          gross_margin_percent: marginPct,
          sales_velocity_hours: velocityHours,
          sales_velocity_days: velocityDays,
          units_per_day: unitsPerDay,
          batch_start_date: prevBatch.received_at,
          batch_end_date: timestamp,
          trigger_reason: "RESTOCK_ARRIVAL",
          notes: `Supply-triggered sales: Batch #${prevBatch.batch_number} (${qtySold} ${item.unit_of_measure} sold out of ${prevBatch.initial_qty}, ${remainingUnsold} on shelf) in ${
            velocityHours < 24 ? `${velocityHours}h` : `${velocityDays} days`
          } (~${unitsPerDay} units/day).`,
          created_at: timestamp,
        };

        sales.unshift(generatedSale);

        // Update lifetime stats
        item.lifetime_units_sold += qtySold;
        item.lifetime_revenue += revenue;
        item.lifetime_profit += profit;
      }

      velocityText = `Batch #${prevBatch.batch_number} (${qtySold} ${item.unit_of_measure} sold) turned over in ${
        velocityHours < 24 ? `${velocityHours} hours` : `${velocityDays} days`
      }! Realized Revenue: ${activeMerchant.currency} ${revenue.toLocaleString()}`;
    }

    // 4. Create Batch N+1
    const nextBatchNumber = (item.total_batches_count || 0) + 1;
    const newBatch: SupplyBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      merchant_id: activeMerchant.id,
      item_id: item.id,
      item_name: item.name,
      batch_number: nextBatchNumber,
      initial_qty: qty,
      remaining_qty: qty,
      unit_cost_price: unitCost,
      unit_selling_price: unitSelling,
      status: "ACTIVE",
      received_at: timestamp,
      spoilage_loss_qty: 0,
      notes: `Batch #${nextBatchNumber} from ${params.supplierName || "Supplier"} (${qty} fresh ${item.unit_of_measure}${carriedForwardQty > 0 ? ` + ${carriedForwardQty} carried forward` : ""})`,
    };
    batches.unshift(newBatch);

    // 5. Update Item Current Stock & Batch Count
    // Active shelf stock equals incoming fresh batch + any unsold units carried forward
    item.current_stock_qty = qty + carriedForwardQty;
    item.total_batches_count = nextBatchNumber;
    item.last_restocked_at = timestamp;

    if (isNewItem) {
      items.push(item);
    } else {
      const idx = items.findIndex((i) => i.id === item!.id);
      if (idx !== -1) items[idx] = item;
    }

    // 6. Log Financial Transaction in Money Out
    const moneyOutEntry: MoneyOutExpense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      merchant_id: activeMerchant.id,
      item_id: item.id,
      item_name: item.name,
      expense_type: "INVENTORY_PURCHASE",
      category: "INVENTORY",
      total_cost: totalCost,
      qty_purchased: qty,
      unit_cost_price: unitCost,
      unit_selling_price: unitSelling,
      supplier_name: params.supplierName || "Direct Wholesale / Distributor",
      receipt_reference: params.receiptReference || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: params.notes || `Stock replenishment: ${qty} ${item.unit_of_measure}`,
      created_at: timestamp,
    };
    expenses.unshift(moneyOutEntry);

    // 7. Auto-Link to Supplier Directory & Supplier Deliveries
    const rawSuppName = (params.supplierName || "Direct Supplier").trim();
    if (rawSuppName && rawSuppName !== "N/A") {
      const suppliers = AppStorage.getSuppliers();
      const deliveries = AppStorage.getSupplierDeliveries();
      const recRef = params.receiptReference || `REC-${Math.floor(1000 + Math.random() * 9000)}`;

      let supp = suppliers.find(
        (s) => s.name.trim().toLowerCase() === rawSuppName.toLowerCase()
      ) || AppStorage.findTypoSupplier(rawSuppName);

      if (!supp) {
        const res = AppStorage.addSupplier({
          id: `supp-${rawSuppName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 15) || "direct"}-${Date.now().toString().slice(-4)}`,
          merchant_id: activeMerchant.id,
          name: rawSuppName,
          phone: "+254 700 000 000",
          category: params.category || item.category || "General Goods",
          payment_terms: "CASH_ON_DELIVERY",
          total_supplied_value: 0,
          total_paid_value: 0,
          outstanding_balance_owed: 0,
          notes: `Auto-registered from restock receipt: ${recRef}`,
          created_at: timestamp,
        });
        supp = res.supplier;
      }

      // Check if delivery for this restock is already present
      const existingDeliv = deliveries.find(
        (d) =>
          d.supplier_id === supp!.id &&
          (d.invoice_or_delivery_note === recRef || d.notes?.includes(newBatch.id))
      );

      if (!existingDeliv) {
        const deliveryEntry: SupplierDelivery = {
          id: `deliv-restock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          merchant_id: activeMerchant.id,
          supplier_id: supp.id,
          supplier_name: supp.name,
          delivery_date: timestamp.split("T")[0],
          invoice_or_delivery_note: recRef,
          items: [
            {
              item_id: item.id,
              item_name: item.name,
              qty,
              unit_of_measure: item.unit_of_measure,
              unit_cost_price: unitCost,
              unit_selling_price: unitSelling,
              subtotal: totalCost,
            },
          ],
          total_amount: totalCost,
          amount_paid: totalCost,
          balance_remaining: 0,
          payment_channel: "CASH",
          status: "PAID",
          notes: params.notes || `Restock replenishment Batch #${nextBatchNumber}`,
          created_at: timestamp,
        };
        deliveries.unshift(deliveryEntry);

        supp.total_supplied_value += totalCost;
        supp.total_paid_value += totalCost;
      }

      AppStorage.saveSuppliers(suppliers);
      AppStorage.saveSupplierDeliveries(deliveries);
    }

    // Persist all state updates
    AppStorage.saveItems(items);
    AppStorage.saveBatches(batches);
    AppStorage.saveExpenses(expenses);
    AppStorage.saveSales(sales);

    const summaryMessage = closedBatch
      ? `Restock recorded! Previous Batch #${closedBatch.batch_number} closed (${generatedSale ? `${generatedSale.qty_sold} units sold -> ${activeMerchant.currency} ${generatedSale.total_revenue.toLocaleString()} revenue` : "0 units sold"}${carriedForwardQty > 0 ? `, ${carriedForwardQty} old stock carried forward` : ""}). Active shelf stock is now ${item.current_stock_qty} ${item.unit_of_measure}.`
      : `Initial baseline Batch #${newBatch.batch_number} activated for ${item.name} with ${qty} ${item.unit_of_measure}. All subsequent restocks will auto-derive sales revenue!`;

    return {
      moneyOutEntry,
      newBatch,
      closedBatch,
      generatedSale,
      updatedItem: item,
      summaryMessage,
      turnaroundVelocityText: velocityText,
    };
  }
}
