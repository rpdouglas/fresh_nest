import type { Firestore } from 'firebase-admin/firestore'
import { allowlistRole } from './roles'
import {
  extractLeadArea,
  isValidLeadOwnerRole,
  type LeadOwnerRole,
} from '../shared/pipeline'
import { sendLeadAssignedEmail, type EmailConfig } from '../sendEmail'
import { sendLeadAssignedSms, type SmsConfig } from '../sendSms'
import { sendLeadAssignedInAppNotification } from '../notifications'
import { logError } from './shared'

export interface ResolvedLeadRecipient {
  email: string
  role: LeadOwnerRole
  phone: string
  language: 'en' | 'fr'
  staffId: string | null
  isOffice: boolean
}

/**
 * Looks up a lead owner by lowercased email across `admins/{email}` first, then `staff`.
 */
export async function resolveLeadRecipient(
  db: Firestore,
  rawEmail: string | null | undefined,
): Promise<ResolvedLeadRecipient | null> {
  const email = (rawEmail ?? '').trim().toLowerCase()
  if (!email) return null

  const adminSnap = await db.collection('admins').doc(email).get()
  if (adminSnap.exists) {
    const data = adminSnap.data() as { role?: unknown; phone?: unknown; language?: unknown } | undefined
    const officeRole = allowlistRole(data)
    if (officeRole === 'owner' || officeRole === 'manager') {
      return {
        email,
        role: officeRole,
        phone: typeof data?.phone === 'string' ? data.phone.trim() : '',
        language: data?.language === 'fr' ? 'fr' : 'en',
        staffId: null,
        isOffice: true,
      }
    }
  }

  const staffSnap = await db.collection('staff').where('email', '==', email).limit(1).get()
  if (!staffSnap.empty) {
    const docSnap = staffSnap.docs[0]
    const data = docSnap.data() as {
      role?: unknown
      phone?: unknown
      preferences?: { language?: unknown }
    }
    const role: LeadOwnerRole = isValidLeadOwnerRole(data.role) ? data.role : 'cleaner'
    return {
      email,
      role,
      phone: typeof data.phone === 'string' ? data.phone.trim() : '',
      language: data.preferences?.language === 'fr' ? 'fr' : 'en',
      staffId: docSnap.id,
      isOffice: false,
    }
  }

  return null
}

/**
 * Dispatches email, SMS, and (for staff/contractors) in-app `lead_assigned` alerts
 * in the recipient's language, respecting address minimization for non-office owners.
 */
export async function dispatchLeadAssignmentAlert(params: {
  db: Firestore
  recipient: ResolvedLeadRecipient
  bookingId: string
  booking: {
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
    language?: string
    serviceType?: string
    frequency?: string
    preferredDate?: string
    address?: string
  }
  needsSiteVisit: boolean
  assignedBy: string | null
  isNewLead: boolean
  fallbackPhone?: string
  emailConfig: EmailConfig | null
  smsConfig: SmsConfig | null
  skipSms?: boolean
}): Promise<void> {
  const { recipient, booking, bookingId, needsSiteVisit } = params
  const clientName = `${booking.firstName ?? ''} ${booking.lastName ?? ''}`.trim() || 'Client'
  const clientLang: 'en' | 'fr' = booking.language === 'fr' ? 'fr' : 'en'
  const locationDisplay =
    recipient.isOffice || needsSiteVisit
      ? (booking.address ?? '')
      : extractLeadArea(booking.address)

  const tasks: Array<[string, Promise<void>]> = []

  if (params.emailConfig) {
    tasks.push([
      'lead assigned email',
      sendLeadAssignedEmail(
        recipient.email,
        {
          bookingId,
          clientName,
          clientPhone: booking.phone ?? '',
          clientEmail: booking.email ?? '',
          clientLanguage: clientLang,
          serviceType: booking.serviceType ?? 'standard',
          frequency: booking.frequency ?? 'one-time',
          preferredDate: booking.preferredDate ?? '',
          locationDisplay,
          needsSiteVisit,
          assignedBy: params.assignedBy,
          isNewLead: params.isNewLead,
        },
        recipient.language,
        params.emailConfig,
      ),
    ])
  }

  const targetPhone = recipient.phone || (recipient.isOffice ? (params.fallbackPhone ?? '') : '')
  if (!params.skipSms && targetPhone && params.smsConfig) {
    tasks.push([
      'lead assigned SMS',
      sendLeadAssignedSms(
        targetPhone,
        {
          clientName,
          clientPhone: booking.phone ?? '',
          serviceType: booking.serviceType ?? 'standard',
          preferredDate: booking.preferredDate ?? '',
          bookingId,
          needsSiteVisit,
          isNewLead: params.isNewLead,
        },
        recipient.language,
        params.smsConfig,
      ),
    ])
  }

  if (recipient.staffId) {
    tasks.push([
      'lead assigned in-app notification',
      sendLeadAssignedInAppNotification(params.db, recipient.staffId, {
        clientName,
        serviceLabel: booking.serviceType ?? 'standard',
        bookingId,
        language: recipient.language,
      }),
    ])
  }

  const results = await Promise.allSettled(tasks.map(([, p]) => p))
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      logError(`[dispatchLeadAssignmentAlert] ${tasks[i][0]} failed:`, r.reason)
    }
  })
}
