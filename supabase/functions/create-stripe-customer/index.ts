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

    const { provider_id } = await req.json()
    if (!provider_id) {
      return new Response(JSON.stringify({ error: 'provider_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get provider details
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('providers')
      .select('id, name, contact_email, phone')
      .eq('id', provider_id)
      .single()

    if (providerError || !provider) {
      return new Response(JSON.stringify({ error: 'Provider not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: provider.contact_email || undefined,
      limit: 1,
    })

    let customer
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      // Update metadata
      customer = await stripe.customers.update(customer.id, {
        metadata: { provider_id: provider.id, provider_name: provider.name },
      })
    } else {
      customer = await stripe.customers.create({
        email: provider.contact_email || undefined,
        name: provider.name,
        phone: provider.phone || undefined,
        metadata: { provider_id: provider.id, provider_name: provider.name },
      })
    }

    // Save stripe_customer_id to the providers table
    const { error: updateError } = await supabaseAdmin
      .from('providers')
      .update({ stripe_customer_id: customer.id })
      .eq('id', provider.id)

    if (updateError) {
      console.error('Failed to save stripe_customer_id:', updateError)
    }

    return new Response(JSON.stringify({
      success: true,
      customer_id: customer.id,
      provider_id: provider.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
