import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { EmploymentAgreementScreen } from './EmploymentAgreementScreen'
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
    t: (key: string, options?: { ip?: string }) => {
      if (options && options.ip) return `${key} ${options.ip}`
      return key
    },
    i18n: { language: 'en' },
  }),
}))

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ ip: '127.0.0.1' }),
})
globalThis.fetch = mockFetch

describe('EmploymentAgreementScreen Component', () => {
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
      consentGiven: false, consentGivenAt: null, consentIpAddress: null, status: 'not_started', completedAt: null,
    },
    employmentAgreement: null,
    emergencyContact: null,
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing once the agreement has already been signed', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: {
        ...mockStaffProfile,
        employmentAgreement: { version: '1.0', acceptedAt: new Date(), signedByName: 'Jasmine Beausoleil', ipAddress: '1.2.3.4' },
      } as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = render(<EmploymentAgreementScreen />)
    expect(container.firstChild).toBeNull()
  })

  it('requires both the typed name and the checkbox before signing is enabled', () => {
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
      render(<EmploymentAgreementScreen />)
    })

    const signBtn = screen.getByRole('button', { name: 'fsm.compliance.employmentAgreement.signBtn' })
    expect(signBtn).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox'))
    expect(signBtn).toBeDisabled()

    fireEvent.change(screen.getByLabelText('fsm.compliance.employmentAgreement.signLabel'), { target: { value: 'Jasmine Beausoleil' } })
    expect(signBtn).not.toBeDisabled()
  })

  it('writes employmentAgreement to Firestore when signed', () => {
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
      render(<EmploymentAgreementScreen />)
    })

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.change(screen.getByLabelText('fsm.compliance.employmentAgreement.signLabel'), { target: { value: 'Jasmine Beausoleil' } })

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'fsm.compliance.employmentAgreement.signBtn' }))
    })

    expect(updateDoc).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(updateDoc).mock.calls[0][1] as unknown as { employmentAgreement: { signedByName: string } }
    expect(payload.employmentAgreement.signedByName).toBe('Jasmine Beausoleil')
  })

  it('shows the step label when provided', () => {
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

    render(<EmploymentAgreementScreen stepLabel="Step 1 of 4" />)
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
  })
})
