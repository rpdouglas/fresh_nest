import {
  collection,
  CollectionReference,
  DocumentData,
  Firestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore'
import type { Booking, Review } from '../types/booking'
import type { Job, JobPhoto, ChecklistCompletion } from '../types/job'
import type { Staff, TermsAcceptance } from '../types/staff'
import type { ChecklistTemplate, PayRate, AuditEntry } from '../types/common'

// Helper to convert dynamic values to Date
export function toDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate()
  if (val && typeof val.toDate === 'function') return val.toDate()
  if (val && typeof val.seconds === 'number') {
    return new Timestamp(val.seconds, val.nanoseconds || 0).toDate()
  }
  return val ? new Date(val) : new Date()
}

export function toDateOrNull(val: any): Date | null {
  if (val == null) return null
  return toDate(val)
}

// Utility to recursively strip any undefined properties
export function cleanUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj // Let Firestore serialize Dates
  if (obj instanceof Timestamp) return obj
  if (Array.isArray(obj)) return obj.map(cleanUndefined)

  const clean: any = {}
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      clean[key] = cleanUndefined(obj[key])
    }
  }
  return clean
}

// Helper to create a converter with simple defaults
function createConverter<T extends { id?: string }>(
  fromFirestoreMap: (data: DocumentData, id: string) => T
): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T): DocumentData {
      return cleanUndefined(model)
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      const data = snapshot.data(options)
      return fromFirestoreMap(data, snapshot.id)
    },
  }
}

// Booking Converter
export const bookingConverter = createConverter<Booking>((data, id) => ({
  ...data,
  id,
  createdAt: toDate(data.createdAt),
} as Booking))

// Job Photo Mapper
function mapJobPhoto(p: any): JobPhoto {
  return {
    ...p,
    uploadedAt: toDateOrNull(p.uploadedAt),
    capturedAt: toDateOrNull(p.capturedAt),
  }
}

// Checklist Completion Mapper
function mapChecklistCompletion(c: any): ChecklistCompletion {
  return {
    ...c,
    completedAt: toDate(c.completedAt),
    photos: (c.photos || []).map(mapJobPhoto),
  }
}

// Job Converter
export const jobConverter = createConverter<Job>((data, id) => ({
  ...data,
  id,
  createdAt: toDate(data.createdAt),
  checkedInAt: toDateOrNull(data.checkedInAt),
  completedAt: toDateOrNull(data.completedAt),
  reviewRequestScheduledFor: toDateOrNull(data.reviewRequestScheduledFor),
  photos: (data.photos || []).map(mapJobPhoto),
  checklistCompletions: (data.checklistCompletions || []).map(mapChecklistCompletion),
} as Job))

// Staff Converter
export const staffConverter = createConverter<Staff>((data, id) => ({
  ...data,
  id,
  uid: data.uid || id,
  createdAt: toDate(data.createdAt),
  welcomeEmailSentAt: data.welcomeEmailSentAt ? toDate(data.welcomeEmailSentAt) : null,
  compliance: {
    ...data.compliance,
    acceptedTermsVersion: data.compliance?.acceptedTermsVersion ?? null,
    termsHistory: (data.compliance?.termsHistory || []).map((t: any) => ({
      ...t,
      acceptedAt: toDate(t.acceptedAt),
    } as TermsAcceptance)),
  },
} as Staff))

// Review Converter
export const reviewConverter = createConverter<Review>((data, id) => ({
  ...data,
  id,
  createdAt: toDate(data.createdAt),
} as Review))

// PayRate Converter
export const payRateConverter = createConverter<PayRate>((data, id) => ({
  ...data,
  id,
  createdAt: toDate(data.createdAt),
  effectiveFrom: toDate(data.effectiveFrom),
  effectiveTo: toDateOrNull(data.effectiveTo),
} as PayRate))

// ChecklistTemplate Converter
export const checklistTemplateConverter = createConverter<ChecklistTemplate>((data, id) => ({
  ...data,
  id,
} as ChecklistTemplate))

// AuditEntry Converter
export const auditEntryConverter = createConverter<AuditEntry>((data, id) => ({
  ...data,
  id,
  changedAt: toDate(data.changedAt),
} as AuditEntry))

// Collection Factories
export const bookingsCollection = (db: Firestore): CollectionReference<Booking> =>
  collection(db, 'bookings').withConverter(bookingConverter)

export const jobsCollection = (db: Firestore): CollectionReference<Job> =>
  collection(db, 'jobs').withConverter(jobConverter)

export const staffCollection = (db: Firestore): CollectionReference<Staff> =>
  collection(db, 'staff').withConverter(staffConverter)

export const reviewsCollection = (db: Firestore): CollectionReference<Review> =>
  collection(db, 'reviews').withConverter(reviewConverter)

export const payRatesCollection = (db: Firestore): CollectionReference<PayRate> =>
  collection(db, 'payRates').withConverter(payRateConverter)

export const checklistTemplatesCollection = (db: Firestore): CollectionReference<ChecklistTemplate> =>
  collection(db, 'checklistTemplates').withConverter(checklistTemplateConverter)

export const auditLogCollection = (db: Firestore): CollectionReference<AuditEntry> =>
  collection(db, 'auditLog').withConverter(auditEntryConverter)
