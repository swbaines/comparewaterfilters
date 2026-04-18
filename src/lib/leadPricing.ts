import { supabase } from "@/integrations/supabase/client";

export type LeadType = "owner_lead" | "rental_lead";

const DEFAULTS: Record<LeadType, number> = {
  owner_lead: 85,
  rental_lead: 50,
};

/**
 * Returns the current lead prices set by admin in lead_prices.
 * The admin's value is the single source of truth and applies immediately.
 */
export async function getEffectiveLeadPrices(): Promise<Record<LeadType, number>> {
  const { data: priceRows } = await supabase
    .from("lead_prices")
    .select("system_type, price_per_lead");

  const result: Record<LeadType, number> = { ...DEFAULTS };
  (["owner_lead", "rental_lead"] as LeadType[]).forEach((type) => {
    const row = (priceRows || []).find((p) => p.system_type === type);
    if (row) result[type] = Number(row.price_per_lead);
  });
  return result;
}
