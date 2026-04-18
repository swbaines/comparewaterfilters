import type { Provider } from "@/data/providers";
import type { QuizAnswers } from "@/lib/recommendationEngine";
import type { RecommendationResult } from "@/lib/recommendationEngine";
import { haversineKm } from "@/lib/geo";

export interface ProviderMatch {
  provider: Provider;
  matchScore: number;       // 0-100
  matchReasons: string[];
  systemsTheyInstall: string[]; // which of the recommended systems they cover
  distanceKm?: number;
}

export interface MatchOptions {
  /** Customer's lat/lng — when provided, enables radius-based scoring */
  customerCoords?: { lat: number; lng: number };
}

export function matchProviders(
  answers: QuizAnswers,
  result: RecommendationResult,
  providersList: Provider[],
  limit = 3,
  options: MatchOptions = {}
): ProviderMatch[] {
  const recommendedIds = [
    result.primary.id,
    result.secondary.id,
    result.premium.id,
  ].filter((v, i, a) => a.indexOf(v) === i); // unique

  const budgetMap: Record<string, string[]> = {
    "under-1000": ["budget"],
    "1000-3000": ["budget", "mid"],
    "3000-5000": ["mid", "premium"],
    "5000-plus": ["mid", "premium"],
    "not-sure": ["budget", "mid", "premium"],
  };
  const acceptablePriceRanges = budgetMap[answers.budget] || ["budget", "mid", "premium"];

  const scored: ProviderMatch[] = providersList
    .filter((p) => p.availableForQuote)
    .map((provider) => {
      let score = 0;
      const reasons: string[] = [];
      let distanceKm: number | undefined;

      // 1. Location match (0-30 points) — radius-based with state fallback
      const servicesState = provider.location.states.includes(answers.state);
      const base = provider.location.serviceBase;
      const radiusKm = provider.location.serviceRadiusKm ?? 50;

      if (base && options.customerCoords) {
        distanceKm = haversineKm(
          options.customerCoords.lat,
          options.customerCoords.lng,
          base.lat,
          base.lng
        );
        if (distanceKm <= radiusKm) {
          // In-radius: strong match
          score += 30;
          const dispKm = Math.round(distanceKm);
          reasons.push(
            dispKm <= 5
              ? `Based in your area (~${dispKm}km away)`
              : `Services your area (${dispKm}km from their base in ${base.suburb})`
          );
        } else if (servicesState) {
          // Out-of-radius but in-state — fallback with reduced points
          score += 12;
          reasons.push(`Services ${answers.state} (${Math.round(distanceKm)}km from base — outside their usual radius)`);
        } else {
          // Too far and not in state — exclude
          return null;
        }
      } else if (servicesState) {
        // No base location set yet OR no customer coords — fall back to state-only
        score += 20;
        reasons.push(`Services ${answers.state}`);
      } else {
        return null;
      }

      // 2. System type match (0-30 points)
      const matchingSystems = recommendedIds.filter((id) =>
        provider.systemTypes.includes(id)
      );
      const systemCoverage = matchingSystems.length / recommendedIds.length;
      score += Math.round(systemCoverage * 30);
      if (matchingSystems.length > 0) {
        reasons.push(`Installs ${matchingSystems.length} of your ${recommendedIds.length} recommended systems`);
      }

      // 3. Budget alignment (0-15 points)
      if (acceptablePriceRanges.includes(provider.priceRange)) {
        score += 15;
        reasons.push("Fits your budget range");
      }

      // 4. Rating (0-15 points)
      score += Math.round((provider.rating / 5) * 15);
      if (provider.rating >= 4.7) {
        reasons.push(`Highly rated (${provider.rating}/5 from ${provider.reviewCount} reviews)`);
      }

      // 5. Experience (0-5 points)
      if (provider.yearsInBusiness >= 10) {
        score += 5;
        reasons.push(`${provider.yearsInBusiness}+ years experience`);
      } else if (provider.yearsInBusiness >= 5) {
        score += 3;
      }

      // 6. Water source expertise bonus (0-5 points)
      if (
        ["rainwater", "tank-water", "bore-water"].includes(answers.waterSource) &&
        provider.systemTypes.includes("uv-system")
      ) {
        score += 5;
        reasons.push("Experienced with tank/bore water");
      }

      return {
        provider,
        matchScore: Math.min(score, 100),
        matchReasons: reasons,
        systemsTheyInstall: matchingSystems,
        distanceKm,
      };
    })
    .filter(Boolean) as ProviderMatch[];

  return scored
    .filter((m) => m.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
