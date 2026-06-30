/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Section, Row, Column, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'
const LOGO_URL = 'https://xbryypgsryjhuscyglbu.supabase.co/storage/v1/object/public/email-assets/logo-wordmark.png'

interface DailyAnalyticsReportProps {
  reportDate?: string
  quizCompletions?: number
  quizCompletionsPrev?: number
  quoteRequests?: number
  quoteRequestsPrev?: number
  conversionRate?: number
  conversionRatePrev?: number
  wonLeads?: number
  wonLeadsPrev?: number
  revenuePaid?: number
  revenuePaidPrev?: number
}

const fmtPct = (curr: number, prev: number) => {
  if (!prev) return curr > 0 ? '+∞%' : '0%'
  const diff = ((curr - prev) / prev) * 100
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff.toFixed(0)}%`
}
const fmtMoney = (v: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v || 0)

const DailyAnalyticsReportEmail = ({
  reportDate = '',
  quizCompletions = 0,
  quizCompletionsPrev = 0,
  quoteRequests = 0,
  quoteRequestsPrev = 0,
  conversionRate = 0,
  conversionRatePrev = 0,
  wonLeads = 0,
  wonLeadsPrev = 0,
  revenuePaid = 0,
  revenuePaidPrev = 0,
}: DailyAnalyticsReportProps) => {
  const Stat = ({ label, value, delta }: { label: string; value: string; delta: string }) => (
    <Section style={statCard}>
      <Text style={statLabel}>{label}</Text>
      <Text style={statValue}>{value}</Text>
      <Text style={statDelta}>{delta} vs previous day</Text>
    </Section>
  )

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{SITE_NAME} — daily analytics for {reportDate}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={LOGO_URL} width="200" height="29" alt={SITE_NAME} style={{ marginBottom: '12px' }} />
          <Hr style={divider} />

          <Section style={{ textAlign: 'center' as const, padding: '4px 0' }}>
            <Text style={headerIcon}>📊</Text>
            <Heading style={h1}>Daily Analytics Report</Heading>
            <Text style={headerSubtext}>Platform performance for {reportDate}</Text>
          </Section>

          <Hr style={divider} />

          <Row>
            <Column style={colHalf}>
              <Stat label="Quiz Completions" value={String(quizCompletions)} delta={fmtPct(quizCompletions, quizCompletionsPrev)} />
            </Column>
            <Column style={colHalf}>
              <Stat label="Quote Requests" value={String(quoteRequests)} delta={fmtPct(quoteRequests, quoteRequestsPrev)} />
            </Column>
          </Row>
          <Row>
            <Column style={colHalf}>
              <Stat label="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} delta={fmtPct(conversionRate, conversionRatePrev)} />
            </Column>
            <Column style={colHalf}>
              <Stat label="Won Leads" value={String(wonLeads)} delta={fmtPct(wonLeads, wonLeadsPrev)} />
            </Column>
          </Row>
          <Row>
            <Column style={colFull}>
              <Stat label="Revenue (Paid)" value={fmtMoney(revenuePaid)} delta={fmtPct(revenuePaid, revenuePaidPrev)} />
            </Column>
          </Row>

          <Section style={{ textAlign: 'center' as const, margin: '24px 0 0' }}>
            <Button style={ctaButton} href="https://comparewaterfilters.com.au/admin/analytics">
              Open full dashboard
            </Button>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>Automated daily report from {SITE_NAME}.</Text>
          <EmailDisclaimerFooter />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DailyAnalyticsReportEmail,
  subject: (data: Record<string, any>) =>
    `Daily analytics — ${data.reportDate || ''} · ${data.quizCompletions || 0} quizzes, ${data.quoteRequests || 0} quotes`,
  displayName: 'Daily analytics report',
  to: 'hello@comparewaterfilters.com.au',
  previewData: {
    reportDate: '29 Jun 2026',
    quizCompletions: 11,
    quizCompletionsPrev: 8,
    quoteRequests: 3,
    quoteRequestsPrev: 2,
    conversionRate: 27.3,
    conversionRatePrev: 25.0,
    wonLeads: 1,
    wonLeadsPrev: 0,
    revenuePaid: 85,
    revenuePaidPrev: 0,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const headerIcon = { fontSize: '32px', margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 6px' }
const headerSubtext = { fontSize: '13px', color: 'hsl(220, 10%, 46%)', margin: '0' }
const colHalf = { width: '50%', padding: '6px', verticalAlign: 'top' as const }
const colFull = { width: '100%', padding: '6px', verticalAlign: 'top' as const }
const statCard = { backgroundColor: '#f7faf9', border: '1px solid #e5e2dc', borderRadius: '12px', padding: '14px 16px' }
const statLabel = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const statValue = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 4px' }
const statDelta = { fontSize: '11px', color: 'hsl(168, 42%, 40%)', margin: '0' }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }