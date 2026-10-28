import type { TFunction } from 'i18next'
import type { AuditEntry } from '@/types'

// P3-E37: how audit entries read in the admin panel (History sections and the Audit Logs tab).
// Works for both shapes: P3-E37 entries (`changes`, `actor`, `source`, `action`) and the older
// one-field rows (`field`, `oldValue`, `newValue`, `changedBy`).

export interface DisplayChange {
  field: string
  before: unknown
  after: unknown
}

export function entryChanges(entry: AuditEntry): DisplayChange[] {
  if (Array.isArray(entry.changes)) return entry.changes
  if (entry.field && entry.field !== '(deleted)') {
    return [{ field: entry.field, before: entry.oldValue, after: entry.newValue }]
  }
  return []
}

export const entryActor = (entry: AuditEntry): string => entry.actor ?? entry.changedBy

export const localeOf = (language: string): string => (language.startsWith('fr') ? 'fr-CA' : 'en-CA')

/** The person or process behind a change, in plain words. */
export function actorLabel(actor: string, t: TFunction): string {
  if (actor === 'system:unknown') return t('admin.audit.actor.unknown')
  if (actor === 'public') return t('admin.audit.actor.public')
  if (actor.startsWith('system:')) return t('admin.audit.actor.system', { name: actor.slice('system:'.length) })
  return actor
}

export function sourceLabel(source: string | undefined, t: TFunction): string | null {
  return source ? t(`admin.audit.sources.${source}`, { defaultValue: source }) : null
}

/** i18next treats dots as nesting, so nested paths use underscores in the locale files. */
export function fieldLabel(field: string, t: TFunction): string {
  return t(`admin.audit.fields.${field.replace(/\./g, '_')}`, { defaultValue: field })
}

export function collectionLabel(collection: string, t: TFunction): string {
  return t(`admin.audit.collections.${collection}`, { defaultValue: collection })
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date) return value
  if (value && typeof value === 'object') {
    const v = value as { toDate?: () => Date; seconds?: number }
    if (typeof v.toDate === 'function') return v.toDate()
    if (typeof v.seconds === 'number') return new Date(v.seconds * 1000)
  }
  return null
}

/** A before/after value as short readable text. */
export function formatAuditValue(value: unknown, t: TFunction, language: string): string {
  if (value === null || value === undefined || value === '') return t('admin.audit.values.empty')
  if (typeof value === 'boolean') return t(value ? 'admin.audit.values.yes' : 'admin.audit.values.no')
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  const date = asDate(value)
  if (date) return date.toLocaleString(localeOf(language))
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) return value.join(', ')
    return t('admin.audit.values.items', { count: value.length })
  }
  if (typeof value === 'object' && (value as { truncated?: boolean }).truncated) return t('admin.audit.values.truncated')
  try {
    return JSON.stringify(value)
  } catch {
    return t('admin.audit.values.truncated')
  }
}

/** Local calendar day as YYYY-MM-DD, to compare with <input type="date"> values. */
export const dayOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function matchesSearch(log: AuditEntry, query: string): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true
  const haystack = [
    entryActor(log),
    log.reason,
    log.documentId,
    log.recordLabel,
    log.collection,
    ...entryChanges(log).map((c) => c.field),
  ]
  return haystack.some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
}
