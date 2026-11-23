// Trends: each finished pay period's figures, kept so the dashboard can chart several
// weeks without re-reading them all from Camelo. The rules, in one place:
//  - a period's figures are worked out here, with the same builders the reports use,
//    and saved through /api/snapshots; only finished periods are saved;
//  - late approvals and edits change a finished period, so a saved period is worked
//    out again (at most once a day) until it has been over for SETTLE_DAYS, then kept;
//  - a snapshot with an older SNAPSHOT_VERSION is worked out again, so a change to
//    the rules reaches the history. Bump it when a figure's meaning changes.
import type { ClientRate, Feedback, PeriodSnapshot, ReviewResponse } from '../types'
import { buildClientHours } from './clientHours'
import { cleanerTotals, countVisits } from './feedback'
import { fridayOf } from './payroll'
import { GRACE_MINUTES, buildPunctuality } from './punctuality'
import { buildSchedVsActual } from './schedVsActual'
import { TARGETS } from './targets'
import { addDays } from './week'

export const SNAPSHOT_VERSION = 2
/** How many finished pay periods the trend shows. */
export const TREND_PERIODS = 13
const SETTLE_DAYS = 14
const DAY_MS = 86_400_000

type Unsaved = Omit<PeriodSnapshot, 'savedAt' | 'savedBy'>

/** The finished pay periods to chart, oldest first. */
export function trendPeriods(today: string, count = TREND_PERIODS): string[] {
  const last = addDays(fridayOf(today), -7)
  return Array.from({ length: count }, (_, i) => addDays(last, -7 * (count - 1 - i)))
}

/** Roughly when a period ended (midnight in Toronto is 04:00 or 05:00 UTC). */
const endedAt = (periodStart: string) => Date.parse(`${addDays(periodStart, 7)}T05:00:00Z`)

/** Whether a period's figures need working out (again). */
export function needsSnapshot(saved: PeriodSnapshot | undefined, periodStart: string, now: number, graceMinutes = GRACE_MINUTES): boolean {
  if (!saved || saved.v < SNAPSHOT_VERSION || saved.totals.grace !== graceMinutes) return true
  const settled = endedAt(periodStart) + SETTLE_DAYS * DAY_MS
  return saved.savedAt < settled && now - saved.savedAt > DAY_MS
}

/**
 * A finished period's figures, billed at the clients' prices; feedback is counted on the
 * period's seven dates. A price has a start date, so setting one does not change the weeks
 * before it and SNAPSHOT_VERSION stays as it is.
 */
export function snapshotOf(data: ReviewResponse, rates: ClientRate[], feedback: Feedback[], now: number, graceMinutes = GRACE_MINUTES): Unsaved {
  const start = data.periodStart
  const end = addDays(start, 6)
  const hours = buildClientHours(start, data.timesheets, rates)
  const punctual = buildPunctuality(data, now, graceMinutes)
  const sva = buildSchedVsActual(data, now)
  const mine = feedback.filter((f) => f.date >= start && f.date <= end)
  const visits = countVisits(data.timesheets)
  const said = new Map(cleanerTotals(mine).map((c) => [c.id, c]))

  const cleaners = new Map<string, Unsaved['cleaners'][number]>()
  const cleaner = (id: string, name: string) => {
    if (!cleaners.has(id)) cleaners.set(id, { id, name, visits: 0, measured: 0, onTime: 0, late: 0, noShows: 0, scheduledMinutes: 0, actualMinutes: 0, kudos: 0, complaints: 0 })
    return cleaners.get(id)!
  }
  for (const r of punctual.byCleaner) Object.assign(cleaner(r.key, r.name), { visits: r.scheduled, measured: r.measured, onTime: r.onTime, late: r.late, noShows: r.noShows })
  for (const r of sva.rows) Object.assign(cleaner(r.key, r.name), { scheduledMinutes: r.scheduled, actualMinutes: r.actual })
  for (const c of said.values()) Object.assign(cleaner(c.id, c.name), { kudos: c.kudos, complaints: c.complaints })

  const t = punctual.total
  return {
    v: SNAPSHOT_VERSION,
    periodStart: start,
    totals: {
      billed: hours.billed,
      pending: hours.pending,
      visits: t.scheduled,
      measured: t.measured,
      onTime: t.onTime,
      late: t.late,
      noShows: t.noShows,
      grace: graceMinutes,
      scheduledMinutes: sva.scheduled,
      actualMinutes: sva.actual,
      feedbackVisits: visits.total,
      kudos: mine.filter((f) => f.type === 'kudos').length,
      complaints: mine.filter((f) => f.type === 'complaint').length,
    },
    cleaners: [...cleaners.values()].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    clients: hours.groups.map((g) => ({
      key: g.key,
      name: g.name,
      billed: g.sites.reduce((n, s) => n + s.billed, 0),
      approvedMinutes: g.sites.reduce((n, s) => n + s.approved, 0),
    })),
  }
}

export interface Metric {
  key: 'billed' | 'onTime' | 'noShows' | 'hours' | 'kudos' | 'complaints'
  label: string
  /** The figure for a period, or null when there is nothing to divide by. */
  value: (t: Record<string, number>) => number | null
  format: (x: number) => string
  /** A line to draw across the chart, with its label. */
  target?: { value: number; label: string }
  /** Whether a rise is good news, bad news, or neither (for the change note). */
  up: 'good' | 'bad' | 'neutral'
}

const ratio = (a: number | undefined, b: number | undefined) => (b ? (a ?? 0) / b : null)
const per100 = (n: number | undefined, visits: number | undefined) => (visits ? ((n ?? 0) * 100) / visits : null)
const dollars = (x: number) => `$${Math.round(x).toLocaleString('en-US')}`
const whole = (x: number) => `${Math.round(x * 100)}%`
const signedPct = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x * 100).toFixed(1)}%`

/** The charts, in order. */
export const METRICS: Metric[] = [
  { key: 'billed', label: 'Billed', value: (t) => t.billed ?? null, format: dollars, up: 'good' },
  { key: 'onTime', label: 'On time', value: (t) => ratio(t.onTime, t.measured), format: whole, target: { value: TARGETS.onTimeRate, label: `target ${whole(TARGETS.onTimeRate)}` }, up: 'good' },
  { key: 'noShows', label: 'Visits with no timesheet', value: (t) => ratio(t.noShows, t.visits), format: whole, target: { value: 0, label: 'target none' }, up: 'bad' },
  { key: 'hours', label: 'Hours vs schedule', value: (t) => (t.scheduledMinutes ? (t.actualMinutes - t.scheduledMinutes) / t.scheduledMinutes : null), format: signedPct, target: { value: 0, label: 'as scheduled' }, up: 'neutral' },
  { key: 'kudos', label: 'Kudos per 100 visits', value: (t) => per100(t.kudos, t.feedbackVisits), format: (x) => x.toFixed(1), up: 'good' },
  { key: 'complaints', label: 'Complaints per 100 visits', value: (t) => per100(t.complaints, t.feedbackVisits), format: (x) => x.toFixed(1), target: { value: TARGETS.complaintsPer100, label: `target under ${TARGETS.complaintsPer100}` }, up: 'bad' },
]

export interface TrendPoint {
  periodStart: string
  value: number | null
}

/** One metric across the periods, oldest first; a period with nothing saved yet is null. */
export const series = (metric: Metric, periods: string[], saved: ReadonlyMap<string, PeriodSnapshot>): TrendPoint[] =>
  periods.map((p) => ({ periodStart: p, value: saved.has(p) ? metric.value(saved.get(p)!.totals) : null }))

/** Tick values for a chart: the low and high of the data and target, padded so the line never sits on an edge. */
export function scale(points: TrendPoint[], target?: number): { min: number; max: number } {
  const values = [...points.map((p) => p.value).filter((v): v is number => v !== null), ...(target === undefined ? [] : [target])]
  if (!values.length) return { min: 0, max: 1 }
  const [lo, hi] = [Math.min(...values), Math.max(...values)]
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.12
  // a figure that cannot go below zero keeps zero as its floor when it is near
  return { min: lo >= 0 && lo - pad < 0 ? 0 : lo - pad, max: hi + pad }
}
