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
