import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  runTransaction,
  where,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import type { BookingFormData, AdminBookingFormData } from '@/lib/schemas/bookingSchema'
import type { Language, Booking, BookingStatus, Job, ChecklistTemplate, PayRate, Review } from '@/types'
import { calculateQuote } from '@/lib/utils/quotePricing'
import type { QuotePropertySize, QuoteServiceType, QuoteFrequency } from '@/lib/utils/quotePricing'


export type LeadSource = 'organic' | 'google' | 'referral' | 'facebook' | 'direct'

export function detectLeadSource(params: URLSearchParams): LeadSource {
  const ref = (params.get('ref') ?? params.get('utm_source') ?? '').toLowerCase()
  const map: Record<string, LeadSource> = {
    google:   'google',
    facebook: 'facebook',
    referral: 'referral',
    direct:   'direct',
  }
  return map[ref] ?? 'organic'
}

export function computeBookingEstimatedPrice(propertyType: string, serviceType: string, frequency: string): number {
  if (propertyType === 'commercial') {
    return 300 // Baseline average for commercial clean estimates
  }
  const sizeMap: Record<string, QuotePropertySize> = {
    apartment: 'apartment',
    '1-2bed': '1-2bed',
    '3-4bed': '3-4bed',
    '5+bed': '5plus',
  }
  const size = sizeMap[propertyType] || 'apartment'
  const validServices = ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb']
  const service = (validServices.includes(serviceType) ? serviceType : 'standard') as QuoteServiceType
  const freq = frequency as QuoteFrequency

  const quote = calculateQuote(size, service, freq)
  if (quote.type === 'range') {
    return (quote.min + quote.max) / 2
  }
  return 150
}

export async function submitBooking(
  data: BookingFormData,
  language: Language,
  source: LeadSource,
  stripePaymentIntentId?: string | null,
): Promise<string> {
  const { marketingConsent, ...formFields } = data

  const estimatedPrice = computeBookingEstimatedPrice(data.propertyType, data.serviceType, data.frequency)

  const docData: Record<string, unknown> = {
    ...formFields,
    language,
    leadSource:        source,
    status:            'pending',
    assignedTo:        null,
    isAirbnb:          data.serviceType === 'airbnb',
    photoConfirmation: data.serviceType === 'airbnb',
    fsmAppointmentId:  null,
    estimatedPrice,
    createdAt:         serverTimestamp(),
  }

  if (stripePaymentIntentId) {
    docData.stripePaymentIntentId = stripePaymentIntentId
    docData.stripeChargeStatus = 'hold'
  }

  if (marketingConsent) {
    docData.marketingConsent = true
    docData.consentTimestamp = Timestamp.now()
    docData.consentMethod    = 'booking-form-v2'
  }

  const cleanDocData = Object.fromEntries(
    Object.entries(docData).filter(([, v]) => v !== undefined),
  )
  const ref = await addDoc(collection(db, 'bookings'), cleanDocData)
  return ref.id
}


export async function createAdminBooking(
  data: AdminBookingFormData,
  adminEmail: string,
): Promise<string> {
  const { marketingConsent, ...formFields } = data

  const estimatedPrice = computeBookingEstimatedPrice(
    data.propertyType,
    data.serviceType,
    data.frequency,
  )

  const docData: Record<string, unknown> = {
    ...formFields,
    assignedTo:        data.assignedTo ?? null,
    isAirbnb:          data.serviceType === 'airbnb',
    photoConfirmation: data.serviceType === 'airbnb',
    fsmAppointmentId:  null,
    estimatedPrice,
    createdBy:         adminEmail,
    createdAt:         serverTimestamp(),
  }

  if (marketingConsent) {
    docData.marketingConsent = true
    docData.consentTimestamp = Timestamp.now()
    docData.consentMethod    = 'booking-form-v2'
  }

  const cleanDocData = Object.fromEntries(
    Object.entries(docData).filter(([, v]) => v !== undefined),
  )
  const ref = await addDoc(collection(db, 'bookings'), cleanDocData)
  return ref.id
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId)
  await updateDoc(docRef, { status })
}

export async function updateBookingAssignment(bookingId: string, cleanerName: string | null): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId)
  await updateDoc(docRef, { assignedTo: cleanerName })
}

export async function assignCleanerTransaction({
  bookingId,
  jobId,
  cleanerId,
  cleanerName,
  oldCleanerId,
  estimatedPay,
  overrideReason = null,
  overrideType = null,
  changedByEmail,
}: {
  bookingId: string
  jobId: string | null
  cleanerId: string | null
  cleanerName: string | null
  oldCleanerId: string | null
  estimatedPay: number
  overrideReason?: string | null
  overrideType?: string | null
  changedByEmail: string
}): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // 1. Booking update
    const bookingRef = doc(db, 'bookings', bookingId)
    transaction.update(bookingRef, { assignedTo: cleanerName })

    // 2. Job update
    if (jobId) {
      const jobRef = doc(db, 'jobs', jobId)
      transaction.update(jobRef, {
        assignedTo: cleanerId,
        status: cleanerId ? 'assigned' : 'unassigned',
      })
    }

    // 3. Increment new cleaner's earnings
    if (cleanerId) {
      const newStaffRef = doc(db, 'staff', cleanerId)
      const newStaffSnap = await transaction.get(newStaffRef)
      if (newStaffSnap.exists()) {
        const staffData = newStaffSnap.data() as { financials?: { currentMonthEarnings?: number } } | undefined
        const financials = staffData?.financials || {}
        const current = financials.currentMonthEarnings ?? 0
        transaction.update(newStaffRef, {
          'financials.currentMonthEarnings': current + estimatedPay,
        })
      }
    }

    // 4. Decrement old cleaner's earnings
    if (oldCleanerId) {
      const oldStaffRef = doc(db, 'staff', oldCleanerId)
      const oldStaffSnap = await transaction.get(oldStaffRef)
      if (oldStaffSnap.exists()) {
        const staffData = oldStaffSnap.data() as { financials?: { currentMonthEarnings?: number } } | undefined
        const financials = staffData?.financials || {}
        const current = financials.currentMonthEarnings ?? 0
        transaction.update(oldStaffRef, {
          'financials.currentMonthEarnings': Math.max(0, current - estimatedPay),
        })
      }
    }

    // 5. Create Audit Log if it is an override
    if (overrideReason && overrideType) {
      const auditLogRef = doc(collection(db, 'auditLog'))
      transaction.set(auditLogRef, {
        collection: 'jobs',
        documentId: jobId || bookingId,
        field: 'assignedTo',
        oldValue: oldCleanerId || null,
        newValue: cleanerId || null,
        changedBy: changedByEmail,
        changedAt: new Date(),
        reason: overrideReason,
        overrideType: overrideType,
      })
    }
  })
}

// ── F03: Jobs ────────────────────────────────────────────────────────────────

export function subscribeToJobs(
  isAuthorized: boolean,
  callback: (jobs: Job[]) => void,
): () => void {
  if (!isAuthorized) return () => {}
  const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const jobs: Job[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      jobs.push({
        id: docSnap.id,
        ...data,
        createdAt:   data['createdAt']   instanceof Timestamp ? data['createdAt'].toDate()   : new Date(),
        checkedInAt: data['checkedInAt'] instanceof Timestamp ? data['checkedInAt'].toDate() : null,
        completedAt: data['completedAt'] instanceof Timestamp ? data['completedAt'].toDate() : null,
      } as Job)
    })
    callback(jobs)
  })
}

// ── F03: Checklist Templates ─────────────────────────────────────────────────

export function subscribeToChecklistTemplates(
  isAuthorized: boolean,
  callback: (templates: ChecklistTemplate[]) => void,
): () => void {
  if (!isAuthorized) return () => {}
  const q = query(collection(db, 'checklistTemplates'), orderBy('serviceType', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const templates: ChecklistTemplate[] = []
    snapshot.forEach((docSnap) => {
      templates.push({ id: docSnap.id, ...docSnap.data() } as ChecklistTemplate)
    })
    callback(templates)
  })
}

export async function createChecklistTemplate(
  template: Omit<ChecklistTemplate, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'checklistTemplates'), template)
  return ref.id
}

export async function updateChecklistTemplate(
  templateId: string,
  updates: Partial<Omit<ChecklistTemplate, 'id'>>,
): Promise<void> {
  const docRef = doc(db, 'checklistTemplates', templateId)
  await updateDoc(docRef, updates as Record<string, unknown>)
}

export async function deleteChecklistTemplate(templateId: string): Promise<void> {
  // Soft-delete: set active to false rather than removing the document
  const docRef = doc(db, 'checklistTemplates', templateId)
  await updateDoc(docRef, { active: false })
}

// ── F04: Pay Rates ───────────────────────────────────────────────────────────

export function subscribeToPayRates(
  isAuthorized: boolean,
  callback: (rates: PayRate[]) => void,
): () => void {
  if (!isAuthorized) return () => {}
  const q = query(collection(db, 'payRates'), orderBy('effectiveFrom', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const rates: PayRate[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      rates.push({
        id: docSnap.id,
        ...data,
        effectiveFrom: data['effectiveFrom'] instanceof Timestamp ? data['effectiveFrom'].toDate() : new Date(),
        effectiveTo: data['effectiveTo'] instanceof Timestamp ? data['effectiveTo'].toDate() : null,
        createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(),
      } as PayRate)
    })
    callback(rates)
  })
}

export async function createPayRate(
  rate: Omit<PayRate, 'id' | 'createdAt'>,
): Promise<string> {
  const docData = {
    ...rate,
    effectiveFrom: Timestamp.fromDate(rate.effectiveFrom),
    effectiveTo: rate.effectiveTo ? Timestamp.fromDate(rate.effectiveTo) : null,
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, 'payRates'), docData)
  return ref.id
}

// ── P2-E2: Reviews ───────────────────────────────────────────────────────────

export async function submitReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const docData = {
    ...review,
    createdAt: serverTimestamp(),
  }
  
  // Submit the review
  const ref = await addDoc(collection(db, 'reviews'), docData)
  
  // Also update the job document to mark reviewSubmitted: true
  const jobRef = doc(db, 'jobs', review.jobId)
  await updateDoc(jobRef, { reviewSubmitted: true })

  return ref.id
}

export function subscribeToApprovedReviews(callback: (reviews: Review[]) => void): () => void {
  const q = query(
    collection(db, 'reviews'),
    where('approved', '==', true),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const reviews: Review[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      reviews.push({
        id: docSnap.id,
        ...data,
        createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(),
      } as Review)
    })
    callback(reviews)
  })
}

export function subscribeToPendingReviews(
  isAuthorized: boolean,
  callback: (reviews: Review[]) => void
): () => void {
  if (!isAuthorized) return () => {}
  const q = query(
    collection(db, 'reviews'),
    where('approved', '==', false),
    where('rejected', '==', false),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const reviews: Review[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      reviews.push({
        id: docSnap.id,
        ...data,
        createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(),
      } as Review)
    })
    callback(reviews)
  })
}

export async function updateReviewStatus(
  reviewId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const docRef = doc(db, 'reviews', reviewId)
  if (status === 'approved') {
    await updateDoc(docRef, { approved: true, rejected: false })
  } else {
    await updateDoc(docRef, { approved: false, rejected: true })
  }
}

// Fetch a single job to pre-populate review details
export async function getJobForReview(jobId: string): Promise<Job | null> {
  const jobRef = doc(db, 'jobs', jobId)
  const jobSnap = await getDoc(jobRef)
  if (!jobSnap.exists()) return null
  return { id: jobSnap.id, ...jobSnap.data() } as Job
}

export async function getBookingForReview(bookingId: string): Promise<Booking | null> {
  const bookingRef = doc(db, 'bookings', bookingId)
  const bookingSnap = await getDoc(bookingRef)
  if (!bookingSnap.exists()) return null
  return { id: bookingSnap.id, ...bookingSnap.data() } as Booking
}


