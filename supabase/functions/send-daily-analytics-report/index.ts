import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ADMIN_EMAIL = Deno.env.get('DAILY_REPORT_RECIPIENT') ?? 'hello@comparewaterfilters.com.au'

// Australia/Sydney offset is +10/+11; we approximate "yesterday in AEST" by
// shifting to UTC+10 (AEST). DST drift of 1h is acceptable for a daily window.
function aestDayWindow(daysAgo: number) {
  const now = new Date()
  const aestMs = now.getTime() + 10 * 60 * 60 * 1000
  const aest = new Date(aestMs)
  aest.setUTCHours(0, 0, 0, 0)
  aest.setUTCDate(aest.getUTCDate() - daysAgo)
  const start = new Date(aest.getTime() - 10 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

async function countRows(
  supabase: ReturnType<typeof createClient>,
  table: string,
  start: Date,
  end: Date,
  filter?: (q: any) => any,
) {
  let q = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
  if (filter) q = filter(q)
  const { count, error } = await q
  if (error) throw new Error(`${table} count failed: ${error.message}`)
  return count ?? 0
}

async function sumPaidRevenue(
  supabase: ReturnType<typeof createClient>,
  start: Date,
  end: Date,
) {
  const { data, error } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('status', 'paid')
    .gte('paid_at', start.toISOString())
    .lt('paid_at', end.toISOString())
  if (error) throw new Error(`invoices sum failed: ${error.message}`)
  return (data ?? []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
}

async function gather(supabase: ReturnType<typeof createClient>, daysAgo: number) {
  const { start, end } = aestDayWindow(daysAgo)
  const [quiz, quotes, won] = await Promise.all([
    countRows(supabase, 'quiz_submissions', start, end),
    countRows(supabase, 'quote_requests', start, end),
    countRows(supabase, 'quote_requests', start, end, (q) => q.eq('lead_status', 'won')),
  ])
  const revenue = await sumPaidRevenue(supabase, start, end)
  const conversion = quiz > 0 ? (quotes / quiz) * 100 : 0
  return { start, end, quiz, quotes, won, revenue, conversion }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
    const today = await gather(supabase, 1) // yesterday
    const prev = await gather(supabase, 2)

    const reportDate = new Intl.DateTimeFormat('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney',
    }).format(today.start)

    const idempotencyKey = `daily-analytics-${today.start.toISOString().slice(0, 10)}`

    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'daily-analytics-report',
        recipientEmail: ADMIN_EMAIL,
        idempotencyKey,
        templateData: {
          reportDate,
          quizCompletions: today.quiz,
          quizCompletionsPrev: prev.quiz,
          quoteRequests: today.quotes,
          quoteRequestsPrev: prev.quotes,
          conversionRate: today.conversion,
          conversionRatePrev: prev.conversion,
          wonLeads: today.won,
          wonLeadsPrev: prev.won,
          revenuePaid: today.revenue,
          revenuePaidPrev: prev.revenue,
        },
      },
    })
    if (error) throw error

    return new Response(
      JSON.stringify({ ok: true, reportDate, stats: today }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (err) {
    console.error('send-daily-analytics-report error', err)
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})