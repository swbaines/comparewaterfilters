/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'
const SITE_URL = 'https://comparewaterfilters.com.au'

interface QuizResultsSummaryProps {
  customerName?: string
  resultsUrl?: string
  topRecommendation?: string
  budgetOption?: string
  premiumOption?: string
}

const QuizResultsSummaryEmail = ({
  customerName = 'there',
  resultsUrl = SITE_URL,
  topRecommendation = '',
  budgetOption = '',
  premiumOption = '',
}: QuizResultsSummaryProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your personalised water filter recommendations — saved and ready to revisit</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Text style={headerIcon}>💧</Text>
          <Heading style={h1}>Your saved results</Heading>
          <Text style={headerSubtext}>
            Hi {customerName}, here's the link to revisit your recommendations
          </Text>
        </Section>

        <Hr style={divider} />

        <Text style={text}>
          Thanks for using {SITE_NAME}. We've saved your personalised water filter recommendations
          so you can come back to them anytime — no need to retake the quiz.
        </Text>

        {(topRecommendation || budgetOption || premiumOption) && (
          <Section style={recapCard}>
            <Text style={recapHeading}>Your matched systems</Text>
            {topRecommendation && (
              <Text style={recapRow}>
                <span style={recapLabelTop}>Our recommendation</span>
                <span style={recapValue}>{topRecommendation}</span>
              </Text>
            )}
            {budgetOption && (
              <Text style={recapRow}>
                <span style={recapLabelValue}>Budget alternative</span>
                <span style={recapValue}>{budgetOption}</span>
              </Text>
            )}
            {premiumOption && (
              <Text style={recapRow}>
                <span style={recapLabelPremium}>Premium option</span>
                <span style={recapValue}>{premiumOption}</span>
              </Text>
            )}
          </Section>
        )}

        <Section style={{ textAlign: 'center' as const, margin: '24px 0 8px' }}>
          <Button style={ctaButton} href={resultsUrl}>
            View my saved results
          </Button>
        </Section>

        <Text style={smallNote}>
          This link is private to you. Bookmark it or forward it to your partner — your answers
          are pre-filled so you can compare options together.
        </Text>

        <Hr style={dividerLight} />

        <Section>
          <Text style={subheading}>What you can do next:</Text>
          <Text style={bulletText}>• Compare the matched systems side-by-side</Text>
          <Text style={bulletText}>• Request a free, no-obligation quote from a trusted local provider</Text>
          <Text style={bulletText}>• Share the link with your household for a second opinion</Text>
        </Section>

        <Hr style={divider} />

        <Text style={footer}>
          Questions? Just reply to this email or visit{' '}
          <Link href={SITE_URL} style={footerLink}>comparewaterfilters.com.au</Link>
        </Text>
        <Text style={footerBrand}>{SITE_NAME} · Helping Australians find the right water solution</Text>
        <EmailDisclaimerFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: QuizResultsSummaryEmail,
  subject: 'Your saved water filter recommendations',
  displayName: 'Quiz results summary',
  previewData: {
    customerName: 'Jane',
    resultsUrl: 'https://comparewaterfilters.com.au/results?d=eyJmaXJzdE5hbWUiOiJKYW5lIn0=',
    topRecommendation: 'Whole-house filtration',
    budgetOption: 'Under-sink carbon filter',
    premiumOption: 'Whole-house + Reverse osmosis combo',
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
const bulletText = { fontSize: '13px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 6px' }
const recapCard = { backgroundColor: '#f9f8f6', padding: '16px 18px', borderRadius: '10px', margin: '0 0 8px' }
const recapHeading = { fontSize: '13px', fontWeight: '600' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const recapRow = { fontSize: '13px', margin: '0 0 10px', lineHeight: '1.5' }
const recapLabelTop: React.CSSProperties = { display: 'inline-block', backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, marginRight: '8px' }
const recapLabelValue: React.CSSProperties = { display: 'inline-block', backgroundColor: 'hsl(168, 30%, 92%)', color: 'hsl(168, 42%, 28%)', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, marginRight: '8px' }
const recapLabelPremium: React.CSSProperties = { display: 'inline-block', backgroundColor: 'hsl(35, 50%, 92%)', color: 'hsl(30, 45%, 35%)', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, marginRight: '8px' }
const recapValue: React.CSSProperties = { color: 'hsl(220, 20%, 14%)', fontWeight: 500 }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none' }
const smallNote = { fontSize: '12px', color: 'hsl(220, 10%, 55%)', textAlign: 'center' as const, margin: '0 0 8px', lineHeight: '1.5' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
const footerLink = { color: 'hsl(168, 42%, 40%)', textDecoration: 'underline' }
const footerBrand = { fontSize: '11px', color: '#bbbbbb', margin: '8px 0 0', textAlign: 'center' as const }
