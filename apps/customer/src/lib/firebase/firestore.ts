import {
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
import { db, auth } from '@/lib/firebase/firebase'
import {
  bookingsCollection,
  jobsCollection,
  payRatesCollection,
  reviewsCollection,
  checklistTemplatesCollection,
  staffCollection,
  changeStamp,
} from '@freshnest/shared'
import type { BookingFormData, AdminBookingFormData } from '@/lib/schemas/bookingSchema'
import type { Language, Booking, BookingStatus, Job, ChecklistTemplate, ChecklistTask, ChecklistSource, PayRate, Review } from '@/types'
import { canChangeChecklist, orderedTasks } from '@/lib/utils/checklistTasks'
import { calculateQuote } from '@/lib/utils/quotePricing'
import type { QuotePropertySize, QuoteServiceType, QuoteFrequency } from '@/lib/utils/quotePricing'


export type LeadSource = 'organic' | 'google' | 'referral' | 'facebook' | 'direct'

// P3-E37: every save on an audited record carries a `lastChange` stamp naming the signed-in person;
// the audit triggers turn it into the audit log entry.
const adminStamp = (extra?: { reason?: string | null; overrideType?: string | null }) =>
  changeStamp(auth.currentUser?.email, 'admin', extra)

// Firebase Auth lowercases account emails, and the customer portal and the bookings read rule
// match on `email`, so bookings must store it trimmed and lowercased too.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

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

// P3-E29: public submissions are quote requests — no price or payment is recorded;
// pricing is agreed in the quote follow-up (admin bookings still carry an internal estimate).
export async function submitBooking(
  data: BookingFormData,
  language: Language,
  source: LeadSource,
): Promise<string> {
  const { marketingConsent, ...formFields } = data

  const docData: Record<string, unknown> = {
    ...formFields,
    email:             normalizeEmail(data.email),
    language,
    leadSource:        source,
    status:            'pending',
    assignedTo:        null,
    isAirbnb:          data.serviceType === 'airbnb',
    photoConfirmation: data.serviceType === 'airbnb',
    fsmAppointmentId:  null,
    createdAt:         serverTimestamp(),
    lastChange:        changeStamp(auth.currentUser?.email, auth.currentUser ? 'customer' : 'public_form'),
  }

  if (marketingConsent) {
    docData.marketingConsent = true
    docData.consentTimestamp = Timestamp.now()
    docData.consentMethod    = 'booking-form-v2'
  }

  const ref = await addDoc(bookingsCollection(db), docData as unknown as Booking)
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
    email:             normalizeEmail(data.email),
    assignedTo:        data.assignedTo ?? null,
    isAirbnb:          data.serviceType === 'airbnb',
    photoConfirmation: data.serviceType === 'airbnb',
    fsmAppointmentId:  null,
    estimatedPrice,
    checklistTemplateId: data.checklistTemplateId || null,
    createdBy:         adminEmail,
    createdAt:         serverTimestamp(),
    lastChange:        changeStamp(adminEmail, 'admin'),
  }

  if (marketingConsent) {
    docData.marketingConsent = true
    docData.consentTimestamp = Timestamp.now()
    docData.consentMethod    = 'booking-form-v2'
  }

  const ref = await addDoc(bookingsCollection(db), docData as unknown as Booking)
  return ref.id
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const docRef = doc(bookingsCollection(db), bookingId)
  await updateDoc(docRef, { status, lastChange: adminStamp() })
}

export async function updateBookingAssignment(bookingId: string, cleanerName: string | null): Promise<void> {
  const docRef = doc(bookingsCollection(db), bookingId)
  await updateDoc(docRef, { assignedTo: cleanerName, lastChange: adminStamp() })
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
  // P3-E37: the override reason and type travel on the stamp; the audit trigger records them.
  const stamp = () => changeStamp(changedByEmail, 'admin', { reason: overrideReason, overrideType })
  await runTransaction(db, async (transaction) => {
    // Firestore transactions require every read to happen before any write.
    const newStaffRef = cleanerId ? doc(staffCollection(db), cleanerId) : null
    const oldStaffRef = oldCleanerId ? doc(staffCollection(db), oldCleanerId) : null
    const newStaffSnap = newStaffRef ? await transaction.get(newStaffRef) : null
    const oldStaffSnap = oldStaffRef ? await transaction.get(oldStaffRef) : null

    // 1. Booking update
    const bookingRef = doc(bookingsCollection(db), bookingId)
    transaction.update(bookingRef, { assignedTo: cleanerName, lastChange: stamp() })
 
    // 2. Job update
    if (jobId) {
      const jobRef = doc(jobsCollection(db), jobId)
      transaction.update(jobRef, {
        assignedTo: cleanerId,
        status: cleanerId ? 'assigned' : 'unassigned',
        lastChange: stamp(),
      })
    }

    // 3 + 4. Move the shift's earnings from the old cleaner to the new one
    // (no-op when reassigned to the same cleaner).
    const earningsOf = (snap: typeof newStaffSnap): number =>
      snap?.exists() ? (snap.data()?.financials?.currentMonthEarnings ?? 0) : 0

    if (cleanerId !== oldCleanerId) {
      if (newStaffRef && newStaffSnap?.exists()) {
        transaction.update(newStaffRef, {
          'financials.currentMonthEarnings': earningsOf(newStaffSnap) + estimatedPay,
          lastChange: stamp(),
        })
      }
      if (oldStaffRef && oldStaffSnap?.exists()) {
        transaction.update(oldStaffRef, {
          'financials.currentMonthEarnings': Math.max(0, earningsOf(oldStaffSnap) - estimatedPay),
          lastChange: stamp(),
        })
      }
    }
  })
}

// ── F03: Jobs ────────────────────────────────────────────────────────────────

export function subscribeToJobs(
  isAuthorized: boolean,
  callback: (jobs: Job[]) => void,
): () => void {
  if (!isAuthorized) return () => {}
  const q = query(jobsCollection(db), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map((docSnap) => docSnap.data())
    callback(jobs)
  })
}

// ── F03: Checklist Templates ─────────────────────────────────────────────────

export function subscribeToChecklistTemplates(
  isAuthorized: boolean,
  callback: (templates: ChecklistTemplate[]) => void,
): () => void {
  if (!isAuthorized) return () => {}
  const q = query(checklistTemplatesCollection(db), orderBy('serviceType', 'asc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => d.data()))
  })
}

export async function createChecklistTemplate(
  template: Omit<ChecklistTemplate, 'id'>,
): Promise<string> {
  const ref = await addDoc(checklistTemplatesCollection(db), { ...template, lastChange: adminStamp() })
  return ref.id
}

export async function updateChecklistTemplate(
  templateId: string,
  updates: Partial<Omit<ChecklistTemplate, 'id'>>,
): Promise<void> {
  const docRef = doc(checklistTemplatesCollection(db), templateId)
  await updateDoc(docRef, { ...(updates as Record<string, unknown>), lastChange: adminStamp() })
}
 
export async function deleteChecklistTemplate(templateId: string): Promise<void> {
  // Soft-delete: set active to false rather than removing the document
  const docRef = doc(checklistTemplatesCollection(db), templateId)
  await updateDoc(docRef, { active: false, lastChange: adminStamp() })
}

// ── P3-E34: Job checklists ───────────────────────────────────────────────────

export interface JobChecklist {
  templateId: string
  name: string
  source: Exclude<ChecklistSource, 'auto'>
  tasks: ChecklistTask[]
}

/** Thrown when a job has started (or has completed tasks), so its checklist is locked. */
export const CHECKLIST_LOCKED = 'checklist-locked'

/**
 * Copies a checklist onto a job. Reads the job inside the transaction so a cleaner starting
 * the job at the same moment can't end up with completions for tasks that were swapped out.
 */
export async function attachJobChecklist(jobId: string, checklist: JobChecklist): Promise<void> {
  const jobRef = doc(jobsCollection(db), jobId)
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(jobRef)
    if (!snap.exists() || !canChangeChecklist(snap.data())) {
      throw new Error(CHECKLIST_LOCKED)
    }
    transaction.update(jobRef, {
      checklistTemplate: checklist.templateId,
      checklistName: checklist.name,
      checklistSource: checklist.source,
      checklistTasks: orderedTasks(checklist.tasks),
      lastChange: adminStamp(),
    })
  })
}

/** The saved list future visits of this booking use; renewals copy it (null = by service type). */
export async function setBookingChecklistTemplate(bookingId: string, templateId: string | null): Promise<void> {
  const docRef = doc(bookingsCollection(db), bookingId)
  await updateDoc(docRef, { checklistTemplateId: templateId, lastChange: adminStamp() })
}

// ── F04: Pay Rates ───────────────────────────────────────────────────────────

export function subscribeToPayRates(
  isAuthorized: boolean,
  callback: (rates: PayRate[]) => void,
): () => void {
  if (!isAuthorized) return () => {}
  const q = query(payRatesCollection(db), orderBy('effectiveFrom', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => d.data()))
  })
}

export async function createPayRate(
  rate: Omit<PayRate, 'id' | 'createdAt'>,
): Promise<string> {
  const docData = {
    ...rate,
    createdAt: serverTimestamp(),
    lastChange: adminStamp(),
  }
  const ref = await addDoc(payRatesCollection(db), docData as unknown as PayRate)
  return ref.id
}

// ── P2-E2: Reviews ───────────────────────────────────────────────────────────

export async function submitReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const docData = {
    ...review,
    createdAt: serverTimestamp(),
    lastChange: changeStamp(auth.currentUser?.email, auth.currentUser ? 'customer' : 'public_form'),
  }
  
  // Submit the review
  const ref = await addDoc(reviewsCollection(db), docData as unknown as Review)
  
  // Also update the job document to mark reviewSubmitted: true
  const jobRef = doc(jobsCollection(db), review.jobId)
  await updateDoc(jobRef, { reviewSubmitted: true })

  return ref.id
}

export function subscribeToApprovedReviews(callback: (reviews: Review[]) => void): () => void {
  const q = query(
    reviewsCollection(db),
    where('approved', '==', true),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => d.data()))
  })
}

export function subscribeToPendingReviews(
  isAuthorized: boolean,
  callback: (reviews: Review[]) => void
): () => void {
  if (!isAuthorized) return () => {}
  const q = query(
    reviewsCollection(db),
    where('approved', '==', false),
    where('rejected', '==', false),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => d.data()))
  })
}

export async function updateReviewStatus(
  reviewId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const docRef = doc(reviewsCollection(db), reviewId)
  if (status === 'approved') {
    await updateDoc(docRef, { approved: true, rejected: false, lastChange: adminStamp() })
  } else {
    await updateDoc(docRef, { approved: false, rejected: true, lastChange: adminStamp() })
  }
}

export async function getJobForReview(jobId: string): Promise<Job | null> {
  const jobRef = doc(jobsCollection(db), jobId)
  const jobSnap = await getDoc(jobRef)
  return jobSnap.exists() ? (jobSnap.data() ?? null) : null
}
 
export async function getBookingForReview(bookingId: string): Promise<Booking | null> {
  const bookingRef = doc(bookingsCollection(db), bookingId)
  const bookingSnap = await getDoc(bookingRef)
  return bookingSnap.exists() ? (bookingSnap.data() ?? null) : null
}


