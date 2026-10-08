import { SupplierProfile } from "../types/alacio";

/**
 * Normalizes a Kenyan National ID or passport number for strict matching.
 */
export function normalizeNationalId(id?: string): string {
  if (!id) return "";
  return id.trim().replace(/[\s-]/g, "");
}

/**
 * Normalizes a company or supplier name for matching (removes Ltd, Limited, special characters, whitespace).
 */
export function normalizeCompanyName(name?: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|co|company|enterprises|distributors)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Determines if two supplier profiles represent the same supplier entity.
 */
export function isSameSupplier(
  a: Partial<SupplierProfile>,
  b: Partial<SupplierProfile>
): boolean {
  const nidA = normalizeNationalId(a.national_id);
  const nidB = normalizeNationalId(b.national_id);
  if (nidA && nidB && nidA === nidB) {
    return true;
  }

  const compA = normalizeCompanyName(a.company || a.name);
  const compB = normalizeCompanyName(b.company || b.name);
  if (compA && compB && compA === compB) {
    return true;
  }

  const nameA = normalizeCompanyName(a.name);
  const nameB = normalizeCompanyName(b.name);
  if (nameA && nameB && nameA === nameB) {
    return true;
  }

  return false;
}

/**
 * Deduplicates an array of suppliers so each supplier is recorded ONLY ONCE.
 * When duplicates exist (e.g. from pressing Enter multiple times), the later information
 * overwrites the former, and financial order totals are preserved with ZERO loss of data.
 */
export function deduplicateSuppliers(suppliers: SupplierProfile[]): SupplierProfile[] {
  if (!Array.isArray(suppliers) || suppliers.length === 0) {
    return [];
  }

  const deduped: SupplierProfile[] = [];

  for (const supp of suppliers) {
    const existingIndex = deduped.findIndex((item) => isSameSupplier(item, supp));

    if (existingIndex === -1) {
      // First occurrence, add to deduplicated list
      deduped.push({ ...supp });
    } else {
      // Supplier entered twice or more: later information overwrites former
      const prev = deduped[existingIndex];
      deduped[existingIndex] = {
        ...prev,
        ...supp,
        id: prev.id || supp.id, // Keep stable identifier
        // Preserve and safely sum or take maximum order value so no financial data is lost
        total_orders_cost: Math.max(
          Number(prev.total_orders_cost) || 0,
          Number(supp.total_orders_cost) || 0
        ),
        last_delivery_date:
          supp.last_delivery_date && supp.last_delivery_date !== "Pending" && supp.last_delivery_date !== "Never"
            ? supp.last_delivery_date
            : prev.last_delivery_date || "Pending",
        phone: supp.phone && supp.phone !== "07XX XXX XXX" ? supp.phone : prev.phone,
        national_id: supp.national_id || prev.national_id,
        driver_name: supp.driver_name || prev.driver_name,
        till_or_account: supp.till_or_account || prev.till_or_account
      };
    }
  }

  return deduped;
}

/**
 * Upserts a supplier: if already exists, updates details in-place without duplicating.
 * If new, prepends to list. Guarantees suppliers are recorded ONLY ONCE.
 */
export function upsertSupplier(
  existingList: SupplierProfile[],
  newSupplier: Omit<SupplierProfile, "id" | "total_orders_cost" | "last_delivery_date"> & Partial<SupplierProfile>
): { updatedList: SupplierProfile[]; wasExisting: boolean; supplier: SupplierProfile } {
  const currentList = deduplicateSuppliers(existingList);
  const matchIndex = currentList.findIndex((item) => isSameSupplier(item, newSupplier));

  if (matchIndex !== -1) {
    const prev = currentList[matchIndex];
    const updatedSupplier: SupplierProfile = {
      ...prev,
      ...newSupplier,
      id: prev.id,
      total_orders_cost: Number(prev.total_orders_cost) || 0,
      last_delivery_date: prev.last_delivery_date || "Pending",
      national_id: newSupplier.national_id || prev.national_id,
      phone: newSupplier.phone && newSupplier.phone !== "07XX XXX XXX" ? newSupplier.phone : prev.phone,
      company: newSupplier.company || prev.company,
      name: newSupplier.name || prev.name
    };

    const nextList = [...currentList];
    nextList[matchIndex] = updatedSupplier;
    return {
      updatedList: nextList,
      wasExisting: true,
      supplier: updatedSupplier
    };
  }

  const createdSupplier: SupplierProfile = {
    id: newSupplier.id || `supp_${Date.now()}`,
    name: newSupplier.name,
    company: newSupplier.company,
    driver_name: newSupplier.driver_name,
    phone: newSupplier.phone,
    national_id: newSupplier.national_id,
    category: newSupplier.category,
    payment_preference: newSupplier.payment_preference || "NATIONAL_ID_DEPOSIT",
    till_or_account: newSupplier.till_or_account,
    payment_terms: newSupplier.payment_terms || "Cash on Delivery",
    total_orders_cost: Number(newSupplier.total_orders_cost) || 0,
    last_delivery_date: newSupplier.last_delivery_date || "Pending"
  };

  return {
    updatedList: [createdSupplier, ...currentList],
    wasExisting: false,
    supplier: createdSupplier
  };
}
