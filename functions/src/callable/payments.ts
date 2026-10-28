import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import Stripe from 'stripe'
import { logError } from '../lib/shared'
import { HST_BASIS_POINTS, percentOfCents } from '../shared/money'

// P3-E1: Create Stripe PaymentIntent for booking checkout.
// N-4 (owner decision 2026-10-27: keep, require sign-in): callers must be signed in, so the
// endpoint can't be used anonymously to create payment intents.
export const createPaymentIntent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to start a payment.')
  }

  // P3-E38: amount in integer cents ($50–$5,000 before tax); HST added in cents, rounded once
  const { estimatedPriceCents } = request.data as { estimatedPriceCents?: number }

  if (!Number.isInteger(estimatedPriceCents) || estimatedPriceCents! < 5000 || estimatedPriceCents! > 500000) {
    throw new HttpsError('invalid-argument', 'Invalid booking amount.')
  }
  const subtotalCents = estimatedPriceCents!

  const stripeKey = process.env['STRIPE_SECRET_KEY']
  if (!stripeKey) {
    throw new HttpsError('internal', 'Payment service unavailable.')
  }

  const taxCents = percentOfCents(subtotalCents, HST_BASIS_POINTS)
  const stripeClient = new Stripe(stripeKey)
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: subtotalCents + taxCents,
    currency: 'cad',
    capture_method: 'manual',
    automatic_payment_methods: { enabled: true },
    metadata: { source: 'fresh-nest-booking' },
  })

  return { clientSecret: paymentIntent.client_secret }
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

  // N-4: only accept events Stripe signed. An unsigned body (no secret configured, or no
  // signature header) could otherwise be posted by anyone to change booking payment fields.
  if (!webhookSecret || !sig) {
    res.status(400).send('Webhook signature required')
    return
  }

  const stripeClient = new Stripe(stripeKey)

  type StripeEventLike = {
    type: string
    data: { object: { id: string; latest_charge?: string | null } }
  }
  let event: StripeEventLike

  try {
    const rawBody = (req as unknown as { rawBody: Buffer }).rawBody
    event = stripeClient.webhooks.constructEvent(rawBody, sig, webhookSecret) as StripeEventLike
  } catch (err) {
    console.error('[stripeWebhookHandler] Signature verification failed:', err)
    res.status(400).send('Webhook signature verification failed')
    return
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
