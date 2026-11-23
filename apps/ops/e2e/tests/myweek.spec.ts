import { type Page, expect, open, staffSwitch, test } from './helpers.ts'

// What a cleaner sees, and what they are kept from (decisions 0037 and 0038). Every name is made up.
// In the made-up world Avery Stone works with Blake Rivers at Maple Court and Birch House; Casey Lane
// and Devon Marsh are another team; Emery Hart is only ever on call.

/** Everything the page asked the server for, and every file of the site's own code it fetched. */
function watch(page: Page) {
  const api: string[] = []
  const code: string[] = []
  page.on('request', (r) => {
    const url = new URL(r.url())
    if (url.pathname.startsWith('/api/')) api.push(url.pathname)
    if (url.pathname.startsWith('/src/')) code.push(url.pathname)
  })
  return { api, code }
}
// Each report's own code, which is fetched only when that report is opened. (The frame around the reports, menu
// included, is part of the first script every visitor gets before signing in: it holds no data.)
const REPORT_CODE = /(Dashboard|Payroll|Review|SchedVsActual|Punctuality|ClientHours|Invoicing|Feedback|Pricing)View|WeekReports/

test.describe('a cleaner', () => {
  test.use({ signInAs: 'avery@example.com' })

  test('sees their own visits and hours, and nothing of anyone else', async ({ page, world }) => {
    void world
    await expect(page.getByRole('heading', { level: 1, name: 'My week' })).toBeVisible()
    await expect(page.getByRole('banner')).toContainText('Avery Stone')
    const main = page.getByRole('main')
    // today is always there; her visits are with her partner, at the address
    await expect(main.getByRole('region', { name: 'Today' })).toBeVisible()
    await expect(main).toContainText('Maple Court')
    await expect(main).toContainText('12 Maple Court, Exampleton, ON')
    await expect(main).toContainText('With Blake Rivers')
    // the other team's clients and people are not on her page
    for (const theirs of ['Cedar Lodge', 'Elm Street Flat', 'Casey Lane', 'Devon Marsh', 'Finley Cole'])
      await expect(main).not.toContainText(theirs)
    // her hours for the pay period, approved and waiting, and no dollar figure anywhere
    const hours = main.getByRole('region', { name: 'Hours this pay period' })
    await expect(hours.getByRole('row', { name: /^Total \d+\.\d\d/ })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('$')
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test("is shown no report, asks the server for nothing else, and never fetches a report's code", async ({ page, world }) => {
    void world
    const seen = watch(page)
    // asking for a report by its address gets My week all the same
    for (const view of ['payroll', 'invoicing', 'dashboard', 'pricing']) {
      await page.goto(`/?view=${view}`)
      await expect(page.getByRole('heading', { level: 1, name: 'My week' })).toBeVisible()
      await expect(page.getByRole('main')).toContainText('Maple Court')
    }
    await expect(page.getByRole('navigation', { name: 'Hubs' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Needs attention' })).toHaveCount(0)
    // their own week, and the photos on their own visits (decision 0044): nothing else
    const asked = [...new Set(seen.api)].sort()
    expect(asked).toContain('/api/my-week')
    expect(asked.filter((a) => a !== '/api/my-week' && a !== '/api/visit-photos')).toEqual([])
    expect(seen.code.filter((f) => REPORT_CODE.test(f))).toEqual([])
    // and My week's own code was what was fetched
    expect(seen.code.some((f) => f.includes('MyWeekView'))).toBe(true)
  })

  test('fits a phone', async ({ page, world }) => {
    void world
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('main')).toContainText('Maple Court')
    const [content, screen] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
    expect(content).toBeLessThanOrEqual(screen)
  })

  test('loses the page when their access is taken away, and can sign out', async ({ page, world }) => {
    void world
    await staffSwitch('off')
    await page.reload()
    await expect(page.getByRole('main')).toContainText('avery@example.com is not on the list of people who can use this site.')
    await expect(page.getByRole('heading', { name: 'My week' })).toHaveCount(0)

    await staffSwitch('*')
    await page.getByRole('textbox', { name: 'Dev sign-in email' }).fill('avery@example.com')
    await page.getByRole('button', { name: 'Dev sign-in' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'My week' })).toBeVisible()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page.getByRole('button', { name: 'Dev sign-in' })).toBeVisible()
  })
})

test.describe('someone who is only on call', () => {
  test.use({ signInAs: 'emery@example.com' })

  test('is told the days they are on call, and nothing else about them', async ({ page, world }) => {
    void world
    const main = page.getByRole('main')
    const today = main.getByRole('region', { name: 'Today' })
    await expect(today).toContainText('You are on call')
    // no visit, no times, no client: On Call only says who is on call
    await expect(today.getByRole('listitem')).toHaveCount(0)
    await expect(main).not.toContainText('Maple Court')
    await expect(main.getByRole('region', { name: 'Hours this pay period' }).getByRole('row', { name: /^Total 0\.00/ })).toBeVisible()
  })
})

test('the office can look at what one person sees, and keeps its own reports', async ({ page, world }) => {
  void world
  await open(page, 'myweek')
  await expect(page.getByRole('heading', { level: 1, name: 'My week (as a cleaner sees it)' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Whose week' }).selectOption({ label: 'Avery Stone' })
  const main = page.getByRole('main')
  await expect(main).toContainText('Maple Court')
  await expect(main).toContainText('With Blake Rivers')
  await expect(main).not.toContainText('Cedar Lodge')
  await page.getByRole('combobox', { name: 'Whose week' }).selectOption({ label: 'Casey Lane' })
  await expect(main).toContainText('Cedar Lodge')
  await expect(main).not.toContainText('Maple Court')
  await expect(page.getByRole('navigation', { name: 'Hubs' })).toBeVisible()
  await expect(main.getByRole('region', { name: 'Connect Camelo' })).toHaveCount(0)
})

// Photos of the home on a visit (decision 0044): kept in the site's own storage (in memory here), never in Camelo.
test.describe('photos of the home', () => {
  test.use({ signInAs: 'avery@example.com' })

  test('a cleaner adds a before photo to their own visit, sees it, and deletes it the same day', async ({ page, world: _ }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'My week' })).toBeVisible()
    const add = page.locator('label', { hasText: 'Before photo' }).first()
    // today's visits come first; if there are none today, the earlier ones are folded under their own heading
    if (!(await add.isVisible())) await page.getByText('Earlier this pay period').click()
    await add.locator('input[type="file"]').setInputFiles(new URL('./fixtures/home-photo.jpg', import.meta.url).pathname)
    const thumb = page.getByRole('img', { name: 'Before photo' })
    await expect(thumb).toBeVisible()
    // the picture comes back from the server as a data: address, so nothing outside the site is asked for it
    expect(await thumb.getAttribute('src')).toMatch(/^data:image\/jpeg;base64,/)

    const figure = page.locator('figure').filter({ has: thumb })
    await figure.getByRole('button', { name: 'Delete' }).click()
    await figure.getByRole('button', { name: 'Sure?' }).click()
    await expect(page.getByRole('img', { name: 'Before photo' })).toHaveCount(0)
  })

  test('a cleaner connects their Camelo account once with the emailed code, and stays connected on reload', async ({ page, world: _ }) => {
    await page.goto('/')
    const connect = page.getByRole('region', { name: 'Connect Camelo' })
    await expect(connect).toBeVisible()
    await expect(connect).toContainText('avery@example.com')

    await connect.getByRole('button', { name: 'Email me a code' }).click()
    const input = connect.getByRole('textbox', { name: 'One-time code' })
    await expect(input).toBeVisible()

    // wrong code shows an error and keeps the form open
    await input.fill('000000')
    await connect.getByRole('button', { name: 'Connect Camelo' }).click()
    await expect(connect.getByRole('alert')).toContainText('Invalid or expired code')

    // right code connects the account and hides the prompt, including after a reload
    await input.fill('123456')
    await connect.getByRole('button', { name: 'Connect Camelo' }).click()
    await expect(connect).toHaveCount(0)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'My week' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Connect Camelo' })).toHaveCount(0)
  })
})

test.describe('clock in and out with door photos', () => {
  test.use({ today: '2026-11-04', signInAs: 'blake@example.com' })

  test('a connected cleaner clocks in without a photo, adds the missing clock-in door photo, and clocks out with a door photo', async ({
    page,
    world: _,
  }) => {
    await page.goto('/')
    const connect = page.getByRole('region', { name: 'Connect Camelo' })
    await connect.getByRole('button', { name: 'Email me a code' }).click()
    await connect.getByRole('textbox', { name: 'One-time code' }).fill('123456')
    await connect.getByRole('button', { name: 'Connect Camelo' }).click()
    await expect(connect).toHaveCount(0)

    const todayRegion = page.getByRole('region', { name: 'Today' })
    const birch = todayRegion.getByRole('listitem').filter({ hasText: 'Birch House' })
    await expect(birch.locator('label', { hasText: /^Clock in$/ })).toBeVisible()

    // Clock in without a photo: records the punch and marks the door photo missing
    await birch.getByRole('button', { name: 'Clock in without photo' }).click()
    await expect(birch).toContainText('Clocked in 12:00 PM')
    await expect(birch).toContainText('Clock-in door photo missing')

    // Add the missing clock-in door photo later
    const fixture = new URL('./fixtures/home-photo.jpg', import.meta.url).pathname
    await birch.locator('label', { hasText: 'Add clock-in door photo' }).locator('input[type="file"]').setInputFiles(fixture)
    await expect(birch).not.toContainText('Clock-in door photo missing')

    // Clock out with a door photo: records CLOCK_OUT + FINISH and attaches the photo in one step
    await birch
      .locator('label', { hasText: /^Clock out$/ })
      .locator('input[type="file"]')
      .setInputFiles(fixture)
    await expect(birch).toContainText('Clocked in 12:00 PM – 12:00 PM')
    await expect(birch).not.toContainText('Clock-out door photo missing')
    await expect(birch.locator('label', { hasText: /^Clock out$/ })).toHaveCount(0)
  })
})

test.describe('photos of the home for the office', () => {
  // A Wednesday at noon: Casey Lane and Devon Marsh's morning visit at Cedar Lodge has finished and is waiting for approval.
  test.use({ today: '2026-11-04' })

  test('the office sees a visit photo on both partners’ My week, on This week and in Timesheets → To approve, enlarges it, and deletes it', async ({
    page,
    world,
  }) => {
    await open(page, 'myweek')
    await page.getByRole('combobox', { name: 'Whose week' }).selectOption({ label: 'Casey Lane' })
    const add = page.getByRole('region', { name: 'Today' }).locator('label', { hasText: 'Before photo' }).first()
    await add.locator('input[type="file"]').setInputFiles(new URL('./fixtures/home-photo.jpg', import.meta.url).pathname)
    await expect(page.getByRole('img', { name: 'Before photo' })).toBeVisible()

    // My week for Devon Marsh, Casey Lane's partner on the visit: the photo shows there too (owner, 2026-10-22)
    await page.getByRole('combobox', { name: 'Whose week' }).selectOption({ label: 'Devon Marsh' })
    await expect(page.getByRole('region', { name: 'Today' }).getByRole('img', { name: 'Before photo' })).toBeVisible()

    // This week → Day & team: merged visit shows the photo once, with no upload buttons; clicking enlarges it
    await open(page, 'teams')
    const teamThumb = page.getByRole('img', { name: 'Before photo' })
    await expect(teamThumb).toHaveCount(1)
    await expect(page.locator('label', { hasText: 'Before photo' })).toHaveCount(0)
    await teamThumb.click()
    const dialog = page.getByRole('dialog', { name: 'Before photo' })
    await expect(dialog.getByRole('img', { name: 'Before photo, full size' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).toHaveCount(0)

    // This week → Cleaner and Client: shared across both partners on the visit
    await open(page, 'staff')
    await expect(page.getByRole('img', { name: 'Before photo' })).toHaveCount(2)
    await open(page, 'client')
    await expect(page.getByRole('img', { name: 'Before photo' })).toHaveCount(2)

    // Timesheets → To approve: shown on both Casey Lane's and Devon Marsh's rows for Cedar Lodge
    await open(page, 'review', { period: world.waitingDays.at(-1)! })
    await expect(page.getByRole('img', { name: 'Before photo' })).toHaveCount(2)
    const firstFigure = page
      .locator('figure')
      .filter({ has: page.getByRole('img', { name: 'Before photo' }) })
      .first()
    await firstFigure.getByRole('button', { name: 'Delete' }).click()
    await firstFigure.getByRole('button', { name: 'Sure?' }).click()
    await expect(page.getByRole('img', { name: 'Before photo' })).toHaveCount(0)
  })
})
