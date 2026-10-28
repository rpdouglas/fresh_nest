import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  type Firestore,
  collection,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { readFileSync } from 'fs'
import { bookingsCollection, reviewsCollection, type Booking, type Review } from '@freshnest/shared'
import path from 'path'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'freshnest-aa51e',
    firestore: {
      rules: readFileSync(path.resolve(__dirname, '../../..', process.env['RULES_FILE'] ?? 'firestore.rules'), 'utf8'),
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
  preferredDate: '2026-07-15',
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

    // P3-E38 (ADR-020): an office booking's internal estimate is whole cents
    it('lets the office create a booking with an estimate in whole cents only', async () => {
      const officeDb = testEnv.authenticatedContext('owner-uid', { role: 'owner', email: 'lauren@freshnest.test' }).firestore()
      // 'confirmed' only passes the office branch (the public branch has no field allow-list yet, F13)
      const officeBooking = { ...validBooking, status: 'confirmed', createdBy: 'lauren@freshnest.test' }
      await assertSucceeds(setDoc(doc(officeDb, 'bookings', 'office-1'), { ...officeBooking, estimatedPriceCents: 18000 }))
      await assertFails(setDoc(doc(officeDb, 'bookings', 'office-2'), { ...officeBooking, estimatedPriceCents: 180.5 }))
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

      const adminDb = testEnv.authenticatedContext('admin-user', { role: 'owner' }).firestore()
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
    it('allows admin to update staff profiles', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'staff', 'cleaner-1'), { firstName: 'Staff', lastName: 'Member', role: 'cleaner', status: 'onboarding' })
      })
      const adminDb = testEnv.authenticatedContext('admin-1', { role: 'owner' }).firestore()
      await assertSucceeds(updateDoc(doc(adminDb, 'staff', 'cleaner-1'), { status: 'active' }))
    })

    // P3-E27-A2: staff docs are created server-side only (onStaffRegistered CF)
    it('blocks client-side staff creation, even for admins', async () => {
      const adminDb = testEnv.authenticatedContext('admin-1', { role: 'owner' }).firestore()
      const ref = doc(adminDb, 'staff', 'cleaner-2')
      await assertFails(setDoc(ref, { firstName: 'Staff', lastName: 'Member', role: 'cleaner', status: 'active' }))
    })

    it('allows staff to update their own preferences and constraints but not financials earnings', async () => {
      const staffProfile = {
        firstName: 'Ahmed',
        lastName: 'ESL',
        role: 'cleaner',
        status: 'active',
        preferences: { language: 'fr' },
        constraints: { transportMode: 'transit', transitBufferMinutes: 60, blockedWindows: [] },
        financials: { monthlyEarningsLimitCents: 80000, currentMonthEarningsCents: 20000, earningsHistory: [] },
      }
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'staff', 'ahmed-uid'), staffProfile)
      })

      const staffDb = testEnv.authenticatedContext('ahmed-uid').firestore()
      const ref = doc(staffDb, 'staff', 'ahmed-uid')

      // Update constraints and preferences (allowed)
      await assertSucceeds(updateDoc(ref, {
        preferences: { language: 'fr' },
        constraints: { transportMode: 'walk', transitBufferMinutes: 30, blockedWindows: [] },
      }))

      // Attempt to modify financials currentMonthEarningsCents (blocked)
      await assertFails(updateDoc(ref, {
        'financials.currentMonthEarningsCents': 100000,
      }))
    })

    // P3-E38: the earnings total in cents and history are protected from staff self-modification.
    it('blocks staff from changing their earnings total in cents or earningsHistory', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'staff', 'carla-uid'), {
          firstName: 'Carla', lastName: 'M', role: 'cleaner', status: 'active',
          preferences: { language: 'en' },
          constraints: { transportMode: 'transit', transitBufferMinutes: 60, blockedWindows: [] },
          financials: { monthlyEarningsLimitCents: 100000, currentMonthEarningsCents: 95000, earningsHistory: [] },
        })
      })
      const ref = doc(testEnv.authenticatedContext('carla-uid').firestore(), 'staff', 'carla-uid')
      await assertFails(updateDoc(ref, { 'financials.currentMonthEarningsCents': 0 }))
      await assertFails(updateDoc(ref, { 'financials.earningsHistory': [{ month: '2026-09', totalCents: 0 }] }))
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

    // Mirrors the exact queries issued by the FSM app hooks.
    describe('FSM query shapes', () => {
      beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const db = context.firestore()
          await setDoc(doc(db, 'jobs', 'open-1'), { ...mockJob, status: 'unassigned', assignedTo: null })
          await setDoc(doc(db, 'jobs', 'open-2'), { ...mockJob, status: 'unassigned', assignedTo: null })
          await setDoc(doc(db, 'jobs', 'mine-1'), mockJob)
        })
      })

      // apps/fsm/src/hooks/useMyAssignedShifts.ts
      it('allows staff to list their own assigned jobs (My Jobs page)', async () => {
        const staffDb = testEnv.authenticatedContext('mike-uid', { role: 'staff' }).firestore()
        await assertSucceeds(getDocs(query(collection(staffDb, 'jobs'), where('assignedTo', '==', 'mike-uid'))))
      })

      it('allows admin to list unassigned jobs', async () => {
        const adminDb = testEnv.authenticatedContext('admin-uid', { role: 'owner' }).firestore()
        await assertSucceeds(getDocs(query(
          collection(adminDb, 'jobs'),
          where('status', '==', 'unassigned'),
          orderBy('createdAt', 'desc'),
        )))
      })

      // HOTFIX-02: by design, staff cannot query unassigned jobs directly — they hold client
      // PII. The Shift Board reads a PII-minimised projection from the listOpenShifts callable.
      it('blocks staff from listing unassigned jobs directly (served by listOpenShifts)', async () => {
        const staffDb = testEnv.authenticatedContext('mike-uid', { role: 'staff' }).firestore()
        await assertFails(getDocs(query(
          collection(staffDb, 'jobs'),
          where('status', '==', 'unassigned'),
          orderBy('createdAt', 'desc'),
        )))
      })

      it('blocks staff from reading a single unassigned job before claiming it', async () => {
        const staffDb = testEnv.authenticatedContext('mike-uid', { role: 'staff' }).firestore()
        await assertFails(getDoc(doc(staffDb, 'jobs', 'open-1')))
      })
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

  describe('Gallery Pairs Collection (P3-E32)', () => {
    const pair = (published: boolean) => ({
      serviceKey: 'deep',
      captionEn: 'Kitchen deep clean',
      captionFr: 'Grand nettoyage de cuisine',
      beforePath: 'gallery/p/before-1.jpg',
      afterPath: 'gallery/p/after-1.jpg',
      beforeUrl: 'https://example.test/before.jpg',
      afterUrl: 'https://example.test/after.jpg',
      published,
      featured: false,
      order: 0,
      consentConfirmed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin-uid',
    })
    const admin = () => testEnv.authenticatedContext('admin-uid', { role: 'owner' }).firestore() as unknown as Firestore
    const visitor = () => testEnv.unauthenticatedContext().firestore() as unknown as Firestore
    const cleaner = () => testEnv.authenticatedContext('staff-uid', { role: 'staff' }).firestore() as unknown as Firestore

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore() as unknown as Firestore
        await setDoc(doc(db, 'galleryPairs', 'live'), pair(true))
        await setDoc(doc(db, 'galleryPairs', 'draft'), pair(false))
      })
    })

    it('lets a visitor read a published pair and run the public query', async () => {
      await assertSucceeds(getDoc(doc(visitor(), 'galleryPairs', 'live')))
      await assertSucceeds(getDocs(query(collection(visitor(), 'galleryPairs'), where('published', '==', true))))
    })

    it('hides unpublished pairs from visitors', async () => {
      await assertFails(getDoc(doc(visitor(), 'galleryPairs', 'draft')))
      await assertFails(getDocs(collection(visitor(), 'galleryPairs')))
    })

    it('blocks visitors and staff from writing', async () => {
      await assertFails(setDoc(doc(visitor(), 'galleryPairs', 'new'), pair(true)))
      await assertFails(updateDoc(doc(visitor(), 'galleryPairs', 'live'), { captionEn: 'x' }))
      await assertFails(setDoc(doc(cleaner(), 'galleryPairs', 'new'), pair(true)))
      await assertFails(updateDoc(doc(cleaner(), 'galleryPairs', 'draft'), { published: true }))
    })

    it('lets an admin read all pairs and create, update and delete', async () => {
      await assertSucceeds(getDocs(collection(admin(), 'galleryPairs')))
      await assertSucceeds(setDoc(doc(admin(), 'galleryPairs', 'new'), pair(false)))
      await assertSucceeds(updateDoc(doc(admin(), 'galleryPairs', 'new'), { published: true }))
      await assertSucceeds(deleteDoc(doc(admin(), 'galleryPairs', 'new')))
    })
  })

  describe('Default Deny-All', () => {
    it('blocks write operations to undocumented collections', async () => {
      const adminDb = testEnv.authenticatedContext('admin-1', { role: 'owner' }).firestore()
      const ref = doc(adminDb, 'unregisteredCollection', 'secret')
      await assertFails(setDoc(ref, { data: 'stolen' }))
    })
  })
})

// Regression (P3-E29 preview review): the app writes through the shared withConverter()
// collections. Their toFirestore() used to copy serverTimestamp() into a plain map, so
// `createdAt == request.time` failed and every public booking, admin booking and review
// was denied. These tests write through the real converters, exactly like the app.
describe('Writes through shared converters (serverTimestamp preserved)', () => {
  // rules-unit-testing returns the compat type; it is the same modular instance at runtime.
  const publicDb = () => testEnv.unauthenticatedContext().firestore() as unknown as Firestore

  it('accepts a public quote request written via bookingsCollection()', async () => {
    await assertSucceeds(addDoc(bookingsCollection(publicDb()), {
      ...validBooking,
      preferredDate: '2026-10-20',
      addOns: [],
      preferredCleaner: null,
      notes: '',
      fsmAppointmentId: null,
      squareFootage: undefined, // stripped by the converter
      createdAt: serverTimestamp(),
    } as unknown as Booking))
  })

  it('accepts a public review written via reviewsCollection()', async () => {
    await assertSucceeds(addDoc(reviewsCollection(publicDb()), {
      name: 'Margaret S.', location: 'Cornwall', language: 'en', rating: 5, text: 'Wonderful',
      approved: false, rejected: false, jobId: 'job-1', createdAt: serverTimestamp(),
    } as unknown as Review))
  })
})

describe('Staff notifications (N-2: mark as read)', () => {
  const message = { title: 'New shift', body: 'You have a new shift', type: 'shift_assigned', jobId: 'job-1', read: false, createdAt: new Date() }
  const msgPath = (uid: string) => `notifications/${uid}/messages/m1`

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), msgPath('brenda')), message)
    })
  })

  const staffDb = (uid: string) => testEnv.authenticatedContext(uid, { role: 'staff' }).firestore()

  it('the recipient can mark their own message read', async () => {
    await assertSucceeds(updateDoc(doc(staffDb('brenda'), msgPath('brenda')), { read: true }))
  })

  it('the recipient cannot change anything else, or mark it unread', async () => {
    await assertFails(updateDoc(doc(staffDb('brenda'), msgPath('brenda')), { read: true, title: 'Edited' }))
    await assertFails(updateDoc(doc(staffDb('brenda'), msgPath('brenda')), { body: 'Edited' }))
    await assertFails(updateDoc(doc(staffDb('brenda'), msgPath('brenda')), { read: false }))
  })

  it("another staff member cannot touch someone else's messages", async () => {
    await assertFails(updateDoc(doc(staffDb('carla'), msgPath('brenda')), { read: true }))
    await assertFails(getDoc(doc(staffDb('carla'), msgPath('brenda'))))
  })

  it('messages still cannot be created or deleted from the app', async () => {
    await assertFails(setDoc(doc(staffDb('brenda'), 'notifications/brenda/messages/m2'), message))
    await assertFails(deleteDoc(doc(staffDb('brenda'), msgPath('brenda'))))
  })
})

describe('Office roles (P3-E35: owner and manager; the legacy admin claim is refused)', () => {
  const as = (role: string, uid = `${role}-uid`, email = `${role}@freshnest.test`) =>
    testEnv.authenticatedContext(uid, { role, email }).firestore()

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, 'payRates/r1'), { role: 'cleaner', amount: 22, currency: 'CAD', effectiveFrom: new Date(), effectiveTo: null, createdBy: 'x', createdAt: new Date() })
      await setDoc(doc(db, 'auditLog/a1'), { collection: 'jobs', documentId: 'j1', field: 'assignedTo', changedBy: 'x', changedAt: new Date(), reason: 'r', overrideType: 't' })
      await setDoc(doc(db, 'admins/owner@freshnest.test'), { role: 'owner' })
      await setDoc(doc(db, 'jobs/j1'), { assignedTo: 'brenda', status: 'assigned', bookingId: 'b1' })
      await setDoc(doc(db, 'staff/brenda'), { firstName: 'Brenda', role: 'lead' })
    })
  })

  for (const role of ['owner', 'manager']) {
    it(`${role}: full office access — pay rates, audit log, office list, any job, staff profiles`, async () => {
      const db = as(role)
      await assertSucceeds(getDoc(doc(db, 'payRates/r1')))
      await assertSucceeds(getDoc(doc(db, 'auditLog/a1')))
      await assertSucceeds(getDocs(collection(db, 'admins')))
      await assertSucceeds(getDoc(doc(db, 'jobs/j1')))
      await assertSucceeds(getDoc(doc(db, 'staff/brenda')))
      await assertSucceeds(updateDoc(doc(db, 'jobs/j1'), { status: 'unassigned' }))
    })
  }

  for (const role of ['admin', 'staff', 'supervisor', 'customer']) {
    it(`${role}: no office data`, async () => {
      const db = as(role)
      await assertFails(getDoc(doc(db, 'payRates/r1')))
      await assertFails(getDoc(doc(db, 'auditLog/a1')))
      await assertFails(getDocs(collection(db, 'admins')))
      await assertFails(getDoc(doc(db, 'jobs/j1')))
    })
  }

  it('nobody can write the office allowlist from an app (only the setUserRole function)', async () => {
    await assertFails(setDoc(doc(as('owner'), 'admins/new@freshnest.test'), { role: 'manager' }))
    await assertFails(setDoc(doc(as('manager'), 'admins/new@freshnest.test'), { role: 'owner' }))
  })

  it('a non-office user can still check their own allowlist entry', async () => {
    await assertSucceeds(getDoc(doc(as('customer', 'c1', 'owner@freshnest.test'), 'admins/owner@freshnest.test')))
  })
})

describe('Operational Settings & Policy (P3-E36 / W0-2)', () => {
  const as = (role: string, uid = `${role}-uid`, email = `${role}@freshnest.test`) =>
    testEnv.authenticatedContext(uid, { role, email }).firestore()

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, 'settings/policy'), {
        defaultVehicleBufferMinutes: 30,
        defaultTransitBufferMinutes: 60,
        version: 1,
        updatedBy: 'owner@freshnest.test',
        updatedAt: new Date(),
      })
      await setDoc(doc(db, 'settings/policy/history/1'), {
        version: 1,
        changedBy: 'owner@freshnest.test',
        changedAt: new Date(),
        reason: 'Initial policy',
        changes: [],
        snapshot: { defaultVehicleBufferMinutes: 30, defaultTransitBufferMinutes: 60 },
      })
    })
  })

  for (const role of ['owner', 'manager', 'supervisor', 'staff']) {
    it(`${role}: can read settings/policy`, async () => {
      await assertSucceeds(getDoc(doc(as(role), 'settings/policy')))
    })
  }

  for (const role of ['customer', 'admin']) {
    it(`${role} and unauthenticated: cannot read settings/policy`, async () => {
      await assertFails(getDoc(doc(as(role), 'settings/policy')))
      await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'settings/policy')))
    })
  }

  for (const role of ['owner', 'manager']) {
    it(`${role}: can read settings/policy/history/{version}`, async () => {
      await assertSucceeds(getDoc(doc(as(role), 'settings/policy/history/1')))
      await assertSucceeds(getDocs(collection(as(role), 'settings/policy/history')))
    })
  }

  for (const role of ['supervisor', 'staff', 'customer']) {
    it(`${role}: cannot read settings/policy/history/{version}`, async () => {
      await assertFails(getDoc(doc(as(role), 'settings/policy/history/1')))
    })
  }

  it('nobody can write directly to settings/policy or settings/policy/history from client SDKs', async () => {
    await assertFails(setDoc(doc(as('owner'), 'settings/policy'), { defaultVehicleBufferMinutes: 45 }))
    await assertFails(setDoc(doc(as('owner'), 'settings/policy/history/2'), { version: 2 }))
  })
})


describe('Audit everywhere (P3-E37 / W0-3): locked audit log and the lastChange stamp', () => {
  const as = (role: string, uid = `${role}-uid`, email = `${role}@freshnest.test`) =>
    testEnv.authenticatedContext(uid, { role, email }).firestore()
  const stamp = (by: string, source: string, extra: Record<string, unknown> = {}) => ({
    lastChange: { by, at: serverTimestamp(), source, reason: null, overrideType: null, ...extra },
  })

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, 'auditLog/a1'), { collection: 'jobs', documentId: 'j1', field: 'status', changedBy: 'x', changedAt: new Date(), reason: null, overrideType: null })
      await setDoc(doc(db, 'jobs/j1'), {
        assignedTo: 'brenda', status: 'assigned', bookingId: 'b1',
        lastChange: { by: 'owner@freshnest.test', at: new Date('2026-01-01'), source: 'admin' },
      })
      await setDoc(doc(db, 'bookings/b1'), { ...validBooking, email: 'client@test.com', createdAt: new Date() })
      await setDoc(doc(db, 'galleryPairs/g1'), { captionEn: 'Kitchen', published: false })
    })
  })

  it('no app can create, edit or delete audit entries — not even the Owner', async () => {
    for (const role of ['owner', 'manager', 'staff', 'customer']) {
      await assertFails(setDoc(doc(as(role), 'auditLog/new'), { collection: 'jobs', documentId: 'j1', field: 'x', changedBy: `${role}@freshnest.test`, changedAt: new Date(), reason: null, overrideType: null }))
    }
    await assertFails(updateDoc(doc(as('owner'), 'auditLog/a1'), { reason: 'edited' }))
    await assertFails(deleteDoc(doc(as('owner'), 'auditLog/a1')))
    await assertSucceeds(getDoc(doc(as('manager'), 'auditLog/a1')))
  })

  it('an office save with a stamp naming the signed-in person (and an override reason) is accepted', async () => {
    await assertSucceeds(updateDoc(doc(as('owner'), 'jobs/j1'), {
      status: 'unassigned', ...stamp('owner@freshnest.test', 'admin', { reason: 'Short drive', overrideType: 'travel_conflict_exceeded' }),
    }))
  })

  it('a stamp naming someone else, with the wrong time, or with extra fields is rejected', async () => {
    const ref = doc(as('manager'), 'jobs/j1')
    await assertFails(updateDoc(ref, { status: 'unassigned', ...stamp('owner@freshnest.test', 'admin') }))
    await assertFails(updateDoc(ref, { status: 'unassigned', lastChange: { by: 'manager@freshnest.test', at: new Date('2020-01-01'), source: 'admin' } }))
    await assertFails(updateDoc(ref, { status: 'unassigned', ...stamp('manager@freshnest.test', 'admin', { extra: 1 }) }))
    await assertFails(updateDoc(ref, { status: 'unassigned', ...stamp('manager@freshnest.test', 'admin', { reason: 'x'.repeat(501) }) }))
  })

  it('the assigned cleaner can stamp their own job update as staff_app, but cannot claim to be the office', async () => {
    const db = testEnv.authenticatedContext('brenda', { role: 'staff', email: 'brenda@freshnest.test' }).firestore()
    await assertSucceeds(updateDoc(doc(db, 'jobs/j1'), { status: 'in_progress', ...stamp('brenda@freshnest.test', 'staff_app') }))
    await assertFails(updateDoc(doc(db, 'jobs/j1'), { status: 'completed', ...stamp('brenda@freshnest.test', 'admin') }))
  })

  it('tolerant period: saves without a stamp, or keeping the old one, still work (older cached apps)', async () => {
    await assertSucceeds(updateDoc(doc(as('owner'), 'jobs/j1'), { status: 'unassigned' }))
    await assertSucceeds(updateDoc(doc(as('owner'), 'bookings/b1'), { status: 'confirmed' }))
  })

  it('a customer cancels their own booking with a customer stamp; an office stamp is refused', async () => {
    const db = testEnv.authenticatedContext('c1', { role: 'customer', email: 'client@test.com' }).firestore()
    await assertFails(updateDoc(doc(db, 'bookings/b1'), { status: 'cancelled', ...stamp('client@test.com', 'admin') }))
    await assertSucceeds(updateDoc(doc(db, 'bookings/b1'), { status: 'cancelled', ...stamp('client@test.com', 'customer') }))
  })

  it('a signed-out quote request may be stamped only as the public form', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(setDoc(doc(db, 'bookings/q1'), { ...validBooking, ...stamp('public', 'public_form') }))
    await assertFails(setDoc(doc(db, 'bookings/q2'), { ...validBooking, ...stamp('lauren@freshnest.test', 'admin') }))
  })

  it('gallery: stamped saves, then delete (stamp-then-delete) still work for the office', async () => {
    const db = as('owner')
    await assertSucceeds(updateDoc(doc(db, 'galleryPairs/g1'), { published: true, ...stamp('owner@freshnest.test', 'admin') }))
    await assertSucceeds(deleteDoc(doc(db, 'galleryPairs/g1')))
  })
})
