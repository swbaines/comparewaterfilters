import { providers, type Provider } from "@/data/providers";
import type { QuizAnswers } from "@/lib/recommendationEngine";
import type { RecommendationResult } from "@/lib/recommendationEngine";

export interface ProviderMatch {
  provider: Provider;
  matchScore: number;       // 0-100
  matchReasons: string[];
  systemsTheyInstall: string[]; // which of the recommended systems they cover
}

export function matchProviders(
  answers: QuizAnswers,
  result: RecommendationResult,
  limit = 3
): ProviderMatch[] {
  const recommendedIds = [
    result.primary.id,
    result.secondary.id,
    result.premium.id,
  ].filter((v, i, a) => a.indexOf(v) === i); // unique

  const budgetMap: Record<string, string[]> = {
    "under-1000": ["budget"],
    "1000-3000": ["budget", "mid"],
    "3000-6000": ["mid", "premium"],
    "6000-plus": ["mid", "premium"],
    "not-sure": ["budget", "mid", "premium"],
  };
  const acceptablePriceRanges = budgetMap[answers.budget] || ["budget", "mid", "premium"];

  const scored: ProviderMatch[] = providers
    .filter((p) => p.availableForQuote)
    .map((provider) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Location match (0-30 points)
      if (provider.location.states.includes(answers.state)) {
        score += 20;
        reasons.push(`Services ${answers.state}`);
        if (provider.location.postcodeRanges) {
          const pc = parseInt(answers.postcode, 10);
          const inRange = provider.location.postcodeRanges.some((range) => {
            const [min, max] = range.split("-").map(Number);
            return pc >= min && pc <= max;
          });
          if (inRange) {
            score += 10;
            reasons.push("Covers your postcode area");
          }
        } else {
          score += 5; // national coverage bonus
        }
      } else {
        return null; // skip providers that don't service the state
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
      };
    })
    .filter(Boolean) as ProviderMatch[];

  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
