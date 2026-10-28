// Playwright persona flows (F5). Run with `npm run test:e2e` from apps/customer: it starts the
// Firestore, Auth and Storage emulators, seeds them (e2e/harness/seed.cjs) and serves both apps
// with Firebase swapped for the emulators — the customer site on :5190, the FSM staff app on :5191.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:5190',
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx vite --config e2e/harness/vite.customer.config.ts',
      url: 'http://localhost:5190',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npx vite --config e2e/harness/vite.fsm.config.ts',
      url: 'http://localhost:5191',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
