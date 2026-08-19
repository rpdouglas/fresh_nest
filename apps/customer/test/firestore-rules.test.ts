import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { readFileSync } from 'fs'
import path from 'path'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'freshnest-aa51e',
    firestore: {
      rules: readFileSync(path.resolve(__dirname, '../../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

const validBooking = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '6135550199',
  language: 'en',
  propertyType: 'apartment',
  bedrooms: 1,
  bathrooms: 1,
  frequency: 'one-time',
  pets: false,
  address: '123 Main St, Cornwall ON',
  serviceType: 'standard',
  leadSource: 'organic',
  status: 'pending',
  assignedTo: null,
  isAirbnb: false,
  photoConfirmation: false,
  createdAt: serverTimestamp(),
}

describe('Firestore Security Rules', () => {
  describe('Bookings Collection', () => {
    it('allows public creation of booking with valid fields', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      const ref = doc(db, 'bookings', 'new-booking')
      await assertSucceeds(setDoc(ref, validBooking))
    })

    it('blocks booking creation if required fields are missing', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      const ref = doc(db, 'bookings', 'invalid-booking')
      const invalidBooking = { ...validBooking }
      // @ts-expect-error - testing missing required field
      delete invalidBooking.firstName
      await assertFails(setDoc(ref, invalidBooking))
    })

    it('blocks booking creation if status is not pending', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      const ref = doc(db, 'bookings', 'invalid-status')
      await assertFails(setDoc(ref, { ...validBooking, status: 'confirmed' }))
    })

    it('blocks booking creation if cleaner is pre-assigned', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      const ref = doc(db, 'bookings', 'preassigned')
      await assertFails(setDoc(ref, { ...validBooking, assignedTo: 'cleaner-123' }))
    })

    it('allows admin to read all bookings', async () => {
      // Setup: Seed a booking as admin (without rules constraints using testEnv.withSecurityRulesDisabled)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'bookings', 'booking-1'), { ...validBooking, email: 'john@example.com' })
      })

      const adminDb = testEnv.authenticatedContext('admin-user', { role: 'admin' }).firestore()
      await assertSucceeds(getDoc(doc(adminDb, 'bookings', 'booking-1')))
    })

    it('allows client to read their own booking, blocks others', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'bookings', 'booking-client'), { ...validBooking, email: 'client@test.com' })
      })

      const clientDb = testEnv.authenticatedContext('client-user', { email: 'client@test.com' }).firestore()
      await assertSucceeds(getDoc(doc(clientDb, 'bookings', 'booking-client')))

      const otherDb = testEnv.authenticatedContext('other-user', { email: 'other@test.com' }).firestore()
      await assertFails(getDoc(doc(otherDb, 'bookings', 'booking-client')))
    })

    it('allows client to cancel their own booking (updating only status to cancelled)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'bookings', 'cancel-booking'), { ...validBooking, email: 'client@test.com' })
      })

      const clientDb = testEnv.authenticatedContext('client-user', { email: 'client@test.com' }).firestore()
      const ref = doc(clientDb, 'bookings', 'cancel-booking')
      await assertSucceeds(updateDoc(ref, { status: 'cancelled' }))
    })

    it('blocks client from changing other fields on update', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'bookings', 'edit-booking'), { ...validBooking, email: 'client@test.com' })
      })

      const clientDb = testEnv.authenticatedContext('client-user', { email: 'client@test.com' }).firestore()
      const ref = doc(clientDb, 'bookings', 'edit-booking')
      await assertFails(updateDoc(ref, { firstName: 'Hack' }))
    })
  })

  describe('Staff Collection', () => {
    it('allows admin to manage staff profiles', async () => {
      const adminDb = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore()
      const ref = doc(adminDb, 'staff', 'cleaner-1')
      await assertSucceeds(setDoc(ref, { firstName: 'Staff', lastName: 'Member', role: 'cleaner', status: 'active' }))
    })

    it('allows staff to update their own preferences and constraints but not financials earnings', async () => {
      const staffProfile = {
        firstName: 'Ahmed',
        lastName: 'ESL',
        role: 'cleaner',
        status: 'active',
        preferences: { language: 'ar' },
        constraints: { transportMode: 'transit', transitBufferMinutes: 60, blockedWindows: [] },
        financials: { monthlyEarningsLimit: 800, currentMonthEarnings: 200, earningsHistory: [] },
      }
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'staff', 'ahmed-uid'), staffProfile)
      })

      const staffDb = testEnv.authenticatedContext('ahmed-uid').firestore()
      const ref = doc(staffDb, 'staff', 'ahmed-uid')

      // Update constraints and preferences (allowed)
      await assertSucceeds(updateDoc(ref, {
        preferences: { language: 'ar' },
        constraints: { transportMode: 'walk', transitBufferMinutes: 30, blockedWindows: [] },
      }))

      // Attempt to modify financials currentMonthEarnings (blocked)
      await assertFails(updateDoc(ref, {
        'financials.currentMonthEarnings': 1000,
      }))
    })
  })

  describe('Jobs Collection', () => {
    const mockJob = {
      bookingId: 'booking-123',
      clientName: 'Jane Smith',
      clientAddress: '456 Riverdale, Cornwall ON',
      clientPhone: '6135559900',
      serviceType: 'deep',
      scheduledDate: '2026-06-20',
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:30',
      status: 'assigned',
      assignedTo: 'mike-uid',
      checkedInAt: null,
      checkedInGeo: null,
      completedAt: null,
      payRateSnapshot: { rateId: 'rate-1', amount: 20, currency: 'CAD' },
      checklistTemplate: 'temp-1',
      checklistCompletions: [],
      photos: [],
      createdAt: new Date(),
    }

    it('allows assigned cleaner to update job checkin/checklist progress', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'jobs', 'job-1'), mockJob)
      })

      const staffDb = testEnv.authenticatedContext('mike-uid', { role: 'staff' }).firestore()
      const ref = doc(staffDb, 'jobs', 'job-1')
      await assertSucceeds(updateDoc(ref, {
        status: 'in_progress',
        checkedInAt: new Date(),
        checkedInGeo: { lat: 45.02, lng: -74.73 },
      }))
    })

    it('blocks non-assigned cleaner from accessing or updating the job', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'jobs', 'job-1'), mockJob)
      })

      const otherDb = testEnv.authenticatedContext('other-uid', { role: 'staff' }).firestore()
      const ref = doc(otherDb, 'jobs', 'job-1')
      await assertFails(getDoc(ref))
      await assertFails(updateDoc(ref, { status: 'completed' }))
    })
  })

  describe('Checklist Templates', () => {
    it('allows any staff member to read checklist templates, but blocks public access', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'checklistTemplates', 'temp-standard'), { name: 'Standard Cleaning', active: true })
      })

      const staffDb = testEnv.authenticatedContext('staff-1', { role: 'staff' }).firestore()
      await assertSucceeds(getDoc(doc(staffDb, 'checklistTemplates', 'temp-standard')))

      const publicDb = testEnv.unauthenticatedContext().firestore()
      await assertFails(getDoc(doc(publicDb, 'checklistTemplates', 'temp-standard')))
    })
  })

  describe('Default Deny-All', () => {
    it('blocks write operations to undocumented collections', async () => {
      const adminDb = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore()
      const ref = doc(adminDb, 'unregisteredCollection', 'secret')
      await assertFails(setDoc(ref, { data: 'stolen' }))
    })
  })
})
