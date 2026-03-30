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
  // Skin & hair concerns (add to QuizPage step 3 concerns list)
  skinHairConcerns?: boolean;
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

// ─── Helper flags ─────────────────────────────────────────────────────────────

function getFlags(answers: QuizAnswers) {
  const { concerns, coverage, budget, waterSource, ownershipStatus, propertyType, state, skinHairConcerns } = answers;

  const hasConcern = (c: string) => concerns.includes(c);

  const isRenter = ownershipStatus === "Rent";
  const isApartment = propertyType === "Apartment";
  const canHaveWholeHome = !isRenter && !isApartment;

  // Hard water states — WA, SA, QLD have significantly harder water
  const isHardWaterState = ["WA", "SA", "QLD"].includes(state);

  // High chlorine states — VIC and SA are known for strong chlorination
  const isHighChlorineState = ["VIC", "SA"].includes(state);

  // Non-mains water
  const isRainOrTankOrBore = ["rainwater", "tank-water", "bore-water"].includes(waterSource);
  const isTownWater = waterSource === "town-water" || waterSource === "not-sure";

  // Budget tiers (based on real installed prices in Australia)
  // Note: No whole home system available under $1,000 — minimum ~$2,500 installed
  const budgetUnder1k = budget === "under-1000";
  const budget1kTo3k = budget === "1000-3000";
  const budget3kTo6k = budget === "3000-6000";
  const budgetPremium = budget === "6000-plus";

  // RO-essential concerns — carbon filters reduce but cannot eliminate these
  const needsRO =
    hasConcern("fluoride") ||
    hasConcern("heavy-metals") ||
    hasConcern("bacteria") ||
    hasConcern("pfas") ||
    hasConcern("microplastics");

  // Skin & hair — strong signal for whole home chlorine removal
  const hasSkinHairConcern =
    skinHairConcerns === true ||
    hasConcern("skin-shower") ||
    hasConcern("skin-hair");

  // Chlorine-related concerns
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
    isHardWaterState,
    isHighChlorineState,
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

// ─── Main recommendation function ────────────────────────────────────────────
// Recommendation tiers (based on real sales experience):
// Good    = Under-sink carbon filter ($300–$800 installed)
// Better  = Reverse Osmosis ($800–$1,500 installed)
// Best    = Whole home + RO combo ($4,000–$7,000 installed)

export function generateRecommendations(answers: QuizAnswers): RecommendationResult {
  const f = getFlags(answers);
  const warnings: string[] = [];

  let primaryId = "under-sink-carbon";
  let secondaryId = "reverse-osmosis";
  let premiumId = "whole-house-carbon";
  let primaryReason = "";
  let secondaryReason = "";
  let premiumReason = "";

  // ────────────────────────────────────────────────────────────────────────────
  // PATH A: RENTER OR APARTMENT — whole home not an option
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
      primaryReason = `A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, and microplastics from drinking water. It installs neatly under your kitchen sink with a dedicated drinking faucet, costing $800–$1,500 installed.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `If an RO system isn't in your budget right now, a quality under-sink carbon filter is a meaningful step up for your drinking water — though it reduces rather than eliminates fluoride and heavy metals.`;
      premiumId = "alkaline-filter";
      premiumReason = `For the ultimate drinking water experience, an RO system with an alkaline remineralisation stage adds beneficial minerals back after filtration — delivering purified, mineral-balanced water from your kitchen tap.`;
    } else if (f.hasSkinHairConcern) {
      primaryId = "shower-filter";
      primaryReason = `For skin and hair concerns in your home, a shower filter is the most accessible option available to you. It reduces chlorine at the shower head — the main point of contact for skin irritation, eczema, and hair damage from chlorinated water.`;
      secondaryId = "under-sink-carbon";
      secondaryReason = `Pairing a shower filter with an under-sink carbon filter covers both your shower water and your drinking water — the best combination available without a whole house system.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For the highest quality drinking water alongside your shower filter, a reverse osmosis system delivers ultra-pure water free from chlorine, fluoride, and other contaminants.`;
      warnings.push(
        "Important: Shower filters are significantly less effective than a whole house system for skin and hair concerns — they only treat water at one shower head. If you move into an owned property in the future, a whole house carbon filter would be the proper long-term solution."
      );
    } else if (f.hasChlorineConcern) {
      primaryId = "under-sink-carbon";
      primaryReason = `An under-sink carbon filter effectively removes chlorine from your drinking water, improving taste and reducing the chemical smell — the best available option for renters and apartment dwellers.`;
      secondaryId = "tap-filter";
      secondaryReason = `A tap-mounted filter is a portable, no-installation alternative — easy to attach to your existing tap and take with you when you move.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For the most comprehensive drinking water solution available without a whole house system, a reverse osmosis unit removes chlorine, fluoride, heavy metals, and more — $800–$1,500 installed.`;
    } else {
      primaryId = "under-sink-carbon";
      primaryReason = `An under-sink carbon filter is the ideal starting point — improving taste, removing chlorine, and delivering noticeably better drinking water with a neat under-sink installation.`;
      secondaryId = "tap-filter";
      secondaryReason = `A tap-mounted filter is a simple, portable option for renters — no plumber required and easy to take with you when you move.`;
      premiumId = "reverse-osmosis";
      premiumReason = `For the highest purity drinking water available in your home, a reverse osmosis system removes virtually all contaminants and is the top-tier under-sink option at $800–$1,500 installed.`;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PATH B: OWNER, NON-APARTMENT — full range available
  // ────────────────────────────────────────────────────────────────────────────
  else {

    // ── B1: RAINWATER / TANK / BORE WATER ──────────────────────────────────
    if (f.isRainOrTankOrBore) {
      primaryId = "tank-filter";
      primaryReason = `With your water source, a sediment pre-filter is the essential first step — removing dirt, rust, debris, and particles from your rainwater or tank water before it enters your home.`;
      secondaryId = "uv-system";
      secondaryReason = `Adding UV disinfection to your sediment filter is strongly recommended — it kills bacteria, viruses, and other microorganisms in your tank water without chemicals, making it safe for your whole family.`;
      premiumId = f.needsRO ? "reverse-osmosis" : "whole-house-carbon";
      premiumReason = f.needsRO
        ? `For the safest possible drinking water, combining your sediment pre-filter and UV system with a reverse osmosis unit at the kitchen delivers the complete three-stage solution — removing all pathogens and contaminants from your drinking water.`
        : `For comprehensive whole-home protection, a whole house filtration system with sediment, carbon, and UV stages delivers clean, safe water from every tap and shower throughout your home.`;
    }

    // ── B2: HARD WATER STATES (WA, SA, QLD) with hard water concern ─────────
    else if (f.isHardWaterState && (f.hasConcern("hard-water") || f.hasConcern("appliance"))) {
      if (f.budget3kTo6k || f.budgetPremium) {
        primaryId = "water-softener";
        primaryReason = `${answers.state} has some of the hardest water in Australia. A water softener directly targets the calcium and magnesium causing scale buildup in your kettle, on your taps, and in your hot water system — protecting your appliances and leaving skin and hair feeling noticeably softer.`;
        secondaryId = "whole-house-carbon";
        secondaryReason = `A whole house carbon filter with a scale-reduction stage is a strong complement to your softener — addressing chlorine, taste, and general water quality throughout your home.`;
        premiumId = "whole-house-carbon";
        premiumReason = `The complete solution for ${answers.state} homes: a water softener combined with a whole house carbon filter and an RO drinking water system — addressing hard water, chlorine, and delivering ultra-pure drinking water all in one setup.`;
      } else {
        primaryId = "whole-house-carbon";
        primaryReason = `A whole house filtration system with a scale-reduction filter is the most practical solution for your budget — addressing hard water buildup and chlorine throughout your home and protecting your appliances from scale damage.`;
        secondaryId = "water-softener";
        secondaryReason = `A dedicated water softener is the most targeted fix for hard water in ${answers.state} — it's particularly valuable where water hardness is among the highest in Australia.`;
        premiumId = "whole-house-carbon";
        premiumReason = `The premium solution: a water softener combined with a whole house carbon filter and RO drinking water system — comprehensive hard water treatment plus the purest possible drinking water.`;
        warnings.push(
          `${answers.state} has significantly harder water than most Australian states. A scale-reduction filter is highly recommended as part of your whole house setup to protect your appliances and hot water system.`
        );
      }
    }

    // ── B3: SKIN & HAIR CONCERNS ────────────────────────────────────────────
    else if (f.hasSkinHairConcern) {
      if (f.budgetUnder1k) {
        primaryId = "shower-filter";
        primaryReason = `For your budget, a shower filter reduces chlorine at the shower head — the main source of skin irritation, eczema, hair loss, and dandruff from tap water. It's the most accessible starting point for skin and hair concerns.`;
        secondaryId = "under-sink-carbon";
        secondaryReason = `Combining a shower filter with an under-sink carbon filter improves both your shower water and your drinking water within your budget.`;
        premiumId = "whole-house-carbon";
        premiumReason = `When your budget allows, a whole house filtration system is the proper solution — filtering chlorine from every tap and shower in your home. Entry-level systems start from around $2,500 installed.`;
        warnings.push(
          "Important: There are no effective whole house filtration options under $1,000 — entry-level systems start from around $2,500 installed. A shower filter is your best option at this budget, but is significantly less effective than a whole house system for skin and hair concerns."
        );
      } else if (f.budget1kTo3k) {
        primaryId = "whole-house-carbon";
        primaryReason = `A whole house filtration system is the proper solution for skin and hair concerns — filtering chlorine from every tap and shower in your home. This directly addresses skin irritation, eczema, hair loss, and dandruff caused by chlorinated town water. Entry-level systems start from around $2,500 installed.`;
        secondaryId = "shower-filter";
        secondaryReason = `If a whole house system is slightly above budget right now, a shower filter is a meaningful stepping stone — reducing chlorine at the shower head while you save for the full system.`;
        premiumId = "whole-house-carbon";
        premiumReason = `The best of both worlds: a whole house carbon filter combined with a reverse osmosis drinking water unit gives you chlorine-free water throughout your home plus ultra-pure drinking water. Combined systems typically range from $4,000–$7,000 installed.`;
      } else {
        primaryId = "whole-house-carbon";
        primaryReason = `A whole house filtration system is the gold standard for skin and hair concerns — it removes chlorine from every tap, shower, and bath in your home, directly addressing skin irritation, eczema, hair loss, and dandruff. With your budget, you can invest in a quality system built to last.`;
        secondaryId = "whole-house-carbon";
        secondaryReason = `For the complete solution, combine your whole house system with a reverse osmosis drinking water unit — you get chlorine-free water throughout your entire home plus the purest possible drinking water at the kitchen tap. Our most popular combination at $4,000–$7,000 installed.`;
        premiumId = "reverse-osmosis";
        premiumReason = `The premium setup: a high-capacity whole house carbon filter combined with an RO drinking water unit and a 3-way mixer tap (perfect for stone benchtops, delivering hot, cold, and filtered water from one tap) — the best water quality solution available for Australian homes.`;
      }
    }

    // ── B4: RO-ESSENTIAL CONCERNS (fluoride, PFAS, heavy metals, bacteria, microplastics) ──
    else if (f.needsRO) {
      if (f.wantsWholeHome || f.budget3kTo6k || f.budgetPremium) {
        primaryId = "reverse-osmosis";
        primaryReason = `A reverse osmosis system is the only household technology that effectively eliminates fluoride, PFAS, heavy metals, and microplastics from drinking water — carbon filters can reduce but not eliminate these contaminants. Installed under the kitchen sink with a dedicated faucet, at $800–$1,500 installed.`;
        secondaryId = "whole-house-carbon";
        secondaryReason = `Combining your RO drinking water system with a whole house carbon filter is the complete solution — ultra-pure drinking water at the kitchen tap plus chlorine-free water from every shower and tap in your home. Typically $4,000–$7,000 installed.`;
        premiumId = "whole-house-carbon";
        premiumReason = `The premium setup: a whole house carbon filter plus an RO unit with a 3-way mixer tap (ideal for stone benchtops) — delivering the best possible water quality for both drinking and whole-home use.`;
      } else {
        primaryId = "reverse-osmosis";
        primaryReason = `A reverse osmosis system is essential for your concerns — it's the only household technology that effectively removes fluoride, PFAS, heavy metals, and microplastics. Unlike carbon filters which reduce these contaminants, RO eliminates them. Installed under the kitchen sink at $800–$1,500.`;
        secondaryId = "under-sink-carbon";
        secondaryReason = `If an RO system isn't quite in budget, a quality under-sink carbon filter significantly improves your drinking water — though it reduces rather than eliminates fluoride and heavy metals.`;
        premiumId = "whole-house-carbon";
        premiumReason = `For the complete solution, add a whole house carbon filter to your RO system — chlorine-free water throughout your home plus ultra-pure drinking water at the kitchen. Typically $4,000–$7,000 installed together.`;
      }
    }

    // ── B5: CHLORINE / TASTE / GENERAL — TOWN WATER ─────────────────────────
    else if (f.hasChlorineConcern && f.isTownWater) {
      if (f.budgetUnder1k) {
        primaryId = "under-sink-carbon";
        primaryReason = `An under-sink carbon filter is the best value option within your budget — effectively removing chlorine and improving the taste and smell of your drinking water. A great first step toward better water quality.`;
        secondaryId = "tap-filter";
        secondaryReason = `A tap-mounted filter is the most affordable option — easy to install yourself without a plumber.`;
        premiumId = "whole-house-carbon";
        premiumReason = `When your budget allows, a whole house filtration system is the proper solution — removing chlorine from every tap and shower in your home. Entry-level systems from around $2,500 installed.`;
        if (f.isHighChlorineState) {
          warnings.push(
            `${answers.state} water is known for higher chlorine levels than most states. You're likely to notice a stronger improvement with whole house filtration when your budget allows.`
          );
        }
      } else if (f.budget1kTo3k) {
        primaryId = "whole-house-carbon";
        primaryReason = `A whole house carbon filtration system removes chlorine from every tap, shower, and appliance in your home — improving taste, reducing skin irritation, and protecting your hot water system and appliances from chlorine damage. Entry-level systems from around $2,500 installed.`;
        secondaryId = "under-sink-carbon";
        secondaryReason = `If a whole house system is at the top end of your budget, starting with an under-sink carbon filter is a solid step — and you can upgrade to whole house filtration when ready.`;
        premiumId = "reverse-osmosis";
        premiumReason = `Adding a reverse osmosis unit to your whole house system gives you the complete solution — chlorine-free water throughout your home plus ultra-pure drinking water at the kitchen tap with fluoride and heavy metal removal.`;
      } else {
        primaryId = "whole-house-carbon";
        primaryReason = `A whole house carbon filtration system is the right investment — removing chlorine from every tap, shower, and appliance in your home. With your budget, you can choose a quality system with a long service life and comprehensive filter stages.`;
        secondaryId = "reverse-osmosis";
        secondaryReason = `Pairing your whole house system with a reverse osmosis drinking water unit is our most popular combination — you get chlorine-free water throughout your home plus the purest possible drinking water at the kitchen. Typically $4,000–$7,000 installed together.`;
        premiumId = "whole-house-carbon";
        premiumReason = `The premium setup: a high-capacity whole house system combined with an RO unit and 3-way mixer tap (perfect for stone benchtops, providing hot, cold, and filtered water from one tap) — the ultimate water quality solution for Australian homes.`;
      }
    }

    // ── B6: WHOLE HOME INTENT (appliances, coverage) ────────────────────────
    else if (f.wantsWholeHome) {
      primaryId = "whole-house-carbon";
      primaryReason = `A whole house filtration system is exactly what you need — delivering filtered water to every tap, shower, and appliance in your home, protecting your hot water system, dishwasher, and washing machine while improving overall water quality.`;
      secondaryId = "reverse-osmosis";
      secondaryReason = `Adding a reverse osmosis drinking water unit is the popular upgrade — ultra-pure water at the kitchen tap on top of your whole house filtration. Combined systems typically range from $4,000–$7,000 installed.`;
      premiumId = "whole-house-carbon";
      premiumReason = `The complete premium solution: a high-capacity whole house system combined with an RO unit and 3-way mixer tap — the best of both worlds for drinking water purity and whole-home protection.`;
    }

    // ── B7: DEFAULT ──────────────────────────────────────────────────────────
    else {
      primaryId = "under-sink-carbon";
      primaryReason = `Based on your answers, an under-sink carbon filter is the ideal starting point — improving taste, removing chlorine, and delivering noticeably better drinking water at an accessible price.`;
      secondaryId = "reverse-osmosis";
      secondaryReason = `For a significant step up in water purity, a reverse osmosis system removes fluoride, heavy metals, and virtually all contaminants — the premium drinking water solution at $800–$1,500 installed.`;
      premiumId = "whole-house-carbon";
      premiumReason = `For complete home protection, a whole house carbon filter removes chlorine from every tap and shower — protecting your skin, hair, and appliances. The most comprehensive solution for Australian town water homes.`;
    }
  }

  // ── State-based warnings ─────────────────────────────────────────────────
  if (f.isHardWaterState && !f.hasConcern("hard-water") && f.canHaveWholeHome) {
    warnings.push(
      `${answers.state} has naturally harder water than most Australian states. Keep an eye out for white scale in your kettle, on taps, and on shower screens — these are signs a scale-reduction filter may benefit your home.`
    );
  }

  if (f.isHighChlorineState && !f.hasChlorineConcern && f.canHaveWholeHome) {
    warnings.push(
      `${answers.state} water is known for higher chlorine levels. Even without a strong taste or smell, a carbon filter can make a noticeable difference to your water quality and skin comfort.`
    );
  }

  const getRec = (id: string): Recommendation => {
    const rec = recommendations.find((r) => r.id === id);
    if (!rec) throw new Error(`Recommendation not found for id: ${id}`);
    return rec;
  };

  const primary = getRec(primaryId);
  const summary = `Hi ${answers.firstName}, based on your home, water source, and concerns, we recommend starting with a **${primary.title}**. ${primaryReason}`;

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