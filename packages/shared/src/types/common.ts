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
  id?: string
  name: string
  serviceType: ServiceType
  tasks: ChecklistTask[]
  active: boolean
}

export interface PayRate {
  id?: string
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

// P3-E32: a before/after gallery pair managed from the admin Gallery tab.
export interface GalleryPair {
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
