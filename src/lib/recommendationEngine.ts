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
}

const getRec = (id: string) => recommendations.find((r) => r.id === id)!;

export function generateRecommendations(answers: QuizAnswers): RecommendationResult {
  const { concerns, coverage, budget, priorities, waterSource } = answers;

  const hasConcern = (c: string) => concerns.includes(c);
  const hasPriority = (p: string) => priorities.includes(p);

  let primaryId = "under-sink-carbon";
  let secondaryId = "reverse-osmosis";
  let premiumId = "whole-house-combo";

  let primaryReason = "";
  let secondaryReason = "";
  let premiumReason = "";
  let summary = "";

  // Fluoride + drinking water only / kitchen only → RO primary
  if (hasConcern("fluoride") && ["drinking-water", "kitchen", "one-tap", "under-sink"].includes(coverage)) {
    primaryId = "reverse-osmosis";
    primaryReason = "You're concerned about fluoride and want filtered drinking water. Reverse osmosis is the most effective household method for fluoride removal.";
    secondaryId = "under-sink-carbon";
    secondaryReason = "If fluoride removal isn't essential, a quality carbon filter is a more affordable option for improving taste and removing chlorine.";
    premiumId = "whole-house-combo";
    premiumReason = "For the ultimate setup, combine a whole house filter with a dedicated RO system at the kitchen for complete home coverage plus ultra-pure drinking water.";
  }
  // Taste/chlorine + under sink or kitchen → carbon primary
  else if ((hasConcern("taste") || hasConcern("chlorine")) && ["drinking-water", "kitchen", "one-tap", "under-sink"].includes(coverage)) {
    primaryId = "under-sink-carbon";
    primaryReason = "You're looking to improve taste and remove chlorine from your drinking water. An under-sink carbon filter is the most cost-effective solution.";
    secondaryId = "reverse-osmosis";
    secondaryReason = "If you want even higher purity — including fluoride and heavy metal removal — a reverse osmosis system is the step up.";
    premiumId = "whole-house-combo";
    premiumReason = "For filtered water from every tap and shower plus premium drinking water, a whole house combo system covers everything.";
  }
  // Whole house concerns → whole house carbon
  else if ((hasConcern("whole-home") || hasConcern("chlorine") || hasConcern("skin-shower")) && ["whole-house", "whole-house-plus"].includes(coverage)) {
    primaryId = "whole-house-carbon";
    primaryReason = "You want better water throughout your entire home. A whole house carbon filter removes chlorine and sediment from every tap, shower, and appliance.";
    secondaryId = "whole-house-combo";
    secondaryReason = "Adding a dedicated drinking water system at the kitchen gives you the best of both worlds — whole house filtration plus ultra-pure drinking water.";
    premiumId = "whole-house-combo";
    premiumReason = "A premium whole house combo system with top-tier components provides the most comprehensive water quality solution for your home.";
  }
  // Hard water / scale → softener
  else if (hasConcern("hard-water")) {
    primaryId = "water-softener";
    primaryReason = "Hard water and scale buildup is your main concern. A water softener specifically targets the calcium and magnesium minerals causing the problem.";
    secondaryId = "whole-house-carbon";
    secondaryReason = "If you also want chlorine removal throughout the home, a whole house carbon filter addresses general water quality.";
    premiumId = "whole-house-combo";
    premiumReason = "For comprehensive treatment, combine a softener with a whole house filter and drinking water system.";
  }
  // Bacteria + non-town water → UV
  else if (hasConcern("bacteria") && ["rainwater", "tank-water", "bore-water"].includes(waterSource)) {
    primaryId = "uv-system";
    primaryReason = "With your water source and concern about bacteria, UV disinfection is essential for killing harmful microorganisms.";
    secondaryId = "whole-house-carbon";
    secondaryReason = "Pairing UV with a whole house carbon filter provides both microbial protection and improved water quality.";
    premiumId = "whole-house-combo";
    premiumReason = "A full setup with UV, whole house filtration, and a dedicated drinking water system gives you complete peace of mind.";
  }
  // Whole house + drinking water → combo
  else if (coverage === "whole-house-plus") {
    primaryId = "whole-house-combo";
    primaryReason = "You want filtered water from every tap plus high-quality drinking water. A whole house combo system is designed exactly for this.";
    secondaryId = "whole-house-carbon";
    secondaryReason = "If budget is a consideration, starting with just the whole house filter and adding a drinking water system later is a smart phased approach.";
    premiumId = "whole-house-combo";
    premiumReason = "A premium combo system with top-tier components and extended warranty provides the best long-term value and performance.";
  }
  // Default / not sure
  else {
    primaryId = "under-sink-carbon";
    primaryReason = "Based on your needs, an under-sink carbon filter is a great starting point. It's affordable, easy to install, and effective for improving your drinking water.";
    secondaryId = "reverse-osmosis";
    secondaryReason = "For deeper filtration including fluoride and heavy metals, a reverse osmosis system provides higher-purity drinking water.";
    premiumId = "whole-house-combo";
    premiumReason = "For the most complete solution, a whole house system combined with a dedicated drinking water filter covers every tap and every need.";
  }

  // Budget adjustments
  if (budget === "under-1000") {
    if (primaryId !== "under-sink-carbon") {
      secondaryId = primaryId;
      secondaryReason = primaryReason.replace("You're", "When budget allows, you're");
      primaryId = "under-sink-carbon";
      primaryReason = "With your budget in mind, an under-sink carbon filter is the best value option. It delivers real improvement to your drinking water without overspending.";
    }
  }

  // Premium priority adjustments
  if (hasPriority("premium-appearance") || hasPriority("best-warranty") || hasPriority("strongest-filtration")) {
    premiumReason = "Based on your priorities for premium quality, strong performance, and reliable warranty, we've highlighted the premium pathway for your consideration.";
  }

  // Summary
  const primary = getRec(primaryId);
  summary = `Based on your household profile, water concerns, and preferences, we recommend starting with a **${primary.title}**. ${primaryReason}`;

  return {
    primary: getRec(primaryId),
    secondary: getRec(secondaryId),
    premium: getRec(premiumId),
    primaryReason,
    secondaryReason,
    premiumReason,
    summary,
  };
}
