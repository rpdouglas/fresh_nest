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

// P3-E10: public-read referral code record (ADR-009). ownerEmail added so credit
// issuance can find the referrer without an extra bookings lookup.
export interface Referral {
  id: string
  ownerName: string
  ownerEmail: string
  bookingId: string
  active: boolean
  createdAt: Date
}

// P3-E10: configurable reward amounts — avoids a redeploy every time the dollar
// figure changes. Single document, public-read (booking wizard needs it
// pre-checkout), admin-only write.
export interface ReferralConfig {
  referrerRewardAmount: number
  refereeDiscountAmount: number
  currency: 'CAD'
  enabled: boolean
}

export type CreditReason = 'referral_reward' | 'admin_adjustment'
export type CreditStatus = 'available' | 'redeemed' | 'revoked'

// P3-E10: customer credit ledger. Callable-only writes — no direct client write,
// not even admin — since this collection feeds a live Stripe charge calculation.
export interface Credit {
  id: string
  customerEmail: string
  amount: number
  currency: 'CAD'
  reason: CreditReason
  sourceBookingId: string | null
  sourceReferralCode: string | null
  status: CreditStatus
  issuedAt: Date
  redeemedAt: Date | null
  redeemedOnBookingId: string | null
  adjustedBy: string | null
}
