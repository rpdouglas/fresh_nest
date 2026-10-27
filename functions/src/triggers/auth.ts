import * as functionsV1 from 'firebase-functions/v1'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { logError } from '../lib/shared'
import { allowlistRole, normalizeRole, rolePriority } from '../lib/roles'

// P2-E1/E8: Async Auth Trigger to set appropriate role custom claim for new signups
export const onUserCreated = functionsV1.auth.user().onCreate(async (user) => {
  const uid = user.uid
  const email = user.email ? user.email.trim().toLowerCase() : ''
  console.log(`[onUserCreated] Processing new user signup: ${uid} (email: ${email})`)

  let assignedRole = 'customer'
  const db = getFirestore()

  try {
    if (email) {
      // 1. Check if email exists in admins collection
      const adminSnap = await db.collection('admins').doc(email).get()
      const officeRole = adminSnap.exists ? allowlistRole(adminSnap.data()) : undefined
      if (officeRole) {
        assignedRole = officeRole
        console.log(`[onUserCreated] User email matches the office allowlist. Assigning '${officeRole}' role.`)
      } else {
        // 2. Check if email exists in staff collection
        const staffQ = db.collection('staff').where('email', '==', email)
        const staffSnap = await staffQ.limit(1).get()
        if (!staffSnap.empty) {
          const staffDoc = staffSnap.docs[0]
          const staffData = staffDoc.data()
          const staffRole = staffData.role
          if (staffRole === 'supervisor') {
            assignedRole = 'supervisor'
          } else {
            assignedRole = 'staff'
          }
          console.log(`[onUserCreated] User email matches staff collection (FSM Role: ${staffRole}). Assigning '${assignedRole}' role.`)
        }
      }
    }

    const auth = getAuth()

    // Never-downgrade guard: if the user somehow already has a higher-privilege claim
    // (e.g. account re-created after deletion, provider-linking edge case), keep it.
    const existingRecord = await auth.getUser(uid)
    const existingRole = existingRecord.customClaims?.role as string | undefined
    if (existingRole && rolePriority(existingRole) > rolePriority(assignedRole)) {
      console.log(`[onUserCreated] Existing role '${existingRole}' outranks '${assignedRole}'. Preserving existing claim.`)
      assignedRole = normalizeRole(existingRole) ?? existingRole
    }

    await auth.setCustomUserClaims(uid, { role: assignedRole })

    // Also create/merge a customer profile in Firestore
    await db.collection('customers').doc(uid).set({
      email: user.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true })

    console.log(`[onUserCreated] Successfully set custom claim '${assignedRole}' and customer profile for ${uid}`)
  } catch (err) {
    logError(`[onUserCreated] Failed to set claims/profile for ${uid}:`, err)
  }
})
