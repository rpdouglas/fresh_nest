import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { logError } from '../lib/shared'
import { allowlistRole, checkPreApproval, checkRoleChange, isOfficeRole, normalizeRole, requireOffice, rolePriority, type Role } from '../lib/roles'

// P2-E8 / P3-E35: set a user's role claim.
// Owners and Managers may set supervisor, staff and customer; only Owners may give or take away
// owner and manager. Nobody changes their own role. Every change is written to the audit log.
// An Owner can pre-approve an email that has no account yet: only the allowlist changes, and
// onUserCreated applies the role on their first sign-in.
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
    const email = targetEmail.trim().toLowerCase()
    try {
      const userRecord = await auth.getUserByEmail(email)
      resolvedUid = userRecord.uid
    } catch {
      return preApprove(db, caller, callerRole, email, targetRole, forceDowngrade)
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
      // Tidy an old hand-made entry keyed by account ID; the email-keyed entry above replaces it.
      await db.collection('admins').doc(resolvedUid).delete()
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

// P3-E35: the Team & roles list shows allowlist entries by email. Old entries added by hand
// under an account ID are looked up here (apps can't read other users' emails).
export const resolveOfficeEntries = onCall(async (request) => {
  const db = getFirestore()
  await requireOffice(request.auth, db, 'view the office team')
  const ids = request.data?.ids
  if (!Array.isArray(ids) || ids.length > 50 || !ids.every((id) => typeof id === 'string' && id.length > 0)) {
    throw new HttpsError('invalid-argument', 'ids must be a list of up to 50 allowlist entry IDs.')
  }
  const auth = getAuth()
  const emails: Record<string, string | null> = {}
  for (const id of ids as string[]) {
    // Only entries that are really on the allowlist, so this can't look up arbitrary accounts.
    const entry = await db.collection('admins').doc(id).get()
    if (!entry.exists) continue
    try {
      emails[id] = (await auth.getUser(id)).email?.trim().toLowerCase() ?? null
    } catch {
      emails[id] = null
    }
  }
  return { emails }
})

export interface SyncRoleDirectoryReader {
  getAdminDoc: (email: string) => Promise<{ exists: boolean; data: () => { role?: unknown } | undefined }>
  getStaffRole: (email: string) => Promise<unknown | undefined>
}

export async function reconcileUserRole(params: {
  email: string
  existingRole: unknown
  directory: SyncRoleDirectoryReader
}): Promise<{ role: Role; updated: boolean }> {
  const cleanEmail = params.email.trim().toLowerCase()
  let directoryRole: Role = 'customer'

  if (cleanEmail) {
    const adminSnap = await params.directory.getAdminDoc(cleanEmail)
    const officeRole = adminSnap.exists ? allowlistRole(adminSnap.data()) : undefined
    if (officeRole) {
      directoryRole = officeRole
    } else {
      const staffRole = await params.directory.getStaffRole(cleanEmail)
      if (staffRole !== undefined) {
        directoryRole = staffRole === 'supervisor' ? 'supervisor' : 'staff'
      }
    }
  }

  const normalizedExisting = normalizeRole(params.existingRole)
  const targetRole: Role =
    normalizedExisting && rolePriority(normalizedExisting) > rolePriority(directoryRole)
      ? normalizedExisting
      : directoryRole

  const updated = params.existingRole !== targetRole
  return { role: targetRole, updated }
}

// HOTFIX-10: Self-healing callable so any signed-in user whose email is in `admins/{email}`
// or `staff` (such as an Owner pre-approved before first sign-in or added after their Auth
// account already existed) can reconcile their `role` custom claim immediately without waiting
// on the v1 `onUserCreated` trigger.
export const syncMyRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.')
  }

  const uid = request.auth.uid
  const db = getFirestore()
  const auth = getAuth()

  try {
    const existingRecord = await auth.getUser(uid)
    const email = (request.auth.token.email ?? existingRecord.email ?? '').trim().toLowerCase()
    const existingRole = existingRecord.customClaims?.role

    const { role, updated } = await reconcileUserRole({
      email,
      existingRole,
      directory: {
        getAdminDoc: async (e) => {
          const snap = await db.collection('admins').doc(e).get()
          return { exists: snap.exists, data: () => snap.data() as { role?: unknown } | undefined }
        },
        getStaffRole: async (e) => {
          const snap = await db.collection('staff').where('email', '==', e).limit(1).get()
          return snap.empty ? undefined : snap.docs[0].data().role
        },
      },
    })

    if (updated) {
      await auth.setCustomUserClaims(uid, { ...(existingRecord.customClaims ?? {}), role })
      console.log(`[syncMyRole] Reconciled role '${role}' for UID ${uid} (${email || 'no-email'}, was '${String(existingRole ?? 'none')}').`)
    }

    return { role, updated }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    logError(`[syncMyRole] Failed to reconcile role for UID ${uid}:`, err)
    throw new HttpsError('internal', 'Failed to synchronize user role.')
  }
})

type Caller = { uid: string; token: { email?: string } }

async function preApprove(
  db: Firestore,
  caller: Caller,
  callerRole: Role,
  email: string,
  targetRole: string | undefined,
  forceDowngrade: boolean,
) {
  const allowRef = db.collection('admins').doc(email)
  const allowSnap = await allowRef.get()
  const existingRole = allowSnap.exists ? allowlistRole(allowSnap.data()) : undefined
  const refusal = checkPreApproval({
    callerEmail: caller.token.email?.trim().toLowerCase() ?? caller.uid,
    callerRole,
    targetEmail: email,
    existingRole,
    targetRole,
    forceDowngrade,
  })
  if (refusal) throw refusal

  const newRole = normalizeRole(targetRole) as Role
  const changedBy = caller.token.email ?? caller.uid
  try {
    if (isOfficeRole(newRole)) {
      await allowRef.set({ role: newRole, grantedBy: changedBy, grantedAt: new Date() }, { merge: true })
    } else {
      await allowRef.delete()
    }
    await db.collection('auditLog').add({
      collection: 'admins',
      documentId: email,
      field: 'role',
      oldValue: existingRole ?? null,
      newValue: isOfficeRole(newRole) ? newRole : null,
      changedBy,
      changedAt: new Date(),
      reason: 'pre-approved before first sign-in',
      overrideType: 'role_change',
    })
  } catch (err) {
    logError(`[setUserRole] Failed to pre-approve ${email}:`, err)
    throw new HttpsError('internal', 'Failed to update the office allowlist.')
  }
  console.log(`[setUserRole] Pre-approved '${email}' as '${newRole}' (was '${existingRole ?? 'none'}').`)
  return { success: true, pending: true, role: newRole }
}
