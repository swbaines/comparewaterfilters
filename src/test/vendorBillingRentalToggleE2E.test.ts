import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

/**
 * End-to-end guarantee that the "Receive rental leads" toggle on the
 * VendorBillingPage controls which providers appear in renter matched results.
 *
 * The chain has two links:
 *   1. VendorBillingPage writes `providers.accepts_rental_leads` when the
 *      switch is flipped (verified statically — vendor auth isn't available
 *      in the vitest environment).
 *   2. `get_matched_vendors(..., _is_rental := true)` excludes every provider
 *      whose `accepts_rental_leads` is false (verified against the live RPC).
 *
 * If either link breaks, a vendor who turns rental leads off on the billing
 * page could still receive renter quote requests — this test fails first.
 */

const BILLING_PAGE = resolve(__dirname, "../pages/VendorBillingPage.tsx");

describe("VendorBillingPage rental toggle — writes the column the RPC reads", () => {
  const source = readFileSync(BILLING_PAGE, "utf8");

  it("renders a Switch bound to accepts_rental_leads", () => {
    expect(source).toMatch(/<Switch[\s\S]*accepts_rental_leads/);
  });

  it("persists the toggle to providers.accepts_rental_leads", () => {
    // Must update the providers table with the accepts_rental_leads column,
    // scoped to the current provider id.
    expect(source).toMatch(/\.from\("providers"\)[\s\S]*\.update\(\{\s*accepts_rental_leads:[\s\S]*\.eq\("id",\s*provider\.id\)/);
  });
});

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

describeIfEnv("Renter RPC excludes providers whose toggle is off", () => {
  const anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  it("every rental-opt-out provider is missing from every state's renter results", async () => {
    const { data: optedOut } = await anon
      .from("providers")
      .select("id, name, service_base_state")
      .eq("accepts_rental_leads", false)
      .eq("approval_status", "approved");

    if (!optedOut || optedOut.length === 0) return; // no opted-out providers visible to anon

    const stateResults = await Promise.all(
      STATES.map(async (state) => {
        const { data, error } = await anon.rpc("get_matched_vendors" as any, {
          _customer_lat: null,
          _customer_lng: null,
          _customer_state: state,
          _recommended_systems: RECOMMENDED,
          _limit: 50,
          _is_rental: true,
        });
        expect(error).toBeNull();
        return {
          state,
          ids: new Set(((data || []) as Array<{ provider_id: string }>).map((r) => r.provider_id)),
        };
      }),
    );

    for (const provider of optedOut) {
      for (const { state, ids } of stateResults) {
        expect(
          ids.has(provider.id as string),
          `Provider "${provider.name}" has rental leads off but appeared in ${state} renter results`,
        ).toBe(false);
      }
    }
  });
});