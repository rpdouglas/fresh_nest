import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'

// F12: Firestore trigger for staff profile updates to track audit logs
export const onStaffUpdatedTrigger = onDocumentUpdated(
  {
    document: 'staff/{docId}',
    database: '(default)',
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    const staffId = event.params['docId']
    const db = getFirestore('(default)')

    const beforeCompliance = before.compliance || {}
    const afterCompliance = after.compliance || {}
    const beforeFinancials = before.financials || {}
    const afterFinancials = after.financials || {}

    type AuditLogEntry = {
      collection: string
      documentId: string
      field: string
      oldValue: unknown
      newValue: unknown
      changedBy: string
      changedAt: Date
      reason: string | null
      overrideType: string | null
    }
    const auditLogs: AuditLogEntry[] = []

    // 1. Terms Version acceptance
    if (beforeCompliance.acceptedTermsVersion !== afterCompliance.acceptedTermsVersion) {
      auditLogs.push({
        collection: 'staff',
        documentId: staffId,
        field: 'compliance.acceptedTermsVersion',
        oldValue: beforeCompliance.acceptedTermsVersion || null,
        newValue: afterCompliance.acceptedTermsVersion || null,
        changedBy: staffId, // The staff member accepted it themselves
        changedAt: new Date(),
        reason: 'Terms of Service accepted',
        overrideType: null,
      })
    }

    // 2. Status change
    if (before.status !== after.status) {
      auditLogs.push({
        collection: 'staff',
        documentId: staffId,
        field: 'status',
        oldValue: before.status || null,
        newValue: after.status || null,
        changedBy: 'admin', // Staff status is only modified by admin
        changedAt: new Date(),
        reason: 'Staff status updated',
        overrideType: null,
      })
    }

    // 3. Role change
    if (before.role !== after.role) {
      auditLogs.push({
        collection: 'staff',
        documentId: staffId,
        field: 'role',
        oldValue: before.role || null,
        newValue: after.role || null,
        changedBy: 'admin', // Role is only modified by admin
        changedAt: new Date(),
        reason: 'Staff role updated',
        overrideType: null,
      })
    }

    // 4. Monthly Earnings Limit change
    if (beforeFinancials.monthlyEarningsLimit !== afterFinancials.monthlyEarningsLimit) {
      auditLogs.push({
        collection: 'staff',
        documentId: staffId,
        field: 'financials.monthlyEarningsLimit',
        oldValue: beforeFinancials.monthlyEarningsLimit === undefined ? null : beforeFinancials.monthlyEarningsLimit,
        newValue: afterFinancials.monthlyEarningsLimit === undefined ? null : afterFinancials.monthlyEarningsLimit,
        changedBy: 'admin', // Earnings limit is only modified by admin
        changedAt: new Date(),
        reason: 'Monthly earnings limit updated',
        overrideType: null,
      })
    }

    // Write all audit logs
    if (auditLogs.length > 0) {
      const batch = db.batch()
      auditLogs.forEach((log) => {
        const docRef = db.collection('auditLog').doc()
        batch.set(docRef, log)
      })
      await batch.commit()
      console.log(`[onStaffUpdatedTrigger] Wrote ${auditLogs.length} audit log entries for staff '${staffId}'.`)
    }
  },
)
