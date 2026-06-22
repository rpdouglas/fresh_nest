import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { JobPage } from './JobPage'
import { useJob } from '../hooks/useJob'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { useOfflineUploads } from '../hooks/useOfflineUploads'
import { updateDoc, onSnapshot } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import type { Staff, Job, ChecklistCompletion } from '../types'

// Mock useJob hook
vi.mock('../hooks/useJob')

// Mock useStaffAuth hook
vi.mock('../hooks/useStaffAuth')

// Mock useOfflineUploads hook
vi.mock('../hooks/useOfflineUploads')

// Mock firebase firestore
vi.mock('firebase/firestore', () => {
  const collectionRef = {
    withConverter: vi.fn().mockReturnThis(),
  }
  return {
    collection: vi.fn(() => collectionRef),
    doc: vi.fn(),
    updateDoc: vi.fn(() => Promise.resolve()),
    onSnapshot: vi.fn(() => vi.fn()), // returns unsubscribe function
    serverTimestamp: vi.fn(() => ({ type: 'timestamp' })),
    initializeFirestore: vi.fn(() => ({})),
    persistentLocalCache: vi.fn(() => ({})),
  }
})

// Mock react-router-dom useParams & useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'job123' }),
    useNavigate: () => mockNavigate,
  }
})

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

describe('JobPage Component', () => {
  const mockStaffProfile = {
    uid: 'staff123',
    firstName: 'Jasmine',
    lastName: 'Transit',
    role: 'cleaner',
    preferences: { language: 'en' },
  }

  const mockJob = {
    id: 'job123',
    bookingId: 'booking1',
    serviceType: 'deep',
    scheduledDate: '2026-06-20',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    clientName: 'Client A',
    clientAddress: '123 Pitt St, Cornwall ON',
    clientPhone: '613-555-0101',
    clientNotes: 'Clean fridge thoroughly',
    payRateSnapshot: { amount: 25 },
    status: 'assigned',
    checklistTemplate: 'template1',
    checklistCompletions: [],
    photos: [],
    createdAt: new Date(),
    checkedInAt: null,
    checkedInGeo: null,
    completedAt: null,
  }

  const mockTemplate = {
    id: 'template1',
    name: 'Deep Clean Template',
    tasks: [
      { id: 'task1', labelEn: 'Deep clean fridge', labelFr: 'Nettoyage en profondeur du réfrigérateur', icon: 'fridge', requiresPhoto: true },
      { id: 'task2', labelEn: 'Vacuum floors', labelFr: 'Aspirer les planchers', icon: 'vacuum', requiresPhoto: false },
    ],
  }

  const mockQueuePhotoUpload = vi.fn(() => Promise.resolve('temp:photo123'))
  const mockSyncPendingPhotos = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

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

    vi.mocked(useOfflineUploads).mockReturnValue({
      isOnline: true,
      pendingCount: 0,
      isSyncing: false,
      queuePhotoUpload: mockQueuePhotoUpload,
      syncPendingPhotos: mockSyncPendingPhotos,
    })

    // Mock useJob to return the default mock job
    vi.mocked(useJob).mockReturnValue({
      job: mockJob as unknown as Job,
      isLoading: false,
      error: null,
    })

    // Mock onSnapshot for the template loading
    vi.mocked(onSnapshot).mockImplementation((_, callback: unknown) => {
      const cb = callback as (snap: unknown) => void
      cb({
        exists: () => true,
        id: 'template1',
        data: () => mockTemplate,
      })
      return vi.fn() // unsubscribe mock
    })
  })

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>)
  }

  it('renders pre-check-in screen with job details and Check In button', () => {
    renderWithRouter(<JobPage />)

    expect(screen.getByText('123 Pitt St, Cornwall ON')).toBeInTheDocument()
    expect(screen.getByText('613-555-0101')).toBeInTheDocument()
    expect(screen.getByText('Clean fridge thoroughly')).toBeInTheDocument()
    expect(screen.getByText('fsm.myJobs.jobCard.checkInBtn')).toBeInTheDocument()
    expect(screen.queryByText('fsm.myJobs.jobCard.checklistTitle')).not.toBeInTheDocument()
  })

  it('handles check-in successfully and updates Firestore status', async () => {
    renderWithRouter(<JobPage />)

    const checkInBtn = screen.getByText('fsm.myJobs.jobCard.checkInBtn')
    fireEvent.click(checkInBtn)

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        undefined, // docRef mock
        expect.objectContaining({
          status: 'in_progress',
          checkedInAt: expect.any(Object) as unknown as Date,
        })
      )
    })
  })

  it('renders checklist tasks when job is in progress', () => {
    vi.mocked(useJob).mockReturnValue({
      job: {
        ...mockJob,
        status: 'in_progress',
      } as unknown as Job,
      isLoading: false,
      error: null,
    })

    renderWithRouter(<JobPage />)

    expect(screen.getByText('fsm.myJobs.jobCard.checklistTitle')).toBeInTheDocument()
    expect(screen.getByText('Deep clean fridge')).toBeInTheDocument()
    expect(screen.getByText('Vacuum floors')).toBeInTheDocument()
  })

  it('expands checklist task and enforces photo uploads', () => {
    vi.mocked(useJob).mockReturnValue({
      job: {
        ...mockJob,
        status: 'in_progress',
      } as unknown as Job,
      isLoading: false,
      error: null,
    })

    renderWithRouter(<JobPage />)

    // Expand fridgeDeep task (requires photo)
    const taskButton = screen.getByText('Deep clean fridge')
    fireEvent.click(taskButton)

    // Verify detail instructions and photo requirement warning are visible
    expect(screen.getByText('fsm.myJobs.jobCard.completeTask')).toBeInTheDocument()
    expect(screen.getByText('fsm.myJobs.jobCard.photoRequiredWarning')).toBeInTheDocument()

    // Confirm button should be disabled because no photo has been captured yet
    const confirmBtn = screen.getByText('fsm.myJobs.jobCard.confirmDone')
    expect(confirmBtn).toBeDisabled()
  })

  it('allows task completion when photo is provided', () => {
    vi.mocked(useJob).mockReturnValue({
      job: {
        ...mockJob,
        status: 'in_progress',
        photos: [
          {
            id: 'photo1',
            taskId: 'task1',
            url: 'https://storage/photo1.jpg',
            capturedAt: new Date(),
            lat: 45,
            lng: -74,
            staffId: 'staff123',
          },
        ],
      } as unknown as Job,
      isLoading: false,
      error: null,
    })

    renderWithRouter(<JobPage />)

    // Expand fridgeDeep task (requires photo - now mock lists photo uploaded)
    const taskButton = screen.getByText('Deep clean fridge')
    fireEvent.click(taskButton)

    // Confirm button should now be active
    const confirmBtn = screen.getByText('fsm.myJobs.jobCard.confirmDone')
    expect(confirmBtn).not.toBeDisabled()

    fireEvent.click(confirmBtn)
    expect(updateDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        checklistCompletions: expect.any(Array) as unknown as ChecklistCompletion[],
      })
    )
  })

  it('gates the Check Out button until all tasks are complete', () => {
    vi.mocked(useJob).mockReturnValue({
      job: {
        ...mockJob,
        status: 'in_progress',
        checklistCompletions: [
          { taskId: 'task1', completedAt: new Date(), photos: [] },
        ], // Only task1 completed, task2 (vacuumFloors) pending
      } as unknown as Job,
      isLoading: false,
      error: null,
    })

    renderWithRouter(<JobPage />)

    const checkOutBtn = screen.getByText('fsm.myJobs.jobCard.checkOutBtn')
    expect(checkOutBtn).toBeDisabled()
  })

  it('enables Check Out and triggers completion update when all tasks are complete', async () => {
    vi.mocked(useJob).mockReturnValue({
      job: {
        ...mockJob,
        status: 'in_progress',
        checklistCompletions: [
          { taskId: 'task1', completedAt: new Date(), photos: [] },
          { taskId: 'task2', completedAt: new Date(), photos: [] },
        ], // Both complete
      } as unknown as Job,
      isLoading: false,
      error: null,
    })

    renderWithRouter(<JobPage />)

    const checkOutBtn = screen.getByText('fsm.myJobs.jobCard.checkOutBtn')
    expect(checkOutBtn).not.toBeDisabled()

    fireEvent.click(checkOutBtn)

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Object) as unknown as Date,
        })
      )
      expect(mockNavigate).toHaveBeenCalledWith('/jobs')
    })
  })
})
