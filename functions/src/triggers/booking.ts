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
} from '../lib/shared'
import { sendOwnerNotification, sendClientConfirmation } from '../sendEmail'
import { sendSmsConfirmation } from '../sendSms'
import type { BookingData } from '../emailTemplates'
import { createJobFromBooking } from '../jobs'

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

    if (!booking.referralCode) {
      const db = getFirestore()
      try {
        await db.collection('referrals').doc(refCode).set({
          ownerName: `${booking.firstName} ${booking.lastName ? booking.lastName.charAt(0) + '.' : ''}`,
          // P3-E10: needed so a future referral-reward credit can be issued to the
          // right customer without an extra bookings lookup.
          ownerEmail: booking.email,
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

    const results = await Promise.allSettled([
      sendOwnerNotification(booking, event.params['docId'], emailConfig),
      sendClientConfirmation(booking, emailConfig),
      sendSmsConfirmation(booking, smsConfig),
    ])

    const labels = ['owner email', 'client email', 'client SMS']
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        logError(`[onBookingCreated] ${labels[i]} failed:`, result.reason)
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
    let capturedIntent: { metadata?: Record<string, string> } | undefined
    if (stripePaymentIntentId) {
      const stripeKey = process.env['STRIPE_SECRET_KEY']
      if (stripeKey) {
        const stripeClient = new Stripe(stripeKey)
        try {
          capturedIntent = await stripeClient.paymentIntents.capture(stripePaymentIntentId)
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

    // P3-E10: settle this booking's referral/credit consequences now that it's
    // confirmed — same "only actually happens once confirmed" timing as the Stripe
    // capture above, not folded into a separate trigger since both are the same
    // concern (this booking's financial consequences), not audit-logging.
    const db = getFirestore()

    // (a) finalize any credits the payer spent on this booking (reserved, not yet
    // burned, at createPaymentIntent time — only actually consumed once confirmed,
    // so an abandoned checkout never permanently loses the customer's credit).
    const appliedCreditIdsRaw = capturedIntent?.metadata?.['appliedCreditIds']
    if (appliedCreditIdsRaw) {
      const creditIds = appliedCreditIdsRaw.split(',').filter(Boolean)
      try {
        const batch = db.batch()
        for (const creditId of creditIds) {
          batch.update(db.collection('credits').doc(creditId), {
            status: 'redeemed',
            redeemedAt: new Date(),
            redeemedOnBookingId: bookingId,
          })
        }
        await batch.commit()
        console.log(`[onBookingStatusConfirmed] Finalized ${creditIds.length} redeemed credit(s) for booking '${bookingId}'.`)
      } catch (creditErr) {
        logError(`[onBookingStatusConfirmed] Failed to finalize redeemed credits for booking '${bookingId}':`, creditErr)
      }
    }

    // (b) issue a reward credit to the referrer, if this booking used a referral code.
    // Idempotency guard keyed on sourceBookingId — a booking can only ever be "the
    // referred booking" once, so this also protects against duplicate status writes.
    const referredBy = after['referredBy'] as string | undefined | null
    if (referredBy) {
      try {
        const existing = await db.collection('credits').where('sourceBookingId', '==', bookingId).limit(1).get()
        if (existing.empty) {
          const referralSnap = await db.collection('referrals').doc(referredBy).get()
          const referralData = referralSnap.data()
          if (referralSnap.exists && referralData?.['ownerEmail']) {
            const configSnap = await db.collection('config').doc('referralConfig').get()
            const configData = configSnap.data()
            const configEnabled = configData?.['enabled'] !== false
            const rewardAmount = configEnabled ? (configData?.['referrerRewardAmount'] ?? 20) : 0
            if (rewardAmount > 0) {
              await db.collection('credits').add({
                customerEmail: referralData['ownerEmail'],
                amount: rewardAmount,
                currency: 'CAD',
                reason: 'referral_reward',
                sourceBookingId: bookingId,
                sourceReferralCode: referredBy,
                status: 'available',
                issuedAt: new Date(),
                redeemedAt: null,
                redeemedOnBookingId: null,
                adjustedBy: null,
              })
              console.log(`[onBookingStatusConfirmed] Issued $${rewardAmount} referral credit to ${referralData['ownerEmail']} for booking '${bookingId}'.`)
            }
          }
        }
      } catch (referralErr) {
        logError(`[onBookingStatusConfirmed] Failed to issue referral credit for booking '${bookingId}':`, referralErr)
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
          })
        }
      } catch (jobErr) {
        logError(`[onBookingCancelled] Failed to update associated job status:`, jobErr)
      }

      // P3-E10: closes the gap ADR-009's own "Consequences" section flagged as
      // unresolved — a cancelled booking's referral code stays active forever
      // otherwise, still redeemable by new clients.
      const referralCode = after['referralCode'] as string | undefined | null
      if (referralCode) {
        try {
          await db.collection('referrals').doc(referralCode).update({ active: false })
          console.log(`[onBookingCancelled] Deactivated referral code '${referralCode}' owned by cancelled booking '${bookingId}'.`)
        } catch (referralErr) {
          logError(`[onBookingCancelled] Failed to deactivate referral code '${referralCode}':`, referralErr)
        }
      }

      const smsConfig = {
        accountSid: TWILIO_ACCOUNT_SID.value(),
        authToken: TWILIO_AUTH_TOKEN.value(),
        fromNumber: TWILIO_PHONE_NUMBER.value(),
      }
      const adminPhone = process.env.OWNER_PHONE || '+16139353555'
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
