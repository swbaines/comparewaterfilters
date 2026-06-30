/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Row, Column, Hr, Button, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'

const budgetLabels: Record<string, string> = {
  'under-1000': 'Under $1,000',
  '1000-3000': '$1,000 – $3,000',
  '3000-6000': '$3,000 – $6,000',
  '6000-plus': '$6,000+',
  'not-sure': 'Not sure yet',
}

const waterSourceLabels: Record<string, string> = {
  'town-water': 'Town water (mains)',
  'rainwater': 'Rainwater tank',
  'tank-water': 'Tank water',
  'bore-water': 'Bore water',
  'not-sure': 'Not sure',
}

interface VendorLeadNotificationProps {
  providerName?: string
  customerName?: string
  customerEmail?: string
  customerMobile?: string
  customerSuburb?: string
  customerState?: string
  customerPostcode?: string
  propertyType?: string
  householdSize?: string
  waterSource?: string
  budget?: string
  concerns?: string[]
  recommendedSystems?: string[]
  message?: string
  createdAt?: string
}

const VendorLeadNotificationEmail = ({
  providerName = 'Your business',
  customerName = 'A customer',
  customerEmail = '',
  customerMobile = '',
  customerSuburb = '',
  customerState = '',
  customerPostcode = '',
  propertyType = '',
  householdSize = '',
  waterSource = '',
  budget = '',
  concerns = [],
  recommendedSystems = [],
  message = '',
  createdAt = '',
}: VendorLeadNotificationProps) => {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const formattedConcerns = concerns
    .map((c) => c.replace(/-/g, ' ').replace(/^\w/, (ch) => ch.toUpperCase()))
    .join(', ')

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New quote request from {customerName} — {customerSuburb}, {customerState}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={headerIcon}>🔔</Text>
            <Heading style={h1}>New Quote Request</Heading>
            <Text style={headerSubtext}>
              A customer has requested a quote from <strong>{providerName}</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          {formattedDate && <Text style={dateTag}>New lead · {formattedDate}</Text>}

          <Section style={infoSection}>
            <Heading as="h3" style={sectionHeading}>Customer Details</Heading>
            <Row style={infoRow}><Column style={labelCol}>Name</Column><Column style={valueCol}>{customerName}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>Mobile</Column><Column style={valueCol}>{customerMobile || 'Not provided'}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>Email</Column><Column style={valueCol}>{customerEmail}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>Location</Column><Column style={valueCol}>{customerSuburb}, {customerState} {customerPostcode}</Column></Row>
          </Section>

          <Hr style={dividerLight} />

          <Section style={infoSection}>
            <Heading as="h3" style={sectionHeading}>Property & Water</Heading>
            <Row style={infoRow}><Column style={labelCol}>Property type</Column><Column style={valueCol}>{propertyType}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>Household size</Column><Column style={valueCol}>{householdSize} people</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>Water source</Column><Column style={valueCol}>{waterSourceLabels[waterSource] || waterSource}</Column></Row>
            <Row style={infoRow}><Column style={labelCol}>Budget</Column><Column style={valueCol}>{budgetLabels[budget] || budget}</Column></Row>
          </Section>

          {recommendedSystems.length > 0 && (
            <>
              <Hr style={dividerLight} />
              <Section style={infoSection}>
                <Heading as="h3" style={sectionHeading}>Recommended Systems</Heading>
                <Text style={tagList}>
                  {recommendedSystems.map((s, i) => (
                    <React.Fragment key={s}>
                      <span style={tag}>{s}</span>
                      {i < recommendedSystems.length - 1 ? ' ' : ''}
                    </React.Fragment>
                  ))}
                </Text>
              </Section>
            </>
          )}

          {formattedConcerns && (
            <>
              <Hr style={dividerLight} />
              <Section style={infoSection}>
                <Heading as="h3" style={sectionHeading}>Water Concerns</Heading>
                <Text style={tagList}>
                  {concerns.map((c, i) => (
                    <React.Fragment key={c}>
                      <span style={tag}>{c.replace(/-/g, ' ').replace(/^\w/, (ch) => ch.toUpperCase())}</span>
                      {i < concerns.length - 1 ? ' ' : ''}
                    </React.Fragment>
                  ))}
                </Text>
              </Section>
            </>
          )}

          {message && (
            <>
              <Hr style={dividerLight} />
              <Section style={infoSection}>
                <Heading as="h3" style={sectionHeading}>Customer Message</Heading>
                <Text style={quoteText}>"{message}"</Text>
              </Section>
            </>
          )}

          <Section style={{ textAlign: 'center' as const, margin: '28px 0 0' }}>
            <Button style={ctaButton} href={`mailto:${customerEmail}?subject=Your water filter quote from ${providerName}`}>
              Reply to {customerName}
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            This lead was generated via {SITE_NAME}
          </Text>
          <EmailDisclaimerFooter />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: VendorLeadNotificationEmail,
  subject: (data: Record<string, any>) => {
    const name = data.customerName || 'a customer'
    const temp = (data.leadTemperature || '').toString().toLowerCase()
    if (temp === 'hot') {
      return `Hot lead — customer wants installation within 2 weeks: ${name}`
    }
    if (temp === 'warm') {
      return `New lead — ${name} - installation in next 3 months`
    }
    if (temp === 'cold') {
      return `New lead — ${name} - researching`
    }
    return `New quote request from ${name} — ${data.customerSuburb || ''}, ${data.customerState || ''}`
  },
  displayName: 'Vendor lead notification',
  previewData: {
    providerName: 'Pure Water Solutions',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerMobile: '0412 345 678',
    customerSuburb: 'Bondi',
    customerState: 'NSW',
    customerPostcode: '2026',
    propertyType: 'House',
    householdSize: '3',
    waterSource: 'town-water',
    budget: '1000-3000',
    concerns: ['taste', 'chlorine', 'drinking-quality'],
    recommendedSystems: ['Under-sink filter', 'Reverse osmosis'],
    message: 'We have a baby on the way and want the cleanest water possible.',
    createdAt: '2026-03-28T10:00:00Z',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '540px' }
const headerSection = { textAlign: 'center' as const, padding: '16px 0 8px' }
const headerIcon = { fontSize: '32px', margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 8px' }
const headerSubtext = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', margin: '0' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const dividerLight = { borderColor: '#f0ede8', margin: '16px 0' }
const dateTag = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '0 0 16px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const infoSection = { margin: '0' }
const sectionHeading = { fontSize: '13px', fontWeight: '600' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const infoRow = { margin: '0 0 6px' }
const labelCol = { fontSize: '13px', color: 'hsl(220, 10%, 46%)', width: '120px', verticalAlign: 'top' as const, padding: '2px 0' }
const valueCol = { fontSize: '13px', color: 'hsl(220, 20%, 14%)', fontWeight: '500' as const, padding: '2px 0' }
const tagList = { fontSize: '13px', margin: '0', lineHeight: '2' }
const tag: React.CSSProperties = { backgroundColor: 'hsl(168, 30%, 92%)', color: 'hsl(168, 42%, 28%)', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, display: 'inline-block' as const, margin: '2px 4px 2px 0' }
const quoteText = { fontSize: '14px', color: 'hsl(220, 20%, 14%)', fontStyle: 'italic' as const, margin: '0', lineHeight: '1.5', backgroundColor: '#f9f8f6', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid hsl(168, 42%, 40%)' }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
