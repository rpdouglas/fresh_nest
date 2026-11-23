import { describe, expect, it } from 'vitest'
import type { ClientRate, RateRule, Timesheet } from '../types'
import { buildClientHours, clientHoursCsv, clientHoursOptions, linkSites } from './clientHours'
import { DEFAULT_PRICE, money, priceFor, priceText, visitAmount } from './billing'
import { hours } from './payroll'
import { NO_FILTERS } from './schedule'

let n = 0
const person = (name: string) => ({ id: name.toLowerCase(), name })
const client = (name: string) => ({ id: `c-${name.toLowerCase()}`, name })
const site = (name: string, id = `s-${name.toLowerCase()}`) => ({ id, name, address: `${name} Rd` })
/** A timesheet starting at a Toronto local time on an October 2026 day. */
function sheet(who: string, day: number, start: string, minutes: number, over: Partial<Timesheet> = {}): Timesheet {
  const from = `2026-10-${String(day).padStart(2, '0')}T${start}:00-04:00`
  return {
    id: String(++n).padStart(4, '0'), state: 'APPROVED', from, to: new Date(Date.parse(from) + minutes * 60_000).toISOString(),
    totalDuration: minutes, timezone: 'America/Toronto', approvedAt: null, employee: person(who), group: { name: 'Cleaning' },
    client: client('Harper'), jobSite: site('Harper'), ...over,
  }
}
const START = '2026-10-03'
const cellOf = (ts: Timesheet[], day = 0) => buildClientHours(START, ts, []).groups[0].sites[0].cells[day]

describe('averaging cleaners', () => {
  it('averages a pair instead of adding them', () => {
    const c = cellOf([sheet('Alex', 3, '08:00', 123), sheet('Sam', 3, '08:02', 119)])
    expect(c.visits).toHaveLength(1)
    expect([c.approvedExact, hours(c.approved)]).toEqual([121, '2.00'])
  })

  it('handles the 1h18 example, a team of three, and someone working alone', () => {
    expect(hours(cellOf([sheet('Alex', 3, '08:00', 78), sheet('Sam', 3, '08:00', 78)]).approved)).toBe('1.25')
    expect(cellOf([sheet('Alex', 3, '08:00', 60), sheet('Sam', 3, '08:00', 90), sheet('Cy', 3, '08:10', 120)]).approvedExact).toBe(90)
    expect(hours(cellOf([sheet('Alex', 3, '08:00', 52)]).approved)).toBe('0.75')
  })

  it('rounds an average that lands exactly between quarters upward', () => {
    // 30 and 45 average 37.5 minutes, halfway between 0.50 and 0.75
    const c = cellOf([sheet('Alex', 3, '08:00', 30), sheet('Sam', 3, '08:00', 45)])
    expect([c.approvedExact, hours(c.approved)]).toEqual([37.5, '0.75'])
  })

  it('averages each visit and then adds separate visits on the same day', () => {
    // morning: Alex 2h and Sam 1h30 average 1h45; afternoon: Alex alone for 1h -> 2h45
    const c = cellOf([sheet('Alex', 3, '08:00', 120), sheet('Sam', 3, '08:00', 90), sheet('Alex', 3, '14:00', 60)])
    expect(c.visits.map((v) => [v.cleaners.map((x) => x.name).join('+'), v.minutes])).toEqual([['Alex+Sam', 105], ['Alex', 60]])
    expect([c.approvedExact, hours(c.approved)]).toEqual([165, '2.75'])
  })

  it('does not halve two cleaners who came at different times', () => {
    const c = cellOf([sheet('Alex', 3, '08:00', 60), sheet('Sam', 3, '13:00', 60)])
    expect([c.visits.length, hours(c.approved)]).toEqual([2, '2.00'])
  })

  it('totals a cleaner who has two entries within one visit before averaging', () => {
    // Alex clocked out and back in while Sam stayed: Alex 50+40=90, Sam 100 -> 95
    const c = cellOf([sheet('Sam', 3, '08:00', 100), sheet('Alex', 3, '08:00', 50), sheet('Alex', 3, '08:55', 40)])
    expect([c.visits.length, c.visits[0].cleaners.map((x) => [x.name, x.minutes]), c.approvedExact]).toEqual([1, [['Alex', 90], ['Sam', 100]], 95])
  })
})

describe('On Call', () => {
  it('is not a visit: no hours, nothing to bill, and not a filter choice', () => {
    const ts = [sheet('Alex', 3, '08:00', 120), sheet('Sam', 3, '08:00', 480, { group: { name: 'On Call' } }), sheet('Sam', 4, '08:00', 480, { group: { name: 'on call' }, client: client('Ives'), jobSite: null })]
    const h = buildClientHours(START, ts, [])
    expect([h.groups.map((g) => g.name), h.groups[0].sites[0].cells[0].approvedExact, h.billed]).toEqual([['Harper'], 120, 150])
    expect(clientHoursOptions(ts).positions).toEqual([{ id: 'Cleaning', name: 'Cleaning' }])
  })
})

describe('approved and unapproved', () => {
  it('keeps a visit red until every cleaner on it is approved', () => {
    const c = cellOf([sheet('Alex', 3, '08:00', 120), sheet('Sam', 3, '08:00', 120, { state: 'SUBMITTED' })])
    expect([hours(c.approved), hours(c.unapproved), c.visits[0].approved]).toEqual(['0.00', '2.00', false])
  })

  it('rounds approved and unapproved visits on a day separately', () => {
    const c = cellOf([sheet('Alex', 3, '08:00', 52), sheet('Alex', 3, '13:00', 52, { state: 'DRAFT' })])
    expect([hours(c.approved), hours(c.unapproved)]).toEqual(['0.75', '0.75'])
  })
})

describe('clients and sites', () => {
  const ts = [
    sheet('Alex', 3, '08:00', 60),
    sheet('Alex', 4, '08:00', 60, { client: null, jobSite: site('Depot') }),
    sheet('Alex', 5, '08:00', 60, { client: null, jobSite: null }),
    sheet('Alex', 6, '08:00', 60, { client: client('Lakeview'), jobSite: site('Clinic') }),
    sheet('Sam', 6, '13:00', 90, { client: client('Lakeview'), jobSite: site('Annex') }),
    sheet('Sam', 7, '13:00', 30, { client: client('Zed'), jobSite: null }),
  ]
  const h = buildClientHours(START, ts, [])

  it('groups by client, falls back to the job site, and leaves out entries with neither', () => {
    expect(h.groups.map((g) => [g.name, g.sites.map((s) => [s.siteName, s.linked])])).toEqual([
      ['Depot', [[null, false]]],
      ['Harper', [[null, true]]],
      ['Lakeview', [['Annex', true], ['Clinic', true]]],
      ['Zed', [[null, true]]],
    ])
    expect(h.leftOut).toBe(1)
  })

  it('has totals that agree across rows and columns', () => {
    expect(h.dayApproved.map(hours)).toEqual(['1.00', '1.00', '0.00', '2.50', '0.50', '0.00', '0.00'])
    const rows = h.groups.flatMap((g) => g.sites)
    expect(h.approved).toBe(rows.reduce((a, r) => a + r.approved, 0))
    expect(h.approved).toBe(h.dayApproved.reduce((a, b) => a + b, 0))
    expect([hours(h.approved), h.visits]).toEqual(['5.00', 5])
  })

  it('writes a CSV that matches', () => {
    const lines = clientHoursCsv(h).split('\r\n')
    expect(lines[0]).toBe('"Client","Site","Hours","Sat Oct 3","Sun Oct 4","Mon Oct 5","Tue Oct 6","Wed Oct 7","Thu Oct 8","Fri Oct 9","Total","Amount ($)"')
    expect(lines[3]).toBe('"Lakeview","Annex","Approved",0.00,0.00,0.00,1.50,0.00,0.00,0.00,1.50,112.50')
    expect(lines[lines.length - 2]).toBe('"Total","","Approved",1.00,1.00,0.00,2.50,0.50,0.00,0.00,5.00,375.00')
  })

  it('counts a visit on the local day it started', () => {
    const late = sheet('Alex', 3, '23:30', 120)
    const utc = sheet('Alex', 5, '00:00', 60, { from: '2026-10-05T02:30:00.000Z', to: '2026-10-05T03:30:00.000Z' })
    expect(buildClientHours(START, [late, utc], []).groups[0].sites[0].cells.map((c) => c.approvedExact)).toEqual([120, 60, 0, 0, 0, 0, 0])
  })
})

describe('timesheets that name a job site but no client', () => {
  it('joins the client that site belongs to, so a pair is still averaged', () => {
    // Sam's timesheet has the job site but not the client
    const pair = [sheet('Alex', 3, '08:00', 120), sheet('Sam', 3, '08:00', 100, { client: null })]
    const h = buildClientHours(START, pair, [])
    expect(h.groups.map((g) => [g.name, g.sites[0].linked])).toEqual([['Harper', true]])
    expect([h.groups[0].sites[0].cells[0].approvedExact, h.visits]).toEqual([110, 1])
    expect(clientHoursOptions(pair).clients.map((c) => c.name)).toEqual(['Harper'])
  })

  it('puts a cleaner whose timesheet has the client but no job site with the others on that visit', () => {
    // three cleaners, 6h24 each; one timesheet is missing its job site
    const trio = [sheet('Alex', 3, '08:51', 384), sheet('Sam', 3, '08:51', 384), sheet('Cy', 3, '08:51', 384, { jobSite: null })]
    const h = buildClientHours(START, trio, [])
    expect(h.groups.map((g) => g.sites.length)).toEqual([1])
    expect([h.visits, h.groups[0].sites[0].cells[0].visits[0].cleaners.length, hours(h.approved)]).toEqual([1, 3, '6.50'])
  })

  it('uses the client\'s only site for a site-less entry on another day, and overlap to choose between several', () => {
    const lone = sheet('Cy', 5, '09:00', 60, { jobSite: null })
    expect(linkSites([sheet('Alex', 3, '08:00', 60), lone])[1].jobSite?.name).toBe('Harper')
    const two = [sheet('Alex', 3, '08:00', 60, { jobSite: site('Front') }), sheet('Sam', 3, '13:00', 60, { jobSite: site('Back') })]
    expect(linkSites([...two, sheet('Cy', 3, '13:10', 30, { jobSite: null })])[2].jobSite?.name).toBe('Back')
    // two sites and no overlap: nothing to go on, so it stays without a site
    expect(linkSites([...two, sheet('Cy', 4, '08:00', 30, { jobSite: null })])[2].jobSite).toBeNull()
    expect(linkSites([sheet('Cy', 4, '08:00', 30, { jobSite: null })])[0].jobSite).toBeNull()
  })

  it('stands alone when the site is not linked to exactly one client', () => {
    const lone = sheet('Alex', 3, '08:00', 60, { client: null, jobSite: site('Depot') })
    expect(linkSites([lone])[0].client).toBeNull()
    const shared = site('Shared')
    const two = [sheet('Alex', 3, '08:00', 60, { jobSite: shared }), sheet('Bo', 4, '08:00', 60, { client: client('Lakeview'), jobSite: shared }), sheet('Cy', 5, '08:00', 60, { client: null, jobSite: shared })]
    expect(linkSites(two)[2].client).toBeNull()
    expect(linkSites([sheet('Alex', 3, '08:00', 60, { client: null, jobSite: { name: 'No id' } })])[0].client).toBeNull()
  })
})

describe('filters and flags', () => {
  const ts = [
    sheet('Alex', 3, '08:00', 120), sheet('Sam', 3, '08:00', 120),
    sheet('Cy', 4, '08:00', 60, { client: client('Lakeview'), jobSite: site('Clinic'), group: { name: 'Confirm' } }),
  ]
  const names = (f: Partial<typeof NO_FILTERS>) => buildClientHours(START, ts, [], { ...NO_FILTERS, ...f }).groups.map((g) => g.name)

  it('filters by client, position, cleaner and search', () => {
    expect(names({ clientId: 'c-lakeview' })).toEqual(['Lakeview'])
    expect(names({ position: 'Confirm' })).toEqual(['Lakeview'])
    expect(names({ staffId: 'sam' })).toEqual(['Harper'])
    expect(names({ query: 'clinic rd' })).toEqual(['Lakeview'])
    expect(names({ query: 'ALEX' })).toEqual(['Harper'])
    expect(names({ query: 'nobody' })).toEqual([])
  })

  it('keeps the average of the whole visit when filtering by one cleaner', () => {
    const uneven = [sheet('Alex', 3, '08:00', 120), sheet('Sam', 3, '08:00', 60)]
    const h = buildClientHours(START, uneven, [], { ...NO_FILTERS, staffId: 'sam' })
    expect(h.groups[0].sites[0].cells[0].approvedExact).toBe(90)
  })

  it('lists filter choices from all the timesheets', () => {
    const o = clientHoursOptions([...ts, sheet('Alex', 5, '08:00', 30, { client: null, jobSite: site('Depot') })])
    expect(o.clients.map((c) => c.name)).toEqual(['Depot', 'Harper', 'Lakeview'])
    expect(o.staff.map((c) => c.name)).toEqual(['Alex', 'Cy', 'Sam'])
    expect(o.positions.map((c) => c.name)).toEqual(['Cleaning', 'Confirm'])
  })

  it('flags uneven cleaners and very long entries', () => {
    const flags = (t: Timesheet[]) => buildClientHours(START, t, []).groups[0].sites[0].cells[0].visits.map((v) => v.flags)
    expect(flags([sheet('Alex', 3, '08:00', 120), sheet('Sam', 3, '08:00', 105)])).toEqual([[]])
    expect(flags([sheet('Alex', 3, '08:00', 120), sheet('Sam', 3, '08:00', 104)])).toEqual([['uneven']])
    expect(flags([sheet('Alex', 3, '08:00', 800)])).toEqual([['long']])
    expect(buildClientHours(START, [sheet('Alex', 3, '08:00', 800)], []).flaggedVisits).toBe(1)
  })
})

describe('billing at $75 an hour', () => {
  const rowOf = (ts: Timesheet[]) => buildClientHours(START, ts, []).groups[0].sites[0]

  it('bills a pair once, for the average of their time', () => {
    // 123 and 119 minutes average 121, which bills as 2 hours
    expect(rowOf([sheet('Alex', 3, '08:00', 123), sheet('Sam', 3, '08:02', 119)]).billed).toBe(150)
  })

  it('rounds each visit to the nearest quarter hour, not the day', () => {
    // two 1h07 visits: 1.00 + 1.00 billed, though the day's 2h14 rounds to 2.25 in the hours column
    const r = rowOf([sheet('Alex', 3, '08:00', 67), sheet('Alex', 3, '13:00', 67)])
    expect([hours(r.approved), r.billed]).toEqual(['2.25', 150])
    // 1h08 rounds up to 1.25
    expect(rowOf([sheet('Alex', 3, '08:00', 68)]).billed).toBe(93.75)
  })

  it('bills approved visits only and shows the rest as waiting', () => {
    const r = rowOf([sheet('Alex', 3, '08:00', 60), sheet('Alex', 4, '08:00', 90), sheet('Sam', 4, '08:00', 90, { state: 'SUBMITTED' })])
    expect([r.billed, r.pending]).toEqual([75, 112.5])
    expect(money(1237.5)).toBe('$1,237.50')
  })
})

describe("billing at a client's own price", () => {
  const rule = (from: string, kind: RateRule['kind'], dollars: number): RateRule => ({ from, kind, dollars, setAt: 1, setBy: 'boss@example.com' })
  const harper = (...rules: RateRule[]): ClientRate[] => [{ clientKey: 'c-harper', clientName: 'Harper', rules }]
  const rowOf = (ts: Timesheet[], rates: ClientRate[], group = 0) => buildClientHours(START, ts, rates).groups[group].sites[0]

  it('takes the latest price that has started by the day of the visit, else the default', () => {
    const rates = harper(rule('2026-10-05', 'flat', 180), rule('2026-10-01', 'hourly', 80))
    expect(priceFor(rates, 'c-harper', '2026-09-30')).toBe(DEFAULT_PRICE)
    expect(priceFor(rates, 'c-harper', '2026-10-04')).toMatchObject({ kind: 'hourly', dollars: 80 })
    expect(priceFor(rates, 'c-harper', '2026-10-05')).toMatchObject({ kind: 'flat', dollars: 180 })
    expect(priceFor(rates, 'c-other', '2026-10-05')).toBe(DEFAULT_PRICE)
    expect([priceText({ kind: 'flat', dollars: 180 }), priceText({ kind: 'hourly', dollars: 82.5 })]).toEqual(['$180 a visit', '$82.50 an hour'])
  })

  it('prices a visit to the cent: hourly on the rounded time, flat whatever its length', () => {
    expect(visitAmount(68, DEFAULT_PRICE)).toBe(93.75)
    expect(visitAmount(68, { kind: 'hourly', dollars: 33.33 })).toBe(41.66)
    expect([visitAmount(20, { kind: 'flat', dollars: 180 }), visitAmount(400, { kind: 'flat', dollars: 180 })]).toEqual([180, 180])
  })

  it('bills a flat price once for a visit, however many cleaners and hours, and once for each visit', () => {
    const rates = harper(rule('2026-10-01', 'flat', 180))
    // a pair for three hours is one visit
    expect(rowOf([sheet('Alex', 3, '08:00', 180), sheet('Sam', 3, '08:00', 180)], rates).billed).toBe(180)
    // two visits in the day are two
    expect(rowOf([sheet('Alex', 3, '08:00', 60), sheet('Alex', 3, '13:00', 60)], rates).billed).toBe(360)
  })

  it('bills an hourly price of their own on the same rounded time', () => {
    expect(rowOf([sheet('Alex', 3, '08:00', 68)], harper(rule('2026-10-01', 'hourly', 80))).billed).toBe(100)
  })

  it('leaves the days before a price starts, and every other client, as they were', () => {
    const lake = { client: client('Lakeview'), jobSite: site('Lakeview') }
    const ts = [sheet('Alex', 3, '08:00', 120), sheet('Alex', 6, '08:00', 120), sheet('Sam', 6, '08:00', 120, lake)]
    const before = buildClientHours(START, ts, [])
    const after = buildClientHours(START, ts, harper(rule('2026-10-06', 'flat', 180)))
    expect(before.groups[0].sites[0].cells.map((c) => c.billed)).toEqual([150, 0, 0, 150, 0, 0, 0])
    expect(after.groups[0].sites[0].cells.map((c) => c.billed)).toEqual([150, 0, 0, 180, 0, 0, 0])
    expect([after.groups[1].sites[0].billed, after.billed]).toEqual([150, 480])
    // a price that starts after the week changes nothing
    expect(buildClientHours(START, ts, harper(rule('2026-10-10', 'flat', 180))).billed).toBe(before.billed)
  })

  it('prices time waiting for approval the same way', () => {
    const r = rowOf([sheet('Alex', 3, '08:00', 60, { state: 'SUBMITTED' })], harper(rule('2026-10-01', 'flat', 180)))
    expect([r.billed, r.pending]).toEqual([0, 180])
  })
})
