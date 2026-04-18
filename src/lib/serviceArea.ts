import { deriveStatesFromBase } from "./deriveStates";

/**
 * Capital-city metro regions. Each maps to a parent state for matching.
 * The metro label is shown in the UI; matching is done via the parent state.
 */
export const CAPITAL_METROS = [
  { value: "METRO_SYD", label: "Greater Sydney", state: "NSW" },
  { value: "METRO_MEL", label: "Greater Melbourne", state: "VIC" },
  { value: "METRO_BNE", label: "Greater Brisbane", state: "QLD" },
  { value: "METRO_PER", label: "Greater Perth", state: "WA" },
  { value: "METRO_ADL", label: "Greater Adelaide", state: "SA" },
  { value: "METRO_HOB", label: "Greater Hobart", state: "TAS" },
  { value: "METRO_CBR", label: "Canberra", state: "ACT" },
  { value: "METRO_DAR", label: "Darwin", state: "NT" },
] as const;

export const AU_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "ACT" },
  { value: "NT", label: "Northern Territory" },
] as const;

export type CoverageMode = "radius" | "regions";

const METRO_VALUES: Set<string> = new Set(CAPITAL_METROS.map((m) => m.value));
const METRO_TO_STATE: Record<string, string> = Object.fromEntries(
  CAPITAL_METROS.map((m) => [m.value, m.state])
);

/**
 * Detect coverage mode from saved provider data.
 * If a base location is set, treat as radius mode; otherwise regions mode.
 */
export function detectCoverageMode(
  baseLat: number | null | undefined,
  baseLng: number | null | undefined
): CoverageMode {
  return baseLat != null && baseLng != null ? "radius" : "regions";
}

/**
 * Convert a mixed list of state codes and metro tokens into the deduped
 * list of underlying state codes used by the matching engine.
 */
export function regionsToStates(selections: string[]): string[] {
  const out = new Set<string>();
  for (const v of selections) {
    if (METRO_VALUES.has(v)) out.add(METRO_TO_STATE[v]);
    else out.add(v);
  }
  return Array.from(out);
}

/**
 * Compute the effective list of state codes a vendor covers given their
 * coverage mode and current selections.
 */
export function computeCoverageStates(opts: {
  mode: CoverageMode;
  baseLat: number | null;
  baseLng: number | null;
  baseState: string | null;
  radiusKm: number;
  regionSelections: string[];
}): string[] {
  if (opts.mode === "radius") {
    return deriveStatesFromBase(opts.baseLat, opts.baseLng, opts.baseState, opts.radiusKm);
  }
  return regionsToStates(opts.regionSelections);
}
