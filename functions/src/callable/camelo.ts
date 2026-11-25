/**
 * P3-E42: Won Lead -> Camelo Bridge callables (office-only: Owner & Manager).
 *
 * Exports 4 Firebase `onCall` functions:
 * - `prepareLeadForCamelo`: loads booking + leadNotes, fetches Camelo clients & schedules,
 *   ranks existing client matches, geocodes address (via `schedulePlaces` cache / Nominatim),
 *   and returns pre-filled defaults for `CameloSyncModal`.
 * - `pushLeadToCamelo`: creates or links Camelo Client -> creates Job Site (`geoLat`, `geoLong`,
 *   `scheduleIds`, `clientIds`, `note`) -> optionally creates `CLIENT` comment -> persists
 *   `bookings/{id}.camelo` with P3-E37 `lastChange`.
 * - `addCameloClientNote`: posts a follow-up `CLIENT` comment on a synced booking.
 * - `updateCameloJobSiteNote`: updates `jobSite.note` on a synced booking.
 *
 * Safety rules:
 * - Strictly office-only (`requireOffice`).
 * - NEVER reads `agreements/{id}/private/access` (COMPLIANCE.md §2).
 * - Blocks live writes to production Camelo when `databaseId === 'freshnest-dev'` (unless an
 *   explicit test `CAMELO_ENDPOINT` override is set), returning a safe dry-run response instead.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore'
import { z } from 'zod'
import { CAMELO_TOKEN, logError } from '../lib/shared'
import { requireOffice } from '../lib/roles'
import { serverStamp } from '../lib/audit'
import {
  createCameloClient,
  createCameloClientComment,
  createCameloJobSite,
  listCameloClients,
  listCameloSchedules,
  updateCameloJobSiteNote as updateCameloJobSiteNoteApi,
  type CameloCallOptions,
} from '../lib/cameloClient'
import { geocodeAddressWithCache } from '../lib/geocode'
import { isValidDatabaseId, normalizeDatabaseId, type AllowedDatabaseId } from '../shared/agreements'
import { toMillis } from '../shared/audit'
import { inferPipelineStageFromBooking, type PipelineStage } from '../shared/pipeline'
import {
  buildDefaultClientComment,
  buildDefaultJobSiteNote,
  matchCameloClients,
  pickDefaultCameloScheduleId,
  type AddCameloClientNoteResult,
  type CameloClientSummary,
  type CameloScheduleSummary,
  type PrepareLeadForCameloResult,
  type PrepareLeadNoteItem,
  type PushLeadToCameloResult,
  type UpdateCameloJobSiteNoteResult,
} from '../shared/cameloBridge'

function getDbForRequest(rawDbId: unknown): { db: Firestore; databaseId: AllowedDatabaseId } {
  if (!isValidDatabaseId(rawDbId)) {
    throw new HttpsError('invalid-argument', 'Invalid databaseId.')
  }
  const databaseId = normalizeDatabaseId(rawDbId)
  const db = databaseId === '(default)' ? getFirestore() : getFirestore(databaseId)
  return { db, databaseId }
}

function toIsoOrNull(value: unknown): string | null {
  const ms = toMillis(value)
  return ms !== null ? new Date(ms).toISOString() : null
}

function isDevDryRunDatabase(databaseId: AllowedDatabaseId, endpointOverride?: string): boolean {
  if (databaseId !== 'freshnest-dev') return false
  // Allow automated tests / local pretend-Camelo when an explicit non-prod endpoint override is injected.
  const endpoint = endpointOverride || process.env['CAMELO_ENDPOINT'] || ''
  return !endpoint
}

function resolveCameloToken(override?: string): string {
  if (override) return override
  const fromEnv = (process.env['CAMELO_TOKEN'] || '').trim()
  if (fromEnv) return fromEnv
  try {
    return CAMELO_TOKEN.value().trim()
  } catch {
    return ''
  }
}

function readExistingSync(raw: unknown): PrepareLeadForCameloResult['existingSync'] {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  if (typeof c.clientId !== 'string' || typeof c.jobSiteId !== 'string') return null
  return {
    clientId: c.clientId,
    clientName: typeof c.clientName === 'string' ? c.clientName : '',
    jobSiteId: c.jobSiteId,
    jobSiteName: typeof c.jobSiteName === 'string' ? c.jobSiteName : '',
    jobSiteAddress: typeof c.jobSiteAddress === 'string' ? c.jobSiteAddress : '',
    jobSiteNote: typeof c.jobSiteNote === 'string' ? c.jobSiteNote : null,
    scheduleName: typeof c.scheduleName === 'string' ? c.scheduleName : null,
    syncedAtIso: toIsoOrNull(c.syncedAt),
    syncedBy: typeof c.syncedBy === 'string' ? c.syncedBy : '',
  }
}

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const prepareSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  bookingId: z.string().trim().min(1).max(128),
  addressOverride: z.string().trim().min(5).max(300).optional(),
})

const pushSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  bookingId: z.string().trim().min(1).max(128),
  existingClientId: z.string().trim().min(1).max(128).nullable().optional(),
  clientName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254).nullable().optional().or(z.literal('')),
  phoneNumber: z.string().trim().max(40).nullable().optional(),
  billingAddress: z.string().trim().max(300).nullable().optional(),
  clientNumber: z.string().trim().max(64).nullable().optional(),
  jobSiteName: z.string().trim().min(1).max(200),
  jobSiteAddress: z.string().trim().min(5).max(300),
  jobSiteNote: z.string().trim().max(2000).nullable().optional(),
  scheduleId: z.string().trim().min(1).max(128),
  geoLat: z.number().min(-90).max(90),
  geoLong: z.number().min(-180).max(180),
  geoSource: z.enum(['nominatim', 'manual', 'fallback']),
  clientComment: z.string().trim().max(2000).nullable().optional(),
})

const addClientNoteSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  bookingId: z.string().trim().min(1).max(128),
  content: z.string().trim().min(1).max(1900),
})

const updateJobSiteNoteSchema = z.object({
  databaseId: z.enum(['(default)', 'freshnest-dev']).optional(),
  bookingId: z.string().trim().min(1).max(128),
  note: z.string().trim().max(2000),
})

// ── Injectable Runtime Dependencies (for unit tests with pretend Camelo) ─────

export interface CameloHandlerDeps {
  db: Firestore
  databaseId: AllowedDatabaseId
  actorEmail: string
  cameloToken?: string
  cameloEndpoint?: string
  fetchImpl?: typeof fetch
  now?: () => number
}

async function loadBookingAndNotes(db: Firestore, bookingId: string) {
  const bookingRef = db.collection('bookings').doc(bookingId)
  const [bookingSnap, notesSnap] = await Promise.all([
    bookingRef.get(),
    bookingRef.collection('leadNotes').orderBy('at', 'asc').limit(50).get(),
  ])
  if (!bookingSnap.exists) {
    throw new HttpsError('not-found', 'Booking not found.')
  }
  const booking = (bookingSnap.data() ?? {}) as Record<string, unknown>
  const leadNotes: PrepareLeadNoteItem[] = notesSnap.docs.map((d) => {
    const n = (d.data() ?? {}) as Record<string, unknown>
    return {
      id: d.id,
      kind: typeof n.kind === 'string' ? n.kind : 'note',
      body: typeof n.body === 'string' ? n.body : '',
      by: typeof n.by === 'string' ? n.by : '',
      atIso: toIsoOrNull(n.at) ?? new Date().toISOString(),
    }
  })
  return { bookingRef, booking, leadNotes }
}

function assertLeadIsWon(booking: Record<string, unknown>): void {
  const pipeline = (booking.pipeline ?? {}) as Record<string, unknown>
  const stage = inferPipelineStageFromBooking({
    status: typeof booking.status === 'string' ? booking.status : undefined,
    pipeline: { stage: pipeline.stage as PipelineStage | undefined },
  })
  if (stage !== 'won') {
    throw new HttpsError(
      'failed-precondition',
      'Only Won leads can be sent to Camelo. Mark the lead as Won first.',
    )
  }
}

export async function runPrepareLeadForCamelo(
  rawInput: unknown,
  deps: CameloHandlerDeps,
): Promise<PrepareLeadForCameloResult> {
  const parsed = prepareSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid prepare payload.')
  }

  const { bookingId, addressOverride } = parsed.data
  const { booking, leadNotes } = await loadBookingAndNotes(deps.db, bookingId)
  assertLeadIsWon(booking)

  const existingSync = readExistingSync(booking.camelo)
  const isDevDryRun = isDevDryRunDatabase(deps.databaseId, deps.cameloEndpoint)
  const token = resolveCameloToken(deps.cameloToken)

  let clients: CameloClientSummary[] = []
  let schedules: CameloScheduleSummary[] = []

  if (token) {
    const cameloOpts: CameloCallOptions = {
      token,
      endpoint: deps.cameloEndpoint,
      fetchImpl: deps.fetchImpl,
    }
    try {
      ;[clients, schedules] = await Promise.all([
        listCameloClients(cameloOpts),
        listCameloSchedules(cameloOpts),
      ])
    } catch (err) {
      if (!isDevDryRun) {
        logError('[prepareLeadForCamelo] Camelo read failed:', err)
        throw new HttpsError('unavailable', 'Could not load clients and schedules from Camelo. Please try again.')
      }
      // On freshnest-dev dry-run, gracefully proceed with empty Camelo lists if token is unavailable.
    }
  } else if (!isDevDryRun) {
    throw new HttpsError('failed-precondition', 'Camelo API token is not configured on the server.')
  }

  const firstName = typeof booking.firstName === 'string' ? booking.firstName.trim() : ''
  const lastName = typeof booking.lastName === 'string' ? booking.lastName.trim() : ''
  const fullName = `${firstName} ${lastName}`.trim()
  const email = typeof booking.email === 'string' ? booking.email.trim() : ''
  const phone = typeof booking.phone === 'string' ? booking.phone.trim() : ''
  const address = (addressOverride || (typeof booking.address === 'string' ? booking.address : '')).trim()

  const matches = matchCameloClients({ firstName, lastName, email, phone }, clients)
  const defaultScheduleId = pickDefaultCameloScheduleId(schedules)

  const geocode = await geocodeAddressWithCache(address, deps.db, {
    fetchImpl: deps.fetchImpl,
    now: deps.now,
    writeCache: !isDevDryRun,
  })

  const pipeline = (booking.pipeline ?? {}) as Record<string, unknown>
  const quotedPriceCents =
    typeof pipeline.quotedPriceCents === 'number' && Number.isFinite(pipeline.quotedPriceCents)
      ? Math.round(pipeline.quotedPriceCents)
      : null

  const summarySource = {
    firstName,
    lastName,
    language: typeof booking.language === 'string' ? booking.language : 'en',
    propertyType: typeof booking.propertyType === 'string' ? booking.propertyType : undefined,
    bedrooms: typeof booking.bedrooms === 'number' ? booking.bedrooms : undefined,
    bathrooms: typeof booking.bathrooms === 'number' ? booking.bathrooms : undefined,
    serviceType: typeof booking.serviceType === 'string' ? booking.serviceType : undefined,
    frequency: typeof booking.frequency === 'string' ? booking.frequency : undefined,
    preferredDate: typeof booking.preferredDate === 'string' ? booking.preferredDate : undefined,
    pets: Boolean(booking.pets),
    isAirbnb: Boolean(booking.isAirbnb),
    addOns: Array.isArray(booking.addOns) ? (booking.addOns as string[]) : [],
    notes: typeof booking.notes === 'string' ? booking.notes : '',
    leadSource: typeof booking.leadSource === 'string' ? booking.leadSource : undefined,
    quotedPriceCents,
  }

  return {
    bookingId,
    alreadySynced: existingSync !== null,
    existingSync,
    isDevDryRun,
    matches,
    clients,
    schedules,
    defaultScheduleId,
    geocode: {
      found: geocode.found,
      lat: geocode.lat,
      lon: geocode.lon,
      source: geocode.found ? 'nominatim' : null,
    },
    defaults: {
      clientName: fullName,
      email,
      phoneNumber: phone,
      billingAddress: address,
      jobSiteName: fullName ? `${fullName} — ${address.split(',')[0].trim()}` : address,
      jobSiteAddress: address,
      jobSiteNote: buildDefaultJobSiteNote(summarySource),
      clientComment: buildDefaultClientComment(summarySource, leadNotes),
    },
    leadNotes,
  }
}

export async function runPushLeadToCamelo(
  rawInput: unknown,
  deps: CameloHandlerDeps,
): Promise<PushLeadToCameloResult> {
  const parsed = pushSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid Camelo push payload.')
  }

  const data = parsed.data
  const { bookingRef, booking } = await loadBookingAndNotes(deps.db, data.bookingId)
  assertLeadIsWon(booking)

  const existing = readExistingSync(booking.camelo)
  if (existing) {
    throw new HttpsError(
      'already-exists',
      `This lead is already synced to Camelo (Client: ${existing.clientName || existing.clientId}).`,
    )
  }

  const nowIso = new Date((deps.now ?? Date.now)()).toISOString()

  // Staging safety: never write to production Camelo from `freshnest-dev` unless an explicit test endpoint is set.
  if (isDevDryRunDatabase(deps.databaseId, deps.cameloEndpoint)) {
    return {
      ok: true,
      dryRun: true,
      clientId: data.existingClientId || 'dry-run-client',
      clientName: data.clientName,
      clientCreated: !data.existingClientId,
      jobSiteId: 'dry-run-job-site',
      jobSiteName: data.jobSiteName,
      jobSiteAddress: data.jobSiteAddress,
      jobSiteNote: data.jobSiteNote?.trim() || null,
      scheduleId: data.scheduleId,
      scheduleName: null,
      initialCommentId: data.clientComment?.trim() ? 'dry-run-comment' : null,
      syncedAtIso: nowIso,
      syncedBy: deps.actorEmail,
    }
  }

  const token = resolveCameloToken(deps.cameloToken)
  if (!token) {
    throw new HttpsError('failed-precondition', 'Camelo API token is not configured on the server.')
  }

  const cameloOpts: CameloCallOptions = {
    token,
    endpoint: deps.cameloEndpoint,
    fetchImpl: deps.fetchImpl,
  }

  let clientId = data.existingClientId ?? ''
  let clientName = data.clientName
  let clientCreated = false

  if (!clientId) {
    try {
      const created = await createCameloClient(
        {
          name: data.clientName,
          email: data.email || null,
          phoneNumber: data.phoneNumber || null,
          billingAddress: data.billingAddress || null,
          clientNumber: data.clientNumber || null,
        },
        cameloOpts,
      )
      clientId = created.id
      clientName = created.name
      clientCreated = true
    } catch (err) {
      logError('[pushLeadToCamelo] createCameloClient failed:', err)
      throw new HttpsError(
        'unavailable',
        err instanceof Error ? err.message : 'Could not create the client in Camelo.',
      )
    }
  }

  let createdSite: Awaited<ReturnType<typeof createCameloJobSite>>
  try {
    createdSite = await createCameloJobSite(
      {
        name: data.jobSiteName,
        address: data.jobSiteAddress,
        geoLat: data.geoLat,
        geoLong: data.geoLong,
        scheduleIds: [data.scheduleId],
        clientIds: [clientId],
        note: data.jobSiteNote || null,
      },
      cameloOpts,
    )
  } catch (err) {
    logError('[pushLeadToCamelo] createCameloJobSite failed:', err)
    // Pass partialClientId back so the UI can retry by linking the already-created client without creating a duplicate.
    throw new HttpsError(
      'unavailable',
      err instanceof Error ? err.message : 'Could not create the job site in Camelo.',
      clientCreated ? { partialClientId: clientId, partialClientName: clientName } : undefined,
    )
  }

  let initialCommentId: string | null = null
  const commentText = data.clientComment?.trim() ?? ''
  if (commentText) {
    const attributed = `${commentText}\n(${deps.actorEmail}, via Fresh Nest)`
    try {
      const comment = await createCameloClientComment(clientId, attributed, cameloOpts)
      initialCommentId = comment.id
    } catch (err) {
      // Client + Job Site succeeded; log comment failure without rolling back or losing IDs.
      logError('[pushLeadToCamelo] initial client comment failed:', err)
    }
  }

  const cameloRecord = {
    clientId,
    clientName,
    clientCreated,
    jobSiteId: createdSite.id,
    jobSiteName: createdSite.name,
    jobSiteAddress: createdSite.address,
    jobSiteNote: createdSite.note,
    scheduleId: data.scheduleId,
    scheduleName: createdSite.scheduleName,
    geoLat: createdSite.geoLat,
    geoLong: createdSite.geoLong,
    geoSource: data.geoSource,
    initialCommentId,
    syncedAt: FieldValue.serverTimestamp(),
    syncedBy: deps.actorEmail,
    lastNoteSyncAt: null,
    lastNoteSyncBy: null,
  }

  await bookingRef.update({
    camelo: cameloRecord,
    lastChange: serverStamp(deps.actorEmail, {
      source: 'admin',
      reason: clientCreated
        ? `Synced won lead to Camelo (new client ${clientName} + job site ${createdSite.name})`
        : `Synced won lead to Camelo (linked existing client ${clientName} + job site ${createdSite.name})`,
    }),
  })

  return {
    ok: true,
    dryRun: false,
    clientId,
    clientName,
    clientCreated,
    jobSiteId: createdSite.id,
    jobSiteName: createdSite.name,
    jobSiteAddress: createdSite.address,
    jobSiteNote: createdSite.note,
    scheduleId: data.scheduleId,
    scheduleName: createdSite.scheduleName,
    initialCommentId,
    syncedAtIso: nowIso,
    syncedBy: deps.actorEmail,
  }
}

export async function runAddCameloClientNote(
  rawInput: unknown,
  deps: CameloHandlerDeps,
): Promise<AddCameloClientNoteResult> {
  const parsed = addClientNoteSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid client note payload.')
  }

  const { bookingId, content } = parsed.data
  const { bookingRef, booking } = await loadBookingAndNotes(deps.db, bookingId)
  const existing = readExistingSync(booking.camelo)
  if (!existing) {
    throw new HttpsError('failed-precondition', 'Sync this lead to Camelo before adding Camelo client notes.')
  }

  const nowIso = new Date((deps.now ?? Date.now)()).toISOString()
  if (isDevDryRunDatabase(deps.databaseId, deps.cameloEndpoint)) {
    return { ok: true, dryRun: true, commentId: 'dry-run-comment', syncedAtIso: nowIso }
  }

  const token = resolveCameloToken(deps.cameloToken)
  if (!token) {
    throw new HttpsError('failed-precondition', 'Camelo API token is not configured on the server.')
  }

  const attributed = `${content}\n(${deps.actorEmail}, via Fresh Nest)`
  let commentId: string
  try {
    const res = await createCameloClientComment(existing.clientId, attributed, {
      token,
      endpoint: deps.cameloEndpoint,
      fetchImpl: deps.fetchImpl,
    })
    commentId = res.id
  } catch (err) {
    logError('[addCameloClientNote] createCameloClientComment failed:', err)
    throw new HttpsError(
      'unavailable',
      err instanceof Error ? err.message : 'Could not save the client note in Camelo.',
    )
  }

  await bookingRef.update({
    'camelo.lastNoteSyncAt': FieldValue.serverTimestamp(),
    'camelo.lastNoteSyncBy': deps.actorEmail,
    lastChange: serverStamp(deps.actorEmail, {
      source: 'admin',
      reason: `Added Camelo client note (${existing.clientName || existing.clientId})`,
    }),
  })

  return { ok: true, dryRun: false, commentId, syncedAtIso: nowIso }
}

export async function runUpdateCameloJobSiteNote(
  rawInput: unknown,
  deps: CameloHandlerDeps,
): Promise<UpdateCameloJobSiteNoteResult> {
  const parsed = updateJobSiteNoteSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid job site note payload.')
  }

  const { bookingId, note } = parsed.data
  const { bookingRef, booking } = await loadBookingAndNotes(deps.db, bookingId)
  const existing = readExistingSync(booking.camelo)
  if (!existing) {
    throw new HttpsError('failed-precondition', 'Sync this lead to Camelo before updating its job site note.')
  }

  const nowIso = new Date((deps.now ?? Date.now)()).toISOString()
  if (isDevDryRunDatabase(deps.databaseId, deps.cameloEndpoint)) {
    return { ok: true, dryRun: true, jobSiteId: existing.jobSiteId, note, syncedAtIso: nowIso }
  }

  const token = resolveCameloToken(deps.cameloToken)
  if (!token) {
    throw new HttpsError('failed-precondition', 'Camelo API token is not configured on the server.')
  }

  let updatedNote = note
  try {
    const res = await updateCameloJobSiteNoteApi(existing.jobSiteId, note, {
      token,
      endpoint: deps.cameloEndpoint,
      fetchImpl: deps.fetchImpl,
    })
    updatedNote = res.note
  } catch (err) {
    logError('[updateCameloJobSiteNote] updateCameloJobSiteNote failed:', err)
    throw new HttpsError(
      'unavailable',
      err instanceof Error ? err.message : 'Could not update the job site note in Camelo.',
    )
  }

  await bookingRef.update({
    'camelo.jobSiteNote': updatedNote || null,
    'camelo.lastNoteSyncAt': FieldValue.serverTimestamp(),
    'camelo.lastNoteSyncBy': deps.actorEmail,
    lastChange: serverStamp(deps.actorEmail, {
      source: 'admin',
      reason: `Updated Camelo job site note (${existing.jobSiteName || existing.jobSiteId})`,
    }),
  })

  return { ok: true, dryRun: false, jobSiteId: existing.jobSiteId, note: updatedNote, syncedAtIso: nowIso }
}

// ── Exported Cloud Functions (Office-Only, Secret-Bound) ─────────────────────

export const prepareLeadForCamelo = onCall({ secrets: [CAMELO_TOKEN] }, async (request) => {
  const payload = (request.data ?? {}) as Record<string, unknown>
  const { db, databaseId } = getDbForRequest(payload.databaseId)
  await requireOffice(request.auth, db, 'prepare leads for Camelo')
  const actorEmail = request.auth?.token.email?.trim().toLowerCase() ?? 'office'
  return runPrepareLeadForCamelo(payload, { db, databaseId, actorEmail })
})

export const pushLeadToCamelo = onCall({ secrets: [CAMELO_TOKEN] }, async (request) => {
  const payload = (request.data ?? {}) as Record<string, unknown>
  const { db, databaseId } = getDbForRequest(payload.databaseId)
  await requireOffice(request.auth, db, 'sync won leads to Camelo')
  const actorEmail = request.auth?.token.email?.trim().toLowerCase() ?? 'office'
  return runPushLeadToCamelo(payload, { db, databaseId, actorEmail })
})

export const addCameloClientNote = onCall({ secrets: [CAMELO_TOKEN] }, async (request) => {
  const payload = (request.data ?? {}) as Record<string, unknown>
  const { db, databaseId } = getDbForRequest(payload.databaseId)
  await requireOffice(request.auth, db, 'add Camelo client notes')
  const actorEmail = request.auth?.token.email?.trim().toLowerCase() ?? 'office'
  return runAddCameloClientNote(payload, { db, databaseId, actorEmail })
})

export const updateCameloJobSiteNote = onCall({ secrets: [CAMELO_TOKEN] }, async (request) => {
  const payload = (request.data ?? {}) as Record<string, unknown>
  const { db, databaseId } = getDbForRequest(payload.databaseId)
  await requireOffice(request.auth, db, 'update Camelo job site notes')
  const actorEmail = request.auth?.token.email?.trim().toLowerCase() ?? 'office'
  return runUpdateCameloJobSiteNote(payload, { db, databaseId, actorEmail })
})
