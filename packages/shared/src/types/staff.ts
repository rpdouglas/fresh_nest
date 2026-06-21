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
  financials: {
    monthlyEarningsLimit: number | null
    currentMonthEarnings: number
    earningsHistory: Array<{ month: string; total: number }>
  }
  compliance: {
    acceptedTermsVersion: string | null
    termsHistory: TermsAcceptance[]
  }
  onboardingChecklist: Record<string, boolean>
  createdAt: Date
}
