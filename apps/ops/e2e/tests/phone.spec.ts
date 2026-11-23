import { type Page, asked, expect, open, test, openReport } from './helpers.ts'

// The site at a phone's width, with touch. Chrome, not Safari: an iPhone's own behaviour is still a check for a real phone.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

/** Nothing on the page is wider than the screen, so it never scrolls sideways. */
const fits = async (page: Page) => {
  const [content, screen] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
  expect(content, 'the page is wider than the screen').toBeLessThanOrEqual(screen)
}

test('the dashboard fits a phone, with what needs attention folded to one line that opens on a tap', async ({ page, world }) => {
  void world
  const paperwork = page.getByRole('group').filter({ hasText: 'Paperwork' })
  // folded: the count is on the one line, and the detail is not showing
  await expect(paperwork).toContainText(/\d+ to approve/)
  await expect(paperwork.getByText('waiting for approval')).toBeHidden()
  await fits(page)

  await paperwork.locator('summary').tap()
  await expect(paperwork.getByText('waiting for approval')).toBeVisible()
  await expect(paperwork.getByRole('button', { name: 'Unapproved timesheets →' })).toBeVisible()
  await fits(page)
  // every panel is there, one under another
  for (const name of ['This pay period so far', 'Recent kudos']) await expect(page.getByRole('heading', { name })).toBeVisible()
})

test('a timesheet is approved on a phone: each figure is labelled, and one tap and a yes does it', async ({ page, world }) => {
  const day = world.waitingDays.at(-1)!
  await open(page, 'review', { period: day })
  await fits(page)
  // on a phone a row is a card: each figure carries its own label, since there is no row of headings above it
  await expect(page.getByRole('row', { name: /Cleaner Casey Lane Scheduled 8:00 AM – 10:30 AM Sched hrs 2\.50/ }).first()).toBeVisible()

  const waiting = page.getByRole('button', { name: 'Approve', exact: true })
  const before = await waiting.count()
  await waiting.first().tap()
  const box = page.getByRole('dialog', { name: 'Confirm change' })
  await box.getByRole('button').first().tap()
  await expect(box).toContainText('1 of 1 approved in Camelo')
  await box.getByRole('button', { name: 'Done' }).tap()
  await expect(waiting).toHaveCount(before - 1)
  expect(await asked('approveTimesheets')).toBe(1)
  await fits(page)
})

test('on a phone the tab bar sits at the bottom, opens a hub, and Back returns to the page before', async ({ page, world }) => {
  void world
  const hubs = page.getByRole('navigation', { name: 'Hubs' })
  await expect(hubs).toBeVisible()
  // along the bottom of the screen
  const box = (await hubs.boundingBox())!
  expect(box.y + box.height).toBeCloseTo(page.viewportSize()!.height, 0)
  await fits(page)
  await openReport(page, 'Payroll hours', 'tap')
  await expect(page.getByRole('heading', { level: 1, name: 'Payroll hours' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveCount(0, { timeout: 30_000 })
  await fits(page)
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1, name: 'Unapproved timesheets' })).toBeVisible()
})
