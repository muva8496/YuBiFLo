import { CustomerDebtor, DebtLineItem } from "../types/alacio";

/**
 * Returns today's local date as YYYY-MM-DD so Kenyan EAT midnight boundaries stay accurate.
 */
export function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Adds a signed number of days to a YYYY-MM-DD date string.
 */
export function addDaysToIso(baseIso: string, days: number): string {
  const parts = baseIso.split("-").map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    return getLocalTodayIso();
  }
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Normalizes a YYYY-MM-DD string safely.
 */
export function normalizeDueDateIso(dueDate?: string): string | null {
  if (!dueDate || typeof dueDate !== "string") return null;
  const trimmed = dueDate.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

/**
 * Returns days past the hard due date:
 * - > 0: past due date (OVERDUE — debt must reflect across screens)
 * - 0: due today
 * - < 0: still before due date
 * - null: no due date set
 */
export function getDaysPastDue(
  dueDate?: string,
  todayIso: string = getLocalTodayIso()
): number | null {
  const cleanDue = normalizeDueDateIso(dueDate);
  if (!cleanDue) return null;

  const [ty, tm, td] = todayIso.split("-").map(Number);
  const [dy, dm, dd] = cleanDue.split("-").map(Number);
  if ([ty, tm, td, dy, dm, dd].some(isNaN)) return null;

  const todayMs = Date.UTC(ty, tm - 1, td);
  const dueMs = Date.UTC(dy, dm - 1, dd);
  return Math.round((todayMs - dueMs) / 86400000);
}

/**
 * Returns true strictly when unpaid debt > 0 AND today has gone past the pay-by date.
 */
export function isDebtorOverdue(
  debtor: CustomerDebtor,
  todayIso: string = getLocalTodayIso()
): boolean {
  if ((Number(debtor.debt_balance) || 0) <= 0) return false;
  const diff = getDaysPastDue(debtor.due_date, todayIso);
  return diff !== null && diff > 0;
}

export interface OverdueDebtorAlert extends CustomerDebtor {
  daysPastDue: number;
}

/**
 * Returns all debtor accounts whose due date has passed with remaining debt > 0,
 * sorted by most days overdue, then largest debt balance.
 */
export function getOverdueDebtors(
  customers: CustomerDebtor[] = [],
  todayIso: string = getLocalTodayIso()
): OverdueDebtorAlert[] {
  return customers
    .filter((c) => isDebtorOverdue(c, todayIso))
    .map((c) => ({
      ...c,
      daysPastDue: getDaysPastDue(c.due_date, todayIso) || 1
    }))
    .sort((a, b) => {
      if (b.daysPastDue !== a.daysPastDue) return b.daysPastDue - a.daysPastDue;
      return (Number(b.debt_balance) || 0) - (Number(a.debt_balance) || 0);
    });
}

/**
 * Formats real itemized goods/stuff taken by a debtor into a concise readable summary.
 */
export function formatDebtItemsSummary(items?: DebtLineItem[]): string {
  if (!items || items.length === 0) return "";
  return items
    .map((it) => {
      const unitPart = it.unit_type ? ` ${it.unit_type}` : "";
      return `${it.qty}${unitPart} × ${it.item_name}`;
    })
    .join(", ");
}
