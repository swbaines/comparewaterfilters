/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Compare Water Filters'
const SITE_URL = 'https://comparewaterfilters.com.au'

interface CustomerQuoteConfirmationProps {
  customerName?: string
  providerName?: string
  customerEmail?: string
  customerMobile?: string
  recommendedSystems?: string[]
}

const CustomerQuoteConfirmationEmail = ({
  customerName = 'there',
  providerName = 'the provider',
  customerEmail = '',
  customerMobile = '',
  recommendedSystems = [],
}: CustomerQuoteConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your quote request has been sent to {providerName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Text style={headerIcon}>✅</Text>
          <Heading style={h1}>Quote request sent!</Heading>
          <Text style={headerSubtext}>
            Hi {customerName}, your request is on its way
          </Text>
        </Section>

        <Hr style={divider} />

        <Text style={text}>
          We've sent your quote request to <strong>{providerName}</strong>. They'll be in touch with you soon.
        </Text>

        <Section style={providerCard}>
          <Text style={providerCardName}>{providerName}</Text>
          <Text style={providerCardDetail}>
            Will contact you at {customerEmail}{customerMobile ? ` or ${customerMobile}` : ''}
          </Text>
        </Section>

        {recommendedSystems.length > 0 && (
          <Section>
            <Text style={subheading}>Systems you were matched with:</Text>
            <Text style={tagList}>
              {recommendedSystems.map((s, i) => (
                <React.Fragment key={s}>
                  <span style={tag}>{s}</span>
                  {i < recommendedSystems.length - 1 ? ' ' : ''}
                </React.Fragment>
              ))}
            </Text>
          </Section>
        )}

        <Hr style={dividerLight} />

        <Section>
          <Text style={subheading}>What happens next:</Text>
          <Section style={stepsSection}>
            <Section style={stepRow}>
              <Text style={stepNumber}>1</Text>
              <Text style={stepText}>{providerName} reviews your requirements and prepares a personalised quote</Text>
            </Section>
            <Section style={stepRow}>
              <Text style={stepNumber}>2</Text>
              <Text style={stepText}>They contact you directly — usually within 1–2 business days</Text>
            </Section>
            <Section style={stepRow}>
              <Text style={stepNumber}>3</Text>
              <Text style={stepText}>You compare options and choose what's right for your home — no obligation</Text>
            </Section>
          </Section>
        </Section>

        <Section style={{ textAlign: 'center' as const, margin: '24px 0 0' }}>
          <Button style={ctaButton} href={SITE_URL}>
            Get another quote
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={footer}>
          If you have any questions, reply to this email or visit{' '}
          <Link href={SITE_URL} style={footerLink}>comparewaterfilters.com.au</Link>
        </Text>
        <Text style={footerBrand}>{SITE_NAME} · Helping Australians find the right water solution</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CustomerQuoteConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Your quote request has been sent to ${data.providerName || 'the provider'}`,
  displayName: 'Customer quote confirmation',
  previewData: {
    customerName: 'Jane',
    providerName: 'Pure Water Solutions',
    customerEmail: 'jane@example.com',
    customerMobile: '0412 345 678',
    recommendedSystems: ['Under-sink filter', 'Reverse osmosis'],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '500px' }
const headerSection = { textAlign: 'center' as const, padding: '16px 0 8px' }
const headerIcon = { fontSize: '32px', margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 8px' }
const headerSubtext = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', margin: '0' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const dividerLight = { borderColor: '#f0ede8', margin: '20px 0' }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 20px' }
const subheading = { fontSize: '14px', fontWeight: '600' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 10px' }
const providerCard = { backgroundColor: '#f9f8f6', padding: '14px 18px', borderRadius: '10px', margin: '0 0 20px' }
const providerCardName = { fontSize: '15px', fontWeight: '600' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 4px' }
const providerCardDetail = { fontSize: '13px', color: 'hsl(220, 10%, 46%)', margin: '0' }
const tagList = { fontSize: '13px', margin: '0 0 4px', lineHeight: '2' }
const tag: React.CSSProperties = { backgroundColor: 'hsl(168, 30%, 92%)', color: 'hsl(168, 42%, 28%)', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, display: 'inline-block' as const, margin: '2px 4px 2px 0' }
const stepsSection = { margin: '0' }
const stepRow = { margin: '0 0 12px' }
const stepNumber: React.CSSProperties = { display: 'inline-block' as const, width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'hsl(168, 42%, 40%)', color: '#fff', fontSize: '12px', fontWeight: 'bold' as const, textAlign: 'center' as const, lineHeight: '24px', margin: '0 10px 0 0', verticalAlign: 'top' as const }
const stepText = { display: 'inline' as const, fontSize: '13px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.5', margin: '0' }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
const footerLink = { color: 'hsl(168, 42%, 40%)', textDecoration: 'underline' }
const footerBrand = { fontSize: '11px', color: '#bbbbbb', margin: '8px 0 0', textAlign: 'center' as const }
