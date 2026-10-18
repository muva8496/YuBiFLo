import {
  AlacioMasterState,
  InventoryItem,
  PayoutOrDrawing,
  RestockReconciliationCard,
  SalesLedgerItem,
  SavedReceiptItem,
  SavedReceiptRecord
} from "../types/alacio";

/**
 * Extracts an explicit date from a receipt string, OCR text, or filename.
 * Supports:
 * - "16/Oct/2026", "16-Oct-2026", "16 Oct 2026", "2nd of October 2026"
 * - "16/10/2026", "16-10-2026", "16.10.2026", "16/10/26" (DD/MM/YYYY)
 * - "2026-10-16", "2026/10/16" (YYYY-MM-DD)
 * - "Oct 16, 2026", "October 16 2026"
 * - "20261016" in filenames (e.g. IMG_20261016)
 * Returns null if no recognizable date pattern is present (avoids false positives on filenames like "test_3.jpg").
 */
export function extractExplicitDate(rawDate?: string): string | null {
  if (!rawDate || typeof rawDate !== "string") return null;

  const trimmed = rawDate.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower === "today") {
    return new Date().toISOString().slice(0, 10);
  }
  if (lower === "yesterday") {
    return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  }

  const monthsMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12"
  };

  // 1. YYYY-MM-DD or YYYY/MM/DD anywhere in string
  const isoMatch = trimmed.match(/\b(20\d{2})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(Math.min(12, Math.max(1, parseInt(isoMatch[2], 10)))).padStart(2, "0");
    const d = String(Math.min(31, Math.max(1, parseInt(isoMatch[3], 10)))).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 2. DD/Mon/YYYY, DD-Mon-YYYY, "16/Oct/2026", "2nd of October 2026", "8th Oct"
  const dMonYMatch = lower.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?(?:\s+of)?[\s\/\-.,]+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:[\s\/\-.,]+(20\d{2}|\d{2}))?\b/i
  );
  if (dMonYMatch) {
    const day = String(Math.min(31, Math.max(1, parseInt(dMonYMatch[1], 10)))).padStart(2, "0");
    const monPrefix = dMonYMatch[2].slice(0, 3).toLowerCase();
    const mon = monthsMap[monPrefix] || "10";
    let yearNum = dMonYMatch[3] ? parseInt(dMonYMatch[3], 10) : 2026;
    if (yearNum < 100) yearNum += 2000;
    return `${yearNum}-${mon}-${day}`;
  }

  // 3. Mon DD, YYYY or "Oct 16, 2026", "October 2nd"
  const monDYMatch = lower.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s\/\-.,]+(\d{1,2})(?:st|nd|rd|th)?(?:[\s\/\-.,]+(20\d{2}|\d{2}))?\b/i
  );
  if (monDYMatch) {
    const monPrefix = monDYMatch[1].slice(0, 3).toLowerCase();
    const mon = monthsMap[monPrefix] || "10";
    const day = String(Math.min(31, Math.max(1, parseInt(monDYMatch[2], 10)))).padStart(2, "0");
    let yearNum = monDYMatch[3] ? parseInt(monDYMatch[3], 10) : 2026;
    if (yearNum < 100) yearNum += 2000;
    return `${yearNum}-${mon}-${day}`;
  }

  // 4. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (East African / Kenyan date convention)
  const dmyMatch = trimmed.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2}|\d{2})\b/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    let p2 = parseInt(dmyMatch[2], 10);
    let yearNum = parseInt(dmyMatch[3], 10);
    if (yearNum < 100) yearNum += 2000;
    // If p2 > 12 and p1 <= 12, swap (MM/DD/YYYY -> DD/MM/YYYY)
    let dayNum = p1;
    let monthNum = p2;
    if (monthNum > 12 && dayNum <= 12) {
      dayNum = p2;
      monthNum = p1;
    }
    const m = String(Math.min(12, Math.max(1, monthNum))).padStart(2, "0");
    const d = String(Math.min(31, Math.max(1, dayNum))).padStart(2, "0");
    return `${yearNum}-${m}-${d}`;
  }

  // 5. Short DD/MM at start of string
  const shortDmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (shortDmy) {
    const dayNum = parseInt(shortDmy[1], 10);
    const monthNum = parseInt(shortDmy[2], 10);
    const m = String(Math.min(12, Math.max(1, monthNum))).padStart(2, "0");
    const d = String(Math.min(31, Math.max(1, dayNum))).padStart(2, "0");
    return `2026-${m}-${d}`;
  }

  // 6. Compact YYYYMMDD in filenames (e.g. IMG_20261016_094823.jpg)
  const compactMatch = trimmed.match(/(?:^|[^0-9])(202\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?:[^0-9]|$)/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  }

  return null;
}

/**
 * Normalizes any date string (e.g., "2026-10-02", "16/Oct/2026", "02/10/2026", "2nd of October", "8th Oct")
 * into canonical YYYY-MM-DD format (defaults to fallbackIso or "2026-10-16" if no explicit date is found).
 */
export function normalizeIsoDate(rawDate?: string, fallbackIso: string = "2026-10-16"): string {
  const extracted = extractExplicitDate(rawDate);
  if (extracted) return extracted;
  return fallbackIso;
}

/**
 * Produces a canonical product matching key so matching products across different receipts
 * (e.g., "Phimar Corn 2kg (12 packets)" and "Phimar Corn 2kg 12 pkts") match reliably
 * while keeping distinct weights (25kg vs 2kg vs 1kg) separate.
 */
export function getCanonicalProductKey(itemName: string): string {
  if (!itemName) return "";
  return itemName
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // remove parenthetical pack notes like (12 packets) or (24kg)
    .replace(/\b\d+\s*(?:packets|pkts|pkt|bags|bag|crates|crate|bales|bale|trays|tray|cartons|ctn|ctns|loaves|pcs|pieces|units)\b/g, " ")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Checks whether two product names refer to the same retail SKU.
 */
export function doProductsMatch(nameA: string, nameB: string): boolean {
  const keyA = getCanonicalProductKey(nameA);
  const keyB = getCanonicalProductKey(nameB);
  if (!keyA || !keyB) return false;
  if (keyA === keyB) return true;
  return nameA.toLowerCase().trim() === nameB.toLowerCase().trim();
}

interface ChronologicalProductBatch {
  receiptId: string;
  receiptNumber: string;
  receiptDate: string; // YYYY-MM-DD
  decidedAt: string;
  supplierName: string;
  paymentMode: "CASH" | "MPESA" | "SPLIT";
  item: SavedReceiptItem;
}

/**
 * Returns intraday timestamps for a given number of slots per day.
 * As receipt dates get closer together, more slots per day are used,
 * going into smaller and more minute sales generation.
 */
function getIntradayTimestamps(slotsPerDay: number): string[] {
  if (slotsPerDay <= 1) return ["13:30"];
  if (slotsPerDay === 2) return ["10:15", "16:45"];
  if (slotsPerDay === 3) return ["09:15", "13:40", "18:10"];
  if (slotsPerDay === 4) return ["08:45", "11:50", "15:15", "18:30"];
  if (slotsPerDay === 6) return ["08:15", "10:30", "12:45", "15:00", "17:15", "19:30"];
  // 8+ minute-level slots for same-day / ultra-close receipts
  return [
    "08:05",
    "09:20",
    "10:35",
    "11:50",
    "13:05",
    "14:20",
    "15:35",
    "16:50",
    "18:05",
    "19:20"
  ].slice(0, slotsPerDay);
}

/**
 * Computes the calendar days between startIso (inclusive) and endIso (exclusive, or inclusive if same day).
 */
function getDateSequenceBetween(startIso: string, endIso: string): string[] {
  const startMs = new Date(`${startIso}T00:00:00Z`).getTime();
  const endMs = new Date(`${endIso}T00:00:00Z`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return [startIso];
  }
  const diffDays = Math.max(1, Math.round((endMs - startMs) / 86_400_000));
  const days: string[] = [];
  for (let i = 0; i < diffDays; i++) {
    const d = new Date(startMs + i * 86_400_000);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export interface SubdividedSalesInterval {
  productKey: string;
  itemName: string;
  startTimestamp: string; // T_k
  endTimestamp: string;   // T_{k+1} (or T_new / T_{k+1} after split)
  deltaDays: number;      // \Delta t = max(1, T_{k+1} - T_k)
  batchQuantity: number;  // Q_k
  dailyVelocity: number;  // V = Q_k / \Delta t
  intradaySlotsPerDay: number;
  sourceReceiptId: string;
  targetReceiptId: string;
}

/**
 * Computes Adaptive Interval Subdivision for a product's sorted restock ledger {T_0, T_1, ..., T_k, T_{k+1}, ..., T_n}.
 * When a new restock receipt arrives at T_new with quantity Q_new:
 * - State Insertion: Inserted into the sorted ledger {T_0, ..., T_k, T_new, T_{k+1}, ..., T_n}.
 * - Interval Split: Broad cycle [T_k, T_{k+1}] is invalidated.
 * - Subdivision: Spawns tighter intervals [T_k, T_new] and [T_new, T_{k+1}].
 * - Implied Sales Recalculation: Batch Q_k depletes across [T_k, T_new] with daily velocity V = Q_k / \Delta t.
 */
export function computeAdaptiveIntervalSubdivision(
  productKey: string,
  sortedBatches: ChronologicalProductBatch[]
): SubdividedSalesInterval[] {
  const intervals: SubdividedSalesInterval[] = [];
  if (sortedBatches.length < 2) return intervals;

  for (let k = 0; k < sortedBatches.length - 1; k++) {
    const currentBatch = sortedBatches[k];
    const nextBatch = sortedBatches[k + 1];

    const startIso = currentBatch.receiptDate;
    const endIso = nextBatch.receiptDate;

    const startMs = new Date(`${startIso}T00:00:00Z`).getTime();
    const endMs = new Date(`${endIso}T00:00:00Z`).getTime();
    const rawGapDays = Math.max(0, Math.round((endMs - startMs) / 86_400_000));
    const deltaDays = Math.max(1, rawGapDays);

    const batchQuantity = Math.max(
      1,
      Number(currentBatch.item.retailUnitsAdded) || Number(currentBatch.item.supplyUnitsReceived) || 1
    );
    const dailyVelocity = Math.round((batchQuantity / deltaDays) * 100) / 100;

    let intradaySlotsPerDay = 1;
    if (rawGapDays === 0) {
      intradaySlotsPerDay = 6;
    } else if (rawGapDays === 1) {
      intradaySlotsPerDay = 4;
    } else if (rawGapDays <= 2) {
      intradaySlotsPerDay = 3;
    } else if (rawGapDays <= 4) {
      intradaySlotsPerDay = 2;
    } else {
      intradaySlotsPerDay = 1;
    }

    intervals.push({
      productKey,
      itemName: currentBatch.item.itemName,
      startTimestamp: startIso,
      endTimestamp: endIso,
      deltaDays,
      batchQuantity,
      dailyVelocity,
      intradaySlotsPerDay,
      sourceReceiptId: currentBatch.receiptId,
      targetReceiptId: nextBatch.receiptId
    });
  }

  return intervals;
}

export interface ChronoRestockEvent {
  receipt_id: string;
  date: string; // YYYY-MM-DD
  qty: number;
  unit_cost: number;
  unit_retail: number;
}

export interface InferredSalesLedgerEntry {
  sku: string;
  date: string; // YYYY-MM-DD
  units_sold: number;
  revenue: number;
  gross_profit: number;
  source_batch_date: string;
  cleared_by_batch_date: string;
  resolution_days: number;
}

export interface ChronoReinterpolationResult {
  status: "SUCCESS";
  recalculated_skus: string[];
  inferred_sales_by_sku: Record<string, InferredSalesLedgerEntry[]>;
}

/**
 * TypeScript implementation of ChronoSalesReinterpolator:
 * Ingests items from newly scanned receipts regardless of arrival order,
 * inserts events into the chronologically sorted timeline per SKU, and
 * recalculates interval-based daily burn rate, revenue, and gross profit.
 */
export class ChronoSalesReinterpolator {
  public sku_event_log: Record<string, ChronoRestockEvent[]> = {};
  public sku_inferred_sales: Record<string, InferredSalesLedgerEntry[]> = {};

  public ingest_receipt_items(
    receipt_meta: { receipt_id?: string; invoice_number?: string; receipt_date: string },
    items: Array<{
      product_name: string;
      total_retail_units: number | string;
      derived_unit_wholesale: number | string;
      shelf_retail?: number | string;
      suggested_shelf_retail?: number | string;
    }>
  ): ChronoReinterpolationResult {
    const parsed_date = normalizeIsoDate(receipt_meta.receipt_date);
    const recalculated_skus: string[] = [];
    const inferred_sales_by_sku: Record<string, InferredSalesLedgerEntry[]> = {};

    for (const item of items) {
      const sku = getCanonicalProductKey(item.product_name) || String(item.product_name || "").trim().toLowerCase();
      if (!sku) continue;

      const unitCost = parseFloat(String(item.derived_unit_wholesale)) || 0;
      const unitRetail =
        parseFloat(String(item.shelf_retail ?? item.suggested_shelf_retail)) ||
        Math.round(unitCost * 1.2 * 100) / 100;

      const event: ChronoRestockEvent = {
        receipt_id: receipt_meta.invoice_number || receipt_meta.receipt_id || "MANUAL",
        date: parsed_date,
        qty: parseFloat(String(item.total_retail_units)) || 1,
        unit_cost: unitCost,
        unit_retail: unitRetail,
      };

      if (!this.sku_event_log[sku]) {
        this.sku_event_log[sku] = [];
      }

      // 1. Insert event and sort timeline chronologically
      this.sku_event_log[sku].push(event);
      this.sku_event_log[sku].sort((a, b) => a.date.localeCompare(b.date));

      // 2. Recompute the implied sales ledger for this specific SKU
      const ledger = this._recalculate_sales_intervals(sku);
      this.sku_inferred_sales[sku] = ledger;
      inferred_sales_by_sku[sku] = ledger;
      recalculated_skus.push(sku);
    }

    return {
      status: "SUCCESS",
      recalculated_skus,
      inferred_sales_by_sku,
    };
  }

  public _recalculate_sales_intervals(sku: string): InferredSalesLedgerEntry[] {
    const events = this.sku_event_log[sku] || [];
    if (events.length < 2) {
      // Only one restock point: batch is still currently active on shelf
      return [];
    }

    const inferred_sales_ledger: InferredSalesLedgerEntry[] = [];

    // Iterate through adjacent chronological pairs
    for (let i = 0; i < events.length - 1; i++) {
      const prev_event = events[i];
      const next_event = events[i + 1];

      const start_date = prev_event.date;
      const end_date = next_event.date;

      const startMs = new Date(`${start_date}T00:00:00Z`).getTime();
      const endMs = new Date(`${end_date}T00:00:00Z`).getTime();
      let days_between = Math.round((endMs - startMs) / 86_400_000);
      if (days_between <= 0 || Number.isNaN(days_between)) {
        // Same-day restock: combine velocity
        days_between = 1;
      }

      // The quantity received at start_date cleared by end_date
      const total_batch_qty = prev_event.qty;
      const daily_burn_rate = total_batch_qty / days_between;
      const daily_revenue = daily_burn_rate * prev_event.unit_retail;
      const daily_profit = daily_burn_rate * (prev_event.unit_retail - prev_event.unit_cost);

      // Generate granular daily entries across the interval
      for (let day_offset = 0; day_offset < days_between; day_offset++) {
        const entryDateObj = new Date(startMs + day_offset * 86_400_000);
        const entry_date = Number.isNaN(entryDateObj.getTime())
          ? start_date
          : entryDateObj.toISOString().slice(0, 10);

        inferred_sales_ledger.push({
          sku,
          date: entry_date,
          units_sold: Math.round(daily_burn_rate * 100) / 100,
          revenue: Math.round(daily_revenue * 100) / 100,
          gross_profit: Math.round(daily_profit * 100) / 100,
          source_batch_date: start_date,
          cleared_by_batch_date: end_date,
          resolution_days: days_between,
        });
      }
    }

    return inferred_sales_ledger;
  }
}

/**
 * Behind-the-scenes Adaptive Interval Subdivision engine:
 * 1. State Insertion: Inserts any new restock receipt (T_new, Q_new) into the product's chronologically sorted ledger {T_0, T_1, ..., T_n}.
 * 2. Interval Split & Subdivision: If T_new falls between [T_k, T_{k+1}], the previous broad interval [T_k, T_{k+1}] is invalidated
 *    and subdivided into [T_k, T_new] and [T_new, T_{k+1}].
 * 3. Implied Sales Recalculation: Depletes Q_k across the narrower window ending at T_new, distributing daily sales velocity
 *    (V = Q_k / \Delta t) at higher intraday resolution without altering the client's visible dashboard layout.
 */
export function reconcileChronologicalReceiptsAndSales(
  state: AlacioMasterState
): AlacioMasterState {
  const rawReceipts = Array.isArray(state.receiptsArchive) ? state.receiptsArchive : [];

  // 1. Normalize dates on all receipts and arrange them chronologically
  const normalizedReceipts: SavedReceiptRecord[] = rawReceipts.map((r) => ({
    ...r,
    receiptDate: normalizeIsoDate(r.receiptDate)
  }));

  // State Insertion: Sort ledger {T_0, T_1, ..., T_k, T_{k+1}, ..., T_n} chronologically ascending
  const receiptsChronoAsc = [...normalizedReceipts].sort((a, b) => {
    const cmp = a.receiptDate.localeCompare(b.receiptDate);
    if (cmp !== 0) return cmp;
    return (a.decidedAt || "").localeCompare(b.decidedAt || "");
  });

  const approvedChronoAsc = receiptsChronoAsc.filter((r) => r.status === "approved");

  // If fewer than 1 approved receipt, just ensure payouts and receipts are sorted by date
  if (approvedChronoAsc.length === 0) {
    return {
      ...state,
      receiptsArchive: receiptsChronoAsc
    };
  }

  // 2. Group approved receipt items by canonical product key in chronological order {T_0, ..., T_n}
  const productTimelines = new Map<string, ChronologicalProductBatch[]>();

  approvedChronoAsc.forEach((rcpt) => {
    const pMode: "CASH" | "MPESA" | "SPLIT" =
      rcpt.paymentMode === "MPESA" ? "MPESA" : "CASH";

    (rcpt.items || []).forEach((item) => {
      if (item.approved === false) return;
      const key = getCanonicalProductKey(item.itemName);
      if (!key) return;

      const list = productTimelines.get(key) || [];
      list.push({
        receiptId: rcpt.id,
        receiptNumber: rcpt.receiptNumber,
        receiptDate: rcpt.receiptDate,
        decidedAt: rcpt.decidedAt || "",
        supplierName: rcpt.supplierName,
        paymentMode: pMode,
        item
      });
      productTimelines.set(key, list);
    });
  });

  // 3. Interval Split, Subdivision & Implied Sales Recalculation:
  // Rebuilds all interval sales from scratch so any invalidated broad cycle [T_k, T_{k+1}]
  // is replaced by the newly subdivided intervals [T_k, T_new] and [T_new, T_{k+1}].
  const generatedSalesBySlot = new Map<
    string,
    {
      date: string;
      timestamp: string;
      paymentMethod: "CASH" | "MPESA" | "SPLIT";
      lines: {
        itemName: string;
        qtySold: number;
        unitLabel: string;
        revenue: number;
        cogs: number;
      }[];
    }
  >();

  const generatedRestockCards: RestockReconciliationCard[] = [];

  // Track latest active batch per product key to keep shelf stock accurate
  const latestBatchByProductKey = new Map<
    string,
    {
      latestBatch: ChronologicalProductBatch;
      totalBatchesCount: number;
    }
  >();

  productTimelines.forEach((batches, productKey) => {
    if (batches.length === 0) return;

    latestBatchByProductKey.set(productKey, {
      latestBatch: batches[batches.length - 1],
      totalBatchesCount: batches.length
    });

    const subdividedIntervals = computeAdaptiveIntervalSubdivision(productKey, batches);

    // 3A. For every closed interval [T_k, T_{k+1}] (when batches.length >= 2):
    // The quantity received at start_date cleared by end_date at daily_burn_rate = total_batch_qty / days_between
    for (let k = 0; k < batches.length - 1; k++) {
      const currentBatch = batches[k];
      const nextBatch = batches[k + 1];
      const intervalMeta = subdividedIntervals[k];

      const startIso = currentBatch.receiptDate;
      const endIso = nextBatch.receiptDate;

      const startMs = new Date(`${startIso}T00:00:00Z`).getTime();
      const endMs = new Date(`${endIso}T00:00:00Z`).getTime();
      let daysBetween = Math.round((endMs - startMs) / 86_400_000);
      if (daysBetween <= 0 || Number.isNaN(daysBetween)) {
        // Same-day restock: combine velocity
        daysBetween = 1;
      }

      const supplyQty = Math.max(1, Number(currentBatch.item.supplyUnitsReceived) || 1);
      const lineCost = Math.max(0, Number(currentBatch.item.lineCost) || 0);
      const unitWholesale =
        Number(currentBatch.item.unitCostAtDelivery) > 0
          ? Number(currentBatch.item.unitCostAtDelivery)
          : Math.round((lineCost / supplyQty) * 100) / 100;
      const unitRetail =
        Number(currentBatch.item.retailPrice) > 0
          ? Number(currentBatch.item.retailPrice)
          : Math.round(unitWholesale * 1.2 * 100) / 100;

      const totalBatchCost = lineCost > 0 ? lineCost : Math.round(supplyQty * unitWholesale * 100) / 100;
      const totalBatchRevenue = Math.round(supplyQty * unitRetail * 100) / 100;

      const kgMatch = currentBatch.item.itemName.match(/(\d+)\s*kg/i);
      const isSingleBulkBag = supplyQty === 1 && kgMatch && parseInt(kgMatch[1], 10) > 2;
      const totalBatchQty = isSingleBulkBag
        ? parseInt(kgMatch![1], 10)
        : Math.max(1, Number(currentBatch.item.retailUnitsAdded) || supplyQty);
      const effectiveUnitLabel = isSingleBulkBag
        ? "kg"
        : currentBatch.item.supplyUnit || currentBatch.item.retailUnit || "pkts";

      const dailyBurnRate = Math.round((totalBatchQty / daysBetween) * 100) / 100;
      const dailyRevenue = Math.round(dailyBurnRate * unitRetail * 100) / 100;
      const dailyCogs = Math.round(dailyBurnRate * unitWholesale * 100) / 100;

      // Generate granular daily entries across the interval [start_date .. end_date - 1 day]
      for (let dayOffset = 0; dayOffset < daysBetween; dayOffset++) {
        const entryDateObj = new Date(startMs + dayOffset * 86_400_000);
        const entryDate = Number.isNaN(entryDateObj.getTime())
          ? startIso
          : entryDateObj.toISOString().slice(0, 10);

        const timestamp = "13:30";
        const slotKey = `${entryDate}_${timestamp}_${currentBatch.paymentMode}_${k}`;
        const existingSlot = generatedSalesBySlot.get(slotKey) || {
          date: entryDate,
          timestamp,
          paymentMethod: currentBatch.paymentMode,
          lines: []
        };

        existingSlot.lines.push({
          itemName: currentBatch.item.itemName,
          qtySold: dailyBurnRate,
          unitLabel: effectiveUnitLabel,
          revenue: dailyRevenue,
          cogs: dailyCogs
        });

        generatedSalesBySlot.set(slotKey, existingSlot);
      }

      const velocityNote = intervalMeta
        ? `V = ${dailyBurnRate} ${effectiveUnitLabel}/day over Δt = ${daysBetween}d`
        : `${daysBetween} days`;

      // Build a chronologically paired RestockReconciliationCard for subdivided interval [T_k, T_{k+1}]
      generatedRestockCards.push({
        id: `restock_auto_${currentBatch.receiptId}_${nextBatch.receiptId}_${productKey.replace(/\s+/g, "_")}`,
        skuName: currentBatch.item.itemName,
        category: "Wholesale Supply",
        unitType: currentBatch.item.supplyUnit || "Packets",
        piecesPerPack: 1,
        previousBatchQty: supplyQty,
        previousBatchTotalUnits: supplyQty,
        previousBatchDate: startIso,
        previousBatchCost: totalBatchCost,
        newBatchQty: Math.max(1, Number(nextBatch.item.supplyUnitsReceived) || 1),
        newBatchDate: endIso,
        supplierName: nextBatch.supplierName,
        deliveryNoteNumber: nextBatch.receiptNumber,
        remainsOnShelf: 0,
        ownerConsumedQty: 0,
        spoilageRejectsQty: 0,
        giveawaysQty: 0,
        unitRetailPrice: unitRetail,
        unitCost: unitWholesale,
        calculatedSoldQty: supplyQty,
        calculatedRevenue: totalBatchRevenue,
        calculatedCogs: totalBatchCost,
        calculatedGrossProfit: Math.max(0, Math.round((totalBatchRevenue - totalBatchCost) * 100) / 100),
        calculatedOwnerDrawing: 0,
        calculatedSpoilageLoss: 0,
        status: "AUTHORIZED_AND_RECONCILED",
        authorizedAt: "18:00",
        authorizedDate: endIso,
        paymentMethod: currentBatch.paymentMode,
        cashPaid: currentBatch.paymentMode === "CASH" ? totalBatchRevenue : 0,
        mpesaPaid: currentBatch.paymentMode === "MPESA" ? totalBatchRevenue : 0,
        notes: `Interval [${startIso} → ${endIso}] reconciled (${velocityNote}).`
      });
    }

    // 3B. Latest restock point T_n: Batch is currently active on the shelf!
    const latestBatch = batches[batches.length - 1];
    const latestSupplyQty = Math.max(1, Number(latestBatch.item.supplyUnitsReceived) || 1);
    const latestLineCost = Math.max(0, Number(latestBatch.item.lineCost) || 0);
    const latestUnitWholesale =
      Number(latestBatch.item.unitCostAtDelivery) > 0
        ? Number(latestBatch.item.unitCostAtDelivery)
        : Math.round((latestLineCost / latestSupplyQty) * 100) / 100;
    const latestUnitRetail =
      Number(latestBatch.item.retailPrice) > 0
        ? Number(latestBatch.item.retailPrice)
        : Math.round(latestUnitWholesale * 1.2 * 100) / 100;

    // Build Restock Card for the currently active batch on shelf
    generatedRestockCards.push({
      id: `restock_active_${latestBatch.receiptId}_${productKey.replace(/\s+/g, "_")}`,
      skuName: latestBatch.item.itemName,
      category: "Wholesale Supply",
      unitType: latestBatch.item.supplyUnit || "Packets",
      piecesPerPack: 1,
      previousBatchQty: latestSupplyQty,
      previousBatchTotalUnits: latestSupplyQty,
      previousBatchDate: latestBatch.receiptDate,
      previousBatchCost: latestLineCost,
      newBatchQty: latestSupplyQty,
      newBatchDate: latestBatch.receiptDate,
      supplierName: latestBatch.supplierName,
      deliveryNoteNumber: latestBatch.receiptNumber,
      remainsOnShelf: latestSupplyQty,
      ownerConsumedQty: 0,
      spoilageRejectsQty: 0,
      giveawaysQty: 0,
      unitRetailPrice: latestUnitRetail,
      unitCost: latestUnitWholesale,
      calculatedSoldQty: 0,
      calculatedRevenue: 0,
      calculatedCogs: 0,
      calculatedGrossProfit: 0,
      calculatedOwnerDrawing: 0,
      calculatedSpoilageLoss: 0,
      status: "AUTHORIZED_AND_RECONCILED",
      authorizedAt: "18:00",
      authorizedDate: latestBatch.receiptDate,
      paymentMethod: latestBatch.paymentMode,
      cashPaid: 0,
      mpesaPaid: 0,
      notes: `Active shelf batch delivered on ${latestBatch.receiptDate} (${latestSupplyQty} ${latestBatch.item.supplyUnit || "units"} currently on shelf).`
    });
  });

  // 4. Convert generated slot map into SalesLedgerItem[] sorted chronologically
  const autoSalesLedger: SalesLedgerItem[] = Array.from(generatedSalesBySlot.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slotKey, slot], idx) => {
      const totalAmount = Math.round(slot.lines.reduce((acc, l) => acc + l.revenue, 0) * 100) / 100;
      const itemsSummary = slot.lines
        .map((l) => `${l.qtySold} ${l.unitLabel} ${l.itemName}`)
        .join(", ");

      return {
        id: `sale_rcpt_auto_${slotKey.replace(/[^a-zA-Z0-9_]/g, "")}_${idx}`,
        date: slot.date,
        timestamp: slot.timestamp,
        customer_name: "Counter Walk-in Sale",
        items_summary: itemsSummary,
        total_amount: totalAmount,
        cash_paid: slot.paymentMethod === "CASH" ? totalAmount : 0,
        mpesa_paid: slot.paymentMethod === "MPESA" ? totalAmount : 0,
        debt_amount: 0,
        payment_method: slot.paymentMethod,
        payment_channel: slot.paymentMethod,
        cash_received: slot.paymentMethod === "CASH" ? totalAmount : 0
      };
    });

  const isLegacyMockSale = (s: SalesLedgerItem) => {
    const id = String(s.id || "");
    if (/^sale_00[0-9]+$/.test(id) || /^sale_legacy_/.test(id)) return true;
    const summary = (s.items_summary || "").toLowerCase();
    return (
      summary.includes("brookside") ||
      summary.includes("broadway") ||
      summary.includes("unga jogoo") ||
      summary.includes("unga pembe") ||
      summary.includes("rina vegetable") ||
      summary.includes("festive brown") ||
      summary.includes("kcc fresh milk")
    );
  };

  // Invalidate all previous auto-generated sales from earlier broad intervals [T_k, T_{k+1}]
  const manualSales = (state.salesLedger || []).filter((s) => {
    if (String(s.id || "").startsWith("sale_rcpt_auto_")) return false;
    if (approvedChronoAsc.length > 0 && isLegacyMockSale(s)) return false;
    return true;
  });

  const combinedSalesLedger = [...manualSales, ...autoSalesLedger].sort((a, b) => {
    const dateA = normalizeIsoDate(a.date || a.timestamp?.slice(0, 10));
    const dateB = normalizeIsoDate(b.date || b.timestamp?.slice(0, 10));
    const cmp = dateA.localeCompare(dateB);
    if (cmp !== 0) return cmp;
    return (a.timestamp || "").localeCompare(b.timestamp || "");
  });

  // 5. Update inventory so all receipt products exist with accurate stock and cost
  let updatedInventory: InventoryItem[] = [...(state.inventory || [])];

  latestBatchByProductKey.forEach((tracked, productKey) => {
    const latestItem = tracked.latestBatch.item;
    const existingIdx = updatedInventory.findIndex((inv) => doProductsMatch(inv.name, latestItem.itemName));

    const latestQty = Math.max(1, Number(latestItem.supplyUnitsReceived) || 1);
    const latestLineCost = Math.max(0, Number(latestItem.lineCost) || 0);
    const latestUnitCost =
      Number(latestItem.unitCostAtDelivery) > 0
        ? Number(latestItem.unitCostAtDelivery)
        : Math.round((latestLineCost / latestQty) * 100) / 100;
    const latestRetail =
      Number(latestItem.retailPrice) > 0
        ? Number(latestItem.retailPrice)
        : Math.round(latestUnitCost * 1.2 * 100) / 100;

    const existingStock = existingIdx >= 0 ? Number(updatedInventory[existingIdx].current_stock) || 0 : 0;
    const shelfStock = Math.max(latestQty, existingStock);

    if (existingIdx >= 0) {
      updatedInventory[existingIdx] = {
        ...updatedInventory[existingIdx],
        current_stock: shelfStock,
        unit_cost: latestUnitCost,
        unit_retail: latestRetail,
        total_shelf_value: Math.round(shelfStock * latestRetail * 100) / 100,
        expected_margin: Math.round((latestRetail - latestUnitCost) * 100) / 100,
        supplier: tracked.latestBatch.supplierName || updatedInventory[existingIdx].supplier
      };
    } else {
      updatedInventory.unshift({
        id: `sku_rcpt_${productKey.replace(/\s+/g, "_")}`,
        name: latestItem.itemName,
        category: "Maize & Corn Flour",
        unit_type: latestItem.retailUnit || latestItem.supplyUnit || "pkts",
        unit_cost: latestUnitCost,
        unit_retail: latestRetail,
        current_stock: shelfStock,
        opening_stock: latestQty,
        expected_margin: Math.round((latestRetail - latestUnitCost) * 100) / 100,
        total_shelf_value: Math.round(shelfStock * latestRetail * 100) / 100,
        velocity_badge: "FAST",
        reorder_point: Math.max(1, Math.round(shelfStock * 0.25)),
        supplier: tracked.latestBatch.supplierName
      });
    }
  });

  // 6. Sort payouts chronologically by date
  const sortedPayouts: PayoutOrDrawing[] = [...(state.payouts || [])]
    .map((p) => ({
      ...p,
      date: normalizeIsoDate(p.date || p.timestamp?.slice(0, 10))
    }))
    .sort((a, b) => {
      const cmp = (a.date || "").localeCompare(b.date || "");
      if (cmp !== 0) return cmp;
      return (a.timestamp || "").localeCompare(b.timestamp || "");
    });

  // 7. Invalidate previous auto/active interval restock cards and replace with freshly subdivided cards
  const manualRestockCards = (state.restockCards || []).filter((c) => {
    const cid = String(c.id || "");
    if (cid.startsWith("restock_auto_") || cid.startsWith("restock_active_")) return false;
    const key = getCanonicalProductKey(c.skuName);
    const tracked = latestBatchByProductKey.get(key);
    if (tracked && tracked.totalBatchesCount >= 1) return false;
    return true;
  });

  const combinedRestockCards = [...generatedRestockCards, ...manualRestockCards];

  // 8. Recompute KPIs cleanly
  const totalShelfRetail = updatedInventory.reduce(
    (acc, item) => acc + (Number(item.current_stock) || 0) * (Number(item.unit_retail) || 0),
    0
  );
  const totalCapital = updatedInventory.reduce(
    (acc, item) => acc + (Number(item.current_stock) || 0) * (Number(item.unit_cost) || 0),
    0
  );
  const lockedProfit = Math.max(0, totalShelfRetail - totalCapital);
  const avgMarkup = totalCapital > 0 ? Math.round((lockedProfit / totalCapital) * 1000) / 10 : 0;

  return {
    ...state,
    inventory: updatedInventory,
    receiptsArchive: receiptsChronoAsc,
    payouts: sortedPayouts,
    salesLedger: combinedSalesLedger,
    restockCards: combinedRestockCards,
    kpis: {
      ...(state.kpis || {}),
      total_active_shelf_retail_value: Math.round(totalShelfRetail * 100) / 100,
      total_capital_invested: Math.round(totalCapital * 100) / 100,
      locked_in_potential_gross_profit: Math.round(lockedProfit * 100) / 100,
      avg_markup_percentage: avgMarkup,
      total_active_items: updatedInventory.length
    }
  };
}
