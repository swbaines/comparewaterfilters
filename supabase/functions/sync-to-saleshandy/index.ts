// Saleshandy CRM sync — pushes a lead as a prospect.
//
// Triggers:
// - AFTER INSERT on quiz_submissions where consent = true (source = 'recommendation')
// - AFTER INSERT on quote_requests (source = 'quote_request')
// - Manual resync from admin UI
// - Retry processor (process-saleshandy-retries) re-invokes with { retry_log_id }
//
// On retryable failure we DO NOT retry inline — instead we schedule a deferred
// retry by writing a 'retry_scheduled' row in saleshandy_sync_log with
// next_retry_at. A pg_cron job + process-saleshandy-retries function pick it up.
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

// Retry schedule: first retry +30s, second retry +5min. Index = retry_count of
// the *previous* attempt (0-based). If retry_count >= RETRY_DELAYS_MS.length
// after a failure, the row is permanently_failed.
const RETRY_DELAYS_MS = [30_000, 5 * 60_000];
const MAX_RETRIES = RETRY_DELAYS_MS.length;

type Source = "recommendation" | "quote_request";
type SBClient = ReturnType<typeof createClient>;

// ---------- formatting ----------

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const v = email.trim().toLowerCase();
  return v.length > 0 ? v : null;
}

function normalizeAuMobile(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const digitsAndPlus = String(raw).replace(/[^\d+]/g, "");
  if (!digitsAndPlus) return null;
  if (digitsAndPlus.startsWith("+61")) return digitsAndPlus;
  if (digitsAndPlus.startsWith("61") && digitsAndPlus.length >= 11) return "+" + digitsAndPlus;
  if (digitsAndPlus.startsWith("04") && digitsAndPlus.length === 10) return "+61" + digitsAndPlus.slice(1);
  if (digitsAndPlus.startsWith("4") && digitsAndPlus.length === 9) return "+61" + digitsAndPlus;
  return digitsAndPlus.startsWith("+") ? digitsAndPlus : "+" + digitsAndPlus;
}

function splitName(full: unknown): { firstName: string; lastName: string } {
  if (typeof full !== "string" || !full.trim()) return { firstName: "", lastName: "" };
  const parts = full.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

// ---------- logging ----------

type LogStatus =
  | "pending"
  | "success"
  | "failed"
  | "retry_scheduled"
  | "permanently_failed"
  | "skipped_no_consent"
  | "skipped_no_email"
  | "prospect_not_found";

interface LogParams {
  quote_request_id?: string | null;
  quiz_submission_id?: string | null;
  source: Source | null;
  status: LogStatus;
  attempt_count: number;
  retry_count?: number;
  next_retry_at?: string | null;
  request_body?: unknown;
  response_body?: unknown;
  tags_applied?: string[] | null;
  error_message?: string | null;
  email?: string | null;
  endpoint_used?: string | null;
  response_code?: number | null;
}

async function logAttempt(supabase: SBClient, params: LogParams) {
  await supabase.from("saleshandy_sync_log").insert({
    quote_request_id: params.quote_request_id ?? null,
    quiz_submission_id: params.quiz_submission_id ?? null,
    source: params.source,
    status: params.status,
    attempt_count: params.attempt_count,
    retry_count: params.retry_count ?? 0,
    next_retry_at: params.next_retry_at ?? null,
    request_body: params.request_body as never,
    response_body: params.response_body as never,
    tags_applied: params.tags_applied ?? null,
    error_message: params.error_message ?? null,
    email: params.email ?? null,
    endpoint_used: params.endpoint_used ?? null,
    response_code: params.response_code ?? null,
  });
}

async function notifyAdminOfFailure(
  supabase: SBClient,
  refId: string,
  source: Source,
  lastError: string,
  permanent = false,
) {
  try {
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "contact-inquiry",
        recipientEmail:
          Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ??
          "admin@comparewaterfilters.com.au",
        idempotencyKey: `saleshandy-${permanent ? "perm" : "fail"}-${source}-${refId}`,
        templateData: {
          subject: permanent
            ? `Saleshandy sync PERMANENTLY FAILED (${source})`
            : `Saleshandy sync failed (${source})`,
          message: `${source} ${refId} ${permanent ? "permanently failed" : "failed"} to sync to Saleshandy.\n\nLast error: ${lastError}`,
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
  return {
    prospectList: [{
      "First Name": params.firstName,
      "Last Name": params.lastName,
      "Email": params.email,
      "Phone Number": params.phone ?? "",
    }],
    verifyProspects: false,
    conflictAction: "overwrite",
    tags: params.tags,
  };
}

async function callSaleshandy(url: string, body: unknown) {
  const apiKey = Deno.env.get("SALESHANDY_API_KEY");
  if (!apiKey) throw new Error("SALESHANDY_API_KEY not configured");
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch { /* keep raw */ }
  return { ok: res.ok, status: res.status, body: parsed };
}

function shouldRetryStatus(status: number): boolean {
  if (status === 408 || status === 429) return true;
  if (status >= 500) return true;
  if (status >= 400 && status < 500) return false;
  return true; // network / unknown
}

function computeNextRetryAt(retryCountAfter: number): string | null {
  // retryCountAfter is the new retry_count value AFTER this failed attempt.
  // We schedule the next retry using the delay at index retryCountAfter - 1
  // (so first failure -> retry_count=1 -> wait RETRY_DELAYS_MS[0]).
  const idx = retryCountAfter - 1;
  if (idx < 0 || idx >= RETRY_DELAYS_MS.length) return null;
  return new Date(Date.now() + RETRY_DELAYS_MS[idx]).toISOString();
}

// ---------- core sync logic (single attempt, no inline retry) ----------

interface SyncContext {
  source: Source;
  quote_request_id: string | null;
  quiz_submission_id: string | null;
  retry_count: number; // attempts already made before this one
}

interface SyncOutcome {
  finalStatus: LogStatus;
  attempt_count: number;
  retry_count: number;
  next_retry_at: string | null;
  request_body: unknown;
  response_body: unknown;
  tags_applied: string[] | null;
  error_message: string | null;
  email: string | null;
  endpoint_used: string | null;
  response_code: number | null;
  refId: string;
}

async function performSync(
  supabase: SBClient,
  ctx: SyncContext,
): Promise<SyncOutcome> {
  const refId = ctx.quiz_submission_id ?? ctx.quote_request_id ?? "unknown";
  let firstName = "";
  let lastName = "";
  let emailRaw: unknown;
  let phoneRaw: unknown;

  if (ctx.source === "recommendation") {
    const { data: sub, error } = await supabase
      .from("quiz_submissions")
      .select("first_name, email, mobile, consent")
      .eq("id", ctx.quiz_submission_id!)
      .maybeSingle();
    if (error || !sub) {
      return baseOutcome(ctx, refId, {
        finalStatus: "failed",
        error_message: error?.message ?? "submission not found",
      });
    }
    if (sub.consent !== true) {
      return baseOutcome(ctx, refId, {
        finalStatus: "skipped_no_consent",
        email: typeof sub.email === "string" ? sub.email.trim().toLowerCase() : null,
      });
    }
    firstName = sub.first_name ?? "";
    emailRaw = sub.email;
    phoneRaw = sub.mobile;
  } else {
    const { data: quote, error } = await supabase
      .from("quote_requests")
      .select("customer_name, customer_email, customer_mobile")
      .eq("id", ctx.quote_request_id!)
      .maybeSingle();
    if (error || !quote) {
      return baseOutcome(ctx, refId, {
        finalStatus: "failed",
        error_message: error?.message ?? "quote not found",
      });
    }
    const { data: submission } = await supabase
      .from("quiz_submissions")
      .select("consent")
      .eq("email", quote.customer_email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!submission || submission.consent !== true) {
      return baseOutcome(ctx, refId, {
        finalStatus: "skipped_no_consent",
        email: typeof quote.customer_email === "string" ? quote.customer_email.trim().toLowerCase() : null,
      });
    }
    const split = splitName(quote.customer_name);
    firstName = split.firstName;
    lastName = split.lastName;
    emailRaw = quote.customer_email;
    phoneRaw = quote.customer_mobile;
  }

  const email = normalizeEmail(emailRaw);
  const phone = normalizeAuMobile(phoneRaw);
  if (!email) {
    return baseOutcome(ctx, refId, { finalStatus: "skipped_no_email" });
  }

  const tags = ctx.source === "recommendation"
    ? ["Lead - No Quote Requested", "Recommendation Stage"]
    : ["Quote Requested"];

  const isQuote = ctx.source === "quote_request";
  const url = isQuote ? SALESHANDY_TAG_ASSIGN_URL : SALESHANDY_IMPORT_URL;
  const reqBody = isQuote
    ? { prospectsEmails: [email], tags }
    : buildPayload({ firstName, lastName, email, phone, tags });

  const attemptNumber = ctx.retry_count + 1;
  let res: { ok: boolean; status: number; body: unknown };
  try {
    res = await callSaleshandy(url, reqBody);
  } catch (e) {
    // network error → retryable
    const newRetryCount = ctx.retry_count + 1;
    const next = computeNextRetryAt(newRetryCount);
    return baseOutcome(ctx, refId, {
      finalStatus: next ? "retry_scheduled" : "permanently_failed",
      attempt_count: attemptNumber,
      retry_count: newRetryCount,
      next_retry_at: next,
      request_body: reqBody,
      error_message: (e as Error).message,
      email,
      endpoint_used: url,
    });
  }

  if (res.ok) {
    return baseOutcome(ctx, refId, {
      finalStatus: "success",
      attempt_count: attemptNumber,
      retry_count: ctx.retry_count,
      request_body: reqBody,
      response_body: res.body,
      tags_applied: tags,
      email,
      endpoint_used: url,
      response_code: res.status,
    });
  }

  const bodyStr = typeof res.body === "string" ? res.body : JSON.stringify(res.body ?? "");
  const errMsg = `HTTP ${res.status}: ${bodyStr}`;

  // For tag-assign: prospect doesn't exist → terminal, not a retry
  if (isQuote && (res.status === 404 || /not.?found|does.?not.?exist|no.?prospect/i.test(bodyStr))) {
    return baseOutcome(ctx, refId, {
      finalStatus: "prospect_not_found",
      attempt_count: attemptNumber,
      retry_count: ctx.retry_count,
      request_body: reqBody,
      response_body: res.body,
      error_message: errMsg,
      email,
      endpoint_used: url,
      response_code: res.status,
    });
  }

  if (!shouldRetryStatus(res.status)) {
    // 4xx (except 408/429): terminal failure
    return baseOutcome(ctx, refId, {
      finalStatus: "permanently_failed",
      attempt_count: attemptNumber,
      retry_count: ctx.retry_count,
      request_body: reqBody,
      response_body: res.body,
      error_message: errMsg,
      email,
      endpoint_used: url,
      response_code: res.status,
    });
  }

  // Retryable failure → schedule next attempt (or permanently fail if exhausted)
  const newRetryCount = ctx.retry_count + 1;
  const next = computeNextRetryAt(newRetryCount);
  return baseOutcome(ctx, refId, {
    finalStatus: next ? "retry_scheduled" : "permanently_failed",
    attempt_count: attemptNumber,
    retry_count: newRetryCount,
    next_retry_at: next,
    request_body: reqBody,
    response_body: res.body,
    error_message: errMsg,
    email,
    endpoint_used: url,
    response_code: res.status,
  });
}

function baseOutcome(
  ctx: SyncContext,
  refId: string,
  overrides: Partial<SyncOutcome> & { finalStatus: LogStatus },
): SyncOutcome {
  return {
    finalStatus: overrides.finalStatus,
    attempt_count: overrides.attempt_count ?? 0,
    retry_count: overrides.retry_count ?? ctx.retry_count,
    next_retry_at: overrides.next_retry_at ?? null,
    request_body: overrides.request_body ?? null,
    response_body: overrides.response_body ?? null,
    tags_applied: overrides.tags_applied ?? null,
    error_message: overrides.error_message ?? null,
    email: overrides.email ?? null,
    endpoint_used: overrides.endpoint_used ?? null,
    response_code: overrides.response_code ?? null,
    refId,
  };
}

// ---------- main handler ----------

export async function runSync(
  supabase: SBClient,
  ctx: SyncContext,
): Promise<SyncOutcome> {
  const outcome = await performSync(supabase, ctx);

  await logAttempt(supabase, {
    quote_request_id: ctx.quote_request_id,
    quiz_submission_id: ctx.quiz_submission_id,
    source: ctx.source,
    status: outcome.finalStatus,
    attempt_count: outcome.attempt_count,
    retry_count: outcome.retry_count,
    next_retry_at: outcome.next_retry_at,
    request_body: outcome.request_body,
    response_body: outcome.response_body,
    tags_applied: outcome.tags_applied,
    error_message: outcome.error_message,
    email: outcome.email,
    endpoint_used: outcome.endpoint_used,
    response_code: outcome.response_code,
  });

  if (outcome.finalStatus === "permanently_failed") {
    await notifyAdminOfFailure(
      supabase,
      outcome.refId,
      ctx.source,
      outcome.error_message ?? "unknown",
      true,
    );
  }

  return outcome;
}

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
    retry_count?: number;
  };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload.quote_request_id && !payload.quiz_submission_id) {
    return new Response(
      JSON.stringify({ error: "quote_request_id or quiz_submission_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const source: Source =
    payload.source ??
    (payload.quiz_submission_id ? "recommendation" : "quote_request");

  const outcome = await runSync(supabase, {
    source,
    quote_request_id: payload.quote_request_id ?? null,
    quiz_submission_id: payload.quiz_submission_id ?? null,
    retry_count: typeof payload.retry_count === "number" ? payload.retry_count : 0,
  });

  const httpStatus =
    outcome.finalStatus === "success" ||
    outcome.finalStatus === "skipped_no_consent" ||
    outcome.finalStatus === "skipped_no_email" ||
    outcome.finalStatus === "prospect_not_found"
      ? 200
      : outcome.finalStatus === "retry_scheduled"
        ? 202
        : 502;

  return new Response(
    JSON.stringify({
      ok: outcome.finalStatus === "success",
      status: outcome.finalStatus,
      attempt: outcome.attempt_count,
      retry_count: outcome.retry_count,
      next_retry_at: outcome.next_retry_at,
      response: outcome.response_body,
      error: outcome.error_message,
    }),
    { status: httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
