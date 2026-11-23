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
  leadNotesCollection,
  jobsCollection,
  payRatesCollection,
  reviewsCollection,
  checklistTemplatesCollection,
  staffCollection,
  changeStamp,
  toCents,
  defaultNeedsSiteVisit,
  bookingStatusForPipelineStage,
  CONTACT_NOTE_KINDS,
  type BookingPipeline,
  type LeadNote,
  type LeadNoteKind,
  type LeadOwnerRole,
  type LostReason,
  type PipelineStage,
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

/** Internal estimate in integer cents (P3-E38); never shown on the public site (P3-E29). */
export function computeBookingEstimatedPriceCents(propertyType: string, serviceType: string, frequency: string): number {
  if (propertyType === 'commercial') {
    return 30000 // Baseline average for commercial clean estimates ($300)
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
    return toCents((quote.min + quote.max) / 2)
  }
  return 15000
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

  const estimatedPriceCents = computeBookingEstimatedPriceCents(
    data.propertyType,
    data.serviceType,
    data.frequency,
  )

  const normalizedAdmin = normalizeEmail(adminEmail)
  const isConfirmed = data.status === 'confirmed'
  const nowTs = Timestamp.now()

  const docData: Record<string, unknown> = {
    ...formFields,
    email:             normalizeEmail(data.email),
    assignedTo:        data.assignedTo ?? null,
    isAirbnb:          data.serviceType === 'airbnb',
    photoConfirmation: data.serviceType === 'airbnb',
    fsmAppointmentId:  null,
    estimatedPriceCents,
    checklistTemplateId: data.checklistTemplateId || null,
    createdBy:         adminEmail,
    createdAt:         serverTimestamp(),
    pipeline: {
      stage: isConfirmed ? 'won' : 'new',
      ownerEmail: normalizedAdmin || null,
      ownerRole: normalizedAdmin ? 'owner' : null,
      ownerAssignedAt: normalizedAdmin ? nowTs : null,
      ownerAssignedBy: normalizedAdmin || null,
      needsSiteVisit: defaultNeedsSiteVisit(data.serviceType),
      nextFollowUpDate: null,
      firstContactAt: isConfirmed ? nowTs : null,
      quotedPriceCents: null,
      quoteSentAt: null,
      closedAt: isConfirmed ? nowTs : null,
      lostReason: null,
      lostNote: null,
    },
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

export interface LeadPipelinePatch {
  stage?: PipelineStage
  ownerEmail?: string | null
  ownerRole?: LeadOwnerRole | null
  needsSiteVisit?: boolean
  nextFollowUpDate?: string | null
  quotedPriceCents?: number | null
  lostReason?: LostReason | null
  lostNote?: string | null
}

/**
 * P3-E40: Updates a booking's `pipeline` map (and keeps `bookings.status` synced for `won`/`lost`),
 * auto-stamping `firstContactAt`, `quoteSentAt`, `ownerAssignedAt`, `closedAt`, and `lastChange`.
 */
export async function updateLeadPipeline(
  bookingId: string,
  patch: LeadPipelinePatch,
  currentBooking?: Pick<Booking, 'status' | 'serviceType' | 'pipeline'>,
  reason?: string,
): Promise<void> {
  const actorEmail = normalizeEmail(auth.currentUser?.email ?? '')
  const prev: BookingPipeline = currentBooking?.pipeline ?? {
    stage: currentBooking?.status === 'confirmed' || currentBooking?.status === 'completed'
      ? 'won'
      : currentBooking?.status === 'cancelled'
        ? 'lost'
        : 'new',
    ownerEmail: null,
    ownerRole: null,
    needsSiteVisit: defaultNeedsSiteVisit(currentBooking?.serviceType),
  }

  const nowTs = Timestamp.now()
  const nextStage: PipelineStage = patch.stage ?? prev.stage
  const nextPipeline: Record<string, unknown> = {
    stage: nextStage,
    ownerEmail: patch.ownerEmail !== undefined ? (patch.ownerEmail ? normalizeEmail(patch.ownerEmail) : null) : prev.ownerEmail,
    ownerRole: patch.ownerRole !== undefined ? patch.ownerRole : prev.ownerRole,
    ownerAssignedAt: prev.ownerAssignedAt ?? null,
    ownerAssignedBy: prev.ownerAssignedBy ?? null,
    needsSiteVisit: patch.needsSiteVisit !== undefined ? patch.needsSiteVisit : Boolean(prev.needsSiteVisit),
    nextFollowUpDate: patch.nextFollowUpDate !== undefined ? (patch.nextFollowUpDate || null) : (prev.nextFollowUpDate ?? null),
    firstContactAt: prev.firstContactAt ?? null,
    quotedPriceCents: patch.quotedPriceCents !== undefined ? patch.quotedPriceCents : (prev.quotedPriceCents ?? null),
    quoteSentAt: prev.quoteSentAt ?? null,
    closedAt: prev.closedAt ?? null,
    lostReason: prev.lostReason ?? null,
    lostNote: prev.lostNote ?? null,
  }

  if (patch.ownerEmail !== undefined && nextPipeline.ownerEmail !== prev.ownerEmail) {
    nextPipeline.ownerAssignedAt = nextPipeline.ownerEmail ? nowTs : null
    nextPipeline.ownerAssignedBy = actorEmail || null
  }
  if (nextStage !== 'new' && !nextPipeline.firstContactAt) {
    nextPipeline.firstContactAt = nowTs
  }
  if (
    (nextStage === 'quoted' || (patch.quotedPriceCents !== undefined && patch.quotedPriceCents !== null)) &&
    !nextPipeline.quoteSentAt
  ) {
    nextPipeline.quoteSentAt = nowTs
  }

  const updatePayload: Record<string, unknown> = {
    pipeline: nextPipeline,
    lastChange: adminStamp(reason ? { reason } : undefined),
  }

  if (nextStage === 'won') {
    nextPipeline.closedAt = nowTs
    nextPipeline.lostReason = null
    nextPipeline.lostNote = null
    updatePayload.status = bookingStatusForPipelineStage('won')
  } else if (nextStage === 'lost') {
    nextPipeline.closedAt = nowTs
    nextPipeline.lostReason = patch.lostReason ?? prev.lostReason ?? 'other'
    nextPipeline.lostNote = patch.lostNote !== undefined ? (patch.lostNote?.trim() || null) : (prev.lostNote ?? null)
    updatePayload.status = bookingStatusForPipelineStage('lost')
  } else if (prev.stage === 'lost' || prev.stage === 'won') {
    nextPipeline.closedAt = null
    nextPipeline.lostReason = null
    nextPipeline.lostNote = null
    if (currentBooking?.status === 'cancelled') {
      updatePayload.status = 'pending'
    }
  }

  const docRef = doc(bookingsCollection(db), bookingId)
  await updateDoc(docRef, updatePayload)
}

/**
 * P3-E40: Appends a note to `bookings/{id}/leadNotes` and auto-stamps `firstContactAt`
 * (and advances `new -> contacted`) for `call`/`sms`/`email` notes.
 */
export async function addLeadNote(
  bookingId: string,
  kind: LeadNoteKind,
  body: string,
  currentBooking?: Pick<Booking, 'status' | 'serviceType' | 'pipeline'>,
): Promise<void> {
  const actorEmail = normalizeEmail(auth.currentUser?.email ?? '')
  const trimmed = body.trim()
  if (!trimmed) return

  await addDoc(leadNotesCollection(db, bookingId), {
    kind,
    body: trimmed,
    by: actorEmail,
    at: serverTimestamp() as unknown as Date,
  })

  if ((CONTACT_NOTE_KINDS as readonly string[]).includes(kind) && !currentBooking?.pipeline?.firstContactAt) {
    const prevStage = currentBooking?.pipeline?.stage ?? 'new'
    const nextStage: PipelineStage = prevStage === 'new' ? 'contacted' : prevStage
    await updateLeadPipeline(
      bookingId,
      { stage: nextStage },
      currentBooking,
      `Logged ${kind}`,
    )
  }
}

export function subscribeToLeadNotes(
  bookingId: string,
  callback: (notes: LeadNote[]) => void,
): () => void {
  const q = query(leadNotesCollection(db, bookingId), orderBy('at', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => d.data()))
  })
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
  estimatedPayCents,
  overrideReason = null,
  overrideType = null,
  changedByEmail,
}: {
  bookingId: string
  jobId: string | null
  cleanerId: string | null
  cleanerName: string | null
  oldCleanerId: string | null
  /** P3-E38: the shift's pay in integer cents, moved between cleaners' monthly totals */
  estimatedPayCents: number
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
      snap?.exists() ? (snap.data()?.financials?.currentMonthEarningsCents ?? 0) : 0

    if (cleanerId !== oldCleanerId) {
      if (newStaffRef && newStaffSnap?.exists()) {
        transaction.update(newStaffRef, {
          'financials.currentMonthEarningsCents': earningsOf(newStaffSnap) + estimatedPayCents,
          lastChange: stamp(),
        })
      }
      if (oldStaffRef && oldStaffSnap?.exists()) {
        transaction.update(oldStaffRef, {
          'financials.currentMonthEarningsCents': Math.max(0, earningsOf(oldStaffSnap) - estimatedPayCents),
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


