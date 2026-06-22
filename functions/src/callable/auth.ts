import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { logError } from '../lib/shared'

// P2-E8: Callable admin function to set user claims role
export const setUserRole = onCall(async (request) => {
  const authContext = request.auth
  if (!authContext) {
    throw new HttpsError('unauthenticated', 'User must be logged in.')
  }

  const db = getFirestore()
  let isAuthorized = authContext.token.role === 'admin'
  if (!isAuthorized && authContext.token.email) {
    const adminSnap = await db.collection('admins').doc(authContext.token.email.trim().toLowerCase()).get()
    if (adminSnap.exists) {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Only administrators can change user roles.')
  }

  const targetUid = request.data?.uid as string | undefined
  const targetEmail = request.data?.email as string | undefined
  const targetRole = request.data?.role as string | undefined

  if (!targetRole || !['admin', 'supervisor', 'staff', 'customer'].includes(targetRole)) {
    throw new HttpsError('invalid-argument', 'Valid role is required (admin, supervisor, staff, customer).')
  }

  let resolvedUid = targetUid
  const auth = getAuth()

  if (!resolvedUid && targetEmail) {
    try {
      const userRecord = await auth.getUserByEmail(targetEmail.trim().toLowerCase())
      resolvedUid = userRecord.uid
    } catch (err) {
      throw new HttpsError('not-found', `User with email ${targetEmail} not found in Auth.`)
    }
  }

  if (!resolvedUid) {
    throw new HttpsError('invalid-argument', 'Either uid or email must be provided to identify the target user.')
  }

  // Never-downgrade guard: block accidental privilege demotion unless caller
  // explicitly passes forceDowngrade: true.
  const ROLE_PRIORITY: Record<string, number> = { admin: 4, supervisor: 3, staff: 2, customer: 1 }
  const forceDowngrade = request.data?.forceDowngrade === true

  try {
    const existingRecord = await auth.getUser(resolvedUid)
    const existingRole = existingRecord.customClaims?.role as string | undefined
    if (
      !forceDowngrade &&
      existingRole &&
      (ROLE_PRIORITY[existingRole] ?? 0) > (ROLE_PRIORITY[targetRole] ?? 0)
    ) {
      console.warn(`[setUserRole] Blocked downgrade attempt: '${existingRole}' → '${targetRole}' for UID ${resolvedUid}. Pass forceDowngrade=true to override.`)
      throw new HttpsError(
        'failed-precondition',
        `Cannot downgrade role from '${existingRole}' to '${targetRole}' without explicit forceDowngrade flag.`
      )
    }

    await auth.setCustomUserClaims(resolvedUid, { role: targetRole })
    console.log(`[setUserRole] Successfully set custom role claim '${targetRole}' for user UID: ${resolvedUid}`)
    return { success: true, uid: resolvedUid, role: targetRole }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    logError(`[setUserRole] Failed to set claims for user ${resolvedUid}:`, err)
    throw new HttpsError('internal', 'Failed to update user custom claims.')
  }
})
