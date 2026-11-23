import { type Page, expect, open, test } from './helpers.ts'

const cleanerCard = (page: Page, name: string) => page.locator('article').filter({ has: page.getByRole('heading', { level: 2, name }) })

const clientCard = (page: Page, name: string) => page.locator('article').filter({ has: page.getByRole('heading', { level: 2, name }) })

test.describe('live board', () => {
  // Pin to a weekday (Wednesday Oct 14, 2026 at noon Toronto time)
  test.use({ today: '2026-10-14' })

  test('opens from dashboard and shows the top bar, next 30 minutes strip, and cleaner cards', async ({ page, world }) => {
    void world
    // 1. Start on dashboard and click Live board link
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 2, name: 'Needs attention' })).toBeVisible()
    await page.getByRole('button', { name: 'Live board →' }).click()

    // 2. Header elements
    await expect(page.getByRole('heading', { level: 1, name: 'Live board' })).toBeVisible()
    await expect(page.getByText(/Updated \d+:\d\d [ap]m/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()

    // 3. Next 30 minutes attention strip (ADR 0029)
    const nextStrip = page.getByRole('region', { name: 'Next 30 minutes' })
    await expect(nextStrip).toBeVisible()
    await expect(nextStrip).toContainText('Willow Farm')
    await expect(nextStrip).toContainText('Oak Villa')

    // 4. Cleaner cards and statuses
    // Blake is late (> 30 min without clock-in -> Red)
    const blake = cleanerCard(page, 'Blake Rivers')
    await expect(blake).toBeVisible()
    await expect(blake).toContainText('Late')
    await expect(blake.getByRole('button', { name: 'Mark handled' })).toBeVisible()

    // Avery is on site at Birch House (open timesheet)
    const avery = cleanerCard(page, 'Avery Stone')
    await expect(avery).toBeVisible()
    await expect(avery).toContainText('On site')

    // Finley is running over at Willow Farm and at risk for Oak Villa -> Yellow
    const finley = cleanerCard(page, 'Finley Cole')
    await expect(finley).toBeVisible()
    await expect(finley).toContainText('Running over')
    await expect(finley).toContainText('At risk')

    // Day timeline is rendered in cleaner cards
    await expect(blake.getByText('6:30')).toBeVisible()
    await expect(blake.getByText('6 pm')).toBeVisible()
  })

  test('filters cleaner cards by status level (All, Act now, Watch, Routine)', async ({ page, world }) => {
    void world
    await open(page, 'live')
    await expect(page.getByRole('heading', { level: 1, name: 'Live board' })).toBeVisible()

    const allBtn = page.getByRole('button', { name: /All/ })
    const redBtn = page.getByRole('button', { name: /Act now/ })
    const yellowBtn = page.getByRole('button', { name: /Watch/ })
    const greyBtn = page.getByRole('button', { name: /Routine/ })

    // Verify initial count badges (Blake: 1 Red, Finley & Avery [partner late]: 2 Yellow, Casey & Devon: 2 Grey)
    await expect(allBtn).toContainText('5')
    await expect(redBtn).toContainText('1')
    await expect(yellowBtn).toContainText('2')
    await expect(greyBtn).toContainText('2')

    // 1. Filter by Red (Act now): shows only Blake
    await redBtn.click()
    await expect(cleanerCard(page, 'Blake Rivers')).toBeVisible()
    await expect(cleanerCard(page, 'Avery Stone')).toBeHidden()
    await expect(cleanerCard(page, 'Finley Cole')).toBeHidden()
    await expect(cleanerCard(page, 'Casey Lane')).toBeHidden()

    // 2. Filter by Yellow (Watch): shows Finley and Avery (partner late)
    await yellowBtn.click()
    await expect(cleanerCard(page, 'Finley Cole')).toBeVisible()
    await expect(cleanerCard(page, 'Avery Stone')).toBeVisible()
    await expect(cleanerCard(page, 'Blake Rivers')).toBeHidden()
    await expect(cleanerCard(page, 'Casey Lane')).toBeHidden()

    // 3. Filter by Grey (Routine): shows Casey and Devon
    await greyBtn.click()
    await expect(cleanerCard(page, 'Casey Lane')).toBeVisible()
    await expect(cleanerCard(page, 'Devon Marsh')).toBeVisible()
    await expect(cleanerCard(page, 'Blake Rivers')).toBeHidden()
    await expect(cleanerCard(page, 'Finley Cole')).toBeHidden()

    // 4. Return to All
    await allBtn.click()
    await expect(cleanerCard(page, 'Blake Rivers')).toBeVisible()
    await expect(cleanerCard(page, 'Finley Cole')).toBeVisible()
    await expect(cleanerCard(page, 'Avery Stone')).toBeVisible()
  })

  test('marks a red visit as handled and persists across page reload', async ({ page, world }) => {
    void world
    await open(page, 'live')
    await expect(page.getByRole('heading', { level: 1, name: 'Live board' })).toBeVisible()

    const redBtn = page.getByRole('button', { name: /Act now/ })
    const yellowBtn = page.getByRole('button', { name: /Watch/ })

    await expect(redBtn).toContainText('1')
    await expect(yellowBtn).toContainText('2')

    let blake = cleanerCard(page, 'Blake Rivers')
    const handleBtn = blake.getByRole('button', { name: 'Mark handled' })
    await expect(handleBtn).toBeVisible()

    // 1. Tap "Mark handled"
    await handleBtn.click()

    // Blake's visit immediately shows Handled
    await expect(blake.getByText('Handled')).toBeVisible()

    // Red count decrements to 0, Yellow count increments to 3
    await expect(redBtn).toContainText('0')
    await expect(yellowBtn).toContainText('3')

    // 2. Reload the page: verify persistence from server store (scheduleLiveHandled)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Live board' })).toBeVisible()
    blake = cleanerCard(page, 'Blake Rivers')
    await expect(blake.getByText('Handled')).toBeVisible()
    await expect(page.getByRole('button', { name: /Act now/ })).toContainText('0')
    await expect(page.getByRole('button', { name: /Watch/ })).toContainText('3')

    // 3. Undo handled restores Red status
    await blake.getByRole('button', { name: '(undo)' }).click()
    await expect(blake.getByRole('button', { name: 'Mark handled' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Act now/ })).toContainText('1')
    await expect(page.getByRole('button', { name: /Watch/ })).toContainText('2')

    // 4. Reload again: verify undo persists on server
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Live board' })).toBeVisible()
    blake = cleanerCard(page, 'Blake Rivers')
    await expect(blake.getByRole('button', { name: 'Mark handled' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Act now/ })).toContainText('1')
    await expect(page.getByRole('button', { name: /Watch/ })).toContainText('2')
  })

  test('switches between Cleaners and Clients grouping', async ({ page, world }) => {
    void world
    await open(page, 'live')
    await expect(page.getByRole('heading', { level: 1, name: 'Live board' })).toBeVisible()

    // Open settings and switch to Clients view
    await page.getByRole('button', { name: 'Settings' }).click()
    const clientsBtn = page.getByRole('main').getByRole('button', { name: 'Clients', exact: true })
    await clientsBtn.click()

    // Verify client groups appear
    await expect(clientCard(page, 'Birch House')).toBeVisible()
    await expect(clientCard(page, 'Willow Farm')).toBeVisible()
    await expect(clientCard(page, 'Maple Court')).toBeVisible()

    // Switch back to Cleaners
    const cleanersBtn = page.getByRole('main').getByRole('button', { name: 'Cleaners', exact: true })
    await cleanersBtn.click()
    await expect(cleanerCard(page, 'Blake Rivers')).toBeVisible()
    await expect(cleanerCard(page, 'Avery Stone')).toBeVisible()
  })

  test('grace period settings drawer allows changing grace', async ({ page, world }) => {
    void world
    await open(page, 'live')
    await expect(page.getByRole('heading', { level: 1, name: 'Live board' })).toBeVisible()

    await page.getByRole('button', { name: 'Settings' }).click()
    const settingsPanel = page.getByRole('region', { name: 'Settings' })
    await expect(settingsPanel).toBeVisible()
    await expect(settingsPanel).toContainText('Grace period')

    // Click 20 min grace
    const grace20 = settingsPanel.getByRole('button', { name: '20 min' })
    await grace20.click()

    // Explanatory note updates
    await expect(page.getByText('Grace 20 min · most urgent first')).toBeVisible()

    // Restore to 15 min grace
    const grace15 = settingsPanel.getByRole('button', { name: '15 min' })
    await grace15.click()
    await expect(page.getByText('Grace 15 min · most urgent first')).toBeVisible()
  })
})
