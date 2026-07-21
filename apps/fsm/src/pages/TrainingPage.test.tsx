import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TrainingPage } from './TrainingPage'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { httpsCallable } from 'firebase/functions'
import { TRAINING_MODULES } from '../lib/data/trainingModules'
import type { Staff } from '../types'
import type { User } from 'firebase/auth'

const mockCallableFn = vi.fn().mockResolvedValue({ data: { success: true } })

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => mockCallableFn),
}))

vi.mock('../lib/firebase/firebase', () => ({
  functions: {},
}))

vi.mock('../hooks/useStaffAuth')

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: number; completed?: number; total?: number }) => {
      if (options?.number !== undefined) return `${key} ${options.number}`
      if (options?.completed !== undefined) return `${key} ${options.completed}/${options.total}`
      return key
    },
  }),
}))

describe('TrainingPage Component', () => {
  const mockStaffProfile = {
    id: 'staff123',
    firstName: 'Jasmine',
    lastName: 'Beausoleil',
    email: 'jasmine@freshnest.ca',
    phone: '6135559999',
    role: 'cleaner',
    status: 'active',
    preferences: { language: 'en' },
    constraints: { transportMode: 'personal_vehicle', transitBufferMinutes: 60, blockedWindows: [] },
    financials: { monthlyEarningsLimit: null, currentMonthEarnings: 0, earningsHistory: [] },
    compliance: { acceptedTermsVersion: '2.1', termsHistory: [] },
    onboardingChecklist: {},
    backgroundCheck: { consentGiven: true, consentGivenAt: new Date(), consentIpAddress: '1.2.3.4', status: 'cleared', completedAt: new Date() },
    employmentAgreement: { version: '1.0', acceptedAt: new Date(), signedByName: 'Jasmine Beausoleil', ipAddress: '1.2.3.4' },
    emergencyContact: { name: 'Sam', phone: '6135551111', relationship: 'Sibling' },
    corrections: [],
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCallableFn.mockResolvedValue({ data: { success: true } })
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
  })

  it('lists all six modules with progress and a legally-required badge on WHMIS', () => {
    render(<TrainingPage />)

    expect(screen.getByText('fsm.training.progressLabel 0/6')).toBeInTheDocument()
    TRAINING_MODULES.forEach((m) => {
      expect(screen.getByText(new RegExp(m.titleKey))).toBeInTheDocument()
    })
    // Only WHMIS (module4Whmis) should carry the legally-required badge
    expect(screen.getAllByText('fsm.training.legallyRequiredBadge')).toHaveLength(1)
  })

  it('opens a module, requires all quiz answers to be correct before completing', () => {
    render(<TrainingPage />)

    const module1 = TRAINING_MODULES.find((m) => m.id === 'module1Welcome')!
    fireEvent.click(screen.getByText(new RegExp(module1.titleKey)))

    const completeBtn = screen.getByRole('button', { name: 'fsm.training.quiz.completeBtn' })
    expect(completeBtn).toBeDisabled()

    // Answer all questions incorrectly (choice index 0 for all — module1's answers are 1,0,2)
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[0]) // q1 choice 0 (incorrect — correct is index 1)
    fireEvent.click(radios[3]) // q2 choice 0 (correct)
    fireEvent.click(radios[6]) // q3 choice 0 (incorrect — correct is index 2)

    expect(screen.getByText('fsm.training.quiz.incorrectHint')).toBeInTheDocument()
    expect(completeBtn).toBeDisabled()
  })

  it('enables completion once all answers are correct and calls completeTrainingModule', async () => {
    render(<TrainingPage />)

    const module1 = TRAINING_MODULES.find((m) => m.id === 'module1Welcome')!
    fireEvent.click(screen.getByText(new RegExp(module1.titleKey)))

    const radios = screen.getAllByRole('radio')
    // module1Welcome correct indices: q1=1, q2=0, q3=2
    fireEvent.click(radios[1]) // q1 choice 1 (correct)
    fireEvent.click(radios[3]) // q2 choice 0 (correct)
    fireEvent.click(radios[8]) // q3 choice 2 (correct)

    expect(screen.getByText('fsm.training.quiz.allCorrectMsg')).toBeInTheDocument()

    const completeBtn = screen.getByRole('button', { name: 'fsm.training.quiz.completeBtn' })
    expect(completeBtn).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(completeBtn)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'completeTrainingModule')
      expect(mockCallableFn).toHaveBeenCalledWith({ moduleId: 'module1Welcome' })
    })
  })

  it('shows a completed badge for modules already marked done', () => {
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123' } as unknown as User,
      staffProfile: {
        ...mockStaffProfile,
        onboardingChecklist: { module1Welcome: true },
      } as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    render(<TrainingPage />)
    expect(screen.getByText('fsm.training.progressLabel 1/6')).toBeInTheDocument()
    expect(screen.getAllByText('fsm.training.completedBadge')).toHaveLength(1)
  })
})
