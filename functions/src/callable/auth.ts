import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { logError } from '../lib/shared'
import { checkRoleChange, isOfficeRole, normalizeRole, requireOffice, type Role } from '../lib/roles'

// P2-E8 / P3-E35: set a user's role claim.
// Owners and Managers may set supervisor, staff and customer; only Owners may give or take away
// owner and manager. Nobody changes their own role. Every change is written to the audit log.
export const setUserRole = onCall(async (request) => {
  const db = getFirestore()
  const callerRole = await requireOffice(request.auth, db, 'change roles')
  const caller = request.auth!

  const targetUid = request.data?.uid as string | undefined
  const targetEmail = request.data?.email as string | undefined
  const targetRole = request.data?.role as string | undefined
  const forceDowngrade = request.data?.forceDowngrade === true

  let resolvedUid = targetUid
  const auth = getAuth()

  if (!resolvedUid && targetEmail) {
    try {
      const userRecord = await auth.getUserByEmail(targetEmail.trim().toLowerCase())
      resolvedUid = userRecord.uid
    } catch {
      throw new HttpsError('not-found', `User with email ${targetEmail} not found in Auth. They need to sign in once first.`)
    }
  }

  if (!resolvedUid) {
    throw new HttpsError('invalid-argument', 'Either uid or email must be provided to identify the target user.')
  }

  try {
    const existingRecord = await auth.getUser(resolvedUid)
    const existingRole = existingRecord.customClaims?.role as string | undefined

    const refusal = checkRoleChange({
      callerUid: caller.uid,
      callerRole,
      targetUid: resolvedUid,
      existingRole,
      targetRole,
      forceDowngrade,
    })
    if (refusal) {
      console.warn(`[setUserRole] Refused '${existingRole}' → '${targetRole}' for UID ${resolvedUid}: ${refusal.message}`)
      throw refusal
    }
    let newRole = normalizeRole(targetRole) as Role
    const email = existingRecord.email?.trim().toLowerCase()

    // Removing someone from the office: if they're also on staff, they keep the staff app.
    if (newRole === 'customer' && isOfficeRole(existingRole) && email) {
      const staffSnap = await db.collection('staff').where('email', '==', email).limit(1).get()
      if (!staffSnap.empty) newRole = staffSnap.docs[0].data().role === 'supervisor' ? 'supervisor' : 'staff'
    }

    await auth.setCustomUserClaims(resolvedUid, { ...(existingRecord.customClaims ?? {}), role: newRole })

    // Keep the office allowlist in step: it lists exactly the Owners and Managers.
    if (email) {
      const allowRef = db.collection('admins').doc(email)
      if (isOfficeRole(newRole)) {
        await allowRef.set({ role: newRole, grantedBy: caller.token.email ?? caller.uid, grantedAt: new Date() }, { merge: true })
      } else if (isOfficeRole(existingRole)) {
        await allowRef.delete()
      }
    }

    await db.collection('auditLog').add({
      collection: 'users',
      documentId: resolvedUid,
      field: 'role',
      oldValue: existingRole ?? null,
      newValue: newRole,
      changedBy: caller.token.email ?? caller.uid,
      changedAt: new Date(),
      reason: null,
      overrideType: 'role_change',
    })

    console.log(`[setUserRole] Set role '${newRole}' for UID ${resolvedUid} (was '${existingRole ?? 'none'}').`)
    return { success: true, uid: resolvedUid, role: newRole }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    logError(`[setUserRole] Failed to set claims for user ${resolvedUid}:`, err)
    throw new HttpsError('internal', 'Failed to update user custom claims.')
  }
})
