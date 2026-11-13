import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import {
  encryptClientData,
  decryptClientDataWithFallbacks,
  getPortableEncryptionSecret,
  isEncryptedPayload,
} from "../utils/zeroKnowledgeEncryption";

/**
 * YuBiFLo Multi-Account Management Service
 * Allows business owners (e.g. Moses Mukangai under mosesmukangai75@gmail.com)
 * to manage and seamlessly switch between multiple business accounts / shops
 * opened under the same Gmail address — synced securely via Cloud Firestore
 * so all accounts persist identically across domains (yubiflo.com -> yubiflo.co.ke).
 */

export interface UserAccount {
  id: string;
  businessName: string;
  businessType: string;
  proprietorName: string; // The primary shop owner (e.g. "Rose" for Alacio Mini shop, "Moses" for Mukangai Wholesalers)
  managerName?: string;   // The person managing the workspace (e.g. "Moses Mukangai")
  managementNote?: string;
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
const LAUNCHPAD_STORAGE_KEY = "yubiflo_real_launchpad_progress";

function sanitizeEmailKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getDirectoryDocId(email: string): string {
  return `dir_${sanitizeEmailKey(email).slice(0, 100)}`;
}

/**
 * Default starter accounts for Moses Mukangai (or any owner with same Gmail)
 */
export function getDefaultAccountsForEmail(email: string): UserAccount[] {
  const cleanEmail = email.trim().toLowerCase();
  const isMoses =
    cleanEmail.includes("moses") ||
    cleanEmail.includes("mukangai") ||
    cleanEmail === "mosesmukangai75@gmail.com";

  if (!isMoses) {
    return [
      {
        id: `acc_${sanitizeEmailKey(cleanEmail).slice(0, 24) || "main"}`,
        businessName: "My Business",
        businessType: "Retail / Duka",
        proprietorName: "Owner",
        ownerEmail: cleanEmail,
        currency: "KSh",
        role: "OWNER",
        isPrimary: true,
        color: "blue",
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      },
    ];
  }

  return [
    {
      id: "acc_alacio_mini",
      businessName: "Alacio Mini shop",
      businessType: "Retail / Duka",
      proprietorName: "Rose",
      managerName: "Moses Mukangai",
      managementNote: "Client Retail Duka — Owned by Rose, managed by Moses via YuBiFlo",
      ownerEmail: cleanEmail,
      currency: "KSh",
      role: "MANAGER",
      isPrimary: true,
      color: "blue",
      createdAt: "2026-10-01T06:00:00.000Z",
      lastAccessedAt: new Date().toISOString(),
    },
    {
      id: "acc_mukangai_wholesalers",
      businessName: "Mukangai Wholesalers & Supplies",
      businessType: "Wholesale & Cargo Depot",
      proprietorName: "Moses",
      managerName: "Moses Mukangai",
      managementNote: "Direct Enterprise — Owned & Operated by Moses Mukangai",
      ownerEmail: cleanEmail,
      currency: "KSh",
      role: "OWNER",
      isPrimary: false,
      color: "emerald",
      createdAt: "2026-10-15T08:30:00.000Z",
      lastAccessedAt: new Date().toISOString(),
    },
  ];
}

function patchAccountList(rawAccounts: UserAccount[]): UserAccount[] {
  return rawAccounts.map((acc: UserAccount) => {
    if (acc.id === "acc_alacio_mini" || acc.businessName?.toLowerCase().includes("alacio")) {
      return {
        ...acc,
        proprietorName: acc.proprietorName || "Rose",
        managerName: acc.managerName || "Moses Mukangai",
        managementNote: acc.managementNote || "Client Retail Duka — Owned by Rose, managed by Moses via YuBiFlo",
        role: acc.role || ("MANAGER" as const),
      };
    }
    if (acc.id === "acc_mukangai_wholesalers" || acc.businessName?.toLowerCase().includes("mukangai")) {
      return {
        ...acc,
        proprietorName: acc.proprietorName || "Moses",
        managerName: acc.managerName || "Moses Mukangai",
        managementNote: acc.managementNote || "Direct Enterprise — Owned by Moses Mukangai",
        role: acc.role || ("OWNER" as const),
      };
    }
    if (!acc.proprietorName) {
      return {
        ...acc,
        proprietorName: acc.businessName?.split(" ")[0] || "Owner",
      };
    }
    return acc;
  });
}

export function hasLocalSavedAccounts(email?: string): boolean {
  const activeEmail = (email || "mosesmukangai75@gmail.com").trim().toLowerCase();
  const key = `${ACCOUNTS_STORAGE_PREFIX}${sanitizeEmailKey(activeEmail)}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
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
        const patched = patchAccountList(parsed);
        localStorage.setItem(key, JSON.stringify(patched));
        return patched;
      }
    }
  } catch (err) {
    console.warn("[YuBiFlo Accounts] Error reading accounts list:", err);
  }

  const defaults = getDefaultAccountsForEmail(activeEmail);
  saveUserAccounts(activeEmail, defaults, true);
  return defaults;
}

let directorySyncTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Persist accounts array locally and schedule E2EE cloud directory mirror
 */
export function saveUserAccounts(
  email: string,
  accounts: UserAccount[],
  skipCloud: boolean = false
): void {
  const cleanEmail = email.trim().toLowerCase();
  const key = `${ACCOUNTS_STORAGE_PREFIX}${sanitizeEmailKey(cleanEmail)}`;
  try {
    localStorage.setItem(key, JSON.stringify(accounts));
  } catch (err) {
    console.error("[YuBiFlo Accounts] Failed to persist accounts:", err);
  }

  if (!skipCloud) {
    if (directorySyncTimer) clearTimeout(directorySyncTimer);
    directorySyncTimer = setTimeout(() => {
      const activeId = getActiveAccountId(cleanEmail);
      let lp: any = undefined;
      try {
        const rawLp = localStorage.getItem(LAUNCHPAD_STORAGE_KEY);
        if (rawLp) lp = JSON.parse(rawLp);
      } catch {}
      saveAccountDirectoryToCloud(cleanEmail, accounts, activeId, lp).catch(() => {});
    }, 1000);
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
  try {
    localStorage.setItem(key, defaultId);
  } catch {}
  return defaultId;
}

/**
 * Switch active account ID
 */
export function setActiveAccountId(email: string, accountId: string, skipCloud: boolean = false): void {
  const activeEmail = email.trim().toLowerCase();
  const key = `${ACTIVE_ACCOUNT_PREFIX}${sanitizeEmailKey(activeEmail)}`;
  try {
    localStorage.setItem(key, accountId);

    const accounts = getUserAccounts(activeEmail);
    const updated = accounts.map((a) =>
      a.id === accountId ? { ...a, lastAccessedAt: new Date().toISOString() } : a
    );
    saveUserAccounts(activeEmail, updated, skipCloud);
  } catch (err) {
    console.error("[YuBiFlo Accounts] Failed to set active account:", err);
  }
}

export function createAccountForUser(
  email: string,
  businessName: string,
  businessType: string = "Retail / Duka",
  currency: string = "KSh",
  proprietorName?: string,
  role: "OWNER" | "ADMIN" | "MANAGER" = "OWNER",
  managerName?: string
): UserAccount {
  const activeEmail = email.trim().toLowerCase();
  const accounts = getUserAccounts(activeEmail);
  const isMoses =
    activeEmail.includes("moses") ||
    activeEmail.includes("mukangai") ||
    activeEmail === "mosesmukangai75@gmail.com";

  const colors: Array<UserAccount["color"]> = ["blue", "emerald", "purple", "amber", "rose", "indigo"];
  const color = colors[accounts.length % colors.length];

  const derivedProprietor =
    (proprietorName && proprietorName.trim()) || businessName.trim().split(" ")[0] || "Owner";

  const newAccount: UserAccount = {
    id: `acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    businessName: businessName.trim() || `Business #${accounts.length + 1}`,
    businessType: businessType || "Retail / Duka",
    proprietorName: derivedProprietor,
    ...(managerName ? { managerName } : isMoses && role === "MANAGER" ? { managerName: "Moses Mukangai" } : {}),
    ownerEmail: activeEmail,
    currency: currency || "KSh",
    role,
    isPrimary: accounts.length === 0,
    color,
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  };

  const updated = [...accounts, newAccount];
  saveUserAccounts(activeEmail, updated);
  setActiveAccountId(activeEmail, newAccount.id);
  return newAccount;
}

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

export function deleteAccountForUser(
  email: string,
  accountId: string
): { success: boolean; activeId: string } {
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

/**
 * Encrypts & persists the Gmail user's business account directory + launchpad progress
 * inside Firestore `/workspaces/dir_<email>` so newly added businesses & progress
 * follow the owner seamlessly across custom domains (Twitter -> X continuity).
 */
export async function saveAccountDirectoryToCloud(
  email: string,
  accounts: UserAccount[],
  activeAccountId: string,
  launchpadProgress?: Record<string, boolean>
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return;
  const docId = getDirectoryDocId(cleanEmail);

  try {
    const cleanAccounts = accounts.map((acc) => {
      const sanitized: Record<string, any> = {};
      Object.entries(acc).forEach(([k, v]) => {
        if (v !== undefined) sanitized[k] = v;
      });
      return sanitized as UserAccount;
    });

    const vaultPayload = {
      accounts: cleanAccounts,
      activeAccountId,
      launchpadProgress: launchpadProgress || null,
      updatedAt: new Date().toISOString(),
    };

    const e2ee_vault = await encryptClientData(
      vaultPayload,
      getPortableEncryptionSecret(cleanEmail)
    );

    const ref = doc(db, "workspaces", docId);
    await setDoc(ref, {
      id: docId,
      record_type: "user_account_directory",
      e2ee_protected: true,
      e2ee_vault,
      accounts_count: cleanAccounts.length,
      last_updated: vaultPayload.updatedAt,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `workspaces/${docId}`);
  }
}

/**
 * Pulls and merges the Gmail user's business account directory from Firestore.
 * Merges cloud + local accounts by ID without losing newly created shops on either device.
 */
export async function syncAccountDirectoryFromCloud(
  email: string,
  localLaunchpad?: Record<string, boolean>
): Promise<{
  accounts: UserAccount[];
  activeAccountId: string;
  launchpadProgress?: Record<string, boolean>;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const localAccounts = getUserAccounts(cleanEmail);
  const localActiveId = getActiveAccountId(cleanEmail);
  const docId = getDirectoryDocId(cleanEmail);

  try {
    const ref = doc(db, "workspaces", docId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      let remotePayload: any = null;

      if (data?.e2ee_vault && isEncryptedPayload(data.e2ee_vault)) {
        remotePayload = await decryptClientDataWithFallbacks<any>(data.e2ee_vault, cleanEmail);
      } else if (Array.isArray(data?.accounts)) {
        remotePayload = data;
      }

      if (remotePayload && Array.isArray(remotePayload.accounts) && remotePayload.accounts.length > 0) {
        const mergedMap = new Map<string, UserAccount>();
        // Cloud accounts first, then merge any local-only custom accounts
        patchAccountList(remotePayload.accounts).forEach((acc) => mergedMap.set(acc.id, acc));
        localAccounts.forEach((acc) => {
          if (!mergedMap.has(acc.id)) {
            mergedMap.set(acc.id, acc);
          } else {
            const cloudAcc = mergedMap.get(acc.id)!;
            const localTime = Date.parse(acc.lastAccessedAt || "0") || 0;
            const cloudTime = Date.parse(cloudAcc.lastAccessedAt || "0") || 0;
            if (localTime > cloudTime) {
              mergedMap.set(acc.id, { ...cloudAcc, ...acc });
            }
          }
        });

        const mergedAccounts = Array.from(mergedMap.values());
        saveUserAccounts(cleanEmail, mergedAccounts, true);

        const resolvedActiveId =
          localActiveId && mergedAccounts.some((a) => a.id === localActiveId)
            ? localActiveId
            : (remotePayload.activeAccountId || mergedAccounts[0].id);

        try {
          localStorage.setItem(
            `${ACTIVE_ACCOUNT_PREFIX}${sanitizeEmailKey(cleanEmail)}`,
            resolvedActiveId
          );
        } catch {}

        // Merge launchpad progress (logical OR of completed steps)
        let mergedLaunchpad = localLaunchpad;
        if (remotePayload.launchpadProgress && typeof remotePayload.launchpadProgress === "object") {
          mergedLaunchpad = { ...(localLaunchpad || {}) };
          Object.entries(remotePayload.launchpadProgress).forEach(([k, v]) => {
            if (v === true) {
              mergedLaunchpad![k] = true;
            } else if (mergedLaunchpad![k] === undefined) {
              mergedLaunchpad![k] = Boolean(v);
            }
          });
        }

        // If local had additional accounts or launchpad progress not yet in cloud, push back cleanly
        if (mergedAccounts.length > remotePayload.accounts.length) {
          saveAccountDirectoryToCloud(cleanEmail, mergedAccounts, resolvedActiveId, mergedLaunchpad).catch(() => {});
        }

        return {
          accounts: mergedAccounts,
          activeAccountId: resolvedActiveId,
          launchpadProgress: mergedLaunchpad,
        };
      }
    } else {
      // Directory doesn't exist in Firestore yet — seed it silently
      saveAccountDirectoryToCloud(cleanEmail, localAccounts, localActiveId, localLaunchpad).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `workspaces/${docId}`);
  }

  return {
    accounts: localAccounts,
    activeAccountId: localActiveId,
    launchpadProgress: localLaunchpad,
  };
}
