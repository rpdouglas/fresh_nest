import { describe, it, expect, vi, beforeEach } from 'vitest'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingFormSchema, type BookingFormData } from '@/lib/schemas/bookingSchema'

// Capture what would be written to Firestore without touching the network.
const addDocMock = vi.fn((..._args: unknown[]) => Promise.resolve({ id: 'booking-123' }))

vi.mock('@/lib/firebase/firebase', () => ({ db: {} }))
vi.mock('@freshnest/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@freshnest/shared')>()),
  bookingsCollection: () => ({}),
}))
vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  addDoc: (...args: unknown[]) => addDocMock(...args),
}))

const { submitBooking, withoutUndefined } = await import('./firestore')

// BookingPage's defaultValues plus what a customer fills in on steps 2–3.
const formValues = {
  serviceType: 'standard', propertyType: '3-4bed', bedrooms: 3, bathrooms: 1, pets: false,
  frequency: 'one-time', preferredDate: '2026-10-20', addOns: [], squareFootage: undefined,
  firstName: 'Margaret', lastName: 'Storey', email: 'margaret@example.com', phone: '6135550199',
  address: '123 Pitt St, Cornwall ON', preferredCleaner: null, notes: '', marketingConsent: false,
}

async function parse(values: typeof formValues): Promise<BookingFormData> {
  const result = await zodResolver(bookingFormSchema)(
    values as never,
    undefined,
    { fields: {}, shouldUseNativeValidation: false },
  )
  expect(result.errors).toEqual({})
  return result.values as BookingFormData
}

describe('withoutUndefined', () => {
  it('drops undefined fields but keeps null, false, 0 and empty strings', () => {
    expect(withoutUndefined({ a: undefined, b: null, c: false, d: 0, e: '' })).toEqual({ b: null, c: false, d: 0, e: '' })
  })
})

describe('submitBooking (public quote request)', () => {
  beforeEach(() => addDocMock.mockClear())

  // Regression: squareFootage has no form input, stays undefined after Zod parsing, and
  // Firestore rejected every public request with "Unsupported field value: undefined".
  it('never sends undefined field values to Firestore', async () => {
    const data = await parse(formValues)
    expect(Object.keys(data)).toContain('squareFootage') // Zod keeps the undefined key

    await submitBooking(data, 'en', 'organic')

    const written = addDocMock.mock.calls[0]?.[1] as Record<string, unknown>
    expect(Object.entries(written).filter(([, v]) => v === undefined)).toEqual([])
    expect(written).not.toHaveProperty('squareFootage')
  })

  it('writes a pending request with no price or payment fields (P3-E29)', async () => {
    await submitBooking(await parse(formValues), 'fr', 'organic')

    const written = addDocMock.mock.calls[0]?.[1] as Record<string, unknown>
    expect(written).toMatchObject({ status: 'pending', language: 'fr', assignedTo: null, leadSource: 'organic' })
    expect(written).not.toHaveProperty('estimatedPrice')
    expect(written).not.toHaveProperty('stripePaymentIntentId')
    expect(written).not.toHaveProperty('stripeChargeStatus')
  })

  it('keeps a provided square footage', async () => {
    await submitBooking(await parse({ ...formValues, squareFootage: 1800 as never }), 'en', 'organic')
    expect(addDocMock.mock.calls[0]?.[1]).toHaveProperty('squareFootage', 1800)
  })
})
