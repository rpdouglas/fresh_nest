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
