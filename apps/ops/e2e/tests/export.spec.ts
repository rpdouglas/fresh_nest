import { expect, open, test } from './helpers.ts'

// Daily teams sent to a Google Doc. Google is stood in for (tests/helpers.ts): nothing is sent to it.

test('Daily teams goes to a Google Doc with the teams and who is on call, and gives a link to it', async ({ page, world, google }) => {
  void world
  await open(page, 'teams')
  await expect(page.getByTestId('badge-lockbox').first()).toContainText('Lockbox: 4321')
  await expect(page.getByTestId('badge-dog').first()).toContainText('Dog (In crate)')
  await expect(page.getByTestId('checklist-badge').first()).toContainText('Turnover Checklist (100%)')

  await page.getByRole('button', { name: /^Export to Google/ }).click()
  const done = page.getByRole('status').filter({ hasText: 'Google Doc created.' })
  await expect(done.getByRole('link', { name: 'Open it' })).toHaveAttribute('href', 'https://docs.google.com/document/d/doc-1/edit')

  expect(google.docs).toHaveLength(1)
  const [doc] = google.docs
  expect(doc.title).toContain('Daily teams')
  expect(doc.text).toContain('Alerts: [Lockbox: 4321] [Dog (In crate)]')
  expect(doc.text).toContain('Checklist: Turnover Checklist (100%)')
  // the teams as the report shows them, and the On call band, which only this report has
  for (const said of ['Avery Stone', 'Blake Rivers', 'Maple Court', 'Emery Hart']) expect(doc.text, said).toContain(said)
  expect(doc.text).toContain('On call')
  // the band names who is on call and nothing else about them: no visit of Emery's is listed, because there is none
  expect(doc.text.split('\n').filter((l) => l.includes('Emery Hart')).length).toBeGreaterThan(0)
})

test('when Google access is refused no Doc is made and the page says so; trying again works', async ({ page, world, google }) => {
  void world
  await open(page, 'teams')
  await google.refuseAccess()
  await page.getByRole('button', { name: /^Export to Google/ }).click()
  await expect(page.getByRole('main')).toContainText('Google access was not granted, so no Doc was created.')
  expect(google.docs).toHaveLength(0)

  google.failDocsWith(500)
  await page.getByRole('button', { name: /^Export to Google/ }).click()
  await expect(page.getByRole('main')).toContainText('Google Docs refused the request (500).')

  await page.getByRole('button', { name: /^Export to Google/ }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Google Doc created.' })).toBeVisible()
  expect(google.docs).toHaveLength(1)
})
