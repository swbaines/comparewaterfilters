import type { MatchedVendor } from "@/hooks/useMatchedVendors";
import type { QuizAnswers } from "@/lib/recommendationEngine";

// Coverage choice → keywords we want to see in a vendor's system_types,
// ordered by preference. We use these to pick the most coverage-aligned
// system to surface (so a "whole-house" user doesn't get matched on an
// "under-sink" line item).
const COVERAGE_KEYWORDS: Record<string, string[]> = {
  "whole-house": ["whole-house", "whole house"],
  "whole-house-plus": ["whole-house", "whole house", "reverse-osmosis", "ro"],
  "drinking-water": ["reverse-osmosis", "ro", "under-sink", "under sink"],
  kitchen: ["under-sink", "under sink", "reverse-osmosis", "ro"],
  "showers-bathrooms": ["shower", "whole-house", "whole house"],
};

// Concerns → keywords the vendor should ideally cover. Used to add a
// concerns-aligned reason when possible.
const CONCERN_KEYWORDS: Record<string, { label: string; keys: string[] }> = {
  fluoride: { label: "fluoride", keys: ["reverse-osmosis", "ro", "fluoride"] },
  "heavy-metals": { label: "heavy metals", keys: ["reverse-osmosis", "ro", "under-sink", "whole-house"] },
  pfas: { label: "PFAS", keys: ["reverse-osmosis", "ro", "carbon", "whole-house"] },
  microplastics: { label: "microplastics", keys: ["under-sink", "reverse-osmosis", "ro", "whole-house"] },
  taste: { label: "chlorine & taste", keys: ["carbon", "whole-house", "under-sink"] },
  "whole-home": { label: "chlorine", keys: ["carbon", "whole-house"] },
  "skin-hair": { label: "skin & hair", keys: ["whole-house", "shower"] },
  "skin-shower": { label: "shower water", keys: ["shower", "whole-house"] },
  "hard-water": { label: "hard water", keys: ["softener", "whole-house"] },
  appliance: { label: "appliance protection", keys: ["whole-house", "softener"] },
};

function humaniseSystem(slug: string): string {
  return slug.replace(/-/g, " ");
}

function pickCoverageAlignedSystem(
  vendorSystems: string[],
  recommendedSystems: string[],
  coverage: string | undefined,
): string | null {
  const overlap = vendorSystems.filter((s) => recommendedSystems.includes(s));
  if (overlap.length === 0) return null;
  const keywords = COVERAGE_KEYWORDS[coverage || ""] || [];
  // Prefer overlap entries matching the user's coverage keywords, in order.
  for (const kw of keywords) {
    const hit = overlap.find((s) => s.toLowerCase().includes(kw));
    if (hit) return hit;
  }
  return overlap[0];
}

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

  // System-type alignment — pick the overlap that actually fits the user's
  // coverage choice (so a whole-house customer doesn't get a reason about
  // an under-sink install they didn't ask for).
  const vendorSystems = vendor.system_types || [];
  const aligned = pickCoverageAlignedSystem(
    vendorSystems,
    recommendedSystems,
    answers.coverage,
  );
  if (aligned) {
    reasons.push(`Installs ${humaniseSystem(aligned)} — matches your recommended coverage`);
  } else if (
    answers.coverage === "whole-house" || answers.coverage === "whole-house-plus"
  ) {
    const wh = vendorSystems.find((s) => s.toLowerCase().includes("whole"));
    if (wh) reasons.push(`Installs ${humaniseSystem(wh)} for whole-home coverage`);
  }

  // Concerns alignment — surface one bullet tied to the user's top concern
  // when the vendor offers a system that addresses it.
  for (const concern of answers.concerns || []) {
    const def = CONCERN_KEYWORDS[concern];
    if (!def) continue;
    const hit = vendorSystems.find((s) =>
      def.keys.some((k) => s.toLowerCase().includes(k)),
    );
    if (hit) {
      const isWholeHouseUser =
        answers.coverage === "whole-house" ||
        answers.coverage === "whole-house-plus";
      const isUnderSink = hit.toLowerCase().includes("under-sink");
      if (isWholeHouseUser && isUnderSink) {
        reasons.push(
          `Targets ${def.label} with ${humaniseSystem(hit)} for a budget-friendly alternative`,
        );
      } else {
        reasons.push(`Targets ${def.label} with ${humaniseSystem(hit)}`);
      }
      break;
    }
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