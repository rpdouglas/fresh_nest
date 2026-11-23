/**
 * P3-E40 (Strategy 3): Sales Pipeline — pure domain model, transitions,
 * America/Toronto business-hours SLA calculations, priority sorting,
 * area extraction for PII minimization, and KPI aggregation.
 *
 * Pure functions only — zero Firebase / browser / Node dependencies so
 * `functions/scripts/sync-shared.cjs` syncs this directly into `functions/src/shared/pipeline.ts`.
 */

import {
  BUSINESS_TZ,
  addDays,
  calendarDateOf,
  dayOfWeek,
  zonedWallTimeToInstant,
  type CalendarDate,
} from './time'
import { toMillis } from './audit'

export const PIPELINE_STAGES = [
  'new',
  'contacted',
  'site_visit',
  'quoted',
  'won',
  'lost',
] as const
export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const OPEN_PIPELINE_STAGES: readonly PipelineStage[] = [
  'new',
  'contacted',
  'site_visit',
  'quoted',
]

export const CLOSED_PIPELINE_STAGES: readonly PipelineStage[] = ['won', 'lost']

/** Stages a non-office owner (`cleaner`, `lead`, `supervisor`, `contractor`) may set. `won` is Office-only. */
export const NON_OFFICE_ALLOWED_STAGES: readonly PipelineStage[] = [
  'new',
  'contacted',
  'site_visit',
  'quoted',
  'lost',
]

export const LEAD_OWNER_ROLES = [
  'owner',
  'manager',
  'cleaner',
  'lead',
  'supervisor',
  'contractor',
] as const
export type LeadOwnerRole = (typeof LEAD_OWNER_ROLES)[number]

export const LOST_REASONS = [
  'no_response',
  'price',
  'chose_competitor',
  'date_unavailable',
  'outside_area',
  'duplicate_or_spam',
  'other',
] as const
export type LostReason = (typeof LOST_REASONS)[number]

export const LEAD_NOTE_KINDS = ['call', 'sms', 'email', 'note'] as const
export type LeadNoteKind = (typeof LEAD_NOTE_KINDS)[number]

/** Note kinds that count as outbound/inbound client contact and auto-stamp `firstContactAt`. */
export const CONTACT_NOTE_KINDS: readonly LeadNoteKind[] = ['call', 'sms', 'email']

export const DEFAULT_LEAD_FIRST_CONTACT_MINUTES = 120
export const DEFAULT_SITE_VISIT_FIRST_CONTACT_MINUTES = 60

export interface BookingPipeline {
  stage: PipelineStage
  ownerEmail: string | null
  ownerRole: LeadOwnerRole | null
  ownerAssignedAt?: Date | null
  ownerAssignedBy?: string | null
  needsSiteVisit: boolean
  /** Calendar date YYYY-MM-DD in America/Toronto (ADR-020). */
  nextFollowUpDate?: CalendarDate | null
  firstContactAt?: Date | null
  /** Integer cents (ADR-020); internal only — never shown on public pages (P3-E29). */
  quotedPriceCents?: number | null
  quoteSentAt?: Date | null
  closedAt?: Date | null
  lostReason?: LostReason | null
  lostNote?: string | null
}

export interface LeadNote {
  id?: string
  kind: LeadNoteKind
  body: string
  by: string
  at: Date
}

/**
 * Strictly PII-minimized lead projection returned to non-office owners by `listMyLeads` / `getMyLead`.
 * Full street address is present ONLY when `needsSiteVisit` is true or `stage === 'site_visit'`
 * (COMPLIANCE.md §2, owner-approved 2026-11-23).
 */
export interface StaffLeadSummary {
  bookingId: string
  firstName: string
  lastName: string
  phone: string
  email: string
  language: 'en' | 'fr'
  serviceType: string
  frequency: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  preferredDate: string
  /** Full street address when `needsSiteVisit || stage === 'site_visit'`; otherwise area/city only. */
  locationDisplay: string
  hasFullAddress: boolean
  notes: string
  isAirbnb: boolean
  createdAtIso: string
  pipeline: {
    stage: PipelineStage
    ownerEmail: string | null
    ownerRole: LeadOwnerRole | null
    needsSiteVisit: boolean
    nextFollowUpDate: CalendarDate | null
    firstContactAtIso: string | null
    quotedPriceCents: number | null
    quoteSentAtIso: string | null
    closedAtIso: string | null
    lostReason: LostReason | null
    lostNote: string | null
  }
}

export interface StaffLeadNoteDto {
  id: string
  kind: LeadNoteKind
  body: string
  by: string
  atIso: string
}

export interface StaffLeadDetail extends StaffLeadSummary {
  leadNotes: StaffLeadNoteDto[]
}

export interface PipelineKpis {
  openByStage: Record<'new' | 'contacted' | 'site_visit' | 'quoted', number>
  openTotal: number
  wonCount: number
  lostCount: number
  overdueCount: number
  medianFirstContactBusinessMinutes: number | null
  wonQuotedValueCents: number
  conversionBySource: Array<{
    source: string
    total: number
    won: number
    lost: number
    open: number
    conversionRate: number
  }>
  conversionByOwner: Array<{
    ownerEmail: string
    total: number
    won: number
    lost: number
    open: number
    conversionRate: number
  }>
  lostReasons: Array<{ reason: LostReason; count: number }>
}

export function isOpenPipelineStage(stage: PipelineStage): boolean {
  return (OPEN_PIPELINE_STAGES as readonly string[]).includes(stage)
}

export function isClosedPipelineStage(stage: PipelineStage): boolean {
  return (CLOSED_PIPELINE_STAGES as readonly string[]).includes(stage)
}

export function isValidPipelineStage(value: unknown): value is PipelineStage {
  return typeof value === 'string' && (PIPELINE_STAGES as readonly string[]).includes(value)
}

export function isValidLostReason(value: unknown): value is LostReason {
  return typeof value === 'string' && (LOST_REASONS as readonly string[]).includes(value)
}

export function isValidLeadNoteKind(value: unknown): value is LeadNoteKind {
  return typeof value === 'string' && (LEAD_NOTE_KINDS as readonly string[]).includes(value)
}

export function isValidLeadOwnerRole(value: unknown): value is LeadOwnerRole {
  return typeof value === 'string' && (LEAD_OWNER_ROLES as readonly string[]).includes(value)
}

export function isRecurringRenewalBooking(booking: { createdBy?: string | null }): boolean {
  return booking.createdBy === 'system:recurring-renewal'
}

/** Q4 (approved 2026-11-23): Commercial and Post-Construction default to requiring an in-person site visit. */
export function defaultNeedsSiteVisit(serviceType: string | undefined | null): boolean {
  return serviceType === 'commercial' || serviceType === 'postconstruction'
}

/**
 * Fallback pipeline stage for legacy bookings written before P3-E40 back-fill.
 */
export function inferPipelineStageFromBooking(booking: {
  status?: string
  pipeline?: { stage?: PipelineStage } | null
}): PipelineStage {
  if (booking.pipeline?.stage && isValidPipelineStage(booking.pipeline.stage)) {
    return booking.pipeline.stage
  }
  if (booking.status === 'confirmed' || booking.status === 'completed') return 'won'
  if (booking.status === 'cancelled') return 'lost'
  return 'new'
}

/**
 * Maps a pipeline stage change to the corresponding `bookings.status` update (or null if unchanged).
 */
export function bookingStatusForPipelineStage(
  stage: PipelineStage,
): 'confirmed' | 'cancelled' | null {
  if (stage === 'won') return 'confirmed'
  if (stage === 'lost') return 'cancelled'
  return null
}

/**
 * Business hours window per day of week (0 = Sun … 6 = Sat) in `America/Toronto` (Q3, approved 2026-11-23):
 * Mon–Fri 08:00–18:00, Sat 09:00–15:00, Sun closed.
 */
export function businessWindowForDay(dow: number): { start: string; end: string } | null {
  if (dow >= 1 && dow <= 5) return { start: '08:00', end: '18:00' }
  if (dow === 6) return { start: '09:00', end: '15:00' }
  return null
}

/**
 * Exact elapsed business minutes between `start` and `end` in `timeZone` (default `America/Toronto`).
 * DST-safe because daily bounds are resolved via `zonedWallTimeToInstant`.
 */
export function businessMinutesBetween(
  start: Date,
  end: Date,
  timeZone: string = BUSINESS_TZ,
): number {
  const startMs = start.getTime()
  const endMs = end.getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0
  }

  let totalMs = 0
  let curDate = calendarDateOf(start, timeZone)
  const endDate = calendarDateOf(end, timeZone)

  // Guard against degenerate multi-decade spans (cap at 3660 days = ~10 years)
  let safety = 0
  while (curDate <= endDate && safety < 3660) {
    safety++
    const window = businessWindowForDay(dayOfWeek(curDate))
    if (window) {
      const winStart = zonedWallTimeToInstant(curDate, window.start, timeZone).getTime()
      const winEnd = zonedWallTimeToInstant(curDate, window.end, timeZone).getTime()
      const overlapStart = Math.max(startMs, winStart)
      const overlapEnd = Math.min(endMs, winEnd)
      if (overlapEnd > overlapStart) {
        totalMs += overlapEnd - overlapStart
      }
    }
    if (curDate === endDate) break
    curDate = addDays(curDate, 1)
  }

  return Math.floor(totalMs / 60_000)
}

export interface LeadSlaStatus {
  isOverdue: boolean
  overdueReason: 'first_contact' | 'follow_up' | null
  isDueToday: boolean
  elapsedBusinessMinutes: number
  targetMinutes: number
  remainingBusinessMinutes: number
}

export function computeLeadSlaStatus(params: {
  stage: PipelineStage
  createdAt: Date | unknown
  firstContactAt?: Date | unknown | null
  needsSiteVisit?: boolean
  nextFollowUpDate?: CalendarDate | null
  now?: Date
  firstContactTargetMinutes?: number
  siteVisitTargetMinutes?: number
  timeZone?: string
}): LeadSlaStatus {
  const now = params.now ?? new Date()
  const tz = params.timeZone ?? BUSINESS_TZ
  const targetMinutes = params.needsSiteVisit
    ? (params.siteVisitTargetMinutes ?? DEFAULT_SITE_VISIT_FIRST_CONTACT_MINUTES)
    : (params.firstContactTargetMinutes ?? DEFAULT_LEAD_FIRST_CONTACT_MINUTES)

  const createdMs = toMillis(params.createdAt)
  const createdDate = createdMs !== null ? new Date(createdMs) : now
  const firstContactMs = toMillis(params.firstContactAt)
  const endForFirstContact = firstContactMs !== null ? new Date(firstContactMs) : now
  const elapsedBusinessMinutes = businessMinutesBetween(createdDate, endForFirstContact, tz)
  const remainingBusinessMinutes = targetMinutes - elapsedBusinessMinutes

  if (isClosedPipelineStage(params.stage)) {
    return {
      isOverdue: false,
      overdueReason: null,
      isDueToday: false,
      elapsedBusinessMinutes,
      targetMinutes,
      remainingBusinessMinutes,
    }
  }

  // 1. Uncontacted new lead past business-hours SLA target
  if (params.stage === 'new' && firstContactMs === null && elapsedBusinessMinutes >= targetMinutes) {
    return {
      isOverdue: true,
      overdueReason: 'first_contact',
      isDueToday: false,
      elapsedBusinessMinutes,
      targetMinutes,
      remainingBusinessMinutes,
    }
  }

  // 2. Next follow-up date check (Toronto calendar date)
  const today = calendarDateOf(now, tz)
  const followUp = params.nextFollowUpDate?.trim() || null
  if (followUp && /^\d{4}-\d{2}-\d{2}$/.test(followUp)) {
    if (followUp < today) {
      return {
        isOverdue: true,
        overdueReason: 'follow_up',
        isDueToday: false,
        elapsedBusinessMinutes,
        targetMinutes,
        remainingBusinessMinutes,
      }
    }
    if (followUp === today) {
      return {
        isOverdue: false,
        overdueReason: null,
        isDueToday: true,
        elapsedBusinessMinutes,
        targetMinutes,
        remainingBusinessMinutes,
      }
    }
  }

  return {
    isOverdue: false,
    overdueReason: null,
    isDueToday: false,
    elapsedBusinessMinutes,
    targetMinutes,
    remainingBusinessMinutes,
  }
}

/**
 * Extracts city/area/postal prefix from a full address for PII minimization when a non-office
 * lead owner does not have a site visit (COMPLIANCE.md §2, P3-E40).
 */
export function extractLeadArea(address: string | undefined | null): string {
  const raw = (address ?? '').trim()
  if (!raw) return 'Cornwall area'
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length >= 2) {
    // Drop leading street segment (e.g. "123 Main St, Cornwall, ON K6H 1A1" -> "Cornwall, ON")
    const areaParts = parts.slice(1).map((seg) =>
      // Redact full Canadian postal code to FSA (first 3 chars) if present
      seg.replace(/\b([A-Za-z]\d[A-Za-z])\s*\d[A-Za-z]\d\b/g, '$1'),
    )
    return areaParts.join(', ')
  }
  // Single-segment address (e.g. Cornwall Island / Akwesasne descriptive note): strip leading house numbers
  const stripped = raw
    .replace(/^\d+[A-Za-z-]?\s+/, '')
    .replace(/\b([A-Za-z]\d[A-Za-z])\s*\d[A-Za-z]\d\b/g, '$1')
  // If it looks like a street address with no comma, avoid leaking street name
  if (/\b(st|street|ave|avenue|rd|road|dr|drive|blvd|ln|lane|cres|ct|court|rue|ch|chemin)\b/i.test(stripped)) {
    return 'Local service area'
  }
  return stripped || 'Local service area'
}

export interface PrioritySortableLead {
  createdAt: Date | unknown
  status?: string
  pipeline?: {
    stage?: PipelineStage
    needsSiteVisit?: boolean
    nextFollowUpDate?: CalendarDate | null
    firstContactAt?: Date | unknown | null
  } | null
}

/**
 * Sorts leads by action priority:
 * 1. Open overdue leads (oldest / most overdue first)
 * 2. Open leads due today
 * 3. Open `new` leads (oldest first)
 * 4. Other open leads (earliest follow-up date, then oldest createdAt)
 * 5. Closed leads (`won` / `lost`, newest first)
 */
export function sortLeadsByPriority<T extends PrioritySortableLead>(
  leads: readonly T[],
  options: {
    now?: Date
    firstContactTargetMinutes?: number
    siteVisitTargetMinutes?: number
    timeZone?: string
  } = {},
): T[] {
  const now = options.now ?? new Date()
  const score = (lead: T) => {
    const stage = inferPipelineStageFromBooking(lead)
    const sla = computeLeadSlaStatus({
      stage,
      createdAt: lead.createdAt,
      firstContactAt: lead.pipeline?.firstContactAt ?? null,
      needsSiteVisit: Boolean(lead.pipeline?.needsSiteVisit),
      nextFollowUpDate: lead.pipeline?.nextFollowUpDate ?? null,
      now,
      firstContactTargetMinutes: options.firstContactTargetMinutes,
      siteVisitTargetMinutes: options.siteVisitTargetMinutes,
      timeZone: options.timeZone,
    })
    const createdMs = toMillis(lead.createdAt) ?? 0
    if (isClosedPipelineStage(stage)) {
      return { bucket: 4, secondary: -createdMs, tertiary: 0 }
    }
    if (sla.isOverdue) {
      return { bucket: 0, secondary: sla.remainingBusinessMinutes, tertiary: createdMs }
    }
    if (sla.isDueToday) {
      return { bucket: 1, secondary: createdMs, tertiary: 0 }
    }
    if (stage === 'new') {
      return { bucket: 2, secondary: createdMs, tertiary: 0 }
    }
    const followUp = lead.pipeline?.nextFollowUpDate || '9999-12-31'
    return { bucket: 3, secondary: followUp, tertiary: createdMs }
  }

  return [...leads].sort((a, b) => {
    const sa = score(a)
    const sb = score(b)
    if (sa.bucket !== sb.bucket) return sa.bucket - sb.bucket
    if (typeof sa.secondary === 'string' && typeof sb.secondary === 'string') {
      const cmp = sa.secondary.localeCompare(sb.secondary)
      if (cmp !== 0) return cmp
    } else if (sa.secondary !== sb.secondary) {
      return (sa.secondary as number) - (sb.secondary as number)
    }
    return sa.tertiary - sb.tertiary
  })
}

export interface PipelineKpiBookingInput {
  createdBy?: string | null
  createdAt?: unknown
  status?: string
  leadSource?: string
  pipeline?: {
    stage?: PipelineStage
    ownerEmail?: string | null
    needsSiteVisit?: boolean
    nextFollowUpDate?: CalendarDate | null
    firstContactAt?: unknown
    quotedPriceCents?: number | null
    lostReason?: LostReason | null
  } | null
}

/**
 * Aggregates Sales Pipeline KPIs for the Analytics dashboard (P3-E40).
 * Excludes recurring renewals (`system:recurring-renewal`).
 */
export function computePipelineKpis(
  bookings: readonly PipelineKpiBookingInput[],
  options: {
    now?: Date
    firstContactTargetMinutes?: number
    siteVisitTargetMinutes?: number
    timeZone?: string
  } = {},
): PipelineKpis {
  const now = options.now ?? new Date()
  const tz = options.timeZone ?? BUSINESS_TZ

  const openByStage: PipelineKpis['openByStage'] = {
    new: 0,
    contacted: 0,
    site_visit: 0,
    quoted: 0,
  }
  let wonCount = 0
  let lostCount = 0
  let overdueCount = 0
  let wonQuotedValueCents = 0
  const responseTimes: number[] = []

  const sourceMap = new Map<string, { total: number; won: number; lost: number; open: number }>()
  const ownerMap = new Map<string, { total: number; won: number; lost: number; open: number }>()
  const lostMap = new Map<LostReason, number>()

  for (const b of bookings) {
    if (isRecurringRenewalBooking(b)) continue
    const stage = inferPipelineStageFromBooking(b)

    const src = (b.leadSource || 'organic').trim().toLowerCase()
    const srcEntry = sourceMap.get(src) ?? { total: 0, won: 0, lost: 0, open: 0 }
    srcEntry.total++

    const ownerKey = b.pipeline?.ownerEmail?.trim().toLowerCase() || 'unassigned'
    const ownerEntry = ownerMap.get(ownerKey) ?? { total: 0, won: 0, lost: 0, open: 0 }
    ownerEntry.total++

    if (stage === 'won') {
      wonCount++
      srcEntry.won++
      ownerEntry.won++
      if (typeof b.pipeline?.quotedPriceCents === 'number' && Number.isFinite(b.pipeline.quotedPriceCents)) {
        wonQuotedValueCents += Math.round(b.pipeline.quotedPriceCents)
      }
    } else if (stage === 'lost') {
      lostCount++
      srcEntry.lost++
      ownerEntry.lost++
      const reason: LostReason =
        b.pipeline?.lostReason && isValidLostReason(b.pipeline.lostReason)
          ? b.pipeline.lostReason
          : 'other'
      lostMap.set(reason, (lostMap.get(reason) ?? 0) + 1)
    } else {
      openByStage[stage]++
      srcEntry.open++
      ownerEntry.open++
      const sla = computeLeadSlaStatus({
        stage,
        createdAt: b.createdAt,
        firstContactAt: b.pipeline?.firstContactAt ?? null,
        needsSiteVisit: Boolean(b.pipeline?.needsSiteVisit),
        nextFollowUpDate: b.pipeline?.nextFollowUpDate ?? null,
        now,
        firstContactTargetMinutes: options.firstContactTargetMinutes,
        siteVisitTargetMinutes: options.siteVisitTargetMinutes,
        timeZone: tz,
      })
      if (sla.isOverdue) overdueCount++
    }

    sourceMap.set(src, srcEntry)
    ownerMap.set(ownerKey, ownerEntry)

    const createdMs = toMillis(b.createdAt)
    const firstContactMs = toMillis(b.pipeline?.firstContactAt)
    if (createdMs !== null && firstContactMs !== null && firstContactMs >= createdMs) {
      responseTimes.push(businessMinutesBetween(new Date(createdMs), new Date(firstContactMs), tz))
    }
  }

  responseTimes.sort((a, b) => a - b)
  let medianFirstContactBusinessMinutes: number | null = null
  if (responseTimes.length > 0) {
    const mid = Math.floor(responseTimes.length / 2)
    medianFirstContactBusinessMinutes =
      responseTimes.length % 2 === 1
        ? responseTimes[mid]
        : Math.round((responseTimes[mid - 1] + responseTimes[mid]) / 2)
  }

  const conversionBySource = Array.from(sourceMap.entries())
    .map(([source, s]) => ({
      source,
      ...s,
      conversionRate: s.won + s.lost > 0 ? Math.round((s.won / (s.won + s.lost)) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  const conversionByOwner = Array.from(ownerMap.entries())
    .map(([ownerEmail, o]) => ({
      ownerEmail,
      ...o,
      conversionRate: o.won + o.lost > 0 ? Math.round((o.won / (o.won + o.lost)) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  const lostReasons = Array.from(lostMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)

  const openTotal = openByStage.new + openByStage.contacted + openByStage.site_visit + openByStage.quoted

  return {
    openByStage,
    openTotal,
    wonCount,
    lostCount,
    overdueCount,
    medianFirstContactBusinessMinutes,
    wonQuotedValueCents,
    conversionBySource,
    conversionByOwner,
    lostReasons,
  }
}
