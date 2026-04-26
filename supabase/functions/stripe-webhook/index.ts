import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400, headers: corsHeaders });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  console.log(`[stripe-webhook] Received event: ${event.type} (${event.id})`);

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
          console.error("Failed to update invoice:", error);
        } else {
          console.log(`[stripe-webhook] Marked ${data?.length ?? 0} invoice(s) as paid for Stripe invoice ${invoice.id}`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const internalInvoiceId = pi.metadata?.invoice_id;

        if (!internalInvoiceId) {
          console.log(`[stripe-webhook] PaymentIntent ${pi.id} has no invoice_id metadata, skipping`);
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
          console.error("Failed to update invoice from PaymentIntent:", error);
        } else {
          console.log(`[stripe-webhook] Marked ${data?.length ?? 0} invoice(s) as paid for PaymentIntent ${pi.id}`);
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
        if (error) console.error("Failed to mark invoice overdue:", error);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});