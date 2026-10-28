import { test, expect, type Locator, type Page } from '@playwright/test'
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

// ─── Axe WCAG 2.1 AA audits ────────────────────────────────────────────────

// Audit only a finished page: the lazily loaded part is on screen and no fade-in is still running
// (a half-faded element reads as low contrast, so an early audit fails at random).
async function waitUntilSettled(page: Page, ready: Locator) {
  await expect(ready).toBeVisible()
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
}

test.describe('Axe WCAG 2.1 AA audit', () => {
  test('home page — no critical or serious violations', async ({ page }) => {
    await page.goto('/')
    await waitUntilSettled(page, page.getByRole('contentinfo'))
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
    await page.goto('/booking')
    await waitUntilSettled(page, page.getByRole('contentinfo'))
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
    await waitUntilSettled(page, page.getByRole('heading', { level: 1 }))
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
    // Wait for the app to render: a Tab pressed during the loading spinner lands on <body>.
    await expect(page.getByRole('navigation').first()).toBeVisible()
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
    await page.goto('/booking')

    // Step 1 — service and property selection
    await page.getByRole('radio', { name: /standard cleaning/i }).focus()
    await page.keyboard.press('Space')
    await page.getByRole('radio', { name: /apartment/i }).focus()
    await page.keyboard.press('Space')
    await page.getByRole('button', { name: /next/i }).focus()
    await page.keyboard.press('Enter')

    // Step 2 heading should receive focus after step transition.
    await expect(page.getByRole('heading', { level: 2, name: /when would you like us/i })).toBeFocused()

    // Step 2 — schedule. The native date field's typed segment order depends on the browser
    // locale, so the value is set on the focused field rather than typed digit by digit.
    await page.getByRole('radio', { name: /one.time/i }).focus()
    await page.keyboard.press('Space')
    await page.locator('#preferredDate').focus()
    await page.locator('#preferredDate').fill(futureDateStr())
    await page.getByRole('button', { name: /next/i }).focus()
    await page.keyboard.press('Enter')

    // Step 3 heading should receive focus.
    await expect(page.getByRole('heading', { level: 2, name: /your contact details/i })).toBeFocused()

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
    await expect(page.getByRole('heading', { level: 2, name: /review your request/i })).toBeFocused()

    // Step 4 — optional CASL marketing consent + submit
    await page.getByRole('checkbox', { name: /i agree to receive/i }).focus()
    await page.keyboard.press('Space')
    await page.getByRole('button', { name: /send quote request/i }).focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/thank-you/)
  })

  test('step progress is announced by screen reader when step changes', async ({ page }) => {
    await page.goto('/booking')

    // The aria-live paragraph should initially show Step 1 of 4.
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible()

    // Click Next to advance to step 2.
    await page.getByRole('radio', { name: /standard cleaning/i }).click()
    await page.getByRole('radio', { name: /apartment/i }).click()
    await page.getByRole('button', { name: /next/i }).click()

    // aria-live paragraph updates — screen reader would announce new text.
    await expect(page.getByText(/step 2 of 4/i)).toBeVisible()
  })
})
