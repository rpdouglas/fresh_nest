import { describe, expect, it } from 'vitest'
import type { ClientPattern, Weekday } from './clientPatterns'
import { WEEKDAYS } from './clientPatterns'
import { type PlanClient, driveMinutes, howOften, planClients, planRoutes, routeMinutes, visitMinutes } from './routePlan'

const OFFICE = { lat: 45.0, lon: -74.7 }
// about 4 km east of the office, and about 40 km east
const NEAR = { lat: 45.0, lon: -74.65 }
const FAR = { lat: 45.0, lon: -74.2 }

const days = (counts: Partial<Record<Weekday, number>>) => Object.fromEntries(WEEKDAYS.map((d) => [d, counts[d] ?? 0])) as Record<Weekday, number>

function client(name: string, over: Partial<PlanClient> = {}): PlanClient {
  return { key: name, name, address: `${name} Rd`, point: NEAR, assumed: false, usualStart: 9 * 60, minutes: 60, days: ['Monday'], every: 1, often: 'Weekly', ...over }
}
function pattern(name: string, over: Partial<ClientPattern> = {}): ClientPattern {
  return {
    key: name, name, address: `${name} Rd`, visits: 12, usualStart: 9 * 60, usualStartCount: 12, usualDay: 'Monday', usualDayCount: 12,
    dayCounts: days({ Monday: 12 }), sheetVisits: 12, avgWorked: 80, avgSpan: 80, avgScheduled: 90, ...over,
  }
}

describe('how often and how long', () => {
  it('sets how often from the visits seen, scaled to four weeks', () => {
    const often = (visits: number) => howOften({ visits, usualDay: 'Monday', dayCounts: days({ Monday: visits }) }, 12).often
    expect([often(12), often(9), often(6), often(5), often(3)]).toEqual(['Weekly', 'Weekly', 'Every 2 weeks', 'Every 2 weeks', 'Every 4 weeks'])
  })

  it('plans a client seen several times a week on each weekday it was seen at least every other week', () => {
    const h = howOften({ visits: 50, usualDay: 'Friday', dayCounts: days({ Monday: 6, Tuesday: 12, Friday: 30, Sunday: 2 }) }, 12)
    expect([h.days, h.every]).toEqual([['Monday', 'Tuesday', 'Friday'], 1])
  })

  it('rounds a visit up to 15 minutes, at least 30, from the time cleaning or else the schedule', () => {
    expect([visitMinutes({ avgWorked: 61, avgScheduled: 90 }), visitMinutes({ avgWorked: null, avgScheduled: 90 }), visitMinutes({ avgWorked: 10, avgScheduled: null })]).toEqual([75, 90, 30])
  })

  it('drives nowhere to the same place, and at least 5 minutes anywhere else', () => {
    expect([driveMinutes(NEAR, NEAR), driveMinutes(OFFICE, { lat: 45.0001, lon: -74.7 }), driveMinutes(null, NEAR)]).toEqual([0, 5, 0])
    expect(driveMinutes(OFFICE, FAR)).toBeGreaterThan(driveMinutes(OFFICE, NEAR))
  })
})

describe('the clients to plan', () => {
  it('uses the stand-in place for an address that could not be placed, and says so', () => {
    const { clients, leftOut } = planClients([pattern('Harper'), pattern('Quill', { address: null })], 12, (a) => (a === 'Harper Rd' ? NEAR : null), FAR)
    expect(clients.map((c) => [c.name, c.assumed])).toEqual([['Harper', false], ['Quill', true]])
    expect(leftOut).toEqual([])
  })

  it('leaves out a client with no start time, or nowhere to put it', () => {
    const { clients, leftOut } = planClients([pattern('Harper', { usualStart: null, usualDay: null }), pattern('Quill', { address: null })], 12, () => null, null)
    expect(clients).toEqual([])
    expect(leftOut).toEqual([{ name: 'Harper', why: 'no scheduled start time' }, { name: 'Quill', why: 'no address in Camelo' }])
  })
})

describe('routes', () => {
  it('starts each team at the office and brings it back', () => {
    const routes = planRoutes([client('Harper')], OFFICE, 2).filter((r) => r.week === 1)
    expect(routes).toHaveLength(1)
    const [r] = routes
    const drive = driveMinutes(OFFICE, NEAR)
    expect([r.day, r.team, r.leave, r.stops[0].start, r.driveBack, r.back]).toEqual(['Monday', 1, 9 * 60 - drive, 9 * 60, drive, 10 * 60 + drive])
    expect(routeMinutes(r)).toBe(60 + 2 * drive)
  })

  it('plans a weekly client every week, every-2 twice and every-4 once', () => {
    const plan = planRoutes([client('W'), client('B', { every: 2, usualStart: 11 * 60 }), client('M', { every: 4, usualStart: 13 * 60 })], OFFICE, 2)
    const weeksOf = (name: string) => plan.filter((r) => r.stops.some((s) => s.client.name === name)).map((r) => r.week)
    expect(weeksOf('W')).toEqual([1, 2, 3, 4])
    expect(weeksOf('B')).toHaveLength(2)
    expect(weeksOf('M')).toHaveLength(1)
  })

  it('puts visits at the same time on separate teams, up to the number of teams', () => {
    const three = [client('A'), client('B'), client('C')]
    expect(planRoutes(three, OFFICE, 3).filter((r) => r.week === 1).map((r) => r.stops.map((s) => s.start))).toEqual([[540], [540], [540]])
    // with two teams, the third visit waits for one of them, and is marked later than usual
    const two = planRoutes(three, OFFICE, 2).filter((r) => r.week === 1)
    expect(two).toHaveLength(2)
    expect(Math.max(...two.flatMap((r) => r.stops.map((s) => s.moved)))).toBeGreaterThan(0)
  })

  it('chains a visit after one that finishes before it on the same team', () => {
    const routes = planRoutes([client('A'), client('B', { usualStart: 10 * 60 + 30 })], OFFICE, 3).filter((r) => r.week === 1)
    expect(routes.map((r) => r.stops.map((s) => s.client.name))).toEqual([['A', 'B']])
  })

  it('spreads every-2-week clients on one weekday over different weeks', () => {
    const plan = planRoutes([client('A', { every: 2 }), client('B', { every: 2 })], OFFICE, 2)
    const weeks = (name: string) => plan.filter((r) => r.stops.some((s) => s.client.name === name)).map((r) => r.week)
    expect(new Set([...weeks('A'), ...weeks('B')]).size).toBe(4)
  })
})
