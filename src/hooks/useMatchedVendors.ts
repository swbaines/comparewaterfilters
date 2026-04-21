import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSystemTypeIds } from "@/lib/canonicalSystemTypes";

export interface MatchedVendor {
  provider_id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  rating: number;
  review_count: number;
  years_in_business: number;
  response_time: string;
  warranty: string;
  phone: string | null;
  website: string | null;
  highlights: string[];
  certifications: string[];
  brands: string[];
  system_types: string[];
  matching_systems: string[];
  service_base_suburb: string | null;
  service_base_state: string | null;
  service_radius_km: number;
  distance_km: number | null;
  avg_response_minutes: number | null;
  win_rate: number | null;
  state_share_pct: number;
  cap_exceeded: boolean;
}

interface Args {
  customerLat: number | null;
  customerLng: number | null;
  customerState: string;
  recommendedSystems: string[];
  enabled?: boolean;
}

export function useMatchedVendors({
  customerLat,
  customerLng,
  customerState,
  recommendedSystems,
  enabled = true,
}: Args) {
  const normalizedRecommended = normalizeSystemTypeIds(recommendedSystems);
  return useQuery({
    queryKey: [
      "matched-vendors",
      customerLat,
      customerLng,
      customerState,
      [...normalizedRecommended].sort().join(","),
    ],
    enabled:
      enabled &&
      !!customerState &&
      normalizedRecommended.length > 0,
    queryFn: async (): Promise<MatchedVendor[]> => {
      const { data, error } = await supabase.rpc("get_matched_vendors" as any, {
        _customer_lat: customerLat,
        _customer_lng: customerLng,
        _customer_state: customerState,
        _recommended_systems: normalizedRecommended,
        _limit: 10,
      });
      if (error) throw error;
      return (data || []) as MatchedVendor[];
    },
  });
}