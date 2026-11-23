// Loads that only the dashboard makes and that need its rules. Kept out of queries.ts, which every page
// loads: a query here may import lib/dashboard.ts without bringing the dashboard's rules into the first script.
import { queryOptions } from '@tanstack/react-query'
import type { ClientRate, Invoiced, PeriodResponse } from '../types'
import { type LookBack, type PeriodSheets, lookBack } from './dashboard'
import { periodQuery, queryClient } from './queries'
import { INVOICE_LOOK_BACK, RECORD_START } from './targets'

/**
 * The earlier pay periods the dashboard's "approved, not yet invoiced" has to read (lookBack in lib/dashboard.ts):
 * one at a time, each through the site's cache, so a period a report has loaded is not asked for again, and
 * stopping at the first with nothing left to invoice. `stamps` says which reads of last period, the prices and the
 * ticks it was worked out from, so it is worked out again when one of them changes.
 */
export const earlierToInvoiceQuery = (prev: PeriodSheets | null, rates: ClientRate[] | null, invoiced: Invoiced[] | null, stamps: number[], token: string) =>
  queryOptions({
    queryKey: ['dashboard', 'to-invoice-earlier', prev?.periodStart, ...stamps],
    queryFn: async (): Promise<LookBack> => {
      const got = new Map<string, PeriodResponse>()
      for (;;) {
        const back = lookBack(prev!, (s) => got.get(s), rates!, invoiced!, RECORD_START, INVOICE_LOOK_BACK)
        if (back.settled) return back
        const next = back.ask.at(-1)!
        got.set(next, await queryClient.fetchQuery(periodQuery(next, token)))
      }
    },
  })
