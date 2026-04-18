export interface Provider {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  location: {
    /** Effective state codes after expanding metro tokens (used for matching). */
    states: string[];
    /** Raw saved coverage tokens (state codes + METRO_* tokens) for friendly labels. */
    regions?: string[];
    /** @deprecated Use serviceBase + serviceRadiusKm instead */
    postcodeRanges?: string[];
    serviceBase?: {
      suburb: string;
      postcode: string;
      state: string;
      lat: number;
      lng: number;
    };
    serviceRadiusKm?: number;
  };
  systemTypes: string[];
  brands: string[];
  priceRange: "budget" | "mid" | "premium";
  rating: number;
  reviewCount: number;
  yearsInBusiness: number;
  certifications: string[];
  highlights: string[];
  availableForQuote: boolean;
  responseTime: string;
  warranty: string;
  website?: string;
  phone?: string;
}

// Note: Static seed providers removed — all production data lives in Supabase.
// Kept as an empty export for any legacy imports.
export const providers: Provider[] = [];
