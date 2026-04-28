import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSystemTypeIds, expandCombosToComponents } from "@/lib/canonicalSystemTypes";
import { applyPriceFloors } from "@/lib/budgetMatching";

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
  system_pricing: Record<string, { min: number; max: number }>;
  abn_verified: boolean;
  installation_model: "in_house_licensed" | "sub_contracted" | null;
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
  // Expand combo IDs (e.g. "hybrid") into their component systems so that
  // matching enforces a provider supplies every component, not the combo
  // tag itself (which vendors no longer select).
  const normalizedRecommended = expandCombosToComponents(
    normalizeSystemTypeIds(recommendedSystems)
  );
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
      const rows = (data || []) as MatchedVendor[];
      // The RPC doesn't return per-system pricing — fetch it in one round-trip
      // and merge. Keeps the SQL function untouched & the UI budget-aware.
      if (rows.length === 0) return rows;
      const ids = rows.map((r) => r.provider_id);
      const { data: pricingRows } = await supabase
        .from("providers")
        .select("id, system_pricing, abn_verified, installation_model")
        .in("id", ids);
      const priceMap = new Map<string, Record<string, { min: number; max: number }>>();
      const verifiedMap = new Map<string, boolean>();
      const modelMap = new Map<
        string,
        "in_house_licensed" | "sub_contracted" | null
      >();
      (pricingRows || []).forEach((p: any) => {
        priceMap.set(p.id, (p.system_pricing || {}) as Record<string, { min: number; max: number }>);
        verifiedMap.set(p.id, !!p.abn_verified);
        modelMap.set(p.id, p.installation_model ?? null);
      });
      return rows.map((r) => ({
        ...r,
        system_pricing: applyPriceFloors(priceMap.get(r.provider_id) || {}),
        abn_verified: verifiedMap.get(r.provider_id) ?? false,
        installation_model: modelMap.get(r.provider_id) ?? null,
      }));
    },
  });
}