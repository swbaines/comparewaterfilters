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
    const hasSkinSystem = allIds.includes("shower-filter") || allIds.includes("whole-house");
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
});
