import { describe, it, expect, vi, beforeEach } from 'vitest'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingFormSchema, type BookingFormData } from '@/lib/schemas/bookingSchema'

// Capture what would be written to Firestore without touching the network.
const addDocMock = vi.fn((..._args: unknown[]) => Promise.resolve({ id: 'booking-123' }))

vi.mock('@/lib/firebase/firebase', () => ({ db: {} }))
vi.mock('@freshnest/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@freshnest/shared')>()),
  bookingsCollection: () => ({ name: 'bookings' }),
  jobsCollection: () => ({ name: 'jobs' }),
  staffCollection: () => ({ name: 'staff' }),
  auditLogCollection: () => ({ name: 'auditLog' }),
}))

// A fake transaction that enforces Firestore's rule: every read must come before any write.
const staffDocs: Record<string, { financials?: { currentMonthEarnings?: number } }> = {}
const txUpdates: { path: string; data: Record<string, unknown> }[] = []
function fakeTransaction() {
  let wrote = false
  return {
    get: (ref: { path: string }) => {
      if (wrote) throw new Error('Firestore transactions require all reads to be executed before all writes.')
      const data = staffDocs[ref.path.replace('staff/', '')]
      return Promise.resolve({ exists: () => data !== undefined, data: () => data })
    },
    update: (ref: { path: string }, data: Record<string, unknown>) => { wrote = true; txUpdates.push({ path: ref.path, data }) },
    set: () => { wrote = true },
  }
}
vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  doc: (col: { name: string }, id?: string) => ({ path: `${col.name}/${id ?? 'auto'}`, id: id ?? 'auto' }),
  runTransaction: (_db: unknown, fn: (tx: ReturnType<typeof fakeTransaction>) => Promise<void>) => fn(fakeTransaction()),
}))

const { submitBooking, createAdminBooking, normalizeEmail, assignCleanerTransaction } = await import('./firestore')

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

describe('submitBooking (public quote request)', () => {
  beforeEach(() => addDocMock.mockClear())

  it('writes a pending request with no price or payment fields (P3-E29)', async () => {
    await submitBooking(await parse(formValues), 'fr', 'organic')

    const written = addDocMock.mock.calls[0]?.[1] as Record<string, unknown>
    expect(written).toMatchObject({ status: 'pending', language: 'fr', assignedTo: null, leadSource: 'organic' })
    expect(written).not.toHaveProperty('estimatedPrice')
    expect(written).not.toHaveProperty('stripePaymentIntentId')
    expect(written).not.toHaveProperty('stripeChargeStatus')
  })

  it('stores the email lowercased so the customer portal and read rule can find it', async () => {
    await submitBooking(await parse({ ...formValues, email: 'Margaret.Storey@Example.COM' }), 'en', 'organic')
    expect(addDocMock.mock.calls[0]?.[1]).toHaveProperty('email', 'margaret.storey@example.com')
  })

  it('keeps a provided square footage', async () => {
    await submitBooking(await parse({ ...formValues, squareFootage: 1800 as never }), 'en', 'organic')
    expect(addDocMock.mock.calls[0]?.[1]).toHaveProperty('squareFootage', 1800)
  })
})

describe('assignCleanerTransaction (P12 Lauren dispatch)', () => {
  beforeEach(() => {
    txUpdates.length = 0
    staffDocs['carla'] = { financials: { currentMonthEarnings: 400 } }
    staffDocs['brenda'] = { financials: { currentMonthEarnings: 100 } }
  })

  const base = { bookingId: 'b1', jobId: 'j1', estimatedPay: 60, changedByEmail: 'lauren@example.com' }

  it('reassigning reads both cleaners before writing and moves the earnings', async () => {
    await assignCleanerTransaction({
      ...base, cleanerId: 'brenda', cleanerName: 'Brenda Côté', oldCleanerId: 'carla',
    })
    expect(txUpdates).toContainEqual({ path: 'bookings/b1', data: { assignedTo: 'Brenda Côté' } })
    expect(txUpdates).toContainEqual({ path: 'jobs/j1', data: { assignedTo: 'brenda', status: 'assigned' } })
    expect(txUpdates).toContainEqual({ path: 'staff/brenda', data: { 'financials.currentMonthEarnings': 160 } })
    expect(txUpdates).toContainEqual({ path: 'staff/carla', data: { 'financials.currentMonthEarnings': 340 } })
  })

  it('unassigning returns the job to the pool and never takes earnings below zero', async () => {
    staffDocs['carla'] = { financials: { currentMonthEarnings: 20 } }
    await assignCleanerTransaction({ ...base, cleanerId: null, cleanerName: null, oldCleanerId: 'carla' })
    expect(txUpdates).toContainEqual({ path: 'jobs/j1', data: { assignedTo: null, status: 'unassigned' } })
    expect(txUpdates).toContainEqual({ path: 'staff/carla', data: { 'financials.currentMonthEarnings': 0 } })
  })

  it('reassigning to the same cleaner leaves earnings unchanged', async () => {
    await assignCleanerTransaction({ ...base, cleanerId: 'carla', cleanerName: 'Carla', oldCleanerId: 'carla' })
    expect(txUpdates.some((u) => u.path.startsWith('staff/'))).toBe(false)
  })
})

describe('email normalisation', () => {
  beforeEach(() => addDocMock.mockClear())

  it('trims and lowercases', () => {
    expect(normalizeEmail('  Diane.Lafleur@Example.CA ')).toBe('diane.lafleur@example.ca')
  })

  it('admin phone-in bookings are stored lowercased too', async () => {
    await createAdminBooking({
      serviceType: 'standard', propertyType: '3-4bed', bedrooms: 3, bathrooms: 2, pets: false, addOns: [],
      frequency: 'biweekly', preferredDate: '2026-11-10', firstName: 'Diane', lastName: 'Lafleur',
      email: 'Diane@Example.CA', phone: '6135550100', address: '12 Pitt St, Cornwall ON',
      language: 'fr', leadSource: 'phone', assignedTo: null, status: 'pending', marketingConsent: false,
    }, 'lauren@example.com')
    expect(addDocMock.mock.calls[0]?.[1]).toHaveProperty('email', 'diane@example.ca')
  })
})
