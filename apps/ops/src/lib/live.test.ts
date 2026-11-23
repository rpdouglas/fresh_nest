import { describe, expect, it } from 'vitest'
import type { ReviewSheet, ReviewShift } from '../types'
import {
  buildLiveBoard,
  estimateDriveBetween,
  isWrongPlace,
  matchSheetsToShifts,
} from './live'
import type { Point } from './scheduleCheck'

const person = (name: string) => ({ id: name.toLowerCase(), name })
const at = (hm: string) => `2026-10-14T${hm}:00-04:00`
const ts = (hm: string) => Date.parse(at(hm))

function makeShift(
  id: string,
  who: string | null,
  start: string,
  end: string,
  over: Partial<ReviewShift> = {},
): ReviewShift {
  return {
    id,
    state: 'FINISHED',
    startTime: at(start),
    endTime: at(end),
    timezone: 'America/Toronto',
    breakDuration: 0,
    client: { id: 'c1', name: 'Harper' },
    assignee: who ? person(who) : null,
    jobSite: { id: 's1', name: 'Home', address: '123 Main St' },
    group: { id: 'g1', name: 'Cleaning' },
    ...over,
  }
}

function makeSheet(
  id: string,
  who: string,
  start: string,
  minutes: number | null,
  shiftId: string | null,
  over: Partial<ReviewSheet> = {},
): ReviewSheet {
  const from = at(start)
  const to = minutes !== null ? new Date(Date.parse(from) + minutes * 60_000).toISOString() : null
  return {
    id,
    state: 'APPROVED',
    from,
    to,
    totalDuration: minutes,
    timezone: 'America/Toronto',
    approvedAt: null,
    employee: person(who),
    group: { name: 'Cleaning' },
    client: { id: 'c1', name: 'Harper' },
    jobSite: { id: 's1', name: 'Home' },
    referenceObject: shiftId ? { __typename: 'TimeCard', shiftId } : { __typename: 'TimeCard' },
    ...over,
  }
}

describe('live board rules engine', () => {
  describe('status transitions', () => {
    it('identifies not-started before shift start', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')
      const board = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('07:45'),
        graceMinutes: 15,
      })

      const card = board.cleaners[0]
      expect(card.level).toBe('grey')
      expect(card.visits[0].status).toBe('not-started')
      expect(card.visits[0].level).toBe('grey')
      expect(card.currentVisit).toBeNull()
      expect(card.nextVisit?.shift.id).toBe('s1')
    })

    it('identifies due within the grace window', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')
      const board = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('08:10'), // 10 min after start, grace is 15
        graceMinutes: 15,
      })

      const card = board.cleaners[0]
      expect(card.level).toBe('grey')
      expect(card.visits[0].status).toBe('due')
      expect(card.visits[0].level).toBe('grey')
      expect(card.currentVisit?.shift.id).toBe('s1')
    })

    it('identifies late after grace window expires without clock-in', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')
      const board = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('08:20'), // 20 min late
        graceMinutes: 15,
      })

      const v = board.cleaners[0].visits[0]
      expect(v.status).toBe('late')
      expect(v.lateBy).toBe(20)
      expect(v.level).toBe('yellow') // < 2x grace, not red yet
    })

    it('identifies on-site when actively clocked in within schedule', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')
      const t = makeSheet('t1', 'Maya', '08:05', null, 's1')
      const board = buildLiveBoard({
        shifts: [s],
        timesheets: [t],
        now: ts('09:00'),
        graceMinutes: 15,
      })

      const v = board.cleaners[0].visits[0]
      expect(v.status).toBe('on-site')
      expect(v.level).toBe('grey')
      expect(v.inAt).toBe(ts('08:05'))
      expect(v.outAt).toBeNull()
      expect(v.overBy).toBe(0)
    })

    it('identifies running-over when clocked in past end plus grace', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')
      const t = makeSheet('t1', 'Maya', '08:00', null, 's1')
      const board = buildLiveBoard({
        shifts: [s],
        timesheets: [t],
        now: ts('10:25'), // 25 min past 10:00 end, grace 15
        graceMinutes: 15,
      })

      const v = board.cleaners[0].visits[0]
      expect(v.status).toBe('running-over')
      expect(v.level).toBe('yellow')
      expect(v.overBy).toBe(25)
    })

    it('identifies wrong-place when clocked in at unexpected client', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00', {
        client: { id: 'c1', name: 'Harper' },
      })
      const t = makeSheet('t1', 'Maya', '08:05', null, 's1', {
        client: { id: 'c2', name: 'Other Client' },
      })
      const board = buildLiveBoard({
        shifts: [s],
        timesheets: [t],
        now: ts('08:30'),
        graceMinutes: 15,
      })

      const v = board.cleaners[0].visits[0]
      expect(v.status).toBe('wrong-place')
      expect(v.wrongPlace).toBe(true)
      expect(v.level).toBe('yellow')
    })

    it('identifies done when clock-out timestamp is present', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')
      const t = makeSheet('t1', 'Maya', '08:00', 120, 's1') // clocked out at 10:00
      const board = buildLiveBoard({
        shifts: [s],
        timesheets: [t],
        now: ts('10:15'),
        graceMinutes: 15,
      })

      const card = board.cleaners[0]
      const v = card.visits[0]
      expect(v.status).toBe('done')
      expect(v.level).toBe('grey')
      expect(card.finished).toBe(true)
      expect(v.outAt).toBe(ts('10:00'))
    })

    it('identifies no-show when shift has ended with no clock-in', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')
      const board = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('10:05'), // past 10:00 end
        graceMinutes: 15,
      })

      const card = board.cleaners[0]
      const v = card.visits[0]
      expect(v.status).toBe('no-show')
      expect(v.level).toBe('yellow') // earlier no-show is yellow per ADR 0029
      expect(card.noShows).toBe(1)
      expect(card.finished).toBe(true)
    })
  })

  describe('grace parameterization', () => {
    it('applies custom grace periods for status evaluation', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')

      // At 08:12 (12m late):
      // With 15m grace -> due (grey)
      const b15 = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('08:12'),
        graceMinutes: 15,
      })
      expect(b15.cleaners[0].visits[0].status).toBe('due')
      expect(b15.cleaners[0].visits[0].level).toBe('grey')

      // With 10m grace -> late (yellow)
      const b10 = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('08:12'),
        graceMinutes: 10,
      })
      expect(b10.cleaners[0].visits[0].status).toBe('late')
      expect(b10.cleaners[0].visits[0].level).toBe('yellow')

      // At 08:18 (18m late):
      // With 20m grace -> due (grey)
      const b20 = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('08:18'),
        graceMinutes: 20,
      })
      expect(b20.cleaners[0].visits[0].status).toBe('due')
      expect(b20.cleaners[0].visits[0].level).toBe('grey')
    })
  })

  describe('three severity levels (ADR 0029)', () => {
    it('escalates late to Red at twice grace (30m with 15m grace)', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')

      // At 08:29 (29m late, under 2x grace) -> Yellow
      const b29 = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('08:29'),
        graceMinutes: 15,
      })
      expect(b29.cleaners[0].visits[0].level).toBe('yellow')
      expect(b29.cleaners[0].level).toBe('yellow')

      // At 08:30 (30m late, exactly 2x grace) -> Red
      const b30 = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('08:30'),
        graceMinutes: 15,
      })
      expect(b30.cleaners[0].visits[0].level).toBe('red')
      expect(b30.cleaners[0].level).toBe('red')
      expect(b30.counts.red).toBe(1)
    })

    it('escalates late to Red when next visit is at risk, even under twice grace', () => {
      // V1: 08:00-09:00, V2: 09:15-10:15 (15m gap)
      // At 08:20, V1 is 20m late (< 30m).
      // V1 expected finish = 08:20 + 60m = 09:20.
      // Drive = 10m -> V2 expected arrival = 09:30.
      // V2 start is 09:15 with 15m grace (starts at risk if arrival > 09:30).
      // If drive is 20m -> arrival 09:40 > 09:30 -> V2 at risk!
      const s1 = makeShift('s1', 'Maya', '08:00', '09:00', {
        jobSite: { id: 's1', name: 'Site A', address: '100 Alpha St' },
      })
      const s2 = makeShift('s2', 'Maya', '09:15', '10:15', {
        jobSite: { id: 's2', name: 'Site B', address: '200 Beta St' },
      })

      const places = new Map<string, Point | null>([
        ['100 alpha st', { lat: 43.65, lon: -79.38 }],
        ['200 beta st', { lat: 43.75, lon: -79.38 }], // ~11 km straight line, ~20 min drive
      ])

      const board = buildLiveBoard({
        shifts: [s1, s2],
        timesheets: [],
        now: ts('08:20'), // only 20 min late (< 2*15=30)
        graceMinutes: 15,
        places,
      })

      const v1 = board.cleaners[0].visits[0]
      const v2 = board.cleaners[0].visits[1]

      expect(v2.status).toBe('not-started')
      expect(v2.riskMinutes).toBeGreaterThan(0)
      expect(v2.level).toBe('yellow')

      // V1 escalated to Red because V2 is at risk!
      expect(v1.status).toBe('late')
      expect(v1.level).toBe('red')
      expect(board.cleaners[0].level).toBe('red')
    })
  })

  describe('handled overrides', () => {
    it('turns a red visit and its cleaner card to yellow when handled', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')

      // 35 min late -> normally Red
      const boardRed = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('08:35'),
        graceMinutes: 15,
      })
      expect(boardRed.cleaners[0].visits[0].level).toBe('red')
      expect(boardRed.cleaners[0].level).toBe('red')

      // When shift id is in handledShiftIds -> Yellow
      const boardHandled = buildLiveBoard({
        shifts: [s],
        timesheets: [],
        now: ts('08:35'),
        graceMinutes: 15,
        handledShiftIds: new Set(['s1']),
      })
      const v = boardHandled.cleaners[0].visits[0]
      expect(v.handled).toBe(true)
      expect(v.level).toBe('yellow')
      expect(boardHandled.cleaners[0].level).toBe('yellow')
      expect(boardHandled.counts.red).toBe(0)
      expect(boardHandled.counts.yellow).toBe(1)
    })
  })

  describe('knock-on at-risk cascade across multiple visits', () => {
    it('propagates delay and drive times across three visits', () => {
      // Cleaner Maya with 3 visits:
      // V1: 08:00-09:00 (Site A)
      // V2: 09:30-10:30 (Site B)
      // V3: 10:45-11:45 (Site C)
      const s1 = makeShift('s1', 'Maya', '08:00', '09:00', {
        jobSite: { id: 's1', name: 'Site A', address: '100 Alpha St' },
      })
      const s2 = makeShift('s2', 'Maya', '09:30', '10:30', {
        jobSite: { id: 's2', name: 'Site B', address: '200 Beta St' },
      })
      const s3 = makeShift('s3', 'Maya', '10:45', '11:45', {
        jobSite: { id: 's3', name: 'Site C', address: '300 Gamma St' },
      })

      // Distances that give ~15 min drives
      const places = new Map<string, Point | null>([
        ['100 alpha st', { lat: 43.65, lon: -79.38 }],
        ['200 beta st', { lat: 43.72, lon: -79.38 }],
        ['300 gamma st', { lat: 43.79, lon: -79.38 }],
      ])

      // V1 is running over at 09:25 (25 min past 09:00 scheduled finish)
      const t1 = makeSheet('t1', 'Maya', '08:00', null, 's1')

      const board = buildLiveBoard({
        shifts: [s1, s2, s3],
        timesheets: [t1],
        now: ts('09:25'),
        graceMinutes: 15,
        places,
      })

      const visits = board.cleaners[0].visits
      expect(visits[0].status).toBe('running-over')
      expect(visits[0].overBy).toBe(25)

      // V2 expected arrival = 09:25 + drive > 09:15 + 15m (09:30) -> at risk
      expect(visits[1].status).toBe('not-started')
      expect(visits[1].riskMinutes).toBeGreaterThan(0)
      expect(visits[1].riskFrom?.clientName).toBe('Harper')
      expect(visits[1].hasDriveEstimate).toBe(true)
      expect(visits[1].level).toBe('yellow')

      // V3 also pushed at risk by V2's knock-on finish time
      expect(visits[2].status).toBe('not-started')
      expect(visits[2].riskMinutes).toBeGreaterThan(0)
      expect(visits[2].level).toBe('yellow')
    })

    it('falls back gracefully to 0 drive when places coordinates are missing', () => {
      const s1 = makeShift('s1', 'Maya', '08:00', '09:00', {
        jobSite: { id: 's1', name: 'Unknown A', address: 'Nowhere St' },
      })
      const s2 = makeShift('s2', 'Maya', '09:15', '10:15', {
        jobSite: { id: 's2', name: 'Unknown B', address: 'Secret Rd' },
      })

      const t1 = makeSheet('t1', 'Maya', '08:00', null, 's1')

      // Running over until 09:40
      const board = buildLiveBoard({
        shifts: [s1, s2],
        timesheets: [t1],
        now: ts('09:40'),
        graceMinutes: 15,
        places: new Map(), // empty places
      })

      const v2 = board.cleaners[0].visits[1]
      expect(v2.hasDriveEstimate).toBe(false)
      expect(v2.driveFromPrevMinutes).toBe(0)
      // Expected arrival is just previous finish (09:40), which exceeds 09:15 + 15m = 09:30
      expect(v2.expectedArrival).toBe(ts('09:40'))
      expect(v2.riskMinutes).toBe(25)
    })
  })

  describe('partner awareness', () => {
    it('flags partnerLate and turns yellow when partner is late on a shared visit', () => {
      // Pair visit: Maya and Logan booked on the same shift at Harper
      const s1 = makeShift('s1', 'Maya', '08:00', '10:00', {
        shiftPartners: [{ id: 's2', assignee: person('Logan') }],
      })
      const s2 = makeShift('s2', 'Logan', '08:00', '10:00', {
        shiftPartners: [{ id: 's1', assignee: person('Maya') }],
      })

      // Maya clocked in on time at 08:05
      const t1 = makeSheet('t1', 'Maya', '08:05', null, 's1')
      // Logan has not clocked in at 08:20 (late)

      const board = buildLiveBoard({
        shifts: [s1, s2],
        timesheets: [t1],
        now: ts('08:20'),
        graceMinutes: 15,
      })

      const mayaCard = board.cleaners.find((c) => c.cleaner.name === 'Maya')!
      const loganCard = board.cleaners.find((c) => c.cleaner.name === 'Logan')!

      expect(loganCard.visits[0].status).toBe('late')
      expect(loganCard.level).toBe('yellow')

      // Maya is on-site, but partner is late -> partnerLate true and elevated to Yellow
      expect(mayaCard.visits[0].status).toBe('on-site')
      expect(mayaCard.visits[0].partnerLate).toBe(true)
      expect(mayaCard.visits[0].level).toBe('yellow')
      expect(mayaCard.level).toBe('yellow')
    })
  })

  describe('next 30 minutes strip', () => {
    it('collects urgent visits in the immediate 30m window', () => {
      // Current time: 08:00
      // 1. Visit starting in 20 min (08:20) that is at risk -> INCLUDED
      // 2. Visit starting in 45 min (08:45) that is at risk -> EXCLUDED (>30m)
      // 3. Visit ending in 15 min (08:15) that is running over -> INCLUDED
      // 4. Visit starting in 10 min (08:10) on time (grey) -> EXCLUDED (grey)

      const sPrev = makeShift('sPrev', 'Maya', '07:00', '07:45')
      const tPrev = makeSheet('tPrev', 'Maya', '07:00', null, 'sPrev') // running over at 08:00

      // Starts at 08:20 (in 20m), expected arrival is delayed past 08:20 + 15m (08:35)
      // If drive is 40 min, 08:00 + 40m = 08:40 > 08:35 -> at risk!
      const sRisky20 = makeShift('sRisky20', 'Maya', '08:20', '09:20', {
        jobSite: { id: 's20', name: 'Far Site', address: 'Far Away St' },
      })

      // Starts at 08:50 (in 50m)
      const sRisky50 = makeShift('sRisky50', 'Logan', '08:50', '09:50')

      // Ends at 08:15 (in 15m), but cleaner clocked in late at 08:00 for a 60 min job -> finish 09:00 > 08:15 + 15m
      const sEndingSoon = makeShift('sEndingSoon', 'Alex', '07:15', '08:15')
      const tEndingSoon = makeSheet('tEndingSoon', 'Alex', '08:00', null, 'sEndingSoon')

      // On-time upcoming visit at 08:10
      const sOnTime = makeShift('sOnTime', 'Sam', '08:10', '09:10')

      const places = new Map<string, Point | null>([
        ['123 main st', { lat: 43.65, lon: -79.38 }],
        ['far away st', { lat: 43.95, lon: -79.38 }], // ~33 km -> ~40m drive
      ])

      const board = buildLiveBoard({
        shifts: [sPrev, sRisky20, sRisky50, sEndingSoon, sOnTime],
        timesheets: [tPrev, tEndingSoon],
        now: ts('08:00'),
        graceMinutes: 15,
        places,
      })

      const stripIds = board.next30Minutes.map((v) => v.shift.id)
      expect(stripIds).toContain('sRisky20')
      expect(stripIds).toContain('sEndingSoon')
      expect(stripIds).not.toContain('sRisky50') // >30 min out
      expect(stripIds).not.toContain('sOnTime') // grey
    })
  })

  describe('on call exclusions', () => {
    it('completely excludes On Call shifts from the live board', () => {
      const sNormal = makeShift('s1', 'Maya', '08:00', '10:00')
      const sOnCall = makeShift('s2', 'Logan', '08:00', '16:00', {
        group: { id: 'g2', name: 'On Call' },
        client: null,
        jobSite: null,
      })

      const board = buildLiveBoard({
        shifts: [sNormal, sOnCall],
        timesheets: [],
        now: ts('08:10'),
      })

      expect(board.cleaners.map((c) => c.cleaner.name)).toEqual(['Maya'])
      expect(board.cleaners.some((c) => c.cleaner.name === 'Logan')).toBe(false)
    })
  })

  describe('unmeasured timesheets', () => {
    it('treats manual entries without TimeCard as attended and never late', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00')
      // Timesheet with null referenceObject (entered by hand)
      const t = makeSheet('t1', 'Maya', '08:45', 120, null, {
        referenceObject: null,
      })

      const board = buildLiveBoard({
        shifts: [s],
        timesheets: [t],
        now: ts('11:00'),
        graceMinutes: 15,
      })

      const v = board.cleaners[0].visits[0]
      expect(v.unmeasured).toBe(true)
      expect(v.status).toBe('done')
      expect(v.level).toBe('grey')
      expect(v.lateBy).toBe(0)
    })
  })

  describe('cleaner card sorting and rank', () => {
    it('sorts Red cleaners first, Yellow second, Grey last', () => {
      // Red cleaner (35 min late)
      const sRed = makeShift('s1', 'Alice', '08:00', '10:00')

      // Yellow cleaner (running over)
      const sYellow = makeShift('s2', 'Bob', '08:00', '09:00')
      const tYellow = makeSheet('t2', 'Bob', '08:00', null, 's2')

      // Grey cleaner (on site on time)
      const sGrey = makeShift('s3', 'Charlie', '08:00', '10:00', {
        client: { id: 'c3', name: 'Clark' },
        jobSite: { id: 's3', name: 'Site C', address: '300 Clark Ave' },
      })
      const tGrey = makeSheet('t3', 'Charlie', '08:00', null, 's3', {
        client: { id: 'c3', name: 'Clark' },
      })

      const board = buildLiveBoard({
        shifts: [sRed, sYellow, sGrey],
        timesheets: [tYellow, tGrey],
        now: ts('09:35'),
        graceMinutes: 15,
      })

      expect(board.cleaners.map((c) => [c.cleaner.name, c.level])).toEqual([
        ['Alice', 'red'],
        ['Bob', 'yellow'],
        ['Charlie', 'grey'],
      ])
      expect(board.counts).toEqual({ total: 3, red: 1, yellow: 1, grey: 1 })
    })
  })

  describe('client groupings', () => {
    it('groups visits by client and sets client level to highest visit level', () => {
      const s1 = makeShift('s1', 'Maya', '08:00', '10:00', {
        client: { id: 'c1', name: 'Harper' },
      })
      const s2 = makeShift('s2', 'Logan', '08:00', '10:00', {
        client: { id: 'c2', name: 'Baker' },
      })

      // Maya is 35m late (Red) at Harper; Logan is on time (Grey) at Baker
      const t2 = makeSheet('t2', 'Logan', '08:00', null, 's2', {
        client: { id: 'c2', name: 'Baker' },
      })

      const board = buildLiveBoard({
        shifts: [s1, s2],
        timesheets: [t2],
        now: ts('08:35'),
        graceMinutes: 15,
      })

      expect(board.clients.map((c) => [c.clientName, c.level])).toEqual([
        ['Harper', 'red'],
        ['Baker', 'grey'],
      ])
    })
  })

  describe('helper functions', () => {
    it('isWrongPlace detects mismatches in client id or name', () => {
      const s = makeShift('s1', 'Maya', '08:00', '10:00', {
        client: { id: 'c1', name: 'Harper' },
      })
      const tSame = makeSheet('t1', 'Maya', '08:00', null, 's1', {
        client: { id: 'c1', name: 'Harper' },
      })
      const tDiff = makeSheet('t2', 'Maya', '08:00', null, 's1', {
        client: { id: 'c2', name: 'Other' },
      })

      expect(isWrongPlace(s, tSame)).toBe(false)
      expect(isWrongPlace(s, tDiff)).toBe(true)
    })

    it('estimateDriveBetween returns 0 and hasDrive false when places are missing', () => {
      const s1 = makeShift('s1', 'Maya', '08:00', '10:00', {
        jobSite: { id: 's1', name: 'Site 1', address: '123 Fake St' },
      })
      const s2 = makeShift('s2', 'Maya', '10:30', '12:30', {
        jobSite: { id: 's2', name: 'Site 2', address: '456 Missing Rd' },
      })

      const res = estimateDriveBetween(s1, s2, new Map())
      expect(res).toEqual({ minutes: 0, km: 0, hasDrive: false })
    })

    it('matchSheetsToShifts matches by shiftId first and overlapping time second', () => {
      const s1 = makeShift('s1', 'Maya', '08:00', '10:00')
      const s2 = makeShift('s2', 'Maya', '11:00', '13:00')
      const t1 = makeSheet('t1', 'Maya', '08:00', 120, 's1')
      const t2 = makeSheet('t2', 'Maya', '11:05', 115, null) // loose overlap

      const matches = matchSheetsToShifts([s1, s2], [t1, t2], ts('12:00'))
      expect(matches.get('s1')?.map((t) => t.id)).toEqual(['t1'])
      expect(matches.get('s2')?.map((t) => t.id)).toEqual(['t2'])
    })
  })
})

