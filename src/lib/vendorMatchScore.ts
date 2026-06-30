import type { MatchedVendor } from "@/hooks/useMatchedVendors";

export type MatchRank = "top" | "strong" | "good";

export interface ScoredVendor {
  vendor: MatchedVendor;
  score: number;
  rank: MatchRank;
}

/**
 * Weighted match score across the visible vendor set.
 *  - Response time (lower = better)     → 40%
 *  - Rating × review count (higher better) → 35%
 *  - Win rate (higher = better)         → 25%
 * New vendors with missing signals receive the platform average for that
 * variable so they aren't penalised on day one.
 */
export function scoreVendorMatches(vendors: MatchedVendor[]): ScoredVendor[] {
  if (vendors.length === 0) return [];

  const respSamples = vendors
    .map((v) => v.avg_response_minutes)
    .filter((n): n is number => typeof n === "number" && isFinite(n) && n > 0);
  const ratingSamples = vendors.map(
    (v) => (Number(v.rating) || 0) * Math.max(0, v.review_count || 0),
  );
  const winSamples = vendors
    .map((v) => v.win_rate)
    .filter((n): n is number => typeof n === "number" && isFinite(n));

  const respAvg = respSamples.length
    ? respSamples.reduce((a, b) => a + b, 0) / respSamples.length
    : 240;
  const winAvg = winSamples.length
    ? winSamples.reduce((a, b) => a + b, 0) / winSamples.length
    : 0.3;

  // Normalise rating×reviews to [0,1] across the visible set so it stays
  // meaningful regardless of how big the marketplace gets.
  const ratingMax = Math.max(1, ...ratingSamples);

  // Response time: invert and clamp at 24h.
  const respCeiling = 24 * 60;

  const scored: ScoredVendor[] = vendors.map((v) => {
    const resp =
      typeof v.avg_response_minutes === "number" && isFinite(v.avg_response_minutes)
        ? v.avg_response_minutes
        : respAvg;
    const respScore = Math.max(0, 1 - Math.min(resp, respCeiling) / respCeiling);

    const ratingScore = ((Number(v.rating) || 0) * Math.max(0, v.review_count || 0)) / ratingMax;

    const win =
      typeof v.win_rate === "number" && isFinite(v.win_rate) ? v.win_rate : winAvg;
    const winScore = Math.max(0, Math.min(1, win));

    const score = respScore * 0.4 + ratingScore * 0.35 + winScore * 0.25;
    return { vendor: v, score, rank: "good" as MatchRank };
  });

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => {
    s.rank = i === 0 ? "top" : i === 1 ? "strong" : "good";
  });
  return scored;
}

export const MATCH_RANK_LABEL: Record<MatchRank, string> = {
  top: "Top match",
  strong: "Strong match",
  good: "Good match",
};