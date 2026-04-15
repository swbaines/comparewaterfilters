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

export interface RecommendationResult {
  primary: Recommendation;
  secondary: Recommendation;
  premium: Recommendation;
  primaryReason: string;
  secondaryReason: string;
  premiumReason: string;
  summary: string;
  warnings: string[];
}

// ─── Real Australian water quality data (sourced from state water authorities) ─
// VIC (Melbourne Water / GWW / South East Water):
//   Hardness: 8–44 mg/L — softest capital city water in Australia
//   Chlorine: up to 1.5 mg/L — higher than most, noticeable taste/smell/skin irritation
//   Fluoride: ~0.7–1.0 mg/L (added by law)
//   PFAS: monitored, within guidelines
//
// NSW (Sydney Water):
//   Hardness: 30–58 mg/L — soft water, no softener needed
//   Chlorine + chloramine: both used, noticeable taste in some areas
//   Fluoride: ~1.0 mg/L
//   PFAS: elevated detected at Blue Mountains (Cascade WFP) 2024, now within 2025 guidelines
//
// WA (Water Corporation):
//   Hardness: 28–228 mg/L — HUGE variation by suburb
//   Northern suburbs (Wanneroo, Yanchep, Two Rocks): 180–228 mg/L — extremely hard
//   Southern/coastal suburbs: 60–120 mg/L — moderately hard
//   Chlorine: 0.4–1.0 mg/L — added to ALL schemes, higher due to long pipelines + heat
//   Fluoride: ~0.75 mg/L, 92% of WA fluoridated
//
// QLD (Seqwater/Brisbane):
//   Hardness: 114.8 mg/L Brisbane (moderately hard), Gold Coast 33.9 mg/L (soft)
//   Chlorine: 1.10 mg/L average Brisbane
//   Fluoride: 0.85 mg/L
//   Seasonal: MIB/geosmin algae compounds cause earthy/musty taste after rain
//
// SA (SA Water):
//   Hardness: 87–138 mg/L — HARDEST mainland capital city
//   Chlorine: highest in Australia, up to 1.8 mg/L recorded, regularly exceeds taste threshold
//   Fluoride: 0.56 mg/L (lower than other states)
//   Source: Murray River — mineral-rich, agricultural runoff taste
//   Adelaide is Australia's most complained-about tap water city

// ─── State-specific water intelligence ───────────────────────────────────────
interface StateWaterProfile {
  hardnessLevel: "very-soft" | "soft" | "moderate" | "hard" | "very-hard";
  chlorineLevel: "low" | "moderate" | "high" | "very-high";
  fluoridated: boolean;
  pfasRisk: "low" | "moderate" | "elevated";
  softenerNeeded: boolean;
  scaleReductionRecommended: boolean;
  primaryComplaints: string[];
  notes: string;
}

const STATE_WATER_PROFILES: Record<string, StateWaterProfile> = {
  VIC: {
    hardnessLevel: "very-soft",        // 8–44 mg/L
    chlorineLevel: "high",             // up to 1.5 mg/L — notable
    fluoridated: true,
    pfasRisk: "low",
    softenerNeeded: false,
    scaleReductionRecommended: false,
    primaryComplaints: ["chlorine taste", "chlorine smell", "skin irritation", "hair damage"],
    notes: "Melbourne has some of Australia's softest water — no softener needed. However chlorine levels are notably higher than most cities, making it a strong candidate for whole house filtration for skin and taste concerns.",
  },
  NSW: {
    hardnessLevel: "soft",             // 30–58 mg/L average
    chlorineLevel: "moderate",         // chlorine + chloramine used
    fluoridated: true,
    pfasRisk: "moderate",              // Blue Mountains area elevated in 2024
    softenerNeeded: false,
    scaleReductionRecommended: false,
    primaryComplaints: ["chlorine taste", "chloramine smell", "PFAS concern"],
    notes: "Sydney water is soft — no softener required. Chloramine (harder to remove than chlorine) is used in parts of the network. PFAS was elevated in Blue Mountains (Cascade WFP) in 2024 but now within 2025 updated guidelines. RO recommended for PFAS-concerned customers.",
  },
  QLD: {
    hardnessLevel: "moderate",         // 114.8 mg/L Brisbane, 33.9 mg/L Gold Coast
    chlorineLevel: "moderate",         // 1.10 mg/L average Brisbane
    fluoridated: true,
    pfasRisk: "low",
    softenerNeeded: false,
    scaleReductionRecommended: true,
    primaryComplaints: ["seasonal taste", "earthy smell", "moderate scale", "chlorine taste"],
    notes: "Brisbane water is moderately hard — scale-reduction filter beneficial, full softener rarely needed. Seasonal earthy/musty taste from MIB/geosmin algae in dams is common after rain — carbon filters address this well. Gold Coast is much softer.",
  },
  SA: {
    hardnessLevel: "hard",             // 87–138 mg/L — hardest mainland capital
    chlorineLevel: "very-high",        // up to 1.8 mg/L — Australia's highest
    fluoridated: true,
    pfasRisk: "low",
    softenerNeeded: true,
    scaleReductionRecommended: true,
    primaryComplaints: ["strong chlorine taste", "hard water scale", "appliance damage", "skin dryness", "salty taste in some areas"],
    notes: "Adelaide has Australia's most complained-about tap water. Murray River source brings high minerals and agricultural taste. Chlorine regularly exceeds taste threshold (0.6 mg/L), sometimes reaching 1.8 mg/L. Whole house filtration with scale-reduction is the most impactful upgrade. Northern suburbs (Salisbury, Elizabeth) have the hardest water and strongest chlorine.",
  },
  WA: {
    hardnessLevel: "hard",             // 28–228 mg/L — huge variation
    chlorineLevel: "high",             // 0.4–1.0 mg/L, added to ALL schemes
    fluoridated: true,
    pfasRisk: "low",
    softenerNeeded: true,              // especially northern suburbs
    scaleReductionRecommended: true,
    primaryComplaints: ["hard water scale", "limescale buildup", "chlorine taste", "appliance damage", "skin dryness"],
    notes: "Perth has the most variable water hardness of any Australian capital. Northern suburbs (Wanneroo, Yanchep, Two Rocks) have extremely hard water at 180–228 mg/L. Southern suburbs are moderately hard. Chlorine is added to ALL schemes due to long pipelines and heat. Softener highly recommended for northern suburbs.",
  },
  TAS: {
    hardnessLevel: "very-soft",
    chlorineLevel: "low",
    fluoridated: true,
    pfasRisk: "low",
    softenerNeeded: false,
    scaleReductionRecommended: false,
    primaryComplaints: ["taste preference"],
    notes: "Tasmania generally has excellent soft water from mountain catchments. Filtration is largely a preference choice rather than necessity.",
  },
  ACT: {
    hardnessLevel: "soft",
    chlorineLevel: "moderate",
    fluoridated: true,
    pfasRisk: "moderate",              // PFAS monitoring ongoing near defence sites
    softenerNeeded: false,
    scaleReductionRecommended: false,
    primaryComplaints: ["PFAS concern", "chlorine taste"],
    notes: "ACT water is soft. PFAS monitoring is ongoing near defence and industrial sites. Carbon + RO recommended for PFAS-conscious customers.",
  },
  NT: {
    hardnessLevel: "moderate",
    chlorineLevel: "moderate",
    fluoridated: false,                // NT does not fluoridate
    pfasRisk: "low",
    softenerNeeded: false,
    scaleReductionRecommended: true,
    primaryComplaints: ["taste", "scale in some areas"],
    notes: "NT does NOT fluoridate its water supply — RO is less critical for fluoride removal here. Scale-reduction recommended for some areas.",
  },
};

// ─── Helper flags ─────────────────────────────────────────────────────────────
function getFlags(answers: QuizAnswers) {
  const { concerns, coverage, budget, waterSource, ownershipStatus, propertyType, state } = answers;

  const hasConcern = (c: string) => concerns.includes(c);

  const isRenter = ownershipStatus === "Rent";
  const isApartment = propertyType === "Apartment";
  const canHaveWholeHome = !isRenter && !isApartment;

  const stateProfile = STATE_WATER_PROFILES[state] || null;

  // Hard water states based on real data
  const isHardWaterState = stateProfile?.softenerNeeded === true || ["WA", "SA"].includes(state);
  const isScaleState = stateProfile?.scaleReductionRecommended === true || ["WA", "SA", "QLD"].includes(state);

  // High chlorine states based on real data
  const isHighChlorineState = ["SA", "WA", "VIC"].includes(state);
  const isVeryHighChlorineState = state === "SA";

  // PFAS risk areas
  const hasPfasRisk = stateProfile?.pfasRisk === "elevated" || ["NSW", "ACT"].includes(state);

  // Fluoridated — NT does not fluoridate
  const isFluoridated = stateProfile?.fluoridated !== false;

  // Non-mains water
  const isRainOrTankOrBore = ["rainwater", "tank-water", "bore-water"].includes(waterSource);
  const isTownWater = waterSource === "town-water" || waterSource === "not-sure";

  // Budget tiers (based on real Australian installed prices)
  const budgetUnder1k = budget === "under-1000";
  const budget1kTo3k = budget === "1000-3000";
  const budget3kTo5k = budget === "3000-5000";
  const budgetPremium = budget === "5000-plus";

  // RO-essential concerns
  const needsRO =
    hasConcern("fluoride") ||
    hasConcern("heavy-metals") ||
    hasConcern("bacteria") ||
    hasConcern("pfas") ||
    hasConcern("microplastics");

  // Skin & hair — chlorine is the primary cause
  const hasSkinHairConcern =
    hasConcern("skin-hair") ||
    hasConcern("skin-shower");

  // Chlorine-related
  const hasChlorineConcern =
    hasConcern("chlorine") ||
    hasConcern("taste") ||
    hasSkinHairConcern;

  // Whole home intent
  const wantsWholeHome =
    hasConcern("whole-home") ||
    hasConcern("appliance") ||
    coverage === "whole-house" ||
    coverage === "whole-house-plus";

  return {
    hasConcern,
    isRenter,
    isApartment,
    canHaveWholeHome,
    stateProfile,
    isHardWaterState,
    isScaleState,
    isHighChlorineState,
    isVeryHighChlorineState,
    hasPfasRisk,
    isFluoridated,
    isRainOrTankOrBore,
    isTownWater,
    budgetUnder1k,
    budget1kTo3k,
    budget3kTo5k,
    budgetPremium,
    needsRO,
    hasSkinHairConcern,
    hasChlorineConcern,
    wantsWholeHome,
  };
}

// ─── State-specific warning generator ────────────────────────────────────────
function getStateWarnings(answers: QuizAnswers, f: ReturnType<typeof getFlags>): string[] {
  const warnings: string[] = [];
  const { state } = answers;

  switch (state) {
    case "VIC":
      if (!f.hasChlorineConcern && f.canHaveWholeHome) {
        warnings.push(
          "Melbourne's water is very soft (no scale issues) but has notably higher chlorine levels than most Australian cities. Many Melbourne households notice improved skin, hair, and taste with a whole house filtration."
        );
      }
      break;

    case "NSW":
      if (f.hasPfasRisk && !f.hasConcern("pfas")) {
        warnings.push(
          "Sydney Water uses both chlorine and chloramine for disinfection — chloramine can be harder to remove than chlorine and requires a quality carbon filter. PFAS monitoring is ongoing across the network."
        );
      }
      if (f.hasConcern("pfas")) {
        warnings.push(
          "PFAS was detected at elevated levels at the Blue Mountains Cascade Water Filtration Plant in 2024. Levels now meet updated 2025 Australian Drinking Water Guidelines, but a reverse osmosis system provides the most effective household protection against PFAS."
        );
      }
      break;

    case "QLD":
      if (!f.hasConcern("taste") && !f.hasChlorineConcern && f.canHaveWholeHome) {
        warnings.push(
          "Brisbane water is moderately hard (114.8 mg/L) — you may notice scale buildup in your kettle and on taps. After heavy rain, an earthy or musty taste is common due to naturally occurring algae compounds in the dams. A carbon filter addresses both effectively."
        );
      }
      break;

    case "SA":
      warnings.push(
        "Adelaide has Australia's most complained-about tap water. The Murray River source brings high mineral content, and chlorine levels regularly exceed the taste threshold — sometimes reaching 1.8 mg/L. Adelaide also has the hardest water of any mainland capital city. A whole house filtration with scale-reduction is the most impactful upgrade for SA households."
      );
      break;

    case "WA":
      warnings.push(
        "Perth's water hardness varies enormously by suburb — from 28 mg/L in southern areas to over 220 mg/L in northern suburbs like Wanneroo and Yanchep. If you're in a northern suburb, scale buildup in your kettle and appliances is a strong indicator that a softener or scale-reduction filter is essential. Chlorine is added to all Perth water schemes."
      );
      break;

    case "ACT":
      if (!f.hasConcern("pfas")) {
        warnings.push(
          "PFAS monitoring is ongoing in parts of the ACT, particularly near defence and industrial sites. If you have specific PFAS concerns, a reverse osmosis system provides the most effective household protection."
        );
      }
      break;

    case "NT":
      if (f.hasConcern("fluoride")) {
        warnings.push(
          "The Northern Territory does not fluoridate its water supply — fluoride removal via RO is less critical here than in other states. However, RO remains the best option for removing other contaminants you may be concerned about."
        );
      }
      break;
  }

  return warnings;
}

// ─── Main recommendation function ────────────────────────────────────────────
export function generateRecommendations(answers: QuizAnswers): RecommendationResult {
  const f = getFlags(answers);
  const warnings: string[] = [];

  let primaryId = "under-sink-carbon";
  let secondaryId = "under-sink-carbon";
  let premiumId = "reverse-osmosis";
  let primaryReason = "";
  let secondaryReason = "";
  let premiumReason = "";

  // ── State-specific chlorine/hardness context for reason strings ────────────
  const stateChlorineNote = f.isVeryHighChlorineState
    ? `${answers.state} has some of Australia's highest chlorine levels in its water supply — `
    : f.isHighChlorineState
    ? `${answers.state} water has notably higher chlorine levels than most states — `
    : "";

  const stateHardnessNote = f.isHardWaterState
    ? answers.state === "WA"
      ? "Perth's water hardness ranges from moderate to extremely hard depending on your suburb — "
      : answers.state === "SA"
      ? "Adelaide has the hardest water of any mainland capital city — "
      : `${answers.state} has harder water than the eastern states — `
    : "";

  // ── Concern flags for rule matching ────────────────────────────────────────
  const wholeHomeTrigger =
    f.wantsWholeHome ||
    f.hasSkinHairConcern ||
    f.hasConcern("hard-water");

  const roTrigger = f.needsRO; // fluoride, PFAS, heavy-metals, microplastics, bacteria

  const tasteOnlyConcerns =
    !roTrigger &&
    !wholeHomeTrigger &&
    (f.hasConcern("taste") || f.hasConcern("chlorine") || f.hasConcern("drinking-quality") || answers.concerns.length === 0);

  // ────────────────────────────────────────────────────────────────────────────
  // RULE 4 — RENTER / APARTMENT: never recommend whole-house as primary or premium
  // ────────────────────────────────────────────────────────────────────────────
  if (!f.canHaveWholeHome) {
    if (f.isRenter && wholeHomeTrigger) {
      warnings.push(
        "As a renter, a whole house system isn't a practical investment — it's expensive, requires landlord approval, and you'd need to pay to have it removed when you move. We've tailored your recommendations to the best options available for renters."
      );
    }
    if (f.isApartment && wholeHomeTrigger) {
      warnings.push(
        "Whole house filtration systems cannot be installed in apartments. We've recommended the best under-sink and point-of-use options for your home."
      );
    }

    if (roTrigger) {
      // Rule 3 adapted for renters
      primaryId = "reverse-osmosis";
      primaryReason = `A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, and microplastics from drinking water. It installs neatly under your kitchen sink with a dedicated drinking faucet, at $800–$1,600 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `A quality under-sink carbon filter is a more affordable alternative — though carbon filters reduce but do not eliminate these contaminants. RO is the proper solution for fluoride, PFAS, and heavy metals.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For the ultimate drinking water experience, an RO system with an alkaline remineralisation stage adds beneficial minerals back after filtration — delivering purified, mineral-balanced water from your kitchen tap.`;
    } else {
      // Rule 2 adapted for renters
      primaryId = "under-sink-carbon";
      primaryReason = `${stateChlorineNote}An under-sink carbon filter effectively removes chlorine, improves taste, and delivers noticeably better drinking water — the best available option for renters and apartment dwellers. $300–$1,200 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `This is already the most affordable effective option — a quality under-sink carbon filter delivers the best value for taste and chlorine concerns. No cheaper alternative will meaningfully improve your water.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For a significant step up in water purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants — the premium drinking water solution at $800–$1,600 installed.`;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RULE 5 — BUDGET UNDER $1,000: never recommend whole-house as primary
  // ────────────────────────────────────────────────────────────────────────────
  else if (f.budgetUnder1k) {
    if (roTrigger) {
      // Rule 3 + budget constraint
      primaryId = "reverse-osmosis";
      primaryReason = `A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, and microplastics. Installed under your kitchen sink at $800–$1,600.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `A quality under-sink carbon filter is a more affordable alternative — though carbon filters reduce but do not eliminate these contaminants. RO is the proper solution.`;
      premiumId = "whole-house-combo";
      premiumReason = `For the complete solution, a whole house filtration system combined with a reverse osmosis drinking water unit addresses every concern — chlorine-free water throughout your home plus ultra-pure drinking water. Note: whole house systems start from $2,500 installed.`;
      warnings.push(
        "Important: Whole house filtration systems start from around $2,500 installed — above your current budget. We've recommended the best under-sink options. You can always upgrade to whole house later."
      );
    } else if (wholeHomeTrigger) {
      // Rule 1 concerns but budget too low for whole house
      primaryId = "under-sink-carbon";
      primaryReason = `${stateChlorineNote}An under-sink carbon filter is the best option within your budget — it effectively removes chlorine, sediment, and improves taste at your kitchen tap. However, it only addresses drinking water, not your full concern for whole-home coverage.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `At this budget, an under-sink carbon filter is the most practical starting point — affordable and effective for drinking water quality.`;
      premiumId = "whole-house-carbon";
      premiumReason = `A whole house filtration system is the proper solution for your concerns — filtering chlorine from every tap, shower, and appliance. Note: whole house systems start from $2,500 installed, above your current budget.`;
      warnings.push(
        "Important: Your concerns (skin/hair, whole home coverage, or appliance protection) are best addressed by a whole house filtration system, which starts from around $2,500 installed. We've recommended the best option within your budget, but a whole house system would be the proper long-term solution."
      );
    } else {
      // Rule 2 + budget constraint
      primaryId = "under-sink-carbon";
      primaryReason = `${stateChlorineNote}An under-sink carbon filter is the ideal solution for your needs — effectively removing chlorine, improving taste, and delivering noticeably better drinking water. $300–$1,200 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `This is already the most affordable effective option — a quality under-sink carbon filter delivers the best value for taste and chlorine concerns. No cheaper alternative will meaningfully improve your water.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For a significant step up in water purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants — the premium drinking water solution at $800–$1,600 installed.`;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // OWNER, BUDGET >= $1,000 — STANDARD RULES
  // ────────────────────────────────────────────────────────────────────────────

  // ── RAINWATER / TANK / BORE — special path ────────────────────────────────
  else if (f.isRainOrTankOrBore) {
    primaryId = "tank-filter";
    primaryReason = `With your water source, a sediment pre-filter is the essential first step — removing dirt, rust, debris, and particles from your rainwater or tank water before it enters your home.`;
    secondaryId = "uv-system";
    secondaryReason = `Adding UV disinfection to your sediment filter is strongly recommended — it kills bacteria, viruses, and microorganisms in your tank water without chemicals, making it safe for your whole family.`;
    premiumId = roTrigger ? "reverse-osmosis" : "whole-house-carbon";
    premiumReason = roTrigger
      ? `For the safest possible drinking water, combining your sediment pre-filter and UV system with a reverse osmosis unit at the kitchen delivers the complete three-stage solution — the approach recommended by water quality experts for tank and bore water.`
      : `For comprehensive whole-home protection, a whole house filtration system with sediment, carbon, and UV stages delivers clean, safe water from every tap and shower throughout your home.`;
  }

  // ── RULE 1: Whole home triggers ────────────────────────────────────────────
  else if (wholeHomeTrigger && roTrigger) {
    // Whole home + serious contaminants → Combo primary, RO or WH as budget, no premium (would duplicate primary)
    primaryId = "whole-house-combo";
    primaryReason = `${stateChlorineNote}Your concerns need two layers of protection: a whole house filtration system for chlorine-free water at every tap, shower, and appliance — plus a reverse osmosis drinking water unit to eliminate fluoride, PFAS, heavy metals, and microplastics. This combined system is the most effective water quality solution available for Australian homes. Typically $4,000–$8,000 installed.`;
    // Budget alternative: RO if contaminant removal is the bigger concern, WH if whole-home is more prominent
    const contaminantConcernCount = ["fluoride", "heavy-metals", "pfas", "microplastics", "bacteria"].filter(c => answers.concerns.includes(c)).length;
    const wholeHomeConcernCount = ["skin-hair", "whole-home", "appliance", "hard-water"].filter(c => answers.concerns.includes(c)).length;
    if (contaminantConcernCount >= wholeHomeConcernCount) {
      secondaryId = "reverse-osmosis";
      secondaryReason = `If the full combo is outside your budget, a reverse osmosis system on its own is the priority — it's the only household technology that removes fluoride, PFAS, heavy metals, and microplastics from your drinking water. $800–$1,600 installed. You can add whole house filtration later.`;
    } else {
      secondaryId = "whole-house-carbon";
      secondaryReason = `If the full combo is outside your budget, start with a whole house filtration system — it delivers chlorine-free water to every tap, shower, and appliance, addressing your skin, hair, and whole-home concerns. $2,000–$5,000 installed. You can add an RO drinking water unit later.`;
    }
    premiumId = "whole-house-combo";
    premiumReason = "";
  }

  else if (wholeHomeTrigger && !roTrigger) {
    // Whole home + taste/chlorine only → WH primary, under-sink budget, combo premium
    primaryId = "whole-house-carbon";
    primaryReason = `${stateChlorineNote}A whole house filtration system is the right choice — no other solution delivers filtered water to every tap, shower, and appliance in your home. ${f.isHighChlorineState ? `This removes chlorine from every water outlet, protecting your skin, hair, and appliances.` : "It removes chlorine, sediment, and chemicals from your entire water supply."} Typically $2,000–$5,000 installed.`;
    secondaryId = "under-sink-carbon";
    secondaryReason = `An under-sink carbon filter addresses drinking water only — it won't solve whole-home concerns like skin irritation, shower chlorine, or appliance protection. But it's an affordable starting point if a whole house system isn't in budget right now.`;
    premiumId = "whole-house-combo";
    premiumReason = `The complete premium solution: a whole house system combined with a reverse osmosis drinking water unit and 3-way mixer tap — whole-home chlorine removal plus ultra-pure drinking water at the kitchen. The best of both worlds at $4,000–$8,000 installed.`;
  }

  // ── RULE 3: RO-essential concerns (drinking water only) ────────────────────
  else if (roTrigger) {
    const fluorideNote = f.stateProfile?.fluoridated === false && f.hasConcern("fluoride")
      ? "Note: The NT does not fluoridate its water supply, so fluoride removal is less of a priority here. However, RO still provides the highest purity drinking water available. "
      : "";

    primaryId = "reverse-osmosis";
    primaryReason = `${fluorideNote}A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, and microplastics. Installed under your kitchen sink at $800–$1,600.`;
    secondaryId = "under-sink-carbon";
    secondaryReason = `A quality under-sink carbon filter is a more affordable alternative — though carbon filters reduce but do not eliminate these contaminants. RO is the proper solution for fluoride, PFAS, and heavy metals.`;
    premiumId = "whole-house-combo";
    premiumReason = `For the complete solution, add a whole house filtration to your RO system — ${f.isHighChlorineState ? `particularly valuable in ${answers.state} where chlorine levels are among Australia's highest` : "removing chlorine from every tap and shower"}. Typically $4,000–$8,000 installed together.`;
  }

  // ── RULE 2: Taste/chlorine/drinking quality only ───────────────────────────
  else {
    primaryId = "under-sink-carbon";
    primaryReason = `${stateChlorineNote}An under-sink carbon filter is the ideal solution for your needs — effectively removing chlorine, improving taste, and delivering noticeably better drinking water${f.isHighChlorineState ? ` (particularly noticeable in ${answers.state} where chlorine levels are higher than most states)` : ""}. $300–$1,200 installed.`;
    secondaryId = "under-sink-carbon";
    secondaryReason = `This is already the most affordable effective option — a quality under-sink carbon filter delivers the best value for taste and chlorine concerns. No cheaper alternative will meaningfully improve your water.`;
    premiumId = "reverse-osmosis";
    premiumReason = `For a significant step up in water purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants — the premium drinking water solution at $800–$1,600 installed.`;
  }

  // ── Add state-specific warnings ───────────────────────────────────────────
  const stateWarnings = getStateWarnings(answers, f);
  warnings.push(...stateWarnings);

  // ── Hard water warning if not already flagged ─────────────────────────────
  if (f.isHardWaterState && !f.hasConcern("hard-water") && !f.hasConcern("appliance") && f.canHaveWholeHome && stateWarnings.length === 0) {
    warnings.push(
      `${answers.state} has harder water than most Australian states. Keep an eye out for white scale in your kettle, on taps, and on shower screens — these are signs a scale-reduction filter would benefit your home.`
    );
  }

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
