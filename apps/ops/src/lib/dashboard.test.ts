import { describe, expect, it } from 'vitest'
import type { Feedback, Invoiced, ReviewResponse, ReviewSheet, ReviewShift } from '../types'
import { judge, kudosCard, lookBack, paperwork, scorecard, upTo, yesterdayProblems } from './dashboard'
import { RECORD_START } from './targets'

const at = (day: number, hm: string) => `2026-10-${String(day).padStart(2, '0')}T${hm}:00-04:00`
const person = (name: string) => ({ id: name.toLowerCase(), name })
function shift(id: string, who: string, day: number, start: string, end: string): ReviewShift {
  return { id, state: 'FINISHED', startTime: at(day, start), endTime: at(day, end), timezone: 'America/Toronto', breakDuration: 0, client: { id: 'c1', name: 'Harper' }, assignee: person(who), jobSite: { id: 's1', name: 'Harper' }, group: { id: 'g', name: 'Cleaning' } }
}
function sheet(id: string, who: string, day: number, start: string, minutes: number, shiftId: string | null, state = 'APPROVED'): ReviewSheet {
  const from = at(day, start)
  return { id, state, from, to: new Date(Date.parse(from) + minutes * 60_000).toISOString(), totalDuration: minutes, timezone: 'America/Toronto', approvedAt: null, employee: person(who), group: { name: 'Cleaning' }, client: { id: 'c1', name: 'Harper' }, jobSite: { id: 's1', name: 'Harper' }, referenceObject: shiftId ? { __typename: 'TimeCard', shiftId } : null }
}
const period = (periodStart: string, shifts: ReviewShift[], timesheets: ReviewSheet[]): ReviewResponse => ({ periodStart, from: '', to: '', shifts, timesheets, otherShifts: [] })
let n = 0
const fb = (type: Feedback['type'], date: string, over: Partial<Feedback> = {}): Feedback => ({
  id: `f${++n}`, type, date, visitStart: null, visitEnd: null, timesheetIds: [], clientKey: 'c1', clientName: 'Harper', siteName: null, cleaners: [person('Maya')],
  text: 'Lovely', source: 'Phone', category: 'Quality', status: type === 'complaint' ? 'open' : null, resolution: null, createdAt: 1, createdBy: 'b', updatedAt: null, updatedBy: null, ...over,
})

// a start date early enough that every day in these tests counts
const ALWAYS = '2026-01-01'
// Current period Fri Oct 9 to Thu Oct 15; now is Mon Oct 12, 8:00. Previous: Fri Oct 2 to Thu Oct 8.
const NOW = Date.parse(at(12, '08:00'))
const cur = period('2026-10-09', [shift('a', 'Maya', 9, '08:00', '10:00'), shift('b', 'Jo', 11, '08:00', '10:00'), shift('c', 'Maya', 11, '13:00', '15:00'), shift('z', 'Maya', 13, '08:00', '10:00')], [
  sheet('t1', 'Maya', 9, '08:00', 120, 'a'),
  sheet('t2', 'Jo', 11, '08:25', 95, 'b'),
  // Maya's 1 PM visit on the 11th: no timesheet
])
const prev = period('2026-10-02', [shift('p1', 'Maya', 2, '08:00', '10:00'), shift('p2', 'Maya', 6, '08:00', '10:00')], [
  sheet('u1', 'Maya', 2, '08:00', 120, 'p1'),
  sheet('u2', 'Maya', 6, '08:00', 120, 'p2', 'SUBMITTED'),
])

describe('this period so far, against the same point last period', () => {
  it('counts only what had started by the cutoff', () => {
    const lastWeek = upTo(prev, NOW - 7 * 86_400_000)
    expect(lastWeek.shifts.map((s) => s.id)).toEqual(['p1'])
    expect(lastWeek.timesheets.map((t) => t.id)).toEqual(['u1'])
  })

  it('builds billed, punctuality, hours and feedback figures, and judges them against the targets', () => {
    const s = scorecard(cur, [], [fb('kudos', '2026-10-10'), fb('complaint', '2026-10-11'), fb('kudos', '2026-10-01')], '2026-10-09', '2026-10-12', NOW)
    // 2 h and 1.5 h (95 min rounds to 1.50) approved at $75
    expect([s.billed, s.pending]).toEqual([262.5, 0])
    expect([s.onTimeRate, s.noShows, s.visits]).toEqual([0.5, 1, 3])
    expect(s.hoursVsSchedule).toBeCloseTo((215 - 360) / 360)
    expect([s.kudos, s.complaints, s.feedbackVisits]).toEqual([1, 1, 2])
    expect(judge(s)).toEqual({ onTime: 'warn', noShows: 'bad', hours: 'warn', complaints: 'warn' })
  })

  it("bills at a client's own price from the day it starts", () => {
    const flat = [{ clientKey: 'c1', clientName: 'Harper', rules: [{ from: '2026-10-10', kind: 'flat' as const, dollars: 180, setAt: 1, setBy: 'b' }] }]
    // Oct 9 stays 2 h at $75; Oct 11 is one flat visit
    expect(scorecard(cur, flat, [], '2026-10-09', '2026-10-12', NOW).billed).toBe(330)
    expect(paperwork(cur, prev, flat, [], [], NOW, ALWAYS).toInvoice).toBe(480)
    // a five-minute visit rounds to no time, and at a flat price is still to invoice
    const brief = period('2026-10-09', [], [sheet('t9', 'Maya', 11, '08:00', 5, null)])
    expect(paperwork(brief, period('2026-10-02', [], []), flat, [], [], NOW, ALWAYS).toInvoiceDays).toBe(1)
  })
})

describe('approved, not yet invoiced', () => {
  // one approved two-hour visit ($150) on each day given, in the pay period starting `start`
  const week = (start: string, days: number[], month = 10) => ({
    periodStart: start,
    timesheets: days.map((d) => ({ ...sheet(`${start}-${d}`, 'Maya', d, '08:00', 120, null), from: at(d, '08:00').replace('-10-', `-${String(month).padStart(2, '0')}-`) })),
  })
  const ticked = (date: string, ids: string[]): Invoiced => ({ id: `${date}|c1`, date, clientKey: 'c1', clientName: 'Harper', invoiced: true, minutes: 120, amount: 150, timesheetIds: ids, updatedAt: 1, updatedBy: 'b' })
  const from = (...weeks: { periodStart: string }[]) => (start: string) => weeks.find((w) => w.periodStart === start) as ReturnType<typeof week> | undefined

  it('the record starts on Friday 2026-10-09', () => {
    expect(RECORD_START).toBe('2026-10-09')
    expect(new Date(`${RECORD_START}T12:00:00Z`).getUTCDay()).toBe(5)
  })

  it('counts nothing dated before the start', () => {
    // Oct 2 (last period) is approved and not invoiced, and is from before the start
    expect(paperwork(cur, prev, [], [], [], NOW, ALWAYS).toInvoice).toBe(150 + 262.5)
    const p = paperwork(cur, prev, [], [], [], NOW, '2026-10-09')
    expect([p.toInvoice, p.toInvoiceDays, p.oldestToInvoice]).toEqual([262.5, 2, '2026-10-09'])
    // the start can fall inside a period: the days from it on still count
    expect(paperwork(cur, prev, [], [], [], NOW, '2026-10-10').toInvoiceDays).toBe(1)
  })

  it('does not look back when last period has nothing left to invoice', () => {
    const clean = week('2026-10-02', [])
    expect(lookBack(clean, from(), [], [], ALWAYS, 13)).toEqual({ ask: [], read: [], settled: true, more: false, from: '2026-10-02' })
    // approved and ticked is clean too
    const done = week('2026-10-02', [5])
    expect(lookBack(done, from(), [], [ticked('2026-10-05', ['2026-10-02-5'])], ALWAYS, 13).ask).toEqual([])
    // and so is a period with only time still waiting for approval
    const waiting = { periodStart: '2026-10-02', timesheets: [sheet('w', 'Maya', 5, '08:00', 120, null, 'SUBMITTED')] }
    expect(lookBack(waiting, from(), [], [], ALWAYS, 13).ask).toEqual([])
  })

  it('steps back one period at a time, and stops at the first clean one', () => {
    const [w2, w3, w4] = [week('2026-10-02', [5]), week('2026-09-25', [28], 9), week('2026-09-18', [], 9)]
    // last period has something to invoice: the one before is asked for, and nothing is known until it is in
    expect(lookBack(w2, from(), [], [], ALWAYS, 13)).toEqual({ ask: ['2026-09-25'], read: [], settled: false, more: false, from: '2026-10-02' })
    // it has something too: one more
    expect(lookBack(w2, from(w3), [], [], ALWAYS, 13)).toEqual({ ask: ['2026-09-25', '2026-09-18'], read: [w3], settled: false, more: false, from: '2026-09-25' })
    // that one is clean: done, and the figure covers back to its first day
    const done = lookBack(w2, from(w3, w4), [], [], ALWAYS, 13)
    expect(done).toEqual({ ask: ['2026-09-25', '2026-09-18'], read: [w3, w4], settled: true, more: false, from: '2026-09-18' })
    // what was read is added in: Sep 28, Oct 5 and this period's two days
    const p = paperwork(cur, { ...prev, timesheets: w2.timesheets as ReviewSheet[] }, [], [], [], NOW, ALWAYS, done.read)
    expect([p.toInvoice, p.toInvoiceDays, p.oldestToInvoice]).toEqual([150 + 150 + 262.5, 4, '2026-09-28'])
  })

  it('never reads a period from before the start', () => {
    // last period (Oct 2 to 8) is all before the start: nothing in it counts, so nothing is asked for
    expect(lookBack(week('2026-10-02', [5]), from(), [], [], '2026-10-09', 13)).toEqual({ ask: [], read: [], settled: true, more: false, from: '2026-10-09' })
    // last period starts on the start day and has something to invoice: the one before it is not read
    expect(lookBack(week('2026-10-09', [12]), from(), [], [], '2026-10-09', 13)).toEqual({ ask: [], read: [], settled: true, more: false, from: '2026-10-09' })
    // a start inside the period before: that one is read, for its days from the start on
    expect(lookBack(week('2026-10-09', [12]), from(), [], [], '2026-10-06', 13).ask).toEqual(['2026-10-02'])
  })

  it('stops at the limit, and says there may be more', () => {
    const [w2, w3, w4] = [week('2026-10-02', [5]), week('2026-09-25', [28], 9), week('2026-09-18', [21], 9)]
    // this period, last period and two more is four
    expect(lookBack(w2, from(w3, w4), [], [], ALWAYS, 4)).toEqual({ ask: ['2026-09-25', '2026-09-18'], read: [w3, w4], settled: true, more: true, from: '2026-09-18' })
    // a limit of two is this period and last only
    expect(lookBack(w2, from(w3, w4), [], [], ALWAYS, 2)).toEqual({ ask: [], read: [], settled: true, more: true, from: '2026-10-02' })
  })
})

describe('needs attention', () => {
  it("lists yesterday's no-shows first, then lateness", () => {
    const y = yesterdayProblems(cur, prev, '2026-10-11', NOW)
    expect(y.problems.map((v) => [v.shift.id, v.status, v.lateBy])).toEqual([['c', 'no-show', 0], ['b', 'late', 25]])
    expect(y.total).toBe(2)
  })

  it('gathers approvals, uninvoiced time and open complaints across both periods', () => {
    const invoiced: Invoiced[] = [{ id: 'x', date: '2026-10-02', clientKey: 'c1', clientName: 'Harper', invoiced: true, minutes: 120, amount: 150, timesheetIds: ['u1'], updatedAt: 1, updatedBy: 'b' }]
    const p = paperwork(cur, prev, [], invoiced, [fb('complaint', '2026-09-20'), fb('complaint', '2026-10-05', { status: 'resolved' })], NOW, ALWAYS)
    expect([p.waiting, p.waitingLong]).toEqual([1, 1])
    // Oct 9 and Oct 11 are approved and not invoiced; Oct 2 is invoiced; Oct 6 is not approved
    expect([p.toInvoice, p.toInvoiceDays, p.oldestToInvoice]).toEqual([262.5, 2, '2026-10-09'])
    expect(p.openComplaints.map((f) => f.date)).toEqual(['2026-09-20'])
  })
})

describe('kudos', () => {
  it('shows the last 14 days newest first, and who has the most this period', () => {
    const k = kudosCard(
      [fb('kudos', '2026-10-10'), fb('kudos', '2026-09-28'), fb('kudos', '2026-10-11', { cleaners: [person('Jo'), person('Maya')] }), fb('complaint', '2026-10-11')],
      '2026-10-12',
      '2026-10-09',
    )
    expect(k.recent.map((f) => f.date)).toEqual(['2026-10-11', '2026-10-10'])
    expect(k.leaders).toEqual([{ name: 'Maya', kudos: 2 }, { name: 'Jo', kudos: 1 }])
  })
})
