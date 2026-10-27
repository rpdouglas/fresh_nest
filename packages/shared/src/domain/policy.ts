/**
 * P3-E36 (W0-2): Operational Settings & Policy Record with Versioned History.
 *
 * Pure domain module shared across `apps/customer`, `apps/fsm`, and `functions/`
 * (synced into `functions/src/shared/policy.ts` via `functions/scripts/sync-shared.cjs`).
 */

export interface PolicySettingsValues {
  // 1. Scheduling & Travel Buffers
  defaultVehicleBufferMinutes: number
  defaultTransitBufferMinutes: number
  baseDriveBufferMinutes: number
  maxHoursPerDay: number
  rollingScheduleWeeks: number
  scheduleFreezeDays: number
  undoWindowMinutes: number
  swapNoticeHours: number

  // 2. Staff Earnings, Time & Attendance
  defaultOdspMonthlyLimit: number
  earningsCautionThreshold: number
  vacationNoticeDays: number
  maxConcurrentOff: number
  checkInGeofenceMeters: number
  timesheetVarianceMinutes: number

  // 3. Client Policies & Fees
  standardCancelWindowHours: number
  deepCancelWindowHours: number
  complaintWindowHours: number
  lateCancellationFeeDollars: number
  lockoutFeeDollars: number

  // 4. Compliance, Retention & Emergency Contacts
  photoRetentionDays: number
  agreementRetentionYears: number
  emergencyPrimaryPhone: string
  emergencyBackupName: string
  emergencyBackupPhone: string
}

export interface PolicySettings extends PolicySettingsValues {
  id?: string
  version: number
  updatedAt: Date
  updatedBy: string
  lastChangeReason: string | null
}

export interface PolicyFieldDiff {
  field: keyof PolicySettingsValues
  oldValue: number | string
  newValue: number | string
}

export interface PolicyHistoryEntry {
  id?: string
  version: number
  changedAt: Date
  changedBy: string
  reason: string | null
  changes: PolicyFieldDiff[]
  snapshot: PolicySettingsValues
}

export const DEFAULT_POLICY_SETTINGS: Readonly<PolicySettingsValues> = {
  // 1. Scheduling & Travel Buffers (MP-S3.17, P8 Jasmine, P15 Daniel, Owner 12b)
  defaultVehicleBufferMinutes: 30,
  defaultTransitBufferMinutes: 60,
  baseDriveBufferMinutes: 10,
  maxHoursPerDay: 10,
  rollingScheduleWeeks: 8,
  scheduleFreezeDays: 7,
  undoWindowMinutes: 15,
  swapNoticeHours: 12,

  // 2. Staff Earnings, Time & Attendance (P7 Carla, P13 Marcus, Owner 9 & 16)
  defaultOdspMonthlyLimit: 1000,
  earningsCautionThreshold: 100,
  vacationNoticeDays: 14,
  maxConcurrentOff: 2,
  checkInGeofenceMeters: 250,
  timesheetVarianceMinutes: 15,

  // 3. Client Policies & Fees (PR #44, Owner 15)
  standardCancelWindowHours: 24,
  deepCancelWindowHours: 48,
  complaintWindowHours: 24,
  lateCancellationFeeDollars: 0,
  lockoutFeeDollars: 0,

  // 4. Compliance, Retention & Emergency Contacts (Owner 9 & 18)
  photoRetentionDays: 90,
  agreementRetentionYears: 7,
  emergencyPrimaryPhone: '(613) 861-8812',
  emergencyBackupName: '',
  emergencyBackupPhone: '',
}

export type NumericPolicyKey = Exclude<
  keyof PolicySettingsValues,
  'emergencyPrimaryPhone' | 'emergencyBackupName' | 'emergencyBackupPhone'
>

export const POLICY_NUMERIC_BOUNDS: Readonly<
  Record<NumericPolicyKey, { min: number; max: number }>
> = {
  defaultVehicleBufferMinutes: { min: 0, max: 240 },
  defaultTransitBufferMinutes: { min: 0, max: 240 },
  baseDriveBufferMinutes: { min: 0, max: 120 },
  maxHoursPerDay: { min: 1, max: 24 },
  rollingScheduleWeeks: { min: 1, max: 52 },
  scheduleFreezeDays: { min: 0, max: 60 },
  undoWindowMinutes: { min: 1, max: 120 },
  swapNoticeHours: { min: 0, max: 168 },
  defaultOdspMonthlyLimit: { min: 0, max: 10000 },
  earningsCautionThreshold: { min: 0, max: 2000 },
  vacationNoticeDays: { min: 0, max: 90 },
  maxConcurrentOff: { min: 1, max: 50 },
  checkInGeofenceMeters: { min: 25, max: 5000 },
  timesheetVarianceMinutes: { min: 0, max: 240 },
  standardCancelWindowHours: { min: 0, max: 168 },
  deepCancelWindowHours: { min: 0, max: 168 },
  complaintWindowHours: { min: 1, max: 168 },
  lateCancellationFeeDollars: { min: 0, max: 1000 },
  lockoutFeeDollars: { min: 0, max: 1000 },
  photoRetentionDays: { min: 7, max: 3650 },
  agreementRetentionYears: { min: 1, max: 25 },
}

export const POLICY_SETTING_KEYS: readonly (keyof PolicySettingsValues)[] = [
  'defaultVehicleBufferMinutes',
  'defaultTransitBufferMinutes',
  'baseDriveBufferMinutes',
  'maxHoursPerDay',
  'rollingScheduleWeeks',
  'scheduleFreezeDays',
  'undoWindowMinutes',
  'swapNoticeHours',
  'defaultOdspMonthlyLimit',
  'earningsCautionThreshold',
  'vacationNoticeDays',
  'maxConcurrentOff',
  'checkInGeofenceMeters',
  'timesheetVarianceMinutes',
  'standardCancelWindowHours',
  'deepCancelWindowHours',
  'complaintWindowHours',
  'lateCancellationFeeDollars',
  'lockoutFeeDollars',
  'photoRetentionDays',
  'agreementRetentionYears',
  'emergencyPrimaryPhone',
  'emergencyBackupName',
  'emergencyBackupPhone',
]

/** Merges partial or missing Firestore data with `DEFAULT_POLICY_SETTINGS`. */
export function normalizePolicySettings(
  raw?: Partial<Record<keyof PolicySettingsValues, unknown>> | null,
): PolicySettingsValues {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_POLICY_SETTINGS }
  }
  const result: PolicySettingsValues = { ...DEFAULT_POLICY_SETTINGS }
  for (const key of Object.keys(POLICY_NUMERIC_BOUNDS) as Array<keyof typeof POLICY_NUMERIC_BOUNDS>) {
    const val = raw[key]
    if (typeof val === 'number' && Number.isFinite(val)) {
      result[key] = val
    }
  }
  if (typeof raw.emergencyPrimaryPhone === 'string') {
    result.emergencyPrimaryPhone = raw.emergencyPrimaryPhone
  }
  if (typeof raw.emergencyBackupName === 'string') {
    result.emergencyBackupName = raw.emergencyBackupName
  }
  if (typeof raw.emergencyBackupPhone === 'string') {
    result.emergencyBackupPhone = raw.emergencyBackupPhone
  }
  return result
}

export function validatePolicySettingsInput(
  raw: unknown,
): { ok: true; values: PolicySettingsValues; reason: string | null } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Settings payload must be an object.' }
  }
  const input = raw as Record<string, unknown>
  const values: PolicySettingsValues = { ...DEFAULT_POLICY_SETTINGS }

  for (const [key, bounds] of Object.entries(POLICY_NUMERIC_BOUNDS) as Array<
    [keyof typeof POLICY_NUMERIC_BOUNDS, { min: number; max: number }]
  >) {
    const rawVal = input[key]
    const num = typeof rawVal === 'number' ? rawVal : Number(rawVal)
    if (!Number.isFinite(num) || num < bounds.min || num > bounds.max) {
      return {
        ok: false,
        error: `Invalid value for ${key}: must be a number between ${bounds.min} and ${bounds.max}.`,
      }
    }
    values[key] = num
  }

  const primaryPhone = typeof input.emergencyPrimaryPhone === 'string' ? input.emergencyPrimaryPhone.trim() : ''
  if (!primaryPhone || primaryPhone.length > 40) {
    return {
      ok: false,
      error: 'Invalid value for emergencyPrimaryPhone: required (up to 40 characters).',
    }
  }
  values.emergencyPrimaryPhone = primaryPhone

  const backupName = typeof input.emergencyBackupName === 'string' ? input.emergencyBackupName.trim() : ''
  if (backupName.length > 80) {
    return {
      ok: false,
      error: 'Invalid value for emergencyBackupName: maximum 80 characters.',
    }
  }
  values.emergencyBackupName = backupName

  const backupPhone = typeof input.emergencyBackupPhone === 'string' ? input.emergencyBackupPhone.trim() : ''
  if (backupPhone.length > 40) {
    return {
      ok: false,
      error: 'Invalid value for emergencyBackupPhone: maximum 40 characters.',
    }
  }
  values.emergencyBackupPhone = backupPhone

  const rawReason = typeof input.reason === 'string' ? input.reason.trim() : ''
  if (rawReason.length > 300) {
    return {
      ok: false,
      error: 'Invalid value for reason: maximum 300 characters.',
    }
  }

  return { ok: true, values, reason: rawReason || null }
}

/** Computes field-by-field differences between two policy snapshots in deterministic key order. */
export function computePolicyDiff(
  previous: PolicySettingsValues,
  next: PolicySettingsValues,
): PolicyFieldDiff[] {
  const diffs: PolicyFieldDiff[] = []
  for (const key of POLICY_SETTING_KEYS) {
    if (previous[key] !== next[key]) {
      diffs.push({
        field: key,
        oldValue: previous[key],
        newValue: next[key],
      })
    }
  }
  return diffs
}
