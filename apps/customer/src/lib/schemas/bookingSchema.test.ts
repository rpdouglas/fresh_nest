import { describe, it, expect } from 'vitest'
import { bookingFormSchema } from './bookingSchema'

describe('bookingFormSchema validation', () => {
  const validData = {
    serviceType: 'standard',
    propertyType: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    pets: false,
    frequency: 'one-time',
    preferredDate: '2026-06-20',
    addOns: ['oven'],
    squareFootage: 800,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@doe.com',
    phone: '6135550199',
    address: '123 Main St, Cornwall ON',
    preferredCleaner: null,
    notes: 'No notes',
    marketingConsent: true,
    referredBy: null,
  }

  it('passes validation with correct fields', () => {
    const res = bookingFormSchema.safeParse(validData)
    expect(res.success).toBe(true)
  })

  it('fails validation if required fields are missing', () => {
    const invalidData = { ...validData }
    // @ts-expect-error - testing missing field
    delete invalidData.firstName
    const res = bookingFormSchema.safeParse(invalidData)
    expect(res.success).toBe(false)
  })

  it('fails validation for invalid email formats', () => {
    const invalidEmail = { ...validData, email: 'not-an-email' }
    const res = bookingFormSchema.safeParse(invalidEmail)
    expect(res.success).toBe(false)
  })

  it('fails validation if phone number is less than 10 digits', () => {
    const invalidPhone = { ...validData, phone: '123456789' }
    const res = bookingFormSchema.safeParse(invalidPhone)
    expect(res.success).toBe(false)
  })

  it('fails validation for out-of-range bedrooms or bathrooms', () => {
    const invalidBeds = { ...validData, bedrooms: -1 }
    const resBeds = bookingFormSchema.safeParse(invalidBeds)
    expect(resBeds.success).toBe(false)

    const invalidBaths = { ...validData, bathrooms: 11 } // Max is 10
    const resBaths = bookingFormSchema.safeParse(invalidBaths)
    expect(resBaths.success).toBe(false)
  })

  it('fails validation for invalid enum options', () => {
    const invalidFreq = { ...validData, frequency: 'hourly' }
    const res = bookingFormSchema.safeParse(invalidFreq)
    expect(res.success).toBe(false)
  })
})
