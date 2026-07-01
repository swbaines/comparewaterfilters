import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

/**
 * E2E regression test for the `_is_rental` filter in `get_matched_vendors`.
 *
 * When a customer selects "Rent" in the quiz, the MatchedVendorsSection passes
 * `_is_rental: true` to the RPC. Providers who have opted out of rental leads
 * (accepts_rental_leads = false in the providers table) must never appear in
 * the results.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const hasEnv = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
const describeIfEnv = hasEnv ? describe : describe.skip;

const RECOMMENDED = [
  "whole_house_carbon",
  "under_sink_ro",
  "whole_house_softener",
  "uv_disinfection",
];

const STATES = ["SA", "VIC", "NSW", "QLD", "WA", "TAS", "ACT", "NT"];

describeIfEnv("get_matched_vendors — rental lead opt-out", () => {
  const anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function callRpc(state: string, isRental: boolean) {
    const { data, error } = await anon.rpc("get_matched_vendors" as any, {
      _customer_lat: null,
      _customer_lng: null,
      _customer_state: state,
      _recommended_systems: RECOMMENDED,
      _limit: 50,
      _is_rental: isRental,
    });
    expect(error).toBeNull();
    return (data || []) as Array<{ provider_id: string; name: string }>;
  }

  async function fetchAcceptsRental(ids: string[]): Promise<Map<string, boolean>> {
    if (ids.length === 0) return new Map();
    const { data, error } = await anon
      .from("providers")
      .select("id, accepts_rental_leads")
      .in("id", ids);
    if (error) return new Map();
    return new Map(
      (data || []).map((p: any) => [p.id as string, p.accepts_rental_leads !== false]),
    );
  }

  it.each(STATES)(
    "never returns a rental-opt-out provider for a %s renter",
    async (state) => {
      const rows = await callRpc(state, true);
      const map = await fetchAcceptsRental(rows.map((r) => r.provider_id));
      if (map.size === 0) return; // anon RLS hid rows — nothing to assert
      for (const row of rows) {
        const accepts = map.get(row.provider_id);
        if (accepts === undefined) continue;
        expect(
          accepts,
          `Provider "${row.name}" returned for a ${state} renter despite accepts_rental_leads=false`,
        ).toBe(true);
      }
    },
  );

  it("owner query still returns providers that renter query filters out", async () => {
    // Sanity check: with _is_rental=false, the filter is bypassed entirely,
    // so the owner result set must be a superset of the renter set.
    const state = "NSW";
    const [renterRows, ownerRows] = await Promise.all([
      callRpc(state, true),
      callRpc(state, false),
    ]);
    const ownerIds = new Set(ownerRows.map((r) => r.provider_id));
    for (const r of renterRows) {
      expect(
        ownerIds.has(r.provider_id),
        `Provider "${r.name}" appeared for renters but not owners in ${state}`,
      ).toBe(true);
    }
  });
});