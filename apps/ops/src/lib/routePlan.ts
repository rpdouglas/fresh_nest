// A recurring four-week plan of routes from the office: each client on its usual weekday,
// as near its usual start as the day allows, shared among a few teams of two.
//  - How often: from the visits seen in the weeks loaded, scaled to four weeks. Six or more is a
//    client seen several times a week: weekly on each weekday it was seen at least every other
//    week. 2.75 or more is weekly; 1.5 or more every two weeks; less, every four weeks.
//    Every-two and every-four week clients are spread over the weeks to even out each weekday.
//  - Length: the mean time cleaning, else the scheduled length, rounded up to 15 minutes.
//  - Each team leaves the office for its first stop and drives back after its last. A visit
//    goes to the team where it starts nearest its usual time for the least driving; a new team
//    is started only when that saves enough waiting, up to the number of teams a day.
//  - Drive time is the schedule check's estimate from the straight-line distance, rounded up
//    to 5 minutes. It is a guide, not a road route.
import type { ClientPattern, Weekday } from './clientPatterns'
import { WEEKDAYS } from './clientPatterns'
import { type Point, driveEstimate, straightKm } from './scheduleCheck'

/** Minutes late, past this, count against putting a visit on a team. */
const SLACK_MINUTES = 20
/** What starting another team is worth, in minutes of lateness or driving saved. */
const NEW_TEAM_COST = 40
/** Visits planned later than their usual start by more than this are pointed out. */
export const MOVED_NOTICE_MINUTES = 30

/** One colour a team, on the map and in the list beside it (nest teal, clay, a moss green). */
export const TEAM_COLOURS = ['#3d6b75', '#c17a54', '#5b7f3a']

export type Every = 1 | 2 | 4

export interface PlanClient {
  key: string
  name: string
  address: string | null
  /** Where it is; `assumed` when its own address could not be placed and a stand-in was used. */
  point: Point
  assumed: boolean
  usualStart: number
  /** Minutes a visit is planned to take. */
  minutes: number
  /** The weekdays it is planned on, and how often. */
  days: Weekday[]
  every: Every
  /** How often, in words. */
  often: string
}

export interface Stop {
  client: PlanClient
  start: number
  end: number
  /** Minutes from the office or the stop before. */
  drive: number
  /** Minutes later than its usual start. */
  moved: number
}

export interface TeamRoute {
  week: number
  day: Weekday
  team: number
  stops: Stop[]
  leave: number
  back: number
  /** Minutes from the last stop back to the office. */
  driveBack: number
}

/** A client the plan leaves out, and why. */
export interface LeftOut {
  name: string
  why: string
}

/** The minutes a visit is planned to take. */
export const visitMinutes = (c: Pick<ClientPattern, 'avgWorked' | 'avgScheduled'>) => Math.max(30, Math.ceil((c.avgWorked ?? c.avgScheduled ?? 60) / 15) * 15)

/** How often to plan a client, from what was seen over `weeks` weeks. */
export function howOften(c: Pick<ClientPattern, 'visits' | 'usualDay' | 'dayCounts'>, weeks: number): { days: Weekday[]; every: Every; often: string } {
  const perFour = (c.visits / weeks) * 4
  const usual = c.usualDay ? [c.usualDay] : []
  if (perFour >= 6) {
    const days = WEEKDAYS.filter((d) => c.dayCounts[d] / weeks >= 0.5)
    return { days: days.length ? days : usual, every: 1, often: `Weekly, ${days.length || 1} days a week` }
  }
  if (perFour >= 2.75) return { days: usual, every: 1, often: 'Weekly' }
  if (perFour >= 1.5) return { days: usual, every: 2, often: 'Every 2 weeks' }
  return { days: usual, every: 4, often: 'Every 4 weeks' }
}

/**
 * The clients to plan, from the patterns: where each is (`pointOf` its address, else `fallback`, marked as
 * assumed), how long a visit takes and how often. A client with no usual start, or nowhere to put it, is left out.
 */
export function planClients(
  rows: ClientPattern[],
  weeks: number,
  pointOf: (address: string | null) => Point | null,
  fallback: Point | null,
): { clients: PlanClient[]; leftOut: LeftOut[] } {
  const clients: PlanClient[] = []
  const leftOut: LeftOut[] = []
  for (const r of rows) {
    const own = pointOf(r.address)
    const point = own ?? fallback
    if (r.usualStart === null || !r.usualDay) leftOut.push({ name: r.name, why: 'no scheduled start time' })
    else if (!point) leftOut.push({ name: r.name, why: r.address ? 'its address could not be placed on the map' : 'no address in Camelo' })
    else clients.push({ key: r.key, name: r.name, address: r.address, point, assumed: !own, usualStart: r.usualStart, minutes: visitMinutes(r), ...howOften(r, weeks) })
  }
  return { clients, leftOut }
}

/** Minutes to drive between two points, rounded up to 5; none to the same place. */
export function driveMinutes(a: Point | null, b: Point | null): number {
  if (!a || !b || (a.lat === b.lat && a.lon === b.lon)) return 0
  return Math.max(5, Math.ceil(driveEstimate(straightKm(a, b)).minutes / 5) * 5)
}

/** Four weeks of routes for `teams` teams a day, every team starting and ending at `office`. */
export function planRoutes(clients: PlanClient[], office: Point | null, teams: number): TeamRoute[] {
  // Spread the every-2 and every-4 week clients over the weeks, longest first, evening out each weekday.
  const load = new Map<string, number>()
  const weeksOf = new Map<PlanClient, number[]>()
  const order = [...clients].sort((a, b) => a.every - b.every || b.minutes - a.minutes || a.name.localeCompare(b.name))
  for (const c of order) {
    const offsets = Array.from({ length: c.every }, (_, i) => i)
    const weekly = (o: number) => Array.from({ length: 4 / c.every }, (_, i) => 1 + o + i * c.every)
    const busy = (o: number) => weekly(o).reduce((sum, w) => sum + c.days.reduce((s, d) => s + (load.get(`${w}|${d}`) ?? 0), 0), 0)
    const best = offsets.reduce((x, y) => (busy(y) < busy(x) ? y : x))
    weeksOf.set(c, weekly(best))
    for (const w of weekly(best)) for (const d of c.days) load.set(`${w}|${d}`, (load.get(`${w}|${d}`) ?? 0) + c.minutes)
  }

  const routes: TeamRoute[] = []
  for (let week = 1; week <= 4; week++) {
    for (const day of WEEKDAYS) {
      const todays = clients
        .filter((c) => c.days.includes(day) && weeksOf.get(c)!.includes(week))
        .sort((a, b) => a.usualStart - b.usualStart || b.minutes - a.minutes || a.name.localeCompare(b.name))
      const day_: { stops: Stop[]; free: number; at: Point | null }[] = []
      for (const c of todays) {
        const options: { cost: number; team: number; start: number; drive: number }[] = []
        for (const [i, t] of day_.entries()) {
          const drive = driveMinutes(t.at, c.point)
          const start = Math.max(c.usualStart, t.free + drive)
          options.push({ cost: Math.max(0, start - c.usualStart - SLACK_MINUTES) * 2 + drive, team: i, start, drive })
        }
        if (day_.length < Math.max(1, teams)) {
          const drive = driveMinutes(office, c.point)
          options.push({ cost: (day_.length ? NEW_TEAM_COST : 0) + drive, team: day_.length, start: c.usualStart, drive })
        }
        const b = options.reduce((x, y) => (y.cost < x.cost ? y : x))
        if (b.team === day_.length) day_.push({ stops: [], free: 0, at: office })
        const t = day_[b.team]
        t.stops.push({ client: c, start: b.start, end: b.start + c.minutes, drive: b.drive, moved: b.start - c.usualStart })
        t.free = b.start + c.minutes
        t.at = c.point
      }
      day_.forEach((t, i) => {
        const last = t.stops[t.stops.length - 1]
        const driveBack = driveMinutes(last.client.point, office)
        routes.push({ week, day, team: i + 1, stops: t.stops, leave: t.stops[0].start - t.stops[0].drive, back: last.end + driveBack, driveBack })
      })
    }
  }
  return routes
}

/** Minutes of working and driving in a route, office to office. */
export const routeMinutes = (r: TeamRoute) => r.stops.reduce((m, s) => m + s.drive + (s.end - s.start), 0) + r.driveBack
