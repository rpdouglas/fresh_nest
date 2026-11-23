import { type Page, asked, expect, open, test } from './helpers.ts'

// Changes to timesheets other than approving one (that is in changes.spec.ts). Each makes exactly one change
// in the pretend Camelo, shows in the list, and is written to the change log under Payroll hours.

/** The lines of the change log for the period, opened from the foot of Payroll hours: who, what, whose, and how it went. */
async function changeLog(page: Page, period: string) {
  await open(page, 'payroll', { period })
  await page.getByRole('button', { name: 'Changes made from this site in this pay period' }).click()
  return page.getByRole('main').getByRole('listitem')
}

test('a timesheet is rejected once, stays in the list as rejected, and is in the change log', async ({ page, world }) => {
  const day = world.waitingDays.at(-1)!
  await open(page, 'review', { period: day })
  await page.getByRole('button', { name: 'Deny' }).first().click()
  const box = page.getByRole('dialog', { name: 'Confirm change' })
  await expect(box).toContainText('Reject this entry in Camelo?')
  await box.getByRole('button', { name: 'Yes, reject' }).click()
  await expect(box).toContainText('1 of 1 rejected in Camelo')
  await box.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('row', { name: /rejected$/ })).toHaveCount(1)
  expect(await asked('rejectTimesheet')).toBe(1)

  const log = await changeLog(page, day)
  await expect(log).toHaveCount(1)
  await expect(log).toContainText('dev@example.com · reject · Casey Lane')
  await expect(log).toContainText('submitted → rejected')
})

test('the times of a timesheet are edited once, the row shows the new times, and the change log has it', async ({ page, world }) => {
  const day = world.waitingDays.at(-1)!
  await open(page, 'review', { period: day })
  await page.getByRole('button', { name: 'Edit times' }).first().click()
  const form = page.getByRole('form', { name: /^Edit times: Casey Lane, Cedar Lodge/ })
  await form.getByRole('textbox', { name: 'End' }).fill('11:15')
  await expect(form).toContainText('3h 15m')
  await form.getByRole('button', { name: 'Review' }).click()
  const box = page.getByRole('dialog', { name: 'Confirm change' })
  await box.getByRole('button').first().click()
  await box.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('row', { name: /Casey Lane, Cedar Lodge.*8:00 AM – 11:15 AM 3\.25/ }).first()).toBeVisible()
  expect(await asked('updateTimesheet')).toBe(1)

  const log = await changeLog(page, day)
  await expect(log).toHaveCount(1)
  await expect(log).toContainText('dev@example.com · update · Casey Lane')
})

test('an entry is added for an employee as a draft at a client and job site, once, and waits for approval', async ({ page, world }) => {
  const day = world.waitingDays.at(-1)!
  await open(page, 'review', { period: day })
  const before = await page.getByRole('button', { name: 'Approve', exact: true }).count()
  await page.getByRole('button', { name: 'Add a timesheet for any employee' }).click()
  const form = page.getByRole('form', { name: /^Add a timesheet for any employee/ })
  await form.getByRole('combobox', { name: 'Employee' }).selectOption({ label: 'Finley Cole' })
  await form.getByRole('textbox', { name: 'Start' }).fill('14:00')
  await form.getByRole('textbox', { name: 'End' }).fill('15:30')
  // a site chosen first brings its client; the sites then narrow to that client's own
  const site = form.getByRole('combobox', { name: 'Job site' })
  await site.selectOption({ label: 'Birch House' })
  await expect(form.getByRole('combobox', { name: 'Client' })).toHaveValue('c-birch')
  await expect(site.getByRole('option')).toHaveText(['None', 'Birch House'])
  await form.getByRole('button', { name: 'Review' }).click()
  const box = page.getByRole('dialog', { name: 'Confirm change' })
  await expect(box).toContainText('At Birch House, Birch House')
  await box.getByRole('button').first().click()
  await box.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(before + 1)
  await expect(page.getByRole('row', { name: /Finley Cole.*Birch House.*draft$/ })).toHaveCount(1)
  expect(await asked('draftTimesheet')).toBe(1)

  const log = await changeLog(page, day)
  await expect(log).toHaveCount(1)
  await expect(log).toContainText('dev@example.com · create · Finley Cole')
  await expect(log).toContainText('as draft at Birch House, Birch House')
})

test('a note is saved on a timesheet in Camelo once, with who wrote it, and is shown', async ({ page, world }) => {
  const day = world.waitingDays.at(-1)!
  await open(page, 'review', { period: day })
  await page.getByRole('button', { name: 'Note' }).first().click()
  const form = page.getByRole('form', { name: 'Add a note' })
  await form.getByRole('textbox').fill('Left early, client asked')
  await form.getByRole('button', { name: 'Save note' }).click()
  await expect(form).toHaveCount(0)
  await expect(page.getByText('Left early, client asked')).toBeVisible()
  // Camelo records the reports account as the author, so the person's address is written into the note
  await expect(page.getByText('dev@example.com, via the reports site')).toBeVisible()
  expect(await asked('createComment')).toBe(1)

  const log = await changeLog(page, day)
  await expect(log).toHaveCount(1)
  await expect(log).toContainText('dev@example.com · comment · Casey Lane')
})

test('incomplete checklist (<100%) displays a warning tag on unapproved timesheets before approval', async ({ page, world }) => {
  const day = world.waitingDays.at(-1)!
  await open(page, 'review', { period: day })
  const warnings = page.getByTestId('checklist-warning')
  await expect(warnings.first()).toBeVisible()
  await expect(warnings.first()).toContainText('Turnover Checklist')
  await expect(warnings.first()).toContainText('40%')

  // Cedar Lodge (no checklist assigned) has no warning badge
  const cedarRow = page.getByRole('row', { name: /Cedar Lodge/ }).first()
  await expect(cedarRow.getByTestId('checklist-warning')).toHaveCount(0)
})
