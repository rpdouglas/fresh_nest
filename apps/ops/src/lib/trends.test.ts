import { describe, expect, it } from 'vitest'
import type { Feedback, PeriodSnapshot, ReviewResponse, ReviewSheet, ReviewShift } from '../types'
import { METRICS, SNAPSHOT_VERSION, needsSnapshot, scale, series, snapshotOf, trendPeriods } from './trends'

const DAY = 86_400_000
const person = (name: string) => ({ id: name.toLowerCase(), name })
const at = (day: number, hm: string) => `2026-10-${String(day).padStart(2, '0')}T${hm}:00-04:00`
const harper = { id: 'c-harper', name: 'Harper' }
const shift = (id: string, who: string, day: number, start: string, end: string, over: Partial<ReviewShift> = {}): ReviewShift => ({
  id, state: 'FINISHED', startTime: at(day, start), endTime: at(day, end), timezone: 'America/Toronto', breakDuration: 0,
  client: harper, assignee: person(who), jobSite: { id: 's1', name: 'Home', address: '12 Pine St' }, group: { id: 'g1', name: 'Cleaning' }, ...over,
})
function sheet(id: string, who: string, day: number, start: string, minutes: number, shiftId: string | null, over: Partial<ReviewSheet> = {}): ReviewSheet {
  const from = at(day, start)
  return {
    id, state: 'APPROVED', from, to: new Date(Date.parse(from) + minutes * 60_000).toISOString(), totalDuration: minutes, timezone: 'America/Toronto', approvedAt: null,
    employee: person(who), group: { name: 'Cleaning' }, client: harper, jobSite: { id: 's1', name: 'Home' }, comments: 0,
    referenceObject: shiftId ? { __typename: 'TimeCard', shiftId } : null, ...over,
  }
}
const saved = (periodStart: string, totals: Record<string, number>, over: Partial<PeriodSnapshot> = {}): PeriodSnapshot => ({ v: SNAPSHOT_VERSION, periodStart, totals: { grace: 15, ...totals }, cleaners: [], clients: [], savedAt: 0, savedBy: 'boss@example.com', ...over })

describe('which periods', () => {
  it('charts the finished pay periods, oldest first, ending with the last one over', () => {
    // Monday the 12th: the period of Friday the 9th is under way
    expect(trendPeriods('2026-10-12', 3)).toEqual(['2026-09-18', '2026-09-25', '2026-10-02'])
    expect(trendPeriods('2026-10-16', 2)).toEqual(['2026-10-02', '2026-10-09'])
    expect(trendPeriods('2026-10-12')).toHaveLength(13)
  })

  it('works a period out when nothing is saved, or the rules have changed since, or grace setting differs', () => {
    expect(needsSnapshot(undefined, '2026-10-02', Date.parse(at(12, '12:00')))).toBe(true)
    expect(needsSnapshot(saved('2026-10-02', {}, { v: SNAPSHOT_VERSION - 1, savedAt: Date.parse(at(30, '12:00')) }), '2026-10-02', Date.parse(at(31, '12:00')))).toBe(true)
    expect(needsSnapshot(saved('2026-10-02', { grace: 10 }, { savedAt: Date.parse(at(30, '12:00')) }), '2026-10-02', Date.parse(at(31, '12:00')), 15)).toBe(true)
  })

  it('refreshes a recent period once a day for two weeks after it ends, then keeps it', () => {
    const ended = Date.parse(at(9, '00:00'))
    const at10 = saved('2026-10-02', {}, { savedAt: ended + DAY })
    expect(needsSnapshot(at10, '2026-10-02', ended + DAY + 3_600_000)).toBe(false)
    expect(needsSnapshot(at10, '2026-10-02', ended + 2 * DAY + 60_000)).toBe(true)
    const settled = saved('2026-10-02', {}, { savedAt: ended + 15 * DAY })
    expect(needsSnapshot(settled, '2026-10-02', ended + 60 * DAY)).toBe(false)
  })
})

describe('a period\'s figures', () => {
  const data: ReviewResponse = {
    periodStart: '2026-10-02', from: '', to: '', otherShifts: [],
    shifts: [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Jo', 5, '08:00', '10:00'), shift('c', 'Maya', 6, '08:00', '10:00'), shift('oc', 'Jo', 6, '00:00', '23:00', { client: null, jobSite: null, group: { id: 'g2', name: 'On Call' } })],
    // Maya on time, Jo 30 minutes late; nobody logged Maya's second visit
    timesheets: [sheet('t1', 'Maya', 5, '08:00', 120, 'a'), sheet('t2', 'Jo', 5, '08:30', 90, 'b')],
  }
  const feedback = [
    { type: 'kudos', date: '2026-10-05', cleaners: [person('Maya')] },
    { type: 'complaint', date: '2026-10-06', status: 'open', cleaners: [person('Jo')] },
    { type: 'kudos', date: '2026-10-09', cleaners: [person('Maya')] }, // the next period
  ] as unknown as Feedback[]
  const s = snapshotOf(data, [], feedback, Date.parse(at(12, '12:00')))

  it('carries the reports\' totals', () => {
    expect(s).toMatchObject({ v: SNAPSHOT_VERSION, periodStart: '2026-10-02' })
    // the pair's visit averages 105 minutes, billed as 1.75 h at $75
    expect(s.totals).toEqual({ billed: 131.25, pending: 0, visits: 3, measured: 2, onTime: 1, late: 1, noShows: 1, grace: 15, scheduledMinutes: 360, actualMinutes: 210, feedbackVisits: 1, kudos: 1, complaints: 1 })
  })

  it("bills at a client's own price", () => {
    const flat = [{ clientKey: 'c-harper', clientName: 'Harper', rules: [{ from: '2026-10-01', kind: 'flat' as const, dollars: 200, setAt: 1, setBy: 'b' }] }]
    const priced = snapshotOf(data, flat, feedback, Date.parse(at(12, '12:00')))
    expect([priced.totals.billed, priced.clients[0].billed]).toEqual([200, 200])
  })

  it('breaks them down by cleaner and by client', () => {
    expect(s.cleaners).toEqual([
      { id: 'jo', name: 'Jo', visits: 1, measured: 1, onTime: 0, late: 1, noShows: 0, scheduledMinutes: 120, actualMinutes: 90, kudos: 0, complaints: 1 },
      { id: 'maya', name: 'Maya', visits: 2, measured: 1, onTime: 1, late: 0, noShows: 1, scheduledMinutes: 240, actualMinutes: 120, kudos: 1, complaints: 0 },
    ])
    expect(s.clients).toEqual([{ key: 'c-harper', name: 'Harper', billed: 131.25, approvedMinutes: 105 }])
  })

  it('turns totals into the charted figures', () => {
    const by = Object.fromEntries(METRICS.map((m) => [m.key, m.value(s.totals)]))
    expect(by).toEqual({ billed: 131.25, onTime: 0.5, noShows: 1 / 3, hours: (210 - 360) / 360, kudos: 100, complaints: 100 })
    expect(METRICS.map((m) => m.format(m.value(s.totals)!))).toEqual(['$131', '50%', '33%', '−41.7%', '100.0', '100.0'])
    // nothing to divide by is a gap, not a zero
    expect(METRICS.map((m) => m.value({ billed: 0 }))).toEqual([0, null, null, null, null, null])
  })
})

describe('the chart', () => {
  const onTime = METRICS[1]
  const history = new Map([saved('2026-09-25', { onTime: 8, measured: 10 }), saved('2026-10-02', { onTime: 9, measured: 10 })].map((x) => [x.periodStart, x]))

  it('leaves a gap for a period with nothing saved', () => {
    expect(series(onTime, ['2026-09-18', '2026-09-25', '2026-10-02'], history).map((p) => p.value)).toEqual([null, 0.8, 0.9])
  })

  it('scales to the data and the target, with room, and keeps zero as the floor when near', () => {
    const points = series(onTime, ['2026-09-25', '2026-10-02'], history)
    const s = scale(points, 0.95)
    expect(s.min).toBeLessThan(0.8)
    expect(s.max).toBeGreaterThan(0.95)
    expect(scale([{ periodStart: 'a', value: 0 }, { periodStart: 'b', value: 4 }]).min).toBe(0)
    expect(scale([{ periodStart: 'a', value: -0.3 }, { periodStart: 'b', value: 0.1 }], 0).min).toBeLessThan(-0.3)
    expect(scale([])).toEqual({ min: 0, max: 1 })
  })
})
