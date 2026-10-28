import {
  collection,
  CollectionReference,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore'
import type { Booking, Review } from '../types/booking'
import type { Job, JobPhoto, ChecklistCompletion } from '../types/job'
import type { Staff, TermsAcceptance } from '../types/staff'
import type { ChecklistTemplate, PayRate, AuditEntry, GalleryPair } from '../types/common'
import {
  normalizePolicySettings,
  type PolicySettings,
  type PolicyHistoryEntry,
} from '../domain/policy'
import { amountCentsOf, centsOrLegacy, normalizeFinancials } from '../domain/money'

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

// Utility to recursively strip any undefined properties.
// Only plain objects and arrays are rebuilt. Class instances — Date, Timestamp, GeoPoint,
// DocumentReference, Bytes and FieldValue sentinels such as serverTimestamp() — must reach the
// SDK untouched: copying a sentinel into a plain object makes Firestore store it as a map
// (e.g. createdAt != request.time, so security rules reject the write).
export function cleanUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(cleanUndefined)
  const proto = Object.getPrototypeOf(obj)
  if (proto !== Object.prototype && proto !== null) return obj

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
export const bookingConverter = createConverter<Booking>((data, id) => {
  // P3-E38: dollar estimates saved before the migration read as cents
  const estimatedPriceCents = centsOrLegacy(data.estimatedPriceCents, data.estimatedPrice)
  return {
    ...data,
    id,
    createdAt: toDate(data.createdAt),
    ...(estimatedPriceCents !== null ? { estimatedPriceCents } : {}),
  } as Booking
})

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
  // P3-E38: dollar snapshots saved before the migration read as cents
  ...(data.payRateSnapshot ? { payRateSnapshot: { ...data.payRateSnapshot, amountCents: amountCentsOf(data.payRateSnapshot) } } : {}),
} as Job))

// Staff Converter
export const staffConverter = createConverter<Staff>((data, id) => ({
  ...data,
  id,
  uid: data.uid || id,
  createdAt: toDate(data.createdAt),
  welcomeEmailSentAt: data.welcomeEmailSentAt ? toDate(data.welcomeEmailSentAt) : null,
  financials: normalizeFinancials(data.financials), // P3-E38: cents, with dollar fallback
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
  amountCents: amountCentsOf(data), // P3-E38: cents, with dollar fallback
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

// GalleryPair Converter
export const galleryPairConverter = createConverter<GalleryPair>((data, id) => ({
  ...data,
  id,
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt),
} as GalleryPair))

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

export const galleryPairsCollection = (db: Firestore): CollectionReference<GalleryPair> =>
  collection(db, 'galleryPairs').withConverter(galleryPairConverter)

// PolicySettings Converter (P3-E36 / W0-2)
export const policySettingsConverter = createConverter<PolicySettings>((data, id) => ({
  ...normalizePolicySettings(data),
  id,
  version: typeof data.version === 'number' ? data.version : 1,
  updatedAt: toDate(data.updatedAt),
  updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : 'system',
  lastChangeReason: typeof data.lastChangeReason === 'string' ? data.lastChangeReason : null,
}))

// PolicyHistoryEntry Converter (P3-E36 / W0-2)
export const policyHistoryConverter = createConverter<PolicyHistoryEntry>((data, id) => ({
  id,
  version: typeof data.version === 'number' ? data.version : Number(id) || 1,
  changedAt: toDate(data.changedAt),
  changedBy: typeof data.changedBy === 'string' ? data.changedBy : 'system',
  reason: typeof data.reason === 'string' ? data.reason : null,
  changes: Array.isArray(data.changes) ? data.changes : [],
  snapshot: normalizePolicySettings(data.snapshot),
}))

export const policySettingsDoc = (db: Firestore): DocumentReference<PolicySettings> =>
  doc(db, 'settings', 'policy').withConverter(policySettingsConverter)

export const policyHistoryCollection = (db: Firestore): CollectionReference<PolicyHistoryEntry> =>
  collection(db, 'settings', 'policy', 'history').withConverter(policyHistoryConverter)
