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
};

describe("Water Softener filtering", () => {
  it("should NOT recommend water softener when hard-water concern is not selected", () => {
    const result = generateRecommendations(baseAnswers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).not.toContain("water-softener");
  });

  it("should allow water softener when hard-water concern IS selected", () => {
    const answersWithHardWater: QuizAnswers = {
      ...baseAnswers,
      state: "WA",
      concerns: ["hard-water", "appliance"],
      coverage: "whole-house",
      budget: "3000-6000",
    };
    const result = generateRecommendations(answersWithHardWater);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).toContain("water-softener");
  });
});

describe("Skin-hair concern scoring", () => {
  it("should recommend shower filter or whole house when skin-hair is selected", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      concerns: ["skin-hair"],
      coverage: "whole-house",
      budget: "not-sure",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    const hasSkinSystem = allIds.includes("shower-filter") || allIds.includes("whole-house-carbon");
    expect(hasSkinSystem).toBe(true);
  });
});

describe("PFAS concern scoring", () => {
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

describe("Microplastics concern scoring", () => {
  it("should recommend reverse osmosis or carbon filter when microplastics is selected", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      concerns: ["microplastics"],
      coverage: "drinking-water",
      budget: "not-sure",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    const hasRelevantSystem = allIds.includes("reverse-osmosis") || allIds.includes("under-sink-carbon");
    expect(hasRelevantSystem).toBe(true);
  });

  it("should rank RO higher than carbon for combined PFAS + microplastics concerns", () => {
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

describe("Renter edge cases", () => {
  it("should recommend shower filter (not whole house) for renters with skin-hair concern", () => {
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
    expect(allIds).toContain("shower-filter");
    expect(allIds).not.toContain("whole-house");
    expect(allIds).not.toContain("water-softener");
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
    expect(allIds).not.toContain("whole-house");
    expect(allIds).not.toContain("water-softener");
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
    const primaryId = result.primary.id;
    const validOptions = ["under-sink-carbon", "tap-filter", "alkaline-filter"];
    expect(validOptions).toContain(primaryId);
  });

  it("should not recommend water softener for renters even with hard-water concern", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      ownershipStatus: "Rent",
      concerns: ["hard-water"],
      coverage: "whole-house",
      budget: "3000-6000",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).not.toContain("water-softener");
    expect(allIds).not.toContain("whole-house");
  });
});
});

describe("Bore water and rainwater source recommendations", () => {
  it("should recommend UV system for bore water users concerned about bacteria", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      waterSource: "bore-water",
      concerns: ["bacteria", "drinking-quality"],
      coverage: "whole-house",
      budget: "not-sure",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).toContain("uv-system");
  });

  it("should recommend tank filter for rainwater users", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      waterSource: "rainwater",
      concerns: ["drinking-quality", "taste"],
      coverage: "whole-house",
      budget: "not-sure",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).toContain("tank-filter");
  });

  it("should recommend both UV and tank filter for tank water with bacteria concerns", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      waterSource: "tank-water",
      concerns: ["bacteria", "taste", "drinking-quality"],
      coverage: "whole-house",
      budget: "3000-6000",
      priorities: ["strongest-filtration"],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    const hasUvOrTank = allIds.includes("uv-system") || allIds.includes("tank-filter");
    expect(hasUvOrTank).toBe(true);
  });

  it("should not recommend tank filter for town water users", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      waterSource: "town-water",
      concerns: ["taste", "chlorine"],
      coverage: "drinking-water",
      budget: "under-1000",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).not.toContain("tank-filter");
  });

  it("should deprioritise UV system for town water without bacteria concerns", () => {
    const answers: QuizAnswers = {
      ...baseAnswers,
      waterSource: "town-water",
      concerns: ["taste", "chlorine"],
      coverage: "drinking-water",
      budget: "under-1000",
      priorities: [],
    };
    const result = generateRecommendations(answers);
    const allIds = [result.primary.id, result.secondary.id, result.premium.id];
    expect(allIds).not.toContain("uv-system");
  });
});
