import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useAdminAuth } from './useAdminAuth'
import { signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'

// Mock react-i18next translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { email?: string }) => {
      if (key === 'admin.login.errorMessage') {
        return `Unauthorized: ${params?.email ?? ''}`
      }
      return key
    },
  }),
}))

// Mock Firebase config auth instance
vi.mock('@/lib/firebase/firebase', () => ({
  auth: { currentUser: null },
  functions: {},
}))

const mockSyncMyRole = vi.fn().mockResolvedValue({ data: { role: 'customer', updated: false } })

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => mockSyncMyRole),
}))

// Store callback to trigger manually
let authStateCallback: ((user: User | null) => void) | null = null

vi.mock('firebase/auth', () => {
  return {
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((_auth: unknown, cb: (user: User | null) => void) => {
      authStateCallback = cb
      return () => {}
    }),
  }
})

describe('useAdminAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSyncMyRole.mockResolvedValue({ data: { role: 'customer', updated: false } })
    authStateCallback = null
  })

  it('should start in a loading state with null user', () => {
    const { result } = renderHook(() => useAdminAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthorized).toBe(false)
    expect(result.current.authError).toBeNull()
  })

  it('should set loading to false and authorize to false when auth state changes to null user', () => {
    const { result } = renderHook(() => useAdminAuth())

    act(() => {
      if (authStateCallback) {
        authStateCallback(null)
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthorized).toBe(false)
    expect(result.current.authError).toBeNull()
  })

  it('should set error and not authorize when user logs in with non-admin role claims', async () => {
    const mockUser = {
      email: 'hacker@test.com',
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'customer' },
      }),
    } as unknown as User

    const { result } = renderHook(() => useAdminAuth())

    await act(async () => {
      if (authStateCallback) {
        authStateCallback(mockUser)
      }
      await Promise.resolve()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBe(mockUser)
    expect(result.current.isAuthorized).toBe(false)
    expect(result.current.authError).toBe('Unauthorized: hacker@test.com')
  })

  it('should authorize and clear errors when user logs in with owner role claims', async () => {
    const mockUser = {
      email: 'owner@freshnest.ca',
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'owner' },
      }),
    } as unknown as User

    const { result } = renderHook(() => useAdminAuth())

    await act(async () => {
      if (authStateCallback) {
        authStateCallback(mockUser)
      }
      await Promise.resolve()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBe(mockUser)
    expect(result.current.isAuthorized).toBe(true)
    expect(result.current.authError).toBeNull()
  })

  it('should handle signIn flow correctly', async () => {
    const { result } = renderHook(() => useAdminAuth())

    await act(async () => {
      await result.current.handleSignIn()
    })

    expect(signInWithPopup).toHaveBeenCalled()
  })

  it('should handle signOut flow correctly', async () => {
    const { result } = renderHook(() => useAdminAuth())

    await act(async () => {
      await result.current.handleSignOut()
    })

    expect(signOut).toHaveBeenCalled()
  })

  it('HOTFIX-10: self-heals Lauren pre-approved Owner account via syncMyRole even when creationTime > 5 min old', async () => {
    mockSyncMyRole.mockResolvedValueOnce({ data: { role: 'owner', updated: true } })
    const getIdTokenResult = vi
      .fn()
      .mockResolvedValueOnce({ claims: { role: 'customer' } })
      .mockResolvedValueOnce({ claims: { role: 'owner' } })

    const mockUser = {
      uid: 'lauren-uid',
      email: 'freshnestcompany2023@gmail.com',
      metadata: { creationTime: '2026-01-01T00:00:00Z' },
      getIdTokenResult,
    } as unknown as User

    const { result } = renderHook(() => useAdminAuth())

    act(() => {
      if (authStateCallback) {
        authStateCallback(mockUser)
      }
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockSyncMyRole).toHaveBeenCalledTimes(1)
    expect(getIdTokenResult).toHaveBeenCalledTimes(2)
    expect(result.current.loading).toBe(false)
    expect(result.current.checkingAccess).toBe(false)
    expect(result.current.isAuthorized).toBe(true)
    expect(result.current.officeRole).toBe('owner')
    expect(result.current.isOwner).toBe(true)
    expect(result.current.authError).toBeNull()
  })

  // P3-E35: owners and managers both get the admin panel; only owners get isOwner.
  for (const [claim, expected] of [['owner', 'owner'], ['manager', 'manager'], ['admin', null], ['supervisor', null], ['staff', null]] as const) {
    it(`role '${claim}' → officeRole ${String(expected)}`, async () => {
      const mockUser = {
        email: `${claim}@test.com`,
        getIdTokenResult: vi.fn().mockResolvedValue({ claims: { role: claim } }),
      } as unknown as User
      const { result } = renderHook(() => useAdminAuth())
      await act(async () => {
        if (authStateCallback) authStateCallback(mockUser)
        await Promise.resolve()
      })
      expect(result.current.isAuthorized).toBe(expected !== null)
      expect(result.current.officeRole).toBe(expected)
      expect(result.current.isOwner).toBe(expected === 'owner')
    })
  }
})
