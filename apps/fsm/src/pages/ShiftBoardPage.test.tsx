import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ShiftBoardPage } from './ShiftBoardPage'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { useShifts } from '../hooks/useShifts'
import { useMyAssignedShifts } from '../hooks/useMyAssignedShifts'
import { User } from 'firebase/auth'
import { Staff, Job } from '../types'

// Mock useStaffAuth hook
vi.mock('../hooks/useStaffAuth')

// Mock useShifts hook
vi.mock('../hooks/useShifts')

// Mock useMyAssignedShifts hook
vi.mock('../hooks/useMyAssignedShifts')

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

  const mockShifts = [
    {
      id: 'job1',
      serviceType: 'standard',
      scheduledDate: '2026-06-20',
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
      clientAddress: '123 Pitt St, Cornwall ON',
      payRateSnapshot: { amount: 25 },
      status: 'unassigned',
    },
    {
      id: 'job2',
      serviceType: 'deep',
      scheduledDate: '2026-06-21',
      scheduledStartTime: '13:00',
      scheduledEndTime: '16:00',
      clientAddress: '456 Montreal Rd, Cornwall ON',
      payRateSnapshot: { amount: 30 },
      status: 'unassigned',
    },
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
      shifts: mockShifts as unknown as Job[],
      isLoading: false,
      error: null,
    })

    vi.mocked(useMyAssignedShifts).mockReturnValue({
      assignedShifts: [],
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

    // Shift details check
    expect(screen.getByText('123 Pitt St, Cornwall ON')).toBeInTheDocument()
    expect(screen.getByText('456 Montreal Rd, Cornwall ON')).toBeInTheDocument()

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

  it('disables the claim button and shows overage if shift pay exceeds remaining limit', () => {
    const profileTightLimit = {
      ...mockStaffProfile,
      financials: {
        monthlyEarningsLimit: 1000,
        currentMonthEarnings: 920, // remaining is $80
      },
    }
    vi.mocked(useStaffAuth).mockReturnValueOnce({
      ...vi.mocked(useStaffAuth)(),
      staffProfile: profileTightLimit as unknown as Staff,
    })

    render(<ShiftBoardPage />)

    // Job 1 is $50 (remaining $80) -> Claim button should be ENABLED
    const buttons = screen.getAllByRole('button', { name: 'fsm.shifts.claimBtn' })
    expect(buttons[0]).not.toBeDisabled()

    // Job 2 is $90 (remaining $80) -> Exceeds limit by $10
    // The second button should be disabled, and the warning text should show.
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
    expect(screen.getByText('fsm.shifts.claimingSuccess')).toBeInTheDocument()
  })

  it('disables the claim button and shows travel conflict warning if shift violates travel buffer', () => {
    const mockAssignedShifts = [
      {
        id: 'assignedJob1',
        serviceType: 'standard',
        scheduledDate: '2026-06-20',
        scheduledStartTime: '10:00',
        scheduledEndTime: '12:00',
        clientAddress: '123 Pitt St, Cornwall ON',
        payRateSnapshot: { amount: 25 },
        status: 'assigned',
      }
    ]

    vi.mocked(useMyAssignedShifts).mockReturnValue({
      assignedShifts: mockAssignedShifts as unknown as Job[],
      isLoading: false,
      error: null,
    })

    const transitProfile = {
      ...mockStaffProfile,
      constraints: {
        transportMode: 'transit',
        transitBufferMinutes: 60,
      }
    }

    vi.mocked(useStaffAuth).mockReturnValueOnce({
      ...vi.mocked(useStaffAuth)(),
      staffProfile: transitProfile as unknown as Staff,
    })

    render(<ShiftBoardPage />)

    const buttons = screen.getAllByRole('button', { name: 'fsm.shifts.claimBtn' })
    expect(buttons[0]).toBeDisabled()
    expect(
      screen.getByText('⚠️ fsm.shifts.disabledConflict_opt_{"buffer":60,"start":"10:00","end":"12:00"}')
    ).toBeInTheDocument()
  })

  it('hides the shift completely if it overlaps with a blocked window', () => {
    const blockedProfile = {
      ...mockStaffProfile,
      constraints: {
        transportMode: 'transit',
        transitBufferMinutes: 30,
        blockedWindows: [
          {
            id: 'block1',
            dayOfWeek: 6, // Saturday (2026-06-20 is Saturday)
            startTime: '10:00',
            endTime: '12:00',
            recurring: true,
            label: 'Recovery meeting',
          },
          {
            id: 'block2',
            dayOfWeek: 0, // Sunday (2026-06-21 is Sunday)
            startTime: '08:00',
            endTime: '10:00',
            recurring: true,
            label: 'Sunday morning',
          }
        ],
      },
    }

    vi.mocked(useStaffAuth).mockReturnValueOnce({
      ...vi.mocked(useStaffAuth)(),
      staffProfile: blockedProfile as unknown as Staff,
    })

    render(<ShiftBoardPage />)

    // job1 (2026-06-20 Saturday 09:00 - 11:00) overlaps with block1 (10:00 - 12:00) -> should be hidden
    expect(screen.queryByText('123 Pitt St, Cornwall ON')).not.toBeInTheDocument()

    // job2 (2026-06-21 Sunday 13:00 - 16:00) does not overlap with block2 (08:00 - 10:00) -> should be visible
    expect(screen.getByText('456 Montreal Rd, Cornwall ON')).toBeInTheDocument()
  })
})
