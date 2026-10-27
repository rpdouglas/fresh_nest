import { describe, it, expect } from 'vitest'
import { reconcileUserRole, type SyncRoleDirectoryReader } from '../src/callable/auth'

function makeDirectory(options: {
  admins?: Record<string, { role?: unknown }>
  staff?: Record<string, string>
}): SyncRoleDirectoryReader {
  const admins = options.admins ?? {}
  const staff = options.staff ?? {}
  return {
    getAdminDoc: async (email) => ({
      exists: email in admins,
      data: () => admins[email],
    }),
    getStaffRole: async (email) => staff[email],
  }
}

describe('reconcileUserRole (HOTFIX-10)', () => {
  it('upgrades a pre-approved Owner whose Auth claim is missing or customer (Lauren scenario)', async () => {
    const directory = makeDirectory({
      admins: { 'freshnestcompany2023@gmail.com': { role: 'owner' } },
    })

    const fromMissing = await reconcileUserRole({
      email: 'FreshNestCompany2023@gmail.com ',
      existingRole: undefined,
      directory,
    })
    expect(fromMissing).toEqual({ role: 'owner', updated: true })

    const fromCustomer = await reconcileUserRole({
      email: 'freshnestcompany2023@gmail.com',
      existingRole: 'customer',
      directory,
    })
    expect(fromCustomer).toEqual({ role: 'owner', updated: true })
  })

  it('upgrades a pre-approved Manager and is a no-op once the claim matches', async () => {
    const directory = makeDirectory({
      admins: { 'manager@freshnest.ca': { role: 'manager' } },
    })

    expect(
      await reconcileUserRole({
        email: 'manager@freshnest.ca',
        existingRole: 'customer',
        directory,
      }),
    ).toEqual({ role: 'manager', updated: true })

    expect(
      await reconcileUserRole({
        email: 'manager@freshnest.ca',
        existingRole: 'manager',
        directory,
      }),
    ).toEqual({ role: 'manager', updated: false })
  })

  it('assigns staff or supervisor from the staff directory when not in admins', async () => {
    const directory = makeDirectory({
      staff: {
        'brenda@freshnest.ca': 'supervisor',
        'carla@freshnest.ca': 'cleaner',
      },
    })

    expect(
      await reconcileUserRole({
        email: 'brenda@freshnest.ca',
        existingRole: undefined,
        directory,
      }),
    ).toEqual({ role: 'supervisor', updated: true })

    expect(
      await reconcileUserRole({
        email: 'carla@freshnest.ca',
        existingRole: 'customer',
        directory,
      }),
    ).toEqual({ role: 'staff', updated: true })
  })

  it('never downgrades a higher existing claim and migrates legacy admin claim to owner', async () => {
    const directory = makeDirectory({})

    expect(
      await reconcileUserRole({
        email: 'owner@freshnest.ca',
        existingRole: 'owner',
        directory,
      }),
    ).toEqual({ role: 'owner', updated: false })

    expect(
      await reconcileUserRole({
        uid: 'EPbLg8-legacy',
        email: 'lead@freshnest.ca',
        existingRole: 'admin',
        directory,
      }),
    ).toEqual({ role: 'owner', updated: true })
  })

  it('leaves an ordinary customer unchanged when already customer', async () => {
    const directory = makeDirectory({})

    expect(
      await reconcileUserRole({
        email: 'diane@example.ca',
        existingRole: 'customer',
        directory,
      }),
    ).toEqual({ role: 'customer', updated: false })
  })
})
