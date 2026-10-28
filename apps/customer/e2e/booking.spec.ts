import { test, expect } from '@playwright/test'
import { findBookingsByEmail } from './harness/emulator'

// P2 Travis: a quote request from the landing form in under 3 minutes, no account (P3-E29).
// Runs against the Firestore emulator with the real security rules — the request is really saved.

function futureDateStr(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

test('Travis can complete a full booking in under 3 minutes', async ({ page, request }) => {
  const started = Date.now()
  const email = `travis.${Date.now()}@test.ca`
  await page.goto('/booking')

  // Step 1: service and property
  await page.getByRole('radio', { name: /standard cleaning/i }).click()
  await page.getByRole('radio', { name: /3.4 bedroom/i }).click()
  await page.getByRole('button', { name: /increase bedrooms/i }).click()
  await page.getByRole('button', { name: /next/i }).click()

  // Step 2: schedule
  await expect(page.getByRole('heading', { name: /when would you like us/i })).toBeVisible()
  await page.getByRole('radio', { name: /every two weeks/i }).click()
  await page.locator('#preferredDate').fill(futureDateStr(3))
  await page.getByRole('button', { name: /next/i }).click()

  // Step 3: contact details (mixed-case email: it must be stored lowercased — HOTFIX-05)
  await page.locator('#firstName').fill('Travis')
  await page.locator('#lastName').fill('McLeod')
  await page.locator('#email').fill(email.replace('travis', 'Travis'))
  await page.locator('#phone').fill('6135550001')
  await page.locator('#address').fill('123 Main St, Long Sault ON')
  await page.getByRole('button', { name: /next/i }).click()

  // Step 4: "Next" on step 3 must show the Review step, not submit (P3-E29 regression)
  await expect(page).toHaveURL(/\/booking/)
  await expect(page.getByRole('heading', { name: /review your request/i })).toBeVisible()
  await expect(page.getByText('Standard Cleaning').first()).toBeVisible()
  await expect(page.getByText(/every two weeks/i).first()).toBeVisible()
  // P3-E29: no price or payment on the review step
  await expect(page.getByText(/\$\s?\d/)).toHaveCount(0)

  await page.getByRole('button', { name: /send quote request/i }).click()
  await expect(page).toHaveURL(/\/thank-you/)
  await expect(page.getByRole('heading', { name: /we've got your request/i })).toBeVisible()
  expect(Date.now() - started).toBeLessThan(3 * 60_000)

  const [saved] = await findBookingsByEmail(request, email)
  expect(saved, 'quote request saved in Firestore').toBeDefined()
  expect(saved.status.stringValue).toBe('pending')
  expect(saved.language.stringValue).toBe('en')
  expect(saved.frequency.stringValue).toBe('biweekly')
})

test('Required field validation shows errors on empty submit', async ({ page }) => {
  await page.goto('/booking')
  await page.getByRole('button', { name: /next/i }).click()

  // Step 2 without a date: an error is announced and the form stays on step 2
  await expect(page.getByRole('heading', { name: /when would you like us/i })).toBeVisible()
  await page.getByRole('button', { name: /next/i }).click()
  await expect(page.getByRole('alert').first()).toBeVisible()
  await expect(page.locator('#preferredDate')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('heading', { name: /when would you like us/i })).toBeVisible()
})
