// FSM Platform Types — do not merge with customer site types
// Customer site types live in apps/customer/src/types/index.ts

export type StaffLanguage = 'en' | 'fr'
export type TransportMode = 'personal_vehicle' | 'transit' | 'rideshare' | 'walk'
export type StaffRole = 'cleaner' | 'lead' | 'supervisor'
export type StaffStatus = 'onboarding' | 'active' | 'inactive'
export type JobStatus = 'unassigned' | 'assigned' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
export type TaskIconType = 'mop' | 'toilet' | 'trash' | 'key' | 'bed' | 'oven' | 'fridge' | 'window' | 'photo' | 'check' | 'vacuum' | 'sink'
export type EarningsSafetyState = 'safe' | 'caution' | 'at_limit'

export interface BlockedWindow {
  id: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Sunday
  startTime: string  // 'HH:MM'
  endTime: string    // 'HH:MM'
  recurring: boolean
  date?: string      // ISO date — for one-time blocks only
  label: string      // staff-private label (e.g. 'Recovery meeting')
}

export interface TermsAcceptance {
  version: string
  acceptedAt: Date
  ipAddress?: string
}

export interface PayRateSnapshot {
  rateId: string
  amount: number
  currency: 'CAD'
  effectiveAt: string  // ISO timestamp
  snapshotAt: string   // ISO timestamp
}

export interface Staff {
  id: string
  uid: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: StaffRole
  status: StaffStatus
  preferences: {
    language: StaffLanguage
  }
  constraints: {
    transportMode: TransportMode
    transitBufferMinutes: number
    blockedWindows: BlockedWindow[]
  }
  financials: {
    monthlyEarningsLimit: number | null
    currentMonthEarnings: number
    earningsHistory: Array<{ month: string; total: number }>
  }
  compliance: {
    acceptedTermsVersion: string
    termsHistory: TermsAcceptance[]
  }
  onboardingChecklist: Record<string, boolean>
  createdAt: Date
}

export interface ChecklistTask {
  id: string
  labelKey: string  // i18n key
  icon: TaskIconType
  requiresPhoto: boolean
  photoPhase?: 'before' | 'after'
}

export interface ChecklistTemplate {
  id: string
  name: string
  serviceType: string
  tasks: ChecklistTask[]
  active: boolean
}

export interface JobPhoto {
  id: string
  taskId: string
  url: string
  capturedAt: Date
  geoLat: number | null
  geoLng: number | null
  geoTagged: boolean
  staffId: string
}

export interface ChecklistCompletion {
  taskId: string
  completedAt: Date
  photos: JobPhoto[]
}

export interface Job {
  id: string
  bookingId: string
  clientName: string
  clientAddress: string
  clientPhone: string
  clientNotes?: string
  serviceType: string
  scheduledDate: string  // YYYY-MM-DD
  scheduledStartTime: string  // HH:MM
  scheduledEndTime: string    // HH:MM
  status: JobStatus
  assignedTo: string | null   // Staff UID
  checkedInAt: Date | null
  checkedInGeo: { lat: number; lng: number } | null
  completedAt: Date | null
  payRateSnapshot: PayRateSnapshot
  checklistTemplate: string   // ChecklistTemplate ID (snapshot at creation)
  checklistCompletions: ChecklistCompletion[]
  photos: JobPhoto[]
  createdAt: Date
}

export interface PayRate {
  id: string
  role: StaffRole
  amount: number
  currency: 'CAD'
  effectiveFrom: Date
  effectiveTo: Date | null
  createdBy: string
  createdAt: Date
}

export interface AuditEntry {
  id: string
  collection: string
  documentId: string
  field: string
  oldValue: unknown
  newValue: unknown
  changedBy: string
  changedAt: Date
  reason: string | null
  overrideType: string | null
}

export interface Notification {
  id: string
  title: string
  body: string
  type: 'shift_assigned' | 'shift_unassigned' | 'shift_cancelled' | 'new_shift_board_posting'
  jobId: string | null
  read: boolean
  createdAt: Date
}

