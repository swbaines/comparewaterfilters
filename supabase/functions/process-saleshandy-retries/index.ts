// Processes the Saleshandy retry queue.
//
// Cron-invoked every 60s. For each saleshandy_sync_log row with
// status='retry_scheduled' AND next_retry_at <= NOW(), re-invoke
// sync-to-saleshandy with the original ids and the row's retry_count.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 25;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Optional: allow manual retry of a specific permanently_failed row.
  let manualLogId: string | null = null;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (typeof body?.log_id === "string") manualLogId = body.log_id;
    } catch { /* no body — cron call */ }
  }

  let rows: Array<{
    id: string;
    quote_request_id: string | null;
    quiz_submission_id: string | null;
    source: string | null;
    retry_count: number;
    status: string;
  }> = [];

  if (manualLogId) {
    const { data, error } = await supabase
      .from("saleshandy_sync_log")
      .select("id, quote_request_id, quiz_submission_id, source, retry_count, status")
      .eq("id", manualLogId)
      .maybeSingle();
    if (error || !data) {
      return new Response(JSON.stringify({ error: "log row not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    rows = [data];
  } else {
    const { data, error } = await supabase
      .from("saleshandy_sync_log")
      .select("id, quote_request_id, quiz_submission_id, source, retry_count, status")
      .eq("status", "retry_scheduled")
      .lte("next_retry_at", new Date().toISOString())
      .order("next_retry_at", { ascending: true })
      .limit(BATCH_SIZE);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    rows = data ?? [];
  }

  const results: Array<{ log_id: string; ok: boolean; status?: number }> = [];

  for (const row of rows) {
    // Mark as in-flight by clearing next_retry_at to prevent double-processing
    // by the next cron tick if this run is slow.
    await supabase
      .from("saleshandy_sync_log")
      .update({ next_retry_at: null })
      .eq("id", row.id);

    try {
      const { data: invokeRes, error: invokeErr } = await supabase.functions.invoke(
        "sync-to-saleshandy",
        {
          body: {
            quote_request_id: row.quote_request_id,
            quiz_submission_id: row.quiz_submission_id,
            source: row.source,
            // For manual retries from a permanently_failed row, restart the
            // retry counter at 0 so the user gets the full retry budget again.
            retry_count: manualLogId ? 0 : row.retry_count,
          },
        },
      );
      results.push({
        log_id: row.id,
        ok: !invokeErr,
        status: invokeErr ? 500 : 200,
      });
      if (invokeErr) console.error("retry invoke error", row.id, invokeErr);
      else void invokeRes;
    } catch (e) {
      console.error("retry exception", row.id, (e as Error).message);
      results.push({ log_id: row.id, ok: false });
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed: results.length, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
