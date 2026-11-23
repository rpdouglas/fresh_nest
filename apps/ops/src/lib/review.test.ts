import { describe, expect, it } from 'vitest'
import type { ReviewResponse, ReviewSheet, ReviewShift } from '../types'
import { buildReview, decimal, scheduledMinutes, signed } from './review'

const person = (name: string) => ({ id: name.toLowerCase(), name })
const at = (day: number, hm: string) => `2026-10-${String(day).padStart(2, '0')}T${hm}:00-04:00`
const client = (name: string) => ({ id: `c-${name.toLowerCase()}`, name })

function shift(id: string, who: string | null, day: number, start: string, end: string, over: Partial<ReviewShift> = {}): ReviewShift {
  return {
    id, state: 'FINISHED', startTime: at(day, start), endTime: at(day, end), timezone: 'America/Toronto', breakDuration: 0,
    client: client('Harper'), assignee: who ? person(who) : null, jobSite: { id: 's1', name: 'Home', address: '12 Pine St' }, group: { id: 'g1', name: 'Cleaning' }, ...over,
  }
}
function sheet(id: string, who: string, day: number, start: string, minutes: number, shiftId: string | null, over: Partial<ReviewSheet> = {}): ReviewSheet {
  const from = at(day, start)
  return {
    id, state: 'SUBMITTED', from, to: new Date(Date.parse(from) + minutes * 60_000).toISOString(), totalDuration: minutes, timezone: 'America/Toronto', approvedAt: null,
    employee: person(who), group: { name: 'Cleaning' }, client: client('Harper'), jobSite: { id: 's1', name: 'Home' }, comments: 1,
    referenceObject: shiftId ? { shiftId } : null, ...over,
  }
}
const data = (timesheets: ReviewSheet[], shifts: ReviewShift[], otherShifts: ReviewShift[] = []): ReviewResponse => ({ periodStart: '2026-10-02', from: '', to: '', timesheets, shifts, otherShifts })
const LATER = Date.parse('2026-10-20T12:00:00-04:00')

describe('scheduled against actual', () => {
  it('compares a timesheet with the shift it was clocked against', () => {
    const r = buildReview(data([sheet('t1', 'Maya', 5, '08:02', 123, 'a')], [shift('a', 'Maya', 5, '08:00', '10:00')]), LATER).rows[0]
    expect([r.match, r.scheduledMinutes, r.actualMinutes, r.variance, r.off]).toEqual(['linked', 120, 123, 3, false])
    expect([r.clientName, r.siteName]).toEqual(['Harper', 'Home'])
    expect([decimal(120), decimal(123), signed(3)]).toEqual(['2.00', '2.05', '+0.05'])
  })

  it('flags a variance of more than 15 minutes either way, and takes the break off the scheduled time', () => {
    const shifts = [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Jo', 5, '08:00', '10:00'), shift('c', 'Cy', 5, '08:00', '12:30', { breakDuration: 30 })]
    const rows = buildReview(data([sheet('t1', 'Maya', 5, '08:00', 195, 'a'), sheet('t2', 'Jo', 5, '08:00', 104, 'b'), sheet('t3', 'Cy', 5, '08:00', 255, 'c')], shifts), LATER).rows
    expect(rows.map((r) => [r.sheet.id, r.variance, r.off])).toEqual([['t1', 75, true], ['t2', -16, true], ['t3', 15, false]])
    expect(scheduledMinutes(shifts[2])).toBe(240)
    expect([signed(75), signed(-16), signed(0)]).toEqual(['+1.25', '-0.27', '0.00'])
  })

  it('falls back to the overlapping shift of the same person, and to nothing when there is none', () => {
    const shifts = [shift('a', 'Maya', 5, '08:00', '10:00'), shift('b', 'Maya', 5, '13:00', '15:00'), shift('c', 'Jo', 5, '09:00', '11:00')]
    const rows = buildReview(data([sheet('t1', 'Maya', 5, '13:10', 100, null), sheet('t2', 'Maya', 6, '09:00', 60, null), sheet('t3', 'Maya', 5, '09:50', 200, null)], shifts), LATER).rows
    const by = Object.fromEntries(rows.map((r) => [r.sheet.id, [r.match, r.shift?.id ?? null, r.variance]]))
    expect(by.t1).toEqual(['overlap', 'b', -20])
    expect(by.t2).toEqual([null, null, null])
    // 9:50-13:10 overlaps both of Maya's shifts by ten minutes; either is acceptable, but never Jo's
    expect(by.t3[0]).toBe('overlap')
    expect(['a', 'b']).toContain(by.t3[1])
  })

  it('uses a shift from outside the period when the timesheet points at it', () => {
    const r = buildReview(data([sheet('t1', 'Maya', 2, '00:05', 60, 'x')], [], [shift('x', 'Maya', 1, '23:30', '23:59')]), LATER).rows[0]
    expect([r.match, r.shift?.id]).toEqual(['linked', 'x'])
  })

  it('lists only unapproved timesheets, by day, with totals', () => {
    const sheets = [sheet('t1', 'Maya', 6, '08:00', 60, null), sheet('t2', 'Jo', 5, '09:00', 90, null, { state: 'DRAFT' }), sheet('t3', 'Cy', 5, '08:00', 30, null, { state: 'REJECTED' }), sheet('t4', 'Di', 5, '08:00', 500, null, { state: 'APPROVED' })]
    const r = buildReview(data(sheets, []), LATER)
    expect(r.days.map((d) => [d.date, d.rows.map((x) => x.sheet.id)])).toEqual([['2026-10-05', ['t3', 't2']], ['2026-10-06', ['t1']]])
    expect([r.rows.length, r.waitingMinutes, r.offCount]).toEqual([3, 180, 0])
  })

  it('names the client from the shift or the job site when the timesheet has none', () => {
    const noClient = sheet('t1', 'Maya', 5, '08:00', 60, 'a', { client: null, jobSite: null })
    expect(buildReview(data([noClient], [shift('a', 'Maya', 5, '08:00', '09:00')]), LATER).rows[0].clientName).toBe('Harper')
    const siteOnly = sheet('t2', 'Maya', 5, '08:00', 60, null, { client: null, jobSite: { name: 'Depot' } })
    expect(buildReview(data([siteOnly], []), LATER).rows[0]).toMatchObject({ clientName: 'Depot', siteName: null })
    expect(buildReview(data([sheet('t3', 'Maya', 5, '08:00', 60, null, { client: null, jobSite: null })], []), LATER).rows[0].clientName).toBe('No client')
  })
})

describe('On Call', () => {
  it('is never the shift a timesheet is measured against', () => {
    const shifts = [shift('oncall', 'Maya', 5, '00:00', '23:59', { client: null, jobSite: null, group: { name: 'On Call' } }), shift('a', 'Maya', 5, '13:00', '15:00')]
    const rows = buildReview(data([sheet('t1', 'Maya', 5, '13:10', 100, null), sheet('t2', 'Maya', 5, '08:00', 60, null)], shifts), LATER).rows
    expect(rows.map((r) => [r.sheet.id, r.shift?.id ?? null])).toEqual([['t2', null], ['t1', 'a']])
  })
})

describe('scheduled but no timesheet', () => {
  const shifts = [
    shift('linked', 'Maya', 5, '08:00', '10:00'),
    shift('covered', 'Jo', 5, '08:00', '10:00'),
    shift('missing', 'Cy', 5, '08:00', '10:00'),
    shift('unassigned', null, 5, '08:00', '10:00'),
    shift('oncall', 'Di', 5, '08:00', '16:00', { client: null, jobSite: null, group: { name: 'On Call' } }),
    shift('later', 'Cy', 8, '08:00', '10:00'),
    shift('siteonly', 'Di', 6, '08:00', '10:00', { client: null }),
  ]
  const sheets = [sheet('t1', 'Maya', 5, '08:02', 118, 'linked', { state: 'APPROVED' }), sheet('t2', 'Jo', 5, '08:30', 60, null), sheet('t3', 'Cy', 5, '13:00', 60, null)]

  it('finds shifts that ended with someone assigned, somewhere to be, and no timesheet', () => {
    const now = Date.parse(at(7, '12:00'))
    expect(buildReview(data(sheets, shifts), now).missing.map((s) => s.id)).toEqual(['missing', 'siteonly'])
  })

  it('counts a shift only once it has ended', () => {
    expect(buildReview(data(sheets, shifts), Date.parse(at(5, '09:00'))).missing).toEqual([])
    expect(buildReview(data(sheets, shifts), Date.parse(at(9, '12:00'))).missing.map((s) => s.id)).toEqual(['missing', 'siteonly', 'later'])
  })

  it('stops listing a shift once a timesheet is added for it', () => {
    const added = sheet('t4', 'Cy', 5, '08:00', 120, null, { state: 'DRAFT' })
    const r = buildReview(data([...sheets, added], shifts), Date.parse(at(7, '12:00')))
    expect(r.missing.map((s) => s.id)).toEqual(['siteonly'])
    expect(r.rows.find((x) => x.sheet.id === 't4')).toMatchObject({ match: 'overlap', variance: 0 })
  })
})

describe('incomplete checklists', () => {
  it('flags a shift with an incomplete checklist (<100%) and counts it', () => {
    const s1 = shift('s1', 'Maya', 5, '08:00', '10:00', {
      checklistAssignments: [{ completionPercentage: 50, checklist: { name: 'Turnover Checklist' } }],
    })
    const s2 = shift('s2', 'Jo', 5, '08:00', '10:00', {
      checklistAssignments: [{ completionPercentage: 100, checklist: { name: 'Turnover Checklist' } }],
    })
    const t1 = sheet('t1', 'Maya', 5, '08:00', 120, 's1')
    const t2 = sheet('t2', 'Jo', 5, '08:00', 120, 's2')
    const r = buildReview(data([t1, t2], [s1, s2]), LATER)
    expect(r.incompleteCount).toBe(1)
    const row1 = r.rows.find((x) => x.sheet.id === 't1')!
    const row2 = r.rows.find((x) => x.sheet.id === 't2')!
    expect(row1.incompleteChecklists).toEqual([{ name: 'Turnover Checklist', completionPercentage: 50 }])
    expect(row2.incompleteChecklists).toEqual([])
  })

  it('flags null or 0% completion as incomplete', () => {
    const s = shift('s1', 'Maya', 5, '08:00', '10:00', {
      checklistAssignments: [
        { completionPercentage: null, checklist: { name: 'Deep Clean' } },
        { completionPercentage: 0, checklist: { name: 'Inspection' } },
      ],
    })
    const t = sheet('t1', 'Maya', 5, '08:00', 120, 's1')
    const r = buildReview(data([t], [s]), LATER)
    expect(r.incompleteCount).toBe(1)
    expect(r.rows[0].incompleteChecklists).toEqual([
      { name: 'Deep Clean', completionPercentage: null },
      { name: 'Inspection', completionPercentage: 0 },
    ])
  })

  it('preserves checklist assignments when matched by time overlap', () => {
    const s = shift('s1', 'Maya', 5, '08:00', '10:00', {
      checklistAssignments: [{ completionPercentage: 75, checklist: { name: 'Turnover' } }],
    })
    const t = sheet('t1', 'Maya', 5, '08:05', 115, null)
    const r = buildReview(data([t], [s]), LATER)
    expect(r.rows[0].match).toBe('overlap')
    expect(r.rows[0].incompleteChecklists).toEqual([{ name: 'Turnover', completionPercentage: 75 }])
    expect(r.incompleteCount).toBe(1)
  })
})
