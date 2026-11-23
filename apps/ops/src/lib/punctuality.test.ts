import { describe, expect, it } from 'vitest'
import type { ReviewResponse, ReviewSheet, ReviewShift } from '../types'
import { buildPunctuality, percent, punctualityCsv } from './punctuality'

const person = (name: string) => ({ id: name.toLowerCase(), name })
const at = (day: number, hm: string) => `2026-10-${String(day).padStart(2, '0')}T${hm}:00-04:00`

function shift(id: string, who: string | null, day: number, start: string, end: string, over: Partial<ReviewShift> = {}): ReviewShift {
  return {
    id, state: 'FINISHED', startTime: at(day, start), endTime: at(day, end), timezone: 'America/Toronto', breakDuration: 0,
    client: { id: 'c1', name: 'Harper' }, assignee: who ? person(who) : null, jobSite: { id: 's1', name: 'Home' }, group: { id: 'g1', name: 'Cleaning' }, ...over,
  }
}
function sheet(id: string, who: string, day: number, start: string, minutes: number, shiftId: string | null, over: Partial<ReviewSheet> = {}): ReviewSheet {
  const from = at(day, start)
  return {
    id, state: 'APPROVED', from, to: new Date(Date.parse(from) + minutes * 60_000).toISOString(), totalDuration: minutes, timezone: 'America/Toronto', approvedAt: null,
    employee: person(who), group: { name: 'Cleaning' }, client: { id: 'c1', name: 'Harper' }, jobSite: { id: 's1', name: 'Home' },
    referenceObject: shiftId ? { __typename: 'TimeCard', shiftId } : null, ...over,
  }
}
const data = (timesheets: ReviewSheet[], shifts: ReviewShift[]): ReviewResponse => ({ periodStart: '2026-10-02', from: '', to: '', timesheets, shifts, otherShifts: [] })
const LATER = Date.parse('2026-10-20T12:00:00-04:00')
const build = (t: ReviewSheet[], s: ReviewShift[], now = LATER, graceMinutes?: number) => buildPunctuality(data(t, s), now, graceMinutes)

describe('punctuality per visit', () => {
  it('calls a clock-in within 15 minutes on time, later than that late, and none at all a no-show', () => {
    const p = build(
      [sheet('t1', 'Maya', 5, '08:12', 108, 'a'), sheet('t2', 'Maya', 6, '08:16', 104, 'b')],
      [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Maya', 6, '08:00', '10:00'), shift('c', 'Maya', 7, '08:00', '10:00')],
    )
    const maya = p.byCleaner[0]
    expect(maya.visits.map((v) => [v.shift.id, v.status, v.lateBy])).toEqual([['a', 'on-time', 12], ['b', 'late', 16], ['c', 'no-show', 0]])
    expect(maya).toMatchObject({ scheduled: 3, measured: 2, onTime: 1, late: 1, avgLate: 16, noShows: 1 })
    expect([percent(maya.onTimeRate), percent(maya.noShowRate)]).toEqual(['50%', '33%'])
  })

  it('honors a custom grace period', () => {
    // With 10 min grace, 12 min is late
    const p10 = build([sheet('t1', 'Maya', 5, '08:12', 108, 'a')], [shift('a', 'Maya', 5, '08:00', '10:00')], LATER, 10)
    expect(p10.byCleaner[0].visits[0].status).toBe('late')

    // With 20 min grace, 16 min is on-time
    const p20 = build([sheet('t1', 'Maya', 5, '08:16', 104, 'a')], [shift('a', 'Maya', 5, '08:00', '10:00')], LATER, 20)
    expect(p20.byCleaner[0].visits[0].status).toBe('on-time')
  })

  it('flags leaving more than 15 minutes early, and not while still clocked in', () => {
    const p = build(
      [sheet('t1', 'Maya', 5, '08:00', 100, 'a'), sheet('t2', 'Maya', 6, '08:00', 110, 'b'), sheet('t3', 'Maya', 7, '08:00', 0, 'c', { to: null })],
      [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Maya', 6, '08:00', '10:00'), shift('c', 'Maya', 7, '08:00', '10:00')],
    )
    expect(p.byCleaner[0].visits.map((v) => v.leftEarlyBy)).toEqual([20, 0, 0])
    expect(p.byCleaner[0].leftEarly).toBe(1)
  })

  it('takes the first clock-in and last clock-out when a visit has several entries', () => {
    const p = build([sheet('t2', 'Maya', 5, '09:00', 60, 'a'), sheet('t1', 'Maya', 5, '08:05', 40, 'a')], [shift('a', 'Maya', 5, '08:00', '10:00')])
    expect(p.byCleaner[0].visits[0]).toMatchObject({ status: 'on-time', lateBy: 5, leftEarlyBy: 0 })
  })

  it('counts an entry typed in by a manager as attended but not measured', () => {
    const p = build([sheet('t1', 'Maya', 5, '09:00', 60, null)], [shift('a', 'Maya', 5, '08:00', '10:00')])
    expect(p.byCleaner[0]).toMatchObject({ scheduled: 1, measured: 0, noShows: 0, onTimeRate: null })
    expect(p.byCleaner[0].visits[0].status).toBe('unmeasured')
  })

  it('matches by overlap, including a clock-in against a partner’s shift, but not one for another of their own shifts', () => {
    const p = build(
      [sheet('t1', 'Jo', 5, '08:20', 100, 'maya-shift'), sheet('t2', 'Jo', 6, '13:00', 60, 'j2')],
      [shift('maya-shift', 'Maya', 5, '08:00', '10:00'), shift('j1', 'Jo', 5, '08:00', '10:00'), shift('j2', 'Jo', 6, '13:00', '14:00'), shift('j3', 'Jo', 6, '12:30', '13:30')],
    )
    const jo = p.byCleaner.find((r) => r.name === 'Jo')!
    expect(jo.visits.map((v) => [v.shift.id, v.status])).toEqual([['j1', 'late'], ['j3', 'no-show'], ['j2', 'on-time']])
    // Maya's own shift is not covered by Jo's timesheet
    expect(p.byCleaner.find((r) => r.name === 'Maya')!.noShows).toBe(1)
  })
})

describe('what counts as a visit and as time', () => {
  it('leaves out On Call, unassigned, unfinished and client-less shifts', () => {
    const p = build([], [
      shift('a', 'Maya', 5, '08:00', '10:00', { group: { name: 'On Call' } }),
      shift('b', null, 5, '08:00', '10:00'),
      shift('c', 'Maya', 19, '08:00', '10:00'),
      shift('d', 'Maya', 5, '11:00', '12:00', { client: null, jobSite: null }),
      shift('e', 'Maya', 5, '13:00', '14:00'),
    ], Date.parse(at(19, '09:00')))
    expect(p.total.visits.map((v) => v.shift.id)).toEqual(['e'])
  })

  it('treats a rejected timesheet or leave as no attendance', () => {
    const p = build(
      [sheet('t1', 'Maya', 5, '08:00', 120, 'a', { state: 'REJECTED' }), sheet('t2', 'Maya', 6, '08:00', 120, null, { referenceObject: { __typename: 'LeaveRequest' } })],
      [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Maya', 6, '08:00', '10:00')],
    )
    expect(p.byCleaner[0].noShows).toBe(2)
  })
})

describe('grouping', () => {
  it('ranks cleaners and clients worst first and totals every visit', () => {
    const p = build(
      [sheet('t1', 'Maya', 5, '08:30', 90, 'a'), sheet('t2', 'Jo', 5, '08:00', 120, 'b'), sheet('t3', 'Jo', 6, '08:00', 120, 'c')],
      [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Jo', 5, '08:00', '10:00'), shift('c', 'Jo', 6, '08:00', '10:00', { client: { id: 'c2', name: 'Ives' } })],
    )
    expect(p.byCleaner.map((r) => [r.name, percent(r.onTimeRate)])).toEqual([['Maya', '0%'], ['Jo', '100%']])
    expect(p.byClient.map((r) => [r.name, r.scheduled])).toEqual([['Harper', 2], ['Ives', 1]])
    expect(p.total).toMatchObject({ scheduled: 3, onTime: 2, late: 1 })
  })

  it('writes a CSV line per row and a total, guarding against formula injection', () => {
    const p = build([sheet('t1', '=Maya', 5, '08:00', 120, 'a')], [shift('a', '=Maya', 5, '08:00', '10:00')])
    const csv = punctualityCsv(p.byCleaner, p.total, 'Cleaner')
    expect(csv.split('\r\n')[1]).toBe(`"'=Maya",1,1,1,0,0,0,0,100%,0%`)
    expect(csv.split('\r\n')[2]).toMatch(/^"All visits",1,/)
  })
})
