import { type Page, expect, open, test } from './helpers.ts'

// Client feedback is kept by the site, not Camelo. Every name here is made up.

/** Records a kudos or a complaint that is not tied to one visit. */
async function record(page: Page, kind: 'kudos' | 'complaint', client: string, cleaner: string, said: string) {
  await page.getByRole('button', { name: kind === 'kudos' ? '+ Kudos' : '+ Complaint' }).click()
  const form = page.getByRole('form', { name: new RegExp(`^New ${kind}`) })
  await form.getByRole('combobox', { name: 'Client' }).fill(client)
  await form.getByRole('checkbox', { name: cleaner }).check()
  await form.getByRole('textbox', { name: 'What the client said' }).fill(said)
  await form.getByRole('button', { name: `Save ${kind}` }).click()
  await expect(form).toHaveCount(0)
}
const entries = (page: Page) => page.getByRole('region', { name: 'Feedback entries' }).getByRole('listitem')

test('a complaint is recorded as open, counts against the cleaner, and can be resolved and reopened', async ({ page, world }) => {
  void world
  await open(page, 'feedback')
  await record(page, 'complaint', 'Maple Court', 'Avery Stone', 'Streaks on the windows')
  const entry = entries(page).filter({ hasText: 'Streaks on the windows' })
  await expect(entry).toContainText('Complaint')
  await expect(entry).toContainText(/Maple Court\s*Avery Stone\s*Open/)
  await expect(entry).toContainText('by dev@example.com')
  await expect(page.getByRole('main')).toContainText(/0\s*kudos\s*1\s*complaints\s*1\s*still open/)
  // one complaint, still open, on Avery's row and nobody else's
  await expect(page.getByRole('row', { name: /^Avery Stone 0 1 1 / })).toBeVisible()

  // while it is open, the dashboard lists it under what needs attention
  await page.goto('/')
  await expect(page.getByRole('group').filter({ hasText: 'Paperwork' })).toContainText('Streaks on the windows')

  await open(page, 'feedback')
  await entry.getByRole('button', { name: 'Mark resolved' }).click()
  await expect(entry).toContainText(/Avery Stone\s*Resolved/)
  await expect(page.getByRole('main')).toContainText(/1\s*complaints\s*0\s*still open/)
  // saved, not only shown
  await page.reload()
  await expect(entries(page).filter({ hasText: 'Streaks on the windows' })).toContainText('Resolved')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible()
  await expect(page.getByText('Streaks on the windows')).toHaveCount(0)

  await open(page, 'feedback')
  await entries(page).filter({ hasText: 'Streaks on the windows' }).getByRole('button', { name: 'Reopen' }).click()
  await expect(entries(page).filter({ hasText: 'Streaks on the windows' })).toContainText(/Avery Stone\s*Open/)
})

test('a kudos shows on the dashboard until it is passed on, and that is kept', async ({ page, world }) => {
  void world
  await open(page, 'feedback')
  await record(page, 'kudos', 'Birch House', 'Blake Rivers', 'Best clean yet')
  await expect(page.getByRole('row', { name: /^Blake Rivers 1 0 0 / })).toBeVisible()

  await page.goto('/')
  const kudos = page.getByRole('region', { name: 'Recent kudos' })
  const item = kudos.getByRole('listitem').filter({ hasText: 'Best clean yet' })
  await expect(item).toContainText('Birch House · Blake Rivers')
  await expect(kudos).toContainText('Most kudos this period: Blake Rivers (1)')
  await item.getByRole('button', { name: 'Pass it on' }).click()
  await expect(item.getByRole('button', { name: 'Pass it on' })).toHaveCount(0)
  await expect(item).toContainText(/passed on/i)
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Recent kudos' }).getByRole('listitem').filter({ hasText: 'Best clean yet' }),
  ).toContainText(/passed on/i)
})

test('an entry is removed only after a yes, and is then no longer listed or counted', async ({ page, world }) => {
  void world
  await open(page, 'feedback')
  await record(page, 'kudos', 'Birch House', 'Blake Rivers', 'Best clean yet')
  await record(page, 'complaint', 'Maple Court', 'Avery Stone', 'Streaks on the windows')
  await expect(page.getByRole('main')).toContainText(/1\s*kudos\s*1\s*complaints/)
  const entry = entries(page).filter({ hasText: 'Best clean yet' })

  await entry.getByRole('button', { name: 'Remove' }).click()
  await expect(entry).toContainText('Remove this entry? It will no longer be listed or counted.')
  await entry.getByRole('button', { name: 'Cancel' }).click()
  await expect(entry.getByRole('button', { name: 'Remove' })).toBeVisible()

  await entry.getByRole('button', { name: 'Remove' }).click()
  await entry.getByRole('button', { name: 'Yes, remove' }).click()
  await expect(entries(page)).toHaveCount(1)
  await expect(page.getByRole('main')).toContainText(/0\s*kudos\s*1\s*complaints/)
  await page.reload()
  await expect(entries(page)).toHaveCount(1)
  await expect(page.getByText('Best clean yet')).toHaveCount(0)
})
