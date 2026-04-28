import { describe, it, expect } from "vitest";
import { deriveLeadTemperature } from "./leadTemperature";

/**
 * Mirrors the SQL trigger `public.set_lead_temperature()`:
 *   - "As soon as possible%" | "Within 1 month%" -> hot
 *   - "Within 3 months%"                          -> warm
 *   - "Just researching%"                         -> cold
 *   - NULL / unrecognised                         -> null
 *
 * The four labels below are the verbatim options offered in QuizPage Step 7.
 */

const QUIZ_OPTIONS = [
  { label: "As soon as possible — within 2 weeks", expected: "hot" as const },
  { label: "Within 1 month", expected: "hot" as const },
  { label: "Within 3 months", expected: "warm" as const },
  { label: "Just researching — no specific timeframe", expected: "cold" as const },
];

describe("deriveLeadTemperature — mirrors set_lead_temperature() trigger", () => {
  it.each(QUIZ_OPTIONS)(
    "maps quiz option %j -> $expected",
    ({ label, expected }) => {
      expect(deriveLeadTemperature(label)).toBe(expected);
    },
  );

  it("returns null for empty / nullish inputs", () => {
    expect(deriveLeadTemperature(null)).toBeNull();
    expect(deriveLeadTemperature(undefined)).toBeNull();
    expect(deriveLeadTemperature("")).toBeNull();
  });

  it("returns null for unrecognised free-text", () => {
    expect(deriveLeadTemperature("Sometime next year")).toBeNull();
    expect(deriveLeadTemperature("ASAP")).toBeNull();
  });

  it("matches by prefix (extra trailing text still classifies)", () => {
    expect(deriveLeadTemperature("As soon as possible — within 2 weeks (urgent)")).toBe("hot");
    expect(deriveLeadTemperature("Within 1 month or so")).toBe("hot");
    expect(deriveLeadTemperature("Within 3 months ideally")).toBe("warm");
    expect(deriveLeadTemperature("Just researching for now")).toBe("cold");
  });

  it("is case-sensitive on the JS side (DB trigger uses ILIKE — known difference)", () => {
    // Document the intentional mismatch so future devs know to normalise on the client
    // before relying on this helper for parity with the trigger.
    expect(deriveLeadTemperature("within 1 month")).toBeNull();
    expect(deriveLeadTemperature("WITHIN 3 MONTHS")).toBeNull();
  });
});