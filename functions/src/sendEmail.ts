import { Resend } from 'resend'
import type { BookingData } from './emailTemplates'
import {
  ownerSubject,
  ownerText,
  clientSubject,
  clientHtml,
  isQuoteRequest,
  reviewRequestSubject,
  reviewRequestHtml,
  staffWelcomeSubject,
  staffWelcomeHtml,
} from './emailTemplates'
import {
  leadAssignedSubject,
  leadAssignedHtml,
  leadDigestSubject,
  leadDigestHtml,
  type LeadAssignedEmailData,
  type LeadDigestItem,
} from './leadEmailTemplates'
import {
  agreementInviteSubject,
  agreementInviteHtml,
  agreementSignedClientSubject,
  agreementSignedClientHtml,
  agreementSignedOfficeSubject,
  agreementSignedOfficeText,
  type AgreementInviteEmailData,
  type AgreementSignedEmailData,
} from './agreementEmailTemplates'

export interface EmailConfig {
  resendApiKey: string
  fromEmail: string
  ownerEmail: string
  /** Where replies to client/staff emails go (noreply@ cannot receive mail). */
  replyTo?: string
}

/**
 * OWNER_EMAIL may hold one address or several separated by commas/semicolons,
 * e.g. "a@example.com, b@example.com". Every address receives the owner alert.
 */
export function parseRecipients(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((address) => address.trim())
    .filter((address) => address.length > 0)
}

export async function sendOwnerNotification(
  booking: BookingData,
  docId: string,
  config: EmailConfig,
): Promise<void> {
  const recipients = parseRecipients(config.ownerEmail)
  if (recipients.length === 0) {
    throw new Error('Owner notification failed: OWNER_EMAIL is empty')
  }
  // Replying to the alert writes straight to the customer (human decision 2026-11-14).
  const customerEmail = booking.email?.trim()
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from:    config.fromEmail,
    to:      recipients,
    replyTo: customerEmail || undefined,
    subject: ownerSubject(booking),
    text:    ownerText(booking, docId),
  })
  if (result.error) {
    throw new Error(`Owner notification failed: ${result.error.message}`)
  }
}

export async function sendClientConfirmation(
  booking: BookingData,
  config: EmailConfig,
): Promise<void> {
  const lang: 'en' | 'fr' = booking.language === 'fr' ? 'fr' : 'en'
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from:    config.fromEmail,
    to:      booking.email,
    replyTo: config.replyTo,
    subject: clientSubject(lang, isQuoteRequest(booking)),
    html:    clientHtml(booking, lang),
  })
  if (result.error) {
    throw new Error(`Client confirmation failed: ${result.error.message}`)
  }
}

export async function sendReviewRequestEmail(
  clientName: string,
  clientEmail: string,
  reviewUrl: string,
  lang: 'en' | 'fr',
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from:    config.fromEmail,
    to:      clientEmail,
    replyTo: config.replyTo,
    subject: reviewRequestSubject(lang),
    html:    reviewRequestHtml(clientName, reviewUrl, lang),
  })
  if (result.error) {
    throw new Error(`Review request email failed: ${result.error.message}`)
  }
}

export async function sendWelcomeEmail(
  firstName: string,
  email: string,
  magicLink: string,
  lang: 'en' | 'fr',
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from:    config.fromEmail,
    to:      email,
    replyTo: config.replyTo,
    subject: staffWelcomeSubject(lang),
    html:    staffWelcomeHtml(firstName, magicLink, lang),
  })
  if (result.error) {
    throw new Error(`Welcome email failed: ${result.error.message}`)
  }
}

export async function sendLeadAssignedEmail(
  recipientEmail: string,
  data: LeadAssignedEmailData,
  lang: 'en' | 'fr',
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from: config.fromEmail,
    to: recipientEmail,
    replyTo: data.clientEmail?.trim() || config.replyTo,
    subject: leadAssignedSubject(data, lang),
    html: leadAssignedHtml(data, lang),
  })
  if (result.error) {
    throw new Error(`Lead assigned email failed: ${result.error.message}`)
  }
}

export async function sendLeadDigestEmail(
  recipientEmail: string,
  items: LeadDigestItem[],
  todayDate: string,
  lang: 'en' | 'fr',
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from: config.fromEmail,
    to: recipientEmail,
    replyTo: config.replyTo,
    subject: leadDigestSubject(items.length, lang),
    html: leadDigestHtml(items, todayDate, lang),
  })
  if (result.error) {
    throw new Error(`Lead digest email failed: ${result.error.message}`)
  }
}

export async function sendAgreementInviteEmail(
  recipientEmail: string,
  data: AgreementInviteEmailData,
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from: config.fromEmail,
    to: recipientEmail,
    replyTo: config.replyTo,
    subject: agreementInviteSubject(data.language),
    html: agreementInviteHtml(data),
  })
  if (result.error) {
    throw new Error(`Agreement invite email failed: ${result.error.message}`)
  }
}

export async function sendAgreementSignedClientEmail(
  recipientEmail: string,
  data: AgreementSignedEmailData,
  pdfBuffer: Buffer,
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const filename = `fresh-nest-agreement-${data.agreementId}.pdf`
  const result = await resend.emails.send({
    from: config.fromEmail,
    to: recipientEmail,
    replyTo: config.replyTo,
    subject: agreementSignedClientSubject(data.language),
    html: agreementSignedClientHtml(data),
    attachments: [{ filename, content: pdfBuffer }],
  })
  if (result.error) {
    throw new Error(`Agreement signed client email failed: ${result.error.message}`)
  }
}

export async function sendAgreementSignedOfficeEmail(
  data: AgreementSignedEmailData,
  pdfBuffer: Buffer,
  config: EmailConfig,
): Promise<void> {
  const recipients = parseRecipients(config.ownerEmail)
  if (recipients.length === 0) {
    throw new Error('Agreement signed office email failed: OWNER_EMAIL is empty')
  }
  const resend = new Resend(config.resendApiKey)
  const filename = `fresh-nest-agreement-${data.agreementId}.pdf`
  const result = await resend.emails.send({
    from: config.fromEmail,
    to: recipients,
    replyTo: data.clientEmail?.trim() || config.replyTo,
    subject: agreementSignedOfficeSubject(data),
    text: agreementSignedOfficeText(data),
    attachments: [{ filename, content: pdfBuffer }],
  })
  if (result.error) {
    throw new Error(`Agreement signed office email failed: ${result.error.message}`)
  }
}
