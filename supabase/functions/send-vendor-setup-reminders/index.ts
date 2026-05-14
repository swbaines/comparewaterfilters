// Hourly cron: remind approved vendors who haven't completed terms + billing setup.
// Sends up to 3 reminders (24h, 72h, 7d) then notifies admin.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "hello@comparewaterfilters.com.au";

// Reminder schedule: hours since approval that trigger reminder N
const REMINDER_SCHEDULE = [
  { count: 0, afterHours: 24 },  // first reminder after 24h
  { count: 1, afterHours: 72 },  // second after 72h
  { count: 2, afterHours: 168 }, // third after 7d
];
const ADMIN_NOTIFY_HOURS = 168; // 7 days

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Only allow invocations that present the service role key (i.e. pg_cron / internal callers).
  // Reject anonymous users, signed-in users, and the anon/publishable key.
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const cronSecretHeader = req.headers.get("x-cron-secret") ?? "";
  const isServiceRole = bearer === SUPABASE_SERVICE_ROLE_KEY;
  const isCronSecret =
    !!cronSecretHeader && cronSecretHeader === SUPABASE_SERVICE_ROLE_KEY;
  if (!isServiceRole && !isCronSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();

  // Pull approved providers whose approval is at least 24h old and reminder cap not yet reached.
  const cutoff24h = new Date(now.getTime() - 24 * 3600_000).toISOString();

  const { data: providers, error } = await supabase
    .from("providers")
    .select(`
      id, name, contact_email, approved_at,
      setup_reminder_count, setup_reminder_sent_at, setup_reminder_admin_notified_at,
      provider_stripe_details ( stripe_payment_method_id, direct_debit_authorised_at )
    `)
    .eq("approval_status", "approved")
    .not("approved_at", "is", null)
    .lte("approved_at", cutoff24h);

  if (error) {
    console.error("query providers failed", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary = { reminders: 0, adminNotified: 0, skipped: 0, errors: [] as string[] };

  for (const p of providers || []) {
    const stripe = Array.isArray((p as any).provider_stripe_details)
      ? (p as any).provider_stripe_details[0]
      : (p as any).provider_stripe_details;
    const billingReady = !!(stripe?.stripe_payment_method_id && stripe?.direct_debit_authorised_at);

    // Terms are now captured at registration, so setup completion only
    // depends on billing readiness.
    if (billingReady) { summary.skipped++; continue; }

    const approvedAt = new Date(p.approved_at as string);
    const hoursSince = (now.getTime() - approvedAt.getTime()) / 3600_000;
    const count = p.setup_reminder_count ?? 0;

    try {
      // Determine which reminder is due, if any
      const due = REMINDER_SCHEDULE.find(
        (r) => r.count === count && hoursSince >= r.afterHours,
      );

      if (due && p.contact_email) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "vendor-setup-reminder",
            recipientEmail: p.contact_email,
            idempotencyKey: `vendor-setup-reminder-${p.id}-${count + 1}`,
            templateData: {
              contactName: p.name,
              reminderNumber: count + 1,
            },
          },
        });
        await supabase.from("providers").update({
          setup_reminder_count: count + 1,
          setup_reminder_sent_at: now.toISOString(),
        } as never).eq("id", p.id);
        summary.reminders++;
      }

      // Admin notify after 7 days if still not complete and not yet notified
      if (
        hoursSince >= ADMIN_NOTIFY_HOURS &&
        count >= 3 &&
        !p.setup_reminder_admin_notified_at
      ) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "admin-vendor-notification",
            recipientEmail: ADMIN_EMAIL,
            idempotencyKey: `vendor-setup-admin-alert-${p.id}`,
            templateData: {
              subjectOverride: `Vendor ${p.name} hasn't completed setup after 7 days`,
              bodyOverride: `Vendor ${p.name} was approved but hasn't completed setup after 7 days — consider following up directly or removing from the platform.`,
              businessName: p.name,
            },
          },
        });
        await supabase.from("providers").update({
          setup_reminder_admin_notified_at: now.toISOString(),
        } as never).eq("id", p.id);
        summary.adminNotified++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("reminder failed", p.id, msg);
      summary.errors.push(`${p.id}: ${msg}`);
    }
  }

  return new Response(JSON.stringify({ ok: true, summary }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});