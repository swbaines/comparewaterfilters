import { describe, it, expect } from "vitest";
import {
  generateRecommendations,
  getMaintenanceFit,
  getMaintenanceTier,
  type QuizAnswers,
} from "./recommendationEngine";

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

// ─── Maintenance tolerance ──────────────────────────────────────────────────

const TOLERANCE_LABELS = {
  critical: "Critical — under $200 per year preferred",
  important: "Important — under $400 per year preferred",
  manageable: "Manageable — up to $700 per year is fine",
  none: "Not a concern — I want the best filtration regardless",
} as const;

const MAINTENANCE_SERVICE_PLAN_NOTE =
  "This system has higher annual maintenance ($150–$250/year). Given your priority for low maintenance, consider a multi-year service plan from your installer.";

describe("getMaintenanceTier", () => {
  it("maps each verbatim quiz label to the correct tier", () => {
    expect(getMaintenanceTier(TOLERANCE_LABELS.critical)).toBe("critical");
    expect(getMaintenanceTier(TOLERANCE_LABELS.important)).toBe("important");
    expect(getMaintenanceTier(TOLERANCE_LABELS.manageable)).toBe("manageable");
    expect(getMaintenanceTier(TOLERANCE_LABELS.none)).toBe("none");
  });

  it("returns 'unspecified' for empty / unknown values", () => {
    expect(getMaintenanceTier(undefined)).toBe("unspecified");
    expect(getMaintenanceTier(null)).toBe("unspecified");
    expect(getMaintenanceTier("")).toBe("unspecified");
    expect(getMaintenanceTier("Some other label")).toBe("unspecified");
  });
});

describe("getMaintenanceFit — per tolerance option", () => {
  // Ceilings: critical=$200, important=$400, manageable=$700, none=null.
  // "slightly-above" if annualMin <= ceiling * 1.25, else "well-above".

  describe("critical (≤$200/yr)", () => {
    const t = TOLERANCE_LABELS.critical;
    it("match: band entirely within ceiling", () => {
      expect(getMaintenanceFit(t, 80, 180).level).toBe("match");
    });
    it("match: band exactly at the ceiling", () => {
      expect(getMaintenanceFit(t, 100, 200).level).toBe("match");
    });
    it("slightly-above: max exceeds ceiling but min within +25%", () => {
      // 200 * 1.25 = 250; min=200 ≤ 250 → slightly-above.
      expect(getMaintenanceFit(t, 200, 350).level).toBe("slightly-above");
    });
    it("well-above: min exceeds ceiling * 1.25", () => {
      expect(getMaintenanceFit(t, 300, 500).level).toBe("well-above");
    });
  });

  describe("important (≤$400/yr)", () => {
    const t = TOLERANCE_LABELS.important;
    it("match: band within $400 ceiling", () => {
      expect(getMaintenanceFit(t, 200, 400).level).toBe("match");
    });
    it("slightly-above: min within 400 * 1.25 = 500", () => {
      expect(getMaintenanceFit(t, 450, 700).level).toBe("slightly-above");
    });
    it("well-above: min above 500", () => {
      expect(getMaintenanceFit(t, 600, 900).level).toBe("well-above");
    });
  });

  describe("manageable (≤$700/yr)", () => {
    const t = TOLERANCE_LABELS.manageable;
    it("match: band within $700 ceiling", () => {
      expect(getMaintenanceFit(t, 300, 700).level).toBe("match");
    });
    it("slightly-above: min within 700 * 1.25 = 875", () => {
      expect(getMaintenanceFit(t, 800, 1000).level).toBe("slightly-above");
    });
    it("well-above: min above 875", () => {
      expect(getMaintenanceFit(t, 900, 1200).level).toBe("well-above");
    });
  });

  describe("not a concern", () => {
    const t = TOLERANCE_LABELS.none;
    it("returns 'unspecified' regardless of band — no ceiling enforced", () => {
      expect(getMaintenanceFit(t, 50, 100).level).toBe("unspecified");
      expect(getMaintenanceFit(t, 1000, 5000).level).toBe("unspecified");
    });
    it("returns an empty message", () => {
      expect(getMaintenanceFit(t, 100, 200).message).toBe("");
    });
  });

  it("returns 'unspecified' when tolerance is missing", () => {
    expect(getMaintenanceFit(undefined, 100, 200).level).toBe("unspecified");
    expect(getMaintenanceFit(null, 100, 200).level).toBe("unspecified");
    expect(getMaintenanceFit("", 100, 200).level).toBe("unspecified");
  });

  it("attaches the correct human-readable message to each level", () => {
    expect(getMaintenanceFit(TOLERANCE_LABELS.critical, 50, 100).message).toBe(
      "Matches your maintenance budget",
    );
    expect(getMaintenanceFit(TOLERANCE_LABELS.critical, 200, 350).message).toBe(
      "Slightly above your maintenance preference",
    );
    expect(getMaintenanceFit(TOLERANCE_LABELS.critical, 400, 600).message).toBe(
      "Significantly above your maintenance preference — consider a service plan",
    );
  });
});

describe("recommendation engine — maintenance tolerance integration", () => {
  it("adds the service-plan warning when 'critical' tolerance meets an RO-essential concern", () => {
    const result = generateRecommendations(
      baseAnswers({
        concerns: ["fluoride"],
        coverage: "drinking-water",
        budget: "1000-3000",
        maintenanceTolerance: TOLERANCE_LABELS.critical,
      }),
    );
    expect(result.warnings).toContain(MAINTENANCE_SERVICE_PLAN_NOTE);
  });

  it("does NOT add the service-plan warning for non-critical tolerance", () => {
    for (const label of [
      TOLERANCE_LABELS.important,
      TOLERANCE_LABELS.manageable,
      TOLERANCE_LABELS.none,
    ]) {
      const result = generateRecommendations(
        baseAnswers({
          concerns: ["fluoride"],
          coverage: "drinking-water",
          budget: "1000-3000",
          maintenanceTolerance: label,
        }),
      );
      expect(result.warnings).not.toContain(MAINTENANCE_SERVICE_PLAN_NOTE);
    }
  });

  it("does NOT add the service-plan warning when 'critical' tolerance has no RO trigger", () => {
    const result = generateRecommendations(
      baseAnswers({
        concerns: ["taste", "chlorine"],
        coverage: "drinking-water",
        budget: "1000-3000",
        maintenanceTolerance: TOLERANCE_LABELS.critical,
      }),
    );
    expect(result.warnings).not.toContain(MAINTENANCE_SERVICE_PLAN_NOTE);
  });

  it("does NOT add the service-plan warning when maintenance tolerance is unspecified", () => {
    const result = generateRecommendations(
      baseAnswers({
        concerns: ["fluoride"],
        coverage: "drinking-water",
        budget: "1000-3000",
      }),
    );
    expect(result.warnings).not.toContain(MAINTENANCE_SERVICE_PLAN_NOTE);
  });

  it("returns a complete recommendation result regardless of tolerance value", () => {
    for (const label of Object.values(TOLERANCE_LABELS)) {
      const result = generateRecommendations(
        baseAnswers({ maintenanceTolerance: label }),
      );
      expect(result.primary).toBeDefined();
      expect(result.secondary).toBeDefined();
      expect(result.premium).toBeDefined();
      expect(typeof result.summary).toBe("string");
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  });
});

// ─── Boundary tests: exact ceiling, exactly 1.25×, and just-over-ceiling ────
//
// Engine rules (from getMaintenanceFit):
//   match           ← annualMax <= ceiling
//   slightly-above  ← annualMax  > ceiling AND annualMin <= ceiling * 1.25
//   well-above      ← annualMin  > ceiling * 1.25
//
// Each tier is exercised at four boundaries:
//   1. Band ends exactly AT the ceiling                     → match
//   2. Min just above ceiling, max just above ceiling       → slightly-above
//   3. Min exactly AT ceiling * 1.25                        → slightly-above
//   4. Min just over ceiling * 1.25                         → well-above

describe("getMaintenanceFit — exact boundary values per tolerance label", () => {
  const cases = [
    { tier: "critical",   label: TOLERANCE_LABELS.critical,   ceiling: 200 },
    { tier: "important",  label: TOLERANCE_LABELS.important,  ceiling: 400 },
    { tier: "manageable", label: TOLERANCE_LABELS.manageable, ceiling: 700 },
  ] as const;

  for (const { tier, label, ceiling } of cases) {
    const upper = ceiling * 1.25;

    describe(`${tier} (ceiling=$${ceiling}/yr, 1.25× = $${upper}/yr)`, () => {
      it("match: max == ceiling exactly", () => {
        const fit = getMaintenanceFit(label, ceiling - 50, ceiling);
        expect(fit.level).toBe("match");
        expect(fit.message).toBe("Matches your maintenance budget");
      });

      it("match: both min and max == ceiling exactly (zero-width band)", () => {
        expect(getMaintenanceFit(label, ceiling, ceiling).level).toBe("match");
      });

      it("slightly-above: max == ceiling + 1, min == ceiling (just over ceiling)", () => {
        const fit = getMaintenanceFit(label, ceiling, ceiling + 1);
        expect(fit.level).toBe("slightly-above");
        expect(fit.message).toBe("Slightly above your maintenance preference");
      });

      it("slightly-above: min == ceiling * 1.25 exactly", () => {
        const fit = getMaintenanceFit(label, upper, upper + 100);
        expect(fit.level).toBe("slightly-above");
      });

      it("well-above: min == ceiling * 1.25 + 1 (just over the 1.25× threshold)", () => {
        const fit = getMaintenanceFit(label, upper + 1, upper + 200);
        expect(fit.level).toBe("well-above");
        expect(fit.message).toBe(
          "Significantly above your maintenance preference — consider a service plan",
        );
      });
    });
  }

  describe("none ('Not a concern') — no ceiling enforced at any boundary", () => {
    const label = TOLERANCE_LABELS.none;
    it("returns 'unspecified' at $0", () => {
      expect(getMaintenanceFit(label, 0, 0).level).toBe("unspecified");
    });
    it("returns 'unspecified' at very large bands", () => {
      expect(getMaintenanceFit(label, 1000, 9999).level).toBe("unspecified");
    });
    it("returns an empty message at every boundary", () => {
      expect(getMaintenanceFit(label, 200, 200).message).toBe("");
      expect(getMaintenanceFit(label, 700, 875).message).toBe("");
      expect(getMaintenanceFit(label, 5000, 5000).message).toBe("");
    });
  });
});

// ─── Snapshot: lock the fit-level matrix across all tiers × bands ───────────
//
// This snapshot guards against silent drift in either the ceilings or the
// 1.25× slightly-above window. If the engine logic intentionally changes,
// regenerate with `vitest -u`.

describe("getMaintenanceFit — snapshot matrix", () => {
  it("matches the canonical fit matrix for all tolerance × representative bands", () => {
    const tolerances = [
      ["critical",   TOLERANCE_LABELS.critical],
      ["important",  TOLERANCE_LABELS.important],
      ["manageable", TOLERANCE_LABELS.manageable],
      ["none",       TOLERANCE_LABELS.none],
    ] as const;

    // Representative bands chosen to exercise every boundary path.
    const bands: Array<[number, number]> = [
      [0, 0],
      [100, 200],
      [200, 200],
      [200, 201],
      [250, 250],
      [300, 400],
      [400, 400],
      [450, 500],
      [500, 500],
      [600, 700],
      [700, 700],
      [800, 875],
      [875, 875],
      [876, 1000],
      [1500, 2500],
    ];

    const matrix: Record<string, Record<string, string>> = {};
    for (const [name, label] of tolerances) {
      matrix[name] = {};
      for (const [min, max] of bands) {
        matrix[name][`$${min}-$${max}/yr`] = getMaintenanceFit(label, min, max).level;
      }
    }

    expect(matrix).toMatchSnapshot();
  });
});