/**
 * Money conventions (ADR-020, P3-E38). Pure — synced into functions/src/shared.
 *
 * - Amounts are integer cents, in fields named `…Cents`; currency CAD.
 * - A decimal result becomes cents once, rounding half up (PRC-S3.2): 0.5 ¢ → 1 ¢.
 * - Tax is computed in cents from a rate in basis points (HST 13 % = 1300) and stored beside
 *   the amount, never folded into it.
 */

export type Cents = number

/** HST in Ontario, in basis points. */
export const HST_BASIS_POINTS = 1300

// Strips binary floating-point noise (2.675 * 100 = 267.49999…) before rounding.
const denoise = (x: number) => Math.round(x * 1e6) / 1e6

/** Rounds to a whole number, halves away from zero (1.5 → 2, −1.5 → −2). */
export function roundHalfUp(value: number): number {
  const x = denoise(Math.abs(value))
  return Math.sign(value) * Math.floor(x + 0.5) || 0
}

/** Dollars (as typed in a form: 22.5) to cents (2250). */
export function toCents(dollars: number): Cents {
  return roundHalfUp(denoise(dollars * 100))
}

export function centsToDollars(cents: Cents): number {
  return cents / 100
}

/** Cents × a decimal factor (hours, quantity), rounded once. */
export function multiplyCents(cents: Cents, factor: number): Cents {
  return roundHalfUp(cents * factor)
}

/** A percentage of an amount, e.g. HST: percentOfCents(1150, 1300) = 150 (149.5 rounds up). */
export function percentOfCents(cents: Cents, basisPoints: number): Cents {
  return roundHalfUp((cents * basisPoints) / 10000)
}

/** '$1,234.50' (EN) or '1 234,50 $' (FR). */
export function formatCents(cents: Cents, lang: 'en' | 'fr' = 'en'): string {
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD' })
    .format(centsToDollars(cents))
}
