/**
 * YuBiFlo - Reverse Inventory & Implied Sales Engine
 * 
 * CORE MATHEMATICAL MODEL:
 * 1. Implied Sales Volume = (Opening Stock + Incoming Supply) - Ending Stock
 * 2. Expected Sales Revenue = Implied Sales Volume * Retail Unit Price
 * 3. Total Expected Revenue = SUM(Expected Sales Revenue for all items)
 * 4. Total Actual Collected = Actual M-Pesa + Actual Physical Cash
 * 5. Reconciliation Gap = Total Actual Collected - Total Expected Revenue
 * 
 * Flags cash leakage (theft, unlogged deni, till shortage) or surplus.
 */

export interface ItemAuditRow {
  itemId: string | number;
  itemName: string;
  unitType: string;
  openingStock: number;
  incomingSupply: number;
  endingStockCount: number;
  retailUnitPrice: number;
}

export interface AuditedItemOutput extends ItemAuditRow {
  availableStock: number;
  impliedSalesVolume: number;
  expectedSalesRevenue: number;
}

export interface DailyClosingInput {
  merchantId: string;
  currency: string;
  items: ItemAuditRow[];
  actualMpesaCollected: number;
  actualCashCollected: number;
  unloggedCreditCollected?: number;
}

export interface DailyClosingReport {
  merchantId: string;
  currency: string;
  reconciliationDate: string;
  auditedItems: AuditedItemOutput[];
  totalExpectedRevenue: number;
  actualMpesaCollected: number;
  actualCashCollected: number;
  totalActualCollected: number;
  reconciliationGap: number;
  status: "MATCHED" | "LEAKAGE_DETECTED" | "SURPLUS_DETECTED";
  actionableAlert: string;
}

export class ReverseInventoryEngine {
  /**
   * Executes the end-of-day reverse inventory mathematical reconciliation.
   */
  public static executeDailyClosing(input: DailyClosingInput): DailyClosingReport {
    let totalExpectedRevenue = 0.0;

    const auditedItems: AuditedItemOutput[] = input.items.map((item) => {
      const available = item.openingStock + item.incomingSupply;
      
      // Stock anomaly guard: if physical count exceeds available, implied is 0
      const impliedVolume = item.endingStockCount > available 
        ? 0 
        : parseFloat((available - item.endingStockCount).toFixed(2));
      
      const expectedRevenue = parseFloat((impliedVolume * item.retailUnitPrice).toFixed(2));
      totalExpectedRevenue += expectedRevenue;

      return {
        ...item,
        availableStock: available,
        impliedSalesVolume: impliedVolume,
        expectedSalesRevenue: expectedRevenue
      };
    });

    const totalActualCollected = parseFloat(
      (input.actualMpesaCollected + input.actualCashCollected + (input.unloggedCreditCollected || 0)).toFixed(2)
    );

    // Negative = Deficit / Missing Cash / Unlogged Deni
    // Positive = Surplus / Unlogged Delivery
    const reconciliationGap = parseFloat((totalActualCollected - totalExpectedRevenue).toFixed(2));

    let status: "MATCHED" | "LEAKAGE_DETECTED" | "SURPLUS_DETECTED" = "MATCHED";
    let actionableAlert = "";

    if (Math.abs(reconciliationGap) <= 5.0) {
      status = "MATCHED";
      actionableAlert = "✓ Perfectly Balanced: Cash and M-Pesa collected match shelf depletion within KSh 5 tolerance.";
    } else if (reconciliationGap < 0) {
      status = "LEAKAGE_DETECTED";
      actionableAlert = `⚠️ ${input.currency} ${Math.abs(reconciliationGap).toLocaleString()} missing or tied in unlogged deni! Goods left the shop but till cash is short.`;
    } else {
      status = "SURPLUS_DETECTED";
      actionableAlert = `ℹ️ ${input.currency} ${reconciliationGap.toLocaleString()} drawer surplus detected. Possible unlogged wholesale delivery batch.`;
    }

    return {
      merchantId: input.merchantId,
      currency: input.currency,
      reconciliationDate: new Date().toISOString().slice(0, 10),
      auditedItems,
      totalExpectedRevenue: parseFloat(totalExpectedRevenue.toFixed(2)),
      actualMpesaCollected: input.actualMpesaCollected,
      actualCashCollected: input.actualCashCollected,
      totalActualCollected,
      reconciliationGap,
      status,
      actionableAlert
    };
  }
}
