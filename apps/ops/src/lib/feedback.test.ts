import { describe, expect, it } from 'vitest'
import type { Feedback, Timesheet } from '../types'
import { NO_FEEDBACK_FILTERS, cleanerOptions, cleanerTotals, countVisits, feedbackCsv, filterFeedback, forVisit, overall, per100, rangeFrom } from './feedback'

let n = 0
const who = (name: string) => ({ id: name.toLowerCase(), name })
function entry(type: Feedback['type'], cleaners: string[], over: Partial<Feedback> = {}): Feedback {
  return {
    id: `f${++n}`, type, date: '2026-10-05', visitStart: null, visitEnd: null, timesheetIds: [], clientKey: null, clientName: 'Harper Residence', siteName: null,
    cleaners: cleaners.map(who), text: 'Lovely job', source: 'Phone', category: 'Quality', status: type === 'complaint' ? 'open' : null, resolution: null,
    createdAt: 1, createdBy: 'boss@example.com', updatedAt: null, updatedBy: null, ...over,
  }
}

const entries = [
  entry('kudos', ['Maya', 'Jonah'], { timesheetIds: ['t1', 't2'] }),
  entry('complaint', ['Maya', 'Jonah'], { text: 'Missed the mirror', timesheetIds: ['t3'] }),
  entry('complaint', ['jonah'], { status: 'resolved', resolution: 'Went back Tuesday', category: 'Punctuality', clientName: 'Lakeview Dental', siteName: 'Annex' }),
  entry('kudos', ['Priya'], { clientName: 'Lakeview Dental', source: 'Email' }),
  entry('kudos', [], { text: 'Great company' }),
]

describe('counting', () => {
  it('counts an entry once for each cleaner on it', () => {
    expect(cleanerTotals(entries)).toEqual([
      { id: 'jonah', name: 'Jonah', kudos: 1, complaints: 2, open: 1 },
      { id: 'maya', name: 'Maya', kudos: 1, complaints: 1, open: 1 },
      { id: 'priya', name: 'Priya', kudos: 1, complaints: 0, open: 0 },
    ])
  })

  it('counts each entry once overall, including ones with no cleaner', () => {
    expect(overall(entries)).toEqual({ kudos: 3, complaints: 2, open: 1 })
    expect(overall([])).toEqual({ kudos: 0, complaints: 0, open: 0 })
  })

  it('lists the cleaners to filter by', () => {
    expect(cleanerOptions(entries).map((c) => c.name)).toEqual(['Jonah', 'Maya', 'Priya'])
  })
})

describe('filtering', () => {
  const texts = (f: Partial<typeof NO_FEEDBACK_FILTERS>) => filterFeedback(entries, { ...NO_FEEDBACK_FILTERS, ...f }).length
  it('filters by type, cleaner, category, status and search', () => {
    expect(texts({})).toBe(5)
    expect(texts({ type: 'complaint' })).toBe(2)
    expect(texts({ cleanerId: 'maya' })).toBe(2)
    expect(texts({ category: 'Punctuality' })).toBe(1)
    expect(texts({ status: 'open' })).toBe(1)
    expect(texts({ status: 'resolved' })).toBe(1)
    expect(texts({ query: 'LAKEVIEW' })).toBe(2)
    expect(texts({ query: 'annex' })).toBe(1)
    expect(texts({ query: 'tuesday' })).toBe(1)
    expect(texts({ query: 'priya' })).toBe(1)
    expect(texts({ type: 'kudos', cleanerId: 'jonah' })).toBe(1)
    expect(texts({ query: 'nothing here' })).toBe(0)
  })
})

describe('visits, ranges and export', () => {
  it('finds the feedback recorded on a visit by its timesheets', () => {
    expect(forVisit(entries, ['t2', 't9']).map((e) => e.text)).toEqual(['Lovely job'])
    expect(forVisit(entries, ['t3']).map((e) => e.text)).toEqual(['Missed the mirror'])
    expect(forVisit(entries, [])).toEqual([])
  })

  it('counts a range back from today, inclusive', () => {
    expect(rangeFrom('2026-10-10', 30)).toBe('2026-09-11')
    expect(rangeFrom('2026-10-10', 1)).toBe('2026-10-10')
  })

  it('exports a CSV', () => {
    const lines = feedbackCsv([entries[2], entry('kudos', ['Maya'], { text: 'She said "wow", twice', clientName: '=Evil' })]).split('\r\n')
    expect(lines[0]).toContain('"Date","Type","Client","Site","Cleaners"')
    expect(lines[1]).toBe('"Mon Oct 5","Complaint","Lakeview Dental","Annex","jonah","Lovely job","Phone","Punctuality","resolved","Went back Tuesday","boss@example.com"')
    expect(lines[2]).toContain(`"'=Evil"`)
    expect(lines[2]).toContain('"She said ""wow"", twice"')
  })
})

describe('complaint rates', () => {
  const ts = (id: string, who: string, from: string, over: Partial<Timesheet> = {}): Timesheet => ({
    id, state: 'APPROVED', from, to: null, totalDuration: 60, timezone: 'America/Toronto', approvedAt: null,
    employee: { id: who, name: who }, group: null, client: { id: 'c1', name: 'Harper' }, jobSite: null, ...over,
  })
  it('counts a visit as one client on one local day, per cleaner and in total', () => {
    const v = countVisits([
      ts('a', 'maya', '2026-10-05T08:00:00-04:00'),
      ts('b', 'maya', '2026-10-05T13:00:00-04:00'), // split clock-in, same visit
      ts('c', 'jo', '2026-10-05T08:00:00-04:00'), // her partner: one visit in total
      ts('d', 'jo', '2026-10-06T02:30:00.000Z'), // 10:30 PM on the 5th in Toronto
      ts('e', 'jo', '2026-10-06T08:00:00-04:00', { client: { id: 'c2', name: 'Ives' } }),
      ts('f', 'jo', '2026-10-07T08:00:00-04:00', { state: 'REJECTED' }),
      ts('g', 'jo', '2026-10-08T08:00:00-04:00', { client: null }),
      ts('h', 'jo', '2026-10-09T08:00:00-04:00', { group: { name: 'On Call' } }),
    ])
    expect([v.total, v.byCleaner.get('maya'), v.byCleaner.get('jo')]).toEqual([2, 1, 2])
  })
  it('gives complaints per 100 visits to one place, or a dash with no visits', () => {
    expect([per100(3, 120), per100(0, 40), per100(2, 0), per100(1, undefined)]).toEqual(['2.5', '0.0', '–', '–'])
  })
})
