import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { randomUUID } from 'crypto'
import { RESEND_API_KEY, OWNER_EMAIL, logError } from '../lib/shared'
import { sendProbationActivationEmail } from '../sendEmail'

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
    const beforeChecklist = before.onboardingChecklist || {}
    const afterChecklist = after.onboardingChecklist || {}

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

    // 5. Phone number change (P3-E27-C2 — employee self-service from ProfilePage)
    if (before.phone !== after.phone) {
      auditLogs.push({
        collection: 'staff',
        documentId: staffId,
        field: 'phone',
        oldValue: before.phone || null,
        newValue: after.phone || null,
        changedBy: staffId, // Phone is self-service edited by the employee
        changedAt: new Date(),
        reason: 'Phone number updated from Profile',
        overrideType: null,
      })
    }

    // 6. Admin-only onboarding checklist items (P3-E27-D1 — no employee-facing counterpart)
    const ADMIN_CHECKLIST_ITEMS = ['idVerified', 'supervisedShiftCompleted', 'uniformIssued', 'directDepositOnFile'] as const
    for (const item of ADMIN_CHECKLIST_ITEMS) {
      if (beforeChecklist[item] !== afterChecklist[item]) {
        auditLogs.push({
          collection: 'staff',
          documentId: staffId,
          field: `onboardingChecklist.${item}`,
          oldValue: beforeChecklist[item] ?? false,
          newValue: afterChecklist[item] ?? false,
          changedBy: 'admin',
          changedAt: new Date(),
          reason: `Onboarding checklist item "${item}" updated`,
          overrideType: null,
        })
      }
    }

    // 7. Probation check-in completions and outcome changes (P3-E27-D2)
    const beforeProbation = before.probation || null
    const afterProbation = after.probation || null
    if (beforeProbation && afterProbation) {
      const beforeCheckIns: Array<{ id: string; dayOffset: number; completedDate: string | null; rating: number | null }> =
        beforeProbation.checkIns || []
      const afterCheckIns: Array<{ id: string; dayOffset: number; completedDate: string | null; rating: number | null }> =
        afterProbation.checkIns || []
      for (const afterCheckIn of afterCheckIns) {
        const beforeCheckIn = beforeCheckIns.find((c) => c.id === afterCheckIn.id)
        if (beforeCheckIn && beforeCheckIn.completedDate !== afterCheckIn.completedDate) {
          auditLogs.push({
            collection: 'staff',
            documentId: staffId,
            field: `probation.checkIns.${afterCheckIn.id}`,
            oldValue: { completedDate: beforeCheckIn.completedDate ?? null, rating: beforeCheckIn.rating ?? null },
            newValue: { completedDate: afterCheckIn.completedDate ?? null, rating: afterCheckIn.rating ?? null },
            changedBy: 'admin',
            changedAt: new Date(),
            reason: `Probation check-in (Day ${afterCheckIn.dayOffset}) completed`,
            overrideType: null,
          })
        }
      }
      if (beforeProbation.probationOutcome !== afterProbation.probationOutcome) {
        auditLogs.push({
          collection: 'staff',
          documentId: staffId,
          field: 'probation.probationOutcome',
          oldValue: beforeProbation.probationOutcome ?? null,
          newValue: afterProbation.probationOutcome ?? null,
          changedBy: 'admin',
          changedAt: new Date(),
          reason: 'Probation outcome updated',
          overrideType: null,
        })
      }
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

// P3-E27-D2: separate trigger (not folded into onStaffUpdatedTrigger — that function is an
// audit-logging concern, this is a business workflow reacting to one specific transition).
// Fires once per activation: guards on the exact before/after status edge, and on
// after.probation still being null, so an active -> inactive -> active reactivation never
// stomps an in-progress probation record.
export const onStaffStatusActivated = onDocumentUpdated(
  {
    document: 'staff/{docId}',
    database: '(default)',
    secrets: [RESEND_API_KEY, OWNER_EMAIL],
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    if (before.status === 'active' || after.status !== 'active') return
    if (after.probation != null) return

    const staffId = event.params['docId']
    const db = getFirestore('(default)')

    const start = new Date()
    const startDate = start.toISOString().slice(0, 10)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 90)
    const endDate = end.toISOString().slice(0, 10)

    const makeCheckIn = (dayOffset: 30 | 60 | 90) => {
      const due = new Date(start)
      due.setUTCDate(due.getUTCDate() + dayOffset)
      return {
        id: randomUUID(),
        dayOffset,
        scheduledDate: due.toISOString().slice(0, 10),
        completedDate: null,
        notes: null,
        rating: null,
        completedBy: null,
      }
    }

    const probation = {
      startDate,
      endDate,
      checkIns: [makeCheckIn(30), makeCheckIn(60), makeCheckIn(90)],
      probationOutcome: 'pending',
    }

    await db.collection('staff').doc(staffId).update({ probation })
    console.log(`[onStaffStatusActivated] Initialized probation for staff/${staffId}: ${startDate} -> ${endDate}`)

    try {
      const lang: 'en' | 'fr' = after['preferences']?.language === 'fr' ? 'fr' : 'en'
      const emailConfig = {
        resendApiKey: RESEND_API_KEY.value(),
        ownerEmail: OWNER_EMAIL.value(),
        fromEmail: process.env['FROM_EMAIL'] ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
      }
      await sendProbationActivationEmail(after['firstName'], after['email'], lang, emailConfig)
    } catch (err) {
      logError(`[onStaffStatusActivated] Failed to send activation email for staff/${staffId}:`, err)
    }
  },
)
