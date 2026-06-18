import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useAdminAuth } from './useAdminAuth'
import { signInWithPopup, signOut } from 'firebase/auth'
import type { User, IdTokenResult } from 'firebase/auth'

// Mock react-i18next translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'admin.login.errorMessage') {
        return `Unauthorized: ${params?.email || ''}`
      }
      return key
    },
  }),
}))

// Mock Firebase config auth instance
vi.mock('@/lib/firebase/firebase', () => ({
  auth: { currentUser: null },
}))

// Store callback to trigger manually
let authStateCallback: ((user: User | null) => void) | null = null

vi.mock('firebase/auth', () => {
  return {
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((_auth, cb) => {
      authStateCallback = cb
      return () => {}
    }),
  }
})

describe('useAdminAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStateCallback = null
  })

  it('should start in a loading state with null user', () => {
    const { result } = renderHook(() => useAdminAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthorized).toBe(false)
    expect(result.current.authError).toBeNull()
  })

  it('should set loading to false and authorize to false when auth state changes to null user', async () => {
    const { result } = renderHook(() => useAdminAuth())

    await act(async () => {
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
      } as unknown as IdTokenResult),
    } as unknown as User

    const { result } = renderHook(() => useAdminAuth())

    await act(async () => {
      if (authStateCallback) {
        authStateCallback(mockUser)
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBe(mockUser)
    expect(result.current.isAuthorized).toBe(false)
    expect(result.current.authError).toBe('Unauthorized: hacker@test.com')
  })

  it('should authorize and clear errors when user logs in with admin role claims', async () => {
    const mockUser = {
      email: 'owner@freshnest.ca',
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'admin' },
      } as unknown as IdTokenResult),
    } as unknown as User

    const { result } = renderHook(() => useAdminAuth())

    await act(async () => {
      if (authStateCallback) {
        authStateCallback(mockUser)
      }
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
})
