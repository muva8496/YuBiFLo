/**
 * YuBiFlo - Bulk-to-Micro Inventory Conversion Engine
 * 
 * CORE PHILOSOPHY:
 * African MSMEs buy goods in bulk wholesale packaging (50kg bag of sugar, 100-pack box of sweets, 
 * 24-bottle crate of soda, 12-packet bale of unga), but sell in micro-fractions (quarter-kg, 
 * 10-bob pieces, single packets).
 * 
 * Traditional POS systems force the merchant to tap the screen for every single 10-bob sweet or 
 * quarter-kg scoop. In rush hours, this breaks down.
 * 
 * YuBiFlo tracks stock in micro Retail Units, automatically converting incoming wholesale batches, 
 * and calculates fraction consumption passively at bookends.
 */

export interface BulkToMicroConfig {
  supply_unit: string;      // e.g. "Bag (50kg)", "Box (100pcs)", "Crate (24pkts)"
  retail_unit: string;      // e.g. "Quarter-Kg (250g)", "Piece (Sweet)", "Single Packet"
  conversion_ratio: number; // e.g. 200 (50kg in quarter-kgs), 100, 24
}

export interface BulkSupplyReceipt {
  itemId: string | number;
  itemName: string;
  supplyUnitsReceived: number;
  config: BulkToMicroConfig;
  totalWholesaleCost: number;
  retailPricePerMicroUnit: number;
}

export class BulkConversionEngine {
  /**
   * Converts incoming wholesale supply packaging into discrete retail micro-units.
   */
  public static convertSupplyToRetailUnits(
    supplyUnitsReceived: number, 
    conversionRatio: number
  ): number {
    if (conversionRatio <= 0) return supplyUnitsReceived;
    return parseFloat((supplyUnitsReceived * conversionRatio).toFixed(2));
  }

  /**
   * Computes the theoretical micro-unit cost from bulk delivery cost.
   * e.g. 50kg bag bought for KSh 6,800 has 200 quarter-kgs -> unit cost = KSh 34 per quarter-kg.
   */
  public static calculateMicroUnitCost(
    totalWholesaleCost: number, 
    totalRetailUnits: number
  ): number {
    if (totalRetailUnits <= 0) return 0;
    return parseFloat((totalWholesaleCost / totalRetailUnits).toFixed(2));
  }

  /**
   * Computes expected gross margin for the bulk batch when completely depleted.
   */
  public static calculateBatchProfitPotential(
    totalRetailUnits: number, 
    retailPricePerMicroUnit: number, 
    totalWholesaleCost: number
  ) {
    const expectedRetailYield = totalRetailUnits * retailPricePerMicroUnit;
    const grossProfit = expectedRetailYield - totalWholesaleCost;
    const markupPercentage = totalWholesaleCost > 0 
      ? parseFloat(((grossProfit / totalWholesaleCost) * 100).toFixed(1)) 
      : 0;

    return {
      expectedRetailYield,
      grossProfit,
      markupPercentage
    };
  }

  /**
   * Passive micro-fraction consumption calculation:
   * Merchant performs morning opening count (e.g. 0 quarter-kgs) + receives 1 bag (200 quarter-kgs).
   * In evening, merchant counts 140 quarter-kgs remaining in the dispenser bin.
   * Implied micro-sales = (0 + 200) - 140 = 60 quarter-kgs sold. Zero counter typing required!
   */
  public static computeFractionConsumption(
    openingMicroUnits: number,
    addedMicroUnits: number,
    closingCountedMicroUnits: number
  ): {
    availableUnits: number;
    impliedSoldMicroUnits: number;
  } {
    const available = openingMicroUnits + addedMicroUnits;
    const sold = closingCountedMicroUnits > available 
      ? 0 
      : parseFloat((available - closingCountedMicroUnits).toFixed(2));

    return {
      availableUnits: available,
      impliedSoldMicroUnits: sold
    };
  }
}
