import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@/data/providers";

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async (): Promise<Provider[]> => {
      const { data, error } = await supabase
        .from("providers_public")
        .select("id, name, slug, description, logo, states, service_base_suburb, service_base_postcode, service_base_state, service_base_lat, service_base_lng, service_radius_km, system_types, brands, price_range, rating, review_count, years_in_business, certifications, highlights, available_for_quote, response_time, warranty, website, phone, approval_status")
        .eq("available_for_quote", true)
        .eq("approval_status", "approved" as any);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        logo: row.logo ?? undefined,
        location: {
          states: row.states,
          postcodeRanges: row.postcode_ranges ?? undefined,
          serviceBase:
            row.service_base_lat != null && row.service_base_lng != null
              ? {
                  suburb: row.service_base_suburb || "",
                  postcode: row.service_base_postcode || "",
                  state: row.service_base_state || "",
                  lat: Number(row.service_base_lat),
                  lng: Number(row.service_base_lng),
                }
              : undefined,
          serviceRadiusKm:
            row.service_radius_km != null ? Number(row.service_radius_km) : undefined,
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
