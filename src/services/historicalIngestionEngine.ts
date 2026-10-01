import {
  ExtractedReceipt,
  IngestionBatchResult,
  SalesLedgerEntry,
  MoneyOutExpense,
  SupplyBatch,
  InventoryItem,
  Merchant,
  Supplier,
  SupplierDelivery,
} from "../types";
import { AppStorage } from "./storage";

export interface FlatReceiptRecord {
  receiptId: string;
  supplierName: string;
  receiptDate: string;
  itemName: string;
  category: string;
  qtyPurchased: number;
  unitOfMeasure: "units" | "crates" | "bales" | "packets" | "bottles" | "kg" | "sachets" | "tins" | "boxes";
  totalCost: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  notes?: string;
}

export class HistoricalIngestionEngine {
  /**
   * Process unsorted / out-of-order array of receipts
   * Executes the 4-step algorithm:
   * 1. Flatten line items
   * 2. Sort chronologically by Date (Ascending)
   * 3. Group by Item Name
   * 4. Sequential Restock-Trigger Engine replay across timeline
   */
  static processUnsortedReceipts(
    receipts: ExtractedReceipt[],
    merchant?: Merchant
  ): IngestionBatchResult {
    const activeMerchant = merchant || AppStorage.getMerchant();
    const currentItems = AppStorage.getItems();
    const currentBatches = AppStorage.getBatches();
    const currentExpenses = AppStorage.getExpenses();
    const currentSales = AppStorage.getSales();

    // 1. Flatten all line items from receipts
    const flatRecords: FlatReceiptRecord[] = [];

    for (const receipt of receipts) {
      for (const item of receipt.items) {
        const qty = Math.max(1, Number(item.qtyPurchased) || 1);
        const totalCost = Number(item.totalCost) || 0;
        const unitCost = Number(item.unitCostPrice) || Number((totalCost / qty).toFixed(2));
        const unitSelling =
          Number(item.suggestedUnitSellingPrice) ||
          Number((unitCost * 1.25).toFixed(2)); // Default 25% markup if unspecified

        flatRecords.push({
          receiptId: receipt.receiptId || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
          supplierName: receipt.supplierName || "Direct Supplier",
          receiptDate: receipt.receiptDate || new Date().toISOString().split("T")[0],
          itemName: item.itemName.trim(),
          category: item.category || "General Goods",
          qtyPurchased: qty,
          unitOfMeasure: (item.unitOfMeasure as any) || "units",
          totalCost: totalCost || unitCost * qty,
          unitCostPrice: unitCost,
          unitSellingPrice: unitSelling,
          notes: receipt.notes,
        });
      }
    }

    // 2. Sort strictly chronologically by Date (Ascending)
    flatRecords.sort(
      (a, b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime()
    );

    // 3. Group records by unique Item Name
    const groupedByItem: { [normalizedName: string]: FlatReceiptRecord[] } = {};
    for (const record of flatRecords) {
      const key = record.itemName.toLowerCase();
      if (!groupedByItem[key]) {
        groupedByItem[key] = [];
      }
      groupedByItem[key].push(record);
    }

    // 4. Sequential Restock-Trigger timeline replay for each item
    const generatedSales: SalesLedgerEntry[] = [];
    const generatedExpenses: MoneyOutExpense[] = [];
    const generatedBatches: SupplyBatch[] = [];
    const updatedItemNames: string[] = [];

    let totalDerivedRevenue = 0;
    let totalDerivedProfit = 0;
    let totalExpensesLogged = 0;

    for (const itemKey of Object.keys(groupedByItem)) {
      const records = groupedByItem[itemKey];
      const displayName = records[0].itemName;
      updatedItemNames.push(displayName);

      // Find or create item record in storage
      let item = currentItems.find((i) => i.name.toLowerCase() === itemKey);
      if (!item) {
        item = {
          id: `item-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          merchant_id: activeMerchant.id,
          name: displayName,
          category: records[0].category,
          unit_cost_price: records[records.length - 1].unitCostPrice,
          unit_selling_price: records[records.length - 1].unitSellingPrice,
          current_stock_qty: records[records.length - 1].qtyPurchased,
          unit_of_measure: records[0].unitOfMeasure,
          reorder_point: Math.max(2, Math.round(records[0].qtyPurchased * 0.25)),
          total_batches_count: 0,
          lifetime_units_sold: 0,
          lifetime_revenue: 0,
          lifetime_profit: 0,
          last_restocked_at: records[records.length - 1].receiptDate,
        };
        currentItems.push(item);
      }

      let activeBatchForReplay: SupplyBatch | null = null;
      let batchNumberCounter = item.total_batches_count || 0;

      for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        batchNumberCounter += 1;
        totalExpensesLogged += rec.totalCost;

        // Log Money Out record
        const expenseEntry: MoneyOutExpense = {
          id: `exp-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          merchant_id: activeMerchant.id,
          item_id: item.id,
          item_name: item.name,
          expense_type: "INVENTORY_PURCHASE",
          category: "INVENTORY",
          total_cost: rec.totalCost,
          qty_purchased: rec.qtyPurchased,
          unit_cost_price: rec.unitCostPrice,
          unit_selling_price: rec.unitSellingPrice,
          supplier_name: rec.supplierName,
          receipt_reference: rec.receiptId,
          notes: rec.notes || `Historical receipt replay (Batch #${batchNumberCounter})`,
          created_at: new Date(rec.receiptDate).toISOString(),
        };
        generatedExpenses.push(expenseEntry);
        currentExpenses.unshift(expenseEntry);

        // If there was an active previous batch, new batch arrival triggers its sale!
        if (activeBatchForReplay) {
          const startDate = new Date(activeBatchForReplay.received_at).getTime();
          const endDate = new Date(rec.receiptDate).getTime();
          const elapsedMs = Math.max(1000 * 3600 * 12, endDate - startDate); // min 12h
          const velocityHours = Number((elapsedMs / (1000 * 3600)).toFixed(1));
          const velocityDays = Number((elapsedMs / (1000 * 3600 * 24)).toFixed(2));

          const qtySold = activeBatchForReplay.initial_qty;
          const rev = Number((qtySold * activeBatchForReplay.unit_selling_price).toFixed(2));
          const cost = Number((qtySold * activeBatchForReplay.unit_cost_price).toFixed(2));
          const profit = Number((rev - cost).toFixed(2));
          const margin = rev > 0 ? Number(((profit / rev) * 100).toFixed(1)) : 0;
          const unitsPerDay =
            velocityDays > 0 ? Number((qtySold / velocityDays).toFixed(1)) : qtySold;

          // Close active batch
          activeBatchForReplay.status = "CONSUMED_SOLD";
          activeBatchForReplay.closed_at = new Date(rec.receiptDate).toISOString();
          activeBatchForReplay.remaining_qty = 0;

          // Generate Sales Entry
          const saleEntry: SalesLedgerEntry = {
            id: `sale-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            merchant_id: activeMerchant.id,
            item_id: item.id,
            item_name: item.name,
            batch_id: activeBatchForReplay.id,
            batch_number: activeBatchForReplay.batch_number,
            qty_sold: qtySold,
            unit_cost_price: activeBatchForReplay.unit_cost_price,
            unit_selling_price: activeBatchForReplay.unit_selling_price,
            total_revenue: rev,
            total_cost: cost,
            total_profit: profit,
            gross_margin_percent: margin,
            sales_velocity_hours: velocityHours,
            sales_velocity_days: velocityDays,
            units_per_day: unitsPerDay,
            batch_start_date: activeBatchForReplay.received_at,
            batch_end_date: new Date(rec.receiptDate).toISOString(),
            trigger_reason: "HISTORICAL_INGESTION",
            notes: `Auto-derived from receipt timeline: Batch #${activeBatchForReplay.batch_number} arrived ${activeBatchForReplay.received_at.split("T")[0]} & sold out by restock date ${rec.receiptDate}.`,
            created_at: new Date(rec.receiptDate).toISOString(),
          };

          generatedSales.push(saleEntry);
          currentSales.unshift(saleEntry);

          totalDerivedRevenue += rev;
          totalDerivedProfit += profit;

          // Update item lifetime stats
          item.lifetime_units_sold += qtySold;
          item.lifetime_revenue += rev;
          item.lifetime_profit += profit;
        }

        // Create new active batch
        const isLatest = i === records.length - 1;
        const newBatch: SupplyBatch = {
          id: `batch-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          merchant_id: activeMerchant.id,
          item_id: item.id,
          item_name: item.name,
          batch_number: batchNumberCounter,
          initial_qty: rec.qtyPurchased,
          remaining_qty: isLatest ? rec.qtyPurchased : 0,
          unit_cost_price: rec.unitCostPrice,
          unit_selling_price: rec.unitSellingPrice,
          status: isLatest ? "ACTIVE" : "CONSUMED_SOLD",
          received_at: new Date(rec.receiptDate).toISOString(),
          spoilage_loss_qty: 0,
          notes: `Historical receipt Batch #${batchNumberCounter} from ${rec.supplierName}`,
        };

        generatedBatches.push(newBatch);
        currentBatches.unshift(newBatch);
        activeBatchForReplay = newBatch;
      }

      // Update item master
      item.total_batches_count = batchNumberCounter;
      item.current_stock_qty = records[records.length - 1].qtyPurchased;
      item.unit_cost_price = records[records.length - 1].unitCostPrice;
      item.unit_selling_price = records[records.length - 1].unitSellingPrice;
      item.last_restocked_at = new Date(records[records.length - 1].receiptDate).toISOString();
    }

    // 5. Ingest and Synchronize Suppliers & Supplier Deliveries
    const currentSuppliers = AppStorage.getSuppliers();
    const currentDeliveries = AppStorage.getSupplierDeliveries();

    for (const receipt of receipts) {
      const suppName = (receipt.supplierName || "Direct Supplier").trim();
      const recDate = receipt.receiptDate || new Date().toISOString().split("T")[0];
      const recId = receipt.receiptId || `REC-${Math.floor(1000 + Math.random() * 9000)}`;

      // Find or create supplier
      let supplier = currentSuppliers.find(
        (s) => s.name.trim().toLowerCase() === suppName.toLowerCase()
      );

      if (!supplier) {
        const slug = suppName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 15);
        supplier = {
          id: `supp-${slug || "direct"}-${Date.now().toString().slice(-4)}`,
          merchant_id: activeMerchant.id,
          name: suppName,
          phone: "+254 700 000 000",
          category: receipt.items[0]?.category || "General Goods",
          payment_terms: "CASH_ON_DELIVERY",
          total_supplied_value: 0,
          total_paid_value: 0,
          outstanding_balance_owed: 0,
          notes: receipt.notes || `Auto-created from receipt ingestion (${recId})`,
          created_at: new Date(recDate).toISOString(),
        };
        currentSuppliers.unshift(supplier);
      }

      // Map line items for delivery drop
      const deliveryItems = receipt.items.map((it) => {
        const qty = Math.max(1, Number(it.qtyPurchased) || 1);
        const total = Number(it.totalCost) || 0;
        const unitCost = Number(it.unitCostPrice) || Number((total / qty).toFixed(2));
        const unitSelling =
          Number(it.suggestedUnitSellingPrice) || Number((unitCost * 1.25).toFixed(2));
        return {
          item_name: it.itemName.trim(),
          qty,
          unit_of_measure: it.unitOfMeasure || "units",
          unit_cost_price: unitCost,
          unit_selling_price: unitSelling,
          subtotal: total || unitCost * qty,
        };
      });

      const receiptTotalCost = deliveryItems.reduce((acc, it) => acc + it.subtotal, 0);

      // Check if delivery already exists for this receipt ID and supplier
      const existingDelivIdx = currentDeliveries.findIndex(
        (d) => d.invoice_or_delivery_note === recId && (d.supplier_id === supplier!.id || d.supplier_name.toLowerCase() === suppName.toLowerCase())
      );

      if (existingDelivIdx === -1) {
        const newDelivery: SupplierDelivery = {
          id: `deliv-${recId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          merchant_id: activeMerchant.id,
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          delivery_date: recDate,
          invoice_or_delivery_note: recId,
          items: deliveryItems,
          total_amount: receiptTotalCost,
          amount_paid: receiptTotalCost, // Marked as paid on invoice
          balance_remaining: 0,
          payment_channel: "CASH",
          status: "PAID",
          notes: receipt.notes || `Receipt Reference: ${recId}`,
          created_at: new Date(recDate).toISOString(),
        };
        currentDeliveries.unshift(newDelivery);

        // Update supplier totals
        supplier.total_supplied_value += receiptTotalCost;
        supplier.total_paid_value += receiptTotalCost;
      }
    }

    // Persist changes
    AppStorage.saveItems(currentItems);
    AppStorage.saveBatches(currentBatches);
    AppStorage.saveExpenses(currentExpenses);
    AppStorage.saveSales(currentSales);
    AppStorage.saveSuppliers(currentSuppliers);
    AppStorage.saveSupplierDeliveries(currentDeliveries);

    return {
      processedReceiptsCount: receipts.length,
      totalExpensesLogged,
      generatedSalesEntries: generatedSales,
      derivedTotalRevenue: totalDerivedRevenue,
      derivedTotalProfit: totalDerivedProfit,
      itemsUpdated: updatedItemNames,
    };
  }

  /**
   * Sample Unsorted Chaotic Receipt Datasets for African Retailers
   * (e.g. July/August supplier invoices scattered out of order)
   */
  static getSampleUnsortedReceipts(): ExtractedReceipt[] {
    return [
      {
        receiptId: "KHT-7719",
        supplierName: "Pembe Millers",
        receiptDate: "2026-07-22",
        notes: "End of month bulk staples restock",
        items: [
          {
            itemName: "Unga 2kg",
            category: "Flour",
            qtyPurchased: 24,
            unitOfMeasure: "bales",
            totalCost: 3240,
            unitCostPrice: 135,
            suggestedUnitSellingPrice: 165,
          },
          {
            itemName: "Oil 1L",
            category: "Oil",
            qtyPurchased: 12,
            unitOfMeasure: "bottles",
            totalCost: 2940,
            unitCostPrice: 245,
            suggestedUnitSellingPrice: 300,
          },
        ],
      },
      {
        receiptId: "BRK-1022",
        supplierName: "Brookside",
        receiptDate: "2026-07-04",
        notes: "Morning dairy delivery",
        items: [
          {
            itemName: "Milk 500ml",
            category: "Dairy",
            qtyPurchased: 36,
            unitOfMeasure: "packets",
            totalCost: 1872,
            unitCostPrice: 52,
            suggestedUnitSellingPrice: 65,
          },
        ],
      },
      {
        receiptId: "BW-3199",
        supplierName: "Broadway Bakery",
        receiptDate: "2026-07-11",
        notes: "Mid-week bread reload",
        items: [
          {
            itemName: "Bread 400g",
            category: "Bakery",
            qtyPurchased: 20,
            unitOfMeasure: "packets",
            totalCost: 1080,
            unitCostPrice: 54,
            suggestedUnitSellingPrice: 65,
          },
        ],
      },
      {
        receiptId: "BRK-1099",
        supplierName: "Brookside",
        receiptDate: "2026-07-16",
        notes: "Mid-month dairy reload (Triggering July 4-16 sales auto-calculation)",
        items: [
          {
            itemName: "Milk 500ml",
            category: "Dairy",
            qtyPurchased: 36,
            unitOfMeasure: "packets",
            totalCost: 1872,
            unitCostPrice: 52,
            suggestedUnitSellingPrice: 65,
          },
        ],
      },
      {
        receiptId: "KHT-6612",
        supplierName: "Pembe Millers",
        receiptDate: "2026-07-02",
        notes: "Early July shop baseline restock",
        items: [
          {
            itemName: "Unga 2kg",
            category: "Flour",
            qtyPurchased: 24,
            unitOfMeasure: "bales",
            totalCost: 3240,
            unitCostPrice: 135,
            suggestedUnitSellingPrice: 165,
          },
        ],
      },
      {
        receiptId: "BRK-1145",
        supplierName: "Brookside",
        receiptDate: "2026-07-28",
        notes: "Late July milk restock (Triggering July 16-28 sales auto-calculation)",
        items: [
          {
            itemName: "Milk 500ml",
            category: "Dairy",
            qtyPurchased: 36,
            unitOfMeasure: "packets",
            totalCost: 1872,
            unitCostPrice: 52,
            suggestedUnitSellingPrice: 65,
          },
        ],
      },
    ];
  }
}
