import { describe, it, expect } from 'vitest'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { planClaims, planAllowlist, parseArgs } = require('../scripts/migrate-admin-to-owner.cjs') as {
  planClaims: (u: { uid: string; email?: string; claims: Record<string, unknown> }[]) => { uid: string; newClaims: Record<string, unknown> }[]
  planAllowlist: (d: { id: string; role?: unknown }[]) => string[]
  parseArgs: (argv: string[]) => { apply: boolean; database: string }
}

// P3-E35: one-time rename of the legacy admin role to owner.
describe('migrate-admin-to-owner', () => {
  it('switches only admin claims to owner, keeping other claims', () => {
    const plan = planClaims([
      { uid: 'a', claims: { role: 'admin', other: 1 } },
      { uid: 'b', claims: { role: 'staff' } },
      { uid: 'c', claims: { role: 'owner' } },
      { uid: 'd', claims: {} },
    ])
    expect(plan).toEqual([{ uid: 'a', email: undefined, newClaims: { role: 'owner', other: 1 } }])
  })

  it('gives legacy allowlist entries the owner role and leaves managers alone', () => {
    expect(planAllowlist([{ id: 'x@y.ca' }, { id: 'z@y.ca', role: 'admin' }, { id: 'm@y.ca', role: 'manager' }, { id: 'o@y.ca', role: 'owner' }]))
      .toEqual(['x@y.ca', 'z@y.ca'])
  })

  it('needs a database and defaults to a dry run', () => {
    expect(parseArgs(['--database=(default)'])).toEqual({ apply: false, database: '(default)' })
    expect(() => parseArgs([])).toThrow(/--database is required/)
  })
})
