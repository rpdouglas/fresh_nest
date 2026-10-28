import type { LastChange } from '../domain/audit'
export type Language = 'en' | 'fr'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type ServiceType =
  | 'standard' | 'deep' | 'moveout' | 'postconstruction' | 'airbnb' | 'commercial'
export type Frequency = 'one-time' | 'weekly' | 'biweekly' | 'monthly'
export type LeadSource =
  | 'organic' | 'google' | 'referral' | 'facebook' | 'direct' | 'phone' | 'walk-in'

export interface Booking {
  /** P3-E37: who made the latest save (see domain/audit.ts). */
  lastChange?: LastChange
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
  /** P3-E38: internal estimate in integer cents — never shown on the public site (P3-E29). */
  estimatedPriceCents?: number
  frequency: Frequency
  pets: boolean
  address: string
  serviceType: ServiceType
  addOns: string[]
  preferredDate: string
  preferredCleaner?: string | null
  notes?: string
  leadSource: LeadSource | string
  status: BookingStatus
  assignedTo?: string | null
  isAirbnb: boolean
  photoConfirmation: boolean
  fsmAppointmentId?: string | null
  createdAt: Date
  referredBy?: string | null
  referralCode?: string | null
  jobId?: string
  createdBy?: string
  // P3-E34: saved checklist chosen for this client's visits; renewals carry it over.
  checklistTemplateId?: string | null
}

export interface Review {
  /** P3-E37: who made the latest save (see domain/audit.ts). */
  lastChange?: LastChange
  id?: string
  name: string
  location: string
  language: Language
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  approved: boolean
  rejected: boolean
  jobId: string
  createdAt: Date
}
