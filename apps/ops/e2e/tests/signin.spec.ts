import { expect, signIns, test } from './helpers.ts'

// this one does not ask for `world`, which signs in: it starts from the sign-in page
test('someone who is not on the list is told so, and sees nothing', async ({ page }) => {
  await fetch('http://localhost:8787/__test/reset', { method: 'POST' })
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Dev sign-in email' }).fill('stranger@example.com')
  await page.getByRole('button', { name: 'Dev sign-in' }).click()
  await expect(page.getByRole('main')).toContainText('stranger@example.com is not on the list of people who can use this site.')
  await expect(page.getByRole('heading', { name: 'Needs attention' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Dev sign-in' })).toBeVisible()
})

test('a sign-in that has run out asks again, and signing in comes back to the same report', async ({ page, world }) => {
  const day = world.waitingDays.at(-1)!
  await page.goto(`/?view=payroll&period=${day}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Payroll hours' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show all clock-ins for Avery Stone' })).toBeVisible()

  // the server now refuses the sign-in, as it does once Google's hour is up
  await signIns(false)
  await page.getByRole('button', { name: 'Next period' }).click()
  await expect(page.getByRole('main')).toContainText('Your Google sign-in has expired. Sign in again to continue.')
  await expect(page.getByRole('button', { name: 'Show all clock-ins for Avery Stone' })).toHaveCount(0)

  await signIns(true)
  await page.getByRole('button', { name: 'Dev sign-in' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Payroll hours' })).toBeVisible()
  // the same report, on the period it had moved to
  await expect(page).toHaveURL(/view=payroll/)
  await expect(page).toHaveURL(/period=\d{4}-\d{2}-\d{2}/)
  await expect(page.getByRole('main')).not.toContainText('expired')
})

test('a cleaner can sign in with a 6-digit emailed Camelo code, lands on My week with Camelo already connected, and stays signed in across reloads', async ({
  page,
}) => {
  await fetch('http://localhost:8787/__test/reset', { method: 'POST' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Email me a sign-in code' }).click()

  // An office email is refused before sending a code (office stays on Google sign-in)
  await page.getByRole('textbox', { name: 'Work email' }).fill('dev@example.com')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByRole('alert')).toContainText('not on the list')

  // An active cleaner requests a code and signs in with it
  await page.getByRole('textbox', { name: 'Work email' }).fill('avery@example.com')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText('Enter the 6-digit code Camelo emailed to avery@example.com.')).toBeVisible()

  await page.getByRole('textbox', { name: 'One-time code' }).fill('123456')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  // Lands straight on My week, with Camelo already connected for clocking in (no second code prompt)
  await expect(page.getByRole('heading', { level: 1, name: 'My week' })).toBeVisible()
  await expect(page.getByRole('banner')).toContainText('Avery Stone')
  await expect(page.getByRole('region', { name: 'Connect Camelo' })).toHaveCount(0)

  // The 30-day cleaner token is kept in localStorage and survives a page reload
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'My week' })).toBeVisible()
  await expect(page.getByRole('banner')).toContainText('Avery Stone')

  // Signing out clears localStorage and returns to the sign-in gate
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Email me a sign-in code' })).toBeVisible()
})

test('P16 Ryan (Manager) gets full office access and loses it immediately if revoked from admins', async ({ page }) => {
  await fetch('http://localhost:8787/__test/reset', { method: 'POST' })
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Dev sign-in email' }).fill('ryan@example.com')
  await page.getByRole('button', { name: 'Dev sign-in' }).click()
  await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible()

  // Open a report that fetches on period change and wait for initial load to settle
  await page.goto('/?view=payroll')
  await expect(page.getByRole('heading', { level: 1, name: 'Payroll hours' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveCount(0, { timeout: 30_000 })

  // Revoke Ryan from admins/{email} -> immediate 403 on next API call returns him to the sign-in gate
  await fetch('http://localhost:8787/__test/admins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ryan@example.com', role: null }),
  })
  await page.getByRole('button', { name: 'Next period' }).click()
  await expect(page.getByRole('main')).toContainText('ryan@example.com is not on the list of people who can use this site.')
  await expect(page.getByRole('heading', { level: 1, name: 'Payroll hours' })).toHaveCount(0)
})
