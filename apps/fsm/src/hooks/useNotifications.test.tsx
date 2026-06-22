import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useNotifications } from './useNotifications'

// Mock useStaffAuth
const mockUseStaffAuth = vi.fn()
vi.mock('./useStaffAuth', () => ({
  useStaffAuth: () => mockUseStaffAuth() as unknown,
}))

// Mock Firebase Firestore
const mockOnSnapshot = vi.fn()
const mockUpdate = vi.fn()
const mockCommit = vi.fn().mockResolvedValue({})
const mockWriteBatch = vi.fn().mockReturnValue({
  update: (...args: unknown[]) => mockUpdate(...args) as unknown,
  commit: () => mockCommit() as unknown,
})

vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() { return new Date(this.seconds * 1000) }
    static now() { return new MockTimestamp(Date.now() / 1000, 0) }
  }
  return {
    getFirestore: vi.fn(),
    collection: vi.fn((_db: unknown, ...paths: string[]) => ({ path: paths.join('/') })),
    query: vi.fn((col: unknown) => ({ col })),
    orderBy: vi.fn((field: string, direction: string) => ({ orderBy: { field, direction } })),
    onSnapshot: (q: unknown, cb: unknown, errCb?: unknown) => mockOnSnapshot(q, cb, errCb) as unknown,
    writeBatch: () => mockWriteBatch() as unknown,
    doc: vi.fn((_db: unknown, ...paths: string[]) => ({ path: paths.join('/') })),
    Timestamp: MockTimestamp,
  }
})

// Mock Firebase config db instance
vi.mock('../lib/firebase/firebase', () => ({
  db: {},
}))

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock user
    mockUseStaffAuth.mockReturnValue({
      staffProfile: {
        uid: 'cleaner-123',
        firstName: 'Ahmed',
        lastName: 'Ahmad',
      },
    })
  })

  it('should return empty list initially and subscribe to firestore', () => {
    let snapshotCallback: ((snapshot: unknown) => void) | null = null
    mockOnSnapshot.mockImplementation((_q: unknown, cb: unknown) => {
      snapshotCallback = cb as (snapshot: unknown) => void
      return () => {}
    })

    const { result } = renderHook(() => useNotifications())

    expect(result.current.loading).toBe(true)
    expect(result.current.notifications).toEqual([])

    // Trigger Firestore update
    act(() => {
      if (snapshotCallback) {
        snapshotCallback([
          {
            id: 'msg-1',
            data: () => ({
              title: 'Shift Assigned',
              body: 'You have been assigned to a shift.',
              type: 'shift_assigned',
              jobId: 'job-123',
              read: false,
              createdAt: { toDate: () => new Date('2026-06-15T10:00:00Z') },
            }),
          },
        ])
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.notifications.length).toBe(1)
    expect(result.current.notifications[0].id).toBe('msg-1')
    expect(result.current.unreadCount).toBe(1)
  })

  it('should handle unread count correctly', () => {
    let snapshotCallback: ((snapshot: unknown) => void) | null = null
    mockOnSnapshot.mockImplementation((_q: unknown, cb: unknown) => {
      snapshotCallback = cb as (snapshot: unknown) => void
      return () => {}
    })

    const { result } = renderHook(() => useNotifications())

    act(() => {
      if (snapshotCallback) {
        snapshotCallback([
          {
            id: 'msg-1',
            data: () => ({
              title: 'Shift Assigned',
              body: 'You have been assigned to a shift.',
              type: 'shift_assigned',
              read: false,
              createdAt: { toDate: () => new Date('2026-06-15T10:00:00Z') },
            }),
          },
          {
            id: 'msg-2',
            data: () => ({
              title: 'Shift Cancelled',
              body: 'Your shift was cancelled.',
              type: 'shift_cancelled',
              read: true,
              createdAt: { toDate: () => new Date('2026-06-15T11:00:00Z') },
            }),
          },
        ])
      }
    })

    expect(result.current.unreadCount).toBe(1)
    expect(result.current.notifications.length).toBe(2)
  })

  it('should mark all unread notifications as read', async () => {
    let snapshotCallback: ((snapshot: unknown) => void) | null = null
    mockOnSnapshot.mockImplementation((_q: unknown, cb: unknown) => {
      snapshotCallback = cb as (snapshot: unknown) => void
      return () => {}
    })

    const { result } = renderHook(() => useNotifications())

    act(() => {
      if (snapshotCallback) {
        snapshotCallback([
          {
            id: 'msg-1',
            data: () => ({
              title: 'Shift Assigned',
              body: 'You have been assigned to a shift.',
              type: 'shift_assigned',
              read: false,
              createdAt: { toDate: () => new Date('2026-06-15T10:00:00Z') },
            }),
          },
        ])
      }
    })

    expect(result.current.unreadCount).toBe(1)

    await act(async () => {
      await result.current.markAllAsRead()
    })

    expect(mockWriteBatch).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockCommit).toHaveBeenCalled()
  })

  it('should return empty list and false loading if user is not logged in', () => {
    mockUseStaffAuth.mockReturnValue({
      staffProfile: null,
    })

    const { result } = renderHook(() => useNotifications())

    expect(result.current.loading).toBe(false)
    expect(result.current.notifications).toEqual([])
    expect(result.current.unreadCount).toBe(0)
    expect(mockOnSnapshot).not.toHaveBeenCalled()
  })
})
