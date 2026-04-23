/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text, Hr, Link } from 'npm:@react-email/components@0.0.22'

const SITE_URL = 'https://comparewaterfilters.com.au'
const CONTACT_EMAIL = 'hello@comparewaterfilters.com.au'

export const EmailDisclaimerFooter = () => (
  <>
    <Hr style={divider} />
    <Text style={disclaimerText}>
      This email was sent by Compare Water Filters (<Link href={SITE_URL} style={disclaimerLink}>comparewaterfilters.com.au</Link>). You are receiving this email because you submitted a water filter quote request through our platform.
    </Text>
    <Text style={disclaimerText}>
      Compare Water Filters is an independent comparison and referral platform. We are not responsible for the products, services, pricing, or workmanship of any provider. All dealings with providers are subject to the provider's own terms and conditions.
    </Text>
    <Text style={disclaimerText}>
      If you did not request this email, please contact{' '}
      <Link href={`mailto:${CONTACT_EMAIL}`} style={disclaimerLink}>{CONTACT_EMAIL}</Link>.
    </Text>
    <Text style={disclaimerSmall}>
      Compare Water Filters | {CONTACT_EMAIL} | comparewaterfilters.com.au
    </Text>
    <Text style={disclaimerSmall}>
      Compare Water Filters Pty Ltd | ABN: 32 697 405 093
    </Text>
  </>
)

const divider = { borderColor: '#e5e2dc', margin: '24px 0 16px' }
const disclaimerText = { fontSize: '11px', color: '#999999', lineHeight: '1.5', margin: '0 0 8px' }
const disclaimerLink = { color: '#999999', textDecoration: 'underline' }
const disclaimerSmall = { fontSize: '10px', color: '#bbbbbb', lineHeight: '1.4', margin: '0 0 4px', textAlign: 'center' as const }
