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
    notes: "Melbourne has some of Australia's softest water — no softener needed. However chlorine levels are notably higher than most cities, making it a strong candidate for whole house carbon filtration for skin and taste concerns.",
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
    notes: "Adelaide has Australia's most complained-about tap water. Murray River source brings high minerals and agricultural taste. Chlorine regularly exceeds taste threshold (0.6 mg/L), sometimes reaching 1.8 mg/L. Whole house carbon + scale-reduction is the most impactful upgrade. Northern suburbs (Salisbury, Elizabeth) have the hardest water and strongest chlorine.",
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
  const budget3kTo6k = budget === "3000-6000";
  const budgetPremium = budget === "6000-plus";

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
    coverage === "whole-house-carbon" ||
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
    budget3kTo6k,
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
          "Melbourne's water is very soft (no scale issues) but has notably higher chlorine levels than most Australian cities. Many Melbourne households notice improved skin, hair, and taste with a whole house carbon filter."
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
        "Adelaide has Australia's most complained-about tap water. The Murray River source brings high mineral content, and chlorine levels regularly exceed the taste threshold — sometimes reaching 1.8 mg/L. Adelaide also has the hardest water of any mainland capital city. A whole house carbon filter with scale-reduction is the most impactful upgrade for SA households."
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
  let secondaryId = "reverse-osmosis";
  let premiumId = "whole-house-carbon";
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

  // ────────────────────────────────────────────────────────────────────────────
  // PATH A: RENTER OR APARTMENT
  // ────────────────────────────────────────────────────────────────────────────
  if (!f.canHaveWholeHome) {
    if (f.isRenter) {
      warnings.push(
        "As a renter, a whole house system isn't a practical investment — it's expensive, requires landlord approval, and you'd need to pay to have it removed when you move. We've tailored your recommendations to the best options available for renters."
      );
    }
    if (f.isApartment) {
      warnings.push(
        "Whole house filtration systems cannot be installed in apartments. We've recommended the best under-sink and point-of-use options for your home."
      );
    }

    if (f.needsRO) {
      primaryId = "reverse-osmosis";
      primaryReason = `A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, and microplastics from drinking water. It installs neatly under your kitchen sink with a dedicated drinking faucet, at $800–$1,500 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `If an RO system isn't in your budget right now, a quality under-sink carbon filter is a meaningful step up for your drinking water quality — though it reduces rather than eliminates fluoride and heavy metals.`;
      premiumId = "alkaline-filter";
      premiumReason = `For the ultimate drinking water experience, an RO system with an alkaline remineralisation stage adds beneficial minerals back after filtration — delivering purified, mineral-balanced water from your kitchen tap.`;
    } else if (f.hasSkinHairConcern) {
      primaryId = "shower-filter";
      primaryReason = `For skin and hair concerns in your home, a shower filter reduces chlorine at the shower head — the main point of contact for skin irritation, eczema, and hair damage from ${f.isHighChlorineState ? `${answers.state}'s notably chlorinated water` : "chlorinated water"}.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `Pairing a shower filter with an under-sink carbon filter covers both your shower water and your drinking water — the best combination available without a whole house system.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For the highest quality drinking water alongside your shower filter, a reverse osmosis system delivers ultra-pure water free from chlorine, fluoride, and other contaminants.`;
      warnings.push(
        "Important: Shower filters are significantly less effective than a whole house system for skin and hair concerns — they only treat water at one shower head. A whole house carbon filter would be the proper long-term solution if you move into an owned property."
      );
    } else if (f.hasChlorineConcern) {
      primaryId = "under-sink-carbon";
      primaryReason = `${stateChlorineNote}an under-sink carbon filter effectively removes chlorine from your drinking water, improving taste and reducing the chemical smell — the best available option for renters and apartment dwellers.`;
      secondaryId = "tap-filter";
      secondaryReason = `A tap-mounted filter is a portable, no-installation alternative — easy to attach to your existing tap and take with you when you move.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For the most comprehensive drinking water solution available without a whole house system, a reverse osmosis unit removes chlorine, fluoride, and a wide range of contaminants — $800–$1,500 installed.`;
    } else {
      primaryId = "under-sink-carbon";
      primaryReason = `An under-sink carbon filter is the ideal starting point — improving taste, removing chlorine, and delivering noticeably better drinking water with a neat under-sink installation.`;
      secondaryId = "tap-filter";
      secondaryReason = `A tap-mounted filter is a simple, portable option for renters — no plumber required and easy to take with you when you move.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For the highest purity drinking water available in your home, a reverse osmosis system removes virtually all contaminants — the top-tier under-sink option at $800–$1,500 installed.`;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PATH B: OWNER / NON-APARTMENT
  // ────────────────────────────────────────────────────────────────────────────
  else {

    // ── B1: RAINWATER / TANK / BORE ──────────────────────────────────────────
    if (f.isRainOrTankOrBore) {
      primaryId = "tank-filter";
      primaryReason = `With your water source, a sediment pre-filter is the essential first step — removing dirt, rust, debris, and particles from your rainwater or tank water before it enters your home.`;
      secondaryId = "uv-system";
      secondaryReason = `Adding UV disinfection to your sediment filter is strongly recommended — it kills bacteria, viruses, and microorganisms in your tank water without chemicals, making it safe for your whole family.`;
      premiumId = f.needsRO ? "reverse-osmosis" : "whole-house-carbon";
      premiumReason = f.needsRO
        ? `For the safest possible drinking water, combining your sediment pre-filter and UV system with a reverse osmosis unit at the kitchen delivers the complete three-stage solution — the approach recommended by water quality experts for tank and bore water.`
        : `For comprehensive whole-home protection, a whole house filtration system with sediment, carbon, and UV stages delivers clean, safe water from every tap and shower throughout your home.`;
    }

    // ── B2: HARD WATER (SA is priority, then WA, then QLD) ───────────────────
    else if (f.isHardWaterState && (f.hasConcern("hard-water") || f.hasConcern("appliance"))) {

      if (answers.state === "SA") {
        // SA — hardest mainland capital, very high chlorine
        primaryId = "whole-house-carbon";
        primaryReason = `${stateHardnessNote}a whole house filtration system with carbon and scale-reduction stages is the most impactful upgrade for Adelaide homes — it addresses the strong chlorine taste, removes sediment from the Murray River source, and reduces scale buildup in your appliances and hot water system.`;
        secondaryId = "water-softener";
        secondaryReason = `For northern suburbs like Salisbury and Elizabeth where water hardness is at its highest, a dedicated water softener is the most targeted fix — directly eliminating the calcium and magnesium causing scale throughout your home.`;
        premiumId = "whole-house-carbon";
        premiumReason = `The complete solution for Adelaide: a whole house carbon + scale-reduction filter combined with a reverse osmosis drinking water unit — addressing chlorine, minerals, and delivering ultra-pure drinking water at the kitchen tap.`;
      } else if (answers.state === "WA") {
        // WA — varies enormously by suburb
        if (f.budget3kTo6k || f.budgetPremium) {
          primaryId = "water-softener";
          primaryReason = `${stateHardnessNote}a water softener is the most effective solution for Perth homes with hard water — directly targeting the calcium and magnesium causing scale in your kettle, shower screens, and hot water system. Particularly essential in northern suburbs where hardness exceeds 180 mg/L.`;
          secondaryId = "whole-house-carbon";
          secondaryReason = `A whole house carbon filter with scale-reduction is a strong complement — addressing chlorine taste and general water quality throughout your home alongside your softener.`;
          premiumId = "whole-house-carbon";
          premiumReason = `The ultimate Perth setup: a water softener combined with a whole house carbon filter and reverse osmosis drinking system — soft water throughout the home plus ultra-pure drinking water at the kitchen tap.`;
        } else {
          primaryId = "whole-house-carbon";
          primaryReason = `${stateHardnessNote}a whole house filtration system with a scale-reduction filter addresses both Perth's hard water and chlorine throughout your home — protecting your appliances and improving water quality from every tap and shower.`;
          secondaryId = "water-softener";
          secondaryReason = `If scale is your primary concern — especially in northern suburbs where hardness exceeds 180 mg/L — a dedicated water softener is the most targeted solution.`;
          premiumId = "whole-house-carbon";
          premiumReason = `The complete Perth solution: a water softener combined with a whole house carbon filter and RO drinking system — the most comprehensive water quality setup available.`;
        }
      } else {
        // QLD and other moderate hard water states
        primaryId = "whole-house-carbon";
        primaryReason = `${stateHardnessNote}a whole house filtration system with a scale-reduction filter is the most practical solution — addressing hard water buildup and chlorine throughout your home and protecting your appliances from scale damage.`;
        secondaryId = "water-softener";
        secondaryReason = `For significant scale problems, a dedicated water softener is the most targeted fix for hard water — directly eliminating the minerals causing buildup on your taps, shower screens, and appliances.`;
        premiumId = "whole-house-carbon";
        premiumReason = `The complete solution: a whole house system with scale-reduction combined with an RO drinking water unit — comprehensive hard water treatment plus ultra-pure drinking water.`;
      }
    }

    // ── B3: SKIN & HAIR CONCERNS ──────────────────────────────────────────────
    else if (f.hasSkinHairConcern) {
      const chlorineContext = f.isVeryHighChlorineState
        ? `Adelaide has some of Australia's highest chlorine levels — making skin irritation, eczema, and hair damage from tap water particularly common for SA households.`
        : f.isHighChlorineState
        ? `${answers.state} water has notably higher chlorine than most states — a significant contributor to skin irritation, eczema, and hair damage.`
        : `Chlorine in town water is the primary cause of skin irritation, eczema, hair loss, and dandruff.`;

      if (f.budgetUnder1k) {
        primaryId = "shower-filter";
        primaryReason = `For your budget, a shower filter reduces chlorine at the shower head — the main point of skin and hair chlorine exposure. ${chlorineContext}`;
        secondaryId = "under-sink-carbon";
        secondaryReason = `Combining a shower filter with an under-sink carbon filter improves both your shower water and drinking water within your budget.`;
        premiumId = "whole-house-carbon";
        premiumReason = `When your budget allows, a whole house filtration system is the proper solution — filtering chlorine from every tap and shower. Entry-level systems from around $2,500 installed.`;
        warnings.push(
          "Important: There are no effective whole house filtration options under $1,000 — entry-level systems start from around $2,500 installed. A shower filter is your best option at this budget but is significantly less effective than a whole house system for skin and hair concerns."
        );
      } else if (f.budget1kTo3k) {
        primaryId = "whole-house-carbon";
        primaryReason = `A whole house filtration system is the proper solution for skin and hair concerns — filtering chlorine from every tap and shower in your home. ${chlorineContext} Entry-level systems start from around $2,500 installed.`;
        secondaryId = "shower-filter";
        secondaryReason = `If a whole house system is slightly above budget right now, a shower filter is a meaningful stepping stone — reducing chlorine at the shower head while you save for the complete solution.`;
        premiumId = "whole-house-carbon";
        premiumReason = `For the best possible outcome, combine a whole house carbon filter with a reverse osmosis drinking water unit — chlorine-free water throughout your home plus ultra-pure drinking water. Typically $4,000–$7,000 installed.`;
      } else {
        primaryId = "whole-house-carbon";
        primaryReason = `A whole house filtration system is the gold standard for skin and hair concerns — filtering chlorine from every tap, shower, and bath in your home. ${chlorineContext} With your budget, you can invest in a quality system with a long service life.`;
        secondaryId = "whole-house-carbon";
        secondaryReason = `Our most popular combination: a whole house carbon filter paired with a reverse osmosis drinking water unit — chlorine-free water throughout your entire home plus ultra-pure drinking water at the kitchen. Typically $4,000–$7,000 installed.`;
        premiumId = "reverse-osmosis";
        premiumReason = `The premium setup: a high-capacity whole house carbon filter combined with an RO unit and 3-way mixer tap (perfect for stone benchtops, providing hot, cold, and filtered water from one tap) — the best water quality solution available for Australian homes.`;
      }
    }

    // ── B4: RO-ESSENTIAL CONCERNS ─────────────────────────────────────────────
    else if (f.needsRO) {
      // Special case: NT doesn't fluoridate — adjust fluoride messaging
      const fluorideNote = !f.isFluoridated && f.hasConcern("fluoride")
        ? "Note: The NT does not fluoridate its water supply, so fluoride removal is less of a priority here. However, RO still provides the highest purity drinking water available. "
        : "";

      if (f.wantsWholeHome || f.budget3kTo6k || f.budgetPremium) {
        primaryId = "reverse-osmosis";
        primaryReason = `${fluorideNote}A reverse osmosis system is the only household technology that effectively eliminates fluoride, PFAS, heavy metals, and microplastics from drinking water — carbon filters can reduce but not eliminate these contaminants. Installed under the kitchen sink at $800–$1,500.`;
        secondaryId = "whole-house-carbon";
        secondaryReason = `Combining your RO drinking system with a whole house carbon filter is the complete solution — ultra-pure drinking water at the kitchen tap plus ${f.isHighChlorineState ? `${answers.state}'s notably chlorinated water` : "chlorine"} removed from every shower and tap. Typically $4,000–$7,000 installed.`;
        premiumId = "whole-house-carbon";
        premiumReason = `The premium setup: a whole house carbon filter plus RO unit with a 3-way mixer tap (ideal for stone benchtops) — the best possible water quality for both drinking and whole-home use.`;
      } else {
        primaryId = "reverse-osmosis";
        primaryReason = `${fluorideNote}A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, and microplastics. Carbon filters reduce these contaminants but cannot eliminate them. Installed under the kitchen sink at $800–$1,500.`;
        secondaryId = "under-sink-carbon";
        secondaryReason = `If an RO system isn't quite in budget, a quality under-sink carbon filter significantly improves your drinking water — though it reduces rather than eliminates fluoride and heavy metals.`;
        premiumId = "whole-house-carbon";
        premiumReason = `For the complete solution, add a whole house carbon filter to your RO system — ${f.isHighChlorineState ? `particularly valuable in ${answers.state} where chlorine levels are among Australia's highest` : "removing chlorine from every tap and shower"}. Typically $4,000–$7,000 installed together.`;
      }
    }

    // ── B5: CHLORINE / TASTE — TOWN WATER ────────────────────────────────────
    else if (f.hasChlorineConcern && f.isTownWater) {
      if (f.budgetUnder1k) {
        primaryId = "under-sink-carbon";
        primaryReason = `${stateChlorineNote}an under-sink carbon filter is the best value option within your budget — effectively removing chlorine and improving the taste and smell of your drinking water.`;
        secondaryId = "tap-filter";
        secondaryReason = `A tap-mounted filter is the most affordable option — easy to install yourself without a plumber.`;
        premiumId = "whole-house-carbon";
        premiumReason = `When your budget allows, a whole house filtration system removes chlorine from every tap and shower. Entry-level systems from around $2,500 installed.`;
        if (f.isHighChlorineState) {
          warnings.push(
            `${answers.state} water has higher chlorine levels than most states — you're likely to notice a stronger improvement when you upgrade to whole house filtration.`
          );
        }
      } else if (f.budget1kTo3k) {
        primaryId = "whole-house-carbon";
        primaryReason = `${stateChlorineNote}a whole house carbon filtration system removes chlorine from every tap, shower, and appliance in your home — improving taste, reducing skin irritation, and protecting your appliances. Entry-level systems from around $2,500 installed.`;
        secondaryId = "under-sink-carbon";
        secondaryReason = `If a whole house system is at the top of your budget, an under-sink carbon filter is a solid starting point — and you can always upgrade to whole house filtration when ready.`;
        premiumId = "reverse-osmosis";
        premiumReason = `Adding a reverse osmosis unit gives you ultra-pure drinking water at the kitchen tap on top of your whole house filtration — the popular combination at $4,000–$7,000 installed.`;
      } else {
        primaryId = "whole-house-carbon";
        primaryReason = `${stateChlorineNote}a whole house carbon filtration system is the right investment — removing chlorine from every tap, shower, and appliance in your home. With your budget, you can choose a quality system with a long service life.`;
        secondaryId = "reverse-osmosis";
        secondaryReason = `Our most popular combination: pairing your whole house system with a reverse osmosis drinking water unit — chlorine-free water throughout your home plus ultra-pure drinking water at the kitchen. Typically $4,000–$7,000 installed together.`;
        premiumId = "whole-house-carbon";
        premiumReason = `The premium setup: a high-capacity whole house system combined with an RO unit and 3-way mixer tap (perfect for stone benchtops providing hot, cold, and filtered water from one tap) — the ultimate water quality solution for Australian homes.`;
      }
    }

    // ── B6: WHOLE HOME INTENT ─────────────────────────────────────────────────
    else if (f.wantsWholeHome) {
      primaryId = "whole-house-carbon";
      primaryReason = `A whole house filtration system delivers filtered water to every tap, shower, and appliance in your home — protecting your hot water system, dishwasher, and washing machine${f.isScaleState ? `, and with a scale-reduction stage addresses ${answers.state}'s moderately hard water` : ""}.`;
      secondaryId = "reverse-osmosis";
      secondaryReason = `Adding a reverse osmosis drinking water unit is the popular upgrade — ultra-pure water at the kitchen tap on top of your whole house filtration. Combined systems typically $4,000–$7,000 installed.`;
      premiumId = "whole-house-carbon";
      premiumReason = `The complete premium solution: a high-capacity whole house system combined with an RO unit and 3-way mixer tap — the best of both worlds for drinking water purity and whole-home protection.`;
    }

    // ── B7: DEFAULT ───────────────────────────────────────────────────────────
    else {
      primaryId = "under-sink-carbon";
      primaryReason = `Based on your answers, an under-sink carbon filter is the ideal starting point — improving taste, removing chlorine, and delivering noticeably better drinking water${f.isHighChlorineState ? ` (particularly noticeable in ${answers.state} where chlorine levels are higher than most states)` : ""}.`;
      secondaryId = "reverse-osmosis";
      secondaryReason = `For a significant step up in water purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants — the premium drinking water solution at $800–$1,500 installed.`;
      premiumId = "whole-house-carbon";
      premiumReason = `For complete home protection, a whole house carbon filter removes chlorine from every tap and shower — protecting your skin, hair, and appliances${f.isScaleState ? `, with a scale-reduction stage for ${answers.state}'s harder water` : ""}. The most comprehensive solution for Australian town water homes.`;
    }
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
