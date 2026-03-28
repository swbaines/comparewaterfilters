/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for Compare Water Filters</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>💧 Compare Water Filters</Text>
        <Hr style={divider} />
        <Heading style={h1}>Confirm your identity</Heading>
        <Text style={text}>Use the code below to verify your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '480px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 8px' }
const divider = { borderColor: '#e5e2dc', margin: '12px 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: 'hsl(168, 42%, 40%)',
  letterSpacing: '4px',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
