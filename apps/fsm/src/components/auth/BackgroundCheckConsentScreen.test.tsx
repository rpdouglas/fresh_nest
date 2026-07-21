import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BackgroundCheckConsentScreen } from './BackgroundCheckConsentScreen'
import { useStaffAuth } from '../../hooks/useStaffAuth'
import { httpsCallable } from 'firebase/functions'
import type { Staff } from '../../types'
import type { User } from 'firebase/auth'

const mockCallableFn = vi.fn().mockResolvedValue({ data: { consentGiven: true } })

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => mockCallableFn),
}))

// Mock the app's firebase module directly — avoids initializing real Firebase Auth
// (which throws auth/invalid-api-key without live env vars), matching the pattern
// already used in useNotifications.test.tsx.
vi.mock('../../lib/firebase/firebase', () => ({
  functions: {},
}))

vi.mock('../../hooks/useStaffAuth')

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

describe('BackgroundCheckConsentScreen Component', () => {
  const logoutMock = vi.fn().mockResolvedValue(undefined)

  const mockStaffProfile = {
    id: 'staff123',
    firstName: 'Jasmine',
    lastName: 'Beausoleil',
    email: 'jasmine@freshnest.ca',
    phone: '6135559999',
    role: 'cleaner',
    status: 'onboarding',
    preferences: { language: 'en' },
    constraints: { transportMode: 'personal_vehicle', transitBufferMinutes: 60, blockedWindows: [] },
    financials: { monthlyEarningsLimit: null, currentMonthEarnings: 0, earningsHistory: [] },
    compliance: { acceptedTermsVersion: '2.1', termsHistory: [] },
    onboardingChecklist: {},
    backgroundCheck: {
      consentGiven: false,
      consentGivenAt: null,
      consentIpAddress: null,
      status: 'not_started',
      completedAt: null,
    },
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCallableFn.mockResolvedValue({ data: { consentGiven: true } })
  })

  it('renders nothing when staff profile is not loaded', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: null,
      staffProfile: null,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: logoutMock,
    })

    const { container } = render(<BackgroundCheckConsentScreen />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing once consent has already been given', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: {
        ...mockStaffProfile,
        backgroundCheck: { ...mockStaffProfile.backgroundCheck, consentGiven: true, status: 'pending' },
      } as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: logoutMock,
    })

    const { container } = render(<BackgroundCheckConsentScreen />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the consent screen and requires the checkbox before consenting', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: mockStaffProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: logoutMock,
    })

    act(() => {
      render(<BackgroundCheckConsentScreen />)
    })

    expect(screen.getByText('fsm.compliance.backgroundCheck.title')).toBeInTheDocument()
    const consentBtn = screen.getByRole('button', { name: 'fsm.compliance.backgroundCheck.consentBtn' })
    expect(consentBtn).toBeDisabled()

    const checkbox = screen.getByRole('checkbox')
    act(() => {
      fireEvent.click(checkbox)
    })
    expect(consentBtn).not.toBeDisabled()
  })

  it('calls submitBackgroundCheckConsent callable when consenting', async () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: mockStaffProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: logoutMock,
    })

    act(() => {
      render(<BackgroundCheckConsentScreen />)
    })

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'fsm.compliance.backgroundCheck.consentBtn' }))

    await waitFor(() => {
      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'submitBackgroundCheckConsent')
      expect(mockCallableFn).toHaveBeenCalledTimes(1)
    })
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
      logout: logoutMock,
    })

    render(<BackgroundCheckConsentScreen stepLabel="Step 2 of 4" />)
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
  })

  it('signs the employee out when declining', async () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: mockStaffProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: logoutMock,
    })

    act(() => {
      render(<BackgroundCheckConsentScreen />)
    })

    fireEvent.click(screen.getByRole('button', { name: 'fsm.compliance.backgroundCheck.declineBtn' }))

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1)
    })
  })
})
