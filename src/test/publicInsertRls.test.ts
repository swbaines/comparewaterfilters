import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

/**
 * RLS surface contract:
 *  - Anonymous visitors MUST be able to insert into the two public submission tables
 *    (`quote_requests`, `quiz_submissions`) so the quiz + quote flows keep working.
 *  - Anonymous visitors MUST NOT be able to insert into any other public table.
 *
 * Rows created here are flagged as test data (where the column exists) and use an
 * obvious sentinel email so the admin "Reset Test Data" action can sweep them up.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const SENTINEL_EMAIL = "rls-test+anon@comparewaterfilters.test";

const hasEnv = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
const describeIfEnv = hasEnv ? describe : describe.skip;

describeIfEnv("Public RLS insert surface", () => {
  // Fresh anon client — never carries an authenticated session.
  const anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  beforeAll(async () => {
    // Make sure no prior test left an authenticated session in this client.
    await anon.auth.signOut().catch(() => {});
    const { data } = await anon.auth.getSession();
    expect(data.session).toBeNull();
  });

  it("allows anonymous insert into quote_requests (flagged as test)", async () => {
    const { data, error } = await anon
      .from("quote_requests")
      .insert({
        provider_name: "RLS Test Provider",
        customer_name: "RLS Anon Test",
        customer_email: SENTINEL_EMAIL,
        customer_state: "VIC",
        recommended_systems: [],
        is_test: true,
      })
      .select("id, is_test")
      .single();

    expect(error, error?.message).toBeNull();
    expect(data?.is_test).toBe(true);
  });

  it("allows anonymous insert into quiz_submissions", async () => {
    const { data, error } = await anon
      .from("quiz_submissions")
      .insert({
        first_name: "RLS Anon Test",
        email: SENTINEL_EMAIL,
        consent: false,
      })
      .select("id")
      .single();

    expect(error, error?.message).toBeNull();
    expect(data?.id).toBeTruthy();
  });

  // Tables that should reject anonymous inserts.
  // Each entry is [table, minimal payload that would otherwise satisfy NOT NULL constraints].
  const lockedTables: Array<[string, Record<string, unknown>]> = [
    ["providers", { name: "Hacker Co", slug: "hacker-co" }],
    ["invoices", {
      provider_id: "00000000-0000-0000-0000-000000000000",
      invoice_number: "RLS-TEST",
      period_start: "2025-01-01",
      period_end: "2025-01-31",
    }],
    ["lead_prices", { system_type: "owner_lead", price_per_lead: 1 }],
    ["user_roles", {
      user_id: "00000000-0000-0000-0000-000000000000",
      role: "admin",
    }],
    ["vendor_accounts", {
      user_id: "00000000-0000-0000-0000-000000000000",
      provider_id: "00000000-0000-0000-0000-000000000000",
    }],
    ["billing_audit_log", {
      provider_id: "00000000-0000-0000-0000-000000000000",
      event_type: "rls_test",
    }],
    ["lead_price_changes", {
      system_type: "owner_lead",
      old_price: 0,
      new_price: 1,
      effective_date: new Date().toISOString(),
    }],
  ];

  it.each(lockedTables)(
    "rejects anonymous insert into %s",
    async (table, payload) => {
      const { data, error } = await (anon as any)
        .from(table)
        .insert(payload)
        .select();

      // Either the insert returns an explicit RLS error, or it silently
      // returns no rows (PostgREST behaviour when the WITH CHECK clause hides
      // the inserted row). Both outcomes prove anonymous writes are blocked.
      const blocked =
        !!error ||
        (Array.isArray(data) && data.length === 0) ||
        data === null;

      expect(
        blocked,
        `Anonymous insert into '${table}' was unexpectedly accepted: ${JSON.stringify(data)}`,
      ).toBe(true);

      if (error) {
        // When an error is surfaced it should be an RLS / permission error
        // (PostgREST codes 42501 / PGRST301), not a schema/validation error.
        const code = (error as any).code ?? "";
        const msg = error.message?.toLowerCase() ?? "";
        const looksLikeRls =
          code === "42501" ||
          code === "PGRST301" ||
          msg.includes("row-level security") ||
          msg.includes("policy") ||
          msg.includes("permission denied");
        expect(
          looksLikeRls,
          `Insert into '${table}' failed but not for an RLS reason: ${error.message} (code=${code})`,
        ).toBe(true);
      }
    },
  );
});
