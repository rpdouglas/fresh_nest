import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// N-4: Stripe callables stay deployed but must not be usable anonymously.

const create = vi.fn(async () => ({ client_secret: 'secret_123' }))
const constructEvent = vi.fn(() => ({ type: 'other', data: { object: { id: 'pi_1' } } }))
vi.mock('stripe', () => ({
  default: class {
    paymentIntents = { create }
    webhooks = { constructEvent }
  },
}))
vi.mock('firebase-admin/firestore', () => ({ getFirestore: vi.fn(() => ({})) }))

const { createPaymentIntent, stripeWebhookHandler } = await import('../src/callable/payments')

type RunRequest = Parameters<typeof createPaymentIntent.run>[0]
const call = (auth: unknown, data: unknown = { estimatedPrice: 225 }) =>
  createPaymentIntent.run({ data, auth } as unknown as RunRequest)

function fakeRes() {
  const res = { statusCode: 200, body: '' as unknown, status(code: number) { res.statusCode = code; return res }, send(b: unknown) { res.body = b; return res }, json(b: unknown) { res.body = b; return res } }
  return res
}
const webhook = (headers: Record<string, string>) => {
  const res = fakeRes()
  const req = { headers, body: { type: 'payment_intent.succeeded', data: { object: { id: 'pi_1' } } }, rawBody: Buffer.from('{}') }
  return Promise.resolve(stripeWebhookHandler(req as never, res as never)).then(() => res)
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env['STRIPE_SECRET_KEY'] = 'sk_test'
  process.env['STRIPE_WEBHOOK_SECRET'] = 'whsec_test'
})
afterEach(() => {
  delete process.env['STRIPE_SECRET_KEY']
  delete process.env['STRIPE_WEBHOOK_SECRET']
})

describe('createPaymentIntent', () => {
  it('rejects signed-out callers before reaching Stripe', async () => {
    await expect(call(undefined)).rejects.toMatchObject({ code: 'unauthenticated' })
    expect(create).not.toHaveBeenCalled()
  })

  it('works for a signed-in caller', async () => {
    await expect(call({ uid: 'u1', token: {} })).resolves.toEqual({ clientSecret: 'secret_123' })
    expect(create).toHaveBeenCalledTimes(1)
  })
})

describe('stripeWebhookHandler', () => {
  it('refuses unsigned requests', async () => {
    const res = await webhook({})
    expect(res.statusCode).toBe(400)
    expect(constructEvent).not.toHaveBeenCalled()
  })

  it('refuses requests when no webhook secret is configured', async () => {
    delete process.env['STRIPE_WEBHOOK_SECRET']
    const res = await webhook({ 'stripe-signature': 't=1,v1=abc' })
    expect(res.statusCode).toBe(400)
    expect(constructEvent).not.toHaveBeenCalled()
  })

  it('verifies the signature when present', async () => {
    const res = await webhook({ 'stripe-signature': 't=1,v1=abc' })
    expect(constructEvent).toHaveBeenCalledTimes(1)
    expect(res.statusCode).not.toBe(400)
  })
})
