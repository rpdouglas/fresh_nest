import { getFirestore, FieldValue } from 'firebase-admin/firestore'

/**
 * F03: Booking-to-Job Pipeline
 *
 * Creates a Job document in /jobs from a confirmed booking.
 * Called by onBookingStatusConfirmed in index.ts.
 *
 * Design decisions (per F03 planning):
 * - Resolves payRateSnapshot by querying payRates for the active 'cleaner' role rate
 * - Falls back to null/zero placeholder if no rate exists (graceful — no crash)
 * - Resolves checklistTemplate by matching serviceType; falls back to first active template
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
 * Resolves the checklist template for the given serviceType.
 * Falls back to the first active template if none matches serviceType.
 */
async function resolveChecklistTemplate(
  db: FirebaseFirestore.Firestore,
  serviceType: string,
): Promise<string> {
  try {
    // Primary: match by serviceType
    const matchSnap = await db
      .collection('checklistTemplates')
      .where('serviceType', '==', serviceType)
      .where('active', '==', true)
      .limit(1)
      .get()

    if (!matchSnap.empty) {
      return matchSnap.docs[0].id
    }

    // Fallback: first active template regardless of serviceType
    const fallbackSnap = await db
      .collection('checklistTemplates')
      .where('active', '==', true)
      .limit(1)
      .get()

    if (!fallbackSnap.empty) {
      console.log(
        `[resolveChecklistTemplate] No template for serviceType '${serviceType}' — using fallback template '${fallbackSnap.docs[0].id}'`,
      )
      return fallbackSnap.docs[0].id
    }
  } catch (err) {
    console.warn('[resolveChecklistTemplate] Could not query checklistTemplates:', err)
  }

  // Ultimate fallback — empty string signals no template resolved
  console.warn('[resolveChecklistTemplate] No checklist templates found — job created without template reference.')
  return ''
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

  // Resolve payRateSnapshot and checklistTemplate concurrently
  const [payRateSnapshot, checklistTemplate] = await Promise.all([
    resolvePayRateSnapshot(db),
    resolveChecklistTemplate(db, booking.serviceType),
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
    checklistTemplate,
    checklistCompletions: [],
    photos: [],
    createdAt: now,
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

/**
 * F06 Helpers: Time parsing, postal code FSA extraction, and conflict checking logic.
 */
export function timeToMinutes(timeStr: string): number {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  } catch {
    return 0
  }
}

export function extractPostalPrefix(address: string): string | null {
  if (!address) return null
  const match = address.match(/([A-Za-z]\d[A-Za-z])/i)
  return match ? match[1].toUpperCase() : null
}

export interface TravelShift {
  startTime: string
  endTime: string
  address: string
}

export function hasTravelConflict(
  candidate: TravelShift,
  existing: TravelShift,
  bufferMinutes: number
): boolean {
  const startC = timeToMinutes(candidate.startTime)
  const endC = timeToMinutes(candidate.endTime)
  const startA = timeToMinutes(existing.startTime)
  const endA = timeToMinutes(existing.endTime)

  // 1. Direct overlap check
  if (startC < endA && endC > startA) {
    return true
  }

  // 2. Waive buffer if they share the same postal prefix
  const fsaC = extractPostalPrefix(candidate.address)
  const fsaA = extractPostalPrefix(existing.address)
  if (fsaC && fsaA && fsaC === fsaA) {
    return false
  }

  // 3. Buffer check
  if (endC <= startA) {
    const gap = startA - endC
    if (gap < bufferMinutes) {
      return true
    }
  } else if (endA <= startC) {
    const gap = startC - endA
    if (gap < bufferMinutes) {
      return true
    }
  }

  return false
}

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
      // Get duration
      let durationHours = 2 // default fallback
      try {
        const [startH, startM] = jobData.scheduledStartTime.split(':').map(Number)
        const [endH, endM] = jobData.scheduledEndTime.split(':').map(Number)
        const diff = (endH + endM / 60) - (startH + startM / 60)
        if (diff > 0) durationHours = diff
      } catch (err) {
        console.warn('Error parsing times for job:', jobId, err)
      }

      const estimatedShiftPay = payRate * durationHours

      // Earnings cap check
      const monthlyEarningsLimit = staffData.financials?.monthlyEarningsLimit ?? null
      const currentMonthEarnings = staffData.financials?.currentMonthEarnings ?? 0

      if (monthlyEarningsLimit !== null && monthlyEarningsLimit !== undefined) {
        const remaining = monthlyEarningsLimit - currentMonthEarnings
        if (estimatedShiftPay > remaining) {
          throw new Error('EARNINGS_CAP_EXCEEDED')
        }
      }

      // Travel buffer check
      const constraints = staffData.constraints || {}
      const transportMode = constraints.transportMode || 'transit'
      const defaultBuffer = transportMode === 'transit' ? 60 : 30
      const bufferMinutes = typeof constraints.transitBufferMinutes === 'number'
        ? constraints.transitBufferMinutes
        : defaultBuffer

      // Query active jobs assigned to this cleaner on the same scheduledDate
      const queryRef = db.collection('jobs')
        .where('assignedTo', '==', staffId)
        .where('scheduledDate', '==', jobData.scheduledDate)

      const querySnap = await transaction.get(queryRef)
      const existingActiveJobs = querySnap.docs
        .map((d) => d.data())
        .filter((j) => j.status !== 'cancelled')

      const candidateShift: TravelShift = {
        startTime: jobData.scheduledStartTime,
        endTime: jobData.scheduledEndTime,
        address: jobData.clientAddress,
      }

      for (const j of existingActiveJobs) {
        const existingShift: TravelShift = {
          startTime: j.scheduledStartTime,
          endTime: j.scheduledEndTime,
          address: j.clientAddress,
        }
        if (hasTravelConflict(candidateShift, existingShift, bufferMinutes)) {
          throw new Error('TRAVEL_BUFFER_EXCEEDED')
        }
      }

      // Perform updates
      transaction.update(jobRef, {
        status: 'assigned',
        assignedTo: staffId,
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
export async function rollOverAllStaffEarnings(): Promise<void> {
  const db = getFirestore('(default)')
  const lastMonth = new Date()
  lastMonth.setUTCDate(1)
  lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1)
  const lastMonthStr = `${lastMonth.getUTCFullYear()}-${String(lastMonth.getUTCMonth() + 1).padStart(2, '0')}`

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

