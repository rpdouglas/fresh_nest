import { describe, expect, it } from 'vitest'
import type { ClientRate, RateRule } from '../types'
import { DEFAULT_PRICE } from './billing'
import { pricingRows } from './pricing'

const rule = (from: string, kind: RateRule['kind'], dollars: number): RateRule => ({ from, kind, dollars, setAt: 1, setBy: 'boss@example.com' })

describe('the list of client prices', () => {
  const rates: ClientRate[] = [{ clientKey: 'c2', clientName: 'Lakeview', rules: [rule('2026-10-01', 'flat', 180), rule('2026-11-01', 'flat', 195)] }]
  const rows = pricingRows(rates, [{ id: 'c1', name: 'harper' }, { id: 'c2', name: 'Lakeview Ltd' }], '2026-10-13')

  it('lists clients seen lately and clients with a price, once each, by name', () => {
    // a client seen lately takes the name Camelo has now
    expect(rows.map((r) => [r.key, r.name])).toEqual([['c1', 'harper'], ['c2', 'Lakeview Ltd']])
  })

  it("shows today's price, the default for a client with none, and what is set to start later", () => {
    expect(rows[0].now).toBe(DEFAULT_PRICE)
    expect(rows[1].now).toMatchObject({ kind: 'flat', dollars: 180 })
    expect(rows[1].coming.map((c) => [c.from, c.dollars])).toEqual([['2026-11-01', 195]])
    expect(rows[0].coming).toEqual([])
  })
})
