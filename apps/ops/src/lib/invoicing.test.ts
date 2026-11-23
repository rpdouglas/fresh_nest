import { describe, expect, it } from 'vitest'
import type { ClientRate, Invoiced, Timesheet } from '../types'
import { buildClientHours } from './clientHours'
import { buildInvoicing } from './invoicing'

let n = 0
const site = (name: string) => ({ id: `s-${name.toLowerCase()}`, name, address: null })
function sheet(who: string, day: number, start: string, minutes: number, over: Partial<Timesheet> = {}): Timesheet {
  const from = `2026-10-${String(day).padStart(2, '0')}T${start}:00-04:00`
  return {
    id: `t${++n}`, state: 'APPROVED', from, to: new Date(Date.parse(from) + minutes * 60_000).toISOString(), totalDuration: minutes,
    timezone: 'America/Toronto', approvedAt: null, employee: { id: who, name: who }, group: { name: 'Cleaning' },
    client: { id: 'c1', name: 'Harper' }, jobSite: site('Harper'), ...over,
  }
}
const START = '2026-10-03'
const build = (ts: Timesheet[], records: Invoiced[] = [], rates: ClientRate[] = []) => buildInvoicing(buildClientHours(START, ts, rates), records)
const record = (over: Partial<Invoiced>): Invoiced => ({
  id: 'x', date: '2026-10-03', clientKey: 'c1', clientName: 'Harper', invoiced: true, minutes: 120, amount: 150, timesheetIds: [], updatedAt: 1, updatedBy: 'boss@example.com', ...over,
})

describe('invoicing by day and client', () => {
  it('lists each day with each client, adding their sites, billing approved visits each rounded', () => {
    const lake = { client: { id: 'c2', name: 'Lakeview' } }
    const inv = build([
      sheet('Alex', 3, '08:00', 67), // 1h07 bills 1.00
      sheet('Alex', 3, '13:00', 68), // 1h08 bills 1.25
      sheet('Sam', 3, '09:00', 60, { ...lake, jobSite: site('Annex') }),
      sheet('Sam', 3, '13:00', 30, { ...lake, jobSite: site('Clinic') }),
      sheet('Alex', 5, '08:00', 90),
    ])
    expect(inv.days.map((d) => [d.date, d.rows.map((r) => [r.clientName, r.minutes, r.amount, r.sites])])).toEqual([
      ['2026-10-03', [['Harper', 135, 168.75, []], ['Lakeview', 90, 112.5, ['Annex', 'Clinic']]]],
      ['2026-10-05', [['Harper', 90, 112.5, []]]],
    ])
    expect([inv.toInvoice, inv.invoiced]).toEqual([393.75, 0])
  })

  it('cannot invoice time still waiting for approval', () => {
    const row = build([sheet('Alex', 3, '08:00', 60), sheet('Sam', 3, '13:00', 90, { state: 'SUBMITTED' })]).days[0].rows[0]
    expect([row.minutes, row.pendingMinutes, row.timesheetIds.length]).toEqual([60, 90, 1])
  })

  it('marks a ticked row invoiced, and flags it when what is billable has changed since', () => {
    const ts = [sheet('Alex', 3, '08:00', 120)]
    const ids = ts.map((t) => t.id)
    const same = build(ts, [record({ minutes: 120, timesheetIds: ids })])
    expect([same.days[0].rows[0].invoiced, same.days[0].rows[0].changed, same.toInvoice, same.invoiced]).toEqual([true, false, 0, 150])
    // a late approval added another visit after it was invoiced
    const later = build([...ts, sheet('Alex', 3, '14:00', 60)], [record({ minutes: 120, timesheetIds: ids })])
    expect([later.days[0].rows[0].changed, later.changed]).toEqual([true, 1])
    // unticked: back to invoice
    expect(build(ts, [record({ invoiced: false, timesheetIds: ids })]).toInvoice).toBe(150)
  })

  it("bills a client at their own price from the day it starts, and says so on the row", () => {
    const rates: ClientRate[] = [{ clientKey: 'c1', clientName: 'Harper', rules: [{ from: '2026-10-05', kind: 'flat', dollars: 180, setAt: 1, setBy: 'b' }] }]
    const inv = build([sheet('Alex', 3, '08:00', 120), sheet('Alex', 5, '08:00', 45), sheet('Alex', 5, '13:00', 45)], [], rates)
    expect(inv.days.map((d) => d.rows.map((r) => [r.minutes, r.amount, r.price.kind, r.price.dollars]))).toEqual([
      [[120, 150, 'hourly', 75]],
      [[90, 360, 'flat', 180]],
    ])
    expect(inv.toInvoice).toBe(510)
  })

  it('flags a ticked row whose amount is no longer what was invoiced, though its time is the same', () => {
    const ts = [sheet('Alex', 3, '08:00', 120)]
    const ticked = [record({ minutes: 120, amount: 150, timesheetIds: ts.map((t) => t.id) })]
    const rates: ClientRate[] = [{ clientKey: 'c1', clientName: 'Harper', rules: [{ from: '2026-10-01', kind: 'flat', dollars: 180, setAt: 1, setBy: 'b' }] }]
    expect(build(ts, ticked).changed).toBe(0)
    const repriced = build(ts, ticked, rates)
    // what was invoiced is kept as the invoiced total; the row shows the new amount and the flag
    expect([repriced.changed, repriced.invoiced, repriced.days[0].rows[0].amount]).toEqual([1, 150, 180])
  })

  it('a visit too short to round to any time still has its flat price to invoice', () => {
    const rates: ClientRate[] = [{ clientKey: 'c1', clientName: 'Harper', rules: [{ from: '2026-10-01', kind: 'flat', dollars: 180, setAt: 1, setBy: 'b' }] }]
    const row = build([sheet('Alex', 3, '08:00', 5)], [], rates).days[0].rows[0]
    expect([row.minutes, row.amount, row.timesheetIds.length]).toEqual([0, 180, 1])
  })

  it('flags a visit under 15 minutes billed a flat price, and never one billed by the hour', () => {
    const rates: ClientRate[] = [{ clientKey: 'c1', clientName: 'Harper', rules: [{ from: '2026-10-04', kind: 'flat', dollars: 180, setAt: 1, setBy: 'b' }] }]
    const inv = build([sheet('Alex', 3, '08:00', 5), sheet('Alex', 5, '08:00', 150), sheet('Alex', 5, '14:00', 14), sheet('Alex', 6, '08:00', 15)], [], rates)
    // Oct 3 is before the flat price starts; Oct 5 has one short visit, still billed; 15 minutes is not short
    expect(inv.days.map((d) => [d.date, d.rows[0].shortVisits, d.rows[0].amount])).toEqual([
      ['2026-10-03', 0, 0],
      ['2026-10-05', 1, 360],
      ['2026-10-06', 0, 180],
    ])
    // a short visit still waiting for approval is not flagged yet: it is not billable
    expect(build([sheet('Alex', 5, '08:00', 5, { state: 'SUBMITTED' })], [], rates).days[0].rows[0].shortVisits).toBe(0)
  })
})
