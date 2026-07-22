import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
// ── Firebase mocks (hoisted) ──────────────────────────────────────────────────
const mocks = vi.hoisted(() => {
  const mockHttpsCallableFn = vi.fn().mockResolvedValue({ data: { uid: 'uid-123', email: 'jasmine@freshnest.ca' } })
  const mockHttpsCallable = vi.fn(() => mockHttpsCallableFn)
  const mockAddDoc = vi.fn()
  const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
  const mockInvalidateQueries = vi.fn()
  return {
    mockHttpsCallableFn,
    mockHttpsCallable,
    mockAddDoc,
    mockUpdateDoc,
    mockInvalidateQueries,
  }
})

const { mockHttpsCallableFn, mockHttpsCallable, mockAddDoc, mockUpdateDoc, mockInvalidateQueries } = mocks

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
    doc: vi.fn(() => ({ id: 'uid-123' })),
    addDoc: mocks.mockAddDoc,
    updateDoc: mocks.mockUpdateDoc,
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

describe('useStaff — updateChecklistItem (P3-E27-D1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateDoc.mockResolvedValue(undefined)
  })

  it('writes the onboardingChecklist item directly via updateDoc (no callable)', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.updateChecklistItem('uid-123', 'idVerified', true)
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { 'onboardingChecklist.idVerified': true }
    )
    expect(mockHttpsCallable).not.toHaveBeenCalled()
  })

  it('invalidates the staff query cache after a successful toggle', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.updateChecklistItem('uid-123', 'uniformIssued', false)
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['staff'] })
  })
})

describe('useStaff — activateEmployee (P3-E27-D1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateDoc.mockResolvedValue(undefined)
  })

  it('writes status: active directly via updateDoc (no callable)', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.activateEmployee('uid-123')
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'active' }
    )
    expect(mockHttpsCallable).not.toHaveBeenCalled()
  })

  it('invalidates the staff query cache after activation', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.activateEmployee('uid-123')
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['staff'] })
  })
})

describe('useStaff — completeCheckIn (P3-E27-D2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateDoc.mockResolvedValue(undefined)
  })

  it('writes the whole probation.checkIns array directly via updateDoc (no callable)', async () => {
    const { result } = renderHook(() => useStaff(true))
    const checkIns = [
      { id: 'ci-30', dayOffset: 30 as const, scheduledDate: '2026-01-31', completedDate: '2026-01-31', notes: null, rating: 5 as const, completedBy: 'lauren@freshnestco.ca' },
    ]

    await act(async () => {
      await result.current.completeCheckIn('uid-123', checkIns)
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { 'probation.checkIns': checkIns }
    )
    expect(mockHttpsCallable).not.toHaveBeenCalled()
  })
})

describe('useStaff — setProbationOutcome (P3-E27-D2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateDoc.mockResolvedValue(undefined)
  })

  it('writes probationOutcome only for "passed"', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.setProbationOutcome('uid-123', 'passed')
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { 'probation.probationOutcome': 'passed' }
    )
  })

  it('also transitions status to inactive for "terminated" — status only, per D1 precedent', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.setProbationOutcome('uid-123', 'terminated')
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { 'probation.probationOutcome': 'terminated', status: 'inactive' }
    )
  })
})

describe('useStaff — extendProbation (P3-E27-D2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateDoc.mockResolvedValue(undefined)
  })

  it('appends 3 new check-ins and resets probationOutcome to pending', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.extendProbation('uid-123', '2026-04-01')
    })

    const payload = mockUpdateDoc.mock.calls[0][1] as unknown as {
      'probation.checkIns': Array<{ dayOffset: number }>
      'probation.probationOutcome': string
    }
    expect(payload['probation.checkIns']).toHaveLength(3)
    expect(payload['probation.checkIns'].map((c) => c.dayOffset)).toEqual([30, 60, 90])
    expect(payload['probation.probationOutcome']).toBe('pending')
  })
})

describe('useStaff — updateOffboardingChecklist (P3-E27-D3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateDoc.mockResolvedValue(undefined)
  })

  it('writes the offboarding checklist item directly via updateDoc (no callable)', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.updateOffboardingChecklist('uid-123', 'keysReturned', true)
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { 'offboarding.checklist.keysReturned': true }
    )
    expect(mockHttpsCallable).not.toHaveBeenCalled()
  })
})

describe('useStaff — setDepartureReason / setFinalNotes (P3-E27-D3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateDoc.mockResolvedValue(undefined)
  })

  it('writes departureReason directly via updateDoc', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.setDepartureReason('uid-123', 'voluntary')
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { 'offboarding.departureReason': 'voluntary' }
    )
  })

  it('writes finalNotes, trimming to null when empty', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.setFinalNotes('uid-123', '  ')
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { 'offboarding.finalNotes': null }
    )
  })
})

describe('useStaff — reactivateStaff (P3-E27-D3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHttpsCallable.mockReturnValue(mockHttpsCallableFn)
    mockHttpsCallableFn.mockResolvedValue({ data: { success: true } })
  })

  it('calls the reactivateStaff callable (not a direct updateDoc — Auth calls require Admin SDK)', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.reactivateStaff('uid-123')
    })

    expect(mockHttpsCallable).toHaveBeenCalledWith(
      expect.anything(),
      'reactivateStaff'
    )
    expect(mockHttpsCallableFn).toHaveBeenCalledWith({ uid: 'uid-123' })
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('invalidates the staff query cache after reactivation', async () => {
    const { result } = renderHook(() => useStaff(true))

    await act(async () => {
      await result.current.reactivateStaff('uid-123')
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['staff'] })
  })
})
