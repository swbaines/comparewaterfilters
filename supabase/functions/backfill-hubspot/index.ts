import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * One-click admin backfill: iterates over historic quote_requests
 * (non-test) and quiz_submissions (with consent) and invokes the
 * sync-to-hubspot function for each row. Synchronous, sequential to
 * stay friendly to the HubSpot rate limits.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = {
      quote_requests: { total: 0, success: 0, skipped: 0, failed: 0 },
      quiz_submissions: { total: 0, success: 0, skipped: 0, failed: 0 },
      errors: [] as Array<{ kind: string; id: string; error: string }>,
    };

    const invokeSync = async (body: Record<string, string>) => {
      const res = await supabase.functions.invoke("sync-to-hubspot", { body });
      if (res.error) throw new Error(res.error.message);
      return res.data as { success?: boolean; skipped?: boolean; error?: string };
    };

    // 1. Quote requests (non-test)
    const { data: quotes, error: qErr } = await supabase
      .from("quote_requests")
      .select("id")
      .eq("is_test", false)
      .order("created_at", { ascending: true });
    if (qErr) throw qErr;
    results.quote_requests.total = quotes?.length || 0;

    for (const row of quotes || []) {
      try {
        const r = await invokeSync({ quote_request_id: row.id });
        if (r?.skipped) results.quote_requests.skipped++;
        else if (r?.success) results.quote_requests.success++;
        else {
          results.quote_requests.failed++;
          results.errors.push({ kind: "quote", id: row.id, error: r?.error || "unknown" });
        }
      } catch (e) {
        results.quote_requests.failed++;
        results.errors.push({
          kind: "quote",
          id: row.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    // 2. Quiz submissions (consented)
    const { data: quizzes, error: zErr } = await supabase
      .from("quiz_submissions")
      .select("id")
      .eq("consent", true)
      .order("created_at", { ascending: true });
    if (zErr) throw zErr;
    results.quiz_submissions.total = quizzes?.length || 0;

    for (const row of quizzes || []) {
      try {
        const r = await invokeSync({ quiz_submission_id: row.id });
        if (r?.skipped) results.quiz_submissions.skipped++;
        else if (r?.success) results.quiz_submissions.success++;
        else {
          results.quiz_submissions.failed++;
          results.errors.push({ kind: "quiz", id: row.id, error: r?.error || "unknown" });
        }
      } catch (e) {
        results.quiz_submissions.failed++;
        results.errors.push({
          kind: "quiz",
          id: row.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("backfill-hubspot error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});