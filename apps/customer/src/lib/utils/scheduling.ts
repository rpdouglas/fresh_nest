import { query, where, getDocs } from 'firebase/firestore'
import {
  jobsCollection,
  timeToMinutes,
  extractPostalPrefix,
  hasTravelConflict,
  shiftsOverlap,
  overlapsBlockedWindow,
  resolveBufferMinutes,
  earningsOverage,
  type BufferPolicyConfig,
} from '@freshnest/shared'
import { db } from '@/lib/firebase/firebase'
import type { Booking, Job, Staff } from '@/types'

export {
  timeToMinutes,
  extractPostalPrefix,
  hasTravelConflict,
  shiftsOverlap,
  overlapsBlockedWindow,
  resolveBufferMinutes,
  earningsOverage,
}

export interface ConflictCheckResult {
  /** N-3: the cleaner already has a shift at this time. Never overridable. */
  isOverlap: boolean
  overlappingShift: Job | null
  /** Problems that block the assignment outright (no override offered). */
  blockingErrors: string[]
  isOverEarnings: boolean
  isOverTravel: boolean
  isOverBlockedWindow: boolean
  overage: number
  conflictingShift: Job | null
  warnings: string[]
  overrideTypes: string[]
}

export async function checkCleanerSchedulingConflicts({
  selectedStaff,
  booking,
  job,
  estimatedPay,
  policy,
  t = (key: string, options?: Record<string, unknown>) => {
    const name = typeof options?.name === 'string' ? options.name : 'Cleaner'
    const overage = typeof options?.overage === 'number' || typeof options?.overage === 'string' ? String(options.overage) : '0'
    const buffer = typeof options?.buffer === 'number' || typeof options?.buffer === 'string' ? String(options.buffer) : '60'
    const start = typeof options?.start === 'string' ? options.start : ''
    const end = typeof options?.end === 'string' ? options.end : ''

    if (key.includes('earningsWarning')) {
      return `${name} exceeds monthly earnings limit by $${overage}`
    }
    if (key.includes('travelWarning')) {
      return `${name} needs ${buffer}m travel buffer with shift ${start}-${end}`
    }
    if (key.includes('overlapBlocked')) {
      return `${name} is already booked ${start}-${end}`
    }
    if (key.includes('blockedWindowWarning')) {
      return `${name} has a blocked window that overlaps with this shift`
    }
    return 'Scheduling conflict detected'
  }
}: {
  selectedStaff: Staff
  booking: Booking
  job: Job | null
  estimatedPay: number
  policy?: BufferPolicyConfig
  t?: (key: string, options?: Record<string, unknown>) => string
}): Promise<ConflictCheckResult> {
  const newCleanerName = `${selectedStaff.firstName} ${selectedStaff.lastName}`

  // 1. Check earnings cap via shared domain helper
  const limit = selectedStaff.financials?.monthlyEarningsLimit ?? null
  const current = selectedStaff.financials?.currentMonthEarnings ?? 0
  const overage = earningsOverage(estimatedPay, limit, current)
  const isOverEarnings = overage > 0

  // 2. Check overlaps (blocking) and travel buffer conflicts (overridable) via shared domain helpers
  let isOverlap = false
  let overlappingShift: Job | null = null
  let isOverTravel = false
  let conflictingShift: Job | null = null
  const bufferMinutes = resolveBufferMinutes(selectedStaff.constraints || {}, policy)

  const cand = {
    startTime: job?.scheduledStartTime || '09:00',
    endTime: job?.scheduledEndTime || '11:00',
    address: booking.address,
  }

  try {
    const q = query(
      jobsCollection(db),
      where('assignedTo', '==', selectedStaff.id),
      where('scheduledDate', '==', booking.preferredDate)
    )
    const snap = await getDocs(q)
    const activeJobs = snap.docs
      .map((docSnap) => docSnap.data())
      .filter((j) => j.status !== 'cancelled' && j.id !== booking.jobId)

    for (const exJob of activeJobs) {
      const ex = {
        startTime: exJob.scheduledStartTime,
        endTime: exJob.scheduledEndTime,
        address: exJob.clientAddress,
      }
      if (shiftsOverlap(cand, ex)) {
        isOverlap = true
        overlappingShift = exJob
        break
      }
      if (!isOverTravel && hasTravelConflict(cand, ex, bufferMinutes)) {
        isOverTravel = true
        conflictingShift = exJob
      }
    }
  } catch (err) {
    console.error('Error checking cleaner travel conflicts:', err)
  }

  // 3. Check blocked windows conflicts via shared domain helper
  const blockedWindows = selectedStaff.constraints?.blockedWindows || []
  const isOverBlockedWindow = overlapsBlockedWindow(
    booking.preferredDate,
    cand.startTime,
    cand.endTime,
    blockedWindows
  )

  const warnings: string[] = []
  const overrideTypes: string[] = []
  const blockingErrors: string[] = []

  if (isOverlap && overlappingShift) {
    blockingErrors.push(
      t('admin.override.overlapBlocked', {
        name: newCleanerName,
        start: overlappingShift.scheduledStartTime,
        end: overlappingShift.scheduledEndTime,
      })
    )
  }

  if (isOverEarnings) {
    warnings.push(
      t('admin.override.earningsWarning', {
        name: newCleanerName,
        overage,
      })
    )
    overrideTypes.push('earnings_cap_exceeded')
  }

  if (isOverTravel && conflictingShift) {
    warnings.push(
      t('admin.override.travelWarning', {
        name: newCleanerName,
        buffer: bufferMinutes,
        start: conflictingShift.scheduledStartTime,
        end: conflictingShift.scheduledEndTime,
      })
    )
    overrideTypes.push('travel_conflict_exceeded')
  }

  if (isOverBlockedWindow) {
    warnings.push(
      t('admin.override.blockedWindowWarning', {
        name: newCleanerName,
      })
    )
    overrideTypes.push('blocked_window_overlap')
  }

  return {
    isOverlap,
    overlappingShift,
    blockingErrors,
    isOverEarnings,
    isOverTravel,
    isOverBlockedWindow,
    overage,
    conflictingShift,
    warnings,
    overrideTypes,
  }
}
