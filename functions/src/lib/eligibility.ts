/**
 * HOTFIX-02: Shift eligibility checks shared by `claimJob` (enforcement) and
 * `listOpenShifts` (display), so the Shift Board can never disagree with the claim.
 *
 * P7 Carla / P13 Marcus — earnings cap
 * P8 Jasmine / P15 Daniel — travel buffer
 * P9 Mike — blocked windows (shifts hidden, not greyed)
 *
 * Pure functions only — no Firestore access.
 */

/**
 * F06 Helpers: Time parsing, postal code FSA extraction, and conflict checking logic.
 */
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

export interface TravelShift {
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


export interface BlockedWindowLike {
  dayOfWeek?: number
  startTime: string
  endTime: string
  recurring?: boolean
  date?: string
}

export interface StaffConstraintsLike {
  blockedWindows?: BlockedWindowLike[]
  transportMode?: string
  transitBufferMinutes?: number
}

/** Shift duration in hours; falls back to 2h when times are missing or inverted. */
export function getShiftDurationHours(startTime: string, endTime: string): number {
  let durationHours = 2 // default fallback
  try {
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const diff = (endH + endM / 60) - (startH + startM / 60)
    if (diff > 0) durationHours = diff
  } catch (err) {
    console.warn('Error parsing shift times:', startTime, endTime, err)
  }
  return durationHours
}

export function estimateShiftPay(payRate: number, startTime: string, endTime: string): number {
  return payRate * getShiftDurationHours(startTime, endTime)
}

/** P7/P13: amount the shift exceeds the remaining monthly limit by, or 0 if it fits / no limit set. */
export function earningsOverage(
  estimatedShiftPay: number,
  monthlyEarningsLimit: number | null | undefined,
  currentMonthEarnings: number,
): number {
  if (monthlyEarningsLimit === null || monthlyEarningsLimit === undefined) return 0
  const remaining = monthlyEarningsLimit - currentMonthEarnings
  return estimatedShiftPay > remaining ? estimatedShiftPay - remaining : 0
}

/** P9: true when the shift overlaps any recurring or one-off blocked window. */
export function overlapsBlockedWindow(
  shiftDate: string,
  shiftStart: string,
  shiftEnd: string,
  blockedWindows: BlockedWindowLike[],
): boolean {
  const shiftDayOfWeek = new Date(shiftDate + 'T00:00:00').getDay()
  const startS = timeToMinutes(shiftStart)
  const endS = timeToMinutes(shiftEnd)

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
        return true
      }
    }
  }
  return false
}

/** P8/P15: travel buffer in minutes — explicit setting, else 60 for transit and 30 otherwise. */
export function resolveBufferMinutes(constraints: StaffConstraintsLike): number {
  const transportMode = constraints.transportMode || 'transit'
  const defaultBuffer = transportMode === 'transit' ? 60 : 30
  return typeof constraints.transitBufferMinutes === 'number'
    ? constraints.transitBufferMinutes
    : defaultBuffer
}

/** P8/P15: first same-day shift the candidate conflicts with, or null. */
export function findTravelConflict<T extends TravelShift>(
  candidate: TravelShift,
  existingShifts: T[],
  bufferMinutes: number,
): T | null {
  for (const existing of existingShifts) {
    if (hasTravelConflict(candidate, existing, bufferMinutes)) {
      return existing
    }
  }
  return null
}
