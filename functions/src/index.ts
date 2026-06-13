import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { defineSecret } from 'firebase-functions/params'
import { sendOwnerNotification, sendClientConfirmation } from './sendEmail'
import { sendSmsConfirmation, sendSmsReminder } from './sendSms'
import type { BookingData } from './emailTemplates'

initializeApp()

const RESEND_API_KEY       = defineSecret('RESEND_API_KEY')
const OWNER_EMAIL          = defineSecret('OWNER_EMAIL')
const TWILIO_ACCOUNT_SID   = defineSecret('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN    = defineSecret('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER  = defineSecret('TWILIO_PHONE_NUMBER')

export const onBookingCreated = onDocumentCreated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
    secrets:  [RESEND_API_KEY, OWNER_EMAIL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const booking = event.data?.data() as BookingData | undefined
    if (!booking) return

    // E31: Generate referral code and write to referrals collection
    const firstName = booking.firstName || 'CLIENT'
    const docId = event.params['docId']
    const refCode = `${firstName.trim().toUpperCase()}-${docId.substring(0, 4).toUpperCase()}`

    if (!booking.referralCode) {
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
        console.error('[onBookingCreated] Failed to generate referral code:', err)
      }
    }

    const emailConfig = {
      resendApiKey: RESEND_API_KEY.value(),
      ownerEmail:   OWNER_EMAIL.value(),
      fromEmail:    process.env['FROM_EMAIL'] ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
    }

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken:  TWILIO_AUTH_TOKEN.value(),
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
        console.error(`[onBookingCreated] ${labels[i]} failed:`, result.reason)
      }
    })
  },
)

export const onDailyReminderCheck = onSchedule(
  {
    schedule: '0 13 * * *',
    timeZone: 'UTC',
    secrets:  [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async () => {
    // Explicitly target the production database — we never send SMS reminders for test bookings
    // in freshnest-dev. This is intentional. See docs/firestore-schema.md for DB architecture.
    const db = getFirestore('(default)')

    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)

    const snapshot = await db
      .collection('bookings')
      .where('preferredDate', '==', tomorrowStr)
      .where('status', 'in', ['pending', 'confirmed'])
      .get()

    if (snapshot.empty) {
      console.log(`[onDailyReminderCheck] No reminders for ${tomorrowStr}`)
      return
    }

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken:  TWILIO_AUTH_TOKEN.value(),
      fromNumber: TWILIO_PHONE_NUMBER.value(),
    }

    const results = await Promise.allSettled(
      snapshot.docs.map(doc => {
        const d = doc.data()
        return sendSmsReminder(
          d['phone'] as string,
          d['language'] as string,
          d['preferredDate'] as string,
          smsConfig,
        )
      }),
    )

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[onDailyReminderCheck] doc ${snapshot.docs[i]?.id} failed:`, result.reason)
      }
    })

    console.log(`[onDailyReminderCheck] Processed ${snapshot.size} reminder(s) for ${tomorrowStr}`)
  },
)

export const onDailyRecurringRenewal = onSchedule(
  {
    schedule: '0 2 * * *', // Run at 2 AM every day
    timeZone: 'UTC',
  },
  async () => {
    const db = getFirestore('(default)')
    const today = new Date()
    const fourteenDaysOut = new Date()
    fourteenDaysOut.setUTCDate(fourteenDaysOut.getUTCDate() + 14)
    const fourteenDaysOutStr = fourteenDaysOut.toISOString().slice(0, 10)

    console.log(`[onDailyRecurringRenewal] Running check for date threshold: ${fourteenDaysOutStr}`)

    const snapshot = await db
      .collection('bookings')
      .where('status', 'in', ['confirmed', 'completed'])
      .where('frequency', 'in', ['weekly', 'biweekly', 'monthly'])
      .get()

    if (snapshot.empty) {
      console.log('[onDailyRecurringRenewal] No active recurring bookings found.')
      return
    }

    for (const docSnap of snapshot.docs) {
      const booking = docSnap.data() as BookingData
      const preferredDateStr = booking.preferredDate
      if (!preferredDateStr) continue

      const preferredDate = new Date(preferredDateStr + 'T00:00:00Z')
      let daysToAdd = 7
      if (booking.frequency === 'biweekly') daysToAdd = 14
      if (booking.frequency === 'monthly') daysToAdd = 30

      const nextDate = new Date(preferredDate.getTime())
      nextDate.setUTCDate(nextDate.getUTCDate() + daysToAdd)
      const nextDateStr = nextDate.toISOString().slice(0, 10)

      // Only generate if the next clean is within our 14-day window and is in the future
      const todayStr = today.toISOString().slice(0, 10)
      if (nextDateStr > todayStr && nextDateStr <= fourteenDaysOutStr) {
        // Check if we already created a booking for this client on that next date
        const existingQuery = await db
          .collection('bookings')
          .where('email', '==', booking.email)
          .where('preferredDate', '==', nextDateStr)
          .where('status', '!=', 'cancelled')
          .get()

        if (existingQuery.empty) {
          console.log(`[onDailyRecurringRenewal] Auto-renewing booking for ${booking.email} on date ${nextDateStr}`)
          
          const newBookingData = {
            firstName:         booking.firstName,
            lastName:          booking.lastName,
            email:             booking.email,
            phone:             booking.phone,
            language:          booking.language,
            propertyType:      booking.propertyType,
            bedrooms:          booking.bedrooms,
            bathrooms:         booking.bathrooms,
            squareFootage:     booking.squareFootage || null,
            frequency:         booking.frequency,
            pets:              booking.pets ?? false,
            address:           booking.address,
            serviceType:       booking.serviceType,
            addOns:            booking.addOns || [],
            preferredCleaner:  booking.preferredCleaner || null,
            notes:             booking.notes || '',
            leadSource:        'organic',
            status:            'pending',
            assignedTo:        booking.assignedTo || null,
            isAirbnb:          booking.isAirbnb || false,
            photoConfirmation: booking.photoConfirmation || false,
            createdAt:         new Date(),
          }

          await db.collection('bookings').add(newBookingData)
        }
      }
    }
  },
)
