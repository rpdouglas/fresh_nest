import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
// ── Firebase mocks (hoisted) ──────────────────────────────────────────────────
const mocks = vi.hoisted(() => {
  const mockHttpsCallableFn = vi.fn().mockResolvedValue({ data: { uid: 'uid-123', email: 'jasmine@freshnest.ca' } })
  const mockHttpsCallable = vi.fn(() => mockHttpsCallableFn)
  const mockAddDoc = vi.fn()
  const mockInvalidateQueries = vi.fn()
  return {
    mockHttpsCallableFn,
    mockHttpsCallable,
    mockAddDoc,
    mockInvalidateQueries,
  }
})

const { mockHttpsCallableFn, mockHttpsCallable, mockAddDoc, mockInvalidateQueries } = mocks

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

import { useStaff } from './useStaff'
import type { RegisterStaffInput } from './useStaff'

// ── Test suite ────────────────────────────────────────────────────────────────

const validInput: RegisterStaffInput = {
  firstName: 'Jasmine',
  lastName: 'Beausoleil',
  email: 'jasmine@freshnest.ca',
  phone: '6135551234',
  role: 'cleaner',
  status: 'onboarding',
  language: 'fr',
  transportMode: 'transit',
  transitBufferMinutes: 30,
  monthlyEarningsLimit: null,
}

describe('useStaff — registerStaff (P3-E27-A2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHttpsCallable.mockReturnValue(mockHttpsCallableFn)
    mockHttpsCallableFn.mockResolvedValue({ data: { uid: 'uid-123', email: validInput.email } })
  })

  it('calls onStaffRegistered httpsCallable with the full RegisterStaffInput payload', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.registerStaff(validInput)
    })

    // CF callable must be wired to 'onStaffRegistered'
    expect(mockHttpsCallable).toHaveBeenCalledWith(
      expect.anything(), // functions instance
      'onStaffRegistered'
    )

    // CF must be called with the full input payload
    expect(mockHttpsCallableFn).toHaveBeenCalledWith(validInput)
  })

  it('returns the uid from the CF response', async () => {
    const { result } = renderHook(() => useStaff(true))

    let returnedUid: string | undefined
    await act(async () => {
      returnedUid = await result.current.registerStaff(validInput)
    })

    expect(returnedUid).toBe('uid-123')
  })

  it('invalidates the staff query cache after successful registration', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.registerStaff(validInput)
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['staff'] })
  })

  it('NEVER calls addDoc — client-side Firestore writes are prohibited (P3-E27-A2)', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.registerStaff(validInput)
    })

    // This is the critical regression guard — addDoc must never be called
    expect(mockAddDoc).not.toHaveBeenCalled()
  })

  it('propagates CF errors to the caller', async () => {
    mockHttpsCallableFn.mockRejectedValueOnce(new Error('permission-denied'))

    const { result } = renderHook(() => useStaff(true))

    await expect(
      act(async () => {
        await result.current.registerStaff(validInput)
      })
    ).rejects.toThrow('permission-denied')
  })
})

describe('useStaff — resendWelcome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHttpsCallable.mockReturnValue(mockHttpsCallableFn)
    mockHttpsCallableFn.mockResolvedValue({ data: { success: true, sentAt: '2026-06-22T12:00:00Z' } })
  })

  it('calls resendWelcomeEmail httpsCallable with the uid parameter', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.resendWelcome('uid-123')
    })

    expect(mockHttpsCallable).toHaveBeenCalledWith(
      expect.anything(),
      'resendWelcomeEmail'
    )

    expect(mockHttpsCallableFn).toHaveBeenCalledWith({ uid: 'uid-123' })
  })

  it('invalidates the staff query cache after successful resend', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.resendWelcome('uid-123')
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['staff'] })
  })
})

describe('useStaff — updateBackgroundCheckStatus (P3-E27-B2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHttpsCallable.mockReturnValue(mockHttpsCallableFn)
    mockHttpsCallableFn.mockResolvedValue({ data: { success: true } })
  })

  it('calls updateBackgroundCheckStatus httpsCallable with the full payload', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.updateBackgroundCheckStatus({ uid: 'uid-123', status: 'cleared', provider: 'Certn' })
    })

    expect(mockHttpsCallable).toHaveBeenCalledWith(
      expect.anything(),
      'updateBackgroundCheckStatus'
    )
    expect(mockHttpsCallableFn).toHaveBeenCalledWith({ uid: 'uid-123', status: 'cleared', provider: 'Certn' })
  })

  it('invalidates the staff query cache after a successful status update', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.updateBackgroundCheckStatus({ uid: 'uid-123', status: 'cleared' })
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['staff'] })
  })
})
