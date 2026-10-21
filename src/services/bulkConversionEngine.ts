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

/**
 * Comprehensive list of Supply Unit Measurements commonly used across Kenyan retail dukas,
 * wholesalers, bakeries, agrovets, and depots.
 */
export const KENYA_SUPPLY_UNIT_OPTIONS: string[] = [
  // Bales (Unga / Maize Meal / Wheat Flour Ngano / Sugar / Tissue)
  "Bale (12pkts)",
  "Bale (24pkts)",
  "Bale (20pkts)",
  "Bale (10pkts)",
  "Half Bale (6pkts)",

  // Outa / Outer Packs (Sachets, Tea, Spices, Soaps, Snacks, Matches)
  "Outa",
  "Outa (12pcs)",
  "Outa (10pcs)",
  "Outa (20pcs)",
  "Outa (24pcs)",
  "Outa (50pcs)",

  // Dozens
  "Dozen",
  "Dozen (12pcs)",
  "Half Dozen (6pcs)",
  "Quarter Dozen (3pcs)",

  // Bread & Bakery Loaves (Kenyan Standard Loaf Weights)
  "Loaf 400g",
  "Loaf 200g",
  "Loaf 600g",
  "Loaf 800g",
  "Loaf 1kg",
  "Loaves",
  "Crate of Bread (15 Loaves)",
  "Crate of Bread (20 Loaves)",
  "Pack of Buns / Scones (6pcs)",
  "Pack of Buns / Scones (12pcs)",

  // Litres & Liquid Measurements (Milk, Cooking Oil, Water, Juice, Kerosene)
  "Litres",
  "1 Litre",
  "2 Litres",
  "3 Litres",
  "5 Litres",
  "10 Litres",
  "20 Litres (Mtungi)",
  "500ml (Half Litre)",
  "250ml (Quarter Litre)",
  "300ml",
  "Millilitres (ml)",

  // Crates & Trays (Milk, Soda, Eggs, Yoghurt)
  "Crate (24pkts)",
  "Crate (24btls)",
  "Crate (12btls)",
  "Tray (30eggs)",
  "Half Tray (15eggs)",
  "Tray (12cups)",
  "Tray (24cups)",

  // Cartons & Boxes (Cooking Oil, Indomie, Bar Soap, Biscuits)
  "Carton (12btls)",
  "Carton (12pkts)",
  "Carton (20pkts)",
  "Carton (24pcs)",
  "Carton (40pkts)",
  "Carton (48pcs)",
  "Box (50pcs)",
  "Box (100pcs)",

  // Sacks, Gunias & Bulk Commodity Bags (Sugar, Rice, Maize, Beans)
  "Bag (50kg)",
  "Bag 50kg (50 x 1kg)",
  "Bag 50kg (200 x 250g)",
  "Bag (25kg)",
  "Bag 25kg (25 x 1kg)",
  "Bag (10kg)",
  "Bag (90kg)",
  "Gunia (90kg)",
  "Debe (20L)",
  "Gorogoro (2kg Tin)",

  // Weights (Kilograms & Grams)
  "Kg",
  "Half Kg (500g)",
  "Quarter Kg (250g)",
  "100g",
  "50g",
  "Grams (g)",

  // Direct Retail Units
  "Pieces",
  "Packets",
  "Packets (2kg)",
  "Packets (1kg)",
  "Packets (500g)",
  "Bottles",
  "Sachets",
  "Tins / Cans",
  "Bars (Soap)",
  "Rolls (Tissue)",
  "Bundles",
  "Pairs"
];

/**
 * Extracts the number of individual retail units contained in 1 supply unit.
 * - e.g. "Bale (12pkts)" -> 12 (so 2080 / 12 = 173.33 per 2kg packet of Ngano)
 * - e.g. "Outa" or "Outa (12pcs)" -> 12
 * - e.g. "Dozen" or "Dozen (12pcs)" -> 12
 * - e.g. "Crate (24pkts)" -> 24
 * - e.g. "Tray (30eggs)" -> 30
 * - e.g. "Loaf 400g", "Loaf 200g", "Loaf 600g", "Litres", "Kg", "Pieces" -> 1
 */
export function getSupplyUnitMultiplier(unit: string): number {
  if (!unit) return 1;
  const u = unit.toLowerCase().trim();

  // 1. Explicit "N x ..." pattern, e.g. "Bag 50kg (50 x 1kg)" -> 50, "Bag 50kg (200 x 250g)" -> 200
  const multCrossMatch = u.match(/\((\d+)\s*x\s*/i);
  if (multCrossMatch) {
    const val = parseInt(multCrossMatch[1], 10);
    if (val > 0) return val;
  }

  // 2. Explicit pack count inside parentheses: (12pkts), (24pcs), (12btls), (30eggs), (12cups), (15 loaves), etc.
  const countMatch = u.match(
    /\((\d+)\s*(?:pkts?|packets?|pcs?|pieces?|btls?|bottles?|eggs?|cups?|loaves?|loaf|sachets?|rolls?|tins?|bars?|cans?|units?)\b/i
  );
  if (countMatch) {
    const val = parseInt(countMatch[1], 10);
    if (val > 0) return val;
  }

  // 3. Named multi-packs without explicit numbers
  if (u.includes("half dozen")) return 6;
  if (u.includes("quarter dozen")) return 3;
  if (u.includes("dozen") || u === "dzn") return 12;
  if (u.includes("half bale")) return 6;
  if (u.includes("bale")) return 12;
  if (u.includes("outa") || u.includes("outer") || u === "out") return 12;
  if (u.includes("half tray")) return 15;
  if (u.includes("tray")) return 30;
  if (u.includes("crate")) return 24;

  // 4. Single-item measurements (Loaf 400g, Loaf 200g, Loaf 600g, Litres, Kg, Pieces, Packets, etc.)
  return 1;
}

/**
 * Derives the wholesale unit cost of a single retail unit from the line total cost,
 * the number of supply units ordered, and the supply unit's pack multiplier.
 * Example: Ngano Swan 2kg -> 1 Bale (12pkts) at Line Total KSh 2,080 -> 2080 / (1 * 12) = KSh 173.33 per packet.
 */
export function deriveUnitWholesaleCost(
  totalLineCost: number,
  quantity: number,
  supplyUnit: string
): number {
  const safeCost = Number(totalLineCost) || 0;
  const safeQty = Number(quantity) > 0 ? Number(quantity) : 1;
  const multiplier = getSupplyUnitMultiplier(supplyUnit);
  const totalRetailUnits = safeQty * multiplier;
  if (totalRetailUnits <= 0) return 0;
  return Math.round((safeCost / totalRetailUnits) * 100) / 100;
}

