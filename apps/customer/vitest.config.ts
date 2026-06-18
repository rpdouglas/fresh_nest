import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: [...configDefaults.exclude, 'e2e/**', 'test/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 60,
        functions: 40,
        branches: 55,
        statements: 40,
      },
      exclude: [
        'src/i18n/**',
        'src/lib/data/**',
        'src/types/**',
        'src/main.tsx',
        'src/App.tsx',
        'dist/**',
      ],
    },
  },
})
