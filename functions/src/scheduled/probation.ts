import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore } from 'firebase-admin/firestore'
import {
  RESEND_API_KEY,
  OWNER_EMAIL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  logError,
} from '../lib/shared'
import { sendProbationCheckInDueEmail } from '../sendEmail'
import { sendProbationCheckInDueSms } from '../sendSms'

// P3-E27-D2: mirrors onDailyReminderCheck's exact shape. `probation.probationOutcome`
// is a queryable dot-path on the staff doc, so the Firestore query narrows to staff still
// mid-probation before the check-ins array itself is inspected in code.
export const onProbationCheckInDue = onSchedule(
  {
    schedule: '0 13 * * *',
    timeZone: 'UTC',
    secrets: [RESEND_API_KEY, OWNER_EMAIL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async () => {
    const db = getFirestore('(default)')
    const today = new Date().toISOString().slice(0, 10)

    const snapshot = await db
      .collection('staff')
      .where('probation.probationOutcome', '==', 'pending')
      .get()

    if (snapshot.empty) {
      console.log(`[onProbationCheckInDue] No staff mid-probation for ${today}`)
      return
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
    const adminPhone = process.env['OWNER_PHONE'] || '+16139353555'

    let dueCount = 0
    const results = await Promise.allSettled(
      snapshot.docs.flatMap((docSnap) => {
        const data = docSnap.data()
        const employeeName = `${data['firstName']} ${data['lastName']}`
        const checkIns: Array<{ dayOffset: number; scheduledDate: string; completedDate: string | null }> =
          data['probation']?.checkIns || []

        return checkIns
          .filter((c) => c.scheduledDate === today && c.completedDate == null)
          .map(async (checkIn) => {
            dueCount++
            await Promise.all([
              sendProbationCheckInDueEmail(employeeName, checkIn.dayOffset, docSnap.id, emailConfig),
              sendProbationCheckInDueSms(employeeName, checkIn.dayOffset, adminPhone, smsConfig),
            ])
          })
      }),
    )

    results.forEach((result) => {
      if (result.status === 'rejected') {
        logError('[onProbationCheckInDue] notification failed:', result.reason)
      }
    })

    console.log(`[onProbationCheckInDue] Processed ${dueCount} due check-in(s) for ${today}`)
  },
)
