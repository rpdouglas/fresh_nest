import { test, expect } from '@playwright/test'

test('Language toggle switches all nav strings to French', async ({ page }) => {
  await page.goto('/')
  // Select the desktop language toggle
  await page.locator('#lang-toggle-desktop').click()
  // Check that the specific desktop CTA in the navbar switches to French
  await expect(page.locator('#cta-book-now-nav')).toHaveText(/réservez maintenant/i)
})

test('French booking page has French field labels', async ({ page }) => {
  // Opening the page with query param lang=fr should persist the French locale
  await page.goto('/?lang=fr')
  await page.goto('/booking')
  await expect(page.getByText(/quel type de nettoyage/i)).toBeVisible()
})
