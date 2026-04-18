import { recommendations, type Recommendation } from "@/data/recommendations";

export interface QuizAnswers {
  postcode: string;
  suburb: string;
  state: string;
  propertyType: string;
  ownershipStatus: string;
  householdSize: string;
  bathrooms: string;
  waterSource: string;
  concerns: string[];
  coverage: string;
  budget: string;
  priorities: string[];
  notes: string;
  firstName: string;
  email: string;
  mobile: string;
  consent: boolean;
  disclaimerAck: boolean;
}

export type FiredRule =
  | "rule-1-whole-home"
  | "rule-2-hard-water-wa-sa"
  | "rule-3-ro-essential"
  | "rule-4-drinking-only"
  | "rule-5-renter-apartment"
  | "rule-6-budget-under-1k"
  | "default";

export interface RuleExplanation {
  /** Machine ID of the dominant rule that fired. */
  rule: FiredRule;
  /** Human-friendly rule number + name (e.g. "Rule 2 — Hard water in WA/SA"). */
  ruleLabel: string;
  /** All rules that influenced the result, in evaluation order. */
  appliedRules: { rule: FiredRule; label: string }[];
  /** Concern IDs from the quiz that triggered this rule. */
  triggeringConcerns: string[];
  /** Honest trade-off note for the Good (secondary) tier — what it does and doesn't solve. */
  goodTierTradeoff: string;
}

export interface RecommendationResult {
  primary: Recommendation;
  secondary: Recommendation;
  premium: Recommendation;
  primaryReason: string;
  secondaryReason: string;
  premiumReason: string;
  summary: string;
  warnings: string[];
  explanation: RuleExplanation;
}

/**
 * The recommendation engine ONLY returns these 4 systems to users:
 *   1. Whole House Filtration  → "whole-house-filtration"
 *   2. Reverse Osmosis         → "reverse-osmosis"
 *   3. Under-sink Carbon       → "under-sink-carbon"
 *   4. Water Softener          → "water-softener"  (only WA/SA)
 *
 * For the "Good" (cheaper alternative) tier in Rule 4 we also use
 * "tap-filter" — it maps to under-sink-carbon in the canonical taxonomy.
 *
 * For the "Premium" combined tier we use "whole-house-combo", which
 * maps to canonical "hybrid" in the provider taxonomy.
 */

// ─── State-specific warning context (kept for VIC/WA/SA/QLD/NSW notes) ──────
interface StateWaterProfile {
  hardnessLevel: "very-soft" | "soft" | "moderate" | "hard" | "very-hard";
  chlorineLevel: "low" | "moderate" | "high" | "very-high";
  fluoridated: boolean;
  pfasRisk: "low" | "moderate" | "elevated";
  softenerNeeded: boolean;
  scaleReductionRecommended: boolean;
}

const STATE_WATER_PROFILES: Record<string, StateWaterProfile> = {
  VIC: { hardnessLevel: "very-soft", chlorineLevel: "high", fluoridated: true, pfasRisk: "low", softenerNeeded: false, scaleReductionRecommended: false },
  NSW: { hardnessLevel: "soft", chlorineLevel: "moderate", fluoridated: true, pfasRisk: "moderate", softenerNeeded: false, scaleReductionRecommended: false },
  QLD: { hardnessLevel: "moderate", chlorineLevel: "moderate", fluoridated: true, pfasRisk: "low", softenerNeeded: false, scaleReductionRecommended: true },
  SA:  { hardnessLevel: "hard", chlorineLevel: "very-high", fluoridated: true, pfasRisk: "low", softenerNeeded: true, scaleReductionRecommended: true },
  WA:  { hardnessLevel: "hard", chlorineLevel: "high", fluoridated: true, pfasRisk: "low", softenerNeeded: true, scaleReductionRecommended: true },
  TAS: { hardnessLevel: "very-soft", chlorineLevel: "low", fluoridated: true, pfasRisk: "low", softenerNeeded: false, scaleReductionRecommended: false },
  ACT: { hardnessLevel: "soft", chlorineLevel: "moderate", fluoridated: true, pfasRisk: "moderate", softenerNeeded: false, scaleReductionRecommended: false },
  NT:  { hardnessLevel: "moderate", chlorineLevel: "moderate", fluoridated: false, pfasRisk: "low", softenerNeeded: false, scaleReductionRecommended: true },
};

// ─── Helper flags ───────────────────────────────────────────────────────────
function getFlags(answers: QuizAnswers) {
  const { concerns, coverage, budget, ownershipStatus, propertyType, state } = answers;
  const has = (c: string) => concerns.includes(c);

  const isRenter = ownershipStatus === "Rent";
  const isApartment = propertyType === "Apartment";
  const canHaveWholeHome = !isRenter && !isApartment;

  const stateProfile = STATE_WATER_PROFILES[state] || null;
  const isWAorSA = state === "WA" || state === "SA";

  // RULE 1 trigger: whole-home intent
  const wholeHomeTrigger =
    coverage === "whole-house" ||
    coverage === "whole-house-plus" ||
    has("skin-hair") ||
    has("skin-shower") ||
    has("appliance") ||
    has("whole-home") ||
    has("hard-water") ||
    (has("chlorine") && (coverage === "whole-house" || coverage === "whole-house-plus"));

  // RULE 2 trigger: hard water in WA/SA
  const hardWaterWASA = isWAorSA && (has("hard-water") || has("appliance"));

  // RULE 3 trigger: RO-essential contaminants
  const roTrigger =
    has("fluoride") ||
    has("pfas") ||
    has("heavy-metals") ||
    has("microplastics") ||
    has("bacteria");

  // RULE 4 trigger: drinking-water / taste / chlorine only
  const drinkingCoverage =
    coverage === "drinking-water" || coverage === "kitchen" || coverage === "one-tap";
  const onlyTasteChlorine =
    !roTrigger &&
    !wholeHomeTrigger &&
    !hardWaterWASA &&
    drinkingCoverage &&
    concerns.every((c) => ["taste", "chlorine", "drinking-quality"].includes(c));

  const budgetUnder1k = budget === "under-1000";

  return {
    has,
    isRenter,
    isApartment,
    canHaveWholeHome,
    stateProfile,
    isWAorSA,
    wholeHomeTrigger,
    hardWaterWASA,
    roTrigger,
    onlyTasteChlorine,
    budgetUnder1k,
  };
}

// ─── State-specific warnings (preserved from original engine) ───────────────
function getStateWarnings(answers: QuizAnswers, f: ReturnType<typeof getFlags>): string[] {
  const warnings: string[] = [];
  switch (answers.state) {
    case "VIC":
      if (!f.has("chlorine") && !f.has("taste") && f.canHaveWholeHome) {
        warnings.push(
          "Melbourne's water is very soft (no scale issues) but has notably higher chlorine levels than most Australian cities. Many Melbourne households notice improved skin, hair, and taste with a whole house filtration system."
        );
      }
      break;
    case "NSW":
      if (f.has("pfas")) {
        warnings.push(
          "PFAS was detected at elevated levels at the Blue Mountains Cascade Water Filtration Plant in 2024. Levels now meet updated 2025 Australian Drinking Water Guidelines, but a reverse osmosis system provides the most effective household protection against PFAS."
        );
      } else {
        warnings.push(
          "Sydney Water uses both chlorine and chloramine for disinfection — chloramine can be harder to remove than chlorine and requires a quality carbon filter."
        );
      }
      break;
    case "QLD":
      warnings.push(
        "Brisbane water is moderately hard and prone to a seasonal earthy/musty taste after rain (from naturally occurring algae compounds in the dams). A carbon filter addresses this well."
      );
      break;
    case "SA":
      warnings.push(
        "Adelaide has Australia's hardest mainland capital city water and the highest chlorine levels — sometimes reaching 1.8 mg/L. Hard-water and scale concerns are best addressed with a water softener; chlorine and taste with whole house filtration."
      );
      break;
    case "WA":
      warnings.push(
        "Perth's water hardness varies enormously by suburb — from 28 mg/L in southern areas to over 220 mg/L in northern suburbs (Wanneroo, Yanchep, Two Rocks). If you're in a northern suburb, scale buildup is a strong indicator that a softener is essential."
      );
      break;
  }
  return warnings;
}

// ─── Main recommendation function ───────────────────────────────────────────
export function generateRecommendations(answers: QuizAnswers): RecommendationResult {
  const f = getFlags(answers);
  const warnings: string[] = [];

  let primaryId = "under-sink-carbon";
  let secondaryId = "under-sink-carbon";
  let premiumId = "reverse-osmosis";
  let primaryReason = "";
  let secondaryReason = "";
  let premiumReason = "";

  // ── RULE 5: Renters / apartments ──────────────────────────────────────────
  // Never recommend whole-house or water softener as Best or Premium.
  // Default to Rule 3 (RO-essential) or Rule 4 (taste/chlorine).
  if (!f.canHaveWholeHome) {
    if (f.isRenter && (f.wholeHomeTrigger || f.hardWaterWASA)) {
      warnings.push(
        "As a renter, whole house filtration and water softener systems aren't practical — they require landlord approval and permanent plumbing changes. We've tailored your recommendations to the best options available for renters."
      );
    }
    if (f.isApartment && (f.wholeHomeTrigger || f.hardWaterWASA)) {
      warnings.push(
        "Whole house filtration and water softener systems cannot be installed in apartments. We've recommended the best under-sink and point-of-use options for your home."
      );
    }

    if (f.roTrigger) {
      // Rule 3 path
      primaryId = "reverse-osmosis";
      primaryReason = `A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, microplastics, and bacteria from drinking water. It installs neatly under your kitchen sink. $800–$1,600 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `An under-sink carbon and sediment filter is a more affordable alternative — but be aware: carbon filters reduce but do not eliminate fluoride, PFAS, or heavy metals. RO is the proper solution.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For the ultimate drinking water experience, a premium reverse osmosis system with alkaline remineralisation adds beneficial minerals back after filtration — delivering purified, mineral-balanced water from your kitchen tap.`;
    } else {
      // Rule 4 path (taste/chlorine/drinking only)
      primaryId = "under-sink-carbon";
      primaryReason = `An under-sink carbon and sediment filter is the ideal solution for renters and apartments — effectively removing chlorine, sediment, and improving taste at your kitchen tap. $300–$1,200 installed.`;
      secondaryId = "tap-filter";
      secondaryReason = `A tap-mounted filter is a cheaper alternative that screws onto your existing tap — easier to install (no plumbing changes) but with lower flow rate and shorter cartridge life than an under-sink system.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For a significant step up in purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants — the premium drinking water solution at $800–$1,600 installed.`;
    }
  }

  // ── RULE 2: Hard water in WA or SA ────────────────────────────────────────
  // Checked BEFORE Rule 1 because hard-water/appliance concerns also trigger
  // Rule 1, and Rule 2 is the more specific, correct answer for WA/SA users.
  else if (f.hardWaterWASA) {
    primaryId = "water-softener";
    primaryReason = `A water softener is the proper solution for ${answers.state}'s hard water — it removes the calcium and magnesium that cause scale buildup, protecting your hot water system, dishwasher, washing machine, kettle, and shower screens. Soap also lathers properly and skin/hair feel noticeably better. $2,000–$6,000 installed.`;
    secondaryId = "whole-house-filtration";
    secondaryReason = `A whole house filtration system with a scale-reduction (TAC/template-assisted crystallisation) cartridge is a cheaper alternative — it reduces scale buildup and removes chlorine, but it does NOT actually soften the water. A true softener is the proper fix for hard water.`;
    premiumId = "whole-house-combo";
    premiumReason = `The complete premium solution for ${answers.state}: water softener + whole house filtration + reverse osmosis combined — softened, chlorine-free water at every tap, plus ultra-pure drinking water at the kitchen. The most comprehensive setup possible. Typically $6,000–$12,000 installed.`;

    if (f.budgetUnder1k) {
      warnings.push(
        "Important: Water softeners and whole house systems start from around $2,000–$2,500 installed — above your current budget. Your hard-water concerns can't be properly solved within budget; you may want to save toward a softener or start with an under-sink filter for drinking water in the meantime."
      );
    }
  }

  // ── RULE 1: Whole-home intent ─────────────────────────────────────────────
  else if (f.wholeHomeTrigger) {
    if (f.budgetUnder1k) {
      // RULE 6: Budget under $1k — move under-sink to Best, whole-house to Premium
      primaryId = "under-sink-carbon";
      primaryReason = `Within your budget, an under-sink carbon and sediment filter is the best option — it effectively removes chlorine, sediment, and improves drinking water taste at your kitchen tap. Honest note: this only addresses drinking water, not your full whole-home concern (skin/hair, shower, appliances). $300–$1,200 installed.`;
      secondaryId = "tap-filter";
      secondaryReason = `A tap-mounted filter is the cheapest entry point — quick to install with no plumbing work, but with limited flow and shorter cartridge life. A reasonable starting point only.`;
      premiumId = "whole-house-filtration";
      premiumReason = `A whole house filtration system is the proper solution for your concerns — filtering chlorine and sediment from every tap, shower, and appliance throughout your home. $2,500–$5,000 installed.`;
      warnings.push(
        "Important: Whole house filtration systems start from around $2,500 installed — above your current budget. Your concerns (skin/hair, shower, appliances, whole-home coverage) are best addressed by a whole house system, so the under-sink option is a partial solution only."
      );
    } else {
      primaryId = "whole-house-filtration";
      primaryReason = `A whole house filtration system is the right choice for your concerns — it's the only solution that delivers filtered, chlorine-free water to every tap, shower, and appliance in your home. This is what genuinely solves skin/hair irritation, shower-water concerns, and protects your appliances. $2,500–$5,000 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `An under-sink carbon and sediment filter is a much cheaper alternative — but it only addresses drinking water at one tap. It will NOT solve skin/hair, shower, or appliance concerns. Suitable only if a whole house system is genuinely out of reach.`;
      premiumId = "whole-house-combo";
      premiumReason = `The complete premium solution: a whole house filtration system combined with a reverse osmosis drinking water unit — chlorine-free water everywhere, plus ultra-pure drinking water at the kitchen. The best of both worlds at $4,000–$8,000 installed.`;
    }
  }

  // ── RULE 3: RO-essential concerns ─────────────────────────────────────────
  else if (f.roTrigger) {
    primaryId = "reverse-osmosis";
    primaryReason = `A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, microplastics, and bacteria from drinking water. Installed under your kitchen sink. $800–$1,600 installed.`;
    secondaryId = "under-sink-carbon";
    secondaryReason = `An under-sink carbon and sediment filter is a more affordable alternative — but be aware: carbon filters reduce but do not eliminate fluoride, PFAS, heavy metals, or microplastics. RO is the proper solution for these contaminants.`;
    premiumId = "whole-house-combo";
    premiumReason = `For the complete solution, combine a whole house filtration system with reverse osmosis — chlorine-free water at every tap and shower, plus ultra-pure drinking water at the kitchen. $4,000–$8,000 installed together.`;

    if (f.budgetUnder1k) {
      warnings.push(
        "Note: A reverse osmosis system is genuinely needed for fluoride, PFAS, heavy metals, microplastics, or bacteria — and entry-level systems start around $800 installed, which fits your budget."
      );
    }
  }

  // ── RULE 4: Drinking water / taste / chlorine only ───────────────────────
  else if (f.onlyTasteChlorine) {
    primaryId = "under-sink-carbon";
    primaryReason = `An under-sink carbon and sediment filter is the ideal solution for your needs — effectively removing chlorine, sediment, and dramatically improving the taste of your drinking water. $300–$1,200 installed.`;
    secondaryId = "tap-filter";
    secondaryReason = `A tap-mounted filter is the cheaper alternative — it screws directly onto your existing tap with no plumbing work. Lower flow rate and shorter cartridge life than under-sink, but a reasonable budget option.`;
    premiumId = "reverse-osmosis";
    premiumReason = `For a significant step up in purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants in addition to chlorine and taste — the premium drinking water solution at $800–$1,600 installed.`;
  }

  // ── DEFAULT: fall back to Rule 4-style under-sink path ────────────────────
  else {
    primaryId = "under-sink-carbon";
    primaryReason = `Based on your answers, an under-sink carbon and sediment filter is a solid all-round choice — it removes chlorine, sediment, and significantly improves drinking water taste at your kitchen tap. $300–$1,200 installed.`;
    secondaryId = "tap-filter";
    secondaryReason = `A tap-mounted filter is a cheaper alternative — quick to install with no plumbing work. Lower flow and shorter cartridge life than an under-sink system, but a reasonable starting point.`;
    premiumId = "reverse-osmosis";
    premiumReason = `For a significant step up in water purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants — the premium drinking water solution at $800–$1,600 installed.`;
  }

  // ── State-specific warnings (VIC chlorine, WA hardness, SA hardness, QLD seasonal taste, NSW PFAS) ──
  warnings.push(...getStateWarnings(answers, f));

  // ── Look up recommendation objects ────────────────────────────────────────
  const getRec = (id: string): Recommendation => {
    const rec = recommendations.find((r) => r.id === id);
    if (!rec) throw new Error(`Recommendation not found for id: ${id}`);
    return rec;
  };

  const primary = getRec(primaryId);
  const summary = `Hi ${answers.firstName}, based on your home in ${answers.state || "Australia"}, your water source, and your concerns, we recommend starting with a **${primary.title}**. ${primaryReason}`;

  return {
    primary,
    secondary: getRec(secondaryId),
    premium: getRec(premiumId),
    primaryReason,
    secondaryReason,
    premiumReason,
    summary,
    warnings,
  };
}
