import { MorningBookendRecord } from "../types/alacio";

/**
 * Parses any Kenyan/English date string like "Wed, 7 Oct 2026" or "Thu, 8 Oct 2026" into YYYY-MM-DD.
 */
function parseDateStringToIso(dateStr: string): string | null {
  const match = dateStr.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i);
  if (match) {
    const day = match[2];
    const monthStr = match[3];
    const year = match[4];
    const parsed = new Date(`${day} ${monthStr} ${year} 12:00:00 UTC`);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getUTCFullYear();
      const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
      const d = String(parsed.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

/**
 * Resolves the canonical YYYY-MM-DD operating date for any MorningBookendRecord.
 * Handles legacy records with "Today", dates embedded in notes/timestamps, or Unix epochs in IDs.
 */
export function resolveRecordIsoDate(record: Partial<MorningBookendRecord>): string {
  // 1. Explicit valid iso_date
  if (record.iso_date && /^\d{4}-\d{2}-\d{2}$/.test(record.iso_date)) {
    return record.iso_date;
  }

  // 2. record.date is already YYYY-MM-DD
  if (record.date && /^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    return record.date;
  }

  // 3. Check notes for "(Today (Wed, 7 Oct 2026))" or "(Thu, 8 Oct 2026)"
  if (record.notes) {
    const iso = parseDateStringToIso(record.notes);
    if (iso) return iso;
  }

  // 4. Check record.date for "Wed, 7 Oct 2026"
  if (record.date) {
    const iso = parseDateStringToIso(record.date);
    if (iso) return iso;
  }

  // 5. Check record.timestamp for "Wed, 7 Oct 2026"
  if (record.timestamp) {
    const iso = parseDateStringToIso(record.timestamp);
    if (iso) return iso;
  }

  // 6. Check record.id Unix timestamp (e.g. mb_1728328123456)
  if (record.id && record.id.startsWith("mb_")) {
    const epoch = Number(record.id.slice(3));
    if (!isNaN(epoch) && epoch > 1600000000000) {
      const d = new Date(epoch);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  }

  // 7. Fallback to today
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns formatted calendar date: e.g. "Thu, 8 Oct 2026"
 */
export function formatCanonicalDisplayDate(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    }
  }
  return isoDate;
}

/**
 * Returns relative human label:
 * - "Today, Thu, 8 Oct 2026"
 * - "Yesterday, Wed, 7 Oct 2026"
 * - "Mon, 5 Oct 2026"
 */
export function formatRecordDisplayLabel(isoDate: string): string {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);

  const canonical = formatCanonicalDisplayDate(isoDate);

  if (isoDate === todayIso) {
    return `Today (${canonical})`;
  }
  if (isoDate === yesterdayIso) {
    return `Yesterday (${canonical})`;
  }
  return canonical;
}

/**
 * Extracts creation timestamp epoch for ordering records chronologically.
 */
function getRecordTimestampEpoch(record: MorningBookendRecord): number {
  if (record.id && record.id.startsWith("mb_")) {
    const epoch = Number(record.id.slice(3));
    if (!isNaN(epoch) && epoch > 1600000000000) {
      return epoch;
    }
  }
  return 0;
}

/**
 * DEDUPLICATION & OVERWRITE ENGINE:
 * "if values were entered twice always consider the later information to overwrite the former,,
 * always remember no losing of any data"
 *
 * For any operating date that has multiple entries, the LATER entry overwrites the former entry!
 * All unique dates are preserved with zero loss.
 */
export function deduplicateMorningBookends(records: MorningBookendRecord[]): MorningBookendRecord[] {
  if (!Array.isArray(records) || records.length === 0) return [];

  // Map keyed by isoDate
  const dateMap = new Map<string, { record: MorningBookendRecord; index: number; epoch: number }>();

  records.forEach((rec, idx) => {
    const isoDate = resolveRecordIsoDate(rec);
    const epoch = getRecordTimestampEpoch(rec);
    const existing = dateMap.get(isoDate);

    if (!existing) {
      // First time seeing this date
      dateMap.set(isoDate, {
        record: {
          ...rec,
          iso_date: isoDate,
          date: formatRecordDisplayLabel(isoDate)
        },
        index: idx,
        epoch
      });
    } else {
      // Date entered twice! Rule: Later information overwrites former!
      // In records array, either index 0 is later (if unshifted) OR higher epoch is later.
      // If the current rec has higher epoch OR earlier index, it's newer.
      const isCurrentLater = epoch > existing.epoch || (epoch === existing.epoch && idx < existing.index);

      if (isCurrentLater) {
        dateMap.set(isoDate, {
          record: {
            ...rec,
            iso_date: isoDate,
            date: formatRecordDisplayLabel(isoDate),
            was_overwritten: true
          },
          index: idx,
          epoch
        });
      } else {
        // existing was already later, so existing overwrote rec!
        existing.record.was_overwritten = true;
      }
    }
  });

  // Convert map values to array sorted with newest dates / latest entries first
  const result = Array.from(dateMap.values())
    .sort((a, b) => {
      // Sort primarily by isoDate descending (newest dates first)
      if (a.record.iso_date && b.record.iso_date) {
        const dateDiff = b.record.iso_date.localeCompare(a.record.iso_date);
        if (dateDiff !== 0) return dateDiff;
      }
      return b.epoch - a.epoch;
    })
    .map((item) => item.record);

  return result;
}

/**
 * Upserts a new morning baseline into records:
 * If an entry for newRecord.iso_date already exists, the later information
 * OVERWRITES the former record for that date in-place (or moved to top),
 * preserving all other dates without loss!
 */
export function upsertMorningBookend(
  existingRecords: MorningBookendRecord[],
  newRecord: MorningBookendRecord
): { records: MorningBookendRecord[]; wasOverwritten: boolean } {
  const targetIso = newRecord.iso_date || resolveRecordIsoDate(newRecord);
  const normalizedNewRecord: MorningBookendRecord = {
    ...newRecord,
    iso_date: targetIso,
    date: formatRecordDisplayLabel(targetIso)
  };

  let wasOverwritten = false;
  const filtered = (existingRecords || []).filter((r) => {
    const rIso = resolveRecordIsoDate(r);
    if (rIso === targetIso) {
      wasOverwritten = true;
      return false; // remove former record because later information overwrites it
    }
    return true;
  });

  if (wasOverwritten) {
    normalizedNewRecord.was_overwritten = true;
  }

  const updatedList = [normalizedNewRecord, ...filtered];
  return {
    records: deduplicateMorningBookends(updatedList),
    wasOverwritten
  };
}
