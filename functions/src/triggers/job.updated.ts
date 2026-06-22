import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  logError,
} from '../lib/shared'
import { notifyStaffMember } from '../notifications'
import { sendOnMyWaySms } from '../sendSms'

// F15: Firestore triggers for job updates (assignment modifications / cancellations)
export const onJobUpdatedTrigger = onDocumentUpdated(
  {
    document: 'jobs/{docId}',
    database: '(default)',
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    const jobId = event.params['docId']
    const db = getFirestore('(default)')

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken: TWILIO_AUTH_TOKEN.value(),
      fromNumber: TWILIO_PHONE_NUMBER.value(),
    }

    // 1. Shift Cancellation
    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      const recipient = after.assignedTo || before.assignedTo
      if (recipient) {
        await notifyStaffMember(
          db,
          recipient,
          'shift_cancelled',
          after.scheduledDate,
          after.scheduledStartTime,
          after.scheduledEndTime,
          jobId,
          smsConfig,
        )
      }
      return
    }

    // 2. Assignment change
    if (before.assignedTo !== after.assignedTo) {
      // Case A: Cleaner unassigned
      if (before.assignedTo && !after.assignedTo) {
        await notifyStaffMember(
          db,
          before.assignedTo,
          'shift_unassigned',
          after.scheduledDate,
          after.scheduledStartTime,
          after.scheduledEndTime,
          jobId,
          smsConfig,
        )
      }
      // Case B: Cleaner assigned
      else if (after.assignedTo) {
        // If it was reassigned from someone else, notify the old cleaner
        if (before.assignedTo) {
          await notifyStaffMember(
            db,
            before.assignedTo,
            'shift_unassigned',
            after.scheduledDate,
            after.scheduledStartTime,
            after.scheduledEndTime,
            jobId,
            smsConfig,
          )
        }

        // Notify the new cleaner
        await notifyStaffMember(
          db,
          after.assignedTo,
          'shift_assigned',
          after.scheduledDate,
          after.scheduledStartTime,
          after.scheduledEndTime,
          jobId,
          smsConfig,
        )
      }
    }

    // 3. Customer check-in notification
    const isCheckInTransition =
      (!before.checkedInAt && after.checkedInAt) &&
      (before.status === 'assigned' || before.status === 'acknowledged') &&
      after.status === 'in_progress'

    if (isCheckInTransition) {
      console.log(`[onJobUpdatedTrigger] Job '${jobId}' cleaner checked in. Initiating customer notification.`)

      // A. Retrieve parent booking to get language preference
      let bookingLanguage = 'en'
      if (after.bookingId) {
        try {
          const bookingSnap = await db.collection('bookings').doc(after.bookingId).get()
          if (bookingSnap.exists) {
            const bookingData = bookingSnap.data()
            if (bookingData && bookingData.language) {
              bookingLanguage = bookingData.language
            }
          }
        } catch (err) {
          logError(`[onJobUpdatedTrigger] Failed to retrieve booking '${after.bookingId}':`, err)
        }
      }

      // B. Retrieve cleaner's name
      let cleanerName = ''
      if (after.assignedTo) {
        try {
          const staffSnap = await db.collection('staff').doc(after.assignedTo).get()
          if (staffSnap.exists) {
            const staffData = staffSnap.data()
            if (staffData && staffData.firstName) {
              cleanerName = staffData.firstName
            }
          }
        } catch (err) {
          logError(`[onJobUpdatedTrigger] Failed to retrieve staff profile for '${after.assignedTo}':`, err)
        }
      }

      const displayCleanerName = cleanerName || (bookingLanguage === 'fr' ? 'votre préposé(e)' : 'your cleaner')

      // C. Get customer's phone number from job (clientPhone) or booking
      const phone = after.clientPhone || ''
      if (phone) {
        try {
          await sendOnMyWaySms(phone, bookingLanguage, displayCleanerName, smsConfig)
          console.log(`[onJobUpdatedTrigger] SMS check-in alert successfully sent to customer phone: ${phone}`)
        } catch (smsErr) {
          logError(`[onJobUpdatedTrigger] Failed to send SMS check-in alert to customer:`, smsErr)
        }
      } else {
        console.warn(`[onJobUpdatedTrigger] No customer phone number found on job '${jobId}'. Skipping SMS.`)
      }
    }
  },
)

// P2-E2: Post-Job Review Automation Status Trigger
export const onJobStatusCompleted = onDocumentUpdated(
  {
    document: 'jobs/{docId}',
    database: '(default)',
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    // Guard: only fire when status transitions to 'completed'
    if (before.status !== 'completed' && after.status === 'completed') {
      const jobId = event.params['docId']
      console.log(`[onJobStatusCompleted] Job '${jobId}' completed. Scheduling review request.`)
      const db = getFirestore()
      try {
        await db.collection('jobs').doc(jobId).update({
          reviewRequestScheduledFor: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
          reviewEmailSent: false,
        })
        console.log(`[onJobStatusCompleted] Scheduled review request for Job '${jobId}'.`)
      } catch (err) {
        logError(`[onJobStatusCompleted] Failed to schedule review for Job '${jobId}':`, err)
      }
    }
  },
)
