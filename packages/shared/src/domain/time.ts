/**
 * Time conventions (ADR-020, P3-E38). Pure — no Firebase imports, no dependence on the device's
 * own time zone. Synced into functions/src/shared by functions/scripts/sync-shared.cjs.
 *
 * - Calendar dates ('YYYY-MM-DD') and wall times ('HH:MM') are local to the business zone.
 * - "Today", "tomorrow", "this week" and "this month" are computed in that zone — never with
 *   toISOString(), which gives the UTC date (tomorrow, after ~8 pm in Ontario).
 * - Instants are Date / Firestore Timestamp values (UTC).
 */

/** The business zone. Every job uses it until sites carry their own zone (W1-2). */
export const BUSINESS_TZ = 'America/Toronto'

/** 'YYYY-MM-DD' in the business zone. */
export type CalendarDate = string

export interface ZonedParts {
  year: number
  month: number // 1–12
  day: number
  hour: number // 0–23
  minute: number
  second: number
}

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    })
    formatters.set(timeZone, f)
  }
  return f
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

/** Wall-clock parts of an instant in a zone. */
export function zonedParts(instant: Date, timeZone: string = BUSINESS_TZ): ZonedParts {
  const parts: Record<string, number> = {}
  for (const p of formatterFor(timeZone).formatToParts(instant)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value)
  }
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute, second: parts.second }
}

/** The calendar date an instant falls on in the zone. */
export function calendarDateOf(instant: Date, timeZone: string = BUSINESS_TZ): CalendarDate {
  const p = zonedParts(instant, timeZone)
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`
}

/** Today's date in the business zone. */
export function todayInZone(now: Date = new Date(), timeZone: string = BUSINESS_TZ): CalendarDate {
  return calendarDateOf(now, timeZone)
}

function parseDate(date: CalendarDate): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number)
  return { y, m, d }
}

// Calendar arithmetic runs on UTC midnights, where no clock change exists.
function utcMidnight(date: CalendarDate): Date {
  const { y, m, d } = parseDate(date)
  return new Date(Date.UTC(y, m - 1, d))
}

function fromUtcMidnight(t: Date): CalendarDate {
  return `${pad(t.getUTCFullYear(), 4)}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** The date n days after (or before, when negative) a calendar date. */
export function addDays(date: CalendarDate, n: number): CalendarDate {
  const t = utcMidnight(date)
  t.setUTCDate(t.getUTCDate() + n)
  return fromUtcMidnight(t)
}

/** 0 = Sunday … 6 = Saturday, for a calendar date. */
export function dayOfWeek(date: CalendarDate): number {
  return utcMidnight(date).getUTCDay()
}

/** First day of the week containing the date; weeks start on Monday by default. */
export function startOfWeek(date: CalendarDate, weekStartsOn: 0 | 1 = 1): CalendarDate {
  return addDays(date, -((dayOfWeek(date) - weekStartsOn + 7) % 7))
}

export function startOfMonth(date: CalendarDate): CalendarDate {
  return `${date.slice(0, 7)}-01`
}

export function endOfMonth(date: CalendarDate): CalendarDate {
  const { y, m } = parseDate(date)
  return fromUtcMidnight(new Date(Date.UTC(y, m, 0)))
}

/** 'YYYY-MM' of a calendar date, or of an instant in the zone (earnings months, P7/P13). */
export function monthKey(dateOrInstant: CalendarDate | Date, timeZone: string = BUSINESS_TZ): string {
  const date = typeof dateOrInstant === 'string' ? dateOrInstant : calendarDateOf(dateOrInstant, timeZone)
  return date.slice(0, 7)
}

/** The month before a 'YYYY-MM' key. */
export function previousMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`
}

/** Offset of the zone from UTC at an instant, in milliseconds (EDT: −4 h). */
function offsetMs(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000
}

/**
 * The instant a local date and wall time ('HH:MM') happen in the zone.
 * - Clock going back (Nov 1, 01:30 happens twice): the first, daylight-time 01:30.
 * - Clock going forward (a 02:30 that never happens): moved forward by the gap, to 03:30.
 */
export function zonedWallTimeToInstant(date: CalendarDate, hhmm: string, timeZone: string = BUSINESS_TZ): Date {
  const { y, m, d } = parseDate(date)
  const [h, min] = hhmm.split(':').map(Number)
  const wall = Date.UTC(y, m - 1, d, h, min)
  const DAY = 24 * 60 * 60 * 1000
  const offsets = [offsetMs(new Date(wall - DAY), timeZone), offsetMs(new Date(wall + DAY), timeZone)]
  const matches = offsets
    .map((o) => wall - o)
    .filter((t) => {
      const p = zonedParts(new Date(t), timeZone)
      return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) === wall
    })
  if (matches.length > 0) return new Date(Math.min(...matches))
  return new Date(wall - offsets[0])
}

/**
 * Minutes that really pass between two wall times on a date. Differs from the wall-clock
 * difference only across a clock change: 00:00–04:00 on Nov 1, 2026 is 300 minutes.
 */
export function elapsedMinutes(date: CalendarDate, startHhmm: string, endHhmm: string, timeZone: string = BUSINESS_TZ): number {
  const start = zonedWallTimeToInstant(date, startHhmm, timeZone).getTime()
  const end = zonedWallTimeToInstant(date, endHhmm, timeZone).getTime()
  return Math.round((end - start) / 60000)
}
