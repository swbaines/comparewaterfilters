import { describe, it, expect } from "vitest";
import {
  budgetBandToRange,
  scoreVendorBudgetFit,
  type BudgetBand,
} from "@/lib/budgetMatching";
import {
  generateRecommendations,
  type QuizAnswers,
} from "@/lib/recommendationEngine";

/**
 * "Doesn't matter" is the user-facing label for the `not-sure` budget option.
 * Picking it means: give me the best recommendation regardless of cost.
 * These tests pin that contract end-to-end:
 *   1. Quiz label "Doesn't matter" maps to the `not-sure` budget key.
 *   2. `not-sure` resolves to an unconstrained budget range.
 *   3. Vendor budget fit treats every priced vendor as within budget.
 *   4. The recommendation engine never applies a budget-aware downgrade
 *      (i.e. it returns the same best-fit primary as the unconstrained
 *      `$3,500 +` band, and never the "under-1000" fallback).
 */

const baseAnswers = (overrides: Partial<QuizAnswers> = {}): QuizAnswers => ({
  postcode: "3000",
  suburb: "Melbourne",
  state: "VIC",
  propertyType: "House",
  ownershipStatus: "Own",
  householdSize: "3",
  bathrooms: "2",
  waterSource: "town-water",
  waterTestedRecently: "",
  waterUsageType: "",
  concerns: ["whole-home"],
  coverage: "whole-house",
  budget: "3500-plus",
  priorities: [],
  
  firstName: "Test",
  email: "test@example.com",
  mobile: "0400000000",
  consent: true,
  disclaimerAck: true,
  ...overrides,
});

describe('"Doesn\'t matter" budget option (not-sure)', () => {
  it('the quiz label "Doesn\'t matter" maps to the "not-sure" budget key', async () => {
    // Import lazily so this test file does not pull QuizPage's full React
    // tree just to read the static option list.
    const { budgetOptions } = await import("@/pages/QuizPage");
    const match = budgetOptions.find((o) => o.label === "Doesn't matter");
    expect(match).toBeDefined();
    expect(match?.value).toBe("not-sure");
  });

  it("budgetBandToRange returns an unconstrained range for not-sure", () => {
    const range = budgetBandToRange("not-sure");
    expect(range).not.toBeNull();
    expect(range!.min).toBe(0);
    expect(range!.max).toBe(Infinity);
  });

  it("scoreVendorBudgetFit marks every priced vendor as within budget", () => {
    const cheapVendor = scoreVendorBudgetFit(
      { "under-sink-filter": { min: 300, max: 800 } },
      ["under-sink-filter"],
      "not-sure",
    );
    const premiumVendor = scoreVendorBudgetFit(
      { "whole-house-combo": { min: 6000, max: 12000 } },
      ["whole-house-combo"],
      "not-sure",
    );

    for (const fit of [cheapVendor, premiumVendor]) {
      expect(fit.pricedSystems).toBe(1);
      expect(fit.withinBudget).toBe(true);
      // Open-ended range falls back to the finite side → perfect overlap.
      expect(fit.score).toBe(1);
    }
  });

  it("a vendor with no pricing on the recommended systems still scores 0", () => {
    // Sanity: "not-sure" must not magically promote vendors that don't
    // actually offer the recommended systems.
    const fit = scoreVendorBudgetFit(
      { "shower-filter": { min: 100, max: 250 } },
      ["whole-house-combo"],
      "not-sure",
    );
    expect(fit.pricedSystems).toBe(0);
    expect(fit.withinBudget).toBe(false);
    expect(fit.score).toBe(0);
  });

  it("recommendation engine returns the same best-fit primary as the unconstrained $3,500+ band", () => {
    // whole-home + RO trigger → combo system on the unconstrained path.
    const overrides: Partial<QuizAnswers> = {
      concerns: ["whole-home", "fluoride"],
      coverage: "whole-house-plus",
    };
    const premium = generateRecommendations(
      baseAnswers({ ...overrides, budget: "3500-plus" }),
    );
    const doesntMatter = generateRecommendations(
      baseAnswers({ ...overrides, budget: "not-sure" }),
    );

    expect(doesntMatter.primary.id).toBe(premium.primary.id);
    expect(doesntMatter.primary.id).toBe("whole-house-combo");
  });

  it("recommendation engine never adds a budget warning for not-sure", () => {
    const result = generateRecommendations(
      baseAnswers({
        concerns: ["whole-home", "fluoride"],
        coverage: "whole-house-plus",
        budget: "not-sure",
      }),
    );
    const allCopy = [
      result.primaryReason,
      ...result.warnings,
    ].join("\n");
    expect(allCopy.toLowerCase()).not.toContain("above your current budget");
    expect(allCopy.toLowerCase()).not.toContain("within your budget");
  });

  it("not-sure never triggers the under-1k downgrade path", () => {
    // Compare against the under-1000 path to confirm divergence.
    const overrides: Partial<QuizAnswers> = {
      concerns: ["whole-home", "fluoride"],
      coverage: "whole-house-plus",
    };
    const under1k = generateRecommendations(
      baseAnswers({ ...overrides, budget: "under-1000" }),
    );
    const doesntMatter = generateRecommendations(
      baseAnswers({ ...overrides, budget: "not-sure" }),
    );
    expect(doesntMatter.primary.id).not.toBe(under1k.primary.id);
  });

  it("BudgetBand union accepts not-sure (type-level guard)", () => {
    const band: BudgetBand = "not-sure";
    expect(budgetBandToRange(band)).not.toBeNull();
  });
});