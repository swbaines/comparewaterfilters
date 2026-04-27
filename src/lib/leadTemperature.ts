/**
 * Lead temperature helpers — mirror the SQL trigger
 * `set_lead_temperature()` so the UI and outgoing emails can label
 * leads consistently with the database value.
 */

export type LeadTemperature = "hot" | "warm" | "cold" | null;

export function deriveLeadTemperature(installationTimeline?: string | null): LeadTemperature {
  if (!installationTimeline) return null;
  if (
    installationTimeline.startsWith("As soon as possible") ||
    installationTimeline.startsWith("Within 1 month")
  ) {
    return "hot";
  }
  if (installationTimeline.startsWith("Within 3 months")) return "warm";
  if (installationTimeline.startsWith("Just researching")) return "cold";
  return null;
}

export const LEAD_TEMPERATURE_LABEL: Record<Exclude<LeadTemperature, null>, string> = {
  hot: "HOT",
  warm: "WARM",
  cold: "COLD",
};

/** Tailwind class string for a coloured Badge per temperature. */
export const LEAD_TEMPERATURE_BADGE_CLASS: Record<Exclude<LeadTemperature, null>, string> = {
  hot: "bg-red-100 text-red-800 border-red-200",
  warm: "bg-amber-100 text-amber-800 border-amber-200",
  cold: "bg-gray-100 text-gray-700 border-gray-200",
};

/** Sort weight used for vendor dashboard ordering — higher = sort first. */
export const LEAD_TEMPERATURE_RANK: Record<string, number> = {
  hot: 3,
  warm: 2,
  cold: 1,
};

export function leadTemperatureRank(temp?: string | null): number {
  if (!temp) return 0;
  return LEAD_TEMPERATURE_RANK[temp] ?? 0;
}