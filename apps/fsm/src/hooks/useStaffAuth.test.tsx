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
const mockGetDocs = vi.fn()

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  doc: vi.fn(),
  getDoc: (ref: unknown) => mockGetDoc(ref) as Promise<unknown>,
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: (q: unknown) => mockGetDocs(q) as Promise<unknown>,
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}))

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
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
    expect(result.current.staffProfile).toEqual({
      id: 'staff123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@freshnest.ca',
      role: 'cleaner',
      status: 'active',
    })
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

  it('fails password sign-in if email does not exist in staff collection', async () => {
    // mock query checkEmailExists to return empty snapshot
    mockGetDocs.mockResolvedValueOnce({
      empty: true,
    })

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    let err: unknown
    await act(async () => {
      try {
        await result.current.signInWithPassword('notfound@freshnest.ca', 'password123')
      } catch (e) {
        err = e
      }
    })

    expect(err).toBeDefined()
    expect((err as Error).message).toBe('No staff profile found')
    expect(result.current.error).toBe('fsm.login.errorNoProfile')
  })

  it('succeeds password sign-in if email exists in staff collection', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
    })
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
    expect(result.current.error).toBeNull()
  })

  it('fails sendMagicLink if email does not exist in staff collection', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: true,
    })

    const { result } = renderHook(() => useStaffAuth(), { wrapper })

    let err: unknown
    await act(async () => {
      try {
        await result.current.sendMagicLink('notfound@freshnest.ca')
      } catch (e) {
        err = e
      }
    })

    expect(err).toBeDefined()
    expect((err as Error).message).toBe('No staff profile found')
    expect(result.current.error).toBe('fsm.login.errorNoProfile')
  })

  it('succeeds sendMagicLink if email exists in staff collection', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
    })
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
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
    })
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
})
