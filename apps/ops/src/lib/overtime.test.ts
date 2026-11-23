import { describe, expect, it } from 'vitest'
import type { ReviewSheet, ReviewShift } from '../types'
import { overtime } from './overtime'

const person = (name: string) => ({ id: name.toLowerCase(), name })
const at = (day: number, hm: string) => `2026-10-${String(day).padStart(2, '0')}T${hm}:00-04:00`

function shift(id: string, who: string, day: number, start: string, end: string, over: Partial<ReviewShift> = {}): ReviewShift {
  return {
    id, state: 'SCHEDULED', startTime: at(day, start), endTime: at(day, end), timezone: 'America/Toronto', breakDuration: 0,
    client: { id: 'c1', name: 'Harper' }, assignee: person(who), jobSite: null, group: { id: 'g1', name: 'Cleaning' }, ...over,
  }
}
function sheet(id: string, who: string, day: number, start: string, minutes: number, over: Partial<ReviewSheet> = {}): ReviewSheet {
  const from = at(day, start)
  return {
    id, state: 'SUBMITTED', from, to: new Date(Date.parse(from) + minutes * 60_000).toISOString(), totalDuration: minutes, timezone: 'America/Toronto', approvedAt: null,
    employee: person(who), group: { name: 'Cleaning' }, client: null, jobSite: null, referenceObject: { __typename: 'TimeCard', shiftId: null }, ...over,
  }
}
// Five 9-hour days logged, Fri Oct 2 to Tue Oct 6.
const fiveDays = (who: string) => [2, 3, 4, 5, 6].map((d) => sheet(`${who}${d}`, who, d, '08:00', 9 * 60))
const WED_NOON = Date.parse(at(7, '12:00'))

describe('overtime warning', () => {
  it('flags someone already past 44 hours as over', () => {
    const rows = overtime(fiveDays('Maya'), [], WED_NOON)
    expect(rows).toEqual([{ key: 'maya', name: 'Maya', worked: 2700, toCome: 0, projected: 2700, level: 'over' }])
  })

  it('projects with the shifts still to come: whole if not started, the rest if under way', () => {
    const logged = [2, 3, 4, 5].map((d) => sheet(`j${d}`, 'Jo', d, '08:00', 9 * 60))
    const rows = overtime(logged, [shift('a', 'Jo', 7, '10:00', '16:00'), shift('b', 'Jo', 8, '08:00', '12:30', { breakDuration: 30 })], WED_NOON)
    // 36 h worked, 4 h left of Wednesday's shift, 4 h on Thursday
    expect(rows[0]).toMatchObject({ worked: 2160, toCome: 480, projected: 2640, level: 'near' })
    const more = overtime(logged, [shift('a', 'Jo', 7, '10:00', '17:00'), shift('b', 'Jo', 8, '08:00', '12:30', { breakDuration: 30 })], WED_NOON)
    expect(more[0].level).toBe('on-course')
  })

  it('counts an open clock-in up to now, and leaves out rejected entries, leave, On Call and finished shifts', () => {
    const rows = overtime(
      [
        ...[2, 3, 4, 5].map((d) => sheet(`c${d}`, 'Cy', d, '08:00', 9 * 60)),
        sheet('open', 'Cy', 7, '08:00', 0, { to: null, totalDuration: null }),
        sheet('no', 'Cy', 6, '08:00', 600, { state: 'REJECTED' }),
        sheet('leave', 'Cy', 6, '08:00', 480, { referenceObject: { __typename: 'LeaveRequest' } }),
      ],
      [shift('oc', 'Cy', 8, '08:00', '18:00', { group: { name: 'On Call' } }), shift('done', 'Cy', 6, '08:00', '17:00')],
      WED_NOON,
    )
    expect(rows[0]).toMatchObject({ worked: 2160 + 240, toCome: 0, level: 'near' })
  })

  it('adds up the shifts still to come and nothing for the time between them', () => {
    // 40 hours worked; tomorrow two 2-hour visits twelve hours apart: 4 hours to come, not 14
    const worked = [2, 3, 4, 5].map((d) => sheet(`w${d}`, 'Maya', d, '08:00', 10 * 60))
    const toCome = [shift('m', 'Maya', 7, '07:00', '09:00'), shift('e', 'Maya', 7, '19:00', '21:00')]
    const [row] = overtime(worked, toCome, Date.parse(at(6, '12:00')))
    expect([row.worked, row.toCome, row.projected, row.level]).toEqual([40 * 60, 4 * 60, 44 * 60, 'near'])
  })

  it('lists nobody under 40 hours, and the most hours first', () => {
    const rows = overtime([...fiveDays('Maya'), ...fiveDays('Ana').slice(0, 4), sheet('x', 'Ana', 6, '08:00', 300), sheet('s', 'Sam', 2, '08:00', 600)], [], WED_NOON)
    expect(rows.map((r) => [r.name, r.level])).toEqual([['Maya', 'over'], ['Ana', 'near']])
  })
})
