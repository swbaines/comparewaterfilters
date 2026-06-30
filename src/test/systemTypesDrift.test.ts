import { describe, it, expect } from "vitest";
import { recommendations } from "@/data/recommendations";
import { systemTypes } from "@/data/systemTypes";
import {
  CANONICAL_SYSTEM_TYPES,
  COMBO_COMPONENT_IDS,
  SYSTEM_TYPE_ALIASES,
  expandCombosToComponents,
  normalizeSystemTypeId,
  normalizeSystemTypeIds,
  toCanonicalSystemType,
} from "@/lib/canonicalSystemTypes";

/**
 * These tests guard the quiz → results → matched-providers pipeline against
 * silent ID drift. Any recommendation produced by the engine must resolve
 * (after alias normalisation + combo expansion) to canonical IDs that exist
 * in `src/data/systemTypes.ts` — otherwise the results page renders the
 * recommendation but the matched-providers query returns nothing.
 */
describe("systemTypes alias normalisation", () => {
  it("maps every alias to a canonical ID", () => {
    for (const [alias, canonical] of Object.entries(SYSTEM_TYPE_ALIASES)) {
      expect(normalizeSystemTypeId(alias)).toBe(canonical);
      expect(CANONICAL_SYSTEM_TYPES).toContain(canonical);
    }
  });

  it("is idempotent on already-canonical IDs", () => {
    for (const id of CANONICAL_SYSTEM_TYPES) {
      expect(normalizeSystemTypeId(id)).toBe(id);
      expect(normalizeSystemTypeIds([id, id])).toEqual([id]);
    }
  });

  it("dedupes aliases that collapse to the same canonical ID", () => {
    const result = normalizeSystemTypeIds([
      "whole-home-filtration",
      "whole-house-filtration",
    ]);
    expect(result).toEqual(["whole-house-filtration"]);
  });

  it("leaves unknown IDs untouched so callers can flag them", () => {
    expect(normalizeSystemTypeId("brand-new-system")).toBe("brand-new-system");
  });
});

describe("quiz → results drift prevention", () => {
  const systemTypeIds = new Set(systemTypes.map((s) => s.id));

  it("systemTypes.ts contains an entry for every canonical (non-combo) ID", () => {
    const combos = new Set(Object.keys(COMBO_COMPONENT_IDS));
    const missing = CANONICAL_SYSTEM_TYPES.filter(
      (id) => !combos.has(id) && !systemTypeIds.has(id),
    );
    expect(missing).toEqual([]);
  });

  it("every combo expands into canonical components that exist in systemTypes.ts", () => {
    for (const [combo, components] of Object.entries(COMBO_COMPONENT_IDS)) {
      expect(CANONICAL_SYSTEM_TYPES).toContain(combo);
      for (const c of components) {
        expect(CANONICAL_SYSTEM_TYPES).toContain(c);
        expect(systemTypeIds.has(c)).toBe(true);
      }
    }
  });

  it("every recommendation, after the results-page pipeline, yields IDs the vendor matcher can use", () => {
    // Mirrors src/pages/ResultsPage.tsx → src/hooks/useMatchedVendors.ts
    const stuck: string[] = [];
    for (const rec of recommendations) {
      const canonical = toCanonicalSystemType(rec.id);
      if (canonical === null) continue; // sentinel (camping, custom-assessment)
      if (canonical === undefined) {
        stuck.push(`${rec.id} (no mapping)`);
        continue;
      }
      const expanded = expandCombosToComponents(normalizeSystemTypeIds([canonical]));
      for (const id of expanded) {
        if (!systemTypeIds.has(id)) {
          stuck.push(`${rec.id} → ${id} (missing in systemTypes.ts)`);
        }
        if (id in COMBO_COMPONENT_IDS) {
          stuck.push(`${rec.id} → ${id} (combo not expanded)`);
        }
      }
    }
    expect(stuck).toEqual([]);
  });

  it("expandCombosToComponents removes combo IDs from the output", () => {
    const out = expandCombosToComponents(["hybrid", "uv"]);
    expect(out).not.toContain("hybrid");
    expect(out).toContain("whole-house-filtration");
    expect(out).toContain("reverse-osmosis");
    expect(out).toContain("uv");
  });
});
