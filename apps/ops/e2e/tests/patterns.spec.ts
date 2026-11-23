import { expect, open, test } from './helpers.ts'

test('Client patterns plans routes for the clients kept in', async ({ page, world: _ }) => {
  await open(page, 'patterns')
  await expect(page.getByRole('heading', { level: 1, name: 'Client patterns and routes' })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Maple Court' })).toBeVisible()

  // a higher minimum leaves clients out of the table
  const rows = page.getByRole('row')
  const before = await rows.count()
  await page.getByLabel('Fewest visits').fill('200')
  await expect(rows).toHaveCount(1)
  await page.getByLabel('Fewest visits').fill('3')
  await expect(rows).toHaveCount(before)

  await page.getByRole('checkbox', { name: 'Include Birch House in the routes' }).uncheck()
  await page.getByRole('button', { name: 'Plan routes' }).click()
  const plan = page.getByRole('region', { name: 'Route plan' })
  await expect(plan.getByRole('img', { name: "Map of the day's routes" })).toBeVisible({ timeout: 30_000 })
  // the pretend map service knows only the made-up sites, not the office
  await expect(plan.getByText('The office could not be placed')).toBeVisible()
  await expect(plan.getByText('Team 1').first()).toBeVisible()
  await expect(plan.getByText('Maple Court').first()).toBeVisible()
  // left out of the routes, on every day of every week
  for (const week of ['Week 1', 'Week 2', 'Week 3', 'Week 4']) {
    await plan.getByRole('button', { name: week }).click()
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      await plan.getByRole('button', { name: day, exact: true }).click()
      await expect(plan.getByText('Birch House')).toHaveCount(0)
    }
  }
})
