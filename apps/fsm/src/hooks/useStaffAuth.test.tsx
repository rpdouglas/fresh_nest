import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { User } from 'firebase/auth'
import { StaffAuthProvider } from '../context/StaffAuthProvider'
import { useStaffAuth } from './useStaffAuth'

// Mock Firebase Modules
const mockSignInWithEmailAndPassword = vi.fn()
const mockSendSignInLinkToEmail = vi.fn()
const mockIsSignInWithEmailLink = vi.fn()
const mockSignInWithEmailLink = vi.fn()
let authStateCallback: ((user: Partial<User> | null) => void) | null = null

const mockSignOut = vi.fn().mockImplementation(() => {
  if (authStateCallback) {
    authStateCallback(null)
  }
  return Promise.resolve()
})

const mockOnAuthStateChanged = vi.fn((_auth: unknown, callback: (user: Partial<User> | null) => void) => {
  authStateCallback = callback
  // Set initial state as unauthenticated
  callback(null)
  return () => {}
})

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: (auth: unknown, email: unknown, pass: unknown) => mockSignInWithEmailAndPassword(auth, email, pass) as Promise<unknown>,
  sendSignInLinkToEmail: (auth: unknown, email: unknown, settings: unknown) => mockSendSignInLinkToEmail(auth, email, settings) as Promise<unknown>,
  isSignInWithEmailLink: (auth: unknown, href: unknown) => mockIsSignInWithEmailLink(auth, href) as boolean,
  signInWithEmailLink: (auth: unknown, email: unknown, href: unknown) => mockSignInWithEmailLink(auth, email, href) as Promise<unknown>,
  signOut: (auth: unknown) => mockSignOut(auth) as Promise<unknown>,
  onAuthStateChanged: (auth: unknown, cb: (user: Partial<User> | null) => void) => mockOnAuthStateChanged(auth, cb),
}))

const mockGetDoc = vi.fn()
const mockGetDocs = vi.fn().mockResolvedValue({ empty: true })
const mockSetDoc = vi.fn().mockResolvedValue({})
const mockDeleteDoc = vi.fn().mockResolvedValue({})
const mockOnSnapshot = vi.fn((ref: unknown, callback: (snapshot: unknown) => void) => {
  void Promise.resolve().then(async () => {
    try {
      const res = (await mockGetDoc(ref)) as { exists: () => boolean; id: string; data: () => Record<string, unknown> } | undefined
      if (res) {
        callback(res)
      } else {
        callback({ exists: () => false })
      }
    } catch {
      callback({ exists: () => false })
    }
  })
  return () => {}
})

vi.mock('firebase/firestore', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
  class MockTimestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() { return new Date(this.seconds * 1000) }
    static now() { return new MockTimestamp(Date.now() / 1000, 0) }
  }
  const collectionRef: any = {
    collection: 'staff',
  }
  collectionRef.withConverter = vi.fn((converter) => {
    collectionRef.converter = converter
    return collectionRef
  })

  return {
    initializeFirestore: vi.fn(),
    persistentLocalCache: vi.fn(),
    doc: vi.fn((colRef: any, id: string) => ({
      id,
      converter: colRef?.converter,
    })),
    getDoc: (ref: unknown) => mockGetDoc(ref) as Promise<unknown>,
    collection: vi.fn(() => collectionRef),
    query: vi.fn((col: any) => ({ col })),
    where: vi.fn(),
    getDocs: (q: unknown) => mockGetDocs(q) as Promise<unknown>,
    setDoc: (ref: unknown, data: unknown) => mockSetDoc(ref, data) as Promise<unknown>,
    deleteDoc: (ref: unknown) => mockDeleteDoc(ref) as Promise<unknown>,
    onSnapshot: (ref: any, cb: (snapshot: any) => void) => {
      const wrappedCb = (snapshot: any) => {
        if (snapshot && ref?.converter) {
          const originalData = snapshot.data()
          snapshot.data = () => ref.converter.fromFirestore({
            id: snapshot.id,
            data: () => originalData,
          })
        }
        cb(snapshot)
      }
      return mockOnSnapshot(ref, wrappedCb)
    },
    Timestamp: MockTimestamp,
  }
})

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}))

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
}))

const mockSyncMyRole = vi.fn().mockResolvedValue({ data: { role: 'customer', updated: false } })

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => mockSyncMyRole),
}))

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn().mockResolvedValue({}),
    },
  }),
}))

describe('useStaffAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authStateCallback = null
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StaffAuthProvider>{children}</StaffAuthProvider>
  )

  it('starts in loading state and resolves to null if no user is authenticated', async () => {
    const { result } = renderHook(() => useStaffAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.user).toBeNull()
    expect(result.current.staffProfile).toBeNull()
  })

  it('loads staff profile if authenticated and profile exists in Firestore', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'staff123',
      data: () => ({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@freshnest.ca',
        role: 'cleaner',
        status: 'active',
      }),
    })

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    // Simulate Auth state change to logged in
    act(() => {
      if (authStateCallback) {
        authStateCallback({ uid: 'staff123', email: 'john@freshnest.ca' })
      }
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual({ uid: 'staff123', email: 'john@freshnest.ca' })
    expect(result.current.staffProfile).toEqual(expect.objectContaining({
      id: 'staff123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@freshnest.ca',
      role: 'cleaner',
      status: 'active',
    }))
    expect(result.current.error).toBeNull()
  })

  it('signs out and sets error if authenticated in Auth but has no staff profile in Firestore', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    })

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    act(() => {
      if (authStateCallback) {
        authStateCallback({ uid: 'intruder123', email: 'intruder@gmail.com' })
      }
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.staffProfile).toBeNull()
    expect(mockSignOut).toHaveBeenCalled()
    expect(result.current.error).toBe('fsm.login.errorNoProfile')
  })

  // HOTFIX-11: real Firebase reports the sign-out after the gate has set the message.
  it('keeps the refusal message when the sign-out is reported afterwards', async () => {
    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    act(() => {
      authStateCallback?.({ uid: 'customer1', email: 'diane@example.ca' })
    })
    await waitFor(() => {
      expect(result.current.error).toBe('fsm.login.errorNoProfile')
    })

    act(() => {
      authStateCallback?.(null)
    })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.user).toBeNull()
    expect(result.current.error).toBe('fsm.login.errorNoProfile')
  })

  it('shows the invalid-credentials error when Firebase rejects the password', async () => {
    mockSignInWithEmailAndPassword.mockRejectedValueOnce(new Error('auth/invalid-credential'))

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    let err: unknown
    await act(async () => {
      try {
        await result.current.signInWithPassword('john@freshnest.ca', 'wrong')
      } catch (e) {
        err = e
      }
    })

    expect(err).toBeDefined()
    expect(result.current.error).toBe('fsm.login.errorInvalid')
  })

  // HOTFIX-11: signed-out visitors can't read `staff`, so sign-in must not look the email up first.
  it('signs in with Firebase Auth directly, without a signed-out staff lookup', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({})

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    await act(async () => {
      await result.current.signInWithPassword('john@freshnest.ca', 'password123')
    })

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'john@freshnest.ca',
      'password123'
    )
    expect(mockGetDocs).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('sends a magic link without a signed-out staff lookup', async () => {
    mockSendSignInLinkToEmail.mockResolvedValueOnce({})

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    await act(async () => {
      await result.current.sendMagicLink('john@freshnest.ca')
    })

    expect(mockSendSignInLinkToEmail).toHaveBeenCalledWith(
      expect.anything(),
      'john@freshnest.ca',
      expect.objectContaining({
        url: (expect.stringContaining('/login') as unknown as string),
        handleCodeInApp: true,
      })
    )
    expect(localStorage.getItem('emailForSignIn')).toBe('john@freshnest.ca')
    expect(result.current.error).toBeNull()
  })

  it('completes magic link sign in successfully', async () => {
    mockIsSignInWithEmailLink.mockReturnValueOnce(true)
    localStorage.setItem('emailForSignIn', 'john@freshnest.ca')
    mockSignInWithEmailLink.mockResolvedValueOnce({})

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    await act(async () => {
      await result.current.completeMagicLinkSignIn()
    })

    expect(mockSignInWithEmailLink).toHaveBeenCalledWith(
      expect.anything(),
      'john@freshnest.ca',
      expect.any(String)
    )
    expect(localStorage.getItem('emailForSignIn')).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('logs out user successfully', async () => {
    mockSignOut.mockResolvedValueOnce({})

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('HOTFIX-10: waits for syncMyRole before rejecting a newly signed-in staff member whose first token has customer role', async () => {
    mockGetDoc.mockReset()
    mockSyncMyRole.mockResolvedValueOnce({ data: { role: 'staff', updated: true } })
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'staff-new-1',
      data: () => ({
        firstName: 'Brenda',
        lastName: 'Côté',
        email: 'brenda@freshnest.ca',
        role: 'lead',
        status: 'active',
      }),
    })

    const getIdTokenResult = vi
      .fn()
      .mockResolvedValueOnce({ claims: { role: 'customer' } })
      .mockResolvedValueOnce({ claims: { role: 'staff' } })

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    act(() => {
      if (authStateCallback) {
        authStateCallback({
          uid: 'staff-new-1',
          email: 'brenda@freshnest.ca',
          getIdTokenResult: getIdTokenResult as unknown as User['getIdTokenResult'],
        })
      }
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockSyncMyRole).toHaveBeenCalledTimes(1)
    expect(getIdTokenResult).toHaveBeenCalledTimes(2)
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(result.current.role).toBe('staff')
    expect(result.current.staffProfile).toEqual(
      expect.objectContaining({
        id: 'staff-new-1',
        email: 'brenda@freshnest.ca',
      }),
    )
    expect(result.current.error).toBeNull()
  })
})
