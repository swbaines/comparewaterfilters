import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default lead price in dollars if not set on the record
const DEFAULT_LEAD_PRICE = 85;

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Prefer": "return=representation",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const results: any[] = [];
  const errors: any[] = [];

  try {
    // Get date range for last month
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodStart = firstOfLastMonth.toISOString();
    const periodEnd = firstOfThisMonth.toISOString();

    // Get all approved providers with a Stripe customer ID and card on file
    const providers = await supabaseFetch(
      `/providers?approval_status=eq.approved&stripe_customer_id=not.is.null&stripe_payment_method_id=not.is.null&select=id,name,contact_email,stripe_customer_id,stripe_payment_method_id`
    );

    for (const provider of providers) {
      try {
        // Get uninvoiced leads for this provider in the last month
        const leads = await supabaseFetch(
          `/quote_requests?provider_id=eq.${provider.id}&lead_status=neq.lost&invoice_id=is.null&created_at=gte.${periodStart}&created_at=lt.${periodEnd}&select=id,recommended_systems,lead_price`
        );

        if (leads.length === 0) {
          results.push({ provider: provider.name, status: "skipped", reason: "no leads" });
          continue;
        }

        // Calculate total amount using stored lead_price
        let totalCents = 0;
        const lineItems: any[] = [];

        for (const lead of leads) {
          // Use the lead_price set at quote submission (Owner=$85, Rental=$50)
          const leadPriceDollars = Number(lead.lead_price) || DEFAULT_LEAD_PRICE;
          const leadPriceCents = Math.round(leadPriceDollars * 100);

          totalCents += leadPriceCents;
          lineItems.push({
            lead_id: lead.id,
            amount_cents: leadPriceCents,
          });
        }

        if (totalCents === 0) {
          results.push({ provider: provider.name, status: "skipped", reason: "zero amount" });
          continue;
        }

        // Create Stripe invoice
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

        // Create invoice in Stripe
        const stripeInvoice = await stripe.invoices.create({
          customer: provider.stripe_customer_id,
          auto_advance: false,
          collection_method: "charge_automatically",
          default_payment_method: provider.stripe_payment_method_id,
          metadata: {
            provider_id: provider.id,
            period_start: periodStart,
            period_end: periodEnd,
            invoice_number: invoiceNumber,
          },
          description: `Compare Water Filters — leads for ${firstOfLastMonth.toLocaleString("en-AU", { month: "long", year: "numeric" })}`,
        });

        // Add line item to Stripe invoice
        await stripe.invoiceItems.create({
          customer: provider.stripe_customer_id,
          invoice: stripeInvoice.id,
          amount: totalCents,
          currency: "aud",
          description: `${leads.length} lead${leads.length > 1 ? "s" : ""} — ${firstOfLastMonth.toLocaleString("en-AU", { month: "long", year: "numeric" })}`,
        });

        // Finalise and charge the invoice
        await stripe.invoices.finalizeInvoice(stripeInvoice.id);
        const paidInvoice = await stripe.invoices.pay(stripeInvoice.id);

        // Save invoice to Supabase
        const [savedInvoice] = await supabaseFetch("/invoices", {
          method: "POST",
          body: JSON.stringify({
            provider_id: provider.id,
            invoice_number: invoiceNumber,
            stripe_invoice_id: stripeInvoice.id,
            period_start: periodStart,
            period_end: periodEnd,
            total_amount: totalCents / 100,
            lead_count: leads.length,
            status: paidInvoice.status === "paid" ? "paid" : "sent",
            paid_at: paidInvoice.status === "paid" ? new Date().toISOString() : null,
            notes: `Stripe Invoice: ${stripeInvoice.id}`,
          }),
        });

        // Mark all leads as invoiced
        for (const item of lineItems) {
          await supabaseFetch(`/quote_requests?id=eq.${item.lead_id}`, {
            method: "PATCH",
            body: JSON.stringify({
              invoice_id: savedInvoice.id,
              lead_price: item.amount_cents / 100,
            }),
          });
        }

        results.push({
          provider: provider.name,
          status: "charged",
          leads: leads.length,
          amount: `$${(totalCents / 100).toFixed(2)}`,
          stripe_invoice: stripeInvoice.id,
        });

      } catch (providerErr: any) {
        errors.push({ provider: provider.name, error: providerErr.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
