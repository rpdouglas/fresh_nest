// My week: what a cleaner sees (decisions 0037 and 0038). The server sends one person's own visits,
// on-call days and timesheets; this lays them out by day and adds up the hours with Payroll hours'
// own sums and rounding, so what a cleaner sees is what the office sees for them.
import type { Timesheet } from '../types'
import { buildPayroll } from './payroll'
import { TZ, addDays } from './week'

export interface MyVisitClock {
  state: string
  inAt: string | null
  inPhoto: boolean
  outAt: string | null
  outPhoto: boolean
}

/** One visit, as the server sends it: only what the person doing it needs. */
export interface MyVisit {
  id: string
  start: string
  end: string | null
  timezone: string | null
  state: string
  position: string | null
  client: string | null
  site: string | null
  address: string | null
  /** The note on the shift, and the standing note on the job site. */
  note: string | null
  siteNote: string | null
  /** The names of the people working it with them. */
  with: string[]
  /** Their partners' own shift ids on this visit, so each sees the other's photos of the home (decision 0044). */
  partnerShiftIds: string[]
  /** Clock-in/out state from shift.timeCard when Camelo has opened the card (within 4 hours of start). */
  clock?: MyVisitClock
}

export interface MyWeekResponse {
  /** The signed-in cleaner's name; null when the office is looking at someone's week. */
  name: string | null
  /** Whether the signed-in cleaner has a valid Camelo token on the server (decision 0044). */
  cameloConnected?: boolean
  periodStart: string
  visits: MyVisit[]
  /** The days they are on call, YYYY-MM-DD. */
  onCall: string[]
  /** Their own timesheets for the pay period. */
  timesheets: Timesheet[]
}

export interface MyDay {
  date: string
  onCall: boolean
  visits: MyVisit[]
}

export interface MyHours {
  /** Each day of the pay period, in minutes rounded to the quarter hour as Payroll hours does. */
  days: { date: string; approved: number; waiting: number }[]
  approved: number
  waiting: number
}

export interface MyWeek {
  /** Today onwards: today always, then each later day with a visit or an on-call. */
  ahead: MyDay[]
  /** The days of this pay period already gone by that had a visit or an on-call, oldest first. */
  earlier: MyDay[]
  hours: MyHours
}

const dayOf = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso))

export function buildMyWeek(data: MyWeekResponse, today: string): MyWeek {
  const byDay = new Map<string, MyDay>()
  const day = (date: string) => {
    if (!byDay.has(date)) byDay.set(date, { date, onCall: false, visits: [] })
    return byDay.get(date)!
  }
  day(today)
  for (const v of [...data.visits].sort((a, b) => Date.parse(a.start) - Date.parse(b.start))) day(dayOf(v.start)).visits.push(v)
  for (const date of data.onCall) day(date).onCall = true
  const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))

  // Their own row of Payroll hours: the same sums, the same quarter-hour rounding of each day.
  const payroll = buildPayroll(data.periodStart, data.timesheets)
  const hours: MyHours = {
    days: Array.from({ length: 7 }, (_, i) => ({
      date: addDays(data.periodStart, i),
      approved: payroll.dayApproved[i] ?? 0,
      waiting: payroll.dayUnapproved[i] ?? 0,
    })),
    approved: payroll.approved,
    waiting: payroll.unapproved,
  }
  return { ahead: days.filter((d) => d.date >= today), earlier: days.filter((d) => d.date < today), hours }
}
