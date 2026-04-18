import { supabase } from "@/integrations/supabase/client";

export type LeadType = "owner_lead" | "rental_lead";

const DEFAULTS: Record<LeadType, number> = {
  owner_lead: 85,
  rental_lead: 50,
};

/**
 * Resolves the effective lead prices RIGHT NOW, honoring the 30-day notice
 * required by Terms 19.3. If a price change is pending (effective_date in
 * the future), we keep using the OLD price until that date passes.
 */
export async function getEffectiveLeadPrices(): Promise<Record<LeadType, number>> {
  const [{ data: priceRows }, { data: changes }] = await Promise.all([
    supabase.from("lead_prices").select("system_type, price_per_lead"),
    supabase
      .from("lead_price_changes")
      .select("system_type, old_price, new_price, effective_date")
      .order("created_at", { ascending: false }),
  ]);

  const result: Record<LeadType, number> = { ...DEFAULTS };

  (["owner_lead", "rental_lead"] as LeadType[]).forEach((type) => {
    // Most recent pending change for this type
    const pending = (changes || []).find(
      (c) => c.system_type === type && new Date(c.effective_date) > new Date()
    );
    if (pending) {
      // Notice period — keep using the price BEFORE the pending change
      result[type] = Number(pending.old_price);
      return;
    }
    const row = (priceRows || []).find((p) => p.system_type === type);
    if (row) result[type] = Number(row.price_per_lead);
  });

  return result;
}

export async function getPendingPriceChanges() {
  const { data } = await supabase
    .from("lead_price_changes")
    .select("system_type, old_price, new_price, effective_date, created_at")
    .gt("effective_date", new Date().toISOString())
    .order("effective_date", { ascending: true });
  return data || [];
}
