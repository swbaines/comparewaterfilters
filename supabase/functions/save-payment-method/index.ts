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

    const { payment_method_id } = await req.json()
    if (!payment_method_id) {
      return new Response(JSON.stringify({ error: 'payment_method_id is required' }), {
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

    // Read Stripe details from the dedicated table
    const { data: stripeDetails } = await supabaseAdmin
      .from('provider_stripe_details')
      .select('stripe_customer_id')
      .eq('provider_id', vendorAccount.provider_id)
      .single()

    if (!stripeDetails?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'Provider or Stripe customer not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    await stripe.paymentMethods.attach(payment_method_id, {
      customer: stripeDetails.stripe_customer_id,
    })

    await stripe.customers.update(stripeDetails.stripe_customer_id, {
      invoice_settings: { default_payment_method: payment_method_id },
    })

    // Save to provider_stripe_details table
    const { error: updateError } = await supabaseAdmin
      .from('provider_stripe_details')
      .update({ stripe_payment_method_id: payment_method_id })
      .eq('provider_id', vendorAccount.provider_id)

    if (updateError) {
      console.error('Failed to save payment method:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to save payment method' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error saving payment method:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
