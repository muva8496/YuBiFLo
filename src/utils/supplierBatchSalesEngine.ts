/**
 * Alacio - Automated Supplier Batch Restock & Sales Turnover Engine
 * 
 * CORE KENYAN DUKA BATCH LOGIC:
 * 1. Supplier Continuity: A wholesaler (e.g., Jeremiah_bread) delivers batches across dates.
 * 2. Displacement / Replenishment Rule:
 *    When a new batch arrives from the same wholesaler, ONLY products in the former batch
 *    that ALSO appear in the later batch are confirmed as sold/depleted!
 *    (e.g., Yesterday Jeremiah_bread brought 4 Supa Loaf 400g White. Today they brought Supa Loaf 400g White again.
 *     That means yesterday's 4 Supa Loaf were cleared to make room for today's drop!)
 * 3. Older Remaining Pieces on Shelf:
 *    If any pieces from the earlier batch remain unsold, the shopkeeper notes them under "Remaining on Shelf".
 *    These remaining pieces stay in / add to active inventory!
 * 4. Deductions:
 *    Shopkeeper checks: (a) Older Remaining Pieces, (b) Spoilt / Expired / Damaged, (c) Used by Owner / Kadogo Chai.
 *    Implied Sold = Batch Delivered Units - (Remaining on Shelf + Destroyed + Owner Used).
 * 5. Date Attribution:
 *    Sales generated from yesterday's batch belong to YESTERDAY'S SALES, NOT today's sales!
 * 6. Book Swipe Experience:
 *    Batches are ordered chronologically (older batches at page 1, 2...) flipping forward like a logbook.
 */

import { 
  AlacioMasterState, 
  SupplierBatchCard, 
  BatchTurnoverItem, 
  SalesLedgerItem, 
  SavedReceiptRecord 
} from "../types/alacio";
import { normalizeIsoDate } from "./chronologicalReceiptSalesEngine";

/**
 * Normalizes Kenyan grocery and bakery product names for robust matching
 * (e.g. "Supa Loaf 400gm Whte" matches "Superloaf White", "Phimar Corn 2kg (12 packets)" matches "Phimar Corn 2kg")
 */
export function normalizeProductKeyForBatch(name: string): string {
  if (!name) return "";
  let clean = name.toLowerCase().trim();
  
  // Normalize bread brand aliases
  clean = clean
    .replace(/\bsuper\s*loaf\b/g, "supaloaf")
    .replace(/\bsupa\s*loaf\b/g, "supaloaf")
    .replace(/\bsupaloaf\b/g, "supaloaf")
    .replace(/\bbroad\s*way\b/g, "broadway")
    .replace(/\bfestive\b/g, "festive");

  // Normalize weight and typo spelling
  clean = clean
    .replace(/400\s*gm\b/g, "400g")
    .replace(/600\s*gm\b/g, "600g")
    .replace(/800\s*gm\b/g, "800g")
    .replace(/200\s*gm\b/g, "200g")
    .replace(/\bwhte\b/g, "white")
    .replace(/\bbrwn\b/g, "brown");

  // Strip packaging container parentheticals
  clean = clean.replace(/\([^)]*\)/g, " ");
  // Strip special characters
  clean = clean.replace(/[^a-z0-9]+/g, " ").trim();
  
  return clean;
}

export function doBatchProductsMatch(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;
  const keyA = normalizeProductKeyForBatch(nameA);
  const keyB = normalizeProductKeyForBatch(nameB);
  if (keyA === keyB) return true;
  if (keyA.includes(keyB) || keyB.includes(keyA)) return true;
  return false;
}

/**
 * Builds or refreshes SupplierBatchCards from approved delivery receipts and state history.
 * Groups by supplier, sorts chronologically, and cross-references consecutive batches
 * so only products that reappear in a later batch are unlocked for turnover validation.
 */
export function buildAndEvaluateSupplierBatches(state: AlacioMasterState): {
  batchCards: SupplierBatchCard[];
  autoValidatedSales: SalesLedgerItem[];
} {
  const receipts = state.receiptsArchive || [];
  const existingBatchCards = state.supplierBatchCards || [];
  const existingCardMap = new Map<string, SupplierBatchCard>();
  existingBatchCards.forEach((c) => existingCardMap.set(c.id, c));

  const nowMs = Date.now();
  const rawBatches: SupplierBatchCard[] = [];

  // 1. Group approved receipts into Supplier Delivery Batches
  receipts.forEach((rcpt: SavedReceiptRecord, rcptIdx: number) => {
    if (rcpt.status === "rejected") return;

    const normDate = normalizeIsoDate(rcpt.receiptDate, "2026-11-10");
    const batchId = `batch_${rcpt.supplierName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${rcpt.receiptNumber || rcptIdx}_${normDate}`;
    const existing = existingCardMap.get(batchId);

    const timestampStr = rcpt.decidedAt || `${normDate}T08:00:00Z`;
    const batchTimeMs = new Date(timestampStr).getTime();
    const hoursElapsed = Math.max(0, Math.round(((nowMs - (Number.isNaN(batchTimeMs) ? nowMs - 14 * 3600 * 1000 : batchTimeMs)) / (1000 * 60 * 60)) * 10) / 10);

    const items: BatchTurnoverItem[] = (rcpt.items || []).map((it, itemIdx) => {
      const existingItem = existing?.items?.find((ei) => ei.id === it.id || doBatchProductsMatch(ei.skuName, it.itemName));
      
      const batchQty = Math.max(1, Number(it.retailUnitsAdded || it.supplyUnitsReceived) || 1);
      const lineCost = Math.max(0, Number(it.lineCost) || 0);
      const unitCost = Number(it.unitCostAtDelivery) > 0 ? Number(it.unitCostAtDelivery) : Math.round((lineCost / batchQty) * 100) / 100;
      const unitRetail = Number(it.retailPrice) > 0 ? Number(it.retailPrice) : Math.round(unitCost * 1.25 * 100) / 100;

      // Deductions
      const remainingOnShelf = Math.max(0, existingItem?.remainingOnShelf ?? 0);
      const destroyedQty = Math.max(0, existingItem?.destroyedQty ?? 0);
      const ownerUsedQty = Math.max(0, existingItem?.ownerUsedQty ?? 0);

      const calculatedSoldQty = Math.max(0, batchQty - (remainingOnShelf + destroyedQty + ownerUsedQty));
      const calculatedRevenue = Math.round(calculatedSoldQty * unitRetail * 100) / 100;
      const calculatedProfit = Math.round((calculatedRevenue - (calculatedSoldQty * unitCost)) * 100) / 100;

      return {
        id: it.id || `b_item_${batchId}_${itemIdx}`,
        skuName: it.itemName,
        category: "Wholesale Delivery",
        unitType: it.retailUnit || it.supplyUnit || "pcs",
        batchQty,
        unitCost,
        unitRetail,
        remainingOnShelf,
        destroyedQty,
        ownerUsedQty,
        reappearedInLaterBatch: false, // Calculated in step 2 below
        calculatedSoldQty,
        calculatedRevenue,
        calculatedProfit
      };
    });

    const totalBatchUnits = items.reduce((sum, i) => sum + i.batchQty, 0);
    const totalBatchCost = Math.round(items.reduce((sum, i) => sum + (i.batchQty * i.unitCost), 0) * 100) / 100;
    const totalBatchRevenue = Math.round(items.reduce((sum, i) => sum + i.calculatedRevenue, 0) * 100) / 100;
    const totalBatchProfit = Math.round(items.reduce((sum, i) => sum + i.calculatedProfit, 0) * 100) / 100;

    const initialStatus = existing?.status || "PENDING_AUTHORIZATION";

    rawBatches.push({
      id: batchId,
      batchNumber: rcpt.receiptNumber || `DN-${rcptIdx + 100}`,
      supplierName: rcpt.supplierName,
      deliveredDate: normDate,
      deliveredTimestamp: timestampStr,
      receiptId: rcpt.id,
      hoursElapsed,
      items,
      totalBatchUnits,
      totalBatchCost,
      totalBatchRevenue,
      totalBatchProfit,
      status: initialStatus,
      paymentMethod: (rcpt.paymentMode === "MPESA" ? "MPESA" : "CASH"),
      authorizedAt: existing?.authorizedAt,
      authorizedDate: existing?.authorizedDate,
      autoValidatedReason: existing?.autoValidatedReason,
      notes: rcpt.notes
    });
  });

  // Default initial demo batches illustrating the user's exact Jeremiah_bread scenario
  if (rawBatches.length === 0) {
    const yesterdayDate = "2026-11-10";
    const todayDate = "2026-11-11";

    // Batch 1: Jeremiah_bread delivered yesterday (Batch #JB-101)
    rawBatches.push({
      id: "batch_jeremiah_bread_jb101_2026-11-10",
      batchNumber: "JB-101",
      supplierName: "Jeremiah_bread",
      deliveredDate: yesterdayDate,
      deliveredTimestamp: `${yesterdayDate}T06:30:00Z`,
      hoursElapsed: 26.5,
      items: [
        {
          id: "item_jb_1",
          skuName: "Supa Loaf 400gm White",
          unitType: "Packets (400g)",
          batchQty: 4,
          unitCost: 60,
          unitRetail: 65,
          remainingOnShelf: 0,
          destroyedQty: 0,
          ownerUsedQty: 0,
          reappearedInLaterBatch: true, // Reappeared in today's JB-102
          calculatedSoldQty: 4,
          calculatedRevenue: 260,
          calculatedProfit: 20
        },
        {
          id: "item_jb_2",
          skuName: "Supa Loaf 400gm Brown",
          unitType: "Packets (400g)",
          batchQty: 2,
          unitCost: 62,
          unitRetail: 70,
          remainingOnShelf: 0,
          destroyedQty: 0,
          ownerUsedQty: 0,
          reappearedInLaterBatch: true, // Reappeared in today's JB-102
          calculatedSoldQty: 2,
          calculatedRevenue: 140,
          calculatedProfit: 16
        },
        {
          id: "item_jb_3",
          skuName: "Scones 6-Pack",
          unitType: "Packs (6pcs)",
          batchQty: 4,
          unitCost: 40,
          unitRetail: 50,
          remainingOnShelf: 2,
          destroyedQty: 0,
          ownerUsedQty: 0,
          reappearedInLaterBatch: false, // Did NOT arrive in today's delivery, still sitting on shelf!
          calculatedSoldQty: 2,
          calculatedRevenue: 100,
          calculatedProfit: 20
        }
      ],
      totalBatchUnits: 10,
      totalBatchCost: 524,
      totalBatchRevenue: 500,
      totalBatchProfit: 56,
      status: "PENDING_AUTHORIZATION",
      paymentMethod: "CASH",
      notes: "Jeremiah_bread morning delivery note #JB-101 (Yesterday)."
    });

    // Batch 2: Jeremiah_bread delivered today (Batch #JB-102)
    rawBatches.push({
      id: "batch_jeremiah_bread_jb102_2026-11-11",
      batchNumber: "JB-102",
      supplierName: "Jeremiah_bread",
      deliveredDate: todayDate,
      deliveredTimestamp: `${todayDate}T06:45:00Z`,
      hoursElapsed: 3.5,
      items: [
        {
          id: "item_jb2_1",
          skuName: "Supa Loaf 400gm White",
          unitType: "Packets (400g)",
          batchQty: 6,
          unitCost: 60,
          unitRetail: 65,
          remainingOnShelf: 0,
          destroyedQty: 0,
          ownerUsedQty: 0,
          reappearedInLaterBatch: false, // Latest active batch on shelf
          calculatedSoldQty: 6,
          calculatedRevenue: 390,
          calculatedProfit: 30
        },
        {
          id: "item_jb2_2",
          skuName: "Supa Loaf 400gm Brown",
          unitType: "Packets (400g)",
          batchQty: 4,
          unitCost: 62,
          unitRetail: 70,
          remainingOnShelf: 0,
          destroyedQty: 0,
          ownerUsedQty: 0,
          reappearedInLaterBatch: false,
          calculatedSoldQty: 4,
          calculatedRevenue: 280,
          calculatedProfit: 32
        }
      ],
      totalBatchUnits: 10,
      totalBatchCost: 608,
      totalBatchRevenue: 670,
      totalBatchProfit: 62,
      status: "PENDING_AUTHORIZATION",
      paymentMethod: "CASH",
      notes: "Jeremiah_bread morning delivery note #JB-102 (Today)."
    });

    // Batch 3: LUX STORES (Batch #1244)
    rawBatches.push({
      id: "batch_lux_stores_1244_2026-11-07",
      batchNumber: "1244",
      supplierName: "LUX STORES",
      deliveredDate: "2026-11-07",
      deliveredTimestamp: "2026-11-07T08:30:00Z",
      hoursElapsed: 94.0,
      items: [
        {
          id: "item_lux_1",
          skuName: "BB 20g (2 Dozen)",
          unitType: "Packets (20g)",
          batchQty: 24,
          unitCost: 8.33,
          unitRetail: 10,
          remainingOnShelf: 0,
          destroyedQty: 0,
          ownerUsedQty: 0,
          reappearedInLaterBatch: true,
          calculatedSoldQty: 24,
          calculatedRevenue: 240,
          calculatedProfit: 40.08
        },
        {
          id: "item_lux_2",
          skuName: "Fruta Juice",
          unitType: "Bottles",
          batchQty: 1,
          unitCost: 200,
          unitRetail: 240,
          remainingOnShelf: 0,
          destroyedQty: 0,
          ownerUsedQty: 0,
          reappearedInLaterBatch: true,
          calculatedSoldQty: 1,
          calculatedRevenue: 240,
          calculatedProfit: 40
        },
        {
          id: "item_lux_3",
          skuName: "Top Chips",
          unitType: "Packets",
          batchQty: 1,
          unitCost: 345,
          unitRetail: 400,
          remainingOnShelf: 0,
          destroyedQty: 0,
          ownerUsedQty: 0,
          reappearedInLaterBatch: true,
          calculatedSoldQty: 1,
          calculatedRevenue: 400,
          calculatedProfit: 55
        }
      ],
      totalBatchUnits: 26,
      totalBatchCost: 745,
      totalBatchRevenue: 880,
      totalBatchProfit: 135.08,
      status: "PENDING_AUTHORIZATION",
      paymentMethod: "CASH",
      notes: "LUX STORES Soweto Kayole Cash Sale Delivery."
    });

    // Batch 4: AGS LIMITED (Batch #INV-270055801)
    rawBatches.push({
      id: "batch_ags_270055801_2026-10-16",
      batchNumber: "INV-270055801",
      supplierName: "AGS LIMITED",
      deliveredDate: "2026-10-16",
      deliveredTimestamp: "2026-10-16T09:00:00Z",
      hoursElapsed: 600.0,
      items: [
        {
          id: "item_ags_1",
          skuName: "Msosi Maize Meal 2kg (3 Bales)",
          unitType: "Packets (2kg)",
          batchQty: 36,
          unitCost: 99.17,
          unitRetail: 120,
          remainingOnShelf: 0,
          destroyedQty: 0,
          ownerUsedQty: 0,
          reappearedInLaterBatch: true,
          calculatedSoldQty: 36,
          calculatedRevenue: 4320,
          calculatedProfit: 750
        }
      ],
      totalBatchUnits: 36,
      totalBatchCost: 3570,
      totalBatchRevenue: 4320,
      totalBatchProfit: 750,
      status: "PENDING_AUTHORIZATION",
      paymentMethod: "CASH",
      notes: "AGS LIMITED 3 Bales of Msosi Maize Meal 2kg."
    });
  }

  // 2. CROSS-REFERENCE CONSECUTIVE BATCHES PER SUPPLIER
  // "only products that appear in the later batch that had appeared in the former batch
  //  of the same wholesaler should now appear for validation and approval"
  const batchesBySupplier = new Map<string, SupplierBatchCard[]>();

  rawBatches.forEach((batch) => {
    const key = batch.supplierName.trim().toUpperCase();
    if (!batchesBySupplier.has(key)) {
      batchesBySupplier.set(key, []);
    }
    batchesBySupplier.get(key)!.push(batch);
  });

  const autoValidatedSales: SalesLedgerItem[] = [];

  batchesBySupplier.forEach((supplierBatches) => {
    // Sort chronologically ascending (older batches first)
    supplierBatches.sort((a, b) => 
      a.deliveredDate.localeCompare(b.deliveredDate) || 
      a.deliveredTimestamp.localeCompare(b.deliveredTimestamp)
    );

    for (let i = 0; i < supplierBatches.length; i++) {
      const currentBatch = supplierBatches[i];
      const hasLaterBatch = i < supplierBatches.length - 1;
      const nextBatch = hasLaterBatch ? supplierBatches[i + 1] : null;

      currentBatch.hasLaterBatchFromSameSupplier = hasLaterBatch;
      if (nextBatch) {
        currentBatch.laterBatchNumber = nextBatch.batchNumber;
        currentBatch.laterBatchDate = nextBatch.deliveredDate;
      }

      // Cross-match items against later batch
      currentBatch.items.forEach((item) => {
        if (!nextBatch) {
          // If no later batch has arrived yet from this supplier,
          // the item is currently active on the shelf!
          item.reappearedInLaterBatch = false;
        } else {
          // Check if product arrived again in the later batch
          const foundInNext = nextBatch.items.some((nextItem) => 
            doBatchProductsMatch(item.skuName, nextItem.skuName)
          );

          item.reappearedInLaterBatch = foundInNext;
          if (foundInNext) {
            item.nextDeliveryBatchNumber = nextBatch.batchNumber;
            item.nextDeliveryDate = nextBatch.deliveredDate;
          }
        }

        // Implied Sold calculation: BatchQty - (Remaining on shelf + Destroyed + Owner Used)
        const nonSold = (item.remainingOnShelf || 0) + (item.destroyedQty || 0) + (item.ownerUsedQty || 0);
        item.calculatedSoldQty = Math.max(0, item.batchQty - nonSold);
        item.calculatedRevenue = Math.round(item.calculatedSoldQty * item.unitRetail * 100) / 100;
        item.calculatedProfit = Math.round((item.calculatedRevenue - (item.calculatedSoldQty * item.unitCost)) * 100) / 100;
      });

      // Recalculate totals
      currentBatch.totalBatchRevenue = Math.round(currentBatch.items.reduce((sum, it) => sum + it.calculatedRevenue, 0) * 100) / 100;
      currentBatch.totalBatchProfit = Math.round(currentBatch.items.reduce((sum, it) => sum + it.calculatedProfit, 0) * 100) / 100;

      // 3. 12-Hour Auto-Validation Rule:
      // If >12 hours elapsed AND same supplier dropped next batch (or >24h elapsed),
      // auto-validate and attribute sales to currentBatch.deliveredDate (yesterday's date)!
      if (
        currentBatch.status === "PENDING_AUTHORIZATION" &&
        ((currentBatch.hoursElapsed >= 12 && hasLaterBatch) || currentBatch.hoursElapsed >= 24)
      ) {
        currentBatch.status = "AUTO_VALIDATED";
        currentBatch.autoValidatedReason = hasLaterBatch
          ? `Auto-validated: ${currentBatch.supplierName} dropped next batch (${nextBatch?.batchNumber}) & >12h elapsed.`
          : `Auto-validated: ${Math.round(currentBatch.hoursElapsed)}h elapsed without dispute.`;
        currentBatch.authorizedAt = "18:00";
        currentBatch.authorizedDate = currentBatch.deliveredDate; // SALES CREDITED TO YESTERDAY'S DATE!

        // Generate sales ledger entry credited strictly to currentBatch.deliveredDate
        const soldItems = currentBatch.items.filter((it) => it.calculatedSoldQty > 0 && it.reappearedInLaterBatch);
        if (soldItems.length > 0) {
          const itemsSummary = soldItems
            .map((item) => `${item.calculatedSoldQty} ${item.unitType} ${item.skuName}`)
            .join(", ");

          autoValidatedSales.push({
            id: `sale_batch_auto_${currentBatch.id}`,
            date: currentBatch.deliveredDate, // YESTERDAY'S SALES DATE!
            timestamp: "18:00",
            customer_name: `Walk-in Counter (${currentBatch.supplierName} Batch)`,
            items_summary: itemsSummary,
            total_amount: currentBatch.totalBatchRevenue,
            cash_paid: currentBatch.paymentMethod === "CASH" ? currentBatch.totalBatchRevenue : 0,
            mpesa_paid: currentBatch.paymentMethod === "MPESA" ? currentBatch.totalBatchRevenue : 0,
            debt_amount: 0,
            payment_method: currentBatch.paymentMethod,
            payment_channel: currentBatch.paymentMethod,
            cash_received: currentBatch.paymentMethod === "CASH" ? currentBatch.totalBatchRevenue : 0
          });
        }
      }
    }
  });

  // Sort rawBatches chronologically: older batches first ($T_0 \to T_1 \to T_2 \dots$)
  // so the book page swipe follows the chronological journey!
  rawBatches.sort((a, b) => 
    a.deliveredDate.localeCompare(b.deliveredDate) || 
    a.deliveredTimestamp.localeCompare(b.deliveredTimestamp)
  );

  return {
    batchCards: rawBatches,
    autoValidatedSales
  };
}
