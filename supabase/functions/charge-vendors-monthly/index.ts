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

const OWNER_LEAD_PRICE = 85;
const RENTAL_LEAD_PRICE = 50;

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
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodStart = firstOfLastMonth.toISOString();
    const periodEnd = firstOfThisMonth.toISOString();

    // Get all provider Stripe details that have both customer ID and payment method
    const stripeDetails = await supabaseFetch(
      `/provider_stripe_details?stripe_customer_id=not.is.null&stripe_payment_method_id=not.is.null&select=provider_id,stripe_customer_id,stripe_payment_method_id`
    );

    // Get provider info for those providers
    const providerIds = stripeDetails.map((s: any) => s.provider_id);
    if (providerIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [], errors: [], message: "No providers with payment methods" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const providers = await supabaseFetch(
      `/providers?id=in.(${providerIds.join(",")})&approval_status=eq.approved&select=id,name,contact_email`
    );

    // Build a lookup map for stripe details
    const stripeMap: Record<string, any> = {};
    for (const s of stripeDetails) {
      stripeMap[s.provider_id] = s;
    }

    for (const provider of providers) {
      try {
        const sd = stripeMap[provider.id];
        if (!sd) continue;

        const leads = await supabaseFetch(
          `/quote_requests?provider_id=eq.${provider.id}&lead_status=neq.lost&invoice_id=is.null&created_at=gte.${periodStart}&created_at=lt.${periodEnd}&select=id,recommended_systems,lead_price,ownership_status`
        );

        if (leads.length === 0) {
          results.push({ provider: provider.name, status: "skipped", reason: "no leads" });
          continue;
        }

        let totalCents = 0;
        const lineItems: any[] = [];

        for (const lead of leads) {
          const leadPriceDollars = Number(lead.lead_price) || (lead.ownership_status === "Rent" ? RENTAL_LEAD_PRICE : OWNER_LEAD_PRICE);
          const leadPriceCents = Math.round(leadPriceDollars * 100);
          totalCents += leadPriceCents;
          lineItems.push({ lead_id: lead.id, amount_cents: leadPriceCents });
        }

        if (totalCents === 0) {
          results.push({ provider: provider.name, status: "skipped", reason: "zero amount" });
          continue;
        }

        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

        const stripeInvoice = await stripe.invoices.create({
          customer: sd.stripe_customer_id,
          auto_advance: false,
          collection_method: "charge_automatically",
          default_payment_method: sd.stripe_payment_method_id,
          metadata: {
            provider_id: provider.id,
            period_start: periodStart,
            period_end: periodEnd,
            invoice_number: invoiceNumber,
          },
          description: `Compare Water Filters — leads for ${firstOfLastMonth.toLocaleString("en-AU", { month: "long", year: "numeric" })}`,
        });

        await stripe.invoiceItems.create({
          customer: sd.stripe_customer_id,
          invoice: stripeInvoice.id,
          amount: totalCents,
          currency: "aud",
          description: `${leads.length} lead${leads.length > 1 ? "s" : ""} — ${firstOfLastMonth.toLocaleString("en-AU", { month: "long", year: "numeric" })}`,
        });

        await stripe.invoices.finalizeInvoice(stripeInvoice.id);
        const paidInvoice = await stripe.invoices.pay(stripeInvoice.id);

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
          }),
        });

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
