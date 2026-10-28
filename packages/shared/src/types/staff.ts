import type { LastChange } from '../domain/audit'
export type StaffLanguage = 'en' | 'fr'
export type TransportMode = 'personal_vehicle' | 'transit' | 'rideshare' | 'walk'
export type StaffRole = 'cleaner' | 'lead' | 'supervisor'
export type StaffStatus = 'onboarding' | 'active' | 'inactive'

export interface BlockedWindow {
  id: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startTime: string
  endTime: string
  recurring: boolean
  date?: string
  label: string
}

export interface TermsAcceptance {
  version: string
  acceptedAt: Date
  ipAddress?: string
}

export interface Staff {
  /** P3-E37: who made the latest save (see domain/audit.ts). */
  lastChange?: LastChange
  id: string
  uid?: string
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
  /** P3-E38: integer cents (ADR-020); `null` limit = no cap. Months are Toronto `YYYY-MM`. */
  financials: {
    monthlyEarningsLimitCents: number | null
    currentMonthEarningsCents: number
    earningsHistory: Array<{ month: string; totalCents: number }>
  }
  compliance: {
    acceptedTermsVersion: string | null
    termsHistory: TermsAcceptance[]
  }
  welcomeEmailSentAt?: Date | null
  onboardingChecklist: Record<string, boolean>
  createdAt: Date
}
