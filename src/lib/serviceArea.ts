export type CoverageMode = "radius" | "regions";

export interface AuStateOption { code: string; name: string; value: string; label: string }
export interface MetroOption { value: string; label: string; state: string }

export const AU_STATES: AuStateOption[] = [
  { code: "NSW", name: "New South Wales", value: "NSW", label: "New South Wales" },
  { code: "VIC", name: "Victoria", value: "VIC", label: "Victoria" },
  { code: "QLD", name: "Queensland", value: "QLD", label: "Queensland" },
  { code: "WA", name: "Western Australia", value: "WA", label: "Western Australia" },
  { code: "SA", name: "South Australia", value: "SA", label: "South Australia" },
  { code: "TAS", name: "Tasmania", value: "TAS", label: "Tasmania" },
  { code: "ACT", name: "Australian Capital Territory", value: "ACT", label: "ACT" },
  { code: "NT", name: "Northern Territory", value: "NT", label: "Northern Territory" },
];

export const CAPITAL_METROS: MetroOption[] = [
  { value: "METRO_SYD", label: "Sydney Metro", state: "NSW" },
  { value: "METRO_MEL", label: "Melbourne Metro", state: "VIC" },
  { value: "METRO_BNE", label: "Brisbane Metro", state: "QLD" },
  { value: "METRO_PER", label: "Perth Metro", state: "WA" },
  { value: "METRO_ADL", label: "Adelaide Metro", state: "SA" },
  { value: "METRO_HOB", label: "Hobart Metro", state: "TAS" },
  { value: "METRO_CBR", label: "Canberra Metro", state: "ACT" },
  { value: "METRO_DAR", label: "Darwin Metro", state: "NT" },
];

const STATE_CODES: Set<string> = new Set(AU_STATES.map((s) => s.code));
const METRO_TO_STATE: Map<string, string> = new Map(CAPITAL_METROS.map((m) => [m.value, m.state]));

export interface CoverageInput {
  mode: CoverageMode;
  baseLat?: number | null;
  baseLng?: number | null;
  baseState?: string | null;
  radiusKm?: number;
  regionSelections: string[];
}

/**
 * Compute the list of state codes covered by the given service area selection.
 * For "radius" mode, returns the base state (statewide >= 5000km returns all states).
 * For "regions" mode, expands metro tokens to their parent state and de-dupes.
 */
export function computeCoverageStates(input: CoverageInput): string[] {
  if (input.mode === "radius") {
    if ((input.radiusKm ?? 0) >= 5000) {
      return AU_STATES.map((s) => s.code);
    }
    return input.baseState ? [input.baseState] : [];
  }
  const out = new Set<string>();
  for (const token of input.regionSelections) {
    if (STATE_CODES.has(token)) out.add(token);
    else {
      const st = METRO_TO_STATE.get(token);
      if (st) out.add(st);
    }
  }
  return Array.from(out);
}

/**
 * Detect whether saved coverage data represents radius or regions mode.
 * If any saved value matches a known state code or metro token exactly, treat as regions.
 */
export function detectCoverageMode(savedStates: string[], serviceRadiusKm: number | null | undefined): CoverageMode {
  if (serviceRadiusKm && serviceRadiusKm > 0) return "radius";
  if (savedStates.some((s) => METRO_TO_STATE.has(s))) return "regions";
  if (savedStates.length > 1) return "regions";
  return "radius";
}