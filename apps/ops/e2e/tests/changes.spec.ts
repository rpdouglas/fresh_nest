import { camelo, expect, open, test } from './helpers.ts'

test("an approved timesheet leaves the list at once and stays gone while Camelo's list lags", async ({ page, world }) => {
  const day = world.waitingDays.at(-1)!
  await open(page, 'review', { period: day })
  const waiting = page.getByRole('button', { name: 'Approve', exact: true })
  const before = await waiting.count()
  expect(before).toBeGreaterThan(1)

  // Camelo confirms the approval, but its list keeps the old state for the next two reads
  await camelo.lagListFor(2)
  await waiting.first().click()
  const box = page.getByRole('dialog', { name: 'Confirm change' })
  await box.getByRole('button').first().click()
  await expect(box).toContainText('1 of 1 approved in Camelo')
  // gone before Done is chosen
  await expect(waiting).toHaveCount(before - 1)

  await box.getByRole('button', { name: 'Done' }).click()
  await expect(box).toHaveCount(0)
  // the reload after Done read a stale list; the row must not come back
  await expect.poll(async () => (await camelo.log()).filter((x) => x === 'timesheets').length).toBeGreaterThan(1)
  await expect(waiting).toHaveCount(before - 1)
  expect((await camelo.log()).filter((x) => x === 'approveTimesheets')).toHaveLength(1)

  // another report on the same period agrees without a fresh read being needed
  await open(page, 'payroll', { period: day })
  await expect(page.getByRole('heading', { level: 1, name: 'Payroll hours' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('an invoiced tick is kept', async ({ page, world }) => {
  // seven days that ended a week ago: all of it is approved, so it can be invoiced
  const from = new Date(Date.parse(`${world.today}T00:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10)
  await open(page, 'invoicing', { from })
  const tick = page.getByRole('checkbox', { name: /^Maple Court, .*: invoiced$/ }).first()
  await expect(tick).not.toBeChecked()
  // the box shows the tick once the server has saved it, so click and wait:
  // check() expects the state to change in the same instant and fails when the save takes a moment
  await tick.click()
  await expect(tick).toBeChecked()
  await page.reload()
  await expect(page.getByRole('checkbox', { name: /^Maple Court, .*: invoiced$/ }).first()).toBeChecked()
})

test("a client's own price bills that client from its start date, and no one else", async ({ page, world }) => {
  const daysAgo = (n: number) => new Date(Date.parse(`${world.today}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10)
  await open(page, 'pricing')
  await expect(page.getByRole('heading', { level: 1, name: 'Client prices' })).toBeVisible()
  const setPrice = async (client: string, dollars: string, from: string) => {
    await page.getByRole('button', { name: `Change price for ${client}` }).click()
    const form = page.getByRole('form', { name: `Price for ${client}` })
    await form.getByLabel('Billed').selectOption('flat')
    await form.getByLabel('Dollars a visit').fill(dollars)
    await form.getByLabel('Starting').fill(from)
    await form.getByRole('button', { name: 'Save price' }).click()
    return form
  }

  // a start date in the past is asked about before it is saved
  const form = await setPrice('Maple Court', '180', daysAgo(30))
  await expect(form.getByRole('alert')).toContainText('is in the past')
  await form.getByRole('button', { name: 'Yes, change those visits' }).click()
  await expect(form).toHaveCount(0)
  const maple = page.getByRole('listitem').filter({ hasText: 'Maple Court' })
  await expect(maple.first()).toContainText('$180 a visit')

  // one that starts tomorrow is listed as coming, and bills nothing yet
  await expect(await setPrice('Birch House', '500', daysAgo(-1))).toHaveCount(0)
  await expect(page.getByRole('listitem').filter({ hasText: 'Birch House' }).first()).toContainText('$75 an hour (default)')

  await open(page, 'invoicing', { from: daysAgo(14) })
  const priced = page.getByRole('listitem').filter({ hasText: '$180 a visit' })
  expect(await priced.count()).toBeGreaterThan(0)
  await expect(priced.filter({ hasNotText: 'Maple Court' })).toHaveCount(0)
  await expect(page.getByText('$500 a visit')).toHaveCount(0)

  await open(page, 'clienthours', { from: daysAgo(14) })
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText('Maple Court').filter({ visible: true }).first()).toBeVisible()
})

test('Invoicing downloads a plain CSV and a QuickBooks file of what is still to invoice', async ({ page, world }) => {
  const { readFile } = await import('node:fs/promises')
  const from = new Date(Date.parse(`${world.today}T00:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10)
  await open(page, 'invoicing', { from })
  // one row is already invoiced, so it must be in neither file
  const tick = page.getByRole('checkbox', { name: /^Maple Court, .*: invoiced$/ }).first()
  await tick.click()
  await expect(tick).toBeChecked()
  const open_ = await page.getByRole('checkbox', { name: /: invoiced$/, checked: false, disabled: false }).count()
  expect(open_).toBeGreaterThan(1)
  const lines = async (click: () => Promise<void>) => {
    const [file] = await Promise.all([page.waitForEvent('download'), click()])
    return { name: file.suggestedFilename(), rows: (await readFile(await file.path(), 'utf8')).trimEnd().split('\r\n') }
  }

  const plain = await lines(() => page.getByRole('button', { name: 'Download CSV' }).click())
  expect(plain.name).toBe(`invoicing-${from}.csv`)
  expect(plain.rows[0]).toBe('"Customer","Date","Site","Hours","Rate","Amount"')
  expect(plain.rows).toHaveLength(open_ + 1)

  await page.getByRole('button', { name: 'Download for QuickBooks' }).click()
  const form = page.getByRole('form', { name: 'QuickBooks file' })
  await form.getByLabel('First invoice number').fill('2001')
  await form.getByLabel('Tax code').fill('HST ON')
  const qbo = await lines(() => form.getByRole('button', { name: `Download ${open_} invoices` }).click())
  expect(qbo.name).toBe(`quickbooks-invoices-${from}.csv`)
  expect(qbo.rows[0]).toContain('"InvoiceNo","Customer","InvoiceDate","DueDate"')
  // one invoice per row still to invoice, numbered up from the first
  const numbers = [...new Set(qbo.rows.slice(1).map((r) => r.split('","')[0].slice(1)))]
  expect(numbers).toEqual(Array.from({ length: open_ }, (_, n) => String(2001 + n)))
  expect(qbo.rows.slice(1).every((r) => r.endsWith('"HST ON"'))).toBe(true)

  // the next file is offered the number after the last one used
  await page.getByRole('button', { name: 'Download for QuickBooks' }).click()
  await expect(form.getByLabel('First invoice number')).toHaveValue(String(2001 + open_))
})

test('after a download, one click marks exactly the exported rows as invoiced, and "Not now" marks none', async ({ page, world }) => {
  const from = new Date(Date.parse(`${world.today}T00:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10)
  await open(page, 'invoicing', { from })
  const unticked = page.getByRole('checkbox', { name: /: invoiced$/, checked: false, disabled: false })
  const before = await unticked.count()
  expect(before).toBeGreaterThan(1)
  const ask = page.getByRole('dialog', { name: 'Mark exported rows as invoiced?' })
  const exportCsv = () => Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download CSV' }).click()])

  await exportCsv()
  await expect(ask).toContainText(`Mark the ${before} exported rows as invoiced?`)
  await ask.getByRole('button', { name: 'Not now' }).click()
  await expect(ask).toHaveCount(0)
  await expect(unticked).toHaveCount(before)

  await exportCsv()
  await ask.getByRole('button', { name: `Mark ${before} invoiced` }).click()
  await expect(unticked).toHaveCount(0)
  // nothing is left to export, and the ticks were saved
  await expect(page.getByRole('button', { name: 'Download CSV' })).toBeDisabled()
  await page.reload()
  await expect(page.getByRole('checkbox', { name: /: invoiced$/, checked: true }).first()).toBeVisible()
  await expect(unticked).toHaveCount(0)
})
