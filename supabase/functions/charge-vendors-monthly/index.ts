const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // This function is called by cron — verify with Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    // Get previous month range
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const periodStart = lastMonth.toISOString().split('T')[0]
    const periodEnd = lastMonthEnd.toISOString().split('T')[0]

    // Get all approved providers
    const { data: providers, error: provError } = await supabaseAdmin
      .from('providers')
      .select('id, name, contact_email')
      .eq('approval_status', 'approved')

    if (provError) throw provError

    const results: Array<{ provider_id: string; status: string; amount?: number; error?: string }> = []

    for (const provider of providers || []) {
      try {
        // Get leads for last month
        const { data: leads, error: leadsError } = await supabaseAdmin
          .from('quote_requests')
          .select('id, lead_price, recommended_systems')
          .eq('provider_id', provider.id)
          .gte('created_at', `${periodStart}T00:00:00Z`)
          .lte('created_at', `${periodEnd}T23:59:59Z`)

        if (leadsError) throw leadsError
        if (!leads || leads.length === 0) {
          results.push({ provider_id: provider.id, status: 'no_leads' })
          continue
        }

        // Calculate total
        let totalAmount = 0
        for (const lead of leads) {
          totalAmount += Number(lead.lead_price) || 0
        }

        if (totalAmount <= 0) {
          results.push({ provider_id: provider.id, status: 'zero_amount' })
          continue
        }

        // Generate invoice number
        const monthStr = `${lastMonth.getFullYear()}${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
        const invoiceNumber = `INV-${monthStr}-${provider.id.substring(0, 8).toUpperCase()}`

        // Create invoice record
        const { data: invoice, error: invError } = await supabaseAdmin
          .from('invoices')
          .insert({
            provider_id: provider.id,
            invoice_number: invoiceNumber,
            period_start: periodStart,
            period_end: periodEnd,
            total_amount: totalAmount,
            lead_count: leads.length,
            status: 'sent',
          })
          .select()
          .single()

        if (invError) throw invError

        // Try to charge via Stripe
        const customers = await stripe.customers.list({
          email: provider.contact_email || undefined,
          limit: 1,
        })

        if (customers.data.length > 0) {
          const customer = customers.data[0]
          const paymentMethods = await stripe.paymentMethods.list({
            customer: customer.id,
            type: 'card',
          })

          if (paymentMethods.data.length > 0) {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(totalAmount * 100), // cents
              currency: 'aud',
              customer: customer.id,
              payment_method: paymentMethods.data[0].id,
              off_session: true,
              confirm: true,
              metadata: {
                provider_id: provider.id,
                invoice_id: invoice.id,
                invoice_number: invoiceNumber,
              },
            })

            if (paymentIntent.status === 'succeeded') {
              await supabaseAdmin
                .from('invoices')
                .update({ status: 'paid', paid_at: new Date().toISOString() })
                .eq('id', invoice.id)
            }

            results.push({
              provider_id: provider.id,
              status: paymentIntent.status,
              amount: totalAmount,
            })
          } else {
            results.push({ provider_id: provider.id, status: 'no_payment_method', amount: totalAmount })
          }
        } else {
          results.push({ provider_id: provider.id, status: 'no_stripe_customer', amount: totalAmount })
        }

        // Link leads to invoice
        for (const lead of leads) {
          await supabaseAdmin
            .from('quote_requests')
            .update({ invoice_id: invoice.id })
            .eq('id', lead.id)
        }

      } catch (err) {
        results.push({ provider_id: provider.id, status: 'error', error: err.message })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in charge-vendors-monthly:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
