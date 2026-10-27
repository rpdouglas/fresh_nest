import { describe, it, expect } from 'vitest'
import { allowlistRole, checkRoleChange, isOfficeRole, isOwnerRole, normalizeRole, resolveOfficeRole } from '../src/lib/roles'

// P3-E35: Owner and Manager. Managers can do everything except give or take away office roles.

const change = (over: Partial<Parameters<typeof checkRoleChange>[0]>) =>
  checkRoleChange({ callerUid: 'me', callerRole: 'owner', targetUid: 'them', existingRole: 'customer', targetRole: 'staff', forceDowngrade: false, ...over })

describe('role names', () => {
  it('treats the legacy admin claim as owner during the transition', () => {
    expect(normalizeRole('admin')).toBe('owner')
    expect(isOwnerRole('admin')).toBe(true)
    expect(isOfficeRole('admin')).toBe(true)
  })
  it('office = owner or manager; staff roles are not office', () => {
    expect(isOfficeRole('manager')).toBe(true)
    expect(isOwnerRole('manager')).toBe(false)
    for (const r of ['supervisor', 'staff', 'customer', undefined, 'root']) expect(isOfficeRole(r)).toBe(false)
  })
  it('allowlist docs without a role are legacy owners; unknown roles are ignored', () => {
    expect(allowlistRole({})).toBe('owner')
    expect(allowlistRole({ role: 'manager' })).toBe('manager')
    expect(allowlistRole({ role: 'staff' })).toBeUndefined()
    expect(allowlistRole(undefined)).toBeUndefined()
  })
})

describe('checkRoleChange', () => {
  it('an Owner can make someone a Manager or an Owner', () => {
    expect(change({ targetRole: 'manager' })).toBeNull()
    expect(change({ targetRole: 'owner' })).toBeNull()
  })
  it('a Manager can set staff roles but not office roles', () => {
    expect(change({ callerRole: 'manager', targetRole: 'staff' })).toBeNull()
    expect(change({ callerRole: 'manager', targetRole: 'supervisor' })).toBeNull()
    expect(change({ callerRole: 'manager', targetRole: 'manager' })?.code).toBe('permission-denied')
    expect(change({ callerRole: 'manager', targetRole: 'owner' })?.code).toBe('permission-denied')
  })
  it('a Manager cannot remove another Manager or an Owner', () => {
    expect(change({ callerRole: 'manager', existingRole: 'manager', targetRole: 'customer', forceDowngrade: true })?.code).toBe('permission-denied')
    expect(change({ callerRole: 'manager', existingRole: 'admin', targetRole: 'staff', forceDowngrade: true })?.code).toBe('permission-denied')
  })
  it('an Owner can remove a Manager or another Owner (explicit downgrade)', () => {
    expect(change({ existingRole: 'manager', targetRole: 'customer', forceDowngrade: true })).toBeNull()
    expect(change({ existingRole: 'owner', targetRole: 'customer', forceDowngrade: true })).toBeNull()
    expect(change({ existingRole: 'manager', targetRole: 'customer' })?.code).toBe('failed-precondition')
  })
  it('nobody can change their own role (so there is always an Owner left)', () => {
    expect(change({ targetUid: 'me', existingRole: 'owner', targetRole: 'customer', forceDowngrade: true })?.code).toBe('failed-precondition')
  })
  it('staff and customers cannot change roles; admin is never written', () => {
    expect(change({ callerRole: undefined })?.code).toBe('permission-denied')
    expect(change({ targetRole: 'admin' })?.code).toBe('invalid-argument')
    expect(change({ targetRole: 'root' })?.code).toBe('invalid-argument')
  })
})

describe('resolveOfficeRole', () => {
  const db = (docs: Record<string, unknown>) => ({
    collection: () => ({ doc: (id: string) => ({ get: async () => ({ exists: id in docs, data: () => docs[id] }) }) }),
  })
  it('uses the claim first, then the allowlist (fresh grants before token refresh)', async () => {
    expect(await resolveOfficeRole({ uid: 'u', token: { role: 'manager' } }, db({}))).toBe('manager')
    expect(await resolveOfficeRole({ uid: 'u', token: { role: 'customer', email: 'Lauren@X.ca' } }, db({ 'lauren@x.ca': { role: 'manager' } }))).toBe('manager')
    expect(await resolveOfficeRole({ uid: 'u', token: { role: 'staff', email: 'a@b.ca' } }, db({}))).toBeUndefined()
  })
})
