import { describe, it, expect } from 'vitest'
import { calculateQuote, BASE_PRICES, SERVICE_MULTIPLIER, FREQUENCY_DISCOUNT } from './quotePricing'
import type { QuotePropertySize, QuoteServiceType, QuoteFrequency } from './quotePricing'

describe('quotePricing Utility', () => {
  it('returns commercial type for commercial property size', () => {
    const res = calculateQuote('commercial', 'standard', 'one-time')
    expect(res).toEqual({ type: 'commercial' })
  })

  it('calculates standard one-time range correctly for all residential sizes', () => {
    const sizes: QuotePropertySize[] = ['apartment', '1-2bed', '3-4bed', '5plus']
    
    sizes.forEach((size) => {
      if (size === 'commercial') return
      const base = BASE_PRICES[size]
      const res = calculateQuote(size, 'standard', 'one-time')
      expect(res.type).toBe('range')
      if (res.type === 'range') {
        expect(res.min).toBe(Math.round(base.min / 5) * 5)
        expect(res.max).toBe(Math.round(base.max / 5) * 5)
      }
    })
  })

  it('applies service multipliers correctly', () => {
    const services: QuoteServiceType[] = ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb']
    
    services.forEach((service) => {
      const multiplier = SERVICE_MULTIPLIER[service]
      const res = calculateQuote('3-4bed', service, 'one-time')
      expect(res.type).toBe('range')
      if (res.type === 'range') {
        const base = BASE_PRICES['3-4bed']
        const expectedMin = Math.round((base.min * multiplier) / 5) * 5
        const expectedMax = Math.round((base.max * multiplier) / 5) * 5
        expect(res.min).toBe(expectedMin)
        expect(res.max).toBe(expectedMax)
      }
    })
  })

  it('applies frequency discounts correctly', () => {
    const frequencies: QuoteFrequency[] = ['one-time', 'weekly', 'biweekly', 'monthly']
    
    frequencies.forEach((freq) => {
      const discount = FREQUENCY_DISCOUNT[freq]
      const factor = 1 - discount
      const res = calculateQuote('1-2bed', 'standard', freq)
      expect(res.type).toBe('range')
      if (res.type === 'range') {
        const base = BASE_PRICES['1-2bed']
        const expectedMin = Math.round((base.min * factor) / 5) * 5
        const expectedMax = Math.round((base.max * factor) / 5) * 5
        expect(res.min).toBe(expectedMin)
        expect(res.max).toBe(expectedMax)
      }
    })
  })
})
