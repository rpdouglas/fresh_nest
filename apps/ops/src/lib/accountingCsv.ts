// Invoicing's two downloads for the bookkeeper (decisions 0024 and 0033). The rules, in one place:
//  - a file holds the rows on screen that are approved and not yet ticked as invoiced, and
//    nothing is priced here: every dollar is the figure Invoicing shows;
//  - the universal file has one line per client per day;
//  - the QuickBooks Online file has one invoice per client per day, numbered from a number the
//    bookkeeper types, with a line for each of the client's sites that day. Every line repeats the
//    invoice's own fields, as QuickBooks asks. Amounts are before tax: QuickBooks adds the tax
//    from the tax code. It takes 100 invoices and 1,000 rows at a time, so more than that is
//    split into several files.
// Checked against Intuit's "Import multiple invoices at once" (Canada) on 2026-10-13: it asks for an
// invoice number, customer, invoice date, due date, item amount and item tax code, and the columns
// are matched by hand at import, so the header names here are labels, not a fixed schema.
import { priceText } from './billing'
import { csvCell } from './clientHours'
import type { InvoiceRow, Invoicing } from './invoicing'
import { hours } from './payroll'
import { addDays } from './week'

export const QBO_MAX_INVOICES = 100
export const QBO_MAX_ROWS = 1000

/** The rows a download holds: something approved to bill, and not ticked as invoiced. */
export const exportable = (inv: Invoicing): InvoiceRow[] => inv.days.flatMap((d) => d.rows).filter((r) => !r.invoiced && r.amount > 0)

const file = (lines: string[][]) => lines.map((l) => l.map(csvCell).join(',')).join('\r\n') + '\r\n'
const sitesOf = (r: InvoiceRow) => r.lines.map((l) => l.siteName).filter((s): s is string => !!s)

/** One line per client per day: customer, date, site, hours, rate, amount. */
export function universalCsv(rows: InvoiceRow[]): string {
  return file([
    ['Customer', 'Date', 'Site', 'Hours', 'Rate', 'Amount'],
    ...rows.map((r) => [r.clientName, r.date, sitesOf(r).join('; '), hours(r.minutes), priceText(r.price), r.amount.toFixed(2)]),
  ])
}

export interface QuickBooksOptions {
  /** The first invoice's number; the rest count up from it. */
  firstNumber: number
  /** The product or service every line is sold as, as it is named in QuickBooks. */
  item: string
  /** The tax code on every line, as it is named in QuickBooks. */
  taxCode: string
  /** Days from the invoice date to the due date. */
  dueDays: number
}

/** 2026-10-05 as 05/10/2026: day first, which is chosen when the file is imported. */
const dmy = (date: string) => date.split('-').reverse().join('/')

/** The QuickBooks Online files, and the last invoice number used (one below the first when there are no rows). */
export function quickBooksCsv(rows: InvoiceRow[], o: QuickBooksOptions): { files: string[]; lastNumber: number } {
  const head = ['InvoiceNo', 'Customer', 'InvoiceDate', 'DueDate', 'Item(Product/Service)', 'ItemDescription', 'ItemAmount', 'ItemTaxCode']
  const files: string[][][] = []
  let invoices = QBO_MAX_INVOICES
  rows.forEach((r, n) => {
    // a site whose only approved visit was too short to bill anything has no line
    const lines = r.lines
      .filter((l) => l.amount > 0)
      .map((l) => [
      String(o.firstNumber + n),
      r.clientName,
      dmy(r.date),
      dmy(addDays(r.date, o.dueDays)),
      o.item,
      `${l.siteName ? `${l.siteName}: ` : ''}${l.visits === 1 ? '1 visit' : `${l.visits} visits`}, ${hours(l.minutes)} h at ${priceText(r.price)}`,
      l.amount.toFixed(2),
      o.taxCode,
    ])
    if (invoices >= QBO_MAX_INVOICES || files.at(-1)!.length + lines.length > QBO_MAX_ROWS) {
      files.push([])
      invoices = 0
    }
    files.at(-1)!.push(...lines)
    invoices++
  })
  return { files: files.map((f) => file([head, ...f])), lastNumber: o.firstNumber + rows.length - 1 }
}
