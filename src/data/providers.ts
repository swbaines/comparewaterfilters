export interface Provider {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  location: {
    states: string[];        // which states they service
    postcodeRanges?: string[]; // optional specific postcode ranges
  };
  systemTypes: string[];     // recommendation IDs they install
  brands: string[];
  priceRange: "budget" | "mid" | "premium";
  rating: number;            // out of 5
  reviewCount: number;
  yearsInBusiness: number;
  certifications: string[];
  highlights: string[];
  availableForQuote: boolean;
  responseTime: string;      // e.g. "Within 24 hours"
  warranty: string;
  website?: string;
  phone?: string;
}

export const providers: Provider[] = [
  {
    id: "pure-flow-nsw",
    name: "PureFlow Water Systems",
    slug: "pureflow-water-systems",
    description: "Sydney-based water filtration specialists with over 15 years of experience installing residential and commercial systems across NSW.",
    location: { states: ["NSW"], postcodeRanges: ["2000-2999"] },
    systemTypes: ["under-sink-carbon", "reverse-osmosis", "whole-house-carbon", "whole-house-combo"],
    brands: ["Puretec", "Aquasana", "3M", "Pentek"],
    priceRange: "mid",
    rating: 4.8,
    reviewCount: 312,
    yearsInBusiness: 15,
    certifications: ["WaterMark Licensed", "Master Plumber", "Puretec Certified Installer"],
    highlights: ["Free water quality test", "Same-day installation available", "12-month warranty on labour"],
    availableForQuote: true,
    responseTime: "Within 24 hours",
    warranty: "12 months labour, manufacturer warranty on products",
    phone: "02 9123 4567",
  },
  {
    id: "aqua-guard-vic",
    name: "AquaGuard Melbourne",
    slug: "aquaguard-melbourne",
    description: "Melbourne's trusted water filtration team. Specialising in whole house systems and reverse osmosis installations for families across Victoria.",
    location: { states: ["VIC"], postcodeRanges: ["3000-3999"] },
    systemTypes: ["under-sink-carbon", "reverse-osmosis", "whole-house-carbon", "whole-house-combo", "water-softener"],
    brands: ["Puretec", "WaterCo", "Davey", "Filtersafe"],
    priceRange: "mid",
    rating: 4.7,
    reviewCount: 248,
    yearsInBusiness: 12,
    certifications: ["WaterMark Licensed", "Licensed Plumber VIC", "WaterCo Accredited"],
    highlights: ["Free in-home consultation", "Interest-free payment plans", "After-hours available"],
    availableForQuote: true,
    responseTime: "Within 24 hours",
    warranty: "24 months labour, manufacturer warranty on products",
    phone: "03 9876 5432",
  },
  {
    id: "clean-water-qld",
    name: "Clean Water Co. QLD",
    slug: "clean-water-co-qld",
    description: "Queensland's leading residential water treatment company. From under-sink filters to full whole house setups, we've got South East QLD covered.",
    location: { states: ["QLD"], postcodeRanges: ["4000-4999"] },
    systemTypes: ["under-sink-carbon", "reverse-osmosis", "whole-house-carbon", "whole-house-combo", "uv-system"],
    brands: ["Puretec", "Aquasana", "Watts", "UV Guard"],
    priceRange: "mid",
    rating: 4.6,
    reviewCount: 189,
    yearsInBusiness: 10,
    certifications: ["WaterMark Licensed", "QBCC Licensed", "Puretec Accredited"],
    highlights: ["Serving SE QLD & Gold Coast", "Tank & bore water specialists", "Flexible scheduling"],
    availableForQuote: true,
    responseTime: "Within 48 hours",
    warranty: "12 months labour, manufacturer warranty on products",
    phone: "07 3456 7890",
  },
  {
    id: "filter-smart-national",
    name: "FilterSmart Australia",
    slug: "filtersmart-australia",
    description: "National provider offering premium whole house filtration solutions with a focus on salt-free softening and eco-friendly systems shipped and installed Australia-wide.",
    location: { states: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"] },
    systemTypes: ["whole-house-carbon", "whole-house-combo", "water-softener"],
    brands: ["FilterSmart", "Springwell", "Aquasana"],
    priceRange: "premium",
    rating: 4.9,
    reviewCount: 456,
    yearsInBusiness: 20,
    certifications: ["WaterMark Licensed", "NSF Certified", "ISO 9001"],
    highlights: ["Australia-wide service network", "Premium brands only", "10-year warranty available", "Eco-friendly systems"],
    availableForQuote: true,
    responseTime: "Within 24 hours",
    warranty: "Up to 10 years on select systems",
    phone: "1300 123 456",
  },
  {
    id: "tap-pure-sa",
    name: "TapPure Adelaide",
    slug: "tappure-adelaide",
    description: "South Australia's go-to for under-sink and reverse osmosis systems. Affordable, reliable, and locally owned for over 8 years.",
    location: { states: ["SA"], postcodeRanges: ["5000-5999"] },
    systemTypes: ["under-sink-carbon", "reverse-osmosis"],
    brands: ["Puretec", "3M", "Omnipure"],
    priceRange: "budget",
    rating: 4.5,
    reviewCount: 134,
    yearsInBusiness: 8,
    certifications: ["WaterMark Licensed", "Licensed Plumber SA"],
    highlights: ["Most affordable in SA", "Quick installations", "Senior discounts available"],
    availableForQuote: true,
    responseTime: "Within 24 hours",
    warranty: "12 months labour, manufacturer warranty on products",
    phone: "08 7123 4567",
  },
  {
    id: "hydro-clear-wa",
    name: "HydroClear Perth",
    slug: "hydroclear-perth",
    description: "Perth's specialist in hard water solutions and whole house filtration. Serving metro and regional WA with expert water quality assessments.",
    location: { states: ["WA"], postcodeRanges: ["6000-6999"] },
    systemTypes: ["whole-house-carbon", "whole-house-combo", "water-softener", "reverse-osmosis"],
    brands: ["WaterCo", "Puretec", "Davey", "Kinetico"],
    priceRange: "mid",
    rating: 4.7,
    reviewCount: 201,
    yearsInBusiness: 14,
    certifications: ["WaterMark Licensed", "Master Plumber WA", "Kinetico Certified"],
    highlights: ["Hard water specialists", "Free water testing", "Regional WA service available"],
    availableForQuote: true,
    responseTime: "Within 48 hours",
    warranty: "24 months labour, manufacturer warranty on products",
    phone: "08 9234 5678",
  },
  {
    id: "country-water-rural",
    name: "Country Water Solutions",
    slug: "country-water-solutions",
    description: "Specialists in rural and regional water treatment. Experts in tank water, bore water, UV systems, and whole property solutions for properties outside metro areas.",
    location: { states: ["NSW", "VIC", "QLD", "SA"] },
    systemTypes: ["uv-system", "whole-house-carbon", "whole-house-combo", "reverse-osmosis"],
    brands: ["UV Guard", "Puretec", "Davey", "Rainfresh"],
    priceRange: "mid",
    rating: 4.6,
    reviewCount: 167,
    yearsInBusiness: 18,
    certifications: ["WaterMark Licensed", "UV Guard Accredited", "Rural Water Specialist"],
    highlights: ["Tank & bore water experts", "Regional travel included", "Emergency callouts", "Water testing service"],
    availableForQuote: true,
    responseTime: "Within 48 hours",
    warranty: "12 months labour, manufacturer warranty on products",
    phone: "1300 789 012",
  },
  {
    id: "elite-water-premium",
    name: "Elite Water Systems",
    slug: "elite-water-systems",
    description: "Premium water treatment for discerning homeowners. We install only the best brands with white-glove service across Sydney and Melbourne.",
    location: { states: ["NSW", "VIC"] },
    systemTypes: ["whole-house-combo", "reverse-osmosis", "water-softener", "whole-house-carbon"],
    brands: ["Kinetico", "Everpure", "3M", "Aquasana"],
    priceRange: "premium",
    rating: 4.9,
    reviewCount: 89,
    yearsInBusiness: 11,
    certifications: ["WaterMark Licensed", "Master Plumber", "Kinetico Premium Dealer", "NSF Certified"],
    highlights: ["White-glove installation", "Premium brands exclusively", "Concierge maintenance service", "Smart monitoring available"],
    availableForQuote: true,
    responseTime: "Within 24 hours",
    warranty: "Up to 10 years on select systems, lifetime support",
    phone: "02 8765 4321",
  },
];
