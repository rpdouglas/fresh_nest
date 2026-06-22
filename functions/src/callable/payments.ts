import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import Stripe from 'stripe'
import { logError } from '../lib/shared'

// P3-E1: Create Stripe PaymentIntent for booking checkout
export const createPaymentIntent = onCall(async (request) => {
  const { estimatedPrice } = request.data as { estimatedPrice?: number }

  if (!estimatedPrice || estimatedPrice < 50 || estimatedPrice > 5000) {
    throw new HttpsError('invalid-argument', 'Invalid booking amount.')
  }

  const stripeKey = process.env['STRIPE_SECRET_KEY']
  if (!stripeKey) {
    throw new HttpsError('internal', 'Payment service unavailable.')
  }

  const totalWithTax = Math.round(estimatedPrice * 1.13 * 100) // in cents
  const stripeClient = new Stripe(stripeKey)
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: totalWithTax,
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
