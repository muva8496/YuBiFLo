/**
 * YubiFlo - Intelligent Fuzzy Name Matcher & Auto-Merging Engine
 * 
 * CORE RULES:
 * 1. "Names of people are names of people and sometimes we have typos.
 *    Unless specially specified, names that seem to resemble should immediately merge."
 * 2. Compares supplier names and customer names using normalized tokens and Levenshtein distance.
 *    - e.g. "Jeremiah_bread", "Jeremiah bread", "Jeremia bread", "Jeremiah Bread Ltd" -> merge to "Jeremiah_bread"
 *    - e.g. "Musa", "Mussa", "Musa Retail" -> merge to "Musa"
 *    - e.g. "Mama Kevin", "Mama Kevine" -> merge to "Mama Kevin"
 * 3. Auto-registers new suppliers and new customers on the fly during supply or sales logging.
 */

import { CustomerDebtor, SupplierProfile } from "../types/alacio";

/**
 * Normalizes a name string by removing special characters, excess spaces,
 * and common Kenyan business suffixes for clean phonetic/token comparison.
 */
export function normalizePartyToken(name: string): string {
  if (!name) return "";
  let clean = name.toLowerCase().trim();

  // Replace separators with spaces
  clean = clean.replace(/[_.\-\/]+/g, " ");

  // Remove common generic business words
  clean = clean
    .replace(/\bltd\b/g, "")
    .replace(/\blimited\b/g, "")
    .replace(/\benterprises?\b/g, "")
    .replace(/\bstores?\b/g, "")
    .replace(/\bbakery\b/g, "")
    .replace(/\bdistributors?\b/g, "")
    .replace(/\bshop\b/g, "");

  // Collapse multiple spaces
  clean = clean.replace(/[^a-z0-9 ]+/g, "").trim().replace(/\s+/g, " ");
  return clean;
}

/**
 * Standard Levenshtein edit distance algorithm
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Computes a similarity score between 0.0 and 1.0
 */
export function calculateNameSimilarity(nameA: string, nameB: string): number {
  if (!nameA || !nameB) return 0;
  if (nameA.trim().toLowerCase() === nameB.trim().toLowerCase()) return 1.0;

  const normA = normalizePartyToken(nameA);
  const normB = normalizePartyToken(nameB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0;

  // Direct containment check (e.g. "Jeremiah" in "Jeremiah bread")
  if (normA.includes(normB) || normB.includes(normA)) {
    return 0.90;
  }

  const maxLen = Math.max(normA.length, normB.length);
  const dist = calculateLevenshteinDistance(normA, normB);
  const similarity = 1 - (dist / maxLen);

  return Math.max(0, Math.round(similarity * 100) / 100);
}

/**
 * Determines whether two party names resemble each other sufficiently to merge.
 * Threshold: similarity >= 0.78 or edit distance <= 2 for short names.
 */
export function doPartyNamesResemble(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;
  const rawA = nameA.trim().toLowerCase();
  const rawB = nameB.trim().toLowerCase();
  if (rawA === rawB) return true;

  const normA = normalizePartyToken(nameA);
  const normB = normalizePartyToken(nameB);

  if (normA === normB) return true;

  const dist = calculateLevenshteinDistance(normA, normB);
  if (dist <= 2 && Math.min(normA.length, normB.length) >= 3) {
    return true;
  }

  return calculateNameSimilarity(nameA, nameB) >= 0.78;
}

/**
 * Finds an existing supplier that resembles the input supplier name.
 * If found, returns the canonical existing supplier profile.
 */
export function findMatchingSupplier(
  inputName: string,
  existingSuppliers: SupplierProfile[]
): SupplierProfile | null {
  if (!inputName || !existingSuppliers || existingSuppliers.length === 0) return null;

  for (const supp of existingSuppliers) {
    if (doPartyNamesResemble(inputName, supp.name) || doPartyNamesResemble(inputName, supp.company)) {
      return supp;
    }
  }

  return null;
}

/**
 * Finds an existing customer debtor that resembles the input name.
 * If found, returns the canonical existing customer record.
 */
export function findMatchingCustomer(
  inputName: string,
  existingCustomers: CustomerDebtor[]
): CustomerDebtor | null {
  if (!inputName || !existingCustomers || existingCustomers.length === 0) return null;

  for (const cust of existingCustomers) {
    if (doPartyNamesResemble(inputName, cust.name)) {
      return cust;
    }
  }

  return null;
}

/**
 * Reconciles and auto-registers a supplier on the fly:
 * - If a supplier already exists (or has a typo resemblance), merges with that supplier.
 * - If completely new, auto-registers them in the suppliers array!
 */
export function reconcileOrRegisterSupplier(
  inputName: string,
  existingSuppliers: SupplierProfile[],
  meta?: {
    phone?: string;
    national_id?: string;
    orderCost?: number;
    deliveryDate?: string;
    suppliedItems?: string[];
  }
): {
  canonicalName: string;
  updatedSuppliers: SupplierProfile[];
  isNew: boolean;
} {
  const cleanName = inputName.trim();
  if (!cleanName) {
    return { canonicalName: inputName, updatedSuppliers: existingSuppliers, isNew: false };
  }

  const match = findMatchingSupplier(cleanName, existingSuppliers);

  if (match) {
    // Merge into canonical supplier
    const updated = existingSuppliers.map((s) => {
      if (s.id === match.id) {
        const mergedItems = Array.from(new Set([...(s.supplied_items || []), ...(meta?.suppliedItems || [])]));
        return {
          ...s,
          total_orders_cost: (Number(s.total_orders_cost) || 0) + (Number(meta?.orderCost) || 0),
          last_delivery_date: meta?.deliveryDate || s.last_delivery_date,
          phone: meta?.phone && meta.phone !== "0722 000 111" ? meta.phone : s.phone,
          national_id: meta?.national_id && meta.national_id !== "ID-PENDING" ? meta.national_id : s.national_id,
          supplied_items: mergedItems
        };
      }
      return s;
    });

    return {
      canonicalName: match.name, // Use the canonical name to merge typos!
      updatedSuppliers: updated,
      isNew: false
    };
  }

  // Brand new supplier: auto-register!
  const newSupplier: SupplierProfile = {
    id: `supp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    company: cleanName,
    phone: meta?.phone || "0722 000 111",
    national_id: meta?.national_id || "ID-PENDING",
    category: "Wholesale Distributor",
    total_orders_cost: Number(meta?.orderCost) || 0,
    last_delivery_date: meta?.deliveryDate || new Date().toISOString().slice(0, 10),
    payment_preference: "NATIONAL_ID_DEPOSIT",
    supplied_items: meta?.suppliedItems || []
  };

  return {
    canonicalName: cleanName,
    updatedSuppliers: [newSupplier, ...existingSuppliers],
    isNew: true
  };
}

/**
 * Reconciles and auto-registers a customer debtor on the fly:
 * - If a customer resembles an existing one, merges debt into that customer.
 * - If completely new, auto-registers them in the customers list!
 */
export function reconcileOrRegisterCustomer(
  inputName: string,
  existingCustomers: CustomerDebtor[],
  meta?: {
    debtDelta?: number;
    phone?: string;
    date?: string;
    notes?: string;
  }
): {
  canonicalName: string;
  updatedCustomers: CustomerDebtor[];
  isNew: boolean;
} {
  const cleanName = inputName.trim();
  if (!cleanName || cleanName.toLowerCase().includes("walk in") || cleanName.toLowerCase().includes("counter")) {
    return { canonicalName: inputName, updatedCustomers: existingCustomers, isNew: false };
  }

  const match = findMatchingCustomer(cleanName, existingCustomers);

  if (match) {
    // Merge into existing customer
    const updated = existingCustomers.map((c) => {
      if (c.id === match.id) {
        return {
          ...c,
          debt_balance: Math.max(0, (Number(c.debt_balance) || 0) + (Number(meta?.debtDelta) || 0)),
          last_transaction_date: meta?.date || "Today",
          phone: meta?.phone || c.phone,
          notes: meta?.notes ? `${c.notes || ""}; ${meta.notes}`.trim() : c.notes
        };
      }
      return c;
    });

    return {
      canonicalName: match.name,
      updatedCustomers: updated,
      isNew: false
    };
  }

  // Auto-register new customer
  const newCustomer: CustomerDebtor = {
    id: `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    phone: meta?.phone || "0700 000 000",
    credit_limit: 5000,
    debt_balance: Math.max(0, Number(meta?.debtDelta) || 0),
    last_transaction_date: meta?.date || "Today",
    notes: meta?.notes || "Auto-registered from sales recording"
  };

  return {
    canonicalName: cleanName,
    updatedCustomers: [newCustomer, ...existingCustomers],
    isNew: true
  };
}
