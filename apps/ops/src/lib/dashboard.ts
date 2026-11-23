// The dashboard's numbers, built from what the reports already compute. The rules:
//  - "this period so far" is the live pay period up to now; it is compared with the
//    previous period up to the same point (same weekday and time, 7 days earlier);
//  - yesterday's problems come from the punctuality rules for that one day;
//  - paperwork covers this period and the last one: timesheets waiting for approval,
//    and open complaints (from the feedback loaded);
//  - approved time not yet invoiced looks further back: one pay period at a time for as long
//    as the one just read still has something to invoice, and never before RECORD_START;
//  - kudos are the last 14 days, newest first.
import type { ClientRate, Feedback, Invoiced, ReviewResponse, Timesheet } from '../types'
import { approvalStats } from './approvals'
import { buildClientHours } from './clientHours'
import { cleanerTotals, countVisits } from './feedback'
import { buildInvoicing } from './invoicing'
import { overtime } from './overtime'
import type { OvertimeRow } from './overtime'
import type { PunctualVisit } from './punctuality'
import { buildPunctuality } from './punctuality'
import { buildReview } from './review'
import { buildSchedVsActual } from './schedVsActual'
import { TARGETS } from './targets'
import { addDays } from './week'

const DAY_MS = 86_400_000
const ms = (iso: string) => Date.parse(iso)

/** The part of a period that had started by `cutoff`: shifts and timesheets that began before it. */
export function upTo(data: ReviewResponse, cutoff: number): ReviewResponse {
  return {
    ...data,
    shifts: data.shifts.filter((s) => ms(s.startTime) < cutoff),
    timesheets: data.timesheets.filter((t) => ms(t.from) < cutoff),
    otherShifts: data.otherShifts,
  }
}

/** Two periods as one, without doubles. */
export function merge(a: ReviewResponse, b: ReviewResponse): ReviewResponse {
  const uniq = <T extends { id: string }>(xs: T[]) => [...new Map(xs.map((x) => [x.id, x])).values()]
  return { ...a, shifts: uniq([...a.shifts, ...b.shifts]), timesheets: uniq([...a.timesheets, ...b.timesheets]), otherShifts: uniq([...a.otherShifts, ...b.otherShifts]) }
}

export interface Scorecard {
  billed: number
  pending: number
  onTimeRate: number | null
  noShows: number
  visits: number
  /** (actual - scheduled) / scheduled, or null with nothing scheduled. */
  hoursVsSchedule: number | null
  kudos: number
  complaints: number
  /** Client-day visits from timesheets, the base of the feedback rates. */
  feedbackVisits: number
}

/** One period's figures up to `now`, billed at the clients' prices; feedback is counted from `from` to `to` (dates, inclusive). */
export function scorecard(data: ReviewResponse, rates: ClientRate[], feedback: Feedback[], from: string, to: string, now: number, graceMinutes?: number): Scorecard {
  const h = buildClientHours(data.periodStart, data.timesheets, rates)
  const p = buildPunctuality(data, now, graceMinutes).total
  const sva = buildSchedVsActual(data, now)
  const mine = feedback.filter((f) => f.date >= from && f.date <= to)
  return {
    billed: h.billed,
    pending: h.pending,
    onTimeRate: p.onTimeRate,
    noShows: p.noShows,
    visits: p.scheduled,
    hoursVsSchedule: sva.scheduled ? (sva.actual - sva.scheduled) / sva.scheduled : null,
    kudos: mine.filter((f) => f.type === 'kudos').length,
    complaints: mine.filter((f) => f.type === 'complaint').length,
    feedbackVisits: countVisits(data.timesheets).total,
  }
}

export type Level = 'good' | 'warn' | 'bad'

/** Each scorecard figure against its target. */
export function judge(s: Scorecard): Record<'onTime' | 'noShows' | 'hours' | 'complaints', Level | null> {
  const per100 = s.feedbackVisits ? (s.complaints * 100) / s.feedbackVisits : null
  return {
    onTime: s.onTimeRate === null ? null : s.onTimeRate >= TARGETS.onTimeRate ? 'good' : 'warn',
    noShows: s.noShows <= TARGETS.noShows ? 'good' : 'bad',
    hours: s.hoursVsSchedule === null ? null : Math.abs(s.hoursVsSchedule) <= TARGETS.hoursBand ? 'good' : 'warn',
    complaints: per100 === null ? null : per100 < TARGETS.complaintsPer100 ? 'good' : 'warn',
  }
}

export interface Paperwork {
  waiting: number
  waitingMinutes: number
  waitingLong: number
  toInvoice: number
  toInvoiceDays: number
  oldestToInvoice: string | null
  openComplaints: Feedback[]
}

/** A pay period's timesheets: all that "approved, not yet invoiced" needs of it. */
export interface PeriodSheets {
  periodStart: string
  timesheets: Timesheet[]
}

/** A pay period's client-days that are approved, worth something and not ticked as invoiced, from `since` on. */
function toInvoiceIn(d: PeriodSheets, rates: ClientRate[], invoiced: Invoiced[], since: string) {
  return buildInvoicing(buildClientHours(d.periodStart, d.timesheets, rates), invoiced).days.flatMap((day) =>
    day.rows.filter((r) => !r.invoiced && r.amount > 0 && r.date >= since),
  )
}

export interface LookBack {
  /** The earlier periods to have loaded, newest first: those already read, then at most one still to read. */
  ask: string[]
  /** Those of `ask` that are loaded. */
  read: PeriodSheets[]
  /** Nothing further back needs reading. */
  settled: boolean
  /** It stopped at the limit with the oldest period read still not clean: there may be more further back. */
  more: boolean
  /** The first day the figure covers. */
  from: string
}

/**
 * How far back "approved, not yet invoiced" has to look. Starting from last period, it steps back one pay
 * period at a time for as long as the period just read still has something to invoice. It stops at a clean
 * period, at `since` (nothing before it counts: decision 0036), or after `max` periods counting this one.
 * `loaded` gives an earlier period's timesheets once they are in, so the next step is known only after the
 * one before it: they are read one at a time. A period left uninvoiced behind a clean one is not found.
 */
export function lookBack(
  prev: PeriodSheets,
  loaded: (periodStart: string) => PeriodSheets | undefined,
  rates: ClientRate[],
  invoiced: Invoiced[],
  since: string,
  max: number,
): LookBack {
  const later = (a: string, b: string) => (a > b ? a : b)
  const ask: string[] = []
  const read: PeriodSheets[] = []
  let last = prev
  for (;;) {
    const from = later(last.periodStart, since)
    if (toInvoiceIn(last, rates, invoiced, since).length === 0) return { ask, read, settled: true, more: false, from }
    const next = addDays(last.periodStart, -7)
    // the whole of the period before is from before the record starts
    if (addDays(next, 6) < since) return { ask, read, settled: true, more: false, from }
    // this period and last are always read; each one asked for here is one more
    if (ask.length + 2 >= max) return { ask, read, settled: true, more: true, from }
    ask.push(next)
    const got = loaded(next)
    if (!got) return { ask, read, settled: false, more: false, from }
    read.push(got)
    last = got
  }
}

export function paperwork(
  cur: ReviewResponse,
  prev: ReviewResponse,
  rates: ClientRate[],
  invoiced: Invoiced[],
  feedback: Feedback[],
  now: number,
  /** Nothing dated before this is "not yet invoiced" (RECORD_START). */
  since: string,
  /** Earlier periods read by `lookBack`, for the uninvoiced figure only. */
  earlier: PeriodSheets[] = [],
): Paperwork {
  const both = merge(prev, cur)
  const review = buildReview(both, now)
  const open = [...earlier, prev, cur].flatMap((d) => toInvoiceIn(d, rates, invoiced, since))
  return {
    waiting: review.rows.length,
    waitingMinutes: review.waitingMinutes,
    waitingLong: approvalStats(both.timesheets, now).total.waitingLong,
    toInvoice: open.reduce((n, r) => n + r.amount, 0),
    toInvoiceDays: open.length,
    oldestToInvoice: open.map((r) => r.date).sort()[0] ?? null,
    openComplaints: feedback.filter((f) => f.type === 'complaint' && f.status !== 'resolved').sort((a, b) => b.date.localeCompare(a.date)),
  }
}

/** Yesterday's visits with a problem: no timesheet, late, or left early. */
export function yesterdayProblems(cur: ReviewResponse, prev: ReviewResponse, yesterday: string, now: number, graceMinutes?: number): { problems: PunctualVisit[]; total: number } {
  const visits = buildPunctuality(merge(prev, cur), now, graceMinutes).total.visits.filter((v) => v.date === yesterday)
  const problems = visits.filter((v) => v.status === 'no-show' || v.status === 'late' || v.leftEarlyBy > 0)
  const rank = (v: PunctualVisit) => (v.status === 'no-show' ? 0 : v.status === 'late' ? 1 : 2)
  return { problems: problems.sort((a, b) => rank(a) - rank(b) || ms(a.shift.startTime) - ms(b.shift.startTime)), total: visits.length }
}

/** Over 44 h, or on course to be, this period; "near" is left to Payroll hours. */
export const overtimeRisks = (cur: ReviewResponse, now: number): OvertimeRow[] => overtime(cur.timesheets, cur.shifts, now).filter((r) => r.level !== 'near')

export interface KudosCard {
  recent: Feedback[]
  /** Cleaners with the most kudos this period. */
  leaders: { name: string; kudos: number }[]
}

export function kudosCard(feedback: Feedback[], today: string, periodStart: string): KudosCard {
  const from = addDays(today, -13)
  const kudos = feedback.filter((f) => f.type === 'kudos')
  return {
    recent: kudos.filter((f) => f.date >= from).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    leaders: cleanerTotals(kudos.filter((f) => f.date >= periodStart))
      .filter((c) => c.kudos > 0)
      .sort((a, b) => b.kudos - a.kudos || a.name.localeCompare(b.name))
      .slice(0, 3)
      .map((c) => ({ name: c.name, kudos: c.kudos })),
  }
}

/** The same moment one period earlier, for the comparison. */
export const samePointLastPeriod = (now: number) => now - 7 * DAY_MS
