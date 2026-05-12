/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'
const LOGO_URL = 'https://xbryypgsryjhuscyglbu.supabase.co/storage/v1/object/public/email-assets/logo-wordmark.png'
const CONTACT_EMAIL = 'hello@comparewaterfilters.com.au'

interface VendorApplicationRejectedProps {
  businessName?: string
}

const VendorApplicationRejectedEmail = ({ businessName }: VendorApplicationRejectedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Update on your {SITE_NAME} application</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="200" height="29" alt={SITE_NAME} style={{ marginBottom: '12px' }} />
        <Hr style={divider} />

        <Heading style={h1}>
          Update on your application
        </Heading>

        <Text style={text}>
          Hi{businessName ? ` ${businessName}` : ''},
        </Text>

        <Text style={text}>
          Thank you for applying to join {SITE_NAME}. After reviewing your submission, we're unable to approve your application at this time.
        </Text>

        <Text style={text}>
          This decision is typically based on missing or unverifiable information such as ABN status, plumber's licence, public liability insurance, or service area details.
        </Text>

        <Text style={text}>
          If you believe this was made in error, or you'd like to update your details and request a re-review, please reach out to us at{' '}
          <Link href={`mailto:${CONTACT_EMAIL}`} style={emailLink}>{CONTACT_EMAIL}</Link>.
        </Text>

        <Text style={text}>
          We appreciate your interest in helping Australian households access cleaner, healthier water.
        </Text>

        <Text style={signOff}>The {SITE_NAME} Team</Text>

        <EmailDisclaimerFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VendorApplicationRejectedEmail,
  subject: `Update on your ${SITE_NAME} application`,
  displayName: 'Vendor application rejected',
  previewData: { businessName: "Sam's Water Filtration" },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '540px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 8px' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(220, 20%, 14%)', lineHeight: '1.6', margin: '0 0 14px' }
const emailLink = { color: 'hsl(168, 42%, 40%)', textDecoration: 'underline' }
const signOff = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', margin: '20px 0 0' }
