import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useAuditLogs } from './useAuditLogs'

// Mock tanstack-query-firebase collection query
const mockUseCollectionQuery = vi.fn()
vi.mock('@tanstack-query-firebase/react/firestore', () => ({
  useCollectionQuery: (q: unknown, config: unknown) => mockUseCollectionQuery(q, config) as unknown,
}))

// Mock Firebase firestore methods
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ collection: name })),
  query: vi.fn((col: unknown) => ({ col })),
  orderBy: vi.fn((field: string, direction: string) => ({ orderBy: { field, direction } })),
}))

// Mock Firebase config db instance
vi.mock('@/lib/firebase/firebase', () => ({
  db: {},
}))

describe('useAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty logs list initially when not loading', () => {
    mockUseCollectionQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useAuditLogs(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.logs).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should parse and format Firestore auditLog entries correctly', () => {
    const mockTimestamp = { toDate: () => new Date('2026-06-15T15:00:00Z') }
    mockUseCollectionQuery.mockReturnValue({
      data: {
        docs: [
          {
            id: 'log-1',
            data: () => ({
              collection: 'staff',
              documentId: 'cleaner-123',
              field: 'constraints.blockedWindows',
              oldValue: [],
              newValue: [{ id: 'window-1' }],
              changedBy: 'admin@freshnest.ca',
              changedAt: mockTimestamp,
              reason: 'Required for emergency shift',
              overrideType: 'blocked_window_overlap',
            }),
          },
        ],
      },
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useAuditLogs(true))

    expect(result.current.logs.length).toBe(1)
    expect(result.current.logs[0]).toEqual({
      id: 'log-1',
      collection: 'staff',
      documentId: 'cleaner-123',
      field: 'constraints.blockedWindows',
      oldValue: [],
      newValue: [{ id: 'window-1' }],
      changedBy: 'admin@freshnest.ca',
      changedAt: new Date('2026-06-15T15:00:00Z'),
      reason: 'Required for emergency shift',
      overrideType: 'blocked_window_overlap',
    })
  })

  it('should pass error message as a string if query fails', () => {
    mockUseCollectionQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Firebase permission-denied error'),
    })

    const { result } = renderHook(() => useAuditLogs(true))

    expect(result.current.error).toBe('Error: Firebase permission-denied error')
  })

  it('should disable query if not authorized', () => {
    mockUseCollectionQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    })

    renderHook(() => useAuditLogs(false))

    expect(mockUseCollectionQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: false })
    )
  })
})
