import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { executeClaimJob } from '../jobs'
import { logError } from '../lib/shared'

// F05: Transactional Callable to Claim Shift
export const claimJob = onCall(async (request) => {
  const auth = request.auth
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to claim shifts.')
  }

  const { jobId } = request.data as { jobId?: string }
  if (!jobId) {
    throw new HttpsError('invalid-argument', 'Job ID is required.')
  }

  try {
    const result = await executeClaimJob(auth.uid, jobId)
    return result
  } catch (err: any) {
    logError('[claimJob] Failed to claim job:', err)
    const msg = err.message || ''
    if (msg === 'JOB_NOT_FOUND') {
      throw new HttpsError('not-found', 'The requested job was not found.')
    }
    if (msg === 'JOB_ALREADY_ASSIGNED') {
      throw new HttpsError('failed-precondition', 'This shift has already been claimed by another cleaner.')
    }
    if (msg === 'STAFF_PROFILE_NOT_FOUND') {
      throw new HttpsError('not-found', 'Your staff profile was not found.')
    }
    if (msg === 'STAFF_INACTIVE') {
      throw new HttpsError('failed-precondition', 'Your staff account is currently inactive.')
    }
    if (msg === 'EARNINGS_CAP_EXCEEDED') {
      throw new HttpsError('failed-precondition', 'Claiming this shift would exceed your monthly earnings limit.')
    }
    if (msg === 'TRAVEL_BUFFER_EXCEEDED') {
      throw new HttpsError('failed-precondition', 'Claiming this shift would violate your travel buffer limit.')
    }
    if (msg === 'BLOCKED_WINDOW_OVERLAP') {
      throw new HttpsError('failed-precondition', 'Claiming this shift would conflict with a blocked window on your calendar.')
    }
    throw new HttpsError('internal', msg || 'Failed to claim shift due to an internal error.')
  }
})
