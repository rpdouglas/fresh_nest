import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
// ── Firebase mocks (hoisted) ──────────────────────────────────────────────────
const mocks = vi.hoisted(() => {
  const mockHttpsCallableFn = vi.fn().mockResolvedValue({ data: { success: true } })
  const mockHttpsCallable = vi.fn(() => mockHttpsCallableFn)
  const mockUpdateDoc = vi.fn()
  const mockAddDoc = vi.fn()
  const mockInvalidateQueries = vi.fn()
  return {
    mockHttpsCallableFn,
    mockHttpsCallable,
    mockUpdateDoc,
    mockAddDoc,
    mockInvalidateQueries,
  }
})

const { mockHttpsCallableFn, mockHttpsCallable, mockUpdateDoc, mockAddDoc, mockInvalidateQueries } = mocks

vi.mock('firebase/functions', () => ({
  httpsCallable: mocks.mockHttpsCallable,
  getFunctions: vi.fn(),
}))

vi.mock('firebase/firestore', () => {
  const collectionRef = {
    withConverter: vi.fn().mockReturnThis(),
  }
  return {
    collection: vi.fn(() => collectionRef),
    query: vi.fn(),
    orderBy: vi.fn(),
    doc: vi.fn(() => ({ id: 'credit-123' })),
    updateDoc: mocks.mockUpdateDoc,
    addDoc: mocks.mockAddDoc,
    Timestamp: { now: vi.fn() },
    initializeFirestore: vi.fn(),
    persistentLocalCache: vi.fn(),
  }
})

vi.mock('@/lib/firebase/firebase', () => ({
  db: {},
  functions: {},
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.mockInvalidateQueries }),
}))

vi.mock('@tanstack-query-firebase/react/firestore', () => ({
  useCollectionQuery: () => ({ data: null, isLoading: false, error: null }),
}))

import { useRewards } from './useRewards'

describe('useRewards — revokeCredit (P3-E10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHttpsCallable.mockReturnValue(mockHttpsCallableFn)
    mockHttpsCallableFn.mockResolvedValue({ data: { success: true } })
  })

  it('calls the adjustCredit callable with action "revoke" (no direct client write — credits is callable-only)', async () => {
    const { result } = renderHook(() => useRewards(true))

    await act(async () => {
      await result.current.revokeCredit('credit-123', 'duplicate issue')
    })

    expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), 'adjustCredit')
    expect(mockHttpsCallableFn).toHaveBeenCalledWith({ action: 'revoke', creditId: 'credit-123', notes: 'duplicate issue' })
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('invalidates the credits query cache after a successful revoke', async () => {
    const { result } = renderHook(() => useRewards(true))

    await act(async () => {
      await result.current.revokeCredit('credit-123')
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['credits'] })
  })
})

describe('useRewards — createManualCredit (P3-E10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHttpsCallable.mockReturnValue(mockHttpsCallableFn)
    mockHttpsCallableFn.mockResolvedValue({ data: { success: true, creditId: 'credit-456' } })
  })

  it('calls the adjustCredit callable with action "create" (no direct client write)', async () => {
    const { result } = renderHook(() => useRewards(true))

    await act(async () => {
      await result.current.createManualCredit({ customerEmail: 'diane@example.com', amount: 20, notes: 'goodwill credit' })
    })

    expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), 'adjustCredit')
    expect(mockHttpsCallableFn).toHaveBeenCalledWith({
      action: 'create',
      customerEmail: 'diane@example.com',
      amount: 20,
      notes: 'goodwill credit',
    })
    expect(mockAddDoc).not.toHaveBeenCalled()
  })

  it('invalidates the credits query cache after a successful manual credit', async () => {
    const { result } = renderHook(() => useRewards(true))

    await act(async () => {
      await result.current.createManualCredit({ customerEmail: 'diane@example.com', amount: 20 })
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['credits'] })
  })
})
