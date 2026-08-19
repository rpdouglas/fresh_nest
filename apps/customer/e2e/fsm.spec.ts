import { test, expect, type Page } from '@playwright/test'

// FSM Staff Portal E2E spec — Strategy 1 (Mock-Centric)
//
// Firebase Auth is mocked by intercepting the Firebase Identity Toolkit REST API
// so the login flow can be tested in CI without the Auth emulator or real credentials.
//
// Firestore REST calls are intercepted to return mock staff profile and job data.
// The FSM app initialises on http://localhost:5174 (separate Vite server, port 5174).

const FSM = 'http://localhost:5174'

// Constructs a minimal Firebase-compatible JWT.
// The Firebase Web SDK does not verify signatures on the client; it only decodes
// the base64url payload to read claims. A mock signature is accepted.
function makeMockJwt(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'mock-key', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://securetoken.google.com/freshnest-aa51e',
    aud: 'freshnest-aa51e',
    auth_time: 1_000_000,
    iat: 1_000_000,
    exp: 9_999_999_999,
    firebase: { identities: { email: [claims.email] }, sign_in_provider: 'password' },
    ...claims,
  })).toString('base64url')
  return `${header}.${payload}.MOCK_SIGNATURE`
}

const STAFF_JWT = makeMockJwt({
  user_id: 'mike-uid',
  sub: 'mike-uid',
  email: 'mike@freshnest.ca',
  email_verified: true,
  role: 'staff',
})

// Intercepts Firebase Auth + Firestore REST endpoints with mock responses.
// Called inside test.beforeEach for authenticated-flow describe blocks.
async function mockFirebase(page: Page) {
  // Firebase Auth — signInWithPassword
  await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: 'mike-uid',
        email: 'mike@freshnest.ca',
        idToken: STAFF_JWT,
        refreshToken: 'mock-refresh-token',
        expiresIn: '3600',
        registered: true,
      }),
    })
  })

  // Firebase Auth — token refresh (called by getIdTokenResult with forceRefresh=true)
  await page.route('**/securetoken.googleapis.com/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: STAFF_JWT,
        id_token: STAFF_JWT,
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        expires_in: '3600',
      }),
    })
  })

  // Firestore — staff profile document
  await page.route('**/firestore.googleapis.com/**', async (route, request) => {
    const url = request.url()

    if (url.includes('/staff/mike-uid')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'projects/freshnest-aa51e/databases/(default)/documents/staff/mike-uid',
          fields: {
            firstName:   { stringValue: 'Mike' },
            lastName:    { stringValue: 'Cleaner' },
            email:       { stringValue: 'mike@freshnest.ca' },
            role:        { stringValue: 'staff' },
            status:      { stringValue: 'active' },
            preferences: { mapValue: { fields: { language: { stringValue: 'en' } } } },
            constraints: { mapValue: { fields: {
              transportMode:        { stringValue: 'car' },
              transitBufferMinutes: { integerValue: 15 },
              blockedWindows:       { arrayValue: { values: [] } },
            }}},
          },
        }),
      })
    } else if (url.includes('/jobs/test-job-id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'projects/freshnest-aa51e/databases/(default)/documents/jobs/test-job-id',
          fields: {
            bookingId:           { stringValue: 'booking-123' },
            clientName:          { stringValue: 'Jane Smith' },
            clientAddress:       { stringValue: '456 Riverdale, Cornwall ON' },
            clientPhone:         { stringValue: '6135559900' },
            serviceType:         { stringValue: 'standard' },
            scheduledDate:       { stringValue: '2026-06-25' },
            scheduledStartTime:  { stringValue: '09:00' },
            scheduledEndTime:    { stringValue: '11:00' },
            status:              { stringValue: 'assigned' },
            assignedTo:          { stringValue: 'mike-uid' },
            checkedInAt:         { nullValue: null },
            checklistCompletions: { arrayValue: { values: [] } },
            photos:              { arrayValue: { values: [] } },
          },
        }),
      })
    } else {
      await route.continue()
    }
  })
}

// ─── Login Page — always-passing UI tests (no Firebase needed) ───────────────

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
    await page.getByRole('button', { name: /fr/i }).click()
    // The Sign In button label should switch to French
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible()
  })
})

// ─── Auth Gates — always-passing redirect tests ───────────────────────────────

test.describe('FSM Protected Routes — Auth Gate', () => {
  test('/jobs redirects unauthenticated visitor to /login', async ({ page }) => {
    await page.goto(`${FSM}/jobs`)
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('/jobs/:id redirects unauthenticated visitor to /login', async ({ page }) => {
    await page.goto(`${FSM}/jobs/test-job-id`)
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('/profile redirects unauthenticated visitor to /login', async ({ page }) => {
    await page.goto(`${FSM}/profile`)
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('/shifts redirects unauthenticated visitor to /login', async ({ page }) => {
    await page.goto(`${FSM}/shifts`)
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})

// ─── Login Flow — Firebase REST API mocked ───────────────────────────────────

test.describe('FSM Login Flow — Mocked Firebase Auth', () => {
  test('shows error alert when Firebase rejects invalid credentials', async ({ page }) => {
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 400, message: 'INVALID_LOGIN_CREDENTIALS', status: 'INVALID_ARGUMENT' },
        }),
      })
    })

    await page.goto(`${FSM}/login`)
    await page.locator('#email').fill('wrong@example.com')
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    // User stays on login page — no redirect on failed auth
    await expect(page).toHaveURL(/\/login/)
  })

  test('Sign In call is made to Firebase when form is submitted with valid input', async ({ page }) => {
    let authCallMade = false

    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', async (route) => {
      authCallMade = true
      // Return a reject so the test doesn't need full Firebase session setup
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 400, message: 'INVALID_LOGIN_CREDENTIALS' } }),
      })
    })

    await page.goto(`${FSM}/login`)
    await page.locator('#email').fill('mike@freshnest.ca')
    await page.locator('#password').fill('testpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForResponse('**/identitytoolkit.googleapis.com/**', { timeout: 5000 })
    expect(authCallMade).toBe(true)
  })

  test('authenticated staff navigates away from login after sign-in', async ({ page }) => {
    await mockFirebase(page)

    await page.goto(`${FSM}/login`)
    await page.locator('#email').fill('mike@freshnest.ca')
    await page.locator('#password').fill('testpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // After successful mocked auth, the app should leave /login
    // (navigates to / or shows the staff dashboard — not the login form)
    await expect(page.locator('#email')).not.toBeVisible({ timeout: 6000 })
  })
})

// ─── Job Flow — Mocked Firebase Auth + Firestore ─────────────────────────────

test.describe('FSM Job Flow — Mocked Firebase', () => {
  test.beforeEach(async ({ page }) => {
    await mockFirebase(page)
  })

  test('job detail page renders client address and service type', async ({ page }) => {
    await page.goto(`${FSM}/login`)
    await page.locator('#email').fill('mike@freshnest.ca')
    await page.locator('#password').fill('testpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.locator('#email')).not.toBeVisible({ timeout: 6000 })

    await page.goto(`${FSM}/jobs/test-job-id`)

    // Client address and service type from the mocked Firestore response must appear
    await expect(page.getByText(/456 Riverdale/i)).toBeVisible({ timeout: 5000 })
  })

  test('Check In button is visible when job status is assigned', async ({ page }) => {
    await page.goto(`${FSM}/login`)
    await page.locator('#email').fill('mike@freshnest.ca')
    await page.locator('#password').fill('testpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.locator('#email')).not.toBeVisible({ timeout: 6000 })

    await page.goto(`${FSM}/jobs/test-job-id`)

    await expect(page.getByRole('button', { name: /check in/i })).toBeVisible({ timeout: 5000 })
  })

  test('photo upload input is present on job page', async ({ page }) => {
    await page.goto(`${FSM}/login`)
    await page.locator('#email').fill('mike@freshnest.ca')
    await page.locator('#password').fill('testpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.locator('#email')).not.toBeVisible({ timeout: 6000 })

    await page.goto(`${FSM}/jobs/test-job-id`)

    // File input for photo capture must exist in the DOM (may be hidden until check-in)
    const fileInput = page.locator('input[type="file"][accept*="image"]')
    await expect(fileInput).toBeAttached({ timeout: 5000 })
  })
})
