import { beforeEach, describe, expect, it } from 'vitest'
import type { Timesheet } from '../types'
import { earlierToInvoiceQuery } from './dashboardQueries'
import { forgetLoaded, periodQuery, queryClient } from './queries'

describe('the earlier pay periods the dashboard reads for what is not yet invoiced', () => {
  beforeEach(() => forgetLoaded())

  // one approved two-hour visit on the day given: $150 to invoice
  const visit = (id: string, day: string) =>
    ({
      id,
      state: 'APPROVED',
      from: `${day}T08:00:00-04:00`,
      to: `${day}T10:00:00-04:00`,
      totalDuration: 120,
      timezone: 'America/Toronto',
      approvedAt: null,
      employee: { id: 'maya', name: 'Maya' },
      group: { name: 'Cleaning' },
      client: { id: 'c1', name: 'Harper' },
      jobSite: { id: 's1', name: 'Harper' },
    }) as unknown as Timesheet
  const week = (periodStart: string, timesheets: Timesheet[]) => ({ periodStart, from: '', to: '', timesheets })
  const load = (w: ReturnType<typeof week>) => queryClient.setQueryData(periodQuery(w.periodStart, 't').queryKey, w)

  it('takes them one after another from what is already loaded, and stops at the first clean one', async () => {
    const prev = week('2026-11-06', [visit('a', '2026-11-09')])
    const [w2, w3] = [week('2026-10-30', [visit('b', '2026-11-02')]), week('2026-10-23', [])]
    load(w2)
    load(w3)
    // the period of Oct 16 is not loaded: asking for it would fail here, so this also shows it is not asked for
    const back = await queryClient.fetchQuery(earlierToInvoiceQuery(prev, [], [], [1, 1, 1], 't'))
    expect(back.read.map((p) => p.periodStart)).toEqual(['2026-10-30', '2026-10-23'])
    expect([back.settled, back.more, back.from]).toEqual([true, false, '2026-10-23'])
  })

  it('reads nothing when last period has nothing left to invoice', async () => {
    const back = await queryClient.fetchQuery(earlierToInvoiceQuery(week('2026-11-06', []), [], [], [1, 1, 1], 't'))
    expect([back.read, back.from]).toEqual([[], '2026-11-06'])
  })

  it('fails as a whole when an earlier period cannot be read', async () => {
    const prev = week('2026-11-06', [visit('a', '2026-11-09')])
    await expect(queryClient.fetchQuery(earlierToInvoiceQuery(prev, [], [], [2, 2, 2], 't'))).rejects.toThrow()
  })
})
