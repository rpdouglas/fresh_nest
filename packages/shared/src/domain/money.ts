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

/** '$1,234.50' (EN) or '1 234,50 $' (FR). Takes an i18n language code ('en', 'fr', 'fr-CA'). */
export function formatCents(cents: Cents, lang: string = 'en'): string {
  return new Intl.NumberFormat(lang.startsWith('fr') ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD' })
    .format(centsToDollars(cents))
}

// ── Dollar fields → cents (P3-E38 PR 2) ─────────────────────────────────────
// Records saved before the migration hold dollars in the old field names. Readers go through
// these normalizers (the app converters and the Cloud Functions), so the rest of the code sees
// only `…Cents`. Remove them once migrate-money-to-cents.cjs has run and the old fields are gone.

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** The cents value, or the old dollar value converted, or null when neither is set. */
export function centsOrLegacy(cents: unknown, legacyDollars: unknown): Cents | null {
  if (isNum(cents)) return Math.round(cents)
  if (isNum(legacyDollars)) return toCents(legacyDollars)
  return null
}

export interface StaffFinancialsCents {
  monthlyEarningsLimitCents: Cents | null
  currentMonthEarningsCents: Cents
  earningsHistory: Array<{ month: string; totalCents: Cents }>
}

export function normalizeFinancials(raw: unknown): StaffFinancialsCents {
  const f = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const history = Array.isArray(f.earningsHistory) ? (f.earningsHistory as Array<Record<string, unknown>>) : []
  return {
    monthlyEarningsLimitCents: centsOrLegacy(f.monthlyEarningsLimitCents, f.monthlyEarningsLimit),
    currentMonthEarningsCents: centsOrLegacy(f.currentMonthEarningsCents, f.currentMonthEarnings) ?? 0,
    earningsHistory: history.map((h) => ({
      month: String(h.month ?? ''),
      totalCents: centsOrLegacy(h.totalCents, h.total) ?? 0,
    })),
  }
}

/** Pay rate or pay-rate snapshot amount in cents (`amountCents`, or the old `amount` in dollars). */
export function amountCentsOf(raw: unknown): Cents {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return centsOrLegacy(r.amountCents, r.amount) ?? 0
}
