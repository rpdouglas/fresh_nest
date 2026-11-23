// How quickly time gets approved, and how much of it was typed in rather than clocked.
// The rules, in one place:
//  - entries are the period's timesheets except leave;
//  - approval lag runs from the clock-out (or the clock-in when there is none) to
//    Camelo's approvedAt, for approved entries; an entry approved as it was created
//    (as this site's API account does) counts as zero;
//  - waiting long = not approved, not rejected, and clocked out more than STALE_DAYS ago;
//  - entered by hand = not a TimeCard clock-in: added in Camelo or from this site.
import type { ReviewSheet } from '../types'

export const STALE_DAYS = 3

export interface ApprovalStats {
  key: string
  name: string
  entries: number
  approved: number
  /** Median hours from clock-out to approval, or null with nothing approved. */
  medianLagHours: number | null
  waitingLong: number
  byHand: number
  /** byHand / entries. */
  byHandRate: number
}

const ms = (iso: string) => Date.parse(iso)

function median(xs: number[]): number | null {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function statsOf(key: string, name: string, sheets: ReviewSheet[], now: number): ApprovalStats {
  const lags = sheets
    .filter((t) => t.state === 'APPROVED' && t.approvedAt)
    .map((t) => Math.max(0, ms(t.approvedAt!) - ms(t.to ?? t.from)) / 3_600_000)
  const byHand = sheets.filter((t) => t.referenceObject?.__typename !== 'TimeCard').length
  return {
    key,
    name,
    entries: sheets.length,
    approved: sheets.filter((t) => t.state === 'APPROVED').length,
    medianLagHours: median(lags),
    waitingLong: sheets.filter((t) => t.state !== 'APPROVED' && t.state !== 'REJECTED' && now - ms(t.to ?? t.from) > STALE_DAYS * 86_400_000).length,
    byHand,
    byHandRate: sheets.length ? byHand / sheets.length : 0,
  }
}

/** Per employee (most hand-entered first) and in total. */
export function approvalStats(timesheets: ReviewSheet[], now: number): { rows: ApprovalStats[]; total: ApprovalStats } {
  const entries = timesheets.filter((t) => t.employee && t.referenceObject?.__typename !== 'LeaveRequest')
  const people = new Map<string, { name: string; sheets: ReviewSheet[] }>()
  for (const t of entries) {
    const id = t.employee!.id
    if (!people.has(id)) people.set(id, { name: t.employee!.name || 'Unnamed employee', sheets: [] })
    people.get(id)!.sheets.push(t)
  }
  const rows = [...people.entries()]
    .map(([key, p]) => statsOf(key, p.name, p.sheets, now))
    .sort((a, b) => b.byHandRate - a.byHandRate || b.waitingLong - a.waitingLong || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  return { rows, total: statsOf('total', 'Everyone', entries, now) }
}

/** "5.5 h", "2.1 days" past two days, or a dash. */
export function lagLabel(hours: number | null): string {
  if (hours === null) return '–'
  return hours >= 48 ? `${(hours / 24).toFixed(1)} days` : `${hours.toFixed(1)} h`
}
