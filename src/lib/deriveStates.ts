import { haversineKm } from "./geo";

/**
 * Approximate centroids for each Australian state/territory.
 * Used to auto-derive which states a vendor services based on their base
 * location + service radius.
 */
const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  NSW: { lat: -32.163, lng: 147.017 },
  VIC: { lat: -36.854, lng: 144.281 },
  QLD: { lat: -22.575, lng: 144.085 },
  WA: { lat: -25.728, lng: 122.001 },
  SA: { lat: -30.057, lng: 135.764 },
  TAS: { lat: -42.021, lng: 146.594 },
  ACT: { lat: -35.473, lng: 149.012 },
  NT: { lat: -19.491, lng: 132.551 },
};

/**
 * Derive the list of states a vendor covers from their base location + radius.
 *
 * Rules:
 * - The base state is always included.
 * - Any other state whose centroid is within `radiusKm` of the base point is included.
 * - If radius >= 2000 (statewide+), all 8 states/territories are returned.
 */
export function deriveStatesFromBase(
  baseLat: number | null | undefined,
  baseLng: number | null | undefined,
  baseState: string | null | undefined,
  radiusKm: number
): string[] {
  const all = Object.keys(STATE_CENTROIDS);
  if (radiusKm >= 2000) return all;
  if (baseLat == null || baseLng == null) {
    return baseState ? [baseState] : [];
  }
  const out = new Set<string>();
  if (baseState) out.add(baseState);
  for (const [code, c] of Object.entries(STATE_CENTROIDS)) {
    if (haversineKm(baseLat, baseLng, c.lat, c.lng) <= radiusKm) {
      out.add(code);
    }
  }
  return Array.from(out);
}
