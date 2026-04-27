// Admin-only: deletes rows flagged is_test=true from leads/invoices.
// Requires a logged-in admin (verified via the user's JWT against user_roles).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // 1. Verify caller is an authenticated admin via their JWT.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return json({ error: "Forbidden" }, 403);

  // 2. Parse body — require an explicit confirmation phrase.
  let body: { confirm?: string } = {};
  try { body = await req.json(); } catch { /* allow empty */ }
  if (body.confirm !== "RESET TEST DATA") {
    return json({ error: "Confirmation phrase required" }, 400);
  }

  // 3. Count + delete only rows flagged as test data.
  const summary: Record<string, number> = {};
  try {
    const { count: leadsCount } = await admin
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("is_test", true);
    summary.leads = leadsCount ?? 0;

    const { count: invoicesCount } = await admin
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("is_test", true);
    summary.invoices = invoicesCount ?? 0;

    // Detach test leads from their invoices (defensive — invoice FK is uuid not enforced).
    await admin.from("quote_requests").update({ invoice_id: null }).eq("is_test", true);

    const { error: delLeadsErr } = await admin
      .from("quote_requests").delete().eq("is_test", true);
    if (delLeadsErr) throw delLeadsErr;

    const { error: delInvErr } = await admin
      .from("invoices").delete().eq("is_test", true);
    if (delInvErr) throw delInvErr;

    return json({ ok: true, deleted: summary });
  } catch (e) {
    return json({ error: (e as Error).message, partial: summary }, 500);
  }
});
