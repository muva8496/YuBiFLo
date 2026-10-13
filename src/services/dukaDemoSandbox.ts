import { AlacioMasterState } from "../types/alacio";
import { INITIAL_ALACIO_STATE } from "./alacioStorage";

const DEMO_STORAGE_KEY = "yubiflo_duka_space_sandbox_v1";
const DEMO_META_KEY = "yubiflo_duka_space_sandbox_meta";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Creates a fresh, isolated sample dataset for Duka Space demo workspace.
 * All figures are representative sample data for a busy Kenyan FMCG duka.
 */
export function createFreshDemoState(): AlacioMasterState {
  const cloned = JSON.parse(JSON.stringify(INITIAL_ALACIO_STATE)) as AlacioMasterState;
  
  return {
    ...cloned,
    merchant_name: "Duka Space",
    client_type: "Retail FMCG & Neighborhood Duka (Demo Sandbox)",
    tier: "FREE_STARTER",
    cash_register_balance: 14200,
    mpesa_float_balance: 28300,
    equitel_account_balance: 5000,
    vcr_daily_count: 14,
    vcr_customer_consent: true,
    clean_trading_days: 18,
    last_updated: new Date().toISOString()
  };
}

/**
 * Load isolated demo sandbox state.
 * Resets automatically if sandbox is older than 24 hours.
 */
export function loadDemoSandboxState(): AlacioMasterState {
  try {
    const metaRaw = localStorage.getItem(DEMO_META_KEY);
    const now = Date.now();

    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      // Auto-reset if sandbox is older than 24 hours
      if (meta.createdAt && (now - meta.createdAt > TWENTY_FOUR_HOURS_MS)) {
        return resetDemoSandbox();
      }
    }

    const dataRaw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!dataRaw) {
      const fresh = createFreshDemoState();
      saveDemoSandboxState(fresh);
      return fresh;
    }

    const parsed = JSON.parse(dataRaw);
    return {
      ...createFreshDemoState(),
      ...parsed,
      merchant_name: "Duka Space"
    };
  } catch (err) {
    console.warn("Error loading demo sandbox state, resetting:", err);
    return resetDemoSandbox();
  }
}

/**
 * Save state changes to the isolated demo sandbox.
 * Never touches real workspace data or production storage keys.
 */
export function saveDemoSandboxState(state: AlacioMasterState): void {
  try {
    const sanitized = {
      ...state,
      merchant_name: "Duka Space"
    };
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(sanitized));

    // Save or preserve creation timestamp
    const metaRaw = localStorage.getItem(DEMO_META_KEY);
    if (!metaRaw) {
      localStorage.setItem(DEMO_META_KEY, JSON.stringify({ createdAt: Date.now() }));
    }
  } catch (err) {
    console.error("Failed to save demo sandbox state:", err);
  }
}

/**
 * Completely resets and wipes the demo sandbox back to fresh initial state.
 */
export function resetDemoSandbox(): AlacioMasterState {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.setItem(DEMO_META_KEY, JSON.stringify({ createdAt: Date.now() }));
  } catch (err) {
    console.warn("Error resetting demo sandbox:", err);
  }
  return createFreshDemoState();
}
