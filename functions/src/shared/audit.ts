// AUTO-SYNCED FROM packages/shared/src/domain — DO NOT EDIT DIRECTLY.
/**
 * P3-E37 (W0-3): audit everywhere — the pure diff engine.
 *
 * Every audited record carries a `lastChange` stamp written with each save (who, when, which app,
 * optional reason / override type). One Firestore trigger per audited collection hands the record
 * before and after the write to `buildAuditEntry`, which returns the `auditLog` entry to write, or
 * null when no watched field changed. No Firebase imports here: this file is synced into
 * `functions/src/shared` (functions/scripts/sync-shared.cjs).
 */

export type AuditSource = 'admin' | 'staff_app' | 'customer' | 'public_form' | 'system'
export type AuditAction = 'create' | 'update' | 'delete'

export const AUDIT_SOURCES: readonly AuditSource[] = ['admin', 'staff_app', 'customer', 'public_form', 'system']

/** Stamp written on every audited record by the app or server code making the change. */
export interface LastChange {
  /** Lowercased email of the person; `public` for the quote form; `system:<function>` for server code. */
  by: string
  /** serverTimestamp() / request time. */
  at: unknown
  source: AuditSource
  reason?: string | null
  overrideType?: string | null
}

export interface AuditFieldChange {
  field: string
  before: unknown
  after: unknown
}

/** The `auditLog` document a trigger writes (minus `changedAt`, which the trigger sets). */
export interface AuditEntryDraft {
  collection: string
  documentId: string
  action: AuditAction
  actor: string
  source: AuditSource
  changes: AuditFieldChange[]
  reason: string | null
  overrideType: string | null
  recordLabel: string | null
  /** Delete only: the record as it was (trimmed). */
  snapshot: Record<string, unknown> | null
  /** Kept for the pre-P3-E37 Audit Logs table: actor, field names, single-change values. */
  changedBy: string
  field: string
  oldValue: unknown
  newValue: unknown
}

type Doc = Record<string, unknown>

interface AuditCollectionConfig {
  /** Watched paths (dot notation for nested fields). Changes to other fields are not audited. */
  fields: readonly string[]
  label: (doc: Doc) => string | null
  /** Fields dropped from the delete snapshot (large or non-informative). */
  omitFromSnapshot?: readonly string[]
}

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))
const joinLabel = (...parts: unknown[]): string | null => {
  const text = parts.map(str).map((p) => p.trim()).filter(Boolean).join(' · ')
  return text || null
}

export const AUDIT_CONFIG: Readonly<Record<string, AuditCollectionConfig>> = {
  bookings: {
    fields: [
      'status', 'preferredDate', 'address', 'serviceType', 'frequency', 'addOns', 'notes',
      'assignedTo', 'preferredCleaner', 'checklistTemplateId', 'firstName', 'lastName', 'email', 'phone',
    ],
    label: (d) => joinLabel(`${str(d.firstName)} ${str(d.lastName)}`, d.preferredDate),
  },
  jobs: {
    fields: [
      'status', 'assignedTo', 'scheduledDate', 'scheduledStartTime', 'scheduledEndTime', 'clientAddress',
      'clientNotes', 'checklistName', 'checklistSource', 'checklistTasks', 'checkedInAt', 'completedAt', 'cancelledAt',
    ],
    label: (d) => joinLabel(d.clientName, d.scheduledDate),
    omitFromSnapshot: ['photos', 'checklistCompletions'],
  },
  staff: {
    fields: [
      'status', 'role', 'firstName', 'lastName', 'email', 'phone', 'preferences.language',
      'financials.monthlyEarningsLimit', 'compliance.acceptedTermsVersion', 'constraints.transportMode',
      'constraints.transitBufferMinutes', 'constraints.blockedWindows',
    ],
    label: (d) => joinLabel(`${str(d.firstName)} ${str(d.lastName)}`),
  },
  checklistTemplates: {
    fields: ['name', 'serviceType', 'tasks', 'active'],
    label: (d) => joinLabel(d.name),
  },
  payRates: {
    fields: ['role', 'amount', 'currency', 'effectiveFrom', 'effectiveTo'],
    label: (d) => joinLabel(d.role),
  },
  galleryPairs: {
    fields: ['serviceKey', 'captionEn', 'captionFr', 'published', 'featured', 'consentConfirmed'],
    label: (d) => joinLabel(d.captionEn),
  },
  reviews: {
    fields: ['approved', 'rejected'],
    label: (d) => joinLabel(d.name, d.location),
  },
}

export const AUDITED_COLLECTIONS = Object.keys(AUDIT_CONFIG)

/** A delete is credited to the stamp's author only if it was stamped this recently (stamp-then-delete). */
export const DELETE_STAMP_WINDOW_MS = 5 * 60 * 1000
const MAX_TEXT = 1000
const MAX_JSON = 5000

export function getPath(doc: Doc | null | undefined, path: string): unknown {
  let cur: unknown = doc
  for (const key of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Doc)[key]
  }
  return cur
}

/** Milliseconds for Firestore Timestamps (client or admin SDK), Dates and `{seconds, nanoseconds}`. */
export function toMillis(value: unknown): number | null {
  if (value == null) return null
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object') {
    const v = value as { toMillis?: () => number; seconds?: number; _seconds?: number; nanoseconds?: number; _nanoseconds?: number }
    if (typeof v.toMillis === 'function') return v.toMillis()
    const seconds = v.seconds ?? v._seconds
    if (typeof seconds === 'number') return seconds * 1000 + Math.floor((v.nanoseconds ?? v._nanoseconds ?? 0) / 1e6)
  }
  return null
}

/** Stable comparison key: timestamps by millisecond, objects with sorted keys. */
function canonical(value: unknown): string {
  const ms = toMillis(value)
  if (ms !== null && typeof value === 'object') return `@t${ms}`
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const obj = value as Doc
    return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

/** Value as stored in the audit entry: undefined → null, long text cut, oversized structures summarised. */
export function auditValue(value: unknown): unknown {
  if (value === undefined) return null
  if (typeof value === 'string') return value.length > MAX_TEXT ? `${value.slice(0, MAX_TEXT)}…` : value
  if (value && typeof value === 'object' && toMillis(value) === null) {
    try {
      if (JSON.stringify(value).length > MAX_JSON) return { truncated: true }
    } catch {
      return { truncated: true }
    }
  }
  return value
}

function readStamp(doc: Doc | null | undefined): LastChange | null {
  const raw = doc?.lastChange
  if (!raw || typeof raw !== 'object') return null
  const stamp = raw as Partial<LastChange>
  if (typeof stamp.by !== 'string' || !stamp.by) return null
  const source = AUDIT_SOURCES.includes(stamp.source as AuditSource) ? (stamp.source as AuditSource) : 'system'
  return { by: stamp.by, at: stamp.at, source, reason: stamp.reason ?? null, overrideType: stamp.overrideType ?? null }
}

export const UNKNOWN_ACTOR = 'system:unknown'

/**
 * Who made this write. The stamp counts only if this write set it (its time changed); otherwise
 * a later server change would be credited to the last person who edited by hand.
 */
export function resolveActor(
  before: Doc | null,
  after: Doc | null,
  nowMs: number,
): Pick<LastChange, 'by' | 'source' | 'reason' | 'overrideType'> {
  const unknown = { by: UNKNOWN_ACTOR, source: 'system' as AuditSource, reason: null, overrideType: null }
  if (after) {
    const stamp = readStamp(after)
    if (!stamp) return unknown
    const prev = readStamp(before)
    const fresh = !prev || toMillis(prev.at) !== toMillis(stamp.at) || (toMillis(stamp.at) === null && prev.by !== stamp.by)
    return fresh ? stamp : unknown
  }
  // Delete: credit whoever stamped the record just before deleting it.
  const stamp = readStamp(before)
  const at = toMillis(stamp?.at)
  return stamp && at !== null && nowMs - at <= DELETE_STAMP_WINDOW_MS ? stamp : unknown
}

function snapshotOf(doc: Doc, omit: readonly string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(doc)) {
    if (key === 'lastChange' || omit.includes(key)) continue
    out[key] = auditValue(value)
  }
  return out
}

/**
 * Builds the audit entry for one write, or null when nothing watched changed (e.g. a save that
 * only touched unwatched fields, or a re-save with identical values).
 */
export function buildAuditEntry(params: {
  collection: string
  documentId: string
  before: Doc | null | undefined
  after: Doc | null | undefined
  nowMs: number
}): AuditEntryDraft | null {
  const config = AUDIT_CONFIG[params.collection]
  if (!config) return null
  const before = params.before ?? null
  const after = params.after ?? null
  if (!before && !after) return null
  const action: AuditAction = !before ? 'create' : !after ? 'delete' : 'update'

  const changes: AuditFieldChange[] = []
  if (action !== 'delete') {
    for (const field of config.fields) {
      const b = getPath(before, field)
      const a = getPath(after, field)
      if (action === 'create' && a === undefined) continue
      if (canonical(b) === canonical(a)) continue
      changes.push({ field, before: auditValue(b), after: auditValue(a) })
    }
    if (changes.length === 0) return null
  }

  const actor = resolveActor(before, after, params.nowMs)
  const single = changes.length === 1 ? changes[0] : null
  return {
    collection: params.collection,
    documentId: params.documentId,
    action,
    actor: actor.by,
    source: actor.source,
    changes,
    reason: actor.reason ?? null,
    overrideType: actor.overrideType ?? null,
    recordLabel: config.label((after ?? before) as Doc),
    snapshot: action === 'delete' ? snapshotOf(before as Doc, config.omitFromSnapshot) : null,
    changedBy: actor.by,
    field: action === 'delete' ? '(deleted)' : changes.map((c) => c.field).join(', '),
    oldValue: single ? single.before : null,
    newValue: single ? single.after : null,
  }
}
