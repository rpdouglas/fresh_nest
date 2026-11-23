// Client kudos and complaints: counting, filtering and export. The lists of
// sources and categories must match the function's (functions/src/core.ts).
import type { Feedback, Timesheet } from '../types'
import { clientKey } from './clientHours'
import { dayLabel } from './payroll'
import { notOnCall } from './schedule'
import { TZ, addDays } from './week'

export const SOURCES = ['Phone', 'Text', 'Email', 'In person', 'Online review', 'Other']
export const CATEGORIES = ['Quality', 'Punctuality', 'Damage', 'Communication', 'Attitude', 'Other']
export const RANGES = [30, 90, 365]

/** The first day of a range of `days` days ending today. */
export const rangeFrom = (today: string, days: number) => addDays(today, -(days - 1))

/** Complaint rates need every timesheet in the range, fetched a week at a time; past this it is too many requests. */
export const RATE_MAX_DAYS = 90

/**
 * Visits from timesheets, for complaint rates. A visit is one client (or site) on one
 * local day: for a cleaner, theirs; in total, anyone's (a pair is one visit). Rejected
 * entries, leave and entries with no client or site are not visits.
 */
export function countVisits(timesheets: Timesheet[]): { total: number; byCleaner: Map<string, number> } {
  const all = new Set<string>()
  const mine = new Map<string, Set<string>>()
  for (const t of timesheets as (Timesheet & { referenceObject?: { __typename?: string } | null })[]) {
    const where = clientKey(t)
    if (!where || !t.employee || t.state === 'REJECTED' || t.referenceObject?.__typename === 'LeaveRequest' || !notOnCall(t)) continue
    const visit = `${where}|${new Intl.DateTimeFormat('en-CA', { timeZone: t.timezone || TZ }).format(new Date(t.from))}`
    all.add(visit)
    if (!mine.has(t.employee.id)) mine.set(t.employee.id, new Set())
    mine.get(t.employee.id)!.add(visit)
  }
  return { total: all.size, byCleaner: new Map([...mine].map(([id, v]) => [id, v.size])) }
}

/** "2.4" complaints per 100 visits, or a dash with no visits. */
export const per100 = (count: number, visits: number | undefined) => (visits ? ((count * 100) / visits).toFixed(1) : '–')

export interface FeedbackFilters {
  type: '' | 'kudos' | 'complaint'
  cleanerId: string
  category: string
  status: '' | 'open' | 'resolved'
  query: string
}

export const NO_FEEDBACK_FILTERS: FeedbackFilters = { type: '', cleanerId: '', category: '', status: '', query: '' }

export function filterFeedback(entries: Feedback[], f: FeedbackFilters): Feedback[] {
  const q = f.query.trim().toLowerCase()
  return entries.filter((e) => {
    if (f.type && e.type !== f.type) return false
    if (f.cleanerId && !e.cleaners.some((c) => c.id === f.cleanerId)) return false
    if (f.category && e.category !== f.category) return false
    if (f.status && e.status !== f.status) return false
    if (!q) return true
    return [e.clientName, e.siteName, e.text, e.resolution, ...e.cleaners.map((c) => c.name)].some((x) => x?.toLowerCase().includes(q))
  })
}

export interface CleanerTotal {
  id: string
  name: string
  kudos: number
  complaints: number
  /** Complaints not yet resolved. */
  open: number
}

/** An entry counts once for each cleaner attached to it. */
export function cleanerTotals(entries: Feedback[]): CleanerTotal[] {
  const totals = new Map<string, CleanerTotal>()
  for (const e of entries) {
    for (const c of e.cleaners) {
      if (!totals.has(c.id)) totals.set(c.id, { id: c.id, name: c.name, kudos: 0, complaints: 0, open: 0 })
      const t = totals.get(c.id)!
      if (e.type === 'kudos') t.kudos++
      else {
        t.complaints++
        if (e.status !== 'resolved') t.open++
      }
    }
  }
  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id))
}

export function overall(entries: Feedback[]) {
  const complaints = entries.filter((e) => e.type === 'complaint')
  return { kudos: entries.length - complaints.length, complaints: complaints.length, open: complaints.filter((e) => e.status !== 'resolved').length }
}

/** Feedback recorded against a visit, matched by the timesheets it was recorded on. */
export function forVisit(entries: Feedback[], timesheetIds: string[]): Feedback[] {
  const ids = new Set(timesheetIds)
  return entries.filter((e) => e.timesheetIds.some((id) => ids.has(id)))
}

export function cleanerOptions(entries: Feedback[]) {
  return cleanerTotals(entries).map(({ id, name }) => ({ id, name }))
}

const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`

export function feedbackCsv(entries: Feedback[]): string {
  const head = ['Date', 'Type', 'Client', 'Site', 'Cleaners', 'What the client said', 'How it came in', 'Category', 'Status', 'Follow-up', 'Recorded by']
  const rows = entries.map((e) => [
    dayLabel(e.date),
    e.type === 'kudos' ? 'Kudos' : 'Complaint',
    e.clientName,
    e.siteName ?? '',
    e.cleaners.map((c) => c.name).join('; '),
    e.text,
    e.source,
    e.category,
    e.status ?? '',
    e.resolution ?? '',
    e.createdBy,
  ])
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export interface Who {
  id: string
  name: string
}

export interface FormValues {
  text: string
  source: string
  category: string
  status: 'open' | 'resolved'
  resolution: string
  cleaners: Who[]
  clientName: string
  date: string
}

/** What a create or update sends for the fields an editor fills in. */
export function entryFields(type: Feedback['type'], v: FormValues): Record<string, unknown> {
  const base = { text: v.text, source: v.source, category: v.category, cleaners: v.cleaners }
  return type === 'complaint' ? { ...base, status: v.status, resolution: v.resolution } : base
}
