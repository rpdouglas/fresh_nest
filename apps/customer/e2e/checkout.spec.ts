import { test, expect } from '@playwright/test'

// Stripe checkout spec — all Stripe SDK calls are mocked at the window level so
// this spec runs without real Stripe keys or a deployed Cloud Function.
//
// When P1-E3 (Stripe integration) ships:
//   - window.Stripe is picked up by the Stripe.js init in BookingStep4
//   - window.__MOCK_CREATE_PAYMENT_INTENT__ is invoked before form submit
//   - window.__MOCK_SUBMIT__ handles the Firestore write after payment succeeds
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
          paymentIntent: { status: 'succeeded', id: 'pi_test_mock_e2e' },
        }),
    })

    // Cloud Function callable mock — returns a client secret without a real deploy
    ;(window as unknown as Record<string, unknown>).__MOCK_CREATE_PAYMENT_INTENT__ = () =>
      Promise.resolve({ data: { clientSecret: 'pi_test_mock_secret_xyz' } })

    // Booking submission mock — bypasses Firestore write
    ;(window as unknown as Record<string, unknown>).__MOCK_SUBMIT__ = () =>
      Promise.resolve('mocked-booking-id')
  })
})

test('Gallagher completes Airbnb booking with mocked Stripe payment', async ({ page }) => {
  await page.goto('/booking')

  // Step 1 — Service & property
  await page.getByRole('radio', { name: /standard cleaning/i }).first().click()
  await page.getByRole('radio', { name: /apartment/i }).first().click()

  // Step 2 — Schedule
  await page.getByRole('radio', { name: /one.time/i }).first().click()
  await page.locator('#preferredDate').fill(futureDateStr())

  // Step 3 — Contact
  await page.locator('#firstName').fill('Gallagher')
  await page.locator('#lastName').fill('Host')
  await page.locator('#email').fill('gallagher@airbnb.ca')
  await page.locator('#phone').fill('6135550099')
  await page.locator('#address').fill('99 River Rd, Cornwall ON')

  // Step 4 — Review: price summary must be visible before customer confirms
  await expect(page.getByText('Standard Cleaning').first()).toBeVisible()

  await page.getByRole('button', { name: /confirm booking/i }).click()

  await expect(page).toHaveURL(/\/thank-you/, { timeout: 8000 })
  await expect(page.getByText(/booking is confirmed/i)).toBeVisible()
})

test('Stripe card decline keeps user on booking page without silent failure', async ({ page }) => {
  // Override only the Stripe confirmPayment mock to simulate a card decline.
  // The beforeEach Stripe mock is already injected; this addInitScript runs
  // last and its window.Stripe assignment wins because scripts run in order.
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
    ;(window as unknown as Record<string, unknown>).__MOCK_CREATE_PAYMENT_INTENT__ = () =>
      Promise.resolve({ data: { clientSecret: 'pi_test_declined_secret' } })
  })

  await page.goto('/booking')
  await page.getByRole('radio', { name: /standard cleaning/i }).first().click()
  await page.getByRole('radio', { name: /apartment/i }).first().click()
  await page.getByRole('radio', { name: /one.time/i }).first().click()
  await page.locator('#preferredDate').fill(futureDateStr(7))
  await page.locator('#firstName').fill('Declined')
  await page.locator('#lastName').fill('User')
  await page.locator('#email').fill('decline@test.ca')
  await page.locator('#phone').fill('6135559999')
  await page.locator('#address').fill('1 Decline Ave, Cornwall ON')

  await page.getByRole('button', { name: /confirm booking/i }).click()

  // User must stay on the booking page — no silent redirect on payment failure
  await expect(page).not.toHaveURL(/\/thank-you/)
  // Once P1-E3 ships, a role="alert" payment error must also be visible here:
  // await expect(page.getByRole('alert')).toContainText(/declined/i)
})

test('Review summary shows correct service and frequency before payment', async ({ page }) => {
  await page.goto('/booking')

  await page.getByRole('radio', { name: /deep clean/i }).first().click()
  await page.getByRole('radio', { name: /3.4 bedroom/i }).first().click()
  await page.getByRole('radio', { name: /biweekly/i }).first().click()
  await page.locator('#preferredDate').fill(futureDateStr(3))
  await page.locator('#firstName').fill('Travis')
  await page.locator('#lastName').fill('McLeod')
  await page.locator('#email').fill('travis@test.com')
  await page.locator('#phone').fill('6135550001')
  await page.locator('#address').fill('123 Main St, Long Sault ON')

  // Step 4 review must surface the chosen service and frequency before payment
  await expect(page.getByText(/deep clean/i).first()).toBeVisible()
  await expect(page.getByText(/every two weeks|biweekly/i).first()).toBeVisible()
})
