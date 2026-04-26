import Stripe from "npm:stripe@14.21.0";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

/**
 * Emit a single structured JSON log line for every webhook response so
 * production logs are grep/filter-friendly. Always carries `code`,
 * `event_type`, `event_id`, `status`, and the response `outcome`
 * ("success" | "duplicate" | "error").
 */
type LogLevel = "log" | "warn" | "error";
type LogEntry = {
  fn: "stripe-webhook";
  code: string;
  status: number;
  outcome: "success" | "duplicate" | "error";
  event_id: string | null;
  event_type: string | null;
  stripe_object_id: string | null;
  request_id: string | null;
  message?: string;
  detail?: unknown;
};

/**
 * Lazily-created service-role client used ONLY for log persistence. Kept at
 * module scope so we don't reconnect for each log line.
 */
let logClient: SupabaseClient | null = null;
function getLogClient(): SupabaseClient | null {
  if (logClient) return logClient;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  logClient = createClient(url, key);
  return logClient;
}

/**
 * Convert an arbitrary `detail` value into something safe to store in JSONB.
 * Errors and circular structures are stringified rather than dropped.
 */
function normalizeDetail(detail: unknown): unknown {
  if (detail === undefined) return null;
  if (detail instanceof Error) {
    return { name: detail.name, message: detail.message, stack: detail.stack };
  }
  try {
    // Round-trip through JSON to strip non-serializable values.
    return JSON.parse(JSON.stringify(detail));
  } catch {
    return { unserializable: String(detail) };
  }
}

/** Fire-and-forget DB persistence of a log entry. Never throws. */
function persistLog(entry: LogEntry): void {
  const client = getLogClient();
  if (!client) return;
  const row = {
    level: entry.code === "EVENT_RECEIVED" || entry.outcome === "success" || entry.outcome === "duplicate"
      ? "log"
      : "error",
    code: entry.code,
    status: entry.status,
    outcome: entry.outcome,
    event_id: entry.event_id,
    event_type: entry.event_type,
    stripe_object_id: entry.stripe_object_id,
    request_id: entry.request_id,
    message: entry.message ?? null,
    detail: normalizeDetail(entry.detail),
  };
  // Don't await — webhook responses must not be delayed by log writes.
  client
    .from("stripe_webhook_logs")
    .insert(row)
    .then(({ error }) => {
      if (error) {
        // Log to console only — avoid recursion into persistLog.
        console.error(
          JSON.stringify({
            fn: "stripe-webhook",
            code: "LOG_PERSIST_FAILED",
            status: 0,
            outcome: "error",
            event_id: entry.event_id,
            event_type: entry.event_type,
            stripe_object_id: entry.stripe_object_id,
            request_id: entry.request_id,
            message: "Failed to persist webhook log entry",
            detail: { db_error: error.message, original_code: entry.code },
          }),
        );
      }
    });
}

function logEvent(level: LogLevel, entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  // Best-effort DB persistence with the actual log level.
  persistLogWithLevel(level, entry);
}

function persistLogWithLevel(level: LogLevel, entry: LogEntry): void {
  const client = getLogClient();
  if (!client) return;
  const row = {
    level,
    code: entry.code,
    status: entry.status,
    outcome: entry.outcome,
    event_id: entry.event_id,
    event_type: entry.event_type,
    stripe_object_id: entry.stripe_object_id,
    request_id: entry.request_id,
    message: entry.message ?? null,
    detail: normalizeDetail(entry.detail),
  };
  client
    .from("stripe_webhook_logs")
    .insert(row)
    .then(({ error }) => {
      if (error) {
        console.error(
          JSON.stringify({
            fn: "stripe-webhook",
            code: "LOG_PERSIST_FAILED",
            status: 0,
            outcome: "error",
            event_id: entry.event_id,
            event_type: entry.event_type,
            stripe_object_id: entry.stripe_object_id,
            request_id: entry.request_id,
            message: "Failed to persist webhook log entry",
            detail: { db_error: error.message, original_code: entry.code },
          }),
        );
      }
    });
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  ctx: {
    level: LogLevel;
    code: string;
    outcome: "success" | "duplicate" | "error";
    event_id?: string | null;
    event_type?: string | null;
    stripe_object_id?: string | null;
    request_id?: string | null;
    message?: string;
    detail?: unknown;
  },
): Response {
  logEvent(ctx.level, {
    fn: "stripe-webhook",
    code: ctx.code,
    status,
    outcome: ctx.outcome,
    event_id: ctx.event_id ?? null,
    event_type: ctx.event_type ?? null,
    stripe_object_id: ctx.stripe_object_id ?? null,
    request_id: ctx.request_id ?? null,
    message: ctx.message,
    detail: ctx.detail,
  });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Pull a string `id` from an unknown Stripe object, or null. */
function readObjectId(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const id = (obj as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/** Pull `request.id` from a Stripe Event payload, or null. */
function readRequestId(ev: unknown): string | null {
  if (!ev || typeof ev !== "object") return null;
  const req = (ev as { request?: unknown }).request;
  if (req && typeof req === "object") {
    const id = (req as { id?: unknown }).id;
    if (typeof id === "string" && id.length > 0) return id;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return jsonResponse(
      500,
      { code: "SERVER_MISCONFIGURED", error: "Server misconfigured" },
      {
        level: "error",
        code: "SERVER_MISCONFIGURED",
        outcome: "error",
        message: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET",
      },
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse(
      400,
      { code: "MISSING_SIGNATURE", error: "Missing stripe-signature header" },
      {
        level: "error",
        code: "MISSING_SIGNATURE",
        outcome: "error",
        message: "Request missing stripe-signature header",
      },
    );
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = (err as Error).message;
    return jsonResponse(
      400,
      { code: "INVALID_SIGNATURE", error: `Webhook Error: ${message}` },
      {
        level: "error",
        code: "INVALID_SIGNATURE",
        outcome: "error",
        message: "Signature verification failed",
        detail: message,
      },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Capture cross-cutting context once so every downstream log line carries
  // the same identifiers.
  const requestId = readRequestId(event);
  const dataObjectEarly = (event.data as { object?: unknown } | undefined)?.object;
  const stripeObjectIdEarly = readObjectId(dataObjectEarly);

  logEvent("log", {
    fn: "stripe-webhook",
    code: "EVENT_RECEIVED",
    status: 0,
    outcome: "success",
    event_id: (event.id as string | undefined) ?? null,
    event_type: (event.type as string | undefined) ?? null,
    stripe_object_id: stripeObjectIdEarly,
    request_id: requestId,
    message: "Received event",
  });

  // Guard: Stripe events must carry an `id`. If a malformed payload slips past
  // signature verification (e.g. a future SDK shape change or a manually
  // forged-but-correctly-signed test event), refuse it explicitly instead of
  // letting a NULL value blow up the idempotency insert with an opaque error.
  if (!event.id || typeof event.id !== "string") {
    return jsonResponse(
      400,
      {
        code: "INVALID_EVENT_ID",
        error: "Invalid webhook payload: event.id is required",
        event_type: event.type ?? null,
      },
      {
        level: "error",
        code: "INVALID_EVENT_ID",
        outcome: "error",
        event_id: null,
        event_type: (event.type as string | undefined) ?? null,
        stripe_object_id: stripeObjectIdEarly,
        request_id: requestId,
        message: "Rejecting event with missing/invalid id",
      },
    );
  }

  // Guard: event.type drives our switch/router. Without a string type we can't
  // safely dispatch, and downstream logging/metrics would be meaningless.
  const eventType = (event as { type?: unknown }).type;
  if (!eventType || typeof eventType !== "string") {
    return jsonResponse(
      400,
      {
        code: "INVALID_EVENT_TYPE",
        error: "Invalid webhook payload: event.type is required",
        event_id: event.id,
      },
      {
        level: "error",
        code: "INVALID_EVENT_TYPE",
        outcome: "error",
        event_id: event.id,
        event_type: null,
        stripe_object_id: stripeObjectIdEarly,
        request_id: requestId,
        message: "Rejecting event with missing/invalid type",
      },
    );
  }

  // Guard: every Stripe event we route on carries `event.data.object`. A
  // malformed payload (e.g. truncated body, hand-crafted webhook) without it
  // would otherwise crash inside the switch with an opaque TypeError.
  const dataObject = (event.data as { object?: unknown } | undefined)?.object;
  if (!dataObject || typeof dataObject !== "object" || Array.isArray(dataObject)) {
    return jsonResponse(
      400,
      {
        code: "INVALID_PAYLOAD_SHAPE",
        error: "Invalid webhook payload: event.data.object is required",
        event_id: event.id,
        event_type: eventType,
      },
      {
        level: "error",
        code: "INVALID_PAYLOAD_SHAPE",
        outcome: "error",
        event_id: event.id,
        event_type: eventType,
        stripe_object_id: null,
        request_id: requestId,
        message: "Missing or non-object event.data.object",
      },
    );
  }

  const stripeObjectId = readObjectId(dataObject);

  // Per-type required-field validation. Only the event types we actually
  // handle need strict checks — unhandled types fall through to the default
  // branch and are no-ops, so we don't reject them here.
  const requiredFieldsByType: Record<string, string[]> = {
    "invoice.paid": ["id"],
    "invoice.payment_succeeded": ["id"],
    "invoice.payment_failed": ["id"],
    "payment_intent.succeeded": ["id"],
  };
  const required = requiredFieldsByType[eventType];
  if (required) {
    const obj = dataObject as Record<string, unknown>;
    const missing = required.filter(
      (f) => obj[f] === undefined || obj[f] === null || obj[f] === "",
    );
    if (missing.length > 0) {
      return jsonResponse(
        400,
        {
          code: "INVALID_PAYLOAD_FIELDS",
          error: `Invalid webhook payload: missing required field(s) on event.data.object: ${missing.join(", ")}`,
          event_id: event.id,
          event_type: eventType,
          missing_fields: missing,
        },
        {
          level: "error",
          code: "INVALID_PAYLOAD_FIELDS",
          outcome: "error",
          event_id: event.id,
          event_type: eventType,
          stripe_object_id: stripeObjectId,
          request_id: requestId,
          message: "Missing required field(s) on event.data.object",
          detail: { missing_fields: missing },
        },
      );
    }
  }

  // Idempotency: try to claim this event ID. If it already exists (unique
  // constraint violation, code 23505), Stripe is retrying an event we already
  // processed — return 200 immediately so Stripe stops retrying.
  const { error: claimError } = await supabase
    .from("stripe_webhook_events")
    .insert({ stripe_event_id: event.id, event_type: event.type });

  if (claimError) {
    if ((claimError as { code?: string }).code === "23505") {
      return jsonResponse(
        200,
        { received: true, duplicate: true },
        {
          level: "log",
          code: "DUPLICATE_EVENT",
          outcome: "duplicate",
          event_id: event.id,
          event_type: eventType,
          stripe_object_id: stripeObjectId,
          request_id: requestId,
          message: "Duplicate event; skipping processing",
        },
      );
    }
    // Any other failure: log and continue. We'd rather process twice than
    // drop a real event because the dedupe table is unavailable.
    logEvent("error", {
      fn: "stripe-webhook",
      code: "IDEMPOTENCY_INSERT_FAILED",
      status: 0,
      outcome: "error",
      event_id: event.id,
      event_type: eventType,
      stripe_object_id: stripeObjectId,
      request_id: requestId,
      message: "Failed to record event for idempotency",
      detail: claimError,
    });
  }

  try {
    switch (event.type) {
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const internalInvoiceId = invoice.metadata?.invoice_id;

        // Try by metadata first, fall back to stripe_invoice_id match
        const query = supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          });

        const { data, error } = internalInvoiceId
          ? await query.eq("id", internalInvoiceId).select()
          : await query.eq("stripe_invoice_id", invoice.id).select();

        if (error) {
          logEvent("error", {
            fn: "stripe-webhook",
            code: "INVOICE_UPDATE_FAILED",
            status: 0,
            outcome: "error",
            event_id: event.id,
            event_type: eventType,
            stripe_object_id: invoice.id ?? stripeObjectId,
            request_id: requestId,
            message: "Failed to update invoice for Stripe invoice",
            detail: error,
          });
        } else {
          logEvent("log", {
            fn: "stripe-webhook",
            code: "INVOICE_MARKED_PAID",
            status: 0,
            outcome: "success",
            event_id: event.id,
            event_type: eventType,
            stripe_object_id: invoice.id ?? stripeObjectId,
            request_id: requestId,
            message: "Marked invoice(s) as paid for Stripe invoice",
            detail: { updated_rows: data?.length ?? 0 },
          });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const internalInvoiceId = pi.metadata?.invoice_id;

        if (!internalInvoiceId) {
          logEvent("log", {
            fn: "stripe-webhook",
            code: "PAYMENT_INTENT_NO_METADATA",
            status: 0,
            outcome: "success",
            event_id: event.id,
            event_type: eventType,
            stripe_object_id: pi.id ?? stripeObjectId,
            request_id: requestId,
            message: "PaymentIntent has no invoice_id metadata; skipping",
          });
          break;
        }

        const { data, error } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_invoice_id: pi.id,
          })
          .eq("id", internalInvoiceId)
          .neq("status", "paid")
          .select();

        if (error) {
          logEvent("error", {
            fn: "stripe-webhook",
            code: "INVOICE_UPDATE_FAILED",
            status: 0,
            outcome: "error",
            event_id: event.id,
            event_type: eventType,
            stripe_object_id: pi.id ?? stripeObjectId,
            request_id: requestId,
            message: "Failed to update invoice from PaymentIntent",
            detail: error,
          });
        } else {
          logEvent("log", {
            fn: "stripe-webhook",
            code: "INVOICE_MARKED_PAID",
            status: 0,
            outcome: "success",
            event_id: event.id,
            event_type: eventType,
            stripe_object_id: pi.id ?? stripeObjectId,
            request_id: requestId,
            message: "Marked invoice(s) as paid for PaymentIntent",
            detail: { updated_rows: data?.length ?? 0 },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const internalInvoiceId = invoice.metadata?.invoice_id;
        const query = supabase.from("invoices").update({ status: "overdue" });
        const { error } = internalInvoiceId
          ? await query.eq("id", internalInvoiceId)
          : await query.eq("stripe_invoice_id", invoice.id);
        if (error) {
          logEvent("error", {
            fn: "stripe-webhook",
            code: "INVOICE_OVERDUE_FAILED",
            status: 0,
            outcome: "error",
            event_id: event.id,
            event_type: eventType,
            stripe_object_id: invoice.id ?? stripeObjectId,
            request_id: requestId,
            message: "Failed to mark invoice overdue",
            detail: error,
          });
        }
        break;
      }

      default:
        logEvent("log", {
          fn: "stripe-webhook",
          code: "UNHANDLED_EVENT_TYPE",
          status: 0,
          outcome: "success",
          event_id: event.id,
          event_type: eventType,
          stripe_object_id: stripeObjectId,
          request_id: requestId,
          message: "Unhandled event type",
        });
    }

    return jsonResponse(
      200,
      { received: true },
      {
        level: "log",
        code: "EVENT_PROCESSED",
        outcome: "success",
        event_id: event.id,
        event_type: eventType,
        stripe_object_id: stripeObjectId,
        request_id: requestId,
        message: "Event processed",
      },
    );
  } catch (err) {
    const message = (err as Error).message;
    return jsonResponse(
      500,
      { code: "HANDLER_ERROR", error: message },
      {
        level: "error",
        code: "HANDLER_ERROR",
        outcome: "error",
        event_id: event.id,
        event_type: eventType,
        stripe_object_id: stripeObjectId,
        request_id: requestId,
        message: "Webhook handler error",
        detail: message,
      },
    );
  }
});