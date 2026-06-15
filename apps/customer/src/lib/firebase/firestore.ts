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
} from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import type { BookingFormData } from '@/lib/schemas/bookingSchema'
import type { Language, Booking, BookingStatus, Job, ChecklistTemplate } from '@/types'

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

export async function submitBooking(
  data: BookingFormData,
  language: Language,
  source: LeadSource,
): Promise<string> {
  if (typeof window !== 'undefined' && window.__MOCK_SUBMIT__) {
    return window.__MOCK_SUBMIT__(data, language, source)
  }
  const { marketingConsent, ...formFields } = data

  const docData: Record<string, unknown> = {
    ...formFields,
    language,
    leadSource:        source,
    status:            'pending',
    assignedTo:        null,
    isAirbnb:          data.serviceType === 'airbnb',
    photoConfirmation: data.serviceType === 'airbnb' || data.serviceType === 'commercial',
    fsmAppointmentId:  null,
    createdAt:         serverTimestamp(),
  }

  if (marketingConsent) {
    docData.marketingConsent = true
    docData.consentTimestamp = Timestamp.now()
    docData.consentMethod    = 'booking-form-v2'
  }

  const ref = await addDoc(collection(db, 'bookings'), docData)
  return ref.id
}

export function subscribeToBookings(callback: (bookings: Booking[]) => void): () => void {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const bookings: Booking[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      bookings.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      } as Booking)
    })
    callback(bookings)
  })
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId)
  await updateDoc(docRef, { status })
}

export async function updateBookingAssignment(bookingId: string, cleanerName: string | null): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId)
  await updateDoc(docRef, { assignedTo: cleanerName })
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

