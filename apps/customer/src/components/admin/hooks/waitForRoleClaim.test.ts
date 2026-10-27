import { describe, it, expect, vi } from 'vitest'
import { isNewAccount, waitForRoleClaim, officeRoleOf } from '@freshnest/shared'

describe('isNewAccount (HOTFIX-10)', () => {
  it('returns true when creationTime is within the 5-minute window', () => {
    const now = Date.parse('2026-10-27T16:00:00Z')
    expect(isNewAccount('2026-10-27T15:58:00Z', now)).toBe(true)
  })

  it('returns false when creationTime is older than 5 minutes or missing/invalid', () => {
    const now = Date.parse('2026-10-27T16:00:00Z')
    expect(isNewAccount('2026-10-27T15:50:00Z', now)).toBe(false)
    expect(isNewAccount(undefined, now)).toBe(false)
    expect(isNewAccount(null, now)).toBe(false)
    expect(isNewAccount('not-a-date', now)).toBe(false)
  })
})

describe('waitForRoleClaim (HOTFIX-10)', () => {
  const acceptsOffice = (r: unknown) => officeRoleOf(r) !== null

  it('returns immediately when the first token check already has an accepted role', async () => {
    const getRole = vi.fn().mockResolvedValue('owner')
    const syncRole = vi.fn()

    const role = await waitForRoleClaim({
      getRole,
      accepts: acceptsOffice,
      syncRole,
      isNewAccount: true,
      schedule: [10, 10],
    })

    expect(role).toBe('owner')
    expect(getRole).toHaveBeenCalledTimes(1)
    expect(syncRole).not.toHaveBeenCalled()
  })

  it('self-heals via syncRole on an existing account (> 5 min old) when syncMyRole upgrades the claim (Lauren scenario)', async () => {
    const getRole = vi
      .fn()
      .mockResolvedValueOnce('customer')
      .mockResolvedValueOnce('owner')
    const syncRole = vi.fn().mockResolvedValue({ role: 'owner', updated: true })

    const role = await waitForRoleClaim({
      getRole,
      accepts: acceptsOffice,
      syncRole,
      isNewAccount: false,
      schedule: [5000],
    })

    expect(role).toBe('owner')
    expect(syncRole).toHaveBeenCalledTimes(1)
    expect(getRole).toHaveBeenCalledTimes(2)
  })

  it('retries along schedule for a brand-new account until onUserCreated sets the role', async () => {
    const getRole = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce('customer')
      .mockResolvedValueOnce('owner')

    const role = await waitForRoleClaim({
      getRole,
      accepts: acceptsOffice,
      isNewAccount: true,
      schedule: [5, 5, 5],
    })

    expect(role).toBe('owner')
    expect(getRole).toHaveBeenCalledTimes(3)
  })

  it('does not poll schedule for an existing account when syncRole does not upgrade the role', async () => {
    const getRole = vi.fn().mockResolvedValue('customer')
    const syncRole = vi.fn().mockResolvedValue({ role: 'customer', updated: false })

    const role = await waitForRoleClaim({
      getRole,
      accepts: acceptsOffice,
      syncRole,
      isNewAccount: false,
      schedule: [10, 10],
    })

    expect(role).toBe('customer')
    expect(getRole).toHaveBeenCalledTimes(1)
    expect(syncRole).toHaveBeenCalledTimes(1)
  })

  it('stops waiting immediately when signal is aborted', async () => {
    const controller = new AbortController()
    const getRole = vi.fn().mockImplementation(() => {
      if (getRole.mock.calls.length === 2) {
        controller.abort()
      }
      return Promise.resolve('customer')
    })

    const role = await waitForRoleClaim({
      getRole,
      accepts: acceptsOffice,
      isNewAccount: true,
      signal: controller.signal,
      schedule: [5, 5000, 5000],
    })

    expect(role).toBe('customer')
    expect(getRole).toHaveBeenCalledTimes(2)
  })
})
