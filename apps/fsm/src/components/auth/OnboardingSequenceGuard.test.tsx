import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { OnboardingSequenceGuard } from './OnboardingSequenceGuard'
import { useStaffAuth } from '../../hooks/useStaffAuth'
import type { Staff } from '../../types'
import type { User } from 'firebase/auth'

vi.mock('../../hooks/useStaffAuth')

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">FSM App</div>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { current?: number; total?: number }) =>
      options ? `${key} ${options.current}/${options.total}` : key,
  }),
}))

vi.mock('./LanguageSelectionOverlay', () => ({
  LanguageSelectionOverlay: () => <div data-testid="screen-language">Language</div>,
}))
vi.mock('./EmploymentAgreementScreen', () => ({
  EmploymentAgreementScreen: ({ stepLabel }: { stepLabel?: string }) => <div data-testid="screen-agreement">{stepLabel}</div>,
}))
vi.mock('./BackgroundCheckConsentScreen', () => ({
  BackgroundCheckConsentScreen: ({ stepLabel }: { stepLabel?: string }) => <div data-testid="screen-bgcheck">{stepLabel}</div>,
}))
vi.mock('./TermsConsentOverlay', () => ({
  TermsConsentOverlay: ({ stepLabel }: { stepLabel?: string }) => <div data-testid="screen-terms">{stepLabel ?? 'no-label'}</div>,
}))
vi.mock('./EmergencyContactScreen', () => ({
  EmergencyContactScreen: ({ stepLabel }: { stepLabel?: string }) => <div data-testid="screen-emergency">{stepLabel}</div>,
}))

const baseProfile: Staff = {
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
  backgroundCheck: { consentGiven: true, consentGivenAt: new Date(), consentIpAddress: '1.2.3.4', status: 'pending', completedAt: null },
  employmentAgreement: { version: '1.0', acceptedAt: new Date(), signedByName: 'Jasmine Beausoleil', ipAddress: '1.2.3.4' },
  corrections: [],
  probation: null,
  offboarding: null,
  emergencyContact: { name: 'Sam', phone: '6135551111', relationship: 'Sibling' },
  createdAt: new Date(),
}

function mockAuth(staffProfile: Partial<typeof baseProfile> | null, loading = false) {
  vi.mocked(useStaffAuth).mockReturnValue({
    user: staffProfile ? ({ uid: 'staff123' } as unknown as User) : null,
    staffProfile: staffProfile ? (staffProfile as unknown as Staff) : null,
    loading,
    error: null,
    setError: vi.fn(),
    signInWithPassword: vi.fn(),
    sendMagicLink: vi.fn(),
    completeMagicLinkSignIn: vi.fn(),
    logout: vi.fn(),
  })
}

describe('OnboardingSequenceGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the FSM app when every step is complete', () => {
    mockAuth(baseProfile)
    render(<OnboardingSequenceGuard />)
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('shows language selection first when no language is set', () => {
    mockAuth({ ...baseProfile, preferences: { language: undefined as unknown as 'en' } })
    render(<OnboardingSequenceGuard />)
    expect(screen.getByTestId('screen-language')).toBeInTheDocument()
  })

  it('shows the employment agreement (Step 1 of 4) when language is set but agreement is missing', () => {
    mockAuth({ ...baseProfile, employmentAgreement: null })
    render(<OnboardingSequenceGuard />)
    expect(screen.getByTestId('screen-agreement')).toHaveTextContent('fsm.compliance.onboarding.stepLabel 1/4')
  })

  it('shows background check consent (Step 2 of 4) when agreement is done but consent is not', () => {
    mockAuth({
      ...baseProfile,
      backgroundCheck: { ...baseProfile.backgroundCheck, consentGiven: false },
    })
    render(<OnboardingSequenceGuard />)
    expect(screen.getByTestId('screen-bgcheck')).toHaveTextContent('fsm.compliance.onboarding.stepLabel 2/4')
  })

  it('shows terms with Step 3 of 4 label when this is a fresh employee mid-sequence (emergencyContact still null)', () => {
    mockAuth({
      ...baseProfile,
      compliance: { acceptedTermsVersion: null, termsHistory: [] },
      emergencyContact: null,
    })
    render(<OnboardingSequenceGuard />)
    expect(screen.getByTestId('screen-terms')).toHaveTextContent('fsm.compliance.onboarding.stepLabel 3/4')
  })

  it('shows terms with no step label for a returning employee re-prompted after a version bump', () => {
    mockAuth({
      ...baseProfile,
      compliance: { acceptedTermsVersion: '1.0', termsHistory: [] },
      emergencyContact: { name: 'Sam', phone: '6135551111', relationship: 'Sibling' },
    })
    render(<OnboardingSequenceGuard />)
    expect(screen.getByTestId('screen-terms')).toHaveTextContent('no-label')
  })

  it('shows emergency contact (Step 4 of 4) when everything else is done', () => {
    mockAuth({ ...baseProfile, emergencyContact: null })
    render(<OnboardingSequenceGuard />)
    expect(screen.getByTestId('screen-emergency')).toHaveTextContent('fsm.compliance.onboarding.stepLabel 4/4')
  })

  it('shows a loading spinner while staff auth is resolving', () => {
    mockAuth(null, true)
    const { container } = render(<OnboardingSequenceGuard />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
