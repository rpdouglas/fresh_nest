import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { logger } from 'firebase-functions'
import { Sentry, RESEND_API_KEY, OWNER_EMAIL, FSM_APP_URL } from '../lib/shared'
import { sendWelcomeEmail } from '../sendEmail'

// P3-E27-A2: Staff registration — atomic Auth + claims + Firestore write
export const onStaffRegistered = onCall(
  {
    secrets: [RESEND_API_KEY, OWNER_EMAIL, FSM_APP_URL],
  },
  async (request) => {
    const authContext = request.auth
    if (!authContext) {
      throw new HttpsError('unauthenticated', 'Must be authenticated.')
    }

    const db = getFirestore()
    const auth = getAuth()

    // Admin-only gate — same pattern as setUserRole
    let isAuthorized = authContext.token.role === 'admin'
    if (!isAuthorized && authContext.token.email) {
      const adminSnap = await db
        .collection('admins')
        .doc(authContext.token.email.trim().toLowerCase())
        .get()
      if (adminSnap.exists) isAuthorized = true
    }
    if (!isAuthorized) {
      throw new HttpsError('permission-denied', 'Only administrators can register staff members.')
    }

    // Validate required payload fields
    const data = request.data as {
      firstName?: string
      lastName?: string
      email?: string
      phone?: string
      role?: string
      status?: string
      language?: string
      transportMode?: string
      transitBufferMinutes?: number
      monthlyEarningsLimit?: number | null
    }

    const VALID_ROLES = ['cleaner', 'lead', 'supervisor']
    const VALID_STATUSES = ['onboarding', 'active', 'inactive']
    const VALID_LANGUAGES = ['en', 'fr']
    const VALID_TRANSPORT = ['personal_vehicle', 'transit', 'rideshare', 'walk']

    if (!data.firstName?.trim()) throw new HttpsError('invalid-argument', 'firstName is required.')
    if (!data.lastName?.trim()) throw new HttpsError('invalid-argument', 'lastName is required.')
    if (!data.email?.trim()) throw new HttpsError('invalid-argument', 'email is required.')
    if (!data.phone?.trim()) throw new HttpsError('invalid-argument', 'phone is required.')
    if (!data.role || !VALID_ROLES.includes(data.role)) throw new HttpsError('invalid-argument', 'role must be cleaner, lead, or supervisor.')
    if (!data.status || !VALID_STATUSES.includes(data.status)) throw new HttpsError('invalid-argument', 'status must be onboarding, active, or inactive.')
    if (!data.language || !VALID_LANGUAGES.includes(data.language)) throw new HttpsError('invalid-argument', 'language must be en or fr.')
    if (!data.transportMode || !VALID_TRANSPORT.includes(data.transportMode)) throw new HttpsError('invalid-argument', 'transportMode is invalid.')
    if (typeof data.transitBufferMinutes !== 'number' || data.transitBufferMinutes < 0) throw new HttpsError('invalid-argument', 'transitBufferMinutes must be a non-negative number.')

    const email = data.email.toLowerCase().trim()

    // Map Firestore role to Auth custom claim (coarse-grained — FSM access gate)
    const authClaim = data.role === 'supervisor' ? 'supervisor' : 'staff'

    // Step 1: Create or retrieve Auth account (idempotent)
    let uid: string
    try {
      const existingUser = await auth.getUserByEmail(email)
      uid = existingUser.uid
      logger.info(`[onStaffRegistered] Reusing existing Auth account for ${email} uid=${uid}`)
    } catch {
      const newUser = await auth.createUser({
        email,
        emailVerified: false,
      })
      uid = newUser.uid
      logger.info(`[onStaffRegistered] Created Auth account for ${email} uid=${uid}`)
    }

    // Step 2: Set custom claim
    await auth.setCustomUserClaims(uid, { role: authClaim })

    // Step 3: Write staff/{uid} document atomically via Admin SDK (bypasses Firestore rules)
    const staffRef = db.collection('staff').doc(uid)
    await staffRef.set({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      phone: data.phone.trim(),
      role: data.role,
      status: data.status,
      preferences: {
        language: data.language,
      },
      constraints: {
        transportMode: data.transportMode,
        transitBufferMinutes: data.transitBufferMinutes,
        blockedWindows: [],
      },
      financials: {
        monthlyEarningsLimit: data.monthlyEarningsLimit ?? null,
        currentMonthEarnings: 0,
        earningsHistory: [],
      },
      compliance: {
        acceptedTermsVersion: null,
        termsHistory: [],
      },
      welcomeEmailSentAt: null,
      onboardingChecklist: {
        trainingCompleted: false,
      },
      // P3-E27-B2: structured consent record — replaces the fabricated
      // onboardingChecklist.backgroundCheck boolean that was never actually consented to.
      backgroundCheck: {
        consentGiven: false,
        consentGivenAt: null,
        consentIpAddress: null,
        status: 'not_started',
        completedAt: null,
      },
      // P3-E27-C1: populated by EmploymentAgreementScreen / EmergencyContactScreen
      // during the first-login consent sequence.
      employmentAgreement: null,
      emergencyContact: null,
      // P3-E27-C2: appended to by the employee from ProfilePage's "Flag a correction".
      corrections: [],
      createdAt: Timestamp.now(),
    })

    logger.info(`[onStaffRegistered] staff/${uid} document written for ${email}`)

    // Step 4: Send welcome email with magic link
    try {
      const fsmAppUrl = process.env.FUNCTIONS_EMULATOR
        ? 'http://localhost:5174'
        : (process.env.FSM_APP_URL || FSM_APP_URL.value())

      const actionCodeSettings = {
        url: `${fsmAppUrl}/login?onboarding=true`,
        handleCodeInApp: true,
      }

      const magicLink = await auth.generateSignInWithEmailLink(email, actionCodeSettings)

      const emailConfig = {
        resendApiKey: RESEND_API_KEY.value(),
        ownerEmail: OWNER_EMAIL.value(),
        fromEmail: process.env.FROM_EMAIL || 'Fresh Nest Co. <noreply@freshnestco.ca>',
      }

      await sendWelcomeEmail(data.firstName.trim(), email, magicLink, data.language as 'en' | 'fr', emailConfig)
      const sentAt = Timestamp.now()
      await staffRef.update({ welcomeEmailSentAt: sentAt })
      logger.info(`[onStaffRegistered] Welcome email sent to ${email} and welcomeEmailSentAt updated.`)
    } catch (err) {
      logger.error(`[onStaffRegistered] Failed to send welcome email to ${email}:`, err)
      Sentry.captureException(err, { tags: { function: 'onStaffRegistered' } })
    }

    return { uid, email }
  }
)

export const resendWelcomeEmail = onCall(
  {
    secrets: [RESEND_API_KEY, OWNER_EMAIL, FSM_APP_URL],
  },
  async (request) => {
    const authContext = request.auth
    if (!authContext) {
      throw new HttpsError('unauthenticated', 'Must be authenticated.')
    }

    const db = getFirestore()
    const auth = getAuth()

    // Admin-only gate
    let isAuthorized = authContext.token.role === 'admin'
    if (!isAuthorized && authContext.token.email) {
      const adminSnap = await db
        .collection('admins')
        .doc(authContext.token.email.trim().toLowerCase())
        .get()
      if (adminSnap.exists) isAuthorized = true
    }
    if (!isAuthorized) {
      throw new HttpsError('permission-denied', 'Only administrators can resend welcome emails.')
    }

    const { uid } = request.data as { uid?: string }
    if (!uid?.trim()) {
      throw new HttpsError('invalid-argument', 'uid is required.')
    }

    const staffRef = db.collection('staff').doc(uid)
    const staffSnap = await staffRef.get()
    if (!staffSnap.exists) {
      throw new HttpsError('not-found', `Staff member with uid ${uid} not found.`)
    }

    const data = staffSnap.data()!
    const email = data.email
    const firstName = data.firstName
    const language = data.preferences?.language || 'en'

    try {
      const fsmAppUrl = process.env.FUNCTIONS_EMULATOR
        ? 'http://localhost:5174'
        : (process.env.FSM_APP_URL || FSM_APP_URL.value())

      const actionCodeSettings = {
        url: `${fsmAppUrl}/login?onboarding=true`,
        handleCodeInApp: true,
      }

      const magicLink = await auth.generateSignInWithEmailLink(email, actionCodeSettings)

      const emailConfig = {
        resendApiKey: RESEND_API_KEY.value(),
        ownerEmail: OWNER_EMAIL.value(),
        fromEmail: process.env.FROM_EMAIL || 'Fresh Nest Co. <noreply@freshnestco.ca>',
      }

      await sendWelcomeEmail(firstName, email, magicLink, language as 'en' | 'fr', emailConfig)
      const sentAt = Timestamp.now()
      await staffRef.update({ welcomeEmailSentAt: sentAt })
      logger.info(`[resendWelcomeEmail] Welcome email re-sent successfully to ${email} for uid=${uid}`)
      return { success: true, sentAt: sentAt.toDate().toISOString() }
    } catch (err: any) {
      logger.error(`[resendWelcomeEmail] Failed to resend welcome email to ${email}:`, err)
      Sentry.captureException(err, { tags: { function: 'resendWelcomeEmail' } })
      throw new HttpsError('internal', `Failed to send welcome email: ${err.message || err}`)
    }
  }
)

// P3-E27-B2: Employee submits background check consent (server-observed timestamp + IP).
// backgroundCheck stays closed to all direct client writes in firestore.rules — this is
// the only path an employee has to set consentGiven, matching the A2 pattern for staff docs.
export const submitBackgroundCheckConsent = onCall(async (request) => {
  const authContext = request.auth
  if (!authContext) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.')
  }

  const db = getFirestore()
  const uid = authContext.uid

  const staffRef = db.collection('staff').doc(uid)
  const staffSnap = await staffRef.get()
  if (!staffSnap.exists) {
    throw new HttpsError('not-found', 'Staff profile not found.')
  }

  const existing = staffSnap.data()!.backgroundCheck
  if (existing?.consentGiven === true) {
    // Idempotent — already consented, nothing to do.
    return { consentGiven: true, consentGivenAt: existing.consentGivenAt?.toDate?.().toISOString() ?? null }
  }

  // request.rawRequest.ip reflects the nearest proxy/CDN hop under Firebase Hosting rewrites,
  // not necessarily the employee's raw client IP — acceptable for consent-audit purposes,
  // same precision class as the ipify.org lookup TermsConsentOverlay uses client-side.
  const ipAddress = request.rawRequest?.ip || null
  const consentGivenAt = Timestamp.now()

  await staffRef.update({
    'backgroundCheck.consentGiven': true,
    'backgroundCheck.consentGivenAt': consentGivenAt,
    'backgroundCheck.consentIpAddress': ipAddress,
    'backgroundCheck.status': 'pending',
  })

  logger.info(`[submitBackgroundCheckConsent] Consent recorded for staff/${uid}`)

  return { consentGiven: true, consentGivenAt: consentGivenAt.toDate().toISOString() }
})

// P3-E27-B2: Admin updates background check status/provider/notes; writes an auditLog entry.
export const updateBackgroundCheckStatus = onCall(async (request) => {
  const authContext = request.auth
  if (!authContext) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.')
  }

  const db = getFirestore()

  let isAuthorized = authContext.token.role === 'admin'
  if (!isAuthorized && authContext.token.email) {
    const adminSnap = await db
      .collection('admins')
      .doc(authContext.token.email.trim().toLowerCase())
      .get()
    if (adminSnap.exists) isAuthorized = true
  }
  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Only administrators can update background check status.')
  }

  const data = request.data as { uid?: string; status?: string; provider?: string; notes?: string }
  const VALID_STATUSES = ['not_started', 'pending', 'cleared', 'flagged']

  if (!data.uid?.trim()) throw new HttpsError('invalid-argument', 'uid is required.')
  if (!data.status || !VALID_STATUSES.includes(data.status)) {
    throw new HttpsError('invalid-argument', 'status must be not_started, pending, cleared, or flagged.')
  }

  const staffRef = db.collection('staff').doc(data.uid)
  const staffSnap = await staffRef.get()
  if (!staffSnap.exists) {
    throw new HttpsError('not-found', `Staff member with uid ${data.uid} not found.`)
  }

  const previous = staffSnap.data()!.backgroundCheck ?? {}
  const completedAt = data.status === 'cleared' || data.status === 'flagged' ? Timestamp.now() : (previous.completedAt ?? null)

  const update: Record<string, unknown> = {
    'backgroundCheck.status': data.status,
    'backgroundCheck.completedAt': completedAt,
  }
  if (data.provider !== undefined) update['backgroundCheck.provider'] = data.provider
  if (data.notes !== undefined) update['backgroundCheck.notes'] = data.notes

  await staffRef.update(update)

  await db.collection('auditLog').add({
    collection: 'staff',
    documentId: data.uid,
    field: 'backgroundCheck',
    oldValue: { status: previous.status ?? 'not_started', provider: previous.provider ?? null, notes: previous.notes ?? null },
    newValue: { status: data.status, provider: data.provider ?? previous.provider ?? null, notes: data.notes ?? previous.notes ?? null },
    changedBy: authContext.token.email || authContext.uid,
    changedAt: Timestamp.now(),
    reason: null,
    overrideType: 'background_check_status_update',
  })

  logger.info(`[updateBackgroundCheckStatus] staff/${data.uid} backgroundCheck.status -> ${data.status}`)

  return { success: true }
})

// P3-E27-C3: Employee marks a training module complete (comprehension check already
// verified client-side). onboardingChecklist stays closed to direct client writes —
// same reasoning as B2's backgroundCheck — so this callable is the only write path,
// keeping room for D1's future admin-only checklist fields in the same map.
const TRAINING_MODULE_IDS = [
  'module1Welcome',
  'module2AppTraining',
  'module3CleaningTechniques',
  'module4Whmis',
  'module5ClientStandards',
  'module6EmergencyProcedures',
] as const

export const completeTrainingModule = onCall(async (request) => {
  const authContext = request.auth
  if (!authContext) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.')
  }

  const { moduleId } = request.data as { moduleId?: string }
  if (!moduleId || !TRAINING_MODULE_IDS.includes(moduleId as (typeof TRAINING_MODULE_IDS)[number])) {
    throw new HttpsError('invalid-argument', 'moduleId must be one of the six known training modules.')
  }

  const db = getFirestore()
  const uid = authContext.uid
  const staffRef = db.collection('staff').doc(uid)
  const staffSnap = await staffRef.get()
  if (!staffSnap.exists) {
    throw new HttpsError('not-found', 'Staff profile not found.')
  }

  const checklist = staffSnap.data()!.onboardingChecklist || {}
  const update: Record<string, boolean> = {
    [`onboardingChecklist.${moduleId}`]: true,
  }

  const allOtherModulesComplete = TRAINING_MODULE_IDS
    .filter((id) => id !== moduleId)
    .every((id) => checklist[id] === true)
  if (allOtherModulesComplete) {
    update['onboardingChecklist.platformTrainingCompleted'] = true
  }

  await staffRef.update(update)

  logger.info(`[completeTrainingModule] staff/${uid} completed ${moduleId}`)

  return { success: true, moduleId }
})

// P3-E27-A1: One-shot PIPEDA compliance migration
// DELETE AFTER P3-E27-A1 MIGRATION IS CONFIRMED IN PRODUCTION.
export const migrateComplianceRecords = onCall(async (request) => {
  const authContext = request.auth
  if (!authContext) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.')
  }

  const db = getFirestore()

  let isAuthorized = authContext.token.role === 'admin'
  if (!isAuthorized && authContext.token.email) {
    const adminSnap = await db
      .collection('admins')
      .doc(authContext.token.email.trim().toLowerCase())
      .get()
    if (adminSnap.exists) isAuthorized = true
  }
  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Only administrators can run this migration.')
  }

  const staffSnap = await db.collection('staff').get()
  let patched = 0
  let skipped = 0
  const batch = db.batch()
  const auditBatch = db.batch()

  for (const staffDoc of staffSnap.docs) {
    const data = staffDoc.data()
    const currentVersion = data.compliance?.acceptedTermsVersion ?? null

    if (currentVersion === null) {
      skipped++
      continue
    }

    batch.update(staffDoc.ref, {
      'compliance.acceptedTermsVersion': null,
      'compliance.termsHistory': [],
    })

    const auditRef = db.collection('auditLog').doc()
    auditBatch.set(auditRef, {
      collection: 'staff',
      documentId: staffDoc.id,
      field: 'compliance',
      oldValue: { acceptedTermsVersion: currentVersion, termsHistory: data.compliance?.termsHistory ?? [] },
      newValue: { acceptedTermsVersion: null, termsHistory: [] },
      changedBy: 'P3-E27-A1-migration',
      changedAt: Timestamp.now(),
      reason: 'PIPEDA false-consent remediation — acceptedTermsVersion was written by admin at registration before employee saw or agreed to anything.',
      overrideType: 'compliance_migration',
    })

    patched++
  }

  await batch.commit()
  await auditBatch.commit()

  const summary = { patched, skipped, total: staffSnap.size }
  logger.info('[migrateComplianceRecords] P3-E27-A1 migration complete', summary)
  Sentry.captureMessage('[P3-E27-A1] migrateComplianceRecords completed', {
    level: 'info',
    extra: summary,
  })

  return summary
})
