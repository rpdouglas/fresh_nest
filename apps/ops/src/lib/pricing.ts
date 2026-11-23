// The Client prices screen: who is listed, and what each is billed today (rules in billing.ts).
import type { ClientRate, RateRule } from '../types'
import { type Price, priceFor } from './billing'

export interface PricingRow {
  key: string
  name: string
  rules: RateRule[]
  now: Price
  /** Prices set to start after today, soonest first. */
  coming: RateRule[]
}

/** Every client with a price of their own, and those seen in the two pay periods loaded, by name. */
export function pricingRows(rates: ClientRate[], seen: { id: string; name: string }[], today: string): PricingRow[] {
  const names = new Map<string, string>([
    ...rates.map((r) => [r.clientKey, r.clientName] as const),
    ...seen.map((c) => [c.id, c.name] as const),
  ])
  return [...names]
    .map(([key, name]) => {
      const rules = rates.find((r) => r.clientKey === key)?.rules ?? []
      return { key, name, rules, now: priceFor(rates, key, today), coming: rules.filter((r) => r.from > today) }
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.key.localeCompare(b.key))
}
