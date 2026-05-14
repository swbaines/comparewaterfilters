/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'
const LOGO_URL = 'https://xbryypgsryjhuscyglbu.supabase.co/storage/v1/object/public/email-assets/logo-wordmark.png'

interface VendorSetupReminderProps {
  contactName?: string
  reminderNumber?: number
}

const VendorSetupReminderEmail = ({
  contactName,
  reminderNumber = 1,
}: VendorSetupReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Add your payment method to start receiving leads</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="200" height="29" alt={SITE_NAME} style={{ marginBottom: '12px' }} />
        <Hr style={divider} />

        <Heading style={h1}>Hi {contactName || 'there'},</Heading>

        <Text style={text}>
          Your {SITE_NAME} account has been approved. To start receiving leads,
          please add your payment method via the link below.
        </Text>

        <Button style={ctaButton} href="https://comparewaterfilters.com.au/vendor/billing">
          Add Payment Method
        </Button>

        <Text style={text}>
          Once your payment method is on file, your profile will go live and you'll start receiving qualified leads from homeowners in your area.
        </Text>

        <Text style={text}>
          Need help? Reply to this email and we'll assist.
        </Text>

        <Hr style={divider} />

        <Text style={footer}>
          Best regards,<br />
          {SITE_NAME} Team<br />
          hello@comparewaterfilters.com.au
        </Text>
        <EmailDisclaimerFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VendorSetupReminderEmail,
  subject: 'Add your payment method to start receiving leads — Compare Water Filters',
  displayName: 'Vendor setup reminder',
  previewData: { contactName: 'Jane', reminderNumber: 1 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '480px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 8px' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 16px' }
const checklistItem = { fontSize: '14px', color: 'hsl(220, 20%, 14%)', lineHeight: '1.8', margin: '0 0 8px', paddingLeft: '4px', fontWeight: '500' as const }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none', display: 'inline-block' as const, margin: '8px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const, lineHeight: '1.6' }