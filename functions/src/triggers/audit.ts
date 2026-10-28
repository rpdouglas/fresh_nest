import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { buildAuditEntry } from '../shared/audit'
import { logError } from '../lib/shared'

// P3-E37 (W0-3): one audit trigger per audited collection. Each compares the record before and
// after the write (shared/audit.ts) and writes one auditLog entry when a watched field changed.
// Apps can no longer write auditLog (firestore.rules); this is the only writer besides the role
// and policy callables.
function auditTrigger(collection: string) {
  return onDocumentWritten({ document: `${collection}/{docId}`, database: '(default)' }, async (event) => {
    const before = event.data?.before.exists ? event.data.before.data() : null
    const after = event.data?.after.exists ? event.data.after.data() : null
    const entry = buildAuditEntry({
      collection,
      documentId: event.params['docId'],
      before,
      after,
      nowMs: Date.now(),
    })
    if (!entry) return
    try {
      await getFirestore('(default)').collection('auditLog').add({ ...entry, changedAt: FieldValue.serverTimestamp() })
    } catch (err) {
      logError(`[audit:${collection}] Failed to write audit entry for ${event.params['docId']}:`, err)
      throw err
    }
  })
}

export const auditBookings = auditTrigger('bookings')
export const auditJobs = auditTrigger('jobs')
export const auditStaff = auditTrigger('staff')
export const auditChecklistTemplates = auditTrigger('checklistTemplates')
export const auditPayRates = auditTrigger('payRates')
export const auditGalleryPairs = auditTrigger('galleryPairs')
export const auditReviews = auditTrigger('reviews')
