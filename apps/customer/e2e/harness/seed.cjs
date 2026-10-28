// E2E harness (F5): seeds the Firestore + Auth emulators for the Playwright persona flows.
// Run inside `firebase emulators:exec` (see e2e/run.sh). Invented test data only — no real people.
'use strict'
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099'

initializeApp({ projectId: 'freshnest-aa51e' })
const db = getFirestore()
const now = Timestamp.now()
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })

async function main() {
  // P9 Mike — staff app user with one assigned job (job flow tests).
  const mike = await getAuth().createUser({
    uid: 'mike-uid', email: 'mike@freshnest.test', password: 'password123', displayName: 'Mike Cleaner',
  })
  await getAuth().setCustomUserClaims(mike.uid, { role: 'staff' })
  await db.collection('staff').doc(mike.uid).set({
    firstName: 'Mike', lastName: 'Cleaner', email: 'mike@freshnest.test', phone: '6135550100',
    role: 'cleaner', status: 'active',
    preferences: { language: 'en' },
    constraints: { transportMode: 'personal_vehicle', transitBufferMinutes: 15, blockedWindows: [] },
    financials: { monthlyEarningsLimitCents: null, currentMonthEarningsCents: 0, earningsHistory: [] },
    // Current terms (TermsConsentOverlay, VITE_CURRENT_TERMS_VERSION default) — no consent overlay.
    compliance: { acceptedTermsVersion: '2.1', termsHistory: [] },
    onboardingChecklist: { backgroundCheck: true },
    createdAt: now,
  })

  // Two copies of Mike's job: test-job-id stays "assigned" for the read-only checks; photo-job-id
  // is checked in and gets a photo (tests run in parallel, so they must not share a job).
  for (const id of ['test-job-id', 'photo-job-id']) {
    await db.collection('jobs').doc(id).set({
      bookingId: 'booking-123', clientName: 'Jane Smith', clientAddress: '456 Riverdale, Cornwall ON',
      clientPhone: '6135559900', clientNotes: '', serviceType: 'standard',
      scheduledDate: today, scheduledStartTime: '09:00', scheduledEndTime: '11:00',
      status: 'assigned', assignedTo: mike.uid,
      checkedInAt: null, checkedInGeo: null, completedAt: null,
      payRateSnapshot: { rateId: 'r1', amountCents: 2200, currency: 'CAD', effectiveAt: '2026-08-04', snapshotAt: '2026-08-04' },
      checklistTemplate: '', checklistName: 'Custom checklist', checklistSource: 'custom',
      // P11 Brenda's photo proof: one task requires an "after" photo.
      checklistTasks: [
        { id: 't1', labelEn: 'Kitchen counters', labelFr: 'Comptoirs de cuisine', icon: '🧽', requiresPhoto: true, photoPhase: 'after', order: 0 },
        { id: 't2', labelEn: 'Bathrooms', labelFr: 'Salles de bain', icon: '🚿', requiresPhoto: false, photoPhase: null, order: 1 },
      ],
      checklistCompletions: [], photos: [], createdAt: now,
    })
  }

  // A signed-in customer account must not get into the staff app.
  const customer = await getAuth().createUser({
    uid: 'diane-uid', email: 'diane@example.test', password: 'password123', displayName: 'Diane Lafleur',
  })
  await getAuth().setCustomUserClaims(customer.uid, { role: 'customer' })
}

main().then(() => console.log('E2E seed complete'), (err) => { console.error(err); process.exit(1) })
