import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@/data/providers";

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async (): Promise<Provider[]> => {
      const { data, error } = await supabase
        .from("providers_public")
        .select("id, name, slug, description, logo, states, postcode_ranges, system_types, brands, price_range, rating, review_count, years_in_business, certifications, highlights, available_for_quote, response_time, warranty, website, phone, approval_status")
        .eq("available_for_quote", true)
        .eq("approval_status", "approved" as any);

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        logo: row.logo ?? undefined,
        location: {
          states: row.states,
          postcodeRanges: row.postcode_ranges ?? undefined,
        },
        systemTypes: row.system_types,
        brands: row.brands,
        priceRange: row.price_range as "budget" | "mid" | "premium",
        rating: Number(row.rating),
        reviewCount: row.review_count,
        yearsInBusiness: row.years_in_business,
        certifications: row.certifications,
        highlights: row.highlights,
        availableForQuote: row.available_for_quote,
        responseTime: row.response_time,
        warranty: row.warranty,
        website: row.website ?? undefined,
        phone: row.phone ?? undefined,
      }));
    },
  });
}
