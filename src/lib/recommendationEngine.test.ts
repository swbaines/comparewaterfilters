import { describe, it, expect } from "vitest";
import { generateRecommendations, type QuizAnswers } from "./recommendationEngine";

const baseAnswers = (overrides: Partial<QuizAnswers> = {}): QuizAnswers => ({
  postcode: "3000",
  suburb: "Melbourne",
  state: "VIC",
  propertyType: "House",
  ownershipStatus: "Own",
  householdSize: "3",
  bathrooms: "2",
  propertyAge: "5 to 20 years",
  waterSource: "town-water",
  waterTestedRecently: "",
  waterUsageType: "",
  concerns: ["whole-home"],
  coverage: "whole-house",
  budget: "3000-5000",
  priorities: [],
  notes: "",
  firstName: "Test",
  email: "test@example.com",
  mobile: "0400000000",
  consent: true,
  disclaimerAck: true,
  ...overrides,
});

const UPGRADE_NOTE =
  "You're likely upgrading from an existing system — our recommendations focus on current best-practice systems with modern filtration and warranties.";
const BUDGET_WARNING_FRAGMENT = "above your current budget";

describe("recommendationEngine — replacement / high-intent leads", () => {
  it("injects the upgrade note when 'replacement' is among the concerns", () => {
    const result = generateRecommendations(
      baseAnswers({ concerns: ["whole-home", "replacement"] }),
    );
    expect(result.warnings).toContain(UPGRADE_NOTE);
  });

  it("does NOT inject the upgrade note for non-replacement leads", () => {
    const result = generateRecommendations(baseAnswers());
    expect(result.warnings).not.toContain(UPGRADE_NOTE);
  });

  it("relaxes the under-$1k budget restriction for replacement leads (whole-home intent)", () => {
    // Without replacement: under-1k budget bumps Best down to under-sink and
    // emits an "above your current budget" warning.
    const baseline = generateRecommendations(
      baseAnswers({ concerns: ["whole-home"], budget: "under-1000" }),
    );
    expect(baseline.primary.id).toBe("under-sink-carbon");
    expect(baseline.warnings.some((w) => w.includes(BUDGET_WARNING_FRAGMENT))).toBe(true);

    // With replacement: budget restriction is relaxed, so the proper
    // whole-house filtration is recommended as Best instead.
    const replacement = generateRecommendations(
      baseAnswers({ concerns: ["whole-home", "replacement"], budget: "under-1000" }),
    );
    expect(replacement.primary.id).toBe("whole-house-filtration");
    expect(replacement.warnings.some((w) => w.includes(BUDGET_WARNING_FRAGMENT))).toBe(false);
  });

  it("relaxes the under-$1k budget restriction for whole-home + RO (combo) replacement leads", () => {
    // Without replacement: under-1k forces the budget-aware RO-first path.
    const baseline = generateRecommendations(
      baseAnswers({
        concerns: ["whole-home", "fluoride"],
        budget: "under-1000",
      }),
    );
    expect(baseline.primary.id).toBe("reverse-osmosis");

    // With replacement: full whole-house + RO combo is recommended.
    const replacement = generateRecommendations(
      baseAnswers({
        concerns: ["whole-home", "fluoride", "replacement"],
        budget: "under-1000",
      }),
    );
    expect(replacement.primary.id).toBe("whole-house-combo");
  });

  it("still surfaces modern best-practice systems alongside the upgrade note", () => {
    const result = generateRecommendations(
      baseAnswers({
        concerns: ["whole-home", "fluoride", "replacement"],
        budget: "3000-5000",
      }),
    );
    expect(result.warnings).toContain(UPGRADE_NOTE);
    // Whole-home + RO essential concerns should yield the combo as primary.
    expect(result.primary.id).toBe("whole-house-combo");
  });
});