export interface SystemType {
  id: string;
  slug: string;
  name: string;
  whatItDoes: string;
  whatItDoesNot: string;
  whoItSuits: string;
  priceRange: string;
  maintenance: string;
  pros: string[];
  tradeoffs: string[];
  icon: string;
}

export const systemTypes: SystemType[] = [
  {
    id: "under-sink-carbon",
    slug: "under-sink-carbon-filtration",
    name: "Under Sink Sediment & Carbon Filtration",
    whatItDoes: "Installed beneath your kitchen sink, this system uses activated carbon to filter your drinking water. It effectively removes chlorine, sediment, volatile organic compounds (VOCs), and improves overall taste and odour.",
    whatItDoesNot: "Does not remove fluoride, dissolved minerals, heavy metals, or bacteria. Not suitable as a stand-alone solution for untreated water sources.",
    whoItSuits: "Homeowners and renters wanting better-tasting drinking water from a single tap. Great for apartments, townhouses, and budget-conscious households on town water.",
    priceRange: "$100 – $1000 installed",
    maintenance: "Filter replacement every 6–12 months ($80–$200/year). Simple to change yourself or have serviced.",
    pros: [
      "Affordable entry point to water filtration",
      "Easy to install — often DIY-friendly",
      "Effective chlorine and taste improvement",
      "Compact, fits under most sinks",
      "No power required",
    ],
    tradeoffs: [
      "Only filters one tap",
      "No fluoride or heavy metal removal",
      "Regular filter changes needed",
      "Not suitable for untreated water (tank, bore)",
    ],
    icon: "droplets",
  },
  {
    id: "reverse-osmosis",
    slug: "reverse-osmosis",
    name: "Reverse Osmosis (RO)",
    whatItDoes: "Uses a semi-permeable membrane combined with multiple pre- and post-filters to remove up to 99% of contaminants. Produces ultra-pure drinking water free from fluoride, heavy metals, chlorine, dissolved solids, and more.",
    whatItDoesNot: "Does not filter the whole house — only the tap it's connected to. Produces some wastewater during the filtration process. Does not soften water.",
    whoItSuits: "Health-conscious households, families concerned about fluoride or heavy metals, and anyone wanting the purest possible drinking water.",
    priceRange: "$800 – $2000 installed",
    maintenance: "Pre-filters every 6–12 months, RO membrane every 2–3 years. Annual cost typically $150–$350.",
    pros: [
      "Highest level of contaminant removal",
      "Removes fluoride and heavy metals",
      "Multi-stage filtration for thorough treatment",
      "Produces consistently pure drinking water",
    ],
    tradeoffs: [
      "Higher upfront cost",
      "Produces wastewater (typically 1:2 ratio)",
      "More complex maintenance with multiple stages",
      "Only covers one tap (kitchen)",
    ],
    icon: "shield-check",
  },
  {
    id: "whole-house-carbon",
    slug: "whole-house-carbon-filtration",
    name: "Whole House Filtration",
    whatItDoes: "Installed at the point of entry to your property, filtering all water before it reaches any tap, shower, or appliance. Removes chlorine, sediment, and improves water quality throughout the entire home.",
    whatItDoesNot: "Does not remove fluoride, heavy metals, or dissolved minerals. Does not produce ultra-pure drinking water. Not a substitute for UV treatment on untreated water sources.",
    whoItSuits: "Families wanting chlorine-free water from every tap and shower. Homeowners concerned about skin irritation, dry hair, or protecting appliances from sediment and chlorine.",
    priceRange: "$3,000 – $5,000 installed",
    maintenance: "Filter replacement every 6–12 months depending on water usage. Annual cost typically $200–$600.",
    pros: [
      "Filters every tap, shower, and appliance",
      "Removes chlorine throughout the home",
      "Helps with skin and hair concerns",
      "Protects hot water systems and appliances",
      "One system covers the whole property",
    ],
    tradeoffs: [
      "Higher upfront and installation cost",
      "Requires professional plumber installation",
      "No fluoride or heavy metal removal",
      "May need a separate drinking water system",
    ],
    icon: "home",
  },
  {
    id: "uv",
    slug: "uv-disinfection",
    name: "UV Disinfection Systems",
    whatItDoes: "Uses ultraviolet light to kill bacteria, viruses, and other microorganisms as water passes through the UV chamber. Essential for properties using rainwater, tank water, or bore water.",
    whatItDoesNot: "Does not remove chemicals, chlorine, sediment, fluoride, or minerals. Does not improve taste. Usually needs a pre-filter to work effectively on turbid water.",
    whoItSuits: "Rural and semi-rural properties on rainwater tanks or bore water. Any household not connected to treated town water who needs microbiological protection.",
    priceRange: "$800 – $2,500 installed",
    maintenance: "UV lamp replacement every 12 months ($100–$200). Pre-filter changes every 6–12 months. Annual cost typically $100–$250.",
    pros: [
      "Kills 99.99% of harmful microorganisms",
      "Chemical-free — no additives to your water",
      "Low running cost",
      "Essential for untreated water sources",
      "No change to water taste",
    ],
    tradeoffs: [
      "Does not remove chemical contaminants",
      "Requires power to operate",
      "Needs pre-filtration for best results",
      "Usually combined with other systems",
    ],
    icon: "zap",
  },
  {
    id: "water-softener",
    slug: "water-softeners",
    name: "Water Softeners",
    whatItDoes: "Uses ion exchange to remove calcium and magnesium minerals that cause hard water. Prevents scale buildup in pipes, on fixtures, and inside appliances. Improves soap lathering and reduces water spotting.",
    whatItDoesNot: "Does not filter or purify water. Does not remove chlorine, fluoride, heavy metals, or bacteria. Not a water filter — it's a water treatment system specifically for mineral hardness.",
    whoItSuits: "Homeowners in hard water areas experiencing scale buildup, spotty glassware, dry skin, and reduced appliance lifespan. Common in parts of SA, QLD, WA, and regional areas.",
    priceRange: "$2,000 – $6,000 installed",
    maintenance: "Salt replenishment every 1–3 months. Annual service recommended. Typical annual cost $150–$400.",
    pros: [
      "Eliminates hard water scale",
      "Extends appliance lifespan",
      "Softer skin and hair",
      "Better soap and detergent performance",
      "Reduces maintenance on fixtures",
    ],
    tradeoffs: [
      "Does not filter contaminants",
      "Requires regular salt top-ups",
      "Higher upfront investment",
      "Some water used during regeneration",
      "Usually needs a separate drinking water filter",
    ],
    icon: "waves",
  },
  {
    id: "hybrid",
    slug: "hybrid-systems",
    name: "Hybrid / Combo Systems",
    whatItDoes: "Combines two or more filtration technologies — typically a whole house filter with an under-sink RO or carbon system. Provides comprehensive coverage: general filtration for the whole property plus high-purity drinking water.",
    whatItDoesNot: "No single hybrid system does everything perfectly. Each component addresses specific concerns, and the overall system is only as good as its individual parts.",
    whoItSuits: "Families wanting the best overall water quality. Homeowners renovating and willing to invest in a complete solution. Properties with multiple bathrooms and a desire for both whole house and premium drinking water.",
    priceRange: "$4,000 – $6,500 installed",
    maintenance: "Multiple filter sets to maintain. Annual cost typically $350–$700 depending on system components.",
    pros: [
      "Most comprehensive water quality solution",
      "Covers every tap plus dedicated drinking water",
      "Addresses multiple concerns simultaneously",
      "Ideal for families and larger homes",
      "Can be customised to specific needs",
    ],
    tradeoffs: [
      "Highest upfront cost",
      "More complex to install and maintain",
      "Requires professional installation",
      "Multiple filter sets to track and replace",
    ],
    icon: "layers",
  },
];
