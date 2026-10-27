import { test, expect, type Page } from '@playwright/test'

// P3-E33 admin visual harness. Data comes from seed.cjs (fixed dates, 2026-10-26).
// Fixed clock at or before real time, so emulator-issued auth tokens are never seen as expired.
const FIXED_NOW = new Date('2026-10-26T14:00:00Z')

const TABS = [
  { key: 'bookings', label: 'Bookings Management', ready: 'Margaret Storey' },
  { key: 'dispatch', label: 'Dispatch Board', ready: 'Office — Seaway Plaza' },
  { key: 'analytics', label: 'Analytics & Metrics', ready: 'Marketing & Sales' },
  { key: 'staff', label: 'Staff Registry', ready: 'jasmine@freshnest.test' },
  { key: 'templates', label: 'Checklist Templates', ready: 'Airbnb Turnover' },
  { key: 'payRates', label: 'Pay Rates', ready: 'Supervisor' },
  { key: 'auditLogs', label: 'Audit Logs', ready: 'travel buffer waived' },
  { key: 'reviews', label: 'Reviews Moderation', ready: 'Lovely team, everything sparkling.' },
  { key: 'gallery', label: 'Gallery', ready: 'Grand ménage de cuisine — Cornwall (Ont.)' },
  // P3-E35: Owner-only; Lauren is the Owner.
  { key: 'team', label: 'Team & roles', ready: 'office@freshnest.test' },
] as const

// Recharts animates on a timer that never finishes under the fixed clock; charts are masked so
// the guard compares layout, not chart animation frames.
const charts = (page: Page) => page.locator('.recharts-wrapper')

// Full-page shots draw the fixed navbar at the current scroll position, and clicking a tab scrolls
// the tab strip, so both are reset before every screenshot.
async function resetScroll(page: Page) {
  await page.mouse.move(0, 0)
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    for (const el of document.querySelectorAll<HTMLElement>('*')) if (el.scrollLeft) el.scrollLeft = 0
  })
}

async function openAdmin(page: Page, { acceptCookies = true, query = '' } = {}) {
  // Web fonts are blocked so screenshots don't depend on the network; layout still uses the fallbacks.
  const fontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com'])
  await page.route((url) => fontHosts.has(url.hostname), (route) => route.abort())
  await page.clock.setFixedTime(FIXED_NOW)
  if (acceptCookies) {
    await page.addInitScript(() => window.localStorage.setItem('freshnest_consent', 'denied'))
  }
  await page.goto(`/admin?lang=en${query}`)
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 30_000 })
}

test.describe('desktop views are unchanged (1280px)', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, 'desktop project only')

  for (const tab of TABS) {
    test(`${tab.key} tab`, async ({ page }) => {
      await openAdmin(page)
      await page.getByRole('button', { name: tab.label, exact: true }).click()
      await expect(page.getByText(tab.ready, { exact: false }).first()).toBeVisible({ timeout: 20_000 })
      await resetScroll(page)
      await expect(page).toHaveScreenshot(`${tab.key}.png`, { fullPage: true, mask: [charts(page)] })
    })
  }

  test('bookings tab with a row expanded', async ({ page }) => {
    await openAdmin(page)
    await page.getByText('Margaret Storey').first().click()
    await expect(page.getByText('Please ring twice — hard of hearing.')).toBeVisible()
    // P3-E34: the checklist summary loads after the panel opens.
    await expect(page.getByText('Standard Clean · 3 task(s)')).toBeVisible({ timeout: 20_000 })
    await resetScroll(page)
    await expect(page).toHaveScreenshot('bookings-expanded.png', { fullPage: true })
  })

  test('analytics operations sub-tab', async ({ page }) => {
    await openAdmin(page)
    await page.getByRole('button', { name: 'Analytics & Metrics', exact: true }).click()
    await page.getByRole('button', { name: 'Operations & Fulfillment' }).click()
    await expect(page.getByText('Carla Martin').first()).toBeVisible({ timeout: 20_000 })
    await resetScroll(page)
    await expect(page).toHaveScreenshot('analytics-operations.png', { fullPage: true, mask: [charts(page)] })
  })
})

test.describe('phone acceptance (P3-E33)', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, 'phone project only')

  test('no public footer or cookie banner on /admin; the public site keeps them', async ({ page }) => {
    await openAdmin(page, { acceptCookies: false })
    await expect(page.locator('footer')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Accept' })).toBeHidden()
    await page.goto('/?lang=en')
    await expect(page.locator('footer')).toBeVisible()
  })

  test('any section is reachable from the section switcher, and survives a reload', async ({ page }) => {
    await openAdmin(page)
    const section = page.getByLabel('Section')
    await expect(section).toBeVisible()
    await section.selectOption('staff')
    await expect(page.getByText('jasmine@freshnest.test').first()).toBeVisible({ timeout: 20_000 })
    await expect(page).toHaveURL(/[?&]tab=staff/)
    await page.reload()
    await expect(page.getByText('jasmine@freshnest.test').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByLabel('Section')).toHaveValue('staff')
  })

  test('no horizontal page scroll on any tab at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 })
    for (const tab of TABS) {
      await openAdmin(page, { query: `&tab=${tab.key}` })
      await expect(page.getByText(tab.ready, { exact: false }).first()).toBeVisible({ timeout: 20_000 })
      const width = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(width, `${tab.key} page width`).toBeLessThanOrEqual(360)
    }
  })

  test('dialogs close on Escape and give focus back to the opener', async ({ page }) => {
    await openAdmin(page)
    const opener = page.getByRole('button', { name: 'New Booking' })
    await opener.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('cancelling a booking asks first; "Keep booking" changes nothing', async ({ page }) => {
    await openAdmin(page)
    await page.getByText('Diane Lafleur').first().click()
    const status = page.getByLabel('Update Status')
    await expect(status).toHaveValue('pending')
    await status.selectOption('cancelled')
    const confirm = page.getByRole('dialog')
    await expect(confirm).toContainText('Diane Lafleur')
    await confirm.getByRole('button', { name: 'Keep booking' }).click()
    await expect(confirm).toBeHidden()
    await expect(status).toHaveValue('pending')
  })

  // P3-E34 (P12 Lauren): attach a saved list to a job from the booking panel on a phone.
  // Uses Kahnawà:ke's job so the desktop screenshots (Margaret's row) are not affected.
  test('a saved checklist can be attached to a job from the booking panel', async ({ page }) => {
    await openAdmin(page)
    await page.getByText('Kahnawà:ke Baptiste').first().click()
    const panelButton = page.getByRole('button', { name: 'Change checklist' })
    await expect(panelButton).toBeEnabled({ timeout: 20_000 })
    await panelButton.click()
    const dialog = page.getByRole('dialog', { name: 'Checklist' })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Saved list').selectOption({ label: 'Airbnb Turnover (3 task(s))' })
    await expect(dialog.getByText('Kitchen counters')).toBeVisible()
    // The sticky Save is reachable without scrolling the sheet.
    await expect(dialog.getByRole('button', { name: 'Save checklist' })).toBeInViewport()
    await dialog.getByRole('button', { name: 'Save checklist' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('Airbnb Turnover · 3 task(s)')).toBeVisible({ timeout: 20_000 })
    await page.reload()
    await page.getByText('Kahnawà:ke Baptiste').first().click()
    await expect(page.getByText('Airbnb Turnover · 3 task(s)')).toBeVisible({ timeout: 20_000 })
  })
})
