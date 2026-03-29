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

// ─── Scoring weights ────────────────────────────────────────────────────────
// Each system gets a score out of 100. Higher = better match.
// Systems are scored across 5 dimensions:
//   1. Concerns match
//   2. Coverage match
//   3. Water source match
//   4. Budget match
//   5. Household / property suitability

interface SystemScore {
  id: string;
  score: number;
  reasons: string[];
}

const SYSTEM_IDS = [
  "under-sink-carbon",
  "reverse-osmosis",
  "shower-filter",
  "whole-house",
  "water-softener",
  "uv-system",
  "tap-filter",
  "camping-filter",
  "tank-filter",
  "alkaline-filter",
] as const;

type SystemId = (typeof SYSTEM_IDS)[number];

function scoreSystem(id: SystemId, answers: QuizAnswers): SystemScore {
  const { concerns, coverage, budget, priorities, waterSource, ownershipStatus, householdSize, bathrooms, propertyType, state } = answers;

  const hasConcern = (c: string) => concerns.includes(c);
  const hasPriority = (p: string) => priorities.includes(p);
  const isRenter = ownershipStatus === "Rent";
  const isApartment = propertyType === "Apartment";
  const householdNum = householdSize === "5+" ? 5 : parseInt(householdSize || "1");
  const bathroomNum = bathrooms === "4+" ? 4 : parseInt(bathrooms || "1");
  const isRainOrBoreOrTank = ["rainwater", "tank-water", "bore-water"].includes(waterSource);
  const isTownWater = waterSource === "town-water";

  let score = 0;
  const reasons: string[] = [];

  // ── DISQUALIFIERS (hard rules) ───────────────────────────────────────────
  // Renters and apartment dwellers can't install whole house or softener systems
  if (isRenter || isApartment) {
    if (["whole-house", "water-softener"].includes(id)) {
      return { id, score: -1, reasons: ["Not suitable for renters or apartments"] };
    }
  }

  // Camping filter is only relevant if they're not looking for a home solution
  if (id === "camping-filter") {
    if (coverage !== "one-tap" || householdNum > 2) {
      return { id, score: -1, reasons: ["Camping filters are not suitable for permanent home use"] };
    }
  }

  // Tank filter only relevant for tank/rainwater/bore water sources
  if (id === "tank-filter") {
    if (!isRainOrBoreOrTank) {
      return { id, score: -1, reasons: ["Tank filters are designed for rainwater/bore/tank water sources"] };
    }
  }

  // UV system is most relevant for non-town water sources
  if (id === "uv-system" && isTownWater && !hasConcern("bacteria")) {
    score -= 20;
  }

  // ── CONCERN SCORING ──────────────────────────────────────────────────────
  switch (id) {
    case "under-sink-carbon":
      if (hasConcern("taste")) { score += 20; reasons.push("Excellent at improving taste"); }
      if (hasConcern("chlorine")) { score += 20; reasons.push("Highly effective at removing chlorine"); }
      if (hasConcern("drinking-quality")) { score += 15; reasons.push("Great for drinking water quality"); }
      if (hasConcern("heavy-metals")) { score += 10; reasons.push("Reduces some heavy metals"); }
      if (hasConcern("fluoride")) { score -= 10; } // RO is better for fluoride
      if (hasConcern("bacteria")) { score -= 15; } // UV or tank filter is better
      break;

    case "reverse-osmosis":
      if (hasConcern("fluoride")) { score += 30; reasons.push("Most effective household method for fluoride removal"); }
      if (hasConcern("heavy-metals")) { score += 25; reasons.push("Removes heavy metals including lead and arsenic"); }
      if (hasConcern("drinking-quality")) { score += 20; reasons.push("Produces the highest purity drinking water"); }
      if (hasConcern("taste")) { score += 15; reasons.push("Dramatically improves taste by removing dissolved solids"); }
      if (hasConcern("chlorine")) { score += 10; reasons.push("Removes chlorine effectively"); }
      if (hasConcern("bacteria")) { score += 10; reasons.push("Reduces some bacteria and microorganisms"); }
      break;

    case "shower-filter":
      if (hasConcern("skin-shower")) { score += 40; reasons.push("Specifically designed to reduce chlorine in shower water"); }
      if (hasConcern("chlorine")) { score += 20; reasons.push("Removes chlorine from shower water"); }
      if (hasConcern("hard-water")) { score += 10; reasons.push("Helps reduce scale in shower"); }
      if (!hasConcern("skin-shower") && !hasConcern("chlorine")) { score -= 20; }
      break;

    case "whole-house":
      if (hasConcern("whole-home")) { score += 30; reasons.push("Filters every tap, shower, and appliance in your home"); }
      if (hasConcern("chlorine")) { score += 25; reasons.push("Removes chlorine from all water in your home"); }
      if (hasConcern("skin-shower")) { score += 20; reasons.push("Improves shower water quality throughout the home"); }
      if (hasConcern("appliance")) { score += 20; reasons.push("Protects appliances from sediment and scale"); }
      if (hasConcern("taste")) { score += 15; reasons.push("Improves taste at every tap"); }
      if (hasConcern("hard-water")) { score += 10; reasons.push("Reduces scale buildup on appliances and fixtures"); }
      if (hasConcern("bacteria") && isRainOrBoreOrTank) { score += 15; reasons.push("Works well combined with UV for tank/bore water"); }
      break;

    case "water-softener":
      if (hasConcern("hard-water")) { score += 50; reasons.push("The most effective solution for hard water and scale"); }
      if (hasConcern("appliance")) { score += 20; reasons.push("Significantly extends the life of appliances"); }
      if (hasConcern("skin-shower")) { score += 15; reasons.push("Soft water is gentler on skin and hair"); }
      if (!hasConcern("hard-water")) { score -= 20; } // Softener not very useful without hard water concern
      break;

    case "uv-system":
      if (hasConcern("bacteria")) { score += 50; reasons.push("UV is the gold standard for killing bacteria and viruses"); }
      if (isRainOrBoreOrTank) { score += 20; reasons.push("Essential for rainwater, tank, and bore water sources"); }
      if (!hasConcern("bacteria") && isTownWater) { score -= 30; }
      break;

    case "tap-filter":
      if (hasConcern("taste")) { score += 15; reasons.push("Easy tap-mounted filter for better tasting water"); }
      if (hasConcern("chlorine")) { score += 15; reasons.push("Reduces chlorine at the tap"); }
      if (hasConcern("drinking-quality")) { score += 10; reasons.push("Simple solution for cleaner drinking water"); }
      break;

    case "camping-filter":
      if (hasConcern("bacteria")) { score += 20; reasons.push("Portable filtration for bacteria removal"); }
      if (hasConcern("drinking-quality")) { score += 10; reasons.push("Portable option for drinking water quality"); }
      break;

    case "tank-filter":
      if (isRainOrBoreOrTank) { score += 40; reasons.push("Specifically designed to filter rainwater and tank water"); }
      if (hasConcern("bacteria")) { score += 20; reasons.push("Removes sediment and contaminants from tank water"); }
      if (hasConcern("taste")) { score += 15; reasons.push("Improves taste of rainwater and tank water"); }
      if (hasConcern("drinking-quality")) { score += 15; reasons.push("Makes tank water safe for drinking"); }
      break;

    case "alkaline-filter":
      if (hasConcern("taste")) { score += 15; reasons.push("Improves taste and adds beneficial minerals"); }
      if (hasConcern("drinking-quality")) { score += 15; reasons.push("Raises pH and adds minerals to drinking water"); }
      if (hasPriority("premium-appearance")) { score += 10; reasons.push("Premium aesthetic appeal"); }
      if (hasConcern("fluoride")) { score -= 10; } // RO is much better for fluoride
      break;
  }

  // ── COVERAGE SCORING ─────────────────────────────────────────────────────
  const drinkingOnlyCoverage = ["drinking-water", "kitchen", "one-tap", "under-sink"].includes(coverage);
  const wholeHouseCoverage = ["whole-house", "whole-house-plus"].includes(coverage);

  switch (id) {
    case "under-sink-carbon":
    case "reverse-osmosis":
    case "alkaline-filter":
      if (drinkingOnlyCoverage) score += 20;
      if (wholeHouseCoverage) score -= 10;
      break;
    case "tap-filter":
      if (coverage === "one-tap" || coverage === "drinking-water") score += 20;
      if (wholeHouseCoverage) score -= 20;
      break;
    case "shower-filter":
      if (coverage === "whole-house" || coverage === "whole-house-plus") score += 10;
      if (drinkingOnlyCoverage) score -= 10;
      break;
    case "whole-house":
      if (wholeHouseCoverage) score += 25;
      if (drinkingOnlyCoverage) score -= 15;
      break;
    case "water-softener":
      if (wholeHouseCoverage) score += 15;
      break;
    case "uv-system":
      if (wholeHouseCoverage || coverage === "whole-house-plus") score += 10;
      break;
  }

  // ── BUDGET SCORING ───────────────────────────────────────────────────────
  // Approximate cost tiers: tap-filter/shower < carbon < alkaline < RO < UV < softener < whole-house
  switch (budget) {
    case "under-1000":
      if (["tap-filter", "shower-filter", "camping-filter"].includes(id)) score += 20;
      if (["under-sink-carbon", "alkaline-filter", "tank-filter"].includes(id)) score += 10;
      if (["reverse-osmosis", "uv-system"].includes(id)) score -= 5;
      if (["whole-house", "water-softener"].includes(id)) score -= 20;
      break;
    case "1000-3000":
      if (["under-sink-carbon", "reverse-osmosis", "alkaline-filter", "uv-system"].includes(id)) score += 15;
      if (["whole-house", "water-softener"].includes(id)) score += 5;
      if (["tap-filter", "camping-filter"].includes(id)) score -= 5;
      break;
    case "3000-6000":
      if (["whole-house", "water-softener", "reverse-osmosis"].includes(id)) score += 20;
      if (["tap-filter", "shower-filter", "camping-filter"].includes(id)) score -= 10;
      break;
    case "6000-plus":
      if (["whole-house", "water-softener"].includes(id)) score += 25;
      if (["tap-filter", "shower-filter", "camping-filter", "tap-filter"].includes(id)) score -= 20;
      break;
    case "not-sure":
      // No budget adjustment — let concerns and coverage drive it
      break;
  }

  // ── HOUSEHOLD SIZE SCORING ───────────────────────────────────────────────
  if (householdNum >= 4) {
    if (["whole-house", "water-softener"].includes(id)) score += 10;
    if (["tap-filter", "camping-filter"].includes(id)) score -= 10;
  }
  if (householdNum <= 2 && isApartment) {
    if (["tap-filter", "under-sink-carbon", "alkaline-filter"].includes(id)) score += 10;
  }

  // ── BATHROOM COUNT SCORING ───────────────────────────────────────────────
  if (bathroomNum >= 3) {
    if (["whole-house", "water-softener"].includes(id)) score += 10;
    if (hasConcern("skin-shower") && id === "shower-filter") score += 10; // multiple showers
  }

  // ── PRIORITY SCORING ────────────────────────────────────────────────────
  if (hasPriority("lowest-cost")) {
    if (["tap-filter", "shower-filter", "under-sink-carbon"].includes(id)) score += 15;
    if (["whole-house", "water-softener"].includes(id)) score -= 10;
  }
  if (hasPriority("lowest-maintenance")) {
    if (["whole-house", "uv-system"].includes(id)) score += 10;
    if (["tap-filter", "camping-filter"].includes(id)) score -= 5;
  }
  if (hasPriority("strongest-filtration")) {
    if (["reverse-osmosis", "uv-system", "whole-house"].includes(id)) score += 15;
    if (["tap-filter", "shower-filter"].includes(id)) score -= 10;
  }
  if (hasPriority("premium-appearance")) {
    if (["reverse-osmosis", "alkaline-filter", "whole-house"].includes(id)) score += 10;
    if (["tap-filter", "camping-filter"].includes(id)) score -= 10;
  }
  if (hasPriority("best-warranty")) {
    if (["whole-house", "reverse-osmosis", "water-softener"].includes(id)) score += 10;
  }
  if (hasPriority("local-support")) {
    // Neutral — vendor matching handles this
  }
  if (hasPriority("easy-install")) {
    if (["tap-filter", "shower-filter", "camping-filter"].includes(id)) score += 15;
    if (["whole-house", "water-softener"].includes(id)) score -= 10;
  }

  // ── STATE / WATER SOURCE CONTEXT ─────────────────────────────────────────
  // Melbourne and Adelaide have notably chlorinated town water
  if (["VIC", "SA"].includes(state) && isTownWater) {
    if (hasConcern("chlorine") || hasConcern("taste")) {
      if (["under-sink-carbon", "whole-house"].includes(id)) score += 10;
    }
  }
  // QLD bore water often has high iron/bacteria
  if (state === "QLD" && waterSource === "bore-water") {
    if (["uv-system", "tank-filter", "whole-house"].includes(id)) score += 10;
  }
  // WA has notoriously hard water
  if (state === "WA" && isTownWater) {
    if (id === "water-softener") score += 15;
    if (id === "whole-house") score += 10;
  }

  return { id, score: Math.max(score, 0), reasons };
}

// ── Reason generator ─────────────────────────────────────────────────────────
function buildReason(id: SystemId, answers: QuizAnswers, rank: "primary" | "secondary" | "premium"): string {
  const { concerns, coverage, budget, priorities, waterSource, ownershipStatus, state } = answers;
  const hasConcern = (c: string) => concerns.includes(c);
  const isRenter = ownershipStatus === "Rent";

  const coverageLabel: Record<string, string> = {
    "drinking-water": "your drinking water",
    "kitchen": "your kitchen",
    "one-tap": "a single tap",
    "under-sink": "under your sink",
    "whole-house": "your whole home",
    "whole-house-plus": "your whole home and drinking water",
  };
  const coverageText = coverageLabel[coverage] || "your home";

  const reasonMap: Record<SystemId, Record<string, string>> = {
    "under-sink-carbon": {
      primary: `An under-sink carbon filter is the best match for your needs — it's highly effective at improving taste and removing chlorine from ${coverageText}, and fits within your budget.`,
      secondary: `If you want a simple, cost-effective upgrade to ${coverageText}, an under-sink carbon filter delivers real improvement without a large investment.`,
      premium: `For the most complete setup, pair your primary system with an under-sink carbon filter to ensure the highest quality drinking water at the kitchen tap.`,
    },
    "reverse-osmosis": {
      primary: `Reverse osmosis is the strongest match for your concerns — it removes fluoride, heavy metals, and dissolved solids to produce the purest possible drinking water for ${coverageText}.`,
      secondary: `If you want a step up in purity — particularly for fluoride and heavy metal removal — a reverse osmosis system is the most effective upgrade available.`,
      premium: `A premium reverse osmosis system with a remineralisation stage gives you ultra-pure water with added beneficial minerals, ideal for a health-conscious household.`,
    },
    "shower-filter": {
      primary: `A shower filter is the most targeted solution for your skin and hair concerns — it removes chlorine directly at the shower head without a major installation.`,
      secondary: `Adding a shower filter to your setup is a low-cost way to reduce chlorine exposure during showering, which can make a noticeable difference to skin and hair.`,
      premium: `For multiple bathrooms, a whole house filter provides the same chlorine removal benefit at every shower and tap throughout your home.`,
    },
    "whole-house": {
      primary: `A whole house filtration system is the right solution for your needs — it delivers filtered water to every tap, shower, and appliance in your home, addressing your concerns at the source.`,
      secondary: `Upgrading to a whole house system means every tap and shower benefits from filtered water, giving you consistent quality throughout ${coverageText}.`,
      premium: `A premium whole house system with high-capacity filters and a long service life is the most comprehensive investment for your home's water quality.`,
    },
    "water-softener": {
      primary: `A water softener is the most effective solution for hard water — it removes the calcium and magnesium causing scale buildup, protecting your appliances and improving how water feels on your skin.`,
      secondary: `If scale and hard water are ongoing issues, a water softener is a targeted solution that will noticeably extend the life of your appliances and hot water system.`,
      premium: `Combining a water softener with a whole house carbon filter gives you soft, clean water from every outlet in your home.`,
    },
    "uv-system": {
      primary: `With your water source${state ? ` in ${state}` : ""}, UV disinfection is essential — it's the most reliable way to eliminate bacteria and viruses from ${waterSource === "bore-water" ? "bore" : "tank/rainwater"} without chemicals.`,
      secondary: `Adding a UV system to your filtration setup ensures microbiological safety — particularly important for ${waterSource} sources.`,
      premium: `For complete peace of mind, a UV system combined with a whole house carbon filter and sediment pre-filter provides the safest possible water from your ${waterSource} source.`,
    },
    "tap-filter": {
      primary: `A tap-mounted filter is the simplest and most affordable way to improve your drinking water — easy to install yourself and no plumber required${isRenter ? ", making it ideal for renters" : ""}.`,
      secondary: `A tap filter is a great low-commitment starting point if you're not ready for an under-sink system — it delivers real improvement at minimal cost.`,
      premium: `For a more permanent solution with better filtration, upgrading from a tap filter to an under-sink carbon or reverse osmosis system is the natural next step.`,
    },
    "camping-filter": {
      primary: `A portable camping filter suits your setup — it's flexible, requires no installation, and delivers clean drinking water wherever you need it.`,
      secondary: `As a backup or portable option, a camping filter can complement your main system for travel or outdoor use.`,
      premium: `For a permanent home solution, upgrading to an under-sink or whole house system provides better filtration and convenience than a portable unit.`,
    },
    "tank-filter": {
      primary: `A tank/rainwater filter is specifically designed for your water source — it removes sediment, organic matter, and contaminants before water enters your home, making it safe for everyday use.`,
      secondary: `Adding a dedicated tank filter to your setup is the most important step for ensuring your rainwater or bore water is safe and clear throughout your home.`,
      premium: `For the safest possible rainwater setup, combine a tank filter with a UV disinfection system and an under-sink filter for drinking water — the three-stage approach used by water quality experts.`,
    },
    "alkaline-filter": {
      primary: `An alkaline filter improves taste, raises your water's pH, and adds beneficial minerals — a great option if you want higher quality drinking water with a health focus.`,
      secondary: `An alkaline filter is a popular upgrade from standard carbon filtration — it produces crisp, mineral-rich drinking water that many people prefer to tap water.`,
      premium: `For the ultimate drinking water experience, combining a reverse osmosis system with an alkaline remineralisation stage gives you ultra-pure, mineral-balanced water.`,
    },
  };

  return reasonMap[id]?.[rank] ?? `This system is well suited to your household's water needs and priorities.`;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateRecommendations(answers: QuizAnswers): RecommendationResult {
  // Score every system
  const scores: SystemScore[] = SYSTEM_IDS.map((id) => scoreSystem(id, answers));

  // Filter out disqualified systems (score = -1)
  const eligible = scores.filter((s) => s.score >= 0);

  // Sort by score descending
  eligible.sort((a, b) => b.score - a.score);

  // Pick top 3 — ensure they are distinct
  const [first, second, third] = eligible;

  // Fallback safety — should never happen but protects against empty data
  const primaryId = (first?.id ?? "under-sink-carbon") as SystemId;
  const secondaryId = (second?.id ?? "reverse-osmosis") as SystemId;
  const premiumId = (third?.id ?? "whole-house") as SystemId;

  // Map engine system IDs to recommendation data IDs
  const idMap: Record<string, string> = {
    "whole-house": "whole-house-carbon",
  };

  const getRec = (id: string): Recommendation => {
    const mappedId = idMap[id] || id;
    const rec = recommendations.find((r) => r.id === mappedId);
    if (!rec) throw new Error(`Recommendation not found for id: ${id}`);
    return rec;
  };

  const primaryReason = buildReason(primaryId, answers, "primary");
  const secondaryReason = buildReason(secondaryId, answers, "secondary");
  const premiumReason = buildReason(premiumId, answers, "premium");

  const primary = getRec(primaryId);
  const summary = `Based on your household profile, water concerns, and priorities, we recommend a **${primary.title}** as your best match. ${primaryReason}`;

  return {
    primary,
    secondary: getRec(secondaryId),
    premium: getRec(premiumId),
    primaryReason,
    secondaryReason,
    premiumReason,
    summary,
  };
}
