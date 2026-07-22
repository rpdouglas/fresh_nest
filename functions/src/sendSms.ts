import twilio from 'twilio'
import type { BookingData } from './emailTemplates'
import { confirmationSms, reminderSms, onMyWaySms } from './smsTemplates'

export interface SmsConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

export async function sendSmsConfirmation(booking: BookingData, config: SmsConfig): Promise<void> {
  const to = normalizePhone(booking.phone)
  if (!to) {
    console.warn(`[sendSmsConfirmation] Invalid phone "${booking.phone}" — skipping`)
    return
  }
  const lang: 'en' | 'fr' = booking.language === 'fr' ? 'fr' : 'en'
  const body = confirmationSms(booking.firstName, booking.serviceType, booking.preferredDate, lang)
  const client = twilio(config.accountSid, config.authToken)
  await client.messages.create({ body, from: config.fromNumber, to })
}

export async function sendSmsReminder(
  phone: string,
  language: string,
  preferredDate: string,
  config: SmsConfig,
): Promise<void> {
  const to = normalizePhone(phone)
  if (!to) {
    console.warn(`[sendSmsReminder] Invalid phone "${phone}" — skipping`)
    return
  }
  const lang: 'en' | 'fr' = language === 'fr' ? 'fr' : 'en'
  const body = reminderSms(preferredDate, lang)
  const client = twilio(config.accountSid, config.authToken)
  await client.messages.create({ body, from: config.fromNumber, to })
}

export async function sendOnMyWaySms(
  phone: string,
  language: string,
  cleanerName: string,
  config: SmsConfig,
): Promise<void> {
  const to = normalizePhone(phone)
  if (!to) {
    console.warn(`[sendOnMyWaySms] Invalid phone "${phone}" — skipping`)
    return
  }
  const lang: 'en' | 'fr' = language === 'fr' ? 'fr' : 'en'
  const body = onMyWaySms(cleanerName, lang)
  const client = twilio(config.accountSid, config.authToken)
  await client.messages.create({ body, from: config.fromNumber, to })
}

// P3-E27-D2: sent to Lauren (admin) by onProbationCheckInDue — always EN, same
// admin-alert pattern as onBookingCancelled's SMS to OWNER_PHONE.
export async function sendProbationCheckInDueSms(
  employeeName: string,
  dayOffset: number,
  adminPhone: string,
  config: SmsConfig,
): Promise<void> {
  const body = `Fresh Nest Co. Alert: Probation check-in due for ${employeeName} (Day ${dayOffset}). Complete it from the Staff Detail Panel.`
  const client = twilio(config.accountSid, config.authToken)
  await client.messages.create({ body, from: config.fromNumber, to: adminPhone })
}

