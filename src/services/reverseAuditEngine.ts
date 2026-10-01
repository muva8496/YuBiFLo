import {
  ItemAuditLine,
  ReconciliationRecord,
  ReconciliationStatus,
  Merchant,
} from "../types";
import { AppStorage } from "./storage";

export interface ItemAuditInput {
  itemId: string;
  itemName: string;
  openingStock: number;
  incomingSupply: number;
  endingCountedStock: number;
  unitSellingPrice: number;
  unitCostPrice: number;
}

export interface ReverseAuditParams {
  date: string;
  itemAudits: ItemAuditInput[];
  actualEquityPaybill?: number;
  actualMpesa: number;
  actualCash: number;
  actualCreditDeni?: number;
  notes?: string;
}

export class ReverseAuditEngine {
  /**
   * Performs Reverse Inventory & Cash Reconciliation Gap Audit
   * Formula:
   * 1. Implied Sales Volume = (Opening Stock + Incoming Supply) - Ending Counted Stock
   * 2. Total Expected Revenue = sum(Implied Sales Volume * Unit Selling Price)
   * 3. Discrepancy Gap = (Actual Equity Paybill + Actual M-Pesa + Actual Cash + Deni) - Total Expected Revenue
   */
  static runAudit(params: ReverseAuditParams, merchant?: Merchant): ReconciliationRecord {
    const activeMerchant = merchant || AppStorage.getMerchant();
    const existingReconciliations = AppStorage.getReconciliations();

    let totalOpeningValue = 0;
    let totalIncomingValue = 0;
    let totalEndingValue = 0;
    let totalImpliedVolume = 0;
    let totalExpectedRevenue = 0;
    let totalExpectedCOGS = 0;

    const auditedLines: ItemAuditLine[] = [];

    for (const item of params.itemAudits) {
      const opening = Math.max(0, Number(item.openingStock) || 0);
      const incoming = Math.max(0, Number(item.incomingSupply) || 0);
      const ending = Math.max(0, Number(item.endingCountedStock) || 0);

      // Implied Sales = (Opening + Incoming) - Ending
      const impliedSold = Math.max(0, opening + incoming - ending);
      const expectedRev = Number((impliedSold * item.unitSellingPrice).toFixed(2));
      const expectedCost = Number((impliedSold * item.unitCostPrice).toFixed(2));
      const expectedProfit = Number((expectedRev - expectedCost).toFixed(2));

      totalOpeningValue += opening * item.unitCostPrice;
      totalIncomingValue += incoming * item.unitCostPrice;
      totalEndingValue += ending * item.unitCostPrice;
      totalImpliedVolume += impliedSold;
      totalExpectedRevenue += expectedRev;
      totalExpectedCOGS += expectedCost;

      auditedLines.push({
        item_id: item.itemId,
        item_name: item.itemName,
        opening_stock: opening,
        incoming_supply: incoming,
        ending_counted_stock: ending,
        implied_sales_volume: impliedSold,
        unit_selling_price: item.unitSellingPrice,
        unit_cost_price: item.unitCostPrice,
        expected_revenue: expectedRev,
        expected_profit: expectedProfit,
      });
    }

    const actualEquityPaybill = Number(params.actualEquityPaybill) || 0;
    const actualMpesa = Number(params.actualMpesa) || 0;
    const actualCash = Number(params.actualCash) || 0;
    const actualDeni = Number(params.actualCreditDeni) || 0;
    const totalCollected = actualEquityPaybill + actualMpesa + actualCash + actualDeni;

    // Discrepancy Gap: Cash in Hand vs Cash That SHOULD Be in Hand
    const discrepancyGap = Number((totalCollected - totalExpectedRevenue).toFixed(2));

    let status: ReconciliationStatus = "PERFECT_MATCH";
    if (discrepancyGap < -2.0) {
      status = "LEAKAGE_DETECTED";
    } else if (discrepancyGap > 2.0) {
      status = "SURPLUS_DETECTED";
    }

    const record: ReconciliationRecord = {
      id: `recon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      merchant_id: activeMerchant.id,
      date: params.date || new Date().toISOString().split("T")[0],
      opening_stock_value: Number(totalOpeningValue.toFixed(2)),
      incoming_supply_value: Number(totalIncomingValue.toFixed(2)),
      ending_stock_value: Number(totalEndingValue.toFixed(2)),
      implied_sales_volume: totalImpliedVolume,
      total_expected_revenue: Number(totalExpectedRevenue.toFixed(2)),
      total_expected_cogs: Number(totalExpectedCOGS.toFixed(2)),
      actual_equity_paybill: actualEquityPaybill,
      actual_mpesa: actualMpesa,
      actual_cash: actualCash,
      actual_credit_deni: actualDeni,
      total_actual_collected: Number(totalCollected.toFixed(2)),
      discrepancy_gap: discrepancyGap,
      status,
      item_audits: auditedLines,
      leakage_breakdown:
        discrepancyGap < 0
          ? {
              probable_reason:
                actualDeni > 0
                  ? "Uncollected customer informal credit ('deni') and till shortage"
                  : "Cash till shortage or unrecorded shopkeeper/staff consumption",
              deni_risk: actualDeni,
              cashier_shortage: Math.abs(discrepancyGap),
            }
          : undefined,
      notes: params.notes,
      created_at: new Date().toISOString(),
    };

    existingReconciliations.unshift(record);
    AppStorage.saveReconciliations(existingReconciliations);

    return record;
  }
}
