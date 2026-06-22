import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStaff } from './useStaff'
import type { RegisterStaffInput } from './useStaff'

// ── Firebase mocks ────────────────────────────────────────────────────────────
const mockHttpsCallableFn = vi.fn().mockResolvedValue({ data: { uid: 'uid-123', email: 'jasmine@freshnest.ca' } })
const mockHttpsCallable = vi.fn(() => mockHttpsCallableFn)
const mockAddDoc = vi.fn()
const mockInvalidateQueries = vi.fn()

vi.mock('firebase/functions', () => ({
  httpsCallable: mockHttpsCallable,
  getFunctions: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  addDoc: mockAddDoc,
  Timestamp: { now: vi.fn() },
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
}))

vi.mock('@/lib/firebase/firebase', () => ({
  db: {},
  functions: {},
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

vi.mock('@tanstack-query-firebase/react/firestore', () => ({
  useCollectionQuery: () => ({ data: null, isLoading: false, error: null }),
}))

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
