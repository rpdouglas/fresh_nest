import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore } from 'firebase-admin/firestore'
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  logError,
} from '../lib/shared'
import { sendSmsReminder } from '../sendSms'
import { addDays, BUSINESS_TZ, todayInZone } from '../shared/time'

export const onDailyReminderCheck = onSchedule(
  {
    // P14 Sylvie: 09:00 Toronto time all year (13:00 UTC drifted to 08:00 after the clock change).
    schedule: '0 9 * * *',
    timeZone: BUSINESS_TZ,
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async () => {
    const db = getFirestore('(default)')

    const tomorrowStr = addDays(todayInZone(), 1)

    const snapshot = await db
      .collection('bookings')
      .where('preferredDate', '==', tomorrowStr)
      // Only confirmed visits — a pending quote request or unconfirmed renewal is not booked yet.
      .where('status', '==', 'confirmed')
      .get()

    if (snapshot.empty) {
      console.log(`[onDailyReminderCheck] No reminders for ${tomorrowStr}`)
      return
    }

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken: TWILIO_AUTH_TOKEN.value(),
      fromNumber: TWILIO_PHONE_NUMBER.value(),
    }

    const results = await Promise.allSettled(
      snapshot.docs.map((doc) => {
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
        logError(`[onDailyReminderCheck] doc ${snapshot.docs[i]?.id} failed:`, result.reason)
      }
    })

    console.log(`[onDailyReminderCheck] Processed ${snapshot.size} reminder(s) for ${tomorrowStr}`)
  },
)
