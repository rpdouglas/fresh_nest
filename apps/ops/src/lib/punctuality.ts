// Punctuality: did each cleaner turn up for each visit, on time, and stay to the end.
// The rules, in one place:
//  - a visit is a shift that has ended, has someone assigned and a client or site,
//    and is not On Call (each shift partner has their own shift, so pairs count per person);
//  - its timesheets are the ones clocked against it, or failing that the same person's
//    timesheets that overlap it; rejected timesheets and leave do not count;
//  - no timesheet at all is a no-show;
//  - arrival and departure are measured only from real clock-ins (Camelo TimeCards):
//    times a manager typed in say nothing about when someone arrived, so those visits
//    count as attended but not measured;
//  - late = first clock-in more than GRACE_MINUTES after the start;
//    left early = last clock-out more than GRACE_MINUTES before the end.
import type { ReviewResponse, ReviewSheet, ReviewShift } from '../types'
import { localDay } from './review'
import { isOnCall } from './schedule'

export const GRACE_MINUTES = 15

export type VisitStatus = 'on-time' | 'late' | 'no-show' | 'unmeasured'

export interface PunctualVisit {
  shift: ReviewShift
  sheets: ReviewSheet[]
  status: VisitStatus
  /** Minutes after the start of the first clock-in, when late. */
  lateBy: number
  /** Minutes before the end of the last clock-out, when that is more than the grace. */
  leftEarlyBy: number
  date: string
  clientName: string
}

export interface PunctualRow {
  key: string
  name: string
  visits: PunctualVisit[]
  scheduled: number
  /** Visits with a real clock-in, the base of the on-time rate. */
  measured: number
  onTime: number
  late: number
  /** Mean minutes late over the late visits. */
  avgLate: number
  leftEarly: number
  noShows: number
  /** onTime / measured, or null with nothing measured. */
  onTimeRate: number | null
  /** noShows / scheduled. */
  noShowRate: number
}

export interface Punctuality {
  byCleaner: PunctualRow[]
  byClient: PunctualRow[]
  total: PunctualRow
}

const ms = (iso: string) => Date.parse(iso)
const sheetEnd = (t: ReviewSheet) => (t.to ? ms(t.to) : null)
const overlaps = (t: ReviewSheet, s: ReviewShift) => {
  const end = sheetEnd(t) ?? ms(t.from) + (t.totalDuration ?? 0) * 60_000
  return Math.min(end, ms(s.endTime)) > Math.max(ms(t.from), ms(s.startTime))
}
const onCall = (x: { group: { name: string | null } | null }) => isOnCall(x.group?.name?.trim() || null)
const clockedIn = (t: ReviewSheet) => t.referenceObject?.__typename === 'TimeCard'

function visitOf(shift: ReviewShift, sheets: ReviewSheet[], graceMinutes = GRACE_MINUTES): PunctualVisit {
  const base = { shift, sheets, lateBy: 0, leftEarlyBy: 0, date: localDay(shift.startTime, shift.timezone), clientName: shift.client?.name || shift.jobSite?.name || 'No client' }
  if (!sheets.length) return { ...base, status: 'no-show' }
  const clocks = sheets.filter(clockedIn)
  if (!clocks.length) return { ...base, status: 'unmeasured' }
  const firstIn = Math.min(...clocks.map((t) => ms(t.from)))
  const lateBy = Math.max(0, Math.round((firstIn - ms(shift.startTime)) / 60_000))
  // still clocked in: nothing to say about leaving early
  const outs = clocks.map(sheetEnd)
  const lastOut = outs.includes(null) ? null : Math.max(...(outs as number[]))
  const early = lastOut === null ? 0 : Math.round((ms(shift.endTime) - lastOut) / 60_000)
  return { ...base, status: lateBy > graceMinutes ? 'late' : 'on-time', lateBy, leftEarlyBy: early > graceMinutes ? early : 0 }
}

function rowOf(key: string, name: string, visits: PunctualVisit[]): PunctualRow {
  const count = (s: VisitStatus) => visits.filter((v) => v.status === s).length
  const late = visits.filter((v) => v.status === 'late')
  const onTime = count('on-time')
  const measured = onTime + late.length
  const noShows = count('no-show')
  return {
    key,
    name,
    visits: [...visits].sort((a, b) => ms(a.shift.startTime) - ms(b.shift.startTime) || a.shift.id.localeCompare(b.shift.id)),
    scheduled: visits.length,
    measured,
    onTime,
    late: late.length,
    avgLate: late.length ? Math.round(late.reduce((n, v) => n + v.lateBy, 0) / late.length) : 0,
    leftEarly: visits.filter((v) => v.leftEarlyBy > 0).length,
    noShows,
    onTimeRate: measured ? onTime / measured : null,
    noShowRate: visits.length ? noShows / visits.length : 0,
  }
}

/** Worst first: lowest on-time rate, then most no-shows, then by name. */
const worstFirst = (a: PunctualRow, b: PunctualRow) =>
  (a.onTimeRate ?? 2) - (b.onTimeRate ?? 2) || b.noShows - a.noShows || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })

export function buildPunctuality(data: ReviewResponse, now: number, graceMinutes = GRACE_MINUTES): Punctuality {
  const shifts = data.shifts.filter((s) => s.assignee && (s.client || s.jobSite) && !onCall(s) && ms(s.endTime) <= now)
  const counted = data.timesheets.filter((t) => t.employee && t.state !== 'REJECTED' && t.referenceObject?.__typename !== 'LeaveRequest')
  const byShift = new Map<string, ReviewSheet[]>()
  const byPerson = new Map<string, ReviewSheet[]>()
  for (const t of counted) {
    const id = t.referenceObject?.shiftId
    if (id) byShift.set(id, [...(byShift.get(id) ?? []), t])
    byPerson.set(t.employee!.id, [...(byPerson.get(t.employee!.id) ?? []), t])
  }

  const ownShifts = new Map<string, Set<string>>()
  for (const s of shifts) ownShifts.set(s.assignee!.id, (ownShifts.get(s.assignee!.id) ?? new Set()).add(s.id))

  const visits = shifts.map((s) => {
    const who = s.assignee!.id
    const linked = (byShift.get(s.id) ?? []).filter((t) => t.employee!.id === who)
    // Otherwise their timesheets that overlap it, except one clocked against another of
    // their own shifts (a clock-in against a partner's shift still counts here).
    const mine = ownShifts.get(who)!
    const loose = (byPerson.get(who) ?? []).filter((t) => overlaps(t, s) && !(t.referenceObject?.shiftId && mine.has(t.referenceObject.shiftId)))
    return { person: s.assignee!, visit: visitOf(s, linked.length ? linked : loose, graceMinutes) }
  })

  const group = (keyOf: (v: (typeof visits)[number]) => [string, string]) => {
    const groups = new Map<string, { name: string; list: PunctualVisit[] }>()
    for (const v of visits) {
      const [key, name] = keyOf(v)
      if (!groups.has(key)) groups.set(key, { name, list: [] })
      groups.get(key)!.list.push(v.visit)
    }
    return [...groups.entries()].map(([key, g]) => rowOf(key, g.name, g.list)).sort(worstFirst)
  }

  return {
    byCleaner: group((v) => [v.person.id, v.person.name || 'Unnamed employee']),
    byClient: group((v) => [v.visit.shift.client?.id ?? `site:${v.visit.clientName}`, v.visit.clientName]),
    total: rowOf('total', 'All visits', visits.map((v) => v.visit)),
  }
}

/** "87%", or a dash when there is nothing to divide by. */
export const percent = (rate: number | null) => (rate === null ? '–' : `${Math.round(rate * 100)}%`)

const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`

/** One line per cleaner or client, then the total. */
export function punctualityCsv(rows: PunctualRow[], total: PunctualRow, label: string): string {
  const line = (r: PunctualRow) =>
    [csvCell(r.name), r.scheduled, r.measured, r.onTime, r.late, r.avgLate, r.leftEarly, r.noShows, percent(r.onTimeRate), percent(r.noShowRate)].join(',')
  const head = [label, 'Visits', 'Measured', 'On time', 'Late', 'Avg minutes late', 'Left early', 'No-shows', 'On-time rate', 'No-show rate']
  return [head.map(csvCell).join(','), ...rows.map(line), line(total)].join('\r\n') + '\r\n'
}
