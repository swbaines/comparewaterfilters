import { describe, it, expect } from "vitest";
import {
  generateRecommendations,
  getMaintenanceFit,
  getMaintenanceTier,
  type QuizAnswers,
} from "@/lib/recommendationEngine";

/**
 * Engine-level end-to-end test: simulates completing the quiz with each
 * maintenance tolerance option exposed by QuizPage.tsx and asserts that:
 *   1. The submitted tolerance string maps to the correct tier.
 *   2. The final matched recommendation category (primary.id) is consistent.
 *   3. The maintenance-fit indicator on each recommended system updates
 *      correctly relative to that tier's ceiling.
 *
 * Quiz options mirror `maintenanceToleranceOptions` in src/pages/QuizPage.tsx.
 */
const TOLERANCE_OPTIONS = [
  { value: "Critical — under $200 per year preferred",            tier: "critical"   as const, ceiling: 200  as number | null },
  { value: "Important — under $400 per year preferred",           tier: "important"  as const, ceiling: 400  as number | null },
  { value: "Manageable — up to $600 per year is fine",            tier: "manageable" as const, ceiling: 600  as number | null },
  { value: "Not a concern — I want the best filtration regardless", tier: "none"     as const, ceiling: null as number | null },
];

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

describe("Quiz E2E — each manageable/maintenance tolerance value updates recommendation correctly", () => {
  for (const opt of TOLERANCE_OPTIONS) {
    describe(`tolerance: "${opt.value}"`, () => {
      it(`maps to tier "${opt.tier}"`, () => {
        expect(getMaintenanceTier(opt.value)).toBe(opt.tier);
      });

      it("produces a stable matched recommendation category for whole-home intent (VIC)", () => {
        const result = generateRecommendations(
          baseAnswers({ maintenanceTolerance: opt.value }),
        );
        // Whole-home intent + VIC + no RO triggers → primary should be the
        // whole-house filtration system regardless of tolerance.
        expect(result.primary.id).toBe("whole-house-filtration");
        expect(result.secondary.id).toBeTruthy();
        expect(result.premium.id).toBeTruthy();
      });

      it("attaches maintenance-fit indicators that match this tier's ceiling", () => {
        const result = generateRecommendations(
          baseAnswers({ maintenanceTolerance: opt.value }),
        );
        for (const sys of [result.primary, result.secondary, result.premium]) {
          const fit = getMaintenanceFit(
            opt.value,
            sys.annualMaintenanceMin,
            sys.annualMaintenanceMax,
          );
          if (opt.ceiling === null) {
            expect(fit.level).toBe("unspecified");
            continue;
          }
          // Cross-check the fit level against the raw band/ceiling math so
          // any drift between tier ceilings and getMaintenanceFit surfaces.
          const expected =
            sys.annualMaintenanceMax <= opt.ceiling
              ? "match"
              : sys.annualMaintenanceMin <= opt.ceiling * 1.25
                ? "slightly-above"
                : "well-above";
          expect(fit.level).toBe(expected);
        }
      });
    });
  }

  it("changing tolerance from 'Critical' to 'Manageable' flips the whole-house fit indicator", () => {
    // Whole-house filtration band is $200–$500/yr → above critical's $200
    // ceiling but inside manageable's $600 ceiling.
    const critical = generateRecommendations(
      baseAnswers({ maintenanceTolerance: "Critical — under $200 per year preferred" }),
    );
    const manageable = generateRecommendations(
      baseAnswers({ maintenanceTolerance: "Manageable — up to $600 per year is fine" }),
    );

    const criticalFit = getMaintenanceFit(
      "Critical — under $200 per year preferred",
      critical.primary.annualMaintenanceMin,
      critical.primary.annualMaintenanceMax,
    );
    const manageableFit = getMaintenanceFit(
      "Manageable — up to $600 per year is fine",
      manageable.primary.annualMaintenanceMin,
      manageable.primary.annualMaintenanceMax,
    );

    // Same recommended system, but the fit assessment must change.
    expect(critical.primary.id).toBe(manageable.primary.id);
    expect(criticalFit.level).not.toBe("match");
    expect(manageableFit.level).toBe("match");
  });
});
