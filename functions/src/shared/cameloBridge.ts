// AUTO-SYNCED FROM packages/shared/src/domain — DO NOT EDIT DIRECTLY.
/**
 * P3-E42: Won Lead to Camelo Bridge — pure domain types, client matcher, and note builders.
 *
 * Pure module (zero Firebase imports) so `functions/scripts/sync-shared.cjs` copies it cleanly
 * into `functions/src/shared/cameloBridge.ts` for both apps and Cloud Functions.
 */

export type CameloGeoSource = 'nominatim' | 'manual' | 'fallback'

export const FALLBACK_CORNWALL_COORDS = {
  lat: 45.0213,
  lon: -74.7303,
} as const

export const DEFAULT_CAMELO_SCHEDULE_NAME = 'Clients'

/** Server-written Camelo sync record stored on `bookings/{bookingId}.camelo`. */
export interface BookingCameloSync {
  clientId: string
  clientName: string
  clientCreated: boolean
  jobSiteId: string
  jobSiteName: string
  jobSiteAddress: string
  jobSiteNote: string | null
  scheduleId: string
  scheduleName: string | null
  geoLat: number
  geoLong: number
  geoSource: CameloGeoSource
  initialCommentId: string | null
  syncedAt: unknown
  syncedBy: string
  lastNoteSyncAt?: unknown | null
  lastNoteSyncBy?: string | null
}

export interface CameloClientSummary {
  id: string
  name: string
  email: string | null
  phoneNumber: string | null
  clientNumber: string | null
  billingAddress: string | null
}

export interface CameloScheduleSummary {
  id: string
  name: string
}

export type CameloMatchReason = 'email' | 'phone' | 'name'

export interface CameloClientMatch {
  client: CameloClientSummary
  reasons: CameloMatchReason[]
  score: number
}

export interface PrepareLeadNoteItem {
  id: string
  kind: string
  body: string
  by: string
  atIso: string
}

export interface PrepareLeadForCameloResult {
  bookingId: string
  alreadySynced: boolean
  existingSync: {
    clientId: string
    clientName: string
    jobSiteId: string
    jobSiteName: string
    jobSiteAddress: string
    jobSiteNote: string | null
    scheduleName: string | null
    syncedAtIso: string | null
    syncedBy: string
  } | null
  isDevDryRun: boolean
  matches: CameloClientMatch[]
  clients: CameloClientSummary[]
  schedules: CameloScheduleSummary[]
  defaultScheduleId: string | null
  geocode: {
    found: boolean
    lat: number | null
    lon: number | null
    source: CameloGeoSource | null
  }
  defaults: {
    clientName: string
    email: string
    phoneNumber: string
    billingAddress: string
    jobSiteName: string
    jobSiteAddress: string
    jobSiteNote: string
    clientComment: string
  }
  leadNotes: PrepareLeadNoteItem[]
}

export interface PushLeadToCameloInput {
  bookingId: string
  /** Existing Camelo client ID to link, or null/omitted to create a new Camelo Client. */
  existingClientId?: string | null
  clientName: string
  email?: string | null
  phoneNumber?: string | null
  billingAddress?: string | null
  clientNumber?: string | null
  jobSiteName: string
  jobSiteAddress: string
  jobSiteNote?: string | null
  scheduleId: string
  geoLat: number
  geoLong: number
  geoSource: CameloGeoSource
  clientComment?: string | null
}

export interface PushLeadToCameloResult {
  ok: true
  dryRun: boolean
  clientId: string
  clientName: string
  clientCreated: boolean
  jobSiteId: string
  jobSiteName: string
  jobSiteAddress: string
  jobSiteNote: string | null
  scheduleId: string
  scheduleName: string | null
  initialCommentId: string | null
  syncedAtIso: string
  syncedBy: string
}

export interface AddCameloClientNoteInput {
  bookingId: string
  content: string
}

export interface AddCameloClientNoteResult {
  ok: true
  dryRun: boolean
  commentId: string
  syncedAtIso: string
}

export interface UpdateCameloJobSiteNoteInput {
  bookingId: string
  note: string
}

export interface UpdateCameloJobSiteNoteResult {
  ok: true
  dryRun: boolean
  jobSiteId: string
  note: string
  syncedAtIso: string
}

/** Normalizes a phone string to its last 10 digits for reliable North American matching. */
export function normalizePhoneDigits(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D+/g, '')
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return digits
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Matches a Fresh Nest booking against existing Camelo clients by email (highest weight),
 * 10-digit phone number, and normalized full name. Returns matches sorted highest score first.
 */
export function matchCameloClients(
  lead: { firstName?: string; lastName?: string; email?: string | null; phone?: string | null },
  clients: readonly CameloClientSummary[],
): CameloClientMatch[] {
  const leadEmail = normalizeText(lead.email)
  const leadPhone = normalizePhoneDigits(lead.phone)
  const leadName = normalizeText(`${lead.firstName ?? ''} ${lead.lastName ?? ''}`)

  const matches: CameloClientMatch[] = []
  for (const client of clients) {
    const reasons: CameloMatchReason[] = []
    let score = 0

    const cEmail = normalizeText(client.email)
    if (leadEmail && cEmail && leadEmail === cEmail) {
      reasons.push('email')
      score += 100
    }

    const cPhone = normalizePhoneDigits(client.phoneNumber)
    if (leadPhone.length >= 10 && cPhone.length >= 10 && leadPhone === cPhone) {
      reasons.push('phone')
      score += 70
    }

    const cName = normalizeText(client.name)
    if (leadName && cName && (leadName === cName || (leadName.length >= 4 && cName.includes(leadName)))) {
      reasons.push('name')
      score += leadName === cName ? 50 : 25
    }

    if (reasons.length > 0) {
      matches.push({ client, reasons, score })
    }
  }

  return matches.sort(
    (a, b) => b.score - a.score || a.client.name.localeCompare(b.client.name, undefined, { sensitivity: 'base' }),
  )
}

/** Picks Camelo's "Clients" schedule by default (case-insensitive), falling back to the first schedule. */
export function pickDefaultCameloScheduleId(schedules: readonly CameloScheduleSummary[]): string | null {
  if (schedules.length === 0) return null
  const preferred = schedules.find(
    (s) => normalizeText(s.name) === normalizeText(DEFAULT_CAMELO_SCHEDULE_NAME),
  )
  return (preferred ?? schedules[0]).id
}

export interface LeadNoteSummarySource {
  firstName?: string
  lastName?: string
  language?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  serviceType?: string
  frequency?: string
  preferredDate?: string
  pets?: boolean
  isAirbnb?: boolean
  addOns?: readonly string[]
  notes?: string | null
  leadSource?: string
  quotedPriceCents?: number | null
}

/**
 * Builds the default cleaner-visible `jobSite.note` (shown on shifts & My week).
 * Uses ONLY booking property/intake details — NEVER reads or embeds `agreements/{id}/private/access`
 * codes (COMPLIANCE.md §2).
 */
export function buildDefaultJobSiteNote(lead: LeadNoteSummarySource): string {
  const lines: string[] = []
  const userNotes = (lead.notes ?? '').trim()
  if (userNotes) lines.push(userNotes)

  const tags: string[] = []
  if (lead.pets) tags.push('Pets on site (use pet-safe products)')
  if (lead.isAirbnb) tags.push('Airbnb turnover')
  if (lead.language === 'fr') tags.push('Preferred language: FR')
  if (tags.length > 0) lines.push(tags.join(' · '))

  const homeBits: string[] = []
  if (lead.propertyType) homeBits.push(lead.propertyType)
  if (typeof lead.bedrooms === 'number' && lead.bedrooms > 0) homeBits.push(`${lead.bedrooms} bed`)
  if (typeof lead.bathrooms === 'number' && lead.bathrooms > 0) homeBits.push(`${lead.bathrooms} bath`)
  if (Array.isArray(lead.addOns) && lead.addOns.length > 0) homeBits.push(`Add-ons: ${lead.addOns.join(', ')}`)
  if (homeBits.length > 0) lines.push(`Property: ${homeBits.join(', ')}`)

  return lines.join('\n').trim().slice(0, 2000)
}

/**
 * Builds the default office-visible Camelo Client comment (`createComment`, `commentableType: CLIENT`).
 * Summarizes the won lead's intake metadata and optionally appends selected P3-E40 contact log entries.
 */
export function buildDefaultClientComment(
  lead: LeadNoteSummarySource,
  selectedLeadNotes: readonly Pick<PrepareLeadNoteItem, 'kind' | 'body' | 'by'>[] = [],
): string {
  const lines: string[] = ['Fresh Nest Sales Pipeline — Won Lead']

  const summaryBits: string[] = []
  if (lead.serviceType) summaryBits.push(`Service: ${lead.serviceType}`)
  if (lead.frequency) summaryBits.push(`Frequency: ${lead.frequency}`)
  if (lead.preferredDate) summaryBits.push(`Preferred start: ${lead.preferredDate}`)
  if (summaryBits.length > 0) lines.push(summaryBits.join(' · '))

  const metaBits: string[] = []
  if (lead.language) metaBits.push(`Language: ${lead.language.toUpperCase()}`)
  if (lead.leadSource) metaBits.push(`Source: ${lead.leadSource}`)
  if (typeof lead.quotedPriceCents === 'number' && Number.isFinite(lead.quotedPriceCents) && lead.quotedPriceCents > 0) {
    metaBits.push(`Quoted: $${(lead.quotedPriceCents / 100).toFixed(2)} CAD`)
  }
  if (metaBits.length > 0) lines.push(metaBits.join(' · '))

  if (selectedLeadNotes.length > 0) {
    lines.push('')
    lines.push('Pipeline contact notes:')
    for (const note of selectedLeadNotes) {
      const cleanBody = note.body.trim().replace(/\s+/g, ' ')
      if (cleanBody) lines.push(`- [${note.kind}] ${cleanBody} (${note.by})`)
    }
  }

  return lines.join('\n').trim().slice(0, 1900)
}
