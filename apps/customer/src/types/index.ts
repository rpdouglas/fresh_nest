export type Language = 'en' | 'fr'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type ServiceType =
  | 'standard' | 'deep' | 'moveout' | 'postconstruction' | 'airbnb' | 'commercial'
export type Frequency = 'one-time' | 'weekly' | 'biweekly' | 'monthly'

export interface Booking {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  language: Language
  propertyType: string
  bedrooms: number
  bathrooms: number
  squareFootage?: number
  frequency: Frequency
  pets: boolean
  address: string
  serviceType: ServiceType
  addOns: string[]
  preferredDate: string
  preferredCleaner?: string | null
  notes?: string
  leadSource: string
  status: BookingStatus
  assignedTo?: string | null
  isAirbnb: boolean
  photoConfirmation: boolean
  fsmAppointmentId?: string | null
  createdAt: Date
  referredBy?: string | null
  referralCode?: string | null
  jobId?: string
}

export interface Review {
  id?: string
  name: string
  location: string
  language: Language
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  approved: boolean
  createdAt: Date
}

export interface Persona {
  id: string
  name: string
  primaryService: string
  keyFeature: string
  retentionDriver: string
}

export interface BlogPost {
  slug: string
  title: { en: string; fr: string }
  description: { en: string; fr: string }
  content: { en: string; fr: string }
  publishedAt: string
  author: { en: string; fr: string }
  readTime: { en: string; fr: string }
  image: string
}

export type StaffLanguage = 'en' | 'fr'
export type TransportMode = 'personal_vehicle' | 'transit' | 'rideshare' | 'walk'
export type StaffRole = 'cleaner' | 'lead' | 'supervisor'
export type StaffStatus = 'onboarding' | 'active' | 'inactive'

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
    acceptedTermsVersion: string
    termsHistory: TermsAcceptance[]
  }
  onboardingChecklist: Record<string, boolean>
  createdAt: Date
}

// ── F03: Job Lifecycle Types ──────────────────────────────────────────────────

export type JobStatus =
  | 'unassigned'
  | 'assigned'
  | 'acknowledged'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export interface PayRateSnapshot {
  rateId: string | null
  amount: number
  currency: 'CAD'
  effectiveAt: string  // ISO timestamp
  snapshotAt: string   // ISO timestamp
}

export interface JobPhoto {
  url: string
  storagePath: string
  phase: 'before' | 'after'
  taskId?: string
  uploadedAt: Date
  uploadedBy: string  // staff UID
  lat?: number
  lng?: number
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
  scheduledDate: string        // YYYY-MM-DD
  scheduledStartTime: string   // HH:MM
  scheduledEndTime: string     // HH:MM
  status: JobStatus
  assignedTo: string | null    // staff UID
  checkedInAt: Date | null
  checkedInGeo: { lat: number; lng: number } | null
  completedAt: Date | null
  payRateSnapshot: PayRateSnapshot
  checklistTemplate: string    // checklistTemplates doc ID
  checklistCompletions: ChecklistCompletion[]
  photos: JobPhoto[]
  createdAt: Date
}

export interface ChecklistTask {
  id: string
  labelEn: string
  labelFr: string
  icon: string
  requiresPhoto: boolean
  photoPhase: 'before' | 'after' | null
  order: number
}

export interface ChecklistTemplate {
  id?: string
  name: string
  serviceType: ServiceType
  tasks: ChecklistTask[]
  active: boolean
}
