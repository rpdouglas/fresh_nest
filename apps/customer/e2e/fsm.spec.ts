import { test, expect, type Page } from '@playwright/test'
import { getJob, resetJobToAssigned } from './harness/emulator'

// FSM staff app persona flows (F5). Runs against the Auth, Firestore and Storage emulators with
// the real security rules; accounts and the job come from e2e/harness/seed.cjs.
// P9 Mike: staff sign-in and job screens · P11 Brenda: FR UI and photo proof · P3: 48px targets.

const FSM = 'http://localhost:5191'
const STAFF = { email: 'mike@freshnest.test', password: 'password123' }
const CUSTOMER = { email: 'diane@example.test', password: 'password123' }
const JOB = `${FSM}/jobs/test-job-id`

async function signIn(page: Page, { email, password }: { email: string; password: string }) {
  await page.goto(`${FSM}/login`)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
}

async function signInAsStaff(page: Page) {
  await signIn(page, STAFF)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
}

// ─── Login page ───────────────────────────────────────────────────────────────

test.describe('FSM Login Page — UI', () => {
  test('renders email, password fields, Sign In and Send Magic Link buttons', async ({ page }) => {
    await page.goto(`${FSM}/login`)
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible()
  })

  test('Sign In button is accessible and meets 48px touch target', async ({ page }) => {
    await page.goto(`${FSM}/login`)
    const btn = page.getByRole('button', { name: /sign in/i })
    const box = await btn.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(48)
  })

  test('language toggle switches login page to French', async ({ page }) => {
    await page.goto(`${FSM}/login`)
    await page.getByRole('button', { name: 'FR', exact: true }).click()
    await expect(page.getByRole('button', { name: /se connecter avec mot de passe/i })).toBeVisible()
  })
})

// ─── Auth gate ────────────────────────────────────────────────────────────────

test.describe('FSM Protected Routes — Auth Gate', () => {
  for (const path of ['/jobs', '/jobs/test-job-id', '/profile', '/shifts']) {
    test(`${path} redirects unauthenticated visitor to /login`, async ({ page }) => {
      await page.goto(`${FSM}${path}`)
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

// ─── Sign-in ──────────────────────────────────────────────────────────────────

test.describe('FSM Login Flow', () => {
  test('shows an error when the password is wrong', async ({ page }) => {
    await signIn(page, { ...STAFF, password: 'wrong-password' })
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('staff member signs in with email and password and leaves the login page', async ({ page }) => {
    await signInAsStaff(page)
    await expect(page.locator('#email')).toHaveCount(0)
  })

  // HOTFIX-11: the "no staff profile" message must stay on screen after the sign-out.
  test('a customer account is refused with a plain-language message', async ({ page }) => {
    // The seeded account is brand new, so the app polls up to 20 s for a staff role first (HOTFIX-10).
    test.setTimeout(60_000)
    await signIn(page, CUSTOMER)
    await expect(page.getByRole('alert')).toContainText(/not registered/i, { timeout: 30_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Job screens ──────────────────────────────────────────────────────────────

test.describe('FSM Job Flow', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsStaff(page)
  })

  test('job detail page renders client address and service type', async ({ page }) => {
    await page.goto(JOB)
    await expect(page.getByText(/456 Riverdale/i)).toBeVisible()
  })

  test('Check In button is visible when job status is assigned', async ({ page }) => {
    await page.goto(JOB)
    await expect(page.getByRole('button', { name: /check in/i })).toBeVisible()
  })

  test('photo upload input is present on job page', async ({ page }) => {
    await page.goto(JOB)
    await expect(page.getByText(/456 Riverdale/i)).toBeVisible()
    // The capture input is in the DOM from the start (hidden until a task asks for a photo).
    await expect(page.locator('input[type="file"][accept*="image"]')).toBeAttached()
  })

  // HOTFIX-06 regression (P11 Brenda's photo proof): check in, photograph a task that requires
  // one, and the photo reaches Storage under the real storage.rules and is saved on the job.
  test('checked-in staff member uploads a task photo to the job', async ({ page, context, request }) => {
    await context.grantPermissions(['geolocation'], { origin: FSM })
    await context.setGeolocation({ latitude: 45.0213, longitude: -74.7303 }) // Cornwall ON
    await resetJobToAssigned(request, 'photo-job-id')
    await page.goto(`${FSM}/jobs/photo-job-id`)

    await page.getByRole('button', { name: /check in/i }).click()
    await expect(page.getByText(/cleaning tasks/i)).toBeVisible()

    await page.getByRole('button', { name: /kitchen counters/i }).click()
    const chooser = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /take photo/i }).click()
    await (await chooser).setFiles({ name: 'counters.jpg', mimeType: 'image/jpeg', buffer: TINY_JPEG })

    await expect.poll(async () => {
      const photos = (await getJob(request, 'photo-job-id')).photos.arrayValue?.values ?? []
      return photos.map((p) => p.mapValue?.fields?.url?.stringValue ?? '')
    }, { timeout: 20_000 }).toEqual([expect.stringContaining('jobs%2Fphoto-job-id%2Fphotos%2Fmike-uid%2F')])

    const job = await getJob(request, 'photo-job-id')
    expect(job.status.stringValue).toBe('in_progress')
    expect(job.checkedInGeo.mapValue?.fields?.lat).toBeDefined()
  })
})

// Smallest valid JPEG (1×1 px) — enough for the upload path and the image/* content-type rule.
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP////////////////////////////////////////////////////////////////' +
  '//////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
)
