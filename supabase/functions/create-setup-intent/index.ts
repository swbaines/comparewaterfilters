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
      .select('stripe_customer_id')
      .eq('provider_id', provider.id)
      .single()

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    let customerId: string

    if (stripeDetails?.stripe_customer_id) {
      customerId = stripeDetails.stripe_customer_id
    } else {
      // Find or create Stripe customer
      const existingCustomers = await stripe.customers.list({
        email: provider.contact_email || undefined,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: provider.contact_email || undefined,
          name: provider.name,
          metadata: { provider_id: provider.id },
        })
        customerId = customer.id
      }

      // Save to provider_stripe_details
      await supabaseAdmin
        .from('provider_stripe_details')
        .upsert({
          provider_id: provider.id,
          stripe_customer_id: customerId,
        }, { onConflict: 'provider_id' })
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: { provider_id: provider.id },
    })

    return new Response(JSON.stringify({
      client_secret: setupIntent.client_secret,
      customer_id: customerId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Error creating setup intent:', error)
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
