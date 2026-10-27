import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDocs } from 'firebase/firestore'
import { checkCleanerSchedulingConflicts, shiftsOverlap } from './scheduling'
import type { Booking, Job, Staff } from '@/types'

// N-3: one person on two overlapping jobs is a blocking error, never an overridable warning.

vi.mock('@/lib/firebase/firebase', () => ({ db: {} }))
vi.mock('@freshnest/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@freshnest/shared')>()),
  jobsCollection: vi.fn(),
}))
vi.mock('firebase/firestore', () => ({ query: vi.fn(), where: vi.fn(), getDocs: vi.fn() }))

const staff = {
  id: 'carla', firstName: 'Carla', lastName: 'Martin',
  financials: { monthlyEarningsLimit: null, currentMonthEarnings: 0, earningsHistory: [] },
  constraints: { transportMode: 'personal_vehicle', transitBufferMinutes: 30, blockedWindows: [] },
} as unknown as Staff
const booking = { id: 'bk1', jobId: 'job-new', address: '1 Pitt St, Cornwall ON K6H 1A1', preferredDate: '2026-10-28' } as unknown as Booking
const job = (id: string, start: string, end: string, address = '9 Water St, Long Sault ON K0C 1P0') =>
  ({ id, scheduledStartTime: start, scheduledEndTime: end, clientAddress: address, status: 'assigned' }) as unknown as Job
const existing = (...jobs: Job[]) => vi.mocked(getDocs).mockResolvedValue({ docs: jobs.map((j) => ({ data: () => j })) } as never)

const check = (candidate: Job) =>
  checkCleanerSchedulingConflicts({ selectedStaff: staff, booking, job: candidate, estimatedPay: 50 })

beforeEach(() => vi.clearAllMocks())

describe('shiftsOverlap', () => {
  it('detects shared time and allows back-to-back', () => {
    expect(shiftsOverlap({ startTime: '09:00', endTime: '11:00' }, { startTime: '10:30', endTime: '12:00' })).toBe(true)
    expect(shiftsOverlap({ startTime: '09:00', endTime: '11:00' }, { startTime: '11:00', endTime: '12:00' })).toBe(false)
  })
})

describe('checkCleanerSchedulingConflicts (N-3)', () => {
  it('an overlapping shift is a blocking error, not an override warning', async () => {
    existing(job('job-a', '10:00', '12:00'))
    const result = await check(job('job-new', '09:00', '11:00'))
    expect(result.isOverlap).toBe(true)
    expect(result.blockingErrors).toHaveLength(1)
    expect(result.blockingErrors[0]).toContain('10:00-12:00')
    expect(result.overrideTypes).not.toContain('travel_conflict_exceeded')
    expect(result.warnings).toEqual([])
  })

  it('an overlap is blocking even in the same postal area (where the travel buffer is waived)', async () => {
    existing(job('job-a', '10:00', '12:00', '5 Main St, Cornwall ON K6H 2B2'))
    const result = await check(job('job-new', '09:00', '11:00'))
    expect(result.blockingErrors).toHaveLength(1)
  })

  it('a too-short travel gap stays an overridable warning', async () => {
    existing(job('job-a', '11:10', '13:00'))
    const result = await check(job('job-new', '09:00', '11:00'))
    expect(result.blockingErrors).toEqual([])
    expect(result.overrideTypes).toContain('travel_conflict_exceeded')
  })

  it('the job being reassigned is not counted against itself', async () => {
    existing(job('job-new', '09:00', '11:00'))
    const result = await check(job('job-new', '09:00', '11:00'))
    expect(result.blockingErrors).toEqual([])
    expect(result.warnings).toEqual([])
  })
})
