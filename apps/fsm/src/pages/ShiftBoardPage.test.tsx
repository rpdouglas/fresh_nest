import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ShiftBoardPage } from './ShiftBoardPage'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { useShifts } from '../hooks/useShifts'
import { User } from 'firebase/auth'
import { Staff, OpenShift } from '../types'

// Mock useStaffAuth hook
vi.mock('../hooks/useStaffAuth')

// Mock useShifts hook (keep the real query key export)
vi.mock('../hooks/useShifts', () => ({
  useShifts: vi.fn(),
  AVAILABLE_SHIFTS_QUERY_KEY: ['availableShifts'],
}))

// Mock TanStack Query client (claim invalidates the open-shifts query)
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

// Mock Firebase config functions instance
vi.mock('../lib/firebase/firebase', () => ({
  functions: {},
}))

// Mock firebase functions
const mockClaimJobFn = vi.fn().mockResolvedValue({ data: { success: true, newEarnings: 800 } })
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => mockClaimJobFn),
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options) {
        return `${key}_opt_${JSON.stringify(options)}`
      }
      return key
    },
    i18n: { language: 'en' },
  }),
}))

describe('ShiftBoardPage Component', () => {
  const mockStaffProfile = {
    id: 'staff123',
    firstName: 'Carla',
    lastName: 'ODSP',
    email: 'carla@freshnest.ca',
    role: 'cleaner',
    status: 'active',
    financials: {
      monthlyEarningsLimit: 1000,
      currentMonthEarnings: 500,
      earningsHistory: [],
    },
  }

  // listOpenShifts response shape — PII-minimised, eligibility evaluated server-side
  const makeShift = (overrides: Partial<OpenShift> & { id: string }): OpenShift => ({
    serviceType: 'standard',
    scheduledDate: '2026-06-20',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    payRate: 25,
    area: { municipality: 'Cornwall', postalPrefix: 'K6H' },
    eligibility: { durationHours: 2, estimatedPay: 50, overage: 0, travelConflict: null },
    ...overrides,
  })

  const mockShifts: OpenShift[] = [
    makeShift({ id: 'job1' }),
    makeShift({
      id: 'job2',
      serviceType: 'deep',
      scheduledDate: '2026-06-21',
      scheduledStartTime: '13:00',
      scheduledEndTime: '16:00',
      payRate: 30,
      area: { municipality: 'Long Sault', postalPrefix: null },
      eligibility: { durationHours: 3, estimatedPay: 90, overage: 0, travelConflict: null },
    }),
  ]

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

    vi.mocked(useShifts).mockReturnValue({
      shifts: mockShifts,
      isLoading: false,
      error: null,
    })
  })

  it('renders available shifts list without ODSP card if cap is not configured', () => {
    // Disable limit
    const profileNoLimit = {
      ...mockStaffProfile,
      financials: {
        ...mockStaffProfile.financials,
        monthlyEarningsLimit: null,
      },
    }
    vi.mocked(useStaffAuth).mockReturnValueOnce({
      ...vi.mocked(useStaffAuth)(),
      staffProfile: profileNoLimit as unknown as Staff,
    })

    render(<ShiftBoardPage />)

    // Header & subtitle should be visible
    expect(screen.getByText('fsm.shifts.title')).toBeInTheDocument()
    expect(screen.getByText('fsm.shifts.subtitle')).toBeInTheDocument()

    // ODSP tracker card should NOT be visible
    expect(screen.queryByText('fsm.profile.odsp.title')).not.toBeInTheDocument()

    // Service area only — no street address before claiming (HOTFIX-02)
    expect(screen.getByText('Cornwall · K6H')).toBeInTheDocument()
    expect(screen.getByText('Long Sault')).toBeInTheDocument()
    expect(screen.getAllByText('fsm.shifts.addressAfterClaim')).toHaveLength(2)
    expect(screen.getByText('fsm.shifts.serviceTypes.deep_opt_{"defaultValue":"deep"}')).toBeInTheDocument()

    // Estimated pay label with correct mock translation option format
    expect(
      screen.getByText('fsm.shifts.estimatedPay_opt_{"pay":50,"hours":2,"rate":25}')
    ).toBeInTheDocument()
    expect(
      screen.getByText('fsm.shifts.estimatedPay_opt_{"pay":90,"hours":3,"rate":30}')
    ).toBeInTheDocument()
  })

  it('renders ODSP tracker in "safe" state when earnings are low', () => {
    const profileSafe = {
      ...mockStaffProfile,
      financials: {
        monthlyEarningsLimit: 1000,
        currentMonthEarnings: 300,
      },
    }
    vi.mocked(useStaffAuth).mockReturnValueOnce({
      ...vi.mocked(useStaffAuth)(),
      staffProfile: profileSafe as unknown as Staff,
    })

    const { container } = render(<ShiftBoardPage />)

    // Current earnings label check
    expect(screen.getByText('$300 / $1000')).toBeInTheDocument()

    // Safe state label check
    expect(screen.getByText('fsm.profile.odsp.gauge.safe: fsm.profile.odsp.messages.safe')).toBeInTheDocument()

    // Gauge bar color check (emerald-500)
    const gauge = container.querySelector('.bg-emerald-500')
    expect(gauge).toBeInTheDocument()
  })

  it('renders ODSP tracker in "caution" state when approaching limit', () => {
    const profileCaution = {
      ...mockStaffProfile,
      financials: {
        monthlyEarningsLimit: 1000,
        currentMonthEarnings: 800,
      },
    }
    vi.mocked(useStaffAuth).mockReturnValueOnce({
      ...vi.mocked(useStaffAuth)(),
      staffProfile: profileCaution as unknown as Staff,
    })

    const { container } = render(<ShiftBoardPage />)

    expect(screen.getByText('$800 / $1000')).toBeInTheDocument()
    expect(screen.getByText('fsm.profile.odsp.gauge.caution: fsm.profile.odsp.messages.caution')).toBeInTheDocument()

    const gauge = container.querySelector('.bg-amber-500')
    expect(gauge).toBeInTheDocument()
  })

  it('renders ODSP tracker in "at_limit" state when cap is nearly or fully reached', () => {
    const profileAtLimit = {
      ...mockStaffProfile,
      financials: {
        monthlyEarningsLimit: 1000,
        currentMonthEarnings: 950,
      },
    }
    vi.mocked(useStaffAuth).mockReturnValueOnce({
      ...vi.mocked(useStaffAuth)(),
      staffProfile: profileAtLimit as unknown as Staff,
    })

    const { container } = render(<ShiftBoardPage />)

    expect(screen.getByText('$950 / $1000')).toBeInTheDocument()
    expect(screen.getByText('fsm.profile.odsp.gauge.at_limit: fsm.profile.odsp.messages.at_limit')).toBeInTheDocument()

    const gauge = container.querySelector('.bg-red-500')
    expect(gauge).toBeInTheDocument()
  })

  it('disables the claim button and shows overage when the server reports one (P7)', () => {
    vi.mocked(useShifts).mockReturnValue({
      shifts: [
        mockShifts[0],
        { ...mockShifts[1], eligibility: { ...mockShifts[1].eligibility, overage: 10 } },
      ],
      isLoading: false,
      error: null,
    })

    render(<ShiftBoardPage />)

    const buttons = screen.getAllByRole('button', { name: 'fsm.shifts.claimBtn' })
    expect(buttons[0]).not.toBeDisabled()
    expect(buttons[1]).toBeDisabled()
    expect(
      screen.getByText('⚠️ fsm.shifts.disabledOverage_opt_{"overage":10}')
    ).toBeInTheDocument()
  })

  it('successfully invokes callable claim function on click', async () => {
    render(<ShiftBoardPage />)

    const buttons = screen.getAllByRole('button', { name: 'fsm.shifts.claimBtn' })
    
    await act(async () => {
      fireEvent.click(buttons[0])
      await Promise.resolve()
    })

    expect(mockClaimJobFn).toHaveBeenCalledWith({ jobId: 'job1' })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['availableShifts'] })
    expect(screen.getByText('fsm.shifts.claimingSuccess')).toBeInTheDocument()
  })

  it('disables the claim button and shows travel conflict when the server reports one (P8)', () => {
    vi.mocked(useShifts).mockReturnValue({
      shifts: [
        makeShift({
          id: 'job1',
          eligibility: {
            durationHours: 2,
            estimatedPay: 50,
            overage: 0,
            travelConflict: { startTime: '10:00', endTime: '12:00', bufferMinutes: 60 },
          },
        }),
      ],
      isLoading: false,
      error: null,
    })

    render(<ShiftBoardPage />)

    const button = screen.getByRole('button', { name: 'fsm.shifts.claimBtn' })
    expect(button).toBeDisabled()
    expect(
      screen.getByText('⚠️ fsm.shifts.disabledConflict_opt_{"buffer":60,"start":"10:00","end":"12:00"}')
    ).toBeInTheDocument()
  })

  it('shows a plain-language translated error when shifts fail to load (P14)', () => {
    vi.mocked(useShifts).mockReturnValue({
      shifts: [],
      isLoading: false,
      error: new Error('internal'),
    })

    render(<ShiftBoardPage />)

    expect(screen.getByText('fsm.shifts.loadError')).toBeInTheDocument()
    expect(screen.queryByText(/internal/)).not.toBeInTheDocument()
  })
})
