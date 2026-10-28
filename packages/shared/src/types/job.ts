import type { LastChange } from '../domain/audit'
import type { ServiceType } from './booking'
import type { ChecklistTask } from './common'

export type JobStatus =
  | 'unassigned' | 'assigned' | 'acknowledged'
  | 'in_progress' | 'completed' | 'cancelled' | 'disputed'

export interface PayRateSnapshot {
  rateId: string | null
  /** P3-E38: hourly rate in integer cents, frozen when the shift was confirmed (P12). */
  amountCents: number
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

/** P3-E34: how a job's checklist was chosen. */
export type ChecklistSource = 'auto' | 'template' | 'custom'

export interface ChecklistCompletion {
  taskId: string
  completedAt: Date
  photos: JobPhoto[]
}

export interface Job {
  /** P3-E37: who made the latest save (see domain/audit.ts). */
  lastChange?: LastChange
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
  // P3-E34: tasks copied onto the job when its list is attached, so later template edits
  // don't change it. Older jobs only have checklistTemplate and read the live template.
  checklistTasks?: ChecklistTask[]
  checklistName?: string
  checklistSource?: ChecklistSource
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
  /** P3-E38: integer cents (ADR-020) */
  payRateCents: number
  area: {
    municipality: string | null
    postalPrefix: string | null
  }
  eligibility: {
    durationHours: number
    estimatedPayCents: number
    overageCents: number
    travelConflict: { startTime: string; endTime: string; bufferMinutes: number } | null
  }
}
