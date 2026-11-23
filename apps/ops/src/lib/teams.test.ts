import { describe, expect, it } from 'vitest'
import type { Shift } from '../types'
import { buildTeamDays, dateParts, initials, mergeVisits, weekStrip } from './teams'

const person = (name: string) => ({ id: name.toLowerCase(), name })
const client = (name: string) => ({ id: name.toLowerCase(), name, clientNumber: null, phoneNumber: null, email: null })
const site = (name: string, note: string | null = null) => ({ name, address: null, note })

function shift(id: string, start: string, end: string, over: Partial<Shift> = {}): Shift {
  return {
    id,
    title: null,
    state: 'CONFIRMED',
    startTime: start,
    endTime: end,
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

/** Two shifts that point at each other, the way Camelo returns a paired visit. */
function pair(ids: [string, string], who: [string, string], start: string, end: string, over: Partial<Shift> = {}): Shift[] {
  const [a, b] = who.map(person)
  return [
    shift(ids[0], start, end, { ...over, assignee: a, shiftPartners: [{ id: ids[1], assignee: b }] }),
    shift(ids[1], start, end, { ...over, assignee: b, shiftPartners: [{ id: ids[0], assignee: a }] }),
  ]
}

const mon = (t: string) => `2026-10-05T${t}:00-04:00`
const tue = (t: string) => `2026-10-06T${t}:00-04:00`

describe('mergeVisits', () => {
  it('turns a pair of partner shifts into one visit with cleaners in name order', () => {
    const { visits } = mergeVisits(pair(['1', '2'], ['Sam', 'Alex'], mon('08:00'), mon('10:00'), { client: client('Smith') }))
    expect(visits).toHaveLength(1)
    expect(visits[0].staff.map((p) => p.name)).toEqual(['Alex', 'Sam'])
    expect(visits[0].title).toBe('Smith')
    expect(visits[0].ownTimes).toBeNull()
  })

  it('merges a team of three', () => {
    const [a, b, c] = ['Alex', 'Bo', 'Cy'].map(person)
    const over = { client: client('Smith') }
    const { visits } = mergeVisits([
      shift('1', mon('08:00'), mon('10:00'), { ...over, assignee: a, shiftPartners: [{ id: '2', assignee: b }, { id: '3', assignee: c }] }),
      shift('2', mon('08:00'), mon('10:00'), { ...over, assignee: b, shiftPartners: [{ id: '1', assignee: a }] }),
      shift('3', mon('08:00'), mon('10:00'), { ...over, assignee: c, shiftPartners: [{ id: '1', assignee: a }] }),
    ])
    expect(visits).toHaveLength(1)
    expect(visits[0].staff.map((p) => p.name)).toEqual(['Alex', 'Bo', 'Cy'])
  })

  it('keeps both notes when partners have different ones, and one copy when they match', () => {
    const [x, y] = pair(['1', '2'], ['Alex', 'Sam'], mon('08:00'), mon('10:00'), { client: client('Smith'), jobSite: site('Home', ' Key under mat ') })
    x.note = 'Fridge clean'
    y.note = 'Bring ladder'
    const diff = mergeVisits([x, y]).visits[0]
    expect(diff.shiftNotes).toEqual(['Fridge clean', 'Bring ladder'])
    expect(diff.siteNote).toBe('Key under mat')
    y.note = 'Fridge clean'
    expect(mergeVisits([x, y]).visits[0].shiftNotes).toEqual(['Fridge clean'])
    x.note = 'key  under\nMAT'
    expect(mergeVisits([x, y]).visits[0].shiftNotes).toEqual(['Fridge clean'])
  })

  it('parses property security and hazard alerts from site and shift notes', () => {
    const [x, y] = pair(['1', '2'], ['Alex', 'Sam'], mon('08:00'), mon('10:00'), {
      client: client('Smith'),
      jobSite: site('Home', 'Lockbox 1234 on porch railing. Alarm code: 5678.'),
    })
    x.note = 'Friendly dog in crate.'
    const v = mergeVisits([x, y]).visits[0]
    expect(v.alerts?.hasSecurity).toBe(true)
    expect(v.alerts?.hasHazard).toBe(true)
    expect(v.alerts?.badges.map((b) => b.kind)).toEqual(['lockbox', 'alarm', 'dog'])
  })

  it('aggregates and deduplicates assigned checklists across partners', () => {
    const [x, y] = pair(['1', '2'], ['Alex', 'Sam'], mon('08:00'), mon('10:00'), { client: client('Smith') })
    x.checklistAssignments = [
      { completionPercentage: 80, checklist: { name: 'Turnover Checklist' } },
      { completionPercentage: null, checklist: { name: 'Deep Clean Scope' } },
    ]
    y.checklistAssignments = [
      { completionPercentage: 100, checklist: { name: 'Turnover Checklist' } },
    ]
    const v = mergeVisits([x, y]).visits[0]
    expect(v.checklists).toEqual([
      { name: 'Turnover Checklist', completionPercentage: 100 },
      { name: 'Deep Clean Scope', completionPercentage: null },
    ])
  })

  it('leaves checklists undefined when none are assigned', () => {
    const [x, y] = pair(['1', '2'], ['Alex', 'Sam'], mon('08:00'), mon('10:00'), { client: client('Smith') })
    const v = mergeVisits([x, y]).visits[0]
    expect(v.checklists).toBeUndefined()
  })

  it('spans the earliest start to the latest end and lists own times when partners differ', () => {
    const [x, y] = pair(['1', '2'], ['Alex', 'Sam'], mon('08:00'), mon('16:00'), { client: client('Smith') })
    y.startTime = mon('09:00')
    const v = mergeVisits([y, x]).visits[0]
    expect([v.start, v.end]).toEqual([mon('08:00'), mon('16:00')])
    expect(v.ownTimes?.map((t) => [t.person.name, t.start])).toEqual([
      ['Alex', mon('08:00')],
      ['Sam', mon('09:00')],
    ])
  })

  it('still names the partner when their shift was filtered out', () => {
    const [x] = pair(['1', '2'], ['Alex', 'Sam'], mon('08:00'), mon('10:00'), { client: client('Smith') })
    expect(mergeVisits([x]).visits[0].staff.map((p) => p.name)).toEqual(['Alex', 'Sam'])
  })

  it('carries positions onto the visit, once when partners agree', () => {
    const [x, y] = pair(['1', '2'], ['Alex', 'Sam'], mon('08:00'), mon('10:00'), { client: client('Smith'), group: { name: 'Cleaning' } })
    expect(mergeVisits([x, y]).visits[0].positions).toEqual(['Cleaning'])
    y.group = { name: 'Confirm' }
    expect(mergeVisits([x, y]).visits[0].positions).toEqual(['Cleaning', 'Confirm'])
  })

  it('uses the job site name when there is no client, and treats shifts with neither as blocks', () => {
    const { visits, blocks } = mergeVisits([
      shift('1', mon('08:00'), mon('09:00'), { assignee: person('Alex'), jobSite: site('Depot') }),
      shift('2', mon('09:00'), mon('16:00'), { assignee: person('Sam') }),
    ])
    expect(visits.map((v) => v.title)).toEqual(['Depot'])
    expect(blocks.map((b) => b.person?.name)).toEqual(['Sam'])
  })
})

describe('buildTeamDays', () => {
  const shifts = [
    ...pair(['1', '2'], ['Alex', 'Sam'], mon('10:30'), mon('12:00'), { client: client('Okon') }),
    ...pair(['3', '4'], ['Alex', 'Sam'], mon('08:00'), mon('10:00'), { client: client('Smith') }),
    ...pair(['5', '6'], ['Priya', 'Tom'], mon('07:00'), mon('09:00'), { client: client('Birch') }),
    shift('7', mon('06:00'), mon('07:00'), { client: client('Late') }),
    shift('8', mon('09:00'), mon('10:00'), { client: client('Solo'), assignee: person('Lena') }),
    ...pair(['9', '10'], ['Alex', 'Tom'], tue('08:00'), tue('10:00'), { client: client('Smith') }),
    shift('11', tue('03:30').replace('-04:00', 'Z'), tue('05:00').replace('-04:00', 'Z'), { client: client('Night'), assignee: person('Lena') }),
  ]
  const days = buildTeamDays(shifts)

  it('groups by day, then by team, ordered by first start with unassigned last', () => {
    expect(days.map((d) => d.key)).toEqual(['2026-10-05', '2026-10-06'])
    expect(days[0].teams.map((t) => t.cleaners.map((p) => p.name).join(' & ') || 'Unassigned')).toEqual([
      'Priya & Tom',
      'Alex & Sam',
      'Lena',
      'Unassigned',
    ])
  })

  it('orders a team\'s visits by time and reports its span', () => {
    const team = days[0].teams.find((t) => t.key === 'alex+sam')!
    expect(team.visits.map((v) => v.title)).toEqual(['Smith', 'Okon'])
    expect([team.start, team.end]).toEqual([mon('08:00'), mon('12:00')])
  })

  it('files a late-evening visit under its local day and counts visits, not shifts', () => {
    // 03:30Z on the 6th is 11:30 PM on the 5th in Toronto
    expect(days[0].teams.find((t) => t.key === 'lena')!.visits.map((v) => v.title)).toEqual(['Solo', 'Night'])
    expect(days[0].visitCount).toBe(6)
    expect(days[1].visitCount).toBe(1)
  })

  it('fills the week strip, including empty days', () => {
    const strip = weekStrip('2026-10-05', days)
    expect(strip.map((d) => d.visits)).toEqual([6, 1, 0, 0, 0, 0, 0])
    expect(strip[6].key).toBe('2026-10-11')
  })
})

describe('on call', () => {
  const days = buildTeamDays([
    shift('1', mon('09:00'), mon('16:00'), { assignee: person('Sam'), group: { name: 'On Call' } }),
    shift('2', mon('08:00'), mon('16:00'), { assignee: person('Alex'), group: { name: 'On Call' } }),
    shift('3', mon('09:30'), mon('11:00'), { assignee: person('Lena'), group: { name: 'Cleaning' } }),
    shift('4', mon('10:00'), mon('11:00'), { assignee: person('Tom'), group: { name: 'On Call' }, client: client('Smith') }),
    shift('5', tue('08:00'), tue('16:00'), { assignee: person('Alex'), group: { name: 'On Call' } }),
  ])

  it('separates on-call cleaners from other shifts with no client or job site', () => {
    expect(days[0].onCall.map((b) => b.person?.name)).toEqual(['Alex', 'Sam'])
    expect(days[0].blocks.map((b) => [b.person?.name, b.position])).toEqual([['Lena', 'Cleaning']])
  })

  it('keeps an on-call shift that has a client as a normal visit', () => {
    expect(days[0].teams.map((t) => t.visits[0].positions)).toEqual([['On Call']])
    expect(days[0].visitCount).toBe(1)
  })

  it('still shows a day that only has on-call cover, and counts it in the strip', () => {
    expect([days[1].teams.length, days[1].onCall.length]).toEqual([0, 1])
    expect(weekStrip('2026-10-05', days).slice(0, 3).map((d) => d.onCall)).toEqual([2, 1, 0])
  })
})

describe('labels', () => {
  it('formats date parts and initials', () => {
    expect(dateParts('2026-10-05')).toEqual({ day: '05', weekday: 'Monday', short: 'Mon 5', month: 'October 2026' })
    expect(initials('Maya Okafor')).toBe('MO')
    expect(initials('Mary Jane van Dyke')).toBe('MD')
    expect(initials('Cher')).toBe('C')
    expect(initials(null)).toBe('?')
  })
})
