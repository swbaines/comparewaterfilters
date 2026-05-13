import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
function isValidAbnChecksum(abn: string): boolean {
  if (!/^\d{11}$/.test(abn)) return false
  const digits = abn.split('').map((d) => parseInt(d, 10))
  digits[0] -= 1
  return digits.reduce((acc, d, i) => acc + d * WEIGHTS[i], 0) % 89 === 0
}

async function lookupAbr(abn: string, guid: string) {
  const url = `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${abn}&guid=${guid}`
  const resp = await fetch(url, { headers: { Accept: 'application/json' } })
  const text = await resp.text()
  const jsonText = text.replace(/^[^(]*\(/, '').replace(/\)\s*;?\s*$/, '')
  try {
    return JSON.parse(jsonText)
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server misconfigured' }, 500)

  // Restrict invocation to internal cron / service role.
  {
    const authHeader = req.headers.get('Authorization') ?? ''
    const bearer = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : ''
    if (bearer !== serviceKey) return json({ error: 'Forbidden' }, 403)
  }

  const guid = Deno.env.get('ABR_API_GUID')
  if (!guid) return json({ skipped: true, reason: 'ABR_API_GUID not configured' })

  const admin = createClient(supabaseUrl, serviceKey)

  // Re-verify ABNs that were verified more than 90 days ago, or never re-checked.
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: providers, error } = await admin
    .from('providers')
    .select('id, name, abn, abn_verified_at')
    .not('abn', 'is', null)
    .or(`abn_verified_at.is.null,abn_verified_at.lt.${cutoff}`)
    .limit(50)
  if (error) return json({ error: error.message }, 500)

  const results: Array<{ id: string; status: string }> = []
  for (const p of providers || []) {
    const abn = (p.abn || '').replace(/\s/g, '')
    if (!isValidAbnChecksum(abn)) {
      await admin
        .from('providers')
        .update({ abn_verified: false, abn_review_flag: 'checksum_failed' })
        .eq('id', p.id)
      results.push({ id: p.id, status: 'checksum_failed' })
      continue
    }
    const lookup = await lookupAbr(abn, guid)
    const nowIso = new Date().toISOString()
    if (!lookup || lookup.Message) {
      await admin
        .from('providers')
        .update({ abn_verification_response: lookup ?? { error: 'no response' }, abn_review_flag: 'abr_lookup_failed' })
        .eq('id', p.id)
      results.push({ id: p.id, status: 'abr_lookup_failed' })
      continue
    }
    if (lookup.AbnStatus === 'Cancelled') {
      await admin
        .from('providers')
        .update({
          abn_verified: false,
          abn_verified_at: null,
          abn_verification_response: lookup,
          abn_review_flag: 'abn_cancelled',
          available_for_quote: false,
        })
        .eq('id', p.id)
      results.push({ id: p.id, status: 'cancelled_paused' })
      continue
    }
    if (lookup.AbnStatus === 'Active') {
      await admin
        .from('providers')
        .update({
          abn_verified: true,
          abn_verified_at: nowIso,
          abn_verification_response: lookup,
          abn_review_flag: null,
        })
        .eq('id', p.id)
      results.push({ id: p.id, status: 'active' })
    }
  }

  return json({ checked: results.length, results })
})