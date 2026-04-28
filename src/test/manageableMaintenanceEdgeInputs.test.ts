import { describe, it, expect } from "vitest";
import { getMaintenanceFit, getMaintenanceTier } from "@/lib/recommendationEngine";

/**
 * Edge-case input handling for the manageable tier ($600 ceiling, $750 = 1.25× window).
 *
 * These tests pin the current behaviour of `getMaintenanceFit` so that:
 *  - Decimal cents around the boundary do NOT silently flip a "match" to
 *    "slightly-above" (or vice versa).
 *  - Negative numbers (nonsensical pricing) still classify deterministically
 *    as "match" rather than wrapping past a boundary.
 *  - Null / undefined / NaN tolerance strings degrade safely to "unspecified"
 *    without throwing or being misread as "manageable".
 */
const MANAGEABLE = "Manageable — up to $600 per year is fine";

describe("manageable tier — non-integer maintenance budget inputs", () => {
  it("$599.99 max → match (under $600 ceiling)", () => {
    expect(getMaintenanceFit(MANAGEABLE, 400, 599.99).level).toBe("match");
  });

  it("$600.00 max (exact ceiling, float) → match", () => {
    expect(getMaintenanceFit(MANAGEABLE, 400.5, 600.0).level).toBe("match");
  });

  it("$600.01 max → slightly-above (just past ceiling)", () => {
    expect(getMaintenanceFit(MANAGEABLE, 400, 600.01).level).toBe("slightly-above");
  });

  it("$750.00 min (exact 1.25× boundary, float) → slightly-above", () => {
    expect(getMaintenanceFit(MANAGEABLE, 750.0, 900).level).toBe("slightly-above");
  });

  it("$750.01 min → well-above (just past 1.25× window)", () => {
    expect(getMaintenanceFit(MANAGEABLE, 750.01, 900).level).toBe("well-above");
  });
});

describe("manageable tier — negative maintenance budget inputs", () => {
  it("negative max well below ceiling → match (does not wrap)", () => {
    expect(getMaintenanceFit(MANAGEABLE, -100, -1).level).toBe("match");
  });

  it("negative min with positive max under ceiling → match", () => {
    expect(getMaintenanceFit(MANAGEABLE, -50, 500).level).toBe("match");
  });

  it("negative min with max above 1.25× window → slightly-above (min<=ceiling*1.25)", () => {
    // Documents existing behaviour: a negative min always satisfies the
    // 1.25× check, so any positive max above the ceiling is "slightly-above".
    expect(getMaintenanceFit(MANAGEABLE, -10, 5000).level).toBe("slightly-above");
  });
});

describe("manageable tier — null / undefined / invalid tolerance", () => {
  it("null tolerance → unspecified (not misread as manageable)", () => {
    expect(getMaintenanceTier(null)).toBe("unspecified");
    expect(getMaintenanceFit(null, 400, 600).level).toBe("unspecified");
  });

  it("undefined tolerance → unspecified", () => {
    expect(getMaintenanceTier(undefined)).toBe("unspecified");
    expect(getMaintenanceFit(undefined, 400, 600).level).toBe("unspecified");
  });

  it("empty string tolerance → unspecified", () => {
    expect(getMaintenanceFit("", 400, 600).level).toBe("unspecified");
  });

  it("unrelated string → unspecified (does not collapse to manageable)", () => {
    expect(getMaintenanceFit("Manageble (typo)", 400, 600).level).toBe("unspecified");
    expect(getMaintenanceFit("up to $600", 400, 600).level).toBe("unspecified");
  });

  it("NaN annual values with manageable tolerance → not 'match' (NaN comparisons are false)", () => {
    // Pin behaviour: NaN <= ceiling is false AND NaN <= ceiling*1.25 is false,
    // so the function falls through to "well-above" rather than silently
    // marking a system as a budget match.
    const fit = getMaintenanceFit(MANAGEABLE, Number.NaN, Number.NaN);
    expect(fit.level).toBe("well-above");
  });
});
