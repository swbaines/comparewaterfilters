import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

/**
 * Vendor acceptance fields contract:
 *   - `pricing_acknowledged_at`
 *   - `terms_accepted_at`
 *   - `installation_compliance_acknowledged_at`
 *   - `marketing_consent_at`
 *   - `legacy_terms`
 *
 * These are written ONLY by:
 *   - the registration flow under `service_role` (via edge functions / triggers), or
 *   - an admin (covered by the "Admins can manage vendor accounts" RLS policy), or
 *   - the `auto_link_vendor_on_approval` trigger (SECURITY DEFINER, bypasses RLS).
 *
 * Vendors must NOT be able to mutate them from the client. Two layers enforce this:
 *   1. RLS — anon has no UPDATE policy on `vendor_accounts` at all.
 *   2. The `enforce_vendor_account_acceptance_immutable` BEFORE UPDATE trigger —
 *      raises if a non-admin / non-service-role caller tries to change any of the
 *      five acceptance columns. This protects against a vendor updating their own
 *      row (which IS allowed for operational fields like `last_dashboard_visit`).
 *
 * This file covers what we can observe from a pure browser/anon client:
 *   - anon cannot read or update any `vendor_accounts` row.
 *   - the providers row's acceptance timestamps are not exposed to anon.
 *
 * The trigger itself (layer 2) is exercised in
 * `supabase/functions/_tests/vendorAcceptanceTrigger.test.ts` (Deno, run with
 * SUPABASE_SERVICE_ROLE_KEY) so we can create a fixture vendor session.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const ACCEPTANCE_COLUMNS = [
  "pricing_acknowledged_at",
  "terms_accepted_at",
  "installation_compliance_acknowledged_at",
  "marketing_consent_at",
  "legacy_terms",
] as const;

const hasEnv = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
const describeIfEnv = hasEnv ? describe : describe.skip;

describeIfEnv("Vendor acceptance fields — anon cannot read or write", () => {
  const anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  beforeAll(async () => {
    await anon.auth.signOut().catch(() => {});
    const { data } = await anon.auth.getSession();
    expect(data.session).toBeNull();
  });

  afterAll(async () => {
    await anon.auth.signOut().catch(() => {});
  });

  it("anon SELECT on vendor_accounts returns no rows (RLS)", async () => {
    const { data, error } = await anon
      .from("vendor_accounts")
      .select("id, " + ACCEPTANCE_COLUMNS.join(", "))
      .limit(5);
    // RLS hides rows rather than erroring.
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("anon UPDATE on vendor_accounts changes nothing", async () => {
    const payload: Record<string, unknown> = {};
    for (const col of ACCEPTANCE_COLUMNS) {
      payload[col] = col === "legacy_terms" ? true : new Date().toISOString();
    }
    const { data, error } = await anon
      .from("vendor_accounts")
      // Match any row — RLS still hides them all from anon, so the UPDATE
      // affects zero rows. We assert no rows came back AND no error.
      .update(payload)
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("anon SELECT on providers does not expose acceptance timestamps", async () => {
    // `providers` is not anon-readable for non-approved fields. The query should
    // either error (RLS) or return empty. Either way, no acceptance timestamps
    // should leak to an unauthenticated caller.
    const { data, error } = await anon
      .from("providers")
      .select(
        "id, pricing_acknowledged_at, terms_accepted_at, installation_compliance_acknowledged_at, marketing_consent_at",
      )
      .limit(5);
    if (error) {
      // Permission-style error is acceptable.
      const msg = error.message.toLowerCase();
      expect(
        msg.includes("permission") ||
          msg.includes("policy") ||
          msg.includes("row-level"),
      ).toBe(true);
    } else {
      expect(data ?? []).toHaveLength(0);
    }
  });
});
