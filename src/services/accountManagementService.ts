/**
 * YuBiFLo Multi-Account Management Service
 * Allows business owners (e.g. Moses Mukangai under mosesmukangai75@gmail.com)
 * to manage and seamlessly switch between multiple business accounts / shops
 * opened under the same Gmail address.
 */

export interface UserAccount {
  id: string;
  businessName: string;
  businessType: string;
  ownerEmail: string;
  currency: string;
  role: "OWNER" | "ADMIN" | "MANAGER";
  isPrimary?: boolean;
  color?: "blue" | "emerald" | "purple" | "amber" | "rose" | "indigo";
  createdAt: string;
  lastAccessedAt: string;
}

const ACCOUNTS_STORAGE_PREFIX = "yubiflo_accounts_list_";
const ACTIVE_ACCOUNT_PREFIX = "yubiflo_active_account_";

function sanitizeEmailKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Default starter accounts for Moses Mukangai (or any owner with same Gmail)
 */
export function getDefaultAccountsForEmail(email: string): UserAccount[] {
  const cleanEmail = email.trim().toLowerCase();
  const isMoses = cleanEmail.includes("moses") || cleanEmail.includes("mukangai") || cleanEmail === "mosesmukangai75@gmail.com";

  return [
    {
      id: "acc_alacio_mini",
      businessName: isMoses ? "Alacio Mini shop" : "Alacio Retail Duka",
      businessType: "Retail / Duka",
      ownerEmail: cleanEmail,
      currency: "KSh",
      role: "OWNER",
      isPrimary: true,
      color: "blue",
      createdAt: "2026-10-01T06:00:00.000Z",
      lastAccessedAt: new Date().toISOString()
    },
    {
      id: "acc_mukangai_wholesalers",
      businessName: isMoses ? "Mukangai Wholesalers & Supplies" : "Branch 2 Wholesalers",
      businessType: "Wholesale & Cargo Depot",
      ownerEmail: cleanEmail,
      currency: "KSh",
      role: "OWNER",
      isPrimary: false,
      color: "emerald",
      createdAt: "2026-10-15T08:30:00.000Z",
      lastAccessedAt: new Date().toISOString()
    }
  ];
}

/**
 * Retrieve all business accounts associated with a specific Gmail address
 */
export function getUserAccounts(email?: string): UserAccount[] {
  const activeEmail = (email || "mosesmukangai75@gmail.com").trim().toLowerCase();
  const key = `${ACCOUNTS_STORAGE_PREFIX}${sanitizeEmailKey(activeEmail)}`;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[YuBiFlo Accounts] Error reading accounts list:", err);
  }

  // Seed default 2 accounts for this owner
  const defaults = getDefaultAccountsForEmail(activeEmail);
  saveUserAccounts(activeEmail, defaults);
  return defaults;
}

/**
 * Persist accounts array
 */
export function saveUserAccounts(email: string, accounts: UserAccount[]): void {
  const cleanEmail = email.trim().toLowerCase();
  const key = `${ACCOUNTS_STORAGE_PREFIX}${sanitizeEmailKey(cleanEmail)}`;
  try {
    localStorage.setItem(key, JSON.stringify(accounts));
  } catch (err) {
    console.error("[YuBiFlo Accounts] Failed to persist accounts:", err);
  }
}

/**
 * Get active account ID for the user's Gmail
 */
export function getActiveAccountId(email?: string): string {
  const activeEmail = (email || "mosesmukangai75@gmail.com").trim().toLowerCase();
  const key = `${ACTIVE_ACCOUNT_PREFIX}${sanitizeEmailKey(activeEmail)}`;

  try {
    const saved = localStorage.getItem(key);
    if (saved) return saved;
  } catch {}

  const accounts = getUserAccounts(activeEmail);
  const primary = accounts.find((a) => a.isPrimary) || accounts[0];
  const defaultId = primary ? primary.id : "acc_alacio_mini";
  setActiveAccountId(activeEmail, defaultId);
  return defaultId;
}

/**
 * Switch active account ID
 */
export function setActiveAccountId(email: string, accountId: string): void {
  const activeEmail = email.trim().toLowerCase();
  const key = `${ACTIVE_ACCOUNT_PREFIX}${sanitizeEmailKey(activeEmail)}`;
  try {
    localStorage.setItem(key, accountId);

    // Update lastAccessedAt on the chosen account
    const accounts = getUserAccounts(activeEmail);
    const updated = accounts.map((a) =>
      a.id === accountId ? { ...a, lastAccessedAt: new Date().toISOString() } : a
    );
    saveUserAccounts(activeEmail, updated);
  } catch (err) {
    console.error("[YuBiFlo Accounts] Failed to set active account:", err);
  }
}

/**
 * Create a new business account / shop under the current Gmail
 */
export function createAccountForUser(
  email: string,
  businessName: string,
  businessType: string = "Retail / Duka",
  currency: string = "KSh"
): UserAccount {
  const activeEmail = email.trim().toLowerCase();
  const accounts = getUserAccounts(activeEmail);

  const colors: Array<UserAccount["color"]> = ["blue", "emerald", "purple", "amber", "rose", "indigo"];
  const color = colors[accounts.length % colors.length];

  const newAccount: UserAccount = {
    id: `acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    businessName: businessName.trim() || `Shop #${accounts.length + 1}`,
    businessType: businessType || "Retail / Duka",
    ownerEmail: activeEmail,
    currency: currency || "KSh",
    role: "OWNER",
    isPrimary: accounts.length === 0,
    color,
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString()
  };

  const updated = [...accounts, newAccount];
  saveUserAccounts(activeEmail, updated);
  setActiveAccountId(activeEmail, newAccount.id);
  return newAccount;
}

/**
 * Rename or update account metadata
 */
export function updateAccountDetails(
  email: string,
  accountId: string,
  updates: Partial<Omit<UserAccount, "id" | "ownerEmail">>
): UserAccount[] {
  const activeEmail = email.trim().toLowerCase();
  const accounts = getUserAccounts(activeEmail);
  const updated = accounts.map((a) => (a.id === accountId ? { ...a, ...updates } : a));
  saveUserAccounts(activeEmail, updated);
  return updated;
}

/**
 * Delete an account (requires at least one account to remain)
 */
export function deleteAccountForUser(email: string, accountId: string): { success: boolean; activeId: string } {
  const activeEmail = email.trim().toLowerCase();
  const accounts = getUserAccounts(activeEmail);

  if (accounts.length <= 1) {
    return { success: false, activeId: accounts[0].id };
  }

  const filtered = accounts.filter((a) => a.id !== accountId);
  if (filtered.length > 0 && !filtered.some((a) => a.isPrimary)) {
    filtered[0].isPrimary = true;
  }
  saveUserAccounts(activeEmail, filtered);

  const newActiveId = filtered[0].id;
  setActiveAccountId(activeEmail, newActiveId);
  return { success: true, activeId: newActiveId };
}
