/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'

interface ContactInquiryProps {
  name?: string
  email?: string
  message?: string
}

const ContactInquiryEmail = ({ name, email, message }: ContactInquiryProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact inquiry from {name || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Contact Inquiry</Heading>
        <Text style={text}>
          You've received a new message via the {SITE_NAME} contact form.
        </Text>
        <Hr style={hr} />
        <Section style={detailSection}>
          <Text style={label}>Name</Text>
          <Text style={value}>{name || '—'}</Text>
          <Text style={label}>Email</Text>
          <Text style={value}>{email || '—'}</Text>
          <Text style={label}>Message</Text>
          <Text style={value}>{message || '—'}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          This email was sent from the {SITE_NAME} website contact form.
        </Text>
        <EmailDisclaimerFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactInquiryEmail,
  subject: (data: Record<string, any>) => `New contact inquiry from ${data.name || 'a visitor'}`,
  displayName: 'Contact form inquiry',
  to: 'hello@comparewaterfilters.com.au',
  previewData: { name: 'Jane Smith', email: 'jane@example.com', message: 'I need help choosing a water filter for my home.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '580px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '20px 0' }
const detailSection = { margin: '0' }
const label = { fontSize: '12px', fontWeight: '600' as const, color: '#888', margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const value = { fontSize: '15px', color: '#1a1a1a', margin: '0 0 14px', lineHeight: '1.5' }
const footer = { fontSize: '12px', color: '#999', margin: '16px 0 0' }
