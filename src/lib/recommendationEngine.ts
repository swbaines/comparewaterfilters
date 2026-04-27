import { recommendations, type Recommendation } from "@/data/recommendations";

/**
 * Maintenance tolerance tiers — derived from the verbatim labels stored
 * in the quiz answers. Used to nudge the engine and to render the
 * "matches your maintenance budget" indicators on the results page.
 *
 *  - critical    → ≤ $200/yr preferred
 *  - important   → ≤ $400/yr preferred
 *  - manageable  → ≤ $700/yr is fine
 *  - none        → not a concern
 */
export type MaintenanceTier = "critical" | "important" | "manageable" | "none" | "unspecified";

export function getMaintenanceTier(value?: string | null): MaintenanceTier {
  if (!value) return "unspecified";
  if (value.startsWith("Critical")) return "critical";
  if (value.startsWith("Important")) return "important";
  if (value.startsWith("Manageable")) return "manageable";
  if (value.startsWith("Not a concern")) return "none";
  return "unspecified";
}

/** Upper bound (AUD/yr) the customer is comfortable spending on maintenance. */
function tierCeiling(tier: MaintenanceTier): number | null {
  switch (tier) {
    case "critical":   return 200;
    case "important":  return 400;
    case "manageable": return 700;
    case "none":       return null;
    default:           return null;
  }
}

export type MaintenanceFitLevel = "match" | "slightly-above" | "well-above" | "unspecified";

export interface MaintenanceFit {
  level: MaintenanceFitLevel;
  message: string;
}

/**
 * Given the customer's tolerance and a system's annual maintenance band,
 * returns a coloured indicator + plain-English message for the results UI.
 */
export function getMaintenanceFit(
  tolerance: string | undefined | null,
  annualMin: number,
  annualMax: number,
): MaintenanceFit {
  const tier = getMaintenanceTier(tolerance);
  const ceiling = tierCeiling(tier);
  if (ceiling === null) {
    return {
      level: "unspecified",
      message: "",
    };
  }
  if (annualMax <= ceiling) {
    return { level: "match", message: "Matches your maintenance budget" };
  }
  // "Slightly above" if the bottom of the band is still inside (or within
  // 25% of) the ceiling — otherwise we treat it as well above.
  if (annualMin <= ceiling * 1.25) {
    return { level: "slightly-above", message: "Slightly above your maintenance preference" };
  }
  return {
    level: "well-above",
    message: "Significantly above your maintenance preference — consider a service plan",
  };
}

export interface QuizAnswers {
  postcode: string;
  suburb: string;
  state: string;
  propertyType: string;
  ownershipStatus: string;
  householdSize: string;
  bathrooms: string;
  propertyAge?: string;
  waterSource: string;
  waterTestedRecently?: string;
  waterUsageType?: string;
  concerns: string[];
  coverage: string;
  budget: string;
  maintenanceTolerance?: string;
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
  | "rule-7-untreated-water-uv"
  | "rule-1b-whole-home-plus-ro"
  | "rule-8-old-pipes-heavy-metals"
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
  const { concerns, coverage, budget, ownershipStatus, propertyType, state, propertyAge } = answers;
  const has = (c: string) => concerns.includes(c);

  const isRenter = ownershipStatus === "Rent";
  const isApartment = propertyType === "Apartment";
  const canHaveWholeHome = !isRenter && !isApartment;

  const stateProfile = STATE_WATER_PROFILES[state] || null;
  const isWAorSA = state === "WA" || state === "SA";

  // Property age flags — older homes typically have aging galvanised/copper
  // pipework that can leach lead, copper or sediment into household water.
  const isVeryOldProperty = propertyAge === "Over 50 years";
  const isOldProperty = isVeryOldProperty || propertyAge === "20 to 50 years";
  const oldPipesHeavyMetals = isVeryOldProperty && has("heavy-metals");

  // RULE 1 trigger: whole-home intent
  const wholeHomeTrigger =
    coverage === "whole-house" ||
    coverage === "whole-house-plus" ||
    coverage === "showers-bathrooms" ||
    has("skin-hair") ||
    has("skin-shower") ||
    has("appliance") ||
    has("whole-home") ||
    has("hard-water") ||
    (has("chlorine") && (coverage === "whole-house" || coverage === "whole-house-plus"));

  // RULE 2 trigger: hard water in WA/SA
  // Fires when the user is in WA/SA AND flags either scale build-up / hard
  // water OR appliance & hot water system protection (both are caused by
  // hardness in those states, so a softener is the proper fix).
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

  // Replacement intent — these customers already have a system and are
  // upgrading. They've invested before, so we relax the strict budget filter
  // and surface modern best-practice equivalents.
  const isReplacement = has("replacement");
  const budgetUnder1k = budget === "under-1000" && !isReplacement;

  const maintenanceTier = getMaintenanceTier(answers.maintenanceTolerance);
  const lowMaintenanceCritical = maintenanceTier === "critical";

  // Showers & bathrooms coverage paired with skin/hair or chlorine concerns
  // demands a whole-house carbon solution. Standalone shower filters lose
  // effectiveness against chlorine within weeks at hot-water temperatures —
  // we never recommend them.
  const showersBathroomsCoverage = coverage === "showers-bathrooms";
  const skinOrChlorineConcern = has("skin-hair") || has("chlorine");
  const showersBathroomsSkinChlorine = showersBathroomsCoverage && skinOrChlorineConcern;

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
    isOldProperty,
    isVeryOldProperty,
    oldPipesHeavyMetals,
    isReplacement,
    showersBathroomsCoverage,
    showersBathroomsSkinChlorine,
    maintenanceTier,
    lowMaintenanceCritical,
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

// ─── Rule labels (single source of truth for the "why?" section) ─────────────
const RULE_LABELS: Record<FiredRule, string> = {
  "rule-1-whole-home": "Rule 1 — Whole-home intent",
  "rule-2-hard-water-wa-sa": "Rule 2 — Hard water in WA or SA",
  "rule-3-ro-essential": "Rule 3 — RO-essential contaminants (fluoride, PFAS, heavy metals, microplastics, bacteria)",
  "rule-4-drinking-only": "Rule 4 — Drinking water / taste / chlorine only",
  "rule-5-renter-apartment": "Rule 5 — Renter or apartment (no whole-home or softener)",
  "rule-6-budget-under-1k": "Rule 6 — Budget under $1,000 (whole-house moved to Premium)",
  "rule-7-untreated-water-uv": "Rule 7 — Untreated water source (rainwater, tank, or bore) — UV recommended",
  "rule-1b-whole-home-plus-ro": "Rule 1b — Whole-home intent + RO-essential contaminants (combo recommended)",
  "rule-8-old-pipes-heavy-metals": "Rule 8 — Older property (50+ yrs) + heavy-metals concern — RO required for lead/copper from aged pipes",
  "default": "Default — general drinking-water improvement",
};

// ─── Debug helper: explain why each rule did/didn't fire ────────────────────
export interface RuleEvaluation {
  rule: FiredRule;
  label: string;
  fired: boolean;
  reason: string;
  matchedConcerns: string[];
  checks: RuleCheck[];
}

export interface RuleCheck {
  /** Human label of the condition (e.g. "Coverage = whole-home"). */
  label: string;
  /** What the rule needs (e.g. "whole-house OR whole-house-plus"). */
  expected: string;
  /** What the user selected/answered. */
  actual: string;
  /** Did this individual check pass? */
  pass: boolean;
}

export function explainRuleEvaluations(
  answers: QuizAnswers,
  dominantRule: FiredRule,
): RuleEvaluation[] {
  const f = getFlags(answers);
  const matched = (ids: string[]) => answers.concerns.filter((c) => ids.includes(c));
  const untreatedSource =
    answers.waterSource === "rainwater" ||
    answers.waterSource === "tank-water" ||
    answers.waterSource === "bore-water";

  const concernsList = answers.concerns.length ? answers.concerns.join(", ") : "(none)";
  const anyOf = (ids: string[]) => ids.some((id) => answers.concerns.includes(id));
  const matchedStr = (ids: string[]) => {
    const m = matched(ids);
    return m.length ? m.join(", ") : "none selected";
  };

  const drinkingCoverage =
    answers.coverage === "drinking-water" ||
    answers.coverage === "kitchen" ||
    answers.coverage === "one-tap";

  const evals: RuleEvaluation[] = [
    {
      rule: "rule-7-untreated-water-uv",
      label: RULE_LABELS["rule-7-untreated-water-uv"],
      fired: untreatedSource,
      matchedConcerns: [],
      reason: untreatedSource
        ? `Water source is "${answers.waterSource}" (untreated) — UV path triggered.`
        : `Water source is "${answers.waterSource || "town"}" — not rainwater/tank/bore.`,
      checks: [
        {
          label: "Water source",
          expected: "rainwater OR tank-water OR bore-water",
          actual: answers.waterSource || "(not set)",
          pass: untreatedSource,
        },
      ],
    },
    {
      rule: "rule-5-renter-apartment",
      label: RULE_LABELS["rule-5-renter-apartment"],
      fired: !untreatedSource && !f.canHaveWholeHome,
      matchedConcerns: [],
      reason: !f.canHaveWholeHome
        ? `Ownership="${answers.ownershipStatus}", property="${answers.propertyType}" — whole-home/softener not allowed.`
        : `Owner-occupier in a house — whole-home options remain available.`,
      checks: [
        {
          label: "Ownership status",
          expected: "Rent — OR — Property type = Apartment",
          actual: `${answers.ownershipStatus || "(not set)"} / ${answers.propertyType || "(not set)"}`,
          pass: !f.canHaveWholeHome,
        },
      ],
    },
    {
      rule: "rule-2-hard-water-wa-sa",
      label: RULE_LABELS["rule-2-hard-water-wa-sa"],
      fired: !untreatedSource && f.canHaveWholeHome && f.hardWaterWASA,
      matchedConcerns: matched(["hard-water", "appliance"]),
      reason: f.isWAorSA
        ? f.hardWaterWASA
          ? `State=${answers.state} AND hard-water/appliance concern present.`
          : `State=${answers.state} but no hard-water or appliance concern selected.`
        : `State=${answers.state || "—"} is not WA or SA.`,
      checks: [
        {
          label: "State",
          expected: "WA OR SA",
          actual: answers.state || "(not set)",
          pass: f.isWAorSA,
        },
        {
          label: "Concerns",
          expected: "hard-water OR appliance",
          actual: matchedStr(["hard-water", "appliance"]),
          pass: anyOf(["hard-water", "appliance"]),
        },
      ],
    },
    {
      rule: "rule-1b-whole-home-plus-ro",
      label: RULE_LABELS["rule-1b-whole-home-plus-ro"],
      fired:
        !untreatedSource &&
        f.canHaveWholeHome &&
        !f.hardWaterWASA &&
        f.wholeHomeTrigger &&
        f.roTrigger,
      matchedConcerns: matched([
        "skin-hair", "skin-shower", "appliance", "whole-home", "hard-water", "chlorine",
        "fluoride", "pfas", "heavy-metals", "microplastics", "bacteria",
      ]),
      reason: `wholeHomeTrigger=${f.wholeHomeTrigger} (coverage="${answers.coverage}"), roTrigger=${f.roTrigger}, budgetUnder1k=${f.budgetUnder1k}.`,
      checks: [
        {
          label: "Coverage signals whole-home intent",
          expected: "coverage = whole-house/whole-house-plus — OR — concern in (skin-hair, skin-shower, appliance, whole-home, hard-water)",
          actual: `coverage="${answers.coverage || "(not set)"}", matching concerns: ${matchedStr(["skin-hair","skin-shower","appliance","whole-home","hard-water"])}`,
          pass: f.wholeHomeTrigger,
        },
        {
          label: "RO-essential concerns selected",
          expected: "fluoride OR pfas OR heavy-metals OR microplastics OR bacteria",
          actual: matchedStr(["fluoride","pfas","heavy-metals","microplastics","bacteria"]),
          pass: f.roTrigger,
        },
        {
          label: "Whole-home installable",
          expected: "Owner-occupier AND not Apartment",
          actual: `${answers.ownershipStatus || "(not set)"} / ${answers.propertyType || "(not set)"}`,
          pass: f.canHaveWholeHome,
        },
        {
          label: "Not blocked by higher-priority rules",
          expected: "water source not untreated AND not WA/SA hard-water case",
          actual: `source="${answers.waterSource || "(not set)"}", state=${answers.state || "—"}`,
          pass: !untreatedSource && !f.hardWaterWASA,
        },
      ],
    },
    {
      rule: "rule-1-whole-home",
      label: RULE_LABELS["rule-1-whole-home"],
      fired:
        !untreatedSource &&
        f.canHaveWholeHome &&
        !f.hardWaterWASA &&
        f.wholeHomeTrigger &&
        !f.roTrigger,
      matchedConcerns: matched(["skin-hair", "skin-shower", "appliance", "whole-home", "hard-water", "chlorine"]),
      reason: f.wholeHomeTrigger
        ? f.roTrigger
          ? `Whole-home intent present, but RO-essential concerns also present — Rule 1b takes priority.`
          : `Whole-home intent present and no RO-essential concerns — Rule 1 path.`
        : `No whole-home intent (coverage="${answers.coverage}", no skin/appliance/whole-home concerns).`,
      checks: [
        {
          label: "Whole-home intent",
          expected: "coverage = whole-house/whole-house-plus — OR — concern in (skin-hair, skin-shower, appliance, whole-home, hard-water)",
          actual: `coverage="${answers.coverage || "(not set)"}", matching concerns: ${matchedStr(["skin-hair","skin-shower","appliance","whole-home","hard-water"])}`,
          pass: f.wholeHomeTrigger,
        },
        {
          label: "No RO-essential concerns",
          expected: "none of (fluoride, pfas, heavy-metals, microplastics, bacteria)",
          actual: matchedStr(["fluoride","pfas","heavy-metals","microplastics","bacteria"]),
          pass: !f.roTrigger,
        },
      ],
    },
    {
      rule: "rule-3-ro-essential",
      label: RULE_LABELS["rule-3-ro-essential"],
      fired:
        !untreatedSource &&
        f.canHaveWholeHome &&
        !f.hardWaterWASA &&
        !f.wholeHomeTrigger &&
        f.roTrigger,
      matchedConcerns: matched(["fluoride", "pfas", "heavy-metals", "microplastics", "bacteria"]),
      reason: f.roTrigger
        ? f.wholeHomeTrigger
          ? `RO-essential concerns present, but whole-home intent also present — Rule 1b takes priority.`
          : `RO-essential concerns present without whole-home intent — Rule 3 path.`
        : `No RO-essential concerns (fluoride, PFAS, heavy metals, microplastics, bacteria).`,
      checks: [
        {
          label: "RO-essential concerns",
          expected: "fluoride OR pfas OR heavy-metals OR microplastics OR bacteria",
          actual: matchedStr(["fluoride","pfas","heavy-metals","microplastics","bacteria"]),
          pass: f.roTrigger,
        },
        {
          label: "No whole-home intent (else Rule 1b wins)",
          expected: "no whole-home coverage AND no skin/appliance/whole-home concerns",
          actual: `coverage="${answers.coverage || "(not set)"}", matching concerns: ${matchedStr(["skin-hair","skin-shower","appliance","whole-home","hard-water"])}`,
          pass: !f.wholeHomeTrigger,
        },
      ],
    },
    {
      rule: "rule-4-drinking-only",
      label: RULE_LABELS["rule-4-drinking-only"],
      fired:
        !untreatedSource &&
        f.canHaveWholeHome &&
        !f.hardWaterWASA &&
        !f.wholeHomeTrigger &&
        !f.roTrigger &&
        f.onlyTasteChlorine,
      matchedConcerns: matched(["taste", "chlorine", "drinking-quality"]),
      reason: f.onlyTasteChlorine
        ? `Only taste/chlorine/drinking-quality concerns + drinking-only coverage.`
        : `Other concerns or coverage broader than drinking-only.`,
      checks: [
        {
          label: "Coverage = drinking-only",
          expected: "drinking-water OR kitchen OR one-tap",
          actual: answers.coverage || "(not set)",
          pass: drinkingCoverage,
        },
        {
          label: "Concerns limited to taste/chlorine/drinking-quality",
          expected: "every concern in (taste, chlorine, drinking-quality)",
          actual: concernsList,
          pass:
            answers.concerns.length > 0 &&
            answers.concerns.every((c) => ["taste", "chlorine", "drinking-quality"].includes(c)),
        },
      ],
    },
    {
      rule: "rule-6-budget-under-1k",
      label: RULE_LABELS["rule-6-budget-under-1k"],
      fired: f.budgetUnder1k,
      matchedConcerns: [],
      reason: f.budgetUnder1k
        ? `Budget="under-1000" — modifies the chosen rule (moves whole-house/combo to Premium).`
        : `Budget="${answers.budget}" — no budget modifier applied.`,
      checks: [
        {
          label: "Budget",
          expected: "under-1000",
          actual: answers.budget || "(not set)",
          pass: f.budgetUnder1k,
        },
      ],
    },
    {
      rule: "rule-8-old-pipes-heavy-metals",
      label: RULE_LABELS["rule-8-old-pipes-heavy-metals"],
      fired: f.oldPipesHeavyMetals,
      matchedConcerns: matched(["heavy-metals"]),
      reason: f.oldPipesHeavyMetals
        ? `Property age="Over 50 years" AND heavy-metals concern selected — RO forced into recommendation.`
        : `propertyAge="${answers.propertyAge || "(not set)"}", heavy-metals concern=${anyOf(["heavy-metals"]) ? "yes" : "no"}.`,
      checks: [
        {
          label: "Property age",
          expected: "Over 50 years",
          actual: answers.propertyAge || "(not set)",
          pass: f.isVeryOldProperty,
        },
        {
          label: "Concerns",
          expected: "heavy-metals",
          actual: matchedStr(["heavy-metals"]),
          pass: anyOf(["heavy-metals"]),
        },
      ],
    },
  ];

  // Mark the dominant rule explicitly so the UI can highlight it.
  return evals.map((e) => ({
    ...e,
    fired: e.rule === dominantRule ? true : e.fired,
  }));
}

// ─── Main recommendation function ───────────────────────────────────────────
export function generateRecommendations(answers: QuizAnswers): RecommendationResult {
  const f = getFlags(answers);
  const warnings: string[] = [];
  const appliedRules: { rule: FiredRule; label: string }[] = [];
  const pushRule = (r: FiredRule) => appliedRules.push({ rule: r, label: RULE_LABELS[r] });

  // Replacement / upgrade intent — surface a clear note so the user knows
  // we're focused on modern best-practice systems rather than budget-first.
  if (f.isReplacement) {
    warnings.push(
      "You're likely upgrading from an existing system — our recommendations focus on current best-practice systems with modern filtration and warranties.",
    );
  }

  let primaryId = "under-sink-carbon";
  let secondaryId = "under-sink-carbon";
  let premiumId = "reverse-osmosis";
  let primaryReason = "";
  let secondaryReason = "";
  let premiumReason = "";

  // ── RULE 7: Untreated water source (rainwater / tank / bore) ──────────────
  // UV disinfection is the critical microbiological-safety step for any
  // household not on treated town water. We surface UV here as the Premium
  // tier and pair it with sediment + carbon pre-filtration.
  const untreatedSource =
    answers.waterSource === "rainwater" ||
    answers.waterSource === "tank-water" ||
    answers.waterSource === "bore-water";

  if (untreatedSource) {
    pushRule("rule-7-untreated-water-uv");
    const sourceLabel =
      answers.waterSource === "bore-water"
        ? "bore water"
        : answers.waterSource === "tank-water"
          ? "tank water"
          : "rainwater";

    const usage = answers.waterUsageType || "";
    const notTested = answers.waterTestedRecently === "No, not tested";
    const isGardenOnly = usage === "Garden and outdoor use only";
    const isShowerOnly = usage === "Showering and bathing only";
    const includesDrinking =
      usage === "Drinking and cooking only" ||
      usage === "Drinking, cooking, showering and bathing";
    const includesShower =
      usage === "Showering and bathing only" ||
      usage === "Drinking, cooking, showering and bathing";

    if (isGardenOnly) {
      // Garden / outdoor only — basic sediment filter is sufficient
      primaryId = "whole-house-filtration";
      primaryReason = `Because the ${sourceLabel} is used for garden and outdoor use only, a basic sediment filter is the right starting point — it removes grit, leaf matter, and protects irrigation lines and outdoor taps. Full whole-house filtration and UV disinfection are not required for non-potable outdoor use. Sediment-only setups typically install from $300–$800.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `Not needed for outdoor-only use, but listed as a future option if you ever decide to bring this water indoors for drinking or showering.`;
      premiumId = "whole-house-filtration";
      premiumReason = `A full whole-house sediment + carbon filter is overkill for garden-only use, but worth considering if your usage may expand to indoor taps.`;
      warnings.push(
        `Because the ${sourceLabel} is used for outdoor / garden use only, a basic sediment filter is sufficient — UV disinfection is not required.`,
      );
    } else if (isShowerOnly) {
      // Showering/bathing only — whole house filter with UV
      primaryId = "whole-house-combo";
      primaryReason = `Because the ${sourceLabel} is used for showering and bathing, a whole house filtration system paired with UV disinfection is the right solution — it removes sediment, organic matter, and kills bacteria, viruses, and protozoa before water reaches your shower and bathroom taps. $4,000–$6,000 installed.`;
      secondaryId = "whole-house-filtration";
      secondaryReason = `A whole house filtration system on its own removes sediment and improves water quality — but it does NOT kill bacteria or viruses. UV disinfection is the proper add-on for shower/bath use of ${sourceLabel}.`;
      premiumId = "uv-system";
      premiumReason = `UV disinfection is essential for any non-mains water used for showering or bathing — it kills 99.99% of bacteria, viruses, and pathogens. Best paired with whole-house pre-filtration. $800–$2,500 installed.`;
      warnings.push(
        `Important: ${sourceLabel.charAt(0).toUpperCase() + sourceLabel.slice(1)} used for showering and bathing should be paired with whole-house filtration AND UV disinfection — bathing exposes skin and lungs (steam) to any pathogens present.`,
      );
    } else {
      // Default untreated path — drinking/cooking included, or unspecified
      primaryId = "whole-house-filtration";
      primaryReason = `Because you're on ${sourceLabel} (not treated town water), a whole house filtration system is the right starting point — it removes sediment, organic matter, and provides essential pre-filtration before water reaches your taps and any UV unit. $3,000–$5,000 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `An under-sink carbon and sediment filter is a much cheaper drinking-water option, but it does NOT kill bacteria, viruses, or other microorganisms — which is the critical risk on ${sourceLabel}. Suitable only as a temporary or supplementary measure.`;
      premiumId = "uv-system";
      premiumReason = `A UV disinfection system is essential for ${sourceLabel} — it kills 99.99% of bacteria, viruses, and pathogens that filters cannot remove. Best installed downstream of a whole house filter for combined sediment, taste, and microbiological protection. $800–$2,500 installed.`;

      warnings.push(
        `Important: ${sourceLabel.charAt(0).toUpperCase() + sourceLabel.slice(1)} is untreated and can carry bacteria, viruses, and protozoa. UV disinfection (paired with adequate pre-filtration) is the standard safety solution — please don't skip this step.`,
      );

      if (includesDrinking && notTested) {
        warnings.push(
          `Critical: Your ${sourceLabel} is used for drinking/cooking and has NOT been tested in the last 2 years. UV disinfection is essential — and we strongly recommend a water test before relying on this supply for drinking. Australian guidelines recommend annual testing for non-mains potable water.`,
        );
      }
      if (includesShower) {
        warnings.push(
          `Because this ${sourceLabel} is also used for showering and bathing, a whole-house + UV setup (rather than under-sink only) is the appropriate level of protection.`,
        );
      }
    }

    if (f.budgetUnder1k) {
      pushRule("rule-6-budget-under-1k");
      warnings.push(
        "A complete UV + whole-house setup typically starts around $3,000 installed — above your current budget. Prioritise UV first for safety; whole-house filtration can be added later.",
      );
    }
  }

  // ── RULE 5: Renters / apartments ──────────────────────────────────────────
  // Never recommend whole-house or water softener as Best or Premium.
  // Default to Rule 3 (RO-essential) or Rule 4 (taste/chlorine).
  else if (!f.canHaveWholeHome) {
    pushRule("rule-5-renter-apartment");
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
      pushRule("rule-3-ro-essential");
      primaryId = "reverse-osmosis";
      primaryReason = `A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, microplastics, and bacteria from drinking water. It installs neatly under your kitchen sink. $800–$1,600 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `An under-sink carbon and sediment filter is a more affordable alternative — but be aware: carbon filters reduce but do not eliminate fluoride, PFAS, or heavy metals. RO is the proper solution.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For the ultimate drinking water experience, a premium reverse osmosis system with alkaline remineralisation adds beneficial minerals back after filtration — delivering purified, mineral-balanced water from your kitchen tap.`;
    } else {
      // Rule 4 path (taste/chlorine/drinking only)
      pushRule("rule-4-drinking-only");
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
    pushRule("rule-2-hard-water-wa-sa");
    primaryId = "water-softener";
    primaryReason = `A water softener is the proper solution for ${answers.state}'s hard water — it removes the calcium and magnesium that cause scale buildup, protecting your hot water system, dishwasher, washing machine, kettle, and shower screens. Soap also lathers properly and skin/hair feel noticeably better. $2,000–$6,000 installed.`;
    secondaryId = "whole-house-filtration";
    secondaryReason = `A whole house filtration system with a scale-reduction (TAC/template-assisted crystallisation) cartridge is a cheaper alternative — it reduces scale buildup and removes chlorine, but it does NOT actually soften the water. A true softener is the proper fix for hard water.`;
    premiumId = "whole-house-combo";
    premiumReason = `The complete premium solution for ${answers.state}: water softener + whole house filtration + reverse osmosis combined — softened, chlorine-free water at every tap, plus ultra-pure drinking water at the kitchen. The most comprehensive setup possible. Typically $6,000–$12,000 installed.`;

    if (f.budgetUnder1k) {
      pushRule("rule-6-budget-under-1k");
      warnings.push(
        "Important: Water softeners and whole house systems start from around $2,000–$2,500 installed — above your current budget. Your hard-water concerns can't be properly solved within budget; you may want to save toward a softener or start with an under-sink filter for drinking water in the meantime."
      );
    }
  }

  // ── RULE 1: Whole-home intent ─────────────────────────────────────────────
  // ── RULE 1b: Whole-home intent + RO-essential contaminants ────────────────
  // When the user wants whole-home coverage AND has fluoride / PFAS / heavy
  // metals / microplastics / bacteria concerns, neither a whole-house filter
  // alone nor an RO unit alone is the correct answer — they need BOTH.
  // The combo becomes the primary recommendation.
  // Note: we still apply Rule 1b for budget-under-1k users — their concerns
  // genuinely require both layers of treatment, and we surface the combo as
  // Premium with an honest budget warning rather than hiding it entirely.
  else if (f.wholeHomeTrigger && f.roTrigger && !f.budgetUnder1k) {
    pushRule("rule-1b-whole-home-plus-ro");
    primaryId = "whole-house-combo";
    primaryReason = `Your concerns need both layers of treatment: a whole house filtration system to remove chlorine and protect every tap, shower, and appliance, PLUS a reverse osmosis unit at the kitchen for fluoride, PFAS, heavy metals, microplastics, and bacteria. RO is the only household technology that effectively removes those contaminants — and it only treats one tap, so pairing it with whole-house coverage is the proper solution. Entry-level combos start from around $4,000 installed together — well within most household budgets.`;
    secondaryId = "whole-house-filtration";
    secondaryReason = `A whole house filtration system on its own delivers chlorine-free water everywhere — but it does NOT remove fluoride, PFAS, heavy metals, or microplastics. Suitable only if RO at the kitchen tap is genuinely out of reach for now (it can be added later).`;
    premiumId = "whole-house-combo";
    premiumReason = `The premium build of the same solution: a higher-spec whole house filtration system paired with a reverse osmosis unit featuring alkaline remineralisation — chlorine-free water at every tap and shower, plus purified, mineral-balanced drinking water at the kitchen. Typically $5,000–$6,000 installed together.`;
  }

  // ── RULE 1b (budget): under-1k user but still has whole-home + RO needs ─────
  // Honest budget-aware path: Best is the affordable RO (covers the most
  // critical contaminants), Good is under-sink carbon, Premium remains the
  // whole-house+RO combo so they can plan for the proper solution.
  else if (f.wholeHomeTrigger && f.roTrigger && f.budgetUnder1k) {
    pushRule("rule-1b-whole-home-plus-ro");
    pushRule("rule-6-budget-under-1k");
    primaryId = "reverse-osmosis";
    primaryReason = `Within your budget, an entry-level reverse osmosis system at the kitchen tap is the most important step — it's the only household technology that removes fluoride, PFAS, heavy metals, microplastics, and bacteria. Around $800 installed. Whole-house coverage can be added later.`;
    secondaryId = "under-sink-carbon";
    secondaryReason = `An under-sink carbon and sediment filter is cheaper, but it does NOT remove fluoride, PFAS, heavy metals, or microplastics. Suitable only as a short-term measure given your concerns.`;
    premiumId = "whole-house-combo";
    premiumReason = `The proper long-term solution for your concerns: a whole house filtration system combined with a reverse osmosis unit — chlorine-free water at every tap and shower, plus ultra-pure drinking water at the kitchen. $4,000–$6,000 installed together.`;
    warnings.push(
      "Important: Your concerns genuinely call for both whole-house filtration and reverse osmosis. The combo is shown as Premium so you can plan toward it — within your current budget, prioritise the RO unit first.",
    );
  }

  else if (f.wholeHomeTrigger) {
    pushRule("rule-1-whole-home");
    // Showers & bathrooms + skin/hair or chlorine — whole-house carbon is
    // the only effective long-term solution. Never surface standalone
    // shower filters: they lose chlorine knockdown within 4–8 weeks at
    // hot-water temperatures.
    if (f.showersBathroomsSkinChlorine) {
      primaryId = "whole-house-filtration";
      primaryReason = `For genuinely filtered shower and bath water, a whole house carbon filtration system installed at your home's water entry point is the only effective long-term solution — it delivers properly filtered, chlorine-free water to every shower, bath, and tap. This is what actually addresses skin, hair and chlorine concerns in the bathroom. $3,000–$5,000 installed.`;
      secondaryId = "whole-house-filtration";
      secondaryReason = `A basic-specification whole house carbon filter is the more affordable version of the same solution — still effective at removing chlorine and improving shower/bath water, just with a smaller capacity (more frequent cartridge changes for larger households). $2,500–$3,500 installed. We do NOT recommend standalone shower filters: they typically lose chlorine performance within 4–8 weeks at hot-water temperatures.`;
      premiumId = "whole-house-combo";
      premiumReason = `The complete premium build: whole house carbon filtration for every shower, bath and tap, paired with a reverse osmosis unit at the kitchen for ultra-pure drinking water. The proper long-term answer for filtered bathroom water plus drinking-water purity. $4,000–$6,000 installed together.`;
      // Done — skip the generic whole-home branches below.
    } else if (f.budgetUnder1k) {
      // RULE 6: Budget under $1k — move under-sink to Best, whole-house to Premium
      pushRule("rule-6-budget-under-1k");
      primaryId = "under-sink-carbon";
      primaryReason = `Within your budget, an under-sink carbon and sediment filter is the best option — it effectively removes chlorine, sediment, and improves drinking water taste at your kitchen tap. Honest note: this only addresses drinking water, not your full whole-home concern (skin/hair, shower, appliances). $300–$1,200 installed.`;
      secondaryId = "tap-filter";
      secondaryReason = `A tap-mounted filter is the cheapest entry point — quick to install with no plumbing work, but with limited flow and shorter cartridge life. A reasonable starting point only.`;
      premiumId = "whole-house-filtration";
      premiumReason = `A whole house filtration system is the proper solution for your concerns — filtering chlorine and sediment from every tap, shower, and appliance throughout your home. $3,000–$5,000 installed.`;
      warnings.push(
        "Important: Whole house filtration systems start from around $3,000 installed — above your current budget. Your concerns (skin/hair, shower, appliances, whole-home coverage) are best addressed by a whole system, so the under-sink option is a partial solution only."
      );
    } else {
      primaryId = "whole-house-filtration";
      primaryReason = `A whole house filtration system is the right choice for your concerns — it's the only solution that delivers filtered, chlorine-free water to every tap, shower, and appliance in your home. This is what genuinely solves skin/hair irritation, shower-water concerns, and protects your appliances. $3,000–$5,000 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `An under-sink carbon and sediment filter is a much cheaper alternative — but it only addresses drinking water at one tap. It will NOT solve skin/hair, shower, or appliance concerns. Suitable only if a whole house system is genuinely out of reach.`;
      premiumId = "whole-house-combo";
      premiumReason = `The complete premium solution: a whole house filtration system combined with a reverse osmosis drinking water unit — chlorine-free water everywhere, plus ultra-pure drinking water at the kitchen. The best of both worlds at $4,000–$6,000 installed.`;
    }
  }

  // ── RULE 3: RO-essential concerns ─────────────────────────────────────────
  else if (f.roTrigger) {
    pushRule("rule-3-ro-essential");
    primaryId = "reverse-osmosis";
    primaryReason = `A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, microplastics, and bacteria from drinking water. Installed under your kitchen sink. $800–$1,600 installed.`;
    secondaryId = "under-sink-carbon";
    secondaryReason = `An under-sink carbon and sediment filter is a more affordable alternative — but be aware: carbon filters reduce but do not eliminate fluoride, PFAS, heavy metals, or microplastics. RO is the proper solution for these contaminants.`;
    premiumId = "whole-house-combo";
    premiumReason = `For the complete solution, combine a whole house filtration system with reverse osmosis — chlorine-free water at every tap and shower, plus ultra-pure drinking water at the kitchen. $4,000–$6,000 installed together.`;

    if (f.budgetUnder1k) {
      warnings.push(
        "Note: A reverse osmosis system is genuinely needed for fluoride, PFAS, heavy metals, microplastics, or bacteria — and entry-level systems start around $800 installed, which fits your budget."
      );
    }
  }

  // ── RULE 4: Drinking water / taste / chlorine only ───────────────────────
  else if (f.onlyTasteChlorine) {
    pushRule("rule-4-drinking-only");
    primaryId = "under-sink-carbon";
    primaryReason = `An under-sink carbon and sediment filter is the ideal solution for your needs — effectively removing chlorine, sediment, and dramatically improving the taste of your drinking water. $300–$1,200 installed.`;
    secondaryId = "tap-filter";
    secondaryReason = `A tap-mounted filter is the cheaper alternative — it screws directly onto your existing tap with no plumbing work. Lower flow rate and shorter cartridge life than under-sink, but a reasonable budget option.`;
    premiumId = "reverse-osmosis";
    premiumReason = `For a significant step up in purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants in addition to chlorine and taste — the premium drinking water solution at $800–$1,600 installed.`;
  }

  // ── DEFAULT: fall back to Rule 4-style under-sink path ────────────────────
  else {
    pushRule("default");
    primaryId = "under-sink-carbon";
    primaryReason = `Based on your answers, an under-sink carbon and sediment filter is a solid all-round choice — it removes chlorine, sediment, and significantly improves drinking water taste at your kitchen tap. $300–$1,200 installed.`;
    secondaryId = "tap-filter";
    secondaryReason = `A tap-mounted filter is a cheaper alternative — quick to install with no plumbing work. Lower flow and shorter cartridge life than an under-sink system, but a reasonable starting point.`;
    premiumId = "reverse-osmosis";
    premiumReason = `For a significant step up in water purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants — the premium drinking water solution at $800–$1,600 installed.`;
  }

  // ── State-specific warnings (VIC chlorine, WA hardness, SA hardness, QLD seasonal taste, NSW PFAS) ──
  warnings.push(...getStateWarnings(answers, f));

  // ── RULE 8: Old property (50+ yrs) + heavy-metals concern ─────────────────
  // Aged galvanised steel and pre-1980s copper plumbing can leach lead,
  // copper, zinc and iron into household water — particularly first-draw
  // water that has sat in the pipes overnight. Reverse osmosis is the only
  // household technology that reliably removes dissolved heavy metals at
  // the kitchen tap, so we force RO into the recommendation here.
  if (f.oldPipesHeavyMetals) {
    pushRule("rule-8-old-pipes-heavy-metals");
    const ageNote =
      "Important: Properties over 50 years old often have aging galvanised or copper plumbing that can leach lead, copper or other heavy metals into household water — especially first-draw water in the morning. A reverse osmosis system at the kitchen tap is the proper, evidence-based fix and is included in your recommendation.";
    warnings.push(ageNote);

    // Guarantee RO appears somewhere in the result. Order of preference:
    // 1. If we can install whole-home → primary should be the whole-house+RO combo.
    // 2. Otherwise → primary should be reverse-osmosis at the kitchen tap.
    const roPresent =
      [primaryId, secondaryId, premiumId].includes("reverse-osmosis") ||
      [primaryId, secondaryId, premiumId].includes("whole-house-combo");

    if (!roPresent) {
      if (f.canHaveWholeHome && !f.budgetUnder1k) {
        primaryId = "whole-house-combo";
        primaryReason = `Because your property is over 50 years old AND you've flagged heavy metals, the right answer is a whole house filtration system paired with reverse osmosis at the kitchen tap. RO is the only household technology that reliably removes lead, copper and other heavy metals that can leach from aged plumbing — and pairing it with whole-house coverage handles chlorine and sediment everywhere else. $4,000–$6,000 installed together.`;
        secondaryId = "reverse-osmosis";
        secondaryReason = `If a full combo isn't possible right now, a reverse osmosis system on its own at the kitchen tap is the most important step — it directly addresses heavy metals from aged pipes for drinking and cooking water. $800–$1,600 installed.`;
        // keep premiumId as-is (likely already combo)
        if (premiumId !== "whole-house-combo") premiumId = "whole-house-combo";
        premiumReason = `The premium build: a higher-spec whole house filtration system paired with a reverse osmosis unit featuring alkaline remineralisation — chlorine-free water at every tap and shower, plus purified, mineral-balanced drinking water at the kitchen, with full protection against heavy metals from aged plumbing.`;
      } else {
        primaryId = "reverse-osmosis";
        primaryReason = `Because your property is over 50 years old AND you've flagged heavy metals, a reverse osmosis system at the kitchen tap is essential — it's the only household technology that reliably removes lead, copper and other heavy metals that can leach from aged galvanised or copper plumbing. $800–$1,600 installed.`;
      }
    }
  } else if (f.isOldProperty) {
    // Lighter-touch nudge for 20–50 year homes: scale and chlorine-by-products
    // can degrade older plumbing faster, so a whole-house carbon + scale-
    // reduction setup pays off. We only add an informational warning — we
    // don't change the recommendation.
    warnings.push(
      "Your property is in the 20–50 year age range — older plumbing benefits from reduced chlorine and scale exposure. A whole house filtration system with a scale-reduction (TAC) cartridge can extend the life of your hot water system, dishwasher and washing machine.",
    );
  }

  // ── Determine triggering concerns based on the dominant rule ──────────────
  // The dominant rule is the LAST one pushed (most specific path taken).
  const dominantRule: FiredRule = appliedRules[appliedRules.length - 1]?.rule ?? "default";

  const RULE_TO_TRIGGERING_CONCERNS: Record<FiredRule, string[]> = {
    "rule-1-whole-home": ["skin-hair", "skin-shower", "appliance", "whole-home", "hard-water", "chlorine"],
    "rule-1b-whole-home-plus-ro": ["skin-hair", "skin-shower", "appliance", "whole-home", "hard-water", "chlorine", "fluoride", "pfas", "heavy-metals", "microplastics", "bacteria"],
    "rule-2-hard-water-wa-sa": ["hard-water", "appliance"],
    "rule-3-ro-essential": ["fluoride", "pfas", "heavy-metals", "microplastics", "bacteria"],
    "rule-4-drinking-only": ["taste", "chlorine", "drinking-quality"],
    "rule-5-renter-apartment": [], // not concern-driven — driven by ownership/property type
    "rule-6-budget-under-1k": [], // budget modifier, concerns inherited from base rule
    "rule-7-untreated-water-uv": ["bacteria"], // driven by water source, not concerns; bacteria is the closest match
    "rule-8-old-pipes-heavy-metals": ["heavy-metals"],
    "default": [],
  };

  // Triggering concerns = intersection of the user's concerns with the rule's trigger set.
  // For Rule 5 (renter/apartment) we surface the concerns that drove the underlying base rule.
  let triggeringSet = RULE_TO_TRIGGERING_CONCERNS[dominantRule];
  if (dominantRule === "rule-5-renter-apartment" || dominantRule === "rule-6-budget-under-1k") {
    triggeringSet = [
      ...RULE_TO_TRIGGERING_CONCERNS["rule-3-ro-essential"],
      ...RULE_TO_TRIGGERING_CONCERNS["rule-4-drinking-only"],
      ...RULE_TO_TRIGGERING_CONCERNS["rule-1-whole-home"],
    ];
  }
  const triggeringConcerns = answers.concerns.filter((c) => triggeringSet.includes(c));

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
    explanation: {
      rule: dominantRule,
      ruleLabel: RULE_LABELS[dominantRule],
      appliedRules,
      triggeringConcerns,
      // The Good (secondary) tier reason already contains the honest trade-off
      // wording for every branch — surface it verbatim so we never drift.
      goodTierTradeoff: secondaryReason,
    },
  };
}
