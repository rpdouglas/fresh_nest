import { describe, it, expect } from 'vitest'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { planBackfill, maskEmail, parseArgs } = require('../scripts/backfill-lowercase-booking-emails.cjs') as {
  planBackfill: (docs: { id: string; email: unknown }[]) => {
    updates: { id: string; from: string; to: string }[]
    skipped: { id: string; reason: string }[]
    mixedSpellings: number
  }
  maskEmail: (email: string) => string
  parseArgs: (argv: string[]) => { apply: boolean; database: string }
}

// HOTFIX-05 backfill: lowercase bookings.email saved before the fix.
describe('planBackfill', () => {
  it('lowercases and trims only the emails that need it', () => {
    const plan = planBackfill([
      { id: 'a', email: 'Diane@Example.ca' },
      { id: 'b', email: 'diane@example.ca' },
      { id: 'c', email: ' margaret@example.com ' },
      { id: 'd', email: 'travis@example.com' },
    ])
    expect(plan.updates).toEqual([
      { id: 'a', from: 'Diane@Example.ca', to: 'diane@example.ca' },
      { id: 'c', from: ' margaret@example.com ', to: 'margaret@example.com' },
    ])
    expect(plan.mixedSpellings).toBe(1) // Diane is stored two ways
    expect(plan.skipped).toEqual([])
  })

  it('skips bookings with no usable email instead of writing one', () => {
    const plan = planBackfill([{ id: 'x', email: undefined }, { id: 'y', email: '  ' }, { id: 'z', email: 42 }])
    expect(plan.updates).toEqual([])
    expect(plan.skipped.map((s) => s.id)).toEqual(['x', 'y', 'z'])
  })

  it('is a no-op on an already-clean collection (safe to re-run)', () => {
    expect(planBackfill([{ id: 'a', email: 'diane@example.ca' }]).updates).toEqual([])
  })
})

describe('maskEmail', () => {
  it('keeps PII out of the output', () => {
    expect(maskEmail('Diane.Lafleur@Example.ca')).toBe('d***@example.ca')
    expect(maskEmail(' Margaret@Example.com ')).toBe('m***@example.com')
  })
})

describe('parseArgs', () => {
  it('requires an explicit database and defaults to a dry run', () => {
    expect(parseArgs(['--database=freshnest-dev'])).toEqual({ apply: false, database: 'freshnest-dev' })
    expect(parseArgs(['--database=(default)', '--apply'])).toEqual({ apply: true, database: '(default)' })
    expect(() => parseArgs([])).toThrow(/--database is required/)
    expect(() => parseArgs(['--database=prod'])).toThrow(/--database is required/)
    expect(() => parseArgs(['--database=freshnest-dev', '--force'])).toThrow(/Unknown argument/)
  })
})
