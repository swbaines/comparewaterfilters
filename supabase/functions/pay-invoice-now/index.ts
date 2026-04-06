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

    // Verify caller is authenticated
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

    // Get vendor's provider
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

    // Get provider with Stripe details
    const { data: provider } = await supabaseAdmin
      .from('providers')
      .select('id, stripe_customer_id, stripe_payment_method_id')
      .eq('id', vendorAccount.provider_id)
      .single()

    if (!provider?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!provider.stripe_payment_method_id) {
      return new Response(JSON.stringify({ error: 'No payment method on file. Please add a card first.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get the invoice and verify it belongs to this provider
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

    // Create and confirm a PaymentIntent using the saved card
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'aud',
      customer: provider.stripe_customer_id,
      payment_method: provider.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: `Invoice ${invoice.invoice_number}`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
      },
    })

    if (paymentIntent.status === 'succeeded') {
      // Mark invoice as paid
      await supabaseAdmin
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_invoice_id: paymentIntent.id,
        })
        .eq('id', invoice.id)

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
