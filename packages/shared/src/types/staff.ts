// 'ar' included per P10 Ahmed's FSM Arabic toggle (LanguageSelectionOverlay already
// writes it at runtime; this type previously omitted it — P3-E27-C2 correction).
export type StaffLanguage = 'en' | 'fr' | 'ar'
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

export type BackgroundCheckStatus = 'not_started' | 'pending' | 'cleared' | 'flagged'

export interface BackgroundCheck {
  consentGiven: boolean
  consentGivenAt: Date | null
  consentIpAddress: string | null
  status: BackgroundCheckStatus
  completedAt: Date | null
  provider?: string
  notes?: string
}

export interface EmploymentAgreement {
  version: string
  acceptedAt: Date
  signedByName: string
  ipAddress: string | null
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface ProfileCorrection {
  text: string
  flaggedAt: Date
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
  welcomeEmailSentAt?: Date | null
  onboardingChecklist: Record<string, boolean>
  backgroundCheck: BackgroundCheck
  employmentAgreement: EmploymentAgreement | null
  emergencyContact: EmergencyContact | null
  corrections: ProfileCorrection[]
  createdAt: Date
}
