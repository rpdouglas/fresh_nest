// The schedule check: problems today and in the seven days after, found from the shifts alone.
// The rules, in one place (owner's decisions, 2026-10-12):
//  - On Call is left out of everything; a visit is the shifts that name each other
//    as partners (mergeVisits), so a pair is one visit;
//  - today counts only for visits that have not started yet;
//  - unassigned: a visit, or a place on it, with nobody on it;
//  - solo: one cleaner on a Cleaning, AirBnB or Deep Clean visit, which need a team
//    of two. A shift with no position is treated as Cleaning (the owner's rule: a
//    missing position is a data-entry gap, not a different kind of work). Cleaners booked separately at the same client at overlapping times are
//    a team too, as on Client hours, even when Camelo does not link them as partners.
//    Solo is sometimes fine, so it can be marked OK, one visit at a time;
//  - double-booked: one cleaner on two visits whose times overlap;
//  - long day: a cleaner's scheduled working time in a day adds up to more than 10
//    hours. It is the shifts added together, breaks taken off, and never the stretch
//    from first start to last finish: time between visits is not worked or paid.
//    Every shift that is not On Call counts, with or without a client;
//  - tight gap: the time between two visits in a row at different places is shorter
//    than the estimated drive (owner, 2026-10-13: a drive that fits, however close,
//    is not flagged). The drive is estimated from the straight-line distance; places
//    with no known position are not checked;
//  - over 44 h: a cleaner's scheduled hours in the next pay period, which starts in
//    the window (the period under way has its own warning, from hours worked).
import type { Person, Shift } from '../types'
import { fridayOf } from './payroll'
import { scheduledMinutes } from './review'
import { notOnCall } from './schedule'
import { TARGETS } from './targets'
import type { Visit } from './teams'
import { mergeVisits } from './teams'
import { TZ, addDays } from './week'

export type CheckKind = 'unassigned' | 'double' | 'solo' | 'gap' | 'long' | 'overtime'

export interface Point {
  lat: number
  lon: number
}

export interface Problem {
  key: string
  kind: CheckKind
  /** YYYY-MM-DD; for overtime, the first day of the pay period. */
  date: string
  what: string
  detail: string
  /** Solo only: the shift to mark OK. */
  shiftId?: string
}

export interface CheckDay {
  date: string
  visits: number
  cleaners: number
  problems: Problem[]
}

export interface ScheduleCheck {
  days: CheckDay[]
  /** Every problem, most urgent first: by day, then unassigned, double-booked, solo, gap, long day. */
  problems: Problem[]
  /** Solo visits already marked OK, which are not problems. */
  okSolo: number
  /** Pairs of visits in a row whose drive could not be estimated. */
  gapsNotChecked: number
}

const ms = (iso: string) => Date.parse(iso)
const dayOf = (iso: string, tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso))
const clock = (iso: string, tz: string) => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
const span = (v: { start: string; end: string; tz: string }) => `${clock(v.start, v.tz)} – ${clock(v.end, v.tz)}`
const nameOf = (p: Person) => p.name || 'Someone'
const names = (people: Person[]) => (people.length > 2 ? `${nameOf(people[0])} and ${people.length - 1} others` : people.map(nameOf).join(' and '))
const hoursText = (minutes: number) => `${(minutes / 60).toFixed(1)} h`

/** One spelling of an address, for looking up where it is. */
export const addressKey = (address: string | null | undefined) => (address ?? '').replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * The position that needs a team of two, or null. Camelo's names vary ("cleaning",
 * "AirBNB", "ISLAND 17 AIRBNB", "Deep Cleaner"), so match loosely. No position at
 * all counts as Cleaning.
 */
export function teamPosition(position: string | null | undefined): 'Cleaning' | 'AirBnB' | 'Deep Clean' | null {
  const p = (position ?? '').replace(/[\s_-]+/g, '').toLowerCase()
  if (p.includes('airbnb')) return 'AirBnB'
  if (p.startsWith('deepclean')) return 'Deep Clean'
  return p === 'cleaning' || p === '' ? 'Cleaning' : null
}

/** Kilometres in a straight line between two points. */
export function straightKm(a: Point, b: Point): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** Roads are longer than the straight line; town speed for the first stretch, highway speed beyond it. */
export function driveEstimate(km: number): { km: number; minutes: number } {
  const road = km * TARGETS.roadFactor
  const town = Math.min(road, TARGETS.townKm)
  return { km: road, minutes: Math.round(TARGETS.parkMinutes + (town / TARGETS.townKmh) * 60 + ((road - town) / TARGETS.highwayKmh) * 60) }
}

const RANK: Record<CheckKind, number> = { unassigned: 0, double: 1, solo: 2, gap: 3, long: 4, overtime: 5 }

/** Days checked: today and the seven after. */
export const CHECK_DAYS = 8

/** The Monday-weeks to load so the window, and the pay period that starts in it, are complete. */
export function weeksFor(from: string): string[] {
  const monday = (d: string) => addDays(d, -((new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7))
  const last = addDays(nextPeriod(from), 6)
  const weeks: string[] = []
  for (let w = monday(from); w <= last; w = addDays(w, 7)) weeks.push(w)
  return weeks
}

/** The pay period (a Friday) after the one `today` is in; it starts within the next seven days. */
export const nextPeriod = (today: string) => addDays(fridayOf(today), 7)

/**
 * Checks `from` (today, YYYY-MM-DD) and the seven days after. `shifts` should cover
 * them and the next pay period; visits that had started by `now` are left out; `ok`
 * holds the shift ids of solo visits marked OK; `places` maps addressKey to a
 * position, or null where none was found.
 */
export function checkSchedule(loaded: Shift[], from: string, now: number, ok: ReadonlySet<string>, places: ReadonlyMap<string, Point | null>): ScheduleCheck {
  const shifts = [...new Map(loaded.filter(notOnCall).map((s) => [s.id, s])).values()]
  const byId = new Map(shifts.map((s) => [s.id, s]))
  const to = addDays(from, CHECK_DAYS - 1)
  const inWindow = (date: string) => date >= from && date <= to
  const merged = mergeVisits(shifts)
  const visits = merged.visits.map((v) => ({ v, date: dayOf(v.start, v.tz) })).filter((x) => inWindow(x.date) && ms(x.v.start) >= now)
  const problems: Problem[] = []
  let okSolo = 0
  let gapsNotChecked = 0

  const placeOf = (v: Visit) => v.client?.id ?? (addressKey(v.jobSite?.address) || v.title)
  /** Someone else is at the same client at an overlapping time, on a visit of their own. */
  const hasCompany = (v: Visit) =>
    visits.some(({ v: o }) => o !== v && placeOf(o) === placeOf(v) && ms(o.start) < ms(v.end) && ms(v.start) < ms(o.end) && o.staff.some((p) => p.id !== v.staff[0].id))

  for (const { v, date } of visits) {
    const ids = v.key.split('+')
    const empty = ids.filter((id) => !byId.get(id)?.assignee).length
    const needsTeam = (v.positions.length ? v.positions : [null]).map(teamPosition).find(Boolean) ?? null
    if (empty) {
      problems.push({
        key: `unassigned:${v.key}`,
        kind: 'unassigned',
        date,
        what: v.staff.length ? `${v.title}, ${span(v)}: ${empty} of ${ids.length} places not filled` : `${v.title}, ${span(v)}, nobody assigned`,
        detail: `${v.positions.join(', ') || 'No position'}${needsTeam && ids.length < 2 ? '. Needs two people.' : v.staff.length ? `. ${names(v.staff)} so far.` : '.'}`,
      })
    } else if (v.staff.length === 1 && needsTeam && !hasCompany(v)) {
      if (ok.has(ids[0])) okSolo++
      else problems.push({ key: `solo:${v.key}`, kind: 'solo', date, what: `${nameOf(v.staff[0])} alone at ${v.title}`, detail: `${v.positions.join(', ') || 'No position'}, ${span(v)}. ${needsTeam} visits need a team of two.`, shiftId: ids[0] })
    }
  }
  // a shift with no client or site and nobody on it
  for (const b of merged.blocks) {
    const date = dayOf(b.start, b.tz)
    if (!b.person && inWindow(date) && ms(b.start) >= now) problems.push({ key: `unassigned:${b.key}`, kind: 'unassigned', date, what: `${b.position || 'A shift'} with no client, ${span(b)}, nobody assigned`, detail: b.note?.trim() || 'No note on the shift.' })
  }

  // each cleaner's visits, day by day
  const mine = new Map<string, { person: Person; date: string; visits: Visit[] }>()
  for (const { v, date } of visits) {
    for (const p of v.staff) {
      const key = `${p.id}|${date}`
      if (!mine.has(key)) mine.set(key, { person: p, date, visits: [] })
      mine.get(key)!.visits.push(v)
    }
  }
  const doubles = new Map<string, { date: string; a: Visit; b: Visit; people: Person[] }>()
  const gaps = new Map<string, { date: string; a: Visit; b: Visit; people: Person[] }>()
  const pair = (map: typeof doubles, date: string, a: Visit, b: Visit, person: Person) => {
    const key = `${a.key}>${b.key}`
    if (!map.has(key)) map.set(key, { date, a, b, people: [] })
    map.get(key)!.people.push(person)
  }
  for (const { person, date, visits: list } of mine.values()) {
    list.sort((a, b) => ms(a.start) - ms(b.start) || ms(a.end) - ms(b.end) || a.key.localeCompare(b.key))
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) if (ms(list[j].start) < ms(list[i].end)) pair(doubles, date, list[i], list[j], person)
      if (i + 1 < list.length && ms(list[i + 1].start) >= ms(list[i].end)) pair(gaps, date, list[i], list[i + 1], person)
    }
  }
  // each cleaner's working time, day by day: their own shifts added up
  const work = new Map<string, { person: Person; date: string; minutes: number; shifts: number; first: string; last: string; tz: string }>()
  for (const s of shifts) {
    const tz = s.timezone || TZ
    const date = dayOf(s.startTime, tz)
    if (!s.assignee || !inWindow(date) || ms(s.startTime) < now) continue
    const key = `${s.assignee.id}|${date}`
    if (!work.has(key)) work.set(key, { person: s.assignee, date, minutes: 0, shifts: 0, first: s.startTime, last: s.endTime, tz })
    const w = work.get(key)!
    w.minutes += scheduledMinutes(s)
    w.shifts++
    if (ms(s.startTime) < ms(w.first)) w.first = s.startTime
    if (ms(s.endTime) > ms(w.last)) w.last = s.endTime
  }
  for (const w of work.values()) {
    if (w.minutes > TARGETS.longDayHours * 60) {
      problems.push({ key: `long:${w.person.id}|${w.date}`, kind: 'long', date: w.date, what: `${nameOf(w.person)} scheduled ${hoursText(w.minutes)} of work`, detail: `${w.shifts} shift${w.shifts === 1 ? '' : 's'} between ${clock(w.first, w.tz)} and ${clock(w.last, w.tz)}.` })
    }
  }
  for (const [key, d] of doubles) {
    problems.push({ key: `double:${key}`, kind: 'double', date: d.date, what: `${names(d.people)} booked twice: ${d.a.title} and ${d.b.title}`, detail: `${d.a.title} ${span(d.a)}; ${d.b.title} ${span(d.b)}.` })
  }
  for (const [key, g] of gaps) {
    const [a, b] = [addressKey(g.a.jobSite?.address), addressKey(g.b.jobSite?.address)]
    if (a && a === b) continue
    const [pa, pb] = [places.get(a), places.get(b)]
    if (!pa || !pb) {
      gapsNotChecked++
      continue
    }
    const drive = driveEstimate(straightKm(pa, pb))
    const gap = Math.round((ms(g.b.start) - ms(g.a.end)) / 60_000)
    if (gap < drive.minutes + TARGETS.gapSpareMinutes) {
      problems.push({ key: `gap:${key}`, kind: 'gap', date: g.date, what: `${names(g.people)}, ${g.a.title} → ${g.b.title}`, detail: `${gap} min between visits; about ${drive.minutes} min drive (${drive.km.toFixed(1)} km).` })
    }
  }

  // scheduled hours in the pay period that starts in the window
  const period = nextPeriod(from)
  const periodEnd = addDays(period, 6)
  const scheduled = new Map<string, { person: Person; minutes: number }>()
  for (const s of shifts) {
    const date = dayOf(s.startTime, s.timezone || TZ)
    if (!s.assignee || date < period || date > periodEnd) continue
    if (!scheduled.has(s.assignee.id)) scheduled.set(s.assignee.id, { person: s.assignee, minutes: 0 })
    scheduled.get(s.assignee.id)!.minutes += scheduledMinutes(s)
  }
  for (const { person, minutes } of scheduled.values()) {
    if (minutes > TARGETS.overtimeHours * 60) {
      problems.push({ key: `overtime:${person.id}|${period}`, kind: 'overtime', date: period, what: `${nameOf(person)} scheduled ${hoursText(minutes)} in the next pay period`, detail: `Overtime starts after ${TARGETS.overtimeHours} h.` })
    }
  }

  problems.sort((a, b) => Number(a.kind === 'overtime') - Number(b.kind === 'overtime') || a.date.localeCompare(b.date) || RANK[a.kind] - RANK[b.kind] || a.what.localeCompare(b.what))
  const days = Array.from({ length: CHECK_DAYS }, (_, i): CheckDay => {
    const date = addDays(from, i)
    const todays = visits.filter((x) => x.date === date)
    return {
      date,
      visits: todays.length,
      cleaners: new Set(todays.flatMap((x) => x.v.staff.map((p) => p.id))).size,
      problems: problems.filter((p) => p.date === date && p.kind !== 'overtime'),
    }
  })
  return { days, problems, okSolo, gapsNotChecked }
}

/** The addresses in the window whose position is needed for the tight-gap check. */
export function addressesToPlace(loaded: Shift[], from: string): string[] {
  const to = addDays(from, CHECK_DAYS - 1)
  const wanted = new Map<string, string>()
  for (const s of loaded.filter(notOnCall)) {
    const date = dayOf(s.startTime, s.timezone || TZ)
    const address = s.jobSite?.address?.replace(/\s+/g, ' ').trim()
    if (address && date >= from && date <= to) wanted.set(addressKey(address), address)
  }
  return [...wanted.values()].sort()
}
