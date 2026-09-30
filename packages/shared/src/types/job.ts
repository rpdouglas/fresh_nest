import type { ServiceType } from './booking'

export type JobStatus =
  | 'unassigned' | 'assigned' | 'acknowledged'
  | 'in_progress' | 'completed' | 'cancelled' | 'disputed'

export interface PayRateSnapshot {
  rateId: string | null
  amount: number
  currency: 'CAD'
  effectiveAt: string
  snapshotAt: string
}

export interface JobPhoto {
  url: string
  taskId?: string
  lat?: number
  lng?: number
  storagePath?: string
  phase?: 'before' | 'after' | null
  uploadedAt?: Date
  uploadedBy?: string
  id?: string
  capturedAt?: Date
  staffId?: string
}

export interface ChecklistCompletion {
  taskId: string
  completedAt: Date
  photos: JobPhoto[]
}

export interface Job {
  id?: string
  bookingId: string
  clientName: string
  clientAddress: string
  clientPhone: string
  clientNotes?: string
  serviceType: ServiceType
  scheduledDate: string
  scheduledStartTime: string
  scheduledEndTime: string
  status: JobStatus
  assignedTo: string | null
  checkedInAt: Date | null
  checkedInGeo: { lat: number; lng: number } | null
  completedAt: Date | null
  payRateSnapshot: PayRateSnapshot
  checklistTemplate: string
  checklistCompletions: ChecklistCompletion[]
  photos: JobPhoto[]
  reviewRequestScheduledFor?: Date | null
  reviewEmailSent?: boolean
  reviewSubmitted?: boolean
  createdAt: Date
}

/**
 * HOTFIX-02: `listOpenShifts` callable response item — a PII-minimised projection of
 * an unassigned job with eligibility evaluated server-side. Not a Firestore document.
 * Keep in sync with OpenShiftResponse in functions/src/callable/shifts.ts.
 */
export interface OpenShift {
  id: string
  serviceType: ServiceType
  scheduledDate: string
  scheduledStartTime: string
  scheduledEndTime: string
  payRate: number
  area: {
    municipality: string | null
    postalPrefix: string | null
  }
  eligibility: {
    durationHours: number
    estimatedPay: number
    overage: number
    travelConflict: { startTime: string; endTime: string; bufferMinutes: number } | null
  }
}
