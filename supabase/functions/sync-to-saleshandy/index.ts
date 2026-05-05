// Saleshandy CRM sync — pushes a lead as a prospect using the
// /v1/prospects/import-with-field-name endpoint (human-readable field names).
//
// Triggers:
// - AFTER INSERT on quiz_submissions where consent = true (source = 'recommendation')
// - AFTER INSERT on quote_requests (source = 'quote_request')
// - Manual resync from admin UI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SALESHANDY_IMPORT_URL =
  "https://open-api.saleshandy.com/v1/prospects/import-with-field-name";
const SALESHANDY_TAG_ASSIGN_URL =
  "https://open-api.saleshandy.com/v1/prospects/tags/assign";
const SALESHANDY_LOOKUP_URL = "https://open-api.saleshandy.com/v1/prospects";

// Edge functions have a ~150s idle timeout. Keep retry window well under that.
const RETRY_DELAYS_MS = [2_000, 10_000];

type Source = "recommendation" | "quote_request";

// ---------- formatting helpers ----------

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const v = email.trim().toLowerCase();
  return v.length > 0 ? v : null;
}

/**
 * Convert AU mobile to international format.
 * - "04XX XXX XXX" -> "+614XXXXXXXX"
 * - "+614..." passthrough (spaces stripped)
 * - "614..." -> "+614..."
 * Returns null if it doesn't look like an AU mobile we can normalise.
 */
function normalizeAuMobile(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const digitsAndPlus = String(raw).replace(/[^\d+]/g, "");
  if (!digitsAndPlus) return null;

  if (digitsAndPlus.startsWith("+61")) return digitsAndPlus;
  if (digitsAndPlus.startsWith("61") && digitsAndPlus.length >= 11) {
    return "+" + digitsAndPlus;
  }
  if (digitsAndPlus.startsWith("04") && digitsAndPlus.length === 10) {
    return "+61" + digitsAndPlus.slice(1);
  }
  if (digitsAndPlus.startsWith("4") && digitsAndPlus.length === 9) {
    return "+61" + digitsAndPlus;
  }
  // Fallback: return as-is with leading + if missing
  return digitsAndPlus.startsWith("+") ? digitsAndPlus : "+" + digitsAndPlus;
}

function splitName(full: unknown): { firstName: string; lastName: string } {
  if (typeof full !== "string" || !full.trim()) {
    return { firstName: "", lastName: "" };
  }
  const parts = full.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

// ---------- logging ----------

async function logAttempt(
  supabase: ReturnType<typeof createClient>,
  params: {
    quote_request_id?: string | null;
    quiz_submission_id?: string | null;
    source: Source | null;
    status:
      | "pending"
      | "success"
      | "failed"
      | "skipped_no_consent"
      | "skipped_no_email";
    attempt_count: number;
    request_body?: unknown;
    response_body?: unknown;
    tags_applied?: string[] | null;
    error_message?: string | null;
  },
) {
  await supabase.from("saleshandy_sync_log").insert({
    quote_request_id: params.quote_request_id ?? null,
    quiz_submission_id: params.quiz_submission_id ?? null,
    source: params.source,
    status: params.status,
    attempt_count: params.attempt_count,
    request_body: params.request_body as never,
    response_body: params.response_body as never,
    tags_applied: params.tags_applied ?? null,
    error_message: params.error_message ?? null,
  });
}

async function notifyAdminOfFailure(
  supabase: ReturnType<typeof createClient>,
  refId: string,
  source: Source,
  lastError: string,
) {
  try {
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    if (!admins || admins.length === 0) return;

    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "contact-inquiry",
        recipientEmail:
          Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ??
          "admin@comparewaterfilters.com.au",
        idempotencyKey: `saleshandy-fail-${source}-${refId}`,
        templateData: {
          subject: `Saleshandy sync failed (${source})`,
          message: `${source} ${refId} failed to sync to Saleshandy after retries.\n\nLast error: ${lastError}`,
        },
      },
    });
  } catch (_e) {
    // best effort
  }
}

// ---------- Saleshandy API ----------

function buildPayload(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  tags: string[];
}) {
  const prospect: Record<string, string> = {
    "First Name": params.firstName,
    "Last Name": params.lastName,
    "Email": params.email,
  };
  if (params.phone) prospect["Phone Number"] = params.phone;

  return {
    prospectList: [prospect],
    verifyProspects: false,
    conflictAction: "overwrite",
    tags: params.tags,
  };
}

async function importProspect(body: Record<string, unknown>) {
  const apiKey = Deno.env.get("SALESHANDY_API_KEY");
  if (!apiKey) throw new Error("SALESHANDY_API_KEY not configured");

  const res = await fetch(SALESHANDY_IMPORT_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* keep raw */
  }
  return { ok: res.ok, status: res.status, body: parsed };
}

async function assignTagsByEmail(email: string, tags: string[]) {
  const apiKey = Deno.env.get("SALESHANDY_API_KEY");
  if (!apiKey) throw new Error("SALESHANDY_API_KEY not configured");

  // Best-effort tag assignment. Saleshandy's exact payload schema for this
  // endpoint is being confirmed; we send the most common shape and capture
  // the full response for diagnostics.
  const body = { emails: [email], tags };
  const res = await fetch(SALESHANDY_TAG_ASSIGN_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* keep raw */
  }
  return { ok: res.ok, status: res.status, body: parsed, request: body };
}

// ---------- main handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let payload: {
    quote_request_id?: string;
    quiz_submission_id?: string;
    source?: Source;
  };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Decide source: explicit > inferred from id type
  let source: Source =
    payload.source ??
    (payload.quiz_submission_id ? "recommendation" : "quote_request");

  // ============ Build prospect data based on source ============
  let firstName = "";
  let lastName = "";
  let emailRaw: unknown;
  let phoneRaw: unknown;
  let quoteRequestId: string | null = null;
  let quizSubmissionId: string | null = null;

  if (source === "recommendation") {
    if (!payload.quiz_submission_id) {
      return new Response(
        JSON.stringify({ error: "quiz_submission_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    quizSubmissionId = payload.quiz_submission_id;
    const { data: sub, error } = await supabase
      .from("quiz_submissions")
      .select("first_name, email, mobile, consent")
      .eq("id", quizSubmissionId)
      .maybeSingle();
    if (error || !sub) {
      await logAttempt(supabase, {
        quiz_submission_id: quizSubmissionId,
        source,
        status: "failed",
        attempt_count: 1,
        error_message: error?.message ?? "submission not found",
      });
      return new Response(
        JSON.stringify({ error: "submission not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (sub.consent !== true) {
      await logAttempt(supabase, {
        quiz_submission_id: quizSubmissionId,
        source,
        status: "skipped_no_consent",
        attempt_count: 0,
      });
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "no_consent" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    firstName = sub.first_name ?? "";
    emailRaw = sub.email;
    phoneRaw = sub.mobile;
  } else {
    // quote_request
    if (!payload.quote_request_id) {
      return new Response(
        JSON.stringify({ error: "quote_request_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    quoteRequestId = payload.quote_request_id;
    const { data: quote, error } = await supabase
      .from("quote_requests")
      .select("customer_name, customer_email, customer_mobile")
      .eq("id", quoteRequestId)
      .maybeSingle();
    if (error || !quote) {
      await logAttempt(supabase, {
        quote_request_id: quoteRequestId,
        source,
        status: "failed",
        attempt_count: 1,
        error_message: error?.message ?? "quote not found",
      });
      return new Response(
        JSON.stringify({ error: "quote not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Consent check via matching quiz_submission
    const { data: submission } = await supabase
      .from("quiz_submissions")
      .select("consent")
      .eq("email", quote.customer_email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!submission || submission.consent !== true) {
      await logAttempt(supabase, {
        quote_request_id: quoteRequestId,
        source,
        status: "skipped_no_consent",
        attempt_count: 0,
      });
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "no_consent" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const split = splitName(quote.customer_name);
    firstName = split.firstName;
    lastName = split.lastName;
    emailRaw = quote.customer_email;
    phoneRaw = quote.customer_mobile;
  }

  // ============ Normalise & validate ============
  const email = normalizeEmail(emailRaw);
  const phone = normalizeAuMobile(phoneRaw);

  if (!email) {
    await logAttempt(supabase, {
      quote_request_id: quoteRequestId,
      quiz_submission_id: quizSubmissionId,
      source,
      status: "skipped_no_email",
      attempt_count: 0,
    });
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "no_email" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ============ Tags by source ============
  const tags =
    source === "recommendation"
      ? ["Lead - No Quote Requested", "Recommendation Stage"]
      : ["Quote Requested"];

  // For quote_request stage, use the tag-assign endpoint (additive, doesn't
  // overwrite existing tags from the recommendation stage).
  if (source === "quote_request") {
    let attempt = 0;
    let lastError = "";
    let lastBody: unknown = null;
    let lastReq: unknown = null;
    while (attempt <= RETRY_DELAYS_MS.length) {
      attempt += 1;
      try {
        const res = await assignTagsByEmail(email, tags);
        lastBody = res.body;
        lastReq = res.request;
        if (res.ok) {
          await logAttempt(supabase, {
            quote_request_id: quoteRequestId,
            source,
            status: "success",
            attempt_count: attempt,
            request_body: res.request,
            response_body: res.body,
            tags_applied: tags,
          });
          return new Response(
            JSON.stringify({ ok: true, attempt, response: res.body }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }
        lastError = `HTTP ${res.status}: ${
          typeof res.body === "string" ? res.body : JSON.stringify(res.body)
        }`;
      } catch (e) {
        lastError = (e as Error).message;
      }
      if (attempt <= RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
      }
    }
    await logAttempt(supabase, {
      quote_request_id: quoteRequestId,
      source,
      status: "failed",
      attempt_count: attempt,
      request_body: lastReq,
      response_body: lastBody,
      tags_applied: null,
      error_message: lastError,
    });
    await notifyAdminOfFailure(supabase, quoteRequestId!, source, lastError);
    return new Response(
      JSON.stringify({ ok: false, error: lastError, attempts: attempt }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ============ Recommendation stage: import with tags inline ============
  const body = buildPayload({ firstName, lastName, email, phone, tags });

  let attempt = 0;
  let lastError = "";
  let lastBody: unknown = null;
  while (attempt <= RETRY_DELAYS_MS.length) {
    attempt += 1;
    try {
      const result = await importProspect(body);
      lastBody = result.body;
      if (result.ok) {
        await logAttempt(supabase, {
          quote_request_id: quoteRequestId,
          quiz_submission_id: quizSubmissionId,
          source,
          status: "success",
          attempt_count: attempt,
          request_body: body,
          response_body: result.body,
          tags_applied: tags,
        });
        return new Response(
          JSON.stringify({ ok: true, attempt, response: result.body }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      lastError = `HTTP ${result.status}: ${
        typeof result.body === "string"
          ? result.body
          : JSON.stringify(result.body)
      }`;
    } catch (e) {
      lastError = (e as Error).message;
    }
    if (attempt <= RETRY_DELAYS_MS.length) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
    }
  }

  await logAttempt(supabase, {
    quote_request_id: quoteRequestId,
    quiz_submission_id: quizSubmissionId,
    source,
    status: "failed",
    attempt_count: attempt,
    request_body: body,
    response_body: lastBody,
    tags_applied: null,
    error_message: lastError,
  });
  await notifyAdminOfFailure(
    supabase,
    quizSubmissionId ?? quoteRequestId ?? "unknown",
    source,
    lastError,
  );

  return new Response(
    JSON.stringify({ ok: false, error: lastError, attempts: attempt }),
    {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
