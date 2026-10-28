import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import {
  estimateShiftPay,
  earningsOverage,
  overlapsBlockedWindow,
  resolveBufferMinutes,
  findTravelConflict,
  type TravelShift,
} from './lib/eligibility'
import { snapshotFromTemplate, EMPTY_CHECKLIST, type ChecklistSnapshot } from './lib/checklist'
import { normalizePolicySettings } from './shared/policy'
import { serverStamp } from './lib/audit'
import { monthKey, previousMonthKey } from './shared/time'

/**
 * F03: Booking-to-Job Pipeline
 *
 * Creates a Job document in /jobs from a confirmed booking.
 * Called by onBookingStatusConfirmed in index.ts.
 *
 * Design decisions (per F03 planning):
 * - Resolves payRateSnapshot by querying payRates for the active 'cleaner' role rate
 * - Falls back to null/zero placeholder if no rate exists (graceful — no crash)
 * - Resolves the checklist from booking.checklistTemplateId, else by serviceType, else the first
 *   active template, and copies its tasks onto the job (P3-E34)
 * - Uses db.runTransaction() to atomically create job + write jobId back to booking
 * - Duplicate guard: query for existing job with bookingId before creating
 */

interface PayRateSnapshot {
  rateId: string | null
  amount: number
  currency: 'CAD'
  effectiveAt: string
  snapshotAt: string
}

interface BookingData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  serviceType: string
  preferredDate: string
  notes?: string
  status: string
  jobId?: string
  checklistTemplateId?: string | null
  [key: string]: unknown
}

/**
 * Resolves the active pay rate for the cleaner role.
 * Falls back gracefully to a null/zero placeholder if no rate exists.
 */
async function resolvePayRateSnapshot(db: FirebaseFirestore.Firestore): Promise<PayRateSnapshot> {
  const now = new Date().toISOString()
  try {
    const ratesSnap = await db
      .collection('payRates')
      .where('role', '==', 'cleaner')
      .where('effectiveTo', '==', null)
      .orderBy('effectiveFrom', 'desc')
      .limit(1)
      .get()

    if (!ratesSnap.empty) {
      const rateDoc = ratesSnap.docs[0]
      const rate = rateDoc.data()
      return {
        rateId: rateDoc.id,
        amount: rate.amount as number,
        currency: 'CAD',
        effectiveAt: (rate.effectiveFrom as FirebaseFirestore.Timestamp).toDate().toISOString(),
        snapshotAt: now,
      }
    }
  } catch (err) {
    console.warn('[resolvePayRateSnapshot] Could not query payRates (collection may not exist yet):', err)
  }

  // Graceful fallback — no crash when payRates collection doesn't exist yet
  console.log('[resolvePayRateSnapshot] No active cleaner rate found — using null placeholder.')
  return {
    rateId: null,
    amount: 0,
    currency: 'CAD',
    effectiveAt: now,
    snapshotAt: now,
  }
}

/**
 * Resolves the checklist for a new job and copies its tasks (P3-E34).
 * Uses the booking's chosen saved list when it still exists; otherwise matches by
 * serviceType, then falls back to the first active template.
 */
export async function resolveChecklist(
  db: FirebaseFirestore.Firestore,
  serviceType: string,
  chosenTemplateId: string | null,
): Promise<ChecklistSnapshot> {
  try {
    if (chosenTemplateId) {
      const chosen = await db.collection('checklistTemplates').doc(chosenTemplateId).get()
      if (chosen.exists) {
        return snapshotFromTemplate(chosen.id, chosen.data() ?? {}, 'template')
      }
      console.warn(
        `[resolveChecklist] Chosen template '${chosenTemplateId}' no longer exists — matching by serviceType.`,
      )
    }

    // Primary: match by serviceType
    const matchSnap = await db
      .collection('checklistTemplates')
      .where('serviceType', '==', serviceType)
      .where('active', '==', true)
      .limit(1)
      .get()

    if (!matchSnap.empty) {
      return snapshotFromTemplate(matchSnap.docs[0].id, matchSnap.docs[0].data(), 'auto')
    }

    // Fallback: first active template regardless of serviceType
    const fallbackSnap = await db
      .collection('checklistTemplates')
      .where('active', '==', true)
      .limit(1)
      .get()

    if (!fallbackSnap.empty) {
      console.log(
        `[resolveChecklist] No template for serviceType '${serviceType}' — using fallback template '${fallbackSnap.docs[0].id}'`,
      )
      return snapshotFromTemplate(fallbackSnap.docs[0].id, fallbackSnap.docs[0].data(), 'auto')
    }
  } catch (err) {
    console.warn('[resolveChecklist] Could not query checklistTemplates:', err)
  }

  // Ultimate fallback — empty checklist, no template reference
  console.warn('[resolveChecklist] No checklist templates found — job created without a checklist.')
  return EMPTY_CHECKLIST
}

/**
 * Main export: creates a Job from a confirmed booking.
 *
 * @param bookingId  - Firestore document ID of the booking
 * @param booking    - Booking document data
 */
export async function createJobFromBooking(
  bookingId: string,
  booking: BookingData,
): Promise<void> {
  const db = getFirestore('(default)')

  // Duplicate guard: check if a job already exists for this bookingId
  const existingJobsSnap = await db
    .collection('jobs')
    .where('bookingId', '==', bookingId)
    .limit(1)
    .get()

  if (!existingJobsSnap.empty) {
    console.log(
      `[createJobFromBooking] Job already exists for bookingId '${bookingId}' (jobId: '${existingJobsSnap.docs[0].id}'). Skipping.`,
    )
    return
  }

  // Resolve payRateSnapshot and checklist concurrently
  const [payRateSnapshot, checklist] = await Promise.all([
    resolvePayRateSnapshot(db),
    resolveChecklist(db, booking.serviceType, booking.checklistTemplateId ?? null),
  ])

  const clientName = `${booking.firstName} ${booking.lastName}`.trim()
  const now = FieldValue.serverTimestamp()

  // Derive scheduled times — booking only has preferredDate (YYYY-MM-DD)
  // Default to 09:00-11:00 placeholder; F08 (shift claiming) will assign real times
  const scheduledDate = booking.preferredDate ?? ''
  const scheduledStartTime = '09:00'
  const scheduledEndTime = '11:00'

  const jobData = {
    bookingId,
    clientName,
    clientAddress: booking.address,
    clientPhone: booking.phone,
    clientNotes: booking.notes ?? '',
    serviceType: booking.serviceType,
    scheduledDate,
    scheduledStartTime,
    scheduledEndTime,
    status: 'unassigned',
    assignedTo: null,
    checkedInAt: null,
    checkedInGeo: null,
    completedAt: null,
    payRateSnapshot,
    ...checklist,
    checklistCompletions: [],
    photos: [],
    createdAt: now,
    lastChange: serverStamp('createJobFromBooking'),
  }

  // Atomic transaction: create job + write jobId back to booking
  await db.runTransaction(async (transaction) => {
    const jobRef = db.collection('jobs').doc()
    const bookingRef = db.collection('bookings').doc(bookingId)

    transaction.set(jobRef, jobData)
    transaction.update(bookingRef, { jobId: jobRef.id })

    console.log(
      `[createJobFromBooking] Transaction: creating job '${jobRef.id}' for booking '${bookingId}'`,
    )
  })

  console.log(`[createJobFromBooking] Successfully created job for booking '${bookingId}'`)
}

// F06 helpers moved to lib/eligibility.ts (HOTFIX-02) — re-exported for existing importers.
export { timeToMinutes, extractPostalPrefix, hasTravelConflict } from './lib/eligibility'
export type { TravelShift } from './lib/eligibility'

/**
 * F05: Transactional Claim Job Logic
 *
 * @param staffId - The UID of the claiming cleaner
 * @param jobId   - The Firestore document ID of the job
 */
export async function executeClaimJob(
  staffId: string,
  jobId: string,
): Promise<{ success: boolean; newEarnings: number }> {
  const db = getFirestore('(default)')

  try {
    const result = await db.runTransaction(async (transaction) => {
      const jobRef = db.collection('jobs').doc(jobId)
      const jobSnap = await transaction.get(jobRef)

      if (!jobSnap.exists) {
        throw new Error('JOB_NOT_FOUND')
      }

      const jobData = jobSnap.data()!
      if (jobData.status !== 'unassigned' || jobData.assignedTo !== null) {
        throw new Error('JOB_ALREADY_ASSIGNED')
      }

      // Read staff profile
      const staffRef = db.collection('staff').doc(staffId)
      const staffSnap = await transaction.get(staffRef)

      if (!staffSnap.exists) {
        throw new Error('STAFF_PROFILE_NOT_FOUND')
      }

      const staffData = staffSnap.data()!
      if (staffData.status !== 'active') {
        throw new Error('STAFF_INACTIVE')
      }

      // Calculate shift pay
      const payRate = jobData.payRateSnapshot?.amount || 0
      const estimatedShiftPay = estimateShiftPay(payRate, jobData.scheduledStartTime, jobData.scheduledEndTime)

      // Earnings cap check
      const monthlyEarningsLimit = staffData.financials?.monthlyEarningsLimit ?? null
      const currentMonthEarnings = staffData.financials?.currentMonthEarnings ?? 0

      if (earningsOverage(estimatedShiftPay, monthlyEarningsLimit, currentMonthEarnings) > 0) {
        throw new Error('EARNINGS_CAP_EXCEEDED')
      }

      // Blocked windows check
      const constraints = staffData.constraints || {}
      const blockedWindows = constraints.blockedWindows || []
      if (overlapsBlockedWindow(jobData.scheduledDate, jobData.scheduledStartTime, jobData.scheduledEndTime, blockedWindows)) {
        throw new Error('BLOCKED_WINDOW_OVERLAP')
      }

      // Travel buffer check (P3-E36 / W0-2: read settings/policy default travel buffers with fallback)
      const policyRef = db.collection('settings').doc('policy')
      const policySnap = await transaction.get(policyRef).catch(() => null)
      const policy = normalizePolicySettings(
        policySnap && policySnap.exists ? (policySnap.data() as Record<string, unknown>) : undefined,
      )
      const bufferMinutes = resolveBufferMinutes(constraints, policy)

      // Query active jobs assigned to this cleaner on the same scheduledDate
      const queryRef = db.collection('jobs')
        .where('assignedTo', '==', staffId)
        .where('scheduledDate', '==', jobData.scheduledDate)

      const querySnap = await transaction.get(queryRef)
      const existingShifts: TravelShift[] = querySnap.docs
        .map((d) => d.data())
        .filter((j) => j.status !== 'cancelled')
        .map((j) => ({ startTime: j.scheduledStartTime, endTime: j.scheduledEndTime, address: j.clientAddress }))

      const candidateShift: TravelShift = {
        startTime: jobData.scheduledStartTime,
        endTime: jobData.scheduledEndTime,
        address: jobData.clientAddress,
      }

      if (findTravelConflict(candidateShift, existingShifts, bufferMinutes)) {
        throw new Error('TRAVEL_BUFFER_EXCEEDED')
      }

      // Perform updates
      transaction.update(jobRef, {
        status: 'assigned',
        assignedTo: staffId,
        // P3-E37: the claiming cleaner is the actor (Shift Board).
        lastChange: serverStamp(typeof staffData.email === 'string' && staffData.email ? staffData.email : `claimJob:${staffId}`),
      })

      transaction.update(staffRef, {
        'financials.currentMonthEarnings': currentMonthEarnings + estimatedShiftPay,
      })

      return { success: true, newEarnings: currentMonthEarnings + estimatedShiftPay }
    })

    return result
  } catch (err) {
    throw err
  }
}

/**
 * F05: Earnings Cap Monthly Rollover
 * Resets currentMonthEarnings to 0 and archives past month's earnings.
 */
export async function rollOverAllStaffEarnings(now: Date = new Date()): Promise<void> {
  const db = getFirestore('(default)')
  // Runs just after midnight on the 1st (Toronto): the month being archived is the previous one.
  const lastMonthStr = previousMonthKey(monthKey(now))

  const staffSnap = await db.collection('staff').get()
  if (staffSnap.empty) {
    console.log('[rollOverAllStaffEarnings] No staff members found to rollover.')
    return
  }

  const batch = db.batch()
  let rolloverCount = 0

  staffSnap.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const currentMonthEarnings = data.financials?.currentMonthEarnings ?? 0
    const earningsHistory = data.financials?.earningsHistory ?? []

    const newHistory = [...earningsHistory, { month: lastMonthStr, total: currentMonthEarnings }]

    batch.update(docSnap.ref, {
      'financials.currentMonthEarnings': 0,
      'financials.earningsHistory': newHistory,
    })
    rolloverCount++
  })

  if (rolloverCount > 0) {
    await batch.commit()
  }
  console.log(`[rollOverAllStaffEarnings] Successfully rolled over earnings for ${rolloverCount} staff member(s) to month ${lastMonthStr}`)
}

