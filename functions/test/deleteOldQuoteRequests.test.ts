import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

// Owner request 2026-11-14: delete quote requests from before 2026-11-11 (and their visits).
const require = createRequire(import.meta.url)
const { cutoffMs, planDeletion, parseArgs } = require('../scripts/delete-old-quote-requests.cjs') as {
  cutoffMs: (d: string) => number
  planDeletion: (
    b: { id: string; data: Record<string, unknown> }[],
    j: { id: string; data: Record<string, unknown> }[],
    cutoff: number,
  ) => { plan: { id: string; status: string | null; email: string; jobIds: string[] }[]; undated: number }
  parseArgs: (argv: string[]) => { apply: boolean; database: string; before: string; cutoff: number }
}

const ts = (iso: string) => ({ toMillis: () => Date.parse(iso) })

describe('cutoffMs', () => {
  it('is midnight Ontario time (EST in November, EDT in summer)', () => {
    expect(new Date(cutoffMs('2026-11-11')).toISOString()).toBe('2026-11-11T05:00:00.000Z')
    expect(new Date(cutoffMs('2026-07-01')).toISOString()).toBe('2026-07-01T04:00:00.000Z')
  })
  it('rejects anything that is not a plain date', () => {
    expect(() => cutoffMs('Nov 11')).toThrow(/2026-11-11/)
  })
})

describe('planDeletion', () => {
  const cutoff = cutoffMs('2026-11-11')
  const bookings = [
    { id: 'old-pending', data: { createdAt: ts('2026-11-10T23:59:00-05:00'), status: 'pending', email: 'diane@example.ca' } },
    { id: 'old-confirmed', data: { createdAt: ts('2026-10-20T12:00:00Z'), status: 'confirmed', email: 'travis@example.ca', jobId: 'job1' } },
    { id: 'on-the-day', data: { createdAt: ts('2026-11-11T00:00:00-05:00'), status: 'pending', email: 'x@example.ca' } },
    { id: 'new', data: { createdAt: ts('2026-11-13T09:00:00Z'), status: 'pending' } },
    { id: 'undated', data: { status: 'pending' } },
  ]
  const jobs = [
    { id: 'job1', data: { bookingId: 'old-confirmed' } },
    { id: 'job2', data: { bookingId: 'old-confirmed' } },
    { id: 'job3', data: { bookingId: 'new' } },
  ]

  it('takes only bookings created strictly before midnight on the 11th, oldest first, with their jobs', () => {
    const { plan, undated } = planDeletion(bookings, jobs, cutoff)
    expect(plan.map((p) => p.id)).toEqual(['old-confirmed', 'old-pending'])
    expect(plan[0].jobIds).toEqual(['job1', 'job2'])
    expect(plan[1].jobIds).toEqual([])
    expect(undated).toBe(1)
  })

  it('masks emails in what it reports', () => {
    const { plan } = planDeletion(bookings, jobs, cutoff)
    expect(plan.find((p) => p.id === 'old-pending')?.email).toBe('d***@example.ca')
  })
})

describe('parseArgs', () => {
  it('dry run by default; database and date are required', () => {
    expect(parseArgs(['--database=(default)', '--before=2026-11-11'])).toMatchObject({ apply: false, database: '(default)', before: '2026-11-11' })
    expect(parseArgs(['--database=freshnest-dev', '--before=2026-11-11', '--apply']).apply).toBe(true)
    expect(() => parseArgs(['--before=2026-11-11'])).toThrow(/--database/)
    expect(() => parseArgs(['--database=prod', '--before=2026-11-11'])).toThrow(/Unknown database/)
    expect(() => parseArgs(['--database=(default)'])).toThrow(/--before/)
  })
})
