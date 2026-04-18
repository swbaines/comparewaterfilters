/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'
const LOGO_URL = 'https://xbryypgsryjhuscyglbu.supabase.co/storage/v1/object/public/email-assets/logo-droplets.svg'

interface VendorApplicationApprovedProps {
  businessName?: string
}

const VendorApplicationApprovedEmail = ({ businessName }: VendorApplicationApprovedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're approved on {SITE_NAME} — start receiving leads</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="40" height="40" alt={SITE_NAME} style={{ marginBottom: '8px' }} />
        <Text style={brand}>{SITE_NAME}</Text>
        <Hr style={divider} />

        <Heading style={h1}>
          Great news{businessName ? `, ${businessName}` : ''} — you're approved! 🎉
        </Heading>

        <Text style={text}>
          Your provider application has been reviewed and <strong>approved</strong>. You're now live on {SITE_NAME} and eligible to receive qualified leads from customers in your service area.
        </Text>

        <Text style={text}>
          Here's what you can do next:
        </Text>

        <Text style={listItem}>💧 Log in to your vendor dashboard to manage incoming leads</Text>
        <Text style={listItem}>💧 Review and update your business profile, service areas, and system types</Text>
        <Text style={listItem}>💧 Add your payment method so we can bill you for leads received</Text>

        <Text style={{ ...text, textAlign: 'center' as const, margin: '28px 0 0' }}>
          <Button style={ctaButton} href="https://comparewaterfilters.com.au/vendor/login">
            Go to Vendor Dashboard
          </Button>
        </Text>

        <Text style={text}>
          If you have any questions, just reply to this email — we're here to help you grow.
        </Text>

        <Text style={signOff}>The {SITE_NAME} Team</Text>

        <EmailDisclaimerFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VendorApplicationApprovedEmail,
  subject: (data: Record<string, any>) =>
    `You're approved on ${SITE_NAME}${data.businessName ? `, ${data.businessName}` : ''}`,
  displayName: 'Vendor application approved',
  previewData: { businessName: "Sam's Water Filtration" },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '540px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 8px' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(220, 20%, 14%)', lineHeight: '1.6', margin: '0 0 14px' }
const listItem = { fontSize: '14px', color: 'hsl(220, 20%, 14%)', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '4px' }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none' }
const signOff = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', margin: '20px 0 0' }
