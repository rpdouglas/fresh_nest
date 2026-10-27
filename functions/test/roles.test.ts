import { describe, it, expect } from 'vitest'
import { allowlistRole, checkPreApproval, checkRoleChange, isOfficeRole, isOwnerRole, normalizeRole, resolveOfficeRole } from '../src/lib/roles'

// P3-E35: Owner and Manager. Managers can do everything except give or take away office roles.

const change = (over: Partial<Parameters<typeof checkRoleChange>[0]>) =>
  checkRoleChange({ callerUid: 'me', callerRole: 'owner', targetUid: 'them', existingRole: 'customer', targetRole: 'staff', forceDowngrade: false, ...over })

describe('role names', () => {
  it('the legacy admin claim is no longer accepted (P3-E35 cleanup)', () => {
    expect(normalizeRole('admin')).toBeUndefined()
    expect(isOwnerRole('admin')).toBe(false)
    expect(isOfficeRole('admin')).toBe(false)
  })
  it('office = owner or manager; staff roles are not office', () => {
    expect(isOfficeRole('manager')).toBe(true)
    expect(isOwnerRole('manager')).toBe(false)
    for (const r of ['supervisor', 'staff', 'customer', undefined, 'root']) expect(isOfficeRole(r)).toBe(false)
  })
  it('old allowlist docs (no role, or admin) read as owners; unknown roles are ignored', () => {
    expect(allowlistRole({})).toBe('owner')
    expect(allowlistRole({ role: 'admin' })).toBe('owner')
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
    expect(change({ callerRole: 'manager', existingRole: 'owner', targetRole: 'staff', forceDowngrade: true })?.code).toBe('permission-denied')
  })
  it('an Owner can remove a Manager or another Owner (explicit downgrade)', () => {
    expect(change({ existingRole: 'manager', targetRole: 'customer', forceDowngrade: true })).toBeNull()
    expect(change({ existingRole: 'owner', targetRole: 'customer', forceDowngrade: true })).toBeNull()
    expect(change({ existingRole: 'manager', targetRole: 'customer' })?.code).toBe('failed-precondition')
  })
  it('nobody can change their own role (so there is always an Owner left)', () => {
    expect(change({ targetUid: 'me', existingRole: 'owner', targetRole: 'customer', forceDowngrade: true })?.code).toBe('failed-precondition')
  })
  it('a leftover admin account can be made an Owner by an Owner, but cannot change roles itself', () => {
    expect(change({ existingRole: 'admin', targetRole: 'owner' })).toBeNull()
    expect(change({ callerRole: normalizeRole('admin') })?.code).toBe('permission-denied')
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

describe('checkPreApproval (no account yet)', () => {
  const pre = (over: Partial<Parameters<typeof checkPreApproval>[0]>) =>
    checkPreApproval({ callerEmail: 'owner@x.ca', callerRole: 'owner', targetEmail: 'new@x.ca', existingRole: undefined, targetRole: 'owner', forceDowngrade: false, ...over })

  it('an Owner can pre-approve an Owner or Manager, switch them, or withdraw it', () => {
    expect(pre({})).toBeNull()
    expect(pre({ targetRole: 'manager' })).toBeNull()
    expect(pre({ existingRole: 'owner', targetRole: 'manager', forceDowngrade: true })).toBeNull()
    expect(pre({ existingRole: 'manager', targetRole: 'customer', forceDowngrade: true })).toBeNull()
  })
  it('a Manager cannot pre-approve anyone', () => {
    expect(pre({ callerRole: 'manager' })?.code).toBe('permission-denied')
    expect(pre({ callerRole: 'manager', targetRole: 'manager' })?.code).toBe('permission-denied')
  })
  it('staff roles still need an account first', () => {
    expect(pre({ targetRole: 'staff' })?.code).toBe('not-found')
    expect(pre({ callerRole: 'manager', targetRole: 'supervisor' })?.code).toBe('not-found')
  })
  it('nobody changes their own entry; admin is never written', () => {
    expect(pre({ targetEmail: 'owner@x.ca', existingRole: 'owner', targetRole: 'customer', forceDowngrade: true })?.code).toBe('failed-precondition')
    expect(pre({ targetRole: 'admin' })?.code).toBe('invalid-argument')
  })
})
