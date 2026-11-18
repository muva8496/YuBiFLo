import {
  AlacioMasterState,
  DataWarehouseArchive,
  MorningBookendRecord,
  PayoutOrDrawing,
  ReconciliationAudit,
  RestockReconciliationCard,
  SalesLedgerItem,
  SavedReceiptRecord
} from "../types/alacio";
import { addDaysToIso, getLocalTodayIso } from "./debtScheduleHelper";

export const DEFAULT_RETENTION_DAYS = 14;

/**
 * Extracts a normalized YYYY-MM-DD date from any historical record field.
 * Returns null if no valid calendar date can be determined (preserving timeless/undated rows).
 */
export function extractRecordIsoDate(rawDate?: string, rawTimestamp?: string): string | null {
  const candidates = [rawDate, rawTimestamp];
  for (const cand of candidates) {
    if (!cand || typeof cand !== "string") continue;
    const trimmed = cand.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    const dmyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    }
  }
  return null;
}

export function isDateOlderThanRetention(isoDate: string | null, cutoffIso: string): boolean {
  if (!isoDate) return false;
  return isoDate <= cutoffIso;
}

function mergeById<T extends { id?: string | number }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of [...incoming, ...existing]) {
    const key = String(item?.id ?? JSON.stringify(item));
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export function buildArchiveSummary(archive: Omit<DataWarehouseArchive, "summary">) {
  return {
    total_archived_sales_count: archive.salesLedger.length,
    total_archived_sales_amount: Math.round(
      archive.salesLedger.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0) * 100
    ) / 100,
    total_archived_payouts_count: archive.payouts.length,
    total_archived_payouts_amount: Math.round(
      archive.payouts.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) * 100
    ) / 100,
    total_archived_receipts_count: archive.receiptsArchive.length
  };
}

export function createEmptyDataWarehouseArchive(retentionDays = DEFAULT_RETENTION_DAYS): DataWarehouseArchive {
  const cutoff = addDaysToIso(getLocalTodayIso(), -Math.max(1, retentionDays));
  return {
    last_archived_at: new Date().toISOString(),
    retention_days: retentionDays,
    cutoff_date: cutoff,
    salesLedger: [],
    payouts: [],
    receiptsArchive: [],
    restockCards: [],
    reconciliations: [],
    morning_bookends: [],
    summary: {
      total_archived_sales_count: 0,
      total_archived_sales_amount: 0,
      total_archived_payouts_count: 0,
      total_archived_payouts_amount: 0,
      total_archived_receipts_count: 0
    }
  };
}

export function getEligibleArchiveCounts(
  state: AlacioMasterState,
  retentionDays: number = state.dataWarehouseRetentionDays ?? DEFAULT_RETENTION_DAYS
): {
  cutoffDate: string;
  salesCount: number;
  payoutsCount: number;
  receiptsCount: number;
  restockCount: number;
  reconCount: number;
  bookendsCount: number;
  totalCount: number;
} {
  const safeDays = Math.max(1, Number(retentionDays) || DEFAULT_RETENTION_DAYS);
  const cutoffDate = addDaysToIso(getLocalTodayIso(), -safeDays);

  const salesCount = (state.salesLedger || []).filter((s) =>
    isDateOlderThanRetention(extractRecordIsoDate(s.date, s.timestamp), cutoffDate)
  ).length;

  const payoutsCount = (state.payouts || []).filter((p) =>
    isDateOlderThanRetention(extractRecordIsoDate(p.date, p.timestamp), cutoffDate)
  ).length;

  const receiptsCount = (state.receiptsArchive || []).filter((r) =>
    isDateOlderThanRetention(extractRecordIsoDate(r.receiptDate, r.decidedAt), cutoffDate)
  ).length;

  const restockCount = (state.restockCards || []).filter((c) =>
    c.status === "AUTHORIZED_AND_RECONCILED" &&
    isDateOlderThanRetention(extractRecordIsoDate(c.authorizedDate || c.newBatchDate), cutoffDate)
  ).length;

  const reconCount = (state.reconciliations || []).filter((r) =>
    isDateOlderThanRetention(extractRecordIsoDate(r.date, r.sealed_at), cutoffDate)
  ).length;

  const bookendsCount = (state.morning_bookends || []).filter((m) =>
    isDateOlderThanRetention(extractRecordIsoDate(m.iso_date || m.date, m.timestamp), cutoffDate)
  ).length;

  return {
    cutoffDate,
    salesCount,
    payoutsCount,
    receiptsCount,
    restockCount,
    reconCount,
    bookendsCount,
    totalCount: salesCount + payoutsCount + receiptsCount + restockCount + reconCount + bookendsCount
  };
}

/**
 * Moves recorded sales, inbound cargo/payouts, receipts, reconciled restock cards,
 * audits, and morning bookends older than `retentionDays` (default 14 days)
 * OUT of the active app workspace and INTO `state.dataWarehouseArchive`.
 */
export function archiveOldRecordsToDataWarehouse(
  state: AlacioMasterState,
  retentionDays: number = state.dataWarehouseRetentionDays ?? DEFAULT_RETENTION_DAYS,
  options?: { force?: boolean }
): {
  nextState: AlacioMasterState;
  archivedCount: number;
  cutoffDate: string;
} {
  const safeDays = Math.max(1, Number(retentionDays) || DEFAULT_RETENTION_DAYS);
  const cutoffDate = addDaysToIso(getLocalTodayIso(), -safeDays);

  // Skip auto-archiving untouched demo templates unless proprietor triggers it manually
  if (state.is_demo_template && !options?.force) {
    return { nextState: state, archivedCount: 0, cutoffDate };
  }

  const prevArchive = state.dataWarehouseArchive || createEmptyDataWarehouseArchive(safeDays);

  const activeSales: SalesLedgerItem[] = [];
  const agedSales: SalesLedgerItem[] = [];
  for (const s of state.salesLedger || []) {
    if (isDateOlderThanRetention(extractRecordIsoDate(s.date, s.timestamp), cutoffDate)) {
      agedSales.push(s);
    } else {
      activeSales.push(s);
    }
  }

  const activePayouts: PayoutOrDrawing[] = [];
  const agedPayouts: PayoutOrDrawing[] = [];
  for (const p of state.payouts || []) {
    if (isDateOlderThanRetention(extractRecordIsoDate(p.date, p.timestamp), cutoffDate)) {
      agedPayouts.push(p);
    } else {
      activePayouts.push(p);
    }
  }

  const activeReceipts: SavedReceiptRecord[] = [];
  const agedReceipts: SavedReceiptRecord[] = [];
  for (const r of state.receiptsArchive || []) {
    if (isDateOlderThanRetention(extractRecordIsoDate(r.receiptDate, r.decidedAt), cutoffDate)) {
      agedReceipts.push(r);
    } else {
      activeReceipts.push(r);
    }
  }

  const activeRestock: RestockReconciliationCard[] = [];
  const agedRestock: RestockReconciliationCard[] = [];
  for (const c of state.restockCards || []) {
    if (
      c.status === "AUTHORIZED_AND_RECONCILED" &&
      isDateOlderThanRetention(extractRecordIsoDate(c.authorizedDate || c.newBatchDate), cutoffDate)
    ) {
      agedRestock.push(c);
    } else {
      activeRestock.push(c);
    }
  }

  const activeRecons: ReconciliationAudit[] = [];
  const agedRecons: ReconciliationAudit[] = [];
  for (const r of state.reconciliations || []) {
    if (isDateOlderThanRetention(extractRecordIsoDate(r.date, r.sealed_at), cutoffDate)) {
      agedRecons.push(r);
    } else {
      activeRecons.push(r);
    }
  }

  const activeBookends: MorningBookendRecord[] = [];
  const agedBookends: MorningBookendRecord[] = [];
  for (const m of state.morning_bookends || []) {
    if (isDateOlderThanRetention(extractRecordIsoDate(m.iso_date || m.date, m.timestamp), cutoffDate)) {
      agedBookends.push(m);
    } else {
      activeBookends.push(m);
    }
  }

  const archivedCount =
    agedSales.length +
    agedPayouts.length +
    agedReceipts.length +
    agedRestock.length +
    agedRecons.length +
    agedBookends.length;

  if (archivedCount === 0 && state.dataWarehouseArchive && state.dataWarehouseRetentionDays === safeDays) {
    return { nextState: state, archivedCount: 0, cutoffDate };
  }

  const nextArchiveCore: Omit<DataWarehouseArchive, "summary"> = {
    last_archived_at: archivedCount > 0 ? new Date().toISOString() : prevArchive.last_archived_at,
    retention_days: safeDays,
    cutoff_date: cutoffDate,
    salesLedger: mergeById(prevArchive.salesLedger || [], agedSales),
    payouts: mergeById(prevArchive.payouts || [], agedPayouts),
    receiptsArchive: mergeById(prevArchive.receiptsArchive || [], agedReceipts),
    restockCards: mergeById(prevArchive.restockCards || [], agedRestock),
    reconciliations: mergeById(prevArchive.reconciliations || [], agedRecons),
    morning_bookends: mergeById(prevArchive.morning_bookends || [], agedBookends)
  };

  const nextArchive: DataWarehouseArchive = {
    ...nextArchiveCore,
    summary: buildArchiveSummary(nextArchiveCore)
  };

  return {
    nextState: {
      ...state,
      dataWarehouseRetentionDays: safeDays,
      salesLedger: activeSales,
      payouts: activePayouts,
      receiptsArchive: activeReceipts,
      restockCards: activeRestock,
      reconciliations: activeRecons,
      morning_bookends: activeBookends,
      dataWarehouseArchive: nextArchive
    },
    archivedCount,
    cutoffDate
  };
}

/**
 * Restores a single record from `dataWarehouseArchive` back into active app state.
 */
export function restoreRecordFromDataWarehouse(
  state: AlacioMasterState,
  collectionKey: "salesLedger" | "payouts" | "receiptsArchive" | "reconciliations" | "restockCards" | "morning_bookends",
  recordId: string | number
): AlacioMasterState {
  const archive = state.dataWarehouseArchive;
  if (!archive) return state;

  const list = (archive[collectionKey] || []) as any[];
  const target = list.find((r) => String(r?.id) === String(recordId));
  if (!target) return state;

  const remainingArchived = list.filter((r) => String(r?.id) !== String(recordId));
  const nextActiveList = [target, ...((state[collectionKey] as any[]) || [])];

  const nextArchiveCore: Omit<DataWarehouseArchive, "summary"> = {
    ...archive,
    [collectionKey]: remainingArchived
  };

  return {
    ...state,
    [collectionKey]: nextActiveList,
    dataWarehouseArchive: {
      ...nextArchiveCore,
      summary: buildArchiveSummary(nextArchiveCore)
    },
    last_updated: new Date().toISOString()
  };
}
