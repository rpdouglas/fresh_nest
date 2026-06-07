import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { BookingFormData } from '@/lib/bookingSchema'
import type { Language } from '@/types'

export type LeadSource = 'organic' | 'google' | 'referral' | 'facebook' | 'direct'

export function detectLeadSource(params: URLSearchParams): LeadSource {
  const ref = (params.get('ref') ?? params.get('utm_source') ?? '').toLowerCase()
  const map: Record<string, LeadSource> = {
    google:   'google',
    facebook: 'facebook',
    referral: 'referral',
    direct:   'direct',
  }
  return map[ref] ?? 'organic'
}

export async function submitBooking(
  data: BookingFormData,
  language: Language,
  source: LeadSource,
): Promise<string> {
  const { marketingConsent, ...formFields } = data

  const doc: Record<string, unknown> = {
    ...formFields,
    language,
    leadSource:        source,
    status:            'pending',
    assignedTo:        null,
    isAirbnb:          data.serviceType === 'airbnb',
    photoConfirmation: data.serviceType === 'airbnb' || data.serviceType === 'commercial',
    fsmAppointmentId:  null,
    createdAt:         serverTimestamp(),
  }

  if (marketingConsent) {
    doc.marketingConsent = true
    doc.consentTimestamp = Timestamp.now()
    doc.consentMethod    = 'booking-form-v2'
  }

  const ref = await addDoc(collection(db, 'bookings'), doc)
  return ref.id
}
