// Admin visual harness (P3-E33): seeds the Firestore + Auth emulators with fixed sample data.
// Dates are fixed (2026-10-26) so screenshots are stable; the browser clock is pinned to match.
// Run inside `firebase emulators:exec` (see the test:admin-visual script). Fake data only.
'use strict'
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099'

initializeApp({ projectId: 'freshnest-aa51e' })
const db = getFirestore()
const TODAY = '2026-10-26'
const day = (n) => {
  const d = new Date(`${TODAY}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const at = (iso) => Timestamp.fromDate(new Date(iso))

async function main() {
  const admin = await getAuth().createUser({
    uid: 'admin-lauren', email: 'lauren@freshnest.test', password: 'password123', displayName: 'Lauren Arsenault',
  })
  await getAuth().setCustomUserClaims(admin.uid, { role: 'admin' })

  const staff = [
    ['carla', 'Carla', 'Martin', 'cleaner', 'active', 1000, 640],
    ['brenda', 'Brenda', 'Côté', 'lead', 'active', null, 0],
    ['marcus', 'Marcus', 'Oakes', 'cleaner', 'active', 1600, 420],
    ['jasmine', 'Jasmine', 'Beausoleil', 'cleaner', 'onboarding', null, 0],
  ]
  for (const [id, firstName, lastName, role, status, limit, earned] of staff) {
    await db.collection('staff').doc(id).set({
      firstName, lastName, email: `${id}@freshnest.test`, phone: '6135550100', role, status,
      preferences: { language: id === 'brenda' ? 'fr' : 'en' },
      constraints: { transportMode: id === 'jasmine' ? 'transit' : 'personal_vehicle', transitBufferMinutes: 30, blockedWindows: [] },
      financials: { monthlyEarningsLimit: limit, currentMonthEarnings: earned, earningsHistory: [] },
      compliance: { acceptedTermsVersion: status === 'active' ? 'v1' : null, termsHistory: [] },
      onboardingChecklist: { backgroundCheck: status === 'active' },
      createdAt: at('2026-10-01T15:00:00Z'), welcomeEmailSentAt: at('2026-10-10T15:00:00Z'),
    })
  }

  const clients = [
    ['Diane', 'Lafleur', 'fr', 'standard', 'pending', 2, '12 Rue Pitt, Cornwall ON K6H 3P4', 'Code porte 4412. Chat timide.'],
    ['Travis', 'McLeod', 'en', 'deep', 'pending', 3, '88 Second St W, Cornwall ON K6J 1G8', ''],
    ['Margaret', 'Storey', 'en', 'standard', 'confirmed', 0, '45 Montreal Rd, Cornwall ON K6H 1B2', 'Please ring twice — hard of hearing.'],
    ['Kahnawà:ke', 'Baptiste', 'en', 'moveout', 'confirmed', 1, '7 Island Rd, Cornwall Island, Akwesasne ON', 'Cross the bridge, second house after the store.'],
    ['Sophie', 'Tremblay-Gagnon', 'fr', 'postconstruction', 'confirmed', 0, '210 Chemin Snye, Akwesasne QC', ''],
    ['Pat', 'Gallagher', 'en', 'airbnb', 'completed', -2, '3 Riverside Dr, Long Sault ON', 'Guests check in at 4pm. Lockbox 1990.'],
    ['Jean', 'Roy', 'fr', 'commercial', 'cancelled', 5, '500 Water St, Morrisburg ON', ''],
  ]
  for (const [i, [firstName, lastName, language, serviceType, status, offset, address, notes]] of clients.entries()) {
    const n = i + 1
    await db.collection('bookings').doc(`bk${n}`).set({
      firstName, lastName, email: `${firstName.toLowerCase().replace(/[^a-z]/g, '')}@example.ca`, phone: '6135550111', language,
      propertyType: serviceType === 'commercial' ? 'commercial' : '3-4bed', bedrooms: 3, bathrooms: 2, pets: n % 2 === 0,
      frequency: n % 3 === 0 ? 'biweekly' : 'one-time', address, serviceType, preferredDate: day(offset),
      leadSource: n === 2 ? 'google' : 'organic', status, assignedTo: n === 3 ? 'Carla Martin' : null,
      isAirbnb: serviceType === 'airbnb', photoConfirmation: serviceType === 'airbnb', fsmAppointmentId: null,
      createdAt: at(`2026-10-${String(10 + n).padStart(2, '0')}T14:30:00Z`), notes, addOns: n === 2 ? ['oven', 'fridge'] : [],
      referralCode: `${firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)}-BK${n}`,
      ...(status !== 'pending' ? { jobId: `job${n}` } : {}),
    })
  }

  const payRateSnapshot = { rateId: 'r1', amount: 22, currency: 'CAD', effectiveAt: '2026-08-04', snapshotAt: '2026-08-04' }
  const jobs = [
    ['job3', 'Margaret Storey', '45 Montreal Rd, Cornwall ON', 'standard', 'carla', '09:00', '11:00'],
    ['job4', 'Kahnawà:ke Baptiste', '7 Island Rd, Cornwall Island', 'moveout', null, '09:00', '13:00'],
    ['job5', 'Sophie Tremblay-Gagnon', '210 Chemin Snye, Akwesasne QC', 'postconstruction', 'brenda', '12:00', '15:00'],
    ['job8', 'Office — Seaway Plaza', '1 Seaway Plaza, Cornwall ON', 'commercial', null, '14:00', '16:00'],
  ]
  for (const [id, clientName, clientAddress, serviceType, assignedTo, start, end] of jobs) {
    await db.collection('jobs').doc(id).set({
      bookingId: id.replace('job', 'bk'), clientName, clientAddress, clientPhone: '6135550111', clientNotes: '', serviceType,
      scheduledDate: TODAY, scheduledStartTime: start, scheduledEndTime: end, status: assignedTo ? 'assigned' : 'unassigned', assignedTo,
      checkedInAt: null, checkedInGeo: null, completedAt: null, payRateSnapshot, checklistTemplate: 'tpl1',
      checklistCompletions: [], photos: [], createdAt: at('2026-10-20T14:00:00Z'),
    })
  }

  for (const [id, role, amount, from, to] of [
    ['r1', 'cleaner', 22, '2026-08-04T22:00:00Z', null], ['r2', 'lead', 26, '2026-08-04T22:00:00Z', null],
    ['r3', 'supervisor', 30, '2026-08-04T22:00:00Z', null], ['r0', 'cleaner', 20, '2026-02-19T07:00:00Z', '2026-08-04T22:00:00Z'],
  ]) {
    await db.collection('payRates').doc(id).set({
      role, amount, currency: 'CAD', effectiveFrom: at(from), effectiveTo: to ? at(to) : null,
      createdBy: 'lauren@freshnest.test', createdAt: at(from),
    })
  }

  for (const [id, name, serviceType] of [['tpl1', 'Standard Clean', 'standard'], ['tpl2', 'Airbnb Turnover', 'airbnb']]) {
    await db.collection('checklistTemplates').doc(id).set({
      name, serviceType, active: true, tasks: [
        { id: 't1', labelEn: 'Kitchen counters', labelFr: 'Comptoirs de cuisine', icon: '🧽', requiresPhoto: true, photoPhase: 'after' },
        { id: 't2', labelEn: 'Bathrooms', labelFr: 'Salles de bain', icon: '🚿', requiresPhoto: false, photoPhase: null },
        { id: 't3', labelEn: 'Floors', labelFr: 'Planchers', icon: '🧹', requiresPhoto: false, photoPhase: null },
      ],
    })
  }

  for (const [k, iso] of ['2026-10-26T12:22:00Z', '2026-10-25T23:22:00Z', '2026-10-25T16:22:00Z', '2026-10-25T09:22:00Z'].entries()) {
    await db.collection('auditLog').doc(`log${k}`).set({
      collection: 'jobs', documentId: `job${k + 3}`, field: 'assignedTo', oldValue: null, newValue: 'carla',
      changedBy: 'lauren@freshnest.test', changedAt: at(iso),
      reason: k % 2 ? 'Client asked for Carla specifically; travel buffer waived.' : 'Earnings cap exceeded by one shift — approved by owner.',
      overrideType: k % 2 ? 'travel_buffer' : 'earnings_cap',
    })
  }

  for (const [k, [name, rating, language, text]] of [
    ['Diane L.', 5, 'fr', 'Service impeccable, très ponctuel et chaleureux.'],
    ['Travis M.', 4, 'en', 'Quick response and a great deep clean. Would book again.'],
    ['Margaret S.', 5, 'en', 'Lovely team, everything sparkling.'],
  ].entries()) {
    await db.collection('reviews').doc(`rv${k}`).set({
      name, location: 'Cornwall', language, rating, text, approved: false, rejected: false, jobId: 'job3',
      createdAt: at(`2026-10-2${k + 3}T18:00:00Z`),
    })
  }

  for (const [k, serviceKey, published] of [[1, 'deep', true], [2, 'moveout', false]]) {
    await db.collection('galleryPairs').doc(`gp${k}`).set({
      serviceKey, captionEn: 'Kitchen deep clean — Cornwall, ON', captionFr: 'Grand ménage de cuisine — Cornwall (Ont.)',
      beforePath: `gallery/gp${k}/before.jpg`, afterPath: `gallery/gp${k}/after.jpg`,
      beforeUrl: '/images/deep-hero.jpg', afterUrl: '/images/standard-hero.jpg',
      published, featured: k === 1, order: k, consentConfirmed: true,
      createdAt: at('2026-10-20T14:00:00Z'), updatedAt: at('2026-10-20T14:00:00Z'), createdBy: admin.uid,
    })
  }
  console.log('[admin-visual] emulators seeded')
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
