import { Resend } from 'resend'
import type { BookingData } from './emailTemplates'
import { ownerSubject, ownerText, clientSubject, clientHtml } from './emailTemplates'

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
