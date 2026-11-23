import { describe, expect, it } from 'vitest'
import type { ReviewResponse, ReviewSheet, ReviewShift } from '../types'
import { signed } from './review'
import { buildSchedVsActual, schedVsActualCsv } from './schedVsActual'

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
const data = (timesheets: ReviewSheet[], shifts: ReviewShift[], otherShifts: ReviewShift[] = []): ReviewResponse => ({ periodStart: '2026-10-02', from: '', to: '', timesheets, shifts, otherShifts })
const LATER = Date.parse('2026-10-20T12:00:00-04:00')
const build = (t: ReviewSheet[], s: ReviewShift[], now = LATER, other: ReviewShift[] = []) => buildSchedVsActual(data(t, s, other), now)

describe('scheduled against actual per employee per day', () => {
  it('sums each side per day and takes the difference in exact minutes', () => {
    const v = build(
      [sheet('t1', 'Maya', 5, '08:02', 123, 'a'), sheet('t2', 'Maya', 5, '13:00', 95, 'b'), sheet('t3', 'Maya', 6, '08:00', 100, 'c')],
      [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Maya', 5, '13:00', '14:30'), shift('c', 'Maya', 6, '08:00', '10:00')],
    )
    const maya = v.rows[0]
    expect(maya.cells.map((c) => [c.scheduled, c.actual, c.variance])[3]).toEqual([210, 218, 8])
    expect(maya.cells[4]).toMatchObject({ scheduled: 120, actual: 100, variance: -20, off: true })
    expect([maya.scheduled, maya.actual, maya.variance, signed(maya.variance)]).toEqual([330, 318, -12, '-0.20'])
    expect(v.days[0]).toBe('2026-10-02')
  })

  it('takes the break off scheduled time and files each side under its own local day', () => {
    const v = build([sheet('t1', 'Maya', 5, '23:30', 120, null)], [shift('a', 'Maya', 5, '08:00', '12:30', { breakDuration: 30 }), shift('b', 'Maya', 6, '09:00', '10:00', { startTime: '2026-10-07T02:30:00.000Z', endTime: '2026-10-07T03:30:00.000Z' })])
    expect(v.rows[0].cells.map((c) => c.scheduled)).toEqual([0, 0, 0, 240, 60, 0, 0])
    expect(v.rows[0].cells.map((c) => c.actual)).toEqual([0, 0, 0, 120, 0, 0, 0])
  })

  it('has rows and columns that agree, and ranks employees from most over to most under', () => {
    const v = build(
      [sheet('t1', 'Maya', 5, '08:00', 150, 'a'), sheet('t2', 'Jo', 5, '08:00', 60, 'b'), sheet('t3', 'Cy', 6, '08:00', 120, 'c')],
      [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Jo', 5, '08:00', '10:00'), shift('c', 'Cy', 6, '08:00', '10:00')],
    )
    expect(v.rows.map((r) => r.name)).toEqual(['Cy', 'Jo', 'Maya'])
    expect(v.ranked.map((r) => [r.name, r.variance])).toEqual([['Maya', 30], ['Cy', 0], ['Jo', -60]])
    expect([v.scheduled, v.actual, v.variance]).toEqual([360, 330, -30])
    const add = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
    expect([add(v.dayScheduled), add(v.dayActual)]).toEqual([v.scheduled, v.actual])
    expect(v.scheduled).toBe(add(v.rows.map((r) => r.scheduled)))
  })
})

describe('what is left out', () => {
  it('leaves out On Call shifts, On Call timesheets, and timesheets clocked against an On Call shift', () => {
    const onCall = { id: 'g2', name: 'On Call' }
    const v = build(
      [sheet('t1', 'Maya', 5, '08:00', 120, 'a'), sheet('t2', 'Maya', 5, '12:00', 60, null, { group: { name: 'on-call' } }), sheet('t3', 'Maya', 6, '09:00', 45, 'oc', { group: { name: 'Cleaning' } }), sheet('t4', 'Di', 6, '09:00', 480, 'oc2', { group: onCall })],
      [shift('a', 'Maya', 5, '08:00', '10:00'), shift('oc', 'Maya', 6, '08:00', '16:00', { group: onCall, client: null, jobSite: null }), shift('oc2', 'Di', 6, '08:00', '16:00', { group: onCall })],
    )
    expect(v.rows.map((r) => [r.name, r.scheduled, r.actual])).toEqual([['Maya', 120, 120]])
  })

  it('leaves out shifts that have not ended yet, unassigned shifts, rejected timesheets and leave', () => {
    const shifts = [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Maya', 8, '08:00', '10:00'), shift('c', null, 5, '08:00', '10:00')]
    const sheets = [sheet('t1', 'Maya', 5, '08:00', 120, 'a'), sheet('t2', 'Maya', 5, '11:00', 60, null, { state: 'REJECTED' }), sheet('t3', 'Maya', 6, '08:00', 480, null, { referenceObject: { __typename: 'LeaveRequest' } })]
    const midweek = build(sheets, shifts, Date.parse(at(7, '12:00')))
    expect([midweek.rows.length, midweek.scheduled, midweek.actual]).toEqual([1, 120, 120])
    expect(build(sheets, shifts).scheduled).toBe(240)
  })

  it('still shows someone who only has one side', () => {
    const v = build([sheet('t1', 'Extra', 5, '08:00', 90, null)], [shift('a', 'Absent', 5, '08:00', '10:00')])
    expect(v.rows.map((r) => [r.name, r.scheduled, r.actual, r.variance])).toEqual([['Absent', 120, 0, -120], ['Extra', 0, 90, 90]])
  })
})

describe('markers', () => {
  it('flags a finished shift with no timesheet, and counts it as scheduled', () => {
    const v = build([sheet('t1', 'Maya', 5, '08:00', 120, 'a')], [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Maya', 5, '13:00', '15:00'), shift('c', 'Maya', 6, '08:00', '09:00')])
    expect(v.rows[0].cells.map((c) => c.uncovered.map((s) => s.id))).toEqual([[], [], [], ['b'], ['c'], [], []])
    expect([v.rows[0].uncovered, v.uncovered, v.rows[0].variance]).toEqual([2, 2, -180])
  })

  it('marks cells whose actual time includes unapproved timesheets', () => {
    const v = build([sheet('t1', 'Maya', 5, '08:00', 120, 'a', { state: 'SUBMITTED' }), sheet('t2', 'Maya', 6, '08:00', 120, 'b')], [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Maya', 6, '08:00', '10:00')])
    expect(v.rows[0].cells.map((c) => c.unapproved)).toEqual([false, false, false, true, false, false, false])
    expect([v.rows[0].unapproved, v.rows[0].actual]).toEqual([true, 240])
  })
})

describe('export', () => {
  it('writes three lines per employee and a total', () => {
    const v = build([sheet('t1', 'Maya', 5, '08:00', 150, 'a')], [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Jo', 6, '08:00', '09:00')])
    expect(schedVsActualCsv(v).split('\r\n')).toEqual([
      '"Employee","Hours","Fri Oct 2","Sat Oct 3","Sun Oct 4","Mon Oct 5","Tue Oct 6","Wed Oct 7","Thu Oct 8","Total"',
      '"Jo","Scheduled",0.00,0.00,0.00,0.00,1.00,0.00,0.00,1.00',
      '"Jo","Actual",0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00',
      '"Jo","Variance",0.00,0.00,0.00,0.00,-1.00,0.00,0.00,-1.00',
      '"Maya","Scheduled",0.00,0.00,0.00,2.00,0.00,0.00,0.00,2.00',
      '"Maya","Actual",0.00,0.00,0.00,2.50,0.00,0.00,0.00,2.50',
      '"Maya","Variance",0.00,0.00,0.00,+0.50,0.00,0.00,0.00,+0.50',
      '"Total","Scheduled",0.00,0.00,0.00,2.00,1.00,0.00,0.00,3.00',
      '"Total","Actual",0.00,0.00,0.00,2.50,0.00,0.00,0.00,2.50',
      '"Total","Variance",0.00,0.00,0.00,+0.50,-1.00,0.00,0.00,-0.50',
      '',
    ])
  })
})
