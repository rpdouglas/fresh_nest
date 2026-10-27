// Admin visual harness (P3-E33). Run with `npm run test:admin-visual` from apps/customer:
// it starts the Firestore + Auth emulators, seeds them, serves the real admin UI on :5180 and runs
// these tests. Desktop (1280px) screenshots guard "desktop views unchanged"; the phone project
// checks the P3-E33 acceptance criteria. Local only for now (needs Java for the emulators).
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: './test-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0 } },
  use: {
    baseURL: 'http://localhost:5180',
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npx vite --config e2e-admin/vite.config.ts',
    cwd: '..',
    url: 'http://localhost:5180',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
