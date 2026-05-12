/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Button, Section, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'
const LOGO_URL = 'https://xbryypgsryjhuscyglbu.supabase.co/storage/v1/object/public/email-assets/logo-wordmark.png'

interface AdminVendorNotificationProps {
  businessName?: string
  vendorEmail?: string
  abn?: string
  states?: string[]
  systemTypes?: string[]
  hasPublicLiability?: boolean
  registeredAt?: string
}

const AdminVendorNotificationEmail = ({
  businessName = 'New Business',
  vendorEmail = '',
  abn = '',
  states = [],
  systemTypes = [],
  hasPublicLiability = false,
  registeredAt = '',
}: AdminVendorNotificationProps) => {
  const formattedDate = registeredAt
    ? new Date(registeredAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New vendor registration: {businessName} — review required</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={LOGO_URL} width="200" height="29" alt={SITE_NAME} style={{ marginBottom: '12px' }} />
          <Hr style={divider} />

          <Section style={headerSection}>
            <Text style={headerIcon}>💧</Text>
            <Heading style={h1}>New Vendor Registration</Heading>
            <Text style={headerSubtext}>
              A new provider has registered and is awaiting your review.
            </Text>
          </Section>

          <Hr style={divider} />

          {formattedDate && <Text style={dateTag}>Registered · {formattedDate}</Text>}

          <Section style={infoSection}>
            <Heading as="h3" style={sectionHeading}>Business Details</Heading>
            <Row style={infoRow}><Column style={labelCol}>Business Name</Column><Column style={valueCol}>{businessName}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>Email</Column><Column style={valueCol}>{vendorEmail}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>ABN</Column><Column style={valueCol}>{abn || 'Not provided'}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>States</Column><Column style={valueCol}>{states.length > 0 ? states.join(', ') : 'Not specified'}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>System Types</Column><Column style={valueCol}>{systemTypes.length > 0 ? systemTypes.join(', ') : 'Not specified'}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>Public Liability</Column><Column style={valueCol}>{hasPublicLiability ? 'Yes' : 'No'}</Column></Row>
          </Section>

          <Section style={{ textAlign: 'center' as const, margin: '28px 0 0' }}>
            <Button style={ctaButton} href="https://comparewaterfilters.com.au/admin/providers">
              Review in Admin Panel
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            This is an automated notification from {SITE_NAME}.
          </Text>
          <EmailDisclaimerFooter />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminVendorNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New vendor registration: ${data.businessName || 'Unknown'} — review required`,
  displayName: 'Admin vendor notification',
  to: 'hello@comparewaterfilters.com.au',
  previewData: {
    businessName: "Sam's Water Filtration",
    vendorEmail: 'sam@example.com',
    abn: '12345678901',
    states: ['NSW', 'VIC'],
    systemTypes: ['Whole House Filtration'],
    hasPublicLiability: true,
    registeredAt: '2026-04-06T10:00:00Z',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '540px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 8px' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const headerSection = { textAlign: 'center' as const, padding: '8px 0' }
const headerIcon = { fontSize: '32px', margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 8px' }
const headerSubtext = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', margin: '0' }
const dateTag = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '0 0 16px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const infoSection = { margin: '0' }
const sectionHeading = { fontSize: '13px', fontWeight: '600' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const infoRow = { margin: '0 0 6px' }
const labelCol = { fontSize: '13px', color: 'hsl(220, 10%, 46%)', width: '130px', verticalAlign: 'top' as const, padding: '2px 0' }
const valueCol = { fontSize: '13px', color: 'hsl(220, 20%, 14%)', fontWeight: '500' as const, padding: '2px 0' }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
