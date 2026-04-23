// Budget-aware matching helpers.
//
// Given the quiz's budget band and a vendor's per-system price ranges
// (`system_pricing` on the providers table), compute how well that vendor
// fits the customer's budget for the systems they were recommended.
//
// Score is in [0, 1] where 1 means the vendor's price range sits squarely
// inside the customer's band. We also expose a human-readable summary so
// the UI can show the band that's matched.

export type BudgetBand =
  | "under-1000"
  | "1000-3000"
  | "3000-5000"
  | "5000-plus"
  | "not-sure"
  | "";

export interface BudgetRange {
  min: number;
  /** `Infinity` for open-ended bands (e.g. $5,000+). */
  max: number;
  label: string;
}

export function budgetBandToRange(band: BudgetBand): BudgetRange | null {
  switch (band) {
    case "under-1000":
      return { min: 0, max: 1000, label: "Under $1,000" };
    case "1000-3000":
      return { min: 1000, max: 3000, label: "$1,000 – $3,000" };
    case "3000-5000":
      return { min: 3000, max: 5000, label: "$3,000 – $5,000" };
    case "5000-plus":
      return { min: 5000, max: Infinity, label: "$5,000+" };
    default:
      return null;
  }
}

/**
 * Overlap ratio between [aMin,aMax] and [bMin,bMax], normalised by the
 * smaller of the two ranges. Returns a value in [0, 1].
 */
function overlapRatio(aMin: number, aMax: number, bMin: number, bMax: number): number {
  const lo = Math.max(aMin, bMin);
  const hi = Math.min(aMax, bMax);
  if (hi <= lo) return 0;
  const overlap = hi - lo;
  const aLen = aMax - aMin;
  const bLen = bMax - bMin;
  // When either side is open-ended (Infinity), fall back to the finite side.
  const denom = Math.min(
    isFinite(aLen) ? aLen : bLen,
    isFinite(bLen) ? bLen : aLen,
  );
  if (!isFinite(denom) || denom <= 0) return overlap > 0 ? 1 : 0;
  return Math.max(0, Math.min(1, overlap / denom));
}

export interface VendorBudgetFit {
  /** 0–1 fit score across the vendor's prices for the recommended systems. */
  score: number;
  /** Number of recommended systems for which the vendor has a price set. */
  pricedSystems: number;
  /** True if at least one priced system overlaps the customer band. */
  withinBudget: boolean;
  /**
   * Cheapest vendor min across the matching systems — useful for tie-breaking
   * and for surfacing a starting price in the UI.
   */
  startingFrom: number | null;
}

/**
 * Score a vendor's per-system pricing against the customer's budget band.
 * Only considers system types that are both recommended to the customer
 * AND have a price set on the vendor.
 */
export function scoreVendorBudgetFit(
  systemPricing: Record<string, { min: number; max: number }>,
  recommendedSystems: string[],
  band: BudgetBand,
): VendorBudgetFit {
  const range = budgetBandToRange(band);
  const relevant = recommendedSystems
    .map((id) => systemPricing?.[id])
    .filter((entry): entry is { min: number; max: number } =>
      !!entry && isFinite(entry.min) && isFinite(entry.max) && entry.max >= entry.min,
    );

  if (relevant.length === 0) {
    return { score: 0, pricedSystems: 0, withinBudget: false, startingFrom: null };
  }

  const startingFrom = Math.min(...relevant.map((r) => r.min));

  // No usable budget band — neutral score, but signal that pricing is set.
  if (!range) {
    return { score: 0.5, pricedSystems: relevant.length, withinBudget: true, startingFrom };
  }

  const overlaps = relevant.map((r) => overlapRatio(range.min, range.max, r.min, r.max));
  const avg = overlaps.reduce((a, b) => a + b, 0) / overlaps.length;
  const withinBudget = overlaps.some((o) => o > 0);

  return { score: avg, pricedSystems: relevant.length, withinBudget, startingFrom };
}

export function formatStartingFrom(value: number | null): string | null {
  if (value == null || !isFinite(value) || value <= 0) return null;
  return `from $${Math.round(value).toLocaleString("en-AU")}`;
}
