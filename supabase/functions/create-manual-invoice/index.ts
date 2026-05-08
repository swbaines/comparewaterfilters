const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id, _role: 'admin'
    })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { provider_id, period_start, period_end, notes } = await req.json()

    if (!provider_id || !period_start || !period_end) {
      return new Response(JSON.stringify({ error: 'provider_id, period_start, and period_end are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get leads in period
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('quote_requests')
      .select('id, lead_price, recommended_systems, ownership_status')
      .eq('provider_id', provider_id)
      .is('invoice_id', null)
      .gte('created_at', `${period_start}T00:00:00Z`)
      .lte('created_at', `${period_end}T23:59:59Z`)

    if (leadsError) throw leadsError

    let totalAmount = 0
    for (const lead of leads || []) {
      // Price based on ownership status: Own=$85, Rent=$50
      const price = Number(lead.lead_price) || (lead.ownership_status === "Rent" ? 25 : 85)
      totalAmount += price
    }

    // Generate invoice number
    const dateStr = new Date().toISOString().replace(/[-T:]/g, '').substring(0, 12)
    const invoiceNumber = `INV-M-${dateStr}-${provider_id.substring(0, 8).toUpperCase()}`

    // Create invoice
    const { data: invoice, error: invError } = await supabaseAdmin
      .from('invoices')
      .insert({
        provider_id,
        invoice_number: invoiceNumber,
        period_start,
        period_end,
        total_amount: totalAmount,
        lead_count: (leads || []).length,
        status: 'sent',
        notes: notes || null,
      })
      .select()
      .single()

    if (invError) throw invError

    // Link leads to invoice
    for (const lead of (leads || [])) {
      await supabaseAdmin
        .from('quote_requests')
        .update({ invoice_id: invoice.id })
        .eq('id', lead.id)
    }

    // Try to create Stripe invoice too
    const { data: provider } = await supabaseAdmin
      .from('providers')
      .select('name, contact_email')
      .eq('id', provider_id)
      .single()

    let stripeInvoiceId = null
    if (provider?.contact_email) {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
        apiVersion: '2023-10-16',
      })

      const customers = await stripe.customers.list({
        email: provider.contact_email,
        limit: 1,
      })

      if (customers.data.length > 0) {
        const stripeInvoice = await stripe.invoices.create({
          customer: customers.data[0].id,
          collection_method: 'send_invoice',
          days_until_due: 14,
          metadata: {
            provider_id,
            invoice_id: invoice.id,
            invoice_number: invoiceNumber,
          },
        })

        await stripe.invoiceItems.create({
          customer: customers.data[0].id,
          invoice: stripeInvoice.id,
          amount: Math.round(totalAmount * 100),
          currency: 'aud',
          description: `Lead charges: ${period_start} to ${period_end} (${(leads || []).length} leads)`,
        })

        await stripe.invoices.sendInvoice(stripeInvoice.id)
        stripeInvoiceId = stripeInvoice.id

        // Save stripe_invoice_id back to the invoice record
        await supabaseAdmin
          .from('invoices')
          .update({ stripe_invoice_id: stripeInvoiceId })
          .eq('id', invoice.id)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      invoice,
      lead_count: (leads || []).length,
      total_amount: totalAmount,
      stripe_invoice_id: stripeInvoiceId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Error creating manual invoice:', error)
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
