import { describe, expect, it } from 'vitest'
import type { Shift } from '../types'
import { NO_FILTERS, filterOptions, filterShifts, groupByClient, groupByStaff, isOnCall, notOnCall, stats } from './schedule'
import { addDays, isValidDate, mondayOf, todayIn, weekLabel } from './week'

const person = (name: string) => ({ id: name.toLowerCase(), name })
const client = (name: string) => ({ id: name.toLowerCase(), name, clientNumber: null, phoneNumber: null, email: null })

function shift(id: string, start: string, over: Partial<Shift> = {}): Shift {
  return {
    id,
    title: 'Standard clean',
    state: 'SCHEDULED',
    startTime: start,
    endTime: start,
    timezone: 'America/Toronto',
    breakDuration: 0,
    note: null,
    systemNote: null,
    client: null,
    assignee: null,
    jobSite: null,
    schedule: null,
    group: null,
    shiftPartners: [],
    checklistAssignments: [],
    ...over,
  }
}

const shifts = [
  shift('1', '2026-10-07T09:00:00-04:00', {
    client: client('Smith'),
    assignee: person('Alex'),
    shiftPartners: [{ id: 'p', assignee: person('Sam') }],
    note: 'Friendly dog',
  }),
  shift('2', '2026-10-05T09:00:00-04:00', { client: client('Smith') }),
  shift('3', '2026-10-06T18:00:00-04:00', { client: client('abbey Dental'), assignee: person('Sam') }),
  shift('4', '2026-10-06T08:00:00-04:00'),
]

describe('week helpers', () => {
  it('finds the Monday, including across a year boundary and on Sundays', () => {
    expect(mondayOf('2026-10-10')).toBe('2026-10-05')
    expect(mondayOf('2026-10-11')).toBe('2026-10-05')
    expect(mondayOf('2026-10-05')).toBe('2026-10-05')
    expect(mondayOf('2027-01-01')).toBe('2026-12-28')
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04')
  })

  it('uses the Toronto date, not the UTC date', () => {
    expect(todayIn('America/Toronto', new Date('2026-10-12T02:00:00Z'))).toBe('2026-10-11')
  })

  it('validates and labels', () => {
    expect(isValidDate('2026-02-31')).toBe(false)
    expect(isValidDate(null)).toBe(false)
    expect(weekLabel('2026-10-05')).toBe('Mon, Oct 5 – Sun, Oct 11, 2026')
  })
})

describe('grouping', () => {
  it('groups by client, sorted by name with no-client last and days in order', () => {
    const g = groupByClient(shifts)
    expect(g.map((x) => x.title)).toEqual(['abbey Dental', 'Smith', 'No client attached'])
    expect(g[1].days.map((d) => d.label)).toEqual(['Monday, Oct 5', 'Wednesday, Oct 7'])
  })

  it('groups by assignee only, since partners have their own shift records', () => {
    const g = groupByStaff(shifts)
    expect(g.map((x) => [x.title, x.count])).toEqual([
      ['Alex', 1],
      ['Sam', 1],
      ['Unassigned', 2],
    ])
  })

  it('files a late-evening shift under its local day', () => {
    const g = groupByClient([shift('x', '2026-10-06T02:30:00Z', { client: client('Smith') })])
    expect(g[0].days[0].label).toBe('Monday, Oct 5')
  })

  it('counts stats', () => {
    expect(stats(shifts)).toEqual({ shifts: 4, clients: 2, staff: 2, unassigned: 2 })
  })
})

describe('filtering', () => {
  const ids = (f: Partial<typeof NO_FILTERS>) => filterShifts(shifts, { ...NO_FILTERS, ...f }).map((s) => s.id)

  it('filters by client, assignee and unassigned', () => {
    expect(ids({ clientId: 'smith' })).toEqual(['1', '2'])
    expect(ids({ staffId: 'sam' })).toEqual(['3'])
    expect(ids({ unassignedOnly: true })).toEqual(['2', '4'])
  })

  it('filters, lists and searches by position', () => {
    const withPos = [
      { ...shifts[0], group: { name: ' Cleaning ' } },
      { ...shifts[1], group: { name: 'On Call' } },
      { ...shifts[2], group: { name: '' } },
      shifts[3],
    ]
    const pick = (f: Partial<typeof NO_FILTERS>) => filterShifts(withPos, { ...NO_FILTERS, ...f }).map((s) => s.id)
    expect(pick({ position: 'Cleaning' })).toEqual(['1'])
    expect(pick({ query: 'on call' })).toEqual(['2'])
    expect(filterOptions(withPos).positions).toEqual([
      { id: 'Cleaning', name: 'Cleaning' },
      { id: 'On Call', name: 'On Call' },
    ])
    expect([isOnCall('on-call'), isOnCall('ON CALL'), isOnCall('Cleaning'), isOnCall(null)]).toEqual([true, true, false, false])
    expect(withPos.filter(notOnCall).map((s) => s.id)).toEqual(['1', '3', '4'])
  })

  it('searches names and notes, ignoring case', () => {
    expect(ids({ query: 'DENTAL' })).toEqual(['3'])
    expect(ids({ query: ' dog ' })).toEqual(['1'])
    expect(ids({ query: 'sam', clientId: 'smith' })).toEqual(['1'])
  })
})
