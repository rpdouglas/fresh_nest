import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// P3-E6: WCAG 2.1 AA accessibility audit
// Primary persona: P3 Margaret Storey — keyboard-only user, 48px targets, minimum 16px text.

function futureDateStr(daysAhead = 5): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

// Shared mocks for tests that reach the booking form.
async function setupBookingMocks(page: import('@playwright/test').Page) {
  await page.route(/createPaymentIntent/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { clientSecret: 'pi_test_a11y_mock_secret' } }),
    })
  })
  await page.route('**/firestore.googleapis.com/**', async (route, request) => {
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ writeResults: [{ updateTime: new Date().toISOString() }], status: [] }),
      })
    } else {
      await route.continue()
    }
  })
  await page.addInitScript(() => {
    ;(window as unknown as Record<string, unknown>).Stripe = () => ({
      elements: () => ({
        create: () => ({ mount: () => {}, unmount: () => {}, on: () => {}, destroy: () => {} }),
        submit: () => Promise.resolve({ error: null }),
        getElement: () => null,
      }),
      confirmPayment: () =>
        Promise.resolve({ error: null, paymentIntent: { status: 'requires_capture', id: 'pi_a11y_e2e' } }),
    })
  })
}

// ─── Axe WCAG 2.1 AA audits ────────────────────────────────────────────────

test.describe('Axe WCAG 2.1 AA audit', () => {
  test('home page — no critical or serious violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .exclude('iframe')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(
      violations,
      `Axe found ${violations.length} critical/serious violation(s) on /: ${JSON.stringify(violations.map((v) => ({ id: v.id, nodes: v.nodes.length })))}`,
    ).toHaveLength(0)
  })

  test('/booking — no critical or serious violations', async ({ page }) => {
    await setupBookingMocks(page)
    await page.goto('/booking')
    const results = await new AxeBuilder({ page })
      .exclude('iframe')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(
      violations,
      `Axe found ${violations.length} critical/serious violation(s) on /booking: ${JSON.stringify(violations.map((v) => ({ id: v.id, nodes: v.nodes.length })))}`,
    ).toHaveLength(0)
  })

  test('/admin — no critical or serious violations on login view', async ({ page }) => {
    // Admin routes redirect to login when unauthenticated — audit the login page.
    await page.goto('/admin')
    const results = await new AxeBuilder({ page })
      .exclude('iframe')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(
      violations,
      `Axe found ${violations.length} critical/serious violation(s) on /admin: ${JSON.stringify(violations.map((v) => ({ id: v.id, nodes: v.nodes.length })))}`,
    ).toHaveLength(0)
  })
})

// ─── Keyboard navigation — P3 Margaret ─────────────────────────────────────

test.describe('Keyboard navigation — P3 Margaret', () => {
  test('skip link is the first tab stop and activates focus on main content', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toContainText(/skip to main content/i)
    await page.keyboard.press('Enter')
    // After activation, #main-content should receive focus.
    const main = page.locator('#main-content')
    await expect(main).toBeFocused()
  })

  test('hamburger menu toggle is keyboard operable', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 375, height: 812 })
    const hamburger = page.getByRole('button', { name: /open menu|close menu|menu/i }).first()
    await hamburger.focus()
    await page.keyboard.press('Enter')
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Enter')
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false')
  })

  test('Margaret completes booking form using keyboard only', async ({ page }) => {
    await setupBookingMocks(page)
    await page.goto('/booking')

    // Step 1 — service and property selection
    await page.getByRole('radio', { name: /standard cleaning/i }).first().focus()
    await page.keyboard.press('Space')
    await page.getByRole('radio', { name: /apartment/i }).first().focus()
    await page.keyboard.press('Space')
    // frequency radio
    await page.getByRole('radio', { name: /one.time/i }).first().focus()
    await page.keyboard.press('Space')
    // Next button
    await page.getByRole('button', { name: /next/i }).focus()
    await page.keyboard.press('Enter')

    // Step 2 heading should receive focus after step transition.
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeFocused({ timeout: 3000 })

    // Step 2 — schedule
    await page.getByRole('radio', { name: /one.time/i }).first().focus()
    await page.keyboard.press('Space')
    await page.locator('#preferredDate').focus()
    await page.keyboard.type(futureDateStr())
    await page.getByRole('button', { name: /next/i }).focus()
    await page.keyboard.press('Enter')

    // Step 3 heading should receive focus.
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeFocused({ timeout: 3000 })

    // Step 3 — contact details
    await page.locator('#firstName').focus()
    await page.keyboard.type('Margaret')
    await page.locator('#lastName').focus()
    await page.keyboard.type('Storey')
    await page.locator('#email').focus()
    await page.keyboard.type('margaret@test.ca')
    await page.locator('#phone').focus()
    await page.keyboard.type('6135550123')
    await page.locator('#address').focus()
    await page.keyboard.type('456 Oak St, Cornwall ON')
    await page.getByRole('button', { name: /next/i }).focus()
    await page.keyboard.press('Enter')

    // Step 4 heading should receive focus.
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeFocused({ timeout: 3000 })

    // Step 4 — CASL consent + submit
    const caslCheckbox = page.getByRole('checkbox', { name: /consent|agree|casl/i }).first()
    await caslCheckbox.focus()
    await page.keyboard.press('Space')
    await page.getByRole('button', { name: /confirm booking/i }).focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/thank-you/, { timeout: 8000 })
  })

  test('step progress is announced by screen reader when step changes', async ({ page }) => {
    await setupBookingMocks(page)
    await page.goto('/booking')

    // The aria-live paragraph should initially show Step 1 of 4.
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible()

    // Click Next to advance to step 2.
    await page.getByRole('radio', { name: /standard cleaning/i }).first().click()
    await page.getByRole('radio', { name: /apartment/i }).first().click()
    await page.getByRole('radio', { name: /one.time/i }).first().click()
    await page.getByRole('button', { name: /next/i }).click()

    // aria-live paragraph updates — screen reader would announce new text.
    await expect(page.getByText(/step 2 of 4/i)).toBeVisible()
  })
})
