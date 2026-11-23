import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { z } from 'zod'
import { isOfficeRole } from '../lib/roles'
import { serverStamp } from '../lib/audit'
import { isValidDatabaseId, normalizeDatabaseId, type AllowedDatabaseId } from '../shared/agreements'
import {
  CONTACT_NOTE_KINDS,
  LEAD_NOTE_KINDS,
  LOST_REASONS,
  NON_OFFICE_ALLOWED_STAGES,
  extractLeadArea,
  inferPipelineStageFromBooking,
  isOpenPipelineStage,
  isRecurringRenewalBooking,
  sortLeadsByPriority,
  type LeadNoteKind,
  type LostReason,
  type PipelineStage,
  type StaffLeadDetail,
  type StaffLeadNoteDto,
  type StaffLeadSummary,
} from '../shared/pipeline'
import { normalizePolicySettings } from '../shared/policy'
import { toMillis } from '../shared/audit'

const FSM_ROLES = ['staff', 'supervisor']

function getDbForRequest(rawDbId: unknown): { db: Firestore; databaseId: AllowedDatabaseId } {
  if (!isValidDatabaseId(rawDbId)) {
    throw new HttpsError('invalid-argument', 'Invalid databaseId.')
  }
  const databaseId = normalizeDatabaseId(rawDbId)
  const db = databaseId === '(default)' ? getFirestore() : getFirestore(databaseId)
  return { db, databaseId }
}

function requireStaffOrOffice(auth: { uid: string; token: { role?: unknown; email?: string } } | undefined): {
  uid: string
  email: string
  isOffice: boolean
} {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.')
  }
  const role = typeof auth.token.role === 'string' ? auth.token.role : undefined
  const isOffice = isOfficeRole(role)
  if (!role || (!FSM_ROLES.includes(role) && !isOffice)) {
    throw new HttpsError('permission-denied', 'Only staff or office members can access assigned leads.')
  }
  const email = auth.token.email?.trim().toLowerCase() ?? ''
  if (!email) {
    throw new HttpsError('failed-precondition', 'Your account is missing an email address.')
  }
  return { uid: auth.uid, email, isOffice }
}

function toIsoOrNull(value: unknown): string | null {
  const ms = toMillis(value)
  return ms !== null ? new Date(ms).toISOString() : null
}

/**
 * Pure projection helper — builds a strictly PII-minimized `StaffLeadSummary` from a raw booking doc.
 * Full street address is returned ONLY when `needsSiteVisit === true` or `stage === 'site_visit'`
 * (COMPLIANCE.md §2, owner-approved 2026-11-23).
 */
export function buildStaffLeadSummary(
  bookingId: string,
  raw: Record<string, unknown>,
): StaffLeadSummary {
  const pipelineRaw = (raw.pipeline ?? {}) as Record<string, unknown>
  const stage = inferPipelineStageFromBooking({
    status: typeof raw.status === 'string' ? raw.status : undefined,
    pipeline: { stage: pipelineRaw.stage as PipelineStage | undefined },
  })
  const needsSiteVisit = Boolean(pipelineRaw.needsSiteVisit)
  const hasFullAddress = needsSiteVisit || stage === 'site_visit'
  const rawAddress = typeof raw.address === 'string' ? raw.address : ''
  const locationDisplay = hasFullAddress ? rawAddress : extractLeadArea(rawAddress)

  return {
    bookingId,
    firstName: typeof raw.firstName === 'string' ? raw.firstName : '',
    lastName: typeof raw.lastName === 'string' ? raw.lastName : '',
    phone: typeof raw.phone === 'string' ? raw.phone : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    language: raw.language === 'fr' ? 'fr' : 'en',
    serviceType: typeof raw.serviceType === 'string' ? raw.serviceType : 'standard',
    frequency: typeof raw.frequency === 'string' ? raw.frequency : 'one-time',
    propertyType: typeof raw.propertyType === 'string' ? raw.propertyType : 'apartment',
    bedrooms: typeof raw.bedrooms === 'number' ? raw.bedrooms : 0,
    bathrooms: typeof raw.bathrooms === 'number' ? raw.bathrooms : 0,
    preferredDate: typeof raw.preferredDate === 'string' ? raw.preferredDate : '',
    locationDisplay,
    hasFullAddress,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    isAirbnb: Boolean(raw.isAirbnb),
    createdAtIso: toIsoOrNull(raw.createdAt) ?? new Date().toISOString(),
    pipeline: {
      stage,
      ownerEmail: typeof pipelineRaw.ownerEmail === 'string' ? pipelineRaw.ownerEmail : null,
      ownerRole: (typeof pipelineRaw.ownerRole === 'string' ? pipelineRaw.ownerRole : null) as StaffLeadSummary['pipeline']['ownerRole'],
      needsSiteVisit,
      nextFollowUpDate: typeof pipelineRaw.nextFollowUpDate === 'string' ? pipelineRaw.nextFollowUpDate : null,
      firstContactAtIso: toIsoOrNull(pipelineRaw.firstContactAt),
      quotedPriceCents:
        typeof pipelineRaw.quotedPriceCents === 'number' && Number.isFinite(pipelineRaw.quotedPriceCents)
          ? Math.round(pipelineRaw.quotedPriceCents)
          : null,
      quoteSentAtIso: toIsoOrNull(pipelineRaw.quoteSentAt),
      closedAtIso: toIsoOrNull(pipelineRaw.closedAt),
      lostReason: (typeof pipelineRaw.lostReason === 'string' ? pipelineRaw.lostReason : null) as LostReason | null,
      lostNote: typeof pipelineRaw.lostNote === 'string' ? pipelineRaw.lostNote : null,
    },
  }
}

const getMyLeadSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  bookingId: z.string().trim().min(1).max(128),
})

const updateMyLeadSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  bookingId: z.string().trim().min(1).max(128),
  stage: z.enum(NON_OFFICE_ALLOWED_STAGES).optional(),
  needsSiteVisit: z.boolean().optional(),
  nextFollowUpDate: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Follow-up date must be YYYY-MM-DD'), z.null()])
    .optional(),
  quotedPriceCents: z.union([z.number().int().min(0).max(50_000_000), z.null()]).optional(),
  lostReason: z.enum(LOST_REASONS).nullable().optional(),
  lostNote: z.string().trim().max(500).nullable().optional(),
})

const addMyLeadNoteSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  bookingId: z.string().trim().min(1).max(128),
  kind: z.enum(LEAD_NOTE_KINDS),
  body: z.string().trim().min(1).max(2000),
})

/**
 * P3-E40 (Strategy 3): Lists all leads assigned to the signed-in staff/contractor/office caller.
 */
export const listMyLeads = onCall(async (request): Promise<{ leads: StaffLeadSummary[]; openCount: number }> => {
  const caller = requireStaffOrOffice(request.auth)
  const payload = (request.data ?? {}) as Record<string, unknown>
  const { db } = getDbForRequest(payload.databaseId)

  const [leadsSnap, policySnap] = await Promise.all([
    db.collection('bookings').where('pipeline.ownerEmail', '==', caller.email).get(),
    db.collection('settings').doc('policy').get().catch(() => null),
  ])
  const policy = normalizePolicySettings(
    policySnap && policySnap.exists ? (policySnap.data() as Record<string, unknown>) : undefined,
  )

  const rawItems = leadsSnap.docs
    .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
    .filter(({ data }) => !isRecurringRenewalBooking(data as { createdBy?: string }))

  const summaries = rawItems.map(({ id, data }) => buildStaffLeadSummary(id, data))
  const sorted = sortLeadsByPriority(
    summaries.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAtIso),
      pipeline: {
        ...s.pipeline,
        firstContactAt: s.pipeline.firstContactAtIso ? new Date(s.pipeline.firstContactAtIso) : null,
      },
    })),
    {
      firstContactTargetMinutes: policy.leadFirstContactTargetMinutes,
      siteVisitTargetMinutes: policy.leadSiteVisitFirstContactTargetMinutes,
    },
  ).map((item) => summaries.find((s) => s.bookingId === item.bookingId)!)

  const openCount = sorted.filter((s) => isOpenPipelineStage(s.pipeline.stage)).length
  return { leads: sorted, openCount }
})

/**
 * P3-E40 (Strategy 3): Loads a single assigned lead + its contact notes for the assigned owner.
 */
export const getMyLead = onCall(async (request): Promise<{ lead: StaffLeadDetail }> => {
  const caller = requireStaffOrOffice(request.auth)
  const parsed = getMyLeadSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid lead request.')
  }
  const { db } = getDbForRequest(parsed.data.databaseId)

  const ref = db.collection('bookings').doc(parsed.data.bookingId)
  const snap = await ref.get()
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Lead not found.')
  }
  const data = snap.data() as Record<string, unknown>
  const pipeline = (data.pipeline ?? {}) as Record<string, unknown>
  const ownerEmail = typeof pipeline.ownerEmail === 'string' ? pipeline.ownerEmail.trim().toLowerCase() : null
  if (ownerEmail !== caller.email && !caller.isOffice) {
    throw new HttpsError('permission-denied', 'You can only view leads assigned to you.')
  }

  const notesSnap = await ref.collection('leadNotes').orderBy('at', 'desc').limit(100).get()
  const leadNotes: StaffLeadNoteDto[] = notesSnap.docs.map((n) => {
    const nd = n.data() as Record<string, unknown>
    return {
      id: n.id,
      kind: (typeof nd.kind === 'string' ? nd.kind : 'note') as LeadNoteKind,
      body: typeof nd.body === 'string' ? nd.body : '',
      by: typeof nd.by === 'string' ? nd.by : '',
      atIso: toIsoOrNull(nd.at) ?? new Date().toISOString(),
    }
  })

  return {
    lead: {
      ...buildStaffLeadSummary(snap.id, data),
      leadNotes,
    },
  }
})

/**
 * P3-E40 (Strategy 3): Updates stage (excluding `won`), follow-up date, site-visit flag,
 * quote amount, or lost reason on a lead owned by the caller.
 */
export const updateMyLead = onCall(async (request): Promise<{ success: true; lead: StaffLeadSummary }> => {
  const caller = requireStaffOrOffice(request.auth)
  const raw = (request.data ?? {}) as Record<string, unknown>
  // Explicit clear error when non-office attempts to set `won`
  if (raw.stage === 'won') {
    throw new HttpsError('permission-denied', 'Only an Owner or Manager can mark a lead Won.')
  }
  const parsed = updateMyLeadSchema.safeParse(raw)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid lead update.')
  }
  const input = parsed.data
  const { db } = getDbForRequest(input.databaseId)
  const ref = db.collection('bookings').doc(input.bookingId)

  const updatedSummary = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Lead not found.')
    }
    const data = snap.data() as Record<string, unknown>
    const currentPipeline = (data.pipeline ?? {}) as Record<string, unknown>
    const ownerEmail =
      typeof currentPipeline.ownerEmail === 'string' ? currentPipeline.ownerEmail.trim().toLowerCase() : null

    if (ownerEmail !== caller.email) {
      throw new HttpsError('permission-denied', 'You can only update leads assigned to you.')
    }

    const currentStage = inferPipelineStageFromBooking({
      status: typeof data.status === 'string' ? data.status : undefined,
      pipeline: { stage: currentPipeline.stage as PipelineStage | undefined },
    })
    const nextStage: PipelineStage = input.stage ?? currentStage

    if (nextStage === 'lost' && !input.lostReason && !currentPipeline.lostReason) {
      throw new HttpsError('invalid-argument', 'A lost reason is required when marking a lead Lost.')
    }

    const now = Timestamp.now()
    const nextPipeline: Record<string, unknown> = {
      ...currentPipeline,
      stage: nextStage,
    }

    if (input.needsSiteVisit !== undefined) {
      nextPipeline.needsSiteVisit = input.needsSiteVisit
    }
    if (input.nextFollowUpDate !== undefined) {
      nextPipeline.nextFollowUpDate = input.nextFollowUpDate
    }
    if (input.quotedPriceCents !== undefined) {
      nextPipeline.quotedPriceCents = input.quotedPriceCents
      if (input.quotedPriceCents !== null && !currentPipeline.quoteSentAt) {
        nextPipeline.quoteSentAt = now
      }
    }
    if (nextStage === 'quoted' && !nextPipeline.quoteSentAt) {
      nextPipeline.quoteSentAt = now
    }
    if (nextStage !== 'new' && !currentPipeline.firstContactAt) {
      nextPipeline.firstContactAt = now
    }

    const updateDoc: Record<string, unknown> = {
      pipeline: nextPipeline,
      lastChange: serverStamp(caller.email, { source: 'staff_app' }),
    }

    if (nextStage === 'lost') {
      nextPipeline.lostReason = input.lostReason ?? currentPipeline.lostReason
      nextPipeline.lostNote = input.lostNote !== undefined ? input.lostNote : (currentPipeline.lostNote ?? null)
      nextPipeline.closedAt = now
      updateDoc.status = 'cancelled'
    } else if (currentStage === 'lost') {
      nextPipeline.lostReason = null
      nextPipeline.lostNote = null
      nextPipeline.closedAt = null
      if (data.status === 'cancelled') {
        updateDoc.status = 'pending'
      }
    }

    tx.update(ref, updateDoc)
    return buildStaffLeadSummary(snap.id, { ...data, ...updateDoc, pipeline: nextPipeline })
  })

  return { success: true, lead: updatedSummary }
})

/**
 * P3-E40 (Strategy 3): Appends a contact log / note to `bookings/{id}/leadNotes/{noteId}`
 * for a lead owned by the caller, auto-stamping `firstContactAt` for call/sms/email notes.
 */
export const addMyLeadNote = onCall(async (request): Promise<{ success: true; note: StaffLeadNoteDto }> => {
  const caller = requireStaffOrOffice(request.auth)
  const parsed = addMyLeadNoteSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid note payload.')
  }
  const input = parsed.data
  const { db } = getDbForRequest(input.databaseId)
  const bookingRef = db.collection('bookings').doc(input.bookingId)

  const createdNote = await db.runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef)
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Lead not found.')
    }
    const data = snap.data() as Record<string, unknown>
    const currentPipeline = (data.pipeline ?? {}) as Record<string, unknown>
    const ownerEmail =
      typeof currentPipeline.ownerEmail === 'string' ? currentPipeline.ownerEmail.trim().toLowerCase() : null

    if (ownerEmail !== caller.email) {
      throw new HttpsError('permission-denied', 'You can only add notes to leads assigned to you.')
    }

    const now = Timestamp.now()
    const noteRef = bookingRef.collection('leadNotes').doc()
    tx.set(noteRef, {
      kind: input.kind,
      body: input.body,
      by: caller.email,
      at: FieldValue.serverTimestamp(),
    })

    // Auto-stamp firstContactAt (and move new -> contacted) on first call/sms/email note
    if ((CONTACT_NOTE_KINDS as readonly string[]).includes(input.kind) && !currentPipeline.firstContactAt) {
      const nextStage = currentPipeline.stage === 'new' || !currentPipeline.stage ? 'contacted' : currentPipeline.stage
      tx.update(bookingRef, {
        'pipeline.firstContactAt': now,
        'pipeline.stage': nextStage,
        lastChange: serverStamp(caller.email, { source: 'staff_app', reason: `Logged ${input.kind}` }),
      })
    }

    return {
      id: noteRef.id,
      kind: input.kind,
      body: input.body,
      by: caller.email,
      atIso: now.toDate().toISOString(),
    } satisfies StaffLeadNoteDto
  })

  return { success: true, note: createdNote }
})
