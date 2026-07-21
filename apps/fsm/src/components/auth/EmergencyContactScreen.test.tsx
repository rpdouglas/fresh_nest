import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { EmergencyContactScreen } from './EmergencyContactScreen'
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
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

describe('EmergencyContactScreen Component', () => {
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
      consentGiven: true, consentGivenAt: new Date(), consentIpAddress: '1.2.3.4', status: 'pending', completedAt: null,
    },
    employmentAgreement: { version: '1.0', acceptedAt: new Date(), signedByName: 'Jasmine Beausoleil', ipAddress: '1.2.3.4' },
    emergencyContact: null,
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing once an emergency contact is already saved', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: {
        ...mockStaffProfile,
        emergencyContact: { name: 'Sam Beausoleil', phone: '6135551111', relationship: 'Sibling' },
      } as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = render(<EmergencyContactScreen />)
    expect(container.firstChild).toBeNull()
  })

  it('requires all three fields before saving is enabled, then writes to Firestore', () => {
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
      render(<EmergencyContactScreen />)
    })

    const saveBtn = screen.getByRole('button', { name: 'fsm.compliance.emergencyContact.saveBtn' })
    expect(saveBtn).toBeDisabled()

    fireEvent.change(screen.getByLabelText('fsm.compliance.emergencyContact.nameLabel'), { target: { value: 'Sam Beausoleil' } })
    fireEvent.change(screen.getByLabelText('fsm.compliance.emergencyContact.relationshipLabel'), { target: { value: 'Sibling' } })
    expect(saveBtn).toBeDisabled()

    fireEvent.change(screen.getByLabelText('fsm.compliance.emergencyContact.phoneLabel'), { target: { value: '6135551111' } })
    expect(saveBtn).not.toBeDisabled()

    act(() => {
      fireEvent.click(saveBtn)
    })

    expect(updateDoc).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(updateDoc).mock.calls[0][1] as unknown as { emergencyContact: { name: string } }
    expect(payload.emergencyContact.name).toBe('Sam Beausoleil')
  })
})
