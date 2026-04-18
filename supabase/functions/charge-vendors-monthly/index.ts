import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback defaults; live values are read from the lead_prices table (admin-editable)
const DEFAULT_OWNER_LEAD_PRICE = 85;
const DEFAULT_RENTAL_LEAD_PRICE = 50;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const results: any[] = [];
  const errors: any[] = [];

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseKey || !stripeKey) {
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodStart = firstOfLastMonth.toISOString();
    const periodEnd = firstOfThisMonth.toISOString();

    // Get all provider Stripe details that have both customer ID and payment method
    const { data: stripeDetails, error: stripeErr } = await supabaseAdmin
      .from("provider_stripe_details")
      .select("provider_id, stripe_customer_id, stripe_payment_method_id")
      .not("stripe_customer_id", "is", null)
      .not("stripe_payment_method_id", "is", null);

    if (stripeErr) throw stripeErr;

    // Fetch live lead prices and pending price changes (admin-editable in lead_prices table)
    const [{ data: priceRows }, { data: pendingChanges }] = await Promise.all([
      supabaseAdmin.from("lead_prices").select("system_type, price_per_lead"),
      supabaseAdmin
        .from("lead_price_changes")
        .select("system_type, old_price, effective_date")
        .gt("effective_date", new Date().toISOString()),
    ]);

    const resolveEffective = (type: string, fallback: number): number => {
      // If a change is pending, use the OLD price until the effective date passes (Terms 19.3)
      const pending = (pendingChanges || []).find((c: any) => c.system_type === type);
      if (pending) return Number(pending.old_price);
      const row = (priceRows || []).find((p: any) => p.system_type === type);
      return row ? Number(row.price_per_lead) : fallback;
    };

    const ownerLeadPrice = resolveEffective("owner_lead", DEFAULT_OWNER_LEAD_PRICE);
    const rentalLeadPrice = resolveEffective("rental_lead", DEFAULT_RENTAL_LEAD_PRICE);

    const providerIds = (stripeDetails || []).map((s: any) => s.provider_id);
    if (providerIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [], errors: [], message: "No providers with payment methods" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { data: providers, error: provErr } = await supabaseAdmin
      .from("providers")
      .select("id, name, contact_email")
      .in("id", providerIds)
      .eq("approval_status", "approved");

    if (provErr) throw provErr;

    // Build a lookup map for stripe details
    const stripeMap: Record<string, any> = {};
    for (const s of stripeDetails || []) {
      stripeMap[s.provider_id] = s;
    }

    for (const provider of providers || []) {
      try {
        const sd = stripeMap[provider.id];
        if (!sd) continue;

        const { data: leads, error: leadsErr } = await supabaseAdmin
          .from("quote_requests")
          .select("id, recommended_systems, lead_price, ownership_status")
          .eq("provider_id", provider.id)
          .neq("lead_status", "lost")
          .is("invoice_id", null)
          .gte("created_at", periodStart)
          .lt("created_at", periodEnd);

        if (leadsErr) throw leadsErr;

        if (!leads || leads.length === 0) {
          results.push({ provider: provider.name, status: "skipped", reason: "no leads" });
          continue;
        }

        let totalCents = 0;
        const lineItems: any[] = [];

        for (const lead of leads) {
          const leadPriceDollars = Number(lead.lead_price) || (lead.ownership_status === "Rent" ? rentalLeadPrice : ownerLeadPrice);
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

        const { data: savedInvoice, error: saveErr } = await supabaseAdmin
          .from("invoices")
          .insert({
            provider_id: provider.id,
            invoice_number: invoiceNumber,
            stripe_invoice_id: stripeInvoice.id,
            period_start: periodStart,
            period_end: periodEnd,
            total_amount: totalCents / 100,
            lead_count: leads.length,
            status: paidInvoice.status === "paid" ? "paid" : "sent",
            paid_at: paidInvoice.status === "paid" ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (saveErr) throw saveErr;

        for (const item of lineItems) {
          await supabaseAdmin
            .from("quote_requests")
            .update({ invoice_id: savedInvoice.id, lead_price: item.amount_cents / 100 })
            .eq("id", item.lead_id);
        }

        results.push({
          provider: provider.name,
          status: "charged",
          leads: leads.length,
          amount: `$${(totalCents / 100).toFixed(2)}`,
          stripe_invoice: stripeInvoice.id,
        });

      } catch (providerErr: unknown) {
        const msg = providerErr instanceof Error ? providerErr.message : "Unknown error";
        errors.push({ provider: provider.name, error: msg });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err: unknown) {
    console.error("Error in charge-vendors-monthly:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
