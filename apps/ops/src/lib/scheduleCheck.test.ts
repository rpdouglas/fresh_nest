import { describe, expect, it } from 'vitest'
import type { Shift } from '../types'
import type { Point } from './scheduleCheck'
import { addressKey, addressesToPlace, checkSchedule, driveEstimate, nextPeriod, straightKm, teamPosition, weeksFor } from './scheduleCheck'

const person = (name: string) => ({ id: name.toLowerCase(), name })
const at = (day: number, hm: string) => `2026-10-${String(day).padStart(2, '0')}T${hm}:00-04:00`
/** A shift on an October 2026 day; `partners` are the ids of the other cleaners' shifts on the visit. */
function shift(id: string, who: string | null, day: number, start: string, end: string, where = 'Harper', over: Partial<Shift> = {}, partners: string[] = []): Shift {
  return {
    id, title: null, state: 'PUBLISHED', startTime: at(day, start), endTime: at(day, end), timezone: 'America/Toronto', breakDuration: 0, note: null, systemNote: null,
    client: { id: `c-${where}`, name: where, clientNumber: null, phoneNumber: null, email: null }, assignee: who ? person(who) : null,
    jobSite: { name: where, address: `1 ${where} Rd, Cornwall, ON`, note: null }, schedule: null, group: { name: 'Cleaning' },
    shiftPartners: partners.map((p) => ({ id: p, assignee: null })), checklistAssignments: null, ...over,
  }
}
/** Two cleaners on one visit: one shift each, naming the other. */
const pair = (id: string, a: string, b: string | null, day: number, start: string, end: string, where = 'Harper', over: Partial<Shift> = {}) => [
  shift(`${id}a`, a, day, start, end, where, over, [`${id}b`]),
  shift(`${id}b`, b, day, start, end, where, over, [`${id}a`]),
]
const FROM = '2026-10-13' // a Tuesday; the check covers it and the seven days after
const NOW = Date.parse(at(13, '06:00'))
const NONE = new Set<string>()
const NOWHERE = new Map<string, Point | null>()
const kinds = (shifts: Shift[], ok = NONE, places = NOWHERE) => checkSchedule(shifts, FROM, NOW, ok, places).problems.map((p) => p.kind)

describe('positions that need a team of two', () => {
  it('matches Camelo\'s spellings', () => {
    expect(['Cleaning', 'cleaning', 'AirBNB', 'ISLAND 17 AIRBNB', 'Deep Cleaner', 'Deep Clean', 'Office', 'Confirm', 'On Call'].map(teamPosition)).toEqual([
      'Cleaning', 'Cleaning', 'AirBnB', 'AirBnB', 'Deep Clean', 'Deep Clean', null, null, null,
    ])
  })

  it('treats a shift with no position as Cleaning', () => {
    expect([teamPosition(null), teamPosition(''), teamPosition(undefined)]).toEqual(['Cleaning', 'Cleaning', 'Cleaning'])
    expect(checkSchedule([shift('s1', 'Jo', 14, '09:00', '11:00', 'Ives', { group: null })], FROM, NOW, NONE, NOWHERE).problems).toMatchObject([
      { kind: 'solo', detail: 'No position, 9:00 AM – 11:00 AM. Cleaning visits need a team of two.' },
    ])
  })
})

describe('solo and unassigned', () => {
  it('passes a pair, and flags one cleaner alone on a visit that needs two', () => {
    expect(kinds(pair('p', 'Maya', 'Jo', 13, '09:00', '11:00'))).toEqual([])
    const c = checkSchedule([shift('s1', 'Maya', 14, '09:00', '11:00')], FROM, NOW, NONE, NOWHERE)
    expect(c.problems).toMatchObject([{ kind: 'solo', date: '2026-10-14', shiftId: 's1', what: 'Maya alone at Harper' }])
    expect(c.days[1]).toMatchObject({ date: '2026-10-14', visits: 1, cleaners: 1 })
  })

  it('does not ask for a team on other positions, and never looks at On Call', () => {
    expect(kinds([shift('s1', 'Maya', 14, '09:00', '11:00', 'Harper', { group: { name: 'Office' } })])).toEqual([])
    expect(kinds([shift('s3', null, 14, '00:00', '23:00', 'Harper', { group: { name: 'On Call' }, client: null, jobSite: null })])).toEqual([])
  })

  it('counts cleaners booked separately at the same client at overlapping times as a team', () => {
    expect(kinds([shift('s1', 'Maya', 14, '09:00', '11:00'), shift('s2', 'Jo', 14, '09:30', '10:00')])).toEqual([])
    // one after the other is not together, and nor is the same time at another client
    expect(kinds([shift('s1', 'Maya', 14, '09:00', '11:00'), shift('s2', 'Jo', 14, '11:00', '12:00')])).toEqual(['solo', 'solo'])
    expect(kinds([shift('s1', 'Maya', 14, '09:00', '11:00'), shift('s2', 'Jo', 14, '09:00', '11:00', 'Ives')])).toEqual(['solo', 'solo'])
  })

  it('clears a solo visit once it is marked OK, that visit only', () => {
    const shifts = [shift('s1', 'Maya', 14, '09:00', '11:00'), shift('s2', 'Jo', 15, '09:00', '11:00')]
    const c = checkSchedule(shifts, FROM, NOW, new Set(['s1']), NOWHERE)
    expect([c.problems.map((p) => p.shiftId), c.okSolo]).toEqual([['s2'], 1])
  })

  it('flags a visit with nobody on it, and a pair with one place empty, as unassigned (not solo)', () => {
    const c = checkSchedule([shift('u1', null, 13, '09:00', '11:00'), ...pair('p', 'Maya', null, 14, '09:00', '11:00', 'Ives')], FROM, NOW, NONE, NOWHERE)
    expect(c.problems.map((p) => [p.kind, p.what])).toEqual([
      ['unassigned', 'Harper, 9:00 AM – 11:00 AM, nobody assigned'],
      ['unassigned', 'Ives, 9:00 AM – 11:00 AM: 1 of 2 places not filled'],
    ])
  })

  it('looks at today and the seven days after', () => {
    expect(kinds([shift('s0', 'Maya', 12, '09:00', '11:00'), shift('s9', 'Maya', 21, '09:00', '11:00')])).toEqual([])
    expect(kinds([shift('s1', 'Maya', 13, '09:00', '11:00'), shift('s8', 'Jo', 20, '09:00', '11:00')])).toEqual(['solo', 'solo'])
    expect(checkSchedule([], FROM, NOW, NONE, NOWHERE).days.map((d) => d.date)).toEqual(['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'])
  })

  it('leaves out today\'s visits that have already started', () => {
    const today = [shift('early', 'Maya', 13, '08:00', '10:00'), shift('later', 'Jo', 13, '14:00', '16:00', 'Ives')]
    const c = checkSchedule(today, FROM, Date.parse(at(13, '12:00')), NONE, NOWHERE)
    expect([c.problems.map((p) => p.shiftId), c.days[0].visits]).toEqual([['later'], 1])
  })
})

describe('double bookings and long days', () => {
  it('flags a cleaner on two visits that overlap, once for the team', () => {
    const c = checkSchedule([...pair('a', 'Maya', 'Jo', 13, '09:00', '11:00'), ...pair('b', 'Maya', 'Jo', 13, '10:30', '12:00', 'Ives')], FROM, NOW, NONE, NOWHERE)
    expect(c.problems).toMatchObject([{ kind: 'double', what: 'Jo and Maya booked twice: Harper and Ives' }])
  })

  it('does not call a day long because its visits are far apart: time between visits is not worked', () => {
    // 4 hours of work spread from 7:30 in the morning to 9:30 at night
    const spread = [...pair('a', 'Maya', 'Jo', 13, '07:30', '09:30'), ...pair('b', 'Maya', 'Jo', 13, '19:30', '21:30', 'Ives')]
    expect(kinds(spread)).toEqual([])
  })

  it('flags a day whose shifts add up to more than 10 hours of work', () => {
    const day = (end: string) => [...pair('a', 'Maya', 'Jo', 13, '07:00', '12:00'), ...pair('b', 'Maya', 'Jo', 13, '13:00', end, 'Ives')]
    expect(kinds(day('18:00'))).toEqual([]) // exactly 10 hours
    expect(checkSchedule(day('18:30'), FROM, NOW, NONE, NOWHERE).problems.map((p) => [p.kind, p.what, p.detail])).toEqual([
      ['long', 'Jo scheduled 10.5 h of work', '2 shifts between 7:00 AM and 6:30 PM.'],
      ['long', 'Maya scheduled 10.5 h of work', '2 shifts between 7:00 AM and 6:30 PM.'],
    ])
  })

  it('takes breaks off, counts a paid shift with no client, and never counts On Call', () => {
    const visits = (brk: number) => [...pair('a', 'Maya', 'Jo', 13, '07:00', '12:00', 'Harper', { breakDuration: brk }), ...pair('b', 'Maya', 'Jo', 13, '13:00', '18:30', 'Ives')]
    expect(kinds(visits(30))).toEqual([]) // 10.5 h less a 30-minute break
    // 9 hours at clients and 2 in the office is 11 hours of work
    const office = shift('o1', 'Maya', 13, '18:00', '20:00', 'Office', { client: null, jobSite: null, group: { name: 'Office' } })
    const nine = [...pair('a', 'Maya', 'Jo', 13, '07:00', '12:00'), ...pair('b', 'Maya', 'Jo', 13, '13:00', '17:00', 'Ives')]
    expect(checkSchedule([...nine, office], FROM, NOW, NONE, NOWHERE).problems.map((p) => p.what)).toEqual(['Maya scheduled 11.0 h of work'])
    // being on call all day adds nothing
    const onCall = shift('oc', 'Jo', 13, '00:00', '23:59', 'Harper', { client: null, jobSite: null, group: { name: 'On Call' } })
    expect(kinds([...nine, onCall])).toEqual([])
  })
})

describe('drive time between visits', () => {
  const harper = { lat: 45.02, lon: -74.73 }
  const ives = { lat: 45.02, lon: -74.63 } // about 7.9 km east
  const places = new Map<string, Point | null>([[addressKey('1 Harper Rd, Cornwall, ON'), harper], [addressKey('1 Ives Rd, Cornwall, ON'), ives]])
  const day = (next: string) => [...pair('a', 'Maya', 'Jo', 13, '09:00', '11:00'), ...pair('b', 'Maya', 'Jo', 13, next, '14:00', 'Ives')]

  it('estimates the drive from the straight-line distance', () => {
    expect(straightKm(harper, ives)).toBeCloseTo(7.86, 1)
    expect(driveEstimate(straightKm(harper, ives))).toMatchObject({ minutes: 21 })
    // past the first 10 km of road the rest is at highway speed
    expect(driveEstimate(40).minutes).toBe(3 + 17 + 38)
  })

  it('flags a gap shorter than the drive, once for the team', () => {
    // a 21 min drive fits a 21 min gap, and a 25 min one with only 4 min to spare
    expect(kinds(day('11:21'), NONE, places)).toEqual([])
    expect(kinds(day('11:25'), NONE, places)).toEqual([])
    expect(kinds(day('11:20'), NONE, places)).toEqual(['gap'])
    const c = checkSchedule(day('11:15'), FROM, NOW, NONE, places)
    expect(c.problems).toMatchObject([{ kind: 'gap', what: 'Jo and Maya, Harper → Ives', detail: '15 min between visits; about 21 min drive (10.6 km).' }])
  })

  it('skips visits at the same address, and counts pairs it cannot place', () => {
    expect(kinds([...pair('a', 'Maya', 'Jo', 13, '09:00', '11:00'), ...pair('b', 'Maya', 'Jo', 13, '11:00', '13:00')], NONE, places)).toEqual([])
    const c = checkSchedule(day('11:05'), FROM, NOW, NONE, new Map([[addressKey('1 Harper Rd, Cornwall, ON'), harper], [addressKey('1 Ives Rd, Cornwall, ON'), null]]))
    expect([c.problems, c.gapsNotChecked]).toEqual([[], 1])
  })

  it('lists each address in the window once', () => {
    expect(addressesToPlace([...day('11:15'), shift('later', 'Maya', 25, '09:00', '10:00', 'Zed')], FROM)).toEqual(['1 Harper Rd, Cornwall, ON', '1 Ives Rd, Cornwall, ON'])
  })
})

describe('the pay period that starts in the window', () => {
  it('finds the next Friday, and the weeks to load to cover it', () => {
    expect([nextPeriod('2026-10-13'), nextPeriod('2026-10-16'), nextPeriod('2026-10-17')]).toEqual(['2026-10-16', '2026-10-23', '2026-10-23'])
    expect(weeksFor('2026-10-13')).toEqual(['2026-10-12', '2026-10-19'])
    expect(weeksFor('2026-10-17')).toEqual(['2026-10-12', '2026-10-19', '2026-10-26'])
  })

  it('flags anyone scheduled over 44 hours in it, breaks taken off', () => {
    // Friday the 16th to Thursday the 22nd: five 9-hour days is 45 h
    const week = (brk: number) => [16, 17, 19, 20, 21].flatMap((d, i) => pair(`w${i}`, 'Maya', 'Jo', d, '08:00', '17:00', 'Harper', { breakDuration: brk }))
    expect(checkSchedule(week(0), FROM, NOW, NONE, NOWHERE).problems.filter((p) => p.kind === 'overtime').map((p) => p.what)).toEqual([
      'Jo scheduled 45.0 h in the next pay period',
      'Maya scheduled 45.0 h in the next pay period',
    ])
    expect(kinds(week(30))).not.toContain('overtime')
  })
})
