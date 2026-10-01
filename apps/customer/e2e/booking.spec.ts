import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`)
  })

  // Intercept the Firestore booking write at the network layer.
  // Uses page.route() — the correct E2E pattern (mirrors fsm.spec.ts).
  // Replaces window.__MOCK_SUBMIT__ which was removed from firestore.ts in P3-E9.
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
})

test('Travis can complete a full booking in under 3 minutes', async ({ page }) => {
  await page.goto('/booking')

  // Step 1: Service type + property details
  // Select standard cleaning
  await page.getByRole('radio', { name: /standard cleaning/i }).first().click()
  // Select 3–4 Bedroom Home
  await page.getByRole('radio', { name: /3.4 bedroom/i }).first().click()
  // Increase bedrooms by 1 (3 -> 4)
  await page.getByRole('button', { name: /increase bedrooms/i }).click()

  // Step 2: Schedule
  // Select biweekly frequency
  await page.getByRole('radio', { name: /biweekly/i }).first().click()

  // Set preferred date to 3 days in the future in local timezone (safe from UTC shifts)
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 3)
  const yyyy = futureDate.getFullYear()
  const mm = String(futureDate.getMonth() + 1).padStart(2, '0')
  const dd = String(futureDate.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`

  await page.locator('#preferredDate').fill(dateStr)

  // Step 3: Contact details
  await page.locator('#firstName').fill('Travis')
  await page.locator('#lastName').fill('McLeod')
  await page.locator('#email').fill('travis@test.com')
  await page.locator('#phone').fill('6135550001')
  await page.locator('#address').fill('123 Main St, Long Sault ON')

  // Step 4: the Review step must appear — "Next" on step 3 must not submit (P3-E29 regression)
  await expect(page).toHaveURL(/\/booking/)
  await expect(page.getByRole('heading', { name: /review your request/i })).toBeVisible()

  // Step 4: Submit
  // Verify review table summary is present
  await expect(page.getByText('Standard Cleaning').first()).toBeVisible()
  await expect(page.getByText('Every two weeks').first()).toBeVisible()

  // P3-E29: no price or payment on the review step
  await expect(page.getByText(/\$\s?\d/)).toHaveCount(0)

  // Click submit (Send Quote Request)
  await page.getByRole('button', { name: /send quote request/i }).click()

  // Wait for redirect to /thank-you or print error if it fails
  try {
    await expect(page).toHaveURL(/\/thank-you/, { timeout: 5000 })
  } catch (err) {
    const alerts = await page.getByRole('alert').allInnerTexts()
    console.error('Submission failed! Visible alerts on page:', alerts)
    throw err
  }

  await expect(page.getByRole('heading', { name: /we've got your request/i })).toBeVisible()
})

test('Required field validation shows errors on empty submit', async ({ page }) => {
  await page.goto('/booking')

  // Click the submit button directly without filling preferredDate or contact info
  await page.getByRole('button', { name: /send quote request|next/i }).first().click()

  // Expect alerts/error messages to show up
  const alertLocator = page.getByRole('alert')
  await expect(alertLocator.first()).toBeVisible()
})
