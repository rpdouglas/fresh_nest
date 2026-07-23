import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import Stripe from 'stripe'
import { logError } from '../lib/shared'

// P3-E10: shared discount math for both createPaymentIntent (initial creation) and
// applyReferralDiscount (updating an already-created intent once a code is verified
// later in the same booking flow). Consumes credits as whole units (no partial/change
// -making) — matches how equal-increment ($20) credits commonly work; any overage
// beyond the booking total is simply extra value to the customer, not a bug.
async function computeDiscountedAmount(
  db: Firestore,
  totalCents: number,
  email: string | undefined | null,
  referredBy: string | undefined | null,
): Promise<{ finalAmount: number; appliedCreditIds: string[]; referralDiscountApplied: boolean }> {
  let remaining = totalCents
  let referralDiscountApplied = false

  if (referredBy) {
    const referralSnap = await db.collection('referrals').doc(referredBy).get()
    const referralData = referralSnap.data()
    if (referralSnap.exists && referralData?.['active'] === true) {
      const configSnap = await db.collection('config').doc('referralConfig').get()
      const configData = configSnap.data()
      const configEnabled = configData?.['enabled'] !== false
      const discountAmount = configEnabled ? (configData?.['refereeDiscountAmount'] ?? 20) : 0
      if (discountAmount > 0) {
        remaining = Math.max(0, remaining - Math.round(discountAmount * 100))
        referralDiscountApplied = true
      }
    }
  }

  const appliedCreditIds: string[] = []
  if (email && remaining > 0) {
    const creditsSnap = await db.collection('credits')
      .where('customerEmail', '==', email.toLowerCase().trim())
      .where('status', '==', 'available')
      .get()
    // FIFO — oldest credit consumed first
    const sorted = creditsSnap.docs.sort((a, b) => {
      const aTime = a.data()['issuedAt']?.toMillis?.() ?? 0
      const bTime = b.data()['issuedAt']?.toMillis?.() ?? 0
      return aTime - bTime
    })
    for (const creditDoc of sorted) {
      if (remaining <= 0) break
      const creditCents = Math.round((creditDoc.data()['amount'] as number) * 100)
      remaining = Math.max(0, remaining - creditCents)
      appliedCreditIds.push(creditDoc.id)
    }
  }

  // Stripe's practical minimum charge — defensive floor, should rarely bind given
  // the existing $50-$5000 estimatedPrice validation.
  const finalAmount = Math.max(50, remaining)

  return { finalAmount, appliedCreditIds, referralDiscountApplied }
}

// P3-E1: Create Stripe PaymentIntent for booking checkout
// P3-E10: extended to apply a referee discount (if a referral code is already known)
// and the paying customer's own available credits.
export const createPaymentIntent = onCall(async (request) => {
  const { estimatedPrice, email, referredBy } = request.data as {
    estimatedPrice?: number
    email?: string
    referredBy?: string | null
  }

  if (!estimatedPrice || estimatedPrice < 50 || estimatedPrice > 5000) {
    throw new HttpsError('invalid-argument', 'Invalid booking amount.')
  }

  const stripeKey = process.env['STRIPE_SECRET_KEY']
  if (!stripeKey) {
    throw new HttpsError('internal', 'Payment service unavailable.')
  }

  const totalWithTax = Math.round(estimatedPrice * 1.13 * 100) // in cents

  const db = getFirestore()
  const { finalAmount, appliedCreditIds, referralDiscountApplied } =
    await computeDiscountedAmount(db, totalWithTax, email, referredBy)

  const stripeClient = new Stripe(stripeKey)
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: finalAmount,
    currency: 'cad',
    capture_method: 'manual',
    automatic_payment_methods: { enabled: true },
    metadata: {
      source: 'fresh-nest-booking',
      appliedCreditIds: appliedCreditIds.join(','),
      referralDiscountApplied: referralDiscountApplied ? 'true' : 'false',
    },
  })

  return { clientSecret: paymentIntent.client_secret }
})

// P3-E10: BookingStep4's promo-code verification happens after createPaymentIntent
// already fired (the intent is created eagerly on Step 4 entry, before the customer
// has had a chance to type a code) — this updates the already-created intent's amount
// once a code is verified, rather than creating a second intent.
export const applyReferralDiscount = onCall(async (request) => {
  const { paymentIntentId, referralCode, estimatedPrice, email } = request.data as {
    paymentIntentId?: string
    referralCode?: string
    estimatedPrice?: number
    email?: string
  }

  if (!paymentIntentId?.trim()) throw new HttpsError('invalid-argument', 'paymentIntentId is required.')
  if (!referralCode?.trim()) throw new HttpsError('invalid-argument', 'referralCode is required.')
  if (!estimatedPrice || estimatedPrice < 50 || estimatedPrice > 5000) {
    throw new HttpsError('invalid-argument', 'Invalid booking amount.')
  }

  const stripeKey = process.env['STRIPE_SECRET_KEY']
  if (!stripeKey) {
    throw new HttpsError('internal', 'Payment service unavailable.')
  }

  const totalWithTax = Math.round(estimatedPrice * 1.13 * 100)
  const db = getFirestore()
  const { finalAmount, appliedCreditIds, referralDiscountApplied } =
    await computeDiscountedAmount(db, totalWithTax, email, referralCode.trim().toUpperCase())

  if (!referralDiscountApplied) {
    throw new HttpsError('invalid-argument', 'Referral code is not valid or active.')
  }

  const stripeClient = new Stripe(stripeKey)
  try {
    await stripeClient.paymentIntents.update(paymentIntentId, {
      amount: finalAmount,
      metadata: {
        source: 'fresh-nest-booking',
        appliedCreditIds: appliedCreditIds.join(','),
        referralDiscountApplied: 'true',
      },
    })
  } catch (err: any) {
    logError('[applyReferralDiscount] Failed to update PaymentIntent amount:', err)
    throw new HttpsError('internal', `Failed to update payment amount: ${err.message || err}`)
  }

  return { success: true, newAmount: finalAmount }
})

// P3-E1: Stripe webhook handler
export const stripeWebhookHandler = onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string | undefined
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']
  const stripeKey = process.env['STRIPE_SECRET_KEY']

  if (!stripeKey) {
    res.status(500).send('Stripe not configured')
    return
  }

  const stripeClient = new Stripe(stripeKey)

  type StripeEventLike = {
    type: string
    data: { object: { id: string; latest_charge?: string | null } }
  }
  let event: StripeEventLike

  if (webhookSecret && sig) {
    try {
      const rawBody = (req as unknown as { rawBody: Buffer }).rawBody
      event = stripeClient.webhooks.constructEvent(rawBody, sig, webhookSecret) as StripeEventLike
    } catch (err) {
      console.error('[stripeWebhookHandler] Signature verification failed:', err)
      res.status(400).send('Webhook signature verification failed')
      return
    }
  } else {
    event = req.body as StripeEventLike
  }

  const db = getFirestore()

  try {
    switch (event.type) {
      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object
        const snap = await db.collection('bookings')
          .where('stripePaymentIntentId', '==', pi.id).limit(1).get()
        if (!snap.empty) {
          await snap.docs[0].ref.update({ stripeChargeStatus: 'hold' })
        }
        break
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        const snap = await db.collection('bookings')
          .where('stripePaymentIntentId', '==', pi.id).limit(1).get()
        if (!snap.empty) {
          await snap.docs[0].ref.update({
            stripeChargeStatus: 'captured',
            stripeChargeId: pi.latest_charge ?? null,
          })
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        const snap = await db.collection('bookings')
          .where('stripePaymentIntentId', '==', pi.id).limit(1).get()
        if (!snap.empty) {
          await snap.docs[0].ref.update({ stripeChargeStatus: 'failed' })
        }
        break
      }
    }
  } catch (err) {
    logError('[stripeWebhookHandler] Event processing failed:', err)
    res.status(500).send('Event processing failed')
    return
  }

  res.json({ received: true })
})
