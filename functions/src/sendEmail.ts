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
