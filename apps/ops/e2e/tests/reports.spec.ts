import { camelo, expect, open, test, openReport } from './helpers.ts'

// What each report should show from the made-up schedule, and who must never appear:
// Emery Hart is only ever on call, and On Call belongs on Daily teams alone.
const REPORTS: [view: string, title: string, shows: string, hasEmery: boolean][] = [
  ['teams', 'Daily teams', 'Avery Stone', true],
  ['client', 'By client', 'Maple Court', false],
  ['staff', 'By staff', 'Avery Stone', false],
  ['clienthours', 'Client hours', 'Maple Court', false],
  ['invoicing', 'Invoicing', 'Maple Court', false],
  ['schedvsactual', 'Scheduled vs actual', 'Avery Stone', false],
  ['punctuality', 'Punctuality', 'Blake Rivers', false],
  ['payroll', 'Payroll hours', 'Avery Stone', false],
  ['patterns', 'Client patterns and routes', 'Maple Court', false],
]

for (const [view, title, shows, hasEmery] of REPORTS) {
  test(`${title} opens and shows the schedule`, async ({ page, world }) => {
    await open(page, view, { week: world.today })
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
    // the filter dropdowns hold names too, as hidden options: look at what is on the page
    await expect(page.getByText(shows).filter({ visible: true }).first()).toBeVisible()
    if (hasEmery) await expect(page.getByText('Emery Hart').filter({ visible: true }).first()).toBeVisible()
    // not on the page, and not offered in a filter either
    else await expect(page.getByText('Emery Hart')).toHaveCount(0)
  })
}

test('Punctuality explains the 15-minute grace period', async ({ page, world }) => {
  await open(page, 'punctuality', { week: world.today })
  await expect(page.getByRole('heading', { level: 1, name: 'Punctuality' })).toBeVisible()
  await expect(page.getByText('On time means clocked in no more than 15 minutes after the scheduled start')).toBeVisible()
})

test('Unapproved timesheets lists what is waiting', async ({ page, world }) => {
  await open(page, 'review', { period: world.waitingDays.at(-1) })
  await expect(page.getByRole('heading', { level: 1, name: 'Unapproved timesheets' })).toBeVisible()
  await expect(page.getByText('Casey Lane').filter({ visible: true }).first()).toBeVisible()
  // Avery's time is approved, so it is not on this page
  await expect(page.getByRole('row').filter({ hasText: 'Avery Stone' }).filter({ hasText: 'submitted' })).toHaveCount(0)
})

test('Client feedback opens', async ({ page, world }) => {
  void world
  await open(page, 'feedback')
  await expect(page.getByRole('heading', { level: 1, name: 'Client feedback' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('when Camelo refuses requests, the report says so and recovers on a retry', async ({ page, world }) => {
  // far more refusals than one page makes requests, retries included
  await camelo.refuseNext(100_000)
  // a week nothing has read yet: the function keeps a week it has just read for a minute
  // (decision 0032), and signing in has already read this week for the dashboard
  const earlier = new Date(Date.parse(`${world.today}T00:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10)
  await page.goto(`/?view=staff&week=${earlier}`)
  await expect(page.getByRole('alert')).toContainText('Could not load shifts from Camelo')
  await camelo.refuseNext(0)
  await page.reload()
  await expect(page.getByText('Avery Stone').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('a report that fails while drawing shows a message, is reported, and leaves the rest of the site working', async ({ page, world }) => {
  // the server answers with something no report can draw: the shifts are not a list
  await page.route('**/api/timesheet-review', async (route) => {
    const res = await route.fetch()
    await route.fulfill({ response: res, json: { ...(await res.json()), shifts: 5 } })
  })
  const reported = page.waitForResponse('**/api/client-error')
  await page.goto(`/?view=payroll&period=${world.waitingDays.at(-1)}`)

  const message = page.getByRole('alert')
  await expect(message).toContainText('This report could not be shown.')
  expect((await reported).status()).toBe(200)
  const sent = (await reported).request().postDataJSON()
  expect(sent).toMatchObject({ view: 'payroll', source: 'render' })
  expect(Object.keys(sent).sort()).toEqual(['componentStack', 'message', 'source', 'stack', 'view'])

  // the header and the tab bar still work: another report opens
  await expect(page.getByRole('heading', { level: 1, name: 'Payroll hours' })).toBeVisible()
  await openReport(page, 'Daily teams')
  await expect(page.getByRole('heading', { level: 1, name: 'Daily teams' })).toBeVisible()
  await expect(page.getByText('Avery Stone').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)

  // and once the server's answer is good again, Try again brings the report back
  await page.goto(`/?view=payroll&period=${world.waitingDays.at(-1)}`)
  await expect(message).toContainText('This report could not be shown.')
  await page.unroute('**/api/timesheet-review')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('Avery Stone').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('a week report that fails while drawing keeps the header and the tab bar', async ({ page, world }) => {
  // the three week reports work their shifts out inside the report, so a fault there is the report's alone
  await page.route('**/api/shifts', async (route) => {
    const res = await route.fetch()
    await route.fulfill({ response: res, json: { ...(await res.json()), shifts: 5 } })
  })
  await page.goto(`/?view=teams&week=${world.today}`)
  await expect(page.getByRole('alert')).toContainText('This report could not be shown.')
  await expect(page.getByRole('heading', { level: 1, name: 'Daily teams' })).toBeVisible()

  // the tab bar works and another report can be chosen
  await openReport(page, 'Payroll hours')
  await expect(page.getByRole('heading', { level: 1, name: 'Payroll hours' })).toBeVisible()
  await expect(page.getByText('Avery Stone').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('a report whose code cannot be fetched says to reload, and the rest of the site works', async ({ page, world: _signedIn }) => {
  // each report's code is its own download: lose one, and only that report is affected.
  // Blocked before a fresh load, so the background fetch of the other reports cannot have it already.
  await page.route('**/components/PayrollView*', (route) => route.abort())
  const reported: string[] = []
  page.on('request', (r) => r.url().includes('/api/client-error') && reported.push(r.url()))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible()

  await openReport(page, 'Payroll hours')
  const message = page.getByRole('alert')
  await expect(message).toContainText('This report could not be loaded.')
  await expect(message.getByRole('button', { name: 'Reload' })).toBeVisible()
  // not a fault in the site, so nothing is sent to the log
  expect(reported).toEqual([])

  await openReport(page, 'Daily teams')
  await expect(page.getByText('Avery Stone').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('Back and Forward move between reports, each on the dates it was left at', async ({ page, world: _signedIn }) => {
  const h1 = (name: string) => page.getByRole('heading', { level: 1, name })
  const choose = async (report: string) => {
    await openReport(page, report)
    await expect(h1(report)).toBeVisible()
  }
  await choose('Payroll hours')
  // stepping period to period is not a step for Back
  await page.getByRole('button', { name: 'Previous period' }).click()
  await page.getByRole('button', { name: 'Previous period' }).click()
  const period = new URL(page.url()).searchParams.get('period')
  expect(period).toBeTruthy()
  await choose('Daily teams')

  await page.goBack()
  await expect(h1('Payroll hours')).toBeVisible()
  expect(new URL(page.url()).searchParams.get('period')).toBe(period)
  // Hours & pay opened on its first page before its Payroll tab was chosen: each page seen is a step
  await page.goBack()
  await expect(h1('Unapproved timesheets')).toBeVisible()
  await page.goBack()
  await expect(h1('Dashboard')).toBeVisible()
  await page.goForward()
  await page.goForward()
  await expect(h1('Payroll hours')).toBeVisible()
  expect(new URL(page.url()).searchParams.get('period')).toBe(period)

  // a link on the Dashboard opens another report: Back returns to the Dashboard
  await page.goBack()
  await page.goBack()
  await page.getByRole('button', { name: 'Client feedback →' }).click()
  await expect(h1('Client feedback')).toBeVisible()
  await page.goBack()
  await expect(h1('Dashboard')).toBeVisible()
})

test('the tab bar opens each hub on its first page, tabs move within it, and an old address opens in its hub', async ({
  page,
  world: _signedIn,
}) => {
  const h1 = (name: string | RegExp) => page.getByRole('heading', { level: 1, name })
  const hubs = page.getByRole('navigation', { name: 'Hubs' })
  await expect(hubs.getByRole('button')).toHaveText(['Home', 'Schedule', 'Hours & pay', 'Billing', 'Clients'])
  await expect(hubs.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page')

  await hubs.getByRole('button', { name: 'Hours & pay' }).click()
  await expect(h1('Unapproved timesheets')).toBeVisible()
  await expect(hubs.getByRole('button', { name: 'Hours & pay' })).toHaveAttribute('aria-current', 'page')
  const tabs = page.getByRole('navigation', { name: 'Hours & pay pages' })
  await tabs.getByRole('button', { name: 'Punctuality' }).click()
  await expect(h1('Punctuality')).toBeVisible()
  await expect(tabs.getByRole('button', { name: 'Punctuality' })).toHaveAttribute('aria-current', 'page')

  // a hub with one page has no tabs
  await hubs.getByRole('button', { name: 'Clients' }).click()
  await expect(h1('Client feedback')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Clients pages' })).toHaveCount(0)

  // an old address still opens its report, inside its hub
  await page.goto('/?view=staff')
  await expect(h1('By staff')).toBeVisible()
  await expect(hubs.getByRole('button', { name: 'Schedule' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('navigation', { name: 'Schedule pages' }).getByRole('button', { name: 'This week' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  // This week holds three reports behind one switch, and My week is a link from the cleaner grouping
  await expect(page.getByRole('radio', { name: 'Cleaner', exact: true })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: 'Client', exact: true }).click()
  await expect(h1('By client')).toBeVisible()
  await page.getByRole('radio', { name: 'Cleaner', exact: true }).click()
  await page.getByRole('button', { name: "See a cleaner's week as they see it →" }).click()
  await expect(h1(/My week/)).toBeVisible()

  // Refresh and Sign out are in the account menu
  await page.getByRole('button', { name: 'Account' }).click()
  await expect(page.getByRole('button', { name: 'Refresh data' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0)
})

test('every column header has a name, and the sign-in page has a main landmark', async ({ page, world }) => {
  for (const [view, at] of [
    ['review', { period: world.waitingDays.at(-1)! }],
    ['schedvsactual', { period: world.today }],
  ] as const) {
    await open(page, view, at)
    // named by its text, its own label, or a labelled control inside it (the select-all tick box)
    const headers = page.locator('thead th')
    expect(await headers.count()).toBeGreaterThan(3)
    const unnamed = await headers.evaluateAll(
      (ths) =>
        ths.filter((th) => !(th.textContent ?? '').trim() && !th.getAttribute('aria-label') && !th.querySelector('[aria-label]')).length,
    )
    expect(unnamed, `${view}: column headers with no name`).toBe(0)
  }
  await page.evaluate(() => sessionStorage.clear())
  await page.goto('/')
  await expect(page.getByRole('main')).toContainText('Sign in with the Google account')
})
