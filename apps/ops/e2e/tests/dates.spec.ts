import { expect, open, test } from './helpers.ts'

// Tests of rules that turn on the date. Each group names its day, so it sees the same made-up
// world whenever it runs; every other test file runs on the real date.

const paperwork = (page: import('@playwright/test').Page) => page.getByRole('group').filter({ hasText: 'Paperwork' })

test.describe('in the pay period the record starts with', () => {
  // Tuesday in the period of Friday 2026-10-09; last period, Oct 2 to 8, is from before the start
  test.use({ today: '2026-10-13' })

  test('approved time from before the start is not counted, though it is there', async ({ page, world }) => {
    expect(world.today).toBe('2026-10-13')
    const line = paperwork(page)
    await expect(line).toContainText('approved, not yet invoiced')
    // the made-up world has approved, uninvoiced visits all through the week of Oct 2
    await expect(line).toContainText('looking back to Fri Oct 9; the oldest is Fri Oct 9')
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})

test.describe('three weeks after the record starts', () => {
  // Tuesday in the period of Friday Oct 30, two days after the clocks went back
  test.use({ today: '2026-11-03' })

  test('with every week uninvoiced, it steps back to the day the record starts and no further', async ({ page, world }) => {
    void world
    const line = paperwork(page)
    await expect(line).toContainText('looking back to Fri Oct 9', { timeout: 30_000 })
    await expect(line).not.toContainText('Still checking earlier weeks')
    await expect(line).not.toContainText('There may be more')
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('it stops at a week with nothing left to invoice, and does not see behind it', async ({ page, world }) => {
    void world
    await expect(paperwork(page)).toContainText('looking back to Fri Oct 9', { timeout: 30_000 })
    // invoice the whole week of Oct 16: export it and mark what was exported
    await open(page, 'invoicing', { from: '2026-10-16' })
    await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download CSV' }).click()])
    await page
      .getByRole('dialog', { name: 'Mark exported rows as invoiced?' })
      .getByRole('button', { name: /^Mark \d+ invoiced$/ })
      .click()
    await expect(page.getByRole('button', { name: 'Download CSV' })).toBeDisabled()

    await open(page, 'dashboard')
    const line = paperwork(page)
    // last week (Oct 23) still has time to invoice; the week before it is clean, so the looking stops there.
    // The week of Oct 9 behind it is still uninvoiced and is not counted: the limit the owner accepted.
    await expect(line).toContainText('looking back to Fri Oct 16; the oldest is Fri Oct 23', { timeout: 30_000 })
  })
})

test.describe('with more uninvoiced weeks than it will read', () => {
  // far enough on that thirteen pay periods all fall after the start, with history for every one of them
  test.use({ today: '2027-03-02', daysBack: 100 })

  test('it stops after thirteen pay periods and says there may be more', async ({ page, world }) => {
    void world
    const line = paperwork(page)
    // this period starts Fri Feb 26; twelve more before it reach back to Fri Dec 4
    await expect(line).toContainText('looking back to Fri Dec 4', { timeout: 60_000 })
    await expect(line).toContainText('There may be more before that')
  })
})
