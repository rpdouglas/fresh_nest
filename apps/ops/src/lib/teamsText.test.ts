import { describe, expect, it } from 'vitest'
import type { Shift } from '../types'
import { buildTeamDays, siteLine } from './teams'
import { teamsDocTitle, teamsText } from './teamsText'

const person = (name: string) => ({ id: name.toLowerCase(), name })
const client = (name: string) => ({ id: name.toLowerCase(), name, clientNumber: null, phoneNumber: null, email: null })
const at = (day: number, t: string) => `2026-10-${String(day).padStart(2, '0')}T${t}:00-04:00`

function shift(id: string, start: string, end: string, over: Partial<Shift> = {}): Shift {
  return {
    id, title: null, state: 'CONFIRMED', startTime: start, endTime: end, timezone: 'America/Toronto', breakDuration: 0,
    note: null, systemNote: null, client: null, assignee: null, jobSite: null, schedule: null, group: null,
    shiftPartners: [], checklistAssignments: [], ...over,
  }
}

function team(ids: string[], who: string[], start: string, end: string, over: Partial<Shift> = {}): Shift[] {
  return ids.map((id, i) =>
    shift(id, start, end, {
      ...over,
      assignee: person(who[i]),
      shiftPartners: ids.filter((x) => x !== id).map((x) => ({ id: x, assignee: person(who[ids.indexOf(x)]) })),
    }),
  )
}

const cleaning = { name: 'Cleaning' }
const late = team(['7', '8'], ['Uma', 'Vic'], at(5, '13:00'), at(5, '16:00'), { client: client('Late Start Ltd'), group: cleaning })
late[1].startTime = at(5, '14:00')

const shifts: Shift[] = [
  shift('oc1', at(5, '09:00'), at(5, '16:00'), { assignee: person('Tom Hale'), group: { name: 'On Call' } }),
  shift('oc2', at(5, '08:00'), at(5, '16:00'), { assignee: person('Maya Okafor'), group: { name: 'On Call' }, note: 'phone only' }),
  ...team(['1', '2'], ['Priya Nair', 'Jonah Reyes'], at(5, '08:00'), at(5, '10:00'), {
    client: client('Harper Residence'),
    jobSite: { name: 'Home', address: '12 Pine St, Cornwall', note: 'Key under the mat.\nDoor code 4410.' },
    note: 'Fridge clean this visit.',
    group: cleaning,
  }),
  ...team(['3', '4'], ['Priya Nair', 'Jonah Reyes'], at(5, '10:30'), at(5, '12:00'), {
    client: client('Okonkwo Family'),
    jobSite: { name: 'Okonkwo Family', address: '48 Mill Rd, Long Sault', note: null },
    group: { name: 'Confirm' },
  }),
  shift('5', at(5, '09:00'), at(5, '10:30'), { client: client('Whitlock Residence'), assignee: person('Lena Fischer'), group: cleaning }),
  ...team(['a', 'b', 'c'], ['Ann', 'Bo', 'Cy'], at(5, '11:00'), at(5, '12:00'), { client: client('Big House') }),
  ...late,
  shift('6', at(5, '15:00'), at(5, '16:00'), { client: client('Nobody Yet') }),
  shift('9', at(5, '09:30'), at(5, '11:00'), { assignee: person('Lena Fischer'), group: cleaning }),
  shift('10', at(7, '08:00'), at(7, '16:00'), { assignee: person('Tom Hale'), group: { name: 'On Call' } }),
]

describe('teamsText', () => {
  it('writes the week as plain text in the agreed layout', () => {
    expect(teamsText('2026-10-05', buildTeamDays(shifts))).toBe(`DAILY TEAMS
Week of Mon, Oct 5 - Sun, Oct 11, 2026

MONDAY, OCTOBER 5
On call: Maya Okafor 8:00 AM - 4:00 PM (phone only)
         Tom Hale 9:00 AM - 4:00 PM

Jonah Reyes & Priya Nair
  8:00 AM - 10:00 AM    Harper Residence
      Alerts: [Door Code: 4410] [Key: under the mat]
      Site note: Key under the mat.
                 Door code 4410.
      Shift note: Fridge clean this visit.
  10:30 AM - 12:00 PM   Okonkwo Family

Lena Fischer (solo)
  9:00 AM - 10:30 AM    Whitlock Residence

Ann & Bo & Cy
  11:00 AM - 12:00 PM   Big House

Uma & Vic
  1:00 PM - 4:00 PM     Late Start Ltd
      Times: Uma 1:00 PM - 4:00 PM; Vic 2:00 PM - 4:00 PM

Unassigned
  3:00 PM - 4:00 PM     Nobody Yet

Also booked: Lena Fischer 9:30 AM - 11:00 AM

WEDNESDAY, OCTOBER 7
On call: Tom Hale 8:00 AM - 4:00 PM
`)
  })

  it('leaves out job site, address and position, which the screen still has', () => {
    const days = buildTeamDays(shifts)
    const text = teamsText('2026-10-05', days)
    for (const hidden of ['12 Pine St', 'Mill Rd', 'Home', '[Cleaning]', '[Confirm]']) expect(text).not.toContain(hidden)
    const harper = days[0].teams.flatMap((t) => t.visits).find((v) => v.title === 'Harper Residence')!
    expect(siteLine(harper, ', ')).toBe('Home, 12 Pine St, Cornwall')
    expect(harper.positions).toEqual(['Cleaning'])
  })

  it('uses only plain characters', () => {
    expect(teamsText('2026-10-05', buildTeamDays(shifts))).toMatch(/^[\x20-\x7e\n]*$/)
  })

  it('formats assigned checklists with completion percentage', () => {
    const s = shift('1', at(5, '08:00'), at(5, '10:00'), {
      client: client('Harper Residence'),
      assignee: person('Jonah Reyes'),
      group: cleaning,
      checklistAssignments: [
        { completionPercentage: 100, checklist: { name: 'Turnover Checklist' } },
        { completionPercentage: null, checklist: { name: 'Deep Clean Scope' } },
      ],
    })
    const text = teamsText('2026-10-05', buildTeamDays([s]))
    expect(text).toContain('      Checklist: Turnover Checklist (100%), Deep Clean Scope')
    expect(text).toMatch(/^[\x20-\x7e\n]*$/)
  })

  it('says so when the week is empty, and titles the document by week', () => {
    expect(teamsText('2026-10-05', [])).toContain('No shifts scheduled.')
    expect(teamsDocTitle('2026-10-05')).toBe('Daily teams - Oct 5-11, 2026')
    expect(teamsDocTitle('2026-09-28')).toBe('Daily teams - Sep 28-Oct 4, 2026')
  })
})
