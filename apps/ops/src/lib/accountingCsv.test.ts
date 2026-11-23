import { describe, expect, it } from 'vitest'
import type { ClientRate, Invoiced, Timesheet } from '../types'
import { exportable, quickBooksCsv, universalCsv } from './accountingCsv'
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
const lake = { client: { id: 'c2', name: 'Lakeview, Ltd' } }
const rates: ClientRate[] = [{ clientKey: 'c2', clientName: 'Lakeview, Ltd', rules: [{ from: '2026-10-01', kind: 'flat', dollars: 180, setAt: 1, setBy: 'b' }] }]
const ts = [
  sheet('Alex', 3, '08:00', 67), // 1.00 h, $75
  sheet('Alex', 3, '13:00', 68), // 1.25 h, $93.75
  sheet('Sam', 3, '09:00', 60, { ...lake, jobSite: site('Annex') }),
  sheet('Sam', 3, '13:00', 30, { ...lake, jobSite: site('Clinic') }),
  sheet('Alex', 5, '08:00', 90),
  sheet('Sam', 5, '08:00', 90, { ...lake, jobSite: site('Annex'), state: 'SUBMITTED' }), // waiting: in no file
]
const build = (records: Invoiced[] = []) => buildInvoicing(buildClientHours('2026-10-03', ts, rates), records)
const o = { firstNumber: 1041, item: 'Cleaning', taxCode: 'HST ON', dueDays: 14 }
const cells = (csv: string) => csv.trimEnd().split('\r\n')

describe('what a download holds', () => {
  it('is the approved rows not yet ticked, and adds up to what Invoicing shows as to invoice', () => {
    const inv = build()
    const rows = exportable(inv)
    expect(rows.map((r) => [r.date, r.clientName])).toEqual([['2026-10-03', 'Harper'], ['2026-10-03', 'Lakeview, Ltd'], ['2026-10-05', 'Harper']])
    expect(rows.reduce((a, r) => a + r.amount, 0)).toBe(inv.toInvoice)
    // each row's lines add up to the row
    for (const r of rows) expect(r.lines.reduce((a, l) => a + l.amount, 0)).toBe(r.amount)
  })

  it('leaves out a row already ticked as invoiced', () => {
    const ticked: Invoiced = { id: 'x', date: '2026-10-05', clientKey: 'c1', clientName: 'Harper', invoiced: true, minutes: 90, amount: 112.5, timesheetIds: [], updatedAt: 1, updatedBy: 'b' }
    expect(exportable(build([ticked])).map((r) => r.date)).toEqual(['2026-10-03', '2026-10-03'])
  })
})

describe('the universal file', () => {
  it('has one line per client per day, quoted so a comma in a name stays in its cell', () => {
    expect(cells(universalCsv(exportable(build())))).toEqual([
      '"Customer","Date","Site","Hours","Rate","Amount"',
      '"Harper","2026-10-03","","2.25","$75 an hour","168.75"',
      '"Lakeview, Ltd","2026-10-03","Annex; Clinic","1.50","$180 a visit","360.00"',
      '"Harper","2026-10-05","","1.50","$75 an hour","112.50"',
    ])
  })

  it('makes a name a spreadsheet would run as a formula plain text', () => {
    const odd = buildInvoicing(buildClientHours('2026-10-03', [sheet('Alex', 3, '08:00', 60, { client: { id: 'c9', name: '=SUM(A1)' } })], []), [])
    expect(cells(universalCsv(exportable(odd)))[1]).toMatch(/^"'=SUM\(A1\)",/)
  })
})

describe('the QuickBooks file', () => {
  it('has one invoice per client per day, numbered up from the first, a line per site, dates day first', () => {
    const { files, lastNumber } = quickBooksCsv(exportable(build()), o)
    expect(files).toHaveLength(1)
    expect(cells(files[0])).toEqual([
      '"InvoiceNo","Customer","InvoiceDate","DueDate","Item(Product/Service)","ItemDescription","ItemAmount","ItemTaxCode"',
      '"1041","Harper","03/10/2026","17/10/2026","Cleaning","2 visits, 2.25 h at $75 an hour","168.75","HST ON"',
      '"1042","Lakeview, Ltd","03/10/2026","17/10/2026","Cleaning","Annex: 1 visit, 1.00 h at $180 a visit","180.00","HST ON"',
      '"1042","Lakeview, Ltd","03/10/2026","17/10/2026","Cleaning","Clinic: 1 visit, 0.50 h at $180 a visit","180.00","HST ON"',
      '"1043","Harper","05/10/2026","19/10/2026","Cleaning","1 visit, 1.50 h at $75 an hour","112.50","HST ON"',
    ])
    expect(lastNumber).toBe(1043)
  })

  it('adds up to the same dollars as Invoicing', () => {
    const inv = build()
    const total = cells(quickBooksCsv(exportable(inv), o).files[0]).slice(1).reduce((a, l) => a + Number(l.split('","')[6]), 0)
    expect(total).toBe(inv.toInvoice)
  })

  it('splits more than a hundred invoices into several files, the numbers carrying on', () => {
    const row = exportable(build())[0]
    const { files, lastNumber } = quickBooksCsv(Array.from({ length: 230 }, () => row), o)
    expect(files.map((f) => cells(f).length - 1)).toEqual([100, 100, 30])
    expect(cells(files[2])[1]).toMatch(/^"1241",/)
    expect(lastNumber).toBe(1270)
  })

  it('leaves out a site with nothing to bill, on an invoice that has other lines', () => {
    const two = [sheet('Alex', 3, '08:00', 60), sheet('Alex', 3, '13:00', 5, { jobSite: site('Shed') })]
    const rows = exportable(buildInvoicing(buildClientHours('2026-10-03', two, []), []))
    expect(cells(quickBooksCsv(rows, o).files[0]).slice(1).map((l) => l.split('","')[6])).toEqual(['75.00'])
  })

  it('makes no file from no rows', () => {
    expect(quickBooksCsv([], o)).toEqual({ files: [], lastNumber: 1040 })
  })
})
