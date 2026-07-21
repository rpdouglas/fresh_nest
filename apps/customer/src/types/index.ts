// Shared types — re-exported from @freshnest/shared
export type {
  Language,
  BookingStatus,
  ServiceType,
  Frequency,
  LeadSource,
  Booking,
  StaffLanguage,
  TransportMode,
  StaffRole,
  StaffStatus,
  BlockedWindow,
  TermsAcceptance,
  BackgroundCheck,
  BackgroundCheckStatus,
  Staff,
  JobStatus,
  PayRateSnapshot,
  JobPhoto,
  ChecklistCompletion,
  Job,
  ChecklistTask,
  ChecklistTemplate,
  PayRate,
  AuditEntry,
  Review,
} from '@freshnest/shared'

// Customer-app-only types

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
