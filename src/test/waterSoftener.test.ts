import { describe, it, expect } from "vitest";
import { generateRecommendations, type QuizAnswers } from "@/lib/recommendationEngine";

const baseAnswers: QuizAnswers = {
  postcode: "2000",
  suburb: "Sydney",
  state: "NSW",
  propertyType: "House",
  ownershipStatus: "Own",
  householdSize: "3",
  bathrooms: "2",
  waterSource: "town-water",
  concerns: ["taste", "chlorine"],
  coverage: "drinking-water",
  budget: "under-1000",
  priorities: ["lowest-cost"],
  notes: "",
  firstName: "Test",
  email: "test@example.com",
  mobile: "",
  consent: true,
  disclaimerAck: true,
};

describe("Water Softener filtering (Rule 2: WA/SA only)", () => {
  it("should NOT recommend water softener when hard-water concern is not selected", () => {
    const result = generateRecommendations(baseAnswers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).not.toContain("water-softener");
  });

  it("should recommend water softener as Best for WA + hard-water", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      state: "WA",
      concerns: ["hard-water", "appliance"],
      coverage: "whole-house",
      budget: "3000-5000",
    };
    const result = generateRecommendations(answers);
    expect(result.primary.id).toBe("water-softener");
  });

  it("should recommend water softener as Best for SA + hard-water", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      state: "SA",
      concerns: ["hard-water"],
      coverage: "whole-house",
      budget: "3000-5000",
    };
    const result = generateRecommendations(answers);
    expect(result.primary.id).toBe("water-softener");
  });

  it("should NOT recommend water softener for VIC even with hard-water concern (Rule 2 is WA/SA only)", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      state: "VIC",
      concerns: ["hard-water", "appliance"],
      coverage: "whole-house",
      budget: "3000-5000",
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).not.toContain("water-softener");
  });
});

describe("Skin-hair concern scoring (Rule 1: whole-home)", () => {
  it("should recommend whole house filtration when skin-hair is selected with whole-house coverage", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      concerns: ["skin-hair"],
      coverage: "whole-house",
      budget: "3000-5000",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    expect(result.primary.id).toBe("whole-house-filtration");
  });
});

describe("PFAS concern scoring (Rule 3: RO-essential)", () => {
  it("should recommend reverse osmosis as primary when PFAS is the main concern", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      concerns: ["pfas"],
      coverage: "drinking-water",
      budget: "not-sure",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    expect(result.primary.id).toBe("reverse-osmosis");
  });
});

describe("Microplastics concern scoring (Rule 3: RO-essential)", () => {
  it("should recommend reverse osmosis as Best when microplastics is selected", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      concerns: ["microplastics"],
      coverage: "drinking-water",
      budget: "not-sure",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    expect(result.primary.id).toBe("reverse-osmosis");
  });

  it("should recommend RO as Best for combined PFAS + microplastics concerns", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      concerns: ["pfas", "microplastics"],
      coverage: "drinking-water",
      budget: "not-sure",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    expect(result.primary.id).toBe("reverse-osmosis");
  });
});

describe("Renter & apartment edge cases (Rule 5)", () => {
  it("should never recommend whole house or softener for renters with skin-hair concern", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      ownershipStatus: "Rent",
      concerns: ["skin-hair"],
      coverage: "whole-house",
      budget: "not-sure",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).not.toContain("whole-house-filtration");
    expect(allIds).not.toContain("water-softener");
    expect(allIds).not.toContain("whole-house-combo");
  });

  it("should not recommend whole house or softener for apartment dwellers", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      propertyType: "Apartment",
      ownershipStatus: "Rent",
      concerns: ["chlorine", "skin-hair"],
      coverage: "drinking-water",
      budget: "under-1000",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).not.toContain("whole-house-filtration");
    expect(allIds).not.toContain("water-softener");
    expect(allIds).not.toContain("whole-house-combo");
  });

  it("should recommend under-sink or tap filter for renters wanting drinking water quality", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      ownershipStatus: "Rent",
      propertyType: "Apartment",
      concerns: ["drinking-quality", "taste"],
      coverage: "drinking-water",
      budget: "under-1000",
      priorities: ["lowest-cost"],
    };
    const result = generateRecommendations(answers);
    const validBest = ["under-sink-carbon", "tap-filter"];
    expect(validBest).toContain(result.primary.id);
  });

  it("should not recommend water softener for WA renters even with hard-water concern", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      state: "WA",
      ownershipStatus: "Rent",
      concerns: ["hard-water"],
      coverage: "whole-house",
      budget: "3000-5000",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).not.toContain("water-softener");
    expect(allIds).not.toContain("whole-house-filtration");
  });
});

describe("Budget under $1k override (Rule 6)", () => {
  it("should move under-sink to Best and whole-house to Premium when whole-home triggers fire on a sub-$1k budget", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      state: "VIC",
      concerns: ["skin-hair"],
      coverage: "whole-house",
      budget: "under-1000",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    expect(result.primary.id).toBe("under-sink-carbon");
    expect(result.premium.id).toBe("whole-house-filtration");
    // Should include the $2,500 warning
    const hasWarning = result.warnings.some((w) => w.includes("$2,500"));
    expect(hasWarning).toBe(true);
  });
});

describe("Allowed system universe", () => {
  // Per spec, only these IDs may ever appear in any tier.
  const ALLOWED = new Set([
    "whole-house-filtration",
    "reverse-osmosis",
    "under-sink-carbon",
    "water-softener",
    "tap-filter",         // Good-tier alternative in Rule 4 / renter path
    "whole-house-combo",  // Premium combined tier
  ]);

  const scenarios: Array<{ name: string; answers: Partial<QuizAnswers> }> = [
    { name: "VIC owner, taste only", answers: { state: "VIC", concerns: ["taste"], coverage: "drinking-water", budget: "1000-3000" } },
    { name: "NSW owner, PFAS", answers: { state: "NSW", concerns: ["pfas"], coverage: "drinking-water", budget: "1000-3000" } },
    { name: "WA owner, hard-water", answers: { state: "WA", concerns: ["hard-water"], coverage: "whole-house", budget: "3000-5000" } },
    { name: "SA owner, appliance", answers: { state: "SA", concerns: ["appliance"], coverage: "whole-house", budget: "5000-plus" } },
    { name: "QLD owner, skin-hair", answers: { state: "QLD", concerns: ["skin-hair"], coverage: "whole-house", budget: "3000-5000" } },
    { name: "NSW renter, taste", answers: { state: "NSW", ownershipStatus: "Rent", concerns: ["taste"], coverage: "drinking-water", budget: "under-1000" } },
    { name: "VIC apartment, chlorine", answers: { state: "VIC", propertyType: "Apartment", concerns: ["chlorine"], coverage: "drinking-water", budget: "under-1000" } },
    { name: "Bore water + bacteria (no longer a special path)", answers: { waterSource: "bore-water", concerns: ["bacteria"], coverage: "whole-house", budget: "3000-5000" } },
    { name: "Rainwater tank", answers: { waterSource: "rainwater", concerns: ["taste"], coverage: "whole-house", budget: "3000-5000" } },
  ];

  for (const { name, answers } of scenarios) {
    it(`only returns approved system IDs for: ${name}`, () => {
      const result = generateRecommendations({ ...baseAnswers, ...answers });
      const allIds = [result.primary.id, result.secondary.id, result.premium.id];
      for (const id of allIds) {
        expect(ALLOWED.has(id), `Disallowed system "${id}" returned for scenario "${name}"`).toBe(true);
      }
    });
  }
});
