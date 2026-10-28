import { describe, it, expect } from 'vitest'
import { formatCents, HST_BASIS_POINTS, multiplyCents, percentOfCents, roundHalfUp, toCents } from '../src/shared/money'
import { estimateShiftPay, earningsOverage } from '../src/shared/scheduling'

// P3-E38 (ADR-020): integer cents, rounded half up once.

describe('rounding and conversion', () => {
  it('rounds halves up, away from zero', () => {
    expect(roundHalfUp(149.5)).toBe(150)
    expect(roundHalfUp(149.4999)).toBe(149)
    expect(roundHalfUp(-1.5)).toBe(-2)
    expect(roundHalfUp(0)).toBe(0)
  })

  it('converts dollars to cents without floating-point slips', () => {
    expect(1.005 * 100).toBeLessThan(100.5) // the trap: 100.49999…
    expect(toCents(1.005)).toBe(101)
    expect(toCents(2.675)).toBe(268)
    expect(toCents(22.5)).toBe(2250)
    expect(toCents(0.1 + 0.2)).toBe(30)
    expect(toCents(19.99)).toBe(1999)
  })

  it('HST is computed in cents and rounded once', () => {
    expect(percentOfCents(1150, HST_BASIS_POINTS)).toBe(150) // 149.5 → 150
    expect(percentOfCents(10000, HST_BASIS_POINTS)).toBe(1300)
    expect(multiplyCents(1760, 1.75)).toBe(3080)
  })

  it('formats in English and French', () => {
    expect(formatCents(123450, 'en')).toBe('$1,234.50')
    expect(formatCents(123450, 'fr').replace(/\s/g, ' ')).toBe('1 234,50 $')
  })
})

describe('earnings stay exact (P7 Carla, P13 Marcus)', () => {
  it('shift pay is whole cents', () => {
    expect(estimateShiftPay(17.6, '09:00', '10:45')).toBe(30.8)
    expect(estimateShiftPay(22.15, '09:00', '09:20')).toBe(7.38) // 7.3833… → 7.38
  })

  it('a shift that exactly fills the limit is allowed', () => {
    expect(earningsOverage(estimateShiftPay(22, '09:00', '11:00'), 1000, 956)).toBe(0)
  })
})
