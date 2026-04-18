/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'
const LOGO_URL = 'https://xbryypgsryjhuscyglbu.supabase.co/storage/v1/object/public/email-assets/logo-droplets.svg'

interface PriceChangeRow {
  leadType: string
  oldPrice: number
  newPrice: number
}

interface VendorPriceChangeNoticeProps {
  businessName?: string
  effectiveDate?: string
  changes?: PriceChangeRow[]
}

const VendorPriceChangeNoticeEmail = ({
  businessName,
  effectiveDate,
  changes = [],
}: VendorPriceChangeNoticeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>30-day notice: lead pricing update from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="40" height="40" alt={SITE_NAME} style={{ marginBottom: '8px' }} />
        <Text style={brand}>{SITE_NAME}</Text>
        <Hr style={divider} />

        <Heading style={h1}>
          Lead pricing update{businessName ? ` for ${businessName}` : ''}
        </Heading>

        <Text style={text}>
          As required under <strong>clause 19.3</strong> of our Vendor Terms, this email is your
          <strong> 30-day written notice</strong> of an upcoming change to lead pricing.
        </Text>

        <Text style={highlight}>
          New pricing takes effect on <strong>{effectiveDate || 'the date shown in your portal'}</strong>.
          Until then, you will continue to be charged the current rates.
        </Text>

        {changes.length > 0 && (
          <>
            <Text style={subheading}>Pricing changes:</Text>
            {changes.map((c, i) => (
              <Text key={i} style={listItem}>
                💧 <strong>{c.leadType}</strong>: ${c.oldPrice} → <strong>${c.newPrice}</strong> per lead
              </Text>
            ))}
          </>
        )}

        <Text style={text}>
          You can review the change at any time from your billing dashboard. If you have any
          questions, reply to this email and we'll be happy to help.
        </Text>

        <Button style={ctaButton} href="https://comparewaterfilters.com.au/vendor/billing">
          View Billing Dashboard
        </Button>

        <Hr style={divider} />

        <Text style={footer}>
          Thanks for partnering with {SITE_NAME}.
        </Text>
        <EmailDisclaimerFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VendorPriceChangeNoticeEmail,
  subject: '30-day notice: lead pricing update',
  displayName: 'Vendor price change notice',
  previewData: {
    businessName: 'Pure Water Solutions',
    effectiveDate: '15 May 2026',
    changes: [
      { leadType: 'Owner lead', oldPrice: 85, newPrice: 95 },
      { leadType: 'Rental lead', oldPrice: 50, newPrice: 55 },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '480px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 8px' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 16px' }
const subheading = { fontSize: '14px', fontWeight: '600' as const, color: 'hsl(220, 20%, 14%)', margin: '20px 0 8px' }
const highlight = { fontSize: '14px', color: 'hsl(220, 20%, 14%)', lineHeight: '1.6', margin: '0 0 16px', padding: '12px 16px', backgroundColor: 'hsl(168, 42%, 96%)', borderLeft: '3px solid hsl(168, 42%, 40%)', borderRadius: '6px' }
const listItem = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '4px' }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none', display: 'inline-block' as const, marginTop: '8px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
