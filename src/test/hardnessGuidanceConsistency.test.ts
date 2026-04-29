import { describe, it, expect } from "vitest";
import { getHardnessGuidance } from "@/lib/hardness";

/**
 * Guards the contract between the suburb badge, the suburb-level callout, and
 * the "What this means for your home" section on the Water Quality page.
 *
 * If anyone tweaks the bands or wording in one place without updating the
 * shared module, this test fails — so the three surfaces can never disagree.
 */

const SAMPLES: Array<{
  h: number;
  label: "Soft" | "Moderate" | "Hard" | "Very hard";
  isConcern: boolean;
  hasCallout: boolean;
}> = [
  { h: 0, label: "Soft", isConcern: false, hasCallout: false },
  { h: 30, label: "Soft", isConcern: false, hasCallout: false },
  { h: 59, label: "Soft", isConcern: false, hasCallout: false },
  { h: 60, label: "Moderate", isConcern: true, hasCallout: true },
  { h: 95, label: "Moderate", isConcern: true, hasCallout: true },
  { h: 119, label: "Moderate", isConcern: true, hasCallout: true },
  { h: 120, label: "Hard", isConcern: true, hasCallout: true },
  { h: 150, label: "Hard", isConcern: true, hasCallout: true },
  { h: 179, label: "Hard", isConcern: true, hasCallout: true },
  { h: 180, label: "Very hard", isConcern: true, hasCallout: true },
  { h: 250, label: "Very hard", isConcern: true, hasCallout: true },
];

describe("hardness guidance — single source of truth", () => {
  it.each(SAMPLES)(
    "h=$h → label=$label, isConcern=$isConcern, hasCallout=$hasCallout",
    ({ h, label, isConcern, hasCallout }) => {
      const g = getHardnessGuidance(h);
      expect(g.label).toBe(label);
      expect(g.isConcern).toBe(isConcern);
      expect(g.suburbCallout != null).toBe(hasCallout);
      expect(g.calloutVariant != null).toBe(hasCallout);
    },
  );

  it("never tells a Soft reader they have hard water", () => {
    for (const h of [0, 20, 40, 59]) {
      const msg = getHardnessGuidance(h).message(h).toLowerCase();
      expect(msg).toContain("soft");
      expect(msg).not.toMatch(/\bhard\b/);
      expect(msg).not.toMatch(/scale/);
    }
  });

  it("never tells a Moderate reader their water is soft", () => {
    for (const h of [60, 80, 95, 119]) {
      const g = getHardnessGuidance(h);
      const msg = g.message(h).toLowerCase();
      expect(g.label).toBe("Moderate");
      // Must mention scale and avoid the false "your water is soft" claim.
      expect(msg).toContain("scale");
      expect(msg).not.toMatch(/your water is soft/);
      // Suburb callout should match the same warning posture.
      const callout = g.suburbCallout!(h, "Testville").toLowerCase();
      expect(callout).toContain("moderately hard");
      expect(callout).toContain("scale");
    }
  });

  it("Hard and Very hard always recommend filtration / softening", () => {
    for (const h of [120, 150, 180, 250]) {
      const g = getHardnessGuidance(h);
      expect(g.isConcern).toBe(true);
      const msg = g.message(h).toLowerCase();
      expect(msg).toMatch(/scale|softener|filter/);
    }
  });

  it("isConcern matches whether a suburb callout is rendered", () => {
    // Contract used by WaterQualityPage: if "What this means" shows the alert
    // icon, the suburb-level WarningCallout must also fire (and vice versa).
    for (let h = 0; h <= 300; h += 5) {
      const g = getHardnessGuidance(h);
      expect(g.isConcern).toBe(g.suburbCallout != null);
      expect(g.isConcern).toBe(g.calloutVariant != null);
    }
  });

  it("band boundaries are exactly 60 / 120 / 180", () => {
    expect(getHardnessGuidance(59).label).toBe("Soft");
    expect(getHardnessGuidance(60).label).toBe("Moderate");
    expect(getHardnessGuidance(119).label).toBe("Moderate");
    expect(getHardnessGuidance(120).label).toBe("Hard");
    expect(getHardnessGuidance(179).label).toBe("Hard");
    expect(getHardnessGuidance(180).label).toBe("Very hard");
  });

  describe("missing / invalid hardness readings", () => {
    const BAD_INPUTS: Array<number | null | undefined> = [
      null,
      undefined,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -1,
      -50,
    ];

    it.each(BAD_INPUTS)("returns the Unknown fallback for %s", (input) => {
      const g = getHardnessGuidance(input as number);
      expect(g.isUnknown).toBe(true);
      expect(g.label).toBe("Unknown");
      expect(g.tone).toBe("unknown");
      // Fallback must NOT claim the water is soft, hard, or moderate.
      const msg = g.message(input).toLowerCase();
      expect(msg).not.toMatch(/your water is soft/);
      expect(msg).not.toMatch(/has hard water/);
      expect(msg).not.toMatch(/moderately hard/);
      // Fallback must NOT show the alert icon (no confirmed concern)…
      expect(g.isConcern).toBe(false);
      // …but it MUST still surface a suburb-level callout so the UI is never blank.
      expect(g.suburbCallout).not.toBeNull();
      expect(g.calloutVariant).not.toBeNull();
    });

    it("Unknown suburb callout names the area and avoids fake numbers", () => {
      const g = getHardnessGuidance(null);
      const callout = g.suburbCallout!(null, "Testville");
      expect(callout).toContain("Testville");
      expect(callout).not.toMatch(/\b\d+\s*mg\/L/);
    });

    it("Unknown badge uses neutral muted styling, not green/yellow/red", () => {
      const g = getHardnessGuidance(null);
      expect(g.color).not.toMatch(/green|yellow|orange|red/);
      expect(g.bg).not.toMatch(/green|yellow|orange|red/);
    });
  });
});