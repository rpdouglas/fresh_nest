import { defineConfig, devices } from '@playwright/test'

// The site in dev mode (for its "Dev sign-in"), with the real API handler behind it
// and a pretend Camelo behind that. See server.ts and fake-camelo.ts.
const API = 'http://localhost:8787'
const SITE = 'http://localhost:5173'

export default defineConfig({
  testDir: 'tests',
  // 4 workers, each with its own isolated in-memory stores on the test server (decision 0039)
  workers: 4,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: SITE, trace: 'retain-on-failure', timezoneId: 'America/Toronto' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'npm run api', url: `${API}/api/health`, reuseExistingServer: !process.env.CI, timeout: 60_000 },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      cwd: '..',
      url: SITE,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      // a made-up client id, so the site shows what needs Google (its sign-in button, the Google Doc export);
      // Google itself is stood in for in tests/helpers.ts, and nothing is sent to it
      // and the waits Client patterns makes for Camelo's sake, cut to a twentieth so the tests do not sit through them
      env: { VITE_GOOGLE_CLIENT_ID: 'e2e-not-a-real-client-id', VITE_WAIT_SCALE: '0.05' },
    },
  ],
})
