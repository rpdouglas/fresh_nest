// Unapproved timesheets set against what was scheduled. The rules, in one place:
//  - a row is a timesheet that is not approved;
//  - "scheduled" is the shift its time card points to, or failing that the shift
//    of the same employee that overlaps it most;
//  - scheduled time is the shift's length less its break, actual time is Camelo's
//    total, and the variance is actual minus scheduled, in exact minutes;
//  - a shift is "missing a timesheet" when it has ended, has someone assigned and
//    somewhere to be, and no timesheet is linked to it or overlaps it for that person.
import type { ReviewResponse, ReviewSheet, ReviewShift } from '../types'
import { isApproved } from './payroll'
import { notOnCall } from './schedule'
import { TZ } from './week'

/** A variance beyond this many minutes is called out. */
export const OFF_MINUTES = 15

export interface IncompleteChecklist {
  name: string
  completionPercentage: number | null
}

export interface ReviewRow {
  sheet: ReviewSheet
  shift: ReviewShift | null
  /** How the shift was found: Camelo's own link, or by overlapping times. */
  match: 'linked' | 'overlap' | null
  scheduledMinutes: number | null
  actualMinutes: number
  /** Actual minus scheduled; null when there is no shift to compare with. */
  variance: number | null
  off: boolean
  clientName: string
  siteName: string | null
  incompleteChecklists: IncompleteChecklist[]
}

export interface ReviewDay {
  /** YYYY-MM-DD, the local day the timesheet started. */
  date: string
  rows: ReviewRow[]
}

export interface Review {
  days: ReviewDay[]
  rows: ReviewRow[]
  /** Shifts that should have a timesheet and do not. */
  missing: ReviewShift[]
  waitingMinutes: number
  offCount: number
  incompleteCount: number
}

const ms = (iso: string) => Date.parse(iso)
const minutesBetween = (a: string, b: string) => Math.round((ms(b) - ms(a)) / 60_000)
const sheetEnd = (t: ReviewSheet) => (t.to ? ms(t.to) : ms(t.from) + (t.totalDuration ?? 0) * 60_000)
const overlap = (t: ReviewSheet, s: ReviewShift) => Math.min(sheetEnd(t), ms(s.endTime)) - Math.max(ms(t.from), ms(s.startTime))
const same = (a: string | null | undefined, b: string | null | undefined) => (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()

export const localDay = (iso: string, tz: string | null) => new Intl.DateTimeFormat('en-CA', { timeZone: tz || TZ }).format(new Date(iso))

/**
 * Scheduled minutes of one shift: its length less any unpaid break. This is the
 * working time a shift stands for. A day's or a week's scheduled time is these added
 * up shift by shift, never the stretch from a first start to a last finish: the time
 * between visits is not worked and not paid (docs/decisions/0014).
 */
export const scheduledMinutes = (s: { startTime: string; endTime: string; breakDuration: number | null }) => Math.max(0, minutesBetween(s.startTime, s.endTime) - (s.breakDuration ?? 0))

/** Minutes as decimal hours to two places, exactly (no quarter-hour rounding). */
export const decimal = (minutes: number) => (minutes / 60).toFixed(2)
/** A variance with its sign: "+1.25", "-0.02", "0.00". */
export const signed = (minutes: number) => `${minutes > 0 ? '+' : minutes < 0 ? '-' : ''}${decimal(Math.abs(minutes))}`

/**
 * Finished shifts in the period with someone assigned and no timesheet: none is
 * linked to the shift, and none of that person's overlaps it. Any timesheet
 * covers its shift, approved or not.
 */
export function uncoveredShifts(data: ReviewResponse, now: number): ReviewShift[] {
  const linkedIds = new Set(data.timesheets.map((t) => t.referenceObject?.shiftId).filter(Boolean))
  const sheetsByPerson = new Map<string, ReviewSheet[]>()
  for (const t of data.timesheets) {
    if (!t.employee) continue
    if (!sheetsByPerson.has(t.employee.id)) sheetsByPerson.set(t.employee.id, [])
    sheetsByPerson.get(t.employee.id)!.push(t)
  }
  return data.shifts
    .filter((s) => ms(s.endTime) <= now && s.assignee && notOnCall(s))
    .filter((s) => !linkedIds.has(s.id) && !(sheetsByPerson.get(s.assignee!.id) ?? []).some((t) => overlap(t, s) > 0))
    .sort((a, b) => ms(a.startTime) - ms(b.startTime) || a.id.localeCompare(b.id))
}

export function incompleteChecklists(
  assignments: { completionPercentage: number | null; checklist: { name: string | null } | null }[] | null | undefined,
): IncompleteChecklist[] {
  if (!assignments || assignments.length === 0) return []
  const map = new Map<string, number | null>()
  for (const a of assignments) {
    const name = a.checklist?.name?.trim() || 'Checklist'
    const curr = map.get(name)
    if (curr === undefined) {
      map.set(name, a.completionPercentage)
    } else if (a.completionPercentage != null && (curr == null || a.completionPercentage > curr)) {
      map.set(name, a.completionPercentage)
    }
  }
  return [...map.entries()]
    .filter(([_, pct]) => pct == null || pct < 100)
    .map(([name, completionPercentage]) => ({ name, completionPercentage }))
}

export function buildReview(data: ReviewResponse, now: number): Review {
  const shifts = new Map([...data.shifts, ...data.otherShifts].map((s) => [s.id, s]))
  const byPerson = new Map<string, ReviewShift[]>()
  for (const s of shifts.values()) {
    // an On Call shift is never what a timesheet was scheduled against
    if (!s.assignee || !notOnCall(s)) continue
    if (!byPerson.has(s.assignee.id)) byPerson.set(s.assignee.id, [])
    byPerson.get(s.assignee.id)!.push(s)
  }

  const rows = data.timesheets
    .filter((t) => !isApproved(t))
    .map((sheet): ReviewRow => {
      const linked = sheet.referenceObject?.shiftId ? (shifts.get(sheet.referenceObject.shiftId) ?? null) : null
      let shift = linked
      if (!shift && sheet.employee) {
        const candidates = (byPerson.get(sheet.employee.id) ?? []).filter((s) => overlap(sheet, s) > 0)
        shift = candidates.sort((a, b) => overlap(sheet, b) - overlap(sheet, a))[0] ?? null
      }
      const scheduled = shift ? scheduledMinutes(shift) : null
      const actual = sheet.totalDuration ?? 0
      const variance = scheduled === null ? null : actual - scheduled
      const clientName = sheet.client?.name || shift?.client?.name || sheet.jobSite?.name || shift?.jobSite?.name || 'No client'
      const site = sheet.jobSite?.name || shift?.jobSite?.name || null
      return {
        sheet,
        shift,
        match: linked ? 'linked' : shift ? 'overlap' : null,
        scheduledMinutes: scheduled,
        actualMinutes: actual,
        variance,
        off: variance !== null && Math.abs(variance) > OFF_MINUTES,
        clientName,
        siteName: site && !same(site, clientName) ? site : null,
        incompleteChecklists: incompleteChecklists(shift?.checklistAssignments),
      }
    })
    .sort((a, b) => ms(a.sheet.from) - ms(b.sheet.from) || a.clientName.localeCompare(b.clientName) || a.sheet.id.localeCompare(b.sheet.id))

  const days = new Map<string, ReviewRow[]>()
  for (const r of rows) {
    const date = localDay(r.sheet.from, r.sheet.timezone)
    if (!days.has(date)) days.set(date, [])
    days.get(date)!.push(r)
  }

  const missing = uncoveredShifts(data, now).filter((s) => s.client || s.jobSite)

  return {
    days: [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => ({ date, rows: list })),
    rows,
    missing,
    waitingMinutes: rows.reduce((n, r) => n + r.actualMinutes, 0),
    offCount: rows.filter((r) => r.off).length,
    incompleteCount: rows.filter((r) => r.incompleteChecklists.length > 0).length,
  }
}
