/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Row, Column, Hr, Button, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailDisclaimerFooter } from './email-disclaimer-footer.tsx'

const SITE_NAME = 'Compare Water Filters'

const budgetLabels: Record<string, string> = {
  'under-1000': 'Under $1,000',
  '1000-3500': 'Up to $3,500',
  '3500-plus': '$3,500 +',
  'not-sure': "Doesn't matter — best regardless of cost",
}
...
    budget: '1000-3500',
    concerns: ['taste', 'chlorine', 'drinking-quality'],
    recommendedSystems: ['Under-sink filter', 'Reverse osmosis'],
    message: 'We have a baby on the way and want the cleanest water possible.',
    createdAt: '2026-03-28T10:00:00Z',
    contactPreference: 'email',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '540px' }
const headerSection = { textAlign: 'center' as const, padding: '16px 0 8px' }
const headerIcon = { fontSize: '32px', margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 8px' }
const headerSubtext = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', margin: '0' }
const divider = { borderColor: '#e5e2dc', margin: '20px 0' }
const dividerLight = { borderColor: '#f0ede8', margin: '16px 0' }
const dateTag = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '0 0 16px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const infoSection = { margin: '0' }
const sectionHeading = { fontSize: '13px', fontWeight: '600' as const, color: 'hsl(168, 42%, 40%)', margin: '0 0 10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const infoRow = { margin: '0 0 6px' }
const labelCol = { fontSize: '13px', color: 'hsl(220, 10%, 46%)', width: '120px', verticalAlign: 'top' as const, padding: '2px 0' }
const valueCol = { fontSize: '13px', color: 'hsl(220, 20%, 14%)', fontWeight: '500' as const, padding: '2px 0' }
const tagList = { fontSize: '13px', margin: '0', lineHeight: '2' }
const tag: React.CSSProperties = { backgroundColor: 'hsl(168, 30%, 92%)', color: 'hsl(168, 42%, 28%)', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, display: 'inline-block' as const, margin: '2px 4px 2px 0' }
const quoteText = { fontSize: '14px', color: 'hsl(220, 20%, 14%)', fontStyle: 'italic' as const, margin: '0', lineHeight: '1.5', backgroundColor: '#f9f8f6', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid hsl(168, 42%, 40%)' }
const ctaButton = { backgroundColor: 'hsl(168, 42%, 40%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '12px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
const contactPrefBox = { fontSize: '14px', color: 'hsl(220, 20%, 14%)', margin: '0 0 8px', backgroundColor: 'hsl(168, 30%, 95%)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid hsl(168, 42%, 40%)' }
const contactPrefHelp = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '0', lineHeight: '1.5' }
