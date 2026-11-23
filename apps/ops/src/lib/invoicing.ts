// Invoicing: each day, each client's billable time, and whether it has been invoiced.
// The rules, in one place:
//  - billable time is approved visits only, each rounded on its own and priced at the
//    client's price on that day (billing.ts, applied in clientHours.ts); a client's sites
//    are added together for the day;
//  - time still waiting for approval is shown but cannot be invoiced yet;
//  - a very short visit billed a flat price is flagged, not dropped: someone decides;
//  - a tick keeps what was invoiced; if the billable time, its timesheets or the amount
//    change afterwards (a late approval, an edit, a price set for a past day), the row says so.
import type { Invoiced } from '../types'
import { type Price, SHORT_FLAT_MINUTES, billedMinutes } from './billing'
import type { ClientHours, Visit } from './clientHours'

export interface InvoiceLine {
  /** Null when the site is just named after the client. */
  siteName: string | null
  visits: number
  minutes: number
  amount: number
}

export interface InvoiceRow {
  date: string
  clientKey: string
  clientName: string
  /** Site names when the client has more than one, or one not named after the client. */
  sites: string[]
  minutes: number
  amount: number
  /** The client's price that day. */
  price: Price
  /** Approved visits billed a flat price though shorter than SHORT_FLAT_MINUTES: to look at before invoicing. */
  shortVisits: number
  /** The approved visits site by site, as an invoice's lines: they add up to `minutes` and `amount`. */
  lines: InvoiceLine[]
  pendingMinutes: number
  timesheetIds: string[]
  record: Invoiced | null
  invoiced: boolean
  /** Ticked, but what is billable now differs from what was invoiced. */
  changed: boolean
}

export interface InvoiceDay {
  date: string
  rows: InvoiceRow[]
  minutes: number
  amount: number
}

export interface Invoicing {
  days: InvoiceDay[]
  /** Dollars billable and not yet ticked, and ticked. */
  toInvoice: number
  invoiced: number
  changed: number
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const billed = (visits: Visit[]) => sum(visits.map((v) => billedMinutes(v.minutes)))
const idsOf = (visits: Visit[]) => visits.flatMap((v) => v.cleaners.flatMap((c) => c.entries.map((e) => e.id))).sort()

export function buildInvoicing(h: ClientHours, records: Invoiced[]): Invoicing {
  const byKey = new Map(records.map((r) => [`${r.date}|${r.clientKey}`, r]))
  const days = h.days.map((date, i): InvoiceDay => {
    const rows = h.groups
      .map((g): InvoiceRow | null => {
        const cells = g.sites.map((s) => s.cells[i])
        const visits = cells.flatMap((c) => c.visits)
        if (!visits.length) return null
        const approved = visits.filter((v) => v.approved)
        const minutes = billed(approved)
        const dollars = sum(cells.map((c) => c.billed))
        const timesheetIds = idsOf(approved)
        const record = byKey.get(`${date}|${g.key}`) ?? null
        const invoiced = !!record?.invoiced
        return {
          date,
          clientKey: g.key,
          clientName: g.name,
          sites: g.sites.filter((s) => s.cells[i].visits.length && (s.siteName || g.sites.length > 1)).map((s) => s.siteName ?? 'No site named'),
          minutes,
          amount: dollars,
          price: cells[0].price,
          shortVisits: cells[0].price.kind === 'flat' ? approved.filter((x) => x.minutes < SHORT_FLAT_MINUTES).length : 0,
          lines: g.sites
            .map((s) => ({ site: s, done: s.cells[i].visits.filter((v) => v.approved) }))
            .filter((x) => x.done.length)
            .map((x) => ({ siteName: x.site.siteName, visits: x.done.length, minutes: billed(x.done), amount: x.site.cells[i].billed })),
          pendingMinutes: billed(visits.filter((v) => !v.approved)),
          timesheetIds,
          record,
          invoiced,
          changed:
            invoiced &&
            (record!.minutes !== minutes ||
              Math.abs(record!.amount - dollars) >= 0.005 ||
              record!.timesheetIds.slice().sort().join() !== timesheetIds.join()),
        }
      })
      .filter((r): r is InvoiceRow => r !== null)
    return { date, rows, minutes: sum(rows.map((r) => r.minutes)), amount: sum(rows.map((r) => r.amount)) }
  })
  const rows = days.flatMap((d) => d.rows)
  return {
    days: days.filter((d) => d.rows.length),
    toInvoice: sum(rows.filter((r) => !r.invoiced).map((r) => r.amount)),
    invoiced: sum(rows.filter((r) => r.invoiced).map((r) => r.record!.amount)),
    changed: rows.filter((r) => r.changed).length,
  }
}
