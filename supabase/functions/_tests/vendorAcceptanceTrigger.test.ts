// Trigger-level test for `enforce_vendor_account_acceptance_immutable`.
//
// Run with:
//   SUPABASE_URL=... \
//   SUPABASE_ANON_KEY=... \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   deno test --allow-net --allow-env supabase/functions/_tests/vendorAcceptanceTrigger.test.ts
//
// Skipped automatically if the service-role key is not present (e.g. local dev
// without admin creds, or the regular `bun test` run).
import { createClient } from "npm:@supabase/supabase-js@2";
import { assert, assertEquals, assertExists, assertRejects } from "jsr:@std/assert";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const canRun = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);

const ACCEPTANCE_COLUMNS = [
  "pricing_acknowledged_at",
  "terms_accepted_at",
  "installation_compliance_acknowledged_at",
  "marketing_consent_at",
] as const;

Deno.test({
  name: "enforce_vendor_account_acceptance_immutable trigger",
  ignore: !canRun,
  async fn(t) {
    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ---- Fixture setup ----------------------------------------------------
    const stamp = Date.now();
    const email = `acceptance-rls+${stamp}@comparewaterfilters.test`;
    const password = `Test!${stamp}aA1`;
    let userId = "";
    let providerId = "";
    let vendorAccountId = "";

    try {
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      assertExists(created.data.user, created.error?.message);
      userId = created.data.user!.id;

      const { data: provider, error: provErr } = await admin
        .from("providers")
        .insert({
          name: `Acceptance RLS Test ${stamp}`,
          slug: `acceptance-rls-${stamp}`,
          submitted_by: userId,
          approval_status: "approved",
        })
        .select("id")
        .single();
      assert(!provErr, provErr?.message);
      providerId = provider!.id;

      // The auto_link_vendor_on_approval trigger should have linked the vendor.
      // Fall back to inserting manually if the trigger's preconditions weren't
      // met by the minimal fixture.
      let { data: existing } = await admin
        .from("vendor_accounts")
        .select("id, pricing_acknowledged_at, terms_accepted_at, installation_compliance_acknowledged_at, marketing_consent_at, legacy_terms")
        .eq("provider_id", providerId)
        .maybeSingle();

      if (!existing) {
        const { data: inserted, error: insErr } = await admin
          .from("vendor_accounts")
          .insert({ user_id: userId, provider_id: providerId })
          .select("id, pricing_acknowledged_at, terms_accepted_at, installation_compliance_acknowledged_at, marketing_consent_at, legacy_terms")
          .single();
        assert(!insErr, insErr?.message);
        existing = inserted;
      }
      vendorAccountId = existing!.id;

      // Sign in as the vendor to get a real authenticated session.
      const vendor = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: signInErr } = await vendor.auth.signInWithPassword({ email, password });
      assert(!signInErr, signInErr?.message);

      // ---- Tests ----------------------------------------------------------
      await t.step("vendor cannot mutate acceptance timestamps", async () => {
        for (const col of ACCEPTANCE_COLUMNS) {
          const { error } = await vendor
            .from("vendor_accounts")
            .update({ [col]: new Date().toISOString() })
            .eq("id", vendorAccountId)
            .select("id");
          assertExists(error, `Vendor was able to update ${col} (no error returned).`);
          assert(
            /immutable|permission|denied/i.test(error!.message),
            `Update of ${col} failed but not for the expected reason: ${error!.message}`,
          );
        }
      });

      await t.step("vendor cannot flip legacy_terms", async () => {
        const { error } = await vendor
          .from("vendor_accounts")
          .update({ legacy_terms: true })
          .eq("id", vendorAccountId)
          .select("id");
        assertExists(error, "Vendor was able to flip legacy_terms (no error returned).");
        assert(/immutable|permission|denied/i.test(error!.message));
      });

      await t.step("vendor CAN still update operational fields (last_dashboard_visit)", async () => {
        const { error } = await vendor
          .from("vendor_accounts")
          .update({ last_dashboard_visit: new Date().toISOString() })
          .eq("id", vendorAccountId)
          .select("id");
        assertEquals(error, null);
      });

      await t.step("service role CAN update acceptance timestamps", async () => {
        const stampNow = new Date().toISOString();
        const payload = Object.fromEntries(
          ACCEPTANCE_COLUMNS.map((c) => [c, stampNow]),
        );
        const { data, error } = await admin
          .from("vendor_accounts")
          .update({ ...payload, legacy_terms: false })
          .eq("id", vendorAccountId)
          .select("id, " + ACCEPTANCE_COLUMNS.join(", "))
          .single();
        assertEquals(error, null);
        for (const col of ACCEPTANCE_COLUMNS) {
          assertEquals((data as Record<string, unknown>)[col], stampNow);
        }
      });
    } finally {
      // ---- Teardown -------------------------------------------------------
      if (vendorAccountId) {
        await admin.from("vendor_accounts").delete().eq("id", vendorAccountId);
      }
      if (providerId) {
        await admin.from("providers").delete().eq("id", providerId);
      }
      if (userId) {
        await admin.auth.admin.deleteUser(userId).catch(() => {});
      }
    }

    // Silence unused-rejects lint when the suite is ignored.
    void assertRejects;
  },
});
