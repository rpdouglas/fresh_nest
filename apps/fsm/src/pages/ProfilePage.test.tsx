import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ProfilePage from './ProfilePage'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { updateDoc, arrayUnion } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { Staff } from '../types'

// Mock firebase firestore
vi.mock('firebase/firestore', () => {
  const collectionRef = {
    withConverter: vi.fn().mockReturnThis(),
  }
  return {
    collection: vi.fn(() => collectionRef),
    doc: vi.fn(() => ({ id: 'staff123' })),
    updateDoc: vi.fn().mockResolvedValue({}),
    arrayUnion: vi.fn((val: unknown) => ({ __arrayUnion: val })),
    initializeFirestore: vi.fn(),
    persistentLocalCache: vi.fn(),
  }
})

// Mock the app's firebase module directly — avoids initializing real Firebase Auth
// (which throws auth/invalid-api-key without live env vars), matching the pattern
// already used in useNotifications.test.tsx / BackgroundCheckConsentScreen.test.tsx.
vi.mock('../lib/firebase/firebase', () => ({
  db: {},
}))

// Mock useStaffAuth hook
vi.mock('../hooks/useStaffAuth')

const mockChangeLanguage = vi.fn().mockResolvedValue(undefined)

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: mockChangeLanguage },
  }),
}))

describe('ProfilePage Component', () => {
  const mockStaffProfile = {
    id: 'staff123',
    firstName: 'Carla',
    lastName: 'ODSP',
    email: 'carla@freshnest.ca',
    phone: '6135551234',
    role: 'cleaner',
    status: 'active',
    preferences: {
      language: 'en',
    },
    constraints: {
      transportMode: 'personal_vehicle',
      transitBufferMinutes: 60,
      blockedWindows: [
        {
          id: 'w1',
          dayOfWeek: 2, // Tuesday
          startTime: '19:00',
          endTime: '20:30',
          recurring: true,
          label: 'Support Meeting',
        },
      ],
    },
    financials: {
      monthlyEarningsLimit: 1000,
      currentMonthEarnings: 750,
      earningsHistory: [],
    },
    compliance: {
      acceptedTermsVersion: '1.0',
      termsHistory: [],
    },
    onboardingChecklist: {},
    backgroundCheck: {
      consentGiven: true, consentGivenAt: new Date(), consentIpAddress: '1.2.3.4', status: 'cleared', completedAt: new Date(),
    },
    employmentAgreement: { version: '1.0', acceptedAt: new Date(), signedByName: 'Carla ODSP', ipAddress: '1.2.3.4' },
    emergencyContact: { name: 'Pat ODSP', phone: '6135559999', relationship: 'Spouse' },
    corrections: [],
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123', email: 'carla@freshnest.ca' } as unknown as User,
      staffProfile: mockStaffProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })
  })

  it('renders read-only personal details and an editable phone field', () => {
    render(<ProfilePage />)

    expect(screen.getByText('Carla')).toBeInTheDocument()
    expect(screen.getByText('ODSP')).toBeInTheDocument()
    expect(screen.getByText('carla@freshnest.ca')).toBeInTheDocument()
    expect(screen.getByLabelText('fsm.profile.phone')).toHaveValue('6135551234')
  })

  it('shows a status badge (P3-E27-C2)', () => {
    render(<ProfilePage />)
    expect(screen.getByText('fsm.profile.statuses.active')).toBeInTheDocument()
  })

  it('shows and hides transit buffer based on transport mode selection', () => {
    render(<ProfilePage />)

    // Initial state: personal_vehicle, transit buffer should NOT be visible
    expect(screen.queryByLabelText('fsm.profile.transport.buffer')).not.toBeInTheDocument()

    // Change transport mode to transit
    const select = screen.getByLabelText('fsm.profile.transport.mode')
    fireEvent.change(select, { target: { value: 'transit' } })

    // Transit buffer should now be visible
    expect(screen.getByLabelText('fsm.profile.transport.buffer')).toBeInTheDocument()
  })

  it('adds and removes blocked windows in local state', () => {
    render(<ProfilePage />)

    // Initially shows existing blocked window
    expect(screen.getByText('Support Meeting')).toBeInTheDocument()

    // Add new window
    fireEvent.change(screen.getByLabelText('fsm.profile.blockedWindows.label'), { target: { value: 'Childcare' } })
    fireEvent.change(screen.getByLabelText('fsm.profile.blockedWindows.start'), { target: { value: '14:00' } })
    fireEvent.change(screen.getByLabelText('fsm.profile.blockedWindows.end'), { target: { value: '16:00' } })
    
    // Day of week defaults to Monday (1), let's click Add button
    const addBtn = screen.getByRole('button', { name: 'fsm.profile.blockedWindows.addBtn' })
    fireEvent.click(addBtn)

    // Should appear in list
    expect(screen.getByText('Childcare')).toBeInTheDocument()

    // Remove the Support Meeting window
    const deleteBtns = screen.getAllByRole('button', { name: 'fsm.profile.blockedWindows.deleteBtn' })
    // The first one should correspond to Support Meeting
    fireEvent.click(deleteBtns[0])

    // Support Meeting should be removed
    expect(screen.queryByText('Support Meeting')).not.toBeInTheDocument()
  })

  it('displays the ODSP meter and safety messages', () => {
    render(<ProfilePage />)

    // Limit is 1000, current earnings is 750 (75% -> Approaching Limit / Caution)
    expect(screen.getByText('$750 / $1000')).toBeInTheDocument()
    expect(screen.getByText('fsm.profile.odsp.gauge.caution')).toBeInTheDocument()
  })

  it('submits updated profile settings to firestore', async () => {
    render(<ProfilePage />)

    const saveBtn = screen.getByRole('button', { name: 'fsm.profile.saving' })
    
    await act(async () => {
      fireEvent.click(saveBtn)
      await Promise.resolve()
    })

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'constraints.transportMode': 'personal_vehicle',
        'constraints.transitBufferMinutes': 60,
        'financials.monthlyEarningsLimit': 1000,
        phone: '6135551234',
        'preferences.language': 'en',
      })
    )
  })

  it('saves an edited phone number (P3-E27-C2)', async () => {
    render(<ProfilePage />)

    fireEvent.change(screen.getByLabelText('fsm.profile.phone'), { target: { value: '6135550000' } })

    const saveBtn = screen.getByRole('button', { name: 'fsm.profile.saving' })
    await act(async () => {
      fireEvent.click(saveBtn)
      await Promise.resolve()
    })

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ phone: '6135550000' })
    )
  })

  it('changes the FSM UI language on save when the language selector changes', async () => {
    render(<ProfilePage />)

    fireEvent.change(screen.getByLabelText('fsm.profile.language'), { target: { value: 'fr' } })

    const saveBtn = screen.getByRole('button', { name: 'fsm.profile.saving' })
    await act(async () => {
      fireEvent.click(saveBtn)
      await Promise.resolve()
    })

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ 'preferences.language': 'fr' })
    )
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr')
  })

  it('pre-fills the emergency contact card from staffProfile.emergencyContact', () => {
    render(<ProfilePage />)

    expect(screen.getByLabelText('fsm.profile.emergencyContact.nameLabel')).toHaveValue('Pat ODSP')
    expect(screen.getByLabelText('fsm.profile.emergencyContact.relationshipLabel')).toHaveValue('Spouse')
    expect(screen.getByLabelText('fsm.profile.emergencyContact.phoneLabel')).toHaveValue('6135559999')
  })

  it('saves an updated emergency contact', async () => {
    render(<ProfilePage />)

    fireEvent.change(screen.getByLabelText('fsm.profile.emergencyContact.nameLabel'), { target: { value: 'Sam ODSP' } })

    const saveBtn = screen.getByRole('button', { name: 'fsm.profile.saving' })
    await act(async () => {
      fireEvent.click(saveBtn)
      await Promise.resolve()
    })

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        emergencyContact: { name: 'Sam ODSP', phone: '6135559999', relationship: 'Spouse' },
      })
    )
  })

  it('rejects an incomplete emergency contact edit instead of saving', async () => {
    render(<ProfilePage />)

    fireEvent.change(screen.getByLabelText('fsm.profile.emergencyContact.nameLabel'), { target: { value: '' } })

    const saveBtn = screen.getByRole('button', { name: 'fsm.profile.saving' })
    await act(async () => {
      fireEvent.click(saveBtn)
      await Promise.resolve()
    })

    expect(updateDoc).not.toHaveBeenCalled()
    expect(screen.getByText('fsm.profile.emergencyContact.incompleteError')).toBeInTheDocument()
  })

  it('flags a correction via arrayUnion without disturbing other fields', async () => {
    render(<ProfilePage />)

    fireEvent.change(screen.getByLabelText('fsm.profile.corrections.label'), { target: { value: 'My last name is misspelled' } })

    const saveBtn = screen.getByRole('button', { name: 'fsm.profile.saving' })
    await act(async () => {
      fireEvent.click(saveBtn)
      await Promise.resolve()
    })

    expect(arrayUnion).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'My last name is misspelled' })
    )
    const payload = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<string, unknown>
    expect(payload).toHaveProperty('corrections')
  })

  it('does not touch corrections when the correction field is left empty', async () => {
    render(<ProfilePage />)

    const saveBtn = screen.getByRole('button', { name: 'fsm.profile.saving' })
    await act(async () => {
      fireEvent.click(saveBtn)
      await Promise.resolve()
    })

    expect(arrayUnion).not.toHaveBeenCalled()
    const payload = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<string, unknown>
    expect(payload).not.toHaveProperty('corrections')
  })
})
