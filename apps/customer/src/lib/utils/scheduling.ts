import { query, where, getDocs } from 'firebase/firestore'
import { jobsCollection } from '@freshnest/shared'
import { db } from '@/lib/firebase/firebase'
import type { Booking, Job, Staff } from '@/types'

export function timeToMinutes(timeStr: string): number {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  } catch {
    return 0
  }
}

export function extractPostalPrefix(address: string): string | null {
  if (!address) return null
  const match = address.match(/([A-Za-z]\d[A-Za-z])/i)
  return match ? match[1].toUpperCase() : null
}

interface TravelShift {
  startTime: string
  endTime: string
  address: string
}

export function hasTravelConflict(
  candidate: TravelShift,
  existing: TravelShift,
  bufferMinutes: number
): boolean {
  const startC = timeToMinutes(candidate.startTime)
  const endC = timeToMinutes(candidate.endTime)
  const startA = timeToMinutes(existing.startTime)
  const endA = timeToMinutes(existing.endTime)

  // 1. Direct overlap check
  if (startC < endA && endC > startA) {
    return true
  }

  // 2. Waive buffer if they share the same postal prefix
  const fsaC = extractPostalPrefix(candidate.address)
  const fsaA = extractPostalPrefix(existing.address)
  if (fsaC && fsaA && fsaC === fsaA) {
    return false
  }

  // 3. Buffer check
  if (endC <= startA) {
    const gap = startA - endC
    if (gap < bufferMinutes) {
      return true
    }
  } else if (endA <= startC) {
    const gap = startC - endA
    if (gap < bufferMinutes) {
      return true
    }
  }

  return false
}

export interface ConflictCheckResult {
  isOverEarnings: boolean
  isOverTravel: boolean
  isOverBlockedWindow: boolean
  isBackgroundCheckIncomplete: boolean
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
  t = (key: string, options?: Record<string, unknown>) => {
    // Basic fallback translating standard warnings
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
    if (key.includes('blockedWindowWarning')) {
      return `${name} has a blocked window that overlaps with this shift`
    }
    if (key.includes('backgroundCheckWarning')) {
      return `${name} does not have a cleared background check`
    }
    return 'Scheduling conflict detected'
  }
}: {
  selectedStaff: Staff
  booking: Booking
  job: Job | null
  estimatedPay: number
  t?: (key: string, options?: Record<string, unknown>) => string
}): Promise<ConflictCheckResult> {
  const newCleanerName = `${selectedStaff.firstName} ${selectedStaff.lastName}`

  // 1. Check earnings cap
  const limit = selectedStaff.financials?.monthlyEarningsLimit ?? null
  const current = selectedStaff.financials?.currentMonthEarnings ?? 0
  const isOverEarnings = limit !== null && current + estimatedPay > limit
  const overage = limit !== null && isOverEarnings ? (current + estimatedPay) - limit : 0

  // 2. Check travel buffer conflicts
  let isOverTravel = false
  let conflictingShift: Job | null = null
  const constraints = selectedStaff.constraints || {}
  const transportMode = constraints.transportMode || 'transit'
  const defaultBuffer = transportMode === 'transit' ? 60 : 30
  const bufferMinutes = typeof constraints.transitBufferMinutes === 'number'
    ? constraints.transitBufferMinutes
    : defaultBuffer

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
      if (hasTravelConflict(cand, ex, bufferMinutes)) {
        isOverTravel = true
        conflictingShift = exJob
        break
      }
    }
  } catch (err) {
    console.error('Error checking cleaner travel conflicts:', err)
  }

  // 3. Check blocked windows conflicts
  let isOverBlockedWindow = false
  const blockedWindows = selectedStaff.constraints?.blockedWindows || []
  const shiftDate = booking.preferredDate
  const shiftDayOfWeek = new Date(shiftDate + 'T00:00:00').getDay()
  const startS = timeToMinutes(cand.startTime)
  const endS = timeToMinutes(cand.endTime)

  for (const window of blockedWindows) {
    let isMatch = false
    if (window.recurring) {
      isMatch = window.dayOfWeek === shiftDayOfWeek
    } else if (window.date) {
      isMatch = window.date === shiftDate
    }

    if (isMatch) {
      const startW = timeToMinutes(window.startTime)
      const endW = timeToMinutes(window.endTime)
      if (startS < endW && endS > startW) {
        isOverBlockedWindow = true
        break
      }
    }
  }

  // 4. Background check must be cleared before assignment (P3-E27-B2)
  const isBackgroundCheckIncomplete = (selectedStaff.backgroundCheck?.status ?? 'not_started') !== 'cleared'

  const warnings: string[] = []
  const overrideTypes: string[] = []

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

  if (isBackgroundCheckIncomplete) {
    warnings.push(
      t('admin.override.backgroundCheckWarning', {
        name: newCleanerName,
      })
    )
    overrideTypes.push('background_check_not_cleared')
  }

  return {
    isOverEarnings,
    isOverTravel,
    isOverBlockedWindow,
    isBackgroundCheckIncomplete,
    overage,
    conflictingShift,
    warnings,
    overrideTypes,
  }
}
