import type { MatchedVendor } from "@/hooks/useMatchedVendors";
import type { QuizAnswers } from "@/lib/recommendationEngine";

/**
 * Generate 2–3 short "why we matched them to you" bullets per vendor by
 * cross-referencing their profile against the customer's quiz answers.
 * Returns the 3 most relevant rules; falls back to a generic line when
 * fewer than two specific reasons fire.
 */
export function buildMatchReasons(
  vendor: MatchedVendor,
  answers: QuizAnswers,
  recommendedSystems: string[],
): string[] {
  const reasons: string[] = [];
  const suburb = answers.suburb?.trim();

  // Distance-based: within own service radius (computed in SQL → distance_km).
  if (
    typeof vendor.distance_km === "number" &&
    vendor.distance_km <= (vendor.service_radius_km || 50)
  ) {
    if (suburb) reasons.push(`Services ${suburb} & surrounding areas`);
    else reasons.push("Services your area");
  }

  // System-type alignment with the recommendation.
  const overlap = (vendor.system_types || []).filter((s) => recommendedSystems.includes(s));
  if (overlap.length > 0) {
    const human = overlap[0].replace(/-/g, " ");
    reasons.push(`Installs ${human} — your recommended coverage`);
  }

  // Star rating signal.
  if (Number(vendor.rating) >= 4.8 && (vendor.review_count || 0) >= 50) {
    reasons.push(
      `${Number(vendor.rating).toFixed(1)}★ across ${vendor.review_count} verified jobs`,
    );
  }

  // Experience signal.
  if ((vendor.years_in_business || 0) >= 15) {
    reasons.push(`${vendor.years_in_business}+ years installing water filtration`);
  }

  // Installation model — in-house licensed plumbers.
  if (vendor.installation_model === "in_house_licensed") {
    reasons.push("Plumber-owned — handles installs end to end");
  }

  // Untreated source → flag any vendor that lists UV / whole-house as relevant.
  if (
    ["tank-water", "rainwater", "bore-water"].includes(answers.waterSource || "") &&
    (vendor.system_types || []).some((s) => s.includes("uv") || s.includes("whole-house"))
  ) {
    reasons.push("Set up for tank, rainwater & bore systems");
  }

  // Cap to 3, dedupe.
  const unique = Array.from(new Set(reasons)).slice(0, 3);
  if (unique.length < 2) {
    if (!unique.some((r) => r.toLowerCase().includes("services"))) {
      unique.push("Services your area");
    }
  }
  return unique.slice(0, 3);
}