import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { MyJobsPage } from './MyJobsPage'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { useMyAssignedShifts } from '../hooks/useMyAssignedShifts'
import { User } from 'firebase/auth'
import { Staff, Job } from '../types'

// Mock useStaffAuth hook
vi.mock('../hooks/useStaffAuth')

// Mock useMyAssignedShifts hook
vi.mock('../hooks/useMyAssignedShifts')

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && Object.keys(options).filter(k => k !== 'defaultValue').length > 0) {
        return `${key}_opt_${JSON.stringify(options)}`
      }
      return key
    },
    i18n: { language: 'en' },
  }),
}))

describe('MyJobsPage Component', () => {
  const mockStaffProfile = {
    uid: 'staff123',
    firstName: 'Jasmine',
    lastName: 'Transit',
    email: 'jasmine@freshnest.ca',
    role: 'cleaner',
    status: 'active',
  }

  const mockAssignedShifts = [
    {
      id: 'job1',
      bookingId: 'booking1',
      serviceType: 'standard',
      scheduledDate: '2026-06-20',
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
      clientName: 'Client A',
      clientAddress: '123 Pitt St, Cornwall ON',
      clientPhone: '613-555-0101',
      payRateSnapshot: { amount: 25 },
      status: 'assigned',
      createdAt: new Date(),
    },
    {
      id: 'job2',
      bookingId: 'booking2',
      serviceType: 'deep',
      scheduledDate: '2026-06-21',
      scheduledStartTime: '13:00',
      scheduledEndTime: '16:00',
      clientName: 'Client B',
      clientAddress: '456 Montreal Rd, Cornwall ON',
      clientPhone: '613-555-0202',
      payRateSnapshot: { amount: 30 },
      status: 'completed',
      createdAt: new Date(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStaffAuth).mockReturnValue({
      user: { uid: 'staff123', email: 'jasmine@freshnest.ca' } as unknown as User,
      staffProfile: mockStaffProfile as unknown as Staff,
      loading: false,
      error: null,
      setError: vi.fn(),
      signInWithPassword: vi.fn(),
      sendMagicLink: vi.fn(),
      completeMagicLinkSignIn: vi.fn(),
      logout: vi.fn(),
    })

    vi.mocked(useMyAssignedShifts).mockReturnValue({
      assignedShifts: mockAssignedShifts as unknown as Job[],
      isLoading: false,
      error: null,
    })
  })

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>)
  }

  it('renders page header and tabs correctly', () => {
    renderWithRouter(<MyJobsPage />)

    expect(screen.getByText('fsm.myJobs.title')).toBeInTheDocument()
    expect(screen.getByText('fsm.myJobs.subtitle')).toBeInTheDocument()

    // Tab buttons with counts
    expect(screen.getByText('fsm.myJobs.upcomingTab (1)')).toBeInTheDocument()
    expect(screen.getByText('fsm.myJobs.completedTab (1)')).toBeInTheDocument()
  })

  it('displays upcoming jobs by default and filters out completed ones', () => {
    renderWithRouter(<MyJobsPage />)

    // Upcoming job should be visible
    expect(screen.getByText('123 Pitt St, Cornwall ON')).toBeInTheDocument()
    
    // Completed job should not be visible initially
    expect(screen.queryByText('456 Montreal Rd, Cornwall ON')).not.toBeInTheDocument()

    // Estimated pay details check
    expect(
      screen.getByText('fsm.myJobs.jobCard.estPay_opt_{"pay":50,"hours":2,"rate":25}')
    ).toBeInTheDocument()
  })

  it('switches tabs to display completed jobs and hides upcoming ones', () => {
    renderWithRouter(<MyJobsPage />)

    const completedTabBtn = screen.getByText('fsm.myJobs.completedTab (1)')
    fireEvent.click(completedTabBtn)

    // Completed job should now be visible
    expect(screen.getByText('456 Montreal Rd, Cornwall ON')).toBeInTheDocument()
    
    // Upcoming job should now be hidden
    expect(screen.queryByText('123 Pitt St, Cornwall ON')).not.toBeInTheDocument()

    // Completed status badge check
    expect(screen.getByText('fsm.myJobs.jobCard.status.completed')).toBeInTheDocument()
  })

  it('displays empty state for upcoming jobs when none exist', () => {
    vi.mocked(useMyAssignedShifts).mockReturnValue({
      assignedShifts: mockAssignedShifts.filter((s) => s.status === 'completed') as unknown as Job[],
      isLoading: false,
      error: null,
    })

    renderWithRouter(<MyJobsPage />)

    expect(screen.getByText('fsm.myJobs.noJobsUpcoming')).toBeInTheDocument()
    expect(screen.queryByText('123 Pitt St, Cornwall ON')).not.toBeInTheDocument()
  })

  it('displays empty state for completed jobs when none exist', () => {
    vi.mocked(useMyAssignedShifts).mockReturnValue({
      assignedShifts: mockAssignedShifts.filter((s) => s.status === 'assigned') as unknown as Job[],
      isLoading: false,
      error: null,
    })

    renderWithRouter(<MyJobsPage />)

    const completedTabBtn = screen.getByText('fsm.myJobs.completedTab (0)')
    fireEvent.click(completedTabBtn)

    expect(screen.getByText('fsm.myJobs.noJobsCompleted')).toBeInTheDocument()
    expect(screen.queryByText('456 Montreal Rd, Cornwall ON')).not.toBeInTheDocument()
  })
})
