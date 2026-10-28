import { describe, it, expect } from 'vitest'
import { toCents as sharedToCents } from '../src/shared/money'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { toCents, planDocument, parseArgs } = require('../scripts/migrate-money-to-cents.cjs') as {
  toCents: (dollars: number) => number
  planDocument: (kind: string, data: Record<string, unknown>) => Record<string, unknown> | null
  parseArgs: (argv: string[]) => { apply: boolean; database: string }
}

// P3-E38 PR 2: dollar fields get their integer-cents twin; dollars stay for one release.
describe('migrate-money-to-cents', () => {
  it('rounds exactly like the shared toCents()', () => {
    for (const d of [0, 1.005, 2.675, 22.5, 19.99, 0.1 + 0.2, 1000, 640.5, 17.6]) {
      expect(toCents(d)).toBe(sharedToCents(d))
    }
  })

  it('bookings, pay rates and job snapshots', () => {
    expect(planDocument('bookings', { estimatedPrice: 182.5 })).toEqual({ estimatedPriceCents: 18250 })
    expect(planDocument('payRates', { amount: 22 })).toEqual({ amountCents: 2200 })
    expect(planDocument('jobs', { payRateSnapshot: { rateId: 'r1', amount: 18 } })).toEqual({ 'payRateSnapshot.amountCents': 1800 })
  })

  it('staff financials, keeping a null limit as "no cap" and converting history totals', () => {
    expect(planDocument('staff', {
      financials: { monthlyEarningsLimit: 1000, currentMonthEarnings: 640.5, earningsHistory: [{ month: '2026-09', total: 980.25 }] },
    })).toEqual({
      'financials.monthlyEarningsLimitCents': 100000,
      'financials.currentMonthEarningsCents': 64050,
      'financials.earningsHistory': [{ month: '2026-09', total: 980.25, totalCents: 98025 }],
    })
    expect(planDocument('staff', { financials: { monthlyEarningsLimit: null, currentMonthEarnings: 0, earningsHistory: [] } }))
      .toEqual({ 'financials.monthlyEarningsLimitCents': null, 'financials.currentMonthEarningsCents': 0 })
  })

  it('policy settings', () => {
    expect(planDocument('policy', { defaultOdspMonthlyLimit: 1000, earningsCautionThreshold: 100, lateCancellationFeeDollars: 0, lockoutFeeDollars: 25 }))
      .toEqual({ defaultOdspMonthlyLimitCents: 100000, earningsCautionThresholdCents: 10000, lateCancellationFeeCents: 0, lockoutFeeCents: 2500 })
  })

  it('leaves records that already have cents (or nothing to convert) alone — safe to re-run', () => {
    expect(planDocument('payRates', { amount: 22, amountCents: 2300 })).toBeNull()
    expect(planDocument('bookings', { firstName: 'Travis' })).toBeNull()
    expect(planDocument('staff', { financials: { monthlyEarningsLimitCents: 100000, currentMonthEarningsCents: 0, earningsHistory: [{ month: '2026-09', totalCents: 1 }] } })).toBeNull()
  })

  it('requires an explicit database', () => {
    expect(() => parseArgs([])).toThrow(/--database is required/)
    expect(parseArgs(['--database=freshnest-dev', '--apply'])).toEqual({ apply: true, database: 'freshnest-dev' })
  })
})
