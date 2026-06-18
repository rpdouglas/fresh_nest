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
