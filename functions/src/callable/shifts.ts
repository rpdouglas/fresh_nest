import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { logError } from '../lib/shared'
import { buildOpenShifts, type OpenShiftResponse } from '../lib/openShifts'

const FSM_ROLES = ['staff', 'supervisor', 'admin']

/**
 * HOTFIX-02: Shift Board data source for FSM staff.
 *
 * Staff cannot read unassigned jobs directly (firestore.rules only grants reads on
 * jobs assigned to the caller). This callable returns a PII-minimised projection
 * with eligibility evaluated by the same code `claimJob` enforces — see buildOpenShifts.
 */
export const listOpenShifts = onCall(async (request): Promise<{ shifts: OpenShiftResponse[] }> => {
  const authContext = request.auth
  if (!authContext) {
    throw new HttpsError('unauthenticated', 'User must be logged in to view shifts.')
  }
  const role = authContext.token.role as string | undefined
  if (!role || !FSM_ROLES.includes(role)) {
    throw new HttpsError('permission-denied', 'Only staff can view open shifts.')
  }

  // Same database as executeClaimJob, so every listed shift is claimable.
  const db = getFirestore('(default)')

  try {
    const [openSnap, staffSnap, assignedSnap] = await Promise.all([
      db.collection('jobs').where('status', '==', 'unassigned').get(),
      db.collection('staff').doc(authContext.uid).get(),
      db.collection('jobs').where('assignedTo', '==', authContext.uid).get(),
    ])

    // Admins may browse the board without a staff profile; staff must have one.
    if (!staffSnap.exists && role !== 'admin') {
      throw new HttpsError('not-found', 'Your staff profile was not found.')
    }

    const shifts = buildOpenShifts(
      openSnap.docs.map((d) => ({ id: d.id, data: d.data() })),
      staffSnap.data() ?? {},
      assignedSnap.docs.map((d) => ({ id: d.id, data: d.data() })),
    )
    return { shifts }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    logError('[listOpenShifts] Failed to list open shifts:', err)
    throw new HttpsError('internal', 'Failed to load open shifts.')
  }
})
