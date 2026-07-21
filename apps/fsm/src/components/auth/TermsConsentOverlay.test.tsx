import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TermsConsentOverlay } from './TermsConsentOverlay'
import { useStaffAuth } from '../../hooks/useStaffAuth'
import { updateDoc } from 'firebase/firestore'
import type { Staff } from '../../types'
import type { User } from 'firebase/auth'

vi.mock('firebase/firestore', () => {
  const collectionRef = {
    withConverter: vi.fn().mockReturnThis(),
  }
  return {
    collection: vi.fn(() => collectionRef),
    doc: vi.fn(() => ({ id: 'staff123' })),
    updateDoc: vi.fn().mockResolvedValue({}),
    arrayUnion: vi.fn((val: unknown) => val),
    initializeFirestore: vi.fn(),
    persistentLocalCache: vi.fn(),
  }
})

// Mock the app's firebase module directly — avoids initializing real Firebase Auth
// (which throws auth/invalid-api-key without live env vars), matching the pattern
// already used in useNotifications.test.tsx / BackgroundCheckConsentScreen.test.tsx.
vi.mock('../../lib/firebase/firebase', () => ({
  db: {},
}))

vi.mock('../../hooks/useStaffAuth')

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { version?: string; ip?: string }) => {
      if (options && options.version) return `${key} ${options.version}`
      if (options && options.ip) return `${key} ${options.ip}`
      return key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock fetch for IP address
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ ip: '127.0.0.1' }),
})
globalThis.fetch = mockFetch

describe('TermsConsentOverlay Component', () => {
  const mockStaffProfile = {
    id: 'staff123',
    firstName: 'Ahmed',
    lastName: 'ESL',
    email: 'ahmed@freshnest.ca',
    phone: '6135559999',
    role: 'cleaner',
    status: 'active',
    preferences: { language: 'en' },
    constraints: { transportMode: 'personal_vehicle', transitBufferMinutes: 60, blockedWindows: [] },
    financials: { monthlyEarningsLimit: 1000, currentMonthEarnings: 0, earningsHistory: [] },
    compliance: {
      acceptedTermsVersion: '2.0',
      termsHistory: [],
    },
    onboardingChecklist: {},
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when user is not logged in', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: null,
      staffProfile: null,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = render(<TermsConsentOverlay />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when terms are up to date', () => {
    const upToDateProfile = {
      ...mockStaffProfile,
      compliance: {
        acceptedTermsVersion: '2.1',
        termsHistory: [],
      },
    }

    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: upToDateProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = render(<TermsConsentOverlay />)
    expect(container.firstChild).toBeNull()
  })

  it('renders consent overlay when acceptedTermsVersion is null (P3-E27-A1 migration case)', () => {
    // Staff registered before A1 fix (or migrated) will have acceptedTermsVersion: null
    const nullComplianceProfile = {
      ...mockStaffProfile,
      compliance: {
        acceptedTermsVersion: null,
        termsHistory: [],
      },
    }

    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: nullComplianceProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    act(() => {
      render(<TermsConsentOverlay />)
    })

    // Overlay must appear — null means no consent was ever collected
    expect(screen.getByText('fsm.compliance.terms.title')).toBeInTheDocument()
    const acceptBtn = screen.getByRole('button', { name: 'fsm.compliance.terms.acceptBtn' })
    expect(acceptBtn).toBeDisabled()
  })

  it('renders consent overlay when terms version is outdated', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: mockStaffProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    act(() => {
      render(<TermsConsentOverlay />)
    })

    expect(screen.getByText('fsm.compliance.terms.title')).toBeInTheDocument()
    expect(screen.getByText('fsm.compliance.terms.versionLabel 2.1')).toBeInTheDocument()

    const acceptBtn = screen.getByRole('button', { name: 'fsm.compliance.terms.acceptBtn' })
    expect(acceptBtn).toBeDisabled()
  })

  it('enables accept button when checkbox is checked, and calls updateDoc on click', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: mockStaffProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    act(() => {
      render(<TermsConsentOverlay />)
    })

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    act(() => {
      fireEvent.click(checkbox)
    })
    expect(checkbox).toBeChecked()

    const acceptBtn = screen.getByRole('button', { name: 'fsm.compliance.terms.acceptBtn' })
    expect(acceptBtn).not.toBeDisabled()

    act(() => {
      fireEvent.click(acceptBtn)
    })

    expect(updateDoc).toHaveBeenCalledTimes(1)
  })

  it('shows the step label when provided (P3-E27-C1)', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: mockStaffProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    render(<TermsConsentOverlay stepLabel="Step 3 of 4" />)
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
  })
})
