// Scheduled hours against actual hours, per employee per day. The rules, in one place:
//  - On Call is left out on both sides: On Call shifts, On Call timesheets, and
//    timesheets clocked against an On Call shift;
//  - scheduled = the employee's shifts that have ended, each end - start - break,
//    on the local day the shift started;
//  - actual = Camelo's minutes for their timesheets on the local day each started,
//    approved or not; rejected timesheets and leave are not worked time;
//  - variance = actual - scheduled, in exact minutes; totals add exact minutes.
import type { ReviewResponse, ReviewSheet, ReviewShift } from '../types'
import { dayLabel, isApproved } from './payroll'
import { OFF_MINUTES, decimal, localDay, scheduledMinutes, signed, uncoveredShifts } from './review'
import { isOnCall } from './schedule'
import { addDays } from './week'

export interface SvaCell {
  date: string
  scheduled: number
  actual: number
  variance: number
  /** More than 15 minutes either way. */
  off: boolean
  shifts: ReviewShift[]
  sheets: ReviewSheet[]
  /** Finished shifts here that no timesheet covers. */
  uncovered: ReviewShift[]
  /** Some of the actual time is not approved yet, so it can still change. */
  unapproved: boolean
}

export interface SvaRow {
  key: string
  name: string
  cells: SvaCell[]
  scheduled: number
  actual: number
  variance: number
  uncovered: number
  unapproved: boolean
}

export interface SchedVsActual {
  periodStart: string
  days: string[]
  /** By name, for the table. */
  rows: SvaRow[]
  /** From most over schedule to most under, for the chart. */
  ranked: SvaRow[]
  dayScheduled: number[]
  dayActual: number[]
  scheduled: number
  actual: number
  variance: number
  uncovered: number
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const onCall = (x: { group: { name: string | null } | null }) => isOnCall(x.group?.name?.trim() || null)

/** Timesheets that count as time worked for this report. */
function worked(data: ReviewResponse): ReviewSheet[] {
  const onCallShifts = new Set([...data.shifts, ...data.otherShifts].filter(onCall).map((s) => s.id))
  return data.timesheets.filter(
    (t) =>
      t.employee &&
      t.state !== 'REJECTED' &&
      t.referenceObject?.__typename !== 'LeaveRequest' &&
      !onCall(t) &&
      !(t.referenceObject?.shiftId && onCallShifts.has(t.referenceObject.shiftId)),
  )
}

export function buildSchedVsActual(data: ReviewResponse, now: number): SchedVsActual {
  const days = Array.from({ length: 7 }, (_, i) => addDays(data.periodStart, i))
  const shifts = data.shifts.filter((s) => s.assignee && !onCall(s) && Date.parse(s.endTime) <= now)
  const sheets = worked(data)
  const uncovered = new Set(uncoveredShifts(data, now).map((s) => s.id))

  const people = new Map<string, { name: string; shifts: ReviewShift[]; sheets: ReviewSheet[] }>()
  const person = (id: string, name: string | null) => {
    if (!people.has(id)) people.set(id, { name: name || 'Unnamed employee', shifts: [], sheets: [] })
    return people.get(id)!
  }
  for (const s of shifts) person(s.assignee!.id, s.assignee!.name).shifts.push(s)
  for (const t of sheets) person(t.employee!.id, t.employee!.name).sheets.push(t)

  const rows = [...people.entries()]
    .map(([key, p]): SvaRow => {
      const cells = days.map((date): SvaCell => {
        const myShifts = p.shifts.filter((s) => localDay(s.startTime, s.timezone) === date).sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
        const mySheets = p.sheets.filter((t) => localDay(t.from, t.timezone) === date).sort((a, b) => Date.parse(a.from) - Date.parse(b.from))
        const scheduled = sum(myShifts.map(scheduledMinutes))
        const actual = sum(mySheets.map((t) => t.totalDuration ?? 0))
        return {
          date,
          scheduled,
          actual,
          variance: actual - scheduled,
          off: Math.abs(actual - scheduled) > OFF_MINUTES,
          shifts: myShifts,
          sheets: mySheets,
          uncovered: myShifts.filter((s) => uncovered.has(s.id)),
          unapproved: mySheets.some((t) => !isApproved(t)),
        }
      })
      const scheduled = sum(cells.map((c) => c.scheduled))
      const actual = sum(cells.map((c) => c.actual))
      return {
        key,
        name: p.name,
        cells,
        scheduled,
        actual,
        variance: actual - scheduled,
        uncovered: sum(cells.map((c) => c.uncovered.length)),
        unapproved: cells.some((c) => c.unapproved),
      }
    })
    .filter((r) => r.scheduled > 0 || r.actual > 0)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.key.localeCompare(b.key))

  const scheduled = sum(rows.map((r) => r.scheduled))
  const actual = sum(rows.map((r) => r.actual))
  return {
    periodStart: data.periodStart,
    days,
    rows,
    ranked: [...rows].sort((a, b) => b.variance - a.variance || a.name.localeCompare(b.name)),
    dayScheduled: days.map((_, i) => sum(rows.map((r) => r.cells[i].scheduled))),
    dayActual: days.map((_, i) => sum(rows.map((r) => r.cells[i].actual))),
    scheduled,
    actual,
    variance: actual - scheduled,
    uncovered: sum(rows.map((r) => r.uncovered)),
  }
}

const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`

/** Three lines per employee: scheduled, actual and variance for each day and the period. */
export function schedVsActualCsv(v: SchedVsActual): string {
  const line = (name: string, measure: string, perDay: string[], total: string) => [csvCell(name), csvCell(measure), ...perDay, total].join(',')
  const block = (name: string, sched: number[], act: number[], s: number, a: number) => [
    line(name, 'Scheduled', sched.map(decimal), decimal(s)),
    line(name, 'Actual', act.map(decimal), decimal(a)),
    line(name, 'Variance', sched.map((x, i) => signed(act[i] - x)), signed(a - s)),
  ]
  return (
    [
      ['Employee', 'Hours', ...v.days.map(dayLabel), 'Total'].map(csvCell).join(','),
      ...v.rows.flatMap((r) => block(r.name, r.cells.map((c) => c.scheduled), r.cells.map((c) => c.actual), r.scheduled, r.actual)),
      ...block('Total', v.dayScheduled, v.dayActual, v.scheduled, v.actual),
    ].join('\r\n') + '\r\n'
  )
}
