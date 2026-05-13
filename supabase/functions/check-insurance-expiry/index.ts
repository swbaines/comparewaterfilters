// Daily cron: warn vendors whose public liability insurance is expiring soon,
// and auto-pause those whose insurance has already lapsed.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "hello@comparewaterfilters.com.au";
const REMINDER_DAYS = [30, 14, 7, 1];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Restrict invocation to internal cron / service role.
  {
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (bearer !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setDate(horizon.getDate() + 30);

  // Approved providers with an insurance_expiry_date in the next 30 days OR already expired.
  const { data: providers, error } = await supabase
    .from("providers")
    .select("id, name, contact_email, insurance_expiry_date, available_for_quote, insurance_paused_at")
    .eq("approval_status", "approved")
    .not("insurance_expiry_date", "is", null)
    .lte("insurance_expiry_date", horizon.toISOString().slice(0, 10));

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary = { reminders: 0, paused: 0, errors: [] as string[] };
  const newlyPaused: { id: string; name: string; expiry: string }[] = [];

  for (const p of providers || []) {
    const expiry = new Date(p.insurance_expiry_date as string);
    expiry.setHours(0, 0, 0, 0);
    const days = Math.round((expiry.getTime() - today.getTime()) / 86400000);

    try {
      if (days < 0) {
        // Expired — pause if not already paused
        if (!p.insurance_paused_at) {
          await supabase.from("providers").update({
            available_for_quote: false,
            insurance_paused_at: new Date().toISOString(),
          } as never).eq("id", p.id);
          newlyPaused.push({ id: p.id, name: p.name, expiry: p.insurance_expiry_date as string });
          summary.paused++;
        }
        if (p.contact_email) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "vendor-welcome",
              recipientEmail: p.contact_email,
              idempotencyKey: `insurance-expired-${p.id}-${p.insurance_expiry_date}`,
              templateData: {
                businessName: p.name,
                subjectOverride: "Action required: your insurance has expired",
                bodyOverride: `Your public liability insurance expired on ${p.insurance_expiry_date}. Your listing has been paused — please upload a renewed Certificate of Currency in your vendor dashboard to resume receiving leads.`,
              },
            },
          });
        }
      } else if (REMINDER_DAYS.includes(days) && p.contact_email) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "vendor-welcome",
            recipientEmail: p.contact_email,
            idempotencyKey: `insurance-expiry-${p.id}-${days}d`,
            templateData: {
              businessName: p.name,
              subjectOverride: `Insurance expires in ${days} day${days === 1 ? "" : "s"}`,
              bodyOverride: `A friendly reminder — your public liability insurance expires on ${p.insurance_expiry_date} (${days} day${days === 1 ? "" : "s"} away). Please upload your renewed Certificate of Currency in your vendor dashboard to avoid your listing being paused.`,
            },
          },
        });
        summary.reminders++;
      }
    } catch (e) {
      summary.errors.push(`${p.id}: ${(e as Error).message}`);
    }
  }

  if (newlyPaused.length > 0) {
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "admin-vendor-notification",
        recipientEmail: ADMIN_EMAIL,
        idempotencyKey: `insurance-paused-batch-${today.toISOString().slice(0, 10)}`,
        templateData: {
          businessName: `${newlyPaused.length} provider(s) auto-paused — expired insurance`,
          vendorEmail: ADMIN_EMAIL,
          notes: newlyPaused.map((p) => `${p.name} (expired ${p.expiry})`).join("\n"),
          registeredAt: new Date().toISOString(),
        },
      },
    });
  }

  return new Response(JSON.stringify({ ok: true, scanned: providers?.length || 0, ...summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
