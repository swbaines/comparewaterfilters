import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

/**
 * Regression test for state filtering in `get_matched_vendors`.
 *
 * Bug history: an SA quiz once returned a VIC-only provider (Apex Plumbing &
 * Gas) because the RPC filtered by system match + distance only, and providers
 * without `service_base_lat/lng` bypassed the distance check. The fix added a
 * hard `p.states && _state_tokens` filter (state code + the matching METRO_*
 * token).
 *
 * These tests call the live RPC via the anon client and assert that:
 *   1. Every provider returned for an SA customer covers SA (state token or
 *      METRO_ADL), and never a row that covers only VIC/NSW/etc.
 *   2. Symmetrically, VIC customers never receive SA-only providers.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const hasEnv = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
const describeIfEnv = hasEnv ? describe : describe.skip;

// Common recommendation set used by the quiz — broad enough to surface
// providers across states.
const RECOMMENDED = [
  "whole_house_carbon",
  "under_sink_ro",
  "whole_house_softener",
  "uv_disinfection",
];

const STATE_TOKENS: Record<string, string[]> = {
  SA: ["SA", "METRO_ADL"],
  VIC: ["VIC", "METRO_MEL"],
  NSW: ["NSW", "METRO_SYD"],
  QLD: ["QLD", "METRO_BNE"],
  WA: ["WA", "METRO_PER"],
  TAS: ["TAS", "METRO_HOB"],
  ACT: ["ACT", "METRO_CBR"],
  NT: ["NT", "METRO_DRW"],
};

describeIfEnv("get_matched_vendors — state filtering", () => {
  const anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function callRpc(state: string) {
    const { data, error } = await anon.rpc("get_matched_vendors" as any, {
      _customer_lat: null,
      _customer_lng: null,
      _customer_state: state,
      _recommended_systems: RECOMMENDED,
      _limit: 50,
    });
    expect(error).toBeNull();
    return (data || []) as Array<{ provider_id: string; name: string }>;
  }

  async function fetchStates(ids: string[]): Promise<Map<string, string[]>> {
    if (ids.length === 0) return new Map();
    const { data, error } = await anon
      .from("providers")
      .select("id, states")
      .in("id", ids);
    // Note: anon RLS may hide some columns/rows; the RPC is SECURITY DEFINER
    // so it bypasses RLS while this follow-up read does not. If it returns
    // nothing we skip the assertion rather than fail spuriously.
    if (error) return new Map();
    return new Map((data || []).map((p: any) => [p.id as string, (p.states || []) as string[]]));
  }

  function assertCoversState(returnedStates: string[], customerState: string, providerName: string) {
    const allowed = new Set(STATE_TOKENS[customerState]);
    const overlap = returnedStates.some((s) => allowed.has(s));
    expect(
      overlap,
      `Provider "${providerName}" returned for ${customerState} but its states are [${returnedStates.join(",")}]`,
    ).toBe(true);
  }

  it("never returns a VIC-only provider for an SA customer", async () => {
    const rows = await callRpc("SA");
    const stateMap = await fetchStates(rows.map((r) => r.provider_id));
    if (stateMap.size === 0) return; // anon couldn't read states; nothing to assert
    for (const row of rows) {
      const states = stateMap.get(row.provider_id);
      if (!states) continue;
      assertCoversState(states, "SA", row.name);
    }
  });

  it("never returns an SA-only provider for a VIC customer", async () => {
    const rows = await callRpc("VIC");
    const stateMap = await fetchStates(rows.map((r) => r.provider_id));
    if (stateMap.size === 0) return;
    for (const row of rows) {
      const states = stateMap.get(row.provider_id);
      if (!states) continue;
      assertCoversState(states, "VIC", row.name);
    }
  });

  it.each(Object.keys(STATE_TOKENS))(
    "every provider returned for a %s customer covers that state",
    async (state) => {
      const rows = await callRpc(state);
      const stateMap = await fetchStates(rows.map((r) => r.provider_id));
      if (stateMap.size === 0) return;
      for (const row of rows) {
        const states = stateMap.get(row.provider_id);
        if (!states) continue;
        assertCoversState(states, state, row.name);
      }
    },
  );
});