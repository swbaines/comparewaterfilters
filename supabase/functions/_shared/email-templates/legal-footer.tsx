/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'

export const LegalFooter = () => (
  <>
    <Text style={legalFooter}>
      Compare Water Filters Pty Ltd | ACN: 697 405 093 | ABN: 32 697 405 093
    </Text>
  </>
)

const legalFooter = {
  fontSize: '10px',
  color: '#bbbbbb',
  lineHeight: '1.4',
  margin: '16px 0 0',
  textAlign: 'center' as const,
}