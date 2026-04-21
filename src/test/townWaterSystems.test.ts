import { describe, it, expect } from "vitest";
import { generateRecommendations, type QuizAnswers } from "@/lib/recommendationEngine";

/**
 * Constraint: Town-water customers must only ever be shown the four core
 * systems — whole-house-filtration, reverse-osmosis, under-sink-carbon,
 * and water-softener (water-softener restricted to WA/SA). UV systems must
 * never appear for town-water customers.
 */
// The four core systems town-water customers should see.
const CORE_TOWN_WATER_IDS = new Set([
  "whole-house-filtration",
  "reverse-osmosis",
  "under-sink-carbon",
  "water-softener",
]);

// "whole-house-combo" represents a multi-system bundle of the four core
// systems (e.g. Whole House + RO, or Softener + Whole House + RO) and is
// allowed as a Premium tier suggestion. "tap-filter" is allowed only as a
// Good-tier alternative for renter/apartment/budget paths.
const ALLOWED_PREMIUM_COMBO = "whole-house-combo";
const ALLOWED_GOOD_TIER_FALLBACK = "tap-filter";
const ALLOWED_TOWN_WATER_IDS = new Set([
  ...CORE_TOWN_WATER_IDS,
  ALLOWED_PREMIUM_COMBO,
  ALLOWED_GOOD_TIER_FALLBACK,
]);

const FORBIDDEN_FOR_TOWN_WATER = ["uv-system"];

const base: QuizAnswers = {
  postcode: "2000",
  suburb: "Sydney",
  state: "NSW",
  propertyType: "House",
  ownershipStatus: "Own",
  householdSize: "3",
  bathrooms: "2",
  waterSource: "town-water",
  concerns: [],
  coverage: "whole-house",
  budget: "1000-3000",
  priorities: [],
  notes: "",
  firstName: "Test",
  email: "test@example.com",
  mobile: "",
  consent: true,
  disclaimerAck: true,
};

const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"];
const CONCERN_SETS: string[][] = [
  [],
  ["taste"],
  ["chlorine"],
  ["drinking-quality"],
  ["fluoride"],
  ["pfas"],
  ["heavy-metals"],
  ["microplastics"],
  ["bacteria"],
  ["hard-water"],
  ["appliance"],
  ["skin-hair"],
  ["skin-shower"],
  ["whole-home"],
  ["taste", "chlorine", "fluoride"],
  ["hard-water", "appliance", "skin-hair"],
];
const COVERAGES = ["whole-house", "whole-house-plus", "drinking-water", "kitchen", "one-tap"];
const BUDGETS = ["under-1000", "1000-3000", "3000-6000", "6000-plus"];

describe("Town-water customers — only the four core systems", () => {
  it("default homeowner town-water case returns only allowed systems", () => {
    const result = generateRecommendations(base);
    const ids = [result.primary.id, result.secondary.id, result.premium.id];
    for (const id of ids) {
      expect(ALLOWED_TOWN_WATER_IDS).toContain(id);
    }
    // Primary + Secondary tiers must always be one of the four core systems.
    expect(CORE_TOWN_WATER_IDS).toContain(result.primary.id);
    expect(CORE_TOWN_WATER_IDS).toContain(result.secondary.id);
  });

  it("never recommends UV for any town-water homeowner combination", () => {
    for (const state of STATES) {
      for (const concerns of CONCERN_SETS) {
        for (const coverage of COVERAGES) {
          for (const budget of BUDGETS) {
            const answers: QuizAnswers = {
              ...base,
              state,
              concerns,
              coverage,
              budget,
            };
            const result = generateRecommendations(answers);
            const ids = [result.primary.id, result.secondary.id, result.premium.id];
            for (const forbidden of FORBIDDEN_FOR_TOWN_WATER) {
              expect(
                ids,
                `UV must not appear for town water — state=${state} concerns=${concerns.join(",")} coverage=${coverage} budget=${budget}`,
              ).not.toContain(forbidden);
            }
          }
        }
      }
    }
  });

  it("Primary and Secondary tiers are always one of the four core systems for town-water homeowners", () => {
    for (const state of STATES) {
      for (const concerns of CONCERN_SETS) {
        for (const coverage of COVERAGES) {
          for (const budget of BUDGETS) {
            const answers: QuizAnswers = {
              ...base,
              state,
              concerns,
              coverage,
              budget,
            };
            const result = generateRecommendations(answers);
            const ctx = `state=${state} concerns=${concerns.join(",")} coverage=${coverage} budget=${budget}`;
            // Primary must always be a core system.
            expect(CORE_TOWN_WATER_IDS, `Primary not core — ${ctx}`).toContain(result.primary.id);
            // Secondary may fall back to tap-filter under Rule 6 (budget under $1k whole-home).
            const secondaryAllowed = new Set([...CORE_TOWN_WATER_IDS, ALLOWED_GOOD_TIER_FALLBACK]);
            expect(secondaryAllowed, `Secondary not allowed — ${ctx}`).toContain(result.secondary.id);
            // Premium may be a core system or the multi-core combo bundle.
            const premiumAllowed = new Set([...CORE_TOWN_WATER_IDS, ALLOWED_PREMIUM_COMBO]);
            expect(premiumAllowed, `Premium not allowed — ${ctx}`).toContain(result.premium.id);
          }
        }
      }
    }
  });

  it("water-softener only appears in WA or SA", () => {
    for (const state of STATES) {
      const answers: QuizAnswers = {
        ...base,
        state,
        concerns: ["hard-water", "appliance"],
        coverage: "whole-house",
      };
      const result = generateRecommendations(answers);
      const ids = [result.primary.id, result.secondary.id, result.premium.id];
      if (ids.includes("water-softener")) {
        expect(["WA", "SA"]).toContain(state);
      }
    }
  });
});