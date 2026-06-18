import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp, AggregateField, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import * as functionsV1 from 'firebase-functions/v1'
import { defineSecret } from 'firebase-functions/params'
import { sendOwnerNotification, sendClientConfirmation, sendReviewRequestEmail } from './sendEmail'
import { sendSmsConfirmation, sendSmsReminder, sendOnMyWaySms } from './sendSms'
import type { BookingData } from './emailTemplates'
import { createJobFromBooking, executeClaimJob, rollOverAllStaffEarnings } from './jobs'
import { notifyStaffMember, notifyAllActiveStaff } from './notifications'

initializeApp()

const RESEND_API_KEY       = defineSecret('RESEND_API_KEY')
const OWNER_EMAIL          = defineSecret('OWNER_EMAIL')
const TWILIO_ACCOUNT_SID   = defineSecret('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN    = defineSecret('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER  = defineSecret('TWILIO_PHONE_NUMBER')

export const onBookingCreated = onDocumentCreated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
    secrets:  [RESEND_API_KEY, OWNER_EMAIL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const booking = event.data?.data() as BookingData | undefined
    if (!booking) return

    // E31: Generate referral code and write to referrals collection
    const firstName = booking.firstName || 'CLIENT'
    const docId = event.params['docId']
    const refCode = `${firstName.trim().toUpperCase()}-${docId.substring(0, 4).toUpperCase()}`

    if (!booking.referralCode) {
      const db = getFirestore()
      try {
        await db.collection('referrals').doc(refCode).set({
          ownerName: `${booking.firstName} ${booking.lastName ? booking.lastName.charAt(0) + '.' : ''}`,
          bookingId: docId,
          active: true,
          createdAt: new Date(),
        })
        await db.collection('bookings').doc(docId).update({ referralCode: refCode })
        booking.referralCode = refCode
      } catch (err) {
        console.error('[onBookingCreated] Failed to generate referral code:', err)
      }
    }

    const emailConfig = {
      resendApiKey: RESEND_API_KEY.value(),
      ownerEmail:   OWNER_EMAIL.value(),
      fromEmail:    process.env['FROM_EMAIL'] ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
    }

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken:  TWILIO_AUTH_TOKEN.value(),
      fromNumber: TWILIO_PHONE_NUMBER.value(),
    }

    const results = await Promise.allSettled([
      sendOwnerNotification(booking, event.params['docId'], emailConfig),
      sendClientConfirmation(booking, emailConfig),
      sendSmsConfirmation(booking, smsConfig),
    ])

    const labels = ['owner email', 'client email', 'client SMS']
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[onBookingCreated] ${labels[i]} failed:`, result.reason)
      }
    })
  },
)

export const onDailyReminderCheck = onSchedule(
  {
    schedule: '0 13 * * *',
    timeZone: 'UTC',
    secrets:  [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async () => {
    // Explicitly target the production database — we never send SMS reminders for test bookings
    // in freshnest-dev. This is intentional. See docs/firestore-schema.md for DB architecture.
    const db = getFirestore('(default)')

    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)

    const snapshot = await db
      .collection('bookings')
      .where('preferredDate', '==', tomorrowStr)
      .where('status', 'in', ['pending', 'confirmed'])
      .get()

    if (snapshot.empty) {
      console.log(`[onDailyReminderCheck] No reminders for ${tomorrowStr}`)
      return
    }

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken:  TWILIO_AUTH_TOKEN.value(),
      fromNumber: TWILIO_PHONE_NUMBER.value(),
    }

    const results = await Promise.allSettled(
      snapshot.docs.map(doc => {
        const d = doc.data()
        return sendSmsReminder(
          d['phone'] as string,
          d['language'] as string,
          d['preferredDate'] as string,
          smsConfig,
        )
      }),
    )

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[onDailyReminderCheck] doc ${snapshot.docs[i]?.id} failed:`, result.reason)
      }
    })

    console.log(`[onDailyReminderCheck] Processed ${snapshot.size} reminder(s) for ${tomorrowStr}`)
  },
)

export const onDailyRecurringRenewal = onSchedule(
  {
    schedule: '0 2 * * *', // Run at 2 AM every day
    timeZone: 'UTC',
  },
  async () => {
    const db = getFirestore('(default)')
    const today = new Date()
    const fourteenDaysOut = new Date()
    fourteenDaysOut.setUTCDate(fourteenDaysOut.getUTCDate() + 14)
    const fourteenDaysOutStr = fourteenDaysOut.toISOString().slice(0, 10)

    console.log(`[onDailyRecurringRenewal] Running check for date threshold: ${fourteenDaysOutStr}`)

    const snapshot = await db
      .collection('bookings')
      .where('status', 'in', ['confirmed', 'completed'])
      .where('frequency', 'in', ['weekly', 'biweekly', 'monthly'])
      .get()

    if (snapshot.empty) {
      console.log('[onDailyRecurringRenewal] No active recurring bookings found.')
      return
    }

    for (const docSnap of snapshot.docs) {
      const booking = docSnap.data() as BookingData
      const preferredDateStr = booking.preferredDate
      if (!preferredDateStr) continue

      const preferredDate = new Date(preferredDateStr + 'T00:00:00Z')
      let daysToAdd = 7
      if (booking.frequency === 'biweekly') daysToAdd = 14
      if (booking.frequency === 'monthly') daysToAdd = 30

      const nextDate = new Date(preferredDate.getTime())
      nextDate.setUTCDate(nextDate.getUTCDate() + daysToAdd)
      const nextDateStr = nextDate.toISOString().slice(0, 10)

      // Only generate if the next clean is within our 14-day window and is in the future
      const todayStr = today.toISOString().slice(0, 10)
      if (nextDateStr > todayStr && nextDateStr <= fourteenDaysOutStr) {
        // Check if we already created a booking for this client on that next date
        const existingQuery = await db
          .collection('bookings')
          .where('email', '==', booking.email)
          .where('preferredDate', '==', nextDateStr)
          .where('status', '!=', 'cancelled')
          .get()

        if (existingQuery.empty) {
          console.log(`[onDailyRecurringRenewal] Auto-renewing booking for ${booking.email} on date ${nextDateStr}`)
          
          const newBookingData = {
            firstName:         booking.firstName,
            lastName:          booking.lastName,
            email:             booking.email,
            phone:             booking.phone,
            language:          booking.language,
            propertyType:      booking.propertyType,
            bedrooms:          booking.bedrooms,
            bathrooms:         booking.bathrooms,
            squareFootage:     booking.squareFootage || null,
            frequency:         booking.frequency,
            pets:              booking.pets ?? false,
            address:           booking.address,
            serviceType:       booking.serviceType,
            addOns:            booking.addOns || [],
            preferredCleaner:  booking.preferredCleaner || null,
            notes:             booking.notes || '',
            leadSource:        'organic',
            status:            'pending',
            assignedTo:        booking.assignedTo || null,
            isAirbnb:          booking.isAirbnb || false,
            photoConfirmation: booking.photoConfirmation || false,
            createdAt:         new Date(),
          }

          await db.collection('bookings').add(newBookingData)
        }
      }
    }
  },
)

// F03: Booking-to-Job Pipeline
// Fires when a booking document is updated. Creates a Job document when status transitions to 'confirmed'.
export const onBookingStatusConfirmed = onDocumentUpdated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
  },
  async (event) => {
    const before = event.data?.before.data() as { status?: string } | undefined
    const after = event.data?.after.data() as { status?: string; [key: string]: unknown } | undefined

    if (!before || !after) return

    // Guard: only fire when status transitions to 'confirmed'
    if (before.status === 'confirmed' || after.status !== 'confirmed') return

    const bookingId = event.params['docId']
    console.log(`[onBookingStatusConfirmed] Booking '${bookingId}' confirmed — initiating job creation.`)

    try {
      await createJobFromBooking(bookingId, after as Parameters<typeof createJobFromBooking>[1])
    } catch (err) {
      console.error(`[onBookingStatusConfirmed] Failed to create job for booking '${bookingId}':`, err)
    }
  },
)

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
    console.error('[claimJob] Failed to claim job:', err)
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

// F05: Scheduled Earnings Rollover Trigger (1st of month at 12:00 AM UTC)
export const onMonthlyEarningsRollover = onSchedule(
  {
    schedule: '0 0 1 * *',
    timeZone: 'UTC',
  },
  async () => {
    try {
      await rollOverAllStaffEarnings()
    } catch (err) {
      console.error('[onMonthlyEarningsRollover] Rollover failed:', err)
    }
  },
)

// F15: Firestore triggers for job creation (posting to Shift Board)
export const onJobCreatedTrigger = onDocumentCreated(
  {
    document: 'jobs/{docId}',
    database: '(default)',
    secrets:  [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const job = event.data?.data()
    if (!job) return

    const jobId = event.params['docId']
    console.log(`[onJobCreatedTrigger] Job '${jobId}' created (status: ${job.status}).`)

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken:  TWILIO_AUTH_TOKEN.value(),
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
        smsConfig
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
        smsConfig
      )
    }
  },
)

// F15: Firestore triggers for job updates (assignment modifications / cancellations)
export const onJobUpdatedTrigger = onDocumentUpdated(
  {
    document: 'jobs/{docId}',
    database: '(default)',
    secrets:  [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    const jobId = event.params['docId']
    const db = getFirestore('(default)')

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken:  TWILIO_AUTH_TOKEN.value(),
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
          smsConfig
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
          smsConfig
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
            smsConfig
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
          smsConfig
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
          console.error(`[onJobUpdatedTrigger] Failed to retrieve booking '${after.bookingId}':`, err)
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
          console.error(`[onJobUpdatedTrigger] Failed to retrieve staff profile for '${after.assignedTo}':`, err)
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
          console.error(`[onJobUpdatedTrigger] Failed to send SMS check-in alert to customer:`, smsErr)
        }
      } else {
        console.warn(`[onJobUpdatedTrigger] No customer phone number found on job '${jobId}'. Skipping SMS.`)
      }
    }
  },
)

// F12: Firestore trigger for staff profile updates to track audit logs
export const onStaffUpdatedTrigger = onDocumentUpdated(
  {
    document: 'staff/{docId}',
    database: '(default)',
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    const staffId = event.params['docId']
    const db = getFirestore('(default)')

    const beforeCompliance = before.compliance || {}
    const afterCompliance = after.compliance || {}
    const beforeFinancials = before.financials || {}
    const afterFinancials = after.financials || {}

    const auditLogs: any[] = []

    // 1. Terms Version acceptance
    if (beforeCompliance.acceptedTermsVersion !== afterCompliance.acceptedTermsVersion) {
      auditLogs.push({
        collection: 'staff',
        documentId: staffId,
        field: 'compliance.acceptedTermsVersion',
        oldValue: beforeCompliance.acceptedTermsVersion || null,
        newValue: afterCompliance.acceptedTermsVersion || null,
        changedBy: staffId, // The staff member accepted it themselves
        changedAt: new Date(),
        reason: 'Terms of Service accepted',
        overrideType: null,
      })
    }

    // 2. Status change
    if (before.status !== after.status) {
      auditLogs.push({
        collection: 'staff',
        documentId: staffId,
        field: 'status',
        oldValue: before.status || null,
        newValue: after.status || null,
        changedBy: 'admin', // Staff status is only modified by admin
        changedAt: new Date(),
        reason: 'Staff status updated',
        overrideType: null,
      })
    }

    // 3. Role change
    if (before.role !== after.role) {
      auditLogs.push({
        collection: 'staff',
        documentId: staffId,
        field: 'role',
        oldValue: before.role || null,
        newValue: after.role || null,
        changedBy: 'admin', // Role is only modified by admin
        changedAt: new Date(),
        reason: 'Staff role updated',
        overrideType: null,
      })
    }

    // 4. Monthly Earnings Limit change
    if (beforeFinancials.monthlyEarningsLimit !== afterFinancials.monthlyEarningsLimit) {
      auditLogs.push({
        collection: 'staff',
        documentId: staffId,
        field: 'financials.monthlyEarningsLimit',
        oldValue: beforeFinancials.monthlyEarningsLimit === undefined ? null : beforeFinancials.monthlyEarningsLimit,
        newValue: afterFinancials.monthlyEarningsLimit === undefined ? null : afterFinancials.monthlyEarningsLimit,
        changedBy: 'admin', // Earnings limit is only modified by admin
        changedAt: new Date(),
        reason: 'Monthly earnings limit updated',
        overrideType: null,
      })
    }

    // Write all audit logs
    if (auditLogs.length > 0) {
      const batch = db.batch()
      auditLogs.forEach((log) => {
        const docRef = db.collection('auditLog').doc()
        batch.set(docRef, log)
      })
      await batch.commit()
      console.log(`[onStaffUpdatedTrigger] Wrote ${auditLogs.length} audit log entries for staff '${staffId}'.`)
    }
  }
)

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
      if (adminSnap.exists) {
        assignedRole = 'admin'
        console.log(`[onUserCreated] User email matches admins collection. Assigning 'admin' role.`)
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
    const ROLE_PRIORITY: Record<string, number> = { admin: 4, supervisor: 3, staff: 2, customer: 1 }
    const existingRecord = await auth.getUser(uid)
    const existingRole = existingRecord.customClaims?.role as string | undefined
    if (existingRole && (ROLE_PRIORITY[existingRole] ?? 0) > (ROLE_PRIORITY[assignedRole] ?? 0)) {
      console.log(`[onUserCreated] Existing role '${existingRole}' outranks '${assignedRole}'. Preserving existing claim.`)
      assignedRole = existingRole
    }

    await auth.setCustomUserClaims(uid, { role: assignedRole })

    // Also create/merge a customer profile in Firestore
    await db.collection('customers').doc(uid).set({
      email: user.email || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true })
    
    console.log(`[onUserCreated] Successfully set custom claim '${assignedRole}' and customer profile for ${uid}`)
  } catch (err) {
    console.error(`[onUserCreated] Failed to set claims/profile for ${uid}:`, err)
  }
})

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
    console.error(`[setUserRole] Failed to set claims for user ${resolvedUid}:`, err)
    throw new HttpsError('internal', 'Failed to update user custom claims.')
  }
})

// P2-E1: Booking Cancellation Trigger (releasing hold, cancelling job, notifying owner)
export const onBookingCancelled = onDocumentUpdated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
    secrets:  [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    const bookingId = event.params['docId']
    const db = getFirestore()

    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      console.log(`[onBookingCancelled] Booking '${bookingId}' status set to 'cancelled'. Initiating actions.`)

      // 1. Stripe payment hold release (from stripePaymentIntentId)
      const stripePaymentIntentId = after.stripePaymentIntentId
      if (stripePaymentIntentId) {
        console.log(`[onBookingCancelled] Releasing Stripe hold for PaymentIntent: ${stripePaymentIntentId}`)
        try {
          const stripeKey = process.env.STRIPE_SECRET_KEY
          if (stripeKey) {
            const Stripe = require('stripe')
            const stripe = new Stripe(stripeKey)
            await stripe.paymentIntents.cancel(stripePaymentIntentId)
            console.log(`[onBookingCancelled] Stripe PaymentIntent ${stripePaymentIntentId} cancelled.`)
          } else {
            console.warn('[onBookingCancelled] STRIPE_SECRET_KEY is not defined. Skipping Stripe call.')
          }
        } catch (stripeErr) {
          console.error(`[onBookingCancelled] Failed to cancel Stripe PaymentIntent ${stripePaymentIntentId}:`, stripeErr)
        }
      }

      // 2. Cancel associated job
      try {
        const jobsSnap = await db.collection('jobs').where('bookingId', '==', bookingId).limit(1).get()
        if (!jobsSnap.empty) {
          const jobId = jobsSnap.docs[0].id
          console.log(`[onBookingCancelled] Found associated job '${jobId}'. Updating status to 'cancelled'.`)
          await db.collection('jobs').doc(jobId).update({
            status: 'cancelled',
            cancelledAt: new Date()
          })
        }
      } catch (jobErr) {
        console.error(`[onBookingCancelled] Failed to update associated job status:`, jobErr)
      }

      // 3. Send SMS notification to owner/admin
      const smsConfig = {
        accountSid: TWILIO_ACCOUNT_SID.value(),
        authToken:  TWILIO_AUTH_TOKEN.value(),
        fromNumber: TWILIO_PHONE_NUMBER.value(),
      }
      const adminPhone = process.env.OWNER_PHONE || '+16139353555'
      const clientName = `${after.firstName} ${after.lastName}`
      const preferredDate = after.preferredDate
      const smsBody = `Fresh Nest Co. Alert: Booking ${bookingId} for ${clientName} on ${preferredDate} has been cancelled by the customer.`

      try {
        const twilio = require('twilio')
        const client = twilio(smsConfig.accountSid, smsConfig.authToken)
        await client.messages.create({
          body: smsBody,
          from: smsConfig.fromNumber,
          to: adminPhone,
        })
        console.log(`[onBookingCancelled] SMS alert sent to admin: ${adminPhone}`)
      } catch (smsErr) {
        console.error(`[onBookingCancelled] Failed to send SMS alert to admin:`, smsErr)
      }
    }
  }
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
        console.error(`[onJobStatusCompleted] Failed to schedule review for Job '${jobId}':`, err)
      }
    }
  }
)

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
      const snapshot = await db.collection('jobs')
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
          console.error(`[onReviewEmailScheduler] Failed to send review email for Job '${jobId}':`, emailErr)
        }
      }
    } catch (err) {
      console.error('[onReviewEmailScheduler] Scheduler execution failed:', err)
    }
  }
)

function calculateEstimatedPriceFallback(propertyType: string, serviceType: string, frequency: string): number {
  if (propertyType === 'commercial') {
    return 300
  }
  const basePrices: Record<string, { min: number; max: number }> = {
    apartment: { min: 100, max: 130 },
    '1-2bed':  { min: 120, max: 155 },
    '3-4bed':  { min: 160, max: 200 },
    '5+bed':   { min: 210, max: 270 },
  }
  const base = basePrices[propertyType] || { min: 100, max: 130 }

  const multipliers: Record<string, number> = {
    standard:         1.0,
    deep:             1.5,
    moveout:          1.75,
    postconstruction: 2.0,
    airbnb:           0.85,
  }
  const multiplier = multipliers[serviceType] || 1.0

  const discounts: Record<string, number> = {
    'one-time': 0,
    weekly:     0.20,
    biweekly:   0.15,
    monthly:    0.10,
  }
  const discount = discounts[frequency] || 0

  const factor = multiplier * (1 - discount)
  const minPrice = Math.round((base.min * factor) / 5) * 5
  const maxPrice = Math.round((base.max * factor) / 5) * 5

  return (minPrice + maxPrice) / 2
}

export const getAnalyticsKPIs = onCall(async (request) => {
    const auth = request.auth
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be logged in to view analytics.')
    }

    const db = getFirestore()
    let isAuthorized = auth.token.role === 'admin'
    if (!isAuthorized && auth.token.email) {
      const adminSnap = await db.collection('admins').doc(auth.token.email.trim().toLowerCase()).get()
      isAuthorized = adminSnap.exists
    }

    if (!isAuthorized) {
      throw new HttpsError('permission-denied', 'Unauthorized access to analytics dashboard.')
    }

    const timeRange = request.data?.timeRange as string || 'all'
    if (!['all', '30days', '90days', 'ytd', 'month'].includes(timeRange)) {
      throw new HttpsError('invalid-argument', 'Invalid time range parameter.')
    }

    const cacheRef = db.collection('reports').doc(timeRange)
    try {
      const cacheSnap = await cacheRef.get()
      if (cacheSnap.exists) {
        const cacheData = cacheSnap.data()
        if (cacheData && cacheData.expiresAt) {
          const expiresAt = cacheData.expiresAt as Timestamp
          if (expiresAt.toDate() > new Date()) {
            console.log(`[getAnalyticsKPIs] Cache hit for time range: ${timeRange}`)
            return cacheData.data
          }
        }
      }
    } catch (cacheErr) {
      console.warn(`[getAnalyticsKPIs] Failed to read cache for ${timeRange}:`, cacheErr)
    }

    console.log(`[getAnalyticsKPIs] Cache miss for time range: ${timeRange}. Computing analytics...`)

    const now = new Date()
    let startDate: Date | null = null

    if (timeRange === '30days') {
      startDate = new Date()
      startDate.setDate(now.getDate() - 30)
    } else if (timeRange === '90days') {
      startDate = new Date()
      startDate.setDate(now.getDate() - 90)
    } else if (timeRange === 'ytd') {
      startDate = new Date(now.getFullYear(), 0, 1)
    } else if (timeRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    let bookingsQuery = db.collection('bookings')
    if (startDate) {
      bookingsQuery = bookingsQuery.where('createdAt', '>=', Timestamp.fromDate(startDate)) as any
    }

    let totalBookings = 0
    let totalRevenueAgg = 0
    try {
      const aggSnapshot = await bookingsQuery.aggregate({
        count: AggregateField.count(),
        sumRevenue: AggregateField.sum('estimatedPrice')
      }).get()
      
      const aggData = aggSnapshot.data()
      totalBookings = aggData.count || 0
      totalRevenueAgg = aggData.sumRevenue || 0
      console.log(`[getAnalyticsKPIs] Aggregation query: count=${totalBookings}, sumRevenue=${totalRevenueAgg}`)
    } catch (aggErr) {
      console.error('[getAnalyticsKPIs] Aggregation query failed:', aggErr)
    }

    const snapshot = await bookingsQuery.select(
      'leadSource',
      'createdAt',
      'estimatedPrice',
      'referredBy',
      'propertyType',
      'serviceType',
      'frequency'
    ).get()

    let totalRevenue = 0
    let referredBookingsCount = 0

    const leadSourceCounts: Record<string, { count: number; revenue: number }> = {
      organic: { count: 0, revenue: 0 },
      google: { count: 0, revenue: 0 },
      referral: { count: 0, revenue: 0 },
      facebook: { count: 0, revenue: 0 },
      direct: { count: 0, revenue: 0 },
    }

    const monthlyDataMap: Record<string, { monthKey: string; monthName: string; count: number; revenue: number; sortKey: number }> = {}

    snapshot.docs.forEach((docSnap: QueryDocumentSnapshot) => {
      const data = docSnap.data()
      const createdAtTimestamp = data['createdAt'] as Timestamp | undefined
      if (!createdAtTimestamp) return

      const date = createdAtTimestamp.toDate()
      
      let price = data['estimatedPrice'] as number | undefined
      if (price === undefined || price === null) {
        price = calculateEstimatedPriceFallback(
          data['propertyType'] || 'apartment',
          data['serviceType'] || 'standard',
          data['frequency'] || 'one-time'
        )
      }

      totalRevenue += price
      
      if (data['referredBy']) {
        referredBookingsCount++
      }

      const source = data['leadSource'] as string
      if (leadSourceCounts[source]) {
        leadSourceCounts[source].count++
        leadSourceCounts[source].revenue += price
      } else if (source) {
        leadSourceCounts[source] = { count: 1, revenue: price }
      }

      const year = date.getFullYear()
      const month = date.getMonth()
      const sortKey = year * 100 + month
      const monthName = date.toLocaleDateString('en-CA', {
        month: 'short',
        year: 'numeric',
      })
      const key = `${year}-${month}`
      if (!monthlyDataMap[key]) {
        monthlyDataMap[key] = {
          monthKey: key,
          monthName,
          count: 0,
          revenue: 0,
          sortKey,
        }
      }
      monthlyDataMap[key].count += 1
      monthlyDataMap[key].revenue += price
    })

    const leadSourceData = Object.entries(leadSourceCounts).map(([key, val]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: val.count,
      revenue: val.revenue,
      key,
    })).filter(item => item.value > 0)

    const monthlyTrendData = Object.values(monthlyDataMap).sort((a, b) => a.sortKey - b.sortKey)

    const analyticsTotalBookings = snapshot.size
    const channelsPerformance = Object.entries(leadSourceCounts).map(([source, val]) => {
      const avgValue = val.count > 0 ? val.revenue / val.count : 0
      const share = analyticsTotalBookings > 0 ? (val.count / analyticsTotalBookings) * 100 : 0
      return {
        source,
        name: source.charAt(0).toUpperCase() + source.slice(1),
        volume: val.count,
        revenue: val.revenue,
        avgValue,
        share,
      }
    }).sort((a, b) => b.revenue - a.revenue)

    const analyticsAvgBookingValue = analyticsTotalBookings > 0 ? totalRevenue / analyticsTotalBookings : 0

    const payload = {
      analyticsTotalBookings,
      analyticsTotalRevenue: totalRevenue,
      analyticsAvgBookingValue,
      leadSourceData,
      monthlyTrendData,
      referredBookingsCount,
      channelsPerformance
    }

    const expiresAtDate = new Date()
    expiresAtDate.setHours(expiresAtDate.getHours() + 1)
    
    try {
      await cacheRef.set({
        computedAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAtDate),
        data: payload
      })
    } catch (cacheWriteErr) {
      console.error('[getAnalyticsKPIs] Failed to write cache:', cacheWriteErr)
    }

    return payload
  }
)




