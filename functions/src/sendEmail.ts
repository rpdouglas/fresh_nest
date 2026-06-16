import { Resend } from 'resend'
import type { BookingData } from './emailTemplates'
import { ownerSubject, ownerText, clientSubject, clientHtml, reviewRequestSubject, reviewRequestHtml } from './emailTemplates'

export interface EmailConfig {
  resendApiKey: string
  fromEmail: string
  ownerEmail: string
}

export async function sendOwnerNotification(
  booking: BookingData,
  docId: string,
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from:    config.fromEmail,
    to:      config.ownerEmail,
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
    subject: clientSubject(lang),
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
    subject: reviewRequestSubject(lang),
    html:    reviewRequestHtml(clientName, reviewUrl, lang),
  })
  if (result.error) {
    throw new Error(`Review request email failed: ${result.error.message}`)
  }
}
