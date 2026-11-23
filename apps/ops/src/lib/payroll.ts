// Payroll hours from Camelo timesheets. The rules, in one place:
//  - a pay period runs Friday to Thursday;
//  - a timesheet counts on the day it started;
//  - each employee's day is summed in exact minutes, then rounded to the
//    nearest quarter hour, approved and unapproved time separately;
//  - every total is a sum of those rounded day figures, so rows and columns agree.
import type { Person, Timesheet } from '../types'
import { TZ, addDays } from './week'

export const LONG_ENTRY_MINUTES = 12 * 60

/** Nearest 15 minutes. An exact half (possible only for an average, e.g. 37.5) rounds up. */
export const roundQuarter = (minutes: number) => Math.round(minutes / 15) * 15

/** Minutes as decimal hours with two places: 75 -> "1.25". */
export const hours = (minutes: number) => (minutes / 60).toFixed(2)

/** Exact minutes as "2h 03m". */
export const exact = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`

const utc = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** The Friday on or before a date. */
export function fridayOf(date: string): string {
  return addDays(date, -((utc(date).getUTCDay() + 2) % 7))
}

/** The most recent period that has fully ended, which is the one payroll is run for. */
export const lastCompletedPeriod = (today: string) => addDays(fridayOf(today), -7)

export const dayLabel = (date: string) =>
  utc(date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '')

const offsetMinutes = (instant: number, tz: string) => {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
    .formatToParts(new Date(instant))
    .find((p) => p.type === 'timeZoneName')!.value
  const m = /([+-])(\d{2}):(\d{2})/.exec(name)
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0
}

/** A wall-clock date and "HH:MM" in a timezone, as an ISO date-time with that zone's offset. */
export function zonedIso(date: string, time: string, tz: string = TZ): string {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  const wall = Date.UTC(y, m - 1, d, h, min)
  // the offset at roughly that moment, then again at the exact instant it implies
  const offset = offsetMinutes(wall - offsetMinutes(wall, tz) * 60_000, tz)
  const abs = Math.abs(offset)
  return `${date}T${time}:00${offset < 0 ? '-' : '+'}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

/** The local date and 24-hour "HH:MM" of an instant, for filling a time field. */
export function localParts(iso: string, tz: string = TZ): { date: string; time: string } {
  const at = new Date(iso)
  return {
    date: new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(at),
    time: new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(at),
  }
}

export type Flag = 'long' | 'overlap' | 'open'

export const FLAG_TEXT: Record<Flag, string> = {
  long: 'Over 12 hours: check for a missed clock-out',
  overlap: 'Overlaps another clock-in for this person',
  open: 'No clock-out recorded',
}

export interface Entry {
  sheet: Timesheet
  minutes: number
  approved: boolean
  flags: Flag[]
}

export interface Cell {
  date: string
  entries: Entry[]
  /** Exact minutes before rounding. */
  approvedExact: number
  unapprovedExact: number
  /** Rounded to the quarter hour; these are what payroll uses. */
  approved: number
  unapproved: number
  flagged: boolean
}

export interface Row {
  key: string
  name: string
  cells: Cell[]
  approved: number
  unapproved: number
  flagged: boolean
}

export interface Payroll {
  periodStart: string
  days: string[]
  rows: Row[]
  /** Per-day column totals, then the grand totals. All in rounded minutes. */
  dayApproved: number[]
  dayUnapproved: number[]
  approved: number
  unapproved: number
  unapprovedEntries: number
  flaggedEntries: number
}

export const isApproved = (t: Timesheet) => t.state === 'APPROVED'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const localDay = (iso: string, tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso))

export function buildPayroll(periodStart: string, timesheets: Timesheet[]): Payroll {
  const days = Array.from({ length: 7 }, (_, i) => addDays(periodStart, i))
  const people = new Map<string, { person: Person | null; entries: Entry[] }>()
  for (const sheet of timesheets) {
    const key = sheet.employee?.id ?? ''
    if (!people.has(key)) people.set(key, { person: sheet.employee, entries: [] })
    const minutes = sheet.totalDuration ?? 0
    const flags: Flag[] = []
    if (minutes > LONG_ENTRY_MINUTES) flags.push('long')
    if (!sheet.to) flags.push('open')
    people.get(key)!.entries.push({ sheet, minutes, approved: isApproved(sheet), flags })
  }

  const rows = [...people.entries()].map(([key, { person, entries }]): Row => {
    entries.sort((a, b) => Date.parse(a.sheet.from) - Date.parse(b.sheet.from))
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [a, b] = [entries[i].sheet, entries[j].sheet]
        if (a.to && Date.parse(b.from) < Date.parse(a.to)) {
          for (const e of [entries[i], entries[j]]) if (!e.flags.includes('overlap')) e.flags.push('overlap')
        }
      }
    }
    const cells = days.map((date): Cell => {
      const mine = entries.filter((e) => localDay(e.sheet.from, e.sheet.timezone || TZ) === date)
      const approvedExact = sum(mine.filter((e) => e.approved).map((e) => e.minutes))
      const unapprovedExact = sum(mine.filter((e) => !e.approved).map((e) => e.minutes))
      return {
        date,
        entries: mine,
        approvedExact,
        unapprovedExact,
        approved: roundQuarter(approvedExact),
        unapproved: roundQuarter(unapprovedExact),
        flagged: mine.some((e) => e.flags.length > 0),
      }
    })
    return {
      key: key || '__none__',
      name: person ? person.name || 'Unnamed employee' : 'No employee on timesheet',
      cells,
      approved: sum(cells.map((c) => c.approved)),
      unapproved: sum(cells.map((c) => c.unapproved)),
      flagged: cells.some((c) => c.flagged),
    }
  })
  rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.key.localeCompare(b.key))

  const counted = rows.flatMap((r) => r.cells.flatMap((c) => c.entries))
  return {
    periodStart,
    days,
    rows,
    dayApproved: days.map((_, i) => sum(rows.map((r) => r.cells[i].approved))),
    dayUnapproved: days.map((_, i) => sum(rows.map((r) => r.cells[i].unapproved))),
    approved: sum(rows.map((r) => r.approved)),
    unapproved: sum(rows.map((r) => r.unapproved)),
    unapprovedEntries: counted.filter((e) => !e.approved).length,
    flaggedEntries: counted.filter((e) => e.flags.length > 0).length,
  }
}

// Quote everything, and stop a spreadsheet treating a name as a formula.
const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`

/** One approved line per employee, plus an unapproved line where there is any. */
export function payrollCsv(p: Payroll): string {
  const line = (name: string, type: string, perDay: number[], total: number) =>
    [csvCell(name), csvCell(type), ...perDay.map(hours), hours(total)].join(',')
  const out = [['Employee', 'Hours', ...p.days.map(dayLabel), 'Total'].map(csvCell).join(',')]
  for (const r of p.rows) {
    out.push(line(r.name, 'Approved', r.cells.map((c) => c.approved), r.approved))
    if (r.unapproved > 0) out.push(line(r.name, 'Unapproved', r.cells.map((c) => c.unapproved), r.unapproved))
  }
  out.push(line('Total', 'Approved', p.dayApproved, p.approved))
  if (p.unapproved > 0) out.push(line('Total', 'Unapproved', p.dayUnapproved, p.unapproved))
  return out.join('\r\n') + '\r\n'
}
