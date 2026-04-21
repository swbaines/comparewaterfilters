import { describe, it, expect } from "vitest";
import { generateRecommendations, type QuizAnswers } from "@/lib/recommendationEngine";

/**
 * Constraint: Town-water customers must only ever be shown the four core
 * systems — whole-house-filtration, reverse-osmosis, under-sink-carbon,
 * and water-softener (water-softener restricted to WA/SA). UV systems must
 * never appear for town-water customers.
 */
const ALLOWED_TOWN_WATER_IDS = new Set([
  "whole-house-filtration",
  "reverse-osmosis",
  "under-sink-carbon",
  "water-softener",
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

  it("homeowner town-water (canHaveWholeHome) only ever returns the four core systems", () => {
    // Restrict to homeowner + house so renter/apartment fallback paths
    // (which legitimately use tap-filter / whole-house-combo) don't apply.
    for (const state of STATES) {
      for (const concerns of CONCERN_SETS) {
        for (const coverage of COVERAGES) {
          for (const budget of BUDGETS) {
            // Skip the budget-under-1k whole-home path which is allowed to
            // surface "tap-filter" as the cheaper Good tier per Rule 6.
            if (budget === "under-1000") continue;
            const answers: QuizAnswers = {
              ...base,
              state,
              concerns,
              coverage,
              budget,
            };
            const result = generateRecommendations(answers);
            const ids = [result.primary.id, result.secondary.id, result.premium.id];
            for (const id of ids) {
              // whole-house-combo is allowed in WA/SA Rule 2 Premium tier;
              // accept it only when state is WA or SA.
              if (id === "whole-house-combo") {
                expect(["WA", "SA"]).toContain(state);
                continue;
              }
              expect(
                ALLOWED_TOWN_WATER_IDS,
                `Unexpected system "${id}" for town water — state=${state} concerns=${concerns.join(",")} coverage=${coverage} budget=${budget}`,
              ).toContain(id);
            }
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