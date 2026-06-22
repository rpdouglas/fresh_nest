import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} from '../lib/shared'
import { notifyStaffMember, notifyAllActiveStaff } from '../notifications'

// F15: Firestore triggers for job creation (posting to Shift Board)
export const onJobCreatedTrigger = onDocumentCreated(
  {
    document: 'jobs/{docId}',
    database: '(default)',
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const job = event.data?.data()
    if (!job) return

    const jobId = event.params['docId']
    console.log(`[onJobCreatedTrigger] Job '${jobId}' created (status: ${job.status}).`)

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken: TWILIO_AUTH_TOKEN.value(),
      fromNumber: TWILIO_PHONE_NUMBER.value(),
    }

    const db = getFirestore('(default)')

    // Notify all active staff about the new unassigned shift posting
    if (job.status === 'unassigned' && !job.assignedTo) {
      await notifyAllActiveStaff(
        db,
        'new_shift_board_posting',
        job.scheduledDate,
        job.scheduledStartTime,
        job.scheduledEndTime,
        jobId,
        smsConfig,
      )
    }
    // Direct assignment on creation
    else if (job.assignedTo) {
      await notifyStaffMember(
        db,
        job.assignedTo,
        'shift_assigned',
        job.scheduledDate,
        job.scheduledStartTime,
        job.scheduledEndTime,
        jobId,
        smsConfig,
      )
    }
  },
)
