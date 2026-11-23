import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import {
  RESEND_API_KEY,
  OWNER_EMAIL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  ownerPhone,
  replyToEmail,
} from '../lib/shared'
import { dispatchLeadAssignmentAlert, resolveLeadRecipient } from '../lib/leadRouting'
import { isRecurringRenewalBooking } from '../shared/pipeline'

/**
 * P3-E40: Fires when a booking's `pipeline.ownerEmail` changes to a new owner.
 * Dispatches email + SMS (and in-app `lead_assigned` for staff/contractors) in the recipient's language.
 * Suppresses self-assignment alerts when the actor assigns a lead to themselves.
 */
export const onBookingPipelineUpdated = onDocumentUpdated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
    secrets: [RESEND_API_KEY, OWNER_EMAIL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const before = event.data?.before.data() as Record<string, unknown> | undefined
    const after = event.data?.after.data() as Record<string, unknown> | undefined
    if (!before || !after) return
    if (isRecurringRenewalBooking(after as { createdBy?: string })) return

    const beforePipeline = (before.pipeline ?? {}) as Record<string, unknown>
    const afterPipeline = (after.pipeline ?? {}) as Record<string, unknown>

    const prevOwner = typeof beforePipeline.ownerEmail === 'string' ? beforePipeline.ownerEmail.trim().toLowerCase() : null
    const nextOwner = typeof afterPipeline.ownerEmail === 'string' ? afterPipeline.ownerEmail.trim().toLowerCase() : null

    // Only alert on a real hand-off to a new non-null owner
    if (!nextOwner || nextOwner === prevOwner) return

    // Skip if this write was just onBookingCreated initializing pipeline from null
    const lastChange = (after.lastChange ?? {}) as { by?: unknown }
    const actor = typeof lastChange.by === 'string' ? lastChange.by.trim().toLowerCase() : null
    if (actor === 'system:onBookingCreated') return

    // Suppress self-assignment alerts
    if (actor && actor === nextOwner) return

    const db = getFirestore()
    const recipient = await resolveLeadRecipient(db, nextOwner)
    if (!recipient) return

    const apiKey = process.env['RESEND_API_KEY'] || RESEND_API_KEY.value()
    const emailConfig = apiKey
      ? {
          resendApiKey: apiKey,
          ownerEmail: OWNER_EMAIL.value(),
          fromEmail: process.env['FROM_EMAIL'] ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
          replyTo: replyToEmail(),
        }
      : null

    const accountSid = TWILIO_ACCOUNT_SID.value()
    const authToken = TWILIO_AUTH_TOKEN.value()
    const fromNumber = TWILIO_PHONE_NUMBER.value()
    const smsConfig = accountSid && authToken && fromNumber ? { accountSid, authToken, fromNumber } : null

    await dispatchLeadAssignmentAlert({
      db,
      recipient,
      bookingId: event.params['docId'],
      booking: after as {
        firstName?: string
        lastName?: string
        phone?: string
        email?: string
        language?: string
        serviceType?: string
        frequency?: string
        preferredDate?: string
        address?: string
      },
      needsSiteVisit: Boolean(afterPipeline.needsSiteVisit),
      assignedBy: typeof afterPipeline.ownerAssignedBy === 'string' ? afterPipeline.ownerAssignedBy : actor,
      isNewLead: false,
      fallbackPhone: ownerPhone(),
      emailConfig,
      smsConfig,
    })
  },
)
