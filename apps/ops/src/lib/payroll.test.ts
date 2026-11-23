import { describe, expect, it } from 'vitest'
import type { Timesheet } from '../types'
import { buildPayroll, exact, fridayOf, hours, lastCompletedPeriod, localParts, payrollCsv, roundQuarter, zonedIso } from './payroll'

let n = 0
const person = (name: string) => ({ id: name.toLowerCase(), name })
/** A timesheet starting at a Toronto local time on an October 2026 day. */
function sheet(who: string | null, day: number, start: string, minutes: number, over: Partial<Timesheet> = {}): Timesheet {
  const from = `2026-10-${String(day).padStart(2, '0')}T${start}:00-04:00`
  return {
    id: String(++n),
    state: 'APPROVED',
    from,
    to: new Date(Date.parse(from) + minutes * 60_000).toISOString(),
    totalDuration: minutes,
    timezone: 'America/Toronto',
    approvedAt: null,
    employee: who ? person(who) : null,
    group: null,
    client: null,
    jobSite: null,
    ...over,
  }
}

describe('rounding', () => {
  it('rounds to the nearest quarter hour', () => {
    const cases: [number, string][] = [
      [78, '1.25'], // the owner's example: 1h18
      [257, '4.25'], // 4h17
      [0, '0.00'], [7, '0.00'], [8, '0.25'], [15, '0.25'], [22, '0.25'], [23, '0.50'],
      [37, '0.50'], [38, '0.75'], [52, '0.75'], [53, '1.00'], [60, '1.00'], [468, '7.75'], [1146, '19.00'],
    ]
    for (const [minutes, expected] of cases) expect([minutes, hours(roundQuarter(minutes))]).toEqual([minutes, expected])
    expect(exact(123)).toBe('2h 03m')
  })

  it('rounds the day total, not each clock-in', () => {
    // 1h18 + 2h07 + 0h52 = 4h17 -> 4.25 (rounding each first would give 4.00)
    const p = buildPayroll('2026-10-02', [sheet('Alex', 2, '08:00', 78), sheet('Alex', 2, '10:00', 127), sheet('Alex', 2, '13:00', 52)])
    expect(p.rows[0].cells[0]).toMatchObject({ approvedExact: 257, approved: 255 })
    expect(hours(p.rows[0].approved)).toBe('4.25')
  })

  it('makes the week the sum of rounded days, not a rounding of the week', () => {
    // seven minutes a day rounds to nothing each day, though the week adds up to 49 minutes
    const p = buildPayroll('2026-10-02', [2, 3, 4, 5, 6, 7, 8].map((d) => sheet('Alex', d, '09:00', 7)))
    expect(p.rows[0].approved).toBe(0)
    const q = buildPayroll('2026-10-02', [2, 3, 4, 5, 6, 7, 8].map((d) => sheet('Alex', d, '09:00', 8)))
    expect(hours(q.rows[0].approved)).toBe('1.75')
  })
})

describe('pay period', () => {
  it('runs Friday to Thursday', () => {
    expect(fridayOf('2026-10-02')).toBe('2026-10-02') // a Friday
    expect(fridayOf('2026-10-08')).toBe('2026-10-02') // the Thursday that ends it
    expect(fridayOf('2026-10-09')).toBe('2026-10-09')
    expect(fridayOf('2026-10-10')).toBe('2026-10-09') // Saturday
    expect(fridayOf('2027-01-01')).toBe('2027-01-01')
    expect(fridayOf('2026-12-31')).toBe('2026-12-25')
    expect(buildPayroll('2026-10-02', []).days).toEqual(['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'])
  })

  it('defaults to the last period that has fully ended', () => {
    expect(lastCompletedPeriod('2026-10-10')).toBe('2026-10-02') // Saturday: Oct 2-8 just ended
    expect(lastCompletedPeriod('2026-10-09')).toBe('2026-10-02') // Friday: same
    expect(lastCompletedPeriod('2026-10-08')).toBe('2026-09-25') // Thursday: Oct 2-8 still running
  })

  it('counts a timesheet on the local day it started', () => {
    const late = sheet('Alex', 3, '23:30', 120) // Saturday 11:30 PM to Sunday 1:30 AM
    const utcMorning = sheet('Alex', 5, '00:00', 60, { from: '2026-10-05T02:30:00.000Z' }) // Sunday 10:30 PM in Toronto
    const p = buildPayroll('2026-10-02', [late, utcMorning])
    expect(p.rows[0].cells.map((c) => c.approvedExact)).toEqual([0, 120, 60, 0, 0, 0, 0])
  })
})

describe('approved and unapproved', () => {
  const p = buildPayroll('2026-10-02', [
    sheet('Bo', 2, '08:00', 200),
    sheet('Bo', 2, '12:00', 100, { state: 'SUBMITTED' }),
    sheet('Bo', 2, '14:00', 25, { state: 'REJECTED' }),
    sheet('Bo', 5, '08:00', 61, { state: 'DRAFT' }),
    sheet('alex', 2, '08:00', 450),
    sheet('alex', 6, '08:00', 433),
    sheet(null, 7, '08:00', 30),
  ])

  it('keeps them apart, rounding each side of a day on its own', () => {
    const bo = p.rows.find((r) => r.name === 'Bo')!
    expect(bo.cells[0]).toMatchObject({ approvedExact: 200, approved: 195, unapprovedExact: 125, unapproved: 120 })
    expect([hours(bo.approved), hours(bo.unapproved)]).toEqual(['3.25', '3.00'])
    expect(p.unapprovedEntries).toBe(3)
  })

  it('sorts by name and keeps a row for timesheets with no employee', () => {
    expect(p.rows.map((r) => r.name)).toEqual(['alex', 'Bo', 'No employee on timesheet'])
  })

  it('has column totals and row totals that agree', () => {
    expect(p.dayApproved.map(hours)).toEqual(['10.75', '0.00', '0.00', '0.00', '7.25', '0.50', '0.00'])
    expect(p.dayUnapproved.map(hours)).toEqual(['2.00', '0.00', '0.00', '1.00', '0.00', '0.00', '0.00'])
    const add = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
    expect(p.approved).toBe(add(p.dayApproved))
    expect(p.approved).toBe(add(p.rows.map((r) => r.approved)))
    expect(p.unapproved).toBe(add(p.dayUnapproved))
    expect([hours(p.approved), hours(p.unapproved)]).toEqual(['18.50', '3.00'])
  })

  it('writes a CSV that matches the grid', () => {
    expect(payrollCsv(p).split('\r\n')).toEqual([
      '"Employee","Hours","Fri Oct 2","Sat Oct 3","Sun Oct 4","Mon Oct 5","Tue Oct 6","Wed Oct 7","Thu Oct 8","Total"',
      '"alex","Approved",7.50,0.00,0.00,0.00,7.25,0.00,0.00,14.75',
      '"Bo","Approved",3.25,0.00,0.00,0.00,0.00,0.00,0.00,3.25',
      '"Bo","Unapproved",2.00,0.00,0.00,1.00,0.00,0.00,0.00,3.00',
      '"No employee on timesheet","Approved",0.00,0.00,0.00,0.00,0.00,0.50,0.00,0.50',
      '"Total","Approved",10.75,0.00,0.00,0.00,7.25,0.50,0.00,18.50',
      '"Total","Unapproved",2.00,0.00,0.00,1.00,0.00,0.00,0.00,3.00',
      '',
    ])
  })

  it('quotes awkward names in the CSV', () => {
    const csv = payrollCsv(buildPayroll('2026-10-02', [sheet('=SUM(A1)', 2, '08:00', 60), sheet('O"Neil, Pat', 2, '08:00', 60)]))
    expect(csv).toContain(`"'=SUM(A1)","Approved"`)
    expect(csv).toContain('"O""Neil, Pat","Approved"')
  })
})

describe('times typed into the edit form', () => {
  it('turns a Toronto date and time into an ISO time with the right offset, either side of a clock change', () => {
    expect(zonedIso('2026-10-06', '09:05')).toBe('2026-10-06T09:05:00-04:00')
    expect(zonedIso('2026-01-15', '23:30')).toBe('2026-01-15T23:30:00-05:00')
    expect(zonedIso('2026-11-01', '00:30')).toBe('2026-11-01T00:30:00-04:00') // before clocks go back at 2 AM
    expect(zonedIso('2026-11-01', '03:00')).toBe('2026-11-01T03:00:00-05:00') // after
    expect(zonedIso('2026-03-08', '01:30')).toBe('2026-03-08T01:30:00-05:00') // before clocks go forward
    expect(zonedIso('2026-03-08', '03:30')).toBe('2026-03-08T03:30:00-04:00')
    expect(zonedIso('2026-10-06', '09:05', 'UTC')).toBe('2026-10-06T09:05:00+00:00')
  })

  it('reads an instant back as a local date and 24-hour time', () => {
    expect(localParts('2026-10-06T13:05:20.000Z')).toEqual({ date: '2026-10-06', time: '09:05' })
    expect(localParts('2026-10-07T03:59:00.000Z')).toEqual({ date: '2026-10-06', time: '23:59' })
    expect(localParts('2026-10-07T04:00:00.000Z')).toEqual({ date: '2026-10-07', time: '00:00' })
    const iso = zonedIso('2026-11-01', '03:00')
    expect(localParts(iso)).toEqual({ date: '2026-11-01', time: '03:00' })
  })
})

describe('flags', () => {
  it('flags very long entries, overlaps and missing clock-outs, and nothing else', () => {
    const p = buildPayroll('2026-10-02', [
      sheet('Alex', 2, '06:00', 1146),
      sheet('Bo', 2, '08:00', 120),
      sheet('Bo', 2, '09:30', 60),
      sheet('Bo', 2, '11:00', 60),
      sheet('Cy', 2, '08:00', 30, { to: null }),
      sheet('Di', 2, '08:00', 720),
      sheet('Di', 2, '20:00', 60),
    ])
    const flags = (name: string) => p.rows.find((r) => r.name === name)!.cells[0].entries.map((e) => e.flags)
    expect(flags('Alex')).toEqual([['long']])
    expect(flags('Bo')).toEqual([['overlap'], ['overlap'], []])
    expect(flags('Cy')).toEqual([['open']])
    expect(flags('Di')).toEqual([[], []]) // exactly 12 hours is allowed; back-to-back is not an overlap
    expect(p.flaggedEntries).toBe(4)
    expect(p.rows.map((r) => r.flagged)).toEqual([true, true, true, false])
  })
})
