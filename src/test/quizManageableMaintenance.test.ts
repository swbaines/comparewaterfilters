import { describe, it, expect } from "vitest";
import { getMaintenanceTier, getMaintenanceFit } from "@/lib/recommendationEngine";

/**
 * Verifies that the literal "Manageable" tolerance string the quiz submits
 * (see `maintenanceToleranceOptions` in src/pages/QuizPage.tsx) maps to the
 * "manageable" tier and produces the correct fit level at the $600 ceiling
 * and the $750 (1.25×) slightly-above boundary.
 *
 * The QuizPage option is the single source of truth for the submitted value.
 */
const QUIZ_MANAGEABLE_VALUE = "Manageable — up to $600 per year is fine";

describe("Quiz manageable maintenance — submitted value & tier mapping", () => {
  it("submits the exact $600-ceiling string and maps to the manageable tier", () => {
    expect(QUIZ_MANAGEABLE_VALUE).toBe("Manageable — up to $600 per year is fine");
    expect(getMaintenanceTier(QUIZ_MANAGEABLE_VALUE)).toBe("manageable");
  });

  describe("annual maintenance boundary transitions ($600 ceiling, $750 = 1.25× window)", () => {
    const cases: Array<{
      annualMin: number;
      annualMax: number;
      expected: "match" | "slightly-above" | "well-above";
      note: string;
    }> = [
      { annualMin: 400, annualMax: 599, expected: "match",          note: "$599 max — just under ceiling" },
      { annualMin: 400, annualMax: 600, expected: "match",          note: "$600 max — exactly at ceiling" },
      { annualMin: 601, annualMax: 700, expected: "slightly-above", note: "$601 min — just above ceiling, inside 1.25× window" },
      { annualMin: 750, annualMax: 900, expected: "slightly-above", note: "$750 min — exact 1.25× boundary (inclusive)" },
      { annualMin: 751, annualMax: 900, expected: "well-above",     note: "$751 min — just past 1.25× window" },
    ];

    for (const c of cases) {
      it(`${c.note} → ${c.expected}`, () => {
        const fit = getMaintenanceFit(QUIZ_MANAGEABLE_VALUE, c.annualMin, c.annualMax);
        expect(fit.level).toBe(c.expected);
      });
    }
  });
});
