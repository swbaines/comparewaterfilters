import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Australian Business Number checksum algorithm.
// https://abr.business.gov.au/Help/AbnFormat
const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
function isValidAbnChecksum(abn: string): boolean {
  if (!/^\d{11}$/.test(abn)) return false
  const digits = abn.split('').map((d) => parseInt(d, 10))
  digits[0] -= 1
  const sum = digits.reduce((acc, d, i) => acc + d * WEIGHTS[i], 0)
  return sum % 89 === 0
}

function normaliseName(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/\b(pty|ltd|limited|inc|incorporated|the|t\/a|trading as)\b/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function namesMatch(a: string, b: string): boolean {
  const na = normaliseName(a)
  const nb = normaliseName(b)
  if (!na || !nb) return false
  if (na === nb) return true
  // tolerate trading-name variations: one fully contains the other
  return na.includes(nb) || nb.includes(na)
}

interface AbrLookupResult {
  ok: boolean
  status: 'Active' | 'Cancelled' | 'Unknown'
  entityName: string | null
  businessNames: string[]
  gstRegistered: boolean | null
  raw: unknown
  error?: string
}

async function lookupAbr(abn: string, guid: string): Promise<AbrLookupResult> {
  const url = `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${encodeURIComponent(
    abn,
  )}&guid=${encodeURIComponent(guid)}`
  const resp = await fetch(url, { headers: { Accept: 'application/json' } })
  const text = await resp.text()
  // ABR returns JSONP-style: callback({...}) — strip if present.
  const jsonText = text.replace(/^[^(]*\(/, '').replace(/\)\s*;?\s*$/, '')
  let parsed: any
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return {
      ok: false,
      status: 'Unknown',
      entityName: null,
      businessNames: [],
      gstRegistered: null,
      raw: text,
      error: 'ABR returned non-JSON payload',
    }
  }
  if (parsed.Message) {
    return {
      ok: false,
      status: 'Unknown',
      entityName: null,
      businessNames: [],
      gstRegistered: null,
      raw: parsed,
      error: String(parsed.Message),
    }
  }
  const status = parsed.AbnStatus === 'Active' ? 'Active' : parsed.AbnStatus === 'Cancelled' ? 'Cancelled' : 'Unknown'
  const entityName: string | null = parsed.EntityName || null
  const businessNames: string[] = Array.isArray(parsed.BusinessName)
    ? parsed.BusinessName.filter((s: unknown): s is string => typeof s === 'string')
    : []
  const gstRegistered =
    typeof parsed.Gst === 'string' ? parsed.Gst.length > 0 : null
  return { ok: true, status, entityName, businessNames, gstRegistered, raw: parsed }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server misconfigured' }, 500)

  // Authenticate caller via JWT (verify_jwt is off by default).
  const authHeader = req.headers.get('Authorization') || ''
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData } = await userClient.auth.getUser()
  if (!userData?.user) return json({ error: 'Unauthorized' }, 401)

  let body: { provider_id?: string; abn?: string; business_name?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const providerId = body.provider_id?.trim()
  const rawAbn = (body.abn ?? '').replace(/\s/g, '')
  const businessName = (body.business_name ?? '').trim()

  if (!/^\d{11}$/.test(rawAbn)) {
    return json({ verified: false, reason: 'format', error: 'ABN must be exactly 11 digits' }, 200)
  }
  if (!isValidAbnChecksum(rawAbn)) {
    return json({ verified: false, reason: 'checksum', error: 'ABN failed checksum validation' }, 200)
  }

  const admin = createClient(supabaseUrl, serviceKey)

  const startedAt = Date.now()
  const logLookup = async (fields: Record<string, unknown>) => {
    try {
      await admin.from('abr_lookups').insert({
        user_id: userData.user.id,
        provider_id: providerId || null,
        submitted_abn: rawAbn,
        submitted_business_name: businessName || null,
        duration_ms: Date.now() - startedAt,
        ...fields,
      })
    } catch (e) {
      console.error('Failed to log abr lookup', e)
    }
  }

  // Preview mode: no provider_id supplied (e.g. pre-registration). We still
  // require an authenticated user, perform the live ABR lookup, and log the
  // result, but skip the provider ownership check and DB writes.
  let prov: { id: string; name: string; submitted_by: string | null } | null = null
  if (providerId) {
    const { data: provRow } = await admin
      .from('providers')
      .select('id, name, submitted_by')
      .eq('id', providerId)
      .maybeSingle()
    if (!provRow) return json({ error: 'Provider not found' }, 404)
    prov = provRow as any
    const { data: vendorLink } = await admin
      .from('vendor_accounts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('provider_id', providerId)
      .maybeSingle()
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
    const isAdmin = (roles || []).some((r: any) => r.role === 'admin')
    if (!isAdmin && !vendorLink && prov!.submitted_by !== userData.user.id) {
      return json({ error: 'Forbidden' }, 403)
    }
  }

  const guid = Deno.env.get('ABR_API_GUID')

  // Without a GUID, accept the checksum-only verification (live mode disabled).
  if (!guid) {
    const nowIso = new Date().toISOString()
    if (providerId) {
      await admin
        .from('providers')
        .update({
          abn: rawAbn,
          abn_verified: true,
          abn_verified_at: nowIso,
          abn_verification_response: { mode: 'checksum-only', verified_at: nowIso },
          abn_review_flag: null,
        })
        .eq('id', providerId)
    }
    await logLookup({
      mode: 'checksum-only',
      verified: true,
      status: 'Unknown',
      raw_response: { mode: 'checksum-only', verified_at: nowIso },
    })
    return json({ verified: true, mode: 'checksum-only' })
  }

  const lookup = await lookupAbr(rawAbn, guid)
  const nowIso = new Date().toISOString()

  if (!lookup.ok || lookup.status === 'Unknown') {
    if (providerId) {
      await admin
        .from('providers')
        .update({
          abn: rawAbn,
          abn_verified: false,
          abn_verified_at: null,
          abn_verification_response: lookup.raw as any,
          abn_review_flag: 'abr_lookup_failed',
        })
        .eq('id', providerId)
    }
    await logLookup({
      mode: 'live',
      verified: false,
      status: 'Unknown',
      review_flag: 'abr_lookup_failed',
      error_message: lookup.error || null,
      raw_response: lookup.raw as any,
    })
    return json({ verified: false, reason: 'abr_lookup_failed', error: lookup.error })
  }

  if (lookup.status === 'Cancelled') {
    if (providerId) {
      await admin
        .from('providers')
        .update({
          abn: rawAbn,
          abn_verified: false,
          abn_verified_at: null,
          abn_verification_response: lookup.raw as any,
          abn_review_flag: 'abn_cancelled',
          available_for_quote: false,
        })
        .eq('id', providerId)
    }
    await logLookup({
      mode: 'live',
      verified: false,
      status: 'Cancelled',
      entity_name: lookup.entityName,
      business_names: lookup.businessNames,
      gst_registered: lookup.gstRegistered,
      review_flag: 'abn_cancelled',
      raw_response: lookup.raw as any,
    })
    return json({
      verified: false,
      reason: 'abn_cancelled',
      status: 'Cancelled',
      entityName: lookup.entityName,
      businessNames: lookup.businessNames,
    })
  }

  // Status = Active. Compare names; flag mismatch for admin review instead of auto-approving.
  const submitted = businessName || prov?.name || ''
  const candidates = [lookup.entityName, ...lookup.businessNames].filter(Boolean) as string[]
  const matched = candidates.some((c) => namesMatch(submitted, c))
  const reviewFlag = matched ? null : 'name_mismatch'

  if (providerId) {
    await admin
      .from('providers')
      .update({
        abn: rawAbn,
        abn_verified: matched,
        abn_verified_at: matched ? nowIso : null,
        abn_verification_response: lookup.raw as any,
        abn_review_flag: reviewFlag,
      })
      .eq('id', providerId)
  }

  await logLookup({
    mode: 'live',
    verified: matched,
    status: 'Active',
    entity_name: lookup.entityName,
    business_names: lookup.businessNames,
    gst_registered: lookup.gstRegistered,
    review_flag: reviewFlag,
    raw_response: lookup.raw as any,
  })

  return json({
    verified: matched,
    status: lookup.status,
    entityName: lookup.entityName,
    businessNames: lookup.businessNames,
    gstRegistered: lookup.gstRegistered,
    review_flag: reviewFlag,
  })
})