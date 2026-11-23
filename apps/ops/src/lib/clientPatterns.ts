// Client patterns: for each client, over the weeks loaded, how many visits there were, the
// start time and weekday they most often had, and how long they took.
//  - A visit is a client's shifts (or timesheets) on one day that overlap in time: each cleaner
//    is their own shift, so a pair is one visit. On Call is left out, and so are draft, open and
//    declined shifts.
//  - Time cleaning is from the timesheets: each visit's mean of its cleaners' minutes (breaks
//    already off), as Client hours counts it. A timesheet longer than the cut-off is left out:
//    one left running overnight would swamp the average. One still running is left out too.
//  - "First in to last out" is the first clock-in to the last clock-out at the visit.
//  - Scheduled length is each visit's mean of its cleaners' scheduled minutes, breaks off.
import type { ReviewShift, Timesheet } from '../types'
import { linkSites } from './clientHours'
import { localParts } from './payroll'
import { notOnCall } from './schedule'
import { TZ } from './week'

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
export type Weekday = (typeof WEEKDAYS)[number]

/** Shifts in these states are not visits that happen. */
const NOT_VISITS = new Set(['DRAFT', 'OPENING', 'REJECTED'])

export interface PatternOptions {
  /** A client with fewer scheduled visits than this is not listed. */
  minVisits: number
  /** A timesheet longer than this many minutes is left out of the time figures. */
  maxSheetMinutes: number
}

export const DEFAULT_PATTERN_OPTIONS: PatternOptions = { minVisits: 3, maxSheetMinutes: 6 * 60 }

export interface ClientPattern {
  /** The client's id in Camelo. */
  key: string
  name: string
  /** The address of the site most of its visits were at; null if none was given. */
  address: string | null
  /** Scheduled visits. */
  visits: number
  /** Minutes after midnight of the start time seen most often; ties go to the earlier time. */
  usualStart: number | null
  usualStartCount: number
  /** The weekday seen most often; ties go to the earlier day of the week. */
  usualDay: Weekday | null
  usualDayCount: number
  /** Visits on each weekday. */
  dayCounts: Record<Weekday, number>
  /** Visits with at least one timesheet counted. */
  sheetVisits: number
  /** Mean minutes cleaning a visit, per cleaner. */
  avgWorked: number | null
  /** Mean minutes from the first clock-in to the last clock-out. */
  avgSpan: number | null
  /** Mean scheduled minutes a visit, per cleaner, breaks off. */
  avgScheduled: number | null
}

export interface ClientPatterns {
  rows: ClientPattern[]
  /** Clients left out for having fewer visits than the minimum. */
  belowMinimum: number
  /** Timesheets left out for being longer than the cut-off. */
  longSheets: number
}

const ms = (iso: string) => Date.parse(iso)

function local(iso: string, tz: string | null) {
  const { date, time } = localParts(iso, tz || TZ)
  const day = WEEKDAYS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7]
  return { date, day, minutes: Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) }
}

/** Runs of entries that overlap in time, earliest first. */
function overlapping<T>(entries: T[], start: (e: T) => number, end: (e: T) => number): T[][] {
  const runs: T[][] = []
  let last = -Infinity
  for (const e of [...entries].sort((a, b) => start(a) - start(b))) {
    if (runs.length && start(e) < last) {
      runs[runs.length - 1].push(e)
      last = Math.max(last, end(e))
    } else {
      runs.push([e])
      last = end(e)
    }
  }
  return runs
}

/** The value seen most often; ties go to the one `order` puts first. */
function mostOften<T>(counts: Map<T, number>, order: (a: T, b: T) => number): [T, number] | null {
  let best: [T, number] | null = null
  for (const [value, n] of counts) {
    if (!best || n > best[1] || (n === best[1] && order(value, best[0]) < 0)) best = [value, n]
  }
  return best
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const add = <K>(m: Map<K, number>, k: K, n = 1) => m.set(k, (m.get(k) ?? 0) + n)

interface Acc {
  name: string
  addresses: Map<string, number>
  starts: Map<number, number>
  days: Map<Weekday, number>
  visits: number
  scheduled: number[]
  worked: number[]
  spans: number[]
}

export function buildClientPatterns(shifts: ReviewShift[], timesheets: Timesheet[], o: PatternOptions = DEFAULT_PATTERN_OPTIONS): ClientPatterns {
  const acc = new Map<string, Acc>()
  const of = (c: { id: string; name: string | null }) => {
    if (!acc.has(c.id)) {
      acc.set(c.id, { name: c.name?.trim() || 'Unnamed client', addresses: new Map(), starts: new Map(), days: new Map(), visits: 0, scheduled: [], worked: [], spans: [] })
    }
    return acc.get(c.id)!
  }

  // Scheduled visits: the start time, weekday and scheduled length.
  const byClientDay = new Map<string, ReviewShift[]>()
  for (const s of new Map(shifts.map((s) => [s.id, s])).values()) {
    if (!s.client || !notOnCall(s) || NOT_VISITS.has(s.state ?? '')) continue
    const a = of(s.client)
    if (s.jobSite?.address?.trim()) add(a.addresses, s.jobSite.address.trim())
    const key = `${s.client.id}|${local(s.startTime, s.timezone).date}`
    if (!byClientDay.has(key)) byClientDay.set(key, [])
    byClientDay.get(key)!.push(s)
  }
  for (const [key, list] of byClientDay) {
    const a = acc.get(key.slice(0, key.indexOf('|')))!
    for (const visit of overlapping(list, (s) => ms(s.startTime), (s) => ms(s.endTime))) {
      const first = visit.reduce((x, y) => (ms(y.startTime) < ms(x.startTime) ? y : x))
      const at = local(first.startTime, first.timezone)
      a.visits++
      add(a.starts, at.minutes)
      add(a.days, at.day)
      a.scheduled.push(mean(visit.map((s) => (ms(s.endTime) - ms(s.startTime)) / 60_000 - (s.breakDuration ?? 0)))!)
    }
  }

  // Time cleaning, from the timesheets.
  const sheets = linkSites(timesheets.filter((t) => notOnCall(t) && t.to))
  let longSheets = 0
  const sheetsByClientDay = new Map<string, Timesheet[]>()
  for (const t of new Map(sheets.map((t) => [t.id, t])).values()) {
    if (!t.client) continue
    if ((t.totalDuration ?? 0) > o.maxSheetMinutes) {
      longSheets++
      continue
    }
    of(t.client)
    const key = `${t.client.id}|${local(t.from, t.timezone).date}`
    if (!sheetsByClientDay.has(key)) sheetsByClientDay.set(key, [])
    sheetsByClientDay.get(key)!.push(t)
  }
  for (const [key, list] of sheetsByClientDay) {
    const a = acc.get(key.slice(0, key.indexOf('|')))!
    for (const visit of overlapping(list, (t) => ms(t.from), (t) => ms(t.to!))) {
      a.worked.push(mean(visit.map((t) => t.totalDuration ?? 0))!)
      a.spans.push((Math.max(...visit.map((t) => ms(t.to!))) - Math.min(...visit.map((t) => ms(t.from)))) / 60_000)
    }
  }

  const rows: ClientPattern[] = []
  let belowMinimum = 0
  for (const [key, a] of acc) {
    if (a.visits < o.minVisits) {
      belowMinimum++
      continue
    }
    const start = mostOften(a.starts, (x, y) => x - y)
    const day = mostOften(a.days, (x, y) => WEEKDAYS.indexOf(x) - WEEKDAYS.indexOf(y))
    rows.push({
      key,
      name: a.name,
      address: mostOften(a.addresses, (x, y) => x.localeCompare(y))?.[0] ?? null,
      visits: a.visits,
      usualStart: start?.[0] ?? null,
      usualStartCount: start?.[1] ?? 0,
      usualDay: day?.[0] ?? null,
      usualDayCount: day?.[1] ?? 0,
      dayCounts: Object.fromEntries(WEEKDAYS.map((d) => [d, a.days.get(d) ?? 0])) as Record<Weekday, number>,
      sheetVisits: a.worked.length,
      avgWorked: mean(a.worked),
      avgSpan: mean(a.spans),
      avgScheduled: mean(a.scheduled),
    })
  }
  rows.sort((x, y) => x.name.localeCompare(y.name, undefined, { sensitivity: 'base' }))
  return { rows, belowMinimum, longSheets }
}

/** Minutes as "1:05". */
export const hoursMinutes = (m: number | null) => (m === null ? '–' : `${Math.floor(Math.round(m) / 60)}:${String(Math.round(m) % 60).padStart(2, '0')}`)

/** Minutes after midnight as "08:30". */
export const clockText = (m: number | null) => (m === null ? '–' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
