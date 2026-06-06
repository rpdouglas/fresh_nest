export type QuotePropertySize = 'apartment' | '1-2bed' | '3-4bed' | '5plus' | 'commercial'
export type QuoteServiceType  = 'standard' | 'deep' | 'moveout' | 'postconstruction' | 'airbnb'
export type QuoteFrequency    = 'one-time' | 'weekly' | 'biweekly' | 'monthly'

interface PriceRange { min: number; max: number }

export const BASE_PRICES: Record<Exclude<QuotePropertySize, 'commercial'>, PriceRange> = {
  apartment: { min: 100, max: 130 },
  '1-2bed':  { min: 120, max: 155 },
  '3-4bed':  { min: 160, max: 200 },
  '5plus':   { min: 210, max: 270 },
}

export const SERVICE_MULTIPLIER: Record<QuoteServiceType, number> = {
  standard:         1.0,
  deep:             1.5,
  moveout:          1.75,
  postconstruction: 2.0,
  airbnb:           0.85,
}

export const FREQUENCY_DISCOUNT: Record<QuoteFrequency, number> = {
  'one-time': 0,
  weekly:     0.20,
  biweekly:   0.15,
  monthly:    0.10,
}

export type QuoteResult =
  | { type: 'range'; min: number; max: number }
  | { type: 'commercial' }

function roundToNearest5(n: number): number {
  return Math.round(n / 5) * 5
}

export function calculateQuote(
  size: QuotePropertySize,
  service: QuoteServiceType,
  frequency: QuoteFrequency,
): QuoteResult {
  if (size === 'commercial') return { type: 'commercial' }
  const base = BASE_PRICES[size]
  const factor = SERVICE_MULTIPLIER[service] * (1 - FREQUENCY_DISCOUNT[frequency])
  return {
    type: 'range',
    min: roundToNearest5(base.min * factor),
    max: roundToNearest5(base.max * factor),
  }
}
