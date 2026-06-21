import { test, expect } from '@playwright/test'

// Stripe checkout spec — Stripe SDK calls are mocked at the window level via
// window.Stripe; the createPaymentIntent Cloud Function is intercepted via
// page.route() at the network layer.
//
// The window.Stripe mock is picked up by loadStripe() in BookingPage because
// Stripe.js checks for an existing window.Stripe before loading its own script.
//
// The declined-card test validates that a Stripe error surfaces as role="alert"
// and the user is NOT redirected to /thank-you (no silent payment failures).

function futureDateStr(daysAhead = 5): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

test.beforeEach(async ({ page }) => {
  // Intercept the createPaymentIntent Cloud Functions callable at the network layer.
  await page.route(/createPaymentIntent/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { clientSecret: 'pi_test_mock_secret_xyz_seti_mock' } }),
    })
  })

  // Intercept Firestore booking write.
  await page.route('**/firestore.googleapis.com/**', async (route, request) => {
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          writeResults: [{ updateTime: new Date().toISOString() }],
          status: [],
        }),
      })
    } else {
      await route.continue()
    }
  })

  await page.addInitScript(() => {
    // Stripe.js mock — mirrors the real window.Stripe factory signature.
    // PaymentElement.mount() is a no-op; confirmPayment resolves immediately.
    ;(window as unknown as Record<string, unknown>).Stripe = (_publishableKey: string) => ({
      elements: (_options?: unknown) => ({
        create: (_type: string) => ({
          mount: (_selector: string) => {},
          unmount: () => {},
          on: (_event: string, _handler: unknown) => {},
          destroy: () => {},
        }),
        submit: () => Promise.resolve({ error: null }),
        getElement: () => null,
      }),
      confirmPayment: () =>
        Promise.resolve({
          error: null,
          paymentIntent: { status: 'requires_capture', id: 'pi_test_mock_e2e' },
        }),
    })
  })
})

test('Gallagher completes Airbnb booking with mocked Stripe payment', async ({ page }) => {
  await page.goto('/booking')

  // Step 1 — Service & property
  await page.getByRole('radio', { name: /standard cleaning/i }).first().click()
  await page.getByRole('radio', { name: /apartment/i }).first().click()
  await page.getByRole('button', { name: /next/i }).click()

  // Step 2 — Schedule
  await page.getByRole('radio', { name: /one.time/i }).first().click()
  await page.locator('#preferredDate').fill(futureDateStr())
  await page.getByRole('button', { name: /next/i }).click()

  // Step 3 — Contact
  await page.locator('#firstName').fill('Gallagher')
  await page.locator('#lastName').fill('Host')
  await page.locator('#email').fill('gallagher@airbnb.ca')
  await page.locator('#phone').fill('6135550099')
  await page.locator('#address').fill('99 River Rd, Cornwall ON')
  await page.getByRole('button', { name: /next/i }).click()

  // Step 4 — Review: price summary must be visible before customer confirms
  await expect(page.getByText('Standard Cleaning').first()).toBeVisible()

  await page.getByRole('button', { name: /confirm booking/i }).click()

  await expect(page).toHaveURL(/\/thank-you/, { timeout: 8000 })
  await expect(page.getByText(/booking is confirmed/i)).toBeVisible()
})

test('Stripe card decline keeps user on booking page without silent failure', async ({ page }) => {
  // Override confirmPayment to simulate a card decline (runs after beforeEach mock).
  await page.addInitScript(() => {
    ;(window as unknown as Record<string, unknown>).Stripe = (_publishableKey: string) => ({
      elements: () => ({
        create: () => ({
          mount: () => {},
          unmount: () => {},
          on: () => {},
          destroy: () => {},
        }),
        submit: () => Promise.resolve({ error: null }),
        getElement: () => null,
      }),
      confirmPayment: () =>
        Promise.resolve({
          error: { type: 'card_error', code: 'card_declined', message: 'Your card was declined.' },
        }),
    })
  })

  await page.goto('/booking')

  // Navigate through all steps
  await page.getByRole('radio', { name: /standard cleaning/i }).first().click()
  await page.getByRole('radio', { name: /apartment/i }).first().click()
  await page.getByRole('button', { name: /next/i }).click()

  await page.getByRole('radio', { name: /one.time/i }).first().click()
  await page.locator('#preferredDate').fill(futureDateStr(7))
  await page.getByRole('button', { name: /next/i }).click()

  await page.locator('#firstName').fill('Declined')
  await page.locator('#lastName').fill('User')
  await page.locator('#email').fill('decline@test.ca')
  await page.locator('#phone').fill('6135559999')
  await page.locator('#address').fill('1 Decline Ave, Cornwall ON')
  await page.getByRole('button', { name: /next/i }).click()

  await page.getByRole('button', { name: /confirm booking/i }).click()

  // User must stay on the booking page — no silent redirect on payment failure
  await expect(page).not.toHaveURL(/\/thank-you/)
  // Payment error must be visible
  await expect(page.getByRole('alert')).toContainText(/declined/i)
})

test('Review summary shows correct service and frequency before payment', async ({ page }) => {
  await page.goto('/booking')

  // Step 1
  await page.getByRole('radio', { name: /deep clean/i }).first().click()
  await page.getByRole('radio', { name: /3.4 bedroom/i }).first().click()
  await page.getByRole('button', { name: /next/i }).click()

  // Step 2
  await page.getByRole('radio', { name: /biweekly/i }).first().click()
  await page.locator('#preferredDate').fill(futureDateStr(3))
  await page.getByRole('button', { name: /next/i }).click()

  // Step 3
  await page.locator('#firstName').fill('Travis')
  await page.locator('#lastName').fill('McLeod')
  await page.locator('#email').fill('travis@test.com')
  await page.locator('#phone').fill('6135550001')
  await page.locator('#address').fill('123 Main St, Long Sault ON')
  await page.getByRole('button', { name: /next/i }).click()

  // Step 4 review must surface the chosen service and frequency before payment
  await expect(page.getByText(/deep clean/i).first()).toBeVisible()
  await expect(page.getByText(/every two weeks|biweekly/i).first()).toBeVisible()
})
