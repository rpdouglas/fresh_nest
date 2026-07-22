import { Resend } from 'resend'
import type { BookingData } from './emailTemplates'
import {
  ownerSubject,
  ownerText,
  clientSubject,
  clientHtml,
  reviewRequestSubject,
  reviewRequestHtml,
  staffWelcomeSubject,
  staffWelcomeHtml,
  probationActivationSubject,
  probationActivationHtml,
  probationCheckInDueSubject,
  probationCheckInDueText,
} from './emailTemplates'

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
    subject: staffWelcomeSubject(lang),
    html:    staffWelcomeHtml(firstName, magicLink, lang),
  })
  if (result.error) {
    throw new Error(`Welcome email failed: ${result.error.message}`)
  }
}

// P3-E27-D2: sent to the employee by onStaffStatusActivated
export async function sendProbationActivationEmail(
  firstName: string,
  email: string,
  lang: 'en' | 'fr',
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from:    config.fromEmail,
    to:      email,
    subject: probationActivationSubject(lang),
    html:    probationActivationHtml(firstName, lang),
  })
  if (result.error) {
    throw new Error(`Probation activation email failed: ${result.error.message}`)
  }
}

// P3-E27-D2: sent to Lauren by onProbationCheckInDue — always EN, matches sendOwnerNotification
export async function sendProbationCheckInDueEmail(
  employeeName: string,
  dayOffset: number,
  staffUid: string,
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from:    config.fromEmail,
    to:      config.ownerEmail,
    subject: probationCheckInDueSubject(employeeName, dayOffset),
    text:    probationCheckInDueText(employeeName, dayOffset, staffUid),
  })
  if (result.error) {
    throw new Error(`Probation check-in due email failed: ${result.error.message}`)
  }
}
