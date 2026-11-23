import { describe, expect, it } from 'vitest'
import type { ReviewShift, Timesheet } from '../types'
import { buildClientPatterns, clockText, hoursMinutes } from './clientPatterns'

let n = 0
const person = (name: string) => ({ id: name.toLowerCase(), name })
const client = (name: string) => ({ id: `c-${name.toLowerCase()}`, name })
const site = (name: string) => ({ id: `s-${name.toLowerCase()}`, name, address: `${name} Rd` })
// October 2026: the 5th, 12th and 19th are Mondays
const at = (day: number, hm: string) => `2026-10-${String(day).padStart(2, '0')}T${hm}:00-04:00`

function shift(who: string, day: number, start: string, end: string, over: Partial<ReviewShift> = {}): ReviewShift {
  return {
    id: `sh${++n}`, state: 'FINISHED', startTime: at(day, start), endTime: at(day, end), timezone: 'America/Toronto', breakDuration: 0,
    client: client('Harper'), assignee: person(who), jobSite: site('Harper'), group: { id: 'g', name: 'Cleaning' }, ...over,
  }
}
function sheet(who: string, day: number, start: string, minutes: number, over: Partial<Timesheet> = {}): Timesheet {
  const from = at(day, start)
  return {
    id: `t${++n}`, state: 'APPROVED', from, to: new Date(Date.parse(from) + minutes * 60_000).toISOString(), totalDuration: minutes,
    timezone: 'America/Toronto', approvedAt: null, employee: person(who), group: { name: 'Cleaning' }, client: client('Harper'), jobSite: site('Harper'), ...over,
  }
}
const pair = (day: number, start: string, end: string) => [shift('Alex', day, start, end), shift('Sam', day, start, end)]
const OPTS = { minVisits: 1, maxSheetMinutes: 360 }

describe('visits and the usual start', () => {
  it('counts a pair as one visit and finds the usual start and weekday', () => {
    const shifts = [...pair(5, '08:00', '10:00'), ...pair(12, '08:00', '10:00'), ...pair(14, '09:30', '11:00')]
    const [r] = buildClientPatterns(shifts, [], OPTS).rows
    expect([r.visits, clockText(r.usualStart), r.usualStartCount, r.usualDay, r.usualDayCount]).toEqual([3, '08:00', 2, 'Monday', 2])
    expect(r.dayCounts.Wednesday).toBe(1)
    expect(r.address).toBe('Harper Rd')
  })

  it('breaks a tie towards the earlier time and the earlier weekday', () => {
    const [r] = buildClientPatterns([shift('Alex', 7, '13:00', '14:00'), shift('Alex', 5, '09:00', '10:00')], [], OPTS).rows
    expect([clockText(r.usualStart), r.usualDay]).toEqual(['09:00', 'Monday'])
  })

  it('counts two separate visits on one day as two', () => {
    const [r] = buildClientPatterns([shift('Alex', 5, '08:00', '09:00'), shift('Alex', 5, '13:00', '14:00')], [], OPTS).rows
    expect(r.visits).toBe(2)
  })

  it('leaves out On Call, drafts, open and declined shifts, and a shift with no client', () => {
    const shifts = [
      shift('Alex', 5, '08:00', '09:00', { group: { id: 'o', name: 'On Call' } }),
      shift('Alex', 6, '08:00', '09:00', { state: 'DRAFT' }),
      shift('Alex', 7, '08:00', '09:00', { state: 'OPENING' }),
      shift('Alex', 8, '08:00', '09:00', { state: 'REJECTED' }),
      shift('Alex', 9, '08:00', '09:00', { client: null }),
    ]
    expect(buildClientPatterns(shifts, [], OPTS).rows).toEqual([])
  })

  it('counts a shift loaded twice once', () => {
    const s = shift('Alex', 5, '08:00', '09:00')
    expect(buildClientPatterns([s, s], [], OPTS).rows[0].visits).toBe(1)
  })
})

describe('time spent', () => {
  it('averages the cleaners of a visit, then the visits', () => {
    const sheets = [sheet('Alex', 5, '08:00', 100), sheet('Sam', 5, '08:05', 120), sheet('Alex', 12, '08:00', 80)]
    const [r] = buildClientPatterns(pair(5, '08:00', '10:00'), sheets, OPTS).rows
    // visit 1: (100 + 120) / 2 = 110; visit 2: 80
    expect([r.sheetVisits, r.avgWorked]).toEqual([2, 95])
    // first in to last out: 08:00 to 10:05 = 125; and 80
    expect(r.avgSpan).toBe(102.5)
  })

  it('takes breaks off the scheduled length, per cleaner', () => {
    const [r] = buildClientPatterns([shift('Alex', 5, '08:00', '11:00', { breakDuration: 30 })], [], OPTS).rows
    expect(r.avgScheduled).toBe(150)
  })

  it('leaves out a timesheet longer than the cut-off and says how many', () => {
    const p = buildClientPatterns(pair(5, '08:00', '10:00'), [sheet('Alex', 5, '08:00', 90), sheet('Sam', 5, '08:00', 900)], OPTS)
    expect([p.rows[0].avgWorked, p.longSheets]).toEqual([90, 1])
  })

  it('leaves out a timesheet still running and one logged as On Call', () => {
    const open = { ...sheet('Alex', 5, '08:00', 0), to: null }
    const onCall = sheet('Sam', 5, '08:00', 60, { group: { name: 'On Call' } })
    expect(buildClientPatterns(pair(5, '08:00', '10:00'), [open, onCall], OPTS).rows[0].sheetVisits).toBe(0)
  })

  it('gives a timesheet with only a site the client that site belongs to', () => {
    const sheets = [sheet('Alex', 5, '08:00', 60), sheet('Sam', 12, '08:00', 90, { client: null })]
    expect(buildClientPatterns(pair(5, '08:00', '10:00'), sheets, OPTS).rows[0].avgWorked).toBe(75)
  })
})

describe('the minimum number of visits', () => {
  it('lists only clients with at least the minimum, and counts the rest', () => {
    const other = { client: client('Quill'), jobSite: site('Quill') }
    const shifts = [shift('Alex', 5, '08:00', '09:00'), shift('Alex', 12, '08:00', '09:00'), shift('Alex', 6, '08:00', '09:00', other)]
    const p = buildClientPatterns(shifts, [], { ...OPTS, minVisits: 2 })
    expect([p.rows.map((r) => r.name), p.belowMinimum]).toEqual([['Harper'], 1])
  })
})

describe('text', () => {
  it('writes minutes as hours and minutes, and a time of day', () => {
    expect([hoursMinutes(95), hoursMinutes(59.6), hoursMinutes(null), clockText(510)]).toEqual(['1:35', '1:00', '–', '08:30'])
  })
})
