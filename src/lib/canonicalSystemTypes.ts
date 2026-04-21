/**
 * Canonical system type taxonomy.
 *
 * These IDs are the single source of truth that providers use in their
 * `system_types` column (mirrored in the `system_type_ids` table).
 *
 * Every recommendation ID in `src/data/recommendations.ts` MUST either:
 *   1. Match one of these canonical IDs exactly, OR
 *   2. Have an entry in `RECOMMENDATION_TO_CANONICAL` mapping it to one.
 *
 * If you add a new recommendation, add a mapping here (or use `null` if
 * no provider system type can plausibly fulfill it — e.g. camping filters).
 */
export const CANONICAL_SYSTEM_TYPES = [
  "hybrid",
  "reverse-osmosis",
  "under-sink-carbon",
  "uv",
  "water-softener",
  "whole-house-filtration",
] as const;

export type CanonicalSystemType = (typeof CANONICAL_SYSTEM_TYPES)[number];

/**
 * Maps recommendation IDs that don't directly match a canonical system type
 * to their closest canonical equivalent (or `null` if none applies).
 *
 * Recommendation IDs that already match a canonical ID don't need an entry.
 */
export const RECOMMENDATION_TO_CANONICAL: Record<string, CanonicalSystemType | null> = {
  // Direct equivalents (different naming)
  "whole-house-combo": "hybrid",
  "uv-system": "uv",

  // "whole-home-filtration" is a common alternative phrasing used by some
  // providers and customers — treat it as identical to whole-house-filtration.
  "whole-home-filtration": "whole-house-filtration",

  // Point-of-use carbon-style filters → providers offering under-sink carbon
  // are the closest installable equivalent.
  "shower-filter": "under-sink-carbon",
  "tap-filter": "under-sink-carbon",
  "alkaline-filter": "under-sink-carbon",

  // Tank/rainwater pre-filtration is typically delivered as part of a
  // whole-house filtration setup.
  "tank-filter": "whole-house-filtration",

  // No provider-installable equivalent — sentinel/portable categories.
  "camping-filter": null,
  "custom-assessment": null,
};

/**
 * Resolve a recommendation ID to its canonical provider-system-type ID.
 * Returns `null` if there's no canonical equivalent (e.g. portable/sentinel
 * categories), or `undefined` if the ID is unknown (likely a bug).
 */
export function toCanonicalSystemType(
  recommendationId: string
): CanonicalSystemType | null | undefined {
  if ((CANONICAL_SYSTEM_TYPES as readonly string[]).includes(recommendationId)) {
    return recommendationId as CanonicalSystemType;
  }
  if (recommendationId in RECOMMENDATION_TO_CANONICAL) {
    return RECOMMENDATION_TO_CANONICAL[recommendationId];
  }
  return undefined;
}

/**
 * Map of non-canonical aliases → canonical IDs that should be treated as
 * fully equivalent everywhere (display, matching, validation, search).
 *
 * Unlike `RECOMMENDATION_TO_CANONICAL` (which describes recommendation→
 * provider-system mappings, including `null` sentinels), this map is purely
 * about synonymous IDs that mean the same thing.
 */
export const SYSTEM_TYPE_ALIASES: Record<string, CanonicalSystemType> = {
  "whole-home-filtration": "whole-house-filtration",
};

/**
 * Normalise any system-type ID (canonical or alias) to its canonical form.
 * Unknown IDs are returned unchanged so callers can decide how to handle them.
 */
export function normalizeSystemTypeId(id: string): string {
  if (id in SYSTEM_TYPE_ALIASES) return SYSTEM_TYPE_ALIASES[id];
  return id;
}

/**
 * Normalise an array of system-type IDs and de-duplicate the result.
 */
export function normalizeSystemTypeIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const id of ids) seen.add(normalizeSystemTypeId(id));
  return [...seen];
}
