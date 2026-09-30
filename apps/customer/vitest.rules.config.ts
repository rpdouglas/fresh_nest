import { defineConfig } from 'vitest/config'

// Firestore security rules tests — run against the emulator via `npm run test:rules`.
// Kept separate because vitest.config.ts excludes test/** (jsdom unit tests only).
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/firestore-rules.test.ts'],
    testTimeout: 20000,
  },
})
