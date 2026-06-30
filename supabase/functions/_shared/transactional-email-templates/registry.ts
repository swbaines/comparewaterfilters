/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as vendorLeadNotification } from './vendor-lead-notification.tsx'
import { template as customerQuoteConfirmation } from './customer-quote-confirmation.tsx'
import { template as contactInquiry } from './contact-inquiry.tsx'
import { template as invoiceReminder } from './invoice-reminder.tsx'
import { template as paymentConfirmation } from './payment-confirmation.tsx'
import { template as vendorWelcome } from './vendor-welcome.tsx'
import { template as adminVendorNotification } from './admin-vendor-notification.tsx'
import { template as vendorPriceChangeNotice } from './vendor-price-change-notice.tsx'
import { template as vendorApplicationApproved } from './vendor-application-approved.tsx'
import { template as vendorApplicationRejected } from './vendor-application-rejected.tsx'
import { template as quizResultsSummary } from './quiz-results-summary.tsx'
import { template as vendorSetupReminder } from './vendor-setup-reminder.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'vendor-lead-notification': vendorLeadNotification,
  'customer-quote-confirmation': customerQuoteConfirmation,
  'contact-inquiry': contactInquiry,
  'invoice-reminder': invoiceReminder,
  'payment-confirmation': paymentConfirmation,
  'vendor-welcome': vendorWelcome,
  'admin-vendor-notification': adminVendorNotification,
  'vendor-price-change-notice': vendorPriceChangeNotice,
  'vendor-application-approved': vendorApplicationApproved,
  'vendor-application-rejected': vendorApplicationRejected,
  'quiz-results-summary': quizResultsSummary,
  'vendor-setup-reminder': vendorSetupReminder,
}
