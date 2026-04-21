import { describe, it, expect } from "vitest";
import { recommendations } from "@/data/recommendations";
import {
  CANONICAL_SYSTEM_TYPES,
  RECOMMENDATION_TO_CANONICAL,
  toCanonicalSystemType,
  normalizeSystemTypeId,
  normalizeSystemTypeIds,
} from "@/lib/canonicalSystemTypes";

describe("recommendation taxonomy", () => {
  it("every recommendation ID resolves to a canonical mapping (or explicit null)", () => {
    const unmapped: string[] = [];
    for (const rec of recommendations) {
      const resolved = toCanonicalSystemType(rec.id);
      // `undefined` means: not canonical AND no mapping entry → drift bug.
      if (resolved === undefined) {
        unmapped.push(rec.id);
      }
    }
    expect(
      unmapped,
      `These recommendation IDs are missing from CANONICAL_SYSTEM_TYPES or RECOMMENDATION_TO_CANONICAL: ${unmapped.join(
        ", "
      )}. Add them to src/lib/canonicalSystemTypes.ts.`
    ).toEqual([]);
  });

  it("every mapping target is itself a canonical system type", () => {
    const invalid: Array<[string, string]> = [];
    for (const [recId, canonical] of Object.entries(RECOMMENDATION_TO_CANONICAL)) {
      if (canonical === null) continue;
      if (!(CANONICAL_SYSTEM_TYPES as readonly string[]).includes(canonical)) {
        invalid.push([recId, canonical]);
      }
    }
    expect(
      invalid,
      `These mappings point to non-canonical IDs: ${invalid
        .map(([r, c]) => `${r}→${c}`)
        .join(", ")}`
    ).toEqual([]);
  });

  it("canonical system types match the database taxonomy", () => {
    // Mirrors the rows in public.system_type_ids. Update both together.
    expect([...CANONICAL_SYSTEM_TYPES].sort()).toEqual([
      "hybrid",
      "reverse-osmosis",
      "under-sink-carbon",
      "uv",
      "water-softener",
      "whole-house-filtration",
    ]);
  });

  it("whole-home-filtration is treated as an alias for whole-house-filtration", () => {
    expect(normalizeSystemTypeId("whole-home-filtration")).toBe("whole-house-filtration");
    expect(toCanonicalSystemType("whole-home-filtration")).toBe("whole-house-filtration");
  });

  it("normalizeSystemTypeIds dedupes after aliasing", () => {
    expect(
      normalizeSystemTypeIds([
        "whole-home-filtration",
        "whole-house-filtration",
        "reverse-osmosis",
      ]).sort()
    ).toEqual(["reverse-osmosis", "whole-house-filtration"]);
  });

  it("normalizeSystemTypeId leaves unknown IDs unchanged", () => {
    expect(normalizeSystemTypeId("reverse-osmosis")).toBe("reverse-osmosis");
    expect(normalizeSystemTypeId("something-new")).toBe("something-new");
  });
});
