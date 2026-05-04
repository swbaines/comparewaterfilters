// Saleshandy CRM sync — pushes a quote_request as a prospect.
// Trigger: AFTER INSERT on quote_requests + manual resync from admin UI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0?target=deno";

// ============================================================
// SALESHANDY FIELD IDS — fill in from Settings > Prospect Fields
// Standard fields are confirmed; custom fields must be filled in.
// ============================================================
const FIELD_IDS = {
  first_name: "jzRy6Er9aA",
  email: "OwEqg1G4wb",
  phone: "eaNoKx13zg",
  city: "VPXvq0egzl",
  state: "7PWgqlxQPo",
  // TODO: replace with real custom field IDs from Saleshandy
  suburb: "TODO_SUBURB_FIELD_ID",
  postcode: "TODO_POSTCODE_FIELD_ID",
  water_source: "TODO_WATER_SOURCE_FIELD_ID",
  concerns: "TODO_CONCERNS_FIELD_ID",
  coverage: "TODO_COVERAGE_FIELD_ID",
  budget: "TODO_BUDGET_FIELD_ID",
  installation_timeline: "TODO_TIMELINE_FIELD_ID",
  lead_temperature: "TODO_TEMPERATURE_FIELD_ID",
  property_type: "TODO_PROPERTY_TYPE_FIELD_ID",
  ownership_status: "TODO_OWNERSHIP_FIELD_ID",
  recommended_systems: "TODO_RECOMMENDED_SYSTEMS_FIELD_ID",
  quote_created_at: "TODO_CREATED_AT_FIELD_ID",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SALESHANDY_URL = "https://open-api.saleshandy.com/v1/prospects";
// Edge functions have a ~150s idle timeout. Keep total retry window well under that.
// Strategy: 2s, then 10s (≈12s of waits + a few HTTP calls = comfortably under 150s).
const RETRY_DELAYS_MS = [2_000, 10_000];

function buildAttribute(fieldId: string, value: unknown) {
  if (!fieldId || fieldId.startsWith("TODO_")) return null;
  if (value === null || value === undefined || value === "") return null;
  return { customFieldId: fieldId, value: String(value) };
}

async function logAttempt(
  supabase: ReturnType<typeof createClient>,
  quoteRequestId: string,
  status: "pending" | "success" | "failed" | "skipped_no_consent",
  attemptCount: number,
  responseBody: unknown,
  errorMessage: string | null,
) {
  await supabase.from("saleshandy_sync_log").insert({
    quote_request_id: quoteRequestId,
    status,
    attempt_count: attemptCount,
    response_body: responseBody as never,
    error_message: errorMessage,
  });
}

async function notifyAdminOfFailure(
  supabase: ReturnType<typeof createClient>,
  quoteRequestId: string,
  lastError: string,
) {
  try {
    // Find any admin email; fall back to silent if none.
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    if (!admins || admins.length === 0) return;

    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "contact-inquiry",
        recipientEmail: Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ?? "admin@comparewaterfilters.com.au",
        idempotencyKey: `saleshandy-fail-${quoteRequestId}`,
        templateData: {
          subject: "Saleshandy sync failed",
          message: `Quote request ${quoteRequestId} failed to sync to Saleshandy after retries.\n\nLast error: ${lastError}`,
        },
      },
    });
  } catch (_e) {
    // best effort
  }
}

async function pushToSaleshandy(quote: Record<string, unknown>) {
  const apiKey = Deno.env.get("SALESHANDY_API_KEY");
  if (!apiKey) throw new Error("SALESHANDY_API_KEY not configured");

  const concerns = Array.isArray(quote.concerns)
    ? (quote.concerns as string[]).join(", ")
    : "";
  const recommended = Array.isArray(quote.recommended_systems)
    ? (quote.recommended_systems as string[]).join(", ")
    : "";

  const attributes = [
    buildAttribute(FIELD_IDS.first_name, quote.customer_name),
    buildAttribute(FIELD_IDS.email, quote.customer_email),
    buildAttribute(FIELD_IDS.phone, quote.customer_mobile),
    buildAttribute(FIELD_IDS.suburb, quote.customer_suburb),
    buildAttribute(FIELD_IDS.postcode, quote.customer_postcode),
    buildAttribute(FIELD_IDS.state, quote.customer_state),
    buildAttribute(FIELD_IDS.city, quote.customer_suburb),
    buildAttribute(FIELD_IDS.water_source, quote.water_source),
    buildAttribute(FIELD_IDS.concerns, concerns),
    buildAttribute(FIELD_IDS.coverage, (quote as Record<string, unknown>).coverage),
    buildAttribute(FIELD_IDS.budget, quote.budget),
    buildAttribute(FIELD_IDS.installation_timeline, quote.installation_timeline),
    buildAttribute(FIELD_IDS.lead_temperature, quote.lead_temperature),
    buildAttribute(FIELD_IDS.property_type, quote.property_type),
    buildAttribute(FIELD_IDS.ownership_status, quote.ownership_status),
    buildAttribute(FIELD_IDS.recommended_systems, recommended),
    buildAttribute(FIELD_IDS.quote_created_at, quote.created_at),
  ].filter(Boolean);

  const body = {
    conflictAction: "overwrite",
    verifyProspects: false,
    prospectList: [{ attributes }],
  };

  const res = await fetch(SALESHANDY_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch { /* keep raw */ }
  return { ok: res.ok, status: res.status, body: parsed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let quote_request_id: string | undefined;
  try {
    const body = await req.json();
    quote_request_id = body?.quote_request_id;
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!quote_request_id) {
    return new Response(JSON.stringify({ error: "quote_request_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch quote
  const { data: quote, error: qErr } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", quote_request_id)
    .maybeSingle();
  if (qErr || !quote) {
    await logAttempt(supabase, quote_request_id, "failed", 1, null, qErr?.message ?? "quote not found");
    return new Response(JSON.stringify({ error: "quote not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Consent check via quiz_submissions matched by email
  const { data: submission } = await supabase
    .from("quiz_submissions")
    .select("consent")
    .eq("email", quote.customer_email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!submission || submission.consent !== true) {
    await logAttempt(supabase, quote_request_id, "skipped_no_consent", 0, null, null);
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "no_consent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Try with retries
  let attempt = 0;
  let lastError = "";
  let lastBody: unknown = null;
  while (attempt <= RETRY_DELAYS_MS.length) {
    attempt += 1;
    try {
      const result = await pushToSaleshandy(quote as Record<string, unknown>);
      lastBody = result.body;
      if (result.ok) {
        await logAttempt(supabase, quote_request_id, "success", attempt, result.body, null);
        return new Response(
          JSON.stringify({ ok: true, attempt, response: result.body }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      lastError = `HTTP ${result.status}: ${typeof result.body === "string" ? result.body : JSON.stringify(result.body)}`;
    } catch (e) {
      lastError = (e as Error).message;
    }

    if (attempt <= RETRY_DELAYS_MS.length) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
    }
  }

  await logAttempt(supabase, quote_request_id, "failed", attempt, lastBody, lastError);
  await notifyAdminOfFailure(supabase, quote_request_id, lastError);

  return new Response(
    JSON.stringify({ ok: false, error: lastError, attempts: attempt }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});