/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useAuditLogs } from './useAuditLogs'

// Mock tanstack-query-firebase collection query
const mockUseCollectionQuery = vi.fn()
vi.mock('@tanstack-query-firebase/react/firestore', () => ({
  useCollectionQuery: (q: any, config: unknown) => {
    const result = mockUseCollectionQuery(q, config)
    if (result && result.data && result.data.docs && q && q.col && q.col.converter) {
      const converter = q.col.converter
      return {
        ...result,
        data: {
          docs: result.data.docs.map((docSnap: any) => {
            const rawData = docSnap.data()
            const mockSnapshot = {
              id: docSnap.id,
              data: () => rawData,
            }
            return {
              id: docSnap.id,
              data: () => converter.fromFirestore(mockSnapshot),
            }
          }),
        },
      }
    }
    return result
  },
}))

vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() {
      return new Date(this.seconds * 1000)
    }
    static now() {
      return new MockTimestamp(Date.now() / 1000, 0)
    }
  }
  const mockRef = (name: string) => {
    const refObj: any = {
      collection: name,
    }
    refObj.withConverter = vi.fn((converter) => {
      refObj.converter = converter
      return refObj
    })
    return refObj
  }
  return {
    collection: vi.fn((_db: unknown, name: string) => mockRef(name)),
    query: vi.fn((col: unknown) => ({ col })),
    orderBy: vi.fn((field: string, direction: string) => ({ orderBy: { field, direction } })),
    Timestamp: MockTimestamp,
  }
})

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
