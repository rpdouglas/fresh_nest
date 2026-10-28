import type { LastChange, AuditAction, AuditSource, AuditFieldChange } from '../domain/audit'
import type { StaffRole } from './staff'
import type { ServiceType } from './booking'

export interface ChecklistTask {
  id: string
  labelEn: string
  labelFr: string
  icon: string
  requiresPhoto: boolean
  photoPhase?: 'before' | 'after' | null
  order?: number
}

export interface ChecklistTemplate {
  /** P3-E37: who made the latest save (see domain/audit.ts). */
  lastChange?: LastChange
  id?: string
  name: string
  serviceType: ServiceType
  tasks: ChecklistTask[]
  active: boolean
}

export interface PayRate {
  /** P3-E37: who made the latest save (see domain/audit.ts). */
  lastChange?: LastChange
  id?: string
  role: StaffRole
  /** P3-E38: hourly rate in integer cents (ADR-020). */
  amountCents: number
  /** @deprecated dollars, before P3-E38 — read through amountCentsOf(); removed after migration. */
  amount?: number
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
  /** Pre-P3-E37 rows: the one changed field. P3-E37 rows: the changed field names, comma-separated. */
  field: string
  oldValue: unknown
  newValue: unknown
  changedBy: string
  changedAt: Date
  reason: string | null
  overrideType: string | null
  // P3-E37 (absent on older rows)
  action?: AuditAction
  actor?: string
  source?: AuditSource
  changes?: AuditFieldChange[]
  recordLabel?: string | null
  snapshot?: Record<string, unknown> | null
}

// P3-E32: a before/after gallery pair managed from the admin Gallery tab.
export interface GalleryPair {
  /** P3-E37: who made the latest save (see domain/audit.ts). */
  lastChange?: LastChange
  id?: string
  serviceKey: ServiceType
  captionEn: string
  captionFr: string
  beforePath: string
  afterPath: string
  beforeUrl: string
  afterUrl: string
  published: boolean
  featured: boolean
  order: number
  consentConfirmed: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
