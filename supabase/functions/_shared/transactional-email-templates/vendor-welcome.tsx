/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Button, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'
const LOGO_URL = 'https://xbryypgsryjhuscyglbu.supabase.co/storage/v1/object/public/email-assets/logo-wordmark.png'

interface VendorWelcomeProps {
  businessName?: string
}

const VendorWelcomeEmail = ({ businessName }: VendorWelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — your registration is under review</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="200" height="29" alt={SITE_NAME} style={{ marginBottom: '12px' }} />
        <Hr style={divider} />

        <Heading style={h1}>
          Welcome{businessName ? `, ${businessName}` : ''}!
        </Heading>

        <Text style={text}>
          We're excited to have you on board and can't wait to start connecting you with customers looking for cleaner, healthier water solutions.
        </Text>

        <Text style={text}>
          Your account registration is now <strong>under review</strong>. Our team will verify your details and you should be approved within <strong>24 hours</strong>.
        </Text>

        <Text style={text}>
          Once approved, you'll be able to:
        </Text>

        <Text style={listItem}>💧 Receive qualified leads matched to your service area</Text>
        <Text style={listItem}>💧 Manage and respond to quote requests from your dashboard</Text>
        <Text style={listItem}>💧 Grow your business with Australia's trusted water filter comparison platform</Text>

        <Text style={text}>
          In the meantime, if you have any questions, feel free to reach out — we're here to help.
        </Text>

        <Button style={ctaButton} href="https://comparewaterfilters.com.au/vendor/login">
          Go to Vendor Login
        </Button>

        <Hr style={divider} />

        <Text style={footer}>
          Thanks for joining {SITE_NAME} — Australia's trusted guide to cleaner water.
        </Text>
        <EmailDisclaimerFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VendorWelcomeEmail,
  subject: 'Welcome to Compare Water Filters — your registration is under review',
  displayName: 'Vendor welcome',
  previewData: { businessName: 'Pure Water Solutions' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '480px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 8px' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 16px' }
const listItem = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '4px' }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none', display: 'inline-block' as const, marginTop: '8px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
