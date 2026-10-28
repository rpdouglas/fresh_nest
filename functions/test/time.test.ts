import { describe, it, expect } from 'vitest'
import {
  addDays, calendarDateOf, dayOfWeek, elapsedMinutes, endOfMonth, monthKey, previousMonthKey,
  startOfMonth, startOfWeek, todayInZone, zonedParts, zonedWallTimeToInstant,
} from '../src/shared/time'
import { overlapsBlockedWindow } from '../src/shared/scheduling'

// P3-E38 (ADR-020) fixtures. Every expectation is in America/Toronto and must hold whatever the
// machine's own zone is (Cloud Functions run in UTC; a laptop may not).

const at = (iso: string) => new Date(iso)

describe('today and month boundaries in Toronto (evening date line)', () => {
  it('20:30 on Oct 28 in Toronto is still Oct 28, though it is Oct 29 in UTC', () => {
    const evening = at('2026-10-29T00:30:00Z') // 20:30 EDT
    expect(evening.toISOString().slice(0, 10)).toBe('2026-10-29') // the old, wrong answer
    expect(todayInZone(evening)).toBe('2026-10-28')
  })

  it('after the clock change the UTC date flips an hour earlier: 19:30 EST on Nov 2', () => {
    expect(todayInZone(at('2026-11-03T00:30:00Z'))).toBe('2026-11-02')
  })

  it('a shift on the last evening of October belongs to October (P7 Carla earnings month)', () => {
    const lastEvening = at('2026-11-01T03:30:00Z') // Oct 31, 23:30 EDT
    expect(monthKey(lastEvening)).toBe('2026-10')
    expect(monthKey(at('2026-11-01T04:30:00Z'))).toBe('2026-11') // Nov 1, 00:30 EDT
  })

  it('the earnings rollover at 00:00 on Nov 1 (Toronto) archives October', () => {
    const rollover = at('2026-11-01T04:00:00Z') // 00:00 EDT, 1 h before the clock change
    expect(previousMonthKey(monthKey(rollover))).toBe('2026-10')
    expect(previousMonthKey('2027-01')).toBe('2026-12')
  })
})

describe('calendar arithmetic', () => {
  it('adds days across the clock change and month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('weeks start on Monday; month starts and ends', () => {
    expect(dayOfWeek('2026-11-01')).toBe(0) // Sunday
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26')
    expect(startOfWeek('2026-11-02')).toBe('2026-11-02')
    expect(startOfMonth('2026-11-17')).toBe('2026-11-01')
    expect(endOfMonth('2026-11-17')).toBe('2026-11-30')
    expect(endOfMonth('2028-02-03')).toBe('2028-02-29')
  })

  it('P9 Mike: a Sunday blocked window matches Nov 1 whatever the machine zone', () => {
    const sunday = [{ recurring: true, dayOfWeek: 0, startTime: '08:00', endTime: '12:00' }]
    expect(overlapsBlockedWindow('2026-11-01', '09:00', '11:00', sunday)).toBe(true)
    expect(overlapsBlockedWindow('2026-11-02', '09:00', '11:00', sunday)).toBe(false)
  })
})

describe('wall time to instant across clock changes', () => {
  it('a 9:00 visit is 9:00 local on both sides of Nov 1 (13:00 UTC, then 14:00 UTC)', () => {
    expect(zonedWallTimeToInstant('2026-10-31', '09:00').toISOString()).toBe('2026-10-31T13:00:00.000Z')
    expect(zonedWallTimeToInstant('2026-11-01', '09:00').toISOString()).toBe('2026-11-01T14:00:00.000Z')
    expect(zonedWallTimeToInstant('2026-11-02', '09:00').toISOString()).toBe('2026-11-02T14:00:00.000Z')
  })

  it('Nov 1 fall-back: 01:30 happens twice; the first (daylight) one is used', () => {
    expect(zonedWallTimeToInstant('2026-11-01', '01:30').toISOString()).toBe('2026-11-01T05:30:00.000Z')
  })

  it('Mar 14, 2027 spring-forward: 02:30 never happens and moves to 03:30', () => {
    const t = zonedWallTimeToInstant('2027-03-14', '02:30')
    expect(t.toISOString()).toBe('2027-03-14T07:30:00.000Z')
    expect(zonedParts(t)).toMatchObject({ hour: 3, minute: 30 })
  })

  it('round-trips: the instant falls on the same local date', () => {
    for (const date of ['2026-10-31', '2026-11-01', '2026-11-02', '2027-03-14']) {
      expect(calendarDateOf(zonedWallTimeToInstant(date, '23:30'))).toBe(date)
      expect(calendarDateOf(zonedWallTimeToInstant(date, '00:00'))).toBe(date)
    }
  })

  it('elapsed time differs from wall time only across a clock change', () => {
    expect(elapsedMinutes('2026-11-01', '00:00', '04:00')).toBe(300) // 4 h on the clock, 5 h real
    expect(elapsedMinutes('2027-03-14', '00:00', '04:00')).toBe(180)
    expect(elapsedMinutes('2026-11-01', '09:00', '12:00')).toBe(180) // daytime visits are unaffected
  })
})
