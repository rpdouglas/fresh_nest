import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { RESEND_API_KEY, logError } from '../lib/shared'
import { sendReviewRequestEmail } from '../sendEmail'

// P2-E2: Post-Job Review Automation Hourly Scheduler
export const onReviewEmailScheduler = onSchedule(
  {
    schedule: '0 * * * *', // Every hour
    timeZone: 'UTC',
    secrets: [RESEND_API_KEY],
  },
  async () => {
    const db = getFirestore('(default)')
    const now = Timestamp.now()

    console.log('[onReviewEmailScheduler] Checking for jobs pending review request email...')
    try {
      const snapshot = await db
        .collection('jobs')
        .where('reviewEmailSent', '==', false)
        .where('reviewRequestScheduledFor', '<=', now)
        .get()

      if (snapshot.empty) {
        console.log('[onReviewEmailScheduler] No jobs pending review emails.')
        return
      }

      const emailConfig = {
        resendApiKey: RESEND_API_KEY.value(),
        ownerEmail: '',
        fromEmail: process.env['FROM_EMAIL'] ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
      }

      for (const jobDoc of snapshot.docs) {
        const jobId = jobDoc.id
        const job = jobDoc.data()
        const bookingId = job['bookingId']

        if (!bookingId) {
          console.warn(`[onReviewEmailScheduler] Job '${jobId}' has no bookingId. Skipping.`)
          await db.collection('jobs').doc(jobId).update({ reviewEmailSent: true })
          continue
        }

        const bookingSnap = await db.collection('bookings').doc(bookingId).get()
        if (!bookingSnap.exists) {
          console.warn(`[onReviewEmailScheduler] Booking '${bookingId}' not found for Job '${jobId}'. Skipping.`)
          await db.collection('jobs').doc(jobId).update({ reviewEmailSent: true })
          continue
        }

        const booking = bookingSnap.data()
        if (!booking) continue

        const clientEmail = booking['email']
        const clientName = `${booking['firstName']} ${booking['lastName'] ? booking['lastName'].charAt(0) + '.' : ''}`
        const lang = booking['language'] === 'fr' ? 'fr' : 'en'
        const clientAppUrl = process.env['CLIENT_APP_URL'] ?? 'https://lilypad-freshnest.web.app'
        const reviewUrl = `${clientAppUrl}/leave-review?jobId=${jobId}`

        console.log(`[onReviewEmailScheduler] Sending review email for Job '${jobId}' to ${clientEmail} (lang: ${lang})`)

        try {
          await sendReviewRequestEmail(clientName, clientEmail, reviewUrl, lang, emailConfig)
          await db.collection('jobs').doc(jobId).update({ reviewEmailSent: true })
          console.log(`[onReviewEmailScheduler] Successfully sent review email and updated status for Job '${jobId}'.`)
        } catch (emailErr) {
          logError(`[onReviewEmailScheduler] Failed to send review email for Job '${jobId}':`, emailErr)
        }
      }
    } catch (err) {
      logError('[onReviewEmailScheduler] Scheduler execution failed:', err)
    }
  },
)
