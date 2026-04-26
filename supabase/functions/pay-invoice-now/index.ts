import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@18.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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

    const { invoice_id } = await req.json()
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: 'invoice_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: vendorAccount } = await supabaseAdmin
      .from('vendor_accounts')
      .select('provider_id')
      .eq('user_id', user.id)
      .single()

    if (!vendorAccount) {
      return new Response(JSON.stringify({ error: 'No vendor account found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get provider basic info
    const { data: provider } = await supabaseAdmin
      .from('providers')
      .select('id, name, contact_email')
      .eq('id', vendorAccount.provider_id)
      .single()

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Provider not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get Stripe details from dedicated table
    const { data: stripeDetails } = await supabaseAdmin
      .from('provider_stripe_details')
      .select('stripe_customer_id, stripe_payment_method_id')
      .eq('provider_id', provider.id)
      .single()

    if (!stripeDetails?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!stripeDetails.stripe_payment_method_id) {
      return new Response(JSON.stringify({ error: 'No payment method on file. Please add a card first.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .eq('provider_id', provider.id)
      .single()

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (invoice.status === 'paid') {
      return new Response(JSON.stringify({ error: 'Invoice is already paid' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (invoice.status === 'cancelled') {
      return new Response(JSON.stringify({ error: 'Invoice is cancelled' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const amountCents = Math.round(Number(invoice.total_amount) * 100)
    if (amountCents <= 0) {
      return new Response(JSON.stringify({ error: 'Invoice amount is zero' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    // ============= DUPLICATE-CHARGE GUARDS =============
    // 1) If this invoice already has a linked Stripe Invoice (email path), check its status first.
    if (invoice.stripe_invoice_id && invoice.stripe_invoice_id.startsWith('in_')) {
      try {
        const existingInv = await stripe.invoices.retrieve(invoice.stripe_invoice_id)
        if (existingInv.status === 'paid') {
          await supabaseAdmin
            .from('invoices')
            .update({ status: 'paid', paid_at: new Date((existingInv.status_transitions?.paid_at ?? Date.now() / 1000) * 1000).toISOString() })
            .eq('id', invoice.id)
          return new Response(JSON.stringify({ success: true, status: 'paid', already_paid: true, source: 'stripe_invoice' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (e) {
        console.error('Failed to verify existing Stripe invoice:', e)
      }
    }

    // 2) Search Stripe for any successful PaymentIntent already tagged with this invoice_id
    try {
      const search = await stripe.paymentIntents.search({
        query: `metadata['invoice_id']:'${invoice.id}' AND status:'succeeded'`,
        limit: 1,
      })
      if (search.data.length > 0) {
        const existingPi = search.data[0]
        await supabaseAdmin
          .from('invoices')
          .update({ status: 'paid', paid_at: new Date(existingPi.created * 1000).toISOString(), stripe_invoice_id: existingPi.id })
          .eq('id', invoice.id)
        return new Response(JSON.stringify({ success: true, status: 'paid', already_paid: true, source: 'payment_intent' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } catch (e) {
      console.error('PaymentIntent search failed (non-fatal):', e)
    }

    // 3) Use a Stripe idempotency key so retries within 24h cannot double-charge.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'aud',
      customer: stripeDetails.stripe_customer_id,
      payment_method: stripeDetails.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: `Invoice ${invoice.invoice_number}`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
      },
    }, {
      idempotencyKey: `pay-invoice-${invoice.id}`,
    })

    if (paymentIntent.status === 'succeeded') {
      const paidAt = new Date().toISOString()
      await supabaseAdmin
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: paidAt,
          stripe_invoice_id: paymentIntent.id,
        })
        .eq('id', invoice.id)

      if (provider.contact_email) {
        try {
          await supabaseAdmin.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'payment-confirmation',
              recipientEmail: provider.contact_email,
              idempotencyKey: `payment-confirm-${invoice.id}`,
              templateData: {
                providerName: provider.name,
                invoiceNumber: invoice.invoice_number,
                totalAmount: `$${Number(invoice.total_amount).toFixed(2)}`,
                leadCount: invoice.lead_count,
                periodStart: invoice.period_start,
                periodEnd: invoice.period_end,
                paidAt,
              },
            },
          })
        } catch (emailErr) {
          console.error('Failed to send payment confirmation email:', emailErr)
        }
      }

      return new Response(JSON.stringify({ success: true, status: 'paid' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: false,
      status: paymentIntent.status,
      error: 'Payment was not completed. Please try again or contact support.',
    }), {
      status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error processing payment:', error)
    const message = error?.raw?.message || error?.message || 'Payment failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
