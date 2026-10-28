// E2E harness (F5): reads the Firestore emulator directly so specs can check what the app saved.
// `Bearer owner` is the emulator's rules bypass — test-only, it has no meaning in production.
import type { APIRequestContext } from '@playwright/test'

const FIRESTORE = 'http://127.0.0.1:8080/v1/projects/freshnest-aa51e/databases/(default)/documents'

type FirestoreValue = {
  stringValue?: string
  booleanValue?: boolean
  integerValue?: string
  nullValue?: null
  timestampValue?: string
  mapValue?: { fields?: Record<string, FirestoreValue> }
  arrayValue?: { values?: FirestoreValue[] }
}

/** Bookings whose `email` equals the given address, as plain field maps. */
export async function findBookingsByEmail(request: APIRequestContext, email: string) {
  const res = await request.post(`${FIRESTORE}:runQuery`, {
    headers: { Authorization: 'Bearer owner' },
    data: {
      structuredQuery: {
        from: [{ collectionId: 'bookings' }],
        where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email } } },
      },
    },
  })
  const rows = (await res.json()) as Array<{ document?: { fields: Record<string, FirestoreValue> } }>
  return rows.flatMap((r) => (r.document ? [r.document.fields] : []))
}

/** One job's fields, read past the rules. */
export async function getJob(request: APIRequestContext, jobId: string) {
  const res = await request.get(`${FIRESTORE}/jobs/${jobId}`, { headers: { Authorization: 'Bearer owner' } })
  return ((await res.json()) as { fields: Record<string, FirestoreValue> }).fields
}

/** Puts a seeded job back to "assigned" with no check-in or photos, so a test can re-run. */
export async function resetJobToAssigned(request: APIRequestContext, jobId: string) {
  const fields = ['status', 'checkedInAt', 'checkedInGeo', 'checklistCompletions', 'photos']
  const mask = fields.map((f) => `updateMask.fieldPaths=${f}`).join('&')
  await request.patch(`${FIRESTORE}/jobs/${jobId}?${mask}`, {
    headers: { Authorization: 'Bearer owner' },
    data: {
      fields: {
        status: { stringValue: 'assigned' },
        checkedInAt: { nullValue: null },
        checkedInGeo: { nullValue: null },
        checklistCompletions: { arrayValue: {} },
        photos: { arrayValue: {} },
      },
    },
  })
}
