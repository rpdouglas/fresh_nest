import { describe, expect, it } from 'vitest'
import type { Timesheet } from '../types'
import { type MyVisit, type MyWeekResponse, buildMyWeek } from './myWeek'
import { buildPayroll } from './payroll'

// Every name here is made up. The pay period is Fri Oct 9 to Thu Oct 15, 2026; today is Mon Oct 12.
const visit = (id: string, day: number, hm: string): MyVisit => ({
  id,
  start: `2026-10-${String(day).padStart(2, '0')}T${hm}:00-04:00`,
  end: null,
  timezone: 'America/Toronto',
  state: 'CONFIRMED',
  position: 'Cleaning',
  client: 'Lakeview Made-Up',
  site: 'Lakeview',
  address: '12 Made-Up St',
  note: null,
  siteNote: null,
  with: [],
  partnerShiftIds: [],
})
// a timesheet as the server sends it for My week: fewer fields than the office's
const sheet = (id: string, day: number, minutes: number, state = 'APPROVED') =>
  ({
    id,
    state,
    from: `2026-10-${String(day).padStart(2, '0')}T08:00:00-04:00`,
    to: `2026-10-${String(day).padStart(2, '0')}T12:00:00-04:00`,
    totalDuration: minutes,
    timezone: 'America/Toronto',
    employee: { id: 'u1', name: 'Maya Made-Up' },
    group: { name: 'Cleaning' },
    client: { name: 'Lakeview Made-Up' },
    jobSite: { name: 'Lakeview' },
  }) as unknown as Timesheet
const week = (over: Partial<MyWeekResponse>): MyWeekResponse => ({ name: 'Maya Made-Up', periodStart: '2026-10-09', visits: [], onCall: [], timesheets: [], ...over })

describe('my week', () => {
  it('always shows today, even with nothing on it', () => {
    const w = buildMyWeek(week({}), '2026-10-12')
    expect(w.ahead).toEqual([{ date: '2026-10-12', onCall: false, visits: [] }])
    expect(w.earlier).toEqual([])
  })

  it('lays visits out by day in time order, today onwards first and the days gone by apart', () => {
    const w = buildMyWeek(week({ visits: [visit('late', 12, '13:00'), visit('next', 20, '09:00'), visit('early', 12, '08:00'), visit('gone', 9, '08:00')] }), '2026-10-12')
    expect(w.ahead.map((d) => [d.date, d.visits.map((v) => v.id)])).toEqual([
      ['2026-10-12', ['early', 'late']],
      ['2026-10-20', ['next']],
    ])
    expect(w.earlier.map((d) => [d.date, d.visits.map((v) => v.id)])).toEqual([['2026-10-09', ['gone']]])
  })

  it('a visit belongs to its day in Toronto, not in the browser or in UTC', () => {
    // 11:30 at night on the 12th in Toronto is already the 13th in UTC
    const w = buildMyWeek(week({ visits: [{ ...visit('night', 12, '23:30') }] }), '2026-10-12')
    expect(w.ahead.map((d) => d.date)).toEqual(['2026-10-12'])
  })

  it('on call is a mark on the day: with a visit that day, or on its own', () => {
    const w = buildMyWeek(week({ visits: [visit('v', 13, '08:00')], onCall: ['2026-10-13', '2026-10-14', '2026-10-10'] }), '2026-10-12')
    expect(w.ahead.map((d) => [d.date, d.onCall, d.visits.length])).toEqual([
      ['2026-10-12', false, 0],
      ['2026-10-13', true, 1],
      ['2026-10-14', true, 0],
    ])
    expect(w.earlier).toEqual([{ date: '2026-10-10', onCall: true, visits: [] }])
  })

  it("adds up the hours exactly as Payroll hours does for that person, each day rounded to the quarter hour", () => {
    // 2h 07m approved rounds to 2.00; 2h 08m to 2.25; waiting time is kept apart
    const timesheets = [sheet('a', 9, 127), sheet('b', 12, 128), sheet('c', 12, 50, 'SUBMITTED'), sheet('d', 13, 61, 'DRAFT')]
    const w = buildMyWeek(week({ timesheets }), '2026-10-12')
    expect(w.hours.days.map((d) => [d.date.slice(8), d.approved, d.waiting])).toEqual([
      ['09', 120, 0],
      ['10', 0, 0],
      ['11', 0, 0],
      ['12', 135, 45],
      ['13', 0, 60],
      ['14', 0, 0],
      ['15', 0, 0],
    ])
    expect([w.hours.approved, w.hours.waiting]).toEqual([255, 105])
    // the same figures as the office sees on that person's row
    const row = buildPayroll('2026-10-09', timesheets).rows[0]
    expect([w.hours.approved, w.hours.waiting]).toEqual([row.approved, row.unapproved])
  })
})
