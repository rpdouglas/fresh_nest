import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'

// P3-E10: admin-only credit ledger mutation. credits stays closed to ALL direct
// client writes (even admin) — this is the only path a credit can be manually
// created or revoked, since the field being written is real money that feeds a
// live Stripe charge calculation (createPaymentIntent/applyReferralDiscount).
export const adjustCredit = onCall(async (request) => {
  const authContext = request.auth
  if (!authContext) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.')
  }

  const db = getFirestore()

  let isAuthorized = authContext.token.role === 'admin'
  if (!isAuthorized && authContext.token.email) {
    const adminSnap = await db
      .collection('admins')
      .doc(authContext.token.email.trim().toLowerCase())
      .get()
    if (adminSnap.exists) isAuthorized = true
  }
  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Only administrators can adjust credits.')
  }

  const changedBy = authContext.token.email || authContext.uid
  const { action, creditId, customerEmail, amount, notes } = request.data as {
    action?: 'revoke' | 'create'
    creditId?: string
    customerEmail?: string
    amount?: number
    notes?: string
  }

  if (action === 'revoke') {
    if (!creditId?.trim()) throw new HttpsError('invalid-argument', 'creditId is required.')

    const creditRef = db.collection('credits').doc(creditId)
    const creditSnap = await creditRef.get()
    if (!creditSnap.exists) {
      throw new HttpsError('not-found', `Credit ${creditId} not found.`)
    }
    const previous = creditSnap.data()!
    if (previous['status'] !== 'available') {
      throw new HttpsError('failed-precondition', 'Only available credits can be revoked.')
    }

    await creditRef.update({ status: 'revoked', adjustedBy: changedBy })

    await db.collection('auditLog').add({
      collection: 'credits',
      documentId: creditId,
      field: 'status',
      oldValue: 'available',
      newValue: 'revoked',
      changedBy,
      changedAt: Timestamp.now(),
      reason: notes || null,
      overrideType: 'credit_revoked',
    })

    logger.info(`[adjustCredit] Revoked credit ${creditId} by ${changedBy}`)
    return { success: true }
  }

  if (action === 'create') {
    if (!customerEmail?.trim()) throw new HttpsError('invalid-argument', 'customerEmail is required.')
    if (!amount || amount <= 0) throw new HttpsError('invalid-argument', 'amount must be a positive number.')

    const docRef = await db.collection('credits').add({
      customerEmail: customerEmail.trim().toLowerCase(),
      amount,
      currency: 'CAD',
      reason: 'admin_adjustment',
      sourceBookingId: null,
      sourceReferralCode: null,
      status: 'available',
      issuedAt: Timestamp.now(),
      redeemedAt: null,
      redeemedOnBookingId: null,
      adjustedBy: changedBy,
    })

    await db.collection('auditLog').add({
      collection: 'credits',
      documentId: docRef.id,
      field: 'amount',
      oldValue: null,
      newValue: amount,
      changedBy,
      changedAt: Timestamp.now(),
      reason: notes || 'Manual admin credit adjustment',
      overrideType: 'credit_manual_adjustment',
    })

    logger.info(`[adjustCredit] Created $${amount} manual credit for ${customerEmail} by ${changedBy}`)
    return { success: true, creditId: docRef.id }
  }

  throw new HttpsError('invalid-argument', 'action must be "revoke" or "create".')
})
