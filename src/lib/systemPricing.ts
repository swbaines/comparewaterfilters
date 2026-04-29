/**
 * Single source of truth for installed price ranges and annual maintenance
 * ranges across the platform. Use `getSystemPricing()` to look up a single
 * system or a combination — combinations are summed unless a curated combo
 * entry exists (e.g. whole-house + RO).
 */

export interface PricingRange {
  installMin: number;
  installMax: number;
  annualMin: number;
  annualMax: number;
}

/**
 * Canonical pricing table. Keys are the canonical system IDs used by the
 * recommendation engine and the rest of the codebase.
 */
export const SYSTEM_PRICING: Record<string, PricingRange> = {
  "under-sink-carbon": { installMin: 300, installMax: 1000, annualMin: 80, annualMax: 200 },
  "reverse-osmosis": { installMin: 800, installMax: 1500, annualMin: 150, annualMax: 200 },
  "whole-house-filtration": { installMin: 3000, installMax: 5000, annualMin: 300, annualMax: 500 },
  "uv-disinfection": { installMin: 1500, installMax: 4000, annualMin: 100, annualMax: 250 },
  "water-softener": { installMin: 2000, installMax: 6000, annualMin: 150, annualMax: 400 },
  "whole-house-plus-drinking-water-combo": {
    installMin: 4000,
    installMax: 6000,
    annualMin: 400,
    annualMax: 600,
  },
};

/**
 * Aliases that map alternate IDs (used elsewhere in the codebase) to the
 * canonical pricing keys above. Keeps callers flexible without forcing a
 * rename across the whole platform.
 */
const ID_ALIASES: Record<string, string> = {
  "uv-system": "uv-disinfection",
  "uv": "uv-disinfection",
  "whole-house": "whole-house-filtration",
  "whole-house-combo": "whole-house-plus-drinking-water-combo",
  "whole-home-plus-ro": "whole-house-plus-drinking-water-combo",
  "ro": "reverse-osmosis",
  "under-sink": "under-sink-carbon",
};

function normaliseId(id: string): string {
  const key = id.trim().toLowerCase();
  return ID_ALIASES[key] ?? key;
}

/**
 * Detects curated combinations that should use a bespoke pricing entry
 * rather than a naive sum of the parts. Returns the canonical combo ID
 * if one exists, otherwise null.
 */
function matchCuratedCombo(ids: string[]): string | null {
  const set = new Set(ids);
  const hasWholeHouse = set.has("whole-house-filtration");
  const hasDrinking = set.has("reverse-osmosis") || set.has("under-sink-carbon");
  if (hasWholeHouse && hasDrinking && ids.length === 2) {
    return "whole-house-plus-drinking-water-combo";
  }
  return null;
}

/**
 * Returns the install + annual maintenance range for a single system ID
 * or a combination of system IDs.
 *
 * Rules:
 *   1. Single ID → that system's range directly.
 *   2. Combination matching a curated combo → use the curated entry.
 *   3. Any other combination → sum mins and maxs across the parts.
 *   4. Unknown IDs are skipped silently. If nothing resolves, returns null.
 */
export function getSystemPricing(input: string | string[]): PricingRange | null {
  const rawIds = Array.isArray(input) ? input : [input];
  const ids = Array.from(
    new Set(rawIds.map(normaliseId).filter((id) => SYSTEM_PRICING[id])),
  );

  if (ids.length === 0) return null;

  if (ids.length === 1) {
    return { ...SYSTEM_PRICING[ids[0]] };
  }

  const curated = matchCuratedCombo(ids);
  if (curated && SYSTEM_PRICING[curated]) {
    return { ...SYSTEM_PRICING[curated] };
  }

  return ids.reduce<PricingRange>(
    (acc, id) => {
      const p = SYSTEM_PRICING[id];
      return {
        installMin: acc.installMin + p.installMin,
        installMax: acc.installMax + p.installMax,
        annualMin: acc.annualMin + p.annualMin,
        annualMax: acc.annualMax + p.annualMax,
      };
    },
    { installMin: 0, installMax: 0, annualMin: 0, annualMax: 0 },
  );
}

/** Formats a numeric range as e.g. "$3,000 – $5,000". */
export function formatPriceRange(min: number, max: number): string {
  return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
}

export const PRICING_DISCLAIMER =
  "Final pricing depends on your property, installer, and any access or plumbing requirements. Request a quote for an exact price.";