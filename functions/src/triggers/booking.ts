import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import Stripe from 'stripe'
import twilio from 'twilio'
import {
  RESEND_API_KEY,
  OWNER_EMAIL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  logError,
  ownerPhone,
} from '../lib/shared'
import { sendOwnerNotification, sendClientConfirmation } from '../sendEmail'
import { sendSmsConfirmation, sendOwnerAlertSms } from '../sendSms'
import { isRenewal, isAdminCreated, type BookingData } from '../emailTemplates'
import { createJobFromBooking } from '../jobs'
import { serverStamp } from '../lib/audit'

// F03 / E31: Trigger when booking is created
export const onBookingCreated = onDocumentCreated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
    secrets: [RESEND_API_KEY, OWNER_EMAIL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const booking = event.data?.data() as BookingData | undefined
    if (!booking) return

    const firstName = booking.firstName || 'CLIENT'
    const docId = event.params['docId']
    const refCode = `${firstName.trim().toUpperCase()}-${docId.substring(0, 4).toUpperCase()}`

    const renewal = isRenewal(booking)

    if (!booking.referralCode && !renewal) {
      const db = getFirestore()
      try {
        await db.collection('referrals').doc(refCode).set({
          ownerName: `${booking.firstName} ${booking.lastName ? booking.lastName.charAt(0) + '.' : ''}`,
          bookingId: docId,
          active: true,
          createdAt: new Date(),
        })
        await db.collection('bookings').doc(docId).update({ referralCode: refCode })
        booking.referralCode = refCode
      } catch (err) {
        logError('[onBookingCreated] Failed to generate referral code:', err)
      }
    }

    const emailConfig = {
      resendApiKey: RESEND_API_KEY.value(),
      ownerEmail: OWNER_EMAIL.value(),
      fromEmail: process.env['FROM_EMAIL'] ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
    }

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken: TWILIO_AUTH_TOKEN.value(),
      fromNumber: TWILIO_PHONE_NUMBER.value(),
    }

    // Renewals continue an agreed recurring booking — only the owner is told (to confirm it);
    // the client is not sent another "quote request received" email/SMS.
    // The owner also gets an SMS for website requests and renewals, so a request is never missed
    // when email is down (P3-E30). Admin phone-in bookings skip it — the admin entered them.
    const sends: Array<[string, Promise<void>]> = [
      ['owner email', sendOwnerNotification(booking, docId, emailConfig)],
    ]
    if (!renewal) {
      sends.push(
        ['client email', sendClientConfirmation(booking, emailConfig)],
        ['client SMS', sendSmsConfirmation(booking, smsConfig)],
      )
    }
    if (!isAdminCreated(booking)) {
      sends.push(['owner SMS', sendOwnerAlertSms(booking, docId, renewal, ownerPhone(), smsConfig)])
    }
    const results = await Promise.allSettled(sends.map(([, send]) => send))

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        logError(`[onBookingCreated] ${sends[i][0]} failed:`, result.reason)
      }
    })
  },
)

// F03: Trigger when booking status transitions to 'confirmed'
export const onBookingStatusConfirmed = onDocumentUpdated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
  },
  async (event) => {
    const before = event.data?.before.data() as { status?: string } | undefined
    const after = event.data?.after.data() as { status?: string; [key: string]: unknown } | undefined

    if (!before || !after) return

    if (before.status === 'confirmed' || after.status !== 'confirmed') return

    const bookingId = event.params['docId']
    console.log(`[onBookingStatusConfirmed] Booking '${bookingId}' confirmed — initiating job creation.`)

    try {
      await createJobFromBooking(bookingId, after as Parameters<typeof createJobFromBooking>[1])
    } catch (err) {
      logError(`[onBookingStatusConfirmed] Failed to create job for booking '${bookingId}':`, err)
    }

    const stripePaymentIntentId = after.stripePaymentIntentId as string | undefined
    if (stripePaymentIntentId) {
      const stripeKey = process.env['STRIPE_SECRET_KEY']
      if (stripeKey) {
        const stripeClient = new Stripe(stripeKey)
        try {
          await stripeClient.paymentIntents.capture(stripePaymentIntentId)
          await getFirestore().collection('bookings').doc(bookingId).update({
            stripeChargeStatus: 'captured',
          })
          console.log(`[onBookingStatusConfirmed] Captured PaymentIntent '${stripePaymentIntentId}' for booking '${bookingId}'.`)
        } catch (captureErr) {
          logError(`[onBookingStatusConfirmed] Failed to capture PaymentIntent '${stripePaymentIntentId}':`, captureErr)
        }
      } else {
        console.warn('[onBookingStatusConfirmed] STRIPE_SECRET_KEY not set — skipping capture.')
      }
    }
  },
)

// P2-E1: Booking Cancellation Trigger
export const onBookingCancelled = onDocumentUpdated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    const bookingId = event.params['docId']
    const db = getFirestore()

    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      console.log(`[onBookingCancelled] Booking '${bookingId}' status set to 'cancelled'. Initiating actions.`)

      const stripePaymentIntentId = after.stripePaymentIntentId
      if (stripePaymentIntentId) {
        console.log(`[onBookingCancelled] Releasing Stripe hold for PaymentIntent: ${stripePaymentIntentId}`)
        try {
          const stripeKey = process.env['STRIPE_SECRET_KEY']
          if (stripeKey) {
            const stripe = new Stripe(stripeKey)
            await stripe.paymentIntents.cancel(stripePaymentIntentId)
            console.log(`[onBookingCancelled] Stripe PaymentIntent ${stripePaymentIntentId} cancelled.`)
          } else {
            console.warn('[onBookingCancelled] STRIPE_SECRET_KEY is not defined. Skipping Stripe call.')
          }
        } catch (stripeErr) {
          logError(`[onBookingCancelled] Failed to cancel Stripe PaymentIntent ${stripePaymentIntentId}:`, stripeErr)
        }
      }

      try {
        const jobsSnap = await db.collection('jobs').where('bookingId', '==', bookingId).limit(1).get()
        if (!jobsSnap.empty) {
          const jobId = jobsSnap.docs[0].id
          console.log(`[onBookingCancelled] Found associated job '${jobId}'. Updating status to 'cancelled'.`)
          await db.collection('jobs').doc(jobId).update({
            status: 'cancelled',
            cancelledAt: new Date(),
            lastChange: serverStamp('onBookingCancelled', { reason: 'Booking cancelled' }),
          })
        }
      } catch (jobErr) {
        logError(`[onBookingCancelled] Failed to update associated job status:`, jobErr)
      }

      const smsConfig = {
        accountSid: TWILIO_ACCOUNT_SID.value(),
        authToken: TWILIO_AUTH_TOKEN.value(),
        fromNumber: TWILIO_PHONE_NUMBER.value(),
      }
      const adminPhone = ownerPhone()
      const clientName = `${after.firstName} ${after.lastName}`
      const preferredDate = after.preferredDate
      const smsBody = `Fresh Nest Co. Alert: Booking ${bookingId} for ${clientName} on ${preferredDate} has been cancelled by the customer.`

      try {
        const client = twilio(smsConfig.accountSid, smsConfig.authToken)
        await client.messages.create({
          body: smsBody,
          from: smsConfig.fromNumber,
          to: adminPhone,
        })
        console.log(`[onBookingCancelled] SMS alert sent to admin: ${adminPhone}`)
      } catch (smsErr) {
        logError(`[onBookingCancelled] Failed to send SMS alert to admin:`, smsErr)
      }
    }
  },
)
