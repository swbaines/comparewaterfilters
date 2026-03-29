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
