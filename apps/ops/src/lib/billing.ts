// What clients are billed. The rule, in one place (the owner's, 2026-10-12 and 2026-10-13):
//  - a client's price is the one in force on the day of the visit: the latest that starts on
//    or before that day. A client with none is billed $75 an hour;
//  - an hourly price is per visit, however many cleaners are on it. A visit's time is the
//    average of its cleaners' time (as Client hours measures it), rounded to the nearest
//    15 minutes, each visit on its own;
//  - a flat price is that many dollars for each visit, whatever its length. A visit shorter
//    than SHORT_FLAT_MINUTES is still billed, and flagged on Invoicing to be looked at first
//    (it may be a stray clock-in);
//  - only approved visits are billable; unapproved ones are shown as waiting.
import type { ClientRate } from '../types'

/** Dollars an hour for a client with no price of their own. */
export const HOURLY_RATE = 75

/** A visit at a flat price shorter than this is flagged before it is invoiced (owner, 2026-10-13). */
export const SHORT_FLAT_MINUTES = 15

export interface Price {
  kind: 'hourly' | 'flat'
  dollars: number
}

export const DEFAULT_PRICE: Price = { kind: 'hourly', dollars: HOURLY_RATE }

/** A visit's billable minutes: its time to the nearest quarter hour. */
export const billedMinutes = (visitMinutes: number) => Math.round(visitMinutes / 15) * 15

/** The price a client is billed for a visit on `date` (YYYY-MM-DD). */
export function priceFor(rates: ClientRate[], clientKey: string, date: string): Price {
  const rules = rates.find((r) => r.clientKey === clientKey)?.rules ?? []
  // dates as text compare in order; the latest start on or before the day wins
  const inForce = rules.filter((r) => r.from <= date).sort((a, b) => a.from.localeCompare(b.from))
  return inForce.at(-1) ?? DEFAULT_PRICE
}

/** Dollars for one visit of so many minutes, to the cent. */
export const visitAmount = (visitMinutes: number, price: Price) =>
  Math.round((price.kind === 'flat' ? price.dollars : (billedMinutes(visitMinutes) / 60) * price.dollars) * 100) / 100

const fmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol' })
/** "$1,237.50" */
export const money = (dollars: number) => fmt.format(dollars)

/** "$180 a visit", "$82.50 an hour" */
export const priceText = (p: Price) => `${money(p.dollars).replace(/\.00$/, '')} ${p.kind === 'flat' ? 'a visit' : 'an hour'}`
