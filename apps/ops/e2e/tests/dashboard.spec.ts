import { type Page, camelo, expect, test } from './helpers.ts'

/** The schedule check and the trends are folded to one line until tapped (decision 0043). */
const unfold = (page: Page, title: RegExp) => page.locator('details > summary').filter({ hasText: title }).click()

test('the dashboard loads its panels', async ({ page, world }) => {
  void world
  await expect(page.getByRole('heading', { name: 'This pay period so far' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent kudos' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  // Billed is a dollar figure once the period has loaded
  await expect(page.getByText('Billed (approved visits)')).toBeVisible()
})

test('approved time not yet invoiced says how far back it looked, and every read it needed came in', async ({ page, world }) => {
  void world
  const paperwork = page.getByRole('group').filter({ hasText: 'Paperwork' })
  await expect(paperwork).toContainText(/\$[\d,.]+ approved, not yet invoiced/)
  // it never looks before the day the record starts, so the day named is that day or a later one
  await expect(paperwork).toContainText(/client-days?, looking back to \w{3} \w{3} \d+; the oldest is/, { timeout: 30_000 })
  await expect(paperwork).not.toContainText('Still checking earlier weeks')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('the schedule check finds the planted problems, with drive times', async ({ page, world }) => {
  void world
  const panel = page.getByRole('region', { name: /Schedule check/ })
  await unfold(page, /Schedule check/)
  await expect(panel.getByText('Loading the schedule')).toHaveCount(0, { timeout: 30_000 })
  // addresses are looked up through the server; the pretend map service answers at once
  await expect(panel).toContainText('Drive times are estimates', { timeout: 30_000 })
  await expect(panel).toContainText('1 unassigned')
  await expect(panel).toContainText('1 solo')
  await expect(panel).toContainText('1 tight gap')
  // Avery and Blake have visits from 8 in the morning to 9 at night that day, but only
  // 5.5 hours of work between them: a day is long by its work, not its first and last times
  await expect(page.getByText(/long day/i)).toHaveCount(0)
  expect(await camelo.log()).toContain('nominatim')

  const coming = page.getByRole('group').filter({ hasText: 'Coming up' })
  await expect(coming).toContainText('Finley Cole alone at Oak Villa')
  await expect(coming).toContainText('Pine Cottage')
  await expect(page.getByText('Elm Street Flat → Willow Farm').first()).toBeVisible()
  // Emery is only on call, and On Call is never checked
  await expect(page.getByText('Emery Hart')).toHaveCount(0)
})

test('a solo visit marked OK can be undone, and stays cleared after a reload', async ({ page, world }) => {
  void world
  const panel = page.getByRole('region', { name: /Schedule check/ })
  await unfold(page, /Schedule check/)
  await expect(panel).toContainText('1 solo', { timeout: 30_000 })
  await page.getByRole('button', { name: 'Mark OK' }).first().click()
  await expect(panel).toContainText('Marked OK')
  await expect(panel.getByText('1 solo', { exact: true })).toHaveCount(0)

  // Undo brings the flag back; mark it again for the reload
  await panel.getByRole('button', { name: 'Undo' }).click()
  await expect(panel.getByText('1 solo', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Mark OK' }).first().click()
  await expect(panel).toContainText('Marked OK')

  await page.reload()
  const again = page.getByRole('region', { name: /Schedule check/ })
  await unfold(page, /Schedule check/)
  await expect(again).toContainText('1 solo visit already marked OK', { timeout: 30_000 })
  await expect(again.getByText('1 solo', { exact: true })).toHaveCount(0)
})

test('trends fill in the finished pay periods and show them as a table', async ({ page, world }) => {
  test.setTimeout(120_000)
  void world
  await unfold(page, /^Trends/)
  const panel = page.getByRole('region', { name: /Trends/ })
  await expect(panel).toContainText('Each point is one finished pay period', { timeout: 100_000 })
  await panel.getByText('Show the figures as a table').click()
  const rows = panel.getByRole('row')
  await expect(rows).toHaveCount(14) // a heading and 13 pay periods
  // the last finished period has billed time: a dollar figure, not a dash
  await expect(rows.nth(1)).toContainText('$')
})

test('what the dashboard has loaded is not asked for again: by a report on the same period, or on coming back', async ({
  page,
  world: _signedIn,
}) => {
  // wait until the dashboard, its schedule check and its trends have finished asking
  const settled = async () => {
    let last = -1
    for (let quiet = 0; quiet < 3;) {
      await page.waitForTimeout(700)
      const n = (await camelo.log()).filter((x) => x !== 'nominatim').length
      quiet = n === last ? quiet + 1 : 0
      last = n
    }
    return last
  }
  await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible()
  const afterDashboard = await settled()

  // this pay period is already loaded: Unapproved timesheets opens from it
  // the approvals item's own button: a no-show yesterday has one with the same name
  await page
    .getByRole('listitem')
    .filter({ hasText: 'waiting for approval' })
    .getByRole('button', { name: 'Unapproved timesheets →' })
    .click()
  await expect(page.getByRole('heading', { level: 1, name: 'Unapproved timesheets' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Approve', exact: true }).first()).toBeVisible()
  expect(await settled()).toBe(afterDashboard)

  // and back on the dashboard, within five minutes, nothing is asked again
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible()
  await expect(page.getByText('waiting for approval').first()).toBeVisible()
  expect(await settled()).toBe(afterDashboard)
})
